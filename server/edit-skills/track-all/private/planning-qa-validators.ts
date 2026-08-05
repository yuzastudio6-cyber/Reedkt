import { z } from 'zod'

import {
  masterTimingPlanSchema,
  sourceInventorySchema,
  visualOwnershipManifestSchema,
} from '../../shared/assignment-authorities'
import { skillAssignmentSchema } from '../../core/skill-assignment-schema'
import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillCapabilityManifestSchema } from '../../core/skill-capability-manifest-schema'
import { createSkillQaFinding, skillQaFindingSchema } from '../../core/skill-qa-registry'
import {
  TRACK_ALL_DECISIONS,
  sourceFrameAuthoritySchema,
  trackAllAssignmentSchema,
  trackAllSceneContextSchema,
  trackAllTargetSpecificationSchema,
  visualIntelligenceTargetEvidenceSchema,
} from '../track-all-schemas'

const planningQaInputSchema = z.object({
  genericAssignment: skillAssignmentSchema,
  assignment: trackAllAssignmentSchema,
  target: trackAllTargetSpecificationSchema,
  sourceInventory: sourceInventorySchema,
  masterTiming: masterTimingPlanSchema,
  sourceFrames: sourceFrameAuthoritySchema,
  visualOwnership: visualOwnershipManifestSchema,
  sceneContext: trackAllSceneContextSchema,
  visualIntelligenceEvidence: visualIntelligenceTargetEvidenceSchema.optional(),
  existingTrackGraphPresent: z.boolean(),
  priorTrackRepairEvidencePresent: z.boolean(),
  captionReservedZonesPresent: z.boolean(),
  manifest: skillCapabilityManifestSchema,
  decision: z.enum(TRACK_ALL_DECISIONS),
  executable: z.boolean(),
  samWorkPlanned: z.boolean(),
  visibleTreatmentPlanned: z.boolean(),
  initializationFrame: z.number().int().nonnegative().optional(),
  chunkPlan: z.object({
    maximumFramesPerChunk: z.number().int().positive(),
    chunks: z.array(z.object({
      chunkId: z.string().trim().min(1).max(180),
      range: z.object({ startFrameInclusive: z.number().int().nonnegative(), endFrameExclusive: z.number().int().positive(), fps: z.number().int().positive() }).strict(),
      overlapFramesBefore: z.number().int().nonnegative(),
      overlapFramesAfter: z.number().int().nonnegative(),
    }).strict()).max(1_000),
  }).strict(),
  expectedObjects: z.number().int().nonnegative(),
  bucketCount: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  computedTimeExpected: z.number().int().nonnegative(),
  computedCreditExpected: z.number().int().nonnegative(),
  routeEvaluationKeys: z.array(z.string().trim().min(1).max(180)).min(1).max(20),
  promptStrategyEvidenceHash: z.string().regex(/^[a-f0-9]{64}$/u).optional(),
  sessionLifecycleEvidenceHash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()

function contains(child: { startFrameInclusive: number; endFrameExclusive: number; fps: number }, parent: { startFrameInclusive: number; endFrameExclusive: number; fps: number }) {
  return child.fps === parent.fps && child.startFrameInclusive >= parent.startFrameInclusive && child.endFrameExclusive <= parent.endFrameExclusive
}

function finding(input: {
  qaKey: string
  passed: boolean
  warning?: boolean
  summary: string
  evidence: readonly unknown[]
  observations: Readonly<Record<string, unknown>>
}) {
  return createSkillQaFinding({
    qaKey: input.qaKey,
    validatorVersion: `${input.qaKey}.validator.v1`,
    disposition: input.passed ? input.warning ? 'warning' : 'pass' : 'blocking',
    summary: input.summary,
    evidenceHashes: [...new Set(input.evidence.map(hashSkillValue))],
    observations: input.observations,
  })
}

export function deriveTrackAllPlanningQaFindings(raw: unknown) {
  const input = planningQaInputSchema.parse(raw)
  const selectedSource = input.sourceInventory.candidates.find((candidate) =>
    candidate.sourceId === input.sourceFrames.sourceId &&
    candidate.artifactRef.sha256 === input.sourceFrames.sourceChecksum)
  const manifestExact = hashSkillValue(input.assignment.manifestRef) === hashSkillValue(input.genericAssignment.manifestRef) && input.genericAssignment.manifestRef.manifestHash === input.manifest.manifestHash
  const rangeExact = hashSkillValue(input.genericAssignment.authorizedRange) === hashSkillValue(input.assignment.authorizedWriteRange) && contains(input.assignment.authorizedWriteRange, input.assignment.analysisContextRange)
  const sceneExact = hashSkillValue(input.sceneContext.authorizedWriteRange) === hashSkillValue(input.assignment.authorizedWriteRange) && hashSkillValue(input.sceneContext.analysisContextRange) === hashSkillValue(input.assignment.analysisContextRange)
  const timingExact = hashSkillValue(input.masterTiming.assignmentRange) === hashSkillValue(input.assignment.authorizedWriteRange) && input.masterTiming.fps === input.assignment.authorizedWriteRange.fps
  const sourceExact = selectedSource !== undefined && contains(input.assignment.authorizedWriteRange, input.sourceFrames.range) && selectedSource.artifactRef.ownerUserId === input.assignment.ownerUserId && selectedSource.artifactRef.workspaceId === input.assignment.workspaceId && selectedSource.artifactRef.projectId === input.assignment.projectId
  const ownershipConflict = input.visualOwnership.ownershipWindows.some((window) => window.exclusive && window.ownerSkillKey !== 'track_all' && window.frameRange.startFrameInclusive < input.assignment.authorizedWriteRange.endFrameExclusive && input.assignment.authorizedWriteRange.startFrameInclusive < window.frameRange.endFrameExclusive)
  const targetCountValid = input.target.expectedMaximumCount <= input.assignment.permissions.maximumObjects && input.target.expectedMaximumCount >= input.target.expectedMinimumCount
  const exclusionsValid = input.assignment.editorialRequest.exclusions.every((exclusion) => input.target.excludeRules.includes(exclusion))
  const privacyFailClosed = input.target.targetCriticality !== 'privacy_critical' || input.target.lostTrackBehavior === 'conservative_cover' && input.assignment.editorialRequest.uncertaintyBehavior === 'conservative_cover'
  const ambiguitySafe = input.visualIntelligenceEvidence?.ambiguity !== 'uncertain' || !input.executable
  const chunkSafe = !input.executable || input.chunkPlan.chunks.length > 0 && input.chunkPlan.chunks.length <= input.assignment.permissions.maximumChunks && input.chunkPlan.chunks.every((chunk) => contains(chunk.range, input.assignment.authorizedWriteRange))
  const initializationSafe = !input.samWorkPlanned || input.initializationFrame !== undefined && input.initializationFrame >= input.assignment.authorizedWriteRange.startFrameInclusive && input.initializationFrame < input.assignment.authorizedWriteRange.endFrameExclusive
  const semanticDependencyComplete = input.decision !== 'needs_visual_intelligence' || input.visualIntelligenceEvidence === undefined
  const existingTrackDependencyComplete = !(
    input.target.targetType === 'existing_track' ||
    input.assignment.editorialRequest.intendedTreatment === 'repair'
  ) || input.existingTrackGraphPresent
  const repairDependencyComplete = input.assignment.editorialRequest.intendedTreatment !== 'repair' ||
    input.priorTrackRepairEvidencePresent
  const reframeDependencyComplete = input.assignment.editorialRequest.intendedTreatment !== 'tracked_reframe' ||
    input.captionReservedZonesPresent
  const dependencyComplete = semanticDependencyComplete && existingTrackDependencyComplete &&
    repairDependencyComplete && reframeDependencyComplete
  const lowerCostRoutesPrecedeSam = !input.routeEvaluationKeys.includes('sam3_1_masklets') || input.routeEvaluationKeys.indexOf('no_action') < input.routeEvaluationKeys.indexOf('sam3_1_masklets')
  const approvalReady = !input.executable || manifestExact && rangeExact && sceneExact && timingExact && sourceExact && !ownershipConflict
  const rules = [
    finding({ qaKey: 'track_all.qa.assignment_authority', passed: manifestExact && input.assignment.assignmentId === input.genericAssignment.assignmentId, summary: 'Assignment and manifest lineage match exactly.', evidence: [input.assignment, input.genericAssignment], observations: { manifestHash: input.manifest.manifestHash } }),
    finding({ qaKey: 'track_all.qa.range_authority', passed: rangeExact && sceneExact, summary: 'Read context contains but never enlarges write authority.', evidence: [input.assignment.authorizedWriteRange, input.assignment.analysisContextRange, input.sceneContext], observations: { decision: input.decision } }),
    finding({ qaKey: 'track_all.qa.source_authority', passed: sourceExact && timingExact, summary: 'Source checksum, range, and timing resolve exactly.', evidence: [input.sourceInventory, input.sourceFrames, input.masterTiming], observations: { selectedSourceId: selectedSource?.sourceId ?? 'missing' } }),
    finding({ qaKey: 'track_all.qa.target_specificity', passed: input.target.description.length > 0 && input.target.groundingEvidence.length > 0, summary: 'Target has bounded grounding evidence.', evidence: [input.target], observations: { groundingCount: input.target.groundingEvidence.length } }),
    finding({ qaKey: 'track_all.qa.target_ambiguity', passed: ambiguitySafe, summary: 'Ambiguous targets cannot enter execution.', evidence: [input.target, input.visualIntelligenceEvidence ?? { evidence: 'absent' }], observations: { ambiguity: input.visualIntelligenceEvidence?.ambiguity ?? 'not_reported' } }),
    finding({ qaKey: 'track_all.qa.target_count', passed: targetCountValid, summary: 'Expected count fits the approved object budget.', evidence: [input.target.expectedMinimumCount, input.target.expectedMaximumCount, input.assignment.permissions.maximumObjects], observations: { expectedObjects: input.expectedObjects } }),
    finding({ qaKey: 'track_all.qa.concept_exclusion', passed: exclusionsValid, summary: 'Compiled exclusions preserve the editorial request.', evidence: [input.target.excludeRules, input.assignment.editorialRequest.exclusions], observations: { exclusionCount: input.target.excludeRules.length } }),
    finding({ qaKey: 'track_all.qa.privacy_classification', passed: input.target.targetCriticality !== 'privacy_critical' || input.target.privacyClassification !== 'none', summary: 'Privacy criticality has a privacy class.', evidence: [input.target.targetCriticality, input.target.privacyClassification], observations: { privacyClass: input.target.privacyClassification } }),
    finding({ qaKey: 'track_all.qa.tool_eligibility', passed: !input.executable || input.assignment.permissions.deterministicToolsAllowed, summary: 'Execution requires deterministic-tool permission.', evidence: [input.assignment.permissions], observations: { decision: input.decision } }),
    finding({ qaKey: 'track_all.qa.sam_qualification', passed: !input.samWorkPlanned || !['blocked', 'retired'].includes(input.manifest.qualificationStatus), warning: input.samWorkPlanned && input.manifest.qualificationStatus !== 'production_qualified', summary: 'SAM work remains behind route-specific qualification.', evidence: [input.manifest.manifestHash, input.promptStrategyEvidenceHash ?? { sam: 'not_planned' }, input.sessionLifecycleEvidenceHash], observations: { currentQualification: input.manifest.qualificationStatus } }),
    finding({ qaKey: 'track_all.qa.shot_chunk_plan', passed: chunkSafe, summary: 'Shot-aware chunks fit the approved ceiling and range.', evidence: [input.chunkPlan], observations: { chunkCount: input.chunkPlan.chunks.length } }),
    finding({ qaKey: 'track_all.qa.initialization_frame', passed: initializationSafe, summary: 'Initialization frame is visible and in range.', evidence: [input.initializationFrame ?? -1, input.assignment.authorizedWriteRange], observations: { initializationFrame: input.initializationFrame ?? 'not_required' } }),
    finding({ qaKey: 'track_all.qa.object_budget', passed: input.expectedObjects <= input.assignment.permissions.maximumObjects, summary: 'Object count fits assignment authority.', evidence: [input.expectedObjects, input.assignment.permissions.maximumObjects], observations: { expectedObjects: input.expectedObjects } }),
    finding({ qaKey: 'track_all.qa.multiplex_budget', passed: input.bucketCount === (input.expectedObjects === 0 ? 0 : Math.ceil(input.expectedObjects / 16)) && input.bucketCount <= Math.ceil(input.assignment.permissions.maximumObjects / 16), summary: 'Multiplex bucket count is explicit and bounded.', evidence: [input.expectedObjects, input.bucketCount, input.sessionCount], observations: { bucketCount: input.bucketCount, sessionCount: input.sessionCount } }),
    finding({ qaKey: 'track_all.qa.time_estimate', passed: !input.executable || input.computedTimeExpected <= input.assignment.permissions.maximumTimeSeconds, summary: 'Expected time fits the approved ceiling or failed closed.', evidence: [input.computedTimeExpected, input.assignment.permissions.maximumTimeSeconds, input.decision], observations: { expectedSeconds: input.computedTimeExpected } }),
    finding({ qaKey: 'track_all.qa.credit_estimate', passed: !input.executable || input.computedCreditExpected <= input.assignment.permissions.maximumCredits, summary: 'Expected internal cost fits the approved ceiling or failed closed.', evidence: [input.computedCreditExpected, input.assignment.permissions.maximumCredits, input.decision], observations: { expectedCredits: input.computedCreditExpected } }),
    finding({ qaKey: 'track_all.qa.lower_cost_route', passed: lowerCostRoutesPrecedeSam, summary: 'Existing graph, deterministic geometry, and no-action are evaluated before SAM.', evidence: [input.routeEvaluationKeys], observations: { routeEvaluationKeys: input.routeEvaluationKeys } }),
    finding({ qaKey: 'track_all.qa.ownership_conflict', passed: !ownershipConflict || !input.visibleTreatmentPlanned, summary: 'Visible treatment cannot displace another exclusive owner.', evidence: [input.visualOwnership, input.visibleTreatmentPlanned], observations: { ownershipConflict } }),
    finding({ qaKey: 'track_all.qa.dependency_completeness', passed: dependencyComplete, summary: 'Semantic, prior-track, repair, and caption-zone dependencies are complete or fail closed.', evidence: [input.decision, input.visualIntelligenceEvidence ?? { evidence: 'missing' }, input.existingTrackGraphPresent, input.priorTrackRepairEvidencePresent, input.captionReservedZonesPresent], observations: { decision: input.decision, existingTrackGraphPresent: input.existingTrackGraphPresent, priorTrackRepairEvidencePresent: input.priorTrackRepairEvidencePresent, captionReservedZonesPresent: input.captionReservedZonesPresent } }),
    finding({ qaKey: 'track_all.qa.no_action_consideration', passed: input.routeEvaluationKeys[0] === 'no_action', summary: 'No-action remains the first professional route considered.', evidence: [input.routeEvaluationKeys], observations: { firstRoute: input.routeEvaluationKeys[0] } }),
    finding({ qaKey: 'track_all.qa.repair_policy', passed: input.assignment.permissions.maximumAttempts <= 3, summary: 'Attempts and repairs are bounded.', evidence: [input.assignment.permissions.maximumAttempts], observations: { maximumAttempts: input.assignment.permissions.maximumAttempts } }),
    finding({ qaKey: 'track_all.qa.range_expansion', passed: input.decision !== 'needs_range_expansion' || !input.executable, summary: 'Range expansion is explicit and cannot mutate media.', evidence: [input.decision, input.assignment.authorizedWriteRange], observations: { decision: input.decision } }),
    finding({ qaKey: 'track_all.qa.approval_readiness', passed: approvalReady, summary: 'Executable work is exact, source-bound, timed, and ownership-safe.', evidence: [manifestExact, rangeExact, sourceExact, timingExact, ownershipConflict], observations: { decision: input.decision } }),
    finding({ qaKey: 'track_all.qa.privacy_fail_closed', passed: privacyFailClosed, summary: 'Privacy uncertainty conservatively covers or blocks.', evidence: [input.target.lostTrackBehavior, input.assignment.editorialRequest.uncertaintyBehavior], observations: { targetCriticality: input.target.targetCriticality } }),
  ]
  return z.array(skillQaFindingSchema).length(24).parse(rules)
}

export { planningQaInputSchema as trackAllPlanningQaValidatorInputSchema }
