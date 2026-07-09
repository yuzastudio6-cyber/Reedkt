import type { ProjectEditPlanApprovedLocalPlan } from './project-edit-plan-approval'
import type {
  ProjectSourceVideoBriefLineage,
  ProjectSourceVideoLocalFinalExportResult,
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoOutputFrame,
  ProjectSourceVideoPreviewReviewResult,
  ProjectSourceVideoProfessionalQAResult,
} from '../types/project-source-video'

function briefLineageMatches(
  left: ProjectSourceVideoBriefLineage | undefined,
  right: ProjectSourceVideoBriefLineage | undefined,
): boolean {
  return Boolean(
    left &&
    right &&
    left.briefId === right.briefId &&
    left.revisionNumber === right.revisionNumber &&
    left.briefFingerprint === right.briefFingerprint,
  )
}

function outputFrameMatches(
  left: ProjectSourceVideoOutputFrame | undefined,
  right: ProjectSourceVideoOutputFrame | undefined,
): boolean {
  return Boolean(
    left &&
    right &&
    left.confirmed === true &&
    right.confirmed === true &&
    left.aspectRatio === right.aspectRatio &&
    left.platformTarget === right.platformTarget &&
    left.width === right.width &&
    left.height === right.height,
  )
}

export function createProjectEditApprovedEvidenceKey(input: {
  approvedLocalPlan?: ProjectEditPlanApprovedLocalPlan
  sourceStorageObjectRecordId?: string
}): string | undefined {
  const { approvedLocalPlan, sourceStorageObjectRecordId } = input
  if (!approvedLocalPlan?.approved || !sourceStorageObjectRecordId) return undefined
  const { briefLineage } = approvedLocalPlan
  return [
    sourceStorageObjectRecordId,
    approvedLocalPlan.planId,
    briefLineage.briefId,
    String(briefLineage.revisionNumber),
    briefLineage.briefFingerprint,
  ].join(':')
}

export function previewResultMatchesApprovedEvidence(input: {
  approvedLocalPlan?: ProjectEditPlanApprovedLocalPlan
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  sourceStorageObjectRecordId?: string
}): boolean {
  const { approvedLocalPlan, previewResult, sourceStorageObjectRecordId } = input
  if (!approvedLocalPlan || !previewResult || !sourceStorageObjectRecordId) return false
  return (
    previewResult.sourceStorageObjectRecordId === sourceStorageObjectRecordId &&
    previewResult.editPlanId === approvedLocalPlan.planId &&
    previewResult.briefLineage.briefId === approvedLocalPlan.briefLineage.briefId &&
    previewResult.briefLineage.revisionNumber === approvedLocalPlan.briefLineage.revisionNumber &&
    previewResult.briefLineage.briefFingerprint === approvedLocalPlan.briefLineage.briefFingerprint &&
    outputFrameMatches(previewResult.editAssembly?.outputFrame, approvedLocalPlan.operationManifest.outputFrame)
  )
}

export function previewReviewMatchesPreview(input: {
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
}): boolean {
  const { previewResult, previewReviewResult } = input
  return Boolean(previewResult?.renderId && previewReviewResult?.renderId === previewResult.renderId)
}

export function professionalQAMatchesCurrentEvidence(input: {
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  professionalQAResult?: ProjectSourceVideoProfessionalQAResult
  sourceStorageObjectRecordId?: string
}): boolean {
  const { previewResult, previewReviewResult, professionalQAResult, sourceStorageObjectRecordId } = input
  return Boolean(
    previewResult?.renderId &&
    previewReviewResult?.id &&
    professionalQAResult &&
    previewReviewMatchesPreview({ previewResult, previewReviewResult }) &&
    professionalQAResult.editPlanId === previewResult.editPlanId &&
    professionalQAResult.renderId === previewResult.renderId &&
    professionalQAResult.approvedPlanSnapshotId === previewResult.approvedPlanSnapshotId &&
    professionalQAResult.creditReservationId === previewResult.creditReservationId &&
    professionalQAResult.previewReviewId === previewReviewResult.id &&
    professionalQAResult.sourceStorageObjectRecordId === previewResult.sourceStorageObjectRecordId &&
    professionalQAResult.sourceStorageObjectRecordId === sourceStorageObjectRecordId &&
    briefLineageMatches(professionalQAResult.briefLineage, previewResult.briefLineage),
  )
}

export function finalExportMatchesCurrentEvidence(input: {
  finalExportResult?: ProjectSourceVideoLocalFinalExportResult
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
  professionalQAResult?: ProjectSourceVideoProfessionalQAResult
  sourceStorageObjectRecordId?: string
}): boolean {
  const {
    finalExportResult,
    previewResult,
    previewReviewResult,
    professionalQAResult,
    sourceStorageObjectRecordId,
  } = input

  return Boolean(
    finalExportResult?.status === 'final_export_ready' &&
    professionalQAResult &&
    professionalQAMatchesCurrentEvidence({
      previewResult,
      previewReviewResult,
      professionalQAResult,
      sourceStorageObjectRecordId,
    }) &&
    finalExportResult.editPlanId === previewResult?.editPlanId &&
    finalExportResult.approvedPlanSnapshotId === previewResult.approvedPlanSnapshotId &&
    finalExportResult.creditReservationId === previewResult.creditReservationId &&
    finalExportResult.previewReviewId === previewReviewResult?.id &&
    finalExportResult.sourceStorageObjectRecordId === previewResult.sourceStorageObjectRecordId &&
    finalExportResult.sourceStorageObjectRecordId === sourceStorageObjectRecordId &&
    finalExportResult.professionalQA?.id === professionalQAResult.id &&
    briefLineageMatches(finalExportResult.briefLineage, previewResult.briefLineage) &&
    outputFrameMatches(finalExportResult.editAssembly?.outputFrame, previewResult.editAssembly?.outputFrame),
  )
}
