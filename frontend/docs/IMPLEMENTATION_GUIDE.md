# Implementation Guide: Stitch UI to React Frontend

## Overview
This guide explains how to implement the 23 Stitch UI screens into your React frontend project, integrating them with the features described in FRONTEND_FUNCTIONALITY.md.

## Screen Mapping

### Customer Screens (Mobile - 780px)
| Stitch Screen | React Page Component | Route | Features |
|---------------|---------------------|-------|----------|
| Customer: Menu | `MenuPage.tsx` | `/menu` | Browse menu, search, filter by category, add to cart |
| Customer: Checkout | `CheckoutPage.tsx` | `/checkout` | Review cart, place order, requires tableId |
| Customer Cart Overlay | `Cart.tsx` component | Sidebar overlay | Real-time cart display |
| Customer Login | `Login.tsx` | `/login` | Email/password authentication |
| Customer Register | `Register.tsx` | `/register` | New customer registration |
| Customer Profile & Settings | `ProfilePage.tsx` | `/profile` | View/edit profile, logout |
| Customer: Live Status | `OrderTrackingPage.tsx` | `/orders/:id` | Real-time order status tracking |
| QR Scan Required Popup | `QRScannerPage.tsx` | `/qr-scan` | Capture tableId from QR code |

### Admin Screens (Desktop - 2560px)
| Stitch Screen | React Page Component | Route | Features |
|---------------|---------------------|-------|----------|
| Admin: Dashboard | `AdminDashboard.tsx` | `/admin` | Quick stats, navigation to modules |
| Admin: Staff Management | `StaffManagement.tsx` | `/admin/staff` | CRUD operations on staff |
| Admin: Menu Management | `MenuManagement.tsx` | `/admin/menu` | CRUD operations on menu items |
| Staff & Admin Account Settings | `ProfilePage.tsx` | `/profile` | Account settings for admin/staff |
| Inventory Alerts & Reorder | `InventoryManagement.tsx` | `/admin/inventory` | Stock levels, reorder alerts |
| Admin: Reports & Analytics | `Analytics.tsx` | `/admin/analytics` | Sales reports, insights |

### Kitchen Screens (Desktop - 2560px)
| Stitch Screen | React Page Component | Route | Features |
| Kitchen: KDS Dashboard | `KitchenPage.tsx` | `/kitchen` | Real-time order queue |
| Kitchen: Inventory Management | Integrated in admin | `/admin/inventory` | View stock from kitchen |
| Kitchen: Order History | `KitchenPage.tsx` (tab) | `/kitchen?view=history` | Past orders |
| Kitchen: Order Detail | Modal/detail view | `/kitchen/orders/:id` | Full order details |

### Waiter Screens (Desktop - 2560px)
| Stitch Screen | React Page Component | Route | Features |
|---------------|---------------------|-------|----------|
| Waiter: Floor Plan | `WaiterDashboard.tsx` | `/waiter` | Table layout, quick overview |
| Waiter: Order Entry | `ProxyOrder.tsx` | `/waiter/proxy-order` | Place order for customer |
| Waiter: History & Shift Summary | `WaiterDashboard.tsx` (section) | `/waiter` | Personal stats |
| Waiter Profile & Stats | `ProfilePage.tsx` | `/profile` | Waiter profile |

## Implementation Steps

### Step 1: Download Stitch HTML
For each screen you want to implement:
1. Use `mcp_stitch_get_screen` tool to view screen details
2. Download HTML code from the `downloadUrl`
3. Extract relevant HTML structure (remove Stitch-specific classes)
4. Convert to React JSX
5. Apply Tailwind CSS classes instead of inline styles

### Step 2: Convert HTML to React Components
Example conversion process:

**Stitch HTML:**
```html
<div class="container" style="background-color: #1a1a1a;">
  <h1 style="color: #f47b25;">Menu</h1>
  <div class="menu-items">
    <!-- items -->
  </div>
</div>
```

**React TSX:**
```tsx
<div className="container bg-gray-900">
  <h1 className="text-orange-500 text-2xl font-bold">Menu</h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {menuItems.map(item => (
      <MenuCard key={item.id} item={item} />
    ))}
  </div>
</div>
```

