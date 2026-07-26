import assert from 'node:assert/strict'

import {
  LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_AUTHORITY_BOUNDARY,
  LivingFrameSemanticSceneProposalContractError,
  calculateLivingFrameSemanticSceneProposalBindingDigest,
  calculateLivingFrameSemanticSceneProposalResultDigest,
  createLivingFrameSemanticSceneProposalAdversarialFixtures,
  createLivingFrameSemanticSceneProposalBinding,
  createLivingFrameSemanticSceneProposalFixtureInputs,
  createLivingFrameSemanticSceneProposalFixtures,
  livingFrameSemanticSceneProposalBindingSchema,
  livingFrameSemanticSceneProposalResultSchema,
  validateLivingFrameSemanticSceneProposalBinding,
} from '../../src/lib/living-frame'
import type {
  CreateLivingFrameSemanticSceneProposalBindingInput,
  LivingFrameSemanticSceneProposalAuthorityBoundary,
  LivingFrameSemanticSceneProposalBinding,
  LivingFrameSemanticSceneProposalIssueCode,
} from '../../src/lib/living-frame'
import {
  canonicalLivingFrameSemanticSceneProposalBindingDraftSchema,
  canonicalLivingFrameSemanticSceneProposalBindingSchema,
  canonicalLivingFrameSemanticSceneProposalResultSchema,
  validateCanonicalLivingFrameSemanticSceneProposalBinding,
} from '../validation/canonical-living-frame-semantic-scene-proposal-schemas'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

function cloneJson<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>
}

function assertAuthorityClosed(
  boundary: LivingFrameSemanticSceneProposalAuthorityBoundary,
): void {
  assert.deepEqual(
    boundary,
    LIVING_FRAME_SEMANTIC_SCENE_PROPOSAL_AUTHORITY_BOUNDARY,
  )
  assert.equal(boundary.controlledCrossValidationOnly, true)
  for (const [key, value] of Object.entries(boundary)) {
    if (key === 'controlledCrossValidationOnly') continue
    assert.equal(value, false, `${key} must remain literal false.`)
  }
}

async function expectCreateRejection(
  payload: unknown,
  expectedCode: LivingFrameSemanticSceneProposalIssueCode,
  fixtureId: string,
): Promise<void> {
  let captured: unknown
  try {
    await createLivingFrameSemanticSceneProposalBinding(
      payload as CreateLivingFrameSemanticSceneProposalBindingInput,
    )
  } catch (error) {
    captured = error
  }
  assert.ok(
    captured instanceof LivingFrameSemanticSceneProposalContractError,
    `${fixtureId} must fail through the scene-proposal contract.`,
  )
  assert.ok(
    captured.issues.some((entry) => entry.code === expectedCode),
    `${fixtureId} must report ${expectedCode}; got ${
      captured.issues.map((entry) => entry.code).join(', ')
    }.`,
  )
}

async function expectValidationRejection(
  payload: unknown,
  expectedCode: LivingFrameSemanticSceneProposalIssueCode,
  fixtureId: string,
): Promise<void> {
  const client = await validateLivingFrameSemanticSceneProposalBinding(payload)
  assert.equal(client.ok, false, `${fixtureId} must fail client validation.`)
  assert.ok(
    !client.ok && client.issues.some((entry) => entry.code === expectedCode),
    `${fixtureId} must report ${expectedCode} at the client boundary.`,
  )
  const server =
    await validateCanonicalLivingFrameSemanticSceneProposalBinding(payload)
  assert.equal(server.ok, false, `${fixtureId} must fail server validation.`)
  assert.ok(
    !server.ok && server.issues.some((entry) => entry.code === expectedCode),
    `${fixtureId} must report ${expectedCode} at the server boundary.`,
  )
}

function assertControlledBinding(
  binding: LivingFrameSemanticSceneProposalBinding,
): void {
  assert.equal(
    binding.bindingClass,
    'controlled_non_promotable_semantic_scene_proposal_binding',
  )
  assert.equal(binding.evidenceClass, 'controlled_non_promotable')
  assert.equal(binding.promotionAllowed, false)
  assertAuthorityClosed(binding.authorityBoundary)
  assert.equal(binding.normalizedResult.selectedSceneAuthority, false)
  assert.equal(binding.normalizedResult.exactFrameAuthority, false)
  assert.equal(binding.normalizedResult.exactSoundCueAuthority, false)
  assert.equal(binding.normalizedResult.estimateAuthority, false)
  assert.equal(binding.normalizedResult.approvalAuthority, false)
  assert.equal(
    binding.normalizedResult.providerOrToolSelectionAuthority,
    false,
  )
  assert.equal(binding.normalizedResult.workOrRuntimeAuthority, false)
  assert.ok(
    binding.blockingReasonCodes.includes(
      'shared_route_data_assurance_required',
    ),
  )
}

