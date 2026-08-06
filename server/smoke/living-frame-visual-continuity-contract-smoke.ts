import assert from 'node:assert/strict'

import type {
  LivingFrameVisualContinuityAuthorityBoundary,
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuityValidationIssueCode,
} from '../../src/types/living-frame-visual-continuity'
import {
  LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY,
  LivingFrameVisualContinuityContractError,
  calculateLivingFrameVisualContinuityPackDigest,
  createLivingFrameVisualContinuityAdversarialFixtures,
  createLivingFrameVisualContinuityFixtureDrafts,
  createLivingFrameVisualContinuityFixtures,
  createLivingFrameVisualContinuityPack,
  validateLivingFrameVisualContinuityPack,
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
  expectedIssueCode: LivingFrameVisualContinuityValidationIssueCode,
  payload: unknown,
): Promise<LivingFrameVisualContinuityContractError> {
  let capturedError: unknown
  try {
    await createLivingFrameVisualContinuityPack(payload)
  } catch (error) {
    capturedError = error
  }
  assert.ok(
    capturedError instanceof LivingFrameVisualContinuityContractError,
    `${fixtureId} must be rejected by the visual continuity contract.`,
  )
  assert.ok(
    capturedError.issues.some((issue) => issue.code === expectedIssueCode),
    `${fixtureId} must report ${expectedIssueCode}.`,
  )
  return capturedError
}

