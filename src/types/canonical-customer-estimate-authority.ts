import type {
  ReEditProCanonicalEditLevel,
} from './edit-level'

export const CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION =
  'canonical-customer-estimate-authority-v1' as const

export const CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE =
  'canonical_customer_estimate_authority_compiler' as const

export const CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_COMPONENT_KEY =
  'canonicalCustomerEstimateAuthority' as const

export interface CanonicalCustomerEstimateLineItem {
  readonly lineKey: string
  readonly label: string
  readonly category: string
  readonly estimatedCredits: number
  readonly removable: boolean
  readonly metadata: Readonly<Record<string, unknown>>
}

export interface CanonicalCustomerEstimateValue {
  readonly lineItems:
    readonly CanonicalCustomerEstimateLineItem[]
  readonly fallbackAllowanceCredits: number
  readonly validForSeconds: number
}

export interface CanonicalCustomerEstimateServiceFeeProjection {
  readonly lineKey: 'weeditpro-service-edit-fee'
  readonly productEditLevel: ReEditProCanonicalEditLevel
  readonly durationSeconds: number
  readonly durationBucket:
    | '0_5_min'
    | '5_10_min'
    | '10_20_min'
    | '20_60_min'
    | '60_plus_custom'
  readonly conservativeToolCostBasisCredits: number
  readonly lengthFloorFeeCredits: number
  readonly percentageFeeCredits: number
  readonly serviceFeeCredits: number
  readonly serviceFeeIncludedInToolCosts: false
}

export interface CanonicalCustomerEstimateAuthorityDraft {
  readonly schemaVersion:
    typeof CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_VERSION
  readonly source:
    typeof CANONICAL_CUSTOMER_ESTIMATE_AUTHORITY_SOURCE
  readonly evidenceClass:
    'private_internal_server_recalculated_customer_estimate'
  readonly sourceEstimate: CanonicalCustomerEstimateValue
  readonly normalizedEstimate: CanonicalCustomerEstimateValue
  readonly sourceBindings: {
    readonly confirmedSettingsDigestSha256: string
    readonly masterTimingDigestSha256: string
    readonly sourceEstimateDigestSha256: string
    readonly livingFrameEstimateWorkAssetProjectionDigestSha256:
      string | null
  }
  readonly sourceNonServiceLineItemCount: number
  readonly sourceServiceFeeLineItemCount: 0 | 1
  readonly projectedLivingFrameToolCostLineItemCount: number
  readonly projectedLivingFrameMaximumInternalToolCostCredits: number
  readonly serviceFeeProjection:
    CanonicalCustomerEstimateServiceFeeProjection
  readonly normalizedEstimatedCredits: number
  readonly normalizedApprovedMaximumCredits: number
  readonly creditPolicyVersion: string
  readonly serviceFeePolicyVersion: string
  readonly finalChargeFormula: string
  readonly estimatePresentedBeforeApproval: true
  readonly creditsReservedOnlyAfterApproval: true
  readonly actualChargeStillRequiresActualBillableToolCost: true
  readonly unusedApprovedReservationMustBeReleased: true
  readonly customerWalletMutationAuthority: false
  readonly creditReservationAuthority: false
  readonly ledgerAuthority: false
  readonly approvalAuthority: false
  readonly providerAuthority: false
  readonly toolExecutionAuthority: false
  readonly workerAuthority: false
  readonly renderAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalCustomerEstimateAuthority
  extends CanonicalCustomerEstimateAuthorityDraft {
  readonly authorityDigestSha256: string
}
