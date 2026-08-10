-- Phase 1 security hardening.
-- Apply after db/02_admin_policies.sql and db/06_fix_recursion.sql.
-- This migration is idempotent and replaces the legacy permissive policies.

begin;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

-- Avoid recursive profile-policy checks while failing closed for missing profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select profile.role = 'admin'::public.user_role
      from public.profiles as profile
      where profile.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- A user may edit only their display name. RLS restricts the row; column grants
-- prevent role, company, email, and ownership escalation within that row.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- Remove the legacy development policies if they were ever applied.
drop policy if exists "Enable insert for authenticated users" on public.companies;
drop policy if exists "Enable insert for authenticated users" on public.buildings;
drop policy if exists "Enable insert for authenticated users" on public.floors;
drop policy if exists "Enable insert for authenticated users" on public.rooms;

-- Full booking details are private to the owner and administrators.
drop policy if exists "Users can view all bookings" on public.bookings;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Admins can view all bookings" on public.bookings;
drop policy if exists "Users can create bookings" on public.bookings;
drop policy if exists "Users can create pending bookings" on public.bookings;
drop policy if exists "Admins can update bookings" on public.bookings;
drop policy if exists "Admins can manage all bookings" on public.bookings;
drop policy if exists "Users can update own bookings" on public.bookings;

create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "Users can create pending bookings"
  on public.bookings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'::public.booking_status
    and parent_booking_id is null
  );

create policy "Admins can manage all bookings"
  on public.bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Availability is intentionally a separate, minimal read model. It exposes no
-- title, description, user, company, recurrence, or internal booking identifier.
create or replace function public.get_booking_availability(
  p_range_start timestamp with time zone,
  p_range_end timestamp with time zone,
  p_room_id uuid default null
)
returns table (
  room_id uuid,
  room_name text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_range_end <= p_range_start
     or p_range_end > p_range_start + interval '370 days' then
    raise exception 'Invalid availability range' using errcode = '22023';
  end if;

  return query
    select
      booking.room_id,
      room.name,
      booking.start_time,
      booking.end_time
    from public.bookings as booking
    join public.rooms as room on room.id = booking.room_id
    where booking.status = 'approved'::public.booking_status
      and booking.start_time < p_range_end
      and booking.end_time > p_range_start
      and (p_room_id is null or booking.room_id = p_room_id)
    order by booking.start_time;
end;
$$;

revoke all on function public.get_booking_availability(timestamp with time zone, timestamp with time zone, uuid) from public;
revoke all on function public.get_booking_availability(timestamp with time zone, timestamp with time zone, uuid) from anon;
grant execute on function public.get_booking_availability(timestamp with time zone, timestamp with time zone, uuid) to authenticated;
grant execute on function public.get_booking_availability(timestamp with time zone, timestamp with time zone, uuid) to service_role;

commit;
