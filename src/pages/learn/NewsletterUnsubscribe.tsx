import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { Button } from "@/components/ui/button";

// Opening this page never unsubscribes anyone; only the button does (scanner-safe).
export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"confirm" | "working" | "done" | "error">(/^[a-f0-9]{32,64}$/.test(token) ? "confirm" : "error");
  const confirm = async () => {
    setState("working");
    const { data, error } = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token } });
    setState(error || !data?.ok ? "error" : "done");
  };
  return (
    <PublicShell>
      <section className="max-w-xl mx-auto px-5 py-24 text-center space-y-6">
        {(state === "confirm" || state === "working") && <>
          <p className="text-lg">Unsubscribe from the DPDP insights newsletter?</p>
          <Button onClick={confirm} disabled={state === "working"}>{state === "working" ? "Processing…" : "Confirm unsubscribe"}</Button>
        </>}
        {state === "done" && <p className="text-lg">You have been unsubscribed. You will no longer receive the DPDP insights newsletter.</p>}
        {state === "error" && <p className="text-lg text-destructive">This unsubscribe link is invalid or has expired.</p>}
      </section>
    </PublicShell>
  );
}
