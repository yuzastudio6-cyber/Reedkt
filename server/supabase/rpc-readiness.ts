import type { SupabaseClient } from '@supabase/supabase-js'

export const REQUIRED_E2E_SERVICE_ROLE_RPCS = [
  'e2e_create_approved_plan_snapshot',
  'e2e_reserve_credits_for_smoke',
  'e2e_create_job_batch_and_render_job',
  'e2e_claim_worker_job',
  'e2e_release_worker_job_claim',
  'e2e_record_job_event',
  'e2e_record_preview_storage_object',
  'e2e_record_preview_render_result',
  'e2e_record_preview_qa_result',
  'e2e_complete_render_job_preview_ready',
  'e2e_assert_idempotent_request',
  'e2e_attach_finalized_media_to_source_sequence',
  'e2e_create_plan_approval_bundle',
  'e2e_transition_job_status',
  'e2e_record_credit_refund_placeholder',
] as const

export interface RpcReadinessResult {
  ok: boolean
  checkedAt: string
  availableRpcs: string[]
  missingRpcs: string[]
  warnings: string[]
}

export async function checkE2EServiceRoleRpcReadiness(client: SupabaseClient): Promise<RpcReadinessResult> {
  const warnings: string[] = []
  const informationSchemaResult = await readRoutinesFromInformationSchema(client)

  if (!informationSchemaResult.ok) {
    warnings.push(informationSchemaResult.warning)
    const probeResult = await probeRpcsSafely(client)
    warnings.push(...probeResult.warnings)

    return {
      ok: probeResult.missingRpcs.length === 0,
      checkedAt: new Date().toISOString(),
      availableRpcs: probeResult.availableRpcs,
      missingRpcs: probeResult.missingRpcs,
      warnings,
    }
  }

  const availableSet = new Set(informationSchemaResult.availableRpcs)
  const availableRpcs = REQUIRED_E2E_SERVICE_ROLE_RPCS.filter((rpcName) => availableSet.has(rpcName))
  const missingRpcs = REQUIRED_E2E_SERVICE_ROLE_RPCS.filter((rpcName) => !availableSet.has(rpcName))

  return {
    ok: missingRpcs.length === 0,
    checkedAt: new Date().toISOString(),
    availableRpcs,
    missingRpcs,
    warnings,
  }
}

