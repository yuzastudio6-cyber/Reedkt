import type { z } from 'zod'

import {
  brollVisualOwnershipWindowSchema,
  createBrollMasterTimingPlan,
  createBrollSourceInventory,
  createBrollVisualOwnershipManifest,
} from '../edit-skills/b-roll'
import type { EditSkillArtifactReference } from '../edit-skills/core/edit-skill-artifact-store'
import type { EditSkillRuntime } from '../edit-skills/core/edit-skill-runtime'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createSkillAssignment } from '../edit-skills/core/skill-range-authority'
import type { SkillFrameRange } from '../edit-skills/core/skill-assignment-types'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createSourceFrameAuthority,
  createTrackAllAssignment,
  createTrackAllSceneContext,
  createTrackAllTargetSpecification,
  createTrackAllWriteAuthorityHash,
  type TrackAllAssignment,
  type TrackAllTargetSpecification,
} from '../edit-skills/track-all'

export const TRACK_ALL_FIXTURE_SCOPE = Object.freeze({
  ownerUserId: 'track-all-user',
  workspaceId: 'track-all-workspace',
  projectId: 'track-all-project',
})

export interface TrackAllAuthorityFixture {
  assignment: ReturnType<typeof createSkillAssignment>
  specializedAssignment: TrackAllAssignment
  target: TrackAllTargetSpecification
  refs: {
    specializedAssignment: EditSkillArtifactReference
    target: EditSkillArtifactReference
    sourceInventory: EditSkillArtifactReference
    masterTiming: EditSkillArtifactReference
    sourceFrames: EditSkillArtifactReference
    visualOwnership: EditSkillArtifactReference
    sceneContext: EditSkillArtifactReference
  }
}

export function reviseTrackAllPublicAssignment(
  assignment: TrackAllAuthorityFixture['assignment'],
  contextArtifactRefs: readonly EditSkillArtifactReference[],
) {
  const { assignmentHash: _assignmentHash, ...core } = assignment
  void _assignmentHash
  return createSkillAssignment({
    ...core,
    contextArtifactRefs: [...contextArtifactRefs],
    dependencyArtifactRefs: [...assignment.dependencyArtifactRefs],
  })
}

