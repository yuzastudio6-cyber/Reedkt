import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { SupabaseClient } from '@supabase/supabase-js'

import { buildProfessionalExportCreditCoverage } from '../../src/lib/professional-export-policy'
import { loadRuntimeEnv } from '../config/env'
import {
  CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE,
} from '../edit-architecture/professional-long-form-child-package-promotion'
import {
  PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY,
} from '../edit-architecture/professional-long-form-approved-snapshot-bridge'
import {
  PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  verifyProfessionalLongFormObjectPlanSeed,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import {
  assertProfessionalLongFormDerivedChildJobsDispatchAuthority,
  verifyProfessionalLongFormDerivedChildJobManifest,
} from '../edit-architecture/professional-long-form-derived-child-job-manifest'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  assertProfessionalLongFormFirstChildQaEvidence,
  assertProfessionalLongFormFirstChildReconciliationEvidence,
  assertProfessionalLongFormFirstChildTerminalEvidence,
  assertProfessionalLongFormFirstChildValidationArtifact,
  buildProfessionalLongFormFirstChildAuthorizationReceipt,
  buildProfessionalLongFormFirstChildExecutionAuthority,
} from '../edit-architecture/professional-long-form-first-child-execution'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  assertProfessionalLongFormSourceAuthorityQaEvidence,
  assertProfessionalLongFormSourceAuthorityReconciliationEvidence,
  assertProfessionalLongFormSourceAuthorityTerminalEvidence,
  assertProfessionalLongFormSourceAuthorityValidationArtifact,
} from '../edit-architecture/professional-long-form-source-authority-execution'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalEditExecutionPackageService,
} from '../services/canonical-edit-execution-package-service'
import {
  CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY,
  CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
} from '../services/canonical-professional-long-form-publication-authority'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
} from '../services/canonical-professional-long-form-child-package-promotion-service'
import {
  createCanonicalProfessionalLongFormPostApprovalService,
} from '../services/canonical-professional-long-form-post-approval-service'
import {
  createCanonicalProfessionalLongFormFirstChildExecutionService,
} from '../services/canonical-professional-long-form-first-child-execution-service'
import {
  createCanonicalProfessionalLongFormSourceAuthorityExecutionService,
} from '../services/canonical-professional-long-form-source-authority-execution-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createExactEditPreferenceService } from '../services/exact-edit-preference-service'
import {
  canonicalPrivatePackageWorkQueueAggregateRelativePath,
  authorizePrivateCanonicalPackageWorkQueueJob,
  claimPrivateCanonicalPackageWorkQueueJob,
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import {
  clearPrivateEditAuthorityProcessStateForSmoke,
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  clearPrivateExactEditPreferenceProcessStateForSmoke,
  exactEditPreferenceFingerprint,
} from '../services/private-exact-edit-preference-store'
import {
  clearLocalProjectMemoryForSmoke,
  createProjectService,
} from '../services/project-service'
import { createSourceMediaAuthorityService } from '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import {
  PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
  type CanonicalWorkItemInput,
  type PublishCanonicalEditPlanBody,
} from '../validation/edit-planning-authority-schemas'
import type {
  SourceBindingManifestCandidate,
  SourceMediaAuthorityExpectation,
} from '../validation/source-media-authority-schemas'
import {
  privateInternalAttemptCostEvidenceSchema,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'

const workspaceId = 'workspace-canonical-professional-long-form'
const userId = 'user-canonical-professional-long-form'
const editSessionId = 'edit-session-six-hour-object-authority'
const planningRequestId = 'planning-six-hour-object-authority'
const fps = 30
const totalFrames = PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * fps
const sourceCount = 8
const localStorageRoot = join(
  tmpdir(),
  `reeditpro-canonical-professional-long-form-${process.pid}`,
)

const checks: string[] = []
const check = (condition: unknown, name: string): void => {
  assert.ok(condition, name)
  checks.push(name)
}

try {
  await rm(localStorageRoot, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 50,
  })
  clearLocalProjectMemoryForSmoke()
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateExactEditPreferenceProcessStateForSmoke()

  const context = createContext()
  const project = (await createProjectService(context).createProject({
    workspaceId,
    name: 'Canonical six-hour professional long-form authority',
  })).project
  const planningInputAuthority = await preparePlanningInputAuthority(
    context,
    project.id,
  )
  const sourceFixture = await prepareSourceMediaAuthority(context, project.id)
  const body = createCanonicalPlanBody({
    projectId: project.id,
    planningInputAuthority,
    sourceFixture,
  })
  const seedDraft = createSeedDraft({
    projectId: project.id,
    sourceFixture,
  })
  const planningService = createEditPlanningAuthorityService(context)

  const wrongIdentitySeed = structuredClone(seedDraft)
  wrongIdentitySeed.identity.projectId = 'different-project'
  await expectApiError(
    () => planningService.publishCanonicalPlan({
      ...body,
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'reject-long-form-seed-identity-substitution',
      professionalLongFormSeedDraft: wrongIdentitySeed,
    }),
    'VALIDATION_FAILED',
    'caller_substituted_long_form_identity_is_rejected',
  )

  const wrongSourceSeed = structuredClone(seedDraft)
  wrongSourceSeed.sourceRanges[0]!.sourceSha256 = 'f'.repeat(64)
  await expectApiError(
    () => planningService.publishCanonicalPlan({
      ...body,
      projectId: project.id,
      editSessionId,
      idempotencyKey: 'reject-long-form-source-substitution',
      professionalLongFormSeedDraft: wrongSourceSeed,
    }),
    'VALIDATION_FAILED',
    'caller_substituted_source_content_identity_is_rejected',
  )

  const publishInput = {
    ...body,
    projectId: project.id,
    editSessionId,
    idempotencyKey: 'publish-six-hour-long-form-authority',
    professionalLongFormSeedDraft: seedDraft,
  }
  const published = await planningService.publishCanonicalPlan(publishInput)
  const replayedPublication = await createEditPlanningAuthorityService(context)
    .publishCanonicalPlan(structuredClone(publishInput))
  assert.deepEqual(
    replayedPublication.authority,
    published.authority,
    'Exact publication replay must return the same persisted authority.',
  )
  checks.push('exact_seed_publication_replay_returns_one_canonical_plan')

  const changedSeed = createSeedDraft({
    projectId: project.id,
    sourceFixture,
    runtimeRegion: 'europe-west1',
  })
  await expectApiError(
    () => planningService.publishCanonicalPlan({
      ...publishInput,
      professionalLongFormSeedDraft: changedSeed,
    }),
    'IDEMPOTENCY_CONFLICT',
    'changed_seed_with_reused_idempotency_key_conflicts',
  )

  const publishedAuthority = asRecord(published.authority)
  const publishedPlan = asRecord(publishedAuthority.plan)
  const publishedEstimate = asRecord(publishedAuthority.estimate)
  const publishedWorkItems = publishedAuthority.workItems as Record<string, unknown>[]
  const componentRefs = asRecord(publishedPlan.componentRefs)
  const seedRef = asBlobRef(componentRefs[PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY])
  const persistedSeed = verifyProfessionalLongFormObjectPlanSeed(
    await readPrivateAuthorityJsonBlob({ localStorageRoot, ref: seedRef }),
  )
  check(
    persistedSeed.totalFrames === totalFrames &&
      persistedSeed.sourceRanges.length === PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES &&
      persistedSeed.confirmedOutputFrame.width === 3_840 &&
      persistedSeed.confirmedOutputFrame.height === 2_160 &&
      seedRef.sha256 === sha256AuthorityValue(persistedSeed),
    'maximum_six_hour_4k_seed_is_content_addressed_in_the_canonical_plan',
  )
  check(
    publishedWorkItems.length === 4 &&
      publishedWorkItems.filter((item) =>
        item.workItemKey ===
          CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY).length === 1 &&
      publishedWorkItems.every((item) =>
        (item.approvedToolIds as unknown[]).length === 0),
    'canonical_plan_contains_three_preflights_and_one_unique_tool_free_controller',
  )
  check(
    !publishedWorkItems.some((item) =>
      item.workItemType === 'render_final_export' ||
      item.workItemType === 'run_final_qa'),
    'pre_expansion_plan_contains_no_competing_or_fake_final_export_authority',
  )

  const beforeApproval = await requireAggregate()
  check(
    beforeApproval.jobs.length === 0 &&
      beforeApproval.executionPackages.length === 0 &&
      beforeApproval.approvedWorkItems.length === 0,
    'publication_creates_no_jobs_packages_or_execution_authority',
  )

  const approved = await planningService.approveAndFundCanonicalPlan({
    workspaceId,
    editPlanId: String(publishedPlan.id),
    expectedAuthorityRevision: Number(publishedAuthority.authorityRevision),
    expectedPlanHash: String(publishedPlan.planHash),
    expectedEstimateHash: String(publishedEstimate.estimateHash),
    idempotencyKey: 'approve-six-hour-long-form-authority',
  })
  const approvedAuthority = asRecord(approved.authority)
  const snapshot = asRecord(approvedAuthority.snapshot)
  const approvedJobs = approvedAuthority.jobs as Record<string, unknown>[]
  check(
    asRecord(snapshot.componentRefs)[PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY] !==
      undefined &&
      (snapshot.approvedWorkItemIds as unknown[]).length === 4 &&
      approvedJobs.length === 4,
    'approval_freezes_seed_controller_reservation_and_only_four_parent_jobs',
  )
  const controllerJob = approvedJobs.find((job) =>
    job.workItemKey === CANONICAL_PROFESSIONAL_LONG_FORM_CONTROLLER_WORK_ITEM_KEY)
  check(
    controllerJob?.status === 'ready' &&
      approvedJobs.every((job) => !String(job.id).startsWith('long-form-child-job-')),
    'approval_creates_one_unexecuted_controller_job_and_no_derived_children',
  )

  const loadedAuthority = await createEditPlanningAuthorityService(context)
    .loadApprovedExecutionAuthority(String(snapshot.snapshotId), workspaceId)
  check(
    loadedAuthority.snapshot.snapshotHash === snapshot.snapshotHash &&
      loadedAuthority.workItems.length === 4 &&
      loadedAuthority.jobs.length === 4,
    'server_restart_path_reopens_exact_snapshot_work_items_jobs_and_reservation',
  )

  await expectApiError(
    () => createCanonicalEditExecutionPackageService(context).createPackage({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
      expectedSnapshotHash: String(snapshot.snapshotHash),
      purpose: 'private_internal_execution_handoff',
      idempotencyKey: 'package-must-remain-blocked-before-child-promotion',
    }),
    'JOB_DEPENDENCY_NOT_READY',
    'ordinary_execution_packaging_is_permanently_refused_for_long_form_snapshot',
  )

  const postApprovalService = createCanonicalProfessionalLongFormPostApprovalService(
    context,
  )
  const evidence = await postApprovalService.deriveAndPersist({
    workspaceId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
  })
  check(
    evidence.bridge.expandedGraph.chunkCount ===
      PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS &&
      evidence.childJobManifest.summary.childJobCount === 255 &&
      evidence.childJobManifest.jobs.length === 255 &&
      evidence.childJobManifest.summary.maximumDependencyCount <
        PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
    'maximum_capacity_bridge_derives_124_chunks_and_255_bounded_child_jobs',
  )
  check(
    evidence.childJobManifest.jobs.every((job) =>
      job.parentControllerJobId === String(controllerJob!.id) &&
      job.derivationStatus === 'derived_execution_blocked' &&
      !job.canonicalPackageQueuePersisted &&
      !job.dispatchAuthorized &&
      !job.executionAuthorized),
    'every_child_preserves_parent_lineage_and_remains_unqueued_undispatched_unexecuted',
  )
  check(
    evidence.bridgeRef.byteLength < 4 * 1024 * 1024 &&
      evidence.childJobManifestRef.byteLength < 4 * 1024 * 1024 &&
      evidence.readiness.childJobManifestPersistenceVerified &&
      !evidence.readiness.childPackageQueuePersistenceVerified &&
      !evidence.readiness.dispatchVerified &&
      !evidence.readiness.mediaExecutionVerified &&
      !evidence.readiness.liveGoogleCloudVerified &&
      !evidence.readiness.productReady &&
      !evidence.readiness.productionReady,
    'content_addressed_persistence_is_proven_without_runtime_cloud_or_product_claims',
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  const replayedEvidence = await createCanonicalProfessionalLongFormPostApprovalService(
    context,
  ).deriveAndPersist({
    workspaceId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
  })
  check(
    replayedEvidence.evidenceHash === evidence.evidenceHash &&
      stableAuthorityStringify(replayedEvidence.bridgeRef) ===
        stableAuthorityStringify(evidence.bridgeRef) &&
      stableAuthorityStringify(replayedEvidence.childJobManifestRef) ===
        stableAuthorityStringify(evidence.childJobManifestRef),
    'restart_and_replay_reopen_the_exact_content_addressed_bridge_and_child_manifest',
  )

  const manifestTamper = structuredClone(evidence.childJobManifest)
  manifestTamper.jobs[0]!.jobAuthorityHash = 'f'.repeat(64)
  assert.throws(
    () => verifyProfessionalLongFormDerivedChildJobManifest({
      manifest: manifestTamper,
      bridge: evidence.bridge,
      parentControllerApprovedWorkItemId:
        evidence.childJobManifest.identity.parentControllerApprovedWorkItemId,
      parentControllerJobId:
        evidence.childJobManifest.identity.parentControllerJobId,
    }),
    /failed exact authority verification/i,
  )
  checks.push('changed_child_job_authority_fails_exact_manifest_replay')

  assert.throws(
    () => assertProfessionalLongFormDerivedChildJobsDispatchAuthority({
      manifest: evidence.childJobManifest,
      bridge: evidence.bridge,
      parentControllerApprovedWorkItemId:
        evidence.childJobManifest.identity.parentControllerApprovedWorkItemId,
      parentControllerJobId:
        evidence.childJobManifest.identity.parentControllerJobId,
    }),
    /not package-queue, dispatch, media, cloud, product, or production authority/i,
  )
  checks.push('verified_child_manifest_cannot_self_promote_to_dispatch_authority')

  const aggregateAfterDerivation = await requireAggregate()
  check(
    aggregateAfterDerivation.jobs.length === 4 &&
      aggregateAfterDerivation.executionPackages.length === 0 &&
      aggregateAfterDerivation.jobs.every((job) =>
        !job.id.startsWith('long-form-child-job-')),
    'derived_child_records_do_not_mutate_the_canonical_queue_or_job_aggregate',
  )

  const serializedEvidence = stableAuthorityStringify(evidence)
  check(
    !serializedEvidence.includes('https://') &&
      !serializedEvidence.includes('gs://') &&
      !serializedEvidence.includes('signedUrl') &&
      !serializedEvidence.includes('walletMutation') &&
      !serializedEvidence.includes('customerCreditAmount') &&
      !serializedEvidence.includes('serviceFeeMicros'),
    'persisted_long_form_evidence_contains_no_url_secret_or_customer_commercial_authority',
  )
  check(
    evidence.bridge.binding.plan.request.approvalAndCostBoundary
      .attemptLevelInternalProductionCostEvidenceRequired &&
      !evidence.bridge.binding.plan.request.approvalAndCostBoundary
        .customerCommercialAuthorityIncluded,
    'future_attempt_cost_evidence_is_required_and_separate_from_customer_commercial_authority',
  )

  const promotionService =
    createCanonicalProfessionalLongFormChildPackagePromotionService(context)
  const concurrentPromotions = await Promise.all([
    promotionService.promote({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
    }),
    createCanonicalProfessionalLongFormChildPackagePromotionService(context)
      .promote({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
  ])
  const promotion = concurrentPromotions[0]!
  check(
    concurrentPromotions.filter((item) => item.disposition === 'created').length === 1 &&
      concurrentPromotions.filter((item) =>
        item.disposition === 'exact_replay').length === 1 &&
      concurrentPromotions.every((item) =>
        item.evidenceHash === promotion.evidenceHash &&
        item.queueAggregate.aggregateHash ===
          promotion.queueAggregate.aggregateHash),
    'concurrent_promotion_creates_one_atomic_queue_commit_and_one_exact_replay',
  )
  check(
    promotion.package.summary.childJobCount === 255 &&
      promotion.placementManifest.placements.length === 255 &&
      promotion.queueDefinition.jobs.length === 255 &&
      promotion.queueAggregate.summary.totalJobCount === 255 &&
      promotion.queueAggregate.summary.queuedJobCount === 255 &&
      promotion.queueAggregate.summary.leasedJobCount === 0 &&
      promotion.queueAggregate.summary.completedJobCount === 0 &&
      promotion.queueAggregate.events.length === 1,
    'all_255_children_are_atomically_persisted_once_in_the_canonical_private_queue',
  )
  check(
    promotion.placementManifest.summary.controlPlaneJobCount === 2 &&
      promotion.placementManifest.summary.cpuAnalysisJobCount === 1 &&
      promotion.placementManifest.summary.renderJobCount === 125 &&
      promotion.placementManifest.summary.qaJobCount === 127 &&
      promotion.placementManifest.summary.privatelyExecutableJobCount === 0 &&
      promotion.placementManifest.summary.blockedJobCount === 255,
    'server_frozen_profile_places_every_child_without_granting_execution_readiness',
  )
  check(
    promotion.queueDefinition.source ===
      'canonical_professional_long_form_child_package_promotion' &&
      promotion.queueDefinition.identity.professionalLongFormAuthority
        ?.childJobManifestHash === evidence.childJobManifest.manifestHash &&
      promotion.queueDefinition.jobs.every((job) =>
        !job.privateExecutionReady &&
        job.requiredGate ===
          CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE &&
        job.providerExecutionMode === 'none'),
    'queue_identity_binds_exact_manifest_package_placement_and_permanent_claim_gate',
  )
  check(
    promotion.packageRef.byteLength < 4 * 1024 * 1024 &&
      promotion.placementManifestRef.byteLength < 4 * 1024 * 1024 &&
      promotion.readiness.childPackageQueuePersistenceVerified &&
      !promotion.readiness.childLeaseVerified &&
      !promotion.readiness.childDispatchVerified &&
      !promotion.readiness.childToolOperationBindingVerified &&
      !promotion.readiness.mediaExecutionVerified &&
      !promotion.readiness.liveGoogleCloudVerified &&
      !promotion.readiness.productReady &&
      !promotion.readiness.productionReady,
    'package_and_placement_fit_private_bounds_while_execution_and_live_gates_remain_false',
  )

  const queueScope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
    projectId: String(snapshot.projectId),
    editSessionId,
    packageRecordId: promotion.package.identity.packageRecordId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
  }
  const rootQueueJob = promotion.queueDefinition.jobs.find((job) =>
    job.satisfiedPromotionDependencyJobIds?.length === 1)
  assert.ok(rootQueueJob)
  const blockedClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: promotion.queueDefinition,
    jobId: rootQueueJob.jobId,
    workerIdentity: 'long-form-promotion-smoke-worker',
    workerType: rootQueueJob.workerType,
    now: new Date(Date.parse(String(snapshot.approvedAt)) + 1_000).toISOString(),
    leaseDurationMs: 60_000,
  })
  const queueAfterBlockedClaim = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: promotion.queueDefinition,
  })
  check(
    blockedClaim.disposition === 'capability_blocked' &&
      queueAfterBlockedClaim?.aggregateHash ===
        promotion.queueAggregate.aggregateHash &&
      queueAfterBlockedClaim.summary.totalDeliveryAttemptCount === 0 &&
      queueAfterBlockedClaim.summary.leasedJobCount === 0,
    'claim_attempt_fails_before_lease_attempt_or_queue_mutation',
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayedPromotion =
    await createCanonicalProfessionalLongFormChildPackagePromotionService(context)
      .promote({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      })
  check(
    replayedPromotion.disposition === 'exact_replay' &&
      replayedPromotion.evidenceHash === promotion.evidenceHash &&
      replayedPromotion.packageRef.sha256 === promotion.packageRef.sha256 &&
      replayedPromotion.placementManifestRef.sha256 ===
        promotion.placementManifestRef.sha256 &&
      replayedPromotion.queueAggregate.aggregateHash ===
        promotion.queueAggregate.aggregateHash,
    'restart_reopens_exact_package_placement_and_atomic_queue_commit',
  )

  const queuePath = join(
    localStorageRoot,
    canonicalPrivatePackageWorkQueueAggregateRelativePath(queueScope),
  )
  const originalQueueRecord = await readFile(queuePath, 'utf8')
  const corruptedQueueRecord = JSON.parse(originalQueueRecord) as {
    aggregate: { summary: { queuedJobCount: number } }
  }
  corruptedQueueRecord.aggregate.summary.queuedJobCount -= 1
  await writeFile(queuePath, `${JSON.stringify(corruptedQueueRecord)}\n`, 'utf8')
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await expectApiError(
    () => createCanonicalProfessionalLongFormChildPackagePromotionService(context)
      .promote({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
    'INTERNAL_ERROR',
    'checksum_tampered_queue_commit_fails_closed_after_restart',
  )
  await writeFile(queuePath, originalQueueRecord, 'utf8')
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const restoredPromotion =
    await createCanonicalProfessionalLongFormChildPackagePromotionService(context)
      .promote({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      })
  check(
    restoredPromotion.evidenceHash === promotion.evidenceHash,
    'restored_exact_queue_bytes_replay_without_new_package_or_jobs',
  )

  const currentBeforeExecution = await promotionService.loadCurrent({
    workspaceId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
  })
  const preparedRootAuthority =
    buildProfessionalLongFormFirstChildExecutionAuthority({
      ownerUserId: userId,
      current: currentBeforeExecution,
    })
  const preparedRootAuthorityRef = await putPrivateAuthorityJsonBlob({
    localStorageRoot,
    value: preparedRootAuthority as unknown as Record<string, unknown>,
  })
  const preparedRootAuthorization =
    buildProfessionalLongFormFirstChildAuthorizationReceipt({
      authority: preparedRootAuthority,
      authorityRef: preparedRootAuthorityRef,
    })
  const queueBeforeOrphanAuthorityClaim =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  assert.ok(queueBeforeOrphanAuthorityClaim)
  const orphanAuthorityClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: promotion.queueDefinition,
    jobId: preparedRootAuthority.identity.jobId,
    workerIdentity: 'orphan-authority-must-not-grant-claim',
    workerType: 'api_service',
    now: new Date().toISOString(),
    leaseDurationMs: 60_000,
  })
  const queueAfterOrphanAuthorityClaim =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  check(
    orphanAuthorityClaim.disposition === 'capability_blocked' &&
      queueAfterOrphanAuthorityClaim?.aggregateHash ===
        queueBeforeOrphanAuthorityClaim.aggregateHash &&
      queueAfterOrphanAuthorityClaim.summary.totalDeliveryAttemptCount === 0,
    'content_addressed_authority_blob_alone_grants_no_claim_or_execution_authority',
  )
  const fabricatedPreCommitAuthorization = structuredClone(
    preparedRootAuthorization,
  )
  fabricatedPreCommitAuthorization.expectedOutputIdentity = 'f'.repeat(64)
  const fabricatedPreCommitPayload = {
    ...fabricatedPreCommitAuthorization,
  } as Record<string, unknown>
  delete fabricatedPreCommitPayload.receiptHash
  fabricatedPreCommitAuthorization.receiptHash = sha256AuthorityValue(
    fabricatedPreCommitPayload,
  )
  await expectApiError(
    () => authorizePrivateCanonicalPackageWorkQueueJob({
      scope: queueScope,
      definition: promotion.queueDefinition,
      jobId: preparedRootAuthority.identity.jobId,
      authorization: fabricatedPreCommitAuthorization,
      executionAuthority: preparedRootAuthority,
      now: preparedRootAuthority.authorizedAt,
    }),
    'VALIDATION_FAILED',
    'caller_fabricated_precommit_receipt_cannot_authorize_root_execution',
  )

  const queueBeforeExpiredReservationAttempt =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  assert.ok(queueBeforeExpiredReservationAttempt)
  const originalDateNow = Date.now
  try {
    Date.now = () =>
      Date.parse(preparedRootAuthority.approval.reservationExpiresAt) + 1
    await expectApiError(
      () => createCanonicalProfessionalLongFormFirstChildExecutionService(context)
        .authorizeAndExecute({
          workspaceId,
          approvedPlanSnapshotId: String(snapshot.snapshotId),
        }),
      'CREDITS_NOT_RESERVED',
      'expired_reservation_cannot_publish_root_queue_authorization',
    )
  } finally {
    Date.now = originalDateNow
  }
  const queueAfterExpiredReservationAttempt =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  const rootAfterExpiredReservationAttempt =
    queueAfterExpiredReservationAttempt?.entries.find((entry) =>
      entry.definition.jobId === preparedRootAuthority.identity.jobId)
  check(
    queueAfterExpiredReservationAttempt?.aggregateHash ===
      queueBeforeExpiredReservationAttempt.aggregateHash &&
      !rootAfterExpiredReservationAttempt
        ?.professionalLongFormExecutionAuthorization &&
      queueAfterExpiredReservationAttempt.events.every((event) =>
        event.eventType !== 'job_execution_authorized'),
    'expired_reservation_refusal_leaves_queue_events_and_root_entry_unchanged',
  )

  const firstChildExecutionService =
    createCanonicalProfessionalLongFormFirstChildExecutionService(context)
  const concurrentFirstChildRuns = await Promise.all([
    firstChildExecutionService.authorizeAndExecute({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
    }),
    createCanonicalProfessionalLongFormFirstChildExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
  ])
  const completedFirstChild = concurrentFirstChildRuns.find((item) =>
    item.disposition === 'completed')
  assert.ok(completedFirstChild)
  check(
    concurrentFirstChildRuns.filter((item) =>
      item.disposition === 'completed').length === 1 &&
      concurrentFirstChildRuns.every((item) =>
        ['completed', 'already_in_progress', 'exact_replay'].includes(
          item.disposition,
        )),
    'concurrent_first_child_calls_consume_one_lease_and_one_execution_attempt',
  )
  assert.ok(completedFirstChild.executionAttempt)
  assert.ok(completedFirstChild.validationArtifact)
  assert.ok(completedFirstChild.validationArtifactRef)
  assert.ok(completedFirstChild.qaEvidence)
  assert.ok(completedFirstChild.qaEvidenceRef)
  assert.ok(completedFirstChild.reconciliationEvidence)
  assert.ok(completedFirstChild.reconciliationEvidenceRef)
  assert.ok(completedFirstChild.attemptInternalCostEvidence)
  assert.ok(completedFirstChild.terminalEvidence)
  assert.ok(completedFirstChild.terminalEvidenceRef)
  const firstChildAttempt = completedFirstChild.executionAttempt
  const firstChildArtifact = completedFirstChild.validationArtifact
  const firstChildArtifactRef = completedFirstChild.validationArtifactRef
  const firstChildQa = completedFirstChild.qaEvidence
  const firstChildQaRef = completedFirstChild.qaEvidenceRef
  const firstChildReconciliation = completedFirstChild.reconciliationEvidence
  const firstChildReconciliationRef =
    completedFirstChild.reconciliationEvidenceRef
  const firstChildCost = completedFirstChild.attemptInternalCostEvidence
  const firstChildTerminal = completedFirstChild.terminalEvidence
  const firstChildTerminalRef = completedFirstChild.terminalEvidenceRef
  const completedQueue = completedFirstChild.queueAggregate
  const completedRoot = completedQueue.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID)
  const downstreamSourceAuthority = completedQueue.entries.find((entry) =>
    entry.definition.approvedWorkItemId === 'long-form-validate-private-sources')
  check(
    completedQueue.summary.totalJobCount === 255 &&
      completedQueue.summary.completedJobCount === 1 &&
      completedQueue.summary.queuedJobCount === 254 &&
      completedQueue.summary.leasedJobCount === 0 &&
      completedQueue.summary.totalDeliveryAttemptCount === 1 &&
      completedRoot?.state === 'completed' &&
      completedRoot.deliveryAttemptCount === 1 &&
      completedRoot.professionalLongFormExecutionAuthorization
        ?.authorityHash === completedFirstChild.authority.authorityHash &&
      completedRoot.professionalLongFormExecutionAttempt?.executionAttemptId ===
        firstChildAttempt.executionAttemptId &&
      completedQueue.events.filter((event) =>
        event.eventType === 'job_execution_authorized').length === 1 &&
      completedQueue.events.filter((event) =>
        event.eventType === 'job_execution_started').length === 1 &&
      completedQueue.events.filter((event) =>
        event.eventType === 'job_completed').length === 1,
    'root_authorization_claim_one_use_start_and_terminal_completion_are_one_queue_lineage',
  )
  check(
    firstChildArtifact.valid &&
      firstChildQa.outcome === 'passed' &&
      firstChildReconciliation.downstream.jobId ===
        downstreamSourceAuthority?.definition.jobId &&
      firstChildReconciliation.downstream
        .dependencySatisfiedByThisCompletion &&
      !firstChildReconciliation.downstream.executionAuthorized &&
      firstChildReconciliation.downstream.capabilityBlocked &&
      firstChildTerminal.outcome === 'completed_private_test' &&
      firstChildTerminal.permissions.downstreamDependencyEvidenceCreated &&
      !firstChildTerminal.permissions.downstreamExecutionAuthorized &&
      completedFirstChild.readiness.rootValidationArtifactVerified &&
      completedFirstChild.readiness.rootQaVerified &&
      completedFirstChild.readiness.rootReconciliationVerified &&
      completedFirstChild.readiness.downstreamDependencySatisfied,
    'private_validation_artifact_qa_reconciliation_and_downstream_dependency_evidence_pass',
  )
  check(
    firstChildCost.boundary === 'internal_production_cost_only' &&
      firstChildCost.identity.toolId === 'reeditpro_internal' &&
      firstChildCost.identity.operationId ===
        PROFESSIONAL_LONG_FORM_FIRST_CHILD_OPERATION_ID &&
      firstChildCost.identity.workloadProfileId ===
        PROFESSIONAL_LONG_FORM_FIRST_CHILD_COST_PROFILE_ID &&
      firstChildCost.identity.executionAttemptId ===
        firstChildAttempt.executionAttemptId &&
      firstChildCost.resourceUsage.vcpuCount === 2 &&
      firstChildCost.resourceUsage.memoryGib === 4 &&
      firstChildCost.resourceUsage.gpuCount === 0 &&
      Number.isSafeInteger(firstChildCost.actualInternalCostMicros) &&
      firstChildCost.actualInternalCostMicros >= 0 &&
      firstChildTerminal.attemptInternalCostEvidenceHash ===
        firstChildCost.evidenceHash,
    'attempt_internal_production_cost_is_versioned_metered_and_separate_from_customer_commercial_authority',
  )
  const serializedFirstChild = stableAuthorityStringify(completedFirstChild)
  check(
    !serializedFirstChild.includes('https://') &&
      !serializedFirstChild.includes('gs://') &&
      !serializedFirstChild.includes('"claimCredential":') &&
      !serializedFirstChild.includes('customerPriceMicros') &&
      !serializedFirstChild.includes('customerCreditAmount') &&
      !serializedFirstChild.includes('serviceFeeMicros') &&
      !serializedFirstChild.includes('walletBalance') &&
      !serializedFirstChild.includes('providerRequest') &&
      !completedFirstChild.readiness.sourceMediaExecutionVerified &&
      !completedFirstChild.readiness.chunkRenderExecutionVerified &&
      !completedFirstChild.readiness.liveGoogleCloudVerified &&
      !completedFirstChild.readiness.productReady &&
      !completedFirstChild.readiness.productionReady,
    'root_execution_contains_no_secret_provider_media_render_customer_or_live_cloud_authority',
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayedFirstChild =
    await createCanonicalProfessionalLongFormFirstChildExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      })
  check(
    replayedFirstChild.disposition === 'exact_replay' &&
      replayedFirstChild.evidenceHash === completedFirstChild.evidenceHash &&
      replayedFirstChild.queueAggregate.aggregateHash ===
        completedQueue.aggregateHash &&
      replayedFirstChild.executionAttempt?.executionAttemptId ===
        firstChildAttempt.executionAttemptId &&
      replayedFirstChild.validationArtifactRef?.sha256 ===
        firstChildArtifactRef.sha256 &&
      replayedFirstChild.qaEvidenceRef?.sha256 === firstChildQaRef.sha256 &&
      replayedFirstChild.reconciliationEvidenceRef?.sha256 ===
        firstChildReconciliationRef.sha256 &&
      replayedFirstChild.terminalEvidenceRef?.sha256 ===
        firstChildTerminalRef.sha256 &&
      replayedFirstChild.attemptInternalCostEvidence?.evidenceHash ===
        firstChildCost.evidenceHash,
    'restart_replay_reopens_terminal_refs_cost_and_queue_without_reexecution',
  )

  const fabricatedAuthorization = structuredClone(
    completedFirstChild.authorization,
  )
  fabricatedAuthorization.authorityHash = 'e'.repeat(64)
  const fabricatedAuthorizationPayload = {
    ...fabricatedAuthorization,
  } as Record<string, unknown>
  delete fabricatedAuthorizationPayload.receiptHash
  fabricatedAuthorization.receiptHash = sha256AuthorityValue(
    fabricatedAuthorizationPayload,
  )
  await expectApiError(
    () => authorizePrivateCanonicalPackageWorkQueueJob({
      scope: queueScope,
      definition: promotion.queueDefinition,
      jobId: completedFirstChild.authority.identity.jobId,
      authorization: fabricatedAuthorization,
      executionAuthority: completedFirstChild.authority,
      now: new Date().toISOString(),
    }),
    'VALIDATION_FAILED',
    'fabricated_changed_root_authorization_is_rejected_after_commit',
  )

  assert.ok(downstreamSourceAuthority)
  const queueBeforeDownstreamClaim = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: promotion.queueDefinition,
  })
  assert.ok(queueBeforeDownstreamClaim)
  const downstreamClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: promotion.queueDefinition,
    jobId: downstreamSourceAuthority.definition.jobId,
    workerIdentity: 'long-form-source-authority-must-remain-blocked',
    workerType: downstreamSourceAuthority.definition.workerType,
    now: new Date().toISOString(),
    leaseDurationMs: 60_000,
  })
  const queueAfterDownstreamClaim = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: promotion.queueDefinition,
  })
  check(
    downstreamClaim.disposition === 'capability_blocked' &&
      queueAfterDownstreamClaim?.aggregateHash ===
        queueBeforeDownstreamClaim.aggregateHash &&
      downstreamSourceAuthority.definition.dependencyJobIds.includes(
        completedFirstChild.authority.identity.jobId,
      ) &&
      downstreamSourceAuthority.deliveryAttemptCount === 0 &&
      !downstreamSourceAuthority.professionalLongFormExecutionAuthorization &&
      !downstreamSourceAuthority.professionalLongFormExecutionAttempt,
    'root_dependency_is_satisfied_but_source_authority_child_remains_capability_blocked_without_attempt',
  )

  const artifactTamper = structuredClone(firstChildArtifact)
  artifactTamper.artifactHash = 'd'.repeat(64)
  assert.throws(
    () => assertProfessionalLongFormFirstChildValidationArtifact({
      value: artifactTamper,
      authority: completedFirstChild.authority,
      authorization: completedFirstChild.authorization,
      executionAttempt: firstChildAttempt,
    }),
    /artifactHash is invalid/i,
  )
  const qaTamper = structuredClone(firstChildQa)
  qaTamper.qaHash = 'c'.repeat(64)
  assert.throws(
    () => assertProfessionalLongFormFirstChildQaEvidence({
      value: qaTamper,
      authority: completedFirstChild.authority,
      authorization: completedFirstChild.authorization,
      executionAttempt: firstChildAttempt,
      validationArtifact: firstChildArtifact,
      validationArtifactRef: firstChildArtifactRef,
    }),
    /qaHash is invalid/i,
  )
  const reconciliationTamper = structuredClone(firstChildReconciliation)
  reconciliationTamper.reconciliationHash = 'b'.repeat(64)
  assert.throws(
    () => assertProfessionalLongFormFirstChildReconciliationEvidence({
      value: reconciliationTamper,
      authority: completedFirstChild.authority,
      authorization: completedFirstChild.authorization,
      executionAttempt: firstChildAttempt,
      validationArtifactRef: firstChildArtifactRef,
      qaEvidence: firstChildQa,
      qaEvidenceRef: firstChildQaRef,
    }),
    /reconciliationHash is invalid/i,
  )
  const terminalTamper = structuredClone(firstChildTerminal)
  terminalTamper.terminalHash = 'a'.repeat(64)
  assert.throws(
    () => assertProfessionalLongFormFirstChildTerminalEvidence({
      value: terminalTamper,
      authority: completedFirstChild.authority,
      authorization: completedFirstChild.authorization,
      executionAttempt: firstChildAttempt,
      canonicalResultHash: firstChildTerminal.canonicalResultHash,
      attemptInternalCostEvidenceHash: firstChildCost.evidenceHash,
    }),
    /terminalHash is invalid/i,
  )
  check(
    !privateInternalAttemptCostEvidenceSchema.safeParse({
      ...firstChildCost,
      boundary: 'customer_price_authority',
    }).success,
    'artifact_qa_reconciliation_terminal_and_cost_boundary_tampering_fail_closed',
  )

  const validationBlobPath = join(
    localStorageRoot,
    'edit-authority',
    'blobs',
    'sha256',
    firstChildArtifactRef.sha256.slice(0, 2),
    `${firstChildArtifactRef.sha256}.json`,
  )
  const originalValidationBlobRecord = await readFile(validationBlobPath, 'utf8')
  const corruptedValidationBlobRecord = JSON.parse(
    originalValidationBlobRecord,
  ) as { value: { valid: boolean } }
  corruptedValidationBlobRecord.value.valid = false
  await writeFile(
    validationBlobPath,
    `${JSON.stringify(corruptedValidationBlobRecord)}\n`,
    'utf8',
  )
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await expectApiError(
    () => createCanonicalProfessionalLongFormFirstChildExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
    'VALIDATION_FAILED',
    'content_addressed_root_validation_artifact_tamper_fails_closed_after_restart',
  )
  await writeFile(validationBlobPath, originalValidationBlobRecord, 'utf8')
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayAfterValidationBlobRestore =
    await createCanonicalProfessionalLongFormFirstChildExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      })
  check(
    replayAfterValidationBlobRestore.disposition === 'exact_replay' &&
      replayAfterValidationBlobRestore.evidenceHash ===
        completedFirstChild.evidenceHash &&
      replayAfterValidationBlobRestore.validationArtifactRef?.sha256 ===
        firstChildArtifactRef.sha256,
    'restored_exact_root_validation_artifact_replays_without_reexecution',
  )

  const queueBeforeExpiredSourceAuthorization =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  assert.ok(queueBeforeExpiredSourceAuthorization)
  const originalDateNowForSource = Date.now
  try {
    Date.now = () =>
      Date.parse(preparedRootAuthority.approval.reservationExpiresAt) + 1
    await expectApiError(
      () => createCanonicalProfessionalLongFormSourceAuthorityExecutionService(
        context,
      ).authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
      'CREDITS_NOT_RESERVED',
      'expired_reservation_cannot_publish_source_authority_queue_authorization',
    )
  } finally {
    Date.now = originalDateNowForSource
  }
  const queueAfterExpiredSourceAuthorization =
    await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: promotion.queueDefinition,
    })
  const sourceAfterExpiredAuthorization =
    queueAfterExpiredSourceAuthorization?.entries.find((entry) =>
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  check(
    queueAfterExpiredSourceAuthorization?.aggregateHash ===
      queueBeforeExpiredSourceAuthorization.aggregateHash &&
      !sourceAfterExpiredAuthorization
        ?.professionalLongFormExecutionAuthorization &&
      queueAfterExpiredSourceAuthorization.events.filter((event) =>
        event.eventType === 'job_execution_authorized' &&
        event.jobId === sourceAfterExpiredAuthorization?.definition.jobId)
        .length === 0,
    'expired_source_authority_refusal_leaves_queue_entry_and_events_unchanged',
  )

  const concurrentSourceAuthorityRuns = await Promise.all([
    createCanonicalProfessionalLongFormSourceAuthorityExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
    createCanonicalProfessionalLongFormSourceAuthorityExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
  ])
  const completedSourceAuthority = concurrentSourceAuthorityRuns.find((item) =>
    item.disposition === 'completed')
  assert.ok(completedSourceAuthority)
  check(
    concurrentSourceAuthorityRuns.filter((item) =>
      item.disposition === 'completed').length === 1 &&
      concurrentSourceAuthorityRuns.every((item) =>
        ['completed', 'already_in_progress', 'exact_replay'].includes(
          item.disposition,
        )),
    'concurrent_source_authority_calls_consume_one_lease_and_one_execution_attempt',
  )
  assert.ok(completedSourceAuthority.executionAttempt)
  assert.ok(completedSourceAuthority.validationArtifact)
  assert.ok(completedSourceAuthority.validationArtifactRef)
  assert.ok(completedSourceAuthority.qaEvidence)
  assert.ok(completedSourceAuthority.qaEvidenceRef)
  assert.ok(completedSourceAuthority.reconciliationEvidence)
  assert.ok(completedSourceAuthority.reconciliationEvidenceRef)
  assert.ok(completedSourceAuthority.attemptInternalCostEvidence)
  assert.ok(completedSourceAuthority.terminalEvidence)
  assert.ok(completedSourceAuthority.terminalEvidenceRef)
  const sourceAttempt = completedSourceAuthority.executionAttempt
  const sourceArtifact = completedSourceAuthority.validationArtifact
  const sourceArtifactRef = completedSourceAuthority.validationArtifactRef
  const sourceQa = completedSourceAuthority.qaEvidence
  const sourceQaRef = completedSourceAuthority.qaEvidenceRef
  const sourceReconciliation = completedSourceAuthority.reconciliationEvidence
  const sourceReconciliationRef =
    completedSourceAuthority.reconciliationEvidenceRef
  const sourceCost = completedSourceAuthority.attemptInternalCostEvidence
  const sourceTerminal = completedSourceAuthority.terminalEvidence
  const sourceTerminalRef = completedSourceAuthority.terminalEvidenceRef
  const sourceCompletedQueue = completedSourceAuthority.queueAggregate
  const completedSourceEntry = sourceCompletedQueue.entries.find((entry) =>
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
  check(
    sourceCompletedQueue.summary.totalJobCount === 255 &&
      sourceCompletedQueue.summary.completedJobCount === 2 &&
      sourceCompletedQueue.summary.queuedJobCount === 253 &&
      sourceCompletedQueue.summary.leasedJobCount === 0 &&
      sourceCompletedQueue.summary.totalDeliveryAttemptCount === 2 &&
      completedSourceEntry?.state === 'completed' &&
      completedSourceEntry.deliveryAttemptCount === 1 &&
      sourceCompletedQueue.events.filter((event) =>
        event.eventType === 'job_execution_authorized').length === 2 &&
      sourceCompletedQueue.events.filter((event) =>
        event.eventType === 'job_execution_started').length === 2 &&
      sourceCompletedQueue.events.filter((event) =>
        event.eventType === 'job_completed').length === 2,
    'root_and_source_children_form_two_exact_terminal_queue_lineages',
  )
  check(
    sourceArtifact.valid &&
      sourceArtifact.sourceCoverage.sourceRangeCount ===
        PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES &&
      sourceArtifact.sourceCoverage.approvedBindingCount === sourceCount &&
      sourceArtifact.sourceCoverage.requiredBindingCount === sourceCount &&
      sourceArtifact.sourceCoverage.referencedBindingCount === sourceCount &&
      sourceArtifact.sourceCoverage.localPrivateBindingCount === sourceCount &&
      sourceArtifact.sourceCoverage.googleCloudStorageBindingCount === 0 &&
      sourceArtifact.sourceCoverage.exactGenerationRangeCount ===
        PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES &&
      sourceArtifact.sourceCoverage.totalFrames === totalFrames &&
      sourceArtifact.hashes.sourceRangesHash ===
        completedSourceAuthority.authority.identity.expectedOutputIdentity &&
      sourceArtifact.readinessTruth.canonicalLoaderSourceAuthorityRevalidated &&
      !sourceArtifact.readinessTruth.runnerDirectSourceBytesRead &&
      !sourceArtifact.readinessTruth.mediaDecoded &&
      !sourceArtifact.readinessTruth.sourceObjectResidencyVerified &&
      !sourceArtifact.readinessTruth.sourceFrameCapacityVerified &&
      !sourceArtifact.readinessTruth.sourceTransformed &&
      !sourceArtifact.readinessTruth.rendered,
    'all_512_ranges_match_approved_bindings_cleanup_segments_and_gap_free_timeline_without_media_decode',
  )
  check(
    sourceQa.outcome === 'passed' &&
      sourceReconciliation.summary.directDownstreamCount ===
        PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS + 1 &&
      sourceReconciliation.summary.renderJobCount ===
        PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS &&
      sourceReconciliation.summary.continuousAudioJobCount === 1 &&
      sourceReconciliation.summary.remainingQueueJobCountAfterCompletion ===
        253 &&
      sourceReconciliation.directDownstream.every((entry) =>
        entry.sourceDependencySatisfiedByThisCompletion &&
        !entry.executionAuthorized && entry.capabilityBlocked) &&
      sourceTerminal.permissions.structuredSourceAuthorityValidated &&
      sourceTerminal.permissions
        .directDownstreamDependencyEvidenceCreated &&
      !sourceTerminal.permissions.downstreamExecutionAuthorized &&
      !sourceTerminal.permissions.sourceMediaDecodeOrTransformAuthorized,
    'source_qa_and_reconciliation_record_124_render_and_one_audio_dependency_without_execution_authority',
  )
  check(
    sourceCost.boundary === 'internal_production_cost_only' &&
      sourceCost.identity.toolId === 'reeditpro_internal' &&
      sourceCost.identity.operationId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_OPERATION_ID &&
      sourceCost.identity.workloadProfileId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_COST_PROFILE_ID &&
      sourceCost.identity.executionAttemptId === sourceAttempt.executionAttemptId &&
      sourceCost.resourceUsage.vcpuCount === 2 &&
      sourceCost.resourceUsage.memoryGib === 4 &&
      sourceCost.resourceUsage.gpuCount === 0 &&
      Number.isSafeInteger(sourceCost.actualInternalCostMicros) &&
      sourceCost.actualInternalCostMicros >= 0 &&
      sourceTerminal.attemptInternalCostEvidenceHash === sourceCost.evidenceHash,
    'source_attempt_internal_production_cost_is_versioned_metered_and_noncommercial',
  )
  const serializedSourceAuthority = stableAuthorityStringify(
    completedSourceAuthority,
  )
  check(
    !serializedSourceAuthority.includes('https://') &&
      !serializedSourceAuthority.includes('gs://') &&
      !serializedSourceAuthority.includes('"claimCredential":') &&
      !serializedSourceAuthority.includes('customerPriceMicros') &&
      !serializedSourceAuthority.includes('customerCreditAmount') &&
      !serializedSourceAuthority.includes('serviceFeeMicros') &&
      !serializedSourceAuthority.includes('walletBalance') &&
      !serializedSourceAuthority.includes('providerRequest') &&
      !completedSourceAuthority.readiness.sourceAuthorityRunnerDirectByteRead &&
      !completedSourceAuthority.readiness
        .sourceAuthorityRunnerMediaDecodeOrTransform &&
      !completedSourceAuthority.readiness.liveGoogleCloudVerified &&
      !completedSourceAuthority.readiness.productReady &&
      !completedSourceAuthority.readiness.productionReady,
    'source_execution_contains_no_secret_provider_decode_render_customer_or_live_cloud_authority',
  )

  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayedSourceAuthority =
    await createCanonicalProfessionalLongFormSourceAuthorityExecutionService(
      context,
    ).authorizeAndExecute({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
    })
  check(
    replayedSourceAuthority.disposition === 'exact_replay' &&
      replayedSourceAuthority.evidenceHash ===
        completedSourceAuthority.evidenceHash &&
      replayedSourceAuthority.queueAggregate.aggregateHash ===
        sourceCompletedQueue.aggregateHash &&
      replayedSourceAuthority.executionAttempt?.executionAttemptId ===
        sourceAttempt.executionAttemptId &&
      replayedSourceAuthority.validationArtifactRef?.sha256 ===
        sourceArtifactRef.sha256 &&
      replayedSourceAuthority.qaEvidenceRef?.sha256 === sourceQaRef.sha256 &&
      replayedSourceAuthority.reconciliationEvidenceRef?.sha256 ===
        sourceReconciliationRef.sha256 &&
      replayedSourceAuthority.terminalEvidenceRef?.sha256 ===
        sourceTerminalRef.sha256 &&
      replayedSourceAuthority.attemptInternalCostEvidence?.evidenceHash ===
        sourceCost.evidenceHash,
    'source_restart_replay_reopens_exact_terminal_refs_cost_and_queue_without_reexecution',
  )

  const rootReplayAfterSourceCompletion =
    await createCanonicalProfessionalLongFormFirstChildExecutionService(context)
      .authorizeAndExecute({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      })
  check(
    rootReplayAfterSourceCompletion.disposition === 'exact_replay' &&
      rootReplayAfterSourceCompletion.queueAggregate.summary.completedJobCount ===
        2 &&
      rootReplayAfterSourceCompletion.readiness
        .downstreamCurrentlyAuthorizedOrCompleted &&
      rootReplayAfterSourceCompletion.readiness.remainingChildJobCount === 253 &&
      rootReplayAfterSourceCompletion.executionAttempt?.executionAttemptId ===
        firstChildAttempt.executionAttemptId &&
      rootReplayAfterSourceCompletion.validationArtifactRef?.sha256 ===
        firstChildArtifactRef.sha256 &&
      rootReplayAfterSourceCompletion.qaEvidenceRef?.sha256 ===
        firstChildQaRef.sha256 &&
      rootReplayAfterSourceCompletion.reconciliationEvidenceRef?.sha256 ===
        firstChildReconciliationRef.sha256 &&
      rootReplayAfterSourceCompletion.terminalEvidenceRef?.sha256 ===
        firstChildTerminalRef.sha256 &&
      rootReplayAfterSourceCompletion.attemptInternalCostEvidence?.evidenceHash ===
        firstChildCost.evidenceHash,
    'root_restart_replay_preserves_immutable_root_evidence_after_source_queue_progress',
  )

  const sourceCurrentAfterCompletion = await promotionService.loadCurrent({
    workspaceId,
    approvedPlanSnapshotId: String(snapshot.snapshotId),
  })
  const kindByChildWorkItemId = new Map(
    sourceCurrentAfterCompletion.postApproval.childJobManifest.jobs.map((job) =>
      [job.childWorkItemId, job.kind]),
  )
  const renderEntry = sourceCompletedQueue.entries.find((entry) =>
    kindByChildWorkItemId.get(entry.definition.approvedWorkItemId) ===
      'render_object_mezzanine_chunk')
  const audioEntry = sourceCompletedQueue.entries.find((entry) =>
    kindByChildWorkItemId.get(entry.definition.approvedWorkItemId) ===
      'mix_continuous_program_audio')
  assert.ok(renderEntry)
  assert.ok(audioEntry)
  const queueBeforeMediaClaims = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: promotion.queueDefinition,
  })
  assert.ok(queueBeforeMediaClaims)
  const blockedRenderClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: promotion.queueDefinition,
    jobId: renderEntry.definition.jobId,
    workerIdentity: 'source-completion-must-not-authorize-render',
    workerType: renderEntry.definition.workerType,
    now: new Date().toISOString(),
    leaseDurationMs: 60_000,
  })
  const blockedAudioClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: promotion.queueDefinition,
    jobId: audioEntry.definition.jobId,
    workerIdentity: 'source-completion-must-not-authorize-audio',
    workerType: audioEntry.definition.workerType,
    now: new Date().toISOString(),
    leaseDurationMs: 60_000,
  })
  const queueAfterMediaClaims = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: promotion.queueDefinition,
  })
  check(
    blockedRenderClaim.disposition === 'capability_blocked' &&
      blockedAudioClaim.disposition === 'capability_blocked' &&
      queueAfterMediaClaims?.aggregateHash === queueBeforeMediaClaims.aggregateHash &&
      queueAfterMediaClaims.summary.completedJobCount === 2 &&
      queueAfterMediaClaims.summary.totalDeliveryAttemptCount === 2,
    'source_completion_does_not_authorize_render_or_audio_claims_or_mutate_queue',
  )

  const sourceArtifactTamper = structuredClone(sourceArtifact)
  sourceArtifactTamper.sourceCoverage.sourceRangeCount -= 1
  const sourceArtifactTamperPayload = {
    ...sourceArtifactTamper,
  } as Record<string, unknown>
  delete sourceArtifactTamperPayload.artifactHash
  sourceArtifactTamper.artifactHash = sha256AuthorityValue(
    sourceArtifactTamperPayload,
  )
  assert.throws(
    () => assertProfessionalLongFormSourceAuthorityValidationArtifact({
      value: sourceArtifactTamper,
      current: sourceCurrentAfterCompletion,
      authority: completedSourceAuthority.authority,
      authorization: completedSourceAuthority.authorization,
      executionAttempt: sourceAttempt,
    }),
    /failed exact replay|coverage counts are inconsistent/i,
  )
  const sourceQaTamper = structuredClone(sourceQa)
  sourceQaTamper.checks.frameExactTimelineCoverage = 'passed'
  sourceQaTamper.validationArtifactHash = 'f'.repeat(64)
  const sourceQaTamperPayload = { ...sourceQaTamper } as Record<string, unknown>
  delete sourceQaTamperPayload.qaHash
  sourceQaTamper.qaHash = sha256AuthorityValue(sourceQaTamperPayload)
  assert.throws(
    () => assertProfessionalLongFormSourceAuthorityQaEvidence({
      value: sourceQaTamper,
      authority: completedSourceAuthority.authority,
      authorization: completedSourceAuthority.authorization,
      executionAttempt: sourceAttempt,
      validationArtifact: sourceArtifact,
      validationArtifactRef: sourceArtifactRef,
    }),
    /failed exact replay/i,
  )
  const sourceReconciliationTamper = structuredClone(sourceReconciliation)
  sourceReconciliationTamper.directDownstream[0]!.jobId =
    'fabricated-direct-downstream-job'
  sourceReconciliationTamper.summary.directDownstreamHash =
    sha256AuthorityValue(sourceReconciliationTamper.directDownstream)
  const sourceReconciliationTamperPayload = {
    ...sourceReconciliationTamper,
  } as Record<string, unknown>
  delete sourceReconciliationTamperPayload.reconciliationHash
  sourceReconciliationTamper.reconciliationHash = sha256AuthorityValue(
    sourceReconciliationTamperPayload,
  )
  assert.throws(
    () => assertProfessionalLongFormSourceAuthorityReconciliationEvidence({
      value: sourceReconciliationTamper,
      current: sourceCurrentAfterCompletion,
      authority: completedSourceAuthority.authority,
      authorization: completedSourceAuthority.authorization,
      executionAttempt: sourceAttempt,
      validationArtifactRef: sourceArtifactRef,
      qaEvidence: sourceQa,
      qaEvidenceRef: sourceQaRef,
    }),
    /failed exact replay/i,
  )
  const sourceTerminalTamper = structuredClone(sourceTerminal)
  sourceTerminalTamper.canonicalResultHash = 'e'.repeat(64)
  const sourceTerminalTamperPayload = {
    ...sourceTerminalTamper,
  } as Record<string, unknown>
  delete sourceTerminalTamperPayload.terminalHash
  sourceTerminalTamper.terminalHash = sha256AuthorityValue(
    sourceTerminalTamperPayload,
  )
  assert.throws(
    () => assertProfessionalLongFormSourceAuthorityTerminalEvidence({
      value: sourceTerminalTamper,
      authority: completedSourceAuthority.authority,
      authorization: completedSourceAuthority.authorization,
      executionAttempt: sourceAttempt,
      validationArtifactRef: sourceArtifactRef,
      qaEvidenceRef: sourceQaRef,
      reconciliationEvidenceRef: sourceReconciliationRef,
      canonicalResultHash: sourceTerminal.canonicalResultHash,
      attemptInternalCostEvidenceHash: sourceCost.evidenceHash,
    }),
    /failed exact replay/i,
  )
  check(
    !privateInternalAttemptCostEvidenceSchema.safeParse({
      ...sourceCost,
      boundary: 'customer_price_authority',
    }).success,
    'source_artifact_qa_reconciliation_terminal_and_cost_tampering_fail_closed',
  )

  const sourceValidationBlobPath = join(
    localStorageRoot,
    'edit-authority',
    'blobs',
    'sha256',
    sourceArtifactRef.sha256.slice(0, 2),
    `${sourceArtifactRef.sha256}.json`,
  )
  const originalSourceValidationBlobRecord = await readFile(
    sourceValidationBlobPath,
    'utf8',
  )
  const corruptedSourceValidationBlobRecord = JSON.parse(
    originalSourceValidationBlobRecord,
  ) as { value: { valid: boolean } }
  corruptedSourceValidationBlobRecord.value.valid = false
  await writeFile(
    sourceValidationBlobPath,
    `${JSON.stringify(corruptedSourceValidationBlobRecord)}\n`,
    'utf8',
  )
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await expectApiError(
    () => createCanonicalProfessionalLongFormSourceAuthorityExecutionService(
      context,
    ).authorizeAndExecute({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
    }),
    'VALIDATION_FAILED',
    'content_addressed_source_validation_artifact_tamper_fails_closed_after_restart',
  )
  await writeFile(
    sourceValidationBlobPath,
    originalSourceValidationBlobRecord,
    'utf8',
  )
  clearPrivateEditAuthorityProcessStateForSmoke()
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const replayAfterSourceValidationBlobRestore =
    await createCanonicalProfessionalLongFormSourceAuthorityExecutionService(
      context,
    ).authorizeAndExecute({
      workspaceId,
      approvedPlanSnapshotId: String(snapshot.snapshotId),
    })
  check(
    replayAfterSourceValidationBlobRestore.disposition === 'exact_replay' &&
      replayAfterSourceValidationBlobRestore.validationArtifactRef?.sha256 ===
        sourceArtifactRef.sha256 &&
      replayAfterSourceValidationBlobRestore.attemptInternalCostEvidence
        ?.evidenceHash === sourceCost.evidenceHash &&
      replayAfterSourceValidationBlobRestore.queueAggregate.summary
        .completedJobCount === 2,
    'restored_exact_source_validation_artifact_replays_without_reexecution',
  )

  await assertNoActivationImports()

  const childBlobPath = join(
    localStorageRoot,
    'edit-authority',
    'blobs',
    'sha256',
    evidence.childJobManifestRef.sha256.slice(0, 2),
    `${evidence.childJobManifestRef.sha256}.json`,
  )
  const childBlobRecord = JSON.parse(await readFile(childBlobPath, 'utf8')) as {
    value: { summary: { childJobCount: number } }
  }
  childBlobRecord.value.summary.childJobCount -= 1
  await writeFile(childBlobPath, `${JSON.stringify(childBlobRecord)}\n`, 'utf8')
  clearPrivateEditAuthorityProcessStateForSmoke()
  await expectApiError(
    () => createCanonicalProfessionalLongFormPostApprovalService(context)
      .deriveAndPersist({
        workspaceId,
        approvedPlanSnapshotId: String(snapshot.snapshotId),
      }),
    'VALIDATION_FAILED',
    'content_addressed_child_manifest_tamper_fails_closed_after_restart',
  )

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: 'canonical-professional-long-form-post-approval-smoke-v4',
    checkCount: checks.length,
    checks,
    evidence: {
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      planSeedSha256: seedRef.sha256,
      durationSeconds: PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
      sourceRangeCount: persistedSeed.sourceRanges.length,
      chunkCount: evidence.bridge.expandedGraph.chunkCount,
      childJobCount: evidence.childJobManifest.summary.childJobCount,
      maximumDependencyCount:
        evidence.childJobManifest.summary.maximumDependencyCount,
      bridgeByteLength: evidence.bridgeRef.byteLength,
      childManifestByteLength: evidence.childJobManifestRef.byteLength,
      childPackageByteLength: promotion.packageRef.byteLength,
      childPlacementByteLength: promotion.placementManifestRef.byteLength,
      childQueueByteLength: Buffer.byteLength(originalQueueRecord, 'utf8'),
      canonicalAggregateJobCount: aggregateAfterDerivation.jobs.length,
      executionPackageCount: aggregateAfterDerivation.executionPackages.length,
      childPackageQueueJobCount: promotion.queueAggregate.summary.totalJobCount,
      childPackageQueuePersisted: true,
      rootChildLeaseVerified: true,
      rootOneUseInternalDispatchVerified: true,
      rootValidationArtifactQaAndReconciliationVerified: true,
      rootAttemptInternalCostEvidenceVerified: true,
      rootSnapshotChildCompleted: completedQueue.summary.completedJobCount === 1,
      sourceAuthorityChildCompleted:
        sourceCompletedQueue.summary.completedJobCount === 2,
      completedChildCount: sourceCompletedQueue.summary.completedJobCount,
      remainingBlockedChildCount: sourceCompletedQueue.summary.queuedJobCount,
      sourceAuthorityExecutionAuthorized: true,
      sourceAuthorityRangeCount:
        sourceArtifact.sourceCoverage.sourceRangeCount,
      sourceAuthorityBindingCount:
        sourceArtifact.sourceCoverage.approvedBindingCount,
      sourceAuthorityDirectDownstreamCount:
        sourceReconciliation.summary.directDownstreamCount,
      sourceAuthorityValidationArtifactByteLength:
        sourceArtifactRef.byteLength,
      sourceAuthorityAttemptInternalCostEvidenceVerified: true,
      sourceAuthorityRunnerReadOrDecodedMedia: false,
      mediaExecutionVerified: false,
      chunkRenderExecutionVerified: false,
      googleCloudDispatchAuthorized: false,
      liveGoogleCloudVerified: false,
      productReady: false,
      productionReady: false,
    },
  }, null, 2))
} finally {
  await rm(localStorageRoot, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 50,
  })
}

