import type {
  EditMapLocalOperation,
  EditMapState,
  ExportReadinessIssue,
  ExportReadinessIssueSeverity,
  ExportReadinessIssueType,
  ExportSettings,
  ExportTarget,
  ExportWorkflowState,
  GenerationReadinessState,
  MockExportEstimate,
  MockExportJob,
  MockExportOutput,
  ProfessionalQaState,
  RevisionWorkflowState,
  ExportApproval,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildDefaultExportSettings, getEnabledExportTargets } from './export-settings-builder'
import { buildMockExportEstimate } from './mock-export-estimator'

type BuildExportWorkflowStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
  generationReadinessState?: GenerationReadinessState | null
  professionalQaState?: ProfessionalQaState | null
  editMapState?: EditMapState | null
  revisionWorkflowState?: RevisionWorkflowState | null
  existingExportSettings?: ExportSettings | null
  existingEstimate?: MockExportEstimate | null
  existingApproval?: ExportApproval | null
  existingActiveJob?: MockExportJob | null
  existingJobs?: MockExportJob[]
  existingOutputs?: MockExportOutput[]
}

const ignoredEditMapOperationTypes = new Set([
  'create_edit_map',
  'select_element',
  'select_group',
  'select_system',
  'change_scope',
  'reset_edit_map',
])

function createIssue(
  projectId: string,
  index: number,
  severity: ExportReadinessIssueSeverity,
  type: ExportReadinessIssueType,
  message: string,
  suggestedAction?: string,
  extras?: Partial<ExportReadinessIssue>,
): ExportReadinessIssue {
  return {
    id: `${projectId}-export-readiness-issue-${String(index).padStart(3, '0')}`,
    projectId,
    severity,
    type,
    message,
    suggestedAction,
    ...extras,
  }
}

function activeRevisionInProgress(revisionWorkflowState?: RevisionWorkflowState | null) {
  const active = revisionWorkflowState?.activeRevisionRequest
  return Boolean(active && (active.status === 'queued' || active.status === 'running'))
}

function activeRevisionNeedsReview(revisionWorkflowState?: RevisionWorkflowState | null) {
  const active = revisionWorkflowState?.activeRevisionRequest
  return Boolean(active && (active.status === 'ready' || active.status === 'needs_approval' || active.status === 'approved'))
}

function failedRevisionExists(revisionWorkflowState?: RevisionWorkflowState | null) {
  return Boolean(revisionWorkflowState?.revisionRequests.some((request) => request.status === 'failed'))
}

function pendingEditMapOperations(editMapState: EditMapState | null | undefined, revisionWorkflowState?: RevisionWorkflowState | null): EditMapLocalOperation[] {
  const includedOperationIds = new Set(revisionWorkflowState?.revisionRequests.flatMap((request) => request.editOperationIds) ?? [])
  return editMapState?.operations.filter((operation) =>
    operation.status !== 'reverted' &&
    !ignoredEditMapOperationTypes.has(operation.type) &&
    !includedOperationIds.has(operation.id),
  ) ?? []
}

function isVerticalSocialTarget(target: ExportTarget) {
  return target.enabled &&
    (target.platform === 'tiktok' || target.platform === 'instagram_reels' || target.platform === 'youtube_shorts') &&
    target.aspectRatio === '9:16'
}

