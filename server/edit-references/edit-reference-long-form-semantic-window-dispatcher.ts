import { createHash } from 'node:crypto'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'
import {
  aggregateEditReferenceLongFormSemanticWindowCheckpoints,
  createEditReferenceLongFormSemanticWindowCheckpoint,
  deriveEditReferenceLongFormSemanticWindowSubmissionKey,
  type EditReferenceLongFormSemanticWindowCheckpoint,
  type EditReferenceLongFormSemanticWindowCheckpointScope,
} from './edit-reference-long-form-semantic-window-checkpoint'
import type { EditReferenceLongFormSemanticSpecialistAuthority } from './edit-reference-long-form-semantic-chunk-stage'
import {
  validateEditReferenceLongFormSemanticWindowPlan,
  type EditReferenceLongFormSemanticWindow,
  type EditReferenceLongFormSemanticWindowPlan,
} from './edit-reference-long-form-semantic-window-contract'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticSpecialistId,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import type {
  EditReferenceLongFormStudyPlan,
  EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'
import { PrivateEditReferenceLongFormStudyRepository } from './private-edit-reference-long-form-study-repository'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_DISPATCH_VERSION =
  'edit-reference-long-form-semantic-window-dispatch-v1' as const

/**
 * Story/Editorial runs last because it consumes generalized visual evidence and,
 * for an audio-bearing source, Speech/Pacing evidence. The remaining specialists
 * may later be parallelized by a durable worker scheduler without changing this
 * provider-neutral contract.
 */
export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER = [
  'visual_language',
  'color_treatment',
  'graphics_motion',
  'caption_design',
  'speech_pacing',
  'audio_sound_design',
  'story_editorial',
] as const satisfies readonly EditReferenceSemanticSpecialistId[]

export interface EditReferenceLongFormSemanticWindowSpecialistRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_DISPATCH_VERSION
  readonly executionScope: EditReferenceLongFormSemanticWindowCheckpointScope
  readonly runId: string
  readonly planId: string
  readonly planDigestSha256: string
  readonly workItemId: string
  readonly chunkId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceHasAudio: boolean
  readonly semanticWindowPlanDigestSha256: string
  readonly semanticWindowId: string
  readonly semanticWindowOrdinal: number
  readonly sourceStartSeconds: number
  readonly sourceEndSeconds: number
  readonly providerLocalStartSeconds: 0
  readonly providerLocalEndSeconds: number
  readonly sourceTimeOffsetSeconds: number
  readonly frameEvidenceIds: readonly string[]
  readonly frameChecksumsSha256: readonly string[]
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly skillId: string
  readonly prerequisiteSemanticResults: readonly EditReferenceSemanticStudyResult[]
  readonly prerequisiteSemanticResultDigestsSha256: readonly string[]
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly requestDigestSha256: string
  readonly attemptNumber: number
  readonly submissionIdempotencyKey: string
  readonly boundaries: {
    readonly rawReferenceMediaPersistenceAllowed: false
    readonly rawProviderPayloadPersistenceAllowed: false
    readonly rawTranscriptPersistenceAllowed: false
    readonly recognizedOcrTextPersistenceAllowed: false
    readonly externalUrlFetchAllowed: false
    readonly customerPriceCalculationAllowed: false
    readonly customerCreditMutationAllowed: false
    readonly serviceFeeCalculationAllowed: false
    readonly originalMustRemainImmutable: true
    readonly targetAdaptationRequired: true
  }
}

export interface EditReferenceLongFormSemanticWindowSpecialistExecutionResult {
  readonly semanticResult: EditReferenceSemanticStudyResult
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly meteredInternalCostMicros: string
  readonly temporaryInputsCleaned: true
}

export type EditReferenceLongFormSemanticWindowSpecialistExecutor = (
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
) => Promise<EditReferenceLongFormSemanticWindowSpecialistExecutionResult>

export interface EditReferenceLongFormSemanticWindowDispatchProgress {
  readonly totalCheckpointCount: number
  readonly completedCheckpointCount: number
  readonly recoveredCheckpointCount: number
  readonly executedCheckpointCount: number
  readonly notApplicableCheckpointCount: number
  readonly completedWindowCount: number
  readonly totalWindowCount: number
  readonly completedSpecialistWindowSeconds: number
  readonly totalSpecialistWindowSeconds: number
  readonly completedFraction: number
  readonly progressBasis: 'durably_completed_specialist_window_work_only'
}

