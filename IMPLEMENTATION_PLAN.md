# Asshrabha — Bilingual Marketplace Platform (v2)

Asshrabha is a single Next.js marketplace application that supports three primary roles: **Admin**, **Provider**, and **Customer**. The platform is bilingual (Arabic / English), supports RTL layout for Arabic, and includes admin catalog management, provider listings, customer storefront shopping, in-app support chat, wallet handling, and CSV/XLSX import workflows.

---

## App Purpose

The app is designed to separate platform control from provider storefronts:

- **Admin** manages the marketplace catalog, categories, providers, orders, payouts, support, and platform configuration.
- **Provider** manages store profile details, delivery zones, provider-specific product listings tied to the admin-approved catalog, orders, and withdrawals.
- **Customer** browses products, shops by category or store, checks out, manages addresses, and communicates with support.

The platform is intentionally built as a marketplace where providers do not directly create master catalog products; instead, providers add listings based on this centralized catalog.

---

## Architecture Summary

The app is a single Next.js application using:

- Next.js App Router with separate route groups for admin, provider, and shop experiences
- TypeScript 5 for frontend and backend types
- Prisma ORM with PostgreSQL
- `next-intl` for localization and RTL support
- Zod for request and form validation
- NextAuth / Auth.js v5 for authentication
- Local disk uploads under `uploads/` with a planned MinIO migration
- SSE-based chat and notification streams
- Vitest for unit and integration tests

Key application areas:

- `src/app/` — page routes, layouts, client/server components
- `src/app/api/` — backend API routes for auth, uploads, notifications, shop, provider, and admin
- `src/lib/` — auth helpers, Prisma client, validation schemas, utilities
- `src/components/` — reusable UI and layout components
- `prisma/` — database schema and seed scripts
- `messages/` — Arabic and English localization files

---

## Main App Pages

### Public / Authentication
- `/login` — login page for existing users, with mobile and password entry plus language selection.
- `/register` — multi-step registration page for new customers or providers, collecting profile and store details.
- `/verify-otp` — OTP verification page for account confirmation after registration or login.
- `/pending` — pending approval page for users whose accounts are awaiting admin confirmation.
- `/reset-password` — password reset page for users required to change their password.

### Admin
- `/admin` — admin dashboard overview with key metrics, latest orders, and pending actions.
- `/admin/accounts/providers` — list of provider accounts with status and approval controls.
- `/admin/accounts/customers` — customer account management list with search and editing.
- `/admin/accounts/admins` — admin user management and role assignment.
- `/admin/categories` — category management page for creating and editing categories.
- `/admin/catalog` — master catalog list showing admin catalog products and status.
- `/admin/catalog/new` — form to create a new catalog product with bilingual fields and pricing.
- `/admin/catalog/new-product` — alternate route for catalog product entry, typically with a simplified flow.
- `/admin/catalog/edit-product/[id]` — edit page for an existing catalog product by ID.
- `/admin/catalog/import` — import workflow page for uploading XLSX/CSV catalog files and previewing rows.
- `/admin/approvals` — approvals queue for provider suggestions, products, and profile changes.
- `/admin/orders` — orders overview page with filtering and status management.
- `/admin/orders/[id]` — detailed order view with items, customer info, and fulfillment notes.
- `/admin/wallet` — admin wallet dashboard for platform balances and settlement controls.
- `/admin/wallet/providers` — provider wallet management and payout monitoring.
- `/admin/wallet/payment-methods` — payment method configuration and supported channels.
- `/admin/wallet/withdraw-requests` — withdraw request list with approval and rejection actions.
- `/admin/wallet/history` — wallet transaction history and balance changes.
- `/admin/support` — support chat list showing active and recent conversations.
- `/admin/support/[id]` — individual support thread for admin responses.
- `/admin/analytics` — analytics dashboard with charts for sales, orders, and provider performance.
- `/admin/reports/products` — product reporting page for catalog usage and performance.
- `/admin/reports/orders` — orders reporting page with revenue and status breakdown.
- `/admin/reports/providers` — provider report page tracking provider activity and metrics.
- `/admin/reports/clients` — client report page for customer behavior and order summaries.
- `/admin/locations` — location management page for supported delivery or market regions.
- `/admin/hero` — hero section management page for homepage banners and promotions.
- `/admin/notifications` — notification management and broadcast history.
- `/admin/logs` — logs and audit page for system actions and admin events.
- `/admin/templates` — message/template management for WhatsApp or notification templates.
- `/admin/customer-profile-edits` — list of customer profile edit requests requiring review.
- `/admin/customer-profile-edits/[userId]/history` — history page for a specific customer's profile changes.
- `/admin/provider-profile-edits` — list of provider profile edit requests requiring review.
- `/admin/provider-profile-edits/[providerId]/history` — history page for a specific provider's edits.