function buildIssues(input: BuildExportWorkflowStateInput, exportSettings: ExportSettings) {
  const issues: ExportReadinessIssue[] = []
  const sourcePreviewId = input.sourcePreviewId ?? input.revisionWorkflowState?.latestPreviewId
  const activeJob = input.existingActiveJob ?? null
  let index = 1

  if (!sourcePreviewId) {
    issues.push(createIssue(
      input.projectId,
      index,
      'blocking',
      'missing_preview',
      'No private review source is available for export rehearsal.',
      'Complete a private review or revision before export rehearsal.',
    ))
    index += 1
  }

  if (input.generationReadinessState) {
    const generationReady = input.generationReadinessState.status === 'preview_ready' ||
      input.generationReadinessState.previewJob?.status === 'completed'
    if (input.generationReadinessState.status === 'blocked' || input.generationReadinessState.status === 'failed' || !generationReady) {
      issues.push(createIssue(
        input.projectId,
        index,
        'blocking',
        'generation_not_ready',
        'Generation Readiness is not preview-ready.',
        'Resolve generation readiness before export.',
      ))
      index += 1
    }
  }

  if (input.professionalQaState?.summary.status === 'blocked' || input.professionalQaState?.summary.status === 'failed') {
    issues.push(createIssue(
      input.projectId,
      index,
      'blocking',
      'qa_blocked',
      'Professional QA is blocking export rehearsal.',
      'Resolve blocking QA items before continuing.',
      { relatedQaReportId: input.professionalQaState.report?.id },
    ))
    index += 1
  } else if (input.professionalQaState?.summary.status === 'needs_review') {
    issues.push(createIssue(
      input.projectId,
      index,
      'warning',
      'qa_not_reviewed',
      'Professional QA still needs review.',
      'Review or accept QA warnings before export rehearsal.',
      { relatedQaReportId: input.professionalQaState.report?.id },
    ))
    index += 1
  }

  const pendingOperations = pendingEditMapOperations(input.editMapState, input.revisionWorkflowState)
  if (pendingOperations.length > 0) {
    issues.push(createIssue(
      input.projectId,
      index,
      'warning',
      'pending_edit_map_operations',
      `${pendingOperations.length} Edit Map operation${pendingOperations.length === 1 ? '' : 's'} are not included in a revision.`,
      'Create or complete a revision if these changes should appear in export.',
      { relatedEditDocumentId: input.editMapState?.editDocument?.id },
    ))
    index += 1
  }

  if (activeRevisionInProgress(input.revisionWorkflowState)) {
    issues.push(createIssue(
      input.projectId,
      index,
      'blocking',
      'active_revision_in_progress',
      'A revision job is currently queued or running.',
      'Complete or reset the active revision before export rehearsal.',
      { relatedRevisionRequestId: input.revisionWorkflowState?.activeRevisionRequest?.id },
    ))
    index += 1
  } else if (activeRevisionNeedsReview(input.revisionWorkflowState)) {
    issues.push(createIssue(
      input.projectId,
      index,
      'warning',
      'active_revision_in_progress',
      'A revision request is active but not completed.',
      'Export rehearsal will use the latest completed private review version.',
      { relatedRevisionRequestId: input.revisionWorkflowState?.activeRevisionRequest?.id },
    ))
    index += 1
  }

  if (failedRevisionExists(input.revisionWorkflowState)) {
    issues.push(createIssue(
      input.projectId,
      index,
      'warning',
      'failed_revision_exists',
      'A failed revision exists in history.',
      'Export rehearsal uses the latest completed private review. Retry failed revisions if they should be included.',
    ))
    index += 1
  }

  const enabledTargets = getEnabledExportTargets(exportSettings)
  if (!enabledTargets.length) {
    issues.push(createIssue(
      input.projectId,
      index,
      'blocking',
      'missing_export_target',
      'No export target is enabled.',
      'Enable at least one platform target.',
    ))
    index += 1
  }

  enabledTargets.forEach((target) => {
    if (isVerticalSocialTarget(target) && !target.enforceSafeZones) {
      issues.push(createIssue(
        input.projectId,
        index,
        'warning',
        'safe_zone_warning',
        `${target.label} has safe-zone enforcement disabled.`,
        'Enable safe-zone enforcement for vertical social exports.',
      ))
      index += 1
    }
    if (isVerticalSocialTarget(target) && target.captionMode !== 'burn_in') {
      issues.push(createIssue(
        input.projectId,
        index,
        'warning',
        'caption_burn_in_warning',
        `${target.label} does not burn captions into the export rehearsal record.`,
        'Use burn-in captions for vertical social output records unless sidecar captions are intentional.',
      ))
      index += 1
    }
    if (target.includeWatermarkPlaceholder) {
      issues.push(createIssue(
        input.projectId,
        index,
        'warning',
        'watermark_warning',
        `${target.label} includes a watermark placeholder.`,
        'Remove the placeholder before real client delivery.',
      ))
      index += 1
    }
  })

  if (!input.existingApproval || input.existingApproval.status !== 'approved') {
    issues.push(createIssue(
      input.projectId,
      index,
      'info',
      'approval_required',
      'Export rehearsal approval is required before queueing.',
      'Review settings and approve the internal export rehearsal.',
    ))
  }

  if (activeJob?.status === 'failed') {
    issues.push(createIssue(
      input.projectId,
      index + 1,
      'warning',
      'other',
      'The active export rehearsal failed.',
      'Retry, complete, fail with a new reason, or reset the export workflow.',
    ))
  }

  return issues
}

function buildSummary(issues: ExportReadinessIssue[], settings: ExportSettings, estimate: MockExportEstimate | null, outputs: MockExportOutput[]) {
  return {
    enabledTargetCount: getEnabledExportTargets(settings).length,
    outputCount: outputs.length,
    blockingIssueCount: issues.filter((issue) => issue.severity === 'blocking').length,
    warningIssueCount: issues.filter((issue) => issue.severity === 'warning').length,
    totalMockCreditsEstimated: estimate?.totalCredits ?? 0,
  }
}

