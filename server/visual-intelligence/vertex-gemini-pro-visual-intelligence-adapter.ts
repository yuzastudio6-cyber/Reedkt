import {
  FinishReason,
  GoogleGenAI,
  MediaResolution,
  PartMediaResolutionLevel,
  ThinkingLevel,
  type Content,
  type GenerateContentConfig,
} from '@google/genai'

import {
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_RESULT_V2_VERSION,
  VISUAL_INTELLIGENCE_SPATIAL_OBSERVATION_ROLES,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
  type VisualIntelligenceEvidenceRef,
  type VisualIntelligenceFrameRange,
  type VisualIntelligenceProvider,
  type VisualIntelligenceProviderExecutionResult,
  type VisualIntelligenceProviderRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  parseVisualIntelligenceProviderNormalizedResultV2,
  parseVisualIntelligenceRequest,
  visualIntelligenceSourcePlanningSegmentsAreComplete,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  compileVisualIntelligenceProviderInstruction,
  getVisualIntelligenceProfileDefinition,
  visualIntelligenceProfileRequiresSpatialEvidence,
} from './visual-intelligence-profile-registry'

export const VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION =
  'vertex-gemini-pro-visual-intelligence-adapter-v3' as const
export const VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION =
  'v1alpha' as const

const DEFAULT_TIMEOUT_MS = 600_000
const MAX_TIMEOUT_MS = 900_000
const MAX_PROVIDER_RESPONSE_BYTES = 8 * 1024 * 1024
const MAX_PROVIDER_MEDIA_PARTS = 64
const GCS_URI = /^gs:\/\/[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]\/[^?#\\]+$/u

export interface VisualIntelligenceGeminiGenerateInput {
  readonly model: typeof VISUAL_INTELLIGENCE_MODEL_ID
  readonly contents: Content[]
  readonly config: GenerateContentConfig
}

export interface VisualIntelligenceGeminiGenerateResult {
  readonly responseId: string
  readonly modelVersion: string
  readonly text: string
  readonly finishReason: string
  readonly candidateCount: number
  readonly promptTokenCount: number
  readonly candidateTokenCount: number
  readonly thinkingTokenCount: number
  readonly cachedTokenCount: number
  readonly totalTokenCount: number
  readonly groundingMetadataPresent: boolean
  readonly urlContextMetadataPresent: boolean
  readonly functionCallPresent: boolean
  readonly executableCodePresent: boolean
}

export interface VisualIntelligenceGeminiGeneratePort {
  generate(
    input: VisualIntelligenceGeminiGenerateInput,
  ): Promise<VisualIntelligenceGeminiGenerateResult>
}

export interface VisualIntelligenceProviderCostSettlementPort {
  settleAccountEffectiveUsage(input: {
    readonly requestId: string
    readonly idempotencyKey: string
    readonly exactModelId: typeof VISUAL_INTELLIGENCE_MODEL_ID
    readonly promptTokenCount: number
    readonly candidateTokenCount: number
    readonly thinkingTokenCount: number
    readonly cachedTokenCount: number
    readonly totalTokenCount: number
    readonly maximumAuthorizedCostMicros: number
    readonly accountEffectiveRateAuthorityRef:
      VisualIntelligenceEvidenceRef
  }): Promise<{
    readonly estimatedCostMicros: number
    readonly settledCostMicros: number
    readonly costEvidenceRef: VisualIntelligenceEvidenceRef
    readonly accountEffectiveRateAuthorityRef:
      VisualIntelligenceEvidenceRef
    readonly billingAccountEffectiveRateUsed: true
    readonly publicListPriceUsed: false
    readonly duplicateSettlementPerformed: false
  }>
}

export interface VertexGeminiProVisualIntelligenceAdapterOptions {
  readonly projectId: string
  readonly location: 'global' | 'us-central1' | 'europe-west4'
  readonly timeoutMs?: number
  readonly generatePort?: VisualIntelligenceGeminiGeneratePort
  readonly costSettlementPort: VisualIntelligenceProviderCostSettlementPort
}

export interface CompiledVertexGeminiProVisualIntelligenceDispatch {
  readonly adapterVersion:
    typeof VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION
  readonly exactModelId: typeof VISUAL_INTELLIGENCE_MODEL_ID
  readonly contents: Content[]
  readonly config: GenerateContentConfig
  readonly requestConfigurationDigestSha256: string
  readonly orderedPrivateArtifactIds: string[]
  readonly orderedMediaRangeBindings: Array<{
    readonly mediaPartOrdinal: number
    readonly artifactId: string
    readonly mediaKind: 'video' | 'image'
    readonly requestedRangeOrdinal: number
    readonly requestedRange: VisualIntelligenceFrameRange
    readonly providerStartOffset: string | null
    readonly providerEndOffset: string | null
    readonly providerFramesPerSecond: number | null
    readonly transportMode:
      | 'vertex_gcs_video_clipped_range'
      | 'vertex_gcs_image'
  }>
  readonly applicationDefaultCredentialsRequired: true
  readonly apiKeyAccepted: false
  readonly providerToolsEnabled: false
  readonly searchGroundingEnabled: false
  readonly urlContextEnabled: false
  readonly codeExecutionEnabled: false
  readonly automaticProviderRetryEnabled: false
  readonly legacySamplingOverridesEnabled: false
  readonly geminiThreeDefaultSamplingPreserved: true
  readonly callerPromptAccepted: false
  readonly publicMediaUrlAccepted: false
  readonly signedUrlIsSourceTruth: false
  readonly unboundedVideoInputAllowed: false
  readonly exactAuthorizedFrameRangesBound: true
  readonly providerPreprocessingIsExactFrameInspection: false
  readonly rawRequestMayBePersisted: false
}

export const VISUAL_INTELLIGENCE_PROVIDER_RESPONSE_JSON_SCHEMA = deepFreeze({
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion', 'requestId', 'semanticSummary', 'segments', 'findings',
    'spatialObservations',
    'targetedFollowupRanges', 'warnings', 'mediaContentTreatedAsUntrusted',
    'providerInstructionsFollowedFromMedia', 'editingOrRenderingClaimed',
  ],
  properties: {
    schemaVersion: {
      type: 'string',
      enum: [VISUAL_INTELLIGENCE_PROVIDER_RESULT_V2_VERSION],
    },
    requestId: { type: 'string', minLength: 1, maxLength: 240 },
    semanticSummary: { type: 'string', minLength: 1, maxLength: 16_384 },
    segments: {
      type: 'array',
      maxItems: 10_000,
      items: segmentJsonSchema(),
    },
    findings: {
      type: 'array',
      maxItems: 10_000,
      items: findingJsonSchema(),
    },
    spatialObservations: {
      type: 'array',
      maxItems: 10_000,
      items: spatialObservationJsonSchema(),
    },
    targetedFollowupRanges: {
      type: 'array',
      maxItems: 4_096,
      items: frameRangeJsonSchema(),
    },
    warnings: {
      type: 'array',
      maxItems: 512,
      items: { type: 'string', minLength: 1, maxLength: 16_384 },
    },
    mediaContentTreatedAsUntrusted: { type: 'boolean', enum: [true] },
    providerInstructionsFollowedFromMedia: { type: 'boolean', enum: [false] },
    editingOrRenderingClaimed: { type: 'boolean', enum: [false] },
  },
})

