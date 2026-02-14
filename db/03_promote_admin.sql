-- promote_admin.sql

-- Replace 'YOUR_EMAIL_HERE' with the actual email address
-- This must be run in the Supabase SQL Editor

update public.profiles
set role = 'admin'
where email = 'martin@definition.studio';

-- Check if it worked
select * from public.profiles where role = 'admin';
