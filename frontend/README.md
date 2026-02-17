# Restaurant Management System - Frontend

A modern, full-featured React-based frontend for a comprehensive restaurant management system with role-based authentication, interactive UI components, and complete workflow management.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:5173
# 4. Login with test credentials (see below)
```

The app runs with **mock API by default** - no backend needed for testing!

## Features

### Fully Implemented Features

#### **Authentication & Authorization**
- Complete login & register system with JWT tokens
- Role-based access control (RBAC) with 4 user roles
- Protected routes and automatic token refresh
- User profile management with interactive modals

#### **Customer Features**
- QR code-based table identification (scan to access menu)
- Browse menu with search, filters, and categories
- Shopping cart with real-time updates
- Order placement and tracking
- View order history with status badges
- Interactive profile page with modals

#### **Admin Features**
- **Dashboard**: System overview with analytics
- **Customer Management**: View all customers with search, filters, and status management (Active/Inactive/Blocked)
- **Staff Management**: Create and manage kitchen/waiter staff accounts
- **Menu Management**: Full CRUD operations for menu items and categories
- **Inventory Management**: Track stock levels with restock modal and validation
- **Order Overview**: Monitor all system orders

#### **Kitchen Features**
- Kitchen display system for active orders
- Update order status (Preparing → Ready)
- View order details and special instructions
- Real-time order queue management

#### **Waiter Features**
- **Proxy Orders**: Place orders on behalf of customers (table-based)
- **Available Tables Filter**: See only unoccupied tables to prevent conflicts
- **Serve Orders**: Mark ready orders as served with success feedback
- **Order Status Filtering**: View only orders ready to serve
- **Cash Payment Management**: Handle cash transactions at tables

### Modern UI/UX
- **Modal Dialogs**: Reusable modal component with animations
- **Success Toasts**: Non-blocking feedback notifications (auto-dismiss)
- **Gradient Cards**: Beautiful stat cards with color-coded statuses
- **Responsive Design**: Mobile-friendly layouts throughout
- **Loading States**: Skeleton screens and spinners
- **Status Badges**: Color-coded order and user statuses

## Test Credentials

| Role     | Email              | Password    | Description |
|----------|-------------------|-------------|-------------|
| Customer | customer@test.com | password123 | Browse menu, place orders |
| Admin    | admin@test.com    | admin123    | Full system access |
| Kitchen  | kitchen@test.com  | kitchen123  | Manage active orders |
| Waiter   | waiter@test.com   | waiter123   | Proxy orders, serve tables |

## Architecture

### Technology Stack
- **React 18** - UI framework with latest features
- **TypeScript** - Full type safety throughout
- **Vite** - Lightning-fast build tool
- **CSS3** - Custom styling with animations
- **React Router v6** - Client-side routing
- **Context API** - Global state management

### Project Structure
```
src/
├── api/              # API client functions
├── components/       # Reusable UI components
│   ├── Modal/       # Modal dialog component
│   ├── Header/      # Navigation header
│   └── ...          # Other shared components
├── config/           # Configuration (routes, API)
├── constants/        # Type-safe constants (roles, storage keys, statuses)
├── context/          # React Context providers (Auth, Cart)
├── pages/            # Page components by role/feature
│   ├── admin/       # Admin pages (Dashboard, Staff, Menu, Inventory, Customers)
│   ├── auth/        # Login, Register, Profile
│   ├── customer/    # Customer-specific pages
│   ├── kitchen/     # Kitchen display system
│   ├── waiter/      # Waiter pages (ProxyOrder, ServeOrders)
│   └── errors/      # 404, Unauthorized
├── services/         # Mock API & business logic
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

### Code Quality Features
- **Shared Components**: Reusable Modal, OrderCard, StatusFilter components
- **Shared Utilities**: Order helpers, menu helpers, validators
- **Centralized Constants**: Role enums, storage keys, order statuses
- **Type Safety**: Full TypeScript coverage with strict mode
- **De-duplicated Code**: Eliminated redundant code across components

## Available Scripts

| Command           | Description                    |
|------------------|--------------------------------|
| `npm run dev`    | Start development server       |
| `npm run build`  | Build for production           |
| `npm run preview`| Preview production build       |
| `npm run lint`   | Run ESLint                     |

## Application Routes

### Public Routes
| Route        | Description           | Status      |
|-------------|----------------------|-------------|
| `/login`    | User login           | Complete |
| `/register` | Customer registration | Complete |

