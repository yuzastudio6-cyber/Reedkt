import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalSourceLedContentAnalysisReasoner,
  createGpt56TerraSourceContentReasoningPort,
  createKimiK3SourceContentReasoningPort,
  type CanonicalSourceLedContentReasoningAttempt,
  type CanonicalSourceLedContentReasoningPort,
  type CanonicalSourceLedContentReasoningRequest,
} from '../services/canonical-source-led-content-analysis-reasoner'
import type {
  CanonicalSourceLedContentAnalysisSourceInput,
} from '../services/canonical-source-led-content-analysis-evidence'

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

const transcriptOne = [{
  segmentId: 'transcript-1-hook',
  startFrame: 30,
  endFrameExclusive: 100,
  text: 'Here is the verified opening.',
  confidenceBasisPoints: 9_300,
  wordsVerified: true,
}, {
  segmentId: 'transcript-1-action',
  startFrame: 180,
  endFrameExclusive: 240,
  text: 'Here is the successful action.',
  confidenceBasisPoints: 9_200,
  wordsVerified: true,
}]
const transcriptTwo = [{
  segmentId: 'transcript-2-close',
  startFrame: 120,
  endFrameExclusive: 330,
  text: 'Here is the verified conclusion.',
  confidenceBasisPoints: 9_100,
  wordsVerified: true,
}]
const visualOne = [{
  observationId: 'visual-1-setup',
  startFrame: 0,
  endFrameExclusive: 30,
  sourceFunction: 'setup' as const,
  actionIntensity: 'low' as const,
  editUsability: 'weak' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 8_500,
}, {
  observationId: 'visual-1-hook',
  startFrame: 30,
  endFrameExclusive: 100,
  sourceFunction: 'hook' as const,
  actionIntensity: 'medium' as const,
  editUsability: 'strong' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 9_200,
}, {
  observationId: 'visual-1-idle',
  startFrame: 100,
  endFrameExclusive: 180,
  sourceFunction: 'idle' as const,
  actionIntensity: 'none' as const,
  editUsability: 'weak' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 8_800,
}, {
  observationId: 'visual-1-action',
  startFrame: 180,
  endFrameExclusive: 240,
  sourceFunction: 'active_action' as const,
  actionIntensity: 'high' as const,
  editUsability: 'strong' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 9_100,
}, {
  observationId: 'visual-1-tail',
  startFrame: 240,
  endFrameExclusive: 300,
  sourceFunction: 'idle' as const,
  actionIntensity: 'none' as const,
  editUsability: 'weak' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 8_600,
}]
const visualTwo = [{
  observationId: 'visual-2-setup',
  startFrame: 0,
  endFrameExclusive: 120,
  sourceFunction: 'setup' as const,
  actionIntensity: 'low' as const,
  editUsability: 'weak' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 8_500,
}, {
  observationId: 'visual-2-close',
  startFrame: 120,
  endFrameExclusive: 330,
  sourceFunction: 'dialogue' as const,
  actionIntensity: 'low' as const,
  editUsability: 'strong' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 9_000,
}, {
  observationId: 'visual-2-tail',
  startFrame: 330,
  endFrameExclusive: 360,
  sourceFunction: 'idle' as const,
  actionIntensity: 'none' as const,
  editUsability: 'weak' as const,
  cameraStability: 'stable' as const,
  continuity: 'continuous' as const,
  confidenceBasisPoints: 8_400,
}]

