-- admin_policies.sql

-- Enable RLS on all tables (ensure it's on)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table buildings enable row level security;
alter table floors enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;

-- BUILDINGS / FLOORS / ROOMS
-- Drop existing policies to start fresh
drop policy if exists "Everyone can view buildings" on buildings;
drop policy if exists "Everyone can view floors" on floors;
drop policy if exists "Everyone can view rooms" on rooms;
drop policy if exists "Enable insert for authenticated users" on buildings;
drop policy if exists "Enable insert for authenticated users" on floors;
drop policy if exists "Enable insert for authenticated users" on rooms;

-- READ: Public/Authenticated read is fine for now
create policy "Everyone can view buildings" on buildings for select using (true);
create policy "Everyone can view floors" on floors for select using (true);
create policy "Everyone can view rooms" on rooms for select using (true);

-- PROFILES
-- Users can view their own profile
create policy "Users can view own profile" on profiles 
  for select 
  using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles" on profiles 
  for select 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Users can update their own profile
create policy "Users can update own profile" on profiles 
  for update 
  using (auth.uid() = id);

-- WRITE (Insert/Update/Delete): ADMIN ONLY
create policy "Admins can manage buildings" on buildings 
  for all 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage floors" on floors 
  for all 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage rooms" on rooms 
  for all 
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- BOOKINGS
drop policy if exists "Users can view all bookings" on bookings;
drop policy if exists "Users can create bookings" on bookings;
drop policy if exists "Admins can update bookings" on bookings;
drop policy if exists "Users can update own bookings" on bookings;

-- READ: Users can see all bookings (to check availability)
create policy "Users can view all bookings" on bookings for select using (true);

-- INSERT: Authenticated users can create bookings (own user_id)
create policy "Users can create bookings" on bookings 
  for insert 
  with check (auth.uid() = user_id);

-- UPDATE/DELETE: 
-- Admins can do anything
create policy "Admins can manage all bookings" on bookings 
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Users can only update their own PENDING bookings (e.g. cancel)
-- NOT approved ones, unless we want to allow cancellation of approved. 
-- For now, let's keep it simple: Users can update their own bookings.
create policy "Users can update own bookings" on bookings 
  for update 
  using (auth.uid() = user_id);
