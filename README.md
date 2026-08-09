# RentNest Backend

RentNest is a production-ready, high-performance backend solution for property rentals, structured using Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL. It features robust user authentication, property searches, booking workflow management, Stripe transaction operations, review controls, contact form submissions, Google & Facebook social authentication, and administrative management tools.

---

## Tech Stack

- **Framework**: Node.js, Express.js (TypeScript)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JSON Web Tokens (JWT), bcryptjs password hashing, Google OAuth & Facebook Graph API
- **Input Validation**: Zod schema validation
- **Payment Processing**: Stripe Node.js SDK
- **Development Tooling**: ts-node, nodemon, ESLint (Flat Config), Prettier

---

## Features

1. **Authentication & Authorization**: Role-based access controls for Tenants, Landlords, and Admins. Protected sessions verify token signatures and block actions by banned accounts.
2. **Social Login**: Integrated Google OAuth (`POST /api/auth/google`) and Facebook OAuth (`POST /api/auth/facebook`) token verification and automatic account linking.
3. **User Profiles**: Manage profile details (name and phone) and securely update password hashes with verification.
4. **Contact Submissions**: Public contact form backend (`POST /api/contact`) with database persistence and status tracking.
5. **Property Listings**: Landlords can list, update, or remove properties. Tenants can query properties using advanced search (case-insensitive title and address matching), price range filters, category parameters, and sorting options.
6. **Rental Requests**: Tenants can submit rental requests. Includes duration-based total pricing calculation, duplicates checks, and landlord-specific approvals or rejections workflows.
7. **Stripe Payments**: Creates Stripe Payment Intents and processes confirmations to change booking states to active, complete with robust db transaction rollbacks on failure.
8. **Reviews System**: Tenants can review properties they have completed renting, featuring average score and count aggregates in search feeds.
9. **Admin Operations**: Administrative controls to view detailed listings, view booking aggregates, search platform users, and manage account statuses (Active / Banned).

---

## Folder Architecture

The project enforces a strict, modular **Service-Controller-Route-Validation** architecture:

```text
├── src/
│   ├── config/             # Database connection, env parsing, and stripe setups
│   ├── errors/             # Custom application error classes (AppError, NotFound, etc.)
│   ├── middlewares/        # Authentication guards, error logging, and validation wrappers
│   ├── modules/            # Core business modules
│   │   ├── auth/           # Login, Register, Google & Facebook OAuth, and Session states
│   │   ├── profile/        # User Profile settings and password changes
│   │   ├── contact/        # Public contact form submissions and DB storage
│   │   ├── category/       # Category CRUD operations
│   │   ├── property/       # Landlord properties, search feeds, and detail lookups
│   │   ├── rental/         # Booking requests, landlord decision controls
│   │   ├── payment/        # Stripe payments generation and processing
│   │   ├── review/         # Customer reviews and aggregates
│   │   └── admin/          # Platform administration controls
│   ├── routes/             # Core API endpoints routing mounts
│   ├── utils/              # ApiResponse helper and logging structures
│   ├── app.ts              # Express application configurations
│   └── server.ts           # HTTP server bootstrapping
├── prisma/
│   ├── schema.prisma       # Database design models
│   ├── seed.ts             # Seeding routine for default values
│   └── migrations/         # PostgreSQL schema version migrations
├── .env.example            # Environment variables template
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts and dependencies setup
```

---

## Environment Variables

Create a `.env` file in the root workspace folder and configure the following variables (refer to `.env.example`):

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/rentnest?schema=public"
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (Required)
JWT_SECRET="your_secure_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

CLIENT_URL="http://localhost:3000"

# Social Login Configuration (Optional)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"
```

---

## Installation & Setup

Follow these commands to install, seed, and run the project locally:

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/rentnest.git
cd rentnest
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` into `.env` and fill in your database credentials and API keys:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client & Run Migrations
Generate the type definitions from the Prisma schema and run migrations:
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed the Database
Populate categories, users, properties, and rental requests:
```bash
npx prisma db seed
```

### 5. Start the Server
Run the development environment using `nodemon`:
```bash
npm run dev
```

---

## New Update API Endpoints

### 1. Contact Form Endpoint
- **URL**: `POST /api/contact`
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Inquiry about downtown apartments",
    "message": "Hello, I would like to know if short-term leases are supported."
  }
  ```

### 2. Google Social Login Endpoint
- **URL**: `POST /api/auth/google`
- **Access**: Public
- **Body**:
  ```json
  {
    "credential": "<GOOGLE_ID_TOKEN_FROM_FRONTEND>"
  }
  ```

### 3. Facebook Social Login Endpoint
- **URL**: `POST /api/auth/facebook`
- **Access**: Public
- **Body**:
  ```json
  {
    "accessToken": "<FACEBOOK_ACCESS_TOKEN_FROM_FRONTEND>"
  }
  ```

---

## License

This project is licensed under the [MIT License](LICENSE).
