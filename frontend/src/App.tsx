import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { TableProvider } from './context/TableContext';
import { RoleBasedRoute, QRProtectedRoute } from './components/Routes';
import { RootRedirect } from './components/RootRedirect';
import { ChatbotWidget } from './components/ChatbotWidget';

// Pages
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CustomerHomePage from './pages/customer/HomePage';
import CustomerRegisterPage from './pages/customer/RegisterPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import KitchenDashboardPage from './pages/kitchen/DashboardPage';
import WaiterDashboardPage from './pages/waiter/DashboardPage';

export function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Chatbot: injected for all authenticated roles, removed on logout */}
        <ChatbotWidget />
        <OrderProvider>
          <MenuProvider>
            <CartProvider>
              <TableProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<CustomerRegisterPage />} />

                  {/* Customer Routes (QR Code Protected - Role: 1) */}
                  <Route
                    path="/customer/*"
                    element={
                      <QRProtectedRoute roles={[1]}>
                        <CustomerHomePage />
                      </QRProtectedRoute>
                    }
                  />

                  {/* Profile Route (All authenticated users) */}
                  <Route
                    path="/profile"
                    element={
                      <RoleBasedRoute roles={[1, 2, 3, 4]}>
                        <ProfilePage />
                      </RoleBasedRoute>
                    }
                  />

                  {/* Admin Routes (Role: 2) */}
                  <Route
                    path="/admin/*"
                    element={
                      <RoleBasedRoute roles={[2]}>
                        <AdminDashboardPage />
                      </RoleBasedRoute>
                    }
                  />

                  {/* Kitchen Routes (Role: 2, 3) */}
                  <Route
                    path="/kitchen/*"
                    element={
                      <RoleBasedRoute roles={[2, 3]}>
                        <KitchenDashboardPage />
                      </RoleBasedRoute>
                    }
                  />

                  {/* Waiter Routes (Role: 2, 4) */}
                  <Route
                    path="/waiter/*"
                    element={
                      <RoleBasedRoute roles={[2, 4]}>
                        <WaiterDashboardPage />
                      </RoleBasedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </TableProvider>
            </CartProvider>
          </MenuProvider>
        </OrderProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
