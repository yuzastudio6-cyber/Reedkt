import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertProfessionalLongFormDeliveryH264Authority,
  assertProfessionalLongFormDeliveryRootAuthority,
  buildProfessionalLongFormDeliveryH264Authority,
  buildProfessionalLongFormDeliveryH264Authorization,
  buildProfessionalLongFormDeliveryH264Completion,
  buildProfessionalLongFormDeliveryH264Reconciliation,
  buildProfessionalLongFormDeliveryH264RuntimeEvidence,
  buildProfessionalLongFormDeliveryH264Terminal,
  buildProfessionalLongFormDeliveryRootAuthority,
  buildProfessionalLongFormDeliveryRootAuthorization,
  buildProfessionalLongFormDeliveryRootCompletion,
  buildProfessionalLongFormDeliveryRootQaEvidence,
  buildProfessionalLongFormDeliveryRootReconciliation,
  buildProfessionalLongFormDeliveryRootTerminal,
  buildProfessionalLongFormDeliveryRootValidationArtifact,
  professionalLongFormDeliveryH264ResultHash,
  professionalLongFormDeliveryRootResultHash,
  type CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority,
} from '../edit-architecture/professional-long-form-customer-delivery-execution'
import {
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
  professionalLongFormDeliveryH264AttemptSchema,
  professionalLongFormDeliveryH264CompletionSchema,
  professionalLongFormDeliveryH264ReconciliationSchema,
  professionalLongFormDeliveryH264RuntimeEvidenceSchema,
  professionalLongFormDeliveryH264TerminalSchema,
  professionalLongFormDeliveryRootAttemptSchema,
  professionalLongFormDeliveryRootCompletionSchema,
  professionalLongFormDeliveryRootQaEvidenceSchema,
  professionalLongFormDeliveryRootReconciliationSchema,
  professionalLongFormDeliveryRootTerminalSchema,
  professionalLongFormDeliveryRootValidationArtifactSchema,
  type ProfessionalLongFormDeliveryH264ArtifactRef,
  type ProfessionalLongFormDeliveryH264Attempt,
  type ProfessionalLongFormDeliveryH264Authority,
  type ProfessionalLongFormDeliveryH264Authorization,
  type ProfessionalLongFormDeliveryH264Reconciliation,
  type ProfessionalLongFormDeliveryH264RuntimeEvidence,
  type ProfessionalLongFormDeliveryH264Terminal,
  type ProfessionalLongFormDeliveryRootAttempt,
  type ProfessionalLongFormDeliveryRootAuthority,
  type ProfessionalLongFormDeliveryRootAuthorization,
  type ProfessionalLongFormDeliveryRootQaEvidence,
  type ProfessionalLongFormDeliveryRootReconciliation,
  type ProfessionalLongFormDeliveryRootTerminal,
  type ProfessionalLongFormDeliveryRootValidationArtifact,
} from '../edit-architecture/professional-long-form-customer-delivery-execution-contract'
import {
  assertProfessionalLongFormDeliveryH264QaAuthority,
  buildProfessionalLongFormDeliveryH264QaArtifact,
  buildProfessionalLongFormDeliveryH264QaAuthority,
  buildProfessionalLongFormDeliveryH264QaAuthorization,
  buildProfessionalLongFormDeliveryH264QaCompletion,
  buildProfessionalLongFormDeliveryH264QaReconciliation,
  buildProfessionalLongFormDeliveryH264QaTerminal,
  professionalLongFormDeliveryH264QaResultHash,
  professionalLongFormDeliveryH264QaRuntimeReceipt,
} from '../edit-architecture/professional-long-form-customer-delivery-h264-qa-execution'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
  professionalLongFormDeliveryH264QaArtifactSchema,
  professionalLongFormDeliveryH264QaAttemptSchema,
  professionalLongFormDeliveryH264QaCompletionSchema,
  professionalLongFormDeliveryH264QaReconciliationSchema,
  professionalLongFormDeliveryH264QaTerminalSchema,
  type ProfessionalLongFormDeliveryH264QaArtifact,
  type ProfessionalLongFormDeliveryH264QaAttempt,
  type ProfessionalLongFormDeliveryH264QaAuthority,
  type ProfessionalLongFormDeliveryH264QaAuthorization,
  type ProfessionalLongFormDeliveryH264QaReconciliation,
  type ProfessionalLongFormDeliveryH264QaTerminal,
} from '../edit-architecture/professional-long-form-customer-delivery-h264-qa-execution-contract'
import {
  assertProfessionalLongFormDeliveryMuxAuthority,
  buildProfessionalLongFormDeliveryMuxArtifactRef,
  buildProfessionalLongFormDeliveryMuxAuthority,
  buildProfessionalLongFormDeliveryMuxAuthorization,
  buildProfessionalLongFormDeliveryMuxCompletion,
  buildProfessionalLongFormDeliveryMuxReconciliation,
  buildProfessionalLongFormDeliveryMuxRuntimeEvidence,
  buildProfessionalLongFormDeliveryMuxTerminal,
  professionalLongFormDeliveryMuxResultHash,
  type ProfessionalLongFormDeliveryMuxDependencyEvidence,
} from '../edit-architecture/professional-long-form-customer-delivery-mux-execution'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID,
  professionalLongFormDeliveryMuxAttemptSchema,
  professionalLongFormDeliveryMuxCompletionSchema,
  professionalLongFormDeliveryMuxReconciliationSchema,
  professionalLongFormDeliveryMuxRuntimeEvidenceSchema,
  professionalLongFormDeliveryMuxTerminalSchema,
  type ProfessionalLongFormDeliveryMuxArtifactRef,
  type ProfessionalLongFormDeliveryMuxAttempt,
  type ProfessionalLongFormDeliveryMuxAuthority,
  type ProfessionalLongFormDeliveryMuxAuthorization,
  type ProfessionalLongFormDeliveryMuxReconciliation,
  type ProfessionalLongFormDeliveryMuxRuntimeEvidence,
  type ProfessionalLongFormDeliveryMuxTerminal,
} from '../edit-architecture/professional-long-form-customer-delivery-mux-execution-contract'
import {
  professionalLongFormContinuousProgramAudioQaArtifactSchema,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
  buildOfflineRemotionDeliveryH264ChunkRequest,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  type OfflineRemotionRuntimeAuthority,
} from '../tool-execution/remotion-render-execution'
import {
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  buildOfflineMediaBinaryCustomerDeliveryMuxRequest,
  offlineMediaBinaryCustomerDeliveryMuxRequestSha256,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeStreamingExecutionRequest,
  type OfflineFfmpegCustomerDeliveryMuxExecutionResult,
  type OfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution'
import {
  beginPrivateInternalAttemptCostEvidence,
  classifyPrivateInternalAttemptCostFailure,
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { CanonicalPrivatePackageWorkQueueAggregate } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  authorizePrivateCanonicalPackageWorkQueueJob,
  beginPrivateCanonicalPackageWorkQueueExecutionAttempt,
  claimPrivateCanonicalPackageWorkQueueJob,
  completePrivateCanonicalPackageWorkQueueClaim,
  heartbeatPrivateCanonicalPackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  createCanonicalProfessionalLongFormCustomerDeliveryPackageService,
} from './canonical-professional-long-form-customer-delivery-package-service'
import {
  inspectCanonicalPrivateObjectChunkMediaArtifact,
} from './canonical-private-media-artifact-storage'
import {
  inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact,
  persistCanonicalPrivateRemotionDeliveryH264ChunkArtifactStream,
  type CanonicalPrivateRemotionArtifactInspection,
} from './canonical-private-remotion-artifact-storage'
import {
  inspectCanonicalPrivateProgramAudioArtifact,
  type CanonicalPrivateProgramAudioArtifactInspection,
} from './canonical-private-program-audio-artifact-storage'
import {
  inspectCanonicalPrivateCustomerDeliveryArtifact,
  persistCanonicalPrivateCustomerDeliveryArtifactStream,
} from './canonical-private-customer-delivery-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-execution-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_QA_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-h264-qa-execution-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_SERIES_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-h264-series-execution-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MUX_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-mux-execution-v1' as const

interface LoadedCustomerDeliveryAuthority extends
  CanonicalProfessionalLongFormCurrentCustomerDeliveryAuthority {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
}

interface CompletedRootEvidence {
  authority: ProfessionalLongFormDeliveryRootAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryRootAuthorization
  executionAttempt: ProfessionalLongFormDeliveryRootAttempt
  validationArtifact: ProfessionalLongFormDeliveryRootValidationArtifact
  validationArtifactRef: AuthorityJsonBlobRef
  qaEvidence: ProfessionalLongFormDeliveryRootQaEvidence
  qaEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryRootReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryRootTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

interface CompletedH264Evidence {
  authority: ProfessionalLongFormDeliveryH264Authority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryH264Authorization
  executionAttempt: ProfessionalLongFormDeliveryH264Attempt
  outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef
  runtimeEvidence: ProfessionalLongFormDeliveryH264RuntimeEvidence
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryH264Reconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryH264Terminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

interface CompletedH264QaEvidence {
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryH264QaAuthorization
  executionAttempt: ProfessionalLongFormDeliveryH264QaAttempt
  artifact: ProfessionalLongFormDeliveryH264QaArtifact
  artifactRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryH264QaReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryH264QaTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

interface CompletedDeliveryMuxEvidence {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  authorityRef: AuthorityJsonBlobRef
  authorization: ProfessionalLongFormDeliveryMuxAuthorization
  executionAttempt: ProfessionalLongFormDeliveryMuxAttempt
  outputArtifact: ProfessionalLongFormDeliveryMuxArtifactRef
  runtimeEvidence: ProfessionalLongFormDeliveryMuxRuntimeEvidence
  runtimeEvidenceRef: AuthorityJsonBlobRef
  reconciliation: ProfessionalLongFormDeliveryMuxReconciliation
  reconciliationRef: AuthorityJsonBlobRef
  costEvidence: PrivateInternalAttemptCostEvidence
  terminal: ProfessionalLongFormDeliveryMuxTerminal
  terminalRef: AuthorityJsonBlobRef
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
}

export interface CanonicalProfessionalLongFormCustomerDeliveryExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_EXECUTION_VERSION
  source: 'canonical_professional_long_form_customer_delivery_execution_service'
  status: 'delivery_root_and_first_h264_chunk_completed_independent_qa_blocked'
  disposition: 'completed' | 'exact_replay'
  root: Omit<CompletedRootEvidence, 'queueAggregate'>
  h264: Omit<CompletedH264Evidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotAndOriginalReservationReopened: true
    passedPrivateReviewMasterQaLineageVerified: true
    rootLeaseAndOneUseDispatchVerified: true
    rootAttemptInternalCostVerified: true
    firstVp9ChunkReopenedAndChecksummed: true
    firstH264LeaseAndOneUseDispatchVerified: true
    exactPinnedRemotionRunnerVerified: true
    h264HighCrf18MediumVideoOnlyExecutionVerified: true
    privateH264CreateOnlyPersistenceVerified: true
    h264AttemptInternalCostVerified: true
    independentH264ChunkQaVerified: false
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    providerActivationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormCustomerDeliveryH264QaExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_QA_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_execution_service'
  status:
    'delivery_root_first_h264_and_independent_qa_completed_mux_blocked'
  disposition: 'completed' | 'exact_replay'
  root: Omit<CompletedRootEvidence, 'queueAggregate'>
  h264: Omit<CompletedH264Evidence, 'queueAggregate'>
  qa: Omit<CompletedH264QaEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotAndOriginalReservationReopened: true
    passedPrivateReviewMasterQaLineageVerified: true
    rootLeaseAndOneUseDispatchVerified: true
    firstH264LeaseAndOneUseDispatchVerified: true
    exactPinnedRemotionRunnerVerified: true
    privateH264CreateOnlyPersistenceVerified: true
    firstH264IndependentProbeLeaseAndOneUseDispatchVerified: true
    exactPinnedFfprobeRuntimeVerified: true
    exactH264HighProfileFrameColorDurationVerified: true
    firstH264IndependentQaArtifactPersisted: true
    firstH264QaAttemptInternalCostVerified: true
    firstH264MuxDependencySatisfied: true
    muxExecutionAuthorized: false
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    providerActivationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormCustomerDeliveryH264SeriesExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_SERIES_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_execution_service'
  status:
    'every_delivery_h264_chunk_and_independent_qa_completed_mux_authority_blocked'
  disposition: 'completed' | 'exact_replay'
  root: Omit<CompletedRootEvidence, 'queueAggregate'>
  h264Chunks: Array<Omit<CompletedH264Evidence, 'queueAggregate'>>
  independentQa: Array<Omit<CompletedH264QaEvidence, 'queueAggregate'>>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotAndOriginalReservationReopened: true
    passedPrivateReviewMasterQaLineageVerified: true
    deliveryChunkCount: number
    everyH264LeaseAndOneUseDispatchVerified: true
    everyH264PrivateCreateOnlyArtifactVerified: true
    everyH264AttemptInternalCostVerified: true
    everyIndependentQaLeaseAndOneUseDispatchVerified: true
    everyIndependentQaArtifactVerified: true
    everyIndependentQaAttemptInternalCostVerified: true
    allMuxDependenciesSatisfied: true
    muxExecutionAuthorized: false
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    providerActivationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export interface CanonicalProfessionalLongFormCustomerDeliveryMuxExecutionEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MUX_EXECUTION_VERSION
  source:
    'canonical_professional_long_form_customer_delivery_execution_service'
  status:
    'private_h264_aac_customer_delivery_master_completed_decoded_qa_and_download_blocked'
  disposition: 'completed' | 'exact_replay'
  prerequisiteSeriesDependencySetHash: string
  mux: Omit<CompletedDeliveryMuxEvidence, 'queueAggregate'>
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  readiness: {
    approvedSnapshotAndOriginalReservationReopened: true
    deliveryChunkCount: number
    everyH264AndIndependentQaCompletionReopened: true
    muxLeaseAndOneUseDispatchVerified: true
    muxHeartbeatAndBoundedLeaseVerified: true
    exactPinnedFfmpegRuntimeVerified: true
    orderedH264VideoStreamCopyVerified: true
    completeProgramVideoReencoded: false
    exactContinuousFlacEncodedToAacOnce: true
    aacBitrate: 192000
    aacSampleRate: 48000
    aacChannels: 2
    frontLoadedMp4InitializationVerified: true
    exactPrivateCreateOnlyMp4Persisted: true
    muxAttemptInternalCostVerified: true
    decodedVideoQaVerified: false
    decodedAudioQaVerified: false
    privateDownloadVerified: false
    secondExportEstimateCreated: false
    secondExportChargeCreated: false
    customerBillingAuthorized: false
    walletMutationAuthorized: false
    providerActivationAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    publicDeliveryAuthorized: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormCustomerDeliveryExecutionService(
  context: ServiceContext,
) {
  return {
    async executeRoot(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CompletedRootEvidence> {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      const current = await loadCurrent(context, input)
      const entry = current.queueAggregate.entries[0]
      if (!entry) throw invalid('Customer-delivery root queue entry is missing.')
      if (entry.state === 'completed') {
        return loadCompletedRoot({ context, current, ownerUserId })
      }
      if (entry.state === 'leased') {
        throw inProgress('Customer-delivery root already has an active lease.')
      }
      return executeRoot({ context, current, ownerUserId })
    },

    async executeFirstH264Chunk(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCustomerDeliveryExecutionEvidence> {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      let current = await loadCurrent(context, input)
      let newlyExecuted = false
      const rootEntry = current.queueAggregate.entries[0]
      if (!rootEntry) throw invalid('Customer-delivery root queue entry is missing.')
      const root = rootEntry.state === 'completed'
        ? await loadCompletedRoot({ context, current, ownerUserId })
        : await executeRoot({ context, current, ownerUserId })
      if (rootEntry.state !== 'completed') newlyExecuted = true

      current = await loadCurrent(context, input)
      const firstH264Entry = current.queueAggregate.entries[1]
      if (!firstH264Entry) {
        throw invalid('Customer-delivery first H.264 queue entry is missing.')
      }
      if (firstH264Entry.state === 'leased') {
        throw inProgress('Customer-delivery first H.264 chunk has an active lease.')
      }
      const runtimeAuthority = await requiredRemotionRuntimeAuthority()
      const h264 = firstH264Entry.state === 'completed'
        ? await loadCompletedH264({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
            chunkIndex: 1,
          })
        : await executeH264({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
            chunkIndex: 1,
          })
      if (firstH264Entry.state !== 'completed') newlyExecuted = true
      const aggregate = h264.queueAggregate
      if (
        aggregate.summary.completedJobCount !== 2 ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.queuedJobCount !== aggregate.summary.totalJobCount - 2 ||
        aggregate.entries[0]?.state !== 'completed' ||
        aggregate.entries[1]?.state !== 'completed' ||
        aggregate.entries.slice(2).some((entry) =>
          entry.state !== 'queued' || entry.deliveryAttemptCount !== 0 ||
          entry.professionalLongFormExecutionAuthorization ||
          entry.professionalLongFormExecutionAttempt || entry.completion)
      ) throw invalid(
        'Customer-delivery first H.264 completion changed the remaining blocked graph.',
      )
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_execution_service' as const,
        status:
          'delivery_root_and_first_h264_chunk_completed_independent_qa_blocked' as const,
        root: withoutAggregate(root),
        h264: withoutAggregate(h264),
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotAndOriginalReservationReopened: true as const,
          passedPrivateReviewMasterQaLineageVerified: true as const,
          rootLeaseAndOneUseDispatchVerified: true as const,
          rootAttemptInternalCostVerified: true as const,
          firstVp9ChunkReopenedAndChecksummed: true as const,
          firstH264LeaseAndOneUseDispatchVerified: true as const,
          exactPinnedRemotionRunnerVerified: true as const,
          h264HighCrf18MediumVideoOnlyExecutionVerified: true as const,
          privateH264CreateOnlyPersistenceVerified: true as const,
          h264AttemptInternalCostVerified: true as const,
          independentH264ChunkQaVerified: false as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          providerActivationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: newlyExecuted ? 'completed' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },

    async executeFirstH264ChunkQa(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCustomerDeliveryH264QaExecutionEvidence> {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      let current = await loadCurrent(context, input)
      let newlyExecuted = false
      if (current.queueAggregate.entries[1]?.state !== 'completed') {
        const prerequisite =
          await createCanonicalProfessionalLongFormCustomerDeliveryExecutionService(
            context,
          ).executeFirstH264Chunk(input)
        newlyExecuted = prerequisite.disposition === 'completed'
        current = await loadCurrent(context, input)
      }
      const firstH264Entry = current.queueAggregate.entries[1]
      const firstQaEntry = current.queueAggregate.entries[2]
      if (firstH264Entry?.state !== 'completed' || !firstQaEntry) {
        throw invalid(
          'Customer-delivery first H.264 QA requires the exact completed first H.264 chunk.',
        )
      }
      if (firstQaEntry.state === 'leased') {
        throw inProgress(
          'Customer-delivery first H.264 independent QA has an active lease.',
        )
      }
      const remotionRuntimeAuthority = await requiredRemotionRuntimeAuthority()
      const mediaRuntimeAuthority = await requiredMediaBinaryRuntimeAuthority()
      const root = await loadCompletedRoot({ context, current, ownerUserId })
      const h264 = await loadCompletedH264({
        context,
        current,
        ownerUserId,
        runtimeAuthority: remotionRuntimeAuthority,
        chunkIndex: 1,
        allowCompletedQa: firstQaEntry.state === 'completed',
      })
      const qa = firstQaEntry.state === 'completed'
        ? await loadCompletedH264Qa({
            context,
            current,
            ownerUserId,
            runtimeAuthority: mediaRuntimeAuthority,
            chunkIndex: 1,
          })
        : await executeH264Qa({
            context,
            current,
            ownerUserId,
            runtimeAuthority: mediaRuntimeAuthority,
            chunkIndex: 1,
          })
      if (firstQaEntry.state !== 'completed') newlyExecuted = true
      const aggregate = qa.queueAggregate
      if (
        aggregate.summary.completedJobCount !== 3 ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.queuedJobCount !== aggregate.summary.totalJobCount - 3 ||
        aggregate.entries.slice(0, 3).some((entry) =>
          entry.state !== 'completed' || entry.deliveryAttemptCount !== 1 ||
          !entry.professionalLongFormExecutionAuthorization ||
          !entry.professionalLongFormExecutionAttempt || !entry.completion) ||
        aggregate.entries.slice(3).some((entry) =>
          entry.state !== 'queued' || entry.deliveryAttemptCount !== 0 ||
          entry.professionalLongFormExecutionAuthorization ||
          entry.professionalLongFormExecutionAttempt || entry.completion)
      ) throw invalid(
        'Customer-delivery first H.264 QA completion changed the remaining blocked graph.',
      )
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_QA_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_execution_service' as const,
        status:
          'delivery_root_first_h264_and_independent_qa_completed_mux_blocked' as const,
        root: withoutAggregate(root),
        h264: withoutAggregate(h264),
        qa: withoutAggregate(qa),
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotAndOriginalReservationReopened: true as const,
          passedPrivateReviewMasterQaLineageVerified: true as const,
          rootLeaseAndOneUseDispatchVerified: true as const,
          firstH264LeaseAndOneUseDispatchVerified: true as const,
          exactPinnedRemotionRunnerVerified: true as const,
          privateH264CreateOnlyPersistenceVerified: true as const,
          firstH264IndependentProbeLeaseAndOneUseDispatchVerified: true as const,
          exactPinnedFfprobeRuntimeVerified: true as const,
          exactH264HighProfileFrameColorDurationVerified: true as const,
          firstH264IndependentQaArtifactPersisted: true as const,
          firstH264QaAttemptInternalCostVerified: true as const,
          firstH264MuxDependencySatisfied: true as const,
          muxExecutionAuthorized: false as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          providerActivationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: newlyExecuted ? 'completed' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },

    async executeAllH264ChunksAndIndependentQa(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCustomerDeliveryH264SeriesExecutionEvidence> {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      let current = await loadCurrent(context, input)
      let newlyExecuted = false
      const rootEntry = current.queueAggregate.entries[0]
      if (!rootEntry) {
        throw invalid('Customer-delivery root queue entry is missing.')
      }
      if (rootEntry.state === 'leased') {
        throw inProgress('Customer-delivery root already has an active lease.')
      }
      const root = rootEntry.state === 'completed'
        ? await loadCompletedRoot({ context, current, ownerUserId })
        : await executeRoot({ context, current, ownerUserId })
      if (rootEntry.state !== 'completed') newlyExecuted = true
      const remotionRuntimeAuthority = await requiredRemotionRuntimeAuthority()
      const mediaRuntimeAuthority = await requiredMediaBinaryRuntimeAuthority()
      const chunkCount = current.package.outputContract.chunkCount
      const h264Chunks: Array<Omit<CompletedH264Evidence, 'queueAggregate'>> = []
      const independentQa: Array<
        Omit<CompletedH264QaEvidence, 'queueAggregate'>
      > = []
      for (let chunkIndex = 1; chunkIndex <= chunkCount; chunkIndex += 1) {
        current = await loadCurrent(context, input)
        const h264Entry = current.queueAggregate.entries.find((entry) =>
          entry.definition.canonicalOrder === chunkIndex * 2 - 1)
        const qaEntryBeforeH264 = current.queueAggregate.entries.find((entry) =>
          entry.definition.canonicalOrder === chunkIndex * 2)
        if (!h264Entry || !qaEntryBeforeH264) {
          throw invalid(
            `Customer-delivery chunk ${chunkIndex} queue pair is missing.`,
          )
        }
        if (h264Entry.state === 'leased' || qaEntryBeforeH264.state === 'leased') {
          throw inProgress(
            `Customer-delivery chunk ${chunkIndex} has an active H.264 or QA lease.`,
          )
        }
        const h264 = h264Entry.state === 'completed'
          ? await loadCompletedH264({
              context,
              current,
              ownerUserId,
              runtimeAuthority: remotionRuntimeAuthority,
              chunkIndex,
              allowCompletedQa: qaEntryBeforeH264.state === 'completed',
            })
          : await executeH264({
              context,
              current,
              ownerUserId,
              runtimeAuthority: remotionRuntimeAuthority,
              chunkIndex,
            })
        if (h264Entry.state !== 'completed') newlyExecuted = true
        h264Chunks.push(withoutAggregate(h264))

        current = await loadCurrent(context, input)
        const qaEntry = current.queueAggregate.entries.find((entry) =>
          entry.definition.canonicalOrder === chunkIndex * 2)
        if (!qaEntry) {
          throw invalid(
            `Customer-delivery H.264 QA ${chunkIndex} queue entry is missing.`,
          )
        }
        if (qaEntry.state === 'leased') {
          throw inProgress(
            `Customer-delivery H.264 QA ${chunkIndex} has an active lease.`,
          )
        }
        const qa = qaEntry.state === 'completed'
          ? await loadCompletedH264Qa({
              context,
              current,
              ownerUserId,
              runtimeAuthority: mediaRuntimeAuthority,
              chunkIndex,
            })
          : await executeH264Qa({
              context,
              current,
              ownerUserId,
              runtimeAuthority: mediaRuntimeAuthority,
              chunkIndex,
            })
        if (qaEntry.state !== 'completed') newlyExecuted = true
        independentQa.push(withoutAggregate(qa))
      }

      current = await loadCurrent(context, input)
      const aggregate = current.queueAggregate
      const expectedCompletedJobCount = chunkCount * 2 + 1
      const muxEntry = aggregate.entries[expectedCompletedJobCount]
      if (
        aggregate.summary.completedJobCount !== expectedCompletedJobCount ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.summary.queuedJobCount !== 4 ||
        aggregate.entries.slice(0, expectedCompletedJobCount).some((entry) =>
          entry.state !== 'completed' || entry.deliveryAttemptCount !== 1 ||
          !entry.professionalLongFormExecutionAuthorization ||
          !entry.professionalLongFormExecutionAttempt || !entry.completion) ||
        aggregate.entries.slice(expectedCompletedJobCount).some((entry) =>
          entry.state !== 'queued' || entry.deliveryAttemptCount !== 0 ||
          entry.professionalLongFormExecutionAuthorization ||
          entry.professionalLongFormExecutionAttempt || entry.completion) ||
        !muxEntry ||
        muxEntry.definition.dependencyJobIds.length !== chunkCount ||
        muxEntry.definition.dependencyJobIds.some((dependencyJobId) =>
          aggregate.entries.find((entry) =>
            entry.definition.jobId === dependencyJobId)?.state !== 'completed')
      ) throw invalid(
        'Customer-delivery H.264 series did not leave exactly every chunk QA-complete and the mux dependency-ready but unauthorized.',
      )
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_H264_SERIES_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_execution_service' as const,
        status:
          'every_delivery_h264_chunk_and_independent_qa_completed_mux_authority_blocked' as const,
        root: withoutAggregate(root),
        h264Chunks,
        independentQa,
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotAndOriginalReservationReopened: true as const,
          passedPrivateReviewMasterQaLineageVerified: true as const,
          deliveryChunkCount: chunkCount,
          everyH264LeaseAndOneUseDispatchVerified: true as const,
          everyH264PrivateCreateOnlyArtifactVerified: true as const,
          everyH264AttemptInternalCostVerified: true as const,
          everyIndependentQaLeaseAndOneUseDispatchVerified: true as const,
          everyIndependentQaArtifactVerified: true as const,
          everyIndependentQaAttemptInternalCostVerified: true as const,
          allMuxDependenciesSatisfied: true as const,
          muxExecutionAuthorized: false as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          providerActivationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: newlyExecuted ? 'completed' : 'exact_replay',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },

    async executePrivateH264AacMasterMux(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormCustomerDeliveryMuxExecutionEvidence> {
      assertExactInput(input)
      const ownerUserId = requireOwner(context)
      let current = await loadCurrent(context, input)
      let entry = deliveryMuxEntry(current)
      if (entry.state === 'leased') {
        throw inProgress('Customer-delivery master mux already has an active lease.')
      }
      if (entry.state !== 'completed') {
        await createCanonicalProfessionalLongFormCustomerDeliveryExecutionService(
          context,
        ).executeAllH264ChunksAndIndependentQa(input)
        current = await loadCurrent(context, input)
        entry = deliveryMuxEntry(current)
        if (entry.state === 'leased') {
          throw inProgress(
            'Customer-delivery master mux already has an active lease.',
          )
        }
      }
      const replayingCompletedMux = entry.state === 'completed'
      const runtimeAuthority = await requiredCustomerDeliveryMuxRuntimeAuthority()
      const dependencies = await loadDeliveryMuxDependencies({
        context,
        current,
      })
      const mux = entry.state === 'completed'
        ? await loadCompletedDeliveryMux({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
            dependencies,
          })
        : await executeDeliveryMux({
            context,
            current,
            ownerUserId,
            runtimeAuthority,
            dependencies,
          })
      const aggregate = mux.queueAggregate
      const chunkCount = current.package.outputContract.chunkCount
      const expectedCompletedJobCount = chunkCount * 2 + 2
      if (
        aggregate.summary.completedJobCount !== expectedCompletedJobCount ||
        aggregate.summary.queuedJobCount !== 3 ||
        aggregate.summary.leasedJobCount !== 0 ||
        aggregate.entries.slice(0, expectedCompletedJobCount).some((candidate) =>
          candidate.state !== 'completed' ||
          candidate.deliveryAttemptCount !== 1 ||
          !candidate.professionalLongFormExecutionAuthorization ||
          !candidate.professionalLongFormExecutionAttempt ||
          !candidate.completion) ||
        aggregate.entries.slice(expectedCompletedJobCount).some((candidate) =>
          candidate.state !== 'queued' || candidate.deliveryAttemptCount !== 0 ||
          candidate.professionalLongFormExecutionAuthorization ||
          candidate.professionalLongFormExecutionAttempt || candidate.completion)
      ) throw invalid(
        'Customer-delivery mux did not leave exactly decoded video QA, decoded audio QA, and private download separately gated.',
      )
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MUX_EXECUTION_VERSION,
        source:
          'canonical_professional_long_form_customer_delivery_execution_service' as const,
        status:
          'private_h264_aac_customer_delivery_master_completed_decoded_qa_and_download_blocked' as const,
        prerequisiteSeriesDependencySetHash:
          mux.authority.lineage.dependencySetHash,
        mux: withoutAggregate(mux),
        queueAggregate: aggregate,
        readiness: {
          approvedSnapshotAndOriginalReservationReopened: true as const,
          deliveryChunkCount: chunkCount,
          everyH264AndIndependentQaCompletionReopened: true as const,
          muxLeaseAndOneUseDispatchVerified: true as const,
          muxHeartbeatAndBoundedLeaseVerified: true as const,
          exactPinnedFfmpegRuntimeVerified: true as const,
          orderedH264VideoStreamCopyVerified: true as const,
          completeProgramVideoReencoded: false as const,
          exactContinuousFlacEncodedToAacOnce: true as const,
          aacBitrate: 192_000 as const,
          aacSampleRate: 48_000 as const,
          aacChannels: 2 as const,
          frontLoadedMp4InitializationVerified: true as const,
          exactPrivateCreateOnlyMp4Persisted: true as const,
          muxAttemptInternalCostVerified: true as const,
          decodedVideoQaVerified: false as const,
          decodedAudioQaVerified: false as const,
          privateDownloadVerified: false as const,
          secondExportEstimateCreated: false as const,
          secondExportChargeCreated: false as const,
          customerBillingAuthorized: false as const,
          walletMutationAuthorized: false as const,
          providerActivationAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          publicDeliveryAuthorized: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        disposition: replayingCompletedMux
          ? 'exact_replay'
          : 'completed',
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

async function executeRoot(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
}): Promise<CompletedRootEvidence> {
  const authority = buildProfessionalLongFormDeliveryRootAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) => assertProfessionalLongFormDeliveryRootAuthority({
      value,
      ownerUserId: input.ownerUserId,
      current: input.current,
    }),
  })
  const authorization = buildProfessionalLongFormDeliveryRootAuthorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity: 'canonical-professional-long-form-delivery-root-v1',
    workerType: 'api_service',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Customer-delivery root claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormDeliveryRootAttemptSchema.parse(
    begun.executionAttempt,
  )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    ...costIdentity(input.context, authority, executionAttempt),
    toolId: 'reeditpro_internal',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
  })
  let costFinalized = false
  try {
    const now = new Date().toISOString()
    const validationArtifact =
      buildProfessionalLongFormDeliveryRootValidationArtifact({
        authority,
        executionAttempt,
        validatedAt: now,
      })
    const validationArtifactRef = await persistExactJson({
      context: input.context,
      value: validationArtifact,
      parse: (value) =>
        professionalLongFormDeliveryRootValidationArtifactSchema.parse(value),
    })
    const qaEvidence = buildProfessionalLongFormDeliveryRootQaEvidence({
      authority,
      executionAttempt,
      validationArtifactRef,
      validationArtifactHash: validationArtifact.artifactHash,
      evaluatedAt: new Date().toISOString(),
    })
    const qaEvidenceRef = await persistExactJson({
      context: input.context,
      value: qaEvidence,
      parse: (value) =>
        professionalLongFormDeliveryRootQaEvidenceSchema.parse(value),
    })
    const leasedCurrent = {
      ...input.current,
      queueAggregate: begun.aggregate,
    }
    const reconciliation =
      buildProfessionalLongFormDeliveryRootReconciliation({
        current: leasedCurrent,
        authority,
        executionAttempt,
        validationArtifactRef,
        qaEvidenceRef,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryRootReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormDeliveryRootResultHash({
      authority,
      executionAttempt,
      validationArtifactRef,
      qaEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: validationArtifactRef.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      canonicalResultHash,
      toolId: 'reeditpro_internal',
      operationId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
      vcpuCount: 1,
      memoryGib: 1,
    })
    const terminal = buildProfessionalLongFormDeliveryRootTerminal({
      authority,
      executionAttempt,
      validationArtifactRef,
      qaEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryRootTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryRootCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef,
      qaEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: authority.identity.expectedOutputIdentity,
        contentType: 'application/json',
        sha256: validationArtifactRef.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      validationArtifact,
      validationArtifactRef,
      qaEvidence,
      qaEvidenceRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      })
    }
    throw error
  }
}

async function executeH264(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineRemotionRuntimeAuthority
  chunkIndex: number
}): Promise<CompletedH264Evidence> {
  const authority = buildProfessionalLongFormDeliveryH264Authority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) => assertProfessionalLongFormDeliveryH264Authority({
      value,
      ownerUserId: input.ownerUserId,
      current: input.current,
      chunkIndex: input.chunkIndex,
      runtimeAuthority: input.runtimeAuthority,
    }),
  })
  const authorization = buildProfessionalLongFormDeliveryH264Authorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity: 'canonical-professional-long-form-delivery-h264-v1',
    workerType: 'render_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Customer-delivery H.264 claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormDeliveryH264AttemptSchema.parse(
    begun.executionAttempt,
  )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    ...costIdentity(input.context, authority, executionAttempt),
    toolId: 'remotion',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
  })
  const heartbeat = startLeaseHeartbeat({
    current: input.current,
    authority,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
  })
  let costFinalized = false
  try {
    const source = await inspectCanonicalPrivateObjectChunkMediaArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash:
        authority.approvedChunk.sourceVp9Artifact.objectIdentity,
    })
    if (
      !source || source.mediaFormat !== 'mkv' ||
      source.byteLength !== authority.approvedChunk.sourceVp9Artifact.byteLength ||
      source.sha256 !== authority.approvedChunk.sourceVp9Artifact.sha256
    ) throw invalid(
      'Customer-delivery H.264 runner could not reopen the exact passed VP9 chunk.',
    )
    const request = buildOfflineRemotionDeliveryH264ChunkRequest({
      planningPayload: {
        recipeProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
        compositionProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
        longFormCapacityProfileId:
          PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
        chunkId: authority.approvedChunk.chunkId,
        chunkAuthorityHash: authority.approvedChunk.chunkAuthorityHash,
        sourceVp9ObjectIdentity:
          authority.approvedChunk.sourceVp9Artifact.objectIdentity,
        expectedOutputIdentity:
          authority.approvedChunk.expectedH264ObjectIdentity,
        chunkIndex: authority.approvedChunk.chunkIndex,
        chunkCount: authority.approvedChunk.chunkCount,
        width: authority.approvedChunk.width,
        height: authority.approvedChunk.height,
        fps: 30,
        durationFrames: authority.approvedChunk.durationFrames,
        globalStartFrame: authority.approvedChunk.globalStartFrame,
        globalEndFrameExclusive:
          authority.approvedChunk.globalEndFrameExclusive,
        sourceVideoPolicy: 'exact_passed_vp9_object_chunk_v2',
        transcodePolicy: 'h264_high_crf18_medium_frame_preserving_v1',
        outputContainer: 'mp4',
        outputVideoCodec: 'h264',
        outputVideoProfile: 'high',
        outputCrf: 18,
        outputPreset: 'medium',
        outputPixelFormat: 'yuv420p',
        outputColorRange: 'tv',
        outputColorSpace: 'bt709',
        outputColorTransfer: 'bt709',
        outputColorPrimaries: 'bt709',
        outputAudioPolicy: 'video_only_no_audio',
        renderPurpose: 'private_4k_customer_delivery_video_chunk_v1',
        deliveryProfileId: 'uhd_2160',
        estimateCostBasisProfileId: 'uhd_2160',
        sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
        usesApprovedEditReservation: true,
        requiresSeparateExportEstimate: false,
        allowsAdditionalExportCharge: false,
      },
      source: {
        inputId: `delivery-vp9-chunk-${authority.approvedChunk.chunkIndex}`,
        mimeType: 'video/x-matroska',
        byteLength: source.byteLength,
        sha256: source.sha256,
      },
    })
    const runtime = await openPrivateOfflineRemotionRenderRuntime()
    const result = await runtime.executeDeliveryH264ChunkServerInjected(
      request,
      [{
        inputMode: 'private_verified_stream_v1',
        inputId: request.inputs.source.inputId,
        mimeType: request.inputs.source.mimeType,
        byteLength: source.byteLength,
        sha256: source.sha256,
        openStream: source.openStream,
      }],
      {
        maximumBytes:
          OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
        async persist(output) {
          if (output.mimeType !== 'video/mp4') {
            throw invalid('Customer-delivery H.264 runner returned non-MP4 media.')
          }
          const persisted =
            await persistCanonicalPrivateRemotionDeliveryH264ChunkArtifactStream({
              localStorageRoot: input.context.env.localStorageRoot,
              privateObjectIdentityHash:
                authority.approvedChunk.expectedH264ObjectIdentity,
              stream: output.stream,
              expectedByteLength: output.expectedByteLength,
              expectedSha256: output.expectedSha256,
            })
          return {
            byteLength: persisted.byteLength,
            sha256: persisted.sha256,
          }
        },
      },
    )
    await heartbeat.stopAndAssertHealthy()
    assertH264RuntimeResult({ authority, result })
    const stored =
      await inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact({
        localStorageRoot: input.context.env.localStorageRoot,
        privateObjectIdentityHash:
          authority.approvedChunk.expectedH264ObjectIdentity,
      })
    if (
      !stored || stored.byteLength !== result.artifact.byteLength ||
      stored.sha256 !== result.artifact.sha256
    ) throw invalid('Customer-delivery H.264 artifact changed after persistence.')
    const outputArtifact: ProfessionalLongFormDeliveryH264ArtifactRef = {
      objectIdentity: authority.approvedChunk.expectedH264ObjectIdentity,
      mediaFormat: 'mp4',
      contentType: 'video/mp4',
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      objectVersion: 1,
      assetRole: 'processed',
      sourceChunkId: authority.approvedChunk.chunkId,
      chunkIndex: authority.approvedChunk.chunkIndex,
      chunkCount: authority.approvedChunk.chunkCount,
      globalStartFrame: authority.approvedChunk.globalStartFrame,
      globalEndFrameExclusive: authority.approvedChunk.globalEndFrameExclusive,
      durationFrames: authority.approvedChunk.durationFrames,
      width: authority.approvedChunk.width,
      height: authority.approvedChunk.height,
      fps: 30,
      videoCodec: 'h264',
      videoProfile: 'high',
      encoderCrf: 18,
      encoderPreset: 'medium',
      pixelFormat: 'yuv420p',
      colorRange: 'tv',
      colorSpace: 'bt709',
      colorTransfer: 'bt709',
      colorPrimaries: 'bt709',
      audioStreamCount: 0,
      privateLocalCreateOnly: true,
      databaseBacked: false,
      publicDeliveryAuthorized: false,
    }
    const runtimeEvidence =
      buildProfessionalLongFormDeliveryH264RuntimeEvidence({
        authority,
        executionAttempt,
        outputArtifact,
        result,
      })
    const runtimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeEvidence,
      parse: (value) =>
        professionalLongFormDeliveryH264RuntimeEvidenceSchema.parse(value),
    })
    const leasedCurrent = {
      ...input.current,
      queueAggregate: begun.aggregate,
    }
    const reconciliation =
      buildProfessionalLongFormDeliveryH264Reconciliation({
        current: leasedCurrent,
        authority,
        executionAttempt,
        outputArtifact,
        runtimeEvidenceRef,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryH264ReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormDeliveryH264ResultHash({
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: outputArtifact.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      canonicalResultHash,
      toolId: 'remotion',
      operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
      vcpuCount: 4,
      memoryGib: 8,
    })
    const terminal = buildProfessionalLongFormDeliveryH264Terminal({
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryH264TerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryH264Completion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: outputArtifact.objectIdentity,
        contentType: outputArtifact.contentType,
        sha256: outputArtifact.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidence,
      runtimeEvidenceRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    await heartbeat.stopIgnoringFailure()
    if (!costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      })
    }
    throw error
  }
}