function createContext(): ServiceContext {
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'local',
    STORAGE_MODE: 'local',
    SUPABASE_URL: 'https://canonical-professional-long-form-smoke.supabase.co',
    SUPABASE_ANON_KEY: 'canonical-professional-long-form-smoke-anon',
    SUPABASE_SERVICE_ROLE_KEY:
      'canonical-professional-long-form-smoke-test-service-role',
    API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
    REEDITPRO_INTERNAL_SERVICE_TOKEN:
      'rp-canonical-long-form-smoke-test-only-7Fq3Zm8Wt5Ks2Nv9',
    LOCAL_STORAGE_ROOT: localStorageRoot,
  })
  return {
    env,
    clients: {
      admin: createMembershipAdminClient(),
      public: null,
    },
    requestId: 'canonical-professional-long-form-post-approval-smoke',
    auth: {
      userId,
      accessToken: 'verified-canonical-professional-long-form-smoke-token',
      isMockUser: false,
    },
  }
}

async function preparePlanningInputAuthority(
  context: ServiceContext,
  projectId: string,
) {
  const service = createExactEditPreferenceService(context)
  const initialized = await service.initialize({
    workspaceId,
    projectId,
    editSessionId,
    idempotencyKey: 'initialize-six-hour-long-form-preferences',
  })
  const updated = await service.updateCurrent({
    workspaceId,
    projectId,
    editSessionId,
    expectedRevision: initialized.preferenceRecord.recordRevision,
    patch: {
      editLevel: 'basic',
      targetPlatform: 'youtube',
      cleanupPreference: 'balanced_cleanup',
    },
    idempotencyKey: 'update-six-hour-long-form-preferences',
  })
  const evidence = await service.recordPlanningEvidence({
    workspaceId,
    projectId,
    editSessionId,
    expectedRevision: updated.preferenceRecord.recordRevision,
    sourcePreparation: {
      status: 'ready',
      evidenceHash: sha256Text('six-hour-long-form-source-preparation-ready'),
    },
    frameConfirmation: {
      status: 'confirmed',
      aspectRatio: '16:9',
      confirmationId: 'six-hour-long-form-frame-confirmation',
    },
    idempotencyKey: 'record-six-hour-long-form-planning-evidence',
  })
  return {
    exactEditPreference: {
      recordRevision: evidence.preferenceRecord.recordRevision,
      preferenceRevision: evidence.preferenceRecord.preferenceRevision,
      preferenceFingerprintSha256: exactEditPreferenceFingerprint(
        evidence.preferenceRecord.values,
      ),
    },
    preferenceApplication: {
      status: 'not_selected' as const,
      applicationVersion: 0 as const,
    },
    editBrief: { status: 'not_used' as const },
  }
}

