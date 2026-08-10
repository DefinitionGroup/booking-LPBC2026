-- Durable user profiles, user lifecycle, and transferable booking responsibility.
-- Apply after db/10_admin_editing_and_user_assignment.sql.

begin;

drop function if exists public.assign_user_company(uuid, uuid);

do $$
begin
  create type public.profile_status as enum ('active', 'inactive', 'anonymized');
exception
  when duplicate_object then null;
end;
$$;

alter table public.profiles
  add column if not exists auth_user_id uuid,
  add column if not exists status public.profile_status not null default 'active',
  add column if not exists deactivated_at timestamp with time zone,
  add column if not exists deactivated_by uuid,
  add column if not exists deactivation_reason text,
  add column if not exists anonymized_at timestamp with time zone;

update public.profiles as profile
set auth_user_id = profile.id
where profile.auth_user_id is null
  and exists (select 1 from auth.users as auth_user where auth_user.id = profile.id);

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles drop constraint if exists profiles_auth_user_id_fkey;
alter table public.profiles
  add constraint profiles_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete set null;

create unique index if not exists profiles_auth_user_id_key
  on public.profiles(auth_user_id)
  where auth_user_id is not null;

alter table public.bookings
  add column if not exists responsible_profile_id uuid;

update public.bookings
set responsible_profile_id = user_id
where responsible_profile_id is null;

alter table public.bookings
  alter column responsible_profile_id set not null;

alter table public.bookings drop constraint if exists bookings_user_id_fkey;
alter table public.bookings drop constraint if exists bookings_responsible_profile_id_fkey;
alter table public.bookings
  add constraint bookings_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete restrict,
  add constraint bookings_responsible_profile_id_fkey
  foreign key (responsible_profile_id) references public.profiles(id) on delete restrict;

comment on column public.bookings.user_id is
  'Immutable profile that originally created the booking.';
comment on column public.bookings.responsible_profile_id is
  'Current profile responsible for future booking actions.';
comment on column public.bookings.company_id is
  'Immutable company attribution captured when the booking was created.';

alter table public.bookings
  drop constraint if exists bookings_company_required;
alter table public.bookings
  add constraint bookings_company_required
  check (company_id is not null) not valid;

do $$
begin
  if not exists (select 1 from public.bookings where company_id is null) then
    alter table public.bookings validate constraint bookings_company_required;
    alter table public.bookings alter column company_id set not null;
  end if;
end;
$$;

create index if not exists bookings_responsible_start_idx
  on public.bookings(responsible_profile_id, start_time desc);
create index if not exists profiles_status_idx on public.profiles(status);

alter table public.companies drop constraint if exists companies_deactivated_by_fkey;
alter table public.companies
  add constraint companies_deactivated_by_fkey
  foreign key (deactivated_by) references public.profiles(id) on delete restrict;

alter table public.bookings drop constraint if exists bookings_decided_by_fkey;
alter table public.bookings drop constraint if exists bookings_cancelled_by_fkey;
alter table public.bookings
  add constraint bookings_decided_by_fkey
  foreign key (decided_by) references public.profiles(id) on delete restrict,
  add constraint bookings_cancelled_by_fkey
  foreign key (cancelled_by) references public.profiles(id) on delete restrict;

alter table public.audit_events drop constraint if exists audit_events_actor_id_fkey;
alter table public.audit_events
  add constraint audit_events_actor_id_fkey
  foreign key (actor_id) references public.profiles(id) on delete restrict;

alter table public.profiles drop constraint if exists profiles_deactivated_by_fkey;
alter table public.profiles
  add constraint profiles_deactivated_by_fkey
  foreign key (deactivated_by) references public.profiles(id) on delete restrict;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select profile.id
  from public.profiles as profile
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'::public.profile_status;
$$;

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
      where profile.auth_user_id = auth.uid()
        and profile.status = 'active'::public.profile_status
    ),
    false
  );
$$;