async function executeH264Qa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  chunkIndex: number
}): Promise<CompletedH264QaEvidence> {
  const authority = buildProfessionalLongFormDeliveryH264QaAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) => assertProfessionalLongFormDeliveryH264QaAuthority({
      value,
      ownerUserId: input.ownerUserId,
      current: input.current,
      chunkIndex: input.chunkIndex,
      runtimeAuthority: input.runtimeAuthority,
    }),
  })
  const authorization = buildProfessionalLongFormDeliveryH264QaAuthorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity:
      'canonical-professional-long-form-delivery-h264-qa-v1',
    workerType: 'qa_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(
      `Customer-delivery H.264 QA claim remained ${claim.disposition}.`,
    )
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormDeliveryH264QaAttemptSchema.parse(
    begun.executionAttempt,
  )
  const costMeter = await beginPrivateInternalAttemptCostEvidence({
    ...costIdentity(input.context, authority, executionAttempt),
    toolId: 'ffprobe',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
  })
  const heartbeat = startH264QaLeaseHeartbeat({
    current: input.current,
    authority,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
  })
  let costFinalized = false
  try {
    const stored =
      await inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact({
        localStorageRoot: input.context.env.localStorageRoot,
        privateObjectIdentityHash: authority.h264Artifact.objectIdentity,
      })
    if (
      !stored ||
      stored.byteLength !== authority.h264Artifact.byteLength ||
      stored.sha256 !== authority.h264Artifact.sha256
    ) throw invalid(
      'Customer-delivery H.264 QA could not reopen the exact completed H.264 artifact.',
    )
    const request = validateOfflineFfprobeStreamingExecutionRequest({
      schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
      toolId: 'ffprobe',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      payload: {
        inspectionProfileId:
          PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_INSPECTION_PROFILE_ID,
        countFrames: true,
        verifyDurationAndSync: true,
        emitMachineJsonOnly: true,
        mimeType: 'video/mp4',
        sourceByteLength: stored.byteLength,
        sourceSha256: stored.sha256,
        sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
      },
    })
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    const result = await runtime.executeServerInjected(request, {
      inputMode: 'private_verified_stream_v1',
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      openStream: stored.openStream,
    })
    await heartbeat.stopAndAssertHealthy()
    const rawProbeResultRef = await persistExactJson({
      context: input.context,
      value: result.resultJson.document,
      parse: (value) => value as Readonly<Record<string, unknown>>,
    })
    const runtimeReceipt =
      professionalLongFormDeliveryH264QaRuntimeReceipt(result)
    const probeRuntimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeReceipt,
      parse: (value) => value as typeof runtimeReceipt,
    })
    const artifact = buildProfessionalLongFormDeliveryH264QaArtifact({
      authority,
      authorization,
      executionAttempt,
      rawProbeResultRef,
      probeRuntimeEvidenceRef,
      result,
      evaluatedAt: new Date().toISOString(),
    })
    const artifactRef = await persistExactJson({
      context: input.context,
      value: artifact,
      parse: (value) =>
        professionalLongFormDeliveryH264QaArtifactSchema.parse(value),
    })
    const leasedCurrent = {
      ...input.current,
      queueAggregate: begun.aggregate,
    }
    const reconciliation =
      buildProfessionalLongFormDeliveryH264QaReconciliation({
        current: leasedCurrent,
        authority,
        authorization,
        executionAttempt,
        qaArtifactRef: artifactRef,
        reconciledAt: new Date().toISOString(),
      })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryH264QaReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormDeliveryH264QaResultHash({
      authority,
      executionAttempt,
      qaArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: artifactRef.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      canonicalResultHash,
      toolId: 'ffprobe',
      operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
      vcpuCount: 2,
      memoryGib: 4,
    })
    const terminal = buildProfessionalLongFormDeliveryH264QaTerminal({
      authority,
      authorization,
      executionAttempt,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryH264QaTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryH264QaCompletion({
      authority,
      authorization,
      executionAttempt,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      validationArtifactRef: artifactRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: authority.identity.expectedOutputIdentity,
        contentType: 'application/json',
        sha256: artifactRef.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      artifact,
      artifactRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    await heartbeat.stopIgnoringFailure()
    if (!costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      })
    }
    throw error
  }
}

