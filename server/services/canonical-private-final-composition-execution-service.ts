import { createHash } from 'node:crypto'

import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  OFFLINE_REMOTION_RENDER_OPERATION,
  buildOfflineRemotionFinalCompositionRequest,
  isFinalCompositionPayload,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  validateOfflineRemotionFinalCompositionPlanningPayload,
  type OfflineRemotionRenderResult,
} from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateFinalCompositionAuthoritySchema,
  canonicalPrivateFinalCompositionResponseSchema,
  runCanonicalPrivateFinalCompositionSchema,
  type CanonicalPrivateFinalCompositionAuthority,
  type CanonicalPrivateFinalCompositionResponse,
  type RunCanonicalPrivateFinalCompositionInput,
} from '../validation/canonical-private-final-composition-execution-schemas'
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
  type CanonicalPrivateDependencyArtifactReadResult,
} from './canonical-private-dependency-artifact-read-service'
import {
  persistCanonicalPrivateRemotionArtifact,
  readCanonicalPrivateRemotionArtifact,
} from './canonical-private-remotion-artifact-storage'
import { createCanonicalPrivateSourceObjectReadService } from './canonical-private-source-object-read-service'
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
type EditPlanningService = ReturnType<typeof createEditPlanningAuthorityService>
type ApprovedExecutionAuthority = Awaited<ReturnType<EditPlanningService['loadApprovedExecutionAuthority']>>

export function createCanonicalPrivateFinalCompositionExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateFinalCompositionInput,
      serverAuthority: CanonicalPrivateFinalCompositionAuthority,
    ): Promise<CanonicalPrivateFinalCompositionResponse> {
      const body = parse(
        runCanonicalPrivateFinalCompositionSchema,
        input,
        'Final composition execution identity is invalid.',
      )
      const injected = parse(
        canonicalPrivateFinalCompositionAuthoritySchema,
        serverAuthority,
        'Final composition execution authority is invalid.',
      )
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('Final composition actor is outside this workspace.')

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
        binding.canonicalToolId !== 'remotion' || binding.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
        binding.leaseId !== injected.leaseId || binding.jobId !== body.jobId ||
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId || binding.expectedOutput.assetRole !== 'final' ||
        !dispatch.executionAuthority.privateFinalCompositionAuthorized ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match final composition identity.')

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
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('Final composition work item or output lineage is missing.')
      const planningPayload = validateOfflineRemotionFinalCompositionPlanningPayload(
        workItem.executionInput.structuredPayload,
      )
      const sequenceProfile = 'sourceSegments' in planningPayload
      const captionTrackProfile = 'captionOverlayCues' in planningPayload
      const captionCueCount = captionTrackProfile ? planningPayload.captionOverlayCues.length : 1
      const sourceCount = sequenceProfile
        ? planningPayload.sourceSegments.length
        : 1
      const expectedDependencyCount = 1 + captionCueCount
      if (
        workItem.workItemType !== 'render_final_export' || workItem.workerClass !== 'render_worker' ||
        workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'remotion' ||
        workItem.sourceSequenceItemIds.length !== sourceCount ||
        workItem.sourceCleanupDecisionIds.length !== sourceCount ||
        workItem.dependencyKeys.length !== expectedDependencyCount ||
        expectedAsset.contentType !== CONTENT_TYPE || binding.expectedOutput.contentType !== CONTENT_TYPE ||
        expectedAsset.assetRole !== 'final' || !expectedAsset.required || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) throw denied('Final composition requires exact ordered sources, trim decisions, and caption dependencies.')
      const approvedCleanupDecisions = workItem.sourceCleanupDecisionIds.map((decisionId, index) =>
        authority.components.sourceCleanupPlan.decisions.find((decision) =>
          decision.decisionId === decisionId &&
          decision.sourceSequenceItemId === workItem.sourceSequenceItemIds[index]))
      if (
        approvedCleanupDecisions.some((decision) => !decision || decision.action === 'cut')
      ) throw denied('Final composition source trim authority is missing or excludes an approved source range.')
      const exactCleanupDecisions = approvedCleanupDecisions as Array<NonNullable<(typeof approvedCleanupDecisions)[number]>>
      if (sequenceProfile) {
        planningPayload.sourceSegments.forEach((segment, index) => {
          const decision = exactCleanupDecisions[index]!
          if (
            segment.sourceSequenceItemId !== workItem.sourceSequenceItemIds[index] ||
            segment.sourceStartFrame !== decision.startFrame ||
            segment.sourceEndFrameExclusive !== decision.endFrameExclusive
          ) throw denied('Source-sequence composition timing diverges from approved source cleanup authority.')
        })
      } else if (
        planningPayload.sourceStartFrame !== exactCleanupDecisions[0]!.startFrame ||
        planningPayload.sourceEndFrameExclusive !== exactCleanupDecisions[0]!.endFrameExclusive
      ) throw denied('Final composition timing does not match the approved source cleanup decision.')

      const runtimeAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        !runtimeAuthority.readiness.privateInternalFinalCompositionReady ||
        runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
        !runtimeAuthority.supportedOperations.some((operation) =>
          operation.toolId === 'remotion' && operation.operationId === binding.operationId)
      ) throw denied('Final composition runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineRemotionRenderRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw denied('Opened Remotion image does not match dispatch-time authority.')
      }
      const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (
        !mediaAuthority || !mediaAuthority.readiness.privateInternalExecutionReady ||
        mediaAuthority.readiness.productReady || mediaAuthority.readiness.finalExportReady
      ) throw denied('Independent pinned FFprobe final QA authority is unavailable.')
      const mediaRuntime = await openPrivateOfflineMediaBinaryRuntime()

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const sourceReadInput = {
        workspaceId: body.workspaceId, projectId: body.projectId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
        approvedWorkItem: workItem, approvedSourceManifest: authority.sourceAssetManifest,
        leaseId: injected.leaseId, executionAttemptId, dispatchGrantId: body.grantId,
      }
      const sourceReader = createCanonicalPrivateSourceObjectReadService(context)
      const sources = sequenceProfile
        ? await sourceReader.readExactApprovedSources(sourceReadInput)
        : [await sourceReader.readExactApprovedSource(sourceReadInput)]
      const dependencyReader = createCanonicalPrivateDependencyArtifactReadService(context)
      const dependencies: CanonicalPrivateDependencyArtifactReadResult[] = []
      for (
        let selectedArtifactIndex = 0;
        selectedArtifactIndex < expectedDependencyCount;
        selectedArtifactIndex += 1
      ) {
        dependencies.push(await dependencyReader.readSingleSelectedArtifact({
          workspaceId: body.workspaceId, projectId: body.projectId,
          editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
          currentJobId: body.jobId, currentApprovedWorkItemId: workItem.id,
          leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
          executionAttemptId, dispatchGrantId: body.grantId,
          dependencyAuthority: begun.lease.dependencyAuthority,
          allowedContentTypes: ['application/json', 'image/png'], maximumBytes: 8 * 1024 * 1024,
          selectedArtifactIndex,
        }))
      }
      const trimArtifact = dependencies.find((dependency) => dependency.contentType === 'application/json')
      const captionDependencies = dependencies.filter((dependency) => dependency.contentType === 'image/png')
      if (
        !trimArtifact || trimArtifact.byteLength > 1024 * 1024 ||
        captionDependencies.length !== captionCueCount || dependencies.length !== expectedDependencyCount
      ) {
        throw denied('Final composition dependencies must be one approved trim JSON and the exact caption artifacts.')
      }
      const captions = orderCaptionDependencies({
        captionDependencies,
        captionOutputKeys: captionTrackProfile
          ? planningPayload.captionOverlayCues.map((cue) => cue.outputKey)
          : undefined,
        authority,
      })
      const trimReadiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: trimArtifact.dependencyJobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const sourceTrim = parseApprovedSourceTrimEvidence({
        bytes: trimArtifact.bytes,
        body,
        snapshotId: authority.snapshot.snapshotId,
        workItemId: trimReadiness.job.approvedWorkItemId,
        sourceSequenceItemIds: workItem.sourceSequenceItemIds,
        sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
        approvedCleanupDecisions: exactCleanupDecisions,
        authorityHashes: readiness.authorityHashes,
        dependencyJobId: trimArtifact.dependencyJobId,
        expectedAssetId: trimArtifact.expectedAssetId,
      })
      const request = buildOfflineRemotionFinalCompositionRequest({
        planningPayload,
        ...(sequenceProfile
          ? {
              sources: sources.map((source) => ({
                sourceSequenceItemId: source.sourceSequenceItemId,
                mimeType: CONTENT_TYPE,
                bytes: source.bytes,
                sha256: source.sha256,
              })),
            }
          : {
              source: {
                mimeType: CONTENT_TYPE,
                bytes: sources[0]!.bytes,
                sha256: sources[0]!.sha256,
              },
            }),
        ...(captionTrackProfile
          ? {
              captionOverlays: captions.map((caption, index) => ({
                outputKey: planningPayload.captionOverlayCues[index]!.outputKey,
                mimeType: 'image/png' as const,
                bytes: caption.bytes,
                sha256: caption.sha256,
              })),
            }
          : {
              captionOverlay: {
                mimeType: 'image/png' as const,
                bytes: captions[0]!.bytes,
                sha256: captions[0]!.sha256,
              },
            }),
      })
      if (!isFinalCompositionPayload(request.payload)) {
        throw denied('Final composition request resolved to the wrong profile.')
      }
      const result = await runtime.execute(request)
      assertFinalResult(result, request)
      const probe = await mediaRuntime.execute(validateOfflineFfprobeExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffprobe', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        payload: {
          inspectionProfileId: 'final_export_v1', countFrames: true,
          verifyDurationAndSync: true, emitMachineJsonOnly: true,
          mimeType: CONTENT_TYPE, sourceByteLength: result.artifact.byteLength,
          sourceSha256: result.artifact.sha256,
          sourceBytesBase64: result.artifact.bytes.toString('base64'),
        },
      }))
      if (!('resultJson' in probe)) throw denied('Independent FFprobe returned the wrong final artifact class.')
      const qa = normalizeCanonicalPrivateFinalMediaQa(probe.resultJson.document, request.payload)

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_final_composition_mp4_v1',
        workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId, executionAttemptId,
        ...(sequenceProfile
          ? {
              sourceSequence: sources.map((source) => ({
                sourceSequenceItemId: source.sourceSequenceItemId,
                sha256: source.sha256,
              })),
            }
          : { sourceSha256: sources[0]!.sha256 }),
        sourceTrimSha256: trimArtifact.sha256,
        captionSha256s: captions.map((caption) => caption.sha256),
        contentSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateRemotionArtifact({
        localStorageRoot: context.env.localStorageRoot,
        privateObjectIdentityHash, bytes: result.artifact.bytes,
        expectedSha256: result.artifact.sha256,
      })
      const identity = {
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
      }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey,
        artifactType: expectedAsset.artifactType, assetRole: expectedAsset.assetRole,
        required: expectedAsset.required, previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType: CONTENT_TYPE, segmentIds: [...expectedAsset.segmentIds],
        timingIds: [...expectedAsset.timingIds], rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id, workItemKey: workItem.workItemKey,
        jobType: workItem.workItemType, jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: FinalCompositionAdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage,
        privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt,
        result, qa,
        sourceReadEvidenceHashes: sources.map((source) => source.sourceReadEvidenceHash),
        sourceTrimDependencyReadEvidenceHash: trimArtifact.dependencyReadEvidenceHash,
        captionDependencyReadEvidenceHashes: captions.map(
          (caption) => caption.dependencyReadEvidenceHash,
        ),
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({
        domain: 'canonical_final_composition_idempotency_v1', body, executionAttemptId,
      })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity, idempotencyKey: key('final-composition-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('final-composition-qa', keyHash),
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
        idempotencyKey: key('final-composition-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        !completed.executionFence.commitAuthorizedAt || !completed.executionFence.completedAt
      ) throw denied('Private final composition failed final QA or reconciliation.')
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId,
        access.workspaceId,
      )) !== beforeHash) throw denied('Canonical authority changed during final composition execution.')

      const captionInputs = captionTrackProfile
        ? {
            captionOverlays: captions.map((caption, index) => ({
              outputKey: planningPayload.captionOverlayCues[index]!.outputKey,
              startFrame: planningPayload.captionOverlayCues[index]!.startFrame,
              endFrameExclusive: planningPayload.captionOverlayCues[index]!.endFrameExclusive,
              captionArtifactId: caption.artifactId,
              captionSha256: caption.sha256,
              captionByteLength: caption.byteLength,
              captionDependencyReadEvidenceHash: caption.dependencyReadEvidenceHash,
            })),
          }
        : {
            captionArtifactId: captions[0]!.artifactId,
            captionSha256: captions[0]!.sha256,
            captionByteLength: captions[0]!.byteLength,
            captionDependencyReadEvidenceHash: captions[0]!.dependencyReadEvidenceHash,
          }
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-final-composition-execution-response-v2' as const,
        source: 'canonical_private_final_composition_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: 'remotion' as const, operationId: OFFLINE_REMOTION_RENDER_OPERATION,
          compositionProfileId: planningPayload.compositionProfileId,
          actualRemotionOperationCompleted: true as const, approvedSourceObjectRead: true as const,
          approvedSourceTrimDependencyRead: true as const,
          approvedSourceTrimFramesApplied: true as const,
          approvedCaptionDependencyRead: true as const,
          approvedCaptionTrackTimingApplied: captionTrackProfile,
          sourceAudioPreserved: true as const,
          privateFinalCompositionExecuted: true as const, providerCallMade: false as const,
          publicDeliveryExecuted: false as const,
        },
        inputs: sequenceProfile
          ? {
              sources: sources.map((source, index) => ({
                sourceSequenceItemId: source.sourceSequenceItemId,
                sourceMediaAssetId: source.mediaAssetId,
                sourceSha256: source.sha256,
                sourceByteLength: source.byteLength,
                sourceReadEvidenceHash: source.sourceReadEvidenceHash,
                sourceCleanupDecisionId: sourceTrim[index]!.decisionId,
                sourceStartFrame: sourceTrim[index]!.startFrame,
                sourceEndFrameExclusive: sourceTrim[index]!.endFrameExclusive,
                timelineStartFrame: planningPayload.sourceSegments[index]!.timelineStartFrame,
                timelineEndFrameExclusive: planningPayload.sourceSegments[index]!.timelineEndFrameExclusive,
              })),
              combinedSourceByteLength: sources.reduce((total, source) => total + source.byteLength, 0),
              sourceSequenceReadEvidenceHash: sha256ArtifactQaValue(
                sources.map((source) => source.sourceReadEvidenceHash),
              ),
              sourceTrimArtifactId: trimArtifact.artifactId,
              sourceTrimSha256: trimArtifact.sha256,
              sourceTrimByteLength: trimArtifact.byteLength,
              sourceTrimDependencyReadEvidenceHash: trimArtifact.dependencyReadEvidenceHash,
              ...captionInputs,
            }
          : {
              sourceSequenceItemId: sources[0]!.sourceSequenceItemId,
              sourceMediaAssetId: sources[0]!.mediaAssetId,
              sourceSha256: sources[0]!.sha256, sourceByteLength: sources[0]!.byteLength,
              sourceReadEvidenceHash: sources[0]!.sourceReadEvidenceHash,
              sourceTrimArtifactId: trimArtifact.artifactId,
              sourceTrimSha256: trimArtifact.sha256,
              sourceTrimByteLength: trimArtifact.byteLength,
              sourceTrimDependencyReadEvidenceHash: trimArtifact.dependencyReadEvidenceHash,
              sourceCleanupDecisionId: sourceTrim[0]!.decisionId,
              sourceStartFrame: sourceTrim[0]!.startFrame,
              sourceEndFrameExclusive: sourceTrim[0]!.endFrameExclusive,
              ...captionInputs,
            },
        lease: {
          leaseId: begun.lease.id, attemptNumber: begun.lease.attemptNumber,
          immutableLeaseHash: begun.lease.immutableLeaseHash, executionAttemptId,
          runnerClass: RUNNER_CLASS, executionStartedAt: completed.executionFence.startedAt,
          executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt!,
          executionCompletedAt: completed.executionFence.completedAt!,
          credentialReturned: false as const, credentialHashReturned: false as const,
        },
        runtime: {
          runtimeAuthorityHash: runtimeAuthority.authorityHash,
          imageIdentityHash: runtime.image.imageIdentityHash,
          executionAttestationHash: result.attestation.attestationHash,
          requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
          resultSha256: result.artifact.sha256,
          packageName: result.evidence.packageName, packageVersion: result.evidence.packageVersion,
          privateInternalFinalCompositionReady: true as const,
          productReady: false as const, externalBetaReady: false as const, productionReady: false as const,
        },
        qa,
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          assetRole: 'final' as const, contentType: CONTENT_TYPE,
          sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateFinalArtifactRecorded: true as const,
          publicDeliveryAuthorized: false as const, settlementAuthorized: false as const,
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
          furtherWorkerDispatch: false as const, providerCall: false as const,
          sourceObjectRead: false as const, furtherRender: false as const,
          publicDelivery: false as const, creditSpend: false as const,
          walletMutation: false as const, settlement: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const,
          contentAddressedArtifactAuthority: true as const,
          actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const,
          checksumProtectedAuthority: true as const,
          distributedAuthority: false as const, productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalPrivateFinalCompositionResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface ApprovedSourceTrimEvidence {
  decisionId: string
  sourceSequenceItemId: string
  action: string
  startFrame: number
  endFrameExclusive: number
}

