import assert from 'node:assert/strict'

import {
  createLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'
import {
  createLivingFrameControlledIllustrationSourceObservationFixtureDraft,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-fixtures'
import {
  LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  createLivingFrameAuraFaceArtifactRequirements,
  LivingFrameAuraFaceArtifactRequirementsError,
  verifyLivingFrameAuraFaceArtifactRequirements,
} from '../living-frame/living-frame-auraface-artifact-requirements'

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

  assert.equal(
    verifyLivingFrameAuraFaceArtifactRequirements(requirements),
    true,
  )
  assert.equal(requirements.artifacts.length, 2)
  assert.equal(
    requirements.artifacts[0].requirementId,
    'auraface_v1_embedding_model',
  )
  assert.equal(
    requirements.artifacts[0].byteLength,
    260_694_151,
  )
  assert.equal(
    requirements.artifacts[0].contentSha256,
    'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60',
  )
  assert.equal(
    requirements.artifacts[1].requirementId,
    'auraface_v1_face_detector',
  )
  assert.equal(
    requirements.artifacts[1].byteLength,
    16_923_827,
  )
  assert.equal(
    requirements.artifacts[1].contentSha256,
    '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91',
  )
  assert.equal(
    requirements.bundleSummary.totalByteLength,
    277_617_978,
  )
  assert.equal(requirements.bundleSummary.measurementOnly, true)
  assert.equal(
    requirements.bundleSummary.genderOrAgeModelIncluded,
    false,
  )
  assert.equal(
    requirements.bundleSummary.identityGenerationAdapterIncluded,
    false,
  )
  assert.equal(
    requirements.measurementPolicy.mayGenerateOrConditionIdentity,
    false,
  )
  assert.equal(
    requirements.measurementPolicy.embeddingBytesSerializable,
    false,
  )
  assert.equal(
    requirements.safetyPolicy
      .provenanceAndTrainingDataRightsUnresolved,
    true,
  )
  assert.equal(
    requirements.safetyPolicy.paidProductionUseApproved,
    false,
  )
  assert.equal(
    requirements.costLineage
      .separateCpuContinuityMeasurementAttempt,
    true,
  )
  assert.equal(
    requirements.costLineage.excludedFromSharedComfyuiGpuAttempt,
    true,
  )
  assert.deepEqual(
    requirements.openGateCodes,
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES,
  )
  assertAllPromotionAuthoritiesFalse(requirements)

  const serialized = JSON.stringify(requirements)
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    '/tmp/',
    '"embeddingBytes"',
    '"identityReference"',
    '"priceUsd"',
    '"customerCredits"',
    '"serviceFee"',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }

  let adversarialAssertions = 0
  await expectCreateIssue(
    {
      qualification: {
        ...qualification,
        qualificationDigestSha256: 'a'.repeat(64),
      },
      sourceObservation,
    },
    'qualification_invalid',
  )
  adversarialAssertions += 1
  await expectCreateIssue(
    {
      qualification,
      sourceObservation: {
        ...sourceObservation,
        observationPacketDigestSha256: 'a'.repeat(64),
      },
    },
    'source_observation_invalid',
  )
  adversarialAssertions += 1

  assertRejected({
    ...requirements,
    requirementSetDigestSha256: 'a'.repeat(64),
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    artifacts: [...requirements.artifacts].reverse(),
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    artifacts: [
      {
        ...requirements.artifacts[0],
        contentSha256:
          requirements.artifacts[1].contentSha256,
      },
      requirements.artifacts[1],
    ],
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    openGateCodes: [...requirements.openGateCodes].reverse(),
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    authorityBoundary: {
      ...requirements.authorityBoundary,
      runtimeAuthority: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    safetyPolicy: {
      ...requirements.safetyPolicy,
      paidProductionUseApproved: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    measurementPolicy: {
      ...requirements.measurementPolicy,
      mayGenerateOrConditionIdentity: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    measurementPolicy: {
      ...requirements.measurementPolicy,
      embeddingBytesSerializable: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    bundleSummary: {
      ...requirements.bundleSummary,
      genderOrAgeModelIncluded: true,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    costLineage: {
      ...requirements.costLineage,
      excludedFromSharedComfyuiGpuAttempt: false,
    },
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    runtimeExecuted: true,
    continuityMeasurementCreated: true,
    productionReady: true,
  })
  adversarialAssertions += 1
  assertRejected({
    ...requirements,
    sourceUrl: 'https://example.invalid/model',
  })
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 14)
  console.log(
    'Living Frame AuraFace artifact requirements smoke passed: '
      + '2 exact controlled artifact identities and '
      + `${adversarialAssertions} adversarial assertions.`,
  )
}

function assertRejected(value: unknown): void {
  assert.equal(
    verifyLivingFrameAuraFaceArtifactRequirements(value),
    false,
  )
}

async function expectCreateIssue(
  input: Parameters<
    typeof createLivingFrameAuraFaceArtifactRequirements
  >[0],
  expectedCode:
    LivingFrameAuraFaceArtifactRequirementsError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await assert.rejects(
    () => createLivingFrameAuraFaceArtifactRequirements(input),
    (error: unknown) => {
      assert(
        error instanceof LivingFrameAuraFaceArtifactRequirementsError,
      )
      assert.equal(error.issues[0]?.code, expectedCode)
      return true
    },
  )
}

function assertAllPromotionAuthoritiesFalse(
  requirements: Awaited<
    ReturnType<typeof createLivingFrameAuraFaceArtifactRequirements>
  >,
): void {
  const authority = requirements.authorityBoundary
  assert.equal(authority.controlledArtifactRequirementAuthority, true)
  for (const [key, value] of Object.entries(authority)) {
    if (key === 'controlledArtifactRequirementAuthority') continue
    assert.equal(value, false, `${key} must remain false`)
  }
  assert.equal(requirements.artifactRepositoryLocatorCreated, false)
  assert.equal(requirements.artifactIngested, false)
  assert.equal(requirements.operationRegistered, false)
  assert.equal(requirements.runtimeExecuted, false)
  assert.equal(requirements.continuityMeasurementCreated, false)
  assert.equal(requirements.productionReady, false)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
