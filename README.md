# RentNest Backend

RentNest is a production-ready, high-performance backend solution for property rentals, structured using Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL. It features robust user authentication, property searches, booking workflow management, Stripe transaction operations, review controls, and administrative management tools.

---

## Tech Stack

- **Runtime & Framework**: Node.js, Express.js (TypeScript)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JSON Web Tokens (JWT), bcryptjs password hashing
- **Input Validation**: Zod schema validation
- **Payment Processing**: Stripe Node.js SDK
- **Development Tooling**: ts-node, nodemon, ESLint (Flat Config), Prettier

---

## Features

1. **Authentication & Authorization**: Role-based access controls for Tenants, Landlords, and Admins. Protected sessions verify token signatures and block actions by banned accounts.
2. **User Profiles**: Manage profile details (name and phone) and securely update password hashes with verification.
3. **Property Listings**: Landlords can list, update, or remove properties. Tenants can query properties using advanced search (case-insensitive title and address matching), price range filters, category parameters, and sorting options.
4. **Rental Requests**: Tenants can submit rental requests. Includes duration-based total pricing calculation, duplicates checks, and landlord-specific approvals or rejections workflows.
5. **Stripe Payments**: Creates Stripe Payment Intents and processes confirmations to change booking states to active, complete with robust db transaction rollbacks on failure.
6. **Reviews System**: Tenants can review properties they have completed renting, featuring average score and count aggregates in search feeds.
7. **Admin Operations**: Administrative controls to view detailed listings, view booking aggregates, search platform users, and manage account statuses (Active / Banned).

---

## Folder Architecture

The project enforces a strict, modular **Service-Controller-Route-Validation** architecture:

```text
├── src/
│   ├── config/             # Database connection, env parsing, and stripe setups
│   ├── errors/             # Custom application error classes (AppError, NotFound, etc.)
│   ├── middlewares/        # Authentication guards, error logging, and validation wrappers
│   ├── modules/            # Core business modules
│   │   ├── auth/           # Login, Register, and Session states
│   │   ├── profile/        # User Profile settings and password changes
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

Create a `.env` file in the root workspace folder and configure the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/rentnest?schema=public"
CORS_ORIGIN=*

# JWT Configuration
JWT_SECRET="rentnest-super-secret-key-2026"
JWT_EXPIRES_IN="7d"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
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
Copy `.env.example` into `.env` and fill in your database credentials and Stripe keys:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
Generate the type definitions from the Prisma schema:
```bash
npx prisma generate
```

### 4. Run Migrations
Run the initial SQL migrations to create the database schemas:
```bash
npx prisma migrate dev --name init_db
```

### 5. Seed the Database
Populate categories, users, properties, and rental requests:
```bash
npx prisma db seed
```

### 6. Start the Server
Run the development environment using `nodemon`:
```bash
npm run dev
```

---

## Seeding & Default User Accounts

Seeding generates the following default credentials for testing and review:

| User Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rentnest.com` | `Admin@RentNest2026` |
| **Landlord** | `landlord@rentnest.com` | `Landlord@RentNest2026` |
| **Tenant** | `tenant@rentnest.com` | `Tenant@RentNest2026` |

---

## API Endpoints & Postman Documentation

- **API Base URL**: `http://localhost:5000/api`
- **Postman API Documentation**: A complete Postman collection is generated in the root directory: [`rentnest_api_collection.json`](./rentnest_api_collection.json). You can import this file directly into Postman to test all endpoints.

---

## Scripts

Use the following npm tasks defined in `package.json`:

- `npm run dev`: Starts the TypeScript development server with nodemon reloading.
- `npm run build`: Compiles TypeScript files into JavaScript (`dist/`).
- `npm run start`: Starts the compiled production application.
- `npm run lint`: Runs ESLint checks.
- `npm run format`: Standardizes source file formatting using Prettier.

---

## Production Deployment (Render or Vercel)

### 1. Database Setup
Ensure you host a PostgreSQL database (e.g., Supabase, Neon, or Render PostgreSQL). Copy the connection URL and assign it to the `DATABASE_URL` environment variable.

### 2. Configure Build Commands
For web service hosting environments (like Render), configure the following setup parameters:
- **Build Command**: `npm install && npm run build && npx prisma generate`
- **Start Command**: `npx prisma migrate deploy && npm run start`

### 3. Add Production Environment Variables
Configure the production environment variables in your hosting settings panel:
- `PORT` (assigned automatically by the platform or defaults to `5000`)
- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `STRIPE_SECRET_KEY`

---

## License

This project is licensed under the [MIT License](LICENSE).