create or replace function public.current_company_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select profile.company_id
  from public.profiles as profile
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'::public.profile_status;
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.current_profile_id() from anon;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_id() to service_role;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid() and status = 'active'::public.profile_status)
  with check (auth_user_id = auth.uid() and status = 'active'::public.profile_status);

drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Admins can view all bookings" on public.bookings;
drop policy if exists "Users can create pending bookings" on public.bookings;

create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (
    user_id = public.current_profile_id()
    or responsible_profile_id = public.current_profile_id()
  );

create policy "Admins can view all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

create policy "Users can create pending bookings"
  on public.bookings for insert
  to authenticated
  with check (
    user_id = public.current_profile_id()
    and responsible_profile_id = public.current_profile_id()
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

create or replace function public.transfer_future_booking_responsibility(
  p_from_profile_id uuid,
  p_to_profile_id uuid,
  p_reason text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  replacement public.profiles%rowtype;
  transferred_count bigint;
begin
  select * into replacement
  from public.profiles
  where id = p_to_profile_id
    and status = 'active'::public.profile_status
  for update;

  if not found or replacement.id = p_from_profile_id then
    raise exception 'An active replacement user is required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.bookings as booking
    where booking.responsible_profile_id = p_from_profile_id
      and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
      and booking.end_time >= timezone('utc'::text, now())
      and booking.company_id is distinct from replacement.company_id
  ) then
    raise exception 'Replacement must belong to every affected booking company' using errcode = '22023';
  end if;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  select
    'booking',
    booking.id,
    'responsibility_transferred',
    public.current_profile_id(),
    jsonb_build_object(
      'from_profile_id', p_from_profile_id,
      'to_profile_id', p_to_profile_id,
      'reason', nullif(trim(p_reason), '')
    )
  from public.bookings as booking
  where booking.responsible_profile_id = p_from_profile_id
    and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
    and booking.end_time >= timezone('utc'::text, now());

  update public.bookings as booking
  set
    responsible_profile_id = p_to_profile_id,
    updated_at = timezone('utc'::text, now())
  where booking.responsible_profile_id = p_from_profile_id
    and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
    and booking.end_time >= timezone('utc'::text, now());

  get diagnostics transferred_count = row_count;
  return transferred_count;
end;
$$;

revoke all on function public.transfer_future_booking_responsibility(uuid, uuid, text) from public;
revoke all on function public.transfer_future_booking_responsibility(uuid, uuid, text) from anon;
revoke all on function public.transfer_future_booking_responsibility(uuid, uuid, text) from authenticated;

create or replace function public.get_user_admin_summary()
returns table (
  profile_id uuid,
  email text,
  full_name text,
  role public.user_role,
  company_id uuid,
  profile_status public.profile_status,
  deactivation_reason text,
  created_at timestamp with time zone,
  booking_count bigint,
  future_responsibility_count bigint,
  has_auth_account boolean
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
      profile.id,
      profile.email,
      profile.full_name,
      profile.role,
      profile.company_id,
      profile.status,
      profile.deactivation_reason,
      profile.created_at,
      (select count(*) from public.bookings as booking where booking.user_id = profile.id),
      (
        select count(*)
        from public.bookings as booking
        where booking.responsible_profile_id = profile.id
          and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
          and booking.end_time >= timezone('utc'::text, now())
      ),
      profile.auth_user_id is not null
    from public.profiles as profile
    order by profile.created_at desc;
end;
$$;

create or replace function public.update_user_admin(
  p_profile_id uuid,
  p_full_name text,
  p_email text,
  p_role public.user_role,
  p_company_id uuid,
  p_replacement_profile_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles%rowtype;
  transferred_count bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into target from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if target.status = 'anonymized'::public.profile_status then
    raise exception 'An anonymized profile cannot be edited' using errcode = '22023';
  end if;
  if nullif(trim(p_full_name), '') is null or nullif(trim(p_email), '') is null then
    raise exception 'Name and email are required' using errcode = '22023';
  end if;
  if p_company_id is not null and not exists (
    select 1 from public.companies
    where id = p_company_id and status = 'active'::public.company_status
  ) then
    raise exception 'An active company is required' using errcode = '22023';
  end if;
  if target.id = public.current_profile_id()
    and target.role = 'admin'::public.user_role
    and p_role <> 'admin'::public.user_role then
    raise exception 'You cannot demote your own administrator account' using errcode = '22023';
  end if;
  if target.role = 'admin'::public.user_role
    and p_role <> 'admin'::public.user_role
    and not exists (
      select 1 from public.profiles
      where id <> target.id
        and role = 'admin'::public.user_role
        and status = 'active'::public.profile_status
    ) then
    raise exception 'At least one active administrator is required' using errcode = '22023';
  end if;

  if target.company_id is distinct from p_company_id and exists (
    select 1 from public.bookings as booking
    where booking.responsible_profile_id = target.id
      and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
      and booking.end_time >= timezone('utc'::text, now())
  ) then
    if p_replacement_profile_id is null then
      raise exception 'Transfer future bookings before changing company' using errcode = '22023';
    end if;
    transferred_count := public.transfer_future_booking_responsibility(
      target.id,
      p_replacement_profile_id,
      'Company assignment changed'
    );
  end if;

  update public.profiles
  set
    full_name = trim(p_full_name),
    email = lower(trim(p_email)),
    role = p_role,
    company_id = p_company_id,
    updated_at = timezone('utc'::text, now())
  where id = target.id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'profile',
    target.id,
    'profile_updated',
    public.current_profile_id(),
    jsonb_build_object(
      'from_role', target.role,
      'to_role', p_role,
      'from_company_id', target.company_id,
      'to_company_id', p_company_id,
      'transferred_bookings', transferred_count
    )
  );

  return transferred_count;
end;
$$;

create or replace function public.set_user_status(
  p_profile_id uuid,
  p_status public.profile_status,
  p_reason text default null,
  p_replacement_profile_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles%rowtype;
  transferred_count bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status not in ('active'::public.profile_status, 'inactive'::public.profile_status) then
    raise exception 'Unsupported user status' using errcode = '22023';
  end if;

  select * into target from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if target.status = 'anonymized'::public.profile_status then
    raise exception 'An anonymized profile cannot be reactivated' using errcode = '22023';
  end if;
  if target.status = p_status then
    return 0;
  end if;
  if p_status = 'active'::public.profile_status and target.auth_user_id is null then
    raise exception 'A profile without a login account cannot be reactivated' using errcode = '22023';
  end if;

  if p_status = 'inactive'::public.profile_status then
    if target.id = public.current_profile_id() then
      raise exception 'You cannot deactivate your own account' using errcode = '22023';
    end if;
    if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) < 3 then
      raise exception 'A deactivation reason is required' using errcode = '22023';
    end if;
    if target.role = 'admin'::public.user_role and not exists (
      select 1 from public.profiles
      where id <> target.id
        and role = 'admin'::public.user_role
        and status = 'active'::public.profile_status
    ) then
      raise exception 'At least one active administrator is required' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.bookings as booking
      where booking.responsible_profile_id = target.id
        and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
        and booking.end_time >= timezone('utc'::text, now())
    ) then
      if p_replacement_profile_id is null then
        raise exception 'Transfer future bookings before deactivating this user' using errcode = '22023';
      end if;
      transferred_count := public.transfer_future_booking_responsibility(
        target.id,
        p_replacement_profile_id,
        trim(p_reason)
      );
    end if;
  end if;

  update public.profiles
  set
    status = p_status,
    deactivated_at = case when p_status = 'inactive'::public.profile_status then timezone('utc'::text, now()) else null end,
    deactivated_by = case when p_status = 'inactive'::public.profile_status then public.current_profile_id() else null end,
    deactivation_reason = case when p_status = 'inactive'::public.profile_status then trim(p_reason) else null end,
    updated_at = timezone('utc'::text, now())
  where id = target.id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'profile',
    target.id,
    case when p_status = 'inactive'::public.profile_status then 'deactivated' else 'reactivated' end,
    public.current_profile_id(),
    jsonb_build_object('reason', nullif(trim(p_reason), ''), 'transferred_bookings', transferred_count)
  );

  return transferred_count;
