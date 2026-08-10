-- Booking and company lifecycle management.
-- Apply after db/08_security_hardening.sql.

begin;

create extension if not exists btree_gist;

do $$
begin
  create type public.company_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end;
$$;

alter table public.companies
  add column if not exists status public.company_status not null default 'active',
  add column if not exists deactivated_at timestamp with time zone,
  add column if not exists deactivated_by uuid references auth.users(id) on delete set null,
  add column if not exists deactivation_reason text;

alter table public.bookings
  add column if not exists company_id uuid,
  add column if not exists decided_at timestamp with time zone,
  add column if not exists decided_by uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at timestamp with time zone,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_reason text;

update public.bookings as booking
set company_id = profile.company_id
from public.profiles as profile
where booking.user_id = profile.id
  and booking.company_id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_company_id_fkey'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_company_id_fkey
      foreign key (company_id) references public.companies(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_valid_time'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_valid_time check (start_time < end_time) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_no_approved_overlap'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_no_approved_overlap
      exclude using gist (
        room_id with =,
        tstzrange(start_time, end_time, '[)') with &&
      )
      where (status = 'approved'::public.booking_status);
  end if;
end;
$$;

create index if not exists bookings_company_id_idx on public.bookings(company_id);
create index if not exists bookings_user_start_idx on public.bookings(user_id, start_time desc);
create index if not exists bookings_room_status_time_idx on public.bookings(room_id, status, start_time, end_time);
create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists companies_status_idx on public.companies(status);

create table if not exists public.audit_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('booking', 'company')),
  entity_id uuid,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists audit_events_entity_idx
  on public.audit_events(entity_type, entity_id, created_at desc);

alter table public.audit_events enable row level security;
revoke insert, update, delete on table public.audit_events from anon;
revoke insert, update, delete on table public.audit_events from authenticated;

drop policy if exists "Admins can view audit events" on public.audit_events;
create policy "Admins can view audit events"
  on public.audit_events for select
  to authenticated
  using (public.is_admin());

create or replace function public.current_company_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select profile.company_id
  from public.profiles as profile
  where profile.id = auth.uid();
$$;

revoke all on function public.current_company_id() from public;
revoke all on function public.current_company_id() from anon;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_company_id() to service_role;

create or replace function public.get_company_admin_summary()
returns table (
  company_id uuid,
  company_name text,
  company_domain text,
  company_status public.company_status,
  deactivation_reason text,
  created_at timestamp with time zone,
  user_count bigint,
  booking_count bigint
)
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
    select
      company.id,
      company.name,
      company.domain,
      company.status,
      company.deactivation_reason,
      company.created_at,
      (select count(*) from public.profiles as profile where profile.company_id = company.id),
      (select count(*) from public.bookings as booking where booking.company_id = company.id)
    from public.companies as company
    order by company.name;
end;
$$;

drop policy if exists "Users can view own company" on public.companies;
drop policy if exists "Admins can view all companies" on public.companies;
drop policy if exists "Admins can create companies" on public.companies;
drop policy if exists "Admins can update companies" on public.companies;
drop policy if exists "Admins can delete companies" on public.companies;

create policy "Users can view own company"
  on public.companies for select
  to authenticated
  using (id = public.current_company_id());

create policy "Admins can view all companies"
  on public.companies for select
  to authenticated
  using (public.is_admin());

create policy "Admins can create companies"
  on public.companies for insert
  to authenticated
  with check (public.is_admin());

-- Company status and deletion are intentionally available only through RPCs.
revoke update on table public.companies from authenticated;
revoke delete on table public.companies from authenticated;

drop policy if exists "Users can create pending bookings" on public.bookings;
create policy "Users can create pending bookings"
  on public.bookings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'::public.booking_status
    and parent_booking_id is null
    and company_id = public.current_company_id()
    and exists (
      select 1
      from public.companies as company
      where company.id = company_id
        and company.status = 'active'::public.company_status
    )
  );

drop policy if exists "Admins can manage all bookings" on public.bookings;
revoke update on table public.bookings from authenticated;
revoke delete on table public.bookings from authenticated;

create or replace function public.transition_booking(
  p_booking_id uuid,
  p_target_status public.booking_status,
  p_reason text default null
)
returns table (
  booking_id uuid,
  previous_status public.booking_status,
  current_status public.booking_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_record public.bookings%rowtype;
  actor_is_admin boolean := public.is_admin();
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select booking.*
  into booking_record
  from public.bookings as booking
  where booking.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if p_target_status in ('approved'::public.booking_status, 'rejected'::public.booking_status) then
    if not actor_is_admin then
      raise exception 'Administrator access required' using errcode = '42501';
    end if;
    if booking_record.status <> 'pending'::public.booking_status then
      raise exception 'Only pending bookings can be approved or rejected' using errcode = '22023';
    end if;
  elsif p_target_status = 'cancelled'::public.booking_status then
    if not actor_is_admin and booking_record.user_id <> auth.uid() then
      raise exception 'Cannot cancel another user''s booking' using errcode = '42501';
    end if;
    if booking_record.status not in ('pending'::public.booking_status, 'approved'::public.booking_status) then
      raise exception 'Only pending or approved bookings can be cancelled' using errcode = '22023';
    end if;
    if nullif(trim(p_reason), '') is null then
      raise exception 'A cancellation reason is required' using errcode = '22023';
    end if;
  else
    raise exception 'Unsupported booking transition' using errcode = '22023';
  end if;

  update public.bookings as booking
  set
    status = p_target_status,
    decided_at = case
      when p_target_status in ('approved'::public.booking_status, 'rejected'::public.booking_status)
        then timezone('utc'::text, now())
      else booking.decided_at
    end,
    decided_by = case
      when p_target_status in ('approved'::public.booking_status, 'rejected'::public.booking_status)
        then auth.uid()
      else booking.decided_by
    end,
    cancelled_at = case
      when p_target_status = 'cancelled'::public.booking_status
        then timezone('utc'::text, now())
      else booking.cancelled_at
    end,
    cancelled_by = case
      when p_target_status = 'cancelled'::public.booking_status
        then auth.uid()
      else booking.cancelled_by
    end,
    cancellation_reason = case
      when p_target_status = 'cancelled'::public.booking_status then trim(p_reason)
      else booking.cancellation_reason
    end,
    updated_at = timezone('utc'::text, now())
  where booking.id = p_booking_id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'booking',
    p_booking_id,
    'status_changed',
    auth.uid(),
    jsonb_build_object(
      'from_status', booking_record.status,
      'to_status', p_target_status,
      'reason', nullif(trim(p_reason), '')
    )
  );

  return query
    select p_booking_id, booking_record.status, p_target_status;