export interface DispatchEditReferenceLongFormSemanticWindowsInput {
  readonly scope: EditReferenceRepositoryScope
  readonly repository: PrivateEditReferenceLongFormStudyRepository
  readonly executionScope: EditReferenceLongFormSemanticWindowCheckpointScope
  readonly runId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly executeSpecialist: EditReferenceLongFormSemanticWindowSpecialistExecutor
  readonly resolveAttemptNumber?: (
    request: Omit<EditReferenceLongFormSemanticWindowSpecialistRequest, 'attemptNumber' | 'submissionIdempotencyKey'>,
  ) => Promise<number>
  readonly onProgress?: (progress: EditReferenceLongFormSemanticWindowDispatchProgress) => Promise<void> | void
  readonly now?: () => string
}

export interface EditReferenceLongFormSemanticWindowDispatchResult {
  readonly checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
  readonly specialistAuthorities: readonly EditReferenceLongFormSemanticSpecialistAuthority[]
  readonly progress: EditReferenceLongFormSemanticWindowDispatchProgress
  readonly originalRemainsImmutable: true
  readonly partialCompletionClaimed: false
  readonly providerWindowLimitBecameWholeVideoLimit: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/

export async function dispatchEditReferenceLongFormSemanticWindows(
  input: DispatchEditReferenceLongFormSemanticWindowsInput,
): Promise<EditReferenceLongFormSemanticWindowDispatchResult> {
  validateDispatchInput(input)
  const checkpointByKey = new Map<string, EditReferenceLongFormSemanticWindowCheckpoint>()
  let recoveredCheckpointCount = 0
  let executedCheckpointCount = 0

  for (const window of input.semanticWindowPlan.windows) {
    for (const specialistId of EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER) {
      const key = checkpointKey(window.semanticWindowId, specialistId)
      const existing = await input.repository.readSemanticWindowCheckpoint({
        scope: input.scope,
        runId: input.runId,
        workItemId: input.workItem.workItemId,
        semanticWindowId: window.semanticWindowId,
        specialistId,
        semanticWindowPlan: input.semanticWindowPlan,
      })
      if (existing) {
        validateRecoveredRequestBinding({ input, window, specialistId, existing, checkpointByKey })
        checkpointByKey.set(key, existing)
        recoveredCheckpointCount += 1
        await notifyProgress(input, checkpointByKey, recoveredCheckpointCount, executedCheckpointCount)
        continue
      }

      if (!input.plan.source.hasAudio && isAudioOnlySpecialist(specialistId)) {
        const checkpoint = createEditReferenceLongFormSemanticWindowCheckpoint({
          executionScope: input.executionScope,
          runId: input.runId,
          plan: input.plan,
          workItem: input.workItem,
          semanticWindowPlan: input.semanticWindowPlan,
          window,
          specialistId,
          notApplicableRationale: 'The verified source has no audio stream.',
          createdAt: currentIso(input.now),
        })
        const written = await input.repository.writeSemanticWindowCheckpoint({
          scope: input.scope,
          checkpoint,
          semanticWindowPlan: input.semanticWindowPlan,
        })
        checkpointByKey.set(key, written.checkpoint)
        executedCheckpointCount += 1
        await notifyProgress(input, checkpointByKey, recoveredCheckpointCount, executedCheckpointCount)
        continue
      }

      const prerequisites = prerequisiteCheckpoints({
        plan: input.plan,
        window,
        specialistId,
        checkpointByKey,
      })
      const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((candidate) => (
        candidate.specialistId === specialistId
      ))
      if (!definition) throw new Error('Long-form semantic specialist definition is unavailable.')
      const requestWithoutAttempt = createRequestWithoutAttempt({
        input,
        window,
        specialistId,
        skillId: definition.skillId,
        prerequisites,
      })
      const attemptNumber = input.resolveAttemptNumber
        ? await input.resolveAttemptNumber(requestWithoutAttempt)
        : 1
      if (input.executionScope === 'production' && !input.resolveAttemptNumber) {
        throw new Error('Production semantic-window dispatch requires durable attempt-number authority.')
      }
      if (!Number.isSafeInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 8) {
        throw new Error('Semantic-window specialist attempt number is invalid.')
      }
      const submissionIdempotencyKey = deriveEditReferenceLongFormSemanticWindowSubmissionKey({
        runId: input.runId,
        workItemId: input.workItem.workItemId,
        semanticWindowPlanDigestSha256: input.semanticWindowPlan.semanticWindowPlanDigestSha256,
        semanticWindowId: window.semanticWindowId,
        specialistId,
        requestDigestSha256: requestWithoutAttempt.requestDigestSha256,
        attemptNumber,
      })
      const request: EditReferenceLongFormSemanticWindowSpecialistRequest = {
        ...requestWithoutAttempt,
        attemptNumber,
        submissionIdempotencyKey,
      }
      const execution = await input.executeSpecialist(request)
      validateSpecialistExecution({ input, request, execution })
      const checkpoint = createEditReferenceLongFormSemanticWindowCheckpoint({
        executionScope: input.executionScope,
        runId: input.runId,
        plan: input.plan,
        workItem: input.workItem,
        semanticWindowPlan: input.semanticWindowPlan,
        window,
        specialistId,
        requestDigestSha256: request.requestDigestSha256,
        semanticResult: execution.semanticResult,
        evidenceOutputDigestsSha256: execution.evidenceOutputDigestsSha256,
        attempt: {
          attemptNumber,
          submissionIdempotencyKeySha256: sha256(submissionIdempotencyKey),
          runtimeSource: execution.semanticResult.runtimeSource as 'verified_local' | 'verified_live',
          providerCallMade: execution.semanticResult.execution.providerCallMade,
          modelCallMade: execution.semanticResult.execution.modelCallMade,
          workerJobCreated: execution.semanticResult.execution.workerJobCreated,
          temporaryInputsCleaned: execution.temporaryInputsCleaned,
          meteredInternalCostMicros: execution.meteredInternalCostMicros,
          usageEventIds: [...(execution.semanticResult.usageEventIds ?? [])],
          internalCostRecordIds: [...(execution.semanticResult.internalCostRecordIds ?? [])],
        },
        createdAt: currentIso(input.now),
      })
      const written = await input.repository.writeSemanticWindowCheckpoint({
        scope: input.scope,
        checkpoint,
        semanticWindowPlan: input.semanticWindowPlan,
      })
      checkpointByKey.set(key, written.checkpoint)
      executedCheckpointCount += 1
      await notifyProgress(input, checkpointByKey, recoveredCheckpointCount, executedCheckpointCount)
    }
  }

  const checkpoints = orderedCheckpoints(input.semanticWindowPlan, checkpointByKey)
  const specialistAuthorities = EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.map((specialistId) => (
    aggregateEditReferenceLongFormSemanticWindowCheckpoints({
      plan: input.plan,
      workItem: input.workItem,
      semanticWindowPlan: input.semanticWindowPlan,
      specialistId,
      checkpoints: checkpoints.filter((checkpoint) => checkpoint.specialistId === specialistId),
    })
  ))
  const progress = progressSnapshot(
    input.semanticWindowPlan,
    checkpointByKey,
    recoveredCheckpointCount,
    executedCheckpointCount,
  )
  if (progress.completedFraction !== 1 || progress.completedWindowCount !== progress.totalWindowCount) {
    throw new Error('Long-form semantic dispatch cannot claim partial specialist coverage as complete.')
  }
  return {
    checkpoints,
    specialistAuthorities,
    progress,
    originalRemainsImmutable: true,
    partialCompletionClaimed: false,
    providerWindowLimitBecameWholeVideoLimit: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
  }
}

function createRequestWithoutAttempt(input: {
  readonly input: DispatchEditReferenceLongFormSemanticWindowsInput
  readonly window: EditReferenceLongFormSemanticWindow
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly skillId: string
  readonly prerequisites: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
}): Omit<EditReferenceLongFormSemanticWindowSpecialistRequest, 'attemptNumber' | 'submissionIdempotencyKey'> {
  const prerequisiteSemanticResults = input.prerequisites.map((checkpoint) => (
    checkpoint.semanticResult as EditReferenceSemanticStudyResult
  ))
  const prerequisiteSemanticResultDigestsSha256 = input.prerequisites.map((checkpoint) => (
    checkpoint.semanticResultDigestSha256 as string
  ))
  const requestIdentity = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_DISPATCH_VERSION,
    executionScope: input.input.executionScope,
    runId: input.input.runId,
    planId: input.input.plan.planId,
    planDigestSha256: input.input.plan.planDigestSha256,
    workItemId: input.input.workItem.workItemId,
    chunkId: input.input.semanticWindowPlan.chunkId,
    privateMediaArtifactId: input.input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.input.plan.source.mediaChecksumSha256,
    sourceHasAudio: input.input.plan.source.hasAudio,
    semanticWindowPlanDigestSha256: input.input.semanticWindowPlan.semanticWindowPlanDigestSha256,
    semanticWindowId: input.window.semanticWindowId,
    semanticWindowOrdinal: input.window.ordinal,
    sourceStartSeconds: input.window.coreStartSeconds,
    sourceEndSeconds: input.window.coreEndSeconds,
    providerLocalStartSeconds: 0 as const,
    providerLocalEndSeconds: input.window.durationSeconds,
    sourceTimeOffsetSeconds: input.window.coreStartSeconds,
    frameEvidenceIds: input.window.frames.map((frame) => frame.frameEvidenceId),
    frameChecksumsSha256: input.window.frames.map((frame) => frame.frameChecksumSha256),
    specialistId: input.specialistId,
    skillId: input.skillId,
    prerequisiteSemanticResultDigestsSha256,
    evidenceOutputDigestsSha256: [...input.input.evidenceOutputDigestsSha256],
    boundaries: dispatchBoundaries(),
  }
  return {
    ...requestIdentity,
    prerequisiteSemanticResults: prerequisiteSemanticResults.map((result) => structuredClone(result)),
    requestDigestSha256: sha256(stableJson(requestIdentity)),
  }
}

