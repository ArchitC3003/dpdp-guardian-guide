import { hasConsent } from "@/lib/consent";
import { splitForSpeech, type SpeechBlock } from "./extractReadable";

export const SPEECH_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type SpeechStatus = "idle" | "playing" | "paused";
export type VoiceOption = { uri: string; name: string; lang: string };
export type SpeechState = {
  supported: boolean;
  status: SpeechStatus;
  /** Index of the block being read, or about to be read. */
  index: number;
  total: number;
  rate: number;
  voiceURI: string | null;
  voices: VoiceOption[];
  error: string | null;
};

type Synth = Pick<SpeechSynthesis, "speak" | "cancel" | "getVoices"> & Partial<Pick<SpeechSynthesis, "speaking" | "pending" | "addEventListener" | "removeEventListener">>;
type UtteranceCtor = new (text: string) => SpeechSynthesisUtterance;
type Store = Pick<Storage, "getItem" | "setItem">;
export type SpeechEnv = { synth?: Synth | null; Utterance?: UtteranceCtor | null; storage?: Store | null };

const RATE_KEY = "privcybhub.listen.rate";
const VOICE_KEY = "privcybhub.listen.voice";
const NATURAL = /natural|neural|online|enhanced|premium|google|siri/i;

/** Higher is better: English (India) first, then other English, natural-sounding voices ahead within each. */
export function voiceScore(v: { lang: string; name: string; default?: boolean }): number {
  const lang = (v.lang || "").replace("_", "-").toLowerCase();
  let s = 0;
  if (lang === "en-in") s += 100;
  else if (lang.startsWith("en")) s += 50;
  if (NATURAL.test(v.name)) s += 20;
  if (v.default) s += 2;
  return s;
}

