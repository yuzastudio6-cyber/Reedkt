import assert from 'node:assert/strict'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import { Readable } from 'node:stream'

import type {
  LivingFrameControlledSdxlLoraByteObservationAuthority,
} from '../../src/types/living-frame-controlled-sdxl-lora-byte-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256,
  LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256,
} from '../../src/types/living-frame-controlled-sdxl-lora-byte-observation'
import {
  createLivingFrameControlledSdxlLoraByteObservation,
  createLivingFrameControlledSdxlLoraByteReader,
  verifyLivingFrameControlledSdxlLoraByteObservation,
} from '../living-frame/living-frame-controlled-sdxl-lora-byte-observation'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const suppliedArtifactPath =
  process.env.REEDITPRO_SDXL_LORA_MODEL_PATH

if (!suppliedArtifactPath) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-lora-byte-observation',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_path_not_injected',
    requiredEnvironmentVariable:
      'REEDITPRO_SDXL_LORA_MODEL_PATH',
    exactArtifactExecuted: false,
    productionReady: false,
  }))
} else {
  await runExactArtifactSmoke(
    await realpath(suppliedArtifactPath),
  )
}

async function runExactArtifactSmoke(
  artifactPath: string,
): Promise<void> {
  const artifactStat = await lstat(artifactPath)
  assert.equal(artifactStat.isFile(), true)
  assert.equal(
    artifactStat.size,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
  )
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const reader =
    createLivingFrameControlledSdxlLoraByteReader({
      openServerOwnedByteStream: async () =>
        createReadStream(artifactPath),
    })
  const input = {
    observationId:
      'sdxl-lora-byte-observation.controlled.001',
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    byteReader: reader,
  }
  const observation =
    await createLivingFrameControlledSdxlLoraByteObservation(
      input,
    )
  assert.equal(
    await verifyLivingFrameControlledSdxlLoraByteObservation(
      observation,
      {
        candidateSet: fixture.candidateSet,
        candidateSetInput: fixture.input,
      },
    ),
    true,
  )
  assert.equal(
    observation.byteVerification.observedByteLength,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH,
  )
  assert.equal(
    observation.byteVerification.observedContentSha256,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.headerLength,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH,
  )
  assert.equal(
    observation.safetensorsStructure
      .tensorNameSetDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.metadataDigestSha256,
    LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256,
  )
  assert.equal(
    observation.safetensorsStructure.tensorCount,
    2_364,
  )
  assert.deepEqual(
    observation.safetensorsStructure.dtypeCounts,
    [{ dtype: 'F16', count: 2_364 }],
  )
  assert.equal(
    observation.safetensorsStructure
      .tensorPayloadExactlyAccountsForDataSection,
    true,
  )
  assert.equal(
    observation.safetensorsStructure
      .declaredBaseModelVersion,
    'sdxl_base_v0-9',
  )
  assert.equal(
    observation.safetensorsStructure
      .metadataNamesEarlierSdxlBaseVersion,
    true,
  )
  assert.equal(
    observation.openGateCodes.includes(
      'lora_metadata_base_version_compatibility_review_required',
    ),
    true,
  )
  assert.equal(
    observation.bundleProgress
      .independentlyVerifiedArtifactByteCount,
    1,
  )
  assert.equal(
    observation.bundleProgress
      .remainingUnverifiedArtifactCodes.length,
    4,
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
    artifactPath,
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
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      byteReader: null,
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      byteReader: { ...reader },
    } as never),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation(
      input,
    ),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      observationId: '../unsafe',
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(artifactPath),
        }),
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () => {
            throw new Error('unavailable')
          },
        }),
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(artifactPath, {
              start: 0,
              end: 1_023,
            }),
        }),
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createSameLengthWrongContentStream(),
        }),
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      candidateSet: {
        ...fixture.candidateSet,
        candidateSetDigestSha256: 'a'.repeat(64),
      },
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(artifactPath),
        }),
    }),
    /controlled SDXL LoRA byte observation failed/,
  )
  await assert.rejects(
    () => createLivingFrameControlledSdxlLoraByteObservation({
      ...input,
      approved: true,
      runtimeReady: true,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(artifactPath),
        }),
    } as never),
    /controlled SDXL LoRA byte observation failed/,
  )

  for (const forged of [
    {
      ...observation,
      observationDigestSha256: 'b'.repeat(64),
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
      await verifyLivingFrameControlledSdxlLoraByteObservation(
        forged,
        {
          candidateSet: fixture.candidateSet,
          candidateSetInput: fixture.input,
        },
      ),
      false,
    )
  }

  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-lora-byte-observation',
    controlledFixtures: 1,
    adversarialAssertions: 14,
    exactArtifactExecuted: true,
    observedByteLength:
      observation.byteVerification.observedByteLength,
    tensorCount:
      observation.safetensorsStructure.tensorCount,
    metadataBaseModelVersion:
      observation.safetensorsStructure
        .declaredBaseModelVersion,
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
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH
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
    LivingFrameControlledSdxlLoraByteObservationAuthority,
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
