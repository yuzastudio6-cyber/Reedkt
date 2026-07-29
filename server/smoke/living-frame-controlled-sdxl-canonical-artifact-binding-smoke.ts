import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  LivingFrameControlledSdxlCanonicalArtifactBinding,
  LivingFrameControlledSdxlCanonicalArtifactBindingAuthority,
} from '../../src/types/living-frame-controlled-sdxl-canonical-artifact-binding'
import type {
  LivingFrameControlledSdxlArtifactCandidate,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import {
  bindLivingFrameComfyUiCanonicalModelArtifacts,
  createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver,
} from '../living-frame/living-frame-comfyui-canonical-model-artifact-binding'
import {
  createLivingFrameControlledSdxlBaseByteObservation,
  createLivingFrameControlledSdxlBaseByteReader,
} from '../living-frame/living-frame-controlled-sdxl-base-byte-observation'
import {
  bindLivingFrameControlledSdxlCanonicalArtifacts,
  verifyLivingFrameControlledSdxlCanonicalArtifactBinding,
} from '../living-frame/living-frame-controlled-sdxl-canonical-artifact-binding'
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
  createCanonicalModelArtifactRepository,
  createCanonicalModelArtifactRepositoryRootAuthority,
  createCanonicalModelArtifactSourceReader,
  ingestCanonicalModelArtifact,
} from '../model-artifacts/canonical-model-artifact-repository'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  type CanonicalModelArtifactDescriptor,
  type CanonicalModelArtifactLocator,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const suppliedPaths = {
  base_checkpoint:
    process.env.REEDITPRO_SDXL_BASE_MODEL_PATH,
  controlnet_checkpoint:
    process.env.REEDITPRO_SDXL_CONTROLNET_MODEL_PATH,
  lora_adapter:
    process.env.REEDITPRO_SDXL_LORA_MODEL_PATH,
  generic_ipadapter_checkpoint:
    process.env.REEDITPRO_SDXL_IPADAPTER_MODEL_PATH,
  clip_vision_checkpoint:
    process.env.REEDITPRO_SDXL_CLIP_VISION_MODEL_PATH,
} as const

if (Object.values(suppliedPaths).some((value) => !value)) {
  console.log(JSON.stringify({
    suite:
      'living-frame-controlled-sdxl-canonical-artifact-binding',
    controlledFixtures: 0,
    adversarialAssertions: 0,
    disposition:
      'skipped_exact_server_owned_artifact_paths_not_injected',
    exactCanonicalRepositoryIngestExecuted: false,
    modelInferenceExecuted: false,
    productionReady: false,
  }))
} else {
  await runExactCanonicalBindingSmoke(
    Object.fromEntries(
      await Promise.all(
        Object.entries(suppliedPaths).map(
          async ([role, path]) => [
            role,
            await realpath(path!),
          ],
        ),
      ),
    ) as Record<keyof typeof suppliedPaths, string>,
  )
}

