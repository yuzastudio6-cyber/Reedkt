import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalProviderWorkAuthorizationV4Schema,
  type CanonicalProviderWorkAuthorizationV4,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  validateCanonicalVisualCalibrationObjectiveQaPlanningPayload,
  type CanonicalVisualCalibrationObjectiveQaPlanningPayload,
} from '../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import {
  canonicalVisualCalibrationProviderAttemptSourceDigest,
} from './canonical-private-visual-calibration-consumer-receipt-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PRIVATE_VISUAL_CALIBRATION_PROVIDER_OUTPUT_BRIDGE_VERSION =
  'canonical-private-visual-calibration-provider-output-bridge-v1' as const

export interface CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord {
  schemaVersion:
    typeof CANONICAL_PRIVATE_VISUAL_CALIBRATION_PROVIDER_OUTPUT_BRIDGE_VERSION
  source: 'canonical_visual_provider_receipt_and_candidate_readback'
  ownerUserId: string
  workspaceId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV4
  receipt: CanonicalProviderAttemptConsumerReceipt
  providerAttemptSourceDigest: string
  qaPlanningAuthority: CanonicalVisualCalibrationObjectiveQaPlanningPayload
  qaApprovedWorkItemId: string
  qaExpectedAssetId: string
  outputId: string
  outputRole: 'provider_visual_calibration_video_mp4'
  outputContentSha256: string
  outputByteLength: number
  outputPrivateObjectIdentityHash: string
  outputStorageEvidenceHash: string
  outputReadbackEvidenceHash: string
  createdAt: string
  recordHash: string
}

export async function persistCanonicalPrivateVisualCalibrationProviderOutputBridge(
  input: Omit<
    CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord,
    'schemaVersion' | 'source' | 'recordHash'
  > & { localStorageRoot: string },
): Promise<CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord> {
  const { localStorageRoot, ...recordInput } = input
  const record = canonicalRecord(recordInput)
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (bytes.byteLength > 2 * 1024 * 1024) {
    throw invalid('Visual provider-output bridge exceeds its fixed bound.')
  }
  const written = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: requiredRoot(localStorageRoot),
    relativePath: relativePath(record.recordHash),
    content: bytes,
  })
  if (!written.created) {
    const existing = await readPrivateFileIfExistsWithinRoot({
      rootPath: requiredRoot(localStorageRoot),
      relativePath: relativePath(record.recordHash),
    })
    if (!existing || !existing.equals(bytes)) {
      throw invalid('Visual provider-output bridge replay changed.')
    }
  }
  return record
}

export async function readCanonicalPrivateVisualCalibrationProviderOutputBridge(
  input: {
    localStorageRoot: string
    ownerUserId: string
    workspaceId: string
    recordHash: string
  },
): Promise<CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord | undefined> {
  if (!/^[a-f0-9]{64}$/u.test(input.recordHash)) {
    throw invalid('Visual provider-output bridge hash is invalid.')
  }
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: requiredRoot(input.localStorageRoot),
    relativePath: relativePath(input.recordHash),
  })
  if (!bytes) return undefined
  if (bytes.byteLength > 2 * 1024 * 1024) {
    throw invalid('Visual provider-output bridge is oversized.')
  }
  let raw: unknown
  try { raw = JSON.parse(bytes.toString('utf8')) } catch {
    throw invalid('Visual provider-output bridge is not valid JSON.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalid('Visual provider-output bridge is invalid.')
  }
  const value = raw as Record<string, unknown>
  const { recordHash, schemaVersion, source, ...recordInput } = value
  const record = canonicalRecord(recordInput as Omit<
    CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord,
    'schemaVersion' | 'source' | 'recordHash'
  >)
  if (
    schemaVersion !==
      CANONICAL_PRIVATE_VISUAL_CALIBRATION_PROVIDER_OUTPUT_BRIDGE_VERSION ||
    source !== 'canonical_visual_provider_receipt_and_candidate_readback' ||
    recordHash !== input.recordHash ||
    record.recordHash !== input.recordHash ||
    record.ownerUserId !== input.ownerUserId ||
    record.workspaceId !== input.workspaceId
  ) throw invalid('Visual provider-output bridge integrity changed.')
  return record
}

