import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_READINESS_VERSION =
  'edit-reference-production-readiness-v1' as const

export const EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS = [
  {
    id: 'canonical_persistence',
    evidenceClass: 'live_supabase_transactional_persistence',
    assertions: [
      'canonical_migration_chain_verified',
      'application_lifecycle_rpc_v3_verified',
      'server_only_application_and_planning_read_rpc_adapters_verified',
      'durable_idempotency_and_cas_verified',
      'cross_device_readback_verified',
      'private_local_fallback_disabled_in_production',
    ],
  },
  {
    id: 'tenant_auth_and_rls',
    evidenceClass: 'live_auth_rls_isolation',
    assertions: [
      'real_bearer_auth_verified',
      'workspace_membership_verified',
      'composite_workspace_project_edit_bindings_verified',
      'forced_rls_verified',
      'two_user_two_workspace_isolation_verified',
    ],
  },
  {
    id: 'private_resumable_media',
    evidenceClass: 'live_private_distributed_media',
    assertions: [
      'immutable_original_checksum_verified',
      'large_resumable_upload_and_recovery_verified',
      'analysis_proxy_and_original_resolution_crop_lineage_verified',
      'private_storage_iam_and_signed_access_verified',
      'retention_and_cleanup_verified',
    ],
  },
  {
    id: 'durable_long_form_study',
    evidenceClass: 'live_durable_long_form_study',
    assertions: [
      'durable_queue_lease_and_checkpoint_verified',
      'browser_independent_minutes_or_hours_execution_verified',
      'multi_hour_restart_resume_verified',
      'whole_source_temporal_and_required_stage_coverage_verified',
      'no_fixed_whole_study_timeout_verified',
    ],
  },
  {
    id: 'model_routing_and_fallback',
    evidenceClass: 'live_reasoning_and_visual_provider_routing',
    assertions: [
      'kimi_k3_primary_reasoning_verified',
      'qwen_3_7_reasoning_fallback_verified',
      'deepseek_v4_pro_final_reasoning_fallback_verified',
      'qwen_2_5_vl_visual_specialist_verified',
      'attempt_receipts_timeout_and_fallback_recovery_verified',
    ],
  },
  {
    id: 'internal_cost_authority',
    evidenceClass: 'live_internal_cost_accounting',
    assertions: [
      'versioned_rate_cards_verified',
      'maximum_authorized_internal_cost_verified',
      'attempt_failure_retry_and_cancellation_cost_verified',
      'provider_and_infrastructure_usage_attribution_verified',
      'customer_price_and_credits_separate_verified',
    ],
  },
  {
    id: 'dna_qa_and_approval',
    evidenceClass: 'live_preference_dna_approval_lineage',
    assertions: [
      'evidence_to_immutable_dna_version_verified',
      'copy_safety_and_non_transferable_rules_verified',
      'qa_result_and_explicit_user_approval_verified',
      'study_completion_never_applies_verified',
      'approved_version_readback_verified',
    ],
  },
  {
    id: 'atomic_application_lifecycle',
    evidenceClass: 'live_atomic_preference_application',
    assertions: [
      'apply_replace_remove_atomicity_verified',
      'exact_output_frame_transactional_reread_verified',
      'draft_plan_estimate_invalidation_verified',
      'approved_snapshot_and_history_preservation_verified',
      'concurrent_replay_and_stale_revision_rejection_verified',
    ],
  },
  {
    id: 'canonical_planning_authority',
    evidenceClass: 'live_exact_edit_planning_authority',
    assertions: [
      'zero_or_one_connected_application_verified',
      'exact_edit_preferences_and_edit_brief_binding_verified',
      'approved_dna_qa_application_lineage_binding_verified',
      'legacy_preference_intelligence_authority_excluded_verified',
      'explicit_clear_vs_never_selected_planning_state_verified',
      'output_frame_and_target_study_binding_verified',
      'fresh_plan_and_one_estimate_verified',
      'raw_reference_media_excluded_from_planner_context_verified',
    ],
  },
  {
    id: 'recovery_and_observability',
    evidenceClass: 'live_recovery_audit_and_observability',
    assertions: [
      'lost_response_and_webhook_replay_verified',
      'job_retry_cancel_and_resume_verified',
      'append_only_audit_and_restore_verified',
      'point_in_time_recovery_verified',
      'no_duplicate_execution_or_charge_verified',
    ],
  },
  {
    id: 'same_source_browser_backend_acceptance',
    evidenceClass: 'live_same_source_browser_backend_acceptance',
    assertions: [
      'real_sign_in_and_workspace_scope_verified',
      'library_create_chat_upload_study_resume_verified',
      'evidence_dna_qa_and_approval_verified',
      'exact_named_edit_apply_remove_and_replan_verified',
      'error_retry_keyboard_responsive_and_reload_verified',
    ],
  },
  {
    id: 'security_and_release',
    evidenceClass: 'live_security_and_release_verification',
    assertions: [
      'secret_scan_and_dependency_disposition_verified',
      'storage_cors_iam_and_security_advisor_verified',
      'protected_same_sha_deployment_verified',
      'private_media_and_provider_payload_non_disclosure_verified',
      'release_rollback_verified',
    ],
  },
] as const

export type EditReferenceProductionGateDefinition =
  typeof EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS[number]
export type EditReferenceProductionGateId = EditReferenceProductionGateDefinition['id']
export type EditReferenceProductionEvidenceClass =
  EditReferenceProductionGateDefinition['evidenceClass']

export interface EditReferenceProductionReleaseCandidate {
  readonly releaseCandidateId: string
  readonly sourceCommitSha: string
  readonly deploymentArtifactDigestSha256: string
  readonly environmentId: string
  readonly environmentTier: 'production'
  readonly evaluatedAt: string
}

