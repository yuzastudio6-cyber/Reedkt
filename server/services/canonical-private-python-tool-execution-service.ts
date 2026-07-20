import { createHash } from 'node:crypto'

import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  isOfflinePythonSourceToolId,
  isOfflinePythonAudioWavToolId,
  openPersistedPrivateOfflinePythonStructuredExecutionRuntime,
  readPersistedOfflinePythonStructuredRuntimeAuthority,
  validateOfflinePythonAudioPlanningPayload,
  validateOfflinePythonMediaPlanningPayload,
  validateOfflinePythonStructuredExecutionRequest,
  type OfflinePythonStructuredExecutionResult,
  type OfflinePythonStructuredExecutionRequest,
  type OfflinePythonSourceToolId,
} from '../tool-execution/python-runner-execution'
import type { ServiceContext } from '../types'
import {
  CANONICAL_PRIVATE_PYTHON_TOOL_EXECUTION_RESPONSE_VERSION,
  canonicalPrivatePythonToolExecutionAuthoritySchema,
  canonicalPrivatePythonToolExecutionResponseSchema,
  runCanonicalPrivatePythonToolSchema,
  type CanonicalPrivatePythonToolExecutionAuthority,
  type CanonicalPrivatePythonToolExecutionResponse,
  type RunCanonicalPrivatePythonToolInput,
} from '../validation/canonical-private-python-tool-execution-schemas'
import type { CanonicalExpectedArtifactLineage, PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from './canonical-private-audio-artifact-storage'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { recordCanonicalPrivateEmbeddedWorkerResourceUsage } from './canonical-private-embedded-worker-resource-usage-recorder'
import {
  createCanonicalPrivateSourceObjectReadService,
  type CanonicalPrivateSourceObjectReadResult,
} from './canonical-private-source-object-read-service'
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

const RUNNER_CLASS = 'offline_python_structured_execution_v1' as const
const JSON_CONTENT_TYPE = 'application/json' as const
type PythonArtifactContentType = typeof JSON_CONTENT_TYPE | 'audio/wav'

export function createCanonicalPrivatePythonToolExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivatePythonToolInput,
      serverAuthority: CanonicalPrivatePythonToolExecutionAuthority,
    ): Promise<CanonicalPrivatePythonToolExecutionResponse> {
      const body = parse(runCanonicalPrivatePythonToolSchema, input, 'Python tool execution identity is invalid.')
      const injected = parse(
        canonicalPrivatePythonToolExecutionAuthoritySchema,
        serverAuthority,
        'Python tool execution authority is invalid.',
      )
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actorUserId !== access.userId) throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Python tool actor is outside this workspace.', 403)

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
        binding.workspaceId !== body.workspaceId || binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId || binding.jobId !== body.jobId ||
        binding.leaseId !== injected.leaseId || dispatch.grant.grantId !== body.grantId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) throw invalidAuthority('Consumed dispatch grant does not match Python execution identity.')

      const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const planningService = createEditPlanningAuthorityService(context)
      const authority = await planningService.loadApprovedExecutionAuthority(
        readiness.job.approvedPlanSnapshotId,
        access.workspaceId,
      )
      const canonicalHashBefore = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === binding.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === binding.expectedAssetId && candidate.approvedWorkItemId === workItem?.id)
      if (!workItem || !expectedAsset) throw invalidAuthority('Python work-item or output lineage is incomplete.')
      const sourceToolId = canonicalSourceToolId(binding.canonicalToolId)
      const contentType: PythonArtifactContentType = isOfflinePythonAudioWavToolId(binding.canonicalToolId)
        ? 'audio/wav'
        : JSON_CONTENT_TYPE
      if (
        expectedAsset.contentType !== contentType || expectedAsset.assetRole === 'final' ||
        expectedAsset.previewPlaceholderAllowed || binding.expectedOutput.contentType !== contentType ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) throw invalidAuthority('Python execution is limited to its exact approved non-final output.')
      const sourcePlanningPayload = sourceToolId
        ? sourceToolId === 'pyav' || sourceToolId === 'opencv' || sourceToolId === 'pyscenedetect'
          ? validateOfflinePythonMediaPlanningPayload(sourceToolId, workItem.executionInput.structuredPayload)
          : validateOfflinePythonAudioPlanningPayload(sourceToolId, workItem.executionInput.structuredPayload)
        : undefined
      let request = sourceToolId
        ? undefined
        : validateOfflinePythonStructuredExecutionRequest({
            schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
            toolId: binding.canonicalToolId,
            operationId: binding.operationId,
            payload: workItem.executionInput.structuredPayload,
          })

      const runtimeAuthority = await readPersistedOfflinePythonStructuredRuntimeAuthority()
      if (
        !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady ||
        !runtimeAuthority.supportedOperations.some((candidate) =>
          candidate.toolId === binding.canonicalToolId && candidate.operationId === binding.operationId)
      ) throw new ApiError('TOOL_NOT_READY', 'Python runtime authority changed after dispatch.', 409)
      const runtime = await openPersistedPrivateOfflinePythonStructuredExecutionRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw invalidAuthority('Opened Python image does not match runtime authority.')
      }

      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const begun = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId, projectId: body.projectId,
        editSessionId: body.editSessionId, jobId: body.jobId,
        leaseId: injected.leaseId, leaseCredential: injected.leaseCredential,
        runnerClass: RUNNER_CLASS,
      })
      const executionAttemptId = begun.executionFence.executionAttemptId
      const sourceRead = sourceToolId
        ? await createCanonicalPrivateSourceObjectReadService(context).readExactApprovedSource({
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
        : undefined
      if (sourceToolId && sourcePlanningPayload && sourceRead) {
        request = validateOfflinePythonStructuredExecutionRequest({
          schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
          toolId: sourceToolId,
          operationId: binding.operationId,
          payload: {
            ...sourcePlanningPayload,
            mimeType: sourceRead.mimeType,
            sourceByteLength: sourceRead.byteLength,
            sourceSha256: sourceRead.sha256,
            sourceBytesBase64: sourceRead.bytes.toString('base64'),
          },
        })
      }
      if (!request) throw invalidAuthority('Python runtime request was not resolved from approved authority.')
      const executionResult = await runtime.execute(request)
      assertExecutionResult(executionResult, request, runtimeAuthority.authorityHash)
      const producedArtifact = resolveProducedArtifact(executionResult, contentType)
      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: contentType === 'audio/wav'
          ? 'canonical_private_structured_python_audio_artifact_v1'
          : 'canonical_private_structured_python_json_artifact_v1',
        workspaceId: body.workspaceId, snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId, expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId, executionAttemptId,
        contentSha256: producedArtifact.sha256,
      })
      if (contentType === 'audio/wav') {
        await persistCanonicalPrivateAudioArtifact({
          localStorageRoot: context.env.localStorageRoot,
          privateObjectIdentityHash, bytes: producedArtifact.bytes,
          expectedSha256: producedArtifact.sha256,
        })
      } else {
        await persistCanonicalStructuredJsonArtifact({
          localStorageRoot: context.env.localStorageRoot,
          privateObjectIdentityHash,
          bytes: producedArtifact.bytes,
          expectedSha256: producedArtifact.sha256,
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
        required: expectedAsset.required,
        previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
        contentType,
        segmentIds: [...expectedAsset.segmentIds], timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id, workItemKey: workItem.workItemKey,
        jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput: PythonAdapterInput = {
        localStorageRoot: context.env.localStorageRoot, identity, lineage,
        privateObjectIdentityHash, executionAttemptId,
        dispatchGrantId: body.grantId, runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt, executionResult,
        sourceRead, producedArtifact,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, createPythonAdapters(adapterInput))
      const keyHash = sha256ArtifactQaValue({
        domain: 'canonical_private_python_execution_idempotency_v1',
        input: body, executionAttemptId,
      })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity, idempotencyKey: boundedKey('python-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity, artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: boundedKey('python-qa', keyHash),
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
        idempotencyKey: boundedKey('python-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        artifactResult.artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
        !artifactResult.artifact.actualRunEvidence.actualRunVerified ||
        !completed.executionFence.commitAuthorizedAt || !completed.executionFence.completedAt
      ) throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Python output failed execution, QA, or reconciliation.', 409)
      const authorityAfter = await planningService.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId,
        access.workspaceId,
      )
      if (sha256AuthorityValue(authorityAfter) !== canonicalHashBefore) {
        throw invalidAuthority('Canonical planning authority changed during Python execution.')
      }
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
        canonicalToolId: request.toolId,
        operationId: request.operationId,
        runnerClass: RUNNER_CLASS,
        runtimeAuthorityDigest: runtimeAuthority.authorityHash,
        runtimeImageDigest: executionResult.attestation.image.imageIdentityHash,
        runtimeAttestationDigest: executionResult.attestation.attestationHash,
        observation: executionResult.evidence.resourceObservation,
        allocation: {
          nanoCpus: executionResult.evidence.confinement.nanoCpus,
          memoryLimitBytes: executionResult.evidence.confinement.memoryLimitBytes,
        },
        attemptInputHash: executionResult.evidence.requestEnvelopeSha256,
        inputArtifacts: [
          {
            artifactId: `${workItem.id}:execution_input`,
            sha256: workItem.executionInputRef.sha256,
            byteLength: workItem.executionInputRef.byteLength,
          },
          ...(sourceRead ? [{
            artifactId: `${sourceRead.sourceSequenceItemId}:source_media`,
            sha256: sourceRead.sha256,
            byteLength: sourceRead.byteLength,
          }] : []),
        ],
        outputArtifact: {
          artifactId: artifactResult.artifact.artifactId,
          sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
        },
        createdAt: reconciliation.reconciliation.createdAt,
      })
      if (
        resourceUsage.evidence.identity.executionAttemptId !== executionAttemptId
        || resourceUsage.evidence.operation.operationId !== request.operationId
      ) {
        throw invalidAuthority('Python execution resource evidence lost canonical attempt authority.')
      }

      const verifiedRun = artifactResult.artifact.actualRunEvidence
      const responseWithoutHash = {
        schemaVersion: CANONICAL_PRIVATE_PYTHON_TOOL_EXECUTION_RESPONSE_VERSION,
        source: 'canonical_private_python_tool_execution_coordinator' as const,
        purpose: body.purpose,
        identity: { ...identity, approvedWorkItemId: workItem.id, dispatchGrantId: body.grantId },
        tool: {
          canonicalToolId: request.toolId, operationId: request.operationId,
          actualLibraryOperationCompleted: true as const, providerCallMade: false as const,
          sourceObjectRead: Boolean(sourceRead), renderExecuted: false as const,
          ...(sourceRead ? {
            sourceReadEvidenceHash: sourceRead.sourceReadEvidenceHash,
            sourceSequenceItemId: sourceRead.sourceSequenceItemId,
            sourceBindingHash: sourceRead.bindingHash,
          } : {}),
        },
        lease: {
          leaseId: begun.lease.id, attemptNumber: begun.lease.attemptNumber,
          immutableLeaseHash: begun.lease.immutableLeaseHash, executionAttemptId,
          runnerClass: RUNNER_CLASS, executionStartedAt: completed.executionFence.startedAt,
          executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt,
          executionCompletedAt: completed.executionFence.completedAt,
          credentialReturned: false as const, credentialHashReturned: false as const,
        },
        runtime: {
          runtimeAuthorityHash: verifiedRun.runtimeAuthorityHash,
          imageIdentityHash: verifiedRun.runtimeImageIdentityHash,
          executionAttestationHash: verifiedRun.executionAttestationHash,
          requestEnvelopeSha256: executionResult.evidence.requestEnvelopeSha256,
          resultSha256: executionResult.evidence.resultSha256,
          privateInternalOnly: true as const, productReady: false as const,
          externalBetaReady: false as const, productionReady: false as const,
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          contentType, sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const,
          liveRuntimeDependencySatisfied: false as const, finalRenderAuthorized: false as const,
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
          sourceObjectRead: false as const, render: false as const, creditSpend: false as const,
          walletMutation: false as const, settlement: false as const, delivery: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const,
          contentAddressedArtifactAuthority: true as const,
          actualRunEvidenceVerified: true as const, actualQaEvidenceVerified: true as const,
          checksumProtectedAuthority: true as const, distributedAuthority: false as const,
          productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalPrivatePythonToolExecutionResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface PythonAdapterInput {
  localStorageRoot: string
  identity: { workspaceId: string; projectId: string; editSessionId: string; snapshotId: string; jobId: string; expectedAssetId: string }
  lineage: CanonicalExpectedArtifactLineage
  privateObjectIdentityHash: string
  executionAttemptId: string
  dispatchGrantId: string
  runtimeAuthorityHash: string
  executionStartedAt: string
  executionResult: OfflinePythonStructuredExecutionResult
  sourceRead?: CanonicalPrivateSourceObjectReadResult
  producedArtifact: {
    contentType: PythonArtifactContentType
    bytes: Buffer
    sha256: string
    byteLength: number
  }
}

function createPythonAdapters(input: PythonAdapterInput): {
  producedArtifact: ServerInjectedArtifactResultAdapter
  artifactQa: ServerInjectedArtifactQaAdapter
} {
  return {
    producedArtifact: {
      adapterKind: 'server_injected_internal_artifact_adapter',
      async collectProducedArtifact(adapterInput) {
        assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
        await assertStoredArtifact(input)
        return {
          schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          artifactVersion: 1, attemptKind: 'initial' as const,
          content: {
            sha256: input.producedArtifact.sha256,
            byteLength: input.producedArtifact.byteLength,
            contentType: input.producedArtifact.contentType,
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
              executionEvidence: input.executionResult.evidence,
              ...(input.sourceRead ? {
                sourceReadEvidenceHash: input.sourceRead.sourceReadEvidenceHash,
                sourceBindingHash: input.sourceRead.bindingHash,
              } : {}),
            }),
            startedAt: input.executionStartedAt,
            finishedAt: input.executionResult.attestation.completedAt,
            exitCode: 0 as const, toolIds: [input.executionResult.evidence.toolId],
            actualRunVerified: true as const, dispatchGrantId: input.dispatchGrantId,
            runtimeAuthorityHash: input.runtimeAuthorityHash,
            runtimeImageIdentityHash: input.executionResult.attestation.image.imageIdentityHash,
            executionAttestationHash: input.executionResult.attestation.attestationHash,
          },
          completedAt: input.executionResult.attestation.completedAt,
        }
      },
    },
    artifactQa: {
      adapterKind: 'server_injected_internal_qa_adapter',
      async evaluateArtifact(adapterInput) {
        assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
        assertPersistedArtifact(adapterInput.artifact, input)
        const stored = await assertStoredArtifact(input)
        if (
          input.producedArtifact.contentType === JSON_CONTENT_TYPE &&
          stableArtifactQaStringify(stored.document) !==
            stableArtifactQaStringify(input.executionResult.resultJson.document)
        ) {
          throw new ApiError('VALIDATION_FAILED', 'Python result document changed before QA.', 409)
        }
        return {
          schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
          evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
          evidenceClass: 'private_internal_test_attested' as const,
          gateResults: [
            {
              gateId: 'asset_received_gate' as const, category: 'asset_integrity' as const,
              status: 'passed' as const, failureScope: 'none' as const,
              evidenceHash: sha256ArtifactQaValue({ content: adapterInput.artifact.content, storage: adapterInput.artifact.storageIdentity }),
              notesCode: input.producedArtifact.contentType === 'audio/wav'
                ? 'structured_python_audio_hash_size_signature_storage_match'
                : 'structured_python_json_hash_size_storage_match',
            },
            {
              gateId: 'asset_quality_gate' as const, category: 'model_tier_policy' as const,
              status: 'passed' as const, failureScope: 'none' as const,
              evidenceHash: sha256ArtifactQaValue({
                toolId: input.executionResult.evidence.toolId,
                semanticEvidence: input.executionResult.evidence.semanticEvidence,
                resultSha256: input.executionResult.evidence.resultSha256,
                ...(input.sourceRead ? {
                  sourceReadEvidenceHash: input.sourceRead.sourceReadEvidenceHash,
                  sourceSha256: input.sourceRead.sha256,
                } : {}),
              }),
              notesCode: 'actual_structured_python_semantic_qa_passed',
            },
          ],
          recovery: {
            state: 'none' as const, action: 'none' as const,
            approvedWithinSnapshot: true, reasonCode: 'structured_python_pass_no_recovery',
          },
          evaluatedAt: new Date().toISOString(),
          actualQaEvidenceState: input.producedArtifact.contentType === 'audio/wav'
            ? 'actual_audio_tool_qa_verified_v1' as const
            : 'actual_structured_json_qa_verified_v1' as const,
          actualQaVerified: true as const,
        }
      },
    },
  }
}

async function assertStoredArtifact(input: PythonAdapterInput): Promise<{
  bytes: Buffer
  byteLength: number
  sha256: string
  document?: Readonly<Record<string, unknown>>
}> {
  const stored = input.producedArtifact.contentType === 'audio/wav'
    ? await readCanonicalPrivateAudioArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: input.privateObjectIdentityHash,
      })
    : await readCanonicalStructuredJsonArtifact({
        localStorageRoot: input.localStorageRoot,
        privateObjectIdentityHash: input.privateObjectIdentityHash,
      })
  if (
    !stored || stored.sha256 !== input.producedArtifact.sha256 ||
    stored.byteLength !== input.producedArtifact.byteLength ||
    !stored.bytes.equals(input.producedArtifact.bytes)
  ) throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Python artifact bytes changed before artifact authority.', 409)
  return stored
}

