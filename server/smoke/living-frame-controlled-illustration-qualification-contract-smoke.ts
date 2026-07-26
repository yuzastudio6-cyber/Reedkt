import assert from 'node:assert/strict'

import {
  LivingFrameControlledIllustrationQualificationError,
  calculateLivingFrameControlledIllustrationQualificationDigest,
  createLivingFrameControlledIllustrationQualification,
  validateLivingFrameControlledIllustrationQualification,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-qualification-contract'
import {
  createLivingFrameControlledIllustrationQualificationAdversarialFixtures,
  createLivingFrameControlledIllustrationQualificationFixtureDraft,
  createLivingFrameControlledIllustrationQualificationFixtures,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-qualification-fixtures'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES,
  type LivingFrameControlledIllustrationQualification,
  type LivingFrameControlledIllustrationQualificationDraft,
} from '../../src/types/living-frame-controlled-illustration-qualification'
import {
  canonicalLivingFrameControlledIllustrationQualificationSchema,
  parseCanonicalLivingFrameControlledIllustrationQualification,
  validateCanonicalLivingFrameControlledIllustrationQualification,
} from '../validation/canonical-living-frame-controlled-illustration-qualification-schemas'

async function expectDraftRejection(
  payload: unknown,
  expectedCode: string,
  fixtureId: string,
): Promise<void> {
  let caught: unknown
  try {
    await createLivingFrameControlledIllustrationQualification(
      payload as LivingFrameControlledIllustrationQualificationDraft,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof LivingFrameControlledIllustrationQualificationError,
    `${fixtureId} must fail through the qualification contract error.`,
  )
  assert.ok(
    caught.issues.some((entry) => entry.code === expectedCode),
    `${fixtureId} must report ${expectedCode}; got ${
      caught.issues.map((entry) => entry.code).join(', ')
    }.`,
  )
}

function assertAllAuthorityClosed(
  qualification: LivingFrameControlledIllustrationQualification,
): void {
  assert.equal(
    qualification.authorityBoundary.controlledSourceRequirementsOnly,
    true,
  )
  for (const [key, value] of Object.entries(
    qualification.authorityBoundary,
  )) {
    if (key === 'controlledSourceRequirementsOnly') continue
    assert.equal(value, false, `${key} must remain literal false.`)
  }
  for (const candidate of qualification.candidateRequirements) {
    assert.equal(candidate.evaluationOnly, true)
    for (const [key, value] of Object.entries(candidate)) {
      if (
        [
          'candidateRequirementId',
          'candidateKey',
          'order',
          'candidateClass',
          'artifactExpectations',
          'reviewGateCodes',
          'benchmarkExpectations',
          'hypothesisCodes',
          'evaluationOnly',
        ].includes(key)
      ) continue
      assert.equal(
        value,
        false,
        `${candidate.candidateKey}.${key} must remain literal false.`,
      )
    }
    for (const artifact of candidate.artifactExpectations) {
      assert.equal(artifact.exactVersionRequired, true)
      assert.equal(artifact.exactDigestRequired, true)
      assert.equal(artifact.independentReviewRequired, true)
      assert.equal(artifact.suppliedInQualification, false)
      assert.equal(artifact.verifiedInQualification, false)
    }
    for (const benchmark of candidate.benchmarkExpectations) {
      assert.equal(benchmark.measurementRequired, true)
      assert.equal(benchmark.measuredInQualification, false)
      assert.equal(benchmark.passedInQualification, false)
    }
  }
}

const fixtures =
  await createLivingFrameControlledIllustrationQualificationFixtures()
const qualification = fixtures.evaluationOnly
const validation =
  await validateLivingFrameControlledIllustrationQualification(qualification)
assert.equal(validation.ok, true)
const serverValidation =
  await validateCanonicalLivingFrameControlledIllustrationQualification(
    qualification,
  )
assert.equal(serverValidation.ok, true)
assert.equal(
  canonicalLivingFrameControlledIllustrationQualificationSchema.safeParse(
    qualification,
  ).success,
  true,
)
assert.deepEqual(
  await parseCanonicalLivingFrameControlledIllustrationQualification(
    qualification,
  ),
  qualification,
)
assertAllAuthorityClosed(qualification)
assert.deepEqual(
  qualification.candidateRequirements.map((entry) => entry.candidateKey),
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
)
assert.equal(qualification.candidateRequirements.length, 6)
assert.equal(qualification.deterministicRouteRequiredForExactGraphics, true)
assert.equal(qualification.generatedVideoIsLastResort, true)
assert.equal(qualification.candidateSetComplete, true)
assert.deepEqual(
  qualification.imageCapabilityBoundary.capabilityBoundaryCodes,
  [...LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES].sort(),
)
assert.equal(
  qualification.imageCapabilityBoundary
    .gptImage2TransparentOutputSupported,
  false,
)
assert.equal(
  qualification.imageCapabilityBoundary.opaqueGenerationRequired,
  true,
)
assert.equal(
  qualification.imageCapabilityBoundary
    .providerEditMaskIsProductionMatte,
  false,
)
assert.equal(
  qualification.imageCapabilityBoundary
    .qualifiedSegmentationOrMattingRequired,
  true,
)
assert.equal(
  qualification.imageCapabilityBoundary.trueAlphaArtifactRequired,
  true,
)
assert.equal(
  qualification.imageCapabilityBoundary.multiBackgroundQaRequired,
  true,
)
assert.equal(
  qualification.imageCapabilityBoundary.destinationCompositeQaRequired,
  true,
)

const aux = qualification.candidateRequirements.find(
  (entry) => entry.candidateKey === 'comfyui_controlnet_aux',
)
assert.ok(aux)
assert.ok(aux.artifactExpectations.some(
  (entry) => entry.artifactFamily === 'copied_source_inventory',
))
assert.ok(aux.artifactExpectations.some(
  (entry) => entry.artifactFamily ===
    'copied_source_license_inventory',
))
assert.ok(aux.artifactExpectations.some(
  (entry) => entry.artifactFamily ===
    'preprocessor_checkpoint_inventory',
))

const ipAdapter = qualification.candidateRequirements.find(
  (entry) => entry.candidateKey === 'ip_adapter',
)
assert.ok(ipAdapter)
assert.ok(ipAdapter.hypothesisCodes.includes(
  'base_adapter_does_not_promote_faceid_variant',
))
assert.ok(ipAdapter.hypothesisCodes.includes(
  'faceid_variant_research_only_noncommercial_due_identity_dependency',
))

const pulid = qualification.candidateRequirements.find(
  (entry) => entry.candidateKey === 'pulid',
)
assert.ok(pulid)
assert.ok(pulid.hypothesisCodes.includes(
  'pulid_flux_route_inherits_flux1_dev_noncommercial_constraint',
))
for (const gate of [
  'consent_review',
  'likeness_and_deepfake_review',
  'minor_safety_review',
  'retention_review',
  'documentary_fact_safety_review',
] as const) assert.ok(pulid.reviewGateCodes.includes(gate))

for (const candidate of qualification.candidateRequirements) {
  assert.deepEqual(
    candidate.benchmarkExpectations.map((entry) => entry.benchmarkCode),
    [...LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES].sort(),
  )
}

const draft =
  createLivingFrameControlledIllustrationQualificationFixtureDraft()
for (
  const fixture of
  createLivingFrameControlledIllustrationQualificationAdversarialFixtures(
    draft,
  )
) {
  await expectDraftRejection(
    fixture.payload,
    fixture.expectedIssueCode,
    fixture.fixtureId,
  )
}

const setPermutation: LivingFrameControlledIllustrationQualificationDraft = {
  ...cloneJson(draft),
  candidateRequirements: [...draft.candidateRequirements]
    .reverse()
    .map((candidate) => ({
      ...candidate,
      artifactExpectations: [...candidate.artifactExpectations].reverse(),
      reviewGateCodes: [...candidate.reviewGateCodes].reverse(),
      benchmarkExpectations: [...candidate.benchmarkExpectations].reverse(),
      hypothesisCodes: [...candidate.hypothesisCodes].reverse(),
    })),
  imageCapabilityBoundary: {
    ...draft.imageCapabilityBoundary,
    capabilityBoundaryCodes: [
      ...draft.imageCapabilityBoundary.capabilityBoundaryCodes,
    ].reverse(),
  },
}
assert.equal(
  (
    await createLivingFrameControlledIllustrationQualification(
      setPermutation,
    )
  ).qualificationDigestSha256,
  qualification.qualificationDigestSha256,
  'Set-like arrays and explicitly ordered candidates must canonicalize.',
)

const orderTamper = {
  ...cloneJson(draft),
  candidateRequirements: draft.candidateRequirements.map(
    (candidate, index) => ({
      ...candidate,
      order: index === 0 ? 1 : index === 1 ? 0 : candidate.order,
    }),
  ),
}
await expectDraftRejection(
  orderTamper,
  'candidate_order_invalid',
  'candidate_order_metadata_tamper',
)

assert.equal(
  await calculateLivingFrameControlledIllustrationQualificationDigest(
    draft,
  ),
  qualification.qualificationDigestSha256,
)

const digestTamper = {
  ...cloneJson(qualification),
  qualificationDigestSha256: 'a'.repeat(64),
}
const digestValidation =
  await validateLivingFrameControlledIllustrationQualification(digestTamper)
assert.equal(digestValidation.ok, false)
assert.ok(
  !digestValidation.ok
  && digestValidation.issues.some(
    (entry) => entry.code === 'digest_mismatch',
  ),
)

const forgedAllGreen = cloneJson(draft) as unknown as Record<string, unknown>
const forgedCandidates = forgedAllGreen.candidateRequirements
assert.ok(Array.isArray(forgedCandidates))
for (const value of forgedCandidates) {
  const candidate = value as Record<string, unknown>
  candidate.installationAuthorized = true
  candidate.exactVersionSelected = true
  candidate.artifactManifestPresent = true
  candidate.canonicalRegistryAdmitted = true
  candidate.independentVerificationPassed = true
  candidate.dispatchAuthorized = true
  candidate.imageRouteQualified = true
  candidate.productionReady = true
}
await expectDraftRejection(
  forgedAllGreen,
  'qualification_promotion_forbidden',
  'forged_all_green_qualification',
)

const cycle: Record<string, unknown> = {}
cycle.self = cycle
await expectDraftRejection(cycle, 'non_json_input', 'cyclic_non_json_input')

console.log(
  'Living Frame controlled-illustration qualification smoke passed '
  + `1 controlled packet / ${
    createLivingFrameControlledIllustrationQualificationAdversarialFixtures(
      draft,
    ).length
  } adversarial cases.`,
)

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
