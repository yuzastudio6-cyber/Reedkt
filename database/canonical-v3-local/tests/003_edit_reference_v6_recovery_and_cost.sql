\set ON_ERROR_STOP on
\echo 'canonical-v3-local: Study Chat routing/recovery and long-form lease/cost recovery'

begin;
\ir _fixture.sql

create temporary table runtime_test_values (
  name text primary key,
  payload jsonb not null
) on commit drop;
grant select, insert, update on runtime_test_values to authenticated, service_role;

insert into runtime_test_values (name, payload) values (
  'study_chat_reserve_request',
  jsonb_build_object(
    'actorUserId', '11111111-1111-4111-8111-111111111111',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
    'studySessionId', 'aaaaaaaa-4000-4000-8000-000000000001',
    'studyRevision', 1,
    'reservationIdempotencyKeyDigest', repeat('1', 64),
    'clientMessageDigest', repeat('2', 64),
    'structuredContextDigest', repeat('3', 64),
    'savedDirectionEvidenceDigest', repeat('4', 64),
    'routeContractVersion', 'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek',
    'approvedUsageEstimateId', 'study-usage-estimate-a',
    'internalCostBudgetId', 'internal-cost-budget-a',
    'rateCardSnapshotId', 'reasoning-rate-card-a',
    'maximumAuthorizedInternalCostMicros', 1000,
    'messageContent', 'Study restrained documentary pacing and evidence-led visual language.',
    'clientMessageId', 'client-message-a',
    'savedDirectionEvidence', jsonb_build_object(
      'kind', 'user_direction',
      'copyVerbatim', false,
      'providerCallMade', false
    )
  )
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  reserved jsonb;
  replayed jsonb;
  changed jsonb;
begin
  select * into reserved
  from public.reserve_edit_reference_study_chat_run_v1(
    (select payload from runtime_test_values where name = 'study_chat_reserve_request')
  );
  if reserved->>'status' <> 'reserved'
    or (reserved->>'providerCallMade')::boolean is not false
    or (reserved->>'customerPriceCalculated')::boolean is not false
    or (reserved->>'customerCreditsMutated')::boolean is not false
    or (reserved->>'serviceFeeIncluded')::boolean is not false then
    raise exception 'STUDY_CHAT_RESERVATION_INVALID_%', reserved;
  end if;
  insert into runtime_test_values values ('study_chat_reservation', reserved);

  select * into replayed
  from public.reserve_edit_reference_study_chat_run_v1(
    (select payload from runtime_test_values where name = 'study_chat_reserve_request')
  );
  if replayed->>'reasoningRunId' <> reserved->>'reasoningRunId'
    or replayed->>'userMessageId' <> reserved->>'userMessageId'
    or replayed->>'savedDirectionEvidenceId' <> reserved->>'savedDirectionEvidenceId' then
    raise exception 'STUDY_CHAT_RESERVATION_REPLAY_CHANGED';
  end if;

  changed := (select payload from runtime_test_values where name = 'study_chat_reserve_request')
    || jsonb_build_object('messageContent', 'Changed content under the same idempotency key.');
  begin
    perform * from public.reserve_edit_reference_study_chat_run_v1(changed);
    raise exception 'STUDY_CHAT_RESERVATION_CONFLICT_NOT_REJECTED';
  exception when unique_violation then null;
  end;
end;
$$;

reset role;
set local role service_role;

do $$
declare
  route_result jsonb;
  provider_result jsonb;
  submission_result jsonb;
  checkback_result jsonb;
  run_id text := (select payload->>'reasoningRunId' from runtime_test_values where name = 'study_chat_reservation');
begin
  select * into route_result
  from public.authorize_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
    'reasoningRunId', run_id,
    'expectedRunRevision', 1,
    'routeId', 'kimi_k3_primary',
    'routeAuthorizationDigest', repeat('5', 64),
    'requestDigest', repeat('6', 64)
  ));
  if route_result->>'attemptOrdinal' <> '1'
    or route_result->>'routeId' <> 'kimi_k3_primary' then
    raise exception 'STUDY_CHAT_KIMI_ROUTE_INVALID_%', route_result;
  end if;
  insert into runtime_test_values values ('kimi_attempt', route_result);

  select * into provider_result
  from public.reserve_edit_reference_study_chat_provider_request_v1(jsonb_build_object(
    'routeAttemptId', route_result->>'routeAttemptId',
    'expectedAttemptRevision', 1,
    'providerBoundary', 'kimi_k3_provider_boundary',
    'providerModelId', 'kimi-k3',
    'providerModelRevision', 'kimi-k3-2026-07-18',
    'submissionIdempotencyKeyDigest', repeat('7', 64),
    'oneUseSubmissionAuthorityDigest', repeat('8', 64)
  ));
  insert into runtime_test_values values ('kimi_provider_request', provider_result);

  select * into submission_result
  from public.consume_edit_reference_study_chat_submission_v1(jsonb_build_object(
    'providerRequestId', provider_result->>'providerRequestId',
    'expectedRevision', 1,
    'oneUseSubmissionAuthorityDigest', repeat('8', 64)
  ));
  if (submission_result->>'providerCallMayHaveOccurred')::boolean is not true then
    raise exception 'STUDY_CHAT_SUBMISSION_NOT_RECORDED';
  end if;

  begin
    perform * from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
      'routeAttemptId', route_result->>'routeAttemptId',
      'status', 'unknown',
      'terminalOutcome', 'provider_outcome_unknown',
      'usageDigest', repeat('9', 64),
      'providerCostDigest', repeat('a', 64),
      'infrastructureCostDigest', repeat('b', 64),
      'providerCostMicros', 10,
      'infrastructureCostMicros', 5
    ));
    raise exception 'STUDY_CHAT_UNKNOWN_WITHOUT_CHECKBACK_ALLOWED';
  exception when check_violation then null;
  end;

  select * into checkback_result
  from public.schedule_edit_reference_study_chat_checkback_v1(jsonb_build_object(
    'providerRequestId', provider_result->>'providerRequestId',
    'workflowId', 'study-chat-checkback-a',
    'nextCheckAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '1 minute'),
    'deadlineAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '1 hour')
  ));
  insert into runtime_test_values values ('kimi_checkback', checkback_result);

  select * into checkback_result
  from public.claim_edit_reference_study_chat_checkback_v1(jsonb_build_object(
    'checkbackId', checkback_result->>'checkbackId',
    'expectedRevision', 1,
    'leaseOwnerDigest', repeat('c', 64),
    'leaseTokenDigest', repeat('d', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  update runtime_test_values set payload = checkback_result where name = 'kimi_checkback';
end;
$$;

reset role;
update public.preference_study_reasoning_checkbacks
set lease_expires_at = clock_timestamp() - interval '1 minute'
where id = ((select payload->>'checkbackId' from runtime_test_values where name = 'kimi_checkback'))::uuid;

set local role service_role;
do $$
declare
  recovered jsonb;
  reclaimed jsonb;
  observed jsonb;
  settled jsonb;
  route_result jsonb;
  provider_result jsonb;
  run_id text := (select payload->>'reasoningRunId' from runtime_test_values where name = 'study_chat_reservation');
  kimi_attempt_id text := (select payload->>'routeAttemptId' from runtime_test_values where name = 'kimi_attempt');
  kimi_provider_id text := (select payload->>'providerRequestId' from runtime_test_values where name = 'kimi_provider_request');
  checkback_id text := (select payload->>'checkbackId' from runtime_test_values where name = 'kimi_checkback');
begin
  select * into recovered
  from public.recover_expired_edit_reference_study_chat_checkback_lease_v1(checkback_id::uuid);
  if recovered->>'status' <> 'expired' then raise exception 'STUDY_CHAT_CHECKBACK_NOT_RECOVERED'; end if;

  select * into reclaimed
  from public.claim_edit_reference_study_chat_checkback_v1(jsonb_build_object(
    'checkbackId', checkback_id,
    'expectedRevision', 3,
    'leaseOwnerDigest', repeat('e', 64),
    'leaseTokenDigest', repeat('f', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if reclaimed->>'revision' <> '4' then raise exception 'STUDY_CHAT_CHECKBACK_RECLAIM_REVISION_INVALID_%', reclaimed; end if;

  select * into settled
  from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
    'routeAttemptId', kimi_attempt_id,
    'status', 'unknown',
    'terminalOutcome', 'provider_outcome_unknown',
    'usageDigest', repeat('9', 64),
    'providerCostDigest', repeat('a', 64),
    'infrastructureCostDigest', repeat('b', 64),
    'providerCostMicros', 10,
    'infrastructureCostMicros', 5
  ));
  if settled->>'status' <> 'unknown' then raise exception 'STUDY_CHAT_UNKNOWN_NOT_RECORDED_%', settled; end if;

  select * into observed
  from public.record_edit_reference_study_chat_provider_observation_v1(jsonb_build_object(
    'providerRequestId', kimi_provider_id,
    'observationIdDigest', repeat('1', 64),
    'observationDigest', repeat('2', 64),
    'status', 'failed',
    'providerUsageDigest', repeat('3', 64),
    'resultDigest', repeat('4', 64),
    'observedAt', public.reeditpro_iso_timestamp(clock_timestamp())
  ));
  if (observed->>'persisted')::boolean is not true then raise exception 'STUDY_CHAT_OBSERVATION_NOT_PERSISTED'; end if;

  begin
    perform * from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
      'routeAttemptId', kimi_attempt_id,
      'status', 'failed',
      'terminalOutcome', 'terminal_provider_failure',
      'terminalFallbackTrigger', 'kimi_terminal_failure',
      'failureCode', 'KIMI_TERMINAL_FAILURE',
      'usageDigest', repeat('5', 64),
      'providerCostDigest', repeat('6', 64),
      'infrastructureCostDigest', repeat('7', 64),
      'providerCostMicros', 5,
      'infrastructureCostMicros', 5
    ));
    raise exception 'STUDY_CHAT_RECONCILED_COST_REGRESSION_ALLOWED';
  exception when check_violation then null;
  end;

  select * into settled
  from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
    'routeAttemptId', kimi_attempt_id,
    'status', 'failed',
    'terminalOutcome', 'terminal_provider_failure',
    'terminalFallbackTrigger', 'kimi_terminal_failure',
    'failureCode', 'KIMI_TERMINAL_FAILURE',
    'usageDigest', repeat('5', 64),
    'providerCostDigest', repeat('6', 64),
    'infrastructureCostDigest', repeat('7', 64),
    'providerCostMicros', 15,
    'infrastructureCostMicros', 5
  ));
  if settled->>'aggregateInternalCostMicros' <> '20'
    or (settled->>'failedAttemptCostRetained')::boolean is not true then
    raise exception 'STUDY_CHAT_RECONCILED_FAILURE_COST_INVALID_%', settled;
  end if;

  begin
    perform * from public.authorize_edit_reference_study_chat_next_fallback_v1(jsonb_build_object(
      'reasoningRunId', run_id,
      'expectedRunRevision', 5,
      'routeId', 'deepseek_v4_pro_fallback',
      'routeAuthorizationDigest', repeat('8', 64),
      'requestDigest', repeat('9', 64),
      'entryFallbackTrigger', 'kimi_terminal_failure'
    ));
    raise exception 'STUDY_CHAT_ROUTE_SKIP_ALLOWED';
  exception when invalid_parameter_value then null;
  end;

  select * into route_result
  from public.authorize_edit_reference_study_chat_next_fallback_v1(jsonb_build_object(
    'reasoningRunId', run_id,
    'expectedRunRevision', 5,
    'routeId', 'qwen_3_7_fallback',
    'routeAuthorizationDigest', repeat('8', 64),
    'requestDigest', repeat('9', 64),
    'entryFallbackTrigger', 'kimi_terminal_failure'
  ));
  if route_result->>'attemptOrdinal' <> '2'
    or route_result->>'routeId' <> 'qwen_3_7_fallback' then
    raise exception 'STUDY_CHAT_QWEN_ROUTE_INVALID_%', route_result;
  end if;
  insert into runtime_test_values values ('qwen_attempt', route_result);

  select * into provider_result
  from public.reserve_edit_reference_study_chat_provider_request_v1(jsonb_build_object(
    'routeAttemptId', route_result->>'routeAttemptId',
    'expectedAttemptRevision', 1,
    'providerBoundary', 'qwen_3_7_provider_boundary',
    'providerModelId', 'qwen3.7-max-2026-06-08',
    'providerModelRevision', 'qwen3.7-max-2026-06-08',
    'submissionIdempotencyKeyDigest', repeat('a', 64),
    'oneUseSubmissionAuthorityDigest', repeat('b', 64)
  ));
  insert into runtime_test_values values ('qwen_provider_request', provider_result);
  perform * from public.consume_edit_reference_study_chat_submission_v1(jsonb_build_object(
    'providerRequestId', provider_result->>'providerRequestId',
    'expectedRevision', 1,
    'oneUseSubmissionAuthorityDigest', repeat('b', 64)
  ));

  begin
    perform * from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
      'routeAttemptId', route_result->>'routeAttemptId',
      'status', 'completed',
      'terminalOutcome', 'completed',
      'usageDigest', repeat('c', 64),
      'providerCostDigest', repeat('d', 64),
      'infrastructureCostDigest', repeat('e', 64),
      'providerCostMicros', 100,
      'infrastructureCostMicros', 20
    ));
    raise exception 'STUDY_CHAT_QWEN_WITHOUT_FX_ALLOWED';
  exception when check_violation then null;
  end;

  select * into settled
  from public.settle_edit_reference_study_chat_route_attempt_v1(jsonb_build_object(
    'routeAttemptId', route_result->>'routeAttemptId',
    'status', 'completed',
    'terminalOutcome', 'completed',
    'usageDigest', repeat('c', 64),
    'providerCostDigest', repeat('d', 64),
    'infrastructureCostDigest', repeat('e', 64),
    'fxSnapshotDigest', repeat('f', 64),
    'providerCostMicros', 100,
    'infrastructureCostMicros', 20
  ));
  if settled->>'aggregateInternalCostMicros' <> '140' then
    raise exception 'STUDY_CHAT_COST_AGGREGATE_INVALID_%', settled;
  end if;

  select * into settled
  from public.settle_edit_reference_study_chat_run_v1(jsonb_build_object(
    'reasoningRunId', run_id,
    'terminalState', 'completed',
    'finalResultDigest', repeat('1', 64),
    'routeAttemptSetDigest', repeat('2', 64),
    'costAggregateDigest', repeat('3', 64),
    'assistantMessageContent', 'The reference uses restrained pacing and evidence-led visual emphasis.',
    'assistantMessageDigest', repeat('4', 64)
  ));
  if settled->>'normalizedInternalCostMicros' <> '140'
    or settled->>'failedAttemptCount' <> '1'
    or (settled->>'customerPriceCalculated')::boolean is not false
    or (settled->>'customerCreditsMutated')::boolean is not false
    or (settled->>'serviceFeeIncluded')::boolean is not false then
    raise exception 'STUDY_CHAT_RUN_RECEIPT_INVALID_%', settled;
  end if;
  insert into runtime_test_values values ('study_chat_run_receipt', settled);
