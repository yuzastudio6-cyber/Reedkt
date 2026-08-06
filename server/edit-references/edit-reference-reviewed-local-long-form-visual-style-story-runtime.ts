import type {
  EditReferenceStoryEditorialAuthorityEvidenceItem,
  EditReferenceStoryEditorialEvidenceAuthority,
  EditReferenceStoryEditorialEvidenceAuthorityResolverInput,
} from './edit-reference-media-study'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceLongFormSemanticWindowEvidenceBundle } from './edit-reference-long-form-semantic-window-evidence'
import type { EditReferenceLongFormSemanticWindowSpecialistRequest } from './edit-reference-long-form-semantic-window-dispatcher'
import type { EditReferenceLongFormSemanticWindowResolvedRuntime } from './edit-reference-long-form-semantic-window-specialist-executor'
import type { EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding } from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'
import { createEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProvider } from './edit-reference-reviewed-local-qwen25vl-mlx-story-editorial-provider'

export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_VISUAL_STYLE_STORY_RUNTIME_ID =
  'edit_reference_reviewed_local_long_form_visual_style_story_runtime' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_VISUAL_STYLE_STORY_RUNTIME_VERSION =
  'v1' as const

const SUPPORTED_SPECIALISTS = [
  'visual_language',
  'color_treatment',
  'graphics_motion',
  'story_editorial',
] as const

const SAFE_EVIDENCE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const MAX_EVIDENCE_SUMMARY_CHARACTERS = 800

type SupportedSpecialistId = typeof SUPPORTED_SPECIALISTS[number]

export interface EditReferenceReviewedLocalLongFormQwenRuntimeConfiguration {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly runValidation?: EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding
  readonly visualLanguageRunnerScriptPath?: string
  readonly styleRunnerScriptPath?: string
  readonly storyEditorialRunnerScriptPath?: string
  readonly timeoutMs?: number
}

export interface EditReferenceReviewedLocalLongFormVisualStyleStudyGoals {
  readonly visualLanguageEvidenceId: string
  readonly colorTreatmentEvidenceId: string
  readonly graphicsMotionEvidenceId: string
  readonly storyEditorialEvidence: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[]
}

export interface ResolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntimeInput {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
  readonly qwen: EditReferenceReviewedLocalLongFormQwenRuntimeConfiguration
  readonly studyGoals: EditReferenceReviewedLocalLongFormVisualStyleStudyGoals
  /**
   * Provider-neutral, already-reviewed authority only. Raw transcript text,
   * media bytes, local paths, signed URLs, and provider payloads are forbidden.
   */
  readonly storyEvidenceAuthority: EditReferenceStoryEditorialEvidenceAuthority
}

/**
 * Mounts the already-reviewed local Qwen2.5-VL visual/style classifiers and the
 * structured-evidence Story/Editorial classifier into one exact long-form
 * semantic window. This resolver has controlled-test authority only: it cannot
 * call a provider, create a worker, meter production cost, mutate credits, or
 * turn reference findings into target operations.
 */
export async function resolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntime(
  input: ResolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntimeInput,
): Promise<EditReferenceLongFormSemanticWindowResolvedRuntime> {
  validateResolverBinding(input)
  const common = {
    orchestrationId: `long-form-${input.request.specialistId}:${input.request.runId}:${input.request.semanticWindowOrdinal}`,
    studySessionId: input.stageInput.plan.studySessionId,
  }

  if (input.request.specialistId === 'visual_language') {
    return {
      specialistId: 'visual_language',
      runtime: {
        ...common,
        runtimeKind: 'reviewed_local_qwen25vl_mlx',
        studyGoalEvidenceId: input.studyGoals.visualLanguageEvidenceId,
        manifestPath: input.qwen.manifestPath,
        modelPath: input.qwen.modelPath,
        pythonCommand: input.qwen.pythonCommand,
        ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
        ...(input.qwen.visualLanguageRunnerScriptPath
          ? { runnerScriptPath: input.qwen.visualLanguageRunnerScriptPath }
          : {}),
        ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      },
    }
  }
  if (input.request.specialistId === 'color_treatment') {
    return {
      specialistId: 'color_treatment',
      runtime: {
        ...common,
        runtimeKind: 'reviewed_local_qwen25vl_mlx',
        studyGoalEvidenceId: input.studyGoals.colorTreatmentEvidenceId,
        manifestPath: input.qwen.manifestPath,
        modelPath: input.qwen.modelPath,
        pythonCommand: input.qwen.pythonCommand,
        ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
        ...(input.qwen.styleRunnerScriptPath
          ? { runnerScriptPath: input.qwen.styleRunnerScriptPath }
          : {}),
        ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      },
    }
  }
  if (input.request.specialistId === 'graphics_motion') {
    return {
      specialistId: 'graphics_motion',
      runtime: {
        ...common,
        runtimeKind: 'reviewed_local_qwen25vl_mlx',
        studyGoalEvidenceId: input.studyGoals.graphicsMotionEvidenceId,
        manifestPath: input.qwen.manifestPath,
        modelPath: input.qwen.modelPath,
        pythonCommand: input.qwen.pythonCommand,
        ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
        ...(input.qwen.styleRunnerScriptPath
          ? { runnerScriptPath: input.qwen.styleRunnerScriptPath }
          : {}),
        ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      },
    }
  }

  const evidenceAuthority = cloneStoryEvidenceAuthority(input.storyEvidenceAuthority)
  return {
    specialistId: 'story_editorial',
    runtime: {
      ...common,
      studyGoalEvidence: input.studyGoals.storyEditorialEvidence.map((item) => ({ ...item })),
      provider: createEditReferenceReviewedLocalQwen25VlMlxStoryEditorialProvider({
        manifestPath: input.qwen.manifestPath,
        modelPath: input.qwen.modelPath,
        pythonCommand: input.qwen.pythonCommand,
        ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
        ...(input.qwen.storyEditorialRunnerScriptPath
          ? { runnerScriptPath: input.qwen.storyEditorialRunnerScriptPath }
          : {}),
        ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      }),
      evidenceAuthorityResolver: async (resolverInput) => {
        validateStoryEvidenceResolverInput(input, resolverInput)
        return cloneStoryEvidenceAuthority(evidenceAuthority)
      },
    },
  }
}

