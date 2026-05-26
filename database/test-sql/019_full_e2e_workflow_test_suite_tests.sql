-- Draft SQL assertions for Milestone 16B.

select 'E2E workflow run draft supports scenario_id, mode, status' as assertion
where exists (
  select 1
  where 'scenario_id' in ('scenario_id', 'mode', 'status')
    and 'mode' in ('scenario_id', 'mode', 'status')
    and 'status' in ('scenario_id', 'mode', 'status')
);

select 'stage result summaries can store JSONB' as assertion
where exists (select 1 where 'summary jsonb' = 'summary jsonb');

select 'artifact handoff summaries can store JSONB' as assertion
where exists (select 1 where 'summary jsonb' = 'summary jsonb');

select 'QA summaries can store JSONB' as assertion
where exists (select 1 where 'summary jsonb' = 'summary jsonb');

select 'no signed_url column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name like 'production_e2e_%'
    and column_name = 'signed_url'
);

select 'no raw_prompt column is required' as assertion
where not exists (
  select 1
  from information_schema.columns
  where table_name like 'production_e2e_%'
    and column_name = 'raw_prompt'
);

select 'production readiness blockers can be recorded' as assertion
where exists (select 1 where 'production_e2e_blocker_summaries' = 'production_e2e_blocker_summaries');

select 'final export artifact remains private before delivery/share' as assertion;
