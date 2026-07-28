# Wear E-Commerce Platform - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Environment Configuration](#environment-configuration)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment](#deployment)
11. [Development Setup](#development-setup)
12. [Known Issues & Areas for Improvement](#known-issues--areas-for-improvement)

---

## Project Overview

**Wear** is a full-stack e-commerce platform built for selling clothing and fashion items. The platform includes a modern Next.js frontend and a robust Express.js backend API, supporting features like product management, shopping cart, wishlist, order processing, user authentication, and an admin dashboard.

### Key Characteristics
- **Type**: E-commerce platform
- **Architecture**: Monorepo with separate frontend and backend
- **Deployment**: Frontend on Vercel, Backend on Render
- **Database**: PostgreSQL (hosted on Render)
- **Image Storage**: Cloudinary CDN

---

## Architecture

### System Architecture

```
┌─────────────────┐
│   Next.js App   │  (Frontend - Vercel)
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express API    │  (Backend - Render)
│   Port: 3001    │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Database - Render)
│   Port: 5432    │
└─────────────────┘
         │
┌────────▼────────┐
│   Cloudinary    │  (Image CDN)
└─────────────────┘
```

### Frontend Architecture
- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API (Auth, Cart, Wishlist, Theme, Order Notifications)
- **Data Fetching**: SWR for API caching and request deduplication
- **UI Components**: Radix UI, Headless UI, custom components
- **3D Features**: React Three Fiber for 3D product visualization

### Backend Architecture
- **Framework**: Express.js 4.18.2
- **Language**: JavaScript (Node.js)
- **ORM**: Sequelize 6.35.2
- **Database**: PostgreSQL 8.11.3
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

---

## Tech Stack

### Frontend Dependencies
```json
{
  "next": "15.5.9",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "^5",
  "tailwindcss": "^3.4.17",
  "swr": "^2.4.0",
  "@headlessui/react": "^2.2.7",
  "@radix-ui/react-*": "various",
  "framer-motion": "^12.23.12",
  "@react-three/fiber": "^9.4.0",
  "@react-three/drei": "^10.7.7",
  "three": "^0.181.2",
  "react-hook-form": "^7.62.0",
  "zod": "^4.1.5"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.35.2",
  "pg": "^8.11.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cloudinary": "^1.41.3",
  "multer": "^1.4.5-lts.1",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4"
}
```

---

## Features

### User Features
- ✅ User registration and authentication (JWT-based)
- ✅ User profile management with preferences
- ✅ Shopping cart functionality
- ✅ Wishlist functionality
- ✅ Product browsing and search
- ✅ Category and collection filtering
- ✅ Product detail pages with multiple images
- ✅ Checkout process
- ✅ Order history and tracking
- ✅ Address management
- ✅ Dark mode support
- ✅ Responsive design
- ✅ 3D product visualization (T-shirt designer)

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Collection management
- ✅ Order management and status updates
- ✅ User management
- ✅ Image upload with Cloudinary integration
- ✅ Bulk operations

### Technical Features
- ✅ Rate limiting for API protection
- ✅ Full-text search with PostgreSQL
- ✅ Database indexing for performance
- ✅ Image optimization (Next.js Image component)
- ✅ Lazy loading for below-the-fold content
- ✅ API response caching (SWR)
- ✅ Request deduplication
- ✅ ETags for HTTP caching
- ✅ Compression middleware
- ✅ Security headers (Helmet)
- ✅ Input validation (express-validator)

---

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize configuration
│   ├── controllers/
│   │   ├── adminController.js   # Admin operations
│   │   ├── authController.js    # Authentication
│   │   ├── cartController.js    # Shopping cart
│   │   ├── categoryController.js
│   │   ├── collectionController.js
│   │   ├── orderController.js   # Order processing
│   │   ├── productController.js # Product CRUD
│   │   └── wishlistController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── upload.js            # Multer + Cloudinary
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Collection.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   ├── Address.js
│   │   ├── ProductCategory.js   # Join table
│   │   ├── ProductCollection.js # Join table
│   │   └── associations.js     # Sequelize relationships
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── products.js
│   │   ├── collections.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── wishlist.js
│   │   ├── orders.js
│   │   └── health.js
│   ├── scripts/
│   │   ├── seed.js              # Database seeding
│   │   ├── create-admin.js      # Admin user creation
│   │   ├── seedCategories.js
│   │   ├── migrate-images-to-cloudinary.js
│   │   └── cleanup-unused-images.js
│   ├── utils/
│   │   ├── cloudinary.js        # Cloudinary helper
│   │   ├── dbOptimization.js    # Database indexes
│   │   ├── dbMonitor.js         # Database monitoring
│   │   └── queryTimeout.js      # Query timeout handling
│   └── index.js                 # Main application entry
├── uploads/                      # Local upload directory (dev only)
├── .env                          # Environment variables
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # Homepage
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Global styles
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── account/             # User account page
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── product/[slug]/      # Product detail
│   │   ├── products/            # Product listing
│   │   ├── category/[slug]/     # Category page
│   │   ├── collections/[slug]/  # Collection page
│   │   ├── search/              # Search results
│   │   └── designer/            # 3D T-shirt designer
│   ├── components/
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── Categories.tsx
│   │   ├── Collections.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartPanel.tsx
│   │   ├── WishlistButton.tsx
│   │   ├── TShirt3D.tsx         # 3D visualization
│   │   ├── ImageEditor.tsx      # Image editing
│   │   └── ui/                  # Reusable UI components
│   ├── lib/
│   │   ├── api.ts               # API client configuration
│   │   ├── utils.ts             # Utility functions
│   │   ├── contexts/            # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   ├── WishlistContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── OrderNotificationContext.tsx
│   │   └── hooks/               # Custom React hooks
│   │       ├── useProducts.ts   # SWR hook for products
│   │       └── useCollections.ts
│   └── public/                  # Static assets
│       └── models/              # 3D model files
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts
└── package.json
```

---

## API Documentation

### Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://wear-backend.onrender.com/api` (or your Render URL)

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login user |
| POST | `/logout` | Yes | Logout user |
| GET | `/me` | Yes | Get current user profile |
| PUT | `/profile` | Yes | Update user profile |
| PUT | `/profile/update` | Yes | Comprehensive profile update |
| PUT | `/change-password` | Yes | Change password |
| POST | `/forgot-password` | No | Request password reset |
| POST | `/reset-password` | No | Reset password with token |
| PUT | `/2fa` | Yes | Toggle 2FA |
| POST | `/2fa/verify` | Yes | Verify 2FA code |

#### Products (`/api/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | List products (with pagination, search, filters) |
| GET | `/:idOrSlug` | Optional | Get product by ID or slug |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |

**Query Parameters for GET `/`:**
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100)
- `search`: Search query (full-text search)
- `category`: Filter by category slug
- `collection`: Filter by collection slug
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `sortBy`: Sort field (name, price, createdAt)
- `order`: Sort order (ASC, DESC)

#### Categories (`/api/categories`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all categories |
| GET | `/:slug/products` | No | Get products in category |

#### Collections (`/api/collections`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all collections |
| GET | `/:slug` | No | Get collection details |
| GET | `/:slug/products` | No | Get products in collection |

#### Cart (`/api/cart`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's cart |
| POST | `/add` | Yes | Add item to cart |
| PUT | `/update/:itemId` | Yes | Update cart item quantity |
| DELETE | `/remove/:itemId` | Yes | Remove item from cart |
| DELETE | `/clear` | Yes | Clear entire cart |

#### Wishlist (`/api/wishlist`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's wishlist |
| POST | `/add` | Yes | Add product to wishlist |
| DELETE | `/remove/:productId` | Yes | Remove product from wishlist |

#### Orders (`/api/orders`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get user's orders |
| GET | `/:id` | Yes | Get order by ID |
| POST | `/create` | Yes | Create new order |

#### Admin (`/api/admin`)
All admin routes require admin privileges.

**Users:**
- `GET /users` - List all users
- `GET /users/search` - Search users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PUT /users/:id/admin` - Toggle admin status
- `GET /users/:id/addresses` - Get user addresses
- `POST /users/:id/addresses` - Add user address
- `PUT /users/:id/addresses/:addressId` - Update address
- `DELETE /users/:id/addresses/:addressId` - Delete address

**Orders:**
- `GET /orders` - List all orders
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Delete order

**Categories:**
- `GET /categories` - List categories
- `GET /categories/:id` - Get category
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

**Dashboard:**
- `GET /dashboard` - Get dashboard statistics

#### Health (`/api/health`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check endpoint |

---

## Database Schema

### Core Models

#### User
```javascript
{
  id: INTEGER (Primary Key, Auto Increment)
  email: STRING (Unique, Not Null)
  password: STRING (Hashed with bcrypt)
  firstName: STRING(50)
  lastName: STRING(50)
  phone: STRING (Optional)
  role: ENUM('user', 'admin') (Default: 'user')
  isActive: BOOLEAN (Default: true)
  preferences: JSON (Size preference, favorite categories)
  twoFactorEnabled: BOOLEAN (Default: false)
  twoFactorSecret: STRING (Optional)
  createdAt: DATE
  updatedAt: DATE
}
```

#### Product
```javascript
{
  id: INTEGER (Primary Key)
  name: STRING(200)
  slug: STRING(220) (Unique)
  description: TEXT
  SKU: STRING(100) (Unique)
  weightGrams: INTEGER
  isActive: BOOLEAN
  imageUrl: STRING(500) (Main image)
  images: JSON (Array of image URLs)
  mainThumbnailIndex: INTEGER
  price: DECIMAL(10,2)
  compareAtPrice: DECIMAL(10,2) (Optional)
  costPerItem: DECIMAL(10,2) (Optional)
  barcode: STRING (Optional)
  inventory: INTEGER (Default: 0)
  trackInventory: BOOLEAN
  createdAt: DATE
  updatedAt: DATE
}
```

#### Category
```javascript
{
  id: INTEGER (Primary Key)
  name: STRING(100)
  slug: STRING(120) (Unique)
  description: TEXT
  imageUrl: STRING(500)
  isActive: BOOLEAN
  createdAt: DATE
  updatedAt: DATE
}
```

#### Collection
```javascript
{
  id: INTEGER (Primary Key)
  name: STRING(100)
  slug: STRING(120) (Unique)
  description: TEXT
  imageUrl: STRING(500)
  isActive: BOOLEAN
  createdAt: DATE
  updatedAt: DATE
}
```

#### Order
```javascript
{
  id: INTEGER (Primary Key)
  userId: INTEGER (Foreign Key -> User)
  status: ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
  totalAmount: DECIMAL(10,2)
  shippingAddress: JSON
  billingAddress: JSON
  paymentMethod: STRING
  paymentStatus: ENUM('pending', 'paid', 'failed', 'refunded')
  trackingNumber: STRING
  notes: TEXT
  createdAt: DATE
  updatedAt: DATE
}
```

#### OrderItem
```javascript
{
  id: INTEGER (Primary Key)
  orderId: INTEGER (Foreign Key -> Order)
  productId: INTEGER (Foreign Key -> Product)
  quantity: INTEGER
  price: DECIMAL(10,2) (Price at time of order)
  createdAt: DATE
  updatedAt: DATE
}
```

#### Cart
```javascript
{
  id: INTEGER (Primary Key)
  userId: INTEGER (Foreign Key -> User, Unique)
  items: JSON (Array of {productId, quantity, price})
  createdAt: DATE
  updatedAt: DATE
}
```

#### Wishlist
```javascript
{
  id: INTEGER (Primary Key)
  userId: INTEGER (Foreign Key -> User, Unique)
  productIds: JSON (Array of product IDs)
  createdAt: DATE
  updatedAt: DATE
}
```

#### Address
```javascript
{
  id: INTEGER (Primary Key)
  userId: INTEGER (Foreign Key -> User)
  type: ENUM('home', 'work', 'other')
  street: STRING
  city: STRING
  state: STRING
  zipCode: STRING
  country: STRING
  isDefault: BOOLEAN
  createdAt: DATE
  updatedAt: DATE
}
```

### Relationships
- User `hasMany` Address
- User `hasOne` Cart
- User `hasOne` Wishlist
- User `hasMany` Order
- Order `hasMany` OrderItem
- OrderItem `belongsTo` Product
- Product `belongsToMany` Category (through ProductCategory)
- Product `belongsToMany` Collection (through ProductCollection)

### Indexes
- `idx_products_fulltext` - Full-text search on products
- `idx_products_barcode` - Barcode lookup
- `idx_products_slug` - Slug lookup
- `idx_users_email` - Email lookup
- `idx_orders_userId` - User orders lookup
- `idx_orders_status` - Order status filtering

---

## Environment Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=production|development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wear_db
DB_USER=postgres
DB_PASSWORD=your_password
# OR use DATABASE_URL for managed PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure

# Frontend URL (for CORS)
FRONTEND_URL=https://weary-iota.vercel.app

# Admin Auto-Creation (remove after first use)
ADMIN_EMAIL=admin@weary.com
ADMIN_PASSWORD=secure_password
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File Upload
UPLOAD_DIR=uploads

# Rate Limiting
ENABLE_RATE_LIMIT=true
```

### Frontend Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# Or leave empty to use relative /api (proxied by Next.js)

# Other Next.js variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Performance Optimizations

See `PERFORMANCE_OPTIMIZATIONS.md` for detailed information. Summary:

### Backend Optimizations ✅
1. **Rate Limiting**: 100 req/15min (production), 1000 req/15min (development)
2. **Full-Text Search**: PostgreSQL GIN index (75% faster queries)
3. **Database Indexes**: Created in all environments
4. **ETags**: HTTP caching headers
5. **Compression**: Response compression middleware

### Frontend Optimizations ✅
1. **Image Optimization**: Next.js Image component with AVIF/WebP support
2. **Lazy Loading**: Below-the-fold components loaded on demand
3. **SWR Caching**: Request deduplication and 60s cache window
4. **React.memo**: ProductCard optimization to prevent unnecessary re-renders
5. **Code Splitting**: Automatic with Next.js App Router

### Expected Improvements
- Search queries: ~75% faster (200ms → 50ms)
- Database queries: 30-50% faster
- Initial page load: 20-30% faster
- Image loading: 40-60% smaller file sizes
- API calls: Eliminated duplicates, instant cached responses

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set build command: `cd frontend && npm install && npm run build`
3. Set output directory: `frontend/.next`
4. Configure environment variables
5. Deploy

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Configure environment variables
6. Set up PostgreSQL database on Render
7. Deploy

### Database (Render PostgreSQL)
- Managed PostgreSQL instance
- Connection pooling configured
- SSL enabled for production
- Automatic backups

### Image Storage (Cloudinary)
- CDN for all product images
- Automatic optimization
- Multiple format support (WebP, AVIF)
- Responsive image delivery

---

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env.local if needed
npm run dev
```

### Database Setup
```bash
# Create database
createdb wear_db

# Run migrations (automatic on startup)
# Or manually seed:
cd backend
npm run seed
npm run admin:create
```

### Running the Application
1. Start PostgreSQL
2. Start backend: `cd backend && npm run dev` (port 3001)
3. Start frontend: `cd frontend && npm run dev` (port 3000)
4. Access: http://localhost:3000

---

## Known Issues & Areas for Improvement

### Current Limitations
1. **No Redis Caching**: Consider adding Redis for server-side caching
2. **No Email Service**: Password reset and notifications not fully implemented
3. **No Payment Integration**: Checkout process doesn't process payments
4. **Limited Error Handling**: Some edge cases may not be handled gracefully
5. **No Analytics**: No user behavior tracking or analytics integration
6. **No Search Autocomplete**: Search doesn't have autocomplete suggestions
7. **No Product Reviews**: Review/rating system not implemented
8. **No Inventory Alerts**: Low stock notifications not implemented
9. **No Order Tracking Integration**: Tracking numbers are manual
10. **No Multi-language Support**: Single language (English) only

### Security Considerations
1. **Rate Limiting**: Currently enabled but may need tuning
2. **Input Sanitization**: Some user inputs may need additional sanitization
3. **SQL Injection**: Protected by Sequelize, but should audit raw queries
4. **XSS Protection**: Helmet configured, but verify all user-generated content
5. **CSRF Protection**: Not currently implemented
6. **API Key Management**: Consider rotating secrets regularly

### Performance Opportunities
1. **CDN Integration**: Fully utilize Cloudinary CDN for all assets
2. **Database Query Optimization**: Some queries could be optimized further
3. **Connection Pooling**: Consider PgBouncer for production
4. **Caching Strategy**: Implement Redis for frequently accessed data
5. **Image Optimization**: Further optimize image sizes and formats
6. **Bundle Size**: Analyze and reduce frontend bundle size
7. **API Response Pagination**: Some endpoints may need pagination

### Feature Enhancements
1. **Product Variants**: Size, color, material variants
2. **Advanced Search**: Filters for multiple attributes
3. **Product Recommendations**: AI/ML-based recommendations
4. **Wishlist Sharing**: Share wishlists with others
5. **Gift Cards**: Gift card system
6. **Loyalty Program**: Points and rewards system
7. **Social Login**: OAuth integration (Google, Facebook)
8. **Product Comparison**: Compare multiple products
9. **Recently Viewed**: Track and display recently viewed products
10. **Advanced Admin Analytics**: More detailed analytics dashboard

### Code Quality
1. **TypeScript Migration**: Consider migrating backend to TypeScript
2. **Testing**: Add unit and integration tests
3. **API Documentation**: Consider OpenAPI/Swagger documentation
4. **Error Logging**: Implement proper error logging (e.g., Sentry)
5. **Code Documentation**: Add JSDoc comments to complex functions
6. **Linting**: Ensure consistent code style across the project

### DevOps
1. **CI/CD Pipeline**: Set up automated testing and deployment
2. **Monitoring**: Add application performance monitoring (APM)
3. **Logging**: Centralized logging solution
4. **Backup Strategy**: Automated database backups
5. **Staging Environment**: Separate staging environment for testing
6. **Database Migrations**: Version-controlled migrations

---

## Additional Notes

### API Response Format
Standard API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Authentication Flow
1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT token
3. Client stores token (localStorage/sessionStorage)
4. Client includes token in `Authorization: Bearer <token>` header for protected routes
5. Server validates token via `protect` middleware

### File Upload Flow
1. Client uploads image via multipart/form-data
2. Multer middleware handles file upload
3. File uploaded to Cloudinary
4. Cloudinary returns optimized URL
5. URL stored in database

### Order Processing Flow
1. User adds items to cart
2. User proceeds to checkout
3. User provides shipping/billing information
4. Order created via `/api/orders/create`
5. Order status: pending → processing → shipped → delivered
6. Admin can update order status via `/api/admin/orders/:id/status`

---

## Contact & Support

For questions or issues, please refer to the project repository or contact the development team.

---

**Last Updated**: February 2026
**Version**: 1.0.0
