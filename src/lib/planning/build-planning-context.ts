import type {
  CleanAssembly,
  CleanAssemblySegment,
  CleanupReviewState,
  EditBriefState,
  EditCue,
  EditCueAnchor,
  EditCueConflictRecord,
  EditCueConflictState,
  EditCueRemapResult,
  EditCuesState,
  PlanningAssetUsage,
  PlanningAssetUsageStatus,
  PlanningBriefInput,
  PlanningCleanAssemblyInput,
  PlanningContext,
  PlanningContextStatus,
  PlanningContextSummary,
  PlanningCueUsage,
  PlanningCueUsageStatus,
  PlanningInputSource,
  PlanningReadinessIssue,
  SourceLibraryAsset,
  SourceLibraryState,
  SourceTimeMapping,
  WorkflowTimeRange,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { getPlanningNextActions } from './planning-context-readiness'

export type BuildPlanningContextInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  cleanAssembly: CleanAssembly | null
  cleanAssemblySegments: CleanAssemblySegment[]
  sourceTimeMappings: SourceTimeMapping[]
  cleanupReviewState?: CleanupReviewState | null
  sourceLibraryState?: SourceLibraryState | null
  editBriefState?: EditBriefState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
}

type IssueDraft = Omit<PlanningReadinessIssue, 'id'>

function issueId(projectId: string, index: number) {
  return `${projectId}-planning-readiness-issue-${String(index).padStart(3, '0')}`
}

