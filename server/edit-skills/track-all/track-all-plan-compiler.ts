import type { z } from 'zod'

import type { SkillAssignment } from '../core/skill-assignment-types'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import type { SkillRouteQualificationReceipt } from '../core/skill-route-qualification'
import type {
  MasterTimingPlan,
  SourceInventory,
  VisualOwnershipManifest,
} from '../shared/assignment-authorities'
import type { TrackGraphV2 } from '../shared/track-graph/track-graph-schemas'
import {
  createTrackAllPlan,
  createTrackAllPlanningQaReport,
  privacyPolicySnapshotSchema,
  priorTrackRepairEvidenceSchema,
  sourceFrameAuthoritySchema,
  trackAllCaptionReservedZonesSchema,
  trackAllSceneContextSchema,
  visualIntelligenceTargetEvidenceSchema,
  type TrackAllAssignment,
  type TrackAllPlan,
  type TrackAllPlanningQaReport,
  type TrackAllTargetSpecification,
} from './track-all-schemas'
import type {
  TrackAllPreflightObservation,
  TrackAllSam31RuntimeProfileV2,
} from './track-all-planning-authorities'
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
  sourceInventory: SourceInventory
  masterTiming: MasterTimingPlan
  sourceFrames: SourceFrames
  visualOwnership: VisualOwnershipManifest
  sceneContext: SceneContext
  visualIntelligenceEvidence?: ViTargetEvidence
  privacyPolicy?: PrivacyPolicy
  existingTrackGraph?: TrackGraphV2
  priorTrackRepairEvidence?: PriorTrackRepairEvidence
  captionReservedZones?: CaptionReservedZones
  preflightObservation?: TrackAllPreflightObservation
  samRuntimeProfile: TrackAllSam31RuntimeProfileV2
  routeQualifications: readonly SkillRouteQualificationReceipt[]
}

export interface CompiledTrackAllPlan {
  plan: TrackAllPlan
  planningQaReport: TrackAllPlanningQaReport
}

const privacyTreatments = new Set(['privacy_redaction'])
const existingGraphTreatments = new Set([
  'privacy_redaction', 'tracked_focus', 'tracked_reframe',
])
const samTargetTypes = new Set([
  'selected_instance', 'concept_group', 'selected_group', 'freeform_region',
  'track_child_region', 'track_parent_region',
])

function rangeHasFrame(range: TrackAllAssignment['authorizedWriteRange'], frame: number): boolean {
  return frame >= range.startFrameInclusive && frame < range.endFrameExclusive
}

function targetGroundingFrames(target: TrackAllTargetSpecification): number[] {
  return target.groundingEvidence.flatMap((evidence) =>
    'frameIndex' in evidence ? [evidence.frameIndex] : [])
}

