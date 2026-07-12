import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import {
  CANONICAL_INTERNAL_AUTHORITY_RUNNER_RESPONSE_VERSION,
  canonicalInternalAuthorityRunnerLeaseSchema,
  canonicalInternalAuthorityRunnerResponseSchema,
  runCanonicalInternalAuthorityJobSchema,
  type CanonicalInternalAuthorityRunnerLease,
  type CanonicalInternalAuthorityRunnerResponse,
  type RunCanonicalInternalAuthorityJobInput,
} from '../validation/canonical-internal-authority-runner-schemas'
import type {
  CanonicalExpectedArtifactLineage,
  PersistedArtifactResult,
} from '../validation/private-artifact-qa-authority-schemas'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
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
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import { canonicalInternalAuthorityArtifactRelativePath } from './canonical-internal-authority-artifact-verifier'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const ARTIFACT_SCHEMA_VERSION = 'canonical-authority-validation-artifact-v1' as const
const MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
const authorityArtifactWriteLocks = new Map<string, Promise<void>>()

/**
 * Executes the dependency-root, tool-free canonical snapshot validation job.
 *
 * This is ReEditPro server logic, not a third-party tool operation. It verifies
 * the active opaque lease and reloads all immutable planning/source/package
 * authority before committing one private JSON result, QA record, and merge
 * decision. The legacy artifact authority remains private-test-only, so this
 * service does not claim live/production execution or final-render authority.
 */
