import type { EditSkillArtifactReference, EditSkillArtifactStore } from '../core/edit-skill-artifact-store'
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
  type EditSkillResultReceipt,
} from '../core/edit-skill-plugin'
import { editSkillWorkResultSchema, type EditSkillWorkResult } from '../core/edit-skill-work-result'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { resolveAndValidateSkillAssignmentInputs } from '../core/skill-assignment-input-resolver'
import type { SkillAssignment } from '../core/skill-assignment-types'
import type { EditSkillRuntimeEnvironmentClass } from '../core/edit-skill-runtime'
import type { SkillRouteQualificationRegistry } from '../core/skill-route-qualification'
import { assertSkillAssignment, assertSkillRangeMutation } from '../core/skill-range-authority'
import { createSkillPlanEnvelope } from '../core/skill-plan-envelope'
import { createSkillResultEnvelope } from '../core/skill-result-envelope'
import {
  masterTimingPlanSchema,
  sourceInventorySchema,
  visualOwnershipManifestSchema,
} from '../shared/assignment-authorities'
import { trackGraphV2Schema } from '../shared/track-graph/track-graph-schemas'
import { TRACK_ALL_CAPABILITY_MANIFEST } from './track-all-capability-manifest'
import { compileTrackAllPlan, type TrackAllPlanningAuthority } from './track-all-plan-compiler'
import {
  createTrackAllSam31RuntimeProfileV2,
  createCurrentTrackAllSam31V2RouteGateReport,
  trackAllPreflightObservationSchema,
  trackAllSam31RuntimeProfileV2Schema,
} from './track-all-planning-authorities'
import {
  createTrackAllResultReceipt,
  privacyPolicySnapshotSchema,
  priorTrackRepairEvidenceSchema,
  sourceFrameAuthoritySchema,
  trackAllCaptionReservedZonesSchema,
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
  if (plan.decision === 'needs_preflight_observation' || plan.decision === 'needs_track_graph') return 'needs_other_skill'
  if (['needs_user_selection', 'needs_range_expansion', 'needs_manual_keyframe', 'needs_user_confirmation', 'multiple_targets_ambiguous', 'identity_uncertain'].includes(plan.decision)) return 'needs_user_review'
  if (['target_not_found', 'privacy_coverage_blocked', 'needs_route_qualification', 'blocked_external_sam_prerequisites', 'blocked'].includes(plan.decision)) return 'blocked'
  return 'use_skill'
}

function resultStatus(plan: TrackAllPlan): Parameters<typeof createTrackAllResultReceipt>[0]['status'] {
  switch (plan.decision) {
    case 'use_no_tracking': return 'use_no_tracking'
    case 'needs_visual_intelligence': return 'needs_visual_intelligence'
    case 'needs_preflight_observation': return 'blocked'
    case 'needs_track_graph': return 'blocked'
    case 'needs_route_qualification': return 'blocked'
    case 'blocked_external_sam_prerequisites': return 'blocked'
    case 'needs_user_selection': return 'needs_user_selection'
    case 'needs_range_expansion': return 'needs_range_expansion'
    case 'needs_manual_keyframe': return 'needs_manual_keyframe'
    case 'needs_user_confirmation': return 'needs_user_confirmation'
    case 'target_not_found': return 'target_not_found'
    case 'multiple_targets_ambiguous': return 'multiple_targets_ambiguous'
    case 'identity_uncertain': return 'identity_uncertain'
    case 'privacy_coverage_blocked': return 'privacy_coverage_blocked'
    case 'blocked': return 'blocked'
    default: return 'accepted'
  }
}

export class TrackAllEditSkillPlugin implements EditSkillPlugin {
  readonly manifest = TRACK_ALL_CAPABILITY_MANIFEST
  readonly #artifacts: EditSkillArtifactStore
  readonly #routeQualifications: SkillRouteQualificationRegistry
  readonly #environmentClass: EditSkillRuntimeEnvironmentClass

  constructor(input: {
    artifacts: EditSkillArtifactStore
    routeQualifications: SkillRouteQualificationRegistry
    environmentClass: EditSkillRuntimeEnvironmentClass
  }) {
    this.#artifacts = input.artifacts
    this.#routeQualifications = input.routeQualifications
    this.#environmentClass = input.environmentClass
  }

