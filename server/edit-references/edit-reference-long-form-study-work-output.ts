import { createHash } from 'node:crypto'
import path from 'node:path'
import type {
  PreferenceTechnicalColorSignalEvidence,
  PreferenceTechnicalMotionSignalEvidence,
} from '../../src/types/edit-reference'
import {
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyWorkItem,
  type EditReferenceLongFormStudyStageId,
  validateEditReferenceLongFormStudyPlan,
} from './edit-reference-long-form-study-contract'
import {
  EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS,
  validateEditReferenceLongFormSpecialistStageResult,
  type EditReferenceLongFormSpecialistStageResult,
} from './edit-reference-long-form-specialist-stage-contract'
import {
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'

export const EDIT_REFERENCE_LONG_FORM_STUDY_WORK_OUTPUT_VERSION =
  'edit-reference-long-form-study-work-output-v5' as const

export type EditReferenceLongFormStudyToolId =
  | 'ffmpeg'
  | 'ffprobe'
  | 'faster_whisper'
  | 'paddleocr'
  | 'tesseract'
  | 'qwen_3_7'
  | 'deterministic_reconciler'
  | 'deterministic_coverage_qa'
  | 'controlled_specialist_fixture'

export interface EditReferenceLongFormStudyOutputArtifact {
  readonly role: 'analysis_proxy' | 'study_audio' | 'visual_sample' | 'private_transcript'
  readonly storageObjectPath: string
  readonly contentType: 'video/mp4' | 'audio/wav' | 'image/jpeg' | 'application/json'
  readonly sizeBytes: number
  readonly checksumSha256: string
  readonly sourceTimeSeconds?: number
}

export interface EditReferenceLongFormAnalysisProxyResult {
  readonly kind: 'analysis_proxy'
  readonly durationSeconds: number
  readonly width: number
  readonly height: number
  readonly frameRate: number
  readonly videoCodec: string
  readonly pixelFormat: string
  readonly maxWidth: 1280
  readonly maxHeight: 1280
  readonly maxFrameRate: 30
  readonly constantRateFactor: 28
  readonly audioIncluded: false
  readonly decodeOverlapUsed: true
}

export interface EditReferenceLongFormAudioExtractResult {
  readonly kind: 'audio_extract'
  readonly durationSeconds: number
  readonly sampleRate: 16000
  readonly channels: 1
  readonly codec: 'pcm_s16le'
  readonly decodeOverlapUsed: true
}

export interface EditReferenceLongFormSceneBoundaryResult {
  readonly kind: 'scene_boundary_scan'
  readonly threshold: number
  readonly boundaryTimesSeconds: readonly number[]
  readonly boundaryCount: number
  readonly technicalCandidatesOnly: true
  readonly semanticSceneAnalysisRan: false
  readonly fullCoreCoverage: true
}

export interface EditReferenceLongFormVisualSamplingResult {
  readonly kind: 'visual_sampling'
  readonly sampleTimesSeconds: readonly number[]
  readonly sampleCount: number
  readonly minimumSampleCountSatisfied: true
  readonly adaptiveSceneSamplingRequiredForSemanticPass: true
  readonly semanticVisualAnalysisRan: false
  readonly fullCoreCoverage: true
}

export interface EditReferenceLongFormColorMotionResult {
  readonly kind: 'color_motion_signals'
  readonly color: PreferenceTechnicalColorSignalEvidence
  readonly motion: PreferenceTechnicalMotionSignalEvidence
  readonly technicalSignalsOnly: true
  readonly semanticColorAnalysisRan: false
  readonly semanticMotionAnalysisRan: false
  readonly fullCoreCoverage: true
}

export type EditReferenceLongFormStudyWorkResult =
  | EditReferenceLongFormAnalysisProxyResult
  | EditReferenceLongFormAudioExtractResult
  | EditReferenceLongFormSceneBoundaryResult
  | EditReferenceLongFormVisualSamplingResult
  | EditReferenceLongFormColorMotionResult
  | EditReferenceLongFormSpecialistStageResult

export interface EditReferenceLongFormStudyWorkOutput {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_WORK_OUTPUT_VERSION
  readonly runId: string
  readonly planId: string
  readonly planDigestSha256: string
  readonly workItemId: string
  readonly stageId: EditReferenceLongFormStudyWorkResult['kind']
  readonly chunkId: string | null
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
  readonly toolIds: readonly EditReferenceLongFormStudyToolId[]
  readonly artifacts: readonly EditReferenceLongFormStudyOutputArtifact[]
  readonly result: EditReferenceLongFormStudyWorkResult
  readonly runtimeSource: 'verified_local' | 'verified_live' | 'verified_mock'
  readonly completionAuthority: 'authoritative' | 'controlled_mock'
  readonly usage: EditReferenceLongFormStudyUsageEvidence
  readonly originalRemainsImmutable: true
  readonly rawProcessOutputPersisted: false
  readonly signedUrlPersisted: false
  readonly localFilePathPersisted: false
  readonly providerCallMade: boolean
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly remoteMutationMade: false
  readonly createdAt: string
  readonly outputDigestSha256: string
}

export function createEditReferenceLongFormStudyWorkOutput(input: Omit<
  EditReferenceLongFormStudyWorkOutput,
  'schemaVersion' | 'outputDigestSha256'
>): EditReferenceLongFormStudyWorkOutput {
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_WORK_OUTPUT_VERSION,
    ...input,
  }
  const output = {
    ...unsigned,
    outputDigestSha256: sha256(stableStringify(unsigned)),
  }
  validateEditReferenceLongFormStudyWorkOutput(output)
  return output
}