function validateRecoveredRequestBinding(input: {
  readonly input: DispatchEditReferenceLongFormSemanticWindowsInput
  readonly window: EditReferenceLongFormSemanticWindow
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly existing: EditReferenceLongFormSemanticWindowCheckpoint
  readonly checkpointByKey: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>
}): void {
  if (input.existing.status === 'not_applicable') {
    if (input.input.plan.source.hasAudio || !isAudioOnlySpecialist(input.specialistId)) {
      throw new Error('Recovered semantic-window not-applicable checkpoint no longer matches source authority.')
    }
    return
  }
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((candidate) => (
    candidate.specialistId === input.specialistId
  ))
  if (!definition) throw new Error('Recovered semantic-window specialist definition is unavailable.')
  const prerequisites = prerequisiteCheckpoints({
    plan: input.input.plan,
    window: input.window,
    specialistId: input.specialistId,
    checkpointByKey: input.checkpointByKey,
  })
  const expected = createRequestWithoutAttempt({
    input: input.input,
    window: input.window,
    specialistId: input.specialistId,
    skillId: definition.skillId,
    prerequisites,
  })
  if (input.existing.requestDigestSha256 !== expected.requestDigestSha256) {
    throw new Error('Recovered semantic-window checkpoint does not match the exact current request authority.')
  }
}

