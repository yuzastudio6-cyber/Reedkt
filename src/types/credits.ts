import type { BaseRecord, CreditAmount, ID, ISODateString, JSONObject } from './shared'
import type { ReEditProCanonicalEditLevel } from './edit-level'

export type CreditWalletType = 'personal' | 'workspace' | 'business' | 'enterprise'

export type CreditSourceType = 'weekly_bonus' | 'purchased' | 'promotional' | 'admin' | 'refund'

export type CreditGrantStatus = 'active' | 'partially_used' | 'used' | 'expired' | 'cancelled'

export type CreditLedgerEntryType =
  | 'weekly_bonus_grant'
  | 'purchase'
  | 'promotional_grant'
  | 'admin_grant'
  | 'reservation'
  | 'reservation_release'
  | 'spend'
  | 'refund'
  | 'expired_bonus'
  | 'admin_adjustment'
  | 'failed_generation_refund'

export type CreditReservationStatus =
  | 'draft'
  | 'reserved'
  | 'partially_spent'
  | 'spent'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'expired'
  | 'failed'

export type CreditEstimateStatus =
  | 'draft'
  | 'ready'
  | 'shown_to_user'
  | 'approved'
  | 'revised'
  | 'expired'
  | 'cancelled'

export type CreditEstimateLineItemType =
  | 'planning'
  | 'transcript'
  | 'basic_edit_cleanup'
  | 'captions'
  | 'audio_cleanup'
  | 'transition'
  | 'music'
  | 'sfx'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'soundsync'
  | 'render_preview'
  | 'final_export'
  | 'revision'
  | 'premium_generation'
  | 'other'

export type CreditApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revised' | 'cancelled' | 'expired'

export type CreditRefundStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'

export type CreditUsageCategory =
  | 'basic_edit'
  | 'pro_edit'
  | 'signature_edit'
  | 'premium_signature_edit'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'soundsync'
  | 'rendering'
  | 'revision'
  | 'admin'
  | 'other'

export type CreditRefundReason =
  | 'reeditpro_generation_failed'
  | 'render_failed'
  | 'user_cancelled_before_generation'
  | 'admin_adjustment'
  | 'duplicate_charge'
  | 'reservation_release'

export const CREDIT_SETTLEMENT_STATUSES = [
  'draft',
  'previewed',
  'pending',
  'settled',
  'requires_revised_estimate',
  'requires_top_up_before_export',
  'settled_with_absorbed_overage',
  'failed',
  'cancelled',
] as const

export type CreditSettlementStatus = typeof CREDIT_SETTLEMENT_STATUSES[number]

export const CREDIT_SETTLEMENT_REASONS = [
  'edit_completed',
  'projected_overage',
  'user_approved_overage',
  'approved_but_unfunded',
  'estimate_error_absorbed',
  'provider_variance_absorbed',
  'reeditpro_failed_to_pause_absorbed',
  'user_cancelled',
  'admin_adjustment',
  'unknown',
] as const

export type CreditSettlementReason = typeof CREDIT_SETTLEMENT_REASONS[number]

export const CREDIT_REVISION_ACTION_STATUSES = [
  'action_required',
  'approved',
  'rejected',
  'lower_cost_selected',
  'cancelled',
  'expired',
  'resolved',
] as const

export type CreditRevisionActionStatus = typeof CREDIT_REVISION_ACTION_STATUSES[number]

export const CREDIT_REVISION_PAUSE_REASONS = [
  'projected_overage',
  'user_requested_scope_increase',
  'compute_level_upgrade_required',
  'provider_route_changed',
  'export_top_up_required',
  'tool_cost_risk_increased',
  'unknown',
] as const

export type CreditRevisionPauseReason = typeof CREDIT_REVISION_PAUSE_REASONS[number]

export type CreditRevisionUserAction =
  | 'approve_and_continue'
  | 'choose_lower_cost_option'
  | 'cancel_extra_work'
  | 'add_credits_and_unlock_export'

export interface CreditRevisionUserOption {
  id: string
  label: string
  action: CreditRevisionUserAction
}