async function executeDeliveryMux(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  dependencies: ProfessionalLongFormDeliveryMuxDependencyEvidence
}): Promise<CompletedDeliveryMuxEvidence> {
  const authority = buildProfessionalLongFormDeliveryMuxAuthority(input)
  assertUnexpired(authority.approval.reservationExpiresAt)
  const authorityRef = await persistAuthority({
    context: input.context,
    authority,
    verify: (value) => assertProfessionalLongFormDeliveryMuxAuthority({
      value,
      ownerUserId: input.ownerUserId,
      current: input.current,
      dependencies: input.dependencies,
      runtimeAuthority: input.runtimeAuthority,
    }),
  })
  const authorization = buildProfessionalLongFormDeliveryMuxAuthorization({
    authority,
    authorityRef,
  })
  await authorizePrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    authorization,
    executionAuthority: authority,
    now: new Date().toISOString(),
  })
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    workerIdentity: 'canonical-professional-long-form-delivery-mux-v1',
    workerType: 'render_worker',
    now: new Date().toISOString(),
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
  })
  if (claim.disposition !== 'claimed') {
    throw inProgress(`Customer-delivery mux claim remained ${claim.disposition}.`)
  }
  const begun = await beginPrivateCanonicalPackageWorkQueueExecutionAttempt({
    scope: input.current.scope,
    definition: input.current.queueDefinition,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    now: new Date().toISOString(),
  })
  const executionAttempt = professionalLongFormDeliveryMuxAttemptSchema.parse(
    begun.executionAttempt,
  )
  const heartbeat = startDeliveryMuxHeartbeat({
    current: input.current,
    jobId: authority.identity.jobId,
    claimId: claim.entry.activeClaim.claimId,
    claimCredential: claim.claimCredential,
    leaseDurationMs: authority.operation.leaseDurationMilliseconds,
    intervalMs: authority.operation.heartbeatIntervalMilliseconds,
  })
  await heartbeat.tick()
  const heartbeatCurrent = await loadCurrent(input.context, {
    workspaceId: authority.identity.workspaceId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
  })
  const heartbeatClaim = deliveryMuxEntry(heartbeatCurrent).activeClaim
  if (
    !heartbeatClaim || heartbeatClaim.claimId !== executionAttempt.claimId ||
    heartbeatClaim.deliveryAttempt !== 1 || heartbeatClaim.heartbeatCount < 1 ||
    heartbeatClaim.claimHash === executionAttempt.claimHash
  ) throw invalid('Customer-delivery mux heartbeat was not durably observed.')
  const queueLeaseEvidence = {
    claimId: heartbeatClaim.claimId,
    deliveryAttempt: 1 as const,
    initialClaimHash: executionAttempt.claimHash,
    heartbeatClaimHash: heartbeatClaim.claimHash,
    heartbeatCount: heartbeatClaim.heartbeatCount,
    heartbeatAt: heartbeatClaim.heartbeatAt,
    expiresAt: heartbeatClaim.expiresAt,
    attemptDeadlineAt: heartbeatClaim.attemptDeadlineAt,
    boundedLeaseRenewalObserved: true as const,
  }
  let costMeter: Awaited<ReturnType<
    typeof beginPrivateInternalAttemptCostEvidence
  >> | undefined
  let costFinalized = false
  let heartbeatStopped = false
  try {
    costMeter = await beginPrivateInternalAttemptCostEvidence({
      ...costIdentity(input.context, authority, executionAttempt),
      toolId: 'ffmpeg',
      operationId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
    })
    const inspected = await inspectApprovedDeliveryMuxInputs({
      context: input.context,
      authority,
    })
    const request = buildDeliveryMuxRuntimeRequest({ authority, inspected })
    const runtime = await openPrivateOfflineMediaBinaryRuntime()
    let sinkReplayed = false
    const result = await runtime.executeCustomerDeliveryMuxServerInjected(
      request,
      {
        chunks: authority.approvedMuxPlan.chunks.map((chunk) => {
          const stored = inspected.chunks.get(chunk.chunkIndex)!
          return {
            inputMode: 'private_verified_stream_v1' as const,
            byteLength: stored.byteLength,
            sha256: stored.sha256,
            openStream: stored.openStream,
          }
        }),
        programAudio: {
          inputMode: 'private_verified_stream_v1' as const,
          byteLength: inspected.programAudio.byteLength,
          sha256: inspected.programAudio.sha256,
          openStream: inspected.programAudio.openStream,
        },
      },
      {
        maximumBytes:
          OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_MAXIMUM_OUTPUT_BYTES,
        async persist(value) {
          if (value.mimeType !== 'video/mp4') {
            throw invalid('Customer-delivery mux returned an unsupported format.')
          }
          const persisted =
            await persistCanonicalPrivateCustomerDeliveryArtifactStream({
              localStorageRoot: input.context.env.localStorageRoot,
              privateObjectIdentityHash:
                authority.approvedMuxPlan.privateObjectIdentityHash,
              stream: value.stream,
              expectedByteLength: value.expectedByteLength,
              expectedSha256: value.expectedSha256,
            })
          sinkReplayed = persisted.replayed
          return {
            byteLength: persisted.byteLength,
            sha256: persisted.sha256,
          }
        },
      },
    )
    if (sinkReplayed) {
      throw invalid(
        'An orphan customer-delivery MP4 cannot grant execution authority.',
      )
    }
    const requestHash = offlineMediaBinaryCustomerDeliveryMuxRequestSha256(
      request,
    )
    assertDeliveryMuxRuntimeResult({ authority, requestHash, result })
    const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash:
        authority.approvedMuxPlan.privateObjectIdentityHash,
    })
    if (
      !stored || stored.mediaFormat !== 'mp4' ||
      stored.byteLength !== result.resultArtifact.byteLength ||
      stored.sha256 !== result.resultArtifact.sha256
    ) throw invalid(
      'Customer-delivery MP4 changed after create-only persistence.',
    )
    const outputArtifact = buildProfessionalLongFormDeliveryMuxArtifactRef({
      authority,
      byteLength: stored.byteLength,
      sha256: stored.sha256,
    })
    const outputProbe = requiredRecord(
      result.evidence.semanticEvidence.outputProbe,
      'Customer-delivery mux output probe is missing.',
    )
    const outputProbeRef = await persistExactJson({
      context: input.context,
      value: outputProbe,
      parse: (value) => requiredRecord(
        value,
        'Persisted customer-delivery mux output probe is invalid.',
      ),
    })
    const frontLoadedInitialization = requiredRecord(
      result.evidence.semanticEvidence.frontLoadedInitialization,
      'Customer-delivery front-loaded initialization evidence is missing.',
    )
    const frontLoadedInitializationRef = await persistExactJson({
      context: input.context,
      value: frontLoadedInitialization,
      parse: (value) => requiredRecord(
        value,
        'Persisted customer-delivery initialization evidence is invalid.',
      ),
    })
    const runtimeEvidence = buildProfessionalLongFormDeliveryMuxRuntimeEvidence({
      authority,
      authorization,
      executionAttempt,
      queueLeaseEvidence,
      requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
      chunkSha256s: [...result.evidence.chunkSha256s],
      programAudioSha256: result.evidence.programAudioSha256,
      outputArtifact,
      outputProbeRef,
      outputProbeHash: sha256AuthorityValue(outputProbe),
      frontLoadedInitializationRef,
      frontLoadedInitializationHash:
        sha256AuthorityValue(frontLoadedInitialization),
      confinementEvidenceHash:
        sha256AuthorityValue(result.evidence.confinement),
      imageIdentityHash: result.image.imageIdentityHash,
      attestationRecordId: result.attestation.recordId,
      attestationHash: result.attestation.attestationHash,
      completedAt: result.attestation.completedAt,
    })
    const runtimeEvidenceRef = await persistExactJson({
      context: input.context,
      value: runtimeEvidence,
      parse: (value) =>
        professionalLongFormDeliveryMuxRuntimeEvidenceSchema.parse(value),
    })
    const latestLeased = await loadCurrent(input.context, {
      workspaceId: authority.identity.workspaceId,
      approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    })
    const reconciliation = buildProfessionalLongFormDeliveryMuxReconciliation({
      current: latestLeased,
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciledAt: new Date().toISOString(),
    })
    const reconciliationRef = await persistExactJson({
      context: input.context,
      value: reconciliation,
      parse: (value) =>
        professionalLongFormDeliveryMuxReconciliationSchema.parse(value),
    })
    const canonicalResultHash = professionalLongFormDeliveryMuxResultHash({
      authority,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
    })
    const finalizedCost = await costMeter.finalize({
      status: 'completed',
      failureCategory: 'none',
      outputByteLength: outputArtifact.byteLength,
      linkedCanonicalOutcomeHash: canonicalResultHash,
    })
    costFinalized = true
    assertCostEvidence({
      evidence: finalizedCost.evidence,
      authority,
      executionAttempt,
      canonicalResultHash,
      toolId: 'ffmpeg',
      operationId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
      workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
      vcpuCount: 4,
      memoryGib: 8,
    })
    await heartbeat.stop()
    heartbeatStopped = true
    const terminal = buildProfessionalLongFormDeliveryMuxTerminal({
      authority,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
      completedAt: new Date().toISOString(),
    })
    const terminalRef = await persistExactJson({
      context: input.context,
      value: terminal,
      parse: (value) =>
        professionalLongFormDeliveryMuxTerminalSchema.parse(value),
    })
    const completion = buildProfessionalLongFormDeliveryMuxCompletion({
      authority,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidenceRef,
      reconciliationEvidenceRef: reconciliationRef,
      terminalEvidenceRef: terminalRef,
      canonicalResultHash,
      attemptInternalCostEvidenceHash: finalizedCost.evidence.evidenceHash,
    })
    const definition = claim.entry.definition
    const aggregate = await completePrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: authority.identity.jobId,
      claimId: claim.entry.activeClaim.claimId,
      claimCredential: claim.claimCredential,
      outcome: {
        jobId: definition.jobId,
        approvedWorkItemId: definition.approvedWorkItemId,
        workItemKey: definition.workItemKey,
        required: definition.required,
        dependencyJobIds: [...definition.dependencyJobIds],
        status: 'completed_private_test',
        artifactId: outputArtifact.objectIdentity,
        contentType: outputArtifact.contentType,
        sha256: outputArtifact.sha256,
        adapterReplayed: false,
        blockedDependencyJobIds: [],
        professionalLongFormExecution: completion,
      },
      now: new Date().toISOString(),
    })
    return {
      authority,
      authorityRef,
      authorization,
      executionAttempt,
      outputArtifact,
      runtimeEvidence,
      runtimeEvidenceRef,
      reconciliation,
      reconciliationRef,
      costEvidence: finalizedCost.evidence,
      terminal,
      terminalRef,
      queueAggregate: aggregate,
    }
  } catch (error) {
    if (!heartbeatStopped) await heartbeat.stop().catch(() => undefined)
    if (costMeter && !costFinalized) {
      await costMeter.finalize({
        status: 'failed',
        failureCategory: classifyPrivateInternalAttemptCostFailure(error),
        outputByteLength: null,
        linkedCanonicalOutcomeHash: null,
      }).catch(() => undefined)
    }
    throw error
  }
}

