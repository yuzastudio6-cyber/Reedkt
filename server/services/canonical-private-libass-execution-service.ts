import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_LIBASS_CAPTION_OPERATION,
  OFFLINE_LIBASS_CAPTION_PROTOCOL,
  openPrivateOfflineLibassCaptionRuntime,
  readPersistedOfflineLibassRuntimeAuthority,
  validateOfflineLibassCaptionRequest,
  type OfflineLibassCaptionResult,
} from '../tool-execution/libass-caption-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateLibassAuthoritySchema,
  canonicalPrivateLibassResponseSchema,
  runCanonicalPrivateLibassSchema,
  type CanonicalPrivateLibassAuthority,
  type CanonicalPrivateLibassResponse,
  type RunCanonicalPrivateLibassInput,
} from '../validation/canonical-private-libass-execution-schemas'
import type { CanonicalExpectedArtifactLineage, PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { persistCanonicalPrivateImageArtifact, readCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-storage'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { createPrivateArtifactQaAuthorityService, type ServerInjectedArtifactQaAdapter, type ServerInjectedArtifactResultAdapter } from './private-artifact-qa-authority-service'
import { sha256ArtifactQaValue, stableArtifactQaStringify } from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_libass_caption_execution_v1' as const
const CONTENT_TYPE = 'image/png' as const

export function createCanonicalPrivateLibassExecutionService(context: ServiceContext) {
  return {
    async execute(input: RunCanonicalPrivateLibassInput, serverAuthority: CanonicalPrivateLibassAuthority): Promise<CanonicalPrivateLibassResponse> {
      const body = parse(runCanonicalPrivateLibassSchema, input, 'libass execution identity is invalid.')
      const injected = parse(canonicalPrivateLibassAuthoritySchema, serverAuthority, 'libass execution authority is invalid.')
      const actor = getRequiredAuthUserId(context); const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('libass actor is outside this workspace.')
      const dispatch = (await createCanonicalPrivateToolDispatchAuthorityService(context).consume({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, grantId: body.grantId, purpose: 'private_internal_canonical_tool_dispatch_consume', idempotencyKey: body.idempotencyKey,
      }, injected)).toolDispatchConsumption
      const binding = dispatch.grant.binding
      if (
        binding.canonicalToolId !== 'libass' || binding.operationId !== OFFLINE_LIBASS_CAPTION_OPERATION ||
        binding.leaseId !== injected.leaseId || binding.jobId !== body.jobId || binding.workspaceId !== body.workspaceId ||
        binding.projectId !== body.projectId || binding.editSessionId !== body.editSessionId ||
        !dispatch.executionAuthority.privateCaptionRenderAuthorized ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized && !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match libass execution identity.')
      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(readiness.job.approvedPlanSnapshotId, access.workspaceId)
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) => candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('libass work-item or output lineage is missing.')
      if (
        workItem.workItemType !== 'custom' || workItem.workerClass !== 'render_worker' ||
        workItem.sourceSequenceItemIds.length || workItem.dependencyKeys.length ||
        expectedAsset.contentType !== CONTENT_TYPE || expectedAsset.assetRole !== 'processed' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.contentType !== CONTENT_TYPE || binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id || binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) throw denied('libass canonical execution is limited to the exact dependency-free private caption overlay.')
      const request = validateOfflineLibassCaptionRequest({
        schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL, toolId: 'libass', operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
        payload: workItem.executionInput.structuredPayload,
      })
      const runtimeAuthority = await readPersistedOfflineLibassRuntimeAuthority()
      if (!runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady || runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.fullTrackOrVideoBurnInReady || !runtimeAuthority.supportedOperations.some((operation) => operation.toolId === 'libass' && operation.operationId === binding.operationId)) throw denied('libass runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineLibassCaptionRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) throw denied('Opened libass image does not match dispatch-time authority.')
      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential, runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const result = await runtime.execute(request)
      if (
        result.evidence.toolId !== 'libass' || result.evidence.operationId !== binding.operationId ||
        result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
        result.imageArtifact.mimeType !== CONTENT_TYPE || result.readiness.productReady ||
        result.readiness.fullTrackOrVideoBurnInReady ||
        result.evidence.semanticEvidence.actualAssReadMemoryExecuted !== true ||
        result.evidence.semanticEvidence.actualAssRenderFrameExecuted !== true ||
        result.evidence.semanticEvidence.approvedFontPackUsed !== true ||
        result.evidence.semanticEvidence.transparentRgbaOverlayProduced !== true ||
        result.evidence.semanticEvidence.captionPlacementPolicyPassed !== true
      ) throw denied('libass result failed exact execution verification.')
      const privateObjectIdentityHash = sha256ArtifactQaValue({ domain: 'canonical_private_libass_overlay_v1', workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId, jobId: body.jobId, expectedAssetId: expectedAsset.id, dispatchGrantId: body.grantId, executionAttemptId, contentSha256: result.imageArtifact.sha256 })
      await persistCanonicalPrivateImageArtifact({ localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash, contentType: CONTENT_TYPE, bytes: result.imageArtifact.bytes, expectedSha256: result.imageArtifact.sha256 })
      const identity = { workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId, jobId: body.jobId, expectedAssetId: expectedAsset.id }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey, artifactType: expectedAsset.artifactType,
        assetRole: expectedAsset.assetRole, required: expectedAsset.required, previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType: CONTENT_TYPE, segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds], rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id, workItemKey: workItem.workItemKey, jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash, snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: LibassAdapterInput = { localStorageRoot: context.env.localStorageRoot, identity, lineage, privateObjectIdentityHash, executionAttemptId, dispatchGrantId: body.grantId, runtimeAuthorityHash: runtimeAuthority.authorityHash, executionStartedAt: begun.executionFence.startedAt, result }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_libass_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({ ...identity, idempotencyKey: key('libass-artifact', keyHash), purpose: 'record_server_verified_internal_artifact_result' })
      const qaResult = await artifactAuthority.recordArtifactQa({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('libass-qa', keyHash), purpose: 'record_server_verified_internal_artifact_qa' })
      const completed = await leaseService.completeInternalExecution({ workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId, jobId: body.jobId, leaseId: injected.leaseId, leaseCredential: injected.leaseCredential, runnerClass: RUNNER_CLASS, executionAttemptId })
      const reconciliation = await artifactAuthority.reconcileArtifact({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('libass-reconcile', keyHash), purpose: 'reconcile_server_verified_internal_artifact' })
      if (qaResult.qaEvaluation.outcome !== 'passed' || reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' || !reconciliation.reconciliation.privateTestDependencySatisfied || !completed.executionFence.commitAuthorizedAt || !completed.executionFence.completedAt) throw denied('libass overlay failed QA or reconciliation.')
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(authority.snapshot.snapshotId, access.workspaceId)) !== beforeHash) throw denied('Canonical authority changed during libass execution.')
      const qa = { transparentRgbaOverlay: true as const, approvedFontPackUsed: true as const, safeZonePlacementPassed: true as const, nonTransparentPixelCount: result.imageArtifact.nonTransparentPixelCount, alphaBoundingBox: result.imageArtifact.alphaBoundingBox, reportSha256: sha256AuthorityValue({ semanticEvidence: result.evidence.semanticEvidence, alphaBoundingBox: result.imageArtifact.alphaBoundingBox, nonTransparentPixelCount: result.imageArtifact.nonTransparentPixelCount }) }
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-libass-execution-response-v1' as const, source: 'canonical_private_libass_execution_coordinator' as const, purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: { canonicalToolId: 'libass' as const, operationId: OFFLINE_LIBASS_CAPTION_OPERATION, actualAssReadMemoryCompleted: true as const, actualAssRenderFrameCompleted: true as const, privateCaptionOverlayRendered: true as const, fullCaptionTrackRendered: false as const, videoBurnInExecuted: false as const, providerCallMade: false as const, sourceObjectRead: false as const, finalExportExecuted: false as const },
        lease: { leaseId: begun.lease.id, attemptNumber: begun.lease.attemptNumber, immutableLeaseHash: begun.lease.immutableLeaseHash, executionAttemptId, runnerClass: RUNNER_CLASS, executionStartedAt: completed.executionFence.startedAt, executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt!, executionCompletedAt: completed.executionFence.completedAt!, credentialReturned: false as const, credentialHashReturned: false as const },
        runtime: { runtimeAuthorityHash: runtimeAuthority.authorityHash, imageIdentityHash: runtime.image.imageIdentityHash, executionAttestationHash: result.attestation.attestationHash, requestEnvelopeSha256: result.evidence.requestEnvelopeSha256, resultSha256: result.imageArtifact.sha256, binaryName: 'libass' as const, binaryVersion: '0.17.5' as const, sourceSha256: result.evidence.sourceSha256, privateInternalOnly: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const, fullTrackOrVideoBurnInReady: false as const },
        qa,
        result: { artifactId: artifactResult.artifact.artifactId, qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId, reconciliationId: reconciliation.reconciliation.reconciliationId, artifactVersion: artifactResult.artifact.artifactVersion, contentType: CONTENT_TYPE, sha256: artifactResult.artifact.content.sha256, byteLength: artifactResult.artifact.content.byteLength, privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash, qaOutcome: 'passed' as const, reconciliationDecision: 'test_merged_not_live_authorized' as const, privateTestDependencySatisfied: true as const, liveRuntimeDependencySatisfied: false as const, finalRenderAuthorized: false as const, finalExportAuthorized: false as const },
        replay: { dispatchConsumptionReplayed: dispatch.consumptionReplayed, executionFenceBeginReplayed: begun.replayed, executionFenceCompleteReplayed: completed.replayed, artifactRecordReplayed: artifactResult.replayed, qaRecordReplayed: qaResult.replayed, reconciliationReplayed: reconciliation.replayed, sameIdempotentAttemptOnly: true as const },
        permissions: { furtherWorkerDispatch: false as const, providerCall: false as const, sourceObjectRead: false as const, furtherCaptionRender: false as const, videoBurnIn: false as const, finalExport: false as const, creditSpend: false as const, walletMutation: false as const, settlement: false as const, delivery: false as const },
        persistence: { privateLocalCreateOnlyArtifact: true as const, contentAddressedArtifactAuthority: true as const, actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const, checksumProtectedAuthority: true as const, distributedAuthority: false as const, productionAuthority: false as const },
        completedAt: reconciliation.reconciliation.createdAt, testOnly: true as const,
      }
      return canonicalPrivateLibassResponseSchema.parse({ ...responseWithoutHash, responseHash: sha256AuthorityValue(responseWithoutHash) })
    },
  }
}