end;
$$;

create or replace function public.anonymize_user(
  p_profile_id uuid,
  p_confirmation text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into target from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if target.id = public.current_profile_id() then
    raise exception 'You cannot anonymize your own account' using errcode = '22023';
  end if;
  if target.status = 'anonymized'::public.profile_status then
    return target.auth_user_id;
  end if;
  if target.status <> 'inactive'::public.profile_status then
    raise exception 'Deactivate the user before anonymizing' using errcode = '22023';
  end if;
  if p_confirmation <> target.email then
    raise exception 'User confirmation does not match' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.bookings as booking
    where booking.responsible_profile_id = target.id
      and booking.status in ('pending'::public.booking_status, 'approved'::public.booking_status)
      and booking.end_time >= timezone('utc'::text, now())
  ) then
    raise exception 'Transfer future bookings before anonymizing' using errcode = '22023';
  end if;

  update public.profiles
  set
    email = 'deleted+' || replace(target.id::text, '-', '') || '@invalid.local',
    full_name = 'Former user',
    role = 'user'::public.user_role,
    company_id = null,
    status = 'anonymized'::public.profile_status,
    deactivation_reason = null,
    anonymized_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  where id = target.id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'profile',
    target.id,
    'anonymized',
    public.current_profile_id(),
    jsonb_build_object(
      'former_company_id', target.company_id,
      'booking_count', (select count(*) from public.bookings where user_id = target.id)
    )
  );

  return target.auth_user_id;