async function runExactCanonicalBindingSmoke(
  paths: Record<keyof typeof suppliedPaths, string>,
): Promise<void> {
  const fixture =
    controlledSdxlArtifactCandidateSetSmokeFixture
  const priorLoraObservation =
    await createLivingFrameControlledSdxlLoraByteObservation({
      observationId:
        'sdxl-lora-byte-observation.canonical-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      byteReader:
        createLivingFrameControlledSdxlLoraByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(paths.lora_adapter),
        }),
    })
  const priorControlNetObservation =
    await createLivingFrameControlledSdxlControlNetByteObservation({
      observationId:
        'sdxl-controlnet-byte-observation.canonical-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      byteReader:
        createLivingFrameControlledSdxlControlNetByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(paths.controlnet_checkpoint),
        }),
    })
  const priorIpAdapterObservation =
    await createLivingFrameControlledSdxlIpAdapterByteObservation({
      observationId:
        'sdxl-ipadapter-byte-observation.canonical-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      priorControlNetObservation,
      byteReader:
        createLivingFrameControlledSdxlIpAdapterByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(
              paths.generic_ipadapter_checkpoint,
            ),
        }),
    })
  const priorClipVisionObservation =
    await createLivingFrameControlledSdxlClipVisionByteObservation({
      observationId:
        'sdxl-clip-vision-byte-observation.canonical-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      priorControlNetObservation,
      priorIpAdapterObservation,
      byteReader:
        createLivingFrameControlledSdxlClipVisionByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(paths.clip_vision_checkpoint),
        }),
    })
  const completedBaseObservation =
    await createLivingFrameControlledSdxlBaseByteObservation({
      observationId:
        'sdxl-base-byte-observation.canonical-parent.001',
      candidateSet: fixture.candidateSet,
      candidateSetInput: fixture.input,
      priorLoraObservation,
      priorControlNetObservation,
      priorIpAdapterObservation,
      priorClipVisionObservation,
      byteReader:
        createLivingFrameControlledSdxlBaseByteReader({
          openServerOwnedByteStream: async () =>
            createReadStream(paths.base_checkpoint),
        }),
    })
  const completedBaseObservationVerificationInput = {
    candidateSet: fixture.candidateSet,
    candidateSetInput: fixture.input,
    priorLoraObservation,
    priorControlNetObservation,
    priorIpAdapterObservation,
    priorClipVisionObservation,
  }

  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'reeditpro-lf-exact-sdxl-repository-'),
  )
  let nowMs = Date.parse('2026-07-28T16:00:00.000Z')
  try {
    const rootAuthority =
      await createCanonicalModelArtifactRepositoryRootAuthority({
        rootPath: temporaryRoot,
      })
    const repository = createCanonicalModelArtifactRepository({
      rootAuthority,
      now: () => new Date(nowMs++),
    })
    const locatorsByRole =
      new Map<string, CanonicalModelArtifactLocator>()
    const observationDigestByRole = new Map<string, string>([
      [
        'base_checkpoint',
        completedBaseObservation.observationDigestSha256,
      ],
      [
        'controlnet_checkpoint',
        priorControlNetObservation.observationDigestSha256,
      ],
      [
        'lora_adapter',
        priorLoraObservation.observationDigestSha256,
      ],
      [
        'generic_ipadapter_checkpoint',
        priorIpAdapterObservation.observationDigestSha256,
      ],
      [
        'clip_vision_checkpoint',
        priorClipVisionObservation.observationDigestSha256,
      ],
    ])

    for (const candidate of fixture.candidateSet.artifacts) {
      const path = paths[candidate.role]
      const sourceObservationDigestSha256 =
        observationDigestByRole.get(candidate.role)
      assert.ok(sourceObservationDigestSha256)
      const receipt = await ingestCanonicalModelArtifact({
        repository,
        sourceReader: createCanonicalModelArtifactSourceReader({
          descriptor: descriptorFor({
            candidate,
            sourceObservationDigestSha256,
          }),
          openServerOwnedByteStream: async () =>
            createReadStream(path),
        }),
      })
      locatorsByRole.set(candidate.role, receipt.locator)
    }

    const resolver =
      createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver({
        consumerScope: 'comfyui.private-inference',
        resolveServerOwnedLocator: async (requirement) => {
          const locator = locatorsByRole.get(requirement.role)
          if (!locator) {
            throw new Error('server locator unavailable')
          }
          return locator
        },
      })
    const canonicalArtifactBindingInput = {
      bindingId:
        'binding.comfyui.exact-sdxl-canonical-models.001',
      requirements: fixture.input.requirements,
      requirementsInput: fixture.input.requirementsInput,
      repository,
      locatorResolver: resolver,
    }
    const canonicalArtifactBinding =
      await bindLivingFrameComfyUiCanonicalModelArtifacts(
        canonicalArtifactBindingInput,
      )
    const input = {
      bindingId:
        'binding.sdxl.exact-candidate-to-canonical.001',
      completedBaseObservation,
      completedBaseObservationVerificationInput,
      canonicalArtifactBinding,
      canonicalArtifactBindingInput,
    }
    const binding =
      await bindLivingFrameControlledSdxlCanonicalArtifacts(
        input,
      )
    assert.equal(
      await verifyLivingFrameControlledSdxlCanonicalArtifactBinding(
        binding,
        input,
      ),
      true,
    )
    assert.equal(binding.entries.length, 5)
    assert.equal(
      binding.metrics.totalByteLength,
      11_700_367_157,
    )
    assert.deepEqual(
      binding.entries.map((entry) => entry.artifactCode),
      fixture.candidateSet.artifacts.map(
        (candidate) => candidate.artifactCode,
      ),
    )
    assert.deepEqual(
      binding.entries.map((entry) => entry.contentSha256),
      fixture.candidateSet.artifacts.map(
        (candidate) => candidate.reportedContentSha256,
      ),
    )
    assert.equal(
      binding.entries.every((entry) =>
        entry.fullCandidateIdentityMatched
        && entry.fullRepositoryChecksumVerified
        && entry.gpuExecutionPolicyVerified
        && !entry.compatibilityBenchmarkPassed),
      true,
    )
    assert.equal(
      binding.completeFiveArtifactCandidateSetRepositoryBound,
      true,
    )
    assert.equal(binding.exactBundleCompatibilityProven, false)
    assert.equal(
      binding.loraBaseVersionMismatchUnresolved,
      true,
    )
    assert.equal(binding.modelLoadedOrExecuted, false)
    assert.equal(binding.productionReady, false)
    assertAuthorityBoundary(binding.authorityBoundary)
    assertSerializedBoundary(binding, Object.values(paths))

    for (const forged of [
      {
        ...binding,
        productionReady: true,
      },
      {
        ...binding,
        bindingDigestSha256: 'a'.repeat(64),
      },
      {
        ...binding,
        exactBundleCompatibilityProven: true,
      },
      {
        ...binding,
        artifactsMounted: true,
        modelLoadedOrExecuted: true,
      },
      {
        ...binding,
        entries: binding.entries.map((entry, index) =>
          index === 0
            ? { ...entry, contentSha256: 'b'.repeat(64) }
            : entry),
      },
      {
        ...binding,
        modelPath: '/tmp/forged.safetensors',
      },
      {
        ...binding,
        authorityBoundary: {
          ...binding.authorityBoundary,
          operationAuthority: true,
          runtimeAuthority: true,
          productionAuthority: true,
        },
      },
    ] as const) {
      assert.equal(
        await verifyLivingFrameControlledSdxlCanonicalArtifactBinding(
          forged,
          input,
        ),
        false,
      )
    }

    await assert.rejects(
      () => bindLivingFrameControlledSdxlCanonicalArtifacts({
        ...input,
        bindingId: '../unsafe',
      }),
      /canonical artifact binding failed/,
    )
    await assert.rejects(
      () => bindLivingFrameControlledSdxlCanonicalArtifacts({
        ...input,
        approved: true,
      } as never),
      /canonical artifact binding failed/,
    )
    await assert.rejects(
      () => bindLivingFrameControlledSdxlCanonicalArtifacts({
        ...input,
        completedBaseObservation: {
          ...completedBaseObservation,
          observationDigestSha256: 'c'.repeat(64),
        },
      }),
      /canonical artifact binding failed/,
    )

    console.log(JSON.stringify({
      suite:
        'living-frame-controlled-sdxl-canonical-artifact-binding',
      controlledFixtures: 1,
      adversarialAssertions: 10,
      exactCanonicalRepositoryIngestExecuted: true,
      exactArtifactCount: binding.entries.length,
      totalByteLength: binding.metrics.totalByteLength,
      exactCandidateIdentityMatchCount:
        binding.metrics.exactCandidateIdentityMatchCount,
      exactBundleCompatibilityProven: false,
      modelInferenceExecuted: false,
      productionReady: false,
    }))
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
}

