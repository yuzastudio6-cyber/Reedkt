import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  realpath,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION,
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS,
  assertCanonicalModelArtifactGpuBundle,
  consumeCanonicalModelArtifactCloudRunGpuHandoffLease,
  createCanonicalModelArtifactCloudRunGpuConsumer,
  createCanonicalModelArtifactCloudRunGpuHandoffLease,
  createCanonicalModelArtifactGpuBundle,
  createCanonicalModelArtifactRepository,
  createCanonicalModelArtifactRepositoryRootAuthority,
  createCanonicalModelArtifactSourceReader,
  ingestCanonicalModelArtifact,
  verifyCanonicalModelArtifact,
  type CanonicalModelArtifactCloudRunGpuConsumerPort,
  type CanonicalModelArtifactCloudRunGpuHandoffLease,
  type CanonicalModelArtifactDescriptor,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
  type CanonicalModelArtifactLocator,
  type CanonicalModelArtifactRepositoryPort,
} from '../model-artifacts'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const BASE_BYTES = Buffer.from(
  'controlled-sdxl-base-model-artifact-fixture-v1',
  'utf8',
)
const CONTROL_BYTES = Buffer.from(
  'controlled-controlnet-model-artifact-fixture-v1',
  'utf8',
)
const CPU_BYTES = Buffer.from(
  'controlled-cpu-model-artifact-fixture-v1',
  'utf8',
)
const FIXED_NOW_MS = Date.parse('2026-07-27T16:00:00.000Z')
const SHA = 'a'.repeat(64)

const temporaryRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-model-gpu-bundle-'),
)
const canonicalRoot = await realpath(temporaryRoot)
let repositoryNowMs = FIXED_NOW_MS
let leaseNowMs = FIXED_NOW_MS

