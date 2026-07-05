import type { ProjectEditPlanApprovedLocalPlan } from './project-edit-plan-approval'
import type {
  ProjectSourceVideoLocalEditPreviewResult,
  ProjectSourceVideoPreviewReviewResult,
} from '../types/project-source-video'

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
    previewResult.briefLineage.briefFingerprint === approvedLocalPlan.briefLineage.briefFingerprint
  )
}

export function previewReviewMatchesPreview(input: {
  previewResult?: ProjectSourceVideoLocalEditPreviewResult
  previewReviewResult?: ProjectSourceVideoPreviewReviewResult
}): boolean {
  const { previewResult, previewReviewResult } = input
  return Boolean(previewResult?.renderId && previewReviewResult?.renderId === previewResult.renderId)
}