export function createVertexGeminiProVisualIntelligenceAdapter(
  options: VertexGeminiProVisualIntelligenceAdapterOptions,
): VisualIntelligenceProvider {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  if (
    !safeIdentity(options.projectId)
    || timeoutMs <= 0
    || timeoutMs > MAX_TIMEOUT_MS
  ) throw notReady('vertex_gemini_pro_adapter_configuration_invalid')
  const generatePort = options.generatePort
    ?? createGoogleGenAiVertexGeneratePort({
      projectId: options.projectId,
      location: options.location,
      timeoutMs,
    })
  return Object.freeze({
    adapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
    preflight(untrustedInput: VisualIntelligenceProviderRequest) {
      const dispatch = compileVertexGeminiProVisualIntelligenceDispatch(
        untrustedInput,
      )
      return Object.freeze({
        requestConfigurationDigestSha256:
          dispatch.requestConfigurationDigestSha256,
        exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
        professionalHighEnforced: true,
        automaticProviderRetryAllowed: false,
        providerToolsAllowed: false,
        callerPromptAccepted: false,
      })
    },
    async execute(
      untrustedInput: VisualIntelligenceProviderRequest,
    ): Promise<VisualIntelligenceProviderExecutionResult> {
      const input = validateProviderRequest(untrustedInput)
      const dispatch = compileVertexGeminiProVisualIntelligenceDispatch(input)
      let generated: VisualIntelligenceGeminiGenerateResult
      try {
        generated = await generatePort.generate({
          model: dispatch.exactModelId,
          contents: dispatch.contents,
          config: dispatch.config,
        })
      } catch {
        throw providerOutcomeUnknown(
          'vertex_gemini_pro_provider_outcome_unknown_no_automatic_retry',
        )
      }
      validateProviderEnvelope(generated)
      let rawResult: unknown
      try {
        if (Buffer.byteLength(generated.text, 'utf8') > MAX_PROVIDER_RESPONSE_BYTES) {
          throw new Error('response_too_large')
        }
        rawResult = JSON.parse(generated.text)
      } catch {
        throw executedRejected('vertex_gemini_pro_structured_response_invalid')
      }
      let normalizedResult: ReturnType<
        typeof parseVisualIntelligenceProviderNormalizedResultV2
      >
      try {
        normalizedResult = parseVisualIntelligenceProviderNormalizedResultV2(
          rawResult,
        )
        validateNormalizedResultAgainstRequest(normalizedResult, input)
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw executedRejected(
          'vertex_gemini_pro_structured_response_not_admissible',
        )
      }
      const admissionCost = input.request.admission.costPreflight
      const settlement = await options.costSettlementPort
        .settleAccountEffectiveUsage({
          requestId: input.request.requestId,
          idempotencyKey: input.request.idempotencyKey,
          exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
          promptTokenCount: generated.promptTokenCount,
          candidateTokenCount: generated.candidateTokenCount,
          thinkingTokenCount: generated.thinkingTokenCount,
          cachedTokenCount: generated.cachedTokenCount,
          totalTokenCount: generated.totalTokenCount,
          maximumAuthorizedCostMicros:
            admissionCost.maximumAuthorizedCostMicros,
          accountEffectiveRateAuthorityRef:
            admissionCost.accountEffectiveRateAuthorityRef,
        })
      if (
        !settlement.billingAccountEffectiveRateUsed
        || settlement.publicListPriceUsed
        || settlement.duplicateSettlementPerformed
        || refKey(settlement.accountEffectiveRateAuthorityRef)
          !== refKey(admissionCost.accountEffectiveRateAuthorityRef)
        || settlement.settledCostMicros
          > admissionCost.maximumAuthorizedCostMicros
      ) throw executedRejected('visual_intelligence_cost_settlement_not_admissible')
      const profile = getVisualIntelligenceProfileDefinition(
        input.request.operation,
        input.request.profile,
      )
      return deepFreeze({
        normalizedResult,
        usage: {
          promptTokenCount: generated.promptTokenCount,
          candidateTokenCount: generated.candidateTokenCount,
          thinkingTokenCount: generated.thinkingTokenCount,
          cachedTokenCount: generated.cachedTokenCount,
          totalTokenCount: generated.totalTokenCount,
          providerResponseId: generated.responseId,
          providerModelVersion: generated.modelVersion,
          estimatedCostMicros: settlement.estimatedCostMicros,
          settledCostMicros: settlement.settledCostMicros,
          costEvidenceRef: settlement.costEvidenceRef,
          billingAccountEffectiveRateUsed: true,
          publicListPriceUsed: false,
          duplicateSettlementPerformed: false,
          replayedFromCache: false,
          providerCallMade: true,
        },
        provenance: {
          providerAdapterId: VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
          providerId: VISUAL_INTELLIGENCE_PROVIDER_ID,
          exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
          thinkingLevel: VISUAL_INTELLIGENCE_THINKING_LEVEL,
          mediaResolution: VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
          promptVersion: profile.promptVersion,
          responseSchemaVersion: profile.responseSchemaVersion,
          applicationDefaultCredentialsUsed: true,
          providerToolsUsed: false,
          searchGroundingUsed: false,
          urlContextUsed: false,
          codeExecutionUsed: false,
          rawProviderPayloadPersisted: false,
        },
        sanitizedDiagnostics: [
          'vertex_adc_authenticated',
          'professional_high_explicit',
          'single_provider_attempt',
          'structured_result_validated',
          'account_effective_cost_settled',
        ],
      })
    },
  })
}

