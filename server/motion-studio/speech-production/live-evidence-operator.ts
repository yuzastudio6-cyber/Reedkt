import { ApiError } from '../../errors/api-error'
import {
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'

const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/

export type MotionStudioSpeechC2EvidenceOperatorState =
  | 'unprepared'
  | 'ready_for_single_submission'
  | 'response_received_pending_private_ingest'
  | 'candidate_persisted_pending_cost_reconciliation'
  | 'candidate_reconciled_pending_owner_review'
  | 'terminal_provider_rejected_pending_reconciliation'
  | 'terminal_unrecognized_response_pending_reconciliation'
  | 'terminal_outcome_unknown_pending_reconciliation'
  | 'complete_passed_for_ms012e_selection'
  | 'complete_rejected'
  | 'stopped'

export type MotionStudioSpeechC2EvidenceOperatorCommand =
  | 'status'
  | 'prepare'
  | 'submit'
  | 'ingest'
  | 'reconcile-cost'
  | 'record-owner-review'
  | 'stop'

export interface MotionStudioSpeechC2OperatorPreparationReceipt {
  schemaVersion: 'motion-studio.speech-c2-operator-preparation.v1'
  executionAuthorityDigest: string
  preflightDigest: string
  providerCallCount: 0
  credentialValueRead: false
  purchasePerformed: false
  readyForSingleSubmission: true
  immutable: true
}

export interface MotionStudioSpeechC2OperatorSubmissionReceipt {
  schemaVersion: 'motion-studio.speech-c2-operator-submission.v1'
  outcome: 'response_received' | 'provider_rejected' | 'unrecognized_response' | 'outcome_unknown'
  executionAuthorityDigest: string
  transportPermitDigest: string
  operationId: string
  providerCallCount: 1
  permitConsumed: true
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  privateLocalReviewOnly: true
  immutable: true
}

export interface MotionStudioSpeechC2OperatorIngestReceipt {
  schemaVersion: 'motion-studio.speech-c2-operator-ingest.v1'
  executionAuthorityDigest: string
  transportPermitDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  evidenceObjectIdentityHash: string
  normalizedAudioSha256: string
  providerCallCount: 1
  rawProviderResponsePersisted: false
  rawProviderAudioPersisted: false
  normalizedAudioPersisted: true
  selected: false
  finalAssetEligible: false
  timelineMutationPerformed: false
  immutable: true
}

export interface MotionStudioSpeechC2OperatorCostReconciliationReceipt {
  schemaVersion: 'motion-studio.speech-c2-operator-cost-reconciliation.v1'
  executionAuthorityDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  costState: 'reconciled_provider_account_delta'
  accountUsageBaselineEvidenceId: string
  accountUsageCompletionEvidenceId: string
  providerRateCardSnapshotId: string
  providerRateCardSnapshotDigest: string
  providerUsageEvidenceId: string
  providerUsageEvidenceDigest: string
  localComputeUsageEvidenceId: string
  localComputeUsageEvidenceDigest: string
  localComputeCostAuthorityDigest: string
  localComputeRateCardSnapshotId: string
  localComputeRateCardSnapshotDigest: string
  infrastructureMeterEvidenceDigest: string
  localComputeCostEvidenceDigest: string
  meteredCpuMicroseconds: number
  localComputeRoundingRule: 'ceil_cpu_microsecond_usd_micro'
  providerCharacterCostMicrocredits: number
  accountUsageDeltaMicrocredits: number
  providerCostMicros: number
  localComputeCostMicros: number
  totalInternalProductionCostMicros: number
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedLocalComputeCostMicros: number
  maximumAuthorizedTotalInternalCostMicros: number
  providerAccountReadCount: 1
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  billingMutationPerformed: false
  costEvidenceDigest: string
  immutable: true
}

export interface MotionStudioSpeechC2OperatorReviewReceipt {
  schemaVersion: 'motion-studio.speech-c2-operator-review.v1'
  state: 'provider_review_complete_awaiting_ms012e_selection' | 'provider_reviewed_rejected'
  executionAuthorityDigest: string
  candidateTakeId: string
  postResponseEvidenceDigest: string
  costState: 'reconciled_provider_account_delta'
  costEvidenceDigest: string
  ownerReviewRecorded: true
  allListeningGatesResolved: true
  eligibleForExplicitSelection: boolean
  selectionDecisionCreated: false
  selected: false
  finalAssetEligible: false
  timelineMutationPerformed: false
  immutable: true
}

export interface MotionStudioSpeechC2EvidenceOperatorHandlers {
  prepare(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  }): Promise<MotionStudioSpeechC2OperatorPreparationReceipt>
  submit(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  }): Promise<MotionStudioSpeechC2OperatorSubmissionReceipt>
  ingest(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
    submission: MotionStudioSpeechC2OperatorSubmissionReceipt
  }): Promise<MotionStudioSpeechC2OperatorIngestReceipt>
  reconcileCost(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
    ingest: MotionStudioSpeechC2OperatorIngestReceipt
  }): Promise<MotionStudioSpeechC2OperatorCostReconciliationReceipt>
  recordOwnerReview(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
    ingest: MotionStudioSpeechC2OperatorIngestReceipt
    costReconciliation: MotionStudioSpeechC2OperatorCostReconciliationReceipt
  }): Promise<MotionStudioSpeechC2OperatorReviewReceipt>
  stop(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
    reason: string
  }): Promise<void>
}

