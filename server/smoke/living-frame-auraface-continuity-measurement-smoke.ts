import assert from 'node:assert/strict'

import {
  createLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'
import {
  createLivingFrameControlledIllustrationSourceObservationFixtureDraft,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-fixtures'
import {
  LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
} from '../../src/types/living-frame-auraface-continuity-measurement'
import {
  createLivingFrameAuraFaceArtifactRequirements,
} from '../living-frame/living-frame-auraface-artifact-requirements'
import {
  createLivingFrameAuraFaceContinuityMeasurement,
  createLivingFrameAuraFacePrivateEmbeddingReader,
  LivingFrameAuraFaceContinuityMeasurementError,
  verifyLivingFrameAuraFaceContinuityMeasurement,
  type LivingFrameAuraFacePrivateEmbeddingPacket,
} from '../living-frame/living-frame-auraface-continuity-measurement'

const DIGESTS = {
  referenceArtifact: '1'.repeat(64),
  candidateArtifact: '2'.repeat(64),
  referenceContinuity: '3'.repeat(64),
  candidateContinuity: '4'.repeat(64),
  preprocessing: '5'.repeat(64),
  referenceInference: '6'.repeat(64),
  candidateInference: '7'.repeat(64),
} as const

async function main(): Promise<void> {
  const { qualification, draft } =
    await createLivingFrameControlledIllustrationSourceObservationFixtureDraft()
  const sourceObservation =
    await createLivingFrameControlledIllustrationSourceObservation({
      qualification,
      draft,
    })
  const requirements =
    await createLivingFrameAuraFaceArtifactRequirements({
      qualification,
      sourceObservation,
    })

  const reference = basis(0, 1)
  const identical = basis(0, 7)
  const orthogonal = basis(1, 1)
  const opposite = basis(0, -1)
  const identicalResult = await measure(
    requirements,
    reference,
    identical,
  )
  const orthogonalResult = await measure(
    requirements,
    reference,
    orthogonal,
  )
  const oppositeResult = await measure(
    requirements,
    reference,
    opposite,
  )

  assert.equal(
    verifyLivingFrameAuraFaceContinuityMeasurement(
      identicalResult,
    ),
    true,
  )
  assert.equal(identicalResult.measurement.scorePpm, 1_000_000)
  assert.equal(orthogonalResult.measurement.scorePpm, 0)
  assert.equal(oppositeResult.measurement.scorePpm, -1_000_000)
  assert.equal(
    identicalResult.measurement.thresholdApplied,
    false,
  )
  assert.equal(
    identicalResult.measurement.outcome,
    'measurement_only_project_calibration_and_user_review_required',
  )
  assert.equal(
    identicalResult.measurement.identityOrLikenessApproved,
    false,
  )
  assert.equal(
    identicalResult.privacyBoundary.embeddingsIncluded,
    false,
  )
  assert.equal(
    identicalResult.privacyBoundary.measurementPersistenceAuthorized,
    false,
  )
  assert.equal(
    identicalResult.costLineage
      .separateCpuMeasurementAttemptExpected,
    true,
  )
  assert.equal(
    identicalResult.costLineage
      .excludedFromSharedComfyuiGpuAttempt,
    true,
  )
  assert.deepEqual(
    identicalResult.openGateCodes,
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES,
  )
  assertAllPromotionAuthoritiesFalse(identicalResult)

  const serialized = JSON.stringify(identicalResult)
  for (const forbidden of [
    'Float32Array',
    '"referenceEmbedding"',
    '"candidateEmbedding"',
    'https://',
    'http://',
    'file://',
    '/tmp/',
    '"priceUsd"',
    '"customerCredits"',
    '"serviceFee"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) assert.equal(serialized.includes(forbidden), false)

  let adversarialAssertions = 0
  await expectIssue(
    () => createLivingFrameAuraFaceContinuityMeasurement({
      artifactRequirements: {
        ...requirements,
        requirementSetDigestSha256: 'a'.repeat(64),
      },
      embeddingReader: {} as never,
    }),
    'input_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => createLivingFrameAuraFaceContinuityMeasurement({
      artifactRequirements: requirements,
      embeddingReader: {
        ...createReader(requirements, packet(
          requirements.requirementSetDigestSha256,
          reference,
          identical,
        )),
      },
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    packet('a'.repeat(64), reference, identical),
    'packet_lineage_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    {
      ...packet(
        requirements.requirementSetDigestSha256,
        reference,
        identical,
      ),
      referenceFaceCount: 0,
    } as never,
    'face_count_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    {
      ...packet(
        requirements.requirementSetDigestSha256,
        reference,
        identical,
      ),
      candidateFaceCount: 2,
    } as never,
    'face_count_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    {
      ...packet(
        requirements.requirementSetDigestSha256,
        reference,
        identical,
      ),
      embeddingDimension: 511,
    } as never,
    'embedding_dimension_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    packet(
      requirements.requirementSetDigestSha256,
      new Float32Array(511).fill(1),
      identical,
    ),
    'embedding_dimension_invalid',
  )
  adversarialAssertions += 1

  const nonFinite = basis(0, 1)
  nonFinite[5] = Number.NaN
  await expectPacketIssue(
    requirements,
    packet(
      requirements.requirementSetDigestSha256,
      nonFinite,
      identical,
    ),
    'embedding_value_invalid',
  )
  adversarialAssertions += 1

  await expectPacketIssue(
    requirements,
    packet(
      requirements.requirementSetDigestSha256,
      new Float32Array(512),
      identical,
    ),
    'embedding_zero_norm',
  )
  adversarialAssertions += 1

  if (typeof SharedArrayBuffer !== 'undefined') {
    const shared = new Float32Array(
      new SharedArrayBuffer(512 * Float32Array.BYTES_PER_ELEMENT),
    )
    shared[0] = 1
    await expectPacketIssue(
      requirements,
      packet(
        requirements.requirementSetDigestSha256,
        shared,
        identical,
      ),
      'embedding_buffer_forbidden',
    )
    adversarialAssertions += 1
  }

  await expectPacketIssue(
    requirements,
    {
      ...packet(
        requirements.requirementSetDigestSha256,
        reference,
        identical,
      ),
      threshold: 0.7,
    } as never,
    'packet_invalid',
  )
  adversarialAssertions += 1

  const reusableReader = createReader(
    requirements,
    packet(
      requirements.requirementSetDigestSha256,
      reference,
      identical,
    ),
  )
  await createLivingFrameAuraFaceContinuityMeasurement({
    artifactRequirements: requirements,
    embeddingReader: reusableReader,
  })
  await expectIssue(
    () => createLivingFrameAuraFaceContinuityMeasurement({
      artifactRequirements: requirements,
      embeddingReader: reusableReader,
    }),
    'reader_reused',
  )
  adversarialAssertions += 1

  const throwingReader =
    createLivingFrameAuraFacePrivateEmbeddingReader({
      artifactRequirements: requirements,
      evidenceClass:
        'controlled_non_promotable_embedding_fixture',
      ...readerDigestBindings(),
      readServerOwnedEmbeddingFixture: async () => {
        throw new Error('controlled fixture read failed')
      },
    })
  await expectIssue(
    () => createLivingFrameAuraFaceContinuityMeasurement({
      artifactRequirements: requirements,
      embeddingReader: throwingReader,
    }),
    'reader_failed',
  )
  adversarialAssertions += 1

  assertRejected({
    ...identicalResult,
    measurementDigestSha256: 'a'.repeat(64),
  })
  adversarialAssertions += 1
  assertRejected({
    ...identicalResult,
    measurement: {
      ...identicalResult.measurement,
      thresholdApplied: true,
      identityOrLikenessApproved: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...identicalResult,
    privacyBoundary: {
      ...identicalResult.privacyBoundary,
      browserShareable: true,
      measurementPersistenceAuthorized: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...identicalResult,
    authorityBoundary: {
      ...identicalResult.authorityBoundary,
      qaApprovalAuthority: true,
      productionAuthority: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...identicalResult,
    referenceEmbedding: [...reference],
  })
  adversarialAssertions += 1
  assertRejected({
    ...identicalResult,
    subject: 'musashi',
  })
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 19)
  console.log(
    'Living Frame AuraFace continuity measurement smoke passed: '
      + '3 deterministic cosine anchors and '
      + `${adversarialAssertions} adversarial assertions.`,
  )
}

async function measure(
  requirements: Awaited<
    ReturnType<typeof createLivingFrameAuraFaceArtifactRequirements>
  >,
  reference: Float32Array,
  candidate: Float32Array,
) {
  return createLivingFrameAuraFaceContinuityMeasurement({
    artifactRequirements: requirements,
    embeddingReader: createReader(
      requirements,
      packet(
        requirements.requirementSetDigestSha256,
        reference,
        candidate,
      ),
    ),
  })
}

function createReader(
  requirements: Awaited<
    ReturnType<typeof createLivingFrameAuraFaceArtifactRequirements>
  >,
  value: LivingFrameAuraFacePrivateEmbeddingPacket,
) {
  return createLivingFrameAuraFacePrivateEmbeddingReader({
    artifactRequirements: requirements,
    evidenceClass:
      'controlled_non_promotable_embedding_fixture',
    ...readerDigestBindings(),
    readServerOwnedEmbeddingFixture: async () => value,
  })
}

function readerDigestBindings() {
  return {
    referenceArtifactDigestSha256: DIGESTS.referenceArtifact,
    candidateArtifactDigestSha256: DIGESTS.candidateArtifact,
    referenceContinuityEntryDigestSha256:
      DIGESTS.referenceContinuity,
    candidateContinuityEntryDigestSha256:
      DIGESTS.candidateContinuity,
    preprocessingSpecDigestSha256: DIGESTS.preprocessing,
    referenceInferenceOutputDigestSha256:
      DIGESTS.referenceInference,
    candidateInferenceOutputDigestSha256:
      DIGESTS.candidateInference,
  } as const
}

function packet(
  requirementDigest: string,
  referenceEmbedding: Float32Array,
  candidateEmbedding: Float32Array,
): LivingFrameAuraFacePrivateEmbeddingPacket {
  return {
    packetClass:
      'server_owned_controlled_auraface_embedding_fixture_packet_v1',
    evidenceClass:
      'controlled_non_promotable_embedding_fixture',
    artifactRequirementSetDigestSha256: requirementDigest,
    referenceArtifactDigestSha256: DIGESTS.referenceArtifact,
    candidateArtifactDigestSha256: DIGESTS.candidateArtifact,
    referenceContinuityEntryDigestSha256:
      DIGESTS.referenceContinuity,
    candidateContinuityEntryDigestSha256:
      DIGESTS.candidateContinuity,
    preprocessingSpecDigestSha256: DIGESTS.preprocessing,
    referenceInferenceOutputDigestSha256:
      DIGESTS.referenceInference,
    candidateInferenceOutputDigestSha256:
      DIGESTS.candidateInference,
    referenceFaceCount: 1,
    candidateFaceCount: 1,
    embeddingDimension: 512,
    referenceEmbedding,
    candidateEmbedding,
    controlledFixtureOnly: true,
    callerThresholdAccepted: false,
    callerBytesPathUrlOrCredentialAccepted: false,
    liveInferenceAuthority: false,
    identityApprovalAuthority: false,
    actualCostAuthority: false,
    productionReady: false,
  }
}

function basis(index: number, value: number): Float32Array {
  const vector = new Float32Array(512)
  vector[index] = value
  return vector
}

async function expectPacketIssue(
  requirements: Awaited<
    ReturnType<typeof createLivingFrameAuraFaceArtifactRequirements>
  >,
  value: LivingFrameAuraFacePrivateEmbeddingPacket,
  code:
    LivingFrameAuraFaceContinuityMeasurementError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await expectIssue(
    () => createLivingFrameAuraFaceContinuityMeasurement({
      artifactRequirements: requirements,
      embeddingReader: createReader(requirements, value),
    }),
    code,
  )
}

async function expectIssue(
  operation: () => Promise<unknown>,
  code:
    LivingFrameAuraFaceContinuityMeasurementError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await assert.rejects(
    operation,
    (error: unknown) =>
      error instanceof LivingFrameAuraFaceContinuityMeasurementError
      && error.issues[0]?.code === code,
  )
}

function assertRejected(value: unknown): void {
  assert.equal(
    verifyLivingFrameAuraFaceContinuityMeasurement(value),
    false,
  )
}

function assertAllPromotionAuthoritiesFalse(
  result: Awaited<ReturnType<typeof measure>>,
): void {
  const boundary = result.authorityBoundary
  for (const [key, value] of Object.entries(boundary)) {
    if (
      key === 'processBoundEmbeddingReadAuthority'
      || key === 'controlledVectorMathAuthority'
    ) {
      assert.equal(value, true)
    } else {
      assert.equal(value, false, `${key} must remain false`)
    }
  }
  assert.equal(result.liveInferenceExecuted, false)
  assert.equal(result.continuityDecisionCreated, false)
  assert.equal(result.productionReady, false)
}

void main()
