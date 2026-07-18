import { z } from 'zod'

import {
  PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
  PROFESSIONAL_LONG_FORM_GLOBAL_WORK_ITEM_COUNT,
  PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
  deriveProfessionalLongFormObjectPlanSeed,
  verifyProfessionalLongFormObjectExecutionPlan,
  type ProfessionalLongFormObjectExecutionPlan,
} from './professional-long-form-object-execution-plan'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION =
  'professional-long-form-approved-snapshot-bridge-v1' as const
export const PROFESSIONAL_LONG_FORM_CONTROLLER_INPUT_VERSION =
  'professional-long-form-controller-input-v1' as const
export const PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY =
  'professionalLongFormObjectPlanSeed' as const
export const PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS =
  'professional-long-form-object-graph-controller-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const jsonBlobRefSchema = z.object({
  sha256,
  byteLength: z.number().int().positive().max(2 * 1024 * 1024),
}).strict()

const approvedSnapshotSchema = z.object({
  schemaVersion: z.literal('private-edit-authority-approved-snapshot-v3'),
  snapshotId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  planId: identity,
  planVersion: z.number().int().positive(),
  estimateId: identity,
  approvalId: identity,
  reservationId: identity,
  approvedByUserId: identity,
  approvedAt: z.string().datetime({ offset: true }),
  componentRefs: z.record(z.string(), jsonBlobRefSchema),
  approvedWorkItemIds: z.array(identity)
    .min(1)
    .max(PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING),
  planHash: sha256,
  estimateHash: sha256,
  workGraphHash: sha256,
  sourceSequenceHash: sha256,
  timingHash: sha256,
  approvedAssetManifestRef: jsonBlobRefSchema,
  approvedAssetManifestHash: sha256,
  approvedSourceAssetManifestRef: jsonBlobRefSchema,
  approvedSourceAssetManifestHash: sha256,
  snapshotHash: sha256,
}).strict()

const controllerExecutionInputSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_CONTROLLER_INPUT_VERSION),
  capacityProfileId: z.literal(PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID),
  planSeedComponentKey: z.literal(PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY),
  planSeedHash: sha256,
  planSeedComponentRefSha256: sha256,
  maximumExpandedWorkItems: z.literal(
    PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
  ),
  maximumExpandedDependencies: z.literal(
    PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  ),
  expansionMode: z.literal('deterministic_post_approval_child_graph_v1'),
  approvedSnapshotRequired: z.literal(true),
  fundedReservationRequired: z.literal(true),
  childExecutionAuthorized: z.literal(false),
}).strict()

const controllerBindingSchema = z.object({
  source: z.literal('server_loaded_approved_work_item_view'),
  approvedWorkItemId: identity,
  sourceWorkItemId: identity,
  snapshotId: identity,
  workItemKey: identity,
  workItemType: z.literal('custom'),
  workerClass: z.literal(PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS),
  required: z.literal(true),
  maximumAttempts: z.literal(1),
  executionInputRef: jsonBlobRefSchema,
  executionInput: controllerExecutionInputSchema,
}).strict()

export const professionalLongFormApprovedSnapshotBridgeRequestSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION),
  snapshot: approvedSnapshotSchema,
  controllerBinding: controllerBindingSchema,
  plan: z.unknown(),
}).strict()

export type ProfessionalLongFormApprovedSnapshotBridgeRequest = z.infer<
  typeof professionalLongFormApprovedSnapshotBridgeRequestSchema
>

export interface ProfessionalLongFormApprovedSnapshotBridge {
  schemaVersion: typeof PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION
  source: 'server_owned_post_approval_long_form_expansion_contract'
  status: 'approved_snapshot_binding_contract_ready_persistence_and_execution_blocked'
  binding: {
    request: ProfessionalLongFormApprovedSnapshotBridgeRequest
    plan: ProfessionalLongFormObjectExecutionPlan
    planSeedHash: string
    controllerExecutionInputHash: string
  }
  expandedGraph: {
    parentApprovedWorkGraphHash: string
    childWorkGraphHash: string
    childWorkItemIds: string[]
    childWorkItemCount: number
    chunkCount: number
    chunkRenderCount: number
    chunkQaCount: number
    maximumDependencyCount: number
    canonicalWorkItemCeiling: number
    canonicalDependencyCeiling: number
    exactExpandedGraphHash: string
  }
  authority: {
    approvedSnapshotHashVerified: true
    approvedPlanHashVerified: true
    approvedEstimateHashVerified: true
    approvedTimingHashVerified: true
    fundedReservationIdentityVerified: true
    approvedControllerIdentityVerified: true
    snapshotIndependentSeedVerified: true
    childGraphFitsCanonicalCapacity: true
    everyChunkHasIndependentQaWorkItem: true
    finalizerDependsOnEveryChunkQa: true
    exactReplayRequired: true
  }
  readiness: {
    approvedSnapshotBindingContractReady: true
    canonicalSeedComponentPersistenceVerified: false
    serverLoadedControllerPersistenceVerified: false
    childJobDerivationVerified: false
    objectStorePersistenceVerified: false
    childPackageQueuePersistenceVerified: false
    mediaExecutionVerified: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    productReady: false
    productionReady: false
  }
  authorityHash: string
}

