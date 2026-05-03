# ProjectMC - Technical Guide for Teacher Presentation

## Executive Summary
ProjectMC is a full-stack web application for an e-commerce marketplace platform. It consists of a **React frontend**, **Node.js/Express backend**, and **Python AI services** for sales forecasting and restocking alerts.

---

## 1. Architecture Overview

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Frontend (Vite + TypeScript)           │   │
│  │  • Pages: Login, Products, Cart, Orders, etc.        │   │
│  │  • Context APIs: Auth, Cart, Favorites               │   │
│  │  • Tailwind CSS + Radix UI Components                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────────────────────────┘
             │ HTTP/HTTPS Requests (REST API)
             │ JWT Token in Authorization Header
             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (PORT 5001)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Express.js + Node.js                               │   │
│  │   • Routes: /api/auth, /api/products, etc.           │   │
│  │   • Controllers: Business logic                       │   │
│  │   • Middleware: CORS, Authentication, File Upload    │   │
│  │   • Multer + Cloudinary: Image storage               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Supabase PostgreSQL Database                     │   │
│  │  • Tables: users, products, orders, shops, etc.      │   │
│  │  • Authentication: Built-in JWT system               │   │
│  │  • Storage: File uploads                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬──────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────┐
             │ Separate Python AI Service (Port TBD)    │
             ▼                                          ▼
    ┌──────────────────────┐          ┌────────────────────────┐
    │  Sales Forecasting   │          │  Restock Alerts        │
    │  ML Model            │          │  ML Model              │
    │  (final_demand_      │          │  (restock_alerts.csv)  │
    │   forecast_7day.csv) │          │                        │
    └──────────────────────┘          └────────────────────────┘
```

---

## 2. How Frontend and Backend Are Linked

### A. Development Connection (Vite Proxy)

**Problem:** Browsers have CORS restrictions. When frontend runs on `localhost:5173` and backend on `localhost:5001`, direct requests get blocked.

**Solution:** Vite's Proxy Configuration
```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5001',  // Backend server
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**How it works:**
1. Frontend makes request to `/api/auth/login`
2. Vite intercepts it and forwards to `http://127.0.0.1:5001/api/auth/login`
3. Response returns to frontend
4. No CORS issues because Vite handles the forwarding

### B. Backend CORS Configuration

**file:** [backend/server.js](backend/server.js#L24)

```javascript
app.use(cors({
    origin: '*',  // Accept requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

This allows the production frontend to communicate with the backend from any domain.

### C. API Communication Flow

```
User Action (Click Login Button)
    ▼
Frontend: authService.login(email, password)
    ▼
API Layer: fetch('/api/auth/login', {...})
    ▼
[Vite Proxy during dev / Direct HTTPS in prod]
    ▼
Backend: Express route handler
    ▼
Controller: Process request (validate, database query)
    ▼
Supabase: Execute database operation
    ▼
Response: JSON { session, userId, role, ... }
    ▼
Frontend: Store token in localStorage
    ▼
User logged in ✓
```

---

## 3. Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | Latest |
| **TypeScript** | Type safety | Latest |
| **Vite** | Build tool & dev server | Latest |
| **Tailwind CSS** | Styling | v3 |
| **Radix UI** | Accessible components | Latest |
| **React Router** | Page navigation | v6 |
| **Supabase Client** | Auth & real-time features | ^2.101.1 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Express.js** | Web framework | ^5.2.1 |
| **Node.js** | Runtime | v18+ |
| **Supabase** | Database & Auth | ^2.102.1 |
| **Multer** | File uploads | ^2.1.1 |
| **Cloudinary** | Image storage | ^2.9.0 |
| **Mongoose** | Data validation | ^9.2.1 |
| **CORS** | Cross-origin handling | ^2.8.6 |
| **Dotenv** | Environment variables | ^17.3.1 |

### Database
| Component | Technology |
|-----------|-----------|
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth (JWT) |
| **Real-time** | Supabase Realtime subscriptions |
| **File Storage** | Cloudinary CDN |

---

## 4. Request Flow - Detailed Example: User Login

### Step 1: Frontend Makes Request
**File:** [frontend/src/services/auth.service.ts](frontend/src/services/auth.service.ts)
```typescript
export const authService = {
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { email, password })
};
```

### Step 2: API Layer Adds Authentication
**File:** [frontend/src/services/api.ts](frontend/src/services/api.ts)
```typescript
const token = getToken();  // Get JWT from localStorage
if (token && !isPublicRoute) {
    headers['Authorization'] = `Bearer ${token}`;  // Add for authenticated requests
}

