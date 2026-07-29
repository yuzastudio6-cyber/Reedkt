import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import type {
  LivingFrameComfyUiModelArtifactRequirements,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import type {
  LivingFrameComfyUiCanonicalModelArtifactBinding,
} from '../living-frame/living-frame-comfyui-canonical-model-artifact-binding'
import {
  bindLivingFrameComfyUiCanonicalModelArtifacts,
  createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver,
  verifyLivingFrameComfyUiCanonicalModelArtifactBinding,
} from '../living-frame/living-frame-comfyui-canonical-model-artifact-binding'
import {
  createLivingFrameComfyUiModelArtifactRequirements,
} from '../living-frame/living-frame-comfyui-model-artifact-requirements'
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
  modelArtifactRequirementSmokeFixture,
} from './living-frame-comfyui-model-artifact-requirements-smoke'

const fixture = modelArtifactRequirementSmokeFixture
const requirements =
  createLivingFrameComfyUiModelArtifactRequirements(fixture.input)
const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-comfyui-model-binding-'),
)
let nowMs = Date.parse('2026-07-27T18:00:00.000Z')

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

  for (const [index, requirement] of
    requirements.requirements.entries()) {
    const bytes = Buffer.alloc(1_024 + index, index + 1)
    const descriptor = descriptorFor({
      requirement,
      bytes,
      suffix: 'exact',
    })
    const receipt = await ingestCanonicalModelArtifact({
      repository,
      sourceReader: createCanonicalModelArtifactSourceReader({
        descriptor,
        openServerOwnedByteStream: async () => Readable.from([
          bytes.subarray(0, 37),
          bytes.subarray(37),
        ]),
      }),
    })
    locatorsByRole.set(requirement.role, receipt.locator)
  }

  const resolver =
    createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver({
      consumerScope: 'comfyui.private-inference',
      resolveServerOwnedLocator: async (requirement) => {
        const locator = locatorsByRole.get(requirement.role)
        if (!locator) throw new Error('server locator unavailable')
        return locator
      },
    })
  const input = {
    bindingId: 'binding.comfyui.canonical-models.001',
    requirements,
    requirementsInput: fixture.input,
    repository,
    locatorResolver: resolver,
  }
  const binding =
    await bindLivingFrameComfyUiCanonicalModelArtifacts(input)

  assert.equal(
    await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      binding,
      input,
    ),
    true,
  )
  assert.equal(binding.entries.length, 5)
  assert.deepEqual(
    binding.entries.map((entry) => entry.role),
    requirements.requirements.map((entry) => entry.role),
  )
  assert.deepEqual(
    binding.entries.map((entry) => entry.canonicalOrder),
    [0, 1, 2, 3, 4],
  )
  assert.equal(
    binding.entries.every((entry) =>
      entry.fullRepositoryChecksumVerified
      && entry.gpuExecutionPolicyVerified
      && entry.artifactFormat === 'safetensors'
      && entry.runtimeDownloadAllowed === false
      && entry.networkFetchAllowed === false
      && entry.cpuFallbackAllowed === false
      && entry.compatibilityBenchmarkPassed === false),
    true,
  )
  assert.deepEqual(
    binding.canonicalGpuBundleRequirements,
    binding.entries.map((entry) => entry.gpuBundleRequirement),
  )
  assert.equal(
    binding.metrics.verifiedArtifactCount,
    requirements.requirements.length,
  )
  assert.equal(binding.metrics.paidProductionUseApprovedCount, 0)
  assert.equal(
    binding.canonicalOperationArtifactSetVerified,
    false,
  )
  assert.equal(binding.artifactsMounted, false)
  assert.equal(binding.modelInferenceExecuted, false)
  assert.equal(binding.productionReady, false)
  assertAllAuthorityClosed(binding)

  await assert.rejects(
    () => bindLivingFrameComfyUiCanonicalModelArtifacts({
      ...input,
      locatorResolver: {
        ...resolver,
      },
    } as never),
    /canonical model-artifact binding failed/,
  )
  await assert.rejects(
    () => bindLivingFrameComfyUiCanonicalModelArtifacts({
      ...input,
      locatorResolver: null,
    }),
    /canonical model-artifact binding failed/,
  )
  await assert.rejects(
    () => bindLivingFrameComfyUiCanonicalModelArtifacts({
      ...input,
      repository: null,
    }),
    /canonical model-artifact binding failed/,
  )

  const wrongRole = requirements.requirements[0]!
  const wrongRoleBytes = Buffer.alloc(1_111, 0x31)
  const wrongRoleReceipt = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: descriptorFor({
        requirement: wrongRole,
        bytes: wrongRoleBytes,
        suffix: 'wrong-role',
        artifactRole: 'unrelated_model_role',
      }),
      openServerOwnedByteStream:
        async () => Readable.from([wrongRoleBytes]),
    }),
  })
  await expectFirstRoleReplacementRejected(
    input,
    wrongRoleReceipt.locator,
    /canonical model-artifact binding failed/,
  )

  const wrongFamilyBytes = Buffer.alloc(1_112, 0x32)
  const wrongFamilyReceipt = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: descriptorFor({
        requirement: wrongRole,
        bytes: wrongFamilyBytes,
        suffix: 'wrong-family',
        modelFamily: 'incompatible_model_family',
      }),
      openServerOwnedByteStream:
        async () => Readable.from([wrongFamilyBytes]),
    }),
  })
  await expectFirstRoleReplacementRejected(
    input,
    wrongFamilyReceipt.locator,
    /canonical model-artifact binding failed/,
  )

  const wrongFormatBytes = Buffer.alloc(1_113, 0x33)
  const wrongFormatReceipt = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: descriptorFor({
        requirement: wrongRole,
        bytes: wrongFormatBytes,
        suffix: 'wrong-format',
        artifactFormat: 'onnx',
      }),
      openServerOwnedByteStream:
        async () => Readable.from([wrongFormatBytes]),
    }),
  })
  await expectFirstRoleReplacementRejected(
    input,
    wrongFormatReceipt.locator,
    /canonical model-artifact binding failed/,
  )

  const wrongScopeBytes = Buffer.alloc(1_114, 0x34)
  const wrongScopeReceipt = await ingestCanonicalModelArtifact({
    repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: descriptorFor({
        requirement: wrongRole,
        bytes: wrongScopeBytes,
        suffix: 'wrong-scope',
        consumerScopes: ['another.private-inference'],
      }),
      openServerOwnedByteStream:
        async () => Readable.from([wrongScopeBytes]),
    }),
  })
  await expectFirstRoleReplacementRejected(
    input,
    wrongScopeReceipt.locator,
    /canonical model-artifact binding failed/,
  )

  assert.equal(
    await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      {
        ...binding,
        canonicalGpuBundleRequirements: [
          binding.canonicalGpuBundleRequirements[1],
          binding.canonicalGpuBundleRequirements[0],
          ...binding.canonicalGpuBundleRequirements.slice(2),
        ],
      },
      input,
    ),
    false,
  )
  assert.equal(
    await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      {
        ...binding,
        authorityBoundary: {
          ...binding.authorityBoundary,
          dispatchAuthority: true,
        },
      },
      input,
    ),
    false,
  )
  assert.equal(
    await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      {
        ...binding,
        productionReady: true,
      },
      input,
    ),
    false,
  )
  assert.equal(
    await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      {
        ...binding,
        modelPath: '/tmp/untrusted/model.safetensors',
      },
      input,
    ),
    false,
  )

  console.log(JSON.stringify({
    suite:
      'living-frame-comfyui-canonical-model-artifact-binding',
    verifiedArtifactCount:
      binding.metrics.verifiedArtifactCount,
    totalByteLength: binding.metrics.totalByteLength,
    canonicalGpuBundleRequirementCount:
      binding.canonicalGpuBundleRequirements.length,
    exactRepositoryChecksumVerified: true,
    adversarialAssertions: 11,
    canonicalOperationArtifactSetVerified: false,
    modelInferenceExecuted: false,
    productionReady: false,
  }))

  async function expectFirstRoleReplacementRejected(
    baseInput: typeof input,
    locator: CanonicalModelArtifactLocator,
    expected: RegExp,
  ): Promise<void> {
    const alteredResolver =
      createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver({
        consumerScope: 'comfyui.private-inference',
        resolveServerOwnedLocator: async (requirement) =>
          requirement.order === 1
            ? locator
            : locatorsByRole.get(requirement.role)!,
      })
    await assert.rejects(
      () => bindLivingFrameComfyUiCanonicalModelArtifacts({
        ...baseInput,
        locatorResolver: alteredResolver,
      }),
      expected,
    )
  }
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