  async planAssignment(input: { assignment: SkillAssignment }): Promise<EditSkillPublicPlan> {
    const assignment = this.#assertAssignment(input.assignment)
    const authority = await this.#loadAuthority(assignment)
    const { plan, planningQaReport } = compileTrackAllPlan({ authority, manifest: this.manifest })
    const profileRef = await this.#artifacts.putJson({ artifactType: 'track_all_sam3_1_runtime_profile_v2', value: authority.samRuntimeProfile, ...scope(assignment) })
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
      minimumQualificationStatus: plan.requiredDependencyArtifactType === 'track_all_preflight_observation_v1'
        ? 'planning_qualified'
        : 'internal_execution_qualified',
      reason: plan.requiredDependencyArtifactType === 'track_all_preflight_observation_v1'
        ? 'Track All requires content-addressed measured preflight evidence before deriving initialization, risk, chunk, or repair values.'
        : plan.requiredDependencyArtifactType === 'track_graph_v2'
          ? 'Track All requires an exact existing model-neutral Track Graph before applying this treatment without unnecessary SAM work.'
          : 'Track All requires model-neutral semantic target evidence before compiling a target claim.', required: true,
    }))
    return createEditSkillPublicPlan({ schemaVersion: 'edit-skill-public-plan-v1', envelope, payloadRef: planRef, evidenceRefs: [qaRef, profileRef, ...authority.refs], dependencyRequests })
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
    if (!input.plan.dependencyRequests.some((candidate) => candidate.requestHash === request.requestHash) || request.assignmentId !== assignment.assignmentId || request.assignmentHash !== assignment.assignmentHash || request.planId !== input.plan.envelope.planId || request.planHash !== input.plan.envelope.planHash || !same(request.manifestRef, assignment.manifestRef) || !same(request.authorizedRange, assignment.authorizedRange) || input.artifactRef.artifactType !== request.requiredArtifactType) throw new Error('Track All rejected an unrequested dependency artifact.')
    const value = await this.#artifacts.readJson({ reference: input.artifactRef, ...scope(assignment) })
    const authority = await this.#loadAuthority(assignment)
    const target = trackAllTargetSpecificationSchema.parse(authority.target)
    let productionQualified = false
    if (request.requiredArtifactType === 'visual_intelligence_target_evidence_v1') {
      const evidence = visualIntelligenceTargetEvidenceSchema.parse(value)
      if (evidence.ownerUserId !== assignment.ownerUserId || evidence.workspaceId !== assignment.workspaceId || evidence.projectId !== assignment.projectId || evidence.assignmentHash !== authority.assignment.assignmentHash || evidence.targetHash !== target.targetHash || evidence.authorizedRangeHash !== hashSkillValue(assignment.authorizedRange) || evidence.candidateRegions.some((region) => region.frameIndex < assignment.authorizedRange.startFrameInclusive || region.frameIndex >= assignment.authorizedRange.endFrameExclusive) || !['internal_execution_qualified', 'production_qualified'].includes(evidence.qualificationStatus)) throw new Error('Visual Intelligence target evidence has stale, cross-tenant, out-of-range, or under-qualified lineage.')
      productionQualified = evidence.qualificationStatus === 'production_qualified' && !evidence.testOnlyInjected
    } else if (request.requiredArtifactType === 'track_all_preflight_observation_v1') {
      const evidence = trackAllPreflightObservationSchema.parse(value)
      if (evidence.ownerUserId !== assignment.ownerUserId || evidence.workspaceId !== assignment.workspaceId || evidence.projectId !== assignment.projectId || evidence.editSessionId !== assignment.editSessionId || evidence.assignmentId !== assignment.assignmentId || evidence.assignmentHash !== authority.assignment.assignmentHash || evidence.targetHash !== target.targetHash || evidence.sourceChecksum !== authority.sourceFrames.sourceChecksum || !same(evidence.authorizedRange, assignment.authorizedRange)) throw new Error('Track All preflight evidence has stale tenant, source, assignment, target, or range lineage.')
      productionQualified = evidence.qualificationStatus === 'production_qualified'
    } else if (request.requiredArtifactType === 'track_graph_v2') {
      const graph = trackGraphV2Schema.parse(value)
      if (graph.ownerUserId !== assignment.ownerUserId || graph.workspaceId !== assignment.workspaceId || graph.projectId !== assignment.projectId || graph.editSessionId !== assignment.editSessionId || graph.sourceSha256 !== authority.sourceFrames.sourceChecksum || graph.authorizedRangeHash !== hashSkillValue(graph.authorizedRange)) throw new Error('Track All graph dependency has stale tenant, source, session, or range lineage.')
    } else throw new Error('Track All dependency artifact type is unsupported.')
    return createEditSkillDependencyAcceptance({
      schemaVersion: 'edit-skill-dependency-acceptance-v1', requestHash: request.requestHash,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash,
      planHash: input.plan.envelope.planHash, manifestRef: assignment.manifestRef,
      artifactRef: input.artifactRef, validatedArtifactHash: input.artifactRef.sha256,
      acceptedForPhase: request.requiredForPhase, productionQualified,
    })
  }

  async validateWorkItemResult(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; workGraph: EditSkillApprovedWorkGraph; result: EditSkillWorkResult }): Promise<EditSkillWorkResult> {
    const assignment = this.#assertAssignment(input.assignment)
    const plan = await this.#loadPlan(assignment, input.plan)
    const graph = editSkillApprovedWorkGraphSchema.parse(input.workGraph)
    this.#assertGraphLineage({ assignment, publicPlan: input.plan, graph })
    const result = editSkillWorkResultSchema.parse(input.result)
    const item = graph.workItems.find((candidate) => candidate.workItemKey === result.workItemKey)
    if (!item || item.workItemHash !== result.workItemHash || result.assignmentId !== assignment.assignmentId || result.assignmentHash !== assignment.assignmentHash || result.planId !== input.plan.envelope.planId || result.planHash !== input.plan.envelope.planHash || !same(result.manifestRef, assignment.manifestRef) || !same(result.authorizedRange, assignment.authorizedRange) || result.operationId !== item.operationId || result.workerClass !== item.workerClass || !same(result.qaLineageKeys, item.qaLineageKeys) || result.callerSelectedExecutable || result.outsideAuthorizedRangeModified) throw new Error('Track All work result differs from approved work.')
    for (const range of result.mutationRanges) assertSkillRangeMutation({ assignment, mutationRange: range })
    if (result.status === 'succeeded') {
      if (result.outputArtifactRefs.length !== 1 || result.outputArtifactRefs[0]!.artifactType !== item.expectedOutputType || result.qaEvidenceArtifactRefs.length === 0) throw new Error('Track All work result has the wrong strict output or QA evidence artifact.')
      const value = await this.#artifacts.readJson({ reference: result.outputArtifactRefs[0]!, ...scope(assignment) })
      this.#assertProducedArtifactLineage({ assignment, plan, artifactType: item.expectedOutputType, value })
      for (const ref of result.qaEvidenceArtifactRefs) await this.#artifacts.readJson({ reference: ref, ...scope(assignment) })
    }
    return result
  }

  async finalizeSkillResult(input: { assignment: SkillAssignment; plan: EditSkillPublicPlan; workGraph: EditSkillApprovedWorkGraph; dependencyAcceptances: readonly EditSkillDependencyAcceptance[]; workItemResults: readonly EditSkillWorkResult[] }): Promise<EditSkillResultReceipt> {
    const assignment = this.#assertAssignment(input.assignment)
    const plan = await this.#loadPlan(assignment, input.plan)
    const graph = editSkillApprovedWorkGraphSchema.parse(input.workGraph)
    this.#assertGraphLineage({ assignment, publicPlan: input.plan, graph })
    const required = graph.workItems.filter((item) => item.required)
    if (input.workItemResults.length !== required.length || new Set(input.workItemResults.map((result) => result.workItemKey)).size !== input.workItemResults.length) throw new Error('Track All finalization requires every exact approved work result once.')
    const validated: EditSkillWorkResult[] = []
    for (const result of input.workItemResults) validated.push(await this.validateWorkItemResult({ assignment, plan: input.plan, workGraph: graph, result }))
    if (validated.some((result) => result.status !== 'succeeded')) throw new Error('Track All cannot finalize failed required work.')
    if (input.dependencyAcceptances.length !== input.plan.dependencyRequests.length) {
      throw new Error('Track All finalization received missing or extra dependency acceptances.')
    }
    const acceptedRequestHashes = new Set<string>()
    for (const rawAcceptance of input.dependencyAcceptances) {
      const acceptance = editSkillDependencyAcceptanceSchema.parse(rawAcceptance)
      const request = input.plan.dependencyRequests.find((candidate) =>
        candidate.requestHash === acceptance.requestHash)
      if (
        !request || acceptedRequestHashes.has(acceptance.requestHash) ||
        acceptance.assignmentId !== assignment.assignmentId ||
        acceptance.assignmentHash !== assignment.assignmentHash ||
        acceptance.planHash !== input.plan.envelope.planHash ||
        !same(acceptance.manifestRef, assignment.manifestRef) ||
        acceptance.artifactRef.artifactType !== request.requiredArtifactType ||
        acceptance.acceptedForPhase !== request.requiredForPhase
      ) throw new Error('Track All cannot finalize without each exact dependency acceptance once.')
      await this.#artifacts.readJson({ reference: acceptance.artifactRef, ...scope(assignment) })
      acceptedRequestHashes.add(acceptance.requestHash)
    }
    const acceptedRefs = validated.flatMap((result) => result.outputArtifactRefs)
    const specialized = createTrackAllResultReceipt({
      schemaVersion: 'track_all_result_receipt_v1', resultId: `track-all-result-${plan.planHash.slice(0, 24)}`,
      assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash, planHash: plan.planHash,
      manifestRef: assignment.manifestRef, decision: plan.decision, authorizedRange: assignment.authorizedRange,
      acceptedArtifactRefs: acceptedRefs, qaEvidenceHashes: validated.flatMap((result) => result.qaEvidenceArtifactRefs.map((ref) => ref.sha256)),
      outsideAuthorizedRangeModified: false, anonymousIdentitiesOnly: true,
      privateArtifactsOnly: true, status: resultStatus(plan),
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
    const profileRef = publicPlan.evidenceRefs.find((ref) => ref.artifactType === 'track_all_sam3_1_runtime_profile_v2')
    if (!profileRef) throw new Error('Track All plan lacks SAM runtime profile lineage.')
    const profile = trackAllSam31RuntimeProfileV2Schema.parse(await this.#artifacts.readJson({ reference: profileRef, ...scope(assignment) }))
    if (profile.profileHash !== plan.samRuntimeProfileHash) throw new Error('Track All plan SAM runtime profile is stale.')
    return plan
  }

  async #loadAuthority(assignment: SkillAssignment): Promise<LoadedAuthority> {
    const resolved = await resolveAndValidateSkillAssignmentInputs({ assignment, manifest: this.manifest, artifactStore: this.#artifacts })
    const specialized = trackAllAssignmentSchema.parse(resolved.requireOne('assignment').value)
    const target = trackAllTargetSpecificationSchema.parse(resolved.requireOne('target').value)
    const sourceInventory = sourceInventorySchema.parse(resolved.requireOne('source_inventory').value)
    const masterTiming = masterTimingPlanSchema.parse(resolved.requireOne('master_timing').value)
    const sourceFrames = sourceFrameAuthoritySchema.parse(resolved.requireOne('source_frames').value)
    const visualOwnership = visualOwnershipManifestSchema.parse(resolved.requireOne('visual_ownership').value)
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
    const optional = (artifactType: string) => {
      const entry = resolved.optional.get(artifactType)
      if (!entry || entry.values.length === 0) return undefined
      if (entry.values.length !== 1 || entry.references.length !== 1) {
        throw new Error(`Track All optional authority ${artifactType} is ambiguous.`)
      }
      return { reference: entry.references[0]!, value: entry.values[0] }
    }
    const viEntry = optional('visual_intelligence_target_evidence_v1')
    const privacyEntry = optional('privacy_policy_snapshot_v1')
    const existingGraphEntry = optional('track_graph_v2')
    const priorRepairEntry = optional('prior_track_repair_evidence_v1')
    const captionZonesEntry = optional('caption_reserved_zones_v1')
    const preflightEntry = optional('track_all_preflight_observation_v1')
    const visualIntelligenceEvidence = viEntry
      ? visualIntelligenceTargetEvidenceSchema.parse(viEntry.value)
      : undefined
    const privacyPolicy = privacyEntry
      ? privacyPolicySnapshotSchema.parse(privacyEntry.value)
      : undefined
    const existingTrackGraph = existingGraphEntry
      ? trackGraphV2Schema.parse(existingGraphEntry.value)
      : undefined
    const priorTrackRepairEvidence = priorRepairEntry
      ? priorTrackRepairEvidenceSchema.parse(priorRepairEntry.value)
      : undefined
    const captionReservedZones = captionZonesEntry
      ? trackAllCaptionReservedZonesSchema.parse(captionZonesEntry.value)
      : undefined
    const preflightObservation = preflightEntry
      ? trackAllPreflightObservationSchema.parse(preflightEntry.value)
      : undefined
    if (visualIntelligenceEvidence && (visualIntelligenceEvidence.assignmentHash !== specialized.assignmentHash || visualIntelligenceEvidence.targetHash !== target.targetHash || visualIntelligenceEvidence.authorizedRangeHash !== hashSkillValue(assignment.authorizedRange))) throw new Error('Visual Intelligence target evidence has stale assignment, target, or range lineage.')
    if (privacyPolicy && (privacyPolicy.ownerUserId !== assignment.ownerUserId || privacyPolicy.workspaceId !== assignment.workspaceId || privacyPolicy.projectId !== assignment.projectId)) throw new Error('Privacy policy is cross-tenant.')
    const allInputRefs = [...assignment.contextArtifactRefs, ...assignment.dependencyArtifactRefs]
    for (const grounding of target.groundingEvidence) {
      if (!('artifactRef' in grounding)) continue
      if (!allInputRefs.some((reference) => same(reference, grounding.artifactRef))) {
        throw new Error('Track All target grounding artifact is absent from assignment authority.')
      }
    }
    if (existingTrackGraph) {
      const rangeContainsAssignment = existingTrackGraph.authorizedRange.fps === assignment.authorizedRange.fps &&
        existingTrackGraph.authorizedRange.startFrameInclusive <= assignment.authorizedRange.startFrameInclusive &&
        existingTrackGraph.authorizedRange.endFrameExclusive >= assignment.authorizedRange.endFrameExclusive
      if (
        existingTrackGraph.ownerUserId !== assignment.ownerUserId ||
        existingTrackGraph.workspaceId !== assignment.workspaceId ||
        existingTrackGraph.projectId !== assignment.projectId ||
        existingTrackGraph.editSessionId !== assignment.editSessionId ||
        existingTrackGraph.sourceSha256 !== sourceFrames.sourceChecksum ||
        !rangeContainsAssignment ||
        !specialized.readContext.priorTrackGraphRefs.some((reference) =>
          same(reference, existingGraphEntry!.reference))
      ) throw new Error('Existing Track Graph has stale source, session, range, or assignment lineage.')
    }
    if (priorTrackRepairEvidence && (
      !existingGraphEntry || !same(priorTrackRepairEvidence.trackGraphRef, existingGraphEntry.reference) ||
      priorTrackRepairEvidence.ownerUserId !== assignment.ownerUserId ||
      priorTrackRepairEvidence.workspaceId !== assignment.workspaceId ||
      priorTrackRepairEvidence.projectId !== assignment.projectId ||
      priorTrackRepairEvidence.editSessionId !== assignment.editSessionId ||
      priorTrackRepairEvidence.assignmentHash !== specialized.assignmentHash ||
      !existingTrackGraph?.tracks.some((track) => track.trackId === priorTrackRepairEvidence.trackId)
    )) throw new Error('Prior repair evidence has stale Track Graph or assignment lineage.')
    if (captionReservedZones && (
      captionReservedZones.ownerUserId !== assignment.ownerUserId ||
      captionReservedZones.workspaceId !== assignment.workspaceId ||
      captionReservedZones.projectId !== assignment.projectId ||
      captionReservedZones.editSessionId !== assignment.editSessionId ||
      captionReservedZones.assignmentId !== assignment.assignmentId ||
      ![assignment.assignmentHash, specialized.assignmentHash].includes(captionReservedZones.assignmentHash) ||
      !same(captionReservedZones.manifestRef, assignment.manifestRef) ||
      !same(captionReservedZones.authorizedRange, assignment.authorizedRange)
    )) throw new Error('Caption reserved zones have stale tenant, assignment, or range lineage.')
    if (preflightObservation && (
      preflightObservation.ownerUserId !== assignment.ownerUserId ||
      preflightObservation.workspaceId !== assignment.workspaceId ||
      preflightObservation.projectId !== assignment.projectId ||
      preflightObservation.editSessionId !== assignment.editSessionId ||
      preflightObservation.assignmentId !== assignment.assignmentId ||
      preflightObservation.assignmentHash !== specialized.assignmentHash ||
      preflightObservation.targetHash !== target.targetHash ||
      preflightObservation.sourceChecksum !== sourceFrames.sourceChecksum ||
      !same(preflightObservation.authorizedRange, assignment.authorizedRange)
    )) throw new Error('Track All preflight observation has stale tenant, source, assignment, target, or range lineage.')
    const routeQualifications = this.#routeQualifications.list().filter((receipt) =>
      receipt.manifestRef.manifestHash === assignment.manifestRef.manifestHash &&
      receipt.environmentClass === this.#environmentClass)
    const samRouteReceipt = routeQualifications.find((receipt) =>
      receipt.routeKey === 'sam3_1_masklet_route')
    if (!samRouteReceipt) throw new Error('Track All SAM runtime profile lacks exact route qualification authority.')
    const samRuntimeProfile = createTrackAllSam31RuntimeProfileV2({
      routeReceipt: samRouteReceipt,
      routeGateReport: createCurrentTrackAllSam31V2RouteGateReport({
        generatedAt: '2026-08-04T00:00:00.000Z',
      }),
    })
    return {
      genericAssignment: assignment, assignment: specialized, target, sourceInventory,
      masterTiming, sourceFrames, visualOwnership, sceneContext,
      visualIntelligenceEvidence, privacyPolicy, existingTrackGraph,
      priorTrackRepairEvidence, captionReservedZones, preflightObservation,
      samRuntimeProfile, routeQualifications,
      refs: [...assignment.contextArtifactRefs, ...assignment.dependencyArtifactRefs],
    }
  }

  #assertGraphLineage(input: {
    assignment: SkillAssignment
    publicPlan: EditSkillPublicPlan
    graph: EditSkillApprovedWorkGraph
  }): void {
    const { assignment, publicPlan, graph } = input
    if (
      graph.assignmentId !== assignment.assignmentId ||
      graph.assignmentHash !== assignment.assignmentHash ||
      graph.planId !== publicPlan.envelope.planId ||
      graph.planHash !== publicPlan.envelope.planHash ||
      !same(graph.manifestRef, assignment.manifestRef) ||
      !same(graph.authorizedRange, assignment.authorizedRange) ||
      graph.approval.assignmentHash !== assignment.assignmentHash ||
      graph.approval.planHash !== publicPlan.envelope.planHash ||
      !graph.pluginWorkGraphRef
    ) throw new Error('Track All approved graph has stale assignment, plan, or plugin-graph lineage.')
  }

  #assertProducedArtifactLineage(input: {
    assignment: SkillAssignment
    plan: TrackAllPlan
    artifactType: string
    value: unknown
  }): void {
    if (typeof input.value !== 'object' || input.value === null) {
      throw new Error('Track All output artifact lacks structured lineage.')
    }
    const value = input.value as Readonly<Record<string, unknown>>
    if (input.artifactType === 'track_all_plan_v1') {
      if (!same(input.value, input.plan)) throw new Error('Track All planning work returned another plan.')
      return
    }
    if (
      ('assignmentId' in value && value.assignmentId !== input.assignment.assignmentId) ||
      ('assignmentHash' in value && value.assignmentHash !== input.assignment.assignmentHash) ||
      ('planHash' in value && value.planHash !== input.plan.planHash) ||
      ('manifestRef' in value && !same(value.manifestRef, input.assignment.manifestRef)) ||
      ('authorizedRange' in value && !same(value.authorizedRange, input.assignment.authorizedRange)) ||
      ('outsideAuthorizedRangeModified' in value && value.outsideAuthorizedRangeModified !== false)
    ) throw new Error('Track All output artifact has stale or out-of-range lineage.')
  }
}