function assertAllAuthorityClosed(
  boundary: LivingFrameVisualContinuityAuthorityBoundary,
): void {
  assert.deepEqual(
    boundary,
    LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY,
    'The Visual Continuity Pack must preserve its literal planning-only boundary.',
  )
  assert.equal(boundary.controlledPlanningOnly, true)
  for (const [key, value] of Object.entries(boundary)) {
    if (key === 'controlledPlanningOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
}

function assertControlledPack(pack: LivingFrameVisualContinuityPack): void {
  assert.equal(pack.status, 'controlled_planning_candidate')
  assert.equal(
    pack.evidenceClass,
    'controlled_non_promotable_visual_continuity_pack',
  )
  assert.equal(pack.promotionAllowed, false)
  assert.equal(pack.semanticDecisionState, 'candidates_proposed')
  assertAllAuthorityClosed(pack.authorityBoundary)
  assert.ok(
    pack.expectationRefs.every(
      (reference) =>
        reference.liveAuthorityVerified === false
        && reference.currentAuthorityVerified === false
        && reference.approvalVerified === false,
    ),
    'Expectation references cannot self-promote into current evidence.',
  )
  assert.ok(
    pack.sceneDesignSheets.every(
      (scene) =>
        scene.selectedSceneAuthority === false
        && scene.exactFramesProvided === false
        && scene.componentSceneGraphProvided === false,
    ),
    'Scene sheets remain semantic candidates rather than selected scenes.',
  )
  assert.ok(
    pack.continuityLedger.every(
      (entry) =>
        entry.qaApprovedExecutableAsset === false
        && entry.assetManifestAuthority === false,
    ),
    'A planning ledger entry is not an executable or QA-approved asset.',
  )
}

const fixtures = await createLivingFrameVisualContinuityFixtures()
const fixtureEntries: Array<
  readonly [string, LivingFrameVisualContinuityPack]
> = [
  ['musashi', fixtures.musashi],
  ['helicopter', fixtures.helicopter],
  ['hormuz', fixtures.hormuz],
]

for (const [fixtureName, pack] of fixtureEntries) {
  const validation = await validateLivingFrameVisualContinuityPack(pack)
  assert.equal(validation.ok, true, `${fixtureName} must satisfy the v1 contract.`)
  assert.match(pack.contractDigestSha256, /^[a-f0-9]{64}$/u)
  assertControlledPack(pack)
}

assert.equal(
  fixtures.emotionalMonologueNonUse,
  null,
  'Deliberate non-use keeps the Visual Continuity Pack absent.',
)
assert.equal(
  fixtures.musashi.characterSheets[0]?.identityKind,
  'canonical_illustrative_interpretation',
  'Musashi is a controlled design expectation, not a verified likeness.',
)
assert.equal(
  fixtures.musashi.characterSheets[0]?.verifiedLikenessClaimed,
  false,
)
assert.equal(
  fixtures.musashi.characterSheets[0]?.historicalEvidenceClaimed,
  false,
)
assert.equal(
  fixtures.hormuz.sceneDesignSheets[0]?.sourceTruthMode,
  'exact_geography_verification_required',
)
assert.equal(
  fixtures.hormuz.environmentSheets[0]?.exactGeographyVerified,
  false,
  'The controlled Hormuz fixture cannot prove live geography.',
)
assert.equal(
  fixtures.hormuz.alphaEdgeRules.temporalMaskBenchmarkRequired,
  true,
)

const drafts = createLivingFrameVisualContinuityFixtureDrafts()
const adversarialFixtures =
  createLivingFrameVisualContinuityAdversarialFixtures(drafts)
for (const fixture of adversarialFixtures) {
  await expectDraftRejection(
    fixture.fixtureId,
    fixture.expectedIssueCode,
    fixture.payload,
  )
}

const secretValue = 'controlled-sensitive-value-never-echo'
const secretDraft = cloneJson(drafts.musashi)
secretDraft.styleBible.summary = `api_key=${secretValue}`
const secretError = await expectDraftRejection(
  'secret_non_echo',
  'unsafe_text',
  secretDraft,
)
assert.equal(
  JSON.stringify({
    message: secretError.message,
    issues: secretError.issues,
  }).includes(secretValue),
  false,
  'Rejected secret-like values must not be echoed.',
)

const setPermutation = cloneJson(drafts.hormuz)
setPermutation.expectationRefs.reverse()
setPermutation.styleBible.avoidanceCodes.reverse()
setPermutation.styleBible.referenceExpectationIds.reverse()
setPermutation.characterSheets.reverse()
setPermutation.objectSheets.reverse()
setPermutation.environmentSheets.reverse()
setPermutation.sheetDependencies.reverse()
setPermutation.alphaEdgeRules.testBackgrounds.reverse()
for (const character of setPermutation.characterSheets) {
  character.identityRuleCodes.reverse()
  character.expectationRefIds.reverse()
}
for (const object of setPermutation.objectSheets) {
  object.separabilityCodes.reverse()
  object.expectationRefIds.reverse()
}
for (const environment of setPermutation.environmentSheets) {
  environment.expectationRefIds.reverse()
}
for (const scene of setPermutation.sceneDesignSheets) {
  scene.characterSheetIds.reverse()
  scene.objectSheetIds.reverse()
  scene.environmentSheetIds.reverse()
}
for (const ledgerEntry of setPermutation.continuityLedger) {
  ledgerEntry.linkedCharacterSheetIds.reverse()
  ledgerEntry.linkedObjectSheetIds.reverse()
  ledgerEntry.linkedEnvironmentSheetIds.reverse()
}
const setPermutedPack =
  await createLivingFrameVisualContinuityPack(setPermutation)
assert.equal(
  setPermutedPack.contractDigestSha256,
  fixtures.hormuz.contractDigestSha256,
  'Permuting set-like collections must not change the digest.',
)

const explicitOrderPermutation = cloneJson(drafts.musashi)
explicitOrderPermutation.styleBible.palette.reverse()
explicitOrderPermutation.characterSheets[0]?.referenceViews.reverse()
explicitOrderPermutation.sceneDesignSheets.reverse()
explicitOrderPermutation.continuityLedger.reverse()
const explicitlyOrderedPack =
  await createLivingFrameVisualContinuityPack(explicitOrderPermutation)
assert.equal(
  explicitlyOrderedPack.contractDigestSha256,
  fixtures.musashi.contractDigestSha256,
  'Raw input order is harmless where explicit order metadata controls semantics.',
)

const semanticOrderChange = cloneJson(drafts.musashi)
const ledger = semanticOrderChange.continuityLedger
assert.equal(ledger.length, 2)
;[ledger[0].order, ledger[1].order] = [ledger[1].order, ledger[0].order]
const semanticOrderChangedPack =
  await createLivingFrameVisualContinuityPack(semanticOrderChange)
assert.notEqual(
  semanticOrderChangedPack.contractDigestSha256,
  fixtures.musashi.contractDigestSha256,
  'Changing semantic ledger order must change the digest.',
)

const changedLineage = cloneJson(drafts.helicopter)
changedLineage.canonicalBindings.sourceSequenceDigestSha256 = '1'.repeat(64)
changedLineage.canonicalBindings.lineageRevision += 1
const changedLineagePack =
  await createLivingFrameVisualContinuityPack(changedLineage)
assert.notEqual(
  changedLineagePack.contractDigestSha256,
  fixtures.helicopter.contractDigestSha256,
  'Changing source lineage must produce a different pack digest.',
)
const stalePack = cloneJson(fixtures.helicopter)
stalePack.canonicalBindings.sourceSequenceDigestSha256 = '1'.repeat(64)
stalePack.canonicalBindings.lineageRevision += 1
const staleValidation =
  await validateLivingFrameVisualContinuityPack(stalePack)
assert.equal(staleValidation.ok, false)
assert.ok(
  !staleValidation.ok
  && staleValidation.issues.some((issue) => issue.code === 'digest_mismatch'),
  'A previously digested pack becomes stale when lineage changes.',
)

const tamperedPack = cloneJson(fixtures.musashi)
tamperedPack.styleBible.summary =
  'A changed controlled summary must invalidate the existing digest.'
const tamperedValidation =
  await validateLivingFrameVisualContinuityPack(tamperedPack)
assert.equal(tamperedValidation.ok, false)
assert.ok(
  !tamperedValidation.ok
  && tamperedValidation.issues.some((issue) => issue.code === 'digest_mismatch'),
)

const undefinedInput = {
  ...cloneJson(drafts.helicopter),
  accidentalUndefined: undefined,
}
await expectDraftRejection(
  'undefined_input',
  'non_json_input',
  undefinedInput,
)
let digestInputError: unknown
try {
  await calculateLivingFrameVisualContinuityPackDigest(undefinedInput)
} catch (error) {
  digestInputError = error
}
assert.ok(digestInputError instanceof LivingFrameVisualContinuityContractError)
assert.ok(
  digestInputError.issues.some((issue) => issue.code === 'non_json_input'),
)

const cyclicInput: Record<string, unknown> = {}
cyclicInput.self = cyclicInput
await expectDraftRejection('cyclic_input', 'non_json_input', cyclicInput)

const forgedAllGreen = adversarialFixtures.find(
  (fixture) => fixture.fixtureId === 'all_green_authority_forgery',
)
assert.ok(forgedAllGreen)
await expectDraftRejection(
  forgedAllGreen.fixtureId,
  forgedAllGreen.expectedIssueCode,
  forgedAllGreen.payload,
)
for (const [, pack] of fixtureEntries) assertControlledPack(pack)

const digestFromDraft =
  await calculateLivingFrameVisualContinuityPackDigest(drafts.hormuz)
assert.equal(digestFromDraft, fixtures.hormuz.contractDigestSha256)

console.log(JSON.stringify({
  smoke: 'living-frame-visual-continuity-contract',
  contractVersion: fixtures.musashi.contractVersion,
  controlledFixtureCount: fixtureEntries.length,
  deliberateNonUseFixtureCount: 1,
  adversarialFixtureCount: adversarialFixtures.length,
  planningOnly: true,
  liveEvidenceAuthority: false,
  selectedSceneAuthority: false,
  exactTimingAuthority: false,
  soundSyncAuthority: false,
  estimateAuthority: false,
  customerPriceAuthority: false,
  customerCreditAuthority: false,
  approvalAuthority: false,
  snapshotAuthority: false,
  assetManifestAuthority: false,
  qaApprovalAuthority: false,
  providerAuthority: false,
  toolRouteAuthority: false,
  workGraphAuthority: false,
  queueAuthority: false,
  renderAuthority: false,
  runtimeAuthority: false,
  result: 'passed',
}))