function validateResolverBinding(
  input: ResolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntimeInput,
): void {
  const { request, evidence, stageInput } = input
  if (
    !SUPPORTED_SPECIALISTS.includes(request.specialistId as SupportedSpecialistId)
    || request.executionScope !== 'controlled_test'
    || stageInput.workItem.stageId !== 'semantic_chunk_synthesis'
    || request.runId !== stageInput.runId
    || request.planId !== stageInput.plan.planId
    || request.planDigestSha256 !== stageInput.plan.planDigestSha256
    || request.workItemId !== stageInput.workItem.workItemId
    || request.chunkId !== stageInput.workItem.chunkId
    || request.privateMediaArtifactId !== stageInput.plan.source.privateMediaArtifactId
    || request.mediaChecksumSha256 !== stageInput.plan.source.mediaChecksumSha256
    || request.sourceHasAudio !== stageInput.plan.source.hasAudio
    || request.semanticWindowId !== evidence.semanticWindowId
    || request.sourceStartSeconds !== evidence.sourceStartSeconds
    || request.sourceEndSeconds !== evidence.sourceEndSeconds
    || request.providerLocalStartSeconds !== 0
    || request.providerLocalEndSeconds !== evidence.durationSeconds
    || request.sourceTimeOffsetSeconds !== evidence.sourceTimeOffsetSeconds
    || (input.qwen.runValidation && input.qwen.runValidation.runId !== request.runId)
    || evidence.exactProviderLocalEvidencePrepared !== true
    || request.boundaries.rawReferenceMediaPersistenceAllowed
    || request.boundaries.rawProviderPayloadPersistenceAllowed
    || request.boundaries.rawTranscriptPersistenceAllowed
    || request.boundaries.recognizedOcrTextPersistenceAllowed
    || request.boundaries.externalUrlFetchAllowed
    || request.boundaries.customerPriceCalculationAllowed
    || request.boundaries.customerCreditMutationAllowed
    || request.boundaries.serviceFeeCalculationAllowed
    || !request.boundaries.originalMustRemainImmutable
    || !request.boundaries.targetAdaptationRequired
  ) throw new Error('Reviewed local long-form visual/style/story runtime binding is incomplete or exceeds controlled authority.')

  for (const value of [
    input.qwen.manifestPath,
    input.qwen.modelPath,
    input.qwen.pythonCommand,
  ]) {
    if (!value.trim()) throw new Error('Reviewed local Qwen runtime configuration is incomplete.')
  }
  for (const evidenceId of [
    input.studyGoals.visualLanguageEvidenceId,
    input.studyGoals.colorTreatmentEvidenceId,
    input.studyGoals.graphicsMotionEvidenceId,
  ]) assertSafeEvidenceId(evidenceId)
  assertSafeEvidenceItems(input.studyGoals.storyEditorialEvidence, 'Story/Editorial study goal')
  // Visual, Color, and Graphics run before Speech/Pacing in the durable
  // dispatcher. Story evidence therefore becomes mandatory only at the point
  // where Story/Editorial can actually consume its completed prerequisites.
  // Requiring future Story authority while resolving an earlier visual
  // specialist would create an artificial ordering cycle for audio-bearing
  // sources.
  if (request.specialistId === 'story_editorial') validateStoryEvidenceAuthority(input)

  if (request.specialistId === 'story_editorial') {
    const visual = request.prerequisiteSemanticResults.find((result) => result.specialistId === 'visual_language')
    const speech = request.prerequisiteSemanticResults.find((result) => result.specialistId === 'speech_pacing')
    if (
      !visual
      || visual.status !== 'completed'
      || visual.resultState !== 'analyzed'
      || visual.runtimeSource !== 'verified_local'
      || visual.execution.providerCallMade
      || visual.execution.externalUrlFetched
      || (request.sourceHasAudio && (
        !speech
        || speech.status !== 'completed'
        || speech.resultState !== 'analyzed'
      ))
    ) throw new Error('Reviewed local Story/Editorial lacks exact durable prerequisite authority.')
  }
}

