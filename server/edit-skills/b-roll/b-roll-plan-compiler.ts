import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import type { BrollPlanArtifact, BrollPlanningContext, BrollSkillAssignment } from './b-roll-contracts'
import { brollPlanArtifactSchema, brollPlanCoreSchema } from './b-roll-schemas'
import { BROLL_PLANNING_QA_KEYS } from './b-roll-qa-policy'
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
  requireExactProviderRequestPackage?: boolean
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
  if (plan.sourceArtifactRef && (
    plan.sourceArtifactRef.ownerUserId !== input.assignment.ownerUserId ||
    plan.sourceArtifactRef.workspaceId !== input.assignment.workspaceId ||
    plan.sourceArtifactRef.projectId !== input.assignment.projectId
  )) throw new Error('B-roll plan selected a cross-workspace source artifact.')
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

  const qaInputs: Record<string, unknown> = { evidenceHashes: [assignment.assignmentHash, context.contextHash] }
  for (const qaKey of BROLL_PLANNING_QA_KEYS) qaInputs[qaKey] = true
  const findings = BROLL_PLANNING_QA_KEYS.map((qaKey) => input.qa.evaluate(qaKey, qaInputs))
  const planningQaPassed = findings.every((finding) => finding.disposition === 'pass')
  if (!planningQaPassed) throw new Error('B-roll planning QA failed.')
  const planningQaEvidenceHash = hashSkillValue(findings)

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
    ...(omniRequestPlan ? { providerRequestPackageHash: hashSkillValue(omniRequestPlan) } : {}),
    providerCreditEstimate: providerRequestPlanned ? creditEstimate.expectedCredits : 0,
    ...(sourceStrategy.decision === 'needs_other_skill' ? {
      dependencySkillKey: sourceStrategy.dependencySkillKey,
      requiredDependencyArtifactType: 'track_graph_v1',
      requiredForPhase: 'skill_execution',
    } : {}),
    timeEstimateSeconds: timeEstimate.expectedSeconds,
    creditEstimate: creditEstimate.expectedCredits,
    lowerCostDecision: context.sourceCandidates.some((candidate) => candidate.sourceType === 'existing_project_clip')
      ? 'use_existing_project_clip' : 'use_no_broll',
    planningQaPassed,
    outsideAuthorizedRangeModified: false,
  })
  const plan = brollPlanArtifactSchema.parse({ ...core, planHash: hashSkillValue(core) })
  assertBrollPlanRuntimeInvariants({
    assignment,
    plan,
    omniRequestPlan,
    requireExactProviderRequestPackage: true,
  })
  return { plan, omniRequestPlan, planningQaEvidenceHash }
}
