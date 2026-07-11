import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefQAStatus,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefMarkerEligibilityResult,
  ProjectEditBriefMarkerPlanInstruction,
  ProjectEditBriefPlanApplicationResult,
  ProjectEditBriefPlanInstructionKind,
  ProjectEditBriefPlanMarkerEligibility,
  ProjectEditBriefPlannerInputPackage,
  ProjectEditBriefPlanPanelModel,
  ProjectEditBriefPlanReadinessStatus,
  ProjectEditBriefPlanSafetyFlags,
  ProjectEditBriefPlanValidationResult,
  ProjectEditBriefSkippedMarker,
} from '../types/project-edit-brief-plan'
import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import {
  createPreferenceApplicationPlanGuidance,
  createPreferenceApplicationQAContextSummary,
} from './edit-reference-downstream-context'

export const PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS: ProjectEditBriefPlanSafetyFlags = {
  plannerExecuted: false,
  editPlanCreated: false,
  providerCallMade: false,
  supabaseWriteMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
}

export const PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY = [
  '1. Safety / do-not-copy / policy',
  '2. Confirmed Edit Brief markers',
  '3. Main Edit Chat instructions',
  '4. Edit Preference / Preference DNA',
  '5. Auto Professional suggestions',
  '6. Default editing style',
]

export const PROJECT_EDIT_BRIEF_PLAN_BOUNDARY_SUMMARY =
  'Plan Hints are mock/local structured instructions only. They do not start editing, rendering, workers, providers, Qwen, DeepSeek, media processing, or credit activity.'

const usableMarkerStatuses = new Set(['confirmed', 'ready_for_plan', 'applied_to_plan'])
const blockedQaStatuses: ProjectEditBriefQAStatus[] = ['blocked', 'conflict', 'needs_asset', 'needs_clarification']
const usableIntentStatuses = new Set(['confirmed', 'ready_for_plan', 'draft_intent'])
const blockedIntentStatuses = new Set(['needs_asset', 'needs_clarification', 'blocked'])
const validAttachmentStatuses = new Set(['metadata_only', 'mock_attached'])

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function hasUsableAttachment(attachments: ProjectEditBriefMarkerAttachmentRecord[]): boolean {
  return attachments.some((attachment) =>
    validAttachmentStatuses.has(attachment.status) ||
    Boolean(attachment.mediaAssetId) ||
    Boolean(attachment.referenceLabel),
  )
}

function isCopyRisk(marker: ProjectEditBriefMarkerRecord, intent?: ProjectEditBriefMarkerIntentRecord): boolean {
  const haystack = [
    marker.title,
    marker.userNote,
    intent?.instruction,
    ...(intent?.doNotCopyNotes ?? []),
  ].join(' ').toLowerCase()
  return /copy exactly|recreate exact|exact shot|match reference exactly|clone reference/.test(haystack)
}

function markerConflictsFor(
  marker: ProjectEditBriefMarkerRecord,
  conflicts: ProjectEditBriefMarkerConflictRecord[],
): ProjectEditBriefMarkerConflictRecord[] {
  return conflicts.filter((conflict) =>
    conflict.markerId === marker.id || conflict.relatedMarkerId === marker.id,
  )
}

function markerAttachmentsFor(
  marker: ProjectEditBriefMarkerRecord,
  attachments: ProjectEditBriefMarkerAttachmentRecord[],
): ProjectEditBriefMarkerAttachmentRecord[] {
  return attachments.filter((attachment) => attachment.markerId === marker.id)
}

export function mapProjectEditBriefMarkerIntentToPlanInstructionKind(
  action: ProjectEditBriefMarkerIntentAction,
): ProjectEditBriefPlanInstructionKind {
  const map: Record<ProjectEditBriefMarkerIntentAction, ProjectEditBriefPlanInstructionKind> = {
    add_broll: 'broll_insert',
    remove_or_cut: 'cut_or_remove',
    keep_or_emphasize: 'keep_or_emphasize',
    add_caption_or_text: 'caption_or_text',
    add_graphic_or_ui_card: 'graphic_or_card',
    add_music_or_soundtrack: 'music_or_soundtrack_hint',
    add_sfx: 'sfx_hint',
    add_voiceover: 'voiceover_hint',
    add_transition: 'transition_hint',
    adjust_speed_or_pacing: 'pacing_adjustment',
    adjust_color_or_tone: 'color_tone_adjustment',
    avoid_or_do_not_use: 'restriction',
    general_instruction: 'general_note',
  }
  return map[action]
}