export interface MotionStudioSpeechC2EvidenceOperatorSnapshot {
  state: MotionStudioSpeechC2EvidenceOperatorState
  allowedCommands: readonly MotionStudioSpeechC2EvidenceOperatorCommand[]
  executionAuthorityDigest: string
  preflightDigest: string
  maximumAuthorizedProviderCostMicros: number
  maximumAuthorizedLocalComputeCostMicros: number
  maximumAuthorizedTotalInternalCostMicros: number
  providerSubmissionCount: 0 | 1
  providerAccountReadCount: 0 | 1
  costReconciled: boolean
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
  purchaseOrRechargeAllowed: false
  customerPricingIncluded: false
  customerCreditsIncluded: false
  finalSelectionAllowed: false
  timelineMutationAllowed: false
  privateLocalReviewOnly: true
  stoppedReason?: string
}

/**
 * Manual, process-local sequencer for one future MS-012C2 provider evidence
 * attempt. It coordinates trusted server handlers but is not itself provider,
 * credential, persistence, cost, review, or selection authority.
 *
 * Every transition requires an explicit command. There are no loops, timers,
 * retries, fallbacks, automatic selection, or implicit continuation after a
 * non-success transport outcome. The exact downstream speech contracts remain
 * responsible for transport provenance, private ingest, cost reconciliation,
 * listening review, and immutable evidence.
 */
export class MotionStudioSpeechC2LiveEvidenceOperator {
  private readonly authority: MotionStudioSpeechC2ExecutionAuthorityV1
  private readonly handlers: MotionStudioSpeechC2EvidenceOperatorHandlers
  private state: MotionStudioSpeechC2EvidenceOperatorState = 'unprepared'
  private executing = false
  private submissionCount: 0 | 1 = 0
  private accountReadCount: 0 | 1 = 0
  private submission: MotionStudioSpeechC2OperatorSubmissionReceipt | undefined
  private ingestReceipt: MotionStudioSpeechC2OperatorIngestReceipt | undefined
  private costReconciliationReceipt: MotionStudioSpeechC2OperatorCostReconciliationReceipt | undefined
  private stoppedReason: string | undefined

  constructor(input: {
    executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
    handlers: MotionStudioSpeechC2EvidenceOperatorHandlers
  }) {
    assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(input.executionAuthority)
    this.authority = input.executionAuthority
    this.handlers = input.handlers
  }

