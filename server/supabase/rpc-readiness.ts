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
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      availableRpcs: [],
      missingRpcs: [...REQUIRED_E2E_SERVICE_ROLE_RPCS],
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
