import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfmpegStreamingExecutionRequest,
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobeExecutionRequest,
  validateOfflineFfprobeStreamingExecutionRequest,
  validateOfflineFfprobePlanningPayload,
  type OfflineFfmpegExecutionResult,
  type OfflineFfmpegColorMatchDeliveryPlanningPayload,
  type OfflineFfprobeExecutionResult,
} from '../tool-execution/media-binary-execution'
import { validateOfflineRemotionFinalCompositionPlanningPayload } from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateMediaBinaryAuthoritySchema,
  canonicalPrivateMediaBinaryResponseSchema,
  runCanonicalPrivateMediaBinarySchema,
  type CanonicalPrivateMediaBinaryAuthority,
  type CanonicalPrivateMediaBinaryResponse,
  type RunCanonicalPrivateMediaBinaryInput,
} from '../validation/canonical-private-media-binary-execution-schemas'
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
} from './canonical-private-dependency-artifact-read-service'
import { createCanonicalPrivateSourceObjectReadService } from './canonical-private-source-object-read-service'
import type {
  CanonicalPrivateStagedSourceReadResult,
  CanonicalPrivateStagedSourceSet,
} from './canonical-private-source-object-read-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import {
  persistCanonicalPrivateMediaArtifact,
  readCanonicalPrivateMediaArtifact,
} from './canonical-private-media-artifact-storage'
import {
  persistCanonicalPrivateAudioArtifact,
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
      let dependencyRead: CanonicalPrivateDependencyArtifactReadResult | undefined
      let referenceDependencyRead: CanonicalPrivateDependencyArtifactReadResult | undefined
      let sourceRead: CanonicalPrivateStagedSourceReadResult | undefined
      let stagedSourceSet: CanonicalPrivateStagedSourceSet | undefined
      let finalMediaExpectation: CanonicalPrivateFinalMediaExpectation | undefined
      let inputByteLength: number
      let inputSha256: string
      let executionResult!: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult
      try {
        if (dependencyFinalQa) {
          dependencyRead = await createCanonicalPrivateDependencyArtifactReadService(context)
            .readSingleSelectedArtifact({
              workspaceId: body.workspaceId, projectId: body.projectId,
              editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
              currentJobId: body.jobId, currentApprovedWorkItemId: workItem.id,
              leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
              executionAttemptId, dispatchGrantId: body.grantId,
              dependencyAuthority: begun.lease.dependencyAuthority,
              allowedContentTypes: ['video/mp4'], maximumBytes: 16 * 1024 * 1024,
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
          finalMediaExpectation = validateOfflineRemotionFinalCompositionPlanningPayload(
            finalWorkItem.executionInput.structuredPayload,
          )
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
        const referencePayload = referenceDependencyRead
          ? {
              referenceMimeType: 'video/x-matroska' as const,
              referenceSourceByteLength: referenceDependencyRead.byteLength,
              referenceSourceSha256: referenceDependencyRead.sha256,
              referenceSourceBytesBase64: referenceDependencyRead.bytes.toString('base64'),
            }
          : {}
        if (dependencyRead) {
          const sourcePayload = {
            mimeType: 'video/mp4' as const,
            sourceByteLength: inputByteLength,
            sourceSha256: inputSha256,
            sourceBytesBase64: dependencyRead.bytes.toString('base64'),
          }
          executionResult = toolId === 'ffmpeg'
            ? await runtime.execute(validateOfflineFfmpegExecutionRequest({
                schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
                toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
                payload: { ...planningPayload, ...sourcePayload, ...referencePayload },
              }))
            : await runtime.execute(validateOfflineFfprobeExecutionRequest({
                schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
                toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
                payload: { ...planningPayload, ...sourcePayload },
              }))
        } else {
          const sourcePayload = {
            mimeType: 'video/mp4' as const,
            sourceByteLength: inputByteLength,
            sourceSha256: inputSha256,
            sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
          }
          executionResult = toolId === 'ffmpeg'
            ? await runtime.executeServerInjected(validateOfflineFfmpegStreamingExecutionRequest({
                schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
                toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
                payload: { ...planningPayload, ...sourcePayload, ...referencePayload },
              }), sourceRead!.sourceInput)
            : await runtime.executeServerInjected(validateOfflineFfprobeStreamingExecutionRequest({
                schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
                toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
                payload: { ...planningPayload, ...sourcePayload },
              }), sourceRead!.sourceInput)
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
      const inputReadEvidenceHash = referenceDependencyRead
        ? sha256ArtifactQaValue({
            sourceReadEvidenceHash: sourceRead!.sourceReadEvidenceHash,
            referenceDependencyReadEvidenceHash:
              referenceDependencyRead.dependencyReadEvidenceHash,
          })
        : dependencyRead?.dependencyReadEvidenceHash ?? sourceRead!.sourceReadEvidenceHash

      const privateObjectIdentityHash = sha256ArtifactQaValue({
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
      if (contentType === 'application/json') {
        await persistCanonicalStructuredJsonArtifact({
          localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash,
          bytes: normalized.bytes, expectedSha256: normalized.sha256,
        })
      } else if (contentType === 'audio/wav') {
        await persistCanonicalPrivateAudioArtifact({
          localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash,
          bytes: normalized.bytes, expectedSha256: normalized.sha256,
        })
      } else {
        await persistCanonicalPrivateMediaArtifact({
          localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash,
          bytes: normalized.bytes, expectedSha256: normalized.sha256,
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
        privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId,
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
        schemaVersion: 'canonical-private-media-binary-execution-response-v2' as const,
        source: 'canonical_private_media_binary_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: dependencyFinalQa ? {
          canonicalToolId: toolId, operationId: binding.operationId,
          actualBinaryOperationCompleted: true as const, providerCallMade: false as const,
          inputKind: 'qa_passed_dependency_artifact' as const,
          sourceObjectRead: false as const, dependencyArtifactRead: true as const,
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
  executionResult: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult
  normalized: NormalizedMediaBinaryResult
  inputReadEvidenceHash: string
  finalArtifactQa: CanonicalPrivateFinalMediaQa | null
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
  contentType: 'application/json' | 'video/x-nut' | 'video/x-matroska' | 'audio/wav'
  bytes: Buffer
  sha256: string
  byteLength: number
  document?: Readonly<Record<string, unknown>>
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
            gateId: 'asset_quality_gate' as const, category: 'model_tier_policy' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: input.finalArtifactQa?.reportSha256 ??
              sha256ArtifactQaValue(input.executionResult.evidence.semanticEvidence),
            notesCode: input.executionResult.evidence.toolId === 'ffmpeg'
              ? 'actual_ffmpeg_semantic_qa_passed'
              : input.finalArtifactQa
                ? 'actual_dependency_bound_final_ffprobe_qa_passed'
                : 'actual_ffprobe_semantic_qa_passed',
          }],
          recovery: {
            state: 'none' as const, action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: input.executionResult.evidence.toolId === 'ffmpeg'
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
    !stored.bytes.equals(input.normalized.bytes)
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
  result: OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult,
): NormalizedMediaBinaryResult {
  return 'resultArtifact' in result
    ? {
        contentType: result.resultArtifact.mimeType,
        bytes: result.resultArtifact.bytes,
        sha256: result.resultArtifact.sha256,
        byteLength: result.resultArtifact.byteLength,
      }
    : {
        contentType: result.resultJson.mimeType,
        bytes: result.resultJson.bytes,
        sha256: result.resultJson.sha256,
        byteLength: result.resultJson.byteLength,
        document: result.resultJson.document,
      }
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