export function createCanonicalInternalAuthorityRunnerService(context: ServiceContext) {
  return {
    async execute(
      input: RunCanonicalInternalAuthorityJobInput,
      serverLease: CanonicalInternalAuthorityRunnerLease,
    ): Promise<CanonicalInternalAuthorityRunnerResponse> {
      const body = parseRunRequest(input)
      const profile = internalValidationProfile(body.purpose)
      const leaseAuthority = parseLeaseAuthority(serverLease)
      const actorUserId = getRequiredAuthUserId(context)
      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const leaseResult = await leaseService.verifyActive({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        leaseId: leaseAuthority.leaseId,
        leaseCredential: leaseAuthority.leaseCredential,
        purpose: 'private_internal_canonical_lease_verification',
      })
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      if (access.userId !== actorUserId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Internal authority runner actor is outside this workspace.', 403)
      }
      const verifiedLease = leaseResult.workerLeaseVerification.lease
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
      const canonicalAuthorityHashBefore = sha256AuthorityValue(authority)
      const workItem = authority.workItems.find((candidate) => candidate.id === readiness.job.approvedWorkItemId)
      const expectedAsset = authority.assetManifest.entries.find((candidate) =>
        candidate.id === body.expectedAssetId &&
        candidate.approvedWorkItemId === workItem?.id)
      assertCanonicalAuthorityValidationJob({
        profile,
        body,
        lease: verifiedLease,
        readiness,
        authority,
        workItem,
        expectedAsset,
      })
      if (!workItem || !expectedAsset) throw invalidAuthority('Canonical authority validation lineage is incomplete.')

      const begunExecution = await leaseService.beginInternalExecution({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        leaseId: leaseAuthority.leaseId,
        leaseCredential: leaseAuthority.leaseCredential,
        runnerClass: profile.runnerClass,
      })
      const lease = begunExecution.lease
      const executionAttemptId = begunExecution.executionFence.executionAttemptId

      const report = buildAuthorityValidationReport({
        profile,
        body,
        leaseId: lease.id,
        immutableLeaseHash: lease.immutableLeaseHash,
        leaseAttemptNumber: lease.attemptNumber,
        executionAttemptId,
        authority,
        readiness,
        workItemId: workItem.id,
        expectedAssetId: expectedAsset.id,
      })
      const bytes = Buffer.from(`${stableAuthorityStringify(report)}\n`, 'utf8')
      if (bytes.byteLength <= 0 || bytes.byteLength > MAXIMUM_ARTIFACT_BYTES) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical authority validation artifact exceeded its byte ceiling.', 409)
      }
      const contentSha256 = sha256Bytes(bytes)
      const privateObjectIdentityHash = sha256ArtifactQaValue({
        domain: profile.artifactDomain,
        workspaceId: body.workspaceId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
        contentSha256,
      })
      const relativePath = canonicalInternalAuthorityArtifactRelativePath(privateObjectIdentityHash)
      await withAuthorityArtifactWriteLock(relativePath, async () => {
        await writePrivateFileCreateOnlyWithinRoot({
          rootPath: context.env.localStorageRoot,
          relativePath,
          content: bytes,
        })
        await verifyStoredArtifactBytes({
          localStorageRoot: context.env.localStorageRoot,
          relativePath,
          expectedBytes: bytes,
          expectedSha256: contentSha256,
        })
      })

      const identity = {
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: body.jobId,
        expectedAssetId: expectedAsset.id,
      }
      const identityHash = sha256ArtifactQaValue({ identity, executionAttemptId })
      const completedAt = new Date().toISOString()
      const adapters = createAuthorityAdapters({
        runnerClass: profile.runnerClass,
        localStorageRoot: context.env.localStorageRoot,
        relativePath,
        identity,
        expectedLineage: {
          assetId: expectedAsset.id,
          outputKey: expectedAsset.outputKey,
          artifactType: expectedAsset.artifactType,
          assetRole: expectedAsset.assetRole,
          required: expectedAsset.required,
          previewPlaceholderAllowed: expectedAsset.previewPlaceholderAllowed,
          ...(expectedAsset.contentType ? { contentType: expectedAsset.contentType } : {}),
          segmentIds: [...expectedAsset.segmentIds],
          timingIds: [...expectedAsset.timingIds],
          rendererLayerIds: [...expectedAsset.rendererLayerIds],
          approvedWorkItemId: workItem.id,
          workItemKey: workItem.workItemKey,
          jobType: workItem.workItemType,
          jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
          snapshotHash: readiness.authorityHashes.snapshotHash,
          approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
        },
        bytes,
        contentSha256,
        privateObjectIdentityHash,
        executionAttemptId,
        completedAt,
      })
      const artifactAuthority = createPrivateArtifactQaAuthorityService(context, adapters)
      const artifactResult = await artifactAuthority.recordArtifactResult({
        ...identity,
        idempotencyKey: boundedInternalKey('authority-artifact', identityHash),
        purpose: 'record_server_verified_internal_artifact_result',
      })
      const qaResult = await artifactAuthority.recordArtifactQa({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: boundedInternalKey('authority-qa', identityHash),
        purpose: 'record_server_verified_internal_artifact_qa',
      })
      const completedExecution = await leaseService.completeInternalExecution({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId: body.jobId,
        leaseId: leaseAuthority.leaseId,
        leaseCredential: leaseAuthority.leaseCredential,
        runnerClass: profile.runnerClass,
        executionAttemptId,
      })
      const executionCommitAuthorizedAt = completedExecution.executionFence.commitAuthorizedAt
      const executionCompletedAt = completedExecution.executionFence.completedAt
      if (!executionCommitAuthorizedAt || !executionCompletedAt) {
        throw invalidAuthority('Canonical internal execution fence did not commit completion authority.')
      }
      const reconciliationResult = await artifactAuthority.reconcileArtifact({
        ...identity,
        artifactId: artifactResult.artifact.artifactId,
        idempotencyKey: boundedInternalKey('authority-reconcile', identityHash),
        purpose: 'reconcile_server_verified_internal_artifact',
      })
      if (
        qaResult.qaEvaluation.outcome !== 'passed' ||
        reconciliationResult.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        reconciliationResult.reconciliation.privateTestDependencySatisfied !== true
      ) {
        throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Canonical authority validation output did not pass QA and reconciliation.', 409)
      }

      const authorityAfter = await planningService.loadApprovedExecutionAuthority(
        authority.snapshot.snapshotId,
        access.workspaceId,
      )
      if (sha256AuthorityValue(authorityAfter) !== canonicalAuthorityHashBefore) {
        throw invalidAuthority('Canonical planning authority changed during internal validation execution.')
      }

      const responseWithoutHash = {
        schemaVersion: CANONICAL_INTERNAL_AUTHORITY_RUNNER_RESPONSE_VERSION,
        source: profile.source,
        purpose: body.purpose,
        identity: {
          ...identity,
          approvedWorkItemId: workItem.id,
        },
        lease: {
          leaseId: lease.id,
          attemptNumber: lease.attemptNumber,
          immutableLeaseHash: lease.immutableLeaseHash,
          verifiedActive: true as const,
          executionFenceCompleted: true as const,
          executionStartedAt: completedExecution.executionFence.startedAt,
          executionCommitAuthorizedAt,
          executionCompletedAt,
          credentialReturned: false as const,
          credentialHashReturned: false as const,
        },
        execution: {
          executionAttemptId,
          runnerClass: profile.runnerClass,
          operation: profile.operation,
          actualInternalOperationCompleted: true as const,
          externalToolExecuted: false as const,
          providerCallMade: false as const,
          sourceIntegrityBytesVerified: true as const,
          sourceMediaDecodedOrTransformed: false as const,
          renderExecuted: false as const,
          actualInternalToolCostMicros: 0 as const,
          serviceFeeIncluded: false as const,
          walletMutationPerformed: false as const,
          settlementPerformed: false as const,
        },
        result: {
          artifactId: artifactResult.artifact.artifactId,
          qaEvaluationId: qaResult.qaEvaluation.qaEvaluationId,
          reconciliationId: reconciliationResult.reconciliation.reconciliationId,
          artifactVersion: artifactResult.artifact.artifactVersion,
          contentType: 'application/json' as const,
          sha256: contentSha256,
          byteLength: bytes.byteLength,
          privateObjectIdentityHash,
          qaOutcome: 'passed' as const,
          reconciliationDecision: 'test_merged_not_live_authorized' as const,
          privateTestDependencySatisfied: true as const,
          liveRuntimeDependencySatisfied: false as const,
          finalRenderAuthorized: false as const,
        },
        canonicalEvidence: {
          authorityRevision: authority.authorityRevision,
          snapshotHash: readiness.authorityHashes.snapshotHash,
          planHash: readiness.authorityHashes.planHash,
          estimateHash: readiness.authorityHashes.estimateHash,
          workGraphHash: readiness.authorityHashes.workGraphHash,
          approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
          approvedSourceAssetManifestHash: readiness.authorityHashes.approvedSourceAssetManifestHash,
          jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
          fundedReservation: 'passed' as const,
          exactWorkItemAndOutput: 'passed' as const,
          sourceAndPlanningAuthority: 'passed' as const,
          noCanonicalMutation: true as const,
        },
        replay: {
          executionFenceBeginReplayed: begunExecution.replayed,
          executionFenceCompleteReplayed: completedExecution.replayed,
          artifactRecordReplayed: artifactResult.replayed,
          qaRecordReplayed: qaResult.replayed,
          reconciliationReplayed: reconciliationResult.replayed,
        },
        permissions: {
          furtherWorkerDispatch: false as const,
          externalToolExecution: false as const,
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
          checksumProtectedAuthority: true as const,
          productionAuthority: false as const,
        },
        completedAt: reconciliationResult.reconciliation.createdAt,
        testOnly: true as const,
      }
      return canonicalInternalAuthorityRunnerResponseSchema.parse({
        ...responseWithoutHash,
        responseHash: sha256AuthorityValue(responseWithoutHash),
      })
    },
  }
}

