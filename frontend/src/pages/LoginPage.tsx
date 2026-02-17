import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdRestaurant, MdLogin, MdQrCode2 } from 'react-icons/md';

export default function LoginPage() {
  const [email, setEmail] = useState('customer@restaurant.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const staffParam = searchParams.get('staff');
  const isStaffLogin = !tableId || staffParam === 'true'; // Staff if no tableId or staff param is true

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // Redirect based on role, preserving tableId for customers
      if (email === 'admin@restaurant.com') {
        navigate('/admin');
      } else if (email === 'kitchen@restaurant.com') {
        navigate('/kitchen');
      } else if (email === 'waiter@restaurant.com') {
        navigate('/waiter');
      } else {
        // Customer redirect - preserve tableId if present
        navigate(tableId ? `/customer?tableId=${tableId}` : '/customer');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand-darker flex items-center justify-center p-6">
      {/* STAFF LOGIN - DESKTOP FIRST */}
      {isStaffLogin ? (
        <div className="w-full max-w-md mx-auto">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-primary rounded-lg mb-6">
              <MdRestaurant className="text-5xl text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-2">Restaurant Pro</h1>
            <p className="text-gray-400 text-lg">Staff Portal</p>
          </div>

          {/* Main Content - Centered Form */}
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
                      <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-300">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                        placeholder="staff@restaurant.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-300">
                        Password
                      </label>
                      <input
                        id="password"
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
        </div>
      ) : (
        /* CUSTOMER LOGIN - MOBILE FIRST */
        <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary rounded-lg mb-4">
            <MdRestaurant className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-bold">Restaurant Pro</h1>
          <p className="text-gray-400 mt-2">Customer Service</p>
        </div>

        {/* QR Code Access Info */}
        {tableId && (
          <div className="bg-brand-primary/20 border border-brand-primary rounded-lg p-4 mb-6 flex items-start gap-3">
            <MdQrCode2 className="text-2xl text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-primary mb-1">QR Code Access</p>
              <p className="text-xs text-gray-300">Table {tableId} - Sign in or create a new account to get started</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="card space-y-6 mb-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-3 text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-3 text-gray-300">
              Password
            </label>
            <input
              id="password"
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

        {/* Register Link - Only for Customer QR Access */}
        {!isStaffLogin && (
          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 mb-3">Don't have an account?</p>
            <button
              onClick={() => navigate(`/register?tableId=${tableId}`)}
              className="text-brand-primary hover:text-brand-primary/80 font-semibold transition-colors"
            >
              Create Account
            </button>
          </div>
        )}


      </div>
      )}
    </div>
  );
}

