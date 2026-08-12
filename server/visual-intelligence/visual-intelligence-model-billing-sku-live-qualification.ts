import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
} from './visual-intelligence-model-billing-sku-qualification'
import {
  createGoogleVertexModelBillingSkuLiveGeneratePort,
  VISUAL_INTELLIGENCE_GEMINI_FINISH_REASON_STOP,
  VISUAL_INTELLIGENCE_GEMINI_MEDIA_RESOLUTION_HIGH,
  VISUAL_INTELLIGENCE_GEMINI_THINKING_LEVEL_HIGH,
  type VisualIntelligenceGeminiBillingGenerateResult,
  type VisualIntelligenceGeminiBillingGeneratePort,
  type VisualIntelligenceGeminiContent,
  type VisualIntelligenceGeminiGenerateContentConfig,
} from './vertex-gemini-pro-visual-intelligence-adapter'

export { createGoogleVertexModelBillingSkuLiveGeneratePort }

export const VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTION_VERSION =
  'visual-intelligence-model-billing-sku-live-execution-v1' as const

const OBJECT_PREFIX =
  'private/visual-intelligence/qualifications/gemini-billing-sku/v1/executions'
const API_VERSION = 'v1'
const DEFAULT_TIMEOUT_MS = 900_000
const MAX_LONG_PROMPT_CHARACTERS = 4_000_000
const INITIAL_LONG_TOKEN_MARKER_COUNT = 210_500
const LONG_CONTEXT_TOKEN_MARGIN = 2_048
const MAX_TOKEN_CALIBRATION_PASSES = 3
const QUALIFICATION_MAX_OUTPUT_TOKENS = 4_096
const MAXIMUM_INTERNAL_QUALIFICATION_COST_USD_MICROS = 10_000_000

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const usageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'visual-intelligence-model-billing-sku-provider-usage-v1',
  ),
  qualificationId: safeId,
  contextClass: z.enum(['standard_le_200k', 'long_gt_200k']),
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  responseId: safeId,
  returnedModelVersion: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  finishReason: z.literal(VISUAL_INTELLIGENCE_GEMINI_FINISH_REASON_STOP),
  candidateCount: z.literal(1),
  promptTokenCount: positiveInteger,
  candidateTokenCount: nonnegativeInteger,
  thinkingTokenCount: nonnegativeInteger,
  cachedTokenCount: nonnegativeInteger,
  totalTokenCount: positiveInteger,
  countedPromptTokenCount: positiveInteger,
  requestConfigurationDigestSha256: prefixedSha256,
  providerRequestStartedAtIso: timestamp,
  providerRequestFinishedAtIso: timestamp,
  exactReturnedModelIdVerified: z.literal(true),
  providerToolsEnabled: z.literal(false),
  automaticProviderRetryEnabled: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerPricingAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const standard = value.contextClass === 'standard_le_200k'
  if (
    value.totalTokenCount < value.promptTokenCount
      + value.candidateTokenCount + value.thinkingTokenCount
    || Date.parse(value.providerRequestFinishedAtIso)
      <= Date.parse(value.providerRequestStartedAtIso)
    || (standard && value.promptTokenCount
      > VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS)
    || (!standard && value.promptTokenCount
      <= VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS)
    || (standard && value.countedPromptTokenCount
      > VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS)
    || (!standard && value.countedPromptTokenCount
      <= VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS)
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence live qualification usage is inconsistent.',
  })
})

const usageSchema = usageWithoutDigestSchema.extend({
  usageDigestSha256: prefixedSha256,
}).strict()

const receiptWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTION_VERSION,
  ),
  evidenceClass: z.literal(
    'live_isolated_vertex_usage_pending_billing_export_reconciliation',
  ),
  qualificationId: safeId,
  exactModelId: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  projectId: z.literal('reeditpro'),
  vertexLocation: z.literal('global'),
  standardContextProviderRequestRef: evidenceRefSchema,
  longContextProviderRequestRef: evidenceRefSchema,
  standardContextProviderUsageRef: evidenceRefSchema,
  longContextProviderUsageRef: evidenceRefSchema,
  qualificationWindowStartedAtIso: timestamp,
  qualificationWindowFinishedAtIso: timestamp,
  liveGeminiStandardContextRequestExecuted: z.literal(true),
  liveGeminiLongContextRequestExecuted: z.literal(true),
  exactReturnedModelIdVerified: z.literal(true),
  exactProviderUsageMetadataReread: z.literal(true),
  billingExportReconciliationPending: z.literal(true),
  maximumInternalQualificationCostUsdMicros: z.literal(
    MAXIMUM_INTERNAL_QUALIFICATION_COST_USD_MICROS,
  ),
  automaticProviderRetryAllowed: z.literal(false),
  publicListPriceUsedForSettlement: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerPricingAuthorityGranted: z.literal(false),
  productionReleaseAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const refs = [
    value.standardContextProviderRequestRef,
    value.longContextProviderRequestRef,
    value.standardContextProviderUsageRef,
    value.longContextProviderUsageRef,
  ].map(refKey)
  const started = Date.parse(value.qualificationWindowStartedAtIso)
  const finished = Date.parse(value.qualificationWindowFinishedAtIso)
  if (
    new Set(refs).size !== refs.length
    || finished <= started
    || finished - started > 3_600_000
  ) context.addIssue({
    code: 'custom',
    message: 'Visual Intelligence live qualification window is invalid.',
  })
})

const receiptSchema = receiptWithoutDigestSchema.extend({
  executionDigestSha256: prefixedSha256,
}).strict()

export type VisualIntelligenceModelBillingSkuLiveExecutionReceipt = z.infer<
  typeof receiptSchema
>

export type VisualIntelligenceModelBillingSkuLiveGeneratePort =
  VisualIntelligenceGeminiBillingGeneratePort

