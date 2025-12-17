# Frontend-Backend Integration Guide

This document describes which frontend pages are connected to the backend API and which remain mocked.

## Overview

The Argus platform consists of a Django Ninja backend and a Next.js frontend. This integration connects the frontend to the backend API endpoints as documented in the README.

## Connection Status

### ✅ Fully Connected (Using Real API)

| Page/Feature | Backend Endpoint | Description |
|--------------|------------------|-------------|
| **Login** (`/login`) | `POST /api/auth/login` | User authentication with JWT tokens |
| **Register** (`/register`) | `POST /api/auth/register` | User registration for buyers and suppliers |
| **Logout** | `POST /api/auth/logout` | Token invalidation |
| **Current User** | `GET /api/auth/me` | Get authenticated user info |
| **Token Refresh** | `POST /api/auth/refresh` | Auto-refresh access tokens |
| **Dashboard Home** (`/dashboard`) | `GET /api/home-feed` | Recent searches chips + paginated product grid (20/page) |
| **Product Search** (`/dashboard/search`) | `GET /api/public/products/search` | Public product search for buyers |
| **Product Detail** (`/dashboard/product/[id]`) | `GET /api/home-feed` | Single product view (fetches from home feed) |
| **AI Assistant** (widget) | `POST /api/ai/chat` | AI-powered chat assistant |
| **Supplier Products** (`/dashboard/supplier/products`) | `GET/POST/PATCH/DELETE /api/products/*` | Full CRUD for supplier products |
| **Supplier Dashboard** (`/dashboard/supplier`) | `GET /api/products/critical-stock` | Critical stock alerts |
| **Profile Edit** (`/dashboard/profile`) | `GET/PATCH /api/profile/{buyer\|supplier}` | View and update buyer/supplier profile |
| **Real-time Chat** (`/dashboard/chat`) | `GET/POST /api/chat/*` + WebSocket | 1:1 buyer-supplier messaging |
| **Chat Notifications** | WebSocket `/ws/chat/threads/` | Real-time unread counts and new message alerts |
| **Contact Supplier** (Product Detail) | `POST /api/chat/threads` | Start chat about a specific product |

### ⚠️ Partially Connected

| Page/Feature | Status | Notes |
|--------------|--------|-------|
| **Dashboard Header** | Auth + Chat | Shows real user info, chat badge with live unread count, general notifications mocked |
| **Dashboard Sidebar** | Auth only | Shows real user type and initials |
| **Register Wizard** (`/register`) | Auth only | Step 1 & backend call connected; Package selection & Payment are frontend-only |

### 🔴 Mocked (No Backend Endpoint Available)

| Page/Feature | Reason | Mock Data |
|--------------|--------|-----------|
| **Currency Ticker** | No backend endpoint | Uses `mockCurrencies` |
| **Price Trend Chart** | No backend endpoint | Uses `mockPriceTrends` |
| **AI Insights Cards** | No backend endpoint | Uses `mockAIInsights` |
| **Offers Table** | No offers API | Uses `mockOffers` |
| **Supplier RFQs** | No RFQ API | Uses `mockRFQs` |
| **Trust Scores** | No trust score API | Static demo values |
| **Notifications** | No notifications API | Static demo data |
| **Subscription Packages** | No packages API | Uses `lib/data/packages.ts` mock |
| **Payment Processing** | No payment API | Frontend validation only, no backend call |

## Environment Variables

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=Argus
```

### Backend (.env)

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=*

# Database (defaults to SQLite)
DATABASE_URL=sqlite:///db.sqlite3

# CORS (comma-separated origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Product Settings
PRODUCT_LOW_STOCK_THRESHOLD=10

# AI (Gemini API)
GEMINI_API_KEY=your-gemini-api-key

# Redis (for caching, optional)
REDIS_URL=redis://localhost:6379/1
```

## Running Locally

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
# API available at http://localhost:8000/api/
# Docs at http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_URL

# Start development server
pnpm dev
# App available at http://localhost:3000
```

## API Client Architecture

### Files Structure

```
frontend/lib/
├── api-client.ts       # Core HTTP client with auth handling
├── api-types.ts        # TypeScript types matching backend schemas
└── services/
    ├── index.ts        # Service exports
    ├── auth-service.ts
    ├── profile-service.ts
    ├── product-service.ts
    ├── public-product-service.ts
    ├── home-feed-service.ts
    └── ai-chat-service.ts
