import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Cog, Info } from "lucide-react";

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, organisation, role })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      await refreshProfile();
      toast.success("Profile saved!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center gap-2">
            <Cog className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">PrivcybHub</span>
          </div>
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself and your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Input id="organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
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

            <Button type="submit" className="w-full gradient-primary" disabled={loading || !role}>
              {loading ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
