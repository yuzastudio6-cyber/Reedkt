import { z } from 'zod'

import { workerConcurrencyPolicy } from '../cost-controls/worker-concurrency-policy'
import {
  CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
} from './canonical-private-resource-placement-authority'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from './canonical-private-package-work-queue-authority'
import {
  PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID,
  PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
  verifyProfessionalLongFormApprovedSnapshotBridge,
  type ProfessionalLongFormApprovedSnapshotBridge,
} from './professional-long-form-approved-snapshot-bridge'
import {
  verifyProfessionalLongFormDerivedChildJobManifest,
  type ProfessionalLongFormDerivedChildJobManifest,
} from './professional-long-form-derived-child-job-manifest'
import {
  PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS,
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
  type ProfessionalLongFormWorkItemKind,
} from './professional-long-form-object-execution-plan'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_VERSION =
  'canonical-professional-long-form-child-package-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PLACEMENT_VERSION =
  'canonical-professional-long-form-child-placement-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE =
  'canonical_professional_long_form_exact_tool_cost_runner_and_qa_authority' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const jsonBlobRef = z.object({
  sha256,
  byteLength: z.number().int().positive().max(4 * 1024 * 1024),
}).strict()
const workerType = z.enum([
  'api_service',
  'cpu_analysis_worker',
  'render_worker',
  'qa_worker',
])
const resourceClass = z.enum([
  'control_plane_cpu_v1',
  'cpu_analysis_standard_v1',
  'render_cpu_high_memory_v1',
  'qa_cpu_standard_v1',
])

export const canonicalProfessionalLongFormChildPackageSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_VERSION),
  source: z.literal('canonical_professional_long_form_post_approval_authority'),
  purpose: z.literal('private_internal_long_form_child_package_handoff'),
  status: z.literal('immutable_child_package_queue_promotion_allowed_execution_blocked'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanId: identity,
    approvedPlanSnapshotId: identity,
    approvedPlanSnapshotHash: sha256,
    approvedEstimateId: identity,
    creditReservationId: identity,
    parentControllerApprovedWorkItemId: identity,
    parentControllerJobId: identity,
    packageRecordId: identity,
  }).strict(),
  authority: z.object({
    capacityProfileId: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID),
    planSeedHash: sha256,
    bridgeAuthorityHash: sha256,
    childWorkGraphHash: sha256,
    childJobManifestHash: sha256,
    bridgeRef: jsonBlobRef,
    childJobManifestRef: jsonBlobRef,
    placementProfileAuthorityHash: sha256,
    toolOperationBoundaryHash: sha256,
  }).strict(),
  policy: z.object({
    childPackagePlacementProfileId: z.literal(
      PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
    ),
    childAttemptPolicyId: z.literal(PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID),
    childToolOperationBindingPolicyId: z.literal(
      PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
    ),
    childPackageQueuePromotionAfterApprovalAllowed: z.literal(true),
    childToolOperationAuthorityStatus: z.literal(
      'blocked_pending_exact_tool_operation_cost_and_runner_authority',
    ),
    childExecutionAuthorized: z.literal(false),
  }).strict(),
  reservation: z.object({
    status: z.literal('reserved'),
    approvedMaximumCredits: z.number().int().positive(),
    reservedCredits: z.number().int().positive(),
    remainingReservedCredits: z.number().int().positive(),
    secondExportEstimateAllowed: z.literal(false),
    secondExportChargeAllowed: z.literal(false),
  }).strict(),
  summary: z.object({
    childJobCount: z.number().int().positive().max(256),
    rootChildJobCount: z.number().int().positive().max(256),
    maximumDependencyCount: z.number().int().positive().max(128),
    everyChildRequired: z.literal(true),
    everyChildPackageQueueEligible: z.literal(true),
    everyChildExecutionBlocked: z.literal(true),
  }).strict(),
  boundaries: z.object({
    approvedSnapshotRequired: z.literal(true),
    fundedReservationRequired: z.literal(true),
    immutableManifestRequired: z.literal(true),
    callerSelectedChildGraphAllowed: z.literal(false),
    ordinaryExecutionPackageAllowed: z.literal(false),
    childLeaseAuthorized: z.literal(false),
    childDispatchAuthorized: z.literal(false),
    mediaExecutionAuthorized: z.literal(false),
    objectStoreMutationAuthorized: z.literal(false),
    providerActivationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    googleCloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  packageHash: sha256,
}).strict()

