import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  canonicalModelArtifactValueSha256,
  verifyCanonicalModelArtifact,
  withVerifiedCanonicalModelArtifactSource,
} from './canonical-model-artifact-repository'
import {
  CANONICAL_MODEL_ARTIFACT_MOUNT_CONSUMPTION_VERSION,
  CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION,
  CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_LEASE_VERSION,
  type CanonicalModelArtifactLocator,
  type CanonicalModelArtifactMountConsumptionReceipt,
  type CanonicalModelArtifactReadOnlyMountConsumerPort,
  type CanonicalModelArtifactReadOnlyMountInput,
  type CanonicalModelArtifactReadOnlyMountLease,
  type CanonicalModelArtifactRepositoryPort,
} from './canonical-model-artifact-types'

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const MINIMUM_LEASE_DURATION_MS = 1
const MAXIMUM_LEASE_DURATION_MS = 15 * 60 * 1_000
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1_000

const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

interface MountLeaseState {
  readonly repository: CanonicalModelArtifactRepositoryPort
  readonly now: () => Date
  consumed: boolean
}

const leaseStates =
  new WeakMap<object, MountLeaseState>()
const consumerCapabilities =
  new WeakSet<object>()

export async function createCanonicalModelArtifactReadOnlyMountLease(
  input: {
    readonly repository:
      | CanonicalModelArtifactRepositoryPort
      | null
      | undefined
    readonly locator: CanonicalModelArtifactLocator
    readonly leaseId: string
    readonly consumerScope: string
    readonly executionTarget:
      | 'private_controlled_cpu'
      | 'google_cloud_run_gpu'
    readonly leaseDurationMs?: number
    readonly now?: () => Date
  },
): Promise<CanonicalModelArtifactReadOnlyMountLease> {
  const leaseId = parseSafeId(input.leaseId, 'model_artifact_lease_id_invalid')
  const consumerScope = parseSafeId(
    input.consumerScope,
    'model_artifact_consumer_scope_invalid',
  )
  const leaseDurationMs = input.leaseDurationMs
    ?? DEFAULT_LEASE_DURATION_MS
  if (
    !Number.isSafeInteger(leaseDurationMs)
    || leaseDurationMs < MINIMUM_LEASE_DURATION_MS
    || leaseDurationMs > MAXIMUM_LEASE_DURATION_MS
  ) {
    throw invalid('model_artifact_lease_duration_invalid')
  }
  const now = input.now ?? (() => new Date())
  if (typeof now !== 'function') {
    throw invalid('model_artifact_lease_clock_invalid')
  }
  const verified = await verifyCanonicalModelArtifact({
    repository: input.repository,
    locator: input.locator,
  })
  const descriptor = verified.manifest.descriptor
  if (!descriptor.consumerScopes.includes(consumerScope)) {
    throw blocked('model_artifact_consumer_scope_not_admitted')
  }
  if (
    descriptor.executionPolicy.requiredExecutionTarget !==
      input.executionTarget
  ) {
    throw blocked('model_artifact_execution_target_mismatch')
  }
  if (
    descriptor.executionPolicy.executionClass === 'gpu_required'
    && (
      input.executionTarget !== 'google_cloud_run_gpu'
      || descriptor.executionPolicy.accelerator !== 'cuda'
      || descriptor.executionPolicy.cpuFallbackAllowed !== false
    )
  ) {
    throw blocked('model_artifact_gpu_placement_policy_invalid')
  }
  const issuedAtDate = exactNow(now)
  const expiresAtDate = new Date(
    issuedAtDate.getTime() + leaseDurationMs,
  )
  const leaseIdDigestSha256 =
    canonicalModelArtifactValueSha256(leaseId)
  const draft = {
    leaseVersion:
      CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_LEASE_VERSION,
    leaseClass:
      'process_bound_single_use_read_only_model_artifact_lease' as const,
    leaseIdDigestSha256,
    locator: verified.locator,
    descriptorDigestSha256:
      verified.manifest.descriptorDigestSha256,
    consumerScope,
    executionTarget: input.executionTarget,
    issuedAt: issuedAtDate.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    singleUse: true as const,
    readOnly: true as const,
    hostPathIncluded: false as const,
    mountAliasIncluded: false as const,
    credentialsIncluded: false as const,
    cpuFallbackAllowed: false as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    modelInferenceAuthority: false as const,
    productionReady: false as const,
  }
  const lease = deepFreeze({
    ...draft,
    leaseDigestSha256:
      canonicalModelArtifactValueSha256(draft),
  })
  leaseStates.set(lease, {
    repository: input.repository!,
    now,
    consumed: false,
  })
  return lease
}

