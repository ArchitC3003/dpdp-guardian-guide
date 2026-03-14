import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, FileText, AlertTriangle, Upload, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "privcybhub_cookie_consent_v2";

const COOKIE_CATEGORIES = [
  { id: "strictly_necessary", name: "Strictly Necessary", description: "Essential for website function. Cannot be disabled.", required: true },
  { id: "functional", name: "Functional / Preferences", description: "Enhanced functionality like language and UI preferences.", required: false },
  { id: "analytics", name: "Analytics & Performance", description: "Anonymous usage statistics to improve the platform.", required: false },
  { id: "marketing", name: "Marketing & Advertising", description: "Delivers relevant advertisements.", required: false },
  { id: "third_party", name: "Third-Party / Vendor", description: "External services like support widgets.", required: false },
];

const RIGHTS_TYPES = [
  "Right to Information about processing (Section 11 DPDP Act)",
  "Right to Correction / Updation (Section 12)",
  "Right to Erasure / Forgetting (Section 12)",
  "Right to Grievance Redressal (Section 13)",
  "Right to Nominate (Section 14)",
];

const GRIEVANCE_NATURES = [
  "Privacy Notice Issue",
  "Consent Handling",
  "Unauthorized Processing",
  "Rights Request Not Responded",
  "Other",
];

