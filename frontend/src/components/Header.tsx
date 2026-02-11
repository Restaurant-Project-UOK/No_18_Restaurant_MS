import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavigation } from "../config/routes";
import "./Header.css";

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const getRoleLabel = (role?: number): string => {
    switch (role) {
      case 1:
        return "Customer";
      case 2:
        return "Admin";
      case 3:
        return "Kitchen Staff";
      default:
        return "User";
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const getRoleHomeRoute = (role?: number): string => {
    switch (role) {
      case 2:
        return "/admin/dashboard";
      case 3:
        return "/kitchen/orders";
      default:
        return "/menu";
    }
  };

  const navItems = getNavigation(user?.role);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="logo" onClick={() => navigate(getRoleHomeRoute(user?.role))}>
            🍽️ Restaurant
          </h1>
        </div>

        <nav className="header-nav">
          {navItems.map((route) => {
            const getIcon = (path: string) => {
              if (path.includes("admin/dashboard")) return "📊";
              if (path.includes("admin/menu")) return "⚙️";
              if (path.includes("kitchen/orders")) return "🍳";
              if (path.includes("menu")) return "📋";
              if (path.includes("order")) return "🛒";
              if (path.includes("profile")) return "👤";
              return "📌";
            };

            return (
              <button
                key={route.path}
                className="nav-link"
                onClick={() => navigate(route.path)}
                title={route.name}
              >
                {getIcon(route.path)} {route.name}
              </button>
            );
          })}
        </nav>

        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.fullName || "User"}</span>
            <span className="user-role">{getRoleLabel(user?.role)}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </header>
  );
}
