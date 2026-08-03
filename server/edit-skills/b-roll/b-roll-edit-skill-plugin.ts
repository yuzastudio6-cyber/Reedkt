import type { EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import {
  createEditSkillDependencyAcceptance,
  createEditSkillDependencyRequest,
  editSkillDependencyAcceptanceSchema,
  editSkillDependencyRequestSchema,
  type EditSkillDependencyAcceptance,
  type EditSkillDependencyRequest,
} from '../core/edit-skill-dependency-request'
import {
  createEditSkillApprovedWorkGraph,
  createEditSkillPublicPlan,
  createEditSkillResultReceipt,
  editSkillApprovedWorkGraphSchema,
  editSkillPlanApprovalSchema,
  editSkillPublicPlanSchema,
  type EditSkillApprovedWorkGraph,
  type EditSkillPlanApproval,
  type EditSkillPlugin,
  type EditSkillPublicPlan,
  type EditSkillPublicWorkItem,
  type EditSkillResultReceipt,
} from '../core/edit-skill-plugin'
import { editSkillWorkResultSchema, type EditSkillWorkResult } from '../core/edit-skill-work-result'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import { assertSkillAssignment, assertSkillRangeMutation, isFrameRangeContained } from '../core/skill-range-authority'
import { createSkillPlanEnvelope } from '../core/skill-plan-envelope'
import { createSkillResultEnvelope } from '../core/skill-result-envelope'
import type { SkillAssignment } from '../core/skill-assignment-types'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'
import type { BrollPlanArtifact, BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import { assertBrollAssignment, assertBrollPlanningContext } from './b-roll-context-loader'
import { compileBrollPlan } from './b-roll-plan-compiler'
import {
  assertBrollPlanningQaReport,
  brollPlanningQaReportSchema,
} from './b-roll-planning-qa'
import {
  brollPlanArtifactSchema,
  brollPlanningContextSchema,
  brollSkillAssignmentSchema,
} from './b-roll-schemas'
import {
  assertBrollCanonicalWorkGraph,
  compileBrollCanonicalWorkGraph,
} from './b-roll-work-graph-compiler'
import { trackGraphV1Schema } from './b-roll-artifact-types'

interface LoadedBrollAuthority {
  assignment: BrollSkillAssignment
  assignmentRef: SkillAssignment['contextArtifactRefs'][number]
  context: BrollPlanningContext
}

function sameValue(left: unknown, right: unknown): boolean {
  return hashSkillValue(left) === hashSkillValue(right)
}

function scopeFor(assignment: SkillAssignment) {
  return {
    ownerUserId: assignment.ownerUserId,
    workspaceId: assignment.workspaceId,
    projectId: assignment.projectId,
  }
}

function assertArtifactScope(
  assignment: SkillAssignment,
  ref: SkillAssignment['contextArtifactRefs'][number],
): void {
  if (
    ref.ownerUserId !== assignment.ownerUserId ||
    ref.workspaceId !== assignment.workspaceId ||
    ref.projectId !== assignment.projectId
  ) throw new Error('Public edit-skill boundary rejected a cross-workspace artifact.')
}

function dispositionFor(plan: BrollPlanArtifact) {
  if (plan.decision === 'use_no_broll') return 'use_no_action' as const
  if (plan.decision === 'needs_other_skill') return 'needs_other_skill' as const
  if (plan.decision === 'needs_user_confirmation') return 'needs_user_review' as const
  if (plan.decision === 'blocked') return 'blocked' as const
  return 'use_skill' as const
}

function resultDispositionFor(plan: EditSkillPublicPlan) {
  switch (plan.envelope.disposition) {
    case 'use_skill': return 'selected' as const
    case 'use_no_action': return 'use_no_action' as const
    case 'needs_other_skill': return 'needs_other_skill' as const
    case 'needs_user_review': return 'needs_user_review' as const
    case 'blocked': return 'blocked' as const
  }
}

function projectPublicWorkItems(
  assignment: SkillAssignment,
  workItems: ReturnType<typeof compileBrollCanonicalWorkGraph>['workItems'],
): EditSkillPublicWorkItem[] {
  return workItems.map((item) => {
    const core = {
      workItemKey: item.workItemKey,
      jobType: item.jobType,
      operationId: item.operationId,
      workerClass: item.workerClass,
      manifestRef: item.manifestRef,
      assignmentId: item.assignmentId,
      assignmentHash: assignment.assignmentHash,
      authorizedRange: item.authorizedRange,
      dependencyKeys: item.dependencyKeys,
      expectedOutputType: item.expectedOutputType,
      maximumCreditBudget: item.maximumCreditBudget,
      maximumAttempts: item.maximumAttempts,
      required: item.required,
      qaLineageKeys: item.qaLineageKeys,
      ...(item.providerRouteId ? { providerRouteId: item.providerRouteId } : {}),
      callerSelectedExecutableAllowed: item.callerSelectedExecutableAllowed,
      outsideAuthorizedRangeModified: item.outsideAuthorizedRangeModified,
    }
    return { ...core, workItemHash: hashSkillValue(core) }
  })
}

export class BrollEditSkillPlugin implements EditSkillPlugin {
  readonly manifest = BROLL_CAPABILITY_MANIFEST
  readonly #artifacts: EditSkillArtifactStore
  readonly #estimators: SkillEstimatorRegistry
  readonly #qa: SkillQaRegistry

  constructor(input: {
    artifacts: EditSkillArtifactStore
    estimators: SkillEstimatorRegistry
    qa: SkillQaRegistry
  }) {
    this.#artifacts = input.artifacts
    this.#estimators = input.estimators
    this.#qa = input.qa
  }

  async planAssignment(input: { assignment: SkillAssignment }): Promise<EditSkillPublicPlan> {
    const assignment = this.#assertAssignment(input.assignment)
    const authority = await this.#loadBrollAuthority(assignment)
    const compiled = compileBrollPlan({
      assignment: authority.assignment,
      context: authority.context,
      manifest: this.manifest,
      estimators: this.#estimators,
      qa: this.#qa,
    })
    const plan = compiled.plan
    const planningQaReportRef = await this.#artifacts.putJson({
      artifactType: 'b_roll_planning_qa_report_v1',
      value: compiled.planningQaReport,
      ...scopeFor(assignment),
    })
    if (planningQaReportRef.sha256 !== plan.planningQaReportHash) {
      throw new Error('B-roll planning QA artifact store returned stale report lineage.')
    }
    const planRef = await this.#artifacts.putJson({
      artifactType: 'b_roll_plan_v1',
      value: plan,
      ...scopeFor(assignment),
    })
    const disposition = dispositionFor(plan)
    const envelope = createSkillPlanEnvelope({
      schemaVersion: 'edit-skill-plan-envelope-v1',
      planId: plan.planId,
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      manifestRef: assignment.manifestRef,
      authorizedRange: assignment.authorizedRange,
      disposition,
      payloadArtifactType: planRef.artifactType,
      payloadHash: planRef.sha256,
      ...(disposition === 'needs_other_skill' ? { dependencySkillKey: plan.dependencySkillKey } : {}),
    })
    const dependencyRequests = disposition === 'needs_other_skill'
      ? [createEditSkillDependencyRequest({
        schemaVersion: 'edit-skill-dependency-request-v1',
        requestId: `b-roll-${plan.planHash.slice(0, 20)}-track-graph`,
        assignmentId: assignment.assignmentId,
        assignmentHash: assignment.assignmentHash,
        planId: envelope.planId,
        planHash: envelope.planHash,
        manifestRef: assignment.manifestRef,
        authorizedRange: assignment.authorizedRange,
        dependencySkillKey: plan.dependencySkillKey!,
        requiredArtifactType: plan.requiredDependencyArtifactType!,
        requiredForPhase: plan.requiredForPhase!,
        minimumQualificationStatus: 'internal_execution_qualified',
        reason: 'The approved B-roll treatment requires a model-neutral track graph for the exact assignment range.',
        required: true,
      })]
      : []
    return createEditSkillPublicPlan({
      schemaVersion: 'edit-skill-public-plan-v1',
      envelope,
      payloadRef: planRef,
      evidenceRefs: [planningQaReportRef],
      dependencyRequests,
    })
  }

  async compileApprovedWorkGraph(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    approval: EditSkillPlanApproval
  }): Promise<EditSkillApprovedWorkGraph> {
    const assignment = this.#assertAssignment(input.assignment)
    const plan = await this.#assertPlan(assignment, input.plan)
    const approval = editSkillPlanApprovalSchema.parse(input.approval)
    if (
      approval.assignmentId !== assignment.assignmentId ||
      approval.assignmentHash !== assignment.assignmentHash ||
      approval.planId !== input.plan.envelope.planId ||
      approval.planHash !== input.plan.envelope.planHash ||
      !sameValue(approval.manifestRef, assignment.manifestRef) ||
      !sameValue(approval.authorizedRange, assignment.authorizedRange)
    ) throw new Error('B-roll work graph requires approval for the exact plan and assignment authority.')
    const authority = await this.#loadBrollAuthority(assignment)
    const graph = assertBrollCanonicalWorkGraph(compileBrollCanonicalWorkGraph({
      assignment: authority.assignment,
      plan,
    }))
    if (graph.workItems.some((item) => !this.manifest.supportedJobTypes.includes(item.jobType))) {
      throw new Error('B-roll canonical graph contains work not supported by its manifest.')
    }
    return createEditSkillApprovedWorkGraph({
      schemaVersion: 'edit-skill-approved-work-graph-v1',
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      planId: input.plan.envelope.planId,
      planHash: input.plan.envelope.planHash,
      manifestRef: assignment.manifestRef,
      authorizedRange: assignment.authorizedRange,
      approval,
      pluginWorkGraphType: graph.schemaVersion,
      pluginWorkGraphHash: graph.workGraphHash,
      workItems: projectPublicWorkItems(assignment, graph.workItems),
      dependencyRequests: input.plan.dependencyRequests,
      outsideAuthorizedRangeModified: false,
    })
  }

  async acceptDependencyArtifact(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    request: EditSkillDependencyRequest
    artifactRef: SkillAssignment['dependencyArtifactRefs'][number]
  }): Promise<EditSkillDependencyAcceptance> {
    const assignment = this.#assertAssignment(input.assignment)
    await this.#assertPlan(assignment, input.plan)
    const request = editSkillDependencyRequestSchema.parse(input.request)
    const expected = input.plan.dependencyRequests.find((value) => value.requestHash === request.requestHash)
    if (!expected || !sameValue(expected, request)) {
      throw new Error('B-roll rejected an unknown or stale dependency request.')
    }
    if (
      request.assignmentId !== assignment.assignmentId ||
      request.assignmentHash !== assignment.assignmentHash ||
      request.planHash !== input.plan.envelope.planHash ||
      !sameValue(request.manifestRef, assignment.manifestRef) ||
      !sameValue(request.authorizedRange, assignment.authorizedRange) ||
      input.artifactRef.artifactType !== request.requiredArtifactType
    ) throw new Error('B-roll dependency artifact lost exact request lineage.')
    assertArtifactScope(assignment, input.artifactRef)
    const value = await this.#artifacts.readJson({
      reference: input.artifactRef,
      ...scopeFor(assignment),
    })
    if (request.requiredArtifactType !== 'track_graph_v1') {
      throw new Error(`B-roll does not accept dependency artifact ${request.requiredArtifactType}.`)
    }
    const graph = trackGraphV1Schema.parse(value)
    if (
      graph.ownerUserId !== assignment.ownerUserId ||
      graph.workspaceId !== assignment.workspaceId ||
      graph.projectId !== assignment.projectId ||
      hashSkillValue(graph) !== input.artifactRef.sha256
    ) throw new Error('B-roll rejected a forged or cross-workspace Track All artifact.')
    return createEditSkillDependencyAcceptance({
      schemaVersion: 'edit-skill-dependency-acceptance-v1',
      requestHash: request.requestHash,
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      planHash: input.plan.envelope.planHash,
      manifestRef: assignment.manifestRef,
      artifactRef: input.artifactRef,
      validatedArtifactHash: input.artifactRef.sha256,
      acceptedForPhase: request.requiredForPhase,
      productionQualified: false,
    })
  }

  async validateWorkItemResult(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    workGraph: EditSkillApprovedWorkGraph
    result: EditSkillWorkResult
  }): Promise<EditSkillWorkResult> {
    const assignment = this.#assertAssignment(input.assignment)
    await this.#assertPlan(assignment, input.plan)
    await this.#assertWorkGraph(assignment, input.plan, input.workGraph)
    const result = editSkillWorkResultSchema.parse(input.result)
    const item = input.workGraph.workItems.find((value) => value.workItemKey === result.workItemKey)
    if (!item) throw new Error('B-roll rejected a result for work outside the approved graph.')
    if (
      result.workItemHash !== item.workItemHash ||
      result.assignmentId !== assignment.assignmentId ||
      result.assignmentHash !== assignment.assignmentHash ||
      result.planId !== input.plan.envelope.planId ||
      result.planHash !== input.plan.envelope.planHash ||
      !sameValue(result.manifestRef, assignment.manifestRef) ||
      !sameValue(result.authorizedRange, assignment.authorizedRange) ||
      result.operationId !== item.operationId ||
      result.workerClass !== item.workerClass ||
      !sameValue(result.qaLineageKeys, item.qaLineageKeys)
    ) throw new Error('B-roll work result is stale or does not match its approved work item.')
    for (const range of result.mutationRanges) assertSkillRangeMutation({ assignment, mutationRange: range })
    for (const ref of [...result.outputArtifactRefs, ...result.qaEvidenceArtifactRefs]) {
      assertArtifactScope(assignment, ref)
      await this.#artifacts.readJson({ reference: ref, ...scopeFor(assignment) })
    }
    if (result.status === 'succeeded') {
      if (
        item.required && result.outputArtifactRefs.length === 0 ||
        result.outputArtifactRefs.some((ref) => ref.artifactType !== item.expectedOutputType)
      ) throw new Error('B-roll work result does not provide the exact approved output artifact type.')
      if (result.qaEvidenceArtifactRefs.length === 0) {
        throw new Error('B-roll successful work result lacks independently addressable QA lineage.')
      }
    }
    return result
  }

  async finalizeSkillResult(input: {
    assignment: SkillAssignment
    plan: EditSkillPublicPlan
    workGraph: EditSkillApprovedWorkGraph
    dependencyAcceptances: readonly EditSkillDependencyAcceptance[]
    workItemResults: readonly EditSkillWorkResult[]
  }): Promise<EditSkillResultReceipt> {
    const assignment = this.#assertAssignment(input.assignment)
    await this.#assertPlan(assignment, input.plan)
    await this.#assertWorkGraph(assignment, input.plan, input.workGraph)
    const acceptances = input.dependencyAcceptances.map((value) =>
      editSkillDependencyAcceptanceSchema.parse(value))
    const requiredRequestHashes = new Set(input.plan.dependencyRequests.map((value) => value.requestHash))
    const acceptedRequestHashes = new Set(acceptances.map((value) => value.requestHash))
    if (
      acceptances.length !== acceptedRequestHashes.size ||
      requiredRequestHashes.size !== acceptedRequestHashes.size ||
      [...requiredRequestHashes].some((hash) => !acceptedRequestHashes.has(hash))
    ) throw new Error('B-roll finalization requires the exact dependency acceptance set.')
    for (const acceptance of acceptances) {
      if (
        acceptance.assignmentId !== assignment.assignmentId ||
        acceptance.assignmentHash !== assignment.assignmentHash ||
        acceptance.planHash !== input.plan.envelope.planHash ||
        !sameValue(acceptance.manifestRef, assignment.manifestRef)
      ) throw new Error('B-roll dependency acceptance is stale or cross-assignment.')
    }
    const resultKeys = new Set(input.workItemResults.map((value) => value.workItemKey))
    if (
      resultKeys.size !== input.workItemResults.length ||
      input.workItemResults.length !== input.workGraph.workItems.length ||
      input.workGraph.workItems.some((item) => !resultKeys.has(item.workItemKey))
    ) throw new Error('B-roll finalization requires one result for every exact approved work item.')
    const results: EditSkillWorkResult[] = []
    for (const result of input.workItemResults) {
      const validated = await this.validateWorkItemResult({ ...input, result })
      if (validated.status !== 'succeeded') {
        throw new Error('B-roll cannot finalize while approved work has failed.')
      }
      results.push(validated)
    }
    const finalItem = input.workGraph.workItems.at(-1)
    const finalResult = results.find((value) => value.workItemKey === finalItem?.workItemKey)
    const resultArtifact = finalResult?.outputArtifactRefs[0]
    if (!finalItem || !finalResult || !resultArtifact) {
      throw new Error('B-roll final work result artifact is missing.')
    }
    const qaEvidenceHashes = [...new Set([
      ...input.plan.evidenceRefs.map((ref) => ref.sha256),
      ...results.flatMap((value) => value.qaEvidenceArtifactRefs.map((ref) => ref.sha256)),
    ])]
    const mutationRanges = results.flatMap((value) => value.mutationRanges)
    const envelope = createSkillResultEnvelope({
      schemaVersion: 'edit-skill-result-envelope-v1',
      resultId: hashSkillValue({
        domain: 'reeditpro:public-edit-skill-result:v1',
        assignmentHash: assignment.assignmentHash,
        planHash: input.plan.envelope.planHash,
        approvedWorkGraphHash: input.workGraph.approvedWorkGraphHash,
        resultArtifactHash: resultArtifact.sha256,
      }),
      planId: input.plan.envelope.planId,
      planHash: input.plan.envelope.planHash,
      assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash,
      manifestRef: assignment.manifestRef,
      authorizedRange: assignment.authorizedRange,
      disposition: resultDispositionFor(input.plan),
      resultArtifactType: resultArtifact.artifactType,
      resultArtifactHash: resultArtifact.sha256,
      qaEvidenceHashes,
      mutationRanges,
    })
    return createEditSkillResultReceipt({
      schemaVersion: 'edit-skill-result-receipt-v1',
      envelope,
      approvedWorkGraphHash: input.workGraph.approvedWorkGraphHash,
      workItemResultHashes: results.map((value) => value.workResultHash),
      dependencyAcceptanceHashes: acceptances.map((value) => value.acceptanceHash),
    })
  }

  #assertAssignment(input: SkillAssignment): SkillAssignment {
    const assignment = assertSkillAssignment(input)
    if (!sameValue(assignment.manifestRef, {
      schemaVersion: 'edit-skill-manifest-reference-v1',
      skillKey: this.manifest.skillKey,
      skillVersion: this.manifest.skillVersion,
      contractVersion: this.manifest.contractVersion,
      manifestHash: this.manifest.manifestHash,
    })) throw new Error('B-roll public plugin rejected a stale manifest reference.')
    for (const ref of [...assignment.contextArtifactRefs, ...assignment.dependencyArtifactRefs]) {
      assertArtifactScope(assignment, ref)
    }
    return assignment
  }

  async #loadBrollAuthority(assignment: SkillAssignment): Promise<LoadedBrollAuthority> {
    const assignmentRef = assignment.contextArtifactRefs.find((ref) =>
      ref.artifactType === 'b_roll_assignment_v1')
    const contextRef = assignment.contextArtifactRefs.find((ref) =>
      ref.artifactType === 'b_roll_context_manifest_v1')
    if (!assignmentRef || !contextRef) {
      throw new Error('B-roll public plugin requires assignment and context artifacts.')
    }
    const scope = scopeFor(assignment)
    const brollAssignment = assertBrollAssignment({
      assignment: brollSkillAssignmentSchema.parse(await this.#artifacts.readJson({
        reference: assignmentRef,
        ...scope,
      })),
      manifest: this.manifest,
    })
    const context = assertBrollPlanningContext({
      assignment: brollAssignment,
      context: brollPlanningContextSchema.parse(await this.#artifacts.readJson({
        reference: contextRef,
        ...scope,
      })),
    })
    if (
      brollAssignment.assignmentId !== assignment.assignmentId ||
      brollAssignment.ownerUserId !== assignment.ownerUserId ||
      brollAssignment.workspaceId !== assignment.workspaceId ||
      brollAssignment.projectId !== assignment.projectId ||
      brollAssignment.editSessionId !== assignment.editSessionId ||
      !sameValue(brollAssignment.writeRangeAuthority.authorizedRange, assignment.authorizedRange) ||
      brollAssignment.reason !== assignment.reason ||
      brollAssignment.expectedViewerBenefit !== assignment.intendedViewerBenefit ||
      brollAssignment.requestedVisualOwnership !== assignment.visualOwnership ||
      !brollAssignment.readContextAuthority.contextArtifactRefs.some((ref) => sameValue(ref, contextRef))
    ) throw new Error('B-roll private authority does not match the public assignment exactly.')
    return { assignment: brollAssignment, assignmentRef, context }
  }

  async #assertPlan(
    assignment: SkillAssignment,
    input: EditSkillPublicPlan,
  ): Promise<BrollPlanArtifact> {
    const publicPlan = editSkillPublicPlanSchema.parse(input)
    assertArtifactScope(assignment, publicPlan.payloadRef)
    for (const ref of publicPlan.evidenceRefs) assertArtifactScope(assignment, ref)
    if (
      publicPlan.envelope.assignmentId !== assignment.assignmentId ||
      publicPlan.envelope.assignmentHash !== assignment.assignmentHash ||
      !sameValue(publicPlan.envelope.manifestRef, assignment.manifestRef) ||
      !sameValue(publicPlan.envelope.authorizedRange, assignment.authorizedRange) ||
      publicPlan.dependencyRequests.some((request) =>
        request.assignmentId !== assignment.assignmentId ||
        request.assignmentHash !== assignment.assignmentHash ||
        request.planId !== publicPlan.envelope.planId ||
        request.planHash !== publicPlan.envelope.planHash ||
        !sameValue(request.manifestRef, assignment.manifestRef) ||
        !sameValue(request.authorizedRange, assignment.authorizedRange))
    ) throw new Error('B-roll public plan is stale or belongs to another assignment.')
    const authority = await this.#loadBrollAuthority(assignment)
    const plan = brollPlanArtifactSchema.parse(await this.#artifacts.readJson({
      reference: publicPlan.payloadRef,
      ...scopeFor(assignment),
    }))
    const planningQaReportRef = publicPlan.evidenceRefs.find((ref) =>
      ref.artifactType === plan.planningQaReportArtifactType &&
      ref.sha256 === plan.planningQaReportHash)
    if (publicPlan.evidenceRefs.length !== 1 || !planningQaReportRef) {
      throw new Error('B-roll public plan lacks its exact planning QA report artifact.')
    }
    const planningQaReport = brollPlanningQaReportSchema.parse(
      await this.#artifacts.readJson({
        reference: planningQaReportRef,
        ...scopeFor(assignment),
      }),
    )
    assertBrollPlanningQaReport({
      report: planningQaReport,
      assignment: authority.assignment,
      contextHash: authority.context.contextHash,
      planEvidenceHash: plan.planningQaPlanEvidenceHash,
    })
    if (!planningQaReport.planningQaPassed || hashSkillValue(planningQaReport) !== plan.planningQaReportHash) {
      throw new Error('B-roll public plan carries failed or stale planning QA evidence.')
    }
    const { planHash, ...planCore } = plan
    if (
      hashSkillValue(planCore) !== planHash ||
      plan.planId !== publicPlan.envelope.planId ||
      plan.assignmentId !== assignment.assignmentId ||
      plan.assignmentHash !== authority.assignment.assignmentHash ||
      hashSkillValue(plan) !== publicPlan.payloadRef.sha256 ||
      !sameValue(plan.manifestRef, assignment.manifestRef) ||
      !sameValue(plan.authorizedRange, assignment.authorizedRange)
    ) throw new Error('B-roll public plan payload lost exact private plan authority.')
    return plan
  }

  async #assertWorkGraph(
    assignment: SkillAssignment,
    plan: EditSkillPublicPlan,
    input: EditSkillApprovedWorkGraph,
  ): Promise<EditSkillApprovedWorkGraph> {
    const graph = editSkillApprovedWorkGraphSchema.parse(input)
    if (
      graph.assignmentId !== assignment.assignmentId ||
      graph.assignmentHash !== assignment.assignmentHash ||
      graph.planId !== plan.envelope.planId ||
      graph.planHash !== plan.envelope.planHash ||
      !sameValue(graph.manifestRef, assignment.manifestRef) ||
      !sameValue(graph.authorizedRange, assignment.authorizedRange) ||
      graph.approval.assignmentId !== assignment.assignmentId ||
      graph.approval.assignmentHash !== assignment.assignmentHash ||
      graph.approval.planId !== plan.envelope.planId ||
      graph.approval.planHash !== plan.envelope.planHash ||
      !sameValue(graph.approval.manifestRef, assignment.manifestRef) ||
      !sameValue(graph.approval.authorizedRange, assignment.authorizedRange) ||
      graph.workItems.some((item) =>
        item.assignmentId !== assignment.assignmentId ||
        item.assignmentHash !== assignment.assignmentHash ||
        !sameValue(item.manifestRef, assignment.manifestRef) ||
        !isFrameRangeContained(item.authorizedRange, assignment.authorizedRange))
    ) throw new Error('B-roll approved work graph is stale, cross-assignment, or out of range.')
    const authority = await this.#loadBrollAuthority(assignment)
    const privatePlan = await this.#assertPlan(assignment, plan)
    const canonical = assertBrollCanonicalWorkGraph(compileBrollCanonicalWorkGraph({
      assignment: authority.assignment,
      plan: privatePlan,
    }))
    if (
      canonical.workItems.some((item) => !this.manifest.supportedJobTypes.includes(item.jobType)) ||
      graph.pluginWorkGraphType !== canonical.schemaVersion ||
      graph.pluginWorkGraphHash !== canonical.workGraphHash ||
      !sameValue(graph.workItems, projectPublicWorkItems(assignment, canonical.workItems)) ||
      !sameValue(graph.dependencyRequests, plan.dependencyRequests)
    ) throw new Error('B-roll approved work graph differs from the manifest-supported canonical graph.')
    return graph
  }
}
