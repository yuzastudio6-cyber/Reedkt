import { createHash } from 'node:crypto'
import type {
  EditReferenceApplicationPreparationIntent,
  EditReferenceApplicationPreparationReceipt,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
  EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  validateEditReferenceProductionPreparedApplicationAuthority,
} from './edit-reference-production-exact-edit-apply-boundary'
import { ApiError } from '../errors/api-error'

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const INTENT_KEYS = [
  'schemaVersion', 'workspaceId', 'editReferenceId', 'studySessionId',
  'dnaVersionId', 'expectedReferenceRevision',
  'expectedDNAContentDigestSha256', 'applicationSource',
  'targetUnderstandingPackageId', 'targetUnderstandingPackageDigestSha256',
  'targetUnderstandingSourceStorageObjectRecordId',
  'targetUnderstandingSourceMediaAssetId',
  'targetUnderstandingEditBriefDigestSha256',
] as const
const RECEIPT_KEYS = [
  'schemaVersion', 'sourceAuthority', 'runtimeSource', 'transactionId',
  'preparationRequestDigestSha256', 'applicationAuthority',
  'editReferenceName', 'replayed', 'preparedAt',
  'authenticatedScopeReboundServerSide',
  'canonicalReferenceDnaQaAndTargetStudyReRead',
  'applicationConnectedToEdit', 'planOrEstimateInvalidated',
  'approvedSnapshotMutated', 'customerPriceCalculated',
  'customerCreditsMutated', 'serviceFeeIncluded',
  'providerOrWorkerExecutionStarted', 'receiptDigestSha256',
] as const

export function validateEditReferenceApplicationPreparationIntent(
  intent: EditReferenceApplicationPreparationIntent,
): void {
  assertExactKeys(intent, INTENT_KEYS, 'application_preparation_intent_shape_invalid')
  if (
    intent.schemaVersion !== EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION
    || !id(intent.workspaceId)
    || !id(intent.editReferenceId)
    || !id(intent.studySessionId)
    || !id(intent.dnaVersionId)
    || !Number.isInteger(intent.expectedReferenceRevision)
    || intent.expectedReferenceRevision < 1
    || !sha(intent.expectedDNAContentDigestSha256)
    || !['setup_selector', 'chat_tag', 'session_panel'].includes(intent.applicationSource)
    || !id(intent.targetUnderstandingPackageId)
    || !sha(intent.targetUnderstandingPackageDigestSha256)
    || !id(intent.targetUnderstandingSourceStorageObjectRecordId)
    || !id(intent.targetUnderstandingSourceMediaAssetId)
    || !sha(intent.targetUnderstandingEditBriefDigestSha256)
  ) invalid('application_preparation_intent_invalid', 400)
}
export function createEditReferenceApplicationPreparationReceipt(
  input: Omit<EditReferenceApplicationPreparationReceipt, 'schemaVersion' | 'sourceAuthority' | 'receiptDigestSha256'>,
): EditReferenceApplicationPreparationReceipt {
  const withoutDigest = {
    schemaVersion: EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION,
    sourceAuthority: 'canonical_preference_application_preparation' as const,
    ...structuredClone(input),
  }
  const receipt: EditReferenceApplicationPreparationReceipt = {
    ...withoutDigest,
    receiptDigestSha256: sha256(withoutDigest),
  }
  validateEditReferenceApplicationPreparationReceipt(receipt)
  return Object.freeze(receipt)
}

export function validateEditReferenceApplicationPreparationReceipt(
  receipt: EditReferenceApplicationPreparationReceipt,
): void {
  assertExactKeys(receipt, RECEIPT_KEYS, 'application_preparation_receipt_shape_invalid')
  const { receiptDigestSha256, ...withoutDigest } = receipt
  validateEditReferenceProductionPreparedApplicationAuthority(
    receipt.applicationAuthority,
  )
  if (
    receipt.schemaVersion !== EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION
    || receipt.sourceAuthority !== 'canonical_preference_application_preparation'
    || !['verified_live', 'controlled_local'].includes(receipt.runtimeSource)
    || !id(receipt.transactionId)
    || !sha(receipt.preparationRequestDigestSha256)
    || !receipt.editReferenceName.trim()
    || receipt.editReferenceName.length > 240
    || typeof receipt.replayed !== 'boolean'
    || !Number.isFinite(Date.parse(receipt.preparedAt))
    || receipt.authenticatedScopeReboundServerSide !== true
    || receipt.canonicalReferenceDnaQaAndTargetStudyReRead !== true
    || receipt.applicationConnectedToEdit !== false
    || receipt.planOrEstimateInvalidated !== false
    || receipt.approvedSnapshotMutated !== false
    || receipt.customerPriceCalculated !== false
    || receipt.customerCreditsMutated !== false
    || receipt.serviceFeeIncluded !== false
    || receipt.providerOrWorkerExecutionStarted !== false
    || !sha(receiptDigestSha256)
    || receiptDigestSha256 !== sha256(withoutDigest)
  ) invalid('application_preparation_receipt_invalid', 503)
}

export function editReferenceApplicationPreparationRequestDigest(input: {
  readonly actorUserId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly intent: EditReferenceApplicationPreparationIntent
}): string {
  validateEditReferenceApplicationPreparationIntent(input.intent)
  if (!id(input.actorUserId) || !id(input.projectId) || !id(input.editSessionId)) {
    invalid('application_preparation_scope_invalid', 400)
  }
  return sha256({
    actorUserId: input.actorUserId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    intent: input.intent,
  })
}

export function stableEditReferenceApplicationPreparationJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableEditReferenceApplicationPreparationJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableEditReferenceApplicationPreparationJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('application_preparation_non_canonical_value', 400)
  return serialized
}

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(stableEditReferenceApplicationPreparationJson(value))
    .digest('hex')
}

function id(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

function sha(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value)
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  reason: string,
): void {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    invalid(reason, 400)
  }
}

function invalid(reason: string, status: number): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference application could not be prepared from canonical authority.',
    status,
    {
      reason,
      browserApplicationRecordAccepted: false,
      applicationConnectedToEdit: false,
      productionReady: false,
    },
  )
}