  snapshot(): MotionStudioSpeechC2EvidenceOperatorSnapshot {
    return Object.freeze({
      state: this.state,
      allowedCommands: Object.freeze([...allowedCommands(this.state)]),
      executionAuthorityDigest: this.authority.authorityDigest,
      preflightDigest: this.authority.preflightDigest,
      maximumAuthorizedProviderCostMicros: this.authority.maximumAuthorizedProviderCostMicros,
      maximumAuthorizedLocalComputeCostMicros:
        this.authority.maximumAuthorizedLocalComputeCostMicros,
      maximumAuthorizedTotalInternalCostMicros:
        this.authority.maximumAuthorizedTotalInternalCostMicros,
      providerSubmissionCount: this.submissionCount,
      providerAccountReadCount: this.accountReadCount,
      costReconciled: Boolean(this.costReconciliationReceipt),
      automaticRetryAllowed: false,
      automaticFallbackAllowed: false,
      purchaseOrRechargeAllowed: false,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
      finalSelectionAllowed: false,
      timelineMutationAllowed: false,
      privateLocalReviewOnly: true,
      ...(this.stoppedReason ? { stoppedReason: this.stoppedReason } : {}),
    })
  }

  async execute(
    command: MotionStudioSpeechC2EvidenceOperatorCommand,
  ): Promise<MotionStudioSpeechC2EvidenceOperatorSnapshot> {
    if (command === 'status') return this.snapshot()
    if (this.executing) throw blocked('Another speech evidence operator command is already in progress.')
    if (!allowedCommands(this.state).includes(command)) {
      throw blocked(`Speech evidence command ${command} is not allowed while the operator is ${this.state}.`)
    }
    this.executing = true
    try {
      await this.executeAllowed(command)
      return this.snapshot()
    } catch (error) {
      this.state = 'stopped'
      this.stoppedReason = safeFailureReason(error)
      if (command !== 'stop') {
        try {
          await this.handlers.stop({
            executionAuthority: this.authority,
            reason: this.stoppedReason,
          })
        } catch {
          // Preserve the original failure. A stop hook never retries,
          // submits, ingests, reconciles, or selects on the operator's behalf.
        }
      }
      throw error
    } finally {
      this.executing = false
    }
  }

  private async executeAllowed(
    command: Exclude<MotionStudioSpeechC2EvidenceOperatorCommand, 'status'>,
  ): Promise<void> {
    switch (command) {
      case 'prepare': {
        const receipt = await this.handlers.prepare({ executionAuthority: this.authority })
        assertPreparationReceipt(receipt, this.authority)
        this.state = 'ready_for_single_submission'
        return
      }
      case 'submit': {
        if (this.submissionCount !== 0) blocked('The speech evidence provider submission has already been consumed.')
        // Consume before invoking the handler. Any failure or unknown outcome
        // remains terminal and cannot restore or retry this submission.
        this.submissionCount = 1
        const receipt = await this.handlers.submit({ executionAuthority: this.authority })
        assertSubmissionReceipt(receipt, this.authority)
        this.submission = deepFreeze(receipt)
        this.state = submissionState(receipt.outcome)
        return
      }
      case 'ingest': {
        if (!this.submission || this.submission.outcome !== 'response_received') {
          blocked('Speech private ingest requires the exact recognized submission receipt.')
        }
        const receipt = await this.handlers.ingest({
          executionAuthority: this.authority,
          submission: this.submission,
        })
        assertIngestReceipt(receipt, this.authority, this.submission)
        this.ingestReceipt = deepFreeze(receipt)
        this.state = 'candidate_persisted_pending_cost_reconciliation'
        return
      }
      case 'reconcile-cost': {
        if (!this.ingestReceipt) blocked('Speech cost reconciliation requires the exact private ingest receipt.')
        if (this.accountReadCount !== 0) blocked('The speech account-usage completion read has already been consumed.')
        // Consume before invoking the handler. A timeout, malformed response,
        // mismatch, or invalid receipt cannot be hidden by repeating the read.
        this.accountReadCount = 1
        const receipt = await this.handlers.reconcileCost({
          executionAuthority: this.authority,
          ingest: this.ingestReceipt,
        })
        assertCostReconciliationReceipt(receipt, this.authority, this.ingestReceipt)
        this.costReconciliationReceipt = deepFreeze(receipt)
        this.state = 'candidate_reconciled_pending_owner_review'
        return
      }
      case 'record-owner-review': {
        if (!this.ingestReceipt || !this.costReconciliationReceipt) {
          blocked('Speech owner review requires exact private ingest and cost-reconciliation receipts.')
        }
        const receipt = await this.handlers.recordOwnerReview({
          executionAuthority: this.authority,
          ingest: this.ingestReceipt,
          costReconciliation: this.costReconciliationReceipt,
        })
        assertReviewReceipt(receipt, this.authority, this.ingestReceipt, this.costReconciliationReceipt)
        this.state = receipt.state === 'provider_reviewed_rejected'
          ? 'complete_rejected'
          : 'complete_passed_for_ms012e_selection'
        return
      }
      case 'stop':
        await this.handlers.stop({
          executionAuthority: this.authority,
          reason: 'operator_stopped_without_automatic_recovery',
        })
        this.state = 'stopped'
        this.stoppedReason = 'operator_stopped_without_automatic_recovery'
        return
    }
  }
}