```

### Features

- **Token Management**: Access and refresh tokens stored in localStorage
- **Auto-refresh**: Automatically refreshes expired access tokens
- **401 Handling**: Clears tokens and allows login redirect on auth failure
- **Timeout**: 30-second request timeout
- **Error Handling**: Consistent error response format

## Authentication Flow

1. **Login/Register**: User submits credentials → Backend returns JWT tokens → Stored in localStorage
2. **Protected Requests**: API client automatically adds `Authorization: Bearer <token>` header
3. **Token Expiry**: On 401 response, client attempts to refresh using refresh token
4. **Logout**: Tokens cleared from localStorage, refresh token blacklisted on backend

## Auth Context

The `AuthProvider` component wraps the app and provides:

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

Usage in components:

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

## Endpoints Not Yet Implemented in Backend

The following frontend features would require new backend endpoints:

1. **Watchlist API**
   - `GET /api/watchlist` - List user's watched products
   - `POST /api/watchlist` - Add product to watchlist
   - `DELETE /api/watchlist/{id}` - Remove from watchlist
   - `PATCH /api/watchlist/{id}` - Update target price

2. **Price Trends API**
   - `GET /api/products/{id}/price-history` - Historical price data
   - `GET /api/price-trends` - Aggregated price trends

3. **Notifications API**
   - `GET /api/notifications` - List user notifications
   - `PATCH /api/notifications/{id}/read` - Mark as read

4. **Supplier Offers API**
   - `GET /api/products/{id}/offers` - Get offers from multiple suppliers

5. **RFQ (Request for Quotation) API**
   - `GET /api/rfqs` - List supplier's RFQs
   - `POST /api/rfqs/{id}/quote` - Submit quote

6. **Subscription Packages API** (for registration wizard)
   - `GET /api/packages?user_type=buyer|supplier` - List available packages
   - `POST /api/subscriptions` - Create subscription after registration

7. **Payment Processing API** (for registration wizard)
   - `POST /api/payments/setup-intent` - Create payment setup intent
   - `POST /api/payments/confirm` - Confirm payment method

---

## Registration Wizard (3-Step Flow)

The registration page (`/register`) now uses a 3-step wizard flow.

### Step 1: Account Details
- Collects all fields required by backend: `email`, `username`, `password`, `password_confirm`, `user_type`, `company_name`
- Full frontend validation matching backend schema
- User type selection (buyer/supplier) affects Step 2 options

### Step 2: Package Selection
- **Data Source**: FRONTEND MOCK (`lib/data/packages.ts`)
- Displays subscription packages filtered by selected `user_type`
- User must select exactly one package to proceed
- Supports monthly/yearly billing toggle

**TODO (Backend Missing)**:
- Create `GET /api/packages?user_type=buyer|supplier` endpoint
- Replace mock data with API call in `lib/services/packages-service.ts`

### Step 3: Payment Details
- **This is FRONTEND-ONLY** - No backend payment endpoint exists
- Card validation (Luhn algorithm, expiry, CVV) in `lib/validators/card.ts`
- Input masking for card number (groups of 4) and expiry (MM/YY)
- Card type detection (Visa, Mastercard, Amex, Discover)
- For free packages, payment step is skipped

**TODO (Backend Missing)**:
- Implement payment processing (Stripe, etc.)
- Create payment setup/confirm endpoints
- Send payment token (not raw card data) to backend

### Backend API Call
The actual `POST /api/auth/register` call happens **only at Step 3** after all validation passes.

**Fields SENT to backend:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "password_confirm": "password123",
  "user_type": "buyer",
  "company_name": "Optional Company"
}
```

**Fields NOT sent to backend (frontend-only):**
- `packageId` - Stored in localStorage as `selectedPackage`
- `billingCycle` - Stored in localStorage
- Card details (cardNumber, expiryDate, cvv, cardholderName) - Validated only, never transmitted

### Package Storage (Temporary)
Until a backend packages endpoint exists, the selected package is stored in localStorage:

```javascript
localStorage.setItem('selectedPackage', JSON.stringify({
  packageId: 'buyer-professional',
  billingCycle: 'monthly',
  selectedAt: '2024-01-15T10:30:00.000Z'
}));
```

### Files Structure

```
frontend/
├── app/register/page.tsx              # Registration page entry
├── components/register-wizard/
│   ├── index.tsx                      # Main wizard orchestrator
│   └── steps/
│       ├── signup-step.tsx            # Step 1: Account details
│       ├── package-step.tsx           # Step 2: Package selection
│       └── payment-step.tsx           # Step 3: Payment form
├── lib/data/
│   └── packages.ts                    # Mock subscription packages
└── lib/validators/
    └── card.ts                        # Card validation utilities
```

---

## Known Issues & Workarounds

1. **AI Chat Authentication**: The backend uses `@login_required` decorator which expects Django session auth. For JWT auth, ensure the `JWTAuth` is properly applied.

2. **CORS**: Backend already configured for common local development origins. Add production URLs to `CORS_ALLOWED_ORIGINS`.

3. **Redis Cache**: If Redis is not running, the home-feed endpoint may fail. Set a fallback or use a simpler cache backend.

## Testing

### Manual Testing Checklist

**Registration Wizard:**
- [ ] Navigate to `/register` - wizard loads with Step 1
- [ ] Fill Step 1 with valid data - Next button enables
- [ ] Select user_type=buyer - go to Step 2
- [ ] Step 2 shows buyer packages only
- [ ] Toggle monthly/yearly billing - prices update
- [ ] Select a package - Next button enables
- [ ] Go to Step 3 - payment form appears
- [ ] For free package - payment form shows "no payment required"
- [ ] Enter valid card details - validation passes
- [ ] Enter invalid card (failing Luhn) - shows error
- [ ] Enter expired date - shows error
- [ ] Complete registration - redirects to dashboard
- [ ] Check localStorage for `selectedPackage`