### Provider
- `/provider` — provider dashboard with store summary, orders, and quick actions.
- `/provider/store` — store profile page for editing provider details and delivery zones.
- `/provider/delivery-areas` — management page for adding, editing, and activating delivery zones.
- `/provider/products` — list of provider products and their approval status.
- `/provider/products/edit` — generic edit flow for provider product settings.
- `/provider/products/edit/[id]` — edit page for a specific provider listing by ID.
- `/provider/products/catalog` — catalog browsing page for providers to add approved admin products.
- `/provider/products/catalog/[id]` — detail page for a catalog product used to create listings.
- `/provider/orders` — provider orders list for managing fulfillment and status.
- `/provider/orders/[orderId]` — order detail page for provider delivery notes and customer info.
- `/provider/notifications` — provider notification feed for order and system updates.
- `/provider/suggestions` — suggestions page for providers to submit new product suggestions.

### Customer / Shop
- `/shop` — storefront home page for browsing featured categories and products.
- `/shop/category/[slug]` — category listing page showing products within a category.
- `/shop/product/[id]` — product detail page with pricing, provider options, and add-to-cart.
- `/shop/product` — generic product fallback page for legacy or query-based product views.
- `/shop/store/[id]` — provider storefront page showing a provider's available products.
- `/shop/cart` — shopping cart page with item quantities, totals, and checkout button.
- `/shop/checkout` — checkout flow page for shipping, payment, and order confirmation.
- `/shop/orders` — customer order history page with order summaries.
- `/shop/orders/[orderId]` — order detail and tracking page for a specific customer order.
- `/shop/search` — search results page for products and stores.
- `/shop/support` — customer support start page for opening chat requests.
- `/shop/wallet` — customer wallet page for balance and deposit/withdraw information.
- `/shop/profile` — profile landing page with quick access to personal settings.
- `/shop/profile/edit` — page for editing customer profile information.
- `/shop/profile/edit/customer` — customer-specific profile edit page for personal details.
- `/shop/profile/addresses` — address management page for saved delivery addresses.

---

## API Route Overview

### Authentication
- `src/app/api/auth/[...nextauth]/route.ts` — main NextAuth handler
- `src/app/api/auth/signout/route.ts` — sign out endpoint
- `src/app/api/auth/whatsapp-otp/route.ts` — OTP generation and delivery endpoint

### Upload and Media
- `src/app/api/upload/route.ts` — upload files to local storage
- `src/app/api/user/avatar/route.ts` — upload user avatars

### Notification System
- `src/app/api/notifications/route.ts` — notifications list / actions
- `src/app/api/notifications/mark-read/route.ts` — mark notifications read
- `src/app/api/notifications/vapid-key/route.ts` — push key endpoint
- `src/app/api/notifications/subscribe/route.ts` — subscribe for push notifications
- `src/app/api/notifications/stream/route.ts` — SSE stream for live notifications

### Shop APIs
- `src/app/api/cart/add/route.ts` — add item to cart
- `src/app/api/catalog/product/route.ts` — catalog product fetch
- `src/app/api/shop/categories/route.ts` — fetch shop categories
- `src/app/api/shop/checkout/route.ts` — submit checkout
- `src/app/api/shop/checkout/totals/route.ts` — calculate checkout totals
- `src/app/api/shop/profile/edit/route.ts` — update profile
- `src/app/api/shop/profile/edit-customer/route.ts` — update customer data
- `src/app/api/shop/profile/addresses/route.ts` — address CRUD
- `src/app/api/shop/support/start/route.ts` — start a support chat
- `src/app/api/shop/support/[id]/messages/route.ts` — chat messages
- `src/app/api/shop/support/[id]/stream/route.ts` — chat SSE stream
- `src/app/api/shop/wallet/route.ts` — wallet overview
- `src/app/api/shop/wallet/balance/route.ts` — wallet balance
- `src/app/api/shop/wallet/withdraw/route.ts` — withdraw request
- `src/app/api/shop/wallet/deposit/route.ts` — deposit request