export interface EditReferenceProductionGateEvidence {
  readonly gateId: EditReferenceProductionGateId
  readonly status: 'verified_live'
  readonly evidenceClass: EditReferenceProductionEvidenceClass
  readonly evidenceId: string
  readonly evidenceDigestSha256: string
  readonly releaseCandidateId: string
  readonly sourceCommitSha: string
  readonly deploymentArtifactDigestSha256: string
  readonly environmentId: string
  readonly observedAt: string
  readonly assertions: readonly string[]
  readonly localOrSyntheticEvidenceAccepted: false
}

export interface EditReferenceProductionReadinessInput {
  readonly releaseCandidate: EditReferenceProductionReleaseCandidate
  readonly evidence: readonly EditReferenceProductionGateEvidence[]
}

export interface EditReferenceProductionGateResult {
  readonly gateId: EditReferenceProductionGateId
  readonly ready: boolean
  readonly reason: string
  readonly evidenceId?: string
}

export interface EditReferenceProductionReadinessReport {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_READINESS_VERSION
  readonly releaseCandidate: EditReferenceProductionReleaseCandidate
  readonly productionReady: boolean
  readonly decision: 'ready_for_production_release' | 'blocked'
  readonly gates: readonly EditReferenceProductionGateResult[]
  readonly blockers: readonly EditReferenceProductionGateId[]
  readonly localOrSyntheticEvidenceAccepted: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const COMMIT_PATTERN = /^(?!0{40}$)[a-f0-9]{40}$/

export function evaluateEditReferenceProductionReadiness(
  input: EditReferenceProductionReadinessInput,
): EditReferenceProductionReadinessReport {
  const release = input.releaseCandidate
  const releaseValid = validateReleaseCandidate(release)
  const evidenceIds = new Set<string>()
  const evidenceByGate = new Map<EditReferenceProductionGateId, EditReferenceProductionGateEvidence>()
  for (const evidence of input.evidence) {
    if (evidenceByGate.has(evidence.gateId)) continue
    evidenceByGate.set(evidence.gateId, evidence)
  }

  const gates = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.map((definition) => {
    const evidence = evidenceByGate.get(definition.id)
    if (!releaseValid) return blocked(definition.id, 'release_candidate_identity_invalid')
    if (!evidence) return blocked(definition.id, 'verified_live_evidence_missing')
    if (evidenceIds.has(evidence.evidenceId)) return blocked(definition.id, 'evidence_id_reused')
    evidenceIds.add(evidence.evidenceId)
    const reason = validateEvidence(definition, evidence, release)
    return reason
      ? blocked(definition.id, reason)
      : {
          gateId: definition.id,
          ready: true,
          reason: 'verified_live',
          evidenceId: evidence.evidenceId,
        }
  })
  const blockers = gates.filter((gate) => !gate.ready).map((gate) => gate.gateId)
  const productionReady = blockers.length === 0 && input.evidence.length === gates.length
  return {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_READINESS_VERSION,
    releaseCandidate: { ...release },
    productionReady,
    decision: productionReady ? 'ready_for_production_release' : 'blocked',
    gates,
    blockers,
    localOrSyntheticEvidenceAccepted: false,
  }
}

export function assertEditReferenceProductionReady(
  input: EditReferenceProductionReadinessInput,
): EditReferenceProductionReadinessReport {
  const report = evaluateEditReferenceProductionReadiness(input)
  if (!report.productionReady) {
    throw new ApiError(
      'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
      'Edit Preferences and Edit Reference are not ready for production release.',
      503,
      {
        blockers: report.blockers,
        localOrSyntheticEvidenceAccepted: false,
        remoteMutationAttempted: false,
      },
    )
  }
  return report
}

function validateReleaseCandidate(release: EditReferenceProductionReleaseCandidate): boolean {
  return ID_PATTERN.test(release.releaseCandidateId)
    && COMMIT_PATTERN.test(release.sourceCommitSha)
    && SHA256_PATTERN.test(release.deploymentArtifactDigestSha256)
    && ID_PATTERN.test(release.environmentId)
    && release.environmentTier === 'production'
    && Number.isFinite(Date.parse(release.evaluatedAt))
}

function validateEvidence(
  definition: EditReferenceProductionGateDefinition,
  evidence: EditReferenceProductionGateEvidence,
  release: EditReferenceProductionReleaseCandidate,
): string | undefined {
  if (
    evidence.gateId !== definition.id
    || evidence.status !== 'verified_live'
    || evidence.evidenceClass !== definition.evidenceClass
    || evidence.localOrSyntheticEvidenceAccepted !== false
  ) return 'evidence_class_or_status_invalid'
  if (
    !ID_PATTERN.test(evidence.evidenceId)
    || !SHA256_PATTERN.test(evidence.evidenceDigestSha256)
    || !Number.isFinite(Date.parse(evidence.observedAt))
    || Date.parse(evidence.observedAt) > Date.parse(release.evaluatedAt)
  ) return 'evidence_identity_or_time_invalid'
  if (
    evidence.releaseCandidateId !== release.releaseCandidateId
    || evidence.sourceCommitSha !== release.sourceCommitSha
    || evidence.deploymentArtifactDigestSha256 !== release.deploymentArtifactDigestSha256
    || evidence.environmentId !== release.environmentId
  ) return 'evidence_release_lineage_mismatch'
  if (
    evidence.assertions.length !== definition.assertions.length
    || JSON.stringify([...evidence.assertions].sort()) !== JSON.stringify([...definition.assertions].sort())
  ) return 'required_assertions_incomplete'
  return undefined
}

function blocked(gateId: EditReferenceProductionGateId, reason: string): EditReferenceProductionGateResult {
  return { gateId, ready: false, reason }
}
