import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import { resolveProfessionalExportFrame } from '../../src/lib/professional-export-policy'
import {
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
} from '../../src/types/canonical-private-composition-capacity'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
  buildOfflineMediaBinaryMezzanineFinalizationRequest,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfmpegStreamingExecutionRequest,
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobeStreamingExecutionRequest,
  validateOfflineFfprobePlanningPayload,
  validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload,
  type OfflineFfmpegExecutionResult,
  type OfflineFfmpegStreamingOutputExecutionResult,
  type OfflineFfmpegColorMatchDeliveryPlanningPayload,
  type OfflineFfmpegMezzanineFinalizationExecutionResult,
  type OfflineFfprobeExecutionResult,
} from '../tool-execution/media-binary-execution'
import {
  validateOfflineRemotionFinalCompositionPlanningPayload,
  validateOfflineRemotionLongFormMergePlanningPayload,
} from '../tool-execution/remotion-render-execution'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  beginPrivateInternalAttemptCostEvidence,
  classifyPrivateInternalAttemptCostFailure,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateMediaBinaryAuthoritySchema,
  canonicalPrivateMediaBinaryResponseSchema,
  runCanonicalPrivateMediaBinarySchema,
  type CanonicalPrivateMediaBinaryAuthority,
  type CanonicalPrivateMediaBinaryResponse,
  type RunCanonicalPrivateMediaBinaryInput,
} from '../validation/canonical-private-media-binary-execution-schemas'
import {
  canonicalPrivateCompositionChunkAuthoritySchema,
} from '../validation/canonical-private-final-composition-execution-schemas'
import type {
  CanonicalExpectedArtifactLineage,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import {
  normalizeCanonicalPrivateFinalMediaQa,
  type CanonicalPrivateFinalMediaExpectation,
  type CanonicalPrivateFinalMediaQa,
} from './canonical-private-final-media-qa'
import {
  createCanonicalPrivateDependencyArtifactReadService,
  type CanonicalPrivateDependencyArtifactReadResult,
  type CanonicalPrivateDependencyArtifactStreamReadResult,
} from './canonical-private-dependency-artifact-read-service'
import { createCanonicalPrivateSourceObjectReadService } from './canonical-private-source-object-read-service'
import type {
  CanonicalPrivateStagedSourceReadResult,
  CanonicalPrivateStagedSourceSet,
} from './canonical-private-source-object-read-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import {
  CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateMediaArtifact,
  persistCanonicalPrivateMediaArtifact,
  persistCanonicalPrivateMediaArtifactStream,
  readCanonicalPrivateMediaArtifact,
} from './canonical-private-media-artifact-storage'
import {
  CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from './canonical-private-remotion-artifact-storage'
import {
  CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES,
  inspectCanonicalPrivateAudioArtifact,
  persistCanonicalPrivateAudioArtifact,
  persistCanonicalPrivateAudioArtifactStream,
  readCanonicalPrivateAudioArtifact,
} from './canonical-private-audio-artifact-storage'
import {
  persistCanonicalStructuredJsonArtifact,
  readCanonicalStructuredJsonArtifact,
} from './canonical-structured-json-artifact-storage'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import type { CanonicalApprovedExecutionAuthority } from './edit-planning-authority-service'
import {
  createPrivateArtifactQaAuthorityService,
  type ServerInjectedArtifactQaAdapter,
  type ServerInjectedArtifactResultAdapter,
} from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue, stableArtifactQaStringify } from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_media_binary_execution_v1' as const
const DIRECT_FINAL_COMPOSITION_OPERATIONS: ReadonlySet<string> = new Set([
  'render_approved_source_sequence_caption_track_final',
  'render_approved_source_sequence_caption_final',
  'render_approved_source_caption_track_final',
  'render_approved_source_caption_final',
])
type MediaBinaryToolId = 'ffmpeg' | 'ffprobe'

export function createCanonicalPrivateMediaBinaryExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateMediaBinaryInput,
      serverAuthority: CanonicalPrivateMediaBinaryAuthority,
    ): Promise<CanonicalPrivateMediaBinaryResponse> {
      const body = parse(runCanonicalPrivateMediaBinarySchema, input, 'Media binary execution identity is invalid.')
      const injected = parse(canonicalPrivateMediaBinaryAuthoritySchema, serverAuthority, 'Media binary authority is invalid.')
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actorUserId !== access.userId) throw denied('Media binary actor is outside this workspace.')

      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId, grantId: body.grantId,
        purpose: 'private_internal_canonical_tool_dispatch_consume',
        idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      const toolId = mediaBinaryToolId(binding.canonicalToolId)
      const operationId = toolId ? OFFLINE_MEDIA_BINARY_OPERATIONS[toolId] : undefined
      if (
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId || binding.jobId !== body.jobId ||
        binding.leaseId !== injected.leaseId || !toolId || binding.operationId !== operationId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match media binary execution identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(
        readiness.job.approvedPlanSnapshotId,
        access.workspaceId,
      )
      const authorityHashBefore = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) {
        throw denied('Media binary work-item or exact non-final output lineage is invalid.')
      }
      const mezzanineFinalization = toolId === 'ffmpeg' &&
        workItem.workItemType === 'render_final_export' &&
        workItem.workerClass === 'render_worker' &&
        workItem.executionInput.operation ===
          'finalize_approved_4k_mezzanine_chunks'
      if (mezzanineFinalization) {
        const payload =
          validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
            workItem.executionInput.structuredPayload,
          )
        const exportCoverage =
          authority.components.confirmedSettings.professionalExportCoverage
        const exactFourKFrame = resolveProfessionalExportFrame(
          exportCoverage.approvedAspectRatio,
          'uhd_2160',
        )
        const exportEstimateLine = authority.estimate.lineItems.find((lineItem) =>
          lineItem.label === '4K UHD render and export ceiling')
        const cleanupDecision = authority.components.sourceCleanupPlan.decisions.find(
          (decision) => decision.decisionId === payload.sourceCleanupDecisionId,
        )
        const expectedDependencyKeys = [
          'source-trim-validation',
          ...payload.chunks.map((chunk) =>
            `composition-chunk-${chunk.chunkIndex}`),
        ]
        if (
          payload.capacityProfileId !==
            CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID ||
          !dispatch.executionAuthority.privateFinalCompositionAuthorized ||
          binding.expectedOutput.assetRole !== 'final' ||
          binding.expectedOutput.contentType !== 'video/mp4' ||
          binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
          binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
          readiness.job.approvedWorkItemId !== workItem.id ||
          expectedAsset.assetRole !== 'final' ||
          expectedAsset.contentType !== 'video/mp4' ||
          !expectedAsset.required || expectedAsset.previewPlaceholderAllowed ||
          workItem.approvedToolIds.length !== 1 ||
          workItem.approvedToolIds[0] !== 'ffmpeg' ||
          stableArtifactQaStringify(
            workItem.executionInput.approvedToolOperationIds,
          ) !== stableArtifactQaStringify([
            OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
          ]) ||
          workItem.providerExecutionMode !== 'none' ||
          stableArtifactQaStringify(workItem.dependencyKeys) !==
            stableArtifactQaStringify(expectedDependencyKeys) ||
          stableArtifactQaStringify(workItem.sourceSequenceItemIds) !==
            stableArtifactQaStringify([payload.sourceSequenceItemId]) ||
          stableArtifactQaStringify(workItem.sourceCleanupDecisionIds) !==
            stableArtifactQaStringify([payload.sourceCleanupDecisionId]) ||
          !cleanupDecision ||
          cleanupDecision.sourceSequenceItemId !== payload.sourceSequenceItemId ||
          cleanupDecision.startFrame !== payload.sourceStartFrame ||
          cleanupDecision.endFrameExclusive !== payload.sourceEndFrameExclusive ||
          authority.components.confirmedSettings.outputFramePurpose !==
            'private_canonical_4k_master_review' ||
          authority.components.confirmedSettings.outputFrame.width !==
            exactFourKFrame.width ||
          authority.components.confirmedSettings.outputFrame.height !==
            exactFourKFrame.height ||
          payload.width !== exactFourKFrame.width ||
          payload.height !== exactFourKFrame.height ||
          exportCoverage.assumption !== 'always_estimate_4k_uhd' ||
          exportCoverage.costBasisProfileId !== 'uhd_2160' ||
          exportCoverage.defaultDeliveryProfileId !== 'uhd_2160' ||
          !exportCoverage.includedInInitialEstimate ||
          !exportCoverage.usesApprovedEditReservation ||
          exportCoverage.requiresSeparateExportEstimate ||
          exportCoverage.allowsAdditionalExportCharge ||
          !exportEstimateLine || exportEstimateLine.removable ||
          exportEstimateLine.estimatedCredits !==
            exportCoverage.maximumInternalToolCostCredits ||
          authority.snapshot.estimateId !== authority.estimate.id ||
          authority.snapshot.estimateId !== authority.reservation.estimateId ||
          authority.snapshot.estimateId !== authority.approval.estimateId ||
          authority.snapshot.reservationId !== authority.reservation.id ||
          authority.snapshot.reservationId !== authority.approval.reservationId ||
          authority.estimate.status !== 'approved' ||
          !['reserved', 'partially_spent'].includes(authority.reservation.status)
        ) throw denied(
          'Mezzanine finalization is not the exact approved 4K source/chunk graph and original reservation.',
        )

        const runtimeAuthority =
          await readPersistedOfflineMediaBinaryRuntimeAuthority()
        if (
          !runtimeAuthority ||
          !runtimeAuthority.readiness.privateInternalExecutionReady ||
          !runtimeAuthority.readiness.privateInternalMezzanineFinalizationReady ||
          runtimeAuthority.readiness.productReady ||
          runtimeAuthority.readiness.finalExportReady ||
          !runtimeAuthority.supportedOperations.some((candidate) =>
            candidate.toolId === 'ffmpeg' &&
            candidate.operationId === binding.operationId)
        ) throw denied(
          'Pinned mezzanine finalization runtime authority changed after dispatch.',
        )
        const runtime = await openPrivateOfflineMediaBinaryRuntime()
        if (runtime.image.imageIdentityHash !==
          runtimeAuthority.image.imageIdentityHash) {
          throw denied(
            'Opened media binary image does not match finalization dispatch authority.',
          )
        }
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
        const attemptCostMeter = await beginPrivateInternalAttemptCostEvidence({
          localStorageRoot: context.env.localStorageRoot,
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          approvedPlanSnapshotId: authority.snapshot.snapshotId,
          approvedWorkItemId: workItem.id,
          jobId: body.jobId,
          executionAttemptId,
          retryAttempt: Math.max(0, begun.lease.attemptNumber - 1),
          toolId: 'ffmpeg',
          operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
          workloadProfileId:
            PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
        })
        let canonicalLifecycleCompleted = false
        let attemptOutputByteLength: number | null = null
        try {
        if (
          begun.lease.dependencyAuthority.selectedArtifacts.length !==
            payload.chunks.length + 1
        ) throw denied(
          'Mezzanine finalization lease lost an exact trim or chunk dependency.',
        )
        const dependencyReader =
          createCanonicalPrivateDependencyArtifactReadService(context)
        const trimDependency = await dependencyReader.readSingleSelectedArtifact({
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
          selectedArtifactIndex: 0,
          allowedContentTypes: ['application/json'],
          maximumBytes: 1024 * 1024,
        })
        assertMezzanineTrimDependency({
          authority,
          payload,
          dependency: trimDependency,
        })
        const chunkDependencies: CanonicalPrivateDependencyArtifactStreamReadResult[] = []
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
            selectedArtifactIndex: index + 1,
            allowedContentTypes: ['video/mp4'],
            maximumBytes:
              OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES,
          })
          await assertMezzanineChunkDependency({
            context,
            body,
            authority,
            planned: payload.chunks[index]!,
            dependency,
            dependencyKey: workItem.dependencyKeys[index + 1]!,
          })
          chunkDependencies.push(dependency)
        }

        let stagedSourceSet: CanonicalPrivateStagedSourceSet | undefined
        let sourceRead: CanonicalPrivateStagedSourceReadResult | undefined
        let privateObjectIdentityHash: string | undefined
        let mediaOutputStreamPersisted = false
        let executionResult!: OfflineFfmpegMezzanineFinalizationExecutionResult
        let finalArtifactQa!: CanonicalPrivateFinalMediaQa
        try {
          stagedSourceSet = await createCanonicalPrivateSourceObjectReadService(context)
            .stageExactApprovedSource({
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              editSessionId: body.editSessionId,
              snapshotId: authority.snapshot.snapshotId,
              jobId: body.jobId,
              approvedWorkItem: workItem,
              approvedSourceManifest: authority.sourceAssetManifest,
              leaseId: injected.leaseId,
              executionAttemptId,
              dispatchGrantId: body.grantId,
            })
          sourceRead = stagedSourceSet.sources[0]
          if (
            stagedSourceSet.sources.length !== 1 || !sourceRead ||
            sourceRead.sourceSequenceItemId !== payload.sourceSequenceItemId
          ) throw denied(
            'Mezzanine finalization source staging diverged from approved source authority.',
          )
          const request = buildOfflineMediaBinaryMezzanineFinalizationRequest({
            planningPayload: payload,
            chunks: chunkDependencies.map((dependency, index) => ({
              inputId: `approved-mezzanine-chunk-${index + 1}`,
              outputKey: payload.chunks[index]!.outputKey,
              chunkIndex: payload.chunks[index]!.chunkIndex,
              mimeType: 'video/mp4',
              byteLength: dependency.byteLength,
              sha256: dependency.sha256,
            })),
            source: {
              inputId: 'approved-mezzanine-source',
              sourceSequenceItemId: sourceRead.sourceSequenceItemId,
              mimeType: 'video/mp4',
              byteLength: sourceRead.byteLength,
              sha256: sourceRead.sha256,
            },
          })
          const inputReadEvidenceHash = sha256ArtifactQaValue({
            sourceReadEvidenceHash: sourceRead.sourceReadEvidenceHash,
            sourceTrimDependencyReadEvidenceHash:
              trimDependency.dependencyReadEvidenceHash,
            chunkDependencyReadEvidenceHashes: chunkDependencies.map(
              (dependency) => dependency.dependencyReadEvidenceHash,
            ),
          })
          const privateObjectIdentityFor = (contentSha256: string) =>
            sha256ArtifactQaValue({
              domain:
                'canonical_private_ffmpeg_mezzanine_finalization_mp4_stream_v1',
              workspaceId: body.workspaceId,
              snapshotId: authority.snapshot.snapshotId,
              jobId: body.jobId,
              expectedAssetId: expectedAsset.id,
              dispatchGrantId: body.grantId,
              executionAttemptId,
              sourceSha256: sourceRead!.sha256,
              sourceReadEvidenceHash: sourceRead!.sourceReadEvidenceHash,
              sourceTrimDependencyReadEvidenceHash:
                trimDependency.dependencyReadEvidenceHash,
              chunkLineage: chunkDependencies.map((dependency, index) => ({
                outputKey: payload.chunks[index]!.outputKey,
                artifactId: dependency.artifactId,
                artifactVersion: dependency.artifactVersion,
                sha256: dependency.sha256,
                dependencyReadEvidenceHash:
                  dependency.dependencyReadEvidenceHash,
              })),
              requestEnvelopeSha256: sha256AuthorityValue(request),
              contentSha256,
            })
          executionResult =
            await runtime.executeMezzanineFinalizationServerInjected(
              request,
              {
                chunks: chunkDependencies.map((dependency) => ({
                  inputMode: dependency.inputMode,
                  byteLength: dependency.byteLength,
                  sha256: dependency.sha256,
                  openStream: dependency.openStream,
                })),
                source: sourceRead.sourceInput,
              },
              {
                maximumBytes:
                  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
                async persist(output) {
                  if (output.mimeType !== 'video/mp4') {
                    throw denied(
                      'Mezzanine finalization returned the wrong content type.',
                    )
                  }
                  const identity = privateObjectIdentityFor(output.expectedSha256)
                  if (
                    privateObjectIdentityHash &&
                    privateObjectIdentityHash !== identity
                  ) throw denied(
                    'Mezzanine output identity changed during persistence.',
                  )
                  privateObjectIdentityHash = identity
                  const stored = await persistCanonicalPrivateRemotionArtifactStream({
                    localStorageRoot: context.env.localStorageRoot,
                    privateObjectIdentityHash: identity,
                    stream: output.stream,
                    expectedByteLength: output.expectedByteLength,
                    expectedSha256: output.expectedSha256,
                  })
                  mediaOutputStreamPersisted = true
                  return { byteLength: stored.byteLength, sha256: stored.sha256 }
                },
              },
            )
          attemptOutputByteLength = executionResult.resultArtifact.byteLength
          if (!privateObjectIdentityHash || !mediaOutputStreamPersisted) {
            throw denied(
              'Mezzanine finalization did not commit its private MP4 stream.',
            )
          }
          const stored = await inspectCanonicalPrivateRemotionArtifact({
            localStorageRoot: context.env.localStorageRoot,
            privateObjectIdentityHash,
          })
          if (
            !stored || stored.byteLength !== executionResult.resultArtifact.byteLength ||
            stored.sha256 !== executionResult.resultArtifact.sha256
          ) throw denied(
            'Mezzanine final MP4 changed before independent final QA.',
          )
          const probe = await runtime.executeServerInjected(
            validateOfflineFfprobeStreamingExecutionRequest({
              schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
              toolId: 'ffprobe',
              operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
              payload: {
                inspectionProfileId: 'final_export_v1',
                countFrames: true,
                verifyDurationAndSync: true,
                emitMachineJsonOnly: true,
                mimeType: 'video/mp4',
                sourceByteLength: stored.byteLength,
                sourceSha256: stored.sha256,
                sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
              },
            }),
            {
              inputMode: 'private_verified_stream_v1',
              byteLength: stored.byteLength,
              sha256: stored.sha256,
              openStream: () => stored.openStream(),
            },
          )
          if (!('resultJson' in probe)) {
            throw denied(
              'Independent FFprobe returned the wrong mezzanine artifact class.',
            )
          }
          finalArtifactQa = normalizeCanonicalPrivateFinalMediaQa(
            probe.resultJson.document,
            payload,
          )

          const normalized: NormalizedMediaBinaryResult = {
            contentType: 'video/mp4',
            sha256: executionResult.resultArtifact.sha256,
            byteLength: executionResult.resultArtifact.byteLength,
            outputMode: executionResult.resultArtifact.outputMode,
          }
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
            contentType: 'video/mp4',
            segmentIds: [...expectedAsset.segmentIds],
            timingIds: [...expectedAsset.timingIds],
            rendererLayerIds: [...expectedAsset.rendererLayerIds],
            approvedWorkItemId: workItem.id,
            workItemKey: workItem.workItemKey,
            jobType: workItem.workItemType,
            jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
            snapshotHash: readiness.authorityHashes.snapshotHash,
            approvedAssetManifestHash:
              readiness.authorityHashes.approvedAssetManifestHash,
          }
          const adapterInput: MediaAdapterInput = {
            localStorageRoot: context.env.localStorageRoot,
            identity,
            lineage,
            privateObjectIdentityHash,
            executionAttemptId,
            dispatchGrantId: body.grantId,
            runtimeAuthorityHash: runtimeAuthority.authorityHash,
            executionStartedAt: begun.executionFence.startedAt,
            executionResult,
            normalized,
            inputReadEvidenceHash,
            finalArtifactQa,
          }
          const artifactAuthority = createPrivateArtifactQaAuthorityService(
            context,
            createAdapters(adapterInput),
          )
          const keyHash = sha256ArtifactQaValue({
            domain: 'canonical_mezzanine_finalization_idempotency_v1',
            body,
            executionAttemptId,
          })
          const artifactResult = await artifactAuthority.recordArtifactResult({
            ...identity,
            idempotencyKey: bounded('mezzanine-artifact', keyHash),
            purpose: 'record_server_verified_internal_artifact_result',
          })
          const qaResult = await artifactAuthority.recordArtifactQa({
            ...identity,
            artifactId: artifactResult.artifact.artifactId,
            idempotencyKey: bounded('mezzanine-qa', keyHash),
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
            idempotencyKey: bounded('mezzanine-reconcile', keyHash),
            purpose: 'reconcile_server_verified_internal_artifact',
          })
          if (
            qaResult.qaEvaluation.outcome !== 'passed' ||
            reconciliation.reconciliation.decision !==
              'test_merged_not_live_authorized' ||
            !reconciliation.reconciliation.privateTestDependencySatisfied ||
            !completed.executionFence.completedAt
          ) throw denied(
            'Mezzanine finalization failed private QA or reconciliation.',
          )
          if (sha256AuthorityValue(
            await planning.loadApprovedExecutionAuthority(
              authority.snapshot.snapshotId,
              access.workspaceId,
            ),
          ) !== authorityHashBefore) throw denied(
            'Canonical planning authority changed during mezzanine finalization.',
          )
          const canonicalOutcomeHash = sha256AuthorityValue({
            domain: 'canonical_private_4k_mezzanine_finalization_outcome_v1',
            identity: {
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              editSessionId: body.editSessionId,
              approvedPlanSnapshotId: authority.snapshot.snapshotId,
              approvedWorkItemId: workItem.id,
              jobId: body.jobId,
              expectedAssetId: expectedAsset.id,
              executionAttemptId,
            },
            tool: {
              canonicalToolId: 'ffmpeg',
              operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
              workloadProfileId:
                PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
            },
            runtime: {
              runtimeAuthorityHash: runtimeAuthority.authorityHash,
              imageIdentityHash: runtime.image.imageIdentityHash,
              executionAttestationHash:
                executionResult.attestation.attestationHash,
              requestEnvelopeSha256:
                executionResult.evidence.requestEnvelopeSha256,
            },
            result: {
              artifactId: artifactResult.artifact.artifactId,
              qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
              reconciliationId: reconciliation.reconciliation.reconciliationId,
              sha256: artifactResult.artifact.content.sha256,
              byteLength: artifactResult.artifact.content.byteLength,
              privateObjectIdentityHash:
                artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
              finalQaReportSha256: finalArtifactQa.reportSha256,
            },
          })
          canonicalLifecycleCompleted = true
          const attemptCost = await attemptCostMeter.finalize({
            status: 'completed',
            failureCategory: 'none',
            outputByteLength: executionResult.resultArtifact.byteLength,
            linkedCanonicalOutcomeHash: canonicalOutcomeHash,
          })
          const responseWithoutHash = {
            schemaVersion:
              'canonical-private-media-binary-execution-response-v4' as const,
            source:
              'canonical_private_media_binary_execution_coordinator' as const,
            purpose: body.purpose,
            identity: {
              ...identity,
              approvedWorkItemId: workItem.id,
              dispatchGrantId: body.grantId,
            },
            tool: {
              canonicalToolId: 'ffmpeg' as const,
              operationId: binding.operationId,
              actualBinaryOperationCompleted: true as const,
              providerCallMade: false as const,
              inputKind: 'approved_source_and_chunk_dependencies' as const,
              sourceObjectRead: true as const,
              dependencyArtifactRead: true as const,
              dependencyInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
              dependencyArtifactStreamed: true as const,
              inputReadEvidenceHash,
              inputArtifactSha256: sourceRead.sha256,
              inputArtifactByteLength: sourceRead.byteLength,
              sourceSequenceItemId: sourceRead.sourceSequenceItemId,
              sourceBindingHash: sourceRead.bindingHash,
              sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
              sourceStagingEvidenceHash: sourceRead.stagingEvidenceHash,
              sourceCapacityEvidenceHash: stagedSourceSet.capacityEvidenceHash,
              sourceStagingCleaned: true as const,
              sourceTrimDependencyArtifactId: trimDependency.artifactId,
              sourceTrimDependencyJobId: trimDependency.dependencyJobId,
              sourceTrimDependencyReadEvidenceHash:
                trimDependency.dependencyReadEvidenceHash,
              chunkInputCount: chunkDependencies.length,
              chunkInputArtifactIds: chunkDependencies.map((dependency) =>
                dependency.artifactId),
              chunkInputDependencyJobIds: chunkDependencies.map((dependency) =>
                dependency.dependencyJobId),
              chunkInputSha256s: chunkDependencies.map((dependency) =>
                dependency.sha256),
              chunkInputByteLengths: chunkDependencies.map((dependency) =>
                dependency.byteLength),
              chunkDependencyReadEvidenceHash: sha256ArtifactQaValue(
                chunkDependencies.map((dependency) =>
                  dependency.dependencyReadEvidenceHash),
              ),
              renderExecuted: false as const,
              finalExportExecuted: false as const,
            },
            finalArtifactQa,
            lease: {
              leaseId: injected.leaseId,
              executionAttemptId,
              runnerClass: RUNNER_CLASS,
              executionStartedAt: begun.executionFence.startedAt,
              executionCompletedAt: completed.executionFence.completedAt!,
            },
            runtime: {
              runtimeAuthorityHash: runtimeAuthority.authorityHash,
              imageIdentityHash: runtime.image.imageIdentityHash,
              executionAttestationHash:
                executionResult.attestation.attestationHash,
              requestEnvelopeSha256:
                executionResult.evidence.requestEnvelopeSha256,
              resultSha256: executionResult.evidence.resultSha256,
              privateInternalOnly: true as const,
              productReady: false as const,
              externalBetaReady: false as const,
              productionReady: false as const,
              finalExportReady: false as const,
            },
            result: {
              artifactId: artifactResult.artifact.artifactId,
              qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
              reconciliationId: reconciliation.reconciliation.reconciliationId,
              contentType: 'video/mp4' as const,
              sha256: artifactResult.artifact.content.sha256,
              byteLength: artifactResult.artifact.content.byteLength,
              outputMode: 'server_committed_private_stream_v1' as const,
              privateObjectIdentityHash:
                artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
              qaOutcome: 'passed' as const,
              reconciliationDecision:
                'test_merged_not_live_authorized' as const,
              privateTestDependencySatisfied: true as const,
              finalRenderAuthorized: false as const,
            },
            attemptCost,
            replay: {
              dispatchConsumptionReplayed: dispatch.consumptionReplayed,
              executionFenceBeginReplayed: begun.replayed,
              executionFenceCompleteReplayed: completed.replayed,
              artifactRecordReplayed: artifactResult.replayed,
              qaRecordReplayed: qaResult.replayed,
              reconciliationReplayed: reconciliation.replayed,
              attemptCostEvidenceReplayed:
                attemptCost.idempotencyStatus === 'duplicate_returned',
            },
            permissions: {
              furtherWorkerDispatch: false as const,
              providerCall: false as const,
              furtherSourceObjectRead: false as const,
              render: false as const,
              finalExport: false as const,
              creditSpend: false as const,
              walletMutation: false as const,
              settlement: false as const,
              delivery: false as const,
            },
            persistence: {
              privateLocalCreateOnlyArtifact: true as const,
              actualRunEvidenceVerified: true as const,
              actualQaEvidenceVerified: true as const,
              checksumProtectedAuthority: true as const,
              mediaOutputStreamed: true as const,
              largeMediaOutputOverLegacyBufferVerified:
                executionResult.resultArtifact.byteLength > 16 * 1024 * 1024,
              distributedAuthority: false as const,
              productionAuthority: false as const,
            },
            completedAt: reconciliation.reconciliation.createdAt,
            testOnly: true as const,
          }
          return canonicalPrivateMediaBinaryResponseSchema.parse({
            ...responseWithoutHash,
            responseHash: sha256AuthorityValue(responseWithoutHash),
          })
        } finally {
          await stagedSourceSet?.cleanup()
        }
        } catch (error) {
          if (!canonicalLifecycleCompleted) {
            await attemptCostMeter.finalize({
              status: 'failed',
              failureCategory: classifyPrivateInternalAttemptCostFailure(error),
              outputByteLength: attemptOutputByteLength,
              linkedCanonicalOutcomeHash: null,
            })
          }
          throw error
        }
      }
      const ffmpegPlanningPayload = toolId === 'ffmpeg'
        ? validateOfflineFfmpegPlanningPayload(workItem.executionInput.structuredPayload)
        : undefined
      const contentType = toolId === 'ffmpeg'
        ? ffmpegPlanningPayload?.recipeProfileId === 'approved_voice_delivery_wav_v1'
          ? 'audio/wav' as const
          : [
              'approved_source_color_delivery_matroska_v1',
              'approved_source_color_match_delivery_matroska_v1',
            ].includes(String(ffmpegPlanningPayload?.recipeProfileId))
            ? 'video/x-matroska' as const
            : 'video/x-nut' as const
        : 'application/json' as const
      const dependencyFinalQa = toolId === 'ffprobe' && workItem?.workItemType === 'run_final_qa'
      const referenceColorMatch = ffmpegPlanningPayload?.recipeProfileId ===
        'approved_source_color_match_delivery_matroska_v1'
      const referenceColorPlanningPayload = referenceColorMatch
        ? ffmpegPlanningPayload as OfflineFfmpegColorMatchDeliveryPlanningPayload
        : undefined
      if (
        expectedAsset.contentType !== contentType ||
        expectedAsset.assetRole === 'final' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.contentType !== contentType ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
        (dependencyFinalQa && (
          workItem.sourceSequenceItemIds.length !== 0 || workItem.sourceCleanupDecisionIds.length !== 0 ||
          workItem.dependencyKeys.length !== 1
        )) ||
        (!dependencyFinalQa && (
          workItem.sourceSequenceItemIds.length !== 1 ||
          workItem.sourceCleanupDecisionIds.length !== 1 ||
          workItem.dependencyKeys.length !== (referenceColorMatch ? 1 : 0)
        ))
      ) throw denied('Media binary work-item or exact non-final output lineage is invalid.')
      const ffprobePlanningPayload = toolId === 'ffprobe'
        ? validateOfflineFfprobePlanningPayload(workItem.executionInput.structuredPayload)
        : undefined
      const planningPayload = toolId === 'ffmpeg'
        ? ffmpegPlanningPayload!
        : ffprobePlanningPayload!
      if (
        dependencyFinalQa && (
          ffprobePlanningPayload?.inspectionProfileId !== 'final_export_v1' ||
          ffprobePlanningPayload.countFrames !== true
        )
      ) throw denied('Dependency-bound final QA requires the exact frame-counted final-export inspection profile.')

      const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
        !runtimeAuthority.supportedOperations.some((candidate) =>
          candidate.toolId === toolId && candidate.operationId === binding.operationId)
      ) throw denied('Pinned media binary runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineMediaBinaryRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw denied('Opened media binary image does not match dispatch-time authority.')
      }

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      let dependencyRead: CanonicalPrivateDependencyArtifactStreamReadResult | undefined
      let referenceDependencyRead: CanonicalPrivateDependencyArtifactReadResult | undefined
      let sourceRead: CanonicalPrivateStagedSourceReadResult | undefined
      let stagedSourceSet: CanonicalPrivateStagedSourceSet | undefined
      let finalMediaExpectation: CanonicalPrivateFinalMediaExpectation | undefined
      let inputByteLength: number
      let inputSha256: string
      let inputReadEvidenceHash: string
      let privateObjectIdentityHash: string | undefined
      let mediaOutputStreamPersisted = false
      let executionResult!: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult |
        OfflineFfmpegStreamingOutputExecutionResult
      try {
        if (dependencyFinalQa) {
          dependencyRead = await createCanonicalPrivateDependencyArtifactReadService(context)
            .readSingleSelectedArtifactStream({
              workspaceId: body.workspaceId, projectId: body.projectId,
              editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
              currentJobId: body.jobId, currentApprovedWorkItemId: workItem.id,
              leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
              executionAttemptId, dispatchGrantId: body.grantId,
              dependencyAuthority: begun.lease.dependencyAuthority,
              allowedContentTypes: ['video/mp4'],
              maximumBytes: CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES,
            })
          const finalJobReadiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
            workspaceId: body.workspaceId, projectId: body.projectId,
            editSessionId: body.editSessionId, jobId: dependencyRead.dependencyJobId,
            purpose: 'private_internal_dry_run_readiness',
          })).executionReadinessEnvelope
          const finalWorkItem = authority.workItems.find((candidate) =>
            candidate.id === finalJobReadiness.job.approvedWorkItemId)
          if (!finalWorkItem || finalWorkItem.workItemType !== 'render_final_export') {
            throw denied('Final QA dependency is not the exact approved final-composition work item.')
          }
          if (
            finalWorkItem.executionInput.operation ===
              'merge_approved_4k_composition_chunks'
          ) {
            finalMediaExpectation = validateOfflineRemotionLongFormMergePlanningPayload(
              finalWorkItem.executionInput.structuredPayload,
            )
          } else if (
            finalWorkItem.executionInput.operation ===
              'finalize_approved_4k_mezzanine_chunks'
          ) {
            finalMediaExpectation =
              validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload(
                finalWorkItem.executionInput.structuredPayload,
              )
          } else if (
            typeof finalWorkItem.executionInput.operation === 'string' &&
            DIRECT_FINAL_COMPOSITION_OPERATIONS.has(
              finalWorkItem.executionInput.operation,
            )
          ) {
            finalMediaExpectation = validateOfflineRemotionFinalCompositionPlanningPayload(
              finalWorkItem.executionInput.structuredPayload,
            )
          } else {
            throw denied('Final QA dependency has an unsupported final-composition operation.')
          }
        } else {
          stagedSourceSet = await createCanonicalPrivateSourceObjectReadService(context)
            .stageExactApprovedSource({
              workspaceId: body.workspaceId, projectId: body.projectId,
              editSessionId: body.editSessionId,
              snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
              approvedWorkItem: workItem, approvedSourceManifest: authority.sourceAssetManifest,
              leaseId: injected.leaseId, executionAttemptId, dispatchGrantId: body.grantId,
            })
          sourceRead = stagedSourceSet.sources[0]
          if (!sourceRead) throw denied('Exact approved source staging returned no source authority.')
          if (referenceColorMatch) {
            if (
              sourceRead.sourceSequenceItemId ===
                referenceColorPlanningPayload!.referenceSourceSequenceItemId
            ) throw denied('Shot-match target and reference source identities must be distinct.')
            referenceDependencyRead = await createCanonicalPrivateDependencyArtifactReadService(context)
              .readSingleSelectedArtifact({
                workspaceId: body.workspaceId, projectId: body.projectId,
                editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
                currentJobId: body.jobId, currentApprovedWorkItemId: workItem.id,
                leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
                executionAttemptId, dispatchGrantId: body.grantId,
                dependencyAuthority: begun.lease.dependencyAuthority,
                allowedContentTypes: ['video/x-matroska'], maximumBytes: 16 * 1024 * 1024,
              })
            assertReferenceColorDependency({
              referenceDependencyRead,
              planningPayload: referenceColorPlanningPayload!,
              targetWorkItem: workItem,
              authority,
            })
          }
        }
        inputByteLength = dependencyRead?.byteLength ?? sourceRead!.byteLength
        inputSha256 = dependencyRead?.sha256 ?? sourceRead!.sha256
        inputReadEvidenceHash = referenceDependencyRead
          ? sha256ArtifactQaValue({
              sourceReadEvidenceHash: sourceRead!.sourceReadEvidenceHash,
              referenceDependencyReadEvidenceHash:
                referenceDependencyRead.dependencyReadEvidenceHash,
            })
          : dependencyRead?.dependencyReadEvidenceHash ?? sourceRead!.sourceReadEvidenceHash
        const privateObjectIdentityFor = (contentSha256: string) => sha256ArtifactQaValue({
          domain: 'canonical_private_media_binary_artifact_v1',
          workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId,
          jobId: body.jobId, expectedAssetId: expectedAsset.id,
          dispatchGrantId: body.grantId, executionAttemptId,
          inputKind: dependencyFinalQa
            ? 'qa_passed_dependency_artifact'
            : referenceDependencyRead
              ? 'approved_source_and_reference_artifact'
              : 'approved_source_object',
          inputSha256,
          referenceInputSha256: referenceDependencyRead?.sha256 ?? null,
          inputReadEvidenceHash,
          contentSha256,
        })
        const referencePayload = referenceDependencyRead
          ? {
              referenceMimeType: 'video/x-matroska' as const,
              referenceSourceByteLength: referenceDependencyRead.byteLength,
              referenceSourceSha256: referenceDependencyRead.sha256,
              referenceSourceBytesBase64: referenceDependencyRead.bytes.toString('base64'),
            }
          : {}
        const sourcePayload = {
          mimeType: 'video/mp4' as const,
          sourceByteLength: inputByteLength,
          sourceSha256: inputSha256,
          sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
        }
        const sourceInput = dependencyRead
          ? {
              inputMode: dependencyRead.inputMode,
              byteLength: dependencyRead.byteLength,
              sha256: dependencyRead.sha256,
              openStream: dependencyRead.openStream,
            }
          : sourceRead!.sourceInput
        if (toolId === 'ffmpeg') {
          const request = validateOfflineFfmpegStreamingExecutionRequest({
            schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
            toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
            payload: { ...planningPayload, ...sourcePayload, ...referencePayload },
          })
          executionResult = contentType === 'video/x-matroska' || contentType === 'audio/wav'
            ? await runtime.executeServerInjectedStreamingOutput(request, sourceInput, {
                maximumBytes: contentType === 'audio/wav'
                  ? CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES
                  : CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES,
                async persist(output) {
                  if (output.mimeType !== contentType) {
                    throw denied('Streaming media output returned the wrong content type.')
                  }
                  const identity = privateObjectIdentityFor(output.expectedSha256)
                  if (privateObjectIdentityHash && privateObjectIdentityHash !== identity) {
                    throw denied('Streaming media output identity changed during persistence.')
                  }
                  privateObjectIdentityHash = identity
                  const stored = contentType === 'audio/wav'
                    ? await persistCanonicalPrivateAudioArtifactStream({
                        localStorageRoot: context.env.localStorageRoot,
                        privateObjectIdentityHash: identity,
                        stream: output.stream,
                        expectedByteLength: output.expectedByteLength,
                        expectedSha256: output.expectedSha256,
                      })
                    : await persistCanonicalPrivateMediaArtifactStream({
                        localStorageRoot: context.env.localStorageRoot,
                        privateObjectIdentityHash: identity,
                        mediaFormat: 'mkv',
                        stream: output.stream,
                        expectedByteLength: output.expectedByteLength,
                        expectedSha256: output.expectedSha256,
                      })
                  mediaOutputStreamPersisted = true
                  return { byteLength: stored.byteLength, sha256: stored.sha256 }
                },
              })
            : await runtime.executeServerInjected(request, sourceInput)
        } else {
          executionResult = await runtime.executeServerInjected(
            validateOfflineFfprobeStreamingExecutionRequest({
              schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
              toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
              payload: { ...planningPayload, ...sourcePayload },
            }),
            sourceInput,
          )
        }
      } finally {
        await stagedSourceSet?.cleanup()
      }
      const normalized = normalizeExecutionResult(executionResult)
      if (
        executionResult.evidence.toolId !== toolId ||
        executionResult.evidence.operationId !== binding.operationId ||
        executionResult.evidence.sourceSha256 !== inputSha256 ||
        (referenceDependencyRead && (
          executionResult.evidence.toolId !== 'ffmpeg' ||
          executionResult.evidence.referenceSourceSha256 !== referenceDependencyRead.sha256
        )) ||
        executionResult.evidence.containerExitCode !== 0 || executionResult.evidence.oomKilled ||
        executionResult.readiness.productReady || normalized.contentType !== contentType
      ) throw denied('Media binary result failed exact execution verification.')
      const finalArtifactQa = dependencyFinalQa
        ? normalizeCanonicalPrivateFinalMediaQa(normalized.document!, finalMediaExpectation!)
        : null
      privateObjectIdentityHash ??= sha256ArtifactQaValue({
        domain: 'canonical_private_media_binary_artifact_v1',
        workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId, executionAttemptId,
        inputKind: dependencyFinalQa
          ? 'qa_passed_dependency_artifact'
          : referenceDependencyRead
            ? 'approved_source_and_reference_artifact'
            : 'approved_source_object',
        inputSha256,
        referenceInputSha256: referenceDependencyRead?.sha256 ?? null,
        inputReadEvidenceHash,
        contentSha256: normalized.sha256,
      })
      const committedPrivateObjectIdentityHash = privateObjectIdentityHash
      if (contentType === 'application/json') {
        await persistCanonicalStructuredJsonArtifact({
          localStorageRoot: context.env.localStorageRoot,
          privateObjectIdentityHash: committedPrivateObjectIdentityHash,
          bytes: requireNormalizedBytes(normalized), expectedSha256: normalized.sha256,
        })
      } else if (contentType === 'audio/wav' && normalized.outputMode === 'bounded_buffer_v1') {
        await persistCanonicalPrivateAudioArtifact({
          localStorageRoot: context.env.localStorageRoot,
          privateObjectIdentityHash: committedPrivateObjectIdentityHash,
          bytes: requireNormalizedBytes(normalized), expectedSha256: normalized.sha256,
        })
      } else if (normalized.outputMode === 'server_committed_private_stream_v1') {
        const stored = contentType === 'audio/wav'
          ? await inspectCanonicalPrivateAudioArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: committedPrivateObjectIdentityHash,
            })
          : await inspectCanonicalPrivateMediaArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: committedPrivateObjectIdentityHash,
            })
        if (
          !mediaOutputStreamPersisted || !stored ||
          (contentType !== 'audio/wav' && 'mediaFormat' in stored && stored.mediaFormat !== 'mkv') ||
          stored.byteLength !== normalized.byteLength || stored.sha256 !== normalized.sha256
        ) throw denied('Streaming media output was not committed to exact private storage.')
      } else {
        await persistCanonicalPrivateMediaArtifact({
          localStorageRoot: context.env.localStorageRoot,
          privateObjectIdentityHash: committedPrivateObjectIdentityHash,
          bytes: requireNormalizedBytes(normalized), expectedSha256: normalized.sha256,
        })
      }
      const identity = {
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
      }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey,
        artifactType: expectedAsset.artifactType, assetRole: expectedAsset.assetRole,
        required: expectedAsset.required, previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType, segmentIds: [...expectedAsset.segmentIds],
        timingIds: [...expectedAsset.timingIds], rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id, workItemKey: workItem.workItemKey,
        jobType: workItem.workItemType, jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: MediaAdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage,
        privateObjectIdentityHash: committedPrivateObjectIdentityHash,
        executionAttemptId, dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt,
        executionResult, normalized, inputReadEvidenceHash, finalArtifactQa,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, createAdapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_media_binary_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity, idempotencyKey: bounded('media-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: bounded('media-qa', keyHash),
        purpose: 'record_server_verified_internal_artifact_qa',
      })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS, executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: bounded('media-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Media binary output failed QA or reconciliation.', 409)
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId, access.workspaceId,
      )) !== authorityHashBefore) throw denied('Canonical planning authority changed during media binary execution.')

      const responseWithoutHash = {
        schemaVersion: 'canonical-private-media-binary-execution-response-v4' as const,
        source: 'canonical_private_media_binary_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: dependencyFinalQa ? {
          canonicalToolId: toolId, operationId: binding.operationId,
          actualBinaryOperationCompleted: true as const, providerCallMade: false as const,
          inputKind: 'qa_passed_dependency_artifact' as const,
          sourceObjectRead: false as const, dependencyArtifactRead: true as const,
          dependencyInputMode: 'server_injected_private_stream_v1' as const,
          dependencyArtifactStreamed: true as const,
          inputReadEvidenceHash,
          inputArtifactId: dependencyRead!.artifactId,
          inputDependencyJobId: dependencyRead!.dependencyJobId,
          inputArtifactSha256: inputSha256, inputArtifactByteLength: inputByteLength,
          renderExecuted: false as const, finalExportExecuted: false as const,
        } : referenceDependencyRead ? {
          canonicalToolId: toolId, operationId: binding.operationId,
          actualBinaryOperationCompleted: true as const, providerCallMade: false as const,
          inputKind: 'approved_source_and_reference_artifact' as const,
          sourceObjectRead: true as const, dependencyArtifactRead: true as const,
          inputReadEvidenceHash,
          inputArtifactSha256: inputSha256, inputArtifactByteLength: inputByteLength,
          sourceSequenceItemId: sourceRead!.sourceSequenceItemId,
          sourceBindingHash: sourceRead!.bindingHash,
          sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          sourceStagingEvidenceHash: sourceRead!.stagingEvidenceHash,
          sourceCapacityEvidenceHash: stagedSourceSet!.capacityEvidenceHash,
          sourceStagingCleaned: true as const,
          referenceSourceSequenceItemId:
            referenceColorPlanningPayload!.referenceSourceSequenceItemId,
          referenceOutputKey: referenceColorPlanningPayload!.referenceOutputKey,
          referenceInputArtifactId: referenceDependencyRead.artifactId,
          referenceInputDependencyJobId: referenceDependencyRead.dependencyJobId,
          referenceInputArtifactSha256: referenceDependencyRead.sha256,
          referenceInputArtifactByteLength: referenceDependencyRead.byteLength,
          referenceInputReadEvidenceHash:
            referenceDependencyRead.dependencyReadEvidenceHash,
          renderExecuted: false as const, finalExportExecuted: false as const,
        } : {
          canonicalToolId: toolId, operationId: binding.operationId,
          actualBinaryOperationCompleted: true as const, providerCallMade: false as const,
          inputKind: 'approved_source_object' as const,
          sourceObjectRead: true as const, dependencyArtifactRead: false as const,
          inputReadEvidenceHash,
          inputArtifactSha256: inputSha256, inputArtifactByteLength: inputByteLength,
          sourceSequenceItemId: sourceRead!.sourceSequenceItemId,
          sourceBindingHash: sourceRead!.bindingHash,
          sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          sourceStagingEvidenceHash: sourceRead!.stagingEvidenceHash,
          sourceCapacityEvidenceHash: stagedSourceSet!.capacityEvidenceHash,
          sourceStagingCleaned: true as const,
          renderExecuted: false as const, finalExportExecuted: false as const,
        },
        finalArtifactQa,
        lease: {
          leaseId: injected.leaseId, executionAttemptId, runnerClass: RUNNER_CLASS,
          executionStartedAt: begun.executionFence.startedAt,
          executionCompletedAt: completed.executionFence.completedAt!,
        },
        runtime: {
          runtimeAuthorityHash: runtimeAuthority.authorityHash,
          imageIdentityHash: runtime.image.imageIdentityHash,
          executionAttestationHash: executionResult.attestation.attestationHash,
          requestEnvelopeSha256: executionResult.evidence.requestEnvelopeSha256,
          resultSha256: executionResult.evidence.resultSha256,
          privateInternalOnly: true as const, productReady: false as const,
          externalBetaReady: false as const, productionReady: false as const,
          finalExportReady: false as const,
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          contentType, sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          outputMode: normalized.outputMode,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const, finalRenderAuthorized: false as const,
        },
        replay: {
          dispatchConsumptionReplayed: dispatch.consumptionReplayed,
          executionFenceBeginReplayed: begun.replayed,
          executionFenceCompleteReplayed: completed.replayed,
          artifactRecordReplayed: artifactResult.replayed,
          qaRecordReplayed: qaResult.replayed,
          reconciliationReplayed: reconciliation.replayed,
        },
        permissions: {
          furtherWorkerDispatch: false as const, providerCall: false as const,
          furtherSourceObjectRead: false as const, render: false as const, finalExport: false as const,
          creditSpend: false as const, walletMutation: false as const,
          settlement: false as const, delivery: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const, actualRunEvidenceVerified: true as const,
          actualQaEvidenceVerified: true as const, checksumProtectedAuthority: true as const,
          mediaOutputStreamed:
            normalized.outputMode === 'server_committed_private_stream_v1',
          largeMediaOutputOverLegacyBufferVerified:
            normalized.outputMode === 'server_committed_private_stream_v1' &&
            normalized.byteLength > 16 * 1024 * 1024,
          distributedAuthority: false as const, productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalPrivateMediaBinaryResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface MediaAdapterInput {
  localStorageRoot: string
  identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  executionResult: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult |
    OfflineFfmpegStreamingOutputExecutionResult |
    OfflineFfmpegMezzanineFinalizationExecutionResult
  normalized: NormalizedMediaBinaryResult
  inputReadEvidenceHash: string
  finalArtifactQa: CanonicalPrivateFinalMediaQa | null
}

function assertMezzanineTrimDependency(input: {
  authority: CanonicalApprovedExecutionAuthority
  payload: ReturnType<
    typeof validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload
  >
  dependency: CanonicalPrivateDependencyArtifactReadResult
}): void {
  const workItem = input.authority.workItems.find((candidate) =>
    candidate.workItemKey === 'source-trim-validation')
  const expectedAsset = input.authority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === workItem?.id)
  const job = input.authority.jobs.find((candidate) =>
    candidate.id === input.dependency.dependencyJobId)
  let document: Record<string, unknown>
  try {
    const parsed = JSON.parse(input.dependency.bytes.toString('utf8')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not a record')
    }
    document = parsed as Record<string, unknown>
  } catch {
    throw denied('Approved source-trim dependency is not valid semantic JSON.')
  }
  const sourceTrim = document.sourceTrim &&
    typeof document.sourceTrim === 'object' &&
    !Array.isArray(document.sourceTrim)
    ? document.sourceTrim as Record<string, unknown>
    : undefined
  const decisions = Array.isArray(sourceTrim?.decisions)
    ? sourceTrim.decisions as Array<Record<string, unknown>>
    : []
  const decision = decisions[0]
  if (
    !workItem || !expectedAsset || !job ||
    workItem.workItemType !== 'prepare_source_trim' ||
    workItem.workerClass !== 'authority_worker' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.executionInput.operation !== 'validate_approved_source_trim_plan' ||
    stableArtifactQaStringify(workItem.sourceSequenceItemIds) !==
      stableArtifactQaStringify([input.payload.sourceSequenceItemId]) ||
    stableArtifactQaStringify(workItem.sourceCleanupDecisionIds) !==
      stableArtifactQaStringify([input.payload.sourceCleanupDecisionId]) ||
    expectedAsset.id !== input.dependency.expectedAssetId ||
    expectedAsset.artifactType !== 'source_trim_validation_evidence' ||
    expectedAsset.contentType !== 'application/json' ||
    input.dependency.contentType !== 'application/json' ||
    job.approvedWorkItemId !== workItem.id ||
    document.validationProfile !== 'source_trim' || document.valid !== true ||
    sourceTrim?.status !== 'confirmed' ||
    sourceTrim.meaningPreservationValidated !== true ||
    sourceTrim.unresolvedUserReview !== false ||
    decisions.length !== 1 || !decision ||
    decision.decisionId !== input.payload.sourceCleanupDecisionId ||
    decision.sourceSequenceItemId !== input.payload.sourceSequenceItemId ||
    decision.startFrame !== input.payload.sourceStartFrame ||
    decision.endFrameExclusive !== input.payload.sourceEndFrameExclusive
  ) throw denied(
    'Source-trim dependency diverged from mezzanine finalization authority.',
  )
}

