import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'

import type {
  LivingFrameControlledSdxlClipVisionByteObservationAuthority,
} from '../../src/types/living-frame-controlled-sdxl-clip-vision-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_SELECTED_SHAPE_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-clip-vision-byte-observation'
import {
  createLivingFrameControlledSdxlClipVisionByteObservation,
  createLivingFrameControlledSdxlClipVisionByteReader,
  verifyLivingFrameControlledSdxlClipVisionByteObservation,
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

const suppliedClipVisionPath =
  process.env.REEDITPRO_SDXL_CLIP_VISION_MODEL_PATH
const suppliedIpAdapterPath =
  process.env.REEDITPRO_SDXL_IPADAPTER_MODEL_PATH
const suppliedControlNetPath =
  process.env.REEDITPRO_SDXL_CONTROLNET_MODEL_PATH
const suppliedLoraPath =
  process.env.REEDITPRO_SDXL_LORA_MODEL_PATH

if (
  !suppliedClipVisionPath
  || !suppliedIpAdapterPath
  || !suppliedControlNetPath
  || !suppliedLoraPath
) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-clip-vision-byte-observation',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_paths_not_injected',
    requiredEnvironmentVariables: [
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
    await realpath(suppliedClipVisionPath),
    await realpath(suppliedIpAdapterPath),
    await realpath(suppliedControlNetPath),
    await realpath(suppliedLoraPath),
  )
}

async function runExactArtifactSmoke(
  clipVisionPath: string,
  ipAdapterPath: string,
  controlNetPath: string,
  loraPath: string,
): Promise<void> {
  const stat = await lstat(clipVisionPath)
  assert.equal(stat.isFile(), true)
  assert.equal(
    stat.size,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
  )
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const priorLoraObservation =
    await createLivingFrameControlledSdxlLoraByteObservation({
      observationId:
        'sdxl-lora-byte-observation.clip-parent.001',
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
        'sdxl-controlnet-byte-observation.clip-parent.001',
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
        'sdxl-ipadapter-byte-observation.clip-parent.001',
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
  const reader =
    createLivingFrameControlledSdxlClipVisionByteReader({
      openServerOwnedByteStream: async () =>
        createReadStream(clipVisionPath),
    })
  const input = {
    observationId:
      'sdxl-clip-vision-byte-observation.controlled.001',
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    priorIpAdapterObservation,
    byteReader: reader,
  }
  const observation =
    await createLivingFrameControlledSdxlClipVisionByteObservation(
      input,
    )
  const verifyInput = {
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    priorIpAdapterObservation,
  }
  assert.equal(
    await verifyLivingFrameControlledSdxlClipVisionByteObservation(
      observation,
      verifyInput,
    ),
    true,
  )
  assert.equal(
    observation.byteVerification.observedByteLength,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_BYTE_LENGTH,
  )
  assert.equal(
    observation.byteVerification.observedContentSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_CONTENT_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.headerLength,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_HEADER_LENGTH,
  )
  assert.equal(
    observation.safetensorsStructure.tensorNameSetDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_TENSOR_NAME_SET_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.metadataDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_METADATA_SHA256,
  )
  assert.equal(observation.safetensorsStructure.tensorCount, 777)
  assert.deepEqual(
    observation.safetensorsStructure.dtypeCounts,
    [
      { dtype: 'F16', count: 776 },
      { dtype: 'I64', count: 1 },
    ],
  )
  assert.deepEqual(
    observation.safetensorsStructure.rankCounts,
    [
      { rank: 1, count: 485 },
      { rank: 2, count: 291 },
      { rank: 4, count: 1 },
    ],
  )
  assert.equal(
    observation.compatibilityClues
      .selectedTensorShapeDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_CLIP_VISION_SELECTED_SHAPE_SHA256,
  )
  assert.equal(
    observation.compatibilityClues.visualProjectionOutputWidth,
    1280,
  )
  assert.equal(
    observation.compatibilityClues
      .genericIpAdapterImageProjectionInputWidth,
    1280,
  )
  assert.equal(
    observation.compatibilityClues
      .projectionWidthMatchesGenericIpAdapterInputWidth,
    true,
  )
  assert.equal(
    observation.compatibilityClues
      .embeddedMetadataNamesExactClipVariant,
    false,
  )
  assert.equal(
    observation.bundleProgress
      .independentlyVerifiedArtifactByteCount,
    4,
  )
  assert.deepEqual(
    observation.bundleProgress.remainingUnverifiedArtifactCodes,
    ['sdxl_base_1_0_monolithic_safetensors'],
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
    clipVisionPath,
    ipAdapterPath,
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
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        byteReader: null,
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        byteReader: { ...reader },
      } as never),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation(
        input,
      ),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        observationId: '../unsafe',
        byteReader: freshReader(clipVisionPath),
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlClipVisionByteReader({
            openServerOwnedByteStream: async () => {
              throw new Error('unavailable')
            },
          }),
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlClipVisionByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(clipVisionPath, {
                start: 0,
                end: 1_023,
              }),
          }),
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        priorIpAdapterObservation: {
          ...priorIpAdapterObservation,
          observationDigestSha256: 'a'.repeat(64),
        },
        byteReader: freshReader(clipVisionPath),
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        candidateSet: {
          ...fixture.candidateSet,
          candidateSetDigestSha256: 'b'.repeat(64),
        },
        byteReader: freshReader(clipVisionPath),
      }),
    /controlled SDXL CLIP Vision byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlClipVisionByteObservation({
        ...input,
        approved: true,
        runtimeReady: true,
        byteReader: freshReader(clipVisionPath),
      } as never),
    /controlled SDXL CLIP Vision byte observation failed/,
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
    {
      ...observation,
      compatibilityClues: {
        ...observation.compatibilityClues,
        embeddedMetadataNamesExactClipVariant: true,
      },
    },
  ] as const) {
    assert.equal(
      await verifyLivingFrameControlledSdxlClipVisionByteObservation(
        forged,
        verifyInput,
      ),
      false,
    )
  }

  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-clip-vision-byte-observation',
    controlledFixtures: 1,
    adversarialAssertions: 15,
    exactArtifactExecuted: true,
    observedByteLength:
      observation.byteVerification.observedByteLength,
    tensorCount: observation.safetensorsStructure.tensorCount,
    projectionWidthMatchesGenericIpAdapterInputWidth: true,
    independentlyVerifiedArtifactByteCount:
      observation.bundleProgress
        .independentlyVerifiedArtifactByteCount,
    completeBundleBytesVerified: false,
    exactBundleCompatibilityProven: false,
    productionReady: false,
  }))
}

function freshReader(
  path: string,
): ReturnType<
  typeof createLivingFrameControlledSdxlClipVisionByteReader
> {
  return createLivingFrameControlledSdxlClipVisionByteReader({
    openServerOwnedByteStream: async () => createReadStream(path),
  })
}

function assertAuthorityBoundary(
  authority:
    LivingFrameControlledSdxlClipVisionByteObservationAuthority,
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