export function createCanonicalModelArtifactReadOnlyMountConsumer(
  input: {
    readonly consumerScope: string
    readonly executionTarget:
      | 'private_controlled_cpu'
      | 'google_cloud_run_gpu'
    readonly consumeReadOnlyModelArtifact: (
      input: CanonicalModelArtifactReadOnlyMountInput,
    ) => Promise<void>
  },
): CanonicalModelArtifactReadOnlyMountConsumerPort {
  const consumerScope = parseSafeId(
    input.consumerScope,
    'model_artifact_consumer_scope_invalid',
  )
  if (typeof input.consumeReadOnlyModelArtifact !== 'function') {
    throw invalid('model_artifact_mount_consumer_function_required')
  }
  const consumer =
    Object.freeze<CanonicalModelArtifactReadOnlyMountConsumerPort>({
      consumerVersion:
        CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION,
      consumerClass:
        'process_bound_private_read_only_model_artifact_consumer',
      consumerScope,
      executionTarget: input.executionTarget,
      callerPathAccepted: false,
      callerBytesAccepted: false,
      callerUrlAccepted: false,
      modelExecutionAuthorized: false,
      productionReady: false,
      consumeReadOnlyModelArtifact:
        input.consumeReadOnlyModelArtifact.bind(undefined),
    })
  consumerCapabilities.add(consumer)
  return consumer
}

export async function consumeCanonicalModelArtifactReadOnlyMountLease(
  input: {
    readonly lease:
      | CanonicalModelArtifactReadOnlyMountLease
      | null
      | undefined
    readonly consumer:
      | CanonicalModelArtifactReadOnlyMountConsumerPort
      | null
      | undefined
  },
): Promise<CanonicalModelArtifactMountConsumptionReceipt> {
  const state = assertLease(input.lease)
  const lease = input.lease!
  const consumer = assertConsumer(input.consumer)
  if (state.consumed) {
    throw blocked('model_artifact_mount_lease_already_consumed')
  }
  const now = exactNow(state.now)
  if (
    now.getTime() < Date.parse(lease.issuedAt)
    || now.getTime() >= Date.parse(lease.expiresAt)
  ) {
    throw blocked('model_artifact_mount_lease_expired')
  }
  if (
    consumer.consumerScope !== lease.consumerScope
    || consumer.executionTarget !== lease.executionTarget
  ) {
    throw blocked('model_artifact_mount_consumer_mismatch')
  }
  state.consumed = true

  await withVerifiedCanonicalModelArtifactSource({
    repository: state.repository,
    locator: lease.locator,
    operation: async ({ absolutePath, manifest }) => {
      if (
        manifest.descriptorDigestSha256 !==
          lease.descriptorDigestSha256
        || manifest.descriptor.executionPolicy.requiredExecutionTarget
          !== lease.executionTarget
        || !manifest.descriptor.consumerScopes.includes(
          lease.consumerScope,
        )
      ) {
        throw blocked('model_artifact_mount_lease_manifest_mismatch')
      }
      await consumer.consumeReadOnlyModelArtifact({
        sourceAbsolutePath: absolutePath,
        serverDerivedMountAlias: serverDerivedMountAlias(
          lease,
          manifest.descriptor.artifactFormat,
        ),
        artifactRecordId: lease.locator.artifactRecordId,
        artifactId: lease.locator.artifactId,
        revision: lease.locator.revision,
        artifactFormat: manifest.descriptor.artifactFormat,
        expectedByteLength: manifest.descriptor.byteLength,
        expectedContentSha256:
          manifest.descriptor.contentSha256,
        consumerScope: lease.consumerScope,
        executionTarget: lease.executionTarget,
        accelerator: manifest.descriptor.executionPolicy.accelerator,
        readOnly: true,
        cpuFallbackAllowed: false,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
      })
    },
  })
  const consumedAt = exactNow(state.now).toISOString()
  const draft = {
    consumptionVersion:
      CANONICAL_MODEL_ARTIFACT_MOUNT_CONSUMPTION_VERSION,
    consumptionClass:
      'verified_single_use_read_only_model_artifact_consumption' as const,
    leaseDigestSha256: lease.leaseDigestSha256,
    locator: lease.locator,
    consumerScope: lease.consumerScope,
    executionTarget: lease.executionTarget,
    consumedAt,
    objectVerifiedBeforeConsumer: true as const,
    objectVerifiedAfterConsumer: true as const,
    readOnlySourcePresented: true as const,
    hostPathIncluded: false as const,
    mountAliasIncluded: false as const,
    modelInferenceExecuted: false as const,
    providerCallMade: false as const,
    remoteMutationMade: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  }
  return deepFreeze({
    ...draft,
    consumptionDigestSha256:
      canonicalModelArtifactValueSha256(draft),
  })
}

