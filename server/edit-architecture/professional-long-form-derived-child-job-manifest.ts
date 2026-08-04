import { z } from 'zod'

import {
  PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
  verifyProfessionalLongFormApprovedSnapshotBridge,
  type ProfessionalLongFormApprovedSnapshotBridge,
} from './professional-long-form-approved-snapshot-bridge'
import {
  PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
  PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS,
} from './professional-long-form-object-execution-plan'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const PROFESSIONAL_LONG_FORM_DERIVED_CHILD_JOB_MANIFEST_VERSION =
  'professional-long-form-derived-child-job-manifest-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const derivedChildJobSchema = z.object({
  jobId: identity,
  approvedPlanSnapshotId: identity,
  creditReservationId: identity,
  parentControllerApprovedWorkItemId: identity,
  parentControllerJobId: identity,
  childWorkItemId: identity,
  kind: z.enum(PROFESSIONAL_LONG_FORM_WORK_ITEM_KINDS),
  expectedOutputIdentity: z.string().trim().min(1).max(512),
  dependencyJobIds: z.array(identity)
    .max(PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING),
  required: z.literal(true),
  derivationStatus: z.literal('derived_execution_blocked'),
  canonicalPackageQueuePersisted: z.literal(false),
  dispatchAuthorized: z.literal(false),
  executionAuthorized: z.literal(false),
  jobAuthorityHash: sha256,
}).strict()

export const professionalLongFormDerivedChildJobManifestSchema = z.object({
  schemaVersion: z.literal(PROFESSIONAL_LONG_FORM_DERIVED_CHILD_JOB_MANIFEST_VERSION),
  source: z.literal('server_derived_from_persisted_approved_long_form_controller'),
  status: z.literal('child_jobs_content_addressed_package_queue_and_execution_blocked'),
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
    planSeedHash: sha256,
    bridgeAuthorityHash: sha256,
    bridgeSchemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
    ),
  }).strict(),
  jobs: z.array(derivedChildJobSchema)
    .min(1)
    .max(PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING),
  summary: z.object({
    childJobCount: z.number().int().positive()
      .max(PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING),
    rootChildJobCount: z.number().int().positive(),
    maximumDependencyCount: z.number().int().positive()
      .max(PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING),
    canonicalWorkItemCeiling: z.literal(
      PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
    ),
    canonicalDependencyCeiling: z.literal(
      PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
    ),
    everyChildRequiresParentControllerLineage: z.literal(true),
    everyChildExecutionBlocked: z.literal(true),
  }).strict(),
  readiness: z.object({
    canonicalSeedComponentPersistenceVerified: z.literal(true),
    serverLoadedControllerPersistenceVerified: z.literal(true),
    childJobDerivationVerified: z.literal(true),
    childJobManifestPersistenceVerified: z.literal(false),
    childPackageQueuePersistenceVerified: z.literal(false),
    dispatchVerified: z.literal(false),
    mediaExecutionVerified: z.literal(false),
    objectStorePersistenceVerified: z.literal(false),
    distributedDatabaseVerified: z.literal(false),
    liveGoogleCloudVerified: z.literal(false),
    productReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  manifestHash: sha256,
}).strict()

export type ProfessionalLongFormDerivedChildJobManifest = z.infer<
  typeof professionalLongFormDerivedChildJobManifestSchema
>

