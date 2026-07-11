import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  buildOfflineDeepFilterNetVoiceCleanupApprovedRequest,
  openPrivateOfflineDeepFilterNetVoiceCleanupRuntime,
  readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority,
  type OfflineDeepFilterNetVoiceCleanupExecutionResult,
} from '../tool-execution/deepfilternet-voice-cleanup-execution'
import { beginPrivateInternalAttemptCostEvidence } from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ToolCostFailureCategory } from '../tool-cost-metering/types'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateDeepFilterNetVoiceCleanupAuthoritySchema,
  canonicalPrivateDeepFilterNetVoiceCleanupResponseSchema,
  runCanonicalPrivateDeepFilterNetVoiceCleanupSchema,
  type CanonicalPrivateDeepFilterNetVoiceCleanupAuthority,
  type CanonicalPrivateDeepFilterNetVoiceCleanupResponse,
  type RunCanonicalPrivateDeepFilterNetVoiceCleanupInput,
} from '../validation/canonical-private-deepfilternet-voice-cleanup-execution-schemas'
import type { CanonicalExpectedArtifactLineage, PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { persistCanonicalPrivateAudioArtifact, readCanonicalPrivateAudioArtifact } from './canonical-private-audio-artifact-storage'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { createPrivateArtifactQaAuthorityService, type ServerInjectedArtifactQaAdapter, type ServerInjectedArtifactResultAdapter } from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue, stableArtifactQaStringify } from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_deepfilternet_voice_cleanup_execution_v1' as const
const TOOL_ID = 'deepfilternet' as const
const OPERATION_ID = 'tool.deepfilternet.enhance_voice.v1' as const
const CONTENT_TYPE = 'audio/wav' as const

