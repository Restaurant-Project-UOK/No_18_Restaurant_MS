import { useAuth } from '../context/AuthContext';
import CustomerProfilePage from './customer/ProfilePage';
import StaffProfilePage from './staff/ProfilePage';
import { Navigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role 1 = Customer
  // Roles 2, 3, 4 = Staff (Admin, Kitchen, Waiter)
  return user.role === 1 ? <CustomerProfilePage /> : <StaffProfilePage />;
}

