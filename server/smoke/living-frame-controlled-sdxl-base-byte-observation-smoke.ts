import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'

import type {
  LivingFrameControlledSdxlBaseByteObservationAuthority,
} from '../../src/types/living-frame-controlled-sdxl-base-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-base-byte-observation'
import {
  createLivingFrameControlledSdxlBaseByteObservation,
  createLivingFrameControlledSdxlBaseByteReader,
  verifyLivingFrameControlledSdxlBaseByteObservation,
} from '../living-frame/living-frame-controlled-sdxl-base-byte-observation'
import {
  createLivingFrameControlledSdxlClipVisionByteObservation,
  createLivingFrameControlledSdxlClipVisionByteReader,
} from '../living-frame/living-frame-controlled-sdxl-clip-vision-byte-observation'
import {
  createLivingFrameControlledSdxlControlNetByteObservation,
  createLivingFrameControlledSdxlControlNetByteReader,
} from '../living-frame/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  createLivingFrameControlledSdxlIpAdapterByteObservation,
  createLivingFrameControlledSdxlIpAdapterByteReader,
} from '../living-frame/living-frame-controlled-sdxl-ipadapter-byte-observation'
import {
  createLivingFrameControlledSdxlLoraByteObservation,
  createLivingFrameControlledSdxlLoraByteReader,
} from '../living-frame/living-frame-controlled-sdxl-lora-byte-observation'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const suppliedBasePath =
  process.env.REEDITPRO_SDXL_BASE_MODEL_PATH
const suppliedClipVisionPath =
  process.env.REEDITPRO_SDXL_CLIP_VISION_MODEL_PATH
const suppliedIpAdapterPath =
  process.env.REEDITPRO_SDXL_IPADAPTER_MODEL_PATH
const suppliedControlNetPath =
  process.env.REEDITPRO_SDXL_CONTROLNET_MODEL_PATH
const suppliedLoraPath =
  process.env.REEDITPRO_SDXL_LORA_MODEL_PATH

if (
  !suppliedBasePath
  || !suppliedClipVisionPath
  || !suppliedIpAdapterPath
  || !suppliedControlNetPath
  || !suppliedLoraPath
) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-base-byte-observation',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_paths_not_injected',
    requiredEnvironmentVariables: [
      'REEDITPRO_SDXL_BASE_MODEL_PATH',
      'REEDITPRO_SDXL_CLIP_VISION_MODEL_PATH',
      'REEDITPRO_SDXL_IPADAPTER_MODEL_PATH',
      'REEDITPRO_SDXL_CONTROLNET_MODEL_PATH',
      'REEDITPRO_SDXL_LORA_MODEL_PATH',
    ],
    exactArtifactExecuted: false,
    productionReady: false,
  }))
} else {
  await runExactArtifactSmoke(
    await realpath(suppliedBasePath),
    await realpath(suppliedClipVisionPath),
    await realpath(suppliedIpAdapterPath),
    await realpath(suppliedControlNetPath),
    await realpath(suppliedLoraPath),
  )
}

