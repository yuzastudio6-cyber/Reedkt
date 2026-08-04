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
  PreferenceVisualIntelligenceRuntimeProvenance,
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
import {
  EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION,
  EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID,
  EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
} from './edit-reference-semantic-study-contract'
import type {
  EditReferencePreviousApprovedEditEvidenceSummary,
  EditReferencePreviousApprovedEditStudyResult,
} from './edit-reference-previous-approved-edit-study-contract'
import { EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_ADAPTER_ID } from './edit-reference-previous-approved-edit-adapter'
import { materializeEditReferenceLongFormStudySelection } from './edit-reference-long-form-review-package'
import type { EditReferenceVisualIntelligenceStudy } from
  './edit-reference-visual-intelligence-orchestra-consumer'
import { orchestraDigest } from '../orchestra/orchestra-skill-capability-contract'

interface OrchestrationInput {
  orchestrationId?: string
  workspaceId: string
  editReferenceId: string
  study: PreferenceStudySessionRecord
  evidence: PreferenceEvidenceRecord[]
  visualIntelligenceStudies?: readonly EditReferenceVisualIntelligenceStudy[]
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
    EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
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
    EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
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
  const visualIntelligenceStudyByEvidenceId = exactVisualIntelligenceStudies(
    input,
    metadataEvidence,
  )
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

  for (const record of metadataEvidence) {
    const visualIntelligenceStudy =
      visualIntelligenceStudyByEvidenceId.get(record.id)
    if (!visualIntelligenceStudy) continue
    appendVisualIntelligenceStudy({
      input,
      orchestrationId,
      sourceEvidence: record,
      study: visualIntelligenceStudy,
      derivedEvidence,
      skillRuns,
    })
  }

  if (metadataEvidence.length > 0) {
    const metadataOnlyEvidence = metadataEvidence.filter((record) => (
      !visualIntelligenceStudyByEvidenceId.has(record.id)
    ))
    if (metadataOnlyEvidence.length === 0) {
      // Every saved video record was routed through authenticated Visual Intelligence evidence.
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

  const evidenceById = new Map(derivedEvidence.map((record) => [
    record.id,
    record,
  ]))
  const analyzedSkillCategoryPairs = new Set(skillRuns
    .filter((record) => record.status === 'completed'
      && record.resultState === 'analyzed'
      && !record.fallbackUsed)
    .flatMap((record) => record.outputEvidenceIds.flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId)
      return evidence ? [`${record.skillId}:${evidence.category}`] : []
    })))
  const verifiedPreviousApprovedEditGoals = new Set((input.previousApprovedEditStudies ?? [])
    .flatMap((study) => study.result.status === 'verified'
      ? study.result.evidence.map((finding) => finding.layer)
      : []))
  const visualIntelligenceCoveredGoals = new Set(
    [...visualIntelligenceStudyByEvidenceId.values()].flatMap(
      (study) => [...study.coveredPreferenceCategories],
    ),
  )
  const uncoveredGoals = input.study.initialGoals.filter((goal) => (
    !manualEvidence.some((record) => record.category === goal || record.category === 'all_goals')
    && !verifiedPreviousApprovedEditGoals.has(goal)
    && !visualIntelligenceCoveredGoals.has(goal)
    && !GOAL_SKILLS[goal].every((definition) => longFormNotApplicableSkillIds.has(definition.skillId))
    && !GOAL_SKILLS[goal].some((definition) => longFormAdaptedSkillIds.has(definition.skillId))
    && !GOAL_SKILLS[goal].some((definition) =>
      analyzedSkillCategoryPairs.has(`${definition.skillId}:${goal}`))
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
      visualIntelligenceStudyByEvidenceId.size > 0,
      visualIntelligenceStudyByEvidenceId.size > 0,
      longFormStudySelectionReceipts.length > 0,
      longFormReviewOnly,
    ),
  }
}

