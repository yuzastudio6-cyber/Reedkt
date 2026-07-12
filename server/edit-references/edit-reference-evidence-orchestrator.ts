import { randomUUID } from 'node:crypto'
import type {
  EditReferenceStudyGoal,
  EditReferenceStudyLifecycleStatus,
  PreferenceEvidenceCategory,
  PreferenceEvidenceRecord,
  PreferenceEvidenceStatus,
  PreferenceSkillRunRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import {
  detectEditReferenceCopyRisks,
  hasEditReferenceNegationNear,
  type EditReferenceCopyRiskKind,
} from './edit-reference-copy-safety'
import type { EditReferenceLocalMediaStudyResult } from './edit-reference-media-study'

interface OrchestrationInput {
  workspaceId: string
  editReferenceId: string
  study: PreferenceStudySessionRecord
  evidence: PreferenceEvidenceRecord[]
  mediaStudies?: EditReferenceLocalMediaStudyResult[]
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
  assistantMessage: string
}

type EvidenceConflictKind = 'restrained_vs_rapid_pacing'

interface SkillDefinition {
  skillId: string
  readinessAtRun: PreferenceSkillRunRecord['readinessAtRun']
  runtimeSource: PreferenceSkillRunRecord['runtimeSource']
  fallbackUsed: boolean
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
  const orchestrationId = `preference-evidence-study-${randomUUID()}`
  const allSourceEvidence = input.evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const supersededEvidenceIds = new Set(allSourceEvidence.map((record) => record.supersedesEvidenceId).filter(Boolean))
  const sourceEvidence = allSourceEvidence.filter((record) => !supersededEvidenceIds.has(record.id))
  const manualEvidence = sourceEvidence.filter((record) => record.sourceType === 'manual_user_evidence')
  const metadataEvidence = sourceEvidence.filter((record) => record.sourceType === 'reference_video_metadata')
  const previousEditEvidence = sourceEvidence.filter((record) => record.sourceType === 'previous_approved_edit_snapshot')
  const derivedEvidence: PreferenceEvidenceRecord[] = []
  const skillRuns: PreferenceSkillRunRecord[] = []
  const mediaStudyByEvidenceId = new Map((input.mediaStudies ?? []).map((study) => [study.sourceEvidenceId, study]))

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
      summary: summarizeMetadata(metadataEvidence),
      confidence: 1,
      confidenceBasis: 'metadata_verified',
      transferability: 'requires_user_review',
      sourceEvidenceIds: metadataOnlyEvidence.map((record) => record.id),
      runtimeSource: 'verified_local',
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
      runtimeSource: 'verified_local',
      readinessAtRun: 'degraded',
      inputEvidenceIds: metadataOnlyEvidence.map((record) => record.id),
      outputEvidenceIds: [output.id],
      toolIds: ['metadata_normalizer'],
      fallbackUsed: true,
      resultSummary: 'Normalized safe reference metadata. The video itself was not studied.',
      warnings: ['No scene, shot, visual, transcript, audio, or motion observation was inferred from metadata.'],
      blockedReasons: [],
    }))
    }
  }

  if (previousEditEvidence.length > 0) {
    const runId = `preference-skill-run-${randomUUID()}`
    const output = createDerivedEvidence({
      input,
      orchestrationId,
      runId,
      category: 'media_structure',
      title: 'Previous edit identity recorded',
      summary: 'The approved edit identity is saved, but its private snapshot authority and content have not been opened or studied.',
      confidence: 0,
      confidenceBasis: 'blocked',
      transferability: 'requires_user_review',
      sourceEvidenceIds: previousEditEvidence.map((record) => record.id),
      runtimeSource: 'blocked',
      mediaStudyStatus: 'approved_edit_identity_not_verified',
      skillId: 'edit_reference.media_structure.metadata_map',
      toolIds: [],
      fallbackUsed: true,
      notes: ['No project history, approved snapshot payload, preview, or media bytes were read.'],
    })
    derivedEvidence.push(output)
    skillRuns.push(createSkillRun({
      input,
      orchestrationId,
      id: runId,
      skillId: 'edit_reference.media_structure.metadata_map',
      status: 'blocked',
      runtimeSource: 'not_started',
      readinessAtRun: 'degraded',
      inputEvidenceIds: previousEditEvidence.map((record) => record.id),
      outputEvidenceIds: [output.id],
      toolIds: [],
      fallbackUsed: true,
      resultSummary: 'Recorded the exact approved-edit identity without opening its project history or private media.',
      warnings: [],
      blockedReasons: ['This study cannot open that approved edit yet. Its identity is saved, but its private content remains closed.'],
    }))
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
        resultSummary: definition.resultSummary,
        warnings: definition.warnings,
        blockedReasons: definition.blockedReasons,
      }))
    }
  }

  const copyRiskKinds = detectCopyRisks(sourceEvidence)
  const copyRunId = `preference-skill-run-${randomUUID()}`
  const copyEvidence = createCopySafetyEvidence(input, orchestrationId, copyRunId, sourceEvidence, copyRiskKinds)
  derivedEvidence.push(copyEvidence)
  skillRuns.push(createSkillRun({
    input,
    orchestrationId,
    id: copyRunId,
    skillId: 'edit_reference.transferability.copy_safety',
    status: copyRiskKinds.length > 0 ? 'blocked' : 'completed',
    runtimeSource: 'verified_mock',
    readinessAtRun: 'verified_mock',
    inputEvidenceIds: sourceEvidence.map((record) => record.id),
    outputEvidenceIds: [copyEvidence.id],
    toolIds: ['deterministic_copy_safety_classifier'],
    fallbackUsed: false,
    resultSummary: copyRiskKinds.length > 0
      ? `Found ${copyRiskKinds.length} direct-copy request categor${copyRiskKinds.length === 1 ? 'y' : 'ies'} that require review.`
      : 'No direct-copy request was detected in the saved evidence.',
    warnings: copyRiskKinds.length > 0 ? ['Direct-copy requests are not transferable Preference DNA.'] : [],
    blockedReasons: copyRiskKinds.map(copyRiskReason),
  }))

  const conflictKinds = detectEvidenceConflicts(manualEvidence)
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
      sourceEvidenceIds: manualEvidence.map((record) => record.id),
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
      inputEvidenceIds: manualEvidence.map((record) => record.id),
      outputEvidenceIds: [conflictEvidence.id],
      toolIds: ['deterministic_evidence_conflict_classifier'],
      fallbackUsed: false,
      resultSummary: 'Found conflicting pacing direction and deferred the decision to the user.',
      warnings: ['Conflicting evidence must not be resolved silently.'],
      blockedReasons: ['Choose whether restrained/measured or rapid/high-energy pacing should take priority.'],
    }))
  }

  const uncoveredGoals = input.study.initialGoals.filter((goal) => !manualEvidence.some((record) => record.category === goal || record.category === 'all_goals'))
  const studyStatus = copyRiskKinds.length > 0 || conflictKinds.length > 0
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
    assistantMessage: buildAssistantMessage(studyStatus, uncoveredGoals, copyRiskKinds, conflictKinds),
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
  const mediaOutput = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId: mediaRunId,
    category: 'media_structure',
    title: mediaReady ? 'Private reference media structure' : 'Private reference media study blocked',
    summary: mediaReady
      ? `${sourceEvidence.title}: ${formatDuration(mediaStudy.durationSeconds)}, ${formatDimensions(mediaStudy.width, mediaStudy.height)}, ${mediaStudy.hasAudio ? 'audio present' : 'no audio stream detected'}, and ${mediaStudy.representativeFrameCount} bounded representative frame${mediaStudy.representativeFrameCount === 1 ? '' : 's'} prepared ephemerally.`
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
    notes: [
      'The source remained a private artifact reference. No signed URL or filesystem path was persisted.',
      'Representative frames were bounded and deleted after the local study; raw frames were not persisted.',
      ...(mediaReady ? mediaStudy.warnings : [mediaStudy.blockerMessage ?? 'Local media study blocked.']),
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
    resultSummary: mediaReady
      ? 'FFprobe verified private media structure and FFmpeg prepared bounded ephemeral frame/audio artifacts.'
      : 'Private local media structure study did not complete.',
    warnings: mediaStudy.warnings,
    blockedReasons: mediaReady ? [] : [mediaStudy.blockerMessage ?? 'Private local media runtime unavailable.'],
    fileBytesRead: mediaStudy.fileBytesRead,
    mediaProcessingStarted: mediaStudy.mediaProcessingStarted,
  }))

  const frameRunId = `preference-skill-run-${randomUUID()}`
  const framesReady = mediaReady && mediaStudy.representativeFrameCount > 0
  const frameOutput = createDerivedEvidence({
    input: input.input,
    orchestrationId: input.orchestrationId,
    runId: frameRunId,
    category: 'visual_language',
    title: 'Representative-frame study plan',
    summary: framesReady
      ? `${mediaStudy.representativeFrameCount} representative frame${mediaStudy.representativeFrameCount === 1 ? '' : 's'} sampled at ${mediaStudy.representativeFrameTimes.map((time) => `${time.toFixed(2)}s`).join(', ') || 'bounded points'}. The frames were deleted after planning and were not treated as semantic visual evidence.`
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
    notes: ['Frame timing and count are evidence; raw frame pixels are not persisted by default.'],
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
    resultSummary: framesReady
      ? 'Prepared and cleaned a bounded representative-frame plan.'
      : 'Representative-frame planning was not available.',
    warnings: [],
    blockedReasons: framesReady ? [] : ['No representative frame artifact was available for this study.'],
    fileBytesRead: framesReady,
    mediaProcessingStarted: framesReady,
  }))

  appendUnavailableMediaSpecialists(input, mediaReady)
}

