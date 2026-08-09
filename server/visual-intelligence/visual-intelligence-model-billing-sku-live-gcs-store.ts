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
  parseVisualIntelligenceModelBillingContextEvidence,
  visualIntelligenceModelBillingContextEvidenceRef,
  type VisualIntelligenceModelBillingContextEvidence,
} from './visual-intelligence-model-billing-sku-qualification-finalizer'
import {
  parseVisualIntelligenceModelBillingSkuLiveAdmission,
  parseVisualIntelligenceModelBillingSkuLiveResult,
  visualIntelligenceModelBillingSkuLiveAdmissionRef,
  visualIntelligenceModelBillingSkuLiveResultRef,
  type VisualIntelligenceModelBillingContextEvidenceRepository,
  type VisualIntelligenceModelBillingSkuLiveAdmission,
  type VisualIntelligenceModelBillingSkuLiveAdmissionReadPort,
  type VisualIntelligenceModelBillingSkuLiveAttemptStore,
  type VisualIntelligenceModelBillingSkuLiveResult,
  type VisualIntelligenceModelBillingSkuLiveResultRepository,
} from './visual-intelligence-model-billing-sku-live-executor'
import {
  parseVisualIntelligenceCanonicalProviderRouteRegistry,
  visualIntelligenceCanonicalProviderRouteRegistryRef,
  type VisualIntelligenceCanonicalProviderRouteRegistry,
  type VisualIntelligenceCanonicalProviderRouteRegistryReadPort,
} from './visual-intelligence-provider-traffic-isolation-authority-finalizer'

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION =
  'visual-intelligence-model-billing-sku-live-gcs-store-v1' as const

const ROOT =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/live-executor/'
const ADMISSION_PREFIX = `${ROOT}admissions/`
const ROUTE_REGISTRY_PREFIX = `${ROOT}provider-route-registries/`
const CONTEXT_PREFIX = `${ROOT}context-evidence/`
const RESULT_PREFIX = `${ROOT}results/`
const ATTEMPT_PREFIX = `${ROOT}attempts/`
const MAXIMUM_OBJECT_BYTES = 2 * 1024 * 1024
const bucketNameSchema = z.string()
  .regex(/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const attemptStartSchema = z.object({
  schemaVersion: z.literal(
    'visual-intelligence-model-billing-sku-live-attempt-start-v1',
  ),
  storeVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
  ),
  admissionRef: evidenceRefSchema,
  qualificationId: safeId,
  attemptRef: evidenceRefSchema,
  startedAtIso: timestamp,
  createOnlySingleUseClaim: z.literal(true),
  browserOrCallerReplayAccepted: z.literal(false),
  providerCallMadeByStore: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict()

const attemptTerminalWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'visual-intelligence-model-billing-sku-live-attempt-terminal-v1',
  ),
  storeVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
  ),
  attemptRef: evidenceRefSchema,
  disposition: z.enum([
    'completed_pending_reconciliation',
    'failed_no_retry',
  ]),
  resultRef: evidenceRefSchema.nullable(),
  sanitizedFailureCode: safeId.nullable(),
  terminalAtIso: timestamp,
  automaticRetryAllowed: z.literal(false),
  providerCallMadeByStore: z.literal(false),
  customerCreditOrWalletMutationAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (
    value.disposition === 'completed_pending_reconciliation'
      ? value.resultRef === null || value.sanitizedFailureCode !== null
      : value.resultRef !== null || value.sanitizedFailureCode === null
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence live attempt terminal is inconsistent.',
  })
})

const attemptTerminalSchema = attemptTerminalWithoutDigestSchema.extend({
  terminalDigestSha256: prefixedSha256,
}).strict()