### Provider APIs
- `src/app/api/provider/store/route.ts` — provider store settings
- `src/app/api/provider/delivery-zones/route.ts` — create delivery zone
- `src/app/api/provider/delivery-zones/[id]/route.ts` — update/delete delivery zone
- `src/app/api/provider/provider-product/route.ts` — provider product details
- `src/app/api/provider/provider-products/route.ts` — provider product list
- `src/app/api/provider/provider-products/[id]/route.ts` — provider product action
- `src/app/api/provider/provider-products/[id]/re-register/route.ts` — re-register listing
- `src/app/api/provider/products/export/route.ts` — export provider products
- `src/app/api/provider/suggestions/route.ts` — suggestions submission

### Admin APIs
- `src/app/api/admin/admins/route.ts` — admin user list and create
- `src/app/api/admin/providers/route.ts` — provider account list
- `src/app/api/admin/providers/[id]/route.ts` — provider update and details
- `src/app/api/admin/providers/[id]/location/route.ts` — provider location management
- `src/app/api/admin/categories/route.ts` — category management
- `src/app/api/admin/hero/route.ts` — hero section management
- `src/app/api/admin/locations/route.ts` — location management
- `src/app/api/admin/marketing/route.ts` — marketing actions
- `src/app/api/admin/templates/route.ts` — template management
- `src/app/api/admin/customer-profile-edits/route.ts` — customer profile edit approvals
- `src/app/api/admin/provider-profile-edits/route.ts` — provider profile edit approvals
- `src/app/api/admin/support/route.ts` — admin support list
- `src/app/api/admin/support/[id]/messages/route.ts` — admin support messages
- `src/app/api/admin/support/[id]/stream/route.ts` — admin chat SSE
- `src/app/api/admin/catalog-products/route.ts` — create catalog product
- `src/app/api/admin/catalog-products/[id]/route.ts` — update catalog product
- `src/app/api/admin/catalog-products/import/route.ts` — final catalog import
- `src/app/api/admin/catalog-products/import/preview/route.ts` — import preview endpoint
- `src/app/api/admin/catalog-products/export/template/route.ts` — generate Excel template
- `src/app/api/admin/provider-products/route.ts` — provider product list
- `src/app/api/admin/provider-products/[id]/route.ts` — provider product actions
- `src/app/api/admin/orders/[id]/status/route.ts` — update order status
- `src/app/api/admin/wallet/payment-methods/route.ts` — payment method list
- `src/app/api/admin/wallet/providers/route.ts` — provider wallet support
- `src/app/api/admin/wallet/withdraw-requests/route.ts` — withdraw requests list
- `src/app/api/admin/wallet/withdraw-requests/[id]/approve/route.ts` — approve withdraw
- `src/app/api/admin/wallet/withdraw-requests/[id]/reject/route.ts` — reject withdraw
- `src/app/api/admin/wallet/deposit-requests/route.ts` — deposit requests list
- `src/app/api/admin/wallet/deposit-requests/[id]/approve/route.ts` — approve deposit
- `src/app/api/admin/wallet/deposit-requests/[id]/reject/route.ts` — reject deposit
- `src/app/api/admin/approvals/requests/route.ts` — approval requests list
- `src/app/api/admin/notifications/route.ts` — admin notifications

### Debug and Development APIs
- `src/app/api/debug/seed-accounts/route.ts`
- `src/app/api/debug/cleanup-accounts/route.ts`
- `src/app/api/debug/simulate-approval/route.ts`

---

## Data Model Summary

The core data model is built around a central catalog and separate provider listings.

### Main models
- `User` — authentication, role, locale, status, and profile fields
- `ProviderProfile` — provider storefront details, location, media, and business metadata
- `Category` — product category entity with bilingual names and slug
- `CatalogProduct` — admin-managed master product entity
- `ProviderProduct` — provider-specific listing linked to a catalog product
- `Order` / `OrderItem` — order and item records
- `Wallet` / `WalletTransaction` — account balances and wallet history
- `WithdrawRequest` — provider withdrawal requests
- `Review` — reviews for providers and products
- `Notification` — in-app notification records
- `ChatRoom` / `ChatMessage` / `ChatParticipant` — support chat persistence
- `ApprovalRequest` — approval workflow records
- `OTPCode` — OTP codes for authentication/verification
- `Address` — saved customer addresses

### Enums
- `UserRole` — `ROOT_ADMIN`, `SUB_ADMIN`, `PROVIDER`, `CUSTOMER`
- `AccountStatus` — `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `DISABLED`
- `ProductStatus` — `DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `ProviderProductStatus` — provider listing lifecycle state
- `OrderStatus` — order lifecycle stages
- `UnitType` — `PIECE`, `BOX`, `PACK`
- `WalletTxType`, `WalletTxStatus`, `WithdrawStatus`, `NotificationType`, `ApprovalType`, `ApprovalState`

