-- RP-E2E-READY-01 Prompt 9
-- Production-shaped no-AI service path hardening.
--
-- Local/review-ready only. Do not apply to production without Supabase
-- staging validation, RLS/advisor review, and explicit approval.
-- These RPCs are service-role-only and must never be called from frontend code.

set check_function_bodies = off;

do $$
begin
  if to_regclass('public.chat_attachments') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'chat_attachments' and column_name = 'chat_session_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'chat_attachments' and column_name = 'source_order')
  then
    execute 'create index if not exists chat_attachments_chat_session_source_order_idx on public.chat_attachments (chat_session_id, source_order)';
  end if;

  if to_regclass('public.source_clip_sequences') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'source_clip_sequences' and column_name = 'project_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'source_clip_sequences' and column_name = 'is_active')
  then
    execute 'create index if not exists source_clip_sequences_project_active_idx on public.source_clip_sequences (project_id, is_active)';
  end if;

  if to_regclass('public.source_clip_sequence_items') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'source_clip_sequence_items' and column_name = 'source_clip_sequence_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'source_clip_sequence_items' and column_name = 'uploaded_order')
  then
    execute 'create index if not exists source_clip_sequence_items_sequence_order_idx on public.source_clip_sequence_items (source_clip_sequence_id, uploaded_order)';
  end if;

  if to_regclass('public.job_events') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_events' and column_name = 'job_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'job_events' and column_name = 'created_at')
  then
    execute 'create index if not exists job_events_job_created_at_idx on public.job_events (job_id, created_at)';
  end if;

  if to_regclass('public.credit_reservations') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'credit_reservations' and column_name = 'workspace_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'credit_reservations' and column_name = 'idempotency_key')
  then
    execute 'create index if not exists credit_reservations_idempotency_idx on public.credit_reservations (workspace_id, idempotency_key) where idempotency_key is not null';
  end if;

  if to_regclass('public.credit_refunds') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'credit_refunds' and column_name = 'credit_reservation_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'credit_refunds' and column_name = 'status')
  then
    execute 'create index if not exists credit_refunds_reservation_status_idx on public.credit_refunds (credit_reservation_id, status) where credit_reservation_id is not null';
  end if;
end $$;