end;
$$;

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
  actor_profile_id uuid := public.current_profile_id();
  actor_is_admin boolean := public.is_admin();
begin
  if actor_profile_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select booking.* into booking_record
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
    if not actor_is_admin and booking_record.responsible_profile_id <> actor_profile_id then
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
    decided_at = case when p_target_status in ('approved'::public.booking_status, 'rejected'::public.booking_status) then timezone('utc'::text, now()) else booking.decided_at end,
    decided_by = case when p_target_status in ('approved'::public.booking_status, 'rejected'::public.booking_status) then actor_profile_id else booking.decided_by end,
    cancelled_at = case when p_target_status = 'cancelled'::public.booking_status then timezone('utc'::text, now()) else booking.cancelled_at end,
    cancelled_by = case when p_target_status = 'cancelled'::public.booking_status then actor_profile_id else booking.cancelled_by end,
    cancellation_reason = case when p_target_status = 'cancelled'::public.booking_status then trim(p_reason) else booking.cancellation_reason end,
    updated_at = timezone('utc'::text, now())
  where booking.id = p_booking_id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'booking',
    p_booking_id,
    'status_changed',
    actor_profile_id,
    jsonb_build_object('from_status', booking_record.status, 'to_status', p_target_status, 'reason', nullif(trim(p_reason), ''))
  );

  return query select p_booking_id, booking_record.status, p_target_status;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, auth_user_id, email, full_name, role, status)
  values (
    new.id,
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user'::public.user_role,
    'active'::public.profile_status
  );
  return new;
end;
$$;

revoke all on function public.get_user_admin_summary() from public;
revoke all on function public.get_user_admin_summary() from anon;
grant execute on function public.get_user_admin_summary() to authenticated;

revoke all on function public.update_user_admin(uuid, text, text, public.user_role, uuid, uuid) from public;
revoke all on function public.update_user_admin(uuid, text, text, public.user_role, uuid, uuid) from anon;
grant execute on function public.update_user_admin(uuid, text, text, public.user_role, uuid, uuid) to authenticated;

revoke all on function public.set_user_status(uuid, public.profile_status, text, uuid) from public;
revoke all on function public.set_user_status(uuid, public.profile_status, text, uuid) from anon;
grant execute on function public.set_user_status(uuid, public.profile_status, text, uuid) to authenticated;

revoke all on function public.anonymize_user(uuid, text) from public;
revoke all on function public.anonymize_user(uuid, text) from anon;
grant execute on function public.anonymize_user(uuid, text) to authenticated;

commit;
