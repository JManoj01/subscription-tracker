# Replit MD

## Overview

This is a **Subscription Tracker** web application that helps users manage and monitor their recurring subscriptions. Users can add, edit, and delete subscriptions, track monthly/yearly costs, and get alerts for expiring free trials. The app uses a monorepo structure with a React frontend and Express backend, backed by PostgreSQL.

Key features:
- CRUD operations for subscriptions (name, cost, billing cycle, trial status)
- Cost stored in **cents** (integer) in the database; frontend converts to/from dollars (divide/multiply by 100)
- Trial tracking with `isTrial` and `trialEndDate` fields, highlighting trials expiring within 3-5 days
- Monthly/yearly cost aggregation across different billing cycles (weekly, monthly, quarterly, semiannual, yearly)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project follows a three-directory monorepo pattern:
- **`client/`** — React frontend (Vite-powered SPA)
- **`server/`** — Express backend (API server)
- **`shared/`** — Shared code (database schema, API route definitions, Zod validation)

### Frontend (`client/src/`)
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming; monospace font aesthetic
- **Forms**: React Hook Form with Zod resolver for validation
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express 5 on Node.js
- **Runtime**: tsx for TypeScript execution
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Validation**: Zod schemas shared between client and server via `shared/routes.ts`
- **Storage Layer**: `IStorage` interface implemented by `DatabaseStorage` class using Drizzle ORM
- **Dev Server**: Vite dev server middleware for HMR in development; static file serving in production

### Shared Layer (`shared/`)
- **`schema.ts`**: Drizzle ORM table definitions and Zod insert schemas (single `subscriptions` table)
- **`routes.ts`**: API route contract definitions with paths, methods, input schemas, and response schemas — used by both client hooks and server routes

### Database
- **PostgreSQL** via `node-postgres` (pg) driver
- **ORM**: Drizzle ORM with `drizzle-zod` for automatic Zod schema generation
- **Schema management**: `drizzle-kit push` for applying schema changes (no migration files needed for dev)
- **Connection**: `DATABASE_URL` environment variable required

### Database Schema
Single table `subscriptions`:
| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| name | text | Not null |
| cost | integer | Stored in cents |
| cycle | text | 'monthly', 'yearly', 'weekly', 'quarterly', 'semiannual' |
| startDate | timestamp | Defaults to now |
| isTrial | boolean | Defaults to false |
| trialEndDate | timestamp | Nullable |
| status | text | 'active' or 'cancelled', defaults to 'active' |
| url | text | Nullable |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | List all subscriptions |
| GET | `/api/subscriptions/:id` | Get single subscription |
| POST | `/api/subscriptions` | Create subscription |
| PATCH | `/api/subscriptions/:id` | Update subscription |
| DELETE | `/api/subscriptions/:id` | Delete subscription |

### Build System
- **Dev**: `tsx server/index.ts` with Vite middleware for HMR
- **Production Build**: Vite builds client to `dist/public/`, esbuild bundles server to `dist/index.cjs`
- **Build script**: `script/build.ts` handles both client and server builds, selectively bundling server dependencies from an allowlist

## External Dependencies

### Database
- **PostgreSQL** — Required. Connection string via `DATABASE_URL` environment variable
- **connect-pg-simple** — Session store (available but sessions not currently active)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and schema management for PostgreSQL
- **@tanstack/react-query** — Server state management
- **shadcn/ui** ecosystem — Radix UI primitives, class-variance-authority, tailwind-merge, clsx
- **react-hook-form** + **@hookform/resolvers** — Form management with Zod validation
- **wouter** — Client-side routing
- **date-fns** — Date formatting and calculations
- **recharts** — Chart library (available for cost visualization)
- **lucide-react** — Icon library
- **react-day-picker** — Calendar/date picker component
- **zod** — Schema validation (shared between client and server)

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)