async function loadCompletedDeliveryMux(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  dependencies: ProfessionalLongFormDeliveryMuxDependencyEvidence
}): Promise<CompletedDeliveryMuxEvidence> {
  const authority = buildProfessionalLongFormDeliveryMuxAuthority(input)
  const entry = deliveryMuxEntry(input.current)
  if (!entry.completion) {
    throw invalid('Completed customer-delivery mux entry is missing.')
  }
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryMuxAuthority({
    value: persisted,
    ownerUserId: input.ownerUserId,
    current: input.current,
    dependencies: input.dependencies,
    runtimeAuthority: input.runtimeAuthority,
  })
  const authorization = buildProfessionalLongFormDeliveryMuxAuthorization({
    authority,
    authorityRef,
  })
  assertExact(
    entry.professionalLongFormExecutionAuthorization,
    authorization,
    'Stored customer-delivery mux authorization changed.',
  )
  const executionAttempt = professionalLongFormDeliveryMuxAttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormDeliveryMuxCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const inspected = await inspectApprovedDeliveryMuxInputs({
    context: input.context,
    authority,
  })
  const stored = await inspectCanonicalPrivateCustomerDeliveryArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: completion.outputArtifact.objectIdentity,
  })
  if (
    !stored || stored.mediaFormat !== 'mp4' ||
    stored.byteLength !== completion.outputArtifact.byteLength ||
    stored.sha256 !== completion.outputArtifact.sha256 ||
    entry.completion.outcome.sha256 !== completion.outputArtifact.sha256
  ) throw invalid('Stored customer-delivery MP4 changed.')
  const runtimeEvidence = await readParsedJson({
    context: input.context,
    ref: completion.runtimeEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryMuxRuntimeEvidenceSchema.parse(value),
  })
  assertHashed(runtimeEvidence, 'evidenceHash')
  const outputProbe = await readParsedJson({
    context: input.context,
    ref: runtimeEvidence.outputProbeRef,
    parse: (value) => requiredRecord(
      value,
      'Stored customer-delivery output probe is invalid.',
    ),
  })
  const frontLoadedInitialization = await readParsedJson({
    context: input.context,
    ref: runtimeEvidence.frontLoadedInitializationRef,
    parse: (value) => requiredRecord(
      value,
      'Stored customer-delivery initialization evidence is invalid.',
    ),
  })
  const request = buildDeliveryMuxRuntimeRequest({ authority, inspected })
  const expectedRuntime = buildProfessionalLongFormDeliveryMuxRuntimeEvidence({
    authority,
    authorization,
    executionAttempt,
    queueLeaseEvidence: runtimeEvidence.queueLeaseEvidence,
    requestEnvelopeSha256:
      offlineMediaBinaryCustomerDeliveryMuxRequestSha256(request),
    chunkSha256s: authority.approvedMuxPlan.chunks.map((chunk) =>
      chunk.artifact.sha256),
    programAudioSha256: authority.approvedMuxPlan.programAudio.artifact.sha256,
    outputArtifact: completion.outputArtifact,
    outputProbeRef: runtimeEvidence.outputProbeRef,
    outputProbeHash: sha256AuthorityValue(outputProbe),
    frontLoadedInitializationRef:
      runtimeEvidence.frontLoadedInitializationRef,
    frontLoadedInitializationHash:
      sha256AuthorityValue(frontLoadedInitialization),
    confinementEvidenceHash: runtimeEvidence.confinementEvidenceHash,
    imageIdentityHash: authority.lineage.mediaBinaryImageIdentityHash,
    attestationRecordId: runtimeEvidence.runtime.attestationRecordId,
    attestationHash: runtimeEvidence.runtime.attestationHash,
    completedAt: runtimeEvidence.completedAt,
  })
  assertExact(
    runtimeEvidence,
    expectedRuntime,
    'Stored customer-delivery mux runtime evidence changed.',
  )
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryMuxReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormDeliveryMuxReconciliation({
      current: input.current,
      authority,
      executionAttempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedMux: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Stored customer-delivery mux reconciliation changed.',
  )
  const canonicalResultHash = professionalLongFormDeliveryMuxResultHash({
    authority,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'ffmpeg',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_MUX_COST_PROFILE_ID,
    vcpuCount: 4,
    memoryGib: 8,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryMuxTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryMuxTerminal({
    authority,
    authorization,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(
    terminal,
    expectedTerminal,
    'Stored customer-delivery mux terminal changed.',
  )
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1 ||
    entry.completion.outcome.artifactId !==
      completion.outputArtifact.objectIdentity
  ) throw invalid('Stored customer-delivery mux queue completion changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidence,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadCompletedRoot(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
}): Promise<CompletedRootEvidence> {
  const authority = buildProfessionalLongFormDeliveryRootAuthority(input)
  const entry = input.current.queueAggregate.entries[0]
  if (!entry?.completion) throw invalid('Completed delivery root is missing.')
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryRootAuthority({
    value: persisted,
    ownerUserId: input.ownerUserId,
    current: input.current,
  })
  const authorization = buildProfessionalLongFormDeliveryRootAuthorization({
    authority,
    authorityRef,
  })
  assertExact(entry.professionalLongFormExecutionAuthorization, authorization,
    'Stored delivery-root authorization changed.')
  const executionAttempt = professionalLongFormDeliveryRootAttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormDeliveryRootCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const validationArtifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormDeliveryRootValidationArtifactSchema.parse(value),
  })
  assertHashed(validationArtifact, 'artifactHash')
  const qaEvidence = await readParsedJson({
    context: input.context,
    ref: completion.qaEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryRootQaEvidenceSchema.parse(value),
  })
  assertHashed(qaEvidence, 'qaHash')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryRootReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormDeliveryRootReconciliation({
      current: input.current,
      authority,
      executionAttempt,
      validationArtifactRef: completion.validationArtifactRef,
      qaEvidenceRef: completion.qaEvidenceRef,
      reconciledAt: reconciliation.reconciledAt,
      allowMonotonicDownstreamProgress: true,
    })
  assertExact(reconciliation, expectedReconciliation,
    'Stored delivery-root reconciliation changed.')
  const canonicalResultHash = professionalLongFormDeliveryRootResultHash({
    authority,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidenceRef: completion.qaEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'reeditpro_internal',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_COST_PROFILE_ID,
    vcpuCount: 1,
    memoryGib: 1,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryRootTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryRootTerminal({
    authority,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidenceRef: completion.qaEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal, 'Stored delivery-root terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1 ||
    entry.completion.outcome.sha256 !== completion.validationArtifactRef.sha256
  ) throw invalid('Stored delivery-root queue completion changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    validationArtifact,
    validationArtifactRef: completion.validationArtifactRef,
    qaEvidence,
    qaEvidenceRef: completion.qaEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadCompletedH264(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineRemotionRuntimeAuthority
  chunkIndex: number
  allowCompletedQa?: boolean
}): Promise<CompletedH264Evidence> {
  const authority = buildProfessionalLongFormDeliveryH264Authority(input)
  const entry = input.current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === authority.identity.jobId)
  if (!entry?.completion) throw invalid('Completed delivery H.264 entry is missing.')
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryH264Authority({
    value: persisted,
    ownerUserId: input.ownerUserId,
    current: input.current,
    chunkIndex: input.chunkIndex,
    runtimeAuthority: input.runtimeAuthority,
  })
  const authorization = buildProfessionalLongFormDeliveryH264Authorization({
    authority,
    authorityRef,
  })
  assertExact(entry.professionalLongFormExecutionAuthorization, authorization,
    'Stored delivery H.264 authorization changed.')
  const executionAttempt = professionalLongFormDeliveryH264AttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormDeliveryH264CompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const stored =
    await inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash: completion.outputArtifact.objectIdentity,
    })
  if (
    !stored || stored.byteLength !== completion.outputArtifact.byteLength ||
    stored.sha256 !== completion.outputArtifact.sha256 ||
    entry.completion.outcome.sha256 !== completion.outputArtifact.sha256
  ) throw invalid('Stored delivery H.264 artifact changed.')
  const runtimeEvidence = await readParsedJson({
    context: input.context,
    ref: completion.runtimeEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryH264RuntimeEvidenceSchema.parse(value),
  })
  assertHashed(runtimeEvidence, 'evidenceHash')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryH264ReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormDeliveryH264Reconciliation({
      current: input.current,
      authority,
      executionAttempt,
      outputArtifact: completion.outputArtifact,
      runtimeEvidenceRef: completion.runtimeEvidenceRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedQa: input.allowCompletedQa,
    })
  assertExact(reconciliation, expectedReconciliation,
    'Stored delivery H.264 reconciliation changed.')
  const canonicalResultHash = professionalLongFormDeliveryH264ResultHash({
    authority,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'remotion',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_COST_PROFILE_ID,
    vcpuCount: 4,
    memoryGib: 8,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryH264TerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryH264Terminal({
    authority,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(terminal, expectedTerminal, 'Stored delivery H.264 terminal changed.')
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1
  ) throw invalid('Stored delivery H.264 queue completion changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    outputArtifact: completion.outputArtifact,
    runtimeEvidence,
    runtimeEvidenceRef: completion.runtimeEvidenceRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadCompletedH264Qa(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
  ownerUserId: string
  runtimeAuthority: OfflineMediaBinaryRuntimeAuthority
  chunkIndex: number
}): Promise<CompletedH264QaEvidence> {
  const authority = buildProfessionalLongFormDeliveryH264QaAuthority(input)
  const entry = input.current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === authority.identity.jobId)
  if (!entry?.completion) {
    throw invalid('Completed delivery H.264 QA entry is missing.')
  }
  const authorityRef = requiredStoredAuthorityRef(entry, authority)
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: authorityRef,
  })
  assertProfessionalLongFormDeliveryH264QaAuthority({
    value: persisted,
    ownerUserId: input.ownerUserId,
    current: input.current,
    chunkIndex: input.chunkIndex,
    runtimeAuthority: input.runtimeAuthority,
  })
  const authorization = buildProfessionalLongFormDeliveryH264QaAuthorization({
    authority,
    authorityRef,
  })
  assertExact(
    entry.professionalLongFormExecutionAuthorization,
    authorization,
    'Stored delivery H.264 QA authorization changed.',
  )
  const executionAttempt = professionalLongFormDeliveryH264QaAttemptSchema.parse(
    entry.professionalLongFormExecutionAttempt,
  )
  const completion = professionalLongFormDeliveryH264QaCompletionSchema.parse(
    entry.completion.outcome.professionalLongFormExecution,
  )
  const stored =
    await inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact({
      localStorageRoot: input.context.env.localStorageRoot,
      privateObjectIdentityHash: authority.h264Artifact.objectIdentity,
    })
  if (
    !stored || stored.byteLength !== authority.h264Artifact.byteLength ||
    stored.sha256 !== authority.h264Artifact.sha256
  ) throw invalid('Stored delivery H.264 QA source artifact changed.')
  const artifact = await readParsedJson({
    context: input.context,
    ref: completion.validationArtifactRef,
    parse: (value) =>
      professionalLongFormDeliveryH264QaArtifactSchema.parse(value),
  })
  assertHashed(artifact, 'qaHash')
  if (
    artifact.authorityHash !== authority.authorityHash ||
    stableAuthorityStringify(artifact.h264Artifact) !==
      stableAuthorityStringify(authority.h264Artifact)
  ) throw invalid('Stored delivery H.264 QA artifact lineage changed.')
  const rawProbe = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: artifact.rawProbeResultRef,
  })
  const runtimeReceipt = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: artifact.probeRuntimeEvidenceRef,
  })
  if (
    typeof rawProbe !== 'object' || rawProbe === null ||
    typeof runtimeReceipt !== 'object' || runtimeReceipt === null ||
    !('resultSha256' in runtimeReceipt) ||
    runtimeReceipt.resultSha256 !== artifact.rawProbeResultRef.sha256 ||
    !('image' in runtimeReceipt) ||
    typeof runtimeReceipt.image !== 'object' || runtimeReceipt.image === null ||
    !('imageIdentityHash' in runtimeReceipt.image) ||
    runtimeReceipt.image.imageIdentityHash !==
      authority.lineage.mediaBinaryImageIdentityHash
  ) throw invalid('Stored delivery H.264 QA probe runtime evidence changed.')
  const reconciliation = await readParsedJson({
    context: input.context,
    ref: completion.reconciliationEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryH264QaReconciliationSchema.parse(value),
  })
  const expectedReconciliation =
    buildProfessionalLongFormDeliveryH264QaReconciliation({
      current: input.current,
      authority,
      authorization,
      executionAttempt,
      qaArtifactRef: completion.validationArtifactRef,
      reconciledAt: reconciliation.reconciledAt,
      allowCompletedQa: true,
      allowAdvancedMux: true,
    })
  assertExact(
    reconciliation,
    expectedReconciliation,
    'Stored delivery H.264 QA reconciliation changed.',
  )
  const canonicalResultHash = professionalLongFormDeliveryH264QaResultHash({
    authority,
    executionAttempt,
    qaArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
  })
  const costEvidence = await requiredCostEvidence({
    context: input.context,
    authority,
    executionAttempt,
    canonicalResultHash,
    expectedHash: completion.attemptInternalCostEvidenceHash,
    toolId: 'ffprobe',
    operationId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_OPERATION_ID,
    workloadProfileId: PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_COST_PROFILE_ID,
    vcpuCount: 2,
    memoryGib: 4,
  })
  const terminal = await readParsedJson({
    context: input.context,
    ref: completion.terminalEvidenceRef,
    parse: (value) =>
      professionalLongFormDeliveryH264QaTerminalSchema.parse(value),
  })
  const expectedTerminal = buildProfessionalLongFormDeliveryH264QaTerminal({
    authority,
    authorization,
    executionAttempt,
    validationArtifactRef: completion.validationArtifactRef,
    reconciliationEvidenceRef: completion.reconciliationEvidenceRef,
    canonicalResultHash,
    attemptInternalCostEvidenceHash: costEvidence.evidenceHash,
    completedAt: terminal.completedAt,
  })
  assertExact(
    terminal,
    expectedTerminal,
    'Stored delivery H.264 QA terminal changed.',
  )
  if (
    completion.canonicalResultHash !== canonicalResultHash ||
    entry.deliveryAttemptCount !== 1 ||
    entry.completion.outcome.sha256 !== completion.validationArtifactRef.sha256
  ) throw invalid('Stored delivery H.264 QA queue completion changed.')
  return {
    authority,
    authorityRef,
    authorization,
    executionAttempt,
    artifact,
    artifactRef: completion.validationArtifactRef,
    reconciliation,
    reconciliationRef: completion.reconciliationEvidenceRef,
    costEvidence,
    terminal,
    terminalRef: completion.terminalEvidenceRef,
    queueAggregate: input.current.queueAggregate,
  }
}