function prerequisiteCheckpoints(input: {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly window: EditReferenceLongFormSemanticWindow
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly checkpointByKey: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>
}): EditReferenceLongFormSemanticWindowCheckpoint[] {
  const required: EditReferenceSemanticSpecialistId[] = input.specialistId === 'story_editorial'
    ? input.plan.source.hasAudio
      ? ['visual_language', 'speech_pacing']
      : ['visual_language']
    : []
  return required.map((specialistId) => {
    const checkpoint = input.checkpointByKey.get(checkpointKey(input.window.semanticWindowId, specialistId))
    if (!checkpoint || checkpoint.status !== 'analyzed' || !checkpoint.semanticResultDigestSha256) {
      throw new Error(`Long-form ${input.specialistId} dispatch lacks ${specialistId} window authority.`)
    }
    return checkpoint
  })
}

function validateSpecialistExecution(input: {
  readonly input: DispatchEditReferenceLongFormSemanticWindowsInput
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly execution: EditReferenceLongFormSemanticWindowSpecialistExecutionResult
}): void {
  assertEditReferenceSemanticStudyResult(input.execution.semanticResult)
  const result = input.execution.semanticResult
  if (
    result.specialistId !== input.request.specialistId
    || result.skillId !== input.request.skillId
    || result.status !== 'completed'
    || result.resultState !== 'analyzed'
    || result.fallbackUsed
    || !['verified_local', 'verified_live'].includes(result.runtimeSource)
    || result.confidence <= 0
    || input.execution.temporaryInputsCleaned !== true
    || !MONEY_MICROS_PATTERN.test(input.execution.meteredInternalCostMicros)
  ) throw new Error('Semantic-window specialist execution did not return authoritative analyzed evidence.')
  const evidence = [...input.execution.evidenceOutputDigestsSha256]
  if (
    evidence.length < input.input.evidenceOutputDigestsSha256.length
    || new Set(evidence).size !== evidence.length
    || evidence.some((digest) => !SHA256_PATTERN.test(digest))
    || input.input.evidenceOutputDigestsSha256.some((digest) => !evidence.includes(digest))
  ) throw new Error('Semantic-window specialist result lost required evidence-output authority.')
  const usageIds = result.usageEventIds ?? []
  const costIds = result.internalCostRecordIds ?? []
  const window = input.input.semanticWindowPlan.windows.find((candidate) => (
    candidate.semanticWindowId === input.request.semanticWindowId
  ))
  const exactSilentSpeechWindow = (
    input.request.specialistId === 'speech_pacing'
    && window?.speechEvidenceState === 'speech_absent'
    && window.speechSegmentCount === 0
    && window.speechWordCount === 0
    && input.input.semanticWindowPlan.speechTranscriptOutputDigestSha256 !== null
    && input.request.evidenceOutputDigestsSha256.includes(
      input.input.semanticWindowPlan.speechTranscriptOutputDigestSha256,
    )
    && result.execution.providerCallMade === false
    && result.execution.modelCallMade === false
  )
  if (input.input.executionScope === 'controlled_test') {
    if (input.execution.meteredInternalCostMicros !== '0' || usageIds.length > 0 || costIds.length > 0) {
      throw new Error('Controlled semantic-window specialist execution cannot claim production cost authority.')
    }
  } else if (exactSilentSpeechWindow) {
    if (input.execution.meteredInternalCostMicros !== '0' || usageIds.length > 0 || costIds.length > 0) {
      throw new Error('Transcript-proven silent-window reuse must have zero incremental production cost.')
    }
  } else if (usageIds.length < 1 || costIds.length < 1) {
    throw new Error('Production semantic-window specialist execution lacks attempt-level cost authority.')
  }
}

