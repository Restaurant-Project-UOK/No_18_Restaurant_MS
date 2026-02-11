import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../config/routes";
import "./admin.css";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call to getAdminDashboard()
        // For now, using mock data
        setStats({
          totalOrders: 42,
          totalRevenue: 125000,
          activeUsers: 28,
          pendingOrders: 5,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-container">
        <h2>Admin Dashboard</h2>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.fullName || "Admin"}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
          <span className="stat-label">All-time orders</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <h3>Total Revenue</h3>
          <p className="stat-value">රු {stats.totalRevenue.toLocaleString()}</p>
          <span className="stat-label">All-time revenue</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>Active Users</h3>
          <p className="stat-value">{stats.activeUsers}</p>
          <span className="stat-label">Registered users</span>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <h3>Pending Orders</h3>
          <p className="stat-value">{stats.pendingOrders}</p>
          <span className="stat-label">Needs attention</span>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button
            className="action-button"
            onClick={() => navigate(ROUTES.ADMIN_MENU.path)}
          >
            <span className="action-icon">⚙️</span>
            <span className="action-text">Manage Menu Items</span>
            <span className="action-desc">Add, edit, or delete menu items</span>
          </button>

          <button
            className="action-button"
            onClick={() => navigate(ROUTES.MENU.path)}
          >
            <span className="action-icon">📜</span>
            <span className="action-text">View All Orders</span>
            <span className="action-desc">See complete order history</span>
          </button>

          <button className="action-button" onClick={() => navigate(ROUTES.PROFILE.path)}>
            <span className="action-icon">👤</span>
            <span className="action-text">Edit Profile</span>
            <span className="action-desc">Update your account information</span>
          </button>

          <button className="action-button">
            <span className="action-icon">📱</span>
            <span className="action-text">Manage Users</span>
            <span className="action-desc">View and manage customer accounts</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>System Information</h2>
        <div className="info-box">
          <p>
            <strong>Admin Role:</strong> You have full access to all restaurant management
            features including menu management, order tracking, and user administration.
          </p>
          <p>
            <strong>Current Features:</strong> Dashboard statistics, menu management, and order
            history are available.
          </p>
          <p>
            <strong>Note:</strong> Additional admin features like detailed analytics, user
            management, and reports can be implemented as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