function assertAdapterLineage(identity: Record<string, unknown>, lineage: CanonicalExpectedArtifactLineage, input: PythonAdapterInput): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)
  ) throw invalidAuthority('Python adapter received different canonical lineage.')
}

function assertPersistedArtifact(artifact: PersistedArtifactResult, input: PythonAdapterInput): void {
  if (
    artifact.artifactVersion !== 1 || artifact.content.sha256 !== input.producedArtifact.sha256 ||
    artifact.content.byteLength !== input.producedArtifact.byteLength ||
    artifact.content.contentType !== input.producedArtifact.contentType ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash ||
    artifact.placeholder.isPlaceholder || artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId ||
    artifact.actualRunEvidence.executionAttemptId !== input.executionAttemptId
  ) throw invalidAuthority('Persisted Python result does not match actual-run evidence.')
}

function assertExecutionResult(
  result: OfflinePythonStructuredExecutionResult,
  request: OfflinePythonStructuredExecutionRequest,
  runtimeAuthorityHash: string,
): void {
  if (
    result.evidence.toolId !== request.toolId || result.evidence.operationId !== request.operationId ||
    result.evidence.containerExitCode !== 0 || result.evidence.oomKilled ||
    result.resultJson.mimeType !== JSON_CONTENT_TYPE ||
    result.resultJson.byteLength !== result.resultJson.bytes.byteLength ||
    result.evidence.resultSha256 !== result.resultJson.sha256 ||
    result.attestation.readiness.privateInternalOnly !== true ||
    result.attestation.readiness.productReady !== false ||
    result.attestation.readiness.externalBetaReady !== false ||
    result.attestation.readiness.productionReady !== false ||
    !/^[a-f0-9]{64}$/.test(runtimeAuthorityHash)
  ) throw invalidAuthority('Python runtime result failed exact operation verification.')
}