function descriptorFor(input: {
  readonly candidate: LivingFrameControlledSdxlArtifactCandidate
  readonly sourceObservationDigestSha256: string
}): CanonicalModelArtifactDescriptor {
  const { candidate } = input
  return {
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: candidate.artifactCode,
    revision: candidate.repositoryRevisionSha1,
    artifactFormat: 'safetensors',
    artifactRole: candidate.role,
    modelFamily: candidate.expectedModelFamily,
    byteLength: candidate.reportedByteLength,
    contentSha256: candidate.reportedContentSha256,
    consumerScopes: ['comfyui.private-inference'],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      input.sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      sha(`review:${candidate.artifactCode}`),
    securityReviewDigestSha256:
      sha(`security:${candidate.artifactCode}`),
    licensePolicy: {
      modelArtifactLicense: candidate.declaredLicenseLabel,
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        sha(`license:${candidate.artifactCode}`),
      modelCardDocumentSha256:
        sha(`model-card:${candidate.artifactCode}`),
    },
    executionPolicy: {
      executionClass: 'gpu_required',
      requiredExecutionTarget: 'google_cloud_run_gpu',
      accelerator: 'cuda',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
  }
}

function assertAuthorityBoundary(
  authority:
    LivingFrameControlledSdxlCanonicalArtifactBindingAuthority,
): void {
  const expectedTrue = new Set([
    'completedByteObservationChainConsumed',
    'canonicalRepositoryVerificationConsumed',
    'serverOwnedLocatorBindingConsumed',
    'exactCandidateIdentityComparisonAuthority',
  ])
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      expectedTrue.has(key),
      `Unexpected authority value for ${key}.`,
    )
  }
}

function assertSerializedBoundary(
  binding:
    LivingFrameControlledSdxlCanonicalArtifactBinding,
  paths: readonly string[],
): void {
  const serialized = JSON.stringify(binding)
  for (const forbidden of [
    ...paths,
    '/tmp/',
    '/Users/',
    '://',
    '.safetensors',
    'credential',
    'authorization',
    'Musashi',
    'Hormuz',
    'helicopter',
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `Serialized binding must not include ${forbidden}.`,
    )
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
