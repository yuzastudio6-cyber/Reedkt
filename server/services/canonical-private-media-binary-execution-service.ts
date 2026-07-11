import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobeExecutionRequest,
  validateOfflineFfprobePlanningPayload,
  type OfflineFfmpegExecutionResult,
  type OfflineFfprobeExecutionResult,
} from '../tool-execution/media-binary-execution'
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
import { createCanonicalPrivateSourceObjectReadService } from './canonical-private-source-object-read-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import {
  persistCanonicalPrivateMediaArtifact,
  readCanonicalPrivateMediaArtifact,
} from './canonical-private-media-artifact-storage'
import {
  persistCanonicalStructuredJsonArtifact,
  readCanonicalStructuredJsonArtifact,
} from './canonical-structured-json-artifact-storage'
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
      const contentType = toolId === 'ffmpeg' ? 'video/x-nut' as const : 'application/json' as const
      if (
        !workItem || !expectedAsset || expectedAsset.contentType !== contentType ||
        expectedAsset.assetRole === 'final' || expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.contentType !== contentType ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) throw denied('Media binary work-item or exact non-final output lineage is invalid.')
      const planningPayload = toolId === 'ffmpeg'
        ? validateOfflineFfmpegPlanningPayload(workItem.executionInput.structuredPayload)
        : validateOfflineFfprobePlanningPayload(workItem.executionInput.structuredPayload)

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
      const sourceRead = await createCanonicalPrivateSourceObjectReadService(context).readExactApprovedSource({
        workspaceId: body.workspaceId, projectId: body.projectId,
        snapshotId: authority.snapshot.snapshotId, jobId: body.jobId,
        approvedWorkItem: workItem, approvedSourceManifest: authority.sourceAssetManifest,
        leaseId: injected.leaseId, executionAttemptId, dispatchGrantId: body.grantId,
      })
      const sourcePayload = {
        mimeType: sourceRead.mimeType,
        sourceByteLength: sourceRead.byteLength,
        sourceSha256: sourceRead.sha256,
        sourceBytesBase64: sourceRead.bytes.toString('base64'),
      }
      const executionResult = toolId === 'ffmpeg'
        ? await runtime.execute(validateOfflineFfmpegExecutionRequest({
            schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
            toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
            payload: { ...planningPayload, ...sourcePayload },
          }))
        : await runtime.execute(validateOfflineFfprobeExecutionRequest({
            schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
            toolId, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
            payload: { ...planningPayload, ...sourcePayload },
          }))
      const normalized = normalizeExecutionResult(executionResult)
      if (
        executionResult.evidence.toolId !== toolId ||
        executionResult.evidence.operationId !== binding.operationId ||
        executionResult.evidence.sourceSha256 !== sourceRead.sha256 ||
        executionResult.evidence.containerExitCode !== 0 || executionResult.evidence.oomKilled ||
        executionResult.readiness.productReady || normalized.contentType !== contentType
      ) throw denied('Media binary result failed exact execution verification.')

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_media_binary_artifact_v1',
        workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId, executionAttemptId,
        contentSha256: normalized.sha256,
      })
      if (contentType === 'application/json') {
        await persistCanonicalStructuredJsonArtifact({
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
        executionResult, normalized, sourceReadEvidenceHash: sourceRead.sourceReadEvidenceHash,
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
        schemaVersion: 'canonical-private-media-binary-execution-response-v1' as const,
        source: 'canonical_private_media_binary_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: toolId, operationId: binding.operationId,
          actualBinaryOperationCompleted: true as const, providerCallMade: false as const,
          sourceObjectRead: true as const, sourceReadEvidenceHash: sourceRead.sourceReadEvidenceHash,
          sourceSequenceItemId: sourceRead.sourceSequenceItemId,
          sourceBindingHash: sourceRead.bindingHash,
          renderExecuted: false as const, finalExportExecuted: false as const,
        },
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
  sourceReadEvidenceHash: string
}

interface NormalizedMediaBinaryResult {
  contentType: 'application/json' | 'video/x-nut'
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
              sourceReadEvidenceHash: input.sourceReadEvidenceHash,
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
              sourceReadEvidenceHash: input.sourceReadEvidenceHash,
            }),
            notesCode: input.executionResult.evidence.toolId === 'ffmpeg'
              ? 'ffmpeg_media_source_hash_size_storage_match'
              : 'ffprobe_json_source_hash_size_storage_match',
          }, {
            gateId: 'asset_quality_gate' as const, category: 'model_tier_policy' as const,
            status: 'passed' as const, failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue(input.executionResult.evidence.semanticEvidence),
            notesCode: input.executionResult.evidence.toolId === 'ffmpeg'
              ? 'actual_ffmpeg_semantic_qa_passed'
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