end;
$$;

reset role;

do $$
begin
  if (select count(*) from public.preference_study_messages) <> 2 then
    raise exception 'STUDY_CHAT_MESSAGE_REPLAY_DUPLICATED';
  end if;
  if (select count(*) from public.preference_evidence) <> 1 then
    raise exception 'STUDY_CHAT_EVIDENCE_REPLAY_DUPLICATED';
  end if;
  if (select count(*) from public.preference_study_reasoning_route_attempts) <> 2 then
    raise exception 'STUDY_CHAT_ROUTE_ATTEMPT_COUNT_INVALID';
  end if;
  if exists (
    select 1 from public.preference_study_reasoning_route_attempts
    where attempt_ordinal = 1 and route_id <> 'kimi_k3_primary'
  ) or exists (
    select 1 from public.preference_study_reasoning_route_attempts
    where attempt_ordinal = 2 and route_id <> 'qwen_3_7_fallback'
  ) then raise exception 'STUDY_CHAT_ROUTE_ORDER_INVALID'; end if;
  if (select status from public.preference_study_reasoning_checkbacks limit 1) <> 'completed' then
    raise exception 'STUDY_CHAT_TERMINAL_CHECKBACK_NOT_CLOSED';
  end if;
  if (select sum(internal_cost_micros) from public.preference_study_reasoning_route_attempts) <> 140 then
    raise exception 'STUDY_CHAT_PERSISTED_INTERNAL_COST_INVALID';
  end if;
