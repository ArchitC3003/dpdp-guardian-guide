import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { WheelMark } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";

export default function ProfileSetup() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Your session has ended. Please sign in again.");
      navigate("/auth");
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName.trim(), organisation: organisation.trim(), role }, { onConflict: "id" });

    if (error) {
      toast.error(`Could not save your profile: ${error.message}`);
    } else {
      await refreshProfile();
      toast.success("Profile saved!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-dvh overflow-y-auto flex items-start sm:items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center gap-2">
            <WheelMark size={30} />
            <span className="text-2xl font-bold text-gradient">PrivcybHub</span>
          </div>
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself and your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" autoComplete="name" className="h-11 scroll-my-8" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Input id="organisation" autoComplete="organization" className="h-11 scroll-my-8" value={organisation} onChange={(e) => setOrganisation(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role" className="h-11 scroll-my-8"><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent className="max-h-[var(--radix-select-content-available-height)]">
                  <SelectItem value="DPO">Data Protection Officer (DPO)</SelectItem>
                  <SelectItem value="Compliance Head">Compliance Head</SelectItem>
                  <SelectItem value="Assessor">Assessor</SelectItem>
                  <SelectItem value="Legal Counsel">Legal Counsel</SelectItem>
                  <SelectItem value="IT Head">IT Head</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* A9 — Data disclosure */}
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your profile information is used to personalise your compliance dashboard. It is stored securely, not shared with third parties, and you can delete it at any time from Settings.
              </p>
            </div>

            <Button type="submit" className="h-11 w-full scroll-my-8 gradient-primary" disabled={loading || !role}>
              {loading ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
