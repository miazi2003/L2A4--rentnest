# RentNest Backend API

RentNest is a production-ready, high-performance RESTful backend service for property rental management, built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL. It supports multi-role user authentication (Tenants, Landlords, Admins), property search & filtering, booking workflow management, dynamic Hosted Stripe Checkout payments with webhook idempotency, user review controls, public contact form submissions, and Google & Facebook social authentication.

---

## Tech Stack

The technologies used in the backend codebase are:

- **Runtime & Framework**: Node.js, Express.js (v5), TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JSON Web Tokens (JWT), bcryptjs (`bcrypt`), Google OAuth (`google-auth-library`), Facebook Graph API
- **Input Validation**: Zod schema validation
- **Payment Processing**: Stripe Node.js SDK (Hosted Checkout Sessions & Webhooks)
- **Security & Utilities**: Helmet, CORS, Cookie Parser, Express Rate Limit, Morgan logging
- **Code Quality & Tooling**: ESLint (Flat Config), Prettier, nodemon, ts-node, rimraf

---

## Architecture

The project enforces a strict, modular **Service-Controller-Route-Validation** architecture:

```text
├── src/
│   ├── config/             # Database connection, env parsing, and Stripe SDK initialization
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── env.ts          # Zod-validated environment variable schema
│   │   └── stripe.ts       # Stripe client setup
│   ├── errors/             # Custom application error classes (AppError, NotFoundError, UnauthorizedError, etc.)
│   ├── middlewares/        # Authentication guards, RBAC, error logging, Zod validation wrappers
│   ├── modules/            # Core business domain modules
│   │   ├── admin/          # Platform administration (User status, property & rental oversight)
│   │   ├── auth/           # Local register/login, Google & Facebook OAuth, session controls
│   │   ├── category/       # Property category CRUD operations
│   │   ├── contact/        # Public contact form submissions & DB storage
│   │   ├── payment/        # Hosted Stripe Checkout session generation, status check & Webhooks
│   │   ├── profile/        # User profile settings & password management
│   │   ├── property/       # Landlord listings & public property search/filters
│   │   ├── rental/         # Booking requests & landlord approval/rejection workflow
│   │   └── review/         # Tenant property reviews & rating aggregates
│   ├── routes/             # Core API routing mounts and API v1 health endpoints
│   ├── utils/              # Standardized ApiResponse helper and logger structures
│   ├── app.ts              # Express application setup, security middleware, and routes
│   └── server.ts           # HTTP server listener bootstrapping
├── prisma/
│   ├── schema.prisma       # Prisma database models & relationships
│   ├── seed.ts             # Seeding script for default categories, users, properties, and rentals
│   └── migrations/         # PostgreSQL migration history
├── .env.example            # Environment variables template
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts, dependencies, and project metadata
```

### Architectural Highlights

- **Centralized Error Handling**: Custom `AppError` subclasses (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `BadRequestError`) caught by a global `errorHandler` middleware returning consistent error JSON structures.
- **Authentication & RBAC Middleware**: `auth()` guard parses JWTs from HTTP-only `accessToken` cookies or `Authorization: Bearer <token>` headers, validates user existence and status (`ACTIVE` vs `BANNED`), and enforces role-level access control (`ADMIN`, `LANDLORD`, `TENANT`).
- **Standardized API Responses**: Built with `ApiResponse.success()` and `ApiResponse.error()` yielding a unified payload shape:
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": {},
    "meta": {}
  }
  ```

---

## API Endpoints

### 1. System & Health

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root welcome message |
| `GET` | `/api/v1/health` | Public | System health status, uptime, and timestamp |

---

### 2. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new TENANT or LANDLORD user |
| `POST` | `/api/auth/login` | Public | Login using email and password credentials |
| `POST` | `/api/auth/google` | Public | Login/register using Google OAuth ID token credential |
| `POST` | `/api/auth/facebook` | Public | Login/register using Facebook OAuth access token |
| `POST` | `/api/auth/logout` | Public | Clear access token cookie and terminate session |
| `GET` | `/api/auth/me` | Protected | Retrieve profile details of currently logged-in user |

---

### 3. User Profile (`/api/profile`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Protected | Get authenticated user profile details |
| `PATCH` | `/api/profile` | Protected | Update profile information (`name`, `phone`) |
| `PATCH` | `/api/profile/password` | Protected | Change password with current password verification |

> [!NOTE]
> Social authentication accounts without a local password cannot use `/api/profile/password`. Requests will return a `400 Bad Request` error.

---

### 4. Contact Form (`/api/contact`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/contact` | Public | Submit public contact form message |

