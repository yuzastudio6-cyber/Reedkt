import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoBackendUploadStatus,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
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
  | 'preview_review_required'
  | 'final_export_blocked'

export type ProjectEditLifecycleStageStatus = 'complete' | 'ready' | 'blocked'

export type ProjectEditFinalExportGateId =
  | 'source_uploaded'
  | 'brief_saved'
  | 'plan_approved'
  | 'approved_snapshot_created'
  | 'credit_reservation_ready'
  | 'preview_ready'
  | 'preview_review_approved'
  | 'professional_qa_passed'
  | 'required_assets_ready'
  | 'artifact_manifest_ready'
  | 'final_render_worker_ready'
  | 'export_delivery_policy_ready'

export interface ProjectEditFinalExportGate {
  id: ProjectEditFinalExportGateId
  label: string
  passed: boolean
  blocker: string
}

export interface ProjectEditFinalExportEvidenceInput {
  professionalQaPassed?: boolean
  requiredAssetsReady?: boolean
  artifactManifestReady?: boolean
  finalRenderWorkerReady?: boolean
  exportDeliveryPolicyReady?: boolean
}

export interface ProjectEditFinalExportReadiness {
  allowed: boolean
  productReady: boolean
  status: 'ready_for_final_export' | 'blocked'
  summary: string
  blockers: ProjectEditFinalExportGateId[]
  gates: ProjectEditFinalExportGate[]
}

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
  planApproved: boolean
  planReady: boolean
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  projectId: string
  finalExportEvidence?: ProjectEditFinalExportEvidenceInput
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
  finalExportAllowed: boolean
  productReady: boolean
  finalExportReadiness: ProjectEditFinalExportReadiness
}

function stage(
  id: ProjectEditLifecycleStageId,
  label: string,
  status: ProjectEditLifecycleStageStatus,
  summary: string,
): ProjectEditLifecycleStage {
  return { id, label, status, summary }
}

function gate(
  id: ProjectEditFinalExportGateId,
  label: string,
  passed: boolean,
  blocker: string,
): ProjectEditFinalExportGate {
  return { id, label, passed, blocker }
}

function buildFinalExportReadiness(input: {
  backendUploaded: boolean
  briefSaved: boolean
  planApproved: boolean
  internalPreviewReady: boolean
  previewReviewedApproved: boolean
  previewHasApprovedSnapshot: boolean
  previewHasCreditReservation: boolean
  evidence?: ProjectEditFinalExportEvidenceInput
}): ProjectEditFinalExportReadiness {
  const gates = [
    gate('source_uploaded', 'Source uploaded', input.backendUploaded, 'backend_local_upload_required'),
    gate('brief_saved', 'Brief saved', input.briefSaved, 'brief_save_required'),
    gate('plan_approved', 'Plan and credit estimate approved', input.planApproved, 'plan_credit_approval_required'),
    gate('approved_snapshot_created', 'Approved snapshot created', input.previewHasApprovedSnapshot, 'approved_plan_snapshot_required'),
    gate('credit_reservation_ready', 'Credit reservation ready', input.previewHasCreditReservation, 'credit_reservation_required'),
    gate('preview_ready', 'Preview ready', input.internalPreviewReady, 'preview_ready_required'),
    gate('preview_review_approved', 'Preview approved by tester', input.previewReviewedApproved, 'preview_approval_required'),
    gate('professional_qa_passed', 'Professional QA passed', input.evidence?.professionalQaPassed === true, 'professional_qa_required'),
    gate('required_assets_ready', 'Required assets ready', input.evidence?.requiredAssetsReady === true, 'required_assets_required'),
    gate('artifact_manifest_ready', 'Artifact manifest ready', input.evidence?.artifactManifestReady === true, 'artifact_manifest_required'),
    gate('final_render_worker_ready', 'Final render worker ready', input.evidence?.finalRenderWorkerReady === true, 'final_render_worker_required'),
    gate('export_delivery_policy_ready', 'Export delivery policy ready', input.evidence?.exportDeliveryPolicyReady === true, 'export_delivery_policy_required'),
  ]
  const blockers = gates.filter((item) => !item.passed).map((item) => item.id)
  const allowed = blockers.length === 0

  return {
    allowed,
    productReady: allowed,
    status: allowed ? 'ready_for_final_export' : 'blocked',
    summary: allowed
      ? 'All final export evidence gates are present. The edit can move to final export execution.'
      : 'Final export remains blocked until preview approval, professional QA, required assets, artifact manifest, final render worker, and delivery policy evidence are present.',
    blockers,
    gates,
  }
}

