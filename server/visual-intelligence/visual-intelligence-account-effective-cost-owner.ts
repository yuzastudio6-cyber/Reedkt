import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
  type VisualIntelligenceCostPreflight,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import type {
  VisualIntelligenceProviderCostSettlementPort,
} from './vertex-gemini-pro-visual-intelligence-adapter'
import type {
  VisualIntelligencePrivateObjectReadPort,
} from './visual-intelligence-private-object-read-port'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
} from './visual-intelligence-model-billing-sku-qualification'

export const VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION =
  'visual-intelligence-account-effective-rate-authority-v2' as const
export const VISUAL_INTELLIGENCE_COST_OWNER_VERSION =
  'visual-intelligence-account-effective-cost-owner-v2' as const
export {
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
  VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
} from './visual-intelligence-model-billing-sku-qualification'

const MAX_RATE_AGE_MS = 24 * 60 * 60 * 1_000
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const DEFAULT_PREFIX = 'private/visual-intelligence/v1/provider-cost'
const RATE_OBJECT_PREFIX =
  'private/visual-intelligence/pricing/account-effective/v2/'

const evidenceRefSchema = z.object({
  id: z.string().regex(SAFE_ID),
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(PREFIXED_SHA256),
}).strict()

const rateClassSchema = z.enum(
  VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES,
)

const accountEffectiveSkuPriceTermSchema = z.object({
  rateClass: rateClassSchema,
  contextClass: z.enum(['standard_le_200k', 'long_gt_200k']),
  tokenClass: z.enum([
    'uncached_input',
    'cached_input',
    'output_and_thinking',
  ]),
  cloudServiceId: z.literal('services/C7E2-9256-1C43'),
  skuId: z.string().regex(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/u),
  skuDisplayName: z.string().trim().min(1).max(240),
  consumptionModel: z.literal('consumptionModels/7754-699E-0EBF'),
  apiUnit: z.literal('count'),
  apiUnitQuantity: z.literal('1000000'),
  contractPriceUsdNanosPerMillionTokens:
    z.number().int().nonnegative().safe(),
  skuMetadataRef: evidenceRefSchema,
  billingAccountPriceRef: evidenceRefSchema,
  accountEffectiveContractPriceUsed: z.literal(true),
  publicListPriceUsed: z.literal(false),
}).strict()