export function compileVertexGeminiProVisualIntelligenceDispatch(
  input: VisualIntelligenceProviderRequest,
): CompiledVertexGeminiProVisualIntelligenceDispatch {
  const validated = validateProviderRequest(input)
  const instruction = compileVisualIntelligenceProviderInstruction(
    validated.request,
  )
  const compiledMedia = compileAuthorizedMediaRangeParts(validated)
  const evidencePayload = {
    schemaVersion: 'visual-intelligence-provider-evidence-envelope-v1',
    requestId: validated.request.requestId,
    operation: validated.request.operation,
    profile: validated.request.profile,
    scope: validated.request.scope,
    authorizedArtifacts: [
      ...validated.request.sourceArtifacts,
      ...validated.request.comparisonArtifacts,
    ].map((artifact) => ({
      artifactId: artifact.artifactId,
      mediaKind: artifact.mediaKind,
      checksumSha256: artifact.checksumSha256,
      width: artifact.width,
      height: artifact.height,
      durationFrames: artifact.durationFrames,
      frameRate: artifact.frameRate,
      mediaProbeEvidenceRef: artifact.mediaProbeEvidenceRef,
    })),
    requestedRanges: validated.request.requestedRanges,
    requiredEvidenceRefs: validated.request.requiredEvidenceRefs,
    expectedOutcomeRefs: validated.request.expectedOutcomeRefs,
    outputFrame: validated.request.outputFrame,
    protectedZones: validated.request.protectedZones,
    deterministicEvidence: validated.deterministicEvidence,
    coveragePlan: validated.coveragePlan,
  }
  const contents: Content[] = [{
    role: 'user',
    parts: [
      ...compiledMedia.parts,
      { text: visualIntelligenceCanonicalJson(evidencePayload) },
    ],
  }]
  const config: GenerateContentConfig = {
    systemInstruction: instruction,
    candidateCount: 1,
    maxOutputTokens: 65_536,
    responseMimeType: 'application/json',
    responseJsonSchema: VISUAL_INTELLIGENCE_PROVIDER_RESPONSE_JSON_SCHEMA,
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.HIGH,
    },
    httpOptions: {
      apiVersion: VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
      timeout: DEFAULT_TIMEOUT_MS,
      retryOptions: { attempts: 1 },
    },
    labels: {
      capability: 'visual-intelligence',
      operation: validated.request.operation.replaceAll('_', '-'),
      profile: validated.request.profile.replaceAll('_', '-'),
    },
  }
  const dispatchIdentity = {
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    contents,
    config,
  }
  return deepFreeze({
    adapterVersion: VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_ADAPTER_VERSION,
    exactModelId: VISUAL_INTELLIGENCE_MODEL_ID,
    contents,
    config,
    requestConfigurationDigestSha256:
      visualIntelligenceDigest(dispatchIdentity),
    orderedPrivateArtifactIds:
      validated.privateMediaInputs.map((item) => item.artifactId),
    orderedMediaRangeBindings: compiledMedia.bindings,
    applicationDefaultCredentialsRequired: true,
    apiKeyAccepted: false,
    providerToolsEnabled: false,
    searchGroundingEnabled: false,
    urlContextEnabled: false,
    codeExecutionEnabled: false,
    automaticProviderRetryEnabled: false,
    legacySamplingOverridesEnabled: false,
    geminiThreeDefaultSamplingPreserved: true,
    callerPromptAccepted: false,
    publicMediaUrlAccepted: false,
    signedUrlIsSourceTruth: false,
    unboundedVideoInputAllowed: false,
    exactAuthorizedFrameRangesBound: true,
    providerPreprocessingIsExactFrameInspection: false,
    rawRequestMayBePersisted: false,
  })
}