interface LibassAdapterInput { localStorageRoot: string; identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }; lineage: CanonicalExpectedArtifactLineage; privateObjectIdentityHash: string; executionAttemptId: string; dispatchGrantId: string; runtimeAuthorityHash: string; executionStartedAt: string; result: OfflineLibassCaptionResult }
function adapters(input: LibassAdapterInput): { producedArtifact: ServerInjectedArtifactResultAdapter; artifactQa: ServerInjectedArtifactQaAdapter } { return {
  producedArtifact: { adapterKind: 'server_injected_internal_artifact_adapter', async collectProducedArtifact(adapterInput) { assertLineage(adapterInput.identity, adapterInput.lineage, input); await assertStored(input); return { schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const, evidenceOrigin: 'server_injected_internal_artifact_adapter' as const, evidenceClass: 'private_internal_test_attested' as const, artifactVersion: 1, attemptKind: 'initial' as const, content: { sha256: input.result.imageArtifact.sha256, byteLength: input.result.imageArtifact.byteLength, contentType: CONTENT_TYPE }, storageIdentity: { storageKind: 'private_local_test' as const, opaqueObjectIdentityHash: input.privateObjectIdentityHash }, placeholder: { isPlaceholder: false, scope: 'none' as const }, actualRunEvidence: { state: 'actual_run_evidence_verified_v2' as const, executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS, runnerEvidenceHash: sha256ArtifactQaValue(input.result.evidence), startedAt: input.executionStartedAt, finishedAt: input.result.attestation.completedAt, exitCode: 0 as const, toolIds: ['libass'], actualRunVerified: true as const, dispatchGrantId: input.dispatchGrantId, runtimeAuthorityHash: input.runtimeAuthorityHash, runtimeImageIdentityHash: input.result.evidence.image.imageIdentityHash, executionAttestationHash: input.result.attestation.attestationHash }, completedAt: input.result.attestation.completedAt } } },
  artifactQa: { adapterKind: 'server_injected_internal_qa_adapter', async evaluateArtifact(adapterInput) { assertLineage(adapterInput.identity, adapterInput.lineage, input); assertArtifact(adapterInput.artifact, input); await assertStored(input); return { schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const, evidenceOrigin: 'server_injected_internal_qa_adapter' as const, evidenceClass: 'private_internal_test_attested' as const, gateResults: [{ gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue(adapterInput.artifact.content), notesCode: 'libass_png_hash_size_signature_storage_match' }, { gateId: 'asset_quality_gate' as const, category: 'captions' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue(input.result.evidence.semanticEvidence), notesCode: 'actual_libass_caption_pixels_font_and_safe_zone_qa_passed' }], recovery: { state: 'none' as const, action: 'none' as const, approvedWithinSnapshot: true, reasonCode: 'libass_overlay_pass_no_recovery' }, evaluatedAt: new Date().toISOString(), actualQaEvidenceState: 'actual_caption_render_qa_verified_v1' as const, actualQaVerified: true as const } } },
} }
async function assertStored(input: LibassAdapterInput) { const stored = await readCanonicalPrivateImageArtifact({ localStorageRoot: input.localStorageRoot, privateObjectIdentityHash: input.privateObjectIdentityHash, contentType: CONTENT_TYPE }); if (!stored || stored.sha256 !== input.result.imageArtifact.sha256 || stored.byteLength !== input.result.imageArtifact.byteLength || !stored.bytes.equals(input.result.imageArtifact.bytes)) throw denied('libass PNG bytes changed before artifact authority.'); return stored }
function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: LibassAdapterInput) { if (stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) || stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)) throw denied('libass adapter lineage changed.') }
function assertArtifact(artifact: PersistedArtifactResult, input: LibassAdapterInput) { if (artifact.content.sha256 !== input.result.imageArtifact.sha256 || artifact.content.byteLength !== input.result.imageArtifact.byteLength || artifact.content.contentType !== CONTENT_TYPE || artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash || artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' || artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS || artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId) throw denied('Persisted libass artifact does not match actual-run evidence.') }
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T { const parsed = schema.safeParse(value); if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten()); return parsed.data }
function key(prefix: string, hash: string) { return `${prefix}-${hash.slice(0, 56)}` }
function denied(message: string) { return new ApiError('TOOL_NOT_READY', message, 409, { requiredGate: 'canonical_private_libass_execution_authority' }) }
