import assert from 'node:assert/strict'

import type {
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation'
import {
  classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement,
  compileLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation,
  verifyLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation,
} from '../living-frame/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation'
import {
  input as readinessInput,
  readiness,
} from './living-frame-controlled-image-selected-scene-full-frame-evidence-readiness-smoke'
const input = {
  fullFrameEvidenceReadiness: readiness,
  fullFrameEvidenceReadinessInput: readinessInput,
} as const
const reconciliation =
  await compileLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
    reconciliation,
    input,
  ),
  true,
)
assert.equal(
  reconciliation.reconciliationState,
  'canonical_continuity_reference_and_fact_evidence_interfaces_pending',
)
assert.equal(
  reconciliation.continuityRequirements
    .semanticStyleContinuityQaRequired,
  true,
)
assert.equal(
  reconciliation.continuityRequirements
    .referenceConditioningRequired,
  false,
)
assert.equal(
  reconciliation.continuityRequirements
    .canonicalPersistedReferenceArtifactRequired,
  false,
)
assert.equal(
  reconciliation.continuityRequirements
    .alignedSameViewMeasurementRequiredAtThisStage,
  false,
)
assert.equal(
  reconciliation.continuityRequirements
    .alignedSameViewMeasurementEligibility,
  'not_applicable_without_reference_conditioning',
)
assert.equal(
  reconciliation.continuityRequirements
    .generalSemanticStyleQaMustNotBeRelabeledAsAlignedMeasurement,
  true,
)
assert.equal(
  reconciliation.factAndProvenanceRequirements.sourceTruthMode,
  'canonical_illustrative_interpretation',
)
assert.equal(
  reconciliation.factAndProvenanceRequirements
    .factEvidenceRequirement,
  'illustrative_or_fictional_provenance_guard_required',
)
assert.equal(
  reconciliation.factAndProvenanceRequirements
    .canonicalDocumentaryFactSafetySnapshotRequired,
  false,
)
for (const exactMode of [
  'exact_geography_verification_required',
  'exact_data_verification_required',
  'documentary_source_verification_required',
] as const) {
  assert.equal(
    classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement(
      exactMode,
    ),
    'canonical_documentary_fact_safety_snapshot_required',
  )
}
assert.equal(
  classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement(
    'controlled_source_expectation',
  ),
  'controlled_source_revalidation_required',
)
assert.equal(
  classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement(
    'unknown_blocked',
  ),
  'unknown_source_truth_blocks_promotion',
)
assert.equal(
  reconciliation.factAndProvenanceRequirements
    .generatedIllustrationMayBePresentedAsAuthenticArchiveOrDocumentaryEvidence,
  false,
)
assert.equal(
  reconciliation.missingCanonicalBridgeInputs
    .validatedVisualContinuityPackPayloadOrImmutableArtifactBinding,
  true,
)
assert.equal(
  reconciliation.missingCanonicalBridgeInputs
    .canonicalSemanticStyleContinuityQaOwnerBinding,
  true,
)
assert.equal(
  reconciliation.missingCanonicalBridgeInputs
    .canonicalReferenceArtifactSnapshotSceneComponentViewManifestAndAlignmentBinding,
  false,
)
assert.equal(
  reconciliation.missingCanonicalBridgeInputs
    .documentaryFactSafetyPlanSnapshotOrImmutableClaimBinding,
  false,
)
assert.equal(
  reconciliation.fixedRuntimeAndRegistryPolicy
    .exactModelArtifactByteLength,
  11_700_367_157,
)
assert.equal(
  reconciliation.fixedRuntimeAndRegistryPolicy
    .fiveGpuCapabilityRolesCreateOneCostEvent,
  true,
)
assert.equal(
  reconciliation.fixedRuntimeAndRegistryPolicy
    .registryExpansionPermittedForReleasedDistinctExecutables,
  true,
)
assert.equal(reconciliation.artifactPersisted, false)
assert.equal(reconciliation.semanticVisualQaExecuted, false)
assert.equal(reconciliation.documentaryFactSafetyRevalidated, false)
assert.equal(reconciliation.assetManifestMutated, false)
assert.equal(reconciliation.privateReviewApproved, false)
assert.equal(reconciliation.renderAuthorized, false)
assert.equal(reconciliation.finalCanvasCreatedByComfyUi, false)
assert.equal(reconciliation.productionReady, false)

