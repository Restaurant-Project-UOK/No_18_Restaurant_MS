import { MenuItem, MenuCategory } from '../types';
import { MOCK_MENU_ITEMS, MENU_CATEGORIES } from '../data/mockData';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  preparationTime: number;
  ingredients?: string[];
  allergens?: string[];
}

export interface CreateMenuItemWithImageRequest extends CreateMenuItemRequest {
  image: File;
}

// ============================================
// MOCK DATA PERSISTENCE
// ============================================

// In-memory storage for menu items (simulates database)
let mockMenuItems: MenuItem[] = [...MOCK_MENU_ITEMS];
let mockCategories: MenuCategory[] = [...MENU_CATEGORIES];
let nextMenuItemId = mockMenuItems.length + 1;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simulates API delay for realistic behavior
 */
const simulateDelay = (min: number = 200, max: number = 500): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * Simulates JWT token validation (mock)
 * In production, this will validate the actual JWT and extract user role
 */
const validateAdminToken = (token?: string): boolean => {
  // Mock validation: check if token exists and contains "admin"
  // In production, decode JWT and check role === UserRole.ADMIN
  if (!token) {
    console.warn('[menuService] No JWT token provided for admin endpoint');
    return false;
  }
  
  // Mock: assume token format is "Bearer_ROLE_userId"
  const hasAdminRole = token.toLowerCase().includes('admin');
  if (!hasAdminRole) {
    console.warn('[menuService] User does not have admin privileges');
  }
  return hasAdminRole;
};

/**
 * Converts File to base64 data URL for mock storage
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

/**
 * GET /api/menu
 * Returns all menu items (available for customer, admin, waiter)
 */
const getAllMenuItems = async (): Promise<MenuItem[]> => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch('/api/menu');
  // return response.json();
  
  return [...mockMenuItems];
};

/**
 * GET /api/categories
 * Returns all menu categories (available for customer, admin, waiter)
 */
const getAllCategories = async (): Promise<MenuCategory[]> => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch('/api/categories');
  // return response.json();
  
  return [...mockCategories];
};

/**
 * GET /api/media/{id}
 * Returns media URL for a given ID
 * Note: In real API, this returns binary image data. In mock, returns URL.
 */
const getMediaById = async (id: string): Promise<string> => {
  await simulateDelay(100, 300);
  
  // TODO: Replace with real API call
  // const response = await fetch(`/api/media/${id}`);
  // const blob = await response.blob();
  // return URL.createObjectURL(blob);
  
  // Mock: Return placeholder image URL
  return `https://via.placeholder.com/400x300.png?text=Food+${id}`;
};

// ============================================
// ADMIN ENDPOINTS (JWT Required)
// ============================================

/**
 * POST /api/admin/menu/with-image
 * Creates a new menu item with image upload (Admin only)
 * 
 * @param formData - FormData containing menuItem (JSON) and image (File)
 * @param jwtToken - JWT token for authentication
 * @returns Created MenuItem object
 */
const createMenuItemWithImage = async (
  formData: FormData,
  jwtToken?: string
): Promise<MenuItem> => {
  await simulateDelay(300, 600);
  
  // Validate admin token
  if (!validateAdminToken(jwtToken)) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // TODO: Replace with real API call
  // const response = await fetch('/api/admin/menu/with-image', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${jwtToken}`,
  //   },
  //   body: formData,
  // });
  // if (!response.ok) throw new Error('Failed to create menu item');
  // return response.json();
  
  // Extract data from FormData
  const menuItemJson = formData.get('menuItem') as string;
  const imageFile = formData.get('image') as File;
  
  if (!menuItemJson || !imageFile) {
    throw new Error('Missing required fields: menuItem or image');
  }
  
  const menuItemData: CreateMenuItemRequest = JSON.parse(menuItemJson);
  
  // Convert image to data URL (mock storage)
  const imageUrl = await fileToDataUrl(imageFile);
  
  // Create new menu item
  const newMenuItem: MenuItem = {
    id: `menu-${nextMenuItemId++}`,
    name: menuItemData.name,
    description: menuItemData.description,
    category: menuItemData.category,
    price: menuItemData.price,
    image: imageUrl, // In production, this will be the image URL from server
    available: menuItemData.available,
    preparationTime: menuItemData.preparationTime,
    ingredients: menuItemData.ingredients || [],
    allergens: menuItemData.allergens || [],
  };
  
  // Add to mock database
  mockMenuItems.push(newMenuItem);
  
  console.log('[menuService] Created new menu item:', newMenuItem.id);
  return newMenuItem;
};

