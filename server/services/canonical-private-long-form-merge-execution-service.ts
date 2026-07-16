import { ApiError } from '../errors/api-error'
import { resolveProfessionalExportFrame } from '../../src/lib/professional-export-policy'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeStreamingExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_CHUNK_BYTES,
  OFFLINE_REMOTION_RENDER_OPERATION,
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  buildOfflineRemotionLongFormMergeStreamingRequest,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  validateOfflineRemotionFinalCompositionPlanningPayload,
  validateOfflineRemotionLongFormMergePlanningPayload,
  type OfflineRemotionLongFormMergePlanningPayload,
  type OfflineRemotionLongFormMergeStreamingResult,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateCompositionChunkAuthoritySchema,
  canonicalPrivateFinalCompositionAuthoritySchema,
  type CanonicalPrivateFinalCompositionAuthority,
} from '../validation/canonical-private-final-composition-execution-schemas'
import {
  canonicalPrivateLongFormMergeResponseSchema,
  runCanonicalPrivateLongFormMergeSchema,
  type CanonicalPrivateLongFormMergeResponse,
  type RunCanonicalPrivateLongFormMergeInput,
} from '../validation/canonical-private-long-form-merge-execution-schemas'
import type {
  CanonicalExpectedArtifactLineage,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import {
  normalizeCanonicalPrivateFinalMediaQa,
  type CanonicalPrivateFinalMediaQa,
} from './canonical-private-final-media-qa'
import {
  createCanonicalPrivateDependencyArtifactReadService,
  type CanonicalPrivateDependencyArtifactStreamReadResult,
} from './canonical-private-dependency-artifact-read-service'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from './canonical-private-remotion-artifact-storage'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import {
  createPrivateArtifactQaAuthorityService,
  type ServerInjectedArtifactQaAdapter,
  type ServerInjectedArtifactResultAdapter,
} from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue, stableArtifactQaStringify } from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_remotion_render_execution_v1' as const
const CONTENT_TYPE = 'video/mp4' as const

type PlanningService = ReturnType<typeof createEditPlanningAuthorityService>
type ApprovedAuthority = Awaited<ReturnType<PlanningService['loadApprovedExecutionAuthority']>>

interface VerifiedChunkDependency {
  planned: OfflineRemotionLongFormMergePlanningPayload['chunks'][number]
  dependency: CanonicalPrivateDependencyArtifactStreamReadResult
  approvedWorkItemId: string
  expectedAssetId: string
}

/**
 * Executes only the final private merge of already rendered, independently QA'd,
 * reconciled composition chunks. It cannot read source objects, call providers,
 * mutate credits, publish, settle, or authorize a production render.
 */
export function createCanonicalPrivateLongFormMergeExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateLongFormMergeInput,
      serverAuthority: CanonicalPrivateFinalCompositionAuthority,
    ): Promise<CanonicalPrivateLongFormMergeResponse> {
      const body = parseRun(input)
      const injected = parseAuthority(serverAuthority)
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('Long-form merge actor is outside this workspace.')

      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        grantId: body.grantId,
        purpose: 'private_internal_canonical_tool_dispatch_consume',
        idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      if (
        binding.canonicalToolId !== 'remotion' ||
        binding.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
        binding.leaseId !== injected.leaseId ||
        binding.jobId !== body.jobId ||
        binding.workspaceId !== body.workspaceId ||
        binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        binding.expectedOutput.assetRole !== 'final' ||
        !dispatch.executionAuthority.privateFinalCompositionAuthorized ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match long-form merge identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(
        readiness.job.approvedPlanSnapshotId,
        access.workspaceId,
      )
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) =>
        candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('Long-form merge work item or output lineage is missing.')
      const payload = validateOfflineRemotionLongFormMergePlanningPayload(
        workItem.executionInput.structuredPayload,
      )
      assertMergeAuthority({
        authority,
        workItem,
        expectedAsset,
        binding,
        readiness,
        payload,
      })

      const runtimeAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
      if (
        !runtimeAuthority ||
        !runtimeAuthority.readiness.privateInternalExecutionReady ||
        !runtimeAuthority.readiness.privateInternalFinalCompositionReady ||
        !runtimeAuthority.readiness.serverInjectedStreamingFinalCompositionReady ||
        !runtimeAuthority.readiness.serverInjectedStreamingLongFormMergeReady ||
        runtimeAuthority.readiness.productReady ||
        runtimeAuthority.readiness.finalExportReady ||
        !runtimeAuthority.supportedOperations.some((operation) =>
          operation.toolId === 'remotion' && operation.operationId === binding.operationId)
      ) throw denied('Long-form Remotion runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineRemotionRenderRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw denied('Opened Remotion image does not match long-form dispatch-time authority.')
      }
      const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (
        !mediaAuthority || !mediaAuthority.readiness.privateInternalExecutionReady ||
        mediaAuthority.readiness.productReady || mediaAuthority.readiness.finalExportReady
      ) throw denied('Independent pinned FFprobe long-form final QA authority is unavailable.')
      const mediaRuntime = await openPrivateOfflineMediaBinaryRuntime()

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        leaseId: injected.leaseId,
        leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const dependencyReader = createCanonicalPrivateDependencyArtifactReadService(context)
      const chunks: VerifiedChunkDependency[] = []
      for (let index = 0; index < payload.chunks.length; index += 1) {
        const dependency = await dependencyReader.readSingleSelectedArtifactStream({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          snapshotId: authority.snapshot.snapshotId,
          currentJobId: body.jobId,
          currentApprovedWorkItemId: workItem.id,
          leaseId: injected.leaseId,
          leaseCredential: injected.leaseCredential,
          executionAttemptId,
          dispatchGrantId: body.grantId,
          dependencyAuthority: begun.lease.dependencyAuthority,
          selectedArtifactIndex: index,
          allowedContentTypes: [CONTENT_TYPE],
          maximumBytes: OFFLINE_REMOTION_LONG_FORM_MERGE_MAXIMUM_CHUNK_BYTES,
        })
        chunks.push(await verifyChunkDependency({
          context,
          body,
          authority,
          currentWorkItemId: workItem.id,
          planned: payload.chunks[index]!,
          dependency,
          dependencyKey: workItem.dependencyKeys[index]!,
        }))
      }

      const request = buildOfflineRemotionLongFormMergeStreamingRequest({
        planningPayload: payload,
        chunks: chunks.map((chunk, index) => ({
          inputId: `approved-composition-chunk-${index + 1}`,
          outputKey: chunk.planned.outputKey,
          chunkIndex: chunk.planned.chunkIndex,
          mimeType: CONTENT_TYPE,
          byteLength: chunk.dependency.byteLength,
          sha256: chunk.dependency.sha256,
        })),
      })
      const runtimeInputs: OfflineRemotionServerInjectedInput[] = chunks.map((chunk, index) => ({
        inputMode: chunk.dependency.inputMode,
        inputId: `approved-composition-chunk-${index + 1}`,
        mimeType: CONTENT_TYPE,
        byteLength: chunk.dependency.byteLength,
        sha256: chunk.dependency.sha256,
        openStream: chunk.dependency.openStream,
      }))
      const privateObjectIdentityFor = (contentSha256: string) => sha256ArtifactQaValue({
        domain: 'canonical_private_long_form_4k_delivery_master_mp4_stream_v1',
        workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId,
        executionAttemptId,
        chunkLineage: chunks.map((chunk) => ({
          outputKey: chunk.planned.outputKey,
          chunkIndex: chunk.planned.chunkIndex,
          artifactId: chunk.dependency.artifactId,
          artifactVersion: chunk.dependency.artifactVersion,
          sha256: chunk.dependency.sha256,
          dependencyReadEvidenceHash: chunk.dependency.dependencyReadEvidenceHash,
        })),
        requestEnvelopeSha256: sha256AuthorityValue(request),
        contentSha256,
      })
      let privateObjectIdentityHash: string | undefined
      const result = await runtime.executeLongFormMergeServerInjected(
        request,
        runtimeInputs,
        {
          maximumBytes: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
          async persist(output) {
            const identity = privateObjectIdentityFor(output.expectedSha256)
            if (privateObjectIdentityHash && privateObjectIdentityHash !== identity) {
              throw denied('Streaming long-form output identity changed during persistence.')
            }
            privateObjectIdentityHash = identity
            const stored = await persistCanonicalPrivateRemotionArtifactStream({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: identity,
              stream: output.stream,
              expectedByteLength: output.expectedByteLength,
              expectedSha256: output.expectedSha256,
            })
            return { byteLength: stored.byteLength, sha256: stored.sha256 }
          },
        },
      )
      assertMergeResult(result, request)
      if (!privateObjectIdentityHash) {
        throw denied('Streaming long-form output was not committed to private storage.')
      }
      const persistedOutput = await inspectCanonicalPrivateRemotionArtifact({
        localStorageRoot: context.env.localStorageRoot,
        privateObjectIdentityHash,
      })
      if (
        !persistedOutput ||
        persistedOutput.byteLength !== result.artifact.byteLength ||
        persistedOutput.sha256 !== result.artifact.sha256
      ) throw denied('Long-form output changed before independent final QA.')
      const probe = await mediaRuntime.executeServerInjected(
        validateOfflineFfprobeStreamingExecutionRequest({
          schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
          toolId: 'ffprobe',
          operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
          payload: {
            inspectionProfileId: 'final_export_v1',
            countFrames: true,
            verifyDurationAndSync: true,
            emitMachineJsonOnly: true,
            mimeType: CONTENT_TYPE,
            sourceByteLength: result.artifact.byteLength,
            sourceSha256: result.artifact.sha256,
            sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          },
        }),
        {
          inputMode: 'private_verified_stream_v1',
          byteLength: persistedOutput.byteLength,
          sha256: persistedOutput.sha256,
          openStream: () => persistedOutput.openStream(),
        },
      )
      if (!('resultJson' in probe)) {
        throw denied('Independent FFprobe returned the wrong long-form artifact class.')
      }
      const qa = normalizeCanonicalPrivateFinalMediaQa(probe.resultJson.document, payload)
      const identity = {
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
      }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id,
        outputKey: expectedAsset.outputKey,
        artifactType: expectedAsset.artifactType,
        assetRole: expectedAsset.assetRole,
        required: expectedAsset.required,
        previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType: CONTENT_TYPE,
        segmentIds: [...expectedAsset.segmentIds],
        timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey,
        jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: LongFormMergeAdapterInput = {
        localStorageRoot: context.env.localStorageRoot,
        identity,
        lineage,
        privateObjectIdentityHash,
        executionAttemptId,
        dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt,
        result,
        qa,
        chunkDependencyReadEvidenceHashes: chunks.map((chunk) =>
          chunk.dependency.dependencyReadEvidenceHash),
        chunkLineageHash: sha256ArtifactQaValue(chunks.map((chunk) => ({
          planned: chunk.planned,
          artifactId: chunk.dependency.artifactId,
          artifactVersion: chunk.dependency.artifactVersion,
          sha256: chunk.dependency.sha256,
        }))),
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(
        context,
        longFormMergeAdapters(adapterInput),
      )
      const keyHash = sha256ArtifactQaValue({
        domain: 'canonical_long_form_merge_idempotency_v1',
        body,
        executionAttemptId,
      })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity,
        idempotencyKey: key('long-form-merge-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('long-form-merge-qa', keyHash),
        purpose: 'record_server_verified_internal_artifact_qa',
      })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        leaseId: injected.leaseId,
        leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
        executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('long-form-merge-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        !completed.executionFence.commitAuthorizedAt ||
        !completed.executionFence.completedAt
      ) throw denied('Private long-form merge failed final QA or reconciliation.')
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId,
        access.workspaceId,
      )) !== beforeHash) throw denied('Canonical authority changed during long-form merge execution.')

      const responseWithoutHash = {
        schemaVersion: 'canonical-private-long-form-merge-execution-response-v1' as const,
        source: 'canonical_private_long_form_merge_execution_coordinator' as const,
        purpose: body.purpose,
        identity: {
          ...identity,
          approvedWorkItemId: workItem.id,
          dispatchGrantId: body.grantId,
        },
        tool: {
          canonicalToolId: 'remotion' as const,
          operationId: OFFLINE_REMOTION_RENDER_OPERATION,
          compositionProfileId: payload.compositionProfileId,
          longFormCapacityProfileId: payload.longFormCapacityProfileId,
          actualRemotionOperationCompleted: true as const,
          inputKind: 'qa_passed_dependency_artifact' as const,
          dependencyArtifactRead: true as const,
          dependencyInputMode: 'server_injected_private_stream_v1' as const,
          approvedChunkDependencyRead: true as const,
          approvedChunkInputMode: 'server_injected_private_stream_v1' as const,
          approvedChunkCount: chunks.length,
          approvedChunkOrderApplied: true as const,
          approvedChunkFrameContinuityApplied: true as const,
          approvedChunkAudioPreserved: true as const,
          approvedChunkBoundaryAuthorityRead: true as const,
          approvedChunkHardCutsApplied: true as const,
          renderPurpose: payload.renderPurpose,
          deliveryProfileId: payload.deliveryProfileId,
          immutableSourceMasterNoProxyPolicyVerified: true as const,
          originalApprovedEstimateAndReservationReused: true as const,
          secondEstimateCreated: false as const,
          secondReservationCreated: false as const,
          exportCreditMutationPerformed: false as const,
          privateFinalCompositionExecuted: true as const,
          providerCallMade: false as const,
          publicDeliveryExecuted: false as const,
        },
        inputs: {
          chunks: chunks.map((chunk) => ({
            ...chunk.planned,
            artifactId: chunk.dependency.artifactId,
            artifactVersion: chunk.dependency.artifactVersion,
            sha256: chunk.dependency.sha256,
            byteLength: chunk.dependency.byteLength,
            sourceExecutionAttemptId: chunk.dependency.sourceExecutionAttemptId,
            sourceLeaseImmutableHash: chunk.dependency.sourceLeaseImmutableHash,
            dependencyReadEvidenceHash: chunk.dependency.dependencyReadEvidenceHash,
          })),
          combinedChunkByteLength: chunks.reduce(
            (total, chunk) => total + chunk.dependency.byteLength,
            0,
          ),
          chunkDependencySetEvidenceHash: adapterInput.chunkLineageHash,
          transitionPolicy: payload.transitionPolicy,
          chunkBoundaryTransitionCount: payload.chunkBoundaryTransitions.length,
          frameContinuityPolicy: payload.frameContinuityPolicy,
          audioPolicy: payload.audioPolicy,
        },
        lease: {
          leaseId: begun.lease.id,
          attemptNumber: begun.lease.attemptNumber,
          immutableLeaseHash: begun.lease.immutableLeaseHash,
          executionAttemptId,
          runnerClass: RUNNER_CLASS,
          executionStartedAt: completed.executionFence.startedAt,
          executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt!,
          executionCompletedAt: completed.executionFence.completedAt!,
          credentialReturned: false as const,
          credentialHashReturned: false as const,
        },
        runtime: {
          runtimeAuthorityHash: runtimeAuthority.authorityHash,
          imageIdentityHash: runtime.image.imageIdentityHash,
          executionAttestationHash: result.attestation.attestationHash,
          requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
          resultSha256: result.artifact.sha256,
          packageName: result.evidence.packageName,
          packageVersion: result.evidence.packageVersion,
          privateInternalFinalCompositionReady: true as const,
          privateInternalLongFormMergeReady: true as const,
          productReady: false as const,
          externalBetaReady: false as const,
          productionReady: false as const,
        },
        qa,
        finalArtifactQa: qa,
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          assetRole: 'final' as const,
          contentType: CONTENT_TYPE,
          sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash:
            artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateFinalArtifactRecorded: true as const,
          publicDeliveryAuthorized: false as const,
          settlementAuthorized: false as const,
        },
        replay: {
          dispatchConsumptionReplayed: dispatch.consumptionReplayed,
          executionFenceBeginReplayed: begun.replayed,
          executionFenceCompleteReplayed: completed.replayed,
          artifactRecordReplayed: artifactResult.replayed,
          qaRecordReplayed: qaResult.replayed,
          reconciliationReplayed: reconciliation.replayed,
          sameIdempotentAttemptOnly: true as const,
        },
        permissions: {
          furtherWorkerDispatch: false as const,
          providerCall: false as const,
          sourceObjectRead: false as const,
          furtherRender: false as const,
          publicDelivery: false as const,
          creditSpend: false as const,
          walletMutation: false as const,
          settlement: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const,
          contentAddressedArtifactAuthority: true as const,
          actualRunEvidenceVerified: true as const,
          actualQaEvidenceVerified: true as const,
          checksumProtectedAuthority: true as const,
          mediaOutputStreamed: true as const,
          largeMediaOutputOverLegacyBufferVerified:
            result.artifact.byteLength > 16 * 1024 * 1024,
          distributedAuthority: false as const,
          productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalPrivateLongFormMergeResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

function assertMergeAuthority(input: {
  authority: ApprovedAuthority
  workItem: ApprovedAuthority['workItems'][number]
  expectedAsset: ApprovedAuthority['assetManifest']['entries'][number]
  binding: {
    approvedPlanSnapshotId: string
    expectedOutput: { outputKey: string; contentType?: string; assetRole: string }
  }
  readiness: Awaited<ReturnType<ReturnType<
    typeof createCanonicalExecutionReadinessService
  >['inspectJob']>>['executionReadinessEnvelope']
  payload: OfflineRemotionLongFormMergePlanningPayload
}): void {
  const { authority, workItem, expectedAsset, binding, readiness, payload } = input
  const exportCoverage = authority.components.confirmedSettings.professionalExportCoverage
  const exactFourKFrame = resolveProfessionalExportFrame(
    exportCoverage.approvedAspectRatio,
    'uhd_2160',
  )
  const exportEstimateLine = authority.estimate.lineItems.find((lineItem) =>
    lineItem.label === '4K UHD render and export ceiling')
  const flattenedSourceIds = payload.chunks.flatMap((chunk) => chunk.sourceSequenceItemIds)
  const flattenedCleanupIds = payload.chunks.flatMap((chunk) => chunk.sourceCleanupDecisionIds)
  if (
    authority.components.confirmedSettings.outputFramePurpose !==
      'private_canonical_4k_master_review' ||
    authority.components.confirmedSettings.outputFrame.width !== exactFourKFrame.width ||
    authority.components.confirmedSettings.outputFrame.height !== exactFourKFrame.height ||
    payload.width !== exactFourKFrame.width || payload.height !== exactFourKFrame.height ||
    exportCoverage.assumption !== 'always_estimate_4k_uhd' ||
    exportCoverage.costBasisProfileId !== 'uhd_2160' ||
    exportCoverage.defaultDeliveryProfileId !== 'uhd_2160' ||
    !exportCoverage.includedInInitialEstimate ||
    !exportCoverage.usesApprovedEditReservation ||
    exportCoverage.requiresSeparateExportEstimate ||
    exportCoverage.allowsAdditionalExportCharge ||
    !exportEstimateLine || exportEstimateLine.removable ||
    exportEstimateLine.estimatedCredits !== exportCoverage.maximumInternalToolCostCredits ||
    authority.snapshot.estimateId !== authority.estimate.id ||
    authority.snapshot.estimateId !== authority.reservation.estimateId ||
    authority.snapshot.estimateId !== authority.approval.estimateId ||
    authority.snapshot.reservationId !== authority.reservation.id ||
    authority.snapshot.reservationId !== authority.approval.reservationId ||
    authority.estimate.status !== 'approved' ||
    !['reserved', 'partially_spent'].includes(authority.reservation.status) ||
    workItem.workItemKey !== 'final-export' ||
    workItem.workItemType !== 'render_final_export' ||
    workItem.workerClass !== 'render_worker' ||
    workItem.executionInput.operation !== 'merge_approved_4k_composition_chunks' ||
    stableArtifactQaStringify(workItem.executionInput.approvedToolOperationIds) !==
      stableArtifactQaStringify([OFFLINE_REMOTION_RENDER_OPERATION]) ||
    stableArtifactQaStringify(workItem.executionInput.expectedOutputKeys) !==
      stableArtifactQaStringify([expectedAsset.outputKey]) ||
    workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'remotion' ||
    workItem.providerExecutionMode !== 'none' ||
    workItem.dependencyKeys.length !== payload.chunks.length ||
    stableArtifactQaStringify(workItem.sourceSequenceItemIds) !==
      stableArtifactQaStringify(flattenedSourceIds) ||
    stableArtifactQaStringify(workItem.sourceCleanupDecisionIds) !==
      stableArtifactQaStringify(flattenedCleanupIds) ||
    expectedAsset.assetRole !== 'final' || expectedAsset.contentType !== CONTENT_TYPE ||
    !expectedAsset.required || expectedAsset.previewPlaceholderAllowed ||
    binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
    binding.expectedOutput.contentType !== CONTENT_TYPE ||
    binding.expectedOutput.assetRole !== 'final' ||
    readiness.job.approvedWorkItemId !== workItem.id ||
    binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
  ) throw denied('Long-form merge is not the exact approved 4K chunk graph and original reservation.')
}

async function verifyChunkDependency(input: {
  context: ServiceContext
  body: RunCanonicalPrivateLongFormMergeInput
  authority: ApprovedAuthority
  currentWorkItemId: string
  planned: OfflineRemotionLongFormMergePlanningPayload['chunks'][number]
  dependency: CanonicalPrivateDependencyArtifactStreamReadResult
  dependencyKey: string
}): Promise<VerifiedChunkDependency> {
  const workItem = input.authority.workItems.find((candidate) =>
    candidate.workItemKey === input.dependencyKey)
  const expectedAsset = input.authority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === workItem?.id)
  if (!workItem || !expectedAsset) throw denied('Approved composition chunk dependency lineage is missing.')
  const dependencyReadiness = (await createCanonicalExecutionReadinessService(input.context).inspectJob({
    workspaceId: input.body.workspaceId,
    projectId: input.body.projectId,
    editSessionId: input.body.editSessionId,
    jobId: input.dependency.dependencyJobId,
    purpose: 'private_internal_dry_run_readiness',
  })).executionReadinessEnvelope
  const chunkAuthority = canonicalPrivateCompositionChunkAuthoritySchema.safeParse(
    workItem.executionInput.chunkAuthority,
  )
  const chunkPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  if (
    !chunkAuthority.success ||
    workItem.workItemType !== 'custom' || workItem.workerClass !== 'render_worker' ||
    workItem.executionInput.operation !== 'render_approved_4k_composition_chunk' ||
    workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'remotion' ||
    workItem.providerExecutionMode !== 'none' || workItem.expectedOutputs.length !== 1 ||
    expectedAsset.id !== input.dependency.expectedAssetId ||
    expectedAsset.assetRole !== 'processed' || expectedAsset.contentType !== CONTENT_TYPE ||
    expectedAsset.artifactType !== 'private_4k_composition_chunk_v1' ||
    !expectedAsset.required || expectedAsset.previewPlaceholderAllowed ||
    expectedAsset.outputKey !== input.planned.outputKey ||
    dependencyReadiness.job.approvedWorkItemId !== workItem.id ||
    stableArtifactQaStringify(chunkAuthority.data) !== stableArtifactQaStringify({
      profileId: 'canonical_private_4k_chunk_merge_1920_frames_v1',
      chunkIndex: input.planned.chunkIndex,
      chunkCount: input.planned.chunkCount,
      globalStartFrame: input.planned.globalStartFrame,
      globalEndFrameExclusive: input.planned.globalEndFrameExclusive,
      durationFrames: input.planned.durationFrames,
      outputKey: input.planned.outputKey,
    }) ||
    chunkPayload.durationFrames !== input.planned.durationFrames ||
    chunkPayload.deliveryProfileId !== 'uhd_2160' ||
    chunkPayload.estimateCostBasisProfileId !== 'uhd_2160' ||
    !('captionOverlayCues' in chunkPayload) ||
    stableArtifactQaStringify(workItem.sourceSequenceItemIds) !==
      stableArtifactQaStringify(input.planned.sourceSequenceItemIds) ||
    stableArtifactQaStringify(workItem.sourceCleanupDecisionIds) !==
      stableArtifactQaStringify(input.planned.sourceCleanupDecisionIds)
  ) throw denied('Chunk dependency is not an exact independently reconciled approved composition chunk.')
  return {
    planned: input.planned,
    dependency: input.dependency,
    approvedWorkItemId: workItem.id,
    expectedAssetId: expectedAsset.id,
  }
}

