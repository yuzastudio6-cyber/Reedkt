import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  parseVisualIntelligenceProviderAuditWindowObservation,
  visualIntelligenceProviderAuditWindowObservationRef,
  type VisualIntelligenceProviderAuditWindowObservation,
} from './visual-intelligence-provider-audit-window-read-port'

export const VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_REPOSITORY_VERSION =
  'visual-intelligence-provider-audit-window-observation-repository-v1' as const
export const VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_PUBLICATION_RECEIPT_VERSION =
  'visual-intelligence-provider-audit-window-observation-publication-receipt-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/provider-audit-windows/'
const MAXIMUM_OBJECT_BYTES = 512 * 1024
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const generationSchema = z.string().regex(/^[1-9][0-9]{0,30}$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
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
    VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_PUBLICATION_RECEIPT_VERSION,
  ),
  repositoryVersion: z.literal(
    VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_REPOSITORY_VERSION,
  ),
  evidenceClass: z.literal('create_only_gcs_exact_generation_reread'),
  projectId: z.literal('reeditpro'),
  bucketName: bucketNameSchema,
  objectName: z.string().startsWith(OBJECT_PREFIX).endsWith('.json')
    .max(1_024),
  generation: generationSchema,
  etag: z.string().min(1).max(512),
  contentType: z.literal('application/json'),
  byteLength: z.number().int().positive().max(MAXIMUM_OBJECT_BYTES),
  contentSha256: rawSha256,
  observationRef: evidenceRefSchema,
  queryConfigurationRef: evidenceRefSchema,
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  disposition: z.enum(['created', 'already_exists_exact']),
  createOnlyPreconditionUsed: z.literal(true),
  exactGenerationEtagDigestAndCanonicalJsonReread: z.literal(true),
  rawAuditRequestOrResponsePayloadPersisted: z.literal(false),
  rawPromptOrMediaLocatorPersisted: z.literal(false),
  providerCallMadeByRepository: z.literal(false),
  providerDispatchAuthorityGranted: z.literal(false),
  customerPricingOrServiceFeeAuthorityGranted: z.literal(false),
  walletOrCreditMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.objectName.includes('..')
    || value.objectName.includes('\\')
    || value.objectName.includes('//')
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence provider audit observation path is invalid.',
  })
})