export function classifyProjectEditBriefMarkerPlanEligibility(input: {
  marker: ProjectEditBriefMarkerRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  attachments?: ProjectEditBriefMarkerAttachmentRecord[]
  conflicts?: ProjectEditBriefMarkerConflictRecord[]
}): ProjectEditBriefMarkerEligibilityResult {
  const markerAttachments = markerAttachmentsFor(input.marker, input.attachments ?? [])
  const markerConflicts = markerConflictsFor(input.marker, input.conflicts ?? [])
  const blockingConflict = markerConflicts.find((conflict) => conflict.blocksPlan || conflict.qaStatus === 'conflict')
  const warnings: string[] = []

  if (input.marker.startTimeSeconds < 0 || (input.marker.endTimeSeconds !== undefined && input.marker.endTimeSeconds < input.marker.startTimeSeconds)) {
    return createEligibility(input.marker, 'skipped_invalid_time_range', 'Marker time range is invalid.', 'Fix the marker start/end time before preparing plan hints.', warnings, false)
  }
  if (blockedQaStatuses.includes(input.marker.qaStatus)) {
    const eligibility: ProjectEditBriefPlanMarkerEligibility = input.marker.qaStatus === 'needs_asset'
      ? 'skipped_needs_asset'
      : input.marker.qaStatus === 'needs_clarification'
        ? 'skipped_needs_clarification'
        : input.marker.qaStatus === 'conflict'
          ? 'skipped_conflict'
          : 'skipped_copy_risk'
    return createEligibility(input.marker, eligibility, `Marker QA status is ${input.marker.qaStatus}.`, 'Resolve marker QA before preparing plan hints.', warnings, false)
  }
  if (!usableMarkerStatuses.has(input.marker.status)) {
    return createEligibility(input.marker, 'skipped_not_confirmed', 'Marker is not confirmed or ready for plan hints.', 'Confirm the marker or mark it ready in a future gated flow.', warnings, false)
  }
  if (!input.intent) {
    return createEligibility(input.marker, 'skipped_missing_intent', 'Marker has no structured intent.', 'Use Marker Chat or edit the marker to capture structured intent.', warnings, false)
  }
  if (blockedIntentStatuses.has(input.intent.status)) {
    const eligibility = input.intent.status === 'needs_asset'
      ? 'skipped_needs_asset'
      : input.intent.status === 'needs_clarification'
        ? 'skipped_needs_clarification'
        : 'skipped_copy_risk'
    return createEligibility(input.marker, eligibility, `Marker intent status is ${input.intent.status}.`, 'Resolve structured intent blockers before preparing plan hints.', warnings, false)
  }
  if (!usableIntentStatuses.has(input.intent.status)) {
    return createEligibility(input.marker, 'skipped_missing_intent', `Marker intent status ${input.intent.status} is not usable.`, 'Confirm or clarify the marker intent before preparing plan hints.', warnings, false)
  }
  if (input.intent.status === 'draft_intent' && (input.intent.confidence === 'low' || input.intent.instruction.trim().length < 12)) {
    return createEligibility(input.marker, 'skipped_needs_clarification', 'Draft intent is too vague for mock plan hints.', 'Clarify the marker instruction before preparing plan hints.', warnings, false)
  }
  if (input.intent.assetRequirement && !input.intent.providedAssetIds.length && !hasUsableAttachment(markerAttachments)) {
    return createEligibility(input.marker, 'skipped_needs_asset', 'Required asset metadata is missing.', 'Attach metadata-only asset/reference information before preparing plan hints.', warnings, false)
  }
  if (blockingConflict) {
    return createEligibility(input.marker, 'skipped_conflict', blockingConflict.summary, blockingConflict.recommendedResolution, warnings, false)
  }
  if (isCopyRisk(input.marker, input.intent)) {
    return createEligibility(input.marker, 'skipped_copy_risk', 'Marker contains exact-copy or reference-copy risk language.', 'Rewrite the marker as adapted-not-copied guidance.', warnings, false)
  }

  if (input.marker.qaStatus === 'warning') warnings.push('Marker QA returned warnings; include as warning-tagged mock plan hint only.')
  if (markerAttachments.some((attachment) => attachment.status === 'metadata_only' || attachment.referenceUrl)) {
    warnings.push('Attachment metadata is not verified by real upload, file read, or URL fetch.')
  }
  if (input.intent.action === 'add_music_or_soundtrack' || input.intent.action === 'add_sfx' || input.intent.action === 'add_voiceover') {
    warnings.push('Audio/SFX/voiceover instruction is metadata-only; no sound runtime, provider, worker, or render starts.')
  }

  return createEligibility(
    input.marker,
    warnings.length ? 'included_with_warning' : 'included',
    warnings.length ? 'Marker is eligible with mock/local warnings.' : 'Marker is eligible for mock plan hints.',
    'Keep as structured plan-hint metadata until a future planner milestone.',
    warnings,
    true,
  )
}