/** English voices, best first; every voice if the device has no English one. */
export function rankVoices<T extends { lang: string; name: string; default?: boolean }>(voices: T[]): T[] {
  const english = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en"));
  return [...(english.length ? english : voices)].sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

function defaultEnv(): SpeechEnv {
  if (typeof window === "undefined") return {};
  let storage: Store | null = null;
  try { storage = window.localStorage; } catch { storage = null; }
  return { synth: window.speechSynthesis ?? null, Utterance: (window as { SpeechSynthesisUtterance?: UtteranceCtor }).SpeechSynthesisUtterance ?? null, storage };
}

/**
 * Reads a list of blocks aloud, one short piece at a time, through the browser's own speech engine.
 * Only one piece is ever queued. Every start cancels what came before, and a run number makes
 * events from cancelled pieces harmless, so playback cannot overlap or double up.
 * Pause is done by cancelling and resume by re-reading the current sentence, because the
 * engine's own pause is unreliable on Android and after long pauses on desktop Chrome.
 */
export class SpeechController {
  private synth: Synth | null;
  private Utterance: UtteranceCtor | null;
  private storage: Store | null;
  private blocks: SpeechBlock[] = [];
  private pieces: string[] = [];
  private piece = 0;
  private run = 0;
  private failures = 0;
  private rawVoices: SpeechSynthesisVoice[] = [];
  private listeners = new Set<() => void>();
  private poll: ReturnType<typeof setInterval> | null = null;
  private current: SpeechSynthesisUtterance | null = null;
  private state: SpeechState;

  constructor(env: SpeechEnv = defaultEnv()) {
    this.synth = env.synth ?? null;
    this.Utterance = env.Utterance ?? null;
    this.storage = env.storage ?? null;
    const savedRate = Number(this.read(RATE_KEY));
    this.state = {
      supported: !!this.synth && !!this.Utterance, status: "idle", index: 0, total: 0,
      rate: (SPEECH_RATES as readonly number[]).includes(savedRate) ? savedRate : 1,
      voiceURI: null, voices: [], error: null,
    };
    if (!this.state.supported) return;
    // Speech left running by an earlier page in this tab would otherwise talk over this one.
    try { this.synth!.cancel(); } catch { /* nothing was playing */ }
    this.refreshVoices();
    this.synth!.addEventListener?.("voiceschanged", this.refreshVoices);
    // Some browsers never announce their voices; ask a few times instead.
    let tries = 0;
    this.poll = setInterval(() => {
      this.refreshVoices();
      if (this.rawVoices.length || ++tries >= 20) this.stopPolling();
    }, 250);
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this.onPageHide);
      document.addEventListener("visibilitychange", this.onVisibility);
    }
  }

  getState = (): SpeechState => this.state;
  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };

  /** Replaces what will be read. Anything playing is stopped. */
  load(blocks: SpeechBlock[]) {
    this.halt();
    this.blocks = blocks;
    this.pieces = []; this.piece = 0; this.failures = 0;
    this.set({ status: "idle", index: 0, total: blocks.length, error: null });
  }

  /** Starts from the current block, or continues if paused. Does nothing while already playing. */
  play() {
    if (!this.state.supported || !this.blocks.length || this.state.status === "playing") return;
    if (this.state.status === "paused") return this.resume();
    this.startBlock(this.state.index >= this.blocks.length ? 0 : this.state.index);
  }

  pause() {
    if (this.state.status !== "playing") return;
    this.halt();
    this.set({ status: "paused" });
  }

  resume() {
    if (this.state.status !== "paused") return;
    this.set({ status: "playing", error: null });
    this.speakPiece();
  }

  /** Stops and returns to the start. */
  stop() {
    this.halt();
    this.pieces = []; this.piece = 0;
    this.set({ status: "idle", index: 0 });
  }

  next() { this.jump(this.state.index + 1); }
  prev() { this.jump(this.state.index - 1); }

  setRate(rate: number) {
    if (!(SPEECH_RATES as readonly number[]).includes(rate) || rate === this.state.rate) return;
    this.write(RATE_KEY, String(rate));
    this.set({ rate });
    this.restartPiece();
  }

  setVoice(uri: string) {
    if (uri === this.state.voiceURI || !this.rawVoices.some((v) => v.voiceURI === uri)) return;
    this.write(VOICE_KEY, uri);
    this.set({ voiceURI: uri });
    this.restartPiece();
  }

  /** Stops speech and releases every listener and timer. The controller cannot be used afterwards. */
  destroy() {
    this.halt();
    this.stopPolling();
    this.synth?.removeEventListener?.("voiceschanged", this.refreshVoices);
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.onPageHide);
      document.removeEventListener("visibilitychange", this.onVisibility);
    }
    this.listeners.clear();
    this.blocks = [];
  }

  private jump(to: number) {
    if (!this.blocks.length) return;
    const index = Math.max(0, Math.min(this.blocks.length - 1, to));
    if (this.state.status === "playing") return this.startBlock(index);
    // Paused or idle: move the position and wait for Play.
    this.pieces = []; this.piece = 0;
    this.set({ index });
  }

  private startBlock(index: number) {
    this.halt();
    this.pieces = splitForSpeech(this.blocks[index].text);
    this.piece = 0;
    this.set({ status: "playing", index, error: null });
    this.speakPiece();
  }

  private restartPiece() {
    if (this.state.status !== "playing") return;
    this.halt();
    this.speakPiece();
  }

  private speakPiece() {
    if (!this.synth || !this.Utterance) return;
    if (!this.pieces.length) { this.pieces = splitForSpeech(this.blocks[this.state.index]?.text || ""); this.piece = 0; }
    if (this.piece >= this.pieces.length) return this.advance();
    const run = ++this.run;
    const u = new this.Utterance(this.pieces[this.piece]);
    const voice = this.rawVoices.find((v) => v.voiceURI === this.state.voiceURI);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-IN";
    u.rate = this.state.rate;
    u.onend = () => {
      if (run !== this.run) return;
      this.failures = 0;
      this.piece += 1;
      this.speakPiece();
    };
    u.onerror = (e) => {
      if (run !== this.run) return;
      const code = (e as SpeechSynthesisErrorEvent).error;
      if (code === "interrupted" || code === "canceled") return;
      if (code === "not-allowed") return this.fail("Your browser blocked audio. Press Play to try again.");
      // One bad passage should not end the article: skip it once, give up if the next fails too.
      if (++this.failures >= 2) return this.fail("Speech stopped unexpectedly. Press Play to continue from here.");
      this.advance();
    };
    // Held so the browser cannot discard the utterance, and its events, mid-sentence.
    this.current = u;
    try { this.synth.speak(u); } catch { this.fail("Speech could not start on this device."); }
  }

  private advance() {
    const index = this.state.index + 1;
    if (index >= this.blocks.length) return this.stop();
    this.pieces = splitForSpeech(this.blocks[index].text);
    this.piece = 0;
    this.set({ index });
    this.speakPiece();
  }

  private fail(error: string) {
    this.halt();
    this.failures = 0;
    this.set({ status: "paused", error });
  }

  /** Silences the engine and retires the current run, so late events from it are ignored. */
  private halt() {
    this.run += 1;
    this.current = null;
    try { this.synth?.cancel(); } catch { /* nothing to cancel */ }
  }

  private refreshVoices = () => {
    if (!this.synth) return;
    let list: SpeechSynthesisVoice[] = [];
    try { list = this.synth.getVoices() || []; } catch { list = []; }
    if (!list.length) return;
    this.rawVoices = rankVoices(list);
    const voices = this.rawVoices.map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang }));
    const saved = this.read(VOICE_KEY);
    const keep = [this.state.voiceURI, saved].find((uri) => uri && voices.some((v) => v.uri === uri));
    const voiceURI = keep || voices[0].uri;
    const same = voiceURI === this.state.voiceURI && voices.length === this.state.voices.length && voices.every((v, i) => v.uri === this.state.voices[i].uri);
    if (!same) this.set({ voices, voiceURI });
  };

  private stopPolling() { if (this.poll) { clearInterval(this.poll); this.poll = null; } }

  private onPageHide = () => { if (this.state.status === "playing") this.pause(); else this.halt(); };

  /** Phones can silence speech while the tab is in the background without telling the page. */
  private onVisibility = () => {
    if (document.visibilityState !== "visible" || this.state.status !== "playing") return;
    if (this.synth && this.synth.speaking === false && this.synth.pending === false) {
      this.halt();
      this.set({ status: "paused" });
    }
  };

  private set(patch: Partial<SpeechState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private read(key: string): string | null { try { return this.storage?.getItem(key) ?? null; } catch { return null; } }
  private write(key: string, value: string) {
    if (!hasConsent("functional")) return; // preference storage needs the visitor's consent
    try { this.storage?.setItem(key, value); } catch { /* preference only */ }
  }
}
