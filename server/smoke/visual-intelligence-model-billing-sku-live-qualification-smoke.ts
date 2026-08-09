import assert from 'node:assert/strict'

import {
  FinishReason,
  MediaResolution,
  ThinkingLevel,
  type Content,
} from '@google/genai'

import {
  VISUAL_INTELLIGENCE_MODEL_ID,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  executeVisualIntelligenceModelBillingSkuLiveQualification,
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt,
  type VisualIntelligenceModelBillingSkuLiveGeneratePort,
} from '../visual-intelligence/visual-intelligence-model-billing-sku-live-qualification'

let tick = Date.parse('2026-08-09T05:00:00.000Z')
const now = () => {
  const value = new Date(tick).toISOString()
  tick += 1_000
  return value
}

const objectPort = memoryObjectPort()
const observedConfigs: unknown[] = []
const generatePort = fakeGeneratePort({ observedConfigs })
const receipt = await executeVisualIntelligenceModelBillingSkuLiveQualification({
  qualificationId: 'weeditpro-gemini31-model-sku-live-smoke-v1',
  projectId: 'reeditpro',
  vertexLocation: 'global',
  objectPort,
  generatePort,
  now,
})

assert.deepEqual(
  parseVisualIntelligenceModelBillingSkuLiveExecutionReceipt(receipt),
  receipt,
)
assert.equal(observedConfigs.length, 2)
for (const untrusted of observedConfigs) {
  const config = untrusted as {
    thinkingConfig?: { thinkingLevel?: string }
    mediaResolution?: string
    labels?: Record<string, string>
    httpOptions?: { retryOptions?: { attempts?: number } }
    maxOutputTokens?: number
  }
  assert.equal(config.thinkingConfig?.thinkingLevel, ThinkingLevel.HIGH)
  assert.equal(
    config.mediaResolution,
    MediaResolution.MEDIA_RESOLUTION_HIGH,
  )
  assert.equal(config.labels?.capability, 'visual-intelligence')
  assert.equal(config.labels?.operation, 'billing-sku-qualification')
  assert.equal(config.httpOptions?.retryOptions?.attempts, 1)
  assert.equal(config.maxOutputTokens, 4_096)
}
assert.notEqual(
  receipt.standardContextProviderRequestRef.contentHash,
  receipt.longContextProviderRequestRef.contentHash,
)
assert.equal(receipt.customerCreditsMutated, false)
assert.equal(receipt.billingExportReconciliationPending, true)

let unknownCalls = 0
await assert.rejects(
  executeVisualIntelligenceModelBillingSkuLiveQualification({
    qualificationId: 'weeditpro-gemini31-model-sku-live-unknown-v1',
    projectId: 'reeditpro',
    vertexLocation: 'global',
    objectPort: memoryObjectPort(),
    generatePort: fakeGeneratePort({
      observedConfigs: [],
      generate: async () => {
        unknownCalls += 1
        throw new Error('controlled unknown')
      },
    }),
    now,
  }),
  /outcome is unknown; retry is blocked/u,
)
assert.equal(unknownCalls, 1)

await assert.rejects(
  executeVisualIntelligenceModelBillingSkuLiveQualification({
    qualificationId: 'weeditpro-gemini31-model-sku-live-wrong-model-v1',
    projectId: 'reeditpro',
    vertexLocation: 'global',
    objectPort: memoryObjectPort(),
    generatePort: fakeGeneratePort({
      observedConfigs: [],
      returnedModel: 'gemini-wrong-model',
    }),
    now,
  }),
)

process.stdout.write(`${JSON.stringify({
  qualificationId: receipt.qualificationId,
  standardAndLongContextExecuted: true,
  professionalHighExplicit: true,
  exactModelRequired: true,
  automaticRetryBlockedOnUnknownOutcome: true,
  billingExportReconciliationPending: true,
  customerCreditsMutated: false,
})}\n`)

function fakeGeneratePort(input: {
  observedConfigs: unknown[]
  returnedModel?: string
  generate?: VisualIntelligenceModelBillingSkuLiveGeneratePort['generate']
}): VisualIntelligenceModelBillingSkuLiveGeneratePort {
  return {
    async countTokens(request) {
      return tokenCount(request.contents)
    },
    async generate(request) {
      input.observedConfigs.push(request.config)
      if (input.generate) return input.generate(request)
      const promptTokenCount = tokenCount(request.contents)
      return {
        responseId: `response-${input.observedConfigs.length}`,
        modelVersion: input.returnedModel ?? VISUAL_INTELLIGENCE_MODEL_ID,
        finishReason: FinishReason.STOP,
        candidateCount: 1,
        promptTokenCount,
        candidateTokenCount: 4,
        thinkingTokenCount: 8,
        cachedTokenCount: 0,
        totalTokenCount: promptTokenCount + 12,
      }
    },
  }
}

function tokenCount(contents: Content[]): number {
  const text = contents.flatMap((content) => content.parts ?? [])
    .map((part) => 'text' in part ? part.text ?? '' : '')
    .join('')
  return Math.max(1, Math.ceil(text.length / 2))
}

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const prior = objects.get(input.objectPath)
      if (prior && !prior.equals(input.body)) {
        throw new Error('controlled create-only conflict')
      }
      if (!prior) objects.set(input.objectPath, Buffer.from(input.body))
      return prior ? 'already_exists' : 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}
