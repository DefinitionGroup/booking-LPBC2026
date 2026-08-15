begin;

-- Migration 11 used a NOT VALID check to tolerate historical rows without a
-- company. PostgreSQL still enforces NOT VALID checks on every UPDATE, which
-- prevents lifecycle-only changes such as cancellation on those rows.
alter table public.bookings
  drop constraint if exists bookings_company_required;

create or replace function public.enforce_booking_company_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.company_id is null then
    raise exception 'A company assignment is required for new bookings'
      using errcode = '23502',
            schema = 'public',
            table = 'bookings',
            column = 'company_id';
  end if;

  if tg_op = 'UPDATE'
    and old.company_id is not null
    and new.company_id is null
  then
    raise exception 'An attributed booking cannot lose its company assignment'
      using errcode = '23502',
            schema = 'public',
            table = 'bookings',
            column = 'company_id';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_booking_company_assignment on public.bookings;
create trigger enforce_booking_company_assignment
  before insert or update of company_id on public.bookings
  for each row
  execute function public.enforce_booking_company_assignment();

comment on function public.enforce_booking_company_assignment() is
  'Requires company attribution for new bookings and prevents existing attribution from being removed, while allowing lifecycle updates to legacy null-company rows.';

revoke all on function public.enforce_booking_company_assignment() from public;
revoke all on function public.enforce_booking_company_assignment() from anon;
revoke all on function public.enforce_booking_company_assignment() from authenticated;

commit;
