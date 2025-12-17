# Argus

B2B Supplier-Buyer Platform API built with Django and Django Ninja.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health & Utility](#health--utility-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Profile Management](#profile-management-endpoints)
  - [Products (Supplier)](#products-api-supplier)
  - [Public Products (Buyer)](#public-products-api)
  - [Home Feed](#home-feed-api)
  - [Watchlist](#watchlist-api)
  - [AI Chat](#ai-api)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Running Tests](#running-tests)

---

## Overview

Argus is a powerful B2B Supplier-Buyer Platform API that provides:
- **JWT-based Authentication** with access and refresh tokens
- **User Management** with separate Buyer and Supplier profiles
- **Product Management** for suppliers with full CRUD operations
- **Public Product Search** for buyers
- **Home Feed** with personalized content and recent searches
- **AI Chat** for intelligent assistance

---

## Getting Started

### Prerequisites
- Python 3.10+
- Django 4.x
- Django Ninja

### Installation

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## Docker Deployment

The entire application stack can be deployed using Docker Compose with a single command.

### Prerequisites
- Docker and Docker Compose installed
- Copy `.env.example` to `.env` and configure your settings

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd Argusss

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings (especially SECRET_KEY and passwords)

# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

### Services

The Docker setup includes:

| Service    | Description                          | Internal Port | External Port |
|------------|--------------------------------------|---------------|---------------|
| nginx      | Reverse proxy & static file server   | 80            | 80            |
| frontend   | Next.js application                  | 3000          | -             |
| backend    | Django ASGI server (Daphne)          | 8000          | -             |
| postgres   | PostgreSQL database                  | 5432          | -             |
| redis      | Redis cache & channel layer          | 6379          | -             |

### Accessing the Application

Once running, access the application at:
- **Frontend**: http://localhost
- **API**: http://localhost/api/
- **API Docs**: http://localhost/api/docs
- **Admin**: http://localhost/admin/

### Useful Commands

```bash
# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Rebuild a specific service
docker compose up --build backend

# Run Django management commands
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell

# Access PostgreSQL
docker compose exec postgres psql -U argus -d argus

# Access Redis CLI
docker compose exec redis redis-cli
```

### Environment Variables

Key environment variables in `.env`:

| Variable                | Description                      | Default Value                    |
|-------------------------|----------------------------------|----------------------------------|
| `DEBUG`                 | Django debug mode                | `False`                          |
| `SECRET_KEY`            | Django secret key                | (change in production!)          |
| `POSTGRES_DB`           | Database name                    | `argus`                          |
| `POSTGRES_USER`         | Database user                    | `argus`                          |
| `POSTGRES_PASSWORD`     | Database password                | (change this!)                   |
| `GEMINI_API_KEY`        | Google Gemini API key            | -                                |
| `NEXT_PUBLIC_API_URL`   | Frontend API URL                 | `http://localhost/api`           |
| `NEXT_PUBLIC_WS_URL`    | Frontend WebSocket URL           | `ws://localhost` (Docker) or `ws://localhost:8000` (local dev) |

---

## API Documentation

Interactive API documentation (Swagger UI) is available at:
```
http://localhost:8000/api/docs
```

Base API URL:
```
http://localhost:8000/api/
```

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types
- **Access Token**: Short-lived token for API requests
- **Refresh Token**: Long-lived token to obtain new access tokens

---

## API Endpoints

### Health & Utility Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/` | No | Root endpoint with API information |
| GET | `/api/health` | No | Health check for monitoring and load balancers |

#### GET `/api/`
Returns API information and documentation link.

**Response:**
```json
{
  "message": "Welcome to Argus API",
  "version": "1.0.0",
  "docs": "/api/docs"
}
```

#### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### Authentication Endpoints

Base path: `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Authenticate and get tokens |
| POST | `/api/auth/logout` | No | Invalidate refresh token |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user info |

---

#### POST `/api/auth/register`
Register a new user with corresponding profile.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "user_type": "buyer",
  "company_name": "My Company"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address (must be unique) |
| username | string | Yes | Unique username (3-150 chars, alphanumeric and underscores) |
| password | string | Yes | Password meeting Django's validation requirements |
| password_confirm | string | Yes | Must match password |
| user_type | string | No | `"buyer"` or `"supplier"` (default: `"buyer"`) |
| company_name | string | No | Company name for profile (defaults to username) |

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "user_type": "buyer",
    "is_active": true
  },
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

---

#### POST `/api/auth/login`
Authenticate a user and return JWT tokens.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| identifier | string | Yes | Email address or username |
| password | string | Yes | User's password |

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "user_type": "buyer",
    "is_active": true
  },
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

---

#### POST `/api/auth/logout`
Logout user by blacklisting the refresh token.

**Request Body:**
```json
{
  "refresh": "eyJ..."
}
```

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

#### POST `/api/auth/refresh`
Refresh an access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh": "eyJ..."
}
```

**Response (200):**
```json
{
  "access": "eyJ..."
}
```

---

#### GET `/api/auth/me`
Get the current authenticated user's information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "user_type": "buyer",
  "is_active": true
}
```

---

### Profile Management Endpoints

Base path: `/api/profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile/buyer` | Yes | Get buyer profile |
| PATCH | `/api/profile/buyer` | Yes | Update buyer profile |
| GET | `/api/profile/supplier` | Yes | Get supplier profile |
| PATCH | `/api/profile/supplier` | Yes | Update supplier profile |

---

#### GET `/api/profile/buyer`
Get the current authenticated buyer's profile. Only accessible by users with `user_type='buyer'`.

**Response (200):**
```json
{
  "id": "uuid",
  "company_name": "My Company",
  "phone": "+1234567890",
  "payment_method": "Bank Transfer",
  "logo": "/media/logos/logo.png",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

#### PATCH `/api/profile/buyer`
Update the current authenticated buyer's profile.

**Content-Type:** `multipart/form-data` (if uploading logo) or `application/x-www-form-urlencoded`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | No | Phone number (max 20 chars) |
| payment_method | string | No | Preferred payment method (max 100 chars) |
| logo | file | No | Profile logo image (max 5MB, jpeg/png/gif/webp) |

---

#### GET `/api/profile/supplier`
Get the current authenticated supplier's profile. Only accessible by users with `user_type='supplier'`.

**Response (200):**
```json
{
  "id": "uuid",
  "company_name": "Supplier Co",
  "phone": "+1234567890",
  "website": "https://supplier.com",
  "description": "We are a leading supplier...",
  "main_production_location": "New York, USA",
  "return_policy": "30-day return policy",
  "payment_method": "Wire Transfer",
  "logo": "/media/logos/supplier-logo.png",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

#### PATCH `/api/profile/supplier`
Update the current authenticated supplier's profile.

**Content-Type:** `multipart/form-data` (if uploading logo) or `application/x-www-form-urlencoded`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | No | Phone number (max 20 chars) |
| website | string | No | Website URL (max 255 chars) |
| description | string | No | Business description (text) |
| main_production_location | string | No | Main production location (max 255 chars) |
| return_policy | string | No | Return and warranty terms (text) |
| payment_method | string | No | Preferred payment method (max 100 chars) |
| logo | file | No | Profile logo image (max 5MB, jpeg/png/gif/webp) |

---

### Products API (Supplier)

Base path: `/api/products`

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated, filterable) |
| POST | `/api/products` | Create a new product |
| GET | `/api/products/{id}` | Get product detail |
| PATCH | `/api/products/{id}` | Update product (partial) |
| DELETE | `/api/products/{id}` | Soft delete product |
| POST | `/api/products/{id}/activate` | Activate product |
| POST | `/api/products/{id}/deactivate` | Deactivate product |
| PATCH | `/api/products/{id}/price` | Update product price |
| PATCH | `/api/products/{id}/stock` | Update product stock |
| GET | `/api/products/critical-stock` | Get low stock products |
| PATCH | `/api/products/bulk/price` | Bulk update prices |
| PATCH | `/api/products/bulk/stock` | Bulk update stock |
| POST | `/api/products/{id}/photos` | Add product photo |
| DELETE | `/api/products/{id}/photos/{photo_id}` | Delete product photo |

---

#### GET `/api/products`
List all products for the authenticated user with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| is_active | boolean | - | Filter by active status |
| stock_status | string | - | Filter by stock status: `in_stock`, `low_stock`, `out_of_stock` |
| stock_below | integer | - | Filter products with stock_quantity < value |
| category | string | - | Filter by product_category (exact match) |
| search | string | - | Search product_name and description (case-insensitive) |
| sort | string | - | Sort field: `created_at`, `-created_at`, `updated_at`, `-updated_at`, `unit_price`, `-unit_price`, `product_name`, `-product_name` |
| page | integer | 1 | Page number |
| page_size | integer | 20 | Items per page (max: 100) |

**Response (200):**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5
}
```

---

#### POST `/api/products`
Create a new product with optional photos.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product_name | string | Yes | Name of the product (max 200 chars) |
| product_category | string | Yes | Category of the product (max 120 chars) |
| description | string | No | Detailed product description |
| unit_price | decimal | Yes | Price per unit (≥0, max 2 decimal places) |
| stock_quantity | integer | No | Initial stock (default: 0) |
| sell_quantity | integer | No | Minimum order quantity/MOQ (default: 1) |
| features | JSON | No | Structured key/value attributes |
| is_active | boolean | No | Whether product is active (default: true) |
| photos | file[] | No | List of image files |

**Response (201):** Product object

---

#### GET `/api/products/{product_id}`
Get detailed information about a specific product.

**Response (200):**
```json
{
  "id": "uuid",
  "product_name": "Product Name",
  "product_category": "Category",
  "description": "Description...",
  "unit_price": "99.99",
  "stock_quantity": 100,
  "sell_quantity": 1,
  "stock_status": "in_stock",
  "features": {},
  "is_active": true,
  "photos": [...],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

#### PATCH `/api/products/{product_id}`
Partially update a product.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product_name | string | No | New product name |
| product_category | string | No | New product category |
| description | string | No | New description |
| unit_price | decimal | No | New price |
| stock_quantity | integer | No | New stock quantity |
| sell_quantity | integer | No | New minimum order quantity |
| features | JSON | No | New features object |
| is_active | boolean | No | New active status |
| photos_to_delete | UUID[] | No | List of photo UUIDs to delete |
| photos_to_update | object[] | No | List of `{id, sort_order}` to reorder |
| new_photos | file[] | No | New photo files to add |

---

#### DELETE `/api/products/{product_id}`
Soft delete a product (sets `is_active` to false).

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

#### POST `/api/products/{product_id}/activate`
Activate a deactivated product.

**Response (200):** Product object with `is_active: true`

---

#### POST `/api/products/{product_id}/deactivate`
Deactivate an active product.

**Response (200):** Product object with `is_active: false`

---

#### PATCH `/api/products/{product_id}/price`
Update only the unit_price of a product.

**Request Body:**
```json
{
  "unit_price": 149.99
}
```

**Response (200):** Updated product object

---

#### PATCH `/api/products/{product_id}/stock`
Update only the stock_quantity of a product.

**Request Body:**
```json
{
  "stock_quantity": 50
}
```

**Response (200):** Updated product object

---

#### GET `/api/products/critical-stock`
Get products with critical stock levels.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| threshold | integer | env setting | Stock threshold (default from `PRODUCT_LOW_STOCK_THRESHOLD`) |

**Response (200):** List of products with stock below threshold

---

#### PATCH `/api/products/bulk/price`
Bulk update product prices.

**Request Body:**
```json
{
  "items": [
    {"id": "uuid1", "unit_price": 99.99},
    {"id": "uuid2", "unit_price": 149.99}
  ]
}
```

**Response (200):**
```json
{
  "updated": 2,
  "failed": 0,
  "results": [...]
}
```

---

#### PATCH `/api/products/bulk/stock`
Bulk update product stock quantities.

**Request Body:**
```json
{
  "items": [
    {"id": "uuid1", "stock_quantity": 100},
    {"id": "uuid2", "stock_quantity": 50}
  ]
}
```

**Response (200):**
```json
{
  "updated": 2,
  "failed": 0,
  "results": [...]
}
```

---

#### POST `/api/products/{product_id}/photos`
Add a photo to a product.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photo | file | Yes | Image file |
| sort_order | integer | No | Display order (default: 0, lower = first) |

**Response (201):** Updated product object with new photo

---

#### DELETE `/api/products/{product_id}/photos/{photo_id}`
Delete a photo from a product.

**Response (200):**
```json
{
  "message": "Photo deleted successfully"
}
```

---

### Stock Status

Stock status is computed dynamically based on `stock_quantity`:

| Status | Condition |
|--------|-----------|
| `in_stock` | stock_quantity ≥ threshold (default: 10) |
| `low_stock` | 0 < stock_quantity < threshold |
| `out_of_stock` | stock_quantity = 0 |

---

### Public Products API

Base path: `/api/public/products`

No authentication required. These endpoints are for buyers.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/products/search` | No | Search products across all sellers |

---

#### GET `/api/public/products/search`
Public product search endpoint for buyers.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search query (min 2 chars). Searches product name and category |
| seller_id | UUID | No | - | Filter by seller (product owner) |
| page | integer | No | 1 | Page number |
| page_size | integer | No | 20 | Items per page (max: 100) |

**Search Ranking (results ordered by):**
1. Exact name match (case-insensitive)
2. Name starts with query
3. Name contains query
4. Category contains query

**Filtering:**
- Only active products are returned (`is_active=True`)
- If `seller_id` provided, only products from that seller

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "product_name": "Product Name",
      "product_category": "Category",
      "description": "...",
      "unit_price": "99.99",
      "stock_quantity": 100,
      "stock_status": "in_stock",
      "photos": [...],
      "seller": {
        "id": "uuid",
        "display_name": "Company Name"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "pages": 3
}
```

---

### Home Feed API

Base path: `/api/home-feed`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/home-feed` | Yes | Get homepage feed with recent searches and products |

---

#### GET `/api/home-feed`
Get the homepage feed for authenticated users.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| page_size | integer | 20 | Items per page (max: 20) |
| q | string | - | Search query (min 2 chars) |
| category | string | - | Filter by category (exact match) |
| seller_id | UUID | - | Filter by seller ID |
| hide_out_of_stock | boolean | false | Hide out-of-stock products |

**Ordering:**
- **Without search**: In-stock products first, then by recently updated, then by name
- **With search**: Ranked by match quality (exact name > starts with > contains > category), then by recently updated

**Response (200):**
```json
{
  "sections": [
    {
      "key": "recent_searches",
      "title": "Recent searches",
      "items": [
        {"query": "electronics", "searched_at": "2024-01-01T00:00:00Z"}
      ]
    },
    {
      "key": "all_products",
      "title": "All products",
      "pagination": {
        "page": 1,
        "page_size": 20,
        "total": 100,
        "total_pages": 5,
        "has_next": true,
        "has_prev": false
      },
      "items": [
        {
          "id": "uuid",
          "product_name": "Product",
          "product_category": "Category",
          "description_preview": "First 120 chars...",
          "photos": [...],
          "unit_price": "99.99",
          "sell_quantity": 1,
          "stock_quantity": 50,
          "stock_status": "in_stock",
          "seller": {
            "id": "uuid",
            "display_name": "Company Name"
          },
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

---

### Watchlist API

Base path: `/api/watchlist`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/watchlist` | Yes | Get paginated watchlist items |
| POST | `/api/watchlist` | Yes | Add product to watchlist |
| DELETE | `/api/watchlist/{product_id}` | Yes | Remove product from watchlist |
| GET | `/api/watchlist/ids` | Yes | Get all product IDs in watchlist |

---

#### GET `/api/watchlist`
Get paginated list of products in user's watchlist.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| page_size | integer | 20 | Items per page (max: 50) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "product_name": "Product Name",
        "product_category": "Category",
        "description_preview": "First 120 chars...",
        "photos": [{"id": "uuid", "url": "/media/..."}],
        "unit_price": "99.99",
        "sell_quantity": 1,
        "stock_quantity": 50,
        "stock_status": "in_stock",
        "seller": {
          "id": "uuid",
          "display_name": "Company Name"
        }
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

#### POST `/api/watchlist`
Add a product to the user's watchlist.

**Request Body:**
```json
{
  "product_id": "uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "product": {...},
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Response (409):** Product already in watchlist
```json
{
  "detail": "Product already in watchlist"
}
```

---

#### DELETE `/api/watchlist/{product_id}`
Remove a product from the user's watchlist.

**Response (200):**
```json
{
  "success": true
}
```

**Response (404):** Product not in watchlist
```json
{
  "detail": "Item not found in watchlist"
}
```

---

#### GET `/api/watchlist/ids`
Get all product IDs in the user's watchlist (for quick checks).

**Response (200):**
```json
{
  "product_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

### AI API

Base path: `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Yes | AI chat assistant |

---

#### POST `/api/ai/chat`
AI-powered chat endpoint for assistance.

**Request Body:**
```json
{
  "message": "Tell me about this product",
  "product_id": 123,
  "supplier_id": 456
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's message |
| product_id | integer | No | Related product ID for context |
| supplier_id | integer | No | Related supplier ID for context |

**Response (200):**
```json
{
  "reply": "AI response message...",
  "from_cache": false,
  "degraded": false
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Invalid data format |
| 500 | Internal Server Error |

### Validation Error Response

```json
{
  "detail": "field_name: error message",
  "errors": [
    {
      "loc": ["body", "field_name"],
      "msg": "error message",
      "type": "error_type"
    }
  ]
}
```

---

## Configuration

### Environment Variables

```bash
# .env file in backend directory

# Database
DATABASE_URL=sqlite:///db.sqlite3

# JWT Settings
SECRET_KEY=your-secret-key

# Product Settings
PRODUCT_LOW_STOCK_THRESHOLD=10  # Default low stock threshold

# Debug Mode
DEBUG=True
```

---

## Running Tests

```bash
cd backend
python manage.py test
```

Run tests for specific apps:

```bash
python manage.py test products
python manage.py test users
python manage.py test ai
python manage.py test home
```

---

## License

MIT License