export const CREDIT_REVISION_ACTION_RESOLUTION_STATUSES = [
  'approved',
  'lower_cost_selected',
  'cancelled',
  'already_resolved',
  'action_not_found',
  'invalid_action_state',
  'invalid_request',
  'reservation_not_found',
  'inactive_reservation',
  'wallet_not_found',
  'insufficient_credits',
] as const

export type CreditRevisionActionResolutionStatus =
  typeof CREDIT_REVISION_ACTION_RESOLUTION_STATUSES[number]

export interface CreditSettlementRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId?: ID | null
  chatSessionId?: ID | null
  jobBatchId?: ID | null
  creditWalletId?: ID | null
  creditEstimateId: ID
  creditReservationId: ID
  creditApprovalId?: ID | null
  editComputeLevel: ReEditProCanonicalEditLevel
  finalVideoDurationSeconds: number
  status: CreditSettlementStatus
  settlementReason: CreditSettlementReason
  reservedCredits: CreditAmount
  actualToolCostCents: number
  actualToolCostCredits: CreditAmount
  reeditproServiceFeeCredits: CreditAmount
  finalChargeCredits: CreditAmount
  releasedCredits: CreditAmount
  absorbedOverageCredits: CreditAmount
  outstandingCredits: CreditAmount
  billableToolEventCount: number
  nonBillableToolEventCount: number
  toolCostEventIds: ID[]
  rateCardVersion?: string | null
  creditPolicyVersion?: string | null
  serviceFeePolicyVersion?: string | null
  idempotencyKey: string
  settlementPayload: JSONObject
  receiptPayload: JSONObject
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
  settledAt?: ISODateString | null
  failedAt?: ISODateString | null
}

export interface CreditRevisionActionRecord {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId?: ID | null
  chatSessionId?: ID | null
  jobBatchId?: ID | null
  jobId?: ID | null
  creditEstimateId: ID
  creditReservationId: ID
  previousCreditEstimateId?: ID | null
  revisedCreditEstimateId?: ID | null
  editComputeLevel: ReEditProCanonicalEditLevel
  status: CreditRevisionActionStatus
  pauseReason: CreditRevisionPauseReason
  approvedMaxCredits: CreditAmount
  usedOrCommittedCredits: CreditAmount
  additionalLowCredits: CreditAmount
  additionalExpectedCredits: CreditAmount
  additionalHighCredits: CreditAmount
  newMaximumEstimatedCredits: CreditAmount
  reasonSummary: string
  actionRequiredTitle: string
  actionRequiredMessage: string
  userOptions: CreditRevisionUserOption[]
  selectedOptionId?: string | null
  resolvedByUserId?: ID | null
  resolvedAt?: ISODateString | null
  idempotencyKey: string
  metadata: JSONObject
  createdAt: ISODateString
  updatedAt: ISODateString
  expiresAt?: ISODateString | null
}

export interface EditCreditCostSummaryUsageCategory {
  eventCount: number
  billableEventCount: number
  nonBillableEventCount: number
  actualInternalCostCents: number
  credits: CreditAmount
}

export interface EditCreditCostSummaryLine {
  label: string
  credits: CreditAmount
  description?: string
}

export interface EditCreditCostSummary {
  workspaceId: ID
  projectId: ID
  editPlanId?: ID | null
  creditEstimateId: ID
  creditReservationId: ID
  creditSettlementId?: ID | null
  editComputeLevel: ReEditProCanonicalEditLevel
  finalVideoDurationSeconds: number
  reservedCredits: CreditAmount
  actualToolCostCents: number
  actualToolCostCredits: CreditAmount
  reeditproServiceFeeCredits: CreditAmount
  finalChargeCredits: CreditAmount
  releasedCredits: CreditAmount
  absorbedOverageCredits: CreditAmount
  outstandingCredits: CreditAmount
  byUsageCategory: Record<string, EditCreditCostSummaryUsageCategory>
  nonBillableAbsorbed?: {
    eventCount: number
    actualInternalCostCents: number
    credits: CreditAmount
    reasons: string[]
  }
  userFacingLines: EditCreditCostSummaryLine[]
  warnings: string[]
}

