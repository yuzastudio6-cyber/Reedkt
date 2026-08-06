import type {
  PlanningContext,
  WorkflowActivityEvent,
  WorkflowActivityType,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreatePlanningContextActivityEventInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContext: PlanningContext
  type?: WorkflowActivityType
  progressPercent?: number
}

const copyByType: Partial<Record<WorkflowActivityType, { title: string; message: string; severity: WorkflowActivityEvent['severity'] }>> = {
  planning_context_created: {
    title: 'Planning context created',
    message: 'Clean Assembly, Source Library, Edit Brief, and Edit Cues were gathered for AI planning.',
    severity: 'info',
  },
  planning_context_ready: {
    title: 'Ready for AI planning',
    message: 'The planning context is ready for the AI Edit Plan.',
    severity: 'success',
  },
  planning_context_needs_review: {
    title: 'Planning context needs review',
    message: 'Some planning inputs have warnings that should be reviewed.',
    severity: 'warning',
  },
  planning_context_blocked: {
    title: 'Planning context blocked',
    message: 'Resolve blocking cue conflicts before generation.',
    severity: 'error',
  },
  context_aware_plan_created: {
    title: 'AI Edit Plan created',
    message: 'The AI Edit Plan was created from the Clean Assembly and user direction.',
    severity: 'success',
  },
}

function defaultTypeForContext(context: PlanningContext): WorkflowActivityType {
  if (context.status === 'blocked') return 'planning_context_blocked'
  if (context.status === 'needs_review') return 'planning_context_needs_review'
  if (context.status === 'ready') return 'planning_context_ready'
  return 'planning_context_created'
}

export function createPlanningContextActivityEvent(input: CreatePlanningContextActivityEventInput): WorkflowActivityEvent {
  const type = input.type ?? defaultTypeForContext(input.planningContext)
  const copy = copyByType[type] ?? copyByType.planning_context_created

  return {
    id: `${input.planningContext.id}-${type}`,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type,
    severity: copy?.severity ?? 'info',
    title: copy?.title ?? 'Planning context updated',
    message: copy?.message ?? 'The planning context was updated.',
    relatedCleanAssemblyId: input.planningContext.cleanAssembly.cleanAssemblyId,
    progressPercent: input.progressPercent,
    metadata: {
      planningContextStatus: input.planningContext.status,
      blockingIssueCount: input.planningContext.blockingIssueCount,
      warningIssueCount: input.planningContext.warningIssueCount,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}
