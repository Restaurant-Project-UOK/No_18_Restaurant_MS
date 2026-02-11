/**
 * Centralized API Configuration
 *
 * Loads all API service URLs from environment variables with fallbacks.
 * This allows for environment-specific configurations (dev/prod) without
 * modifying code.
 */

interface ApiConfig {
  gateway: string;
  auth: string;
  menu: string;
  order: string;
  admin: string;
  kitchen: string;
}

const getConfig = (): ApiConfig => ({
  gateway:
    import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080/api',
  auth:
    import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8080/api',
  menu:
    import.meta.env.VITE_MENU_SERVICE_URL || 'http://localhost:8080/api',
  order:
    import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:8080/api',
  admin:
    import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8080/api',
  kitchen:
    import.meta.env.VITE_KITCHEN_SERVICE_URL || 'http://localhost:8080/api',
});

export const apiConfig = getConfig();

// Log configuration in development mode for debugging
if (import.meta.env.DEV) {
  console.log('[API Config] Loaded configuration:', {
    gateway: apiConfig.gateway,
    auth: apiConfig.auth,
    menu: apiConfig.menu,
    order: apiConfig.order,
    admin: apiConfig.admin,
    kitchen: apiConfig.kitchen,
  });
}
