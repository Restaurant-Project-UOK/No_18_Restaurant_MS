/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { menuService } from '../services/menuService';
import { useAuth } from './AuthContext';

interface MenuContextType {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  loading: boolean;
  error: string | null;
  getItemsByCategory: (categoryName: string) => MenuItem[];
  searchItems: (query: string) => MenuItem[];
  updateMenuItem: (id: number, updates: Partial<MenuItem>, jwtToken?: string) => Promise<void>;
  refreshMenuData: () => Promise<void>;
  createMenuItem: (formData: FormData, jwtToken: string) => Promise<MenuItem>;
  deleteMenuItem: (id: number, jwtToken: string) => Promise<void>;
  toggleAvailability: (id: number, isActive: boolean, jwtToken: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refreshMenuData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [items, cats] = await Promise.all([
        menuService.getAllMenuItems(),
        menuService.getAllCategories(),
      ]);

      // Ensure 'available' property is populated for backward compatibility
      const mappedItems = items.map(item => ({
        ...item,
        available: item.available ?? item.isActive
      }));

      setMenuItems(mappedItems);
      setCategories(cats);
    } catch (err) {
      console.error('[MenuContext] Error loading data:', err);
      // specific error handling if needed
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    refreshMenuData();
  }, [isAuthenticated, refreshMenuData]);

  const getItemsByCategory = useCallback(
    (categoryName: string) => {
      return menuItems.filter((item) =>
        item.categories.some(cat => cat.name === categoryName)
      );
    },
    [menuItems]
  );

  const searchItems = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
      );
    },
    [menuItems]
  );

  const updateMenuItem = useCallback(async (id: number, updates: Partial<MenuItem>, jwtToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      await menuService.updateMenuItem(id, updates, jwtToken);

      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update menu item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createMenuItem = useCallback(async (formData: FormData, jwtToken: string): Promise<MenuItem> => {
    setLoading(true);
    setError(null);

    try {
      const newItem = await menuService.createMenuItemWithImage(formData, jwtToken);

      // Refresh menu data to include new item
      await refreshMenuData();

      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create menu item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshMenuData]);

  const deleteMenuItem = useCallback(async (id: number, jwtToken: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await menuService.deleteMenuItem(id, jwtToken);

      // Remove from local state
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete menu item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAvailability = useCallback(async (
    id: number,
    isActive: boolean,
    jwtToken: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await menuService.updateMenuItemAvailability(id, isActive, jwtToken);

      // Update local state
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available: isActive } : item))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update availability';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      menuItems,
      categories,
      loading,
      error,
      getItemsByCategory,
      searchItems,
      updateMenuItem,
      refreshMenuData,
      createMenuItem,
      deleteMenuItem,
      toggleAvailability,
    }),
    [menuItems, categories, loading, error, getItemsByCategory, searchItems, updateMenuItem, refreshMenuData, createMenuItem, deleteMenuItem, toggleAvailability]
  );

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
};
