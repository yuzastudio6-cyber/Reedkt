import assert from 'node:assert/strict'

import {
  LivingFrameControlledIllustrationSourceObservationError,
  calculateLivingFrameControlledIllustrationSourceObservationDigest,
  createLivingFrameControlledIllustrationSourceObservation,
  createLivingFrameControlledIllustrationSourceObservationAdversarialFixtures,
  createLivingFrameControlledIllustrationSourceObservationFixtureDraft,
  livingFrameControlledIllustrationSourceObservationPacketSchema,
  validateLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame'
import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
  type LivingFrameControlledIllustrationQualification,
} from '../../src/types/living-frame-controlled-illustration-qualification'
import type {
  LivingFrameControlledIllustrationSourceObservationIssueCode,
  LivingFrameControlledIllustrationSourceObservationPacket,
  LivingFrameControlledIllustrationSourceObservationPacketDraft,
} from '../../src/types/living-frame-controlled-illustration-source-observation'
import {
  canonicalLivingFrameControlledIllustrationSourceObservationSchema,
  parseCanonicalLivingFrameControlledIllustrationSourceObservation,
  validateCanonicalLivingFrameControlledIllustrationSourceObservation,
} from '../validation/canonical-living-frame-controlled-illustration-source-observation-schemas'

async function expectDraftRejection(
  qualification: LivingFrameControlledIllustrationQualification,
  payload: unknown,
  expectedCode:
    LivingFrameControlledIllustrationSourceObservationIssueCode,
  fixtureId: string,
): Promise<void> {
  let caught: unknown
  try {
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft:
        payload as LivingFrameControlledIllustrationSourceObservationPacketDraft,
    })
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameControlledIllustrationSourceObservationError,
    `${fixtureId} must fail through the source-observation contract.`,
  )
  assert.ok(
    caught.issues.some((issue) => issue.code === expectedCode),
    `${fixtureId} must report ${expectedCode}; got ${
      caught.issues.map((issue) => issue.code).join(', ')
    }.`,
  )
  assert.equal(
    caught.message,
    'Living Frame controlled-illustration source observation failed.',
    `${fixtureId} must not echo rejected values.`,
  )
}

function assertAllAuthorityClosed(
  packet: LivingFrameControlledIllustrationSourceObservationPacket,
): void {
  assert.equal(
    packet.authorityBoundary.controlledUpstreamObservationOnly,
    true,
  )
  for (const [key, value] of Object.entries(packet.authorityBoundary)) {
    if (key === 'controlledUpstreamObservationOnly') continue
    assert.equal(value, false, `${key} must remain literal false.`)
  }
  for (const candidate of packet.candidateObservations) {
    assert.equal(candidate.controlledObservationOnly, true)
    assert.equal(candidate.evaluationOnly, true)
    for (const [key, value] of Object.entries(candidate)) {
      if ([
        'candidateObservationId',
        'order',
        'candidateKey',
        'candidateClass',
        'disposition',
        'sourceObservations',
        'unresolvedArtifactFamilyCodes',
        'requiredReviewGateCodes',
        'controlledObservationOnly',
        'evaluationOnly',
      ].includes(key)) continue
      assert.equal(
        value,
        false,
        `${candidate.candidateKey}.${key} must remain literal false.`,
      )
    }
    for (const source of candidate.sourceObservations) {
      assert.equal(source.controlledSourceObservationOnly, true)
      assert.equal(source.independentSourceReReadRequired, true)
      for (const [key, value] of Object.entries(source)) {
        if ([
          'sourceObservationId',
          'order',
          'sourceLocatorCode',
          'sourceClass',
          'observedImmutableRevisionSha1',
          'observedOnDate',
          'declaredDocumentObservations',
          'controlledSourceObservationOnly',
          'independentSourceReReadRequired',
        ].includes(key)) continue
        assert.equal(
          value,
          false,
          `${candidate.candidateKey}.${source.sourceLocatorCode}.${key} must remain false.`,
        )
      }
      for (const document of source.declaredDocumentObservations) {
        assert.equal(document.controlledDocumentObservationOnly, true)
        assert.equal(document.independentSourceReReadRequired, true)
        assert.equal(document.currentTruthAuthority, false)
        assert.equal(document.releasedEvidence, false)
        assert.equal(document.legalInterpretationProvided, false)
        assert.equal(document.commercialApprovalProvided, false)
        assert.equal(document.redistributionApprovalProvided, false)
        assert.equal(document.modelWeightApprovalProvided, false)
      }
    }
  }
  for (const rule of packet.dependencyScopeRules) {
    assert.equal(rule.unresolved, true)
    assert.equal(rule.independentArtifactAdmissionRequired, true)
    assert.equal(rule.promotionAllowed, false)
    assert.equal(rule.legalOrCommercialConclusionProvided, false)
  }
}

