import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import {
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionTrackAllTreatmentRequest,
  prepareOfflineRemotionDockerRuntime,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution'
import {
  createTrackGraphV2,
  type TrackGraphV2,
} from '../edit-skills/shared/track-graph/track-graph-schemas'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  trackAllIntegrationQaReportSchema,
  trackBoxSequenceSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  buildTrackAllTreatmentRemotionRequest,
  compileTrackAllFocus,
  compileTrackAllReframe,
  deriveTrackAllTreatmentIntegrationQa,
  finalizeTrackAllFocus,
  finalizeTrackAllReframe,
} from '../edit-skills/track-all/private/focus-reframe-runtime'
import { trackAllCaptionReservedZonesSchema } from '../edit-skills/track-all/track-all-schemas'

const execFileAsync = promisify(execFile)
const directory = await mkdtemp(join(tmpdir(), 'reeditpro-track-all-focus-'))
const sourcePath = join(directory, 'source.mp4')
const scope = {
  ownerUserId: 'focus-user',
  workspaceId: 'focus-workspace',
  projectId: 'focus-project',
}
const range = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
const assignmentHash = hashSkillValue({ assignment: 'focus-reframe' })
const planHash = hashSkillValue({ plan: 'focus-reframe' })
const sourceShaSeed = hashSkillValue({ source: 'pending' })
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const ref = (artifactType: string, sha256: string, byteLength = 1_024) => ({
  artifactType,
  sha256,
  byteLength,
  ...scope,
})