async function assertMezzanineChunkDependency(input: {
  context: ServiceContext
  body: RunCanonicalPrivateMediaBinaryInput
  authority: CanonicalApprovedExecutionAuthority
  planned: ReturnType<
    typeof validateOfflineMediaBinaryMezzanineFinalizationPlanningPayload
  >['chunks'][number]
  dependency: CanonicalPrivateDependencyArtifactStreamReadResult
  dependencyKey: string
}): Promise<void> {
  const workItem = input.authority.workItems.find((candidate) =>
    candidate.workItemKey === input.dependencyKey)
  const expectedAsset = input.authority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === workItem?.id)
  if (!workItem || !expectedAsset) {
    throw denied('Approved mezzanine chunk dependency lineage is missing.')
  }
  const dependencyReadiness = (await createCanonicalExecutionReadinessService(
    input.context,
  ).inspectJob({
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
    chunkAuthority.data.profileId !==
      CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID ||
    workItem.workItemType !== 'custom' ||
    workItem.workerClass !== 'render_worker' ||
    workItem.executionInput.operation !== 'render_approved_4k_composition_chunk' ||
    workItem.approvedToolIds.length !== 1 ||
    workItem.approvedToolIds[0] !== 'remotion' ||
    workItem.providerExecutionMode !== 'none' ||
    workItem.expectedOutputs.length !== 1 ||
    expectedAsset.id !== input.dependency.expectedAssetId ||
    expectedAsset.assetRole !== 'processed' ||
    expectedAsset.contentType !== 'video/mp4' ||
    expectedAsset.artifactType !== 'private_4k_composition_chunk_v1' ||
    !expectedAsset.required || expectedAsset.previewPlaceholderAllowed ||
    expectedAsset.outputKey !== input.planned.outputKey ||
    input.dependency.contentType !== 'video/mp4' ||
    dependencyReadiness.job.approvedWorkItemId !== workItem.id ||
    stableArtifactQaStringify(chunkAuthority.data) !== stableArtifactQaStringify({
      profileId: CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
      chunkIndex: input.planned.chunkIndex,
      chunkCount: input.planned.chunkCount,
      globalStartFrame: input.planned.globalStartFrame,
      globalEndFrameExclusive: input.planned.globalEndFrameExclusive,
      durationFrames: input.planned.durationFrames,
      outputKey: input.planned.outputKey,
      sourceSliceKey: input.planned.sourceSliceKey,
      sourceStartFrame: input.planned.sourceStartFrame,
      sourceEndFrameExclusive: input.planned.sourceEndFrameExclusive,
    }) ||
    chunkPayload.compositionProfileId !==
      'approved_source_caption_track_final_v1' ||
    !('sourceStartFrame' in chunkPayload) ||
    chunkPayload.sourceStartFrame !== input.planned.sourceStartFrame ||
    chunkPayload.sourceEndFrameExclusive !==
      input.planned.sourceEndFrameExclusive ||
    chunkPayload.durationFrames !== input.planned.durationFrames ||
    chunkPayload.audioPolicy !== 'preserve_source' ||
    'sourceMediaPolicy' in chunkPayload || 'voiceTracks' in chunkPayload ||
    stableArtifactQaStringify(workItem.sourceSequenceItemIds) !==
      stableArtifactQaStringify([input.authority.components.sourceSequence[0]!
        .sourceSequenceItemId]) ||
    stableArtifactQaStringify(workItem.sourceCleanupDecisionIds) !==
      stableArtifactQaStringify([input.authority.components.sourceCleanupPlan
        .decisions[0]!.decisionId])
  ) throw denied(
    'Chunk dependency is not an exact independently reconciled v3 composition chunk.',
  )
}

function assertReferenceColorDependency(input: {
  referenceDependencyRead: CanonicalPrivateDependencyArtifactReadResult
  planningPayload: OfflineFfmpegColorMatchDeliveryPlanningPayload
  targetWorkItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  authority: CanonicalApprovedExecutionAuthority
}): void {
  const asset = input.authority.assetManifest.entries.find((candidate) =>
    candidate.id === input.referenceDependencyRead.expectedAssetId)
  const workItem = input.authority.workItems.find((candidate) =>
    candidate.id === asset?.approvedWorkItemId)
  const expectedOutput = workItem?.expectedOutputs[0]
  if (
    !asset || !workItem || !expectedOutput ||
    input.referenceDependencyRead.contentType !== 'video/x-matroska' ||
    asset.contentType !== 'video/x-matroska' || asset.assetRole !== 'processed' ||
    !asset.required || asset.previewPlaceholderAllowed ||
    asset.outputKey !== input.planningPayload.referenceOutputKey ||
    expectedOutput.outputKey !== asset.outputKey ||
    expectedOutput.contentType !== 'video/x-matroska' ||
    workItem.expectedOutputs.length !== 1 ||
    workItem.workerClass !== 'color_processing_worker' || workItem.workItemType !== 'custom' ||
    workItem.executionInput.operation !== 'process_approved_source_professional_color_delivery' ||
    stableArtifactQaStringify(workItem.executionInput.approvedToolOperationIds) !==
      stableArtifactQaStringify([OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg]) ||
    workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'ffmpeg' ||
    workItem.sourceSequenceItemIds.length !== 1 ||
    workItem.sourceSequenceItemIds[0] !== input.planningPayload.referenceSourceSequenceItemId ||
    workItem.sourceCleanupDecisionIds.length !== 1 || workItem.dependencyKeys.length !== 0 ||
    stableArtifactQaStringify(input.targetWorkItem.dependencyKeys) !==
      stableArtifactQaStringify([workItem.workItemKey])
  ) throw denied('Shot matching requires the exact QA-passed reference color intermediate.')
  const referencePayload = validateOfflineFfmpegPlanningPayload(
    workItem.executionInput.structuredPayload,
  )
  if (
    referencePayload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1' ||
    referencePayload.frameRate !== input.planningPayload.frameRate ||
    referencePayload.colorGradeStyle !== input.planningPayload.colorGradeStyle ||
    referencePayload.intensity !== input.planningPayload.intensity ||
    referencePayload.trimEndFrameExclusive - referencePayload.trimStartFrame !==
      input.planningPayload.referenceDurationFrames
  ) throw denied('Shot-match reference processing diverges from the approved target color policy.')
}

interface NormalizedMediaBinaryResult {
  contentType:
    | 'application/json'
    | 'video/x-nut'
    | 'video/x-matroska'
    | 'audio/wav'
    | 'video/mp4'
  bytes?: Buffer
  sha256: string
  byteLength: number
  document?: Readonly<Record<string, unknown>>
  outputMode: 'bounded_buffer_v1' | 'server_committed_private_stream_v1'
}

function createAdapters(input: MediaAdapterInput): {
  producedArtifact: ServerInjectedArtifactResultAdapter
  artifactQa: ServerInjectedArtifactQaAdapter
} {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          artifactVersion: 1, attemptKind: 'initial' as const,
          content: {
            sha256: input.normalized.sha256,
            byteLength: input.normalized.byteLength,
            contentType: input.normalized.contentType,
          },
          storageIdentity: {
            storageKind: 'private_local_test' as const,
            opaqueObjectIdentityHash: input.privateObjectIdentityHash,
          },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: {
            state: 'actual_run_evidence_verified_v2' as const,
            executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS,
            runnerEvidenceHash: sha256ArtifactQaValue({
              execution: input.executionResult.evidence,
              inputReadEvidenceHash: input.inputReadEvidenceHash,
              finalArtifactQa: input.finalArtifactQa,
            }),
            startedAt: input.executionStartedAt,
            finishedAt: input.executionResult.attestation.completedAt,
            exitCode: 0 as const, toolIds: [input.executionResult.evidence.toolId],
            actualRunVerified: true as const,
            dispatchGrantId: input.dispatchGrantId,
            runtimeAuthorityHash: input.runtimeAuthorityHash,
            runtimeImageIdentityHash: input.executionResult.image.imageIdentityHash,
            executionAttestationHash: input.executionResult.attestation.attestationHash,
          },
          completedAt: input.executionResult.attestation.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
        assertArtifact(adapterInput.artifact, input)
        const stored = await assertStored(input)
        if (
          input.normalized.document &&
          stableArtifactQaStringify('document' in stored ? stored.document : undefined) !==
            stableArtifactQaStringify(input.normalized.document)
        ) {
          throw denied('Media binary result changed before QA.')
        }
        if (input.lineage.assetRole === 'final' && !input.finalArtifactQa) {
          throw denied(
            'Final media binary artifact is missing independent final QA evidence.',
          )
        }
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [{
            gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              content: adapterInput.artifact.content,
              inputReadEvidenceHash: input.inputReadEvidenceHash,
            }),
            notesCode: input.executionResult.evidence.toolId === 'ffmpeg'
              ? 'ffmpeg_media_source_hash_size_storage_match'
              : input.finalArtifactQa
                ? 'ffprobe_json_final_dependency_hash_size_storage_match'
                : 'ffprobe_json_source_hash_size_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const,
            category: input.lineage.assetRole === 'final'
              ? 'render_composition' as const
              : 'model_tier_policy' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: input.finalArtifactQa?.reportSha256 ??
              sha256ArtifactQaValue(input.executionResult.evidence.semanticEvidence),
            notesCode: input.executionResult.evidence.toolId === 'ffmpeg'
              ? 'actual_ffmpeg_semantic_qa_passed'
              : input.finalArtifactQa
                ? 'actual_dependency_bound_final_ffprobe_qa_passed'
                : 'actual_ffprobe_semantic_qa_passed',
          }, ...(input.lineage.assetRole === 'final' ? [{
            gateId: 'render_preflight_gate' as const,
            category: 'render_composition' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              lineage: input.lineage,
              inputReadEvidenceHash: input.inputReadEvidenceHash,
              runtimeAuthorityHash: input.runtimeAuthorityHash,
              semanticEvidence: input.executionResult.evidence.semanticEvidence,
            }),
            notesCode:
              'approved_source_trim_chunk_order_stream_copy_and_reservation_preflight_passed',
          }, {
            gateId: 'final_qa_gate' as const,
            category: 'asset_integrity' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              artifactSha256: input.normalized.sha256,
              finalArtifactQa: input.finalArtifactQa,
              runtimeResultSha256: input.executionResult.evidence.resultSha256,
            }),
            notesCode:
              'private_mezzanine_final_independent_frame_audio_color_and_duration_qa_passed',
          }] : [])],
          recovery: {
            state: 'none' as const, action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: input.lineage.assetRole === 'final'
              ? 'private_mezzanine_final_pass_no_recovery'
              : input.executionResult.evidence.toolId === 'ffmpeg'
                ? 'ffmpeg_pass_no_recovery'
              : 'ffprobe_pass_no_recovery',
          },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: input.executionResult.evidence.toolId === 'ffmpeg'
            ? 'actual_media_binary_qa_verified_v1' as const
            : 'actual_structured_json_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

