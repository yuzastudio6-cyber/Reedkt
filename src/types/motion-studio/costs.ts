import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioOwnership,
  MotionStudioRegisteredExtension,
  SourceLocator,
  StorageObjectRef,
} from './shared'

export type InternalCostMicros = number
export type ProductionCostCurrency = 'USD'

export type ProductionCostUnit =
  | 'input_token'
  | 'cached_input_token'
  | 'output_token'
  | 'image'
  | 'image_edit'
  | 'video_second'
  | 'audio_second'
  | 'character'
  | 'request'
  | 'cpu_second'
  | 'gpu_second'
  | 'render_frame'
  | 'render_minute'
  | 'storage_gib_hour'
  | 'storage_gib_month'
  | 'network_egress_gib'
  | 'search_request'

interface CostEvidenceVersion {
  evidenceVersionId: ID
  evidenceDigest: string
  capturedAt: ISODateString
  extensions?: readonly MotionStudioRegisteredExtension[]
}

export interface RateCardSourceEvidenceRef extends CostEvidenceVersion {
  kind: 'rate_card_source'
  rateCardSourceRecordId: ID
  sourceSystem: 'provider_official' | 'reeditpro_internal'
  provenanceClass: 'official_provider_pricing' | 'internal_cost_policy'
}

export interface ProviderInvoiceEvidenceRef extends CostEvidenceVersion {
  kind: 'provider_invoice'
  providerInvoiceRecordId: ID
  providerBillingRecordId: ID
  sourceSystem: 'provider_billing'
  provenanceClass: 'provider_invoice'
}

export interface StorageObjectEvidenceRef<
  TProvenanceClass extends 'stored_rate_card' | 'stored_provider_invoice' =
    'stored_rate_card' | 'stored_provider_invoice',
> extends CostEvidenceVersion {
  kind: 'storage_object'
  storageObjectRef: StorageObjectRef
  sourceSystem: 'private_storage'
  provenanceClass: TProvenanceClass
}

export interface SourceLocatorEvidenceRef<
  TProvenanceClass extends 'official_provider_pricing' | 'official_fx_rate' =
    'official_provider_pricing',
> extends CostEvidenceVersion {
  kind: 'source_locator'
  sourceLocator: SourceLocator
  sourceSystem: 'official_public_source'
  provenanceClass: TProvenanceClass
}

export type CurrencyExchangeRateEvidenceRef = SourceLocatorEvidenceRef<'official_fx_rate'>

export interface AuditRecordEvidenceRef<
  TProvenanceClass extends 'rate_card_verification' | 'cost_reconciliation' =
    'rate_card_verification' | 'cost_reconciliation',
> extends CostEvidenceVersion {
  kind: 'audit_record'
  auditRecordId: ID
  sourceSystem: 'reeditpro_audit'
  provenanceClass: TProvenanceClass
}

export type CostEvidenceRef =
  | RateCardSourceEvidenceRef
  | ProviderInvoiceEvidenceRef
  | StorageObjectEvidenceRef
  | SourceLocatorEvidenceRef
  | AuditRecordEvidenceRef

export type ProviderRateCardEvidenceRef =
  | RateCardSourceEvidenceRef
  | StorageObjectEvidenceRef<'stored_rate_card'>
  | SourceLocatorEvidenceRef
  | AuditRecordEvidenceRef<'rate_card_verification'>

export type CostReconciliationEvidenceRef =
  | ProviderInvoiceEvidenceRef
  | StorageObjectEvidenceRef<'stored_provider_invoice'>
  | AuditRecordEvidenceRef<'cost_reconciliation'>

export interface ProviderRateCard {
  id: ID
  providerCapability: string
  providerAdapterId: string
  modelOrService: string
  version: string
  contentDigest: string
  currency: ProductionCostCurrency
  effectiveFrom: ISODateString
  effectiveTo?: ISODateString
  unit: ProductionCostUnit
  unitPriceMicros: InternalCostMicros
  minimumChargeMicros: InternalCostMicros
  roundingRule: string
  sourceReference: ProviderRateCardEvidenceRef
  verifiedAt: ISODateString
  immutable: true
}

