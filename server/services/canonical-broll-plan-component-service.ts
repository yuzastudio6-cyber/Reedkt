import {
  CANONICAL_BROLL_SKILL_COMPONENT_KEY,
  CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION,
  canonicalBrollSkillPlanComponentSchema,
  createCanonicalBrollSkillPlanComponent,
  type CanonicalBrollSkillPlanComponent,
} from '../edit-skills/b-roll/b-roll-canonical-plan-component'
import type { BrollPlanningContext, BrollPlanArtifact, BrollSkillAssignment } from '../edit-skills/b-roll/b-roll-contracts'
import {
  assertCanonicalBrollMasterTimingProjectionBinding,
  type CanonicalBrollMasterTimingProjectionBinding,
  type CanonicalBrollTimingSummary,
} from '../edit-skills/b-roll/b-roll-master-timing-projection-binding'
import {
  brollPlanningQaReportSchema,
  type BrollPlanningQaReport,
} from '../edit-skills/b-roll/b-roll-planning-qa'
import {
  assertBrollCanonicalWorkGraph,
  projectBrollCanonicalWorkItems,
  type BrollCanonicalWorkGraph,
} from '../edit-skills/b-roll/b-roll-work-graph-compiler'
import {
  brollPlanArtifactSchema,
  brollPlanningContextSchema,
  brollSkillAssignmentSchema,
} from '../edit-skills/b-roll/b-roll-schemas'
import {
  brollMasterTimingPlanSchema,
  brollPublicContextManifestSchema,
  brollSourceInventorySchema,
  brollVisualOwnershipManifestSchema,
  type BrollMasterTimingPlan,
  type BrollPublicContextManifest,
  type BrollSourceInventory,
  type BrollVisualOwnershipManifest,
} from '../edit-skills/b-roll/b-roll-input-authorities'
import {
  sourceMediaArtifactV1Schema,
  type SourceMediaArtifactV1,
} from '../edit-skills/b-roll/b-roll-active-artifact-contracts'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  assertSkillQualificationReceipt,
  type SkillQualificationReceipt,
} from '../edit-skills/core/skill-qualification-receipt'
import type { CanonicalWorkItemInput } from '../validation/edit-planning-authority-schemas'
import {
  putPrivateAuthorityJsonBlob,
  readPrivateAuthorityJsonBlob,
  stableAuthorityStringify,
  type AuthorityJsonBlobRef,
} from './private-edit-authority-store'

export type CanonicalBrollComparableWorkItem =
  Omit<CanonicalWorkItemInput, 'workItemType'> & {
    workItemType: string
  }

export interface CanonicalBrollExecutionAuthorities {
  sourceInventory: BrollSourceInventory
  masterTimingProjection: BrollMasterTimingPlan
  visualOwnership: BrollVisualOwnershipManifest
  publicContextManifest: BrollPublicContextManifest
  sourceMediaArtifacts: SourceMediaArtifactV1[]
}

