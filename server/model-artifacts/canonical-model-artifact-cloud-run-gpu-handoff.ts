import { z } from 'zod'

import {
  REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP,
} from '../../src/backend/cloud/reeditpro-gcp-production-resource-map'
import {
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  getGcpProductionServiceAccountEmail,
} from '../config/gcp-production-config'
import {
  canonicalCloudWorkerDispatchAttemptPlanSchema,
  canonicalCloudWorkerDispatchHandoffManifestSchema,
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  getProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  getProductionToolProfile,
  isProductionToolId,
} from '../tool-registry'
import {
  canonicalModelArtifactValueSha256,
  verifyCanonicalModelArtifact,
  withVerifiedCanonicalModelArtifactSource,
} from './canonical-model-artifact-repository'
import {
  CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION,
  CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMPTION_VERSION,
  CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_HANDOFF_LEASE_VERSION,
  CANONICAL_MODEL_ARTIFACT_GPU_BUNDLE_VERSION,
  MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS,
  MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES,
  type CanonicalModelArtifactCloudRunGpuConsumerInput,
  type CanonicalModelArtifactCloudRunGpuConsumerPort,
  type CanonicalModelArtifactCloudRunGpuConsumptionReceipt,
  type CanonicalModelArtifactCloudRunGpuHandoffLease,
  type CanonicalModelArtifactCloudRunGpuSource,
  type CanonicalModelArtifactGpuBundle,
  type CanonicalModelArtifactGpuBundleArtifact,
  type CanonicalModelArtifactGpuBundleRequirement,
} from './canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalModelArtifactFormat,
  CanonicalModelArtifactManifest,
  CanonicalModelArtifactRepositoryPort,
  CanonicalModelArtifactVerificationReceipt,
} from './canonical-model-artifact-types'

interface CanonicalModelArtifactCloudRunGpuLeaseState {
  readonly repository: CanonicalModelArtifactRepositoryPort
  readonly bundle: CanonicalModelArtifactGpuBundle
  readonly now: () => Date
  consumed: boolean
}

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const ARTIFACT_RECORD_PATTERN = /^model-artifact-[a-f0-9]{64}$/u
const MINIMUM_LEASE_DURATION_MS = 1
const MAXIMUM_LEASE_DURATION_MS = 15 * 60 * 1_000
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1_000

const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))
const digestSchema = z.string().regex(DIGEST_PATTERN)
const timestampSchema = z.string().datetime({ offset: true })
const artifactFormatSchema = z.enum([
  'onnx',
  'safetensors',
  'pytorch_checkpoint',
  'torchscript',
  'gguf',
  'tokenizer',
  'configuration',
  'reviewed_binary',
])
const locatorSchema = z.object({
  locatorVersion: z.literal('canonical-model-artifact-locator-v1'),
  artifactRecordId: z.string().regex(ARTIFACT_RECORD_PATTERN),
  artifactId: safeIdSchema,
  revision: safeIdSchema,
  contentSha256: digestSchema,
  manifestDigestSha256: digestSchema,
}).strict()

const requirementSchema = z.object({
  canonicalOrder: z.number().int().nonnegative()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS - 1),
  slotId: safeIdSchema,
  locator: locatorSchema,
  expectedArtifactId: safeIdSchema,
  expectedRevision: safeIdSchema,
  expectedArtifactFormat: artifactFormatSchema,
  expectedArtifactRole: safeIdSchema,
  expectedModelFamily: safeIdSchema,
  expectedByteLength: z.number().int().positive()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES),
  expectedContentSha256: digestSchema,
  required: z.literal(true),
}).strict()

const bundleArtifactSchema = z.object({
  canonicalOrder: z.number().int().nonnegative()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS - 1),
  slotId: safeIdSchema,
  locator: locatorSchema,
  descriptorDigestSha256: digestSchema,
  objectIdentityDigestSha256: digestSchema,
  artifactId: safeIdSchema,
  revision: safeIdSchema,
  artifactFormat: artifactFormatSchema,
  artifactRole: safeIdSchema,
  modelFamily: safeIdSchema,
  byteLength: z.number().int().positive()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES),
  contentSha256: digestSchema,
  repositoryAdmission: z.enum([
    'controlled_internal_test',
    'reviewed_repository_candidate',
  ]),
  sourceObservationDigestSha256: digestSchema,
  reviewEvidenceDigestSha256: digestSchema,
  securityReviewDigestSha256: digestSchema,
  licensePolicyDigestSha256: digestSchema,
  commercialUseStatus: z.enum([
    'allowed',
    'blocked',
    'unknown',
    'needs_review',
  ]),
  reviewStatus: z.enum([
    'not_reviewed',
    'needs_review',
    'approved',
    'blocked',
    'evaluation_only',
  ]),
  paidProductionUseApproved: z.boolean(),
  consumerScopeVerified: z.literal(true),
  executionClass: z.literal('gpu_required'),
  requiredExecutionTarget: z.literal('google_cloud_run_gpu'),
  accelerator: z.literal('cuda'),
  cpuFallbackAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  fullRepositoryChecksumVerified: z.literal(true),
  required: z.literal(true),
  artifactBindingDigestSha256: digestSchema,
}).strict()