end;
$$;

insert into runtime_test_values (name, payload) values (
  'long_form_enqueue_request',
  jsonb_build_object(
    'authorityClass', 'pre_plan_edit_reference_long_form_study',
    'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
    'studySessionId', 'aaaaaaaa-4000-4000-8000-000000000001',
    'sourceAssetId', 'aaaaaaaa-d000-4000-8000-000000000001',
    'planVersion', 1,
    'planDigest', repeat('5', 64),
    'sourceChecksumSha256', repeat('a', 64),
    'rateCardSnapshotDigest', repeat('6', 64),
    'maximumAuthorizedInternalCostMicros', 1000,
    'currency', 'USD',
    'studyUsageApprovalStatus', 'approved',
    'workItems', jsonb_build_array(
      jsonb_build_object(
        'sequence', 1,
        'workType', 'source_window_analysis',
        'dependencyDigest', repeat('7', 64),
        'dependencySequences', jsonb_build_array(),
        'idempotencyKeyHash', repeat('8', 64),
        'maximumAuthorizedInternalCostMicros', 400
      ),
      jsonb_build_object(
        'sequence', 2,
        'workType', 'semantic_reconciliation',
        'dependencyDigest', repeat('9', 64),
        'dependencySequences', jsonb_build_array(1),
        'idempotencyKeyHash', repeat('a', 64),
        'maximumAuthorizedInternalCostMicros', 400
      )
    )
  )
);

