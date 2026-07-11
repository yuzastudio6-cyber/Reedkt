import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  canonicalExecutionReadinessEnvelopeSchema,
  canonicalExecutionReadinessRequestSchema,
  type CanonicalExecutionReadinessEnvelope,
  type CanonicalExecutionReadinessRequest,
} from '../validation/canonical-execution-readiness-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import {
  createEditPlanningAuthorityService,
  type CanonicalApprovedExecutionAuthority,
  type CanonicalApprovedExecutionWorkItem,
} from './edit-planning-authority-service'
import {
  type AuthorityDerivedJobRecord,
  type AuthorityExecutionPackageRecord,
  type AuthorityPlannedAssetManifestEntry,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_EXECUTION_READINESS_ENVELOPE_VERSION =
  'canonical-execution-readiness-envelope-v1' as const

export interface CanonicalExecutionReadinessResponse {
  executionReadinessEnvelope: CanonicalExecutionReadinessEnvelope
  warnings: string[]
  testOnly: true
}

/**
 * Produces a read-only job envelope from server-owned approved authority.
 *
 * The caller supplies only tenant/project/session/job identity. Snapshot,
 * reservation, work-item, tool, provider, source, asset, and dependency data
 * are reloaded from immutable canonical authority. This boundary deliberately
 * does not issue a lease or authorize dispatch.
 */
export function createCanonicalExecutionReadinessService(context: ServiceContext) {
  return {
    async inspectJob(input: CanonicalExecutionReadinessRequest): Promise<CanonicalExecutionReadinessResponse> {
      const parsed = canonicalExecutionReadinessRequestSchema.safeParse(input)
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical execution-readiness identity is invalid.',
          400,
          parsed.error.flatten(),
        )
      }
      getRequiredAuthUserId(context)
      requireDryRunAuthorityRuntime(context)

      const body = parsed.data
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'read')
      await createProjectService(context).getProject(body.projectId, access.workspaceId)
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
      }
      const initialAggregate = await readPrivateEditAuthorityAggregate(scope)
      const initialJob = initialAggregate?.jobs.find((candidate) => candidate.id === body.jobId)
      const initialSnapshot = initialAggregate?.snapshots.find((candidate) =>
        candidate.snapshotId === initialJob?.snapshotId)
      if (
        !initialAggregate ||
        !initialJob ||
        !initialSnapshot ||
        initialSnapshot.projectId !== body.projectId ||
        initialSnapshot.editSessionId !== body.editSessionId
      ) {
        throw new ApiError('JOB_NOT_FOUND', 'Canonical job was not found in the requested project/session scope.', 404)
      }
      const initialPackageRecord = initialAggregate.executionPackages.find((candidate) =>
        candidate.snapshotId === initialSnapshot.snapshotId)
      if (!initialPackageRecord) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Canonical execution packaging must be completed before job readiness can be inspected.',
          409,
          { requiredGate: 'canonical_execution_package' },
        )
      }

      const planningAuthorityService = createEditPlanningAuthorityService(context)
      const authority = await planningAuthorityService.loadApprovedExecutionAuthority(
        initialSnapshot.snapshotId,
        access.workspaceId,
      )
      const packageRead = await createCanonicalEditExecutionPackageService(context).getPackage(
        initialPackageRecord.id,
        access.workspaceId,
      )

      const finalAggregate = await readPrivateEditAuthorityAggregate(scope)
      const finalJob = finalAggregate?.jobs.find((candidate) => candidate.id === body.jobId)
      const finalPackageRecord = finalAggregate?.executionPackages.find((candidate) =>
        candidate.id === initialPackageRecord.id)
      if (
        !finalAggregate ||
        !finalJob ||
        !finalPackageRecord ||
        finalAggregate.revision !== authority.authorityRevision ||
        packageRead.approvedEditExecutionPackage.authorityRevision !== authority.authorityRevision ||
        stableAuthorityStringify(finalJob) !== stableAuthorityStringify(initialJob) ||
        stableAuthorityStringify(finalPackageRecord) !== stableAuthorityStringify(initialPackageRecord)
      ) {
        throw new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Canonical authority changed while the dry-run job envelope was being verified; retry the read.',
          409,
          { requiredGate: 'coherent_canonical_authority_read' },
        )
      }

      const executionReadinessEnvelope = buildCanonicalExecutionReadinessEnvelope({
        body,
        authority,
        job: finalJob,
        packageRecord: finalPackageRecord,
        executionPackage: packageRead.approvedEditExecutionPackage,
        toolCapabilityManifest: packageRead.toolCapabilityManifest,
      })
      return {
        executionReadinessEnvelope,
        warnings: [
          'This envelope is private single-host, read-only internal-test evidence; it is not a worker claim or dispatch token.',
          'No provider, tool, media, artifact, render, credit-spend, or delivery side effect occurred.',
        ],
        testOnly: true,
      }
    },
  }
}

