-- Studio sessions end eight hours after the password sign-in, however often the
-- token is refreshed in between. The free plan has no time-boxed sessions, and
-- the browser's own timer cannot stop a stolen refresh token, so every write
-- function enforces the limit here. The earliest `amr` entry is the first
-- authentication step and survives refreshes; a token without one is refused.
-- Keep in step with SESSION_POLICY (src/lib/supabase/session.ts) and
-- supabase/functions/_shared/session.ts.

create or replace function public.is_owner_with_mfa()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare started_at bigint;
begin
  if not (exists(select 1 from public.owner_accounts where user_id = auth.uid())
          and coalesce(auth.jwt() ->> 'aal', '') = 'aal2') then
    return false;
  end if;

  select min((entry ->> 'timestamp')::bigint) into started_at
  from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry;

  -- Raised rather than returned as false so the caller does not report an
  -- expired session as missing MFA. 28000 is what the studio listens for.
  if started_at is null or started_at < extract(epoch from now()) - 8 * 60 * 60 then
    raise exception 'Session expired' using errcode = '28000';
  end if;

  return true;
end;
$$;

revoke all on function public.is_owner_with_mfa() from public;
grant execute on function public.is_owner_with_mfa() to authenticated;
