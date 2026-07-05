import type {
  ProjectSourceVideoBackendUploadResult,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQACheck,
  ProjectSourceVideoProfessionalQACheckId,
  ProjectSourceVideoProfessionalQAResult,
} from '../types/project-source-video'

export interface CreateProjectSourceVideoProfessionalQAInput {
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  sourceVideoUploadResult?: ProjectSourceVideoBackendUploadResult
  workspaceId: string
}

function check(
  id: ProjectSourceVideoProfessionalQACheckId,
  label: string,
  passed: boolean,
  blocker: string,
): ProjectSourceVideoProfessionalQACheck {
  return { id, label, passed, blocker }
}

export function createProjectSourceVideoProfessionalQA(
  input: CreateProjectSourceVideoProfessionalQAInput,
): ProjectSourceVideoProfessionalQAResult {
  const preview = input.previewResult
  const review = input.previewReviewResult
  const upload = input.sourceVideoUploadResult
  const renderId = preview?.renderId ?? review?.renderId ?? 'preview-render-missing'
  const checks = [
    check(
      'source_uploaded',
      'Source recorded',
      upload?.status === 'uploaded' && Boolean(upload.storageObjectRecordId) && Boolean(upload.mediaAssetId),
      'backend_local_source_upload_required',
    ),
    check(
      'approved_snapshot_present',
      'Approved snapshot present',
      Boolean(preview?.approvedPlanSnapshotId),
      'approved_plan_snapshot_required',
    ),
    check(
      'credit_reservation_present',
      'Credit approval record present',
      Boolean(preview?.creditReservationId),
      'credit_reservation_required',
    ),
    check(
      'preview_ready',
      'Preview ready',
      preview?.status === 'preview_ready' && Boolean(preview.renderId),
      'preview_ready_required',
    ),
    check(
      'preview_review_approved',
      'Preview approved',
      review?.reviewStatus === 'approved' && review.renderId === renderId,
      'preview_approval_required',
    ),
    check(
      'edit_assembly_ready',
      'Approved plan carried into preview',
      preview?.editAssembly?.mode === 'clean_internal_preview' && (preview.editAssembly.planStepCount ?? 0) > 0,
      'edit_assembly_required',
    ),
    check(
      'private_artifact_boundary',
      'Private internal boundary intact',
      preview?.previewOnly === true &&
        preview.providerCallMade === false &&
        preview.qwenCallMade === false &&
        preview.exportJobCreated === false &&
        preview.productReady === false &&
        review?.finalExportStarted === false &&
        review.providerCallMade === false &&
        review.workerJobCreated === false &&
        review.renderJobCreated === false &&
        review.productReady === false,
      'private_artifact_boundary_required',
    ),
  ]
  const blockers = checks.filter((item) => !item.passed).map((item) => item.id)

  return {
    id: `professional-qa-${renderId}`,
    workspaceId: input.workspaceId,
    editPlanId: preview?.editPlanId ?? 'edit-plan-missing',
    renderId,
    approvedPlanSnapshotId: preview?.approvedPlanSnapshotId ?? 'approved-snapshot-missing',
    creditReservationId: preview?.creditReservationId ?? 'credit-reservation-missing',
    previewReviewId: review?.id ?? 'preview-review-missing',
    status: blockers.length === 0 ? 'passed' : 'blocked',
    createdAt: new Date().toISOString(),
    checks,
    blockers,
    finalExportStarted: false,
    publicDeliveryEnabled: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    mediaProcessingStarted: false,
    creditReservedOrSpent: false,
    supabaseWriteMade: false,
    gcsWriteMade: false,
    productReady: false,
    warnings: [
      'Professional QA records metadata checks only; it does not run media analysis, providers, tools, final export, public delivery, beta, production, or billing settlement.',
    ],
  }
}

export function assertProjectSourceVideoProfessionalQAPassed(
  result: ProjectSourceVideoProfessionalQAResult | undefined,
): asserts result is ProjectSourceVideoProfessionalQAResult {
  if (!result) {
    throw new Error('Private final export requires a passed professional QA checkpoint.')
  }
  if (result.status !== 'passed') {
    throw new Error(`Private final export requires passed professional QA; current status is ${result.status}.`)
  }
}
