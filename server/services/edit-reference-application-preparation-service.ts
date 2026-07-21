import { createHash } from 'node:crypto'
import type {
  EditReferenceApplicationPreparationIntent,
  EditReferenceApplicationPreparationReceipt,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  editReferenceApplicationPreparationRequestDigest,
  validateEditReferenceApplicationPreparationIntent,
  validateEditReferenceApplicationPreparationReceipt,
} from '../edit-references/edit-reference-production-application-preparation-boundary'
import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  resolveEditReferenceApplicationPreparationRuntimePort,
} from './edit-reference-application-preparation-runtime-port'

export function createEditReferenceApplicationPreparationService(
  context: ServiceContext,
) {
  return {
    async prepare(input: {
      readonly projectId: string
      readonly editSessionId: string
      readonly intent: EditReferenceApplicationPreparationIntent
      readonly idempotencyKey: string
    }): Promise<{ readonly receipt: EditReferenceApplicationPreparationReceipt }> {
      validateEditReferenceApplicationPreparationIntent(input.intent)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.intent.workspaceId, 'write')
      if (access.userId !== actorUserId) throw blocked('application_preparation_actor_scope_mismatch', 403)
      const preparationRequestDigestSha256 = editReferenceApplicationPreparationRequestDigest({
        actorUserId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        intent: input.intent,
      })
      const idempotencyKeyHashSha256 = sha256([
        'edit-reference-application-preparation-v1',
        actorUserId,
        input.intent.workspaceId,
        input.projectId,
        input.editSessionId,
        input.idempotencyKey,
      ].join('\n'))
      const port = resolveEditReferenceApplicationPreparationRuntimePort({
        env: context.env,
        port: context.editReferenceApplicationPreparationRuntimePort,
      })
      const receipt = await port.prepare({
        actor: {
          actorUserId,
          authenticatedAccessToken: context.auth?.accessToken ?? null,
          mockActor: context.auth?.isMockUser ?? false,
          localStorageRoot: context.env.localStorageRoot,
        },
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        intent: input.intent,
        idempotencyKeyHashSha256,
        preparationRequestDigestSha256,
      })
      validateEditReferenceApplicationPreparationReceipt(receipt)
      const authority = receipt.applicationAuthority
      if (
        receipt.preparationRequestDigestSha256 !== preparationRequestDigestSha256
        || authority.workspaceId !== input.intent.workspaceId
        || authority.projectId !== input.projectId
        || authority.editSessionId !== input.editSessionId
        || authority.editReferenceId !== input.intent.editReferenceId
        || authority.studySessionId !== input.intent.studySessionId
        || authority.dnaVersionId !== input.intent.dnaVersionId
        || authority.targetUnderstandingPackageDigestSha256
          !== input.intent.targetUnderstandingPackageDigestSha256
      ) throw blocked('application_preparation_receipt_scope_mismatch', 503)
      return { receipt: structuredClone(receipt) }
    },
  }
}
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function blocked(reason: string, status: number): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The Edit Reference could not be prepared safely for this exact edit.',
    status,
    {
      reason,
      applicationConnectedToEdit: false,
      productionReady: false,
    },
  )
}
