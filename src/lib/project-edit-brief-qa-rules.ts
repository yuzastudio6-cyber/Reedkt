import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefQAStatus,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefQAConflictKind,
  ProjectEditBriefQAFinding,
  ProjectEditBriefQAFindingSeverity,
  ProjectEditBriefQAFindingType,
  ProjectEditBriefQAPackage,
  ProjectEditBriefQAReadinessStatus,
  ProjectEditBriefQASafetyFlags,
  ProjectEditBriefMarkerQAPackage,
} from '../types/project-edit-brief-qa'
import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import { createPreferenceApplicationQAContextSummary } from './edit-reference-downstream-context'

export const PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS: ProjectEditBriefQASafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  qwenCallMade: false,
  deepSeekCallMade: false,
  embeddingsUsed: false,
  vectorDbUsed: false,
  soundRuntimeStarted: false,
  dockerCommandRun: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  exportJobCreated: false,
  progressStarted: false,
  creditReservedOrSpent: false,
}

export const PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY =
  'Planner priority reminder: Safety / do-not-copy / policy; confirmed Edit Brief markers; main Edit Chat instructions; Edit Preference / Preference DNA; Auto Professional suggestions; default editing style.'

export type ProjectEditBriefMarkerQAInput = {
  marker: ProjectEditBriefMarkerRecord
  allMarkers: ProjectEditBriefMarkerRecord[]
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  intent?: ProjectEditBriefMarkerIntentRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  durationSeconds?: number
}

export type ProjectEditBriefQAInput = {
  bundle: ProjectEditBriefBundleRecord
  exportSettings?: ProjectEditSessionExportSettingsRecord
  durationSeconds?: number
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}

function textFor(marker: ProjectEditBriefMarkerRecord, intent?: ProjectEditBriefMarkerIntentRecord): string {
  return [
    marker.title,
    marker.userNote,
    intent?.instruction,
    intent?.assetRequirement,
    ...(intent?.blockingNeeds ?? []),
    ...(intent?.doNotCopyNotes ?? []),
    ...(intent?.plannerHints ?? []),
  ].join(' ').toLowerCase()
}

function idPart(value: string | undefined): string {
  return (value ?? 'none').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)
}

export function createProjectEditBriefQAFindingId(input: {
  markerId?: string
  relatedMarkerId?: string
  findingType: ProjectEditBriefQAFindingType
  conflictKind?: ProjectEditBriefQAConflictKind
}): string {
  return [
    'project-edit-brief-qa',
    input.findingType,
    input.conflictKind ?? 'general',
    idPart(input.markerId),
    idPart(input.relatedMarkerId),
  ].join('-')
}

export function qaStatusForFinding(
  findingType: ProjectEditBriefQAFindingType,
  severity: ProjectEditBriefQAFindingSeverity,
): ProjectEditBriefQAStatus {
  if (findingType === 'passed') return 'passed'
  if (findingType === 'missing_asset') return 'needs_asset'
  if (findingType === 'needs_clarification') return 'needs_clarification'
  if (findingType === 'overlap_conflict' || findingType === 'audio_conflict') return 'conflict'
  if (findingType === 'copy_risk' && severity === 'blocking') return 'blocked'
  if (findingType === 'invalid_time_range' && severity === 'blocking') return 'blocked'
  return 'warning'
}

export function createProjectEditBriefQAFinding(input: {
  projectId: string
  editSessionId: string
  briefId: string
  markerId?: string
  relatedMarkerId?: string
  findingType: ProjectEditBriefQAFindingType
  conflictKind?: ProjectEditBriefQAConflictKind
  severity: ProjectEditBriefQAFindingSeverity
  title: string
  summary: string
  recommendedResolution: string
}): ProjectEditBriefQAFinding {
  const qaStatus = qaStatusForFinding(input.findingType, input.severity)
  return {
    id: createProjectEditBriefQAFindingId(input),
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    briefId: input.briefId,
    markerId: input.markerId,
    relatedMarkerId: input.relatedMarkerId,
    findingType: input.findingType,
    conflictKind: input.conflictKind,
    severity: input.severity,
    qaStatus,
    title: input.title,
    summary: input.summary,
    recommendedResolution: input.recommendedResolution,
    blocksPlan: input.severity === 'blocking',
    requiresUserReview: input.severity === 'review' || input.severity === 'blocking',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  }
}

