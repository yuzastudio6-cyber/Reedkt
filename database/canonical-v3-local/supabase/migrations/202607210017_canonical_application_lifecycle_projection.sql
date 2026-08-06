-- Canonical V3 local-only exact-edit application lifecycle projection.
--
-- The atomic lifecycle RPC is the durable application authority. Its original
-- record projection carried only legacy boolean flags, so the domain reader
-- could not distinguish the canonical exact-edit transaction from the older
-- browser-local Project Edit Session receipt. Patch the reviewed function at
-- one exact predecessor block and persist a credential-free canonical
-- lifecycle authority for apply, replace, and remove.

do $migration$
declare
  current_definition text;
  next_definition text;
  occurrence_count integer;
  old_block constant text := $old$
  if mutation_name = 'replace' then
    update public.preference_applications
      set status = 'replaced', connection_state = 'invalidated',
          replaced_by_application_id = application_uuid,
          record_json = record_json || jsonb_build_object(
            'status', 'replaced', 'targetIntegrationStatus', 'invalidated',
            'replacedByApplicationId', application_uuid::text,
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = expected_application_uuid;
  end if;

  if mutation_name in ('apply', 'replace') then
    update public.preference_applications
      set connection_state = 'connected', connected_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'prepared', 'targetIntegrationStatus', 'connected',
            'downstreamInvalidationStatus', 'not_required',
            'targetEditMutationMade', true, 'downstreamContextWritten', true,
            'connectedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  else
    update public.preference_applications
      set status = 'cleared', connection_state = 'invalidated', cleared_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'cleared', 'targetIntegrationStatus', 'invalidated',
            'downstreamInvalidationStatus', 'completed',
            'clearedAt', public.reeditpro_iso_timestamp(committed_at),
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  end if;
$old$;
  new_block constant text := $new$
  if mutation_name = 'replace' then
    update public.preference_applications
      set status = 'replaced', connection_state = 'invalidated',
          replaced_by_application_id = application_uuid,
          record_json = record_json || jsonb_build_object(
            'status', 'replaced', 'targetIntegrationStatus', 'invalidated',
            'downstreamInvalidationStatus', 'completed',
            'targetEditMutationMade', true, 'downstreamContextWritten', true,
            'replacedByApplicationId', application_uuid::text,
            'invalidationReason', 'replace',
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'canonicalLifecycleAuthority', jsonb_build_object(
              'schemaVersion', 'edit-reference-canonical-exact-edit-application-lifecycle-v1',
              'sourceAuthority', 'canonical_exact_edit_preference_repository',
              'transactionId', transaction_id::text,
              'idempotencyReceiptId', idempotency_receipt_id::text,
              'mutation', 'replace',
              'committedReferenceRevision', next_reference_revision,
              'committedPlanningInputRevision', next_planning_revision,
              'committedAt', public.reeditpro_iso_timestamp(committed_at),
              'browserSuppliedAuthorityAccepted', false,
              'approvedSnapshotMutationAllowed', false
            ),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = expected_application_uuid;
  end if;

  if mutation_name in ('apply', 'replace') then
    update public.preference_applications
      set connection_state = 'connected', connected_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'prepared', 'targetIntegrationStatus', 'connected',
            'downstreamInvalidationStatus', 'not_required',
            'targetEditMutationMade', true, 'downstreamContextWritten', true,
            'connectedAt', public.reeditpro_iso_timestamp(committed_at),
            'canonicalLifecycleAuthority', jsonb_build_object(
              'schemaVersion', 'edit-reference-canonical-exact-edit-application-lifecycle-v1',
              'sourceAuthority', 'canonical_exact_edit_preference_repository',
              'transactionId', transaction_id::text,
              'idempotencyReceiptId', idempotency_receipt_id::text,
              'mutation', mutation_name,
              'committedReferenceRevision', next_reference_revision,
              'committedPlanningInputRevision', next_planning_revision,
              'committedAt', public.reeditpro_iso_timestamp(committed_at),
              'browserSuppliedAuthorityAccepted', false,
              'approvedSnapshotMutationAllowed', false
            ),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  else
    update public.preference_applications
      set status = 'cleared', connection_state = 'invalidated', cleared_at = committed_at,
          record_json = record_json || jsonb_build_object(
            'status', 'cleared', 'targetIntegrationStatus', 'invalidated',
            'downstreamInvalidationStatus', 'completed',
            'targetEditMutationMade', true, 'downstreamContextWritten', true,
            'invalidationReason', 'remove',
            'clearedAt', public.reeditpro_iso_timestamp(committed_at),
            'invalidatedAt', public.reeditpro_iso_timestamp(committed_at),
            'canonicalLifecycleAuthority', jsonb_build_object(
              'schemaVersion', 'edit-reference-canonical-exact-edit-application-lifecycle-v1',
              'sourceAuthority', 'canonical_exact_edit_preference_repository',
              'transactionId', transaction_id::text,
              'idempotencyReceiptId', idempotency_receipt_id::text,
              'mutation', 'remove',
              'committedReferenceRevision', next_reference_revision,
              'committedPlanningInputRevision', next_planning_revision,
              'committedAt', public.reeditpro_iso_timestamp(committed_at),
              'browserSuppliedAuthorityAccepted', false,
              'approvedSnapshotMutationAllowed', false
            ),
            'updatedAt', public.reeditpro_iso_timestamp(committed_at)
          ),
          updated_at = committed_at
      where id = application_uuid;
  end if;
$new$;
begin
  select pg_get_functiondef(
    'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)'::regprocedure
  ) into strict current_definition;

  occurrence_count := (
    length(current_definition) - length(replace(current_definition, old_block, ''))
  ) / length(old_block);
  if occurrence_count <> 1 then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_CANONICAL_LIFECYCLE_PREDECESSOR_CHANGED';
  end if;

  next_definition := replace(current_definition, old_block, new_block);
  execute next_definition;

  select pg_get_functiondef(
    'public.mutate_edit_reference_application_lifecycle_v3(text,jsonb)'::regprocedure
  ) into strict current_definition;
  if position(old_block in current_definition) <> 0
    or position('canonicalLifecycleAuthority' in current_definition) = 0
    or position('canonical_exact_edit_preference_repository' in current_definition) = 0
  then
    raise exception using errcode = '55000',
      message = 'EDIT_REFERENCE_CANONICAL_LIFECYCLE_FORWARD_PATCH_FAILED';
  end if;
end;
$migration$;

revoke all on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb)
  from public, anon;
grant execute on function public.mutate_edit_reference_application_lifecycle_v3(text, jsonb)
  to authenticated, service_role;
