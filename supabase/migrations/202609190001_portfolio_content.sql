create table public.owner_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.content_drafts (
  id smallint primary key default 1 check (id = 1),
  content jsonb not null,
  base_revision bigint not null default 0,
  version bigint not null default 1,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.published_snapshots (
  id smallint primary key default 1 check (id = 1),
  revision bigint not null,
  content jsonb not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now()
);

create table public.content_revisions (
  revision bigint generated always as identity primary key,
  content jsonb not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now()
);

create table public.chat_rate_limits (
  scope text not null,
  identity_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  primary key (scope, identity_hash, window_start)
);

create table public.operational_metrics (
  id bigint generated always as identity primary key,
  event_name text not null,
  status text not null,
  duration_ms integer,
  content_revision bigint,
  created_at timestamptz not null default now()
);

alter table public.owner_accounts enable row level security;
alter table public.content_drafts enable row level security;
alter table public.published_snapshots enable row level security;
alter table public.content_revisions enable row level security;
alter table public.chat_rate_limits enable row level security;
alter table public.operational_metrics enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.published_snapshots to anon, authenticated;
grant select on public.owner_accounts, public.content_drafts, public.content_revisions to authenticated;

create policy "Public can read the current published snapshot"
  on public.published_snapshots for select to anon, authenticated using (id = 1);

create policy "Owner can identify their account"
  on public.owner_accounts for select to authenticated using (user_id = (select auth.uid()));

create policy "Owner can read the draft"
  on public.content_drafts for select to authenticated
  using (exists (select 1 from public.owner_accounts o where o.user_id = (select auth.uid())));

create policy "Owner can read revisions"
  on public.content_revisions for select to authenticated
  using (exists (select 1 from public.owner_accounts o where o.user_id = (select auth.uid())));

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
    if coalesce(link ->> 'repoUrl', '') !~ '^https://' or (link ? 'liveUrl' and link ->> 'liveUrl' !~ '^https://') then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.validate_portfolio_content(jsonb) from public, anon, authenticated;

create or replace function public.is_owner_with_mfa()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.owner_accounts where user_id = auth.uid())
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

revoke all on function public.is_owner_with_mfa() from public;
grant execute on function public.is_owner_with_mfa() to authenticated;

create or replace function public.initialize_portfolio_draft(initial_content jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.content_drafts;
begin
  if not public.is_owner_with_mfa() then raise exception 'Owner MFA is required' using errcode = '42501'; end if;
  if not public.validate_portfolio_content(initial_content) then raise exception 'Invalid portfolio content'; end if;
  insert into public.content_drafts(id, content, updated_by)
  values (1, initial_content, auth.uid())
  on conflict (id) do nothing returning * into result;
  if result.id is null then select * into result from public.content_drafts where id = 1; end if;
  return to_jsonb(result);
end;
$$;

create or replace function public.save_portfolio_draft(next_content jsonb, expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.content_drafts;
begin
  if not public.is_owner_with_mfa() then raise exception 'Owner MFA is required' using errcode = '42501'; end if;
  if not public.validate_portfolio_content(next_content) then raise exception 'Invalid portfolio content'; end if;
  update public.content_drafts set content = next_content, version = version + 1, updated_by = auth.uid(), updated_at = now()
  where id = 1 and version = expected_version returning * into result;
  if result.id is null then raise exception 'Draft changed in another session' using errcode = '40001'; end if;
  return to_jsonb(result);
end;
$$;

create or replace function public.publish_portfolio(expected_draft_version bigint, expected_base_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare draft public.content_drafts; new_revision bigint; result public.published_snapshots;
begin
  if not public.is_owner_with_mfa() then raise exception 'Owner MFA is required' using errcode = '42501'; end if;
  select * into draft from public.content_drafts where id = 1 for update;
  if draft.id is null or draft.version <> expected_draft_version or draft.base_revision <> expected_base_revision then
    raise exception 'Draft or publication changed in another session' using errcode = '40001';
  end if;
  insert into public.content_revisions(content, published_by) values (draft.content, auth.uid()) returning revision into new_revision;
  insert into public.published_snapshots(id, revision, content, published_by, published_at)
  values (1, new_revision, draft.content, auth.uid(), now())
  on conflict (id) do update set revision = excluded.revision, content = excluded.content, published_by = excluded.published_by, published_at = excluded.published_at
  returning * into result;
  update public.content_drafts set base_revision = new_revision, version = version + 1, updated_at = now() where id = 1;
  return to_jsonb(result);
end;
$$;

create or replace function public.restore_portfolio_revision(target_revision bigint, expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare restored jsonb; result public.content_drafts;
begin
  if not public.is_owner_with_mfa() then raise exception 'Owner MFA is required' using errcode = '42501'; end if;
  select content into restored from public.content_revisions where revision = target_revision;
  if restored is null then raise exception 'Revision not found'; end if;
  update public.content_drafts set content = restored, version = version + 1, updated_by = auth.uid(), updated_at = now()
  where id = 1 and version = expected_version returning * into result;
  if result.id is null then raise exception 'Draft changed in another session' using errcode = '40001'; end if;
  return to_jsonb(result);
end;
$$;

revoke all on function public.initialize_portfolio_draft(jsonb), public.save_portfolio_draft(jsonb, bigint), public.publish_portfolio(bigint, bigint), public.restore_portfolio_revision(bigint, bigint) from public;
grant execute on function public.initialize_portfolio_draft(jsonb), public.save_portfolio_draft(jsonb, bigint), public.publish_portfolio(bigint, bigint), public.restore_portfolio_revision(bigint, bigint) to authenticated;

create index content_revisions_published_at_idx on public.content_revisions(published_at desc);
create index chat_rate_limits_window_idx on public.chat_rate_limits(window_start);
create index operational_metrics_created_at_idx on public.operational_metrics(created_at desc);

create or replace function public.consume_chat_quota(
  quota_scope text,
  quota_identity text,
  window_seconds integer,
  quota_limit integer
) returns boolean language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz; next_count integer;
begin
  bucket := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  perform pg_advisory_xact_lock(hashtext(quota_scope || ':' || quota_identity || ':' || bucket::text));
  insert into public.chat_rate_limits(scope, identity_hash, window_start, request_count)
  values (quota_scope, quota_identity, bucket, 1)
  on conflict (scope, identity_hash, window_start)
  do update set request_count = public.chat_rate_limits.request_count + 1
  returning request_count into next_count;
  return next_count <= quota_limit;
end;
$$;
revoke all on function public.consume_chat_quota(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_chat_quota(text, text, integer, integer) to service_role;
