import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Inventory from "./pages/admin/Inventory";
import StockManagement from "./pages/admin/StockManagement";
import POS from "./pages/admin/POS";
import Customers from "./pages/admin/Customers";
import Loyalty from "./pages/admin/Loyalty";
import Campaigns from "./pages/admin/Campaigns";
import Settings from "./pages/admin/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import BusinessOnboarding from "./pages/auth/BusinessOnboarding";

function TitleManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.businessName) {
      document.title = `${user.businessName} - IMCEP`;
    } else {
      document.title = "IMCEP";
    }
  }, [user]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // If user is logged in but not onboarded, and not already on onboarding page
  if (user && !user.onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <TitleManager />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <BusinessOnboarding />
              </ProtectedRoute>
            } 
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="pos" element={<POS />} />
            <Route path="customers" element={<Customers />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
