import { createHash } from 'node:crypto'

import {
  CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION,
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS,
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-postrender-visual-qa-work-binding'
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
import {
  executeCanonicalCaptionSpecialistWorkItem,
  parseCanonicalCaptionSpecialistWorkItemInput,
  parseCanonicalCaptionSpecialistExecutionReceipt,
} from './canonical-caption-specialist-execution-service'
import {
  parseCanonicalCaptionPostrenderVisualQaWorkItemInput,
} from '../captions-specialist/caption-postrender-visual-qa-work-binding'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_RUNNER_CLASS,
  prepareCanonicalCaptionPostrenderVisualQaExecution,
} from './canonical-caption-postrender-visual-qa-coordinator-service'
import {
  parseCanonicalCaptionPostrenderVisualQaEvidence,
} from './canonical-caption-postrender-visual-qa-evidence-service'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import { createCanonicalPrivateLocalJsonObjectPort } from './canonical-private-local-json-object-port'
import { createCanonicalSpecialistSupportResumeRepository } from './canonical-specialist-support-resume-service'
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
const CAPTION_ARTIFACT_SCHEMA_VERSION =
  'canonical-caption-specialist-planning-artifact-v1' as const
const CAPTION_VISUAL_QA_ARTIFACT_SCHEMA_VERSION =
  'canonical-caption-postrender-visual-qa-evidence-artifact-v1' as const
const MAXIMUM_ARTIFACT_BYTES = 1024 * 1024
const authorityArtifactWriteLocks = new Map<string, Promise<void>>()

