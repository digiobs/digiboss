import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { PreAuthProvider, usePreAuth } from "@/contexts/PreAuthContext";
import { TeamAuthProvider, useTeamAuth } from "@/contexts/TeamAuthContext";
import { TeamAuthGate } from "@/components/auth/TeamAuthGate";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import PreLogin from "@/pages/PreLogin";
import MyWork from "@/pages/MyWork";
import Home from "@/pages/Home";
import Insights from "@/pages/Insights";
import Prospects from "@/pages/Prospects";
import Assets from "@/pages/Assets";
import Reporting from "@/pages/Reporting";
import Chat from "@/pages/Chat";
import Admin from "@/pages/Admin";
import Journal from "@/pages/Journal";
import Veille from "@/pages/Veille";
import Proposals from "@/pages/Proposals";
import EditorialCalendar from "@/pages/EditorialCalendar";
import KpiDashboard from "@/pages/KpiDashboard";
import SeoGeo from "@/pages/SeoGeo";
import SettingsIntegrations from "@/pages/SettingsIntegrations";
import ProfileSettings from "@/pages/ProfileSettings";
import WrikeCallback from "@/pages/oauth/WrikeCallback";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper: allow access if pre-authenticated OR logged in via Supabase
function PreAuthGuard({ children }: { children: React.ReactNode }) {
  const { isPreAuthenticated } = usePreAuth();
  const { isTeamMember, isLoading } = useTeamAuth();

  // Pre-auth (user/user22) grants immediate access — no need to wait for Supabase
  if (isPreAuthenticated) return <>{children}</>;

  // Supabase auth: wait for session check to complete
  if (isLoading) return null;

  if (isTeamMember) return <>{children}</>;

  return <Navigate to="/login" replace />;
}

const AppRoutes = () => {
  const { isPreAuthenticated } = usePreAuth();
  const { isTeamMember } = useTeamAuth();
  const isAuthenticated = isPreAuthenticated || isTeamMember;

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />

      {/* Pre-auth login route - redirects to dashboard if already authenticated */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <PreLogin />}
      />
      
      {/* Auth route — accessible without pre-auth so team members can
          sign in directly (e.g. from /admin/my-work redirect). */}
      <Route path="/auth" element={<Auth />} />

      {/* Password reset landing for Supabase recovery & invite links */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Redirect old dashboard route to home */}
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      
      {/* App routes with layout - all require pre-authentication */}
      <Route element={
        <PreAuthGuard>
          <AppLayout />
        </PreAuthGuard>
      }>
        <Route path="/home" element={<Home />} />
        <Route path="/meetings" element={<Insights />} />
        <Route path="/insights" element={<Navigate to="/meetings" replace />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/reporting" element={<Reporting />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/deliverables" element={<Navigate to="/journal" replace />} />
        <Route path="/veille" element={<Veille />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/calendar" element={<EditorialCalendar />} />
        <Route path="/kpis" element={<KpiDashboard />} />
        <Route path="/seo-geo" element={<SeoGeo />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/my-work" element={
          <TeamAuthGate><MyWork /></TeamAuthGate>
        } />
        <Route path="/settings/profile" element={
          <TeamAuthGate><ProfileSettings /></TeamAuthGate>
        } />
        <Route path="/settings/integrations" element={<SettingsIntegrations />} />
        <Route path="/oauth/wrike/callback" element={<WrikeCallback />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DateRangeProvider>
        <ClientProvider>
          <PreAuthProvider>
            <TeamAuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TeamAuthProvider>
          </PreAuthProvider>
        </ClientProvider>
      </DateRangeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