const fullUrl = `${BASE_URL}${path}`;  // /api/auth/login
const res = await fetch(fullUrl, { ...options, headers });
```

### Step 3: Backend Receives & Processes
**File:** [backend/routes/auth.routes.js](backend/routes/auth.routes.js)
```javascript
router.post("/login", authController.signInUser);
```

**File:** [backend/controllers/auth.controller.js](backend/controllers/auth.controller.js#L30)
```javascript
exports.signInUser = async (req, res) => {
  const { email, password } = req.body;
  
  // Use Supabase to authenticate
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from("utilisateur")
    .select("role, nom_utilisateur, photo_url")
    .eq("id", data.user.id)
    .single();

  // Return response
  res.json({
    message: "Login successful",
    userId: data.user.id,
    email: data.user.email,
    role: profile.role,
    session: { access_token: data.session.access_token }
  });
};
```

### Step 4: Frontend Stores Token & Updates State
**File:** [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx#L71)
```typescript
const login = async (email: string, password: string) => {
  const data = await authService.login(email, password);
  
  // Store JWT token
  localStorage.setItem(TOKEN_KEY, data.session.access_token);
  
  // Update user state
  const loggedUser: User = {
    id: data.userId,
    email: data.email,
    role: mappedRole,
    name: displayName
  };
  
  setUser(loggedUser);
  localStorage.setItem('auth_user', JSON.stringify(loggedUser));
};
```

---

## 5. Authentication & Authorization System

### JWT Token Flow
```
1. User logs in with email/password
   ▼
2. Backend validates with Supabase Auth
   ▼
3. Supabase returns JWT access_token
   ▼
4. Frontend stores token in localStorage
   ▼
5. Every subsequent request includes: Authorization: Bearer <token>
   ▼
6. Backend verifies token with middleware
   ▼