async function assertStored(input: MediaAdapterInput) {
  if (input.normalized.outputMode === 'server_committed_private_stream_v1') {
    const stored = input.normalized.contentType === 'video/mp4'
      ? await inspectCanonicalPrivateRemotionArtifact({
          localStorageRoot: input.localStorageRoot,
          privateObjectIdentityHash: input.privateObjectIdentityHash,
        })
      : input.normalized.contentType === 'audio/wav'
      ? await inspectCanonicalPrivateAudioArtifact({
          localStorageRoot: input.localStorageRoot,
          privateObjectIdentityHash: input.privateObjectIdentityHash,
        })
      : await inspectCanonicalPrivateMediaArtifact({
          localStorageRoot: input.localStorageRoot,
          privateObjectIdentityHash: input.privateObjectIdentityHash,
        })
    if (
      !stored ||
      (input.normalized.contentType !== 'audio/wav' &&
        input.normalized.contentType !== 'video/mp4' &&
        'mediaFormat' in stored && stored.mediaFormat !== 'mkv') ||
      stored.sha256 !== input.normalized.sha256 ||
      stored.byteLength !== input.normalized.byteLength
    ) throw denied('Streaming media binary artifact changed before artifact authority.')
    return stored
  }
  const stored = input.normalized.contentType === 'application/json'
    ? await readCanonicalStructuredJsonArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: input.privateObjectIdentityHash,
      })
    : input.normalized.contentType === 'audio/wav'
      ? await readCanonicalPrivateAudioArtifact({
          localStorageRoot: input.localStorageRoot,
          privateObjectIdentityHash: input.privateObjectIdentityHash,
        })
      : await readCanonicalPrivateMediaArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: input.privateObjectIdentityHash,
      })
  if (
    !stored || stored.sha256 !== input.normalized.sha256 ||
    stored.byteLength !== input.normalized.byteLength ||
    !stored.bytes.equals(requireNormalizedBytes(input.normalized))
  ) throw denied('Media binary bytes changed before artifact authority.')
  return stored
}