const { qualification, draft } =
  await createLivingFrameControlledIllustrationSourceObservationFixtureDraft()
const packet =
  await createLivingFrameControlledIllustrationSourceObservation({
    qualification,
    draft,
  })
const validation =
  await validateLivingFrameControlledIllustrationSourceObservation(
    packet,
    qualification,
  )
assert.equal(validation.ok, true)
const serverValidation =
  await validateCanonicalLivingFrameControlledIllustrationSourceObservation(
    packet,
    qualification,
  )
assert.equal(serverValidation.ok, true)
assert.equal(
  livingFrameControlledIllustrationSourceObservationPacketSchema
    .safeParse(packet).success,
  true,
)
assert.equal(
  canonicalLivingFrameControlledIllustrationSourceObservationSchema
    .safeParse(packet).success,
  true,
)
assert.deepEqual(
  await parseCanonicalLivingFrameControlledIllustrationSourceObservation(
    packet,
    qualification,
  ),
  packet,
)
assertAllAuthorityClosed(packet)
assert.deepEqual(
  packet.candidateObservations.map((candidate) => candidate.candidateKey),
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS,
)
assert.equal(packet.candidateObservations.length, 6)
assert.equal(packet.observedOnDate, '2026-07-28')
assert.equal(
  JSON.stringify(packet).includes('://'),
  false,
  'Browser-shareable packet must contain no URL.',
)
assert.equal(
  JSON.stringify(packet).includes('/Users/'),
  false,
  'Browser-shareable packet must contain no filesystem path.',
)

const revisionByLocator = new Map(
  packet.candidateObservations.flatMap((candidate) =>
    candidate.sourceObservations.map((source) => [
      source.sourceLocatorCode,
      source.observedImmutableRevisionSha1,
    ] as const),
  ),
)
assert.equal(
  revisionByLocator.get('github_comfy_org_comfyui'),
  '806e092ed42772e4ce7abf44c97c50021cc4bd10',
)
assert.equal(
  revisionByLocator.get('hf_h94_ip_adapter_faceid'),
  '43907e6f44d079bf1a9102d9a6e56aef7a219bae',
)
assert.equal(
  revisionByLocator.get('hf_fal_auraface_v1'),
  'af6d057c9b0ec4071d4c49c80e3539258798b609',
)

const faceId = packet.candidateObservations
  .find((candidate) => candidate.candidateKey === 'ip_adapter')!
  .sourceObservations.find(
    (source) => source.sourceLocatorCode === 'hf_h94_ip_adapter_faceid',
  )!
assert.equal(
  faceId.declaredDocumentObservations[0]!.declaredLabelObservation,
  'research_only_noncommercial_model_card_statement',
)
const auraFace = packet.candidateObservations.find(
  (candidate) => candidate.candidateKey === 'auraface',
)!
assert.equal(
  auraFace.disposition,
  'continuity_measurement_only_unqualified',
)
assert.ok(auraFace.sourceObservations.some(
  (source) =>
    source.sourceLocatorCode === 'hf_fal_auraface_v1',
))
const peft = packet.candidateObservations.find(
  (candidate) => candidate.candidateKey === 'peft_lora',
)!
assert.equal(peft.disposition, 'mechanism_only_no_loaded_artifact')

for (
  const fixture of
  createLivingFrameControlledIllustrationSourceObservationAdversarialFixtures(
    draft,
  )
) {
  await expectDraftRejection(
    qualification,
    fixture.payload,
    fixture.expectedIssueCode,
    fixture.fixtureId,
  )
}

const setPermutation = cloneJson(draft)
setPermutation.candidateObservations =
  [...setPermutation.candidateObservations].reverse().map((candidate) => ({
    ...candidate,
    sourceObservations: [...candidate.sourceObservations].reverse().map(
      (source) => ({
        ...source,
        declaredDocumentObservations: [
          ...source.declaredDocumentObservations,
        ].reverse(),
      }),
    ),
    unresolvedArtifactFamilyCodes: [
      ...candidate.unresolvedArtifactFamilyCodes,
    ].reverse(),
    requiredReviewGateCodes: [
      ...candidate.requiredReviewGateCodes,
    ].reverse(),
  }))
