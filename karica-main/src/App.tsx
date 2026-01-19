import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConsumerRoute, PartnerRoute, AdminRoute } from "@/components/routing";
import { MobileLayout } from "@/components/MobileLayout";
import { SplashScreen } from "@/components/SplashScreen";
import { ScrollToTop } from "@/hooks/useScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerOnboardingCER from "./pages/PartnerOnboardingCER";
import PartnerOnboardingMarketplace from "./pages/PartnerOnboardingMarketplace";
import CER from "./pages/CER";
import Interventions from "./pages/Interventions";
import Gamification from "./pages/Gamification";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Marketplace from "./pages/Marketplace";
import Finance from "./pages/Finance";
import PartnerCRM from "./pages/PartnerCRM";
import PartnerAuth from "./pages/PartnerAuth";
import AdminAuth from "./pages/AdminAuth";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash was shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  return (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/partner-auth" element={<PartnerAuth />} />
              <Route path="/admin-karica-secure" element={<AdminAuth />} />
              
              {/* Consumer Onboarding */}
              <Route path="/onboarding" element={
                <ProtectedRoute allowedRoles={['consumer']}>
                  <Onboarding />
                </ProtectedRoute>
              } />
              
              {/* Consumer Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Index />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cer"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <CER />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interventions"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Interventions />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gamification"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Gamification />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Profile />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Messages />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Marketplace />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute allowedRoles={['consumer']}>
                    <MobileLayout>
                      <Finance />
                    </MobileLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Partner Onboarding */}
              <Route path="/partner-onboarding" element={
                <PartnerRoute skipOnboardingCheck>
                  <PartnerOnboarding />
                </PartnerRoute>
              } />
              <Route path="/partner-onboarding/cer" element={
                <PartnerRoute skipOnboardingCheck>
                  <PartnerOnboardingCER />
                </PartnerRoute>
              } />
              <Route path="/partner-onboarding/marketplace" element={
                <PartnerRoute skipOnboardingCheck>
                  <PartnerOnboardingMarketplace />
                </PartnerRoute>
              } />
              
              {/* Partner Routes */}
              <Route
                path="/partner-crm"
                element={
                  <PartnerRoute>
                    <PartnerCRM />
                  </PartnerRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="/admin-panel"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
