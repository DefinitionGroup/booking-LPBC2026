-- DEPRECATED: this file previously granted every authenticated user insert
-- access to administrative tables. It is intentionally non-runnable.
-- Apply db/08_security_hardening.sql instead.

do $$
begin
  raise exception 'db/rls_fix.sql is unsafe and deprecated. Apply db/08_security_hardening.sql.';
end;
$$;