export async function persistCanonicalBrollPlanComponent(input: {
  localStorageRoot: string
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  planningQaReport: BrollPlanningQaReport
  workGraph: BrollCanonicalWorkGraph
  qualificationReceipt: SkillQualificationReceipt
  executionAuthorities?: CanonicalBrollExecutionAuthorities
}): Promise<{
  component: CanonicalBrollSkillPlanComponent
  componentRefs: Record<typeof CANONICAL_BROLL_SKILL_COMPONENT_KEY, AuthorityJsonBlobRef>
}> {
  const assignment = assertHashedArtifact(
    brollSkillAssignmentSchema.parse(input.assignment) as unknown as Record<string, unknown>,
    'assignmentHash',
    'assignment',
  ) as unknown as BrollSkillAssignment
  const context = assertHashedArtifact(
    brollPlanningContextSchema.parse(input.context) as unknown as Record<string, unknown>,
    'contextHash',
    'context',
  ) as unknown as BrollPlanningContext
  const plan = assertHashedArtifact(
    brollPlanArtifactSchema.parse(input.plan) as unknown as Record<string, unknown>,
    'planHash',
    'plan',
  ) as unknown as BrollPlanArtifact
  const planningQaReport = assertHashedArtifact(
    brollPlanningQaReportSchema.parse(input.planningQaReport) as unknown as Record<string, unknown>,
    'reportHash',
    'planning QA report',
  ) as unknown as BrollPlanningQaReport
  const workGraph = assertBrollCanonicalWorkGraph(input.workGraph)
  const qualificationReceipt = assertSkillQualificationReceipt(input.qualificationReceipt)
  const persist = (value: Record<string, unknown>) => putPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    value,
    maxBytes: 2 * 1024 * 1024,
  })
  const assignmentArtifactRef = await persist(assignment as unknown as Record<string, unknown>)
  const contextArtifactRef = await persist(context as unknown as Record<string, unknown>)
  const planArtifactRef = await persist(plan as unknown as Record<string, unknown>)
  const planningQaReportArtifactRef = await persist(
    planningQaReport as unknown as Record<string, unknown>,
  )
  const workGraphArtifactRef = await persist(workGraph as unknown as Record<string, unknown>)
  const qualificationReceiptArtifactRef = await persist(qualificationReceipt as unknown as Record<string, unknown>)
  const executionAuthorityRefs = input.executionAuthorities
    ? await persistExecutionAuthorities(input.executionAuthorities, persist)
    : undefined
  const component = createCanonicalBrollSkillPlanComponent({
    assignment,
    context,
    plan,
    planningQaReport,
    workGraph,
    qualificationReceipt,
    assignmentArtifactRef,
    contextArtifactRef,
    planArtifactRef,
    planningQaReportArtifactRef,
    workGraphArtifactRef,
    qualificationReceiptArtifactRef,
    ...(executionAuthorityRefs ? { executionAuthorityRefs } : {}),
  })
  const componentRef = await persist(component as unknown as Record<string, unknown>)
  return {
    component,
    componentRefs: { [CANONICAL_BROLL_SKILL_COMPONENT_KEY]: componentRef },
  }
}

function assertHashedArtifact<T extends Record<string, unknown>>(
  value: T,
  hashKey: keyof T,
  label: string,
): T {
  const expected = value[hashKey]
  const core = { ...value }
  delete core[hashKey]
  if (typeof expected !== 'string' || hashSkillValue(core) !== expected) {
    throw new Error(`Canonical B-roll ${label} hash is stale or forged.`)
  }
  return value
}

function isBrollProjectedWorkItem(workItem: CanonicalBrollComparableWorkItem): boolean {
  const authority = workItem.executionInput.bRollAtomicAuthority
  return Boolean(
    authority && typeof authority === 'object' && !Array.isArray(authority) &&
    (authority as Record<string, unknown>).schemaVersion ===
      'b_roll_canonical_atomic_work_item_authority_v1',
  )
}

function normalizeComparableWorkItem(
  workItem: CanonicalBrollComparableWorkItem,
): CanonicalBrollComparableWorkItem {
  return {
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    executionInput: workItem.executionInput,
    sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
    sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
    expectedOutputs: workItem.expectedOutputs.map((output) => ({
      ...output,
      segmentIds: [...output.segmentIds],
      timingIds: [...output.timingIds],
      rendererLayerIds: [...output.rendererLayerIds],
    })),
    dependencyKeys: [...workItem.dependencyKeys],
    approvedToolIds: [...workItem.approvedToolIds],
    ...(workItem.approvedProviderRoute
      ? { approvedProviderRoute: workItem.approvedProviderRoute }
      : {}),
    providerExecutionMode: workItem.providerExecutionMode,
    fallbackPolicy: workItem.fallbackPolicy,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
  }
}

