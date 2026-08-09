import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION =
  'visual-intelligence-provider-traffic-guard-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_LEASE_VERSION =
  'visual-intelligence-provider-traffic-guard-lease-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_RELEASE_RECEIPT_VERSION =
  'visual-intelligence-provider-traffic-guard-release-receipt-v1' as const

const GUARD_OBJECT =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/provider-traffic-guard.json'
const RELEASE_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/provider-traffic-guard-releases/'
const MINIMUM_TTL_MS = 60_000
const MAXIMUM_ORDINARY_TTL_MS = 15 * 60 * 1_000
const MAXIMUM_QUALIFICATION_TTL_MS = 75 * 60 * 1_000
const MAXIMUM_RECORD_BYTES = 64 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generation = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const mode = z.enum(['ordinary_visual_intelligence_request',
  'model_billing_sku_qualification'])
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const storedRecordSchema = z.object({
  schemaVersion: z.literal(
    'visual-intelligence-provider-traffic-guard-record-v1',
  ),
  guardVersion: z.literal(VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION),
  singletonScope: z.literal(
    'reeditpro:services/C7E2-9256-1C43:gemini-3.1-pro-preview:global:standard',
  ),
  projectId: z.literal('reeditpro'),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  vertexLocation: z.literal('global'),
  throughputClass: z.literal('standard'),
  mode,
  ownerId: safeId,
  acquiredAtIso: timestamp,
  expiresAtIso: timestamp,
  leaseNonceSha256: prefixedSha256,
}).strict().superRefine((value, context) => {
  const acquired = Date.parse(value.acquiredAtIso)
  const expires = Date.parse(value.expiresAtIso)
  const maximum = value.mode === 'model_billing_sku_qualification'
    ? MAXIMUM_QUALIFICATION_TTL_MS
    : MAXIMUM_ORDINARY_TTL_MS
  if (
    expires <= acquired
    || expires - acquired < MINIMUM_TTL_MS
    || expires - acquired > maximum
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider guard interval is invalid.',
  })
})

const leaseWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_LEASE_VERSION,
  ),
  guardVersion: z.literal(VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION),
  mode,
  ownerId: safeId,
  acquiredAtIso: timestamp,
  expiresAtIso: timestamp,
  generation,
  etag: z.string().min(1).max(512),
  leaseRef: evidenceRefSchema,
  createOnlySingletonPreconditionUsed: z.literal(true),
  exactGenerationEtagAndCanonicalJsonReread: z.literal(true),
  providerCallMadeByGuard: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict()

const leaseSchema = leaseWithoutDigestSchema.extend({
  leaseDigestSha256: prefixedSha256,
}).strict()

const releaseWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_RELEASE_RECEIPT_VERSION,
  ),
  guardVersion: z.literal(VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION),
  evidenceClass: z.literal(
    'exact_singleton_generation_release_and_create_only_receipt_reread',
  ),
  mode,
  ownerId: safeId,
  acquiredAtIso: timestamp,
  releasedAtIso: timestamp,
  leaseRef: evidenceRefSchema,
  releaseReceiptRef: evidenceRefSchema,
  exactGuardGeneration: generation,
  guardHeldContinuouslyUntilRelease: z.literal(true),
  singletonGuardBodyRereadBeforeRelease: z.literal(true),
  singletonGuardDeletedWithExactGenerationPrecondition: z.literal(true),
  immutableReleaseReceiptCreateOnlyPersisted: z.literal(true),
  immutableReleaseReceiptExactReread: z.literal(true),
  providerCallMadeByGuard: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.releasedAtIso) < Date.parse(value.acquiredAtIso)
    || refKey(value.leaseRef) === refKey(value.releaseReceiptRef)
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider guard release is invalid.',
  })
})

