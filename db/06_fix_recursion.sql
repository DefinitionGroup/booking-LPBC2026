-- Fix Infinite Recursion in Profiles Policy

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to run with the privileges of the creator,
-- bypassing the RLS recursion loop on the 'profiles' table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- 2. Drop the recursive policy
drop policy if exists "Admins can view all profiles" on profiles;

-- 3. Re-create the policy using the function
create policy "Admins can view all profiles" on profiles 
  for select 
  using ( is_admin() );