const inputs =
  await createLivingFrameSemanticSceneProposalFixtureInputs()
const fixtures = await createLivingFrameSemanticSceneProposalFixtures()

for (const [fixtureName, binding] of Object.entries(fixtures)) {
  const client =
    await validateLivingFrameSemanticSceneProposalBinding(binding)
  assert.equal(client.ok, true, `${fixtureName} must validate at the client.`)
  const server =
    await validateCanonicalLivingFrameSemanticSceneProposalBinding(binding)
  assert.equal(server.ok, true, `${fixtureName} must validate at the server.`)
  assert.equal(
    livingFrameSemanticSceneProposalBindingSchema.safeParse(binding).success,
    true,
  )
  assert.equal(
    canonicalLivingFrameSemanticSceneProposalBindingSchema
      .safeParse(binding).success,
    true,
  )
  const {
    contractDigestSha256,
    ...draft
  } = binding
  assert.equal(
    canonicalLivingFrameSemanticSceneProposalBindingDraftSchema
      .safeParse(draft).success,
    true,
  )
  assert.equal(
    contractDigestSha256,
    await calculateLivingFrameSemanticSceneProposalBindingDigest(draft),
  )
  assert.equal(
    binding.proposalResultDigestSha256,
    await calculateLivingFrameSemanticSceneProposalResultDigest(
      binding.normalizedResult,
    ),
  )
  assert.notEqual(binding.contractDigestSha256, binding.proposalResultDigestSha256)
  assert.notEqual(
    binding.contractDigestSha256,
    binding.requestContractDigestSha256,
  )
  assert.notEqual(
    binding.proposalResultDigestSha256,
    binding.semanticPayloadDigestSha256,
  )
  assertControlledBinding(binding)
}

for (const binding of [
  fixtures.musashi,
  fixtures.hormuz,
  fixtures.emotionalNonUse,
]) {
  assert.ok(
    binding.blockingReasonCodes.includes(
      'generic_source_speech_evidence_required',
    ),
  )
}
assert.equal(
  fixtures.helicopter.blockingReasonCodes.includes(
    'generic_source_speech_evidence_required',
  ),
  false,
)
assert.equal(
  fixtures.emotionalNonUse.continuityPack,
  null,
  'Deliberate non-use must keep the continuity pack absent.',
)
assert.equal(
  fixtures.emotionalNonUse.blockingReasonCodes.includes(
    'continuity_pack_required',
  ),
  false,
)
assert.equal(fixtures.emotionalNonUse.normalizedResult.sceneProposals.length, 0)
assert.equal(
  fixtures.musashi.continuityPack?.characterSheets[0]?.identityKind,
  'canonical_illustrative_interpretation',
)
assert.equal(
  fixtures.musashi.continuityPack?.characterSheets[0]
    ?.verifiedLikenessClaimed,
  false,
)
assert.equal(
  fixtures.hormuz.continuityPack?.environmentSheets[0]
    ?.exactGeographyVerified,
  false,
)

const helicopterWithoutPack =
  await createLivingFrameSemanticSceneProposalBinding({
    ...inputs.helicopter,
    continuityPack: null,
  })
assert.ok(
  helicopterWithoutPack.blockingReasonCodes.includes(
    'continuity_pack_required',
  ),
  'Omitting a required continuity pack must retain a blocker.',
)
assert.equal(helicopterWithoutPack.continuityPackDigestSha256, null)
assertControlledBinding(helicopterWithoutPack)

const setPermutation = cloneJson({
  request: inputs.hormuz.request,
  result: fixtures.hormuz.normalizedResult,
  continuityPack: fixtures.hormuz.continuityPack,
})
setPermutation.result.decisions[0]?.evidenceCitations.reverse()
setPermutation.result.decisions[0]?.sceneProposalKeys.reverse()
const permutedScene = setPermutation.result.sceneProposals[0]
assert.ok(permutedScene)
permutedScene.segmentContextIds.reverse()
permutedScene.componentDependencies.reverse()
permutedScene.qaExpectationCodes.reverse()
for (const component of permutedScene.components) {
  component.capabilityKeys.reverse()
  component.evidenceCitations.reverse()
}
for (const activation of permutedScene.miniSkillProposals) {
  activation.linkedComponentKeys.reverse()
  activation.linkedTimingConstraintKeys.reverse()
  activation.dependsOnActivationKeys.reverse()
  activation.conflictsWithActivationKeys.reverse()
}
for (const attention of permutedScene.attentionConstraints) {
  attention.methods.reverse()
}
const setPermutedBinding =
  await createLivingFrameSemanticSceneProposalBinding(
    setPermutation as CreateLivingFrameSemanticSceneProposalBindingInput,
  )