interface SourceFixture {
  expectation: SourceMediaAuthorityExpectation
  candidate: SourceBindingManifestCandidate
  sourceSequence: PublishCanonicalEditPlanBody['canonicalPlan']['components']['sourceSequence']
}

async function prepareSourceMediaAuthority(
  context: ServiceContext,
  projectId: string,
): Promise<SourceFixture> {
  const uploadService = createUploadService(context)
  const sourceSequence: SourceFixture['sourceSequence'] = []
  for (let index = 0; index < sourceCount; index += 1) {
    const bytes = Buffer.from(
      `reeditpro-six-hour-long-form-source-${index + 1}-immutable-bytes`,
    )
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
    const created = await uploadService.createUploadIntent({
      workspaceId,
      projectId,
      uploadPurpose: 'source_media',
      originalFileName: `long-form-source-${index + 1}.mov`,
      mimeType: 'video/quicktime',
      expectedSizeBytes: bytes.byteLength,
      checksumSha256,
    })
    await uploadService.uploadLocalObject(
      created.uploadIntent.id,
      workspaceId,
      bytes,
      'video/quicktime',
      bytes.byteLength,
    )
    const finalized = await uploadService.finalizeUploadIntent({
      workspaceId,
      uploadIntentId: created.uploadIntent.id,
    })
    sourceSequence.push({
      sourceSequenceItemId: `source-${index + 1}`,
      mediaAssetId: finalized.mediaAsset.id,
      uploadedOrder: index + 1,
      checksumSha256,
      required: true,
    })
  }
  const candidate = (await createSourceMediaAuthorityService(context)
    .buildManifestCandidate({
      workspaceId,
      projectId,
      uploadPurpose: 'source_media',
      orderedItems: sourceSequence.map((item) => ({
        sourceSequenceItemId: item.sourceSequenceItemId,
        mediaAssetId: item.mediaAssetId,
        uploadedOrder: item.uploadedOrder,
        checksumSha256: item.checksumSha256!,
        required: item.required,
      })),
    })).sourceBindingManifestCandidate
  return {
    expectation: {
      authorityRevision: candidate.authorityRevision,
      authorityChecksumSha256: candidate.authorityChecksumSha256,
      sourceSequenceHash: candidate.sourceSequenceHash,
      candidateHash: candidate.candidateHash,
    },
    candidate,
    sourceSequence,
  }
}

