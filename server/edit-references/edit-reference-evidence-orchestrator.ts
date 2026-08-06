import { randomUUID } from 'node:crypto'
import type {
  EditReferenceStudyGoal,
  EditReferenceStudyLifecycleStatus,
  PreferenceEvidenceCategory,
  PreferenceEvidenceRecord,
  PreferenceEvidenceStatus,
  PreferenceSemanticRuntimeProvenance,
  PreferenceSkillRuntimeAttemptProvenance,
  PreferenceSkillRunRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import type {
  EditReferenceLongFormStudyReviewSelection,
  EditReferenceLongFormStudySelectionReceipt,
} from '../../src/types/edit-reference-long-form-review'
import {
  detectEditReferenceCopyRisks,
  hasEditReferenceNegationNear,
  type EditReferenceCopyRiskKind,
} from './edit-reference-copy-safety'
import type { EditReferenceLocalMediaStudyResult } from './edit-reference-media-study'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION,
} from './edit-reference-semantic-study-contract'
import type { EditReferenceVisualLanguageFindingCategory } from './edit-reference-visual-language-study-contract'
import type { EditReferenceColorTreatmentFindingCategory } from './edit-reference-color-treatment-study-contract'
import type { EditReferenceGraphicsMotionFindingCategory } from './edit-reference-graphics-motion-study-contract'
import type { EditReferenceCaptionDesignFindingCategory } from './edit-reference-caption-design-study-contract'
import type { EditReferenceStoryEditorialFindingCategory } from './edit-reference-story-editorial-study-contract'
import type { EditReferenceSpeechPacingFindingCategory } from './edit-reference-speech-pacing-study-contract'
import type { EditReferenceAudioSoundDesignFindingCategory } from './edit-reference-audio-sound-design-study-contract'
import type {
  EditReferencePreviousApprovedEditEvidenceSummary,
  EditReferencePreviousApprovedEditStudyResult,
} from './edit-reference-previous-approved-edit-study-contract'
import { EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID } from './edit-reference-previous-approved-edit-adapter'
import { materializeEditReferenceLongFormStudySelection } from './edit-reference-long-form-review-package'

interface OrchestrationInput {
  orchestrationId?: string
  workspaceId: string
  editReferenceId: string
  study: PreferenceStudySessionRecord
  evidence: PreferenceEvidenceRecord[]
  mediaStudies?: EditReferenceLocalMediaStudyResult[]
  previousApprovedEditStudies?: readonly {
    sourceEvidenceId: string
    result: EditReferencePreviousApprovedEditStudyResult
  }[]
  longFormStudyReviewSelections?: readonly EditReferenceLongFormStudyReviewSelection[]
  now: string
}

export interface PreferenceEvidenceStudyOrchestrationResult {
  orchestrationId: string
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  studyStatus: Extract<EditReferenceStudyLifecycleStatus, 'evidence_ready' | 'needs_clarification' | 'needs_user_review'>
  evidenceStatus: PreferenceEvidenceStatus
  uncoveredGoals: EditReferenceStudyGoal[]
  copyRiskKinds: EditReferenceCopyRiskKind[]
  conflictKinds: EvidenceConflictKind[]
  longFormStudySelectionReceipts: EditReferenceLongFormStudySelectionReceipt[]
  assistantMessage: string
}

type EvidenceConflictKind = 'restrained_vs_rapid_pacing'

interface SkillDefinition {
  skillId: string
  readinessAtRun: PreferenceSkillRunRecord['readinessAtRun']
  runtimeSource: PreferenceSkillRunRecord['runtimeSource']
  fallbackUsed: boolean
  resultState: NonNullable<PreferenceSkillRunRecord['resultState']>
  retryAvailable: boolean
  retryReasonCode?: PreferenceSkillRunRecord['retryReasonCode']
  resultSummary: string
  warnings: string[]
  blockedReasons: string[]
  toolIds: string[]
}

const GOAL_SKILLS: Record<EditReferenceStudyGoal, SkillDefinition[]> = {
  visual_language: [fallbackSkill(
    'edit_reference.visual_language.qwen_visual_analysis',
    'degraded',
    'Saved the user-described visual language as evidence. No frames or video were analyzed.',
    ['Live visual analysis was not invoked; this result is based only on saved user direction.'],
  )],
  story_and_pacing: [
    fallbackSkill(
      'edit_reference.story_editorial.qwen_reasoning',
      'degraded',
      'Organized the user-described story and pacing choices without model reasoning or copied timing.',
      ['Live story reasoning was not invoked; this result is based only on saved user direction.'],
    ),
    blockedSkill(
      'edit_reference.speech_pacing.evidence',
      'Speech and pause analysis needs an approved transcript or audio track, which was not available in this study.',
    ),
  ],
  captions: [fallbackSkill(
    'edit_reference.caption_design.evidence',
    'degraded',
    'Preserved the user-described caption choices as low-confidence manual evidence.',
    ['No caption frames, wording, OCR, or transcript timing were analyzed.'],
  )],
  color: [fallbackSkill(
    'edit_reference.color_treatment.evidence',
    'degraded',
    'Preserved broad user-described color principles without inventing a LUT or exact grade.',
    ['No source frames or color-processing tool ran.'],
  )],
  b_roll: [fallbackSkill(
    'edit_reference.visual_language.qwen_visual_analysis',
    'degraded',
    'Preserved the user-described B-roll language without inferring real shots or scene boundaries.',
    ['No frames, video bytes, shot detector, or visual model ran.'],
  )],
  audio_and_sfx: [fallbackSkill(
    'edit_reference.audio_sound_design.evidence',
    'degraded',
    'Preserved the user-described music and sound-design intent as manual evidence.',
    ['No audio analysis, generation, MMAudio, Lyria, or provider call ran.'],
  )],
  graphics: [fallbackSkill(
    'edit_reference.graphics_motion.evidence',
    'degraded',
    'Preserved the user-described graphics and motion principles without recreating an exact layout.',
    ['No render, generated code, media worker, or provider call ran.'],
  )],
}