function exactVisualIntelligenceStudies(
  input: OrchestrationInput,
  metadataEvidence: readonly PreferenceEvidenceRecord[],
): Map<string, EditReferenceVisualIntelligenceStudy> {
  const studies = input.visualIntelligenceStudies ?? []
  if (studies.length > metadataEvidence.length || studies.length > 16) {
    throw new Error(
      'Visual Intelligence studies must map one-to-one to active reference media evidence.',
    )
  }
  const evidenceById = new Map(metadataEvidence.map((record) => [
    record.id,
    record,
  ]))
  const byEvidenceId = new Map<string, EditReferenceVisualIntelligenceStudy>()
  for (const study of studies) {
    const sourceEvidence = evidenceById.get(study.sourceEvidenceId)
    if (!sourceEvidence || byEvidenceId.has(study.sourceEvidenceId)) {
      throw new Error(
        'Visual Intelligence study source evidence is unavailable, superseded, or duplicated.',
      )
    }
    assertExactVisualIntelligenceStudy(input, sourceEvidence, study)
    byEvidenceId.set(study.sourceEvidenceId, study)
  }
  return byEvidenceId
}

function assertExactVisualIntelligenceStudy(
  input: OrchestrationInput,
  sourceEvidence: PreferenceEvidenceRecord,
  study: EditReferenceVisualIntelligenceStudy,
): void {
  const { studyDigestSha256, ...withoutDigest } = study
  const categories = orderedVisualIntelligenceCategories(
    study.evidenceItems.map((item) => item.category),
  )
  const refs = [
    study.sourceArtifactRef,
    study.orchestraCallRef,
    study.orchestraResultRef,
    study.manifestRef,
    study.qualificationSnapshotRef,
    study.reportRef,
    study.providerReleaseRef,
    study.costEvidenceRef,
  ]
  const evidenceIds = new Set<string>()
  if (
    study.schemaVersion !== 'edit-reference-visual-intelligence-study-v1'
    || !/^sha256:[a-f0-9]{64}$/u.test(studyDigestSha256)
    || orchestraDigest(withoutDigest) !== studyDigestSha256
    || sourceEvidence.sourceType !== 'reference_video_metadata'
    || sourceEvidence.provenance.privateAssetId !== study.privateAssetId
    || study.sourceArtifactRef.id !== study.privateAssetId
    || study.scope.workspaceId !== input.workspaceId
    || study.scope.projectId !== input.editReferenceId
    || study.scope.editSessionId !== input.study.id
    || study.scope.approvedSnapshotId !== null
    || refs.some((ref) => !isExactVisualIntelligenceEvidenceRef(ref))
    || study.requestedRanges.length === 0
    || orchestraDigest(study.requestedRanges)
      !== orchestraDigest(study.analyzedRanges)
    || study.evidenceItems.length === 0
    || orchestraDigest(categories)
      !== orchestraDigest(study.coveredPreferenceCategories)
    || !study.toolIds.includes(EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID)
    || !study.toolIds.includes(EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID)
    || !study.toolIds.includes('vertex_gemini_pro')
    || !study.toolIds.includes('google_vertex_ai')
    || new Set(study.toolIds).size !== study.toolIds.length
    || study.providerAdapterId !== 'vertex_gemini_pro'
    || study.providerId !== 'google_vertex_ai'
    || study.providerModel !== 'gemini-3.1-pro-preview'
    || !study.providerModelVersion
    || study.thinkingLevel !== 'high'
    || study.mediaResolution !== 'high'
    || study.completeRequestedRangeCoverage !== true
    || study.everyTimelineFrameInspected !== false
    || study.completeTimePixelInspectionClaimAllowed !== false
    || study.billingAccountEffectiveRateUsed !== true
    || study.publicListPriceUsed !== false
    || !Number.isSafeInteger(study.settledCostMicros)
    || study.settledCostMicros <= 0
    || typeof study.replayedFromCache !== 'boolean'
    || study.providerCallMade !== true
    || study.immutableReportRereadRequired !== true
    || study.resultReturnedThroughOrchestra !== true
    || study.planningMayConsumeValidatedEvidence !== true
    || study.preferenceDnaApproved !== false
    || study.directTimelineMutationAllowed !== false
    || study.directProviderAuthorityGranted !== false
    || study.customerCreditMutationPerformed !== false
    || study.publicDeliveryGranted !== false
    || study.productionAuthorityGranted !== false
  ) throw new Error(
    'Visual Intelligence study does not match the exact active Edit Reference authority.',
  )
  for (const item of study.evidenceItems) {
    if (
      !item.evidenceId
      || evidenceIds.has(item.evidenceId)
      || !categories.includes(item.category as EditReferenceStudyGoal)
      || !item.title
      || item.title.length > 160
      || !item.summary
      || item.summary.length > 4_000
      || !Number.isSafeInteger(item.confidenceBasisPoints)
      || item.confidenceBasisPoints < 0
      || item.confidenceBasisPoints > 10_000
      || item.evidenceRefs.length === 0
      || item.evidenceRefs.some((ref) => (
        !isExactVisualIntelligenceEvidenceRef(ref)
      ))
      || item.requiresUserReview !== true
      || item.exactReferenceLayoutTransferAllowed !== false
      || item.exactVisibleTextTransferAllowed !== false
      || item.exactCameraPathTransferAllowed !== false
      || item.creatorIdentityTransferAllowed !== false
      || item.copyrightedAssetTransferAllowed !== false
      || item.targetAdaptationRequired !== true
    ) throw new Error(
      'Visual Intelligence evidence item is malformed or over-authoritative.',
    )
    evidenceIds.add(item.evidenceId)
  }
}

