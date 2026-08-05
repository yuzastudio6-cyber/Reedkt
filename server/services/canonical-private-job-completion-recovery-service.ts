import { createHash } from 'node:crypto'

import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  getProvenEndToEndToolIdentity,
  listProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'
import {
  readPrivateInternalAttemptCostEvidence,
  resolvePrivateInternalAttemptCostProfileId,
  type PrivateInternalAttemptCostProfileId,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateJobCompletionRecoveryRecordSchema,
  type CanonicalPrivateJobCompletionRecoveryRecord,
} from '../validation/canonical-private-job-completion-recovery-schemas'
import {
  canonicalPrivateJobExecutionAdapterResponseSchema,
  type CanonicalPrivateJobExecutionAdapterResponse,
} from '../validation/canonical-private-job-execution-adapter-schemas'
import type { CanonicalExecutionReadinessEnvelope } from '../validation/canonical-execution-readiness-schemas'
import type { CanonicalWorkerLeaseRecord } from '../validation/canonical-worker-lease-authority-schemas'
import {
  findCurrentPrivateTestSelection,
  readPrivateArtifactQaAggregate,
  verifyAllPrivateArtifactQaEvidenceBlobs,
} from './private-artifact-qa-authority-store'
import { readPrivateCanonicalToolDispatchAggregate } from './private-canonical-tool-dispatch-store'
import { readPrivateCanonicalWorkerLeaseAggregate } from './private-canonical-worker-lease-store'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'

const RECOVERY_PATH_PREFIX = 'private-internal/canonical-job-completion-recovery/v1'

export interface RecoverCanonicalPrivateJobCompletionInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
  approvedWorkItemId: string
  expectedAssetId: string
  expectedContentType?: string
  canonicalToolId: string | null
  operationId: string
  runnerClass: string
  internalServerJob: boolean
  finalCompositionExecution: boolean
  attemptCostProfileId: PrivateInternalAttemptCostProfileId | null
  readiness: CanonicalExecutionReadinessEnvelope
}

export interface CanonicalPrivateJobCompletionRecoveryLeaseEvidence {
  leaseId: string
  immutableLeaseHash: string
  dependencyAuthorityHash: string
  attemptNumber: number
  executionFence: CanonicalWorkerLeaseRecord['executionFence'] & {
    state: 'completed'
    executionAttemptId: string
    runnerClass: string
    completedAt: string
  }
}

export type CanonicalPrivateJobCompletionRecoveryOutcome =
  | { status: 'not_required' }
  | {
      status: 'blocked'
      lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence
      requiredGate: string
    }
  | {
      status: 'recovered'
      lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence
      response: CanonicalPrivateJobExecutionAdapterResponse
      recoveryRecord: CanonicalPrivateJobCompletionRecoveryRecord
      replayed: boolean
    }

export async function readCanonicalPrivateJobCompletionRecovery(input: {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
}): Promise<CanonicalPrivateJobCompletionRecoveryRecord | undefined> {
  const record = await readRecoveryRecord(
    input.localStorageRoot,
    canonicalPrivateJobCompletionRecoveryRelativePath(input),
  )
  if (record && (
    record.identity.workspaceId !== input.workspaceId ||
    record.identity.projectId !== input.projectId ||
    record.identity.editSessionId !== input.editSessionId ||
    record.identity.jobId !== input.jobId
  )) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Completed-execution recovery scope changed.', 409)
  }
  return record
}