type Authority = Awaited<ReturnType<
  ReturnType<typeof createEditPlanningAuthorityService>['loadApprovedExecutionAuthority']
>>
type Readiness = Awaited<ReturnType<
  ReturnType<typeof createCanonicalExecutionReadinessService>['inspectJob']
>>['executionReadinessEnvelope']
type Lease = Awaited<ReturnType<
  ReturnType<typeof createCanonicalWorkerLeaseAuthorityService>['verifyActive']
>>['workerLeaseVerification']['lease']

type InternalValidationProfile = ReturnType<typeof internalValidationProfile>

function assertCanonicalAuthorityValidationJob(input: {
  profile: InternalValidationProfile
  body: RunCanonicalInternalAuthorityJobInput
  lease: Lease
  readiness: Readiness
  authority: Authority
  workItem: Authority['workItems'][number] | undefined
  expectedAsset: Authority['assetManifest']['entries'][number] | undefined
}): void {
  const { profile, body, lease, readiness, authority, workItem, expectedAsset } = input
  const remainingReservedCredits = authority.reservation.reservedCredits -
    authority.reservation.spentCredits -
    authority.reservation.releasedCredits -
    authority.reservation.refundedCredits
  if (
    lease.workspaceId !== body.workspaceId ||
    lease.projectId !== body.projectId ||
    lease.editSessionId !== body.editSessionId ||
    lease.jobId !== body.jobId ||
    lease.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
    lease.reservationId !== authority.reservation.id ||
    stableAuthorityStringify(lease.canonicalHashes) !== stableAuthorityStringify({
      snapshotHash: readiness.authorityHashes.snapshotHash,
      planHash: readiness.authorityHashes.planHash,
      estimateHash: readiness.authorityHashes.estimateHash,
      workGraphHash: readiness.authorityHashes.workGraphHash,
      sourceSequenceHash: readiness.authorityHashes.sourceSequenceHash,
      timingHash: readiness.authorityHashes.timingHash,
      planningInputBindingHash: readiness.authorityHashes.planningInputBindingHash,
      approvedSourceAssetManifestHash: readiness.authorityHashes.approvedSourceAssetManifestHash,
      approvedAssetManifestHash: readiness.authorityHashes.approvedAssetManifestHash,
      executionPackageHash: readiness.authorityHashes.executionPackageHash,
      jobAuthorityHash: readiness.authorityHashes.jobAuthorityHash,
    }) ||
    readiness.job.approvedPlanSnapshotId !== authority.snapshot.snapshotId ||
    !workItem ||
    workItem.id !== readiness.job.approvedWorkItemId ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedProviderRoute !== undefined ||
    workItem.providerExecutionMode !== 'none' ||
    workItem.expectedOutputs.length !== 1 ||
    !expectedAsset ||
    expectedAsset.id !== body.expectedAssetId ||
    expectedAsset.assetRole !== 'qa' ||
    expectedAsset.contentType !== 'application/json' ||
    !expectedAsset.required ||
    expectedAsset.previewPlaceholderAllowed ||
    authority.reservation.id !== readiness.reservation.reservationId ||
    !['reserved', 'partially_spent'].includes(authority.reservation.status) ||
    remainingReservedCredits !== readiness.reservation.remainingReservedCredits ||
    remainingReservedCredits <= 0 ||
    workItem.maximumCreditBudget > remainingReservedCredits ||
    Date.parse(authority.reservation.expiresAt) <= Date.now()
  ) {
    throw invalidAuthority('Canonical internal authority-validation job is not exactly executable.')
  }
  if (!workItem || !expectedAsset) throw invalidAuthority('Canonical internal validation lineage is incomplete.')
  if (profile.kind === 'snapshot') {
    if (
      readiness.job.canonicalGraphState !== 'ready' ||
      readiness.job.dependencyJobIds.length !== 0 ||
      readiness.dependencyEvidenceState !== 'not_required_for_root_job' ||
      lease.dependencyAuthority.state !== 'not_required_for_root_job' ||
      workItem.workItemType !== 'validate_approved_snapshot' ||
      workItem.workerClass !== 'authority_worker' ||
      workItem.sourceSequenceItemIds.length !== 0 ||
      workItem.sourceCleanupDecisionIds.length !== 0 ||
      stableAuthorityStringify(workItem.executionInput) !== stableAuthorityStringify({
        operation: 'validate_snapshot_manifest',
      }) ||
      expectedAsset.artifactType !== 'authority_validation_evidence'
    ) throw invalidAuthority('Canonical snapshot-validation job is not exactly executable.')
    return
  }
  const selectedDependencyCount = lease.dependencyAuthority.selectedArtifacts.length
  const cleanupDecisions = authority.components.sourceCleanupPlan.decisions.filter((decision) =>
    workItem.sourceCleanupDecisionIds.includes(decision.decisionId))
  if (
    readiness.job.dependencyJobIds.length !== 1 ||
    lease.dependencyAuthority.state !== 'private_test_dependencies_verified' ||
    selectedDependencyCount !== 1 ||
    workItem.workItemType !== 'prepare_source_trim' ||
    workItem.workerClass !== 'authority_worker' ||
    workItem.sourceSequenceItemIds.length === 0 ||
    workItem.sourceCleanupDecisionIds.length === 0 ||
    cleanupDecisions.length !== workItem.sourceCleanupDecisionIds.length ||
    cleanupDecisions.some((decision) =>
      !workItem.sourceSequenceItemIds.includes(decision.sourceSequenceItemId) ||
      decision.endFrameExclusive <= decision.startFrame ||
      !['passed', 'warning'].includes(decision.meaningPreservationStatus) ||
      !['not_required', 'resolved'].includes(decision.userReviewStatus)) ||
    authority.components.sourceCleanupPlan.status !== 'confirmed' ||
    authority.components.sourceCleanupSummary.status !== 'confirmed' ||
    authority.components.sourceCleanupSummary.userReviewRequired !== false ||
    stableAuthorityStringify(workItem.executionInput) !== stableAuthorityStringify({
      operation: 'validate_approved_source_trim_plan',
    }) ||
    expectedAsset.artifactType !== 'source_trim_validation_evidence'
  ) throw invalidAuthority('Canonical source-trim validation job is not exactly executable.')
}