async function loadDeliveryMuxDependencies(input: {
  context: ServiceContext
  current: LoadedCustomerDeliveryAuthority
}): Promise<ProfessionalLongFormDeliveryMuxDependencyEvidence> {
  const chunkQa: ProfessionalLongFormDeliveryMuxDependencyEvidence[
    'chunkQa'
  ] = []
  const chunks = [...input.current.package.sourceReview.chunks]
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
  for (const chunk of chunks) {
    const entry = input.current.queueAggregate.entries.find((candidate) =>
      candidate.definition.canonicalOrder === chunk.chunkIndex * 2)
    if (!entry?.completion || entry.state !== 'completed') {
      throw inProgress(
        `Customer-delivery mux remains blocked by H.264 QA ${chunk.chunkIndex}.`,
      )
    }
    const completion = professionalLongFormDeliveryH264QaCompletionSchema.parse(
      entry.completion.outcome.professionalLongFormExecution,
    )
    const qaArtifact = await readParsedJson({
      context: input.context,
      ref: completion.validationArtifactRef,
      parse: (value) =>
        professionalLongFormDeliveryH264QaArtifactSchema.parse(value),
    })
    chunkQa.push({
      chunkId: chunk.chunkId,
      qaArtifactRef: completion.validationArtifactRef,
      qaArtifact,
    })
  }
  const programAudioQaArtifactRef =
    input.current.package.sourceReview.continuousProgramAudio.sourceQaArtifactRef
  const programAudioQaArtifact = await readParsedJson({
    context: input.context,
    ref: programAudioQaArtifactRef,
    parse: (value) =>
      professionalLongFormContinuousProgramAudioQaArtifactSchema.parse(value),
  })
  return {
    chunkQa,
    programAudioQaArtifactRef,
    programAudioQaArtifact,
  }
}

