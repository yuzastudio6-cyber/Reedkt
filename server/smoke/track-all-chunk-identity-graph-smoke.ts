import assert from 'node:assert/strict'

import {
  buildTrackAllChunkIdentityGraph,
} from '../edit-skills/track-all/private/chunk-identity-graph-runtime'
import {
  trackBoxSequenceSchema,
  trackIdentityLineageSchema,
  trackMaskSequenceSchema,
  trackOcclusionEventLogSchema,
  trackSampleSequenceSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
} from '../edit-skills/track-all/track-all-capability-manifest'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  projectTrackGraphV1,
  trackGraphV1Schema,
  trackGraphV2Schema,
} from '../edit-skills/shared/track-graph/track-graph-schemas'

const hash = (seed: string) => hashSkillValue({ seed })
const scope = {
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
}
const ref = (artifactType: string, seed: string) => ({
  artifactType,
  sha256: hash(seed),
  byteLength: 1_024,
  ...scope,
})
const box = (x: number, y = 0.2, width = 0.2, height = 0.5) => ({
  x, y, width, height,
})
const samples = (input: {
  start: number
  end: number
  x: (frame: number) => number
  y?: number
  width?: number
  height?: number
  visibility?: (frame: number) =>
    'active' | 'partially_occluded' | 'fully_occluded'
}) => Array.from({ length: input.end - input.start }, (_, offset) => {
  const frameIndex = input.start + offset
  return {
    frameIndex,
    box: box(input.x(frameIndex), input.y, input.width, input.height),
    confidence: 0.92,
    visibility: input.visibility?.(frameIndex) ?? 'active' as const,
  }
})

const chunks = [
  {
    chunkId: 'chunk-1-bucket-0',
    range: { startFrameInclusive: 0, endFrameExclusive: 12, fps: 30 },
    overlapRange: { startFrameInclusive: 8, endFrameExclusive: 12, fps: 30 },
    bucketIndex: 0,
    attemptRefHash: hash('attempt-c1b0'),
  },
  {
    chunkId: 'chunk-2-bucket-0',
    range: { startFrameInclusive: 8, endFrameExclusive: 20, fps: 30 },
    overlapRange: { startFrameInclusive: 8, endFrameExclusive: 12, fps: 30 },
    bucketIndex: 0,
    attemptRefHash: hash('attempt-c2b0'),
  },
  {
    chunkId: 'chunk-2-bucket-1',
    range: { startFrameInclusive: 8, endFrameExclusive: 20, fps: 30 },
    overlapRange: { startFrameInclusive: 8, endFrameExclusive: 12, fps: 30 },
    bucketIndex: 1,
    attemptRefHash: hash('attempt-c2b1'),
  },
  {
    chunkId: 'chunk-3-bucket-0',
    range: { startFrameInclusive: 20, endFrameExclusive: 32, fps: 30 },
    bucketIndex: 0,
    attemptRefHash: hash('attempt-c3b0'),
  },
]

function observation(input: {
  observationId: string
  chunkId: string
  bucketIndex: number
  localObjectId: string
  targetId: string
  semanticClass: string
  samples: ReturnType<typeof samples>
  explicitCrossShotLinkEvidenceHash?: string
}) {
  return {
    ...input,
    maskChunkRef: ref(
      'track_mask_chunk_manifest_v1',
      `mask-${input.observationId}`,
    ),
    sourceEvidenceHash: hash(`source-${input.observationId}`),
  }
}

