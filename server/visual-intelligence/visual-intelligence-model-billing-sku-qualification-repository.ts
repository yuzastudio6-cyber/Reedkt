import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'
import type {
  VisualIntelligenceModelBillingSkuQualificationRepository,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  parseVisualIntelligenceModelBillingSkuQualification,
  visualIntelligenceModelBillingSkuQualificationRef,
  type VisualIntelligenceModelBillingSkuQualification,
} from './visual-intelligence-model-billing-sku-qualification'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_REPOSITORY_VERSION =
  'visual-intelligence-model-billing-sku-qualification-repository-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/model-sku-qualifications/'
const MAXIMUM_OBJECT_BYTES = 512 * 1024
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generationSchema = z.string().regex(/^[1-9][0-9]{0,30}$/u)

/**
 * Create-only private storage for the final audit-and-billing-reconciled
 * model/SKU qualification. It never queries billing, calls a provider, grants
 * runtime, mutates credits, or promotes production readiness.
 */
export function createVisualIntelligenceModelBillingSkuQualificationRepository(
  input: {
    readonly projectId: 'reeditpro'
    readonly bucketName: string
    readonly storage?: Storage
  },
): VisualIntelligenceModelBillingSkuQualificationRepository {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
  ) throw new Error(
    'Visual Intelligence model/SKU qualification repository is not configured.',
  )
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  return Object.freeze({
    async persistCreateOnly(
      untrusted: VisualIntelligenceModelBillingSkuQualification,
    ) {
      const qualification =
        parseVisualIntelligenceModelBillingSkuQualification(untrusted)
      const qualificationRef =
        visualIntelligenceModelBillingSkuQualificationRef(qualification)
      const body = Buffer.from(
        visualIntelligenceCanonicalJson(qualification),
        'utf8',
      )
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
        throw new Error(
          'Visual Intelligence model/SKU qualification exceeded its bound.',
        )
      }
      const objectName = objectNameForRef(qualificationRef)
      const live = bucket.file(objectName, {
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
          'Visual Intelligence model/SKU qualification persistence failed.',
          { cause: error },
        )
      }
      const coordinate = await exactCoordinate({
        bucket,
        objectName,
        expectedBody: body,
      })
      return Object.freeze({
        qualificationRef,
        persistenceReceiptRef: createVisualIntelligenceEvidenceRef(
          `${qualificationRef.id}.persistence-receipt`,
          {
            repositoryVersion:
              VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_QUALIFICATION_REPOSITORY_VERSION,
            projectId: input.projectId,
            bucketName: input.bucketName,
            objectName,
            ...coordinate,
            contentType: 'application/json',
            byteLength: body.byteLength,
            contentSha256: rawDigest(body),
            qualificationRef,
            createOnlyPersisted: true,
            exactGenerationEtagDigestAndCanonicalJsonReread: true,
            providerCallMadeByRepository: false,
            billingExportQueriedByRepository: false,
            customerCreditOrWalletMutationAuthorityGranted: false,
            productionReleaseAuthorityGranted: false,
          },
          qualificationRef.version,
        ),
        createOnlyPersisted: true as const,
        exactRereadVerified: true as const,
      })
    },

    async readExact(untrusted: VisualIntelligenceEvidenceRef) {
      const qualificationRef = evidenceRef(untrusted)
      const objectName = objectNameForRef(qualificationRef)
      const live = bucket.file(objectName)
      let body: Buffer
      try {
        [body] = await live.download({ validation: 'crc32c' })
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw new Error(
          'Visual Intelligence model/SKU qualification reread failed.',
          { cause: error },
        )
      }
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
        throw new Error(
          'Visual Intelligence model/SKU qualification exceeded its bound.',
        )
      }
      const qualification =
        parseVisualIntelligenceModelBillingSkuQualification(parseJson(body))
      if (
        !sameRef(
          visualIntelligenceModelBillingSkuQualificationRef(qualification),
          qualificationRef,
        )
        || visualIntelligenceCanonicalJson(qualification)
          !== body.toString('utf8')
      ) throw new Error(
        'Visual Intelligence model/SKU qualification identity changed.',
      )
      return qualification
    },
  })
}

async function exactCoordinate(input: {
  bucket: ReturnType<Storage['bucket']>
  objectName: string
  expectedBody: Buffer
}): Promise<{ generation: string; etag: string }> {
  const live = input.bucket.file(input.objectName)
  const [metadata] = await live.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  if (
    !generationSchema.safeParse(generation).success
    || !etag
    || String(metadata.contentType ?? '') !== 'application/json'
    || Number(metadata.size ?? -1) !== input.expectedBody.byteLength
  ) throw new Error(
    'Visual Intelligence model/SKU qualification metadata is invalid.',
  )
  const exact = input.bucket.file(input.objectName, { generation })
  const [body] = await exact.download({ validation: 'crc32c' })
  const [stable] = await exact.getMetadata()
  if (
    !body.equals(input.expectedBody)
    || String(stable.generation ?? '') !== generation
    || String(stable.etag ?? '') !== etag
    || String(stable.contentType ?? '') !== 'application/json'
  ) throw new Error(
    'Visual Intelligence model/SKU qualification exact reread failed.',
  )
  return { generation, etag }
}

function objectNameForRef(reference: VisualIntelligenceEvidenceRef): string {
  const parsed = evidenceRef(reference)
  return `${OBJECT_PREFIX}${parsed.contentHash.slice(7)}.json`
}

function evidenceRef(value: VisualIntelligenceEvidenceRef) {
  return z.object({
    id: z.string().trim().min(1).max(240)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
      .refine((id) => !id.includes('..')),
    version: z.number().int().positive().safe(),
    contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  }).strict().parse(value)
}

function parseJson(value: Buffer): unknown {
  try {
    return JSON.parse(value.toString('utf8')) as unknown
  } catch (error) {
    throw new Error(
      'Visual Intelligence model/SKU qualification is not JSON.',
      { cause: error },
    )
  }
}

function rawDigest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return `${left.id}:${left.version}:${left.contentHash}`
    === `${right.id}:${right.version}:${right.contentHash}`
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const parsed = Number(Reflect.get(error, 'code'))
  return Number.isInteger(parsed) ? parsed : undefined
}