export function validateEditReferenceLongFormStudyWorkOutput(
  output: EditReferenceLongFormStudyWorkOutput,
): void {
  if (output?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_WORK_OUTPUT_VERSION) {
    throw new Error('Long-form work output version is invalid.')
  }
  for (const [label, value] of [
    ['run id', output.runId],
    ['plan id', output.planId],
    ['work item id', output.workItemId],
    ['private media artifact id', output.privateMediaArtifactId],
  ] as const) assertId(value, label)
  if (output.chunkId !== null) assertId(output.chunkId, 'chunk id')
  for (const [label, value] of [
    ['plan digest', output.planDigestSha256],
    ['media checksum', output.mediaChecksumSha256],
    ['output digest', output.outputDigestSha256],
  ] as const) assertSha256(value, label)
  assertIso(output.createdAt, 'long-form work output createdAt')
  if (
    !Number.isFinite(output.sourceCoverageStartSeconds)
    || output.sourceCoverageStartSeconds < 0
    || !Number.isFinite(output.sourceCoverageEndSeconds)
    || output.sourceCoverageEndSeconds <= output.sourceCoverageStartSeconds
    || output.stageId !== output.result.kind
    || output.toolIds.length < 1
    || new Set(output.toolIds).size !== output.toolIds.length
    || output.toolIds.some((toolId) => ![
      'ffmpeg',
      'ffprobe',
      'faster_whisper',
      'paddleocr',
      'tesseract',
      'qwen_3_7',
      'deterministic_reconciler',
      'deterministic_coverage_qa',
      'controlled_specialist_fixture',
    ].includes(toolId))
    || !['verified_local', 'verified_live', 'verified_mock'].includes(output.runtimeSource)
    || !['authoritative', 'controlled_mock'].includes(output.completionAuthority)
    || (output.runtimeSource === 'verified_mock' && output.completionAuthority !== 'controlled_mock')
  ) throw new Error('Long-form work output identity, coverage, or usage is invalid.')
  validateEditReferenceLongFormStudyUsage(output.usage)
  if (
    output.originalRemainsImmutable !== true
    || output.rawProcessOutputPersisted !== false
    || output.signedUrlPersisted !== false
    || output.localFilePathPersisted !== false
    || output.customerPriceCalculated !== false
    || output.customerCreditsMutated !== false
    || output.remoteMutationMade !== false
  ) throw new Error('Long-form work output safety boundary is invalid.')
  if (
    output.result.kind === 'semantic_chunk_synthesis'
      ? output.providerCallMade !== (output.runtimeSource === 'verified_live')
      : output.providerCallMade !== false
  ) throw new Error('Long-form work output provider-call provenance is invalid.')
  if (output.toolIds.includes('controlled_specialist_fixture') !== (output.runtimeSource === 'verified_mock')) {
    throw new Error('Long-form controlled specialist fixture attribution is invalid.')
  }
  for (const artifact of output.artifacts) validateArtifact(artifact)
  if (output.usage.outputBytes !== output.artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0)) {
    throw new Error('Long-form work output byte accounting does not match its artifacts.')
  }
  if (output.usage.inputMediaSeconds !== Number((
    output.sourceCoverageEndSeconds - output.sourceCoverageStartSeconds
  ).toFixed(3))) {
    throw new Error('Long-form work output usage duration does not match its exact source coverage.')
  }
  validateResult(output)
  const unsigned = { ...output } as Record<string, unknown>
  delete unsigned.outputDigestSha256
  if (sha256(stableStringify(unsigned)) !== output.outputDigestSha256) {
    throw new Error('Long-form work output digest does not match its exact content.')
  }
}

