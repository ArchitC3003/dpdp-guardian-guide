import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setErrorMsg("Missing unsubscribe token.");
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else {
          setState("invalid");
          setErrorMsg(data.error || "This unsubscribe link is invalid or expired.");
        }
      })
      .catch(() => {
        setState("invalid");
        setErrorMsg("Could not validate the unsubscribe link.");
      });
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }
    if ((data as any)?.success) setState("success");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else {
      setState("error");
      setErrorMsg((data as any)?.error || "Unable to process unsubscribe.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MailX className="h-5 w-5 text-emerald-400" />
            Email Preferences — PrivcybHub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Validating your link…
            </div>
          )}

          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to unsubscribe from PrivcybHub app emails. You will continue to
                receive essential account & security notifications (e.g. password reset, login alerts) as
                required by law.
              </p>
              <Button onClick={confirm} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {state === "submitting" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}

          {state === "success" && (
            <div className="flex items-start gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">You've been unsubscribed.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We won't send you further app emails. Thank you.
                </p>
              </div>
            </div>
          )}

          {state === "already" && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-medium text-foreground">Already unsubscribed.</p>
                <p className="text-sm mt-1">This email address is no longer receiving app emails.</p>
              </div>
            </div>
          )}

          {(state === "invalid" || state === "error") && (
            <div className="flex items-start gap-2 text-red-400">
              <XCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Something went wrong.</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}