function boundedKey(prefix: string, hash: string): string { return `${prefix}-${hash.slice(0, 56)}` }
function canonicalSourceToolId(
  value: string,
): OfflinePythonSourceToolId | undefined {
  return isOfflinePythonSourceToolId(value) ? value : undefined
}
function resolveProducedArtifact(
  executionResult: OfflinePythonStructuredExecutionResult,
  contentType: PythonArtifactContentType,
): PythonAdapterInput['producedArtifact'] {
  if (contentType === JSON_CONTENT_TYPE) {
    return {
      contentType, bytes: executionResult.resultJson.bytes,
      sha256: executionResult.resultJson.sha256,
      byteLength: executionResult.resultJson.byteLength,
    }
  }
  const value = executionResult.resultJson.document.audioArtifact
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidAuthority('pydub result is missing its bounded audio artifact.')
  }
  const record = value as Record<string, unknown>
  if (
    Object.keys(record).sort().join(',') !== 'byteLength,bytesBase64,mimeType,sha256' ||
    record.mimeType !== 'audio/wav' || !Number.isSafeInteger(record.byteLength) ||
    Number(record.byteLength) < 44 || Number(record.byteLength) > 8 * 1024 * 1024 ||
    typeof record.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sha256) ||
    typeof record.bytesBase64 !== 'string'
  ) throw invalidAuthority('pydub audio artifact metadata is invalid.')
  const bytes = Buffer.from(record.bytesBase64, 'base64')
  if (
    bytes.toString('base64') !== record.bytesBase64 || bytes.byteLength !== record.byteLength ||
    createHash('sha256').update(bytes).digest('hex') !== record.sha256 ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw invalidAuthority('pydub audio bytes do not match their immutable commitment.')
  return {
    contentType, bytes, sha256: record.sha256, byteLength: bytes.byteLength,
  }
}
function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  return parsed.data
}
function invalidAuthority(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_python_tool_execution_authority',
  })
}
