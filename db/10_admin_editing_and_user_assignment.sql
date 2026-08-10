-- Admin editing and existing-user company assignment.
-- Apply after db/09_lifecycle_management.sql.

begin;

alter table public.audit_events
  drop constraint if exists audit_events_entity_type_check;

alter table public.audit_events
  add constraint audit_events_entity_type_check
  check (entity_type in ('booking', 'company', 'profile'));

create or replace function public.assign_user_company(
  p_user_id uuid,
  p_company_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_record public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select *
  into profile_record
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if p_company_id is not null and not exists (
    select 1
    from public.companies
    where id = p_company_id
      and status = 'active'
  ) then
    raise exception 'An active company is required' using errcode = '22023';
  end if;

  if profile_record.company_id is not distinct from p_company_id then
    return p_company_id;
  end if;

  update public.profiles
  set
    company_id = p_company_id,
    updated_at = timezone('utc'::text, now())
  where id = p_user_id;

  insert into public.audit_events (
    entity_type,
    entity_id,
    action,
    actor_id,
    metadata
  ) values (
    'profile',
    p_user_id,
    'company_assignment_changed',
    auth.uid(),
    jsonb_build_object(
      'from_company_id', profile_record.company_id,
      'to_company_id', p_company_id
    )
  );

  return p_company_id;
end;
$$;

revoke all on function public.assign_user_company(uuid, uuid) from public;
revoke all on function public.assign_user_company(uuid, uuid) from anon;
grant execute on function public.assign_user_company(uuid, uuid) to authenticated;

commit;