function validateStoryEvidenceAuthority(
  input: ResolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntimeInput,
): void {
  const authority = input.storyEvidenceAuthority
  if (typeof authority.sourceClaimsPresent !== 'boolean') {
    throw new Error('Reviewed local Story/Editorial claim-presence authority must be explicit.')
  }
  assertSafeEvidenceItems(authority.transcriptEvidence, 'Story/Editorial transcript evidence', true)
  assertSafeEvidenceItems(authority.speechTimingEvidence, 'Story/Editorial speech-timing evidence', true)
  assertSafeEvidenceItems(authority.factSafetyEvidence, 'Story/Editorial fact-safety evidence', true)
  const allIds = [
    ...input.studyGoals.storyEditorialEvidence,
    ...authority.transcriptEvidence,
    ...authority.speechTimingEvidence,
    ...authority.factSafetyEvidence,
  ].map((item) => item.evidenceId)
  if (new Set(allIds).size !== allIds.length) {
    throw new Error('Reviewed local Story/Editorial evidence identifiers must be unique.')
  }
  if (input.request.sourceHasAudio) {
    if (authority.transcriptEvidence.length < 1 || authority.speechTimingEvidence.length < 1) {
      throw new Error('Audio-bearing Story/Editorial study requires canonical transcript-semantic and speech-timing evidence.')
    }
  } else if (authority.transcriptEvidence.length > 0 || authority.speechTimingEvidence.length > 0) {
    throw new Error('Audio-absent Story/Editorial study cannot claim transcript or speech-timing evidence.')
  }
  if (authority.sourceClaimsPresent && authority.factSafetyEvidence.length < 1) {
    throw new Error('Claim-bearing Story/Editorial study requires reviewed fact-safety evidence.')
  }
}

function validateStoryEvidenceResolverInput(
  input: ResolveEditReferenceReviewedLocalLongFormVisualStyleStoryRuntimeInput,
  resolverInput: EditReferenceStoryEditorialEvidenceAuthorityResolverInput,
): void {
  if (
    resolverInput.workspaceId !== input.stageInput.plan.workspaceId
    || resolverInput.editReferenceId !== input.stageInput.plan.editReferenceId
    || resolverInput.studySessionId !== input.stageInput.plan.studySessionId
    || resolverInput.privateMediaArtifactId !== input.request.privateMediaArtifactId
    || resolverInput.mediaChecksumSha256 !== input.request.mediaChecksumSha256
    || resolverInput.sourceEvidenceId !== `semantic-window:${input.request.semanticWindowId}`
    || resolverInput.audioPresence !== (input.request.sourceHasAudio ? 'present' : 'absent')
  ) throw new Error('Reviewed local Story/Editorial evidence authority changed after semantic-window binding.')
}

function assertSafeEvidenceItems(
  items: readonly EditReferenceStoryEditorialAuthorityEvidenceItem[],
  label: string,
  allowEmpty = false,
): void {
  if ((!allowEmpty && items.length < 1) || items.length > 64) {
    throw new Error(`${label} is missing or outside its bounded size.`)
  }
  for (const item of items) {
    assertSafeEvidenceId(item.evidenceId)
    const summary = item.summary.trim()
    if (
      summary.length < 8
      || summary.length > MAX_EVIDENCE_SUMMARY_CHARACTERS
      || containsUnsafeControlCharacters(summary)
      || /(?:https?:\/\/|file:\/\/|\/Volumes\/|\/Users\/|signed[-_ ]?url|api[-_ ]?key|authorization:|service[-_ ]?role)/i.test(summary)
      || !Number.isFinite(item.confidence)
      || item.confidence <= 0
      || item.confidence > 1
      || typeof item.requiresUserReview !== 'boolean'
    ) throw new Error(`${label} contains unsafe or invalid structured evidence.`)
  }
  if (new Set(items.map((item) => item.evidenceId)).size !== items.length) {
    throw new Error(`${label} identifiers must be unique.`)
  }
}

function assertSafeEvidenceId(value: string): void {
  if (!SAFE_EVIDENCE_ID_PATTERN.test(value)) {
    throw new Error('Reviewed local long-form evidence identifier is invalid.')
  }
}

function containsUnsafeControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 && ![9, 10, 13].includes(code)
  })
}

function cloneStoryEvidenceAuthority(
  value: EditReferenceStoryEditorialEvidenceAuthority,
): EditReferenceStoryEditorialEvidenceAuthority {
  return {
    sourceClaimsPresent: value.sourceClaimsPresent,
    transcriptEvidence: value.transcriptEvidence.map((item) => ({ ...item })),
    speechTimingEvidence: value.speechTimingEvidence.map((item) => ({ ...item })),
    factSafetyEvidence: value.factSafetyEvidence.map((item) => ({ ...item })),
  }
}
