import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { MdRestaurant, MdLogin, MdQrCode2 } from 'react-icons/md';

// ============================================================
// Helpers
// ============================================================

/** Decode a JWT payload (client-side, no signature verification) */
const decodeJwt = (token: string): Record<string, unknown> => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
};

/** Returns true if the JWT is present and not expired */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  const payload = decodeJwt(token);
  const exp = Number(payload.exp ?? 0);
  return exp > Date.now() / 1000;
};

/** Store tableId as a cookie valid for 5 hours */
const setTableIdCookie = (tableId: number) => {
  const expires = new Date(Date.now() + 5 * 60 * 60 * 1000).toUTCString();
  document.cookie = `tableId=${tableId}; expires=${expires}; path=/; SameSite=Lax`;
};

/** Get the dashboard path for a given role number */
const dashboardForRole = (role: number, tableId?: number | null): string => {
  if (role === 2) return '/admin';
  if (role === 3) return '/kitchen';
  if (role === 4) return '/waiter';
  // Customer (role === 1)
  return tableId ? `/customer?tableId=${tableId}` : '/customer';
};

// ============================================================
// Component
// ============================================================

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tableIdParam = searchParams.get('tableId');
  const staffParam = searchParams.get('staff');
  // Staff login: no tableId in URL, or explicit ?staff=true
  const isStaffLogin = !tableIdParam || staffParam === 'true';

  // ----------------------------------------------------------
  // On mount: check existing session, try refresh if needed
  // Priority: valid access token → refresh token → show form
  // ----------------------------------------------------------
  useEffect(() => {
    const handleExistingSession = async () => {
      const accessToken = localStorage.getItem('auth_access_token');
      const refreshToken = localStorage.getItem('auth_refresh_token');

      // Helper: redirect based on a valid access token
      const redirectFromToken = (token: string): boolean => {
        const payload = decodeJwt(token);
        const role = Number(payload.role ?? 1);
        const jwtTableId = Number(payload.tableId ?? 0);

        // Customer scanning a DIFFERENT table → must re-authenticate
        if (role === 1 && tableIdParam) {
          const newTableId = parseInt(tableIdParam, 10);
          if (newTableId !== jwtTableId) return false; // show form
          setTableIdCookie(newTableId);
          navigate(dashboardForRole(1, newTableId), { replace: true });
          return true;
        }

        const resolvedTableId = jwtTableId > 0 ? jwtTableId : null;
        if (resolvedTableId) setTableIdCookie(resolvedTableId);
        navigate(dashboardForRole(role, resolvedTableId), { replace: true });
        return true;
      };

      // 1️⃣ Access token is still valid — redirect immediately (no network call)
      if (isTokenValid(accessToken)) {
        if (redirectFromToken(accessToken!)) return;
        setCheckingToken(false);
        return;
      }

      // 2️⃣ Access token expired — try refresh token silently
      if (refreshToken) {
        try {
          const refreshed = await authService.refreshAccessToken({ refreshToken });
          localStorage.setItem('auth_access_token', refreshed.accessToken);
          if (redirectFromToken(refreshed.accessToken)) return;
        } catch {
          // Refresh failed (expired/revoked) — clear stale tokens
          localStorage.removeItem('auth_access_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_user_id');
        }
      }

      // 3️⃣ No valid session — show the login form
      // If user navigated to /login directly but was previously on customer flow, 
      // check if we should show customer login instead of default staff logic
      const storedTableId = document.cookie.match(/(?:^|;\s*)tableId=(\d+)/)?.[1];
      if (storedTableId && !tableIdParam && !staffParam) {
        // Redirect to customer login with tableId if we have a cookie but no URL param
        // This prevents falling back to "staff login" view by default
        navigate(`/login?tableId=${storedTableId}`, { replace: true });
        return;
      }
      setCheckingToken(false);
    };

    handleExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------
  // Form submit handler
  // ----------------------------------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tableIdFromUrl = tableIdParam ? parseInt(tableIdParam, 10) : undefined;

      // If a customer already has a valid token but scanned a NEW table QR,
      // we need fresh tokens with the new tableId embedded.
      // We call authService.login directly to get the raw token response,
      // then update localStorage and AuthContext state via the normal login flow.
      await login(email, password, tableIdFromUrl);

      // Read role and tableId from the freshly stored JWT
      const token = localStorage.getItem('auth_access_token') || '';
      const payload = decodeJwt(token);
      const role = Number(payload.role ?? 1);
      const jwtTableId = Number(payload.tableId ?? 0);

      // Store tableId cookie (URL param takes priority over JWT claim)
      const resolvedTableId = tableIdFromUrl || (jwtTableId > 0 ? jwtTableId : null);
      if (resolvedTableId) setTableIdCookie(resolvedTableId);

      navigate(dashboardForRole(role, resolvedTableId), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // While checking existing token, show a minimal spinner
  // ----------------------------------------------------------
  if (checkingToken) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Login form
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-darker flex items-center justify-center p-6">
      {/* STAFF LOGIN */}
      {isStaffLogin ? (
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-primary rounded-lg mb-6">
              <MdRestaurant className="text-5xl text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-2">Restaurant Pro</h1>
            <p className="text-gray-400 text-lg">Staff Portal</p>
          </div>

          <form onSubmit={handleLogin} className="card space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Staff Login</h2>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="staff-email" className="block text-sm font-semibold mb-2 text-gray-300">
                    Email Address
                  </label>
                  <input
                    id="staff-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="staff@restaurant.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="staff-password" className="block text-sm font-semibold mb-2 text-gray-300">
                    Password
                  </label>
                  <input
                    id="staff-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-brand-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-lg mt-2"
                >
                  <MdLogin className="text-xl" />
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </div>
          </form>

          <div className="text-center pt-8 border-t border-brand-border mt-8">
            <p className="text-xs text-gray-500 mb-2">Customer Access</p>
            <button
              onClick={() => navigate('/login?tableId=' + (document.cookie.match(/(?:^|;\s*)tableId=(\d+)/)?.[1] || '1'))}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <MdRestaurant /> Customer Login
            </button>
          </div>
        </div>
      ) : (
        /* CUSTOMER LOGIN */
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-lg mb-4">
              <MdRestaurant className="text-4xl text-white" />
            </div>
            <h1 className="text-4xl font-bold">Restaurant Pro</h1>
            <p className="text-gray-400 mt-2">Customer Service</p>
          </div>

          {tableIdParam && (
            <div className="bg-brand-primary/20 border border-brand-primary rounded-lg p-4 mb-6 flex items-start gap-3">
              <MdQrCode2 className="text-2xl text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-primary mb-1">QR Code Access</p>
                <p className="text-xs text-gray-300">
                  Table {tableIdParam} — Sign in or create a new account to get started
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="card space-y-6 mb-6">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="customer-email" className="block text-sm font-semibold mb-3 text-gray-300">
                Email Address
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="customer-password" className="block text-sm font-semibold mb-3 text-gray-300">
                Password
              </label>
              <input
                id="customer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MdLogin />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 mb-3">Don't have an account?</p>
            <button
              onClick={() => navigate(`/register?tableId=${tableIdParam}`)}
              className="text-brand-primary hover:text-brand-primary/80 font-semibold transition-colors"
            >
              Create Account
            </button>
          </div>

          <div className="text-center pt-8 border-t border-brand-border">
            <p className="text-xs text-gray-500 mb-2">Employee Access</p>
            <button
              onClick={() => navigate('/login?staff=true')}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <MdLogin /> Staff Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