export function orchestratePreferenceEvidenceStudy(input: OrchestrationInput): PreferenceEvidenceStudyOrchestrationResult {
  const orchestrationId = input.orchestrationId ?? `preference-evidence-study-${randomUUID()}`
  const allSourceEvidence = input.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const supersededEvidenceIds = new Set(allSourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const sourceEvidence = allSourceEvidence.filter((record) => !supersededEvidenceIds.has(record.id))
  const manualEvidence = sourceEvidence.filter((record) => record.sourceType === 'manual_user_evidence')
  const metadataEvidence = sourceEvidence.filter((record) => record.sourceType === 'reference_video_metadata')
  const previousEditEvidence = sourceEvidence.filter((record) => record.sourceType === 'previous_approved_edit_snapshot')
  const derivedEvidence: PreferenceEvidenceRecord[] = []
  const skillRuns: PreferenceSkillRunRecord[] = []
  const longFormStudySelectionReceipts: EditReferenceLongFormStudySelectionReceipt[] = []
  const longFormSelectedEvidence: PreferenceEvidenceRecord[] = []
  const longFormNotApplicableSkillIds = new Set<string>()
  const longFormAdaptedSkillIds = new Set<string>()
  const mediaStudyByEvidenceId = new Map((input.mediaStudies ?? []).map((study) => [study.sourceEvidenceId, study]))
  const previousApprovedEditStudyByEvidenceId = new Map(
    (input.previousApprovedEditStudies ?? []).map((study) => [study.sourceEvidenceId, study.result]),
  )

  for (const selection of input.longFormStudyReviewSelections ?? []) {
    if (selection.sourceEvidenceId !== selection.package.sourceEvidenceId) {
      throw new Error('Long-form study selection source identity does not match its review package.')
    }
    const sourceRecord = sourceEvidence.find((record) => record.id === selection.sourceEvidenceId)
    if (!sourceRecord) throw new Error('Long-form study selection source evidence is unavailable or superseded.')
    const materialized = materializeEditReferenceLongFormStudySelection({
      package: selection.package,
      sourceEvidence: sourceRecord,
      decisions: selection.decisions,
      acknowledgeAdaptNotCopy: selection.acknowledgeAdaptNotCopy,
      acknowledgeFactSafetyReview: selection.acknowledgeFactSafetyReview,
      orchestrationId,
      now: input.now,
    })
    derivedEvidence.push(...materialized.derivedEvidence)
    skillRuns.push(...materialized.skillRuns)
    longFormSelectedEvidence.push(...materialized.derivedEvidence)
    longFormStudySelectionReceipts.push(materialized.receipt)
    for (const decision of selection.decisions) {
      if (decision.decision !== 'adapt') continue
      const finding = selection.package.findings.find((candidate) => candidate.findingId === decision.findingId)
      if (finding) longFormAdaptedSkillIds.add(finding.skillId)
    }
    for (const finding of selection.package.findings) {
      if (finding.status === 'not_applicable') longFormNotApplicableSkillIds.add(finding.skillId)
    }
  }

  if (metadataEvidence.length > 0) {
    const metadataOnlyEvidence = metadataEvidence.filter((record) => !mediaStudyByEvidenceId.has(record.id))
    for (const record of metadataEvidence.filter((candidate) => mediaStudyByEvidenceId.has(candidate.id))) {
      appendLocalMediaStudy({
        input,
        orchestrationId,
        sourceEvidence: record,
        mediaStudy: mediaStudyByEvidenceId.get(record.id)!,
        derivedEvidence,
        skillRuns,
      })
    }
    if (metadataOnlyEvidence.length === 0) {
      // Every saved video record was routed through the private media study path.
    } else {
      const runId = `preference-skill-run-${randomUUID()}`
      const output = createDerivedEvidence({
        input,
        orchestrationId,
        runId,
        category: 'media_structure',
        title: 'Reference media details',
        summary: summarizeMetadata(metadataOnlyEvidence),
        confidence: 1,
        confidenceBasis: 'metadata_verified',
        transferability: 'requires_user_review',
        sourceEvidenceIds: metadataOnlyEvidence.map((record) => record.id),
        runtimeSource: 'fallback',
        mediaStudyStatus: 'media_not_studied',
        skillId: 'edit_reference.media_structure.metadata_map',
        toolIds: ['metadata_normalizer'],
        fallbackUsed: true,
        notes: ['Only user-supplied duration, dimensions, audio presence, rights basis, and labels were normalized.'],
      })
      derivedEvidence.push(output)
      skillRuns.push(createSkillRun({
        input,
        orchestrationId,
        id: runId,
        skillId: 'edit_reference.media_structure.metadata_map',
        status: 'completed',
        runtimeSource: 'fallback',
        readinessAtRun: 'degraded',
        inputEvidenceIds: metadataOnlyEvidence.map((record) => record.id),
        outputEvidenceIds: [output.id],
        toolIds: ['metadata_normalizer'],
        fallbackUsed: true,
        resultState: 'fallback',
        retryAvailable: false,
        resultSummary: 'Normalized safe reference metadata. The video itself was not studied.',
        warnings: ['No scene, shot, visual, transcript, audio, or motion observation was inferred from metadata.'],
        blockedReasons: [],
      }))
    }
  }

  if (previousEditEvidence.length > 0) {
    for (const record of previousEditEvidence) {
      appendPreviousApprovedEditStudy({
        input,
        orchestrationId,
        sourceEvidence: record,
        result: previousApprovedEditStudyByEvidenceId.get(record.id),
        derivedEvidence,
        skillRuns,
      })
    }
  }

  for (const goal of input.study.initialGoals) {
    const goalEvidence = manualEvidence.filter((record) => record.category === goal || record.category === 'all_goals')
    if (goalEvidence.length === 0) continue
    for (const definition of uniqueSkillDefinitions(GOAL_SKILLS[goal])) {
      const runId = `preference-skill-run-${randomUUID()}`
      const outputIds: string[] = []
      if (definition.runtimeSource !== 'not_started') {
        const output = createManualDerivedEvidence(input, orchestrationId, runId, goal, goalEvidence, definition)
        derivedEvidence.push(output)
        outputIds.push(output.id)
      }
      skillRuns.push(createSkillRun({
        input,
        orchestrationId,
        id: runId,
        skillId: definition.skillId,
        status: definition.runtimeSource === 'not_started' ? 'blocked' : 'completed',
        runtimeSource: definition.runtimeSource,
        readinessAtRun: definition.readinessAtRun,
        inputEvidenceIds: goalEvidence.map((record) => record.id),
        outputEvidenceIds: outputIds,
        toolIds: definition.toolIds,
        fallbackUsed: definition.fallbackUsed,
        resultState: definition.resultState,
        retryAvailable: definition.retryAvailable,
        retryReasonCode: definition.retryReasonCode,
        resultSummary: definition.resultSummary,
        warnings: definition.warnings,
        blockedReasons: definition.blockedReasons,
      }))
    }
  }

  const copySafetyInputEvidence = [...sourceEvidence, ...longFormSelectedEvidence]
  const copyRiskKinds = detectCopyRisks(copySafetyInputEvidence)
  const copyRunId = `preference-skill-run-${randomUUID()}`
  const copyEvidence = createCopySafetyEvidence(input, orchestrationId, copyRunId, copySafetyInputEvidence, copyRiskKinds)
  derivedEvidence.push(copyEvidence)
  skillRuns.push(createSkillRun({
    input,
    orchestrationId,
    id: copyRunId,
    skillId: 'edit_reference.transferability.copy_safety',
    status: copyRiskKinds.length > 0 ? 'blocked' : 'completed',
    runtimeSource: 'verified_mock',
    readinessAtRun: 'verified_mock',
    inputEvidenceIds: copySafetyInputEvidence.map((record) => record.id),
    outputEvidenceIds: [copyEvidence.id],
    toolIds: ['deterministic_copy_safety_classifier'],
    fallbackUsed: false,
    resultState: copyRiskKinds.length > 0 ? 'blocked' : 'analyzed',
    retryAvailable: false,
    resultSummary: copyRiskKinds.length > 0
      ? `Found ${copyRiskKinds.length} direct-copy request categor${copyRiskKinds.length === 1 ? 'y' : 'ies'} that require review.`
      : 'No direct-copy request was detected in the saved evidence.',
    warnings: copyRiskKinds.length > 0 ? ['Direct-copy requests are not transferable Preference DNA.'] : [],
    blockedReasons: copyRiskKinds.map(copyRiskReason),
  }))

  const conflictInputEvidence = [...manualEvidence, ...longFormSelectedEvidence]
  const conflictKinds = detectEvidenceConflicts(conflictInputEvidence)
  if (conflictKinds.length > 0) {
    const conflictRunId = `preference-skill-run-${randomUUID()}`
    const conflictEvidence = createDerivedEvidence({
      input,
      orchestrationId,
      runId: conflictRunId,
      category: 'story_and_pacing',
      title: 'Conflicting pacing direction',
      summary: 'The saved evidence contains both restrained/measured pacing and rapid/high-energy pacing. ReEditPro will not silently choose between them.',
      confidence: 1,
      confidenceBasis: 'deterministic_derived',
      transferability: 'requires_user_review',
      sourceEvidenceIds: conflictInputEvidence.map((record) => record.id),
      runtimeSource: 'verified_mock',
      mediaStudyStatus: 'not_applicable',
      skillId: 'edit_reference.story_editorial.qwen_reasoning',
      toolIds: ['deterministic_evidence_conflict_classifier'],
      fallbackUsed: false,
      notes: ['A user decision is required before these pacing directions can be synthesized.'],
    })
    derivedEvidence.push(conflictEvidence)
    skillRuns.push(createSkillRun({
      input,
      orchestrationId,
      id: conflictRunId,
      skillId: 'edit_reference.story_editorial.qwen_reasoning',
      status: 'blocked',
      runtimeSource: 'verified_mock',
      readinessAtRun: 'verified_mock',
      inputEvidenceIds: conflictInputEvidence.map((record) => record.id),
      outputEvidenceIds: [conflictEvidence.id],
      toolIds: ['deterministic_evidence_conflict_classifier'],
      fallbackUsed: false,
      resultState: 'needs_more_evidence',
      retryAvailable: false,
      resultSummary: 'Found conflicting pacing direction and deferred the decision to the user.',
      warnings: ['Conflicting evidence must not be resolved silently.'],
      blockedReasons: ['Choose whether restrained/measured or rapid/high-energy pacing should take priority.'],
    }))
  }

  const analyzedSkillIds = new Set(skillRuns
    .filter((record) => record.status === 'completed' && record.resultState === 'analyzed' && !record.fallbackUsed)
    .map((record) => record.skillId))
  const verifiedPreviousApprovedEditGoals = new Set((input.previousApprovedEditStudies ?? [])
    .flatMap((study) => study.result.status === 'verified'
      ? study.result.evidence.map((finding) => finding.layer)
      : []))
  const uncoveredGoals = input.study.initialGoals.filter((goal) => (
    !manualEvidence.some((record) => record.category === goal || record.category === 'all_goals')
    && !verifiedPreviousApprovedEditGoals.has(goal)
    && !GOAL_SKILLS[goal].every((definition) => longFormNotApplicableSkillIds.has(definition.skillId))
    && !GOAL_SKILLS[goal].some((definition) => longFormAdaptedSkillIds.has(definition.skillId))
    && !GOAL_SKILLS[goal].some((definition) => analyzedSkillIds.has(definition.skillId))
  ))
  const longFormReviewOnly = (
    longFormStudySelectionReceipts.length > 0
    && longFormStudySelectionReceipts.every((receipt) => receipt.adaptedFindingCount === 0)
    && manualEvidence.length === 0
    && verifiedPreviousApprovedEditGoals.size === 0
  )
  const studyStatus = copyRiskKinds.length > 0 || conflictKinds.length > 0 || longFormReviewOnly
    ? 'needs_user_review'
    : uncoveredGoals.length > 0
      ? 'needs_clarification'
      : 'evidence_ready'
  const evidenceStatus = studyStatus === 'evidence_ready' ? 'evidence_ready' : 'needs_clarification'

  return {
    orchestrationId,
    derivedEvidence,
    skillRuns,
    studyStatus,
    evidenceStatus,
    uncoveredGoals,
    copyRiskKinds,
    conflictKinds,
    longFormStudySelectionReceipts,
    assistantMessage: buildAssistantMessage(
      studyStatus,
      uncoveredGoals,
      copyRiskKinds,
      conflictKinds,
      (input.mediaStudies ?? []).some((study) => study.status === 'verified_local'),
      (input.mediaStudies ?? []).some((study) => study.visualLanguageStudyStatus === 'analyzed'),
      longFormStudySelectionReceipts.length > 0,
      longFormReviewOnly,
    ),
  }
}

function appendLocalMediaStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}): void {
  const { mediaStudy, sourceEvidence } = input
  const mediaRunId = `preference-skill-run-${randomUUID()}`
  const mediaReady = mediaStudy.status === 'verified_local'
  const mediaRetryAvailable = isRetryableMediaStudyBlocker(mediaStudy.blockerCode)
  const mediaNeedsEvidence = mediaStudy.blockerCode === 'reference_media_asset_not_ready'
  const mediaOutput = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId: mediaRunId,
    category: 'media_structure',
    title: mediaReady ? 'Private reference media structure' : 'Private reference media study blocked',
    summary: mediaReady
      ? `${sourceEvidence.title}: ${formatDuration(mediaStudy.durationSeconds)}, ${formatDimensions(mediaStudy.width, mediaStudy.height)}, ${formatFrameRate(mediaStudy.fps)}, ${mediaStudy.aspectRatio ?? 'aspect ratio unavailable'}, ${mediaStudy.streamCount ?? 0} stream${mediaStudy.streamCount === 1 ? '' : 's'}, ${mediaStudy.hasAudio ? 'audio present' : 'no audio stream detected'}, ${mediaStudy.keyframeSampleCount} bounded interval sample${mediaStudy.keyframeSampleCount === 1 ? '' : 's'}, ${mediaStudy.representativeFrameCount} representative frame${mediaStudy.representativeFrameCount === 1 ? '' : 's'} prepared ephemerally, and ${sceneBoundarySummary(mediaStudy)}.`
      : mediaStudy.blockerMessage ?? 'The private reference media could not be studied locally.',
    confidence: mediaReady ? 0.9 : 0,
    confidenceBasis: mediaReady ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [sourceEvidence.id],
    runtimeSource: mediaReady ? 'verified_local' : 'blocked',
    mediaStudyStatus: mediaReady ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.media_structure.metadata_map',
    toolIds: mediaStudy.toolIds,
    fallbackUsed: !mediaReady,
    privateAssetId: mediaStudy.privateAssetId,
    analysisArtifactIds: mediaStudy.mediaAnalysisReportId ? [mediaStudy.mediaAnalysisReportId] : [],
    notes: [
      'The source remained a private artifact reference. No signed URL or filesystem path was persisted.',
      'Representative and interval-sampled frames were bounded and deleted after the local study; raw frames were not persisted.',
      sceneBoundaryNote(mediaStudy),
      ...(mediaReady ? [...mediaStudy.technicalWarnings, ...mediaStudy.warnings] : [mediaStudy.blockerMessage ?? 'Local media study blocked.']),
    ],
  })
  input.derivedEvidence.push(mediaOutput)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: mediaRunId,
    skillId: 'edit_reference.media_structure.metadata_map',
    status: mediaReady ? 'completed' : mediaStudy.fileBytesRead ? 'failed' : 'blocked',
    runtimeSource: mediaReady || mediaStudy.fileBytesRead ? 'verified_local' : 'not_started',
    readinessAtRun: mediaReady ? 'verified_local' : mediaStudy.fileBytesRead ? 'degraded' : 'blocked',
    inputEvidenceIds: [sourceEvidence.id],
    outputEvidenceIds: [mediaOutput.id],
    toolIds: mediaStudy.toolIds,
    fallbackUsed: !mediaReady,
    resultState: mediaReady ? 'analyzed' : mediaNeedsEvidence ? 'needs_more_evidence' : 'blocked',
    retryAvailable: mediaRetryAvailable,
    retryReasonCode: mediaRetryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: mediaReady
      ? `FFprobe verified private media structure and FFmpeg prepared bounded ephemeral frame/audio artifacts; ${sceneBoundarySummary(mediaStudy)}.`
      : 'Private local media structure study did not complete.',
    warnings: mediaStudy.warnings,
    blockedReasons: mediaReady ? [] : [mediaStudy.blockerMessage ?? 'Private local media runtime unavailable.'],
    fileBytesRead: mediaStudy.fileBytesRead,
    mediaProcessingStarted: mediaStudy.mediaProcessingStarted,
  }))

  const frameRunId = `preference-skill-run-${randomUUID()}`
  const framesReady = mediaReady && mediaStudy.representativeFrameCount > 0
  const frameRetryAvailable = mediaReady ? !framesReady : mediaRetryAvailable
  const frameOutput = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId: frameRunId,
    category: 'media_structure',
    title: 'Representative-frame study plan',
    summary: framesReady
      ? `${mediaStudy.representativeFrameCount} representative frame${mediaStudy.representativeFrameCount === 1 ? '' : 's'} sampled at ${mediaStudy.representativeFrameTimes.map((time) => `${time.toFixed(2)}s`).join(', ') || 'bounded points'}, plus ${mediaStudy.keyframeSampleCount} bounded ${mediaStudy.keyframeSamplingIntervalSeconds ?? 2}-second interval sample${mediaStudy.keyframeSampleCount === 1 ? '' : 's'}. The frames were deleted after planning and were not treated as semantic visual or scene evidence.`
      : 'Representative frames were unavailable, so semantic visual analysis remains blocked.',
    confidence: framesReady ? 0.6 : 0,
    confidenceBasis: framesReady ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [sourceEvidence.id],
    runtimeSource: framesReady ? 'verified_local' : 'blocked',
    mediaStudyStatus: framesReady ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.media_structure.representative_frame_plan',
    toolIds: framesReady ? ['ffmpeg'] : [],
    fallbackUsed: !framesReady,
    privateAssetId: mediaStudy.privateAssetId,
    analysisArtifactIds: mediaStudy.mediaAnalysisReportId ? [mediaStudy.mediaAnalysisReportId] : [],
    notes: [
      'Frame timing and count are evidence; raw frame pixels are not persisted by default.',
      sceneBoundaryNote(mediaStudy),
    ],
  })
  input.derivedEvidence.push(frameOutput)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: frameRunId,
    skillId: 'edit_reference.media_structure.representative_frame_plan',
    status: framesReady ? 'completed' : 'blocked',
    runtimeSource: framesReady ? 'verified_local' : 'not_started',
    readinessAtRun: framesReady ? 'verified_local' : 'blocked',
    inputEvidenceIds: [sourceEvidence.id],
    outputEvidenceIds: [frameOutput.id],
    toolIds: framesReady ? ['ffmpeg'] : [],
    fallbackUsed: !framesReady,
    resultState: framesReady ? 'analyzed' : mediaNeedsEvidence ? 'needs_more_evidence' : 'blocked',
    retryAvailable: frameRetryAvailable,
    retryReasonCode: frameRetryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: framesReady
      ? 'Prepared and cleaned a bounded representative-frame plan.'
      : 'Representative-frame planning was not available.',
    warnings: [],
    blockedReasons: framesReady ? [] : ['No representative frame artifact was available for this study.'],
    fileBytesRead: framesReady,
    mediaProcessingStarted: framesReady,
  }))

  appendTechnicalSourceConditionStudy(input, mediaReady)

  appendTechnicalEdgeWidthStudy(input, mediaReady)

  appendTechnicalColorStudy(input, mediaReady)

  appendTechnicalCaptionRegionStudy(input, mediaReady)

  appendTechnicalAudioStudy(input, mediaReady)

  appendTechnicalAudioLowLevelStudy(input, mediaReady)

  appendTechnicalMotionStudy(input, mediaReady)

  appendVisualLanguageStudy(input, mediaReady)

  appendColorTreatmentStudy(input, mediaReady)

  appendGraphicsMotionStudy(input, mediaReady)

  appendCaptionDesignStudy(input, mediaReady)

  appendStoryEditorialStudy(input, mediaReady)

  appendSpeechPacingStudy(input, mediaReady)

  appendAudioSoundDesignStudy(input, mediaReady)

  appendUnavailableMediaSpecialists(input, mediaReady)
}

function appendPreviousApprovedEditStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  result?: EditReferencePreviousApprovedEditStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}): void {
  const runId = `preference-skill-run-${randomUUID()}`
  if (!input.result || input.result.status === 'blocked') {
    const retryAvailable = input.result?.retryAvailable ?? true
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.previous_approved_edit.authority',
      status: 'blocked',
      runtimeSource: 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: [],
      fallbackUsed: true,
      resultState: 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The exact approved-edit identity is saved as source provenance, but no Preference Evidence was created because immutable approved-history authority was not verified.',
      warnings: ['No raw snapshot, raw plan, media, chat, unrelated project history, signed URL, provider payload, or file byte entered the study.'],
      blockedReasons: [input.result?.blockerMessage
        ?? 'The workspace-authorized approved-history reader is unavailable. Exact immutable approval, plan lineage, and target-owned private artifacts remain closed.'],
      runtimeAttempt: {
        schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
        adapterId: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID,
        requestDigestSha256: input.result?.requestDigestSha256 ?? '0'.repeat(64),
        providerCallMade: false,
        modelCallMade: false,
        workerJobCreated: false,
        temporaryInputsCleaned: true,
        internalCostStatus: 'not_incurred',
        meteredInternalCostMicros: '0',
        usageEventIds: [],
        internalCostRecordIds: [],
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
      },
    }))
    return
  }

  const outputEvidenceIds: string[] = []
  for (const finding of input.result.evidence) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: finding.layer,
      title: `Previous approved edit — ${previousApprovedEditLayerTitle(finding.layer)}`,
      summary: previousApprovedEditEvidenceSummary(finding),
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: 'requires_user_review',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: input.result.runtimeSource,
      mediaStudyStatus: 'approved_edit_verified',
      skillId: 'edit_reference.previous_approved_edit.authority',
      toolIds: [],
      fallbackUsed: false,
      privateAssetId: input.sourceEvidence.provenance.privateAssetId,
      analysisArtifactIds: [
        ...input.result.approvedPlanEvidenceIds,
        ...input.result.privatePreviewArtifactIds,
      ],
      notes: [
        'Only exact approved decision/evidence identities and target-owned private preview lineage were read.',
        'The result is generalized guidance for target adaptation; all universal no-copy boundaries remain mandatory.',
      ],
    })
    input.derivedEvidence.push(output)
    outputEvidenceIds.push(output.id)
  }

  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.previous_approved_edit.authority',
    status: 'completed',
    runtimeSource: input.result.runtimeSource,
    readinessAtRun: input.result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds,
    toolIds: [],
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Verified immutable approved-history authority and created ${outputEvidenceIds.length} generalized evidence record${outputEvidenceIds.length === 1 ? '' : 's'}.`,
    warnings: ['Source footage, exact captions, exact timing or sequence, identity, copyrighted audio, and original graphics or layout remain non-transferable.'],
    blockedReasons: [],
    runtimeAttempt: {
      schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
      adapterId: input.result.provenance.adapterId,
      requestDigestSha256: input.result.requestDigestSha256,
      providerCallMade: false,
      modelCallMade: false,
      workerJobCreated: false,
      temporaryInputsCleaned: true,
      internalCostStatus: input.result.provenance.internalCostStatus,
      meteredInternalCostMicros: input.result.provenance.meteredInternalCostMicros,
      usageEventIds: [...input.result.provenance.usageEventIds],
      internalCostRecordIds: [...input.result.provenance.internalCostRecordIds],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
  }))
}

function previousApprovedEditEvidenceSummary(
  finding: EditReferencePreviousApprovedEditEvidenceSummary,
): string {
  return [
    finding.summary,
    `Transferable: ${finding.transferablePrinciples.join('; ')}`,
    `Non-transferable: ${finding.nonTransferableElements.join('; ')}`,
  ].join(' ')
}

function previousApprovedEditLayerTitle(
  layer: EditReferencePreviousApprovedEditEvidenceSummary['layer'],
): string {
  return layer.replace(/_/g, ' ')
}

function appendTechnicalSourceConditionStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalSourceCondition
  if (technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalSourceConditionBlocker(technical.blockerCode)
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'media_structure',
    title: completed ? 'Reference dark and unchanged interval check' : 'Reference source-condition check blocked',
    summary: completed
      ? `FFmpeg measured ${technical.blackDetectedIntervalCount} bounded dark interval${technical.blackDetectedIntervalCount === 1 ? '' : 's'} and ${technical.freezeDetectedIntervalCount} bounded unchanged interval${technical.freezeDetectedIntervalCount === 1 ? '' : 's'} in the ${technical.scannedDurationSeconds.toFixed(2)}-second technical scan${technical.coverage === 'partial' ? ' window' : ''}. Dark or unchanged frames may be intentional; this result does not decide source quality, obstruction, blur, cuts, or trims.`
      : technical.blockerMessage ?? 'The bounded source-condition check did not complete.',
    confidence: completed ? 0.95 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.media_structure.technical_source_condition',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        `Dark threshold: at least ${(technical.blackPictureRatioThreshold * 100).toFixed(0)}% of pixels at or below the ${(technical.blackPixelThreshold * 100).toFixed(0)}% luma threshold for ${technical.blackMinimumDurationSeconds.toFixed(2)} seconds; retained ${technical.blackIntervals.length} of ${technical.blackDetectedIntervalCount} interval records.`,
        `Unchanged-frame threshold: noise tolerance ${technical.freezeNoiseTolerance.toFixed(6)} for ${technical.freezeMinimumDurationSeconds.toFixed(2)} seconds; retained ${technical.freezeIntervals.length} of ${technical.freezeDetectedIntervalCount} interval records.`,
        'An unchanged interval can be an intentional hold, still image, title, freeze-frame edit, low-motion scene, or technical issue. A dark interval can be an intentional fade, black card, transition, or technical issue.',
        'No blur analysis, obstruction inference, semantic source-quality rating, trim recommendation, cut decision, or edit decision ran.',
        'Raw frame pixels and FFmpeg process output were not persisted.',
      ]
      : [technical.blockerMessage ?? 'Bounded source-condition measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.media_structure.technical_source_condition',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded dark and unchanged intervals without rating source quality or recommending edits.'
      : 'The bounded source-condition check did not run.',
    warnings: completed ? ['Dark and unchanged intervals require later semantic/user interpretation before any edit decision.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Bounded source-condition measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalEdgeWidthStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalEdgeWidth
  if (technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalEdgeWidthBlocker(technical.blockerCode)
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'media_structure',
    title: completed ? 'Reference technical edge-width check' : 'Reference technical edge-width check blocked',
    summary: completed
      ? `FFmpeg returned ${technical.sampleCount} measurable dimensionless edge-width score${technical.sampleCount === 1 ? '' : 's'} from ${technical.attemptedSampleCount} bounded sample${technical.attemptedSampleCount === 1 ? '' : 's'} in the ${technical.scannedDurationSeconds.toFixed(2)}-second technical scan${technical.coverage === 'partial' ? ' window' : ''}; ${technical.unmeasurableSampleCount} sample${technical.unmeasurableSampleCount === 1 ? ' was' : 's were'} edge-unmeasurable and the observed score range was ${formatSignalValue(technical.scoreMinimum)} to ${formatSignalValue(technical.scoreMaximum)}. This proxy does not classify blur, focus, depth of field, obstruction, source quality, cuts, or trims.`
      : technical.blockerMessage ?? 'The bounded technical edge-width check did not complete.',
    confidence: completed ? 0.9 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.media_structure.technical_edge_width_signal',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        `Sampled at most ${technical.maxSampleCount} temporary grayscale frames, normalized to a maximum dimension of ${technical.outputMaxDimension}px, with FFmpeg blurdetect block percentile ${technical.blockPercentile} and ${technical.blockWidth}x${technical.blockHeight} blocks.`,
        'The dimensionless score may change because of texture, graphics, compression, motion, scaling, shallow depth of field, or other image characteristics. It is not a semantic blur or focus verdict.',
        'No source-quality rating, focus-quality classification, depth-of-field inference, camera-obstruction inference, trim recommendation, cut decision, or edit decision ran.',
        'Raw frame pixels and FFmpeg process output were not persisted.',
      ]
      : [technical.blockerMessage ?? 'Bounded technical edge-width measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.media_structure.technical_edge_width_signal',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured a bounded dimensionless edge-width proxy without classifying blur, focus, source quality, or edit intent.'
      : 'The bounded technical edge-width check did not run.',
    warnings: completed ? ['Edge-width scores require later semantic and user interpretation before any source-quality or edit decision.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Bounded technical edge-width measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalCaptionRegionStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalCaptionRegions
  if (technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalCaptionRegionBlocker(technical.blockerCode)
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'captions',
    title: completed ? 'Reference text-region geometry check' : 'Reference text-region geometry check blocked',
    summary: completed
      ? `Measured ${technical.totalCandidateRegionCount} bounded high-contrast text-like region candidate${technical.totalCandidateRegionCount === 1 ? '' : 's'} across ${technical.sampleCount} temporary grayscale sample${technical.sampleCount === 1 ? '' : 's'}${technical.coverage === 'partial' ? ' within the bounded scan window' : ''}. ${technical.framesWithCandidates} sampled frame${technical.framesWithCandidates === 1 ? '' : 's'} contained candidates and ${technical.lowerRegionCandidateCount} candidate${technical.lowerRegionCandidateCount === 1 ? '' : 's'} occupied the lower frame region. This does not prove that a candidate is a caption or identify any text.`
      : technical.blockerMessage ?? 'The bounded caption-region signal check did not complete.',
    confidence: completed ? 0.9 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.caption_design.technical_region_signal',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        `Retained normalized geometry for at most ${technical.maxRegionCountPerFrame} candidate regions per frame; lower-region ratio ${formatRatioValue(technical.lowerRegionCandidateRatio)} and candidate-frame ratio ${formatRatioValue(technical.candidateFrameRatio)}.`,
        'The check uses bounded luminance/contrast geometry. Bright graphics, UI details, textures, titles, labels, and other visuals may appear text-like.',
        'OCR, character recognition, exact wording, font/weight inference, transcript alignment, caption timing, animation, and semantic caption-design analysis did not run.',
        'Raw grayscale frames, recognized text, and FFmpeg process output were not persisted.',
      ]
      : [technical.blockerMessage ?? 'Bounded caption-region signal measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.caption_design.technical_region_signal',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded text-like region geometry without claiming OCR or semantic caption understanding.'
      : 'The bounded caption-region signal check did not run.',
    warnings: completed ? ['OCR, transcript alignment, exact text, font, timing, animation, and semantic caption analysis remain blocked.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Caption-region signal measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalColorStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalColor
  if (technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalColorBlocker(technical.blockerCode)
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'color',
    title: completed ? 'Reference color signal check' : 'Reference color signal check blocked',
    summary: completed
      ? `Measured bounded luma, saturation, chroma, temporal-difference, and range-safety proxies across ${technical.sampleCount} temporary technical sample${technical.sampleCount === 1 ? '' : 's'}${technical.coverage === 'partial' ? ' within the bounded scan window' : ''}. This does not identify a creative color style, recreate a LUT, or choose a target grade.`
      : technical.blockerMessage ?? 'The technical color signal check did not complete.',
    confidence: completed ? 0.95 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.color_treatment.technical_signal',
    toolIds: completed ? ['ffprobe', 'ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        technicalColorMeasurementNote(technical),
        technicalColorMetadataNote(technical),
        'Only bounded sample times, 8-bit proxy signal distributions, range-safety ratios, and allowlisted stream metadata were retained. Raw frames, raw histograms, and process output were not persisted.',
        'Semantic palette, mood, white balance, temperature, skin tone, shot matching, creative grade, LUT reconstruction, and target transform analysis did not run.',
      ]
      : [technical.blockerMessage ?? 'Technical color signal measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.color_treatment.technical_signal',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffprobe', 'ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded technical color signal without claiming creative color understanding.'
      : 'Technical color signal measurement did not run.',
    warnings: completed ? ['Creative color treatment and target-safe shot matching remain blocked.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Technical color signal measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalAudioStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalAudio
  if (technical.status === 'not_applicable') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local'
  const retryAvailable = isRetryableTechnicalAudioBlocker(technical.blockerCode)
  const measurements = [
    technical.integratedLufs === undefined ? undefined : `${technical.integratedLufs.toFixed(2)} LUFS integrated loudness`,
    technical.truePeakDb === undefined ? undefined : `${technical.truePeakDb.toFixed(2)} dBFS true peak`,
  ].filter((value): value is string => Boolean(value))
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'audio_and_sfx',
    title: completed ? 'Reference audio technical measurement' : 'Reference audio technical measurement blocked',
    summary: completed
      ? `FFmpeg measured ${measurements.join(' and ')} from the private extracted audio track. Music role, tempo, beat grid, SFX, ambience, speech content, and semantic sound design were not analyzed.`
      : technical.blockerMessage ?? 'Technical audio measurement did not complete.',
    confidence: completed ? 0.95 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.audio_sound_design.technical_loudness',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: [
      'Only allowlisted FFmpeg technical audio measurement ran.',
      'Raw audio and process output were deleted with the ephemeral study directory and were not persisted.',
      'This technical result must not be presented as music, SFX, speech, mood, energy, or SoundSync analysis.',
    ],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.audio_sound_design.technical_loudness',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded technical loudness without claiming semantic audio understanding.'
      : 'Technical audio measurement did not run.',
    warnings: completed ? ['Semantic audio and SoundSync analysis remain blocked.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Technical audio measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalAudioLowLevelStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalAudioLowLevel
  if (technical.status === 'not_applicable' || technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalAudioLowLevelBlocker(technical.blockerCode)
  const intervalPhrase = technical.detectedIntervalCount === 0
    ? 'no low-level intervals'
    : `${technical.detectedIntervalCount} low-level interval${technical.detectedIntervalCount === 1 ? '' : 's'} totaling ${technical.totalLowLevelDurationSeconds.toFixed(2)} seconds`
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'audio_and_sfx',
    title: completed ? 'Reference low-level audio check' : 'Reference low-level audio check blocked',
    summary: completed
      ? `FFmpeg found ${intervalPhrase} at or below ${technical.thresholdDb.toFixed(0)} dB lasting at least ${technical.minimumDurationSeconds.toFixed(2)} seconds in the ${technical.scannedDurationSeconds.toFixed(2)}-second bounded scan${technical.coverage === 'partial' ? ' window' : ''}. This amplitude check does not classify speech pauses, breathing room, music, SFX, ambience, pacing, or edit decisions.`
      : technical.blockerMessage ?? 'The bounded low-level audio check did not complete.',
    confidence: completed ? 0.95 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.audio_sound_design.technical_low_level_intervals',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        `Persisted ${technical.intervals.length} of ${technical.detectedIntervalCount} bounded interval${technical.detectedIntervalCount === 1 ? '' : 's'}; interval list truncated: ${technical.intervalsTruncated ? 'yes' : 'no'}.`,
        'Threshold crossings are technical amplitude evidence only. They are not speech pauses, emotional pauses, silence-cleanup targets, or trim recommendations.',
        'Raw audio and FFmpeg process output were removed with the ephemeral study directory and were not persisted.',
        'Music role, tempo, beat grid, energy, SFX, ambience, speech content, voice safety, and SoundSync analysis did not run.',
      ]
      : [technical.blockerMessage ?? 'Bounded low-level audio measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.audio_sound_design.technical_low_level_intervals',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded low-level audio intervals without classifying pauses or recommending edits.'
      : 'The bounded low-level audio check did not run.',
    warnings: completed ? ['Semantic audio, speech/pacing, cleanup, and SoundSync analysis remain blocked.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Bounded low-level audio measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendTechnicalMotionStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const technical = input.mediaStudy.technicalMotion
  if (technical.status === 'not_run') return
  const runId = `preference-skill-run-${randomUUID()}`
  const completed = mediaReady && technical.status === 'verified_local_bounded'
  const retryAvailable = isRetryableTechnicalMotionBlocker(technical.blockerCode)
  const output = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId,
    category: 'graphics',
    title: completed ? 'Reference visual activity check' : 'Reference visual activity check blocked',
    summary: completed
      ? `Measured bounded adjacent-sample pixel differences across ${technical.sampleCount} temporary technical sample${technical.sampleCount === 1 ? '' : 's'}${technical.coverage === 'partial' ? ' within the bounded scan window' : ''}. ${technical.activeSampleCount} sample${technical.activeSampleCount === 1 ? '' : 's'} met the technical activity threshold and ${technical.highActivitySampleCount} met the high-activity threshold. This cannot identify camera movement, subject motion, edits, transitions, captions, graphics, or animation style.`
      : technical.blockerMessage ?? 'The technical frame-difference check did not complete.',
    confidence: completed ? 0.95 : 0,
    confidenceBasis: completed ? 'metadata_verified' : 'blocked',
    transferability: 'requires_user_review',
    sourceEvidenceIds: [input.sourceEvidence.id],
    runtimeSource: completed ? 'verified_local' : 'blocked',
    mediaStudyStatus: completed ? 'media_studied_local_partial' : 'media_study_blocked',
    skillId: 'edit_reference.graphics_motion.technical_frame_difference',
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    privateAssetId: input.mediaStudy.privateAssetId,
    analysisArtifactIds: input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : [],
    notes: completed
      ? [
        technicalMotionMeasurementNote(technical),
        `Retained ${technical.peakSamples.length} bounded peak sample${technical.peakSamples.length === 1 ? '' : 's'} from at most ${technical.maxPeakCount}; no frame pixels or difference images were retained.`,
        'Pixel difference may be caused by camera movement, moving subjects, cuts, transitions, flashes, captions, graphics, compression, or other visual changes. This check does not distinguish among them.',
        'Semantic motion, object tracking, camera inference, transition classification, graphics entry/exit behavior, optical flow, and target animation rules did not run.',
      ]
      : [technical.blockerMessage ?? 'Bounded frame-difference measurement was unavailable.'],
  })
  input.derivedEvidence.push(output)
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.graphics_motion.technical_frame_difference',
    status: completed ? 'completed' : 'blocked',
    runtimeSource: completed ? 'verified_local' : 'not_started',
    readinessAtRun: completed ? 'verified_local' : 'blocked',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: [output.id],
    toolIds: completed ? ['ffmpeg'] : [],
    fallbackUsed: !completed,
    resultState: completed ? 'analyzed' : 'blocked',
    retryAvailable,
    retryReasonCode: retryAvailable ? 'rerun_same_inputs' : undefined,
    resultSummary: completed
      ? 'Measured bounded technical frame differences without claiming semantic graphics or motion understanding.'
      : 'Technical frame-difference measurement did not run.',
    warnings: completed ? ['Semantic graphics, animation, transition, and motion analysis remain blocked.'] : [],
    blockedReasons: completed ? [] : [technical.blockerMessage ?? 'Technical frame-difference measurement unavailable.'],
    fileBytesRead: completed,
    mediaProcessingStarted: completed,
  }))
}

function appendVisualLanguageStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.visualLanguageStudyStatus === 'not_run') return
  const result = input.mediaStudy.visualLanguageStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status === 'blocked') {
    const blockerCode = result?.blockerCode
      ?? input.mediaStudy.visualLanguageBlockerCode
      ?? 'reference_visual_language_study_blocked'
    const blockerMessage = result?.blockerMessage
      ?? input.mediaStudy.visualLanguageBlockerMessage
      ?? 'The bounded Visual Language study did not complete.'
    const providerCallMade = result?.providerCallMade ?? false
    const modelCallMade = result?.modelCallMade ?? false
    const localPreparationRan = mediaReady && input.mediaStudy.fileBytesRead
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.visual_language.qwen_visual_analysis',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : localPreparationRan ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(localPreparationRan ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_qwen_visual_language_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: 'blocked',
      retryAvailable: result?.retryAvailable ?? isRetryableVisualLanguageBlocker(blockerCode),
      retryReasonCode: (result?.retryAvailable ?? isRetryableVisualLanguageBlocker(blockerCode))
        ? 'runtime_recovery_then_retry'
        : undefined,
      resultSummary: 'The bounded private-frame Visual Language study remained blocked; no reusable visual rule was synthesized.',
      warnings: [
        'No exact layout, visible text, camera path, creator identity, copyrighted asset, or raw provider payload was persisted.',
        ...(result?.temporaryFramesCleaned === false ? ['Ephemeral frame cleanup was not proven by the specialist adapter.'] : []),
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? visualRuntimeAttempt(result) : undefined,
      fileBytesRead: localPreparationRan,
      mediaProcessingStarted: input.mediaStudy.mediaProcessingStarted,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.model.adapterId,
    adapterVersion: result.model.adapterVersion,
    providerId: result.model.providerId,
    modelId: result.model.modelId,
    modelRevision: result.model.modelRevision,
    modelAggregateSha256: result.model.modelAggregateSha256,
    modelRoutingPolicyVersion: result.model.modelRoutingPolicyVersion,
    instructionDigestSha256: result.model.visualInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryFramesCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    result.model.adapterId,
    ...(result.model.providerId ? [result.model.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'visual_language',
      title: visualLanguageCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.visual_language.qwen_visual_analysis',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized visual observation from bounded private frames, not an instruction to copy the reference.',
        'Target evidence, target adaptation, and user approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.identityRelated ? ['Identity-related context is non-transferable and remains bounded by fact-safety evidence.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.visual_language.qwen_visual_analysis',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Visual Language finding${result.findings.length === 1 ? '' : 's'} from bounded private frames with exact model, cleanup, and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Visual Language coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No exact reference layout, wording, camera path, identity, copyrighted asset, raw frame, or raw provider payload was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: visualRuntimeAttempt(result),
    fileBytesRead: result.execution.boundedPrivateFramesRead,
    mediaProcessingStarted: true,
  }))
}

function appendColorTreatmentStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.colorTreatmentStudyStatus === 'not_run') return
  const result = input.mediaStudy.colorTreatmentStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blocked = result?.status === 'blocked' ? result : undefined
    const blockerCode = blocked?.blockerCode
      ?? input.mediaStudy.colorTreatmentBlockerCode
      ?? 'reference_color_treatment_study_blocked'
    const blockerMessage = blocked?.blockerMessage
      ?? (result?.status === 'needs_more_evidence' ? result.retryReason : undefined)
      ?? input.mediaStudy.colorTreatmentBlockerMessage
      ?? 'The bounded Color Treatment study did not complete.'
    const providerCallMade = blocked?.providerCallMade ?? false
    const modelCallMade = blocked?.modelCallMade ?? false
    const localPreparationRan = mediaReady && input.mediaStudy.fileBytesRead
    const retryAvailable = result?.retryAvailable
      ?? isRetryableColorTreatmentBlocker(blockerCode)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.color_treatment.evidence',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : localPreparationRan ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(localPreparationRan ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_qwen_color_treatment_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: result?.status === 'needs_more_evidence' ? 'needs_more_evidence' : 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The bounded private-frame Color Treatment study remained blocked; no reusable color rule or executable grade was synthesized.',
      warnings: [
        'No exact swatch, color value, curve, grade setting, LUT identity/data, look transform, brand-color asset, raw frame, histogram, or provider payload was retained.',
        ...(blocked?.temporaryFramesCleaned === false ? ['Ephemeral Color Treatment frame cleanup was not proven by the specialist adapter.'] : []),
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? colorTreatmentRuntimeAttempt(result) : undefined,
      fileBytesRead: localPreparationRan,
      mediaProcessingStarted: input.mediaStudy.mediaProcessingStarted,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.analyzer.adapterId,
    adapterVersion: result.analyzer.adapterVersion,
    providerId: result.analyzer.providerId,
    modelId: result.analyzer.modelId,
    modelRevision: result.analyzer.modelRevision,
    modelAggregateSha256: result.analyzer.modelAggregateSha256,
    modelRoutingPolicyVersion: result.analyzer.modelRoutingPolicyVersion,
    instructionDigestSha256: result.analyzer.analysisInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryFramesCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    result.analyzer.adapterId,
    ...(result.analyzer.providerId ? [result.analyzer.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'color',
      title: colorTreatmentCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.color_treatment.evidence',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized tonal observation from bounded private frames plus technical signal context; it is not an instruction to copy the reference grade.',
        'Target media color analysis, color-management review, shot matching, generated-asset matching, final render QA, user review, and approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.skinToneRelated ? ['Skin-tone protection requires person-presence evidence and target-specific review.'] : []),
        ...(finding.brandColorRelated ? ['Brand-color context requires separate rights evidence and target-specific review.'] : []),
        ...(finding.hdrOrColorManagementRelated ? ['HDR/SDR and working/output color-space handling requires target-specific review.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.color_treatment.evidence',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Color Treatment finding${result.findings.length === 1 ? '' : 's'} from bounded private frames and exact technical-color context with cleanup and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Color Treatment coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No exact swatch, color value, curve, grade setting, LUT identity/data, look transform, brand-color asset, raw frame, histogram, or provider payload was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: colorTreatmentRuntimeAttempt(result),
    fileBytesRead: result.execution.boundedPrivateFramesRead,
    mediaProcessingStarted: true,
  }))
}

function appendGraphicsMotionStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.graphicsMotionStudyStatus === 'not_run') return
  const result = input.mediaStudy.graphicsMotionStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blocked = result?.status === 'blocked' ? result : undefined
    const blockerCode = blocked?.blockerCode
      ?? input.mediaStudy.graphicsMotionBlockerCode
      ?? 'reference_graphics_motion_study_blocked'
    const blockerMessage = blocked?.blockerMessage
      ?? (result?.status === 'needs_more_evidence' ? result.retryReason : undefined)
      ?? input.mediaStudy.graphicsMotionBlockerMessage
      ?? 'The bounded Graphics/Motion study did not complete.'
    const providerCallMade = blocked?.providerCallMade ?? false
    const modelCallMade = blocked?.modelCallMade ?? false
    const localPreparationRan = mediaReady && input.mediaStudy.fileBytesRead
    const retryAvailable = result?.retryAvailable
      ?? isRetryableGraphicsMotionBlocker(blockerCode)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.graphics_motion.evidence',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : localPreparationRan ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(localPreparationRan ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_qwen_graphics_motion_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: result?.status === 'needs_more_evidence' ? 'needs_more_evidence' : 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The bounded private-frame Graphics/Motion study remained blocked; no reusable motion rule, target operation, generated asset, or render instruction was synthesized.',
      warnings: [
        'No exact graphic asset, wording, icon identity, layout/spacing value, keyframe/curve, transition path/timing, brand/UI identity, raw frame, difference frame, or provider payload was retained.',
        ...(blocked?.temporaryFramesCleaned === false ? ['Ephemeral Graphics/Motion frame cleanup was not proven by the specialist adapter.'] : []),
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? graphicsMotionRuntimeAttempt(result) : undefined,
      fileBytesRead: localPreparationRan,
      mediaProcessingStarted: input.mediaStudy.mediaProcessingStarted,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.analyzer.adapterId,
    adapterVersion: result.analyzer.adapterVersion,
    providerId: result.analyzer.providerId,
    modelId: result.analyzer.modelId,
    modelRevision: result.analyzer.modelRevision,
    modelAggregateSha256: result.analyzer.modelAggregateSha256,
    modelRoutingPolicyVersion: result.analyzer.modelRoutingPolicyVersion,
    instructionDigestSha256: result.analyzer.analysisInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryFramesCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    result.analyzer.adapterId,
    ...(result.analyzer.providerId ? [result.analyzer.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'graphics',
      title: graphicsMotionCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.graphics_motion.evidence',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized graphics/motion observation from bounded private frames plus technical frame-difference context; it is not an instruction to copy the reference.',
        'Target media evidence, confirmed output frame, frame-layout plan, MasterTimingPlan, render strategy, timing validation, final motion QA, user review, and approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.visibleTextRelated ? ['Visible-text observations require exact OCR/text authority and target readability review.'] : []),
        ...(finding.timingRelated ? ['Timing observations require verified visual-cue timing and target-specific timing review.'] : []),
        ...(finding.brandOrUiIdentityRelated ? ['Brand/UI identity context is non-transferable and requires separate rights and target-asset approval.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.graphics_motion.evidence',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Graphics/Motion finding${result.findings.length === 1 ? '' : 's'} from bounded private frames and exact technical-motion context with cleanup and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Graphics/Motion coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No exact reference asset, text/icon identity, layout/spacing value, animation keyframe/curve, transition path/timing, brand/UI identity, raw frame, difference frame, provider payload, target operation, generated asset, or render instruction was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: graphicsMotionRuntimeAttempt(result),
    fileBytesRead: result.execution.boundedPrivateFramesRead,
    mediaProcessingStarted: true,
  }))
}

function appendCaptionDesignStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.captionDesignStudyStatus === 'not_run') return
  if (input.mediaStudy.captionDesignStudyStatus === 'observed_absent') {
    const absence = input.mediaStudy.captionDesignObservedAbsence
    if (!absence) throw new Error('Observed Caption Design absence lacks exact OCR authority.')
    const runId = `preference-skill-run-${randomUUID()}`
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'captions',
      title: 'Caption system not observed',
      summary: `No visible caption or on-screen text system was observed across all ${absence.analyzedFrameCount} exact OCR-covered samples in this bounded source window.`,
      confidence: 0.9,
      confidenceBasis: 'deterministic_derived',
      transferability: 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: 'verified_local',
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.caption_design.evidence',
      toolIds: [absence.provenance.adapterId],
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: [...absence.analysisArtifactIds],
      notes: [
        'This is an evidence-backed absence for the exact sampled source window, not a recommendation to omit captions from the target edit.',
        'ReEditPro did not invent a reference caption style, retain recognized text, call the Caption Design semantic provider, or create executable target instructions.',
      ],
    })
    input.derivedEvidence.push(output)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.caption_design.evidence',
      status: 'completed',
      runtimeSource: 'verified_local',
      readinessAtRun: 'verified_local',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [output.id],
      toolIds: [absence.provenance.adapterId],
      fallbackUsed: false,
      resultState: 'analyzed',
      retryAvailable: false,
      resultSummary: 'Completed Caption Design study with exact full-sample OCR authority and recorded that no reference caption system was observed.',
      warnings: [
        'Target caption requirements remain independent and must be chosen from the target story, accessibility needs, platform, timing, and user intent.',
      ],
      blockedReasons: [],
      providerCallMade: false,
      modelCallMade: false,
      runtimeAttempt: {
        schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
        adapterId: absence.provenance.adapterId,
        requestDigestSha256: absence.captionOcrRequestDigestSha256,
        providerCallMade: false,
        modelCallMade: false,
        workerJobCreated: absence.execution.workerJobCreated,
        temporaryInputsCleaned: true,
        internalCostStatus: absence.usage.mode === 'production_metered' ? 'metered' : 'not_incurred',
        meteredInternalCostMicros: absence.usage.meteredInternalCostMicros,
        usageEventIds: [...absence.usage.usageEventIds],
        internalCostRecordIds: [...absence.usage.internalCostRecordIds],
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
      },
      fileBytesRead: true,
      mediaProcessingStarted: true,
    }))
    return
  }
  const result = input.mediaStudy.captionDesignStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blocked = result?.status === 'blocked' ? result : undefined
    const blockerCode = blocked?.blockerCode
      ?? input.mediaStudy.captionDesignBlockerCode
      ?? 'reference_caption_design_study_blocked'
    const blockerMessage = blocked?.blockerMessage
      ?? input.mediaStudy.captionDesignBlockerMessage
      ?? 'The bounded Caption Design study did not complete.'
    const providerCallMade = blocked?.providerCallMade ?? false
    const modelCallMade = blocked?.modelCallMade ?? false
    const localPreparationRan = mediaReady && input.mediaStudy.fileBytesRead
    const retryAvailable = result?.retryAvailable
      ?? isRetryableCaptionDesignBlocker(blockerCode)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.caption_design.evidence',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : localPreparationRan ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(localPreparationRan ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_qwen_caption_design_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The bounded Caption Design study remained blocked; no caption text, reusable caption rule, target timing, target operation, generated asset, or render instruction was synthesized.',
      warnings: [
        'No recognized source wording, exact font identity, line break, highlighted word, color value, layout, animation curve, timing map, brand asset, raw frame, raw OCR output, transcript, or provider payload was retained.',
        ...(blocked?.temporaryFramesCleaned === false ? ['Ephemeral Caption Design frame cleanup was not proven by the specialist adapter.'] : []),
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? captionDesignRuntimeAttempt(result) : undefined,
      fileBytesRead: localPreparationRan,
      mediaProcessingStarted: input.mediaStudy.mediaProcessingStarted,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.analyzer.adapterId,
    adapterVersion: result.analyzer.adapterVersion,
    providerId: result.analyzer.providerId,
    modelId: result.analyzer.modelId,
    modelRevision: result.analyzer.modelRevision,
    modelAggregateSha256: result.analyzer.modelAggregateSha256,
    modelRoutingPolicyVersion: result.analyzer.modelRoutingPolicyVersion,
    instructionDigestSha256: result.analyzer.analysisInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryFramesCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    result.analyzer.adapterId,
    ...(result.analyzer.providerId ? [result.analyzer.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'captions',
      title: captionDesignCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.caption_design.evidence',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized visual Caption Design observation from bounded private frames and exact no-text OCR geometry; it is not an instruction to copy the reference.',
        'This v1 result is visual-only. Target transcript timing, confirmed aspect ratio, safe-zone and collision review, caption readability validation, MasterTimingPlan, target adaptation, user review, and approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.safeZoneRelated ? ['Safe-zone behavior must be recalculated from the target frame and target visual hierarchy.'] : []),
        ...(finding.fontOrBrandRelated ? ['Font/brand context is non-transferable without separate rights and target-asset approval.'] : []),
        ...(finding.claimRelated ? ['Claim-related caption context remains bounded by exact fact-safety evidence and source attribution.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.caption_design.evidence',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized visual Caption Design finding${result.findings.length === 1 ? '' : 's'} from bounded private frames and separately verified OCR geometry with cleanup and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Caption Design coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'Transcript timing and word timing were not available, so no speech-alignment or executable caption-timing conclusion was retained.',
      'No exact wording, font identity, line break, highlighted word, color value, layout, animation curve, timing map, brand asset, raw OCR output, raw frame, transcript, provider payload, target operation, generated asset, or render instruction was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: captionDesignRuntimeAttempt(result),
    fileBytesRead: result.execution.boundedPrivateFramesRead,
    mediaProcessingStarted: true,
  }))
}

function appendStoryEditorialStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.storyEditorialStudyStatus === 'not_run') return
  const result = input.mediaStudy.storyEditorialStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blockerCode = result?.blockerCode
      ?? input.mediaStudy.storyEditorialBlockerCode
      ?? 'reference_story_editorial_study_blocked'
    const blockerMessage = result?.blockerMessage
      ?? input.mediaStudy.storyEditorialBlockerMessage
      ?? 'The bounded Story/Editorial study did not complete.'
    const providerCallMade = result?.providerCallMade ?? false
    const modelCallMade = result?.modelCallMade ?? false
    const structuredPreparationRan = mediaReady
      && input.mediaStudy.visualLanguageStudyStatus === 'analyzed'
      && input.mediaStudy.shotDetectionStatus === 'verified_local_bounded'
    const retryAvailable = result?.retryAvailable
      ?? isRetryableStoryEditorialBlocker(blockerCode)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.story_editorial.qwen_reasoning',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : structuredPreparationRan ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(structuredPreparationRan ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_qwen_story_editorial_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The bounded structured-evidence Story/Editorial study remained blocked; no reusable story rule, exact sequence, target operation, generated asset, or render instruction was synthesized.',
      warnings: [
        'Technical change points remained nonsemantic context and could not establish story scenes, topic transitions, or meaning.',
        'No raw media, raw transcript wording, exact hook wording, exact sequence, exact timing, creator identity, provider payload, target edit operation, generation prompt, or render instruction was retained.',
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? storyEditorialRuntimeAttempt(result) : undefined,
      fileBytesRead: false,
      mediaProcessingStarted: structuredPreparationRan,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.model.adapterId,
    adapterVersion: result.model.adapterVersion,
    providerId: result.model.providerId,
    modelId: result.model.modelId,
    modelRevision: result.model.modelRevision,
    modelAggregateSha256: result.model.modelAggregateSha256,
    modelRoutingPolicyVersion: result.model.modelRoutingPolicyVersion,
    instructionDigestSha256: result.model.reasoningInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: true,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    result.model.adapterId,
    ...(result.model.providerId ? [result.model.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'story_and_pacing',
      title: storyEditorialCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.story_editorial.qwen_reasoning',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized Story/Editorial observation from bounded structured evidence; it is not an instruction to copy source wording, event order, scene sequence, timing, identity, or assets.',
        'Technical change points were treated only as nonsemantic context. Target story evidence, target-specific adaptation, change-impact review, user review, and approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.claimRelated ? ['This claim-related observation remains bounded by exact fact-safety evidence and source attribution.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.story_editorial.qwen_reasoning',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Story/Editorial finding${result.findings.length === 1 ? '' : 's'} from exact bounded evidence with no-copy, fact-safety, and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Story/Editorial coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No raw media, raw transcript, exact hook wording, exact sequence, exact timing, creator identity, provider payload, target operation, generated asset, or render instruction was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: storyEditorialRuntimeAttempt(result),
    fileBytesRead: false,
    mediaProcessingStarted: true,
  }))
}

function appendSpeechPacingStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.speechPacingStudyStatus === 'not_run') return
  const result = input.mediaStudy.speechPacingStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blockerCode = result?.blockerCode
      ?? input.mediaStudy.speechPacingBlockerCode
      ?? 'reference_speech_pacing_study_blocked'
    const blockerMessage = result?.blockerMessage
      ?? input.mediaStudy.speechPacingBlockerMessage
      ?? 'The bounded Speech/Pacing study did not complete.'
    const transcriptRead = result?.privateTranscriptArtifactRead ?? false
    const timingRead = result?.structuredTimingEvidenceRead ?? false
    const providerCallMade = result?.providerCallMade ?? false
    const modelCallMade = result?.modelCallMade ?? false
    const retryAvailable = result?.retryAvailable
      ?? isRetryableSpeechPacingBlocker(blockerCode)
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.speech_pacing.evidence',
      status: 'blocked',
      runtimeSource: providerCallMade ? 'verified_live' : transcriptRead ? 'verified_local' : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(transcriptRead ? ['faster_whisper'] : []),
        ...(result ? ['edit_reference_qwen_speech_pacing_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The bounded Speech/Pacing study remained blocked; no transcript-derived pacing finding, cut instruction, caption wording, target timing, or voice imitation was synthesized.',
      warnings: [
        'Low-level intervals remained technical signals and were not promoted to semantic pauses.',
        'No mock transcript, interpolated word alignment, source wording, exact pause map, exact cut map, caption text, voice identity, target timing, provider payload, or executable edit instruction was retained.',
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade,
      modelCallMade,
      runtimeAttempt: result ? speechPacingRuntimeAttempt(result) : undefined,
      fileBytesRead: transcriptRead,
      mediaProcessingStarted: mediaReady && (transcriptRead || timingRead),
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.analyzer.adapterId,
    adapterVersion: result.analyzer.adapterVersion,
    providerId: result.analyzer.providerId,
    modelId: result.analyzer.modelId,
    modelRevision: result.analyzer.modelRevision,
    modelAggregateSha256: result.analyzer.modelAggregateSha256,
    modelRoutingPolicyVersion: result.analyzer.modelRoutingPolicyVersion,
    instructionDigestSha256: result.analyzer.analysisInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryAudioCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    'faster_whisper',
    result.analyzer.adapterId,
    ...(result.analyzer.providerId ? [result.analyzer.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'story_and_pacing',
      title: speechPacingCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.speech_pacing.evidence',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...finding.sourceRanges.map((range) => range.rangeId),
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized Speech/Pacing observation from an exact private transcript and verified timing authority; raw transcript wording is not retained in Preference Evidence.',
        'Source ranges are evidence-only. They are not target timing, executable cut boundaries, caption text, or a pause/cut map to copy.',
        'Speech clarity, target meaning, target evidence, target-specific adaptation, change-impact review, and user approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.meaningPreservationRequired ? ['Meaning-preservation review is mandatory before any target-side timing or trim decision.'] : []),
        ...(finding.claimRelated ? ['This claim-related observation remains bounded by exact fact-safety evidence and source attribution.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.speech_pacing.evidence',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Speech/Pacing finding${result.findings.length === 1 ? '' : 's'} from exact private transcript and timing authority with no-copy, meaning-preservation, fact-safety, and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Speech/Pacing coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No raw transcript, mock transcript, interpolated alignment, exact wording, exact timing/pause/cut map, caption text, voice identity, provider payload, target operation, generated asset, or render instruction was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: speechPacingRuntimeAttempt(result),
    fileBytesRead: true,
    mediaProcessingStarted: true,
  }))
}

function appendAudioSoundDesignStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  if (input.mediaStudy.audioSoundDesignStudyStatus === 'not_run') return
  const result = input.mediaStudy.audioSoundDesignStudy
  const runId = `preference-skill-run-${randomUUID()}`
  if (!result || result.status !== 'analyzed') {
    const blockerCode = result?.status === 'blocked'
      ? result.blockerCode
      : input.mediaStudy.audioSoundDesignBlockerCode ?? 'reference_audio_sound_design_study_blocked'
    const blockerMessage = result?.status === 'blocked'
      ? result.blockerMessage
      : result?.status === 'needs_more_evidence'
        ? result.retryReason
        : input.mediaStudy.audioSoundDesignBlockerMessage ?? 'The bounded Audio/Sound Design study did not complete.'
    const retryAvailable = result?.retryAvailable
      ?? isRetryableAudioSoundDesignBlocker(blockerCode)
    const localPreparationRan = mediaReady
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: 'edit_reference.audio_sound_design.evidence',
      status: 'blocked',
      runtimeSource: result?.status === 'blocked' && result.providerCallMade
        ? 'verified_live'
        : localPreparationRan
          ? 'verified_local'
          : 'not_started',
      readinessAtRun: 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: uniqueStrings([
        ...(mediaReady ? ['ffmpeg'] : []),
        ...(result ? ['edit_reference_audio_sound_design_adapter'] : []),
      ]),
      fallbackUsed: false,
      resultState: result?.status === 'needs_more_evidence' ? 'needs_more_evidence' : 'blocked',
      retryAvailable,
      retryReasonCode: retryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: 'The provider-neutral Audio/Sound Design adapter remained blocked; no music, SFX, ambience, ducking, beat, cue, or target-mix instruction was synthesized.',
      warnings: [
        'Technical loudness and low-level intervals remained nonsemantic evidence and were not promoted to music, speech-pause, SFX, ambience, beat, or mix intent.',
        'No exact audio asset, melody, lyrics, harmony, audio fingerprint, BPM, beat grid, cue map, gain curve, mix setting, provider payload, target operation, generated audio, or library asset was retained.',
      ],
      blockedReasons: [`${blockerCode}: ${blockerMessage}`],
      providerCallMade: result?.status === 'blocked' ? result.providerCallMade : false,
      modelCallMade: result?.status === 'blocked' ? result.modelCallMade : false,
      runtimeAttempt: result?.status === 'blocked' ? audioSoundDesignRuntimeAttempt(result) : undefined,
      fileBytesRead: localPreparationRan,
      mediaProcessingStarted: localPreparationRan,
    }))
    return
  }

  const semanticRuntime: PreferenceSemanticRuntimeProvenance = {
    schemaVersion: 'edit-reference-semantic-runtime-provenance-v1',
    adapterId: result.analyzer.adapterId,
    adapterVersion: result.analyzer.adapterVersion,
    providerId: result.analyzer.providerId,
    modelId: result.analyzer.modelId,
    modelRevision: result.analyzer.modelRevision,
    modelAggregateSha256: result.analyzer.modelAggregateSha256,
    modelRoutingPolicyVersion: result.analyzer.modelRoutingPolicyVersion,
    instructionDigestSha256: result.analyzer.analysisInstructionDigestSha256,
    executionId: result.provenance.executionId,
    startedAt: result.provenance.startedAt,
    completedAt: result.provenance.completedAt,
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    workerJobCreated: result.execution.workerJobCreated,
    temporaryInputsCleaned: result.execution.temporaryAudioCleaned,
    meteredInternalCostMicros: result.usage.meteredInternalCostMicros,
    usageEventIds: [...result.usage.usageEventIds],
    internalCostRecordIds: [...result.usage.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const toolIds = uniqueStrings([
    'ffmpeg',
    result.analyzer.adapterId,
    ...(result.analyzer.providerId ? [result.analyzer.providerId] : []),
  ])
  const outputIds: string[] = []
  for (const finding of result.findings) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: 'audio_and_sfx',
      title: audioSoundDesignCategoryTitle(finding.category),
      summary: finding.summary,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability: finding.transferability === 'transferable_principle'
        ? 'transferable'
        : finding.transferability === 'context_only'
          ? 'requires_user_review'
          : 'non_transferable',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: result.runtimeSource,
      mediaStudyStatus: 'media_studied_local_partial',
      skillId: 'edit_reference.audio_sound_design.evidence',
      toolIds,
      fallbackUsed: false,
      privateAssetId: input.mediaStudy.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...finding.evidenceIds,
        ...finding.sourceRanges.map((range) => range.rangeId),
        ...(input.mediaStudy.mediaAnalysisReportId ? [input.mediaStudy.mediaAnalysisReportId] : []),
      ]),
      semanticRuntime,
      notes: [
        'This is a generalized observation from one bounded private reference mix plus exact technical authority; raw audio and provider payloads were deleted and not retained in Preference Evidence.',
        'Source ranges are evidence-only and are not target cue timing, beat grids, ducking curves, gain automation, mix settings, or executable audio operations.',
        'Target speech, visuals, beat/onset evidence, SFX cue linkage, Master Timing, SoundSync timing, QA, target-specific adaptation, change-impact review, and user approval remain required before application.',
        ...(finding.requiresUserReview ? ['This observation requires explicit user review.'] : []),
        ...(finding.nonTransferableAssetWarning ? ['The source audio asset is non-transferable and cannot become a target or library asset.'] : []),
      ],
    })
    input.derivedEvidence.push(output)
    outputIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: 'edit_reference.audio_sound_design.evidence',
    status: 'completed',
    runtimeSource: result.runtimeSource,
    readinessAtRun: result.runtimeSource,
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds: outputIds,
    toolIds,
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Produced ${result.findings.length} generalized Audio/Sound Design finding${result.findings.length === 1 ? '' : 's'} from bounded private audio with no-copy, speech-first, timing-authority, rights, privacy, and internal-cost provenance.`,
    warnings: [
      ...(result.coverage.partial ? [`Audio/Sound Design coverage was partial: ${result.coverage.missingEvidenceKinds.join(', ')}.`] : []),
      'No exact reference audio asset, melody, lyrics, harmony, fingerprint, BPM, beat grid, cue timing, ducking curve, gain value, mix setting, provider payload, target operation, generation instruction, or library promotion was retained.',
    ],
    blockedReasons: [],
    providerCallMade: result.execution.providerCallMade,
    modelCallMade: result.execution.modelCallMade,
    runtimeAttempt: audioSoundDesignRuntimeAttempt(result),
    fileBytesRead: true,
    mediaProcessingStarted: true,
  }))
}

