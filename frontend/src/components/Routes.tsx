import { ReactNode } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = '/login',
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

interface RoleBasedRouteProps {
  children: ReactNode;
  roles: number[];
  fallback?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  roles,
  fallback = '/login',
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={fallback} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

interface QRProtectedRouteProps {
  children: ReactNode;
  roles: number[];
}

export const QRProtectedRoute: React.FC<QRProtectedRouteProps> = ({
  children,
  roles,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');

  // No tableId in URL = invalid QR access
  if (!tableId) {
    return <Navigate to="/login" replace />;
  }

  // Not authenticated = redirect to login with tableId
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?tableId=${tableId}`} replace />;
  }

  // Wrong role
  if (!roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

