# RentNest Backend Starter

Production-ready, highly scalable, and type-safe backend starter for RentNest built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Configuration](#environment-configuration)
- [Prisma ORM (Prisma 7)](#prisma-orm-prisma-7)
- [Error Handling](#error-handling)
- [API Responses](#api-responses)
- [Code Style & Quality](#code-style--quality)

---

## Features

- **TypeScript v6**: Full type safety, modular structures, and standard CommonJS compilation.
- **Express App**: High-performance HTTP server setup with pre-integrated production-ready security middlewares.
  - [Helmet](https://helmetjs.github.io/) for securing HTTP headers.
  - [CORS](https://github.com/expressjs/cors) with dynamic origin whitelist support.
  - [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit) to mitigate brute-force and denial-of-service attempts.
- **Environment Validation**: Strictly-typed configurations using [Zod](https://zod.dev/) schemas. Validation failures crash the server instantly during startup, preventing run-time configuration bugs.
- **Prisma 7 & PostgreSQL**: Modern setup using PostgreSQL Driver Adapter (`@prisma/adapter-pg` and `pg` pool) for optimal connection pooling and Prisma 7 compliance.
- **Global Error Handling**: Custom `AppError` class hierarchy distinguishing between operational errors and programmer bugs, combined with standard Prisma error mappings.
- **Standardized API Responses**: `ApiResponse` utility for consistent, predictable JSON success and error payload contracts.
- **API Versioning**: Scalable route design separating versions under `/api/v1/...`.
- **Quality Assurance**: Integrated **ESLint** (v10 flat configurations) and **Prettier** for automated code formatting and lint verification.

---

## Architecture & Folder Structure

The project follows a modular, scalable layer design, facilitating clean division of concerns as features are added:

```
rentnest/
├── src/
│   ├── app.ts                 # Express application initialization & middleware mounting
│   ├── server.ts              # HTTP server entrypoint, database checks, and process handlers
│   ├── config/                # App configuration (Environment validation, DB client)
│   │   ├── db.ts              # Prisma Client wrapper (with driver adapters & dev singleton pattern)
│   │   └── env.ts             # Zod environment variable parsing schema
│   ├── constants/             # Application-wide constants & status messages
│   ├── errors/                # Unified custom AppError classes
│   │   └── appError.ts
│   ├── middlewares/           # Global Express middlewares
│   │   ├── error.middleware.ts        # Express centralized error responder
│   │   ├── notFound.middleware.ts     # 404 Route handler
│   │   └── requestLogger.middleware.ts # HTTP morgan logger matching custom output
│   ├── routes/                # Route specifications
│   │   ├── index.ts           # Router aggregator (/api)
│   │   └── v1/                # Version 1 root router (/api/v1)
│   │       └── index.ts
│   ├── utils/                 # General-purpose utility helpers
│   │   ├── apiResponse.ts     # Custom response standardizer
│   │   └── logger.ts          # Colorized CLI console logger
│   └── modules/               # Feature modules (Users, Property, Bookings, etc. go here)
├── prisma/
│   ├── schema.prisma          # Prisma schema defining database models
│   └── migrations/            # Generated SQL migrations (managed by Prisma)
├── eslint.config.js           # ESLint v10 Flat config
├── nodemon.json               # Nodemon watcher configuration
├── tsconfig.json              # TypeScript compilation setup
├── .prettierrc                # Prettier code styling preferences
├── .prettierignore            # Prettier build paths exception listing
└── .gitignore                 # Standard Node git exclusions
```

---

## Prerequisites

- **Node.js**: >= 18.x (Recommended: v20 LTS)
- **PostgreSQL**: Local or hosted database instance

---

## Getting Started

### 1. Clone the repository and install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values (specifically your database connection details):

```bash
cp .env.example .env
```

### 3. Initialize Prisma client & database

Generate the Prisma Client client-side files:

```bash
npm run prisma:generate
```

Run database migrations to initialize tables (requires running PostgreSQL instance matching your `DATABASE_URL`):

```bash
npm run prisma:migrate
```

### 4. Start the development server

```bash
npm run dev
```

The server will initialize on the configured port (default `5000`). Test the health endpoint:
[http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## Available Scripts

- `npm run dev`: Starts the development server using Nodemon and ts-node. Watches for changes in `src/**/*.ts`.
- `npm run build`: Compiles `.ts` files into production-ready JavaScript inside the `dist/` directory.
- `npm run start`: Runs the compiled server from `dist/server.js` (used in production).
- `npm run prisma:generate`: Generates client code for schema configuration.
- `npm run prisma:migrate`: Runs migrations in development.
- `npm run prisma:studio`: Opens the Prisma Studio GUI interface to interact with your data.
- `npm run lint`: Analyzes code for quality concerns and warnings using ESLint.
- `npm run lint:fix`: Fixes lint warnings and formatting issues.
- `npm run format`: Standardizes code formatting across files using Prettier.
- `npm run format:check`: Validates formatting without writing changes.

---

## Environment Configuration

Strictly validated environment variables located in [src/config/env.ts](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/src/config/env.ts).

Available variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP Server port | `5000` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | PostgreSQL connection URL | *Required* |
| `CORS_ORIGIN` | CORS white-listed URL(s) (comma-separated or `*`) | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit duration window in milliseconds | `900000` (15 mins) |
| `RATE_LIMIT_MAX` | Max allowed requests per IP within the window | `100` |

---

## Prisma ORM (Prisma 7)

Prisma 7 decouples the direct connection string injection from `schema.prisma`. 

1. **Configuration**: Database URLs are configured inside [prisma.config.ts](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/prisma.config.ts) using standard node environments.
2. **Prisma Client Setup**: Inside [src/config/db.ts](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/src/config/db.ts), the database connection pool is created using standard `pg` and wrapped inside `@prisma/adapter-pg`. This guarantees support for standard local PostgreSQL servers under Prisma 7.

---

## Error Handling

Errors should be thrown directly from services, controllers, or middlewares using our custom classes, located in [src/errors/appError.ts](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/src/errors/appError.ts):

- `BadRequestError(message, errors)`
- `UnauthorizedError(message)`
- `ForbiddenError(message)`
- `NotFoundError(message)`
- `ConflictError(message)`
- `InternalServerError(message, details)`

The global [errorHandler](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/src/middlewares/error.middleware.ts) middleware intercepts these errors, handles database-specific code mappings (like unique constraints), hides developer stack traces in production environments, and responds with a standard payload structure.

---

## API Responses

All responses are standardized using the `ApiResponse` class in [src/utils/apiResponse.ts](file:///C:/Users/sumai/OneDrive/Desktop/rentnest/src/utils/apiResponse.ts).

### Success Payload Example

`ApiResponse.success(res, 200, "Successfully fetched health check data", data);`

```json
{
  "success": true,
  "message": "Successfully fetched health check data",
  "data": {
    "uptime": 1.48208,
    "timestamp": "2026-07-09T09:12:03Z",
    "status": "UP"
  }
}
```

### Error Payload Example

`ApiResponse.error(res, 400, "Invalid email address formatting", errors);`

```json
{
  "success": false,
  "message": "Invalid email address formatting",
  "errors": {
    "details": ["Email must contain a valid domain extension."]
  }
}
```

---

## Code Style & Quality

This project enforces unified styling using Prettier and ESLint. Configurations are located in `.prettierrc` and `eslint.config.js`.

To verify compliance or automatically format your workspace:
```bash
npm run format
npm run lint
```
