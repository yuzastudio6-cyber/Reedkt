import type { WorkerRuntimeGapMap, WorkerRuntimeNextPhasePlan } from './worker-runtime-audit-types'

export function buildWorkerRuntimeNextPhasePlan(gapMap: WorkerRuntimeGapMap): WorkerRuntimeNextPhasePlan {
  return {
    phase: 'WORKER_1',
    title: 'Approved-plan snapshot worker dry-run',
    readiness: gapMap.worker1Readiness,
    allowedActions: [
      'load_committed_plan_snapshot_1_candidate_evidence',
      'build_local_nonexecuting_worker_job_payloads',
      'simulate_claim_lease_heartbeat_event_transitions_as_json_only',
      'validate_private_artifact_manifest_scope',
      'record_owner_handoff_review_states',
      'produce_local_and_private_gcs_json_evidence_when_guarded',
    ],
    blockedActions: [
      'real_worker_dispatch',
      'tool_execution',
      'provider_calls',
      'route_execution',
      'runtime_execution',
      'media_processing',
      'browser_map_web_execution',
      'sql_migration_schema_rls_change',
      'supabase_product_row_write',
      'public_artifact_creation',
      'signed_url_source_of_truth',
      'production_or_external_beta_unlock',
      'raw_prompt_execution',
    ],
    requiredInputs: [
      'PLAN-SNAPSHOT-1 committed candidate-only evidence from PR #334',
      'WORKER-0 worker schema, claim/lease, artifact, event log, and gap-map reports',
      'explicit WORKER-1 dry-run confirmation gates',
      'approved private artifact prefixes for sanitized JSON only',
    ],
    successCriteria: [
      'worker dry-run consumes candidate snapshot without changing runtime approval state',
      'simulated job payloads reference candidate snapshot IDs and idempotency keys',
      'claim/lease/event transitions are local evidence only',
      'no provider, tool, worker, route, media, SQL, Supabase product-row, public artifact, or signed URL execution occurs',
      'future real-runtime blockers remain visible and bounded',
    ],
    supersedingApprovalRequiredForRealRuntime: true,
  }
}
