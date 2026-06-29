-- Qwen2.5-VL backend runtime persistence guards.
-- Created from validated local draft database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql.
-- Local history adoption: this file uses the already-applied remote semantic
-- migration version 20260628000100 to avoid duplicate Qwen persistence history.
-- This active migration defines schema guards only; it does not execute Qwen inference, dispatch workers, create generated assets, create signed URLs, or touch provider secrets.

-- Purpose: Qwen2.5-VL backend runtime persistence constraints on top of
-- the existing ReEditPro runtime foundations. This migration reuses approved plan
-- snapshots, credit reservations, jobs, job events, worker runtime configs,
-- worker leases, runtime messages, claim attempts, idempotency, storage object
-- records, signed URL audit events, tool runtime checks, QA, and audit surfaces.
-- Core rule: Qwen workers execute approved snapshots and private source refs,
-- never raw chat, raw prompt payloads, signed URLs, public URLs, or secrets.

do $$
begin
  if to_regclass('public.approved_plan_snapshots') is null
    or to_regclass('public.credit_reservations') is null
    or to_regclass('public.jobs') is null
    or to_regclass('public.job_events') is null
    or to_regclass('public.worker_runtime_configs') is null
    or to_regclass('public.worker_leases') is null
    or to_regclass('public.backend_runtime_messages') is null
    or to_regclass('public.job_claim_attempts') is null
    or to_regclass('public.api_idempotency_keys') is null
    or to_regclass('public.worker_job_claims') is null
    or to_regclass('public.storage_object_records') is null
    or to_regclass('public.signed_url_events') is null
    or to_regclass('public.tool_runtime_checks') is null
  then
    raise exception 'QWEN2_5_VL_REQUIRES_REEDITPRO_RUNTIME_BASELINE';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_jobs_payload_refs_check'
  ) then
    alter table public.jobs
      add constraint qwen25_vl_jobs_payload_refs_check
      check (
        coalesce(input_payload->>'worker_type', metadata->>'worker_type', '') <> 'qwen2_5_vl_cloud_run_gpu_worker'
        or (
          job_type = 'media_analysis'::public.job_type
          and credit_reservation_id is not null
          and idempotency_key is not null
          and input_payload ? 'approved_plan_snapshot_id'
          and input_payload ? 'approved_plan_snapshot_hash'
          and input_payload ? 'private_storage_object_record_id'
          and input_payload ? 'private_storage_checksum'
          and input_payload ? 'structured_finding_ids'
          and input_payload ? 'edit_intent_ids'
          and jsonb_typeof(input_payload->'structured_finding_ids') = 'array'
          and jsonb_typeof(input_payload->'edit_intent_ids') = 'array'
          and input_payload->>'model_id' = 'Qwen/Qwen2.5-VL-7B-Instruct'
          and input_payload->>'model_revision' = 'cc594898137f460bfe9f0759e9844b3ce807cfb5'
          and input_payload->>'selected_gpu' = 'nvidia_l4'
          and input_payload->>'serving_profile' = 'bounded_preview_scale_to_zero'
          and input_payload::text !~* '(rawPrompt|raw_prompt|rawUserChat|raw_user_chat|rawWorkerPrompt|raw_worker_prompt|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|providerApiKey|provider_api_key|serviceRoleKey|service_role_key|secretValue|secret_value|databaseUrl|database_url|rawModelOutput|raw_model_output|generatedLocalFixturePassed|betaReady|productionReady)'
        )
      );
  end if;
end $$;

comment on constraint qwen25_vl_jobs_payload_refs_check on public.jobs is
'Qwen2.5-VL job guard. Qwen jobs must be media_analysis jobs with approved snapshot, credit reservation, idempotency, private storage, checksum, structured finding, and edit intent refs. Payloads must not store raw prompts, signed URLs, public URLs, service URLs, tokens, secrets, raw model output, beta claims, or production claims.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_job_events_sanitized_payload_check'
  ) then
    alter table public.job_events
      add constraint qwen25_vl_job_events_sanitized_payload_check
      check (
        coalesce(payload->>'worker_type', payload->>'tool_id', '') not in ('qwen2_5_vl_cloud_run_gpu_worker', 'qwen2_5_vl_7b_instruct', 'qwen_vl')
        or payload::text !~* '(rawPrompt|raw_prompt|rawWorkerPrompt|raw_worker_prompt|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|providerApiKey|provider_api_key|serviceRoleKey|service_role_key|secretValue|secret_value|databaseUrl|database_url|rawModelOutput|raw_model_output)'
      );
  end if;
end $$;

comment on constraint qwen25_vl_job_events_sanitized_payload_check on public.job_events is
'Qwen2.5-VL event guard. Qwen event payloads are sanitized summaries only.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_worker_runtime_config_check'
  ) then
    alter table public.worker_runtime_configs
      add constraint qwen25_vl_worker_runtime_config_check
      check (
        coalesce(config_payload->>'tool_id', config_payload->>'registry_tool_id', '') not in ('qwen2_5_vl_7b_instruct', 'qwen_vl')
        or (
          gpu_required = true
          and estimated_compute_class = 'nvidia_l4'
          and coalesce(config_payload->>'serving_profile', '') = 'bounded_preview_scale_to_zero'
          and config_payload::text !~* '(serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|providerApiKey|provider_api_key|serviceRoleKey|service_role_key|secretValue|secret_value|databaseUrl|database_url|signedUrl|signed_url)'
        )
      );
  end if;
