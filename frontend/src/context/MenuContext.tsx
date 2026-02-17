/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { menuService } from '../services/menuService';

interface MenuContextType {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  loading: boolean;
  error: string | null;
  getItemsByCategory: (category: string) => MenuItem[];
  searchItems: (query: string) => MenuItem[];
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  refreshMenuData: () => Promise<void>;
  createMenuItem: (formData: FormData, jwtToken: string) => Promise<MenuItem>;
  deleteMenuItem: (id: string, jwtToken: string) => Promise<void>;
  toggleAvailability: (id: string, isActive: boolean, jwtToken: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    refreshMenuData();
  }, []);

  const refreshMenuData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [items, cats] = await Promise.all([
        menuService.getAllMenuItems(),
        menuService.getAllCategories(),
      ]);
      
      setMenuItems(items);
      setCategories(cats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load menu data';
      setError(errorMessage);
      console.error('[MenuContext] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (category: string) => {
    return menuItems.filter((item) => item.category === category);
  };

  const searchItems = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    
    // Also update in service layer
    menuService.updateMenuItem(id, updates);
  };

  const createMenuItem = async (formData: FormData, jwtToken: string): Promise<MenuItem> => {
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
  };

  const deleteMenuItem = async (id: string, jwtToken: string): Promise<void> => {
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
  };

  const toggleAvailability = async (
    id: string,
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
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menuItems, categories, loading, error]
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

