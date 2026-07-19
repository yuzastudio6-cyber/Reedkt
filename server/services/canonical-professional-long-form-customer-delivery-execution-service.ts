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
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
  buildOfflineRemotionDeliveryH264ChunkRequest,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  type OfflineRemotionRuntimeAuthority,
} from '../tool-execution/remotion-render-execution'
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
} from './canonical-private-remotion-artifact-storage'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_EXECUTION_VERSION =
  'canonical-professional-long-form-customer-delivery-execution-v1' as const

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
  toolId: 'reeditpro_internal' | 'remotion'
  operationId: string
  workloadProfileId: string
  vcpuCount: 1 | 4
  memoryGib: 1 | 8
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