function appendUnavailableMediaSpecialists(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  mediaStudy: EditReferenceLocalMediaStudyResult
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}, mediaReady: boolean): void {
  const definitions: Array<{ skillId: string; blocker: string }> = [
    { skillId: 'edit_reference.visual_language.qwen_visual_analysis', blocker: 'Semantic frame understanding requires the separately gated Qwen visual runtime.' },
    { skillId: 'edit_reference.story_editorial.qwen_reasoning', blocker: 'Story/editorial understanding requires transcript, scene, or live reasoning evidence that is not available in the local media foundation.' },
    { skillId: 'edit_reference.caption_design.evidence', blocker: 'Caption analysis requires OCR or transcript timing; neither runtime ran.' },
    { skillId: 'edit_reference.color_treatment.evidence', blocker: 'Color treatment analysis requires histogram/color tooling; representative frames alone are not a verified grade.' },
    { skillId: 'edit_reference.speech_pacing.evidence', blocker: 'Speech and pause analysis requires an approved transcript or alignment runtime.' },
    { skillId: 'edit_reference.audio_sound_design.evidence', blocker: 'An audio stream may be extracted locally, but music, SFX, loudness, and speech-safe analysis did not run.' },
    { skillId: 'edit_reference.graphics_motion.evidence', blocker: 'Graphics and motion understanding requires semantic frame/scene analysis or an approved motion runtime.' },
  ]
  for (const definition of definitions) {
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
      resultSummary: 'This specialist did not run against the private media. Manual evidence may still provide a separately labelled fallback.',
      warnings: mediaReady ? ['Local media structure is available, but it does not prove this specialist result.'] : [],
      blockedReasons: [definition.blocker],
    }))
  }
}

