import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { postSignInPath } from "@/lib/buildIntent";
import { AppLayout } from "@/components/AppLayout";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import LandingPage from "./pages/LandingPage";
const Auth = lazy(() => import("./pages/Auth"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SharedReports = lazy(() => import("./pages/SharedReports"));
const Assessments = lazy(() => import("./pages/Assessments"));
const Repository = lazy(() => import("./pages/Repository"));
const ArtefactRepository = lazy(() => import("./pages/ArtefactRepository"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const PhaseOrgProfile = lazy(() => import("./pages/PhaseOrgProfile"));
const PhasePolicyMatrix = lazy(() => import("./pages/PhasePolicyMatrix"));
const PhaseRapidAssessment = lazy(() => import("./pages/PhaseRapidAssessment"));
const PhaseDeptGrid = lazy(() => import("./pages/PhaseDeptGrid"));
const PhaseDeptQuestionnaire = lazy(() => import("./pages/PhaseDeptQuestionnaire"));
const PhaseDeptQuestionnaireDetail = lazy(() => import("./pages/PhaseDeptQuestionnaireDetail"));
const PhaseFileReferences = lazy(() => import("./pages/PhaseFileReferences"));
const PhaseDashboard = lazy(() => import("./pages/PhaseDashboard"));
const PolicySopBuilder = lazy(() => import("./pages/PolicySopBuilder"));
const PolicyLibrary = lazy(() => import("./pages/PolicyLibrary"));
const AdminAiConfig = lazy(() => import("./pages/AdminAiConfig"));
const AdminFrameworkManager = lazy(() => import("./pages/AdminFrameworkManager"));
const AdminAssessmentTemplates = lazy(() => import("./pages/AdminAssessmentTemplates"));
const ExecuteLanding = lazy(() => import("./pages/execute/ExecuteLanding"));
const ExecuteSunburst = lazy(() => import("./pages/execute/ExecuteSunburst"));
const ExecuteOrgProfile = lazy(() => import("./pages/execute/ExecuteOrgProfile"));
const ExecuteWorkspace = lazy(() => import("./pages/execute/ExecuteWorkspace"));
const PrivacyPreferences = lazy(() => import("./pages/PrivacyPreferences"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NewsletterUnsubscribe = lazy(() => import("./pages/learn/NewsletterUnsubscribe"));
const ConsentLedger = lazy(() => import("./pages/admin/ConsentLedger"));
const NoticeManager = lazy(() => import("./pages/admin/NoticeManager"));
const RightsDesk = lazy(() => import("./pages/admin/RightsDesk"));
const GrievanceConsole = lazy(() => import("./pages/admin/GrievanceConsole"));
const ConsentAuditLog = lazy(() => import("./pages/admin/ConsentAuditLog"));
const LearnHub = lazy(() => import("./pages/learn/LearnHub"));
const LearnArticle = lazy(() => import("./pages/learn/LearnArticle"));
const LandingView = lazy(() => import("./pages/learn/LandingView"));
const ContentStudio = lazy(() => import("./pages/studio/ContentStudio"));
const ContentEditor = lazy(() => import("./pages/studio/ContentEditor"));
const LeadsInbox = lazy(() => import("./pages/studio/LeadsInbox"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const GovernanceStudio = lazy(() => import("./pages/studio/GovernanceStudio"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>
);

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
  if (session) return <Navigate to={postSignInPath()} replace />;
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
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<AuthGuard><Auth /></AuthGuard>} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/policies/:slug" element={<PolicyPage />} />
            <Route path="/privacy-preferences" element={<PrivacyPreferences />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/learn/unsubscribe" element={<NewsletterUnsubscribe />} />
            <Route path="/learn" element={<LearnHub />} />
            <Route path="/learn/topic/:tag" element={<LearnHub />} />
            <Route path="/learn/:slug" element={<LearnArticle />} />
            <Route path="/learn/domain/:domain" element={<LearnHub />} />
            <Route path="/learn/framework/:framework" element={<LearnHub />} />
            <Route path="/learn/artefact/:artefact" element={<LearnHub />} />
            <Route path="/learn/:domain/:topic" element={<LearnHub />} />
            <Route path="/lp/:slug" element={<LandingView />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/shared" element={<SharedReports />} />
              <Route path="/repository" element={<Repository />} />
              <Route path="/artefacts" element={<ArtefactRepository />} />
              <Route path="/policy-sop-builder" element={<PolicySopBuilder />} />
              <Route path="/policy-builder" element={<PolicySopBuilder />} />
              <Route path="/policy-library" element={<PolicyLibrary />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/admin/ai-config" element={<AdminAiConfig />} />
              <Route path="/admin/frameworks" element={<AdminFrameworkManager />} />
              <Route path="/admin/assessment-templates" element={<AdminAssessmentTemplates />} />
              <Route path="/admin/consent-ledger" element={<ConsentLedger />} />
              <Route path="/admin/notice-manager" element={<NoticeManager />} />
              <Route path="/admin/rights-desk" element={<RightsDesk />} />
              <Route path="/admin/grievance-console" element={<GrievanceConsole />} />
              <Route path="/admin/consent-audit-log" element={<ConsentAuditLog />} />
              <Route path="/studio/governance" element={<GovernanceStudio />} />
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
              <Route path="/assessment/:assessmentId/dept-questionnaire" element={<PhaseDeptQuestionnaire />} />
              <Route path="/assessment/:assessmentId/dept-questionnaire/:deptAssessmentId" element={<PhaseDeptQuestionnaireDetail />} />
              <Route path="/assessment/:assessmentId/file-references" element={<PhaseFileReferences />} />
              <Route path="/assessment/:assessmentId/dashboard" element={<PhaseDashboard />} />
              <Route path="/studio/content" element={<ContentStudio />} />
              <Route path="/studio/content/:id" element={<ContentEditor />} />
              <Route path="/studio/leads" element={<LeadsInbox />} />
              <Route path="/execute" element={<ExecuteLanding />} />
              <Route path="/execute/select" element={<ExecuteSunburst />} />
              <Route path="/execute/profile" element={<ExecuteOrgProfile />} />
              <Route path="/execute/workspace/:workspaceId" element={<ExecuteWorkspace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