export function createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateDeepFilterNetVoiceCleanupInput,
      serverAuthority: CanonicalPrivateDeepFilterNetVoiceCleanupAuthority,
    ): Promise<CanonicalPrivateDeepFilterNetVoiceCleanupResponse> {
      const body = parse(runCanonicalPrivateDeepFilterNetVoiceCleanupSchema, input, 'DeepFilterNet execution identity is invalid.')
      const injected = parse(canonicalPrivateDeepFilterNetVoiceCleanupAuthoritySchema, serverAuthority, 'DeepFilterNet execution authority is invalid.')
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('DeepFilterNet execution actor is outside this workspace.')

      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, grantId: body.grantId,
        purpose: 'private_internal_canonical_tool_dispatch_consume', idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      if (
        binding.canonicalToolId !== TOOL_ID || binding.operationId !== OPERATION_ID || binding.leaseId !== injected.leaseId ||
        binding.jobId !== body.jobId || binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized && !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match the exact DeepFilterNet execution identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(readiness.job.approvedPlanSnapshotId, access.workspaceId)
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) => candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('DeepFilterNet work-item or output lineage is missing.')
      const request = buildOfflineDeepFilterNetVoiceCleanupApprovedRequest({ toolId: TOOL_ID, operationId: binding.operationId, planningPayload: workItem.executionInput.structuredPayload })
      if (
        expectedAsset.contentType !== CONTENT_TYPE || binding.expectedOutput.contentType !== CONTENT_TYPE || expectedAsset.assetRole === 'final' ||
        expectedAsset.previewPlaceholderAllowed || binding.expectedOutput.outputKey !== expectedAsset.outputKey || readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId || workItem.sourceSequenceItemIds.length !== 0 || workItem.dependencyKeys.length !== 0 ||
        authority.reservation.id !== authority.snapshot.reservationId || authority.estimate.id !== authority.reservation.estimateId
      ) throw denied('DeepFilterNet canonical execution is limited to the approved funded dependency-free server fixture WAV.')

      const runtimeAuthority = await readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady || runtimeAuthority.readiness.productReady ||
        !runtimeAuthority.readiness.modelAndLicenseReviewStillRequiredForProduction ||
        !runtimeAuthority.supportedOperations.some((operation) => operation.toolId === TOOL_ID && operation.operationId === OPERATION_ID)
      ) throw denied('DeepFilterNet runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineDeepFilterNetVoiceCleanupRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) throw denied('Opened DeepFilterNet image does not match dispatch-time authority.')

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, leaseId: injected.leaseId, leaseCredential: injected.leaseCredential, runnerClass: RUNNER_CLASS,
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
        toolId: TOOL_ID,
        operationId: OPERATION_ID,
      })
      let canonicalLifecycleCompleted = false
      let attemptOutputByteLength: number | null = null
      try {
      const result = await runtime.execute(request)
      assertExecutionResult(result)
      attemptOutputByteLength = result.artifact.byteLength

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_deepfilternet_voice_cleanup_wav_v1', workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId, expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId, executionAttemptId, contentSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateAudioArtifact({ localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash, bytes: result.artifact.bytes, expectedSha256: result.artifact.sha256 })

      const identity = { workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId, jobId: body.jobId, expectedAssetId: expectedAsset.id }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey, artifactType: expectedAsset.artifactType,
        assetRole: expectedAsset.assetRole, required: expectedAsset.required, previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType: CONTENT_TYPE, segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds], rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id, workItemKey: workItem.workItemKey, jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash, snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: AdapterInput = { localStorageRoot: context.env.localStorageRoot, identity, lineage, privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId, runtimeAuthorityHash: runtimeAuthority.authorityHash, executionStartedAt: begun.executionFence.startedAt, result }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_deepfilternet_voice_cleanup_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({ ...identity, idempotencyKey: key('deepfilternet-artifact', keyHash), purpose: 'record_server_verified_internal_artifact_result' })
      const qaResult = await artifactAuthority.recordArtifactQa({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('deepfilternet-qa', keyHash), purpose: 'record_server_verified_internal_artifact_qa' })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS, executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('deepfilternet-reconcile', keyHash), purpose: 'reconcile_server_verified_internal_artifact' })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' || reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied || !completed.executionFence.commitAuthorizedAt || !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'DeepFilterNet output failed QA or reconciliation.', 409)

      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(authority.snapshot.snapshotId, access.workspaceId)) !== beforeHash) throw denied('Canonical authority changed during DeepFilterNet execution.')

      const semantic = result.evidence.semanticEvidence
      const canonicalOutcomeHash = sha256AuthorityValue({
        domain: 'canonical_private_deepfilternet_voice_cleanup_outcome_v1',
        identity: {
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          editSessionId: body.editSessionId,
          snapshotId: authority.snapshot.snapshotId,
          approvedWorkItemId: workItem.id,
          jobId: body.jobId,
          executionAttemptId,
        },
        tool: { canonicalToolId: TOOL_ID, operationId: OPERATION_ID },
        runtime: {
          runtimeAuthorityHash: runtimeAuthority.authorityHash,
          imageIdentityHash: runtime.image.imageIdentityHash,
          requestEnvelopeSha256: result.evidence.requestEnvelopeSha256,
          packageVersion: '0.5.6',
          modelCheckpointSha256: '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003',
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          contentType: CONTENT_TYPE,
          sha256: result.artifact.sha256,
          byteLength: result.artifact.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
        },
      })
      canonicalLifecycleCompleted = true
      const attemptCost = await attemptCostMeter.finalize({
        status: 'completed',
        failureCategory: 'none',
        outputByteLength: result.artifact.byteLength,
        linkedCanonicalOutcomeHash: canonicalOutcomeHash,
      })
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-deepfilternet-voice-cleanup-execution-response-v1' as const,
        source: 'canonical_private_deepfilternet_voice_cleanup_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: { canonicalToolId: TOOL_ID, operationId: OPERATION_ID, actualPackageEntrypointCompleted: true as const, approvedServerOwnedFixtureOnly: true as const, callerMediaAllowed: false as const, callerModelAllowed: false as const, modelAndLicenseReviewStillRequiredForProduction: true as const, providerCallMade: false as const, sourceObjectRead: false as const, renderExecuted: false as const, finalExportExecuted: false as const },
        lease: { leaseId: begun.lease.id, attemptNumber: begun.lease.attemptNumber, immutableLeaseHash: begun.lease.immutableLeaseHash, executionAttemptId, runnerClass: RUNNER_CLASS, executionStartedAt: completed.executionFence.startedAt, executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt, executionCompletedAt: completed.executionFence.completedAt, credentialReturned: false as const, credentialHashReturned: false as const },
        runtime: { runtimeAuthorityHash: runtimeAuthority.authorityHash, imageIdentityHash: runtime.image.imageIdentityHash, executionAttestationHash: result.attestation.attestationHash, requestEnvelopeSha256: result.evidence.requestEnvelopeSha256, packageName: 'DeepFilterNet' as const, packageVersion: '0.5.6' as const, nativePackageName: 'DeepFilterLib' as const, nativePackageVersion: '0.5.6' as const, torchVersion: '2.2.2' as const, torchaudioVersion: '2.2.2' as const, modelId: 'DeepFilterNet3' as const, modelCheckpointSha256: '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003' as const, debianSnapshot: '20260623T000000Z' as const, zeroNetworkVerified: true as const, cpuExecutionOnly: true as const, runtimeModelDownloadAllowed: false as const, privateInternalOnly: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const },
        result: { artifactId: artifactResult.artifact.artifactId, qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId, reconciliationId: reconciliation.reconciliation.reconciliationId, artifactVersion: artifactResult.artifact.artifactVersion, contentType: CONTENT_TYPE, sha256: 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7' as const, byteLength: 384_214 as const, sampleRate: 48_000 as const, channelCount: 1 as const, frameCount: 192_085 as const, inputSnrDb: 3.217773 as const, outputSnrDb: 8.214627 as const, meanAbsoluteDelta: 0.032997789 as const, privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash, qaOutcome: 'passed' as const, reconciliationDecision: 'test_merged_not_live_authorized' as const, privateTestDependencySatisfied: true as const, liveRuntimeDependencySatisfied: false as const, finalRenderAuthorized: false as const },
        attemptCost,
        replay: { dispatchConsumptionReplayed: dispatch.consumptionReplayed, executionFenceBeginReplayed: begun.replayed, executionFenceCompleteReplayed: completed.replayed, artifactRecordReplayed: artifactResult.replayed, qaRecordReplayed: qaResult.replayed, reconciliationReplayed: reconciliation.replayed, attemptCostEvidenceReplayed: attemptCost.idempotencyStatus === 'duplicate_returned', sameIdempotentAttemptOnly: true as const },
        permissions: { furtherWorkerDispatch: false as const, providerCall: false as const, sourceObjectRead: false as const, render: false as const, creditSpend: false as const, walletMutation: false as const, settlement: false as const, delivery: false as const },
        persistence: { privateLocalCreateOnlyArtifact: true as const, contentAddressedArtifactAuthority: true as const, actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const, checksumProtectedAuthority: true as const, distributedAuthority: false as const, productionAuthority: false as const },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      void semantic
      return canonicalPrivateDeepFilterNetVoiceCleanupResponseSchema.parse({ ...responseWithoutHash, responseHash: sha256AuthorityValue(responseWithoutHash) })
      } catch (error) {
        if (!canonicalLifecycleCompleted) {
          await attemptCostMeter.finalize({
            status: 'failed',
            failureCategory: classifyAttemptCostFailure(error),
            outputByteLength: attemptOutputByteLength,
            linkedCanonicalOutcomeHash: null,
          })
        }
        throw error
      }
    },
  }
}