const bundleBoundarySchema = z.object({
  exactApprovedPackageAttemptBound: z.literal(true),
  cloudTaskBodyContainsModelArtifactData: z.literal(false),
  cloudRunEnvironmentContainsModelArtifactData: z.literal(false),
  callerBytesAccepted: z.literal(false),
  callerPathAccepted: z.literal(false),
  callerUrlAccepted: z.literal(false),
  credentialsIncluded: z.literal(false),
  canonicalOperationArtifactSetVerified: z.literal(false),
  privateGcsDistributionVerified: z.literal(false),
  cloudRunReadOnlyMountVerified: z.literal(false),
  workerServiceIdentityVerified: z.literal(false),
  cloudRunJobDeploymentVerified: z.literal(false),
  deployedGpuCapacityVerified: z.literal(false),
  remoteMutationAuthorized: z.literal(false),
  cloudDispatchAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueMutationAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const canonicalModelArtifactGpuBundleSchema = z.object({
  bundleVersion: z.literal(CANONICAL_MODEL_ARTIFACT_GPU_BUNDLE_VERSION),
  bundleClass: z.literal(
    'verified_server_resolved_model_artifact_gpu_bundle',
  ),
  source: z.literal(
    'canonical_model_artifact_repository_and_cloud_dispatch_attempt',
  ),
  bundleId: safeIdSchema,
  identity: z.object({
    dispatchIntentId: safeIdSchema,
    dispatchBindingHash: digestSchema,
    attemptPlanHash: digestSchema,
    handoffManifestHash: digestSchema,
    manifestEntryHash: digestSchema,
    queueDefinitionHash: digestSchema,
    regionAuthorityHash: digestSchema,
    jobId: safeIdSchema,
    deliveryAttempt: z.number().int().positive().max(10),
    approvedToolId: safeIdSchema,
    approvedToolOperationId: safeIdSchema,
    runtimeRegion: z.enum(['us-east1', 'europe-west1']),
    targetHash: digestSchema,
    cloudRunJobResourceName: z.string().trim().min(1).max(512),
    cloudRunJobRequestSha256: digestSchema,
    workerServiceAccountEmail: z.string().email(),
  }).strict(),
  consumerScope: safeIdSchema,
  requirementsDigestSha256: digestSchema,
  artifacts: z.array(bundleArtifactSchema)
    .min(1)
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS),
  summary: z.object({
    artifactCount: z.number().int().positive()
      .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS),
    totalByteLength: z.number().int().positive()
      .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES),
    allArtifactsRequired: z.literal(true),
    allArtifactIdentitiesUnique: z.literal(true),
    allArtifactSlotsUnique: z.literal(true),
    allArtifactsRepositoryVerified: z.literal(true),
    allArtifactsGpuOnly: z.literal(true),
    allArtifactsCudaRequired: z.literal(true),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  execution: z.object({
    workerType: z.literal('gpu_ai_worker'),
    executionTarget: z.literal('google_cloud_run_gpu'),
    cloudRunAccelerator: z.literal('nvidia_l4'),
    modelAccelerator: z.literal('cuda'),
    gpuCount: z.literal(1),
    noGpuZonalRedundancy: z.literal(true),
    taskCount: z.literal(1),
    parallelism: z.literal(1),
    cloudRunInternalMaxRetries: z.literal(0),
    packageQueueOwnsApprovedAttempts: z.literal(true),
    workerLoadsAuthorityByOpaqueDispatchIntent: z.literal(true),
  }).strict(),
  blockers: z.array(safeIdSchema).min(1).max(32)
    .refine((values) => new Set(values).size === values.length)
    .refine((values) => values.every(
      (value, index) => index === 0 || values[index - 1]! < value,
    )),
  boundaries: bundleBoundarySchema,
  bundleDigestSha256: digestSchema,
}).strict().superRefine((bundle, context) => {
  if (
    bundle.artifacts.length !== bundle.summary.artifactCount
    || bundle.artifacts.some(
      (artifact, index) => artifact.canonicalOrder !== index,
    )
    || new Set(bundle.artifacts.map((artifact) => artifact.slotId)).size
      !== bundle.artifacts.length
    || new Set(bundle.artifacts.map(
      (artifact) => artifact.locator.artifactRecordId,
    )).size !== bundle.artifacts.length
    || bundle.artifacts.reduce(
      (total, artifact) => total + artifact.byteLength,
      0,
    ) !== bundle.summary.totalByteLength
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'GPU model-artifact bundle summary is inconsistent.',
    })
  }
})

const handoffLeaseSchema = z.object({
  leaseVersion: z.literal(
    CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_HANDOFF_LEASE_VERSION,
  ),
  leaseClass: z.literal(
    'process_bound_single_use_verified_gpu_bundle_handoff',
  ),
  leaseIdDigestSha256: digestSchema,
  bundleDigestSha256: digestSchema,
  dispatchIntentId: safeIdSchema,
  dispatchBindingHash: digestSchema,
  attemptPlanHash: digestSchema,
  consumerScope: safeIdSchema,
  artifactCount: z.number().int().positive()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS),
  totalByteLength: z.number().int().positive()
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES),
  issuedAt: timestampSchema,
  expiresAt: timestampSchema,
  singleUse: z.literal(true),
  readOnly: z.literal(true),
  executionTarget: z.literal('google_cloud_run_gpu'),
  accelerator: z.literal('cuda'),
  cloudRunAccelerator: z.literal('nvidia_l4'),
  hostPathsIncluded: z.literal(false),
  mountPathsIncluded: z.literal(false),
  bytesIncluded: z.literal(false),
  urlsIncluded: z.literal(false),
  credentialsIncluded: z.literal(false),
  cpuFallbackAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  networkFetchAllowed: z.literal(false),
  remoteDistributionAuthorized: z.literal(false),
  modelInferenceAuthority: z.literal(false),
  productionReady: z.literal(false),
  leaseDigestSha256: digestSchema,
}).strict()

const leaseStates =
  new WeakMap<object, CanonicalModelArtifactCloudRunGpuLeaseState>()
const consumerCapabilities = new WeakSet<object>()

