import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameValidationIssueCode,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
  LivingFrameContractError,
  calculateLivingFrameContractDigest,
  createLivingFrameAdversarialFixtures,
  createLivingFrameContractFixtures,
  createLivingFrameFixtureDrafts,
  createLivingFrameProfessionalSkillComponent,
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? Array<DeepMutable<Item>>
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

const cloneJson = <T>(value: T): DeepMutable<T> =>
  JSON.parse(JSON.stringify(value)) as DeepMutable<T>

async function expectDraftRejection(
  fixtureId: string,
  expectedIssueCode: LivingFrameValidationIssueCode,
  payload: unknown,
): Promise<void> {
  let capturedError: unknown
  try {
    await createLivingFrameProfessionalSkillComponent(payload)
  } catch (error) {
    capturedError = error
  }
  assert.ok(
    capturedError instanceof LivingFrameContractError,
    `${fixtureId} must be rejected by the Living Frame contract.`,
  )
  assert.ok(
    capturedError.issues.some((issue) => issue.code === expectedIssueCode),
    `${fixtureId} must report ${expectedIssueCode}.`,
  )
}

async function expectDigestRejection(
  fixtureId: string,
  expectedIssueCode: LivingFrameValidationIssueCode,
  payload: unknown,
): Promise<void> {
  let capturedError: unknown
  try {
    await calculateLivingFrameContractDigest(payload)
  } catch (error) {
    capturedError = error
  }
  assert.ok(
    capturedError instanceof LivingFrameContractError,
    `${fixtureId} must be rejected before SHA-256 calculation.`,
  )
  assert.ok(
    capturedError.issues.some((issue) => issue.code === expectedIssueCode),
    `${fixtureId} must report ${expectedIssueCode} from the digest boundary.`,
  )
}

function assertPlanningOnlyBoundary(component: LivingFrameProfessionalSkillComponent): void {
  assert.deepEqual(
    component.authorityBoundary,
    LIVING_FRAME_PLANNING_ONLY_AUTHORITY_BOUNDARY,
    'Every Living Frame v1 component must preserve the literal planning-only boundary.',
  )
  assert.equal(component.runtimeReadiness, 'type_contract_only')
  assert.equal(component.authorityBoundary.planningOnly, true)
  assert.equal(component.authorityBoundary.executable, false)
  assert.equal(component.authorityBoundary.timingAuthority, false)
  assert.equal(component.authorityBoundary.soundAuthority, false)
  assert.equal(component.authorityBoundary.estimateAuthority, false)
  assert.equal(component.authorityBoundary.approvalAuthority, false)
  assert.equal(component.authorityBoundary.runtimeAuthority, false)
  assert.equal(component.authorityBoundary.queueAuthority, false)
  assert.equal(component.authorityBoundary.providerAuthority, false)
  assert.equal(component.authorityBoundary.toolRouteAuthority, false)
  assert.equal(component.authorityBoundary.costAuthority, false)
  assert.equal(component.inputBindings.outputFrame.liveAuthorityVerified, false)
  assert.equal(component.inputBindings.masterTiming.liveAuthorityVerified, false)
  assert.equal(component.inputBindings.masterTiming.exactFrameAuthorityProvided, false)
  assert.equal(component.estimateInputs.pricingAuthorityProvided, false)
}

const fixtures = await createLivingFrameContractFixtures()
const fixtureEntries = Object.entries(fixtures) as Array<
  readonly [keyof typeof fixtures, LivingFrameProfessionalSkillComponent]
>

for (const [fixtureName, component] of fixtureEntries) {
  const validation = await validateLivingFrameProfessionalSkillComponent(component)
  assert.equal(validation.ok, true, `${fixtureName} must satisfy the complete v1 contract.`)
  assertPlanningOnlyBoundary(component)
  assert.match(component.contractDigestSha256, /^[a-f0-9]{64}$/)
  assert.ok(
    component.closedGateCodes.includes('canonical_planner_integration_required'),
    `${fixtureName} must remain closed pending canonical planner integration.`,
  )
  assert.ok(
    component.closedGateCodes.includes('canonical_approval_required'),
    `${fixtureName} must remain closed pending canonical approval.`,
  )
  assert.ok(
    component.closedGateCodes.includes('private_remotion_review_required'),
    `${fixtureName} must remain closed pending private Remotion review.`,
  )
  const evidenceClasses = [
    component.inputBindings.compiledIntent.evidenceClass,
    component.inputBindings.sourceSequence.evidenceClass,
    component.inputBindings.videoUnderstanding.evidenceClass,
    component.inputBindings.adaptiveStrategy.evidenceClass,
    component.inputBindings.outputFrame.evidenceClass,
    component.inputBindings.masterTiming.evidenceClass,
    ...component.continuityPackRefs.map((reference) => reference.evidenceClass),
    ...component.scenePlans.flatMap(
      (scene) => scene.components.map((componentPlan) => componentPlan.evidenceClass),
    ),
  ]
  assert.ok(
    evidenceClasses.every((evidenceClass) => [
      'mock_planning_evidence',
      'controlled_unverified_evidence',
      'future_worker_evidence_required',
    ].includes(evidenceClass)),
    `${fixtureName} may carry only controlled, unverified, or future-required evidence.`,
  )
}

