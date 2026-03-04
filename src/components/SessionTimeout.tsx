import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IDLE_LIMIT = 30 * 60 * 1000; // 30 min
const WARNING_AT = 25 * 60 * 1000; // 25 min

export function SessionTimeout() {
  const navigate = useNavigate();
  const lastActivity = useRef(Date.now());
  const warningShown = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
    warningShown.current = false;
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    timerRef.current = setInterval(async () => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_LIMIT) {
        await supabase.auth.signOut();
        navigate("/auth");
        toast.error("You were signed out due to inactivity.");
      } else if (idle >= WARNING_AT && !warningShown.current) {
        warningShown.current = true;
        toast.warning("Your session will expire in 5 minutes due to inactivity. Click anywhere to stay signed in.");
      }
    }, 15_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer, navigate]);

  return null;
}
