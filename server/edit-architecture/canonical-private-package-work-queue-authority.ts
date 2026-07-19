import { z } from 'zod'

import type { CanonicalApprovedEditExecutionPackage } from './canonical-approved-edit-execution-package'
import type { CanonicalPrivateResourcePlacementManifest } from './canonical-private-resource-placement-authority'
import {
  PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID,
  PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
  PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
} from './professional-long-form-approved-snapshot-bridge'
import { PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID } from
  './professional-long-form-object-execution-plan'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION =
  'canonical-private-package-work-queue-definition-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_QUEUE_SOURCE =
  'canonical_professional_long_form_private_master_qa_delivery_package' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE =
  'canonical_professional_long_form_customer_delivery_exact_runner_cost_qa_authority' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID =
  'canonical-professional-long-form-customer-delivery-placement-blocked-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID =
  'canonical-professional-long-form-customer-delivery-attempt-policy-v1' as const
export const CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID =
  'canonical-professional-long-form-customer-delivery-exact-tool-binding-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const expectedOutputIdentity = z.string().trim().min(1).max(512)

export const canonicalPrivatePackageWorkQueueJobDefinitionSchema = z.object({
  canonicalOrder: z.number().int().nonnegative().max(255),
  jobId: identity,
  approvedWorkItemId: identity,
  workItemKey: identity,
  expectedOutputIdentity: expectedOutputIdentity.optional(),
  required: z.boolean(),
  dependencyJobIds: z.array(identity).max(128),
  satisfiedPromotionDependencyJobIds: z.array(identity).max(1).optional(),
  workerType: z.enum([
    'api_service',
    'cpu_analysis_worker',
    'gpu_ai_worker',
    'render_worker',
    'qa_worker',
    'tool_readiness_worker',
  ]),
  resourceClassId: z.enum([
    'control_plane_cpu_v1',
    'cpu_analysis_standard_v1',
    'gpu_l4_standard_v1',
    'render_cpu_high_memory_v1',
    'qa_cpu_standard_v1',
    'tool_readiness_cpu_v1',
  ]),
  plannedCloudExecutionTarget: z.enum(['cloud_run_service', 'cloud_run_job']),
  preferredAccelerator: z.enum(['none', 'nvidia_l4']),
  placementHash: sha256,
  privateExecutionReady: z.boolean(),
  providerExecutionMode: z.enum(['none', 'primary', 'fallback', 'final_fallback']),
  requiredGate: identity.optional(),
  maxAttempts: z.number().int().positive().max(10),
  attemptTimeoutSeconds: z.number().int().positive().max(86_400),
  scheduledFor: z.string().datetime({ offset: true }),
  definitionHash: sha256,
}).strict()

const professionalLongFormQueueAuthoritySchema = z.object({
  capacityProfileId: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID),
  planSeedHash: sha256,
  bridgeAuthorityHash: sha256,
  childJobManifestHash: sha256,
  childJobManifestRefSha256: sha256,
  childPackageRefSha256: sha256,
  childPlacementManifestRefSha256: sha256,
  parentControllerApprovedWorkItemId: identity,
  parentControllerJobId: identity,
  childJobCount: z.number().int().positive().max(256),
  rootChildJobCount: z.number().int().positive().max(256),
  childPackagePlacementProfileId: z.literal(
    PROFESSIONAL_LONG_FORM_CHILD_PACKAGE_PLACEMENT_PROFILE_ID,
  ),
  childAttemptPolicyId: z.literal(PROFESSIONAL_LONG_FORM_CHILD_ATTEMPT_POLICY_ID),
  childToolOperationBindingPolicyId: z.literal(
    PROFESSIONAL_LONG_FORM_CHILD_TOOL_OPERATION_BINDING_POLICY_ID,
  ),
  childToolOperationAuthorityStatus: z.literal(
    'blocked_pending_exact_tool_operation_cost_and_runner_authority',
  ),
  childExecutionAuthorized: z.literal(false),
}).strict()

