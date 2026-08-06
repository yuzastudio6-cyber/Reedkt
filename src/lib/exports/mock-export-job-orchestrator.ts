import type {
  ExportApproval,
  ExportSettings,
  MockExportEstimate,
  MockExportJob,
  MockExportJobStep,
  MockExportJobStepKey,
  MockExportOutput,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { getEnabledExportTargets } from './export-settings-builder'

type CreateExportApprovalInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  exportEstimate: MockExportEstimate | null
  acceptsMockCredits: boolean
  understandsExportIsMock: boolean
  understandsNoRealFileWillBeCreated: boolean
}

type RejectExportApprovalInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  exportEstimate?: MockExportEstimate | null
}

type CreateMockExportJobInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  exportSettings: ExportSettings
  exportEstimate?: MockExportEstimate | null
  approval?: ExportApproval | null
  jobIndex?: number
}

type CreateMockExportOutputsInput = {
  projectId: string
  exportSettings: ExportSettings
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
}

const stepDefinitions: Array<{ key: MockExportJobStepKey; label: string; message: string }> = [
  {
    key: 'read_preview_version',
    label: 'Reading preview version',
    message: 'Gather the latest private review and Edit Map version metadata.',
  },
  {
    key: 'validate_export_readiness',
    label: 'Validating export readiness',
    message: 'Check local QA, generation, revision, and export setting readiness.',
  },
  {
    key: 'prepare_platform_versions',
    label: 'Preparing platform versions',
    message: 'Prepare enabled platform targets and settings.',
  },
  {
    key: 'verify_approved_edit_credit_coverage',
    label: 'Verifying approved edit coverage',
    message: 'Verify that this output is covered by the approved 4K edit estimate and existing reservation. No export-time credit action occurs.',
  },
  {
    key: 'apply_export_settings',
    label: 'Applying export settings',
    message: 'Apply aspect ratio, resolution, caption, safe-zone, quality, and format settings.',
  },
  {
    key: 'render_mock_outputs',
    label: 'Preparing output records',
    message: 'Prepare private output records without creating public delivery files.',
  },
  {
    key: 'run_export_qa',
    label: 'Running export QA',
    message: 'Run the internal packaging QA pass.',
  },
  {
    key: 'package_exports',
    label: 'Packaging exports',
    message: 'Package private output records for each enabled target.',
  },
  {
    key: 'export_ready',
    label: 'Export ready',
    message: 'Private output records are ready for review.',
  },
]

function jobId(projectId: string, jobIndex = 1) {
  return `${projectId}-mock-export-job-${String(jobIndex).padStart(3, '0')}`
}

function buildSteps(projectId: string, jobIndex = 1): MockExportJobStep[] {
  const id = jobId(projectId, jobIndex)
  return stepDefinitions.map((step, index) => ({
    id: `${id}-step-${String(index + 1).padStart(3, '0')}`,
    key: step.key,
    label: step.label,
    status: 'pending',
    progressPercent: 0,
    message: step.message,
  }))
}

function progressForSteps(steps: MockExportJobStep[]) {
  return Math.round((steps.filter((step) => step.status === 'completed').length / steps.length) * 100)
}

