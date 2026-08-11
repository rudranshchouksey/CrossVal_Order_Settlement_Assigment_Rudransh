# Orders and Settlements

## Project Purpose
This is a take-home assignment for a Full Stack Developer role. The application allows users to create and manage orders and settlements (payments). 

## Phase 0: Project Foundation
This phase establishes the project foundation without implementing business logic. It includes the Next.js setup with TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, and Vitest for testing.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your local PostgreSQL database URL.
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Run Prisma migrations to set up the database (when schema is defined):
   ```bash
   npx prisma migrate dev
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Run Tests:**
   ```bash
   npx vitest run
   ```

## Architecture Principles
- **Business Logic Isolation:** Business logic is independent of UI, implemented in a clean service/business layer.
- **Thin API Routes:** API route handlers remain thin, deferring to the service layer.
- **Reusable Validation:** Validation schemas (using Zod) are centralized and reusable across client and server.
- **Centralized Database Access:** Database access is centralized using Prisma.
- **Robust Calculations:** Money calculations use integer cents or Prisma Decimal to avoid floating-point errors.
