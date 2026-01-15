import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context
import { AuthProvider } from "./contexts/AuthContext";
import { SimulationProvider } from "./contexts/SimulationContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth Pages
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import PoliceLogin from "./pages/auth/PoliceLogin";

// Dashboards
import TouristDashboard from "./pages/dashboards/tourist/TouristDashboard";
import PoliceDashboard from "./pages/dashboards/police/PoliceDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SimulationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/police/login" element={<PoliceLogin />} />
              
              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TouristDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/police/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['police', 'admin']}>
                    <PoliceDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SimulationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