function formatDuration(value: number | undefined): string {
  return typeof value === 'number' ? `${value.toFixed(2)} seconds` : 'duration unavailable'
}

function formatDimensions(width: number | undefined, height: number | undefined): string {
  return width && height ? `${width}×${height}` : 'dimensions unavailable'
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
      mediaStudyStatus: input.mediaStudyStatus,
      toolIds: input.toolIds,
      skillIds: [input.skillId],
      fallbackUsed: input.fallbackUsed,
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
  resultSummary: string
  warnings: string[]
  blockedReasons: string[]
  fileBytesRead?: boolean
  mediaProcessingStarted?: boolean
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
    resultSummary: input.resultSummary,
    warnings: input.warnings,
    blockedReasons: input.blockedReasons,
    providerCallMade: false,
    modelCallMade: false,
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
  return { skillId, readinessAtRun, runtimeSource: 'fallback', fallbackUsed: true, resultSummary, warnings, blockedReasons: [], toolIds: [] }
}

function blockedSkill(skillId: string, reason: string): SkillDefinition {
  return {
    skillId,
    readinessAtRun: 'blocked',
    runtimeSource: 'not_started',
    fallbackUsed: true,
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
): string {
  if (status === 'needs_user_review') {
    if (conflicts.length > 0 && copyRisks.length === 0) {
      return 'The evidence contains conflicting pacing direction. Choose whether restrained/measured or rapid/high-energy pacing should take priority before continuing.'
    }
    if (conflicts.length > 0) {
      return `The evidence contains conflicting pacing direction and direct-copy requests involving ${copyRisks.map(copyRiskLabel).join(', ')}. Resolve both findings before continuing.`
    }
    return `The evidence review found direct-copy requests involving ${copyRisks.map(copyRiskLabel).join(', ')}. Those details are blocked from reusable Preference DNA. Revise or clarify the evidence before continuing.`
  }
  if (status === 'needs_clarification') {
    return `The saved evidence was reviewed without opening media. Add clearer direction for ${uncoveredGoals.map(goalLabel).join(', ')} before Preference DNA can be prepared.`
  }
  return 'The evidence study is ready for your review. Results are based only on the direction and details you saved. No media was opened and no production began.'
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