function orderCaptionDependencies(input: {
  captionDependencies: CanonicalPrivateDependencyArtifactReadResult[]
  captionOutputKeys?: string[]
  authority: ApprovedExecutionAuthority
}): CanonicalPrivateDependencyArtifactReadResult[] {
  const byOutputKey = new Map<string, CanonicalPrivateDependencyArtifactReadResult>()
  for (const dependency of input.captionDependencies) {
    const asset = input.authority.assetManifest.entries.find((candidate) =>
      candidate.id === dependency.expectedAssetId)
    const workItem = input.authority.workItems.find((candidate) =>
      candidate.id === asset?.approvedWorkItemId)
    if (
      !asset || !workItem || asset.contentType !== 'image/png' ||
      asset.assetRole !== 'processed' || !asset.required || asset.previewPlaceholderAllowed ||
      workItem.workerClass !== 'render_worker' || workItem.workItemType !== 'custom' ||
      workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'libass' ||
      byOutputKey.has(asset.outputKey)
    ) throw denied('Caption dependency lineage is not an exact approved libass artifact.')
    byOutputKey.set(asset.outputKey, dependency)
  }
  const outputKeys = input.captionOutputKeys ?? [...byOutputKey.keys()]
  const ordered = outputKeys.map((outputKey) => byOutputKey.get(outputKey))
  if (
    ordered.some((dependency) => !dependency) || ordered.length !== byOutputKey.size ||
    new Set(outputKeys).size !== outputKeys.length
  ) throw denied('Caption dependency artifacts do not match the approved output-key order.')
  return ordered as CanonicalPrivateDependencyArtifactReadResult[]
}