try {
  const rootAuthority =
    await createCanonicalModelArtifactRepositoryRootAuthority({
      rootPath: temporaryRoot,
    })
  const repository = createCanonicalModelArtifactRepository({
    rootAuthority,
    now: () => new Date(repositoryNowMs++),
  })
  const base = await ingestFixture({
    repository,
    bytes: BASE_BYTES,
    descriptor: gpuDescriptor({
      bytes: BASE_BYTES,
      artifactId: 'controlled-sdxl-base',
      revision: 'revision-sdxl-base-v1',
      artifactRole: 'base-diffusion-checkpoint',
      modelFamily: 'sdxl',
    }),
  })
  const control = await ingestFixture({
    repository,
    bytes: CONTROL_BYTES,
    descriptor: gpuDescriptor({
      bytes: CONTROL_BYTES,
      artifactId: 'controlled-sdxl-controlnet-canny',
      revision: 'revision-controlnet-canny-v1',
      artifactRole: 'controlnet-canny-checkpoint',
      modelFamily: 'sdxl-controlnet',
    }),
  })
  const cpu = await ingestFixture({
    repository,
    bytes: CPU_BYTES,
    descriptor: cpuDescriptor(CPU_BYTES),
  })
  const { manifest, attemptPlan } = createGpuDispatchFixture()
  const requirements = [
    requirement({
      canonicalOrder: 0,
      slotId: 'base_model',
      locator: base.locator,
      descriptor: base.descriptor,
    }),
    requirement({
      canonicalOrder: 1,
      slotId: 'controlnet_model',
      locator: control.locator,
      descriptor: control.descriptor,
    }),
  ]
  const taskBefore = stableAuthorityStringify(
    attemptPlan.cloudTask?.taskBody,
  )
  const environmentBefore = stableAuthorityStringify(
    attemptPlan.cloudRunJob?.environmentOverrides,
  )
  const bundle = await createCanonicalModelArtifactGpuBundle({
    repository,
    cloudDispatchManifest: manifest,
    cloudDispatchAttemptPlan: attemptPlan,
    consumerScope: 'rembg.private-inference',
    requirements,
  })

  assert.equal(bundle.artifacts.length, 2)
  assert.equal(
    bundle.summary.totalByteLength,
    BASE_BYTES.length + CONTROL_BYTES.length,
  )
  assert.equal(bundle.execution.workerType, 'gpu_ai_worker')
  assert.equal(bundle.execution.executionTarget, 'google_cloud_run_gpu')
  assert.equal(bundle.execution.cloudRunAccelerator, 'nvidia_l4')
  assert.equal(bundle.execution.modelAccelerator, 'cuda')
  assert.equal(bundle.execution.gpuCount, 1)
  assert.equal(bundle.execution.noGpuZonalRedundancy, true)
  assert.equal(bundle.execution.cloudRunInternalMaxRetries, 0)
  assert.equal(bundle.identity.approvedToolId, 'rembg')
  assert.equal(
    bundle.identity.approvedToolOperationId,
    'tool.rembg.remove_image_background.v1',
  )
  assert.equal(bundle.summary.cpuFallbackAllowed, false)
  assert.equal(bundle.summary.runtimeDownloadAllowed, false)
  assert.equal(bundle.summary.networkFetchAllowed, false)
  assert.equal(
    bundle.boundaries.cloudTaskBodyContainsModelArtifactData,
    false,
  )
  assert.equal(
    bundle.boundaries.cloudRunEnvironmentContainsModelArtifactData,
    false,
  )
  assert.equal(
    bundle.boundaries.canonicalOperationArtifactSetVerified,
    false,
  )
  assert.ok(bundle.blockers.includes(
    'canonical_operation_model_artifact_set_not_verified',
  ))
  assert.equal(bundle.boundaries.privateGcsDistributionVerified, false)
  assert.equal(bundle.boundaries.cloudRunReadOnlyMountVerified, false)
  assert.equal(bundle.boundaries.remoteMutationAuthorized, false)
  assert.equal(bundle.boundaries.modelInferenceAuthority, false)
  assert.equal(bundle.boundaries.productionReady, false)
  assert.ok(bundle.blockers.includes(
    'private_generation_bound_model_artifact_distribution_not_verified',
  ))
  assert.ok(bundle.blockers.includes(
    'cloud_run_read_only_model_mount_not_verified',
  ))
  assert.equal(
    stableAuthorityStringify(attemptPlan.cloudTask?.taskBody),
    taskBefore,
  )
  assert.equal(
    stableAuthorityStringify(
      attemptPlan.cloudRunJob?.environmentOverrides,
    ),
    environmentBefore,
  )
  assert.equal(
    taskBefore.includes(bundle.bundleDigestSha256),
    false,
  )
  assert.equal(
    environmentBefore.includes(bundle.bundleDigestSha256),
    false,
  )
  assertSerializableBoundary(bundle, canonicalRoot)

  const replay = await assertCanonicalModelArtifactGpuBundle({
    repository,
    cloudDispatchManifest: structuredClone(manifest),
    cloudDispatchAttemptPlan: structuredClone(attemptPlan),
    value: structuredClone(bundle),
  })
  assert.deepEqual(replay, bundle)

  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository: {
        ...repository,
      } as CanonicalModelArtifactRepositoryPort,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements,
    }),
    'forged repository capability',
    'model_artifact_repository_capability_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: {
        ...attemptPlan,
        dispatchBindingHash: sha256('wrong-dispatch-binding'),
      },
      consumerScope: 'rembg.private-inference',
      requirements,
    }),
    'forged dispatch attempt',
    'model_artifact_gpu_dispatch_attempt_mismatch',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: rehashedCpuTargetManifest(manifest),
      cloudDispatchAttemptPlan:
        createCanonicalCloudWorkerDispatchAttemptPlan({
          manifest: rehashedCpuTargetManifest(manifest),
          jobId: attemptPlan.jobId,
          deliveryAttempt: 1,
        }),
      consumerScope: 'rembg.private-inference',
      requirements,
    }),
    'CPU cloud target substitution',
    'model_artifact_gpu_dispatch_target_invalid',
  )
  const wrongServiceIdentityManifest =
    rehashedWrongServiceIdentityManifest(manifest)
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: wrongServiceIdentityManifest,
      cloudDispatchAttemptPlan:
        createCanonicalCloudWorkerDispatchAttemptPlan({
          manifest: wrongServiceIdentityManifest,
          jobId: attemptPlan.jobId,
          deliveryAttempt: 1,
        }),
      consumerScope: 'rembg.private-inference',
      requirements,
    }),
    'GPU worker service identity substitution',
    'model_artifact_gpu_dispatch_target_invalid',
  )
  const invalidOperationManifest =
    rehashedInvalidOperationManifest(manifest)
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: invalidOperationManifest,
      cloudDispatchAttemptPlan:
        createCanonicalCloudWorkerDispatchAttemptPlan({
          manifest: invalidOperationManifest,
          jobId: attemptPlan.jobId,
          deliveryAttempt: 1,
        }),
      consumerScope: 'rembg.private-inference',
      requirements,
    }),
    'unregistered operation substitution',
    'model_artifact_gpu_dispatch_tool_operation_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'comfyui.private-inference',
      requirements,
    }),
    'wrong consumer scope',
    'model_artifact_gpu_consumer_scope_does_not_match_approved_tool',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [
        {
          ...requirements[0]!,
          expectedContentSha256: sha256('wrong-content'),
        },
      ],
    }),
    'wrong expected checksum',
    'model_artifact_gpu_requirement_mismatch',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [
        {
          ...requirements[0]!,
          expectedModelFamily: 'sd15',
        },
      ],
    }),
    'cross-family substitution',
    'model_artifact_gpu_requirement_mismatch',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [
        requirement({
          canonicalOrder: 0,
          slotId: 'cpu_model',
          locator: cpu.locator,
          descriptor: cpu.descriptor,
        }),
      ],
    }),
    'CPU artifact in GPU bundle',
    'model_artifact_gpu_execution_policy_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [
        requirements[0]!,
        { ...requirements[1]!, slotId: 'base_model' },
      ],
    }),
    'duplicate slot',
    'model_artifact_gpu_requirement_order_or_identity_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [
        requirements[0]!,
        {
          ...requirements[0]!,
          canonicalOrder: 1,
          slotId: 'duplicate_record',
        },
      ],
    }),
    'duplicate artifact record',
    'model_artifact_gpu_requirement_order_or_identity_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [...requirements].reverse(),
    }),
    'reordered requirements',
    'model_artifact_gpu_requirement_order_or_identity_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: Array.from({
        length: MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS + 1,
      }, (_, canonicalOrder) => ({
        ...requirements[0]!,
        canonicalOrder,
        slotId: `oversized_slot_${canonicalOrder}`,
      })),
    }),
    'oversized artifact bundle',
    'model_artifact_gpu_requirements_invalid',
  )
  await expectRejects(
    () => createCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      consumerScope: 'rembg.private-inference',
      requirements: [{
        ...requirements[0]!,
        callerUrl: 'https://attacker.invalid/model',
      } as CanonicalModelArtifactGpuBundleRequirement],
    }),
    'unknown URL field',
    'model_artifact_gpu_requirements_invalid',
  )

  const wrongDigestBundle = structuredClone(bundle) as unknown as {
    bundleDigestSha256: string
  }
  wrongDigestBundle.bundleDigestSha256 = sha256('wrong-bundle')
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: wrongDigestBundle,
    }),
    'wrong bundle digest',
    'model_artifact_gpu_bundle_digest_mismatch',
  )
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: {
        ...bundle,
        sourceAbsolutePath: '/tmp/attacker-model',
      },
    }),
    'path-bearing bundle',
    'model_artifact_gpu_bundle_schema_invalid',
  )
  const forgedFamilyBundle = resignBundle(structuredClone(bundle), (value) => {
    value.artifacts[0]!.modelFamily = 'forged-family'
  })
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: forgedFamilyBundle,
    }),
    'correctly re-signed family forgery',
    'model_artifact_gpu_requirement_mismatch',
  )
  const forgedDispatchBundle = resignBundle(
    structuredClone(bundle),
    (value) => {
      value.identity.dispatchBindingHash =
        sha256('forged-bundle-dispatch')
    },
  )
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: forgedDispatchBundle,
    }),
    'correctly re-signed dispatch forgery',
    'model_artifact_gpu_bundle_dispatch_mismatch',
  )
  const forgedToolBundle = resignBundle(
    structuredClone(bundle),
    (value) => {
      value.identity.approvedToolId = 'comfyui'
      value.identity.approvedToolOperationId =
        'comfyui.generate_controlled_image.v1'
    },
  )
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: forgedToolBundle,
    }),
    'correctly re-signed cross-tool identity forgery',
    'model_artifact_gpu_bundle_dispatch_mismatch',
  )
  const forgedScopeBundle = resignBundle(
    structuredClone(bundle),
    (value) => {
      value.consumerScope = 'comfyui.private-inference'
    },
  )
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: forgedScopeBundle,
    }),
    'correctly re-signed cross-tool scope forgery',
    'model_artifact_gpu_consumer_scope_does_not_match_approved_tool',
  )
  const forgedProductionBundle = structuredClone(bundle) as unknown as {
    boundaries: { productionReady: boolean }
    bundleDigestSha256: string
  }
  forgedProductionBundle.boundaries.productionReady = true
  const forgedProductionDraft = { ...forgedProductionBundle }
  Reflect.deleteProperty(
    forgedProductionDraft,
    'bundleDigestSha256',
  )
  forgedProductionBundle.bundleDigestSha256 =
    sha256AuthorityValue(forgedProductionDraft)
  await expectRejects(
    () => assertCanonicalModelArtifactGpuBundle({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      value: forgedProductionBundle,
    }),
    'correctly re-signed production authority forgery',
    'model_artifact_gpu_bundle_schema_invalid',
  )

  const lease =
    await createCanonicalModelArtifactCloudRunGpuHandoffLease({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      bundle,
      leaseId: 'gpu-bundle-lease-primary',
      leaseDurationMs: 30_000,
      now: () => new Date(leaseNowMs),
    })
  assert.equal(lease.artifactCount, 2)
  assert.equal(lease.hostPathsIncluded, false)
  assert.equal(lease.mountPathsIncluded, false)
  assert.equal(lease.bytesIncluded, false)
  assert.equal(lease.urlsIncluded, false)
  assert.equal(lease.credentialsIncluded, false)
  assert.equal(lease.cpuFallbackAllowed, false)
  assert.equal(lease.runtimeDownloadAllowed, false)
  assert.equal(lease.remoteDistributionAuthorized, false)
  assert.equal(lease.modelInferenceAuthority, false)
  assertSerializableBoundary(lease, canonicalRoot)

  const forgedConsumer = {
    consumerVersion:
      CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION,
    consumerClass:
      'process_bound_private_gpu_bundle_handoff_consumer',
    consumerScope: 'rembg.private-inference',
    executionTarget: 'google_cloud_run_gpu',
    cloudRunAccelerator: 'nvidia_l4',
    callerPathAccepted: false,
    callerUrlAccepted: false,
    callerBytesAccepted: false,
    remoteDistributionAuthorized: false,
    modelExecutionAuthorized: false,
    productionReady: false,
    inspectVerifiedReadOnlyGpuBundle: async () => undefined,
  } as CanonicalModelArtifactCloudRunGpuConsumerPort
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease,
      consumer: forgedConsumer,
    }),
    'forged consumer capability',
    'model_artifact_gpu_consumer_capability_invalid',
  )
  const wrongConsumer =
    createCanonicalModelArtifactCloudRunGpuConsumer({
      consumerScope: 'comfyui.private-inference',
      inspectVerifiedReadOnlyGpuBundle: async () => undefined,
    })
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease,
      consumer: wrongConsumer,
    }),
    'cross-scope consumer',
    'model_artifact_gpu_handoff_consumer_mismatch',
  )
  const forgedLease = {
    ...lease,
  } as CanonicalModelArtifactCloudRunGpuHandoffLease
  const validConsumer =
    createCanonicalModelArtifactCloudRunGpuConsumer({
      consumerScope: 'rembg.private-inference',
      inspectVerifiedReadOnlyGpuBundle: async () => undefined,
    })
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease: forgedLease,
      consumer: validConsumer,
    }),
    'forged lease capability',
    'model_artifact_gpu_handoff_lease_capability_invalid',
  )

  let consumerCallCount = 0
  const consumer =
    createCanonicalModelArtifactCloudRunGpuConsumer({
      consumerScope: 'rembg.private-inference',
      inspectVerifiedReadOnlyGpuBundle: async (input) => {
        consumerCallCount += 1
        assert.equal(Object.isFrozen(input), true)
        assert.equal(Object.isFrozen(input.artifactSources), true)
        assert.equal(
          input.artifactSources.every((source) =>
            Object.isFrozen(source)),
          true,
        )
        assert.equal(input.artifactSources.length, 2)
        assert.equal(input.dispatchIntentId, attemptPlan.dispatchIntentId)
        assert.equal(input.executionTarget, 'google_cloud_run_gpu')
        assert.equal(input.cloudRunAccelerator, 'nvidia_l4')
        assert.equal(input.runtimeDownloadAllowed, false)
        assert.equal(input.networkFetchAllowed, false)
        assert.equal(input.modelExecutionAuthorized, false)
        assert.deepEqual(
          input.artifactSources.map((source) => source.slotId),
          ['base_model', 'controlnet_model'],
        )
        for (const source of input.artifactSources) {
          assert.equal(source.readOnly, true)
          assert.equal(source.cpuFallbackAllowed, false)
          assert.equal(source.runtimeDownloadAllowed, false)
          assert.equal(source.networkFetchAllowed, false)
          assert.match(
            source.serverDerivedReadOnlyMountPath,
            /^\/opt\/reeditpro\/model-artifacts\/[A-Za-z0-9._:-]+\/artifact\.[A-Za-z0-9]+$/u,
          )
          assert.equal(
            (await lstat(source.sourceAbsolutePath)).mode & 0o777,
            0o400,
          )
          assert.equal(
            sha256(await readFile(source.sourceAbsolutePath)),
            source.expectedContentSha256,
          )
        }
      },
    })
  const consumption =
    await consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease,
      consumer,
    })
  assert.equal(consumerCallCount, 1)
  assert.equal(consumption.artifactCount, 2)
  assert.equal(consumption.allObjectsVerifiedBeforeConsumer, true)
  assert.equal(consumption.allObjectsVerifiedAfterConsumer, true)
  assert.equal(consumption.oneProcessBoundConsumerInvocation, true)
  assert.equal(consumption.cloudTaskBodyChanged, false)
  assert.equal(consumption.cloudRunEnvironmentChanged, false)
  assert.equal(consumption.remoteDistributionPerformed, false)
  assert.equal(consumption.cloudRunJobExecuted, false)
  assert.equal(consumption.modelInferenceExecuted, false)
  assert.equal(consumption.providerCallMade, false)
  assert.equal(consumption.customerCreditsMutated, false)
  assert.equal(consumption.productionReady, false)
  assertSerializableBoundary(consumption, canonicalRoot)
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease,
      consumer,
    }),
    'single-use lease replay',
    'model_artifact_gpu_handoff_lease_already_consumed',
  )

  const expiredLease =
    await createCanonicalModelArtifactCloudRunGpuHandoffLease({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      bundle,
      leaseId: 'gpu-bundle-lease-expired',
      leaseDurationMs: 5,
      now: () => new Date(leaseNowMs),
    })
  leaseNowMs += 5
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease: expiredLease,
      consumer,
    }),
    'expired lease',
    'model_artifact_gpu_handoff_lease_expired',
  )

  leaseNowMs += 1
  const mutatingLease =
    await createCanonicalModelArtifactCloudRunGpuHandoffLease({
      repository,
      cloudDispatchManifest: manifest,
      cloudDispatchAttemptPlan: attemptPlan,
      bundle,
      leaseId: 'gpu-bundle-lease-mutation',
      leaseDurationMs: 30_000,
      now: () => new Date(leaseNowMs),
    })
  let mutatedPath = ''
  const mutatingConsumer =
    createCanonicalModelArtifactCloudRunGpuConsumer({
      consumerScope: 'rembg.private-inference',
      inspectVerifiedReadOnlyGpuBundle: async (input) => {
        mutatedPath = input.artifactSources[0]!.sourceAbsolutePath
        await chmod(mutatedPath, 0o600)
      },
    })
  await expectRejects(
    () => consumeCanonicalModelArtifactCloudRunGpuHandoffLease({
      lease: mutatingLease,
      consumer: mutatingConsumer,
    }),
    'consumer source mutation',
    'model_artifact_object_not_immutable_regular_file',
  )
  assert.ok(mutatedPath)
  await chmod(mutatedPath, 0o400)
  await verifyCanonicalModelArtifact({
    repository,
    locator: base.locator,
  })

  console.log(JSON.stringify({
    ok: true,
    smoke: 'canonical-model-artifact-cloud-run-gpu-handoff',
    artifactCount: bundle.summary.artifactCount,
    totalByteLength: bundle.summary.totalByteLength,
    exactGpuAttemptBound: true,
    cloudRunAccelerator: bundle.execution.cloudRunAccelerator,
    modelAccelerator: bundle.execution.modelAccelerator,
    gpuCount: bundle.execution.gpuCount,
    cloudTaskBodyChanged: false,
    cloudRunEnvironmentChanged: false,
    cpuFallbackAllowed: false,
    runtimeDownloadAllowed: false,
    networkFetchAllowed: false,
    processBoundReadOnlyBundleConsumptions: 1,
    adversarialAssertions: 27,
    privateGcsDistributionVerified: false,
    cloudRunReadOnlyMountVerified: false,
    cloudRunJobExecuted: false,
    modelInferenceExecuted: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}

async function ingestFixture(input: {
  repository: CanonicalModelArtifactRepositoryPort
  bytes: Buffer
  descriptor: CanonicalModelArtifactDescriptor
}) {
  const receipt = await ingestCanonicalModelArtifact({
    repository: input.repository,
    sourceReader: createCanonicalModelArtifactSourceReader({
      descriptor: input.descriptor,
      openServerOwnedByteStream: async () =>
        Readable.from([input.bytes]),
    }),
  })
  return {
    locator: receipt.locator,
    descriptor: input.descriptor,
  }
}

function gpuDescriptor(input: {
  bytes: Buffer
  artifactId: string
  revision: string
  artifactRole: string
  modelFamily: string
}): CanonicalModelArtifactDescriptor {
  return descriptor({
    ...input,
    executionPolicy: {
      executionClass: 'gpu_required',
      requiredExecutionTarget: 'google_cloud_run_gpu',
      accelerator: 'cuda',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
  })
}

function cpuDescriptor(
  bytes: Buffer,
): CanonicalModelArtifactDescriptor {
  return descriptor({
    bytes,
    artifactId: 'controlled-cpu-model',
    revision: 'revision-cpu-model-v1',
    artifactRole: 'cpu-test-model',
    modelFamily: 'cpu-test-family',
    executionPolicy: {
      executionClass: 'cpu_permitted',
      requiredExecutionTarget: 'private_controlled_cpu',
      accelerator: 'none',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
  })
}

function descriptor(input: {
  bytes: Buffer
  artifactId: string
  revision: string
  artifactRole: string
  modelFamily: string
  executionPolicy: CanonicalModelArtifactDescriptor['executionPolicy']
}): CanonicalModelArtifactDescriptor {
  return {
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: input.artifactId,
    revision: input.revision,
    artifactFormat: 'safetensors',
    artifactRole: input.artifactRole,
    modelFamily: input.modelFamily,
    byteLength: input.bytes.length,
    contentSha256: sha256(input.bytes),
    consumerScopes: ['rembg.private-inference'],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256:
      sha256(`${input.artifactId}:source`),
    reviewEvidenceDigestSha256:
      sha256(`${input.artifactId}:review`),
    securityReviewDigestSha256:
      sha256(`${input.artifactId}:security`),
    licensePolicy: {
      modelArtifactLicense: 'controlled-evaluation-only',
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256:
        sha256(`${input.artifactId}:license`),
      modelCardDocumentSha256:
        sha256(`${input.artifactId}:model-card`),
    },
    executionPolicy: input.executionPolicy,
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
  }
}

function requirement(input: {
  canonicalOrder: number
  slotId: string
  locator: CanonicalModelArtifactLocator
  descriptor: CanonicalModelArtifactDescriptor
}): CanonicalModelArtifactGpuBundleRequirement {
  return {
    canonicalOrder: input.canonicalOrder,
    slotId: input.slotId,
    locator: input.locator,
    expectedArtifactId: input.descriptor.artifactId,
    expectedRevision: input.descriptor.revision,
    expectedArtifactFormat: input.descriptor.artifactFormat,
    expectedArtifactRole: input.descriptor.artifactRole,
    expectedModelFamily: input.descriptor.modelFamily,
    expectedByteLength: input.descriptor.byteLength,
    expectedContentSha256: input.descriptor.contentSha256,
    required: true,
  }
}

function createGpuDispatchFixture(): {
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
} {
  const targetDraft = {
    workerType: 'gpu_ai_worker' as const,
    handoffMode:
      'cloud_tasks_oidc_to_private_controller_then_cloud_run_jobs_run' as const,
    cloudTasksQueueKind: 'worker_dispatch' as const,
    cloudRunTargetKind: 'job' as const,
    cloudRunTargetName: 'reeditpro-gpu-ai-worker',
    workerServiceAccountKey: 'gpu_ai_worker',
    workerServiceAccountEmail:
      'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    cpu: 4,
    memory: '16Gi',
    accelerator: 'nvidia_l4' as const,
    parallelism: 1 as const,
    cloudRunInternalMaxRetries: 0 as const,
    targetResourceExistenceVerified: false as const,
    targetIamVerified: false as const,
  }
  const target = {
    ...targetDraft,
    targetHash: sha256AuthorityValue(targetDraft),
  }
  const entryDraft = {
    canonicalOrder: 0,
    jobId: 'job_gpu_model_bundle',
    approvedWorkItemId: 'work_gpu_model_bundle',
    workItemKey: 'gpu-model-bundle',
    required: true,
    dependencyJobIds: [],
    scheduledFor: '2026-07-27T16:00:00.000Z',
    maxAttempts: 2,
    approvedToolId: 'rembg',
    approvedToolOperationIds: [
      'tool.rembg.remove_image_background.v1',
    ],
    queueJobDefinitionHash: sha256('queue-job-definition'),
    placementHash: sha256('gpu-placement'),
    workerType: 'gpu_ai_worker' as const,
    resourceClassId: 'gpu_l4_standard_v1',
    runtimeRegion: 'us-east1' as const,
    target,
    queueResourceName:
      'projects/reeditpro/locations/us-east1/queues/' +
      'reeditpro-worker-dispatch',
    privateDispatchControllerServiceName: 'reeditpro-api',
    privateDispatchControllerPath:
      '/internal/v1/canonical-cloud-dispatch' as const,
    taskOidcServiceAccountEmail:
      'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
    taskOidcAudienceState:
      'deployed_private_controller_url_required' as const,
    cloudRunTaskTimeoutSeconds: 3_600,
    cloudRunTaskTimeoutLimitSeconds: 3_600,
    packageQueueOwnsApprovedAttempts: true as const,
    cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt:
      true as const,
    workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    taskBodyCarriesRawMediaOrSecrets: false as const,
    blockers: [
      'cloud_run_job_not_deployed',
      'private_gcs_transport_not_verified',
    ],
    cloudDispatchAuthorized: false as const,
    productionExecutionAuthorized: false as const,
  }
  const entry = {
    ...entryDraft,
    entryHash: sha256AuthorityValue(entryDraft),
  }
  const manifestDraft = {
    schemaVersion:
      'canonical-cloud-worker-dispatch-handoff-manifest-v1' as const,
    source:
      'approved_package_queue_region_and_cloud_target_authority' as const,
    identity: {
      workspaceId: 'workspace_gpu_model_bundle',
      projectId: 'project_gpu_model_bundle',
      editSessionId: 'session_gpu_model_bundle',
      packageRecordId: 'package_gpu_model_bundle',
      approvedPlanSnapshotId: 'snapshot_gpu_model_bundle',
      packageHash: SHA,
      snapshotHash: sha256('snapshot'),
      workGraphHash: sha256('work-graph'),
      queueDefinitionHash: sha256('queue-definition'),
      regionAuthorityHash: sha256('region-authority'),
      toolTargetCatalogHash: sha256('tool-target-catalog'),
    },
    runtimeRegion: 'us-east1' as const,
    entries: [entry],
    summary: {
      totalJobCount: 1,
      controlPlaneJobCount: 0,
      cloudTaskHandoffJobCount: 1,
      cpuAnalysisJobCount: 0,
      gpuJobCount: 1,
      renderJobCount: 0,
      allJobsHaveExactCloudTargetContract: true as const,
      cloudRunHiddenRetryCount: 0 as const,
      allTaskBodiesOpaque: true as const,
    },
    boundaries: {
      browserDispatchAllowed: false as const,
      rawChatPromptMediaBytesOrSignedUrlsAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      remoteSupabaseAuthorized: false as const,
      distributedOutboxTransactionVerified: false as const,
      cloudTasksOidcAndIamVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      workerServiceIdentityVerified: false as const,
      privateGcsObjectTransportVerified: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  const manifest = {
    ...manifestDraft,
    manifestHash: sha256AuthorityValue(manifestDraft),
  }
  return {
    manifest,
    attemptPlan: createCanonicalCloudWorkerDispatchAttemptPlan({
      manifest,
      jobId: entry.jobId,
      deliveryAttempt: 1,
    }),
  }
}

function rehashedCpuTargetManifest(
  input: CanonicalCloudWorkerDispatchHandoffManifest,
): CanonicalCloudWorkerDispatchHandoffManifest {
  const manifest = structuredClone(input)
  const entry = manifest.entries[0]!
  entry.target.workerType = 'cpu_analysis_worker'
  entry.target.accelerator = 'none'
  entry.target.cloudRunTargetName = 'reeditpro-cpu-analysis-worker'
  entry.target.workerServiceAccountEmail =
    'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  const targetDraft = { ...entry.target }
  Reflect.deleteProperty(targetDraft, 'targetHash')
  entry.target.targetHash = sha256AuthorityValue(targetDraft)
  entry.workerType = 'cpu_analysis_worker'
  entry.resourceClassId = 'cpu_analysis_standard_v1'
  const entryDraft = { ...entry }
  Reflect.deleteProperty(entryDraft, 'entryHash')
  entry.entryHash = sha256AuthorityValue(entryDraft)
  manifest.summary.gpuJobCount = 0
  manifest.summary.cpuAnalysisJobCount = 1
  const manifestDraft = { ...manifest }
  Reflect.deleteProperty(manifestDraft, 'manifestHash')
  manifest.manifestHash = sha256AuthorityValue(manifestDraft)
  return manifest
}

function rehashedInvalidOperationManifest(
  input: CanonicalCloudWorkerDispatchHandoffManifest,
): CanonicalCloudWorkerDispatchHandoffManifest {
  const manifest = structuredClone(input)
  const entry = manifest.entries[0]!
  entry.approvedToolOperationIds = ['tool.rembg.unregistered.v1']
  const entryDraft = { ...entry }
  Reflect.deleteProperty(entryDraft, 'entryHash')
  entry.entryHash = sha256AuthorityValue(entryDraft)
  const manifestDraft = { ...manifest }
  Reflect.deleteProperty(manifestDraft, 'manifestHash')
  manifest.manifestHash = sha256AuthorityValue(manifestDraft)
  return manifest
}

function rehashedWrongServiceIdentityManifest(
  input: CanonicalCloudWorkerDispatchHandoffManifest,
): CanonicalCloudWorkerDispatchHandoffManifest {
  const manifest = structuredClone(input)
  const entry = manifest.entries[0]!
  entry.target.workerServiceAccountKey = 'cpu_analysis_worker'
  entry.target.workerServiceAccountEmail =
    'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  const targetDraft = { ...entry.target }
  Reflect.deleteProperty(targetDraft, 'targetHash')
  entry.target.targetHash = sha256AuthorityValue(targetDraft)
  const entryDraft = { ...entry }
  Reflect.deleteProperty(entryDraft, 'entryHash')
  entry.entryHash = sha256AuthorityValue(entryDraft)
  const manifestDraft = { ...manifest }
  Reflect.deleteProperty(manifestDraft, 'manifestHash')
  manifest.manifestHash = sha256AuthorityValue(manifestDraft)
  return manifest
}

function resignBundle(
  bundle: CanonicalModelArtifactGpuBundle,
  mutate: (bundle: MutableBundle) => void,
): CanonicalModelArtifactGpuBundle {
  const mutable = bundle as unknown as MutableBundle
  mutate(mutable)
  for (const artifact of mutable.artifacts) {
    const draft = { ...artifact }
    Reflect.deleteProperty(draft, 'artifactBindingDigestSha256')
    artifact.artifactBindingDigestSha256 =
      sha256AuthorityValue(draft)
  }
  const requirements = mutable.artifacts.map((artifact) =>
    requirementFromArtifact(artifact))
  mutable.requirementsDigestSha256 =
    sha256AuthorityValue(requirements)
  mutable.bundleId = `model_gpu_bundle_${
    sha256AuthorityValue({
      identity: mutable.identity,
      consumerScope: mutable.consumerScope,
      requirementsDigestSha256:
        mutable.requirementsDigestSha256,
    }).slice(0, 32)
  }`
  const draft = { ...mutable }
  Reflect.deleteProperty(draft, 'bundleDigestSha256')
  mutable.bundleDigestSha256 = sha256AuthorityValue(draft)
  return mutable as unknown as CanonicalModelArtifactGpuBundle
}

type MutableBundle = {
  -readonly [Key in keyof Omit<
    CanonicalModelArtifactGpuBundle,
    | 'bundleId'
    | 'identity'
    | 'requirementsDigestSha256'
    | 'artifacts'
    | 'bundleDigestSha256'
  >]: CanonicalModelArtifactGpuBundle[Key]
} & {
  bundleId: string
  requirementsDigestSha256: string
  bundleDigestSha256: string
  identity: {
    -readonly [Key in keyof CanonicalModelArtifactGpuBundle['identity']]:
      CanonicalModelArtifactGpuBundle['identity'][Key]
  }
  artifacts: Array<{
    -readonly [Key in keyof CanonicalModelArtifactGpuBundleArtifact]:
      CanonicalModelArtifactGpuBundleArtifact[Key]
  }>
}

function requirementFromArtifact(
  artifact: CanonicalModelArtifactGpuBundleArtifact,
): CanonicalModelArtifactGpuBundleRequirement {
  return {
    canonicalOrder: artifact.canonicalOrder,
    slotId: artifact.slotId,
    locator: artifact.locator,
    expectedArtifactId: artifact.artifactId,
    expectedRevision: artifact.revision,
    expectedArtifactFormat: artifact.artifactFormat,
    expectedArtifactRole: artifact.artifactRole,
    expectedModelFamily: artifact.modelFamily,
    expectedByteLength: artifact.byteLength,
    expectedContentSha256: artifact.contentSha256,
    required: true,
  }
}

function assertSerializableBoundary(
  value: unknown,
  forbiddenRoot: string,
): void {
  const serialized = JSON.stringify(value)
  assert.equal(serialized.includes(forbiddenRoot), false)
  assert.equal(serialized.includes('sourceAbsolutePath'), false)
  assert.equal(serialized.includes('serverDerivedReadOnlyMountPath'), false)
  assert.equal(serialized.includes('https://'), false)
  assert.equal(serialized.includes('gs://'), false)
  assert.equal(serialized.includes('file://'), false)
  assert.equal(serialized.includes('"credentialsIncluded":true'), false)
  assert.doesNotMatch(
    serialized,
    /(?:Bearer\s|BEGIN PRIVATE KEY|api[_-]?key["'=])/iu,
  )
}

async function expectRejects(
  operation: () => Promise<unknown>,
  label: string,
  expectedReason: string,
): Promise<void> {
  try {
    await operation()
    assert.fail(`${label} should have failed closed`)
  } catch (error) {
    assert.match(
      JSON.stringify(error),
      new RegExp(expectedReason, 'u'),
      `${label} rejected for the wrong reason`,
    )
  }
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}
