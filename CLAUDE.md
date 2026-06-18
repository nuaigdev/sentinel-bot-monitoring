# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (bypasses RLS; used in API routes only)

Run `supabase/migrations/001_initial_schema.sql` then `002_rls_policies.sql` in the Supabase SQL editor before starting.

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · Vercel

**Route groups:**
- `app/(auth)/login` — public SaaS marketing + auth page
- `app/(dashboard)/` — all protected pages; layout checks auth and renders Sidebar
- `app/api/v1/runs/` — bot reporting endpoints (`start`, `log`, `end`); authenticated via `x-bot-key` header
- `app/api/v1/bots/` — CRUD for bots + key management; authenticated via Supabase Auth session

**Auth split:**
- Dashboard users → Supabase Auth (email/password)
- Bots → `x-bot-key: pa_live_<32hex>` header; lib/api-auth.ts hashes and validates against `bot_keys` table

**Sweep (lazy, no cron):** `lib/sweep.ts` runs `sweepTimeouts` + `sweepMissedRuns` on every Overview page load via `runSweep(supabase)` called in `app/(dashboard)/overview/page.tsx`. All pages use `export const dynamic = 'force-dynamic'`.

**Key generation:** `lib/bot-key.ts` — raw key `pa_live_<32hex>`, stored as SHA-256 hash. Raw key shown once in UI, never persisted.

**Data model (4 tables):**
- `bots` — bot registry
- `bot_keys` — hashed API credentials per bot
- `runs` — one row per execution; statuses: `started | success | failure | timeout | missed`
- `run_logs` — step-level timeline entries per run

**Theme:** `next-themes` with `attribute="class"`. Sidebar is always dark (`#0B1120`); content area switches light/dark. CSS variables in `app/globals.css` control card/text/border colors.

**Supabase clients:**
- Browser: `lib/supabase/client.ts` (anon key)
- Server components: `lib/supabase/server.ts` → `createClient()` (anon) or `createServiceClient()` (service role)
- API routes that need to bypass RLS use `createServiceClient()` or the inline pattern in `lib/api-auth.ts`
- Middleware: `lib/supabase/middleware.ts` refreshes session and redirects unauthenticated users

**Rate limiting:** Supabase `rate_limits` table (60 req/min per key prefix), enforced in `lib/rate-limit.ts`.

## Key Conventions

- Dashboard pages are Server Components fetching directly from Supabase; client interactivity uses `'use client'` child components
- API bot endpoints (`/api/v1/runs/*`) must not require a user session — only `x-bot-key`
- Bot status is always one of 5 states; sweeps insert synthetic `missed` runs and update `started` → `timeout`
- Copyright footer: © NuAIg LLC
