/**
 * Gateway Service - Wrapper around HTTP Client
 *
 * Provides high-level service-specific API calls with automatic:
 * - Service URL injection (from apiConfig)
 * - TableId injection from context
 * - Type safety
 * - Error handling
 *
 * Usage:
 * - gateway.auth.login(email, password)
 * - gateway.menu.fetchAll(tableId)
 * - gateway.order.create(data, tableId)
 * - gateway.admin.getDashboard(tableId)
 * - gateway.kitchen.getOrders(tableId)
 */

import { apiConfig } from '../config/api.config';
import {
  apiCall,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from './api/http-client';

/**
 * Create service-specific API methods with automatic baseUrl injection
 */
const createServiceClient = (serviceName: keyof typeof apiConfig) => {
  const baseUrl = apiConfig[serviceName];

  return {
    async get<T = any>(endpoint: string, tableId?: number | string) {
      return apiGet<T>(baseUrl, endpoint, tableId);
    },

    async post<T = any>(endpoint: string, body: any, tableId?: number | string) {
      return apiPost<T>(baseUrl, endpoint, body, tableId);
    },

    async put<T = any>(endpoint: string, body: any, tableId?: number | string) {
      return apiPut<T>(baseUrl, endpoint, body, tableId);
    },

    async delete<T = any>(endpoint: string, tableId?: number | string) {
      return apiDelete<T>(baseUrl, endpoint, tableId);
    },

    async call<T = any>(endpoint: string, options: any = {}) {
      return apiCall<T>(baseUrl, endpoint, options);
    },
  };
};

/**
 * Gateway object with service-specific clients
 * Each service has: get(), post(), put(), delete(), call() methods
 */
export const gateway = {
  auth: createServiceClient('auth'),
  menu: createServiceClient('menu'),
  order: createServiceClient('order'),
  admin: createServiceClient('admin'),
  kitchen: createServiceClient('kitchen'),
};

export default gateway;
