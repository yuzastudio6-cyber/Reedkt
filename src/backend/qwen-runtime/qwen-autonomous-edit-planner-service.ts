import { autonomousEditPlanCandidateSchema } from './qwen-autonomous-edit-plan-schema'
import type {
  AutonomousEditPlanCandidate,
  AutonomousEditOperationId,
  AutonomousEditReferenceDnaSnapshot,
  AutonomousEditReferenceEvidence,
  AutonomousEditSourceEvidence,
  CreateAutonomousEditPlanRequest,
  QwenProviderTransportRequest,
} from '../../types'
import { CREATIVE_SKILL_KEYS } from '../../types/creative-skills-core'
import { sendQwenProviderTransportRequest } from './qwen-provider-transport'
import {
  createQwenRuntimeSafetyFlags,
  isQwenRuntimeConfigReadyForProvider,
  loadQwenRuntimeConfig,
} from './qwen-runtime-config-service'
import {
  resolveQwenDirectEnvSecretValue,
  resolveQwenSecretManagerValue,
} from './qwen-secret-manager-resolver'

export type QwenAutonomousEditPlannerStatus =
  | 'completed'
  | 'blocked_configuration'
  | 'blocked_secret'
  | 'blocked_evidence'
  | 'provider_failed'
  | 'invalid_plan'

export interface QwenAutonomousEditPlannerPrivateEvidence {
  transcriptText?: string
  transcriptSegments: Array<{
    id: string
    startSeconds: number
    endSeconds: number
    text: string
  }>
  visualSummary?: string
  visibleSubjects: string[]
  visibleObjects: string[]
  screenTextRegions: string[]
  compositionRisks: string[]
  brollOpportunities: string[]
  captionObservations: string[]
  styleObservations: string[]
  frameEvidence: AutonomousEditSourceEvidence['visualUnderstanding']['frameEvidence']
  referenceDna?: AutonomousEditReferenceDnaSnapshot
}

export interface QwenAutonomousEditPlannerResult {
  status: QwenAutonomousEditPlannerStatus
  candidate?: AutonomousEditPlanCandidate
  providerCallMade: boolean
  qwenCallMade: boolean
  deterministicCreativeFallbackUsed: false
  errors: string[]
  warnings: string[]
}

const unsafeCopyPattern = /copy exactly|recreate exact|clone (?:the )?(?:reference|creator)|shot[- ]for[- ]shot/i
const secretLikePattern = /service.?role|api.?key|authorization|bearer\s+|signed.?url|sk-[a-z0-9_-]+/i