assert.equal(
  fixtures.musashiDecisiveStrike.scenePlans[0]?.sourceTruthMode,
  'canonical_illustrative_interpretation',
  'Musashi is a canonical illustrative interpretation, never verified likeness evidence.',
)
assert.ok(
  fixtures.musashiDecisiveStrike.scenePlans.every(
    (scene) => scene.sourceTruthMode !== 'documentary_source_verification_required',
  ),
  'The controlled Musashi fixture must not self-promote to historical evidence.',
)
assert.equal(
  fixtures.hormuzLivingARoll.scenePlans[0]?.sourceTruthMode,
  'exact_geography_verification_required',
  'Hormuz must request exact-geography verification without claiming that it occurred.',
)
assert.ok(
  fixtures.hormuzLivingARoll.closedGateCodes.includes(
    'documentary_fact_verification_required',
  ),
  'Hormuz must remain blocked on downstream documentary fact verification.',
)
assert.equal(fixtures.emotionalMonologueNonUse.decisionSummary.decision, 'non_use')
assert.equal(fixtures.emotionalMonologueNonUse.scenePlans.length, 0)
assert.equal(fixtures.emotionalMonologueNonUse.capabilityRequirements.length, 0)
assert.equal(fixtures.emotionalMonologueNonUse.estimateInputs.componentCount, 0)
assert.equal(
  fixtures.emotionalMonologueNonUse.estimateInputs.generatedVideoExpectation,
  'not_required',
  'Stillness and non-use must remain a first-class professional outcome.',
)

const fixtureDrafts = createLivingFrameFixtureDrafts()
for (const adversarialFixture of createLivingFrameAdversarialFixtures(fixtureDrafts)) {
  await expectDraftRejection(
    adversarialFixture.fixtureId,
    adversarialFixture.expectedIssueCode,
    adversarialFixture.payload,
  )
}

const secretValue = 'controlled-sensitive-value-never-echo'
const secretLeakDraft = {
  ...cloneJson(fixtureDrafts.musashiDecisiveStrike),
  rawTranscript: secretValue,
}
let secretLeakError: unknown
try {
  await createLivingFrameProfessionalSkillComponent(secretLeakDraft)
} catch (error) {
  secretLeakError = error
}
assert.ok(secretLeakError instanceof LivingFrameContractError)
assert.equal(
  JSON.stringify({
    message: secretLeakError.message,
    issues: secretLeakError.issues,
  }).includes(secretValue),
  false,
  'Validation errors must never echo rejected secret or raw-instruction values.',
)

const setPermutation = cloneJson(fixtureDrafts.hormuzLivingARoll)
setPermutation.closedGateCodes.reverse()
setPermutation.qaExpectationCodes.reverse()
setPermutation.inputBindings.safeZoneRefs.reverse()
setPermutation.continuityPackRefs.reverse()
setPermutation.capabilityRequirements.reverse()
for (const scene of setPermutation.scenePlans) {
  scene.closedGateCodes.reverse()
  scene.qaExpectationCodes.reverse()
  scene.continuityRefIds.reverse()
  scene.componentDependencies.reverse()
  for (const component of scene.components) {
    component.capabilityKeys.reverse()
    component.continuityRefIds.reverse()
    component.qaExpectationCodes.reverse()
  }
}
const setPermutedComponent = await createLivingFrameProfessionalSkillComponent(setPermutation)
assert.equal(
  setPermutedComponent.contractDigestSha256,
  fixtures.hormuzLivingARoll.contractDigestSha256,
  'Permuting explicitly set-like collections must not change the contract digest.',
)

const explicitOrderPermutation = cloneJson(fixtureDrafts.hormuzLivingARoll)
explicitOrderPermutation.scenePlans[0]?.attentionSequence.reverse()
explicitOrderPermutation.scenePlans[0]?.semanticTimingRequests.reverse()
explicitOrderPermutation.scenePlans[0]?.soundRequests.reverse()
const explicitlyOrderedComponent =
  await createLivingFrameProfessionalSkillComponent(explicitOrderPermutation)
