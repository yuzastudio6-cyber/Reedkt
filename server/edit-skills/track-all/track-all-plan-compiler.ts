import type { SkillAssignment } from '../core/skill-assignment-types'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import { isFrameRangeContained } from '../core/skill-range-authority'
import type { BrollMasterTimingPlan, BrollSourceInventory, BrollVisualOwnershipManifest } from '../b-roll/b-roll-input-authorities'
import {
  createTrackAllPlan,
  createTrackAllPlanningQaReport,
  type TrackAllAssignment,
  type TrackAllTargetSpecification,
  type TrackAllPlan,
  type TrackAllPlanningQaReport,
} from './track-all-schemas'
import type { z } from 'zod'
import {
  privacyPolicySnapshotSchema,
  sourceFrameAuthoritySchema,
  trackAllSceneContextSchema,
  visualIntelligenceTargetEvidenceSchema,
} from './track-all-schemas'

type SourceFrames = z.infer<typeof sourceFrameAuthoritySchema>
type SceneContext = z.infer<typeof trackAllSceneContextSchema>
type ViTargetEvidence = z.infer<typeof visualIntelligenceTargetEvidenceSchema>
type PrivacyPolicy = z.infer<typeof privacyPolicySnapshotSchema>

export interface TrackAllPlanningAuthority {
  genericAssignment: SkillAssignment
  assignment: TrackAllAssignment
  target: TrackAllTargetSpecification
  sourceInventory: BrollSourceInventory
  masterTiming: BrollMasterTimingPlan
  sourceFrames: SourceFrames
  visualOwnership: BrollVisualOwnershipManifest
  sceneContext: SceneContext
  visualIntelligenceEvidence?: ViTargetEvidence
  privacyPolicy?: PrivacyPolicy
}

export interface CompiledTrackAllPlan {
  plan: TrackAllPlan
  planningQaReport: TrackAllPlanningQaReport
}

const privacyTreatments = new Set(['privacy_redaction'])
const samTargetTypes = new Set(['selected_instance', 'concept_group', 'selected_group', 'freeform_region', 'track_child_region', 'track_parent_region'])

function disposition(
  qaKey: string,
  passed: boolean,
  message: string,
  evidence: unknown[],
  warning = false,
) {
  return {
    qaKey,
    validatorVersion: `${qaKey}.validator.v1`,
    disposition: passed ? warning ? 'warning' as const : 'pass' as const : 'blocking' as const,
    evidenceHashes: evidence.map(hashSkillValue),
    message,
  }
}

function rangeHasFrame(range: TrackAllAssignment['authorizedWriteRange'], frame: number): boolean {
  return frame >= range.startFrameInclusive && frame < range.endFrameExclusive
}

function targetGroundingFrames(target: TrackAllTargetSpecification): number[] {
  return target.groundingEvidence.flatMap((evidence) => 'frameIndex' in evidence ? [evidence.frameIndex] : [])
}

function buildChunks(input: {
  range: TrackAllAssignment['authorizedWriteRange']
  privacyCritical: boolean
  expectedObjects: number
  shotBoundaries: readonly number[]
}) {
  const maximumFramesPerChunk = 240
  const dynamicOverlap = input.privacyCritical ? 48 : input.expectedObjects > 16 ? 36 : 24
  const boundaries = [
    input.range.startFrameInclusive,
    ...input.shotBoundaries.filter((frame) => frame > input.range.startFrameInclusive && frame < input.range.endFrameExclusive),
    input.range.endFrameExclusive,
  ]
  const chunks: { chunkId: string; range: TrackAllAssignment['authorizedWriteRange']; overlapFramesBefore: number; overlapFramesAfter: number }[] = []
  for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex += 1) {
    const shotStart = boundaries[boundaryIndex]!
    const shotEnd = boundaries[boundaryIndex + 1]!
    let cursor = shotStart
    while (cursor < shotEnd) {
      const end = Math.min(shotEnd, cursor + maximumFramesPerChunk)
      chunks.push({
        chunkId: `track-chunk-${chunks.length + 1}`,
        range: { startFrameInclusive: cursor, endFrameExclusive: end, fps: input.range.fps },
        overlapFramesBefore: cursor === shotStart ? 0 : Math.min(dynamicOverlap, cursor - shotStart),
        overlapFramesAfter: end === shotEnd ? 0 : Math.min(dynamicOverlap, shotEnd - end),
      })
      cursor = end
    }
  }
  return { maximumFramesPerChunk, chunks }
}