export interface VisualIntelligenceModelBillingSkuLiveGcsStore {
  readonly admissionReadPort:
    VisualIntelligenceModelBillingSkuLiveAdmissionReadPort
  readonly routeRegistryReadPort:
    VisualIntelligenceCanonicalProviderRouteRegistryReadPort
  readonly contextEvidenceRepository:
    VisualIntelligenceModelBillingContextEvidenceRepository
  readonly resultRepository:
    VisualIntelligenceModelBillingSkuLiveResultRepository
  readonly attemptStore: VisualIntelligenceModelBillingSkuLiveAttemptStore
  persistAdmissionCreateOnly(
    admission: VisualIntelligenceModelBillingSkuLiveAdmission,
  ): Promise<VisualIntelligenceEvidenceRef>
  persistRouteRegistryCreateOnly(
    registry: VisualIntelligenceCanonicalProviderRouteRegistry,
  ): Promise<VisualIntelligenceEvidenceRef>
}

/**
 * Durable single-writer storage for the internal qualification executor. All
 * artifacts are sanitized JSON refs/evidence; no prompt corpus is accepted.
 */
export function createVisualIntelligenceModelBillingSkuLiveGcsStore(input: {
  readonly projectId: 'reeditpro'
  readonly bucketName: string
  readonly storage?: Storage
  readonly now?: () => Date
}): VisualIntelligenceModelBillingSkuLiveGcsStore {
  if (
    input.projectId !== 'reeditpro'
    || !bucketNameSchema.safeParse(input.bucketName).success
  ) throw new Error(
    'Visual Intelligence live qualification store is not configured.',
  )
  const storage = input.storage ?? new Storage({ projectId: input.projectId })
  const bucket = storage.bucket(input.bucketName)
  const now = input.now ?? (() => new Date())
  const persist = async (
    prefix: string,
    reference: VisualIntelligenceEvidenceRef,
    value: unknown,
  ) => persistExact({ bucket, prefix, reference, value })
  const read = async <T>(
    prefix: string,
    reference: VisualIntelligenceEvidenceRef,
    parse: (value: unknown) => T,
    ref: (value: T) => VisualIntelligenceEvidenceRef,
  ): Promise<T | null> => readExact({ bucket, prefix, reference, parse, ref })

  const admissionReadPort: VisualIntelligenceModelBillingSkuLiveAdmissionReadPort =
    Object.freeze({
      async readExact(reference: VisualIntelligenceEvidenceRef) {
        return read(
          ADMISSION_PREFIX,
          reference,
          parseVisualIntelligenceModelBillingSkuLiveAdmission,
          visualIntelligenceModelBillingSkuLiveAdmissionRef,
        )
      },
    })
  const routeRegistryReadPort:
    VisualIntelligenceCanonicalProviderRouteRegistryReadPort = Object.freeze({
      async readExact(reference: VisualIntelligenceEvidenceRef) {
        return read(
          ROUTE_REGISTRY_PREFIX,
          reference,
          parseVisualIntelligenceCanonicalProviderRouteRegistry,
          visualIntelligenceCanonicalProviderRouteRegistryRef,
        )
      },
    })
  const contextEvidenceRepository:
    VisualIntelligenceModelBillingContextEvidenceRepository = Object.freeze({
      async persistCreateOnly(
        evidence: VisualIntelligenceModelBillingContextEvidence,
      ) {
        const parsed =
          parseVisualIntelligenceModelBillingContextEvidence(evidence)
        const evidenceRef =
          visualIntelligenceModelBillingContextEvidenceRef(parsed)
        const receipt = await persist(CONTEXT_PREFIX, evidenceRef, parsed)
        return {
          evidenceRef,
          persistenceReceiptRef: receipt,
          createOnlyPersisted: true as const,
          exactRereadVerified: true as const,
        }
      },
      async readExact(reference: VisualIntelligenceEvidenceRef) {
        return read(
          CONTEXT_PREFIX,
          reference,
          parseVisualIntelligenceModelBillingContextEvidence,
          visualIntelligenceModelBillingContextEvidenceRef,
        )
      },
    })
  const resultRepository:
    VisualIntelligenceModelBillingSkuLiveResultRepository = Object.freeze({
      async persistCreateOnly(
        result: VisualIntelligenceModelBillingSkuLiveResult,
      ) {
        const parsed = parseVisualIntelligenceModelBillingSkuLiveResult(result)
        const resultRef = visualIntelligenceModelBillingSkuLiveResultRef(parsed)
        const receipt = await persist(RESULT_PREFIX, resultRef, parsed)
        return {
          resultRef,
          persistenceReceiptRef: receipt,
          createOnlyPersisted: true as const,
          exactRereadVerified: true as const,
        }
      },
      async readExact(reference: VisualIntelligenceEvidenceRef) {
        return read(
          RESULT_PREFIX,
          reference,
          parseVisualIntelligenceModelBillingSkuLiveResult,
          visualIntelligenceModelBillingSkuLiveResultRef,
        )
      },
    })
  const attemptStore: VisualIntelligenceModelBillingSkuLiveAttemptStore =
    Object.freeze({
      async beginCreateOnly(untrusted: {
        readonly admissionRef: VisualIntelligenceEvidenceRef
        readonly qualificationId: string
      }) {
        const request = z.object({
          admissionRef: evidenceRefSchema,
          qualificationId: safeId,
        }).strict().parse(untrusted)
        const attemptRef = createVisualIntelligenceEvidenceRef(
          `${request.qualificationId}.attempt`,
          {
            storeVersion:
              VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
            admissionRef: request.admissionRef,
            qualificationId: request.qualificationId,
          },
        )
        const objectName = objectNameForRef(ATTEMPT_PREFIX, attemptRef, 'start')
        const file = bucket.file(objectName, {
          preconditionOpts: { ifGenerationMatch: 0 },
        })
        const startedAt = now()
        if (!Number.isFinite(startedAt.getTime())) throw new Error(
          'Visual Intelligence live qualification store clock is invalid.',
        )
        const record = attemptStartSchema.parse({
          schemaVersion:
            'visual-intelligence-model-billing-sku-live-attempt-start-v1',
          storeVersion:
            VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
          admissionRef: request.admissionRef,
          qualificationId: request.qualificationId,
          attemptRef,
          startedAtIso: startedAt.toISOString(),
          createOnlySingleUseClaim: true,
          browserOrCallerReplayAccepted: false,
          providerCallMadeByStore: false,
          customerCreditOrWalletMutationAuthorityGranted: false,
          productionReleaseAuthorityGranted: false,
        })
        const body = canonicalBody(record)
        try {
          await file.save(body, saveOptions())
        } catch (error) {
          if (cloudErrorCode(error) !== 412) throw new Error(
            'Visual Intelligence live attempt claim failed.',
            { cause: error },
          )
          const existing = attemptStartSchema.parse(
            await readJsonObject(bucket, objectName),
          )
          if (
            !sameRef(existing.attemptRef, attemptRef)
            || !sameRef(existing.admissionRef, request.admissionRef)
            || existing.qualificationId !== request.qualificationId
          ) throw new Error(
            'Visual Intelligence live attempt claim changed.',
            { cause: error },
          )
          return { status: 'already_exists' as const }
        }
        const reread = attemptStartSchema.parse(
          await readJsonObject(bucket, objectName),
        )
        if (visualIntelligenceCanonicalJson(reread) !== body.toString('utf8')) {
          throw new Error('Visual Intelligence live attempt claim changed.')
        }
        return { status: 'started' as const, attemptRef }
      },

      async markTerminal(untrusted: {
        readonly attemptRef: VisualIntelligenceEvidenceRef
        readonly disposition:
          | 'completed_pending_reconciliation'
          | 'failed_no_retry'
        readonly resultRef: VisualIntelligenceEvidenceRef | null
        readonly sanitizedFailureCode: string | null
      }) {
        const request = z.object({
          attemptRef: evidenceRefSchema,
          disposition: z.enum([
            'completed_pending_reconciliation',
            'failed_no_retry',
          ]),
          resultRef: evidenceRefSchema.nullable(),
          sanitizedFailureCode: safeId.nullable(),
        }).strict().parse(untrusted)
        const started = attemptStartSchema.parse(await readJsonObject(
          bucket,
          objectNameForRef(ATTEMPT_PREFIX, request.attemptRef, 'start'),
        ))
        if (!sameRef(started.attemptRef, request.attemptRef)) throw new Error(
          'Visual Intelligence live attempt start is missing.',
        )
        const terminalAt = now()
        if (!Number.isFinite(terminalAt.getTime())) throw new Error(
          'Visual Intelligence live qualification store clock is invalid.',
        )
        const payload = attemptTerminalWithoutDigestSchema.parse({
          schemaVersion:
            'visual-intelligence-model-billing-sku-live-attempt-terminal-v1',
          storeVersion:
            VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
          ...request,
          terminalAtIso: terminalAt.toISOString(),
          automaticRetryAllowed: false,
          providerCallMadeByStore: false,
          customerCreditOrWalletMutationAuthorityGranted: false,
          productionReleaseAuthorityGranted: false,
        })
        const record = attemptTerminalSchema.parse({
          ...payload,
          terminalDigestSha256: visualIntelligenceDigest(payload),
        })
        const body = canonicalBody(record)
        const objectName = objectNameForRef(
          ATTEMPT_PREFIX,
          request.attemptRef,
          'terminal',
        )
        const file = bucket.file(objectName, {
          preconditionOpts: { ifGenerationMatch: 0 },
        })
        try {
          await file.save(body, saveOptions())
        } catch (error) {
          if (cloudErrorCode(error) === 412) throw new Error(
            'Visual Intelligence live attempt is already terminal.',
            { cause: error },
          )
          throw new Error(
            'Visual Intelligence live attempt terminal persistence failed.',
            { cause: error },
          )
        }
        const reread = attemptTerminalSchema.parse(
          await readJsonObject(bucket, objectName),
        )
        if (
          !sameRef(reread.attemptRef, request.attemptRef)
          || reread.terminalDigestSha256 !== record.terminalDigestSha256
          || visualIntelligenceCanonicalJson(reread) !== body.toString('utf8')
        ) throw new Error(
          'Visual Intelligence live attempt terminal exact reread failed.',
        )
      },
    })

  return Object.freeze({
    admissionReadPort,
    routeRegistryReadPort,
    contextEvidenceRepository,
    resultRepository,
    attemptStore,
    async persistAdmissionCreateOnly(
      untrusted: VisualIntelligenceModelBillingSkuLiveAdmission,
    ) {
      const admission =
        parseVisualIntelligenceModelBillingSkuLiveAdmission(untrusted)
      const reference = visualIntelligenceModelBillingSkuLiveAdmissionRef(
        admission,
      )
      await persist(ADMISSION_PREFIX, reference, admission)
      return reference
    },
    async persistRouteRegistryCreateOnly(
      untrusted: VisualIntelligenceCanonicalProviderRouteRegistry,
    ) {
      const registry =
        parseVisualIntelligenceCanonicalProviderRouteRegistry(untrusted)
      const reference = visualIntelligenceCanonicalProviderRouteRegistryRef(
        registry,
      )
      await persist(ROUTE_REGISTRY_PREFIX, reference, registry)
      return reference
    },
  })
}