type PackageRead = Awaited<ReturnType<ReturnType<typeof createCanonicalEditExecutionPackageService>['getPackage']>>

function buildCanonicalExecutionReadinessEnvelope(input: {
  body: CanonicalExecutionReadinessRequest
  authority: CanonicalApprovedExecutionAuthority
  job: AuthorityDerivedJobRecord
  packageRecord: AuthorityExecutionPackageRecord
  executionPackage: PackageRead['approvedEditExecutionPackage']
  toolCapabilityManifest: PackageRead['toolCapabilityManifest']
}): CanonicalExecutionReadinessEnvelope {
  const { body, authority, job, packageRecord, executionPackage, toolCapabilityManifest } = input
  const snapshot = authority.snapshot
  const workItem = authority.workItems.find((candidate) => candidate.id === job.approvedWorkItemId)
  if (!workItem) throw invalidAuthority('Canonical job does not resolve to one approved work item.')
  assertIdentityAndPackageLineage(input, workItem)

  const expectedAssets = expectedAssetsForJob(authority, job, workItem)
  const dependencies = dependencyEvidenceForJob(authority, job, workItem)
  assertSourceAndCleanupLineage(authority, workItem)
  const registryBlockedToolIds = assertToolAuthority(
    workItem,
    executionPackage.approvedProviderRoutes,
    toolCapabilityManifest,
  )

  const remainingReservedCredits = authority.reservation.reservedCredits -
    authority.reservation.spentCredits -
    authority.reservation.releasedCredits -
    authority.reservation.refundedCredits
  if (
    !['reserved', 'partially_spent'].includes(authority.reservation.status) ||
    remainingReservedCredits <= 0 ||
    Date.parse(authority.reservation.expiresAt) <= Date.now()
  ) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Canonical job does not have an active funded reservation.', 409)
  }

  const hasDependencies = dependencies.length > 0
  const scheduledInFuture = Date.parse(job.scheduledFor) > Date.now()
  const blockers = [
    ...(hasDependencies
      ? ['Required dependency results, artifact versions, and QA evidence are not committed to canonical runtime authority.']
      : []),
    ...(scheduledInFuture ? ['The approved scheduled delay has not elapsed.'] : []),
    'This read-only readiness inspection does not issue or verify the separate tenant-bound opaque worker lease.',
    'Job-scoped tool runtime, runner, image, model, and license evidence has not been evaluated by the separate dispatch authority for this inspection.',
    'This inspection does not load produced artifact, QA, reconciliation, or actual-cost evidence; those remain separate execution gates.',
    'Worker claim, dispatch, provider/tool execution, rendering, and credit spend remain unauthorized.',
  ]

  const jobAuthorityHash = sha256AuthorityValue({
    job,
    approvedWorkItem: safeWorkItemAuthority(workItem),
    expectedAssets: expectedAssets.map((asset) => ({ ...asset })),
    dependencies: dependencies.map((dependency) => ({ ...dependency })),
  })
  const envelopeWithoutHash = {
    schemaVersion: CANONICAL_EXECUTION_READINESS_ENVELOPE_VERSION,
    source: 'immutable_canonical_edit_authority' as const,
    purpose: body.purpose,
    identity: {
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      editSessionId: body.editSessionId,
      jobId: body.jobId,
    },
    authorityRevision: authority.authorityRevision,
    authorityHashes: {
      snapshotHash: snapshot.snapshotHash,
      planHash: snapshot.planHash,
      estimateHash: snapshot.estimateHash,
      workGraphHash: snapshot.workGraphHash,
      sourceSequenceHash: snapshot.sourceSequenceHash,
      timingHash: snapshot.timingHash,
      planningInputBindingHash: authority.planningInputAuthority.bindingHash,
      approvedSourceAssetManifestHash: snapshot.approvedSourceAssetManifestHash,
      approvedAssetManifestHash: snapshot.approvedAssetManifestHash,
      executionPackageHash: packageRecord.packageHash,
      jobAuthorityHash,
    },
    executionPackage: {
      schemaVersion: executionPackage.schemaVersion,
      packageRecordId: packageRecord.id,
      packageHash: packageRecord.packageHash,
      toolCapabilityManifestRef: { ...packageRecord.toolCapabilityManifestRef },
      workerDispatchReady: false as const,
      liveExecutionReady: false as const,
    },
    reservation: {
      reservationId: authority.reservation.id,
      status: authority.reservation.status as 'reserved' | 'partially_spent',
      remainingReservedCredits,
      expiresAt: authority.reservation.expiresAt,
      authorityState: 'active_funded_test_reservation' as const,
    },
    job: {
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedWorkItemId: workItem.id,
      workItemKey: workItem.workItemKey,
      jobType: workItem.workItemType,
      workerClass: workItem.workerClass,
      executionInputRef: { ...workItem.executionInputRef },
      executionInputHash: workItem.executionInputHash,
      fallbackPolicyRef: { ...workItem.fallbackPolicyRef },
      sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
      sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
      expectedAssetIds: [...job.expectedAssetIds],
      dependencyJobIds: [...job.dependencyJobIds],
      canonicalGraphState: job.status,
      approvedToolIds: [...workItem.approvedToolIds],
      ...(workItem.approvedProviderRoute ? { approvedProviderRoute: workItem.approvedProviderRoute } : {}),
      providerExecutionMode: workItem.providerExecutionMode,
      maximumCreditBudget: workItem.maximumCreditBudget,
      required: workItem.required,
      maxAttempts: workItem.maxAttempts,
      attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
      scheduledFor: job.scheduledFor,
    },
    expectedAssets,
    dependencies,
    dependencyEvidenceState: hasDependencies
      ? 'required_results_and_qa_not_committed' as const
      : 'not_required_for_root_job' as const,
    sourceAuthority: {
      manifestRef: { ...snapshot.approvedSourceAssetManifestRef },
      manifestHash: snapshot.approvedSourceAssetManifestHash,
      boundSourceCount: authority.sourceAssetManifest.bindings.length,
      requiredSourceCount: authority.sourceAssetManifest.requiredBindingCount,
      referencedSourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
      objectResolutionAuthorized: false as const,
    },
    toolEvidence: {
      approvedToolIds: [...workItem.approvedToolIds],
      registryBlockedToolIds,
      runtimeEvidenceReadyCount: 0 as const,
      workerDispatchAuthorized: false as const,
    },
    gates: {
      identityScope: 'passed' as const,
      approvedAuthority: 'passed' as const,
      executionPackageIntegrity: 'passed' as const,
      planningInputAuthority: 'passed' as const,
      sourceMediaAuthority: 'passed' as const,
      plannedAssetAuthority: 'passed' as const,
      fundedReservation: 'passed' as const,
      dependencyEvidence: hasDependencies
        ? 'blocked_pending_results_and_qa' as const
        : 'not_required' as const,
      tenantBoundLease: 'separate_authority_not_issued' as const,
      runtimeToolEvidence: 'separate_authority_not_evaluated' as const,
      producedArtifactAuthority: 'separate_authority_not_evaluated' as const,
      qaResultAuthority: 'separate_authority_not_evaluated' as const,
      dispatch: 'not_authorized' as const,
    },
    readinessState: scheduledInFuture
      ? 'scheduled_delay_pending_runtime_blocked' as const
      : hasDependencies
        ? 'dependency_evidence_required_runtime_blocked' as const
        : 'authority_verified_runtime_blocked' as const,
    blockers,
    dryRun: true as const,
    claimAuthorized: false as const,
    dispatchAuthorized: false as const,
    providerCallAuthorized: false as const,
    toolExecutionAuthorized: false as const,
    artifactWriteAuthorized: false as const,
    renderAuthorized: false as const,
    creditSpendAuthorized: false as const,
    noRuntimeSideEffects: true as const,
  }
  const parsed = canonicalExecutionReadinessEnvelopeSchema.safeParse({
    ...envelopeWithoutHash,
    envelopeHash: sha256AuthorityValue(envelopeWithoutHash),
  })
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Server-derived canonical execution-readiness envelope is invalid.',
      409,
      parsed.error.flatten(),
    )
  }
  return parsed.data
}