set local role service_role;
do $$
declare
  enqueued jsonb;
  replayed jsonb;
  claimed jsonb;
  blocked jsonb;
begin
  select * into enqueued
  from public.enqueue_edit_reference_long_form_study_v1(
    (select payload from runtime_test_values where name = 'long_form_enqueue_request')
  );
  if enqueued->>'workItemCount' <> '2'
    or (enqueued->>'approvedEditPlanSnapshotFabricated')::boolean is not false
    or (enqueued->>'approvedEditCreditReservationFabricated')::boolean is not false
    or (enqueued->>'customerPriceCalculated')::boolean is not false
    or (enqueued->>'customerCreditsMutated')::boolean is not false
    or (enqueued->>'serviceFeeIncluded')::boolean is not false then
    raise exception 'LONG_FORM_ENQUEUE_INVALID_%', enqueued;
  end if;
  insert into runtime_test_values values ('long_form_run', enqueued);

  select * into replayed
  from public.enqueue_edit_reference_long_form_study_v1(
    (select payload from runtime_test_values where name = 'long_form_enqueue_request')
  );
  if replayed->>'studyRunId' <> enqueued->>'studyRunId'
    or (replayed->>'replayed')::boolean is not true then
    raise exception 'LONG_FORM_ENQUEUE_REPLAY_CHANGED';
  end if;

  select * into claimed
  from public.claim_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyRunId', enqueued->>'studyRunId',
    'leaseOwnerDigest', repeat('b', 64),
    'leaseTokenDigest', repeat('c', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if claimed->>'sequence' <> '1' or claimed->>'attemptNumber' <> '1' then
    raise exception 'LONG_FORM_FIRST_CLAIM_INVALID_%', claimed;
  end if;
  insert into runtime_test_values values ('long_form_work_one', claimed);

  select * into blocked
  from public.claim_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyRunId', enqueued->>'studyRunId',
    'leaseOwnerDigest', repeat('d', 64),
    'leaseTokenDigest', repeat('e', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if blocked is not null then raise exception 'LONG_FORM_DEPENDENT_ITEM_CLAIMED_EARLY_%', blocked; end if;
end;
$$;

reset role;
update public.preference_long_form_study_work_items
set lease_expires_at = clock_timestamp() - interval '1 minute'
where id = ((select payload->>'studyWorkItemId' from runtime_test_values where name = 'long_form_work_one'))::uuid;

set local role service_role;
do $$
declare
  result jsonb;
  claimed jsonb;
  work_one text := (select payload->>'studyWorkItemId' from runtime_test_values where name = 'long_form_work_one');
  run_id text := (select payload->>'studyRunId' from runtime_test_values where name = 'long_form_run');
begin
  select * into result
  from public.recover_expired_edit_reference_long_form_lease_v1(work_one::uuid);
  if (result->>'expiredLeaseRecovered')::boolean is not true then raise exception 'LONG_FORM_LEASE_NOT_RECOVERED'; end if;

  select * into claimed
  from public.claim_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyRunId', run_id,
    'leaseOwnerDigest', repeat('f', 64),
    'leaseTokenDigest', repeat('1', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if claimed->>'sequence' <> '1' or claimed->>'attemptNumber' <> '2' then
    raise exception 'LONG_FORM_RECOVERED_CLAIM_INVALID_%', claimed;
  end if;

  perform * from public.heartbeat_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyWorkItemId', work_one,
    'leaseTokenDigest', repeat('1', 64),
    'checkpointSequence', 1,
    'checkpointDigest', repeat('2', 64),
    'completedUnitCount', 10,
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '10 minutes')
  ));

  select * into result
  from public.fail_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyWorkItemId', work_one,
    'leaseTokenDigest', repeat('1', 64),
    'usageDigest', repeat('3', 64),
    'failureClass', 'transient_worker_failure',
    'retryAllowed', true,
    'providerCostMicros', 30,
    'infrastructureCostMicros', 20
  ));
  if result->>'status' <> 'queued'
    or result->>'internalCostMicros' <> '50'
    or (result->>'failedAttemptCostRetained')::boolean is not true then
    raise exception 'LONG_FORM_RETRY_FAILURE_INVALID_%', result;
  end if;

  select * into claimed
  from public.claim_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyRunId', run_id,
    'leaseOwnerDigest', repeat('4', 64),
    'leaseTokenDigest', repeat('5', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if claimed->>'attemptNumber' <> '3' then raise exception 'LONG_FORM_RETRY_ATTEMPT_NUMBER_INVALID_%', claimed; end if;

  perform * from public.heartbeat_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyWorkItemId', work_one,
    'leaseTokenDigest', repeat('5', 64),
    'checkpointSequence', 2,
    'checkpointDigest', repeat('6', 64),
    'completedUnitCount', 20,
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '10 minutes')
  ));

  select * into result
  from public.complete_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyWorkItemId', work_one,
    'leaseTokenDigest', repeat('5', 64),
    'usageDigest', repeat('7', 64),
    'providerCostMicros', 40,
    'infrastructureCostMicros', 10,
    'outputType', 'semantic_window_evidence',
    'outputDigest', repeat('8', 64),
    'storageObjectId', 'tenant-a/reference/work-one.json',
    'storageGeneration', '1',
    'storageEtag', 'etag-work-one',
    'checksumSha256', repeat('9', 64)
  ));
  if result->>'status' <> 'completed' or result->>'internalCostMicros' <> '50' then
    raise exception 'LONG_FORM_WORK_ONE_COMPLETION_INVALID_%', result;
  end if;

  select * into claimed
  from public.claim_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyRunId', run_id,
    'leaseOwnerDigest', repeat('a', 64),
    'leaseTokenDigest', repeat('b', 64),
    'leaseExpiresAt', public.reeditpro_iso_timestamp(clock_timestamp() + interval '5 minutes')
  ));
  if claimed->>'sequence' <> '2' then raise exception 'LONG_FORM_DEPENDENT_ITEM_NOT_RELEASED_%', claimed; end if;
  insert into runtime_test_values values ('long_form_work_two', claimed);

  select * into result
  from public.complete_edit_reference_long_form_work_item_v1(jsonb_build_object(
    'studyWorkItemId', claimed->>'studyWorkItemId',
    'leaseTokenDigest', repeat('b', 64),
    'usageDigest', repeat('c', 64),
    'providerCostMicros', 20,
    'infrastructureCostMicros', 10,
    'outputType', 'study_reconciliation',
    'outputDigest', repeat('d', 64),
    'storageObjectId', 'tenant-a/reference/work-two.json',
    'storageGeneration', '1',
    'storageEtag', 'etag-work-two',
    'checksumSha256', repeat('e', 64)
  ));
  if result->>'status' <> 'completed' or result->>'internalCostMicros' <> '30' then
    raise exception 'LONG_FORM_WORK_TWO_COMPLETION_INVALID_%', result;
  end if;