function assertPreparationReceipt(
  receipt: MotionStudioSpeechC2OperatorPreparationReceipt,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  if (
    !receipt || receipt.schemaVersion !== 'motion-studio.speech-c2-operator-preparation.v1' ||
    receipt.executionAuthorityDigest !== authority.authorityDigest ||
    receipt.preflightDigest !== authority.preflightDigest || receipt.providerCallCount !== 0 ||
    receipt.credentialValueRead !== false || receipt.purchasePerformed !== false ||
    receipt.readyForSingleSubmission !== true || receipt.immutable !== true
  ) blocked('Speech operator preparation receipt does not bind the exact unspent execution authority.')
  assertFrozenReceipt(receipt, 'Speech operator preparation receipt')
}

function assertSubmissionReceipt(
  receipt: MotionStudioSpeechC2OperatorSubmissionReceipt,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
): void {
  if (
    !receipt || receipt.schemaVersion !== 'motion-studio.speech-c2-operator-submission.v1' ||
    !['response_received', 'provider_rejected', 'unrecognized_response', 'outcome_unknown'].includes(receipt.outcome) ||
    receipt.executionAuthorityDigest !== authority.authorityDigest || !SHA256.test(receipt.transportPermitDigest) ||
    !STABLE_ID.test(receipt.operationId) || receipt.providerCallCount !== 1 ||
    receipt.permitConsumed !== true || receipt.automaticRetryAllowed !== false ||
    receipt.automaticFallbackAllowed !== false || receipt.privateLocalReviewOnly !== true ||
    receipt.immutable !== true
  ) blocked('Speech operator submission receipt is outside the one-call private evidence contract.')
  assertFrozenReceipt(receipt, 'Speech operator submission receipt')
}

function assertIngestReceipt(
  receipt: MotionStudioSpeechC2OperatorIngestReceipt,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  submission: MotionStudioSpeechC2OperatorSubmissionReceipt,
): void {
  if (
    !receipt || receipt.schemaVersion !== 'motion-studio.speech-c2-operator-ingest.v1' ||
    receipt.executionAuthorityDigest !== authority.authorityDigest ||
    receipt.transportPermitDigest !== submission.transportPermitDigest ||
    !STABLE_ID.test(receipt.candidateTakeId) || !SHA256.test(receipt.postResponseEvidenceDigest) ||
    !SHA256.test(receipt.evidenceObjectIdentityHash) || !SHA256.test(receipt.normalizedAudioSha256) ||
    receipt.providerCallCount !== 1 || receipt.rawProviderResponsePersisted !== false ||
    receipt.rawProviderAudioPersisted !== false || receipt.normalizedAudioPersisted !== true ||
    receipt.selected !== false || receipt.finalAssetEligible !== false ||
    receipt.timelineMutationPerformed !== false || receipt.immutable !== true
  ) blocked('Speech operator private ingest receipt is outside the exact non-selection contract.')
  assertFrozenReceipt(receipt, 'Speech operator private ingest receipt')
}

