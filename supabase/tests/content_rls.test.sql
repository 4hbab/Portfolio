begin;

-- pgTAP is a test-only dependency. Created inside the transaction this file
-- rolls back, so it is available to `supabase test db` without a production
-- migration ever installing a testing framework into the live database.
create extension if not exists pgtap;

select plan(10);

insert into auth.users(id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');
insert into public.owner_accounts(user_id) values ('11111111-1111-1111-1111-111111111111');

set local role anon;
select lives_ok($$select * from public.published_snapshots$$, 'anonymous visitors can read published content');
select throws_ok($$select * from public.content_drafts$$, '42501', null, 'anonymous visitors cannot read drafts');
select throws_ok($$select * from public.content_revisions$$, '42501', null, 'anonymous visitors cannot read revisions');
select throws_ok($$insert into public.published_snapshots(id, revision, content, published_by) values (1, 1, '{}', '11111111-1111-1111-1111-111111111111')$$, '42501', null, 'anonymous visitors cannot publish');

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is_empty($$select * from public.content_drafts$$, 'non-owner cannot see drafts');
select throws_ok($$select public.save_portfolio_draft('{}', 1)$$, '42501', null, 'non-owner cannot save');

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","aal":"aal2"}', true);
select lives_ok($$select public.initialize_portfolio_draft('{"schemaVersion":1,"profile":{"name":"Owner","email":"owner@example.com"},"bio":[],"experience":[],"education":[],"skillGroups":[],"achievements":[],"projects":[],"links":[],"faqs":[]}'::jsonb)$$, 'owner with MFA can initialize the draft');
select lives_ok($$select public.initialize_portfolio_draft('{"schemaVersion":1,"profile":{"name":"Owner","email":"owner@example.com"},"bio":[],"experience":[],"education":[],"skillGroups":[],"achievements":[],"projects":[{"title":"Private"}],"links":[],"faqs":[]}'::jsonb)$$, 'a project without a repository URL is valid');
select throws_ok($$select public.initialize_portfolio_draft('{"schemaVersion":1,"profile":{"name":"Owner","email":"owner@example.com"},"bio":[],"experience":[],"education":[],"skillGroups":[],"achievements":[],"projects":[{"title":"Plain","repoUrl":"http://example.com"}],"links":[],"faqs":[]}'::jsonb)$$, 'P0001', 'Invalid portfolio content', 'a present repository URL must still be https');
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","aal":"aal1"}', true);
select throws_ok($$select public.initialize_portfolio_draft('{"schemaVersion":1}')$$, '42501', null, 'owner needs MFA for writes');

select * from finish();
rollback;
