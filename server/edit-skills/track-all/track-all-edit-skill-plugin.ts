import type { EditSkillArtifactReference, EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
import {
  createEditSkillDependencyAcceptance,
  createEditSkillDependencyRequest,
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
  type EditSkillResultReceipt,
} from '../core/edit-skill-plugin'
import { editSkillWorkResultSchema, type EditSkillWorkResult } from '../core/edit-skill-work-result'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { resolveAndValidateSkillAssignmentInputs } from '../core/skill-assignment-input-resolver'
import type { SkillAssignment } from '../core/skill-assignment-types'
import { assertSkillAssignment, assertSkillRangeMutation } from '../core/skill-range-authority'
import { createSkillPlanEnvelope } from '../core/skill-plan-envelope'
import { createSkillResultEnvelope } from '../core/skill-result-envelope'
import { brollMasterTimingPlanSchema, brollSourceInventorySchema, brollVisualOwnershipManifestSchema } from '../b-roll/b-roll-input-authorities'
import { TRACK_ALL_CAPABILITY_MANIFEST } from './track-all-capability-manifest'
import { compileTrackAllPlan, type TrackAllPlanningAuthority } from './track-all-plan-compiler'
import {
  createTrackAllResultReceipt,
  privacyPolicySnapshotSchema,
  sourceFrameAuthoritySchema,
  trackAllAssignmentSchema,
  trackAllPlanSchema,
  trackAllPlanningQaReportSchema,
  trackAllSceneContextSchema,
  trackAllTargetSpecificationSchema,
  visualIntelligenceTargetEvidenceSchema,
  type TrackAllPlan,
} from './track-all-schemas'
import {
  compileTrackAllCanonicalWorkGraph,
  compileTrackAllPublicWorkItems,
} from './track-all-work-graph'

function same(left: unknown, right: unknown): boolean { return hashSkillValue(left) === hashSkillValue(right) }
function scope(assignment: SkillAssignment) { return { ownerUserId: assignment.ownerUserId, workspaceId: assignment.workspaceId, projectId: assignment.projectId } }

interface LoadedAuthority extends TrackAllPlanningAuthority {
  refs: readonly EditSkillArtifactReference[]
}

function publicDisposition(plan: TrackAllPlan): EditSkillPublicPlan['envelope']['disposition'] {
  if (plan.decision === 'use_no_tracking') return 'use_no_action'
  if (plan.decision === 'needs_visual_intelligence') return 'needs_other_skill'
  if (['needs_user_selection', 'needs_range_expansion', 'needs_manual_keyframe', 'needs_user_confirmation', 'multiple_targets_ambiguous', 'identity_uncertain'].includes(plan.decision)) return 'needs_user_review'
  if (['target_not_found', 'privacy_coverage_blocked', 'blocked'].includes(plan.decision)) return 'blocked'
  return 'use_skill'
}

export class TrackAllEditSkillPlugin implements EditSkillPlugin {
  readonly manifest = TRACK_ALL_CAPABILITY_MANIFEST
  readonly #artifacts: EditSkillArtifactStore

  constructor(input: { artifacts: EditSkillArtifactStore }) { this.#artifacts = input.artifacts }

  async planAssignment(input: { assignment: SkillAssignment }): Promise<EditSkillPublicPlan> {
    const assignment = this.#assertAssignment(input.assignment)
    const authority = await this.#loadAuthority(assignment)
    const { plan, planningQaReport } = compileTrackAllPlan({ authority, manifest: this.manifest })
    const qaRef = await this.#artifacts.putJson({ artifactType: 'track_all_planning_qa_report_v1', value: planningQaReport, ...scope(assignment) })
    if (qaRef.sha256 !== plan.planningQaReportHash) throw new Error('Track All planning QA persistence lost exact lineage.')
    const planRef = await this.#artifacts.putJson({ artifactType: 'track_all_plan_v1', value: plan, ...scope(assignment) })
    const disposition = publicDisposition(plan)
    const envelope = createSkillPlanEnvelope({
      schemaVersion: 'edit-skill-plan-envelope-v1', planId: plan.planId,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      manifestRef: assignment.manifestRef, authorizedRange: assignment.authorizedRange,
      disposition, payloadArtifactType: planRef.artifactType, payloadHash: planRef.sha256,
      ...(disposition === 'needs_other_skill' ? { dependencySkillKey: plan.dependencySkillKey } : {}),
    })
    const dependencyRequests: EditSkillDependencyRequest[] = []
    if (disposition === 'needs_other_skill') dependencyRequests.push(createEditSkillDependencyRequest({
      schemaVersion: 'edit-skill-dependency-request-v1', requestId: `track-all-dependency-${plan.planHash.slice(0, 20)}`,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      planId: envelope.planId, planHash: envelope.planHash, manifestRef: assignment.manifestRef,
      authorizedRange: assignment.authorizedRange, dependencySkillKey: plan.dependencySkillKey!,
      requiredArtifactType: plan.requiredDependencyArtifactType!, requiredForPhase: plan.requiredForPhase!,
      minimumQualificationStatus: 'internal_execution_qualified',
      reason: 'Track All requires model-neutral semantic target evidence before compiling a target claim.', required: true,
    }))
    return createEditSkillPublicPlan({ schemaVersion: 'edit-skill-public-plan-v1', envelope, payloadRef: planRef, evidenceRefs: [qaRef, ...authority.refs], dependencyRequests })
  }

  async compileApprovedWorkGraph(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; approval: EditSkillPlanApproval }): Promise<EditSkillApprovedWorkGraph> {
    const assignment = this.#assertAssignment(input.assignment)
    const plan = await this.#loadPlan(assignment, input.plan)
    const approval = editSkillPlanApprovalSchema.parse(input.approval)
    if (approval.assignmentId !== assignment.assignmentId || approval.assignmentHash !== assignment.assignmentHash || approval.planId !== input.plan.envelope.planId || approval.planHash !== input.plan.envelope.planHash || !same(approval.manifestRef, assignment.manifestRef) || !same(approval.authorizedRange, assignment.authorizedRange)) throw new Error('Track All work graph requires exact plan approval.')
    const workItems = compileTrackAllPublicWorkItems({ assignment, plan })
    const authority = await this.#loadAuthority(assignment)
    const pluginGraph = compileTrackAllCanonicalWorkGraph({
      assignment,
      plan,
      approvalHash: approval.approvalHash,
      dependencyRequestHashes: input.plan.dependencyRequests.map((request) => request.requestHash),
      sourceSha256: authority.sourceFrames.sourceChecksum,
    })
    const pluginWorkGraphRef = await this.#artifacts.putJson({
      artifactType: 'track_all_work_graph_v1',
      value: pluginGraph,
      ...scope(assignment),
    })
    return createEditSkillApprovedWorkGraph({
      schemaVersion: 'edit-skill-approved-work-graph-v1', assignmentId: assignment.assignmentId,
      assignmentHash: assignment.assignmentHash, planId: input.plan.envelope.planId, planHash: input.plan.envelope.planHash,
      manifestRef: assignment.manifestRef, authorizedRange: assignment.authorizedRange, approval,
      pluginWorkGraphType: 'track_all_work_graph_v1',
      pluginWorkGraphHash: pluginWorkGraphRef.sha256,
      pluginWorkGraphRef,
      workItems, dependencyRequests: input.plan.dependencyRequests, outsideAuthorizedRangeModified: false,
    })
  }

  async acceptDependencyArtifact(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; request: EditSkillDependencyRequest; artifactRef: EditSkillArtifactReference }): Promise<EditSkillDependencyAcceptance> {
    const assignment = this.#assertAssignment(input.assignment)
    await this.#loadPlan(assignment, input.plan)
    const request = editSkillDependencyRequestSchema.parse(input.request)
    if (!input.plan.dependencyRequests.some((candidate) => candidate.requestHash === request.requestHash) || request.assignmentHash !== assignment.assignmentHash || request.planHash !== input.plan.envelope.planHash || input.artifactRef.artifactType !== request.requiredArtifactType) throw new Error('Track All rejected an unrequested dependency artifact.')
    const value = await this.#artifacts.readJson({ reference: input.artifactRef, ...scope(assignment) })
    if (request.requiredArtifactType !== 'visual_intelligence_target_evidence_v1') throw new Error('Track All dependency artifact type is unsupported.')
    const evidence = visualIntelligenceTargetEvidenceSchema.parse(value)
    const target = trackAllTargetSpecificationSchema.parse((await this.#loadAuthority(assignment)).target)
    if (evidence.ownerUserId !== assignment.ownerUserId || evidence.workspaceId !== assignment.workspaceId || evidence.projectId !== assignment.projectId || evidence.assignmentHash !== (await this.#loadAuthority(assignment)).assignment.assignmentHash || evidence.targetHash !== target.targetHash || evidence.authorizedRangeHash !== hashSkillValue(assignment.authorizedRange) || !['internal_execution_qualified', 'production_qualified'].includes(evidence.qualificationStatus)) throw new Error('Visual Intelligence target evidence has stale, cross-tenant, or under-qualified lineage.')
    return createEditSkillDependencyAcceptance({
      schemaVersion: 'edit-skill-dependency-acceptance-v1', requestHash: request.requestHash,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      planHash: input.plan.envelope.planHash, manifestRef: assignment.manifestRef,
      artifactRef: input.artifactRef, validatedArtifactHash: input.artifactRef.sha256,
      acceptedForPhase: request.requiredForPhase, productionQualified: evidence.qualificationStatus === 'production_qualified' && !evidence.testOnlyInjected,
    })
  }

  async validateWorkItemResult(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; workGraph: EditSkillApprovedWorkGraph; result: EditSkillWorkResult }): Promise<EditSkillWorkResult> {
    const assignment = this.#assertAssignment(input.assignment)
    await this.#loadPlan(assignment, input.plan)
    const graph = editSkillApprovedWorkGraphSchema.parse(input.workGraph)
    const result = editSkillWorkResultSchema.parse(input.result)
    const item = graph.workItems.find((candidate) => candidate.workItemKey === result.workItemKey)
    if (!item || item.workItemHash !== result.workItemHash || result.assignmentHash !== assignment.assignmentHash || result.planHash !== input.plan.envelope.planHash || !same(result.manifestRef, assignment.manifestRef) || result.operationId !== item.operationId || result.workerClass !== item.workerClass || result.callerSelectedExecutable || result.outsideAuthorizedRangeModified) throw new Error('Track All work result differs from approved work.')
    for (const range of result.mutationRanges) assertSkillRangeMutation({ assignment, mutationRange: range })
    if (result.status === 'succeeded') {
      if (result.outputArtifactRefs.length !== 1 || result.outputArtifactRefs[0]!.artifactType !== item.expectedOutputType) throw new Error('Track All work result has the wrong strict output artifact.')
      for (const ref of [...result.outputArtifactRefs, ...result.qaEvidenceArtifactRefs]) await this.#artifacts.readJson({ reference: ref, ...scope(assignment) })
    }
    return result
  }

  async finalizeSkillResult(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; workGraph: EditSkillApprovedWorkGraph; dependencyAcceptances: readonly EditSkillDependencyAcceptance[]; workItemResults: readonly EditSkillWorkResult[] }): Promise<EditSkillResultReceipt> {
    const assignment = this.#assertAssignment(input.assignment)
    const plan = await this.#loadPlan(assignment, input.plan)
    const graph = editSkillApprovedWorkGraphSchema.parse(input.workGraph)
    const required = graph.workItems.filter((item) => item.required)
    if (input.workItemResults.length !== required.length || new Set(input.workItemResults.map((result) => result.workItemKey)).size !== input.workItemResults.length) throw new Error('Track All finalization requires every exact approved work result once.')
    const validated: EditSkillWorkResult[] = []
    for (const result of input.workItemResults) validated.push(await this.validateWorkItemResult({ assignment, plan: input.plan, workGraph: graph, result }))
    if (validated.some((result) => result.status !== 'succeeded')) throw new Error('Track All cannot finalize failed required work.')
    for (const request of input.plan.dependencyRequests) {
      if (!input.dependencyAcceptances.some((acceptance) => acceptance.requestHash === request.requestHash)) throw new Error('Track All cannot finalize without its exact dependency acceptance.')
    }
    const acceptedRefs = validated.flatMap((result) => result.outputArtifactRefs)
    const status = plan.decision === 'use_no_tracking' ? 'use_no_tracking' : plan.decision === 'needs_visual_intelligence' ? 'needs_visual_intelligence' : plan.decision === 'needs_user_selection' ? 'needs_user_selection' : plan.decision === 'needs_range_expansion' ? 'needs_range_expansion' : plan.decision === 'blocked' ? 'blocked' : 'accepted'
    const specialized = createTrackAllResultReceipt({
      schemaVersion: 'track_all_result_receipt_v1', resultId: `track-all-result-${plan.planHash.slice(0, 24)}`,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash, planHash: plan.planHash,
      manifestRef: assignment.manifestRef, decision: plan.decision, authorizedRange: assignment.authorizedRange,
      acceptedArtifactRefs: acceptedRefs, qaEvidenceHashes: validated.flatMap((result) => result.qaEvidenceArtifactRefs.map((ref) => ref.sha256)),
      outsideAuthorizedRangeModified: false, anonymousIdentitiesOnly: true, privateArtifactsOnly: true, status,
    })
    const resultRef = await this.#artifacts.putJson({ artifactType: 'track_all_result_receipt_v1', value: specialized, ...scope(assignment) })
    const disposition = publicDisposition(plan)
    const envelope = createSkillResultEnvelope({
      schemaVersion: 'edit-skill-result-envelope-v1', resultId: specialized.resultId,
      planId: input.plan.envelope.planId, planHash: input.plan.envelope.planHash,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      manifestRef: assignment.manifestRef, authorizedRange: assignment.authorizedRange,
      disposition: disposition === 'use_skill' ? 'selected' : disposition === 'use_no_action' ? 'use_no_action' : disposition,
      resultArtifactType: resultRef.artifactType, resultArtifactHash: resultRef.sha256,
      qaEvidenceHashes: specialized.qaEvidenceHashes, mutationRanges: validated.flatMap((result) => result.mutationRanges),
    })
    return createEditSkillResultReceipt({
      schemaVersion: 'edit-skill-result-receipt-v1', envelope, approvedWorkGraphHash: graph.approvedWorkGraphHash,
      workItemResultHashes: validated.map((result) => result.workResultHash),
      dependencyAcceptanceHashes: input.dependencyAcceptances.map((acceptance) => acceptance.acceptanceHash),
    })
  }

  #assertAssignment(input: SkillAssignment): SkillAssignment {
    const assignment = assertSkillAssignment(input)
    if (assignment.manifestRef.skillKey !== 'track_all' || assignment.manifestRef.skillVersion !== this.manifest.skillVersion || assignment.manifestRef.contractVersion !== this.manifest.contractVersion || assignment.manifestRef.manifestHash !== this.manifest.manifestHash) throw new Error('Track All rejected a stale or foreign assignment.')
    return assignment
  }

  async #loadPlan(assignment: SkillAssignment, input: EditSkillPublicPlan): Promise<TrackAllPlan> {
    const publicPlan = editSkillPublicPlanSchema.parse(input)
    if (publicPlan.envelope.assignmentHash !== assignment.assignmentHash || !same(publicPlan.envelope.manifestRef, assignment.manifestRef) || !same(publicPlan.envelope.authorizedRange, assignment.authorizedRange) || publicPlan.payloadRef.artifactType !== 'track_all_plan_v1') throw new Error('Track All public plan is stale or foreign.')
    const plan = trackAllPlanSchema.parse(await this.#artifacts.readJson({ reference: publicPlan.payloadRef, ...scope(assignment) }))
    if (plan.assignmentHash !== (await this.#loadAuthority(assignment)).assignment.assignmentHash || !same(plan.authorizedRange, assignment.authorizedRange) || hashSkillValue(plan) !== publicPlan.payloadRef.sha256) throw new Error('Track All plan payload lineage is stale.')
    const qaRef = publicPlan.evidenceRefs.find((ref) => ref.artifactType === 'track_all_planning_qa_report_v1')
    if (!qaRef) throw new Error('Track All plan lacks planning QA lineage.')
    const qa = trackAllPlanningQaReportSchema.parse(await this.#artifacts.readJson({ reference: qaRef, ...scope(assignment) }))
    if (qaRef.sha256 !== plan.planningQaReportHash || qa.assignmentHash !== plan.assignmentHash || qa.targetHash !== plan.targetHash || qa.passed !== plan.planningQaPassed) throw new Error('Track All planning QA lineage is stale.')
    return plan
  }

  async #loadAuthority(assignment: SkillAssignment): Promise<LoadedAuthority> {
    const resolved = await resolveAndValidateSkillAssignmentInputs({ assignment, manifest: this.manifest, artifactStore: this.#artifacts })
    const specialized = trackAllAssignmentSchema.parse(resolved.requireOne('assignment').value)
    const target = trackAllTargetSpecificationSchema.parse(resolved.requireOne('target').value)
    const sourceInventory = brollSourceInventorySchema.parse(resolved.requireOne('source_inventory').value)
    const masterTiming = brollMasterTimingPlanSchema.parse(resolved.requireOne('master_timing').value)
    const sourceFrames = sourceFrameAuthoritySchema.parse(resolved.requireOne('source_frames').value)
    const visualOwnership = brollVisualOwnershipManifestSchema.parse(resolved.requireOne('visual_ownership').value)
    const sceneContext = trackAllSceneContextSchema.parse(resolved.requireOne('scene_context').value)
    if (specialized.assignmentId !== assignment.assignmentId || specialized.ownerUserId !== assignment.ownerUserId || specialized.workspaceId !== assignment.workspaceId || specialized.projectId !== assignment.projectId || specialized.editSessionId !== assignment.editSessionId || !same(specialized.manifestRef, assignment.manifestRef) || !same(specialized.authorizedWriteRange, assignment.authorizedRange)) throw new Error('Specialized Track All assignment differs from public authority.')
    if (target.assignmentId !== assignment.assignmentId || target.ownerUserId !== assignment.ownerUserId || target.workspaceId !== assignment.workspaceId || target.projectId !== assignment.projectId || target.editSessionId !== assignment.editSessionId) throw new Error('Track All target specification differs from assignment authority.')
    if (sourceInventory.assignmentId !== assignment.assignmentId || sourceInventory.editSessionId !== assignment.editSessionId || !same(sourceInventory.manifestRef, assignment.manifestRef)) throw new Error('Track All source inventory has stale assignment lineage.')
    if (masterTiming.assignmentId !== assignment.assignmentId || masterTiming.editSessionId !== assignment.editSessionId || !same(masterTiming.manifestRef, assignment.manifestRef)) throw new Error('Track All master timing has stale assignment lineage.')
    if (visualOwnership.assignmentId !== assignment.assignmentId || visualOwnership.editSessionId !== assignment.editSessionId || !same(visualOwnership.manifestRef, assignment.manifestRef)) throw new Error('Track All ownership manifest has stale assignment lineage.')
    if (sceneContext.assignmentId !== assignment.assignmentId || !same(sceneContext.authorizedWriteRange, assignment.authorizedRange)) throw new Error('Track All scene context has stale assignment or range lineage.')
    if (sourceFrames.ownerUserId !== assignment.ownerUserId || sourceFrames.workspaceId !== assignment.workspaceId || sourceFrames.projectId !== assignment.projectId) throw new Error('Track All source-frame authority is cross-tenant.')
    if (!same(masterTiming.assignmentRange, assignment.authorizedRange) || masterTiming.fps !== assignment.authorizedRange.fps) throw new Error('Track All master timing does not exactly bind the assignment range and FPS.')
    if (!same(visualOwnership.assignmentRange, assignment.authorizedRange)) throw new Error('Track All ownership manifest does not exactly bind the assignment range.')
    if (sourceFrames.range.fps !== assignment.authorizedRange.fps || sourceFrames.range.startFrameInclusive > assignment.authorizedRange.startFrameInclusive || sourceFrames.range.endFrameExclusive < assignment.authorizedRange.endFrameExclusive) throw new Error('Track All source-frame authority does not contain the assignment range at the exact FPS.')
    if (!sourceInventory.candidates.some((candidate) => candidate.sourceId === sourceFrames.sourceId && candidate.artifactRef.sha256 === sourceFrames.sourceChecksum)) throw new Error('Track All selected source is absent from the checksum-bound inventory.')
    const optional = (artifactType: string) => assignment.contextArtifactRefs.find((ref) => ref.artifactType === artifactType)
    const viRef = optional('visual_intelligence_target_evidence_v1')
    const privacyRef = optional('privacy_policy_snapshot_v1')
    const visualIntelligenceEvidence = viRef ? visualIntelligenceTargetEvidenceSchema.parse(await this.#artifacts.readJson({ reference: viRef, ...scope(assignment) })) : undefined
    const privacyPolicy = privacyRef ? privacyPolicySnapshotSchema.parse(await this.#artifacts.readJson({ reference: privacyRef, ...scope(assignment) })) : undefined
    if (visualIntelligenceEvidence && (visualIntelligenceEvidence.assignmentHash !== specialized.assignmentHash || visualIntelligenceEvidence.targetHash !== target.targetHash || visualIntelligenceEvidence.authorizedRangeHash !== hashSkillValue(assignment.authorizedRange))) throw new Error('Visual Intelligence target evidence has stale assignment, target, or range lineage.')
    if (privacyPolicy && (privacyPolicy.ownerUserId !== assignment.ownerUserId || privacyPolicy.workspaceId !== assignment.workspaceId || privacyPolicy.projectId !== assignment.projectId)) throw new Error('Privacy policy is cross-tenant.')
    return { genericAssignment: assignment, assignment: specialized, target, sourceInventory, masterTiming, sourceFrames, visualOwnership, sceneContext, visualIntelligenceEvidence, privacyPolicy, refs: [...assignment.contextArtifactRefs] }
  }
}
