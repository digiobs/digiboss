import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { PreAuthProvider, usePreAuth } from "@/contexts/PreAuthContext";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import PreLogin from "@/pages/PreLogin";
import Dashboard from "@/pages/Dashboard";
import Insights from "@/pages/Insights";
import Prospects from "@/pages/Prospects";
import Plan from "@/pages/Plan";
import ContentCreator from "@/pages/ContentCreator";
import Assets from "@/pages/Assets";
import Reporting from "@/pages/Reporting";
import Chat from "@/pages/Chat";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper that checks pre-authentication
function PreAuthGuard({ children }: { children: React.ReactNode }) {
  const { isPreAuthenticated } = usePreAuth();
  
  if (!isPreAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

const AppRoutes = () => {
  const { isPreAuthenticated } = usePreAuth();

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />
      
      {/* Pre-auth login route - redirects to dashboard if already authenticated */}
      <Route 
        path="/login" 
        element={isPreAuthenticated ? <Navigate to="/dashboard" replace /> : <PreLogin />} 
      />
      
      {/* Auth route requires pre-authentication */}
      <Route path="/auth" element={
        <PreAuthGuard>
          <Auth />
        </PreAuthGuard>
      } />
      
      {/* App routes with layout - all require pre-authentication */}
      <Route element={
        <PreAuthGuard>
          <AppLayout />
        </PreAuthGuard>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/content" element={<ContentCreator />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/reporting" element={<Reporting />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
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
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </PreAuthProvider>
        </ClientProvider>
      </DateRangeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