const serialized = JSON.stringify(reconciliation)
for (const forbidden of [
  '"bytes":',
  '"path":',
  '"url":',
  '"prompt":',
  '"seed":',
  '"modelAlias":',
  '"command":',
  '"environment":',
  'private-reference.png',
  'https://',
  'file://',
  '/tmp/',
  'musashi',
  'hormuz',
  'helicopter',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

let adversarialAssertions = 0

const promotedAlias = structuredClone(reconciliation)
;(promotedAlias.continuityRequirements as {
  privatePromptImageAliasIsCanonicalArtifactEvidence: boolean
}).privatePromptImageAliasIsCanonicalArtifactEvidence = true
assert.equal(await verify(promotedAlias), false)
adversarialAssertions += 1

const promotedMeasurement = structuredClone(reconciliation)
;(promotedMeasurement.continuityRequirements as {
  alignedSameViewMeasurementRequiredAtThisStage: boolean
}).alignedSameViewMeasurementRequiredAtThisStage = true
assert.equal(await verify(promotedMeasurement), false)
adversarialAssertions += 1

const promotedFactAuthority = structuredClone(reconciliation)
;(promotedFactAuthority.factAndProvenanceRequirements as {
  documentaryFactSafetyPlanAvailableInCanonicalSelectedSceneComponents:
    boolean
}).documentaryFactSafetyPlanAvailableInCanonicalSelectedSceneComponents =
  true
assert.equal(await verify(promotedFactAuthority), false)
adversarialAssertions += 1

const promotedReference = structuredClone(reconciliation)
;(promotedReference as {
  canonicalReferenceArtifactResolved: boolean
}).canonicalReferenceArtifactResolved = true
assert.equal(await verify(promotedReference), false)
adversarialAssertions += 1

const finalCanvasClaim = structuredClone(reconciliation)
;(finalCanvasClaim as {
  finalCanvasCreatedByComfyUi: boolean
}).finalCanvasCreatedByComfyUi = true
assert.equal(await verify(finalCanvasClaim), false)
adversarialAssertions += 1

const crossOutput = structuredClone(reconciliation)
;(crossOutput.exactOutputLineage as {
  outputCandidateId: string
}).outputCandidateId = 'cross-output.substitution'
assert.equal(await verify(crossOutput), false)
adversarialAssertions += 1

assert.equal(adversarialAssertions, 6)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    reconciliationState: reconciliation.reconciliationState,
    semanticStyleContinuityQaRequired:
      reconciliation.continuityRequirements
        .semanticStyleContinuityQaRequired,
    referenceConditioningRequired:
      reconciliation.continuityRequirements
        .referenceConditioningRequired,
    alignedSameViewMeasurementRequiredAtThisStage:
      reconciliation.continuityRequirements
        .alignedSameViewMeasurementRequiredAtThisStage,
    factEvidenceRequirement:
      reconciliation.factAndProvenanceRequirements
        .factEvidenceRequirement,
    oneGpuAttemptCostEvent:
      reconciliation.fixedRuntimeAndRegistryPolicy
        .fiveGpuCapabilityRolesCreateOneCostEvent,
    registryExpansionPermitted:
      reconciliation.fixedRuntimeAndRegistryPolicy
        .registryExpansionPermittedForReleasedDistinctExecutables,
    productionReady: false,
    adversarialAssertions,
  })}\n`,
)

async function verify(
  value:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation,
): Promise<boolean> {
  return verifyLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
    value,
    input,
  )
}