assert.equal(
  explicitlyOrderedComponent.contractDigestSha256,
  fixtures.hormuzLivingARoll.contractDigestSha256,
  'Input array order is harmless only where explicit order metadata controls semantics.',
)

const semanticOrderConflict = cloneJson(fixtureDrafts.hormuzLivingARoll)
const semanticTimingRequests = semanticOrderConflict.scenePlans[0]?.semanticTimingRequests
assert.ok(semanticTimingRequests)
;[
  semanticTimingRequests[0].order,
  semanticTimingRequests[1].order,
] = [
  semanticTimingRequests[1].order,
  semanticTimingRequests[0].order,
]
await expectDraftRejection(
  'semantic_order_conflict',
  'semantic_order_invalid',
  semanticOrderConflict,
)

const validFallbackChange = cloneJson(fixtureDrafts.hormuzLivingARoll)
validFallbackChange.scenePlans[0]?.fallbackLadder.splice(1, 1)
const fallbackChangedComponent =
  await createLivingFrameProfessionalSkillComponent(validFallbackChange)
assert.notEqual(
  fallbackChangedComponent.contractDigestSha256,
  fixtures.hormuzLivingARoll.contractDigestSha256,
  'Changing a valid ordered fallback ladder must change the digest.',
)

const invalidFallbackOrder = cloneJson(fixtureDrafts.hormuzLivingARoll)
const invalidFallbackLadder = invalidFallbackOrder.scenePlans[0]?.fallbackLadder
assert.ok(invalidFallbackLadder)
;[
  invalidFallbackLadder[0],
  invalidFallbackLadder[1],
] = [
  invalidFallbackLadder[1],
  invalidFallbackLadder[0],
]
await expectDraftRejection(
  'ordered_fallback_ladder_conflict',
  'fallback_order_invalid',
  invalidFallbackOrder,
)

const digestTamper = cloneJson(fixtures.musashiDecisiveStrike)
digestTamper.decisionSummary.summary =
  'A locally changed summary must invalidate the existing digest.'
const tamperValidation = await validateLivingFrameProfessionalSkillComponent(digestTamper)
assert.equal(tamperValidation.ok, false)
assert.ok(
  !tamperValidation.ok
  && tamperValidation.issues.some((issue) => issue.code === 'digest_mismatch'),
  'Post-digest mutation must be rejected.',
)

const undefinedDraft = {
  ...cloneJson(fixtureDrafts.musashiDecisiveStrike),
  unexpectedUndefined: undefined,
}
await expectDraftRejection('undefined_input', 'non_json_input', undefinedDraft)
await expectDigestRejection('undefined_digest_input', 'non_json_input', undefinedDraft)

const cyclicJson: Record<string, unknown> = {}
cyclicJson.self = cyclicJson
await expectDraftRejection('cyclic_json_input', 'non_json_input', cyclicJson)
await expectDigestRejection('cyclic_digest_input', 'non_json_input', cyclicJson)

const digestFromDraft = await calculateLivingFrameContractDigest(
  fixtureDrafts.helicopterSelectiveMotion,
)
assert.equal(
  digestFromDraft,
  fixtures.helicopterSelectiveMotion.contractDigestSha256,
  'The standalone browser-safe SHA-256 helper must match component creation.',
)

const forgedAllGreen = createLivingFrameAdversarialFixtures(fixtureDrafts).find(
  (fixture) => fixture.fixtureId === 'forged_all_green_packet',
)
assert.ok(forgedAllGreen)
await expectDraftRejection(
  forgedAllGreen.fixtureId,
  forgedAllGreen.expectedIssueCode,
  forgedAllGreen.payload,
)
for (const [, component] of fixtureEntries) {
  assertPlanningOnlyBoundary(component)
  assert.notEqual(component.status, 'production_ready')
  assert.ok(
    component.continuityPackRefs.every((reference) => !reference.liveAuthorityVerified),
    'A structurally valid continuity expectation can never prove live authority.',
  )
}

console.log(
  JSON.stringify({
    smoke: 'living-frame-contract',
    contractVersion: fixtures.musashiDecisiveStrike.contractVersion,
    fixtureCount: fixtureEntries.length,
    adversarialFixtureCount: createLivingFrameAdversarialFixtures(fixtureDrafts).length,
    planningOnly: true,
    executable: false,
    canonicalTimingAuthority: false,
    canonicalApprovalAuthority: false,
    canonicalEstimateAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    queueAuthority: false,
    costAuthority: false,
    result: 'passed',
  }),
)