const sources: CanonicalSourceLedContentAnalysisSourceInput[] = [{
  sourceSequenceItemId: 'source-sequence-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sha256('source-1'),
  byteLength: 1_000,
  durationFrames: 300,
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-small',
    modelDigestSha256: sha256('whisper'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: sha256(stableStringify(transcriptOne)),
    segments: transcriptOne,
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
  visual: {
    status: 'completed',
    modelId: 'qwen2.5-vl-7b-instruct-4bit',
    modelDigestSha256: sha256('qwen'),
    runtimeVersion: 'mlx-vlm-0.6.5',
    observationDigestSha256: sha256(stableStringify(visualOne)),
    observations: visualOne,
    rawFramesPersisted: false,
    rawModelOutputPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
}, {
  sourceSequenceItemId: 'source-sequence-2',
  mediaAssetId: 'media-asset-2',
  uploadedOrder: 2,
  checksumSha256: sha256('source-2'),
  byteLength: 2_000,
  durationFrames: 360,
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-small',
    modelDigestSha256: sha256('whisper'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: sha256(stableStringify(transcriptTwo)),
    segments: transcriptTwo,
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
  visual: {
    status: 'completed',
    modelId: 'qwen2.5-vl-7b-instruct-4bit',
    modelDigestSha256: sha256('qwen'),
    runtimeVersion: 'mlx-vlm-0.6.5',
    observationDigestSha256: sha256(stableStringify(visualTwo)),
    observations: visualTwo,
    rawFramesPersisted: false,
    rawModelOutputPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
}]

const selection = {
  sources: [{
    sourceSequenceItemId: 'source-sequence-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    selectedRanges: [{
      rangeId: 'range-1-hook',
      startFrame: 30,
      endFrameExclusive: 100,
      role: 'opening' as const,
      reason: 'Keep the verified opening and remove the preceding setup.',
      confidenceBasisPoints: 9_200,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['transcript-1-hook', 'visual-1-hook'],
      keepReasonCodes: ['strong_hook' as const, 'clear_explanation' as const],
      removedContextCodes: ['setup_cleanup' as const],
    }, {
      rangeId: 'range-1-action',
      startFrame: 180,
      endFrameExclusive: 240,
      role: 'action' as const,
      reason: 'Keep the separately verified successful action after the idle gap.',
      confidenceBasisPoints: 9_100,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['transcript-1-action', 'visual-1-action'],
      keepReasonCodes: ['good_visual_moment' as const, 'key_story_beat' as const],
      removedContextCodes: ['dead_space' as const, 'pacing_drag' as const],
    }],
  }, {
    sourceSequenceItemId: 'source-sequence-2',
    mediaAssetId: 'media-asset-2',
    uploadedOrder: 2,
    selectedRanges: [{
      rangeId: 'range-2-close',
      startFrame: 120,
      endFrameExclusive: 330,
      role: 'closing' as const,
      reason: 'Keep the complete verified conclusion after the setup.',
      confidenceBasisPoints: 9_000,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['transcript-2-close', 'visual-2-close'],
      keepReasonCodes: ['clear_explanation' as const, 'cta' as const],
      removedContextCodes: ['setup_cleanup' as const],
    }],
  }],
  sourceOrderPreserved: true as const,
  meaningPreservationPassed: true as const,
  userReviewRequired: false as const,
}

const planningDirection =
  'Create a professional concise edit from the verified clips in source order.'
const request: CanonicalSourceLedContentReasoningRequest = {
  workspaceId: 'workspace-reasoner',
  projectId: 'project-reasoner',
  editSessionId: 'edit-reasoner',
  analysisRunId: 'analysis-reasoner',
  planningDirection,
  userInstructionDigestSha256: sha256(planningDirection),
  fps: 30,
  sources,
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  REEDITPRO_KIMI_RUNTIME_MODE: 'internal_test',
  GOOGLE_SECRET_KIMI_API_KEY_NAME:
    'projects/reeditpro/secrets/reeditpro-prod-kimi-api-key/versions/7',
  REEDITPRO_OPENAI_RUNTIME_MODE: 'internal_test',
  GOOGLE_SECRET_OPENAI_API_KEY_NAME:
    'projects/reeditpro/secrets/reeditpro-prod-openai-api-key/versions/3',
})

let kimiCalls = 0
let terraCalls = 0
const kimi = createKimiK3SourceContentReasoningPort({
  env,
  credentialResolver: fixedCredential(7),
  async fetchImpl(_url, init) {
    kimiCalls += 1
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    assert.equal(body.model, 'kimi-k3')
    assert.equal(body.reasoning_effort, 'medium')
    assert.equal(body.stream, false)
    const format = body.response_format as Record<string, unknown>
    assert.equal(format.type, 'json_schema')
    const jsonSchema = format.json_schema as Record<string, unknown>
    assert.equal(jsonSchema.strict, true)
    assert.equal(JSON.stringify(body).includes('/Users/'), false)
    assert.equal(JSON.stringify(body).includes('controlled-token'), false)
    return jsonResponse({
      object: 'chat.completion',
      model: 'kimi-k3',
      choices: [{
        finish_reason: 'stop',
        message: { content: JSON.stringify(selection) },
      }],
      usage: {
        prompt_tokens: 500,
        completion_tokens: 300,
        total_tokens: 800,
      },
    })
  },
})
const terra = createGpt56TerraSourceContentReasoningPort({
  env,
  credentialResolver: fixedCredential(3),
  async fetchImpl(_url, init) {
    terraCalls += 1
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    assert.equal(body.model, 'gpt-5.6-terra')
    assert.deepEqual(body.reasoning, { effort: 'high', context: 'current_turn' })
    assert.equal(body.store, false)
    assert.equal(body.truncation, 'disabled')
    const text = body.text as Record<string, unknown>
    const format = text.format as Record<string, unknown>
    assert.equal(format.type, 'json_schema')
    assert.equal(format.strict, true)
    assert.equal(JSON.stringify(body).includes('/Users/'), false)
    assert.equal(JSON.stringify(body).includes('controlled-token'), false)
    return jsonResponse({
      object: 'response',
      status: 'completed',
      model: 'gpt-5.6-terra',
      output: [{
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{
          type: 'output_text',
          text: JSON.stringify(selection),
        }],
      }],
      usage: {
        input_tokens: 480,
        output_tokens: 320,
        total_tokens: 800,
      },
    })
  },
})