### Step 3: Integrate with API
Each page component should:
1. Import necessary API functions from `src/api/`
2. Use React hooks (`useState`, `useEffect`) for data fetching
3. Handle loading and error states
4. Integrate with context providers (Auth, Cart)

Example:
```tsx
import { useState, useEffect } from 'react';
import { getMenuItems, getCategories } from '../../api/menu';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, tableId } = useAuth();
  const { addItem } = useCart();
  
  useEffect(() => {
    loadMenuItems();
  }, []);
  
  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="menu-page">
      {/* Stitch UI converted to React */}
    </div>
  );
}
```

### Step 4: Apply Theme Colors
Your Stitch project uses these theme colors:
- **Primary/Accent**: `#f47b25` (orange) → `bg-orange-500`, `text-orange-500`
- **Color Mode**: Dark
- **Font**: Work Sans
- **Roundness**: 8px → `rounded-lg`

Update `tailwind.config.js`:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#f47b25',
        'bg-dark': '#1a1a1a',
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
      },
    },
  },
};
```

### Step 5: Responsive Design
- **Mobile screens** (Customer): max-width 780px
- **Desktop screens** (Admin/Kitchen/Waiter): min-width 1024px

Use Tailwind responsive classes:
```tsx
<div className="container mx-auto px-4 md:px-8 lg:px-16">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* content */}
  </div>
</div>
```

## Quick Start Template

I've created the foundational structure for you:
- ✅ TypeScript types
- ✅ Constants (roles, order status)
- ✅ Utility functions (JWT, cookies, helpers)
- ✅ Configuration (API endpoints, routes)

Next steps you need to complete:
1. Create mock API services (`src/services/mockApi.ts`)
2. Create context providers (`src/context/AuthContext.tsx`, `CartContext.tsx`)
3. Create API layer (`src/api/auth.ts`, `menu.ts`, `orders.ts`)
4. Create reusable components (`src/components/`)
5. Create page components (`src/pages/`)

## Component Library Structure

### Reusable Components Needed
```
src/components/
├── Button/
│   └── Button.tsx           # Styled button with variants
├── Card/
│   └── Card.tsx             # Card wrapper
├── Modal/
│   └── Modal.tsx            # Reusable modal dialog
├── Header/
│   └── Header.tsx           # Top navigation
├── Layout/
│   └── Layout.tsx           # Page layout wrapper
├── Cart/
│   └── Cart.tsx             # Shopping cart sidebar
├── MenuCard/
│   └── MenuCard.tsx         # Menu item display card
├── OrderCard/
│   └── OrderCard.tsx        # Order display card
├── LoadingSpinner/
│   └── LoadingSpinner.tsx   # Loading indicator
└── ProtectedRoute.tsx       # Auth guard
```

## Integration Checklist

- [ ] Install required dependencies (already in package.json)
- [ ] Set up Tailwind with custom theme colors
- [ ] Create mock API service
- [ ] Create Auth context provider
- [ ] Create Cart context provider
- [ ] Create API layer functions
- [ ] Create base components (Button, Card, Modal)
- [ ] Create layout components (Header, Layout)
- [ ] Implement Customer pages (8 screens)
- [ ] Implement Admin pages (6 screens)
- [ ] Implement Kitchen pages (2 screens)
- [ ] Implement Waiter pages (4 screens)
- [ ] Test all role-based flows
- [ ] Test responsive design
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Test authentication flows

## Next Actions

1. **Run the project**: `npm run dev`
2. **Add fonts**: Add Work Sans to `index.html`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
   ```
3. **Start implementing pages**: Begin with Login page, then incrementally add others
4. **Test each flow**: Customer → Admin → Kitchen → Waiter

## Resources
- Stitch Project ID: `14810343214807796044`
- Total Screens: 23
- Documentation: `docs/FRONTEND_FUNCTIONALITY.md`
- API Config: `src/config/api.ts`
- Routes Config: `src/config/routes.ts`
