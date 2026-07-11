import type {
  MockRevisionJob,
  MockRevisionJobStep,
  MockRevisionJobStepKey,
  RevisionApproval,
  RevisionCreditEstimate,
  RevisionRequest,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateRevisionApprovalInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  revisionRequest: RevisionRequest
  creditEstimate?: RevisionCreditEstimate | null
  acceptsMockCredits: boolean
  understandsPreviewIsMock: boolean
  understandsRevisionIsLocal: boolean
}

type RejectRevisionApprovalInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  revisionRequest: RevisionRequest
  creditEstimate?: RevisionCreditEstimate | null
}

type CreateMockRevisionJobInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  revisionRequest: RevisionRequest
  approval?: RevisionApproval | null
  jobIndex?: number
  sourcePreviewVersion?: number
  sourceEditVersion?: number
}

const STEP_DEFINITIONS: Array<{
  key: MockRevisionJobStepKey
  label: string
  message: string
}> = [
  {
    key: 'read_edit_operations',
    label: 'Reading Edit Map operations',
    message: 'Gather local post-preview Edit Map changes for this revision request.',
  },
  {
    key: 'classify_revision',
    label: 'Classifying revision',
    message: 'Confirm whether the revision is local, rerender, regeneration, or premium-like mock work.',
  },
  {
    key: 'validate_revision_scope',
    label: 'Validating revision scope',
    message: 'Check affected systems, groups, and elements before creating a new preview version.',
  },
  {
    key: 'reserve_mock_revision_credits',
    label: 'Reserving mock revision credits',
    message: 'Record local approval for mock credits without charging real credits.',
  },
  {
    key: 'apply_edit_map_operations',
    label: 'Applying Edit Map operations',
    message: 'Apply structured local operation patches to the mock revision plan.',
  },
  {
    key: 'rerender_preview_segments',
    label: 'Rerendering preview segments',
    message: 'Simulate segment refresh locally. No renderer, provider, or media job runs.',
  },
  {
    key: 'run_revision_qa',
    label: 'Running revision QA',
    message: 'Simulate a local QA pass for the revised preview handoff.',
  },
  {
    key: 'create_preview_version',
    label: 'Creating preview version',
    message: 'Record the new local preview version metadata.',
  },
  {
    key: 'create_edit_map_version',
    label: 'Creating Edit Map version',
    message: 'Record the new local Edit Map version metadata.',
  },
]

function jobId(projectId: string, jobIndex = 1) {
  return `${projectId}-mock-revision-job-${String(jobIndex).padStart(3, '0')}`
}

function buildSteps(projectId: string, jobIndex = 1): MockRevisionJobStep[] {
  const id = jobId(projectId, jobIndex)
  return STEP_DEFINITIONS.map((step, index) => ({
    id: `${id}-step-${String(index + 1).padStart(3, '0')}`,
    key: step.key,
    label: step.label,
    status: 'pending',
    progressPercent: 0,
    message: step.message,
  }))
}

function progressForSteps(steps: MockRevisionJobStep[]) {
  return Math.round((steps.filter((step) => step.status === 'completed').length / steps.length) * 100)
}

function nextPreviewVersion(job: MockRevisionJob) {
  return job.previewVersion ?? 1
}

function nextEditVersion(job: MockRevisionJob) {
  return job.editVersion ?? 1
}

