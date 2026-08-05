import type { SkillAssignment } from '../core/skill-assignment-types'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import type { BrollMasterTimingPlan, BrollSourceInventory, BrollVisualOwnershipManifest } from '../b-roll/b-roll-input-authorities'
import type { TrackGraphV2 } from '../shared/track-graph/track-graph-schemas'
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
  priorTrackRepairEvidenceSchema,
  sourceFrameAuthoritySchema,
  trackAllCaptionReservedZonesSchema,
  trackAllSceneContextSchema,
  visualIntelligenceTargetEvidenceSchema,
} from './track-all-schemas'
import {
  compileTrackAllPromptStrategy,
  estimateTrackAllPlan,
  planTrackAllMultiplexBudget,
  planTrackAllSessionLifecycle,
  planTrackAllShotAwareChunks,
  selectTrackAllInitializationFrame,
} from './private/planning-mini-skills'
import { deriveTrackAllPlanningQaFindings } from './private/planning-qa-validators'

type SourceFrames = z.infer<typeof sourceFrameAuthoritySchema>
type SceneContext = z.infer<typeof trackAllSceneContextSchema>
type ViTargetEvidence = z.infer<typeof visualIntelligenceTargetEvidenceSchema>
type PrivacyPolicy = z.infer<typeof privacyPolicySnapshotSchema>
type PriorTrackRepairEvidence = z.infer<typeof priorTrackRepairEvidenceSchema>
type CaptionReservedZones = z.infer<typeof trackAllCaptionReservedZonesSchema>

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
  existingTrackGraph?: TrackGraphV2
  priorTrackRepairEvidence?: PriorTrackRepairEvidence
  captionReservedZones?: CaptionReservedZones
}

export interface CompiledTrackAllPlan {
  plan: TrackAllPlan
  planningQaReport: TrackAllPlanningQaReport
}

const privacyTreatments = new Set(['privacy_redaction'])
const samTargetTypes = new Set(['selected_instance', 'concept_group', 'selected_group', 'freeform_region', 'track_child_region', 'track_parent_region'])

function rangeHasFrame(range: TrackAllAssignment['authorizedWriteRange'], frame: number): boolean {
  return frame >= range.startFrameInclusive && frame < range.endFrameExclusive
}

function targetGroundingFrames(target: TrackAllTargetSpecification): number[] {
  return target.groundingEvidence.flatMap((evidence) => 'frameIndex' in evidence ? [evidence.frameIndex] : [])
}