function validInput() {
  return {
    ...scope,
    editSessionId: 'edit-session-1',
    assignmentId: 'assignment-1',
    assignmentHash: hash('assignment'),
    planHash: hash('plan'),
    manifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    sourceId: 'source-1',
    sourceSha256: hash('source'),
    timingHash: hash('timing'),
    authorizedRange: {
      startFrameInclusive: 0,
      endFrameExclusive: 40,
      fps: 30,
    },
    shots: [
      {
        shotId: 'shot-1',
        range: { startFrameInclusive: 0, endFrameExclusive: 20, fps: 30 },
      },
      {
        shotId: 'shot-2',
        range: { startFrameInclusive: 20, endFrameExclusive: 40, fps: 30 },
      },
    ],
    chunks,
    targets: [
      {
        targetId: 'presenter-target',
        targetType: 'selected_instance',
        semanticClass: 'person',
        includeRules: ['selected presenter'],
        excludeRules: [],
        privacyClass: 'none',
        groundingEvidenceHashes: [hash('presenter-grounding')],
        expectedMinimumCount: 1,
        expectedMaximumCount: 2,
        ambiguityState: 'none' as const,
        crossShotPolicy: 'terminate' as const,
      },
      {
        targetId: 'face-target',
        targetType: 'track_child_region',
        semanticClass: 'face',
        includeRules: ['presenter face'],
        excludeRules: [],
        privacyClass: 'personal',
        groundingEvidenceHashes: [hash('face-grounding')],
        expectedMinimumCount: 1,
        expectedMaximumCount: 1,
        ambiguityState: 'none' as const,
        parentTargetId: 'presenter-target',
        crossShotPolicy: 'terminate' as const,
      },
      {
        targetId: 'crossing-target',
        targetType: 'concept_group',
        semanticClass: 'person',
        includeRules: ['two crossing people'],
        excludeRules: ['presenter'],
        privacyClass: 'none',
        groundingEvidenceHashes: [hash('crossing-grounding')],
        expectedMinimumCount: 2,
        expectedMaximumCount: 2,
        ambiguityState: 'none' as const,
        crossShotPolicy: 'terminate' as const,
      },
    ],
    observations: [
      observation({
        observationId: 'presenter-chunk-1',
        chunkId: 'chunk-1-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_001',
        targetId: 'presenter-target',
        semanticClass: 'person',
        samples: samples({
          start: 0, end: 8, x: (frame) => 0.1 + frame * 0.005,
          visibility: (frame) => frame === 5
            ? 'partially_occluded'
            : frame >= 6
              ? 'fully_occluded'
              : 'active',
        }),
      }),
      observation({
        observationId: 'presenter-chunk-2',
        chunkId: 'chunk-2-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_007',
        targetId: 'presenter-target',
        semanticClass: 'person',
        samples: samples({
          start: 10, end: 20, x: (frame) => 0.1 + frame * 0.005,
        }),
      }),
      observation({
        observationId: 'presenter-duplicate-bucket',
        chunkId: 'chunk-2-bucket-1',
        bucketIndex: 1,
        localObjectId: 'object_016',
        targetId: 'presenter-target',
        semanticClass: 'person',
        samples: samples({
          start: 10, end: 20, x: (frame) => 0.102 + frame * 0.005,
        }),
      }),
      observation({
        observationId: 'presenter-after-cut',
        chunkId: 'chunk-3-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_001',
        targetId: 'presenter-target',
        semanticClass: 'person',
        samples: samples({ start: 20, end: 32, x: () => 0.2 }),
      }),
      observation({
        observationId: 'face-chunk-1',
        chunkId: 'chunk-1-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_002',
        targetId: 'face-target',
        semanticClass: 'face',
        samples: samples({
          start: 0, end: 12, x: (frame) => 0.14 + frame * 0.005,
          y: 0.24, width: 0.08, height: 0.1,
        }),
      }),
      observation({
        observationId: 'face-chunk-2',
        chunkId: 'chunk-2-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_008',
        targetId: 'face-target',
        semanticClass: 'face',
        samples: samples({
          start: 8, end: 20, x: (frame) => 0.14 + frame * 0.005,
          y: 0.24, width: 0.08, height: 0.1,
        }),
      }),
      observation({
        observationId: 'cross-left-chunk-1',
        chunkId: 'chunk-1-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_003',
        targetId: 'crossing-target',
        semanticClass: 'person',
        samples: samples({
          start: 0, end: 12, x: (frame) => 0.2 + frame * 0.015,
          width: 0.12, height: 0.45,
        }),
      }),
      observation({
        observationId: 'cross-right-chunk-1',
        chunkId: 'chunk-1-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_004',
        targetId: 'crossing-target',
        semanticClass: 'person',
        samples: samples({
          start: 0, end: 12, x: (frame) => 0.7 - frame * 0.015,
          width: 0.12, height: 0.45,
        }),
      }),
      observation({
        observationId: 'cross-left-renumbered',
        chunkId: 'chunk-2-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_010',
        targetId: 'crossing-target',
        semanticClass: 'person',
        samples: samples({
          start: 8, end: 20, x: (frame) => 0.2 + frame * 0.015,
          width: 0.12, height: 0.45,
        }),
      }),
      observation({
        observationId: 'cross-right-renumbered',
        chunkId: 'chunk-2-bucket-0',
        bucketIndex: 0,
        localObjectId: 'object_009',
        targetId: 'crossing-target',
        semanticClass: 'person',
        samples: samples({
          start: 8, end: 20, x: (frame) => 0.7 - frame * 0.015,
          width: 0.12, height: 0.45,
        }),
      }),
    ],
    objectBudget: {
      expectedObjects: 17,
      maximumObjects: 32,
      bucketSize: 16 as const,
      bucketCount: 2,
      sessionCount: 8,
    },
    cameraNormalizationEvidenceHash: hash('camera-normalization'),
    runtimeAttemptRefs: [ref(
      'track_all_sam3_1_masklet_attempt_evidence_v2', 'attempt',
    )],
    finalQaRefs: [ref('track_all_temporal_qa_report_v1', 'qa')],
    evidenceClass: 'injected_masklets_test_only' as const,
  }
}

const result = buildTrackAllChunkIdentityGraph(validInput())
assert.equal(trackGraphV2Schema.parse(result.graph).graphHash,
  result.graph.graphHash)
assert.equal(result.graph.tracks.length, 5)
assert.equal(result.graph.privateMaskDataPublished, false)
assert.equal(result.graph.outsideAuthorizedRangeModified, false)
assert.equal(result.graph.objectBudget.bucketCount, 2)
assert.equal(result.graph.objectBudget.sessionCount, 8)
assert.equal(result.graph.tracks.filter((track) =>
  track.targetId === 'presenter-target').length, 2)