export function buildProfessionalLongFormApprovedSnapshotBridge(
  input: unknown,
): ProfessionalLongFormApprovedSnapshotBridge {
  const request = professionalLongFormApprovedSnapshotBridgeRequestSchema.parse(input)
  const { snapshotHash, ...snapshotWithoutHash } = request.snapshot
  if (snapshotHash !== sha256AuthorityValue(snapshotWithoutHash)) {
    throw new Error('Professional long-form approved snapshot hash is invalid.')
  }

  const plan = verifyProfessionalLongFormObjectExecutionPlan(request.plan)
  const seed = deriveProfessionalLongFormObjectPlanSeed(plan.request)
  const planSeedHash = sha256AuthorityValue(seed)
  const seedComponentRef = request.snapshot.componentRefs[
    PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY
  ]
  const controllerInputHash = sha256AuthorityValue(
    request.controllerBinding.executionInput,
  )

  if (
    !seedComponentRef ||
    seedComponentRef.sha256 !== planSeedHash ||
    plan.planSeedHash !== planSeedHash ||
    request.controllerBinding.executionInput.planSeedHash !== planSeedHash ||
    request.controllerBinding.executionInput.planSeedComponentRefSha256 !==
      seedComponentRef.sha256 ||
    request.controllerBinding.executionInputRef.sha256 !== controllerInputHash
  ) {
    throw new Error(
      'Professional long-form seed or controller execution-input authority is invalid.',
    )
  }

  const approvedIdentity = plan.request.identity
  if (
    approvedIdentity.workspaceId !== request.snapshot.workspaceId ||
    approvedIdentity.projectId !== request.snapshot.projectId ||
    approvedIdentity.editSessionId !== request.snapshot.editSessionId ||
    approvedIdentity.approvedPlanId !== request.snapshot.planId ||
    approvedIdentity.approvedPlanHash !== request.snapshot.planHash ||
    approvedIdentity.approvedPlanSnapshotId !== request.snapshot.snapshotId ||
    approvedIdentity.approvedPlanSnapshotHash !== request.snapshot.snapshotHash ||
    approvedIdentity.approvedEstimateId !== request.snapshot.estimateId ||
    approvedIdentity.approvedEstimateHash !== request.snapshot.estimateHash ||
    approvedIdentity.approvalRecordId !== request.snapshot.approvalId ||
    approvedIdentity.creditReservationId !== request.snapshot.reservationId ||
    approvedIdentity.approvedWorkGraphHash !== request.snapshot.workGraphHash ||
    approvedIdentity.approvedTimingHash !== request.snapshot.timingHash ||
    request.controllerBinding.snapshotId !== request.snapshot.snapshotId ||
    !request.snapshot.approvedWorkItemIds.includes(
      request.controllerBinding.approvedWorkItemId,
    )
  ) {
    throw new Error(
      'Professional long-form plan is not bound to the exact approved snapshot lineage.',
    )
  }

  const childWorkItemIds = plan.workGraph.workItems.map((item) => item.workItemId)
  const childWorkItemIdSet = new Set(childWorkItemIds)
  const maximumDependencyCount = Math.max(
    0,
    ...plan.workGraph.workItems.map((item) => item.dependsOn.length),
  )
  const invalidDependency = plan.workGraph.workItems.some((item) =>
    item.dependsOn.some((dependencyId) => !childWorkItemIdSet.has(dependencyId)))
  const chunkQaIds = plan.workGraph.workItems
    .filter((item) => item.kind === 'qa_object_mezzanine_chunk')
    .map((item) => item.workItemId)
  const finalizer = plan.workGraph.workItems.find((item) =>
    item.kind === 'finalize_private_4k_master')
  const expectedWorkItemCount = plan.chunks.length * 2 +
    PROFESSIONAL_LONG_FORM_GLOBAL_WORK_ITEM_COUNT
  if (
    childWorkItemIdSet.size !== childWorkItemIds.length ||
    invalidDependency ||
    plan.chunks.length > PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS ||
    plan.workGraph.workItemCount !== expectedWorkItemCount ||
    plan.workGraph.workItemCount > PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING ||
    maximumDependencyCount > PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING ||
    plan.workGraph.chunkQaCount !== plan.chunks.length ||
    chunkQaIds.length !== plan.chunks.length ||
    !finalizer ||
    chunkQaIds.some((workItemId) => !finalizer.dependsOn.includes(workItemId)) ||
    plan.workGraph.workItems.some((item) => item.executionAuthorized)
  ) {
    throw new Error(
      'Professional long-form child graph exceeds canonical capacity or lost immutable QA/dependency authority.',
    )
  }

  const exactExpandedGraphHash = sha256AuthorityValue({
    snapshotHash: request.snapshot.snapshotHash,
    approvedControllerWorkItemId: request.controllerBinding.approvedWorkItemId,
    controllerExecutionInputHash: controllerInputHash,
    planSeedHash,
    childWorkGraphHash: plan.workGraph.workGraphHash,
    childWorkItemIds,
  })
  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
    source: 'server_owned_post_approval_long_form_expansion_contract' as const,
    status:
      'approved_snapshot_binding_contract_ready_persistence_and_execution_blocked' as const,
    binding: {
      request: {
        ...request,
        plan,
      },
      plan,
      planSeedHash,
      controllerExecutionInputHash: controllerInputHash,
    },
    expandedGraph: {
      parentApprovedWorkGraphHash: request.snapshot.workGraphHash,
      childWorkGraphHash: plan.workGraph.workGraphHash,
      childWorkItemIds,
      childWorkItemCount: plan.workGraph.workItemCount,
      chunkCount: plan.chunks.length,
      chunkRenderCount: plan.workGraph.chunkRenderCount,
      chunkQaCount: plan.workGraph.chunkQaCount,
      maximumDependencyCount,
      canonicalWorkItemCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
      canonicalDependencyCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
      exactExpandedGraphHash,
    },
    authority: {
      approvedSnapshotHashVerified: true as const,
      approvedPlanHashVerified: true as const,
      approvedEstimateHashVerified: true as const,
      approvedTimingHashVerified: true as const,
      fundedReservationIdentityVerified: true as const,
      approvedControllerIdentityVerified: true as const,
      snapshotIndependentSeedVerified: true as const,
      childGraphFitsCanonicalCapacity: true as const,
      everyChunkHasIndependentQaWorkItem: true as const,
      finalizerDependsOnEveryChunkQa: true as const,
      exactReplayRequired: true as const,
    },
    readiness: {
      approvedSnapshotBindingContractReady: true as const,
      canonicalSeedComponentPersistenceVerified: false as const,
      serverLoadedControllerPersistenceVerified: false as const,
      childJobDerivationVerified: false as const,
      objectStorePersistenceVerified: false as const,
      childPackageQueuePersistenceVerified: false as const,
      mediaExecutionVerified: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return {
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  }
}

export function verifyProfessionalLongFormApprovedSnapshotBridge(
  input: unknown,
): ProfessionalLongFormApprovedSnapshotBridge {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Professional long-form approved snapshot bridge is malformed.')
  }
  const record = input as Record<string, unknown>
  if (
    record.schemaVersion !== PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION ||
    typeof record.authorityHash !== 'string'
  ) {
    throw new Error('Professional long-form approved snapshot bridge identity is invalid.')
  }
  const binding = record.binding
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
    throw new Error('Professional long-form approved snapshot bridge binding is missing.')
  }
  const request = (binding as Record<string, unknown>).request
  const expected = buildProfessionalLongFormApprovedSnapshotBridge(request)
  if (stableAuthorityStringify(expected) !== stableAuthorityStringify(input)) {
    throw new Error(
      'Professional long-form approved snapshot bridge failed exact authority verification.',
    )
  }
  return expected
}

export function assertProfessionalLongFormApprovedSnapshotProductionAuthority(
  input: unknown,
): never {
  verifyProfessionalLongFormApprovedSnapshotBridge(input)
  throw new Error(
    'Professional long-form snapshot binding does not authorize persistence, job dispatch, object storage, media execution, cloud, product, or production use.',
  )
}