export function buildProfessionalLongFormDerivedChildJobManifest(input: {
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  parentControllerApprovedWorkItemId: string
  parentControllerJobId: string
}): ProfessionalLongFormDerivedChildJobManifest {
  const bridge = verifyProfessionalLongFormApprovedSnapshotBridge(input.bridge)
  const snapshot = bridge.binding.request.snapshot
  if (!snapshot.approvedWorkItemIds.includes(input.parentControllerApprovedWorkItemId)) {
    throw new Error(
      'Professional long-form child jobs require the exact approved controller work item.',
    )
  }
  const childJobIds = new Map(bridge.binding.plan.workGraph.workItems.map((workItem) => [
    workItem.workItemId,
    `long-form-child-job-${sha256AuthorityValue({
      snapshotHash: snapshot.snapshotHash,
      parentControllerApprovedWorkItemId: input.parentControllerApprovedWorkItemId,
      childWorkItemId: workItem.workItemId,
      bridgeAuthorityHash: bridge.authorityHash,
    }).slice(0, 40)}`,
  ]))
  const jobsWithoutHashes = bridge.binding.plan.workGraph.workItems.map((workItem) => ({
    jobId: childJobIds.get(workItem.workItemId)!,
    approvedPlanSnapshotId: snapshot.snapshotId,
    creditReservationId: snapshot.reservationId,
    parentControllerApprovedWorkItemId: input.parentControllerApprovedWorkItemId,
    parentControllerJobId: input.parentControllerJobId,
    childWorkItemId: workItem.workItemId,
    kind: workItem.kind,
    expectedOutputIdentity: workItem.expectedOutputIdentity,
    dependencyJobIds: workItem.dependsOn.length === 0
      ? [input.parentControllerJobId]
      : workItem.dependsOn.map((dependencyId) => childJobIds.get(dependencyId)!),
    required: true as const,
    derivationStatus: 'derived_execution_blocked' as const,
    canonicalPackageQueuePersisted: false as const,
    dispatchAuthorized: false as const,
    executionAuthorized: false as const,
  }))
  const jobs = jobsWithoutHashes.map((job) => ({
    ...job,
    jobAuthorityHash: sha256AuthorityValue(job),
  }))
  const rootChildJobCount = bridge.binding.plan.workGraph.workItems.filter((workItem) =>
    workItem.dependsOn.length === 0).length
  const maximumDependencyCount = Math.max(...jobs.map((job) =>
    job.dependencyJobIds.length))
  if (
    new Set(jobs.map((job) => job.jobId)).size !== jobs.length ||
    jobs.some((job) => job.dependencyJobIds.some((dependencyJobId) =>
      dependencyJobId !== input.parentControllerJobId &&
      !jobs.some((candidate) => candidate.jobId === dependencyJobId))) ||
    maximumDependencyCount > PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING
  ) {
    throw new Error(
      'Professional long-form derived child-job graph lost canonical identity or dependency bounds.',
    )
  }

  const payload = {
    schemaVersion: PROFESSIONAL_LONG_FORM_DERIVED_CHILD_JOB_MANIFEST_VERSION,
    source: 'server_derived_from_persisted_approved_long_form_controller' as const,
    status: 'child_jobs_content_addressed_package_queue_and_execution_blocked' as const,
    identity: {
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      approvedPlanId: snapshot.planId,
      approvedPlanSnapshotId: snapshot.snapshotId,
      approvedPlanSnapshotHash: snapshot.snapshotHash,
      approvedEstimateId: snapshot.estimateId,
      creditReservationId: snapshot.reservationId,
      parentControllerApprovedWorkItemId: input.parentControllerApprovedWorkItemId,
      parentControllerJobId: input.parentControllerJobId,
      planSeedHash: bridge.binding.planSeedHash,
      bridgeAuthorityHash: bridge.authorityHash,
      bridgeSchemaVersion: PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
    },
    jobs,
    summary: {
      childJobCount: jobs.length,
      rootChildJobCount,
      maximumDependencyCount,
      canonicalWorkItemCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
      canonicalDependencyCeiling: PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
      everyChildRequiresParentControllerLineage: true as const,
      everyChildExecutionBlocked: true as const,
    },
    readiness: {
      canonicalSeedComponentPersistenceVerified: true as const,
      serverLoadedControllerPersistenceVerified: true as const,
      childJobDerivationVerified: true as const,
      childJobManifestPersistenceVerified: false as const,
      childPackageQueuePersistenceVerified: false as const,
      dispatchVerified: false as const,
      mediaExecutionVerified: false as const,
      objectStorePersistenceVerified: false as const,
      distributedDatabaseVerified: false as const,
      liveGoogleCloudVerified: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
  }
  return professionalLongFormDerivedChildJobManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export function verifyProfessionalLongFormDerivedChildJobManifest(input: {
  manifest: unknown
  bridge: ProfessionalLongFormApprovedSnapshotBridge
  parentControllerApprovedWorkItemId: string
  parentControllerJobId: string
}): ProfessionalLongFormDerivedChildJobManifest {
  const parsed = professionalLongFormDerivedChildJobManifestSchema.parse(input.manifest)
  const expected = buildProfessionalLongFormDerivedChildJobManifest({
    bridge: input.bridge,
    parentControllerApprovedWorkItemId: input.parentControllerApprovedWorkItemId,
    parentControllerJobId: input.parentControllerJobId,
  })
  if (stableAuthorityStringify(parsed) !== stableAuthorityStringify(expected)) {
    throw new Error(
      'Professional long-form derived child-job manifest failed exact authority verification.',
    )
  }
  return expected
}

export function assertProfessionalLongFormDerivedChildJobsDispatchAuthority(
  input: Parameters<typeof verifyProfessionalLongFormDerivedChildJobManifest>[0],
): never {
  verifyProfessionalLongFormDerivedChildJobManifest(input)
  throw new Error(
    'Derived professional long-form child jobs are not package-queue, dispatch, media, cloud, product, or production authority.',
  )
}