function assertMergeResult(
  result: OfflineRemotionLongFormMergeStreamingResult,
  request: ReturnType<typeof buildOfflineRemotionLongFormMergeStreamingRequest>,
): void {
  const semantic = result.evidence.semanticEvidence
  if (
    result.request.operationId !== request.operationId ||
    result.artifact.mimeType !== CONTENT_TYPE ||
    result.artifact.width !== request.payload.width ||
    result.artifact.height !== request.payload.height ||
    result.artifact.fps !== request.payload.fps ||
    result.artifact.durationFrames !== request.payload.durationFrames ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.evidence.inputTransport !== 'length_framed_server_injected_private_stream_v2' ||
    result.evidence.outputTransport !== 'length_committed_private_stream_v2' ||
    semantic.approvedCompositionChunkBytesVerified !== true ||
    semantic.approvedCompositionChunkOrderApplied !== true ||
    semantic.approvedCompositionChunkFrameContinuityApplied !== true ||
    semantic.approvedCompositionChunkAudioPreserved !== true ||
    semantic.approvedCompositionChunkBoundaryAuthorityRead !== true ||
    semantic.approvedCompositionChunkHardCutsApplied !== true ||
    semantic.approvedLongFormCapacityProfileVerified !== true ||
    semantic.finalCompositionProfileExecuted !== true ||
    result.readiness.productReady || !result.readiness.privateInternalFinalCompositionReady ||
    !result.readiness.privateInternalLongFormMergeReady ||
    !result.readiness.serverInjectedStreamingReady
  ) throw denied('Remotion long-form result failed exact chunk and final-output verification.')
}

