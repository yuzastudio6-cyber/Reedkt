import {
  CANONICAL_BROLL_SKILL_COMPONENT_KEY,
  canonicalBrollSkillPlanComponentSchema,
  createCanonicalBrollSkillPlanComponent,
  type CanonicalBrollSkillPlanComponent,
} from '../edit-skills/b-roll/b-roll-canonical-plan-component'
import type { BrollPlanningContext, BrollPlanArtifact, BrollSkillAssignment } from '../edit-skills/b-roll/b-roll-contracts'
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

export async function persistCanonicalBrollPlanComponent(input: {
  localStorageRoot: string
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  plan: BrollPlanArtifact
  workGraph: BrollCanonicalWorkGraph
  qualificationReceipt: SkillQualificationReceipt
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
  const workGraphArtifactRef = await persist(workGraph as unknown as Record<string, unknown>)
  const qualificationReceiptArtifactRef = await persist(qualificationReceipt as unknown as Record<string, unknown>)
  const component = createCanonicalBrollSkillPlanComponent({
    assignment,
    context,
    plan,
    workGraph,
    qualificationReceipt,
    assignmentArtifactRef,
    contextArtifactRef,
    planArtifactRef,
    workGraphArtifactRef,
    qualificationReceiptArtifactRef,
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
  canonicalWorkItems: CanonicalBrollComparableWorkItem[]
}): Promise<{
  assignment?: BrollSkillAssignment
  context?: BrollPlanningContext
  plan?: BrollPlanArtifact
  workGraph?: BrollCanonicalWorkGraph
  qualificationReceipt?: SkillQualificationReceipt
}> {
  const projectedItems = input.canonicalWorkItems
    .filter(isBrollProjectedWorkItem)
    .map(normalizeComparableWorkItem)
  if (!input.component) {
    if (projectedItems.length > 0) {
      throw new Error('Canonical B-roll work items require an immutable B-roll plan component.')
    }
    return {}
  }
  const component = canonicalBrollSkillPlanComponentSchema.parse(input.component)
  const read = (ref: AuthorityJsonBlobRef) => readPrivateAuthorityJsonBlob({
    localStorageRoot: input.localStorageRoot,
    ref,
  })
  const [rawAssignment, rawContext, rawPlan, rawWorkGraph, rawQualificationReceipt] =
    await Promise.all([
      read(component.assignmentArtifactRef),
      read(component.contextArtifactRef),
      read(component.planArtifactRef),
      read(component.workGraphArtifactRef),
      read(component.qualificationReceiptArtifactRef),
    ])
  const assignment = assertHashedArtifact(
    brollSkillAssignmentSchema.parse(rawAssignment) as unknown as Record<string, unknown>,
    'assignmentHash',
    'assignment',
  ) as unknown as BrollSkillAssignment
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
  const workGraph = assertBrollCanonicalWorkGraph(rawWorkGraph as BrollCanonicalWorkGraph)
  const qualificationReceipt = assertSkillQualificationReceipt(
    rawQualificationReceipt as SkillQualificationReceipt,
  )
  const rebuilt = createCanonicalBrollSkillPlanComponent({
    assignment,
    context,
    plan,
    workGraph,
    qualificationReceipt,
    assignmentArtifactRef: component.assignmentArtifactRef,
    contextArtifactRef: component.contextArtifactRef,
    planArtifactRef: component.planArtifactRef,
    workGraphArtifactRef: component.workGraphArtifactRef,
    qualificationReceiptArtifactRef: component.qualificationReceiptArtifactRef,
  })
  if (stableAuthorityStringify(rebuilt) !== stableAuthorityStringify(component)) {
    throw new Error('Canonical B-roll component no longer matches its content-addressed lineage.')
  }
  const expectedItems = projectBrollCanonicalWorkItems({ assignment, workGraph })
  if (stableAuthorityStringify(expectedItems) !== stableAuthorityStringify(projectedItems)) {
    throw new Error('Canonical B-roll work items no longer match the immutable skill work graph.')
  }
  return { assignment, context, plan, workGraph, qualificationReceipt }
}