export function createQwenAutonomousEditPlannerPrompt(input: {
  request: CreateAutonomousEditPlanRequest
  sourceEvidence: AutonomousEditSourceEvidence
  referenceEvidence?: AutonomousEditReferenceEvidence
  privateEvidence: QwenAutonomousEditPlannerPrivateEvidence
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    'You are ReEditPro\'s professional edit-planning brain.',
    'Return one JSON object matching AutonomousEditPlanCandidate exactly. Do not return markdown or hidden reasoning.',
    'Plan from the supplied source evidence and user intent. Do not use a generic template and do not invent transcript, visual, or timing evidence.',
    'Every segment must cite supplied transcript or visual evidence and must explain why its operations serve the story.',
    'Use operation IDs only from the allowed list. Select skills by capability, not by package/tool brand.',
    'Preserve meaning, source truth, speech clarity, confirmed frame, privacy, reference originality, and professional editing quality.',
    'Reference DNA is style guidance only. Never copy a reference shot-for-shot or imitate a creator exactly.',
    'When reference DNA exists, adapt only its measured pacing, caption, visual, and audio principles to this source, output frame, and safe zones. Do not invent traits that were not measured.',
    'If evidence is insufficient, return needs_clarification or blocked with precise blockers. Never fill gaps with random b-roll, graphics, transitions, music, captions, or motion.',
    'Graphics and motion must state content, timing, placement, visual role, animation behavior, and source evidence. Captions must state hierarchy, timing behavior, placement, emphasis rules, and readability constraints.',
    'Every caption operation must include a caption executionSpec. Every graphics.compose operation must include a graphic executionSpec. Every graphics.animate operation must include a graphic_motion executionSpec targeting a graphicId declared in the same segment.',
    'Every audio.cleanup or audio.loudness.normalize operation must include one coherent audio executionSpec. Every color.correct or color.grade operation must include one coherent color executionSpec.',
    'A ready-for-approval private edit may use only operations implemented by the current private worker: timeline select/trim/smart cut, captions, graphics, measured audio cleanup or normalization, measured color work, render composition, and QA. Return blocked rather than silently planning b-roll generation, music, SFX, or transitions that cannot execute yet.',
    'Authorize audio cleanup only when measured source audio evidence supports it. Authorize loudness normalization only from measured loudness. Authorize color correction or grading only from measured color and visual evidence.',
    'The response is a plan only. Do not claim execution, rendering, approval, credit spending, or product readiness.',
  ].join('\n')

  const userPayload = {
    userPrompt: input.request.prompt,
    optionalEditBrief: input.request.editBrief?.summary,
    preferences: input.request.preferences,
    referenceDna: input.privateEvidence.referenceDna,
    outputFrame: input.request.outputFrame,
    source: {
      fileName: input.request.source.fileName,
      mimeType: input.request.source.mimeType,
      checksumFingerprint: input.request.source.checksumSha256?.slice(0, 16),
    },
    probe: input.sourceEvidence.probe,
    measuredAudio: input.sourceEvidence.audio,
    measuredVisualRhythm: input.sourceEvidence.visualRhythm,
    measuredColor: input.sourceEvidence.color,
    transcript: {
      status: input.sourceEvidence.transcript.status,
      language: input.sourceEvidence.transcript.language,
      confidence: input.sourceEvidence.transcript.confidence,
      fullText: input.privateEvidence.transcriptText,
      segments: input.privateEvidence.transcriptSegments,
    },
    visualUnderstanding: {
      status: input.sourceEvidence.visualUnderstanding.status,
      summary: input.privateEvidence.visualSummary,
      visibleSubjects: input.privateEvidence.visibleSubjects,
      visibleObjects: input.privateEvidence.visibleObjects,
      screenTextRegions: input.privateEvidence.screenTextRegions,
      compositionRisks: input.privateEvidence.compositionRisks,
      brollOpportunities: input.privateEvidence.brollOpportunities,
      captionObservations: input.privateEvidence.captionObservations,
      styleObservations: input.privateEvidence.styleObservations,
      frameEvidence: input.privateEvidence.frameEvidence,
    },
    allowedOperationIds: [
      'timeline.select', 'timeline.trim', 'timeline.smart_cut',
      'caption.generate', 'caption.align', 'caption.style',
      'graphics.compose', 'graphics.animate', 'broll.select', 'broll.generate',
      'audio.cleanup', 'audio.loudness.normalize', 'audio.music.plan', 'audio.sfx.plan',
      'color.correct', 'color.grade', 'transition.apply', 'render.compose', 'qa.validate',
    ],
    allowedSkillKeys: CREATIVE_SKILL_KEYS,
    requiredResponseRules: {
      statusReadyOnlyWhenEvidenceSupportsEveryRequiredDecision: true,
      sourceTimesMustFitProbeDuration: true,
      noRawToolNamesInUserFacingCopy: true,
      noRandomCreativeChoices: true,
      clarificationQuestionsMustBeDecisionChanging: true,
    },
  }

  return {
    systemPrompt,
    userPrompt: JSON.stringify(userPayload),
  }
}

