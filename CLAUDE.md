# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERC-8004 Scan — Discovery, Verification, and Trust Scoring Platform for Autonomous Agents on Avalanche. Full-stack Next.js 14 app with blockchain integration, three trust scoring engines, and a 27-check sentinel validation system.

## Commands

```bash
npm run dev              # Next.js dev server (port 3000)
npm run build            # prisma generate + next build
npm run lint             # ESLint (next lint)
npm run format           # Prettier
npm run type-check       # tsc --noEmit
npm test                 # Vitest
npm run test:coverage    # Vitest with v8 coverage

# Database
npm run db:generate      # Prisma client generation
npm run db:migrate       # Prisma migrate dev
npm run db:push          # Prisma db push
npm run db:studio        # Prisma Studio GUI
```

Run a single test: `npx vitest run tests/validation.test.ts`

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Frontend**: React 18, TailwindCSS, shadcn/ui, TanStack Query + Table, React Hook Form + Zod
- **Blockchain**: Wagmi 2.x + Viem 2.x (Avalanche C-Chain mainnet 43114 / Fuji testnet 43113)
- **Database**: PostgreSQL via Supabase, Prisma ORM (14 models)
- **Auth**: Wallet signature verification (Viem) + nonce anti-replay (AuthNonce model)
- **Deployment**: Vercel (cron jobs, analytics, speed insights), Sentry error tracking

### Key Directories
- `src/app/api/v1/` — 22 REST API routes (agents CRUD, scoring, validation, indexer, auth)
- `src/services/` — Business logic layer (scoring engines, blockchain, indexing, centinela/)
- `src/hooks/` — Custom React hooks wrapping TanStack Query for data fetching
- `src/lib/blockchain/` — Wagmi/Viem config, ABIs, chain setup
- `src/lib/database/prisma.ts` — Prisma client singleton
- `src/components/ui/` — shadcn/ui base components
- `prisma/schema.prisma` — Database schema (14 models, key enums: AgentStatus, AgentType, ValidationVerdict)
- `docs/` — Comprehensive project documentation (architecture, API, standards, features)
- `tests/` — Vitest tests with fixtures/ and mocks/

### Three Trust Score Engines
1. **v1** (`trust-score-service.ts`): Volume(25%) + Proxy(20%) + Uptime(25%) + OZ Match(15%) + Ratings(15%)
2. **TRACER** (`tracer-score-service.ts`): Trust(20%) + Reliability(25%) + Autonomy(15%) + Capability(15%) + Economics(10%) + Reputation(15%) — 6-dimensional scoring
3. **v2 Combined** (`combined-trust-score-service.ts`): Infrastructure(50%) + Community(20%) + Correlation(15%) + RL(15%) — current production target

### Centinela Verification Engine (`src/services/centinela/`)
- `sentinel-validator.ts` — 27-check validation engine (PASS/PARTIAL/FAIL verdict)
- `heartbeat-service.ts` — Agent uptime monitoring via contract pings
- `proxy-detector.ts` — EIP-1967 proxy pattern analysis
- `oz-matcher.ts` — OpenZeppelin bytecode comparison

### Data Pipelines
- Routescan Indexer: discovers agents via ERC-8004 Identity Registry events
- Transaction Volume: Snowtrace API integration
- Reputation Indexer: FeedbackSubmitted events from Reputation Registry
- Vercel cron: `/api/cron/indexer` runs hourly

### Key Contracts (Avalanche C-Chain)
- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

## Patterns & Conventions

- **Server Components by default** (RSC); client components marked with `'use client'`
- **Data fetching hooks**: all in `src/hooks/`, wrap TanStack Query with 5min stale time
- **API responses**: use helpers from `src/lib/utils/api-helpers.ts`
- **Error handling**: custom `AppError`/`InternalError` classes in `src/lib/utils/errors.ts`
- **Validation**: Zod schemas in `src/lib/utils/validation.ts` for all API inputs
- **Logging**: Pino logger via `src/lib/utils/logger.ts` — use child loggers with module context
- **Middleware** (`src/middleware.ts`): rate limiting (100 req/min default, 5 req/hr registration), CSP headers, CORS

## Code Style

- ESLint extends `next/core-web-vitals` + `next/typescript`
- Prettier: semicolons, single quotes, 2-space tabs, 100 char width, trailing commas (es5), LF line endings
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- lint-staged runs on commit via Husky

## Environment Variables

See `.env.example`. Required: `DATABASE_URL`, `DIRECT_URL`, Supabase keys, `NEXT_PUBLIC_CHAIN_ENV` (testnet/mainnet), `NEXT_PUBLIC_AVALANCHE_RPC_URL`, WalletConnect project ID. Optional: Sentry DSN, fallback RPC URL.

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`): lint → type-check → prisma validate → build. Node 20.

## Current Development

- **Branch**: `dev-cyberpaisa` (SUPERTEAM Protocol v3.0 — Phases 0-4 completed)
- **Active work**: Frontend migration from Trust Score v1 dimensions to v2 four-pillar system
