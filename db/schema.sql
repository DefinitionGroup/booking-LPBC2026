-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies (Tenants)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text, -- for auto-assigning users based on email
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles (Users) - extensions of auth.users
create type user_role as enum ('admin', 'user');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role default 'user'::user_role,
  company_id uuid references companies(id),
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
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status booking_status default 'pending'::booking_status,
  recurrence_rule text, -- RRule string for recurring meetings
  parent_booking_id uuid references bookings(id), -- for instances of recurring meetings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table buildings enable row level security;
alter table floors enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;

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