end;
$$;

reset role;

do $$
begin
  if (select status from public.preference_long_form_study_runs limit 1) <> 'completed' then
    raise exception 'LONG_FORM_RUN_NOT_COMPLETED';
  end if;
  if (select recovery_generation from public.preference_long_form_study_runs limit 1) <> 1 then
    raise exception 'LONG_FORM_RECOVERY_GENERATION_INVALID';
  end if;
  if (select count(*) from public.preference_long_form_study_attempts) <> 3 then
    raise exception 'LONG_FORM_ATTEMPT_COUNT_INVALID';
  end if;
  if (select sum(internal_cost_micros) from public.preference_long_form_study_attempts) <> 130 then
    raise exception 'LONG_FORM_INTERNAL_COST_TOTAL_INVALID';
  end if;
  if (select count(*) from public.preference_long_form_study_checkpoints) <> 2 then
    raise exception 'LONG_FORM_CHECKPOINT_RETRY_COPY_INVALID';
  end if;
  if (select count(*) from public.preference_long_form_study_work_outputs) <> 2 then
    raise exception 'LONG_FORM_OUTPUT_COUNT_INVALID';
  end if;
  if (select count(*) from public.approved_plan_snapshots) <> 0 then
    raise exception 'LONG_FORM_FABRICATED_APPROVED_SNAPSHOT';
  end if;
  if (select count(*) from public.edit_execution_authorizations) <> 0 then
    raise exception 'LONG_FORM_FABRICATED_EXECUTION_AUTHORITY';
  end if;
end;
$$;

rollback;

\echo 'PASS 003_edit_reference_v6_recovery_and_cost'