const releaseSchema = releaseWithoutDigestSchema.extend({
  releaseReceiptDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceProviderTrafficGuardLease =
  z.infer<typeof leaseSchema>
export type VisualIntelligenceProviderTrafficGuardReleaseReceipt =
  z.infer<typeof releaseSchema>

export interface VisualIntelligenceProviderTrafficGuardPort {
  acquire(input: {
    readonly mode: z.infer<typeof mode>
    readonly ownerId: string
    readonly requestedLeaseTtlMs: number
  }): Promise<
    | {
      readonly status: 'acquired'
      readonly lease: VisualIntelligenceProviderTrafficGuardLease
    }
    | { readonly status: 'occupied' }
  >
  release(
    lease: VisualIntelligenceProviderTrafficGuardLease,
  ): Promise<VisualIntelligenceProviderTrafficGuardReleaseReceipt>
}

export interface VisualIntelligenceProviderTrafficGuardEvidenceReadPort {
  readExactReleaseReceipt(
    releaseReceiptRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceProviderTrafficGuardReleaseReceipt | null>
}

/**
 * A single project/service/model guard shared by ordinary Visual Intelligence
 * calls and the isolated billing qualification. It serializes only provider
 * calls; cache reads and deterministic work do not take the guard.
 */
export function createVisualIntelligenceGcsProviderTrafficGuard(input: {
  readonly projectId: 'reeditpro'
  readonly bucketName: string
  readonly storage?: Storage
  readonly now?: () => Date
}): VisualIntelligenceProviderTrafficGuardPort
  & VisualIntelligenceProviderTrafficGuardEvidenceReadPort {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
  ) throw new Error(
    'Visual Intelligence provider traffic guard is not configured.',
  )
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  const now = input.now ?? (() => new Date())
  return Object.freeze({
    async acquire(untrusted: {
      readonly mode: z.infer<typeof mode>
      readonly ownerId: string
      readonly requestedLeaseTtlMs: number
    }) {
      const request = parseAcquire(untrusted)
      return acquireSingleton({ bucket, request, now, attemptsRemaining: 2 })
    },
    async release(untrusted: VisualIntelligenceProviderTrafficGuardLease) {
      const lease = parseVisualIntelligenceProviderTrafficGuardLease(untrusted)
      const releasedAt = now()
      if (
        !Number.isFinite(releasedAt.getTime())
        || releasedAt.getTime() > Date.parse(lease.expiresAtIso)
      ) throw new Error(
        'Visual Intelligence provider traffic guard lease expired.',
      )
      const exact = bucket.file(GUARD_OBJECT, {
        generation: lease.generation,
      })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [metadata] = await exact.getMetadata()
      const record = parseStoredRecord(parseJson(body))
      if (
        String(metadata.generation ?? '') !== lease.generation
        || String(metadata.etag ?? '') !== lease.etag
        || String(metadata.contentType ?? '') !== 'application/json'
        || body.toString('utf8') !== visualIntelligenceCanonicalJson(record)
        || record.mode !== lease.mode
        || record.ownerId !== lease.ownerId
        || record.acquiredAtIso !== lease.acquiredAtIso
        || record.expiresAtIso !== lease.expiresAtIso
        || !sameRef(
          createLeaseRef(record, lease.generation, lease.etag),
          lease.leaseRef,
        )
      ) throw new Error(
        'Visual Intelligence provider traffic guard changed before release.',
      )
      await exact.delete({ ifGenerationMatch: lease.generation })
      const releasedAtIso = releasedAt.toISOString()
      const releaseReceiptId = `${lease.leaseRef.id}.release`
      const receiptBase = {
        schemaVersion:
          VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_RELEASE_RECEIPT_VERSION,
        guardVersion: VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION,
        evidenceClass:
          'exact_singleton_generation_release_and_create_only_receipt_reread' as const,
        mode: lease.mode,
        ownerId: lease.ownerId,
        acquiredAtIso: lease.acquiredAtIso,
        releasedAtIso,
        leaseRef: lease.leaseRef,
        exactGuardGeneration: lease.generation,
        guardHeldContinuouslyUntilRelease: true as const,
        singletonGuardBodyRereadBeforeRelease: true as const,
        singletonGuardDeletedWithExactGenerationPrecondition: true as const,
        immutableReleaseReceiptCreateOnlyPersisted: true as const,
        immutableReleaseReceiptExactReread: true as const,
        providerCallMadeByGuard: false as const,
        providerDispatchAuthorityGranted: false as const,
        customerPricingOrServiceFeeAuthorityGranted: false as const,
        walletOrCreditMutationAuthorityGranted: false as const,
        productionReleaseAuthorityGranted: false as const,
      }
      const provisionalRef = createVisualIntelligenceEvidenceRef(
        releaseReceiptId,
        receiptBase,
      )
      const payload = releaseWithoutDigestSchema.parse({
        ...receiptBase,
        releaseReceiptRef: provisionalRef,
      })
      const finalReceipt = releaseSchema.parse({
        ...payload,
        releaseReceiptDigestSha256: visualIntelligenceDigest(payload),
      })
      await persistReleaseReceipt({ bucket, receipt: finalReceipt })
      return Object.freeze(finalReceipt)
    },
    async readExactReleaseReceipt(
      untrusted: VisualIntelligenceEvidenceRef,
    ) {
      const releaseReceiptRef = evidenceRefSchema.parse(untrusted)
      const objectName = `${RELEASE_PREFIX}${
        releaseReceiptRef.contentHash.slice(7)}.json`
      const file = bucket.file(objectName)
      let body: Buffer
      try {
        [body] = await file.download({ validation: 'crc32c' })
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw new Error(
          'Visual Intelligence provider guard release reread failed.',
          { cause: error },
        )
      }
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw new Error(
          'Visual Intelligence provider guard release exceeded its bound.',
        )
      }
      const receipt =
        parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(
          parseJson(body),
        )
      if (
        !sameRef(receipt.releaseReceiptRef, releaseReceiptRef)
        || visualIntelligenceCanonicalJson(receipt) !== body.toString('utf8')
      ) throw new Error(
        'Visual Intelligence provider guard release exact reread changed.',
      )
      return receipt
    },
  })
}

export function parseVisualIntelligenceProviderTrafficGuardLease(
  value: unknown,
): VisualIntelligenceProviderTrafficGuardLease {
  const lease = leaseSchema.parse(value)
  const payload = { ...lease }
  Reflect.deleteProperty(payload, 'leaseDigestSha256')
  if (lease.leaseDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error('Visual Intelligence provider guard lease is invalid.')
  }
  return Object.freeze(lease)
}

export function parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(
  value: unknown,
): VisualIntelligenceProviderTrafficGuardReleaseReceipt {
  const receipt = releaseSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'releaseReceiptDigestSha256')
  if (receipt.releaseReceiptDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error(
      'Visual Intelligence provider guard release receipt is invalid.',
    )
  }
  const refPayload = { ...payload }
  Reflect.deleteProperty(refPayload, 'releaseReceiptRef')
  if (!sameRef(
    receipt.releaseReceiptRef,
    createVisualIntelligenceEvidenceRef(
      `${receipt.leaseRef.id}.release`,
      refPayload,
    ),
  )) throw new Error(
    'Visual Intelligence provider guard release reference is invalid.',
  )
  return Object.freeze(receipt)
}