end $$;

comment on constraint qwen25_vl_worker_runtime_config_check on public.worker_runtime_configs is
'Qwen2.5-VL runtime config guard. Qwen config rows are non-secret L4 scale-to-zero metadata only.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_worker_leases_refs_check'
  ) then
    alter table public.worker_leases
      add constraint qwen25_vl_worker_leases_refs_check
      check (
        worker_kind <> 'qwen2_5_vl_cloud_run_gpu_worker'
        or (
          workspace_id is not null
          and project_id is not null
          and job_id is not null
          and metadata::text !~* '(rawPrompt|raw_prompt|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|serviceRoleKey|service_role_key|secretValue|secret_value)'
        )
      );
  end if;
end $$;

comment on constraint qwen25_vl_worker_leases_refs_check on public.worker_leases is
'Qwen2.5-VL lease guard. Qwen leases require workspace, project, and job refs and sanitized metadata.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_backend_runtime_messages_sanitized_check'
  ) then
    alter table public.backend_runtime_messages
      add constraint qwen25_vl_backend_runtime_messages_sanitized_check
      check (
        target <> 'qwen2_5_vl_private_invoke'
        or (
          job_id is not null
          and workspace_id is not null
          and project_id is not null
          and idempotency_key is not null
          and payload::text !~* '(rawPrompt|raw_prompt|rawWorkerPrompt|raw_worker_prompt|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|providerApiKey|provider_api_key|serviceRoleKey|service_role_key|secretValue|secret_value|databaseUrl|database_url|rawModelOutput|raw_model_output)'
          and coalesce(response_payload::text, '') !~* '(rawModelOutput|raw_model_output|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|secretValue|secret_value)'
          and coalesce(error_payload::text, '') !~* '(identityToken|idToken|accessToken|authHeader|bearer|secretValue|secret_value|serviceRoleKey|service_role_key)'
        )
      );
  end if;
end $$;

comment on constraint qwen25_vl_backend_runtime_messages_sanitized_check on public.backend_runtime_messages is
'Qwen2.5-VL transport guard. Runtime messages store only sanitized private invoke summaries.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'qwen25_vl_job_claim_attempts_sanitized_check'
  ) then
    alter table public.job_claim_attempts
      add constraint qwen25_vl_job_claim_attempts_sanitized_check
      check (
        worker_kind <> 'qwen2_5_vl_cloud_run_gpu_worker'
        or metadata::text !~* '(rawPrompt|raw_prompt|signedUrl|signed_url|publicUrl|public_url|serviceUrl|service_url|identityToken|idToken|accessToken|authHeader|bearer|serviceRoleKey|service_role_key|secretValue|secret_value)'
      );
  end if;
end $$;

comment on constraint qwen25_vl_job_claim_attempts_sanitized_check on public.job_claim_attempts is
'Qwen2.5-VL claim-attempt guard. Claim metadata stays sanitized.';

-- Qwen needs a tool runtime check entry, but the active
-- RP-E2E check currently limits tool_name to deterministic editing tools.
-- This migration expands the check constraint rather than creating a parallel table.
alter table public.tool_runtime_checks
  drop constraint if exists tool_runtime_checks_tool_name_check;

alter table public.tool_runtime_checks
  add constraint tool_runtime_checks_tool_name_check
  check (
    tool_name in (
      'ffmpeg',
      'ffprobe',
      'remotion',
      'sharp_libvips',
      'audioflux',
      'signalsmith_stretch',
      'opencv',
      'vapoursynth',
      'playwright',
      'qwen_vl'
    )
  );

create index if not exists jobs_qwen_worker_type_idx
on public.jobs ((input_payload->>'worker_type'))
where input_payload->>'worker_type' = 'qwen2_5_vl_cloud_run_gpu_worker';

create index if not exists jobs_qwen_approved_snapshot_ref_idx
on public.jobs ((input_payload->>'approved_plan_snapshot_id'))
where input_payload->>'worker_type' = 'qwen2_5_vl_cloud_run_gpu_worker';

create index if not exists backend_runtime_messages_qwen_target_idx
on public.backend_runtime_messages(target, status)
where target = 'qwen2_5_vl_private_invoke';

create index if not exists worker_leases_qwen_active_idx
on public.worker_leases(job_id, status)
where worker_kind = 'qwen2_5_vl_cloud_run_gpu_worker'
  and status in ('claimed', 'active', 'renewed');

create index if not exists api_idempotency_keys_qwen_request_path_idx
on public.api_idempotency_keys(request_path, request_hash)
where request_path = '/api/jobs/qwen2-5-vl/private-invoke/dispatch';

comment on table public.jobs is
'Job orchestration records. Qwen2.5-VL constraints require approved snapshot refs, credit reservation, idempotency, private source refs, and sanitized payload summaries before future dispatch.';
comment on table public.backend_runtime_messages is
'Runtime transport envelopes. Qwen2.5-VL constraints require sanitized summaries only and no service URL, token, secret, signed URL, public URL, or raw output payload values.';
comment on table public.tool_runtime_checks is
'Worker tool readiness checks. Qwen2.5-VL support adds qwen_vl as metadata-only readiness evidence, not model execution.';