interface LongFormMergeAdapterInput {
  localStorageRoot: string
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
    snapshotId: string
    jobId: string
    expectedAssetId: string
  }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  result: OfflineRemotionLongFormMergeStreamingResult
  qa: CanonicalPrivateFinalMediaQa
  chunkDependencyReadEvidenceHashes: string[]
  chunkLineageHash: string
}

function longFormMergeAdapters(input: LongFormMergeAdapterInput): {
  producedArtifact: ServerInjectedArtifactResultAdapter
  artifactQa: ServerInjectedArtifactQaAdapter
} {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          artifactVersion: 1,
          attemptKind: 'initial' as const,
          content: {
            sha256: input.result.artifact.sha256,
            byteLength: input.result.artifact.byteLength,
            contentType: CONTENT_TYPE,
          },
          storageIdentity: {
            storageKind: 'private_local_test' as const,
            opaqueObjectIdentityHash: input.privateObjectIdentityHash,
          },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: {
            state: 'actual_run_evidence_verified_v2' as const,
            executionAttemptId: input.executionAttemptId,
            runnerClass: RUNNER_CLASS,
            runnerEvidenceHash: sha256ArtifactQaValue({
              runtime: input.result.evidence,
              chunkDependencyReadEvidenceHashes: input.chunkDependencyReadEvidenceHashes,
              chunkLineageHash: input.chunkLineageHash,
            }),
            startedAt: input.executionStartedAt,
            finishedAt: input.result.attestation.completedAt,
            exitCode: 0 as const,
            toolIds: ['remotion'],
            actualRunVerified: true as const,
            dispatchGrantId: input.dispatchGrantId,
            runtimeAuthorityHash: input.runtimeAuthorityHash,
            runtimeImageIdentityHash: input.result.evidence.image.imageIdentityHash,
            executionAttestationHash: input.result.attestation.attestationHash,
          },
          completedAt: input.result.attestation.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
        assertPersisted(adapterInput.artifact, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [{
            gateId: 'asset_received_gate' as const,
            category: 'asset_integrity' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue(adapterInput.artifact.content),
            notesCode: 'long_form_final_mp4_hash_size_signature_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const,
            category: 'render_composition' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: input.qa.reportSha256,
            notesCode: 'long_form_final_h264_aac_frame_audio_duration_qa_passed',
          }, {
            gateId: 'render_preflight_gate' as const,
            category: 'render_composition' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              chunkDependencyReadEvidenceHashes: input.chunkDependencyReadEvidenceHashes,
              chunkLineageHash: input.chunkLineageHash,
            }),
            notesCode: 'approved_chunk_order_continuity_audio_boundary_preflight_passed',
          }, {
            gateId: 'final_qa_gate' as const,
            category: 'asset_integrity' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              artifactSha256: input.result.artifact.sha256,
              qa: input.qa,
            }),
            notesCode: 'private_long_form_final_independent_qa_passed',
          }],
          recovery: {
            state: 'none' as const,
            action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: 'private_long_form_merge_pass_no_recovery',
          },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: 'actual_remotion_mp4_ffprobe_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