const childPlacementSchema = z.object({
  canonicalOrder: z.number().int().nonnegative().max(255),
  jobId: identity,
  childWorkItemId: identity,
  kind: z.enum(PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS),
  expectedOutputIdentity: z.string().trim().min(1).max(512),
  manifestDependencyJobIds: z.array(identity).max(128),
  queueDependencyJobIds: z.array(identity).max(128),
  satisfiedPromotionDependencyJobIds: z.array(identity).max(1),
  workerType,
  resourceClassId: resourceClass,
  plannedCloudExecutionTarget: z.enum(['cloud_run_service', 'cloud_run_job']),
  preferredAccelerator: z.literal('none'),
  cpuAllowed: z.literal(true),
  workerConcurrencyLimit: z.number().int().positive().max(100),
  globalConcurrencyLimit: z.literal(CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY),
  placementProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
  ),
  attemptPolicyId: z.literal(PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID),
  toolOperationBindingPolicyId: z.literal(
    PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
  ),
  approvedToolIds: z.array(identity).length(0),
  approvedToolOperationIds: z.array(identity).length(0),
  providerExecutionMode: z.literal('none'),
  privateExecutionReady: z.literal(false),
  requiredGate: z.literal(CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE),
  maxAttempts: z.number().int().positive().max(10),
  attemptTimeoutSeconds: z.number().int().positive().max(3_600),
  scheduledFor: z.string().datetime({ offset: true }),
  placementHash: sha256,
}).strict()

export const canonicalProfessionalLongFormChildPlacementManifestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PLACEMENT_VERSION),
  source: z.literal('approved_long_form_child_profile_and_persisted_manifest'),
  status: z.literal('every_child_placed_package_queue_eligible_execution_blocked'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    approvedPlanSnapshotId: identity,
    approvedPlanSnapshotHash: sha256,
    packageRecordId: identity,
    packageHash: sha256,
    childJobManifestHash: sha256,
    parentControllerApprovedWorkItemId: identity,
    parentControllerJobId: identity,
    placementProfileAuthorityHash: sha256,
  }).strict(),
  placements: z.array(childPlacementSchema).min(1).max(256),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    rootChildJobCount: z.number().int().positive().max(256),
    controlPlaneJobCount: z.number().int().nonnegative().max(256),
    cpuAnalysisJobCount: z.number().int().nonnegative().max(256),
    renderJobCount: z.number().int().nonnegative().max(256),
    qaJobCount: z.number().int().nonnegative().max(256),
    privatelyExecutableJobCount: z.literal(0),
    blockedJobCount: z.number().int().positive().max(256),
    everyPlacementServerDerived: z.literal(true),
  }).strict(),
  boundaries: z.object({
    placementProfileFrozenByApprovedController: z.literal(true),
    parentControllerDependencySatisfiedOnlyByPromotion: z.literal(true),
    exactToolOperationBindingRequiredBeforeClaim: z.literal(true),
    attemptCostBudgetRequiredBeforeClaim: z.literal(true),
    privateArtifactQaReconciliationRequiredBeforeCompletion: z.literal(true),
    childLeaseAuthorized: z.literal(false),
    childDispatchAuthorized: z.literal(false),
    mediaExecutionAuthorized: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  manifestHash: sha256,
}).strict()

export type CanonicalProfessionalLongFormChildPackage = z.infer<
  typeof canonicalProfessionalLongFormChildPackageSchema
>
export type CanonicalProfessionalLongFormChildPlacementManifest = z.infer<
  typeof canonicalProfessionalLongFormChildPlacementManifestSchema
>

export interface ProfessionalLongFormChildPackageReservationAuthority {
  reservationStatus: string
  approvedMaximumCredits: number
  reservedCredits: number
  spentCredits: number
  releasedCredits: number
  refundedCredits: number
}