export function validateEditReferenceLongFormStudyWorkOutputAgainstPlan(input: {
  readonly output: EditReferenceLongFormStudyWorkOutput
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
}): void {
  validateEditReferenceLongFormStudyPlan(input.plan)
  validateEditReferenceLongFormStudyWorkOutput(input.output)
  const chunk = input.workItem.chunkId === null
    ? null
    : input.plan.chunks.find((candidate) => candidate.chunkId === input.workItem.chunkId)
  const expectedCoverageStartSeconds = chunk?.coreStartSeconds ?? 0
  const expectedCoverageEndSeconds = chunk?.coreEndSeconds ?? input.plan.source.durationSeconds
  if (
    (input.workItem.chunkId !== null && !chunk)
    || input.output.runId.length < 1
    || input.output.planId !== input.plan.planId
    || input.output.planDigestSha256 !== input.plan.planDigestSha256
    || input.output.workItemId !== input.workItem.workItemId
    || input.output.stageId !== input.workItem.stageId
    || input.output.chunkId !== input.workItem.chunkId
    || input.output.privateMediaArtifactId !== input.plan.source.privateMediaArtifactId
    || input.output.mediaChecksumSha256 !== input.plan.source.mediaChecksumSha256
    || input.output.sourceCoverageStartSeconds !== expectedCoverageStartSeconds
    || input.output.sourceCoverageEndSeconds !== expectedCoverageEndSeconds
  ) throw new Error('Long-form work output is not bound to the exact plan, source, chunk, and work item.')
  if (
    chunk
    &&
    input.output.stageId === 'visual_sampling'
    && input.output.result.kind === 'visual_sampling'
    && input.output.result.sampleCount < chunk.minimumVisualSampleCount
  ) throw new Error('Long-form visual sampling did not satisfy the chunk sample floor.')
  if (EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS.includes(input.output.stageId as typeof EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS[number])) {
    validateEditReferenceLongFormSpecialistStageResult({
      result: input.output.result as EditReferenceLongFormSpecialistStageResult,
      plan: input.plan,
      chunkId: input.output.chunkId,
      sourceCoverageStartSeconds: input.output.sourceCoverageStartSeconds,
      sourceCoverageEndSeconds: input.output.sourceCoverageEndSeconds,
    })
  }
}