const rateWithoutDigestSchema = z.object({
  schemaVersion: z.literal(VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_VERSION),
  evidenceClass: z.literal('billing_account_effective_pricing_api_reread'),
  billingAccountPricingScopeRef: evidenceRefSchema,
  pricingReaderConfigurationRef: evidenceRefSchema,
  pricingApiObservationRef: evidenceRefSchema,
  exactModelBillingSkuCompatibilityQualificationRef: evidenceRefSchema,
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  providerServiceId: z.literal('services/C7E2-9256-1C43'),
  billingSkuFamily: z.literal('gemini_3_0_pro_shared_billing_family'),
  billingSkuCatalogVersion: z.literal(
    VISUAL_INTELLIGENCE_GEMINI_BILLING_SKU_CATALOG_VERSION,
  ),
  throughputClass: z.literal('standard'),
  contextThresholdInputTokens: z.literal(
    VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
  ),
  wholeRequestLongContextRatesRequired: z.literal(true),
  currency: z.literal('USD'),
  rateUnit: z.literal('usd_nanos_per_million_tokens'),
  accountEffectiveSkuPriceTerms:
    z.array(accountEffectiveSkuPriceTermSchema).length(6),
  priceReadStartedAtIso: z.string().datetime({ offset: true }),
  priceReadFinishedAtIso: z.string().datetime({ offset: true }),
  effectiveAtIso: z.string().datetime({ offset: true }),
  expiresAtIso: z.string().datetime({ offset: true }),
  exactSkuMetadataAndAccountPriceReread: z.literal(true),
  billingAccountEffectiveRateUsed: z.literal(true),
  publicListPriceUsed: z.literal(false),
  customerPriceOrServiceFeeAuthorityGranted: z.literal(false),
  walletMutationAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const effective = Date.parse(value.effectiveAtIso)
  const expires = Date.parse(value.expiresAtIso)
  const readStarted = Date.parse(value.priceReadStartedAtIso)
  const readFinished = Date.parse(value.priceReadFinishedAtIso)
  const classes = value.accountEffectiveSkuPriceTerms.map((term) =>
    term.rateClass)
  const expectedClasses = [...VISUAL_INTELLIGENCE_ACCOUNT_EFFECTIVE_RATE_CLASSES]
  const refs = value.accountEffectiveSkuPriceTerms.flatMap((term) => [
    `${term.skuMetadataRef.id}:${term.skuMetadataRef.version}:${term.skuMetadataRef.contentHash}`,
    `${term.billingAccountPriceRef.id}:${term.billingAccountPriceRef.version}:${term.billingAccountPriceRef.contentHash}`,
  ])
  const standardUncached = priceForClass(
    value.accountEffectiveSkuPriceTerms,
    'standard_uncached_input',
  )
  const standardCached = priceForClass(
    value.accountEffectiveSkuPriceTerms,
    'standard_cached_input',
  )
  const longUncached = priceForClass(
    value.accountEffectiveSkuPriceTerms,
    'long_uncached_input',
  )
  const longCached = priceForClass(
    value.accountEffectiveSkuPriceTerms,
    'long_cached_input',
  )
  if (
    !Number.isFinite(effective)
    || !Number.isFinite(expires)
    || expires <= effective
    || expires - effective > MAX_RATE_AGE_MS
    || readFinished < readStarted
    || readFinished - readStarted > 60_000
    || effective !== readFinished
    || classes.some((rateClass, index) => rateClass !== expectedClasses[index])
    || new Set(classes).size !== classes.length
    || new Set(value.accountEffectiveSkuPriceTerms.map((term) => term.skuId))
      .size !== value.accountEffectiveSkuPriceTerms.length
    || new Set(refs).size !== refs.length
    || standardCached > standardUncached
    || longCached > longUncached
    || !priceTermsMatchTheirClasses(value.accountEffectiveSkuPriceTerms)
  ) context.addIssue({
    code: 'custom',
    message: 'Account-effective Visual Intelligence rate window is invalid.',
  })
})

const rateSchema = rateWithoutDigestSchema.extend({
  rateAuthorityDigestSha256: z.string().regex(PREFIXED_SHA256),
}).strict()

export type VisualIntelligenceAccountEffectiveRateAuthority = z.infer<
  typeof rateSchema
>

