-- Canonical V3 local-only idempotency concurrency fence.
--
-- A SELECT ... FOR UPDATE cannot lock a receipt row that does not exist yet.
-- Simultaneous delivery of one exact request could therefore let both calls
-- observe no receipt before one lost the unique-key race. The mutation stayed
-- atomic, but the duplicate did not receive the committed replay. Serialize
-- the exact tenant/actor/operation/key before the first receipt read.

create or replace function public.reeditpro_edit_reference_idempotency_fence(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_operation text,
  p_idempotency_key_hash text
)
returns void
language plpgsql
volatile
strict
set search_path = pg_catalog, public
as $$
begin
  if p_operation not in (
    'prepare_edit_reference_application_v2',
    'apply_exact_edit_preferences_and_reference_v1'
  )
    or p_idempotency_key_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception using errcode = '22023',
      message = 'EDIT_REFERENCE_IDEMPOTENCY_FENCE_INPUT_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(
    'canonical_edit_reference_idempotency:'
      || p_workspace_id::text || ':'
      || p_actor_user_id::text || ':'
      || p_operation || ':'
      || p_idempotency_key_hash,
    0
  ));
end;
$$;

revoke all on function public.reeditpro_edit_reference_idempotency_fence(
  uuid, uuid, text, text
) from public, anon, authenticated, service_role;

do $migration$
declare
  current_definition text;
  next_definition text;
  occurrence_count integer;
  old_marker constant text := $old$
  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
$old$;
  apply_marker constant text := $apply$
  perform public.reeditpro_edit_reference_idempotency_fence(
    workspace_uuid, actor_id,
    'apply_exact_edit_preferences_and_reference_v1', key_digest
  );

  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
$apply$;
  preparation_marker constant text := $preparation$
  perform public.reeditpro_edit_reference_idempotency_fence(
    workspace_uuid, actor_id,
    'prepare_edit_reference_application_v2', idempotency_key_digest
  );

  select * into existing_receipt
  from public.edit_reference_idempotency_receipts receipt_row
$preparation$;
begin
  select pg_get_functiondef(
    'public.apply_exact_edit_preferences_and_reference_v1(text,jsonb)'::regprocedure
  ) into strict current_definition;
  occurrence_count := (
    length(current_definition) - length(replace(current_definition, old_marker, ''))
  ) / length(old_marker);
  if occurrence_count <> 1 then
    raise exception using errcode = '55000',
      message = 'EXACT_EDIT_APPLY_IDEMPOTENCY_FENCE_PREDECESSOR_CHANGED';
  end if;
  next_definition := replace(current_definition, old_marker, apply_marker);
  execute next_definition;

  select pg_get_functiondef(
    'public.prepare_edit_reference_application_v2(text,jsonb)'::regprocedure
  ) into strict current_definition;
  occurrence_count := (
    length(current_definition) - length(replace(current_definition, old_marker, ''))
  ) / length(old_marker);
  if occurrence_count <> 1 then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_PREPARATION_IDEMPOTENCY_FENCE_PREDECESSOR_CHANGED';
  end if;
  next_definition := replace(current_definition, old_marker, preparation_marker);
  execute next_definition;

  if position(
    'apply_exact_edit_preferences_and_reference_v1'', key_digest' in
    pg_get_functiondef(
      'public.apply_exact_edit_preferences_and_reference_v1(text,jsonb)'::regprocedure
    )
  ) = 0 or position(
    'prepare_edit_reference_application_v2'', idempotency_key_digest' in
    pg_get_functiondef(
      'public.prepare_edit_reference_application_v2(text,jsonb)'::regprocedure
    )
  ) = 0 then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_IDEMPOTENCY_FENCE_FORWARD_PATCH_FAILED';
  end if;
end;
$migration$;

revoke all on function public.apply_exact_edit_preferences_and_reference_v1(text, jsonb)
  from public, anon;
grant execute on function public.apply_exact_edit_preferences_and_reference_v1(text, jsonb)
  to authenticated, service_role;

revoke all on function public.prepare_edit_reference_application_v2(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.prepare_edit_reference_application_v2(text, jsonb)
  to service_role;
