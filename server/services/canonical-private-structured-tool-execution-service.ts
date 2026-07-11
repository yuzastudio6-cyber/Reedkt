import { createHash } from 'node:crypto'
import type { ZodType } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  openPersistedPrivateOfflineNodeStructuredExecutionRuntime,
  readPersistedOfflineNodeStructuredRuntimeAuthority,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-service'
import {
  validateOfflineNodeStructuredExecutionRequest,
  type OfflineNodeStructuredExecutionRequest,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-protocol'
import type { OfflineNodeStructuredExecutionResult } from '../tool-execution/node-runner-execution/offline-node-structured-execution-types'
import type { ServiceContext } from '../types'
import {
  CANONICAL_PRIVATE_STRUCTURED_TOOL_EXECUTION_RESPONSE_VERSION,
  canonicalPrivateStructuredToolExecutionAuthoritySchema,
  canonicalPrivateStructuredToolExecutionResponseSchema,
  runCanonicalPrivateStructuredToolSchema,
  type CanonicalPrivateStructuredToolExecutionAuthority,
  type CanonicalPrivateStructuredToolExecutionResponse,
  type RunCanonicalPrivateStructuredToolInput,
} from '../validation/canonical-private-structured-tool-execution-schemas'
import type {
  CanonicalExpectedArtifactLineage,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import {
  persistCanonicalStructuredSvgArtifact,
  readCanonicalStructuredSvgArtifact,
} from './canonical-structured-svg-artifact-storage'
import { isCanonicalStructuredSvgSafe } from './canonical-structured-svg-safety-policy'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import {
  createPrivateArtifactQaAuthorityService,
  type ServerInjectedArtifactQaAdapter,
  type ServerInjectedArtifactResultAdapter,
} from './private-artifact-qa-authority-service'
import {
  sha256ArtifactQaValue,
  stableArtifactQaStringify,
} from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const RUNNER_CLASS = 'offline_node_structured_execution_v1' as const
const SVG_CONTENT_TYPE = 'image/svg+xml' as const

/**
 * Runs one exact, already-authorized structured operation. Caller input is
 * identity-only; lease and dispatch credentials are server-injected, while the
 * payload is reloaded from the immutable approved work item.
 */
export function createCanonicalPrivateStructuredToolExecutionService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalPrivateStructuredToolInput,
      serverAuthority: CanonicalPrivateStructuredToolExecutionAuthority,
    ): Promise<CanonicalPrivateStructuredToolExecutionResponse> {
      const body = parse(runCanonicalPrivateStructuredToolSchema, input, 'Structured tool execution identity is invalid.')
      const injected = parse(
        canonicalPrivateStructuredToolExecutionAuthoritySchema,
        serverAuthority,
        'Structured tool execution authority is invalid.',
      )
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (actorUserId !== access.userId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Structured tool execution actor is outside this workspace.', 403)
      }

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
        binding.workspaceId !== body.workspaceId ||
        binding.projectId !== body.projectId ||
        binding.editSessionId !== body.editSessionId ||
        binding.jobId !== body.jobId ||
        binding.leaseId !== injected.leaseId ||
        dispatch.grant.grantId !== body.grantId ||
        (!dispatch.executionAuthority.newExecutionStartAuthorized &&
          !dispatch.executionAuthority.resumeSameIdempotentAttemptOnly)
      ) {
        throw invalidAuthority('Consumed dispatch grant does not match this exact structured execution identity.')
      }

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
      if (!workItem || !expectedAsset) {
        throw invalidAuthority('Structured dispatch work-item or expected-output lineage is incomplete.')
      }
      if (
        expectedAsset.contentType !== SVG_CONTENT_TYPE ||
        expectedAsset.assetRole === 'final' ||
        expectedAsset.previewPlaceholderAllowed ||
        binding.expectedOutput.contentType !== SVG_CONTENT_TYPE ||
        binding.expectedOutput.outputKey !== expectedAsset.outputKey ||
        readiness.job.approvedWorkItemId !== workItem.id ||
        binding.approvedPlanSnapshotId !== authority.snapshot.snapshotId
      ) {
        throw invalidAuthority('Structured tool execution is limited to the exact approved non-final SVG output.')
      }
      const structuredRequest = validateOfflineNodeStructuredExecutionRequest({
        toolId: binding.canonicalToolId,
        operationId: binding.operationId,
        payload: workItem.executionInput.structuredPayload,
      })

      const runtimeAuthority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
      if (
        !runtimeAuthority ||
        !runtimeAuthority.readiness.privateInternalExecutionReady ||
        runtimeAuthority.readiness.productReady ||
        !runtimeAuthority.supportedOperations.some((candidate) =>
          candidate.toolId === structuredRequest.toolId &&
          candidate.operationId === structuredRequest.operationId)
      ) {
        throw new ApiError('TOOL_NOT_READY', 'Private structured runtime authority changed after dispatch.', 409)
      }
      const runtime = await openPersistedPrivateOfflineNodeStructuredExecutionRuntime()
      if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
        throw invalidAuthority('Opened structured runtime image does not match persisted runtime authority.')
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
      const executionResult = await runtime.execute(structuredRequest)
      assertExecutionResult(executionResult, structuredRequest, runtimeAuthority.authorityHash)

      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: 'canonical_private_structured_svg_artifact_v1',
        workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
        dispatchGrantId: body.grantId,
        executionAttemptId,
        contentSha256: executionResult.svg.sha256,
      })
      await persistCanonicalStructuredSvgArtifact({
        localStorageRoot: context.env.localStorageRoot,
        privateObjectIdentityHash,
        bytes: executionResult.svg.bytes,
        expectedSha256: executionResult.svg.sha256,
      })

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
        contentType: SVG_CONTENT_TYPE,
        segmentIds: [...expectedAsset.segmentIds],
        timingIds: [...expectedAsset.timingIds],
        rendererLayerIds: [...expectedAsset.rendererLayerIds],
        approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey,
        jobType: workItem.workItemType,
        jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
        snapshotHash: readiness.authorityHashes.snapshotHash,
        approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      }
      const adapterInput = {
        localStorageRoot: context.env.localStorageRoot,
        identity,
        lineage,
        privateObjectIdentityHash,
        executionAttemptId,
        dispatchGrantId: body.grantId,
        runtimeAuthorityHash: runtimeAuthority.authorityHash,
        executionStartedAt: begun.executionFence.startedAt,
        executionResult,
      }
      const artifactAuthority = createPrivateArtifactQaAuthorityService(
        context,
        createStructuredSvgAdapters(adapterInput),
      )
      const keyHash = sha256ArtifactQaValue({
        domain: 'canonical_private_structured_tool_execution_idempotency_v1',
        input: body,
        executionAttemptId,
      })
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity,
        idempotencyKey: boundedKey('structured-artifact', keyHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: boundedKey('structured-qa', keyHash),
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
        idempotencyKey: boundedKey('structured-reconcile', keyHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliation.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !reconciliation.reconciliation.privateTestDependencySatisfied ||
        artifactResult.artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
        !artifactResult.artifact.actualRunEvidence.actualRunVerified ||
        !completed.executionFence.commitAuthorizedAt ||
        !completed.executionFence.completedAt
      ) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Structured SVG output did not pass execution, QA, and reconciliation.', 409)
      }
      const authorityAfter = await planningService.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId,
        access.workspaceId,
      )
      if (sha256AuthorityValue(authorityAfter) !== canonicalHashBefore) {
        throw invalidAuthority('Canonical planning authority changed during structured tool execution.')
      }

      const verifiedRun = artifactResult.artifact.actualRunEvidence
      const responseWithoutHash = {
        schemaVersion: CANONICAL_PRIVATE_STRUCTURED_TOOL_EXECUTION_RESPONSE_VERSION,
        source: 'canonical_private_structured_tool_execution_coordinator' as const,
        purpose: body.purpose,
        identity: {
          ...identity,
          approvedWorkItemId: workItem.id,
          dispatchGrantId: body.grantId,
        },
        tool: {
          canonicalToolId: structuredRequest.toolId,
          operationId: structuredRequest.operationId,
          actualLibraryOperationCompleted: true as const,
          providerCallMade: false as const,
          sourceObjectRead: false as const,
          renderExecuted: false as const,
        },
        lease: {
          leaseId: begun.lease.id,
          attemptNumber: begun.lease.attemptNumber,
          immutableLeaseHash: begun.lease.immutableLeaseHash,
          executionAttemptId,
          runnerClass: RUNNER_CLASS,
          executionStartedAt: completed.executionFence.startedAt,
          executionCommitAuthorizedAt: completed.executionFence.commitAuthorizedAt,
          executionCompletedAt: completed.executionFence.completedAt,
          credentialReturned: false as const,
          credentialHashReturned: false as const,
        },
        runtime: {
          runtimeAuthorityHash: verifiedRun.runtimeAuthorityHash,
          imageIdentityHash: verifiedRun.runtimeImageIdentityHash,
          executionAttestationHash: verifiedRun.executionAttestationHash,
          requestEnvelopeSha256: executionResult.evidence.requestEnvelopeSha256,
          runnerInputSha256: executionResult.evidence.runnerInputSha256,
          privateInternalOnly: true as const,
          productReady: false as const,
          externalBetaReady: false as const,
          productionReady: false as const,
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliation.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          contentType: SVG_CONTENT_TYPE,
          sha256: artifactResult.artifact.content.sha256,
          byteLength: artifactResult.artifact.content.byteLength,
          privateObjectIdentityHash: artifactResult.artifact.storageIdentity.opaqueObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const,
          liveRuntimeDependencySatisfied: false as const,
          finalRenderAuthorized: false as const,
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
          furtherWorkerDispatch: false as const,
          providerCall: false as const,
          sourceObjectRead: false as const,
          render: false as const,
          creditSpend: false as const,
          walletMutation: false as const,
          settlement: false as const,
          delivery: false as const,
        },
        persistence: {
          privateLocalCreateOnlyArtifact: true as const,
          contentAddressedArtifactAuthority: true as const,
          actualRunEvidenceVerified: true as const,
          actualQaEvidenceVerified: true as const,
          checksumProtectedAuthority: true as const,
          distributedAuthority: false as const,
          productionAuthority: false as const,
        },
        completedAt: reconciliation.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalPrivateStructuredToolExecutionResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

interface StructuredSvgAdapterInput {
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
  executionResult: OfflineNodeStructuredExecutionResult
}

function createStructuredSvgAdapters(input: StructuredSvgAdapterInput): {
  producedArtifact: ServerInjectedArtifactResultAdapter
  artifactQa: ServerInjectedArtifactQaAdapter
} {
  const producedArtifact: ServerInjectedArtifactResultAdapter = {
    adapterKind: 'server_injected_internal_artifact_adapter',
    async collectProducedArtifact(adapterInput) {
      assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
      await assertStoredSvg(input)
      return {
        schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
        evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
        evidenceClass: 'private_internal_test_attested' as const,
        artifactVersion: 1,
        attemptKind: 'initial' as const,
        content: {
          sha256: input.executionResult.svg.sha256,
          byteLength: input.executionResult.svg.byteLength,
          contentType: SVG_CONTENT_TYPE,
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
          runnerEvidenceHash: sha256ArtifactQaValue(input.executionResult.evidence),
          startedAt: input.executionStartedAt,
          finishedAt: input.executionResult.attestation.completedAt,
          exitCode: 0 as const,
          toolIds: [input.executionResult.evidence.toolId],
          actualRunVerified: true as const,
          dispatchGrantId: input.dispatchGrantId,
          runtimeAuthorityHash: input.runtimeAuthorityHash,
          runtimeImageIdentityHash: input.executionResult.attestation.image.imageIdentityHash,
          executionAttestationHash: input.executionResult.attestation.attestationHash,
        },
        completedAt: input.executionResult.attestation.completedAt,
      }
    },
  }

  const artifactQa: ServerInjectedArtifactQaAdapter = {
    adapterKind: 'server_injected_internal_qa_adapter',
    async evaluateArtifact(adapterInput) {
      assertAdapterLineage(adapterInput.identity, adapterInput.lineage, input)
      assertPersistedArtifact(adapterInput.artifact, input)
      const stored = await assertStoredSvg(input)
      assertSafeSvg(stored.bytes, input.executionResult)
      return {
        schemaVersion: 'server-internal-artifact-qa-evidence-v1' as const,
        evidenceOrigin: 'server_injected_internal_qa_adapter' as const,
        evidenceClass: 'private_internal_test_attested' as const,
        gateResults: [
          {
            gateId: 'asset_received_gate' as const,
            category: 'asset_integrity' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              content: adapterInput.artifact.content,
              storageIdentity: adapterInput.artifact.storageIdentity,
            }),
            notesCode: 'structured_svg_hash_size_private_storage_match',
          },
          {
            gateId: 'asset_quality_gate' as const,
            category: 'visual_assets' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: sha256ArtifactQaValue({
              semanticEvidence: input.executionResult.evidence.semanticEvidence,
              requestEnvelopeSha256: input.executionResult.evidence.requestEnvelopeSha256,
              runnerInputSha256: input.executionResult.evidence.runnerInputSha256,
            }),
            notesCode: 'actual_structured_svg_semantic_and_safety_qa_passed',
          },
        ],
        recovery: {
          state: 'none' as const,
          action: 'none' as const,
          approvedWithinSnapshot: true,
          reasonCode: 'structured_svg_pass_no_recovery',
        },
        evaluatedAt: new Date().toISOString(),
        actualQaEvidenceState: 'actual_structured_svg_qa_verified_v1' as const,
        actualQaVerified: true as const,
      }
    },
  }
  return { producedArtifact, artifactQa }
}