async function inspectApprovedDeliveryMuxInputs(input: {
  context: ServiceContext
  authority: ProfessionalLongFormDeliveryMuxAuthority
}): Promise<{
  chunks: Map<number, CanonicalPrivateRemotionArtifactInspection>
  programAudio: CanonicalPrivateProgramAudioArtifactInspection
}> {
  const chunks = new Map<number, CanonicalPrivateRemotionArtifactInspection>()
  for (const chunk of input.authority.approvedMuxPlan.chunks) {
    const stored =
      await inspectCanonicalPrivateRemotionDeliveryH264ChunkArtifact({
        localStorageRoot: input.context.env.localStorageRoot,
        privateObjectIdentityHash: chunk.artifact.objectIdentity,
      })
    if (
      !stored || stored.byteLength !== chunk.artifact.byteLength ||
      stored.sha256 !== chunk.artifact.sha256
    ) throw invalid(
      `Customer-delivery H.264 chunk ${chunk.chunkIndex} changed after QA.`,
    )
    chunks.set(chunk.chunkIndex, stored)
  }
  const audio = input.authority.approvedMuxPlan.programAudio.artifact
  const programAudio = await inspectCanonicalPrivateProgramAudioArtifact({
    localStorageRoot: input.context.env.localStorageRoot,
    privateObjectIdentityHash: audio.objectIdentity,
  })
  if (
    !programAudio || programAudio.byteLength !== audio.byteLength ||
    programAudio.sha256 !== audio.sha256
  ) throw invalid('Customer-delivery program audio changed after QA.')
  return { chunks, programAudio }
}