function compileAuthorizedMediaRangeParts(
  input: VisualIntelligenceProviderRequest,
): {
  readonly parts: NonNullable<Content['parts']>
  readonly bindings:
    CompiledVertexGeminiProVisualIntelligenceDispatch['orderedMediaRangeBindings']
} {
  const artifacts = [
    ...input.request.sourceArtifacts,
    ...input.request.comparisonArtifacts,
  ]
  const parts: NonNullable<Content['parts']> = []
  const bindings: Array<
    CompiledVertexGeminiProVisualIntelligenceDispatch[
      'orderedMediaRangeBindings'
    ][number]
  > = []
  const expectedPartCount = artifacts.reduce(
    (count, artifact) => count + (
      artifact.mediaKind === 'video' ? input.request.requestedRanges.length : 1
    ),
    0,
  )
  if (expectedPartCount > MAX_PROVIDER_MEDIA_PARTS) {
    throw notReady('visual_intelligence_media_transport_requires_chunking')
  }
  for (let artifactOrdinal = 0; artifactOrdinal < artifacts.length;
    artifactOrdinal += 1) {
    const artifact = artifacts[artifactOrdinal]
    const media = input.privateMediaInputs[artifactOrdinal]
    if (!artifact || !media || artifact.artifactId !== media.artifactId) {
      throw notReady('visual_intelligence_media_transport_binding_invalid')
    }
    if (artifact.mediaKind === 'image') {
      if (
        input.request.requestedRanges.length !== 1
        || input.request.requestedRanges[0]?.startFrame !== 0
        || input.request.requestedRanges[0]?.endFrameExclusive !== 1
      ) throw notReady('visual_intelligence_image_transport_range_invalid')
      parts.push({
        fileData: {
          fileUri: media.gcsUri,
          mimeType: media.contentType,
        },
        mediaResolution: {
          level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
        },
      })
      bindings.push({
        mediaPartOrdinal: parts.length - 1,
        artifactId: artifact.artifactId,
        mediaKind: 'image',
        requestedRangeOrdinal: 0,
        requestedRange: input.request.requestedRanges[0],
        providerStartOffset: null,
        providerEndOffset: null,
        providerFramesPerSecond: null,
        transportMode: 'vertex_gcs_image',
      })
      continue
    }
    for (let rangeOrdinal = 0;
      rangeOrdinal < input.request.requestedRanges.length;
      rangeOrdinal += 1) {
      const range = input.request.requestedRanges[rangeOrdinal]
      if (!range) {
        throw notReady('visual_intelligence_video_transport_range_missing')
      }
      const startOffset = frameBoundaryToProtobufDuration(
        range.startFrame,
        range.frameRate,
        'floor',
      )
      const endOffset = frameBoundaryToProtobufDuration(
        range.endFrameExclusive,
        range.frameRate,
        'ceil',
      )
      const providerFramesPerSecond = Math.min(
        range.frameRate.numerator / range.frameRate.denominator,
        24,
      )
      if (
        !Number.isFinite(providerFramesPerSecond)
        || providerFramesPerSecond <= 0
      ) throw notReady('visual_intelligence_video_transport_fps_invalid')
      parts.push({
        fileData: {
          fileUri: media.gcsUri,
          mimeType: media.contentType,
        },
        videoMetadata: {
          startOffset,
          endOffset,
          fps: providerFramesPerSecond,
        },
        mediaResolution: {
          level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
        },
      })
      bindings.push({
        mediaPartOrdinal: parts.length - 1,
        artifactId: artifact.artifactId,
        mediaKind: 'video',
        requestedRangeOrdinal: rangeOrdinal,
        requestedRange: range,
        providerStartOffset: startOffset,
        providerEndOffset: endOffset,
        providerFramesPerSecond,
        transportMode: 'vertex_gcs_video_clipped_range',
      })
    }
  }
  if (parts.length === 0 || parts.length !== bindings.length) {
    throw notReady('visual_intelligence_media_transport_empty')
  }
  return deepFreeze({ parts, bindings })
}

/**
 * Vertex video clipping accepts protobuf Duration strings with nanosecond
 * precision. The frame range remains the canonical authority; these offsets
 * form a conservative transport envelope that cannot include a complete
 * adjacent frame when a rational frame boundary is not nanosecond-exact.
 */
