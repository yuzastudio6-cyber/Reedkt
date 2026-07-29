import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiReadOnlyModelMount,
  LivingFrameComfyUiReadOnlyModelMountAuthority,
  LivingFrameComfyUiReadOnlyModelMountDraft,
  LivingFrameComfyUiReadOnlyModelMountEntry,
  LivingFrameComfyUiReadOnlyModelMountIssue,
  LivingFrameComfyUiReadOnlyModelMountIssueCode,
} from '../../src/types/living-frame-comfyui-read-only-model-mount'
import {
  LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_CLASS,
  LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_ISSUES,
  LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_OPEN_GATES,
  LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_VERSION,
} from '../../src/types/living-frame-comfyui-read-only-model-mount'
import type {
  CanonicalModelArtifactReadOnlyMountConsumerPort,
  CanonicalModelArtifactRepositoryPort,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  consumeCanonicalModelArtifactReadOnlyMountLease,
  createCanonicalModelArtifactReadOnlyMountLease,
} from '../model-artifacts/canonical-model-artifact-read-only-mount'
import type {
  BindLivingFrameComfyUiCanonicalModelArtifactsInput,
  LivingFrameComfyUiCanonicalModelArtifactBinding,
} from './living-frame-comfyui-canonical-model-artifact-binding'
import {
  verifyLivingFrameComfyUiCanonicalModelArtifactBinding,
} from './living-frame-comfyui-canonical-model-artifact-binding'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiReadOnlyModelMountAuthority = Object.freeze({
    canonicalArtifactBindingConsumed: true,
    canonicalReadOnlyLeaseAuthorityConsumed: true,
    localReadOnlySourcePresentationObserved: true,
    distributedMountAuthority: false,
    modelCompatibilityAuthority: false,
    licenseApprovalAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    toolRegistryAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface PrepareLivingFrameComfyUiReadOnlyModelMountInput {
  readonly preparationId: string
  readonly artifactBinding: LivingFrameComfyUiCanonicalModelArtifactBinding
  readonly artifactBindingInput:
    BindLivingFrameComfyUiCanonicalModelArtifactsInput
  readonly repository: CanonicalModelArtifactRepositoryPort | null
  readonly consumer:
    CanonicalModelArtifactReadOnlyMountConsumerPort | null
}

export class LivingFrameComfyUiReadOnlyModelMountError extends Error {
  readonly issues: readonly LivingFrameComfyUiReadOnlyModelMountIssue[]

  constructor(
    issues: readonly LivingFrameComfyUiReadOnlyModelMountIssue[],
  ) {
    super('Living Frame ComfyUI read-only model mount failed.')
    this.name = 'LivingFrameComfyUiReadOnlyModelMountError'
    this.issues = issues
  }
}

export async function prepareLivingFrameComfyUiReadOnlyModelMount(
  input: PrepareLivingFrameComfyUiReadOnlyModelMountInput,
): Promise<LivingFrameComfyUiReadOnlyModelMount> {
  assertInput(input)
  if (
    !await verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
      input.artifactBinding,
      input.artifactBindingInput,
    )
  ) throw invalid('artifact_binding_invalid', '$.artifactBinding')
  if (
    input.repository !== input.artifactBindingInput.repository
    || input.repository === null
  ) throw invalid('repository_invalid', '$.repository')

  const entries: LivingFrameComfyUiReadOnlyModelMountEntry[] = []
  for (const entry of input.artifactBinding.entries) {
    if (entry.canonicalOrder !== entries.length) {
      throw invalid('entry_order_invalid', '$.artifactBinding.entries')
    }
    let lease
    try {
      lease = await createCanonicalModelArtifactReadOnlyMountLease({
        repository: input.repository,
        locator: entry.locator,
        leaseId:
          `${input.preparationId}.${entry.canonicalOrder}.${entry.role}`,
        consumerScope: 'comfyui.private-inference',
        executionTarget: 'google_cloud_run_gpu',
        leaseDurationMs: 60_000,
      })
    } catch {
      throw invalid(
        'lease_creation_failed',
        `$.artifactBinding.entries.${entry.canonicalOrder}`,
      )
    }
    let receipt
    try {
      receipt =
        await consumeCanonicalModelArtifactReadOnlyMountLease({
          lease,
          consumer: input.consumer,
        })
    } catch {
      throw invalid(
        'lease_consumption_failed',
        `$.artifactBinding.entries.${entry.canonicalOrder}`,
      )
    }
    if (
      receipt.locator.artifactRecordId !== entry.locator.artifactRecordId
      || receipt.locator.contentSha256 !== entry.contentSha256
      || receipt.consumerScope !== 'comfyui.private-inference'
      || receipt.executionTarget !== 'google_cloud_run_gpu'
    ) throw invalid(
      'entry_identity_mismatch',
      `$.artifactBinding.entries.${entry.canonicalOrder}`,
    )
    entries.push({
      canonicalOrder: entry.canonicalOrder,
      role: entry.role,
      artifactRecordId: entry.locator.artifactRecordId,
      artifactId: entry.artifactId,
      revision: entry.revision,
      contentSha256: entry.contentSha256,
      leaseDigestSha256: receipt.leaseDigestSha256,
      consumptionDigestSha256: receipt.consumptionDigestSha256,
      consumerScope: 'comfyui.private-inference',
      executionTarget: 'google_cloud_run_gpu',
      objectVerifiedBeforeConsumer: true,
      objectVerifiedAfterConsumer: true,
      readOnlySourcePresented: true,
      hostPathIncluded: false,
      mountAliasIncluded: false,
      modelInferenceExecuted: false,
    })
  }

  const draft: LivingFrameComfyUiReadOnlyModelMountDraft = {
    contractVersion: LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_VERSION,
    resultClass: LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_CLASS,
    preparationId: input.preparationId,
    sourceBindings: {
      canonicalModelArtifactBindingId:
        input.artifactBinding.bindingId,
      canonicalModelArtifactBindingDigestSha256:
        input.artifactBinding.bindingDigestSha256,
      requirementsDigestSha256:
        input.artifactBinding.sourceBindings.requirementsDigestSha256,
    },
    entries,
    metrics: {
      requiredArtifactCount: input.artifactBinding.entries.length,
      readOnlySourcePresentationCount: entries.length,
      totalByteLength: input.artifactBinding.metrics.totalByteLength,
    },
    openGateCodes:
      LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    sourceArtifactBindingRevalidated: true,
    everyLeaseCreatedByCanonicalAuthority: true,
    everyLeaseConsumedExactlyOnce: true,
    everyObjectVerifiedBeforeAndAfterPresentation: true,
    containsHostPathMountAliasUrlCredentialOrBytes: false,
    distributedMountCreated: false,
    modelInferenceExecuted: false,
    outputArtifactCreated: false,
    actualAttemptCostReceiptCreated: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    preparationDigestSha256: digest(draft),
  })
}