function appendVisualIntelligenceStudy(input: {
  input: OrchestrationInput
  orchestrationId: string
  sourceEvidence: PreferenceEvidenceRecord
  study: EditReferenceVisualIntelligenceStudy
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
}): void {
  const { study } = input
  const runId = `preference-skill-run-${randomUUID()}`
  const runtime: PreferenceVisualIntelligenceRuntimeProvenance = {
    schemaVersion: 'edit-reference-visual-intelligence-runtime-provenance-v2',
    adapterId: EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID,
    adapterVersion: study.schemaVersion,
    providerAdapterId: study.providerAdapterId,
    providerId: study.providerId,
    modelId: study.providerModel,
    providerModelVersion: study.providerModelVersion,
    thinkingLevel: study.thinkingLevel,
    mediaResolution: study.mediaResolution,
    orchestraCallRef: structuredClone(study.orchestraCallRef),
    orchestraResultRef: structuredClone(study.orchestraResultRef),
    manifestRef: structuredClone(study.manifestRef),
    qualificationSnapshotRef: structuredClone(
      study.qualificationSnapshotRef,
    ),
    reportRef: structuredClone(study.reportRef),
    providerReleaseRef: structuredClone(study.providerReleaseRef),
    costEvidenceRef: structuredClone(study.costEvidenceRef),
    studyDigestSha256: study.studyDigestSha256,
    providerCallMade: true,
    modelCallEvidencePresent: true,
    replayedFromCache: study.replayedFromCache,
    substantiveCpuExecutionUsed: false,
    settledInternalCostMicros: String(study.settledCostMicros),
    billingAccountEffectiveRateUsed: true,
    publicListPriceUsed: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const baseArtifactIds = [
    study.orchestraCallRef.id,
    study.orchestraResultRef.id,
    study.manifestRef.id,
    study.qualificationSnapshotRef.id,
    study.reportRef.id,
    study.providerReleaseRef.id,
    study.costEvidenceRef.id,
  ]
  const outputEvidenceIds: string[] = []
  for (const item of study.evidenceItems) {
    const output = createDerivedEvidence({
      input: input.input,
      orchestrationId: input.orchestrationId,
      runId,
      category: item.category,
      title: item.title,
      summary: item.summary,
      confidence: item.confidenceBasisPoints / 10_000,
      confidenceBasis: 'model_observed',
      transferability: 'requires_user_review',
      sourceEvidenceIds: [input.sourceEvidence.id],
      runtimeSource: 'verified_live',
      mediaStudyStatus: 'media_studied_visual_intelligence',
      skillId: EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
      toolIds: [...study.toolIds],
      fallbackUsed: false,
      privateAssetId: study.privateAssetId,
      analysisArtifactIds: uniqueStrings([
        ...baseArtifactIds,
        ...item.evidenceRefs.map((ref) => ref.id),
      ]),
      visualIntelligenceRuntime: runtime,
      notes: [
        'This is a generalized, reference-only observation returned through Orchestra from the exact immutable Visual Intelligence report.',
        'Gemini Pro High observed the approved source range; no every-frame or full-pixel inspection claim is made.',
        'Exact reference layouts, visible text, camera paths, creator identity, copyrighted assets, and source timing remain non-transferable.',
        'Preference DNA remains unapproved and nothing was applied to an edit automatically.',
      ],
    })
    input.derivedEvidence.push(output)
    outputEvidenceIds.push(output.id)
  }
  input.skillRuns.push(createSkillRun({
    input: input.input,
    orchestrationId: input.orchestrationId,
    id: runId,
    skillId: EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
    status: 'completed',
    runtimeSource: 'verified_live',
    readinessAtRun: 'verified_live',
    inputEvidenceIds: [input.sourceEvidence.id],
    outputEvidenceIds,
    toolIds: [...study.toolIds],
    fallbackUsed: false,
    resultState: 'analyzed',
    retryAvailable: false,
    resultSummary: `Consumed one exact immutable Orchestra Visual Intelligence report and produced ${outputEvidenceIds.length} generalized reference-evidence record${outputEvidenceIds.length === 1 ? '' : 's'} for user review. Preference DNA remains unapproved.`,
    warnings: [
      'Semantic findings are bounded to the analyzed ranges; complete-time pixel inspection was not claimed.',
      'No exact source layout, wording, camera path, identity, copyrighted asset, or timing may be copied.',
    ],
    blockedReasons: [],
    providerCallMade: true,
    modelCallMade: true,
    runtimeAttempt: {
      schemaVersion: 'edit-reference-skill-runtime-attempt-v1',
      adapterId: EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID,
      requestDigestSha256: study.studyDigestSha256.replace(/^sha256:/u, ''),
      providerCallMade: true,
      modelCallMade: true,
      workerJobCreated: false,
      temporaryInputsCleaned: true,
      internalCostStatus: 'metered',
      meteredInternalCostMicros: String(study.settledCostMicros),
      usageEventIds: [study.costEvidenceRef.id],
      internalCostRecordIds: [study.costEvidenceRef.id],
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    fileBytesRead: true,
    mediaProcessingStarted: true,
  }))
}

function orderedVisualIntelligenceCategories(
  categories: readonly PreferenceEvidenceCategory[],
): EditReferenceStudyGoal[] {
  const selected = new Set(categories)
  const order: readonly EditReferenceStudyGoal[] = [
    'visual_language',
    'story_and_pacing',
    'captions',
    'color',
    'b_roll',
    'audio_and_sfx',
    'graphics',
  ]
  return order.filter((category) => selected.has(category))
}

function isExactVisualIntelligenceEvidenceRef(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return Object.keys(record).length === 3
    && typeof record.id === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(record.id)
    && Number.isSafeInteger(record.version)
    && Number(record.version) > 0
    && typeof record.contentHash === 'string'
    && /^sha256:[a-f0-9]{64}$/u.test(record.contentHash)
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

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
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
  visualIntelligenceRuntime?: PreferenceVisualIntelligenceRuntimeProvenance
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
      ...(input.visualIntelligenceRuntime
        ? {
          visualIntelligenceRuntime: structuredClone(
            input.visualIntelligenceRuntime,
          ),
        }
        : {}),
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

function copyRiskLabel(kind: EditReferenceCopyRiskKind): string {
  return kind.replaceAll('_', ' ')
}

function copyRiskReason(kind: EditReferenceCopyRiskKind): string {
  return `${copyRiskLabel(kind)} is reference-specific and cannot become a reusable editing instruction.`
}

function goalLabel(goal: EditReferenceStudyGoal): string {
  return goal.replaceAll('_', ' ')
}