function canonicalRecord(
  input: Omit<
    CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord,
    'schemaVersion' | 'source' | 'recordHash'
  >,
): CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord {
  const authorization = canonicalProviderWorkAuthorizationV4Schema.parse(
    input.authorization,
  )
  const queueDefinition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(
    input.queueDefinition,
  )
  const receipt = canonicalProviderAttemptConsumerReceiptSchema.parse(
    input.receipt,
  )
  const providerAttemptSourceDigest =
    canonicalVisualCalibrationProviderAttemptSourceDigest(receipt)
  if (input.providerAttemptSourceDigest !== providerAttemptSourceDigest) {
    throw invalid('Visual provider attempt source digest changed.')
  }
  const qaPlanningAuthority =
    validateCanonicalVisualCalibrationObjectiveQaPlanningPayload(
      input.qaPlanningAuthority,
    )
  assertPackage(input.executionPackage)
  assertBindings({
    ...input,
    authorization,
    queueDefinition,
    receipt,
    providerAttemptSourceDigest,
    qaPlanningAuthority,
  })
  const withoutHash = {
    schemaVersion:
      CANONICAL_PRIVATE_VISUAL_CALIBRATION_PROVIDER_OUTPUT_BRIDGE_VERSION,
    source:
      'canonical_visual_provider_receipt_and_candidate_readback' as const,
    ...input,
    authorization,
    queueDefinition,
    receipt,
    providerAttemptSourceDigest,
    qaPlanningAuthority,
  }
  return {
    ...withoutHash,
    recordHash: sha256AuthorityValue(withoutHash),
  }
}

