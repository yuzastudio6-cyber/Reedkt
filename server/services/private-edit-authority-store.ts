import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'
import {
  type PlanningDomainMutationScope,
  withPlanningDomainMutationLock,
} from './planning-domain-mutation-lock'

export const PRIVATE_EDIT_AUTHORITY_RECORD_VERSION = 'private-edit-authority-aggregate-v1' as const
export const PRIVATE_EDIT_AUTHORITY_BLOB_VERSION = 'private-edit-authority-json-blob-v1' as const
export const PRIVATE_EDIT_AUTHORITY_INITIAL_TEST_CREDITS = 10_000

const MAX_AUTHORITY_AGGREGATE_BYTES = 16 * 1024 * 1024
const MAX_AUTHORITY_BLOB_BYTES = 2 * 1024 * 1024

export interface AuthorityJsonBlobRef {
  sha256: string
  byteLength: number
}

export interface AuthorityExpectedOutput {
  outputKey: string
  artifactType: string
  assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
  required: boolean
  previewPlaceholderAllowed: boolean
  contentType?: string
  segmentIds: string[]
  timingIds: string[]
  rendererLayerIds: string[]
}

export interface AuthorityWalletBalance {
  walletId: string
  workspaceId: string
  ownerUserId: string
  fundedCredits: number
  availableCredits: number
  reservedCredits: number
  spentCredits: number
  refundedCredits: number
  ledgerSequence: number
  testOnly: true
}

export interface AuthorityPlanRecord {
  id: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  planVersion: number
  status: 'presented' | 'approved' | 'superseded' | 'rejected' | 'cancellation_pending' | 'cancelled'
  componentRefs: Record<string, AuthorityJsonBlobRef>
  estimateId: string
  workItemIds: string[]
  planHash: string
  workGraphHash: string
  sourceSequenceHash: string
  timingHash: string
  createdAt: string
  approvedAt?: string
  supersededAt?: string
  cancelledAt?: string
  cancellationPendingAt?: string
  cancellationRequestHash?: string
  cancellationIdempotencyKeyHash?: string
  revisionAuthority?: {
    reviewAssemblyId: string
    reviewDecisionId: string
    revisionRequestId: string
    decisionManifestSha256: string
    priorApprovedSnapshotId: string
    priorApprovedPlanId: string
    priorApprovedPlanVersion: number
    revisionIntentHash: string
  }
}

export interface AuthorityEstimateLineItem {
  lineKey: string
  label: string
  category: string
  estimatedCredits: number
  removable: boolean
  metadataRef: AuthorityJsonBlobRef
}

export interface AuthorityCreditEstimateRecord {
  id: string
  planId: string
  estimateVersion: number
  status: 'presented' | 'approved' | 'superseded' | 'expired' | 'rejected' | 'cancelled'
  lineItems: AuthorityEstimateLineItem[]
  estimatedCredits: number
  fallbackAllowanceCredits: number
  approvedMaximumCredits: number
  estimateHash: string
  validUntil: string
  createdAt: string
  approvedAt?: string
  supersededAt?: string
  cancelledAt?: string
}

