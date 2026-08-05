import type { z } from 'zod'

import {
  createMasterTimingPlan,
  createSourceInventory,
  createVisualOwnershipManifest,
  visualOwnershipWindowSchema,
} from '../edit-skills/shared/assignment-authorities'
import type { EditSkillArtifactReference } from '../edit-skills/core/edit-skill-artifact-store'
import type { EditSkillRuntime } from '../edit-skills/core/edit-skill-runtime'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { createSkillAssignment } from '../edit-skills/core/skill-range-authority'
import type { SkillFrameRange } from '../edit-skills/core/skill-assignment-types'
import { createTrackGraphV2 } from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  createSourceFrameAuthority,
  createTrackAllAssignment,
  createTrackAllSceneContext,
  createTrackAllTargetSpecification,
  createTrackAllPreflightObservation,
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
    preflight?: EditSkillArtifactReference
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
  sourceChecksum?: string
  sourceFrameChecksum?: string
  sourceWidth?: number
  sourceHeight?: number
  targetAssignmentId?: string
  targetEditSessionId?: string
  requestedJobType?: string
  intendedTreatment?: 'geometry_only' | 'privacy_redaction' | 'tracked_focus' | 'tracked_reframe' | 'planar_geometry' | 'repair' | 'no_action'
  targetType?: 'selected_instance' | 'concept_group' | 'selected_group' | 'planar_region' | 'freeform_region' | 'camera_relative_region' | 'world_relative_region' | 'existing_track' | 'track_child_region' | 'track_parent_region'
  groundingFrame?: number
  ownershipWindows?: readonly z.input<typeof visualOwnershipWindowSchema>[]
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
  targetSemanticClass?: string
  targetDescription?: string
  groundingKind?: 'bounding_box' | 'text_concept' | 'existing_track_reference'
  groundingArtifactRef?: EditSkillArtifactReference
  priorTrackGraphRefs?: readonly EditSkillArtifactReference[]
  includePreflightObservation?: boolean
  preflightRisk?: number
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
  if (input.groundingKind === 'existing_track_reference' && !input.groundingArtifactRef) {
    throw new Error('Existing-track fixture grounding requires an exact artifact reference.')
  }
  const sourceChecksum = input.sourceChecksum ??
    hashSkillValue({ fixture: input.assignmentId, source: true })
  const sourceRef: EditSkillArtifactReference = {
    artifactType: 'source_media_artifact_v1', sha256: sourceChecksum,
    byteLength: 4096, ...scope,
  }
  const sourceInventory = createSourceInventory({
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
  const masterTiming = createMasterTimingPlan({
    schemaVersion: 'master_timing_plan_v1', ...scope, editSessionId,
    assignmentId: input.assignmentId, editPlanVersion: 1, manifestRef,
    fps: authorizedRange.fps, timelineRange: analysisContextRange,
    assignmentRange: input.masterAssignmentRange ?? authorizedRange,
  })
  const masterTimingRef = await input.runtime.artifactStore.putJson({
    artifactType: 'master_timing_plan_v1', value: masterTiming, ...scope,
  })
  const visualOwnership = createVisualOwnershipManifest({
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
    range: analysisContextRange,
    width: input.sourceWidth ?? 1920,
    height: input.sourceHeight ?? 1080,
    pixelAspectRatio: 1,
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
    semanticClass: input.targetSemanticClass ?? 'object',
    description: input.targetDescription ?? 'Approved anonymous selected object.',
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
    groundingEvidence: input.groundingKind === 'text_concept'
      ? [{
          kind: 'text_concept',
          compiledConcept: input.targetDescription ?? input.targetSemanticClass ?? 'object',
          sourceEvidenceHash: hashSkillValue({
            assignmentId: input.assignmentId,
            compiledConcept: input.targetDescription ?? input.targetSemanticClass ?? 'object',
          }),
        }]
      : input.groundingKind === 'existing_track_reference'
        ? [{
            kind: 'existing_track_reference',
            artifactRef: input.groundingArtifactRef!,
          }]
        : [{
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
      priorTrackGraphRefs: [...(input.priorTrackGraphRefs ?? [])], sourceInventoryRef, masterTimingRef,
      visualOwnershipRef,
    },
    editorialRequest: {
      requestedJobType: input.requestedJobType ?? 'track_all.no_action',
      reason: 'Use only exact approved temporal geometry.',
      targetDescription: input.targetDescription ?? 'Approved anonymous selected object.',
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
  const preflightRef = input.includePreflightObservation === false
    ? undefined
    : await input.runtime.artifactStore.putJson({
      artifactType: 'track_all_preflight_observation_v1',
      value: createTrackAllPreflightObservation({
        schemaVersion: 'track_all_preflight_observation_v1',
        ...scope,
        editSessionId,
        assignmentId: input.assignmentId,
        assignmentHash: specializedAssignment.assignmentHash,
        targetHash: target.targetHash,
        sourceChecksum: sourceFrames.sourceChecksum,
        authorizedRange,
        authorizedRangeHash: hashSkillValue(authorizedRange),
        candidateFrames: [
          input.groundingFrame ?? authorizedRange.startFrameInclusive,
          Math.floor((authorizedRange.startFrameInclusive + authorizedRange.endFrameExclusive - 1) / 2),
        ].filter((frameIndex, index, frames) =>
          frames.indexOf(frameIndex) === index &&
          frameIndex >= authorizedRange.startFrameInclusive &&
          frameIndex < authorizedRange.endFrameExclusive)
          .map((frameIndex, index) => ({
            frameIndex,
            visibility: index === 0 ? 0.88 : 0.96,
            normalizedTargetSize: index === 0 ? 0.52 : 0.61,
            sharpness: index === 0 ? 0.79 : 0.92,
            motionBlur: input.preflightRisk ?? (index === 0 ? 0.22 : 0.08),
            edgeTruncation: index === 0 ? 0.12 : 0.03,
            cameraStability: index === 0 ? 0.75 : 0.91,
            cameraMotionRisk: input.preflightRisk ?? (index === 0 ? 0.31 : 0.14),
            targetMotion: input.preflightRisk ?? (index === 0 ? 0.37 : 0.18),
            occlusionLikelihood: input.preflightRisk ?? (index === 0 ? 0.28 : 0.09),
            similarObjectAmbiguity: index === 0 ? 0.18 : 0.07,
            ocrReadability: target.semanticClass.includes('screen') ? 0.82 : 0,
            plateScreenDocumentVisibility: ['plate', 'screen', 'document']
              .some((value) => target.semanticClass.includes(value)) ? 0.84 : 0,
            evidenceHashes: [hashSkillValue({
              sourceChecksum: sourceFrames.sourceChecksum,
              targetHash: target.targetHash,
              frameIndex,
              measurementProfile: 'track_all_fixture_measured_preflight_v1',
            })],
          })),
        producerAuthority: {
          operationId: 'track_all.observe_preflight.v1',
          workerClass: 'track_all_geometry_worker',
          sourceEvidenceHash: hashSkillValue({
            sourceFrames,
            sceneContext,
            targetHash: target.targetHash,
          }),
          callerSuppliedMeasurementsAccepted: false,
        },
        qualificationStatus: 'internal_execution_qualified',
        observedAt: '2026-08-04T00:00:00.000Z',
      }),
      ...scope,
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
      ...(preflightRef ? [preflightRef] : []),
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
      ...(preflightRef ? { preflight: preflightRef } : {}),
    },
  }
}

export async function createTrackAllCaptionZonesFixture(input: {
  runtime: EditSkillRuntime
  assignment: TrackAllAuthorityFixture['assignment']
  specializedAssignmentHash: string
}) {
  const core = {
    schemaVersion: 'caption_reserved_zones_v1' as const,
    ...TRACK_ALL_FIXTURE_SCOPE,
    editSessionId: input.assignment.editSessionId,
    assignmentId: input.assignment.assignmentId,
    assignmentHash: input.specializedAssignmentHash,
    manifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    authorizedRange: input.assignment.authorizedRange,
    zones: [{
      zoneId: 'caption-bottom-third', frameRange: input.assignment.authorizedRange,
      xMillionths: 50_000, yMillionths: 720_000,
      widthMillionths: 900_000, heightMillionths: 200_000,
      finalOwner: 'captions' as const,
    }],
    readOnly: true as const,
  }
  return input.runtime.artifactStore.putJson({
    artifactType: 'caption_reserved_zones_v1',
    value: { ...core, zonesHash: hashSkillValue(core) },
    ...TRACK_ALL_FIXTURE_SCOPE,
  })
}

export async function createTrackAllPriorGraphFixture(input: {
  runtime: EditSkillRuntime
  nextAssignmentId: string
  authorizedRange?: SkillFrameRange
  sourceSha256?: string
}) {
  const range = input.authorizedRange ?? {
    startFrameInclusive: 24, endFrameExclusive: 144, fps: 24,
  }
  const ref = (artifactType: string, key: string): EditSkillArtifactReference => ({
    artifactType, sha256: hashSkillValue({ artifactType, key }),
    byteLength: 1_024, ...TRACK_ALL_FIXTURE_SCOPE,
  })
  const assignmentHash = hashSkillValue({ assignment: input.nextAssignmentId, prior: true })
  const planHash = hashSkillValue({ plan: input.nextAssignmentId, prior: true })
  const sourceSha256 = input.sourceSha256 ??
    hashSkillValue({ fixture: input.nextAssignmentId, source: true })
  const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  const qaRef = ref('track_all_temporal_qa_report_v1', `${input.nextAssignmentId}-prior-qa`)
  const boxCore = {
    schemaVersion: 'track_box_sequence_v1' as const,
    ...TRACK_ALL_FIXTURE_SCOPE,
    editSessionId: 'track-all-session',
    assignmentId: 'prior-assignment',
    assignmentHash,
    planHash,
    manifestRef,
    sourceSha256,
    authorizedRange: range,
    trackId: 'person_001',
    boxes: Array.from({
      length: range.endFrameExclusive - range.startFrameInclusive,
    }, (_, index) => ({
      frameIndex: range.startFrameInclusive + index,
      box: {
        x: 0.3 + Math.min(0.12, index * 0.001),
        y: 0.2,
        width: 0.22,
        height: 0.5,
      },
      confidence: 0.94,
    })),
  }
  const boxSequenceRef = await input.runtime.artifactStore.putJson({
    artifactType: 'track_box_sequence_v1',
    value: { ...boxCore, artifactHash: hashSkillValue(boxCore) },
    ...TRACK_ALL_FIXTURE_SCOPE,
  })
  const graph = createTrackGraphV2({
    schemaVersion: 'track_graph_v2', modelNeutral: true,
    ...TRACK_ALL_FIXTURE_SCOPE,
    editSessionId: 'track-all-session', assignmentId: 'prior-assignment',
    assignmentHash,
    planHash,
    manifestRef,
    sourceId: 'track-all-source',
    sourceSha256,
    timingHash: hashSkillValue({ timing: input.nextAssignmentId, prior: true }),
    authorizedRange: range, authorizedRangeHash: hashSkillValue(range),
    shots: [{ shotId: 'prior-shot', range, sceneCutResetsIdentity: true }],
    chunks: [{ chunkId: 'prior-chunk', range, bucketIndex: 0 }],
    targets: [{
      targetId: 'prior-target', targetType: 'selected_instance', semanticClass: 'person',
      includeRules: ['selected person'], excludeRules: [], privacyClass: 'none',
      groundingEvidenceHashes: [hashSkillValue({ grounding: input.nextAssignmentId })],
      expectedMinimumCount: 1, expectedMaximumCount: 1, ambiguityState: 'none',
    }],
    tracks: [{
      trackId: 'person_001', targetId: 'prior-target', semanticClass: 'person',
      childTrackIds: [], startFrameInclusive: range.startFrameInclusive,
      endFrameExclusive: range.endFrameExclusive,
      visibilitySpans: [{
        startFrameInclusive: range.startFrameInclusive,
        endFrameExclusive: range.endFrameExclusive, state: 'active',
      }],
      boxSequenceRef,
      confidenceSequenceHash: hashSkillValue({ confidence: input.nextAssignmentId }),
      reentryEventHashes: [], identitySwitchWarnings: [], depthOrder: 1,
      qaRefs: [qaRef], repairRefs: [],
    }],
    stitchingEvidenceHashes: [],
    cameraNormalizationEvidenceHash: hashSkillValue({ camera: input.nextAssignmentId }),
    uncertaintyEventHashes: [],
    objectBudget: {
      expectedObjects: 1, maximumObjects: 16, bucketSize: 16,
      bucketCount: 1, sessionCount: 1,
    },
    runtimeAttemptRefs: [], finalQaRefs: [qaRef],
    privateMaskDataPublished: false, outsideAuthorizedRangeModified: false,
  })
  return input.runtime.artifactStore.putJson({
    artifactType: 'track_graph_v2', value: graph, ...TRACK_ALL_FIXTURE_SCOPE,
  })
}

export async function createTrackAllPriorRepairEvidenceFixture(input: {
  runtime: EditSkillRuntime
  fixture: TrackAllAuthorityFixture
  trackGraphRef: EditSkillArtifactReference
}) {
  const core = {
    schemaVersion: 'prior_track_repair_evidence_v1' as const,
    ...TRACK_ALL_FIXTURE_SCOPE,
    editSessionId: input.fixture.assignment.editSessionId,
    assignmentHash: input.fixture.specializedAssignment.assignmentHash,
    planHash: hashSkillValue({ plan: input.fixture.assignment.assignmentId, prior: true }),
    trackGraphRef: input.trackGraphRef, trackId: 'person_001', repairCount: 0,
    priorRepairReceiptRefs: [],
    failureEvidenceHashes: [hashSkillValue({ failure: 'bounded-local-gap' })],
  }
  return input.runtime.artifactStore.putJson({
    artifactType: 'prior_track_repair_evidence_v1',
    value: { ...core, evidenceHash: hashSkillValue(core) },
    ...TRACK_ALL_FIXTURE_SCOPE,
  })
}