function initialDecision(authority: TrackAllPlanningAuthority): TrackAllPlan['decision'] {
  const { assignment, target, visualIntelligenceEvidence, privacyPolicy } = authority
  if (assignment.editorialRequest.intendedTreatment === 'no_action' || assignment.editorialRequest.requestedJobType === 'track_all.no_action') return 'use_no_tracking'
  const groundFrames = targetGroundingFrames(target)
  if (groundFrames.some((frame) => !rangeHasFrame(assignment.authorizedWriteRange, frame))) {
    return groundFrames.every((frame) => rangeHasFrame(assignment.analysisContextRange, frame))
      ? 'needs_range_expansion'
      : 'blocked'
  }
  const semanticGrounding = target.groundingEvidence.some((evidence) => evidence.kind === 'text_concept' || evidence.kind === 'visual_intelligence_grounding')
  if ((target.targetType === 'concept_group' || semanticGrounding) && !visualIntelligenceEvidence) return 'needs_visual_intelligence'
  if (visualIntelligenceEvidence?.ambiguity === 'multiple_candidates') return 'needs_user_selection'
  if (visualIntelligenceEvidence?.ambiguity === 'uncertain') return target.ambiguityBehavior === 'request_user_selection' ? 'needs_user_selection' : 'multiple_targets_ambiguous'
  if (privacyTreatments.has(assignment.editorialRequest.intendedTreatment) && !privacyPolicy) return 'needs_user_confirmation'
  if (target.expectedMaximumCount > assignment.permissions.maximumObjects) return 'needs_user_confirmation'
  if (!assignment.permissions.deterministicToolsAllowed) return 'blocked'
  if (samTargetTypes.has(target.targetType) && !assignment.permissions.sam3_1Allowed) return 'blocked'
  switch (assignment.editorialRequest.intendedTreatment) {
    case 'privacy_redaction': return 'apply_privacy_redaction'
    case 'tracked_focus': return 'apply_tracked_focus'
    case 'tracked_reframe': return 'prepare_tracked_reframe'
    case 'planar_geometry': return 'track_planar_region'
    case 'repair': return 'repair_existing_track'
    case 'geometry_only': return 'produce_track_graph'
  }
}

function isExecutableDecision(decision: TrackAllPlan['decision']): boolean {
  return ['produce_track_graph', 'apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe', 'track_planar_region', 'repair_existing_track'].includes(decision)
}

