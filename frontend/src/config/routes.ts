// Route configuration with roles and metadata
export const ROUTES = {
  // Public routes
  LOGIN: {
    path: "/login",
    name: "Login",
    public: true,
  },
  REGISTER: {
    path: "/register",
    name: "Register",
    public: true,
  },

  // Shared routes
  MENU: {
    path: "/menu",
    name: "Menu",
    public: false,
    requiredRoles: [1, 2, 3], // All authenticated users (kitchen read-only)
  },
  PROFILE: {
    path: "/profile",
    name: "Profile",
    public: false,
    requiredRoles: [1, 2, 3], // All roles can edit their own profile
  },

  // Customer-only routes (role: 1)
  ORDER: {
    path: "/order",
    name: "Orders",
    public: false,
    requiredRoles: [1], // Customers only
  },

  // Admin-only routes (role: 2)
  ADMIN_DASHBOARD: {
    path: "/admin/dashboard",
    name: "Admin Dashboard",
    public: false,
    requiredRoles: [2],
  },
  ADMIN_MENU: {
    path: "/admin/menu",
    name: "Menu Management",
    public: false,
    requiredRoles: [2],
  },

  ADMIN_STAFF: {
    path: "/admin/staff",
    name: "Staff Management",
    public: false,
    requiredRoles: [2],
  },

  // Kitchen-only routes (role: 3)
  KITCHEN_ORDERS: {
    path: "/kitchen/orders",
    name: "Order Queue",
    public: false,
    requiredRoles: [3],
  },

  // Error routes
  NOT_FOUND: {
    path: "/404",
    name: "Not Found",
    public: true,
  },
  UNAUTHORIZED: {
    path: "/unauthorized",
    name: "Unauthorized",
    public: true,
  },
};

// Helper function to navigate with table ID
export function getPathWithTableId(path: string, tableId?: string | number): string {
  if (tableId) {
    return `${path}?tableId=${tableId}`;
  }
  return path;
}

// Get route by path
export function getRouteByPath(path: string) {
  return Object.values(ROUTES).find((route) => route.path === path);
}

// Get navigation items for a specific role
export function getNavigation(role?: number) {
  const navigationMap: Record<number, typeof ROUTES[keyof typeof ROUTES][]> = {
    1: [ROUTES.MENU, ROUTES.ORDER, ROUTES.PROFILE], // Customer
    2: [ROUTES.ADMIN_DASHBOARD, ROUTES.ADMIN_MENU, ROUTES.PROFILE], // Admin
    3: [ROUTES.KITCHEN_ORDERS, ROUTES.MENU, ROUTES.PROFILE], // Kitchen
  };
  return navigationMap[role || 1] || [];
}
