# AGENTS.md

Project-specific guidance for coding agents working in `phantom-equinox`.

## Objective

Build and maintain a reliable room-booking platform with clear admin workflows, strong Supabase RLS posture, and predictable Next.js App Router behavior.

## Architecture Map

- `app/` route segments and layouts (server-first)
- `components/` UI and client interactions
- `actions/` server actions for writes
- `lib/supabase/` SSR/browser auth clients
- `db/` schema and SQL policy scripts
- `types/database.ts` app-side DB typings

## Critical Flows

1. Auth/session refresh in `middleware.ts` + `lib/supabase/middleware.ts`
2. Booking lifecycle in `actions/bookings.ts`
3. Admin management under `app/admin/*`
4. RLS and policy behavior from `db/*.sql`

## Working Rules

- Keep pages/layouts server components by default; move only interactive leaf UI to client components.
- Do not bypass RLS with service-role clients unless explicitly required and documented.
- Validate all mutation inputs on server boundaries with zod.
- Keep schema changes and code changes synchronized in one PR.
- Avoid duplicate shells/layout wrappers across route groups.

## Definition Of Done (per change)

1. `npm run lint` passes for touched scope (or issues explicitly called out).
2. `npm run typecheck` passes (or issues explicitly called out).
3. UI change is responsive on mobile and desktop.
4. Auth/role checks are enforced server-side.
5. Any SQL or policy change has migration note in commit/PR description.

## Admin UI Standards

- One shell per route tree (`app/admin/layout.tsx` owns admin chrome).
- Tables must be wrapped with horizontal overflow containers.
- Primary admin actions should remain visible on mobile.
- Active navigation state must be visible.

## Safety Checks Before Editing

- Inspect `git status --short` first.
- Do not discard unrelated local changes.
- If a change touches auth, booking status, or RLS, flag it as high risk and verify paths manually.