function assertIdentityAndPackageLineage(
  input: Parameters<typeof buildCanonicalExecutionReadinessEnvelope>[0],
  workItem: CanonicalApprovedExecutionWorkItem,
): void {
  const { body, authority, job, packageRecord, executionPackage } = input
  const snapshot = authority.snapshot
  const { packageHash, ...packageWithoutHash } = packageRecord
  const packagedJob = executionPackage.jobs.find((candidate) => candidate.id === job.id)
  if (
    snapshot.workspaceId !== body.workspaceId ||
    snapshot.projectId !== body.projectId ||
    snapshot.editSessionId !== body.editSessionId ||
    job.id !== body.jobId ||
    job.snapshotId !== snapshot.snapshotId ||
    job.reservationId !== snapshot.reservationId ||
    packageHash !== sha256AuthorityValue(packageWithoutHash) ||
    packageRecord.snapshotId !== snapshot.snapshotId ||
    packageRecord.projectId !== snapshot.projectId ||
    packageRecord.editSessionId !== snapshot.editSessionId ||
    packageRecord.snapshotHash !== snapshot.snapshotHash ||
    packageRecord.planHash !== snapshot.planHash ||
    packageRecord.estimateHash !== snapshot.estimateHash ||
    packageRecord.workGraphHash !== snapshot.workGraphHash ||
    packageRecord.approvedAssetManifestHash !== snapshot.approvedAssetManifestHash ||
    packageRecord.approvedSourceAssetManifestHash !== snapshot.approvedSourceAssetManifestHash ||
    executionPackage.packageRecordId !== packageRecord.id ||
    executionPackage.packageHash !== packageHash ||
    executionPackage.approvedPlanSnapshotId !== snapshot.snapshotId ||
    executionPackage.reservationId !== snapshot.reservationId ||
    executionPackage.workerDispatchReady !== false ||
    executionPackage.liveExecutionReady !== false ||
    !packagedJob ||
    packagedJob.approvedWorkItemId !== workItem.id ||
    packagedJob.workItemKey !== workItem.workItemKey ||
    packagedJob.executionInputRef.sha256 !== workItem.executionInputRef.sha256 ||
    stableAuthorityStringify(packagedJob.expectedAssetIds) !== stableAuthorityStringify(job.expectedAssetIds) ||
    stableAuthorityStringify(packagedJob.dependencyJobIds) !== stableAuthorityStringify(job.dependencyJobIds)
  ) {
    throw invalidAuthority('Canonical execution package or job lineage is invalid.')
  }
}