function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: MediaAdapterInput): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)
  ) throw denied('Media binary adapter received different canonical lineage.')
}

function assertArtifact(artifact: PersistedArtifactResult, input: MediaAdapterInput): void {
  if (
    artifact.content.sha256 !== input.normalized.sha256 ||
    artifact.content.byteLength !== input.normalized.byteLength ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId
  ) throw denied('Persisted media binary artifact does not match actual-run evidence.')
}

function normalizeExecutionResult(
  result: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult |
    OfflineFfmpegStreamingOutputExecutionResult |
    OfflineFfmpegMezzanineFinalizationExecutionResult,
): NormalizedMediaBinaryResult {
  if ('resultArtifact' in result) {
    return 'outputMode' in result.resultArtifact
      ? {
          contentType: result.resultArtifact.mimeType,
          sha256: result.resultArtifact.sha256,
          byteLength: result.resultArtifact.byteLength,
          outputMode: result.resultArtifact.outputMode,
        }
      : {
          contentType: result.resultArtifact.mimeType,
          bytes: result.resultArtifact.bytes,
          sha256: result.resultArtifact.sha256,
          byteLength: result.resultArtifact.byteLength,
          outputMode: 'bounded_buffer_v1',
        }
  }
  return {
    contentType: result.resultJson.mimeType,
    bytes: result.resultJson.bytes,
    sha256: result.resultJson.sha256,
    byteLength: result.resultJson.byteLength,
    document: result.resultJson.document,
    outputMode: 'bounded_buffer_v1',
  }
}

function requireNormalizedBytes(result: NormalizedMediaBinaryResult): Buffer {
  if (!result.bytes) throw denied('Buffered media binary result bytes are unavailable.')
  return result.bytes
}

function mediaBinaryToolId(value: string): MediaBinaryToolId | undefined {
  return value === 'ffmpeg' || value === 'ffprobe' ? value : undefined
}

function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function bounded(prefix: string, hash: string): string { return `${prefix}-${hash.slice(0, 56)}` }
function denied(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_media_binary_execution_authority',
  })
}
