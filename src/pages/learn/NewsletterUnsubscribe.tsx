import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  useEffect(() => {
    const token = params.get("token") || "";
    supabase.functions.invoke("newsletter-unsubscribe", { body: { token } })
      .then(({ data, error }) => setState(error || data?.error ? "error" : "done"));
  }, [params]);
  return (
    <PublicShell>
      <section className="max-w-xl mx-auto px-5 py-24 text-center">
        {state === "working" && <p className="text-muted-foreground">Processing…</p>}
        {state === "done" && <p className="text-lg">You have been unsubscribed. You will no longer receive the DPDP insights newsletter.</p>}
        {state === "error" && <p className="text-lg text-destructive">This unsubscribe link is invalid or has expired.</p>}
      </section>
    </PublicShell>
  );
}