export function createExportApproval({
  acceptsMockCredits,
  exportEstimate,
  projectId,
  understandsExportIsMock,
  understandsNoRealFileWillBeCreated,
  userId,
  workspaceId,
}: CreateExportApprovalInput): ExportApproval {
  const creditsAccepted = (exportEstimate?.totalCredits ?? 0) > 0 ? acceptsMockCredits : true
  const approved = creditsAccepted && understandsExportIsMock && understandsNoRealFileWillBeCreated

  return {
    id: `${projectId}-export-approval`,
    projectId,
    workspaceId,
    userId,
    exportEstimateId: exportEstimate?.id,
    status: approved ? 'approved' : 'required',
    acknowledgement: {
      acceptsMockCredits: creditsAccepted,
      understandsExportIsMock,
      understandsNoRealFileWillBeCreated,
    },
    approvedAt: approved ? MOCK_CREATED_AT : undefined,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function rejectExportApproval({
  exportEstimate,
  projectId,
  userId,
  workspaceId,
}: RejectExportApprovalInput): ExportApproval {
  return {
    id: `${projectId}-export-approval`,
    projectId,
    workspaceId,
    userId,
    exportEstimateId: exportEstimate?.id,
    status: 'rejected',
    acknowledgement: {
      acceptsMockCredits: false,
      understandsExportIsMock: true,
      understandsNoRealFileWillBeCreated: true,
    },
    rejectedAt: MOCK_CREATED_AT,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function createMockExportOutputs({
  exportSettings,
  projectId,
  sourceEditDocumentId,
  sourceEditVersion,
  sourcePreviewId,
  sourcePreviewVersion,
}: CreateMockExportOutputsInput): MockExportOutput[] {
  return getEnabledExportTargets(exportSettings).map((target, index) => ({
    id: `${projectId}-mock-export-output-${target.platform}-${String(index + 1).padStart(3, '0')}`,
    projectId,
    platform: target.platform,
    label: target.label,
    mockFileName: `reeditpro-${target.platform}-v${sourcePreviewVersion ?? 1}.${target.fileFormat}`,
    fileFormat: target.fileFormat,
    aspectRatio: target.aspectRatio,
    resolution: target.resolution,
    quality: target.quality,
    captionMode: target.captionMode,
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId,
    sourceEditVersion,
    createdAt: MOCK_CREATED_AT,
  }))
}

export function createMockExportJob({
  approval,
  exportEstimate,
  exportSettings,
  jobIndex = 1,
  projectId,
  userId,
  workspaceId,
}: CreateMockExportJobInput): MockExportJob {
  return {
    id: jobId(projectId, jobIndex),
    projectId,
    workspaceId,
    userId,
    status: 'queued',
    sourcePreviewId: exportSettings.sourcePreviewId,
    sourcePreviewVersion: exportSettings.sourcePreviewVersion,
    sourceEditDocumentId: exportSettings.sourceEditDocumentId,
    sourceEditVersion: exportSettings.sourceEditVersion,
    exportSettingsId: exportSettings.id,
    exportEstimateId: exportEstimate?.id,
    approvalId: approval?.id,
    steps: buildSteps(projectId, jobIndex),
    outputs: [],
    progressPercent: 0,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function advanceMockExportJob(job: MockExportJob, exportSettings?: ExportSettings): MockExportJob {
  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return job
  }

  const nextPendingIndex = job.steps.findIndex((step) => step.status === 'pending' || step.status === 'running')
  if (nextPendingIndex < 0) {
    return exportSettings ? completeMockExportJob(job, exportSettings) : job
  }

  const nextSteps = job.steps.map((step, index) =>
    index === nextPendingIndex
      ? { ...step, status: 'completed' as const, progressPercent: 100 }
      : step,
  )
  const progressPercent = progressForSteps(nextSteps)
  const completed = progressPercent >= 100
  const nextJob = {
    ...job,
    status: completed ? 'completed' as const : 'running' as const,
    steps: nextSteps,
    progressPercent,
    updatedAt: MOCK_CREATED_AT,
    completedAt: completed ? MOCK_CREATED_AT : job.completedAt,
  }

  return completed && exportSettings ? completeMockExportJob(nextJob, exportSettings) : nextJob
}

export function completeMockExportJob(job: MockExportJob, exportSettings: ExportSettings): MockExportJob {
  const outputs = job.outputs.length > 0
    ? job.outputs
    : createMockExportOutputs({
        projectId: job.projectId,
        exportSettings,
        sourcePreviewId: job.sourcePreviewId,
        sourcePreviewVersion: job.sourcePreviewVersion,
        sourceEditDocumentId: job.sourceEditDocumentId,
        sourceEditVersion: job.sourceEditVersion,
      })

  return {
    ...job,
    status: 'completed',
    steps: job.steps.map((step) => ({
      ...step,
      status: 'completed',
      progressPercent: 100,
    })),
    outputs,
    progressPercent: 100,
    updatedAt: MOCK_CREATED_AT,
    completedAt: MOCK_CREATED_AT,
  }
}

export function failMockExportJob(job: MockExportJob, reason: string): MockExportJob {
  return {
    ...job,
    status: 'failed',
    failureReason: reason,
    updatedAt: MOCK_CREATED_AT,
  }
}
