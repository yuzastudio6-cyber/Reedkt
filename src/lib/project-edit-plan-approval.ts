import type { ProjectSourceVideoBackendUploadResult } from '../types/project-source-video'

export type ProjectEditPlanApprovalStatus =
  | 'waiting_for_source'
  | 'waiting_for_backend_upload'
  | 'waiting_for_brief'
  | 'ready_for_approval'
  | 'approved'

export interface ProjectEditPlanApprovalStep {
  label: string
  summary: string
}

export interface ProjectEditPlanCreditEstimate {
  lowCredits: number
  expectedCredits: number
  highCredits: number
  creditConversion: '1 credit = $0.10'
  serviceFeeIncluded: false
}

export interface ProjectEditPlanApprovalInput {
  approved: boolean
  backendUploadResult?: ProjectSourceVideoBackendUploadResult
  briefSaved: boolean
  briefText: string
  editSessionId: string
  projectId: string
  sourceAspectRatio?: string
  sourceDurationSeconds?: number
  sourceFileName?: string
}

export interface ProjectEditPlanApprovalModel {
  approved: boolean
  blockers: string[]
  canApprove: boolean
  creditEstimate: ProjectEditPlanCreditEstimate
  editSessionId: string
  planId: string
  productReady: false
  providerCallMade: false
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
  projectId: string
  sourceSummary: string
  status: ProjectEditPlanApprovalStatus
  steps: ProjectEditPlanApprovalStep[]
  summary: string
  title: string
  warnings: string[]
}

function safeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'local'
}

export function estimateLocalEditPlanCredits(durationSeconds?: number): ProjectEditPlanCreditEstimate {
  const boundedDurationSeconds = Math.max(1, Math.min(Math.ceil(durationSeconds ?? 60), 600))
  const durationUnits = Math.max(1, Math.ceil(boundedDurationSeconds / 30))
  const expectedCredits = 4 + durationUnits * 2

  return {
    lowCredits: Math.max(1, expectedCredits - 2),
    expectedCredits,
    highCredits: expectedCredits + 4,
    creditConversion: '1 credit = $0.10',
    serviceFeeIncluded: false,
  }
}

export function buildProjectEditPlanApprovalModel(input: ProjectEditPlanApprovalInput): ProjectEditPlanApprovalModel {
  const backendUploaded = input.backendUploadResult?.status === 'uploaded'
  const hasBrief = input.briefSaved && input.briefText.trim().length > 0
  const hasSource = Boolean(input.sourceFileName || input.backendUploadResult?.fileName)
  const canApprove = hasSource && backendUploaded && hasBrief
  const approved = canApprove && input.approved

  const status: ProjectEditPlanApprovalStatus = approved
    ? 'approved'
    : !hasSource
      ? 'waiting_for_source'
      : !backendUploaded
        ? 'waiting_for_backend_upload'
        : !hasBrief
          ? 'waiting_for_brief'
          : 'ready_for_approval'

  const blockers = [
    hasSource ? undefined : 'source_video_required',
    backendUploaded ? undefined : 'backend_local_upload_required',
    hasBrief ? undefined : 'brief_save_required',
    approved ? undefined : 'plan_credit_approval_required',
  ].filter(Boolean) as string[]

  const sourceName = input.sourceFileName ?? input.backendUploadResult?.fileName ?? 'source video'
  const sourceSummary = [
    sourceName,
    input.sourceAspectRatio ? `${input.sourceAspectRatio} frame` : undefined,
    input.sourceDurationSeconds ? `${Math.round(input.sourceDurationSeconds)}s source` : undefined,
  ].filter(Boolean).join(' · ')

  return {
    approved,
    blockers,
    canApprove,
    creditEstimate: estimateLocalEditPlanCredits(input.sourceDurationSeconds),
    editSessionId: input.editSessionId,
    planId: `local-plan-${safeSegment(input.projectId)}-${safeSegment(input.editSessionId)}`,
    productReady: false,
    providerCallMade: false,
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
    projectId: input.projectId,
    sourceSummary,
    status,
    steps: [
      {
        label: 'Source review',
        summary: 'Confirm the uploaded source belongs to this edit and keep the browser preview tied to the backend-local source record.',
      },
      {
        label: 'Clean assembly',
        summary: 'Build a professional first pass around pacing, meaning preservation, simple structure, and the saved brief.',
      },
      {
        label: 'Caption and timing pass',
        summary: 'Prepare readable caption and timing intent before any worker can execute a future approved snapshot.',
      },
      {
        label: 'Sound balance',
        summary: 'Keep voice clarity first and treat music or effects as later approved enhancements.',
      },
      {
        label: 'Review preview',
        summary: 'Unlock only the internal preview smoke path for local testing; final export stays blocked.',
      },
    ],
    summary: input.briefText.trim() || 'No edit brief has been saved yet.',
    title: 'Local test edit plan',
    warnings: [
      'Approving this local plan does not call providers, run production tools, write Supabase, or unlock final export.',
      'The preview smoke remains internal and product-ready local OSS count stays 0.',
    ],
  }
}
