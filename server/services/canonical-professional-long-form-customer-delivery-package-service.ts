import { ApiError } from '../errors/api-error'
import {
  assertCanonicalProfessionalLongFormCustomerDeliveryPackage,
  assertCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest,
  assertCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition,
  buildCanonicalProfessionalLongFormCustomerDeliveryPackage,
  buildCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest,
  buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition,
  type CanonicalProfessionalLongFormCustomerDeliveryPackage,
  type CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest,
  type ProfessionalLongFormCustomerDeliveryReviewedEvidence,
} from '../edit-architecture/professional-long-form-customer-delivery-package'
import {
  professionalLongFormContinuousProgramAudioCompletionSchema,
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  professionalLongFormFirstObjectChunkQaArtifactSchema,
  professionalLongFormFirstObjectChunkQaCompletionSchema,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  professionalLongFormPrivateMasterQaArtifactSchema,
  professionalLongFormPrivateMasterQaCompletionSchema,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'
import type { ServiceContext } from '../types'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
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
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
  type CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from './canonical-professional-long-form-child-package-promotion-service'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PREPARATION_VERSION =
  'canonical-professional-long-form-customer-delivery-preparation-v1' as const

export interface CanonicalProfessionalLongFormCustomerDeliveryPreparation {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PREPARATION_VERSION
  source: 'server_reloaded_passed_private_review_master_qa'
  status: 'private_customer_delivery_package_and_queue_persisted_execution_blocked'
  disposition: 'created' | 'exact_replay'
  package: CanonicalProfessionalLongFormCustomerDeliveryPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest:
    CanonicalProfessionalLongFormCustomerDeliveryPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  commit: {
    sourceReviewAuthorityReadBackVerified: true
    immutablePackagePrepared: true
    immutablePlacementPrepared: true
    atomicQueueAggregatePublished: true
    queueIdentityBindsPreparedAuthorityRefs: true
    exactReplayRequired: true
    orphanPreparedBlobsGrantExecutionAuthority: false
  }
  readiness: {
    passedPrivateReviewMasterQaVerified: true
    customerDeliveryGraphPrepared: true
    packagePersistenceVerified: true
    placementPersistenceVerified: true
    queuePersistenceVerified: true
    originalFourKEstimateAndReservationReused: true
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    exactRunnerAuthorityVerified: false
    exactRateAndAttemptCostAuthorityVerified: false
    leaseAndSingleUseDispatchVerified: false
    customerDeliveryMediaExecutionVerified: false
    decodedVideoAndAudioQaVerified: false
    privateDownloadVerified: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormCustomerDeliveryPackageService(
  context: ServiceContext,
) {
  return {
    async prepare(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCustomerDeliveryPreparation> {
      const ownerUserId = context.auth?.userId
      if (!ownerUserId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form customer delivery requires authenticated authority.',
          401,
        )
      }
      const current = await
        createCanonicalProfessionalLongFormChildPackagePromotionService(context)
          .loadCurrent(input)
      const evidence = await loadReviewedEvidence({
        localStorageRoot: context.env.localStorageRoot,
        current,
      })
      const deliveryPackage = validationBoundary(() =>
        buildCanonicalProfessionalLongFormCustomerDeliveryPackage({
          ownerUserId,
          current,
          evidence,
        }))
      const packageRef = await putPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        value: deliveryPackage as unknown as Record<string, unknown>,
        maxBytes: 4 * 1024 * 1024,
      })
      const persistedPackage = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: packageRef,
      })
      const verifiedPackage = validationBoundary(() =>
        assertCanonicalProfessionalLongFormCustomerDeliveryPackage({
          value: persistedPackage,
          ownerUserId,
          current,
          evidence,
        }))
      const placementManifest = validationBoundary(() =>
        buildCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest({
          package: verifiedPackage,
        }))
      const placementManifestRef = await putPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        value: placementManifest as unknown as Record<string, unknown>,
        maxBytes: 4 * 1024 * 1024,
      })
      const persistedPlacement = await readPrivateAuthorityJsonBlob({
        localStorageRoot: context.env.localStorageRoot,
        ref: placementManifestRef,
      })
      const verifiedPlacement = validationBoundary(() =>
        assertCanonicalProfessionalLongFormCustomerDeliveryPlacementManifest({
          value: persistedPlacement,
          package: verifiedPackage,
        }))
      const queueDefinition = validationBoundary(() =>
        buildCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition({
          package: verifiedPackage,
          packageRef,
          placementManifest: verifiedPlacement,
          placementManifestRef,
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
      const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
        scope,
        definition: queueDefinition,
      })
      if (
        !queueAggregate ||
        queueAggregate.aggregateHash !== ensured.aggregate.aggregateHash ||
        queueAggregate.summary.totalJobCount !==
          verifiedPackage.graph.summary.totalJobCount ||
        queueAggregate.summary.queuedJobCount !==
          queueAggregate.summary.totalJobCount ||
        queueAggregate.summary.leasedJobCount !== 0 ||
        queueAggregate.summary.completedJobCount !== 0 ||
        queueAggregate.entries.some((entry) =>
          entry.definition.privateExecutionReady ||
          entry.deliveryAttemptCount !== 0 ||
          entry.professionalLongFormExecutionAuthorization !== undefined ||
          entry.professionalLongFormExecutionAttempt !== undefined ||
          entry.activeClaim !== undefined || entry.completion !== undefined)
      ) throw new ApiError(
        'VALIDATION_FAILED',
        'Customer-delivery queue did not reopen as one exact blocked commit.',
        409,
      )
      validationBoundary(() =>
        assertCanonicalProfessionalLongFormCustomerDeliveryQueueDefinition({
          value: queueDefinition,
          package: verifiedPackage,
          packageRef,
          placementManifest: verifiedPlacement,
          placementManifestRef,
        }))
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PREPARATION_VERSION,
        source: 'server_reloaded_passed_private_review_master_qa' as const,
        status:
          'private_customer_delivery_package_and_queue_persisted_execution_blocked' as const,
        package: verifiedPackage,
        packageRef,
        placementManifest: verifiedPlacement,
        placementManifestRef,
        queueDefinition,
        queueAggregate,
        commit: {
          sourceReviewAuthorityReadBackVerified: true as const,
          immutablePackagePrepared: true as const,
          immutablePlacementPrepared: true as const,
          atomicQueueAggregatePublished: true as const,
          queueIdentityBindsPreparedAuthorityRefs: true as const,
          exactReplayRequired: true as const,
          orphanPreparedBlobsGrantExecutionAuthority: false as const,
        },
        readiness: {
          passedPrivateReviewMasterQaVerified: true as const,
          customerDeliveryGraphPrepared: true as const,
          packagePersistenceVerified: true as const,
          placementPersistenceVerified: true as const,
          queuePersistenceVerified: true as const,
          originalFourKEstimateAndReservationReused: true as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          exactRunnerAuthorityVerified: false as const,
          exactRateAndAttemptCostAuthorityVerified: false as const,
          leaseAndSingleUseDispatchVerified: false as const,
          customerDeliveryMediaExecutionVerified: false as const,
          decodedVideoAndAudioQaVerified: false as const,
          privateDownloadVerified: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: ensured.created ? 'created' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

async function loadReviewedEvidence(input: {
  localStorageRoot: string
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
}): Promise<ProfessionalLongFormCustomerDeliveryReviewedEvidence> {
  const chunks = await Promise.all(
    input.current.postApproval.bridge.binding.plan.chunks.map(async (chunk) => {
      const entry = completedEntry(input.current, `${chunk.chunkId}:qa`)
      const completion = professionalLongFormFirstObjectChunkQaCompletionSchema
        .parse(entry.completion.outcome.professionalLongFormExecution)
      const value = await readPrivateAuthorityJsonBlob({
        localStorageRoot: input.localStorageRoot,
        ref: completion.validationArtifactRef,
      })
      return {
        chunkId: chunk.chunkId,
        qaArtifactRef: completion.validationArtifactRef,
        qaArtifact: professionalLongFormFirstObjectChunkQaArtifactSchema
          .parse(value),
      }
    }),
  )
  const audioWorkItem = input.current.postApproval.bridge.binding.plan
    .workGraph.workItems.find((item) =>
      item.kind === 'mix_continuous_program_audio')
  if (!audioWorkItem) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Customer-delivery source program audio is missing.',
      409,
    )
  }
  const audioEntry = completedEntry(input.current, audioWorkItem.workItemId)
  const audioCompletion = professionalLongFormContinuousProgramAudioCompletionSchema
    .parse(audioEntry.completion.outcome.professionalLongFormExecution)
  const audioValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref: audioCompletion.qaArtifactRef,
  })
  const privateQaEntry = completedEntry(
    input.current,
    PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
  )
  const privateQaCompletion = professionalLongFormPrivateMasterQaCompletionSchema
    .parse(privateQaEntry.completion.outcome.professionalLongFormExecution)
  const privateQaValue = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref: privateQaCompletion.validationArtifactRef,
  })
  return {
    chunkQa: chunks,
    programAudioQaArtifactRef: audioCompletion.qaArtifactRef,
    programAudioQaArtifact:
      professionalLongFormContinuousProgramAudioQaArtifactSchema.parse(
        audioValue,
      ),
    privateMasterQaArtifactRef: privateQaCompletion.validationArtifactRef,
    privateMasterQaArtifact: professionalLongFormPrivateMasterQaArtifactSchema
      .parse(privateQaValue),
  }
}

function completedEntry(
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority,
  approvedWorkItemId: string,
) {
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.approvedWorkItemId === approvedWorkItemId)
  if (!entry?.completion || entry.state !== 'completed') {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      `Customer-delivery source ${approvedWorkItemId} is incomplete.`,
      409,
    )
  }
  return { ...entry, completion: entry.completion }
}

function validationBoundary<T>(action: () => T): T {
  try {
    return action()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form customer-delivery authority is invalid.',
      409,
      { reason: error instanceof Error ? error.message : String(error) },
    )
  }
}