function buildDeliveryMuxRuntimeRequest(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  inspected: {
    chunks: Map<number, CanonicalPrivateRemotionArtifactInspection>
    programAudio: CanonicalPrivateProgramAudioArtifactInspection
  }
}) {
  const plan = input.authority.approvedMuxPlan
  return buildOfflineMediaBinaryCustomerDeliveryMuxRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_CUSTOMER_DELIVERY_MUX_RECIPE,
      muxAuthorityHash: plan.muxAuthorityHash,
      expectedObjectIdentity: plan.privateObjectIdentityHash,
      width: plan.width,
      height: plan.height,
      fps: 30,
      totalFrames: plan.totalFrames,
      chunks: plan.chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        chunkCount: chunk.chunkCount,
        globalStartFrame: chunk.globalStartFrame,
        globalEndFrameExclusive: chunk.globalEndFrameExclusive,
        durationFrames: chunk.durationFrames,
        objectIdentity: chunk.artifact.objectIdentity,
        independentQaHash: chunk.qaArtifactHash,
      })),
      continuousProgramAudioObjectIdentity:
        plan.programAudio.artifact.objectIdentity,
      continuousProgramAudioQaHash: plan.programAudio.sourceQaArtifactHash,
      videoAssemblyPolicy:
        'ordered_compatible_h264_chunk_stream_copy_v1',
      audioAssemblyPolicy:
        'encode_exact_continuous_flac_program_audio_to_aac_once_v1',
      timestampPolicy:
        'normalize_from_zero_preserve_frame_and_sample_time_v1',
      compatibilityPolicy:
        'exact_h264_high_yuv420p_bt709_4k_30fps_and_flac_48k_stereo_v1',
      outputContainer: 'mp4',
      outputVideoCodec: 'copy_h264',
      outputAudioCodec: 'aac_lc',
      outputAudioBitrate: 192_000,
      outputAudioSampleRate: 48_000,
      outputAudioChannels: 2,
      frontLoadedInitializationMetadataRequired: true,
      fullProgramVideoReencodeAllowed: false,
      audioEncodeCount: 1,
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      renderPurpose: 'private_4k_customer_delivery_master_v1',
    },
    chunks: plan.chunks.map((chunk) => {
      const stored = input.inspected.chunks.get(chunk.chunkIndex)!
      return {
        inputId: `approved-customer-delivery-h264-${chunk.chunkIndex}`,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        objectIdentity: chunk.artifact.objectIdentity,
        mimeType: 'video/mp4' as const,
        byteLength: stored.byteLength,
        sha256: stored.sha256,
      }
    }),
    programAudio: {
      inputId: 'approved-customer-delivery-program-audio',
      objectIdentity: plan.programAudio.artifact.objectIdentity,
      mimeType: 'audio/flac',
      byteLength: input.inspected.programAudio.byteLength,
      sha256: input.inspected.programAudio.sha256,
    },
  })
}

function assertDeliveryMuxRuntimeResult(input: {
  authority: ProfessionalLongFormDeliveryMuxAuthority
  requestHash: string
  result: OfflineFfmpegCustomerDeliveryMuxExecutionResult
}): void {
  const plan = input.authority.approvedMuxPlan
  const result = input.result
  const semantic = result.evidence.semanticEvidence
  const confinement = result.evidence.confinement
  if (
    result.resultArtifact.mimeType !== 'video/mp4' ||
    result.resultArtifact.outputMode !== 'server_committed_private_stream_v1' ||
    result.evidence.toolId !== 'ffmpeg' ||
    result.evidence.operationId !==
      PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID ||
    result.evidence.requestEnvelopeSha256 !== input.requestHash ||
    stableAuthorityStringify(result.evidence.chunkSha256s) !==
      stableAuthorityStringify(
        plan.chunks.map((chunk) => chunk.artifact.sha256),
      ) ||
    result.evidence.programAudioSha256 !== plan.programAudio.artifact.sha256 ||
    result.evidence.resultSha256 !== result.resultArtifact.sha256 ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.image.imageIdentityHash !==
      input.authority.lineage.mediaBinaryImageIdentityHash ||
    confinement.networkMode !== 'none' ||
    confinement.readOnlyRootFilesystem !== true ||
    confinement.user !== '65532:65532' || confinement.capDropAll !== true ||
    confinement.noNewPrivileges !== true ||
    confinement.nanoCpus !== 4_000_000_000 ||
    confinement.memoryLimitBytes !== 8_589_934_592 ||
    semantic.fixedRecipeExecuted !== true ||
    semantic.recipeProfileId !==
      PROFESSIONAL_LONG_FORM_DELIVERY_MUX_RECIPE_ID ||
    semantic.everyPrivateInputChecksumVerified !== true ||
    semantic.chunkCount !== plan.chunkCount ||
    semantic.orderedCompatibleH264ChunksStreamCopied !== true ||
    semantic.completeProgramVideoReencoded !== false ||
    semantic.exactContinuousFlacProgramAudioEncodedOnce !== true ||
    semantic.outputAudioCodec !== 'aac_lc' ||
    semantic.outputAudioBitrate !== 192_000 ||
    semantic.outputAudioSampleRate !== 48_000 ||
    semantic.outputAudioChannels !== 2 ||
    semantic.frontLoadedInitializationMetadataVerified !== true ||
    semantic.outputProbeVerified !== true ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    semantic.publicDeliveryAuthorized !== false ||
    result.readiness.independentDecodedVideoQaRequired !== true ||
    result.readiness.independentDecodedAudioQaRequired !== true ||
    result.readiness.privateDownloadReconciliationRequired !== true ||
    result.readiness.productReady || result.readiness.productionReady
  ) throw invalid('Confined customer-delivery mux result failed closed.')
}

async function requiredCustomerDeliveryMuxRuntimeAuthority(): Promise<
  OfflineMediaBinaryRuntimeAuthority
> {
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !authority ||
    authority.readiness.privateInternalCustomerDeliveryMuxReady !== true ||
    authority.readiness.productReady !== false ||
    authority.readiness.productionReady !== false ||
    authority.image.customerDeliveryMasterMux !==
      'private_h264_stream_copy_aac_lc_192k_front_loaded_mp4_only' ||
    !authority.supportedOperations.some((operation) =>
      operation.toolId === 'ffmpeg' &&
      operation.operationId === PROFESSIONAL_LONG_FORM_DELIVERY_MUX_OPERATION_ID)
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Customer-delivery mux requires the pinned private FFmpeg runtime authority.',
    503,
  )
  return authority
}

function deliveryMuxEntry(current: LoadedCustomerDeliveryAuthority) {
  const workItem = current.package.graph.workItems.find((item) =>
    item.kind === PROFESSIONAL_LONG_FORM_DELIVERY_MUX_KIND)
  const entry = current.queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === workItem?.jobId)
  if (
    !workItem || !entry ||
    entry.definition.approvedWorkItemId !== workItem.workItemId
  ) throw invalid('Canonical queue lost customer-delivery mux identity.')
  return entry
}

function startDeliveryMuxHeartbeat(input: {
  current: LoadedCustomerDeliveryAuthority
  jobId: string
  claimId: string
  claimCredential: string
  leaseDurationMs: number
  intervalMs: number
}) {
  let stopped = false
  let failure: unknown
  let pending = Promise.resolve()
  const tick = async () => {
    if (stopped || failure) return
    pending = pending.then(async () => {
      if (stopped || failure) return
      await heartbeatPrivateCanonicalPackageWorkQueueClaim({
        scope: input.current.scope,
        definition: input.current.queueDefinition,
        jobId: input.jobId,
        claimId: input.claimId,
        claimCredential: input.claimCredential,
        now: new Date().toISOString(),
        leaseDurationMs: input.leaseDurationMs,
      })
    }).catch((error: unknown) => { failure = error })
    await pending
    if (failure) throw failure
  }
  const timer = setInterval(
    () => void tick().catch(() => undefined),
    input.intervalMs,
  )
  timer.unref()
  return {
    tick,
    async stop() {
      stopped = true
      clearInterval(timer)
      await pending
      if (failure) throw failure
    },
  }
}