function buildAuthorityValidationReport(input: {
  profile: InternalValidationProfile
  body: RunCanonicalInternalAuthorityJobInput
  leaseId: string
  immutableLeaseHash: string
  leaseAttemptNumber: number
  executionAttemptId: string
  authority: Authority
  readiness: Readiness
  workItemId: string
  expectedAssetId: string
}) {
  const workItem = input.authority.workItems.find((item) => item.id === input.workItemId)!
  const cleanupDecisions = workItem.sourceCleanupDecisionIds.map((decisionId) =>
    input.authority.components.sourceCleanupPlan.decisions.find((decision) => decision.decisionId === decisionId)!)
  return {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    source: 'immutable_canonical_edit_authority',
    identity: {
      workspaceId: input.body.workspaceId,
      projectId: input.body.projectId,
      editSessionId: input.body.editSessionId,
      snapshotId: input.authority.snapshot.snapshotId,
      jobId: input.body.jobId,
      approvedWorkItemId: input.workItemId,
      expectedAssetId: input.expectedAssetId,
    },
    authorityRevision: input.authority.authorityRevision,
    executionFence: {
      leaseId: input.leaseId,
      immutableLeaseHash: input.immutableLeaseHash,
      leaseAttemptNumber: input.leaseAttemptNumber,
      executionAttemptId: input.executionAttemptId,
      runnerClass: input.profile.runnerClass,
    },
    authorityHashes: { ...input.readiness.authorityHashes },
    reservation: {
      reservationId: input.authority.reservation.id,
      status: input.authority.reservation.status,
      remainingReservedCredits: input.readiness.reservation.remainingReservedCredits,
    },
    checks: [
      'approved_snapshot_manifest_integrity',
      'plan_estimate_work_graph_hash_integrity',
      'planning_preference_brief_binding_integrity',
      'source_media_manifest_integrity',
      'planned_asset_manifest_integrity',
      'execution_package_integrity',
      'funded_reservation_active',
      'exact_root_work_item_and_expected_output',
      'opaque_worker_execution_fence_started',
    ].map((checkId) => ({ checkId, status: 'passed' as const })),
    validationProfile: input.profile.kind,
    sourceTrim: input.profile.kind === 'source_trim'
      ? {
          status: 'confirmed' as const,
          sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
          sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
          decisionCount: cleanupDecisions.length,
          decisions: cleanupDecisions.map((decision) => ({
            decisionId: decision.decisionId,
            sourceSequenceItemId: decision.sourceSequenceItemId,
            action: decision.action,
            startFrame: decision.startFrame,
            endFrameExclusive: decision.endFrameExclusive,
            reasonHash: createHash('sha256').update(decision.reason).digest('hex'),
            confidence: decision.confidence,
            meaningPreservationStatus: decision.meaningPreservationStatus,
            userReviewStatus: decision.userReviewStatus,
          })),
          meaningPreservationValidated: true as const,
          unresolvedUserReview: false as const,
        }
      : null,
    valid: true as const,
  }
}

