import { useSearchParams, Navigate } from 'react-router-dom';

export const RootRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');

  // If tableId present → customer QR flow
  if (tableId) {
    return <Navigate to={`/login?tableId=${tableId}`} replace />;
  }

  // No tableId → staff login flow
  return <Navigate to="/login?staff=true" replace />;
};