interface AdapterInput {
  localStorageRoot: string
  identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  result: OfflineDeepFilterNetVoiceCleanupExecutionResult
}

function adapters(input: AdapterInput): { producedArtifact: ServerInjectedArtifactResultAdapter; artifactQa: ServerInjectedArtifactQaAdapter } {
  return {
    producedArtifact: { adapterKind: 'server_injected_internal_artifact_adapter', async collectProducedArtifact(adapterInput) { assertLineage(adapterInput.identity, adapterInput.lineage, input); await assertStored(input); return { schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const, evidenceOrigin: 'server_injected_internal_artifact_adapter' as const, evidenceClass: 'private_internal_test_attested' as const, artifactVersion: 1, attemptKind: 'initial' as const, content: { sha256: input.result.artifact.sha256, byteLength: input.result.artifact.byteLength, contentType: CONTENT_TYPE }, storageIdentity: { storageKind: 'private_local_test' as const, opaqueObjectIdentityHash: input.privateObjectIdentityHash }, placeholder: { isPlaceholder: false, scope: 'none' as const }, actualRunEvidence: { state: 'actual_run_evidence_verified_v2' as const, executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS, runnerEvidenceHash: sha256ArtifactQaValue(input.result.evidence), startedAt: input.executionStartedAt, finishedAt: input.result.attestation.completedAt, exitCode: 0 as const, toolIds: [TOOL_ID], actualRunVerified: true as const, dispatchGrantId: input.dispatchGrantId, runtimeAuthorityHash: input.runtimeAuthorityHash, runtimeImageIdentityHash: input.result.attestation.imageIdentityHash, executionAttestationHash: input.result.attestation.attestationHash }, completedAt: input.result.attestation.completedAt } } },
    artifactQa: { adapterKind: 'server_injected_internal_qa_adapter', async evaluateArtifact(adapterInput) { assertLineage(adapterInput.identity, adapterInput.lineage, input); assertArtifact(adapterInput.artifact, input); await assertStored(input); return { schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const, evidenceOrigin: 'server_injected_internal_qa_adapter' as const, evidenceClass: 'private_internal_test_attested' as const, gateResults: [{ gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue({ content: adapterInput.artifact.content, storage: adapterInput.artifact.storageIdentity }), notesCode: 'deepfilternet_wav_hash_size_signature_storage_match' }, { gateId: 'asset_quality_gate' as const, category: 'sound_sync' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue(input.result.evidence.semanticEvidence), notesCode: 'actual_deepfilternet_snr_natural_voice_semantic_qa_passed' }], recovery: { state: 'none' as const, action: 'none' as const, approvedWithinSnapshot: true, reasonCode: 'deepfilternet_pass_no_recovery' }, evaluatedAt: new Date().toISOString(), actualQaEvidenceState: 'actual_audio_tool_qa_verified_v1' as const, actualQaVerified: true as const } } },
  }
}

