import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CONSENT_CATEGORIES, CONSENT_OPEN_EVENT, choicesFor, readConsent, saveConsent, splitChoices,
  type ConsentAction, type ConsentChoices,
} from "@/lib/consent";

async function recordConsent(actionType: ConsentAction, choices: ConsentChoices, userId?: string) {
  const { accepted, rejected } = splitChoices(choices);
  const { error } = await supabase.from("consent_receipts").insert({
    user_id: userId || null,
    session_id: userId ? null : crypto.randomUUID(),
    categories_accepted: accepted,
    categories_rejected: rejected,
    action_type: actionType,
    withdrawal_timestamp: actionType === "withdrawn" ? new Date().toISOString() : null,
    user_agent: navigator.userAgent,
    banner_language: "en",
  });
  if (error) console.error("Failed to record consent:", error.message);
  if (!userId) return; // the audit log accepts entries from signed-in people only
  const { error: auditError } = await supabase.from("consent_audit_log").insert({
    actor_id: userId,
    actor_type: "user",
    action: `Consent ${actionType}`,
    entity_type: "Consent",
    notes: `Categories accepted: ${accepted.join(", ") || "none"}`,
  });
  if (auditError) console.error("Failed to write consent audit entry:", auditError.message);
}

export function CookieConsentBanner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isProfileSetup = pathname === "/profile-setup";
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [categories, setCategories] = useState<ConsentChoices>(() => readConsent()?.categories ?? choicesFor(false));
  const { session } = useAuth();

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    // "Privacy choices" links anywhere on the site reopen the panel with the current choice.
    const reopen = () => {
      setCategories(readConsent()?.categories ?? choicesFor(false));
      setShowPreferences(true);
      setVisible(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const decide = useCallback((choices: ConsentChoices, action: ConsentAction) => {
    const hadOptional = splitChoices(readConsent()?.categories ?? {}).accepted.length > 1;
    const saved = saveConsent(choices, action === "reject_all" && hadOptional ? "withdrawn" : action);
    setCategories(saved.categories);
    void recordConsent(saved.action, saved.categories, session?.user?.id);
    setVisible(false);
    setShowPreferences(false);
  }, [session?.user?.id]);

  const handleAcceptAll = () => decide(choicesFor(true), "accept_all");
  const handleRejectAll = () => decide(choicesFor(false), "reject_all");
  const handleSavePreferences = () => decide(categories, readConsent() ? "updated" : "custom");

  if (!visible) return null;

  return (
    <div className={isProfileSetup ? "relative z-50 max-h-[70dvh] overflow-y-auto" : "fixed bottom-0 left-0 right-0 z-50"} role="dialog" aria-label="Cookie consent" aria-modal="false">
      <div className="bg-card border-t border-border shadow-lg max-w-full">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {!showPreferences ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">We value your privacy</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We store only what is needed to sign you in and keep your session secure. With your permission we also
                    remember your display and listening preferences. We do not use analytics, advertising or third-party trackers.
                    You can change or withdraw your choice at any time via{" "}
                    <button onClick={() => { setVisible(false); navigate("/privacy-preferences"); }} className="text-primary underline hover:text-primary/80 bg-transparent border-none cursor-pointer p-0 inline text-sm">Preferences</button>.
                    To raise a concern, use our{" "}
                    <button onClick={() => { setVisible(false); navigate("/privacy-preferences", { state: { scrollTo: "grievance" } }); }} className="text-primary underline hover:text-primary/80 bg-transparent border-none cursor-pointer p-0 inline text-sm">Grievance / Contact DPO</button> link.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-2 text-xs">
                  <button onClick={() => { setVisible(false); navigate("/privacy"); }} className="text-primary underline hover:text-primary/80 bg-transparent border-none cursor-pointer p-0 inline text-xs" aria-label="View privacy notice">Privacy Notice</button>
                  <span className="text-muted">|</span>
                  <button onClick={() => { setVisible(false); navigate("/privacy-preferences", { state: { scrollTo: "grievance" } }); }} className="text-primary underline hover:text-primary/80 bg-transparent border-none cursor-pointer p-0 inline text-xs" aria-label="Contact grievance officer">Grievance / Contact DPO</button>
                </div>
                <div className={isProfileSetup ? "flex flex-wrap gap-2" : "flex gap-2 shrink-0"}>
                  <Button onClick={handleAcceptAll} className="bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Accept all">
                    Accept All
                  </Button>
                  <Button variant="outline" onClick={handleRejectAll} aria-label="Reject all optional storage">
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
                <h2 className="text-base font-semibold text-foreground">Privacy choices</h2>
                <Button variant="ghost" size="icon" onClick={() => (readConsent() ? setVisible(false) : setShowPreferences(false))} aria-label="Close preferences">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {CONSENT_CATEGORIES.map((cat) => (
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
                          aria-label={`Toggle ${cat.name}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-5">{cat.description}</p>
                      <CollapsibleContent>
                        <div className="mt-3 ml-5 border-t border-border pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">What is stored in this category:</p>
                          <div className="space-y-1">
                            {cat.technologies.map((tech) => (
                              <div key={tech.name} className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                                <span className="font-mono font-medium text-foreground">{tech.name}</span>
                                <span>Type: {tech.kind}</span>
                                <span>Set by: {tech.provider}</span>
                                <span>Kept: {tech.duration}</span>
                                <span>Purpose: {tech.purpose}</span>
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
                <Button variant="outline" onClick={handleRejectAll} aria-label="Reject all optional storage">Reject All</Button>
                <Button onClick={handleSavePreferences} className="bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Save privacy choices">
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