export interface AuthorityPlanWorkItemRecord {
  id: string
  planId: string
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInputRef: AuthorityJsonBlobRef
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  expectedOutputs: AuthorityExpectedOutput[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  approvedProviderRoute?: string
  providerExecutionMode: 'none' | 'primary' | 'fallback' | 'final_fallback'
  fallbackPolicyRef: AuthorityJsonBlobRef
  maxAttempts: number
  attemptTimeoutSeconds: number
  scheduledDelaySeconds: number
  maximumCreditBudget: number
  required: boolean
  executionInputHash: string
  createdAt: string
}

export interface AuthorityApprovalRecord {
  id: string
  planId: string
  estimateId: string
  snapshotId: string
  reservationId: string
  approvedByUserId: string
  approvedAt: string
  requestHash: string
  idempotencyKey: string
}

export interface AuthorityApprovedSnapshotManifest {
  schemaVersion: 'private-edit-authority-approved-snapshot-v3'
  snapshotId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planId: string
  planVersion: number
  estimateId: string
  approvalId: string
  reservationId: string
  approvedByUserId: string
  approvedAt: string
  componentRefs: Record<string, AuthorityJsonBlobRef>
  approvedWorkItemIds: string[]
  planHash: string
  estimateHash: string
  workGraphHash: string
  sourceSequenceHash: string
  timingHash: string
  approvedAssetManifestRef: AuthorityJsonBlobRef
  approvedAssetManifestHash: string
  approvedSourceAssetManifestRef: AuthorityJsonBlobRef
  approvedSourceAssetManifestHash: string
  snapshotHash: string
}

export interface AuthorityApprovedWorkItemRecord extends Omit<AuthorityPlanWorkItemRecord, 'id' | 'planId'> {
  id: string
  snapshotId: string
  sourceWorkItemId: string
  createdAt: string
}

export interface AuthorityCreditReservationRecord {
  id: string
  approvalId: string
  snapshotId: string
  estimateId: string
  planId: string
  projectId: string
  editSessionId: string
  status: 'reserved' | 'partially_spent' | 'spent' | 'released' | 'refunded' | 'cancelled' | 'expired'
  reservedCredits: number
  spentCredits: number
  releasedCredits: number
  refundedCredits: number
  reservedAt: string
  expiresAt: string
  updatedAt: string
}

export interface AuthorityLedgerEntry {
  id: string
  sequence: number
  entryType: 'grant' | 'reserve' | 'spend' | 'release' | 'refund' | 'expire' | 'cancel'
  sourceType: string
  sourceId: string
  availableDelta: number
  reservedDelta: number
  spentDelta: number
  balanceAfter: Pick<AuthorityWalletBalance, 'availableCredits' | 'reservedCredits' | 'spentCredits' | 'refundedCredits'>
  idempotencyKey: string
  createdAt: string
}

export interface AuthorityReservationEvent {
  id: string
  reservationId: string
  snapshotId: string
  approvalId: string
  eventType: 'reserved' | 'spent' | 'released' | 'refunded' | 'cancelled' | 'expired'
  credits: number
  idempotencyKey: string
  createdAt: string
}

export interface AuthorityGpuAttemptCreditSettlementRecord {
  schemaVersion: 'canonical-professional-gpu-attempt-credit-settlement-v1'
  id: string
  terminalBindingId: string
  terminalBindingHash: string
  prelaunchRecordId: string
  prelaunchRecordHash: string
  fundedDispatchAdmissionId: string
  fundedDispatchAdmissionHash: string
  attemptCostReceiptId: string
  attemptCostReceiptHash: string
  executionAttemptId: string
  snapshotId: string
  approvalId: string
  reservationId: string
  approvedWorkItemId: string
  terminalOutcome:
    | 'completed'
    | 'reeditpro_failed'
    | 'unknown_requires_reconciliation'
  settlementDisposition:
    | 'charged_eligible_cost_to_shared_plan_reservation'
    | 'no_charge_weeditpro_absorbed_failure'
    | 'held_without_charge_pending_reconciliation'
  approvedToolCeilingCredits: number
  customerChargedCredits: number
  weeditproAbsorbedInfrastructureCostUsdNanos: number
  unusedToolCeilingCreditsRetainedInSharedPlanReservation: number
  creditsHeldPendingReconciliation: number
  creditsReleasedOrRefundedAtAttemptSettlement: 0
  reservationSpendApplied: boolean
  exactTerminalAndAttemptCostReceiptReread: true
  serviceFeeSettledHere: false
  finalPlanSettlementStillRequired: true
  publicBillingAuthorityGranted: false
  productionAuthorityGranted: false
  idempotencyKey: string
  createdAt: string
  settlementHash: string
}

export interface AuthorityA100VertexAttemptCreditSettlementRecord {
  schemaVersion: 'canonical-a100-vertex-attempt-credit-settlement-v1'
  id: string
  vertexTerminalReadId: string
  vertexTerminalReadHash: string
  launchAuthorityId: string
  launchAuthorityHash: string
  executionRecordId: string
  executionRecordHash: string
  attemptCostReceiptId: string
  attemptCostReceiptHash: string
  executionAttemptId: string
  snapshotId: string
  approvalId: string
  reservationId: string
  approvedWorkItemId: string
  terminalOutcome: 'completed' | 'reeditpro_failed'
  settlementDisposition:
    | 'charged_eligible_cost_to_shared_plan_reservation'
    | 'no_charge_weeditpro_absorbed_failure'
  approvedToolCeilingCredits: number
  customerChargedCredits: number
  weeditproAbsorbedInfrastructureCostUsdNanos: number
  unusedToolCeilingCreditsRetainedInSharedPlanReservation: number
  creditsHeldPendingReconciliation: 0
  creditsReleasedOrRefundedAtAttemptSettlement: 0
  reservationSpendApplied: boolean
  exactTerminalAndAttemptCostReceiptReread: true
  serviceFeeSettledHere: false
  finalPlanSettlementStillRequired: true
  publicBillingAuthorityGranted: false
  productionAuthorityGranted: false
  idempotencyKey: string
  createdAt: string
  settlementHash: string
}

export type AuthorityAnyGpuAttemptCreditSettlementRecord =
  | AuthorityGpuAttemptCreditSettlementRecord
  | AuthorityA100VertexAttemptCreditSettlementRecord

export interface AuthorityGpuPlanFinalCreditSettlementWorkBinding {
  workItemKey: string
  approvedWorkItemId: string
  approvedToolCeilingCredits: number
  completedAttemptSettlementId: string
  attemptSettlementIds: string[]
  attemptSettlementHashes: string[]
  customerChargedToolCredits: number
}

export interface AuthorityGpuPlanFinalCreditSettlementRecord {
  schemaVersion: 'canonical-professional-gpu-plan-final-credit-settlement-v1'
  id: string
  pricingAuthorityBundleId: string
  pricingAuthorityBundleHash: string
  finalReadinessObservationId: string
  finalReadinessObservationHash: string
  snapshotId: string
  approvalId: string
  reservationId: string
  planId: string
  estimateId: string
  workBindings: AuthorityGpuPlanFinalCreditSettlementWorkBinding[]
  actualBillableGpuToolCostCredits: number
  calculatedServiceFeeCredits: number
  grossFinalChargeCredits: number
  approvedMaximumCredits: number
  customerCreditsSpentBeforeFinalSettlement: number
  customerServiceFeeCreditsChargedAtFinalSettlement: number
  customerTotalChargedCredits: number
  weeditproAbsorbedOverageCredits: number
  unusedReservationCreditsReleased: number
  unknownGpuAttemptOutcomeCount: 0
  allPricedGpuWorkCompletedExactlyOnce: true
  exactApprovedEstimateAndServiceFeePolicyReread: true
  exactAttemptSettlementSetReread: true
  exactPrivateCompletionReadinessReread: true
  activeGpuInstancesAtFinalSettlement: 0
  reservationFinalized: true
  privateInternalWalletMutated: true
  externalCustomerWalletMutated: false
  publicBillingAuthorityGranted: false
  publicDeliveryAuthorityGranted: false
  productionAuthorityGranted: false
  idempotencyKey: string
  createdAt: string
  settlementHash: string
}

export interface AuthorityDerivedJobRecord {
  id: string
  snapshotId: string
  reservationId: string
  approvedWorkItemId: string
  workItemKey: string
  jobType: string
  workerClass: string
  executionInputRef: AuthorityJsonBlobRef
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  expectedAssetIds: string[]
  dependencyJobIds: string[]
  status: 'blocked' | 'ready'
  maxAttempts: number
  attemptTimeoutSeconds: number
  scheduledFor: string
  createdAt: string
}

export interface AuthorityExecutionPackageRecord {
  id: string
  source: 'canonical_edit_authority'
  purpose: 'private_internal_execution_handoff'
  snapshotId: string
  planId: string
  estimateId: string
  reservationId: string
  projectId: string
  editSessionId: string
  snapshotHash: string
  planHash: string
  estimateHash: string
  workGraphHash: string
  approvedAssetManifestHash: string
  approvedSourceAssetManifestHash: string
  toolCapabilityManifestRef: AuthorityJsonBlobRef
  packageHash: string
  createdByUserId: string
  createdAt: string
}

export interface AuthorityPlannedAssetManifestEntry {
  id: string
  snapshotId: string
  approvedWorkItemId: string
  workItemKey: string
  outputKey: string
  artifactType: string
  assetRole: AuthorityExpectedOutput['assetRole']
  required: boolean
  previewPlaceholderAllowed: boolean
  contentType?: string
  segmentIds: string[]
  timingIds: string[]
  rendererLayerIds: string[]
  status: 'planned'
  version: 1
  createdAt: string
}

export interface AuthorityPlannedAssetManifest {
  schemaVersion: 'private-edit-asset-manifest-v1'
  snapshotId: string
  planId: string
  planHash: string
  workGraphHash: string
  entries: AuthorityPlannedAssetManifestEntry[]
  requiredAssetCount: number
  optionalAssetCount: number
  manifestHash: string
}

export interface AuthorityIdempotencyRecord {
  operation:
    | 'publish_plan'
    | 'approve_plan'
    | 'create_execution_package'
    | 'cancel_approved_snapshot'
    | 'compensate_cancel_approved_snapshot'
  idempotencyKey: string
  requestHash: string
  responseId: string
  secondaryResponseIds: string[]
  response: Record<string, unknown>
  completedAt: string
}

export interface AuthorityAuditEvent {
  id: string
  eventType: string
  actorUserId: string
  projectId?: string
  editSessionId?: string
  planId?: string
  snapshotId?: string
  createdAt: string
}

export interface PrivateEditAuthorityAggregate {
  schemaVersion: typeof PRIVATE_EDIT_AUTHORITY_RECORD_VERSION
  workspaceId: string
  ownerUserId: string
  revision: number
  wallet: AuthorityWalletBalance
  plans: AuthorityPlanRecord[]
  estimates: AuthorityCreditEstimateRecord[]
  planWorkItems: AuthorityPlanWorkItemRecord[]
  approvals: AuthorityApprovalRecord[]
  snapshots: AuthorityApprovedSnapshotManifest[]
  approvedWorkItems: AuthorityApprovedWorkItemRecord[]
  reservations: AuthorityCreditReservationRecord[]
  ledgerEntries: AuthorityLedgerEntry[]
  reservationEvents: AuthorityReservationEvent[]
  gpuAttemptCreditSettlements: AuthorityAnyGpuAttemptCreditSettlementRecord[]
  gpuPlanFinalCreditSettlements: AuthorityGpuPlanFinalCreditSettlementRecord[]
  jobs: AuthorityDerivedJobRecord[]
  executionPackages: AuthorityExecutionPackageRecord[]
  idempotencyRecords: AuthorityIdempotencyRecord[]
  auditEvents: AuthorityAuditEvent[]
  createdAt: string
  updatedAt: string
}

interface PersistedAuthorityAggregateRecord {
  recordVersion: typeof PRIVATE_EDIT_AUTHORITY_RECORD_VERSION
  source: 'private_edit_authority_store'
  aggregate: PrivateEditAuthorityAggregate
  checksumSha256: string
}

interface PersistedAuthorityBlobRecord {
  recordVersion: typeof PRIVATE_EDIT_AUTHORITY_BLOB_VERSION
  source: 'private_edit_authority_content_addressed_blob'
  sha256: string
  byteLength: number
  value: Record<string, unknown> | unknown[]
}

type AuthorityScope = {
  localStorageRoot: string
  workspaceId: string
  ownerUserId: string
}

const scopeLocks = new Map<string, Promise<void>>()
const blobLocks = new Map<string, Promise<void>>()

export function clearPrivateEditAuthorityProcessStateForSmoke(): void {
  scopeLocks.clear()
  blobLocks.clear()
}

export async function putPrivateAuthorityJsonBlob(input: {
  localStorageRoot: string
  value: Record<string, unknown> | unknown[]
  maxBytes?: number
}): Promise<AuthorityJsonBlobRef> {
  const stableValue = stableJsonValue(input.value) as Record<string, unknown> | unknown[]
  const serializedValue = JSON.stringify(stableValue)
  const byteLength = Buffer.byteLength(serializedValue, 'utf8')
  const maxBytes = input.maxBytes ?? MAX_AUTHORITY_BLOB_BYTES
  if (byteLength > maxBytes) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning component exceeds its private authority byte ceiling.', 413, {
      byteLength,
      maxBytes,
    })
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(stableValue)
  if (secretLikePaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning component contains secret-like fields or values.', 400, {
      secretLikePaths,
    })
  }

  const sha256 = sha256Text(serializedValue)
  await withProcessLock(blobLocks, sha256, async () => {
    const relativePath = authorityBlobPath(sha256)
    const existingContent = await readPrivateTextFileIfExistsWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath,
    })
    if (existingContent) {
      const existing = parseBlobRecord(existingContent, sha256)
      if (existing.byteLength !== byteLength || stableStringify(existing.value) !== serializedValue) {
        throw new ApiError('VALIDATION_FAILED', 'Content-addressed authority blob did not match its SHA-256 path.', 409)
      }
      return
    }

    const record: PersistedAuthorityBlobRecord = {
      recordVersion: PRIVATE_EDIT_AUTHORITY_BLOB_VERSION,
      source: 'private_edit_authority_content_addressed_blob',
      sha256,
      byteLength,
      value: stableValue,
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.localStorageRoot,
      relativePath,
      content: `${JSON.stringify(record)}\n`,
    })
  })
  return { sha256, byteLength }
}

