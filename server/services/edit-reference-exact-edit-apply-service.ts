import { createHash } from 'node:crypto'
import type {
  EditReferenceProductionExactEditApplyAuthorityRead,
  EditReferenceProductionExactEditApplyApiReceipt,
  EditReferenceProductionExactEditApplyOperation,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  prepareEditReferenceProductionExactEditApplyFromAuthoritySnapshot,
  validateEditReferenceProductionExactEditApplyAuthorityRead,
  validateEditReferenceProductionExactEditApplyOperation,
  validateEditReferenceProductionExactEditApplyReceipt,
  type EditReferenceProductionExactEditApplyAuthorityReadScope,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId } from './service-helpers'
import {
  resolveEditReferenceExactEditApplyRuntimePort,
  type EditReferenceExactEditApplyRuntimeActor,
  type EditReferenceExactEditApplyRuntimePort,
} from './edit-reference-exact-edit-apply-runtime-port'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export interface EditReferenceExactEditApplyService {
  readAuthority(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly selectedApplicationId: string | null
  }): Promise<EditReferenceProductionExactEditApplyAuthorityRead>
  apply(input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly operation: EditReferenceProductionExactEditApplyOperation
    readonly idempotencyKey: string
  }): Promise<{
    readonly receipt: EditReferenceProductionExactEditApplyApiReceipt
    readonly operationDigestSha256: string
    readonly authenticatedScopeReboundServerSide: true
    readonly canonicalRowsReReadInsideTransaction: true
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
    readonly providerOrWorkerExecutionStarted: false
  }>
}

export function createEditReferenceExactEditApplyService(
  context: ServiceContext,
): EditReferenceExactEditApplyService {
  return {
    async readAuthority(input) {
      const actor = await authorizeActor(context, input.workspaceId)
      const scope: EditReferenceProductionExactEditApplyAuthorityReadScope = {
        actorUserId: actor.actorUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        selectedApplicationId: input.selectedApplicationId,
      }
      const port = resolveEditReferenceExactEditApplyRuntimePort({
        env: context.env,
        port: context.editReferenceExactEditApplyRuntimePort,
      })
      const authority = await port.readAuthority({ actor, scope })
      validateEditReferenceProductionExactEditApplyAuthorityRead(authority)
      assertAuthorityMatchesRuntimePort(port, authority)
      if (
        authority.workspaceId !== scope.workspaceId
        || authority.projectId !== scope.projectId
        || authority.editSessionId !== scope.editSessionId
        || authority.selectedApplicationAuthority?.applicationId
          !== (scope.selectedApplicationId ?? undefined)
      ) throw invalid('exact_edit_apply_authority_scope_mismatch', 503)
      return structuredClone(authority)
    },

    async apply(input) {
      validateEditReferenceProductionExactEditApplyOperation(input.operation)
      const authority = input.operation.authority
      if (
        authority.workspaceId !== input.workspaceId
        || authority.projectId !== input.projectId
        || authority.editSessionId !== input.editSessionId
      ) throw invalid('exact_edit_apply_route_scope_mismatch', 403)

      const actor = await authorizeActor(context, input.workspaceId)
      const port = resolveEditReferenceExactEditApplyRuntimePort({
        env: context.env,
        port: context.editReferenceExactEditApplyRuntimePort,
      })
      assertAuthorityMatchesRuntimePort(port, authority)
      const idempotencyKeyHashSha256 = sha256([
        'exact-edit-preferences-and-reference-apply-v1',
        actor.actorUserId,
        input.workspaceId,
        input.projectId,
        input.editSessionId,
        input.idempotencyKey,
      ].join('\n'))
      const accessCheckReceiptId = `exact_edit_access_${sha256([
        actor.actorUserId,
        input.workspaceId,
        input.projectId,
        input.editSessionId,
        idempotencyKeyHashSha256,
      ].join('\n')).slice(0, 48)}`
      const prepared = prepareEditReferenceProductionExactEditApplyFromAuthoritySnapshot({
        operation: input.operation,
        authenticated: {
          actorUserId: actor.actorUserId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          authenticatedUserVerified: true,
          workspaceMembershipVerified: true,
          workspaceProjectCompositeBindingVerified: true,
          projectEditSessionCompositeBindingVerified: true,
          accessCheckReceiptId,
        },
        accessCheckReceiptId,
        idempotencyKeyHashSha256,
        serverReceivedAt: new Date().toISOString(),
      })
      const receipt = await port.apply({ actor, request: prepared.request })
      validateEditReferenceProductionExactEditApplyReceipt({
        request: prepared.request,
        receipt,
      })
      if (
        receipt.sourceAuthority !== (
          port.sourceAuthority === 'private_exact_edit_preference_store'
            ? 'private_exact_edit_apply_transaction'
            : 'canonical_exact_edit_apply_rpc'
        )
      ) throw invalid('exact_edit_apply_receipt_runtime_source_mismatch', 503)
      return {
        receipt: structuredClone(receipt),
        operationDigestSha256: prepared.browserCommandDigestSha256,
        authenticatedScopeReboundServerSide: true,
        canonicalRowsReReadInsideTransaction: true,
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
        providerOrWorkerExecutionStarted: false,
      }
    },
  }
}

function assertAuthorityMatchesRuntimePort(
  port: EditReferenceExactEditApplyRuntimePort,
  authority: EditReferenceProductionExactEditApplyAuthorityRead,
): void {
  const privateAuthority =
    authority.sourceAuthority === 'private_exact_edit_preference_store'
    && authority.runtimeSource === 'verified_local'
  const runtimeIsPrivate =
    port.sourceAuthority === 'private_exact_edit_preference_store'
    && port.evidenceClass === 'loopback_single_host_private_test'
    && port.privateSingleHostAtomicPreferenceApplyVerified
    && !port.referenceMutationSupported
  if (privateAuthority !== runtimeIsPrivate) {
    throw invalid('exact_edit_apply_authority_runtime_source_mismatch', 503)
  }
}

async function authorizeActor(
  context: ServiceContext,
  workspaceId: string,
): Promise<EditReferenceExactEditApplyRuntimeActor> {
  const actorUserId = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, workspaceId, 'write')
  if (access.userId !== actorUserId) throw invalid('exact_edit_apply_actor_scope_mismatch', 403)
  return {
    actorUserId,
    authenticatedAccessToken: context.auth?.accessToken ?? null,
    mockActor: context.auth?.isMockUser ?? false,
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(reason: string, status: number): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Current Edit Preferences could not be bound to the canonical exact-edit transaction.',
    status,
    {
      reason,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      providerOrWorkerExecutionStarted: false,
      productionReady: false,
    },
  )
}