function expectedAssetsForJob(
  authority: CanonicalApprovedExecutionAuthority,
  job: AuthorityDerivedJobRecord,
  workItem: CanonicalApprovedExecutionWorkItem,
) {
  const entries = authority.assetManifest.entries.filter((entry) => entry.approvedWorkItemId === workItem.id)
  if (
    entries.length !== workItem.expectedOutputs.length ||
    stableAuthorityStringify(entries.map((entry) => entry.id)) !== stableAuthorityStringify(job.expectedAssetIds)
  ) {
    throw invalidAuthority('Canonical job expected-asset lineage is invalid.')
  }
  return entries.map((entry) => safeExpectedAsset(entry))
}

function dependencyEvidenceForJob(
  authority: CanonicalApprovedExecutionAuthority,
  job: AuthorityDerivedJobRecord,
  workItem: CanonicalApprovedExecutionWorkItem,
) {
  const jobIdByWorkItemKey = new Map(authority.jobs.map((candidate) => [candidate.workItemKey, candidate.id]))
  const expectedDependencyJobIds = workItem.dependencyKeys.map((key) => jobIdByWorkItemKey.get(key))
  if (
    expectedDependencyJobIds.some((id) => !id) ||
    stableAuthorityStringify(expectedDependencyJobIds) !== stableAuthorityStringify(job.dependencyJobIds) ||
    job.status !== (job.dependencyJobIds.length === 0 ? 'ready' : 'blocked')
  ) {
    throw invalidAuthority('Canonical job dependency graph is invalid.')
  }
  return job.dependencyJobIds.map((dependencyJobId) => {
    const dependencyJob = authority.jobs.find((candidate) => candidate.id === dependencyJobId)
    const dependencyWorkItem = authority.workItems.find((candidate) =>
      candidate.id === dependencyJob?.approvedWorkItemId)
    if (!dependencyJob || !dependencyWorkItem || dependencyJob.snapshotId !== authority.snapshot.snapshotId) {
      throw invalidAuthority('Canonical dependency job lineage is incomplete.')
    }
    return {
      jobId: dependencyJob.id,
      approvedWorkItemId: dependencyWorkItem.id,
      workItemKey: dependencyWorkItem.workItemKey,
      jobType: dependencyWorkItem.workItemType,
      required: dependencyWorkItem.required,
      expectedAssetIds: [...dependencyJob.expectedAssetIds],
      canonicalGraphState: dependencyJob.status,
      completionEvidenceState: 'not_committed' as const,
      qaEvidenceState: 'not_committed' as const,
      dependencySatisfied: false as const,
    }
  })
}