function validateDispatchInput(input: DispatchEditReferenceLongFormSemanticWindowsInput): void {
  validateEditReferenceLongFormSemanticWindowPlan(input.semanticWindowPlan)
  if (
    input.workItem.stageId !== 'semantic_chunk_synthesis'
    || input.workItem.chunkId !== input.semanticWindowPlan.chunkId
    || input.runId.length < 1
    || input.semanticWindowPlan.planId !== input.plan.planId
    || input.semanticWindowPlan.planDigestSha256 !== input.plan.planDigestSha256
    || input.workItem.sourceCoverageStartSeconds !== input.semanticWindowPlan.sourceCoverageStartSeconds
    || input.workItem.sourceCoverageEndSeconds !== input.semanticWindowPlan.sourceCoverageEndSeconds
    || input.evidenceOutputDigestsSha256.length < 2
    || new Set(input.evidenceOutputDigestsSha256).size !== input.evidenceOutputDigestsSha256.length
    || input.evidenceOutputDigestsSha256.some((digest) => !SHA256_PATTERN.test(digest))
    || !input.evidenceOutputDigestsSha256.includes(input.semanticWindowPlan.visualSamplingOutputDigestSha256)
    || !input.evidenceOutputDigestsSha256.includes(input.semanticWindowPlan.sceneBoundaryOutputDigestSha256)
    || (input.semanticWindowPlan.speechTranscriptOutputDigestSha256 !== null
      && !input.evidenceOutputDigestsSha256.includes(
        input.semanticWindowPlan.speechTranscriptOutputDigestSha256,
      ))
  ) throw new Error('Long-form semantic-window dispatch lacks exact plan, work-item, or evidence authority.')
  if (
    EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.length !== EDIT_REFERENCE_SEMANTIC_SPECIALISTS.length
    || new Set(EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER).size !== EDIT_REFERENCE_SEMANTIC_SPECIALISTS.length
  ) throw new Error('Long-form semantic-window dispatch specialist coverage is incomplete.')
}