export function createCanonicalPrivateJobCompletionRecoveryService(context: ServiceContext) {
  return {
    async recoverIfCompleted(
      input: RecoverCanonicalPrivateJobCompletionInput,
    ): Promise<CanonicalPrivateJobCompletionRecoveryOutcome> {
      assertRecoveryInput(input)
      const ownerUserId = getRequiredAuthUserId(context)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId,
        workspaceId: input.workspaceId,
      }
      const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate(scope)
      const completedLeases = leaseAggregate?.leases.filter((lease) =>
        lease.workspaceId === input.workspaceId &&
        lease.projectId === input.projectId &&
        lease.editSessionId === input.editSessionId &&
        lease.jobId === input.jobId &&
        lease.approvedPlanSnapshotId === input.readiness.job.approvedPlanSnapshotId &&
        lease.executionFence.state === 'completed') ?? []
      if (completedLeases.length === 0) return { status: 'not_required' }
      if (completedLeases.length !== 1) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical job has conflicting completed execution attempts.',
          409,
        )
      }
      const lease = requireCompletedLeaseEvidence(completedLeases[0]!, input.runnerClass)
      const relativePath = canonicalPrivateJobCompletionRecoveryRelativePath({
        ownerUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        jobId: input.jobId,
      })
      const existing = await readRecoveryRecord(context.env.localStorageRoot, relativePath)
      if (existing) {
        assertExistingRecoveryMatches(existing, input, lease)
        return { status: 'recovered', lease, response: existing.response, recoveryRecord: existing, replayed: true }
      }

      const artifactScope = scope
      const aggregate = await readPrivateArtifactQaAggregate(artifactScope)
      if (!aggregate) {
        return blocked(lease, 'canonical_completed_execution_artifact_evidence')
      }
      await verifyAllPrivateArtifactQaEvidenceBlobs({ scope: artifactScope, aggregate })
      const identity = {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.readiness.job.approvedPlanSnapshotId,
        jobId: input.jobId,
        expectedAssetId: input.expectedAssetId,
      }
      const candidateArtifacts = aggregate.artifacts.filter((artifact) =>
        sameArtifactIdentity(artifact.identity, identity) &&
        artifact.actualRunEvidence.executionAttemptId === lease.executionFence.executionAttemptId)
      if (candidateArtifacts.length !== 1) {
        return blocked(lease, 'canonical_completed_execution_artifact_evidence')
      }
      const artifact = candidateArtifacts[0]!
      assertArtifactRunEvidence(artifact, input, lease)
      if (input.expectedContentType && artifact.content.contentType !== input.expectedContentType) {
        throw new ApiError('VALIDATION_FAILED', 'Recovered artifact content type changed from approved authority.', 409)
      }
      const qa = aggregate.qaEvaluations.find((record) => record.artifactId === artifact.artifactId)
      if (!qa || qa.outcome !== 'passed') {
        return blocked(lease, 'canonical_completed_execution_qa_evidence')
      }

      const reconciliation = aggregate.reconciliations.find((record) =>
        record.artifactId === artifact.artifactId)
      if (!reconciliation) {
        return blocked(lease, 'canonical_completed_execution_reconciliation_evidence')
      }
      const selected = findCurrentPrivateTestSelection({ aggregate, identity })
      if (
        !reconciliation ||
        !selected ||
        selected.artifact.artifactId !== artifact.artifactId ||
        selected.qa.qaEvaluationId !== qa.qaEvaluationId ||
        selected.reconciliation.reconciliationId !== reconciliation.reconciliationId ||
        reconciliation.decision !== 'test_merged_not_live_authorized' ||
        reconciliation.privateTestDependencySatisfied !== true
      ) {
        return blocked(lease, 'canonical_completed_execution_reconciliation_evidence')
      }

      let dispatch: Awaited<ReturnType<typeof requireConsumedDispatchEvidence>> | null = null
      if (!input.internalServerJob) {
        try {
          dispatch = await requireConsumedDispatchEvidence(context, input, lease, artifact)
        } catch (error) {
          const requiredGate = completedEvidenceRequiredGate(error)
          if (!requiredGate) throw error
          return blocked(lease, requiredGate)
        }
      }
      const attemptCost = await readPrivateInternalAttemptCostEvidence({
        localStorageRoot: context.env.localStorageRoot,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        executionAttemptId: lease.executionFence.executionAttemptId,
      })
      try {
        assertAttemptCostEvidence(attemptCost, input, lease, artifact)
      } catch (error) {
        const requiredGate = completedEvidenceRequiredGate(error)
        if (!requiredGate) throw error
        return blocked(lease, requiredGate)
      }

      const response = buildRecoveredResponse({
        input,
        lease,
        artifact,
        reconciliation,
        dependencyArtifactInput: leaseDependencyArtifactCount(completedLeases[0]!) > 0,
        attemptCostEvidenceRecorded: attemptCost !== undefined,
      })
      const runnerEvidenceHash = artifact.actualRunEvidence.runnerEvidenceHash
      if (!runnerEvidenceHash) {
        throw new ApiError('VALIDATION_FAILED', 'Recovered execution is missing its runner evidence hash.', 409)
      }
      const recordWithoutHash = {
        schemaVersion: 'canonical-private-job-completion-recovery-v1' as const,
        source: 'canonical_private_job_completion_recovery' as const,
        purpose: 'recover_completed_canonical_private_job' as const,
        identity: {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          approvedPlanSnapshotId: input.readiness.job.approvedPlanSnapshotId,
          jobId: input.jobId,
          approvedWorkItemId: input.approvedWorkItemId,
          expectedAssetId: input.expectedAssetId,
          canonicalToolId: input.canonicalToolId,
          operationId: input.operationId,
          runnerClass: input.runnerClass,
          leaseId: completedLeases[0]!.id,
          leaseAttemptNumber: completedLeases[0]!.attemptNumber,
          executionAttemptId: lease.executionFence.executionAttemptId,
        },
        evidence: {
          leaseImmutableHash: completedLeases[0]!.immutableLeaseHash,
          leaseDependencyAuthorityHash: completedLeases[0]!.dependencyAuthority.authorityHash,
          actualRunEvidenceHash: sha256AuthorityValue(artifact.actualRunEvidence),
          artifactResultEvidenceHash: artifact.resultEvidenceHash,
          qaEvaluationId: qa.qaEvaluationId,
          qaEvidenceHash: qa.qaEvidenceHash,
          reconciliationId: reconciliation.reconciliationId,
          consumedDispatchGrantId: dispatch?.id ?? null,
          consumedDispatchGrantHash: dispatch?.immutableGrantHash ?? null,
          internalAttemptCostProfileId: input.attemptCostProfileId,
          internalAttemptCostEvidenceHash: attemptCost?.evidenceHash ?? null,
          responseHash: response.responseHash,
          executionCompletedAt: lease.executionFence.completedAt,
        },
        recovery: {
          priorCompletedFenceReused: true as const,
          runnerReexecuted: false as const,
          newLeaseClaimed: false as const,
          newDispatchAuthorized: false as const,
          newDispatchConsumed: false as const,
          artifactWritten: false as const,
          qaWritten: false as const,
          reconciliationWritten: false as const,
          costEvidenceWritten: false as const,
          adapterCompletionRecovered: true as const,
        },
        permissions: deniedPermissions(),
        response,
        recoveredAt: new Date().toISOString(),
        testOnly: true as const,
      }
      const recoveryRecord = canonicalPrivateJobCompletionRecoveryRecordSchema.parse({
        ...recordWithoutHash,
        recoveryRecordHash: sha256AuthorityValue(recordWithoutHash),
      })
      await persistRecoveryRecord(context.env.localStorageRoot, relativePath, recoveryRecord)
      return { status: 'recovered', lease, response, recoveryRecord, replayed: false }
    },
  }
}

