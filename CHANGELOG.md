# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Fixed

- Display simultaneous room bookings in separate schedule columns instead of overlapping them.
- Allow lifecycle transitions on legacy bookings without a company assignment while continuing to require company attribution for new bookings.

### Upgrade Notes

- Apply `db/13_legacy_company_safe_booking_updates.sql` after migration 12 before deploying this release.

## [0.2.0] - 2026-08-10

### Added

- Complete admin booking management with cancellation and guarded permanent deletion.
- Company editing, deactivation, reactivation, and confirmed deletion workflows.
- User editing, deactivation, reactivation, anonymization, and booking-responsibility transfer.
- Editable building details and floor names.
- Audited lifecycle operations and server-side security boundary checks.

### Changed

- Booking history now keeps an immutable creator and company attribution while allowing responsibility for upcoming bookings to be transferred.
- Authentication and password-recovery handling now use the Next.js proxy flow with inactive-user enforcement.
- Admin mutations use validated server boundaries and strengthened Supabase RLS/RPC authorization.

### Removed

- Development seed actions and their admin UI entry point.

### Upgrade Notes

- Apply database migrations `08_security_hardening.sql` through `12_company_editing.sql` in order before deploying the application.
- Reconcile legacy bookings without a company assignment before enforcing a strict company requirement at the database level.
