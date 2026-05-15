import type { ApprovalStatus, BaseRecord, CreditAmount, CurrencyCode, ID, ISODateString, JSONObject } from './shared'

export type CreditLedgerEntryType =
  | 'weekly_bonus_grant'
  | 'purchase'
  | 'reservation'
  | 'spend'
  | 'refund'
  | 'expired_bonus'
  | 'admin_adjustment'

export type CreditSourceType = 'weekly_bonus' | 'purchased' | 'promotional' | 'admin'

export type CreditReservationStatus =
  | 'estimated'
  | 'reserved'
  | 'spent'
  | 'refunded'
  | 'cancelled'
  | 'expired'

export type CreditEstimateStatus =
  | 'draft'
  | 'ready_for_approval'
  | 'approved'
  | 'revised'
  | 'expired'
  | 'cancelled'

export type CreditRefundReason =
  | 'reeditpro_generation_failed'
  | 'render_failed'
  | 'user_cancelled_before_generation'
  | 'admin_adjustment'
  | 'duplicate_charge'

export interface CreditWalletRecord extends BaseRecord {
  workspaceId: ID
  userId?: ID
  planCode: 'personal' | 'business'
  weeklyBonusBalance: CreditAmount
  purchasedBalance: CreditAmount
  promotionalBalance: CreditAmount
  reservedBalance: CreditAmount
  totalAvailableCredits: CreditAmount
  lastWeeklyGrantAt?: ISODateString
  status: 'active' | 'locked' | 'archived'
}

export interface CreditLedgerEntryRecord extends BaseRecord {
  walletId: ID
  workspaceId: ID
  userId?: ID
  entryType: CreditLedgerEntryType
  sourceType: CreditSourceType
  amount: CreditAmount
  balanceAfter: CreditAmount
  relatedCreditEstimateId?: ID
  relatedCreditReservationId?: ID
  relatedProjectId?: ID
  relatedEditPlanId?: ID
  relatedJobId?: ID
  expiresAt?: ISODateString
  reason: string
}

export interface CreditEstimateLineItem {
  label: string
  credits: CreditAmount
  sourceType?: CreditSourceType
  reason: string
  isOptional: boolean
  isPremium: boolean
  relatedSignatureSystem?: string
  relatedSegmentId?: ID
  metadata?: JSONObject
}

export interface CreditEstimateRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatMessageId?: ID
  editPlanId: ID
  status: CreditEstimateStatus
  currency: CurrencyCode
  totalCredits: CreditAmount
  retailValueCents: number
  weeklyBonusCreditsApplied: CreditAmount
  purchasedCreditsApplied: CreditAmount
  promotionalCreditsApplied: CreditAmount
  lineItems: CreditEstimateLineItem[]
  approvalStatus: ApprovalStatus
  approvedByUserId?: ID
  approvedAt?: ISODateString
  expiresAt?: ISODateString
  approvalRequiredBeforeGeneration: true
}

export interface CreditReservationRecord extends BaseRecord {
  walletId: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  creditEstimateId: ID
  status: CreditReservationStatus
  reservedCredits: CreditAmount
  spentCredits: CreditAmount
  refundedCredits: CreditAmount
  reservedAt?: ISODateString
  spentAt?: ISODateString
  refundedAt?: ISODateString
  expiresAt?: ISODateString
  idempotencyKey: string
  failureRefundEligible: boolean
}

export interface CreditRefundRecord extends BaseRecord {
  walletId: ID
  creditReservationId?: ID
  creditLedgerEntryId?: ID
  workspaceId: ID
  projectId?: ID
  amount: CreditAmount
  sourceType: CreditSourceType
  reason: CreditRefundReason
  status: 'pending' | 'completed' | 'rejected'
  processedAt?: ISODateString
  processedByActorId?: ID
  notes?: string
}

export const CREDIT_TABLE_NAMES = [
  'credit_wallets',
  'credit_ledger_entries',
  'credit_estimates',
  'credit_reservations',
] as const
