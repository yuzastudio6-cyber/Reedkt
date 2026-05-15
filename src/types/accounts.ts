import type { BaseRecord, CreditAmount, CurrencyCode, ID, ISODateString, JSONObject } from './shared'

export type PlanCode = 'personal' | 'business'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired'

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'client'

export type BillingInterval = 'weekly' | 'monthly' | 'annual'

export interface UserRecord extends BaseRecord {
  email: string
  displayName: string
  avatarUrl?: string
  defaultWorkspaceId?: ID
  status: 'active' | 'invited' | 'disabled'
}

export interface WorkspaceRecord extends BaseRecord {
  name: string
  slug: string
  ownerUserId: ID
  planCode: PlanCode
  defaultCreditWalletId?: ID
  status: 'active' | 'suspended' | 'archived'
}

export interface WorkspaceMemberRecord extends BaseRecord {
  workspaceId: ID
  userId: ID
  role: WorkspaceRole
  invitedByUserId?: ID
  joinedAt?: ISODateString
  status: 'invited' | 'active' | 'removed'
}

export interface PlanRecord extends BaseRecord {
  code: PlanCode
  name: string
  weeklyPriceCents: number
  currency: CurrencyCode
  billingInterval: BillingInterval
  weeklyBonusCredits: CreditAmount
  retailCreditValueCentsPer100Credits: number
  softwareAccessOnly: boolean
  includesUnlimitedAiEditing: false
  targetAudience: string
  featureSummary: string[]
  creditUsageNotes: string[]
}

export interface SubscriptionRecord extends BaseRecord {
  workspaceId: ID
  planId: ID
  planCode: PlanCode
  status: SubscriptionStatus
  currentPeriodStart: ISODateString
  currentPeriodEnd: ISODateString
  cancelAtPeriodEnd: boolean
  externalBillingCustomerId?: string
  externalBillingSubscriptionId?: string
  billingMetadata?: JSONObject
  notes: string
}

export const PLAN_PRICE_RULES = {
  personalWeeklyUsd: 10,
  personalWeeklyBonusCredits: 100,
  businessWeeklyUsd: 20,
  retailValuePer100CreditsUsd: 5,
  subscriptionMeaning: 'software_access',
  creditMeaning: 'ai_generation_rendering_edit_usage',
} as const