function createIssues(projectId: string, issues: IssueDraft[]): PlanningReadinessIssue[] {
  return issues.map((issue, index) => ({
    ...issue,
    id: issueId(projectId, index + 1),
  }))
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`
}

function buildCleanAssemblyInput(
  cleanAssembly: CleanAssembly,
  segments: CleanAssemblySegment[],
  mappings: SourceTimeMapping[],
  cleanupReviewState?: CleanupReviewState | null,
): PlanningCleanAssemblyInput {
  return {
    cleanAssemblyId: cleanAssembly.id,
    version: cleanAssembly.version,
    durationMs: cleanAssembly.durationMs,
    accepted: Boolean(cleanupReviewState?.accepted || cleanAssembly.status === 'accepted'),
    segmentCount: segments.length || cleanAssembly.segmentIds.length,
    sourceTimeMappingCount: mappings.length || cleanAssembly.sourceTimeMappingIds.length,
    summary: cleanAssembly.summary,
  }
}

function getAssetStatus(asset: SourceLibraryAsset): PlanningAssetUsageStatus {
  if (asset.userRole === 'do_not_use' || asset.priority === 'do_not_use') return 'do_not_use'
  if (asset.priority === 'must_follow') return 'must_use'
  if (asset.userRole === 'main_footage') return 'main_footage'
  if (asset.userRole === 'reference_only') return 'reference_only'
  if (asset.priority === 'avoid') return 'avoid'
  if (asset.priority === 'prefer') return 'prefer'
  return 'optional'
}

function getAssetExplanation(status: PlanningAssetUsageStatus) {
  if (status === 'do_not_use') return 'Avoid this source asset in planning; the file remains preserved.'
  if (status === 'must_use') return 'Treat this as a must-use planning asset.'
  if (status === 'main_footage') return 'Use as main footage context for the edit.'
  if (status === 'reference_only') return 'Use only as reference context, not as primary footage.'
  if (status === 'avoid') return 'Avoid unless needed to satisfy explicit user direction.'
  if (status === 'prefer') return 'Prefer this asset when it supports the edit.'
  return 'Optional planning asset.'
}

function buildAssetUsage(sourceLibraryState?: SourceLibraryState | null): PlanningAssetUsage[] {
  return sourceLibraryState?.assets.map((asset) => {
    const status = getAssetStatus(asset)
    return {
      mediaAssetId: asset.mediaAssetId,
      sourceLibraryAssetId: asset.id,
      label: asset.label,
      role: asset.userRole,
      status,
      priority: asset.priority,
      explanation: getAssetExplanation(status),
    }
  }) ?? []
}

function buildBriefInput(editBriefState?: EditBriefState | null): PlanningBriefInput | undefined {
  const brief = editBriefState?.editBrief
  if (!brief) return undefined

  return {
    editBriefId: brief.id,
    status: brief.status,
    goal: brief.goal,
    audience: brief.audience,
    targetPlatforms: brief.targetPlatforms,
    targetDurationMs: brief.targetDurationMs,
    styleKeywords: brief.styleKeywords,
    pacingPreference: brief.pacingPreference,
    captionPreference: brief.captionPreference,
    musicPreference: brief.musicPreference,
    bRollPreference: brief.bRollPreference,
    mustUseAssetIds: brief.mustUseAssetIds,
    avoidAssetIds: brief.avoidAssetIds,
    mustIncludeNotes: brief.mustIncludeNotes,
    avoidNotes: brief.avoidNotes,
    brandNotes: brief.brandNotes,
    specialInstructions: brief.specialInstructions,
    userProvidedReferenceUrls: brief.userProvidedReferenceUrls ?? [],
    ready: brief.status === 'ready',
  }
}

function completeTimeRange(anchor: Extract<EditCueAnchor, { type: 'time_range' }>): WorkflowTimeRange | undefined {
  if (anchor.range.endMs === undefined) return undefined
  return {
    startMs: anchor.range.startMs,
    endMs: anchor.range.endMs,
  }
}

function getAnchorRange(anchor: EditCueAnchor): WorkflowTimeRange | undefined {
  if (anchor.type === 'time_range' && anchor.timebase === 'clean_assembly') return completeTimeRange(anchor)
  if (anchor.type === 'transcript_range') return anchor.cleanAssemblyRange
  if (anchor.type === 'scene') return anchor.cleanAssemblyRange
  return undefined
}

function getRemappedRange(cue: EditCue, remapResult?: EditCueRemapResult): WorkflowTimeRange | undefined {
  const directRange = getAnchorRange(cue.anchor)
  if (directRange) return directRange

  if (remapResult?.remappedAnchor) {
    return getAnchorRange(remapResult.remappedAnchor)
  }

  return undefined
}

function cueHasDoNotUseAsset(cue: EditCue, sourceAssets: PlanningAssetUsage[]) {
  const doNotUseIds = new Set(
    sourceAssets
      .filter((asset) => asset.status === 'do_not_use')
      .map((asset) => asset.mediaAssetId),
  )
  return cue.assetRefs.some((asset) => doNotUseIds.has(asset.mediaAssetId))
}

function getOpenConflictsForCue(cue: EditCue, conflicts: EditCueConflictRecord[]) {
  return conflicts.filter((conflict) =>
    conflict.status === 'open' &&
    conflict.editCueIds.includes(cue.id),
  )
}

function getCueUsageStatus(input: {
  cue: EditCue
  cueIssues: EditCuesState['validationIssues']
  openConflicts: EditCueConflictRecord[]
  sourceAssets: PlanningAssetUsage[]
}): PlanningCueUsageStatus {
  const { cue, cueIssues, openConflicts, sourceAssets } = input
  const hasBlockingIssue = cueIssues.some((issue) => issue.severity === 'blocking')
  const hasBlockingConflict = openConflicts.some((conflict) => conflict.severity === 'blocking')
  const hasWarning = cueIssues.some((issue) => issue.severity === 'warning') ||
    openConflicts.some((conflict) => conflict.severity === 'warning')

  if (hasBlockingIssue || hasBlockingConflict || cueHasDoNotUseAsset(cue, sourceAssets)) return 'blocked'
  if (openConflicts.length > 0) return 'needs_review'
  if (cue.status !== 'ready') return 'not_ready'
  if (hasWarning) return cue.priority === 'optional' ? 'will_adjust' : 'needs_review'
  if (cue.priority === 'optional') return 'will_adjust'
  return 'will_use'
}

function getCueUsageExplanation(status: PlanningCueUsageStatus, cue: EditCue) {
  if (status === 'blocked') return 'This cue has a blocking issue or conflict that must be reviewed before generation.'
  if (status === 'needs_review') return 'This cue has warnings or unresolved conflicts that should be reviewed.'
  if (status === 'not_ready') return 'This cue is still draft and will not be treated as final direction yet.'
  if (status === 'will_adjust') return 'AI can use this cue as flexible guidance and adjust placement during planning.'
  if (status === 'ignored') return 'This cue will be ignored for this draft plan.'
  if (cue.role === 'avoid') return 'AI will use this as an avoid rule during planning.'
  return 'AI will use this cue as planning direction.'
}

function buildCueUsages(input: {
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
  sourceAssets: PlanningAssetUsage[]
}): PlanningCueUsage[] {
  const cues = input.editCuesState?.cues ?? []
  const validationIssues = input.editCuesState?.validationIssues ?? []
  const conflicts = input.editCueConflictState?.conflicts ?? []
  const remapResults = input.editCueConflictState?.remapResults ?? []

  return cues.map((cue) => {
    const cueIssues = validationIssues.filter((issue) => issue.editCueId === cue.id)
    const openConflicts = getOpenConflictsForCue(cue, conflicts)
    const status = getCueUsageStatus({
      cue,
      cueIssues,
      openConflicts,
      sourceAssets: input.sourceAssets,
    })
    const blockingIssueIds = [
      ...cueIssues.filter((issue) => issue.severity === 'blocking').map((issue) => issue.id),
      ...openConflicts.filter((conflict) => conflict.severity === 'blocking').map((conflict) => conflict.id),
    ]

    return {
      editCueId: cue.id,
      title: cue.title,
      status,
      role: cue.role,
      priority: cue.priority,
      mappedTimeRange: getRemappedRange(cue, remapResults.find((result) => result.editCueId === cue.id)),
      explanation: getCueUsageExplanation(status, cue),
      relatedAssetIds: cue.assetRefs.map((asset) => asset.mediaAssetId),
      blockingIssueIds,
    }
  })
}

function sourceForValidationIssue(type: EditCuesState['validationIssues'][number]['type']): PlanningInputSource {
  return type === 'asset_marked_do_not_use' ? 'source_library' : 'edit_cue'
}

function buildIssueDrafts(input: {
  cleanAssembly: CleanAssembly | null
  cleanAssemblyInput?: PlanningCleanAssemblyInput
  sourceLibraryState?: SourceLibraryState | null
  editBriefState?: EditBriefState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
}): IssueDraft[] {
  const issues: IssueDraft[] = []

  if (!input.cleanAssembly) {
    issues.push({
      severity: 'blocking',
      source: 'clean_assembly',
      message: 'No Clean Assembly is available for planning.',
      suggestedAction: 'Run Footage Prep.',
    })
  } else if (!input.cleanAssemblyInput?.accepted) {
    issues.push({
      severity: 'warning',
      source: 'cleanup_review',
      message: 'Clean Assembly cleanup review has not been explicitly accepted.',
      suggestedAction: 'Accept Clean Assembly when the cleanup review is ready.',
    })
  }

  if (!input.sourceLibraryState) {
    issues.push({
      severity: 'warning',
      source: 'source_library',
      message: 'No Source Library role review is available yet.',
      suggestedAction: 'Review Source Library roles before final planning.',
    })
  } else if (input.sourceLibraryState.sourceLibrary.status !== 'confirmed') {
    issues.push({
      severity: 'warning',
      source: 'source_library',
      message: 'Source Library roles are not confirmed.',
      suggestedAction: 'Confirm Source Library when asset roles look right.',
    })
  }

  if (!input.editBriefState) {
    issues.push({
      severity: 'info',
      source: 'edit_brief',
      message: 'No Edit Brief has been added.',
      suggestedAction: 'Continue from prompt and source context, or add an optional Edit Brief for more control.',
    })
  } else if (input.editBriefState.editBrief.status !== 'ready') {
    issues.push({
      severity: 'warning',
      source: 'edit_brief',
      message: 'Edit Brief is still draft.',
      suggestedAction: 'Mark the Edit Brief ready if you want it treated as final structured direction.',
    })
  }

  if (!input.editCuesState || input.editCuesState.cues.length === 0) {
    issues.push({
      severity: 'info',
      source: 'edit_cue',
      message: 'No Edit Cues have been added.',
      suggestedAction: 'Add Edit Cues for precise moment-level direction, or continue without them.',
    })
  }

  input.editCuesState?.validationIssues.forEach((issue) => {
    issues.push({
      severity: issue.severity,
      source: sourceForValidationIssue(issue.type),
      message: issue.message,
      suggestedAction: issue.suggestedFix,
      relatedEditCueId: issue.editCueId,
    })
  })

  input.editCueConflictState?.conflicts
    .filter((conflict) => conflict.status === 'open')
    .forEach((conflict) => {
      issues.push({
        severity: conflict.severity,
        source: 'cue_conflict',
        message: conflict.message,
        suggestedAction: conflict.suggestedResolution,
        relatedEditCueId: conflict.editCueIds[0],
        relatedConflictId: conflict.id,
      })
    })

  return issues
}

function statusFromIssues(issues: PlanningReadinessIssue[], cueCount: number, assetCount: number): PlanningContextStatus {
  if (issues.some((issue) => issue.severity === 'blocking')) return 'blocked'
  if (issues.some((issue) => issue.severity === 'warning')) return 'needs_review'
  if (cueCount === 0 && assetCount === 0) return 'draft'
  return 'ready'
}

function buildSummary(context: Pick<PlanningContext, 'cleanAssembly' | 'sourceAssets' | 'editBrief' | 'cueUsages' | 'blockingIssueCount' | 'warningIssueCount'>) {
  const briefDirections = context.editBrief
    ? [
        context.editBrief.goal,
        context.editBrief.styleKeywords.length ? `${context.editBrief.styleKeywords.length} style keyword${context.editBrief.styleKeywords.length === 1 ? '' : 's'}` : undefined,
        context.editBrief.specialInstructions ? 'special instructions' : undefined,
        context.editBrief.mustIncludeNotes.length ? `${context.editBrief.mustIncludeNotes.length} must-include note${context.editBrief.mustIncludeNotes.length === 1 ? '' : 's'}` : undefined,
        context.editBrief.avoidNotes.length ? `${context.editBrief.avoidNotes.length} avoid note${context.editBrief.avoidNotes.length === 1 ? '' : 's'}` : undefined,
        context.editBrief.userProvidedReferenceUrls.length ? `${context.editBrief.userProvidedReferenceUrls.length} reference link${context.editBrief.userProvidedReferenceUrls.length === 1 ? '' : 's'}` : undefined,
      ].filter(Boolean).length
    : 0
  const reviewCopy = context.blockingIssueCount > 0
    ? 'Blocking items need review before generation.'
    : context.warningIssueCount > 0
      ? 'Some items should be reviewed before generation.'
      : 'Planning inputs look ready.'

  return `Planning from Clean Assembly v${context.cleanAssembly.version} (${formatDuration(context.cleanAssembly.durationMs)}) with ${context.sourceAssets.length} source asset${context.sourceAssets.length === 1 ? '' : 's'}, ${briefDirections} brief direction${briefDirections === 1 ? '' : 's'}, and ${context.cueUsages.length} edit cue${context.cueUsages.length === 1 ? '' : 's'}. ${reviewCopy}`
}

export function buildPlanningContext(input: BuildPlanningContextInput): PlanningContext {
  const fallbackCleanAssembly: CleanAssembly = input.cleanAssembly ?? {
    id: `${input.projectId}-missing-clean-assembly`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    footagePrepSessionId: `${input.projectId}-missing-footage-prep-session`,
    cleanupPlanId: `${input.projectId}-missing-cleanup-plan`,
    status: 'failed',
    durationMs: 0,
    segmentIds: [],
    sourceTimeMappingIds: [],
    summary: 'No Clean Assembly is available.',
    version: 0,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
  const cleanAssembly = buildCleanAssemblyInput(
    fallbackCleanAssembly,
    input.cleanAssemblySegments,
    input.sourceTimeMappings,
    input.cleanupReviewState,
  )
  const sourceAssets = buildAssetUsage(input.sourceLibraryState)
  const editBrief = buildBriefInput(input.editBriefState)
  const cueUsages = buildCueUsages({
    editCuesState: input.editCuesState,
    editCueConflictState: input.editCueConflictState,
    sourceAssets,
  })
  const readinessIssues = createIssues(
    input.projectId,
    buildIssueDrafts({
      cleanAssembly: input.cleanAssembly,
      cleanAssemblyInput: cleanAssembly,
      sourceLibraryState: input.sourceLibraryState,
      editBriefState: input.editBriefState,
      editCuesState: input.editCuesState,
      editCueConflictState: input.editCueConflictState,
    }),
  )
  const unresolvedConflictIds = input.editCueConflictState?.conflicts
    .filter((conflict) => conflict.status === 'open')
    .map((conflict) => conflict.id) ?? []
  const blockingIssueCount = readinessIssues.filter((issue) => issue.severity === 'blocking').length
  const warningIssueCount = readinessIssues.filter((issue) => issue.severity === 'warning').length
  const status = statusFromIssues(readinessIssues, cueUsages.length, sourceAssets.length)
  const contextBase = {
    cleanAssembly,
    sourceAssets,
    editBrief,
    cueUsages,
    blockingIssueCount,
    warningIssueCount,
  }

  return {
    id: `${input.projectId}-planning-context`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status,
    cleanAssembly,
    sourceAssets,
    editBrief,
    cueUsages,
    readinessIssues,
    unresolvedConflictIds,
    blockingIssueCount,
    warningIssueCount,
    summary: buildSummary(contextBase),
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function buildPlanningContextSummary(context: PlanningContext): PlanningContextSummary {
  return {
    status: context.status,
    cleanAssemblyReady: context.cleanAssembly.durationMs > 0,
    sourceLibraryConfirmed: !context.readinessIssues.some((issue) =>
      issue.source === 'source_library' &&
      issue.message.includes('not confirmed'),
    ),
    editBriefReady: context.editBrief?.ready ?? false,
    totalAssets: context.sourceAssets.length,
    mustUseAssets: context.sourceAssets.filter((asset) => asset.status === 'must_use' || asset.status === 'main_footage').length,
    avoidAssets: context.sourceAssets.filter((asset) => asset.status === 'avoid' || asset.status === 'do_not_use').length,
    totalCues: context.cueUsages.length,
    readyCues: context.cueUsages.filter((cue) => cue.status === 'will_use' || cue.status === 'will_adjust').length,
    blockedCues: context.cueUsages.filter((cue) => cue.status === 'blocked').length,
    unresolvedConflicts: context.unresolvedConflictIds.length,
    blockingIssues: context.blockingIssueCount,
    warnings: context.warningIssueCount,
    nextRecommendedActions: getPlanningNextActions(context),
  }
}