function validateArtifact(artifact: EditReferenceLongFormStudyOutputArtifact): void {
  const expectedContentTypes: Record<EditReferenceLongFormStudyOutputArtifact['role'], EditReferenceLongFormStudyOutputArtifact['contentType']> = {
    analysis_proxy: 'video/mp4',
    study_audio: 'audio/wav',
    visual_sample: 'image/jpeg',
    private_transcript: 'application/json',
  }
  if (
    !['analysis_proxy', 'study_audio', 'visual_sample', 'private_transcript'].includes(artifact.role)
    || !['video/mp4', 'audio/wav', 'image/jpeg', 'application/json'].includes(artifact.contentType)
    || expectedContentTypes[artifact.role] !== artifact.contentType
    || !Number.isSafeInteger(artifact.sizeBytes)
    || artifact.sizeBytes <= 0
    || !isSafeRelativePath(artifact.storageObjectPath)
  ) throw new Error('Long-form work output artifact is invalid.')
  assertSha256(artifact.checksumSha256, 'artifact checksum')
  if ((artifact.role === 'visual_sample') !== (artifact.sourceTimeSeconds !== undefined)) {
    throw new Error('Long-form visual-sample timestamp authority is invalid.')
  }
  if (artifact.sourceTimeSeconds !== undefined && (
    !Number.isFinite(artifact.sourceTimeSeconds)
    || artifact.sourceTimeSeconds < 0
  )) throw new Error('Long-form visual sample time is invalid.')
}

function validateResult(output: EditReferenceLongFormStudyWorkOutput): void {
  const result = output.result
  const expectedTools = expectedToolIds(output)
  if (stableStringify(output.toolIds) !== stableStringify(expectedTools)) {
    throw new Error('Long-form work output tool attribution is invalid.')
  }
  if (result.kind === 'analysis_proxy') {
    if (
      result.durationSeconds <= 0
      || result.width < 1
      || result.height < 1
      || result.width > 1280
      || result.height > 1280
      || result.frameRate <= 0
      || result.frameRate > 30.01
      || result.maxWidth !== 1280
      || result.maxHeight !== 1280
      || result.maxFrameRate !== 30
      || result.constantRateFactor !== 28
      || result.audioIncluded !== false
      || result.decodeOverlapUsed !== true
      || output.artifacts.length !== 1
      || output.artifacts[0]?.role !== 'analysis_proxy'
    ) throw new Error('Long-form analysis proxy result is invalid.')
  } else if (result.kind === 'audio_extract') {
    if (
      result.durationSeconds <= 0
      || result.sampleRate !== 16000
      || result.channels !== 1
      || result.codec !== 'pcm_s16le'
      || result.decodeOverlapUsed !== true
      || output.artifacts.length !== 1
      || output.artifacts[0]?.role !== 'study_audio'
    ) throw new Error('Long-form study audio result is invalid.')
  } else if (result.kind === 'scene_boundary_scan') {
    if (
      result.boundaryCount !== result.boundaryTimesSeconds.length
      || result.boundaryTimesSeconds.some((value, index, values) => (
        !Number.isFinite(value)
        || value < output.sourceCoverageStartSeconds
        || value > output.sourceCoverageEndSeconds
        || (index > 0 && value <= (values[index - 1] ?? -1))
      ))
      || result.technicalCandidatesOnly !== true
      || result.semanticSceneAnalysisRan !== false
      || result.fullCoreCoverage !== true
      || output.artifacts.length !== 0
    ) throw new Error('Long-form scene-boundary result is invalid.')
  } else if (result.kind === 'visual_sampling') {
    if (
      result.sampleCount !== result.sampleTimesSeconds.length
      || result.sampleCount !== output.artifacts.length
      || result.sampleTimesSeconds.some((value) => (
        !Number.isFinite(value)
        || value < output.sourceCoverageStartSeconds
        || value > output.sourceCoverageEndSeconds
      ))
      || output.artifacts.some((artifact) => artifact.role !== 'visual_sample')
      || result.minimumSampleCountSatisfied !== true
      || result.adaptiveSceneSamplingRequiredForSemanticPass !== true
      || result.semanticVisualAnalysisRan !== false
      || result.fullCoreCoverage !== true
    ) throw new Error('Long-form visual-sampling result is invalid.')
  } else if (result.kind === 'color_motion_signals') {
    if (
      result.color.status !== 'verified_local_bounded'
      || result.color.coverage !== 'full'
      || result.motion.status !== 'verified_local_bounded'
      || result.motion.coverage !== 'full'
      || result.technicalSignalsOnly !== true
      || result.semanticColorAnalysisRan !== false
      || result.semanticMotionAnalysisRan !== false
      || result.fullCoreCoverage !== true
      || output.artifacts.length !== 0
    ) throw new Error('Long-form color/motion result is invalid.')
  } else if (result.kind === 'speech_transcript') {
    if (
      output.artifacts.length !== 1
      || output.artifacts[0]?.role !== 'private_transcript'
      || output.artifacts[0]?.contentType !== 'application/json'
      || output.artifacts[0]?.checksumSha256 !== result.transcriptArtifactChecksumSha256
    ) throw new Error('Long-form transcript artifact lineage is invalid.')
  } else if (result.kind === 'semantic_chunk_synthesis') {
    if (output.artifacts.length !== 0) {
      throw new Error('Long-form semantic synthesis cannot retain raw provider or media artifacts.')
    }
    if (output.runtimeSource === 'verified_mock') {
      if (
        output.completionAuthority !== 'controlled_mock'
        || output.usage.mode !== 'controlled_test_unmetered'
        || result.synthesisRuntime.runtimeSource !== 'verified_mock'
      ) throw new Error('Controlled long-form semantic synthesis has invalid mock authority.')
    } else if (
      output.runtimeSource !== 'verified_live'
      || output.completionAuthority !== 'authoritative'
      || output.usage.mode !== 'production_metered'
      || output.usage.productionCostAuthoritySatisfied !== true
      || result.synthesisRuntime.runtimeSource !== 'verified_live'
      || result.synthesisRuntime.providerCallMade !== true
      || result.synthesisRuntime.modelCallMade !== true
    ) {
      throw new Error('Live long-form semantic synthesis lacks exact provider and internal-cost authority.')
    }
  } else if (output.artifacts.length !== 0) {
    throw new Error('Long-form structured specialist output cannot retain raw derivative artifacts.')
  }
}

