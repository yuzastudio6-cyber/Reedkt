import type {
  ProfessionalQaCategory,
  ProfessionalQaIssueType,
  ProfessionalQaItemStatus,
  ProfessionalQaReportItem,
  ProfessionalQaStatus,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type MakeQaItemInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  reportId: string
  index: number
  category: ProfessionalQaCategory
  type: ProfessionalQaIssueType
  status: ProfessionalQaItemStatus
  title: string
  message: string
  suggestedAction?: string
  relatedEditCueId?: string
  relatedMediaAssetId?: string
  relatedConflictId?: string
  relatedTreatmentPlanId?: string
  relatedComplianceCheckId?: string
}

export function qaStatusFromItems(items: ProfessionalQaReportItem[]): ProfessionalQaStatus {
  if (items.length === 0) return 'not_run'
  if (items.some((item) => item.status === 'blocking')) return 'blocked'
  if (items.some((item) => item.status === 'warning')) return 'needs_review'
  if (items.some((item) => item.status === 'accepted_warning')) return 'accepted_with_warnings'
  return 'passed'
}

export function previewReadinessFromQaStatus(status: ProfessionalQaStatus) {
  if (status === 'passed') return 'ready'
  if (status === 'accepted_with_warnings') return 'ready_with_warnings'
  if (status === 'needs_review') return 'needs_review'
  if (status === 'blocked' || status === 'failed') return 'blocked'
  return 'not_run'
}

export function getQaCategoryLabel(category: ProfessionalQaCategory) {
  const labels: Record<ProfessionalQaCategory, string> = {
    planning_readiness: 'Planning readiness',
    cue_compliance: 'Cue compliance',
    professional_integration: 'Professional Integration',
    asset_treatment: 'Asset treatment',
    broll_treatment: 'B-roll treatment',
    overlay_composition: 'Overlay composition',
    caption_safety: 'Caption safety',
    face_safety: 'Face safety',
    privacy: 'Privacy',
    audio: 'Audio',
    readability: 'Readability',
    safe_zone: 'Safe zone',
    timing: 'Timing',
    style_consistency: 'Style consistency',
    source_integrity: 'Source integrity',
    other: 'Other',
  }
  return labels[category]
}

export function getQaItemStatusLabel(status: ProfessionalQaItemStatus) {
  const labels: Record<ProfessionalQaItemStatus, string> = {
    passed: 'Passed',
    warning: 'Warning',
    blocking: 'Blocking',
    info: 'Info',
    accepted_warning: 'Accepted warning',
  }
  return labels[status]
}

export function isQaWarningAcceptable(item: ProfessionalQaReportItem) {
  return item.status === 'warning'
}

export function makeQaItem(input: MakeQaItemInput): ProfessionalQaReportItem {
  return {
    id: `${input.reportId}-item-${String(input.index).padStart(3, '0')}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    reportId: input.reportId,
    category: input.category,
    type: input.type,
    status: input.status,
    title: input.title,
    message: input.message,
    suggestedAction: input.suggestedAction,
    relatedEditCueId: input.relatedEditCueId,
    relatedMediaAssetId: input.relatedMediaAssetId,
    relatedConflictId: input.relatedConflictId,
    relatedTreatmentPlanId: input.relatedTreatmentPlanId,
    relatedComplianceCheckId: input.relatedComplianceCheckId,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createPassedQaItem(
  input: Omit<MakeQaItemInput, 'status' | 'type'> & { type?: ProfessionalQaIssueType },
): ProfessionalQaReportItem {
  return makeQaItem({
    ...input,
    status: 'passed',
    type: input.type ?? 'passed_check',
  })
}
