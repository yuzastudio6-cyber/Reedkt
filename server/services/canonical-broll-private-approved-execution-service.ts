import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  BrollCanonicalPrivateExecutionCoordinator,
  createBrollCanonicalPrivateRuntimeBindings,
  type BrollExistingSourceExecutionInput,
} from '../edit-skills/b-roll'
import {
  ACTIVE_QUALIFICATION_RANK,
  EditSkillRuntimeDispatcher,
  SkillJobRuntimeBindingRegistry,
  hashSkillValue,
  skillManifestReference,
  type EditSkillArtifactReference,
  type EditSkillArtifactStore,
  type EditSkillWorkResult,
  type RuntimeDispatchReceipt,
} from '../edit-skills/core'
import {
  editSkillArtifactSchemaRegistry,
  editSkillReferenceCatalog,
} from '../edit-skills/internal-fixture-runtime'
import {
  CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION,
  canonicalBrollSkillPlanComponentSchema,
} from '../edit-skills/b-roll/b-roll-canonical-plan-component'
import type { CanonicalWorkItemInput } from
  '../validation/edit-planning-authority-schemas'
import type { PrivateOfflineMediaBinaryRuntime } from
  '../tool-execution/media-binary-execution'
import type { PrivateOfflineRemotionRenderRuntime } from
  '../tool-execution/remotion-render-execution'
