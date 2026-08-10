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
5. `db/07_site_settings.sql`
6. `db/08_security_hardening.sql`
7. `db/09_lifecycle_management.sql`
8. `db/10_admin_editing_and_user_assignment.sql`
9. `db/11_user_lifecycle_and_booking_responsibility.sql`
10. `db/12_company_editing.sql`

`db/05_fix_profile_policies.sql` and `db/06_fix_recursion.sql` are retained for
older installations. `db/08_security_hardening.sql` supersedes their policies.
Never run the deprecated `db/rls_fix.sql`.

## Commands

- `npm run dev` start dev server
- `npm run lint` run ESLint
- `npm run typecheck` run TypeScript checks
- `npm run check` run lint + typecheck + security boundary checks
- `npm run build` production build

## Admin Routes

- `/admin`
- `/admin/buildings`
- `/admin/floors`
- `/admin/rooms`
- `/admin/users`

## Codex / Agentic Notes

- Repository-level agent guidance lives in `AGENTS.md`.
- Use `npm run check` before opening PRs.
- Keep SQL policy changes in `db/` and document migration order in commits.