export interface PreviewCreditSettlementRequest {
  workspaceId: ID
  projectId: ID
  editPlanId?: ID | null
  creditEstimateId: ID
  creditReservationId: ID
  editComputeLevel: ReEditProCanonicalEditLevel
  finalVideoDurationSeconds: number
  reservedCredits: CreditAmount
  toolCostEventIds?: ID[]
  idempotencyKey: string
}

export interface PreviewCreditSettlementResponse {
  settlement: CreditSettlementRecord
  summary: EditCreditCostSummary
  requiresAction: boolean
  requiredActionType?: 'revised_estimate' | 'top_up_before_export' | 'none'
  warnings: string[]
}

export const EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS = [
  'economy',
  'standard',
  'premium',
] as const

export type EditCreditEstimateToolComputeLevel = typeof EDIT_CREDIT_ESTIMATE_TOOL_COMPUTE_LEVELS[number]

export const EDIT_CREDIT_ESTIMATE_READINESS_STATUSES = [
  'ready_for_reservation',
  'needs_top_up',
  'custom_estimate_required',
  'estimate_only_blocked',
] as const

export type EditCreditEstimateReadinessStatus = typeof EDIT_CREDIT_ESTIMATE_READINESS_STATUSES[number]

export type EditCreditEstimateLowerCostAction =
  | 'downgrade_product_edit_level'
  | 'reduce_tool_scope'
  | 'lower_render_quality'
  | 'reduce_audio_scope'
  | 'custom_estimate_review'

export interface EditCreditEstimateToolUsageInput {
  toolId: ID
  toolComputeLevel?: EditCreditEstimateToolComputeLevel | null
  qualityLevel?: EditCreditEstimateToolComputeLevel | null
  estimatedRuntimeSeconds?: number
  renderDurationSeconds?: number
  outputDurationSeconds?: number
  megapixelFrames?: number
  requestCount?: number
  inputTokens?: number
  outputTokens?: number
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
  imageCount?: number
  provider?: string | null
  model?: string | null
  vcpuCount?: number
  memoryGib?: number
  gpuCount?: number
  tempStorageGibHours?: number
  outputStorageGibHours?: number
  networkEgressMib?: number
  actualInternalCostCents?: number
  metadata?: JSONObject
}

export interface PreviewEditCreditEstimateRequest {
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  productEditLevel: ReEditProCanonicalEditLevel
  finalVideoDurationSeconds: number
  plannedToolIds: ID[]
  toolUsageInputs?: Record<string, EditCreditEstimateToolUsageInput>
  availableCreditsSnapshot?: CreditAmount
  reservedCreditsSnapshot?: CreditAmount
  purchasedCreditsSnapshot?: CreditAmount
  weeklyBonusCreditsSnapshot?: CreditAmount
  idempotencyKey: string
  metadata?: JSONObject
}

export interface EditCreditEstimateToolEstimateSnapshot {
  toolId: ID
  toolName: string
  owner: string
  usageCategory: string
  lineItemType: CreditEstimateLineItemType
  productEditLevel: ReEditProCanonicalEditLevel
  toolComputeLevel: EditCreditEstimateToolComputeLevel
  qualityLevel: EditCreditEstimateToolComputeLevel
  prerequisiteStatus: string
  lowInternalCostCents: number
  expectedInternalCostCents: number
  highInternalCostCents: number
  lowCredits: CreditAmount
  expectedCredits: CreditAmount
  highCredits: CreditAmount
  rateCardVersion: string
  pricingSnapshot: JSONObject
  serviceFeeIncluded: false
  warnings: string[]
}

export interface EditCreditEstimateServiceFeeEstimate {
  lowToolCostCredits: CreditAmount
  expectedToolCostCredits: CreditAmount
  highToolCostCredits: CreditAmount
  lowServiceFeeCredits: CreditAmount
  expectedServiceFeeCredits: CreditAmount
  highServiceFeeCredits: CreditAmount
  customEstimateRequired: boolean
  durationBucket: string
  creditPolicyVersion: string
  serviceFeePolicyVersion: string
  finalChargeFormula: string
}