export async function executeVisualIntelligenceModelBillingSkuLiveQualification(
  untrusted: {
    readonly qualificationId: string
    readonly projectId: 'reeditpro'
    readonly vertexLocation: 'global'
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly generatePort: VisualIntelligenceModelBillingSkuLiveGeneratePort
    readonly now?: () => string
  },
): Promise<VisualIntelligenceModelBillingSkuLiveExecutionReceipt> {
  assertPlainSerializedData({
    qualificationId: untrusted.qualificationId,
    projectId: untrusted.projectId,
    vertexLocation: untrusted.vertexLocation,
  }, 'visual_intelligence_billing_sku_live_qualification')
  const qualificationId = safeId.parse(untrusted.qualificationId)
  if (
    untrusted.projectId !== 'reeditpro'
    || untrusted.vertexLocation !== 'global'
    || typeof untrusted.objectPort?.createOnly !== 'function'
    || typeof untrusted.objectPort?.readExact !== 'function'
    || typeof untrusted.generatePort?.countTokens !== 'function'
    || typeof untrusted.generatePort?.generate !== 'function'
  ) throw new Error('Visual Intelligence live qualification is not configured.')
  const now = untrusted.now ?? (() => new Date().toISOString())
  const startedAt = timestamp.parse(now())
  const identityHash = createHash('sha256').update(qualificationId).digest('hex')
  const pathPrefix = `${OBJECT_PREFIX}/${identityHash}`
  const intent = {
    schemaVersion:
      'visual-intelligence-model-billing-sku-live-execution-intent-v1',
    qualificationId,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    projectId: untrusted.projectId,
    vertexLocation: untrusted.vertexLocation,
    standardContextMaximumInputTokens:
      VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS,
    maximumInternalQualificationCostUsdMicros:
      MAXIMUM_INTERNAL_QUALIFICATION_COST_USD_MICROS,
    expectedInferenceRequestCount: 2,
    automaticProviderRetryAllowed: false,
    customerCreditsMutated: false,
    productionReleaseAuthorityGranted: false,
    startedAt,
  } as const
  await persistExact(untrusted.objectPort, `${pathPrefix}/intent.json`, intent)

  const standardContents = contentsFor(
    'WeEditPro Visual Intelligence isolated standard-context billing '
      + 'qualification. Return the requested bounded JSON acknowledgement.',
  )
  const standardCount = await countExact(untrusted.generatePort, standardContents)
  if (standardCount > VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS) {
    throw new Error('Standard-context qualification crossed 200k tokens.')
  }
  const longContents = await compileLongContextContents(untrusted.generatePort)
  const longCount = await countExact(untrusted.generatePort, longContents)
  if (longCount <= VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS) {
    throw new Error('Long-context qualification did not cross 200k tokens.')
  }

  const standard = await executeOne({
    qualificationId,
    contextClass: 'standard_le_200k',
    countedPromptTokenCount: standardCount,
    contents: standardContents,
    objectPort: untrusted.objectPort,
    pathPrefix,
    generatePort: untrusted.generatePort,
    now,
  })
  const long = await executeOne({
    qualificationId,
    contextClass: 'long_gt_200k',
    countedPromptTokenCount: longCount,
    contents: longContents,
    objectPort: untrusted.objectPort,
    pathPrefix,
    generatePort: untrusted.generatePort,
    now,
  })
  const finishedAt = timestamp.parse(now())
  const payload = receiptWithoutDigestSchema.parse({
    schemaVersion:
      VISUAL_INTELLIGENCE_MODEL_BILLING_SKU_LIVE_EXECUTION_VERSION,
    evidenceClass:
      'live_isolated_vertex_usage_pending_billing_export_reconciliation',
    qualificationId,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    projectId: untrusted.projectId,
    vertexLocation: untrusted.vertexLocation,
    standardContextProviderRequestRef: standard.requestRef,
    longContextProviderRequestRef: long.requestRef,
    standardContextProviderUsageRef: standard.usageRef,
    longContextProviderUsageRef: long.usageRef,
    qualificationWindowStartedAtIso: startedAt,
    qualificationWindowFinishedAtIso: finishedAt,
    liveGeminiStandardContextRequestExecuted: true,
    liveGeminiLongContextRequestExecuted: true,
    exactReturnedModelIdVerified: true,
    exactProviderUsageMetadataReread: true,
    billingExportReconciliationPending: true,
    maximumInternalQualificationCostUsdMicros:
      MAXIMUM_INTERNAL_QUALIFICATION_COST_USD_MICROS,
    automaticProviderRetryAllowed: false,
    publicListPriceUsedForSettlement: false,
    customerCreditsMutated: false,
    customerPricingAuthorityGranted: false,
    productionReleaseAuthorityGranted: false,
  })
  const receipt = receiptSchema.parse({
    ...payload,
    executionDigestSha256: visualIntelligenceDigest(payload),
  })
  await persistExact(
    untrusted.objectPort,
    `${pathPrefix}/execution-receipt.json`,
    receipt,
  )
  return Object.freeze(receipt)
}

export function parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt(
  value: unknown,
): VisualIntelligenceModelBillingSkuLiveExecutionReceipt {
  const receipt = receiptSchema.parse(value)
  const payload = { ...receipt }
  Reflect.deleteProperty(payload, 'executionDigestSha256')
  if (receipt.executionDigestSha256 !== visualIntelligenceDigest(payload)) {
    throw new Error('Visual Intelligence live execution digest is invalid.')
  }
  return Object.freeze(receipt)
}

