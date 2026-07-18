import {
  PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS,
  PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY,
  buildProfessionalLongFormApprovedSnapshotBridge,
  buildProfessionalLongFormControllerExecutionInput,
  professionalLongFormControllerExecutionInputSchema,
  verifyProfessionalLongFormApprovedSnapshotBridge,
  type ProfessionalLongFormApprovedSnapshotBridge,
} from '../edit-architecture/professional-long-form-approved-snapshot-bridge'
import {
  buildProfessionalLongFormDerivedChildJobManifest,
  verifyProfessionalLongFormDerivedChildJobManifest,
  type ProfessionalLongFormDerivedChildJobManifest,
} from '../edit-architecture/professional-long-form-derived-child-job-manifest'
import {
  PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_REQUEST_VERSION,
  buildProfessionalLongFormObjectExecutionPlan,
  verifyProfessionalLongFormObjectPlanSeed,
  type ProfessionalLongFormObjectExecutionRequest,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  type AuthorityJsonBlobRef,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY } from './canonical-professional-long-form-publication-authority'

export const CANONICAL_PROFESSIONAL_LONG_FORM_POST_APPROVAL_VERSION =
  'canonical-professional-long-form-post-approval-v1' as const

export interface CanonicalProfessionalLongFormPostApprovalEvidence {
  schemaVersion: typeof CANONICAL_PROFESSIONAL_LONG_FORM_POST_APPROVAL_VERSION
  source: 'server_loaded_canonical_approved_execution_authority'
  status: 'seed_controller_bridge_and_child_manifest_persisted_execution_blocked'
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  bridgeRef: AuthorityJsonBlobRef
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
  childJobManifestRef: AuthorityJsonBlobRef
  persistence: {
    exactSeedComponentReopened: true
    exactServerLoadedControllerReopened: true
    exactBridgeReopened: true
    exactChildJobManifestReopened: true
    exactReplayRequired: true
  }
  readiness: {
    canonicalSeedComponentPersistenceVerified: true
    serverLoadedControllerPersistenceVerified: true
    approvedSnapshotBridgePersistenceVerified: true
    childJobDerivationVerified: true
    childJobManifestPersistenceVerified: true
    childPackageQueuePersistenceVerified: false
    dispatchVerified: false
    mediaExecutionVerified: false
    objectStorePersistenceVerified: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormPostApprovalService(
  context: ServiceContext,
) {
  const derivePersistAndLoadCurrent = async (input: {
    workspaceId: string
    approvedPlanSnapshotId: string
  }) => {
      const authority = await createEditPlanningAuthorityService(context)
        .loadApprovedExecutionAuthority(
          input.approvedPlanSnapshotId,
          input.workspaceId,
        )
      const seedRef = authority.snapshot.componentRefs[
        PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY
      ]
      const controllerWorkItems = authority.workItems.filter((workItem) =>
        workItem.workItemKey ===
          CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY ||
        workItem.workerClass === PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS)
      if (!seedRef || controllerWorkItems.length !== 1) {
        throw new ApiError(
          'APPROVED_SNAPSHOT_REQUIRED',
          'Canonical approved snapshot does not contain one professional long-form seed/controller authority.',
          409,
        )
      }
      const controllerWorkItem = controllerWorkItems[0]!
      const controllerJobs = authority.jobs.filter((job) =>
        job.approvedWorkItemId === controllerWorkItem.id &&
        job.snapshotId === authority.snapshot.snapshotId &&
        job.reservationId === authority.reservation.id)
      if (
        controllerJobs.length !== 1 ||
        controllerJobs[0]!.workerClass !== PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS ||
        controllerJobs[0]!.status !== 'ready'
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Canonical professional long-form controller job lineage is missing or not ready for deterministic derivation.',
          409,
        )
      }
      const controllerJob = controllerJobs[0]!

      const seedValue = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: seedRef,
      })
      const seed = verifyProfessionalLongFormObjectPlanSeed(seedValue)
      const controllerExecutionInput =
        professionalLongFormControllerExecutionInputSchema.parse(
          controllerWorkItem.executionInput,
        )
      const expectedControllerExecutionInput =
        buildProfessionalLongFormControllerExecutionInput({
          planSeedHash: seedRef.sha256,
          planSeedComponentRefSha256: seedRef.sha256,
        })
      if (
        seedRef.sha256 !== sha256AuthorityValue(seed) ||
        seed.identity.approvedTimingHash !== authority.snapshot.timingHash ||
        stableAuthorityStringify(controllerExecutionInput) !==
          stableAuthorityStringify(expectedControllerExecutionInput)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical professional long-form seed/controller changed after approval.',
          409,
        )
      }

      const planRequest: ProfessionalLongFormObjectExecutionRequest = {
        schemaVersion: PROFESSIONAL_LONG_FORM_OBJECT_EXECUTION_REQUEST_VERSION,
        identity: {
          workspaceId: authority.snapshot.workspaceId,
          projectId: authority.snapshot.projectId,
          editSessionId: authority.snapshot.editSessionId,
          planningRequestId: authority.plan.planningRequestId,
          approvedPlanId: authority.plan.id,
          approvedPlanHash: authority.snapshot.planHash,
          approvedPlanSnapshotId: authority.snapshot.snapshotId,
          approvedPlanSnapshotHash: authority.snapshot.snapshotHash,
          approvedEstimateId: authority.estimate.id,
          approvedEstimateHash: authority.snapshot.estimateHash,
          approvalRecordId: authority.approval.id,
          creditReservationId: authority.reservation.id,
          approvedWorkGraphHash: authority.snapshot.workGraphHash,
          approvedTimingHash: authority.snapshot.timingHash,
        },
        runtimeRegion: seed.runtimeRegion,
        confirmedOutputFrame: seed.confirmedOutputFrame,
        totalFrames: seed.totalFrames,
        sourceRanges: seed.sourceRanges,
        executionPolicy: seed.executionPolicy,
        approvalAndCostBoundary: seed.approvalAndCostBoundary,
      }
      const plan = buildProfessionalLongFormObjectExecutionPlan(planRequest)
      const bridge = buildProfessionalLongFormApprovedSnapshotBridge({
        schemaVersion: 'professional-long-form-approved-snapshot-bridge-v1',
        snapshot: authority.snapshot,
        controllerBinding: {
          source: 'server_loaded_approved_work_item_view',
          approvedWorkItemId: controllerWorkItem.id,
          sourceWorkItemId: controllerWorkItem.sourceWorkItemId,
          snapshotId: controllerWorkItem.snapshotId,
          workItemKey: controllerWorkItem.workItemKey,
          workItemType: controllerWorkItem.workItemType,
          workerClass: controllerWorkItem.workerClass,
          required: controllerWorkItem.required,
          maximumAttempts: controllerWorkItem.maxAttempts,
          executionInputRef: controllerWorkItem.executionInputRef,
          executionInput: controllerExecutionInput,
        },
        plan,
      })
      const childJobManifest = buildProfessionalLongFormDerivedChildJobManifest({
        bridge,
        parentControllerApprovedWorkItemId: controllerWorkItem.id,
        parentControllerJobId: controllerJob.id,
      })

      const bridgeRef = await putPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        value: bridge as unknown as Record<string, unknown>,
        maxBytes: 4 * 1024 * 1024,
      })
      const persistedBridgeValue = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: bridgeRef,
      })
      const persistedBridge = verifyProfessionalLongFormApprovedSnapshotBridge(
        persistedBridgeValue,
      )
      const childJobManifestRef = await putPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        value: childJobManifest as unknown as Record<string, unknown>,
        maxBytes: 4 * 1024 * 1024,
      })
      const persistedChildJobManifestValue = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: childJobManifestRef,
      })
      const persistedChildJobManifest =
        verifyProfessionalLongFormDerivedChildJobManifest({
          manifest: persistedChildJobManifestValue,
          bridge: persistedBridge,
          parentControllerApprovedWorkItemId: controllerWorkItem.id,
          parentControllerJobId: controllerJob.id,
        })

      const payload = {
        schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_POST_APPROVAL_VERSION,
        source: 'server_loaded_canonical_approved_execution_authority' as const,
        status:
          'seed_controller_bridge_and_child_manifest_persisted_execution_blocked' as const,
        bridge: persistedBridge,
        bridgeRef,
        childJobManifest: persistedChildJobManifest,
        childJobManifestRef,
        persistence: {
          exactSeedComponentReopened: true as const,
          exactServerLoadedControllerReopened: true as const,
          exactBridgeReopened: true as const,
          exactChildJobManifestReopened: true as const,
          exactReplayRequired: true as const,
        },
        readiness: {
          canonicalSeedComponentPersistenceVerified: true as const,
          serverLoadedControllerPersistenceVerified: true as const,
          approvedSnapshotBridgePersistenceVerified: true as const,
          childJobDerivationVerified: true as const,
          childJobManifestPersistenceVerified: true as const,
          childPackageQueuePersistenceVerified: false as const,
          dispatchVerified: false as const,
          mediaExecutionVerified: false as const,
          objectStorePersistenceVerified: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      const evidence: CanonicalProfessionalLongFormPostApprovalEvidence = {
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      }
      return { authority, evidence }
  }
  return {
    async deriveAndPersist(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormPostApprovalEvidence> {
      return (await derivePersistAndLoadCurrent(input)).evidence
    },
    derivePersistAndLoadCurrent,
  }
}
