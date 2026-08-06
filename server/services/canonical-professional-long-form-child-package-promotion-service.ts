import {
  assertCanonicalProfessionalLongFormChildPackage,
  assertCanonicalProfessionalLongFormChildPlacementManifest,
  assertCanonicalProfessionalLongFormChildQueueDefinition,
  buildCanonicalProfessionalLongFormChildPackage,
  buildCanonicalProfessionalLongFormChildPlacementManifest,
  buildCanonicalProfessionalLongFormChildQueueDefinition,
  type CanonicalProfessionalLongFormChildPackage,
  type CanonicalProfessionalLongFormChildPlacementManifest,
} from '../edit-architecture/professional-long-form-child-package-promotion'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from
  '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  ensurePrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import {
  createCanonicalProfessionalLongFormPostApprovalService,
} from './canonical-professional-long-form-post-approval-service'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PROMOTION_VERSION =
  'canonical-professional-long-form-child-promotion-v1' as const

export interface CanonicalProfessionalLongFormChildPromotionEvidence {
  schemaVersion: typeof CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PROMOTION_VERSION
  source: 'server_reloaded_approved_long_form_child_authority'
  status: 'child_package_and_queue_persisted_execution_blocked'
  disposition: 'created' | 'exact_replay'
  package: CanonicalProfessionalLongFormChildPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest: CanonicalProfessionalLongFormChildPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  commit: {
    immutablePackagePrepared: true
    immutablePlacementPrepared: true
    atomicQueueAggregatePublished: true
    queueIdentityBindsPreparedAuthorityRefs: true
    orphanPreparedBlobsGrantExecutionAuthority: false
    exactReplayRequired: true
  }
  readiness: {
    canonicalSeedComponentPersistenceVerified: true
    serverLoadedControllerPersistenceVerified: true
    approvedSnapshotBridgePersistenceVerified: true
    childJobManifestPersistenceVerified: true
    childPackagePersistenceVerified: true
    childPlacementPersistenceVerified: true
    childPackageQueuePersistenceVerified: true
    childLeaseVerified: false
    childDispatchVerified: false
    childToolOperationBindingVerified: false
    childAttemptCostBudgetVerified: false
    mediaExecutionVerified: false
    objectStorePersistenceVerified: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormCurrentChildPackageAuthority {
  authority: Awaited<ReturnType<
    ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']
  >>
  postApproval: Awaited<ReturnType<
    ReturnType<
      typeof createCanonicalProfessionalLongFormPostApprovalService
    >['deriveAndPersist']
  >>
  package: CanonicalProfessionalLongFormChildPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest: CanonicalProfessionalLongFormChildPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  queueCreated: boolean
}

export function createCanonicalProfessionalLongFormChildPackagePromotionService(
  context: ServiceContext,
) {
  return {
    async promote(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormChildPromotionEvidence> {
      const current = await loadCurrentChildPackageAuthority(context, input, true)
      const stablePayload = {
        schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PROMOTION_VERSION,
        source: 'server_reloaded_approved_long_form_child_authority' as const,
        status: 'child_package_and_queue_persisted_execution_blocked' as const,
        package: current.package,
        packageRef: current.packageRef,
        placementManifest: current.placementManifest,
        placementManifestRef: current.placementManifestRef,
        queueDefinition: current.queueDefinition,
        queueAggregate: current.queueAggregate,
        commit: {
          immutablePackagePrepared: true as const,
          immutablePlacementPrepared: true as const,
          atomicQueueAggregatePublished: true as const,
          queueIdentityBindsPreparedAuthorityRefs: true as const,
          orphanPreparedBlobsGrantExecutionAuthority: false as const,
          exactReplayRequired: true as const,
        },
        readiness: {
          canonicalSeedComponentPersistenceVerified: true as const,
          serverLoadedControllerPersistenceVerified: true as const,
          approvedSnapshotBridgePersistenceVerified: true as const,
          childJobManifestPersistenceVerified: true as const,
          childPackagePersistenceVerified: true as const,
          childPlacementPersistenceVerified: true as const,
          childPackageQueuePersistenceVerified: true as const,
          childLeaseVerified: false as const,
          childDispatchVerified: false as const,
          childToolOperationBindingVerified: false as const,
          childAttemptCostBudgetVerified: false as const,
          mediaExecutionVerified: false as const,
          objectStorePersistenceVerified: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: current.queueCreated ? 'created' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
    async loadCurrent(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCurrentChildPackageAuthority> {
      return loadCurrentChildPackageAuthority(context, input, false)
    },
  }
}

async function loadCurrentChildPackageAuthority(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
  requirePristinePromotion: boolean,
): Promise<CanonicalProfessionalLongFormCurrentChildPackageAuthority> {
  if (!isExplicitLocalInternalTestRuntime(context.env)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Professional long-form child package authority remains private/local until distributed transaction and service-identity evidence exists.',
      503,
      {
        requiredGate:
          'canonical_professional_long_form_distributed_package_promotion',
      },
    )
  }
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) {
    throw new ApiError(
      'AUTH_REQUIRED',
      'Professional long-form child package authority requires authenticated authority.',
      401,
    )
  }
  const reopened =
    await createCanonicalProfessionalLongFormPostApprovalService(context)
      .derivePersistAndLoadCurrent(input)
  const authority = reopened.authority
  if (
    authority.snapshot.approvedByUserId !== ownerUserId ||
    authority.reservation.status !== 'reserved' ||
    authority.reservation.id !== authority.snapshot.reservationId ||
    authority.estimate.id !== authority.snapshot.estimateId
  ) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Professional long-form child package authority requires the exact funded approved reservation.',
      409,
    )
  }
  const postApproval = reopened.evidence
  const reservation = {
    reservationStatus: authority.reservation.status,
    approvedMaximumCredits: authority.estimate.approvedMaximumCredits,
    reservedCredits: authority.reservation.reservedCredits,
    spentCredits: authority.reservation.spentCredits,
    releasedCredits: authority.reservation.releasedCredits,
    refundedCredits: authority.reservation.refundedCredits,
  }
  const childPackage = validationBoundary(() =>
    buildCanonicalProfessionalLongFormChildPackage({
      bridge: postApproval.bridge,
      bridgeRef: postApproval.bridgeRef,
      childJobManifest: postApproval.childJobManifest,
      childJobManifestRef: postApproval.childJobManifestRef,
      reservation,
    }))
  const packageRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    value: childPackage as unknown as Record<string, unknown>,
    maxBytes: 4 * 1024 * 1024,
  })
  const packageValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    ref: packageRef,
  })
  const verifiedPackage = validationBoundary(() =>
    assertCanonicalProfessionalLongFormChildPackage({
      value: packageValue,
      bridge: postApproval.bridge,
      bridgeRef: postApproval.bridgeRef,
      childJobManifest: postApproval.childJobManifest,
      childJobManifestRef: postApproval.childJobManifestRef,
      reservation,
    }))
  const placementManifest = validationBoundary(() =>
    buildCanonicalProfessionalLongFormChildPlacementManifest({
      package: verifiedPackage,
      bridge: postApproval.bridge,
      childJobManifest: postApproval.childJobManifest,
    }))
  const placementManifestRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    value: placementManifest as unknown as Record<string, unknown>,
    maxBytes: 4 * 1024 * 1024,
  })
  const placementValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: context.env.localStorageRoot,
    ref: placementManifestRef,
  })
  const verifiedPlacement = validationBoundary(() =>
    assertCanonicalProfessionalLongFormChildPlacementManifest({
      value: placementValue,
      package: verifiedPackage,
      bridge: postApproval.bridge,
      childJobManifest: postApproval.childJobManifest,
    }))
  const queueDefinition = validationBoundary(() =>
    buildCanonicalProfessionalLongFormChildQueueDefinition({
      package: verifiedPackage,
      packageRef,
      placementManifest: verifiedPlacement,
      placementManifestRef,
      childJobManifest: postApproval.childJobManifest,
    }))
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: verifiedPackage.identity.workspaceId,
    projectId: verifiedPackage.identity.projectId,
    editSessionId: verifiedPackage.identity.editSessionId,
    packageRecordId: verifiedPackage.identity.packageRecordId,
    approvedPlanSnapshotId:
      verifiedPackage.identity.approvedPlanSnapshotId,
  }
  const ensured = await ensurePrivateCanonicalPackageWorkQueue({
    scope,
    definition: queueDefinition,
  })
  const reopenedQueue = await readPrivateCanonicalPackageWorkQueue({
    scope,
    definition: queueDefinition,
  })
  const sharedInvalid = !reopenedQueue ||
    (requirePristinePromotion &&
      reopenedQueue.aggregateHash !== ensured.aggregate.aggregateHash) ||
    reopenedQueue.summary.totalJobCount !==
      postApproval.childJobManifest.summary.childJobCount ||
    reopenedQueue.entries.some((entry) => entry.definition.privateExecutionReady)
  const pristineInvalid = requirePristinePromotion && reopenedQueue && (
    reopenedQueue.summary.queuedJobCount !== reopenedQueue.summary.totalJobCount ||
    reopenedQueue.summary.leasedJobCount !== 0 ||
    reopenedQueue.summary.completedJobCount !== 0 ||
    reopenedQueue.entries.some((entry) =>
      entry.deliveryAttemptCount !== 0 ||
      entry.professionalLongFormExecutionAuthorization !== undefined ||
      entry.professionalLongFormExecutionAttempt !== undefined ||
      entry.activeClaim !== undefined ||
      entry.completion !== undefined)
  )
  if (sharedInvalid || pristineInvalid || !reopenedQueue) {
    throw new ApiError(
      'VALIDATION_FAILED',
      requirePristinePromotion
        ? 'Professional long-form child queue did not reopen as one exact blocked promotion commit.'
        : 'Professional long-form child queue did not reopen with exact current authority.',
      409,
    )
  }
  validationBoundary(() =>
    assertCanonicalProfessionalLongFormChildQueueDefinition({
      value: queueDefinition,
      package: verifiedPackage,
      packageRef,
      placementManifest: verifiedPlacement,
      placementManifestRef,
      childJobManifest: postApproval.childJobManifest,
    }))
  return {
    authority,
    postApproval,
    package: verifiedPackage,
    packageRef,
    placementManifest: verifiedPlacement,
    placementManifestRef,
    queueDefinition,
    queueAggregate: reopenedQueue,
    scope,
    queueCreated: ensured.created,
  }
}

function validationBoundary<T>(action: () => T): T {
  try {
    return action()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form child package promotion authority is invalid.',
      409,
      { reason: error instanceof Error ? error.message : String(error) },
    )
  }
}
