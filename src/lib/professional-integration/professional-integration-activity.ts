import type {
  ProfessionalIntegrationOperation,
  ProfessionalIntegrationState,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateProfessionalIntegrationActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  state?: ProfessionalIntegrationState | null
  operation?: ProfessionalIntegrationOperation
  type?: WorkflowActivityType
  progressPercent?: number
}

const copyByType: Partial<Record<WorkflowActivityType, { title: string; message: string; severity: WorkflowActivityEvent['severity'] }>> = {
  professional_integration_created: {
    title: 'Professional Integration created',
    message: 'The AI converted planning direction into professional edit treatment decisions.',
    severity: 'info',
  },
  professional_integration_regenerated: {
    title: 'Professional Integration regenerated',
    message: 'Professional treatment decisions were refreshed from the latest planning context.',
    severity: 'info',
  },
  professional_integration_ready: {
    title: 'Professional Integration ready',
    message: 'Professional treatment decisions are ready for QA planning.',
    severity: 'success',
  },
  professional_integration_needs_review: {
    title: 'Professional Integration needs review',
    message: 'Some treatment decisions have warnings to review before generation.',
    severity: 'warning',
  },
  professional_integration_blocked: {
    title: 'Professional Integration blocked',
    message: 'Resolve blocking planning or treatment issues before generation.',
    severity: 'error',
  },
  professional_integration_accepted: {
    title: 'Professional Integration accepted',
    message: 'Professional treatment decisions were accepted locally.',
    severity: 'success',
  },
  professional_treatment_accepted: {
    title: 'Treatment accepted',
    message: 'A professional treatment decision was accepted locally.',
    severity: 'success',
  },
}

function defaultTypeForState(state?: ProfessionalIntegrationState | null): WorkflowActivityType {
  if (!state) return 'professional_integration_created'
  if (state.summary.status === 'blocked') return 'professional_integration_blocked'
  if (state.summary.status === 'needs_review') return 'professional_integration_needs_review'
  if (state.summary.status === 'ready') return 'professional_integration_ready'
  if (state.summary.status === 'accepted') return 'professional_integration_accepted'
  return 'professional_integration_created'
}

function typeForOperation(operation?: ProfessionalIntegrationOperation): WorkflowActivityType | undefined {
  if (!operation) return undefined
  if (operation.type === 'regenerate_integration_plan') return 'professional_integration_regenerated'
  if (operation.type === 'accept_integration_plan') return 'professional_integration_accepted'
  if (
    operation.type === 'accept_asset_treatment' ||
    operation.type === 'accept_broll_treatment' ||
    operation.type === 'accept_overlay_treatment' ||
    operation.type === 'accept_cue_compliance'
  ) {
    return 'professional_treatment_accepted'
  }
  if (operation.type === 'create_integration_plan') return 'professional_integration_created'
  return undefined
}

export function createProfessionalIntegrationActivityEvent(
  input: CreateProfessionalIntegrationActivityEventInput,
): WorkflowActivityEvent {
  const type = input.type ?? typeForOperation(input.operation) ?? defaultTypeForState(input.state)
  const copy = copyByType[type] ?? copyByType.professional_integration_created
  const planId = input.operation?.professionalIntegrationPlanId ?? input.state?.professionalIntegrationPlan?.id
  const eventBaseId = input.operation?.id ?? planId ?? `${input.projectId}-professional-integration`

  return {
    id: `${eventBaseId}-${type}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type,
    severity: copy?.severity ?? 'info',
    title: copy?.title ?? 'Professional Integration updated',
    message: copy?.message ?? 'Professional treatment state was updated.',
    relatedCleanAssemblyId: input.state?.professionalIntegrationPlan?.cleanAssemblyId,
    progressPercent: input.progressPercent,
    metadata: {
      professionalIntegrationPlanId: planId,
      operationType: input.operation?.type,
      status: input.state?.summary.status,
      blockingIssueCount: input.state?.summary.blockingIssueCount,
      warningIssueCount: input.state?.summary.warningIssueCount,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