export interface VisualIntelligenceAccountEffectiveRateReadPort {
  readExact(
    authorityRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceAccountEffectiveRateAuthority | null>
}

export interface VisualIntelligenceAccountEffectiveCostOwner
extends VisualIntelligenceProviderCostSettlementPort {
  readonly rateAuthorityRef: VisualIntelligenceEvidenceRef
  createPreflight(input: {
    readonly requestId: string
    readonly maximumInputTokenCount: number
    readonly maximumOutputAndThinkingTokenCount: number
    readonly estimatedInputTokenCount: number
    readonly estimatedOutputAndThinkingTokenCount: number
  }): Promise<VisualIntelligenceCostPreflight>
}

/** Test-only constructor. Production must use an authenticated pricing reader. */
export function createControlledVisualIntelligenceAccountEffectiveRateAuthority(
  input: z.input<typeof rateWithoutDigestSchema>,
): VisualIntelligenceAccountEffectiveRateAuthority {
  const payload = rateWithoutDigestSchema.parse(input)
  const authority = Object.freeze(rateSchema.parse({
    ...payload,
    rateAuthorityDigestSha256: digest(payload),
  }))
  return authority
}

/**
 * Production constructor for the isolated authenticated Pricing API reader.
 * The reader must supply the exact six SKU observations and all source refs;
 * this function only closes and digest-binds that already-verified evidence.
 */
export function createVisualIntelligenceAccountEffectiveRateAuthorityFromPricingObservation(
  input: z.input<typeof rateWithoutDigestSchema>,
): VisualIntelligenceAccountEffectiveRateAuthority {
  const payload = rateWithoutDigestSchema.parse(input)
  return Object.freeze(rateSchema.parse({
    ...payload,
    rateAuthorityDigestSha256: digest(payload),
  }))
}

export function parseVisualIntelligenceAccountEffectiveRateAuthority(
  value: unknown,
): VisualIntelligenceAccountEffectiveRateAuthority {
  const authority = rateSchema.parse(value)
  if (authority.rateAuthorityDigestSha256 !== digest(omitDigest(authority))) {
    throw notReady('visual_intelligence_rate_authority_digest_invalid')
  }
  return Object.freeze(authority)
}

export function createVisualIntelligenceAccountEffectiveCostOwner(input: {
  readonly rateAuthorityRef: VisualIntelligenceEvidenceRef
  readonly rateReadPort: VisualIntelligenceAccountEffectiveRateReadPort
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
  readonly now?: () => Date
}): VisualIntelligenceAccountEffectiveCostOwner {
  const configuredRef = requireRef(input.rateAuthorityRef)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const now = input.now ?? (() => new Date())
  if (
    !input.rateReadPort
    || typeof input.rateReadPort.readExact !== 'function'
    || !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_cost_owner_configuration_invalid')

  const readCurrent = async (
    requestedRef: VisualIntelligenceEvidenceRef,
  ): Promise<VisualIntelligenceAccountEffectiveRateAuthority> => {
    if (refKey(requestedRef) !== refKey(configuredRef)) {
      throw notReady('visual_intelligence_rate_authority_ref_mismatch')
    }
    const raw = await input.rateReadPort.readExact(configuredRef)
    if (!raw) throw notReady('visual_intelligence_rate_authority_missing')
    const authority = parseVisualIntelligenceAccountEffectiveRateAuthority(raw)
    const authorityRef = rateAuthorityRef(authority)
    const currentMs = now().getTime()
    if (
      refKey(authorityRef) !== refKey(configuredRef)
      || currentMs < Date.parse(authority.effectiveAtIso)
      || currentMs >= Date.parse(authority.expiresAtIso)
      || !authority.billingAccountEffectiveRateUsed
      || authority.publicListPriceUsed
    ) throw notReady('visual_intelligence_rate_authority_not_current')
    return authority
  }

  const owner: VisualIntelligenceAccountEffectiveCostOwner = {
    rateAuthorityRef: configuredRef,
    async createPreflight(value) {
      validateTokenBounds(value)
      const authority = await readCurrent(configuredRef)
      const maximumAuthorizedCostMicros = costMicros(authority, {
        promptTokenCount: value.maximumInputTokenCount,
        cachedTokenCount: 0,
        outputAndThinkingTokenCount:
          value.maximumOutputAndThinkingTokenCount,
      })
      const estimatedMaximumCostMicros = costMicros(authority, {
        promptTokenCount: value.estimatedInputTokenCount,
        cachedTokenCount: 0,
        outputAndThinkingTokenCount:
          value.estimatedOutputAndThinkingTokenCount,
      })
      const preflightPayload = {
        schemaVersion: 'visual-intelligence-cost-preflight-evidence-v1',
        requestId: value.requestId,
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        accountEffectiveRateAuthorityRef: configuredRef,
        maximumInputTokenCount: value.maximumInputTokenCount,
        maximumOutputAndThinkingTokenCount:
          value.maximumOutputAndThinkingTokenCount,
        estimatedInputTokenCount: value.estimatedInputTokenCount,
        estimatedOutputAndThinkingTokenCount:
          value.estimatedOutputAndThinkingTokenCount,
        maximumAuthorizedCostMicros,
        estimatedMaximumCostMicros,
        publicListPriceUsedAsSettlementAuthority: false,
      }
      return Object.freeze({
        pricingSnapshotRef: createVisualIntelligenceEvidenceRef(
          `vi-cost-preflight-${digest(value.requestId).slice(7)}`,
          preflightPayload,
        ),
        accountEffectiveRateAuthorityRef: configuredRef,
        currency: 'USD',
        maximumAuthorizedCostMicros,
        estimatedMinimumCostMicros: 0,
        estimatedMaximumCostMicros,
        serviceFeeIncluded: false,
        publicListPriceUsedAsSettlementAuthority: false,
        preflightPassed: true,
      })
    },

    async settleAccountEffectiveUsage(value) {
      validateUsage(value)
      const authority = await readCurrent(
        value.accountEffectiveRateAuthorityRef,
      )
      const settledCostMicros = costMicros(authority, {
        promptTokenCount: value.promptTokenCount,
        cachedTokenCount: value.cachedTokenCount,
        outputAndThinkingTokenCount:
          value.candidateTokenCount + value.thinkingTokenCount,
      })
      if (settledCostMicros > value.maximumAuthorizedCostMicros) {
        throw notReady('visual_intelligence_provider_cost_above_approved_cap')
      }
      const recordWithoutDigest = {
        schemaVersion: 'visual-intelligence-provider-cost-settlement-v1',
        costOwnerVersion: VISUAL_INTELLIGENCE_COST_OWNER_VERSION,
        requestId: value.requestId,
        idempotencyKey: value.idempotencyKey,
        exactModelId: value.exactModelId,
        promptTokenCount: value.promptTokenCount,
        candidateTokenCount: value.candidateTokenCount,
        thinkingTokenCount: value.thinkingTokenCount,
        cachedTokenCount: value.cachedTokenCount,
        totalTokenCount: value.totalTokenCount,
        maximumAuthorizedCostMicros: value.maximumAuthorizedCostMicros,
        estimatedCostMicros: settledCostMicros,
        settledCostMicros,
        accountEffectiveRateAuthorityRef: configuredRef,
        billingAccountEffectiveRateUsed: true,
        publicListPriceUsed: false,
        duplicateSettlementPerformed: false,
        serviceFeeIncluded: false,
        customerCreditMutated: false,
      }
      const record = {
        ...recordWithoutDigest,
        settlementDigestSha256: digest(recordWithoutDigest),
      }
      const objectPath = `${prefix}/${digest({
        requestId: value.requestId,
        idempotencyKey: value.idempotencyKey,
      }).slice(7)}.json`
      const created = await persistRecord(input.objectPort, objectPath, record)
      const reread = await readRecord(input.objectPort, objectPath)
      if (!same(record, reread)) {
        throw conflict('visual_intelligence_cost_settlement_reread_mismatch')
      }
      const costEvidenceRef = createVisualIntelligenceEvidenceRef(
        `vi-cost-${record.settlementDigestSha256.slice(7)}`,
        record,
      )
      return Object.freeze({
        estimatedCostMicros: settledCostMicros,
        settledCostMicros,
        costEvidenceRef,
        accountEffectiveRateAuthorityRef: configuredRef,
        billingAccountEffectiveRateUsed: true,
        publicListPriceUsed: false,
        duplicateSettlementPerformed: false,
        settlementRecordReplayed: created === 'already_exists',
      })
    },
  }
  return Object.freeze(owner)
}

export function createVisualIntelligenceGcsAccountEffectiveRateReadPort(input: {
  readonly bucketName: string
  readonly objectName: string
  readonly generation: string
  readonly etag: string
  readonly contentSha256: string
  readonly objectPort: VisualIntelligencePrivateObjectReadPort
}): VisualIntelligenceAccountEffectiveRateReadPort {
  if (
    !/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u.test(input.bucketName)
    || !input.objectName.startsWith(RATE_OBJECT_PREFIX)
    || !input.objectName.endsWith('.json')
    || input.objectName.includes('..')
    || input.objectName.includes('\\')
    || !/^[1-9][0-9]{0,30}$/u.test(input.generation)
    || !input.etag
    || !/^[a-f0-9]{64}$/u.test(input.contentSha256)
    || !input.objectPort
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_rate_reader_configuration_invalid')
  const port: VisualIntelligenceAccountEffectiveRateReadPort = {
    async readExact(untrustedRef) {
      const requestedRef = requireRef(untrustedRef)
      const stored = await input.objectPort.readExact({
        bucketName: input.bucketName,
        objectName: input.objectName,
        generation: input.generation,
        etag: input.etag,
      })
      if (
        !stored
        || stored.generation !== input.generation
        || stored.etag !== input.etag
        || stored.contentType !== 'application/json'
        || stored.body.byteLength < 2
        || stored.body.byteLength > 512 * 1024
        || rawDigest(stored.body) !== input.contentSha256
      ) throw notReady('visual_intelligence_rate_object_identity_invalid')
      let decoded: unknown
      try {
        decoded = JSON.parse(stored.body.toString('utf8')) as unknown
      } catch {
        throw notReady('visual_intelligence_rate_object_json_invalid')
      }
      const authority = parseVisualIntelligenceAccountEffectiveRateAuthority(
        decoded,
      )
      if (
        refKey(rateAuthorityRef(authority)) !== refKey(requestedRef)
        || stored.body.toString('utf8')
          !== visualIntelligenceCanonicalJson(authority)
      ) throw notReady('visual_intelligence_rate_object_reread_invalid')
      return authority
    },
  }
  return Object.freeze(port)
}

export function rateAuthorityRef(
  authority: VisualIntelligenceAccountEffectiveRateAuthority,
): VisualIntelligenceEvidenceRef {
  const parsed = parseVisualIntelligenceAccountEffectiveRateAuthority(authority)
  return Object.freeze({
    id: parsed.pricingApiObservationRef.id,
    version: parsed.pricingApiObservationRef.version,
    contentHash: parsed.rateAuthorityDigestSha256,
  })
}

function costMicros(
  authority: VisualIntelligenceAccountEffectiveRateAuthority,
  usage: {
    promptTokenCount: number
    cachedTokenCount: number
    outputAndThinkingTokenCount: number
  },
): number {
  const uncached = Math.max(0, usage.promptTokenCount - usage.cachedTokenCount)
  const longContext = usage.promptTokenCount
    > authority.contextThresholdInputTokens
  const prefix = longContext ? 'long' : 'standard'
  const uncachedRate = priceForClass(
    authority.accountEffectiveSkuPriceTerms,
    `${prefix}_uncached_input`,
  )
  const cachedRate = priceForClass(
    authority.accountEffectiveSkuPriceTerms,
    `${prefix}_cached_input`,
  )
  const outputRate = priceForClass(
    authority.accountEffectiveSkuPriceTerms,
    `${prefix}_output_and_thinking`,
  )
  const numerator = BigInt(uncached)
    * BigInt(uncachedRate)
    + BigInt(usage.cachedTokenCount)
      * BigInt(cachedRate)
    + BigInt(usage.outputAndThinkingTokenCount)
      * BigInt(outputRate)
  const usdNanos = ceilDivide(numerator, 1_000_000n)
  const micros = ceilDivide(usdNanos, 1_000n)
  if (micros > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw notReady('visual_intelligence_provider_cost_overflow')
  }
  return Number(micros)
}

function priceForClass(
  terms: readonly z.infer<typeof accountEffectiveSkuPriceTermSchema>[],
  rateClass: string,
): number {
  const term = terms.find((candidate) => candidate.rateClass === rateClass)
  return term?.contractPriceUsdNanosPerMillionTokens
    ?? Number.MAX_SAFE_INTEGER
}

function priceTermsMatchTheirClasses(
  terms: readonly z.infer<typeof accountEffectiveSkuPriceTermSchema>[],
): boolean {
  return terms.every((term) => {
    const expectedContext = term.rateClass.startsWith('long_')
      ? 'long_gt_200k'
      : 'standard_le_200k'
    const expectedTokenClass = term.rateClass.endsWith('uncached_input')
      ? 'uncached_input'
      : term.rateClass.endsWith('cached_input')
        ? 'cached_input'
        : 'output_and_thinking'
    return term.contextClass === expectedContext
      && term.tokenClass === expectedTokenClass
  })
}

function validateTokenBounds(value: {
  requestId: string
  maximumInputTokenCount: number
  maximumOutputAndThinkingTokenCount: number
  estimatedInputTokenCount: number
  estimatedOutputAndThinkingTokenCount: number
}): void {
  if (
    !safeId(value.requestId)
    || !positiveInteger(value.maximumInputTokenCount)
    || !positiveInteger(value.maximumOutputAndThinkingTokenCount)
    || !nonnegativeInteger(value.estimatedInputTokenCount)
    || !nonnegativeInteger(value.estimatedOutputAndThinkingTokenCount)
    || value.estimatedInputTokenCount > value.maximumInputTokenCount
    || value.estimatedOutputAndThinkingTokenCount
      > value.maximumOutputAndThinkingTokenCount
  ) throw notReady('visual_intelligence_cost_preflight_bounds_invalid')
}

function validateUsage(value: {
  requestId: string
  idempotencyKey: string
  exactModelId: string
  promptTokenCount: number
  candidateTokenCount: number
  thinkingTokenCount: number
  cachedTokenCount: number
  totalTokenCount: number
  maximumAuthorizedCostMicros: number
  accountEffectiveRateAuthorityRef: VisualIntelligenceEvidenceRef
}): void {
  const counts = [
    value.promptTokenCount,
    value.candidateTokenCount,
    value.thinkingTokenCount,
    value.cachedTokenCount,
    value.totalTokenCount,
  ]
  if (
    !safeId(value.requestId)
    || !safeId(value.idempotencyKey)
    || value.exactModelId !== VISUAL_INTELLIGENCE_MODEL_ID
    || counts.some((count) => !nonnegativeInteger(count))
    || value.cachedTokenCount > value.promptTokenCount
    || value.totalTokenCount < value.promptTokenCount
      + value.candidateTokenCount + value.thinkingTokenCount
    || !positiveInteger(value.maximumAuthorizedCostMicros)
  ) throw notReady('visual_intelligence_provider_usage_invalid')
}

function omitDigest(
  authority: VisualIntelligenceAccountEffectiveRateAuthority,
): Omit<VisualIntelligenceAccountEffectiveRateAuthority,
  'rateAuthorityDigestSha256'> {
  const payload = { ...authority }
  Reflect.deleteProperty(payload, 'rateAuthorityDigestSha256')
  return payload
}

async function persistRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<'created' | 'already_exists'> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  return port.createOnly({
    objectPath,
    body,
    contentSha256: rawDigest(body),
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<unknown> {
  const body = await port.readExact(objectPath)
  if (!body || body.byteLength < 2 || body.byteLength > 512 * 1024) {
    throw conflict('visual_intelligence_cost_record_missing')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_cost_record_json_invalid')
  }
}

function requireRef(value: unknown): VisualIntelligenceEvidenceRef {
  const parsed = evidenceRefSchema.parse(value)
  return Object.freeze(parsed)
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_cost_prefix_invalid')
  return normalized
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function ceilDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return `sha256:${createHash('sha256')
    .update(visualIntelligenceCanonicalJson(value), 'utf8')
    .digest('hex')}`
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The billing-account-effective Visual Intelligence cost owner is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Visual Intelligence cost evidence conflicted.',
    409,
    { requiredGate },
  )
}