const professionalLongFormCustomerDeliveryQueueAuthoritySchema = z.object({
  capacityProfileId: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID),
  sourceReviewPackageRecordId: identity,
  sourceReviewPackageHash: sha256,
  sourceReviewQueueDefinitionHash: sha256,
  sourceReviewQueueAggregateHash: sha256,
  sourcePrivateMasterQaJobId: identity,
  sourcePrivateMasterQaApprovedWorkItemId: identity,
  sourcePrivateMasterQaQueueCompletionHash: sha256,
  sourcePrivateMasterQaCanonicalResultHash: sha256,
  sourcePrivateMasterQaArtifactHash: sha256,
  deliveryPackageVersion: z.literal(
    'canonical-professional-long-form-customer-delivery-package-v1',
  ),
  deliveryPackageHash: sha256,
  deliveryPackageRefSha256: sha256,
  deliveryPlacementManifestHash: sha256,
  deliveryPlacementManifestRefSha256: sha256,
  deliveryPackagePlacementProfileId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_PLACEMENT_PROFILE_ID,
  ),
  deliveryAttemptPolicyId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_ATTEMPT_POLICY_ID,
  ),
  deliveryToolOperationBindingPolicyId: z.literal(
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_TOOL_BINDING_POLICY_ID,
  ),
  chunkCount: z.number().int().min(2).max(124),
  deliveryJobCount: z.number().int().min(9).max(253),
  rootDeliveryJobCount: z.literal(1),
  deliveryExecutionAuthorized: z.literal(false),
}).strict().superRefine((authority, context) => {
  if (authority.deliveryJobCount !== authority.chunkCount * 2 + 5) {
    context.addIssue({
      code: 'custom',
      message: 'Professional long-form customer-delivery job capacity is inconsistent.',
    })
  }
})

export const canonicalPrivatePackageWorkQueueIdentitySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  packageRecordId: identity,
  approvedPlanSnapshotId: identity,
  packageHash: sha256,
  snapshotHash: sha256,
  workGraphHash: sha256,
  placementManifestHash: sha256,
  toolExecutionAuthorityHash: sha256,
  approvedResourcePlacementAuthorityHash: sha256,
  professionalLongFormAuthority: professionalLongFormQueueAuthoritySchema.optional(),
  professionalLongFormCustomerDeliveryAuthority:
    professionalLongFormCustomerDeliveryQueueAuthoritySchema.optional(),
}).strict()