function createAuthorityAdapters(input: {
  runnerClass: InternalValidationProfile['runnerClass']
  localStorageRoot: string
  relativePath: string
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
    snapshotId: string
    jobId: string
    expectedAssetId: string
  }
  expectedLineage: CanonicalExpectedArtifactLineage
  bytes: Buffer
  contentSha256: string
  privateObjectIdentityHash: string
  executionAttemptId: string
  completedAt: string
}): { producedArtifact: ServerInjectedArtifactResultAdapter; artifactQa: ServerInjectedArtifactQaAdapter } {
  const producedArtifact: ServerInjectedArtifactResultAdapter = {
    adapterKind: 'server_injected_internal_artifact_adapter',
    async collectProducedArtifact(adapterInput) {
      assertAdapterIdentityAndLineage(adapterInput.identity, adapterInput.lineage, input)
      await verifyStoredArtifactBytes({
        localStorageRoot: input.localStorageRoot,
        relativePath: input.relativePath,
        expectedBytes: input.bytes,
        expectedSha256: input.contentSha256,
      })
      return {
        schemaVersion: 'server-internal-produced-artifact-evidence-v1' as const,
        evidenceOrigin: 'server_injected_internal_artifact_adapter' as const,
        evidenceClass: 'private_internal_test_attested' as const,
        artifactVersion: 1,
        attemptKind: 'initial' as const,
        content: {
          sha256: input.contentSha256,
          byteLength: input.bytes.byteLength,
          contentType: 'application/json',
        },
        storageIdentity: {
          storageKind: 'private_local_test' as const,
          opaqueObjectIdentityHash: input.privateObjectIdentityHash,
        },
        placeholder: { isPlaceholder: false, scope: 'none' as const },
        actualRunEvidence: {
          state: 'actual_run_evidence_placeholder' as const,
          executionAttemptId: input.executionAttemptId,
          runnerClass: input.runnerClass,
          runnerEvidenceHash: sha256ArtifactQaValue({
            executionAttemptId: input.executionAttemptId,
            contentSha256: input.contentSha256,
            lineage: input.expectedLineage,
          }),
          startedAt: input.completedAt,
          finishedAt: input.completedAt,
          exitCode: 0,
          toolIds: [],
          actualRunVerified: false as const,
        },
        completedAt: input.completedAt,
      }
    },
  }

  const artifactQa: ServerInjectedArtifactQaAdapter = {
    adapterKind: 'server_injected_internal_qa_adapter',
    async evaluateArtifact(adapterInput) {
      assertAdapterIdentityAndLineage(adapterInput.identity, adapterInput.lineage, input)
      assertArtifactMatchesBytes(adapterInput.artifact, input)
      const bytes = await readPrivateFileIfExistsWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: input.relativePath,
      })
      if (!bytes || !bytes.equals(input.bytes)) {
        throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Canonical authority validation bytes changed before QA.', 409)
      }
      const parsed = parseAuthorityValidationArtifact(bytes)
      const parsedExecutionFence = parsed.executionFence
      if (
        !parsedExecutionFence ||
        typeof parsedExecutionFence !== 'object' ||
        Array.isArray(parsedExecutionFence) ||
        (parsedExecutionFence as Record<string, unknown>).executionAttemptId !== input.executionAttemptId ||
        (parsedExecutionFence as Record<string, unknown>).runnerClass !== input.runnerClass
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical authority artifact execution-fence QA failed.', 409)
      }
      const receivedEvidenceHash = sha256ArtifactQaValue({
        artifactId: adapterInput.artifact.artifactId,
        contentSha256: input.contentSha256,
        privateObjectIdentityHash: input.privateObjectIdentityHash,
      })
      const qualityEvidenceHash = sha256ArtifactQaValue({
        parsed,
        expectedLineage: input.expectedLineage,
      })
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
            evidenceHash: receivedEvidenceHash,
            notesCode: 'private_authority_artifact_hash_size_storage_match',
          },
          {
            gateId: 'asset_quality_gate' as const,
            category: 'model_tier_policy' as const,
            status: 'passed' as const,
            failureScope: 'none' as const,
            evidenceHash: qualityEvidenceHash,
            notesCode: 'canonical_authority_manifest_validation_passed',
          },
        ],
        recovery: {
          state: 'none' as const,
          action: 'none' as const,
          approvedWithinSnapshot: true,
          reasonCode: 'authority_validation_pass_no_recovery',
        },
        evaluatedAt: new Date().toISOString(),
        actualQaEvidenceState: 'actual_qa_evidence_placeholder' as const,
        actualQaVerified: false as const,
      }
    },
  }
  return { producedArtifact, artifactQa }
}

