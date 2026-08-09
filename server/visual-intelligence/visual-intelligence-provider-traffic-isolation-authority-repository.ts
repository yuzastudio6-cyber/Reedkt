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
import {
  parseVisualIntelligenceProviderTrafficIsolationAuthority,
  visualIntelligenceProviderTrafficIsolationAuthorityRef,
  type VisualIntelligenceProviderTrafficIsolationAuthority,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import type {
  VisualIntelligenceProviderTrafficIsolationAuthorityRepository,
} from './visual-intelligence-provider-traffic-isolation-authority-finalizer'

export const VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_REPOSITORY_VERSION =
  'visual-intelligence-provider-traffic-isolation-authority-repository-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/provider-traffic-isolation-authorities/'
const MAXIMUM_OBJECT_BYTES = 512 * 1024
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generationSchema = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

/**
 * Create-only private storage for the final audit-backed isolation authority.
 * It does not acquire the guard, query Cloud Audit, or call the provider.
 */
export function createVisualIntelligenceProviderTrafficIsolationAuthorityRepository(
  input: {
    readonly projectId: 'reeditpro'
    readonly bucketName: string
    readonly storage?: Storage
  },
): VisualIntelligenceProviderTrafficIsolationAuthorityRepository {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
  ) throw new Error(
    'Visual Intelligence provider isolation repository is not configured.',
  )
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  return Object.freeze({
    async persistCreateOnly(
      untrusted: VisualIntelligenceProviderTrafficIsolationAuthority,
    ) {
      const authority =
        parseVisualIntelligenceProviderTrafficIsolationAuthority(untrusted)
      const authorityRef =
        visualIntelligenceProviderTrafficIsolationAuthorityRef(authority)
      const body = Buffer.from(
        visualIntelligenceCanonicalJson(authority),
        'utf8',
      )
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
        throw new Error(
          'Visual Intelligence provider isolation authority exceeded its bound.',
        )
      }
      const objectName = objectNameForRef(authorityRef)
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
          'Visual Intelligence provider isolation persistence failed.',
          { cause: error },
        )
      }
      const [metadata] = await live.getMetadata()
      const generation = String(metadata.generation ?? '')
      const etag = String(metadata.etag ?? '')
      if (
        !generationSchema.safeParse(generation).success
        || !etag
        || String(metadata.contentType ?? '') !== 'application/json'
        || Number(metadata.size ?? -1) !== body.byteLength
      ) throw new Error(
        'Visual Intelligence provider isolation metadata is invalid.',
      )
      const exact = bucket.file(objectName, { generation })
      const [reread] = await exact.download({ validation: 'crc32c' })
      const [stable] = await exact.getMetadata()
      const parsed =
        parseVisualIntelligenceProviderTrafficIsolationAuthority(
          parseJson(reread),
        )
      if (
        !reread.equals(body)
        || String(stable.generation ?? '') !== generation
        || String(stable.etag ?? '') !== etag
        || !sameRef(
          visualIntelligenceProviderTrafficIsolationAuthorityRef(parsed),
          authorityRef,
        )
        || visualIntelligenceCanonicalJson(parsed) !== body.toString('utf8')
      ) throw new Error(
        'Visual Intelligence provider isolation exact reread failed.',
      )
      return Object.freeze({
        authorityRef,
        persistenceReceiptRef: createVisualIntelligenceEvidenceRef(
          `${authorityRef.id}.persistence-receipt`,
          {
            repositoryVersion:
              VISUAL_INTELLIGENCE_PROVIDER_TRAFFIC_ISOLATION_AUTHORITY_REPOSITORY_VERSION,
            projectId: input.projectId,
            bucketName: input.bucketName,
            objectName,
            generation,
            etag,
            byteLength: body.byteLength,
            contentSha256: rawDigest(body),
            authorityRef,
            createOnlyPersisted: true,
            exactGenerationEtagDigestAndCanonicalJsonReread: true,
            providerCallMadeByRepository: false,
            providerDispatchAuthorityGranted: false,
            customerPricingOrServiceFeeAuthorityGranted: false,
            walletOrCreditMutationAuthorityGranted: false,
            productionReleaseAuthorityGranted: false,
          },
          authorityRef.version,
        ),
        createOnlyPersisted: true as const,
        exactRereadVerified: true as const,
      })
    },

    async readExact(untrusted: VisualIntelligenceEvidenceRef) {
      const authorityRef = evidenceRefSchema.parse(untrusted)
      const file = bucket.file(objectNameForRef(authorityRef))
      let body: Buffer
      try {
        [body] = await file.download({ validation: 'crc32c' })
      } catch (error) {
        if (cloudErrorCode(error) === 404) return null
        throw new Error(
          'Visual Intelligence provider isolation reread failed.',
          { cause: error },
        )
      }
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
        throw new Error(
          'Visual Intelligence provider isolation reread exceeded its bound.',
        )
      }
      const authority =
        parseVisualIntelligenceProviderTrafficIsolationAuthority(
          parseJson(body),
        )
      if (
        !sameRef(
          visualIntelligenceProviderTrafficIsolationAuthorityRef(authority),
          authorityRef,
        )
        || visualIntelligenceCanonicalJson(authority) !== body.toString('utf8')
      ) throw new Error(
        'Visual Intelligence provider isolation authority changed.',
      )
      return authority
    },
  })
}

function objectNameForRef(reference: VisualIntelligenceEvidenceRef): string {
  const parsed = evidenceRefSchema.parse(reference)
  return `${OBJECT_PREFIX}${parsed.contentHash.slice(7)}.json`
}

function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error(
      'Visual Intelligence provider isolation authority is not JSON.',
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
