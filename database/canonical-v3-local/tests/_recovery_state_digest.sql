\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.reeditpro_canonical_recovery_state_digest()
returns text
language plpgsql
set search_path = pg_catalog, public, auth
as $$
declare
  table_name text;
  table_rows jsonb;
  state_snapshot jsonb := '{}'::jsonb;
begin
  for table_name in
    select relation.relname
    from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'r'
    order by relation.relname
  loop
    execute format(
      'select coalesce(jsonb_agg(row_json order by row_json::text), ''[]''::jsonb)'
      || ' from (select to_jsonb(table_row) as row_json from public.%I table_row) rows',
      table_name
    ) into table_rows;
    state_snapshot := state_snapshot || jsonb_build_object(
      'public.' || table_name,
      table_rows
    );
  end loop;

  select coalesce(jsonb_agg(row_json order by row_json::text), '[]'::jsonb)
  into table_rows
  from (
    select to_jsonb(user_row) as row_json
    from auth.users user_row
  ) rows;
  state_snapshot := state_snapshot || jsonb_build_object('auth.users', table_rows);

  return public.reeditpro_sha256_json(state_snapshot);
end;
$$;

select pg_temp.reeditpro_canonical_recovery_state_digest();
