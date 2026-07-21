import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_PRODUCTION_READINESS_VERSION =
  'edit-reference-production-readiness-v3' as const

export const EDIT_REFERENCE_PRODUCTION_EVIDENCE_ADMISSION_VERSION =
  'edit-reference-production-evidence-admission-v1' as const

export const EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS = [
  {
    id: 'canonical_persistence',
    evidenceClass: 'live_supabase_transactional_persistence',
    assertions: [
      'canonical_migration_chain_verified',
      'application_lifecycle_rpc_v3_verified',
      'server_owned_application_preparation_rpc_v1_verified',
      'server_only_application_and_planning_read_rpc_adapters_verified',
      'preparation_reference_dna_qa_and_target_authority_reread_verified',
      'browser_application_record_authority_rejected_verified',
      'browser_command_server_authority_binding_verified',
      'durable_idempotency_and_cas_verified',
      'cross_device_readback_verified',
      'long_form_study_tables_and_composite_rls_verified',
      'study_chat_reasoning_run_tables_and_atomic_settlement_verified',
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
      'pre_plan_study_authority_and_no_edit_authority_fabrication_verified',
      'durable_plan_run_work_item_attempt_checkpoint_output_transactions_verified',
      'study_usage_approval_and_maximum_internal_cost_verified',
      'serializable_claim_one_active_lease_and_digest_only_credential_verified',
      'heartbeat_checkpoint_and_terminal_usage_atomicity_verified',
      'lost_response_expired_lease_and_process_restart_recovery_verified',
      'browser_independent_minutes_or_hours_execution_verified',
      'multi_hour_whole_source_temporal_and_required_stage_coverage_verified',
      'no_fixed_whole_study_timeout_verified',
      'raw_media_signed_url_and_provider_credentials_excluded_verified',
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
      'exact_edit_preference_and_reference_apply_transaction_verified',
      'preparation_creates_unconnected_application_without_plan_invalidation_verified',
      'preparation_lost_response_exact_idempotent_recovery_verified',
      'prepared_application_authority_revalidated_during_atomic_apply_verified',
      'replacement_preparation_preserves_current_application_until_atomic_commit_verified',
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
      'same_release_backup_restore_and_rollback_rehearsal_verified',
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

/**
 * Server-only admission created only after a reviewed same-release evidence
 * repository verifies every live receipt. Structural evidence objects and
 * caller-asserted booleans never qualify an admission.
 */
export interface EditReferenceProductionEvidenceAdmission {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EVIDENCE_ADMISSION_VERSION
  readonly authorityClass: 'canonical_same_release_edit_reference_evidence'
  readonly sourceAuthority: 'canonical_production_release_evidence_repository'
  readonly releaseCandidateId: string
  readonly sourceCommitSha: string
  readonly deploymentArtifactDigestSha256: string
  readonly environmentId: string
  readonly admittedEvidenceIds: readonly string[]
  readonly evidenceSetDigestSha256: string
  readonly liveEvidenceRepositoryReadVerified: true
  readonly sameReleaseLineageVerified: true
  readonly localOrSyntheticEvidenceAccepted: false
  readonly productionAuthority: true
}

export interface EditReferenceProductionReadinessInput {
  readonly releaseCandidate: EditReferenceProductionReleaseCandidate
  readonly evidence: readonly EditReferenceProductionGateEvidence[]
  readonly evidenceAdmission?: EditReferenceProductionEvidenceAdmission
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
  readonly trustedEvidenceAdmissionAccepted: boolean
  readonly localOrSyntheticEvidenceAccepted: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const COMMIT_PATTERN = /^(?!0{40}$)[a-f0-9]{40}$/

// There is intentionally no public qualification function. A future reviewed
// live evidence-repository adapter must be introduced in this module before a
// production admission can enter this set.
const qualifiedEvidenceAdmissions = new WeakSet<EditReferenceProductionEvidenceAdmission>()

export function createEditReferenceProductionEvidenceSetDigest(
  evidence: readonly EditReferenceProductionGateEvidence[],
): string {
  const canonicalEvidence = evidence
    .map((item) => ({
      gateId: item.gateId,
      status: item.status,
      evidenceClass: item.evidenceClass,
      evidenceId: item.evidenceId,
      evidenceDigestSha256: item.evidenceDigestSha256,
      releaseCandidateId: item.releaseCandidateId,
      sourceCommitSha: item.sourceCommitSha,
      deploymentArtifactDigestSha256: item.deploymentArtifactDigestSha256,
      environmentId: item.environmentId,
      observedAt: item.observedAt,
      assertions: [...item.assertions].sort(),
      localOrSyntheticEvidenceAccepted: item.localOrSyntheticEvidenceAccepted,
    }))
    .sort((left, right) => (
      left.gateId.localeCompare(right.gateId)
      || left.evidenceId.localeCompare(right.evidenceId)
    ))
  return createHash('sha256').update(JSON.stringify(canonicalEvidence)).digest('hex')
}

export function evaluateEditReferenceProductionReadiness(
  input: EditReferenceProductionReadinessInput,
): EditReferenceProductionReadinessReport {
  const release = input.releaseCandidate
  const releaseValid = validateReleaseCandidate(release)
  const evidenceAdmissionReason = releaseValid
    ? validateEvidenceAdmission(input.evidenceAdmission, release, input.evidence)
    : 'release_candidate_identity_invalid'
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
      ?? evidenceAdmissionReason
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
  const trustedEvidenceAdmissionAccepted = !evidenceAdmissionReason
  const productionReady = blockers.length === 0
    && input.evidence.length === gates.length
    && trustedEvidenceAdmissionAccepted
  return {
    schemaVersion: EDIT_REFERENCE_PRODUCTION_READINESS_VERSION,
    releaseCandidate: { ...release },
    productionReady,
    decision: productionReady ? 'ready_for_production_release' : 'blocked',
    gates,
    blockers,
    trustedEvidenceAdmissionAccepted,
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
        trustedEvidenceAdmissionAccepted: report.trustedEvidenceAdmissionAccepted,
        localOrSyntheticEvidenceAccepted: false,
        remoteMutationAttempted: false,
      },
    )
  }
  return report
}

function validateEvidenceAdmission(
  admission: EditReferenceProductionEvidenceAdmission | undefined,
  release: EditReferenceProductionReleaseCandidate,
  evidence: readonly EditReferenceProductionGateEvidence[],
): string | undefined {
  if (!admission) return 'trusted_live_evidence_admission_missing'
  const evidenceIds = evidence.map((item) => item.evidenceId).sort()
  const admittedEvidenceIds = [...admission.admittedEvidenceIds].sort()
  if (
    admission.schemaVersion !== EDIT_REFERENCE_PRODUCTION_EVIDENCE_ADMISSION_VERSION
    || admission.authorityClass !== 'canonical_same_release_edit_reference_evidence'
    || admission.sourceAuthority !== 'canonical_production_release_evidence_repository'
    || admission.releaseCandidateId !== release.releaseCandidateId
    || admission.sourceCommitSha !== release.sourceCommitSha
    || admission.deploymentArtifactDigestSha256 !== release.deploymentArtifactDigestSha256
    || admission.environmentId !== release.environmentId
    || !SHA256_PATTERN.test(admission.evidenceSetDigestSha256)
    || admission.evidenceSetDigestSha256
      !== createEditReferenceProductionEvidenceSetDigest(evidence)
    || admission.liveEvidenceRepositoryReadVerified !== true
    || admission.sameReleaseLineageVerified !== true
    || admission.localOrSyntheticEvidenceAccepted !== false
    || admission.productionAuthority !== true
    || JSON.stringify(admittedEvidenceIds) !== JSON.stringify(evidenceIds)
  ) return 'trusted_live_evidence_admission_invalid'
  if (!qualifiedEvidenceAdmissions.has(admission)) {
    return 'trusted_live_evidence_admission_unqualified'
  }
  return undefined
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