export function buildCanonicalProfessionalLongFormChildPackage(input: {
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  bridgeRef: AuthorityJsonBlobRef
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
  childJobManifestRef: AuthorityJsonBlobRef
  reservation: ProfessionalLongFormChildPackageReservationAuthority
}): CanonicalProfessionalLongFormChildPackage {
  const bridge = verifyProfessionalLongFormApprovedSnapshotBridge(input.bridge)
  const manifest = verifyProfessionalLongFormDerivedChildJobManifest({
    manifest: input.childJobManifest,
    bridge,
    parentControllerApprovedWorkItemId:
      input.childJobManifest.identity.parentControllerApprovedWorkItemId,
    parentControllerJobId: input.childJobManifest.identity.parentControllerJobId,
  })
  assertBlobRef(input.bridgeRef, bridge)
  assertBlobRef(input.childJobManifestRef, manifest)
  const controllerInput = bridge.binding.request.controllerBinding.executionInput
  const snapshot = bridge.binding.request.snapshot
  const remainingReservedCredits = input.reservation.reservedCredits -
    input.reservation.spentCredits - input.reservation.releasedCredits -
    input.reservation.refundedCredits
  if (
    input.reservation.reservationStatus !== 'reserved' ||
    remainingReservedCredits <= 0 ||
    input.reservation.approvedMaximumCredits <= 0 ||
    controllerInput.childPackageQueuePromotionAfterApprovalAllowed !== true ||
    controllerInput.childExecutionAuthorized !== false ||
    controllerInput.childPackagePlacementProfileId !==
      PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID ||
    controllerInput.childAttemptPolicyId !==
      PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID ||
    controllerInput.childToolOperationBindingPolicyId !==
      PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID
  ) {
    throw new Error(
      'Professional long-form child packaging requires one funded approved blocked controller policy.',
    )
  }
  const placementProfileAuthorityHash = childPlacementProfileAuthorityHash()
  const toolOperationBoundaryHash = sha256AuthorityValue({
    policyId: controllerInput.childToolOperationBindingPolicyId,
    status: 'blocked_pending_exact_tool_operation_cost_and_runner_authority',
    childJobManifestHash: manifest.manifestHash,
    customerCommercialAuthorityIncluded: false,
  })
  const packageRecordId = `long-form-child-package-${sha256AuthorityValue({
    snapshotHash: snapshot.snapshotHash,
    childJobManifestHash: manifest.manifestHash,
    placementProfileAuthorityHash,
    toolOperationBoundaryHash,
  }).slice(0, 40)}`
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_VERSION,
    source: 'canonical_professional_long_form_post_approval_authority' as const,
    purpose: 'private_internal_long_form_child_package_handoff' as const,
    status: 'immutable_child_package_queue_promotion_allowed_execution_blocked' as const,
    identity: {
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      approvedEstimateId: snapshot.estimateId,
      creditReservationId: snapshot.reservationId,
      parentControllerApprovedWorkItemId:
        manifest.identity.parentControllerApprovedWorkItemId,
      parentControllerJobId: manifest.identity.parentControllerJobId,
      packageRecordId,
    },
    authority: {
      capacityProfileId: controllerInput.capacityProfileId,
      planSeedHash: manifest.identity.planSeedHash,
      bridgeAuthorityHash: bridge.authorityHash,
      childWorkGraphHash: bridge.expandedGraph.childWorkGraphHash,
      childJobManifestHash: manifest.manifestHash,
      bridgeRef: input.bridgeRef,
      childJobManifestRef: input.childJobManifestRef,
      placementProfileAuthorityHash,
      toolOperationBoundaryHash,
    },
    policy: {
      childPackagePlacementProfileId: controllerInput.childPackagePlacementProfileId,
      childAttemptPolicyId: controllerInput.childAttemptPolicyId,
      childToolOperationBindingPolicyId:
        controllerInput.childToolOperationBindingPolicyId,
      childPackageQueuePromotionAfterApprovalAllowed: true as const,
      childToolOperationAuthorityStatus:
        'blocked_pending_exact_tool_operation_cost_and_runner_authority' as const,
      childExecutionAuthorized: false as const,
    },
    reservation: {
      status: 'reserved' as const,
      approvedMaximumCredits: input.reservation.approvedMaximumCredits,
      reservedCredits: input.reservation.reservedCredits,
      remainingReservedCredits,
      secondExportEstimateAllowed: false as const,
      secondExportChargeAllowed: false as const,
    },
    summary: {
      childJobCount: manifest.summary.childJobCount,
      rootChildJobCount: manifest.summary.rootChildJobCount,
      maximumDependencyCount: manifest.summary.maximumDependencyCount,
      everyChildRequired: true as const,
      everyChildPackageQueueEligible: true as const,
      everyChildExecutionBlocked: true as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      immutableManifestRequired: true as const,
      callerSelectedChildGraphAllowed: false as const,
      ordinaryExecutionPackageAllowed: false as const,
      childLeaseAuthorized: false as const,
      childDispatchAuthorized: false as const,
      mediaExecutionAuthorized: false as const,
      objectStoreMutationAuthorized: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalProfessionalLongFormChildPackageSchema.parse({
    ...payload,
    packageHash: sha256AuthorityValue(payload),
  })
}

export function buildCanonicalProfessionalLongFormChildPlacementManifest(input: {
  package: CanonicalProfessionalLongFormChildPackage
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
}): CanonicalProfessionalLongFormChildPlacementManifest {
  const childPackage = canonicalProfessionalLongFormChildPackageSchema.parse(
    input.package,
  )
  const bridge = verifyProfessionalLongFormApprovedSnapshotBridge(input.bridge)
  const manifest = verifyProfessionalLongFormDerivedChildJobManifest({
    manifest: input.childJobManifest,
    bridge,
    parentControllerApprovedWorkItemId:
      childPackage.identity.parentControllerApprovedWorkItemId,
    parentControllerJobId: childPackage.identity.parentControllerJobId,
  })
  assertPackageHash(childPackage)
  if (
    childPackage.authority.childJobManifestHash !== manifest.manifestHash ||
    childPackage.authority.bridgeAuthorityHash !== bridge.authorityHash ||
    childPackage.authority.placementProfileAuthorityHash !==
      childPlacementProfileAuthorityHash()
  ) {
    throw new Error('Professional long-form child placement lost package authority.')
  }
  const placements = manifest.jobs.map((job, canonicalOrder) => {
    const profile = childPlacementForKind(job.kind)
    const manifestDependencyJobIds = [...job.dependencyJobIds]
    const satisfiedPromotionDependencyJobIds = manifestDependencyJobIds.filter(
      (dependencyJobId) =>
        dependencyJobId === childPackage.identity.parentControllerJobId,
    )
    const queueDependencyJobIds = manifestDependencyJobIds.filter(
      (dependencyJobId) =>
        dependencyJobId !== childPackage.identity.parentControllerJobId,
    )
    const withoutHash = {
      canonicalOrder,
      jobId: job.jobId,
      childWorkItemId: job.childWorkItemId,
      kind: job.kind,
      expectedOutputIdentity: job.expectedOutputIdentity,
      manifestDependencyJobIds,
      queueDependencyJobIds,
      satisfiedPromotionDependencyJobIds,
      ...profile,
      placementProfileId: PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
      attemptPolicyId: PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID,
      toolOperationBindingPolicyId:
        PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
      approvedToolIds: [] as [],
      approvedToolOperationIds: [] as [],
      providerExecutionMode: 'none' as const,
      privateExecutionReady: false as const,
      requiredGate: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE,
      scheduledFor: bridge.binding.request.snapshot.approvedAt,
    }
    return childPlacementSchema.parse({
      ...withoutHash,
      placementHash: sha256AuthorityValue(withoutHash),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_PLACEMENT_VERSION,
    source: 'approved_long_form_child_profile_and_persisted_manifest' as const,
    status: 'every_child_placed_package_queue_eligible_execution_blocked' as const,
    identity: {
      workspaceId: childPackage.identity.workspaceId,
      projectId: childPackage.identity.projectId,
      editSessionId: childPackage.identity.editSessionId,
      approvedPlanSnapshotId: childPackage.identity.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: childPackage.identity.approvedPlanSnapshotHash,
      packageRecordId: childPackage.identity.packageRecordId,
      packageHash: childPackage.packageHash,
      childJobManifestHash: manifest.manifestHash,
      parentControllerApprovedWorkItemId:
        childPackage.identity.parentControllerApprovedWorkItemId,
      parentControllerJobId: childPackage.identity.parentControllerJobId,
      placementProfileAuthorityHash:
        childPackage.authority.placementProfileAuthorityHash,
    },
    placements,
    summary: {
      totalJobCount: placements.length,
      rootChildJobCount: placements.filter((placement) =>
        placement.satisfiedPromotionDependencyJobIds.length === 1).length,
      controlPlaneJobCount: countWorker(placements, 'api_service'),
      cpuAnalysisJobCount: countWorker(placements, 'cpu_analysis_worker'),
      renderJobCount: countWorker(placements, 'render_worker'),
      qaJobCount: countWorker(placements, 'qa_worker'),
      privatelyExecutableJobCount: 0 as const,
      blockedJobCount: placements.length,
      everyPlacementServerDerived: true as const,
    },
    boundaries: {
      placementProfileFrozenByApprovedController: true as const,
      parentControllerDependencySatisfiedOnlyByPromotion: true as const,
      exactToolOperationBindingRequiredBeforeClaim: true as const,
      attemptCostBudgetRequiredBeforeClaim: true as const,
      privateArtifactQaReconciliationRequiredBeforeCompletion: true as const,
      childLeaseAuthorized: false as const,
      childDispatchAuthorized: false as const,
      mediaExecutionAuthorized: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalProfessionalLongFormChildPlacementManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export function buildCanonicalProfessionalLongFormChildQueueDefinition(input: {
  package: CanonicalProfessionalLongFormChildPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest: CanonicalProfessionalLongFormChildPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
}): CanonicalPrivatePackageWorkQueueDefinition {
  const childPackage = canonicalProfessionalLongFormChildPackageSchema.parse(
    input.package,
  )
  const placementManifest =
    canonicalProfessionalLongFormChildPlacementManifestSchema.parse(
      input.placementManifest,
    )
  const childJobManifest = input.childJobManifest
  assertPackageHash(childPackage)
  assertPlacementManifestHash(placementManifest)
  assertBlobRef(input.packageRef, childPackage)
  assertBlobRef(input.placementManifestRef, placementManifest)
  if (
    placementManifest.identity.packageHash !== childPackage.packageHash ||
    placementManifest.identity.childJobManifestHash !==
      childJobManifest.manifestHash ||
    placementManifest.placements.length !== childJobManifest.jobs.length
  ) {
    throw new Error('Professional long-form child queue lost package placement lineage.')
  }
  const placementByJobId = new Map(placementManifest.placements.map((placement) =>
    [placement.jobId, placement]))
  const jobs = childJobManifest.jobs.map((job, canonicalOrder) => {
    const placement = placementByJobId.get(job.jobId)
    if (
      !placement || placement.canonicalOrder !== canonicalOrder ||
      placement.childWorkItemId !== job.childWorkItemId ||
      stableAuthorityStringify(placement.manifestDependencyJobIds) !==
        stableAuthorityStringify(job.dependencyJobIds)
    ) {
      throw new Error('Professional long-form child queue placement changed job authority.')
    }
    const withoutHash = {
      canonicalOrder,
      jobId: job.jobId,
      approvedWorkItemId: job.childWorkItemId,
      workItemKey: job.childWorkItemId,
      required: true,
      dependencyJobIds: [...placement.queueDependencyJobIds],
      satisfiedPromotionDependencyJobIds: [
        ...placement.satisfiedPromotionDependencyJobIds,
      ],
      workerType: placement.workerType,
      resourceClassId: placement.resourceClassId,
      plannedCloudExecutionTarget: placement.plannedCloudExecutionTarget,
      preferredAccelerator: placement.preferredAccelerator,
      placementHash: placement.placementHash,
      privateExecutionReady: false,
      providerExecutionMode: 'none' as const,
      requiredGate: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE,
      maxAttempts: placement.maxAttempts,
      attemptTimeoutSeconds: placement.attemptTimeoutSeconds,
      scheduledFor: placement.scheduledFor,
    }
    return canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
      ...withoutHash,
      definitionHash: sha256AuthorityValue(withoutHash),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: 'canonical_professional_long_form_child_package_promotion' as const,
    identity: {
      workspaceId: childPackage.identity.workspaceId,
      projectId: childPackage.identity.projectId,
      editSessionId: childPackage.identity.editSessionId,
      packageRecordId: childPackage.identity.packageRecordId,
      approvedPlanSnapshotId: childPackage.identity.approvedPlanSnapshotId,
      packageHash: childPackage.packageHash,
      snapshotHash: childPackage.identity.approvedPlanSnapshotHash,
      workGraphHash: childPackage.authority.childWorkGraphHash,
      placementManifestHash: placementManifest.manifestHash,
      toolExecutionAuthorityHash: childPackage.authority.toolOperationBoundaryHash,
      approvedResourcePlacementAuthorityHash:
        childPackage.authority.placementProfileAuthorityHash,
      professionalLongFormAuthority: {
        capacityProfileId: childPackage.authority.capacityProfileId,
        planSeedHash: childPackage.authority.planSeedHash,
        bridgeAuthorityHash: childPackage.authority.bridgeAuthorityHash,
        childJobManifestHash: childPackage.authority.childJobManifestHash,
        childJobManifestRefSha256:
          childPackage.authority.childJobManifestRef.sha256,
        childPackageRefSha256: input.packageRef.sha256,
        childPlacementManifestRefSha256: input.placementManifestRef.sha256,
        parentControllerApprovedWorkItemId:
          childPackage.identity.parentControllerApprovedWorkItemId,
        parentControllerJobId: childPackage.identity.parentControllerJobId,
        childJobCount: childPackage.summary.childJobCount,
        rootChildJobCount: childPackage.summary.rootChildJobCount,
        childPackagePlacementProfileId:
          childPackage.policy.childPackagePlacementProfileId,
        childAttemptPolicyId: childPackage.policy.childAttemptPolicyId,
        childToolOperationBindingPolicyId:
          childPackage.policy.childToolOperationBindingPolicyId,
        childToolOperationAuthorityStatus:
          childPackage.policy.childToolOperationAuthorityStatus,
        childExecutionAuthorized: false as const,
      },
    },
    jobs,
    summary: {
      totalJobCount: jobs.length,
      requiredJobCount: jobs.length,
      cpuAnalysisJobCount: jobs.filter((job) =>
        job.workerType === 'cpu_analysis_worker').length,
      gpuJobCount: 0,
      renderJobCount: jobs.filter((job) =>
        job.workerType === 'render_worker').length,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalLongFormChildPackage(input: {
  value: unknown
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  bridgeRef: AuthorityJsonBlobRef
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
  childJobManifestRef: AuthorityJsonBlobRef
  reservation: ProfessionalLongFormChildPackageReservationAuthority
}): CanonicalProfessionalLongFormChildPackage {
  const parsed = canonicalProfessionalLongFormChildPackageSchema.parse(input.value)
  const expected = buildCanonicalProfessionalLongFormChildPackage(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error('Professional long-form child package failed exact authority replay.')
  }
  return expected
}

export function assertCanonicalProfessionalLongFormChildPlacementManifest(input: {
  value: unknown
  package: CanonicalProfessionalLongFormChildPackage
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
}): CanonicalProfessionalLongFormChildPlacementManifest {
  const parsed = canonicalProfessionalLongFormChildPlacementManifestSchema.parse(
    input.value,
  )
  const expected = buildCanonicalProfessionalLongFormChildPlacementManifest(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form child placement manifest failed exact authority replay.',
    )
  }
  return expected
}

export function assertCanonicalProfessionalLongFormChildQueueDefinition(input: {
  value: unknown
  package: CanonicalProfessionalLongFormChildPackage
  packageRef: AuthorityJsonBlobRef
  placementManifest: CanonicalProfessionalLongFormChildPlacementManifest
  placementManifestRef: AuthorityJsonBlobRef
  childJobManifest: ProfessionalLongFormDerivedChildJobManifest
}): CanonicalPrivatePackageWorkQueueDefinition {
  const parsed = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(input.value)
  const expected = buildCanonicalProfessionalLongFormChildQueueDefinition(input)
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form child queue definition failed exact authority replay.',
    )
  }
  return expected
}

function childPlacementProfileAuthorityHash(): string {
  return sha256AuthorityValue({
    profileId: PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
    attemptPolicyId: PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID,
    toolOperationBindingPolicyId:
      PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
    requiredGate: CANONICAL_PROFESSIONAL_LONG_FORM_CHILD_REQUIRED_GATE,
    kinds: PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS.map((kind) => ({
      kind,
      ...childPlacementForKind(kind),
    })),
  })
}

function childPlacementForKind(kind: ProfessionalLongFormWorkItemKind) {
  const profiles = {
    validate_approved_snapshot: placementProfile('api_service', 1, 300),
    validate_private_source_authority: placementProfile('api_service', 1, 300),
    render_object_mezzanine_chunk: placementProfile('render_worker', 2, 3_600),
    qa_object_mezzanine_chunk: placementProfile('qa_worker', 2, 900),
    mix_continuous_program_audio: placementProfile('cpu_analysis_worker', 2, 3_600),
    validate_master_timing: placementProfile('qa_worker', 1, 900),
    validate_cross_chunk_color_continuity: placementProfile('qa_worker', 2, 1_800),
    finalize_private_4k_master: placementProfile('render_worker', 2, 3_600),
    qa_private_4k_master: placementProfile('qa_worker', 2, 3_600),
  } satisfies Record<ProfessionalLongFormWorkItemKind, ReturnType<typeof placementProfile>>
  return profiles[kind]
}

function placementProfile(
  type: 'api_service' | 'cpu_analysis_worker' | 'render_worker' | 'qa_worker',
  maxAttempts: number,
  attemptTimeoutSeconds: number,
) {
  const resources = {
    api_service: {
      resourceClassId: 'control_plane_cpu_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_service' as const,
    },
    cpu_analysis_worker: {
      resourceClassId: 'cpu_analysis_standard_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_job' as const,
    },
    render_worker: {
      resourceClassId: 'render_cpu_high_memory_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_job' as const,
    },
    qa_worker: {
      resourceClassId: 'qa_cpu_standard_v1' as const,
      plannedCloudExecutionTarget: 'cloud_run_job' as const,
    },
  }
  const workerConcurrencyLimit =
    workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[type]
  if (!Number.isSafeInteger(workerConcurrencyLimit) || workerConcurrencyLimit <= 0) {
    throw new Error(`Professional long-form child placement lacks ${type} concurrency.`)
  }
  return {
    workerType: type,
    ...resources[type],
    preferredAccelerator: 'none' as const,
    cpuAllowed: true as const,
    workerConcurrencyLimit,
    globalConcurrencyLimit: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    maxAttempts,
    attemptTimeoutSeconds,
  }
}

function countWorker(
  placements: readonly { workerType: string }[],
  type: string,
): number {
  return placements.filter((placement) => placement.workerType === type).length
}

function assertPackageHash(value: CanonicalProfessionalLongFormChildPackage): void {
  const { packageHash, ...payload } = value
  if (packageHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional long-form child package hash is invalid.')
  }
}

function assertPlacementManifestHash(
  value: CanonicalProfessionalLongFormChildPlacementManifest,
): void {
  const { manifestHash, ...payload } = value
  if (
    manifestHash !== sha256AuthorityValue(payload) ||
    value.placements.some((placement) => {
      const { placementHash, ...placementPayload } = placement
      return placementHash !== sha256AuthorityValue(placementPayload)
    })
  ) {
    throw new Error('Professional long-form child placement hash is invalid.')
  }
}

function assertBlobRef(ref: AuthorityJsonBlobRef, value: unknown): void {
  if (
    ref.sha256 !== sha256AuthorityValue(value) ||
    ref.byteLength !== Buffer.byteLength(stableAuthorityStringify(value), 'utf8')
  ) {
    throw new Error('Professional long-form child authority blob reference is invalid.')
  }
}