**Request Body Validation**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Inquiry about lease terms",
  "message": "Hello, I would like to inquire about lease durations."
}
```
- `name`: String (min 1, max 100) — Required
- `email`: Valid Email String — Required
- `subject`: String (max 200) — Optional
- `message`: String (min 5, max 2000) — Required

Contact submissions are persisted directly into PostgreSQL via the Prisma `ContactMessage` model with an initial status of `UNREAD`. No external email delivery is executed.

---

### 5. Google Authentication (`POST /api/auth/google`)

- **Access**: Public
- **Request Body**:
  ```json
  {
    "credential": "<GOOGLE_ID_TOKEN>"
  }
  ```
- **Flow**:
  1. Frontend submits Google ID token (`credential`).
  2. Backend verifies token using `google-auth-library` (`OAuth2Client.verifyIdToken`) against `GOOGLE_CLIENT_ID`.
  3. Extracts verified email and Google `sub` identifier.
  4. Performs database user lookup by `googleId` or `email`.
  5. If user exists without `googleId`, automatically links `googleId` to existing user while preserving user role.
  6. If user does not exist, creates a new user account with default `TENANT` role and `GOOGLE` provider.
  7. Enforces banned user check (rejects banned accounts with `401 Unauthorized`).
  8. Generates RentNest JWT and sets HTTP-only `accessToken` cookie.

---

### 6. Facebook Authentication (`POST /api/auth/facebook`)

- **Access**: Public
- **Request Body**:
  ```json
  {
    "accessToken": "<FACEBOOK_ACCESS_TOKEN>"
  }
  ```
- **Flow**:
  1. Frontend submits Facebook access token (`accessToken`).
  2. Backend verifies token and fetches user profile from Meta Graph API (`https://graph.facebook.com/me?fields=id,name,email&access_token=...`).
  3. Extracts verified Facebook ID and email.
  4. Performs database user lookup by `facebookId` or `email`.
  5. If user exists without `facebookId`, links `facebookId` while preserving existing user role.
  6. If user does not exist, creates a new user account with default `TENANT` role and `FACEBOOK` provider.
  7. Enforces banned user check (rejects banned accounts with `401 Unauthorized`).
  8. Generates RentNest JWT and sets HTTP-only `accessToken` cookie.

---

### 7. Properties (`/api/properties` & `/api/landlord/properties`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | Public | Search and list available properties (filters: `search`, `minPrice`, `maxPrice`, `categoryId`, `sortBy`, `sortOrder`, `page`, `limit`) |
| `GET` | `/api/properties/:id` | Public | Retrieve detailed property information by ID |
| `GET` | `/api/landlord/properties` | Landlord | List property listings owned by authenticated landlord |
| `POST` | `/api/landlord/properties` | Landlord | Create a new property listing |
| `PUT` | `/api/landlord/properties/:id` | Landlord | Update landlord's property listing |
| `DELETE` | `/api/landlord/properties/:id` | Landlord | Delete landlord's property listing |

---

### 8. Categories (`/api/categories` & `/api/admin/categories`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all property categories |
| `POST` | `/api/admin/categories` | Admin | Create a new category |
| `PUT` | `/api/admin/categories/:id` | Admin | Update an existing category |
| `DELETE` | `/api/admin/categories/:id` | Admin | Delete a category |

---

### 9. Rental Requests (`/api/rentals` & `/api/landlord/requests`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rentals` | Tenant | Submit rental request (`propertyId`, `startDate`, `endDate`) |
| `GET` | `/api/rentals` | Tenant | List tenant's rental requests (filter: `status`, `page`, `limit`) |
| `GET` | `/api/rentals/:id` | Tenant | View rental request details |
| `GET` | `/api/landlord/requests` | Landlord | List rental requests for properties owned by landlord |
| `PATCH` | `/api/landlord/requests/:id` | Landlord | Approve or reject rental request (`status`: `APPROVED` \| `REJECTED`) |

---

