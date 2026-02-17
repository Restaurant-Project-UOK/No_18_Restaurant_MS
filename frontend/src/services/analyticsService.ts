// Analytics Service - Mock implementation for now
// TODO: Replace with real API calls when backend is ready

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

// Mock data generators
const generateMockSummary = (): AnalyticsSummary => {
  return {
    totalRevenue: 5247.89,
    totalOrders: 143,
  };
};

const generateMockTopItems = (): TopItem[] => {
  return [
    { name: 'Grilled Salmon', count: 45, revenue: 1304.55 },
    { name: 'Ribeye Steak', count: 38, revenue: 1367.62 },
    { name: 'Chicken Alfredo', count: 32, revenue: 767.68 },
    { name: 'Caesar Salad', count: 28, revenue: 363.72 },
    { name: 'Margherita Pizza', count: 25, revenue: 449.75 },
    { name: 'Tiramisu', count: 22, revenue: 197.78 },
    { name: 'Bruschetta', count: 19, revenue: 189.81 },
    { name: 'House Wine', count: 18, revenue: 269.82 },
  ];
};

const generateMockDailyForecast = (): DailyForecast[] => {
  const forecasts: DailyForecast[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Weekend gets higher predictions
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRevenue = isWeekend ? 800 : 600;
    const variance = Math.random() * 200 - 100; // +/- 100
    
    forecasts.push({
      date: date.toISOString().split('T')[0],
      predictedRevenue: Math.round((baseRevenue + variance) * 100) / 100,
    });
  }
  
  return forecasts;
};

const generateMockHourlyForecast = (): HourlyForecast[] => {
  const forecasts: HourlyForecast[] = [];
  
  // Business hours: 11 AM - 11 PM
  for (let hour = 11; hour <= 23; hour++) {
    let predictedOrders = 5;
    
    // Lunch rush (12-2 PM)
    if (hour >= 12 && hour <= 14) {
      predictedOrders = 15 + Math.floor(Math.random() * 5);
    }
    // Dinner rush (6-8 PM)
    else if (hour >= 18 && hour <= 20) {
      predictedOrders = 20 + Math.floor(Math.random() * 5);
    }
    // Off-peak hours
    else {
      predictedOrders = 5 + Math.floor(Math.random() * 5);
    }
    
    forecasts.push({ hour, predictedOrders });
  }
  
  return forecasts;
};

const generateMockHealthLogs = (): HealthLog[] => {
  return [
    {
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      task: 'Order Processing',
      status: 'success',
      message: 'All orders processed successfully',
    },
    {
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      task: 'Payment Gateway',
      status: 'success',
      message: 'Payment gateway responding normally',
    },
    {
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      task: 'Database Backup',
      status: 'success',
      message: 'Daily backup completed',
    },
    {
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      task: 'Inventory Sync',
      status: 'warning',
      message: '3 items low in stock',
    },
    {
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      task: 'Email Service',
      status: 'success',
      message: '24 order confirmations sent',
    },
  ];
};

// API-like service methods (mock for now)
export const analyticsService = {
  // GET /api/admin/analytics/summary
  getSummary: async (): Promise<AnalyticsSummary> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockSummary();
  },

  // GET /api/admin/analytics/top-items
  getTopItems: async (): Promise<TopItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return generateMockTopItems();
  },

  // GET /api/admin/analytics/forecast/daily
  getDailyForecast: async (): Promise<DailyForecast[]> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return generateMockDailyForecast();
  },

  // GET /api/admin/analytics/forecast/hourly
  getHourlyForecast: async (): Promise<HourlyForecast[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockHourlyForecast();
  },

  // GET /api/admin/analytics/health
  getHealthLogs: async (): Promise<HealthLog[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return generateMockHealthLogs();
  },
};

// TODO: When backend is ready, replace with real API calls:
// export const analyticsService = {
//   getSummary: async (): Promise<AnalyticsSummary> => {
//     const response = await fetch('/api/admin/analytics/summary', {
//       headers: { Authorization: `Bearer ${getJWT()}` }
//     });
//     return response.json();
//   },
//   // ... other methods
// };
