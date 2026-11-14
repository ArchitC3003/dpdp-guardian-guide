import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractReadable, splitForSpeech } from "./extractReadable";
import { SpeechController, rankVoices } from "./SpeechController";
import { choicesFor, saveConsent } from "@/lib/consent";

function dom(html: string): Element {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("extractReadable", () => {
  it("reads title, headings, paragraphs and lists in page order", () => {
    const blocks = extractReadable(dom(`
      <h1>Consent under DPDP</h1>
      <p>Lead paragraph.</p>
      <div><h2>Notice</h2><p>Give <a href="https://example.com/very/long">a clear notice</a> first.</p>
        <ul><li>Purpose</li><li>Rights</li></ul>
        <ol><li>Collect</li><li><p>Record</p></li></ol>
      </div>`));
    expect(blocks.map((b) => [b.kind, b.text])).toEqual([
      ["heading", "Consent under DPDP"], ["text", "Lead paragraph."], ["heading", "Notice"],
      ["text", "Give a clear notice first."], ["text", "Purpose"], ["text", "Rights"], ["text", "1. Collect"], ["text", "2. Record"],
    ]);
  });

  it("leaves out navigation, buttons, images, code blocks, hidden and marked parts", () => {
    const blocks = extractReadable(dom(`
      <nav><a href="/learn">Learn</a> / Article</nav>
      <p data-listen-skip>Author · 3 min read</p>
      <button>Share</button><img alt="Diagram" src="x.png"><pre>const a = 1;</pre>
      <p hidden>Hidden</p><p aria-hidden="true">Decoration</p>
      <section data-listen-skip><h2>Related</h2><p>Card</p></section>
      <p>Body <button>copy</button>text.</p>`));
    expect(blocks.map((b) => b.text)).toEqual(["Body text."]);
  });

  it("reads tables row by row, and questions with their answers even when collapsed", () => {
    const blocks = extractReadable(dom(`
      <table><thead><tr><th>Duty</th><th>Owner</th></tr></thead><tbody><tr><td>Notice</td><td>DPO</td></tr></tbody></table>
      <details><summary>Who is a fiduciary?</summary><p>The one deciding purpose.</p></details>`));
    expect(blocks.map((b) => b.text)).toEqual(["Duty, Owner", "Notice, DPO", "Who is a fiduciary?", "The one deciding purpose."]);
  });

  it("does not read out table markup that was left as plain text", () => {
    const blocks = extractReadable(dom(`<p>| Duty | Owner | |---|---| | Notice | DPO |</p><p>---</p>`));
    expect(blocks.map((b) => b.text)).toEqual(["Duty, Owner, Notice, DPO"]);
  });

  it("keeps a list item's own words ahead of its nested list", () => {
    const blocks = extractReadable(dom(`<ul><li>Parent<ul><li>Child</li></ul></li></ul>`));
    expect(blocks.map((b) => b.text)).toEqual(["Parent", "Child"]);
  });
});

describe("splitForSpeech", () => {
  it("keeps short text whole and never splits inside a number or address", () => {
    expect(splitForSpeech("Rule 8.1 applies. See privcybhub.com today.")).toEqual(["Rule 8.1 applies. See privcybhub.com today."]);
  });
  it("splits long text at sentence ends without losing words", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const parts = splitForSpeech(text, 100);
    expect(parts.length).toBeGreaterThan(5);
    expect(parts.every((p) => p.length <= 100 && /\.$/.test(p))).toBe(true);
    expect(parts.join(" ")).toBe(text);
  });
  it("breaks a single over-long sentence", () => {
    const parts = splitForSpeech("word ".repeat(100).trim(), 60);
    expect(parts.every((p) => p.length <= 60)).toBe(true);
    expect(parts.join(" ").split(" ").length).toBe(100);
  });
});

describe("rankVoices", () => {
  it("puts English (India) first, natural voices ahead, and drops other languages when English exists", () => {
    const ranked = rankVoices([
      { name: "Hindi", lang: "hi-IN" }, { name: "Samantha", lang: "en-US" }, { name: "Microsoft Aria Online (Natural)", lang: "en-US" },
      { name: "Rishi", lang: "en-IN" }, { name: "Microsoft Neerja Online (Natural)", lang: "en-IN" },
    ]);
    expect(ranked.map((v) => v.name)).toEqual(["Microsoft Neerja Online (Natural)", "Rishi", "Microsoft Aria Online (Natural)", "Samantha"]);
  });
  it("offers every voice when the device has no English one", () => {
    expect(rankVoices([{ name: "Hindi", lang: "hi-IN" }])).toHaveLength(1);
  });
});

/** A stand-in speech engine: records what is spoken and lets a test finish or fail the current piece. */
function fakeEngine(voices: any[] = [{ voiceURI: "in", name: "Rishi", lang: "en-IN" }, { voiceURI: "us", name: "Samantha", lang: "en-US" }]) {
  const spoken: any[] = [];
  let live: any[] = [];
  class Utterance { text: string; rate = 1; lang = ""; voice: any = null; onend: any = null; onerror: any = null; constructor(t: string) { this.text = t; } }
  const synth = {
    speak: vi.fn((u: any) => { spoken.push(u); live.push(u); }),
    cancel: vi.fn(() => { const was = live; live = []; was.forEach((u) => u.onerror?.({ error: "interrupted" })); }),
    getVoices: () => voices,
    get speaking() { return live.length > 0; },
    pending: false,
  };
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  return {
    env: { synth: synth as any, Utterance: Utterance as any, storage }, spoken, synth, store,
    queued: () => live.length,
    finish: () => { const u = live.shift(); u.onend?.({}); },
    error: (code: string) => { const u = live.shift(); u.onerror?.({ error: code }); },
  };
}
const blocks = (...texts: string[]) => texts.map((text) => ({ kind: "text" as const, text }));

