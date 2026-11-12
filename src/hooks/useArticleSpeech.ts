import { useEffect, useRef, useState, type RefObject } from "react";
import { SpeechController, type SpeechState } from "@/lib/speech/SpeechController";
import { extractReadable, type SpeechBlock } from "@/lib/speech/extractReadable";

const CURRENT = "data-listen-current";

/**
 * Owns one speech controller for the article inside `rootRef`.
 * The text is read from the rendered page whenever `contentKey` changes, so a new or edited
 * article is picked up without any setup. Speech stops when the article changes or the page is left.
 * `state` is null until the controller exists (the first paint).
 */
export function useArticleSpeech(rootRef: RefObject<Element>, contentKey: string) {
  const [controller, setController] = useState<SpeechController | null>(null);
  const [state, setState] = useState<SpeechState | null>(null);
  const blocks = useRef<SpeechBlock[]>([]);

  // Created in an effect so each mount gets its own controller and each unmount destroys exactly that one.
  useEffect(() => {
    const c = new SpeechController();
    setController(c);
    setState(c.getState());
    const off = c.subscribe(() => setState(c.getState()));
    return () => { off(); c.destroy(); };
  }, []);

  useEffect(() => {
    if (!controller) return;
    blocks.current = extractReadable(rootRef.current);
    controller.load(blocks.current);
    return () => controller.stop();
  }, [controller, rootRef, contentKey]);

  // Mark the passage being read so the page can show where the voice is.
  const status = state?.status ?? "idle";
  const index = state?.index ?? 0;
  useEffect(() => {
    if (status === "idle") return;
    const el = blocks.current[index]?.el;
    el?.setAttribute(CURRENT, "");
    return () => el?.removeAttribute(CURRENT);
  }, [status, index, contentKey]);

  return { state, controller };
}
