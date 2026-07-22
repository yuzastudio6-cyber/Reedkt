import { createHash, randomUUID } from 'node:crypto'
import { getPreferenceDNALayerDefinition } from '../../src/backend/preference-dna/preference-dna-layer-registry'
import type {
  EditReferenceRecord,
  PreferenceApplicationAdaptedDecisionRecord,
  PreferenceApplicationHintGroupRecord,
  PreferenceApplicationRecord,
  PreferenceApplicationSource,
  PreferenceApplicationTargetContextSnapshot,
  PreferenceDNAQAResultRecord,
  PreferenceDNARuleRecord,
  PreferenceDNAVersionRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import { ApiError } from '../errors/api-error'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'

export const EDIT_REFERENCE_TARGET_APPLICATION_VERSION = 'edit-reference-target-application-v2' as const

export const EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY = [
  'safety_platform_tier_frame_credit_or_approved_constraint',
  'current_user_instruction',
  'target_context',
  'approved_preference_dna',
] as const

export interface TargetApplicationInput {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  dnaVersion: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  targetContext: PreferenceApplicationTargetContextSnapshot
  targetUnderstanding: TargetVideoUnderstandingPackage
  applicationSource: PreferenceApplicationSource
  existingApplications: PreferenceApplicationRecord[]
  now: string
  /**
   * Canonical persistence allocates a database-compatible UUID before the
   * server prepares the immutable application. Legacy/private callers may
   * omit it and retain the historical namespaced identity.
   */
  applicationId?: string
}

export function createEditReferenceTargetApplication(input: TargetApplicationInput): PreferenceApplicationRecord {
  assertApprovedDNA(input.dnaVersion, input.qaResult)
  assertReadyTargetUnderstanding(input)
  const targetInstructionCopyRisks = detectEditReferenceCopyRisks([
    input.targetContext.currentUserInstruction,
    ...input.targetContext.approvedConstraints,
  ])
  if (targetInstructionCopyRisks.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The target instruction asks for reference-specific copying. Rewrite it as transferable creative direction before preparing this application.',
      409,
      { copyRisks: targetInstructionCopyRisks },
    )
  }
  const targetContextDigest = calculatePreferenceApplicationTargetContextDigest(input.targetContext)
  const decisions = input.dnaVersion.rules.map((rule) => adaptRule(
    rule,
    input.targetContext,
    targetContextDigest,
    input.targetUnderstanding,
  ))
  const hintGroups = createHintGroups(decisions)
  const doNotCopyRules = input.dnaVersion.rules
    .filter((rule) => rule.kind === 'do_not_copy')
    .map((rule) => rule.statement)
  const version = input.existingApplications
    .filter((record) => record.projectId === input.targetContext.projectId && record.editSessionId === input.targetContext.editSessionId)
    .reduce((maximum, record) => Math.max(maximum, record.version), 0) + 1
  const summary = createApplicationSummary(input.targetContext, decisions)
  const targetUnderstanding = createTargetUnderstandingBinding(input.targetUnderstanding)
  const immutableContent = {
    applicationVersion: EDIT_REFERENCE_TARGET_APPLICATION_VERSION,
    applicationSource: input.applicationSource,
    editReferenceId: input.reference.id,
    dnaVersionId: input.dnaVersion.id,
    dnaVersionNumber: input.dnaVersion.version,
    dnaContentDigest: input.dnaVersion.contentDigest,
    dnaApprovalId: input.dnaVersion.approval?.id,
    dnaQaResultId: input.qaResult.id,
    targetContext: input.targetContext,
    targetContextDigest,
    targetUnderstanding,
    decisions,
    hintGroups,
    doNotCopyRules,
    precedencePolicy: EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY,
    summary,
  }

  return {
    id: input.applicationId ?? `preference-application-${randomUUID()}`,
    workspaceId: input.reference.workspaceId,
    editReferenceId: input.reference.id,
    editReferenceName: input.reference.name,
    studySessionId: input.study.id,
    dnaVersionId: input.dnaVersion.id,
    dnaVersionNumber: input.dnaVersion.version,
    dnaContentDigest: input.dnaVersion.contentDigest,
    dnaApprovalId: input.dnaVersion.approval!.id,
    dnaQaResultId: input.qaResult.id,
    projectId: input.targetContext.projectId,
    editSessionId: input.targetContext.editSessionId,
    version,
    status: 'prepared',
    applicationSource: input.applicationSource,
    applicationVersion: EDIT_REFERENCE_TARGET_APPLICATION_VERSION,
    runtimeSource: input.targetUnderstanding.runtimeProvenance.runtimeSources.includes('verified_live')
      ? 'verified_live'
      : 'verified_local',
    targetContext: input.targetContext,
    targetContextDigest,
    targetUnderstanding,
    decisions,
    hintGroups,
    doNotCopyRules,
    precedencePolicy: [...EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY],
    summary,
    targetIdentityStatus: 'verified_target_video_understanding',
    targetIntegrationStatus: 'not_connected',
    downstreamInvalidationStatus: 'not_required',
    contentDigest: calculatePreferenceApplicationContentDigest(immutableContent),
    targetEditMutationMade: false,
    approvedPlanMutationMade: false,
    downstreamContextWritten: false,
    providerCallMade: false,
    modelCallMade: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

/**
 * Projects the exact declared target-study context into the one application
 * context consumed by the adaptation engine. Keeping this projection beside
 * the adaptation authority prevents SQL, HTTP adapters, and test fixtures
 * from inventing competing mappings.
 */
export function createPreferenceApplicationTargetContextFromUnderstanding(
  target: TargetVideoUnderstandingPackage,
): PreferenceApplicationTargetContextSnapshot {
  const declared = target.declaredContext
  return {
    projectId: target.projectId,
    editSessionId: target.editSessionId,
    projectName: declared.projectName,
    editName: declared.editName,
    sourceMode: target.audioState.sourceMode,
    contentType: declared.contentType,
    sourceSummary: target.sourceSummary,
    currentUserInstruction: declared.currentUserInstruction,
    selectedEditLevel: declared.selectedEditLevel,
    aspectRatio: declared.aspectRatio,
    outputFrameConfirmed: true,
    platformTarget: declared.platformTarget,
    storyRole: declared.storyRole,
    budgetPreference: declared.budgetPreference,
    directives: structuredClone(declared.directives),
    approvedConstraints: [...declared.approvedConstraints],
  }
}

export function calculatePreferenceApplicationTargetContextDigest(
  targetContext: PreferenceApplicationTargetContextSnapshot,
): string {
  return sha256(stableStringify(targetContext))
}

export function calculatePreferenceApplicationContentDigest(value: {
  applicationVersion: PreferenceApplicationRecord['applicationVersion']
  applicationSource?: PreferenceApplicationRecord['applicationSource']
  editReferenceId: string
  dnaVersionId: string
  dnaVersionNumber: number
  dnaContentDigest: string
  dnaApprovalId?: string
  dnaQaResultId: string
  targetContext: PreferenceApplicationTargetContextSnapshot
  targetContextDigest: string
  targetUnderstanding?: PreferenceApplicationRecord['targetUnderstanding']
  decisions: PreferenceApplicationAdaptedDecisionRecord[]
  hintGroups: PreferenceApplicationHintGroupRecord[]
  doNotCopyRules: string[]
  precedencePolicy: readonly PreferenceApplicationRecord['precedencePolicy'][number][]
  summary: string
}): string {
  return sha256(stableStringify(value))
}

function assertApprovedDNA(dnaVersion: PreferenceDNAVersionRecord, qaResult: PreferenceDNAQAResultRecord): void {
  if (
    dnaVersion.status !== 'approved'
    || !dnaVersion.approval
    || dnaVersion.approval.acknowledgedAdaptNotCopy !== true
    || dnaVersion.qaResultId !== qaResult.id
    || qaResult.dnaVersionId !== dnaVersion.id
    || qaResult.status === 'blocked'
    || qaResult.dnaContentDigest !== dnaVersion.contentDigest
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Only an exact approved, quality-reviewed Preference DNA version can be prepared for a target edit.', 409)
  }
}

function assertReadyTargetUnderstanding(input: TargetApplicationInput): void {
  const target = input.targetUnderstanding
  if (
    target.status !== 'ready'
    || target.readyForPreferenceApplication !== true
    || target.workspaceId !== input.reference.workspaceId
    || target.editReferenceId !== input.reference.id
    || target.studySessionId !== input.study.id
    || target.projectId !== input.targetContext.projectId
    || target.editSessionId !== input.targetContext.editSessionId
    || target.declaredContext.contextDigestSha256 !== calculateDeclaredTargetContextDigest(input.targetContext, target)
    || target.runtimeProvenance.everyRequiredOutputVerified !== true
    || target.runtimeProvenance.everySemanticRuntimeAuthoritative !== true
    || target.runtimeProvenance.everyRequiredOutputCostAuthoritySatisfied !== true
    || target.runtimeProvenance.coverageQaPassed !== true
    || target.runtimeProvenance.completionAttestationDigestSha256 === null
    || target.missingEvidence.some((record) => record.blocking)
    || target.limitations.some((record) => record.blocking)
    || target.callerSourceSummaryUsedAsStudyEvidence !== false
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Preference Application requires the exact ready target-video understanding package with authoritative whole-source evidence, cost authority, and coverage QA.',
      409,
    )
  }
}

function createTargetUnderstandingBinding(
  target: TargetVideoUnderstandingPackage,
): NonNullable<PreferenceApplicationRecord['targetUnderstanding']> {
  return {
    packageId: target.packageId,
    packageDigestSha256: target.packageDigestSha256,
    sourceStorageObjectRecordId: target.source.storageObjectRecordId,
    sourceMediaAssetId: target.source.mediaAssetId,
    editBriefId: target.declaredContext.editBriefId,
    editBriefRevision: target.declaredContext.editBriefRevision,
    editBriefDigestSha256: target.declaredContext.editBriefDigestSha256,
    studyRunId: target.study.runId,
    studyPlanDigestSha256: target.study.planDigestSha256,
    contextDigestSha256: target.declaredContext.contextDigestSha256,
    evidenceIds: [...target.evidenceIds],
    confidence: target.confidence.overall,
    runtimeSources: [...target.runtimeProvenance.runtimeSources],
    everyRequiredOutputVerified: true,
    everySemanticRuntimeAuthoritative: true,
    everyRequiredOutputCostAuthoritySatisfied: true,
    coverageQaPassed: true,
    callerSourceSummaryUsedAsStudyEvidence: false,
  }
}

function adaptRule(
  rule: PreferenceDNARuleRecord,
  target: PreferenceApplicationTargetContextSnapshot,
  targetContextDigest: string,
  targetUnderstanding: TargetVideoUnderstandingPackage,
): PreferenceApplicationAdaptedDecisionRecord {
  const directive = directiveForLayer(rule.layerId, target)
  const targetEvidence = targetEvidenceForRule(targetUnderstanding, rule)
  let decision: PreferenceApplicationAdaptedDecisionRecord['decision']
  let precedence: PreferenceApplicationAdaptedDecisionRecord['precedence']
  let targetInstruction: string
  let reason: string

  if (rule.kind === 'do_not_copy') {
    decision = 'blocked'
    precedence = 'safety_platform_tier_frame_credit_or_approved_constraint'
    targetInstruction = normalizeBoundary(rule.statement)
    reason = 'Copy-safety boundaries outrank every creative preference and remain active for this target.'
  } else if (rule.kind === 'context_only') {
    decision = 'ignored'
    precedence = 'approved_preference_dna'
    targetInstruction = 'Keep this reference-specific observation as review context only. Do not convert it into a target-edit instruction.'
    reason = 'The approved DNA marked this material as contextual or non-transferable.'
  } else if (directive === 'avoid') {
    decision = 'ignored'
    precedence = 'current_user_instruction'
    targetInstruction = `Do not apply ${layerSubject(rule.layerId)} guidance from this reference to “${target.editName}.”`
    reason = 'The current target instruction explicitly excludes this treatment and therefore outranks Preference DNA.'
  } else if (!targetEvidence.sufficient || targetEvidence.confidence < 0.5) {
    decision = 'needs_clarification'
    precedence = 'target_context'
    targetInstruction = `Do not apply ${layerSubject(rule.layerId)} guidance until stronger target evidence is available.`
    reason = 'The target study did not provide enough layer-specific evidence or confidence for a professional decision.'
  } else {
    precedence = directive === 'required' || (rule.layerId === 'structure_story_flow' && target.directives.sourceOrder === 'preserve')
      ? 'current_user_instruction'
      : target.approvedConstraints.length > 0
        ? 'safety_platform_tier_frame_credit_or_approved_constraint'
        : isStrongTargetLayer(rule.layerId)
          ? 'target_context'
          : 'approved_preference_dna'
    decision = rule.kind === 'avoid' && directive === 'adapt'
      ? 'applied'
      : precedence === 'approved_preference_dna' ? 'applied' : 'adapted'
    targetInstruction = targetAwareInstruction(rule, target, directive)
    reason = adaptationReason(precedence, target)
  }

  return {
    id: stableId('preference-application-decision', {
      sourceRuleId: rule.id,
      targetContextDigest,
      decision,
      precedence,
      targetInstruction,
    }),
    sourceRuleId: rule.id,
    layerId: rule.layerId,
    decision,
    precedence,
    targetInstruction,
    reason,
    heldBackReason: decision === 'applied' || decision === 'adapted' ? null : reason,
    confidence: Math.min(rule.confidence, targetEvidence.confidence),
    targetUnderstandingPackageId: targetUnderstanding.packageId,
    targetEvidenceIds: targetEvidence.evidenceIds,
    targetEvidenceConfidence: targetEvidence.confidence,
  }
}

function targetEvidenceForRule(
  target: TargetVideoUnderstandingPackage,
  rule: PreferenceDNARuleRecord,
): { evidenceIds: string[]; confidence: number; sufficient: boolean } {
  if (rule.kind === 'do_not_copy' || rule.kind === 'context_only') {
    return {
      evidenceIds: [...target.evidenceIds],
      confidence: target.confidence.overall,
      sufficient: true,
    }
  }
  return targetEvidenceForLayer(target, rule.layerId)
}

function targetEvidenceForLayer(
  target: TargetVideoUnderstandingPackage,
  layerId: PreferenceDNALayerId,
): { evidenceIds: string[]; confidence: number; sufficient: boolean } {
  let evidenceIds: string[]
  let confidence: number
  switch (layerId) {
    case 'structure_story_flow':
    case 'content_type':
      evidenceIds = target.storyStructure.evidenceIds
      confidence = target.confidence.story
      break
    case 'pacing_timing':
    case 'music_soundsync':
    case 'sfx_sound_design':
      evidenceIds = target.audioState.evidenceIds
      confidence = target.confidence.audio
      break
    case 'speech_caption_behavior':
      evidenceIds = target.captionRequirements.evidenceIds
      confidence = target.confidence.captions
      break
    case 'color_tone_space':
      evidenceIds = target.colorState.evidenceIds
      confidence = target.confidence.color
      break
    case 'graphic_design_visualexplain':
    case 'ui_document_card_treatment':
      evidenceIds = target.graphicsNeeds.flatMap((need) => need.evidenceIds)
      confidence = target.confidence.graphics
      break
    case 'visual_scene_language':
      evidenceIds = target.visualOpportunities
        .filter((opportunity) => opportunity.category === 'visual_language')
        .flatMap((opportunity) => opportunity.evidenceIds)
      confidence = target.confidence.visual
      break
    case 'broll_shot_language':
      evidenceIds = target.visualOpportunities
        .filter((opportunity) => opportunity.category === 'broll_pattern')
        .flatMap((opportunity) => opportunity.evidenceIds)
      confidence = target.confidence.visual
      break
    default:
      evidenceIds = target.evidenceIds
      confidence = target.confidence.overall
  }
  const exactDomainEvidenceIds = [...new Set(evidenceIds)]
  const sufficient = exactDomainEvidenceIds.length > 0
  const absenceEvidenceIds = target.evidence
    .filter((record) => record.stageId === 'global_reconciliation' || record.stageId === 'coverage_qa')
    .map((record) => record.evidenceId)
  return {
    evidenceIds: sufficient ? exactDomainEvidenceIds : [...new Set(absenceEvidenceIds)],
    confidence: sufficient ? Math.max(0, Math.min(1, confidence)) : 0,
    sufficient,
  }
}

function calculateDeclaredTargetContextDigest(
  target: PreferenceApplicationTargetContextSnapshot,
  understanding: TargetVideoUnderstandingPackage,
): string {
  return sha256(stableStringify({
    projectName: target.projectName,
    editName: target.editName,
    contentType: target.contentType,
    currentUserInstruction: target.currentUserInstruction,
    selectedEditLevel: target.selectedEditLevel,
    aspectRatio: target.aspectRatio,
    outputFrameConfirmed: target.outputFrameConfirmed,
    platformTarget: target.platformTarget,
    storyRole: target.storyRole,
    budgetPreference: target.budgetPreference,
    directives: target.directives,
    approvedConstraints: target.approvedConstraints,
    editBriefId: understanding.declaredContext.editBriefId,
    editBriefRevision: understanding.declaredContext.editBriefRevision,
    editBriefDigestSha256: understanding.declaredContext.editBriefDigestSha256,
  }))
}

function targetAwareInstruction(
  rule: PreferenceDNARuleRecord,
  target: PreferenceApplicationTargetContextSnapshot,
  directive: 'adapt' | 'required',
): string {
  const preference = stripRulePrefix(rule.statement)
  const frame = `${target.aspectRatio} ${platformLabel(target.platformTarget)}`
  const sourceMode = sourceModeLabel(target.sourceMode)
  const editLevel = target.selectedEditLevel.replaceAll('_', ' ')

  switch (rule.layerId) {
    case 'structure_story_flow':
      return target.directives.sourceOrder === 'preserve'
        ? `Preserve the target source order while shaping “${target.storyRole}.” Use the approved preference only for emphasis and clarity: ${preference}`
        : `Shape this ${contentTypeLabel(target.contentType)} around “${target.storyRole},” using the target material's own story order and evidence. Adapt the approved preference: ${preference}`
    case 'pacing_timing':
      return target.sourceMode === 'voice_first'
        ? `Let speech meaning and readable pauses control the pace of this ${contentTypeLabel(target.contentType)}. Adapt ${preference.toLowerCase()}, but derive every cut and hold from the target narration—not the reference timing.`
        : target.sourceMode === 'silent_visual'
          ? `Let visual action and the target music bed establish the rhythm of this ${contentTypeLabel(target.contentType)}. Adapt ${preference.toLowerCase()}, while deriving every beat from the target footage rather than reference timecodes.`
          : `Balance speech, visual action, and transitions for this mixed-source edit. Adapt ${preference.toLowerCase()}, with timing derived only from the target source.`
    case 'speech_caption_behavior':
      return directive === 'required'
        ? `Use readable, target-authored captions in the confirmed ${target.aspectRatio} frame. Follow the target speech exactly and adapt this preference: ${preference}`
        : target.sourceMode === 'silent_visual'
          ? `Do not invent speech captions for this silent visual edit. Use only purposeful, target-authored on-screen text and adapt the underlying readability preference: ${preference}`
          : `Keep captions aligned to the target speech, clear of important visuals, and readable in the confirmed ${target.aspectRatio} frame. Adapt: ${preference}`
    case 'music_soundsync':
      return directive === 'required'
        ? `Use target-cleared music as a planned structural layer for this ${sourceMode}. Preserve speech clarity where present and adapt: ${preference}`
        : target.sourceMode === 'voice_first'
          ? `Keep music subordinate to narration and duck it around meaning-critical speech. Use target-cleared music only; adapt: ${preference}`
          : `Let target-cleared music support the visual rhythm without copying the reference track, melody, edit points, or arrangement. Adapt: ${preference}`
    case 'sfx_sound_design':
      return directive === 'required'
        ? `Plan target-specific sound cues for visible actions and transitions, keeping every cue speech-safe. Adapt: ${preference}`
        : target.sourceMode === 'voice_first'
          ? `Use sparse, meaning-linked sound cues that never cover narration. Build them from target actions, not reference effects. Adapt: ${preference}`
          : `Use target-specific tactile cues and ambience to reinforce visible actions. Do not reproduce reference effects or timing; adapt: ${preference}`
    case 'visual_scene_language':
      return `Translate the visual principle into original compositions for the confirmed ${frame} frame and the target source: ${preference}`
    case 'graphic_design_visualexplain':
    case 'ui_document_card_treatment':
      return `Create original ${frame} graphics at ${editLevel} complexity within the ${target.budgetPreference} production preference. Keep target facts and labels exact; adapt: ${preference}`
    case 'broll_shot_language':
      return `Choose B-roll only when it advances “${target.storyRole}” or clarifies the target source. Never reproduce the reference shot order or footage; adapt: ${preference}`
    case 'color_tone_space':
      return `Adapt the tonal intent to the target footage, delivery platform, and confirmed frame while preserving natural continuity: ${preference}`
    case 'content_type':
      return `Treat the target as a ${contentTypeLabel(target.contentType)} with ${sourceMode}; use this DNA observation only to guide target-aware choices: ${preference}`
    case 'edit_quality_preference':
      return `Maintain a professional result at ${editLevel} complexity, with the target instruction and approved constraints taking priority. Adapt: ${preference}`
    default:
      return `Apply this approved preference only where it supports “${target.currentUserInstruction}” in the target edit, and adapt it to the target source: ${preference}`
  }
}

function createHintGroups(decisions: PreferenceApplicationAdaptedDecisionRecord[]): PreferenceApplicationHintGroupRecord[] {
  const layerIds = [...new Set(decisions.map((record) => record.layerId))]
  return layerIds.map((layerId) => {
    const layerDecisions = decisions.filter((record) => record.layerId === layerId)
    const active = layerDecisions.filter((record) => record.decision === 'applied' || record.decision === 'adapted')
    const heldBack = layerDecisions.length - active.length
    const definition = getPreferenceDNALayerDefinition(layerId)
    const title = definition?.title ?? layerId.replaceAll('_', ' ')
    return {
      id: stableId('preference-application-hint-group', {
        layerId,
        decisionIds: layerDecisions.map((record) => record.id),
      }),
      layerId,
      title,
      summary: active.length
        ? `${active.length} target-specific direction${active.length === 1 ? '' : 's'} prepared${heldBack ? `; ${heldBack} reference-specific item${heldBack === 1 ? '' : 's'} held back` : ''}.`
        : `${heldBack} reference-specific item${heldBack === 1 ? '' : 's'} held back from the target edit.`,
      decisionIds: layerDecisions.map((record) => record.id),
      sourceRuleIds: layerDecisions.map((record) => record.sourceRuleId),
    }
  })
}

function createApplicationSummary(
  target: PreferenceApplicationTargetContextSnapshot,
  decisions: PreferenceApplicationAdaptedDecisionRecord[],
): string {
  const active = decisions.filter((record) => record.decision === 'applied' || record.decision === 'adapted').length
  const heldBack = decisions.length - active
  return `${active} target-specific guidance item${active === 1 ? '' : 's'} prepared for “${target.editName}”; ${heldBack} reference-specific, excluded, or unresolved item${heldBack === 1 ? '' : 's'} held back.`
}

function directiveForLayer(
  layerId: PreferenceDNALayerId,
  target: PreferenceApplicationTargetContextSnapshot,
): 'adapt' | 'required' | 'avoid' {
  if (layerId === 'speech_caption_behavior') return target.directives.captions
  if (layerId === 'music_soundsync') return target.directives.music
  if (layerId === 'sfx_sound_design') return target.directives.sfx
  return 'adapt'
}

function isStrongTargetLayer(layerId: PreferenceDNALayerId): boolean {
  return [
    'content_type', 'structure_story_flow', 'pacing_timing', 'speech_caption_behavior',
    'visual_scene_language', 'music_soundsync', 'sfx_sound_design', 'graphic_design_visualexplain',
    'ui_document_card_treatment', 'broll_shot_language', 'color_tone_space', 'edit_quality_preference',
  ].includes(layerId)
}

function adaptationReason(
  precedence: PreferenceApplicationAdaptedDecisionRecord['precedence'],
  target: PreferenceApplicationTargetContextSnapshot,
): string {
  if (precedence === 'current_user_instruction') return 'The current target instruction shapes this adaptation and outranks reusable Preference DNA.'
  if (precedence === 'safety_platform_tier_frame_credit_or_approved_constraint') {
    return `Safety, the confirmed ${target.aspectRatio} ${platformLabel(target.platformTarget)} delivery, ${target.selectedEditLevel.replaceAll('_', ' ')} tier limits, the ${target.budgetPreference} cost preference, and approved constraints shape this adaptation first.`
  }
  if (precedence === 'target_context') return 'The target source, story role, delivery frame, and speech mode determine how the reusable preference is expressed.'
  return 'The approved reusable preference applies only after higher-priority target and safety requirements are satisfied.'
}

function normalizeBoundary(statement: string): string {
  return statement.replace(/^Do not copy:\s*/i, 'Do not copy from the reference: ').trim()
}

function stripRulePrefix(statement: string): string {
  return statement
    .replace(/^Adapt this preference to the target edit:\s*/i, '')
    .replace(/^Keep as review context:\s*/i, '')
    .trim()
}

function layerSubject(layerId: PreferenceDNALayerId): string {
  if (layerId === 'speech_caption_behavior') return 'caption'
  if (layerId === 'music_soundsync') return 'music'
  if (layerId === 'sfx_sound_design') return 'sound-effect'
  return layerId.replaceAll('_', ' ')
}

function sourceModeLabel(value: PreferenceApplicationTargetContextSnapshot['sourceMode']): string {
  if (value === 'voice_first') return 'voice-first source'
  if (value === 'silent_visual') return 'silent visual source'
  return 'mixed speech-and-visual source'
}

function contentTypeLabel(value: PreferenceApplicationTargetContextSnapshot['contentType']): string {
  return value.replaceAll('_', ' ')
}

function platformLabel(value: PreferenceApplicationTargetContextSnapshot['platformTarget']): string {
  return value.replaceAll('_', ' ')
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 24)}`
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
