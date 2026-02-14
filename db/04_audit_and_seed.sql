-- 04_audit_and_seed.sql

-- 1. CLEANUP (Optional - remove if you want to keep existing data)
-- truncating cascades to all dependent tables
truncate table companies cascade; 
-- profiles are linked to auth.users, so we can't easily truncate them without deleting users.
-- We will just ensure a company exists.

-- 2. SEED DATA
do $$
declare
  company_id uuid;
  building_id uuid;
  floor1_id uuid;
  floor2_id uuid;
  floor3_id uuid;
begin

  -- A. Ensure Company Exists
  insert into companies (name, domain)
  values ('Phantom Corp', 'phantom.com')
  returning id into company_id;

  -- B. Create 1 Building
  insert into buildings (name, address)
  values ('Main HQ', '101 Cyber Avenue')
  returning id into building_id;

  -- C. Create 3 Floors
  insert into floors (name, level_number, building_id) values ('Ground Floor', 0, building_id) returning id into floor1_id;
  insert into floors (name, level_number, building_id) values ('First Floor', 1, building_id) returning id into floor2_id;
  insert into floors (name, level_number, building_id) values ('Second Floor', 2, building_id) returning id into floor3_id;

  -- D. Create 7 Rooms (Distributed)
  -- Ground Floor (3 Large rooms)
  insert into rooms (name, capacity, floor_id, amenities) values 
    ('The Auditorium', 50, floor1_id, ARRAY['Projector', 'Sound System', 'Stage']),
    ('Lobby Meeting', 8, floor1_id, ARRAY['TV', 'Lounge Seating']),
    ('Focus Room A', 2, floor1_id, ARRAY['Whiteboard']);

  -- First Floor (2 Medium rooms)
  insert into rooms (name, capacity, floor_id, amenities) values 
    ('War Room', 12, floor2_id, ARRAY['Dual Monitors', 'Whiteboard Wall', 'Conference Phone']),
    ('Creative Lab', 6, floor2_id, ARRAY['Bean Bags', 'Smart Board']);

  -- Second Floor (2 Exec rooms)
  insert into rooms (name, capacity, floor_id, amenities) values 
    ('Boardroom', 20, floor3_id, ARRAY['Video Conference', 'Catering Station', 'Privacy Glass']),
    ('Executive Suite', 4, floor3_id, ARRAY['Ensuite', 'Video Conference']);

  -- E. NO Bookings (Checked)
  delete from bookings;

end $$;

-- 3. AUDIT & FIX PROFILES
-- Check for users who have no profile and create one for them
-- This fixes the issue where you signed up but have 'no profile'
insert into public.profiles (id, email, role, full_name)
select 
  id, 
  email, 
  'user', -- Default role
  raw_user_meta_data->>'full_name'
from auth.users
where id not in (select id from public.profiles);

-- 4. PROMOTE SPECIFIC USER (Just in case)
update public.profiles
set role = 'admin'
where email = 'martin@definition.studio';
