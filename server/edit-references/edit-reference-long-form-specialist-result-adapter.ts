import { createHash } from 'node:crypto'
import type { EditReferenceAudioSoundDesignStudyResult } from './edit-reference-audio-sound-design-study-contract'
import type { EditReferenceCaptionDesignStudyResult } from './edit-reference-caption-design-study-contract'
import type { EditReferenceColorTreatmentStudyResult } from './edit-reference-color-treatment-study-contract'
import type { EditReferenceGraphicsMotionStudyResult } from './edit-reference-graphics-motion-study-contract'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticSpecialistId,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import type { EditReferenceSpeechPacingStudyResult } from './edit-reference-speech-pacing-study-contract'
import type { EditReferenceStoryEditorialStudyResult } from './edit-reference-story-editorial-study-contract'
import type { EditReferenceVisualLanguageStudyResult } from './edit-reference-visual-language-study-contract'

export const EDIT_REFERENCE_LONG_FORM_SPECIALIST_RESULT_ADAPTER_VERSION =
  'edit-reference-long-form-specialist-result-adapter-v1' as const

export type EditReferenceAnalyzedBoundedSpecialistResult =
  | Extract<EditReferenceVisualLanguageStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceColorTreatmentStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceGraphicsMotionStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceCaptionDesignStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceSpeechPacingStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceAudioSoundDesignStudyResult, { status: 'analyzed' }>
  | Extract<EditReferenceStoryEditorialStudyResult, { status: 'analyzed' }>

export interface AdaptEditReferenceLongFormSpecialistResultInput {
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly executionScope: 'controlled_test' | 'production'
  readonly result: EditReferenceAnalyzedBoundedSpecialistResult
}