7. If valid → proceed, If invalid → 401 Unauthorized
```

### Authentication Middleware
**File:** [backend/middleware/auth.middleware.js](backend/middleware/auth.middleware.js)

```javascript
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];  // Extract token
  const { data, error } = await supabase.auth.getUser(token);  // Verify with Supabase
  
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;  // Attach user to request
  next();
};
```

### Role-Based Access Control (RBAC)
**File:** [backend/middleware/admin.middleware.js](backend/middleware/admin.middleware.js)

```javascript
const verifyAdmin = async (req, res, next) => {
  const userId = req.user?.id;
  const { data: admin } = await supabase
    .from("admin")
    .select("id")
    .eq("id", userId)
    .single();
  
  if (!admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
```

**Usage in routes:**
```javascript
router.patch('/:id/statut', verifyToken, verifyAdmin, updateUserStatus);
// Only authenticated users with admin role can access this route
```

---

## 6. Database Architecture

### Entity Relationship Overview
```
┌──────────────────┐
│  utilisateur     │  (All users)
│  (id, email,     │
│   role, etc.)    │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐┌───────┐┌─────────┐
│ client ││ admin ││ magasin │  (Vendor-specific)
└────────┘└───────┘└────┬────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  produit     │  (Products)
                 │  (name,      │
                 │   price...)  │
                 └──────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    ┌────────┐    ┌─────────┐    ┌──────────┐
    │ panier │    │ commande│    │   avis   │
    │(items) │    │ (orders)│    │(reviews) │
    └────────┘    └─────────┘    └──────────┘
```

### Key Tables

**utilisateur (Users)**
```sql
- id: UUID (primary key)
- email: VARCHAR (unique)
- role: ENUM ('client', 'vendeur', 'admin')
- nom_utilisateur: VARCHAR
- photo_url: TEXT
- created_at: TIMESTAMP
```

**magasin (Shops/Stores)**
```sql
- id: UUID (primary key)
- id_vendeur: UUID (foreign key → utilisateur)
- nom_magasin: VARCHAR
- description: TEXT
- statut: ENUM ('actif', 'suspendu', 'nonValide')
```

**produit (Products)**
```sql
- id: UUID (primary key)
- id_magasin: UUID (foreign key → magasin)
- nom_produit: VARCHAR
- description: TEXT
- prix: DECIMAL
- photo_url: TEXT
- stock: INTEGER
```

---

## 7. API Endpoints Overview

### Authentication Endpoints
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | Create account | ❌ No |
| POST | `/api/auth/login` | Login | ❌ No |
| GET | `/api/auth/logout` | Logout | ✅ Yes |

### Product Endpoints
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/produits` | List all products | ❌ No |
| GET | `/api/produits/:id` | Get product details | ❌ No |
| POST | `/api/produits` | Create product | ✅ Yes (Vendor) |
| PUT | `/api/produits/:id` | Update product | ✅ Yes (Owner) |
| DELETE | `/api/produits/:id` | Delete product | ✅ Yes (Owner) |

### Order Endpoints
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/commandes` | Create order | ✅ Yes |
| GET | `/api/commandes/user/:id` | Get user orders | ✅ Yes |
| PUT | `/api/commandes/:id/statut` | Update order status | ✅ Yes (Vendor/Admin) |

### User Endpoints
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/utilisateurs` | List all users | ✅ Yes (Admin) |
| GET | `/api/utilisateurs/:id` | Get user profile | ✅ Yes |
| PATCH | `/api/clients/:id/statut` | Ban/suspend user | ✅ Yes (Admin) |

---

## 8. Key Features Implementation

### Feature 1: User Registration (Multiple Roles)

**Frontend Flow:**
```typescript
// Step 1: User selects role (customer, vendor, admin)
// Step 2: Form submission
await authService.register(
  name, email, password, 
  role,           // 'vendor' | 'customer' | 'admin'
  storeName,      // Required if vendor
  storeDescription
);
```

**Backend Processing:**
1. **Supabase Auth:** Create user account
2. **Role-based actions:**
   - **Vendor:** Call `upgrade_to_vendeur()` RPC, create store entry
   - **Admin:** Create admin entry
   - **Customer:** No extra action
3. **Response:** Success message + user data

### Feature 2: Shopping Cart (Frontend Context)

**File:** [frontend/src/app/contexts/CartContext.tsx](frontend/src/app/contexts/CartContext.tsx)

```typescript
// Uses React Context API - NO backend needed for cart
// Data stored in localStorage

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addToCart = (product: Product) => {
    // Add to local state
    // Persist to localStorage
  };
  
  const checkout = async () => {
    // Send cart items to backend
    // Backend creates order in database
    // Clear local cart
  };
};
```

**Why this approach?**
- Fast & responsive (no server round-trips for every click)
- Works offline
- Reduces server load

### Feature 3: File Upload (Images with Cloudinary)

**Frontend:**
```typescript
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/produits/upload', formData);
  // Returns: { image_url, public_id }
};
```

**Backend:**
```javascript
// middleware/upload.js
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'projectmc_products',
    resource_type: 'auto'
  }
});

const upload = multer({ storage });

// routes/produit.routes.js
router.post('/', upload.single('file'), createProduit);
```

**Flow:**
1. Frontend sends file to backend
2. Multer + Cloudinary store image on CDN
3. Returns image URL
4. URL saved in database
5. Frontend displays image

### Feature 4: Real-time Notifications

**File:** [backend/utils/notification.helper.js](backend/utils/notification.helper.js)

```javascript
const sendNotification = async (userId, message, type) => {
  const { error } = await supabase
    .from('notification')
    .insert({
      id_utilisateur: userId,
      contenu: message,
      type: type,  // 'order', 'message', 'promo'
      read: false,
      created_at: new Date()
    });
};

// Called after order creation, message received, etc.
```

---

## 9. Development Workflow

### Starting the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm run dev  # Starts on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev  # Starts on http://localhost:5173
```

**Optional: AI Services**
```bash
cd servicesAI
pip install -r requirements.txt
python ml_service.py
```

### How They Communicate During Development

```
Browser: http://localhost:5173
    │ requests to /api/products
    ▼
Vite Dev Server (localhost:5173)
    │ [Proxy rule] redirect to http://localhost:5001/api/products
    ▼
Express Backend (localhost:5001)
    │ process request
    ▼
Response sent back through proxy
    ▼
Browser displays result
```

### Production Deployment

**Frontend:**
```bash
npm run build  # Creates dist/ folder with optimized build
# Deploy dist/ to hosting (Vercel, Netlify, etc.)
# Update API_BASE_URL to production backend
```

**Backend:**
```bash
# Deploy to server (Heroku, DigitalOcean, AWS, etc.)
# Environment variables: SUPABASE_URL, SUPABASE_KEY, PORT
# API URLs are direct (no proxy needed)
```

---

## 10. Data Security

### 1. Authentication
- ✅ JWT tokens stored in localStorage
- ✅ Tokens included in Authorization header
- ✅ Backend verifies every token

### 2. Database Access
- ✅ Supabase Row Level Security (RLS) policies
- ✅ Users can only see their own orders
- ✅ Vendors can only manage their own products

### 3. File Upload Security
- ✅ Files go through Cloudinary CDN
- ✅ No files stored on server
- ✅ Cloudinary handles security & optimization

### 4. Environment Variables
```bash
# .env file (NEVER commit to git)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
```

---

## 11. Common Technical Questions & Answers

### Q1: How does the frontend know which backend to call?
**A:** During development, Vite's proxy redirects `/api/*` requests to the backend server. In production, the frontend and backend share the same domain or the API URL is configured in environment variables.

### Q2: How is the user authenticated?
**A:** 
1. User logs in with email/password
2. Backend validates with Supabase Auth
3. Supabase returns JWT token
4. Frontend stores token in localStorage
5. Token sent with every request in Authorization header
6. Backend verifies token before processing

### Q3: Can the frontend directly access the database?
**A:** No. All database access goes through the Express backend. Frontend can't make direct SQL queries (this prevents unauthorized access and data leaks).

### Q4: How are images stored?
**A:** Images go to Cloudinary CDN (not stored on the backend server). URLs saved in database, frontend loads images from CDN links.

### Q5: What happens if a user loses their authentication token?
**A:** Token stored in localStorage. If user closes browser/clears cache, they need to log in again. Tokens expire after a period (security feature).

### Q6: How do vendors create products?
**A:**
1. Register as vendor (creates store entry)
2. Admin approves store
3. Vendor creates products (linked to their store)
4. Products visible in marketplace
5. Customers can order

### Q7: How does the order process work?
**A:**
1. Customer adds items to cart (localStorage)
2. Clicks checkout
3. Frontend sends cart items to backend
4. Backend creates order record in database
5. Backend sends notification to vendor
6. Frontend clears cart
7. Customer sees order confirmation

### Q8: What's the role of the AI services?
**A:** 
- **Demand Forecasting:** Predicts sales for next 7 days
- **Restock Alerts:** Warns vendors when stock is low
- Runs separately, provides CSV reports

---

## 12. Project Statistics

- **Frontend Files:** 50+ TypeScript/React files
- **Backend Routes:** 50+ API endpoints
- **Database Tables:** 15+ tables
- **Users Roles:** 4 (visitor, customer, vendor, admin)
- **Key Features:** 20+ (auth, products, orders, cart, chat, notifications, etc.)

---

## 13. Conclusion

**Key Takeaways:**
1. ✅ **Separation of Concerns:** Frontend handles UI, Backend handles business logic
2. ✅ **RESTful API:** Standardized HTTP endpoints for communication
3. ✅ **JWT Authentication:** Secure token-based authentication
4. ✅ **Scalable Architecture:** Can handle multiple users, vendors, products
5. ✅ **Real-time Features:** Notifications, chat capabilities
6. ✅ **Production Ready:** Error handling, logging, security best practices

This architecture is professional, scalable, and follows industry best practices!

---

## Appendix: Running the Project

### Prerequisites
- Node.js v18+
- npm or yarn
- Git
- Supabase account (free tier works)

### Quick Start
```bash
# Clone repo
git clone [repo-url]
cd projectMc-master

# Backend setup
cd backend
npm install
cp .env.example .env  # Add SUPABASE credentials
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Open browser
# http://localhost:5173
```

### Test Login Credentials
```
Email: testiii@gmail.com
Password: password
Role: client
```

---

**Author:** Generated for ProjectMC Presentation  
**Date:** May 2026  
**Version:** 1.0
