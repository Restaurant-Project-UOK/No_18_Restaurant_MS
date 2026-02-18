import { apiRequest, API_CONFIG } from '../config/api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
}

export interface TopItem {
  name: string;
  count: number;
  revenue?: number;
}

export interface DailyForecast {
  date: string;
  predictedRevenue: number;
}

export interface HourlyForecast {
  hour: number;
  predictedOrders: number;
}

export interface HealthLog {
  timestamp: string;
  task: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

// ============================================
// ANALYTICS API ENDPOINTS (JWT Required)
// ============================================

export const analyticsService = {
  /**
   * GET /api/admin/analytics/summary
   */
  getSummary: async (): Promise<AnalyticsSummary> => {
    try {
      const token = localStorage.getItem('auth_access_token');
      return await apiRequest<AnalyticsSummary>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/summary`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch summary:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/top-items
   */
  getTopItems: async (): Promise<TopItem[]> => {
    try {
      const token = localStorage.getItem('auth_access_token');
      return await apiRequest<TopItem[]>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/top-items`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch top items:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/forecast/daily
   */
  getDailyForecast: async (): Promise<DailyForecast[]> => {
    try {
      const token = localStorage.getItem('auth_access_token');
      return await apiRequest<DailyForecast[]>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/forecast/daily`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch daily forecast:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/forecast/hourly
   */
  getHourlyForecast: async (): Promise<HourlyForecast[]> => {
    try {
      const token = localStorage.getItem('auth_access_token');
      return await apiRequest<HourlyForecast[]>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/forecast/hourly`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch hourly forecast:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/health
   */
  getHealthLogs: async (): Promise<HealthLog[]> => {
    try {
      const token = localStorage.getItem('auth_access_token');
      return await apiRequest<HealthLog[]>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/health`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch health logs:', error);
      throw error;
    }
  },
};
