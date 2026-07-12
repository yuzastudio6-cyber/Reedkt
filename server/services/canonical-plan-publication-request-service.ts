import { ApiError } from '../errors/api-error'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'
import type { ServiceContext } from '../types'
import {
  canonicalPlanPublicationRequestInspectionSchema,
  publishCanonicalEditPlanFromHandoffSchema,
  publishCanonicalPlanPublicationRequestSchema,
  type CanonicalPlanPublicationRequestInspection,
  type PublishCanonicalEditPlanFromHandoffBody,
  type PublishCanonicalPlanPublicationRequestBody,
} from '../validation/canonical-planning-handoff-schemas'
import { createCanonicalPlanningHandoffService } from './canonical-planning-handoff-service'
import { canonicalPlanningHandoffPublicationRequestHash } from './edit-planning-authority-service'
import {
  canonicalPlanPublicationRequestCandidateId,
  persistPrivateCanonicalPlanPublicationRequest,
  readPrivateCanonicalPlanPublicationRequest,
  type CanonicalPlanPublicationRequestCandidateRecord,
} from './private-canonical-plan-publication-request-store'
import { readPrivateCanonicalPlanningHandoff } from './private-canonical-planning-handoff-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPlanPublicationRequestService(context: ServiceContext) {
  return {
    async submit(input: PublishCanonicalEditPlanFromHandoffBody & {
      projectId: string
      editSessionId: string
      handoffId: string
    }): Promise<CanonicalPlanPublicationRequestInspection> {
      const { projectId, editSessionId, handoffId, ...requestBody } = input
      const parsed = publishCanonicalEditPlanFromHandoffSchema.safeParse(requestBody)
      if (
        !parsed.success ||
        !safeIdentity(projectId) ||
        !safeIdentity(editSessionId) ||
        !safeIdentity(handoffId)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical publication request candidate validation failed.',
          400,
          parsed.success ? { routeIdentity: ['Invalid route identity.'] } : parsed.error.flatten(),
        )
      }
      assertPrivateRuntime(context)
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical publication request is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(projectId, access.workspaceId)
      assertNoSecretLikeCandidate(body)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      const handoff = await readPrivateCanonicalPlanningHandoff({ scope, handoffId })
      const canonicalPlanComponentsHash = sha256AuthorityValue(body.canonicalPlan.components)
      if (
        handoff.handoffHash !== body.expectedHandoffHash ||
        handoff.canonicalPlanComponentsHash !== canonicalPlanComponentsHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical publication request candidate does not match the persisted planning handoff.',
          409,
        )
      }
      const canonicalPublishBody = {
        workspaceId: access.workspaceId,
        planningRequestId: body.planningRequestId,
        planningInputAuthority: handoff.planningInputAuthority,
        sourceMediaAuthority: handoff.sourceMediaAuthority,
        revisionAuthority: body.revisionAuthority,
        canonicalPlan: body.canonicalPlan,
      }
      const publicationRequestHash = canonicalPlanningHandoffPublicationRequestHash({
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
        handoffId,
        handoffHash: handoff.handoffHash,
        body: canonicalPublishBody,
      })
      const candidateWithoutIdentity = {
        schemaVersion: 'canonical-plan-publication-request-candidate-v1' as const,
        source: 'canonical_plan_publication_request_service' as const,
        identity: {
          workspaceId: access.workspaceId,
          projectId,
          editSessionId,
          handoffId,
        },
        handoffHash: handoff.handoffHash,
        canonicalPlanComponentsHash,
        publicationBodyHash: sha256AuthorityValue(body),
        publicationRequestHash,
        requestBody: body,
      }
      const candidateHash = sha256AuthorityValue(candidateWithoutIdentity)
      const candidate: CanonicalPlanPublicationRequestCandidateRecord = {
        ...candidateWithoutIdentity,
        candidateHash,
        candidateId: canonicalPlanPublicationRequestCandidateId(candidateHash),
      }
      const persisted = await persistPrivateCanonicalPlanPublicationRequest({ scope, candidate })
      return inspectCandidate(context, scope, persisted.candidate)
    },

    async inspect(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
      handoffId: string
      candidateId: string
    }): Promise<CanonicalPlanPublicationRequestInspection> {
      if (Object.values(input).some((value) => !safeIdentity(value))) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical publication request inspection identity is invalid.', 400)
      }
      assertPrivateRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical publication request is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      }
      const candidate = await readPrivateCanonicalPlanPublicationRequest({
        scope,
        candidateId: input.candidateId,
      })
      if (candidate.identity.handoffId !== input.handoffId) {
        throw new ApiError('PLAN_NOT_APPROVED', 'Canonical publication request candidate was not found.', 404)
      }
      return inspectCandidate(context, scope, candidate)
    },

    async publish(input: PublishCanonicalPlanPublicationRequestBody & {
      projectId: string
      editSessionId: string
      handoffId: string
      candidateId: string
      idempotencyKey: string
      requestPath: string
    }) {
      const parsed = publishCanonicalPlanPublicationRequestSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedCandidateHash: input.expectedCandidateHash,
      })
      if (
        !parsed.success ||
        !safeIdentity(input.projectId) ||
        !safeIdentity(input.editSessionId) ||
        !safeIdentity(input.handoffId) ||
        !safeIdentity(input.candidateId)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical publication request execution validation failed.',
          400,
          parsed.success ? { routeIdentity: ['Invalid route identity.'] } : parsed.error.flatten(),
        )
      }
      assertPrivateRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, parsed.data.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical publication request is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      }
      const candidate = await readPrivateCanonicalPlanPublicationRequest({
        scope,
        candidateId: input.candidateId,
      })
      if (
        candidate.identity.handoffId !== input.handoffId ||
        candidate.candidateHash !== parsed.data.expectedCandidateHash
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical publication request candidate hash or handoff identity is invalid.',
          409,
        )
      }
      const result = await createCanonicalPlanningHandoffService(context).publishFromPersistedHandoff({
        ...candidate.requestBody,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        handoffId: input.handoffId,
        idempotencyKey: input.idempotencyKey,
        requestPath: input.requestPath,
      })
      if (result.canonicalPlanningHandoff.publicationRequestHash !== candidate.publicationRequestHash) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Published canonical authority did not match the persisted request candidate.',
          409,
        )
      }
      return {
        ...result,
        publicationRequest: await inspectCandidate(context, scope, candidate),
      }
    },
  }
}

