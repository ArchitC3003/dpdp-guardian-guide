import { useState, type RefObject } from "react";
import { Headphones, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { useArticleSpeech } from "@/hooks/useArticleSpeech";
import { SPEECH_RATES } from "@/lib/speech/SpeechController";
import { LISTEN_SKIP } from "@/lib/speech/extractReadable";

const iconButton = "glow-hover inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground disabled:opacity-40 disabled:pointer-events-none";

/**
 * Reads the article inside `articleRef` aloud with the browser's own voices.
 * `contentKey` must change whenever the article or its published text changes.
 */
export function ListenPlayer({ articleRef, contentKey }: { articleRef: RefObject<Element>; contentKey: string }) {
  const { state, controller } = useArticleSpeech(articleRef, contentKey);
  const [open, setOpen] = useState(false);
  const skip = { [LISTEN_SKIP]: "" };

  if (!state || !controller) return null;
  if (!state.supported) return (
    <p {...skip} className="mt-6 text-sm text-muted-foreground">
      Listening is not available in this browser. Try a current version of Chrome, Edge or Safari.
    </p>
  );
  if (!state.total) return null;

  if (!open) return (
    <div {...skip} className="mt-6">
      <button type="button" onClick={() => { setOpen(true); controller.play(); }}
        className="glow-hover inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
        <Headphones className="h-4 w-4" aria-hidden="true" />Listen to this article
      </button>
    </div>
  );

  const playing = state.status === "playing";
  const position = Math.min(state.index + 1, state.total);
  return (
    <section {...skip} aria-label="Listen to this article" className="mt-6 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={iconButton} aria-label="Previous paragraph" disabled={state.index === 0} onClick={() => controller.prev()}><SkipBack className="h-4 w-4" /></button>
        <button type="button" onClick={() => (playing ? controller.pause() : controller.play())}
          aria-label={playing ? "Pause" : state.status === "paused" ? "Resume" : "Play"}
          className="glow-hover inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button type="button" className={iconButton} aria-label="Next paragraph" disabled={state.index >= state.total - 1} onClick={() => controller.next()}><SkipForward className="h-4 w-4" /></button>
        <button type="button" className={iconButton} aria-label="Stop" disabled={state.status === "idle"} onClick={() => controller.stop()}><Square className="h-4 w-4" /></button>
        <p className="ml-auto text-sm text-muted-foreground tabular-nums">
          {state.status === "idle" ? `${state.total} passages` : `Passage ${position} of ${state.total}`}{state.status === "paused" && " · paused"}
        </p>
      </div>
      <div className="mt-3 h-1 rounded-full bg-muted" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={state.total} aria-valuenow={state.status === "idle" ? 0 : position}>
        <div className="h-1 rounded-full bg-primary transition-[width] duration-300" style={{ width: `${state.status === "idle" ? 0 : (position / state.total) * 100}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <div role="group" aria-label="Playback speed" className="flex items-center gap-1">
          <span className="mr-1 text-muted-foreground">Speed</span>
          {SPEECH_RATES.map((r) => (
            <button key={r} type="button" aria-pressed={state.rate === r} onClick={() => controller.setRate(r)}
              className={`rounded-full border px-2.5 py-1 tabular-nums ${state.rate === r ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/60"}`}>
              {r}x
            </button>
          ))}
        </div>
        {state.voices.length > 0 && (
          <label className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">Voice</span>
            <select value={state.voiceURI ?? ""} onChange={(e) => controller.setVoice(e.target.value)}
              className="min-w-0 max-w-[16rem] rounded-md border border-border bg-background px-2 py-1.5 text-foreground">
              {state.voices.map((v) => <option key={v.uri} value={v.uri}>{v.name} ({v.lang})</option>)}
            </select>
          </label>
        )}
      </div>
      {state.error && <p role="status" className="mt-3 text-sm text-destructive">{state.error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Read by your device's own voice. Playback may stop if you lock the screen or switch to another app.</p>
    </section>
  );
}