function hasAttachment(
  attachments: ProjectEditBriefMarkerAttachmentRecord[],
  kinds: ProjectEditBriefMarkerAttachmentRecord['attachmentKind'][],
): boolean {
  return attachments.some((attachment) =>
    kinds.includes(attachment.attachmentKind) &&
    (attachment.status === 'metadata_only' || attachment.status === 'mock_attached')
  )
}

function requiredAssetFinding(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding | undefined {
  const { marker, intent, attachments } = input
  const text = textFor(marker, intent)
  const base = {
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    findingType: 'missing_asset' as const,
    conflictKind: 'missing_required_asset' as const,
    severity: 'blocking' as const,
  }
  const action = intent?.action
  if ((marker.markerType === 'broll' || action === 'add_broll' || text.includes('b-roll') || text.includes('broll')) && !hasAttachment(attachments, ['broll_video', 'image', 'reference_label', 'reference_url_metadata_only'])) {
    return createProjectEditBriefQAFinding({
      ...base,
      title: 'B-roll asset metadata missing',
      summary: 'This marker asks for B-roll, but no B-roll/image/reference metadata attachment is present.',
      recommendedResolution: 'Attach metadata for the B-roll/reference asset or clarify that no asset is required.',
    })
  }
  if ((marker.markerType === 'music_soundtrack' || action === 'add_music_or_soundtrack' || text.includes('music') || text.includes('soundtrack')) && !hasAttachment(attachments, ['music_track', 'soundtrack'])) {
    return createProjectEditBriefQAFinding({
      ...base,
      title: 'Music asset metadata missing',
      summary: 'This marker asks for music or soundtrack guidance, but no music/soundtrack metadata attachment is present.',
      recommendedResolution: 'Attach music metadata or revise the marker to use only existing audio.',
    })
  }
  if ((marker.markerType === 'sfx_sound_design' || action === 'add_sfx' || text.includes('sfx') || text.includes('sound effect')) && !hasAttachment(attachments, ['sfx'])) {
    return createProjectEditBriefQAFinding({
      ...base,
      title: 'SFX asset metadata missing',
      summary: 'This marker asks for SFX, but no SFX metadata attachment is present.',
      recommendedResolution: 'Attach SFX metadata or clarify the desired sound as a future planning note only.',
    })
  }
  if ((marker.markerType === 'voiceover' || action === 'add_voiceover' || text.includes('voiceover') || text.includes('voice over')) && !hasAttachment(attachments, ['voiceover', 'document'])) {
    return createProjectEditBriefQAFinding({
      ...base,
      title: 'Voiceover note missing',
      summary: 'This marker asks for voiceover, but no voiceover/script metadata is attached.',
      recommendedResolution: 'Attach voiceover/script metadata or add a clear voiceover note.',
    })
  }
  return undefined
}

export function detectProjectEditBriefMissingAsset(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding | undefined {
  return requiredAssetFinding(input)
}

export function detectProjectEditBriefNeedsClarification(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding | undefined {
  const { marker, intent } = input
  const text = textFor(marker, intent).trim()
  const vague = [
    'make this better',
    'add something',
    'fix this',
    'do something',
    'improve this',
    'make it pop',
  ]
  const isLowConfidence = intent?.confidence === 'low'
  if (!text || vague.some((phrase) => text.includes(phrase)) || (intent?.action === 'general_instruction' && isLowConfidence)) {
    return createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'needs_clarification',
      severity: 'review',
      title: 'Marker needs clarification',
      summary: 'The marker instruction is too vague for safe future planning.',
      recommendedResolution: 'Ask the user what should change at this time range before using it in a plan.',
    })
  }
  return undefined
}

export function detectProjectEditBriefInvalidTimeRange(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding | undefined {
  const { marker, durationSeconds } = input
  const end = marker.endTimeSeconds
  if (marker.startTimeSeconds < 0 || (marker.timeMode === 'range' && end !== undefined && end < marker.startTimeSeconds)) {
    return createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'invalid_time_range',
      conflictKind: 'invalid_time_range',
      severity: 'blocking',
      title: 'Invalid marker time range',
      summary: 'The marker has a negative start time or an end time before its start time.',
      recommendedResolution: 'Fix the time range before this marker can be used as a planning hint.',
    })
  }
  if (marker.timeMode === 'range' && end !== undefined && end === marker.startTimeSeconds) {
    return createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'invalid_time_range',
      conflictKind: 'invalid_time_range',
      severity: 'warning',
      title: 'Very short marker range',
      summary: 'The marker range has zero duration and may need a clearer range.',
      recommendedResolution: 'Expand the range or make this a point marker.',
    })
  }
  if (durationSeconds && (marker.startTimeSeconds > durationSeconds || (end ?? marker.startTimeSeconds) > durationSeconds)) {
    return createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'invalid_time_range',
      conflictKind: 'invalid_time_range',
      severity: 'warning',
      title: 'Marker exceeds mock duration',
      summary: 'The marker appears outside the known mock duration.',
      recommendedResolution: 'Move the marker inside the known timeline duration or update the mock duration metadata.',
    })
  }
  return undefined
}