function assertSourceAndCleanupLineage(
  authority: CanonicalApprovedExecutionAuthority,
  workItem: CanonicalApprovedExecutionWorkItem,
): void {
  const sourceSequenceIds = new Set(authority.components.sourceSequence.map((item) => item.sourceSequenceItemId))
  const boundSourceIds = new Set(authority.sourceAssetManifest.bindings.map((binding) => binding.sourceSequenceItemId))
  const cleanupDecisionIds = new Set(authority.components.sourceCleanupPlan.decisions.map((decision) => decision.decisionId))
  if (
    workItem.sourceSequenceItemIds.some((id) => !sourceSequenceIds.has(id) || !boundSourceIds.has(id)) ||
    workItem.sourceCleanupDecisionIds.some((id) => !cleanupDecisionIds.has(id))
  ) {
    throw invalidAuthority('Canonical job source or cleanup-decision lineage is invalid.')
  }
}

function assertToolAuthority(
  workItem: CanonicalApprovedExecutionWorkItem,
  approvedProviderRoutes: string[],
  manifest: PackageRead['toolCapabilityManifest'],
): string[] {
  if (
    manifest.workerDispatchAuthorized !== false ||
    manifest.runtimeEvidenceReadyCount !== 0 ||
    workItem.approvedToolIds.some((toolId) => {
      const tool = manifest.tools.find((candidate) => candidate.toolId === toolId)
      return !tool ||
        !tool.approvedWorkItemIds.includes(workItem.id) ||
        !tool.approvedWorkItemKeys.includes(workItem.workItemKey) ||
        tool.publicExecutionAllowed !== false ||
        tool.productionExecutionAllowed !== false
    }) ||
    (workItem.approvedProviderRoute !== undefined && !approvedProviderRoutes.includes(workItem.approvedProviderRoute))
  ) {
    throw invalidAuthority('Canonical tool/provider authorization manifest lineage is invalid.')
  }
  return workItem.approvedToolIds.filter((toolId) =>
    manifest.tools.find((candidate) => candidate.toolId === toolId)?.capabilityState === 'blocked_by_registry_policy')
}

function safeExpectedAsset(entry: AuthorityPlannedAssetManifestEntry) {
  return {
    assetId: entry.id,
    outputKey: entry.outputKey,
    artifactType: entry.artifactType,
    assetRole: entry.assetRole,
    required: entry.required,
    previewPlaceholderAllowed: entry.previewPlaceholderAllowed,
    ...(entry.contentType ? { contentType: entry.contentType } : {}),
    segmentIds: [...entry.segmentIds],
    timingIds: [...entry.timingIds],
    rendererLayerIds: [...entry.rendererLayerIds],
    authorityState: 'planned_no_produced_artifact_evidence' as const,
    version: 1 as const,
  }
}

function safeWorkItemAuthority(workItem: CanonicalApprovedExecutionWorkItem) {
  return {
    id: workItem.id,
    snapshotId: workItem.snapshotId,
    sourceWorkItemId: workItem.sourceWorkItemId,
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    executionInputRef: workItem.executionInputRef,
    executionInputHash: workItem.executionInputHash,
    sourceSequenceItemIds: workItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
    expectedOutputs: workItem.expectedOutputs,
    dependencyKeys: workItem.dependencyKeys,
    approvedToolIds: workItem.approvedToolIds,
    approvedProviderRoute: workItem.approvedProviderRoute,
    providerExecutionMode: workItem.providerExecutionMode,
    fallbackPolicyRef: workItem.fallbackPolicyRef,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
  }
}

function requireDryRunAuthorityRuntime(context: ServiceContext): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Canonical execution readiness is blocked outside explicit private local/internal testing.',
    503,
    {
      requiredGates: [
        'canonical_tenant_bound_worker_lease',
        'worker_service_identity',
        'runtime_tool_and_provider_evidence',
        'produced_artifact_and_qa_authority',
      ],
    },
  )
}

function invalidAuthority(message: string): ApiError {
  return new ApiError('APPROVED_SNAPSHOT_REQUIRED', message, 409)
}