function resolveStatus(
  issues: ExportReadinessIssue[],
  estimate: MockExportEstimate | null,
  approval: ExportApproval | null,
  activeJob: MockExportJob | null,
  outputs: MockExportOutput[],
) {
  const blocking = issues.some((issue) => issue.severity === 'blocking')
  const warning = issues.some((issue) => issue.severity === 'warning')

  if (activeJob?.status === 'failed') return 'failed'
  if (activeJob?.status === 'completed' && outputs.length > 0) return 'export_ready'
  if (activeJob?.status === 'queued' || activeJob?.status === 'running') return 'exporting'
  if (blocking) return 'blocked'
  if (approval?.status === 'approved') return 'approved'
  if (warning) return estimate ? 'needs_review' : 'not_ready'
  if (estimate) return 'ready'
  return 'not_ready'
}

export function getExportNextActions(state: ExportWorkflowState) {
  if (state.status === 'export_ready') return ['Review private output records', 'Keep export history for traceability']
  if (state.status === 'exporting') return ['Advance or complete the export rehearsal']
  if (state.status === 'failed') return ['Retry or reset the export rehearsal']
  if (state.summary.blockingIssueCount > 0) return ['Resolve blocking export issues']
  if (!state.approval || state.approval.status !== 'approved') return ['Review export targets', 'Approve export rehearsal']
  if (state.canExport) return ['Queue export rehearsal']
  return ['Review export settings']
}

export function buildExportWorkflowState(input: BuildExportWorkflowStateInput): ExportWorkflowState {
  const sourcePreviewId = input.sourcePreviewId ?? input.revisionWorkflowState?.latestPreviewId
  const sourcePreviewVersion = input.sourcePreviewVersion ?? input.revisionWorkflowState?.latestPreviewVersion
  const sourceEditDocumentId = input.sourceEditDocumentId ?? input.revisionWorkflowState?.latestEditDocumentId ?? input.editMapState?.editDocument?.id
  const sourceEditVersion = input.sourceEditVersion ?? input.revisionWorkflowState?.latestEditVersion ?? input.editMapState?.editDocument?.version
  const exportSettings = input.existingExportSettings ?? buildDefaultExportSettings({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId,
    sourceEditVersion,
  })
  const exportEstimate = input.existingEstimate ?? buildMockExportEstimate({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    exportSettings,
  })
  const exportJobs = input.existingJobs ?? []
  const activeJob = input.existingActiveJob ?? null
  const exportOutputs = input.existingOutputs ?? activeJob?.outputs ?? []
  const issues = buildIssues(input, exportSettings)
  const blockingIssues = issues.filter((issue) => issue.severity === 'blocking')
  const canApprove = blockingIssues.length === 0 && Boolean(exportEstimate)
  const approvalApproved = input.existingApproval?.status === 'approved'
  const canExport = canApprove && approvalApproved && getEnabledExportTargets(exportSettings).length > 0
  const summary = buildSummary(issues, exportSettings, exportEstimate, exportOutputs)
  const baseState: ExportWorkflowState = {
    id: `${input.projectId}-export-workflow`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'not_ready',
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId,
    sourceEditVersion,
    issues,
    exportSettings,
    exportEstimate,
    approval: input.existingApproval ?? null,
    activeJob,
    exportJobs,
    exportOutputs,
    canApprove,
    canExport,
    summary,
    nextRecommendedActions: [],
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
  const status = resolveStatus(issues, exportEstimate, baseState.approval, activeJob, exportOutputs)

  return {
    ...baseState,
    status,
    nextRecommendedActions: getExportNextActions({ ...baseState, status }),
  }
}

export function getExportReadinessMessage(state: ExportWorkflowState) {
  if (state.status === 'export_ready') return 'Private output records are ready for review.'
  if (state.status === 'exporting') return 'Export rehearsal is in progress locally.'
  if (state.status === 'approved') return 'Export rehearsal is approved and ready to queue.'
  if (state.status === 'blocked') return 'Resolve blocking export readiness issues before export rehearsal.'
  if (state.status === 'needs_review' || state.status === 'ready_with_warnings') return 'Review export warnings before queueing export rehearsal.'
  if (state.status === 'failed') return 'Export rehearsal failed locally. Retry or reset before continuing.'
  if (state.status === 'ready') return 'Export readiness looks clean. Approve the internal rehearsal to continue.'
  return 'Export readiness appears after a private review is ready.'
}