setPermutation.dependencyScopeRules =
  [...setPermutation.dependencyScopeRules].reverse().map((rule) => ({
    ...rule,
    affectedCandidateKeys: [...rule.affectedCandidateKeys].reverse(),
    relatedSourceLocatorCodes:
      [...rule.relatedSourceLocatorCodes].reverse(),
  }))
assert.equal(
  (
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft: setPermutation,
    })
  ).observationPacketDigestSha256,
  packet.observationPacketDigestSha256,
  'Set-like arrays and explicitly ordered observations must canonicalize.',
)

const changedDate = cloneJson(draft)
changedDate.observedOnDate = '2026-07-27'
for (const candidate of changedDate.candidateObservations) {
  for (const source of candidate.sourceObservations) {
    source.observedOnDate = '2026-07-27'
    for (const document of source.declaredDocumentObservations) {
      document.observedOnDate = '2026-07-27'
    }
  }
}
assert.notEqual(
  (
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft: changedDate,
    })
  ).observationPacketDigestSha256,
  packet.observationPacketDigestSha256,
  'The observation date is digest-bearing controlled evidence.',
)

const changedRevision = cloneJson(draft)
changedRevision.candidateObservations[0]!.sourceObservations[0]!
  .observedImmutableRevisionSha1 = 'a'.repeat(40)
assert.notEqual(
  (
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft: changedRevision,
    })
  ).observationPacketDigestSha256,
  packet.observationPacketDigestSha256,
  'A changed observed revision must change the packet digest.',
)

const digestTamper = {
  ...cloneJson(packet),
  observationPacketDigestSha256: 'a'.repeat(64),
}
const digestValidation =
  await validateLivingFrameControlledIllustrationSourceObservation(
    digestTamper,
    qualification,
  )
assert.equal(digestValidation.ok, false)
assert.ok(
  !digestValidation.ok &&
  digestValidation.issues.some(
    (issue) => issue.code === 'digest_mismatch',
  ),
)

const forgedAllGreen = cloneJson(draft) as unknown as Record<string, unknown>
const forgedCandidates = forgedAllGreen.candidateObservations
assert.ok(Array.isArray(forgedCandidates))
for (const value of forgedCandidates) {
  const candidate = value as Record<string, unknown>
  candidate.exactArtifactInventoryPresent = true
  candidate.commercialUseApproved = true
  candidate.canonicalRegistryAdmitted = true
  candidate.dispatchAuthorized = true
  candidate.runtimeAuthorized = true
  candidate.productionReady = true
}
await expectDraftRejection(
  qualification,
  forgedAllGreen,
  'observation_promotion_forbidden',
  'forged_all_green_packet',
)

const qualificationTamper = cloneJson(
  qualification,
) as LivingFrameControlledIllustrationQualification
;(qualificationTamper as { qualificationDigestSha256: string })
  .qualificationDigestSha256 = 'a'.repeat(64)
await expectDraftRejection(
  qualificationTamper,
  draft,
  'qualification_invalid',
  'forged_qualification_input',
)

const cycle: Record<string, unknown> = {}
cycle.self = cycle
await expectDraftRejection(
  qualification,
  cycle,
  'non_json_input',
  'cyclic_non_json_input',
)

const unsafeKeyToken = 'https://example.invalid/do-not-echo'
let unsafeKeyError: unknown
try {
  await createLivingFrameControlledIllustrationSourceObservation({
    qualification,
    draft: {
      ...cloneJson(draft),
      [unsafeKeyToken]: '\u0001',
    } as unknown as LivingFrameControlledIllustrationSourceObservationPacketDraft,
  })
} catch (error) {
  unsafeKeyError = error
}
assert.ok(
  unsafeKeyError instanceof
    LivingFrameControlledIllustrationSourceObservationError,
)
assert.equal(
  JSON.stringify(unsafeKeyError.issues).includes(unsafeKeyToken),
  false,
  'Validation reports must not echo an unsafe input key.',
)

assert.equal(
  await calculateLivingFrameControlledIllustrationSourceObservationDigest(
    draft,
  ),
  packet.observationPacketDigestSha256,
)

console.log(
  'Living Frame controlled-illustration source-observation smoke passed '
  + `1 controlled packet / ${
    createLivingFrameControlledIllustrationSourceObservationAdversarialFixtures(
      draft,
    ).length + 4
  } adversarial/integrity cases.`,
)

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

function cloneJson<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>
}
