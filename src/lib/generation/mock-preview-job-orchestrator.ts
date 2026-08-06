import type {
  GenerationApproval,
  MockCreditEstimate,
  MockPreviewJob,
  MockPreviewJobStep,
  MockPreviewJobStepKey,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateGenerationApprovalInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  creditEstimate: MockCreditEstimate | null
  acceptsQaWarnings: boolean
  understandsPreviewIsMock: boolean
  warningsRequireAcknowledgement?: boolean
}

type CreateMockPreviewJobInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContextId?: string
  professionalIntegrationPlanId?: string
  qaReportId?: string
  creditEstimateId?: string
  approvalId?: string
}

const STEP_DEFINITIONS: Array<{
  key: MockPreviewJobStepKey
  label: string
  message: string
}> = [
  {
    key: 'read_planning_context',
    label: 'Reading planning context',
    message: 'Gather source timing, source roles, optional brief direction, and edit cues.',
  },
  {
    key: 'validate_qa_readiness',
    label: 'Validating QA readiness',
    message: 'Check Professional QA status before private review handoff.',
  },
  {
    key: 'reserve_mock_credits',
    label: 'Recording credit preview',
    message: 'Record the internal estimate acknowledgement without charging credits.',
  },
  {
    key: 'prepare_render_inputs',
    label: 'Preparing review inputs',
    message: 'Shape the approved local plan into private-review-ready instructions.',
  },
  {
    key: 'apply_professional_treatments',
    label: 'Applying professional treatments',
    message: 'Apply local B-roll, overlay, asset, caption, privacy, crop, and audio treatment decisions.',
  },
  {
    key: 'build_preview_timeline',
    label: 'Building review timeline',
    message: 'Assemble a deterministic internal review timeline.',
  },
  {
    key: 'run_final_preview_qa',
    label: 'Running final preview QA',
    message: 'Run a final local readiness pass on the private review handoff.',
  },
  {
    key: 'preview_ready',
    label: 'Private review ready',
    message: 'Context-aware private review is ready.',
  },
]

function jobId(projectId: string) {
  return `${projectId}-mock-preview-job`
}

function buildSteps(projectId: string): MockPreviewJobStep[] {
  const id = jobId(projectId)
  return STEP_DEFINITIONS.map((step, index) => ({
    id: `${id}-step-${String(index + 1).padStart(3, '0')}`,
    key: step.key,
    label: step.label,
    status: 'pending',
    progressPercent: 0,
    message: step.message,
  }))
}

function progressForSteps(steps: MockPreviewJobStep[]) {
  return Math.round((steps.filter((step) => step.status === 'completed').length / steps.length) * 100)
}

export function createGenerationApproval({
  acceptsQaWarnings,
  creditEstimate,
  projectId,
  understandsPreviewIsMock,
  userId,
  warningsRequireAcknowledgement = false,
  workspaceId,
}: CreateGenerationApprovalInput): GenerationApproval {
  const acknowledgement = {
    acceptsMockCredits: Boolean(creditEstimate),
    acceptsQaWarnings: warningsRequireAcknowledgement ? acceptsQaWarnings : true,
    understandsPreviewIsMock,
  }
  const approved = acknowledgement.acceptsMockCredits &&
    acknowledgement.acceptsQaWarnings &&
    acknowledgement.understandsPreviewIsMock

  return {
    id: `${projectId}-generation-approval`,
    projectId,
    workspaceId,
    userId,
    creditEstimateId: creditEstimate?.id,
    status: approved ? 'approved' : 'required',
    approvedAt: approved ? MOCK_CREATED_AT : undefined,
    acknowledgement,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createMockPreviewJob({
  approvalId,
  creditEstimateId,
  planningContextId,
  professionalIntegrationPlanId,
  projectId,
  qaReportId,
  userId,
  workspaceId,
}: CreateMockPreviewJobInput): MockPreviewJob {
  return {
    id: jobId(projectId),
    projectId,
    workspaceId,
    userId,
    status: 'queued',
    planningContextId,
    professionalIntegrationPlanId,
    qaReportId,
    creditEstimateId,
    approvalId,
    steps: buildSteps(projectId),
    progressPercent: 0,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function advanceMockPreviewJob(job: MockPreviewJob): MockPreviewJob {
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return job
  }

  const nextPendingIndex = job.steps.findIndex((step) => step.status === 'pending' || step.status === 'running')
  if (nextPendingIndex < 0) {
    return completeMockPreviewJob(job)
  }

  const nextSteps = job.steps.map((step, index) =>
    index === nextPendingIndex
      ? { ...step, status: 'completed' as const, progressPercent: 100 }
      : step,
  )
  const progressPercent = progressForSteps(nextSteps)
  const completed = progressPercent >= 100

  return {
    ...job,
    status: completed ? 'completed' : 'running',
    steps: nextSteps,
    progressPercent,
    previewId: completed ? `${job.projectId}-mock-preview` : job.previewId,
    previewLabel: completed ? 'Private review ready' : job.previewLabel,
    updatedAt: MOCK_CREATED_AT,
    completedAt: completed ? MOCK_CREATED_AT : job.completedAt,
  }
}

export function completeMockPreviewJob(job: MockPreviewJob): MockPreviewJob {
  return {
    ...job,
    status: 'completed',
    steps: job.steps.map((step) => ({
      ...step,
      status: 'completed',
      progressPercent: 100,
    })),
    progressPercent: 100,
    previewId: `${job.projectId}-mock-preview`,
    previewLabel: 'Private review ready',
    updatedAt: MOCK_CREATED_AT,
    completedAt: MOCK_CREATED_AT,
  }
}

export function failMockPreviewJob(job: MockPreviewJob, reason: string): MockPreviewJob {
  return {
    ...job,
    status: 'failed',
    progressPercent: job.progressPercent,
    failureReason: reason,
    updatedAt: MOCK_CREATED_AT,
  }
}