function markerEnd(marker: ProjectEditBriefMarkerRecord): number {
  return marker.endTimeSeconds ?? marker.startTimeSeconds + 2
}

export function markersOverlap(a: ProjectEditBriefMarkerRecord, b: ProjectEditBriefMarkerRecord): boolean {
  return a.startTimeSeconds < markerEnd(b) && b.startTimeSeconds < markerEnd(a)
}

function overlapConflictKind(marker: ProjectEditBriefMarkerRecord, other: ProjectEditBriefMarkerRecord): ProjectEditBriefQAConflictKind | undefined {
  const types = new Set([marker.markerType, other.markerType])
  if (types.has('cut_remove') && types.has('broll')) return 'cut_vs_broll'
  if (types.has('cut_remove') && types.has('keep_emphasize')) return 'cut_vs_keep'
  if (types.has('do_not_use') && (types.has('broll') || types.has('music_soundtrack') || types.has('sfx_sound_design') || types.has('keep_emphasize'))) return 'do_not_use_vs_action'
  if (marker.priority === 'must_follow' && other.priority === 'must_follow' && marker.markerType !== other.markerType) return 'do_not_use_vs_action'
  return undefined
}

export function detectProjectEditBriefOverlapConflicts(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding[] {
  const { marker, allMarkers } = input
  return allMarkers
    .filter((other) => other.id !== marker.id && other.status !== 'archived' && markersOverlap(marker, other))
    .map((other) => ({ other, kind: overlapConflictKind(marker, other) }))
    .filter((entry): entry is { other: ProjectEditBriefMarkerRecord; kind: ProjectEditBriefQAConflictKind } => Boolean(entry.kind))
    .map(({ other, kind }) => createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      relatedMarkerId: other.id,
      findingType: 'overlap_conflict',
      conflictKind: kind,
      severity: 'blocking',
      title: 'Overlapping marker conflict',
      summary: `${marker.title} overlaps with ${other.title} and gives contradictory timeline guidance.`,
      recommendedResolution: 'Adjust timing or decide which marker should outrank the other before future planning.',
    }))
}

function asksForNoMusic(text: string): boolean {
  return text.includes('no music') || text.includes('without music') || text.includes('remove music')
}

function asksForNoFakeSounds(text: string): boolean {
  return text.includes('no fake sounds') || text.includes('no fake sound') || text.includes('without sfx') || text.includes('no sfx')
}

function asksForMusic(marker: ProjectEditBriefMarkerRecord, intent?: ProjectEditBriefMarkerIntentRecord): boolean {
  const text = textFor(marker, intent)
  return marker.markerType === 'music_soundtrack' || intent?.action === 'add_music_or_soundtrack' || text.includes('add music') || text.includes('soundtrack')
}