create or replace function public.e2e_json_contains_secret_marker(p_payload jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(
    lower(coalesce(p_payload::text, '')) similar to
      '%(api_key|service_role|signed_url|password|bearer|secret|token)%',
    false
  );
$$;

comment on function public.e2e_json_contains_secret_marker(jsonb) is
'Conservative E2E payload safety check. It rejects obvious secret-like or signed URL markers before service-role smoke RPCs store JSON metadata.';

create or replace function public.e2e_assert_idempotent_request(
  p_workspace_id uuid,
  p_user_id uuid,
  p_idempotency_key text,
  p_request_method text,
  p_request_path text,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.api_idempotency_keys%rowtype;
  v_id uuid;
begin
  if p_workspace_id is null or p_user_id is null or nullif(trim(p_idempotency_key), '') is null then
    raise exception 'E2E_IDEMPOTENCY_REQUIRED: workspace_id, user_id, and idempotency_key are required';
  end if;

  select *
  into v_existing
  from public.api_idempotency_keys
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if found then
    if v_existing.request_hash <> p_request_hash then
      raise exception 'E2E_IDEMPOTENCY_CONFLICT: same key was reused with a different request hash';
    end if;

    return jsonb_build_object(
      'ok', true,
      'status', 'idempotent_replay',
      'idempotencyKeyId', v_existing.id,
      'responseRecordTable', v_existing.response_record_table,
      'responseRecordId', v_existing.response_record_id
    );
  end if;

  insert into public.api_idempotency_keys (
    workspace_id,
    user_id,
    idempotency_key,
    request_method,
    request_path,
    request_hash,
    expires_at
  )
  values (
    p_workspace_id,
    p_user_id,
    p_idempotency_key,
    p_request_method,
    p_request_path,
    p_request_hash,
    now() + interval '24 hours'
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'recorded',
    'idempotencyKeyId', v_id
  );
end;
$$;

create or replace function public.e2e_attach_finalized_media_to_source_sequence(
  p_workspace_id uuid,
  p_project_id uuid,
  p_chat_session_id uuid,
  p_media_asset_ids uuid[],
  p_requested_by_user_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence_id uuid;
  v_media_asset_id uuid;
  v_index integer := 1;
  v_missing integer;
  v_bad_storage integer;
  v_prefix text;
begin
  if p_workspace_id is null or p_project_id is null or p_chat_session_id is null then
    raise exception 'E2E_SOURCE_SETUP_MISSING_IDS: workspace, project, and chat session are required';
  end if;
  if p_media_asset_ids is null or array_length(p_media_asset_ids, 1) is null then
    raise exception 'E2E_MEDIA_ASSET_REQUIRED: at least one finalized media asset is required';
  end if;

  select count(*)
  into v_missing
  from unnest(p_media_asset_ids) as media_asset_id
  where not exists (
    select 1
    from public.media_assets ma
    where ma.id = media_asset_id
      and ma.workspace_id = p_workspace_id
      and ma.project_id = p_project_id
      and ma.processing_status in ('uploaded', 'analysis_ready')
  );
  if v_missing > 0 then
    raise exception 'E2E_MEDIA_ASSET_NOT_READY: all media assets must be finalized and ready';
  end if;

  v_prefix := 'workspaces/' || p_workspace_id::text || '/projects/' || p_project_id::text || '/';
  select count(*)
  into v_bad_storage
  from public.storage_object_records sor
  where sor.workspace_id = p_workspace_id
    and sor.project_id = p_project_id
    and sor.media_asset_id = any(p_media_asset_ids)
    and (
      sor.status <> 'ready'
      or sor.object_path not like v_prefix || '%'
      or lower(coalesce(sor.object_path, '')) like '%signed%'
    );
  if v_bad_storage > 0 then
    raise exception 'E2E_STORAGE_OBJECT_NOT_READY: storage records must be ready canonical workspace/project paths';
  end if;

  insert into public.source_clip_sequences (
    workspace_id,
    project_id,
    chat_session_id,
    created_by,
    name,
    metadata
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_requested_by_user_id,
    'RP-E2E finalized source sequence',
    jsonb_build_object('rpE2e', true, 'idempotencyKey', p_idempotency_key)
  )
  returning id into v_sequence_id;

  foreach v_media_asset_id in array p_media_asset_ids loop
    insert into public.chat_attachments (
      workspace_id,
      project_id,
      chat_session_id,
      attachment_type,
      media_asset_id,
      source_order,
      metadata
    )
    values (
      p_workspace_id,
      p_project_id,
      p_chat_session_id,
      'source_video',
      v_media_asset_id,
      v_index,
      jsonb_build_object('rpE2e', true, 'finalizedMediaAsset', true)
    );

    insert into public.source_clip_sequence_items (
      workspace_id,
      project_id,
      source_clip_sequence_id,
      media_asset_id,
      uploaded_order,
      status,
      metadata
    )
    values (
      p_workspace_id,
      p_project_id,
      v_sequence_id,
      v_media_asset_id,
      v_index,
      'active',
      jsonb_build_object('rpE2e', true, 'attachedFromChatSessionId', p_chat_session_id)
    );

    v_index := v_index + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'status', 'ready',
    'sourceClipSequenceId', v_sequence_id,
    'sourceOrderCount', array_length(p_media_asset_ids, 1)
  );
end;
$$;

create or replace function public.e2e_create_plan_approval_bundle(
  p_workspace_id uuid,
  p_project_id uuid,
  p_chat_session_id uuid,
  p_created_by_user_id uuid,
  p_source_sequence_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_edit_plan_id uuid;
  v_credit_estimate_id uuid;
  v_credit_approval_id uuid;
begin
  if p_workspace_id is null or p_project_id is null or p_chat_session_id is null or p_source_sequence_id is null then
    raise exception 'E2E_PLAN_APPROVAL_BUNDLE_MISSING_IDS: workspace, project, chat session, and source sequence are required';
  end if;

  select id
  into v_wallet_id
  from public.credit_wallets
  where workspace_id = p_workspace_id
  order by created_at asc
  limit 1;

  if v_wallet_id is null then
    raise exception 'E2E_CREDIT_WALLET_MISSING: create a safe test credit wallet before live E2E writes';
  end if;

  insert into public.edit_plans (
    workspace_id,
    project_id,
    chat_session_id,
    created_by_user_id,
    source_sequence_map_id,
    status,
    goal_summary,
    workflow_context,
    plan_payload,
    approved_at,
    approved_by
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    p_created_by_user_id,
    null,
    'approved',
    'RP-E2E no-AI local preview smoke',
    'no_ai_e2e',
    jsonb_build_object('rpE2e', true, 'sourceClipSequenceId', p_source_sequence_id, 'providerCallsEnabled', false),
    now(),
    p_created_by_user_id
  )
  returning id into v_edit_plan_id;

  insert into public.credit_estimates (
    workspace_id,
    project_id,
    chat_session_id,
    edit_plan_id,
    status,
    total_estimated_credits,
    estimate_reason,
    estimate_payload,
    shown_to_user_at,
    approved_at,
    created_by_agent
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    v_edit_plan_id,
    'approved',
    1,
    'RP-E2E no-AI preview smoke credit estimate',
    jsonb_build_object('rpE2e', true, 'noProviderCalls', true),
    now(),
    now(),
    'reeditpro-e2e-smoke'
  )
  returning id into v_credit_estimate_id;

  insert into public.credit_estimate_line_items (
    credit_estimate_id,
    workspace_id,
    project_id,
    edit_plan_id,
    line_item_type,
    usage_category,
    label,
    estimated_credits,
    line_payload
  )
  values (
    v_credit_estimate_id,
    p_workspace_id,
    p_project_id,
    v_edit_plan_id,
    'render_preview',
    'rendering',
    'No-AI FFmpeg preview smoke',
    1,
    jsonb_build_object('rpE2e', true)
  );

  update public.edit_plans
  set credit_estimate_id = v_credit_estimate_id,
      updated_at = now()
  where id = v_edit_plan_id;

  insert into public.credit_approvals (
    workspace_id,
    project_id,
    chat_session_id,
    credit_estimate_id,
    edit_plan_id,
    status,
    approved_by,
    approved_at,
    approval_payload
  )
  values (
    p_workspace_id,
    p_project_id,
    p_chat_session_id,
    v_credit_estimate_id,
    v_edit_plan_id,
    'approved',
    p_created_by_user_id,
    now(),
    jsonb_build_object('rpE2e', true, 'idempotencyKey', p_idempotency_key)
  )
  returning id into v_credit_approval_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'approved',
    'creditWalletId', v_wallet_id,
    'editPlanId', v_edit_plan_id,
    'creditEstimateId', v_credit_estimate_id,
    'creditApprovalId', v_credit_approval_id
  );
end;
$$;

create or replace function public.e2e_transition_job_status(
  p_workspace_id uuid,
  p_project_id uuid,
  p_job_id uuid,
  p_from_status text,
  p_to_status text,
  p_payload_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if public.e2e_json_contains_secret_marker(p_payload_json) then
    raise exception 'E2E_UNSAFE_JOB_EVENT_PAYLOAD: job transition payload contains secret-like fields';
  end if;

  select status::text
  into v_current
  from public.jobs
  where id = p_job_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id
  for update;

  if v_current is null then
    raise exception 'E2E_JOB_NOT_FOUND: job does not exist for workspace/project';
  end if;

  if p_from_status is not null and v_current <> p_from_status then
    raise exception 'E2E_INVALID_JOB_TRANSITION: expected % but found %', p_from_status, v_current;
  end if;

  if not (
    (v_current in ('draft', 'queued', 'waiting_dependency', 'waiting_user_approval', 'waiting_credit_reservation') and p_to_status in ('running', 'blocked', 'failed', 'cancelled'))
    or (v_current = 'running' and p_to_status in ('completed', 'failed', 'blocked', 'retrying', 'cancelled'))
    or (v_current in ('failed', 'blocked') and p_to_status in ('queued', 'cancelled'))
    or (v_current = 'retrying' and p_to_status in ('queued', 'running', 'cancelled'))
  ) then
    raise exception 'E2E_INVALID_JOB_TRANSITION: % to % is not allowed for E2E smoke jobs', v_current, p_to_status;
  end if;

  update public.jobs
  set status = p_to_status::public.job_status,
      updated_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('lastE2eTransition', p_payload_json)
  where id = p_job_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'recorded',
    'jobId', p_job_id,
    'fromStatus', v_current,
    'toStatus', p_to_status
  );
end;
$$;

create or replace function public.e2e_record_credit_refund_placeholder(
  p_workspace_id uuid,
  p_project_id uuid,
  p_credit_reservation_id uuid,
  p_job_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.credit_reservations%rowtype;
  v_refund_id uuid;
  v_existing uuid;
begin
  if p_credit_reservation_id is null or p_job_id is null then
    raise exception 'E2E_REFUND_PLACEHOLDER_MISSING_IDS: credit reservation and job are required';
  end if;

  select *
  into v_reservation
  from public.credit_reservations
  where id = p_credit_reservation_id
    and workspace_id = p_workspace_id
    and project_id = p_project_id;

  if not found then
    raise exception 'E2E_CREDIT_RESERVATION_MISSING: cannot model refund without a reservation';
  end if;

  select id
  into v_existing
  from public.credit_refunds
  where credit_reservation_id = p_credit_reservation_id
    and metadata ->> 'idempotencyKey' = p_idempotency_key
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'status', 'idempotent_replay', 'creditRefundId', v_existing);
  end if;

  insert into public.credit_refunds (
    credit_wallet_id,
    workspace_id,
    project_id,
    credit_reservation_id,
    credit_estimate_id,
    edit_plan_id,
    status,
    refund_amount,
    refund_reason,
    failure_caused_by_reeditpro,
    metadata
  )
  values (
    v_reservation.credit_wallet_id,
    p_workspace_id,
    p_project_id,
    p_credit_reservation_id,
    v_reservation.credit_estimate_id,
    v_reservation.edit_plan_id,
    'pending',
    greatest(v_reservation.reserved_credits - v_reservation.spent_credits - v_reservation.released_credits - v_reservation.refunded_credits, 1),
    coalesce(nullif(trim(p_reason), ''), 'RP-E2E render failure refund placeholder'),
    true,
    jsonb_build_object(
      'rpE2e', true,
      'jobId', p_job_id,
      'idempotencyKey', p_idempotency_key,
      'stripeImplemented', false,
      'billingReconciliationTodo', true
    )
  )
  returning id into v_refund_id;

  perform public.e2e_record_job_event(
    p_workspace_id,
    p_project_id,
    p_job_id,
    'credit_refund_required',
    'Credit refund placeholder recorded for a ReeditPro-caused E2E render failure.',
    null,
    jsonb_build_object('creditRefundId', v_refund_id, 'creditReservationId', p_credit_reservation_id),
    false
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'modeled',
    'creditRefundId', v_refund_id,
    'creditReservationId', p_credit_reservation_id,
    'jobId', p_job_id
  );
end;
$$;

revoke all on function public.e2e_assert_idempotent_request(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.e2e_attach_finalized_media_to_source_sequence(uuid, uuid, uuid, uuid[], uuid, text) from public, anon, authenticated;
revoke all on function public.e2e_create_plan_approval_bundle(uuid, uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.e2e_transition_job_status(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.e2e_record_credit_refund_placeholder(uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.e2e_assert_idempotent_request(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.e2e_attach_finalized_media_to_source_sequence(uuid, uuid, uuid, uuid[], uuid, text) to service_role;
grant execute on function public.e2e_create_plan_approval_bundle(uuid, uuid, uuid, uuid, uuid, text) to service_role;
grant execute on function public.e2e_transition_job_status(uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.e2e_record_credit_refund_placeholder(uuid, uuid, uuid, uuid, text, text) to service_role;

comment on function public.e2e_assert_idempotent_request(uuid, uuid, text, text, text, text) is
'Service-role-only idempotency request hash guard for production-shaped no-AI E2E routes.';
comment on function public.e2e_attach_finalized_media_to_source_sequence(uuid, uuid, uuid, uuid[], uuid, text) is
'Service-role-only finalized media attachment/source sequence setup for the no-AI E2E path.';
comment on function public.e2e_create_plan_approval_bundle(uuid, uuid, uuid, uuid, uuid, text) is
'Service-role-only smoke plan/credit approval bundle creator. It does not implement production billing or provider execution.';
comment on function public.e2e_transition_job_status(uuid, uuid, uuid, text, text, jsonb) is
'Service-role-only strict job transition helper for E2E smoke jobs.';
comment on function public.e2e_record_credit_refund_placeholder(uuid, uuid, uuid, uuid, text, text) is
'Service-role-only refund placeholder for ReeditPro-caused E2E render failures. Stripe/billing reconciliation remains future work.';
