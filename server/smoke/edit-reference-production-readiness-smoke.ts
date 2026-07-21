import assert from 'node:assert/strict'
import {
  EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS,
  assertEditReferenceProductionReady,
  evaluateEditReferenceProductionReadiness,
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

const complete = assertEditReferenceProductionReady({
  releaseCandidate,
  evidence: completeEvidence,
})
assert.equal(complete.schemaVersion, 'edit-reference-production-readiness-v2')
assert.equal(complete.productionReady, true)
assert.equal(complete.decision, 'ready_for_production_release')
assert.equal(complete.blockers.length, 0)

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
  contractVersion: complete.schemaVersion,
  requiredProductionGateCount: EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.length,
  localOrSyntheticEvidenceAccepted: complete.localOrSyntheticEvidenceAccepted,
  missingEvidenceProductionReady: empty.productionReady,
  fullyVerifiedFixtureProductionReady: complete.productionReady,
  remoteMutationAttempted: false,
}, null, 2))