function buildRecoveredResponse(input: {
  input: RecoverCanonicalPrivateJobCompletionInput
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence
  artifact: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>['artifacts'][number]
  reconciliation: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>['reconciliations'][number]
  dependencyArtifactInput: boolean
  attemptCostEvidenceRecorded: boolean
}): CanonicalPrivateJobExecutionAdapterResponse {
  const responseWithoutHash = {
    schemaVersion: 'canonical-private-job-execution-adapter-response-v4' as const,
    source: 'canonical_private_job_execution_adapter' as const,
    purpose: 'execute_canonical_private_job' as const,
    identity: {
      workspaceId: input.input.workspaceId,
      projectId: input.input.projectId,
      editSessionId: input.input.editSessionId,
      approvedPlanSnapshotId: input.input.readiness.job.approvedPlanSnapshotId,
      jobId: input.input.jobId,
      approvedWorkItemId: input.input.approvedWorkItemId,
      expectedAssetId: input.input.expectedAssetId,
      canonicalToolId: input.input.canonicalToolId,
      operationId: input.input.operationId,
      runnerClass: input.input.runnerClass,
    },
    result: {
      artifactId: input.artifact.artifactId,
      contentType: input.artifact.content.contentType,
      sha256: input.artifact.content.sha256,
      byteLength: input.artifact.content.byteLength,
      qaOutcome: 'passed' as const,
      reconciliationDecision: input.reconciliation.decision as 'test_merged_not_live_authorized',
      privateTestDependencySatisfied: true as const,
      liveRuntimeDependencySatisfied: false as const,
      finalRenderAuthorized: false as const,
    },
    evidence: {
      serverDerivedCanonicalJob: true as const,
      serverDerivedToolAndOperation: true as const,
      fundedReservationVerified: true as const,
      opaqueLeaseClaimed: true as const,
      singleUseDispatchConsumed: !input.input.internalServerJob,
      privateArtifactPersisted: true as const,
      actualQaPassed: true as const,
      reconciliationPassed: true as const,
      idempotentAdapterReplay: false,
      attemptCostEvidenceRecorded: input.attemptCostEvidenceRecorded,
      dependencyArtifactInput: input.dependencyArtifactInput,
      // Generic completion recovery cannot infer attempt-level dependency
      // transport from the completed artifact alone.
      dependencyStreamInputVerified: false,
      largeDependencyOverLegacyBufferVerified: false,
      finalArtifactQaPassed: input.input.finalCompositionExecution,
      // Generic artifact/QA recovery does not retain attempt-level source
      // staging evidence, so it must not infer these proofs from a completed
      // artifact or from the current runner implementation.
      sourceStreamInputVerified: false,
      sourceStagingCleanupVerified: false,
      largeSourceOverLegacyBufferVerified: false,
      // Generic completion recovery cannot infer attempt-level media-output
      // transport from a completed artifact or from the current runner code.
      mediaOutputStreamed: false,
      largeMediaOutputOverLegacyBufferVerified: false,
      leaseHeartbeatCount: 0,
      longRunningLeaseHeartbeatVerified: false,
    },
    permissions: deniedPermissions(),
    readiness: {
      privateInternalJobExecutionReady: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate: 'canonical_required_job_capabilities_and_terminal_private_review' as const,
    },
    completedAt: input.lease.executionFence.completedAt,
    testOnly: true as const,
  }
  return canonicalPrivateJobExecutionAdapterResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

async function requireConsumedDispatchEvidence(
  context: ServiceContext,
  input: RecoverCanonicalPrivateJobCompletionInput,
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence,
  artifact: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>['artifacts'][number],
) {
  const ownerUserId = getRequiredAuthUserId(context)
  const aggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: input.workspaceId,
  })
  const actualRun = artifact.actualRunEvidence
  if (actualRun.state !== 'actual_run_evidence_verified_v2') {
    throw new ApiError('VALIDATION_FAILED', 'Recovered tool execution lacks verified actual-run evidence.', 409)
  }
  const matches = aggregate?.grants.filter((grant) =>
    grant.id === actualRun.dispatchGrantId &&
    grant.status === 'consumed' &&
    grant.binding.workspaceId === input.workspaceId &&
    grant.binding.projectId === input.projectId &&
    grant.binding.editSessionId === input.editSessionId &&
    grant.binding.jobId === input.jobId &&
    grant.binding.approvedPlanSnapshotId === input.readiness.job.approvedPlanSnapshotId &&
    grant.binding.approvedWorkItemId === input.approvedWorkItemId &&
    grant.binding.expectedAssetId === input.expectedAssetId &&
    grant.binding.canonicalToolId === input.canonicalToolId &&
    grant.binding.operationId === input.operationId &&
    grant.binding.leaseId === lease.leaseId &&
    grant.binding.leaseAttemptNumber === lease.attemptNumber &&
    grant.binding.leaseImmutableHash === lease.immutableLeaseHash &&
    grant.binding.leaseDependencyAuthority.authorityHash === lease.dependencyAuthorityHash &&
    grant.privateRuntimeAuthorityHash === actualRun.runtimeAuthorityHash &&
    grant.privateRuntimeImageIdentityHash === actualRun.runtimeImageIdentityHash) ?? []
  if (matches.length !== 1) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Completed tool execution lacks exact consumed-dispatch recovery evidence.',
      409,
      { requiredGate: 'canonical_completed_execution_consumed_dispatch_evidence' },
    )
  }
  return matches[0]!
}

