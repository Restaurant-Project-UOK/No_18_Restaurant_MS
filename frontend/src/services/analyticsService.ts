import { apiRequest, API_CONFIG } from '../config/api';
import { getAccessToken } from '../utils/cookieStorage';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DailySummary {
  date: string;
  total_revenue: string;
  order_count: number;
  average_order_value: string;
}

export interface DailySummaryResponse {
  daily_summaries: DailySummary[];
  total_records: number;
}

export interface TopItem {
  item_id: number;
  item_name: string;
  total_quantity: number;
  total_revenue: string;
}

export interface TopItemsResponse {
  top_items: TopItem[];
  total_items: number;
}

export interface ForecastItem {
  forecast_date: string;
  forecast_value: string;
  forecast_type: string;
}

export interface ForecastResponse {
  forecasts: ForecastItem[];
  total_forecasts: number;
}

export interface HourlyBreakdown {
  hour: number;
  order_count: number;
  revenue?: string;
}

export interface HourlyResponse {
  hourly_data: HourlyBreakdown[];
  total_records: number;
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
  getSummary: async (startDate?: string, endDate?: string): Promise<DailySummaryResponse> => {
    try {
      const token = getAccessToken();
      let url = `${API_CONFIG.ANALYTICS_ENDPOINT}/summary`;

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const query = params.toString();
      if (query) url += `?${query}`;

      return await apiRequest<DailySummaryResponse>(
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
  getTopItems: async (): Promise<TopItemsResponse> => {
    try {
      const token = getAccessToken();
      return await apiRequest<TopItemsResponse>(
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
  getDailyForecast: async (): Promise<ForecastResponse> => {
    try {
      const token = getAccessToken();
      return await apiRequest<ForecastResponse>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/forecast/daily`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch daily forecast:', error);
      throw error;
    }
  },

  /**
   * GET /api/admin/analytics/hourly
   * Hourly order breakdown (actual data)
   */
  getHourlyOrders: async (): Promise<HourlyResponse> => {
    try {
      const token = getAccessToken();
      return await apiRequest<HourlyResponse>(
        `${API_CONFIG.ANALYTICS_ENDPOINT}/hourly`,
        { jwt: token || undefined }
      );
    } catch (error) {
      console.error('[analyticsService] Failed to fetch hourly orders:', error);
      throw error;
    }
  },
};