function assertBindings(input: Omit<
  CanonicalPrivateVisualCalibrationProviderOutputBridgeRecord,
  'schemaVersion' | 'source' | 'recordHash'
>): void {
  const output = input.receipt.privateOutput
  const context = input.authorization.visualCalibrationContext
  const providerWorkItem = input.executionPackage.approvedWorkItems.find(
    (candidate) => candidate.id === input.authorization.approvedWorkItemId,
  )
  const qaWorkItem = input.executionPackage.approvedWorkItems.find(
    (candidate) => candidate.id === input.qaApprovedWorkItemId,
  )
  const qaJob = input.executionPackage.jobs.find((candidate) =>
    candidate.approvedWorkItemId === input.qaApprovedWorkItemId)
  if (
    input.ownerUserId !== input.authorization.ownerUserId ||
    input.workspaceId !== input.authorization.workspaceId ||
    input.executionPackage.createdByUserId !== input.ownerUserId ||
    input.executionPackage.workspaceId !== input.workspaceId ||
    input.executionPackage.packageRecordId !==
      input.authorization.packageRecordId ||
    input.executionPackage.packageHash !== input.authorization.packageHash ||
    input.queueDefinition.definitionHash !==
      input.authorization.queueDefinitionHash ||
    input.receipt.identity.authorizationHash !==
      input.authorization.authorityHash ||
    input.providerAttemptSourceDigest !==
      canonicalVisualCalibrationProviderAttemptSourceDigest(input.receipt) ||
    input.receipt.provider.operationId !==
      input.authorization.operationId ||
    input.receipt.provider.providerRouteId !==
      input.authorization.providerRouteId ||
    input.receipt.evidenceClass !== 'private_injected_nonprovider_test' ||
    input.receipt.promotionClass !== 'non_promotable_private_injected' ||
    input.receipt.boundaries.canonicalBackendVerifiedRuntime ||
    input.receipt.boundaries.promotionAuthorized ||
    input.receipt.boundaries.productionReady ||
    !output || input.receipt.privateOutputs.length !== 1 ||
    output.outputId !== input.outputId ||
    output.role !== input.outputRole ||
    output.contentSha256 !== input.outputContentSha256 ||
    output.byteLength !== input.outputByteLength ||
    output.privateObjectIdentityHash !==
      input.outputPrivateObjectIdentityHash ||
    output.storageEvidenceHash !== input.outputStorageEvidenceHash ||
    output.sourceReadbackEvidenceHash !== input.outputReadbackEvidenceHash ||
    output.mimeType !== 'video/mp4' ||
    !providerWorkItem || providerWorkItem.workItemKey !==
      input.qaPlanningAuthority.sourceProviderWorkItemKey ||
    input.authorization.expectedOutputKey !==
      input.qaPlanningAuthority.sourceProviderExpectedOutputId ||
    input.authorization.visualCalibrationContextDigest !==
      input.qaPlanningAuthority.visualCalibrationContextDigest ||
    input.qaPlanningAuthority.motionStudioProductionId !==
      context.motionStudioProductionId ||
    input.qaPlanningAuthority.storytellingStyleAuthorityRefDigest !==
      context.storytellingStyleAuthorityRefDigest ||
    input.qaPlanningAuthority.storytellingProductionAuthorityRefDigest !==
      context.storytellingProductionAuthorityRefDigest ||
    input.qaPlanningAuthority.styleCalibrationPlanId !==
      context.styleCalibrationPlanId ||
    input.qaPlanningAuthority.styleCalibrationPlanVersion !==
      context.styleCalibrationPlanVersion ||
    input.qaPlanningAuthority.styleCalibrationPlanDigest !==
      context.styleCalibrationPlanDigest ||
    input.qaPlanningAuthority.calibrationScenarioId !==
      context.calibrationScenarioId ||
    input.qaPlanningAuthority.calibrationScenarioDigest !==
      context.calibrationScenarioDigest ||
    input.qaPlanningAuthority.referenceContractId !==
      context.referenceContractId ||
    input.qaPlanningAuthority.referenceContractVersion !==
      context.referenceContractVersion ||
    input.qaPlanningAuthority.referenceContractDigest !==
      context.referenceContractDigest ||
    input.qaPlanningAuthority.firstFrameReference.assetId !==
      context.firstFrameAssetId ||
    input.qaPlanningAuthority.firstFrameReference.expectedSha256 !==
      context.firstFrameSha256 ||
    input.qaPlanningAuthority.lastFrameReference.assetId !==
      context.lastFrameAssetId ||
    input.qaPlanningAuthority.lastFrameReference.expectedSha256 !==
      context.lastFrameSha256 ||
    input.qaPlanningAuthority.continuityContractId !==
      context.continuityContractId ||
    input.qaPlanningAuthority.continuityContractVersion !==
      context.continuityContractVersion ||
    input.qaPlanningAuthority.continuityContractDigest !==
      context.continuityContractDigest ||
    !qaWorkItem || !qaJob ||
    providerWorkItem.expectedOutputs.length !== 1 ||
    providerWorkItem.expectedOutputs[0]?.outputKey !==
      input.authorization.expectedOutputKey ||
    qaJob.expectedAssetIds.length !== 1 ||
    qaJob.expectedAssetIds[0] !== input.qaExpectedAssetId ||
    qaJob.dependencyJobIds.length !== 1 ||
    qaJob.dependencyJobIds[0] !== input.authorization.queueJobId ||
    qaWorkItem.expectedOutputs.length !== 1
  ) throw invalid('Visual provider-output bridge lost exact package authority.')
}

function assertPackage(value: CanonicalApprovedEditExecutionPackage): void {
  if (
    !value || typeof value !== 'object' ||
    value.schemaVersion !== 'canonical-approved-edit-execution-package-v5' ||
    !/^[a-f0-9]{64}$/u.test(value.packageHash)
  ) throw invalid('Visual provider-output bridge package is invalid.')
}

function requiredRoot(value: string): string {
  if (!value) throw invalid('Visual provider-output bridge storage root is missing.')
  return value
}

function relativePath(recordHash: string): string {
  return `private-internal/provider-output-artifact-bridges/v4/${recordHash.slice(0, 2)}/${recordHash}.json`
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_private_visual_calibration_provider_output_bridge',
  })
}