function initialDecision(authority: TrackAllPlanningAuthority): TrackAllPlan['decision'] {
  const {
    assignment, target, visualIntelligenceEvidence, privacyPolicy,
    existingTrackGraph, priorTrackRepairEvidence, captionReservedZones,
  } = authority
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
  if ((target.targetType === 'existing_track' || assignment.editorialRequest.intendedTreatment === 'repair') && !existingTrackGraph) return 'blocked'
  if (assignment.editorialRequest.intendedTreatment === 'repair' && !priorTrackRepairEvidence) return 'blocked'
  if (assignment.editorialRequest.intendedTreatment === 'tracked_reframe' && !captionReservedZones) return 'blocked'
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
  let decision = initialDecision(authority)
  let routeDisposition: TrackAllPlan['routeDisposition'] = decision === 'use_no_tracking'
    ? 'no_action'
    : decision === 'needs_visual_intelligence'
      ? 'dependency'
      : ['needs_user_selection', 'multiple_targets_ambiguous', 'identity_uncertain', 'target_not_found'].includes(decision)
        ? 'ambiguity'
        : isExecutableDecision(decision)
          ? 'selected'
          : 'authority'
  const expectedObjects = isExecutableDecision(decision) ? Math.max(
    target.expectedMinimumCount,
    assignment.editorialRequest.expectedCount,
    samTargetTypes.has(target.targetType) ? 1 : 0,
  ) : 0
  const samWorkCandidate = isExecutableDecision(decision) && samTargetTypes.has(target.targetType) && decision !== 'track_planar_region' && decision !== 'repair_existing_track'
  const chunkResult = isExecutableDecision(decision) ? planTrackAllShotAwareChunks({
    authorizedRange: assignment.authorizedWriteRange,
    shotBoundaries: sceneContext.shotBoundaries,
    qualifiedMaximumFrames: 240,
    maximumChunks: assignment.permissions.maximumChunks,
    privacyRisk: target.targetCriticality === 'privacy_critical' ? 1 : 0.2,
    targetSpeed: 0.5,
    targetSizeRisk: target.targetType === 'freeform_region' ? 0.6 : 0.3,
    occlusionRisk: target.occlusionPolicy === 'terminate' ? 0.2 : 0.7,
    cameraMotionRisk: 0.5,
    objectCount: expectedObjects,
  }) : undefined
  const chunks = chunkResult
    ? { maximumFramesPerChunk: chunkResult.maximumFramesPerChunk, chunks: chunkResult.chunks }
    : { maximumFramesPerChunk: 240, chunks: [] }
  const budget = planTrackAllMultiplexBudget({
    expectedObjects,
    approvedMaximumObjects: assignment.permissions.maximumObjects,
    chunkCount: chunks.chunks.length,
    bucketSize: 16,
    maximumBuckets: 8,
    samRequired: samWorkCandidate,
  })
  const bucketCount = budget.bucketCount
  const sessionCount = budget.sessionCount
  const frameCount = assignment.authorizedWriteRange.endFrameExclusive - assignment.authorizedWriteRange.startFrameInclusive
  const estimate = estimateTrackAllPlan({
    frameCount, fps: assignment.authorizedWriteRange.fps,
    chunkCount: chunks.chunks.length,
    overlapFrames: chunks.chunks.reduce((total, chunk) => total + chunk.overlapFramesBefore + chunk.overlapFramesAfter, 0),
    targetGroupCount: expectedObjects > 0 ? 1 : 0,
    objectCount: expectedObjects, bucketCount, sessionCount,
    bidirectionalPropagation: samWorkCandidate,
    planarGeometry: decision === 'track_planar_region',
    ocr: assignment.permissions.ocrAllowed && target.privacyClassification !== 'none',
    landmarks: assignment.permissions.landmarkSupportAllowed,
    maskRefinement: samWorkCandidate,
    privacyTreatment: decision === 'apply_privacy_redaction',
    previewRender: ['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(decision),
    qaDepth: 'planning', repairAttempts: decision === 'repair_existing_track' ? 1 : 0,
    noAction: !isExecutableDecision(decision),
  })
  const expectedSeconds = estimate.time.expectedSeconds
  const expectedCredits = estimate.credits.expectedCredits
  if (isExecutableDecision(decision) && expectedSeconds > assignment.permissions.maximumTimeSeconds) {
    routeDisposition = 'time_ceiling'
    decision = assignment.permissions.manualReviewPermitted ? 'needs_user_confirmation' : 'blocked'
  } else if (isExecutableDecision(decision) && expectedCredits > assignment.permissions.maximumCredits) {
    routeDisposition = 'credit_ceiling'
    decision = assignment.permissions.manualReviewPermitted ? 'needs_user_confirmation' : 'blocked'
  }
  const executable = isExecutableDecision(decision)
  const samWorkPlanned = executable && samWorkCandidate
  const visibleTreatmentPlanned = executable && ['apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe'].includes(decision)
  const finalExpectedSeconds = executable ? expectedSeconds : 0
  const finalExpectedCredits = executable ? expectedCredits : 0
  const initialization = samWorkPlanned ? selectTrackAllInitializationFrame({
    authorizedRange: assignment.authorizedWriteRange,
    ...(target.initializationFramePreference === undefined ? {} : { preferredFrame: target.initializationFramePreference }),
    candidates: targetGroundingFrames(target).map((frameIndex) => ({
      frameIndex, visibility: 1, targetSize: 0.8, sharpness: 0.8,
      motionBlur: 0.1, occlusion: 0, similarObjectAmbiguity: 0.1,
      edgeTruncation: 0, cameraStability: 0.8,
    })),
  }) : undefined
  const initializationFrame = initialization?.frameIndex
  const promptStrategy = samWorkPlanned ? compileTrackAllPromptStrategy({ assignment, target }) : undefined
  const sessionLifecycle = planTrackAllSessionLifecycle({
    samRequired: samWorkPlanned, maximumAttempts: assignment.permissions.maximumAttempts,
    chunkCount: executable ? chunks.chunks.length : 0,
    sessionCount: executable ? sessionCount : 0,
  })
  const routeEvaluationKeys = [
    'no_action',
    ...(target.targetType === 'existing_track' ? ['existing_track_graph'] : []),
    ...(assignment.permissions.deterministicToolsAllowed ? ['deterministic_geometry'] : []),
    ...(assignment.permissions.sam3_1Allowed && samTargetTypes.has(target.targetType) ? ['sam3_1_masklets'] : []),
  ]
  const findings = deriveTrackAllPlanningQaFindings({
    genericAssignment, assignment, target, sourceInventory, masterTiming,
    sourceFrames, visualOwnership, sceneContext,
    ...(authority.visualIntelligenceEvidence
      ? { visualIntelligenceEvidence: authority.visualIntelligenceEvidence }
      : {}),
    existingTrackGraphPresent: authority.existingTrackGraph !== undefined,
    priorTrackRepairEvidencePresent: authority.priorTrackRepairEvidence !== undefined,
    captionReservedZonesPresent: authority.captionReservedZones !== undefined,
    manifest, decision, executable, samWorkPlanned, visibleTreatmentPlanned,
    ...(initializationFrame === undefined ? {} : { initializationFrame }),
    chunkPlan: chunks, expectedObjects, bucketCount, sessionCount,
    computedTimeExpected: expectedSeconds,
    computedCreditExpected: expectedCredits,
    routeEvaluationKeys,
    ...(promptStrategy ? { promptStrategyEvidenceHash: promptStrategy.evidenceHash } : {}),
    sessionLifecycleEvidenceHash: sessionLifecycle.evidenceHash,
  })
  const planningQaReport = createTrackAllPlanningQaReport({
    schemaVersion: 'track_all_planning_qa_report_v1', assignmentHash: assignment.assignmentHash,
    targetHash: target.targetHash, manifestRef: assignment.manifestRef, findings,
    passed: !findings.some((finding) => finding.disposition === 'blocking'),
    createdAt: input.createdAt ?? new Date().toISOString(),
  })
  if (!planningQaReport.passed && executable) {
    decision = 'blocked'
    routeDisposition = 'authority'
  }
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
    propagationDirection: finalExecutable && samWorkCandidate ? sessionLifecycle.propagationDirection : 'none',
    samWorkPlanned: finalExecutable && samWorkCandidate, visibleTreatmentPlanned: finalExecutable && visibleTreatmentPlanned,
    privateOutputRequired: true, outsideAuthorizedRangeModified: false,
    maximumAttempts: assignment.permissions.maximumAttempts, maximumRepairs: Math.min(2, Math.max(0, assignment.permissions.maximumAttempts - 1)),
    timeEstimate: { minimumSeconds: finalExecutable ? estimate.time.minimumSeconds : 0, expectedSeconds: finalExecutable ? finalExpectedSeconds : 0, maximumSeconds: finalExecutable ? Math.min(assignment.permissions.maximumTimeSeconds, estimate.time.maximumSeconds) : 0 },
    creditEstimate: { minimumCredits: finalExecutable ? estimate.credits.minimumCredits : 0, expectedCredits: finalExecutable ? finalExpectedCredits : 0, maximumCredits: finalExecutable ? Math.min(assignment.permissions.maximumCredits, estimate.credits.maximumCredits) : 0, internalToolCostOnly: true },
    routeDisposition,
    planningQaReportHash: hashSkillValue(planningQaReport), planningQaPassed: planningQaReport.passed,
  })
  return { plan, planningQaReport }
}
