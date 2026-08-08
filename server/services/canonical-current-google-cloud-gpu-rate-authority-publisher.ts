import { z } from 'zod'

import {
  CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS,
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateReadPort,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import type {
  CanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLISHER_VERSION =
  'canonical-current-google-cloud-gpu-rate-authority-publisher-v1' as const
export const CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLICATION_RECEIPT_VERSION =
  'canonical-current-google-cloud-gpu-rate-authority-publication-receipt-v1' as const

const routeDefinitions = [
  { routeId: 'a100_80gb_heavy_primary', region: 'us-central1' },
  { routeId: 'l4_heavy_fallback', region: 'europe-west4' },
  { routeId: 'l4_standard_primary', region: 'us-central1' },
] as const
const safeId = z.string().trim().min(1).max(120)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(240)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u),
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const routePublicationSchema = z.object({
  routeId: z.enum(CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS),
  region: z.enum(['us-central1', 'europe-west4']),
  rateAuthorityRef: evidenceRefSchema,
  disposition: z.enum(['created', 'identical_replay']),
}).strict()
const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLISHER_VERSION,
  ),
  source: z.literal(
    'canonical_server_account_effective_gpu_rate_authority_publisher',
  ),
  evidenceClass: z.literal(
    'all_routes_billing_api_reread_then_create_only_exact_repository_reread',
  ),
  publicationId: safeId,
  publicationVersion: positiveInteger,
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  routePublications: z.array(routePublicationSchema).length(3),
  publishedAt: timestamp,
  allCanonicalRoutesObservedBeforeAnyPersistence: z.literal(true),
  exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: z.literal(true),
  createOnlyExactRereadCompletedForEveryRoute: z.literal(true),
  billingAccountIdentifierReturned: z.literal(false),
  callerPriceRouteDurationOrServiceFeeAccepted: z.literal(false),
  providerOrGpuJobStarted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((receipt, context) => {
  const routeIds = receipt.routePublications.map((route) => route.routeId)
  if (stableAuthorityStringify(routeIds)
    !== stableAuthorityStringify(CANONICAL_GOOGLE_CLOUD_GPU_RATE_ROUTE_IDS)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU rate publication receipt lost its canonical route order.',
    })
  }
})
const receiptSchema = receiptWithoutHashSchema.extend({
  publicationReceiptHash: rawSha256,
}).strict()

export type CanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt =
  z.infer<typeof receiptSchema>

/**
 * Observes every quality-first GPU route against one exact Google Cloud
 * billing-account pricing scope before it persists any authority. The
 * resulting refs are internal tool-cost inputs only: no user price, service
 * fee, wallet mutation, GPU launch, or production authority is created here.
 */
export async function publishCanonicalCurrentGoogleCloudGpuRateAuthorities(
  input: {
    readonly publicationId: string
    readonly publicationVersion: number
    readonly readPort: CanonicalGoogleCloudGpuRateReadPort
    readonly repository:
      CanonicalCurrentGoogleCloudGpuRateAuthorityRepository
    readonly now?: () => Date
  },
): Promise<CanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt> {
  const publicationId = safeId.parse(input.publicationId)
  const publicationVersion = positiveInteger.parse(input.publicationVersion)
  if (!input.readPort
    || typeof input.readPort.readCurrentRouteRate !== 'function'
    || !input.repository
    || typeof input.repository.persistCurrentRateAuthorityCreateOnly
      !== 'function') {
    throw new Error('Canonical GPU rate publisher is not configured.')
  }

  const authorities = []
  for (const route of routeDefinitions) {
    authorities.push(
      await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
        rateAuthorityId: `gpu-rate:${publicationId}:${route.routeId}`,
        rateAuthorityVersion: publicationVersion,
        routeId: route.routeId,
        region: route.region,
        readPort: input.readPort,
      }),
    )
  }
  const pricingScope = authorities[0].billingAccountPricingScopeRef
  const readerConfiguration = authorities[0].pricingReaderConfigurationRef
  if (authorities.some((authority, index) =>
    authority.routeId !== routeDefinitions[index].routeId
    || authority.region !== routeDefinitions[index].region
    || stableAuthorityStringify(authority.billingAccountPricingScopeRef)
      !== stableAuthorityStringify(pricingScope)
    || stableAuthorityStringify(authority.pricingReaderConfigurationRef)
      !== stableAuthorityStringify(readerConfiguration))) {
    throw new Error(
      'Canonical GPU rate publication observations do not form one exact set.',
    )
  }

  const publishedAt = timestamp.parse(
    (input.now ?? (() => new Date()))().toISOString(),
  )
  if (authorities.some((authority) =>
    Date.parse(publishedAt) < Date.parse(authority.observedAt)
    || Date.parse(publishedAt) >= Date.parse(authority.expiresAt))) {
    throw new Error('Canonical GPU rate publication time is not current.')
  }

  const routePublications = []
  for (const [index, authority] of authorities.entries()) {
    const persisted = await input.repository
      .persistCurrentRateAuthorityCreateOnly({ authority, publishedAt })
    routePublications.push(routePublicationSchema.parse({
      routeId: routeDefinitions[index].routeId,
      region: routeDefinitions[index].region,
      rateAuthorityRef: persisted.rateAuthorityRef,
      disposition: persisted.disposition,
    }))
  }
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLICATION_RECEIPT_VERSION,
    publisherVersion:
      CANONICAL_CURRENT_GOOGLE_CLOUD_GPU_RATE_AUTHORITY_PUBLISHER_VERSION,
    source: 'canonical_server_account_effective_gpu_rate_authority_publisher',
    evidenceClass:
      'all_routes_billing_api_reread_then_create_only_exact_repository_reread',
    publicationId,
    publicationVersion,
    billingAccountPricingScopeRef: pricingScope,
    pricingReaderConfigurationRef: readerConfiguration,
    routePublications,
    publishedAt,
    allCanonicalRoutesObservedBeforeAnyPersistence: true,
    exactBillingAccountSkuRegionCurrencyTierAndPricePreserved: true,
    createOnlyExactRereadCompletedForEveryRoute: true,
    billingAccountIdentifierReturned: false,
    callerPriceRouteDurationOrServiceFeeAccepted: false,
    providerOrGpuJobStarted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
  return Object.freeze(receiptSchema.parse({
    ...payload,
    publicationReceiptHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt(
  value: unknown,
): CanonicalCurrentGoogleCloudGpuRateAuthorityPublicationReceipt {
  const parsed = receiptSchema.parse(value)
  const { publicationReceiptHash, ...payload } = parsed
  if (publicationReceiptHash !== sha256AuthorityValue(payload)) {
    throw new Error('Canonical GPU rate publication receipt is invalid.')
  }
  return Object.freeze(parsed)
}