import {
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'
import { revalidateCanonicalBrollPlanAuthority } from
  './canonical-broll-plan-component-service'

export const CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION =
  'canonical-broll-private-approved-execution-service-v1' as const

type FullMediaRuntime = Pick<
  PrivateOfflineMediaBinaryRuntime,
  'execute' | 'executeServerInjected' |
  'executeVisualCalibrationObjectiveQaServerInjected'
>

export interface CanonicalBrollPrivateApprovedExecutionInput {
  localStorageRoot: string
  componentRef: AuthorityJsonBlobRef
  canonicalWorkItems: CanonicalWorkItemInput[]
  executionGate: BrollExistingSourceExecutionInput['gate']
  sourceBytes: Buffer
  captionOverlay: {
    reference: EditSkillArtifactReference
    bytes: Buffer
    reservedZoneCount: number
  }
  artifactStore: EditSkillArtifactStore
  mediaRuntime: FullMediaRuntime
  remotionRuntime: Pick<PrivateOfflineRemotionRenderRuntime, 'execute'>
  integrationInfrastructureCostMicros: number
  now?: () => string
}

export interface CanonicalBrollPrivateApprovedExecutionService {
  readonly schemaVersion:
    typeof CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION
  readonly componentVersion:
    typeof CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION
  readonly restartSafeAuthorityReread: true
  readonly exactApprovedSnapshotGateRequired: true
  readonly durableOutputArtifactStoreRequired: true
  readonly providerRequestAllowed: false
  executeWorkItem(workItemKey: string): Promise<{
    workResult: EditSkillWorkResult
    dispatchReceipt: RuntimeDispatchReceipt
  }>
  executeAll(): Promise<{
    workResults: readonly EditSkillWorkResult[]
    dispatchReceipts: readonly RuntimeDispatchReceipt[]
    runtimeSnapshot: ReturnType<
      BrollCanonicalPrivateExecutionCoordinator['snapshot']
    >
  }>
}

/**
 * Reconstructs the existing-source B-roll owner runtime from immutable V3
 * component data. It is an approved-work executor, not a planner or scheduler.
 */
export async function createCanonicalBrollPrivateApprovedExecutionService(
  input: CanonicalBrollPrivateApprovedExecutionInput,
): Promise<CanonicalBrollPrivateApprovedExecutionService> {
  if (input.artifactStore.storageClass !== 'durable') {
    throw new Error(
      'Canonical B-roll approved execution requires durable artifact storage.',
    )
  }
  const rawComponent = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref: input.componentRef,
  })
  const component = canonicalBrollSkillPlanComponentSchema.parse(rawComponent)
  if (component.schemaVersion !== CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION) {
    throw new Error(
      'Canonical B-roll approved execution requires the restart-safe V3 component.',
    )
  }
  assertExactComponentGate(input.componentRef, input.executionGate)
  const authority = await revalidateCanonicalBrollPlanAuthority({
    localStorageRoot: input.localStorageRoot,
    component,
    canonicalWorkItems: input.canonicalWorkItems,
  })
  const {
    assignment,
    context,
    plan,
    planningQaReport,
    workGraph,
    qualificationReceipt,
    executionAuthorities,
    publicLifecycleAuthorities,
  } = authority
  const qualificationRank = qualificationReceipt
    ? ACTIVE_QUALIFICATION_RANK[qualificationReceipt.qualificationStatus]
    : undefined
  const requiredQualificationRank =
    ACTIVE_QUALIFICATION_RANK.internal_execution_qualified
  if (
    !assignment || !context || !plan || !planningQaReport || !workGraph ||
    !qualificationReceipt || !executionAuthorities ||
    !publicLifecycleAuthorities || workGraph.route !== 'existing_source' ||
    qualificationRank === undefined || requiredQualificationRank === undefined ||
    qualificationRank < requiredQualificationRank
  ) {
    throw new Error(
      'Canonical B-roll approved execution authority is incomplete or under-qualified.',
    )
  }
  const sourceCandidate = executionAuthorities.sourceInventory.candidates.find(
    (candidate) => candidate.sourceId === plan.sourceCandidateId,
  )
  const sourceManifest = executionAuthorities.sourceMediaArtifacts.find(
    (candidate) => candidate.sourceId === plan.sourceCandidateId,
  )
  if (
    !sourceCandidate || !sourceManifest ||
    !['existing_project_clip', 'approved_user_asset'].includes(
      sourceCandidate.sourceType,
    ) ||
    sourceCandidate.artifactRef.sha256 !== hashSkillValue(sourceManifest) ||
    plan.sourceArtifactRef?.sha256 !== sourceCandidate.artifactRef.sha256
  ) {
    throw new Error(
      'Canonical B-roll approved execution source lineage is incomplete.',
    )
  }
  await persistRestartLifecycleArtifacts({
    artifactStore: input.artifactStore,
    plan,
    planningQaReport,
    publicPlan: publicLifecycleAuthorities.publicPlan,
    scope: {
      ownerUserId: assignment.ownerUserId,
      workspaceId: assignment.workspaceId,
      projectId: assignment.projectId,
    },
  })
  const coordinator = new BrollCanonicalPrivateExecutionCoordinator({
    route: 'existing_source',
    executionGate: input.executionGate,
    localStorageRoot: input.localStorageRoot,
    approvalHash: publicLifecycleAuthorities.approval.approvalHash,
    approvedWorkGraphHash: publicLifecycleAuthorities
      .approvedPublicWorkGraph.approvedWorkGraphHash,
    approvedPublicWorkGraph: publicLifecycleAuthorities.approvedPublicWorkGraph,
    component,
    componentRef: input.componentRef,
    assignment,
    context,
    visualOwnership: executionAuthorities.visualOwnership,
    plan,
    planningQaReport,
    workGraph,
    canonicalWorkItems: input.canonicalWorkItems,
    source: {
      sourceId: sourceCandidate.sourceId,
      artifactRef: sourceCandidate.artifactRef,
      mediaManifest: sourceManifest,
      mimeType: 'video/mp4',
      bytes: input.sourceBytes,
    },
    providerObserver: { getRequestCount: () => 0 },
    captionOverlay: input.captionOverlay,
    mediaRuntime: input.mediaRuntime,
    remotionRuntime: input.remotionRuntime,
    integrationInfrastructureCostMicros:
      input.integrationInfrastructureCostMicros,
    now: input.now,
  })
  const bindings = createBrollCanonicalPrivateRuntimeBindings(coordinator)
  const registry = new SkillJobRuntimeBindingRegistry()
  for (const binding of bindings) registry.register(binding)
  registry.validateManifest({
    manifest: BROLL_CAPABILITY_MANIFEST,
    artifacts: editSkillArtifactSchemaRegistry,
    operations: editSkillReferenceCatalog,
    workGraphJobs: BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  })
  const dispatcher = new EditSkillRuntimeDispatcher(
    registry,
    'canonical_private',
  )
  const bindingByJob = new Map(bindings.map((binding) => [
    binding.definition.jobType,
    binding.definition,
  ]))
  const manifestRef = skillManifestReference(BROLL_CAPABILITY_MANIFEST)

  const executeWorkItem = async (workItemKey: string) => {
    const item = publicLifecycleAuthorities.approvedPublicWorkGraph.workItems
      .find((candidate) => candidate.workItemKey === workItemKey)
    if (!item) {
      throw new Error(
        'Canonical B-roll approved executor received work outside its graph.',
      )
    }
    const binding = bindingByJob.get(item.jobType)
    if (!binding) {
      throw new Error(
        'Canonical B-roll approved work item lacks its runtime binding.',
      )
    }
    const outcome = await dispatcher.dispatchApprovedWorkItemToResult({
      manifestRef,
      workItem: item,
      approval: publicLifecycleAuthorities.approval,
      authorizedPhase: binding.allowedPhases[0]!,
      inputArtifactTypes: binding.inputArtifactTypes,
      adapterClass: 'canonical_private_execution_adapter',
      environmentClass: 'canonical_private',
      runtimeQualification: qualificationReceipt.qualificationStatus,
      artifactStorageClass: input.artifactStore.storageClass,
      artifactStore: input.artifactStore,
      artifactScope: {
        ownerUserId: assignment.ownerUserId,
        workspaceId: assignment.workspaceId,
        projectId: assignment.projectId,
      },
      privateArtifactAuthority: true,
      providerAuthorityOperations:
        editSkillReferenceCatalog.providerOperations,
      toolAuthorityOperations: editSkillReferenceCatalog.toolOperations,
      planId: publicLifecycleAuthorities.publicPlan.envelope.planId,
      planHash: publicLifecycleAuthorities.publicPlan.envelope.planHash,
      qaEvidenceArtifactRefs:
        publicLifecycleAuthorities.publicPlan.evidenceRefs,
    })
    return Object.freeze({
      workResult: outcome.workResult,
      dispatchReceipt: outcome.receipt,
    })
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION,
    componentVersion: CANONICAL_BROLL_SKILL_COMPONENT_V3_VERSION,
    restartSafeAuthorityReread: true as const,
    exactApprovedSnapshotGateRequired: true as const,
    durableOutputArtifactStoreRequired: true as const,
    providerRequestAllowed: false as const,
    executeWorkItem,
    async executeAll() {
      const workResults: EditSkillWorkResult[] = []
      const dispatchReceipts: RuntimeDispatchReceipt[] = []
      for (const item of publicLifecycleAuthorities.approvedPublicWorkGraph
        .workItems) {
        const outcome = await executeWorkItem(item.workItemKey)
        dispatchReceipts.push(outcome.dispatchReceipt)
        workResults.push(outcome.workResult)
      }
      return Object.freeze({
        workResults: Object.freeze(workResults),
        dispatchReceipts: Object.freeze(dispatchReceipts),
        runtimeSnapshot: coordinator.snapshot(),
      })
    },
  })
}