async function assertStored(input: LongFormMergeAdapterInput) {
  const stored = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== input.result.artifact.sha256 ||
    stored.byteLength !== input.result.artifact.byteLength
  ) throw denied('Private long-form final MP4 bytes changed before artifact authority.')
  return stored
}

function assertAdapterLineage(
  identity: Record<string, unknown>,
  lineage: CanonicalExpectedArtifactLineage,
  input: LongFormMergeAdapterInput,
): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)
  ) throw denied('Long-form merge adapter received different canonical lineage.')
}

function assertPersisted(
  artifact: PersistedArtifactResult,
  input: LongFormMergeAdapterInput,
): void {
  if (
    artifact.artifactVersion !== 1 || artifact.lineage.assetRole !== 'final' ||
    artifact.content.sha256 !== input.result.artifact.sha256 ||
    artifact.content.byteLength !== input.result.artifact.byteLength ||
    artifact.content.contentType !== CONTENT_TYPE ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash ||
    artifact.placeholder.isPlaceholder ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId ||
    artifact.actualRunEvidence.executionAttemptId !== input.executionAttemptId
  ) throw denied('Persisted long-form merge does not match actual-run evidence.')
}

function parseRun(value: unknown): RunCanonicalPrivateLongFormMergeInput {
  const parsed = runCanonicalPrivateLongFormMergeSchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Long-form merge execution identity is invalid.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function parseAuthority(value: unknown): CanonicalPrivateFinalCompositionAuthority {
  const parsed = canonicalPrivateFinalCompositionAuthoritySchema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Long-form merge execution authority is invalid.',
      400,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function key(prefix: string, hash: string): string {
  return `${prefix}-${hash.slice(0, 56)}`
}

function denied(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_long_form_merge_execution_authority',
  })
}