export async function createCanonicalModelArtifactGpuBundle(input: {
  readonly repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  readonly cloudDispatchManifest:
    CanonicalCloudWorkerDispatchHandoffManifest
  readonly cloudDispatchAttemptPlan:
    CanonicalCloudWorkerDispatchAttemptPlan
  readonly consumerScope: string
  readonly requirements:
    readonly CanonicalModelArtifactGpuBundleRequirement[]
}): Promise<CanonicalModelArtifactGpuBundle> {
  const consumerScope = parseSafeId(
    input.consumerScope,
    'model_artifact_gpu_bundle_consumer_scope_invalid',
  )
  const requirements = parseRequirements(input.requirements)
  const dispatch = assertExactGpuDispatchAttempt({
    manifest: input.cloudDispatchManifest,
    attemptPlan: input.cloudDispatchAttemptPlan,
  })
  const requiredConsumerScope =
    `${dispatch.approvedToolId}.private-inference`
  if (consumerScope !== requiredConsumerScope) {
    throw blocked(
      'model_artifact_gpu_consumer_scope_does_not_match_approved_tool',
    )
  }
  const artifacts: CanonicalModelArtifactGpuBundleArtifact[] = []
  for (const requirement of requirements) {
    const verified = await verifyCanonicalModelArtifact({
      repository: input.repository,
      locator: requirement.locator,
    })
    artifacts.push(createBundleArtifact({
      requirement,
      consumerScope,
      verified,
    }))
  }
  assertUniqueArtifacts(artifacts)
  const totalByteLength = totalBundleBytes(artifacts)
  const requirementsDigestSha256 = sha256AuthorityValue(
    artifacts.map(requirementProjection),
  )
  const identity = {
    dispatchIntentId: dispatch.attemptPlan.dispatchIntentId,
    dispatchBindingHash: dispatch.attemptPlan.dispatchBindingHash,
    attemptPlanHash: dispatch.attemptPlan.attemptPlanHash,
    handoffManifestHash: dispatch.attemptPlan.handoffManifestHash,
    manifestEntryHash: dispatch.attemptPlan.manifestEntryHash,
    queueDefinitionHash: dispatch.attemptPlan.queueDefinitionHash,
    regionAuthorityHash: dispatch.attemptPlan.regionAuthorityHash,
    jobId: dispatch.attemptPlan.jobId,
    deliveryAttempt: dispatch.attemptPlan.deliveryAttempt,
    approvedToolId: dispatch.approvedToolId,
    approvedToolOperationId: dispatch.approvedToolOperationId,
    runtimeRegion: dispatch.attemptPlan.runtimeRegion,
    targetHash: dispatch.entry.target.targetHash,
    cloudRunJobResourceName:
      dispatch.attemptPlan.cloudRunJob!.jobResourceName,
    cloudRunJobRequestSha256:
      sha256AuthorityValue(dispatch.attemptPlan.cloudRunJob),
    workerServiceAccountEmail:
      dispatch.entry.target.workerServiceAccountEmail,
  }
  const bundleId = bundleIdFor({
    identity,
    consumerScope,
    requirementsDigestSha256,
  })
  const payload = {
    bundleVersion: CANONICAL_MODEL_ARTIFACT_GPU_BUNDLE_VERSION,
    bundleClass:
      'verified_server_resolved_model_artifact_gpu_bundle' as const,
    source:
      'canonical_model_artifact_repository_and_cloud_dispatch_attempt' as const,
    bundleId,
    identity,
    consumerScope,
    requirementsDigestSha256,
    artifacts,
    summary: {
      artifactCount: artifacts.length,
      totalByteLength,
      allArtifactsRequired: true as const,
      allArtifactIdentitiesUnique: true as const,
      allArtifactSlotsUnique: true as const,
      allArtifactsRepositoryVerified: true as const,
      allArtifactsGpuOnly: true as const,
      allArtifactsCudaRequired: true as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    execution: {
      workerType: 'gpu_ai_worker' as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      cloudRunAccelerator: 'nvidia_l4' as const,
      modelAccelerator: 'cuda' as const,
      gpuCount: 1 as const,
      noGpuZonalRedundancy: true as const,
      taskCount: 1 as const,
      parallelism: 1 as const,
      cloudRunInternalMaxRetries: 0 as const,
      packageQueueOwnsApprovedAttempts: true as const,
      workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    },
    blockers: bundleBlockers(artifacts),
    boundaries: bundleBoundaries(),
  }
  return deepFreeze(parseGpuBundle({
    ...payload,
    bundleDigestSha256: sha256AuthorityValue(payload),
  }))
}

export async function assertCanonicalModelArtifactGpuBundle(input: {
  readonly repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  readonly cloudDispatchManifest:
    CanonicalCloudWorkerDispatchHandoffManifest
  readonly cloudDispatchAttemptPlan:
    CanonicalCloudWorkerDispatchAttemptPlan
  readonly value: unknown
}): Promise<CanonicalModelArtifactGpuBundle> {
  const bundle = parseGpuBundle(input.value)
  const { bundleDigestSha256, ...payload } = bundle
  if (bundleDigestSha256 !== sha256AuthorityValue(payload)) {
    throw blocked('model_artifact_gpu_bundle_digest_mismatch')
  }
  const dispatch = assertExactGpuDispatchAttempt({
    manifest: input.cloudDispatchManifest,
    attemptPlan: input.cloudDispatchAttemptPlan,
  })
  if (
    bundle.consumerScope
      !== `${dispatch.approvedToolId}.private-inference`
  ) {
    throw blocked(
      'model_artifact_gpu_consumer_scope_does_not_match_approved_tool',
    )
  }
  if (
    stableAuthorityStringify(bundle.identity)
      !== stableAuthorityStringify({
        dispatchIntentId: dispatch.attemptPlan.dispatchIntentId,
        dispatchBindingHash: dispatch.attemptPlan.dispatchBindingHash,
        attemptPlanHash: dispatch.attemptPlan.attemptPlanHash,
        handoffManifestHash: dispatch.attemptPlan.handoffManifestHash,
        manifestEntryHash: dispatch.attemptPlan.manifestEntryHash,
        queueDefinitionHash: dispatch.attemptPlan.queueDefinitionHash,
        regionAuthorityHash: dispatch.attemptPlan.regionAuthorityHash,
        jobId: dispatch.attemptPlan.jobId,
        deliveryAttempt: dispatch.attemptPlan.deliveryAttempt,
        approvedToolId: dispatch.approvedToolId,
        approvedToolOperationId: dispatch.approvedToolOperationId,
        runtimeRegion: dispatch.attemptPlan.runtimeRegion,
        targetHash: dispatch.entry.target.targetHash,
        cloudRunJobResourceName:
          dispatch.attemptPlan.cloudRunJob!.jobResourceName,
        cloudRunJobRequestSha256:
          sha256AuthorityValue(dispatch.attemptPlan.cloudRunJob),
        workerServiceAccountEmail:
          dispatch.entry.target.workerServiceAccountEmail,
      })
  ) {
    throw blocked('model_artifact_gpu_bundle_dispatch_mismatch')
  }
  await verifyBundleRepositoryState({
    repository: input.repository,
    bundle,
  })
  assertBundleDerivedFields(bundle)
  return deepFreeze(bundle)
}

export async function createCanonicalModelArtifactCloudRunGpuHandoffLease(
  input: {
    readonly repository:
      | CanonicalModelArtifactRepositoryPort
      | null
      | undefined
    readonly cloudDispatchManifest:
      CanonicalCloudWorkerDispatchHandoffManifest
    readonly cloudDispatchAttemptPlan:
      CanonicalCloudWorkerDispatchAttemptPlan
    readonly bundle: unknown
    readonly leaseId: string
    readonly leaseDurationMs?: number
    readonly now?: () => Date
  },
): Promise<CanonicalModelArtifactCloudRunGpuHandoffLease> {
  const leaseId = parseSafeId(
    input.leaseId,
    'model_artifact_gpu_handoff_lease_id_invalid',
  )
  const leaseDurationMs =
    input.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS
  if (
    !Number.isSafeInteger(leaseDurationMs)
    || leaseDurationMs < MINIMUM_LEASE_DURATION_MS
    || leaseDurationMs > MAXIMUM_LEASE_DURATION_MS
  ) {
    throw invalid('model_artifact_gpu_handoff_lease_duration_invalid')
  }
  const now = input.now ?? (() => new Date())
  if (typeof now !== 'function') {
    throw invalid('model_artifact_gpu_handoff_clock_invalid')
  }
  const bundle = await assertCanonicalModelArtifactGpuBundle({
    repository: input.repository,
    cloudDispatchManifest: input.cloudDispatchManifest,
    cloudDispatchAttemptPlan: input.cloudDispatchAttemptPlan,
    value: input.bundle,
  })
  const issuedAtDate = exactNow(now)
  const expiresAtDate = new Date(
    issuedAtDate.getTime() + leaseDurationMs,
  )
  const draft = {
    leaseVersion:
      CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_HANDOFF_LEASE_VERSION,
    leaseClass:
      'process_bound_single_use_verified_gpu_bundle_handoff' as const,
    leaseIdDigestSha256:
      canonicalModelArtifactValueSha256(leaseId),
    bundleDigestSha256: bundle.bundleDigestSha256,
    dispatchIntentId: bundle.identity.dispatchIntentId,
    dispatchBindingHash: bundle.identity.dispatchBindingHash,
    attemptPlanHash: bundle.identity.attemptPlanHash,
    consumerScope: bundle.consumerScope,
    artifactCount: bundle.summary.artifactCount,
    totalByteLength: bundle.summary.totalByteLength,
    issuedAt: issuedAtDate.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    singleUse: true as const,
    readOnly: true as const,
    executionTarget: 'google_cloud_run_gpu' as const,
    accelerator: 'cuda' as const,
    cloudRunAccelerator: 'nvidia_l4' as const,
    hostPathsIncluded: false as const,
    mountPathsIncluded: false as const,
    bytesIncluded: false as const,
    urlsIncluded: false as const,
    credentialsIncluded: false as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    remoteDistributionAuthorized: false as const,
    modelInferenceAuthority: false as const,
    productionReady: false as const,
  }
  const lease = deepFreeze(parseHandoffLease({
    ...draft,
    leaseDigestSha256:
      canonicalModelArtifactValueSha256(draft),
  }))
  leaseStates.set(lease, {
    repository: input.repository!,
    bundle,
    now,
    consumed: false,
  })
  return lease
}

export function createCanonicalModelArtifactCloudRunGpuConsumer(
  input: {
    readonly consumerScope: string
    readonly inspectVerifiedReadOnlyGpuBundle: (
      input: CanonicalModelArtifactCloudRunGpuConsumerInput,
    ) => Promise<void>
  },
): CanonicalModelArtifactCloudRunGpuConsumerPort {
  const consumerScope = parseSafeId(
    input.consumerScope,
    'model_artifact_gpu_consumer_scope_invalid',
  )
  if (typeof input.inspectVerifiedReadOnlyGpuBundle !== 'function') {
    throw invalid('model_artifact_gpu_consumer_function_required')
  }
  const consumer =
    Object.freeze<CanonicalModelArtifactCloudRunGpuConsumerPort>({
      consumerVersion:
        CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION,
      consumerClass:
        'process_bound_private_gpu_bundle_handoff_consumer',
      consumerScope,
      executionTarget: 'google_cloud_run_gpu',
      cloudRunAccelerator: 'nvidia_l4',
      callerPathAccepted: false,
      callerUrlAccepted: false,
      callerBytesAccepted: false,
      remoteDistributionAuthorized: false,
      modelExecutionAuthorized: false,
      productionReady: false,
      inspectVerifiedReadOnlyGpuBundle:
        input.inspectVerifiedReadOnlyGpuBundle.bind(undefined),
    })
  consumerCapabilities.add(consumer)
  return consumer
}

export async function consumeCanonicalModelArtifactCloudRunGpuHandoffLease(
  input: {
    readonly lease:
      | CanonicalModelArtifactCloudRunGpuHandoffLease
      | null
      | undefined
    readonly consumer:
      | CanonicalModelArtifactCloudRunGpuConsumerPort
      | null
      | undefined
  },
): Promise<CanonicalModelArtifactCloudRunGpuConsumptionReceipt> {
  const state = assertHandoffLease(input.lease)
  const lease = input.lease!
  const consumer = assertGpuConsumer(input.consumer)
  if (state.consumed) {
    throw blocked('model_artifact_gpu_handoff_lease_already_consumed')
  }
  const now = exactNow(state.now)
  if (
    now.getTime() < Date.parse(lease.issuedAt)
    || now.getTime() >= Date.parse(lease.expiresAt)
  ) {
    throw blocked('model_artifact_gpu_handoff_lease_expired')
  }
  if (
    consumer.consumerScope !== lease.consumerScope
    || consumer.executionTarget !== lease.executionTarget
    || consumer.cloudRunAccelerator !== lease.cloudRunAccelerator
  ) {
    throw blocked('model_artifact_gpu_handoff_consumer_mismatch')
  }
  state.consumed = true
  await verifyBundleRepositoryState({
    repository: state.repository,
    bundle: state.bundle,
  })
  const sources: CanonicalModelArtifactCloudRunGpuSource[] = []
  let consumerInvocationCount = 0
  await withVerifiedBundleSources({
    repository: state.repository,
    bundle: state.bundle,
    index: 0,
    sources,
    operation: async () => {
      consumerInvocationCount += 1
      const consumerInput =
        deepFreeze<CanonicalModelArtifactCloudRunGpuConsumerInput>({
          dispatchIntentId: state.bundle.identity.dispatchIntentId,
          dispatchBindingHash:
            state.bundle.identity.dispatchBindingHash,
          attemptPlanHash: state.bundle.identity.attemptPlanHash,
          bundleDigestSha256: state.bundle.bundleDigestSha256,
          consumerScope: state.bundle.consumerScope,
          executionTarget: 'google_cloud_run_gpu',
          cloudRunAccelerator: 'nvidia_l4',
          artifactSources: [...sources],
          readOnlyMountRequired: true,
          serverOwnedRemoteDistributionStillRequired: true,
          callerPathsAccepted: false,
          callerUrlsAccepted: false,
          callerBytesAccepted: false,
          runtimeDownloadAllowed: false,
          networkFetchAllowed: false,
          modelExecutionAuthorized: false,
        })
      await consumer.inspectVerifiedReadOnlyGpuBundle(consumerInput)
    },
  })
  if (consumerInvocationCount !== 1) {
    throw blocked(
      'model_artifact_gpu_handoff_consumer_invocation_inconsistent',
    )
  }
  const consumedAt = exactNow(state.now).toISOString()
  const draft = {
    consumptionVersion:
      CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMPTION_VERSION,
    consumptionClass:
      'verified_single_use_gpu_bundle_handoff_consumption' as const,
    leaseDigestSha256: lease.leaseDigestSha256,
    bundleDigestSha256: lease.bundleDigestSha256,
    dispatchIntentId: lease.dispatchIntentId,
    dispatchBindingHash: lease.dispatchBindingHash,
    attemptPlanHash: lease.attemptPlanHash,
    consumerScope: lease.consumerScope,
    artifactCount: lease.artifactCount,
    totalByteLength: lease.totalByteLength,
    consumedAt,
    allObjectsVerifiedBeforeConsumer: true as const,
    allObjectsVerifiedAfterConsumer: true as const,
    oneProcessBoundConsumerInvocation: true as const,
    readOnlySourcesPresented: true as const,
    hostPathsIncluded: false as const,
    mountPathsIncluded: false as const,
    bytesIncluded: false as const,
    urlsIncluded: false as const,
    credentialsIncluded: false as const,
    cloudTaskBodyChanged: false as const,
    cloudRunEnvironmentChanged: false as const,
    remoteDistributionPerformed: false as const,
    cloudRunJobExecuted: false as const,
    modelInferenceExecuted: false as const,
    providerCallMade: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  }
  return deepFreeze({
    ...draft,
    consumptionDigestSha256:
      canonicalModelArtifactValueSha256(draft),
  })
}

function assertExactGpuDispatchAttempt(input: {
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
}) {
  const manifestResult =
    canonicalCloudWorkerDispatchHandoffManifestSchema.safeParse(
      input.manifest,
    )
  const attemptResult =
    canonicalCloudWorkerDispatchAttemptPlanSchema.safeParse(
      input.attemptPlan,
    )
  if (!manifestResult.success || !attemptResult.success) {
    throw blocked('model_artifact_gpu_dispatch_contract_invalid')
  }
  const manifest = manifestResult.data
  const attemptPlan = attemptResult.data
  const rebuilt = createCanonicalCloudWorkerDispatchAttemptPlan({
    manifest,
    jobId: attemptPlan.jobId,
    deliveryAttempt: attemptPlan.deliveryAttempt,
  })
  if (
    stableAuthorityStringify(rebuilt)
      !== stableAuthorityStringify(attemptPlan)
  ) {
    throw blocked('model_artifact_gpu_dispatch_attempt_mismatch')
  }
  const entry = manifest.entries.find(
    (candidate) => candidate.jobId === attemptPlan.jobId,
  )
  if (
    !entry
    || entry.approvedToolId === null
    || entry.approvedToolOperationIds.length !== 1
    || !isProductionToolId(entry.approvedToolId)
  ) {
    throw blocked('model_artifact_gpu_dispatch_tool_operation_invalid')
  }
  const approvedToolId = entry.approvedToolId
  const approvedToolOperationId =
    entry.approvedToolOperationIds[0]!
  const toolProfile = getProductionToolProfile(approvedToolId)
  const operationSpec =
    getProfessionalToolOperationSpec(approvedToolId)
  if (
    !toolProfile
    || !operationSpec
    || toolProfile.workerType !== 'gpu_ai_worker'
    || !toolProfile.gpuRequired
    || toolProfile.cpuAllowed
    || !toolProfile.modelWeightsRequired
    || operationSpec.canonicalToolId !== approvedToolId
    || operationSpec.allowedOperationIds.length !== 1
    || operationSpec.allowedOperationIds[0]
      !== approvedToolOperationId
    || operationSpec.workerRuntime.registryWorkerType
      !== 'gpu_ai_worker'
    || operationSpec.resourceCeilings.gpuLimit !== 1
    || !operationSpec.modelGate.modelWeightsRequired
    || !operationSpec.modelGate.exactManifestRequired
    || operationSpec.modelGate.downloadAtRuntimeAllowed !== false
    || operationSpec.modelGate.serverMountedModelOnly !== true
  ) {
    throw blocked('model_artifact_gpu_dispatch_tool_operation_invalid')
  }
  const expectedTarget = GCP_PRODUCTION_CLOUD_RUN_JOBS.find(
    (candidate) => candidate.name === 'reeditpro-gpu-ai-worker',
  )
  const expectedServiceAccountEmail = expectedTarget
    ? getGcpProductionServiceAccountEmail(
        expectedTarget.serviceAccountKey,
        REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId,
      )
    : null
  const expectedJobResourceName =
    `projects/${REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId}` +
    `/locations/${attemptPlan.runtimeRegion}` +
    '/jobs/reeditpro-gpu-ai-worker'
  if (
    !expectedTarget
    || !expectedServiceAccountEmail
    || expectedTarget.gpuType !== 'nvidia-l4'
    || expectedTarget.gpuCount !== 1
    || expectedTarget.noGpuZonalRedundancy !== true
    || entry.workerType !== 'gpu_ai_worker'
    || entry.resourceClassId !== 'gpu_l4_standard_v1'
    || entry.target.workerType !== 'gpu_ai_worker'
    || entry.target.cloudRunTargetKind !== 'job'
    || entry.target.accelerator !== 'nvidia_l4'
    || entry.target.cloudRunTargetName !== expectedTarget.name
    || entry.target.workerServiceAccountKey
      !== expectedTarget.serviceAccountKey
    || entry.target.workerServiceAccountEmail
      !== expectedServiceAccountEmail
    || entry.target.cpu !== expectedTarget.cpu
    || entry.target.memory !== expectedTarget.memory
    || entry.target.parallelism !== 1
    || entry.target.cloudRunInternalMaxRetries !== 0
    || !entry.packageQueueOwnsApprovedAttempts
    || !entry.workerLoadsAuthorityByOpaqueDispatchIntent
    || entry.taskBodyCarriesRawMediaOrSecrets
    || entry.cloudRunTaskTimeoutSeconds !== 3_600
    || entry.cloudRunTaskTimeoutLimitSeconds !== 3_600
    || attemptPlan.cloudTask === null
    || attemptPlan.cloudRunJob === null
    || attemptPlan.cloudRunJob.taskCount !== 1
    || attemptPlan.cloudRunJob.parallelism !== 1
    || attemptPlan.cloudRunJob.taskMaxRetries !== 0
    || attemptPlan.cloudRunJob.jobResourceName
      !== expectedJobResourceName
    || attemptPlan.cloudRunJob.serviceAccountEmail
      !== expectedServiceAccountEmail
    || attemptPlan.cloudRunJob.embeddedCredentialOrSignedUrl
    || attemptPlan.cloudRunJob.environmentOverrides
      .REEDITPRO_DISPATCH_INTENT_ID !== attemptPlan.dispatchIntentId
    || attemptPlan.cloudRunJob.environmentOverrides
      .REEDITPRO_DISPATCH_BINDING_HASH
        !== attemptPlan.dispatchBindingHash
  ) {
    throw blocked('model_artifact_gpu_dispatch_target_invalid')
  }
  if (
    Object.keys(attemptPlan.cloudTask.taskBody).length !== 10
    || Object.keys(
      attemptPlan.cloudRunJob.environmentOverrides,
    ).length !== 2
  ) {
    throw blocked('model_artifact_gpu_dispatch_payload_not_opaque')
  }
  return {
    manifest,
    attemptPlan,
    entry,
    approvedToolId,
    approvedToolOperationId,
  }
}

function createBundleArtifact(input: {
  requirement: CanonicalModelArtifactGpuBundleRequirement
  consumerScope: string
  verified: CanonicalModelArtifactVerificationReceipt
}): CanonicalModelArtifactGpuBundleArtifact {
  const { requirement, consumerScope, verified } = input
  const descriptor = verified.manifest.descriptor
  if (
    descriptor.artifactId !== requirement.expectedArtifactId
    || descriptor.revision !== requirement.expectedRevision
    || descriptor.artifactFormat
      !== requirement.expectedArtifactFormat
    || descriptor.artifactRole !== requirement.expectedArtifactRole
    || descriptor.modelFamily !== requirement.expectedModelFamily
    || descriptor.byteLength !== requirement.expectedByteLength
    || descriptor.contentSha256
      !== requirement.expectedContentSha256
    || verified.verifiedByteLength !== requirement.expectedByteLength
    || verified.verifiedContentSha256
      !== requirement.expectedContentSha256
    || requirement.locator.artifactId
      !== requirement.expectedArtifactId
    || requirement.locator.revision !== requirement.expectedRevision
    || requirement.locator.contentSha256
      !== requirement.expectedContentSha256
  ) {
    throw blocked('model_artifact_gpu_requirement_mismatch')
  }
  if (!descriptor.consumerScopes.includes(consumerScope)) {
    throw blocked('model_artifact_gpu_consumer_scope_not_admitted')
  }
  if (
    descriptor.executionPolicy.executionClass !== 'gpu_required'
    || descriptor.executionPolicy.requiredExecutionTarget
      !== 'google_cloud_run_gpu'
    || descriptor.executionPolicy.accelerator !== 'cuda'
    || descriptor.executionPolicy.cpuFallbackAllowed !== false
    || descriptor.executionPolicy.runtimeDownloadAllowed !== false
    || descriptor.executionPolicy.networkFetchAllowed !== false
  ) {
    throw blocked('model_artifact_gpu_execution_policy_invalid')
  }
  const draft = {
    canonicalOrder: requirement.canonicalOrder,
    slotId: requirement.slotId,
    locator: verified.locator,
    descriptorDigestSha256:
      verified.manifest.descriptorDigestSha256,
    objectIdentityDigestSha256:
      verified.objectIdentityDigestSha256,
    artifactId: descriptor.artifactId,
    revision: descriptor.revision,
    artifactFormat: descriptor.artifactFormat,
    artifactRole: descriptor.artifactRole,
    modelFamily: descriptor.modelFamily,
    byteLength: descriptor.byteLength,
    contentSha256: descriptor.contentSha256,
    repositoryAdmission: descriptor.repositoryAdmission,
    sourceObservationDigestSha256:
      descriptor.sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      descriptor.reviewEvidenceDigestSha256,
    securityReviewDigestSha256:
      descriptor.securityReviewDigestSha256,
    licensePolicyDigestSha256:
      canonicalModelArtifactValueSha256(descriptor.licensePolicy),
    commercialUseStatus:
      descriptor.licensePolicy.commercialUseStatus,
    reviewStatus: descriptor.licensePolicy.reviewStatus,
    paidProductionUseApproved:
      descriptor.licensePolicy.paidProductionUseApproved,
    consumerScopeVerified: true as const,
    executionClass: 'gpu_required' as const,
    requiredExecutionTarget: 'google_cloud_run_gpu' as const,
    accelerator: 'cuda' as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    fullRepositoryChecksumVerified: true as const,
    required: true as const,
  }
  return bundleArtifactSchema.parse({
    ...draft,
    artifactBindingDigestSha256:
      canonicalModelArtifactValueSha256(draft),
  })
}

async function verifyBundleRepositoryState(input: {
  repository:
    | CanonicalModelArtifactRepositoryPort
    | null
    | undefined
  bundle: CanonicalModelArtifactGpuBundle
}): Promise<void> {
  for (const artifact of input.bundle.artifacts) {
    const verified = await verifyCanonicalModelArtifact({
      repository: input.repository,
      locator: artifact.locator,
    })
    const expected = createBundleArtifact({
      requirement: requirementProjection(artifact),
      consumerScope: input.bundle.consumerScope,
      verified,
    })
    if (
      stableAuthorityStringify(expected)
        !== stableAuthorityStringify(artifact)
    ) {
      throw blocked('model_artifact_gpu_bundle_repository_drift')
    }
  }
}

function assertBundleDerivedFields(
  bundle: CanonicalModelArtifactGpuBundle,
): void {
  assertUniqueArtifacts(bundle.artifacts)
  const requirementsDigestSha256 = sha256AuthorityValue(
    bundle.artifacts.map(requirementProjection),
  )
  if (
    bundle.requirementsDigestSha256 !== requirementsDigestSha256
    || bundle.summary.totalByteLength
      !== totalBundleBytes(bundle.artifacts)
    || bundle.bundleId !== bundleIdFor({
      identity: bundle.identity,
      consumerScope: bundle.consumerScope,
      requirementsDigestSha256,
    })
    || stableAuthorityStringify(bundle.blockers)
      !== stableAuthorityStringify(
        bundleBlockers(bundle.artifacts),
      )
    || stableAuthorityStringify(bundle.boundaries)
      !== stableAuthorityStringify(bundleBoundaries())
  ) {
    throw blocked('model_artifact_gpu_bundle_derived_fields_invalid')
  }
  for (const artifact of bundle.artifacts) {
    const { artifactBindingDigestSha256, ...draft } = artifact
    if (
      artifactBindingDigestSha256
        !== canonicalModelArtifactValueSha256(draft)
    ) {
      throw blocked('model_artifact_gpu_artifact_binding_invalid')
    }
  }
}

async function withVerifiedBundleSources(input: {
  repository: CanonicalModelArtifactRepositoryPort
  bundle: CanonicalModelArtifactGpuBundle
  index: number
  sources: CanonicalModelArtifactCloudRunGpuSource[]
  operation: () => Promise<void>
}): Promise<void> {
  if (input.index === input.bundle.artifacts.length) {
    await input.operation()
    return
  }
  const artifact = input.bundle.artifacts[input.index]!
  await withVerifiedCanonicalModelArtifactSource({
    repository: input.repository,
    locator: artifact.locator,
    operation: async ({ absolutePath, manifest, before }) => {
      assertSourceMatchesBundleArtifact({
        artifact,
        manifest,
        before,
      })
      input.sources.push({
        canonicalOrder: artifact.canonicalOrder,
        slotId: artifact.slotId,
        sourceAbsolutePath: absolutePath,
        serverDerivedReadOnlyMountPath:
          serverDerivedReadOnlyMountPath(artifact),
        artifactRecordId: artifact.locator.artifactRecordId,
        artifactId: artifact.artifactId,
        revision: artifact.revision,
        artifactFormat: artifact.artifactFormat,
        artifactRole: artifact.artifactRole,
        modelFamily: artifact.modelFamily,
        expectedByteLength: artifact.byteLength,
        expectedContentSha256: artifact.contentSha256,
        expectedManifestDigestSha256:
          artifact.locator.manifestDigestSha256,
        consumerScope: input.bundle.consumerScope,
        executionTarget: 'google_cloud_run_gpu',
        accelerator: 'cuda',
        readOnly: true,
        cpuFallbackAllowed: false,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
      })
      try {
        await withVerifiedBundleSources({
          ...input,
          index: input.index + 1,
        })
      } finally {
        input.sources.pop()
      }
    },
  })
}

function assertSourceMatchesBundleArtifact(input: {
  artifact: CanonicalModelArtifactGpuBundleArtifact
  manifest: CanonicalModelArtifactManifest
  before: CanonicalModelArtifactVerificationReceipt
}): void {
  if (
    input.manifest.manifestDigestSha256
      !== input.artifact.locator.manifestDigestSha256
    || input.manifest.descriptorDigestSha256
      !== input.artifact.descriptorDigestSha256
    || input.before.objectIdentityDigestSha256
      !== input.artifact.objectIdentityDigestSha256
    || input.before.verifiedByteLength !== input.artifact.byteLength
    || input.before.verifiedContentSha256
      !== input.artifact.contentSha256
  ) {
    throw blocked('model_artifact_gpu_handoff_source_mismatch')
  }
}

function parseRequirements(
  value: readonly CanonicalModelArtifactGpuBundleRequirement[],
): CanonicalModelArtifactGpuBundleRequirement[] {
  const parsed = z.array(requirementSchema)
    .min(1)
    .max(MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_ARTIFACTS)
    .safeParse(value)
  if (!parsed.success) {
    throw invalid('model_artifact_gpu_requirements_invalid')
  }
  if (
    parsed.data.some(
      (requirement, index) => requirement.canonicalOrder !== index,
    )
    || new Set(parsed.data.map(
      (requirement) => requirement.slotId,
    )).size !== parsed.data.length
    || new Set(parsed.data.map(
      (requirement) => requirement.locator.artifactRecordId,
    )).size !== parsed.data.length
  ) {
    throw invalid('model_artifact_gpu_requirement_order_or_identity_invalid')
  }
  return parsed.data
}

function parseGpuBundle(value: unknown): CanonicalModelArtifactGpuBundle {
  const parsed = canonicalModelArtifactGpuBundleSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('model_artifact_gpu_bundle_schema_invalid')
  }
  return parsed.data
}