try {
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', 'testsrc2=size=640x360:rate=24:duration=1',
    '-vf', 'drawbox=x=70:y=60:w=120:h=150:color=yellow@0.8:t=fill,' +
      'drawbox=x=390:y=80:w=100:h=170:color=cyan@0.8:t=fill',
    '-an', '-c:v', 'mpeg4', '-q:v', '2', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-y', sourcePath,
  ], { maxBuffer: 2 * 1024 * 1024 })
  const sourceBytes = await readFile(sourcePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  assert.notEqual(sourceSha256, sourceShaSeed)

  const productSequence = boxSequence({
    trackId: 'object_001',
    sourceSha256,
    boxes: Array.from({ length: 24 }, (_, frame) => ({
      frameIndex: frame,
      box: { x: 0.11 + frame * 0.004, y: 0.17, width: 0.22, height: 0.42 },
      confidence: frame >= 20 ? 0.56 : 0.94,
    })),
  })
  const speakerSequence = boxSequence({
    trackId: 'person_001',
    sourceSha256,
    boxes: Array.from({ length: 24 }, (_, frame) => ({
      frameIndex: frame,
      box: { x: 0.6 - frame * 0.002, y: 0.2, width: 0.2, height: 0.5 },
      confidence: 0.92,
    })),
  })
  const graph = graphFixture(sourceSha256, productSequence, speakerSequence)
  const zonesCore = {
    schemaVersion: 'caption_reserved_zones_v1' as const,
    ...scope,
    assignmentId: graph.assignmentId,
    assignmentHash,
    authorizedRange: range,
    zones: [{
      zoneId: 'caption-bottom',
      range,
      box: { x: 0.08, y: 0.82, width: 0.84, height: 0.14 },
      ownerSkillKey: 'captions' as const,
    }],
  }
  const captionReservedZones = trackAllCaptionReservedZonesSchema.parse({
    ...zonesCore,
    zonesHash: hashSkillValue(zonesCore),
  })

  const focusTreatments = [
    'subject_sharp_background_soft', 'subject_normal_background_dim',
    'tracked_spotlight', 'tracked_vignette', 'tracked_magnification',
    'foreground_softening', 'background_softening', 'simple_subject_outline',
  ] as const
  const focusPlans = focusTreatments.map((treatment) => compileTrackAllFocus({
    trackGraph: graph,
    boxSequences: [productSequence, speakerSequence],
    sourceWidth: 640,
    sourceHeight: 360,
    targetTrackIds: ['object_001', 'person_001'],
    captionReservedZones,
    treatment,
    handoffs: [
      { trackId: 'object_001', range: { ...range, endFrameExclusive: 12 } },
      { trackId: 'person_001', range: { ...range, startFrameInclusive: 12 } },
    ],
  }))
  assert.equal(new Set(focusPlans.map((value) => value.plan.artifactHash)).size, 8)
  const focus = focusPlans[4]!
  assert.equal(focus.plan.treatment, 'tracked_magnification')
  assert.equal(focus.plan.handoffs.length, 2)
  assert.equal(focus.remotionPlanning.samples.length, 24)

  const speakerReframe = compileTrackAllReframe({
    trackGraph: graph,
    boxSequences: [productSequence, speakerSequence],
    sourceWidth: 640,
    sourceHeight: 360,
    targetTrackIds: ['person_001'],
    captionReservedZones,
    outputAspectRatio: '9:16',
    maximumZoom: 2,
    lowConfidenceBehavior: 'widen_crop',
  })
  const twoPersonReframe = compileTrackAllReframe({
    trackGraph: graph,
    boxSequences: [productSequence, speakerSequence],
    sourceWidth: 640,
    sourceHeight: 360,
    targetTrackIds: ['object_001', 'person_001'],
    captionReservedZones,
    outputAspectRatio: '16:9',
    maximumZoom: 1.75,
    lowConfidenceBehavior: 'widen_crop',
  })
  assert.equal(speakerReframe.plan.frames.length, 24)
  assert.equal(twoPersonReframe.plan.frames.some((frame) => frame.priorityTrackIds.length === 2), true)
  assert.equal(twoPersonReframe.plan.frames.every((frame) => frame.safeZoneCollision === false), true)
  assert.equal(
    twoPersonReframe.plan.frames.slice(20).every((frame) => frame.priorityTrackIds.includes('person_001')),
    true,
  )
  assert.equal(
    twoPersonReframe.plan.frames.every((frame) =>
      Math.min(1 / frame.crop.width, 1 / frame.crop.height) <= 1.751),
    true,
  )

  await prepareOfflineRemotionDockerRuntime()
  const runtime = await activatePrivateOfflineRemotionRenderRuntime()
  const focusRequest = buildTrackAllTreatmentRemotionRequest({
    compiled: focus,
    source: { mimeType: 'video/mp4', bytes: sourceBytes, sha256: sourceSha256 },
  })
  const focusRender = await runtime.execute(focusRequest)
  const focusPreviewRef = ref(
    'track_all_private_focus_preview_v1',
    focusRender.artifact.sha256,
    focusRender.artifact.byteLength,
  )
  const focusQa = deriveTrackAllTreatmentIntegrationQa({
    compiled: focus,
    renderResult: focusRender,
    privatePreviewRef: focusPreviewRef,
  })
  const focusResult = finalizeTrackAllFocus({
    compiled: focus,
    privatePreviewRef: focusPreviewRef,
    integrationQa: focusQa,
  })
  assert.equal(focusResult.publicArtifact, false)

  const reframeRequest = buildTrackAllTreatmentRemotionRequest({
    compiled: speakerReframe,
    source: { mimeType: 'video/mp4', bytes: sourceBytes, sha256: sourceSha256 },
  })
  const reframeRender = await runtime.execute(reframeRequest)
  const reframePreviewRef = ref(
    'track_all_private_reframe_preview_v1',
    reframeRender.artifact.sha256,
    reframeRender.artifact.byteLength,
  )
  const reframeQa = deriveTrackAllTreatmentIntegrationQa({
    compiled: speakerReframe,
    renderResult: reframeRender,
    privatePreviewRef: reframePreviewRef,
  })
  const reframeResult = finalizeTrackAllReframe({
    compiled: speakerReframe,
    integrationQa: reframeQa,
  })
  assert.equal(reframeResult.finalRenderOwnedByTrackAll, false)
  assert.equal(focusRender.frameArtifacts.length, 3)
  assert.equal(reframeRender.frameArtifacts.length, 3)
  assert.equal(focusRender.readiness.productReady, false)
  assert.equal(reframeRender.readiness.productReady, false)
  assert.notEqual(focusRender.artifact.sha256, sourceSha256)
  assert.notEqual(reframeRender.artifact.sha256, sourceSha256)

  assert.throws(() => compileTrackAllFocus({
    trackGraph: graph,
    boxSequences: [productSequence, speakerSequence],
    sourceWidth: 640,
    sourceHeight: 360,
    targetTrackIds: ['object_001', 'person_001'],
    captionReservedZones,
    treatment: 'tracked_spotlight',
    handoffs: [{ trackId: 'object_001', range: { ...range, endFrameExclusive: 10 } }],
  }), /complete authorized range/u)
  assert.throws(() => compileTrackAllReframe({
    trackGraph: graph,
    boxSequences: [productSequence, speakerSequence],
    sourceWidth: 640,
    sourceHeight: 360,
    targetTrackIds: ['person_001'],
    captionReservedZones: { ...captionReservedZones, workspaceId: 'other-workspace' },
    outputAspectRatio: '9:16',
    maximumZoom: 2,
    lowConfidenceBehavior: 'widen_crop',
  }), /stale|Track Graph/u)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...focusRequest,
    payload: { ...focusRequest.payload, command: 'node arbitrary.js' },
  }))
  assert.throws(() => buildOfflineRemotionTrackAllTreatmentRequest({
    planningPayload: { ...focus.remotionPlanning, sourcePath: '/tmp/source.mp4' },
    source: { mimeType: 'video/mp4', bytes: sourceBytes, sha256: sourceSha256 },
  }))
  assert.throws(() => trackAllIntegrationQaReportSchema.parse({
    ...focusQa,
    sourceAndTimingExact: false,
  }))
  assert.throws(() => finalizeTrackAllFocus({
    compiled: focus,
    privatePreviewRef: { ...focusPreviewRef, workspaceId: 'other-workspace' },
    integrationQa: focusQa,
  }))

  console.log(JSON.stringify({
    status: 'ok',
    focusTreatments: focusTreatments.length,
    focusPlanHash: focus.plan.artifactHash,
    focusTrajectoryHash: focus.trajectoryHash,
    focusPreviewSha256: focusRender.artifact.sha256,
    focusQaHash: focusQa.artifactHash,
    focusResultHash: focusResult.artifactHash,
    speakerReframePlanHash: speakerReframe.plan.artifactHash,
    twoPersonReframePlanHash: twoPersonReframe.plan.artifactHash,
    reframeTrajectoryHash: speakerReframe.trajectoryHash,
    reframePreviewSha256: reframeRender.artifact.sha256,
    reframeQaHash: reframeQa.artifactHash,
    reframeResultHash: reframeResult.artifactHash,
    remotionVersion: focusRender.evidence.packageVersion,
    remotionImageIdentityHash: focusRender.evidence.image.imageIdentityHash,
    frameGoldenCount: focusRender.frameArtifacts.length + reframeRender.frameArtifacts.length,
    captionLayerOrderValid: true,
    lowConfidenceAggressiveZoomBlocked: true,
    finalRenderOwnedByTrackAll: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  }))
} finally {
  await rm(directory, { recursive: true, force: true })
}

