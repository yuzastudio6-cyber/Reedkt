import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  canonicalPlanningHandoffResponseSchema,
  createCanonicalPlanningHandoffSchema,
  type CreateCanonicalPlanningHandoffBody,
} from '../validation/canonical-planning-handoff-schemas'
import { createProjectService } from './project-service'
import {
  buildCurrentPlanningInputAuthorityExpectation,
  resolvePlanningInputAuthorityBinding,
} from './planning-input-authority-binding-service'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import { createSourceMediaAuthorityService } from './source-media-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPlanningHandoffService(context: ServiceContext) {
  return {
    async prepare(input: CreateCanonicalPlanningHandoffBody & {
      projectId: string
      editSessionId: string
    }) {
      const { projectId, editSessionId, ...requestBody } = input
      const parsed = createCanonicalPlanningHandoffSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(projectId) || !safeIdentity(editSessionId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical planning handoff request validation failed.',
          400,
          parsed.success
            ? { routeIdentity: ['Invalid project or edit-session identity.'] }
            : parsed.error.flatten(),
        )
      }
      assertPrivatePlanningHandoffRuntime(context)
      const body = parsed.data
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'read')
      if (access.userId !== actorUserId) {
        throw new ApiError('AUTH_REQUIRED', 'Canonical planning handoff is outside this workspace.', 403)
      }
      await createProjectService(context).getProject(projectId, access.workspaceId)
      const expectedSequence = body.orderedSourceItems.map((item) => ({
        sourceSequenceItemId: item.sourceSequenceItemId,
        mediaAssetId: item.mediaAssetId,
        uploadedOrder: item.uploadedOrder,
        checksumSha256: item.checksumSha256,
        required: item.required,
      }))
      if (stableAuthorityStringify(body.canonicalPlanComponents.sourceSequence) !==
        stableAuthorityStringify(expectedSequence)) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Canonical plan source sequence does not match the finalized upload handoff order.',
          409,
        )
      }

      const sourceResult = await createSourceMediaAuthorityService(context).buildManifestCandidate({
        workspaceId: access.workspaceId,
        projectId,
        uploadPurpose: 'source_media',
        orderedItems: body.orderedSourceItems,
      })
      const sourceCandidate = sourceResult.sourceBindingManifestCandidate
      const sourceMediaAuthority = {
        authorityRevision: sourceCandidate.authorityRevision,
        authorityChecksumSha256: sourceCandidate.authorityChecksumSha256,
        sourceSequenceHash: sourceCandidate.sourceSequenceHash,
        candidateHash: sourceCandidate.candidateHash,
      }
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
        projectId,
        editSessionId,
      }
      const planningInputAuthority = await buildCurrentPlanningInputAuthorityExpectation(scope)
      const resolvedPlanningInputAuthority = await resolvePlanningInputAuthorityBinding({
        context,
        scope,
        expectation: planningInputAuthority,
        components: body.canonicalPlanComponents,
      })
      const responseWithoutHash = {
        schemaVersion: 'canonical-planning-handoff-response-v1' as const,
        source: 'canonical_planning_handoff_service' as const,
        identity: {
          workspaceId: access.workspaceId,
          projectId,
          editSessionId,
        },
        sourceBindingManifestCandidate: sourceCandidate,
        sourceMediaAuthority,
        planningInputAuthority,
        resolvedPlanningInputAuthority,
        readiness: {
          finalizedSourceMediaVerified: true as const,
          exactEditPreferencesVerified: true as const,
          preferenceApplicationVerified: true as const,
          editBriefVerified: true as const,
          outputFrameAndCleanupVerified: true as const,
          readyForCanonicalPlanPublication: true as const,
        },
        noPlanPublished: true as const,
        noSnapshotCreated: true as const,
        noCreditReservation: true as const,
        noToolExecution: true as const,
        noProviderCall: true as const,
        noRender: true as const,
        testOnly: true as const,
      }
      return canonicalPlanningHandoffResponseSchema.parse({
        ...responseWithoutHash,
        handoffHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function assertPrivatePlanningHandoffRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Canonical planning handoff is private-internal testing only.', 503)
}
