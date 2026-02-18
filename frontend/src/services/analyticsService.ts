import { apiRequest, API_CONFIG } from '../config/api';
import { getAccessToken } from '../utils/cookieStorage';

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

export interface HourlyBreakdown {
  hour: number;
  orderCount: number;
  revenue?: number;
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
   * @param startDate - Optional start date (ISO string or YYYY-MM-DD)
   * @param endDate - Optional end date (ISO string or YYYY-MM-DD)
   */
  getSummary: async (startDate?: string, endDate?: string): Promise<AnalyticsSummary> => {
    try {
      const token = getAccessToken();
      let url = `${API_CONFIG.ANALYTICS_ENDPOINT}/summary`;

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const query = params.toString();
      if (query) url += `?${query}`;

      return await apiRequest<AnalyticsSummary>(
        url,
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
      const token = getAccessToken();
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
      const token = getAccessToken();
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
      const token = getAccessToken();
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
   * GET /api/admin/analytics/hourly
   * Hourly order breakdown (actual data, not forecast)
   */
  getHourlyOrders: async (): Promise<HourlyBreakdown[]> => {
    try {
      const token = getAccessToken();
      return await apiRequest<HourlyBreakdown[]>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/hourly`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch hourly orders:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/health
   */
  getHealthLogs: async (): Promise<HealthLog[]> => {
    try {
      const token = getAccessToken();
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