function asksForSfx(marker: ProjectEditBriefMarkerRecord, intent?: ProjectEditBriefMarkerIntentRecord): boolean {
  const text = textFor(marker, intent)
  return marker.markerType === 'sfx_sound_design' || intent?.action === 'add_sfx' || text.includes('sfx') || text.includes('sound effect')
}

export function detectProjectEditBriefAudioConflicts(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding[] {
  const { marker, intent, allMarkers } = input
  const markerText = textFor(marker, intent)
  const findings: ProjectEditBriefQAFinding[] = []
  for (const other of allMarkers.filter((candidate) => candidate.id !== marker.id && candidate.status !== 'archived' && markersOverlap(marker, candidate))) {
    const otherText = textFor(other)
    if ((asksForNoMusic(markerText) && asksForMusic(other)) || (asksForMusic(marker, intent) && asksForNoMusic(otherText))) {
      findings.push(createProjectEditBriefQAFinding({
        projectId: marker.projectId,
        editSessionId: marker.editSessionId,
        briefId: marker.briefId,
        markerId: marker.id,
        relatedMarkerId: other.id,
        findingType: 'audio_conflict',
        conflictKind: 'music_vs_no_music',
        severity: 'blocking',
        title: 'Music instruction conflict',
        summary: `${marker.title} conflicts with ${other.title} on whether music should be used.`,
        recommendedResolution: 'Resolve the music direction before future planning. No sound runtime was run.',
      }))
    }
    if ((asksForNoFakeSounds(markerText) && asksForSfx(other)) || (asksForSfx(marker, intent) && asksForNoFakeSounds(otherText))) {
      findings.push(createProjectEditBriefQAFinding({
        projectId: marker.projectId,
        editSessionId: marker.editSessionId,
        briefId: marker.briefId,
        markerId: marker.id,
        relatedMarkerId: other.id,
        findingType: 'audio_conflict',
        conflictKind: 'sfx_vs_no_fake_sounds',
        severity: 'blocking',
        title: 'SFX instruction conflict',
        summary: `${marker.title} conflicts with ${other.title} on fake sounds or SFX.`,
        recommendedResolution: 'Resolve the SFX direction before future planning. No audio analysis was run.',
      }))
    }
  }
  return findings
}

export function detectProjectEditBriefCopyRisk(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding | undefined {
  const { marker, intent, attachments } = input
  const text = textFor(marker, intent)
  const exactCopy = [
    'copy this exact',
    'copy exactly',
    'recreate exactly',
    'exact same shot',
    'shot for shot',
    'match this video exactly',
    'use this reference as footage',
  ].some((phrase) => text.includes(phrase))
  const hasReferenceUrl = attachments.some((attachment) => attachment.attachmentKind === 'reference_url_metadata_only' || Boolean(attachment.referenceUrl))
  const asksToCopyReference = hasReferenceUrl && (text.includes('copy') || text.includes('exact') || text.includes('match'))
  if (!exactCopy && !asksToCopyReference) return undefined
  return createProjectEditBriefQAFinding({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    findingType: 'copy_risk',
    conflictKind: 'copy_reference_risk',
    severity: exactCopy ? 'blocking' : 'review',
    title: 'Do-not-copy risk detected',
    summary: 'The marker appears to request exact reference copying or reference-as-footage behavior.',
    recommendedResolution: 'Rewrite the marker as transferable editing language. Do not copy exact shots, timing, creator identity, layout, music, SFX, or third-party footage.',
  })
}

export function detectProjectEditBriefExportWarnings(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding[] {
  const { marker, intent, exportSettings } = input
  if (!exportSettings) return []
  const findings: ProjectEditBriefQAFinding[] = []
  const text = textFor(marker, intent)
  if ((marker.markerType === 'caption_text' || intent?.action === 'add_caption_or_text') && !exportSettings.captionSafeArea) {
    findings.push(createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'export_warning',
      conflictKind: 'caption_safe_area_warning',
      severity: 'warning',
      title: 'Caption safe area warning',
      summary: 'This marker asks for captions/text, but caption safe area is off in export settings.',
      recommendedResolution: 'Enable caption safe area or confirm text placement manually before future planning.',
    }))
  }
  if ((exportSettings.aspectRatio === '16:9') && (text.includes('vertical') || text.includes('caption-heavy') || marker.markerType === 'caption_text')) {
    findings.push(createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'export_warning',
      severity: 'warning',
      title: 'Aspect/export mismatch warning',
      summary: 'This marker appears vertical or caption-heavy while export settings are wide.',
      recommendedResolution: 'Confirm aspect ratio and caption safe zones before future planning.',
    }))
  }
  if (exportSettings.aspectRatio === 'custom' && (!exportSettings.resolution.width || !exportSettings.resolution.height)) {
    findings.push(createProjectEditBriefQAFinding({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      findingType: 'export_warning',
      conflictKind: 'custom_export_warning',
      severity: 'warning',
      title: 'Custom export setting incomplete',
      summary: 'Custom export settings need usable resolution metadata.',
      recommendedResolution: 'Set a valid custom resolution before future planning.',
    }))
  }
  return findings
}