async function persistExact(input: {
  bucket: ReturnType<Storage['bucket']>
  prefix: string
  reference: VisualIntelligenceEvidenceRef
  value: unknown
}): Promise<VisualIntelligenceEvidenceRef> {
  const reference = evidenceRefSchema.parse(input.reference)
  const body = canonicalBody(input.value)
  const objectName = objectNameForRef(input.prefix, reference)
  const file = input.bucket.file(objectName, {
    preconditionOpts: { ifGenerationMatch: 0 },
  })
  try {
    await file.save(body, saveOptions())
  } catch (error) {
    if (cloudErrorCode(error) !== 412) throw new Error(
      'Visual Intelligence live qualification persistence failed.',
      { cause: error },
    )
  }
  const [metadata] = await file.getMetadata()
  const generation = String(metadata.generation ?? '')
  const etag = String(metadata.etag ?? '')
  if (
    !/^[1-9][0-9]{0,30}$/u.test(generation)
    || !etag
    || String(metadata.contentType ?? '') !== 'application/json'
    || Number(metadata.size ?? -1) !== body.byteLength
  ) throw new Error(
    'Visual Intelligence live qualification metadata is invalid.',
  )
  const exact = input.bucket.file(objectName, { generation })
  const [reread] = await exact.download({ validation: 'crc32c' })
  const [stable] = await exact.getMetadata()
  if (
    !reread.equals(body)
    || String(stable.generation ?? '') !== generation
    || String(stable.etag ?? '') !== etag
  ) throw new Error(
    'Visual Intelligence live qualification exact reread failed.',
  )
  return createVisualIntelligenceEvidenceRef(
    `${reference.id}.persistence-receipt`,
    {
      storeVersion:
        VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_GCS_STORE_VERSION,
      projectId: 'reeditpro',
      objectName,
      generation,
      etag,
      contentSha256: rawDigest(body),
      byteLength: body.byteLength,
      reference,
      createOnlyPersisted: true,
      exactGenerationEtagDigestAndCanonicalJsonReread: true,
      providerCallMadeByStore: false,
      customerCreditOrWalletMutationAuthorityGranted: false,
      productionReleaseAuthorityGranted: false,
    },
    reference.version,
  )
}

