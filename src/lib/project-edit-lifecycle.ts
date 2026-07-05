import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalEditPreviewResult,
} from '../types/project-source-video'

export type ProjectEditLifecycleStageId =
  | 'project_created'
  | 'edit_created'
  | 'source_video_selected'
  | 'backend_upload_configured'
  | 'backend_upload_completed'
  | 'brief_saved'
  | 'edit_plan_required'
  | 'credit_approval_required'
  | 'approved_snapshot_required'
  | 'internal_preview_ready'
  | 'final_export_blocked'

export type ProjectEditLifecycleStageStatus = 'complete' | 'ready' | 'blocked'

export interface ProjectEditLifecycleStage {
  id: ProjectEditLifecycleStageId
  label: string
  status: ProjectEditLifecycleStageStatus
  summary: string
}

export interface ProjectEditLifecycleInput {
  backendUploadAvailable: boolean
  backendUploadResult?: ProjectSourceVideoBackendUploadResult
  backendUploadStatus: ProjectSourceVideoBackendUploadStatus
  briefSaved: boolean
  editSessionId: string
  hasLocalSourceVideo: boolean
  localPreviewResult?: ProjectSourceVideoLocalEditPreviewResult
  projectId: string
}

export interface ProjectEditLifecycleModel {
  editSessionId: string
  projectId: string
  stages: ProjectEditLifecycleStage[]
  nextAction: string
  blockers: string[]
  internalPreviewAllowed: boolean
  backendUploadAllowed: boolean
  toolExecutionAllowed: boolean
  finalExportAllowed: false
  productReady: false
}

function stage(
  id: ProjectEditLifecycleStageId,
  label: string,
  status: ProjectEditLifecycleStageStatus,
  summary: string,
): ProjectEditLifecycleStage {
  return { id, label, status, summary }
}

export function buildProjectEditLifecycleModel(input: ProjectEditLifecycleInput): ProjectEditLifecycleModel {
  const backendUploaded = input.backendUploadResult?.status === 'uploaded'
  const internalPreviewReady = input.localPreviewResult?.status === 'preview_ready'
  const backendUploadAllowed = input.hasLocalSourceVideo && input.backendUploadAvailable && input.backendUploadStatus !== 'uploading'
  const internalPreviewAllowed = backendUploaded && input.briefSaved

  const blockers = [
    input.hasLocalSourceVideo ? undefined : 'source_video_required',
    backendUploaded ? undefined : 'backend_local_upload_required',
    input.briefSaved ? undefined : 'brief_save_required',
    'edit_plan_generation_required',
    'credit_estimate_and_approval_required',
    'approved_plan_snapshot_required',
    'professional_qa_and_final_export_required',
  ].filter(Boolean) as string[]

  const stages: ProjectEditLifecycleStage[] = [
    stage('project_created', 'Project created', 'complete', 'The project is the top-level container for edits, source media, brief notes, previews, and versions.'),
    stage('edit_created', 'Edit workspace created', 'complete', 'The edit workspace is where source upload, brief, chat, preview, and review stay together.'),
    stage(
      'source_video_selected',
      'Source video selected',
      input.hasLocalSourceVideo ? 'complete' : 'ready',
      input.hasLocalSourceVideo ? 'A browser-local source video is attached to this edit.' : 'Choose the source video that belongs to this edit.',
    ),
    stage(
      'backend_upload_configured',
      'Backend-local upload gate',
      input.backendUploadAvailable ? 'ready' : 'blocked',
      input.backendUploadAvailable
        ? 'Internal upload endpoints are configured for local testing.'
        : 'Backend-local upload is disabled until the internal upload env gate is supplied.',
    ),
    stage(
      'backend_upload_completed',
      'Canonical source object recorded',
      backendUploaded ? 'complete' : backendUploadAllowed ? 'ready' : 'blocked',
      backendUploaded
        ? 'The source video has backend-local bucket/object metadata.'
        : 'Upload for testing after selecting a source video and enabling the backend-local upload gate.',
    ),
    stage(
      'brief_saved',
      'Brief saved',
      input.briefSaved ? 'complete' : input.hasLocalSourceVideo ? 'ready' : 'blocked',
      input.briefSaved
        ? 'The edit brief is saved locally for this edit workspace.'
        : 'Save the editing direction before planning or preview work starts.',
    ),
    stage('edit_plan_required', 'Edit plan required', 'blocked', 'A professional edit plan still has to be generated from source, brief, timing, layout, and tool strategy.'),
    stage('credit_approval_required', 'Credit approval required', 'blocked', 'The user must approve the edit plan and credit estimate before expensive work.'),
    stage('approved_snapshot_required', 'Approved snapshot required', 'blocked', 'Workers must execute an approved immutable plan snapshot, not raw chat text.'),
    stage(
      'internal_preview_ready',
      'Internal preview smoke',
      internalPreviewReady ? 'complete' : internalPreviewAllowed ? 'ready' : 'blocked',
      internalPreviewReady
        ? 'A preview-only internal smoke result exists for this local source.'
        : 'Available only after backend-local upload and brief save; it does not approve production execution.',
    ),
    stage('final_export_blocked', 'Final export', 'blocked', 'Final export stays blocked until professional QA, artifact readiness, and release gates pass.'),
  ]

  return {
    editSessionId: input.editSessionId,
    projectId: input.projectId,
    stages,
    nextAction: !input.hasLocalSourceVideo
      ? 'Select the source video for this edit.'
      : !backendUploaded
        ? 'Upload the selected source through the backend-local upload gate.'
        : !input.briefSaved
          ? 'Save the edit brief.'
          : internalPreviewReady
            ? 'Generate the real edit plan and credit estimate next.'
            : 'Run the preview-only internal smoke or continue to planning.',
    blockers,
    internalPreviewAllowed,
    backendUploadAllowed,
    toolExecutionAllowed: false,
    finalExportAllowed: false,
    productReady: false,
  }
}
