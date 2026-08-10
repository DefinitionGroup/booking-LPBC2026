import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const migration = read("db/08_security_hardening.sql");
assert.match(migration, /grant update \(full_name\).*profiles to authenticated/i);
assert.doesNotMatch(migration, /grant update \([^)]*role[^)]*\).*profiles to authenticated/i);
assert.match(migration, /auth\.uid\(\) = user_id[\s\S]*status = 'pending'/i);
assert.match(migration, /create or replace function public\.get_booking_availability/i);
assert.doesNotMatch(
  migration,
  /returns table[\s\S]{0,300}\b(title|description|user_id|company_id|recurrence_rule)\b/i
);

for (const path of ["app/rooms/page.tsx", "app/schedule/page.tsx"]) {
  assert.doesNotMatch(read(path), /\.from\(["']bookings["']\)/, `${path} must use the availability RPC`);
}

const dashboard = read("app/page.tsx");
assert.match(dashboard, /getBookingAvailability\([\s\S]*monthStart\.toISOString\(\)/);
assert.doesNotMatch(dashboard, /select\(["']id, title, start_time, end_time, status, rooms\(name\)["']\)/);

assert.equal(existsSync(resolve(root, "actions/seed.ts")), false);
assert.equal(existsSync(resolve(root, "components/admin/seed-button.tsx")), false);
assert.doesNotMatch(read("db/rls_fix.sql"), /create policy/i);

const lifecycleMigration = read("db/09_lifecycle_management.sql");
assert.match(lifecycleMigration, /create or replace function public\.transition_booking/i);
assert.match(lifecycleMigration, /create or replace function public\.purge_company/i);
assert.match(lifecycleMigration, /create or replace function public\.get_company_admin_summary/i);
assert.match(lifecycleMigration, /bookings_no_approved_overlap/i);
assert.match(lifecycleMigration, /revoke update on table public\.bookings from authenticated/i);
assert.match(lifecycleMigration, /revoke insert, update, delete on table public\.audit_events from authenticated/i);
assert.match(lifecycleMigration, /company_record\.status <> 'inactive'/i);
assert.match(lifecycleMigration, /p_confirmation <> company_record\.name/i);

const assignmentMigration = read("db/10_admin_editing_and_user_assignment.sql");
assert.match(assignmentMigration, /create or replace function public\.assign_user_company/i);
assert.match(assignmentMigration, /if not public\.is_admin\(\)/i);
assert.match(assignmentMigration, /status = 'active'/i);
assert.match(assignmentMigration, /for update/i);
assert.match(assignmentMigration, /'company_assignment_changed'/i);
assert.match(assignmentMigration, /revoke all on function public\.assign_user_company\(uuid, uuid\) from public/i);
assert.doesNotMatch(assignmentMigration, /update public\.bookings/i);

for (const path of [
  "components/admin/create-building-button.tsx",
  "components/admin/create-floor-button.tsx",
]) {
  assert.doesNotMatch(read(path), /lib\/supabase\/client/, `${path} must use an admin-checked server action`);
}

const userLifecycleMigration = read("db/11_user_lifecycle_and_booking_responsibility.sql");
assert.match(userLifecycleMigration, /profiles_auth_user_id_fkey[\s\S]*on delete set null/i);
assert.match(userLifecycleMigration, /bookings_user_id_fkey[\s\S]*on delete restrict/i);
assert.match(userLifecycleMigration, /responsible_profile_id/i);
assert.match(userLifecycleMigration, /create or replace function public\.update_user_admin/i);
assert.match(userLifecycleMigration, /create or replace function public\.set_user_status/i);
assert.match(userLifecycleMigration, /create or replace function public\.anonymize_user/i);
assert.match(userLifecycleMigration, /At least one active administrator is required/i);
assert.match(userLifecycleMigration, /responsibility_transferred/i);
assert.match(userLifecycleMigration, /drop function if exists public\.assign_user_company/i);
assert.doesNotMatch(userLifecycleMigration, /delete from public\.bookings/i);
assert.match(read("actions/bookings.ts"), /responsible_profile_id: profile\.id/i);

const companyEditingMigration = read("db/12_company_editing.sql");
assert.match(companyEditingMigration, /create or replace function public\.update_company_admin/i);
assert.match(companyEditingMigration, /if not public\.is_admin\(\)/i);
assert.match(companyEditingMigration, /'company_updated'/i);
assert.match(companyEditingMigration, /for update/i);
assert.match(companyEditingMigration, /revoke all on function public\.update_company_admin/i);

for (const path of [
  "app/api/upload/route.ts",
  "app/api/upload/background/route.ts",
]) {
  const uploadRoute = read(path);
  assert.match(uploadRoute, /handleAdminImageUpload/);
  assert.doesNotMatch(uploadRoute, /fs\/promises|writeFile|mkdir/);
}

const blobStorage = read("lib/uploads/blob-storage.ts");
assert.match(blobStorage, /supabase\.auth\.getUser\(\)/);
assert.match(blobStorage, /profile\.role !== "admin"/);
assert.match(blobStorage, /profile\.status !== "active"/);
assert.match(blobStorage, /handleUpload\(/);
assert.match(blobStorage, /allowedContentTypes/);
assert.match(blobStorage, /maximumSizeInBytes/);
assert.match(blobStorage, /addRandomSuffix: true/);
assert.doesNotMatch(blobStorage, /service[_-]?role/i);

console.log("Security boundary checks passed.");