function parseApprovedSourceTrimEvidence(input: {
  bytes: Buffer
  body: RunCanonicalPrivateFinalCompositionInput
  snapshotId: string
  workItemId: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  approvedCleanupDecisions: Array<{
    decisionId: string
    sourceSequenceItemId: string
    action: string
    startFrame: number
    endFrameExclusive: number
    reason: string
    confidence: number
    meaningPreservationStatus: 'passed' | 'warning'
    userReviewStatus: 'not_required' | 'resolved'
  }>
  authorityHashes: {
    snapshotHash: string
    sourceSequenceHash: string
    approvedAssetManifestHash: string
  }
  dependencyJobId: string
  expectedAssetId: string
}): ApprovedSourceTrimEvidence[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(input.bytes.toString('utf8'))
  } catch {
    throw denied('Approved source trim dependency is not valid JSON.')
  }
  const report = objectRecord(parsed, 'source trim report')
  const identity = objectRecord(report.identity, 'source trim identity')
  const authorityHashes = objectRecord(report.authorityHashes, 'source trim authority hashes')
  const expectedDecisions = input.approvedCleanupDecisions.map((decision) => ({
    decisionId: decision.decisionId,
    sourceSequenceItemId: decision.sourceSequenceItemId,
    action: decision.action,
    startFrame: decision.startFrame,
    endFrameExclusive: decision.endFrameExclusive,
    reasonHash: createHash('sha256').update(decision.reason).digest('hex'),
    confidence: decision.confidence,
    meaningPreservationStatus: decision.meaningPreservationStatus,
    userReviewStatus: decision.userReviewStatus,
  }))
  const expectedSourceTrim = {
    status: 'confirmed',
    sourceSequenceItemIds: input.sourceSequenceItemIds,
    sourceCleanupDecisionIds: input.sourceCleanupDecisionIds,
    decisionCount: expectedDecisions.length,
    decisions: expectedDecisions,
    meaningPreservationValidated: true,
    unresolvedUserReview: false,
  }
  if (
    report.schemaVersion !== 'canonical-authority-validation-artifact-v1' ||
    report.source !== 'immutable_canonical_edit_authority' ||
    report.validationProfile !== 'source_trim' || report.valid !== true ||
    identity.workspaceId !== input.body.workspaceId || identity.projectId !== input.body.projectId ||
    identity.editSessionId !== input.body.editSessionId || identity.snapshotId !== input.snapshotId ||
    identity.jobId !== input.dependencyJobId || identity.approvedWorkItemId !== input.workItemId ||
    identity.expectedAssetId !== input.expectedAssetId ||
    authorityHashes.snapshotHash !== input.authorityHashes.snapshotHash ||
    authorityHashes.sourceSequenceHash !== input.authorityHashes.sourceSequenceHash ||
    authorityHashes.approvedAssetManifestHash !== input.authorityHashes.approvedAssetManifestHash ||
    stableArtifactQaStringify(report.sourceTrim) !== stableArtifactQaStringify(expectedSourceTrim)
  ) throw denied('Approved source trim dependency diverged from current immutable plan authority.')
  return expectedDecisions
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw denied(`Approved ${label} has an invalid object shape.`)
  }
  return value as Record<string, unknown>
}

