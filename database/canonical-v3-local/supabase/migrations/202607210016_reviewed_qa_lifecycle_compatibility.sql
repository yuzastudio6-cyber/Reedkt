-- Canonical V3 local-only reviewed-QA lifecycle compatibility.
--
-- Migration 009 correctly permits an explicitly acknowledged
-- `requires_user_review` QA result to produce an immutable approved DNA
-- version. The older lifecycle function from migration 003 accidentally
-- required the narrower `passed` label again, making that legitimate approved
-- version impossible to apply. Replace that one predicate in the already
-- reviewed V3 function definition. The migration fails closed unless the
-- expected predecessor body contains exactly one occurrence.

do $migration$
declare
  current_definition text;
  next_definition text;
  old_predicate constant text := 'or qa_row.status <> ''passed''';
  new_predicate constant text :=
    'or qa_row.status not in (''passed'', ''requires_user_review'')';
  occurrence_count integer;
begin
  select pg_get_functiondef(
    'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)'::regprocedure
  ) into strict current_definition;

  occurrence_count := (
    length(current_definition)
      - length(replace(current_definition, old_predicate, ''))
  ) / length(old_predicate);
  if occurrence_count <> 1 then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_REVIEWED_QA_PREDECESSOR_CHANGED';
  end if;

  next_definition := replace(
    current_definition,
    old_predicate,
    new_predicate
  );
  execute next_definition;

  select pg_get_functiondef(
    'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)'::regprocedure
  ) into strict current_definition;
  if position(old_predicate in current_definition) <> 0
    or position(new_predicate in current_definition) = 0
  then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_REVIEWED_QA_FORWARD_PATCH_FAILED';
  end if;
end;
$migration$;

revoke all on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb)
  from public, anon;
grant execute on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb)
  to authenticated, service_role;
