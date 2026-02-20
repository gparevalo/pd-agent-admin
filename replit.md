# Replit.md

## Overview

This is a multi-tenant SaaS web application designed for lead management and AI-powered conversations. The platform supports multiple companies (tenants) with their own clients, users, and customizable branding. Key features include user authentication with JWT, subscription management with trial periods and discount codes, lead tracking, AI agent configuration, and dynamic theming per company.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth and theme
- **Styling**: TailwindCSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure with protected routes that check authentication and subscription status. Role-based navigation shows different menu items for superadmin vs company/client admins.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Authentication**: Custom JWT implementation (not using Supabase Auth)
- **Password Hashing**: bcryptjs
- **API Pattern**: RESTful endpoints under `/api` prefix

The backend uses a storage abstraction layer (`server/storage.ts`) that wraps Supabase client operations, making it easier to swap data sources if needed.

### Data Storage
- **Primary Database**: PostgreSQL via Supabase (used as database only, not for auth)
- **ORM/Schema**: Drizzle ORM with Zod validation schemas
- **Schema Location**: `shared/schema.ts` contains all table definitions shared between frontend and backend

Key entities: Companies, Clients, Users, Plans, Subscriptions, Leads, Conversations, Agents, DiscountCodes

### Multi-Tenancy Model
- Companies are the top-level tenant
- Each company can have multiple clients
- Users belong to a company and optionally a client
- Subscriptions are tied to companies with plan-based limits
- Theme customization (colors, logo) is stored per company

### Authentication & Authorization
- JWT tokens with 7-day expiration stored in localStorage
- Middleware chain: `authMiddleware` → `subscriptionMiddleware` → `roleMiddleware`
- Three role levels: `superadmin`, `company_admin`, `client_admin`
- Subscription status checked on protected routes (redirects to blocked page if expired)

### Build System
- Development: `tsx` for direct TypeScript execution
- Production: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Supabase
- Used as PostgreSQL database host only
- Connected via `@supabase/supabase-js` client
- Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
- Tables are managed externally (already exist in Supabase)

### Database
- PostgreSQL accessed through Supabase
- Requires `DATABASE_URL` environment variable for Drizzle Kit operations
- Schema defined in Drizzle format but synced with existing Supabase tables

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string for migrations
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `SESSION_SECRET`: Secret for JWT signing (falls back to default in development)

### UI Component Libraries
- shadcn/ui components (Radix UI primitives)
- Framer Motion for animations
- Lucide React for icons
- react-hook-form with Zod resolvers for form handling

## Color Palette & Theming (PD Agencia Brand Identity)

### Primary Colors (from brand manual)
- **Red Munsell**: #EF0034 (HSL: 347 100% 47%) — Primary brand color
- **Eerie Black**: #1B1B1B (HSL: 0 0% 11%) — Dark/foreground
- **White Smoke**: #F5F5F5 (HSL: 0 0% 96%) — Light backgrounds

### Secondary Colors
- **Violet Sweet**: #633870 (HSL: 286 33% 33%)
- **Shocking Pink**: #F000C4 (HSL: 312 100% 47%)
- **Electric Purple**: #B900F0 (HSL: 282 100% 47%)

### Typography
- **Primary font**: Poppins (Light, Regular, Medium) — set as `--font-sans`
- **Secondary font**: Century Gothic (available as fallback)
- Loaded via Google Fonts in `client/index.html`

