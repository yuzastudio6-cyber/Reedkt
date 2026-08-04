import type {
  ProfessionalQaOperation,
  ProfessionalQaReportItem,
  ProfessionalQaState,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateProfessionalQaActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  state?: ProfessionalQaState | null
  operation?: ProfessionalQaOperation
  item?: ProfessionalQaReportItem
  type?: WorkflowActivityType
  progressPercent?: number
}

const copyByType: Partial<Record<WorkflowActivityType, { title: string; message: string; severity: WorkflowActivityEvent['severity'] }>> = {
  professional_qa_started: {
    title: 'Professional QA started',
    message: 'ReeditPro is checking planning and treatment decisions before preview.',
    severity: 'info',
  },
  professional_qa_passed: {
    title: 'Professional QA passed',
    message: 'QA checks passed for preview planning.',
    severity: 'success',
  },
  professional_qa_needs_review: {
    title: 'Professional QA needs review',
    message: 'Some QA warnings should be reviewed before preview/generation.',
    severity: 'warning',
  },
  professional_qa_blocked: {
    title: 'Professional QA blocked',
    message: 'Resolve blocking QA issues before preview/generation.',
    severity: 'error',
  },
  professional_qa_warning_accepted: {
    title: 'QA warning accepted',
    message: 'A QA warning was accepted locally.',
    severity: 'success',
  },
  professional_qa_reviewed: {
    title: 'QA reviewed',
    message: 'The QA report was marked reviewed.',
    severity: 'success',
  },
  professional_qa_reset: {
    title: 'Professional QA reset',
    message: 'The local QA report was reset.',
    severity: 'info',
  },
}

function typeForOperation(
  operation?: ProfessionalQaOperation,
  state?: ProfessionalQaState | null,
): WorkflowActivityType | undefined {
  if (!operation) return undefined
  if (operation.type === 'accept_warning' || operation.type === 'accept_all_warnings') return 'professional_qa_warning_accepted'
  if (operation.type === 'mark_reviewed') return 'professional_qa_reviewed'
  if (operation.type === 'reset_qa') return 'professional_qa_reset'
  if (operation.type === 'run_qa' || operation.type === 'rerun_qa') {
    if (state?.summary.status === 'blocked') return 'professional_qa_blocked'
    if (state?.summary.status === 'needs_review') return 'professional_qa_needs_review'
    if (state?.summary.status === 'passed' || state?.summary.status === 'accepted_with_warnings') return 'professional_qa_passed'
    return 'professional_qa_started'
  }
  return undefined
}

function defaultTypeForState(state?: ProfessionalQaState | null): WorkflowActivityType {
  if (!state?.report) return 'professional_qa_started'
  if (state.summary.status === 'blocked') return 'professional_qa_blocked'
  if (state.summary.status === 'needs_review') return 'professional_qa_needs_review'
  if (state.summary.status === 'passed' || state.summary.status === 'accepted_with_warnings') return 'professional_qa_passed'
  return 'professional_qa_started'
}

export function createProfessionalQaActivityEvent(
  input: CreateProfessionalQaActivityEventInput,
): WorkflowActivityEvent {
  const type = input.type ?? typeForOperation(input.operation, input.state) ?? defaultTypeForState(input.state)
  const copy = copyByType[type] ?? copyByType.professional_qa_started
  const reportId = input.operation?.reportId ?? input.state?.report?.id
  const eventBaseId = input.operation?.id ?? reportId ?? `${input.projectId}-professional-qa`

  return {
    id: `${eventBaseId}-${type}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type,
    severity: copy?.severity ?? 'info',
    title: copy?.title ?? 'Professional QA updated',
    message: copy?.message ?? 'The local QA report was updated.',
    progressPercent: input.progressPercent,
    metadata: {
      reportId,
      operationType: input.operation?.type,
      itemId: input.item?.id ?? input.operation?.itemId,
      qaStatus: input.state?.summary.status,
      previewReadiness: input.state?.summary.previewReadiness,
      blockingCount: input.state?.summary.blockingCount,
      warningCount: input.state?.summary.warningCount,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