function initialDecision(authority: TrackAllPlanningAuthority): TrackAllPlan['decision'] {
  const {
    assignment, target, visualIntelligenceEvidence, privacyPolicy,
    existingTrackGraph, priorTrackRepairEvidence, captionReservedZones,
  } = authority
  if (assignment.editorialRequest.intendedTreatment === 'no_action' ||
    assignment.editorialRequest.requestedJobType === 'track_all.no_action') {
    return 'use_no_tracking'
  }
  const groundFrames = targetGroundingFrames(target)
  if (groundFrames.some((frame) => !rangeHasFrame(assignment.authorizedWriteRange, frame))) {
    return groundFrames.every((frame) =>
      rangeHasFrame(assignment.analysisContextRange, frame))
      ? 'needs_range_expansion'
      : 'blocked'
  }
  const semanticGrounding = target.groundingEvidence.some((evidence) =>
    evidence.kind === 'text_concept' ||
    evidence.kind === 'visual_intelligence_grounding')
  if ((target.targetType === 'concept_group' || semanticGrounding) &&
    !visualIntelligenceEvidence) return 'needs_visual_intelligence'
  if (visualIntelligenceEvidence?.ambiguity === 'multiple_candidates') {
    return 'needs_user_selection'
  }
  if (visualIntelligenceEvidence?.ambiguity === 'uncertain') {
    return target.ambiguityBehavior === 'request_user_selection'
      ? 'needs_user_selection'
      : 'multiple_targets_ambiguous'
  }
  if (privacyTreatments.has(assignment.editorialRequest.intendedTreatment) &&
    !privacyPolicy) return 'needs_user_confirmation'
  const visibleTreatmentRequested = existingGraphTreatments.has(
    assignment.editorialRequest.intendedTreatment,
  )
  const ownershipConflict = authority.visualOwnership.ownershipWindows.some((window) =>
    window.exclusive && window.ownerSkillKey !== 'track_all' &&
    window.frameRange.startFrameInclusive < assignment.authorizedWriteRange.endFrameExclusive &&
    assignment.authorizedWriteRange.startFrameInclusive < window.frameRange.endFrameExclusive)
  if (visibleTreatmentRequested && ownershipConflict) return 'blocked'
  if (existingGraphTreatments.has(assignment.editorialRequest.intendedTreatment) &&
    !existingTrackGraph) return 'needs_track_graph'
  if ((target.targetType === 'existing_track' ||
    assignment.editorialRequest.intendedTreatment === 'repair') &&
    !existingTrackGraph) return 'needs_track_graph'
  if (assignment.editorialRequest.intendedTreatment === 'repair' &&
    !priorTrackRepairEvidence) return 'blocked'
  if (assignment.editorialRequest.intendedTreatment === 'tracked_reframe' &&
    !captionReservedZones) return 'blocked'
  if (target.expectedMaximumCount > assignment.permissions.maximumObjects) {
    return 'needs_user_confirmation'
  }
  if (!assignment.permissions.deterministicToolsAllowed) return 'blocked'
  if (samTargetTypes.has(target.targetType) &&
    assignment.editorialRequest.intendedTreatment === 'geometry_only' &&
    !existingTrackGraph && !assignment.permissions.sam3_1Allowed) return 'blocked'
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
  return [
    'produce_track_graph', 'apply_privacy_redaction', 'apply_tracked_focus',
    'prepare_tracked_reframe', 'track_planar_region', 'repair_existing_track',
  ].includes(decision)
}

function routeForDecision(input: {
  decision: TrackAllPlan['decision']
  target: TrackAllTargetSpecification
  existingTrackGraphPresent: boolean
}): string {
  if (input.decision === 'track_planar_region') return 'planar_tracking_route'
  if (input.decision === 'repair_existing_track') return 'existing_track_repair_route'
  if (input.decision === 'apply_privacy_redaction') return 'privacy_redaction_route'
  if (input.decision === 'apply_tracked_focus') return 'focus_route'
  if (input.decision === 'prepare_tracked_reframe') return 'reframe_route'
  if (input.decision === 'produce_track_graph' &&
    samTargetTypes.has(input.target.targetType) &&
    !input.existingTrackGraphPresent) return 'sam3_1_masklet_route'
  if (input.decision === 'produce_track_graph') return 'deterministic_geometry_route'
  if (input.decision === 'use_no_tracking') return 'planning_core_route'
  return 'planning_core_route'
}

function derivePreflightRisks(
  observation: TrackAllPreflightObservation,
  expectedObjects: number,
) {
  const values = observation.candidateFrames
  const maximum = (select: (candidate: (typeof values)[number]) => number) =>
    Math.max(...values.map(select))
  const average = (select: (candidate: (typeof values)[number]) => number) =>
    values.reduce((total, candidate) => total + select(candidate), 0) / values.length
  const targetSpeed = maximum((candidate) => candidate.targetMotion)
  const targetSizeRisk = 1 - average((candidate) => candidate.normalizedTargetSize)
  const occlusionRisk = maximum((candidate) => candidate.occlusionLikelihood)
  const cameraMotionRisk = maximum((candidate) => candidate.cameraMotionRisk)
  const expectedRepairRisk = Math.min(1, (
    targetSpeed + occlusionRisk + cameraMotionRisk +
    maximum((candidate) => candidate.motionBlur) +
    maximum((candidate) => candidate.similarObjectAmbiguity)
  ) / 5)
  return Object.freeze({
    targetSpeed,
    targetSizeRisk,
    occlusionRisk,
    cameraMotionRisk,
    expectedRepairRisk,
    expectedRepairAttempts: expectedRepairRisk >= 0.35 ? 1 as const : 0 as const,
    expectedRepairCredits: Math.ceil(expectedRepairRisk * Math.max(1, expectedObjects) * 2),
  })
}