async function runExactArtifactSmoke(
  basePath: string,
  clipVisionPath: string,
  ipAdapterPath: string,
  controlNetPath: string,
  loraPath: string,
): Promise<void> {
  const stat = await lstat(basePath)
  assert.equal(stat.isFile(), true)
  assert.equal(
    stat.size,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
  )
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const priorLoraObservation =
    await createLivingFrameControlledSdxlLoraByteObservation({
      observationId:
        'sdxl-lora-byte-observation.base-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(loraPath),
        }),
    })
  const priorControlNetObservation =
    await createLivingFrameControlledSdxlControlNetByteObservation({
      observationId:
        'sdxl-controlnet-byte-observation.base-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      byteReader:
        createLivingFrameControlledSdxlControlNetByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(controlNetPath),
        }),
    })
  const priorIpAdapterObservation =
    await createLivingFrameControlledSdxlIpAdapterByteObservation({
      observationId:
        'sdxl-ipadapter-byte-observation.base-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      priorControlNetObservation,
      byteReader:
        createLivingFrameControlledSdxlIpAdapterByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(ipAdapterPath),
        }),
    })
  const priorClipVisionObservation =
    await createLivingFrameControlledSdxlClipVisionByteObservation({
      observationId:
        'sdxl-clip-vision-byte-observation.base-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      priorControlNetObservation,
      priorIpAdapterObservation,
      byteReader:
        createLivingFrameControlledSdxlClipVisionByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(clipVisionPath),
        }),
    })
  const reader =
    createLivingFrameControlledSdxlBaseByteReader({
      openServerOwnedByteStream: async () =>
        createReadStream(basePath),
    })
  const input = {
    observationId:
      'sdxl-base-byte-observation.controlled.001',
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    priorIpAdapterObservation,
    priorClipVisionObservation,
    byteReader: reader,
  }
  const observation =
    await createLivingFrameControlledSdxlBaseByteObservation(
      input,
    )
  const verifyInput = {
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    priorIpAdapterObservation,
    priorClipVisionObservation,
  }
  assert.equal(
    await verifyLivingFrameControlledSdxlBaseByteObservation(
      observation,
      verifyInput,
    ),
    true,
  )
  assert.equal(
    observation.byteVerification.observedByteLength,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH,
  )
  assert.equal(
    observation.byteVerification.observedContentSha256,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.headerLength,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH,
  )
  assert.equal(
    observation.safetensorsStructure.tensorNameSetDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.metadataDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256,
  )
  assert.equal(observation.safetensorsStructure.tensorCount, 2515)
  assert.deepEqual(
    observation.safetensorsStructure.dtypeCounts,
    [{ dtype: 'F16', count: 2515 }],
  )
  assert.deepEqual(
    observation.safetensorsStructure.rankCounts,
    [
      { rank: 0, count: 1 },
      { rank: 1, count: 1442 },
      { rank: 2, count: 949 },
      { rank: 4, count: 123 },
    ],
  )
  assert.equal(
    observation.compatibilityClues
      .selectedTensorShapeDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256,
  )
  assert.equal(
    observation.embeddedModelSpecClues.architecture,
    'stable-diffusion-xl-v1-base',
  )
  assert.equal(
    observation.compatibilityClues
      .embeddedMetadataNamesExactBaseFamily,
    true,
  )
  assert.equal(
    observation.compatibilityClues
      .priorLoraMetadataMatchesBaseVersion10,
    false,
  )
  assert.equal(
    observation.bundleProgress
      .independentlyVerifiedArtifactByteCount,
    5,
  )
  assert.deepEqual(
    observation.bundleProgress.remainingUnverifiedArtifactCodes,
    [],
  )
  assert.equal(
    observation.bundleProgress.completeBundleBytesVerified,
    true,
  )
  assert.equal(
    observation.bundleProgress
      .completeBundleSafetensorsSchemasInspected,
    true,
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
    basePath,
    clipVisionPath,
    ipAdapterPath,
    controlNetPath,
    loraPath,
    '/tmp/',
    '/Users/',
    '://',
    '.safetensors',
    'data:image',
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
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        byteReader: null,
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        byteReader: { ...reader },
      } as never),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation(input),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        observationId: '../unsafe',
        byteReader: freshReader(basePath),
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlBaseByteReader({
            openServerOwnedByteStream: async () => {
              throw new Error('unavailable')
            },
          }),
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlBaseByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(basePath, {
                start: 0,
                end: 1_023,
              }),
          }),
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        priorClipVisionObservation: {
          ...priorClipVisionObservation,
          observationDigestSha256: 'a'.repeat(64),
        },
        byteReader: freshReader(basePath),
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        candidateSet: {
          ...fixture.candidateSet,
          candidateSetDigestSha256: 'b'.repeat(64),
        },
        byteReader: freshReader(basePath),
      }),
    /controlled SDXL base byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlBaseByteObservation({
        ...input,
        approved: true,
        runtimeReady: true,
        byteReader: freshReader(basePath),
      } as never),
    /controlled SDXL base byte observation failed/,
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
    {
      ...observation,
      compatibilityClues: {
        ...observation.compatibilityClues,
        priorLoraMetadataMatchesBaseVersion10: true,
      },
    },
  ] as const) {
    assert.equal(
      await verifyLivingFrameControlledSdxlBaseByteObservation(
        forged,
        verifyInput,
      ),
      false,
    )
  }

  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-base-byte-observation',
    controlledFixtures: 1,
    adversarialAssertions: 15,
    exactArtifactExecuted: true,
    observedByteLength:
      observation.byteVerification.observedByteLength,
    tensorCount: observation.safetensorsStructure.tensorCount,
    embeddedArchitecture:
      observation.embeddedModelSpecClues.architecture,
    independentlyVerifiedArtifactByteCount:
      observation.bundleProgress
        .independentlyVerifiedArtifactByteCount,
    completeBundleBytesVerified: true,
    exactBundleCompatibilityProven: false,
    productionReady: false,
  }))
}

function freshReader(
  path: string,
): ReturnType<
  typeof createLivingFrameControlledSdxlBaseByteReader
> {
  return createLivingFrameControlledSdxlBaseByteReader({
    openServerOwnedByteStream: async () => createReadStream(path),
  })
}

function assertAuthorityBoundary(
  authority:
    LivingFrameControlledSdxlBaseByteObservationAuthority,
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
