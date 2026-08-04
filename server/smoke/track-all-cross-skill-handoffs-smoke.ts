import assert from 'node:assert/strict'

import {
  createTrackGraphV2,
  projectTrackGraphV1,
  trackGraphV1Schema,
} from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
  trackAllCrossSkillHandoffSchema,
  trackAnchorGraphSchema,
  trackBoxSequenceSchema,
  trackMaskSequenceSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  compileTrackAllCrossSkillHandoffs,
} from '../edit-skills/track-all/private/cross-skill-handoff-runtime'

const scope = {
  ownerUserId: 'handoff-user',
  workspaceId: 'handoff-workspace',
  projectId: 'handoff-project',
}
const range = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
const assignmentHash = hashSkillValue({ assignment: 'handoff' })
const planHash = hashSkillValue({ plan: 'handoff' })
const sourceSha256 = hashSkillValue({ source: 'handoff' })
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const base = {
  ...scope,
  editSessionId: 'handoff-session',
  assignmentId: 'handoff-assignment',
  assignmentHash,
  planHash,
  manifestRef,
  sourceSha256,
  authorizedRange: range,
}
const ref = (artifactType: string, sha256: string) => ({
  artifactType,
  sha256,
  byteLength: 1_024,
  ...scope,
})
const addressed = <T extends Record<string, unknown>>(core: T) => ({
  ...core,
  artifactHash: hashSkillValue(core),
})

const personBoxes = trackBoxSequenceSchema.parse(addressed({
  schemaVersion: 'track_box_sequence_v1' as const,
  ...base,
  trackId: 'person_001',
  boxes: boxes((frame) => ({
    x: frame < 3 ? frame * 0.025 : 0.16 + frame * 0.008,
    y: 0.18,
    width: 0.28,
    height: 0.62,
  })),
}))
const faceBoxes = trackBoxSequenceSchema.parse(addressed({
  schemaVersion: 'track_box_sequence_v1' as const,
  ...base,
  trackId: 'face_001',
  boxes: boxes((frame) => ({
    x: 0.21 + frame * 0.008,
    y: 0.19,
    width: 0.1,
    height: 0.15,
  })),
}))
const surfaceBoxes = trackBoxSequenceSchema.parse(addressed({
  schemaVersion: 'track_box_sequence_v1' as const,
  ...base,
  trackId: 'surface_001',
  boxes: boxes((frame) => ({
    x: 0.72 + frame * 0.003,
    y: 0.28,
    width: 0.2,
    height: 0.28,
  })),
}))

const maskSequence = (trackId: 'person_001' | 'face_001' | 'surface_001') =>
  trackMaskSequenceSchema.parse(addressed({
    schemaVersion: 'track_mask_sequence_v1' as const,
    ...base,
    trackId,
    chunkRefs: [ref(
      'track_mask_chunk_manifest_v1',
      hashSkillValue({ trackId, chunk: 'private-mask' }),
    )],
    privateBinaryOnly: true as const,
    publicMaskPublished: false as const,
  }))
const masks = [
  maskSequence('person_001'), maskSequence('face_001'), maskSequence('surface_001'),
]

const anchorGraph = trackAnchorGraphSchema.parse(addressed({
  schemaVersion: 'track_anchor_graph_v1' as const,
  ...base,
  anchors: [
    { anchorId: 'person-center', trackId: 'person_001', frameIndex: 6, point: { x: 0.35, y: 0.48 }, visibility: 'visible' as const, confidence: 0.94 },
    { anchorId: 'face-center', trackId: 'face_001', frameIndex: 6, point: { x: 0.3, y: 0.27 }, visibility: 'visible' as const, confidence: 0.92 },
    { anchorId: 'screen-center', trackId: 'surface_001', frameIndex: 6, point: { x: 0.84, y: 0.42 }, visibility: 'visible' as const, confidence: 0.9 },
  ],
}))

const cameraMotion = cameraMotionGraphSchema.parse(addressed({
  schemaVersion: 'camera_motion_graph_v1' as const,
  ...base,
  transforms: Array.from({ length: 24 }, (_, frameIndex) => ({
    frameIndex,
    motion: frameIndex === 0 ? 'static' as const : 'pan' as const,
    frameToFrameTransform: [1, 0, frameIndex === 0 ? 0 : 0.005, 0, 1, 0, 0, 0, 1] as const,
    stabilizedTransform: [1, 0, -frameIndex * 0.005, 0, 1, 0, 0, 0, 1] as const,
    confidence: 0.91,
    discontinuityWarning: false,
    shotReset: frameIndex === 0 || frameIndex === 12,
  })),
}))