function assertReviewReceipt(
  receipt: MotionStudioSpeechC2OperatorReviewReceipt,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  ingest: MotionStudioSpeechC2OperatorIngestReceipt,
  cost: MotionStudioSpeechC2OperatorCostReconciliationReceipt,
): void {
  const passed = receipt?.state === 'provider_review_complete_awaiting_ms012e_selection'
  const rejected = receipt?.state === 'provider_reviewed_rejected'
  if (
    !receipt || receipt.schemaVersion !== 'motion-studio.speech-c2-operator-review.v1' ||
    (!passed && !rejected) || receipt.executionAuthorityDigest !== authority.authorityDigest ||
    receipt.candidateTakeId !== ingest.candidateTakeId ||
    receipt.postResponseEvidenceDigest !== ingest.postResponseEvidenceDigest ||
    receipt.costState !== 'reconciled_provider_account_delta' ||
    receipt.costEvidenceDigest !== cost.costEvidenceDigest || receipt.ownerReviewRecorded !== true ||
    receipt.allListeningGatesResolved !== true ||
    receipt.eligibleForExplicitSelection !== passed || receipt.selectionDecisionCreated !== false ||
    receipt.selected !== false || receipt.finalAssetEligible !== false ||
    receipt.timelineMutationPerformed !== false || receipt.immutable !== true
  ) blocked('Speech operator review receipt does not bind exact reconciled owner-review evidence.')
  assertFrozenReceipt(receipt, 'Speech operator review receipt')
}

function assertCostReconciliationReceipt(
  receipt: MotionStudioSpeechC2OperatorCostReconciliationReceipt,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  ingest: MotionStudioSpeechC2OperatorIngestReceipt,
): void {
  if (
    !receipt || receipt.schemaVersion !== 'motion-studio.speech-c2-operator-cost-reconciliation.v1' ||
    receipt.executionAuthorityDigest !== authority.authorityDigest ||
    receipt.candidateTakeId !== ingest.candidateTakeId ||
    receipt.postResponseEvidenceDigest !== ingest.postResponseEvidenceDigest ||
    receipt.costState !== 'reconciled_provider_account_delta' ||
    receipt.accountUsageBaselineEvidenceId !== authority.accountUsageBaselineEvidenceId ||
    !STABLE_ID.test(receipt.accountUsageCompletionEvidenceId) ||
    receipt.accountUsageCompletionEvidenceId === receipt.accountUsageBaselineEvidenceId ||
    receipt.providerRateCardSnapshotId !== authority.providerRateCardSnapshotId ||
    !SHA256.test(receipt.providerRateCardSnapshotDigest) ||
    !STABLE_ID.test(receipt.providerUsageEvidenceId) ||
    !SHA256.test(receipt.providerUsageEvidenceDigest) ||
    !STABLE_ID.test(receipt.localComputeUsageEvidenceId) ||
    !SHA256.test(receipt.localComputeUsageEvidenceDigest) ||
    !SHA256.test(receipt.localComputeCostAuthorityDigest) ||
    !STABLE_ID.test(receipt.localComputeRateCardSnapshotId) ||
    !SHA256.test(receipt.localComputeRateCardSnapshotDigest) ||
    !SHA256.test(receipt.infrastructureMeterEvidenceDigest) ||
    !SHA256.test(receipt.localComputeCostEvidenceDigest) ||
    !Number.isSafeInteger(receipt.meteredCpuMicroseconds) ||
    receipt.meteredCpuMicroseconds < 1 || receipt.meteredCpuMicroseconds > 500_000_000 ||
    receipt.localComputeRoundingRule !== 'ceil_cpu_microsecond_usd_micro' ||
    !Number.isSafeInteger(receipt.providerCharacterCostMicrocredits) ||
    receipt.providerCharacterCostMicrocredits < 1 ||
    receipt.accountUsageDeltaMicrocredits !== receipt.providerCharacterCostMicrocredits ||
    !Number.isSafeInteger(receipt.providerCostMicros) || receipt.providerCostMicros < 0 ||
    receipt.providerCostMicros > authority.maximumAuthorizedProviderCostMicros ||
    !Number.isSafeInteger(receipt.localComputeCostMicros) || receipt.localComputeCostMicros < 0 ||
    receipt.localComputeCostMicros > receipt.maximumAuthorizedLocalComputeCostMicros ||
    !Number.isSafeInteger(receipt.totalInternalProductionCostMicros) ||
    receipt.totalInternalProductionCostMicros !==
      receipt.providerCostMicros + receipt.localComputeCostMicros ||
    receipt.maximumAuthorizedProviderCostMicros !== authority.maximumAuthorizedProviderCostMicros ||
    receipt.maximumAuthorizedLocalComputeCostMicros !==
      authority.maximumAuthorizedLocalComputeCostMicros ||
    receipt.maximumAuthorizedTotalInternalCostMicros !==
      authority.maximumAuthorizedTotalInternalCostMicros ||
    receipt.maximumAuthorizedTotalInternalCostMicros !==
      receipt.maximumAuthorizedProviderCostMicros + receipt.maximumAuthorizedLocalComputeCostMicros ||
    receipt.totalInternalProductionCostMicros > receipt.maximumAuthorizedTotalInternalCostMicros ||
    receipt.providerAccountReadCount !== 1 || receipt.automaticRetryAllowed !== false ||
    receipt.automaticFallbackAllowed !== false || receipt.customerPricingIncluded !== false ||
    receipt.customerCreditsIncluded !== false || receipt.serviceFeeIncluded !== false ||
    receipt.billingMutationPerformed !== false || !SHA256.test(receipt.costEvidenceDigest) ||
    receipt.immutable !== true
  ) blocked('Speech operator cost receipt does not bind exact account usage and internal-cost evidence.')
  assertFrozenReceipt(receipt, 'Speech operator cost reconciliation receipt')
}

