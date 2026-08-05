import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import type { BrollPlanArtifact, BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import {
  assertBrollPlanningQaReport,
  createBrollPlanningQaPlanEvidence,
  createBrollPlanningQaReport,
  type BrollPlanningQaPlanEvidence,
  type BrollPlanningQaReport,
} from './b-roll-planning-qa'
import { brollPlanArtifactSchema, brollPlanCoreSchema } from './b-roll-schemas'
import {
  buildBrollShotSpecification,
  coordinateBrollSkills,
  directBrollConcept,
  directBrollEditorialRole,
  directBrollRestraint,
  planBrollOmniRequest,
  planBrollTimingAndComposition,
  resolveBrollSourceStrategy,
  runAssignmentGuard,
  runContextReader,
} from './mini-skills/index'

export interface CompileBrollPlanResult {
  plan: BrollPlanArtifact
  omniRequestPlan: ReturnType<typeof planBrollOmniRequest>
  planningQaPlanEvidence: BrollPlanningQaPlanEvidence
  planningQaReport: BrollPlanningQaReport
  planningQaEvidenceHash: string
}

const PROVIDER_DECISIONS = [
  'generate_with_gemini_omni',
  'edit_uploaded_video_with_gemini_omni',
  'refine_generated_omni_candidate',
] as const

const INERT_DECISIONS = [
  'use_no_broll',
  'needs_other_skill',
  'needs_user_confirmation',
  'blocked',
] as const

function isProviderDecision(decision: BrollPlanArtifact['decision']): boolean {
  return PROVIDER_DECISIONS.includes(decision as (typeof PROVIDER_DECISIONS)[number])
}

function isInertDecision(decision: BrollPlanArtifact['decision']): boolean {
  return INERT_DECISIONS.includes(decision as (typeof INERT_DECISIONS)[number])
}

export function assertBrollPlanRuntimeInvariants(input: {
  assignment: BrollSkillAssignment
  plan: BrollPlanArtifact
  omniRequestPlan?: ReturnType<typeof planBrollOmniRequest>
  planningQaReport?: BrollPlanningQaReport
  planningContextHash?: string
  requireExactProviderRequestPackage?: boolean
  requireExactPlanningQaReport?: boolean
}): void {
  const plan = brollPlanArtifactSchema.parse(input.plan)
  const provider = isProviderDecision(plan.decision)
  if (
    plan.assignmentId !== input.assignment.assignmentId ||
    plan.assignmentHash !== input.assignment.assignmentHash ||
    hashSkillValue(plan.manifestRef) !== hashSkillValue(input.assignment.manifestRef) ||
    hashSkillValue(plan.authorizedRange) !==
      hashSkillValue(input.assignment.writeRangeAuthority.authorizedRange)
  ) throw new Error('B-roll plan is stale or belongs to another assignment authority.')
  if (provider && (
    input.assignment.providerPermission !== 'approved_within_ceiling' ||
    !input.assignment.permittedSourceRoutes.includes(plan.decision)
  )) throw new Error('B-roll provider plan lacks exact assignment provider authority.')
  if (provider && input.requireExactProviderRequestPackage && !input.omniRequestPlan) {
    throw new Error('B-roll provider plan lacks its exact request package.')
  }
  if (
    input.omniRequestPlan && (
      !provider ||
      plan.providerRequestPackageHash !== hashSkillValue(input.omniRequestPlan) ||
      input.omniRequestPlan.approvedRange.startFrameInclusive !== plan.authorizedRange.startFrameInclusive ||
      input.omniRequestPlan.approvedRange.endFrameExclusive !== plan.authorizedRange.endFrameExclusive ||
      input.omniRequestPlan.approvedRange.fps !== plan.authorizedRange.fps ||
      input.omniRequestPlan.maximumInitialSubmissions !== 1 ||
      input.omniRequestPlan.maximumRefinements !== 1 ||
      input.omniRequestPlan.automaticRetryAllowed !== false ||
      input.omniRequestPlan.alternateProviderFallbackAllowed !== false
    )
  ) throw new Error('B-roll provider request package is stale or exceeds attempt authority.')
  if (!provider && input.omniRequestPlan) {
    throw new Error('A non-provider B-roll plan cannot carry a provider request package.')
  }
  if (input.requireExactPlanningQaReport && !input.planningQaReport) {
    throw new Error('B-roll plan lacks its exact evidence-derived planning QA report.')
  }
  if (input.planningQaReport) {
    if (!input.planningContextHash) {
      throw new Error('B-roll planning QA validation requires the exact planning context hash.')
    }
    const report = assertBrollPlanningQaReport({
      report: input.planningQaReport,
      assignment: input.assignment,
      contextHash: input.planningContextHash,
      planEvidenceHash: plan.planningQaPlanEvidenceHash,
    })
    if (
      hashSkillValue(report) !== plan.planningQaReportHash ||
      report.schemaVersion !== plan.planningQaReportArtifactType ||
      !report.planningQaPassed
    ) throw new Error('B-roll plan carries stale or failed planning QA lineage.')
  }
  if (plan.sourceArtifactRef && (
    plan.sourceArtifactRef.ownerUserId !== input.assignment.ownerUserId ||
    plan.sourceArtifactRef.workspaceId !== input.assignment.workspaceId ||
    plan.sourceArtifactRef.projectId !== input.assignment.projectId
  )) throw new Error('B-roll plan selected a cross-workspace source artifact.')
  for (const reference of plan.providerSourceArtifactRefs ?? []) {
    if (
      reference.ownerUserId !== input.assignment.ownerUserId ||
      reference.workspaceId !== input.assignment.workspaceId ||
      reference.projectId !== input.assignment.projectId
    ) throw new Error('B-roll plan selected a cross-workspace provider image artifact.')
  }
}

export function compileBrollPlan(input: {
  assignment: BrollSkillAssignment
  context: BrollPlanningContext
  manifest: SkillCapabilityManifest
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
}): CompileBrollPlanResult {
  const assignment = runAssignmentGuard({ assignment: input.assignment, manifest: input.manifest }).assignment
  const context = runContextReader({ assignment, context: input.context }).context
  const restraint = directBrollRestraint({ assignment, context })
  const editorialRole = directBrollEditorialRole(assignment)
  let sourceStrategy = resolveBrollSourceStrategy({ assignment, context, restraint })
  const initialConcept = directBrollConcept({ assignment, context, role: editorialRole, sourceStrategy })
  if (initialConcept.rejectedAsRepeated) {
    sourceStrategy = { decision: 'use_no_broll', reason: 'The proposed concept repeats an earlier B-roll treatment; keep the base scene.' }
  }
  const durationFrames = assignment.writeRangeAuthority.authorizedRange.endFrameExclusive -
    assignment.writeRangeAuthority.authorizedRange.startFrameInclusive
  const provisionalProvider = isProviderDecision(sourceStrategy.decision)
  const provisionalInert = isInertDecision(sourceStrategy.decision)
  const provisionalEstimateInput = {
    durationFrames,
    providerRequired: provisionalProvider,
    noAction: provisionalInert,
  }
  const provisionalTimeEstimate = input.estimators.estimateTime(
    input.manifest.timeEstimator,
    provisionalEstimateInput,
  )
  const provisionalCreditEstimate = input.estimators.estimateCredit(
    input.manifest.creditEstimator,
    provisionalEstimateInput,
  )
  if (
    !provisionalInert && (
      provisionalTimeEstimate.maximumSeconds > assignment.maximumTimeSeconds ||
      provisionalCreditEstimate.maximumCredits > assignment.maximumCredits
    )
  ) {
    sourceStrategy = { decision: 'use_no_broll', reason: 'The planned route exceeds the approved time or credit ceiling.' }
  }

  const concept = directBrollConcept({ assignment, context, role: editorialRole, sourceStrategy })
  const inert = isInertDecision(sourceStrategy.decision)
  const shotSpecification = inert
    ? undefined
    : buildBrollShotSpecification({
      assignment, context, role: editorialRole, concept, sourceStrategy,
    })
  const timing = planBrollTimingAndComposition({
    assignment,
    context,
    role: editorialRole,
    strategy: sourceStrategy,
  })
  const providerRequestPlanned = isProviderDecision(sourceStrategy.decision)
  const audioDisposition = providerRequestPlanned
    ? 'discard' as const
    : sourceStrategy.decision === 'use_existing_project_clip'
      ? 'retain_source_audio' as const
      : 'discard' as const
  const coordination = coordinateBrollSkills({
    assignment,
    context,
    audioReviewNeeded: audioDisposition !== 'discard',
  })
  const omniRequestPlan = planBrollOmniRequest({
    assignment,
    strategy: sourceStrategy,
    shotSpecification,
    timing,
  })
  if (providerRequestPlanned !== Boolean(omniRequestPlan)) {
    throw new Error('B-roll provider route lacks an exact Omni request plan.')
  }
  const finalEstimateInput = {
    durationFrames,
    providerRequired: providerRequestPlanned,
    noAction: inert,
  }
  const timeEstimate = input.estimators.estimateTime(input.manifest.timeEstimator, finalEstimateInput)
  const creditEstimate = input.estimators.estimateCredit(input.manifest.creditEstimator, finalEstimateInput)
  const providerRequestPackageHash = omniRequestPlan
    ? hashSkillValue(omniRequestPlan)
    : undefined
  const providerCreditEstimate = providerRequestPlanned ? creditEstimate.expectedCredits : 0
  const lowerCostDecision = context.sourceCandidates.some((candidate) =>
    candidate.sourceType === 'existing_project_clip')
    ? 'use_existing_project_clip' as const
    : 'use_no_broll' as const
  const providerSourceArtifactRefs = sourceStrategy.providerReferenceImages?.map((item) =>
    item.candidate.artifactRef) ?? (
    sourceStrategy.selected?.candidate.sourceType === 'reference_image'
      ? [sourceStrategy.selected.candidate.artifactRef]
      : undefined
  )
  const planEvidence = createBrollPlanningQaPlanEvidence({
    schemaVersion: 'b_roll_planning_qa_plan_evidence_v1',
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    manifestRef: assignment.manifestRef,
    authorizedRange: timing.authorizedRange,
    decision: sourceStrategy.decision,
    editorialRole,
    reason: sourceStrategy.reason,
    ...(sourceStrategy.selected ? {
      sourceCandidateId: sourceStrategy.selected.candidate.sourceId,
      sourceArtifactHash: sourceStrategy.selected.candidate.artifactRef.sha256,
      sourceScore: sourceStrategy.selected.score,
    } : {}),
    ...(providerSourceArtifactRefs ? {
      providerSourceArtifactHashes: providerSourceArtifactRefs.map((reference) => reference.sha256),
    } : {}),
    ...(timing.sourceTrim ? { sourceTrim: timing.sourceTrim } : {}),
    ...(shotSpecification ? { shotSpecification } : {}),
    displayTreatment: timing.displayTreatment,
    ...(timing.cropSafeProviderAspectRatio
      ? { cropSafeProviderAspectRatio: timing.cropSafeProviderAspectRatio }
      : {}),
    speakerVisibilityIntent: timing.speakerVisibilityIntent,
    captionSafeBehavior: timing.captionSafeBehavior,
    audioDisposition,
    entryIntent: timing.entryIntent,
    exitIntent: timing.exitIntent,
    coordination: {
      ...coordination,
      finalOwners: [...coordination.finalOwners],
    },
    providerRequestPlanned,
    ...(providerRequestPackageHash ? { providerRequestPackageHash } : {}),
    providerCreditEstimate,
    ...(sourceStrategy.decision === 'needs_other_skill' ? {
      dependencySkillKey: sourceStrategy.dependencySkillKey,
      requiredDependencyArtifactType: 'track_graph_v1',
      requiredForPhase: 'skill_execution',
    } : {}),
    timeEstimateSeconds: timeEstimate.expectedSeconds,
    creditEstimate: creditEstimate.expectedCredits,
    lowerCostDecision,
    outsideAuthorizedRangeModified: false,
  })
  const planningQaReport = createBrollPlanningQaReport({
    assignment,
    context,
    planEvidence,
    qa: input.qa,
  })
  const planningQaPassed = planningQaReport.planningQaPassed
  if (!planningQaPassed) {
    throw new Error(
      `B-roll planning QA failed: ${planningQaReport.blockingFindingKeys.join(', ')}`,
    )
  }
  const planningQaEvidenceHash = hashSkillValue(planningQaReport)

  const core = brollPlanCoreSchema.parse({
    schemaVersion: 'b_roll_plan_v1',
    planId: `broll-plan-${assignment.assignmentHash.slice(0, 24)}`,
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    manifestRef: assignment.manifestRef,
    authorizedRange: timing.authorizedRange,
    decision: sourceStrategy.decision,
    editorialRole,
    reason: sourceStrategy.reason,
    ...(sourceStrategy.selected ? {
      sourceCandidateId: sourceStrategy.selected.candidate.sourceId,
      sourceArtifactRef: sourceStrategy.selected.candidate.artifactRef,
      sourceScore: sourceStrategy.selected.score,
    } : {}),
    ...(providerSourceArtifactRefs ? { providerSourceArtifactRefs } : {}),
    ...(shotSpecification ? { shotSpecification } : {}),
    displayTreatment: timing.displayTreatment,
    ...(timing.sourceTrim ? { sourceTrim: timing.sourceTrim } : {}),
    ...(timing.cropSafeProviderAspectRatio ? { cropSafeProviderAspectRatio: timing.cropSafeProviderAspectRatio } : {}),
    speakerVisibilityIntent: timing.speakerVisibilityIntent,
    captionSafeBehavior: timing.captionSafeBehavior,
    audioDisposition,
    entryIntent: timing.entryIntent,
    exitIntent: timing.exitIntent,
    coordination,
    providerRequestPlanned,
    ...(providerRequestPackageHash ? { providerRequestPackageHash } : {}),
    providerCreditEstimate,
    ...(sourceStrategy.decision === 'needs_other_skill' ? {
      dependencySkillKey: sourceStrategy.dependencySkillKey,
      requiredDependencyArtifactType: 'track_graph_v1',
      requiredForPhase: 'skill_execution',
    } : {}),
    timeEstimateSeconds: timeEstimate.expectedSeconds,
    creditEstimate: creditEstimate.expectedCredits,
    lowerCostDecision,
    planningQaPlanEvidenceHash: planEvidence.planEvidenceHash,
    planningQaReportArtifactType: 'b_roll_planning_qa_report_v1',
    planningQaReportHash: planningQaEvidenceHash,
    planningQaPassed,
    outsideAuthorizedRangeModified: false,
  })
  const plan = brollPlanArtifactSchema.parse({ ...core, planHash: hashSkillValue(core) })
  assertBrollPlanRuntimeInvariants({
    assignment,
    plan,
    omniRequestPlan,
    planningQaReport,
    planningContextHash: context.contextHash,
    requireExactProviderRequestPackage: true,
    requireExactPlanningQaReport: true,
  })
  return {
    plan,
    omniRequestPlan,
    planningQaPlanEvidence: planEvidence,
    planningQaReport,
    planningQaEvidenceHash,
  }
}
