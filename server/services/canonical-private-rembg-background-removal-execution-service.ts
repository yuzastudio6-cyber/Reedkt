import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  buildOfflineRembgBackgroundRemovalApprovedRequest,
  openPrivateOfflineRembgBackgroundRemovalRuntime,
  readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority,
  type OfflineRembgBackgroundRemovalExecutionResult,
} from '../tool-execution/rembg-background-removal-execution'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateRembgBackgroundRemovalAuthoritySchema,
  canonicalPrivateRembgBackgroundRemovalResponseSchema,
  runCanonicalPrivateRembgBackgroundRemovalSchema,
  type CanonicalPrivateRembgBackgroundRemovalAuthority,
  type CanonicalPrivateRembgBackgroundRemovalResponse,
  type RunCanonicalPrivateRembgBackgroundRemovalInput,
} from '../validation/canonical-private-rembg-background-removal-execution-schemas'
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

const RUNNER_CLASS = 'offline_rembg_background_removal_execution_v1' as const
const TOOL_ID = 'rembg' as const
const OPERATION_ID = 'tool.rembg.remove_image_background.v1' as const
const CONTENT_TYPE = 'image/png' as const

export function createCanonicalPrivateRembgBackgroundRemovalExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateRembgBackgroundRemovalInput,
      serverAuthority: CanonicalPrivateRembgBackgroundRemovalAuthority,
    ): Promise<CanonicalPrivateRembgBackgroundRemovalResponse> {
      const body = parse(runCanonicalPrivateRembgBackgroundRemovalSchema, input, 'rembg execution identity is invalid.')
      const injected = parse(canonicalPrivateRembgBackgroundRemovalAuthoritySchema, serverAuthority, 'rembg execution authority is invalid.')
      const actor = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actor !== access.userId) throw denied('rembg execution actor is outside this workspace.')

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
        binding.canonicalToolId !== TOOL_ID || binding.operationId !== OPERATION_ID ||
        binding.leaseId !== injected.leaseId || binding.jobId !== body.jobId ||
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized && !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw denied('Consumed dispatch grant does not match the exact rembg execution identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planning = createEditPlanningAuthorityService(context)
      const authority = await planning.loadApprovedExecutionAuthority(readiness.job.approvedPlanSnapshotId, access.workspaceId)
      const beforeHash = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) => candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw denied('rembg work-item or output lineage is missing.')
      const request = buildOfflineRembgBackgroundRemovalApprovedRequest({ toolId: TOOL_ID, operationId: binding.operationId, planningPayload: workItem.executionInput.structuredPayload })
      if (
        expectedAsset.contentType !== CONTENT_TYPE || binding.expectedOutput.contentType !== CONTENT_TYPE ||
        expectedAsset.assetRole === 'final' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey || readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId || workItem.sourceSequenceItemIds.length !== 0 ||
        workItem.dependencyKeys.length !== 0
      ) throw denied('rembg canonical execution is limited to the approved dependency-free server fixture PNG.')

      const runtimeAuthority = await readPersistedOfflineRembgBackgroundRemovalRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady || !runtimeAuthority.readiness.licenseReviewStillRequiredForProduction ||
        !runtimeAuthority.supportedOperations.some((operation) => operation.toolId === TOOL_ID && operation.operationId === OPERATION_ID)
      ) throw denied('rembg runtime authority changed after dispatch.')
      const runtime = await openPrivateOfflineRembgBackgroundRemovalRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) throw denied('Opened rembg image does not match dispatch-time authority.')

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
      const result = await runtime.execute(request)
      assertExecutionResult(result)
      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_rembg_background_removal_png_v1',
        workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId,
        executionAttemptId,
        contentSha256: result.artifact.sha256,
      })
      await persistCanonicalPrivateImageArtifact({ localStorageRoot: context.env.localStorageRoot, privateObjectIdentityHash, contentType: CONTENT_TYPE, bytes: result.artifact.bytes, expectedSha256: result.artifact.sha256 })

      const identity = { workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId, snapshotId: authority.snapshot.snapshotId, jobId: body.jobId, expectedAssetId: expectedAsset.id }
      const lineage: CanonicalExpectedArtifactLineage = {
        assetId: expectedAsset.id, outputKey: expectedAsset.outputKey, artifactType: expectedAsset.artifactType,
        assetRole: expectedAsset.assetRole, required: expectedAsset.required,
        previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed, contentType: CONTENT_TYPE,
        segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds], approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey, jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash, snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: AdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage, privateObjectIdentityHash,
        executionAttemptId, dispatchGrantId: body.grantId, runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt, result,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({ domain: 'canonical_rembg_background_removal_idempotency_v1', body, executionAttemptId })
      const artifactResult = await artifactAuthority.recordArtifactResult({ ...identity, idempotencyKey: key('rembg-artifact', keyHash), purpose: 'record_server_verified_internal_artifact_result' })
      const qaResult = await artifactAuthority.recordArtifactQa({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('rembg-qa', keyHash), purpose: 'record_server_verified_internal_artifact_qa' })
      const completed = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId, editSessionId: body.editSessionId,
        jobId: body.jobId, leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS, executionAttemptId,
      })
      const reconciliation = await artifactAuthority.reconcileArtifact({ ...identity, artifactId: artifactResult.artifact.artifactId, idempotencyKey: key('rembg-reconcile', keyHash), purpose: 'reconcile_server_verified_internal_artifact' })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' || reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied || !completed.executionFence.commitAuthorizedAt ||
        !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'rembg output failed QA or reconciliation.', 409)
      if (sha256AuthorityValue(await planning.loadApprovedExecutionAuthority(authority.snapshot.snapshotId, access.workspaceId)) !== beforeHash) throw denied('Canonical authority changed during rembg execution.')

      const semantic = result.evidence.semanticEvidence
      const responseWithoutHash = {
        schemaVersion: 'canonical-private-rembg-background-removal-execution-response-v1' as const,
        source: 'canonical_private_rembg_background_removal_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: { canonicalToolId: TOOL_ID, operationId: OPERATION_ID, actualPackageEntrypointCompleted: true as const, approvedServerOwnedFixtureOnly: true as const, callerMediaAllowed: false as const, callerModelAllowed: false as const, licenseReviewStillRequiredForProduction: true as const, providerCallMade: false as const, sourceObjectRead: false as const, renderExecuted: false as const, finalExportExecuted: false as const },
        lease: { leaseId: begun.lease.id, attemptNumber: begun.lease.attemptNumber, immutableLeaseHash: begun.lease.immutableLeaseHash, executionAttemptId, runnerClass: RUNNER_CLASS, executionStartedAt: completed.executionFence.startedAt, executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt, executionCompletedAt: completed.executionFence.completedAt, credentialReturned: false as const, credentialHashReturned: false as const },
        runtime: { runtimeAuthorityHash: runtimeAuthority.authorityHash, imageIdentityHash: runtime.image.imageIdentityHash, executionAttestationHash: result.attestation.attestationHash, requestEnvelopeSha256: result.evidence.requestEnvelopeSha256, packageName: 'rembg' as const, packageVersion: '2.0.76' as const, onnxRuntimeVersion: '1.27.0' as const, modelId: 'u2netp' as const, modelSha256: '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const, modelByteLength: 4_574_861 as const, modelUpstreamLicense: 'Apache-2.0' as const, debianSnapshot: '20260623T000000Z' as const, zeroNetworkVerified: true as const, cpuExecutionProviderOnly: true as const, runtimeModelDownloadAllowed: false as const, privateInternalOnly: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const },
        result: { artifactId: artifactResult.artifact.artifactId, qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId, reconciliationId: reconciliation.reconciliation.reconciliationId, artifactVersion: artifactResult.artifact.artifactVersion, contentType: CONTENT_TYPE, sha256: artifactResult.artifact.content.sha256, byteLength: 3231 as const, width: 128 as const, height: 128 as const, alphaMinimum: 0 as const, alphaMaximum: 255 as const, alphaUniqueValueCount: 160 as const, foregroundAlphaMean: 226.802912 as const, backgroundAlphaMean: 2.492606 as const, foregroundSeparationVerified: true as const, privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash, qaOutcome: 'passed' as const, reconciliationDecision: 'test_merged_not_live_authorized' as const, privateTestDependencySatisfied: true as const, liveRuntimeDependencySatisfied: false as const, finalRenderAuthorized: false as const },
        replay: { dispatchConsumptionReplayed: dispatch.consumptionReplayed, executionFenceBeginReplayed: begun.replayed, executionFenceCompleteReplayed: completed.replayed, artifactRecordReplayed: artifactResult.replayed, qaRecordReplayed: qaResult.replayed, reconciliationReplayed: reconciliation.replayed, sameIdempotentAttemptOnly: true as const },
        permissions: { furtherWorkerDispatch: false as const, providerCall: false as const, sourceObjectRead: false as const, render: false as const, creditSpend: false as const, walletMutation: false as const, settlement: false as const, delivery: false as const },
        persistence: { privateLocalCreateOnlyArtifact: true as const, contentAddressedArtifactAuthority: true as const, actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const, checksumProtectedAuthority: true as const, distributedAuthority: false as const, productionAuthority: false as const },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      void semantic
      return canonicalPrivateRembgBackgroundRemovalResponseSchema.parse({ ...responseWithoutHash, responseHash: sha256AuthorityValue(responseWithoutHash) })
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
  result: OfflineRembgBackgroundRemovalExecutionResult
}

function adapters(input: AdapterInput): { producedArtifact: ServerInjectedArtifactResultAdapter; artifactQa: ServerInjectedArtifactQaAdapter } {
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
          content: { sha256: input.result.artifact.sha256, byteLength: input.result.artifact.byteLength, contentType: CONTENT_TYPE },
          storageIdentity: { storageKind: 'private_local_test' as const, opaqueObjectIdentityHash: input.privateObjectIdentityHash },
          placeholder: { isPlaceholder: false, scope: 'none' as const },
          actualRunEvidence: { state: 'actual_run_evidence_verified_v2' as const, executionAttemptId: input.executionAttemptId, runnerClass: RUNNER_CLASS, runnerEvidenceHash: sha256ArtifactQaValue(input.result.evidence), startedAt: input.executionStartedAt, finishedAt: input.result.attestation.completedAt, exitCode: 0 as const, toolIds: [TOOL_ID], actualRunVerified: true as const, dispatchGrantId: input.dispatchGrantId, runtimeAuthorityHash: input.runtimeAuthorityHash, runtimeImageIdentityHash: input.result.attestation.imageIdentityHash, executionAttestationHash: input.result.attestation.attestationHash },
          completedAt: input.result.attestation.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        assertLineage(adapterInput.identity, adapterInput.lineage, input)
        assertArtifact(adapterInput.artifact, input)
        await assertStored(input)
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [
            { gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue({ content: adapterInput.artifact.content, storage: adapterInput.artifact.storageIdentity }), notesCode: 'rembg_png_hash_size_signature_storage_match' },
            { gateId: 'asset_quality_gate' as const, category: 'visual_assets' as const, status: 'passed' as const, failureScope: 'none' as const, evidenceHash: sha256ArtifactQaValue(input.result.evidence.semanticEvidence), notesCode: 'actual_rembg_alpha_separation_semantic_qa_passed' },
          ],
          recovery: { state: 'none' as const, action: 'none' as const, approvedWithinSnapshot: true, reasonCode: 'rembg_pass_no_recovery' },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: 'actual_image_tool_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

async function assertStored(input: AdapterInput) {
  const stored = await readCanonicalPrivateImageArtifact({ localStorageRoot: input.localStorageRoot, privateObjectIdentityHash: input.privateObjectIdentityHash, contentType: CONTENT_TYPE })
  if (!stored || stored.sha256 !== input.result.artifact.sha256 || stored.byteLength !== input.result.artifact.byteLength || !stored.bytes.equals(input.result.artifact.bytes)) throw denied('rembg bytes changed before artifact authority.')
  return stored
}

function assertExecutionResult(result: OfflineRembgBackgroundRemovalExecutionResult) {
  const semantic = result.evidence.semanticEvidence
  if (
    result.request.toolId !== TOOL_ID || result.request.operationId !== OPERATION_ID || result.artifact.mimeType !== CONTENT_TYPE ||
    result.artifact.sha256 !== '668366803056dc51a75cafc5ad2be9363146fa22a1ed5cba481815944759fd45' || result.artifact.byteLength !== 3231 ||
    result.evidence.packageName !== 'rembg' || result.evidence.packageVersion !== '2.0.76' || result.evidence.onnxRuntimeVersion !== '1.27.0' ||
    result.evidence.modelId !== 'u2netp' || result.evidence.modelSha256 !== '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' ||
    semantic.actualPackageEntrypointExecuted !== true || semantic.zeroNetworkRuntimeRequired !== true ||
    semantic.cpuExecutionProviderOnly !== true || semantic.runtimeModelDownloadAllowed !== false ||
    semantic.foregroundSeparationVerified !== true || result.readiness.productReady ||
    !result.readiness.licenseReviewStillRequiredForProduction
  ) throw denied('rembg result failed exact package, model, artifact, or semantic verification.')
}

function assertLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: AdapterInput) {
  if (stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) || stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)) throw denied('rembg adapter lineage changed.')
}

function assertArtifact(artifact: PersistedArtifactResult, input: AdapterInput) {
  if (artifact.content.sha256 !== input.result.artifact.sha256 || artifact.content.byteLength !== input.result.artifact.byteLength || artifact.content.contentType !== CONTENT_TYPE || artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash || artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' || artifact.actualRunEvidence.runnerClass !== RUNNER_CLASS || artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId) throw denied('Persisted rembg artifact does not match actual-run evidence.')
}

function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function key(prefix: string, hash: string) { return `${prefix}-${hash.slice(0, 52)}` }
function denied(message: string) { return new ApiError('TOOL_NOT_READY', message, 409, { requiredGate: 'canonical_private_rembg_background_removal_execution_authority' }) }
