import type { ZodType } from 'zod'

import {
  assertCanonicalMotionStudioRemotionWorkItem,
  assertCanonicalMotionStudioRemotionDependencyArtifact,
  buildCanonicalMotionStudioRemotionExecutionRequest,
  resolveCanonicalMotionStudioRemotionProfile,
  type CanonicalMotionStudioRemotionProfileId,
} from '../edit-architecture/canonical-motion-studio-remotion-preview-authority'
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
  OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
  validateOfflineRemotionRenderRequest,
  type OfflineRemotionRenderResult,
} from '../tool-execution/remotion-render-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateRemotionAuthoritySchema,
  canonicalPrivateRemotionResponseSchema,
  runCanonicalPrivateRemotionSchema,
  type CanonicalPrivateRemotionAuthority,
  type CanonicalPrivateRemotionResponse,
  type RunCanonicalPrivateRemotionInput,
} from '../validation/canonical-private-remotion-execution-schemas'
import type { CanonicalExpectedArtifactLineage, PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import {
  createCanonicalPrivateDependencyArtifactReadService,
  type CanonicalPrivateDependencyArtifactReadResult,
} from './canonical-private-dependency-artifact-read-service'
import { recordCanonicalPrivateEmbeddedWorkerResourceUsage } from './canonical-private-embedded-worker-resource-usage-recorder'
import { persistCanonicalPrivateRemotionArtifact, readCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-storage'
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

export function createCanonicalPrivateRemotionExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateRemotionInput,
      serverAuthority: CanonicalPrivateRemotionAuthority,
    ): Promise<CanonicalPrivateRemotionResponse> {
      const body = parse(runCanonicalPrivateRemotionSchema, input, 'Remotion execution identity is invalid.')
      const injected = parse(canonicalPrivateRemotionAuthoritySchema, serverAuthority, 'Remotion execution authority is invalid.')
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('Remotion actor is outside this workspace.')

      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId, grantId: body.grantId,
        purpose: 'private_internal_canonical_tool_dispatch_consume', idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      if (
        binding.canonicalToolId !== 'remotion' || binding.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
        binding.leaseId !== injected.leaseId || binding.jobId !== body.jobId ||
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        !dispatch.executionAuthority.privatePreviewRenderAuthorized ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match Remotion execution identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(readiness.job.approvedPlanSnapshotId, access.workspaceId)
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('Remotion work-item or output lineage is missing.')
      const motionStudioProfile = resolveCanonicalMotionStudioRemotionProfile(
        workItem.executionInput.structuredPayload,
      )
      if (motionStudioProfile) {
        assertCanonicalMotionStudioRemotionWorkItem(workItem, motionStudioProfile)
      }
      if (
        workItem.workItemType !== 'render_remotion_preview' ||
        workItem.sourceSequenceItemIds.length !== 0 ||
        workItem.sourceCleanupDecisionIds.length !== 0 ||
        workItem.dependencyKeys.length !== (motionStudioProfile?.dependencyCount ?? 0) ||
        dispatch.grant.binding.leaseDependencyAuthority.selectedArtifactCount !==
          (motionStudioProfile?.dependencyCount ?? 0) ||
        expectedAsset.contentType !== CONTENT_TYPE || binding.expectedOutput.contentType !== CONTENT_TYPE ||
        expectedAsset.assetRole !== 'preview' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id || binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) throw denied('Remotion execution is limited to an exact approved private preview MP4 and its frozen dependency authority.')
      const genericRequest = motionStudioProfile
        ? undefined
        : validateOfflineRemotionRenderRequest({
            schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
            toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
            payload: workItem.executionInput.structuredPayload,
          })

      const runtimeAuthority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
        !runtimeAuthority.supportedOperations.some((operation) =>
          operation.toolId === 'remotion' && operation.operationId === binding.operationId)
      ) throw denied('Remotion runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineRemotionRenderRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw denied('Opened Remotion image does not match dispatch-time authority.')
      }
      const mediaAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
      if (!mediaAuthority || !mediaAuthority.readiness.privateInternalExecutionReady || mediaAuthority.readiness.finalExportReady) {
        throw denied('Independent pinned FFprobe QA authority is unavailable.')
      }
      const mediaRuntime = await openPrivateOfflineMediaBinaryRuntime()

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const dependency = motionStudioProfile?.dependencyCount === 1
        ? await createCanonicalPrivateDependencyArtifactReadService(context)
            .readSingleSelectedArtifact({
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
              allowedContentTypes: [motionStudioProfile.dependencyContentType!],
              maximumBytes: motionStudioProfile.maximumDependencyBytes!,
            })
        : undefined
      if (motionStudioProfile && dependency) {
        assertCanonicalMotionStudioRemotionDependencyArtifact({
          workItem,
          dependency,
        })
      }
      const request = motionStudioProfile
        ? buildCanonicalMotionStudioRemotionExecutionRequest({
            planningPayload: workItem.executionInput.structuredPayload,
            ...(dependency
              ? {
                  dependency: {
                    contentType: dependency.contentType as 'image/png' | 'audio/wav',
                    bytes: dependency.bytes,
                    sha256: dependency.sha256,
                  },
                }
              : {}),
          })
        : genericRequest!
      const result = await runtime.execute(request)
      assertRemotionResult(result, request, runtimeAuthority.authorityHash)
      const probe = await mediaRuntime.execute(validateOfflineFfprobeExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffprobe', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        payload: {
          inspectionProfileId: 'pre_render_v1', countFrames: true,
          verifyDurationAndSync: true, emitMachineJsonOnly: true,
          mimeType: CONTENT_TYPE, sourceByteLength: result.artifact.byteLength,
          sourceSha256: result.artifact.sha256, sourceBytesBase64: result.artifact.bytes.toString('base64'),
        },
      }))
      if (!('resultJson' in probe)) throw denied('Independent FFprobe returned the wrong artifact class.')
      const qa = normalizeProbe(probe.resultJson.document, request)
      const motionStudioFrameGoldenEvidenceHash = motionStudioProfile
        ? sha256AuthorityValue(result.attestation.frameArtifactDigests)
        : undefined

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_remotion_mp4_v1', workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
        expectedAssetId: expectedAsset.id, dispatchGrantId: body.grantId,
        executionAttemptId, contentSha256: result.artifact.sha256,
        motionStudioCompositionProfileId: motionStudioProfile?.profileId,
        dependencyReadEvidenceHash: dependency?.dependencyReadEvidenceHash,
        motionStudioFrameGoldenEvidenceHash,
      })
      await persistCanonicalPrivateRemotionArtifact({
        localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash,
        bytes: result.artifact.bytes, expectedSha256: result.artifact.sha256,
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
        contentType: CONTENT_TYPE, segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds], approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey, jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: RemotionAdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage,
        privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt, result, qa,
        motionStudioCompositionProfileId: motionStudioProfile?.profileId,
        dependency,
        motionStudioFrameGoldenEvidenceHash,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_remotion_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity, idempotencyKey: key('remotion-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('remotion-qa', keyHash), purpose: 'record_server_verified_internal_artifact_qa',
      })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS, executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: key('remotion-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        !completed.executionFence.commitAuthorizedAt || !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Remotion preview failed QA or reconciliation.', 409)
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId, access.workspaceId,
      )) !== beforeHash) throw denied('Canonical authority changed during Remotion execution.')

      const resourceUsage = await recordCanonicalPrivateEmbeddedWorkerResourceUsage({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        approvedPlanSnapshotId: authority.snapshot.snapshotId,
        approvedPlanSnapshotHash: readiness.authorityHashes.snapshotHash,
        packageRecordId: readiness.executionPackage.packageRecordId,
        packageHash: readiness.executionPackage.packageHash,
        approvedWorkItemId: workItem.id,
        approvedWorkItemHash: sha256AuthorityValue(workItem),
        jobId: body.jobId,
        executionAttemptId,
        attemptOrdinal: completed.lease.attemptNumber,
        leaseId: completed.lease.id,
        leaseHash: completed.lease.immutableLeaseHash,
        leaseExpiresAt: completed.lease.expiresAt,
        dispatchGrantId: body.grantId,
        dispatchGrantHash: dispatch.grant.immutableGrantHash,
        idempotencyKey: body.idempotencyKey,
        canonicalToolId: 'remotion',
        operationId: binding.operationId,
        runnerClass: RUNNER_CLASS,
        runtimeAuthorityDigest: runtimeAuthority.authorityHash,
        runtimeImageDigest: runtime.image.imageIdentityHash,
        runtimeAttestationDigest: result.attestation.attestationHash,
        observation: result.evidence.resourceObservation,
        allocation: {
          nanoCpus: result.evidence.confinement.nanoCpus,
          memoryLimitBytes: result.evidence.confinement.memoryLimitBytes,
        },
        attemptInputHash: result.evidence.requestEnvelopeSha256,
        inputArtifacts: [{
          artifactId: `${workItem.id}:approved_remotion_request`,
          sha256: result.evidence.requestEnvelopeSha256,
          byteLength: Buffer.byteLength(stableArtifactQaStringify(request), 'utf8'),
        }, ...(dependency
          ? [{
              artifactId: dependency.artifactId,
              sha256: dependency.sha256,
              byteLength: dependency.byteLength,
            }]
          : [])],
        outputArtifact: {
          artifactId: artifactResult.artifact.artifactId,
          sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
        },
        createdAt: reconciliation.reconciliation.createdAt,
      })
      if (
        resourceUsage.evidence.identity.executionAttemptId !== executionAttemptId
        || resourceUsage.evidence.identity.jobId !== body.jobId
        || resourceUsage.evidence.operation.kind !== 'registered_tool_operation'
        || resourceUsage.evidence.operation.operationId !== binding.operationId
        || resourceUsage.evidence.output.artifacts[0]?.sha256 !==
          artifactResult.artifact.content.sha256
      ) {
        throw denied('Remotion resource evidence lost canonical attempt or output authority.')
      }

      const responseWithoutHash = {
        schemaVersion: 'canonical-private-remotion-execution-response-v2' as const,
        source: 'canonical_private_remotion_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: 'remotion' as const, operationId: OFFLINE_REMOTION_RENDER_OPERATION,
          actualRemotionOperationCompleted: true as const, providerCallMade: false as const,
          sourceObjectRead: false as const, privatePreviewRenderExecuted: true as const,
          finalExportExecuted: false as const,
          ...(motionStudioProfile
            ? { motionStudioCompositionProfileId: motionStudioProfile.profileId }
            : {}),
          dependencyArtifactRead: dependency !== undefined,
          ...(dependency
            ? {
                dependencyReadEvidenceHash: dependency.dependencyReadEvidenceHash,
                sourceArtifactId: dependency.artifactId,
                sourceArtifactSha256: dependency.sha256,
                sourceArtifactContentType: dependency.contentType as 'image/png' | 'audio/wav',
              }
            : {}),
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
          runtimeAuthorityHash: runtimeAuthority.authorityHash, imageIdentityHash: runtime.image.imageIdentityHash,
          executionAttestationHash: result.attestation.attestationHash,
          requestEnvelopeSha256: result.evidence.requestEnvelopeSha256, resultSha256: result.artifact.sha256,
          packageName: result.evidence.packageName, packageVersion: result.evidence.packageVersion,
          privateInternalOnly: true as const, productReady: false as const,
          externalBetaReady: false as const, productionReady: false as const, finalExportReady: false as const,
        },
        qa: {
          ...qa,
          independentFfprobeExecuted: true as const,
          binaryVersion: '8.1.2' as const,
          ...(motionStudioProfile
            ? {
                motionStudioFrameGoldenCount: result.attestation.frameArtifactDigests.length,
                motionStudioFrameGoldenEvidenceHash: motionStudioFrameGoldenEvidenceHash!,
              }
            : {}),
        },
        result: {
          artifactId: artifactResult.artifact.artifactId, qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion, contentType: CONTENT_TYPE,
          sha256: artifactResult.artifact.content.sha256, byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const, reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const, liveRuntimeDependencySatisfied: false as const,
          finalRenderAuthorized: false as const, finalExportAuthorized: false as const,
        },
        resourceUsage: {
          evidenceClass: resourceUsage.evidence.evidenceClass,
          evidenceId: resourceUsage.evidence.evidenceId,
          evidenceHash: resourceUsage.evidence.evidenceHash,
          attemptIdentityHash: resourceUsage.evidence.attemptIdentityHash,
          attemptInputHash: resourceUsage.evidence.attemptInputHash,
          operationProfileId: resourceUsage.evidence.operation.operationProfileId,
          operationProfileHash: resourceUsage.evidence.operation.operationProfileHash,
          runtimeExecutionIdentityDigest:
            resourceUsage.evidence.runtime.runtimeExecutionIdentityDigest,
          containerIdentityDigest: resourceUsage.evidence.runtime.containerIdentityDigest,
          measurementAgentVersion: resourceUsage.evidence.runtime.measurementAgentVersion,
          measurementAgentDigest: resourceUsage.evidence.runtime.measurementAgentDigest,
          inputManifestHash: resourceUsage.evidence.input.manifestHash,
          outputManifestHash: resourceUsage.evidence.output.manifestHash,
          measurementClass: resourceUsage.evidence.resourceUsage.measurementClass,
          startedAt: resourceUsage.evidence.resourceUsage.startedAt,
          finishedAt: resourceUsage.evidence.resourceUsage.finishedAt,
          wallTimeMilliseconds: resourceUsage.evidence.resourceUsage.wallTimeMilliseconds,
          observedCpuMicroseconds:
            resourceUsage.evidence.resourceUsage.observedCpuMicroseconds,
          observedPeakMemoryBytes:
            resourceUsage.evidence.resourceUsage.observedPeakMemoryBytes,
          infrastructureEvidenceDigest:
            resourceUsage.evidence.resourceUsage.infrastructureEvidenceDigest,
          rateCardVersion: resourceUsage.evidence.infrastructureCost.rateCardVersion,
          rateCardDigest: resourceUsage.evidence.infrastructureCost.rateCardDigest,
          actualInternalCostMicros:
            resourceUsage.evidence.infrastructureCost.actualInternalCostMicros,
          rateAuthorityClass:
            resourceUsage.evidence.infrastructureCost.rateAuthorityClass,
          providerCostIncluded: false as const,
          customerPriceIncluded: false as const,
          customerCreditsIncluded: false as const,
          serviceFeeIncluded: false as const,
          walletMutationPerformed: false as const,
          billingMutationPerformed: false as const,
          observedUsageTransportQualified: false as const,
          productionRateAuthority: false as const,
          productionReady: false as const,
        },
        replay: {
          dispatchConsumptionReplayed: dispatch.consumptionReplayed,
          executionFenceBeginReplayed: begun.replayed, executionFenceCompleteReplayed: completed.replayed,
          artifactRecordReplayed: artifactResult.replayed, qaRecordReplayed: qaResult.replayed,
          reconciliationReplayed: reconciliation.replayed, sameIdempotentAttemptOnly: true as const,
        },
        permissions: {
          furtherWorkerDispatch: false as const, providerCall: false as const, sourceObjectRead: false as const,
          furtherRender: false as const, finalExport: false as const, creditSpend: false as const,
          walletMutation: false as const, settlement: false as const, delivery: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const, contentAddressedArtifactAuthority: true as const,
          actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const,
          checksumProtectedAuthority: true as const, distributedAuthority: false as const, productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt, testOnly: true as const,
      }
      return canonicalPrivateRemotionResponseSchema.parse({
        ...responseWithoutHash, responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface RemotionQa {
  codecName: 'h264'; pixelFormat: 'yuv420p'; colorSpace: 'bt709'
  width: number; height: number; fps: number; frameCount: number; durationSeconds: number; reportSha256: string
}
interface RemotionAdapterInput {
  localStorageRoot: string
  identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  result: OfflineRemotionRenderResult
  qa: RemotionQa
  motionStudioCompositionProfileId?: CanonicalMotionStudioRemotionProfileId
  dependency?: CanonicalPrivateDependencyArtifactReadResult
  motionStudioFrameGoldenEvidenceHash?: string
}

function adapters(input: RemotionAdapterInput): { producedArtifact: ServerInjectedArtifactResultAdapter; artifactQa: ServerInjectedArtifactQaAdapter } {
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
          content: { sha256: input.result.artifact.sha256, byteLength: input.result.artifact.byteLength, contentType: CONTENT_TYPE },
          storageIdentity: { storageKind: 'private_local_test' as const, opaqueObjectIdentityHash: input.privateObjectIdentityHash },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: {
            state: 'actual_run_evidence_verified_v2' as const,
            executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS,
            runnerEvidenceHash: sha256ArtifactQaValue({
              runtimeEvidence: input.result.evidence,
              motionStudioCompositionProfileId: input.motionStudioCompositionProfileId,
              dependencyReadEvidenceHash: input.dependency?.dependencyReadEvidenceHash,
              motionStudioFrameGoldenEvidenceHash: input.motionStudioFrameGoldenEvidenceHash,
            }),
            startedAt: input.executionStartedAt, finishedAt: input.result.attestation.completedAt,
            exitCode: 0 as const, toolIds: ['remotion'], actualRunVerified: true as const,
            dispatchGrantId: input.dispatchGrantId, runtimeAuthorityHash: input.runtimeAuthorityHash,
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
            gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              content: adapterInput.artifact.content,
              storageIdentity: adapterInput.artifact.storageIdentity,
              motionStudioCompositionProfileId: input.motionStudioCompositionProfileId,
              dependencyReadEvidenceHash: input.dependency?.dependencyReadEvidenceHash,
              motionStudioFrameGoldenEvidenceHash: input.motionStudioFrameGoldenEvidenceHash,
            }),
            notesCode: 'remotion_mp4_hash_size_private_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const, category: 'visual_assets' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              ffprobeReportSha256: input.qa.reportSha256,
              motionStudioFrameGoldenEvidenceHash: input.motionStudioFrameGoldenEvidenceHash,
            }),
            notesCode: input.motionStudioCompositionProfileId
              ? 'independent_ffprobe_and_motion_studio_frame_golden_qa_passed'
              : 'independent_ffprobe_h264_frame_timing_pixel_format_color_qa_passed',
          }],
          recovery: { state: 'none' as const, action: 'none' as const, approvedWithinSnapshot: true, reasonCode: 'remotion_preview_pass_no_recovery' },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: 'actual_remotion_mp4_ffprobe_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