export const canonicalPrivatePackageWorkQueueDefinitionSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION),
  source: z.enum([
    'canonical_execution_package_and_snapshot_resource_placement',
    'canonical_professional_long_form_child_package_promotion',
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_QUEUE_SOURCE,
  ]),
  identity: canonicalPrivatePackageWorkQueueIdentitySchema,
  jobs: z.array(canonicalPrivatePackageWorkQueueJobDefinitionSchema).min(1).max(256),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    requiredJobCount: z.number().int().nonnegative().max(256),
    cpuAnalysisJobCount: z.number().int().nonnegative().max(256),
    gpuJobCount: z.number().int().nonnegative().max(256),
    renderJobCount: z.number().int().nonnegative().max(256),
    allJobsHaveSnapshotBoundPlacement: z.literal(true),
    callerSelectedJobs: z.literal(false),
    callerSelectedDependencies: z.literal(false),
    callerSelectedPlacement: z.literal(false),
  }).strict(),
  boundaries: z.object({
    approvedSnapshotRequired: z.literal(true),
    fundedReservationRequired: z.literal(true),
    privateArtifactsQaAndReconciliationRequired: z.literal(true),
    browserClaimAllowed: z.literal(false),
    providerActivationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    googleCloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  definitionHash: sha256,
}).strict().superRefine((definition, context) => {
  const professionalLongForm = definition.identity.professionalLongFormAuthority
  const customerDelivery =
    definition.identity.professionalLongFormCustomerDeliveryAuthority
  const professionalSource = definition.source ===
    'canonical_professional_long_form_child_package_promotion'
  const customerDeliverySource = definition.source ===
    CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_QUEUE_SOURCE
  const ordinarySource = definition.source ===
    'canonical_execution_package_and_snapshot_resource_placement'
  if (
    (ordinarySource && (professionalLongForm || customerDelivery)) ||
    (professionalSource && (!professionalLongForm || customerDelivery)) ||
    (customerDeliverySource && (!customerDelivery || professionalLongForm))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical work-queue source and specialized authority disagree.',
    })
  }
  if (
    definition.jobs.length !== definition.summary.totalJobCount ||
    definition.jobs.filter((job) => job.required).length !== definition.summary.requiredJobCount ||
    definition.jobs.filter((job) => job.workerType === 'cpu_analysis_worker').length !==
      definition.summary.cpuAnalysisJobCount ||
    definition.jobs.filter((job) => job.workerType === 'gpu_ai_worker').length !==
      definition.summary.gpuJobCount ||
    definition.jobs.filter((job) => job.workerType === 'render_worker').length !==
      definition.summary.renderJobCount
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue definition summary is inconsistent.' })
  }
  if (
    new Set(definition.jobs.map((job) => job.jobId)).size !== definition.jobs.length ||
    definition.jobs.some((job, index) => job.canonicalOrder !== index)
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue job identity or order is invalid.' })
  }
  const jobIds = new Set(definition.jobs.map((job) => job.jobId))
  if (definition.jobs.some((job) =>
    job.dependencyJobIds.includes(job.jobId) ||
    job.dependencyJobIds.some((dependencyJobId) => !jobIds.has(dependencyJobId)))) {
    context.addIssue({ code: 'custom', message: 'Canonical work-queue dependency identity is invalid.' })
  }
  if (ordinarySource) {
    if (definition.jobs.some((job) => job.satisfiedPromotionDependencyJobIds !== undefined)) {
      context.addIssue({
        code: 'custom',
        message: 'Ordinary canonical queue jobs cannot contain promotion-satisfied dependencies.',
      })
    }
    return
  }
  if (customerDelivery) {
    const promotionSatisfied = definition.jobs.filter((job) =>
      job.satisfiedPromotionDependencyJobIds?.length === 1)
    if (
      definition.identity.packageHash !== customerDelivery.deliveryPackageHash ||
      definition.identity.placementManifestHash !==
        customerDelivery.deliveryPlacementManifestHash ||
      definition.identity.packageRecordId ===
        customerDelivery.sourceReviewPackageRecordId ||
      definition.jobs.length !== customerDelivery.deliveryJobCount ||
      promotionSatisfied.length !== customerDelivery.rootDeliveryJobCount ||
      definition.jobs.some((job) =>
        job.satisfiedPromotionDependencyJobIds === undefined ||
        !job.expectedOutputIdentity ||
        job.satisfiedPromotionDependencyJobIds.some((dependencyJobId) =>
          dependencyJobId !== customerDelivery.sourcePrivateMasterQaJobId) ||
        job.dependencyJobIds.includes(customerDelivery.sourcePrivateMasterQaJobId) ||
        job.privateExecutionReady ||
        job.providerExecutionMode !== 'none' ||
        job.requiredGate !==
          CANONICAL_PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_REQUIRED_GATE)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Professional long-form customer-delivery queue lost its blocked source-QA authority.',
      })
    }
    return
  }
  if (!professionalLongForm) return
  const promotionSatisfied = definition.jobs.filter((job) =>
    job.satisfiedPromotionDependencyJobIds?.length === 1)
  if (
    definition.jobs.length !== professionalLongForm.childJobCount ||
    promotionSatisfied.length !== professionalLongForm.rootChildJobCount ||
    definition.jobs.some((job) =>
      job.satisfiedPromotionDependencyJobIds === undefined ||
      !job.expectedOutputIdentity ||
      job.satisfiedPromotionDependencyJobIds.some((dependencyJobId) =>
        dependencyJobId !== professionalLongForm.parentControllerJobId) ||
      job.dependencyJobIds.includes(professionalLongForm.parentControllerJobId) ||
      job.privateExecutionReady ||
      job.providerExecutionMode !== 'none' ||
      job.requiredGate !==
        'canonical_professional_long_form_exact_tool_cost_runner_and_qa_authority')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Professional long-form child queue lost its blocked promotion authority.',
    })
  }
})

export type CanonicalPrivatePackageWorkQueueDefinition = z.infer<
  typeof canonicalPrivatePackageWorkQueueDefinitionSchema
>
export type CanonicalPrivatePackageWorkQueueJobDefinition = z.infer<
  typeof canonicalPrivatePackageWorkQueueJobDefinitionSchema
>

