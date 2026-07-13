import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CanonicalPlanPublicationRequestInspection,
  PublishCanonicalEditPlanFromHandoffBody,
} from '../validation/canonical-planning-handoff-schemas'
import { createCanonicalPlanPublicationRequestService } from './canonical-plan-publication-request-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

const presentationLocks = new Map<string, Promise<void>>()

export type CanonicalPlanPresentationCoordinatorResult = {
  publicationRequest: CanonicalPlanPublicationRequestInspection
  newlyPresented: boolean
  warnings: string[]
}

export function createCanonicalPlanPresentationCoordinatorService(context: ServiceContext) {
  return {
    async present(input: PublishCanonicalEditPlanFromHandoffBody & {
      projectId: string
      editSessionId: string
      handoffId: string
    }): Promise<CanonicalPlanPresentationCoordinatorResult> {
      const publicationService = createCanonicalPlanPublicationRequestService(context)
      const submitted = await publicationService.submit(input)
      const scope = {
        workspaceId: submitted.identity.workspaceId,
        projectId: submitted.identity.projectId,
        editSessionId: submitted.identity.editSessionId,
        handoffId: submitted.identity.handoffId,
      }

      return withPresentationLock(scope, async () => {
        const current = await publicationService.inspect({
          ...scope,
          candidateId: submitted.identity.candidateId,
        })
        if (current.publicationStatus !== 'pending_internal_publication') {
          return {
            publicationRequest: current,
            newlyPresented: false,
            warnings: [
              current.publicationStatus === 'published'
                ? 'The exact persisted publication candidate was already presented; no new plan or estimate was created.'
                : 'A competing persisted candidate already owns this planning handoff; no plan or estimate was changed.',
            ],
          }
        }

        try {
          const result = await publicationService.publish({
            workspaceId: current.identity.workspaceId,
            expectedCandidateHash: current.candidateHash,
            projectId: current.identity.projectId,
            editSessionId: current.identity.editSessionId,
            handoffId: current.identity.handoffId,
            candidateId: current.identity.candidateId,
            idempotencyKey: `canonical-plan-presentation:${current.candidateHash}`,
            requestPath: `/internal/canonical-plan-presentations/${current.identity.candidateId}`,
          })
          if (result.publicationRequest.publicationStatus !== 'published') {
            throw new ApiError(
              'INTERNAL_ERROR',
              'Canonical plan presentation completed without published candidate authority.',
              500,
            )
          }
          return {
            publicationRequest: result.publicationRequest,
            newlyPresented: !result.canonicalPlanningHandoff.publicationReplayed,
            warnings: result.warnings,
          }
        } catch (error) {
          if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') throw error
          const recovered = await publicationService.inspect({
            ...scope,
            candidateId: current.identity.candidateId,
          })
          if (recovered.publicationStatus === 'pending_internal_publication') throw error
          return {
            publicationRequest: recovered,
            newlyPresented: false,
            warnings: [
              recovered.publicationStatus === 'published'
                ? 'Concurrent canonical plan presentation converged on the existing published authority.'
                : 'A competing canonical plan presentation won the single-publication handoff fence.',
            ],
          }
        }
      })
    },
  }
}

async function withPresentationLock<T>(
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    handoffId: string
  },
  action: () => Promise<T>,
): Promise<T> {
  const key = sha256AuthorityValue({
    domain: 'canonical_plan_presentation_coordinator_v1',
    ...scope,
  })
  const previous = presentationLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  presentationLocks.set(key, current)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (presentationLocks.get(key) === current) presentationLocks.delete(key)
  }
}
