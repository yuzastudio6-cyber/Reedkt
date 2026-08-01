import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlIpAdapterByteObservationAuthority,
} from '../../src/types/living-frame-controlled-sdxl-ipadapter-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-ipadapter-byte-observation'
import {
  createLivingFrameControlledSdxlControlNetByteObservation,
  createLivingFrameControlledSdxlControlNetByteReader,
} from '../living-frame/living-frame-controlled-sdxl-controlnet-byte-observation'
import {
  createLivingFrameControlledSdxlIpAdapterByteObservation,
  createLivingFrameControlledSdxlIpAdapterByteReader,
  verifyLivingFrameControlledSdxlIpAdapterByteObservation,
} from '../living-frame/living-frame-controlled-sdxl-ipadapter-byte-observation'
import {
  createLivingFrameControlledSdxlLoraByteObservation,
  createLivingFrameControlledSdxlLoraByteReader,
} from '../living-frame/living-frame-controlled-sdxl-lora-byte-observation'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const suppliedIpAdapterPath =
  process.env.REEDITPRO_SDXL_IPADAPTER_MODEL_PATH
const suppliedControlNetPath =
  process.env.REEDITPRO_SDXL_CONTROLNET_MODEL_PATH
const suppliedLoraPath =
  process.env.REEDITPRO_SDXL_LORA_MODEL_PATH

if (
  !suppliedIpAdapterPath
  || !suppliedControlNetPath
  || !suppliedLoraPath
) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-ipadapter-byte-observation',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_paths_not_injected',
    requiredEnvironmentVariables: [
      'REEDITPRO_SDXL_IPADAPTER_MODEL_PATH',
      'REEDITPRO_SDXL_CONTROLNET_MODEL_PATH',
      'REEDITPRO_SDXL_LORA_MODEL_PATH',
    ],
    exactArtifactExecuted: false,
    productionReady: false,
  }))
} else {
  await runExactArtifactSmoke(
    await realpath(suppliedIpAdapterPath),
    await realpath(suppliedControlNetPath),
    await realpath(suppliedLoraPath),
  )
}

async function runExactArtifactSmoke(
  ipAdapterPath: string,
  controlNetPath: string,
  loraPath: string,
): Promise<void> {
  const stat = await lstat(ipAdapterPath)
  assert.equal(stat.isFile(), true)
  assert.equal(
    stat.size,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
  )
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const priorLoraObservation =
    await createLivingFrameControlledSdxlLoraByteObservation({
      observationId:
        'sdxl-lora-byte-observation.ipadapter-parent.001',
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
        'sdxl-controlnet-byte-observation.ipadapter-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      byteReader:
        createLivingFrameControlledSdxlControlNetByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(controlNetPath),
        }),
    })
  const reader =
    createLivingFrameControlledSdxlIpAdapterByteReader({
      openServerOwnedByteStream: async () =>
        createReadStream(ipAdapterPath),
    })
  const input = {
    observationId:
      'sdxl-ipadapter-byte-observation.controlled.001',
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    byteReader: reader,
  }
  const observation =
    await createLivingFrameControlledSdxlIpAdapterByteObservation(
      input,
    )
  assert.equal(
    await verifyLivingFrameControlledSdxlIpAdapterByteObservation(
      observation,
      {
        candidateSet: fixture.candidateSet,
        candidateSetInput: fixture.input,
        priorLoraObservation,
        priorControlNetObservation,
      },
    ),
    true,
  )
  assert.equal(
    observation.byteVerification.observedByteLength,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH,
  )
  assert.equal(
    observation.byteVerification.observedContentSha256,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.headerLength,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH,
  )
  assert.equal(
    observation.safetensorsStructure.tensorNameSetDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.metadataDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256,
  )
  assert.equal(observation.safetensorsStructure.tensorCount, 144)
  assert.deepEqual(
    observation.safetensorsStructure.dtypeCounts,
    [{ dtype: 'F16', count: 144 }],
  )
  assert.deepEqual(
    observation.safetensorsStructure.rankCounts,
    [
      { rank: 1, count: 3 },
      { rank: 2, count: 141 },
    ],
  )
  assert.equal(
    observation.compatibilityClues
      .genericIpAdapterNamespaceStructureObserved,
    true,
  )
  assert.equal(
    observation.compatibilityClues
      .faceIdOrInsightFaceNamespaceObserved,
    false,
  )
  assert.equal(
    observation.compatibilityClues
      .embeddedMetadataNamesExactModelFamily,
    false,
  )
  assert.equal(
    observation.bundleProgress
      .independentlyVerifiedArtifactByteCount,
    3,
  )
  assert.deepEqual(
    observation.bundleProgress.remainingUnverifiedArtifactCodes,
    [
      'sdxl_base_1_0_monolithic_safetensors',
      'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
    ],
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
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        byteReader: null,
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        byteReader: { ...reader },
      } as never),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation(input),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        observationId: '../unsafe',
        byteReader: freshReader(ipAdapterPath),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlIpAdapterByteReader({
            openServerOwnedByteStream: async () => {
              throw new Error('unavailable')
            },
          }),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlIpAdapterByteReader({
            openServerOwnedByteStream: async () =>
              createReadStream(ipAdapterPath, {
                start: 0,
                end: 1_023,
              }),
          }),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        byteReader:
          createLivingFrameControlledSdxlIpAdapterByteReader({
            openServerOwnedByteStream: async () =>
              createSameLengthWrongContentStream(),
          }),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        priorControlNetObservation: {
          ...priorControlNetObservation,
          observationDigestSha256: 'a'.repeat(64),
        },
        byteReader: freshReader(ipAdapterPath),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        candidateSet: {
          ...fixture.candidateSet,
          candidateSetDigestSha256: 'b'.repeat(64),
        },
        byteReader: freshReader(ipAdapterPath),
      }),
    /controlled SDXL IP-Adapter byte observation failed/,
  )
  await assert.rejects(
    () =>
      createLivingFrameControlledSdxlIpAdapterByteObservation({
        ...input,
        approved: true,
        runtimeReady: true,
        byteReader: freshReader(ipAdapterPath),
      } as never),
    /controlled SDXL IP-Adapter byte observation failed/,
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
      await verifyLivingFrameControlledSdxlIpAdapterByteObservation(
        forged,
        {
          candidateSet: fixture.candidateSet,
          candidateSetInput: fixture.input,
          priorLoraObservation,
          priorControlNetObservation,
        },
      ),
      false,
    )
  }

  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-ipadapter-byte-observation',
    controlledFixtures: 1,
    adversarialAssertions: 15,
    exactArtifactExecuted: true,
    observedByteLength:
      observation.byteVerification.observedByteLength,
    tensorCount: observation.safetensorsStructure.tensorCount,
    genericIpAdapterNamespaceStructureObserved: true,
    faceIdOrInsightFaceNamespaceObserved: false,
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
  typeof createLivingFrameControlledSdxlIpAdapterByteReader
> {
  return createLivingFrameControlledSdxlIpAdapterByteReader({
    openServerOwnedByteStream: async () => createReadStream(path),
  })
}

function createSameLengthWrongContentStream(): Readable {
  async function* chunks(): AsyncGenerator<Buffer> {
    const chunk = Buffer.alloc(1024 * 1024)
    let remaining =
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH
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
    LivingFrameControlledSdxlIpAdapterByteObservationAuthority,
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
