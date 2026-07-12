import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalEditJourneyResponseSchema,
  type CanonicalEditJourneyResponse,
} from '../validation/canonical-edit-journey-schemas'
import { createCanonicalPlanPublicationRequestService } from './canonical-plan-publication-request-service'
import { createCanonicalPlanningHandoffService } from './canonical-planning-handoff-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalEditJourneyService(context: ServiceContext) {
  return {
    async recover(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
    }): Promise<CanonicalEditJourneyResponse> {
      assertPrivateRuntime(context)
      if (Object.values(input).some((value) => !safeIdentity(value))) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical edit journey identity is invalid.', 400)
      }
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical edit journey is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const responseBase = {
        schemaVersion: 'canonical-edit-journey-recovery-v1' as const,
        source: 'canonical_edit_journey_service' as const,
        identity: {
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        },
        permissions: {
          inspectionOnly: true as const,
          rawPlanInputsReturned: false as const,
          filesystemPathReturned: false as const,
          credentialReturned: false as const,
          snapshotMutation: false as const,
          creditMutation: false as const,
          toolExecution: false as const,
          providerCall: false as const,
          render: false as const,
        },
        testOnly: true as const,
      }
      const handoff = await optionalNotFound(() =>
        createCanonicalPlanningHandoffService(context).inspectLatest({
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        }))
      if (!handoff) {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          stage: 'planning_handoff_required',
          nextAction: {
            code: 'prepare_planning_handoff',
            actor: 'planning_client',
            method: 'POST',
            routeTemplate: projectEditRoute(input, 'canonical-planning-handoff'),
          },
        })
      }
      const planningHandoff = {
        handoffId: handoff.identity.handoffId,
        handoffHash: handoff.handoffHash,
        canonicalPlanComponentsHash: handoff.canonicalPlanComponentsHash,
        publicationStatus: handoff.publicationStatus,
      }
      const candidate = await optionalNotFound(() =>
        createCanonicalPlanPublicationRequestService(context).inspectLatest({
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          handoffId: handoff.identity.handoffId,
        }))
      const publicationRequest = candidate
        ? {
            candidateId: candidate.identity.candidateId,
            candidateHash: candidate.candidateHash,
            publicationRequestHash: candidate.publicationRequestHash,
            publicationStatus: candidate.publicationStatus,
          }
        : undefined

      if (handoff.publicationStatus === 'unpublished' && !candidate) {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          planningHandoff,
          stage: 'publication_request_required',
          nextAction: {
            code: 'submit_publication_request',
            actor: 'planning_client',
            method: 'POST',
            routeTemplate: `${projectEditRoute(input, `canonical-planning-handoffs/${handoff.identity.handoffId}`)}/publication-requests`,
          },
        })
      }
      if (handoff.publicationStatus === 'unpublished') {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          planningHandoff,
          publicationRequest,
          stage: 'internal_publication_pending',
          nextAction: {
            code: 'await_internal_publication',
            actor: 'internal_service',
            method: 'POST',
            routeTemplate:
              `${projectEditRoute(input, `canonical-planning-handoffs/${handoff.identity.handoffId}`)}` +
              `/publication-requests/${candidate!.identity.candidateId}/publish`,
          },
        })
      }

      const planningAuthority = createEditPlanningAuthorityService(context)
      const planResult = await planningAuthority.getCanonicalPlan(
        handoff.publication.planId,
        access.workspaceId,
      )
      const planRecord = record(planResult.authority.plan)
      const estimateRecord = record(planResult.authority.estimate)
      const workItems = Array.isArray(planResult.authority.workItems)
        ? planResult.authority.workItems
        : []
      const plan = {
        planId: requiredString(planRecord.id, 'plan id'),
        planVersion: requiredPositiveInteger(planRecord.planVersion, 'plan version'),
        status: requiredString(planRecord.status, 'plan status'),
        planHash: requiredString(planRecord.planHash, 'plan hash'),
        estimateId: requiredString(estimateRecord.id, 'estimate id'),
        estimateStatus: requiredString(estimateRecord.status, 'estimate status'),
        estimateHash: requiredString(estimateRecord.estimateHash, 'estimate hash'),
        approvedMaximumCredits: requiredNonNegativeInteger(
          estimateRecord.approvedMaximumCredits,
          'approved maximum credits',
        ),
        workItemCount: workItems.length,
      }
      const approvalResult = await planningAuthority.getCanonicalPlanApproval(
        plan.planId,
        access.workspaceId,
      )
      const approval = approvalResult.approval

      if (plan.status === 'presented') {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          planningHandoff,
          publicationRequest,
          plan,
          stage: 'plan_approval_required',
          nextAction: {
            code: 'approve_canonical_plan',
            actor: 'authenticated_user',
            method: 'POST',
            routeTemplate: `/v1/edit-plans/${plan.planId}/approve`,
          },
        })
      }
      if (plan.status === 'approved' && approval) {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          planningHandoff,
          publicationRequest,
          plan,
          approval,
          stage: 'approved_snapshot_available',
          nextAction: {
            code: 'request_execution_package',
            actor: 'authenticated_user',
            method: 'POST',
            routeTemplate: '/v1/edit-executions/packages',
          },
        })
      }
      if (plan.status === 'cancellation_pending') {
        return canonicalEditJourneyResponseSchema.parse({
          ...responseBase,
          planningHandoff,
          publicationRequest,
          plan,
          ...(approval ? { approval } : {}),
          stage: 'cancellation_pending',
          nextAction: {
            code: 'await_cancellation_reconciliation',
            actor: 'internal_service',
            method: 'GET',
            routeTemplate: approval
              ? `/v1/approved-snapshots/${approval.snapshotId}/authority`
              : `/v1/edit-plans/${plan.planId}/authority`,
          },
        })
      }
      return canonicalEditJourneyResponseSchema.parse({
        ...responseBase,
        planningHandoff,
        publicationRequest,
        plan,
        ...(approval ? { approval } : {}),
        stage: 'replanning_required',
        nextAction: {
          code: 'prepare_replacement_plan',
          actor: 'planning_client',
          method: 'POST',
          routeTemplate: projectEditRoute(input, 'canonical-planning-handoff'),
        },
      })
    },
  }
}

async function optionalNotFound<T>(operation: () => Promise<T>): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 404 &&
      ['PLAN_NOT_APPROVED', 'APPROVED_SNAPSHOT_REQUIRED'].includes(error.code)
    ) return undefined
    throw error
  }
}

function projectEditRoute(
  input: { projectId: string; editSessionId: string },
  suffix: string,
): string {
  return `/v1/projects/${input.projectId}/edit-sessions/${input.editSessionId}/${suffix}`
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('INTERNAL_ERROR', 'Canonical journey authority response is malformed.', 500)
  }
  return value as Record<string, unknown>
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) {
    throw new ApiError('INTERNAL_ERROR', `Canonical journey ${label} is malformed.`, 500)
  }
  return value
}

function requiredPositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ApiError('INTERNAL_ERROR', `Canonical journey ${label} is malformed.`, 500)
  }
  return value
}

function requiredNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ApiError('INTERNAL_ERROR', `Canonical journey ${label} is malformed.`, 500)
  }
  return value
}

function assertPrivateRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError('TOOL_NOT_READY', 'Canonical edit journey recovery is private-internal testing only.', 503)
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}