function assertAttemptCostEvidence(
  attemptCost: Awaited<ReturnType<typeof readPrivateInternalAttemptCostEvidence>>,
  input: RecoverCanonicalPrivateJobCompletionInput,
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence,
  artifact: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>['artifacts'][number],
): void {
  if (input.attemptCostProfileId === null) {
    if (attemptCost) {
      throw new ApiError('VALIDATION_FAILED', 'Unexpected internal-cost evidence is bound to this completed job.', 409)
    }
    return
  }
  if (
    !attemptCost ||
    attemptCost.identity.workspaceId !== input.workspaceId ||
    attemptCost.identity.projectId !== input.projectId ||
    attemptCost.identity.editSessionId !== input.editSessionId ||
    attemptCost.identity.approvedPlanSnapshotId !== input.readiness.job.approvedPlanSnapshotId ||
    attemptCost.identity.approvedWorkItemId !== input.approvedWorkItemId ||
    attemptCost.identity.jobId !== input.jobId ||
    attemptCost.identity.executionAttemptId !== lease.executionFence.executionAttemptId ||
    attemptCost.identity.retryAttempt !== Math.max(0, lease.attemptNumber - 1) ||
    resolvePrivateInternalAttemptCostProfileId(attemptCost.identity) !==
      input.attemptCostProfileId ||
    attemptCost.identity.toolId !== input.canonicalToolId ||
    attemptCost.identity.operationId !== input.operationId ||
    attemptCost.outcome.status !== 'completed' ||
    attemptCost.outcome.failureCategory !== 'none' ||
    attemptCost.resourceUsage.outputByteLength !== artifact.content.byteLength ||
    !attemptCost.linkedCanonicalOutcomeHash
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Completed metered execution lacks exact internal-cost recovery evidence.',
      409,
      { requiredGate: 'canonical_completed_execution_internal_cost_evidence' },
    )
  }
}