function frameBoundaryToProtobufDuration(
  frame: number,
  frameRate: VisualIntelligenceFrameRange['frameRate'],
  rounding: 'floor' | 'ceil',
): string {
  if (!Number.isSafeInteger(frame) || frame < 0) {
    throw notReady('visual_intelligence_video_transport_frame_invalid')
  }
  const numerator = BigInt(frame) * BigInt(frameRate.denominator)
    * 1_000_000_000n
  const denominator = BigInt(frameRate.numerator)
  let nanoseconds = numerator / denominator
  if (rounding === 'ceil' && numerator % denominator !== 0n) nanoseconds += 1n
  const seconds = nanoseconds / 1_000_000_000n
  const fractionalNanoseconds = nanoseconds % 1_000_000_000n
  if (fractionalNanoseconds === 0n) return `${seconds}s`
  const fraction = fractionalNanoseconds.toString().padStart(9, '0')
    .replace(/0+$/u, '')
  return `${seconds}.${fraction}s`
}

function createGoogleGenAiVertexGeneratePort(input: {
  projectId: string
  location: string
  timeoutMs: number
}): VisualIntelligenceGeminiGeneratePort {
  const client = new GoogleGenAI({
    vertexai: true,
    project: input.projectId,
    location: input.location,
    httpOptions: {
      apiVersion: VERTEX_GEMINI_PRO_VISUAL_INTELLIGENCE_API_VERSION,
      timeout: input.timeoutMs,
      retryOptions: { attempts: 1 },
    },
  })
  return Object.freeze({
    async generate(request: VisualIntelligenceGeminiGenerateInput) {
      const response = await client.models.generateContent(request)
      const candidates = response.candidates ?? []
      const first = candidates[0]
      const usage = response.usageMetadata
      return {
        responseId: response.responseId ?? '',
        modelVersion: response.modelVersion ?? '',
        text: response.text ?? '',
        finishReason: first?.finishReason ?? '',
        candidateCount: candidates.length,
        promptTokenCount: usage?.promptTokenCount ?? -1,
        candidateTokenCount: usage?.candidatesTokenCount ?? -1,
        thinkingTokenCount: usage?.thoughtsTokenCount ?? 0,
        cachedTokenCount: usage?.cachedContentTokenCount ?? 0,
        totalTokenCount: usage?.totalTokenCount ?? -1,
        groundingMetadataPresent: Boolean(first?.groundingMetadata),
        urlContextMetadataPresent: Boolean(first?.urlContextMetadata),
        functionCallPresent: Boolean(response.functionCalls?.length),
        executableCodePresent: Boolean(response.executableCode),
      }
    },
  })
}

function validateProviderRequest(
  input: VisualIntelligenceProviderRequest,
): VisualIntelligenceProviderRequest {
  const request = parseVisualIntelligenceRequest(input.request)
  const profile = getVisualIntelligenceProfileDefinition(
    request.operation,
    request.profile,
  )
  if (
    input.promptVersion !== profile.promptVersion
    || input.responseSchemaVersion !== profile.responseSchemaVersion
  ) throw notReady('visual_intelligence_profile_version_mismatch')
  if (profile.spatialEvidencePolicy === 'required' && request.outputFrame === null) {
    throw notReady('visual_intelligence_spatial_output_frame_required')
  }
  const expectedArtifacts = [
    ...request.sourceArtifacts,
    ...request.comparisonArtifacts,
  ]
  if (input.privateMediaInputs.length !== expectedArtifacts.length) {
    throw notReady('visual_intelligence_private_media_set_incomplete')
  }
  const seen = new Set<string>()
  for (let index = 0; index < expectedArtifacts.length; index += 1) {
    const expected = expectedArtifacts[index]
    const actual = input.privateMediaInputs[index]
    if (
      seen.has(actual.artifactId)
      || actual.artifactId !== expected.artifactId
      || actual.contentType !== expected.contentType
      || actual.checksumSha256 !== expected.checksumSha256
      || actual.exactGenerationRereadVerified !== true
      || !GCS_URI.test(actual.gcsUri)
      || hasForbiddenControlCharacter(actual.gcsUri)
      || actual.gcsUri.includes('/../')
      || actual.gcsUri.includes('/./')
    ) throw notReady('visual_intelligence_private_media_binding_invalid')
    seen.add(actual.artifactId)
  }
  const evidenceIds = new Set<string>()
  for (const evidence of input.deterministicEvidence) {
    if (
      evidenceIds.has(evidence.evidenceId)
      || !seen.has(evidence.artifactId)
      || evidence.privateEvidence !== true
      || evidence.providerInstructionAccepted !== false
    ) throw notReady('visual_intelligence_deterministic_evidence_invalid')
    evidenceIds.add(evidence.evidenceId)
  }
  const deterministicRefs = new Set(
    input.deterministicEvidence.map((evidence) => refKey(evidence.evidenceRef)),
  )
  if (request.requiredEvidenceRefs.some(
    (requiredRef) => !deterministicRefs.has(refKey(requiredRef)),
  )) throw notReady('visual_intelligence_required_evidence_missing')
  if (
    input.coveragePlan.requestedRanges.length !== request.requestedRanges.length
    || input.coveragePlan.requestedRanges.some((range, index) =>
      !sameFrameRange(range, request.requestedRanges[index]))
  ) {
    throw notReady('visual_intelligence_coverage_plan_request_mismatch')
  }
  return Object.freeze({ ...input, request })
}