function assertExactComponentGate(
  componentRef: AuthorityJsonBlobRef,
  gate: BrollExistingSourceExecutionInput['gate'],
): void {
  const refs = [
    gate.componentRef,
    gate.snapshotComponentRef,
    gate.executionPackageComponentRef,
  ]
  if (refs.some((ref) =>
    stableAuthorityStringify(ref) !== stableAuthorityStringify(componentRef))) {
    throw new Error(
      'Canonical B-roll approved execution component lineage is crossed.',
    )
  }
}

async function persistRestartLifecycleArtifacts(input: {
  artifactStore: EditSkillArtifactStore
  plan: unknown
  planningQaReport: unknown
  publicPlan: {
    payloadRef: EditSkillArtifactReference
    evidenceRefs: EditSkillArtifactReference[]
  }
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
}): Promise<void> {
  const planRef = await input.artifactStore.putJson({
    artifactType: input.publicPlan.payloadRef.artifactType,
    ...input.scope,
    value: input.plan,
  })
  const planningQaRef = await input.artifactStore.putJson({
    artifactType: input.publicPlan.evidenceRefs[0]?.artifactType ?? '',
    ...input.scope,
    value: input.planningQaReport,
  })
  if (
    stableAuthorityStringify(planRef) !==
      stableAuthorityStringify(input.publicPlan.payloadRef) ||
    stableAuthorityStringify(planningQaRef) !==
      stableAuthorityStringify(input.publicPlan.evidenceRefs[0])
  ) {
    throw new Error(
      'Canonical B-roll public lifecycle artifacts changed during restart persistence.',
    )
  }
}