async function assertStored(input: AdapterInput) { const stored = await readCanonicalPrivateAudioArtifact({ localStorageRoot: input.localStorageRoot, privateObjectIdentityHash: input.privateObjectIdentityHash }); if (!stored || stored.sha256 !== input.result.artifact.sha256 || stored.byteLength !== input.result.artifact.byteLength || !stored.bytes.equals(input.result.artifact.bytes)) throw denied('DeepFilterNet bytes changed before artifact authority.'); return stored }
function assertExecutionResult(result: OfflineDeepFilterNetVoiceCleanupExecutionResult) { const semantic = result.evidence.semanticEvidence; if (result.request.toolId !== TOOL_ID || result.request.operationId !== OPERATION_ID || result.artifact.mimeType !== CONTENT_TYPE || result.artifact.sha256 !== 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7' || result.artifact.byteLength !== 384_214 || result.evidence.packageName !== 'DeepFilterNet' || result.evidence.packageVersion !== '0.5.6' || result.evidence.modelCheckpointSha256 !== '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003' || semantic.actualPackageEntrypointExecuted !== true || semantic.zeroNetworkRuntimeRequired !== true || semantic.cpuExecutionOnly !== true || semantic.runtimeModelDownloadAllowed !== false || semantic.inputSnrDb !== 3.217773 || semantic.outputSnrDb !== 8.214627 || result.readiness.productReady || !result.readiness.modelAndLicenseReviewStillRequiredForProduction) throw denied('DeepFilterNet result failed exact package, model, artifact, or semantic verification.') }
function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: AdapterInput) { if (stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) || stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)) throw denied('DeepFilterNet adapter lineage changed.') }
function assertArtifact(artifact: PersistedArtifactResult, input: AdapterInput) { if (artifact.content.sha256 !== input.result.artifact.sha256 || artifact.content.byteLength !== input.result.artifact.byteLength || artifact.content.contentType !== CONTENT_TYPE || artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash || artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' || artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS || artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId) throw denied('Persisted DeepFilterNet artifact does not match actual-run evidence.') }
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T { const parsed = schema.safeParse(value); if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten()); return parsed.data }
function key(prefix: string, hash: string) { return `${prefix}-${hash.slice(0, 52)}` }
function classifyAttemptCostFailure(error: unknown): ToolCostFailureCategory {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_FAILED') return 'validation_error'
    if (error.status === 408 || /timeout/i.test(error.message)) return 'timeout'
    return 'reeditpro_error_absorbed'
  }
  if (error instanceof Error && /timeout/i.test(error.message)) return 'timeout'
  return 'unknown'
}
function denied(message: string) { return new ApiError('TOOL_NOT_READY', message, 409, { requiredGate: 'canonical_private_deepfilternet_voice_cleanup_execution_authority' }) }
