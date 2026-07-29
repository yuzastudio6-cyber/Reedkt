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
  CanonicalModelArtifactDescriptor,
  CanonicalModelArtifactLocator,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  createCanonicalModelArtifactReadOnlyMountConsumer,
} from '../model-artifacts/canonical-model-artifact-read-only-mount'
import {
  createCanonicalModelArtifactRepository,
  createCanonicalModelArtifactRepositoryRootAuthority,
  createCanonicalModelArtifactSourceReader,
  ingestCanonicalModelArtifact,
} from '../model-artifacts/canonical-model-artifact-repository'
import {
  bindLivingFrameComfyUiCanonicalModelArtifacts,
  createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver,
} from '../living-frame/living-frame-comfyui-canonical-model-artifact-binding'
import {
  prepareLivingFrameComfyUiReadOnlyModelMount,
  verifyLivingFrameComfyUiReadOnlyModelMount,
} from '../living-frame/living-frame-comfyui-read-only-model-mount'
import {
  modelArtifactRequirementSmokeFixture,
} from './living-frame-comfyui-model-artifact-requirements-smoke'

const { input: requirementsInput, requirements } =
  modelArtifactRequirementSmokeFixture
const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-lf-comfyui-model-mount-'),
)

try {
  const rootAuthority =
    await createCanonicalModelArtifactRepositoryRootAuthority({
      rootPath: temporaryRoot,
    })
  const repository = createCanonicalModelArtifactRepository({
    rootAuthority,
  })
  const locators =
    new Map<string, CanonicalModelArtifactLocator>()
  for (const [index, requirement] of requirements.requirements.entries()) {
    const bytes = Buffer.alloc(2_048 + index, index + 11)
    const descriptor = descriptorFor(requirement, bytes)
    const receipt = await ingestCanonicalModelArtifact({
      repository,
      sourceReader: createCanonicalModelArtifactSourceReader({
        descriptor,
        openServerOwnedByteStream:
          async () => Readable.from([bytes]),
      }),
    })
    locators.set(requirement.role, receipt.locator)
  }
  const locatorResolver =
    createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver({
      consumerScope: 'comfyui.private-inference',
      resolveServerOwnedLocator: async (requirement) => {
        const locator = locators.get(requirement.role)
        if (!locator) throw new Error('locator unavailable')
        return locator
      },
    })
  const artifactBindingInput = {
    bindingId: 'binding.comfyui.mount-smoke',
    requirements,
    requirementsInput,
    repository,
    locatorResolver,
  }
  const artifactBinding =
    await bindLivingFrameComfyUiCanonicalModelArtifacts(
      artifactBindingInput,
    )
  const presentedArtifactRecordIds: string[] = []
  const presentedMountAliases: string[] = []
  const consumer = createCanonicalModelArtifactReadOnlyMountConsumer({
    consumerScope: 'comfyui.private-inference',
    executionTarget: 'google_cloud_run_gpu',
    consumeReadOnlyModelArtifact: async (source) => {
      assert.equal(source.readOnly, true)
      assert.equal(source.accelerator, 'cuda')
      assert.equal(source.cpuFallbackAllowed, false)
      assert.equal(source.runtimeDownloadAllowed, false)
      assert.equal(source.networkFetchAllowed, false)
      assert.match(source.sourceAbsolutePath, /^\//u)
      assert.match(
        source.serverDerivedMountAlias,
        /^\/opt\/reeditpro\/model-artifacts\//u,
      )
      presentedArtifactRecordIds.push(source.artifactRecordId)
      presentedMountAliases.push(source.serverDerivedMountAlias)
    },
  })
  const input = {
    preparationId: 'preparation.comfyui.mount-smoke',
    artifactBinding,
    artifactBindingInput,
    repository,
    consumer,
  }
  const preparation =
    await prepareLivingFrameComfyUiReadOnlyModelMount(input)

  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount(preparation),
    true,
  )
  assert.equal(preparation.entries.length, 5)
  assert.equal(presentedArtifactRecordIds.length, 5)
  assert.equal(new Set(presentedArtifactRecordIds).size, 5)
  assert.equal(new Set(presentedMountAliases).size, 5)
  assert.deepEqual(
    preparation.entries.map((entry) => entry.role),
    requirements.requirements.map((entry) => entry.role),
  )
  assert.equal(
    preparation.entries.every((entry) =>
      entry.readOnlySourcePresented
      && entry.objectVerifiedBeforeConsumer
      && entry.objectVerifiedAfterConsumer
      && !entry.hostPathIncluded
      && !entry.mountAliasIncluded
      && !entry.modelInferenceExecuted),
    true,
  )
  assert.equal(
    JSON.stringify(preparation).includes(temporaryRoot),
    false,
  )
  assert.equal(preparation.distributedMountCreated, false)
  assert.equal(preparation.modelInferenceExecuted, false)
  assert.equal(preparation.actualAttemptCostReceiptCreated, false)
  assert.equal(preparation.productionReady, false)

  await assert.rejects(
    () => prepareLivingFrameComfyUiReadOnlyModelMount({
      ...input,
      consumer: { ...consumer },
    } as never),
    /read-only model mount failed/,
  )
  await assert.rejects(
    () => prepareLivingFrameComfyUiReadOnlyModelMount({
      ...input,
      preparationId: 'preparation.wrong-scope',
      consumer: createCanonicalModelArtifactReadOnlyMountConsumer({
        consumerScope: 'another.private-inference',
        executionTarget: 'google_cloud_run_gpu',
        consumeReadOnlyModelArtifact: async () => undefined,
      }),
    }),
    /read-only model mount failed/,
  )
  await assert.rejects(
    () => prepareLivingFrameComfyUiReadOnlyModelMount({
      ...input,
      repository: null,
    }),
    /read-only model mount failed/,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      entries: [
        preparation.entries[1],
        preparation.entries[0],
        ...preparation.entries.slice(2),
      ],
    }),
    false,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      authorityBoundary: {
        ...preparation.authorityBoundary,
        runtimeAuthority: true,
      },
    }),
    false,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      distributedMountCreated: true,
    }),
    false,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      modelInferenceExecuted: true,
    }),
    false,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      productionReady: true,
    }),
    false,
  )
  assert.equal(
    verifyLivingFrameComfyUiReadOnlyModelMount({
      ...preparation,
      mountPath: '/tmp/forged',
    }),
    false,
  )

  console.log(
    'Living Frame ComfyUI read-only model mount smoke passed: '
    + '5 canonical single-use presentations, 9 adversarial assertions.',
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

function descriptorFor(
  requirement:
    LivingFrameComfyUiModelArtifactRequirements['requirements'][number],
  bytes: Buffer,
): CanonicalModelArtifactDescriptor {
  const contentSha256 = sha(bytes)
  return {
    descriptorVersion: CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: `lf-mount-${requirement.role}`,
    revision: `controlled-${requirement.order}-v1`,
    artifactFormat: 'safetensors',
    artifactRole: requirement.role,
    modelFamily: requirement.expectedFamily.family,
    byteLength: bytes.byteLength,
    contentSha256,
    consumerScopes: ['comfyui.private-inference'],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      sha(`source:${requirement.role}`),
    reviewEvidenceDigestSha256:
      sha(`review:${requirement.role}`),
    securityReviewDigestSha256:
      sha(`security:${requirement.role}`),
    licensePolicy: {
      modelArtifactLicense: 'controlled-observation-only',
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        sha(`license:${requirement.role}`),
      modelCardDocumentSha256:
        sha(`model-card:${requirement.role}`),
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

function sha(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
