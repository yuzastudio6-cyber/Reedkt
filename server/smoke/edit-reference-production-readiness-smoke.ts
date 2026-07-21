import assert from 'node:assert/strict'
import {
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS,
  assertEditReferenceProductionReady,
  createEditReferenceProductionEvidenceSetDigest,
  evaluateEditReferenceProductionReadiness,
  EDIT_REFERENCE_PRODUCTION_EVIDENCE_ADMISSION_VERSION,
  type EditReferenceProductionEvidenceAdmission,
  type EditReferenceProductionGateEvidence,
  type EditReferenceProductionReleaseCandidate,
} from '../edit-references/edit-reference-production-readiness'

const releaseCandidate: EditReferenceProductionReleaseCandidate = {
  releaseCandidateId: 'release-candidate-a',
  sourceCommitSha: '1'.repeat(40),
  deploymentArtifactDigestSha256: '2'.repeat(64),
  environmentId: 'production-us-central1-a',
  environmentTier: 'production',
  evaluatedAt: '2026-07-21T04:00:00.000Z',
}

const empty = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: [],
})
assert.equal(empty.productionReady, false)
assert.equal(empty.decision, 'blocked')
assert.equal(empty.blockers.length, EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.length)
assert.throws(() => assertEditReferenceProductionReady({
  releaseCandidate,
  evidence: [],
}), /not ready for production release/i)

const completeEvidence: EditReferenceProductionGateEvidence[] =
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.map((definition, index) => ({
    gateId: definition.id,
    status: 'verified_live',
    evidenceClass: definition.evidenceClass,
    evidenceId: `live-evidence-${index + 1}`,
    evidenceDigestSha256: (index + 3).toString(16).slice(-1).repeat(64),
    releaseCandidateId: releaseCandidate.releaseCandidateId,
    sourceCommitSha: releaseCandidate.sourceCommitSha,
    deploymentArtifactDigestSha256: releaseCandidate.deploymentArtifactDigestSha256,
    environmentId: releaseCandidate.environmentId,
    observedAt: '2026-07-21T03:59:00.000Z',
    assertions: [...definition.assertions],
    localOrSyntheticEvidenceAccepted: false,
  }))

const structurallyComplete = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: completeEvidence,
})
assert.equal(structurallyComplete.schemaVersion, 'edit-reference-production-readiness-v3')
assert.equal(structurallyComplete.productionReady, false)
assert.equal(structurallyComplete.decision, 'blocked')
assert.equal(structurallyComplete.blockers.length, EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.length)
assert.equal(structurallyComplete.trustedEvidenceAdmissionAccepted, false)
assert.ok(structurallyComplete.gates.every((gate) => (
  gate.reason === 'trusted_live_evidence_admission_missing'
)))
assert.throws(() => assertEditReferenceProductionReady({
  releaseCandidate,
  evidence: completeEvidence,
}), /not ready for production release/i)

const forgedAdmission: EditReferenceProductionEvidenceAdmission = {
  schemaVersion: EDIT_REFERENCE_PRODUCTION_EVIDENCE_ADMISSION_VERSION,
  authorityClass: 'canonical_same_release_edit_reference_evidence',
  sourceAuthority: 'canonical_production_release_evidence_repository',
  releaseCandidateId: releaseCandidate.releaseCandidateId,
  sourceCommitSha: releaseCandidate.sourceCommitSha,
  deploymentArtifactDigestSha256: releaseCandidate.deploymentArtifactDigestSha256,
  environmentId: releaseCandidate.environmentId,
  admittedEvidenceIds: completeEvidence.map((evidence) => evidence.evidenceId),
  evidenceSetDigestSha256: createEditReferenceProductionEvidenceSetDigest(completeEvidence),
  liveEvidenceRepositoryReadVerified: true,
  sameReleaseLineageVerified: true,
  localOrSyntheticEvidenceAccepted: false,
  productionAuthority: true,
}
const forged = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: completeEvidence,
  evidenceAdmission: forgedAdmission,
})
assert.equal(forged.productionReady, false)
assert.equal(forged.trustedEvidenceAdmissionAccepted, false)
assert.ok(forged.gates.every((gate) => (
  gate.reason === 'trusted_live_evidence_admission_unqualified'
)))

const tamperedAdmission = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: completeEvidence,
  evidenceAdmission: {
    ...forgedAdmission,
    evidenceSetDigestSha256: 'f'.repeat(64),
  },
})
assert.equal(tamperedAdmission.productionReady, false)
assert.ok(tamperedAdmission.gates.every((gate) => (
  gate.reason === 'trusted_live_evidence_admission_invalid'
)))