async function notifyProgress(
  input: DispatchEditReferenceLongFormSemanticWindowsInput,
  checkpoints: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>,
  recoveredCheckpointCount: number,
  executedCheckpointCount: number,
): Promise<void> {
  if (!input.onProgress) return
  await input.onProgress(progressSnapshot(
    input.semanticWindowPlan,
    checkpoints,
    recoveredCheckpointCount,
    executedCheckpointCount,
  ))
}

function progressSnapshot(
  semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan,
  checkpoints: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>,
  recoveredCheckpointCount: number,
  executedCheckpointCount: number,
): EditReferenceLongFormSemanticWindowDispatchProgress {
  const totalCheckpointCount = semanticWindowPlan.windows.length
    * EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.length
  const totalSpecialistWindowSeconds = semanticWindowPlan.windows.reduce((sum, window) => (
    sum + window.durationSeconds * EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.length
  ), 0)
  const completedSpecialistWindowSeconds = [...checkpoints.values()].reduce((sum, checkpoint) => (
    sum + (checkpoint.window.sourceEndSeconds - checkpoint.window.sourceStartSeconds)
  ), 0)
  const completedWindowCount = semanticWindowPlan.windows.filter((window) => (
    EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.every((specialistId) => (
      checkpoints.has(checkpointKey(window.semanticWindowId, specialistId))
    ))
  )).length
  const completedCheckpointCount = checkpoints.size
  return {
    totalCheckpointCount,
    completedCheckpointCount,
    recoveredCheckpointCount,
    executedCheckpointCount,
    notApplicableCheckpointCount: [...checkpoints.values()].filter((checkpoint) => (
      checkpoint.status === 'not_applicable'
    )).length,
    completedWindowCount,
    totalWindowCount: semanticWindowPlan.windows.length,
    completedSpecialistWindowSeconds: rounded(completedSpecialistWindowSeconds),
    totalSpecialistWindowSeconds: rounded(totalSpecialistWindowSeconds),
    completedFraction: totalCheckpointCount === 0
      ? 0
      : rounded(completedCheckpointCount / totalCheckpointCount),
    progressBasis: 'durably_completed_specialist_window_work_only',
  }
}

function orderedCheckpoints(
  semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan,
  checkpointByKey: ReadonlyMap<string, EditReferenceLongFormSemanticWindowCheckpoint>,
): EditReferenceLongFormSemanticWindowCheckpoint[] {
  return semanticWindowPlan.windows.flatMap((window) => (
    EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_ORDER.map((specialistId) => {
      const checkpoint = checkpointByKey.get(checkpointKey(window.semanticWindowId, specialistId))
      if (!checkpoint) throw new Error('Long-form semantic-window dispatch is missing a durable checkpoint.')
      return checkpoint
    })
  ))
}

function dispatchBoundaries(): EditReferenceLongFormSemanticWindowSpecialistRequest['boundaries'] {
  return {
    rawReferenceMediaPersistenceAllowed: false,
    rawProviderPayloadPersistenceAllowed: false,
    rawTranscriptPersistenceAllowed: false,
    recognizedOcrTextPersistenceAllowed: false,
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
    serviceFeeCalculationAllowed: false,
    originalMustRemainImmutable: true,
    targetAdaptationRequired: true,
  }
}

function checkpointKey(
  semanticWindowId: string,
  specialistId: EditReferenceSemanticSpecialistId,
): string {
  return `${semanticWindowId}:${specialistId}`
}

function isAudioOnlySpecialist(
  specialistId: EditReferenceSemanticSpecialistId,
): specialistId is 'speech_pacing' | 'audio_sound_design' {
  return specialistId === 'speech_pacing' || specialistId === 'audio_sound_design'
}

function currentIso(now: DispatchEditReferenceLongFormSemanticWindowsInput['now']): string {
  const value = now?.() ?? new Date().toISOString()
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error('Semantic-window dispatch timestamp authority is invalid.')
  }
  return value
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}
