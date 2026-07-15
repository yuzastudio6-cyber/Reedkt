import { createHash } from 'node:crypto'

import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import { resolveProfessionalExportFrame } from '../../src/lib/professional-export-policy'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfmpegPlanningPayload,
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
import {
  CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES,
  createCanonicalPrivateSourceObjectReadService,
  type CanonicalPrivateStagedSourceReadResult,
} from './canonical-private-source-object-read-service'
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
      const exportCoverage = authority.components.confirmedSettings.professionalExportCoverage
      const exactFourKFrame = resolveProfessionalExportFrame(
        exportCoverage.approvedAspectRatio,
        'uhd_2160',
      )
      const exportEstimateLine = authority.estimate.lineItems.find((lineItem) =>
        lineItem.label === '4K UHD render and export ceiling')
      if (
        authority.components.confirmedSettings.outputFramePurpose !==
          'private_canonical_4k_master_review' ||
        authority.components.confirmedSettings.outputFrame.width !== exactFourKFrame.width ||
        authority.components.confirmedSettings.outputFrame.height !== exactFourKFrame.height ||
        planningPayload.width !== exactFourKFrame.width ||
        planningPayload.height !== exactFourKFrame.height ||
        planningPayload.renderPurpose !== 'private_4k_delivery_master_v1' ||
        planningPayload.deliveryProfileId !== 'uhd_2160' ||
        planningPayload.estimateCostBasisProfileId !== 'uhd_2160' ||
        planningPayload.sourceQualityPolicy !== 'immutable_source_master_no_proxy_v1' ||
        planningPayload.usesApprovedEditReservation !== true ||
        planningPayload.requiresSeparateExportEstimate !== false ||
        planningPayload.allowsAdditionalExportCharge !== false ||
        exportCoverage.assumption !== 'always_estimate_4k_uhd' ||
        exportCoverage.costBasisProfileId !== 'uhd_2160' ||
        exportCoverage.defaultDeliveryProfileId !== 'uhd_2160' ||
        exportCoverage.includedInInitialEstimate !== true ||
        exportCoverage.usesApprovedEditReservation !== true ||
        exportCoverage.requiresSeparateExportEstimate !== false ||
        exportCoverage.allowsAdditionalExportCharge !== false ||
        !exportEstimateLine || exportEstimateLine.removable ||
        exportEstimateLine.estimatedCredits !== exportCoverage.maximumInternalToolCostCredits ||
        authority.snapshot.estimateId !== authority.estimate.id ||
        authority.snapshot.estimateId !== authority.reservation.estimateId ||
        authority.snapshot.estimateId !== authority.approval.estimateId ||
        authority.snapshot.reservationId !== authority.reservation.id ||
        authority.snapshot.reservationId !== authority.approval.reservationId ||
        authority.estimate.status !== 'approved' ||
        !['reserved', 'partially_spent'].includes(authority.reservation.status)
      ) throw denied(
        'Final composition is not the exact 4K delivery master covered by the original approved estimate and reservation.',
      )
      const sequenceProfile = 'sourceSegments' in planningPayload
      const captionTrackProfile = 'captionOverlayCues' in planningPayload
      const replaceVoice = planningPayload.audioPolicy === 'replace_with_approved_voice_tracks'
      const captionCueCount = captionTrackProfile ? planningPayload.captionOverlayCues.length : 1
      const sourceCount = sequenceProfile
        ? planningPayload.sourceSegments.length
        : 1
      const voiceTrackCount = replaceVoice ? (planningPayload.voiceTracks?.length ?? 0) : 0
      const dependencyWorkItems = workItem.dependencyKeys.map((dependencyKey) =>
        authority.workItems.find((candidate) => candidate.workItemKey === dependencyKey))
      if (dependencyWorkItems.some((candidate) => !candidate)) {
        throw denied('Final composition dependency work-item authority is incomplete.')
      }
      const colorDependencyWorkItemCount = dependencyWorkItems.filter((candidate) =>
        candidate?.expectedOutputs.length === 1 &&
        candidate.expectedOutputs[0]?.contentType === 'video/x-matroska').length
      const usesApprovedColorIntermediate = 'sourceMediaPolicy' in planningPayload &&
        planningPayload.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
      const colorSourceCount = usesApprovedColorIntermediate ? sourceCount : 0
      const expectedDependencyCount = 1 + captionCueCount + voiceTrackCount + colorSourceCount
      if (
        colorDependencyWorkItemCount !== colorSourceCount ||
        (usesApprovedColorIntermediate && !replaceVoice) ||
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
          const expectedStartFrame = usesApprovedColorIntermediate ? 0 : decision.startFrame
          const expectedEndFrameExclusive = usesApprovedColorIntermediate
            ? decision.endFrameExclusive - decision.startFrame
            : decision.endFrameExclusive
          if (
            segment.sourceSequenceItemId !== workItem.sourceSequenceItemIds[index] ||
            segment.sourceStartFrame !== expectedStartFrame ||
            segment.sourceEndFrameExclusive !== expectedEndFrameExclusive
          ) throw denied('Source-sequence composition timing diverges from approved source cleanup authority.')
        })
      } else if (usesApprovedColorIntermediate) {
        if (
          planningPayload.sourceStartFrame !== 0 ||
          planningPayload.sourceEndFrameExclusive !== planningPayload.durationFrames ||
          exactCleanupDecisions[0]!.endFrameExclusive - exactCleanupDecisions[0]!.startFrame !==
            planningPayload.durationFrames
        ) throw denied('Professional color composition lost its approved normalized source duration.')
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
        editSessionId: body.editSessionId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
        approvedWorkItem: workItem, approvedSourceManifest: authority.sourceAssetManifest,
        leaseId: injected.leaseId, executionAttemptId, dispatchGrantId: body.grantId,
      }
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
          allowedContentTypes: [
            'application/json',
            'image/png',
            'audio/wav',
            'video/x-matroska',
          ],
          maximumBytes: 16 * 1024 * 1024,
          selectedArtifactIndex,
        }))
      }
      const trimArtifact = dependencies.find((dependency) => dependency.contentType === 'application/json')
      const captionDependencies = dependencies.filter((dependency) => dependency.contentType === 'image/png')
      const voiceDependencies = dependencies.filter((dependency) => dependency.contentType === 'audio/wav')
      const colorDependencies = dependencies.filter((dependency) =>
        dependency.contentType === 'video/x-matroska')
      if (
        !trimArtifact || trimArtifact.byteLength > 1024 * 1024 ||
        captionDependencies.length !== captionCueCount || voiceDependencies.length !== voiceTrackCount ||
        colorDependencies.length !== colorSourceCount ||
        dependencies.length !== expectedDependencyCount
      ) {
        throw denied(
          'Final composition dependencies must be one approved trim JSON plus exact caption, voice, and color artifacts.',
        )
      }
      const captions = orderCaptionDependencies({
        captionDependencies,
        captionOutputKeys: captionTrackProfile
          ? planningPayload.captionOverlayCues.map((cue) => cue.outputKey)
          : undefined,
        authority,
      })
      const voiceTracks = replaceVoice
        ? orderVoiceDependencies({
            voiceDependencies,
            approvedVoiceTracks: planningPayload.voiceTracks ?? [],
            fps: planningPayload.fps,
            authority,
          })
        : []
      const colorSources = usesApprovedColorIntermediate
        ? orderColorDependencies({
            colorDependencies,
            sourceSequenceItemIds: workItem.sourceSequenceItemIds,
            cleanupDecisions: exactCleanupDecisions,
            fps: planningPayload.fps,
            authority,
          })
        : []
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
      const sourceReader = createCanonicalPrivateSourceObjectReadService(context)
      const stagedSourceSet = sequenceProfile
        ? await sourceReader.stageExactApprovedSources(sourceReadInput)
        : await sourceReader.stageExactApprovedSource(sourceReadInput)
      const sources: CanonicalPrivateStagedSourceReadResult[] = stagedSourceSet.sources
      let request!: ReturnType<typeof buildOfflineRemotionFinalCompositionRequest>
      let result!: OfflineRemotionRenderResult
      try {
        const directSourceBytes = usesApprovedColorIntermediate
          ? []
          : await Promise.all(sources.map((source) => readBoundedStagedSource(source)))
        request = buildOfflineRemotionFinalCompositionRequest({
          planningPayload,
          ...(sequenceProfile
            ? {
                sources: sources.map((source, index) => ({
                  sourceSequenceItemId: source.sourceSequenceItemId,
                  mimeType: colorSources[index]
                    ? 'video/x-matroska' as const
                    : CONTENT_TYPE,
                  bytes: colorSources[index]?.dependency.bytes ?? directSourceBytes[index]!,
                  sha256: colorSources[index]?.dependency.sha256 ?? source.sha256,
                })),
              }
            : {
                source: {
                  mimeType: colorSources[0] ? 'video/x-matroska' as const : CONTENT_TYPE,
                  bytes: colorSources[0]?.dependency.bytes ?? directSourceBytes[0]!,
                  sha256: colorSources[0]?.dependency.sha256 ?? sources[0]!.sha256,
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
          ...(replaceVoice
            ? {
                voiceTracks: voiceTracks.map((voiceTrack, index) => ({
                  sourceSequenceItemId:
                    planningPayload.voiceTracks![index]!.sourceSequenceItemId,
                  outputKey: planningPayload.voiceTracks![index]!.outputKey,
                  mimeType: 'audio/wav' as const,
                  bytes: voiceTrack.bytes,
                  sha256: voiceTrack.sha256,
                })),
              }
            : {}),
        })
        if (!isFinalCompositionPayload(request.payload)) {
          throw denied('Final composition request resolved to the wrong profile.')
        }
        result = await runtime.execute(request)
        assertFinalResult(result, request)
      } finally {
        await stagedSourceSet.cleanup()
      }
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
      const hardCutAuthorityHash = sha256ArtifactQaValue(sequenceProfile
        ? {
            transitionPolicy: planningPayload.transitionPolicy,
            hardCutTransitions: planningPayload.hardCutTransitions,
          }
        : { transitionPolicy: 'not_applicable_single_source' })

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_4k_delivery_master_mp4_v1',
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
        voiceTrackSha256s: voiceTracks.map((voiceTrack) => voiceTrack.sha256),
        colorIntermediateSha256s: colorSources.map((source) => source.dependency.sha256),
        hardCutAuthorityHash,
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
        voiceDependencyReadEvidenceHashes: voiceTracks.map(
          (voiceTrack) => voiceTrack.dependencyReadEvidenceHash,
        ),
        colorDependencyReadEvidenceHashes: colorSources.map(
          (source) => source.dependency.dependencyReadEvidenceHash,
        ),
        hardCutAuthorityHash,
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
      const voiceInputs = replaceVoice
        ? {
            voiceTracks: voiceTracks.map((voiceTrack, index) => ({
              sourceSequenceItemId: planningPayload.voiceTracks![index]!.sourceSequenceItemId,
              outputKey: planningPayload.voiceTracks![index]!.outputKey,
              durationFrames: planningPayload.voiceTracks![index]!.durationFrames,
              voiceArtifactId: voiceTrack.artifactId,
              voiceSha256: voiceTrack.sha256,
              voiceByteLength: voiceTrack.byteLength,
              voiceDependencyReadEvidenceHash: voiceTrack.dependencyReadEvidenceHash,
            })),
          }
        : {}
      const colorInputRecords = colorSources.map((colorSource, index) => ({
        sourceSequenceItemId: colorSource.sourceSequenceItemId,
        outputKey: colorSource.outputKey,
        sourceCleanupDecisionId: colorSource.sourceCleanupDecisionId,
        originalSourceStartFrame: colorSource.originalSourceStartFrame,
        originalSourceEndFrameExclusive: colorSource.originalSourceEndFrameExclusive,
        compositionStartFrame: sequenceProfile
          ? planningPayload.sourceSegments[index]!.sourceStartFrame
          : planningPayload.sourceStartFrame,
        compositionEndFrameExclusive: sequenceProfile
          ? planningPayload.sourceSegments[index]!.sourceEndFrameExclusive
          : planningPayload.sourceEndFrameExclusive,
        durationFrames: colorSource.durationFrames,
        colorGradeStyle: colorSource.colorGradeStyle,
        intensity: colorSource.intensity,
        approvedColorOperationIds: colorSource.approvedColorOperationIds,
        approvedColorOperationKinds: colorSource.approvedColorOperationKinds,
        ...(colorSource.referenceSourceSequenceItemId
          ? {
              referenceSourceSequenceItemId: colorSource.referenceSourceSequenceItemId,
              referenceOutputKey: colorSource.referenceOutputKey!,
              referenceDurationFrames: colorSource.referenceDurationFrames!,
            }
          : {}),
        outputColorSpace: 'bt709' as const,
        outputPixelFormat: 'yuv420p' as const,
        colorArtifactId: colorSource.dependency.artifactId,
        colorSha256: colorSource.dependency.sha256,
        colorByteLength: colorSource.dependency.byteLength,
        colorDependencyReadEvidenceHash:
          colorSource.dependency.dependencyReadEvidenceHash,
      }))
      const colorInputs = colorInputRecords.length > 0
        ? sequenceProfile
          ? { colorSources: colorInputRecords }
          : { colorSource: colorInputRecords[0]! }
        : {}
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-final-composition-execution-response-v3' as const,
        source: 'canonical_private_final_composition_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: 'remotion' as const, operationId: OFFLINE_REMOTION_RENDER_OPERATION,
          compositionProfileId: planningPayload.compositionProfileId,
          actualRemotionOperationCompleted: true as const, approvedSourceObjectRead: true as const,
          approvedSourceInputMode: 'server_injected_private_stream_v1' as const,
          approvedSourceStagingCleaned: true as const,
          approvedSourceCapacityEvidenceHash: stagedSourceSet.capacityEvidenceHash,
          approvedSourceTrimDependencyRead: true as const,
          approvedSourceTrimFramesApplied: true as const,
          approvedHardCutTransitionAuthorityRead: sequenceProfile,
          approvedHardCutTransitionsApplied: sequenceProfile,
          approvedCaptionDependencyRead: true as const,
          approvedCaptionTrackTimingApplied: captionTrackProfile,
          audioPolicy: planningPayload.audioPolicy,
          sourceAudioPreserved: !replaceVoice,
          approvedVoiceTrackDependencyRead: replaceVoice,
          approvedVoiceTrackReplacementApplied: replaceVoice,
          approvedColorDependencyRead: colorSources.length > 0,
          approvedColorIntermediateApplied: colorSources.length > 0,
          renderPurpose: 'private_4k_delivery_master_v1' as const,
          deliveryProfileId: 'uhd_2160' as const,
          immutableSourceMasterNoProxyPolicyVerified: true as const,
          originalApprovedEstimateAndReservationReused: true as const,
          secondEstimateCreated: false as const,
          secondReservationCreated: false as const,
          exportCreditMutationPerformed: false as const,
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
                sourceStagingEvidenceHash: source.stagingEvidenceHash,
                sourceCleanupDecisionId: sourceTrim[index]!.decisionId,
                sourceStartFrame: sourceTrim[index]!.startFrame,
                sourceEndFrameExclusive: sourceTrim[index]!.endFrameExclusive,
                timelineStartFrame: planningPayload.sourceSegments[index]!.timelineStartFrame,
                timelineEndFrameExclusive: planningPayload.sourceSegments[index]!.timelineEndFrameExclusive,
              })),
              transitionPolicy: planningPayload.transitionPolicy,
              hardCutTransitions: planningPayload.hardCutTransitions,
              combinedSourceByteLength: sources.reduce((total, source) => total + source.byteLength, 0),
              sourceSequenceReadEvidenceHash: sha256ArtifactQaValue(
                sources.map((source) => source.sourceReadEvidenceHash),
              ),
              sourceTrimArtifactId: trimArtifact.artifactId,
              sourceTrimSha256: trimArtifact.sha256,
              sourceTrimByteLength: trimArtifact.byteLength,
              sourceTrimDependencyReadEvidenceHash: trimArtifact.dependencyReadEvidenceHash,
              ...captionInputs,
              ...voiceInputs,
              ...colorInputs,
            }
          : {
              sourceSequenceItemId: sources[0]!.sourceSequenceItemId,
              sourceMediaAssetId: sources[0]!.mediaAssetId,
              sourceSha256: sources[0]!.sha256, sourceByteLength: sources[0]!.byteLength,
              sourceReadEvidenceHash: sources[0]!.sourceReadEvidenceHash,
              sourceStagingEvidenceHash: sources[0]!.stagingEvidenceHash,
              sourceTrimArtifactId: trimArtifact.artifactId,
              sourceTrimSha256: trimArtifact.sha256,
              sourceTrimByteLength: trimArtifact.byteLength,
              sourceTrimDependencyReadEvidenceHash: trimArtifact.dependencyReadEvidenceHash,
              sourceCleanupDecisionId: sourceTrim[0]!.decisionId,
              sourceStartFrame: sourceTrim[0]!.startFrame,
              sourceEndFrameExclusive: sourceTrim[0]!.endFrameExclusive,
              ...captionInputs,
              ...voiceInputs,
              ...colorInputs,
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

function orderVoiceDependencies(input: {
  voiceDependencies: CanonicalPrivateDependencyArtifactReadResult[]
  approvedVoiceTracks: Array<{
    sourceSequenceItemId: string
    outputKey: string
    durationFrames: number
  }>
  fps: number
  authority: ApprovedExecutionAuthority
}): CanonicalPrivateDependencyArtifactReadResult[] {
  const byOutputKey = new Map<string, {
    dependency: CanonicalPrivateDependencyArtifactReadResult
    sourceSequenceItemId: string
    durationFrames: number
  }>()
  for (const dependency of input.voiceDependencies) {
    const asset = input.authority.assetManifest.entries.find((candidate) =>
      candidate.id === dependency.expectedAssetId)
    const workItem = input.authority.workItems.find((candidate) =>
      candidate.id === asset?.approvedWorkItemId)
    if (
      !asset || !workItem || asset.contentType !== 'audio/wav' ||
      asset.assetRole !== 'processed' || !asset.required || asset.previewPlaceholderAllowed ||
      workItem.workerClass !== 'audio_processing_worker' || workItem.workItemType !== 'custom' ||
      workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'ffmpeg' ||
      workItem.sourceSequenceItemIds.length !== 1 ||
      workItem.sourceCleanupDecisionIds.length !== 1 || workItem.dependencyKeys.length !== 0 ||
      byOutputKey.has(asset.outputKey)
    ) throw denied('Voice dependency lineage is not an exact source-bound FFmpeg audio artifact.')
    const payload = validateOfflineFfmpegPlanningPayload(workItem.executionInput.structuredPayload)
    if (
      payload.recipeProfileId !== 'approved_voice_delivery_wav_v1' ||
      payload.frameRate !== input.fps
    ) {
      throw denied('Voice dependency did not execute the approved professional delivery recipe.')
    }
    byOutputKey.set(asset.outputKey, {
      dependency,
      sourceSequenceItemId: workItem.sourceSequenceItemIds[0]!,
      durationFrames: payload.trimEndFrameExclusive - payload.trimStartFrame,
    })
  }
  const ordered = input.approvedVoiceTracks.map((track) => byOutputKey.get(track.outputKey))
  if (
    ordered.some((entry, index) =>
      !entry || entry.sourceSequenceItemId !== input.approvedVoiceTracks[index]!.sourceSequenceItemId ||
      entry.durationFrames !== input.approvedVoiceTracks[index]!.durationFrames) ||
    ordered.length !== byOutputKey.size ||
    new Set(input.approvedVoiceTracks.map((track) => track.outputKey)).size !==
      input.approvedVoiceTracks.length
  ) throw denied('Voice dependency artifacts do not match approved source, output-key, and duration order.')
  return ordered.map((entry) => entry!.dependency)
}

interface ApprovedColorDependency {
  dependency: CanonicalPrivateDependencyArtifactReadResult
  sourceSequenceItemId: string
  outputKey: string
  sourceCleanupDecisionId: string
  originalSourceStartFrame: number
  originalSourceEndFrameExclusive: number
  durationFrames: number
  colorGradeStyle: 'clean_natural' | 'premium_clean'
  intensity: 'subtle' | 'balanced'
  approvedColorOperationIds: string[]
  approvedColorOperationKinds: Array<
    | 'clarity'
    | 'contrast_curve'
    | 'exposure_correction'
    | 'highlight_recovery'
    | 'look_transform'
    | 'qa_histogram_check'
    | 'saturation'
    | 'shot_matching'
    | 'white_balance'
  >
  referenceSourceSequenceItemId?: string
  referenceOutputKey?: string
  referenceDurationFrames?: number
}

function orderColorDependencies(input: {
  colorDependencies: CanonicalPrivateDependencyArtifactReadResult[]
  sourceSequenceItemIds: string[]
  cleanupDecisions: Array<{
    decisionId: string
    sourceSequenceItemId: string
    startFrame: number
    endFrameExclusive: number
  }>
  fps: number
  authority: ApprovedExecutionAuthority
}): ApprovedColorDependency[] {
  if (
    input.colorDependencies.length !== input.sourceSequenceItemIds.length ||
    input.cleanupDecisions.length !== input.sourceSequenceItemIds.length
  ) {
    throw denied('Professional color composition requires one exact intermediate per source.')
  }
  const usedDependencies = new Set<string>()
  const ordered = input.sourceSequenceItemIds.map((sourceSequenceItemId, index) => {
    const cleanupDecision = input.cleanupDecisions[index]!
    const match = input.colorDependencies.map((dependency) => {
      const asset = input.authority.assetManifest.entries.find((candidate) =>
        candidate.id === dependency.expectedAssetId)
      const workItem = input.authority.workItems.find((candidate) =>
        candidate.id === asset?.approvedWorkItemId)
      return { dependency, asset, workItem }
    }).find(({ dependency, workItem }) =>
      !usedDependencies.has(dependency.artifactId) &&
      workItem?.sourceSequenceItemIds[0] === sourceSequenceItemId)
    const dependency = match?.dependency
    const asset = match?.asset
    const workItem = match?.workItem
    const expectedOutput = workItem?.expectedOutputs[0]
    if (
      !dependency || !asset || !workItem || !expectedOutput ||
      asset.contentType !== 'video/x-matroska' ||
      asset.assetRole !== 'processed' || !asset.required || asset.previewPlaceholderAllowed ||
      asset.outputKey !== expectedOutput.outputKey ||
      expectedOutput.contentType !== 'video/x-matroska' ||
      workItem.expectedOutputs.length !== 1 ||
      workItem.workerClass !== 'color_processing_worker' || workItem.workItemType !== 'custom' ||
      workItem.executionInput.operation !== 'process_approved_source_professional_color_delivery' ||
      stableArtifactQaStringify(workItem.executionInput.approvedToolOperationIds) !==
        stableArtifactQaStringify([OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg]) ||
      stableArtifactQaStringify(workItem.executionInput.expectedOutputKeys) !==
        stableArtifactQaStringify([asset.outputKey]) ||
      workItem.approvedToolIds.length !== 1 || workItem.approvedToolIds[0] !== 'ffmpeg' ||
      workItem.sourceSequenceItemIds.length !== 1 ||
      workItem.sourceSequenceItemIds[0] !== sourceSequenceItemId ||
      workItem.sourceCleanupDecisionIds.length !== 1 ||
      workItem.sourceCleanupDecisionIds[0] !== cleanupDecision.decisionId ||
      cleanupDecision.sourceSequenceItemId !== sourceSequenceItemId
    ) throw denied('Color dependency lineage is not an exact source-bound FFmpeg color artifact.')
    const payload = validateOfflineFfmpegPlanningPayload(workItem.executionInput.structuredPayload)
    const referenceWorkItem = index > 0
      ? input.authority.workItems.find((candidate) =>
          candidate.workItemKey === workItem.dependencyKeys[0])
      : undefined
    const referenceAsset = referenceWorkItem
      ? input.authority.assetManifest.entries.find((candidate) =>
          candidate.approvedWorkItemId === referenceWorkItem.id)
      : undefined
    if (
      ![
        'approved_source_color_delivery_matroska_v1',
        'approved_source_color_match_delivery_matroska_v1',
      ].includes(payload.recipeProfileId) ||
      payload.frameRate !== input.fps ||
      payload.trimStartFrame !== cleanupDecision.startFrame ||
      payload.trimEndFrameExclusive !== cleanupDecision.endFrameExclusive ||
      payload.trimEndFrameExclusive - payload.trimStartFrame <= 0 ||
      (index === 0 && (
        payload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1' ||
        workItem.dependencyKeys.length !== 0
      )) ||
      (index > 0 && (
        payload.recipeProfileId !== 'approved_source_color_match_delivery_matroska_v1' ||
        workItem.dependencyKeys.length !== 1 || !referenceWorkItem || !referenceAsset ||
        referenceWorkItem.sourceSequenceItemIds[0] !== input.sourceSequenceItemIds[0] ||
        referenceAsset.outputKey !== payload.referenceOutputKey ||
        payload.referenceSourceSequenceItemId !== input.sourceSequenceItemIds[0] ||
        payload.referenceDurationFrames !==
          input.cleanupDecisions[0]!.endFrameExclusive -
            input.cleanupDecisions[0]!.startFrame
      ))
    ) throw denied('Color dependency did not execute the exact approved professional color recipe.')
    if (
      payload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1' &&
      payload.recipeProfileId !== 'approved_source_color_match_delivery_matroska_v1'
    ) throw denied('Color dependency payload lost its exact color recipe identity.')
    usedDependencies.add(dependency.artifactId)
    return {
      dependency,
      sourceSequenceItemId,
      outputKey: asset.outputKey,
      sourceCleanupDecisionId: cleanupDecision.decisionId,
      originalSourceStartFrame: payload.trimStartFrame,
      originalSourceEndFrameExclusive: payload.trimEndFrameExclusive,
      durationFrames: payload.trimEndFrameExclusive - payload.trimStartFrame,
      colorGradeStyle: payload.colorGradeStyle,
      intensity: payload.intensity,
      approvedColorOperationIds: [...payload.approvedColorOperationIds],
      approvedColorOperationKinds: [...payload.approvedColorOperationKinds],
      ...(payload.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1'
        ? {
            referenceSourceSequenceItemId: payload.referenceSourceSequenceItemId,
            referenceOutputKey: payload.referenceOutputKey,
            referenceDurationFrames: payload.referenceDurationFrames,
          }
        : {}),
    }
  })
  if (usedDependencies.size !== input.colorDependencies.length) {
    throw denied('Professional color dependency order is ambiguous or incomplete.')
  }
  return ordered
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
  voiceDependencyReadEvidenceHashes: string[]
  colorDependencyReadEvidenceHashes: string[]
  hardCutAuthorityHash: string
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
              voiceDependencyReadEvidenceHashes: input.voiceDependencyReadEvidenceHashes,
              colorDependencyReadEvidenceHashes: input.colorDependencyReadEvidenceHashes,
              hardCutAuthorityHash: input.hardCutAuthorityHash,
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
              voiceDependencyReadEvidenceHashes: input.voiceDependencyReadEvidenceHashes,
              colorDependencyReadEvidenceHashes: input.colorDependencyReadEvidenceHashes,
              hardCutAuthorityHash: input.hardCutAuthorityHash,
            }),
            notesCode: 'approved_source_trim_caption_voice_color_transition_policy_and_frame_preflight_passed',
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
  const replaceVoice = isFinalCompositionPayload(request.payload) &&
    request.payload.audioPolicy === 'replace_with_approved_voice_tracks'
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
    (replaceVoice
      ? (
          result.evidence.semanticEvidence.approvedVoiceTrackBytesVerified !== true ||
          result.evidence.semanticEvidence.approvedVoiceTrackReplacementRequested !== true ||
          result.evidence.semanticEvidence.approvedVoiceTrackTimelineApplied !== true ||
          result.evidence.semanticEvidence.sourceAudioPreservationRequested === true
        )
      : (
          result.evidence.semanticEvidence.sourceAudioPreservationRequested !== true ||
          result.evidence.semanticEvidence.approvedVoiceTrackReplacementRequested === true
        )) ||
    result.evidence.semanticEvidence.finalCompositionProfileExecuted !== true ||
    (sequenceProfile && (
      result.evidence.semanticEvidence.approvedSourceSequenceBytesVerified !== true ||
      result.evidence.semanticEvidence.approvedSourceSequenceTimelineApplied !== true ||
      result.evidence.semanticEvidence.approvedHardCutTransitionAuthorityRead !== true ||
      result.evidence.semanticEvidence.approvedHardCutTransitionsApplied !== true
    )) ||
    (captionTrackProfile &&
      result.evidence.semanticEvidence.approvedCaptionTrackTimingApplied !== true) ||
    result.evidence.semanticEvidence.approved4kDeliveryMasterAuthorityVerified !== true ||
    result.evidence.semanticEvidence.immutableSourceMasterNoProxyPolicyVerified !== true ||
    result.evidence.semanticEvidence.approvedReservationReuseOnly !== true ||
    result.evidence.semanticEvidence.secondEstimateOrExportChargeForbidden !== true ||
    result.evidence.semanticEvidence.professionalHighQualityEncodeApplied !== true ||
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

async function readBoundedStagedSource(
  source: CanonicalPrivateStagedSourceReadResult,
): Promise<Buffer> {
  if (
    source.byteLength < 64 ||
    source.byteLength > CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES
  ) {
    throw denied(
      'A large approved source requires its QA-passed professional color intermediate before final composition.',
    )
  }
  const chunks: Buffer[] = []
  let total = 0
  const checksum = createHash('sha256')
  for await (const chunk of await source.sourceInput.openStream()) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += bytes.byteLength
    if (total > source.byteLength || total > CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES) {
      throw denied('Staged direct-composition source exceeded its exact byte commitment.')
    }
    checksum.update(bytes)
    chunks.push(bytes)
  }
  if (total !== source.byteLength || checksum.digest('hex') !== source.sha256) {
    throw denied('Staged direct-composition source failed exact size and checksum verification.')
  }
  return Buffer.concat(chunks, total)
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