const primary = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi,
  terra,
}).reason(request)
assert.equal(primary.status, 'completed')
assert.equal(primary.finalAttempt.routeId, 'kimi_k3_primary')
assert.equal(primary.fallbackUsed, false)
assert.equal(primary.evidence?.summary.selectedRangeCount, 3)
assert.equal(primary.evidence?.summary.selectedTotalFrames, 340)
assert.equal(primary.evidence?.reasoning.providerModel, 'kimi-k3')
assert.equal(primary.evidence?.boundaries.executionStarted, false)
assert.equal(primary.evidence?.boundaries.customerChargeCreated, false)
assert.equal(kimiCalls, 1)
assert.equal(terraCalls, 0)

const fallback = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: fixedAttemptPort(failedAttempt('rate_limited')),
  terra,
}).reason(request)
assert.equal(fallback.status, 'completed')
assert.equal(fallback.finalAttempt.routeId, 'gpt_5_6_terra_fallback')
assert.equal(fallback.fallbackUsed, true)
assert.equal(fallback.evidence?.reasoning.providerModel, 'gpt-5.6-terra')
assert.equal(
  fallback.evidence?.reasoning.fallbackFromAttemptDigestSha256,
  fallback.primaryAttempt.attemptDigestSha256,
)
assert.equal(terraCalls, 1)

const outcomeUnknown = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: fixedAttemptPort(failedAttempt('outcome_unknown')),
  terra,
}).reason(request)
assert.equal(outcomeUnknown.status, 'blocked')
assert.equal(outcomeUnknown.blocker, 'outcome_unknown')
assert.equal(outcomeUnknown.fallbackUsed, false)
assert.equal(terraCalls, 1)

const invalidSelections = [
  {
    label: 'overlapping ranges',
    value: mutateSelection((draft) => {
      draft.sources[0]!.selectedRanges[1]!.startFrame = 90
    }),
  },
  {
    label: 'cross-source identity',
    value: mutateSelection((draft) => {
      draft.sources[0]!.mediaAssetId = 'media-asset-2'
    }),
  },
  {
    label: 'unverified evidence',
    value: mutateSelection((draft) => {
      draft.sources[1]!.selectedRanges[0]!.evidenceIds = ['invented-evidence']
    }),
  },
]
for (const invalid of invalidSelections) {
  const recovered = await createCanonicalSourceLedContentAnalysisReasoner({
      kimi: fixedAttemptPort(completedAttempt(invalid.value)),
      terra,
    }).reason(request)
  assert.equal(recovered.status, 'completed', invalid.label)
  assert.equal(recovered.primaryAttempt.status, 'invalid_response')
  assert.equal(recovered.finalAttempt.routeId, 'gpt_5_6_terra_fallback')
  assert.equal(recovered.fallbackUsed, true)
}
assert.equal(terraCalls, 1 + invalidSelections.length)