const RPC_PROBES: Record<(typeof REQUIRED_E2E_SERVICE_ROLE_RPCS)[number], Record<string, unknown>> = {
  e2e_create_approved_plan_snapshot: {
    p_workspace_id: null,
    p_project_id: null,
    p_chat_session_id: null,
    p_edit_plan_id: null,
    p_credit_estimate_id: null,
    p_credit_approval_id: null,
    p_credit_reservation_id: null,
    p_approved_by_user_id: null,
    p_snapshot_json: {},
    p_plan_hash: 'readiness-probe',
    p_credit_hash: 'readiness-probe',
    p_source_sequence_hash: 'readiness-probe',
    p_timing_hash: 'readiness-probe',
    p_idempotency_key: '',
  },
  e2e_reserve_credits_for_smoke: {
    p_workspace_id: null,
    p_project_id: null,
    p_credit_wallet_id: null,
    p_credit_estimate_id: null,
    p_credit_approval_id: null,
    p_amount: 0,
    p_idempotency_key: '',
  },
  e2e_create_job_batch_and_render_job: {
    p_workspace_id: null,
    p_project_id: null,
    p_chat_session_id: null,
    p_edit_plan_id: null,
    p_approved_plan_snapshot_id: null,
    p_credit_estimate_id: null,
    p_credit_reservation_id: null,
    p_render_type: 'preview',
    p_idempotency_key: '',
  },
  e2e_claim_worker_job: {
    p_workspace_id: null,
    p_project_id: null,
    p_job_id: null,
    p_worker_type: 'readiness_probe',
    p_worker_instance_id: 'readiness_probe',
    p_lease_seconds: 1,
    p_attempt_number: 1,
    p_idempotency_key: '',
  },
  e2e_release_worker_job_claim: {
    p_claim_id: null,
    p_job_id: null,
    p_worker_instance_id: 'readiness_probe',
    p_release_status: 'released',
  },
  e2e_record_job_event: {
    p_workspace_id: null,
    p_project_id: null,
    p_job_id: null,
    p_event_name: 'readiness_probe',
    p_event_message: 'readiness probe',
    p_progress_percent: 0,
    p_payload_json: {},
    p_visible_to_user: false,
  },
  e2e_record_preview_storage_object: {
    p_workspace_id: null,
    p_project_id: null,
    p_render_id: null,
    p_bucket_name: '',
    p_object_path: '',
    p_size_bytes: 0,
    p_checksum_sha256: '',
    p_region: 'us-east1',
  },
  e2e_record_preview_render_result: {
    p_workspace_id: null,
    p_project_id: null,
    p_render_job_id: null,
    p_job_id: null,
    p_edit_plan_id: null,
    p_approved_plan_snapshot_id: null,
    p_credit_reservation_id: null,
    p_preview_storage_object_id: null,
    p_duration_seconds: 0,
    p_size_bytes: 0,
    p_checksum_sha256: '',
    p_metadata_json: {},
  },
  e2e_record_preview_qa_result: {
    p_workspace_id: null,
    p_project_id: null,
    p_render_id: null,
    p_job_id: null,
    p_overall_status: 'passed',
    p_summary: 'readiness probe',
    p_checks_json: [],
  },
  e2e_complete_render_job_preview_ready: {
    p_workspace_id: null,
    p_project_id: null,
    p_job_id: null,
    p_render_job_id: null,
    p_render_id: null,
    p_qa_report_id: null,
    p_preview_storage_object_id: null,
  },
  e2e_assert_idempotent_request: {
    p_workspace_id: null,
    p_user_id: null,
    p_idempotency_key: '',
    p_request_method: 'POST',
    p_request_path: '/readiness-probe',
    p_request_hash: 'readiness-probe',
  },
  e2e_attach_finalized_media_to_source_sequence: {
    p_workspace_id: null,
    p_project_id: null,
    p_chat_session_id: null,
    p_media_asset_ids: null,
    p_requested_by_user_id: null,
    p_idempotency_key: '',
  },
  e2e_create_plan_approval_bundle: {
    p_workspace_id: null,
    p_project_id: null,
    p_chat_session_id: null,
    p_created_by_user_id: null,
    p_source_sequence_id: null,
    p_idempotency_key: '',
  },
  e2e_transition_job_status: {
    p_workspace_id: null,
    p_project_id: null,
    p_job_id: null,
    p_from_status: null,
    p_to_status: 'running',
    p_payload_json: {},
  },
  e2e_record_credit_refund_placeholder: {
    p_workspace_id: null,
    p_project_id: null,
    p_credit_reservation_id: null,
    p_job_id: null,
    p_reason: 'readiness probe',
    p_idempotency_key: '',
  },
}

async function probeRpcsSafely(
  client: SupabaseClient,
): Promise<{ availableRpcs: string[]; missingRpcs: string[]; warnings: string[] }> {
  const availableRpcs: string[] = []
  const missingRpcs: string[] = []
  const warnings = ['Falling back to safe no-write RPC probes because information_schema routine lookup is unavailable.']

  for (const rpcName of REQUIRED_E2E_SERVICE_ROLE_RPCS) {
    const { error } = await client.rpc(rpcName, RPC_PROBES[rpcName])

    if (!error) {
      availableRpcs.push(rpcName)
      warnings.push(`${rpcName} unexpectedly returned success during readiness probe; review probe arguments before enabling write smokes.`)
      continue
    }

    const message = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
    if (message.includes('could not find the function') || message.includes('function') && message.includes('not found')) {
      missingRpcs.push(rpcName)
      continue
    }

    availableRpcs.push(rpcName)
  }

  return { availableRpcs, missingRpcs, warnings }
}

async function readRoutinesFromInformationSchema(
  client: SupabaseClient,
): Promise<{ ok: true; availableRpcs: string[] } | { ok: false; warning: string }> {
  try {
    const { data, error } = await client
      .schema('information_schema')
      .from('routines')
      .select('routine_name')
      .eq('specific_schema', 'public')
      .in('routine_name', [...REQUIRED_E2E_SERVICE_ROLE_RPCS])

    if (error) {
      return {
        ok: false,
        warning: `information_schema routine lookup unavailable; RPC presence could not be verified (${error.message}).`,
      }
    }

    return {
      ok: true,
      availableRpcs: (data ?? [])
        .map((row) => String((row as { routine_name?: unknown }).routine_name ?? ''))
        .filter(Boolean),
    }
  } catch (error) {
    return {
      ok: false,
      warning: `information_schema routine lookup threw; RPC presence could not be verified (${error instanceof Error ? error.message : 'unknown error'}).`,
    }
  }
}