export interface EditCreditEstimateTopUpSummary {
  availableCreditsSnapshot?: CreditAmount
  reservedCreditsSnapshot?: CreditAmount
  purchasedCreditsSnapshot?: CreditAmount
  weeklyBonusCreditsSnapshot?: CreditAmount
  requiredHoldCredits: CreditAmount
  requiredTopUpCredits: CreditAmount
  canProceedToReservation: boolean
  readinessStatus: EditCreditEstimateReadinessStatus
}

export interface EditCreditEstimateLowerCostOption {
  id: string
  label: string
  description: string
  action: EditCreditEstimateLowerCostAction
  affectedToolIds: ID[]
  targetProductEditLevel?: ReEditProCanonicalEditLevel
  estimatedSavingsCredits?: CreditAmount
}

export interface EditCreditEstimateSafetyFlags {
  estimateOnly: true
  creditsReservedOrSpent: false
  walletMutated: false
  reservationMutated: false
  ledgerWritten: false
  providerCalled: false
  workerRun: false
  renderOrExportStarted: false
  supabaseWritten: false
  serviceFeeIncludedInToolCosts: false
}

export interface EditCreditEstimatePreviewSummary {
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  productEditLevel: ReEditProCanonicalEditLevel
  finalVideoDurationSeconds: number
  plannedToolCount: number
  lowToolCostCredits: CreditAmount
  expectedToolCostCredits: CreditAmount
  highToolCostCredits: CreditAmount
  lowServiceFeeCredits: CreditAmount
  expectedServiceFeeCredits: CreditAmount
  highServiceFeeCredits: CreditAmount
  minimumEstimatedCredits: CreditAmount
  totalEstimatedCredits: CreditAmount
  maximumEstimatedCredits: CreditAmount
  requiredHoldCredits: CreditAmount
  requiredTopUpCredits: CreditAmount
  canProceedToReservation: boolean
  customEstimateRequired: boolean
  readinessStatus: EditCreditEstimateReadinessStatus
  userFacingLines: EditCreditCostSummaryLine[]
}

export interface EditCreditEstimatePreview {
  estimate: CreditEstimateRecord
  summary: EditCreditEstimatePreviewSummary
  toolEstimates: EditCreditEstimateToolEstimateSnapshot[]
  serviceFeeEstimate: EditCreditEstimateServiceFeeEstimate
  topUpSummary: EditCreditEstimateTopUpSummary
  lowerCostOptions: EditCreditEstimateLowerCostOption[]
  safetyFlags: EditCreditEstimateSafetyFlags
  idempotencyStatus: 'created' | 'duplicate_returned'
  warnings: string[]
}

export interface PreviewEditCreditEstimateResponse {
  preview: EditCreditEstimatePreview
  warnings: string[]
}

export const RESERVE_MAX_ESTIMATE_CREDIT_STATUSES = [
  'reserved',
  'insufficient_credits',
  'estimate_not_found',
  'estimate_not_approved',
  'estimate_expired',
  'wallet_not_found',
  'already_reserved',
  'invalid_request',
] as const

export type ReserveMaxEstimateCreditsStatus = typeof RESERVE_MAX_ESTIMATE_CREDIT_STATUSES[number]

export interface ReserveMaxEstimateCreditsRequest {
  workspaceId: ID
  projectId: ID
  editPlanId?: ID
  chatSessionId?: ID
  creditWalletId?: ID
  creditEstimateId: ID
  creditApprovalId?: ID
  approvedByUserId: ID
  idempotencyKey: string
  expiresAt?: ISODateString
  metadata?: JSONObject
}

export interface CreditReservationWalletBalance {
  creditWalletId: ID
  workspaceId: ID
  userId?: ID
  walletType: CreditWalletType
  availableCredits: CreditAmount
  reservedCredits: CreditAmount
  spentCredits: CreditAmount
  refundedCredits: CreditAmount
}

export interface ReserveMaxEstimateCreditsSafetyFlags {
  mockOnly: true
  requiredHoldUsesMaximumEstimate: true
  walletMutated: boolean
  reservationMutated: boolean
  creditsReserved: boolean
  creditsSpent: false
  ledgerWritten: false
  settlementExecuted: false
  providerCalled: false
  workerRun: false
  renderOrExportStarted: false
  exportUnlocked: false
  checkoutOrTopUpStarted: false
  supabaseWritten: false
  serviceFeeIncludedInToolCosts: false
}

