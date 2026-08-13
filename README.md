# Orders and Settlements

## Overview

The Orders and Settlements application is a Full Stack B2B SaaS platform designed to safely manage customer orders, line items, and complex payment settlements. 

The core problem solved by this system is **financial concurrency and exact settlement**. When managing payments, a system must reliably guarantee that a user cannot over-pay an invoice (even when malicious duplicate requests hit the server at the exact same millisecond). This application implements strict transactional locking at the PostgreSQL level to guarantee mathematical correctness for all order settlements.

## Features

- **Authentication**: Secure email/password registration and login leveraging HTTP-only JWT cookies.
- **Data Isolation**: Strict multi-tenant row-level access. Users can only read, update, or pay against their own orders.
- **Order Management**: Create, read, and manage orders with dynamic line items.
- **Automated Settlement Math**: Live UX calculation of order totals, payments, and balances.
- **Status Lifecycle**: Automated state derivation (`Pending`, `Partially Paid`, `Paid`, `Overdue`).
- **Payment Processing**: Record partial or full payments safely against outstanding balances.

## Tech Stack

- **Framework**: Next.js (App Router, React Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod (backend schemas) + React Hook Form (frontend)
- **UI Stack**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Testing**: Vitest

## Architecture

The system enforces a strict 4-tier architecture to decouple the user interface from business rules and database mutations.

**Frontend (React Client/Server Components)**
↳ **REST API (Next.js Route Handlers)**
↳ **Service Layer (`src/services/*.ts`)**
↳ **Prisma ORM & PostgreSQL (`src/services/db.ts`)**

**Why separate business logic from route handlers and UI?**
Business logic (like calculating an order total or determining if a payment exceeds a balance) is isolated in `src/lib/calculations.ts` and the Service Layer. This prevents UI bugs from causing financial data corruption. By keeping the API routes dumb and the Service Layer smart, we guarantee that whether an order is created via the Web UI, an iOS App, or a raw cURL request, the exact same mathematical constraints apply.

## Database Design

The schema is defined in `prisma/schema.prisma`.

- **User**: The root owner. Contains `id`, `email`, and securely hashed `password`.
- **Order**: Contains `customer`, `dueDate`. Belongs to `User`.
- **OrderItem**: Contains `description`, `quantity`, `unitPrice`. Belongs to `Order` with `Cascade` delete.
- **Payment**: Contains `amount`, `paymentDate`, `note`. Belongs to `Order` with `Cascade` delete.

**Indexes & Constraints**: 
- All money is stored as an integer (`Int`) representing cents to avoid JavaScript floating-point errors.
- Quantity and Amount are guarded by strict constraints (`quantity >= 1`, `amount >= 1`).
- Indexes exist on foreign keys (`userId`, `orderId`) and highly-queried dates (`dueDate`, `paymentDate`) for optimal query performance.

## Business Rules

1. **Order Total**: `sum(quantity × unit price)` of all line items.
2. **Payments**: Multiple payments are allowed over time.
3. **Amount Paid**: `sum(payments)`.
4. **Amount Due**: `orderTotal - amountPaid`.

### Status Precedence
The status is entirely dynamic and derived exactly when needed via `calculateOrderStatus()`:
1. **Pending**: 0 payments have been made.
2. **Partially Paid**: Payments > 0 but < Order Total.
3. **Paid**: Payments == Order Total. (This takes strict precedence over overdue!).
4. **Overdue**: The current date is past the `dueDate` AND the order is not fully Paid.

## Concurrency (Transaction Safety)

To prevent race conditions resulting in over-payment, the `POST /api/orders/[id]/payments` endpoint implements a strict **transaction-safe lock**.

When a payment is processed:
1. The backend opens a Prisma `$transaction`.
2. A raw PostgreSQL `SELECT ... FOR UPDATE` query locks the specific `Order` row.
3. The database guarantees that if two $300 payment requests hit the server simultaneously for a $400 balance, the first request locks the row, processes, and commits. The second request is forced to wait, recalculates the new balance ($100), realizes $300 exceeds the balance, and aborts with an error.

## API Documentation

### Auth
- `POST /api/auth/register` - Creates a new user.
- `POST /api/auth/login` - Authenticates and sets HTTP-only cookie.
- `POST /api/auth/logout` - Clears the session.

### Orders
- `POST /api/orders`
  - **Purpose**: Create a new order.
  - **Request**: `{ "customer": "Acme", "dueDate": "2024-12-31T00:00:00.000Z", "items": [{ "description": "Consulting", "quantity": 10, "unitPrice": 15000 }] }`
  - **Response (200)**: Order object with calculated totals.
- `GET /api/orders` - List all orders for the authenticated user.
- `PUT /api/orders/[id]` - Replace an order's data and items. (Blocked if new total is less than what is already paid).
- `DELETE /api/orders/[id]` - Delete an order. (Blocked if the order has recorded payments).

### Payments
- `POST /api/orders/[id]/payments`
  - **Purpose**: Record a payment.
  - **Request**: `{ "amount": 15000, "paymentDate": "2024-01-01T00:00:00.000Z", "note": "Check #123" }`
  - **Error (422 Unprocessable Entity)**: `{ "error": { "message": "PAYMENT_EXCEEDS_BALANCE", "details": { "requested": 15000, "remaining": 5000 } } }`

## Validation

- **Quantity**: Must be an integer `>= 1`.
- **Unit Price**: Must be an integer `>= 0`.
- **Payment**: Must be an integer `>= 1` (equivalent to $0.01).
- **Security**: The backend explicitly re-fetches the order joined with the `userId` extracted securely from the JWT session to prevent direct object reference (IDOR) attacks.

## Error Handling
Errors are consistently mapped to semantic HTTP status codes:
- `400 Bad Request`: Zod schema validation failures.
- `401 Unauthorized`: Missing or invalid JWT session.
- `404 Not Found`: The resource doesn't exist or doesn't belong to the user.
- `422 Unprocessable Entity`: Business logic violations (e.g., over-payment).

## Testing

The system is tested using `vitest`.
- **Order Math Tests**: Prove that totals and statuses calculate perfectly under normal and edge-case scenarios.
- **Service Layer Tests**: Ensure `create`, `update`, and `delete` correctly assign totals.
- **Security Tests**: Prove that malicious attempts to update an order below its paid amount, or delete a paid order, throw explicit errors.
- **Payment Edge Cases**: Prove that negative payments, zero payments, and over-payments are completely blocked by the domain logic.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (see below).

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/orders_db?schema=public"

# Secure random string for signing JWT tokens (e.g., openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key"
```

## Deployment

The application is optimized for deployment on Vercel with a managed PostgreSQL database (e.g., Neon or Supabase).

### Exact Deployment Steps

#### 1. Creating/connecting production PostgreSQL
- Provision a production PostgreSQL database (e.g. Neon, Supabase, or AWS RDS).
- Obtain the connection URI (must include `postgresql://` and end with standard flags like `?sslmode=require`).

#### 2. Setting environment variables
- In your Vercel project settings, navigate to **Settings** > **Environment Variables**.
- Add `DATABASE_URL` and paste your PostgreSQL connection URI.
- Add `SESSION_SECRET` and generate a secure random string (e.g., run `openssl rand -base64 32` in your terminal).

#### 3. Deploying
- Connect your GitHub repository to Vercel.
- The Build Command should be set to: `npx prisma generate && npm run build`.
- The Output Directory should be `.next`.
- Click **Deploy**.

#### 4. Running Prisma migrations
- Once the database is connected and before traffic flows, run the production migration against the DB:
  ```bash
  DATABASE_URL="your-production-url" npx prisma migrate deploy
  ```
- *Note: NEVER use `prisma migrate reset` or `prisma db push` on a production database.*

#### 5. Seeding (Optional)
- If this is a fresh environment intended for demo purposes, you can safely seed the database.
- Run: `DATABASE_URL="your-production-url" npm run db:seed`
- *Note: Do not seed a true live production database containing real user data.*

#### 6. Verifying authentication
- Navigate to your deployed URL.
- Go to `/register` and sign up with a test email.
- Verify you are securely redirected to `/dashboard`.
- Verify clicking 'Sign Out' clears the secure `HttpOnly` cookie and redirects you back to `/login`.

#### 7. Verifying API
- From the Dashboard, create an order with multiple items.
- Ensure the server correctly calculates the total (client-side totals are ignored for security).

#### 8. Verifying payments
- Navigate to the newly created order.
- Record a partial payment and verify the outstanding balance reduces correctly.
- Attempt to record an over-payment (exceeding the remaining balance) and verify it is rejected.

*Live URL: [Deployment Pending]*

## Assumptions and Tradeoffs

- **Financial Primitives**: We assume USD/Cents architecture. We are storing money as Integers representing cents. We have elected not to implement multi-currency support for simplicity.
- **Hard Deletes**: Currently, deleting an order physically removes it from the database (Cascading to OrderItems). 

## Production Improvements (Future Scope)

While not currently implemented, scaling this application to enterprise production would require:
- **Idempotency Keys**: To prevent duplicate payment processing if a client loses connectivity and retries a POST request.
- **Audit Logs**: Tracking `createdBy` and `updatedBy` for financial compliance.
- **Pagination**: The `GET /api/orders` endpoint should be paginated (e.g., cursor-based) to handle accounts with thousands of orders gracefully.
- **Rate Limiting**: Implementation of IP/User-based rate limiting on the Auth and Payment API routes.