function validateProviderEnvelope(
  result: VisualIntelligenceGeminiGenerateResult,
): void {
  if (
    !safeIdentity(result.responseId)
    || result.modelVersion !== VISUAL_INTELLIGENCE_MODEL_ID
    || result.finishReason !== FinishReason.STOP
    || result.candidateCount !== 1
    || result.promptTokenCount < 0
    || result.candidateTokenCount < 0
    || result.thinkingTokenCount < 0
    || result.cachedTokenCount < 0
    || result.totalTokenCount
      < result.promptTokenCount + result.candidateTokenCount
        + result.thinkingTokenCount
    || result.groundingMetadataPresent
    || result.urlContextMetadataPresent
    || result.functionCallPresent
    || result.executableCodePresent
  ) throw executedRejected('vertex_gemini_pro_response_envelope_not_admissible')
}

function validateNormalizedResultAgainstRequest(
  result: ReturnType<typeof parseVisualIntelligenceProviderNormalizedResultV2>,
  input: VisualIntelligenceProviderRequest,
): void {
  if (result.requestId !== input.request.requestId) {
    throw executedRejected('visual_intelligence_provider_result_request_mismatch')
  }
  const artifacts = new Map([
    ...input.request.sourceArtifacts,
    ...input.request.comparisonArtifacts,
  ].map((item) => [item.artifactId, item]))
  const evidenceByRef = new Map(
    input.deterministicEvidence.map((item) => [
      refKey(item.evidenceRef),
      item,
    ]),
  )
  const segmentIds = new Set<string>()
  const representedArtifactIds = new Set<string>()
  for (const segment of result.segments) {
    const artifact = artifacts.get(segment.artifactId)
    if (
      !artifact
      || segmentIds.has(segment.segmentId)
      || segment.range.endFrameExclusive > artifact.durationFrames
      || segment.range.frameRate.numerator !== artifact.frameRate.numerator
      || segment.range.frameRate.denominator !== artifact.frameRate.denominator
      || !input.request.requestedRanges.some((requested) =>
        containsRange(requested, segment.range))
      || new Set(segment.evidenceRefs.map(refKey)).size
        !== segment.evidenceRefs.length
      || segment.evidenceRefs.some((ref) => !evidenceByRef.has(refKey(ref)))
      || segment.visibleTextEvidenceRefs.some((ref) =>
        evidenceByRef.get(refKey(ref))?.authority !== 'exact_ocr')
      || segment.transcriptEvidenceRefs.some((ref) =>
        evidenceByRef.get(refKey(ref))?.authority !== 'canonical_transcript')
    ) throw executedRejected('visual_intelligence_provider_segment_not_admissible')
    segmentIds.add(segment.segmentId)
    representedArtifactIds.add(segment.artifactId)
  }
  if (
    result.segments.length === 0
    || [...artifacts.keys()].some((artifactId) =>
      !representedArtifactIds.has(artifactId))
  ) throw executedRejected('visual_intelligence_provider_artifact_coverage_missing')
  if (!visualIntelligenceSourcePlanningSegmentsAreComplete({
    profile: input.request.profile,
    sourceArtifacts: input.request.sourceArtifacts,
    segments: result.segments,
    targetedFollowupRangeCount: result.targetedFollowupRanges.length,
  })) {
    throw executedRejected('visual_intelligence_source_planning_result_incomplete')
  }
  const expectedOutcomeRefs = new Set(
    input.request.expectedOutcomeRefs.map(refKey),
  )
  const findingIds = new Set<string>()
  for (const finding of result.findings) {
    const artifact = artifacts.get(finding.artifactId)
    if (
      !artifact
      || findingIds.has(finding.findingId)
      || finding.range.endFrameExclusive > artifact.durationFrames
      || finding.range.frameRate.numerator !== artifact.frameRate.numerator
      || finding.range.frameRate.denominator !== artifact.frameRate.denominator
      || !input.request.requestedRanges.some((requested) =>
        containsRange(requested, finding.range))
      || new Set(finding.evidenceRefs.map(refKey)).size
        !== finding.evidenceRefs.length
      || finding.evidenceRefs.some((ref) => !evidenceByRef.has(refKey(ref)))
      || finding.expectedOutcomeRefs.some(
        (ref) => !expectedOutcomeRefs.has(refKey(ref)),
      )
    ) throw executedRejected('visual_intelligence_provider_finding_not_admissible')
    findingIds.add(finding.findingId)
  }
  const spatialRequired = visualIntelligenceProfileRequiresSpatialEvidence(
    input.request.operation,
    input.request.profile,
  )
  if (
    (spatialRequired && (
      input.request.outputFrame === null
      || result.spatialObservations.length === 0
    ))
    || (!spatialRequired && result.spatialObservations.length !== 0)
  ) throw executedRejected('visual_intelligence_provider_spatial_coverage_invalid')
  const observationIds = new Set<string>()
  for (const observation of result.spatialObservations) {
    const artifact = artifacts.get(observation.artifactId)
    const references = observation.evidenceRefs.map((ref) =>
      evidenceByRef.get(refKey(ref)))
    if (
      !artifact
      || observationIds.has(observation.observationId)
      || observation.range.endFrameExclusive > artifact.durationFrames
      || observation.range.frameRate.numerator !== artifact.frameRate.numerator
      || observation.range.frameRate.denominator !== artifact.frameRate.denominator
      || !input.request.requestedRanges.some((requested) =>
        containsRange(requested, observation.range))
      || new Set(observation.evidenceRefs.map(refKey)).size
        !== observation.evidenceRefs.length
      || references.some((evidence) => !evidence)
      || observation.findingIds.some((findingId) => !findingIds.has(findingId))
      || (observation.sceneId !== null && !result.segments.some((segment) =>
        segment.artifactId === observation.artifactId
          && segment.sceneId === observation.sceneId
          && containsRange(segment.range, observation.range)))
    ) throw executedRejected(
      'visual_intelligence_provider_spatial_observation_invalid',
    )
    observationIds.add(observation.observationId)
  }
  if (result.targetedFollowupRanges.some((range) =>
    !input.request.requestedRanges.some((requested) =>
      containsRange(requested, range)))) {
    throw executedRejected(
      'visual_intelligence_provider_followup_range_not_admissible',
    )
  }
}

