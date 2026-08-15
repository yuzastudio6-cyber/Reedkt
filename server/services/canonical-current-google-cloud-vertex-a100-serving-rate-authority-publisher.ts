import { z } from 'zod'

import {
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
  observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2,
  type CanonicalGoogleCloudVertexA100ServingRateReadPort,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import type {
  CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-publication-receipt-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_V2_VERSION =
  'canonical-current-google-cloud-vertex-a100-serving-rate-publication-receipt-v2' as const
const safeId = z.string().trim().min(1).max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_VERSION,
  ),
  source: z.literal(
    'canonical_server_vertex_a100_serving_account_effective_rate_publisher',
  ),
  publicationId: safeId,
  publicationVersion: z.number().int().positive().safe(),
  rateAuthorityRef: refSchema,
  disposition: z.enum(['created', 'identical_replay']),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
  ),
  pricingSetMode: z.literal(
    'vertex_online_prediction_usage_plus_management_skus',
  ),
  billingAccountPricingScopeRef: refSchema,
  pricingReaderConfigurationRef: refSchema,
  observedPredictionUsageManagementAndStorageSkus: z.literal(true),
  trainingCustomJobOrComputeSkuSetAccepted: z.literal(false),
  mixedOrDoubleCountedPricingSetAccepted: z.literal(false),
  createOnlyExactRereadCompleted: z.literal(true),
  billingAccountIdentifierReturned: z.literal(false),
  callerPriceDurationUsageOrServiceFeeAccepted: z.literal(false),
  endpointOrGpuJobStarted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  publicDeliveryAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  publishedAt: timestamp,
}).strict()
const receiptSchema = receiptWithoutHashSchema.extend({
  publicationReceiptHash: sha256,
}).strict()
export type CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt =
  z.infer<typeof receiptSchema>

const receiptV2WithoutHashSchema = receiptWithoutHashSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_V2_VERSION,
  ),
  endpointCapacityObservationRef: refSchema,
  maximumReplicaCount: z.number().int().min(1).max(16),
  maximumConcurrentInvocations: z.number().int().min(1).max(16),
  exactCurrentEndpointCapacityReread: z.literal(true),
  perReplicaPricingNotMultipliedByConfiguredMaximum: z.literal(true),
}).strict().superRefine((receipt, context) => {
  if (receipt.maximumReplicaCount !== receipt.maximumConcurrentInvocations) {
    context.addIssue({
      code: 'custom',
      message: 'Published A100 capacity and concurrency differ.',
    })
  }
})
const receiptV2Schema = receiptV2WithoutHashSchema.extend({
  publicationReceiptHash: sha256,
}).strict()
export type CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2 =
  z.infer<typeof receiptV2Schema>