**Login:**
- [ ] Login with email
- [ ] Login with username
- [ ] Logout

**Products:**
- [ ] Search for products (min 2 chars)
- [ ] View search results from API
- [ ] Supplier: Create a product
- [ ] Supplier: View product list
- [ ] Supplier: Delete a product
- [ ] Supplier: Activate/deactivate product

**AI Chat:**
- [ ] AI Chat: Send message (requires auth)

### API Health Check

```bash
# Check API is running
curl http://localhost:8000/api/health
# Expected: {"status": "healthy", "version": "1.0.0"}
```

## Future Improvements

1. Add loading skeletons for better UX
2. Implement optimistic updates for product operations
3. Add pagination controls to product lists
4. ~~Implement profile editing pages~~ ✅ Completed
5. Add product photo upload UI
6. Implement real-time notifications with WebSocket

---

## Profile Management

The profile edit page (`/dashboard/profile`) is fully connected to the backend API.

### Endpoints Used

| User Type | GET Endpoint | PATCH Endpoint |
|-----------|--------------|----------------|
| Buyer | `GET /api/profile/buyer` | `PATCH /api/profile/buyer` |
| Supplier | `GET /api/profile/supplier` | `PATCH /api/profile/supplier` |

### Form Fields by User Type

**Buyer Profile:**
- Company Name (read-only)
- Phone Number
- Preferred Payment Method
- Logo Upload

**Supplier Profile:**
- Company Name (read-only)
- Phone Number
- Website URL
- Business Description
- Main Production Location
- Return & Warranty Policy
- Preferred Payment Method
- Logo Upload

### Logo Image Handling (WebP Conversion)

Profile logos are always stored as WebP format for optimal performance. The conversion happens in two places:

**1. Frontend Pre-conversion (lib/image-utils.ts)**
- Before upload, images are converted to WebP using Canvas API
- Quality: 85% (reduced if needed to stay under 5MB)
- Supports: JPEG, PNG, GIF, WebP inputs
- Falls back to original if browser doesn't support WebP

**2. Backend Final Conversion (users/image_utils.py)**
- All uploaded images are converted to WebP using Pillow
- Ensures consistent format regardless of client capabilities
- Quality: 85% with automatic reduction if file too large
- Handles RGBA/transparent images by compositing on white background

**Important Notes:**
- Card/payment data is NEVER involved in profile management
- Logo files are sent as `multipart/form-data` via `FormData`
- No base64 strings are ever sent to the backend

### Error Handling

- 401: Redirects to login page
- 403: Shows "Access denied" message (wrong user type)
- 400: Shows validation error from backend
- Network errors: Shows generic error toast

---

## Home Feed & Product Display

The dashboard home page and product-related pages now use the real backend API.

### Endpoints Used

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Dashboard Home | `GET /api/home-feed` | Paginated product grid with recent searches |
| Search Default View | `GET /api/home-feed` | Shows all products when no search query |
| Product Search | `GET /api/public/products/search` | Public search with query parameter |
| Product Detail | `GET /api/home-feed` (with page_size=100) | Finds product by ID from feed |

### Home Feed Response Structure

```typescript
interface HomeFeedResponse {
  sections: HomeFeedSection[];
}

interface HomeFeedSection {
  key: 'recent_searches' | 'all_products';
  title: string;
  data: RecentSearchItem[] | AllProductsData;
}

interface AllProductsData {
  items: ProductCard[];
  pagination: HomeFeedPagination;
}

interface HomeFeedPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
```

### Components Updated

**1. Recent Searches Component (`components/recent-searches.tsx`)**
- Fetches from `GET /api/home-feed?page=1&page_size=20`
- Displays recent search chips from `recent_searches` section
- Displays paginated product grid from `all_products` section
- Pagination controls: Previous/Next buttons with page info
- Loading skeletons during fetch
- Error state with retry option

**2. Search Page (`app/dashboard/search/page.tsx`)**
- Default view: Fetches from `GET /api/home-feed` with pagination
- Search view: Fetches from `GET /api/public/products/search?q=<query>`
- Separate pagination for default vs search modes

**3. Product Detail Page (`app/dashboard/product/[id]/page.tsx`)**
- Fetches from `GET /api/home-feed?page_size=100`
- Searches for product by ID in the returned items
- Displays product info, seller details, and photos
- Note: No dedicated single-product endpoint exists

### Photo URL Handling

Product photos are stored with relative paths. The `getPhotoUrl` helper constructs full URLs:

```typescript
function getPhotoUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const apiBase = baseUrl.replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
}
```

### Mock Data Removed

The following mock data imports have been removed from production code:
- `mockProducts` from `lib/mock-data.ts`
- `mockRecentSearches` from `lib/mock-data.ts`
- `mockOffers` from `lib/mock-data.ts`

**Note:** Mock data files are retained for reference and testing purposes.