const planar = planarTrackGraphSchema.parse(addressed({
  schemaVersion: 'planar_track_graph_v1' as const,
  ...base,
  surfaceId: 'phone-screen',
  surfaceClass: 'phone_screen' as const,
  frames: Array.from({ length: 24 }, (_, frameIndex) => ({
    frameIndex,
    corners: [
      { x: 0.72, y: 0.28 }, { x: 0.92, y: 0.28 },
      { x: 0.92, y: 0.56 }, { x: 0.72, y: 0.56 },
    ] as const,
    homography: [1, 0, frameIndex * 0.001, 0, 1, 0, 0, 0, 1] as const,
    reprojectionError: 0.45,
    visibility: 1,
    occlusion: 0,
    surfaceStability: 0.93,
    confidence: 0.91,
  })),
  coordinateInterpretation: 'world_relative' as const,
}))

const qaRef = ref('track_all_temporal_qa_report_v1', hashSkillValue({ qa: 'handoff' }))
const graph = createTrackGraphV2({
  schemaVersion: 'track_graph_v2',
  modelNeutral: true,
  ...base,
  sourceId: 'handoff-source',
  timingHash: hashSkillValue({ timing: range }),
  authorizedRangeHash: hashSkillValue(range),
  shots: [
    { shotId: 'shot-a', range: { ...range, endFrameExclusive: 12 }, sceneCutResetsIdentity: true },
    { shotId: 'shot-b', range: { ...range, startFrameInclusive: 12 }, sceneCutResetsIdentity: true },
  ],
  chunks: [{ chunkId: 'handoff-chunk', range, bucketIndex: 0 }],
  cameraMotionRef: ref('camera_motion_graph_v1', cameraMotion.artifactHash),
  targets: [
    target('person-target', 'person'),
    target('face-target', 'face'),
    target('surface-target', 'phone_screen'),
  ],
  tracks: [
    track('person_001', 'person-target', 'person', personBoxes, masks[0]!, 1, {
      childTrackIds: ['face_001'],
    }),
    track('face_001', 'face-target', 'face', faceBoxes, masks[1]!, 2, {
      parentTrackId: 'person_001',
    }),
    track('surface_001', 'surface-target', 'phone_screen', surfaceBoxes, masks[2]!, 1, {
      planarGeometryRef: ref('planar_track_graph_v1', planar.artifactHash),
    }),
  ],
  stitchingEvidenceHashes: [hashSkillValue({ stitching: 'handoff' })],
  cameraNormalizationEvidenceHash: hashSkillValue({ camera: cameraMotion.artifactHash }),
  uncertaintyEventHashes: [],
  objectBudget: {
    expectedObjects: 3, maximumObjects: 3, bucketSize: 16,
    bucketCount: 1, sessionCount: 1,
  },
  runtimeAttemptRefs: [],
  finalQaRefs: [qaRef],
  privateMaskDataPublished: false,
  outsideAuthorizedRangeModified: false,
})

const handoffs = compileTrackAllCrossSkillHandoffs({
  trackGraph: graph,
  boxSequences: [personBoxes, faceBoxes, surfaceBoxes],
  maskSequences: masks,
  anchorGraphs: [anchorGraph],
  cameraMotionGraph: cameraMotion,
  planarTrackGraphs: [planar],
})

assert.deepEqual(Object.keys(handoffs).sort(), [
  'b_roll', 'captions', 'color', 'graphic_design', 'living_frame',
  'render', 'sound', 'three_d', 'transition',
])
assert.equal(handoffs.b_roll.trackGraphV1Ref?.artifactType, 'track_graph_v1')
assert.equal(trackGraphV1Schema.safeParse(projectTrackGraphV1(graph)).success, true)
assert.deepEqual(handoffs.b_roll.geometryPayload.handoffKind, 'b_roll')
assert.equal(handoffs.captions.maskRefs.length, 3)
assert.equal(handoffs.graphic_design.anchorGraphRefs.length, 1)
assert.equal(handoffs.living_frame.cameraMotionRef?.sha256, cameraMotion.artifactHash)
assert.equal(handoffs.three_d.planarTrackRefs[0]?.sha256, planar.artifactHash)
assert.equal(handoffs.color.geometryPayload.handoffKind, 'color')
assert.equal(handoffs.sound.geometryPayload.handoffKind, 'sound')
assert.equal(handoffs.transition.geometryPayload.handoffKind, 'transition')
assert.equal(handoffs.render.geometryPayload.handoffKind, 'render')
assert.equal(handoffs.render.finalPeerDesignOwnedByTrackAll, false)
assert.equal(new Set(Object.values(handoffs).map((value) => value.artifactHash)).size, 9)
assert.equal(Object.values(handoffs).every((value) => value.geometryOnly), true)