export interface AdaptedEditReferenceLongFormSpecialistResult {
  readonly semanticResult: EditReferenceSemanticStudyResult
  readonly boundedResultDigestSha256: string
  readonly meteredInternalCostMicros: string
  readonly temporaryInputsCleaned: true
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

interface CommonFinding {
  readonly summary: string
  readonly confidence: number
}

interface CommonAnalyzer {
  readonly adapterId: string
  readonly providerId: string | null
  readonly modelId: string
}

interface CommonUsage {
  readonly mode: 'controlled_test_unmetered' | 'production_metered'
  readonly meteredInternalCostMicros: string
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

export function adaptEditReferenceLongFormSpecialistResult(
  input: AdaptEditReferenceLongFormSpecialistResultInput,
): AdaptedEditReferenceLongFormSpecialistResult {
  validateBoundedResult(input.specialistId, input.result)
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((candidate) => (
    candidate.specialistId === input.specialistId
  ))
  if (!definition) throw new Error('Long-form bounded specialist identity is unavailable.')
  const findings = input.result.findings as readonly CommonFinding[]
  const analyzer = analyzerFor(input.specialistId, input.result)
  const usage = input.result.usage as CommonUsage
  const execution = executionFor(input.specialistId, input.result)
  if (
    findings.length < 1
    || input.result.summary.averageConfidence <= 0
    || usage.customerPriceCalculated !== false
    || usage.customerCreditsMutated !== false
    || usage.serviceFeeIncluded !== false
  ) throw new Error('Bounded specialist result cannot become analyzed long-form authority.')
  if (input.executionScope === 'controlled_test') {
    if (
      usage.mode !== 'controlled_test_unmetered'
      || usage.meteredInternalCostMicros !== '0'
      || usage.usageEventIds.length > 0
      || usage.internalCostRecordIds.length > 0
    ) throw new Error('Controlled bounded specialist result cannot claim production cost authority.')
  } else if (
    usage.mode !== 'production_metered'
    || BigInt(usage.meteredInternalCostMicros) <= 0n
    || usage.usageEventIds.length < 1
    || usage.internalCostRecordIds.length < 1
    || input.result.runtimeSource !== 'verified_live'
  ) {
    throw new Error('Production bounded specialist result lacks live runtime and internal-cost authority.')
  }
  const live = input.result.runtimeSource === 'verified_live'
  if (
    (live && (!execution.providerCallMade || !execution.modelCallMade))
    || (!live && execution.providerCallMade)
  ) {
    throw new Error('Bounded specialist runtime and provider/model execution authority disagree.')
  }
  if (live && (!analyzer.providerId || !analyzer.modelId)) {
    throw new Error('Live bounded specialist result lacks provider/model provenance.')
  }
  if (!live && analyzer.providerId !== null) {
    throw new Error('Local bounded specialist result cannot claim a provider identity.')
  }
  const boundedResultDigestSha256 = sha256(stableJson(input.result))
  const evidenceId = `bounded-${input.specialistId}-${input.result.evidenceManifestDigestSha256.slice(0, 24)}`
  const summary = boundedSummary(input.specialistId, findings)
  const semanticResult: EditReferenceSemanticStudyResult = {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId: input.specialistId,
    skillId: definition.skillId,
    status: 'completed',
    resultState: 'analyzed',
    runtimeSource: input.result.runtimeSource,
    readinessAtRun: input.result.runtimeSource,
    fallbackUsed: false,
    inputEvidenceIds: [evidenceId],
    analysisArtifactIds: [input.result.privateMediaArtifactId],
    toolIds: [analyzer.adapterId],
    summary,
    confidence: rounded(input.result.summary.averageConfidence),
    warnings: input.result.coverage.missingEvidenceKinds
      .slice(0, 32)
      .map((kind) => boundedText(`Missing optional evidence: ${kind}`, 900)),
    blockedReasons: [],
    retryAvailable: false,
    ...(live ? {
      providerId: analyzer.providerId as string,
      modelId: analyzer.modelId,
    } : execution.modelCallMade ? {
      modelId: analyzer.modelId,
    } : {}),
    usageEventIds: [...usage.usageEventIds],
    internalCostRecordIds: [...usage.internalCostRecordIds],
    execution: {
      providerCallMade: execution.providerCallMade,
      modelCallMade: execution.modelCallMade,
      fileBytesRead: true,
      externalUrlFetched: false,
      mediaProcessingStarted: input.specialistId !== 'story_editorial',
      workerJobCreated: execution.workerJobCreated,
    },
  }
  assertEditReferenceSemanticStudyResult(semanticResult)
  return {
    semanticResult,
    boundedResultDigestSha256,
    meteredInternalCostMicros: usage.meteredInternalCostMicros,
    temporaryInputsCleaned: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function validateBoundedResult(
  specialistId: EditReferenceSemanticSpecialistId,
  result: EditReferenceAnalyzedBoundedSpecialistResult,
): void {
  const schemaPrefix = `edit-reference-${specialistId.replaceAll('_', '-')}`
  if (
    result.status !== 'analyzed'
    || typeof result.schemaVersion !== 'string'
    || !result.schemaVersion.startsWith(schemaPrefix)
    || !/^[a-f0-9]{64}$/.test(result.requestDigestSha256)
    || !/^[a-f0-9]{64}$/.test(result.evidenceManifestDigestSha256)
    || !result.privateMediaArtifactId
    || !/^[a-f0-9]{64}$/.test(result.mediaChecksumSha256)
  ) throw new Error('Bounded specialist result identity is invalid or mismatched.')
}

function analyzerFor(
  specialistId: EditReferenceSemanticSpecialistId,
  result: EditReferenceAnalyzedBoundedSpecialistResult,
): CommonAnalyzer {
  if (specialistId === 'visual_language' || specialistId === 'story_editorial') {
    return (result as Extract<
      EditReferenceVisualLanguageStudyResult | EditReferenceStoryEditorialStudyResult,
      { status: 'analyzed' }
    >).model
  }
  return (result as Extract<
    EditReferenceColorTreatmentStudyResult
      | EditReferenceGraphicsMotionStudyResult
      | EditReferenceCaptionDesignStudyResult
      | EditReferenceSpeechPacingStudyResult
      | EditReferenceAudioSoundDesignStudyResult,
    { status: 'analyzed' }
  >).analyzer
}

function executionFor(
  specialistId: EditReferenceSemanticSpecialistId,
  result: EditReferenceAnalyzedBoundedSpecialistResult,
): { readonly providerCallMade: boolean; readonly modelCallMade: boolean; readonly workerJobCreated: boolean } {
  void specialistId
  return result.execution
}

function boundedSummary(
  specialistId: EditReferenceSemanticSpecialistId,
  findings: readonly CommonFinding[],
): string {
  return boundedText(
    `${specialistLabel(specialistId)} window study produced ${findings.length} generalized, evidence-grounded observation${findings.length === 1 ? '' : 's'} for target adaptation. ${findings.map((finding) => finding.summary).join(' ')}`,
    3_900,
  )
}

function specialistLabel(specialistId: EditReferenceSemanticSpecialistId): string {
  return specialistId.split('_').map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(' ')
}

function boundedText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, Math.max(1, maximum - 1)).trimEnd()}…`
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
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