function appendUnavailableMediaSpecialists(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  for (const definition of EDIT_REFERENCE_SEMANTIC_SPECIALISTS) {
    if (
      definition.specialistId === 'visual_language'
      && input.mediaStudy.visualLanguageStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'color_treatment'
      && input.mediaStudy.colorTreatmentStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'graphics_motion'
      && input.mediaStudy.graphicsMotionStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'caption_design'
      && input.mediaStudy.captionDesignStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'story_editorial'
      && input.mediaStudy.storyEditorialStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'speech_pacing'
      && input.mediaStudy.speechPacingStudyStatus !== 'not_run'
    ) continue
    if (
      definition.specialistId === 'audio_sound_design'
      && input.mediaStudy.audioSoundDesignStudyStatus !== 'not_run'
    ) continue
    const visualLanguageRuntimeRetry = definition.specialistId === 'visual_language'
      && mediaReady
      && input.mediaStudy.representativeFrameCount > 0
      && input.mediaStudy.keyframeSampleCount > 0
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const storyEditorialRuntimeRetry = definition.specialistId === 'story_editorial'
      && mediaReady
      && input.mediaStudy.representativeFrameCount > 0
      && input.mediaStudy.keyframeSampleCount > 0
      && input.mediaStudy.shotDetectionStatus === 'verified_local_bounded'
      && (input.mediaStudy.hasAudio !== true || input.mediaStudy.audioExtracted === true)
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const speechPacingRuntimeRetry = definition.specialistId === 'speech_pacing'
      && mediaReady
      && input.mediaStudy.hasAudio === true
      && input.mediaStudy.audioExtracted === true
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const captionOcrRuntimeRetry = definition.specialistId === 'caption_design'
      && mediaReady
      && input.mediaStudy.representativeFrameCount > 0
      && input.mediaStudy.technicalCaptionRegions.status === 'verified_local_bounded'
      && input.mediaStudy.technicalCaptionRegions.technicalTextRegionCandidateAnalysisRan
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const colorTreatmentRuntimeRetry = definition.specialistId === 'color_treatment'
      && mediaReady
      && input.mediaStudy.representativeFrameCount > 0
      && input.mediaStudy.technicalColor.status === 'verified_local_bounded'
      && input.mediaStudy.technicalColor.technicalDistributionAnalysisRan
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const audioSoundDesignRuntimeRetry = definition.specialistId === 'audio_sound_design'
      && mediaReady
      && input.mediaStudy.hasAudio === true
      && input.mediaStudy.audioExtracted === true
      && input.mediaStudy.technicalAudio.status === 'verified_local'
      && input.mediaStudy.technicalAudio.semanticAudioAnalysisRan === false
      && input.mediaStudy.technicalAudioLowLevel.status === 'verified_local_bounded'
      && input.mediaStudy.technicalAudioLowLevel.semanticAudioAnalysisRan === false
      && input.mediaStudy.technicalAudioLowLevel.musicOrSfxAnalysisRan === false
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const graphicsMotionRuntimeRetry = definition.specialistId === 'graphics_motion'
      && mediaReady
      && input.mediaStudy.technicalMotion.status === 'verified_local_bounded'
      && input.mediaStudy.technicalMotion.technicalFrameDifferenceAnalysisRan
      && input.mediaStudy.technicalMotion.semanticMotionAnalysisRan === false
      && input.mediaStudy.fileBytesRead
      && input.mediaStudy.mediaProcessingStarted
    const runtimeRetryAvailable = visualLanguageRuntimeRetry
      || storyEditorialRuntimeRetry
      || speechPacingRuntimeRetry
      || captionOcrRuntimeRetry
      || colorTreatmentRuntimeRetry
      || audioSoundDesignRuntimeRetry
      || graphicsMotionRuntimeRetry
    const runId = `preference-skill-run-${randomUUID()}`
    input.skillRuns.push(createSkillRun({
      input: input.input,
      orchestrationId: input.orchestrationId,
      id: runId,
      skillId: definition.skillId,
      status: 'blocked',
      runtimeSource: 'not_started',
      readinessAtRun: mediaReady ? 'degraded' : 'blocked',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [],
      toolIds: [],
      fallbackUsed: true,
      resultState: 'blocked',
      retryAvailable: runtimeRetryAvailable,
      retryReasonCode: runtimeRetryAvailable ? 'runtime_recovery_then_retry' : undefined,
      resultSummary: visualLanguageRuntimeRetry
        ? 'Private representative frames and bounded keyframes were prepared and deleted, but this study did not receive the reviewed Visual Language runtime and production internal-cost authority.'
        : storyEditorialRuntimeRetry
          ? 'Private representative frames, bounded keyframes, technical change-point candidates, and available audio were prepared and deleted, but Story/Editorial did not run because the exact structured evidence and canonical production internal-cost authority were unavailable.'
        : speechPacingRuntimeRetry
          ? 'Private reference audio was prepared, but Speech/Pacing did not run because no approved transcript or alignment result exists.'
          : captionOcrRuntimeRetry
          ? 'Private reference frames and bounded text-region geometry were prepared, but Caption Design did not run because no approved product OCR result or transcript timing authority exists.'
          : colorTreatmentRuntimeRetry
            ? 'Private reference frames and bounded technical color distributions were prepared, but Color Treatment did not run because no approved semantic color-analysis adapter exists.'
            : audioSoundDesignRuntimeRetry
              ? 'Private reference audio, bounded technical loudness, and low-level amplitude intervals were prepared, but Audio/Sound Design did not run because no approved semantic audio or SoundSync analysis adapter exists.'
              : graphicsMotionRuntimeRetry
                ? 'Private reference video and bounded technical frame-difference activity were prepared, but Graphics/Motion did not run because no approved semantic frame or scene analysis adapter exists.'
              : 'This specialist did not run against the private media. Manual evidence may still provide a separately labelled fallback.',
      warnings: visualLanguageRuntimeRetry
        ? ['No composition, framing, shot scale, camera behavior, scene rhythm, visual density, B-roll, transition, caption, overlay, color, lighting, storytelling, exact layout, or reusable Visual Language rule was synthesized from the prepared frames.']
        : storyEditorialRuntimeRetry
          ? ['Technical change-point candidates are not semantic scenes. No hook, chapter, story beat, narrative arc, pacing logic, editorial emphasis, causal structure, emotional progression, exact sequence or timing, or reusable Story/Editorial rule was synthesized from the prepared media.']
        : speechPacingRuntimeRetry
          ? ['No transcript text, word timing, speaker segmentation, pause meaning, hook phrasing, or cut opportunity was synthesized from the audio.']
          : captionOcrRuntimeRetry
          ? ['No recognized caption text, font, weight, line break, timing, animation, speech alignment, or reusable caption-design rule was synthesized from the frames.']
          : colorTreatmentRuntimeRetry
            ? ['No creative palette, temperature, white balance, skin-tone policy, scene match, LUT, target grade, or reusable Color Treatment rule was synthesized from the technical measurements.']
            : audioSoundDesignRuntimeRetry
              ? ['No music mood, music energy, tempo, beat grid, voice/music balance, ducking, SFX density or timing, ambience, silence or breathing-room meaning, speech-protection rule, exact music or SFX asset, or reusable Audio/Sound Design rule was synthesized from the technical measurements.']
              : graphicsMotionRuntimeRetry
                ? ['No title, card, lower-third, icon, spacing or layout hierarchy, motion intensity, entry/exit behavior, overlay placement, UI demonstration pattern, transition motion, exact graphic or layout asset, or reusable Graphics/Motion rule was synthesized from the technical measurements.']
              : mediaReady ? ['Local media structure is available, but it does not prove this specialist result.'] : [],
      blockedReasons: visualLanguageRuntimeRetry
        ? ['Private frame preparation succeeded, but the integrated Visual Language runtime and production internal-cost authority were not supplied to this Edit Reference study. Restore the approved runtime configuration and exact cost authority, then retry.']
        : storyEditorialRuntimeRetry
          ? ['Private media preparation succeeded, but the installed Story/Editorial adapter did not receive analyzed Visual Language, separately authorized transcript/timing and fact-safety evidence when applicable, plus canonical production internal-cost authority. Marker Chat and autonomous-planner schemas must not be repurposed. Restore the exact evidence and authority, then retry.']
        : speechPacingRuntimeRetry
          ? ['Private audio extraction succeeded, but the approved transcript/alignment runtime and model-weight authority are unavailable to this Edit Reference study. Restore that runtime, then retry.']
          : captionOcrRuntimeRetry
          ? ['Private caption-frame preparation succeeded, but the approved product OCR runtime/result authority, reviewed language-pack authority, and transcript-timing runtime are unavailable to this Edit Reference study. Restore those authorities and runtimes, then retry.']
          : colorTreatmentRuntimeRetry
            ? ['Private technical color preparation succeeded, but the approved semantic color-analysis adapter and production internal-cost authority are unavailable to this Edit Reference study. Restore that runtime and authority, then retry.']
            : audioSoundDesignRuntimeRetry
              ? ['Private technical audio preparation succeeded, but the approved semantic audio/SoundSync analysis adapter and production internal-cost authority are unavailable to this Edit Reference study. Restore that runtime and authority, then retry.']
              : graphicsMotionRuntimeRetry
                ? ['Private technical frame-difference preparation succeeded, but the approved semantic graphics/motion analysis adapter and production internal-cost authority are unavailable to this Edit Reference study. Restore that runtime and authority, then retry.']
              : [definition.unavailableReason],
    }))
  }
}

function isRetryableMediaStudyBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_media_probe_missing'
    || blockerCode === 'reference_media_local_study_failed'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function isRetryableVisualLanguageBlocker(blockerCode: string): boolean {
  return ![
    'ephemeral_cleanup_failed',
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function visualLanguageCategoryTitle(category: EditReferenceVisualLanguageFindingCategory): string {
  const titles: Record<EditReferenceVisualLanguageFindingCategory, string> = {
    composition_hierarchy: 'Visual composition hierarchy',
    framing_and_shot_scale: 'Framing and shot-scale language',
    subject_placement: 'Subject-placement language',
    camera_behavior: 'Camera-behavior language',
    scene_rhythm: 'Scene-rhythm language',
    visual_density: 'Visual-density language',
    broll_pattern: 'B-roll support pattern',
    transition_language: 'Transition language',
    caption_visible_text_and_overlay: 'Caption and overlay geometry',
    graphic_overlay_language: 'Graphic-overlay language',
    color_contrast_and_lighting: 'Color, contrast, and lighting language',
    visual_storytelling: 'Visual storytelling language',
  }
  return titles[category]
}

function colorTreatmentCategoryTitle(category: EditReferenceColorTreatmentFindingCategory): string {
  const titles: Record<EditReferenceColorTreatmentFindingCategory, string> = {
    palette_relationship: 'Color relationship principle',
    temperature_character: 'Temperature character',
    white_balance_character: 'White-balance character',
    contrast_structure: 'Contrast structure',
    saturation_vibrance: 'Saturation and vibrance character',
    luma_distribution: 'Luma distribution character',
    highlight_rolloff: 'Highlight-rolloff character',
    shadow_treatment: 'Shadow-treatment character',
    skin_tone_protection: 'Skin-tone protection principle',
    scene_consistency: 'Scene-consistency principle',
    overall_color_character: 'Overall color character',
  }
  return titles[category]
}

function graphicsMotionCategoryTitle(category: EditReferenceGraphicsMotionFindingCategory): string {
  const titles: Record<EditReferenceGraphicsMotionFindingCategory, string> = {
    titles: 'Title-system principle',
    cards: 'Card-system principle',
    lower_thirds: 'Lower-third principle',
    icons: 'Icon-treatment principle',
    spacing: 'Spacing-rhythm principle',
    layout_hierarchy: 'Graphics layout hierarchy',
    motion_intensity: 'Motion-intensity principle',
    entry_exit_behavior: 'Entry and exit behavior',
    overlay_placement: 'Overlay-placement principle',
    ui_demonstration_patterns: 'UI demonstration principle',
    transition_motion: 'Transition-motion principle',
  }
  return titles[category]
}

function captionDesignCategoryTitle(category: EditReferenceCaptionDesignFindingCategory): string {
  const titles: Record<EditReferenceCaptionDesignFindingCategory, string> = {
    font_character: 'Caption font-character principle',
    weight_treatment: 'Caption weight-treatment principle',
    size_hierarchy: 'Caption size-hierarchy principle',
    placement: 'Caption placement principle',
    safe_zone_behavior: 'Caption safe-zone behavior',
    line_break_pattern: 'Caption line-break principle',
    highlighted_word_treatment: 'Highlighted-word treatment principle',
    color_treatment: 'Caption color-treatment principle',
    stroke_shadow_background: 'Caption contrast-support principle',
    animation_style: 'Caption animation-style principle',
    entry_exit_timing: 'Caption entry and exit principle',
    caption_density: 'Caption-density principle',
    spacing: 'Caption spacing principle',
    speech_alignment: 'Caption speech-alignment context',
    readability: 'Caption readability principle',
  }
  return titles[category]
}

function storyEditorialCategoryTitle(category: EditReferenceStoryEditorialFindingCategory): string {
  const titles: Record<EditReferenceStoryEditorialFindingCategory, string> = {
    hook_function: 'Hook function',
    narrative_arc: 'Narrative-arc principle',
    topic_transition: 'Topic-transition principle',
    emotional_progression: 'Emotional-progression principle',
    problem_solution_structure: 'Problem-to-solution structure',
    education_demo_structure: 'Education and demonstration structure',
    information_density: 'Information-density principle',
    broll_meaning_support: 'B-roll meaning-support principle',
    pacing_section: 'Section-pacing principle',
  }
  return titles[category]
}

function speechPacingCategoryTitle(category: EditReferenceSpeechPacingFindingCategory): string {
  const titles: Record<EditReferenceSpeechPacingFindingCategory, string> = {
    transcript_structure: 'Transcript-structure evidence',
    segment_timing: 'Segment-timing evidence',
    word_timing: 'Word-timing evidence',
    speaker_turn_pattern: 'Speaker-turn pattern',
    pause_pattern: 'Pause-pattern principle',
    sentence_rhythm: 'Sentence-rhythm principle',
    hook_phrasing_function: 'Hook-phrasing function',
    speech_density: 'Speech-density principle',
    safe_cut_opportunity: 'Source-specific cut review candidate',
    caption_timing_evidence: 'Caption-timing evidence',
  }
  return titles[category]
}

function audioSoundDesignCategoryTitle(category: EditReferenceAudioSoundDesignFindingCategory): string {
  const titles: Record<EditReferenceAudioSoundDesignFindingCategory, string> = {
    music_mood: 'Music-mood principle',
    music_energy: 'Music-energy principle',
    tempo_character: 'Tempo-character principle',
    voice_music_balance: 'Voice-and-music balance principle',
    ducking_behavior: 'Speech-first ducking principle',
    sfx_density: 'SFX-density principle',
    sfx_timing: 'SFX cue-linkage principle',
    ambience: 'Ambience principle',
    silence_breathing_room: 'Silence-and-breathing-room principle',
    beat_alignment: 'Beat-alignment principle',
    speech_protection: 'Speech-protection principle',
  }
  return titles[category]
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function visualRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['visualLanguageStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.model.adapterId
      : 'edit_reference_qwen_visual_language_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : result.providerCallMade,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : result.modelCallMade,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : result.workerJobCreated,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryFramesCleaned
      : result.temporaryFramesCleaned,
    internalCostStatus: analyzed
      ? result.usage.mode === 'production_metered'
        ? 'metered'
        : 'not_incurred'
      : result.internalCostStatus,
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : result.meteredInternalCostMicros,
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...result.usageEventIds],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...result.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function colorTreatmentRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['colorTreatmentStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  const blocked = result.status === 'blocked' ? result : undefined
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.analyzer.adapterId
      : 'edit_reference_qwen_color_treatment_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : blocked?.providerCallMade ?? false,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : blocked?.modelCallMade ?? false,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : blocked?.workerJobCreated ?? false,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryFramesCleaned
      : blocked?.temporaryFramesCleaned ?? true,
    internalCostStatus: analyzed
      ? 'metered'
      : blocked?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : blocked?.meteredInternalCostMicros ?? '0',
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...(blocked?.usageEventIds ?? [])],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...(blocked?.internalCostRecordIds ?? [])],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function graphicsMotionRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['graphicsMotionStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  const blocked = result.status === 'blocked' ? result : undefined
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.analyzer.adapterId
      : 'edit_reference_qwen_graphics_motion_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : blocked?.providerCallMade ?? false,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : blocked?.modelCallMade ?? false,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : blocked?.workerJobCreated ?? false,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryFramesCleaned
      : blocked?.temporaryFramesCleaned ?? true,
    internalCostStatus: analyzed
      ? 'metered'
      : blocked?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : blocked?.meteredInternalCostMicros ?? '0',
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...(blocked?.usageEventIds ?? [])],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...(blocked?.internalCostRecordIds ?? [])],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function captionDesignRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['captionDesignStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  const blocked = result.status === 'blocked' ? result : undefined
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.analyzer.adapterId
      : 'edit_reference_qwen_caption_design_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : blocked?.providerCallMade ?? false,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : blocked?.modelCallMade ?? false,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : blocked?.workerJobCreated ?? false,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryFramesCleaned
      : blocked?.temporaryFramesCleaned ?? true,
    internalCostStatus: analyzed
      ? 'metered'
      : blocked?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : blocked?.meteredInternalCostMicros ?? null,
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...(blocked?.usageEventIds ?? [])],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...(blocked?.internalCostRecordIds ?? [])],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function storyEditorialRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['storyEditorialStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.model.adapterId
      : 'edit_reference_qwen_story_editorial_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : result.providerCallMade,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : result.modelCallMade,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : result.workerJobCreated,
    temporaryInputsCleaned: true,
    internalCostStatus: analyzed
      ? 'metered'
      : result.internalCostStatus,
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : result.meteredInternalCostMicros,
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...result.usageEventIds],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...result.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function speechPacingRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['speechPacingStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.analyzer.adapterId
      : 'edit_reference_qwen_speech_pacing_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : result.providerCallMade,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : result.modelCallMade,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : result.workerJobCreated,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryAudioCleaned
      : result.temporaryAudioCleaned,
    internalCostStatus: analyzed
      ? result.execution.providerCallMade ? 'metered' : 'not_incurred'
      : result.internalCostStatus,
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : result.meteredInternalCostMicros,
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...result.usageEventIds],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...result.internalCostRecordIds],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function audioSoundDesignRuntimeAttempt(
  result: NonNullable<EditReferenceLocalMediaStudyResult['audioSoundDesignStudy']>,
): PreferenceSkillRuntimeAttemptProvenance {
  const analyzed = result.status === 'analyzed'
  const blocked = result.status === 'blocked' ? result : undefined
  return {
    schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
    adapterId: analyzed
      ? result.analyzer.adapterId
      : 'edit_reference_audio_sound_design_adapter',
    requestDigestSha256: result.requestDigestSha256,
    providerCallMade: analyzed
      ? result.execution.providerCallMade
      : blocked?.providerCallMade ?? false,
    modelCallMade: analyzed
      ? result.execution.modelCallMade
      : blocked?.modelCallMade ?? false,
    workerJobCreated: analyzed
      ? result.execution.workerJobCreated
      : blocked?.workerJobCreated ?? false,
    temporaryInputsCleaned: analyzed
      ? result.execution.temporaryAudioCleaned
      : blocked?.temporaryAudioCleaned ?? true,
    internalCostStatus: analyzed
      ? result.execution.providerCallMade ? 'metered' : 'not_incurred'
      : blocked?.internalCostStatus ?? 'not_incurred',
    meteredInternalCostMicros: analyzed
      ? result.usage.meteredInternalCostMicros
      : blocked?.meteredInternalCostMicros ?? '0',
    usageEventIds: analyzed
      ? [...result.usage.usageEventIds]
      : [...(blocked?.usageEventIds ?? [])],
    internalCostRecordIds: analyzed
      ? [...result.usage.internalCostRecordIds]
      : [...(blocked?.internalCostRecordIds ?? [])],
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}

function isRetryableColorTreatmentBlocker(blockerCode: string): boolean {
  return ![
    'ephemeral_cleanup_failed',
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableGraphicsMotionBlocker(blockerCode: string): boolean {
  return ![
    'ephemeral_cleanup_failed',
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableCaptionDesignBlocker(blockerCode: string): boolean {
  return ![
    'ephemeral_cleanup_failed',
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableStoryEditorialBlocker(blockerCode: string): boolean {
  return ![
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableSpeechPacingBlocker(blockerCode: string): boolean {
  return ![
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'privacy_policy_denied',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableAudioSoundDesignBlocker(blockerCode: string): boolean {
  return ![
    'ephemeral_cleanup_failed',
    'copy_safety_violation',
    'internal_cost_usage_unverified',
    'privacy_policy_denied',
    'reference_media_ephemeral_cleanup_failed',
  ].includes(blockerCode)
}

function isRetryableTechnicalAudioBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_audio_technical_study_failed'
    || blockerCode === 'reference_audio_loudness_unavailable'
    || blockerCode === 'reference_audio_loudness_failed'
}

function isRetryableTechnicalAudioLowLevelBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_audio_low_level_study_failed'
    || blockerCode === 'reference_audio_extract_unavailable'
    || blockerCode === 'audio_low_level_duration_unavailable'
    || blockerCode === 'ffmpeg_audio_low_level_scan_failed'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function isRetryableTechnicalSourceConditionBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_source_condition_study_failed'
    || blockerCode === 'ffmpeg_source_condition_scan_failed'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function isRetryableTechnicalEdgeWidthBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_edge_width_signal_study_failed'
    || blockerCode === 'edge_width_signal_duration_unavailable'
    || blockerCode === 'ffmpeg_edge_width_signal_scan_failed'
    || blockerCode === 'edge_width_signal_samples_unavailable'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function isRetryableTechnicalCaptionRegionBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_caption_region_signal_study_failed'
    || blockerCode === 'ffmpeg_caption_region_signal_scan_failed'
    || blockerCode === 'caption_region_signal_samples_unavailable'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function isRetryableTechnicalColorBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_color_signal_study_failed'
    || blockerCode === 'ffmpeg_color_signal_scan_failed'
    || blockerCode === 'color_signal_samples_unavailable'
}

function isRetryableTechnicalMotionBlocker(blockerCode: string | undefined): boolean {
  return blockerCode === 'reference_motion_signal_study_failed'
    || blockerCode === 'ffmpeg_motion_signal_scan_failed'
    || blockerCode === 'motion_signal_samples_unavailable'
    || blockerCode === 'reference_media_ephemeral_cleanup_failed'
}

function technicalColorMeasurementNote(technical: EditReferenceLocalMediaStudyResult['technicalColor']): string {
  return `Technical 8-bit proxy signal: average luma ${formatSignalValue(technical.lumaAverage8Bit)}, observed luma ${formatSignalValue(technical.lumaObservedMinimum8Bit)}–${formatSignalValue(technical.lumaObservedMaximum8Bit)}, robust luma range ${formatSignalValue(technical.lumaRobustRangeAverage8Bit)}, average saturation ${formatSignalValue(technical.saturationAverage8Bit)}, robust saturation range ${formatSignalValue(technical.saturationRobustRangeAverage8Bit)}, average U/V ${formatSignalValue(technical.chromaUAverage8Bit)}/${formatSignalValue(technical.chromaVAverage8Bit)}, temporal luma/chroma delta ${formatSignalValue(technical.temporalLumaDifferenceAverage8Bit)}/${formatSignalValue(technical.temporalChromaDifferenceAverage8Bit)}, maximum out-of-range ratio ${formatRatioValue(technical.outOfRangePixelRatioMaximum)}.`
}

function technicalColorMetadataNote(technical: EditReferenceLocalMediaStudyResult['technicalColor']): string {
  const metadata = [
    technical.pixelFormat ? `pixel format ${technical.pixelFormat}` : undefined,
    technical.colorSpace ? `space ${technical.colorSpace}` : undefined,
    technical.colorTransfer ? `transfer ${technical.colorTransfer}` : undefined,
    technical.colorPrimaries ? `primaries ${technical.colorPrimaries}` : undefined,
    technical.colorRange ? `range ${technical.colorRange}` : undefined,
  ].filter((value): value is string => Boolean(value))
  return `Allowlisted stream color metadata: ${metadata.join(', ') || 'not signaled'}; HDR transfer classification ${technical.hdrTransfer}.`
}

function technicalMotionMeasurementNote(technical: EditReferenceLocalMediaStudyResult['technicalMotion']): string {
  return `Technical 8-bit adjacent-sample difference signal: average/maximum luma ${formatSignalValue(technical.lumaDifferenceAverage8Bit)}/${formatSignalValue(technical.lumaDifferenceMaximum8Bit)}, median/90th-percentile luma ${formatSignalValue(technical.lumaDifferenceMedian8Bit)}/${formatSignalValue(technical.lumaDifference90thPercentile8Bit)}, average/maximum chroma ${formatSignalValue(technical.chromaDifferenceAverage8Bit)}/${formatSignalValue(technical.chromaDifferenceMaximum8Bit)}, active/high-activity ratios ${formatRatioValue(technical.activeSampleRatio)}/${formatRatioValue(technical.highActivitySampleRatio)}.`
}

function formatSignalValue(value: number | undefined): string {
  return value === undefined ? 'unavailable' : value.toFixed(3).replace(/\.0+$/, '')
}

function formatRatioValue(value: number | undefined): string {
  return value === undefined ? 'unavailable' : value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

function formatDuration(value: number | undefined): string {
  return typeof value === 'number' ? `${value.toFixed(2)} seconds` : 'duration unavailable'
}

function formatDimensions(width: number | undefined, height: number | undefined): string {
  return width && height ? `${width}×${height}` : 'dimensions unavailable'
}

function formatFrameRate(value: number | undefined): string {
  return typeof value === 'number' && value > 0 ? `${value.toFixed(3).replace(/\.0+$/, '')} fps` : 'frame rate unavailable'
}

function createManualDerivedEvidence(
  input: OrchestrationInput,
  orchestrationId: string,
  runId: string,
  goal: EditReferenceStudyGoal,
  records: PreferenceEvidenceRecord[],
  definition: SkillDefinition,
): PreferenceEvidenceRecord {
  const transferability = records.some((record) => record.transferability === 'do_not_copy')
    ? 'do_not_copy'
    : records.some((record) => record.transferability === 'requires_user_review')
      ? 'requires_user_review'
      : records.some((record) => record.transferability === 'non_transferable')
        ? 'non_transferable'
        : 'transferable'
  return createDerivedEvidence({
    input,
    orchestrationId,
    runId,
    category: goal,
    title: `${goalLabel(goal)} evidence summary`,
    summary: `User-described direction: ${records.map((record) => record.summary).join(' ')}`.slice(0, 4_000),
    confidence: 0.55,
    confidenceBasis: 'deterministic_derived',
    transferability,
    sourceEvidenceIds: records.map((record) => record.id),
    runtimeSource: 'fallback',
    mediaStudyStatus: 'not_applicable',
    skillId: definition.skillId,
    toolIds: definition.toolIds,
    fallbackUsed: true,
    notes: [...definition.warnings, 'This result summarizes user assertions; it is not a claim about unprocessed reference media.'],
  })
}

function createCopySafetyEvidence(
  input: OrchestrationInput,
  orchestrationId: string,
  runId: string,
  sourceEvidence: PreferenceEvidenceRecord[],
  risks: EditReferenceCopyRiskKind[],
): PreferenceEvidenceRecord {
  return createDerivedEvidence({
    input,
    orchestrationId,
    runId,
    category: 'copy_safety',
    title: 'Transferability and copy-safety review',
    summary: risks.length > 0
      ? `Review required: ${risks.map(copyRiskLabel).join(', ')} cannot become reusable editing instructions.`
      : 'Saved evidence is framed as transferable editing judgment rather than direct-copy instructions.',
    confidence: 1,
    confidenceBasis: 'deterministic_derived',
    transferability: risks.length > 0 ? 'do_not_copy' : 'transferable',
    sourceEvidenceIds: sourceEvidence.map((record) => record.id),
    runtimeSource: 'verified_mock',
    mediaStudyStatus: 'not_applicable',
    skillId: 'edit_reference.transferability.copy_safety',
    toolIds: ['deterministic_copy_safety_classifier'],
    fallbackUsed: false,
    notes: risks.length > 0
      ? ['The flagged categories are preserved only as safety findings and must not be applied as style instructions.']
      : ['Exact shots, timing, music, SFX, layouts, identity, and reference footage remain prohibited even when not requested.'],
  })
}

function createDerivedEvidence(input: {
  input: OrchestrationInput
  orchestrationId: string
  runId: string
  category: PreferenceEvidenceCategory
  title: string
  summary: string
  confidence: number
  confidenceBasis: PreferenceEvidenceRecord['confidenceBasis']
  transferability: PreferenceEvidenceRecord['transferability']
  sourceEvidenceIds: string[]
  runtimeSource: PreferenceEvidenceRecord['provenance']['runtimeSource']
  mediaStudyStatus: PreferenceEvidenceRecord['provenance']['mediaStudyStatus']
  skillId: string
  toolIds: string[]
  fallbackUsed: boolean
  privateAssetId?: string
  analysisArtifactIds?: string[]
  semanticRuntime?: PreferenceSemanticRuntimeProvenance
  notes: string[]
}): PreferenceEvidenceRecord {
  return {
    id: `preference-evidence-${randomUUID()}`,
    workspaceId: input.input.workspaceId,
    editReferenceId: input.input.editReferenceId,
    studySessionId: input.input.study.id,
    orchestrationId: input.orchestrationId,
    sourceType: 'derived_skill_evidence',
    category: input.category,
    title: input.title,
    summary: input.summary,
    revision: 1,
    confidence: input.confidence,
    confidenceBasis: input.confidenceBasis,
    transferability: input.transferability,
    provenance: {
      runtimeSource: input.runtimeSource,
      sourceEvidenceIds: input.sourceEvidenceIds,
      skillRunId: input.runId,
      ...(input.privateAssetId ? { privateAssetId: input.privateAssetId } : {}),
      ...(input.analysisArtifactIds ? { analysisArtifactIds: input.analysisArtifactIds } : {}),
      mediaStudyStatus: input.mediaStudyStatus,
      toolIds: input.toolIds,
      skillIds: [input.skillId],
      fallbackUsed: input.fallbackUsed,
      ...(input.semanticRuntime ? { semanticRuntime: structuredClone(input.semanticRuntime) } : {}),
      notes: input.notes,
    },
    createdAt: input.input.now,
    updatedAt: input.input.now,
  }
}

function createSkillRun(input: {
  input: OrchestrationInput
  orchestrationId: string
  id: string
  skillId: string
  status: PreferenceSkillRunRecord['status']
  runtimeSource: PreferenceSkillRunRecord['runtimeSource']
  readinessAtRun: PreferenceSkillRunRecord['readinessAtRun']
  inputEvidenceIds: string[]
  outputEvidenceIds: string[]
  toolIds: string[]
  fallbackUsed: boolean
  resultState: NonNullable<PreferenceSkillRunRecord['resultState']>
  retryAvailable: boolean
  retryReasonCode?: PreferenceSkillRunRecord['retryReasonCode']
  resultSummary: string
  warnings: string[]
  blockedReasons: string[]
  fileBytesRead?: boolean
  mediaProcessingStarted?: boolean
  providerCallMade?: boolean
  modelCallMade?: boolean
  runtimeAttempt?: PreferenceSkillRuntimeAttemptProvenance
}): PreferenceSkillRunRecord {
  return {
    id: input.id,
    workspaceId: input.input.workspaceId,
    editReferenceId: input.input.editReferenceId,
    studySessionId: input.input.study.id,
    orchestrationId: input.orchestrationId,
    skillId: input.skillId,
    status: input.status,
    runtimeSource: input.runtimeSource,
    readinessAtRun: input.readinessAtRun,
    inputEvidenceIds: input.inputEvidenceIds,
    outputEvidenceIds: input.outputEvidenceIds,
    toolIds: input.toolIds,
    fallbackUsed: input.fallbackUsed,
    resultContractVersion: EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION,
    resultState: input.resultState,
    retryAvailable: input.retryAvailable,
    ...(input.retryReasonCode ? { retryReasonCode: input.retryReasonCode } : {}),
    resultSummary: input.resultSummary,
    warnings: input.warnings,
    blockedReasons: input.blockedReasons,
    providerCallMade: input.providerCallMade ?? false,
    modelCallMade: input.modelCallMade ?? false,
    ...(input.runtimeAttempt ? { runtimeAttempt: structuredClone(input.runtimeAttempt) } : {}),
    fileBytesRead: input.fileBytesRead ?? false,
    externalUrlFetched: false,
    mediaProcessingStarted: input.mediaProcessingStarted ?? false,
    workerJobCreated: false,
    createdAt: input.input.now,
    updatedAt: input.input.now,
  }
}

function detectCopyRisks(evidence: PreferenceEvidenceRecord[]): EditReferenceCopyRiskKind[] {
  return detectEditReferenceCopyRisks(evidence
    .filter((record) => record.transferability !== 'do_not_copy')
    .map((record) => `${record.title} ${record.summary}`))
}

function detectEvidenceConflicts(evidence: PreferenceEvidenceRecord[]): EvidenceConflictKind[] {
  const text = evidence
    .filter((record) => record.transferability !== 'do_not_copy' && record.transferability !== 'non_transferable')
    .map((record) => `${record.title} ${record.summary}`)
    .join(' ')
  const restrained = containsUnnegated(text, /\b(?:slow|restrained|measured|deliberate) (?:pace|pacing|cuts?|rhythm)\b/ig)
  const rapid = containsUnnegated(text, /\b(?:fast|rapid|quick|high-energy|energetic) (?:pace|pacing|cuts?|rhythm)\b/ig)
  return restrained && rapid ? ['restrained_vs_rapid_pacing'] : []
}

function containsUnnegated(text: string, pattern: RegExp): boolean {
  for (const match of text.matchAll(pattern)) {
    if (match.index !== undefined && !hasEditReferenceNegationNear(text, match.index)) return true
  }
  return false
}

function summarizeMetadata(records: PreferenceEvidenceRecord[]): string {
  const summaries = records.map((record) => {
    const metadata = record.mediaMetadata
    if (!metadata) return record.title
    const dimensions = metadata.width && metadata.height ? `${metadata.width}×${metadata.height}` : 'dimensions not provided'
    const duration = metadata.durationSeconds === undefined ? 'duration not provided' : `${metadata.durationSeconds} seconds`
    const audio = metadata.hasAudio === undefined ? 'audio presence not provided' : metadata.hasAudio ? 'audio present' : 'no audio indicated'
    return `${record.title}: ${duration}, ${dimensions}, ${audio}`
  })
  return `${summaries.join('; ')}. Metadata only—the video itself was not studied.`
}

function uniqueSkillDefinitions(definitions: SkillDefinition[]): SkillDefinition[] {
  const seen = new Set<string>()
  return definitions.filter((definition) => {
    if (seen.has(definition.skillId)) return false
    seen.add(definition.skillId)
    return true
  })
}

function fallbackSkill(
  skillId: string,
  readinessAtRun: PreferenceSkillRunRecord['readinessAtRun'],
  resultSummary: string,
  warnings: string[],
): SkillDefinition {
  return {
    skillId,
    readinessAtRun,
    runtimeSource: 'fallback',
    fallbackUsed: true,
    resultState: 'manual_evidence',
    retryAvailable: false,
    resultSummary,
    warnings,
    blockedReasons: [],
    toolIds: [],
  }
}

function blockedSkill(skillId: string, reason: string): SkillDefinition {
  return {
    skillId,
    readinessAtRun: 'blocked',
    runtimeSource: 'not_started',
    fallbackUsed: true,
    resultState: 'blocked',
    retryAvailable: false,
    resultSummary: 'This analysis was not run.',
    warnings: [],
    blockedReasons: [reason],
    toolIds: [],
  }
}

function buildAssistantMessage(
  status: PreferenceEvidenceStudyOrchestrationResult['studyStatus'],
  uncoveredGoals: EditReferenceStudyGoal[],
  copyRisks: EditReferenceCopyRiskKind[],
  conflicts: EvidenceConflictKind[],
  localMediaStudied: boolean,
  visualLanguageStudied: boolean,
  longFormReviewSelected: boolean,
  longFormReviewOnly: boolean,
): string {
  if (status === 'needs_user_review') {
    if (longFormReviewOnly) {
      return 'The complete reference study was reviewed, but no finding was selected for adaptation. Keep it as context or choose at least one safe, generalized principle to adapt before preparing Preference DNA.'
    }
    if (conflicts.length > 0 && copyRisks.length === 0) {
      return 'The evidence contains conflicting pacing direction. Choose whether restrained/measured or rapid/high-energy pacing should take priority before continuing.'
    }
    if (conflicts.length > 0) {
      return `The evidence contains conflicting pacing direction and direct-copy requests involving ${copyRisks.map(copyRiskLabel).join(', ')}. Resolve both findings before continuing.`
    }
    return `The evidence review found direct-copy requests involving ${copyRisks.map(copyRiskLabel).join(', ')}. Those details are blocked from reusable Preference DNA. Revise or clarify the evidence before continuing.`
  }
  if (status === 'needs_clarification') {
    if (longFormReviewSelected) {
      return `The complete long-form findings you selected were preserved as reviewed evidence, but clearer direction is still needed for ${uncoveredGoals.map(goalLabel).join(', ')} before Preference DNA can be prepared. Nothing was applied automatically.`
    }
    if (localMediaStudied) {
      return `The private video received bounded technical media analysis${visualLanguageStudied ? ' and a structured Visual Language study' : ''}, but clearer direction is still needed for ${uncoveredGoals.map(goalLabel).join(', ')} before Preference DNA can be prepared.`
    }
    return `The saved evidence was reviewed without opening media. Add clearer direction for ${uncoveredGoals.map(goalLabel).join(', ')} before Preference DNA can be prepared.`
  }
  if (longFormReviewSelected) {
    return 'The complete long-form study choices are ready for your review as generalized Preference Evidence. Preference DNA has not been created, and nothing has been applied to an edit automatically.'
  }
  if (localMediaStudied) {
    return visualLanguageStudied
      ? 'The evidence study is ready for your review. The private video received bounded technical analysis and a structured, no-copy Visual Language study with ephemeral-frame cleanup and exact runtime provenance. Story, speech, caption, color, audio, and motion specialists remain separately gated. No production began.'
      : 'The evidence study is ready for your review. The private video was opened only for bounded technical media analysis; semantic visual, story, speech, caption, color, audio, and motion specialists remain clearly separated until their approved runtimes run. No production began.'
  }
  return 'The evidence study is ready for your review. Results are based only on the direction and details you saved. No media was opened and no production began.'
}

function sceneBoundarySummary(mediaStudy: EditReferenceLocalMediaStudyResult): string {
  if (mediaStudy.shotDetectionStatus === 'verified_local_bounded') {
    const coverage = mediaStudy.shotDetectionCoverage === 'partial' ? ' within the bounded scan window' : ''
    return `${mediaStudy.shotBoundaryCount} technical visual change point${mediaStudy.shotBoundaryCount === 1 ? '' : 's'} detected${coverage}`
  }
  if (mediaStudy.shotDetectionStatus === 'blocked') return 'the technical visual change-point scan was blocked'
  return 'the technical visual change-point scan did not run'
}

function sceneBoundaryNote(mediaStudy: EditReferenceLocalMediaStudyResult): string {
  if (mediaStudy.shotDetectionStatus === 'verified_local_bounded') {
    return `FFmpeg scene scoring found ${mediaStudy.shotBoundaryCount} bounded technical visual change point${mediaStudy.shotBoundaryCount === 1 ? '' : 's'} at ${mediaStudy.shotBoundaryTimesSeconds.map((time) => `${time.toFixed(2)}s`).join(', ') || 'no qualifying timestamp'}. These are discontinuity candidates—not semantic scenes, story beats, copied timing, or approved edit points.`
  }
  return mediaStudy.shotDetectionBlockerMessage
    ?? 'Technical scene-change scanning did not run. Interval samples and representative frames are not semantic scene evidence.'
}

function copyRiskLabel(kind: EditReferenceCopyRiskKind): string {
  return kind.replaceAll('_', ' ')
}

function copyRiskReason(kind: EditReferenceCopyRiskKind): string {
  return `${copyRiskLabel(kind)} is reference-specific and cannot become a reusable editing instruction.`
}

function goalLabel(goal: EditReferenceStudyGoal): string {
  return goal.replaceAll('_', ' ')
}