function createCanonicalPlanBody(input: {
  projectId: string
  planningInputAuthority: Awaited<
    ReturnType<typeof preparePlanningInputAuthority>
  >
  sourceFixture: SourceFixture
}): PublishCanonicalEditPlanBody {
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
    outputFps: fps,
    approvedAspectRatio: '16:9',
  })
  const sourceCleanupDecisions = input.sourceFixture.sourceSequence.map((source) => ({
    decisionId: `cleanup-${source.sourceSequenceItemId}`,
    sourceSequenceItemId: source.sourceSequenceItemId,
    action: 'preserve' as const,
    startFrame: 0,
    endFrameExclusive: totalFrames,
    reason:
      'Preserve the complete approved source authority for deterministic long-form range selection.',
    confidence: 1,
    meaningPreservationStatus: 'passed' as const,
    userReviewStatus: 'not_required' as const,
  }))
  const sourceRanges = buildSourceRanges(input.sourceFixture)
  const components: PublishCanonicalEditPlanBody['canonicalPlan']['components'] = {
    compiledIntent: {
      goal:
        'Create a professional six-hour multi-source edit through object-backed frame-exact execution.',
    },
    professionalEditingDirective: {
      pacing: 'source-led',
      mustFollowRules: [
        'Preserve meaning.',
        'Use only approved hard-cut boundaries.',
        'Keep final output frame-exact.',
      ],
    },
    confirmedSettings: {
      aspectRatio: '16:9',
      outputFrame: { width: 3_840, height: 2_160, fps },
      outputFramePurpose: 'private_canonical_4k_master_review',
      professionalExportCoverage,
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: 'basic',
      targetPlatform: 'youtube',
      preferenceSnapshotId: 'server-default-exact-edit-preferences-v1',
      preferenceRevision: 1,
    },
    sourceSequence: input.sourceFixture.sourceSequence.map((source) => ({
      ...source,
    })),
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: 'balanced_cleanup',
      trimValidationStatus: 'passed',
      meaningValidationStatus: 'passed',
      userReviewRequired: false,
    },
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: sourceCleanupDecisions,
    },
    masterTimingPlan: {
      status: 'ready',
      timingBase: { fps },
      totalFrames,
      executionValuesAreFrames: true,
    },
    captionVisualCueTimingPlan: {
      status: 'synced',
      collisionCount: 0,
      speechClarityPriority: true,
    },
    soundSyncTransitionTimingPlan: {
      status: 'ready',
      speechPriority: true,
      transitions: 'approved_hard_cuts_only',
    },
    timingValidationPlan: {
      overallStatus: 'passed',
      approvalBlocked: false,
      frameCoverageVerified: true,
    },
    timingSummary: {
      validationStatus: 'passed',
      approvalBlocked: false,
      fps,
      totalFrames,
    },
    segments: sourceRanges.map((range, index) => ({
      segmentId: range.segmentId,
      startFrame: range.timelineStartFrame,
      endFrameExclusive: range.timelineEndFrameExclusive,
      operationIds: [`approved-long-form-operation-${index + 1}`],
    })),
    visualAssetPlan: {
      assets: [],
      randomBrollAllowed: false,
      requiredPlaceholdersAllowedInFinal: false,
    },
    colorPipelinePlan: {
      status: 'planned',
      policy: 'source_bound_transform_plus_boundary_continuity_v1',
    },
    rendererPlan: {
      renderer: 'object_backed_chunk_graph_then_private_4k_finalizer',
      frameOwnedByRenderer: true,
      packageQueuePromotionRequired: true,
    },
    toolStrategyPlan: { toolIds: [], exactOperationIds: [] },
    qaPlan: {
      status: 'passed',
      checks: [
        'intent',
        'timing',
        'source_order',
        'frame',
        'chunk_qa',
        'final_qa',
      ],
    },
    qaSummary: { status: 'passed', approvalBlocked: false },
    providerPolicy: { veoPolicy: 'forbidden', approvedRoutes: [] },
    fallbackPolicy: {
      unapprovedFallbackAllowed: false,
      requiredChildFailureBlocksFinalization: true,
    },
  }
  return {
    workspaceId,
    planningRequestId,
    planningInputAuthority: input.planningInputAuthority,
    sourceMediaAuthority: input.sourceFixture.expectation,
    canonicalPlan: {
      schemaVersion: PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION,
      components,
      estimate: {
        lineItems: [
          {
            lineKey: 'planning',
            label: 'Planning',
            category: 'planning',
            estimatedCredits: 5,
            removable: false,
            metadata: {},
          },
          {
            lineKey: 'long-form-object-graph',
            label: 'Professional long-form object execution planning',
            category: 'planning',
            estimatedCredits: 7,
            removable: false,
            metadata: {
              childExecutionIncludedInApprovedReservation: true,
            },
          },
          {
            lineKey: '4k-export-ceiling',
            label: '4K UHD render and export ceiling',
            category: 'render',
            estimatedCredits:
              professionalExportCoverage.maximumInternalToolCostCredits,
            removable: false,
            metadata: {
              requiresSeparateExportEstimate: false,
              allowsAdditionalExportCharge: false,
            },
          },
        ],
        fallbackAllowanceCredits: 3,
        validForSeconds: 3_600,
      },
      workItems: [
        authorityPreflightWorkItem({
          workItemKey: 'long-form-snapshot-preflight',
          workItemType: 'validate_approved_snapshot',
          operation: 'validate_long_form_snapshot_seed_manifest',
          outputKey: 'long-form-snapshot-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
        authorityPreflightWorkItem({
          workItemKey: 'long-form-source-authority-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_source_range_authority',
          outputKey: 'long-form-source-authority-preflight-evidence',
          sourceSequenceItemIds: input.sourceFixture.sourceSequence.map((source) =>
            source.sourceSequenceItemId),
          sourceCleanupDecisionIds: sourceCleanupDecisions.map((decision) =>
            decision.decisionId),
        }),
        authorityPreflightWorkItem({
          workItemKey: 'long-form-estimate-frame-preflight',
          workItemType: 'custom',
          operation: 'validate_long_form_4k_estimate_and_frame_authority',
          outputKey: 'long-form-estimate-frame-preflight-evidence',
          sourceSequenceItemIds: [],
          sourceCleanupDecisionIds: [],
        }),
      ],
    },
  }
}

function authorityPreflightWorkItem(input: {
  workItemKey: string
  workItemType: 'validate_approved_snapshot' | 'custom'
  operation: string
  outputKey: string
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
}): CanonicalWorkItemInput {
  return {
    workItemKey: input.workItemKey,
    workItemType: input.workItemType,
    workerClass: 'authority_worker',
    executionInput: {
      operation: input.operation,
      executionAuthorized: false,
    },
    sourceSequenceItemIds: input.sourceSequenceItemIds,
    sourceCleanupDecisionIds: input.sourceCleanupDecisionIds,
    expectedOutputs: [{
      outputKey: input.outputKey,
      artifactType: 'authority_validation_evidence',
      assetRole: 'qa',
      required: true,
      previewPlaceholderAllowed: false,
      contentType: 'application/json',
      segmentIds: [],
      timingIds: [],
      rendererLayerIds: [],
    }],
    dependencyKeys: [],
    approvedToolIds: [],
    providerExecutionMode: 'none',
    fallbackPolicy: {
      policy: 'block_before_long_form_child_derivation',
      automaticFallbackAuthorized: false,
    },
    maxAttempts: 1,
    attemptTimeoutSeconds: 300,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 0,
    required: true,
  }
}

function createSeedDraft(input: {
  projectId: string
  sourceFixture: SourceFixture
  runtimeRegion?: 'us-east1' | 'europe-west1'
}) {
  const runtimeRegion = input.runtimeRegion ?? 'us-east1'
  return {
    schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
    identity: {
      workspaceId,
      projectId: input.projectId,
      editSessionId,
      planningRequestId,
    },
    runtimeRegion,
    confirmedOutputFrame: {
      frameTemplateId: 'landscape-16x9-uhd-v1',
      width: 3_840,
      height: 2_160,
      confirmed: true as const,
      deliveryCeilingProfileId: 'uhd_2160_4k_ceiling_v1' as const,
      frameRate: {
        profileId: 'fps_30' as const,
        numerator: 30,
        denominator: 1,
      },
    },
    totalFrames,
    sourceRanges: buildSourceRanges(input.sourceFixture, runtimeRegion),
    executionPolicy: {
      videoChunkPolicy: 'object_backed_frame_exact_mezzanine_v1' as const,
      audioPolicy: 'single_continuous_timeline_mix_v1' as const,
      colorPolicy:
        'source_bound_transform_plus_boundary_continuity_v1' as const,
      transitionPolicy: 'approved_hard_cuts_only_v1' as const,
      objectResidencyPolicy: 'single_region_no_cross_region_copy_v1' as const,
      finalizationPolicy:
        'compatible_object_mezzanine_concat_or_block_v1' as const,
      requiredAssetPlaceholderPolicy: 'forbidden_in_final_v1' as const,
    },
    approvalAndCostBoundary: {
      originalApprovedFourKEstimateReused: true as const,
      originalApprovedReservationReused: true as const,
      secondExportEstimateAllowed: false as const,
      secondExportChargeAllowed: false as const,
      attemptLevelInternalProductionCostEvidenceRequired: true as const,
      customerCommercialAuthorityIncluded: false as const,
    },
  }
}

function buildSourceRanges(
  sourceFixture: SourceFixture,
  runtimeRegion: 'us-east1' | 'europe-west1' = 'us-east1',
) {
  const baseFrames = Math.floor(
    totalFrames / PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  )
  const remainder = totalFrames % PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES
  let timelineStartFrame = 0
  return Array.from(
    { length: PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES },
    (_, index) => {
      const durationFrames = baseFrames + (index < remainder ? 1 : 0)
      const sourceIndex = index % sourceFixture.sourceSequence.length
      const sourceSequenceItem = sourceFixture.sourceSequence[sourceIndex]!
      const binding = sourceFixture.candidate.bindings.find((candidate) =>
        candidate.sourceSequenceItemId ===
          sourceSequenceItem.sourceSequenceItemId)
      assert.ok(binding)
      const range = {
        segmentId: `long-form-segment-${index + 1}`,
        sourceSequenceItemId: sourceSequenceItem.sourceSequenceItemId,
        mediaAssetId: binding.mediaAssetId,
        sourceObjectGeneration: binding.generation ?? '1',
        sourceObjectRegion: runtimeRegion,
        sourceByteLength: binding.sizeBytes,
        sourceSha256: binding.checksumSha256,
        sourceCleanupDecisionId:
          `cleanup-${sourceSequenceItem.sourceSequenceItemId}`,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: durationFrames,
        timelineStartFrame,
        timelineEndFrameExclusive: timelineStartFrame + durationFrames,
        editorialBoundaryBefore:
          index === 0 ? 'timeline_start' as const : 'approved_hard_cut' as const,
      }
      timelineStartFrame = range.timelineEndFrameExclusive
      return range
    },
  )
}

async function requireAggregate() {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

async function expectApiError(
  action: () => Promise<unknown>,
  expectedCode: ApiError['code'],
  checkName: string,
): Promise<void> {
  let caught: unknown
  try {
    await action()
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof ApiError && caught.code === expectedCode,
    `${checkName}: received ${String(caught)}`,
  )
  checks.push(checkName)
}

async function assertNoActivationImports(): Promise<void> {
  const sources = await Promise.all([
    'server/edit-architecture/professional-long-form-derived-child-job-manifest.ts',
    'server/edit-architecture/professional-long-form-child-package-promotion.ts',
    'server/services/canonical-professional-long-form-publication-authority.ts',
    'server/services/canonical-professional-long-form-post-approval-service.ts',
    'server/services/canonical-professional-long-form-child-package-promotion-service.ts',
    'server/edit-architecture/professional-long-form-source-authority-execution-contract.ts',
    'server/edit-architecture/professional-long-form-source-authority-execution.ts',
    'server/services/canonical-professional-long-form-source-authority-execution-service.ts',
  ].map((path) => readFile(path, 'utf8')))
  check(
    sources.every((source) =>
      !/from\s+['"](?:@google-cloud|@supabase|stripe|node:child_process|node:http|node:https)/u
        .test(source) &&
      !/\bfetch\s*\(/u.test(source) &&
      !/process\.env/u.test(source)),
    'long_form_authority_sources_have_no_cloud_database_provider_network_or_environment_activation_path',
  )
}

function createMembershipAdminClient(): SupabaseClient {
  return {
    from(tableName: string) {
      if (tableName !== 'workspace_members') {
        throw new Error(`Unexpected long-form smoke table: ${tableName}`)
      }
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const allowed = selectedWorkspaceId === workspaceId &&
            selectedUserId === userId
          return {
            data: allowed
              ? {
                  workspace_id: workspaceId,
                  user_id: userId,
                  role: 'owner',
                }
              : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function asBlobRef(value: unknown): { sha256: string; byteLength: number } {
  const record = asRecord(value)
  assert.match(String(record.sha256), /^[a-f0-9]{64}$/u)
  assert.ok(Number.isSafeInteger(record.byteLength) && Number(record.byteLength) > 0)
  return {
    sha256: String(record.sha256),
    byteLength: Number(record.byteLength),
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
