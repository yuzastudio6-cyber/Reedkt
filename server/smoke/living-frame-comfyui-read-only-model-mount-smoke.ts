import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import type {
  LivingFrameComfyUiModelArtifactRequirements,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-gpu-runtime-protocol'
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
  createLivingFrameComfyUiPrivateCanonicalMountHostSessionPort,
  createLivingFrameComfyUiPrivateMountedSupervisedRunnerPort,
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT,
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
  livingFrameComfyUiCanonicalWireArtifactSourceBindingDigest,
  type LivingFrameComfyUiMountedSupervisedRunnerInput,
} from '../living-frame/living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  type LivingFrameControlledSdxlPrivateGpuWireRequest,
} from '../living-frame/living-frame-controlled-sdxl-gpu-runtime-protocol'
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

  const canonicalWireRequest =
    wireRequestFor(artifactBinding)
  let concurrentVerifiedSourceCount = 0
  const canonicalSession =
    createLivingFrameComfyUiPrivateCanonicalMountHostSessionPort({
      sessionId: 'session.comfyui.mount-smoke.success',
      artifactBinding,
      artifactBindingInput,
      repository,
      runnerPort:
        createLivingFrameComfyUiPrivateMountedSupervisedRunnerPort(
          async (runnerInput) => {
            assert.equal(runnerInput.modelSources.length, 5)
            assert.equal(
              runnerInput.runtimeConfinementRequirement,
              LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT,
            )
            assert.equal(
              runnerInput
                .runtimeConfinementRequirementDigestSha256,
              LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
            )
            assert.equal(
              new Set(
                runnerInput.modelSources.map(
                  (source) => source.fixedContainerMountPath,
                ),
              ).size,
              5,
            )
            const sourceBytes = await Promise.all(
              runnerInput.modelSources.map(
                (source) => readFile(source.sourceAbsolutePath),
              ),
            )
            concurrentVerifiedSourceCount = sourceBytes.length
            runnerInput.modelSources.forEach((source, index) => {
              assert.equal(
                sha(sourceBytes[index]!),
                source.expectedContentSha256,
              )
              assert.equal(
                source.fixedContainerMountPath.endsWith(
                  `/${source.privatePromptModelAlias}`,
                ),
                true,
              )
              assert.equal(source.readOnly, true)
            })
            return {
              canonicalMountSessionDigestSha256:
                runnerInput.canonicalMountSessionDigestSha256,
              hostExecutionResult: {
                evidenceClass:
                  'private_internal_comfyui_host_runtime_observation_unreleased',
                terminalState: 'completed',
                failureCode: 'none',
                promptAccepted: true,
                modelInferenceExecuted: true,
                startedAt: '2026-07-29T14:00:00.000Z',
                finishedAt: '2026-07-29T14:00:04.000Z',
                privatePromptId: 'prompt.private.atomic.001',
                outputPngBytes: Uint8Array.from([137, 80, 78, 71]),
                outputImageCount: 1,
                externalNetworkPerformed: false,
                runtimeDownloadPerformed: false,
              },
              processLifecycle: {
                receiptDigestSha256: sha('process-lifecycle-success'),
                processStarted: true,
                loopbackReady: true,
                hostExecutionCompleted: true,
                processStopped: true,
                oneProcessPerAttempt: true,
                externalListenAllowed: false,
                runtimeDownloadsAllowed: false,
                runtimeConfinement:
                  confinementObservation(runnerInput),
                productionQualified: false,
              },
              externalNetworkPerformed: false,
              runtimeDownloadPerformed: false,
              productionQualified: false,
            }
          },
        ),
    })
  const canonicalSessionResult =
    await canonicalSession.executeOne(canonicalWireRequest)
  assert.equal(concurrentVerifiedSourceCount, 5)
  assert.equal(
    canonicalSessionResult.canonicalModelMountSession
      ?.requiredArtifactCount,
    5,
  )
  assert.equal(
    canonicalSessionResult.canonicalModelMountSession
      ?.everyObjectVerifiedBeforeAndAfterInference,
    true,
  )
  assert.equal(
    JSON.stringify(canonicalSessionResult).includes(temporaryRoot),
    false,
  )
  await assert.rejects(
    () => canonicalSession.executeOne(canonicalWireRequest),
    /atomic_mount_session_reused/,
  )

  const wrongIdentitySession =
    createLivingFrameComfyUiPrivateCanonicalMountHostSessionPort({
      sessionId: 'session.comfyui.mount-smoke.root-reject',
      artifactBinding,
      artifactBindingInput,
      repository,
      runnerPort:
        createLivingFrameComfyUiPrivateMountedSupervisedRunnerPort(
          async (runnerInput) => ({
            canonicalMountSessionDigestSha256:
              runnerInput.canonicalMountSessionDigestSha256,
            hostExecutionResult: {
              evidenceClass:
                'private_internal_comfyui_host_runtime_observation_unreleased',
              terminalState: 'completed',
              failureCode: 'none',
              promptAccepted: true,
              modelInferenceExecuted: true,
              startedAt: '2026-07-29T14:00:10.000Z',
              finishedAt: '2026-07-29T14:00:14.000Z',
              outputPngBytes:
                Uint8Array.from([137, 80, 78, 71]),
              outputImageCount: 1,
              externalNetworkPerformed: false,
              runtimeDownloadPerformed: false,
            },
            processLifecycle: {
              receiptDigestSha256:
                sha('process-lifecycle-root-reject'),
              processStarted: true,
              loopbackReady: true,
              hostExecutionCompleted: true,
              processStopped: true,
              oneProcessPerAttempt: true,
              externalListenAllowed: false,
              runtimeDownloadsAllowed: false,
              runtimeConfinement: {
                ...confinementObservation(runnerInput),
                observedUid: 0 as 65_532,
                nonRootObserved: false as true,
              },
              productionQualified: false,
            },
            externalNetworkPerformed: false,
            runtimeDownloadPerformed: false,
            productionQualified: false,
          }),
        ),
    })
  await assert.rejects(
    () => wrongIdentitySession.executeOne(canonicalWireRequest),
    /mounted_supervised_runner_result_invalid/,
  )

  const tamperingSession =
    createLivingFrameComfyUiPrivateCanonicalMountHostSessionPort({
      sessionId: 'session.comfyui.mount-smoke.tamper',
      artifactBinding,
      artifactBindingInput,
      repository,
      runnerPort:
        createLivingFrameComfyUiPrivateMountedSupervisedRunnerPort(
          async (runnerInput) => {
            await chmod(
              runnerInput.modelSources[4]!.sourceAbsolutePath,
              0o600,
            )
            await writeFile(
              runnerInput.modelSources[4]!.sourceAbsolutePath,
              Buffer.from('post-inference canonical tamper'),
            )
            return {
              canonicalMountSessionDigestSha256:
                runnerInput.canonicalMountSessionDigestSha256,
              hostExecutionResult: {
                evidenceClass:
                  'private_internal_comfyui_host_runtime_observation_unreleased',
                terminalState: 'completed',
                failureCode: 'none',
                promptAccepted: true,
                modelInferenceExecuted: true,
                startedAt: '2026-07-29T14:01:00.000Z',
                finishedAt: '2026-07-29T14:01:04.000Z',
                outputPngBytes: Uint8Array.from([137, 80, 78, 71]),
                outputImageCount: 1,
                externalNetworkPerformed: false,
                runtimeDownloadPerformed: false,
              },
              processLifecycle: {
                receiptDigestSha256: sha('process-lifecycle-tamper'),
                processStarted: true,
                loopbackReady: true,
                hostExecutionCompleted: true,
                processStopped: true,
                oneProcessPerAttempt: true,
                externalListenAllowed: false,
                runtimeDownloadsAllowed: false,
                runtimeConfinement:
                  confinementObservation(runnerInput),
                productionQualified: false,
              },
              externalNetworkPerformed: false,
              runtimeDownloadPerformed: false,
              productionQualified: false,
            }
          },
        ),
    })
  await assert.rejects(
    () => tamperingSession.executeOne(canonicalWireRequest),
    /unavailable or unsafe|verification|checksum|artifact/iu,
  )

  console.log(
    'Living Frame ComfyUI read-only model mount smoke passed: '
    + '5 canonical single-use presentations, atomic host-session '
    + 'lifetime verification, exact non-root confinement admission, '
    + 'root-observation refusal, and post-inference tamper refusal.',
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

function confinementObservation(
  input: LivingFrameComfyUiMountedSupervisedRunnerInput,
) {
  return {
    requirementDigestSha256:
      input.runtimeConfinementRequirementDigestSha256,
    identitySource: 'platform_enforced_override' as const,
    observedUid: 65_532 as const,
    observedGid: 65_532 as const,
    nonRootObserved: true as const,
    rootFilesystemReadOnlyObserved: true as const,
    allLinuxCapabilitiesDroppedObserved: true as const,
    noNewPrivilegesObserved: true as const,
    externalNetworkBlockedObserved: true as const,
    runtimeDownloadsBlockedObserved: true as const,
    modelMountsReadOnlyObserved: true as const,
    writableOperationRootsEphemeralOnlyObserved: true as const,
  }
}

function wireRequestFor(
  binding: Awaited<
    ReturnType<typeof bindLivingFrameComfyUiCanonicalModelArtifacts>
  >,
): LivingFrameControlledSdxlPrivateGpuWireRequest {
  const aliases = {
    base_checkpoint: 'sdxl_base_private.safetensors',
    controlnet_checkpoint:
      'controlnet_canny_private.safetensors',
    lora_adapter: 'editorial_style_private.safetensors',
    generic_ipadapter_checkpoint:
      'ipadapter_generic_private.safetensors',
    clip_vision_checkpoint:
      'clip_vision_private.safetensors',
  } as const
  const slots = {
    base_checkpoint: 'base_checkpoint_artifact',
    controlnet_checkpoint:
      'controlnet_checkpoint_artifact',
    lora_adapter: 'lora_adapter_artifact',
    generic_ipadapter_checkpoint:
      'generic_ipadapter_checkpoint_artifact',
    clip_vision_checkpoint:
      'clip_vision_checkpoint_artifact',
  } as const
  return {
    protocolVersion:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
    requestId: 'request.comfyui.mount-smoke',
    clientId: 'client.comfyui.mount-smoke',
    expectedOperation: {
      canonicalToolId: 'comfyui',
      operationId:
        'tool.comfyui.generate_controlled_image.v1',
    },
    prompt: {
      output: {
        class_type: 'SaveImageWebsocket',
        inputs: {
          images: ['source', 0],
        },
      },
    },
    artifactMountBindings: binding.entries.map(
      (entry) => ({
        order: entry.canonicalOrder,
        slotKind: slots[entry.role],
        artifactRecordId: entry.locator.artifactRecordId,
        artifactContentSha256: entry.contentSha256,
        artifactSourceBindingDigestSha256:
          livingFrameComfyUiCanonicalWireArtifactSourceBindingDigest(
            binding,
            entry,
          ),
        privateAlias: aliases[entry.role],
        readOnlyMountRequired: true as const,
      }),
    ),
    outputExpectation: {
      transport: 'websocket_image_output',
      contentType: 'image/png',
      widthPixels: 1024,
      heightPixels: 1024,
      imageCount: 1,
    },
    costEventExpectation: {
      costComponentId:
        'shared_controlled_illustration_gpu_host',
      sharedGpuCapabilityKeys: [
        'comfyui',
        'comfyui_controlnet_aux',
        'controlnet',
        'ip_adapter',
        'peft_lora',
      ],
      separateCpuQaCapabilityKey: 'auraface',
      oneRequestEqualsOneGpuAttempt: true,
      fiveGpuCapabilitiesShareAttemptLifetime: true,
      auraFaceCpuMeasurementExcluded: true,
      exactReuseCreatesNoNewGpuAttempt: true,
      failedOrUnknownAttemptCostMustBeRetained: true,
    },
  }
}