function assertAdapterIdentityAndLineage(
  identity: Record<string, unknown>,
  lineage: CanonicalExpectedArtifactLineage,
  expected: Parameters<typeof createAuthorityAdapters>[0],
): void {
  if (
    stableArtifactQaStringify(identity) !== stableArtifactQaStringify(expected.identity) ||
    stableArtifactQaStringify(lineage) !== stableArtifactQaStringify(expected.expectedLineage)
  ) {
    throw invalidAuthority('Server-injected authority runner adapter received different canonical lineage.')
  }
}

function assertArtifactMatchesBytes(
  artifact: PersistedArtifactResult,
  expected: Parameters<typeof createAuthorityAdapters>[0],
): void {
  if (
    artifact.artifactVersion !== 1 ||
    artifact.content.sha256 !== expected.contentSha256 ||
    artifact.content.byteLength !== expected.bytes.byteLength ||
    artifact.content.contentType !== 'application/json' ||
    artifact.storageIdentity.opaqueObjectIdentityHash !== expected.privateObjectIdentityHash ||
    artifact.placeholder.isPlaceholder
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Persisted authority artifact does not match its private bytes.', 409)
  }
}

function parseAuthorityValidationArtifact(bytes: Buffer): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Canonical authority validation artifact is not valid JSON.', 409)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical authority validation artifact has an invalid shape.', 409)
  }
  const record = parsed as Record<string, unknown>
  const validationProfile = record.validationProfile
  const sourceTrim = record.sourceTrim
  if (
    record.schemaVersion !== ARTIFACT_SCHEMA_VERSION ||
    record.source !== 'immutable_canonical_edit_authority' ||
    record.valid !== true ||
    !Array.isArray(record.checks) ||
    record.checks.length !== 9 ||
    record.checks.some((check) => !check || typeof check !== 'object' ||
      (check as Record<string, unknown>).status !== 'passed') ||
    !['snapshot', 'source_trim'].includes(String(validationProfile)) ||
    (validationProfile === 'snapshot' && sourceTrim !== null) ||
    (validationProfile === 'source_trim' && !validSourceTrimEvidence(sourceTrim))
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical authority validation artifact failed semantic QA.', 409)
  }
  return record
}