export async function publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority(
  input: {
    readonly publicationId: string
    readonly publicationVersion: number
    readonly readPort: CanonicalGoogleCloudVertexA100ServingRateReadPort
    readonly repository:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository
    readonly now?: () => Date
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt> {
  const publicationId = safeId.parse(input.publicationId)
  const publicationVersion = z.number().int().positive().safe()
    .parse(input.publicationVersion)
  const authority =
    await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
      rateAuthorityId: `vertex-a100-serving-rate:${publicationId}`,
      rateAuthorityVersion: publicationVersion,
      readPort: input.readPort,
    })
  const publishedAt = timestamp.parse(
    (input.now ?? (() => new Date()))().toISOString(),
  )
  if (Date.parse(publishedAt) < Date.parse(authority.observedAt)
    || Date.parse(publishedAt) >= Date.parse(authority.expiresAt)) {
    throw new Error('Vertex A100 serving rate publication is not current.')
  }
  const persisted = await input.repository.persistCreateOnly({
    authority,
    publishedAt,
  })
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_VERSION,
    source:
      'canonical_server_vertex_a100_serving_account_effective_rate_publisher',
    publicationId,
    publicationVersion,
    rateAuthorityRef: persisted.rateAuthorityRef,
    disposition: persisted.disposition,
    executionTarget: authority.executionTarget,
    pricingSetMode: authority.pricingSetMode,
    billingAccountPricingScopeRef: authority.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: authority.pricingReaderConfigurationRef,
    observedPredictionUsageManagementAndStorageSkus: true,
    trainingCustomJobOrComputeSkuSetAccepted: false,
    mixedOrDoubleCountedPricingSetAccepted: false,
    createOnlyExactRereadCompleted: true,
    billingAccountIdentifierReturned: false,
    callerPriceDurationUsageOrServiceFeeAccepted: false,
    endpointOrGpuJobStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
    publishedAt,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    publicationReceiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt(
  value: unknown,
): CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceipt {
  const parsed = receiptSchema.parse(value)
  const { publicationReceiptHash, ...payload } = parsed
  if (publicationReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 serving rate publication receipt changed.')
  }
  return parsed
}

export async function publishCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2(
  input: {
    readonly publicationId: string
    readonly publicationVersion: number
    readonly readPort: CanonicalGoogleCloudVertexA100ServingRateReadPort
    readonly capacityObservation: unknown
    readonly repository:
      CanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository
    readonly now?: () => Date
  },
): Promise<CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2> {
  const publicationId = safeId.parse(input.publicationId)
  const publicationVersion = z.number().int().positive().safe()
    .parse(input.publicationVersion)
  const authority =
    await observeCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityV2({
      rateAuthorityId: `vertex-a100-serving-rate:${publicationId}`,
      rateAuthorityVersion: publicationVersion,
      readPort: input.readPort,
      capacityObservation: input.capacityObservation,
    })
  const publishedAt = timestamp.parse(
    (input.now ?? (() => new Date()))().toISOString(),
  )
  if (Date.parse(publishedAt) < Date.parse(authority.observedAt)
    || Date.parse(publishedAt) >= Date.parse(authority.expiresAt)) {
    throw new Error('Vertex A100 serving v2 rate publication is not current.')
  }
  const persisted = await input.repository.persistCreateOnly({
    authority,
    publishedAt,
  })
  const payload = receiptV2WithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_VERTEX_A100_SERVING_RATE_PUBLICATION_RECEIPT_V2_VERSION,
    source:
      'canonical_server_vertex_a100_serving_account_effective_rate_publisher',
    publicationId,
    publicationVersion,
    rateAuthorityRef: persisted.rateAuthorityRef,
    disposition: persisted.disposition,
    executionTarget: authority.executionTarget,
    pricingSetMode: authority.pricingSetMode,
    billingAccountPricingScopeRef: authority.billingAccountPricingScopeRef,
    pricingReaderConfigurationRef: authority.pricingReaderConfigurationRef,
    endpointCapacityObservationRef: authority.endpointCapacityObservationRef,
    maximumReplicaCount: authority.maximumReplicaCount,
    maximumConcurrentInvocations: authority.maximumConcurrentInvocations,
    exactCurrentEndpointCapacityReread: true,
    perReplicaPricingNotMultipliedByConfiguredMaximum: true,
    observedPredictionUsageManagementAndStorageSkus: true,
    trainingCustomJobOrComputeSkuSetAccepted: false,
    mixedOrDoubleCountedPricingSetAccepted: false,
    createOnlyExactRereadCompleted: true,
    billingAccountIdentifierReturned: false,
    callerPriceDurationUsageOrServiceFeeAccepted: false,
    endpointOrGpuJobStarted: false,
    walletOrCreditMutationAuthorityGranted: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
    publishedAt,
  })
  return Object.freeze(receiptV2Schema.parse({
    ...payload,
    publicationReceiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2(
  value: unknown,
): CanonicalCurrentGoogleCloudVertexA100ServingRatePublicationReceiptV2 {
  const parsed = receiptV2Schema.parse(value)
  const { publicationReceiptHash, ...payload } = parsed
  if (publicationReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex A100 serving v2 rate publication changed.')
  }
  return parsed
}
