import assert from 'node:assert/strict'
import {
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
  LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
  type LivingFrameActiveProfessionalSkillPolicyProjection,
} from '../../src/types/living-frame-active-professional-skill-policy-projection'
import {
  getProfessionalSkillDefinition,
  listProfessionalSkillDefinitions,
} from '../../src/lib/professional-skills'
import {
  compileLivingFrameActiveProfessionalSkillPolicyProjection,
  verifyLivingFrameActiveProfessionalSkillPolicyProjection,
} from '../living-frame/living-frame-active-professional-skill-policy-projection'

const projection =
  compileLivingFrameActiveProfessionalSkillPolicyProjection()

assert.equal(
  verifyLivingFrameActiveProfessionalSkillPolicyProjection(projection),
  true,
)
assert.equal(projection.observedRegistryDefinitionCount, 110)
assert.equal(projection.observedRegistryDefinitionCountIsProductCap, false)
assert.equal(projection.canonicalLivingFrameDefinitionCount, 1)
assert.equal(projection.canonicalSkillDefinitionVersion, null)
assert.equal(
  projection.canonicalSkillDefinitionVersionState,
  'shared_definition_has_no_explicit_version_field',
)
assert.deepEqual(
  projection.currentQaGates,
  LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
)
assert.deepEqual(
  projection.additiveOrderedQaGateDelta,
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
)
assert.deepEqual(
  projection.projectedQaGates,
  [
    ...LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
    ...LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
  ],
)
assert.deepEqual(projection.hiddenAdapterToolNames, [])
assert.deepEqual(projection.backendIntents, [])
assert.deepEqual(projection.executionModes, ['plan_only'])
assert.equal(projection.currentCanonicalRegistryAlreadyEmitsDelta, false)
assert.equal(projection.sharedRegistryMutatedByProjection, false)
assert.equal(projection.canonicalConsumptionPending, true)
assert.equal(projection.canonicalOneWriterReconciliationRequired, true)
assert.equal(
  projection.selectionPublicationAndApprovedSnapshotDigestPropagationRequired,
  true,
)

const definition = getProfessionalSkillDefinition(
  'motion.living_frame_storytelling',
)
assert.ok(definition)
assert.deepEqual(
  definition.qaGates,
  LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
  'The feature projection must not mutate the shared definition.',
)
assert.equal(
  listProfessionalSkillDefinitions().filter((candidate) =>
    candidate.id === 'motion.living_frame_storytelling').length,
  1,
)

assert.equal(projection.authorityBoundary.sourcePolicyProjectionOnly, true)
for (const [key, authority] of Object.entries(
  projection.authorityBoundary,
)) {
  if (key === 'sourcePolicyProjectionOnly') continue
  assert.equal(authority, false)
}
for (const directAuthority of [
  projection.toolSelected,
  projection.providerSelected,
  projection.operationRegistered,
  projection.dispatchGranted,
  projection.runtimeExecuted,
  projection.costAdmitted,
  projection.canonicalQaApproved,
  projection.privateReviewApproved,
  projection.publicDeliveryReady,
  projection.productionReady,
]) assert.equal(directAuthority, false)

const tamperMutations: Array<(
  candidate: Record<string, unknown>,
) => void> = [
  (candidate) => { candidate.observedRegistryDefinitionCount = 165 },
  (candidate) => { candidate.observedRegistryDefinitionCountIsProductCap = true },
  (candidate) => { candidate.canonicalLivingFrameDefinitionCount = 2 },
  (candidate) => { candidate.canonicalSkillDefinitionVersion = 'v1' },
  (candidate) => { candidate.canonicalSkillDefinitionDigestSha256 = '0'.repeat(64) },
  (candidate) => {
    candidate.additiveOrderedQaGateDelta = [
      ...LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
    ].reverse()
  },
  (candidate) => { candidate.hiddenAdapterToolNames = ['comfyui'] },
  (candidate) => { candidate.backendIntents = [{ intentId: 'forbidden' }] },
  (candidate) => { candidate.executionModes = ['bounded_execution'] },
  (candidate) => { candidate.currentCanonicalRegistryAlreadyEmitsDelta = true },
  (candidate) => { candidate.sharedRegistryMutatedByProjection = true },
  (candidate) => { candidate.canonicalConsumptionPending = false },
  (candidate) => { candidate.toolSelected = true },
  (candidate) => { candidate.providerSelected = true },
  (candidate) => { candidate.operationRegistered = true },
  (candidate) => { candidate.dispatchGranted = true },
  (candidate) => { candidate.runtimeExecuted = true },
  (candidate) => { candidate.costAdmitted = true },
  (candidate) => { candidate.canonicalQaApproved = true },
  (candidate) => { candidate.publicDeliveryReady = true },
  (candidate) => { candidate.productionReady = true },
]

for (const mutate of tamperMutations) {
  const candidate = structuredClone(projection) as unknown as
    Record<string, unknown>
  mutate(candidate)
  assert.equal(
    verifyLivingFrameActiveProfessionalSkillPolicyProjection(candidate),
    false,
  )
}

assert.equal(
  verifyLivingFrameActiveProfessionalSkillPolicyProjection({
    ...projection,
    projectionDigestSha256: 'f'.repeat(64),
  } satisfies LivingFrameActiveProfessionalSkillPolicyProjection),
  false,
)

console.log(JSON.stringify({
  contractVersion: projection.contractVersion,
  observedRegistryDefinitionCount:
    projection.observedRegistryDefinitionCount,
  canonicalLivingFrameDefinitionCount:
    projection.canonicalLivingFrameDefinitionCount,
  currentQaGateCount: projection.currentQaGates.length,
  additiveQaGateCount: projection.additiveOrderedQaGateDelta.length,
  projectedQaGateCount: projection.projectedQaGates.length,
  tamperChecks: tamperMutations.length + 1,
  currentCanonicalRegistryAlreadyEmitsDelta:
    projection.currentCanonicalRegistryAlreadyEmitsDelta,
  canonicalConsumptionPending: projection.canonicalConsumptionPending,
  productionReady: projection.productionReady,
}, null, 2))