async function readExact<T>(input: {
  bucket: ReturnType<Storage['bucket']>
  prefix: string
  reference: VisualIntelligenceEvidenceRef
  parse: (value: unknown) => T
  ref: (value: T) => VisualIntelligenceEvidenceRef
}): Promise<T | null> {
  const reference = evidenceRefSchema.parse(input.reference)
  const objectName = objectNameForRef(input.prefix, reference)
  let value: unknown
  try {
    value = await readJsonObject(input.bucket, objectName)
  } catch (error) {
    if (cloudErrorCode(error) === 404) return null
    throw error
  }
  const parsed = input.parse(value)
  if (!sameRef(input.ref(parsed), reference)) throw new Error(
    'Visual Intelligence live qualification identity changed.',
  )
  return parsed
}

async function readJsonObject(
  bucket: ReturnType<Storage['bucket']>,
  objectName: string,
): Promise<unknown> {
  const file = bucket.file(objectName)
  const [body] = await file.download({ validation: 'crc32c' })
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
    throw new Error(
      'Visual Intelligence live qualification object exceeded its bound.',
    )
  }
  try {
    const parsed = JSON.parse(body.toString('utf8')) as unknown
    if (visualIntelligenceCanonicalJson(parsed) !== body.toString('utf8')) {
      throw new Error('not canonical')
    }
    return parsed
  } catch (error) {
    throw new Error(
      'Visual Intelligence live qualification object is not canonical JSON.',
      { cause: error },
    )
  }
}

function canonicalBody(value: unknown): Buffer {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_OBJECT_BYTES) {
    throw new Error(
      'Visual Intelligence live qualification object exceeded its bound.',
    )
  }
  return body
}

function saveOptions() {
  return {
    contentType: 'application/json' as const,
    resumable: false,
    validation: 'crc32c' as const,
    preconditionOpts: { ifGenerationMatch: 0 },
  }
}

function objectNameForRef(
  prefix: string,
  reference: VisualIntelligenceEvidenceRef,
  suffix = '',
): string {
  if (!prefix.startsWith(ROOT) || !prefix.endsWith('/')) throw new Error(
    'Visual Intelligence live qualification prefix is invalid.',
  )
  const parsed = evidenceRefSchema.parse(reference)
  return `${prefix}${parsed.contentHash.slice(7)}${suffix ? `.${suffix}` : ''}.json`
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