end;
$$;

create or replace function public.purge_booking(
  p_booking_id uuid,
  p_confirmation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_record public.bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select booking.*
  into booking_record
  from public.bookings as booking
  where booking.id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;
  if booking_record.status not in ('rejected'::public.booking_status, 'cancelled'::public.booking_status) then
    raise exception 'Cancel or reject the booking before purging it' using errcode = '22023';
  end if;
  if p_confirmation <> booking_record.title then
    raise exception 'Booking confirmation does not match' using errcode = '22023';
  end if;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'booking',
    booking_record.id,
    'purged',
    auth.uid(),
    jsonb_build_object(
      'status', booking_record.status,
      'room_id', booking_record.room_id,
      'company_id', booking_record.company_id
    )
  );

  update public.bookings set parent_booking_id = null where parent_booking_id = p_booking_id;
  delete from public.bookings where id = p_booking_id;
end;
$$;

create or replace function public.set_company_status(
  p_company_id uuid,
  p_status public.company_status,
  p_reason text default null
)
returns public.company_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select company.*
  into company_record
  from public.companies as company
  where company.id = p_company_id
  for update;

  if not found then
    raise exception 'Company not found' using errcode = 'P0002';
  end if;
  if company_record.status = p_status then
    return company_record.status;
  end if;
  if p_status = 'inactive'::public.company_status and nullif(trim(p_reason), '') is null then
    raise exception 'A deactivation reason is required' using errcode = '22023';
  end if;

  update public.companies as company
  set
    status = p_status,
    deactivated_at = case when p_status = 'inactive'::public.company_status then timezone('utc'::text, now()) else null end,
    deactivated_by = case when p_status = 'inactive'::public.company_status then auth.uid() else null end,
    deactivation_reason = case when p_status = 'inactive'::public.company_status then trim(p_reason) else null end
  where company.id = p_company_id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'company',
    p_company_id,
    case when p_status = 'inactive'::public.company_status then 'deactivated' else 'activated' end,
    auth.uid(),
    jsonb_build_object('from_status', company_record.status, 'to_status', p_status, 'reason', nullif(trim(p_reason), ''))
  );

  return p_status;
end;
$$;

create or replace function public.purge_company(
  p_company_id uuid,
  p_confirmation text
)
returns table (
  deleted_bookings bigint,
  detached_users bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
  booking_count bigint;
  user_count bigint;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select company.*
  into company_record
  from public.companies as company
  where company.id = p_company_id
  for update;

  if not found then
    raise exception 'Company not found' using errcode = 'P0002';
  end if;
  if company_record.status <> 'inactive'::public.company_status then
    raise exception 'Deactivate the company before purging it' using errcode = '22023';
  end if;
  if p_confirmation <> company_record.name then
    raise exception 'Company confirmation does not match' using errcode = '22023';
  end if;

  select count(*) into booking_count from public.bookings where company_id = p_company_id;
  select count(*) into user_count from public.profiles where company_id = p_company_id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'company',
    p_company_id,
    'purged',
    auth.uid(),
    jsonb_build_object('deleted_bookings', booking_count, 'detached_users', user_count)
  );

  delete from public.bookings where company_id = p_company_id;
  update public.profiles
  set company_id = null, updated_at = timezone('utc'::text, now())
  where company_id = p_company_id;
  delete from public.companies where id = p_company_id;

  return query select booking_count, user_count;
end;
$$;

revoke all on function public.transition_booking(uuid, public.booking_status, text) from public;
revoke all on function public.transition_booking(uuid, public.booking_status, text) from anon;
grant execute on function public.transition_booking(uuid, public.booking_status, text) to authenticated;
grant execute on function public.transition_booking(uuid, public.booking_status, text) to service_role;

revoke all on function public.purge_booking(uuid, text) from public;
revoke all on function public.purge_booking(uuid, text) from anon;
grant execute on function public.purge_booking(uuid, text) to authenticated;
grant execute on function public.purge_booking(uuid, text) to service_role;

revoke all on function public.set_company_status(uuid, public.company_status, text) from public;
revoke all on function public.set_company_status(uuid, public.company_status, text) from anon;
grant execute on function public.set_company_status(uuid, public.company_status, text) to authenticated;
grant execute on function public.set_company_status(uuid, public.company_status, text) to service_role;

revoke all on function public.purge_company(uuid, text) from public;
revoke all on function public.purge_company(uuid, text) from anon;
grant execute on function public.purge_company(uuid, text) to authenticated;
grant execute on function public.purge_company(uuid, text) to service_role;

revoke all on function public.get_company_admin_summary() from public;
revoke all on function public.get_company_admin_summary() from anon;
grant execute on function public.get_company_admin_summary() to authenticated;
grant execute on function public.get_company_admin_summary() to service_role;

commit;