export interface ReserveMaxEstimateCreditsResponse {
  status: ReserveMaxEstimateCreditsStatus
  reservation: CreditReservationRecord | null
  reservationLineItems: CreditReservationLineItemRecord[]
  creditWallet: CreditWalletRecord | null
  walletBalance: CreditReservationWalletBalance | null
  requiredHoldCredits: CreditAmount
  availableCreditsBeforeReservation: CreditAmount
  availableCreditsAfterReservation: CreditAmount
  reservedCreditsAfterReservation: CreditAmount
  requiredTopUpCredits: CreditAmount
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  userFacingMessage: string
  safetyFlags: ReserveMaxEstimateCreditsSafetyFlags
  warnings: string[]
}

export interface ApproveCreditRevisionActionRequest {
  workspaceId: ID
  projectId: ID
  creditRevisionActionId: ID
  creditReservationId: ID
  approvedByUserId: ID
  idempotencyKey: string
  metadata?: JSONObject
}

export interface ChooseLowerCostCreditRevisionOptionRequest {
  workspaceId: ID
  projectId: ID
  creditRevisionActionId: ID
  selectedOptionId: string
  selectedByUserId: ID
  idempotencyKey: string
  metadata?: JSONObject
}

export interface CancelCreditRevisionActionRequest {
  workspaceId: ID
  projectId: ID
  creditRevisionActionId: ID
  cancelledByUserId: ID
  cancellationReason?: string
  idempotencyKey: string
  metadata?: JSONObject
}

export interface CreditRevisionActionResolutionSafetyFlags {
  mockOnly: true
  paidWorkStarted: false
  walletMutated: boolean
  reservationMutated: boolean
  creditsReserved: boolean
  creditsSpent: false
  creditsReleased: false
  creditsRefunded: false
  ledgerWritten: false
  settlementExecuted: false
  providerCalled: false
  workerRun: false
  renderOrExportStarted: false
  exportUnlocked: false
  checkoutOrTopUpStarted: false
  supabaseWritten: false
  serviceFeeIncludedInToolCosts: false
}

export interface CreditRevisionActionResolutionResponse {
  status: CreditRevisionActionResolutionStatus
  action: CreditRevisionActionRecord | null
  reservation: CreditReservationRecord | null
  reservationLineItems: CreditReservationLineItemRecord[]
  walletBalance: CreditReservationWalletBalance | null
  additionalHoldCredits: CreditAmount
  requiredTopUpCredits: CreditAmount
  idempotencyStatus: 'created' | 'duplicate_returned' | 'not_created'
  requiresRuntimeGuardRecheck: boolean
  requiresNewEstimateOrPlan: boolean
  extraWorkCancelled: boolean
  paidWorkStarted: false
  userFacingMessage: string
  safetyFlags: CreditRevisionActionResolutionSafetyFlags
  warnings: string[]
}

export interface CreditWalletRecord extends BaseRecord {
  workspaceId: ID
  userId?: ID
  walletType: CreditWalletType
  name: string
  currencyCode: 'CREDITS'
  cachedAvailableCredits: CreditAmount
  cachedReservedCredits: CreditAmount
  cachedSpentCredits: CreditAmount
  cachedRefundedCredits: CreditAmount
  lastCalculatedAt?: ISODateString
}

export interface CreditGrantRecord extends BaseRecord {
  creditWalletId: ID
  workspaceId: ID
  userId?: ID
  sourceType: CreditSourceType
  status: CreditGrantStatus
  originalAmount: CreditAmount
  remainingAmount: CreditAmount
  retailValueCents?: number
  purchaseAmountCents?: number
  billingProvider?: string
  billingPaymentId?: string
  subscriptionId?: ID
  grantReason?: string
  expiresAt?: ISODateString
}

export interface CreditLedgerEntryRecord {
  id: ID
  creditWalletId: ID
  creditGrantId?: ID
  workspaceId: ID
  userId?: ID
  entryType: CreditLedgerEntryType
  amount: CreditAmount
  balanceAfter?: CreditAmount
  relatedProjectId?: ID
  relatedEditPlanId?: ID
  relatedReservationId?: ID
  relatedEstimateId?: ID
  relatedChatMessageId?: ID
  relatedChatActionId?: ID
  idempotencyKey?: string
  description?: string
  metadata?: JSONObject
  createdAt: ISODateString
}