function passedFinding(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefQAFinding {
  const { marker } = input
  return createProjectEditBriefQAFinding({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    findingType: 'passed',
    severity: 'info',
    title: 'Marker passed mock QA',
    summary: 'The marker instruction is clear enough for a future planning hint and has no deterministic blockers.',
    recommendedResolution: 'Keep as mock/local QA-passed metadata. Planner application remains future gated.',
  })
}

export function classifyProjectEditBriefMarkerQAStatus(findings: ProjectEditBriefQAFinding[]): ProjectEditBriefQAStatus {
  if (findings.some((finding) => finding.qaStatus === 'blocked')) return 'blocked'
  if (findings.some((finding) => finding.qaStatus === 'conflict')) return 'conflict'
  if (findings.some((finding) => finding.qaStatus === 'needs_asset')) return 'needs_asset'
  if (findings.some((finding) => finding.qaStatus === 'needs_clarification')) return 'needs_clarification'
  if (findings.some((finding) => finding.qaStatus === 'warning')) return 'warning'
  if (findings.some((finding) => finding.qaStatus === 'passed')) return 'passed'
  return 'not_checked'
}

export function classifyProjectEditBriefQAReadiness(findings: ProjectEditBriefQAFinding[]): ProjectEditBriefQAReadinessStatus {
  if (!findings.length) return 'not_checked'
  if (findings.some((finding) => finding.findingType === 'copy_risk' && finding.severity === 'blocking')) return 'blocked_by_copy_risk'
  if (findings.some((finding) => finding.findingType === 'overlap_conflict' || finding.findingType === 'audio_conflict')) return 'blocked_by_conflict'
  if (findings.some((finding) => finding.findingType === 'missing_asset')) return 'blocked_by_missing_asset'
  if (findings.some((finding) => finding.findingType === 'invalid_time_range' && finding.severity === 'blocking')) return 'failed_validation'
  if (findings.some((finding) => finding.severity === 'review')) return 'needs_user_review'
  if (findings.some((finding) => finding.severity === 'warning')) return 'ready_with_warnings_mock'
  if (findings.every((finding) => finding.findingType === 'passed')) return 'ready_for_plan_mock'
  return 'needs_user_review'
}

export function createProjectEditBriefConflictRecordsFromFindings(
  findings: ProjectEditBriefQAFinding[],
): ProjectEditBriefMarkerConflictRecord[] {
  return findings
    .filter((finding) => finding.markerId && finding.findingType !== 'passed')
    .filter((finding) => ['overlap_conflict', 'audio_conflict', 'copy_risk', 'invalid_time_range'].includes(finding.findingType))
    .map((finding) => ({
      id: `conflict-${finding.id}`,
      projectId: finding.projectId,
      editSessionId: finding.editSessionId,
      briefId: finding.briefId,
      markerId: finding.markerId!,
      relatedMarkerId: finding.relatedMarkerId,
      qaStatus: finding.qaStatus,
      title: finding.title,
      summary: finding.summary,
      recommendedResolution: finding.recommendedResolution,
      blocksPlan: finding.blocksPlan,
      requiresUserReview: finding.requiresUserReview,
      createdAt: new Date(0).toISOString(),
      mockOnly: true,
      metadata: {
        findingType: finding.findingType,
        conflictKind: finding.conflictKind,
        deterministicMockQA: true,
        noPlannerApplication: true,
      },
    }))
}

export function runProjectEditBriefMarkerQA(input: ProjectEditBriefMarkerQAInput): ProjectEditBriefMarkerQAPackage {
  const markerAttachments = input.attachments.filter((attachment) => attachment.markerId === input.marker.id)
  const scopedInput = { ...input, attachments: markerAttachments }
  const findings = [
    detectProjectEditBriefMissingAsset(scopedInput),
    detectProjectEditBriefNeedsClarification(scopedInput),
    detectProjectEditBriefInvalidTimeRange(scopedInput),
    detectProjectEditBriefCopyRisk(scopedInput),
    ...detectProjectEditBriefOverlapConflicts(scopedInput),
    ...detectProjectEditBriefAudioConflicts(scopedInput),
    ...detectProjectEditBriefExportWarnings(scopedInput),
  ].filter((finding): finding is ProjectEditBriefQAFinding => Boolean(finding))
  const finalFindings = findings.length ? findings : [passedFinding(scopedInput)]
  const qaStatus = classifyProjectEditBriefMarkerQAStatus(finalFindings)
  const readinessStatus = classifyProjectEditBriefQAReadiness(finalFindings)
  const conflictRecords = createProjectEditBriefConflictRecordsFromFindings(finalFindings)
  return {
    markerId: input.marker.id,
    markerTitle: input.marker.title,
    qaStatus,
    readinessStatus,
    findings: finalFindings,
    conflictRecords,
    recommendedNextAction: createProjectEditBriefRecommendedNextAction(readinessStatus),
    mockOnly: true,
    warnings: [
      PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY,
      'Mock QA does not apply markers to edit plans or start rendering.',
    ],
    ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefRecommendedNextAction(status: ProjectEditBriefQAReadinessStatus): string {
  const actions: Record<ProjectEditBriefQAReadinessStatus, string> = {
    not_checked: 'Run mock QA before using this marker as a future planning hint.',
    ready_for_plan_mock: 'Marker is QA-passed as mock planning metadata; planner application remains future gated.',
    ready_with_warnings_mock: 'Review warnings, then keep as mock planning metadata if acceptable.',
    needs_user_review: 'Clarify the marker instruction before future planning.',
    blocked_by_conflict: 'Resolve marker conflicts before future planning.',
    blocked_by_missing_asset: 'Attach required metadata or revise the marker before future planning.',
    blocked_by_copy_risk: 'Rewrite the marker as adapted, not copied, editing language.',
    failed_validation: 'Fix the invalid marker metadata before future planning.',
  }
  return actions[status]
}

export function createProjectEditBriefQAPackage(input: ProjectEditBriefQAInput): ProjectEditBriefQAPackage {
  const { bundle } = input
  const markerPackages = bundle.markers
    .filter((marker) => marker.status !== 'archived')
    .map((marker) => runProjectEditBriefMarkerQA({
      marker,
      allMarkers: bundle.markers,
      attachments: bundle.attachments,
      intent: bundle.intents.find((intent) => intent.markerId === marker.id),
      exportSettings: input.exportSettings ?? bundle.exportSettings,
      durationSeconds: input.durationSeconds,
    }))
  const findings = markerPackages.flatMap((markerPackage) => markerPackage.findings)
  const preferenceApplicationQA = input.preferenceApplicationContext
    ? createPreferenceApplicationQAContextSummary({
        context: input.preferenceApplicationContext,
        projectId: bundle.brief.projectId,
        editSessionId: bundle.brief.editSessionId,
        markers: bundle.markers,
      })
    : undefined
  const markerReadinessStatus = classifyProjectEditBriefQAReadiness(findings)
  const readinessStatus = preferenceApplicationQA?.status === 'blocked'
    ? 'failed_validation'
    : preferenceApplicationQA?.status === 'warning' && markerReadinessStatus === 'ready_for_plan_mock'
      ? 'ready_with_warnings_mock'
      : markerReadinessStatus
  const passedCount = markerPackages.filter((markerPackage) => markerPackage.qaStatus === 'passed').length
  const warningCount = findings.filter((finding) => finding.severity === 'warning').length
    + (preferenceApplicationQA?.status === 'warning' ? preferenceApplicationQA.findings.length : 0)
  const needsAssetCount = markerPackages.filter((markerPackage) => markerPackage.qaStatus === 'needs_asset').length
  const needsClarificationCount = markerPackages.filter((markerPackage) => markerPackage.qaStatus === 'needs_clarification').length
  const conflictCount = findings.filter((finding) => finding.qaStatus === 'conflict').length
  const blockedCount = findings.filter((finding) => finding.qaStatus === 'blocked' || finding.blocksPlan).length
    + (preferenceApplicationQA?.status === 'blocked' ? preferenceApplicationQA.findings.length : 0)
  const readableSummary = `${createProjectEditBriefQAReadableSummary({
    readinessStatus,
    markerCount: markerPackages.length,
    passedCount,
    warningCount,
    needsAssetCount,
    needsClarificationCount,
    conflictCount,
    blockedCount,
  })}${preferenceApplicationQA ? ` Preference Application QA: ${preferenceApplicationQA.status}; ${preferenceApplicationQA.activeGuidanceCount} active, ${preferenceApplicationQA.heldBackGuidanceCount} held back, ${preferenceApplicationQA.doNotCopyRuleCount} do-not-copy boundaries.` : ''}`
  return {
    briefId: bundle.brief.id,
    projectId: bundle.brief.projectId,
    editSessionId: bundle.brief.editSessionId,
    readinessStatus,
    markerPackages,
    findings,
    markerCount: markerPackages.length,
    passedCount,
    warningCount,
    needsAssetCount,
    needsClarificationCount,
    conflictCount,
    blockedCount,
    readableSummary,
    preferenceApplicationQA,
    mockOnly: true,
    warnings: [
      PROJECT_EDIT_BRIEF_QA_PRIORITY_SUMMARY,
      'No planner application, media processing, render, provider, worker, credit, or Supabase action occurred.',
    ],
    ...PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefQAReadableSummary(input: {
  readinessStatus: ProjectEditBriefQAReadinessStatus
  markerCount: number
  passedCount: number
  warningCount: number
  needsAssetCount: number
  needsClarificationCount: number
  conflictCount: number
  blockedCount: number
}): string {
  return `${input.markerCount} marker(s) checked; ${input.passedCount} passed, ${input.warningCount} warning(s), ${input.needsAssetCount} missing asset, ${input.needsClarificationCount} needs clarification, ${input.conflictCount} conflict(s), ${input.blockedCount} blocker(s). Readiness: ${input.readinessStatus}.`
}

export function createProjectEditBriefMarkerQAReadableSummary(markerPackage: ProjectEditBriefMarkerQAPackage): string {
  return `${markerPackage.markerTitle}: ${markerPackage.qaStatus}; ${markerPackage.findings.map((finding) => finding.title).join('; ')}`
}

export function createProjectEditBriefQAFindingSummary(finding: ProjectEditBriefQAFinding): string {
  return `${finding.title}: ${finding.summary} Resolution: ${finding.recommendedResolution}`
}

export function createProjectEditBriefQADebugSummary(qaPackage: ProjectEditBriefQAPackage): string {
  return JSON.stringify({
    readinessStatus: qaPackage.readinessStatus,
    markerCount: qaPackage.markerCount,
    findingTypes: qaPackage.findings.map((finding) => finding.findingType),
    sideEffects: PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  })
}
