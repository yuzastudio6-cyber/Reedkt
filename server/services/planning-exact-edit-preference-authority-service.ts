import type {
  CanonicalExactEditPlanningAuthorityRead,
} from '../../src/types/canonical-exact-edit-planning-authority'
import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  readPlanningExactEditPreferenceAuthority,
} from './planning-exact-edit-preference-authority-port'

export function createPlanningExactEditPreferenceAuthorityService(
  context: ServiceContext,
) {
  return {
    async read(input: {
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
    }): Promise<CanonicalExactEditPlanningAuthorityRead> {
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Canonical planning authority is outside this workspace.',
          403,
        )
      }
      await createProjectService(context).getProject(input.projectId, access.workspaceId)
      const resolution = await readPlanningExactEditPreferenceAuthority({
        context,
        scope: {
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: actorUserId,
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        },
      })
      return structuredClone(resolution.authority)
    },
  }
}