function parseHandoffLease(
  value: unknown,
): CanonicalModelArtifactCloudRunGpuHandoffLease {
  const parsed = handoffLeaseSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('model_artifact_gpu_handoff_lease_schema_invalid')
  }
  return parsed.data
}

function assertHandoffLease(
  lease:
    | CanonicalModelArtifactCloudRunGpuHandoffLease
    | null
    | undefined,
): CanonicalModelArtifactCloudRunGpuLeaseState {
  if (!lease || !leaseStates.has(lease)) {
    throw blocked('model_artifact_gpu_handoff_lease_capability_invalid')
  }
  const parsed = parseHandoffLease(lease)
  const { leaseDigestSha256, ...draft } = parsed
  if (
    leaseDigestSha256
      !== canonicalModelArtifactValueSha256(draft)
  ) {
    throw blocked('model_artifact_gpu_handoff_lease_digest_invalid')
  }
  return leaseStates.get(lease)!
}

function assertGpuConsumer(
  consumer:
    | CanonicalModelArtifactCloudRunGpuConsumerPort
    | null
    | undefined,
): CanonicalModelArtifactCloudRunGpuConsumerPort {
  if (
    !consumer
    || !consumerCapabilities.has(consumer)
    || consumer.consumerVersion
      !== CANONICAL_MODEL_ARTIFACT_CLOUD_RUN_GPU_CONSUMER_VERSION
    || consumer.consumerClass
      !== 'process_bound_private_gpu_bundle_handoff_consumer'
    || !SAFE_ID_PATTERN.test(consumer.consumerScope)
    || consumer.executionTarget !== 'google_cloud_run_gpu'
    || consumer.cloudRunAccelerator !== 'nvidia_l4'
    || consumer.callerPathAccepted !== false
    || consumer.callerUrlAccepted !== false
    || consumer.callerBytesAccepted !== false
    || consumer.remoteDistributionAuthorized !== false
    || consumer.modelExecutionAuthorized !== false
    || consumer.productionReady !== false
    || typeof consumer.inspectVerifiedReadOnlyGpuBundle !== 'function'
  ) {
    throw blocked('model_artifact_gpu_consumer_capability_invalid')
  }
  return consumer
}