async function executeOne(input: {
  qualificationId: string
  contextClass: 'standard_le_200k' | 'long_gt_200k'
  countedPromptTokenCount: number
  contents: VisualIntelligenceGeminiContent[]
  objectPort: CanonicalCreateOnlyJsonObjectPort
  pathPrefix: string
  generatePort: VisualIntelligenceModelBillingSkuLiveGeneratePort
  now: () => string
}) {
  const labelContext = input.contextClass === 'standard_le_200k'
    ? 'standard'
    : 'long'
  const config: VisualIntelligenceGeminiGenerateContentConfig = {
    systemInstruction:
      'This is an isolated WeEditPro billing-path qualification. Return '
      + 'only a JSON object with acknowledgement set to qualified.',
    candidateCount: 1,
    // High thinking consumes the same output-token envelope. A 256-token
    // envelope terminates the real model at MAX_TOKENS before its bounded JSON
    // response; 4,096 remains tightly bounded while allowing High reasoning.
    maxOutputTokens: QUALIFICATION_MAX_OUTPUT_TOKENS,
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['acknowledgement'],
      properties: {
        acknowledgement: { type: 'string', enum: ['qualified'] },
      },
    },
    mediaResolution: VISUAL_INTELLIGENCE_GEMINI_MEDIA_RESOLUTION_HIGH,
    thinkingConfig: {
      thinkingLevel: VISUAL_INTELLIGENCE_GEMINI_THINKING_LEVEL_HIGH,
    },
    labels: {
      capability: 'visual-intelligence',
      operation: 'billing-sku-qualification',
      context: labelContext,
      qualification: createHash('sha256')
        .update(input.qualificationId).digest('hex').slice(0, 32),
    },
    httpOptions: {
      apiVersion: API_VERSION,
      timeout: DEFAULT_TIMEOUT_MS,
      retryOptions: { attempts: 1 },
    },
  }
  const contentIdentity = providerContentIdentity(input.contents)
  const requestIdentity = {
    schemaVersion:
      'visual-intelligence-model-billing-sku-provider-request-v1',
    qualificationId: input.qualificationId,
    contextClass: input.contextClass,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    countedPromptTokenCount: input.countedPromptTokenCount,
    contentDigestSha256: contentIdentity.contentDigestSha256,
    contentCharacterCount: contentIdentity.contentCharacterCount,
    config,
    thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
    mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
    providerToolsEnabled: false,
    automaticProviderRetryEnabled: false,
    customerCreditsMutated: false,
  } as const
  const requestRef = await persistExact(
    input.objectPort,
    `${input.pathPrefix}/${labelContext}-request.json`,
    requestIdentity,
  )
  const providerRequestStartedAtIso = timestamp.parse(input.now())
  let generated: VisualIntelligenceGeminiBillingGenerateResult
  try {
    generated = await input.generatePort.generate({
      model: VISUAL_INTELLIGENCE_MODEL_ID,
      contents: input.contents,
      config,
    })
  } catch (error) {
    await persistExact(
      input.objectPort,
      `${input.pathPrefix}/${labelContext}-outcome-unknown.json`,
      {
        schemaVersion:
          'visual-intelligence-model-billing-sku-provider-failure-v1',
        qualificationId: input.qualificationId,
        contextClass: input.contextClass,
        requestRef,
        outcome: 'unknown',
        automaticRetryAllowed: false,
        customerCreditsMutated: false,
        observedAt: timestamp.parse(input.now()),
      },
    )
    throw new Error(
      'Visual Intelligence live provider outcome is unknown; retry is blocked.',
      { cause: error },
    )
  }
  const providerRequestFinishedAtIso = timestamp.parse(input.now())
  let usagePayload: z.infer<typeof usageWithoutDigestSchema>
  try {
    usagePayload = usageWithoutDigestSchema.parse({
      schemaVersion:
        'visual-intelligence-model-billing-sku-provider-usage-v1',
      qualificationId: input.qualificationId,
      contextClass: input.contextClass,
      exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
      responseId: generated.responseId,
      returnedModelVersion: generated.modelVersion,
      finishReason: generated.finishReason,
      candidateCount: generated.candidateCount,
      promptTokenCount: generated.promptTokenCount,
      candidateTokenCount: generated.candidateTokenCount,
      thinkingTokenCount: generated.thinkingTokenCount,
      cachedTokenCount: generated.cachedTokenCount,
      totalTokenCount: generated.totalTokenCount,
      countedPromptTokenCount: input.countedPromptTokenCount,
      requestConfigurationDigestSha256:
        visualIntelligenceDigest({ contentIdentity, config }),
      providerRequestStartedAtIso,
      providerRequestFinishedAtIso,
      exactReturnedModelIdVerified: true,
      providerToolsEnabled: false,
      automaticProviderRetryEnabled: false,
      customerCreditsMutated: false,
      customerPricingAuthorityGranted: false,
      productionReleaseAuthorityGranted: false,
    })
  } catch (error) {
    await persistExact(
      input.objectPort,
      `${input.pathPrefix}/${labelContext}-response-rejected.json`,
      {
        schemaVersion:
          'visual-intelligence-model-billing-sku-provider-response-rejection-v1',
        qualificationId: input.qualificationId,
        contextClass: input.contextClass,
        requestRef,
        responseIdDigestSha256: `sha256:${createHash('sha256')
          .update(generated.responseId, 'utf8').digest('hex')}`,
        returnedModelVersion: generated.modelVersion,
        finishReason: generated.finishReason,
        promptTokenCount: generated.promptTokenCount,
        candidateTokenCount: generated.candidateTokenCount,
        thinkingTokenCount: generated.thinkingTokenCount,
        cachedTokenCount: generated.cachedTokenCount,
        totalTokenCount: generated.totalTokenCount,
        providerResponseExecuted: true,
        qualificationAccepted: false,
        automaticRetryAllowed: false,
        customerCreditsMutated: false,
        productionReleaseAuthorityGranted: false,
        observedAt: providerRequestFinishedAtIso,
      },
    )
    throw new Error(
      'Visual Intelligence live provider response was rejected; automatic '
        + 'retry is blocked.',
      { cause: error },
    )
  }
  const usage = usageSchema.parse({
    ...usagePayload,
    usageDigestSha256: visualIntelligenceDigest(usagePayload),
  })
  const usageRef = await persistExact(
    input.objectPort,
    `${input.pathPrefix}/${labelContext}-usage.json`,
    usage,
  )
  return Object.freeze({ requestRef, usageRef, usage })
}