function expectedToolIds(output: EditReferenceLongFormStudyWorkOutput): readonly EditReferenceLongFormStudyToolId[] {
  const result = output.result
  if (result.kind === 'analysis_proxy' || result.kind === 'audio_extract') return ['ffmpeg', 'ffprobe']
  if (result.kind === 'scene_boundary_scan' || result.kind === 'visual_sampling') return ['ffmpeg']
  if (result.kind === 'color_motion_signals') return ['ffmpeg', 'ffprobe']
  if (result.kind === 'speech_transcript') {
    return output.runtimeSource === 'verified_mock' ? ['controlled_specialist_fixture'] : ['faster_whisper']
  }
  if (result.kind === 'caption_ocr') {
    return result.ocrToolId === 'controlled_specialist_fixture'
      ? ['controlled_specialist_fixture']
      : [result.ocrToolId]
  }
  if (result.kind === 'semantic_chunk_synthesis') {
    return output.runtimeSource === 'verified_live' ? ['qwen_3_7'] : ['controlled_specialist_fixture']
  }
  if (result.kind === 'global_reconciliation') return ['deterministic_reconciler']
  return ['deterministic_coverage_qa']
}

function isSafeRelativePath(value: string): boolean {
  if (!value || value.includes('\0') || value.includes('\\') || value.startsWith('/') || /^https?:/i.test(value)) return false
  const normalized = path.posix.normalize(value)
  return normalized === value && normalized !== '.' && !normalized.startsWith('../') && !path.posix.isAbsolute(normalized)
}

function assertId(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertSha256(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`Long-form ${label} is invalid.`)
}

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} is invalid.`)
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

export function isEditReferenceLongFormTechnicalStage(
  stageId: EditReferenceLongFormStudyStageId,
): stageId is Extract<EditReferenceLongFormStudyWorkResult, {
  kind: 'analysis_proxy' | 'audio_extract' | 'scene_boundary_scan' | 'visual_sampling' | 'color_motion_signals'
}>['kind'] {
  return ['analysis_proxy', 'audio_extract', 'scene_boundary_scan', 'visual_sampling', 'color_motion_signals']
    .includes(stageId)
}