describe("SpeechController", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports when the browser cannot speak", () => {
    const c = new SpeechController({ synth: null, Utterance: null });
    expect(c.getState().supported).toBe(false);
    c.load(blocks("One")); c.play();
    expect(c.getState().status).toBe("idle");
    c.destroy();
  });

  it("reads blocks one after another and returns to the start at the end", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two.", "Three."));
    c.play();
    expect(e.spoken.map((u) => u.text)).toEqual(["One."]);
    expect(e.spoken[0].voice.voiceURI).toBe("in");
    e.finish(); e.finish();
    expect(c.getState()).toMatchObject({ status: "playing", index: 2, total: 3 });
    e.finish();
    expect(c.getState()).toMatchObject({ status: "idle", index: 0 });
    expect(e.spoken.map((u) => u.text)).toEqual(["One.", "Two.", "Three."]);
    c.destroy();
  });

  it("never queues more than one piece, however often Play is pressed", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two."));
    c.play(); c.play(); c.play();
    expect(e.queued()).toBe(1);
    c.next(); c.prev(); c.next();
    expect(e.queued()).toBe(1);
    expect(c.getState().index).toBe(1);
    c.destroy();
  });

  it("pauses, then resumes from the sentence it stopped in", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    const long = Array.from({ length: 20 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    c.load(blocks(long, "Two."));
    c.play();
    e.finish();
    const second = e.spoken[1].text;
    c.pause();
    expect(c.getState().status).toBe("paused");
    expect(e.queued()).toBe(0);
    c.resume();
    expect(c.getState()).toMatchObject({ status: "playing", index: 0 });
    expect(e.spoken[e.spoken.length - 1].text).toBe(second);
    c.destroy();
  });

  it("stop silences playback and resets progress", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two."));
    c.play(); e.finish();
    c.stop();
    expect(e.queued()).toBe(0);
    expect(c.getState()).toMatchObject({ status: "idle", index: 0 });
    c.destroy();
  });

  it("next and previous stay within the article and work while paused", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two.", "Three."));
    c.prev();
    expect(c.getState().index).toBe(0);
    c.play(); c.pause(); c.next(); c.next(); c.next();
    expect(c.getState()).toMatchObject({ status: "paused", index: 2 });
    c.play();
    expect(e.spoken[e.spoken.length - 1].text).toBe("Three.");
    c.destroy();
  });

  it("does not remember speed or voice unless preference storage is allowed", () => {
    saveConsent(choicesFor(false), "reject_all");
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.setRate(1.5);
    expect(c.getState().rate).toBe(1.5);
    c.destroy();
    const again = new SpeechController(e.env);
    expect(again.getState().rate).toBe(1);
    again.destroy();
  });

  it("applies a new speed or voice to the current sentence and remembers it", () => {
    saveConsent(choicesFor(true), "accept_all");
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two."));
    c.play();
    c.setRate(1.5);
    expect(e.spoken[e.spoken.length - 1]).toMatchObject({ text: "One.", rate: 1.5 });
    c.setVoice("us");
    expect(e.spoken[e.spoken.length - 1].voice.voiceURI).toBe("us");
    expect(e.queued()).toBe(1);
    c.setRate(3);
    expect(c.getState().rate).toBe(1.5);
    c.destroy();
    const again = new SpeechController(e.env);
    expect(again.getState()).toMatchObject({ rate: 1.5, voiceURI: "us" });
    again.destroy();
  });

  it("picks up voices that arrive late", () => {
    const voices: any[] = [];
    const e = fakeEngine(voices);
    const c = new SpeechController(e.env);
    expect(c.getState().voices).toHaveLength(0);
    voices.push({ voiceURI: "us", name: "Samantha", lang: "en-US" }, { voiceURI: "in", name: "Rishi", lang: "en-IN" });
    vi.advanceTimersByTime(300);
    expect(c.getState().voiceURI).toBe("in");
    expect(c.getState().voices.map((v) => v.uri)).toEqual(["in", "us"]);
    c.destroy();
  });

  it("skips one failed passage, and pauses with a message if the next fails too", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One.", "Two.", "Three."));
    c.play();
    e.error("synthesis-failed");
    expect(c.getState()).toMatchObject({ status: "playing", index: 1, error: null });
    e.error("synthesis-failed");
    expect(c.getState().status).toBe("paused");
    expect(c.getState().error).toMatch(/stopped/i);
    expect(e.queued()).toBe(0);
    c.destroy();
  });

  it("loading another article stops the first, and destroy silences everything", () => {
    const e = fakeEngine();
    const c = new SpeechController(e.env);
    c.load(blocks("One."));
    c.play();
    c.load(blocks("Other.", "More."));
    expect(e.queued()).toBe(0);
    expect(c.getState()).toMatchObject({ status: "idle", index: 0, total: 2 });
    c.play();
    c.destroy();
    expect(e.queued()).toBe(0);
  });
});