function validSourceTrimEvidence(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const sourceIds = Array.isArray(record.sourceSequenceItemIds) ? record.sourceSequenceItemIds : []
  const decisionIds = Array.isArray(record.sourceCleanupDecisionIds) ? record.sourceCleanupDecisionIds : []
  const decisions = Array.isArray(record.decisions) ? record.decisions : []
  return record.status === 'confirmed' &&
    sourceIds.length > 0 && sourceIds.every((id) => typeof id === 'string') &&
    decisionIds.length > 0 && decisionIds.every((id) => typeof id === 'string') &&
    new Set(decisionIds).size === decisionIds.length &&
    record.decisionCount === decisionIds.length && decisions.length === decisionIds.length &&
    decisions.every((decision, index) => validSourceTrimDecision(
      decision,
      String(decisionIds[index]),
      sourceIds as string[],
    )) &&
    record.meaningPreservationValidated === true &&
    record.unresolvedUserReview === false
}

function validSourceTrimDecision(value: unknown, expectedDecisionId: string, sourceIds: string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const decision = value as Record<string, unknown>
  return decision.decisionId === expectedDecisionId &&
    typeof decision.sourceSequenceItemId === 'string' && sourceIds.includes(decision.sourceSequenceItemId) &&
    ['keep', 'cut', 'tighten', 'preserve', 'move_to_broll', 'use_as_voiceover', 'use_as_proof', 'use_as_alt_take']
      .includes(String(decision.action)) &&
    Number.isSafeInteger(decision.startFrame) && Number(decision.startFrame) >= 0 &&
    Number.isSafeInteger(decision.endFrameExclusive) &&
    Number(decision.endFrameExclusive) > Number(decision.startFrame) &&
    typeof decision.reasonHash === 'string' && /^[a-f0-9]{64}$/.test(decision.reasonHash) &&
    typeof decision.confidence === 'number' && decision.confidence >= 0 && decision.confidence <= 1 &&
    ['passed', 'warning'].includes(String(decision.meaningPreservationStatus)) &&
    ['not_required', 'resolved'].includes(String(decision.userReviewStatus))
}

