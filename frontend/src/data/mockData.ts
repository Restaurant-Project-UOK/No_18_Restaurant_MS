import { MenuItem, MenuCategory, Order, OrderStatus, Table, TableStatus, Staff } from '../types';

// Mock Menu Categories
export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'appetizers', name: 'Appetizers', icon: '🥗' },
  { id: 'mains', name: 'Main Courses', icon: '🍖' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
  { id: 'specials', name: 'Specials', icon: '⭐' },
];

// Mock Menu Items
export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item1',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan and croutons',
    category: 'appetizers',
    price: 12.99,
    image: '🥗',
    available: true,
    preparationTime: 5,
  },
  {
    id: 'item2',
    name: 'Bruschetta',
    description: 'Toasted bread with tomato and garlic',
    category: 'appetizers',
    price: 9.99,
    image: '🍞',
    available: true,
    preparationTime: 5,
  },
  {
    id: 'item3',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with herbs and lemon',
    category: 'mains',
    price: 28.99,
    image: '🐟',
    available: true,
    preparationTime: 20,
  },
  {
    id: 'item4',
    name: 'Ribeye Steak',
    description: '12oz prime cut with garlic butter',
    category: 'mains',
    price: 35.99,
    image: '🥩',
    available: true,
    preparationTime: 25,
  },
  {
    id: 'item5',
    name: 'Pasta Carbonara',
    description: 'Classic Italian pasta with bacon and cream',
    category: 'mains',
    price: 18.99,
    image: '🍝',
    available: true,
    preparationTime: 15,
  },
  {
    id: 'item6',
    name: 'Chocolate Cake',
    description: 'Rich dark chocolate with ganache',
    category: 'desserts',
    price: 8.99,
    image: '🍰',
    available: true,
    preparationTime: 3,
  },
  {
    id: 'item7',
    name: 'Tiramisu',
    description: 'Italian mascarpone and espresso layers',
    category: 'desserts',
    price: 7.99,
    image: '🎂',
    available: true,
    preparationTime: 3,
  },
  {
    id: 'item8',
    name: 'Coca Cola',
    description: 'Classic soft drink',
    category: 'beverages',
    price: 3.99,
    image: '🥤',
    available: true,
    preparationTime: 1,
  },
  {
    id: 'item9',
    name: 'Wine - Red',
    description: 'Cabernet Sauvignon',
    category: 'beverages',
    price: 12.99,
    image: '🍷',
    available: true,
    preparationTime: 1,
  },
  {
    id: 'item10',
    name: 'Chef Special',
    description: 'Today\'s special creation - Ask waiter',
    category: 'specials',
    price: 32.99,
    image: '👨‍🍳',
    available: true,
    preparationTime: 30,
  },
];

// Mock Tables
export const MOCK_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `table_${i + 1}`,
  tableNumber: i + 1,
  capacity: (() => {
    if (i < 4) return 2;
    if (i < 8) return 4;
    return 6;
  })(),
  status: (() => {
    if (i % 3 === 0) return TableStatus.OCCUPIED;
    if (i % 3 === 1) return TableStatus.RESERVED;
    return TableStatus.AVAILABLE;
  })(),
  occupiedAt: i % 3 === 0 ? new Date().toISOString() : undefined,
}));

// Mock Staff
export const MOCK_STAFF: Staff[] = [
  {
    id: 'staff1',
    name: 'Chef Marco',
    email: 'marco@restaurant.com',
    role: 3,
    phone: '555-0101',
    status: 'active',
  },
  {
    id: 'staff2',
    name: 'Chef Rosa',
    email: 'rosa@restaurant.com',
    role: 3,
    phone: '555-0102',
    status: 'active',
  },
  {
    id: 'staff3',
    name: 'Waiter Alex',
    email: 'alex@restaurant.com',
    role: 4,
    phone: '555-0201',
    status: 'active',
  },
  {
    id: 'staff4',
    name: 'Waiter Emma',
    email: 'emma@restaurant.com',
    role: 4,
    phone: '555-0202',
    status: 'active',
  },
];

// Mock Orders
export const generateMockOrders = (): Order[] => [
  {
    id: 'order1',
    customerId: 'cust1',
    customerName: 'John Doe',
    items: [
      {
        id: 'oi1',
        menuItemId: 'item3',
        menuItem: MOCK_MENU_ITEMS[2],
        quantity: 1,
        price: 28.99,
      },
      {
        id: 'oi2',
        menuItemId: 'item8',
        menuItem: MOCK_MENU_ITEMS[7],
        quantity: 2,
        price: 3.99,
      },
    ],
    status: OrderStatus.PREPARING,
    totalPrice: 36.97,
    tableNumber: 5,
    orderTime: new Date().toISOString(),
    isPaid: false,
  },
  {
    id: 'order2',
    customerId: 'cust2',
    customerName: 'Jane Smith',
    items: [
      {
        id: 'oi3',
        menuItemId: 'item4',
        menuItem: MOCK_MENU_ITEMS[3],
        quantity: 2,
        price: 35.99,
      },
      {
        id: 'oi4',
        menuItemId: 'item6',
        menuItem: MOCK_MENU_ITEMS[5],
        quantity: 2,
        price: 8.99,
      },
    ],
    status: OrderStatus.READY,
    totalPrice: 89.96,
    tableNumber: 3,
    orderTime: new Date(Date.now() - 20 * 60000).toISOString(),
    isPaid: false,
  },
];
