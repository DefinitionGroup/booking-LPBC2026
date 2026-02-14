# Phantom Equinox

Meeting-room booking app built with Next.js App Router + Supabase.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase Auth/Postgres (RLS enabled)
- Server Actions for booking/admin mutations

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Run app

```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Database Setup (Supabase SQL Editor)

Run scripts in this order:

1. `db/schema.sql`
2. `db/01_auth_triggers.sql`
3. `db/02_admin_policies.sql`
4. `db/03_promote_admin.sql` (replace email first)
5. Optional local/dev fixes as needed: `db/05_fix_profile_policies.sql`, `db/06_fix_recursion.sql`, `db/rls_fix.sql`

## Commands

- `npm run dev` start dev server
- `npm run lint` run ESLint
- `npm run typecheck` run TypeScript checks
- `npm run check` run lint + typecheck
- `npm run build` production build

## Admin Routes

- `/admin`
- `/admin/buildings`
- `/admin/floors`
- `/admin/rooms`

## Codex / Agentic Notes

- Repository-level agent guidance lives in `AGENTS.md`.
- Use `npm run check` before opening PRs.
- Keep SQL policy changes in `db/` and document migration order in commits.
