import assert from 'node:assert/strict'

import {
  registerBrollArtifactSchemas,
  trackGraphV1Schema as brollTrackGraphV1Schema,
} from '../edit-skills/b-roll'
import { EditSkillArtifactSchemaRegistry } from '../edit-skills/core/edit-skill-artifact-store'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_PRODUCED_ARTIFACT_TYPES,
  registerTrackAllArtifactSchemas,
  trackBoxSequenceSchema,
} from '../edit-skills/track-all'
import {
  createTrackGraphV2,
  projectTrackGraphV1,
  trackGraphV1Schema,
  trackGraphV2Schema,
} from '../edit-skills/shared/track-graph'

const scope = { ownerUserId: 'graph-user', workspaceId: 'graph-workspace', projectId: 'graph-project' }
const editSessionId = 'graph-session'
const assignmentId = 'graph-assignment'
const assignmentHash = hashSkillValue({ assignmentId })
const planHash = hashSkillValue({ plan: assignmentId })
const sourceSha256 = hashSkillValue({ source: assignmentId })
const timingHash = hashSkillValue({ timing: assignmentId })
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const authorizedRange = { startFrameInclusive: 24, endFrameExclusive: 144, fps: 24 }
const ref = (artifactType: string, value: unknown) => ({
  artifactType, sha256: hashSkillValue(value), byteLength: 100, ...scope,
})
const boxRef = ref('track_box_sequence_v1', 'boxes')
const maskRef = ref('track_mask_sequence_v1', 'masks')
const anchorRef = ref('track_anchor_graph_v1', 'anchors')
const cameraRef = ref('camera_motion_graph_v1', 'camera')
const occlusionRef = ref('track_occlusion_event_log_v1', 'occlusion')
const qaRef = ref('track_all_temporal_qa_report_v1', 'qa')

const graph = createTrackGraphV2({
  schemaVersion: 'track_graph_v2', modelNeutral: true, ...scope, editSessionId,
  assignmentId, assignmentHash, planHash, manifestRef,
  sourceId: 'source-001', sourceSha256, timingHash, authorizedRange,
  authorizedRangeHash: hashSkillValue(authorizedRange),
  shots: [{ shotId: 'shot-001', range: authorizedRange, sceneCutResetsIdentity: true }],
  chunks: [{ chunkId: 'chunk-001', range: authorizedRange, bucketIndex: 0 }],
  cameraMotionRef: cameraRef,
  targets: [{
    targetId: 'target-001', targetType: 'selected_instance', semanticClass: 'object',
    includeRules: ['selected target'], excludeRules: [], privacyClass: 'none',
    groundingEvidenceHashes: [hashSkillValue('box-grounding')],
    expectedMinimumCount: 1, expectedMaximumCount: 1, ambiguityState: 'none',
  }],
  tracks: [{
    trackId: 'object_001', targetId: 'target-001', semanticClass: 'object',
    childTrackIds: [], startFrameInclusive: 24, endFrameExclusive: 144,
    visibilitySpans: [{ startFrameInclusive: 24, endFrameExclusive: 144, state: 'active' }],
    boxSequenceRef: boxRef, maskSequenceRef: maskRef, anchorGraphRef: anchorRef,
    confidenceSequenceHash: hashSkillValue('confidence'),
    occlusionEventLogRef: occlusionRef, reentryEventHashes: [],
    identitySwitchWarnings: [], depthOrder: 0, qaRefs: [qaRef], repairRefs: [],
  }],
  stitchingEvidenceHashes: [hashSkillValue('stitching')],
  cameraNormalizationEvidenceHash: hashSkillValue('normalization'),
  uncertaintyEventHashes: [],
  objectBudget: { expectedObjects: 1, maximumObjects: 16, bucketSize: 16, bucketCount: 1, sessionCount: 1 },
  runtimeAttemptRefs: [], finalQaRefs: [qaRef],
  privateMaskDataPublished: false, outsideAuthorizedRangeModified: false,
})
assert.equal(trackGraphV2Schema.parse(graph).graphHash, graph.graphHash)
const v1 = projectTrackGraphV1(graph)
assert.deepEqual(trackGraphV1Schema.parse(v1), v1)
assert.deepEqual(brollTrackGraphV1Schema.parse(v1), v1)
assert.equal(v1.tracks[0]?.samplesArtifactHash, boxRef.sha256)

assert.throws(() => trackGraphV2Schema.parse({
  ...graph,
  tracks: graph.tracks.map((track) => ({
    ...track, boxSequenceRef: { ...track.boxSequenceRef, workspaceId: 'foreign' },
  })),
}), /cross-tenant|stale or forged/iu)
assert.throws(() => trackGraphV2Schema.parse({
  ...graph,
  chunks: [{ ...graph.chunks[0], range: { startFrameInclusive: 0, endFrameExclusive: 144, fps: 24 } }],
}), /exceeds authorized range|stale or forged/iu)
assert.throws(() => trackGraphV2Schema.parse({
  ...graph,
  objectBudget: { ...graph.objectBudget, bucketCount: 2 },
}), /multiplex bucket budget|stale or forged/iu)
assert.throws(() => trackGraphV2Schema.parse({ ...graph, rawMaskBitmaps: [[0, 1]] }), /unrecognized key|invalid input/iu)

const boxSequenceCore = {
  schemaVersion: 'track_box_sequence_v1' as const, ...scope, editSessionId,
  assignmentId, assignmentHash, planHash, manifestRef, sourceSha256,
  authorizedRange, trackId: 'object_001',
  boxes: [{ frameIndex: 24, box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }, confidence: 0.99 }],
}
const boxSequence = trackBoxSequenceSchema.parse({
  ...boxSequenceCore, artifactHash: hashSkillValue(boxSequenceCore),
})
assert.equal(boxSequence.artifactHash, hashSkillValue(boxSequenceCore))
assert.throws(() => trackBoxSequenceSchema.parse({
  ...boxSequence, boxes: [{ ...boxSequence.boxes[0], confidence: 0.1 }],
}), /stale or forged/iu)

const schemas = new EditSkillArtifactSchemaRegistry()
registerBrollArtifactSchemas(schemas)
registerTrackAllArtifactSchemas(schemas)
for (const artifactType of TRACK_ALL_PRODUCED_ARTIFACT_TYPES) {
  schemas.assertStrictActive(artifactType)
  assert.throws(() => schemas.parse(artifactType, {
    schemaVersion: artifactType, assignmentHash, planHash,
    authorizedRange, evidenceHashes: [], artifactHash: hashSkillValue('generic'),
  }))
}

console.log(JSON.stringify({
  status: 'ok', strictProducedArtifactSchemas: TRACK_ALL_PRODUCED_ARTIFACT_TYPES.length,
  trackGraphV1Compatible: true, trackGraphV2Hash: graph.graphHash,
  rawMaskBitmapsRejected: true, publicMaskPublished: false,
}))