async function inspectCandidate(
  context: ServiceContext,
  scope: {
    localStorageRoot: string
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
  },
  candidate: CanonicalPlanPublicationRequestCandidateRecord,
): Promise<CanonicalPlanPublicationRequestInspection> {
  const handoffInspection = await createCanonicalPlanningHandoffService(context).inspect({
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    handoffId: candidate.identity.handoffId,
  })
  const responseBase = {
    schemaVersion: 'canonical-plan-publication-request-inspection-v1' as const,
    source: 'canonical_plan_publication_request_service' as const,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      handoffId: candidate.identity.handoffId,
      candidateId: candidate.candidateId,
    },
    candidateHash: candidate.candidateHash,
    handoffHash: candidate.handoffHash,
    canonicalPlanComponentsHash: candidate.canonicalPlanComponentsHash,
    publicationBodyHash: candidate.publicationBodyHash,
    publicationRequestHash: candidate.publicationRequestHash,
    persistence: {
      privateLocal: true as const,
      tenantScoped: true as const,
      createOnly: true as const,
      checksumProtected: true as const,
      contentAddressed: true as const,
      distributed: false as const,
      productionAuthority: false as const,
    },
    permissions: {
      inspectionOnly: true as const,
      internalPublicationRequired: true as const,
      planMutation: false as const,
      snapshotCreation: false as const,
      creditReservation: false as const,
      toolExecution: false as const,
      providerCall: false as const,
      render: false as const,
    },
    requestBodyReturned: false as const,
    pathOrCredentialReturned: false as const,
    testOnly: true as const,
  }
  if (handoffInspection.publicationStatus === 'unpublished') {
    return canonicalPlanPublicationRequestInspectionSchema.parse({
      ...responseBase,
      publicationStatus: 'pending_internal_publication',
      publication: {
        internalPublicationMayBeAttempted: true,
        fullRevalidationRequired: true,
        exactReplayOnlyAfterPublication: true,
      },
    })
  }
  if (handoffInspection.publication.publicationRequestHash !== candidate.publicationRequestHash) {
    return canonicalPlanPublicationRequestInspectionSchema.parse({
      ...responseBase,
      publicationStatus: 'superseded_by_competing_candidate',
      publication: {
        internalPublicationMayBeAttempted: false,
        fullRevalidationRequired: true,
        exactReplayOnlyAfterPublication: false,
      },
    })
  }
  return canonicalPlanPublicationRequestInspectionSchema.parse({
    ...responseBase,
    publicationStatus: 'published',
    publication: {
      planId: handoffInspection.publication.planId,
      planningRequestId: handoffInspection.publication.planningRequestId,
      planVersion: handoffInspection.publication.planVersion,
      planStatus: handoffInspection.publication.planStatus,
      planHash: handoffInspection.publication.planHash,
      internalPublicationMayBeAttempted: false,
      fullRevalidationRequired: true,
      exactReplayOnlyAfterPublication: true,
    },
  })
}

function assertNoSecretLikeCandidate(body: PublishCanonicalEditPlanFromHandoffBody): void {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(body)
  if (secretLikePaths.length > 0) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical publication request candidate contains secret-like fields or values.',
      400,
      { secretLikePaths },
    )
  }
}

function assertPrivateRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError('TOOL_NOT_READY', 'Canonical publication requests are private-internal testing only.', 503)
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}