export async function runQwenAutonomousEditPlanner(input: {
  request: CreateAutonomousEditPlanRequest
  sourceEvidence: AutonomousEditSourceEvidence
  referenceEvidence?: AutonomousEditReferenceEvidence
  privateEvidence: QwenAutonomousEditPlannerPrivateEvidence
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  secretClient?: Parameters<typeof resolveQwenSecretManagerValue>[0]['client']
}): Promise<QwenAutonomousEditPlannerResult> {
  const env = input.env ?? process.env
  const evidenceBlockers = requiredEvidenceBlockers(input.sourceEvidence, input.referenceEvidence)
  if (evidenceBlockers.length > 0) {
    return blocked('blocked_evidence', evidenceBlockers, [
      'No deterministic creative fallback was generated because required source evidence is missing.',
    ])
  }

  const config = loadQwenRuntimeConfig(env)
  if (!isQwenRuntimeConfigReadyForProvider(config)) {
    return blocked('blocked_configuration', [config.status], config.warnings)
  }

  const apiKey = config.apiKeyDirectEnvConfigured
    ? resolveQwenDirectEnvSecretValue({
        symbolicName: 'QWEN_REASONING_API_KEY',
        value: env.QWEN_REASONING_API_KEY,
      })
    : await resolveQwenSecretManagerValue({
        symbolicName: 'QWEN_REASONING_API_KEY_SECRET',
        referenceName: config.apiKeySecretReferenceName,
        env,
        client: input.secretClient,
      })
  if (!apiKey.value) return blocked('blocked_secret', [apiKey.status], [apiKey.warning ?? 'Qwen secret resolution failed safely.'])

  const baseUrl = env.QWEN_REASONING_BASE_URL ?? await resolveOptionalSecret({
    symbolicName: 'QWEN_REASONING_BASE_URL_SECRET',
    referenceName: config.baseUrlSecretReferenceName,
    env,
    client: input.secretClient,
  })
  const modelId = env.QWEN_REASONING_MODEL_ID ?? await resolveOptionalSecret({
    symbolicName: 'QWEN_REASONING_MODEL_ID_SECRET',
    referenceName: config.modelIdSecretReferenceName,
    env,
    client: input.secretClient,
  })
  if (!baseUrl || !modelId) {
    return blocked('blocked_configuration', ['blocked_missing_base_url_or_model_id'], config.warnings)
  }

  const prompt = createQwenAutonomousEditPlannerPrompt(input)
  const transportRequest: QwenProviderTransportRequest = {
    profile: config.transportProfile,
    baseUrl,
    requestPath: config.requestPath,
    modelId,
    outputSchemaName: 'AutonomousEditPlanCandidate',
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    timeoutMs: Math.max(config.timeoutMs, 30_000),
    maxRetries: config.maxRetries,
  }
  const transport = await sendQwenProviderTransportRequest({
    request: transportRequest,
    apiKey: apiKey.value,
    fetchImpl: input.fetchImpl,
  })
  if (transport.status !== 'completed') {
    return {
      status: 'provider_failed',
      providerCallMade: transport.providerCallMade,
      qwenCallMade: transport.qwenCallMade,
      deterministicCreativeFallbackUsed: false,
      errors: [transport.status],
      warnings: [
        ...transport.warnings,
        'No deterministic creative fallback was generated after the provider failure.',
      ],
    }
  }

  const validation = autonomousEditPlanCandidateSchema.safeParse(transport.parsedJson)
  if (!validation.success) {
    return {
      ...createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }),
      status: 'invalid_plan',
      deterministicCreativeFallbackUsed: false,
      errors: validation.error.issues.map((issue) => `${issue.path.join('.') || 'plan'}: ${issue.message}`),
      warnings: ['Qwen returned a plan that failed strict schema validation; no plan was accepted.'],
    }
  }

  const semanticErrors = validateCandidateAgainstEvidence(validation.data, input.sourceEvidence)
  if (semanticErrors.length > 0) {
    return {
      status: 'invalid_plan',
      providerCallMade: true,
      qwenCallMade: true,
      deterministicCreativeFallbackUsed: false,
      errors: semanticErrors,
      warnings: ['Qwen plan contradicted source evidence or safety rules; no plan was accepted.'],
    }
  }

  return {
    status: 'completed',
    candidate: validation.data,
    providerCallMade: true,
    qwenCallMade: true,
    deterministicCreativeFallbackUsed: false,
    errors: [],
    warnings: ['Qwen autonomous plan passed schema and source-evidence validation.'],
  }
}

