import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import SharedReports from "./pages/SharedReports";
import Repository from "./pages/Repository";
import ArtefactRepository from "./pages/ArtefactRepository";
import AccountSettings from "./pages/AccountSettings";
import UserManagement from "./pages/UserManagement";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PhaseOrgProfile from "./pages/PhaseOrgProfile";
import PhasePolicyMatrix from "./pages/PhasePolicyMatrix";
import PhaseRapidAssessment from "./pages/PhaseRapidAssessment";
import PhaseDeptGrid from "./pages/PhaseDeptGrid";
import PhaseFileReferences from "./pages/PhaseFileReferences";
import PhaseDashboard from "./pages/PhaseDashboard";
import PolicySopBuilder from "./pages/PolicySopBuilder";
import PolicyLibrary from "./pages/PolicyLibrary";
import AdminAiConfig from "./pages/AdminAiConfig";
import PrivacyPreferences from "./pages/PrivacyPreferences";
import ConsentLedger from "./pages/admin/ConsentLedger";
import NoticeManager from "./pages/admin/NoticeManager";
import RightsDesk from "./pages/admin/RightsDesk";
import GrievanceConsole from "./pages/admin/GrievanceConsole";
import ConsentAuditLog from "./pages/admin/ConsentAuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }
  if (!session) return <Navigate to="/" replace />;
  if (profile && !profile.full_name) return <Navigate to="/profile-setup" replace />;

  return <AppLayout />;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CookieConsentBanner />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<AuthGuard><Auth /></AuthGuard>} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-preferences" element={<PrivacyPreferences />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assessments" element={<Dashboard />} />
              <Route path="/shared" element={<SharedReports />} />
              <Route path="/repository" element={<Repository />} />
              <Route path="/artefacts" element={<ArtefactRepository />} />
              <Route path="/policy-sop-builder" element={<PolicySopBuilder />} />
              <Route path="/policy-builder" element={<PolicySopBuilder />} />
              <Route path="/policy-library" element={<PolicyLibrary />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/admin/ai-config" element={<AdminAiConfig />} />
              <Route path="/admin/consent-ledger" element={<ConsentLedger />} />
              <Route path="/admin/notice-manager" element={<NoticeManager />} />
              <Route path="/admin/rights-desk" element={<RightsDesk />} />
              <Route path="/admin/grievance-console" element={<GrievanceConsole />} />
              <Route path="/admin/consent-audit-log" element={<ConsentAuditLog />} />
              <Route path="/consent" element={<ConsentLedger />} />
              <Route path="/consent/ledger" element={<ConsentLedger />} />
              <Route path="/consent/notices" element={<NoticeManager />} />
              <Route path="/consent/rights-desk" element={<RightsDesk />} />
              <Route path="/consent/grievances" element={<GrievanceConsole />} />
              <Route path="/consent/audit-log" element={<ConsentAuditLog />} />
              <Route path="/assessment/:assessmentId/org-profile" element={<PhaseOrgProfile />} />
              <Route path="/assessment/:assessmentId/policy-matrix" element={<PhasePolicyMatrix />} />
              <Route path="/assessment/:assessmentId/rapid-assessment" element={<PhaseRapidAssessment />} />
              <Route path="/assessment/:assessmentId/dept-grid" element={<PhaseDeptGrid />} />
              <Route path="/assessment/:assessmentId/file-references" element={<PhaseFileReferences />} />
              <Route path="/assessment/:assessmentId/dashboard" element={<PhaseDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