/**
 * Executes the dependency-root, tool-free canonical snapshot validation job.
 *
 * This is WeEditPro server logic, not a third-party tool operation. It verifies
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

      const captionExecution = profile.kind === 'caption_specialist'
        ? await prepareCanonicalCaptionPlanningExecution({
            context,
            actorUserId,
            workspaceId: access.workspaceId,
            authority,
            jobId: body.jobId,
          })
        : null
      const captionVisualQaExecution = profile.kind ===
        'caption_postrender_visual_qa'
        ? await prepareCanonicalCaptionPostrenderVisualQaExecution({
            context,
            actorUserId,
            workspaceId: access.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            approvedSnapshotId: authority.snapshot.snapshotId,
            approvedWorkItemId: workItem.id,
            executionInput: workItem.executionInput,
          })
        : null

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
        selectedDependencyArtifacts:
          lease.dependencyAuthority.selectedArtifacts,
        captionExecution,
        captionVisualQaExecution,
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
type CaptionExecution = Awaited<ReturnType<
  typeof executeCanonicalCaptionSpecialistWorkItem
>>
type CaptionVisualQaExecution = Awaited<ReturnType<
  typeof prepareCanonicalCaptionPostrenderVisualQaExecution
>>

type InternalValidationProfile = ReturnType<typeof internalValidationProfile>

export async function prepareCanonicalCaptionPlanningExecution(input: {
  context: ServiceContext
  actorUserId: string
  workspaceId: string
  authority: Authority
  jobId: string
}): Promise<CaptionExecution> {
  const packageService = createCanonicalEditExecutionPackageService(
    input.context,
  )
  const locator = await packageService.findPackageBySnapshot(
    input.authority.snapshot.snapshotId,
    input.workspaceId,
  )
  if (!locator) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Canonical Caption execution is waiting for its exact approved package.',
      409,
      { requiredGate: 'canonical_caption_approved_execution_package_reread' },
    )
  }
  const packageRead = await packageService.getPackage(
    locator.packageRecordId,
    input.workspaceId,
  )
  const repository = createCanonicalSpecialistSupportResumeRepository({
    objectPort: createCanonicalPrivateLocalJsonObjectPort({
      localStorageRoot: input.context.env.localStorageRoot,
    }),
    prefix: [
      'private-internal/captions-specialist/v1',
      input.actorUserId,
      input.workspaceId,
    ].join('/'),
  })
  const execution = await executeCanonicalCaptionSpecialistWorkItem({
    authority: input.authority,
    executionPackage: packageRead.approvedEditExecutionPackage,
    jobId: input.jobId,
    repository,
  })
  if (execution.pair.result.disposition !== 'completed') {
    const supportRequestRefs = execution.pair.result.supportRequests.map(
      (request) => ({
        id: request.requestId,
        version: request.schemaVersion,
        contentHash: request.requestDigestSha256,
        targetSkillKey: request.targetSkillKey,
      }),
    )
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Canonical Caption planning is waiting for exact authenticated owner evidence.',
      409,
      {
        requiredGate: supportRequestRefs.length > 0
          ? 'canonical_caption_hq_mediated_support_resume'
          : 'canonical_caption_authenticated_transcript_projection',
        captionDisposition: execution.pair.result.disposition,
        reasonCodes: execution.pair.result.reasonCodes,
        supportRequestRefs,
      },
    )
  }
  return execution
}

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
      toolExecutionAuthorityHash: readiness.authorityHashes.toolExecutionAuthorityHash,
      resourcePlacementAuthorityHash:
        readiness.authorityHashes.resourcePlacementAuthorityHash,
      resourcePlacementHash: readiness.authorityHashes.resourcePlacementHash,
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
    expectedAsset.assetRole !== (profile.kind === 'living_frame_layer' ? 'processed' : 'qa') ||
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
  if (profile.kind === 'living_frame_layer') {
    const selectedArtifact = lease.dependencyAuthority.selectedArtifacts[0]
    const payload = livingFrameLayerPayload(workItem.executionInput)
    const dependencyWorkItem = payload
      ? authority.workItems.find((candidate) =>
          candidate.workItemKey === payload.componentDependency.workItemKey)
      : undefined
    const dependencyJob = dependencyWorkItem
      ? authority.jobs.find((candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id)
      : undefined
    const dependencyAsset = dependencyWorkItem && payload
      ? authority.assetManifest.entries.find((candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id &&
          candidate.outputKey === payload.componentDependency.outputKey)
      : undefined
    if (
      readiness.job.canonicalGraphState !== 'ready' ||
      readiness.job.dependencyJobIds.length !== 1 ||
      readiness.dependencyEvidenceState !==
        'required_results_and_qa_not_committed' ||
      lease.dependencyAuthority.state !== 'private_test_dependencies_verified' ||
      lease.dependencyAuthority.selectedArtifacts.length !== 1 ||
      !selectedArtifact ||
      !payload ||
      workItem.workItemType !== 'prepare_remotion_layer' ||
      workItem.workerClass !== CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORKER_CLASS ||
      workItem.sourceSequenceItemIds.length === 0 ||
      workItem.sourceCleanupDecisionIds.length === 0 ||
      workItem.dependencyKeys.length !== 1 ||
      workItem.dependencyKeys[0] !== payload.componentDependency.workItemKey ||
      workItem.expectedOutputs[0]?.outputKey !== expectedAsset.outputKey ||
      expectedAsset.artifactType !== 'living_frame_remotion_layer_manifest' ||
      expectedAsset.rendererLayerIds.length !== 1 ||
      expectedAsset.rendererLayerIds[0] !== payload.layerId ||
      !dependencyWorkItem ||
      !dependencyJob ||
      !dependencyAsset ||
      dependencyWorkItem.workItemType !== 'process_image_asset' ||
      dependencyAsset.artifactType !== payload.componentDependency.artifactType ||
      dependencyAsset.contentType !== payload.componentDependency.contentType ||
      selectedArtifact.dependencyJobId !== dependencyJob.id ||
      readiness.job.dependencyJobIds[0] !== dependencyJob.id ||
      selectedArtifact.expectedAssetId !== dependencyAsset.id
    ) {
      throw invalidAuthority(
        'Canonical Living Frame layer-manifest job is not exactly executable.',
      )
    }
    return
  }
  if (profile.kind === 'caption_specialist') {
    const workInput = workItem
      ? parseCanonicalCaptionSpecialistWorkItemInput(workItem.executionInput)
      : null
    const dependencyCount = readiness.job.dependencyJobIds.length
    const dependencyAuthorityMatches = dependencyCount === 0
      ? lease.dependencyAuthority.state === 'not_required_for_root_job'
        && lease.dependencyAuthority.selectedArtifacts.length === 0
      : lease.dependencyAuthority.state ===
          'private_test_dependencies_verified'
        && lease.dependencyAuthority.selectedArtifacts.length === dependencyCount
        && new Set(lease.dependencyAuthority.selectedArtifacts.map(
          (artifact) => artifact.dependencyJobId)).size === dependencyCount
    if (
      readiness.job.canonicalGraphState !== 'ready' ||
      !dependencyAuthorityMatches ||
      !workInput ||
      workItem.workItemType !== 'custom' ||
      workItem.workerClass !== CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS ||
      workInput.operation !== CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION ||
      workItem.expectedOutputs[0]?.outputKey !== expectedAsset.outputKey ||
      expectedAsset.artifactType !== 'caption_specialist_job_receipt' ||
      expectedAsset.assetRole !== 'qa' ||
      expectedAsset.rendererLayerIds.length !== 0
    ) {
      throw invalidAuthority(
        'Canonical Caption specialist planning job is not exactly executable.',
      )
    }
    return
  }
  if (profile.kind === 'caption_postrender_visual_qa') {
    const workInput = workItem
      ? parseCanonicalCaptionPostrenderVisualQaWorkItemInput(
          workItem.executionInput)
      : null
    const dependencyWorkItem = workInput
      ? authority.workItems.find((candidate) =>
          candidate.workItemKey === workInput.deterministicQaWorkItemKey)
      : undefined
    const dependencyJob = dependencyWorkItem
      ? authority.jobs.find((candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id)
      : undefined
    const dependencyAsset = dependencyWorkItem && workInput
      ? authority.assetManifest.entries.find((candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id
          && candidate.outputKey === workInput.deterministicQaOutputKey)
      : undefined
    const selectedArtifact = lease.dependencyAuthority.selectedArtifacts[0]
    if (
      readiness.job.canonicalGraphState !== 'ready'
      || readiness.job.dependencyJobIds.length !== 1
      || lease.dependencyAuthority.state !==
        'private_test_dependencies_verified'
      || lease.dependencyAuthority.selectedArtifacts.length !== 1
      || !selectedArtifact || !workInput
      || workItem.workItemType !== 'custom'
      || workItem.workerClass !==
        CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS
      || workInput.operation !==
        CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION
      || workItem.dependencyKeys.length !== 1
      || workItem.dependencyKeys[0]
        !== workInput.deterministicQaWorkItemKey
      || workItem.maximumCreditBudget !== 0
      || workItem.expectedOutputs[0]?.outputKey !== expectedAsset.outputKey
      || expectedAsset.artifactType !==
        'canonical_postrender_visual_qa_lifecycle_result'
      || expectedAsset.assetRole !== 'qa'
      || !dependencyWorkItem || !dependencyJob || !dependencyAsset
      || dependencyWorkItem.workItemType !== 'run_final_qa'
      || dependencyWorkItem.workerClass !== 'qa_worker'
      || dependencyAsset.artifactType !== 'final_qa_report'
      || dependencyAsset.contentType !== 'application/json'
      || stableAuthorityStringify(expectedAsset.segmentIds)
        !== stableAuthorityStringify(dependencyAsset.segmentIds)
      || stableAuthorityStringify(expectedAsset.timingIds)
        !== stableAuthorityStringify(dependencyAsset.timingIds)
      || stableAuthorityStringify(expectedAsset.rendererLayerIds)
        !== stableAuthorityStringify(dependencyAsset.rendererLayerIds)
      || selectedArtifact.dependencyJobId !== dependencyJob.id
      || selectedArtifact.expectedAssetId !== dependencyAsset.id
      || readiness.job.dependencyJobIds[0] !== dependencyJob.id
    ) {
      throw invalidAuthority(
        'Canonical Caption post-render visual-QA job is not exactly executable.',
      )
    }
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
  selectedDependencyArtifacts:
    Lease['dependencyAuthority']['selectedArtifacts']
  captionExecution: CaptionExecution | null
  captionVisualQaExecution: CaptionVisualQaExecution | null
}) {
  const workItem = input.authority.workItems.find((item) => item.id === input.workItemId)!
  const cleanupDecisions = input.profile.kind === 'source_trim'
    ? workItem.sourceCleanupDecisionIds.map((decisionId) =>
        input.authority.components.sourceCleanupPlan.decisions.find(
          (decision) => decision.decisionId === decisionId,
        )!)
    : []
  const livingFrameLayer = input.profile.kind === 'living_frame_layer'
    ? buildLivingFrameLayerEvidence({
        authority: input.authority,
        workItem,
        selectedDependencyArtifacts:
          input.selectedDependencyArtifacts,
      })
    : null
  const captionSpecialist = input.profile.kind === 'caption_specialist'
    ? buildCaptionSpecialistEvidence(input.captionExecution)
    : null
  const captionPostrenderVisualQa = input.profile.kind ===
    'caption_postrender_visual_qa'
    ? buildCaptionPostrenderVisualQaEvidence(input.captionVisualQaExecution)
    : null
  return {
    schemaVersion: input.profile.kind === 'caption_specialist'
      ? CAPTION_ARTIFACT_SCHEMA_VERSION
      : input.profile.kind === 'caption_postrender_visual_qa'
        ? CAPTION_VISUAL_QA_ARTIFACT_SCHEMA_VERSION
        : ARTIFACT_SCHEMA_VERSION,
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
    livingFrameLayer,
    captionSpecialist,
    captionPostrenderVisualQa,
    valid: true as const,
  }
}

function buildCaptionSpecialistEvidence(
  execution: CaptionExecution | null,
) {
  if (!execution || execution.pair.result.disposition !== 'completed') {
    throw invalidAuthority(
      'Canonical Caption specialist planning result is not complete.',
    )
  }
  const receipt = parseCanonicalCaptionSpecialistExecutionReceipt(
    execution.receipt,
  )
  if (receipt.resultDisposition !== 'completed'
    || receipt.providerCallPerformed
    || receipt.mediaRuntimePerformed
    || receipt.assetMutationPerformed
    || receipt.finalQaApprovalGranted
    || receipt.publicDeliveryGranted
    || receipt.productionAuthorityGranted) {
    throw invalidAuthority(
      'Canonical Caption specialist planning receipt exceeded its authority.',
    )
  }
  return {
    receipt,
    callResultPairRef: {
      id: execution.pair.pairId,
      version: execution.pair.schemaVersion,
      contentHash: execution.pair.pairDigestSha256,
    },
    producedArtifactRefs: structuredClone(
      execution.pair.result.producedArtifactRefs),
    supportRequestCount: execution.pair.result.supportRequests.length,
    exactCreateOnlyRereadVerified: true as const,
    planningOnly: true as const,
    renderedMediaClaimed: false as const,
    finalQaClaimed: false as const,
  }
}

function buildCaptionPostrenderVisualQaEvidence(
  execution: CaptionVisualQaExecution | null,
) {
  if (!execution || !execution.exactRereadVerified) {
    throw invalidAuthority(
      'Canonical Caption post-render visual-QA evidence was not exactly reconciled.',
    )
  }
  const evidence = parseCanonicalCaptionPostrenderVisualQaEvidence(
    execution.envelope.evidence)
  return {
    evidence,
    workRequestRef: structuredClone(evidence.workRequestRef),
    lifecycleResultRef: structuredClone(evidence.lifecycleResultRef),
    normalizedResultRef: structuredClone(evidence.normalizedDecisionRef),
    persistenceDisposition: execution.disposition,
    canonicalOwnerResultRereadVerified: true as const,
    evidenceCreateOnlyRereadVerified: true as const,
    actualModelInferenceVerifiedFromCanonicalOwner: true as const,
    providerCallMadeByCaptionRunner: false as const,
    qaApprovalGranted: false as const,
    repairExecutionGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
}

interface LivingFrameLayerPayload {
  schemaVersion:
    typeof CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION
  selectedSceneBindingDigestSha256: string
  timingBindingDigestSha256: string
  sceneId: string
  layerId: string
  startFrame: number
  endFrameExclusive: number
  outputWidth: number
  outputHeight: number
  fit: 'fill'
  opacity: 1
  compositionPolicy:
    typeof CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY
  captionPlaneRemainsAboveLivingFrame: true
  componentDependency: {
    workItemKey: string
    outputKey: string
    artifactType: 'living_frame_component_rgba_png'
    contentType: 'image/png'
  }
}

function livingFrameLayerPayload(
  executionInput: unknown,
): LivingFrameLayerPayload | null {
  if (!executionInput || typeof executionInput !== 'object' ||
      Array.isArray(executionInput)) return null
  const execution = executionInput as Record<string, unknown>
  const payloadValue = execution.structuredPayload
  if (
    execution.operation !==
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION ||
    !Array.isArray(execution.approvedToolOperationIds) ||
    execution.approvedToolOperationIds.length !== 0 ||
    !Array.isArray(execution.expectedOutputKeys) ||
    execution.expectedOutputKeys.length !== 1 ||
    !payloadValue ||
    typeof payloadValue !== 'object' ||
    Array.isArray(payloadValue)
  ) return null
  const payload = payloadValue as Record<string, unknown>
  const dependencyValue = payload.componentDependency
  if (
    !dependencyValue ||
    typeof dependencyValue !== 'object' ||
    Array.isArray(dependencyValue)
  ) return null
  const dependency = dependencyValue as Record<string, unknown>
  const exactPayloadKeys = [
    'captionPlaneRemainsAboveLivingFrame',
    'componentDependency',
    'compositionPolicy',
    'endFrameExclusive',
    'fit',
    'layerId',
    'opacity',
    'outputHeight',
    'outputWidth',
    'sceneId',
    'schemaVersion',
    'selectedSceneBindingDigestSha256',
    'startFrame',
    'timingBindingDigestSha256',
  ]
  const exactDependencyKeys = [
    'artifactType',
    'contentType',
    'outputKey',
    'workItemKey',
  ]
  if (
    stableAuthorityStringify(Object.keys(payload).sort()) !==
      stableAuthorityStringify(exactPayloadKeys) ||
    stableAuthorityStringify(Object.keys(dependency).sort()) !==
      stableAuthorityStringify(exactDependencyKeys) ||
    payload.schemaVersion !==
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION ||
    !validSha256(payload.selectedSceneBindingDigestSha256) ||
    !validSha256(payload.timingBindingDigestSha256) ||
    !validInternalIdentity(payload.sceneId) ||
    !validInternalIdentity(payload.layerId) ||
    !Number.isSafeInteger(payload.startFrame) ||
    Number(payload.startFrame) < 0 ||
    !Number.isSafeInteger(payload.endFrameExclusive) ||
    Number(payload.endFrameExclusive) <= Number(payload.startFrame) ||
    !Number.isSafeInteger(payload.outputWidth) ||
    Number(payload.outputWidth) < 1 ||
    Number(payload.outputWidth) > 4_096 ||
    !Number.isSafeInteger(payload.outputHeight) ||
    Number(payload.outputHeight) < 1 ||
    Number(payload.outputHeight) > 4_096 ||
    payload.fit !== 'fill' ||
    payload.opacity !== 1 ||
    payload.compositionPolicy !==
      CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY ||
    payload.captionPlaneRemainsAboveLivingFrame !== true ||
    !validInternalIdentity(dependency.workItemKey) ||
    !validInternalIdentity(dependency.outputKey) ||
    dependency.artifactType !==
      'living_frame_component_rgba_png' ||
    dependency.contentType !== 'image/png'
  ) return null
  return payload as unknown as LivingFrameLayerPayload
}

function buildLivingFrameLayerEvidence(input: {
  authority: Authority
  workItem: Authority['workItems'][number]
  selectedDependencyArtifacts:
    Lease['dependencyAuthority']['selectedArtifacts']
}) {
  const payload = livingFrameLayerPayload(input.workItem.executionInput)
  if (!payload) {
    throw invalidAuthority(
      'Canonical Living Frame layer-manifest payload is missing during compilation.',
    )
  }
  const dependencyWorkItem = input.authority.workItems.find(
    (candidate) =>
      candidate.workItemKey === payload.componentDependency.workItemKey,
  )
  const dependencyJob = dependencyWorkItem
    ? input.authority.jobs.find(
        (candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id,
      )
    : undefined
  const dependencyAsset = dependencyWorkItem
    ? input.authority.assetManifest.entries.find(
        (candidate) =>
          candidate.approvedWorkItemId === dependencyWorkItem.id &&
          candidate.outputKey === payload.componentDependency.outputKey,
      )
    : undefined
  const selectedArtifact =
    input.selectedDependencyArtifacts[0]
  if (
    !dependencyJob ||
    !dependencyAsset ||
    input.selectedDependencyArtifacts.length !== 1 ||
    !selectedArtifact ||
    selectedArtifact.dependencyJobId !== dependencyJob.id ||
    selectedArtifact.expectedAssetId !== dependencyAsset.id
  ) {
    throw invalidAuthority(
      'Canonical Living Frame component dependency is missing during layer-manifest compilation.',
    )
  }
  return {
    schemaVersion: payload.schemaVersion,
    selectedSceneBindingDigestSha256:
      payload.selectedSceneBindingDigestSha256,
    timingBindingDigestSha256:
      payload.timingBindingDigestSha256,
    sceneId: payload.sceneId,
    layerId: payload.layerId,
    startFrame: payload.startFrame,
    endFrameExclusive: payload.endFrameExclusive,
    outputWidth: payload.outputWidth,
    outputHeight: payload.outputHeight,
    fit: payload.fit,
    opacity: payload.opacity,
    compositionPolicy: payload.compositionPolicy,
    captionPlaneRemainsAboveLivingFrame:
      payload.captionPlaneRemainsAboveLivingFrame,
    component: {
      workItemKey: payload.componentDependency.workItemKey,
      dependencyJobId: dependencyJob.id,
      outputKey: payload.componentDependency.outputKey,
      expectedAssetId: dependencyAsset.id,
      artifactType: payload.componentDependency.artifactType,
      contentType: payload.componentDependency.contentType,
      artifactId: selectedArtifact.artifactId,
      artifactVersion: selectedArtifact.artifactVersion,
      contentSha256: selectedArtifact.contentSha256,
      qaEvaluationId: selectedArtifact.qaEvaluationId,
      reconciliationId: selectedArtifact.reconciliationId,
      executionAttemptId: selectedArtifact.executionAttemptId,
      sourceLeaseImmutableHash:
        selectedArtifact.sourceLeaseImmutableHash,
    },
  }
}

function validSha256(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[a-f0-9]{64}$/.test(value)
}

function validInternalIdentity(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) &&
    !value.includes('..')
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
  const livingFrameLayer = record.livingFrameLayer
  const captionSpecialist = record.captionSpecialist
  const captionPostrenderVisualQa = record.captionPostrenderVisualQa
  const captionProfile = validationProfile === 'caption_specialist'
  const captionVisualQaProfile = validationProfile ===
    'caption_postrender_visual_qa'
  if (
    (captionProfile
      ? record.schemaVersion !== CAPTION_ARTIFACT_SCHEMA_VERSION
      : captionVisualQaProfile
        ? record.schemaVersion !== CAPTION_VISUAL_QA_ARTIFACT_SCHEMA_VERSION
        : record.schemaVersion !== ARTIFACT_SCHEMA_VERSION) ||
    record.source !== 'immutable_canonical_edit_authority' ||
    record.valid !== true ||
    !Array.isArray(record.checks) ||
    record.checks.length !== 9 ||
    record.checks.some((check) => !check || typeof check !== 'object' ||
      (check as Record<string, unknown>).status !== 'passed') ||
    ![
      'snapshot',
      'source_trim',
      'living_frame_layer',
      'caption_specialist',
      'caption_postrender_visual_qa',
    ].includes(
      String(validationProfile),
    ) ||
    (validationProfile === 'snapshot' &&
      (sourceTrim !== null || livingFrameLayer !== null
        || (captionSpecialist !== null && captionSpecialist !== undefined)
        || (captionPostrenderVisualQa !== null
          && captionPostrenderVisualQa !== undefined))) ||
    (validationProfile === 'source_trim' &&
      (!validSourceTrimEvidence(sourceTrim) ||
        livingFrameLayer !== null ||
        (captionSpecialist !== null && captionSpecialist !== undefined)
        || (captionPostrenderVisualQa !== null
          && captionPostrenderVisualQa !== undefined))) ||
    (validationProfile === 'living_frame_layer' &&
      (sourceTrim !== null ||
        !validLivingFrameLayerEvidence(livingFrameLayer) ||
        (captionSpecialist !== null && captionSpecialist !== undefined)
        || (captionPostrenderVisualQa !== null
          && captionPostrenderVisualQa !== undefined))) ||
    (validationProfile === 'caption_specialist' &&
      (sourceTrim !== null || livingFrameLayer !== null
        || !validCaptionSpecialistEvidence(captionSpecialist)
        || (captionPostrenderVisualQa !== null
          && captionPostrenderVisualQa !== undefined))) ||
    (validationProfile === 'caption_postrender_visual_qa' &&
      (sourceTrim !== null || livingFrameLayer !== null
        || (captionSpecialist !== null && captionSpecialist !== undefined)
        || !validCaptionPostrenderVisualQaEvidence(
          captionPostrenderVisualQa)))
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical authority validation artifact failed semantic QA.', 409)
  }
  return record
}

function validCaptionPostrenderVisualQaEvidence(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  try {
    const evidence = parseCanonicalCaptionPostrenderVisualQaEvidence(
      record.evidence)
    return evidence.actualModelInferenceVerified === true
      && evidence.deterministicQaPassed === true
      && record.canonicalOwnerResultRereadVerified === true
      && record.evidenceCreateOnlyRereadVerified === true
      && record.actualModelInferenceVerifiedFromCanonicalOwner === true
      && record.providerCallMadeByCaptionRunner === false
      && record.qaApprovalGranted === false
      && record.repairExecutionGranted === false
      && record.publicDeliveryGranted === false
      && record.productionAuthorityGranted === false
      && ['created', 'idempotent_replay'].includes(
        String(record.persistenceDisposition))
      && refMatches(record.workRequestRef, evidence.workRequestRef)
      && refMatches(record.lifecycleResultRef, evidence.lifecycleResultRef)
      && refMatches(record.normalizedResultRef,
        evidence.normalizedDecisionRef)
  } catch {
    return false
  }
}

function refMatches(left: unknown, right: unknown): boolean {
  return stableArtifactQaStringify(left) === stableArtifactQaStringify(right)
}

function validCaptionSpecialistEvidence(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (!record.receipt || typeof record.receipt !== 'object'
    || Array.isArray(record.receipt)
    || !record.callResultPairRef
    || typeof record.callResultPairRef !== 'object'
    || Array.isArray(record.callResultPairRef)
    || !Array.isArray(record.producedArtifactRefs)) return false
  try {
    const receipt = parseCanonicalCaptionSpecialistExecutionReceipt(
      record.receipt,
    )
    const pairRef = record.callResultPairRef as Record<string, unknown>
    return receipt.resultDisposition === 'completed'
      && record.supportRequestCount === 0
      && record.exactCreateOnlyRereadVerified === true
      && record.planningOnly === true
      && record.renderedMediaClaimed === false
      && record.finalQaClaimed === false
      && record.producedArtifactRefs.length === 1
      && validInternalIdentity(pairRef.id)
      && pairRef.version === 'canonical-specialist-call-result-pair-v1'
      && validSha256(pairRef.contentHash)
  } catch {
    return false
  }
}

function validLivingFrameLayerEvidence(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  const component = record.component
  if (
    !component ||
    typeof component !== 'object' ||
    Array.isArray(component)
  ) return false
  const artifact = component as Record<string, unknown>
  return (
    record.schemaVersion ===
      CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_INPUT_VERSION &&
    validSha256(record.selectedSceneBindingDigestSha256) &&
    validSha256(record.timingBindingDigestSha256) &&
    validInternalIdentity(record.sceneId) &&
    validInternalIdentity(record.layerId) &&
    Number.isSafeInteger(record.startFrame) &&
    Number(record.startFrame) >= 0 &&
    Number.isSafeInteger(record.endFrameExclusive) &&
    Number(record.endFrameExclusive) > Number(record.startFrame) &&
    Number.isSafeInteger(record.outputWidth) &&
    Number(record.outputWidth) >= 1 &&
    Number(record.outputWidth) <= 4_096 &&
    Number.isSafeInteger(record.outputHeight) &&
    Number(record.outputHeight) >= 1 &&
    Number(record.outputHeight) <= 4_096 &&
    record.fit === 'fill' &&
    record.opacity === 1 &&
    record.compositionPolicy ===
      CANONICAL_LIVING_FRAME_FINAL_OVERLAY_POLICY &&
    record.captionPlaneRemainsAboveLivingFrame === true &&
    validInternalIdentity(artifact.workItemKey) &&
    validInternalIdentity(artifact.dependencyJobId) &&
    validInternalIdentity(artifact.outputKey) &&
    validInternalIdentity(artifact.expectedAssetId) &&
    artifact.artifactType === 'living_frame_component_rgba_png' &&
    artifact.contentType === 'image/png' &&
    validInternalIdentity(artifact.artifactId) &&
    Number.isSafeInteger(artifact.artifactVersion) &&
    Number(artifact.artifactVersion) > 0 &&
    validSha256(artifact.contentSha256) &&
    validInternalIdentity(artifact.qaEvaluationId) &&
    validInternalIdentity(artifact.reconciliationId) &&
    validInternalIdentity(artifact.executionAttemptId) &&
    validSha256(artifact.sourceLeaseImmutableHash)
  )
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
  if (purpose === 'execute_canonical_internal_source_trim_validation') {
    return {
      kind: 'source_trim' as const,
      source: 'canonical_internal_source_trim_validation_runner' as const,
      runnerClass: 'canonical_source_trim_validation_runner_v1' as const,
      operation: 'validate_approved_source_trim_plan' as const,
      artifactDomain: 'canonical_internal_source_trim_validation_artifact_v1' as const,
    }
  }
  if (
    purpose ===
      'execute_canonical_internal_living_frame_layer_manifest'
  ) {
    return {
      kind: 'living_frame_layer' as const,
      source:
        'canonical_internal_living_frame_layer_manifest_runner' as const,
      runnerClass:
        'canonical_living_frame_layer_manifest_runner_v1' as const,
      operation:
        CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
      artifactDomain:
        'canonical_internal_living_frame_layer_manifest_artifact_v1' as const,
    }
  }
  if (
    purpose ===
      'execute_canonical_internal_caption_specialist_planning'
  ) {
    return {
      kind: 'caption_specialist' as const,
      source:
        'canonical_internal_caption_specialist_planning_runner' as const,
      runnerClass:
        'canonical_caption_specialist_planning_runner_v1' as const,
      operation: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
      artifactDomain:
      'canonical_internal_caption_specialist_planning_artifact_v1' as const,
    }
  }
  if (
    purpose ===
      'execute_canonical_internal_caption_postrender_visual_qa_reconciliation'
  ) {
    return {
      kind: 'caption_postrender_visual_qa' as const,
      source:
        'canonical_internal_caption_postrender_visual_qa_coordinator' as const,
      runnerClass:
        CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_COORDINATOR_RUNNER_CLASS,
      operation:
        CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION,
      artifactDomain:
        'canonical_internal_caption_postrender_visual_qa_artifact_v1' as const,
    }
  }
  return {
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