export function verifyLivingFrameComfyUiReadOnlyModelMount(
  value: unknown,
): value is LivingFrameComfyUiReadOnlyModelMount {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contractVersion',
    'resultClass',
    'preparationId',
    'sourceBindings',
    'entries',
    'metrics',
    'openGateCodes',
    'authorityBoundary',
    'sourceArtifactBindingRevalidated',
    'everyLeaseCreatedByCanonicalAuthority',
    'everyLeaseConsumedExactlyOnce',
    'everyObjectVerifiedBeforeAndAfterPresentation',
    'containsHostPathMountAliasUrlCredentialOrBytes',
    'distributedMountCreated',
    'modelInferenceExecuted',
    'outputArtifactCreated',
    'actualAttemptCostReceiptCreated',
    'subjectSpecificRouting',
    'productionReady',
    'preparationDigestSha256',
  ])) return false
  const candidate =
    value as unknown as LivingFrameComfyUiReadOnlyModelMount
  if (
    candidate.contractVersion
      !== LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_VERSION
    || candidate.resultClass
      !== LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_CLASS
    || !SAFE_ID.test(candidate.preparationId)
    || !SHA256.test(candidate.preparationDigestSha256)
    || canonicalJson(candidate.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_OPEN_GATES,
      )
    || canonicalJson(candidate.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || candidate.sourceArtifactBindingRevalidated !== true
    || candidate.everyLeaseCreatedByCanonicalAuthority !== true
    || candidate.everyLeaseConsumedExactlyOnce !== true
    || candidate.everyObjectVerifiedBeforeAndAfterPresentation !== true
    || candidate.containsHostPathMountAliasUrlCredentialOrBytes !== false
    || candidate.distributedMountCreated !== false
    || candidate.modelInferenceExecuted !== false
    || candidate.outputArtifactCreated !== false
    || candidate.actualAttemptCostReceiptCreated !== false
    || candidate.subjectSpecificRouting !== false
    || candidate.productionReady !== false
    || !validateEntries(candidate.entries, candidate.metrics)
  ) return false
  const { preparationDigestSha256, ...draft } = candidate
  return digest(draft) === preparationDigestSha256
}

function validateEntries(
  entries: readonly LivingFrameComfyUiReadOnlyModelMountEntry[],
  metrics: LivingFrameComfyUiReadOnlyModelMountDraft['metrics'],
): boolean {
  return Array.isArray(entries)
    && entries.length > 0
    && entries.length === metrics.requiredArtifactCount
    && entries.length === metrics.readOnlySourcePresentationCount
    && entries.every((entry, index) =>
      entry.canonicalOrder === index
      && SAFE_ID.test(entry.artifactRecordId)
      && SAFE_ID.test(entry.artifactId)
      && SAFE_ID.test(entry.revision)
      && SHA256.test(entry.contentSha256)
      && SHA256.test(entry.leaseDigestSha256)
      && SHA256.test(entry.consumptionDigestSha256)
      && entry.consumerScope === 'comfyui.private-inference'
      && entry.executionTarget === 'google_cloud_run_gpu'
      && entry.objectVerifiedBeforeConsumer === true
      && entry.objectVerifiedAfterConsumer === true
      && entry.readOnlySourcePresented === true
      && entry.hostPathIncluded === false
      && entry.mountAliasIncluded === false
      && entry.modelInferenceExecuted === false)
}

function assertInput(
  input: PrepareLivingFrameComfyUiReadOnlyModelMountInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'preparationId',
      'artifactBinding',
      'artifactBindingInput',
      'repository',
      'consumer',
    ])
    || typeof input.preparationId !== 'string'
    || !SAFE_ID.test(input.preparationId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code: LivingFrameComfyUiReadOnlyModelMountIssueCode,
  path: string,
): LivingFrameComfyUiReadOnlyModelMountError {
  if (
    !(LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame model-mount issue code.')
  return new LivingFrameComfyUiReadOnlyModelMountError([{ code, path }])
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const sorted = [...expected].sort()
  return actual.length === sorted.length
    && actual.every((key, index) => key === sorted[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  }
  return value
}