function descriptorFor(input: {
  requirement:
    LivingFrameComfyUiModelArtifactRequirements[
      'requirements'
    ][number]
  bytes: Buffer
  suffix: string
  artifactRole?: string
  modelFamily?: string
  artifactFormat?: CanonicalModelArtifactDescriptor[
    'artifactFormat'
  ]
  consumerScopes?: readonly string[]
}): CanonicalModelArtifactDescriptor {
  const contentSha256 = sha(input.bytes)
  return {
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId:
      `lf-${input.requirement.role}-${input.suffix}`,
    revision: `controlled-${input.suffix}-v1`,
    artifactFormat: input.artifactFormat ?? 'safetensors',
    artifactRole:
      input.artifactRole ?? input.requirement.role,
    modelFamily:
      input.modelFamily
      ?? input.requirement.expectedFamily.family,
    byteLength: input.bytes.byteLength,
    contentSha256,
    consumerScopes:
      input.consumerScopes ?? ['comfyui.private-inference'],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      sha(`source:${input.suffix}`),
    reviewEvidenceDigestSha256:
      sha(`review:${input.suffix}`),
    securityReviewDigestSha256:
      sha(`security:${input.suffix}`),
    licensePolicy: {
      modelArtifactLicense: 'controlled-observation-only',
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        sha(`license:${input.suffix}`),
      modelCardDocumentSha256:
        sha(`model-card:${input.suffix}`),
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

function assertAllAuthorityClosed(
  binding:
    LivingFrameComfyUiCanonicalModelArtifactBinding,
): void {
  const allowedTrue = new Set([
    'canonicalRepositoryVerificationConsumed',
    'serverOwnedLocatorResolutionConsumed',
  ])
  for (
    const [key, value] of
    Object.entries(binding.authorityBoundary)
  ) {
    assert.equal(
      value,
      allowedTrue.has(key),
      `Unexpected authority value for ${key}.`,
    )
  }
}

function sha(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