async function compileLongContextContents(
  port: VisualIntelligenceModelBillingSkuLiveGeneratePort,
): Promise<VisualIntelligenceGeminiContent[]> {
  let markerCount = INITIAL_LONG_TOKEN_MARKER_COUNT
  for (let pass = 0; pass < MAX_TOKEN_CALIBRATION_PASSES; pass += 1) {
    const contents = contentsFor(`${'x '.repeat(markerCount)}\nReturn the bounded JSON acknowledgement.`)
    if (JSON.stringify(contents).length > MAX_LONG_PROMPT_CHARACTERS) {
      throw new Error('Long-context qualification payload is too large.')
    }
    const counted = await countExact(port, contents)
    if (counted > VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS) {
      return contents
    }
    markerCount = Math.ceil(
      markerCount
      * (VISUAL_INTELLIGENCE_STANDARD_CONTEXT_MAX_INPUT_TOKENS
        + LONG_CONTEXT_TOKEN_MARGIN)
      / counted,
    )
  }
  throw new Error('Long-context qualification calibration did not converge.')
}

async function countExact(
  port: VisualIntelligenceModelBillingSkuLiveGeneratePort,
  contents: VisualIntelligenceGeminiContent[],
): Promise<number> {
  const count = await port.countTokens({
    model: VISUAL_INTELLIGENCE_MODEL_ID,
    contents,
  })
  return positiveInteger.parse(count)
}

function contentsFor(text: string): VisualIntelligenceGeminiContent[] {
  return [{ role: 'user', parts: [{ text }] }]
}

function providerContentIdentity(contents: VisualIntelligenceGeminiContent[]) {
  if (
    contents.length !== 1
    || contents[0]?.role !== 'user'
    || contents[0].parts?.length !== 1
    || typeof contents[0].parts[0]?.text !== 'string'
  ) throw new Error('Visual Intelligence qualification content is invalid.')
  const text = contents[0].parts[0].text
  if (text.length < 1 || text.length > MAX_LONG_PROMPT_CHARACTERS) {
    throw new Error('Visual Intelligence qualification content is out of bounds.')
  }
  return Object.freeze({
    contentDigestSha256:
      `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`,
    contentCharacterCount: text.length,
  })
}

async function persistExact(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<VisualIntelligenceEvidenceRef> {
  const canonical = visualIntelligenceCanonicalJson(value)
  const body = Buffer.from(canonical, 'utf8')
  const rawDigest = createHash('sha256').update(body).digest('hex')
  await objectPort.createOnly({
    objectPath,
    body,
    contentSha256: rawDigest,
  })
  const reread = await objectPort.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('Visual Intelligence live qualification reread changed.')
  }
  return evidenceRefSchema.parse({
    id: createHash('sha256').update(objectPath).digest('hex').slice(0, 48),
    version: 1,
    contentHash: `sha256:${rawDigest}`,
  })
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}