export interface ToolCostProfile {
  id: ID
  toolId: string
  version: string
  contentDigest: string
  currency: ProductionCostCurrency
  rates: Array<{
    unit: ProductionCostUnit
    unitPriceMicros: InternalCostMicros
  }>
  immutable: true
}

export interface ProductionCostEstimateItem {
  id: ID
  workItemKey: string
  capabilityOrToolId: string
  rateCardVersionId: ID
  quantity: number
  unit: ProductionCostUnit
  lowInternalCostMicros: InternalCostMicros
  expectedInternalCostMicros: InternalCostMicros
  highInternalCostMicros: InternalCostMicros
  maximumAuthorizedInternalCostMicros: InternalCostMicros
  retryAllowanceCount: number
  assumptions: string[]
}

export interface ProductionCostEstimate extends MotionStudioOwnership {
  id: ID
  productionId: ID
  sceneId?: ID
  shotId?: ID
  currency: ProductionCostCurrency
  lowInternalCostMicros: InternalCostMicros
  expectedInternalCostMicros: InternalCostMicros
  highInternalCostMicros: InternalCostMicros
  maximumAuthorizedInternalCostMicros: InternalCostMicros
  itemIds: ID[]
  rateCardVersionIds: ID[]
  expiresAt: ISODateString
  status: 'draft' | 'reviewed' | 'authorized' | 'expired' | 'superseded' | 'cancelled'
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export interface ProductionCostBudget extends MotionStudioOwnership {
  id: ID
  productionId: ID
  estimateId: ID
  approvedSnapshotId: ID
  maximumAuthorizedInternalCostMicros: InternalCostMicros
  incurredInternalCostMicros: InternalCostMicros
  releasedInternalCostMicros: InternalCostMicros
  status: 'authorized' | 'incurring' | 'paused' | 'released' | 'exhausted' | 'cancelled'
}

export type ProductionUsageEvidenceClass =
  | 'estimated'
  | 'provider_reported'
  | 'infrastructure_metered'
  | 'invoice_reconciled'
  | 'manually_adjusted'

export interface ProductionUsageEvent extends MotionStudioOwnership {
  id: ID
  productionId: ID
  sceneId?: ID
  shotId?: ID
  skillId?: string
  toolOrCapabilityId: string
  jobId: ID
  attemptId: ID
  costBudgetId: ID
  costEstimateItemId: ID
  retryNumber: number
  outputAssetId?: ID
  rateCardVersionId: ID
  unit: ProductionCostUnit
  quantity: number
  internalCostMicros: InternalCostMicros
  evidenceClass: ProductionUsageEvidenceClass
  outcome: 'completed' | 'failed' | 'cancelled' | 'rejected'
  failureCategory?: string
  evidenceDigest: string
  createdAt: ISODateString
  extensions?: readonly MotionStudioRegisteredExtension[]
}

export interface ProductionCostActual extends MotionStudioOwnership {
  id: ID
  productionId: ID
  usageEventIds: ID[]
  provisionalInternalCostMicros: InternalCostMicros
  reconciledInternalCostMicros?: InternalCostMicros
  status: 'provisional' | 'reconciled' | 'adjusted' | 'disputed'
  currency: ProductionCostCurrency
}

export interface ProductionCostReconciliation extends MotionStudioOwnership {
  id: ID
  productionId: ID
  actualCostId: ID
  providerInvoiceReference: CostReconciliationEvidenceRef
  previousInternalCostMicros: InternalCostMicros
  reconciledInternalCostMicros: InternalCostMicros
  evidenceDigest: string
  reconciledAt: ISODateString
}

export interface ProductionCostAdjustment extends MotionStudioOwnership {
  id: ID
  productionId: ID
  actualCostId: ID
  direction: 'increase' | 'decrease'
  amountInternalCostMicros: InternalCostMicros
  reason: string
  evidenceDigest: string
  adjustedAt: ISODateString
}