function assertFrozenReceipt(value: object, label: string): void {
  if (!Object.isFrozen(value)) blocked(`${label} must be frozen before the operator accepts it.`)
}

function submissionState(
  outcome: MotionStudioSpeechC2OperatorSubmissionReceipt['outcome'],
): MotionStudioSpeechC2EvidenceOperatorState {
  if (outcome === 'response_received') return 'response_received_pending_private_ingest'
  if (outcome === 'provider_rejected') return 'terminal_provider_rejected_pending_reconciliation'
  if (outcome === 'unrecognized_response') return 'terminal_unrecognized_response_pending_reconciliation'
  return 'terminal_outcome_unknown_pending_reconciliation'
}

function allowedCommands(
  state: MotionStudioSpeechC2EvidenceOperatorState,
): readonly MotionStudioSpeechC2EvidenceOperatorCommand[] {
  switch (state) {
    case 'unprepared': return ['status', 'prepare', 'stop']
    case 'ready_for_single_submission': return ['status', 'submit', 'stop']
    // After a provider submission, the operator never offers an abandon,
    // retry, or fallback command. Recognized output must move forward into
    // private ingest and review; non-success outcomes remain visibly terminal
    // for separate reconciliation.
    case 'response_received_pending_private_ingest': return ['status', 'ingest']
    case 'candidate_persisted_pending_cost_reconciliation': return ['status', 'reconcile-cost']
    case 'candidate_reconciled_pending_owner_review': return ['status', 'record-owner-review']
    case 'terminal_provider_rejected_pending_reconciliation':
    case 'terminal_unrecognized_response_pending_reconciliation':
    case 'terminal_outcome_unknown_pending_reconciliation':
      return ['status']
    case 'complete_passed_for_ms012e_selection':
    case 'complete_rejected':
    case 'stopped':
      return ['status']
  }
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function safeFailureReason(error: unknown): string {
  if (error instanceof ApiError) return `operator_failed_${error.code.toLowerCase()}`
  return 'operator_failed_error'
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