export function buildProjectEditLifecycleModel(input: ProjectEditLifecycleInput): ProjectEditLifecycleModel {
  const backendUploaded = input.backendUploadResult?.status === 'uploaded'
  const internalPreviewReady = input.localPreviewResult?.status === 'preview_ready'
  const previewReviewedApproved = input.previewReviewResult?.reviewStatus === 'approved'
  const previewReviewed = previewReviewedApproved || input.previewReviewResult?.reviewStatus === 'changes_requested'
  const backendUploadAllowed = input.hasLocalSourceVideo && input.backendUploadAvailable && input.backendUploadStatus !== 'uploading'
  const internalPreviewAllowed = backendUploaded && input.briefSaved && input.planApproved
  const finalExportReadiness = buildFinalExportReadiness({
    backendUploaded,
    briefSaved: input.briefSaved,
    planApproved: input.planApproved,
    internalPreviewReady,
    previewReviewedApproved,
    previewHasApprovedSnapshot: Boolean(input.localPreviewResult?.approvedPlanSnapshotId),
    previewHasCreditReservation: Boolean(input.localPreviewResult?.creditReservationId),
    evidence: input.finalExportEvidence,
  })

  const blockers = [
    input.hasLocalSourceVideo ? undefined : 'source_video_required',
    backendUploaded ? undefined : 'backend_local_upload_required',
    input.briefSaved ? undefined : 'brief_save_required',
    input.planReady ? undefined : 'edit_plan_required',
    input.planApproved ? undefined : 'plan_credit_approval_required',
    internalPreviewReady ? undefined : 'approved_plan_snapshot_required',
    previewReviewed ? undefined : 'preview_review_required',
    ...finalExportReadiness.gates
      .filter((item) => !item.passed)
      .map((item) => item.blocker),
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
    stage(
      'edit_plan_required',
      'Edit plan required',
      input.planReady ? 'complete' : backendUploaded && input.briefSaved ? 'ready' : 'blocked',
      input.planReady
        ? 'A local test edit plan and credit estimate are ready for this edit.'
        : 'Create the edit plan from source, brief, timing, layout, and tool strategy before preview work starts.',
    ),
    stage(
      'credit_approval_required',
      'Credit approval required',
      input.planApproved ? 'complete' : input.planReady ? 'ready' : 'blocked',
      input.planApproved
        ? 'The local test plan and credit estimate have been approved for internal preview smoke only.'
        : 'The user must approve the edit plan and credit estimate before any preview or expensive work.',
    ),
    stage(
      'approved_snapshot_required',
      'Approved snapshot required',
      internalPreviewReady ? 'complete' : input.planApproved ? 'ready' : 'blocked',
      internalPreviewReady
        ? 'The preview smoke created an approved local snapshot record for this test run.'
        : 'Workers must execute an approved immutable plan snapshot, not raw chat text.',
    ),
    stage(
      'internal_preview_ready',
      'Internal preview smoke',
      internalPreviewReady ? 'complete' : internalPreviewAllowed ? 'ready' : 'blocked',
      internalPreviewReady
        ? 'A preview-only internal smoke result exists for this local source.'
        : 'Available only after backend-local upload, brief save, and local plan approval; it does not approve production execution.',
    ),
    stage(
      'preview_review_required',
      'Preview review',
      previewReviewed ? 'complete' : internalPreviewReady ? 'ready' : 'blocked',
      previewReviewed
        ? `Internal tester review recorded: ${input.previewReviewResult?.reviewStatus.replace(/_/g, ' ')}.`
        : 'Review the preview result before any final export or professional QA gate can proceed.',
    ),
    stage(
      'final_export_blocked',
      'Final export',
      finalExportReadiness.allowed ? 'ready' : 'blocked',
      finalExportReadiness.summary,
    ),
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
          : !input.planReady
            ? 'Review the local edit plan and credit estimate.'
            : !input.planApproved
              ? 'Approve the local edit plan and credit estimate before preview.'
          : !internalPreviewReady
            ? 'Run the preview-only internal smoke.'
            : !previewReviewed
              ? 'Review the preview and request changes or approve the result.'
              : 'Continue to professional QA and final export implementation gates.',
    blockers,
    internalPreviewAllowed,
    backendUploadAllowed,
    toolExecutionAllowed: finalExportReadiness.allowed,
    finalExportAllowed: finalExportReadiness.allowed,
    productReady: finalExportReadiness.productReady,
    finalExportReadiness,
  }
}