function dependencyForDecision(decision: TrackAllPlan['decision']) {
  if (decision === 'needs_visual_intelligence') return {
    dependencySkillKey: 'visual_intelligence',
    requiredDependencyArtifactType: 'visual_intelligence_target_evidence_v1',
    requiredForPhase: 'skill_planning',
  }
  if (decision === 'needs_preflight_observation') return {
    dependencySkillKey: 'track_all',
    requiredDependencyArtifactType: 'track_all_preflight_observation_v1',
    requiredForPhase: 'skill_planning_preflight',
  }
  if (decision === 'needs_track_graph') return {
    dependencySkillKey: 'track_all',
    requiredDependencyArtifactType: 'track_graph_v2',
    requiredForPhase: 'skill_planning',
  }
  return undefined
}

export function compileTrackAllPlan(input: {
  authority: TrackAllPlanningAuthority
  manifest: Readonly<SkillCapabilityManifest>
  createdAt?: string
}): CompiledTrackAllPlan {
  const { authority, manifest } = input
  const {
    genericAssignment, assignment, target, sourceInventory, masterTiming,
    sourceFrames, visualOwnership, sceneContext, samRuntimeProfile,
  } = authority
  let decision = initialDecision(authority)
  const desiredRouteKey = routeForDecision({
    decision,
    target,
    existingTrackGraphPresent: authority.existingTrackGraph !== undefined,
  })
  const routeReceipt = authority.routeQualifications.find((receipt) =>
    receipt.routeKey === desiredRouteKey)
  if (!routeReceipt) {
    throw new Error(`Track All planning lacks the exact route receipt: ${desiredRouteKey}.`)
  }
  const expectedObjectsCandidate = isExecutableDecision(decision)
    ? Math.max(
      target.expectedMinimumCount,
      assignment.editorialRequest.expectedCount,
      samTargetTypes.has(target.targetType) ? 1 : 0,
    )
    : 0
  const routeNeedsPreflight = isExecutableDecision(decision) && [
    'sam3_1_masklet_route', 'planar_tracking_route',
    'deterministic_geometry_route',
  ].includes(desiredRouteKey)
  if (routeNeedsPreflight && !authority.preflightObservation) {
    decision = 'needs_preflight_observation'
  }
  let routeDisposition: TrackAllPlan['routeDisposition'] =
    decision === 'use_no_tracking' ? 'no_action' :
      ['needs_visual_intelligence', 'needs_preflight_observation', 'needs_track_graph'].includes(decision) ? 'dependency' :
        ['needs_user_selection', 'multiple_targets_ambiguous', 'identity_uncertain'].includes(decision) ? 'ambiguity' :
          isExecutableDecision(decision) ? 'selected' : 'authority'

  const routeGateKeys = routeReceipt.gateEvidenceRefs
    .filter((gate) => gate.disposition === 'blocked')
    .map((gate) => gate.gateKey)
  if (isExecutableDecision(decision)) {
    const routeExecutionQualified = [
      'internal_execution_qualified', 'production_qualified',
    ].includes(routeReceipt.qualificationStatus)
    const samExecutionQualified = desiredRouteKey !== 'sam3_1_masklet_route' ||
      samRuntimeProfile.qualification.internalExecutionAuthorized
    const fpsQualified = desiredRouteKey !== 'sam3_1_masklet_route' ||
      samRuntimeProfile.supportedFps.includes(
        assignment.authorizedWriteRange.fps as 24 | 25 | 30 | 50 | 60,
      )
    if (!routeExecutionQualified || !samExecutionQualified || !fpsQualified) {
      decision = desiredRouteKey === 'sam3_1_masklet_route'
        ? 'blocked_external_sam_prerequisites'
        : 'needs_route_qualification'
      routeDisposition = 'route_blocked'
    }
  }

  const preflightRisks = authority.preflightObservation
    ? derivePreflightRisks(authority.preflightObservation, expectedObjectsCandidate)
    : undefined
  const executableBeforeCeiling = isExecutableDecision(decision)
  const samWorkCandidate = executableBeforeCeiling &&
    desiredRouteKey === 'sam3_1_masklet_route'
  const requiresChunkPlan = executableBeforeCeiling && [
    'sam3_1_masklet_route', 'planar_tracking_route',
    'deterministic_geometry_route',
  ].includes(desiredRouteKey)
  const chunkResult = requiresChunkPlan && preflightRisks
    ? planTrackAllShotAwareChunks({
      authorizedRange: assignment.authorizedWriteRange,
      shotBoundaries: sceneContext.shotBoundaries,
      qualifiedMaximumFrames: samRuntimeProfile.maximumFramesPerSession,
      maximumChunks: assignment.permissions.maximumChunks,
      privacyRisk: target.targetCriticality === 'privacy_critical' ? 1 : 0.2,
      targetSpeed: preflightRisks.targetSpeed,
      targetSizeRisk: preflightRisks.targetSizeRisk,
      occlusionRisk: preflightRisks.occlusionRisk,
      cameraMotionRisk: preflightRisks.cameraMotionRisk,
      objectCount: expectedObjectsCandidate,
    })
    : undefined
  const chunks = chunkResult
    ? { maximumFramesPerChunk: chunkResult.maximumFramesPerChunk, chunks: chunkResult.chunks }
    : { maximumFramesPerChunk: samRuntimeProfile.maximumFramesPerSession, chunks: [] }
  let budget = planTrackAllMultiplexBudget({
    expectedObjects: executableBeforeCeiling ? expectedObjectsCandidate : 0,
    approvedMaximumObjects: assignment.permissions.maximumObjects,
    chunkCount: chunks.chunks.length,
    bucketSize: samRuntimeProfile.maximumObjectsPerBucket,
    maximumBuckets: samRuntimeProfile.maximumBucketsPerPlan,
    samRequired: samWorkCandidate,
  })
  const frameCount = assignment.authorizedWriteRange.endFrameExclusive -
    assignment.authorizedWriteRange.startFrameInclusive
  const estimate = estimateTrackAllPlan({
    frameCount,
    fps: assignment.authorizedWriteRange.fps,
    chunkCount: chunks.chunks.length,
    overlapFrames: chunks.chunks.reduce((total, chunk) => total +
      chunk.overlapFramesBefore + chunk.overlapFramesAfter, 0),
    targetGroupCount: expectedObjectsCandidate > 0 ? 1 : 0,
    objectCount: executableBeforeCeiling ? expectedObjectsCandidate : 0,
    bucketCount: budget.bucketCount,
    sessionCount: budget.sessionCount,
    bidirectionalPropagation: samWorkCandidate,
    planarGeometry: decision === 'track_planar_region',
    ocr: assignment.permissions.ocrAllowed && target.privacyClassification !== 'none',
    landmarks: assignment.permissions.landmarkSupportAllowed,
    maskRefinement: samWorkCandidate,
    privacyTreatment: decision === 'apply_privacy_redaction',
    previewRender: ['apply_privacy_redaction', 'apply_tracked_focus',
      'prepare_tracked_reframe'].includes(decision),
    qaDepth: 'planning',
    repairAttempts: decision === 'repair_existing_track'
      ? 1
      : preflightRisks?.expectedRepairAttempts ?? 0,
    noAction: !executableBeforeCeiling,
  })
  if (executableBeforeCeiling &&
    estimate.time.expectedSeconds > assignment.permissions.maximumTimeSeconds) {
    routeDisposition = 'time_ceiling'
    decision = assignment.permissions.manualReviewPermitted
      ? 'needs_user_confirmation'
      : 'blocked'
  } else if (executableBeforeCeiling &&
    estimate.credits.expectedCredits > assignment.permissions.maximumCredits) {
    routeDisposition = 'credit_ceiling'
    decision = assignment.permissions.manualReviewPermitted
      ? 'needs_user_confirmation'
      : 'blocked'
  }
  const executable = isExecutableDecision(decision)
  const samWorkPlanned = executable && samWorkCandidate
  const visibleTreatmentPlanned = executable && [
    'apply_privacy_redaction', 'apply_tracked_focus', 'prepare_tracked_reframe',
  ].includes(decision)
  const initialization = samWorkPlanned && authority.preflightObservation
    ? selectTrackAllInitializationFrame({
      authorizedRange: assignment.authorizedWriteRange,
      ...(target.initializationFramePreference === undefined
        ? {}
        : { preferredFrame: target.initializationFramePreference }),
      candidates: authority.preflightObservation.candidateFrames.map((candidate) => ({
        frameIndex: candidate.frameIndex,
        visibility: candidate.visibility,
        targetSize: candidate.normalizedTargetSize,
        sharpness: candidate.sharpness,
        motionBlur: candidate.motionBlur,
        occlusion: candidate.occlusionLikelihood,
        similarObjectAmbiguity: candidate.similarObjectAmbiguity,
        edgeTruncation: candidate.edgeTruncation,
        cameraStability: candidate.cameraStability,
        textReadability: Math.max(
          candidate.ocrReadability,
          candidate.plateScreenDocumentVisibility,
        ),
      })),
    })
    : undefined
  const initializationFrame = initialization?.frameIndex
  const promptStrategy = samWorkPlanned
    ? compileTrackAllPromptStrategy({ assignment, target })
    : undefined
  const finalBudget = executable ? budget : {
    ...budget,
    expectedObjects: 0,
    bucketCount: 0,
    sessionCount: 0,
  }
  budget = finalBudget
  const sessionLifecycle = planTrackAllSessionLifecycle({
    samRequired: samWorkPlanned,
    maximumAttempts: assignment.permissions.maximumAttempts,
    chunkCount: executable ? chunks.chunks.length : 0,
    sessionCount: executable ? budget.sessionCount : 0,
  })
  const routeEvaluationKeys = [
    'no_action',
    ...(authority.existingTrackGraph ? ['existing_track_graph'] : []),
    ...(assignment.permissions.deterministicToolsAllowed
      ? ['deterministic_geometry']
      : []),
    ...(assignment.permissions.sam3_1Allowed && samTargetTypes.has(target.targetType)
      ? ['sam3_1_masklets']
      : []),
  ]
  const findings = deriveTrackAllPlanningQaFindings({
    genericAssignment,
    assignment,
    target,
    sourceInventory,
    masterTiming,
    sourceFrames,
    visualOwnership,
    sceneContext,
    ...(authority.visualIntelligenceEvidence
      ? { visualIntelligenceEvidence: authority.visualIntelligenceEvidence }
      : {}),
    existingTrackGraphPresent: authority.existingTrackGraph !== undefined,
    priorTrackRepairEvidencePresent: authority.priorTrackRepairEvidence !== undefined,
    captionReservedZonesPresent: authority.captionReservedZones !== undefined,
    preflightObservationPresent: authority.preflightObservation !== undefined,
    routeQualificationStatus: routeReceipt.qualificationStatus,
    manifest,
    decision,
    executable,
    samWorkPlanned,
    visibleTreatmentPlanned,
    ...(initializationFrame === undefined ? {} : { initializationFrame }),
    chunkPlan: executable ? chunks : {
      maximumFramesPerChunk: samRuntimeProfile.maximumFramesPerSession,
      chunks: [],
    },
    expectedObjects: executable ? expectedObjectsCandidate : 0,
    bucketSize: samRuntimeProfile.maximumObjectsPerBucket,
    bucketCount: executable ? budget.bucketCount : 0,
    sessionCount: executable ? budget.sessionCount : 0,
    computedTimeExpected: estimate.time.expectedSeconds,
    computedCreditExpected: estimate.credits.expectedCredits,
    routeEvaluationKeys,
    ...(promptStrategy
      ? { promptStrategyEvidenceHash: promptStrategy.evidenceHash }
      : {}),
    sessionLifecycleEvidenceHash: sessionLifecycle.evidenceHash,
  })
  const planningQaReport = createTrackAllPlanningQaReport({
    schemaVersion: 'track_all_planning_qa_report_v1',
    assignmentHash: assignment.assignmentHash,
    targetHash: target.targetHash,
    manifestRef: assignment.manifestRef,
    findings,
    passed: !findings.some((finding) =>
      finding.disposition === 'blocking' || finding.disposition === 'critical'),
    createdAt: input.createdAt ?? new Date().toISOString(),
  })
  if (!planningQaReport.passed && executable) {
    decision = 'blocked'
    routeDisposition = 'authority'
  }
  const finalExecutable = isExecutableDecision(decision)
  const dependency = dependencyForDecision(decision)
  const routeBlocked = decision === 'needs_route_qualification' ||
    decision === 'blocked_external_sam_prerequisites'
  const missingRouteGateKeys = routeBlocked
    ? [...new Set([
      ...routeGateKeys,
      ...(desiredRouteKey === 'sam3_1_masklet_route'
        ? samRuntimeProfile.qualification.missingGateKeys
        : []),
      ...(samRuntimeProfile.supportedFps.includes(
        assignment.authorizedWriteRange.fps as 24 | 25 | 30 | 50 | 60,
      ) ? [] : ['unsupported_fps']),
    ])]
    : []
  const plan = createTrackAllPlan({
    schemaVersion: 'track_all_plan_v1',
    planId: `track-all-plan-${hashSkillValue({
      assignment: assignment.assignmentHash,
      target: target.targetHash,
      decision,
      routeReceipt: routeReceipt.receiptHash,
      profile: samRuntimeProfile.profileHash,
    }).slice(0, 24)}`,
    assignmentId: assignment.assignmentId,
    assignmentHash: assignment.assignmentHash,
    manifestRef: assignment.manifestRef,
    targetHash: target.targetHash,
    authorizedRange: assignment.authorizedWriteRange,
    decision,
    requestedJobType: assignment.editorialRequest.requestedJobType,
    ...dependency,
    selectedRouteKey: desiredRouteKey,
    routeQualificationReceiptHash: routeReceipt.receiptHash,
    ...(routeBlocked ? {
      blockedRouteKey: desiredRouteKey,
      blockedRouteReceiptHash: routeReceipt.receiptHash,
    } : {}),
    missingRouteGateKeys,
    ...(authority.preflightObservation
      ? { preflightObservationHash: authority.preflightObservation.observationHash }
      : {}),
    samRuntimeProfileHash: samRuntimeProfile.profileHash,
    ...(preflightRisks ? { preflightDerivedRisks: preflightRisks } : {}),
    shotPlan: {
      shotBoundaries: sceneContext.shotBoundaries,
      shotResetRequired: true,
    },
    chunkPlan: finalExecutable && requiresChunkPlan ? chunks : {
      maximumFramesPerChunk: samRuntimeProfile.maximumFramesPerSession,
      chunks: [],
    },
    objectBudget: {
      expectedObjects: finalExecutable ? expectedObjectsCandidate : 0,
      maximumObjects: assignment.permissions.maximumObjects,
      bucketSize: samRuntimeProfile.maximumObjectsPerBucket,
      bucketCount: finalExecutable ? budget.bucketCount : 0,
      sessionCount: finalExecutable && samWorkCandidate ? budget.sessionCount : 0,
    },
    ...(finalExecutable && samWorkCandidate ? { initializationFrame } : {}),
    propagationDirection: finalExecutable && samWorkCandidate
      ? sessionLifecycle.propagationDirection
      : 'none',
    samWorkPlanned: finalExecutable && samWorkCandidate,
    visibleTreatmentPlanned: finalExecutable && visibleTreatmentPlanned,
    privateOutputRequired: true,
    outsideAuthorizedRangeModified: false,
    maximumAttempts: assignment.permissions.maximumAttempts,
    maximumRepairs: Math.min(
      2,
      Math.max(0, assignment.permissions.maximumAttempts - 1),
    ),
    timeEstimate: {
      minimumSeconds: finalExecutable ? estimate.time.minimumSeconds : 0,
      expectedSeconds: finalExecutable ? estimate.time.expectedSeconds : 0,
      maximumSeconds: finalExecutable
        ? Math.min(assignment.permissions.maximumTimeSeconds,
          estimate.time.maximumSeconds)
        : 0,
    },
    creditEstimate: {
      minimumCredits: finalExecutable ? estimate.credits.minimumCredits : 0,
      expectedCredits: finalExecutable ? estimate.credits.expectedCredits : 0,
      maximumCredits: finalExecutable
        ? Math.min(assignment.permissions.maximumCredits,
          estimate.credits.maximumCredits)
        : 0,
      internalToolCostOnly: true,
    },
    routeDisposition,
    planningQaReportHash: hashSkillValue(planningQaReport),
    planningQaPassed: planningQaReport.passed,
  })
  return { plan, planningQaReport }
}
