import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "privcybhub_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (value: string) => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 p-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-slate-300">
          We use essential cookies to keep you signed in and secure your session. No tracking or advertising cookies are used.{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Learn more
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => handle("accepted")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2">
            Accept
          </Button>
          <Button variant="outline" onClick={() => handle("declined")} className="text-slate-300 rounded px-4 py-2">
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