function assertArtifactRunEvidence(
  artifact: NonNullable<Awaited<ReturnType<typeof readPrivateArtifactQaAggregate>>>['artifacts'][number],
  input: RecoverCanonicalPrivateJobCompletionInput,
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence,
): void {
  const run = artifact.actualRunEvidence
  if (
    run.executionAttemptId !== lease.executionFence.executionAttemptId ||
    run.runnerClass !== input.runnerClass ||
    run.exitCode !== 0 ||
    !run.runnerEvidenceHash ||
    !run.startedAt ||
    !run.finishedAt ||
    Date.parse(run.startedAt) < Date.parse(lease.executionFence.startedAt!) ||
    Date.parse(run.finishedAt) > Date.parse(lease.executionFence.completedAt)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Recovered artifact actual-run evidence is inconsistent.', 409)
  }
  if (
    input.internalServerJob
      ? run.state !== 'actual_run_evidence_placeholder' || run.actualRunVerified !== false
      : run.state !== 'actual_run_evidence_verified_v2' || run.actualRunVerified !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Recovered artifact run-evidence class is inconsistent.', 409)
  }
}

function requireCompletedLeaseEvidence(
  lease: CanonicalWorkerLeaseRecord,
  expectedRunnerClass: string,
): CanonicalPrivateJobCompletionRecoveryLeaseEvidence {
  const fence = lease.executionFence
  if (
    fence.state !== 'completed' ||
    !fence.executionAttemptId ||
    fence.runnerClass !== expectedRunnerClass ||
    !fence.completedAt
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Completed execution fence does not match approved runner authority.', 409)
  }
  return {
    leaseId: lease.id,
    immutableLeaseHash: lease.immutableLeaseHash,
    dependencyAuthorityHash: lease.dependencyAuthority.authorityHash,
    attemptNumber: lease.attemptNumber,
    executionFence: {
      ...fence,
      state: 'completed',
      executionAttemptId: fence.executionAttemptId,
      runnerClass: fence.runnerClass,
      completedAt: fence.completedAt,
    },
  }
}