### 10. Payments (`/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create` | Tenant | Generate dynamic Hosted Stripe Checkout Session |
| `GET` | `/api/payments/verify/:sessionId` | Public / Auth | Retrieve Stripe Checkout Session status directly from Stripe |
| `GET` | `/api/payments` | Tenant | Get tenant payment transaction history |
| `GET` | `/api/payments/:id` | Tenant | Get payment transaction details by ID |
| `POST` | `/api/payments/webhook` | Public | Stripe Webhook listener (receives raw body & verifies signature) |

#### Hosted Stripe Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Tenant
    actor Landlord
    participant Backend as RentNest API
    participant DB as PostgreSQL (Prisma)
    participant Stripe as Stripe API

    Tenant->>Backend: POST /api/rentals (Submit request)
    Landlord->>Backend: PATCH /api/landlord/requests/:id (Approve request)
    Tenant->>Backend: POST /api/payments/create { rentalRequestId }
    Backend->>DB: Validate rental exists, tenant owns it, status is APPROVED
    Backend->>DB: Calculate payable amount from database (totalPrice)
    Backend->>DB: Create/Update PENDING Payment record
    Backend->>Stripe: Create Hosted Checkout Session (metadata: paymentId, rentalRequestId, tenantId)
    Stripe-->>Backend: Return Checkout Session URL
    Backend-->>Tenant: { url: "https://checkout.stripe.com/..." }
    Tenant->>Stripe: Complete payment on Hosted Checkout page
    Stripe->>Backend: POST /api/payments/webhook (checkout.session.completed)
    Backend->>Backend: Verify stripe-signature header using STRIPE_WEBHOOK_SECRET
    Backend->>DB: Check WebhookEvent table for idempotency
    Backend->>DB: Transactionally update Payment status -> COMPLETED & RentalRequest status -> ACTIVE
    Stripe-->>Tenant: Redirect to success_url
```

1. **Approval**: Tenant submits a rental request, which must be approved by the Landlord (`APPROVED` status).
2. **Session Creation**: Tenant calls `POST /api/payments/create`. Backend verifies ownership and status, calculates total price directly from the database (`rental.totalPrice * 100` cents), creates a `PENDING` `Payment` record, and requests a Stripe Checkout Session with full metadata (`paymentId`, `rentalRequestId`, `tenantId`).
3. **Hosted Checkout**: Backend returns `{ "url": session.url }`. Tenant is redirected to Stripe's Hosted Checkout page.
4. **Webhook Processing**: Upon payment completion, Stripe fires `checkout.session.completed` to `POST /api/payments/webhook`.
   - Middleware uses `express.raw({ type: 'application/json' })` to retain raw body bytes.
   - Signature verification is enforced using `stripe.webhooks.constructEvent()` and `STRIPE_WEBHOOK_SECRET`.
   - Duplicate delivery protection is guaranteed via the `WebhookEvent` Prisma table.
   - Database operations execute within a Prisma `$transaction`, marking `Payment` as `COMPLETED` and updating `RentalRequest` status to `ACTIVE`.

---

### 11. Reviews (`/api/reviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Tenant | Create review for a completed rental (`propertyId`, `rating`, `comment`) |
| `GET` | `/api/reviews/me` | Tenant | List review history submitted by the authenticated tenant |
| `GET` | `/api/reviews/property/:propertyId` | Public | List reviews and rating aggregates for a property |

---

### 12. Administration (`/api/admin/...`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Admin | List and search all platform users |
| `GET` | `/api/admin/users/:id` | Admin | View user details by ID |
| `PATCH` | `/api/admin/users/:id` | Admin | Update user status (`status`: `ACTIVE` \| `BANNED`) |
| `GET` | `/api/admin/properties` | Admin | List all platform property listings |
| `GET` | `/api/admin/properties/:id` | Admin | View platform property details |
| `GET` | `/api/admin/rentals` | Admin | List all platform rental requests |
| `GET` | `/api/admin/rentals/:id` | Admin | View platform rental request details |

---

## Security

Verified security controls implemented in the backend:

