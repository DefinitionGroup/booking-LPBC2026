-- Fix Missing Profile Policies
-- Run this in Supabase SQL Editor to allow the app to read your Admin Role.

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