function assertRecoveryInput(input: RecoverCanonicalPrivateJobCompletionInput): void {
  const expectedAsset = input.readiness.expectedAssets.find((asset) =>
    asset.assetId === input.expectedAssetId)
  const internalProfile = input.readiness.job.jobType === 'validate_approved_snapshot'
    ? {
        operationId: 'internal.validate_snapshot_manifest.v1',
        runnerClass: 'canonical_authority_validation_runner_v1',
      }
    : input.readiness.job.jobType === 'prepare_source_trim'
      ? {
          operationId: 'internal.validate_approved_source_trim_plan.v1',
          runnerClass: 'canonical_source_trim_validation_runner_v1',
        }
      : input.readiness.job.workerClass ===
          CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS
        ? {
            operationId:
              CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
            runnerClass:
              'canonical_living_frame_layer_manifest_runner_v1',
          }
        : input.readiness.job.workerClass ===
            CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS
          ? {
              operationId: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
              runnerClass:
                'canonical_caption_specialist_planning_runner_v1',
            }
          : undefined
  const provenCatalogIdentity = input.canonicalToolId
    ? listProvenToolIdentityCatalog().find((record) =>
        record.canonicalToolId === input.canonicalToolId)
    : undefined
  const provenTool = provenCatalogIdentity
    ? getProvenEndToEndToolIdentity(provenCatalogIdentity.canonicalToolId)
    : undefined
  const toolAuthorityMatches = input.internalServerJob
    ? input.readiness.job.approvedToolIds.length === 0 &&
      internalProfile?.operationId === input.operationId &&
      internalProfile.runnerClass === input.runnerClass
    : input.readiness.job.approvedToolIds.length === 1 &&
      input.readiness.job.approvedToolIds[0] === input.canonicalToolId &&
      provenTool?.operationId === input.operationId &&
      provenTool?.runtime.runnerClass === input.runnerClass
  const finalCompositionExecution =
    (input.canonicalToolId === 'remotion' || input.canonicalToolId === 'ffmpeg') &&
    input.readiness.job.jobType === 'render_final_export' &&
    expectedAsset?.assetRole === 'final'
  if (
    input.readiness.identity.workspaceId !== input.workspaceId ||
    input.readiness.identity.projectId !== input.projectId ||
    input.readiness.identity.editSessionId !== input.editSessionId ||
    input.readiness.identity.jobId !== input.jobId ||
    input.readiness.job.approvedWorkItemId !== input.approvedWorkItemId ||
    input.internalServerJob !== (input.canonicalToolId === null) ||
    !input.readiness.job.expectedAssetIds.includes(input.expectedAssetId) ||
    !expectedAsset ||
    expectedAsset.contentType !== input.expectedContentType ||
    !toolAuthorityMatches ||
    input.finalCompositionExecution !== finalCompositionExecution
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Completed-execution recovery input is not server-authoritative.', 409)
  }
}

