import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  parseVisualIntelligenceAccountEffectiveRateAuthority,
  rateAuthorityRef,
} from './visual-intelligence-account-effective-cost-owner'
import type {
  VisualIntelligenceAccountEffectivePricingObservationPort,
} from './visual-intelligence-account-effective-rate-read-port'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLISHER_VERSION =
  'visual-intelligence-account-effective-rate-publisher-v1' as const
export const VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLICATION_RECEIPT_VERSION =
  'visual-intelligence-account-effective-rate-publication-receipt-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/pricing/account-effective/v2/'
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generationSchema = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const receiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLICATION_RECEIPT_VERSION,
  ),
  publisherVersion: z.literal(
    VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLISHER_VERSION,
  ),
  evidenceClass: z.literal('create_only_gcs_exact_generation_reread'),
  projectId: z.literal('reeditpro'),
  bucketName: bucketNameSchema,
  objectName: z.string().startsWith(OBJECT_PREFIX).endsWith('.json')
    .max(1_024),
  generation: generationSchema,
  etag: z.string().min(1).max(512),
  contentType: z.literal('application/json'),
  byteLength: z.number().int().positive().max(512 * 1024),
  contentSha256: rawSha256,
  rateAuthorityRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  exactModelBillingSkuCompatibilityQualificationRef: evidenceRefSchema,
  disposition: z.enum(['created', 'already_exists_exact']),
  createOnlyPreconditionUsed: z.literal(true),
  exactGenerationEtagDigestAndCanonicalJsonReread: z.literal(true),
  billingAccountIdentifierReturned: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  runtimeReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.objectName.includes('..')
    || value.objectName.includes('\\')
    || value.objectName.includes('//')
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence rate publication path is invalid.',
  })
})

const receiptSchema = receiptWithoutDigestSchema.extend({
  publicationReceiptDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceAccountEffectiveRatePublicationReceipt = z.infer<
  typeof receiptSchema
>

/**
 * Publishes one billing-account-effective rate authority as immutable JSON.
 * This operator does not grant runtime release, customer pricing, wallet, or
 * provider authority. Deployment must separately bind the returned exact GCS
 * coordinate into its secret-managed runtime configuration.
 */
export async function publishVisualIntelligenceAccountEffectiveRateAuthority(
  input: {
    readonly projectId: 'reeditpro'
    readonly bucketName: string
    readonly pricingApiObservationId: string
    readonly pricingApiObservationVersion: number
    readonly pricingObservationPort:
      VisualIntelligenceAccountEffectivePricingObservationPort
    readonly storage?: Storage
  },
): Promise<VisualIntelligenceAccountEffectiveRatePublicationReceipt> {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
    || !safeId.safeParse(input.pricingApiObservationId).success
    || !Number.isSafeInteger(input.pricingApiObservationVersion)
    || input.pricingApiObservationVersion < 1
    || !input.pricingObservationPort
    || typeof input.pricingObservationPort.readCurrent !== 'function'
  ) throw new Error(
    'Visual Intelligence account-effective rate publisher is not configured.',
  )
  const authority = parseVisualIntelligenceAccountEffectiveRateAuthority(
    await input.pricingObservationPort.readCurrent({
      pricingApiObservationId: input.pricingApiObservationId,
      pricingApiObservationVersion: input.pricingApiObservationVersion,
    }),
  )
  if (
    authority.pricingApiObservationRef.id
      !== input.pricingApiObservationId
    || authority.pricingApiObservationRef.version
      !== input.pricingApiObservationVersion
  ) throw new Error(
    'Visual Intelligence price observation identity changed.',
  )
  const body = Buffer.from(visualIntelligenceCanonicalJson(authority), 'utf8')
  const contentSha256 = rawDigest(body)
  const objectName = `${OBJECT_PREFIX}${
    input.pricingApiObservationId
  }-v${input.pricingApiObservationVersion}-${
    authority.rateAuthorityDigestSha256.slice(7, 23)
  }.json`
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  const liveFile = bucket.file(objectName, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  let disposition: 'created' | 'already_exists_exact' = 'created'
  try {
    await liveFile.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'Visual Intelligence rate authority publication failed.',
      { cause: error },
    )
    disposition = 'already_exists_exact'
  }
  const [metadata] = await liveFile.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const contentType = String(metadata.contentType ?? '')
  const byteLength = Number(metadata.size ?? -1)
  if (
    !generationSchema.safeParse(generation).success
    || !etag
    || contentType !== 'application/json'
    || byteLength !== body.byteLength
  ) throw new Error(
    'Visual Intelligence rate publication metadata is invalid.',
  )
  const exactFile = bucket.file(objectName, { generation })
  const [reread] = await exactFile.download({ validation: 'crc32c' })
  const [stableMetadata] = await exactFile.getMetadata()
  const parsed = parseVisualIntelligenceAccountEffectiveRateAuthority(
    parseJson(reread),
  )
  if (
    !reread.equals(body)
    || rawDigest(reread) !== contentSha256
    || visualIntelligenceCanonicalJson(parsed) !== reread.toString('utf8')
    || String(stableMetadata.generation ?? '') !== generation
    || String(stableMetadata.etag ?? '') !== etag
  ) throw new Error(
    'Visual Intelligence rate publication exact reread failed.',
  )
  const receiptPayload = receiptWithoutDigestSchema.parse({
    schemaVersion:
      VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLICATION_RECEIPT_VERSION,
    publisherVersion:
      VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_PUBLISHER_VERSION,
    evidenceClass: 'create_only_gcs_exact_generation_reread',
    projectId: input.projectId,
    bucketName: input.bucketName,
    objectName,
    generation,
    etag,
    contentType,
    byteLength,
    contentSha256,
    rateAuthorityRef: rateAuthorityRef(parsed),
    pricingReaderConfigurationRef: parsed.pricingReaderConfigurationRef,
    exactModelBillingSkuCompatibilityQualificationRef:
      parsed.exactModelBillingSkuCompatibilityQualificationRef,
    disposition,
    createOnlyPreconditionUsed: true,
    exactGenerationEtagDigestAndCanonicalJsonReread: true,
    billingAccountIdentifierReturned: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    runtimeReleaseAuthorityGranted: false,
  })
  return Object.freeze(receiptSchema.parse({
    ...receiptPayload,
    publicationReceiptDigestSha256:
      visualIntelligenceDigest(receiptPayload),
  }))
}

export function parseVisualIntelligenceAccountEffectiveRatePublicationReceipt(
  value: unknown,
): VisualIntelligenceAccountEffectiveRatePublicationReceipt {
  const receipt = receiptSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'publicationReceiptDigestSha256')
  if (receipt.publicationReceiptDigestSha256
    !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence rate publication receipt digest is invalid.',
    )
  }
  return Object.freeze(receipt)
}

function parseJson(value: Buffer): unknown {
  try {
    return JSON.parse(value.toString('utf8')) as unknown
  } catch {
    throw new Error('Visual Intelligence rate publication is not JSON.')
  }
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}