async function assertStoredSvg(input: StructuredSvgAdapterInput) {
  const stored = await readCanonicalStructuredSvgArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.privateObjectIdentityHash,
  })
  if (
    !stored ||
    stored.sha256 !== input.executionResult.svg.sha256 ||
    stored.byteLength !== input.executionResult.svg.byteLength ||
    !stored.bytes.equals(input.executionResult.svg.bytes)
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Structured SVG bytes changed before artifact authority.', 409)
  }
  return stored
}

function assertSafeSvg(bytes: Buffer, result: OfflineNodeStructuredExecutionResult): void {
  const svg = bytes.toString('utf8')
  const semantics = result.evidence.semanticEvidence
  const toolSpecificSemanticsVerified = result.evidence.toolId === 'satori'
    ? semantics.pathElementCount >= 1
    : semantics.textElementCount >= 1
  if (
    !isCanonicalStructuredSvgSafe(svg) ||
    semantics.svgRootCount !== 1 ||
    semantics.elementCount < 1 ||
    !toolSpecificSemanticsVerified
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Actual structured SVG failed semantic or active-content QA.', 409)
  }
}

function assertAdapterLineage(
  identity: Record<string, unknown>,
  lineage: CanonicalExpectedArtifactLineage,
  input: StructuredSvgAdapterInput,
): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(input.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(input.lineage)
  ) {
    throw invalidAuthority('Structured SVG adapter received different canonical lineage.')
  }
}