function assertExistingRecoveryMatches(
  record: CanonicalPrivateJobCompletionRecoveryRecord,
  input: RecoverCanonicalPrivateJobCompletionInput,
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence,
): void {
  const expected = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedPlanSnapshotId: input.readiness.job.approvedPlanSnapshotId,
    jobId: input.jobId,
    approvedWorkItemId: input.approvedWorkItemId,
    expectedAssetId: input.expectedAssetId,
    canonicalToolId: input.canonicalToolId,
    operationId: input.operationId,
    runnerClass: input.runnerClass,
    leaseId: lease.leaseId,
    executionAttemptId: lease.executionFence.executionAttemptId,
    leaseAttemptNumber: lease.attemptNumber,
  }
  const actual = {
    workspaceId: record.identity.workspaceId,
    projectId: record.identity.projectId,
    editSessionId: record.identity.editSessionId,
    approvedPlanSnapshotId: record.identity.approvedPlanSnapshotId,
    jobId: record.identity.jobId,
    approvedWorkItemId: record.identity.approvedWorkItemId,
    expectedAssetId: record.identity.expectedAssetId,
    canonicalToolId: record.identity.canonicalToolId,
    operationId: record.identity.operationId,
    runnerClass: record.identity.runnerClass,
    leaseId: record.identity.leaseId,
    executionAttemptId: record.identity.executionAttemptId,
    leaseAttemptNumber: record.identity.leaseAttemptNumber,
  }
  if (stableAuthorityStringify(actual) !== stableAuthorityStringify(expected)) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Completed-execution recovery identity changed.', 409)
  }
  if (
    record.evidence.leaseImmutableHash !== lease.immutableLeaseHash ||
    record.evidence.leaseDependencyAuthorityHash !== lease.dependencyAuthorityHash ||
    record.evidence.executionCompletedAt !== lease.executionFence.completedAt ||
    record.evidence.internalAttemptCostProfileId !== input.attemptCostProfileId
  ) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Completed-execution recovery lease evidence changed.', 409)
  }
}

async function readRecoveryRecord(
  localStorageRoot: string,
  relativePath: string,
): Promise<CanonicalPrivateJobCompletionRecoveryRecord | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!bytes) return undefined
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Completed-execution recovery record is invalid JSON.', 409)
  }
  const parsed = canonicalPrivateJobCompletionRecoveryRecordSchema.safeParse(decoded)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Completed-execution recovery record failed validation.',
      409,
      parsed.error.flatten(),
    )
  }
  const { recoveryRecordHash, ...withoutHash } = parsed.data
  if (recoveryRecordHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Completed-execution recovery record checksum is invalid.', 409)
  }
  const { responseHash, ...responseWithoutHash } = parsed.data.response
  if (responseHash !== sha256AuthorityValue(responseWithoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Recovered adapter response checksum is invalid.', 409)
  }
  return parsed.data
}

async function persistRecoveryRecord(
  localStorageRoot: string,
  relativePath: string,
  record: CanonicalPrivateJobCompletionRecoveryRecord,
): Promise<void> {
  try {
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: localStorageRoot,
      relativePath,
      content: Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8'),
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') throw error
    const existing = await readRecoveryRecord(localStorageRoot, relativePath)
    if (!existing || existing.recoveryRecordHash !== record.recoveryRecordHash) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Completed-execution recovery record changed.', 409)
    }
  }
}

export function canonicalPrivateJobCompletionRecoveryRelativePath(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
}): string {
  const scopeHash = sha256(`${input.ownerUserId}\u0000${input.workspaceId}`)
  const jobHash = sha256([
    scopeHash,
    input.projectId,
    input.editSessionId,
    input.jobId,
  ].join('\u0000'))
  return `${RECOVERY_PATH_PREFIX}/${scopeHash.slice(0, 32)}/${jobHash}.json`
}

function sameArtifactIdentity(
  actual: {
    workspaceId: string
    projectId: string
    editSessionId: string
    snapshotId: string
    jobId: string
    expectedAssetId: string
  },
  expected: typeof actual,
): boolean {
  return stableAuthorityStringify(actual) === stableAuthorityStringify(expected)
}

function leaseDependencyArtifactCount(lease: CanonicalWorkerLeaseRecord): number {
  return lease.dependencyAuthority.selectedArtifacts.length
}

function blocked(
  lease: CanonicalPrivateJobCompletionRecoveryLeaseEvidence,
  requiredGate: string,
): CanonicalPrivateJobCompletionRecoveryOutcome {
  return { status: 'blocked', lease, requiredGate }
}

function completedEvidenceRequiredGate(error: unknown): string | undefined {
  if (
    !(error instanceof ApiError) ||
    error.code !== 'JOB_DEPENDENCY_NOT_READY' ||
    !error.details ||
    typeof error.details !== 'object' ||
    Array.isArray(error.details)
  ) return undefined
  const requiredGate = (error.details as Record<string, unknown>).requiredGate
  return typeof requiredGate === 'string' ? requiredGate : undefined
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
