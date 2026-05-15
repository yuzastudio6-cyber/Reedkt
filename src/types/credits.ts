import type { BaseRecord, CreditAmount, ID, ISODateString, JSONObject } from './shared'

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