function createEligibility(
  marker: ProjectEditBriefMarkerRecord,
  eligibility: ProjectEditBriefPlanMarkerEligibility,
  reason: string,
  recommendedFix: string,
  warnings: string[],
  canCreateInstruction: boolean,
): ProjectEditBriefMarkerEligibilityResult {
  return {
    marker,
    eligibility,
    reason,
    recommendedFix,
    warnings,
    canCreateInstruction,
    mockOnly: true,
  }
}

export function createProjectEditBriefSkippedMarker(
  result: ProjectEditBriefMarkerEligibilityResult,
): ProjectEditBriefSkippedMarker {
  return {
    markerId: result.marker.id,
    markerTitle: result.marker.title,
    markerType: result.marker.markerType,
    eligibility: result.eligibility,
    reason: result.reason,
    recommendedFix: result.recommendedFix,
    qaStatus: result.marker.qaStatus,
    mockOnly: true,
  }
}

export function createProjectEditBriefMarkerPlanInstruction(input: {
  marker: ProjectEditBriefMarkerRecord
  intent: ProjectEditBriefMarkerIntentRecord
  attachments?: ProjectEditBriefMarkerAttachmentRecord[]
  warnings?: string[]
}): ProjectEditBriefMarkerPlanInstruction {
  const instructionKind = mapProjectEditBriefMarkerIntentToPlanInstructionKind(input.intent.action)
  const audioBoundary = instructionKind === 'music_or_soundtrack_hint' || instructionKind === 'sfx_hint' || instructionKind === 'voiceover_hint'
    ? ' Metadata-only hint; no sound runtime, no provider, no worker, no render.'
    : ''
  const providedAssetIds = Array.from(new Set([
    ...input.intent.providedAssetIds,
    ...(input.attachments ?? []).flatMap((attachment) => [
      attachment.mediaAssetId,
      attachment.referenceLabel,
      attachment.label,
    ].filter(Boolean) as string[]),
  ]))
  return {
    id: `project-edit-brief-plan-instruction-${slug(input.marker.id)}-${slug(instructionKind)}`,
    projectId: input.marker.projectId,
    editSessionId: input.marker.editSessionId,
    briefId: input.marker.briefId,
    markerId: input.marker.id,
    markerTitle: input.marker.title,
    markerType: input.marker.markerType,
    sourceIntentId: input.intent.id,
    instructionKind,
    instructionText: `${input.intent.instruction}${audioBoundary}`,
    timeRangeLabel: input.intent.timeRangeLabel || formatTimeRange(input.marker.startTimeSeconds, input.marker.endTimeSeconds),
    startTimeSeconds: input.marker.startTimeSeconds,
    endTimeSeconds: input.marker.endTimeSeconds,
    priority: 'confirmed_marker',
    markerPriority: input.marker.priority,
    requiredAssets: input.intent.assetRequirement ? [input.intent.assetRequirement] : [],
    providedAssetIds,
    warnings: input.warnings ?? [],
    plannerNotes: input.intent.plannerHints,
    doNotCopyNotes: input.intent.doNotCopyNotes,
    qaStatus: input.marker.qaStatus,
    includedInMockPlanHints: true,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefMarkerPlanInstructions(input: {
  bundle: ProjectEditBriefBundleRecord
}): {
  instructions: ProjectEditBriefMarkerPlanInstruction[]
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  eligibleMarkers: ProjectEditBriefMarkerRecord[]
  skippedMarkerRecords: ProjectEditBriefMarkerRecord[]
} {
  const instructions: ProjectEditBriefMarkerPlanInstruction[] = []
  const skippedMarkers: ProjectEditBriefSkippedMarker[] = []
  const eligibleMarkers: ProjectEditBriefMarkerRecord[] = []
  const skippedMarkerRecords: ProjectEditBriefMarkerRecord[] = []

  for (const marker of input.bundle.markers.filter((item) => item.status !== 'archived')) {
    const intent = input.bundle.intents.find((candidate) => candidate.id === marker.intentId || candidate.markerId === marker.id)
    const attachments = markerAttachmentsFor(marker, input.bundle.attachments)
    const result = classifyProjectEditBriefMarkerPlanEligibility({
      marker,
      intent,
      attachments,
      conflicts: input.bundle.conflicts,
    })
    if (result.canCreateInstruction && intent) {
      eligibleMarkers.push(marker)
      instructions.push(createProjectEditBriefMarkerPlanInstruction({
        marker,
        intent,
        attachments,
        warnings: result.warnings,
      }))
    } else {
      skippedMarkerRecords.push(marker)
      skippedMarkers.push(createProjectEditBriefSkippedMarker(result))
    }
  }

  return { instructions, skippedMarkers, eligibleMarkers, skippedMarkerRecords }
}

export function classifyProjectEditBriefPlanReadiness(input: {
  instructions: ProjectEditBriefMarkerPlanInstruction[]
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  warnings?: string[]
}): ProjectEditBriefPlanReadinessStatus {
  if (input.skippedMarkers.some((marker) => marker.eligibility === 'skipped_copy_risk')) return 'blocked_by_copy_risk'
  if (input.instructions.length === 0 && input.skippedMarkers.some((marker) => marker.eligibility === 'skipped_needs_asset')) return 'blocked_by_missing_asset'
  if (input.instructions.length === 0 && input.skippedMarkers.some((marker) => marker.eligibility === 'skipped_conflict')) return 'blocked_by_qa'
  if (input.instructions.length === 0 && input.skippedMarkers.length > 0) return 'needs_user_review'
  if (input.instructions.length === 0) return 'not_prepared'
  if ((input.warnings?.length ?? 0) > 0 || input.instructions.some((instruction) => instruction.warnings.length > 0) || input.skippedMarkers.length > 0) return 'ready_with_warnings_mock'
  return 'ready_for_mock_plan_hints'
}

export function createProjectEditBriefPlannerInputPackage(input: {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  applicationLogSummary?: string
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}): ProjectEditBriefPlannerInputPackage {
  const { instructions, skippedMarkers, eligibleMarkers, skippedMarkerRecords } = createProjectEditBriefMarkerPlanInstructions({ bundle: input.bundle })
  const preferenceGuidance = input.preferenceApplicationContext
    ? createPreferenceApplicationPlanGuidance({ context: input.preferenceApplicationContext, markers: input.bundle.markers })
    : []
  const preferenceApplicationQA = input.preferenceApplicationContext
    ? createPreferenceApplicationQAContextSummary({
        context: input.preferenceApplicationContext,
        projectId: input.bundle.brief.projectId,
        editSessionId: input.bundle.brief.editSessionId,
        markers: input.bundle.markers,
      })
    : undefined
  const warnings = Array.from(new Set([
    ...input.bundle.warnings,
    ...instructions.flatMap((instruction) => instruction.warnings),
    ...(input.exportSettings ? [] : ['No export settings metadata was available for the mock planner input package.']),
    ...(preferenceApplicationQA?.status === 'warning' ? preferenceApplicationQA.findings : []),
    ...(preferenceApplicationQA?.status === 'blocked' ? preferenceApplicationQA.findings : []),
  ]))
  const readinessStatus = classifyProjectEditBriefPlanReadiness({ instructions, skippedMarkers, warnings })
  const blockedCount = skippedMarkers.filter((marker) =>
    marker.eligibility === 'skipped_conflict' ||
    marker.eligibility === 'skipped_copy_risk' ||
    marker.eligibility === 'skipped_invalid_time_range',
  ).length
  return {
    id: `project-edit-brief-plan-package-${slug(input.bundle.brief.id)}`,
    projectId: input.bundle.brief.projectId,
    editSessionId: input.bundle.brief.editSessionId,
    briefId: input.bundle.brief.id,
    readinessStatus,
    exportSettings: input.exportSettings ?? input.bundle.exportSettings,
    eligibleMarkers,
    skippedMarkerRecords,
    eligibleMarkerCount: instructions.length,
    skippedMarkerCount: skippedMarkers.length,
    warningCount: warnings.length,
    blockedCount,
    planInstructions: instructions,
    preferenceGuidance,
    preferenceApplicationQA,
    preferenceApplicationId: input.preferenceApplicationContext?.applicationId,
    preferenceApplicationContextHash: input.preferenceApplicationContext?.packageHash,
    skippedMarkers,
    priorityPolicy: PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY,
    qaSummary: createProjectEditBriefPlanQASummary(instructions, skippedMarkers),
    applicationLogSummary: input.applicationLogSummary,
    warnings,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefPlanApplicationLogSummary(pkg: ProjectEditBriefPlannerInputPackage): string {
  const groupedSkipped = pkg.skippedMarkers.reduce<Record<string, number>>((acc, marker) => {
    acc[marker.eligibility] = (acc[marker.eligibility] ?? 0) + 1
    return acc
  }, {})
  const skippedSummary = Object.entries(groupedSkipped)
    .map(([key, count]) => `${count} ${key.replace('skipped_', '').replaceAll('_', ' ')}`)
    .join(', ')
  const activePreferenceHints = pkg.preferenceGuidance.filter((item) => item.status === 'active_hint').length
  const heldBackPreferenceHints = pkg.preferenceGuidance.length - activePreferenceHints
  return `Prepared ${pkg.planInstructions.length} marker plan hint${pkg.planInstructions.length === 1 ? '' : 's'} and ${activePreferenceHints} lower-priority target-adapted Preference DNA hint${activePreferenceHints === 1 ? '' : 's'}. Held back ${heldBackPreferenceHints} reusable hint${heldBackPreferenceHints === 1 ? '' : 's'} where confirmed markers had priority. Skipped ${pkg.skippedMarkers.length} marker${pkg.skippedMarkers.length === 1 ? '' : 's'}${skippedSummary ? `: ${skippedSummary}.` : '.'}`
}

export function createProjectEditBriefPlanApplicationResult(input: {
  package: ProjectEditBriefPlannerInputPackage
  applicationLog?: ProjectEditBriefPlanApplicationResult['applicationLog']
}): ProjectEditBriefPlanApplicationResult {
  return {
    ok: input.package.readinessStatus !== 'failed_validation',
    package: input.package,
    applicationLog: input.applicationLog,
    includedMarkers: input.package.planInstructions,
    skippedMarkers: input.package.skippedMarkers,
    warnings: input.package.warnings,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefPlanPanelModel(
  pkg: ProjectEditBriefPlannerInputPackage,
): ProjectEditBriefPlanPanelModel {
  return {
    briefId: pkg.briefId,
    title: 'Brief Plan Hints',
    readinessStatus: pkg.readinessStatus,
    readinessLabel: titleCase(pkg.readinessStatus),
    eligibleMarkerCount: pkg.eligibleMarkerCount,
    skippedMarkerCount: pkg.skippedMarkerCount,
    warningCount: pkg.warningCount,
    blockedCount: pkg.blockedCount,
    instructions: pkg.planInstructions,
    preferenceGuidance: pkg.preferenceGuidance,
    preferenceApplicationQA: pkg.preferenceApplicationQA,
    preferenceApplicationId: pkg.preferenceApplicationId,
    preferenceApplicationContextHash: pkg.preferenceApplicationContextHash,
    skippedMarkers: pkg.skippedMarkers,
    exportSettingsSummary: pkg.exportSettings
      ? `${pkg.exportSettings.deliveryPreset} ${pkg.exportSettings.resolution.width}x${pkg.exportSettings.resolution.height} at ${pkg.exportSettings.frameRate}fps`
      : undefined,
    priorityPolicySummary: PROJECT_EDIT_BRIEF_PLAN_PRIORITY_POLICY.join(' > '),
    applicationLogSummary: pkg.applicationLogSummary,
    canPreparePlanHints: true,
    boundarySummary: PROJECT_EDIT_BRIEF_PLAN_BOUNDARY_SUMMARY,
    warnings: pkg.warnings,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefMarkerPlanInstruction(
  instruction: ProjectEditBriefMarkerPlanInstruction,
): ProjectEditBriefPlanValidationResult {
  const blockedReasons: string[] = []
  if (!instruction.id || !instruction.markerId || !instruction.instructionKind) blockedReasons.push('Plan instruction is missing required identifiers.')
  if (instruction.plannerExecuted || instruction.editPlanCreated) blockedReasons.push('Plan instruction must not execute planner or create edit plan.')
  return createValidationResult(blockedReasons)
}

export function validateProjectEditBriefPlannerInputPackage(
  pkg: ProjectEditBriefPlannerInputPackage,
): ProjectEditBriefPlanValidationResult {
  const blockedReasons: string[] = []
  if (!pkg.mockOnly) blockedReasons.push('Planner input package must be mockOnly.')
  if (pkg.plannerExecuted || pkg.editPlanCreated) blockedReasons.push('Planner input package must not run planner or create edit plan.')
  if (pkg.providerCallMade || pkg.mediaProcessingStarted || pkg.workerJobCreated || pkg.renderJobCreated || pkg.creditReservedOrSpent || pkg.supabaseWriteMade) {
    blockedReasons.push('Planner input package has forbidden side-effect flags.')
  }
  for (const instruction of pkg.planInstructions) {
    const validation = validateProjectEditBriefMarkerPlanInstruction(instruction)
    blockedReasons.push(...validation.blockedReasons)
  }
  if (pkg.preferenceGuidance.length && (!pkg.preferenceApplicationId || !pkg.preferenceApplicationContextHash)) {
    blockedReasons.push('Preference Application plan hints require exact application and context identity.')
  }
  if (pkg.preferenceApplicationQA?.status === 'blocked') {
    blockedReasons.push(...pkg.preferenceApplicationQA.findings)
  }
  return createValidationResult(blockedReasons, pkg.warnings)
}

export function validateProjectEditBriefPlanApplicationResult(
  result: ProjectEditBriefPlanApplicationResult,
): ProjectEditBriefPlanValidationResult {
  const packageValidation = validateProjectEditBriefPlannerInputPackage(result.package)
  const blockedReasons = [...packageValidation.blockedReasons]
  if (result.plannerExecuted || result.editPlanCreated) blockedReasons.push('Application result must not run planner or create edit plan.')
  return createValidationResult(blockedReasons, result.warnings)
}

export function validateNoProjectEditBriefPlanSideEffects(flags: Record<string, unknown>): ProjectEditBriefPlanValidationResult {
  const blockedReasons = Object.entries(PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS)
    .filter(([key]) => flags[key] === true)
    .map(([key]) => `${key} must remain false.`)
  return createValidationResult(blockedReasons)
}

function createValidationResult(blockedReasons: string[], warnings: string[] = []): ProjectEditBriefPlanValidationResult {
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    warnings,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefPlanQASummary(
  instructions: ProjectEditBriefMarkerPlanInstruction[],
  skippedMarkers: ProjectEditBriefSkippedMarker[],
): string {
  return `${instructions.length} marker(s) included in mock plan hints; ${skippedMarkers.length} marker(s) skipped by deterministic QA/eligibility.`
}

export function createProjectEditBriefPlanReadableSummary(pkg: ProjectEditBriefPlannerInputPackage): string {
  return `${pkg.eligibleMarkerCount} eligible marker(s), ${pkg.skippedMarkerCount} skipped marker(s), readiness ${pkg.readinessStatus}. No real planner or edit plan was created.`
}

export function createProjectEditBriefPlanDebugSummary(pkg: ProjectEditBriefPlannerInputPackage): string {
  return JSON.stringify({
    id: pkg.id,
    readinessStatus: pkg.readinessStatus,
    instructions: pkg.planInstructions.map((instruction) => instruction.instructionKind),
    skipped: pkg.skippedMarkers.map((marker) => marker.eligibility),
    plannerExecuted: pkg.plannerExecuted,
    editPlanCreated: pkg.editPlanCreated,
  })
}

export function createProjectEditBriefMarkerPlanInstructionSummary(
  instruction: ProjectEditBriefMarkerPlanInstruction,
): string {
  return `${instruction.instructionKind.replaceAll('_', ' ')} from ${instruction.markerTitle} at ${instruction.timeRangeLabel}.`
}

export function createProjectEditBriefSkippedMarkerSummary(marker: ProjectEditBriefSkippedMarker): string {
  return `${marker.markerTitle} skipped: ${marker.reason} ${marker.recommendedFix}`
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTimeRange(start: number, end?: number): string {
  const startLabel = `${Math.max(0, Math.round(start))}s`
  return end === undefined ? startLabel : `${startLabel}-${Math.max(0, Math.round(end))}s`
}
