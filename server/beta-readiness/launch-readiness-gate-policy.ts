export type LaunchReadinessStage =
  | 'internal_dry_run'
  | 'bounded_tool_execution'
  | 'external_beta'
  | 'real_user_media_beta'
  | 'paid_production'

export interface LaunchReadinessGatePolicy {
  stage: LaunchReadinessStage
  label: string
  requiredEvidence: string[]
  hardInvariants: string[]
}

export const launchReadinessGatePolicy: LaunchReadinessGatePolicy[] = [
  {
    stage: 'internal_dry_run',
    label: 'Internal dry-run testing',
    requiredEvidence: ['dry_run_e2e_passed', 'safety_docs_exist', 'cost_docs_exist'],
    hardInvariants: ['no_raw_prompts', 'no_secrets', 'no_signed_url_source_truth'],
  },
  {
    stage: 'bounded_tool_execution',
    label: 'Bounded tool execution',
    requiredEvidence: ['approved_plan_snapshot_policy', 'credit_estimate_policy', 'idempotency_policy', 'tool_license_review'],
    hardInvariants: ['approved_snapshot_required', 'credit_reservation_required', 'backend_only_heavy_execution'],
  },
  {
    stage: 'external_beta',
    label: 'External beta',
    requiredEvidence: ['deployment_approval', 'security_approval', 'storage_privacy_approval', 'model_license_approval', 'production_readiness_unblocked'],
    hardInvariants: ['no_silent_billing', 'service_role_backend_only', 'artifact_privacy_policy'],
  },
  {
    stage: 'real_user_media_beta',
    label: 'Real user media beta',
    requiredEvidence: ['external_beta_allowed', 'private_media_approval', 'artifact_privacy_evidence'],
    hardInvariants: ['no_public_artifacts_by_default', 'retention_policy_required', 'user_media_scope_boundaries'],
  },
  {
    stage: 'paid_production',
    label: 'Paid production',
    requiredEvidence: ['real_user_media_beta_allowed', 'production_deployment_approval', 'billing_ledger_persistence_approval', 'cost_controls_approval', 'observability_approval', 'incident_runbook_approval'],
    hardInvariants: ['no_silent_billing', 'transactional_ledger_required', 'rollback_and_incident_response_required'],
  },
]