export function createCanonicalPrivatePackageWorkQueueDefinition(input: {
  executionPackage: CanonicalApprovedEditExecutionPackage
  placementManifest: CanonicalPrivateResourcePlacementManifest
}): CanonicalPrivatePackageWorkQueueDefinition {
  const { executionPackage, placementManifest } = input
  if (
    placementManifest.identity.packageRecordId !== executionPackage.packageRecordId ||
    placementManifest.identity.workspaceId !== executionPackage.workspaceId ||
    placementManifest.identity.projectId !== executionPackage.projectId ||
    placementManifest.identity.editSessionId !== executionPackage.editSessionId ||
    placementManifest.identity.approvedPlanSnapshotId !== executionPackage.approvedPlanSnapshotId ||
    placementManifest.identity.snapshotHash !== executionPackage.snapshotHash ||
    placementManifest.identity.workGraphHash !== executionPackage.workGraphHash ||
    placementManifest.placements.length !== executionPackage.jobs.length ||
    executionPackage.reservationStatus !== 'reserved' ||
    executionPackage.remainingReservedCredits <= 0
  ) {
    throw new Error('Canonical work queue requires one exact funded package and placement manifest.')
  }

  const workItems = new Map(executionPackage.approvedWorkItems.map((workItem) =>
    [workItem.id, workItem]))
  const placements = new Map(placementManifest.placements.map((placement) =>
    [placement.jobId, placement]))
  const jobs = executionPackage.jobs.map((job, canonicalOrder) => {
    const workItem = workItems.get(job.approvedWorkItemId)
    const placement = placements.get(job.id)
    if (
      !workItem || !placement ||
      job.workItemKey !== workItem.workItemKey ||
      placement.approvedWorkItemId !== workItem.id ||
      placement.workItemKey !== workItem.workItemKey ||
      placement.required !== workItem.required ||
      placement.workerType === undefined
    ) {
      throw new Error('Canonical work queue cannot admit a job without exact private placement authority.')
    }
    const withoutHash = {
      canonicalOrder,
      jobId: job.id,
      approvedWorkItemId: job.approvedWorkItemId,
      workItemKey: job.workItemKey,
      required: workItem.required,
      dependencyJobIds: [...job.dependencyJobIds],
      workerType: placement.workerType,
      resourceClassId: placement.resourceClassId,
      plannedCloudExecutionTarget: placement.plannedCloudExecutionTarget,
      preferredAccelerator: placement.preferredAccelerator,
      placementHash: placement.placementHash,
      privateExecutionReady: placement.privateExecutionReady,
      providerExecutionMode: placement.providerExecutionMode,
      ...(placement.requiredGate ? { requiredGate: placement.requiredGate } : {}),
      maxAttempts: job.maxAttempts,
      attemptTimeoutSeconds: job.attemptTimeoutSeconds,
      scheduledFor: job.scheduledFor,
    }
    return canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
      ...withoutHash,
      definitionHash: sha256AuthorityValue(withoutHash),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: executionPackage.workspaceId,
      projectId: executionPackage.projectId,
      editSessionId: executionPackage.editSessionId,
      packageRecordId: executionPackage.packageRecordId,
      approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
      packageHash: executionPackage.packageHash,
      snapshotHash: executionPackage.snapshotHash,
      workGraphHash: executionPackage.workGraphHash,
      placementManifestHash: placementManifest.manifestHash,
      toolExecutionAuthorityHash: placementManifest.identity.toolExecutionAuthorityHash,
      approvedResourcePlacementAuthorityHash:
        placementManifest.identity.approvedResourcePlacementAuthorityHash,
    },
    jobs,
    summary: {
      totalJobCount: jobs.length,
      requiredJobCount: jobs.filter((job) => job.required).length,
      cpuAnalysisJobCount: jobs.filter((job) => job.workerType === 'cpu_analysis_worker').length,
      gpuJobCount: jobs.filter((job) => job.workerType === 'gpu_ai_worker').length,
      renderJobCount: jobs.filter((job) => job.workerType === 'render_worker').length,
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

export function assertCanonicalPrivatePackageWorkQueueDefinition(input: {
  value: unknown
  executionPackage: CanonicalApprovedEditExecutionPackage
  placementManifest: CanonicalPrivateResourcePlacementManifest
}): CanonicalPrivatePackageWorkQueueDefinition {
  const parsed = canonicalPrivatePackageWorkQueueDefinitionSchema.safeParse(input.value)
  if (!parsed.success) throw new Error('Canonical package work-queue definition is invalid.')
  const { definitionHash, ...payload } = parsed.data
  if (
    definitionHash !== sha256AuthorityValue(payload) ||
    parsed.data.jobs.some((job) => {
      const { definitionHash: jobHash, ...jobPayload } = job
      return jobHash !== sha256AuthorityValue(jobPayload)
    })
  ) throw new Error('Canonical package work-queue definition hash is invalid.')
  const current = createCanonicalPrivatePackageWorkQueueDefinition(input)
  if (stableAuthorityStringify(parsed.data) !== stableAuthorityStringify(current)) {
    throw new Error('Canonical package work-queue definition no longer matches immutable authority.')
  }
  return parsed.data
}
