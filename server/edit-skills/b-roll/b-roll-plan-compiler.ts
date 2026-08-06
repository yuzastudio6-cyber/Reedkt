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
  const concept = directBrollConcept({ assignment, context, role: editorialRole, sourceStrategy })
  if (concept.rejectedAsRepeated) {
    sourceStrategy = { decision: 'use_no_broll', reason: 'The proposed concept repeats an earlier B-roll treatment; keep the base scene.' }
  }
  const shotSpecification = buildBrollShotSpecification({
    assignment, context, role: editorialRole, concept, sourceStrategy,
  })
  const timing = planBrollTimingAndComposition({ assignment, context, role: editorialRole, strategy: sourceStrategy })
  const providerRequestPlanned = ['generate_with_gemini_omni', 'edit_uploaded_video_with_gemini_omni', 'refine_generated_omni_candidate']
    .includes(sourceStrategy.decision)
  const audioDisposition = providerRequestPlanned
    ? 'discard' as const
    : sourceStrategy.decision === 'use_existing_project_clip' ? 'retain_source_audio' as const : 'discard' as const
  const coordination = coordinateBrollSkills({ assignment, context, audioReviewNeeded: audioDisposition !== 'discard' })
  const omniRequestPlan = planBrollOmniRequest({ assignment, strategy: sourceStrategy, shotSpecification, timing })
  if (providerRequestPlanned !== Boolean(omniRequestPlan)) {
    throw new Error('B-roll provider route lacks an exact Omni request plan.')
  }
  const durationFrames = timing.authorizedRange.endFrameExclusive - timing.authorizedRange.startFrameInclusive
  const estimateInput = {
    durationFrames,
    providerRequired: providerRequestPlanned,
    noAction: sourceStrategy.decision === 'use_no_broll',
  }
  const timeEstimate = input.estimators.estimateTime(input.manifest.timeEstimator, estimateInput)
  const creditEstimate = input.estimators.estimateCredit(input.manifest.creditEstimator, estimateInput)
  if (timeEstimate.maximumSeconds > assignment.maximumTimeSeconds || creditEstimate.maximumCredits > assignment.maximumCredits) {
    sourceStrategy = { decision: 'use_no_broll', reason: 'The planned route exceeds the approved time or credit ceiling.' }
  }

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
    timeEstimateSeconds: timeEstimate.expectedSeconds,
    creditEstimate: creditEstimate.expectedCredits,
    lowerCostDecision: context.sourceCandidates.some((candidate) => candidate.sourceType === 'existing_project_clip')
      ? 'use_existing_project_clip' : 'use_no_broll',
    planningQaPassed,
    outsideAuthorizedRangeModified: false,
  })
  const plan = brollPlanArtifactSchema.parse({ ...core, planHash: hashSkillValue(core) })
  return { plan, omniRequestPlan, planningQaEvidenceHash }
}