const swappedEvidence = completeEvidence.map((evidence, index) => index === 0
  ? { ...evidence, evidenceDigestSha256: 'e'.repeat(64) }
  : { ...evidence })
const swappedAfterAdmission = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: swappedEvidence,
  evidenceAdmission: forgedAdmission,
})
assert.equal(swappedAfterAdmission.productionReady, false)
assert.ok(swappedAfterAdmission.gates.every((gate) => (
  gate.reason === 'trusted_live_evidence_admission_invalid'
)))
assert.ok(
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS[0]?.assertions.includes(
    'study_chat_reasoning_run_tables_and_atomic_settlement_verified',
  ),
)
assert.ok(
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS[0]?.assertions.includes(
    'server_owned_application_preparation_rpc_v1_verified',
  ),
)
assert.ok(
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS[7]?.assertions.includes(
    'preparation_lost_response_exact_idempotent_recovery_verified',
  ),
)
assert.ok(
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find((gate) => (
    gate.id === 'recovery_and_observability'
  ))?.assertions.includes(
    'same_release_backup_restore_and_rollback_rehearsal_verified',
  ),
)

const prePreparationEvidence = completeEvidence.map((evidence) => {
  if (evidence.gateId === 'canonical_persistence') {
    return {
      ...evidence,
      assertions: evidence.assertions.filter((assertion) => (
        assertion !== 'server_owned_application_preparation_rpc_v1_verified'
      )),
    }
  }
  if (evidence.gateId === 'atomic_application_lifecycle') {
    return {
      ...evidence,
      assertions: evidence.assertions.filter((assertion) => (
        assertion !== 'preparation_lost_response_exact_idempotent_recovery_verified'
      )),
    }
  }
  return { ...evidence }
})
const prePreparation = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: prePreparationEvidence,
})
assert.equal(prePreparation.productionReady, false)
assert.equal(
  prePreparation.gates.find((gate) => gate.gateId === 'canonical_persistence')?.reason,
  'required_assertions_incomplete',
)
assert.equal(
  prePreparation.gates.find((gate) => gate.gateId === 'atomic_application_lifecycle')?.reason,
  'required_assertions_incomplete',
)

const incompleteAssertions = completeEvidence.map((evidence, index) => index === 3
  ? { ...evidence, assertions: evidence.assertions.slice(1) }
  : { ...evidence })
const incomplete = evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: incompleteAssertions,
})
assert.equal(incomplete.productionReady, false)
assert.equal(incomplete.gates[3]?.reason, 'required_assertions_incomplete')
assert.deepEqual(
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS[3]?.assertions,
  [
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
)

const wrongDeployment = completeEvidence.map((evidence, index) => index === 0
  ? { ...evidence, deploymentArtifactDigestSha256: 'f'.repeat(64) }
  : { ...evidence })
assert.equal(evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: wrongDeployment,
}).gates[0]?.reason, 'evidence_release_lineage_mismatch')

const duplicated = completeEvidence.map((evidence, index) => index === 1
  ? { ...evidence, evidenceId: completeEvidence[0]!.evidenceId }
  : { ...evidence })
assert.equal(evaluateEditReferenceProductionReadiness({
  releaseCandidate,
  evidence: duplicated,
}).gates[1]?.reason, 'evidence_id_reused')

assert.equal(evaluateEditReferenceProductionReadiness({
  releaseCandidate: {
    ...releaseCandidate,
    sourceCommitSha: '0'.repeat(40),
  },
  evidence: completeEvidence,
}).productionReady, false)

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: structurallyComplete.schemaVersion,
  requiredProductionGateCount: EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.length,
  localOrSyntheticEvidenceAccepted: structurallyComplete.localOrSyntheticEvidenceAccepted,
  missingEvidenceProductionReady: empty.productionReady,
  structurallyCompleteCallerEvidenceProductionReady: structurallyComplete.productionReady,
  forgedAdmissionProductionReady: forged.productionReady,
  tamperedAdmissionProductionReady: tamperedAdmission.productionReady,
  swappedAfterAdmissionProductionReady: swappedAfterAdmission.productionReady,
  trustedEvidenceAdmissionAccepted: structurallyComplete.trustedEvidenceAdmissionAccepted,
  remoteMutationAttempted: false,
}, null, 2))