function requirementProjection(
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

function assertUniqueArtifacts(
  artifacts: readonly CanonicalModelArtifactGpuBundleArtifact[],
): void {
  const slots = new Set<string>()
  const records = new Set<string>()
  const identities = new Set<string>()
  for (const [index, artifact] of artifacts.entries()) {
    const identity =
      `${artifact.artifactId}:${artifact.revision}:${artifact.artifactRole}`
    if (
      artifact.canonicalOrder !== index
      || slots.has(artifact.slotId)
      || records.has(artifact.locator.artifactRecordId)
      || identities.has(identity)
    ) {
      throw blocked('model_artifact_gpu_bundle_duplicate_or_order_invalid')
    }
    slots.add(artifact.slotId)
    records.add(artifact.locator.artifactRecordId)
    identities.add(identity)
  }
}

function totalBundleBytes(
  artifacts: readonly CanonicalModelArtifactGpuBundleArtifact[],
): number {
  let total = 0
  for (const artifact of artifacts) {
    total += artifact.byteLength
    if (
      !Number.isSafeInteger(total)
      || total > MAXIMUM_MODEL_ARTIFACT_GPU_BUNDLE_BYTES
    ) {
      throw blocked('model_artifact_gpu_bundle_byte_limit_exceeded')
    }
  }
  return total
}

function bundleIdFor(input: {
  identity: CanonicalModelArtifactGpuBundle['identity']
  consumerScope: string
  requirementsDigestSha256: string
}): string {
  return `model_gpu_bundle_${sha256AuthorityValue(input).slice(0, 32)}`
}

function bundleBlockers(
  artifacts: readonly CanonicalModelArtifactGpuBundleArtifact[],
): string[] {
  const blockers = [
    'cloud_run_gpu_job_deployment_not_verified',
    'cloud_run_read_only_model_mount_not_verified',
    'canonical_operation_model_artifact_set_not_verified',
    'deployed_gpu_capacity_not_verified',
    'distributed_model_artifact_repository_not_implemented',
    'private_generation_bound_model_artifact_distribution_not_verified',
    'worker_service_identity_and_iam_not_verified',
  ]
  if (artifacts.some(
    (artifact) => !artifact.paidProductionUseApproved,
  )) {
    blockers.push(
      'model_artifact_paid_production_license_not_approved',
    )
  }
  if (artifacts.some(
    (artifact) =>
      artifact.repositoryAdmission !== 'reviewed_repository_candidate',
  )) {
    blockers.push(
      'model_artifact_repository_admission_not_production_reviewed',
    )
  }
  return Array.from(new Set(blockers)).sort()
}

function bundleBoundaries():
CanonicalModelArtifactGpuBundle['boundaries'] {
  return {
    exactApprovedPackageAttemptBound: true,
    cloudTaskBodyContainsModelArtifactData: false,
    cloudRunEnvironmentContainsModelArtifactData: false,
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
    credentialsIncluded: false,
    canonicalOperationArtifactSetVerified: false,
    privateGcsDistributionVerified: false,
    cloudRunReadOnlyMountVerified: false,
    workerServiceIdentityVerified: false,
    cloudRunJobDeploymentVerified: false,
    deployedGpuCapacityVerified: false,
    remoteMutationAuthorized: false,
    cloudDispatchAuthorized: false,
    modelInferenceAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationAuthority: false,
    workGraphAuthority: false,
    queueMutationAuthority: false,
    assetManifestAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  }
}

function serverDerivedReadOnlyMountPath(
  artifact: CanonicalModelArtifactGpuBundleArtifact,
): string {
  const extension: Record<CanonicalModelArtifactFormat, string> = {
    onnx: 'onnx',
    safetensors: 'safetensors',
    pytorch_checkpoint: 'pt',
    torchscript: 'pt',
    gguf: 'gguf',
    tokenizer: 'tokenizer',
    configuration: 'config',
    reviewed_binary: 'bin',
  }
  return `/opt/reeditpro/model-artifacts/${artifact.slotId}` +
    `/artifact.${extension[artifact.artifactFormat]}`
}

function parseSafeId(value: string, reason: string): string {
  const parsed = safeIdSchema.safeParse(value)
  if (!parsed.success) throw invalid(reason)
  return parsed.data
}

function exactNow(now: () => Date): Date {
  const value = now()
  if (
    !(value instanceof Date)
    || !Number.isFinite(value.getTime())
  ) {
    throw blocked('model_artifact_gpu_handoff_clock_invalid')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(nested)
    }
  }
  return value
}

function invalid(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical GPU model-artifact handoff input is invalid.',
    400,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical GPU model-artifact handoff is unavailable or unsafe.',
    503,
    { reason, productionReady: false },
  )
}
