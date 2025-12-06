# SmartScan Pro - Complete Architecture & Flowcharts

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [User Authentication Flow](#4-user-authentication-flow)
5. [Product Scanning & Recognition Flow](#5-product-scanning--recognition-flow)
6. [AI Visual Search Flow](#6-ai-visual-search-flow)
7. [Shopping Cart Flow](#7-shopping-cart-flow)
8. [Stripe Payment Flow](#8-stripe-payment-flow)
9. [AI Recommendations Flow](#9-ai-recommendations-flow)
10. [Database Schema](#10-database-schema)
11. [API Endpoints Reference](#11-api-endpoints-reference)

---

## 1. System Overview

```mermaid
graph TB
    subgraph "Frontend - Next.js 15"
        A[User Browser]
        B[React Components]
        C[Auth Context]
        D[API Client]
    end

    subgraph "Backend - Flask"
        E[Flask Server]
        F[JWT Authentication]
        G[SQLAlchemy ORM]
        H[SQLite Database]
    end

    subgraph "External Services"
        I[Stripe API]
        J[OpenAI API]
    end

    A --> B
    B --> C
    B --> D
    D -->|HTTP/JSON| E
    E --> F
    F --> G
    G --> H
    E -->|Payment| I
    E -->|AI Processing| J

    style A fill:#4a90e2
    style E fill:#f39c12
    style I fill:#2ecc71
    style J fill:#9b59b6
```

### Tech Stack Summary:
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Python Flask, SQLAlchemy, JWT
- **Database**: SQLite (95 products)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **Deployment**: Local (Development)

---

## 2. Backend Architecture

```mermaid
graph TB
    subgraph "Backend Structure"
        A[run.py - Entry Point]

        subgraph "app/"
            B[__init__.py - App Factory]

            subgraph "Models"
                C[models.py]
                C1[User]
                C2[Product]
                C3[Cart/CartItem]
                C4[Transaction/TransactionItem]
                C --> C1
                C --> C2
                C --> C3
                C --> C4
            end

            subgraph "Routes/Blueprints"
                D[auth/routes.py]
                E[products/routes.py]
                F[cart/routes.py]
                G[transactions/routes.py]
                H[payments/routes.py]
                I[receipts/routes.py]
                J[ai/routes.py]
            end

            subgraph "Services"
                K[ai/openai_service.py]
                L[payments/stripe_service.py]
                M[receipts/receipt_generator.py]
            end

            N[extensions.py - db, jwt, cors, migrate]
        end

        O[config.py - Configuration]
        P[.env - Environment Variables]
    end

    A --> B
    B --> N
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J

    D --> C
    E --> C
    F --> C
    G --> C
    H --> C
    H --> L
    I --> C
    I --> M
    J --> C
    J --> K

    B --> O
    O --> P

    style A fill:#e74c3c
    style B fill:#3498db
    style K fill:#9b59b6
    style L fill:#2ecc71
```

### Backend Modules Explained:

**1. Entry Point (`run.py`)**
```python
from app import create_app
app = create_app()
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
```

**2. App Factory (`app/__init__.py`)**
- Initializes Flask app
- Configures extensions (DB, JWT, CORS)
- Registers all blueprints
- Sets up JWT blocklist for logout

**3. Models (`app/models.py`)**
- User: email, password_hash, is_admin
- Product: barcode, name, price, category, description
- Cart/CartItem: user's shopping cart
- Transaction/TransactionItem: completed orders with payment_intent_id

**4. Routes (Blueprints)**
- `/api/auth` - Login, register, logout, profile
- `/api/products` - CRUD operations
- `/api/cart` - Add, update, remove items
- `/api/transactions` - Checkout, history
- `/api/payments` - Stripe integration
- `/api/receipts` - Digital receipt generation
- `/api/ai` - Product recognition, chat, visual search, recommendations

**5. Services**
- **OpenAI API**: Product recognition, visual search, recommendations, chat
- **Stripe**: Payment processing, refunds
- **Receipt Generator**: Text and HTML receipts

---

## 3. Frontend Architecture

```mermaid
graph TB
    subgraph "Frontend Structure"
        A[Next.js App Router]

        subgraph "app/"
            B[(auth)/login]
            C[(auth)/register]
            D[(dashboard)/products]
            E[(dashboard)/cart]
            F[(dashboard)/checkout]
            G[(dashboard)/history]
            H[(dashboard)/payment-success]
        end

        subgraph "components/"
            I[ProtectedRoute]
            J[Navbar]
            K[BarcodeScanner]
            L[AIProductRecognition]
            M[AIVisualSearch]
            N[AIShoppingAssistant]
            O[AIRecommendations]
            P[CheckoutForm]
            Q[ProductCard]
            R[CartItemComponent]
        end

        subgraph "contexts/"
            S[AuthContext]
        end

        subgraph "lib/"
            T[api.ts - API Client]
            U[types.ts - TypeScript Types]
        end
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H

    D --> K
    D --> L
    D --> M
    D --> Q

    E --> O
    E --> R

    F --> P

    B --> S
    C --> S
    D --> S

    B --> T
    C --> T
    D --> T
    E --> T
    F --> T
    G --> T

    style A fill:#61dafb
    style S fill:#f39c12
    style T fill:#2ecc71
```

### Frontend Components Explained:

**1. App Router (`app/`)**
- Uses Next.js 15 App Router
- Two layouts: (auth) and (dashboard)
- Protected routes require authentication

**2. Key Components**
- **ProtectedRoute**: Wraps pages requiring login
- **BarcodeScanner**: Scans product barcodes
- **AIProductRecognition**: Upload image to identify products
- **AIVisualSearch**: Upload ANY photo to find similar products ⭐ NEW
- **AIShoppingAssistant**: Chat with AI about products
- **AIRecommendations**: Smart product suggestions
- **CheckoutForm**: Stripe payment form

**3. State Management**
- **AuthContext**: Global auth state (user, login, logout)
- React hooks for local state

**4. API Client (`lib/api.ts`)**
- Centralized API calls
- Automatic JWT token handling
- Error handling

---

## 4. User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as AuthContext
    participant B as Backend API
    participant D as Database

    Note over U,D: Registration Flow
    U->>F: Enter email & password
    F->>B: POST /api/auth/register
    B->>D: Create user (hash password)
    D-->>B: User created
    B-->>F: {access_token}
    F->>A: Save token & user
    A-->>F: Update auth state
    F-->>U: Redirect to /products

    Note over U,D: Login Flow
    U->>F: Enter credentials
    F->>B: POST /api/auth/login
    B->>D: Verify password
    D-->>B: User data
    B-->>F: {access_token}
    F->>A: Save token (localStorage)
    F-->>U: Redirect to /products

    Note over U,D: Protected Route Access
    U->>F: Visit /products
    F->>A: Check if authenticated
    alt Authenticated
        A-->>F: User exists
        F->>B: GET /api/products (with JWT)
        B-->>F: Product data
        F-->>U: Show products
    else Not Authenticated
        A-->>F: No user
        F-->>U: Redirect to /login
    end

    Note over U,D: Logout Flow
    U->>F: Click logout
    F->>B: DELETE /api/auth/logout
    B->>B: Add JWT to blocklist
    B-->>F: Success
    F->>A: Clear token & user
    F-->>U: Redirect to /login
```

### Authentication Details:

**JWT Token Structure:**
```json
{
  "fresh": false,
  "iat": 1729635600,
  "jti": "unique-token-id",
  "type": "access",
  "sub": 1,  // user_id
  "nbf": 1729635600,
  "exp": 1729639200
}
```

**Password Security:**
- Passwords hashed with `werkzeug.security`
- Never stored in plaintext
- Bcrypt algorithm

**Token Storage:**
- Stored in `localStorage` (frontend)
- Sent in `Authorization: Bearer <token>` header
- Validated on every protected route

---

## 5. Product Scanning & Recognition Flow

```mermaid
flowchart TD
    Start([User wants to add product]) --> Choice{How to add?}

    Choice -->|Option 1| Barcode[Scan Barcode]
    Choice -->|Option 2| AIUpload[Upload Product Photo]
    Choice -->|Option 3| Browse[Browse Products List]

    subgraph "Barcode Scanning"
        Barcode --> ScanDevice[Use device camera]
        ScanDevice --> DetectCode[Detect barcode]
        DetectCode --> SearchDB1[Search in database by barcode]
        SearchDB1 --> Found1{Found?}
        Found1 -->|Yes| AddCart1[Add to cart]
        Found1 -->|No| Error1[Product not found]
    end

    subgraph "AI Product Recognition"
        AIUpload --> Encode[Convert image to base64]
        Encode --> SendAI[POST /api/ai/recognize-product]
        SendAI --> OpenAIVision[OpenAI GPT-4o-mini Vision API]
        OpenAIVision --> Identify[AI identifies product]
        Identify --> Extract[Extract: name, category, confidence]
        Extract --> FuzzyMatch[Fuzzy match with database]
        FuzzyMatch --> Keywords[Extract keywords from AI name]
        Keywords --> SearchDB2[Search products by keywords]
        SearchDB2 --> Found2{Matches?}
        Found2 -->|Yes| ShowMatches[Show matched products]
        Found2 -->|No| NotFound[No matches - suggest manual search]
        ShowMatches --> SelectMatch[User selects match]
        SelectMatch --> AddCart2[Add to cart]
    end

    subgraph "Browse Products"
        Browse --> LoadAll[GET /api/products]
        LoadAll --> DisplayGrid[Display product grid]
        DisplayGrid --> UserClick[User clicks Add to Cart]
        UserClick --> AddCart3[Add to cart]
    end

    AddCart1 --> Success[✓ Added to cart]
    AddCart2 --> Success
    AddCart3 --> Success
    Success --> UpdateCount[Update cart count badge]

    style Barcode fill:#3498db
    style AIUpload fill:#9b59b6
    style Browse fill:#2ecc71
    style OpenAIVision fill:#e74c3c
```

### AI Product Recognition Algorithm:

**Step 1: Image Processing**
```python
# Frontend
base64_image = convert_to_base64(uploaded_file)

# Backend
import base64
from PIL import Image
image_bytes = base64.b64decode(image_data)
image = Image.open(io.BytesIO(image_bytes))
```

**Step 2: OpenAI Vision Analysis**
```python
prompt = """Identify this product and provide:
{
    "product_name": "exact product name",
    "confidence": 0.95,
    "category": "category name",
    "description": "brief description"
}"""

response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data}}
        ]
    }]
)
```

**Step 3: Fuzzy Matching**
```typescript
// Extract keywords
keywords = productName.split(/[\s-]+/).filter(word => word.length > 2)
// ["Striped", "Button", "Down", "Cardigan"]

// Match if ANY keyword exists in database product name
matches = products.filter(p =>
    keywords.some(kw => p.name.toLowerCase().includes(kw))
)

// Sort by relevance (more matching keywords = higher rank)
```

---

## 6. AI Visual Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (AIVisualSearch)
    participant B as Backend
    participant G as OpenAI API
    participant D as Database

    Note over U,G: NEW FEATURE: Upload ANY photo to find similar products

    U->>F: Click "AI Visual Search" button
    F-->>U: Show upload modal

    U->>F: Upload image (Instagram/Pinterest photo)
    F->>F: Validate (image type, size < 5MB)
    F->>F: Convert to base64
    F->>F: Show preview & loading state

    F->>B: POST /api/ai/visual-search {image: base64}
    B->>D: Get all products (name, price, category)
    D-->>B: Product list (95 products)

    B->>G: Analyze image + product catalog
    Note over G: AI Task:<br/>1. Identify items in photo<br/>2. Match to inventory<br/>3. Rank by similarity

    G->>G: Detect: "Blue cardigan, black jeans, white sneakers"
    G->>G: Match cardigan → "Women's Cardigan" (exact match)
    G->>G: Match jeans → "Levi's 501 Jeans" (similar style)
    G->>G: Match sneakers → "Nike Air Max" (same category)

    G-->>B: JSON {identified_item, matches[], search_tips}

    B->>B: Enrich with full product data (id, barcode, price)
    B-->>F: Search results with confidence scores

    F->>F: Display identified item
    F->>F: Show product cards with:<br/>- Match reason<br/>- Confidence %<br/>- Price<br/>- Add to Cart button

    U->>F: Click "Add to Cart" on match
    F->>B: POST /api/cart/items {product_id, quantity}
    B->>D: Add to user's cart
    D-->>B: Updated cart
    B-->>F: Success
    F-->>U: Toast: "Added to cart!"

    style U fill:#4a90e2
    style G fill:#9b59b6
    style F fill:#61dafb
```

### Visual Search AI Prompt:

```python
prompt = f"""Analyze this image and find similar products from this store inventory.

AVAILABLE PRODUCTS:
- Calvin Klein Women's Cardigan ($34.99) - Category: Clothing
- Nike Air Max Sneakers ($89.99) - Category: Footwear
- Levi's 501 Jeans ($54.99) - Category: Clothing
... (95 total products)

Your task:
1. Identify the main item(s) in the image
2. Match them to similar products in the inventory
3. Rank matches by similarity

Return as JSON:
{{
    "identified_item": "Blue cardigan with buttons",
    "matches": [
        {{
            "product_name": "Calvin Klein Women's Cardigan",
            "match_reason": "Exact match - same style cardigan",
            "confidence": 0.95
        }}
    ],
    "search_tips": "Try searching for 'cardigan' or 'sweater'"
}}"""
```

---

## 7. Shopping Cart Flow

```mermaid
flowchart TD
    Start([User adds product]) --> CheckAuth{Authenticated?}
    CheckAuth -->|No| Login[Redirect to login]
    CheckAuth -->|Yes| AddItem[POST /api/cart/items]

    AddItem --> Backend[Backend receives request]
    Backend --> GetUser[Get user_id from JWT]
    GetUser --> FindCart{User has cart?}

    FindCart -->|No| CreateCart[Create new cart for user]
    FindCart -->|Yes| UseCart[Use existing cart]

    CreateCart --> CheckProduct{Product exists?}
    UseCart --> CheckProduct

    CheckProduct -->|No| Error[Return 404]
    CheckProduct -->|Yes| CheckDuplicate{Already in cart?}

    CheckDuplicate -->|Yes| UpdateQty[Update quantity]
    CheckDuplicate -->|No| AddNew[Create new cart item]

    UpdateQty --> SaveDB[Save to database]
    AddNew --> SaveDB
    SaveDB --> Return[Return updated cart]
    Return --> Frontend[Update UI]
    Frontend --> Badge[Update cart count badge]

    subgraph "Cart Operations"
        ViewCart[View Cart] --> LoadCart[GET /api/cart]
        LoadCart --> DisplayItems[Show all items with:<br/>- Product name<br/>- Price<br/>- Quantity controls<br/>- Subtotal]

        ChangeQty[Change Quantity] --> UpdateAPI[PUT /api/cart/items/:id]
        UpdateAPI --> Recalculate[Recalculate totals]

        Remove[Remove Item] --> DeleteAPI[DELETE /api/cart/items/:id]
        DeleteAPI --> Refresh[Refresh cart display]
    end

    Frontend --> ViewCart

    style AddItem fill:#3498db
    style SaveDB fill:#2ecc71
    style Frontend fill:#61dafb
```

### Cart Data Structure:

```typescript
interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
}

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: Product;  // Full product details
}
```

### Cart Total Calculation:
```typescript
const cartTotal = cart.items.reduce(
  (total, item) => total + (item.product.price * item.quantity),
  0
);
```

---

## 8. Stripe Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as CheckoutForm (Stripe)
    participant B as Backend
    participant S as Stripe API
    participant D as Database

    Note over U,D: Phase 1: Initialize Checkout

    U->>F: Click "Proceed to Checkout"
    F->>B: GET /api/payments/config
    B-->>F: {publishableKey}
    F->>F: Initialize Stripe.js

    F->>B: POST /api/payments/create-payment-intent
    B->>D: Get user's cart & calculate total
    D-->>B: Cart items, total: $249.95
    B->>S: Create payment intent
    S-->>B: {client_secret, payment_intent_id}
    B-->>F: Payment intent details

    F->>C: Load Stripe Elements with client_secret
    C-->>U: Show payment form

    Note over U,D: Phase 2: Process Payment

    U->>C: Enter card: 4242 4242 4242 4242
    U->>C: Click "Pay $249.95"

    C->>S: Stripe.confirmPayment()
    S->>S: Validate card
    S->>S: Process payment
    S-->>C: {status: "succeeded"}

    Note over U,D: Phase 3: Confirm & Create Transaction

    C->>B: POST /api/payments/confirm-payment<br/>{payment_intent_id}
    B->>S: Verify payment status
    S-->>B: {status: "succeeded", amount: 249.95}

    B->>D: Create Transaction record
    B->>D: Add Transaction Items
    B->>D: Clear user's cart
    D-->>B: Transaction #8 created

    B-->>C: {transaction_id: 8, total: 249.95}
    C-->>U: Redirect to /payment-success?transaction_id=8

    Note over U,D: Phase 4: Show Success

    U->>F: Load success page
    F->>B: GET /api/transactions
    B->>D: Get transaction #8
    D-->>B: Transaction details + items
    B-->>F: Full order data
    F-->>U: Show order confirmation<br/>Order #8 - $249.95

    style S fill:#6772E5
    style C fill:#2ecc71
    style U fill:#4a90e2
```

### Payment Security:

**Card data never touches your server!**
- Stripe.js encrypts card data client-side
- Backend only receives `payment_intent_id`
- PCI compliance handled by Stripe

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Transaction Database Record:
```python
Transaction(
    id=8,
    user_id=1,
    total_amount=249.95,
    payment_intent_id="pi_abc123...",
    created_at="2025-10-23 00:18:10",
    items=[
        TransactionItem(
            product_id=1,
            quantity=1,
            price_at_purchase=29.99  # Women's Cardigan
        ),
        TransactionItem(
            product_id=3,
            quantity=1,
            price_at_purchase=89.99  # Nike Air Max
        ),
        # ... more items
    ]
)
```

---

## 9. AI Recommendations Flow

```mermaid
flowchart TD
    Start([User opens cart]) --> Display[Display cart items]
    Display --> ShowButton[Show "Get Suggestions" button]
    ShowButton --> UserClick{User clicks?}

    UserClick -->|No| Wait[Continue shopping]
    UserClick -->|Yes| Loading[Show loading state]

    Loading --> API[GET /api/ai/recommendations]
    API --> Backend[Backend receives request]

    Backend --> GetUser[Get user_id from JWT]
    GetUser --> GetHistory[Get purchase history<br/>Last 10 transactions]
    GetHistory --> GetCart[Get current cart items]

    GetCart --> BuildContext[Build AI context]

    subgraph "AI Context Building"
        BuildContext --> PastPurchases["Past: Organic Yogurt, Bananas, Eggs"]
        BuildContext --> CurrentCart["Current: Women's Cardigan ($29.99)"]
        BuildContext --> Priority["PRIORITY: Current cart items"]
    end

    Priority --> OpenAIPrompt[Send to OpenAI API]

    OpenAIPrompt --> AIAnalysis{AI Analysis}

    subgraph "AI Decision Making"
        AIAnalysis --> DetectCategory[Detect: Clothing item in cart]
        DetectCategory --> MatchStrategy[Strategy: Recommend clothing accessories]
        MatchStrategy --> Suggestions["Suggest:<br/>- Scarves<br/>- Belts<br/>- Jewelry<br/>- Matching shoes"]
    end

    Suggestions --> Response[AI returns recommendations JSON]
    Response --> ParseJSON[Parse response]
    ParseJSON --> Enrich[Match to actual products in DB]

    Enrich --> Display2[Display recommendation cards]
    Display2 --> UserAction{User action?}

    UserAction -->|Click product| AddToCart[Add to cart]
    UserAction -->|Ignore| Close[Close recommendations]

    AddToCart --> UpdateCart[Update cart display]

    style OpenAIPrompt fill:#9b59b6
    style AIAnalysis fill:#e74c3c
    style Enrich fill:#2ecc71
```

### AI Recommendation Prompt:

```python
prompt = f"""You are a smart recommendation engine for a retail store.

CURRENT SHOPPING SESSION (PRIORITY):
Current cart has: [
    {{"product": "Women's Cardigan", "price": 29.99}}
]

User's past shopping history: [
    {{"product": "Organic Plain Yogurt", "quantity": 2}},
    {{"product": "Organic Bananas", "quantity": 1}}
]

IMPORTANT: Recommend products that go well with what's CURRENTLY IN THE CART.
If the cart has clothing items, recommend clothing accessories.
If the cart has food items, recommend complementary food items.

Based on this data, suggest 3-5 products the user might want to buy.
Consider:
- Items that complement what's currently in the cart (HIGHEST PRIORITY)
- Frequently bought together items
- Matching accessories or related products

Respond ONLY in JSON format:
{{
    "recommendations": [
        {{"product": "Kate Spade Wallet", "reason": "Complements the cardigan - perfect accessory"}},
        {{"product": "Kenneth Cole Sunglasses", "reason": "Complete the outfit"}}
    ]
}}"""
```

### Recommendation Logic:

**Before Fix:**
- ❌ Only looked at purchase history
- ❌ Recommended groceries for clothing

**After Fix:**
- ✅ Prioritizes current cart items
- ✅ Context-aware (clothing→accessories, food→food)
- ✅ Smart bundling suggestions

---

## 10. Database Schema

```mermaid
erDiagram
    USERS ||--o{ CARTS : has
    USERS ||--o{ TRANSACTIONS : makes
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : in
    PRODUCTS ||--o{ TRANSACTION_ITEMS : in
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : has

    USERS {
        int id PK
        string email UK
        string password_hash
        boolean is_admin
    }

    PRODUCTS {
        int id PK
        string barcode UK
        string name
        float price
        string category
        text description
    }

    CARTS {
        int id PK
        int user_id FK
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
    }

    TRANSACTIONS {
        int id PK
        int user_id FK
        float total_amount
        string payment_intent_id
        text qr_code
        datetime created_at
    }

    TRANSACTION_ITEMS {
        int id PK
        int transaction_id FK
        int product_id FK
        int quantity
        float price_at_purchase
    }
```

### Sample Data:

**Products Table (95 rows):**
```sql
id | barcode        | name                          | price  | category
---|----------------|-------------------------------|--------|----------
1  | 886742859670   | Calvin Klein Women's Cardigan | 34.99  | Clothing
2  | 190049632111   | Michael Kors Crossbody Bag    | 79.99  | Handbags
3  | 883929669202   | Nike Air Max Sneakers         | 89.99  | Footwear
...
```

**Transaction #8:**
```sql
id | user_id | total_amount | payment_intent_id  | created_at
---|---------|--------------|--------------------|-----------
8  | 1       | 249.95       | pi_3QJ...         | 2025-10-23 00:18:10

Items:
- Women's Cardigan ($29.99) x1
- Nike Air Max ($89.99) x1
- Michael Kors Bag ($79.99) x1
- Kate Spade Wallet ($49.99) x1
```

---

## 11. API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| POST   | /api/auth/register    | No   | Create new user account      |
| POST   | /api/auth/login       | No   | Login & get JWT token        |
| DELETE | /api/auth/logout      | Yes  | Logout & invalidate token    |
| GET    | /api/auth/profile     | Yes  | Get current user info        |

### Product Endpoints

| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| GET    | /api/products             | Yes  | Get all products (95)    |
| GET    | /api/products/:barcode    | Yes  | Get product by barcode   |
| POST   | /api/products             | Yes  | Create product (admin)   |
| PUT    | /api/products/:barcode    | Yes  | Update product (admin)   |
| DELETE | /api/products/:barcode    | Yes  | Delete product (admin)   |

### Cart Endpoints

| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| GET    | /api/cart                 | Yes  | Get user's cart          |
| POST   | /api/cart/items           | Yes  | Add item to cart         |
| PUT    | /api/cart/items/:id       | Yes  | Update item quantity     |
| DELETE | /api/cart/items/:id       | Yes  | Remove item from cart    |

### Payment Endpoints (Stripe)

| Method | Endpoint                           | Auth | Description                    |
|--------|-------------------------------------|------|--------------------------------|
| GET    | /api/payments/config                | No   | Get Stripe publishable key     |
| POST   | /api/payments/create-payment-intent | Yes  | Create Stripe payment intent   |
| POST   | /api/payments/confirm-payment       | Yes  | Confirm payment & create order |
| POST   | /api/payments/refund                | Yes  | Process refund                 |

### Transaction Endpoints

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| POST   | /api/transactions     | Yes  | Checkout (old system)        |
| GET    | /api/transactions     | Yes  | Get transaction history      |

### Receipt Endpoints

| Method | Endpoint                               | Auth | Description                |
|--------|----------------------------------------|------|----------------------------|
| GET    | /api/receipts/:id/text                 | Yes  | Get text receipt           |
| GET    | /api/receipts/:id/html                 | Yes  | Get HTML receipt           |
| GET    | /api/receipts/:id/download             | Yes  | Download HTML receipt      |

### AI Endpoints (OpenAI)

| Method | Endpoint                      | Auth | Description                          |
|--------|-------------------------------|------|--------------------------------------|
| POST   | /api/ai/recognize-product     | Yes  | Identify product from uploaded image |
| POST   | /api/ai/visual-search         | Yes  | Find similar products from ANY photo |
| POST   | /api/ai/chat                  | Yes  | Chat with AI shopping assistant      |
| GET    | /api/ai/recommendations       | Yes  | Get personalized product suggestions |
| POST   | /api/ai/fraud-check           | Yes  | Check for fraudulent behavior        |

---

## Request/Response Examples

### 1. Login Request
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "is_admin": false
  }
}
```

### 2. Add to Cart Request
```http
POST /api/cart/items HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "message": "Item added to cart",
  "cart": {
    "id": 1,
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Calvin Klein Women's Cardigan",
          "price": 34.99
        },
        "quantity": 2
      }
    ]
  }
}
```

### 3. AI Visual Search Request
```http
POST /api/ai/visual-search HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Response:**
```json
{
  "identified_item": "Blue knit cardigan with buttons",
  "matches": [
    {
      "id": 1,
      "name": "Calvin Klein Women's Cardigan",
      "price": 34.99,
      "category": "Clothing",
      "match_reason": "Exact match - same style cardigan",
      "confidence": 0.95
    },
    {
      "id": 19,
      "name": "Nautica Sweater",
      "price": 49.99,
      "category": "Clothing",
      "match_reason": "Similar style - knitwear",
      "confidence": 0.78
    }
  ],
  "search_tips": "Try searching for 'cardigan' or 'sweater'"
}
```

---

## Summary: How Everything Works Together

### 1. User Journey (Complete Flow)

```
1. User opens app → Login/Register
2. Browse products (95 real Marshall's items)
3. Scan barcode OR upload photo OR use visual search
4. Add items to cart
5. Get AI recommendations
6. Proceed to checkout
7. Enter payment (Stripe)
8. Payment processed
9. Order created (Transaction #8)
10. Digital receipt available
11. Can view history anytime
```

### 2. Technology Integration

**Frontend ↔ Backend:**
- HTTP/JSON API calls
- JWT token authentication
- Real-time state updates

**Backend ↔ Database:**
- SQLAlchemy ORM
- Automatic migrations
- Relationship management

**Backend ↔ External Services:**
- Stripe for payments
- OpenAI API for intelligence
- Environment variable config

### 3. Key Innovations

1. **AI Visual Search** - Upload ANY photo, find products
2. **Context-Aware Recommendations** - Prioritizes current cart
3. **Fuzzy Product Matching** - Keyword-based search
4. **Real Stripe Payments** - Production-ready checkout
5. **Digital Receipts** - Instant, downloadable

---

## Files to Visualize These Flowcharts

**Online Tools:**
- https://mermaid.live/ - Paste mermaid code, see diagrams
- https://kroki.io/ - Generate diagram images
- VS Code extension: "Markdown Preview Mermaid Support"

**In your IDE:**
- Install Mermaid preview extension
- Open this file in preview mode
- See all diagrams rendered

---

**Created by:** SmartScan Pro Development Team
**Last Updated:** October 23, 2025
**Version:** 1.0.0 (Phase 1 MVP Complete)