### Customer Routes (Role: 1)
| Route      | Description              | Status      |
|-----------|-------------------------|-------------|
| `/menu`   | Browse menu & add to cart | Complete |
| `/orders` | View order history       | Complete |
| `/profile`| User profile management  | Complete |

### Admin Routes (Role: 2)
| Route                | Description                  | Status      |
|---------------------|----------------------------|-------------|
| `/admin`            | Admin dashboard            | Complete |
| `/admin/customers`  | Customer management        | Complete |
| `/admin/staff`      | Staff management           | Complete |
| `/admin/menu`       | Menu management            | Complete |
| `/admin/inventory`  | Inventory & restock        | Complete |

### Kitchen Routes (Role: 3)
| Route      | Description              | Status      |
|-----------|-------------------------|-------------|
| `/kitchen`| Kitchen order display    | Complete |

### Waiter Routes (Role: 4)
| Route              | Description                      | Status      |
|-------------------|----------------------------------|-------------|
| `/waiter/proxy`   | Place proxy orders for tables    | Complete |
| `/waiter/serve`   | Serve ready orders               | Complete |

## Key Components

### Shared Components
- **Modal**: Reusable modal dialog with overlay and animations
- **Header**: Role-based navigation with table ID display
- **OrderCard**: Display order details with status badges
- **OrderStatusFilter**: Filter orders by status
- **OrderStatsRow**: Statistics row for order pages

### Page-Specific Features
- **Inventory Management**: Modal-based restock with input validation and stock preview
- **Customers List**: Search, filter, and manage customer accounts with status badges
- **Serve Orders**: Filter to show only ready-to-serve orders with success feedback
- **Proxy Order**: Available tables filter to prevent double-booking
- **Profile Page**: Interactive modals for password change, address update, and logout

## Documentation

### Core Documentation
- [API Documentation](docs/api.md) - Backend API endpoints and schemas
- [Design Specifications](docs/design.md) - System design and architecture
- [Business Logic](docs/logics.md) - Business rules and workflows
- [Data Flow](docs/data_flow.md) - Data flow diagrams and state management
- [Services Architecture](docs/services_architecture.md) - Service layer documentation

### Implementation Guides
- [Component Architecture](docs/COMPONENTS.md) - Reusable component system
- [Customer Features](docs/CUSTOMER_FEATURES.md) - Customer-facing features
- [System Details](docs/details.md) - Detailed system flows and user roles

## Mock API vs Real Backend

### Current Mode: Mock API (Default)
The application uses mock data by default for standalone testing:
- No backend server required
- Realistic network delays simulated
- Full feature testing capabilities
- Perfect for development and demos

### Switch to Real Backend
To connect to actual backend services:

```env
# .env.local
VITE_USE_MOCK_API=false
VITE_BASE_URL=http://localhost:8080/api/
```

Backend services run on ports 3001-3011 with API Gateway on port 8080.

## Recent Improvements

### User Experience Enhancements
- Modal dialogs replace basic prompts for better UX
- Success toast notifications with auto-dismiss
- Filtered dropdowns prevent workflow errors
- Status badges with color coding for quick identification
- Gradient stat cards for improved data visualization

### Code Quality
- De-duplicated shared components and utilities
- Centralized constants with TypeScript enums
- Type-safe throughout with strict TypeScript
- Accessibility improvements for modals and forms

## Troubleshooting

### Development Server Issues
```bash
# Port 5173 already in use?
npm run dev -- --port 3000

# Dependencies issues?
rm -rf node_modules package-lock.json
npm install
```

### Mock API Not Working
- Verify `.env.local` exists with correct settings
- Restart dev server after environment variable changes
- Check browser console for error messages

## Development Tips

- **Hot Module Replacement**: Changes appear instantly without refresh
- **TypeScript**: Full autocomplete and type checking in VS Code
- **ESLint**: Run `npm run lint` before commits
- **Component Reuse**: Check `src/components/` before creating new components
- **Constants**: Use centralized constants from `src/constants/` instead of magic strings

## Getting Started Guide

### For Customers
1. Register a new account at `/register`
2. Scan QR code at your table to access menu
3. Browse menu and add items to cart
4. Place order and track its status
5. View order history in `/orders`

### For Staff (Admin, Kitchen, Waiter)
1. Use provided credentials to log in
2. Access role-specific dashboard
3. Admin: Manage customers, staff, menu, and inventory
4. Kitchen: View and update order statuses
5. Waiter: Take proxy orders and serve tables

## License

Restaurant Management System - All rights reserved

---

**Built with React + TypeScript + Vite**
