import { ReactNode } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Read tableId from cookie (set at login with 5h expiry) */
const getTableIdFromCookie = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)tableId=(\d+)/);
  return match ? match[1] : null;
};

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
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  }

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
  const { isAuthenticated, user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  // Resolve tableId: URL param takes priority, then cookie fallback
  const tableIdFromUrl = searchParams.get('tableId');
  const tableIdFromCookie = getTableIdFromCookie();
  const tableId = tableIdFromUrl || tableIdFromCookie;

  // No tableId anywhere = invalid QR access
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