assert.equal(
  setPermutedBinding.contractDigestSha256,
  fixtures.hormuz.contractDigestSha256,
  'Set-like proposal permutations must canonicalize.',
)

const fallbackOrderChange = cloneJson({
  request: inputs.helicopter.request,
  result: fixtures.helicopter.normalizedResult,
  continuityPack: fixtures.helicopter.continuityPack,
})
fallbackOrderChange.result.sceneProposals[0]!.fallbackLadder = [
  'full_living_frame',
  'static_card',
  'no_extra_visual',
]
const fallbackChangedBinding =
  await createLivingFrameSemanticSceneProposalBinding(
    fallbackOrderChange as CreateLivingFrameSemanticSceneProposalBindingInput,
  )
assert.notEqual(
  fallbackChangedBinding.contractDigestSha256,
  fixtures.helicopter.contractDigestSha256,
  'Changing the ordered fallback ladder must change the binding digest.',
)

const timingArrayPermutation = cloneJson({
  request: inputs.musashi.request,
  result: fixtures.musashi.normalizedResult,
  continuityPack: fixtures.musashi.continuityPack,
})
timingArrayPermutation.result.sceneProposals[0]!
  .semanticTimingConstraints.reverse()
const timingPermutedBinding =
  await createLivingFrameSemanticSceneProposalBinding(
    timingArrayPermutation as
      CreateLivingFrameSemanticSceneProposalBindingInput,
  )
assert.equal(
  timingPermutedBinding.contractDigestSha256,
  fixtures.musashi.contractDigestSha256,
  'Raw timing array order is harmless where explicit order is unchanged.',
)

assert.equal(
  livingFrameSemanticSceneProposalResultSchema
    .safeParse(fixtures.hormuz.normalizedResult).success,
  true,
)
assert.equal(
  canonicalLivingFrameSemanticSceneProposalResultSchema
    .safeParse(fixtures.hormuz.normalizedResult).success,
  true,
)

const adversarial =
  await createLivingFrameSemanticSceneProposalAdversarialFixtures(
    inputs,
    fixtures,
  )
for (const fixture of adversarial) {
  if (fixture.operation === 'create') {
    await expectCreateRejection(
      fixture.payload,
      fixture.expectedIssueCode,
      fixture.fixtureId,
    )
  } else {
    await expectValidationRejection(
      fixture.payload,
      fixture.expectedIssueCode,
      fixture.fixtureId,
    )
  }
}

const forgedAllGreen = cloneJson(fixtures.helicopter)
const forgedAuthority = forgedAllGreen.authorityBoundary as unknown as
  Record<string, unknown>
forgedAuthority.selectedSceneAuthority = true
forgedAuthority.exactTimingAuthority = true
forgedAuthority.soundSyncAuthority = true
forgedAuthority.estimateAuthority = true
forgedAuthority.approvalAuthority = true
forgedAuthority.providerAuthority = true
forgedAuthority.toolRouteAuthority = true
forgedAuthority.workGraphAuthority = true
forgedAuthority.assetManifestAuthority = true
forgedAuthority.renderAuthority = true
forgedAuthority.runtimeAuthority = true
forgedAuthority.productionReady = true
await expectValidationRejection(
  forgedAllGreen,
  'proposal_schema_invalid',
  'forged_all_green_authority_packet',
)

console.log(
  JSON.stringify(
    {
      livingFrameSemanticSceneProposalContract: 'passed',
      controlledFixtures: Object.keys(fixtures).length,
      adversarialFixtures: adversarial.length + 1,
      continuityOmissionBlocked: true,
      selectedSceneAuthority: false,
      exactTimingAuthority: false,
      soundSyncAuthority: false,
      estimateAuthority: false,
      approvalAuthority: false,
      providerOrToolAuthority: false,
      workAssetRenderRuntimeAuthority: false,
      productionReady: false,
    },
    null,
    2,
  ),
)
