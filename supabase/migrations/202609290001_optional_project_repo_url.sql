-- A project no longer needs a repository: private work and live-only sites have
-- nothing to link. repoUrl is now checked the same way liveUrl already was —
-- absent is fine, present must be https. Links keep their required url.

create or replace function public.validate_portfolio_content(candidate jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare link jsonb;
begin
  if jsonb_typeof(candidate) <> 'object' or candidate ->> 'schemaVersion' <> '1' then return false; end if;
  if jsonb_typeof(candidate -> 'profile') <> 'object'
     or length(coalesce(candidate #>> '{profile,name}', '')) not between 1 and 100
     or length(coalesce(candidate #>> '{profile,email}', '')) not between 3 and 254 then return false; end if;
  if jsonb_typeof(candidate -> 'bio') <> 'array'
     or jsonb_typeof(candidate -> 'experience') <> 'array'
     or jsonb_typeof(candidate -> 'education') <> 'array'
     or jsonb_typeof(candidate -> 'skillGroups') <> 'array'
     or jsonb_typeof(candidate -> 'achievements') <> 'array'
     or jsonb_typeof(candidate -> 'projects') <> 'array'
     or jsonb_typeof(candidate -> 'links') <> 'array'
     or jsonb_typeof(candidate -> 'faqs') <> 'array' then return false; end if;
  for link in select value from jsonb_array_elements(candidate -> 'links') loop
    if coalesce(link ->> 'url', '') !~ '^(https://|mailto:)' then return false; end if;
  end loop;
  for link in select value from jsonb_array_elements(candidate -> 'projects') loop
    if (link ? 'repoUrl' and link ->> 'repoUrl' !~ '^https://') or (link ? 'liveUrl' and link ->> 'liveUrl' !~ '^https://') then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.validate_portfolio_content(jsonb) from public, anon, authenticated;