const presenter = result.graph.tracks.find((track) =>
  track.targetId === 'presenter-target' && track.startFrameInclusive === 0)!
assert.equal(presenter.visibilitySpans.some((span) => span.state === 'lost'), true)
assert.equal(presenter.visibilitySpans.some((span) =>
  span.state === 'reacquired'), true)
assert.equal(presenter.reentryEventHashes.length, 1)
assert.equal(result.reentryEventCount >= 1, true)
const face = result.graph.tracks.find((track) =>
  track.targetId === 'face-target')!
assert.equal(face.parentTrackId, presenter.trackId)
assert.equal(presenter.childTrackIds.includes(face.trackId), true)
assert.equal(trackIdentityLineageSchema.parse(result.identityLineage)
  .identities.every((identity) => !identity.crossShotCertain), true)
assert.equal(result.sampleSequences.every((value) =>
  trackSampleSequenceSchema.safeParse(value).success), true)
assert.equal(result.boxSequences.every((value) =>
  trackBoxSequenceSchema.safeParse(value).success), true)
assert.equal(result.maskSequences.every((value) =>
  trackMaskSequenceSchema.safeParse(value).success), true)
assert.equal(result.occlusionEventLogs.every((value) =>
  trackOcclusionEventLogSchema.safeParse(value).success), true)
assert.equal(trackGraphV1Schema.parse(projectTrackGraphV1(result.graph))
  .tracks.length, result.graph.tracks.length)

const crossingBoxes = result.boxSequences.map((value) =>
  trackBoxSequenceSchema.parse(value)).filter((sequence) =>
  result.graph.tracks.find((track) => track.trackId === sequence.trackId)
    ?.targetId === 'crossing-target')
assert.equal(crossingBoxes.length, 2)
assert.equal(crossingBoxes.some((sequence) =>
  sequence.boxes[0]!.box.x < sequence.boxes.at(-1)!.box.x), true)
assert.equal(crossingBoxes.some((sequence) =>
  sequence.boxes[0]!.box.x > sequence.boxes.at(-1)!.box.x), true)

const explicitCrossShot = validInput()
explicitCrossShot.targets[0]!.crossShotPolicy =
  'explicit_confidence_link' as never
explicitCrossShot.observations[3]!.explicitCrossShotLinkEvidenceHash =
  hash('explicit-cross-shot-link')
const crossShotResult = buildTrackAllChunkIdentityGraph(explicitCrossShot)
assert.equal(crossShotResult.graph.tracks.filter((track) =>
  track.targetId === 'presenter-target').length, 1)
assert.equal(crossShotResult.identitySwitchWarningCount >= 1, true)
assert.equal(trackIdentityLineageSchema.parse(crossShotResult.identityLineage)
  .identities.find((identity) => identity.anonymousTrackId === presenter.trackId)
  ?.crossShotCertain, false)

const adversarial: Array<(value: ReturnType<typeof validInput>) => void> = [
  (value) => { value.observations[0]!.samples[0]!.frameIndex = 40 },
  (value) => { value.observations[0]!.bucketIndex = 1 },
  (value) => { value.observations[1]!.observationId =
    value.observations[0]!.observationId },
  (value) => { value.objectBudget.bucketCount = 1 },
  (value) => { value.chunks[0]!.range.endFrameExclusive = 41 },
  (value) => { value.observations[0]!.maskChunkRef!.workspaceId =
    'workspace-other' },
  (value) => { value.finalQaRefs[0]!.projectId = 'project-other' },
  (value) => { value.targets[1]!.parentTargetId = 'unknown-target' },
  (value) => { value.targets[0]!.expectedMaximumCount = 1 },
]
for (const [index, mutate] of adversarial.entries()) {
  const value = structuredClone(validInput())
  mutate(value)
  assert.throws(
    () => buildTrackAllChunkIdentityGraph(value),
    `chunk identity adversarial case ${index} must fail closed`,
  )
}

console.log(JSON.stringify({
  status: 'ok',
  graphHash: result.graph.graphHash,
  trackCount: result.graph.tracks.length,
  chunkCount: result.graph.chunks.length,
  bucketCount: result.graph.objectBudget.bucketCount,
  sessionCount: result.graph.objectBudget.sessionCount,
  reentryEventCount: result.reentryEventCount,
  identitySwitchWarningCount: result.identitySwitchWarningCount,
  parentChildLineage: face.parentTrackId === presenter.trackId,
  similarPeoplePreserved: crossingBoxes.length === 2,
  sceneCutReset: result.graph.tracks.filter((track) =>
    track.targetId === 'presenter-target').length === 2,
  explicitCrossShotUncertainLink: crossShotResult.graph.tracks.filter((track) =>
    track.targetId === 'presenter-target').length === 1,
  trackGraphV1Compatible: true,
  injectedEvidenceOnly: true,
  adversarialCases: adversarial.length,
}))