### CSS Variables (Light Mode)
- `--primary`: 347 100% 47% (red #EF0034)
- `--foreground`: 0 0% 11% (near-black #1B1B1B)
- `--card`: 0 0% 96% (white smoke #F5F5F5)
- `--muted-foreground`: 0 0% 55% (neutral gray)

### Status Colors (Semantic UX — unchanged)
Status indicators use intentionally varied colors for UX clarity:
- Trial: Blue (secondary variant badge)
- Active: Green (default badge) — semantic, not brand
- Warning: Amber
- Error/Expired: Red (destructive variant)

### Company Customization
- ThemeContext (`client/src/contexts/ThemeContext.tsx`) provides infrastructure for per-tenant theming
- Default theme uses PD Agencia colors (#EF0034 primary, #1B1B1B secondary)
- Company-specific colors can override via `primary_color` and `secondary_color` columns
- The hex-to-HSL conversion utility is implemented for dynamic theme application

### Global Design System (pd-* Utility Classes)
Defined in `client/src/index.css` under `@layer components`, these reusable CSS classes ensure visual consistency:
- **pd-label**: Tiny uppercase label (10px, font-black, tracking-[0.2em], zinc-400)
- **pd-stat**: Large stat value (4xl, font-black, tracking-tighter)
- **pd-section-title**: Section heading (lg, font-black, uppercase, tracking-tight)
- **pd-icon-box / pd-icon-box-sm**: Dark icon containers (rounded, bg-zinc-900)
- **pd-panel**: Rounded sub-panel (bg-zinc-50, border, rounded-3xl)
- **pd-dark-panel**: Dark feature panel (bg-[#111111], rounded-[2.5rem], shadow-2xl)
- **pd-info-row**: Info row with icon + text layout
- **pd-save-btn**: Save button (h-11, px-8, font-bold, shadow-lg, active:scale-95)
- **pd-page-title**: Page header title (text-2xl, font-black, tracking-tight)
- **pd-page-subtitle**: Page header subtitle (text-muted-foreground)

Applied across: Dashboard, all agent tabs (Info/Config/Knowledge/Status), integration cards (WhatsApp/WebWidget/CRM), all admin pages (Companies/Users/Plans/Subscriptions/Discounts), and settings pages (Profile/CompanySettings/Subscription/Conversations/Leads/Catalog/Agents).

## Recent Changes

### Agent Detail Page (Feb 2026)
- Added `/agents/:id` route for viewing and editing individual agents
- AgentDetail.tsx implements 6-tab interface with Framer Motion transitions:
  1. **Información**: Editable name, tone, emoji style, website URL, status toggle
  2. **Configuración**: Service description and internal prompt textareas
  3. **Test Chat**: Interactive chat interface with simulated agent responses
  4. **Conocimiento**: FAQ content and knowledge URL fields
  5. **Integraciones**: Integration management for WhatsApp, n8n, and Go High Level
  6. **Estado**: Read-only metrics (status, conversations, leads, conversion rate)
- Backend endpoints: GET/PUT `/api/agents/:id`, GET `/api/agents/:id/stats`, POST `/api/agents/:id/test-chat`
- Navigation from agents list (click card or eye icon) to detail view
- Mobile responsive with dropdown menu for tabs on smaller screens

### Integrations Tab (Feb 2026)
- Added Integraciones tab (`client/src/pages/AgentIntegrations.tsx`) to agent detail page
- **Agent-level integrations**:
  - WhatsApp Evolution API: QR code modal with simulated connection flow, connect/disconnect
  - n8n Workflow: Workflow details display, copy webhook URL, flow diagram modal with step-by-step explanation
- **Company-level integrations**:
  - Go High Level: OAuth modal with client ID/secret inputs, pre-configured scope, simulated authorization
- All integrations are UI-only (no backend endpoints) with simulated connection states
- Integration cards use Card component with status badges (Conectado/Desconectado)
- Modals use Radix Dialog with Framer Motion animations

### Catalog System (Feb 2026)
- Full CRUD system for products and services at `client/src/pages/CatalogPage.tsx`
- Schema: `catalog` table with JSONB fields for `details` (includes, restrictions, estimated_time) and `advanced_config` (variable_pricing, execution_process)
- Backend: GET `/api/catalog/:companyId`, POST `/api/catalog`, PATCH `/api/catalog/:id`, DELETE `/api/catalog/:id`
- All endpoints enforce multi-tenant security (company_id ownership checks)
- Frontend features: search, type filters (product/service), create/edit modal with form validation, delete confirmation dialog
- JSONB fields use newline-separated text input converted to arrays
- Soft delete pattern (is_active=false)
- Sidebar: "Catálogo" link with Package icon under Agentes for company_admin role
- Route: `/catalog` registered in App.tsx as protected route