const terraCallsBeforeBodyTimeout = terraCalls
const responseBodyTimeoutStartedAt = Date.now()
const responseBodyTimeout = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: createKimiK3SourceContentReasoningPort({
    env,
    credentialResolver: fixedCredential(7),
    timeoutMs: 50,
    async fetchImpl(_url, init) {
      const signal = init?.signal
      assert.ok(signal)
      return new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          const failClosed = () => controller.error(new Error('controlled body timeout'))
          if (signal.aborted) failClosed()
          else signal.addEventListener('abort', failClosed, { once: true })
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  }),
  terra,
}).reason(request)
assert.equal(responseBodyTimeout.status, 'blocked')
assert.equal(responseBodyTimeout.blocker, 'outcome_unknown')
assert.equal(responseBodyTimeout.fallbackUsed, false)
assert.equal(terraCalls, terraCallsBeforeBodyTimeout)
assert.ok(Date.now() - responseBodyTimeoutStartedAt < 1_000)

await assert.rejects(
  createCanonicalSourceLedContentAnalysisReasoner({ kimi }).reason({
    ...request,
    userInstructionDigestSha256: sha256('different direction'),
  }),
  /lost exact private planning authority/iu,
)

const tamperedSource = structuredClone(sources)
tamperedSource[0]!.visual.observationDigestSha256 = sha256('forged')
await assert.rejects(
  createCanonicalSourceLedContentAnalysisReasoner({ kimi }).reason({
    ...request,
    sources: tamperedSource,
  }),
  /specialist evidence 1 is invalid/iu,
)

console.log(JSON.stringify({
  smoke: 'canonical-source-led-content-analysis-reasoner',
  primaryModel: primary.evidence?.reasoning.providerModel,
  fallbackModel: fallback.evidence?.reasoning.providerModel,
  selectedSources: primary.evidence?.summary.selectedSourceCount,
  selectedRanges: primary.evidence?.summary.selectedRangeCount,
  unknownOutcomeSecondProviderCalls: 0,
  responseBodyTimeoutFailClosed: responseBodyTimeout.blocker,
  adversarialAssertions: invalidSelections.length + 4,
}))

function fixedCredential(version: number): {
  resolve(): Promise<{ value: string; version: number }>
} {
  return {
    async resolve() {
      return { value: 'controlled-token', version }
    },
  }
}

function failedAttempt(
  status: CanonicalSourceLedContentReasoningAttempt['status'],
): CanonicalSourceLedContentReasoningAttempt {
  return {
    status,
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialVersion: 7,
    providerCallMade: true,
    modelCallMade: false,
    attemptDigestSha256: sha256(`attempt-${status}`),
  }
}

function completedAttempt(
  value: typeof selection,
): CanonicalSourceLedContentReasoningAttempt {
  return {
    status: 'completed',
    routeId: 'kimi_k3_primary',
    providerModel: 'kimi-k3',
    credentialVersion: 7,
    providerCallMade: true,
    modelCallMade: true,
    attemptDigestSha256: sha256('completed-attempt'),
    selection: value,
    usage: {
      promptTokens: 500,
      completionTokens: 300,
      totalTokens: 800,
    },
  }
}

function fixedAttemptPort(
  value: CanonicalSourceLedContentReasoningAttempt,
): CanonicalSourceLedContentReasoningPort {
  return {
    async select() {
      return value
    },
  }
}

function mutateSelection(
  mutate: (value: typeof selection) => void,
): typeof selection {
  const draft = structuredClone(selection)
  mutate(draft)
  return draft
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