export async function readPrivateAuthorityJsonBlob(input: {
  localStorageRoot: string
  ref: AuthorityJsonBlobRef
}): Promise<Record<string, unknown> | unknown[]> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: authorityBlobPath(input.ref.sha256),
  })
  if (!content) throw new ApiError('VALIDATION_FAILED', 'Canonical authority component blob was not found.', 409)
  const record = parseBlobRecord(content, input.ref.sha256)
  if (record.byteLength !== input.ref.byteLength) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical authority component byte length did not match its manifest.', 409)
  }
  return record.value
}

export async function readPrivateEditAuthorityAggregate(
  scope: AuthorityScope,
): Promise<PrivateEditAuthorityAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: authorityAggregatePath(scope.ownerUserId, scope.workspaceId),
  })
  if (!content) return undefined
  return parseAggregateRecord(content, scope)
}

export async function mutatePrivateEditAuthorityAggregate<T>(input: {
  scope: AuthorityScope
  planningDomainScope?: PlanningDomainMutationScope
  now: string
  mutation: (aggregate: PrivateEditAuthorityAggregate) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
  afterPersistWhilePlanningDomainLocked?: (input: {
    aggregate: Readonly<PrivateEditAuthorityAggregate>
    result: T
  }) => Promise<void>
}): Promise<T> {
  if (input.afterPersistWhilePlanningDomainLocked && !input.planningDomainScope) {
    throw new ApiError(
      'INTERNAL_ERROR',
      'A planning-domain post-persistence projection requires the exact planning-domain lock.',
      500,
    )
  }
  const lockKey = authorityScopeHash(input.scope.ownerUserId, input.scope.workspaceId)
  const mutate = async () => withProcessLock(scopeLocks, lockKey, async () => {
    const existing = await readPrivateEditAuthorityAggregate(input.scope)
    const aggregate = existing ?? createPrivateEditAuthorityAggregate(input.scope, input.now)
    const mutationResult = await input.mutation(aggregate)
    if (!mutationResult.changed) {
      await input.afterPersistWhilePlanningDomainLocked?.({
        aggregate,
        result: mutationResult.result,
      })
      return mutationResult.result
    }

    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertAuthorityAggregateValid(aggregate, input.scope)
    const checksumSha256 = sha256Text(stableStringify(aggregate))
    const record: PersistedAuthorityAggregateRecord = {
      recordVersion: PRIVATE_EDIT_AUTHORITY_RECORD_VERSION,
      source: 'private_edit_authority_store',
      aggregate,
      checksumSha256,
    }
    const content = `${JSON.stringify(record)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_AUTHORITY_AGGREGATE_BYTES) {
      throw new ApiError('IDEMPOTENCY_CAPACITY_EXCEEDED', 'Private edit authority aggregate reached its safe capacity.', 503, {
        byteLength,
        maxBytes: MAX_AUTHORITY_AGGREGATE_BYTES,
      })
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: authorityAggregatePath(input.scope.ownerUserId, input.scope.workspaceId),
      content,
    })
    await input.afterPersistWhilePlanningDomainLocked?.({
      aggregate,
      result: mutationResult.result,
    })
    return mutationResult.result
  })
  return input.planningDomainScope
    ? withPlanningDomainMutationLock(input.planningDomainScope, mutate)
    : mutate()
}

function createPrivateEditAuthorityAggregate(scope: AuthorityScope, now: string): PrivateEditAuthorityAggregate {
  const walletId = `authority_wallet_${randomUUID()}`
  const wallet: AuthorityWalletBalance = {
    walletId,
    workspaceId: scope.workspaceId,
    ownerUserId: scope.ownerUserId,
    fundedCredits: PRIVATE_EDIT_AUTHORITY_INITIAL_TEST_CREDITS,
    availableCredits: PRIVATE_EDIT_AUTHORITY_INITIAL_TEST_CREDITS,
    reservedCredits: 0,
    spentCredits: 0,
    refundedCredits: 0,
    ledgerSequence: 1,
    testOnly: true,
  }
  return {
    schemaVersion: PRIVATE_EDIT_AUTHORITY_RECORD_VERSION,
    workspaceId: scope.workspaceId,
    ownerUserId: scope.ownerUserId,
    revision: 0,
    wallet,
    plans: [],
    estimates: [],
    planWorkItems: [],
    approvals: [],
    snapshots: [],
    approvedWorkItems: [],
    reservations: [],
    ledgerEntries: [{
      id: `authority_ledger_${randomUUID()}`,
      sequence: 1,
      entryType: 'grant',
      sourceType: 'private_internal_test_credit_grant',
      sourceId: walletId,
      availableDelta: PRIVATE_EDIT_AUTHORITY_INITIAL_TEST_CREDITS,
      reservedDelta: 0,
      spentDelta: 0,
      balanceAfter: walletBalanceAfter(wallet),
      idempotencyKey: `initial-test-grant:${scope.workspaceId}`,
      createdAt: now,
    }],
    reservationEvents: [],
    gpuAttemptCreditSettlements: [],
    gpuPlanFinalCreditSettlements: [],
    jobs: [],
    executionPackages: [],
    idempotencyRecords: [],
    auditEvents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseAggregateRecord(content: string, scope: AuthorityScope): PrivateEditAuthorityAggregate {
  const parsed = parseJson(content, 'Private edit authority aggregate') as Partial<PersistedAuthorityAggregateRecord>
  if (
    parsed.recordVersion !== PRIVATE_EDIT_AUTHORITY_RECORD_VERSION ||
    parsed.source !== 'private_edit_authority_store' ||
    !parsed.aggregate ||
    typeof parsed.checksumSha256 !== 'string'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate has an unsupported record shape.', 409)
  }
  const expectedChecksum = sha256Text(stableStringify(parsed.aggregate))
  if (parsed.checksumSha256 !== expectedChecksum) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate checksum is invalid.', 409)
  }
  if (!Array.isArray(parsed.aggregate.executionPackages)) {
    parsed.aggregate.executionPackages = []
  }
  if (!Array.isArray(parsed.aggregate.gpuAttemptCreditSettlements)) {
    parsed.aggregate.gpuAttemptCreditSettlements = []
  }
  if (!Array.isArray(parsed.aggregate.gpuPlanFinalCreditSettlements)) {
    parsed.aggregate.gpuPlanFinalCreditSettlements = []
  }
  assertAuthorityAggregateValid(parsed.aggregate, scope)
  return parsed.aggregate
}

function parseBlobRecord(content: string, expectedSha256: string): PersistedAuthorityBlobRecord {
  const parsed = parseJson(content, 'Private edit authority component blob') as Partial<PersistedAuthorityBlobRecord>
  if (
    parsed.recordVersion !== PRIVATE_EDIT_AUTHORITY_BLOB_VERSION ||
    parsed.source !== 'private_edit_authority_content_addressed_blob' ||
    parsed.sha256 !== expectedSha256 ||
    typeof parsed.byteLength !== 'number' ||
    (!Array.isArray(parsed.value) && (!parsed.value || typeof parsed.value !== 'object'))
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority component blob has an unsupported record shape.', 409)
  }
  const serializedValue = stableStringify(parsed.value)
  if (
    sha256Text(serializedValue) !== expectedSha256 ||
    Buffer.byteLength(serializedValue, 'utf8') !== parsed.byteLength
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority component blob integrity validation failed.', 409)
  }
  return parsed as PersistedAuthorityBlobRecord
}

function assertAuthorityAggregateValid(aggregate: PrivateEditAuthorityAggregate, scope: AuthorityScope): void {
  if (
    aggregate.schemaVersion !== PRIVATE_EDIT_AUTHORITY_RECORD_VERSION ||
    aggregate.workspaceId !== scope.workspaceId ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.wallet.workspaceId !== scope.workspaceId ||
    aggregate.wallet.ownerUserId !== scope.ownerUserId ||
    aggregate.wallet.testOnly !== true ||
    !Number.isInteger(aggregate.revision) || aggregate.revision < 0
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate scope or version is invalid.', 409)
  }
  const wallet = aggregate.wallet
  if (
    [wallet.fundedCredits, wallet.availableCredits, wallet.reservedCredits, wallet.spentCredits, wallet.refundedCredits]
      .some((value) => !Number.isInteger(value) || value < 0) ||
    wallet.fundedCredits !== wallet.availableCredits + wallet.reservedCredits + wallet.spentCredits ||
    wallet.ledgerSequence !== aggregate.ledgerEntries.length
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority wallet conservation evidence is invalid.', 409)
  }
  for (const ids of [
    aggregate.plans.map((record) => record.id),
    aggregate.estimates.map((record) => record.id),
    aggregate.planWorkItems.map((record) => record.id),
    aggregate.approvals.map((record) => record.id),
    aggregate.snapshots.map((record) => record.snapshotId),
    aggregate.approvedWorkItems.map((record) => record.id),
    aggregate.reservations.map((record) => record.id),
    aggregate.ledgerEntries.map((record) => record.id),
    aggregate.reservationEvents.map((record) => record.id),
    aggregate.gpuAttemptCreditSettlements.map((record) => record.id),
    aggregate.gpuPlanFinalCreditSettlements.map((record) => record.id),
    aggregate.jobs.map((record) => record.id),
    aggregate.executionPackages.map((record) => record.id),
    aggregate.auditEvents.map((record) => record.id),
  ]) {
    if (new Set(ids).size !== ids.length) {
      throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate contains duplicate record IDs.', 409)
    }
  }
  for (const settlement of aggregate.gpuAttemptCreditSettlements) {
    const reservation = aggregate.reservations.find((record) =>
      record.id === settlement.reservationId)
    const snapshot = aggregate.snapshots.find((record) =>
      record.snapshotId === settlement.snapshotId)
    const approvedWorkItem = aggregate.approvedWorkItems.find((record) =>
      record.id === settlement.approvedWorkItemId)
    const { settlementHash, ...payload } = settlement
    const matchingLedgerEntries = aggregate.ledgerEntries.filter((record) =>
      record.sourceType ===
        'canonical_professional_gpu_attempt_credit_settlement'
      && record.sourceId === settlement.id)
    const matchingReservationEvents = aggregate.reservationEvents.filter(
      (record) => record.reservationId === settlement.reservationId
        && record.idempotencyKey === settlement.idempotencyKey
        && record.eventType === 'spent',
    )
    const exactSpendEvidence = settlement.reservationSpendApplied
      ? matchingLedgerEntries.length === 1
        && matchingLedgerEntries[0]!.entryType === 'spend'
        && matchingLedgerEntries[0]!.availableDelta === 0
        && matchingLedgerEntries[0]!.reservedDelta ===
          -settlement.customerChargedCredits
        && matchingLedgerEntries[0]!.spentDelta ===
          settlement.customerChargedCredits
        && matchingLedgerEntries[0]!.idempotencyKey ===
          settlement.idempotencyKey
        && matchingReservationEvents.length === 1
        && matchingReservationEvents[0]!.credits ===
          settlement.customerChargedCredits
      : matchingLedgerEntries.length === 0
        && matchingReservationEvents.length === 0
    if (settlement.schemaVersion ===
      'canonical-a100-vertex-attempt-credit-settlement-v1') {
      const validVertexDisposition = settlement.terminalOutcome === 'completed'
        ? settlement.settlementDisposition ===
            'charged_eligible_cost_to_shared_plan_reservation'
          && settlement.reservationSpendApplied ===
            (settlement.customerChargedCredits > 0)
          && settlement.customerChargedCredits
            + settlement
              .unusedToolCeilingCreditsRetainedInSharedPlanReservation
            === settlement.approvedToolCeilingCredits
        : settlement.terminalOutcome === 'reeditpro_failed'
          && settlement.settlementDisposition ===
            'no_charge_weeditpro_absorbed_failure'
          && settlement.customerChargedCredits === 0
          && settlement.reservationSpendApplied === false
          && settlement
            .unusedToolCeilingCreditsRetainedInSharedPlanReservation ===
              settlement.approvedToolCeilingCredits
      if (
        !reservation || !snapshot || !approvedWorkItem
        || snapshot.reservationId !== reservation.id
        || snapshot.approvalId !== settlement.approvalId
        || approvedWorkItem.snapshotId !== snapshot.snapshotId
        || !validVertexDisposition
        || !exactSpendEvidence
        || settlement.creditsHeldPendingReconciliation !== 0
        || settlement.creditsReleasedOrRefundedAtAttemptSettlement !== 0
        || settlement.exactTerminalAndAttemptCostReceiptReread !== true
        || settlement.serviceFeeSettledHere !== false
        || settlement.finalPlanSettlementStillRequired !== true
        || settlement.publicBillingAuthorityGranted !== false
        || settlement.productionAuthorityGranted !== false
        || [
          settlement.approvedToolCeilingCredits,
          settlement.customerChargedCredits,
          settlement.weeditproAbsorbedInfrastructureCostUsdNanos,
          settlement.unusedToolCeilingCreditsRetainedInSharedPlanReservation,
        ].some((value) => !Number.isInteger(value) || value < 0)
        || settlement.approvedToolCeilingCredits <= 0
        || !/^[a-f0-9]{64}$/u.test(settlement.vertexTerminalReadHash)
        || !/^[a-f0-9]{64}$/u.test(settlement.launchAuthorityHash)
        || !/^[a-f0-9]{64}$/u.test(settlement.executionRecordHash)
        || !/^[a-f0-9]{64}$/u.test(settlement.attemptCostReceiptHash)
        || settlementHash !== sha256Text(stableStringify(payload))
      ) throw new ApiError(
        'VALIDATION_FAILED',
        'Private edit authority Vertex A100 settlement is invalid.',
        409,
      )
      continue
    }
    const validDisposition = settlement.terminalOutcome ===
      'unknown_requires_reconciliation'
      ? settlement.settlementDisposition ===
          'held_without_charge_pending_reconciliation'
        && settlement.customerChargedCredits === 0
        && settlement.reservationSpendApplied === false
        && settlement.creditsHeldPendingReconciliation ===
          settlement.approvedToolCeilingCredits
        && settlement.unusedToolCeilingCreditsRetainedInSharedPlanReservation
          === 0
      : settlement.terminalOutcome === 'completed'
        ? settlement.settlementDisposition ===
            'charged_eligible_cost_to_shared_plan_reservation'
          && settlement.reservationSpendApplied ===
            (settlement.customerChargedCredits > 0)
          && settlement.creditsHeldPendingReconciliation === 0
          && settlement.customerChargedCredits
            + settlement
              .unusedToolCeilingCreditsRetainedInSharedPlanReservation
            === settlement.approvedToolCeilingCredits
        : settlement.terminalOutcome === 'reeditpro_failed'
          && settlement.settlementDisposition ===
            'no_charge_weeditpro_absorbed_failure'
          && settlement.customerChargedCredits === 0
          && settlement.reservationSpendApplied === false
          && settlement.creditsHeldPendingReconciliation === 0
          && settlement.unusedToolCeilingCreditsRetainedInSharedPlanReservation
            === settlement.approvedToolCeilingCredits
    if (
      settlement.schemaVersion !==
        'canonical-professional-gpu-attempt-credit-settlement-v1'
      || !reservation || !snapshot || !approvedWorkItem
      || snapshot.reservationId !== reservation.id
      || snapshot.approvalId !== settlement.approvalId
      || approvedWorkItem.snapshotId !== snapshot.snapshotId
      || !validDisposition
      || !exactSpendEvidence
      || settlement.creditsReleasedOrRefundedAtAttemptSettlement !== 0
      || settlement.exactTerminalAndAttemptCostReceiptReread !== true
      || settlement.serviceFeeSettledHere !== false
      || settlement.finalPlanSettlementStillRequired !== true
      || settlement.publicBillingAuthorityGranted !== false
      || settlement.productionAuthorityGranted !== false
      || [
        settlement.approvedToolCeilingCredits,
        settlement.customerChargedCredits,
        settlement.weeditproAbsorbedInfrastructureCostUsdNanos,
        settlement.unusedToolCeilingCreditsRetainedInSharedPlanReservation,
        settlement.creditsHeldPendingReconciliation,
      ].some((value) => !Number.isInteger(value) || value < 0)
      || settlement.approvedToolCeilingCredits <= 0
      || !/^[a-f0-9]{64}$/u.test(settlement.terminalBindingHash)
      || !/^[a-f0-9]{64}$/u.test(settlement.prelaunchRecordHash)
      || !/^[a-f0-9]{64}$/u.test(settlement.fundedDispatchAdmissionHash)
      || !/^[a-f0-9]{64}$/u.test(settlement.attemptCostReceiptHash)
      || settlementHash !== sha256Text(stableStringify(payload))
    ) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Private edit authority GPU attempt settlement is invalid.',
        409,
      )
    }
  }
  for (const identities of [
    aggregate.gpuAttemptCreditSettlements.map((record) =>
      record.attemptCostReceiptId),
    aggregate.gpuAttemptCreditSettlements.map((record) =>
      record.executionAttemptId),
    aggregate.gpuAttemptCreditSettlements.map((record) =>
      record.idempotencyKey),
  ]) {
    if (new Set(identities).size !== identities.length) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Private edit authority GPU attempt settlement is duplicated.',
        409,
      )
    }
  }
  for (const settlement of aggregate.gpuPlanFinalCreditSettlements) {
    assertGpuPlanFinalCreditSettlementValid(aggregate, settlement)
  }
  for (const identities of [
    aggregate.gpuPlanFinalCreditSettlements.map((record) =>
      record.snapshotId),
    aggregate.gpuPlanFinalCreditSettlements.map((record) =>
      record.reservationId),
    aggregate.gpuPlanFinalCreditSettlements.map((record) =>
      record.idempotencyKey),
  ]) {
    if (new Set(identities).size !== identities.length) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Private edit authority GPU final plan settlement is duplicated.',
        409,
      )
    }
  }
  if (new Set(aggregate.executionPackages.map((record) => record.snapshotId)).size !== aggregate.executionPackages.length) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate contains duplicate execution packages for one snapshot.', 409)
  }
  for (const snapshot of aggregate.snapshots) {
    if (
      snapshot.schemaVersion !== 'private-edit-authority-approved-snapshot-v3' ||
      !/^[a-f0-9]{64}$/.test(snapshot.approvedAssetManifestHash) ||
      !/^[a-f0-9]{64}$/.test(snapshot.approvedAssetManifestRef.sha256) ||
      !Number.isInteger(snapshot.approvedAssetManifestRef.byteLength) ||
      snapshot.approvedAssetManifestRef.byteLength <= 0
      || !/^[a-f0-9]{64}$/.test(snapshot.approvedSourceAssetManifestHash)
      || !/^[a-f0-9]{64}$/.test(snapshot.approvedSourceAssetManifestRef.sha256)
      || !Number.isInteger(snapshot.approvedSourceAssetManifestRef.byteLength)
      || snapshot.approvedSourceAssetManifestRef.byteLength <= 0
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Private edit authority approved asset-manifest reference is invalid.', 409)
    }
  }
  for (const plan of aggregate.plans) {
    const revision = plan.revisionAuthority
    if (!revision) continue
    const priorSnapshot = aggregate.snapshots.find((record) =>
      record.snapshotId === revision.priorApprovedSnapshotId)
    if (
      plan.planVersion <= revision.priorApprovedPlanVersion ||
      !priorSnapshot || priorSnapshot.planId !== revision.priorApprovedPlanId ||
      priorSnapshot.planVersion !== revision.priorApprovedPlanVersion ||
      priorSnapshot.projectId !== plan.projectId ||
      priorSnapshot.editSessionId !== plan.editSessionId ||
      !/^[a-f0-9]{64}$/.test(revision.decisionManifestSha256) ||
      !/^[a-f0-9]{64}$/.test(revision.revisionIntentHash) ||
      !plan.componentRefs.revisionAuthority ||
      !/^[a-f0-9]{64}$/.test(plan.componentRefs.revisionAuthority.sha256) ||
      !Number.isInteger(plan.componentRefs.revisionAuthority.byteLength) ||
      plan.componentRefs.revisionAuthority.byteLength <= 0
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical revision-plan authority lineage is invalid.', 409)
    }
  }
  for (const executionPackage of aggregate.executionPackages) {
    const snapshot = aggregate.snapshots.find((record) => record.snapshotId === executionPackage.snapshotId)
    if (
      !snapshot ||
      executionPackage.source !== 'canonical_edit_authority' ||
      executionPackage.purpose !== 'private_internal_execution_handoff' ||
      executionPackage.planId !== snapshot.planId ||
      executionPackage.estimateId !== snapshot.estimateId ||
      executionPackage.reservationId !== snapshot.reservationId ||
      executionPackage.projectId !== snapshot.projectId ||
      executionPackage.editSessionId !== snapshot.editSessionId ||
      executionPackage.snapshotHash !== snapshot.snapshotHash ||
      executionPackage.planHash !== snapshot.planHash ||
      executionPackage.estimateHash !== snapshot.estimateHash ||
      executionPackage.workGraphHash !== snapshot.workGraphHash ||
      executionPackage.approvedAssetManifestHash !== snapshot.approvedAssetManifestHash ||
      executionPackage.approvedSourceAssetManifestHash !== snapshot.approvedSourceAssetManifestHash ||
      executionPackage.createdByUserId !== aggregate.ownerUserId ||
      !/^[a-f0-9]{64}$/.test(executionPackage.toolCapabilityManifestRef.sha256) ||
      !Number.isInteger(executionPackage.toolCapabilityManifestRef.byteLength) ||
      executionPackage.toolCapabilityManifestRef.byteLength <= 0
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Private edit authority execution-package lineage is invalid.', 409)
    }
    const { packageHash, ...packageWithoutHash } = executionPackage
    if (packageHash !== sha256Text(stableStringify(packageWithoutHash))) {
      throw new ApiError('VALIDATION_FAILED', 'Private edit authority execution-package hash is invalid.', 409)
    }
  }
  for (const planWorkItem of aggregate.planWorkItems) {
    assertExpectedOutputContract(planWorkItem)
  }
  for (const approvedWorkItem of aggregate.approvedWorkItems) {
    assertExpectedOutputContract(approvedWorkItem)
    const snapshot = aggregate.snapshots.find((record) => record.snapshotId === approvedWorkItem.snapshotId)
    if (!snapshot) {
      throw new ApiError('VALIDATION_FAILED', 'Approved work item snapshot lineage is invalid.', 409)
    }
  }
  for (const job of aggregate.jobs) {
    const workItem = aggregate.approvedWorkItems.find((record) => record.id === job.approvedWorkItemId)
    if (
      !workItem ||
      workItem.snapshotId !== job.snapshotId ||
      stableStringify(job.sourceSequenceItemIds) !== stableStringify(workItem.sourceSequenceItemIds) ||
      stableStringify(job.sourceCleanupDecisionIds) !== stableStringify(workItem.sourceCleanupDecisionIds) ||
      job.expectedAssetIds.length !== workItem.expectedOutputs.length ||
      new Set(job.expectedAssetIds).size !== job.expectedAssetIds.length
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical job source/output lineage is invalid.', 409)
    }
  }
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(aggregate)
  if (secretLikePaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Private edit authority aggregate contains secret-like fields or values.', 409, {
      secretLikePaths,
    })
  }
}

function assertExpectedOutputContract(
  workItem: Pick<
    AuthorityPlanWorkItemRecord,
    'sourceSequenceItemIds' | 'sourceCleanupDecisionIds' | 'expectedOutputs'
  >,
): void {
  if (
    new Set(workItem.sourceSequenceItemIds).size !== workItem.sourceSequenceItemIds.length ||
    new Set(workItem.sourceCleanupDecisionIds).size !== workItem.sourceCleanupDecisionIds.length ||
    workItem.expectedOutputs.length === 0 ||
    new Set(workItem.expectedOutputs.map((output) => output.outputKey)).size !== workItem.expectedOutputs.length
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work item source/output contract is invalid.', 409)
  }
  for (const output of workItem.expectedOutputs) {
    if (
      !output.outputKey ||
      !output.artifactType ||
      (output.assetRole === 'final' && output.previewPlaceholderAllowed) ||
      new Set(output.segmentIds).size !== output.segmentIds.length ||
      new Set(output.timingIds).size !== output.timingIds.length ||
      new Set(output.rendererLayerIds).size !== output.rendererLayerIds.length
    ) {
      throw new ApiError('VALIDATION_FAILED', 'Canonical expected output metadata is invalid.', 409)
    }
  }
}

function assertGpuPlanFinalCreditSettlementValid(
  aggregate: PrivateEditAuthorityAggregate,
  settlement: AuthorityGpuPlanFinalCreditSettlementRecord,
): void {
  const reservation = aggregate.reservations.find((record) =>
    record.id === settlement.reservationId)
  const snapshot = aggregate.snapshots.find((record) =>
    record.snapshotId === settlement.snapshotId)
  const plan = aggregate.plans.find((record) =>
    record.id === settlement.planId)
  const estimate = aggregate.estimates.find((record) =>
    record.id === settlement.estimateId)
  const approval = aggregate.approvals.find((record) =>
    record.id === settlement.approvalId)
  const { settlementHash, ...payload } = settlement
  const workKeys = settlement.workBindings.map((binding) =>
    binding.workItemKey)
  const workIds = settlement.workBindings.map((binding) =>
    binding.approvedWorkItemId)
  const completedAttemptIds = settlement.workBindings.map((binding) =>
    binding.completedAttemptSettlementId)
  const allAttemptIds = settlement.workBindings.flatMap((binding) =>
    binding.attemptSettlementIds)
  const allAttemptHashes = settlement.workBindings.flatMap((binding) =>
    binding.attemptSettlementHashes)
  const bindingsValid = settlement.workBindings.length > 0
    && new Set(workKeys).size === workKeys.length
    && workKeys.every((key, index) => index === 0
      || workKeys[index - 1]! < key)
    && new Set(workIds).size === workIds.length
    && new Set(completedAttemptIds).size === completedAttemptIds.length
    && new Set(allAttemptIds).size === allAttemptIds.length
    && allAttemptIds.length === allAttemptHashes.length
    && settlement.workBindings.every((binding) => {
      const approvedWork = aggregate.approvedWorkItems.find((record) =>
        record.id === binding.approvedWorkItemId)
      const attempts = binding.attemptSettlementIds.map((id) =>
        aggregate.gpuAttemptCreditSettlements.find((record) =>
          record.id === id))
      const completed = attempts.filter((attempt) =>
        attempt?.terminalOutcome === 'completed')
      return Boolean(
        approvedWork
        && approvedWork.snapshotId === settlement.snapshotId
        && approvedWork.workItemKey === binding.workItemKey
        && binding.approvedToolCeilingCredits ===
          approvedWork.maximumCreditBudget
        && binding.attemptSettlementIds.length > 0
        && binding.attemptSettlementIds.length ===
          binding.attemptSettlementHashes.length
        && binding.attemptSettlementIds.every((id, index) => index === 0
          || binding.attemptSettlementIds[index - 1]! < id)
        && attempts.every((attempt, index) => attempt
          && attempt.settlementHash === binding.attemptSettlementHashes[index]
          && attempt.snapshotId === settlement.snapshotId
          && attempt.reservationId === settlement.reservationId
          && attempt.approvedWorkItemId === binding.approvedWorkItemId
          && attempt.terminalOutcome !== 'unknown_requires_reconciliation')
        && completed.length === 1
        && completed[0]!.id === binding.completedAttemptSettlementId
        && binding.customerChargedToolCredits === attempts.reduce(
          (total, attempt) => total + attempt!.customerChargedCredits,
          0,
        )
      )
    })
  const actualToolCredits = settlement.workBindings.reduce(
    (total, binding) => total + binding.customerChargedToolCredits,
    0,
  )
  const grossFinalCharge = settlement.actualBillableGpuToolCostCredits
    + settlement.calculatedServiceFeeCredits
  const finalCustomerCharge = Math.min(
    grossFinalCharge,
    settlement.approvedMaximumCredits,
  )
  const expectedIncrementalSpend = finalCustomerCharge
    - settlement.customerCreditsSpentBeforeFinalSettlement
  const expectedRelease = settlement.approvedMaximumCredits
    - finalCustomerCharge
  const serviceFeeLedger = aggregate.ledgerEntries.filter((record) =>
    record.sourceType ===
      'canonical_professional_gpu_plan_final_credit_settlement'
    && record.sourceId === settlement.id
    && record.idempotencyKey === `${settlement.idempotencyKey}:service-fee`)
  const serviceFeeEvents = aggregate.reservationEvents.filter((record) =>
    record.reservationId === settlement.reservationId
    && record.idempotencyKey ===
      `${settlement.idempotencyKey}:service-fee`
    && record.eventType === 'spent')
  const releaseLedger = aggregate.ledgerEntries.filter((record) =>
    record.sourceType ===
      'canonical_professional_gpu_plan_final_credit_settlement'
    && record.sourceId === settlement.id
    && record.idempotencyKey === `${settlement.idempotencyKey}:release`)
  const releaseEvents = aggregate.reservationEvents.filter((record) =>
    record.reservationId === settlement.reservationId
    && record.idempotencyKey === `${settlement.idempotencyKey}:release`
    && record.eventType === 'released')
  const spendEvidenceValid = expectedIncrementalSpend > 0
    ? serviceFeeLedger.length === 1
      && serviceFeeLedger[0]!.entryType === 'spend'
      && serviceFeeLedger[0]!.availableDelta === 0
      && serviceFeeLedger[0]!.reservedDelta === -expectedIncrementalSpend
      && serviceFeeLedger[0]!.spentDelta === expectedIncrementalSpend
      && serviceFeeEvents.length === 1
      && serviceFeeEvents[0]!.credits === expectedIncrementalSpend
    : serviceFeeLedger.length === 0 && serviceFeeEvents.length === 0
  const releaseEvidenceValid = expectedRelease > 0
    ? releaseLedger.length === 1
      && releaseLedger[0]!.entryType === 'release'
      && releaseLedger[0]!.availableDelta === expectedRelease
      && releaseLedger[0]!.reservedDelta === -expectedRelease
      && releaseLedger[0]!.spentDelta === 0
      && releaseEvents.length === 1
      && releaseEvents[0]!.credits === expectedRelease
    : releaseLedger.length === 0 && releaseEvents.length === 0
  if (
    settlement.schemaVersion !==
      'canonical-professional-gpu-plan-final-credit-settlement-v1'
    || !reservation || !snapshot || !plan || !estimate || !approval
    || snapshot.planId !== plan.id
    || snapshot.estimateId !== estimate.id
    || snapshot.approvalId !== approval.id
    || snapshot.reservationId !== reservation.id
    || approval.planId !== plan.id
    || approval.estimateId !== estimate.id
    || approval.snapshotId !== snapshot.snapshotId
    || approval.reservationId !== reservation.id
    || reservation.planId !== plan.id
    || reservation.estimateId !== estimate.id
    || reservation.snapshotId !== snapshot.snapshotId
    || reservation.approvalId !== approval.id
    || reservation.reservedCredits !== settlement.approvedMaximumCredits
    || reservation.spentCredits !== settlement.customerTotalChargedCredits
    || reservation.releasedCredits !==
      settlement.unusedReservationCreditsReleased
    || reservation.refundedCredits !== 0
    || reservation.status !== (expectedRelease > 0 ? 'released' : 'spent')
    || !bindingsValid
    || actualToolCredits !== settlement.actualBillableGpuToolCostCredits
    || grossFinalCharge !== settlement.grossFinalChargeCredits
    || settlement.customerCreditsSpentBeforeFinalSettlement !==
      settlement.actualBillableGpuToolCostCredits
    || expectedIncrementalSpend < 0
    || settlement.customerServiceFeeCreditsChargedAtFinalSettlement !==
      expectedIncrementalSpend
    || settlement.customerTotalChargedCredits !== finalCustomerCharge
    || settlement.weeditproAbsorbedOverageCredits !==
      grossFinalCharge - finalCustomerCharge
    || settlement.unusedReservationCreditsReleased !== expectedRelease
    || settlement.unknownGpuAttemptOutcomeCount !== 0
    || settlement.allPricedGpuWorkCompletedExactlyOnce !== true
    || settlement.exactApprovedEstimateAndServiceFeePolicyReread !== true
    || settlement.exactAttemptSettlementSetReread !== true
    || settlement.exactPrivateCompletionReadinessReread !== true
    || settlement.activeGpuInstancesAtFinalSettlement !== 0
    || settlement.reservationFinalized !== true
    || settlement.privateInternalWalletMutated !== true
    || settlement.externalCustomerWalletMutated !== false
    || settlement.publicBillingAuthorityGranted !== false
    || settlement.publicDeliveryAuthorityGranted !== false
    || settlement.productionAuthorityGranted !== false
    || !spendEvidenceValid
    || !releaseEvidenceValid
    || [
      settlement.actualBillableGpuToolCostCredits,
      settlement.calculatedServiceFeeCredits,
      settlement.grossFinalChargeCredits,
      settlement.approvedMaximumCredits,
      settlement.customerCreditsSpentBeforeFinalSettlement,
      settlement.customerServiceFeeCreditsChargedAtFinalSettlement,
      settlement.customerTotalChargedCredits,
      settlement.weeditproAbsorbedOverageCredits,
      settlement.unusedReservationCreditsReleased,
    ].some((value) => !Number.isInteger(value) || value < 0)
    || !/^[a-f0-9]{64}$/u.test(settlement.pricingAuthorityBundleHash)
    || !/^[a-f0-9]{64}$/u.test(settlement.finalReadinessObservationHash)
    || settlementHash !== sha256Text(stableStringify(payload))
  ) throw new ApiError(
    'VALIDATION_FAILED',
    'Private edit authority GPU final plan settlement is invalid.',
    409,
  )
}

function authorityAggregatePath(ownerUserId: string, workspaceId: string): string {
  return join(
    'edit-authority',
    'private-internal-authority-v1',
    authorityScopeHash(ownerUserId, workspaceId),
    'aggregate.json',
  ).split('/').join('/')
}

function authorityBlobPath(sha256: string): string {
  return join('edit-authority', 'blobs', 'sha256', sha256.slice(0, 2), `${sha256}.json`).split('/').join('/')
}

function authorityScopeHash(ownerUserId: string, workspaceId: string): string {
  return sha256Text(`${ownerUserId}\n${workspaceId}`)
}

async function withProcessLock<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolveGate) => { release = resolveGate })
  const tail = previous.then(() => gate)
  locks.set(key, tail)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (locks.get(key) === tail) locks.delete(key)
  }
}

function parseJson(content: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', `${label} is not valid JSON.`, 409)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError('VALIDATION_FAILED', `${label} is not an object.`, 409)
  }
  return parsed as Record<string, unknown>
}

export function stableAuthorityStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}

export function sha256AuthorityValue(value: unknown): string {
  return sha256Text(stableAuthorityStringify(value))
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function walletBalanceAfter(wallet: AuthorityWalletBalance): AuthorityLedgerEntry['balanceAfter'] {
  return {
    availableCredits: wallet.availableCredits,
    reservedCredits: wallet.reservedCredits,
    spentCredits: wallet.spentCredits,
    refundedCredits: wallet.refundedCredits,
  }
}
