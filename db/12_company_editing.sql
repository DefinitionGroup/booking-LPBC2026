-- Audited company name and domain editing.
-- Apply after db/11_user_lifecycle_and_booking_responsibility.sql.

begin;

create or replace function public.update_company_admin(
  p_company_id uuid,
  p_name text,
  p_domain text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
  normalized_domain text := nullif(lower(trim(p_domain)), '');
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into company_record
  from public.companies
  where id = p_company_id
  for update;

  if not found then
    raise exception 'Company not found' using errcode = 'P0002';
  end if;
  if nullif(trim(p_name), '') is null or char_length(trim(p_name)) < 2 then
    raise exception 'Company name must contain at least two characters' using errcode = '22023';
  end if;
  if char_length(trim(p_name)) > 200 or char_length(coalesce(normalized_domain, '')) > 255 then
    raise exception 'Company fields exceed their maximum length' using errcode = '22023';
  end if;

  update public.companies
  set
    name = trim(p_name),
    domain = normalized_domain
  where id = company_record.id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, metadata)
  values (
    'company',
    company_record.id,
    'company_updated',
    public.current_profile_id(),
    jsonb_build_object(
      'from_name', company_record.name,
      'to_name', trim(p_name),
      'from_domain', company_record.domain,
      'to_domain', normalized_domain
    )
  );

  return company_record.id;
end;
$$;

revoke all on function public.update_company_admin(uuid, text, text) from public;
revoke all on function public.update_company_admin(uuid, text, text) from anon;
grant execute on function public.update_company_admin(uuid, text, text) to authenticated;

commit;
