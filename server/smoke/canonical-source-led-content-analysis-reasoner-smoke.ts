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
  type CanonicalSourceLedContentReasoningSelection,
} from '../services/canonical-source-led-content-analysis-reasoner'
import {
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  createCanonicalSourceLedSourceFrameAuthority,
  type CanonicalSourceLedContentAnalysisSourceInput,
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
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

const transcriptCoverage = (durationFrames: number) => {
  const withoutDigest = {
    schemaVersion:
      'canonical-source-audio-complete-timeline-coverage-v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    completeAudioTimelineProcessed: true as const,
    speechSegmentsMayOmitSilence: true as const,
    embeddedInstructionDetectionRequired: true as const,
  }
  return {
    ...withoutDigest,
    coverageDigestSha256: sha256(stableStringify(withoutDigest)),
  }
}

const visualCoverage = (
  durationFrames: number,
  observations: ReadonlyArray<{ startFrame: number; endFrameExclusive: number }>,
) => {
  const withoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
    profileId:
      'visual_intelligence_source_edit_planning_professional_high_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    maximumWindowFrames: 240 as const,
    windowCount: observations.length,
    gapCount: 0 as const,
    completeSourceRangeRequested: true as const,
    completeRequestedRangeSemanticCoverage: true as const,
    orderedGaplessObservationPartition: true as const,
    deterministicGpuEvidenceUsed: true as const,
    providerVisualPreprocessingExpected: true as const,
    everyTimelineFrameInspected: false as const,
    completeTimePixelInspectionClaimAllowed: false as const,
    providerAudioUnderstandingClaimAllowed: false as const,
    completeAudioTranscriptSuppliedToHeadReasonerSeparately: true as const,
  }
  return {
    ...withoutDigest,
    coverageDigestSha256: sha256(stableStringify(withoutDigest)),
  }
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
}].map((observation, index) => ({
  ...observation,
  windowIndex: index + 1,
  evidenceRefs: [evidenceRef(`${observation.observationId}-evidence`)],
  providerObservationScope:
    'complete_source_range_semantic_partition' as const,
  exactProviderSampleFramesKnown: false as const,
}))
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
}].map((observation, index) => ({
  ...observation,
  windowIndex: index + 1,
  evidenceRefs: [evidenceRef(`${observation.observationId}-evidence`)],
  providerObservationScope:
    'complete_source_range_semantic_partition' as const,
  exactProviderSampleFramesKnown: false as const,
}))