async function verifyStoredArtifactBytes(input: {
  localStorageRoot: string
  relativePath: string
  expectedBytes: Buffer
  expectedSha256: string
}): Promise<void> {
  const stored = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: input.relativePath,
  })
  if (
    !stored ||
    stored.byteLength !== input.expectedBytes.byteLength ||
    !stored.equals(input.expectedBytes) ||
    sha256Bytes(stored) !== input.expectedSha256
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Private authority validation artifact integrity is invalid.', 409)
  }
}

function boundedInternalKey(prefix: string, identityHash: string): string {
  return `${prefix}-${identityHash.slice(0, 48)}`
}

function internalValidationProfile(purpose: RunCanonicalInternalAuthorityJobInput['purpose']) {
  return purpose === 'execute_canonical_internal_source_trim_validation'
    ? {
        kind: 'source_trim' as const,
        source: 'canonical_internal_source_trim_validation_runner' as const,
        runnerClass: 'canonical_source_trim_validation_runner_v1' as const,
        operation: 'validate_approved_source_trim_plan' as const,
        artifactDomain: 'canonical_internal_source_trim_validation_artifact_v1' as const,
      }
    : {
        kind: 'snapshot' as const,
        source: 'canonical_internal_authority_validation_runner' as const,
        runnerClass: 'canonical_authority_validation_runner_v1' as const,
        operation: 'validate_snapshot_manifest' as const,
        artifactDomain: 'canonical_internal_authority_validation_artifact_v1' as const,
      }
}

function parseRunRequest(input: RunCanonicalInternalAuthorityJobInput): RunCanonicalInternalAuthorityJobInput {
  const parsed = runCanonicalInternalAuthorityJobSchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical internal authority-runner identity is invalid.', 400, parsed.error.flatten())
  }
  return parsed.data
}

function parseLeaseAuthority(input: CanonicalInternalAuthorityRunnerLease): CanonicalInternalAuthorityRunnerLease {
  const parsed = canonicalInternalAuthorityRunnerLeaseSchema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError('WORKER_LEASE_EXPIRED', 'Server-injected authority-runner lease is invalid.', 409)
  }
  return parsed.data
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function invalidAuthority(message: string): ApiError {
  return new ApiError('APPROVED_SNAPSHOT_REQUIRED', message, 409)
}

async function withAuthorityArtifactWriteLock<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = authorityArtifactWriteLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.then(() => current)
  authorityArtifactWriteLocks.set(key, queued)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (authorityArtifactWriteLocks.get(key) === queued) authorityArtifactWriteLocks.delete(key)
  }
}