export function visualIntelligenceProviderTrafficGuardReleaseReceiptRef(
  value: VisualIntelligenceProviderTrafficGuardReleaseReceipt,
): VisualIntelligenceEvidenceRef {
  return parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(value)
    .releaseReceiptRef
}

async function acquireSingleton(input: {
  bucket: ReturnType<Storage['bucket']>
  request: ReturnType<typeof parseAcquire>
  now: () => Date
  attemptsRemaining: number
}): Promise<
  | { status: 'acquired'; lease: VisualIntelligenceProviderTrafficGuardLease }
  | { status: 'occupied' }
> {
  const acquiredAt = input.now()
  if (!Number.isFinite(acquiredAt.getTime())) {
    throw new Error('Visual Intelligence provider guard clock is invalid.')
  }
  const record = storedRecordSchema.parse({
    schemaVersion: 'visual-intelligence-provider-traffic-guard-record-v1',
    guardVersion: VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION,
    singletonScope:
      'reeditpro:services/C7E2-9256-1C43:gemini-3.1-pro-preview:global:standard',
    projectId: 'reeditpro',
    providerServiceId: 'services/C7E2-9256-1C43',
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    vertexLocation: 'global',
    throughputClass: 'standard',
    mode: input.request.mode,
    ownerId: input.request.ownerId,
    acquiredAtIso: acquiredAt.toISOString(),
    expiresAtIso: new Date(
      acquiredAt.getTime() + input.request.requestedLeaseTtlMs,
    ).toISOString(),
    leaseNonceSha256: visualIntelligenceDigest({
      mode: input.request.mode,
      ownerId: input.request.ownerId,
      acquiredAtIso: acquiredAt.toISOString(),
      requestedLeaseTtlMs: input.request.requestedLeaseTtlMs,
    }),
  })
  const body = Buffer.from(visualIntelligenceCanonicalJson(record), 'utf8')
  const live = input.bucket.file(GUARD_OBJECT, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  try {
    await live.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'Visual Intelligence provider traffic guard acquisition failed.',
      { cause: error },
    )
    if (input.attemptsRemaining < 1) return { status: 'occupied' }
    const current = await readCurrentGuard(input.bucket)
    if (!current || Date.parse(current.record.expiresAtIso) > acquiredAt.getTime()) {
      return { status: 'occupied' }
    }
    try {
      await input.bucket.file(GUARD_OBJECT, {
        generation: current.generation,
      }).delete({ ifGenerationMatch: current.generation })
    } catch (deleteError) {
      if (![404, 412].includes(cloudErrorCode(deleteError) ?? -1)) {
        throw deleteError
      }
      return { status: 'occupied' }
    }
    return acquireSingleton({
      ...input,
      attemptsRemaining: input.attemptsRemaining - 1,
    })
  }
  const [metadata] = await live.getMetadata()
  const generationValue = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const contentType = String(metadata.contentType ?? '')
  const size = Number(metadata.size ?? -1)
  if (
    !generation.safeParse(generationValue).success
    || !etag
    || contentType !== 'application/json'
    || size !== body.byteLength
    || size > MAXIMUM_RECORD_BYTES
  ) throw new Error(
    'Visual Intelligence provider traffic guard metadata is invalid.',
  )
  const exact = input.bucket.file(GUARD_OBJECT, {
    generation: generationValue,
  })
  const [reread] = await exact.download({ validation: 'crc32c' })
  const [stable] = await exact.getMetadata()
  if (
    !reread.equals(body)
    || String(stable.generation ?? '') !== generationValue
    || String(stable.etag ?? '') !== etag
  ) throw new Error(
    'Visual Intelligence provider traffic guard exact reread failed.',
  )
  const payload = leaseWithoutDigestSchema.parse({
    schemaVersion: VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_LEASE_VERSION,
    guardVersion: VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_GUARD_VERSION,
    mode: record.mode,
    ownerId: record.ownerId,
    acquiredAtIso: record.acquiredAtIso,
    expiresAtIso: record.expiresAtIso,
    generation: generationValue,
    etag,
    leaseRef: createLeaseRef(record, generationValue, etag),
    createOnlySingletonPreconditionUsed: true,
    exactGenerationEtagAndCanonicalJsonReread: true,
    providerCallMadeByGuard: false,
    providerDispatchAuthorityGranted: false,
    customerPricingOrServiceFeeAuthorityGranted: false,
    walletOrCreditMutationAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
  return {
    status: 'acquired',
    lease: Object.freeze(leaseSchema.parse({
      ...payload,
      leaseDigestSha256: visualIntelligenceDigest(payload),
    })),
  }
}

async function readCurrentGuard(bucket: ReturnType<Storage['bucket']>) {
  const live = bucket.file(GUARD_OBJECT)
  let metadata: Record<string, unknown>
  try {
    const [raw] = await live.getMetadata()
    metadata = raw as unknown as Record<string, unknown>
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const generationValue = String(metadata.generation ?? '')
  if (!generation.safeParse(generationValue).success) {
    throw new Error('Visual Intelligence provider guard generation is invalid.')
  }
  const exact = bucket.file(GUARD_OBJECT, { generation: generationValue })
  const [body] = await exact.download({ validation: 'crc32c' })
  return {
    generation: generationValue,
    record: parseStoredRecord(parseJson(body)),
  }
}

async function persistReleaseReceipt(input: {
  bucket: ReturnType<Storage['bucket']>
  receipt: VisualIntelligenceProviderTrafficGuardReleaseReceipt
}): Promise<void> {
  const body = Buffer.from(
    visualIntelligenceCanonicalJson(input.receipt),
    'utf8',
  )
  const objectName = `${RELEASE_PREFIX}${
    input.receipt.releaseReceiptRef.contentHash.slice(7)}.json`
  const file = input.bucket.file(objectName, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  try {
    await file.save(body, {
      contentType: 'application/json',
      resumable: false,
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
    })
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw error
  }
  const [metadata] = await file.getMetadata()
  const generationValue = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const size = Number(metadata.size ?? -1)
  if (
    !generation.safeParse(generationValue).success
    || !etag
    || String(metadata.contentType ?? '') !== 'application/json'
    || size !== body.byteLength
    || size > MAXIMUM_RECORD_BYTES
  ) throw new Error(
    'Visual Intelligence provider guard release metadata is invalid.',
  )
  const exact = input.bucket.file(objectName, { generation: generationValue })
  const [reread] = await exact.download({ validation: 'crc32c' })
  const parsed = parseVisualIntelligenceProviderTrafficGuardReleaseReceipt(
    parseJson(reread),
  )
  if (
    !reread.equals(body)
    || visualIntelligenceCanonicalJson(parsed) !== body.toString('utf8')
  ) throw new Error(
    'Visual Intelligence provider guard release exact reread failed.',
  )
}

function parseAcquire(value: unknown) {
  const request = z.object({
    mode,
    ownerId: safeId,
    requestedLeaseTtlMs: z.number().int().min(MINIMUM_TTL_MS)
      .max(MAXIMUM_QUALIFICATION_TTL_MS),
  }).strict().parse(value)
  if (
    request.mode === 'ordinary_visual_intelligence_request'
    && request.requestedLeaseTtlMs > MAXIMUM_ORDINARY_TTL_MS
  ) throw new Error(
    'Visual Intelligence ordinary provider guard TTL is invalid.',
  )
  return request
}

function parseStoredRecord(value: unknown) {
  return storedRecordSchema.parse(value)
}

function createLeaseRef(
  record: z.infer<typeof storedRecordSchema>,
  generationValue: string,
  etag: string,
) {
  return createVisualIntelligenceEvidenceRef(
    `visual-intelligence-provider-guard-${record.ownerId}`,
    { record, generation: generationValue, etag },
  )
}

function parseJson(value: Buffer): unknown {
  try {
    return JSON.parse(value.toString('utf8')) as unknown
  } catch {
    throw new Error('Visual Intelligence provider guard record is not JSON.')
  }
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = Reflect.get(error, 'code')
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}