export async function revalidateCanonicalBrollPlanAuthority(input: {
  localStorageRoot: string
  component?: CanonicalBrollSkillPlanComponent
  masterTimingBinding?: CanonicalBrollMasterTimingProjectionBinding
  canonicalMasterTimingPlan?: Record<string, unknown>
  canonicalTimingSummary?: CanonicalBrollTimingSummary
  canonicalWorkItems: CanonicalBrollComparableWorkItem[]
}): Promise<{
  assignment?: BrollSkillAssignment
  context?: BrollPlanningContext
  plan?: BrollPlanArtifact
  planningQaReport?: BrollPlanningQaReport
  workGraph?: BrollCanonicalWorkGraph
  qualificationReceipt?: SkillQualificationReceipt
  executionAuthorities?: CanonicalBrollExecutionAuthorities
}> {
  const projectedItems = input.canonicalWorkItems
    .filter(isBrollProjectedWorkItem)
    .map(normalizeComparableWorkItem)
  if (!input.component) {
    if (projectedItems.length > 0 || input.masterTimingBinding) {
      throw new Error('Canonical B-roll work items require an immutable B-roll plan component.')
    }
    return {}
  }
  const component = canonicalBrollSkillPlanComponentSchema.parse(input.component)
  const read = (ref: AuthorityJsonBlobRef) => readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref,
  })
  const [
    rawAssignment,
    rawContext,
    rawPlan,
    rawPlanningQaReport,
    rawWorkGraph,
    rawQualificationReceipt,
  ] =
    await Promise.all([
      read(component.assignmentArtifactRef),
      read(component.contextArtifactRef),
      read(component.planArtifactRef),
      read(component.planningQaReportArtifactRef),
      read(component.workGraphArtifactRef),
      read(component.qualificationReceiptArtifactRef),
    ])
  const assignment = assertHashedArtifact(
    brollSkillAssignmentSchema.parse(rawAssignment) as unknown as Record<string, unknown>,
    'assignmentHash',
    'assignment',
  ) as unknown as BrollSkillAssignment
  if (input.masterTimingBinding) {
    if (!input.canonicalMasterTimingPlan || !input.canonicalTimingSummary) {
      throw new Error(
        'Canonical B-roll MasterTiming binding requires the exact canonical timing authorities.',
      )
    }
    assertCanonicalBrollMasterTimingProjectionBinding({
      binding: input.masterTimingBinding,
      canonicalMasterTimingPlan: input.canonicalMasterTimingPlan,
      canonicalTimingSummary: input.canonicalTimingSummary,
      assignment,
    })
  }
  const context = assertHashedArtifact(
    brollPlanningContextSchema.parse(rawContext) as unknown as Record<string, unknown>,
    'contextHash',
    'context',
  ) as unknown as BrollPlanningContext
  const plan = assertHashedArtifact(
    brollPlanArtifactSchema.parse(rawPlan) as unknown as Record<string, unknown>,
    'planHash',
    'plan',
  ) as unknown as BrollPlanArtifact
  const planningQaReport = assertHashedArtifact(
    brollPlanningQaReportSchema.parse(rawPlanningQaReport) as unknown as Record<string, unknown>,
    'reportHash',
    'planning QA report',
  ) as unknown as BrollPlanningQaReport
  const workGraph = assertBrollCanonicalWorkGraph(rawWorkGraph as BrollCanonicalWorkGraph)
  const qualificationReceipt = assertSkillQualificationReceipt(
    rawQualificationReceipt as SkillQualificationReceipt,
  )
  const executionAuthorities = component.schemaVersion ===
    CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION
    ? await readExecutionAuthorities(component, read, assignment)
    : undefined
  const rebuilt = createCanonicalBrollSkillPlanComponent({
    assignment,
    context,
    plan,
    planningQaReport,
    workGraph,
    qualificationReceipt,
    assignmentArtifactRef: component.assignmentArtifactRef,
    contextArtifactRef: component.contextArtifactRef,
    planArtifactRef: component.planArtifactRef,
    planningQaReportArtifactRef: component.planningQaReportArtifactRef,
    workGraphArtifactRef: component.workGraphArtifactRef,
    qualificationReceiptArtifactRef: component.qualificationReceiptArtifactRef,
    ...(component.schemaVersion === CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION
      ? {
          executionAuthorityRefs: {
            sourceInventoryArtifactRef:
              component.sourceInventoryArtifactRef,
            masterTimingProjectionArtifactRef:
              component.masterTimingProjectionArtifactRef,
            visualOwnershipArtifactRef:
              component.visualOwnershipArtifactRef,
            publicContextManifestArtifactRef:
              component.publicContextManifestArtifactRef,
            sourceMediaArtifactRefs: component.sourceMediaArtifactRefs,
          },
        }
      : {}),
  })
  if (stableAuthorityStringify(rebuilt) !== stableAuthorityStringify(component)) {
    throw new Error('Canonical B-roll component no longer matches its content-addressed lineage.')
  }
  const expectedItems = projectBrollCanonicalWorkItems({ assignment, workGraph })
  if (stableAuthorityStringify(expectedItems) !== stableAuthorityStringify(projectedItems)) {
    throw new Error('Canonical B-roll work items no longer match the immutable skill work graph.')
  }
  return {
    assignment,
    context,
    plan,
    planningQaReport,
    workGraph,
    qualificationReceipt,
    ...(executionAuthorities ? { executionAuthorities } : {}),
  }
}