export function compileTrackAllPlan(input: {
  authority: TrackAllPlanningAuthority
  manifest: Readonly<SkillCapabilityManifest>
  createdAt?: string
}): CompiledTrackAllPlan {
  const { authority, manifest } = input
  const { genericAssignment, assignment, target, sourceInventory, masterTiming, sourceFrames, visualOwnership, sceneContext } = authority
  const selectedSource = sourceInventory.candidates.find((candidate) =>
    candidate.sourceId === sourceFrames.sourceId &&
    candidate.artifactRef.sha256 === sourceFrames.sourceChecksum)
  const sourceScoped = selectedSource !== undefined && selectedSource.artifactRef.ownerUserId === assignment.ownerUserId && selectedSource.artifactRef.workspaceId === assignment.workspaceId && selectedSource.artifactRef.projectId === assignment.projectId
  const rangeExact = hashSkillValue(genericAssignment.authorizedRange) === hashSkillValue(assignment.authorizedWriteRange) && isFrameRangeContained(assignment.authorizedWriteRange, assignment.analysisContextRange)
  const timingExact = masterTiming.fps === assignment.authorizedWriteRange.fps && isFrameRangeContained(assignment.authorizedWriteRange, masterTiming.assignmentRange)
  const sceneExact = hashSkillValue(sceneContext.authorizedWriteRange) === hashSkillValue(assignment.authorizedWriteRange) && hashSkillValue(sceneContext.analysisContextRange) === hashSkillValue(assignment.analysisContextRange)
  const sourceExact = sourceFrames.range.fps === assignment.authorizedWriteRange.fps && isFrameRangeContained(assignment.authorizedWriteRange, sourceFrames.range) && sourceScoped
  const manifestExact = hashSkillValue(assignment.manifestRef) === hashSkillValue(genericAssignment.manifestRef) && genericAssignment.manifestRef.manifestHash === manifest.manifestHash
  const targetCountValid = target.expectedMaximumCount <= assignment.permissions.maximumObjects && target.expectedMaximumCount >= target.expectedMinimumCount
  const exclusionsValid = assignment.editorialRequest.exclusions.every((exclusion) => target.excludeRules.includes(exclusion))
  const ownershipConflict = visualOwnership.ownershipWindows.some((window) => window.exclusive && window.ownerSkillKey !== 'track_all' && window.frameRange.startFrameInclusive < assignment.authorizedWriteRange.endFrameExclusive && assignment.authorizedWriteRange.startFrameInclusive < window.frameRange.endFrameExclusive)
  let decision = initialDecision(authority)
  const expectedObjects = isExecutableDecision(decision) ? Math.max(target.expectedMinimumCount, assignment.editorialRequest.expectedCount) : 0
  const chunks = isExecutableDecision(decision) ? buildChunks({ range: assignment.authorizedWriteRange, privacyCritical: target.targetCriticality === 'privacy_critical', expectedObjects, shotBoundaries: sceneContext.shotBoundaries }) : { maximumFramesPerChunk: 240, chunks: [] }
  const bucketCount = expectedObjects === 0 ? 0 : Math.ceil(expectedObjects / 16)
  const samWorkCandidate = isExecutableDecision(decision) && samTargetTypes.has(target.targetType) && decision !== 'track_planar_region' && decision !== 'repair_existing_track'
  const sessionCount = samWorkCandidate ? chunks.chunks.length * Math.max(1, bucketCount) : 0
  const frameCount = assignment.authorizedWriteRange.endFrameExclusive - assignment.authorizedWriteRange.startFrameInclusive
  const expectedSeconds = isExecutableDecision(decision)
    ? Math.ceil(frameCount / assignment.authorizedWriteRange.fps) + chunks.chunks.length * 4 + sessionCount * 18 + (decision === 'apply_privacy_redaction' ? 20 : 6)
    : 0
  const expectedCredits = isExecutableDecision(decision) ? sessionCount * 4 + chunks.chunks.length + (decision === 'apply_privacy_redaction' ? 3 : 1) : 0
  if (isExecutableDecision(decision) && (expectedSeconds > assignment.permissions.maximumTimeSeconds || expectedCredits > assignment.permissions.maximumCredits)) {
    decision = assignment.permissions.manualReviewPermitted ? 'needs_user_confirmation' : 'blocked'
  }
  const executable = isExecutableDecision(decision)
  const samWorkPlanned = executable && samWorkCandidate
  const visibleTreatmentPlanned = executable && ['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(decision)
  const finalExpectedSeconds = executable ? expectedSeconds : 0
  const finalExpectedCredits = executable ? expectedCredits : 0
  const initializationFrame = samWorkPlanned
    ? target.initializationFramePreference ?? targetGroundingFrames(target)[0] ?? Math.floor((assignment.authorizedWriteRange.startFrameInclusive + assignment.authorizedWriteRange.endFrameExclusive - 1) / 2)
    : undefined
  const dependencyComplete = decision !== 'needs_visual_intelligence' || !authority.visualIntelligenceEvidence
  const privacyFailClosed = target.targetCriticality !== 'privacy_critical' || (target.lostTrackBehavior === 'conservative_cover' && assignment.editorialRequest.uncertaintyBehavior === 'conservative_cover')
  const findings = [
    disposition('track_all.qa.assignment_authority', manifestExact && assignment.assignmentId === genericAssignment.assignmentId, 'Assignment and manifest lineage must match exactly.', [assignment, genericAssignment]),
    disposition('track_all.qa.range_authority', rangeExact && sceneExact, 'Read context contains but never enlarges write authority.', [assignment.authorizedWriteRange, assignment.analysisContextRange, sceneContext]),
    disposition('track_all.qa.source_authority', sourceExact && timingExact, 'Source checksum, range, and timing resolve exactly.', [sourceInventory, sourceFrames, masterTiming]),
    disposition('track_all.qa.target_specificity', target.description.length > 0 && target.groundingEvidence.length > 0, 'Target has bounded grounding evidence.', [target]),
    disposition('track_all.qa.target_ambiguity', authority.visualIntelligenceEvidence?.ambiguity !== 'uncertain' || !executable, 'Ambiguous targets cannot enter execution.', [target, authority.visualIntelligenceEvidence ?? { none: true }]),
    disposition('track_all.qa.target_count', targetCountValid, 'Expected count fits the approved object budget.', [target.expectedMinimumCount, target.expectedMaximumCount, assignment.permissions.maximumObjects]),
    disposition('track_all.qa.concept_exclusion', exclusionsValid, 'Compiled exclusions preserve the editorial request.', [target.excludeRules, assignment.editorialRequest.exclusions]),
    disposition('track_all.qa.privacy_classification', target.targetCriticality !== 'privacy_critical' || target.privacyClassification !== 'none', 'Privacy criticality has a privacy class.', [target.targetCriticality, target.privacyClassification]),
    disposition('track_all.qa.tool_eligibility', !executable || assignment.permissions.deterministicToolsAllowed, 'Execution requires deterministic-tool permission.', [assignment.permissions]),
    disposition('track_all.qa.sam_qualification', !samWorkPlanned || manifest.qualificationStatus !== 'retired', 'SAM work is planned only behind route-specific qualification.', [manifest.manifestHash, samWorkPlanned], samWorkPlanned && manifest.qualificationStatus !== 'production_qualified'),
    disposition('track_all.qa.shot_chunk_plan', !executable || (chunks.chunks.length > 0 && chunks.chunks.length <= assignment.permissions.maximumChunks), 'Shot-aware chunks fit the approved ceiling.', [chunks]),
    disposition('track_all.qa.initialization_frame', !samWorkPlanned || initializationFrame !== undefined && rangeHasFrame(assignment.authorizedWriteRange, initializationFrame), 'Initialization frame is visible and in range.', [initializationFrame ?? -1, assignment.authorizedWriteRange]),
    disposition('track_all.qa.object_budget', expectedObjects <= assignment.permissions.maximumObjects, 'Object count fits assignment authority.', [expectedObjects, assignment.permissions.maximumObjects]),
    disposition('track_all.qa.multiplex_budget', bucketCount <= Math.ceil(assignment.permissions.maximumObjects / 16), 'Multiplex bucket count is explicit and bounded.', [bucketCount]),
    disposition('track_all.qa.time_estimate', !executable || finalExpectedSeconds <= assignment.permissions.maximumTimeSeconds, 'Expected time fits the approved ceiling.', [finalExpectedSeconds, assignment.permissions.maximumTimeSeconds]),
    disposition('track_all.qa.credit_estimate', !executable || finalExpectedCredits <= assignment.permissions.maximumCredits, 'Expected internal cost fits the approved ceiling.', [finalExpectedCredits, assignment.permissions.maximumCredits]),
    disposition('track_all.qa.lower_cost_route', true, 'Existing graph, deterministic geometry, and no-action were evaluated first.', [decision, target.targetType]),
    disposition('track_all.qa.ownership_conflict', !ownershipConflict || !visibleTreatmentPlanned, 'Visible treatment cannot displace another exclusive owner.', [visualOwnership, visibleTreatmentPlanned]),
    disposition('track_all.qa.dependency_completeness', dependencyComplete, 'Missing semantic evidence returns an exact dependency instead of a target claim.', [decision, authority.visualIntelligenceEvidence ?? { missing: true }]),
    disposition('track_all.qa.no_action_consideration', true, 'No-action remains an explicit professional route.', [decision]),
    disposition('track_all.qa.repair_policy', assignment.permissions.maximumAttempts <= 3, 'Attempts and repairs are bounded.', [assignment.permissions.maximumAttempts]),
    disposition('track_all.qa.range_expansion', decision !== 'needs_range_expansion' || !executable, 'Range expansion is explicit and cannot mutate media.', [decision, executable]),
    disposition('track_all.qa.approval_readiness', !executable || rangeExact && sourceExact && timingExact && !ownershipConflict, 'Executable work is exact, source-bound, timed, and ownership-safe.', [rangeExact, sourceExact, timingExact, ownershipConflict]),
    disposition('track_all.qa.privacy_fail_closed', privacyFailClosed, 'Privacy uncertainty conservatively covers or blocks.', [target.lostTrackBehavior, assignment.editorialRequest.uncertaintyBehavior]),
  ]
  const planningQaReport = createTrackAllPlanningQaReport({
    schemaVersion: 'track_all_planning_qa_report_v1', assignmentHash: assignment.assignmentHash,
    targetHash: target.targetHash, manifestRef: assignment.manifestRef, findings,
    passed: !findings.some((finding) => finding.disposition === 'blocking'),
    createdAt: input.createdAt ?? new Date().toISOString(),
  })
  if (!planningQaReport.passed && executable) decision = 'blocked'
  const finalExecutable = isExecutableDecision(decision)
  const plan = createTrackAllPlan({
    schemaVersion: 'track_all_plan_v1', planId: `track-all-plan-${hashSkillValue({ assignment: assignment.assignmentHash, target: target.targetHash, decision }).slice(0, 24)}`,
    assignmentId: assignment.assignmentId, assignmentHash: assignment.assignmentHash, manifestRef: assignment.manifestRef,
    targetHash: target.targetHash, authorizedRange: assignment.authorizedWriteRange, decision,
    requestedJobType: assignment.editorialRequest.requestedJobType,
    ...(decision === 'needs_visual_intelligence' ? { dependencySkillKey: 'visual_intelligence', requiredDependencyArtifactType: 'visual_intelligence_target_evidence_v1', requiredForPhase: 'skill_planning' } : {}),
    shotPlan: { shotBoundaries: sceneContext.shotBoundaries, shotResetRequired: true },
    chunkPlan: finalExecutable ? chunks : { maximumFramesPerChunk: 240, chunks: [] },
    objectBudget: { expectedObjects: finalExecutable ? expectedObjects : 0, maximumObjects: assignment.permissions.maximumObjects, bucketSize: 16, bucketCount: finalExecutable ? bucketCount : 0, sessionCount: finalExecutable && samWorkCandidate ? sessionCount : 0 },
    ...(finalExecutable && samWorkCandidate ? { initializationFrame } : {}),
    propagationDirection: finalExecutable && samWorkCandidate ? 'both' : 'none',
    samWorkPlanned: finalExecutable && samWorkCandidate, visibleTreatmentPlanned: finalExecutable && visibleTreatmentPlanned,
    privateOutputRequired: true, outsideAuthorizedRangeModified: false,
    maximumAttempts: assignment.permissions.maximumAttempts, maximumRepairs: Math.min(2, Math.max(0, assignment.permissions.maximumAttempts - 1)),
    timeEstimate: { minimumSeconds: finalExecutable ? Math.max(1, Math.floor(finalExpectedSeconds * 0.6)) : 0, expectedSeconds: finalExecutable ? finalExpectedSeconds : 0, maximumSeconds: finalExecutable ? Math.min(assignment.permissions.maximumTimeSeconds, finalExpectedSeconds * 2) : 0 },
    creditEstimate: { minimumCredits: finalExecutable ? Math.max(1, Math.floor(finalExpectedCredits * 0.5)) : 0, expectedCredits: finalExecutable ? finalExpectedCredits : 0, maximumCredits: finalExecutable ? Math.min(assignment.permissions.maximumCredits, finalExpectedCredits * 2) : 0, internalToolCostOnly: true },
    planningQaReportHash: hashSkillValue(planningQaReport), planningQaPassed: planningQaReport.passed,
  })
  return { plan, planningQaReport }
}
