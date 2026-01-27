# SmartScan Pro Frontend

Next.js + Tailwind CSS frontend for SmartScan Pro self-checkout application.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend Flask server running on `http://127.0.0.1:5000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   │   ├── login/           # Login page
│   │   └── register/        # Register page
│   ├── (dashboard)/         # Protected routes (to be implemented)
│   │   ├── products/        # Product browsing/scanning
│   │   ├── cart/            # Shopping cart
│   │   ├── checkout/        # Checkout & QR display
│   │   └── history/         # Transaction history
│   ├── admin/               # Admin routes
│   │   └── products/        # Product management
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── page.tsx             # Home page (redirects)
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   └── Navbar.tsx           # Navigation bar
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                     # Utilities
│   ├── api.ts              # API client for Flask backend
│   └── types.ts            # TypeScript types
├── middleware.ts            # Route protection middleware
└── .env.local              # Environment variables
```

## Phase 1 Completed Features

✅ Next.js 14+ with App Router
✅ Tailwind CSS styling
✅ TypeScript configuration
✅ API client for Flask backend
✅ Authentication context (JWT-based)
✅ Route protection middleware
✅ Login and Register pages
✅ Navbar component
✅ Basic layout structure

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
```

## Available Routes

- `/` - Home (redirects to /products or /login)
- `/login` - Login page
- `/register` - Registration page
- `/products` - Product browsing (to be implemented)
- `/cart` - Shopping cart (to be implemented)
- `/history` - Transaction history (to be implemented)
- `/admin/products` - Admin product management (to be implemented)

## Authentication

The app uses JWT tokens stored in localStorage. The AuthContext provides:
- `user` - Current user data
- `login(email, password)` - Login function
- `register(email, password)` - Registration function
- `logout()` - Logout function
- `isAuthenticated` - Boolean authentication status
- `isAdmin` - Boolean admin status

## API Integration

All API calls are centralized in `lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Auth
await api.auth.login(email, password);
await api.auth.register(email, password);
await api.auth.logout();
await api.auth.getProfile();

// Products
await api.products.getAll();
await api.products.getByBarcode(barcode);
await api.products.create(product);  // Admin only
await api.products.update(barcode, product);  // Admin only
await api.products.delete(barcode);  // Admin only

// Cart
await api.cart.get();
await api.cart.addItem(barcode, quantity);
await api.cart.updateItem(itemId, quantity);
await api.cart.removeItem(itemId);

// Transactions
await api.transactions.checkout();
await api.transactions.getHistory();
```

## Next Steps (Phase 2)

- [ ] Implement Products page with barcode scanning
- [ ] Implement Cart page with item management
- [ ] Implement Checkout flow with QR code display
- [ ] Implement Transaction History page
- [ ] Add barcode scanner component (camera + manual input)
- [ ] Implement Admin product management panel

## Testing

Currently, you can:
1. Start both backend and frontend servers
2. Navigate to http://localhost:3000
3. Register a new account or login with existing credentials:
   - Regular user: `user@example.com` / `password123`
   - Admin user: `admin@example.com` / `adminpass`
