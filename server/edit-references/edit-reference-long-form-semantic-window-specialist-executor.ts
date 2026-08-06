import { createHash } from 'node:crypto'
import type { RuntimeEnv } from '../config/env'
import {
  runBoundedAudioSoundDesignStudy,
  runBoundedCaptionDesignStudy,
  runBoundedColorTreatmentStudy,
  runBoundedGraphicsMotionStudy,
  runBoundedSpeechPacingStudy,
  runBoundedStoryEditorialStudy,
  runBoundedVisualLanguageStudy,
  type EditReferenceAudioSoundDesignRuntimeInput,
  type EditReferenceCaptionDesignRuntimeInput,
  type EditReferenceColorTreatmentRuntimeInput,
  type EditReferenceGraphicsMotionRuntimeInput,
  type EditReferenceSpeechPacingRuntimeInput,
  type EditReferenceStoryEditorialRuntimeInput,
  type EditReferenceVisualLanguageRuntimeInput,
  type EditReferenceCaptionDesignObservedAbsence,
} from './edit-reference-media-study'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import {
  withEditReferenceLongFormSemanticWindowEvidence,
  type EditReferenceLongFormSemanticWindowEvidenceBundle,
} from './edit-reference-long-form-semantic-window-evidence'
import type { EditReferenceLongFormSemanticWindowPlan } from './edit-reference-long-form-semantic-window-contract'
import { validateEditReferenceLongFormStudyUsage } from './edit-reference-long-form-study-usage-contract'
import {
  adaptEditReferenceLongFormSpecialistResult,
  type AdaptedEditReferenceLongFormSpecialistResult,
  type EditReferenceAnalyzedBoundedSpecialistResult,
} from './edit-reference-long-form-specialist-result-adapter'
import {
  EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import type {
  EditReferenceLongFormSemanticWindowSpecialistExecutor,
  EditReferenceLongFormSemanticWindowSpecialistRequest,
} from './edit-reference-long-form-semantic-window-dispatcher'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_SPECIALIST_EXECUTOR_VERSION =
  'edit-reference-long-form-semantic-window-specialist-executor-v2' as const
export const EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SKILL_ID =
  'edit_reference.speech_pacing.evidence' as const
export const EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SUMMARY =
  'No spoken speech was observed across the exact transcript-covered source section. ReEditPro records Speech/Pacing as absent for this interval instead of failing the study or inventing dialogue cadence.' as const

export type EditReferenceLongFormSemanticWindowResolvedRuntime =
  | { readonly specialistId: 'visual_language'; readonly runtime: EditReferenceVisualLanguageRuntimeInput }
  | { readonly specialistId: 'color_treatment'; readonly runtime: EditReferenceColorTreatmentRuntimeInput }
  | { readonly specialistId: 'graphics_motion'; readonly runtime: EditReferenceGraphicsMotionRuntimeInput }
  | { readonly specialistId: 'caption_design'; readonly runtime: EditReferenceCaptionDesignRuntimeInput }
  | { readonly specialistId: 'speech_pacing'; readonly runtime: EditReferenceSpeechPacingRuntimeInput }
  | { readonly specialistId: 'audio_sound_design'; readonly runtime: EditReferenceAudioSoundDesignRuntimeInput }
  | { readonly specialistId: 'story_editorial'; readonly runtime: EditReferenceStoryEditorialRuntimeInput }

export interface ResolveEditReferenceLongFormSemanticWindowRuntimeInput {
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  /** Runtime-only private evidence; paths cease to exist after this call. */
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
}

export type ResolveEditReferenceLongFormSemanticWindowRuntime = (
  input: ResolveEditReferenceLongFormSemanticWindowRuntimeInput,
) => Promise<EditReferenceLongFormSemanticWindowResolvedRuntime>

export interface CreateEditReferenceLongFormSemanticWindowSpecialistExecutorInput {
  readonly env: RuntimeEnv
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly resolveRuntime: ResolveEditReferenceLongFormSemanticWindowRuntime
}

/**
 * Reuses the seven reviewed bounded specialist helpers without widening any
 * provider input. Each call prepares one exact <=120 second window, invokes
 * only the requested specialist, and removes every runtime-only derivative
 * before returning a checkpointable provider-neutral result.
 *
 * This deliberately favors restart-safe cleanup over an in-memory cross-call
 * cache. Durable checkpoints can replay one specialist without relying on a
 * previous worker process or leaving private media resident between attempts.
 */
export function createEditReferenceLongFormSemanticWindowSpecialistExecutor(
  input: CreateEditReferenceLongFormSemanticWindowSpecialistExecutorInput,
): EditReferenceLongFormSemanticWindowSpecialistExecutor {
  return async (request) => {
    validateRequestBinding(input, request)
    const prepared = await withEditReferenceLongFormSemanticWindowEvidence({
      env: input.env,
      stageInput: input.stageInput,
      semanticWindowPlan: input.semanticWindowPlan,
      semanticWindowId: request.semanticWindowId,
    }, async (evidence) => {
      validatePreparedEvidenceBinding(request, evidence)
      const speechAbsence = adaptEditReferenceLongFormObservedSpeechAbsence({
        request,
        stageInput: input.stageInput,
        semanticWindowPlan: input.semanticWindowPlan,
      })
      if (speechAbsence) return speechAbsence
      const audioLowLevelAbsence = adaptEditReferenceLongFormObservedAudioLowLevelAbsence({
        request,
        evidence,
      })
      if (audioLowLevelAbsence) return audioLowLevelAbsence
      const resolvedRuntime = await input.resolveRuntime({ request, evidence })
      if (resolvedRuntime.specialistId !== request.specialistId) {
        throw new Error('Semantic-window runtime resolver returned a different specialist identity.')
      }
      assertRuntimeScope(request, resolvedRuntime)
      const adaptedResult = await executeBoundedSpecialist({
        request,
        evidence,
        resolvedRuntime,
        workspaceId: input.stageInput.plan.workspaceId,
        editReferenceId: input.stageInput.plan.editReferenceId,
        studySessionId: input.stageInput.plan.studySessionId,
      })
      return adaptedResult
    })

    return {
      semanticResult: prepared.value.semanticResult,
      evidenceOutputDigestsSha256: uniqueDigests([
        ...request.evidenceOutputDigestsSha256,
        prepared.receipt.evidenceDigestSha256,
        prepared.receipt.technicalEvidenceDigestSha256,
        prepared.value.boundedResultDigestSha256,
      ]),
      meteredInternalCostMicros: prepared.value.meteredInternalCostMicros,
      temporaryInputsCleaned: true,
    }
  }
}

async function executeBoundedSpecialist(input: {
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
  readonly resolvedRuntime: EditReferenceLongFormSemanticWindowResolvedRuntime
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
}): Promise<AdaptedEditReferenceLongFormSpecialistResult> {
  const evidence = input.evidence
  const common = {
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    privateMediaArtifactId: input.request.privateMediaArtifactId,
    mediaChecksumSha256: input.request.mediaChecksumSha256,
    sourceEvidenceId: `semantic-window:${input.request.semanticWindowId}`,
    sourceDurationSeconds: evidence.durationSeconds,
  }
  let outcome
  if (input.resolvedRuntime.specialistId === 'visual_language') {
    outcome = await runBoundedVisualLanguageStudy({
      runtime: input.resolvedRuntime.runtime,
      outputRoot: evidence.outputRoot,
      ...common,
      representativeFrames: evidence.representativeFrames,
      keyframes: evidence.keyframes,
      technicalCaptionRegions: evidence.technicalCaptionRegions,
      technicalColor: evidence.technicalColor,
      technicalMotion: evidence.technicalMotion,
      technicalSourceCondition: evidence.technicalSourceCondition,
      sceneBoundaries: evidence.sceneBoundaries,
    })
  } else if (input.resolvedRuntime.specialistId === 'color_treatment') {
    outcome = await runBoundedColorTreatmentStudy({
      runtime: input.resolvedRuntime.runtime,
      outputRoot: evidence.outputRoot,
      ...common,
      representativeFrames: evidence.representativeFrames,
      keyframes: evidence.keyframes,
      technicalColor: evidence.technicalColor,
    })
  } else if (input.resolvedRuntime.specialistId === 'graphics_motion') {
    outcome = await runBoundedGraphicsMotionStudy({
      runtime: input.resolvedRuntime.runtime,
      outputRoot: evidence.outputRoot,
      ...common,
      representativeFrames: evidence.representativeFrames,
      keyframes: evidence.keyframes,
      technicalMotion: evidence.technicalMotion,
      sceneBoundaries: evidence.sceneBoundaries,
    })
  } else if (input.resolvedRuntime.specialistId === 'caption_design') {
    outcome = await runBoundedCaptionDesignStudy({
      runtime: input.resolvedRuntime.runtime,
      outputRoot: evidence.outputRoot,
      ...common,
      representativeFrames: evidence.representativeFrames,
      keyframes: evidence.keyframes,
      technicalCaptionRegions: evidence.technicalCaptionRegions,
    })
    if (outcome.status === 'observed_absent' && outcome.observedAbsence) {
      return adaptObservedCaptionAbsence(outcome.observedAbsence)
    }
  } else if (input.resolvedRuntime.specialistId === 'speech_pacing') {
    outcome = await runBoundedSpeechPacingStudy({
      runtime: input.resolvedRuntime.runtime,
      ...common,
      privateAudioArtifact: evidence.privateAudioArtifact,
      technicalAudioLowLevel: evidence.technicalAudioLowLevel,
    })
  } else if (input.resolvedRuntime.specialistId === 'audio_sound_design') {
    outcome = await runBoundedAudioSoundDesignStudy({
      runtime: input.resolvedRuntime.runtime,
      outputRoot: evidence.outputRoot,
      ...common,
      privateAudioArtifact: evidence.privateAudioArtifact,
      sampleRate: evidence.sampleRate,
      channels: evidence.channels,
      technicalAudioLowLevel: evidence.technicalAudioLowLevel,
    })
  } else {
    const visualPrerequisite = input.request.prerequisiteSemanticResults.find((result) => (
      result.specialistId === 'visual_language'
    ))
    outcome = await runBoundedStoryEditorialStudy({
      runtime: input.resolvedRuntime.runtime,
      ...common,
      audioPresence: input.request.sourceHasAudio ? 'present' : 'absent',
      sceneBoundaries: evidence.sceneBoundaries,
      visualLanguageSemanticPrerequisite: visualPrerequisite,
    })
  }
  if (outcome.status !== 'analyzed' || !outcome.result || outcome.result.status !== 'analyzed') {
    throw new Error(
      `Semantic-window ${input.request.specialistId} did not produce analyzed authority: ${outcome.blockerCode ?? 'unknown_blocker'} (${outcome.blockerMessage ?? 'No bounded blocker detail was available.'}).`,
    )
  }
  return adaptEditReferenceLongFormSpecialistResult({
    specialistId: input.request.specialistId,
    executionScope: input.request.executionScope,
    result: outcome.result as EditReferenceAnalyzedBoundedSpecialistResult,
  })
}

export function adaptEditReferenceLongFormObservedSpeechAbsence(input: {
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
}): AdaptedEditReferenceLongFormSpecialistResult | undefined {
  if (input.request.specialistId !== 'speech_pacing') return undefined
  const output = input.stageInput.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'speech_transcript'
    && candidate.chunkId === input.request.chunkId
  ))
  if (!output || output.result.kind !== 'speech_transcript') return undefined
  const window = input.semanticWindowPlan.windows.find((candidate) => (
    candidate.semanticWindowId === input.request.semanticWindowId
  ))
  const wholeSectionAbsent = !output.result.speechPresent
  const exactWindowAbsent = (
    output.result.speechPresent
    && input.semanticWindowPlan.speechWindowAlignment === 'exact_segment_boundaries'
    && input.semanticWindowPlan.speechTranscriptOutputDigestSha256 === output.outputDigestSha256
    && window?.speechEvidenceState === 'speech_absent'
    && window.speechSegmentCount === 0
    && window.speechWordCount === 0
  )
  if (!wholeSectionAbsent && !exactWindowAbsent) return undefined
  validateEditReferenceLongFormStudyUsage(output.usage)
  if (
    output.result.fullCoreCoverage !== true
    || output.result.segmentTimingCoverageRatio !== 1
    || output.completionAuthority !== 'authoritative'
    || !['verified_local', 'verified_live'].includes(output.runtimeSource)
    || output.providerCallMade !== false
    || output.originalRemainsImmutable !== true
    || output.rawProcessOutputPersisted !== false
    || !input.request.evidenceOutputDigestsSha256.includes(output.outputDigestSha256)
    || !window
    || input.request.semanticWindowPlanDigestSha256 !== input.semanticWindowPlan.semanticWindowPlanDigestSha256
  ) throw new Error('Observed speech absence lacks exact authoritative transcript coverage.')
  if (wholeSectionAbsent && (
    output.result.segmentCount !== 0
    || output.result.wordCount !== 0
    || output.result.segmentTimingRanges.length !== 0
    || output.result.wordTimingMode !== 'not_available'
  )) throw new Error('Observed whole-section speech absence is contradictory.')
  if (exactWindowAbsent && (
    output.result.segmentCount < 1
    || output.result.wordCount < 1
    || output.result.segmentTimingRanges.length !== output.result.segmentCount
    || output.result.wordTimingMode !== 'exact'
  )) throw new Error('Observed silent-window authority lacks exact surrounding speech timing.')
  if (input.request.executionScope === 'production') {
    if (
      output.usage.mode !== 'production_metered'
      || output.usage.productionCostAuthoritySatisfied !== true
      || !output.usage.meteredInternalCostMicros
      || BigInt(output.usage.meteredInternalCostMicros) <= 0n
    ) throw new Error('Production speech-absence authority lacks attempt-level internal-cost evidence.')
  } else if (
    output.usage.mode === 'production_metered'
    || output.usage.usageEventIds.length > 0
    || output.usage.internalCostRecordIds.length > 0
  ) throw new Error('Controlled speech-absence authority cannot claim production cost evidence.')

  const absenceAuthority = {
    kind: 'speech_not_observed' as const,
    privateMediaArtifactId: input.request.privateMediaArtifactId,
    mediaChecksumSha256: input.request.mediaChecksumSha256,
    semanticWindowId: input.request.semanticWindowId,
    sourceStartSeconds: input.request.sourceStartSeconds,
    sourceEndSeconds: input.request.sourceEndSeconds,
    transcriptOutputDigestSha256: output.outputDigestSha256,
    privateTranscriptArtifactId: output.result.privateTranscriptArtifactId,
    fullCoreCoverage: true as const,
    segmentCount: window.speechSegmentCount ?? 0,
    wordCount: window.speechWordCount ?? 0,
    rawTranscriptPersistedInCheckpoint: false as const,
    originalRemainsImmutable: true as const,
  }
  const boundedResultDigestSha256 = sha256(stableJson(absenceAuthority))
  const semanticResult: EditReferenceSemanticStudyResult = {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId: 'speech_pacing',
    skillId: EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SKILL_ID,
    status: 'completed',
    resultState: 'analyzed',
    // The transcript can carry production authority, but the absence adapter
    // itself is deterministic local reasoning and does not make a live
    // provider/model call.
    runtimeSource: 'verified_local',
    readinessAtRun: 'verified_local',
    fallbackUsed: false,
    inputEvidenceIds: [`speech-absence-${output.outputDigestSha256.slice(0, 16)}-${window.semanticWindowId.slice(-8)}`],
    analysisArtifactIds: [output.result.privateTranscriptArtifactId],
    toolIds: [...output.toolIds],
    summary: EDIT_REFERENCE_TRANSCRIPT_PROVEN_SPEECH_ABSENCE_SUMMARY,
    confidence: 0.9,
    warnings: [
      'Speech absence applies to this exact section; music, ambience, and sound-design analysis remain separate.',
    ],
    blockedReasons: [],
    retryAvailable: false,
    usageEventIds: [],
    internalCostRecordIds: [],
    execution: {
      providerCallMade: false,
      modelCallMade: false,
      fileBytesRead: true,
      externalUrlFetched: false,
      mediaProcessingStarted: true,
      workerJobCreated: false,
    },
  }
  assertEditReferenceSemanticStudyResult(semanticResult)
  return {
    semanticResult,
    boundedResultDigestSha256,
    // Transcription was metered once by its own durable work item. Reusing its
    // timing authority to classify a silent semantic window has zero
    // incremental model/provider/infrastructure cost.
    meteredInternalCostMicros: '0',
    temporaryInputsCleaned: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

/**
 * Treats one exact, fully scanned, uninterrupted <= -50 dB window as source
 * audio absence without asking a semantic classifier to interpret silence.
 *
 * This is deliberately narrower than Audio/Sound Design inference. It cannot
 * establish music mood, tempo, SFX, ambience, breathing-room meaning,
 * ducking, or target audio requirements. Production execution also remains
 * fail-closed until the prepared technical scan has canonical attempt-level
 * infrastructure-cost authority.
 */
export function adaptEditReferenceLongFormObservedAudioLowLevelAbsence(input: {
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
}): AdaptedEditReferenceLongFormSpecialistResult | undefined {
  if (
    input.request.specialistId !== 'audio_sound_design'
    || input.request.sourceHasAudio !== true
  ) return undefined

  const audio = input.evidence.privateAudioArtifact
  const technical = input.evidence.technicalAudioLowLevel
  const interval = technical.intervals.length === 1 ? technical.intervals[0] : undefined
  const exactWindowToleranceSeconds = 0.02
  const exactUninterruptedLowLevelWindow = Boolean(
    interval
    && technical.status === 'verified_local_bounded'
    && technical.coverage === 'full'
    && technical.thresholdDb <= -50
    && technical.minimumDurationSeconds <= 0.5
    && technical.detectedIntervalCount === 1
    && technical.intervalsTruncated === false
    && Math.abs(technical.scannedDurationSeconds - input.evidence.durationSeconds) <= 0.01
    && interval.startSeconds <= exactWindowToleranceSeconds
    && interval.endSeconds >= technical.scannedDurationSeconds - exactWindowToleranceSeconds
    && interval.durationSeconds >= technical.scannedDurationSeconds - exactWindowToleranceSeconds
    && technical.totalLowLevelDurationSeconds >= technical.scannedDurationSeconds - exactWindowToleranceSeconds
    && technical.longestLowLevelDurationSeconds >= technical.scannedDurationSeconds - exactWindowToleranceSeconds
  )
  if (!exactUninterruptedLowLevelWindow) return undefined
  if (
    !audio
    || audio.artifactType !== 'extracted_audio'
    || audio.contentType !== 'audio/wav'
    || audio.sourceOfTruth !== true
    || audio.isPrivate !== true
    || !audio.localFilePath
    || !audio.sizeBytes
    || audio.sizeBytes <= 0
    || !audio.checksum
    || !/^[a-f0-9]{64}$/.test(audio.checksum)
    || input.evidence.exactProviderLocalEvidencePrepared !== true
    || input.evidence.originalRemainsImmutable !== true
    || input.evidence.rawProcessOutputPersisted !== false
    || input.evidence.signedUrlPersisted !== false
    || technical.semanticAudioAnalysisRan !== false
    || technical.speechPauseClassificationRan !== false
    || technical.musicOrSfxAnalysisRan !== false
    || technical.trimRecommendationRan !== false
    || technical.rawAudioPersisted !== false
    || technical.rawProcessOutputPersisted !== false
  ) throw new Error('Observed audio low-level absence lacks exact private technical authority.')
  if (input.request.executionScope === 'production') {
    throw new Error(
      'Production audio low-level absence lacks canonical attempt-level infrastructure-cost authority.',
    )
  }

  const absenceAuthority = {
    kind: 'audio_above_threshold_not_observed' as const,
    privateMediaArtifactId: input.request.privateMediaArtifactId,
    mediaChecksumSha256: input.request.mediaChecksumSha256,
    semanticWindowId: input.request.semanticWindowId,
    sourceStartSeconds: input.request.sourceStartSeconds,
    sourceEndSeconds: input.request.sourceEndSeconds,
    privateAudioArtifactId: audio.artifactId,
    privateAudioChecksumSha256: audio.checksum,
    thresholdDb: technical.thresholdDb,
    scannedDurationSeconds: technical.scannedDurationSeconds,
    uninterruptedLowLevelInterval: {
      startSeconds: interval?.startSeconds,
      endSeconds: interval?.endSeconds,
      durationSeconds: interval?.durationSeconds,
    },
    semanticAudioAnalysisRan: false as const,
    musicOrSfxAnalysisRan: false as const,
    rawAudioPersisted: false as const,
    rawProcessOutputPersisted: false as const,
    originalRemainsImmutable: true as const,
  }
  const boundedResultDigestSha256 = sha256(stableJson(absenceAuthority))
  const inputEvidenceId = `audio-low-level-absence-${boundedResultDigestSha256.slice(0, 24)}`
  const semanticResult: EditReferenceSemanticStudyResult = {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId: 'audio_sound_design',
    skillId: 'edit_reference.audio_sound_design.evidence',
    status: 'completed',
    resultState: 'analyzed',
    runtimeSource: 'verified_local',
    readinessAtRun: 'verified_local',
    fallbackUsed: false,
    inputEvidenceIds: [inputEvidenceId],
    analysisArtifactIds: [audio.artifactId],
    toolIds: ['ffmpeg'],
    summary: `No audio above the verified ${technical.thresholdDb} dB threshold was observed across the exact ${technical.scannedDurationSeconds.toFixed(2)}-second semantic window. ReEditPro preserves that measured source absence instead of sending silence to a semantic model or inventing music, SFX, ambience, tempo, or ducking guidance.`,
    confidence: 0.9,
    warnings: [
      'This is full-window amplitude evidence only; it does not classify sounds below the threshold, breathing-room meaning, or target-video audio requirements.',
    ],
    blockedReasons: [],
    retryAvailable: false,
    usageEventIds: [],
    internalCostRecordIds: [],
    execution: {
      providerCallMade: false,
      modelCallMade: false,
      fileBytesRead: true,
      externalUrlFetched: false,
      mediaProcessingStarted: true,
      workerJobCreated: false,
    },
  }
  assertEditReferenceSemanticStudyResult(semanticResult)
  return {
    semanticResult,
    boundedResultDigestSha256,
    // Exact-window FFmpeg preparation already produced this bounded technical
    // authority. The semantic absence adapter adds no model/provider call.
    meteredInternalCostMicros: '0',
    temporaryInputsCleaned: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function adaptObservedCaptionAbsence(
  absence: EditReferenceCaptionDesignObservedAbsence,
): AdaptedEditReferenceLongFormSpecialistResult {
  if (
    absence.kind !== 'caption_design_not_observed'
    || absence.captionOcrRegionCount !== 0
    || absence.fullRequestedFrameCoverage !== true
    || absence.requestedFrameCount < 1
    || absence.analyzedFrameCount !== absence.requestedFrameCount
    || absence.execution.fileBytesRead !== true
    || absence.execution.mediaProcessingStarted !== true
    || absence.execution.ocrEngineExecuted !== true
    || absence.execution.providerCallMade !== false
    || absence.semanticProviderCallMade !== false
    || absence.exactTextPersisted !== false
    || absence.rawOcrOutputPersisted !== false
  ) throw new Error('Observed caption absence lacks exact full-window OCR authority.')
  const boundedResultDigestSha256 = sha256(stableJson(absence))
  const semanticResult: EditReferenceSemanticStudyResult = {
    resultVersion: EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION,
    specialistId: 'caption_design',
    skillId: 'edit_reference.caption_design.evidence',
    status: 'completed',
    resultState: 'analyzed',
    runtimeSource: 'verified_local',
    readinessAtRun: 'verified_local',
    fallbackUsed: false,
    inputEvidenceIds: [...absence.inputEvidenceIds],
    analysisArtifactIds: [...absence.analysisArtifactIds],
    toolIds: [absence.provenance.adapterId],
    summary: `No visible caption or on-screen text system was observed in all ${absence.analyzedFrameCount} exact OCR-covered samples for this semantic window. ReEditPro preserves that absence instead of inventing a reference caption style.`,
    confidence: 0.9,
    warnings: [
      'Caption absence applies to the exact sampled semantic window; target caption requirements remain an independent editing decision.',
    ],
    blockedReasons: [],
    retryAvailable: false,
    usageEventIds: [...absence.usage.usageEventIds],
    internalCostRecordIds: [...absence.usage.internalCostRecordIds],
    execution: {
      providerCallMade: false,
      modelCallMade: false,
      fileBytesRead: true,
      externalUrlFetched: false,
      mediaProcessingStarted: true,
      workerJobCreated: absence.execution.workerJobCreated,
    },
  }
  assertEditReferenceSemanticStudyResult(semanticResult)
  return {
    semanticResult,
    boundedResultDigestSha256,
    meteredInternalCostMicros: absence.usage.meteredInternalCostMicros,
    temporaryInputsCleaned: true,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function validateRequestBinding(
  input: CreateEditReferenceLongFormSemanticWindowSpecialistExecutorInput,
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
): void {
  const window = input.semanticWindowPlan.windows.find((candidate) => (
    candidate.semanticWindowId === request.semanticWindowId
  ))
  if (
    !window
    || request.runId !== input.stageInput.runId
    || request.planId !== input.stageInput.plan.planId
    || request.planDigestSha256 !== input.stageInput.plan.planDigestSha256
    || request.workItemId !== input.stageInput.workItem.workItemId
    || request.chunkId !== input.stageInput.workItem.chunkId
    || request.privateMediaArtifactId !== input.stageInput.plan.source.privateMediaArtifactId
    || request.mediaChecksumSha256 !== input.stageInput.plan.source.mediaChecksumSha256
    || request.sourceHasAudio !== input.stageInput.plan.source.hasAudio
    || request.semanticWindowPlanDigestSha256 !== input.semanticWindowPlan.semanticWindowPlanDigestSha256
    || request.sourceStartSeconds !== window.coreStartSeconds
    || request.sourceEndSeconds !== window.coreEndSeconds
    || request.providerLocalStartSeconds !== 0
    || request.providerLocalEndSeconds !== window.durationSeconds
    || request.sourceTimeOffsetSeconds !== window.coreStartSeconds
    || !sameStrings(request.frameEvidenceIds, window.frames.map((frame) => frame.frameEvidenceId))
    || !sameStrings(request.frameChecksumsSha256, window.frames.map((frame) => frame.frameChecksumSha256))
  ) throw new Error('Semantic-window specialist request is not bound to the exact stage/window authority.')
}

function validatePreparedEvidenceBinding(
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
  evidence: EditReferenceLongFormSemanticWindowEvidenceBundle,
): void {
  const preparedFrames = [...evidence.keyframes, ...evidence.representativeFrames]
  if (
    evidence.semanticWindowId !== request.semanticWindowId
    || evidence.sourceStartSeconds !== request.sourceStartSeconds
    || evidence.sourceEndSeconds !== request.sourceEndSeconds
    || evidence.sourceTimeOffsetSeconds !== request.sourceTimeOffsetSeconds
    || evidence.providerLocalStartSeconds !== request.providerLocalStartSeconds
    || evidence.providerLocalEndSeconds !== request.providerLocalEndSeconds
    || !sameStringSets(preparedFrames.map((frame) => frame.artifactId), request.frameEvidenceIds)
    || !sameStringSets(evidence.frameChecksumsSha256, request.frameChecksumsSha256)
    || request.evidenceOutputDigestsSha256.some((digest) => !evidence.dependencyOutputDigestsSha256.includes(digest))
  ) throw new Error('Prepared semantic-window evidence does not match the exact specialist request.')
}

function assertRuntimeScope(
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
  resolved: EditReferenceLongFormSemanticWindowResolvedRuntime,
): void {
  const productionAuthority = 'productionAuthority' in resolved.runtime
    ? resolved.runtime.productionAuthority
    : undefined
  if (
    (request.executionScope === 'production') !== Boolean(productionAuthority)
    || !resolved.runtime.orchestrationId
    || resolved.runtime.studySessionId.length < 1
  ) throw new Error('Semantic-window specialist runtime does not match the requested execution scope.')
}

function uniqueDigests(values: readonly string[]): string[] {
  return [...new Set(values)]
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

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sameStringSets(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}
