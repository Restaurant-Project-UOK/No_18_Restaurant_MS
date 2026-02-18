# Component Architecture & Code Reusability

## Overview
This document explains the reusable component system and architecture improvements made to reduce code duplication and maintain separation of concerns.

## Reusable Components

### 1. **Button Component**
**Location:** `src/components/Button/`

**Purpose:** Standardized button with variants, sizes, and loading states

**Features:**
- Variants: `primary`, `secondary`, `danger`, `success`
- Sizes: `sm`, `md`, `lg`
- Built-in loading spinner
- Disabled state handling

**Usage:**
```tsx
import { Button } from '../../components';

<Button variant="primary" size="md" isLoading={isLoading} onClick={handleClick}>
  Click Me
</Button>
```

### 2. **Card Component**
**Location:** `src/components/Card/`

**Purpose:** Container component for content sections

**Features:**
- Consistent padding options: `sm`, `md`, `lg`
- Shadow and border radius
- White background with proper spacing

**Usage:**
```tsx
import { Card } from '../../components';

<Card padding="md">
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>
```

### 3. **Header Component**
**Location:** `src/components/Header/`

**Purpose:** Application header with navigation and user info

**Features:**
- Role-based navigation links
- User profile display with role badge
- Table ID badge (when applicable)
- Logout functionality
- Responsive design

**Props:**
- `title`: String - Header title (default: "🍽️ Restaurant")
- `showNavigation`: Boolean - Show nav links (default: true)
- `showTableId`: Boolean - Display table badge (default: false)

### 4. **Layout Component**
**Location:** `src/components/Layout/`

**Purpose:** Main page layout wrapper

**Features:**
- Integrates Header component
- Consistent max-width container
- Proper spacing and background

**Usage:**
```tsx
import { Layout } from '../../components';

<Layout title="My Page" showTableId={true}>
  <p>Page content here</p>
</Layout>
```

### 5. **LoadingSpinner Component**
**Location:** `src/components/LoadingSpinner/`

**Purpose:** Loading indicators

**Features:**
- Sizes: `sm`, `md`, `lg`
- Optional message text
- Full-screen mode option

**Usage:**
```tsx
import { LoadingSpinner } from '../../components';

<LoadingSpinner size="md" message="Loading..." fullScreen />
```

### 6. **TableSelector Component**
**Location:** `src/components/TableSelector/`

**Purpose:** Allow customers to select/change their table number

**Features:**
- Number input validation (1-50)
- Integration with AuthContext
- QR code scan support message
- Change table functionality

**Usage:**
```tsx
import { TableSelector } from '../../components';

<TableSelector onClose={() => setShowModal(false)} />
```

---

## Table ID Logic

### How It Works

1. **URL Parameter Detection:**
   - When a customer scans a QR code, the URL contains `?tableId=5`
   - AuthContext automatically detects and stores this parameter
   - Example: `https://restaurant.com/menu?tableId=5`

2. **LocalStorage Persistence:**
   - Table ID is saved to localStorage (`restaurant_table_id`)
   - Persists across page refreshes
   - Automatically loaded when app initializes

3. **Manual Selection:**
   - Customers can also manually enter table number using TableSelector
   - Validation ensures number is between 1-50
   - Updates both context state and localStorage

4. **Context Integration:**
   - `useAuth()` hook provides:
     - `tableId`: Current table number (number | null)
     - `setTableId(id)`: Function to update table
   - Available throughout the app

### Implementation Example

**In MenuPage:**
```tsx
const { tableId, user } = useAuth();
const isCustomer = user?.role === 1;

// Show TableSelector if customer hasn't selected a table
{isCustomer && !tableId && (
  <TableSelector />
)}

// Display table badge in header
<Layout showTableId={isCustomer && !!tableId}>
  ...
</Layout>
```

**Setting Table ID from URL:**
```tsx
// In AuthContext (already implemented)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlTableId = params.get('tableId');
  if (urlTableId) {
    const tableNum = parseInt(urlTableId);
    if (!isNaN(tableNum)) {
      setTableId(tableNum);
    }
  }
}, []);
```

### Use Cases

1. **QR Code Scan:**
   - Customer scans table QR code → `?tableId=12` in URL
   - Automatic detection and storage
   - Badge appears in header

