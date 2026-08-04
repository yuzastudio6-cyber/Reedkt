import { createHash } from 'node:crypto'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticSpecialistId,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import type { EditReferenceLongFormSemanticSpecialistAuthority } from './edit-reference-long-form-semantic-chunk-stage'
import {
  validateEditReferenceLongFormSemanticWindowPlan,
  type EditReferenceLongFormSemanticWindow,
  type EditReferenceLongFormSemanticWindowPlan,
} from './edit-reference-long-form-semantic-window-contract'
import type {
  EditReferenceLongFormStudyPlan,
  EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_CHECKPOINT_VERSION =
  'edit-reference-long-form-semantic-window-checkpoint-v1' as const

export type EditReferenceLongFormSemanticWindowCheckpointScope =
  | 'controlled_test'
  | 'production'

export interface EditReferenceLongFormSemanticWindowCheckpointWindow {
  readonly semanticWindowId: string
  readonly ordinal: number
  readonly sourceStartSeconds: number
  readonly sourceEndSeconds: number
  readonly providerLocalStartSeconds: 0
  readonly providerLocalEndSeconds: number
  readonly sourceTimeOffsetSeconds: number
  readonly frameEvidenceIds: readonly string[]
  readonly frameChecksumsSha256: readonly string[]
}

export interface EditReferenceLongFormSemanticWindowCheckpointAttempt {
  readonly attemptNumber: number
  readonly submissionIdempotencyKeySha256: string
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly temporaryInputsCleaned: true
  readonly meteredInternalCostMicros: string
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceLongFormSemanticWindowCheckpoint {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_CHECKPOINT_VERSION
  readonly executionScope: EditReferenceLongFormSemanticWindowCheckpointScope
  readonly runId: string
  readonly planId: string
  readonly planDigestSha256: string
  readonly workItemId: string
  readonly chunkId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly semanticWindowPlanDigestSha256: string
  readonly window: EditReferenceLongFormSemanticWindowCheckpointWindow
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly status: 'analyzed' | 'not_applicable'
  readonly requestDigestSha256: string | null
  readonly semanticResult: EditReferenceSemanticStudyResult | null
  readonly semanticResultDigestSha256: string | null
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly attempt: EditReferenceLongFormSemanticWindowCheckpointAttempt | null
  readonly notApplicableRationale: string | null
  readonly originalRemainsImmutable: true
  readonly rawMediaPersisted: false
  readonly rawProviderPayloadPersisted: false
  readonly rawTranscriptPersisted: false
  readonly recognizedOcrTextPersisted: false
  readonly localFilePathPersisted: false
  readonly signedUrlPersisted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly createdAt: string
  readonly checkpointDigestSha256: string
}

export interface CreateEditReferenceLongFormSemanticWindowCheckpointInput {
  readonly executionScope: EditReferenceLongFormSemanticWindowCheckpointScope
  readonly runId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly window: EditReferenceLongFormSemanticWindow
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly requestDigestSha256?: string
  readonly semanticResult?: EditReferenceSemanticStudyResult
  readonly evidenceOutputDigestsSha256?: readonly string[]
  readonly attempt?: EditReferenceLongFormSemanticWindowCheckpointAttempt
  readonly notApplicableRationale?: string
  readonly createdAt: string
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const UNSAFE_PERSISTED_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function createEditReferenceLongFormSemanticWindowCheckpoint(
  input: CreateEditReferenceLongFormSemanticWindowCheckpointInput,
): EditReferenceLongFormSemanticWindowCheckpoint {
  assertWindowBinding(input.plan, input.workItem, input.semanticWindowPlan, input.window)
  const status = input.semanticResult ? 'analyzed' as const : 'not_applicable' as const
  const unsigned: Omit<EditReferenceLongFormSemanticWindowCheckpoint, 'checkpointDigestSha256'> = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_CHECKPOINT_VERSION,
    executionScope: input.executionScope,
    runId: input.runId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    workItemId: input.workItem.workItemId,
    chunkId: input.semanticWindowPlan.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    semanticWindowPlanDigestSha256: input.semanticWindowPlan.semanticWindowPlanDigestSha256,
    window: {
      semanticWindowId: input.window.semanticWindowId,
      ordinal: input.window.ordinal,
      sourceStartSeconds: input.window.coreStartSeconds,
      sourceEndSeconds: input.window.coreEndSeconds,
      providerLocalStartSeconds: 0,
      providerLocalEndSeconds: input.window.durationSeconds,
      sourceTimeOffsetSeconds: input.window.coreStartSeconds,
      frameEvidenceIds: input.window.frames.map((frame) => frame.frameEvidenceId),
      frameChecksumsSha256: input.window.frames.map((frame) => frame.frameChecksumSha256),
    },
    specialistId: input.specialistId,
    status,
    requestDigestSha256: input.requestDigestSha256 ?? null,
    semanticResult: input.semanticResult ? structuredClone(input.semanticResult) : null,
    semanticResultDigestSha256: input.semanticResult
      ? sha256(stableJson(input.semanticResult))
      : null,
    evidenceOutputDigestsSha256: [...(input.evidenceOutputDigestsSha256 ?? [])],
    attempt: input.attempt ? structuredClone(input.attempt) : null,
    notApplicableRationale: input.notApplicableRationale ?? null,
    originalRemainsImmutable: true,
    rawMediaPersisted: false,
    rawProviderPayloadPersisted: false,
    rawTranscriptPersisted: false,
    recognizedOcrTextPersisted: false,
    localFilePathPersisted: false,
    signedUrlPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    createdAt: input.createdAt,
  }
  const checkpoint = {
    ...unsigned,
    checkpointDigestSha256: sha256(stableJson(unsigned)),
  }
  validateEditReferenceLongFormSemanticWindowCheckpoint({
    checkpoint,
    plan: input.plan,
    workItem: input.workItem,
    semanticWindowPlan: input.semanticWindowPlan,
  })
  return checkpoint
}

export function validateEditReferenceLongFormSemanticWindowCheckpoint(input: {
  readonly checkpoint: EditReferenceLongFormSemanticWindowCheckpoint
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
}): void {
  const { checkpoint, plan, workItem, semanticWindowPlan } = input
  assertExactKeys(checkpoint, [
    'schemaVersion', 'executionScope', 'runId', 'planId', 'planDigestSha256', 'workItemId',
    'chunkId', 'privateMediaArtifactId', 'mediaChecksumSha256', 'semanticWindowPlanDigestSha256',
    'window', 'specialistId', 'status', 'requestDigestSha256', 'semanticResult',
    'semanticResultDigestSha256', 'evidenceOutputDigestsSha256', 'attempt',
    'notApplicableRationale', 'originalRemainsImmutable', 'rawMediaPersisted',
    'rawProviderPayloadPersisted', 'rawTranscriptPersisted', 'recognizedOcrTextPersisted',
    'localFilePathPersisted', 'signedUrlPersisted', 'customerPriceCalculated',
    'customerCreditsMutated', 'serviceFeeIncluded', 'createdAt', 'checkpointDigestSha256',
  ], 'semantic window checkpoint')
  if (
    checkpoint.schemaVersion !== EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_CHECKPOINT_VERSION
    || !['controlled_test', 'production'].includes(checkpoint.executionScope)
    || !ID_PATTERN.test(checkpoint.runId)
    || !ID_PATTERN.test(checkpoint.planId)
    || !ID_PATTERN.test(checkpoint.workItemId)
    || !ID_PATTERN.test(checkpoint.chunkId)
    || !ID_PATTERN.test(checkpoint.privateMediaArtifactId)
    || !SHA256_PATTERN.test(checkpoint.planDigestSha256)
    || !SHA256_PATTERN.test(checkpoint.mediaChecksumSha256)
    || !SHA256_PATTERN.test(checkpoint.semanticWindowPlanDigestSha256)
    || !SHA256_PATTERN.test(checkpoint.checkpointDigestSha256)
    || !EDIT_REFERENCE_SEMANTIC_SPECIALISTS.some((entry) => entry.specialistId === checkpoint.specialistId)
    || !['analyzed', 'not_applicable'].includes(checkpoint.status)
    || !validIso(checkpoint.createdAt)
  ) throw new Error('Long-form semantic-window checkpoint identity is invalid.')
  validateEditReferenceLongFormSemanticWindowPlan(semanticWindowPlan)
  const window = semanticWindowPlan.windows.find((candidate) => (
    candidate.semanticWindowId === checkpoint.window.semanticWindowId
  ))
  if (!window) throw new Error('Long-form semantic-window checkpoint references an unknown window.')
  assertWindowBinding(plan, workItem, semanticWindowPlan, window)
  validateWindow(checkpoint.window, window)
  if (
    checkpoint.planId !== plan.planId
    || checkpoint.planDigestSha256 !== plan.planDigestSha256
    || checkpoint.workItemId !== workItem.workItemId
    || checkpoint.chunkId !== semanticWindowPlan.chunkId
    || checkpoint.privateMediaArtifactId !== plan.source.privateMediaArtifactId
    || checkpoint.mediaChecksumSha256 !== plan.source.mediaChecksumSha256
    || checkpoint.semanticWindowPlanDigestSha256 !== semanticWindowPlan.semanticWindowPlanDigestSha256
  ) throw new Error('Long-form semantic-window checkpoint is not bound to the exact source, plan, and work item.')
  validateCheckpointState(checkpoint, plan, window)
  if (
    checkpoint.originalRemainsImmutable !== true
    || checkpoint.rawMediaPersisted !== false
    || checkpoint.rawProviderPayloadPersisted !== false
    || checkpoint.rawTranscriptPersisted !== false
    || checkpoint.recognizedOcrTextPersisted !== false
    || checkpoint.localFilePathPersisted !== false
    || checkpoint.signedUrlPersisted !== false
    || checkpoint.customerPriceCalculated !== false
    || checkpoint.customerCreditsMutated !== false
    || checkpoint.serviceFeeIncluded !== false
  ) throw new Error('Long-form semantic-window checkpoint crossed a privacy or cost boundary.')
  assertNoUnsafePersistedStrings(checkpoint)
  const unsigned = { ...checkpoint } as Record<string, unknown>
  delete unsigned.checkpointDigestSha256
  if (sha256(stableJson(unsigned)) !== checkpoint.checkpointDigestSha256) {
    throw new Error('Long-form semantic-window checkpoint digest does not match its exact content.')
  }
}

export function deriveEditReferenceLongFormSemanticWindowSubmissionKey(input: {
  readonly runId: string
  readonly workItemId: string
  readonly semanticWindowPlanDigestSha256: string
  readonly semanticWindowId: string
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly requestDigestSha256: string
  readonly attemptNumber: number
}): string {
  for (const value of [input.runId, input.workItemId, input.semanticWindowId]) {
    if (!ID_PATTERN.test(value)) throw new Error('Semantic-window submission identity is invalid.')
  }
  if (
    !SHA256_PATTERN.test(input.semanticWindowPlanDigestSha256)
    || !SHA256_PATTERN.test(input.requestDigestSha256)
    || !Number.isSafeInteger(input.attemptNumber)
    || input.attemptNumber < 1
    || input.attemptNumber > 8
  ) throw new Error('Semantic-window submission authority is invalid.')
  return `edit-reference-window-attempt:${sha256(stableJson(input))}`
}

export function aggregateEditReferenceLongFormSemanticWindowCheckpoints(input: {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
}): EditReferenceLongFormSemanticSpecialistAuthority {
  const ordered = [...input.checkpoints].sort((left, right) => left.window.ordinal - right.window.ordinal)
  if (
    ordered.length !== input.semanticWindowPlan.windows.length
    || new Set(ordered.map((checkpoint) => checkpoint.window.semanticWindowId)).size !== ordered.length
  ) throw new Error('Whole-section specialist aggregation requires one checkpoint for every semantic window.')
  for (const [index, checkpoint] of ordered.entries()) {
    validateEditReferenceLongFormSemanticWindowCheckpoint({
      checkpoint,
      plan: input.plan,
      workItem: input.workItem,
      semanticWindowPlan: input.semanticWindowPlan,
    })
    if (
      checkpoint.specialistId !== input.specialistId
      || checkpoint.window.semanticWindowId !== input.semanticWindowPlan.windows[index]?.semanticWindowId
    ) throw new Error('Whole-section specialist checkpoints are not ordered against the complete window plan.')
  }
  const notApplicable = ordered.filter((checkpoint) => checkpoint.status === 'not_applicable')
  if (notApplicable.length > 0) {
    if (
      notApplicable.length !== ordered.length
      || input.plan.source.hasAudio
      || !['speech_pacing', 'audio_sound_design'].includes(input.specialistId)
    ) throw new Error('Partial or invalid not-applicable specialist coverage cannot become section authority.')
    return {
      status: 'not_applicable',
      specialistId: input.specialistId as 'speech_pacing' | 'audio_sound_design',
      rationale: `The verified source has no audio stream, so ${input.specialistId} is not applicable across all ${ordered.length} semantic windows.`,
    }
  }
  const results = ordered.map((checkpoint) => checkpoint.semanticResult as EditReferenceSemanticStudyResult)
  const runtimeSources = unique(results.map((result) => result.runtimeSource))
  if (runtimeSources.length !== 1 || !['verified_local', 'verified_live'].includes(runtimeSources[0] ?? '')) {
    throw new Error('Whole-section specialist aggregation requires one consistent verified runtime source.')
  }
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((entry) => entry.specialistId === input.specialistId)
  if (!definition) throw new Error('Whole-section specialist identity is unavailable.')
  const providerIds = unique(results.flatMap((result) => result.providerId ? [result.providerId] : []))
  const modelIds = unique(results.flatMap((result) => result.modelId ? [result.modelId] : []))
  if (providerIds.length > 1 || modelIds.length > 1) {
    throw new Error('Whole-section specialist aggregation cannot hide mixed provider or model authority.')
  }
  const result: EditReferenceSemanticStudyResult = {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId: input.specialistId,
    skillId: definition.skillId,
    status: 'completed',
    resultState: 'analyzed',
    runtimeSource: runtimeSources[0] as 'verified_local' | 'verified_live',
    readinessAtRun: runtimeSources[0] as 'verified_local' | 'verified_live',
    fallbackUsed: false,
    inputEvidenceIds: unique(results.flatMap((entry) => entry.inputEvidenceIds)),
    analysisArtifactIds: unique(results.flatMap((entry) => entry.analysisArtifactIds)),
    toolIds: unique(results.flatMap((entry) => entry.toolIds)),
    summary: sectionSummary(input.specialistId, ordered, results),
    confidence: rounded(results.reduce((sum, entry) => sum + entry.confidence, 0) / results.length),
    warnings: unique(results.flatMap((entry) => entry.warnings)).slice(0, 32),
    blockedReasons: [],
    retryAvailable: false,
    ...(providerIds[0] ? { providerId: providerIds[0] } : {}),
    ...(modelIds[0] ? { modelId: modelIds[0] } : {}),
    usageEventIds: unique(results.flatMap((entry) => entry.usageEventIds ?? [])),
    internalCostRecordIds: unique(results.flatMap((entry) => entry.internalCostRecordIds ?? [])),
    execution: {
      providerCallMade: results.some((entry) => entry.execution.providerCallMade),
      modelCallMade: results.some((entry) => entry.execution.modelCallMade),
      fileBytesRead: results.some((entry) => entry.execution.fileBytesRead),
      externalUrlFetched: false,
      mediaProcessingStarted: results.some((entry) => entry.execution.mediaProcessingStarted),
      workerJobCreated: results.some((entry) => entry.execution.workerJobCreated),
    },
  }
  assertEditReferenceSemanticStudyResult(result)
  return {
    status: 'analyzed',
    result,
    evidenceOutputDigestsSha256: unique(ordered.flatMap((checkpoint) => (
      checkpoint.evidenceOutputDigestsSha256
    ))),
  }
}

function validateCheckpointState(
  checkpoint: EditReferenceLongFormSemanticWindowCheckpoint,
  plan: EditReferenceLongFormStudyPlan,
  window: EditReferenceLongFormSemanticWindow,
): void {
  assertUniqueHashes(checkpoint.evidenceOutputDigestsSha256, checkpoint.status === 'not_applicable')
  if (checkpoint.status === 'not_applicable') {
    if (
      plan.source.hasAudio
      || !['speech_pacing', 'audio_sound_design'].includes(checkpoint.specialistId)
      || checkpoint.requestDigestSha256 !== null
      || checkpoint.semanticResult !== null
      || checkpoint.semanticResultDigestSha256 !== null
      || checkpoint.attempt !== null
      || !checkpoint.notApplicableRationale
      || checkpoint.notApplicableRationale.length > 600
    ) throw new Error('Long-form semantic-window not-applicable checkpoint is invalid.')
    return
  }
  if (
    !checkpoint.requestDigestSha256
    || !SHA256_PATTERN.test(checkpoint.requestDigestSha256)
    || !checkpoint.semanticResult
    || !checkpoint.semanticResultDigestSha256
    || !checkpoint.attempt
    || checkpoint.notApplicableRationale !== null
  ) throw new Error('Analyzed semantic-window checkpoint lacks exact result and attempt authority.')
  assertEditReferenceSemanticStudyResult(checkpoint.semanticResult)
  if (
    checkpoint.semanticResult.specialistId !== checkpoint.specialistId
    || checkpoint.semanticResult.status !== 'completed'
    || checkpoint.semanticResult.resultState !== 'analyzed'
    || checkpoint.semanticResult.fallbackUsed
    || !['verified_local', 'verified_live'].includes(checkpoint.semanticResult.runtimeSource)
    || checkpoint.semanticResult.confidence <= 0
    || checkpoint.semanticResultDigestSha256 !== sha256(stableJson(checkpoint.semanticResult))
  ) throw new Error('Analyzed semantic-window result is not authoritative.')
  validateAttempt(checkpoint, window)
}

function validateAttempt(
  checkpoint: EditReferenceLongFormSemanticWindowCheckpoint,
  window: EditReferenceLongFormSemanticWindow,
): void {
  const attempt = checkpoint.attempt as EditReferenceLongFormSemanticWindowCheckpointAttempt
  assertExactKeys(attempt, [
    'attemptNumber', 'submissionIdempotencyKeySha256', 'runtimeSource', 'providerCallMade',
    'modelCallMade', 'workerJobCreated', 'temporaryInputsCleaned', 'meteredInternalCostMicros',
    'usageEventIds', 'internalCostRecordIds',
  ], 'semantic window checkpoint attempt')
  if (
    !Number.isSafeInteger(attempt.attemptNumber)
    || attempt.attemptNumber < 1
    || attempt.attemptNumber > 8
    || !SHA256_PATTERN.test(attempt.submissionIdempotencyKeySha256)
    || attempt.runtimeSource !== checkpoint.semanticResult?.runtimeSource
    || attempt.providerCallMade !== checkpoint.semanticResult.execution.providerCallMade
    || attempt.modelCallMade !== checkpoint.semanticResult.execution.modelCallMade
    || attempt.workerJobCreated !== checkpoint.semanticResult.execution.workerJobCreated
    || attempt.temporaryInputsCleaned !== true
    || !MONEY_MICROS_PATTERN.test(attempt.meteredInternalCostMicros)
    || stableJson(attempt.usageEventIds) !== stableJson(checkpoint.semanticResult.usageEventIds ?? [])
    || stableJson(attempt.internalCostRecordIds) !== stableJson(checkpoint.semanticResult.internalCostRecordIds ?? [])
  ) throw new Error('Semantic-window attempt authority does not match the analyzed result.')
  assertSafeIds(attempt.usageEventIds)
  assertSafeIds(attempt.internalCostRecordIds)
  const exactSilentSpeechWindow = (
    checkpoint.specialistId === 'speech_pacing'
    && window.speechEvidenceState === 'speech_absent'
    && window.speechSegmentCount === 0
    && window.speechWordCount === 0
    && checkpoint.semanticResult?.execution.providerCallMade === false
    && checkpoint.semanticResult.execution.modelCallMade === false
  )
  if (checkpoint.executionScope === 'controlled_test') {
    if (
      attempt.meteredInternalCostMicros !== '0'
      || attempt.usageEventIds.length > 0
      || attempt.internalCostRecordIds.length > 0
    ) throw new Error('Controlled semantic-window checkpoint cannot claim production cost authority.')
  } else if (exactSilentSpeechWindow) {
    if (
      attempt.meteredInternalCostMicros !== '0'
      || attempt.usageEventIds.length > 0
      || attempt.internalCostRecordIds.length > 0
    ) throw new Error('Transcript-proven silent-window checkpoint must have zero incremental cost.')
  } else if (attempt.usageEventIds.length < 1 || attempt.internalCostRecordIds.length < 1) {
    throw new Error('Production semantic-window checkpoint lacks attempt-level internal-cost authority.')
  }
}

function validateWindow(
  value: EditReferenceLongFormSemanticWindowCheckpointWindow,
  expected: EditReferenceLongFormSemanticWindow,
): void {
  assertExactKeys(value, [
    'semanticWindowId', 'ordinal', 'sourceStartSeconds', 'sourceEndSeconds',
    'providerLocalStartSeconds', 'providerLocalEndSeconds', 'sourceTimeOffsetSeconds',
    'frameEvidenceIds', 'frameChecksumsSha256',
  ], 'semantic checkpoint window')
  if (
    value.semanticWindowId !== expected.semanticWindowId
    || value.ordinal !== expected.ordinal
    || value.sourceStartSeconds !== expected.coreStartSeconds
    || value.sourceEndSeconds !== expected.coreEndSeconds
    || value.providerLocalStartSeconds !== 0
    || value.providerLocalEndSeconds !== expected.durationSeconds
    || value.sourceTimeOffsetSeconds !== expected.coreStartSeconds
    || stableJson(value.frameEvidenceIds) !== stableJson(expected.frames.map((frame) => frame.frameEvidenceId))
    || stableJson(value.frameChecksumsSha256) !== stableJson(expected.frames.map((frame) => frame.frameChecksumSha256))
  ) throw new Error('Semantic-window checkpoint global/provider-local mapping is invalid.')
  assertSafeIds(value.frameEvidenceIds)
  assertFrameHashes(value.frameChecksumsSha256)
}

function assertWindowBinding(
  plan: EditReferenceLongFormStudyPlan,
  workItem: EditReferenceLongFormStudyWorkItem,
  semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan,
  window: EditReferenceLongFormSemanticWindow,
): void {
  validateEditReferenceLongFormSemanticWindowPlan(semanticWindowPlan)
  if (
    workItem.stageId !== 'semantic_chunk_synthesis'
    || !workItem.chunkId
    || workItem.chunkId !== semanticWindowPlan.chunkId
    || semanticWindowPlan.planId !== plan.planId
    || semanticWindowPlan.planDigestSha256 !== plan.planDigestSha256
    || !semanticWindowPlan.windows.some((candidate) => candidate.semanticWindowId === window.semanticWindowId)
    || workItem.sourceCoverageStartSeconds !== semanticWindowPlan.sourceCoverageStartSeconds
    || workItem.sourceCoverageEndSeconds !== semanticWindowPlan.sourceCoverageEndSeconds
  ) throw new Error('Semantic-window checkpoint requires the exact semantic work item and complete window plan.')
}

function sectionSummary(
  specialistId: EditReferenceSemanticSpecialistId,
  checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[],
  results: readonly EditReferenceSemanticStudyResult[],
): string {
  const windowSummaries = results.map((result, index) => (
    `Window ${checkpoints[index]?.window.ordinal}: ${boundedText(result.summary, 480)}`
  ))
  return boundedText(
    `Whole-section ${specialistId} study reconciled ${checkpoints.length} contiguous semantic-window checkpoints with no partial-window completion claim. ${windowSummaries.join(' ')}`,
    3_900,
  )
}

function assertExactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const orderedExpected = [...expected].sort()
  if (stableJson(actual) !== stableJson(orderedExpected)) throw new Error(`${label} fields are invalid.`)
}

function assertUniqueHashes(values: readonly string[], allowEmpty: boolean): void {
  if (
    (!allowEmpty && values.length < 1)
    || values.length > 64
    || new Set(values).size !== values.length
    || values.some((value) => !SHA256_PATTERN.test(value))
  ) throw new Error('Semantic-window evidence digests are invalid.')
}

function assertFrameHashes(values: readonly string[]): void {
  // Distinct sampled timestamps may contain identical pixels (for example, a
  // held title or static talking-head frame). Frame identity and temporal
  // uniqueness are already enforced by frameEvidenceId and sourceTimeSeconds;
  // content hashes must remain valid and bounded but need not be unique.
  if (
    values.length < 1
    || values.length > 64
    || values.some((value) => !SHA256_PATTERN.test(value))
  ) throw new Error('Semantic-window frame checksums are invalid.')
}

function assertSafeIds(values: readonly string[]): void {
  if (values.length > 128 || new Set(values).size !== values.length || values.some((value) => !ID_PATTERN.test(value))) {
    throw new Error('Semantic-window checkpoint ID list is invalid.')
  }
}

function assertNoUnsafePersistedStrings(value: unknown): void {
  if (typeof value === 'string') {
    if (UNSAFE_PERSISTED_STRING_PATTERN.test(value)) {
      throw new Error('Semantic-window checkpoint contains unsafe persisted content.')
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach(assertNoUnsafePersistedStrings)
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(assertNoUnsafePersistedStrings)
  }
}

function boundedText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, Math.max(1, maximum - 1)).trimEnd()}…`
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

function validIso(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
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
