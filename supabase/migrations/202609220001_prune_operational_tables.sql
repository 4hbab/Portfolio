-- chat_rate_limits gains a row per visitor per window and operational_metrics a
-- row per chat request. Neither is ever read after its window closes, so without
-- pruning they become the tables that exhaust the project's storage quota.

create or replace function public.prune_operational_tables()
returns void language sql security definer set search_path = '' as $$
  delete from public.chat_rate_limits where window_start < now() - interval '3 days';
  delete from public.operational_metrics where created_at < now() - interval '90 days';
$$;

revoke all on function public.prune_operational_tables() from public, anon, authenticated;
grant execute on function public.prune_operational_tables() to service_role;

-- content_revisions is deliberately excluded: keeping every published revision
-- forever is what makes the History tab a reliable rollback.

create extension if not exists pg_cron;

select cron.unschedule('prune-operational-tables')
where exists (select 1 from cron.job where jobname = 'prune-operational-tables');

select cron.schedule('prune-operational-tables', '0 4 * * *', $$select public.prune_operational_tables()$$);