export async function createTrackAllAuthorityFixture(input: {
  runtime: EditSkillRuntime
  assignmentId: string
  authorizedRange?: SkillFrameRange
  analysisContextRange?: SkillFrameRange
  masterAssignmentRange?: SkillFrameRange
  sourceFrameChecksum?: string
  targetAssignmentId?: string
  targetEditSessionId?: string
  requestedJobType?: string
  intendedTreatment?: 'geometry_only' | 'privacy_redaction' | 'tracked_focus' | 'tracked_reframe' | 'planar_geometry' | 'repair' | 'no_action'
  targetType?: 'selected_instance' | 'concept_group' | 'selected_group' | 'planar_region' | 'freeform_region' | 'camera_relative_region' | 'world_relative_region' | 'existing_track' | 'track_child_region' | 'track_parent_region'
  groundingFrame?: number
  ownershipWindows?: readonly z.input<typeof brollVisualOwnershipWindowSchema>[]
  expectedMinimumCount?: number
  expectedMaximumCount?: number
  expectedCount?: number
  maximumObjects?: number
  maximumChunks?: number
  maximumTimeSeconds?: number
  maximumCredits?: number
  manualReviewPermitted?: boolean
  sam3_1Allowed?: boolean
  deterministicToolsAllowed?: boolean
  editorialExclusions?: readonly string[]
  targetExcludeRules?: readonly string[]
  privacyClassification?: 'none' | 'personal' | 'sensitive' | 'child' | 'high_assurance'
  targetCriticality?: 'normal' | 'important' | 'privacy_critical'
  privacyCriticality?: 'none' | 'normal' | 'high'
}): Promise<TrackAllAuthorityFixture> {
  const scope = TRACK_ALL_FIXTURE_SCOPE
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const editSessionId = 'track-all-session'
  const authorizedRange = input.authorizedRange ?? {
    startFrameInclusive: 24, endFrameExclusive: 144, fps: 24,
  }
  const analysisContextRange = input.analysisContextRange ?? {
    startFrameInclusive: 0, endFrameExclusive: 240, fps: 24,
  }
  const sourceChecksum = hashSkillValue({ fixture: input.assignmentId, source: true })
  const sourceRef: EditSkillArtifactReference = {
    artifactType: 'source_media_artifact_v1', sha256: sourceChecksum,
    byteLength: 4096, ...scope,
  }
  const sourceInventory = createBrollSourceInventory({
    schemaVersion: 'source_inventory_v1', ...scope, editSessionId,
    assignmentId: input.assignmentId, editPlanVersion: 1, manifestRef,
    candidates: [{
      sourceId: 'track-all-source', sourceType: 'existing_project_clip',
      artifactRef: sourceRef, sourceRange: analysisContextRange,
      semanticRelevance: 1, visualQuality: 1, temporalFit: 1, storyContinuity: 1,
      provenanceVerified: true, rightsApproved: true, privacyApproved: true,
      proofSafe: true, repetitionRisk: 0, cropFeasibility: 1,
      speakerActionProtection: 1, audioUsefulness: 0, costCredits: 0,
      approvedByUser: true,
    }],
  })
  const sourceInventoryRef = await input.runtime.artifactStore.putJson({
    artifactType: 'source_inventory_v1', value: sourceInventory, ...scope,
  })
  const masterTiming = createBrollMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1', ...scope, editSessionId,
    assignmentId: input.assignmentId, editPlanVersion: 1, manifestRef,
    fps: authorizedRange.fps, timelineRange: analysisContextRange,
    assignmentRange: input.masterAssignmentRange ?? authorizedRange,
  })
  const masterTimingRef = await input.runtime.artifactStore.putJson({
    artifactType: 'master_timing_plan_v1', value: masterTiming, ...scope,
  })
  const visualOwnership = createBrollVisualOwnershipManifest({
    schemaVersion: 'visual_ownership_manifest_v1', ...scope, editSessionId,
    assignmentId: input.assignmentId, editPlanVersion: 1, manifestRef,
    assignmentRange: authorizedRange, requestedOwnership: 'support',
    ownershipWindows: [...(input.ownershipWindows ?? [])],
  })
  const visualOwnershipRef = await input.runtime.artifactStore.putJson({
    artifactType: 'visual_ownership_manifest_v1', value: visualOwnership, ...scope,
  })
  const sourceFrames = createSourceFrameAuthority({
    schemaVersion: 'source_frame_authority_v1', ...scope,
    sourceId: 'track-all-source',
    sourceChecksum: input.sourceFrameChecksum ?? sourceChecksum,
    range: analysisContextRange, width: 1920, height: 1080, pixelAspectRatio: 1,
  })
  const sourceFramesRef = await input.runtime.artifactStore.putJson({
    artifactType: 'source_frame_authority_v1', value: sourceFrames, ...scope,
  })
  const sceneContext = createTrackAllSceneContext({
    schemaVersion: 'track_all_scene_context_v1', assignmentId: input.assignmentId,
    analysisContextRange, authorizedWriteRange: authorizedRange,
    wholeVideoEvidenceReadOnly: true, sceneIds: ['scene-001'],
    shotBoundaries: [Math.floor((authorizedRange.startFrameInclusive + authorizedRange.endFrameExclusive) / 2)],
  })
  const sceneContextRef = await input.runtime.artifactStore.putJson({
    artifactType: 'track_all_scene_context_v1', value: sceneContext, ...scope,
  })
  const target = createTrackAllTargetSpecification({
    schemaVersion: 'track_all_target_specification_v1', ...scope,
    editSessionId: input.targetEditSessionId ?? editSessionId,
    assignmentId: input.targetAssignmentId ?? input.assignmentId,
    targetId: 'target-001', targetType: input.targetType ?? 'selected_instance',
    semanticClass: 'object', description: 'Approved anonymous selected object.',
    anonymousIdentityPolicy: 'anonymous_stable_ids_only', childTargetIds: [],
    includeRules: ['selected target only'], excludeRules: [...(input.targetExcludeRules ?? [])],
    expectedMinimumCount: input.expectedMinimumCount ?? 1,
    expectedMaximumCount: input.expectedMaximumCount ?? 1,
    privacyClassification: input.privacyClassification ?? 'none',
    targetCriticality: input.targetCriticality ?? 'normal',
    initializationFramePreference: input.groundingFrame ?? authorizedRange.startFrameInclusive,
    occlusionPolicy: input.targetCriticality === 'privacy_critical'
      ? 'conservative_cover'
      : 'hold_and_reacquire',
    reentryPolicy: 'confidence_qualified_reacquisition', crossShotPolicy: 'terminate',
    lostTrackBehavior: input.targetCriticality === 'privacy_critical'
      ? 'conservative_cover'
      : 'manual_review',
    ambiguityBehavior: 'request_user_selection',
    treatmentIntent: input.intendedTreatment === 'no_action' || !input.intendedTreatment
      ? 'geometry_only'
      : input.intendedTreatment,
    groundingEvidence: [{
      kind: 'bounding_box', frameIndex: input.groundingFrame ?? authorizedRange.startFrameInclusive,
      box: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 },
    }],
  })
  const targetRef = await input.runtime.artifactStore.putJson({
    artifactType: 'track_all_target_specification_v1', value: target, ...scope,
  })
  const specializedAssignment = createTrackAllAssignment({
    schemaVersion: 'track_all_assignment_v1', assignmentId: input.assignmentId,
    preOrchestraAssignmentAuthorityId: `pre-orchestra-${input.assignmentId}`,
    ...scope, editSessionId, editPlanId: 'track-all-edit-plan', editPlanVersion: 1,
    manifestRef, coordinateSpace: 'normalized_source_frame', authorizedWriteRange: authorizedRange,
    analysisContextRange, sourceRangeMappingHash: hashSkillValue({ sourceChecksum, authorizedRange }),
    sceneIds: ['scene-001'], shotIds: ['shot-001'],
    writeAuthorityHash: createTrackAllWriteAuthorityHash({
      assignmentId: input.assignmentId, ...scope, editSessionId,
      coordinateSpace: 'normalized_source_frame', authorizedWriteRange: authorizedRange,
    }),
    readContext: {
      wholeVideoContextPermission: true, transcriptEvidenceRefs: [], visualEvidenceRefs: [],
      priorTrackGraphRefs: [], sourceInventoryRef, masterTimingRef,
      visualOwnershipRef,
    },
    editorialRequest: {
      requestedJobType: input.requestedJobType ?? 'track_all.no_action',
      reason: 'Use only exact approved temporal geometry.',
      targetDescription: 'Approved anonymous selected object.',
      intendedTreatment: input.intendedTreatment ?? 'no_action',
      viewerBenefit: 'Preserve clear and private visual storytelling.',
      privacyCriticality: input.privacyCriticality ?? 'none',
      forbiddenTargets: [], expectedCount: input.expectedCount ?? 1,
      exclusions: [...(input.editorialExclusions ?? [])],
      uncertaintyBehavior: input.targetCriticality === 'privacy_critical'
        ? 'conservative_cover'
        : 'request_selection',
    },
    permissions: {
      analysisOnlyAllowed: true, directTreatmentAllowed: true,
      sam3_1Allowed: input.sam3_1Allowed ?? true,
      deterministicToolsAllowed: input.deterministicToolsAllowed ?? true,
      ocrAllowed: false, landmarkSupportAllowed: false,
      maximumObjects: input.maximumObjects ?? 16,
      maximumChunks: input.maximumChunks ?? 10,
      maximumAttempts: 2, maximumCredits: input.maximumCredits ?? 100,
      maximumTimeSeconds: input.maximumTimeSeconds ?? 600,
      manualReviewPermitted: input.manualReviewPermitted ?? true,
    },
    requiredOutputs: ['result_receipt'],
  })
  const specializedAssignmentRef = await input.runtime.artifactStore.putJson({
    artifactType: 'track_all_assignment_v1', value: specializedAssignment, ...scope,
  })
  const assignment = createSkillAssignment({
    schemaVersion: 'edit-skill-assignment-v1', assignmentId: input.assignmentId,
    ...scope, editSessionId, planningRequestId: `request-${input.assignmentId}`,
    manifestRef, authorizedRange,
    reason: 'Create bounded temporal visual geometry.',
    intendedViewerBenefit: 'Preserve exact visual continuity and privacy.',
    editorialContext: 'Track All public authority fixture.', visualOwnership: 'support',
    contextArtifactRefs: [
      specializedAssignmentRef, targetRef, sourceInventoryRef, masterTimingRef,
      sourceFramesRef, visualOwnershipRef, sceneContextRef,
    ],
    dependencyArtifactRefs: [], requestedBySkill: 'orchestra',
  })
  return {
    assignment, specializedAssignment, target,
    refs: {
      specializedAssignment: specializedAssignmentRef, target: targetRef,
      sourceInventory: sourceInventoryRef, masterTiming: masterTimingRef,
      sourceFrames: sourceFramesRef, visualOwnership: visualOwnershipRef,
      sceneContext: sceneContextRef,
    },
  }
}
