import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlControlNetByteObservationAuthority,
} from '../../src/types/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  createLivingFrameControlledSdxlControlNetByteObservation,
  createLivingFrameControlledSdxlControlNetByteReader,
  verifyLivingFrameControlledSdxlControlNetByteObservation,
} from '../living-frame/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  createLivingFrameControlledSdxlLoraByteObservation,
  createLivingFrameControlledSdxlLoraByteReader,
} from '../living-frame/living-frame-controlled-sdxl-lora-byte-observation'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const suppliedControlNetPath =
  process.env.REEDITPRO_SDXL_CONTROLNET_MODEL_PATH
const suppliedLoraPath =
  process.env.REEDITPRO_SDXL_LORA_MODEL_PATH

if (!suppliedControlNetPath || !suppliedLoraPath) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-controlnet-byte-observation',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_paths_not_injected',
    requiredEnvironmentVariables: [
      'REEDITPRO_SDXL_CONTROLNET_MODEL_PATH',
      'REEDITPRO_SDXL_LORA_MODEL_PATH',
    ],
    exactArtifactExecuted: false,
    productionReady: false,
  }))
} else {
  await runExactArtifactSmoke(
    await realpath(suppliedControlNetPath),
    await realpath(suppliedLoraPath),
  )
}

async function runExactArtifactSmoke(
  controlNetPath: string,
  loraPath: string,
): Promise<void> {
  const controlNetStat = await lstat(controlNetPath)
  assert.equal(controlNetStat.isFile(), true)
  assert.equal(
    controlNetStat.size,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
  )
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const priorLoraObservation =
    await createLivingFrameControlledSdxlLoraByteObservation({
      observationId:
        'sdxl-lora-byte-observation.controlnet-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(loraPath),
        }),
    })
  const reader =
    createLivingFrameControlledSdxlControlNetByteReader({
      openServerOwnedByteStream: async () =>
        createReadStream(controlNetPath),
    })
  const input = {
    observationId:
      'sdxl-controlnet-byte-observation.controlled.001',
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    byteReader: reader,
  }
  const observation =
    await createLivingFrameControlledSdxlControlNetByteObservation(
      input,
    )
  assert.equal(
    await verifyLivingFrameControlledSdxlControlNetByteObservation(
      observation,
      {
        candidateSet: fixture.candidateSet,
        candidateSetInput: fixture.input,
        priorLoraObservation,
      },
    ),
    true,
  )
  assert.equal(
    observation.byteVerification.observedByteLength,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH,
  )
  assert.equal(
    observation.byteVerification.observedContentSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_CONTENT_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.headerLength,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_HEADER_LENGTH,
  )
  assert.equal(
    observation.safetensorsStructure
      .tensorNameSetDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_TENSOR_NAME_SET_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.metadataDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_METADATA_SHA256,
  )
  assert.equal(observation.safetensorsStructure.tensorCount, 140)
  assert.deepEqual(
    observation.safetensorsStructure.dtypeCounts,
    [{ dtype: 'F16', count: 140 }],
  )
  assert.deepEqual(
    observation.safetensorsStructure.rankCounts,
    [
      { rank: 1, count: 87 },
      { rank: 2, count: 14 },
      { rank: 4, count: 39 },
    ],
  )
  assert.equal(
    observation.compatibilityClues
      .sdxlTextTimeConditioningShapeCluesPresent,
    true,
  )
  assert.equal(
    observation.compatibilityClues
      .controlNetConditioningPathShapeCluesPresent,
    true,
  )
  assert.equal(
    observation.compatibilityClues
      .embeddedMetadataNamesExactModelFamily,
    false,
  )
  assert.equal(
    observation.compatibilityClues
      .embeddedMetadataNamesCannyConditioning,
    false,
  )
  assert.equal(
    observation.bundleProgress
      .independentlyVerifiedArtifactByteCount,
    2,
  )
  assert.equal(
    observation.bundleProgress
      .remainingUnverifiedArtifactCodes.length,
    3,
  )
  assert.equal(
    observation.bundleProgress.completeBundleBytesVerified,
    false,
  )
  assert.equal(
    observation.bundleProgress.exactBundleCompatibilityProven,
    false,
  )
  assert.equal(observation.modelLoadedOrExecuted, false)
  assert.equal(observation.generationPerformed, false)
  assert.equal(observation.productionReady, false)
  assertAuthorityBoundary(observation.authorityBoundary)

  const serialized = JSON.stringify(observation)
  for (const forbidden of [
    controlNetPath,
    loraPath,
    '/tmp/',
    '/Users/',
    '://',
    '.safetensors',
    'credential',
    'authorization',
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `Serialized observation must not include ${forbidden}.`,
    )
  }

  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        byteReader: null,
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        byteReader: { ...reader },
      } as never),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation(
        input,
      ),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        observationId: '../unsafe',
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(controlNetPath),
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () => {
              throw new Error('unavailable')
            },
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(controlNetPath, {
                start: 0,
                end: 1_023,
              }),
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createSameLengthWrongContentStream(),
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        priorLoraObservation: {
          ...priorLoraObservation,
          observationDigestSha256: 'a'.repeat(64),
        },
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(controlNetPath),
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        candidateSet: {
          ...fixture.candidateSet,
          candidateSetDigestSha256: 'b'.repeat(64),
        },
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(controlNetPath),
          }),
      }),
    /controlled SDXL ControlNet byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlControlNetByteObservation({
        ...input,
        approved: true,
        runtimeReady: true,
        byteReader:
          createLivingFrameControlledSdxlControlNetByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(controlNetPath),
          }),
      } as never),
    /controlled SDXL ControlNet byte observation failed/,
  )

  for (const forged of [
    {
      ...observation,
      observationDigestSha256: 'c'.repeat(64),
    },
    {
      ...observation,
      productionReady: true,
    },
    {
      ...observation,
      artifactPath: '/tmp/forged.safetensors',
    },
    {
      ...observation,
      bundleProgress: {
        ...observation.bundleProgress,
        completeBundleBytesVerified: true,
        exactBundleCompatibilityProven: true,
      },
    },
    {
      ...observation,
      authorityBoundary: {
        ...observation.authorityBoundary,
        artifactRepositoryAuthority: true,
        modelWeightAuthority: true,
        operationAuthority: true,
        runtimeAuthority: true,
        productionAuthority: true,
      },
    },
  ] as const) {
    assert.equal(
      await verifyLivingFrameControlledSdxlControlNetByteObservation(
        forged,
        {
          candidateSet: fixture.candidateSet,
          candidateSetInput: fixture.input,
          priorLoraObservation,
        },
      ),
      false,
    )
  }

  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-controlnet-byte-observation',
    controlledFixtures: 1,
    adversarialAssertions: 15,
    exactArtifactExecuted: true,
    observedByteLength:
      observation.byteVerification.observedByteLength,
    tensorCount:
      observation.safetensorsStructure.tensorCount,
    embeddedMetadataNamesExactModelFamily: false,
    embeddedMetadataNamesCannyConditioning: false,
    independentlyVerifiedArtifactByteCount:
      observation.bundleProgress
        .independentlyVerifiedArtifactByteCount,
    completeBundleBytesVerified: false,
    exactBundleCompatibilityProven: false,
    productionReady: false,
  }))
}

function createSameLengthWrongContentStream(): Readable {
  async function* chunks(): AsyncGenerator<Buffer> {
    const chunk = Buffer.alloc(1024 * 1024)
    let remaining =
      LIVING_FRAME_CONTROLLED_SDXL_CONTROLNET_BYTE_LENGTH
    while (remaining > 0) {
      const length = Math.min(remaining, chunk.length)
      yield chunk.subarray(0, length)
      remaining -= length
    }
  }
  return Readable.from(chunks())
}

function assertAuthorityBoundary(
  authority:
    LivingFrameControlledSdxlControlNetByteObservationAuthority,
): void {
  const expectedTrue = new Set([
    'processBoundServerOwnedBytesConsumed',
    'fullContentDigestVerificationAuthority',
    'safetensorsStructureObservationAuthority',
  ])
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      expectedTrue.has(key),
      `Unexpected authority value for ${key}.`,
    )
  }
}