function normalizeProbe(document: Readonly<Record<string, unknown>>, request: ReturnType<typeof validateOfflineRemotionRenderRequest>): RemotionQa {
  const streams = Array.isArray(document.streams) ? document.streams as Array<Record<string, unknown>> : []
  const video = streams.find((stream) => stream.codecType === 'video')
  const report = {
    codecName: video?.codecName, pixelFormat: video?.pixelFormat, colorSpace: video?.colorSpace,
    colorTransfer: video?.colorTransfer, colorPrimaries: video?.colorPrimaries,
    colorRange: video?.colorRange,
    width: video?.width, height: video?.height, fps: video?.fps,
    frameCount: video?.readFrameCount, durationSeconds: document.durationSeconds,
  }
  if (
    report.codecName !== 'h264' || report.pixelFormat !== 'yuv420p' || report.colorSpace !== 'bt709' ||
    report.colorTransfer !== 'bt709' || report.colorPrimaries !== 'bt709' || report.colorRange !== 'tv' ||
    report.width !== request.payload.width || report.height !== request.payload.height ||
    report.fps !== request.payload.fps || report.frameCount !== request.payload.durationFrames ||
    report.durationSeconds !== Number((request.payload.durationFrames / request.payload.fps).toFixed(6))
  ) throw denied('Independent FFprobe QA does not match approved Remotion frame and codec policy.')
  return {
    codecName: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709',
    width: Number(report.width), height: Number(report.height), fps: Number(report.fps),
    frameCount: Number(report.frameCount), durationSeconds: Number(report.durationSeconds),
    reportSha256: sha256AuthorityValue(report),
  }
}
function assertRemotionResult(result: OfflineRemotionRenderResult, request: ReturnType<typeof validateOfflineRemotionRenderRequest>, runtimeAuthorityHash: string): void {
  if (
    result.schemaVersion !== 'offline-remotion-render-execution-result-v2' ||
    result.request.operationId !== request.operationId || result.artifact.mimeType !== CONTENT_TYPE ||
    result.artifact.width !== request.payload.width || result.artifact.height !== request.payload.height ||
    result.artifact.fps !== request.payload.fps || result.artifact.durationFrames !== request.payload.durationFrames ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled || result.readiness.productReady ||
    result.evidence.resourceObservation.observerKind !== 'remotion_container_cgroup_v2_v1' ||
    result.evidence.resourceObservation.measurementAgentVersion !==
      'embedded_remotion_cgroup_v2_observer_v1' ||
    result.attestation.resourceObservationHash !==
      result.evidence.resourceObservation.observationHash ||
    result.evidence.confinement.cgroupV2ResourceObservationRequired !== true ||
    result.readiness.canonicalDispatchIntegrated || !/^[a-f0-9]{64}$/.test(runtimeAuthorityHash)
  ) throw denied('Remotion runtime result failed exact operation and output verification.')
}
async function assertStored(input: RemotionAdapterInput) {
  const stored = await readCanonicalPrivateRemotionArtifact({ localStorageRoot: input.localStorageRoot, privateObjectIdentityHash: input.privateObjectIdentityHash })
  if (!stored || stored.sha256 !== input.result.artifact.sha256 || stored.byteLength !== input.result.artifact.byteLength || !stored.bytes.equals(input.result.artifact.bytes)) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Remotion MP4 bytes changed before artifact authority.', 409)
  }
  return stored
}
function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: RemotionAdapterInput): void {
  if (stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) || stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)) {
    throw denied('Remotion adapter received different canonical lineage.')
  }
}
function assertPersisted(artifact: PersistedArtifactResult, input: RemotionAdapterInput): void {
  if (
    artifact.artifactVersion !== 1 || artifact.content.sha256 !== input.result.artifact.sha256 ||
    artifact.content.byteLength !== input.result.artifact.byteLength || artifact.content.contentType !== CONTENT_TYPE ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash || artifact.placeholder.isPlaceholder ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId ||
    artifact.actualRunEvidence.executionAttemptId !== input.executionAttemptId
  ) throw denied('Persisted Remotion result does not match actual-run evidence.')
}
function key(prefix: string, hash: string): string { return `${prefix}-${hash.slice(0, 56)}` }
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function denied(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_remotion_execution_authority',
  })
}