async function persistExecutionAuthorities(
  input: CanonicalBrollExecutionAuthorities,
  persist: (value: Record<string, unknown>) => Promise<AuthorityJsonBlobRef>,
): Promise<{
  sourceInventoryArtifactRef: AuthorityJsonBlobRef
  masterTimingProjectionArtifactRef: AuthorityJsonBlobRef
  visualOwnershipArtifactRef: AuthorityJsonBlobRef
  publicContextManifestArtifactRef: AuthorityJsonBlobRef
  sourceMediaArtifactRefs: Array<{
    sourceId: string
    artifactRef: AuthorityJsonBlobRef
  }>
}> {
  const sourceInventory = brollSourceInventorySchema.parse(
    input.sourceInventory)
  const masterTimingProjection = brollMasterTimingPlanSchema.parse(
    input.masterTimingProjection)
  const visualOwnership = brollVisualOwnershipManifestSchema.parse(
    input.visualOwnership)
  const publicContextManifest = brollPublicContextManifestSchema.parse(
    input.publicContextManifest)
  const sourceMediaArtifacts = input.sourceMediaArtifacts.map((value) =>
    sourceMediaArtifactV1Schema.parse(value))
  const sourceMediaArtifactRefs = await Promise.all(
    sourceMediaArtifacts.map(async (artifact) => ({
      sourceId: artifact.sourceId,
      artifactRef: await persist(
        artifact as unknown as Record<string, unknown>),
    })),
  )
  return {
    sourceInventoryArtifactRef: await persist(
      sourceInventory as unknown as Record<string, unknown>),
    masterTimingProjectionArtifactRef: await persist(
      masterTimingProjection as unknown as Record<string, unknown>),
    visualOwnershipArtifactRef: await persist(
      visualOwnership as unknown as Record<string, unknown>),
    publicContextManifestArtifactRef: await persist(
      publicContextManifest as unknown as Record<string, unknown>),
    sourceMediaArtifactRefs,
  }
}

async function readExecutionAuthorities(
  component: Extract<CanonicalBrollSkillPlanComponent, {
    schemaVersion: typeof CANONICAL_BROLL_SKILL_COMPONENT_V2_VERSION
  }>,
  read: (ref: AuthorityJsonBlobRef) => Promise<
    Record<string, unknown> | unknown[]
  >,
  assignment: BrollSkillAssignment,
): Promise<CanonicalBrollExecutionAuthorities> {
  const [
    rawSourceInventory,
    rawMasterTimingProjection,
    rawVisualOwnership,
    rawPublicContextManifest,
    ...rawSources
  ] = await Promise.all([
    read(component.sourceInventoryArtifactRef),
    read(component.masterTimingProjectionArtifactRef),
    read(component.visualOwnershipArtifactRef),
    read(component.publicContextManifestArtifactRef),
    ...component.sourceMediaArtifactRefs.map((item) =>
      read(item.artifactRef)),
  ])
  const sourceInventory = brollSourceInventorySchema.parse(rawSourceInventory)
  const masterTimingProjection = brollMasterTimingPlanSchema.parse(
    rawMasterTimingProjection)
  const visualOwnership = brollVisualOwnershipManifestSchema.parse(
    rawVisualOwnership)
  const publicContextManifest = brollPublicContextManifestSchema.parse(
    rawPublicContextManifest)
  const sourceMediaArtifacts = rawSources.map((value) =>
    sourceMediaArtifactV1Schema.parse(value))
  const sourceIds = sourceMediaArtifacts.map((item) => item.sourceId)
  if (
    sourceIds.join('|') !== component.sourceMediaArtifactRefs.map((item) =>
      item.sourceId).join('|') ||
    sourceInventory.assignmentId !== assignment.assignmentId ||
    masterTimingProjection.assignmentId !== assignment.assignmentId ||
    visualOwnership.assignmentId !== assignment.assignmentId ||
    publicContextManifest.assignmentId !== assignment.assignmentId ||
    sourceInventory.ownerUserId !== assignment.ownerUserId ||
    visualOwnership.workspaceId !== assignment.workspaceId ||
    publicContextManifest.projectId !== assignment.projectId ||
    sourceInventory.candidates.some((candidate) =>
      !sourceIds.includes(candidate.sourceId))
  ) {
    throw new Error(
      'Canonical B-roll V2 execution inputs crossed immutable assignment authority.',
    )
  }
  return {
    sourceInventory,
    masterTimingProjection,
    visualOwnership,
    publicContextManifest,
    sourceMediaArtifacts,
  }
}