interface FinalCompositionAdapterInput {
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
  result: OfflineRemotionRenderResult
  qa: CanonicalPrivateFinalMediaQa
  sourceReadEvidenceHashes: string[]
  sourceTrimDependencyReadEvidenceHash: string
  captionDependencyReadEvidenceHashes: string[]
}

function adapters(input: FinalCompositionAdapterInput): {
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
              sourceReadEvidenceHashes: input.sourceReadEvidenceHashes,
              sourceTrimDependencyReadEvidenceHash: input.sourceTrimDependencyReadEvidenceHash,
              captionDependencyReadEvidenceHashes: input.captionDependencyReadEvidenceHashes,
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
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
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
            notesCode: 'final_mp4_hash_size_signature_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const,
            category: 'render_composition' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: input.qa.reportSha256,
            notesCode: 'final_h264_aac_frame_audio_duration_qa_passed',
          }, {
            gateId: 'render_preflight_gate' as const,
            category: 'render_composition' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              sourceReadEvidenceHashes: input.sourceReadEvidenceHashes,
              sourceTrimDependencyReadEvidenceHash: input.sourceTrimDependencyReadEvidenceHash,
              captionDependencyReadEvidenceHashes: input.captionDependencyReadEvidenceHashes,
            }),
            notesCode: 'approved_source_trim_caption_dependency_and_frame_preflight_passed',
          }, {
            gateId: 'final_qa_gate' as const,
            category: 'asset_integrity' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              artifactSha256: input.result.artifact.sha256,
              qa: input.qa,
            }),
            notesCode: 'private_final_composition_independent_qa_passed',
          }],
          recovery: {
            state: 'none' as const, action: 'none' as const,
            approvedWithinSnapshot: true,
            reasonCode: 'private_final_composition_pass_no_recovery',
          },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: 'actual_remotion_mp4_ffprobe_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