2. **Manual Entry:**
   - Customer opens app without scanning
   - TableSelector component appears
   - They enter table number manually

3. **Table Change:**
   - Customer moved to different table
   - Click table badge or use TableSelector
   - Update persists across navigation

---

## CSS Organization

### Per-Component Styling

Each component has its own CSS file in its folder:

```
src/components/
  Button/
    Button.tsx
    Button.css       ← Component-specific styles
    index.ts
  Card/
    Card.tsx
    Card.css         ← Component-specific styles
    index.ts
```

### Page-Specific Styling

Each page has its own CSS file:

```
src/pages/
  auth/
    Login.tsx
    Login.css        ← Login page styles
    Register.tsx
    Register.css     ← Register page styles
  menu/
    MenuPage.tsx
    MenuPage.css     ← Menu page styles
```

### Benefits

- **Modularity:** Styles are co-located with components
- **No Conflicts:** BEM-style naming prevents class collisions
- **Maintainability:** Easy to find and update styles
- **Performance:** Only load styles for components in use

### Naming Convention (BEM)

```css
/* Block */
.button { }

/* Element */
.button__spinner { }

/* Modifier */
.button--primary { }
.button--loading { }
```

---

## Code Duplication Reduction

### Before:
Each page had:
- Duplicate header code
- Repeated button markup with spinners
- Copy-pasted loading states
- Inline Tailwind classes everywhere

### After:
- **Header:** Centralized in Layout/Header components
- **Buttons:** Single Button component with variants
- **Loading:** LoadingSpinner component
- **Containers:** Card component for consistent styling
- **CSS:** Separate files for better organization

### Metrics:
- **Login/Register pages:** ~176 lines → ~90 lines (49% reduction)
- **Menu/Orders pages:** ~51 lines → ~40 lines (22% reduction)
- **Reusable components:** Can be used across all pages
- **Maintenance:** Update once, affects all usages

---

## Best Practices

### 1. Import Components from Index
```tsx
// ✅ Good
import { Button, Card, Layout } from '../../components';

// ❌ Avoid
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
```

### 2. Use Layout for Pages
```tsx
// ✅ Good
<Layout title="Page Title" showTableId={true}>
  <Content />
</Layout>

// ❌ Avoid duplicating header/footer markup
```

### 3. Consistent Button Usage
```tsx
// ✅ Good
<Button variant="primary" isLoading={loading}>Submit</Button>

// ❌ Avoid custom button markup
```

### 4. CSS Class Naming
```tsx
// ✅ Good - BEM methodology
<div className="login-page">
  <div className="login-card">
    <h2 className="login-title">Title</h2>
  </div>
</div>

// ❌ Avoid generic or unclear names
<div className="page">
  <div className="card">
    <h2 className="title">Title</h2>
  </div>
</div>
```

---

## Future Enhancements

### Potential New Components:
1. **Modal:** Popup dialogs for confirmations
2. **Toast:** Notification messages
3. **FormInput:** Standardized form fields with validation
4. **MenuCard:** Menu item display component  
5. **OrderCard:** Order status display
6. **Badge:** Status indicators

### Potential Improvements:
1. CSS Modules or Styled Components for scoped styling
2. Theme system for colors and spacing
3. Accessibility improvements (ARIA labels)
4. Animation library integration
5. Responsive breakpoint utilities

---

## Migration Guide

### Converting a Page to Use Components

**Before:**
```tsx
const MyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header>...</header>
      <main>
        <div className="bg-white rounded-lg shadow p-8">
          <button className="bg-blue-500...">Click</button>
        </div>
      </main>
    </div>
  );
};
```

**After:**
```tsx
import { Layout, Card, Button } from '../../components';
import './MyPage.css';

const MyPage = () => {
  return (
    <Layout title="My Page">
      <Card>
        <Button variant="primary">Click</Button>
      </Card>
    </Layout>
  );
};
```

---

## Summary

✅ **Achieved:**
- Reusable component library
- Reduced code duplication by ~40%
- Separate CSS files for each component/page
- Proper table ID logic with QR support
- Consistent UI across all pages
- Better maintainability

✅ **Benefits:**
- Faster development (use existing components)
- Easier debugging (centralized logic)
- Consistent user experience
- Better code organization
- Scalable architecture
