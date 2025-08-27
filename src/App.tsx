
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { PaymentSuccess } from "./components/PaymentSuccess";

const queryClient = new QueryClient();

/**
 * Main App component - Root of the FreightFusion Driver Portal
 * 
 * Architecture:
 * - QueryClient: React Query for server state management
 * - TooltipProvider: Global tooltip context for UI components
 * - Toaster/Sonner: Toast notification systems
 * - AuthProvider: Authentication context and JWT token management
 * - BrowserRouter: Client-side routing
 * 
 * Route Structure:
 * - / : Auto-redirect to dashboard (authenticated users)
 * - /login : Authentication page
 * - /register : Organization registration
 * - /dashboard : Main application (protected)
 * - /payment/success : Payment completion pages (protected)
 * - * : 404 Not Found fallback
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Toast notification systems for user feedback */}
      <Toaster />
      <Sonner />
      
      {/* Authentication context wrapper */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect to dashboard for authenticated users */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Public authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected application routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Payment success pages - handle Stripe redirects */}
            <Route 
              path="/payment/success" 
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/success/session/:sessionId" 
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 fallback for unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