const receiptSchema = receiptWithoutDigestSchema.extend({
  publicationReceiptDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceProviderAuditWindowObservationPublicationReceipt =
  z.infer<typeof receiptSchema>

export interface VisualIntelligenceProviderAuditWindowObservationRepository {
  persistCreateOnly(
    observation: VisualIntelligenceProviderAuditWindowObservation,
  ): Promise<VisualIntelligenceProviderAuditWindowObservationPublicationReceipt>
  readExact(
    receipt: VisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
  ): Promise<VisualIntelligenceProviderAuditWindowObservation>
}

/**
 * Persists only the sanitized audit-window observation. The raw Cloud Audit
 * request and response payloads are never accepted by this repository.
 */
export function createVisualIntelligenceProviderAuditWindowObservationRepository(
  input: {
    readonly projectId: 'reeditpro'
    readonly bucketName: string
    readonly storage?: Storage
  },
): VisualIntelligenceProviderAuditWindowObservationRepository {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
  ) throw new Error(
    'Visual Intelligence provider audit repository is not configured.',
  )
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  return Object.freeze({
    async persistCreateOnly(
      untrusted: VisualIntelligenceProviderAuditWindowObservation,
    ) {
      const observation =
        parseVisualIntelligenceProviderAuditWindowObservation(untrusted)
      const observationRef =
        visualIntelligenceProviderAuditWindowObservationRef(observation)
      const body = Buffer.from(
        visualIntelligenceCanonicalJson(observation),
        'utf8',
      )
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
        throw new Error(
          'Visual Intelligence provider audit observation exceeded its bound.',
        )
      }
      const contentSha256 = rawDigest(body)
      const objectName = `${OBJECT_PREFIX}${observation.observationId}-v${
        observation.observationVersion}-${
        observation.observationDigestSha256.slice(7, 23)}.json`
      const live = bucket.file(objectName, {
        preconditionOpts: { ifGenerationMatch: 0 },
      })
      let disposition: 'created' | 'already_exists_exact' = 'created'
      try {
        await live.save(body, {
          contentType: 'application/json',
          resumable: false,
          validation: 'crc32c',
          preconditionOpts: { ifGenerationMatch: 0 },
        })
      } catch (error) {
        if (cloudErrorCode(error) !== 412) throw new Error(
          'Visual Intelligence provider audit observation persistence failed.',
          { cause: error },
        )
        disposition = 'already_exists_exact'
      }
      const coordinate = await exactCoordinate({
        bucket,
        objectName,
        expectedBody: body,
        expectedContentSha256: contentSha256,
      })
      const payload = receiptWithoutDigestSchema.parse({
        schemaVersion:
          VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_PUBLICATION_RECEIPT_VERSION,
        repositoryVersion:
          VISUAL_INTELLIGENCE_PROVIDER_AUDIT_WINDOW_OBSERVATION_REPOSITORY_VERSION,
        evidenceClass: 'create_only_gcs_exact_generation_reread',
        projectId: input.projectId,
        bucketName: input.bucketName,
        objectName,
        ...coordinate,
        contentType: 'application/json',
        byteLength: body.byteLength,
        contentSha256,
        observationRef,
        queryConfigurationRef: observation.queryConfigurationRef,
        qualificationWindowStartedAtIso:
          observation.qualificationWindowStartedAtIso,
        qualificationWindowFinishedAtIso:
          observation.qualificationWindowFinishedAtIso,
        disposition,
        createOnlyPreconditionUsed: true,
        exactGenerationEtagDigestAndCanonicalJsonReread: true,
        rawAuditRequestOrResponsePayloadPersisted: false,
        rawPromptOrMediaLocatorPersisted: false,
        providerCallMadeByRepository: false,
        providerDispatchAuthorityGranted: false,
        customerPricingOrServiceFeeAuthorityGranted: false,
        walletOrCreditMutationAuthorityGranted: false,
        productionReleaseAuthorityGranted: false,
      })
      return Object.freeze(receiptSchema.parse({
        ...payload,
        publicationReceiptDigestSha256: visualIntelligenceDigest(payload),
      }))
    },

    async readExact(
      untrusted:
        VisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
    ) {
      const receipt =
        parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
          untrusted,
        )
      if (
        receipt.projectId !== input.projectId
        || receipt.bucketName !== input.bucketName
      ) throw new Error(
        'Visual Intelligence provider audit repository scope changed.',
      )
      const exact = bucket.file(receipt.objectName, {
        generation: receipt.generation,
      })
      const [body] = await exact.download({ validation: 'crc32c' })
      const [metadata] = await exact.getMetadata()
      if (
        body.byteLength !== receipt.byteLength
        || rawDigest(body) !== receipt.contentSha256
        || String(metadata.generation ?? '') !== receipt.generation
        || String(metadata.etag ?? '') !== receipt.etag
        || String(metadata.contentType ?? '') !== receipt.contentType
      ) throw new Error(
        'Visual Intelligence provider audit exact reread changed.',
      )
      const observation =
        parseVisualIntelligenceProviderAuditWindowObservation(parseJson(body))
      if (
        visualIntelligenceCanonicalJson(observation) !== body.toString('utf8')
        || !sameRef(
          visualIntelligenceProviderAuditWindowObservationRef(observation),
          receipt.observationRef,
        )
        || !sameRef(
          observation.queryConfigurationRef,
          receipt.queryConfigurationRef,
        )
        || observation.qualificationWindowStartedAtIso
          !== receipt.qualificationWindowStartedAtIso
        || observation.qualificationWindowFinishedAtIso
          !== receipt.qualificationWindowFinishedAtIso
      ) throw new Error(
        'Visual Intelligence provider audit observation lineage changed.',
      )
      return observation
    },
  })
}

export function parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
  value: unknown,
): VisualIntelligenceProviderAuditWindowObservationPublicationReceipt {
  const receipt = receiptSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'publicationReceiptDigestSha256')
  if (receipt.publicationReceiptDigestSha256
    !== visualIntelligenceDigest(payload)) throw new Error(
    'Visual Intelligence provider audit publication receipt digest is invalid.',
  )
  return Object.freeze(receipt)
}

export function visualIntelligenceProviderAuditWindowObservationPublicationReceiptRef(
  value: VisualIntelligenceProviderAuditWindowObservationPublicationReceipt,
): VisualIntelligenceEvidenceRef {
  const receipt =
    parseVisualIntelligenceProviderAuditWindowObservationPublicationReceipt(
      value,
    )
  return createVisualIntelligenceEvidenceRef(
    `${receipt.observationRef.id}.publication-receipt`,
    receipt,
    receipt.observationRef.version,
  )
}

async function exactCoordinate(input: {
  bucket: ReturnType<Storage['bucket']>
  objectName: string
  expectedBody: Buffer
  expectedContentSha256: string
}): Promise<{ generation: string; etag: string }> {
  const live = input.bucket.file(input.objectName)
  const [metadata] = await live.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  const contentType = String(metadata.contentType ?? '')
  const byteLength = Number(metadata.size ?? -1)
  if (
    !generationSchema.safeParse(generation).success
    || !etag
    || contentType !== 'application/json'
    || byteLength !== input.expectedBody.byteLength
    || byteLength > MAXIMUM_OBJECT_BYTES
  ) throw new Error(
    'Visual Intelligence provider audit observation metadata is invalid.',
  )
  const exact = input.bucket.file(input.objectName, { generation })
  const [reread] = await exact.download({ validation: 'crc32c' })
  const [stable] = await exact.getMetadata()
  if (
    !reread.equals(input.expectedBody)
    || rawDigest(reread) !== input.expectedContentSha256
    || String(stable.generation ?? '') !== generation
    || String(stable.etag ?? '') !== etag
  ) throw new Error(
    'Visual Intelligence provider audit observation exact reread failed.',
  )
  return { generation, etag }
}

function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error(
      'Visual Intelligence provider audit observation is not JSON.',
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