function assertFinalResult(
  result: OfflineRemotionRenderResult,
  request: ReturnType<typeof buildOfflineRemotionFinalCompositionRequest>,
): void {
  const sequenceProfile = isFinalCompositionPayload(request.payload) &&
    'sourceSegments' in request.payload
  const captionTrackProfile = isFinalCompositionPayload(request.payload) &&
    'captionOverlayCues' in request.payload
  if (
    !isFinalCompositionPayload(request.payload) || !isFinalCompositionPayload(result.request.payload) ||
    result.request.operationId !== request.operationId || result.artifact.mimeType !== CONTENT_TYPE ||
    result.artifact.width !== request.payload.width || result.artifact.height !== request.payload.height ||
    result.artifact.fps !== request.payload.fps ||
    result.artifact.durationFrames !== request.payload.durationFrames ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.evidence.semanticEvidence.approvedSourceBytesVerified !== true ||
    result.evidence.semanticEvidence.approvedSourceTrimFramesApplied !== true ||
    result.evidence.semanticEvidence.approvedCaptionOverlayBytesVerified !== true ||
    result.evidence.semanticEvidence.sourceAudioPreservationRequested !== true ||
    result.evidence.semanticEvidence.finalCompositionProfileExecuted !== true ||
    (sequenceProfile && (
      result.evidence.semanticEvidence.approvedSourceSequenceBytesVerified !== true ||
      result.evidence.semanticEvidence.approvedSourceSequenceTimelineApplied !== true
    )) ||
    (captionTrackProfile &&
      result.evidence.semanticEvidence.approvedCaptionTrackTimingApplied !== true) ||
    result.readiness.productReady || !result.readiness.privateInternalFinalCompositionReady
  ) throw denied('Remotion final composition result failed exact operation and dependency verification.')
}

async function assertStored(input: FinalCompositionAdapterInput) {
  const stored = await readCanonicalPrivateRemotionArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== input.result.artifact.sha256 ||
    stored.byteLength !== input.result.artifact.byteLength ||
    !stored.bytes.equals(input.result.artifact.bytes)
  ) throw denied('Private final MP4 bytes changed before artifact authority.')
  return stored
}

function assertLineage(
  identity: Record<string, unknown>,
  lineage: CanonicalExpectedArtifactLineage,
  input: FinalCompositionAdapterInput,
): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)
  ) throw denied('Final composition adapter received different canonical lineage.')
}

function assertPersisted(
  artifact: PersistedArtifactResult,
  input: FinalCompositionAdapterInput,
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
  ) throw denied('Persisted final composition does not match actual-run evidence.')
}

function key(prefix: string, hash: string): string { return `${prefix}-${hash.slice(0, 56)}` }
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function denied(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_final_composition_execution_authority',
  })
}