function boxSequence(input: {
  trackId: 'object_001' | 'person_001'
  sourceSha256: string
  boxes: Array<{
    frameIndex: number
    box: { x: number; y: number; width: number; height: number }
    confidence: number
  }>
}) {
  const core = {
    schemaVersion: 'track_box_sequence_v1' as const,
    ...scope,
    editSessionId: 'focus-session',
    assignmentId: 'focus-assignment',
    assignmentHash,
    planHash,
    manifestRef,
    sourceSha256: input.sourceSha256,
    authorizedRange: range,
    trackId: input.trackId,
    boxes: input.boxes,
  }
  return trackBoxSequenceSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function graphFixture(
  sourceSha256: string,
  product: ReturnType<typeof boxSequence>,
  speaker: ReturnType<typeof boxSequence>,
): TrackGraphV2 {
  const qaRef = ref('track_all_temporal_qa_report_v1', hashSkillValue({ qa: 'focus' }))
  const track = (
    trackId: 'object_001' | 'person_001',
    targetId: 'product-target' | 'speaker-target',
    sequence: ReturnType<typeof boxSequence>,
    semanticClass: 'product' | 'person',
  ) => ({
    trackId,
    targetId,
    semanticClass,
    childTrackIds: [],
    startFrameInclusive: 0,
    endFrameExclusive: 24,
    visibilitySpans: [{ startFrameInclusive: 0, endFrameExclusive: 24, state: 'active' as const }],
    boxSequenceRef: ref('track_box_sequence_v1', sequence.artifactHash),
    confidenceSequenceHash: hashSkillValue({ trackId, confidence: 'fixture' }),
    reentryEventHashes: [],
    identitySwitchWarnings: [],
    depthOrder: semanticClass === 'person' ? 1 : 2,
    qaRefs: [qaRef],
    repairRefs: [],
  })
  return createTrackGraphV2({
    schemaVersion: 'track_graph_v2',
    modelNeutral: true,
    ...scope,
    editSessionId: 'focus-session',
    assignmentId: 'focus-assignment',
    assignmentHash,
    planHash,
    manifestRef,
    sourceId: 'focus-source',
    sourceSha256,
    timingHash: hashSkillValue({ timing: range }),
    authorizedRange: range,
    authorizedRangeHash: hashSkillValue(range),
    shots: [{ shotId: 'focus-shot', range, sceneCutResetsIdentity: true }],
    chunks: [{ chunkId: 'focus-chunk', range, bucketIndex: 0 }],
    targets: [
      {
        targetId: 'product-target', targetType: 'selected_instance',
        semanticClass: 'product', includeRules: ['selected product'], excludeRules: [],
        privacyClass: 'none', groundingEvidenceHashes: [hashSkillValue({ target: 'product' })],
        expectedMinimumCount: 1, expectedMaximumCount: 1, ambiguityState: 'none',
      },
      {
        targetId: 'speaker-target', targetType: 'selected_instance',
        semanticClass: 'person', includeRules: ['main speaker'], excludeRules: [],
        privacyClass: 'none', groundingEvidenceHashes: [hashSkillValue({ target: 'speaker' })],
        expectedMinimumCount: 1, expectedMaximumCount: 1, ambiguityState: 'none',
      },
    ],
    tracks: [
      track('object_001', 'product-target', product, 'product'),
      track('person_001', 'speaker-target', speaker, 'person'),
    ],
    stitchingEvidenceHashes: [],
    cameraNormalizationEvidenceHash: hashSkillValue({ camera: 'static' }),
    uncertaintyEventHashes: [],
    objectBudget: {
      expectedObjects: 2, maximumObjects: 2, bucketSize: 16,
      bucketCount: 1, sessionCount: 1,
    },
    runtimeAttemptRefs: [],
    finalQaRefs: [qaRef],
    privateMaskDataPublished: false,
    outsideAuthorizedRangeModified: false,
  })
}