export interface CreditEstimateLineItemRecord {
  id: ID
  creditEstimateId: ID
  workspaceId: ID
  projectId: ID
  editPlanId?: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  lineItemType: CreditEstimateLineItemType
  usageCategory: CreditUsageCategory
  label: string
  description?: string
  estimatedCredits: CreditAmount
  isOptional: boolean
  isPremium: boolean
  requiresUserApproval: boolean
  providerHint?: string
  modelHint?: string
  linePayload?: JSONObject
  createdAt: ISODateString
}

export type CreditEstimateLineItem = CreditEstimateLineItemRecord

export interface CreditEstimateRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  inlineChatCardId?: ID
  editPlanId?: ID
  status: CreditEstimateStatus
  totalEstimatedCredits: CreditAmount
  minimumEstimatedCredits?: CreditAmount
  maximumEstimatedCredits?: CreditAmount
  availableCreditsSnapshot?: CreditAmount
  reservedCreditsSnapshot?: CreditAmount
  purchasedCreditsSnapshot?: CreditAmount
  weeklyBonusCreditsSnapshot?: CreditAmount
  estimateReason?: string
  estimatePayload?: JSONObject
  expiresAt?: ISODateString
  shownToUserAt?: ISODateString
  approvedAt?: ISODateString
  createdByAgent?: string
  lineItems?: CreditEstimateLineItemRecord[]
}

export interface CreditApprovalRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  chatActionId?: ID
  inlineChatCardId?: ID
  creditEstimateId: ID
  editPlanId?: ID
  status: CreditApprovalStatus
  approvedBy?: ID
  approvedAt?: ISODateString
  rejectedAt?: ISODateString
  approvalNote?: string
  approvalPayload?: JSONObject
}

export interface CreditReservationRecord extends BaseRecord {
  creditWalletId: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  creditEstimateId: ID
  creditApprovalId?: ID
  editPlanId?: ID
  status: CreditReservationStatus
  reservedCredits: CreditAmount
  spentCredits: CreditAmount
  releasedCredits: CreditAmount
  refundedCredits: CreditAmount
  reservationReason?: string
  idempotencyKey?: string
  reservedAt?: ISODateString
  spentAt?: ISODateString
  releasedAt?: ISODateString
  expiresAt?: ISODateString
}

export interface CreditReservationLineItemRecord extends BaseRecord {
  creditReservationId: ID
  creditEstimateLineItemId?: ID
  creditGrantId?: ID
  workspaceId: ID
  projectId: ID
  usageCategory: CreditUsageCategory
  reservedCredits: CreditAmount
  spentCredits: CreditAmount
  releasedCredits: CreditAmount
  refundedCredits: CreditAmount
  linePayload?: JSONObject
}

export interface CreditRefundRecord extends BaseRecord {
  creditWalletId: ID
  workspaceId: ID
  projectId?: ID
  creditReservationId?: ID
  creditEstimateId?: ID
  editPlanId?: ID
  status: CreditRefundStatus
  refundAmount: CreditAmount
  refundReason: CreditRefundReason | string
  failureCausedByReeditpro: boolean
  approvedBy?: ID
  approvedAt?: ISODateString
  completedAt?: ISODateString
  ledgerEntryId?: ID
}

export interface CreditWalletBalanceViewRecord {
  creditWalletId: ID
  workspaceId: ID
  userId?: ID
  walletType: CreditWalletType
  cachedAvailableCredits: CreditAmount
  cachedReservedCredits: CreditAmount
  cachedSpentCredits: CreditAmount
  cachedRefundedCredits: CreditAmount
  lastCalculatedAt?: ISODateString
}

export const CREDIT_TABLE_NAMES = [
  'credit_wallets',
  'credit_grants',
  'credit_ledger_entries',
  'credit_estimates',
  'credit_estimate_line_items',
  'credit_approvals',
  'credit_reservations',
  'credit_reservation_line_items',
  'credit_refunds',
] as const
