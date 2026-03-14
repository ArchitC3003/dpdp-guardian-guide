import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "privcybhub_cookie_consent_v2";

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  default: boolean;
  cookies: { name: string; provider: string; duration: string; purpose: string }[];
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "strictly_necessary",
    name: "Strictly Necessary",
    description: "These cookies are essential for the website to function. They enable core features such as security, session management, and accessibility. You cannot disable these cookies.",
    required: true,
    default: true,
    cookies: [
      { name: "sb-access-token", provider: "PrivCybHub", duration: "Session", purpose: "Authentication session token" },
      { name: "sb-refresh-token", provider: "PrivCybHub", duration: "30 days", purpose: "Session refresh for seamless login" },
      { name: "privcybhub_cookie_consent", provider: "PrivCybHub", duration: "1 year", purpose: "Stores your cookie preferences" },
    ],
  },
  {
    id: "functional",
    name: "Functional / Preferences",
    description: "These cookies enable enhanced functionality and personalisation, such as remembering your language or region settings and UI preferences.",
    required: false,
    default: false,
    cookies: [
      { name: "sidebar_state", provider: "PrivCybHub", duration: "1 year", purpose: "Remembers sidebar collapsed/expanded state" },
      { name: "theme_preference", provider: "PrivCybHub", duration: "1 year", purpose: "Stores light/dark mode preference" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics & Performance",
    description: "These cookies help us understand how visitors interact with the platform by collecting anonymous usage statistics. No personally identifiable information is collected.",
    required: false,
    default: false,
    cookies: [
      { name: "_ga", provider: "Google Analytics", duration: "2 years", purpose: "Distinguishes unique users (if enabled)" },
      { name: "_gid", provider: "Google Analytics", duration: "24 hours", purpose: "Distinguishes unique users (if enabled)" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Advertising",
    description: "These cookies are used to deliver advertisements relevant to you and your interests. They may also be used to limit the number of times you see an advertisement.",
    required: false,
    default: false,
    cookies: [
      { name: "_fbp", provider: "Facebook", duration: "3 months", purpose: "Tracks visits across websites for ad targeting (if enabled)" },
    ],
  },
  {
    id: "third_party",
    name: "Third-Party / Vendor Cookies",
    description: "These cookies are set by external services embedded in our platform, such as support chat widgets, embedded content, or integration partners.",
    required: false,
    default: false,
    cookies: [
      { name: "intercom-session", provider: "Intercom", duration: "1 week", purpose: "Support chat session (if enabled)" },
    ],
  },
];

async function recordConsent(
  actionType: string,
  accepted: string[],
  rejected: string[],
  userId?: string,
  noticeVersionId?: string
) {
  try {
    const sessionId = !userId ? crypto.randomUUID() : undefined;
    // We can't insert via the typed client since the table is new and types aren't updated yet
    // Use .from() which works dynamically
    await (supabase as any).from("consent_receipts").insert({
      user_id: userId || null,
      session_id: sessionId,
      notice_version_id: noticeVersionId || null,
      categories_accepted: accepted,
      categories_rejected: rejected,
      action_type: actionType,
      user_agent: navigator.userAgent,
      banner_language: "en",
    });

    // Audit log
    await (supabase as any).from("consent_audit_log").insert({
      actor_id: userId || null,
      actor_type: userId ? "user" : "system",
      action: `Consent ${actionType}`,
      entity_type: "Consent",
      notes: `Categories accepted: ${accepted.join(", ") || "none"}`,
    });
  } catch (e) {
    console.error("Failed to record consent:", e);
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach((c) => (init[c.id] = c.default));
    return init;
  });
  const { session } = useAuth();

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const getAcceptedRejected = useCallback(
    (cats: Record<string, boolean>) => {
      const accepted = Object.entries(cats)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const rejected = Object.entries(cats)
        .filter(([, v]) => !v)
        .map(([k]) => k)
        .filter((k) => !COOKIE_CATEGORIES.find((c) => c.id === k)?.required);
      return { accepted, rejected };
    },
    []
  );

  const handleAcceptAll = () => {
    const all: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach((c) => (all[c.id] = true));
    const { accepted, rejected } = getAcceptedRejected(all);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: all, action: "accept_all", ts: new Date().toISOString() }));
    recordConsent("accept_all", accepted, rejected, session?.user?.id);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const min: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach((c) => (min[c.id] = c.required));
    const { accepted, rejected } = getAcceptedRejected(min);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: min, action: "reject_all", ts: new Date().toISOString() }));
    recordConsent("reject_all", accepted, rejected, session?.user?.id);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    const { accepted, rejected } = getAcceptedRejected(categories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, action: "custom", ts: new Date().toISOString() }));
    recordConsent("custom", accepted, rejected, session?.user?.id);
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" role="dialog" aria-label="Cookie consent" aria-modal="false">
      <div className="bg-card border-t border-border shadow-lg max-w-full">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {!showPreferences ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">We value your privacy</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We collect limited data categories (session identifiers, usage analytics) to provide and improve our compliance platform.
                    Your data is processed for platform functionality and service improvement.
                    You can withdraw consent at any time via{" "}
                    <a href="/privacy-preferences" className="text-primary underline hover:text-primary/80">Preferences</a>.
                    To raise a concern, use our{" "}
                    <a href="/privacy-preferences#grievance" className="text-primary underline hover:text-primary/80">Grievance / Contact DPO</a> link.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-2 text-xs">
                  <a href="/privacy" className="text-primary underline hover:text-primary/80" aria-label="View privacy notice">Privacy Notice</a>
                  <span className="text-muted">|</span>
                  <a href="/privacy-preferences#grievance" className="text-primary underline hover:text-primary/80" aria-label="Contact grievance officer">Grievance / Contact DPO</a>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={handleAcceptAll} className="bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Accept all cookies">
                    Accept All
                  </Button>
                  <Button variant="outline" onClick={handleRejectAll} aria-label="Reject all optional cookies">
                    Reject All
                  </Button>
                  <Button variant="secondary" onClick={() => setShowPreferences(true)} aria-label="Manage cookie preferences">
                    Manage Preferences
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Manage Cookie Preferences</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowPreferences(false)} aria-label="Close preferences">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {COOKIE_CATEGORIES.map((cat) => (
                  <Collapsible key={cat.id}>
                    <div className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary">
                            <ChevronDown className="h-4 w-4 transition-transform" />
                            {cat.name}
                          </CollapsibleTrigger>
                          {cat.required && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary">Always On</Badge>
                          )}
                        </div>
                        <Switch
                          checked={categories[cat.id]}
                          onCheckedChange={(checked) => {
                            if (!cat.required) setCategories((prev) => ({ ...prev, [cat.id]: checked }));
                          }}
                          disabled={cat.required}
                          aria-label={`Toggle ${cat.name} cookies`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-5">{cat.description}</p>
                      <CollapsibleContent>
                        <div className="mt-3 ml-5 border-t border-border pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Cookies in this category:</p>
                          <div className="space-y-1">
                            {cat.cookies.map((cookie) => (
                              <div key={cookie.name} className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                                <span className="font-mono font-medium text-foreground">{cookie.name}</span>
                                <span>Provider: {cookie.provider}</span>
                                <span>Duration: {cookie.duration}</span>
                                <span>Purpose: {cookie.purpose}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button variant="outline" onClick={handleRejectAll} aria-label="Reject all optional cookies">Reject All</Button>
                <Button onClick={handleSavePreferences} className="bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Save cookie preferences">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