function containsRange(
  outer: VisualIntelligenceProviderRequest['request']['requestedRanges'][number],
  inner: VisualIntelligenceProviderRequest['request']['requestedRanges'][number],
): boolean {
  return outer.frameRate.numerator === inner.frameRate.numerator
    && outer.frameRate.denominator === inner.frameRate.denominator
    && outer.startFrame <= inner.startFrame
    && outer.endFrameExclusive >= inner.endFrameExclusive
}

function sameFrameRange(
  left: VisualIntelligenceFrameRange,
  right: VisualIntelligenceFrameRange | undefined,
): boolean {
  return Boolean(right)
    && left.startFrame === right?.startFrame
    && left.endFrameExclusive === right?.endFrameExclusive
    && left.frameRate.numerator === right?.frameRate.numerator
    && left.frameRate.denominator === right?.frameRate.denominator
}

function evidenceRefJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['id', 'version', 'contentHash'],
    properties: {
      id: { type: 'string', minLength: 1, maxLength: 240 },
      version: { type: 'integer', minimum: 1, maximum: 1_000_000 },
      contentHash: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
    },
  }
}

function frameRateJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['numerator', 'denominator'],
    properties: {
      numerator: { type: 'integer', minimum: 1, maximum: 1_000_000 },
      denominator: { type: 'integer', minimum: 1, maximum: 1_000_000 },
    },
  }
}

function frameRangeJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['startFrame', 'endFrameExclusive', 'frameRate'],
    properties: {
      startFrame: { type: 'integer', minimum: 0 },
      endFrameExclusive: { type: 'integer', minimum: 1 },
      frameRate: frameRateJsonSchema(),
    },
  }
}

function segmentJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: [
      'segmentId', 'artifactId', 'range', 'sceneId', 'summary', 'subjectIds',
      'objectIds', 'actionLabels', 'visibleTextEvidenceRefs',
      'transcriptEvidenceRefs', 'evidenceRefs', 'confidenceBasisPoints',
      'uncertainty', 'sourcePlanning',
    ],
    properties: {
      segmentId: { type: 'string', minLength: 1, maxLength: 240 },
      artifactId: { type: 'string', minLength: 1, maxLength: 240 },
      range: frameRangeJsonSchema(),
      sceneId: { anyOf: [
        { type: 'string', minLength: 1, maxLength: 240 },
        { type: 'null' },
      ] },
      summary: { type: 'string', minLength: 1, maxLength: 16_384 },
      subjectIds: stringArrayJsonSchema(256, 240),
      objectIds: stringArrayJsonSchema(256, 240),
      actionLabels: stringArrayJsonSchema(256, 160),
      visibleTextEvidenceRefs: {
        type: 'array', maxItems: 256, items: evidenceRefJsonSchema(),
      },
      transcriptEvidenceRefs: {
        type: 'array', maxItems: 256, items: evidenceRefJsonSchema(),
      },
      evidenceRefs: {
        type: 'array', minItems: 1, maxItems: 512,
        items: evidenceRefJsonSchema(),
      },
      confidenceBasisPoints: { type: 'integer', minimum: 0, maximum: 10_000 },
      uncertainty: { anyOf: [
        { type: 'string', minLength: 1, maxLength: 16_384 },
        { type: 'null' },
      ] },
      sourcePlanning: { anyOf: [
        {
          type: 'object', additionalProperties: false,
          required: [
            'sourceFunction', 'actionIntensity', 'editUsability',
            'cameraStability', 'continuity',
          ],
          properties: {
            sourceFunction: { type: 'string', enum: [
              'hook', 'active_action', 'setup', 'dialogue', 'reaction',
              'detail', 'transition', 'idle', 'unusable', 'uncertain',
            ] },
            actionIntensity: { type: 'string', enum: [
              'none', 'low', 'medium', 'high',
            ] },
            editUsability: { type: 'string', enum: [
              'strong', 'usable', 'weak', 'reject',
            ] },
            cameraStability: { type: 'string', enum: [
              'stable', 'usable_motion', 'unstable', 'uncertain',
            ] },
            continuity: { type: 'string', enum: [
              'continuous', 'discontinuous', 'uncertain',
            ] },
          },
        },
        { type: 'null' },
      ] },
    },
  }
}

function findingJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: [
      'findingId', 'artifactId', 'range', 'category', 'severity', 'summary',
      'evidenceRefs', 'expectedOutcomeRefs', 'confidenceBasisPoints',
      'uncertainty', 'recommendedOwner', 'reinspectionRequired',
      'directTimelineMutationAllowed', 'providerInstructionAccepted',
    ],
    properties: {
      findingId: { type: 'string', minLength: 1, maxLength: 240 },
      artifactId: { type: 'string', minLength: 1, maxLength: 240 },
      range: frameRangeJsonSchema(),
      category: { type: 'string', minLength: 1, maxLength: 240 },
      severity: { type: 'string', enum: [
        'info', 'warning', 'revision_required', 'blocking',
      ] },
      summary: { type: 'string', minLength: 1, maxLength: 16_384 },
      evidenceRefs: {
        type: 'array', minItems: 1, maxItems: 512,
        items: evidenceRefJsonSchema(),
      },
      expectedOutcomeRefs: {
        type: 'array', maxItems: 512, items: evidenceRefJsonSchema(),
      },
      confidenceBasisPoints: { type: 'integer', minimum: 0, maximum: 10_000 },
      uncertainty: { anyOf: [
        { type: 'string', minLength: 1, maxLength: 16_384 },
        { type: 'null' },
      ] },
      recommendedOwner: { type: 'string', enum: [
        'planning', 'caption', 'graphics', 'motion_graphics', 'living_frame',
        'smart_cut', 'compositing', 'color', 'aspect_ratio', 'render',
        'private_review', 'human_review',
      ] },
      reinspectionRequired: { type: 'boolean' },
      directTimelineMutationAllowed: { type: 'boolean', enum: [false] },
      providerInstructionAccepted: { type: 'boolean', enum: [false] },
    },
  }
}

function spatialObservationJsonSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: [
      'observationId', 'artifactId', 'sceneId', 'range', 'role',
      'regionBasisPoints', 'confidenceBasisPoints',
      'temporalStabilityBasisPoints', 'measuredContrastRatioMilli',
      'clutterBasisPoints', 'cropResilienceBasisPoints',
      'compositionBalanceBasisPoints', 'findingIds', 'evidenceRefs',
      'uncertaintyCode', 'semanticGeometryOnly',
      'deterministicPixelGeometryClaimed',
    ],
    properties: {
      observationId: { type: 'string', minLength: 1, maxLength: 240 },
      artifactId: { type: 'string', minLength: 1, maxLength: 240 },
      sceneId: { anyOf: [
        { type: 'string', minLength: 1, maxLength: 240 },
        { type: 'null' },
      ] },
      range: frameRangeJsonSchema(),
      role: {
        type: 'string',
        enum: [...VISUAL_INTELLIGENCE_SPATIAL_OBSERVATION_ROLES],
      },
      regionBasisPoints: {
        type: 'object', additionalProperties: false,
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'integer', minimum: 0, maximum: 10_000 },
          y: { type: 'integer', minimum: 0, maximum: 10_000 },
          width: { type: 'integer', minimum: 1, maximum: 10_000 },
          height: { type: 'integer', minimum: 1, maximum: 10_000 },
        },
      },
      confidenceBasisPoints: {
        type: 'integer', minimum: 0, maximum: 10_000,
      },
      temporalStabilityBasisPoints: {
        type: 'integer', minimum: 0, maximum: 10_000,
      },
      measuredContrastRatioMilli: { type: 'null' },
      clutterBasisPoints: {
        type: 'integer', minimum: 0, maximum: 10_000,
      },
      cropResilienceBasisPoints: {
        type: 'integer', minimum: 0, maximum: 10_000,
      },
      compositionBalanceBasisPoints: {
        type: 'integer', minimum: 0, maximum: 10_000,
      },
      findingIds: stringArrayJsonSchema(512, 240),
      evidenceRefs: {
        type: 'array', minItems: 1, maxItems: 512,
        items: evidenceRefJsonSchema(),
      },
      uncertaintyCode: { anyOf: [
        { type: 'string', minLength: 1, maxLength: 240 },
        { type: 'null' },
      ] },
      semanticGeometryOnly: { type: 'boolean', enum: [true] },
      deterministicPixelGeometryClaimed: { type: 'boolean', enum: [false] },
    },
  }
}

function stringArrayJsonSchema(maxItems: number, maxLength: number) {
  return {
    type: 'array', maxItems,
    items: { type: 'string', minLength: 1, maxLength },
  }
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
}

function hasForbiddenControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The professional Visual Intelligence provider is not ready.',
    503,
    { requiredGate },
  )
}

function executedRejected(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The professional Visual Intelligence provider result is not ready.',
    503,
    { requiredGate, providerOutcome: 'executed_rejected' },
  )
}

function providerOutcomeUnknown(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The professional Visual Intelligence provider outcome is unknown.',
    503,
    { requiredGate, providerOutcome: 'unknown' },
  )
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item)
  return value
}
