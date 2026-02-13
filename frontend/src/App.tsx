import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TableProvider } from "./context/TableContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/auth/Profile";
import Menu from "./pages/menu/Menu";
import Order from "./pages/order/Order";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenuManagement from "./pages/admin/AdminMenuManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TableProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/order" element={<Order />} />

              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute requiredRoles={[2]}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/admin/menu"
                element={
                  <RoleProtectedRoute requiredRoles={[2]}>
                    <AdminMenuManagement />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/admin/staff"
                element={
                  <RoleProtectedRoute requiredRoles={[2]}>
                    <StaffManagement />
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </CartProvider>
        </TableProvider>
      </AuthProvider>
    </Router>
  );
}