assert.throws(() => trackAllCrossSkillHandoffSchema.parse({
  ...handoffs.b_roll,
  consumerSkillKey: 'captions',
}))
assert.throws(() => trackAllCrossSkillHandoffSchema.parse({
  ...handoffs.b_roll,
  modelDependency: 'sam3_1',
}))
assert.throws(() => trackAllCrossSkillHandoffSchema.parse({
  ...handoffs.b_roll,
  trackGraphV2Ref: { ...handoffs.b_roll.trackGraphV2Ref, workspaceId: 'other' },
}))
assert.throws(() => trackAllCrossSkillHandoffSchema.parse({
  ...handoffs.sound,
  geometryPayload: {
    ...handoffs.sound.geometryPayload,
    movementCueFrames: [24],
  },
}))
assert.throws(() => compileTrackAllCrossSkillHandoffs({
  trackGraph: graph,
  boxSequences: [personBoxes, faceBoxes, surfaceBoxes],
  maskSequences: [{ ...masks[0]!, artifactHash: hashSkillValue({ forged: true }) }, masks[1]!, masks[2]!],
  anchorGraphs: [anchorGraph],
  cameraMotionGraph: cameraMotion,
  planarTrackGraphs: [planar],
}))

console.log(JSON.stringify({
  status: 'ok',
  handoffCount: Object.keys(handoffs).length,
  handoffHashes: Object.fromEntries(Object.entries(handoffs).map(([key, value]) =>
    [key, value.artifactHash])),
  trackGraphV1Compatible: true,
  trackGraphV2Hash: graph.graphHash,
  captionMaskCount: handoffs.captions.maskRefs.length,
  graphicAnchorCount: handoffs.graphic_design.anchorGraphRefs.length,
  planarSurfaceCount: handoffs.three_d.planarTrackRefs.length,
  finalPeerOwnershipPreserved: true,
  modelSpecificDependencyRejected: true,
  crossWorkspaceRejected: true,
  outsideAuthorizedRangeModified: false,
  providerRequestCount: 0,
  publicArtifactCount: 0,
  productionMutationCount: 0,
}))

function boxes(
  geometry: (frame: number) => { x: number; y: number; width: number; height: number },
) {
  return Array.from({ length: 24 }, (_, frameIndex) => ({
    frameIndex,
    box: geometry(frameIndex),
    confidence: 0.92,
  }))
}

function target(targetId: string, semanticClass: string) {
  return {
    targetId,
    targetType: 'selected_instance',
    semanticClass,
    includeRules: [semanticClass],
    excludeRules: [],
    privacyClass: 'none',
    groundingEvidenceHashes: [hashSkillValue({ targetId })],
    expectedMinimumCount: 1,
    expectedMaximumCount: 1,
    ambiguityState: 'none' as const,
  }
}

function track(
  trackId: 'person_001' | 'face_001' | 'surface_001',
  targetId: string,
  semanticClass: string,
  boxSequence: typeof personBoxes,
  maskSequenceValue: typeof masks[number],
  depthOrder: number,
  options: {
    parentTrackId?: 'person_001'
    childTrackIds?: 'face_001'[]
    planarGeometryRef?: ReturnType<typeof ref>
  } = {},
) {
  return {
    trackId,
    targetId,
    semanticClass,
    ...(options.parentTrackId ? { parentTrackId: options.parentTrackId } : {}),
    childTrackIds: options.childTrackIds ?? [],
    startFrameInclusive: 0,
    endFrameExclusive: 24,
    visibilitySpans: [{ startFrameInclusive: 0, endFrameExclusive: 24, state: 'active' as const }],
    boxSequenceRef: ref('track_box_sequence_v1', boxSequence.artifactHash),
    maskSequenceRef: ref('track_mask_sequence_v1', maskSequenceValue.artifactHash),
    anchorGraphRef: ref('track_anchor_graph_v1', anchorGraph.artifactHash),
    ...(options.planarGeometryRef ? { planarGeometryRef: options.planarGeometryRef } : {}),
    confidenceSequenceHash: hashSkillValue({ trackId, confidence: 'handoff' }),
    reentryEventHashes: [],
    identitySwitchWarnings: [],
    depthOrder,
    qaRefs: [qaRef],
    repairRefs: [],
  }
}