### Product rules
- Master catalog products enforce bilingual names and optional bilingual descriptions.
- Catalog product prices use numeric minimum/maximum values.
- `unitType` is restricted to allowed values only.
- Provider listings are linked to `CatalogProduct` by ID.

---

## Validation and Import Workflows

### Validation
- `src/lib/validations/catalog.ts` validates catalog product payloads and price logic.
- `src/lib/validations/auth.ts` validates login and registration data.
- `src/lib/validations/provider.ts` validates provider store and listing forms.
- `src/lib/utils/helpers.ts` provides normalization, permissions, and text helpers.

### Import workflow
- Admin uploads a CSV/XLSX file on `/admin/catalog/import`.
- `api/admin/catalog-products/import/preview` parses the file and returns preview rows.
- Duplicate detection is performed against the current catalog and the uploaded file itself.
- The preview UI displays the parsed products and flags issues.
- Final submission posts validated JSON to `api/admin/catalog-products/import`.
- Backend validates the `products` payload and inserts `CatalogProduct` entries.
- If any category IDs are invalid or a schema rule fails, the route returns structured errors.

### Excel utilities
- `src/lib/utils/excel-utils.ts` provides generation and parsing helpers for import/export.
- It supports both CSV and XLSX templates.
- It also includes helpers for duplicate detection and example rows.

---

## User Interface and Experience

### Localization
- Messages are stored in `messages/ar.json` and `messages/en.json`.
- The layout root uses `dir={locale === 'ar' ? 'rtl' : 'ltr'}`.
- Arabic layouts and form fields respect RTL direction.

### Themes
- The app supports light and dark themes via CSS custom properties.
- Theme selection is persisted in `localStorage`.
- The root layout preloads the selected theme.

### Components
- Shared UI primitives include Buttons, Inputs, Selects, Modals, Tables, Cards, Toasts, and FileUpload components.
- Sidebars are used in admin and provider route groups.
- Chat and notification components support live streams.
- Reusable form components simplify login, register, product, address, and review pages.

---

## Important Files and Locations

- `src/app/layout.tsx` — root app layout, locale detection, theme, and global styles.
- `src/app/api/auth/[...nextauth]/route.ts` — authentication provider.
- `src/lib/auth.ts` — auth helpers and session callbacks.
- `src/lib/prisma.ts` — Prisma client singleton.
- `src/lib/validations/catalog.ts` — catalog validation schemas.
- `src/lib/utils/excel-utils.ts` — import/export utilities.
- `src/app/(admin)/admin/catalog/import/page.tsx` — admin catalog import UI.
- `src/app/api/admin/catalog-products/import/route.ts` — final import endpoint.
- `src/app/api/admin/catalog-products/import/preview/route.ts` — preview import endpoint.
- `prisma/schema.prisma` — data model definitions.
- `messages/ar.json` and `messages/en.json` — localized UI labels.

---

## Run and Development Commands

```bash
npm install
npm run dev
npm run build
npm run start
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run db:ensure-schema
npm run db:seed-test
```

### Local Setup Notes
- Create a `.env` file with `DATABASE_URL`, `NEXTAUTH_SECRET`, and optional `NEXT_PUBLIC_APP_URL`.
- Ensure the `uploads/` directory exists and is writable.
- Seed initial admin and catalog data with `npm run db:seed`.
- If you use a portable database, ensure PostgreSQL is available.

---

## Current Known Issues and Notes

1. **Admin import validation bug fixed**
   - `src/app/api/admin/catalog-products/import/route.ts` needed `parsed.error.issues` instead of `parsed.error.errors` for Zod.

2. **Import template unit values corrected**
   - Example data in `src/lib/utils/excel-utils.ts` previously used invalid unit values such as `KG` and `LITER`.
   - The allowed `UnitType` values are `PIECE`, `BOX`, and `PACK`.

3. **Frontend/backend payload alignment**
   - The admin preview page should submit JSON that matches the catalog product schema exactly.
   - The final import route validates the full `products` array.

4. **Auth fallback path**
   - `src/lib/auth.ts` currently contains Prisma and fallback raw query login logic.
   - This should be cleaned up once Prisma auth is fully stable.

5. **Route coverage**
   - Admin, provider, and shop route groups are largely scaffolded.
   - Future work should verify complete page coverage and fill missing feature pages.

---

## App Description for Developers

Asshrabha is built to support a managed marketplace in which the admin maintains a bilingual product catalog, providers offer product listings from that catalog, and customers shop through a single storefront.

This file is intended to document the app for any developer or stakeholder needing the full idea, routes, architecture, and current implementation decisions.
