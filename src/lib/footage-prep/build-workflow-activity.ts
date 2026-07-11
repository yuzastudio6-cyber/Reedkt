import type {
  ProjectWorkflowStatus,
  WorkflowActivityEvent,
  WorkflowActivitySeverity,
  WorkflowActivityType,
  WorkflowID,
} from '../../types'
import { MOCK_CREATED_AT } from './mock-footage-prep-data'

type CreateWorkflowActivityEventInput = {
  id: WorkflowID
  projectId: WorkflowID
  workspaceId?: WorkflowID
  userId?: WorkflowID
  type: WorkflowActivityType
  severity: WorkflowActivitySeverity
  title: string
  message: string
  status?: ProjectWorkflowStatus
  progressPercent?: number
  relatedMediaAssetId?: WorkflowID
  relatedCleanAssemblyId?: WorkflowID
  relatedEditCueId?: WorkflowID
  relatedEditPlanId?: WorkflowID
  relatedRenderId?: WorkflowID
  relatedEditOperationId?: WorkflowID
  retryable?: boolean
  recoveryAction?: string
  metadata?: Record<string, unknown>
  createdAt?: string
}

type CreateFootagePrepActivityTimelineInput = {
  projectId: WorkflowID
  workspaceId?: WorkflowID
  userId?: WorkflowID
  primaryMediaAssetId?: WorkflowID
  cleanAssemblyId?: WorkflowID
}

export function createWorkflowActivityEvent(input: CreateWorkflowActivityEventInput): WorkflowActivityEvent {
  return {
    id: input.id,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    status: input.status,
    relatedMediaAssetId: input.relatedMediaAssetId,
    relatedCleanAssemblyId: input.relatedCleanAssemblyId,
    relatedEditCueId: input.relatedEditCueId,
    relatedEditPlanId: input.relatedEditPlanId,
    relatedRenderId: input.relatedRenderId,
    relatedEditOperationId: input.relatedEditOperationId,
    progressPercent: input.progressPercent,
    retryable: input.retryable,
    recoveryAction: input.recoveryAction,
    metadata: input.metadata,
    createdAt: input.createdAt ?? MOCK_CREATED_AT,
    updatedAt: input.createdAt ?? MOCK_CREATED_AT,
  }
}

export function createFootagePrepActivityTimeline(input: CreateFootagePrepActivityTimelineInput): WorkflowActivityEvent[] {
  const base = {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
  }

  const steps: Array<Omit<CreateWorkflowActivityEventInput, 'id' | 'projectId'>> = [
    {
      ...base,
      type: 'upload_received',
      severity: 'info',
      title: 'Upload received',
      message: 'ReeditPro received the uploaded source media and is preparing it for editing.',
      status: 'uploaded',
      progressPercent: 5,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'proxy_created',
      severity: 'info',
      title: 'Creating an editing proxy',
      message: 'Creating a mock editing proxy so the raw source remains untouched.',
      status: 'prepping_footage',
      progressPercent: 15,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'transcription_started',
      severity: 'info',
      title: 'Transcribing speech',
      message: 'Reading speech structure from deterministic mock transcript data.',
      status: 'prepping_footage',
      progressPercent: 25,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'transcription_completed',
      severity: 'success',
      title: 'Speech transcript ready',
      message: 'Mock transcript segments are ready for source understanding.',
      status: 'prepping_footage',
      progressPercent: 35,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'silence_detection_started',
      severity: 'info',
      title: 'Finding silence and retakes',
      message: 'Looking for long pauses, false starts, and repeated takes in the mock source.',
      status: 'prepping_footage',
      progressPercent: 45,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'silence_detection_completed',
      severity: 'success',
      title: 'Silence regions identified',
      message: 'Long dead air and pauses are marked for removal or tightening.',
      status: 'prepping_footage',
      progressPercent: 55,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'retake_detection_started',
      severity: 'info',
      title: 'Grouping repeated takes',
      message: 'Grouping repeated attempts so the strongest take can be preserved.',
      status: 'prepping_footage',
      progressPercent: 65,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'retake_detection_completed',
      severity: 'success',
      title: 'Best takes selected',
      message: 'Repeated takes are grouped and the strongest mock ranges are selected.',
      status: 'footage_prep_ready',
      progressPercent: 75,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'cleanup_plan_created',
      severity: 'success',
      title: 'Cleanup plan created',
      message: 'The cleanup plan keeps the strongest moments while preserving source references.',
      status: 'footage_prep_ready',
      progressPercent: 88,
      relatedMediaAssetId: input.primaryMediaAssetId,
    },
    {
      ...base,
      type: 'clean_assembly_created',
      severity: 'success',
      title: 'Building a clean assembly',
      message: 'Clean assembly is ready with raw-to-clean source time mappings.',
      status: 'clean_assembly_ready',
      progressPercent: 100,
      relatedMediaAssetId: input.primaryMediaAssetId,
      relatedCleanAssemblyId: input.cleanAssemblyId,
    },
  ]

  return steps.map((step, index) =>
    createWorkflowActivityEvent({
      ...step,
      id: `${input.projectId}-activity-${String(index + 1).padStart(3, '0')}`,
      projectId: input.projectId,
    }),
  )
}
