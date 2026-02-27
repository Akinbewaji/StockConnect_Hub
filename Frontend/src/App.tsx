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
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