- **Password Security**: Passwords hashed using `bcryptjs` with 10 salt rounds.
- **JWT Authentication**: Signed JWT tokens stored in HTTP-only cookies (`accessToken`) or `Authorization: Bearer <token>` headers.
- **Strict Secret Enforcement**: `JWT_SECRET` is strictly required; application startup halts if missing.
- **CORS Allowlist**: Validates request origin against configurable `CORS_ORIGIN` list.
- **Role-Based Access Control (RBAC)**: Route-level authorization guards for `ADMIN`, `LANDLORD`, and `TENANT`.
- **Ownership Validation & IDOR Protection**: Landlords can only manage their own properties/requests; tenants can only view/pay for their own rentals.
- **Input Sanitization & Zod Validation**: Strict validation schemas on request body, query parameters, and URL parameters.
- **Banned User Enforcement**: Banned users are blocked during authentication and request guards.
- **HTTP Security Headers**: Powered by `helmet`.
- **Rate Limiting**: `express-rate-limit` prevents brute-force abuse across API endpoints.
- **Stripe Signature & Idempotency**: Webhook signature verification (`STRIPE_WEBHOOK_SECRET`) with raw body parsing and `WebhookEvent` database idempotency tracking.

---

## Environment Variables

Configure environment variables in a `.env` file in the root workspace folder (refer to `.env.example`):

| Variable Name | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | No | Server port number | `5000` |
| `NODE_ENV` | No | Environment runtime mode | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL | `postgresql://user:pass@localhost:5432/rentnest` |
| `CORS_ORIGIN` | Yes | Allowed origins (comma-separated) | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX` | No | Max requests per window per IP | `100` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `<SECURE_JWT_SECRET>` |
| `JWT_EXPIRES_IN` | No | JWT token expiration duration | `7d` |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret | `whsec_...` |
| `CLIENT_URL` | No | Frontend URL for Stripe redirect | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID | `<GOOGLE_CLIENT_ID>` |
| `FACEBOOK_APP_ID` | Optional | Facebook App ID | `<FACEBOOK_APP_ID>` |
| `FACEBOOK_APP_SECRET` | Optional | Facebook App Secret | `<FACEBOOK_APP_SECRET>` |

---

## Database Schema (Prisma)

Important models defined in `prisma/schema.prisma`:

- **User**: User credentials, contact info, `role` (`ADMIN`, `LANDLORD`, `TENANT`), `status` (`ACTIVE`, `BANNED`), `provider` (`LOCAL`, `GOOGLE`, `FACEBOOK`), `googleId`, and `facebookId`.
- **Category**: Property classification categories.
- **Property**: Property listing details, address, price, availability status, landlord relation, category relation.
- **RentalRequest**: Rental booking details, date range, total price, status (`PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED`).
- **Payment**: Payment records, amount, currency, status (`PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`), `stripeSessionId`, `stripePaymentIntentId`, receipt URL, and failure reasons.
- **WebhookEvent**: Unique Stripe webhook event log (`id`, `type`, `createdAt`) used to prevent duplicate webhook processing.
- **Review**: Tenant property reviews with 1-5 rating scores and optional comments.
- **ContactMessage**: Public contact form messages (`name`, `email`, `subject`, `message`, `status: UNREAD / READ`).

---

## Setup & Execution

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/miazi2003/L2A4--rentnest.git
cd L2A4--rentnest
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and populate necessary variables:
```bash
cp .env.example .env
```

### 3. Database Migration & Setup
Run Prisma migrations and generate Prisma Client:
```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

### 4. Database Seeding (Optional)
Seed the database with initial categories, users, properties, and rental requests:
```bash
npm run prisma:seed
```

### 5. Available Package Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with `nodemon` and `ts-node` |
| `npm run build` | Generate Prisma client, clean `dist/`, and compile TypeScript |
| `npm run start` | Run compiled production build from `dist/server.js` |
| `npm run vercel-build` | Run Vercel build routine (generate Prisma, deploy migrations, compile TS) |
| `npm run prisma:generate` | Generate Prisma Client types |
| `npm run prisma:migrate` | Deploy production database migrations (`prisma migrate deploy`) |
| `npm run prisma:migrate:dev` | Apply database migrations in development mode |
| `npm run prisma:seed` | Seed database using `prisma/seed.ts` |
| `npm run prisma:studio` | Launch interactive Prisma Studio GUI |
| `npm run lint` | Check codebase using ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format codebase using Prettier |
| `npm run format:check` | Check code formatting compliance |

---

## License

This project is licensed under the [ISC License](package.json).