function requiredEvidenceBlockers(
  evidence: AutonomousEditSourceEvidence,
  referenceEvidence?: AutonomousEditReferenceEvidence,
): string[] {
  return [
    evidence.probe.durationSeconds > 0 ? undefined : 'source_probe_required',
    evidence.probe.videoStreamCount > 0 ? undefined : 'source_video_stream_required',
    evidence.probe.audioStreamCount === 0 || evidence.transcript.status === 'completed'
      ? undefined
      : 'source_transcript_required_for_audio_source',
    evidence.visualUnderstanding.status === 'completed' ? undefined : 'structured_visual_understanding_required',
    referenceEvidence && referenceEvidence.status !== 'completed' ? 'attached_reference_analysis_required' : undefined,
    ...(referenceEvidence?.blockers ?? []),
    ...evidence.blockers,
  ].filter((value): value is string => Boolean(value))
}

function validateCandidateAgainstEvidence(
  candidate: AutonomousEditPlanCandidate,
  evidence: AutonomousEditSourceEvidence,
): string[] {
  const errors: string[] = []
  const segmentIds = new Set(candidate.segments.map((segment) => segment.id))
  const captionSpecs: string[] = []
  const audioSpecs: string[] = []
  const colorSpecs: string[] = []
  const unsupportedReadyOperations = new Set<AutonomousEditOperationId>([
    'broll.select', 'broll.generate', 'audio.music.plan', 'audio.sfx.plan', 'transition.apply',
  ])
  for (const segment of candidate.segments) {
    if (segment.sourceEndSeconds > evidence.probe.durationSeconds + 0.05) {
      errors.push(`Segment ${segment.id} exceeds probed source duration.`)
    }
    if (segment.transcriptEvidence.length === 0 && segment.visualEvidence.length === 0) {
      errors.push(`Segment ${segment.id} has no source evidence.`)
    }
    const graphicIds = new Set(segment.operations.flatMap((operation) =>
      operation.executionSpec?.kind === 'graphic' ? [operation.executionSpec.graphicId] : []))
    for (const operation of segment.operations) {
      if (candidate.status === 'ready_for_approval' && unsupportedReadyOperations.has(operation.operationId)) {
        errors.push(`${operation.operationId} in ${segment.id} is not executable by the current private-review worker.`)
      }
      if (operation.operationId === 'audio.cleanup') {
        if (evidence.audio.status !== 'completed' || evidence.audio.noiseCondition === 'not_measured') {
          errors.push(`Audio cleanup in ${segment.id} requires measured source-noise evidence.`)
        } else if (evidence.audio.noiseCondition === 'low' && !evidence.audio.clippingDetected) {
          errors.push(`Audio cleanup in ${segment.id} is unsupported because measured noise is low and clipping was not detected.`)
        }
      }
      if ((operation.operationId === 'audio.cleanup' || operation.operationId === 'audio.loudness.normalize') && operation.executionSpec?.kind !== 'audio') {
        errors.push(`Audio work in ${segment.id} is missing a measured audio execution spec.`)
      }
      if (operation.executionSpec?.kind === 'audio') {
        audioSpecs.push(JSON.stringify(operation.executionSpec))
        const allowedEvidence = new Set([...operation.sourceEvidenceRefs, ...segment.transcriptEvidence, ...segment.visualEvidence])
        if (operation.executionSpec.evidenceBasis.some((reference) => !allowedEvidence.has(reference))) {
          errors.push(`Audio work in ${segment.id} cites evidence not declared by its segment operation.`)
        }
        if (operation.executionSpec.denoise !== 'none' && evidence.audio.noiseCondition === 'low') {
          errors.push(`Denoise in ${segment.id} contradicts the measured low-noise source condition.`)
        }
      }
      if (operation.operationId === 'audio.loudness.normalize' && evidence.audio.status !== 'completed') {
        errors.push(`Loudness normalization in ${segment.id} requires completed loudness measurement.`)
      }
      if ((operation.operationId === 'color.correct' || operation.operationId === 'color.grade') && evidence.color.status !== 'completed') {
        errors.push(`Color work in ${segment.id} requires completed source color measurement.`)
      }
      if ((operation.operationId === 'color.correct' || operation.operationId === 'color.grade') && operation.executionSpec?.kind !== 'color') {
        errors.push(`Color work in ${segment.id} is missing a measured color execution spec.`)
      }
      if (operation.executionSpec?.kind === 'color') {
        colorSpecs.push(JSON.stringify(operation.executionSpec))
        const allowedEvidence = new Set([...operation.sourceEvidenceRefs, ...segment.transcriptEvidence, ...segment.visualEvidence])
        if (operation.executionSpec.evidenceBasis.some((reference) => !allowedEvidence.has(reference))) {
          errors.push(`Color work in ${segment.id} cites evidence not declared by its segment operation.`)
        }
      }
      if (operation.operationId.startsWith('caption.') && operation.executionSpec?.kind !== 'caption') {
        errors.push(`Caption operation in ${segment.id} is missing a caption execution spec.`)
      }
      if (operation.operationId.startsWith('caption.') && evidence.transcript.status !== 'completed') {
        errors.push(`Caption operation in ${segment.id} requires completed transcript evidence.`)
      }
      if (operation.executionSpec?.kind === 'caption') captionSpecs.push(JSON.stringify(operation.executionSpec))
      if (operation.operationId === 'graphics.compose' && operation.executionSpec?.kind !== 'graphic') {
        errors.push(`Graphics composition in ${segment.id} is missing a graphic execution spec.`)
      }
      if (operation.operationId === 'graphics.animate') {
        if (operation.executionSpec?.kind !== 'graphic_motion') {
          errors.push(`Graphics animation in ${segment.id} is missing a graphic motion execution spec.`)
        } else if (!graphicIds.has(operation.executionSpec.targetGraphicId)) {
          errors.push(`Graphics animation in ${segment.id} targets an unknown graphic.`)
        }
      }
      if (operation.executionSpec?.kind === 'graphic') {
        const segmentDuration = segment.sourceEndSeconds - segment.sourceStartSeconds
        if (operation.executionSpec.endOffsetSeconds > segmentDuration + 0.05) {
          errors.push(`Graphic ${operation.executionSpec.graphicId} exceeds segment ${segment.id}.`)
        }
        const allowedEvidence = new Set([...operation.sourceEvidenceRefs, ...segment.transcriptEvidence, ...segment.visualEvidence])
        if (operation.executionSpec.contentEvidenceRefs.some((reference) => !allowedEvidence.has(reference))) {
          errors.push(`Graphic ${operation.executionSpec.graphicId} cites evidence not declared by its segment operation.`)
        }
      }
    }
  }
  if (new Set(captionSpecs).size > 1) {
    errors.push('Caption operations must use one coherent approved caption system across the edit.')
  }
  if (new Set(audioSpecs).size > 1) errors.push('Audio operations must use one coherent approved audio execution system across the edit.')
  if (new Set(colorSpecs).size > 1) errors.push('Color operations must use one coherent approved color execution system across the edit.')
  for (const skill of candidate.skillSelections) {
    for (const segmentId of skill.segmentIds) {
      if (!segmentIds.has(segmentId)) errors.push(`Skill ${skill.skillKey} references unknown segment ${segmentId}.`)
    }
  }
  if (candidate.status === 'ready_for_approval' && (candidate.blockers.length > 0 || candidate.clarificationQuestions.length > 0)) {
    errors.push('Ready-for-approval plan cannot contain blockers or clarification questions.')
  }
  const serialized = JSON.stringify(candidate)
  if (unsafeCopyPattern.test(serialized)) errors.push('Plan contains unsafe exact-copy direction.')
  if (secretLikePattern.test(serialized)) errors.push('Plan contains secret-like or signed-URL text.')
  return errors
}

async function resolveOptionalSecret(input: {
  symbolicName: string
  referenceName?: string
  env: Record<string, string | undefined>
  client?: Parameters<typeof resolveQwenSecretManagerValue>[0]['client']
}): Promise<string | undefined> {
  if (!input.referenceName) return undefined
  return (await resolveQwenSecretManagerValue(input)).value
}

function blocked(
  status: Extract<QwenAutonomousEditPlannerStatus, 'blocked_configuration' | 'blocked_secret' | 'blocked_evidence'>,
  errors: string[],
  warnings: string[],
): QwenAutonomousEditPlannerResult {
  return {
    status,
    providerCallMade: false,
    qwenCallMade: false,
    deterministicCreativeFallbackUsed: false,
    errors,
    warnings,
  }
}