function requiredRecord(
  value: unknown,
  message: string,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(message)
  }
  return value as Readonly<Record<string, unknown>>
}

function assertH264RuntimeResult(input: {
  authority: ProfessionalLongFormDeliveryH264Authority
  result: Awaited<ReturnType<Awaited<ReturnType<
    typeof openPrivateOfflineRemotionRenderRuntime
  >>['executeDeliveryH264ChunkServerInjected']>>
}): void {
  const { authority, result } = input
  const semantic = result.evidence.semanticEvidence
  if (
    result.request.payload.expectedOutputIdentity !==
      authority.approvedChunk.expectedH264ObjectIdentity ||
    result.request.payload.sourceVp9ObjectIdentity !==
      authority.approvedChunk.sourceVp9Artifact.objectIdentity ||
    result.artifact.width !== authority.approvedChunk.width ||
    result.artifact.height !== authority.approvedChunk.height ||
    result.artifact.fps !== 30 ||
    result.artifact.durationFrames !== authority.approvedChunk.durationFrames ||
    result.evidence.image.imageIdentityHash !==
      authority.lineage.remotionImageIdentityHash ||
    result.evidence.confinement.nanoCpus !== 4_000_000_000 ||
    result.evidence.confinement.memoryLimitBytes !== 8_589_934_592 ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.readiness.independentChunkQaVerified !== false ||
    semantic.videoOnlyH264HighCrf18MediumApplied !== true ||
    semantic.fixedBt709LimitedRangePolicyApplied !== true ||
    semantic.approvedReservationReuseOnly !== true ||
    semantic.secondEstimateOrExportChargeForbidden !== true
  ) throw invalid('Customer-delivery H.264 runtime evidence changed.')
}

async function loadCurrent(
  context: ServiceContext,
  input: { workspaceId: string; approvedPlanSnapshotId: string },
): Promise<LoadedCustomerDeliveryAuthority> {
  return createCanonicalProfessionalLongFormCustomerDeliveryPackageService(
    context,
  ).loadCurrent(input)
}

async function requiredRemotionRuntimeAuthority(): Promise<
  OfflineRemotionRuntimeAuthority
> {
  const authority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
  if (
    !authority ||
    authority.readiness.serverInjectedStreamingDeliveryH264ChunkReady !== true ||
    authority.readiness.productionReady !== false
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Customer-delivery H.264 requires the pinned private Remotion runtime authority.',
    503,
  )
  return authority
}

async function requiredMediaBinaryRuntimeAuthority(): Promise<
  OfflineMediaBinaryRuntimeAuthority
> {
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !authority ||
    authority.readiness.privateInternalExecutionReady !== true ||
    authority.readiness.productReady !== false ||
    authority.readiness.productionReady !== false ||
    !authority.supportedOperations.some((operation) =>
      operation.toolId === 'ffprobe' &&
      operation.operationId === OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe)
  ) throw new ApiError(
    'TOOL_NOT_READY',
    'Customer-delivery H.264 QA requires the pinned private FFprobe runtime authority.',
    503,
  )
  return authority
}

function startLeaseHeartbeat(input: {
  current: LoadedCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryH264Authority
  claimId: string
  claimCredential: string
}) {
  let heartbeatError: unknown
  let inFlight: Promise<void> = Promise.resolve()
  const timer = setInterval(() => {
    if (heartbeatError) return
    inFlight = heartbeatPrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: input.authority.identity.jobId,
      claimId: input.claimId,
      claimCredential: input.claimCredential,
      now: new Date().toISOString(),
      leaseDurationMs: input.authority.operation.leaseDurationMilliseconds,
    }).then(() => undefined).catch((error: unknown) => {
      heartbeatError = error
    })
  }, 60_000)
  timer.unref()
  return {
    async stopAndAssertHealthy() {
      clearInterval(timer)
      await inFlight
      if (heartbeatError) throw heartbeatError
    },
    async stopIgnoringFailure() {
      clearInterval(timer)
      await inFlight
    },
  }
}

function startH264QaLeaseHeartbeat(input: {
  current: LoadedCustomerDeliveryAuthority
  authority: ProfessionalLongFormDeliveryH264QaAuthority
  claimId: string
  claimCredential: string
}) {
  let heartbeatError: unknown
  let inFlight: Promise<void> = Promise.resolve()
  const timer = setInterval(() => {
    if (heartbeatError) return
    inFlight = heartbeatPrivateCanonicalPackageWorkQueueClaim({
      scope: input.current.scope,
      definition: input.current.queueDefinition,
      jobId: input.authority.identity.jobId,
      claimId: input.claimId,
      claimCredential: input.claimCredential,
      now: new Date().toISOString(),
      leaseDurationMs: input.authority.operation.leaseDurationMilliseconds,
    }).then(() => undefined).catch((error: unknown) => {
      heartbeatError = error
    })
  }, 30_000)
  timer.unref()
  return {
    async stopAndAssertHealthy() {
      clearInterval(timer)
      await inFlight
      if (heartbeatError) throw heartbeatError
    },
    async stopIgnoringFailure() {
      clearInterval(timer)
      await inFlight
    },
  }
}

async function persistAuthority<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  authority: T
  verify(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.authority,
    maxBytes: 4 * 1024 * 1024,
  })
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  const verified = input.verify(persisted)
  assertExact(verified, input.authority,
    'Persisted customer-delivery execution authority changed.')
  return ref
}

async function persistExactJson<T extends Record<string, unknown>>(input: {
  context: ServiceContext
  value: T
  parse(value: unknown): T
}): Promise<AuthorityJsonBlobRef> {
  const ref = await putPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    value: input.value,
    maxBytes: 4 * 1024 * 1024,
  })
  const persisted = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref,
  })
  assertExact(input.parse(persisted), input.value,
    'Persisted customer-delivery evidence changed.')
  return ref
}

async function readParsedJson<T>(input: {
  context: ServiceContext
  ref: AuthorityJsonBlobRef
  parse(value: unknown): T
}): Promise<T> {
  return input.parse(await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.context.env.localStorageRoot,
    ref: input.ref,
  }))
}

function requiredStoredAuthorityRef(
  entry: CanonicalPrivatePackageWorkQueueAggregate['entries'][number],
  authority: { authorityHash: string },
): AuthorityJsonBlobRef {
  const authorization = entry.professionalLongFormExecutionAuthorization
  if (!authorization || authorization.authorityHash !== authority.authorityHash) {
    throw invalid('Stored customer-delivery authority receipt changed.')
  }
  return authorization.authorityRef
}

function costIdentity(
  context: ServiceContext,
  authority: {
    identity: {
      workspaceId: string
      projectId: string
      editSessionId: string
      approvedPlanSnapshotId: string
      approvedWorkItemId: string
      jobId: string
    }
  },
  attempt: { executionAttemptId: string; deliveryAttempt: number },
) {
  return {
    localStorageRoot: context.env.localStorageRoot,
    workspaceId: authority.identity.workspaceId,
    projectId: authority.identity.projectId,
    editSessionId: authority.identity.editSessionId,
    approvedPlanSnapshotId: authority.identity.approvedPlanSnapshotId,
    approvedWorkItemId: authority.identity.approvedWorkItemId,
    jobId: authority.identity.jobId,
    executionAttemptId: attempt.executionAttemptId,
    retryAttempt: attempt.deliveryAttempt,
  }
}

interface CostEvidenceExpectation {
  authority: {
    identity: {
      workspaceId: string
      projectId: string
      jobId: string
      approvedWorkItemId: string
    }
  }
  executionAttempt: { executionAttemptId: string }
  canonicalResultHash: string
  toolId: 'reeditpro_internal' | 'remotion' | 'ffprobe' | 'ffmpeg'
  operationId: string
  workloadProfileId: string
  vcpuCount: 1 | 2 | 4
  memoryGib: 1 | 4 | 8
}

function assertCostEvidence(
  input: CostEvidenceExpectation & {
    evidence: PrivateInternalAttemptCostEvidence
  },
): void {
  const identity = input.evidence.identity
  if (
    identity.jobId !== input.authority.identity.jobId ||
    identity.approvedWorkItemId !==
      input.authority.identity.approvedWorkItemId ||
    identity.executionAttemptId !== input.executionAttempt.executionAttemptId ||
    identity.toolId !== input.toolId ||
    identity.operationId !== input.operationId ||
    !('workloadProfileId' in identity) ||
    identity.workloadProfileId !== input.workloadProfileId ||
    input.evidence.linkedCanonicalOutcomeHash !== input.canonicalResultHash ||
    input.evidence.outcome.status !== 'completed' ||
    input.evidence.outcome.failureCategory !== 'none' ||
    input.evidence.resourceUsage.vcpuCount !== input.vcpuCount ||
    input.evidence.resourceUsage.memoryGib !== input.memoryGib ||
    input.evidence.resourceUsage.gpuCount !== 0 ||
    input.evidence.boundary !== 'internal_production_cost_only' ||
    input.evidence.persistence.invoiceReconciled ||
    /customerPrice|customerCredit|serviceFee|wallet|billingAuthority/u.test(
      stableAuthorityStringify(input.evidence),
    )
  ) throw invalid('Customer-delivery internal attempt-cost evidence changed.')
}

async function requiredCostEvidence(input: CostEvidenceExpectation & {
  context: ServiceContext
  expectedHash: string
}): Promise<PrivateInternalAttemptCostEvidence> {
  const evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.context.env.localStorageRoot,
    workspaceId: input.authority.identity.workspaceId,
    projectId: input.authority.identity.projectId,
    executionAttemptId: input.executionAttempt.executionAttemptId,
  })
  if (!evidence || evidence.evidenceHash !== input.expectedHash) {
    throw invalid('Customer-delivery attempt-cost evidence is missing.')
  }
  assertCostEvidence({ ...input, evidence })
  return evidence
}

function assertExactInput(input: unknown): asserts input is {
  workspaceId: string
  approvedPlanSnapshotId: string
} {
  if (
    !input || typeof input !== 'object' ||
    Object.keys(input).sort().join('|') !==
      'approvedPlanSnapshotId|workspaceId'
  ) throw invalid(
    'Customer-delivery execution accepts no caller job, chunk, source, recipe, path, command, output, price, credit, or provider fields.',
  )
}

function requireOwner(context: ServiceContext): string {
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) {
    throw new ApiError(
      'AUTH_REQUIRED',
      'Customer-delivery execution requires authenticated authority.',
      401,
    )
  }
  return ownerUserId
}

function assertUnexpired(expiresAt: string): void {
  if (Date.parse(expiresAt) <= Date.now()) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Customer-delivery execution requires the unexpired original reservation.',
      409,
    )
  }
}

function assertHashed<T extends Record<string, unknown>>(
  value: T,
  key: keyof T,
): void {
  const hash = value[key]
  const payload = { ...value }
  delete payload[key]
  if (typeof hash !== 'string' || hash !== sha256AuthorityValue(payload)) {
    throw invalid('Customer-delivery stored evidence checksum is invalid.')
  }
}

function assertExact(left: unknown, right: unknown, message: string): void {
  if (stableAuthorityStringify(left) !== stableAuthorityStringify(right)) {
    throw invalid(message)
  }
}

function withoutAggregate<T extends { queueAggregate: unknown }>(value: T) {
  const rest = { ...value }
  delete rest.queueAggregate
  return rest
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate:
      'canonical_professional_long_form_customer_delivery_exact_runner_cost_qa_authority',
  })
}

function inProgress(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409)
}
