-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

-- Companies (Tenants)
create type company_status as enum ('active', 'inactive');

create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text, -- for auto-assigning users based on email
  status company_status default 'active'::company_status not null,
  deactivated_at timestamp with time zone,
  deactivated_by uuid references auth.users(id) on delete set null,
  deactivation_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles (Users) - extensions of auth.users
create type user_role as enum ('admin', 'user');
create type profile_status as enum ('active', 'inactive', 'anonymized');

create table profiles (
  id uuid primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  role user_role default 'user'::user_role,
  company_id uuid references companies(id),
  status profile_status default 'active'::profile_status not null,
  deactivated_at timestamp with time zone,
  deactivated_by uuid references profiles(id) on delete restrict,
  deactivation_reason text,
  anonymized_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Buildings
create table buildings (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Floors
create table floors (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references buildings(id) on delete cascade not null,
  name text not null, -- e.g., "Level 1", "Ground Floor"
  level_number integer not null, -- for sorting
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rooms
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  floor_id uuid references floors(id) on delete cascade not null,
  name text not null,
  capacity integer default 1,
  amenities text[], -- e.g., ["TV", "Whiteboard"]
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings
create type booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete restrict not null,
  responsible_profile_id uuid references profiles(id) on delete restrict not null,
  company_id uuid references companies(id) on delete restrict not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status booking_status default 'pending'::booking_status,
  recurrence_rule text, -- RRule string for recurring meetings
  parent_booking_id uuid references bookings(id), -- for instances of recurring meetings
  decided_at timestamp with time zone,
  decided_by uuid references profiles(id) on delete restrict,
  cancelled_at timestamp with time zone,
  cancelled_by uuid references profiles(id) on delete restrict,
  cancellation_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint bookings_valid_time check (start_time < end_time),
  constraint bookings_no_approved_overlap exclude using gist (
    room_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status = 'approved'::booking_status)
);

create table audit_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('booking', 'company', 'profile')),
  entity_id uuid,
  action text not null,
  actor_id uuid references profiles(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table buildings enable row level security;
alter table floors enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;
alter table audit_events enable row level security;

-- Policies (Simplified for initial setup - refine as needed)
-- Everyone can read buildings, floors, rooms
create policy "Everyone can view buildings" on buildings for select using (true);
create policy "Everyone can view floors" on floors for select using (true);
create policy "Everyone can view rooms" on rooms for select using (true);

-- Bookings: Users can see their own, Admins can see all
create policy "Users can view all bookings" on bookings for select using (true); -- Usually acceptable to see *that* a room is booked
create policy "Users can create bookings" on bookings for insert with check (auth.uid() = user_id);
create policy "Admins can update bookings" on bookings for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
-- Users can cancel their own pending/approved bookings
create policy "Users can update own bookings" on bookings for update using (auth.uid() = user_id);