function evidenceRef(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256(id)}`,
  }
}

function visualIntelligenceEvidence(
  sourceId: string,
  durationFrames: number,
  observations: ReadonlyArray<{
    startFrame: number
    endFrameExclusive: number
  } & Record<string, unknown>>,
) {
  return canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
    status: 'completed',
    evidenceMode: 'visual_intelligence_gemini_pro_high_v1',
    providerCapabilityId: 'visual_intelligence',
    providerSkillId: 'visual_intelligence.analyze_media',
    operation: 'analyze_media',
    profile: 'source_edit_planning',
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    providerModel: 'gemini-3.1-pro-preview',
    qualityProfile: 'professional_high',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    requestRef: evidenceRef(`${sourceId}-visual-request`),
    reportRef: evidenceRef(`${sourceId}-visual-report`),
    admissionRef: evidenceRef(`${sourceId}-visual-admission`),
    providerReleaseRef: evidenceRef(`${sourceId}-provider-release`),
    costEvidenceRef: evidenceRef(`${sourceId}-cost-evidence`),
    observationDigestSha256: sha256(stableStringify(observations)),
    observations,
    coverage: visualCoverage(durationFrames, observations),
    lifecycleInvocationDisposition: 'completed',
    providerCallMadeDuringInvocation: true,
    costSettledDuringInvocation: true,
    exactImmutableReportRereadVerified: true,
    applicationDefaultCredentialsUsed: true,
    accountEffectiveBillingRateUsed: true,
    publicListPriceUsedAsSettlementAuthority: false,
    providerVisualPreprocessingExpected: true,
    completeTimePixelInspectionClaimAllowed: false,
    selfHostedQwenRuntimeUsed: false,
    managedQwenApiUsed: false,
    localQwen25VlRuntimeUsed: false,
    signedReadUrlPersisted: false,
    signedReadUrlReturned: false,
    rawModelOutputPersisted: false,
  })
}

function historicalQwenVisualEvidence(
  durationFrames: number,
  observations: ReadonlyArray<{
    observationId: string
    startFrame: number
    endFrameExclusive: number
    sourceFunction: 'hook' | 'active_action' | 'setup' | 'dialogue' |
      'reaction' | 'detail' | 'transition' | 'idle' | 'unusable' | 'uncertain'
    actionIntensity: 'none' | 'low' | 'medium' | 'high'
    editUsability: 'strong' | 'usable' | 'weak' | 'reject'
    cameraStability: 'stable' | 'usable_motion' | 'unstable' | 'uncertain'
    continuity: 'continuous' | 'discontinuous' | 'uncertain'
    confidenceBasisPoints: number
  }>,
): CanonicalSourceLedContentAnalysisSourceInput['visual'] {
  const historicalObservations = observations.map((observation) => ({
    observationId: observation.observationId,
    startFrame: observation.startFrame,
    endFrameExclusive: observation.endFrameExclusive,
    sourceFunction: observation.sourceFunction,
    actionIntensity: observation.actionIntensity,
    editUsability: observation.editUsability,
    cameraStability: observation.cameraStability,
    continuity: observation.continuity,
    confidenceBasisPoints: observation.confidenceBasisPoints,
    sampledFrameNumbers: sampleFrames(
      observation.startFrame,
      observation.endFrameExclusive,
    ),
  }))
  const coverageWithoutDigest = {
    schemaVersion:
      'canonical-source-visual-complete-timeline-window-coverage-v1' as const,
    profileId:
      'approved_source_cleanup_complete_timeline_windows_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    maximumWindowFrames: 240 as const,
    targetSamplesPerWindow: 4 as const,
    windowCount: historicalObservations.length,
    sampledFrameCount: historicalObservations.reduce(
      (sum, observation) => sum + observation.sampledFrameNumbers.length,
      0,
    ),
    gapCount: 0 as const,
    completeTimelineWindowCoverage: true as const,
    everyTimelineFrameInspected: false as const,
    modelInspectsOnlySampledFrames: true as const,
    unsampledContentInspectionClaimAllowed: false as const,
  }
  return {
    status: 'completed',
    modelId: 'qwen2.5-vl-7b-instruct-4bit',
    modelDigestSha256: sha256('historical-qwen'),
    runtimeVersion: 'mlx-vlm-0.6.5',
    observationDigestSha256: sha256(stableStringify(historicalObservations)),
    observations: historicalObservations,
    coverage: {
      ...coverageWithoutDigest,
      coverageDigestSha256: sha256(stableStringify(coverageWithoutDigest)),
    },
    rawFramesPersisted: false,
    rawModelOutputPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  }
}

function sampleFrames(startFrame: number, endFrameExclusive: number) {
  const frameCount = endFrameExclusive - startFrame
  const count = Math.min(4, frameCount)
  return Array.from({ length: count }, (_, index) => count === 1
    ? startFrame
    : startFrame + Math.round(index * (frameCount - 1) / (count - 1)))
}

const sources: CanonicalSourceLedContentAnalysisSourceInput[] = [{
  sourceSequenceItemId: 'source-sequence-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sha256('source-1'),
  byteLength: 1_000,
  durationFrames: 300,
  sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 300,
    timeBaseNumerator: 1,
    timeBaseDenominator: 24,
  }),
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-small',
    modelDigestSha256: sha256('whisper'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: sha256(stableStringify(transcriptOne)),
    segments: transcriptOne,
    coverage: transcriptCoverage(300),
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
  visual: visualIntelligenceEvidence('source-1', 300, visualOne),
}, {
  sourceSequenceItemId: 'source-sequence-2',
  mediaAssetId: 'media-asset-2',
  uploadedOrder: 2,
  checksumSha256: sha256('source-2'),
  byteLength: 2_000,
  durationFrames: 360,
  sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 360,
    timeBaseNumerator: 1,
    timeBaseDenominator: 24,
  }),
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-small',
    modelDigestSha256: sha256('whisper'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: sha256(stableStringify(transcriptTwo)),
    segments: transcriptTwo,
    coverage: transcriptCoverage(360),
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
  visual: visualIntelligenceEvidence('source-2', 360, visualTwo),
}]

const selection: CanonicalSourceLedContentReasoningSelection = {
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
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
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
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }],
    removedRanges: [{
      rangeId: 'remove-1-setup',
      startFrame: 0,
      endFrameExclusive: 30,
      reason: 'Remove the visually verified setup before the opening.',
      confidenceBasisPoints: 8_500,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['visual-1-setup'],
      reasonCodes: ['setup_cleanup' as const],
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }, {
      rangeId: 'remove-1-idle',
      startFrame: 100,
      endFrameExclusive: 180,
      reason: 'Remove the visually verified idle interval.',
      confidenceBasisPoints: 8_800,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['visual-1-idle'],
      reasonCodes: ['dead_space' as const, 'pacing_drag' as const],
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }, {
      rangeId: 'remove-1-tail',
      startFrame: 240,
      endFrameExclusive: 300,
      reason: 'Remove the visually verified idle tail.',
      confidenceBasisPoints: 8_600,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['visual-1-tail'],
      reasonCodes: ['dead_space' as const],
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }],
    embeddedEditInstructions: [],
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
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }],
    removedRanges: [{
      rangeId: 'remove-2-setup',
      startFrame: 0,
      endFrameExclusive: 120,
      reason: 'Remove the visually verified setup before the conclusion.',
      confidenceBasisPoints: 8_500,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['visual-2-setup'],
      reasonCodes: ['setup_cleanup' as const],
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }, {
      rangeId: 'remove-2-tail',
      startFrame: 330,
      endFrameExclusive: 360,
      reason: 'Remove the visually verified idle tail.',
      confidenceBasisPoints: 8_400,
      phraseBoundaryAligned: true as const,
      preservesSourceMeaning: true as const,
      userReviewRequired: false as const,
      evidenceIds: ['visual-2-tail'],
      reasonCodes: ['dead_space' as const],
      decisionBasis: 'content_understanding' as const,
      instructionIds: [],
      timeOnlyDecision: false as const,
    }],
    embeddedEditInstructions: [],
  }],
  sourceOrderPreserved: true as const,
  completeSourceCoverageVerified: true as const,
  allTimelineIntervalsReviewed: true as const,
  embeddedInstructionsEvaluated: true as const,
  timeOnlyCutDecisionCount: 0 as const,
  meaningPreservationPassed: true as const,
  userReviewRequired: false as const,
  reviewReasons: [],
}

const planningDirection =
  'Create a professional concise edit from the verified clips in source order.'
const request: CanonicalSourceLedContentReasoningRequest = {
  workspaceId: 'workspace-reasoner',
  projectId: 'project-reasoner',
  editSessionId: 'edit-reasoner',
  analysisRunId: 'analysis-reasoner',
  planningDirection,
  planningDirectionDigestSha256: sha256(planningDirection),
  userInstructionDigestSha256:
    sha256('authenticated-saved-chat-authority-reasoner'),
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

const resolvedInstructionSelection = mutateSelection((draft) => {
  const source = draft.sources[0]!
  source.selectedRanges = [source.selectedRanges[0]!]
  source.removedRanges = [{
    ...source.removedRanges[0]!,
  }, {
    rangeId: 'remove-1-instruction-target',
    startFrame: 100,
    endFrameExclusive: 180,
    reason: 'Remove the exact prior idle part targeted by the resolved spoken instruction.',
    confidenceBasisPoints: 9_100,
    phraseBoundaryAligned: true,
    preservesSourceMeaning: true,
    userReviewRequired: false,
    evidenceIds: ['visual-1-idle', 'transcript-1-action'],
    reasonCodes: ['resolved_embedded_instruction'],
    decisionBasis: 'resolved_embedded_instruction',
    instructionIds: ['instruction-delete-that-part'],
    timeOnlyDecision: false,
  }, {
    rangeId: 'remove-1-editor-remark',
    startFrame: 180,
    endFrameExclusive: 240,
    reason: 'Remove the editor-directed spoken instruction from the viewer-facing program.',
    confidenceBasisPoints: 9_100,
    phraseBoundaryAligned: true,
    preservesSourceMeaning: true,
    userReviewRequired: false,
    evidenceIds: ['transcript-1-action', 'visual-1-action'],
    reasonCodes: ['resolved_embedded_instruction'],
    decisionBasis: 'resolved_embedded_instruction',
    instructionIds: ['instruction-delete-that-part'],
    timeOnlyDecision: false,
  }, {
    ...source.removedRanges[2]!,
  }]
  source.embeddedEditInstructions = [{
    instructionId: 'instruction-delete-that-part',
    instructionType: 'delete_previous_part',
    targetRelation: 'previous_context',
    transcriptSegmentId: 'transcript-1-action',
    spokenStartFrame: 180,
    spokenEndFrameExclusive: 240,
    targetStartFrame: 100,
    targetEndFrameExclusive: 180,
    reason: 'The surrounding context clearly binds delete that part to the immediately preceding idle interval.',
    confidenceBasisPoints: 9_100,
    evidenceIds: ['transcript-1-action', 'visual-1-idle', 'visual-1-action'],
    appliedDecisionIds: [
      'remove-1-instruction-target',
      'remove-1-editor-remark',
    ],
    spokenRemarkRemovalDecisionId: 'remove-1-editor-remark',
    classifiedAsEditorDirected: true,
    interpretationStatus: 'resolved',
    userReviewRequired: false,
  }]
})
const resolvedInstruction = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: fixedAttemptPort(completedAttempt(resolvedInstructionSelection)),
  terra,
}).reason(request)
assert.equal(resolvedInstruction.status, 'completed')
assert.equal(
  resolvedInstruction.evidence?.summary.embeddedInstructionCount,
  1,
)
assert.equal(
  resolvedInstruction.evidence?.sources[0]?.removedRanges[1]?.decisionBasis,
  'resolved_embedded_instruction',
)

const ambiguousInstructionSelection = mutateSelection((draft) => {
  const source = draft.sources[0]!
  source.selectedRanges = [{
    rangeId: 'preserve-source-1-pending-review',
    startFrame: 0,
    endFrameExclusive: 300,
    role: 'main_story',
    reason: 'Preserve the complete source until the ambiguous editor-directed instruction is resolved.',
    confidenceBasisPoints: 9_000,
    phraseBoundaryAligned: true,
    preservesSourceMeaning: true,
    userReviewRequired: false,
    evidenceIds: visualOne.map((observation) => observation.observationId),
    keepReasonCodes: ['source_context_required'],
    removedContextCodes: [],
    decisionBasis: 'content_understanding',
    instructionIds: [],
    timeOnlyDecision: false,
  }]
  source.removedRanges = []
  source.embeddedEditInstructions = [{
    instructionId: 'instruction-ambiguous-delete-that',
    instructionType: 'uncertain',
    targetRelation: 'uncertain',
    transcriptSegmentId: 'transcript-1-action',
    spokenStartFrame: 180,
    spokenEndFrameExclusive: 240,
    targetStartFrame: null,
    targetEndFrameExclusive: null,
    reason: 'Delete that part does not identify a safely provable target from the available context.',
    confidenceBasisPoints: 6_500,
    evidenceIds: ['transcript-1-action', 'visual-1-action'],
    appliedDecisionIds: [],
    spokenRemarkRemovalDecisionId: null,
    classifiedAsEditorDirected: true,
    interpretationStatus: 'user_review_required',
    userReviewRequired: true,
  }]
  draft.userReviewRequired = true
  draft.reviewReasons = [
    'The target of instruction-ambiguous-delete-that requires user confirmation.',
  ]
})
const ambiguousInstruction = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: fixedAttemptPort(completedAttempt(ambiguousInstructionSelection)),
  terra,
}).reason(request)
assert.equal(ambiguousInstruction.status, 'blocked')
assert.equal(ambiguousInstruction.blocker, 'user_review_required')
assert.equal(ambiguousInstruction.evidence, undefined)
assert.equal(ambiguousInstruction.reviewRequiredInstructions?.length, 1)

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
  {
    label: 'time-only cut decision',
    value: mutateSelection((draft) => {
      ;(draft.sources[0]!.removedRanges[0] as {
        timeOnlyDecision: boolean
      }).timeOnlyDecision = true
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
    planningDirectionDigestSha256: sha256('different direction'),
  }),
  /lost exact private planning authority/iu,
)

const distinctAuthorityDigest = await createCanonicalSourceLedContentAnalysisReasoner({
  kimi: fixedAttemptPort(completedAttempt(selection)),
}).reason({
  ...request,
  userInstructionDigestSha256:
    sha256('different-authenticated-saved-chat-authority'),
})
assert.equal(distinctAuthorityDigest.status, 'completed')
assert.equal(
  distinctAuthorityDigest.evidence?.identity.userInstructionDigestSha256,
  sha256('different-authenticated-saved-chat-authority'),
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

let historicalQwenProviderCalls = 0
const historicalQwenSources = structuredClone(sources)
historicalQwenSources[0]!.visual = historicalQwenVisualEvidence(
  300,
  visualOne,
)
await assert.rejects(
  createCanonicalSourceLedContentAnalysisReasoner({
    kimi: {
      async select() {
        historicalQwenProviderCalls += 1
        return completedAttempt(selection)
      },
    },
  }).reason({ ...request, sources: historicalQwenSources }),
  /Visual Intelligence evidence before any reasoning provider call/iu,
)
assert.equal(historicalQwenProviderCalls, 0)

console.log(JSON.stringify({
  smoke: 'canonical-source-led-content-analysis-reasoner',
  primaryModel: primary.evidence?.reasoning.providerModel,
  fallbackModel: fallback.evidence?.reasoning.providerModel,
  selectedSources: primary.evidence?.summary.selectedSourceCount,
  selectedRanges: primary.evidence?.summary.selectedRangeCount,
  unknownOutcomeSecondProviderCalls: 0,
  responseBodyTimeoutFailClosed: responseBodyTimeout.blocker,
  planningDirectionAndSavedChatAuthoritySeparated: true,
  historicalQwenProviderCalls,
  adversarialAssertions: invalidSelections.length + 6,
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