export function createRevisionApproval({
  acceptsMockCredits,
  creditEstimate,
  projectId,
  revisionRequest,
  understandsPreviewIsMock,
  understandsRevisionIsLocal,
  userId,
  workspaceId,
}: CreateRevisionApprovalInput): RevisionApproval {
  const requiresCredits = revisionRequest.costPolicy !== 'free' && Boolean(creditEstimate?.totalCredits)
  const approved = requiresCredits
    ? acceptsMockCredits && understandsPreviewIsMock && understandsRevisionIsLocal
    : true

  return {
    id: `${revisionRequest.id}-approval`,
    projectId,
    workspaceId,
    userId,
    revisionRequestId: revisionRequest.id,
    creditEstimateId: creditEstimate?.id,
    status: requiresCredits ? (approved ? 'approved' : 'required') : 'not_required',
    acknowledgement: {
      acceptsMockCredits: requiresCredits ? acceptsMockCredits : true,
      understandsPreviewIsMock,
      understandsRevisionIsLocal,
    },
    approvedAt: approved ? MOCK_CREATED_AT : undefined,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function rejectRevisionApproval({
  creditEstimate,
  projectId,
  revisionRequest,
  userId,
  workspaceId,
}: RejectRevisionApprovalInput): RevisionApproval {
  return {
    id: `${revisionRequest.id}-approval`,
    projectId,
    workspaceId,
    userId,
    revisionRequestId: revisionRequest.id,
    creditEstimateId: creditEstimate?.id,
    status: 'rejected',
    acknowledgement: {
      acceptsMockCredits: false,
      understandsPreviewIsMock: true,
      understandsRevisionIsLocal: true,
    },
    rejectedAt: MOCK_CREATED_AT,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createMockRevisionJob({
  approval,
  jobIndex = 1,
  projectId,
  revisionRequest,
  sourceEditVersion,
  sourcePreviewVersion,
  userId,
  workspaceId,
}: CreateMockRevisionJobInput): MockRevisionJob {
  const targetPreviewVersion = (sourcePreviewVersion ?? revisionRequest.sourcePreviewVersion ?? 0) + 1
  const targetEditVersion = (sourceEditVersion ?? revisionRequest.sourceEditVersion ?? 0) + 1

  return {
    id: jobId(projectId, jobIndex),
    projectId,
    workspaceId,
    userId,
    revisionRequestId: revisionRequest.id,
    status: 'queued',
    steps: buildSteps(projectId, jobIndex),
    progressPercent: 0,
    previewVersion: targetPreviewVersion,
    editVersion: targetEditVersion,
    previewId: `${projectId}-mock-preview-v${targetPreviewVersion}`,
    editDocumentId: `${projectId}-edit-document-v${targetEditVersion}`,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    previewLabel: approval?.status === 'not_required' ? 'Local mock revision queued' : undefined,
  }
}

export function advanceMockRevisionJob(job: MockRevisionJob): MockRevisionJob {
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return job
  }

  const nextPendingIndex = job.steps.findIndex((step) => step.status === 'pending' || step.status === 'running')
  if (nextPendingIndex < 0) return completeMockRevisionJob(job)

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
    previewVersion: nextPreviewVersion(job),
    editVersion: nextEditVersion(job),
    previewId: completed ? `${job.projectId}-mock-preview-v${nextPreviewVersion(job)}` : job.previewId,
    editDocumentId: completed ? `${job.projectId}-edit-document-v${nextEditVersion(job)}` : job.editDocumentId,
    previewLabel: completed ? 'Mock revised preview ready' : job.previewLabel,
    updatedAt: MOCK_CREATED_AT,
    completedAt: completed ? MOCK_CREATED_AT : job.completedAt,
  }
}

export function completeMockRevisionJob(job: MockRevisionJob): MockRevisionJob {
  const previewVersion = nextPreviewVersion(job)
  const editVersion = nextEditVersion(job)

  return {
    ...job,
    status: 'completed',
    steps: job.steps.map((step) => ({
      ...step,
      status: 'completed',
      progressPercent: 100,
    })),
    progressPercent: 100,
    previewId: `${job.projectId}-mock-preview-v${previewVersion}`,
    previewVersion,
    editDocumentId: `${job.projectId}-edit-document-v${editVersion}`,
    editVersion,
    previewLabel: 'Mock revised preview ready',
    updatedAt: MOCK_CREATED_AT,
    completedAt: MOCK_CREATED_AT,
  }
}

export function failMockRevisionJob(job: MockRevisionJob, reason: string): MockRevisionJob {
  return {
    ...job,
    status: 'failed',
    failureReason: reason,
    updatedAt: MOCK_CREATED_AT,
  }
}