function assertLease(
  lease:
    | CanonicalModelArtifactReadOnlyMountLease
    | null
    | undefined,
): MountLeaseState {
  if (
    !lease
    || !leaseStates.has(lease)
    || lease.leaseVersion !==
      CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_LEASE_VERSION
    || lease.leaseClass !==
      'process_bound_single_use_read_only_model_artifact_lease'
    || !DIGEST_PATTERN.test(lease.leaseIdDigestSha256)
    || !DIGEST_PATTERN.test(lease.leaseDigestSha256)
    || lease.leaseDigestSha256 !==
      canonicalModelArtifactValueSha256(withoutLeaseDigest(lease))
    || lease.singleUse !== true
    || lease.readOnly !== true
    || lease.hostPathIncluded !== false
    || lease.mountAliasIncluded !== false
    || lease.credentialsIncluded !== false
    || lease.cpuFallbackAllowed !== false
    || lease.runtimeDownloadAllowed !== false
    || lease.networkFetchAllowed !== false
    || lease.modelInferenceAuthority !== false
    || lease.productionReady !== false
    || !Number.isFinite(Date.parse(lease.issuedAt))
    || !Number.isFinite(Date.parse(lease.expiresAt))
    || new Date(lease.issuedAt).toISOString() !== lease.issuedAt
    || new Date(lease.expiresAt).toISOString() !== lease.expiresAt
  ) {
    throw blocked('model_artifact_mount_lease_capability_invalid')
  }
  return leaseStates.get(lease)!
}

function assertConsumer(
  consumer:
    | CanonicalModelArtifactReadOnlyMountConsumerPort
    | null
    | undefined,
): CanonicalModelArtifactReadOnlyMountConsumerPort {
  if (
    !consumer
    || !consumerCapabilities.has(consumer)
    || consumer.consumerVersion !==
      CANONICAL_MODEL_ARTIFACT_READ_ONLY_MOUNT_CONSUMER_VERSION
    || consumer.consumerClass !==
      'process_bound_private_read_only_model_artifact_consumer'
    || !SAFE_ID_PATTERN.test(consumer.consumerScope)
    || consumer.callerPathAccepted !== false
    || consumer.callerBytesAccepted !== false
    || consumer.callerUrlAccepted !== false
    || consumer.modelExecutionAuthorized !== false
    || consumer.productionReady !== false
    || typeof consumer.consumeReadOnlyModelArtifact !== 'function'
  ) {
    throw blocked('model_artifact_mount_consumer_capability_invalid')
  }
  return consumer
}

function withoutLeaseDigest(
  lease: CanonicalModelArtifactReadOnlyMountLease,
): Omit<CanonicalModelArtifactReadOnlyMountLease, 'leaseDigestSha256'> {
  const draft: Record<string, unknown> = {
    ...lease,
  }
  Reflect.deleteProperty(draft, 'leaseDigestSha256')
  return draft as Omit<
    CanonicalModelArtifactReadOnlyMountLease,
    'leaseDigestSha256'
  >
}

function serverDerivedMountAlias(
  lease: CanonicalModelArtifactReadOnlyMountLease,
  artifactFormat: CanonicalModelArtifactReadOnlyMountInput['artifactFormat'],
): string {
  const extension = {
    onnx: 'onnx',
    safetensors: 'safetensors',
    pytorch_checkpoint: 'pt',
    torchscript: 'pt',
    gguf: 'gguf',
    tokenizer: 'tokenizer',
    configuration: 'config',
    reviewed_binary: 'bin',
  }[artifactFormat]
  return `/opt/reeditpro/model-artifacts/${lease.locator.artifactRecordId}/artifact.${extension}`
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
    throw blocked('model_artifact_mount_clock_invalid')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested)
    }
  }
  return value
}

function invalid(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical model-artifact mount input is invalid.',
    400,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical model-artifact read-only mount is unavailable or unsafe.',
    503,
    { reason, productionReady: false },
  )
}