/**
 * PATCH /api/admin/menu/{id}/availability?isActive={true|false}
 * Toggles menu item availability (Admin only)
 * 
 * @param id - Menu item ID
 * @param isActive - New availability status
 * @param jwtToken - JWT token for authentication
 */
const updateMenuItemAvailability = async (
  id: string,
  isActive: boolean,
  jwtToken?: string
): Promise<void> => {
  await simulateDelay();
  
  // Validate admin token
  if (!validateAdminToken(jwtToken)) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // TODO: Replace with real API call
  // const response = await fetch(`/api/admin/menu/${id}/availability?isActive=${isActive}`, {
  //   method: 'PATCH',
  //   headers: {
  //     Authorization: `Bearer ${jwtToken}`,
  //   },
  // });
  // if (!response.ok) throw new Error('Failed to update availability');
  
  // Update in mock database
  const itemIndex = mockMenuItems.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error(`Menu item not found: ${id}`);
  }
  
  mockMenuItems[itemIndex].available = isActive;
  console.log(`[menuService] Updated availability for ${id}: ${isActive}`);
};

/**
 * DELETE /api/admin/menu/{id}
 * Deletes a menu item (Admin only)
 * 
 * @param id - Menu item ID to delete
 * @param jwtToken - JWT token for authentication
 */
const deleteMenuItem = async (id: string, jwtToken?: string): Promise<void> => {
  await simulateDelay();
  
  // Validate admin token
  if (!validateAdminToken(jwtToken)) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // TODO: Replace with real API call
  // const response = await fetch(`/api/admin/menu/${id}`, {
  //   method: 'DELETE',
  //   headers: {
  //     Authorization: `Bearer ${jwtToken}`,
  //   },
  // });
  // if (!response.ok) throw new Error('Failed to delete menu item');
  
  // Remove from mock database
  const itemIndex = mockMenuItems.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error(`Menu item not found: ${id}`);
  }
  
  mockMenuItems.splice(itemIndex, 1);
  console.log(`[menuService] Deleted menu item: ${id}`);
};

// ============================================
// ADDITIONAL HELPER (For MenuContext)
// ============================================

/**
 * Updates a menu item (for local state management)
 * This is NOT an API endpoint, but a helper for MenuContext
 */
const updateMenuItem = (id: string, updates: Partial<MenuItem>): void => {
  const itemIndex = mockMenuItems.findIndex((item) => item.id === id);
  if (itemIndex !== -1) {
    mockMenuItems[itemIndex] = { ...mockMenuItems[itemIndex], ...updates };
    console.log(`[menuService] Updated menu item: ${id}`);
  }
};

/**
 * Resets mock data to initial state (for testing)
 */
const resetMockData = (): void => {
  mockMenuItems = [...MOCK_MENU_ITEMS];
  mockCategories = [...MENU_CATEGORIES];
  nextMenuItemId = mockMenuItems.length + 1;
  console.log('[menuService] Mock data reset to initial state');
};

// ============================================
// EXPORTED SERVICE
// ============================================

export const menuService = {
  // Public endpoints (no auth)
  getAllMenuItems,
  getAllCategories,
  getMediaById,
  
  // Admin endpoints (JWT required)
  createMenuItemWithImage,
  updateMenuItemAvailability,
  deleteMenuItem,
  
  // Local helpers
  updateMenuItem,
  resetMockData,
};