function assertPersistedArtifact(artifact: PersistedArtifactResult, input: StructuredSvgAdapterInput): void {
  if (
    artifact.artifactVersion !== 1 ||
    artifact.content.sha256 !== input.executionResult.svg.sha256 ||
    artifact.content.byteLength !== input.executionResult.svg.byteLength ||
    artifact.content.contentType !== SVG_CONTENT_TYPE ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== input.privateObjectIdentityHash ||
    artifact.placeholder.isPlaceholder ||
    artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
    artifact.actualRunEvidence.dispatchGrantId !== input.dispatchGrantId ||
    artifact.actualRunEvidence.executionAttemptId !== input.executionAttemptId
  ) {
    throw invalidAuthority('Persisted structured SVG result does not match actual-run evidence.')
  }
}

function assertExecutionResult(
  result: OfflineNodeStructuredExecutionResult,
  request: OfflineNodeStructuredExecutionRequest,
  runtimeAuthorityHash: string,
): void {
  if (
    result.evidence.toolId !== request.toolId ||
    result.evidence.operationId !== request.operationId ||
    result.evidence.containerExitCode !== 0 ||
    result.evidence.oomKilled ||
    result.svg.mimeType !== SVG_CONTENT_TYPE ||
    result.svg.byteLength !== result.svg.bytes.byteLength ||
    result.svg.sha256 !== sha256Bytes(result.svg.bytes) ||
    result.attestation.execution.svgSha256 !== result.svg.sha256 ||
    result.attestation.readiness.privateInternalOnly !== true ||
    result.attestation.readiness.productReady !== false ||
    result.attestation.readiness.externalBetaReady !== false ||
    result.attestation.readiness.productionReady !== false ||
    !/^[a-f0-9]{64}$/.test(runtimeAuthorityHash)
  ) {
    throw invalidAuthority('Structured runtime result failed exact operation and output verification.')
  }
}

function boundedKey(prefix: string, hash: string): string {
  return `${prefix}-${hash.slice(0, 56)}`
}

function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', message, 400, parsed.error.flatten())
  }
  return parsed.data
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function invalidAuthority(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_structured_tool_execution_authority',
  })
}