export default function PrivacyPreferences() {
  const { session, profile } = useAuth();
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rightsOpen, setRightsOpen] = useState(false);
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  // Rights form
  const [rightsType, setRightsType] = useState("");
  const [rightsDesc, setRightsDesc] = useState("");
  const [rightsEmail, setRightsEmail] = useState("");
  const [rightsConfirm, setRightsConfirm] = useState(false);

  // Grievance form
  const [gSubject, setGSubject] = useState("");
  const [gNature, setGNature] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gEmail, setGEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed.categories || {});
        setLastUpdated(parsed.ts);
      } catch { /* ignore */ }
    } else {
      const init: Record<string, boolean> = {};
      COOKIE_CATEGORIES.forEach((c) => (init[c.id] = c.required ? true : false));
      setCategories(init);
    }
    if (session?.user?.email) {
      setRightsEmail(session.user.email);
      setGEmail(session.user.email);
    }
  }, [session]);

  const handleSave = async () => {
    const accepted = Object.entries(categories).filter(([, v]) => v).map(([k]) => k);
    const rejected = Object.entries(categories).filter(([, v]) => !v).map(([k]) => k).filter((k) => !COOKIE_CATEGORIES.find((c) => c.id === k)?.required);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, action: "updated", ts: new Date().toISOString() }));
    try {
      await (supabase as any).from("consent_receipts").insert({
        user_id: session?.user?.id || null,
        categories_accepted: accepted,
        categories_rejected: rejected,
        action_type: "updated",
        user_agent: navigator.userAgent,
        banner_language: "en",
      });
    } catch { /* ignore */ }
    toast({ title: "Preferences saved", description: "Your cookie preferences have been updated." });
    setLastUpdated(new Date().toISOString());
  };

  const handleWithdrawAll = async () => {
    const min: Record<string, boolean> = {};
    COOKIE_CATEGORIES.forEach((c) => (min[c.id] = c.required));
    setCategories(min);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: min, action: "withdrawn", ts: new Date().toISOString() }));
    try {
      await (supabase as any).from("consent_receipts").insert({
        user_id: session?.user?.id || null,
        categories_accepted: ["strictly_necessary"],
        categories_rejected: ["functional", "analytics", "marketing", "third_party"],
        action_type: "withdrawn",
        withdrawal_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        banner_language: "en",
      });
    } catch { /* ignore */ }
    toast({ title: "Consent withdrawn", description: "All optional consent has been withdrawn." });
    setLastUpdated(new Date().toISOString());
  };

  const submitRightsRequest = async () => {
    if (!rightsType || !rightsDesc || !rightsEmail || !rightsConfirm) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    try {
      await (supabase as any).from("rights_requests").insert({
        user_id: session?.user?.id || null,
        user_email: rightsEmail,
        request_type: rightsType,
        description: rightsDesc.slice(0, 500),
      });
      toast({ title: "Request submitted", description: "Your rights request has been submitted. You will receive an acknowledgement." });
      setRightsOpen(false);
      setRightsType(""); setRightsDesc(""); setRightsConfirm(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    }
  };

  const submitGrievance = async () => {
    if (!gSubject || !gNature || !gDesc || !gEmail) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    try {
      await (supabase as any).from("grievances").insert({
        user_id: session?.user?.id || null,
        user_email: gEmail,
        subject: gSubject,
        nature: gNature,
        description: gDesc.slice(0, 1000),
      });
      toast({ title: "Grievance submitted", description: "Your complaint has been registered. You will receive an acknowledgement." });
      setGrievanceOpen(false);
      setGSubject(""); setGNature(""); setGDesc("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit grievance.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Preferences</h1>
          <p className="text-sm text-muted-foreground">Manage your consent, exercise your rights, or raise a complaint.</p>
        </div>
      </div>

      {/* Consent Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Consent Status</CardTitle>
          {lastUpdated && <CardDescription>Last updated: {new Date(lastUpdated).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {COOKIE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  {cat.required && <Badge variant="outline" className="text-[10px] text-primary border-primary">Required</Badge>}
                  <Badge variant={categories[cat.id] ? "default" : "secondary"} className="text-[10px]">
                    {categories[cat.id] ? "ON" : "OFF"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <Switch
                checked={categories[cat.id] || false}
                onCheckedChange={(checked) => {
                  if (!cat.required) setCategories((prev) => ({ ...prev, [cat.id]: checked }));
                }}
                disabled={cat.required}
                aria-label={`Toggle ${cat.name}`}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Preferences
            </Button>
            <Button variant="destructive" onClick={handleWithdrawAll}>
              Withdraw All Consent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Privacy Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            View the current version of our Privacy Notice to understand how your personal data is processed.
          </p>
          <Button variant="outline" asChild>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">View Full Privacy Notice</a>
          </Button>
        </CardContent>
      </Card>

      {/* Exercise Rights */}
      <Card id="rights">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Exercise Your Rights
          </CardTitle>
          <CardDescription>Submit a Data Principal rights request under the DPDP Act 2023.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={rightsOpen} onOpenChange={setRightsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Exercise Your Rights</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Data Principal Rights Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Request Type *</Label>
                  <Select value={rightsType} onValueChange={setRightsType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {RIGHTS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description * (max 500 chars)</Label>
                  <Textarea value={rightsDesc} onChange={(e) => setRightsDesc(e.target.value)} maxLength={500} placeholder="Describe your request..." />
                </div>
                <div>
                  <Label>Email address *</Label>
                  <Input value={rightsEmail} onChange={(e) => setRightsEmail(e.target.value)} type="email" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={rightsConfirm} onCheckedChange={(v) => setRightsConfirm(!!v)} id="rights-confirm" />
                  <Label htmlFor="rights-confirm" className="text-sm">I confirm this request relates to my personal data</Label>
                </div>
                <Button onClick={submitRightsRequest} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Send className="h-4 w-4 mr-2" /> Submit Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Grievance */}
      <Card id="grievance">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Raise a Complaint
          </CardTitle>
          <CardDescription>Submit a grievance related to data processing, consent, or privacy concerns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={grievanceOpen} onOpenChange={setGrievanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Raise a Complaint</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Grievance Form</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject of Complaint *</Label>
                  <Input value={gSubject} onChange={(e) => setGSubject(e.target.value)} placeholder="Brief subject" />
                </div>
                <div>
                  <Label>Nature *</Label>
                  <Select value={gNature} onValueChange={setGNature}>
                    <SelectTrigger><SelectValue placeholder="Select nature" /></SelectTrigger>
                    <SelectContent>
                      {GRIEVANCE_NATURES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description * (max 1000 chars)</Label>
                  <Textarea value={gDesc} onChange={(e) => setGDesc(e.target.value)} maxLength={1000} placeholder="Describe your complaint..." />
                </div>
                <div>
                  <Label>Email address *</Label>
                  <Input value={gEmail} onChange={(e) => setGEmail(e.target.value)} type="email" />
                </div>
                <Button onClick={submitGrievance} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Send className="h-4 w-4 mr-2" /> Submit Grievance
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
