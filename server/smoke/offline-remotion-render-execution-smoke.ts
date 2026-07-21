import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution/offline-media-binary-runtime'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import {
  OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT,
  activatePrivateOfflineRemotionRenderRuntime,
  openPrivateOfflineRemotionRenderRuntime,
  readPersistedOfflineRemotionRenderRuntimeAuthority,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import {
  buildOfflineRemotionFinalCompositionRequest,
  buildOfflineRemotionMotionStudioAnimaticRequest,
  buildOfflineRemotionMotionStudioLayeredRequest,
  buildOfflineRemotionMotionStudioRouteDrawRequest,
  isFinalCompositionPayload,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'

const request = {
  schemaVersion: 'offline-remotion-render-execution-v1', toolId: 'remotion',
  operationId: 'tool.remotion.render_approved_composition.v1',
  payload: { width: 640, height: 360, fps: 24, durationFrames: 24, frameTemplateId: 'approved_full_panel_v1', panelBackground: '#F7F8FA', accentColor: '#4F46E5', title: 'Approved ReEditPro composition', subtitle: 'Deterministic private render evidence', caption: 'Frame-accurate composition proof' },
} as const

for (const invalid of [
  { ...request, command: 'whoami' },
  { ...request, payload: { ...request.payload, sourceUrl: 'https://example.test/source.mp4' } },
  { ...request, payload: { ...request.payload, title: '/etc/passwd' } },
  { ...request, payload: { ...request.payload, width: 1920, height: 1080 } },
  { ...request, payload: { ...request.payload, durationFrames: 9000 } },
]) assert.throws(() => validateOfflineRemotionRenderRequest(invalid), /unsupported|unsafe|approved|bounds/)

const prepared = await prepareOfflineRemotionDockerRuntime()
assert.match(OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE, /^[a-f0-9]{16}$/u)
assert.equal(
  prepared.imageTag,
  `reeditpro-offline-remotion-render-execution:canonical-private-local-v1-${OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE}`,
)
assert.equal(
  OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT,
  `/tmp/reeditpro-canonical-private-offline-remotion-render-execution-${OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE}`,
)
const activated = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(activated.image.imageId, prepared.imageId)
assert.equal(
  activated.image.labels['com.reeditpro.runner.source-tree.sha256'],
  activated.image.sourceTreeSha256,
)
assert.match(
  activated.image.sourceHashes['remotion-cgroup-resource-observer.sh'] ?? '',
  /^[a-f0-9]{64}$/u,
)
const authority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
assert.ok(authority)
assert.equal(authority.readiness.canonicalDispatchMayReference, true)
assert.equal(authority.readiness.finalExportReady, false)
const reopened = await openPrivateOfflineRemotionRenderRuntime()
assert.equal(reopened.image.imageIdentityHash, activated.image.imageIdentityHash)
const result = await reopened.execute(request)
assert.equal(result.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
assert.equal(result.artifact.width, 640); assert.equal(result.artifact.height, 360)
assert.equal(result.artifact.fps, 24); assert.equal(result.artifact.durationFrames, 24)
assert.equal(result.evidence.packageVersion, '4.0.487')
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.evidence.confinement.capDropAll, true)
assert.equal(result.evidence.confinement.noNewPrivileges, true)
assert.equal(result.evidence.confinement.user, '10001:10001')
assert.equal(
  result.evidence.confinement.resourceObserverEntrypoint,
  '/usr/local/bin/reeditpro-remotion-cgroup-resource-observer',
)
assert.equal(result.evidence.confinement.cgroupV2ResourceObservationRequired, true)
assert.equal(
  result.evidence.resourceObservation.observerKind,
  'remotion_container_cgroup_v2_v1',
)
assert.equal(
  result.evidence.resourceObservation.measurementAgentVersion,
  'embedded_remotion_cgroup_v2_observer_v1',
)
assert.equal(
  result.evidence.resourceObservation.measurementAgentDigest,
  activated.image.sourceHashes['remotion-cgroup-resource-observer.sh'],
)
assert.ok(
  result.evidence.resourceObservation.finish.cpuUsageNanoseconds >
    result.evidence.resourceObservation.start.cpuUsageNanoseconds,
)
assert.ok(result.evidence.resourceObservation.finish.memoryPeakBytes > 0)
assert.equal(
  result.attestation.resourceObservationHash,
  result.evidence.resourceObservation.observationHash,
)
assert.equal(result.readiness.productReady, false)

const motionStudioSceneRequest = validateOfflineRemotionRenderRequest({
  schemaVersion: 'offline-remotion-render-execution-v1',
  toolId: 'remotion',
  operationId: 'tool.remotion.render_approved_composition.v1',
  payload: {
    compositionProfileId: 'motion_studio_scene_preview_v1',
    width: 640, height: 360, fps: 24, durationFrames: 24,
    sceneId: 'motion-studio-scene-runtime-proof',
    sceneStartFrame: 0, sceneEndFrame: 24,
    semanticPurpose: 'Prove one exact private Storytelling scene preview.',
    productionMode: 'native_graphics_first', layerType: 'text',
    panelBackground: '#0F172A', accentColor: '#FF4D8D',
  },
})
const motionStudioSceneResult = await reopened.execute(motionStudioSceneRequest)
assert.equal(motionStudioSceneResult.frameArtifacts.length, 3)
assert.equal(
  motionStudioSceneResult.evidence.semanticEvidence.motionStudioScenePreviewCompositionExecuted,
  true,
)
assert.equal(motionStudioSceneResult.evidence.semanticEvidence.frameGoldenArtifactsProduced, true)

const layeredSubjectBytes = createPngFixture({
  width: 128,
  height: 128,
  color: '0xE8528A',
  pixelFormat: 'rgba',
})
const layeredPurpose = 'Prove exact private layered Storytelling depth and safe caption order.'
const motionStudioLayeredRequest = buildOfflineRemotionMotionStudioLayeredRequest({
  planningPayload: {
    compositionProfileId: 'motion_studio_native_layered_scene_v1',
    width: 640, height: 360, fps: 24, durationFrames: 24,
    sceneId: 'motion-studio-layered-runtime-proof',
    sceneStartFrame: 0, sceneEndFrame: 24,
    semanticPurpose: layeredPurpose,
    headline: layeredPurpose,
    caption: `Review · ${layeredPurpose}`,
    layerManifestDigest: '9'.repeat(64),
    depthModel: 'semantic_planes_v1',
    planes: [
      { planeId: 'background-plane', role: 'background', zIndex: 0, sourceKind: 'remotion_native', motionToken: 'ambient_drift' },
      { planeId: 'headline-plane', role: 'headline', zIndex: 10, sourceKind: 'remotion_native', motionToken: 'headline_reveal' },
      { planeId: 'subject-plane', role: 'subject', zIndex: 20, sourceKind: 'approved_cutout_slot', motionToken: 'subject_parallax' },
      { planeId: 'caption-plane', role: 'caption', zIndex: 30, sourceKind: 'remotion_native', motionToken: 'caption_hold' },
    ],
    panelBackground: '#0F172A', panelHighlight: '#16213E',
    headlineColor: '#E0F2FE', accentColor: '#FF4D8D', captionColor: '#F8FAFC',
    horizontalSafePercent: 8, verticalSafePercent: 8, captionBottomPercent: 9,
    captionAboveMask: true, contactObjectPresent: false, maskRisk: 'low_fixture_only',
  },
  subject: {
    mimeType: 'image/png', bytes: layeredSubjectBytes,
    sha256: createHash('sha256').update(layeredSubjectBytes).digest('hex'),
  },
})
const motionStudioLayeredResult = await reopened.execute(motionStudioLayeredRequest)
assert.equal(motionStudioLayeredResult.frameArtifacts.length, 3)
assert.equal(
  motionStudioLayeredResult.evidence.semanticEvidence.motionStudioNativeLayeredCompositionExecuted,
  true,
)
assert.equal(motionStudioLayeredResult.evidence.semanticEvidence.approvedSubjectCutoutBytesVerified, true)

const narrationBytes = createPcmWavSilence({ durationFrames: 24, fps: 24 })
const motionStudioAnimaticRequest = buildOfflineRemotionMotionStudioAnimaticRequest({
  planningPayload: {
    compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
    width: 640, height: 360, fps: 24, durationFrames: 24,
    scenes: [{
      order: 0,
      sceneId: 'motion-studio-animatic-runtime-proof',
      startFrame: 0,
      endFrame: 24,
      title: 'Approved prepared-script scene',
      visualDescription: 'A private review-only animatic scene bound to the exact narration artifact.',
    }],
    panelBackground: '#0F172A', accentColor: '#FF4D8D',
  },
  narration: {
    mimeType: 'audio/wav', bytes: narrationBytes,
    sha256: createHash('sha256').update(narrationBytes).digest('hex'),
  },
})
const motionStudioAnimaticResult = await reopened.execute(motionStudioAnimaticRequest)
assert.equal(motionStudioAnimaticResult.frameArtifacts.length, 3)
assert.equal(
  motionStudioAnimaticResult.evidence.semanticEvidence.motionStudioPreparedAnimaticCompositionExecuted,
  true,
)
assert.equal(motionStudioAnimaticResult.evidence.semanticEvidence.approvedNarrationBytesVerified, true)

const routeKeyframeBytes = createPngFixture({
  width: 1280,
  height: 720,
  color: '0x081426',
  pixelFormat: 'rgb24',
})
const motionStudioRouteRequest = buildOfflineRemotionMotionStudioRouteDrawRequest({
  planningPayload: {
    compositionProfileId: 'motion_studio_deterministic_route_draw_v1',
    width: 1280, height: 720, fps: 30, durationFrames: 180,
    sceneId: 'motion-studio-route-runtime-proof',
    sceneStartFrame: 0, sceneEndFrame: 180,
    semanticPurpose: 'Reveal one approved abstract route across three exact waypoints.',
    routePresetId: 'abstract_three_district_route_v1',
    routeRevealStartFrame: 18, routeRevealEndFrame: 140,
    waypointFrames: [18, 82, 140],
    routeCoverColor: '#081426', routeColor: '#FFB23D', routeGlowColor: '#FF7A1A',
  },
  keyframe: {
    mimeType: 'image/png', bytes: routeKeyframeBytes,
    sha256: createHash('sha256').update(routeKeyframeBytes).digest('hex'),
  },
})
const motionStudioRouteResult = await reopened.execute(motionStudioRouteRequest)
assert.equal(motionStudioRouteResult.frameArtifacts.length, 5)
assert.equal(
  motionStudioRouteResult.evidence.semanticEvidence.motionStudioDeterministicRouteDrawCompositionExecuted,
  true,
)
assert.equal(motionStudioRouteResult.evidence.semanticEvidence.approvedKeyframeBytesVerified, true)
assert.equal(motionStudioRouteResult.evidence.semanticEvidence.providerVideoNotRequired, true)
assert.equal(
  motionStudioRouteResult.evidence.resourceObservation.observerKind,
  'remotion_container_cgroup_v2_v1',
)
assert.ok(
  motionStudioRouteResult.evidence.resourceObservation.finish.cpuUsageNanoseconds >
    motionStudioRouteResult.evidence.resourceObservation.start.cpuUsageNanoseconds,
)

const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
const probe = await mediaRuntime.execute({
  schemaVersion: 'offline-media-binary-execution-v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  payload: {
    inspectionProfileId: 'final_export_v1', countFrames: true,
    verifyDurationAndSync: true, emitMachineJsonOnly: true,
    mimeType: 'video/mp4', sourceByteLength: result.artifact.byteLength,
    sourceSha256: result.artifact.sha256,
    sourceBytesBase64: result.artifact.bytes.toString('base64'),
  },
})
assert.ok('resultJson' in probe)
const probeDocument = probe.resultJson.document
const streams = probeDocument.streams as Array<Record<string, unknown>>
const video = streams.find((stream) => stream.codecType === 'video')
assert.ok(video)
assert.equal(video.codecName, 'h264')
assert.equal(video.codecProfile, 'High')
assert.equal(typeof video.codecLevel, 'number')
assert.equal(video.width, 640); assert.equal(video.height, 360)
assert.equal(video.fps, 24); assert.equal(video.readFrameCount, 24)
assert.equal(video.pixelFormat, 'yuv420p'); assert.equal(video.colorSpace, 'bt709')
assert.equal(video.colorTransfer, 'bt709'); assert.equal(video.colorPrimaries, 'bt709')
assert.equal(video.colorRange, 'tv')
assert.equal(probeDocument.durationSeconds, 1)
assert.equal(result.evidence.semanticEvidence.fixedBt709H264VuiParametersApplied, true)

const fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-remotion-final-composition-'))
try {
  const sourcePath = join(fixtureRoot, 'source-with-audio.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const sourceBytes = await readFile(sourcePath)
  const libassRuntime = await activatePrivateOfflineLibassCaptionRuntime()
  const overlay = await libassRuntime.execute({
    schemaVersion: 'offline-libass-caption-execution-v1', toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
      width: 640, height: 360, timestampMs: 1000, fontSize: 42, marginV: 48,
      alignment: 2, caption: 'Approved source caption final',
    },
  })
  const secondOverlay = await libassRuntime.execute({
    schemaVersion: 'offline-libass-caption-execution-v1', toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
      width: 640, height: 360, timestampMs: 1000, fontSize: 42, marginV: 48,
      alignment: 2, caption: 'Approved second timed caption',
    },
  })
  const finalRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_caption_final_v1', width: 640, height: 360,
      fps: 24, durationFrames: 24, sourceStartFrame: 12, sourceEndFrameExclusive: 36,
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'preserve_source', captionOverlayPolicy: 'approved_full_frame_rgba',
    },
    source: {
      mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    },
    captionOverlay: {
      mimeType: 'image/png', bytes: overlay.imageArtifact.bytes,
      sha256: overlay.imageArtifact.sha256,
    },
  })
  assert.ok('sourceBytesBase64' in finalRequest.payload)
  for (const invalidFinal of [
    { ...finalRequest, sourceUrl: 'https://example.test/source.mp4' },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceBytesBase64: `${finalRequest.payload.sourceBytesBase64}A` } },
    { ...finalRequest, payload: { ...finalRequest.payload, captionOverlaySha256: 'f'.repeat(64) } },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceFit: 'cover' } },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceStartFrame: 11 } },
  ]) assert.throws(() => validateOfflineRemotionRenderRequest(invalidFinal), /unsupported|commitment|policy|bytes/)
  const finalResult = await reopened.execute(finalRequest)
  assert.equal(finalResult.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(finalResult.artifact.width, 640); assert.equal(finalResult.artifact.height, 360)
  assert.equal(finalResult.artifact.fps, 24); assert.equal(finalResult.artifact.durationFrames, 24)
  assert.equal(finalResult.evidence.semanticEvidence.approvedSourceBytesVerified, true)
  assert.equal(finalResult.evidence.semanticEvidence.approvedCaptionOverlayBytesVerified, true)
  assert.equal(finalResult.evidence.semanticEvidence.approvedSourceTrimFramesApplied, true)
  assert.equal(finalResult.evidence.semanticEvidence.sourceAudioPreservationRequested, true)
  assert.equal(finalResult.evidence.semanticEvidence.finalCompositionProfileExecuted, true)
  const finalProbe = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1', countFrames: true,
      verifyDurationAndSync: true, emitMachineJsonOnly: true,
      mimeType: 'video/mp4', sourceByteLength: finalResult.artifact.byteLength,
      sourceSha256: finalResult.artifact.sha256,
      sourceBytesBase64: finalResult.artifact.bytes.toString('base64'),
    },
  })
  assert.ok('resultJson' in finalProbe)
  const finalStreams = finalProbe.resultJson.document.streams as Array<Record<string, unknown>>
  const finalVideo = finalStreams.find((stream) => stream.codecType === 'video')
  const finalAudio = finalStreams.find((stream) => stream.codecType === 'audio')
  assert.equal(finalVideo?.codecName, 'h264')
  assert.equal(finalVideo?.pixelFormat, 'yuv420p')
  assert.equal(finalVideo?.colorSpace, 'bt709')
  assert.equal(finalVideo?.colorTransfer, 'bt709')
  assert.equal(finalVideo?.colorPrimaries, 'bt709')
  assert.equal(finalVideo?.colorRange, 'tv')
  assert.equal(finalVideo?.readFrameCount, 24)
  assert.equal(finalAudio?.codecName, 'aac')
  const finalDurationSeconds = Number(finalProbe.resultJson.document.durationSeconds)
  assert.ok(finalDurationSeconds >= 1 && finalDurationSeconds <= 1 + (2 / 24))

  const approvedHardCutTransitions = [{
    transitionTimingItemId: 'approved-hard-cut-1',
    refinedTransitionTimingItemId: 'approved-refined-hard-cut-1',
    fromSegmentId: 'segment-1',
    toSegmentId: 'segment-2',
    fromSourceSequenceItemId: 'approved-source-a',
    toSourceSequenceItemId: 'approved-source-b',
    boundaryFrame: 24,
  }]
  const sourceSequenceRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_sequence_caption_track_final_v1',
      width: 640, height: 360, fps: 24, durationFrames: 48,
      sourceSegments: [{
        sourceSequenceItemId: 'approved-source-a',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 0, timelineEndFrameExclusive: 24,
      }, {
        sourceSequenceItemId: 'approved-source-b',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 24, timelineEndFrameExclusive: 48,
      }],
      transitionPolicy: 'approved_hard_cuts_only',
      hardCutTransitions: approvedHardCutTransitions,
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'preserve_source_sequence',
      captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
      captionOverlayCues: [{
        outputKey: 'caption-overlay-1-png', startFrame: 0, endFrameExclusive: 24,
      }, {
        outputKey: 'caption-overlay-2-png', startFrame: 24, endFrameExclusive: 48,
      }],
    },
    sources: [{
      sourceSequenceItemId: 'approved-source-a', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }, {
      sourceSequenceItemId: 'approved-source-b', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }],
    captionOverlays: [{
      outputKey: 'caption-overlay-1-png', mimeType: 'image/png',
      bytes: overlay.imageArtifact.bytes, sha256: overlay.imageArtifact.sha256,
    }, {
      outputKey: 'caption-overlay-2-png', mimeType: 'image/png',
      bytes: secondOverlay.imageArtifact.bytes, sha256: secondOverlay.imageArtifact.sha256,
    }],
  })
  const sourceSequencePayload = sourceSequenceRequest.payload
  if (
    !('compositionProfileId' in sourceSequencePayload) ||
    sourceSequencePayload.compositionProfileId !== 'approved_source_sequence_caption_track_final_v1'
  ) throw new Error('Source-sequence smoke request compiled to the wrong profile.')
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      sourceSegments: sourceSequencePayload.sourceSegments.map((segment, index) =>
        index === 1 ? { ...segment, timelineStartFrame: 23 } : segment),
    },
  }), /contiguous|duration|sequence/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      hardCutTransitions: sourceSequencePayload.hardCutTransitions.map((transition) => ({
        ...transition,
        boundaryFrame: 23,
      })),
    },
  }), /hard cut|boundary/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      captionOverlayCues: sourceSequencePayload.captionOverlayCues.map((cue, index) =>
        index === 1 ? { ...cue, startFrame: 23 } : cue),
    },
  }), /ordered|non-overlapping|caption/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      captionOverlays: [...sourceSequencePayload.captionOverlays].reverse(),
    },
  }), /order|caption/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      captionOverlays: sourceSequencePayload.captionOverlays.map((caption, index) =>
        index === 0 ? { ...caption, sourceUrl: 'https://example.test/caption.png' } : caption),
    },
  }), /unsupported/)
  const sourceSequenceResult = await reopened.execute(sourceSequenceRequest)
  assert.equal(sourceSequenceResult.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(sourceSequenceResult.artifact.durationFrames, 48)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedSourceSequenceBytesVerified, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedSourceSequenceTimelineApplied, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedHardCutTransitionAuthorityRead, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedHardCutTransitionsApplied, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedCaptionTrackTimingApplied, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.sourceAudioPreservationRequested, true)
  const sourceSequenceArtifactPath = join(fixtureRoot, 'source-sequence-caption-track.mp4')
  const firstCaptionFramePath = join(fixtureRoot, 'caption-track-frame-12.png')
  const secondCaptionFramePath = join(fixtureRoot, 'caption-track-frame-36.png')
  await writeFile(sourceSequenceArtifactPath, sourceSequenceResult.artifact.bytes)
  for (const [frame, outputPath] of [[12, firstCaptionFramePath], [36, secondCaptionFramePath]] as const) {
    const extracted = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-i', sourceSequenceArtifactPath,
      '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', outputPath,
    ], { encoding: 'utf8' })
    assert.equal(extracted.status, 0, extracted.stderr)
  }
  const firstCaptionFrame = await readFile(firstCaptionFramePath)
  const secondCaptionFrame = await readFile(secondCaptionFramePath)
  assert.notEqual(
    createHash('sha256').update(firstCaptionFrame).digest('hex'),
    createHash('sha256').update(secondCaptionFrame).digest('hex'),
    'Decoded frames from repeated source timing must reflect distinct approved caption artifacts.',
  )
  const sourceSequenceProbe = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1', countFrames: true,
      verifyDurationAndSync: true, emitMachineJsonOnly: true,
      mimeType: 'video/mp4', sourceByteLength: sourceSequenceResult.artifact.byteLength,
      sourceSha256: sourceSequenceResult.artifact.sha256,
      sourceBytesBase64: sourceSequenceResult.artifact.bytes.toString('base64'),
    },
  })
  assert.ok('resultJson' in sourceSequenceProbe)
  const sourceSequenceStreams = sourceSequenceProbe.resultJson.document.streams as Array<Record<string, unknown>>
  assert.equal(sourceSequenceStreams.find((stream) => stream.codecType === 'video')?.readFrameCount, 48)
  assert.equal(sourceSequenceStreams.find((stream) => stream.codecType === 'audio')?.codecName, 'aac')

  const voiceDelivery = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    payload: {
      recipeProfileId: 'approved_voice_delivery_wav_v1',
      timestampPolicy: 'normalize_from_zero', overwriteExistingArtifact: false,
      allowUnreviewedCodec: false, trimStartFrame: 0, trimEndFrameExclusive: 24,
      frameRate: 24, sampleRate: 48_000, channelMode: 'stereo', targetLufs: -14,
      truePeakDbtp: -1, loudnessRangeLufs: 7, highpassHz: 70,
      compressorPreset: 'gentle_voice_v1', mimeType: 'video/mp4',
      sourceByteLength: sourceBytes.byteLength,
      sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
      sourceBytesBase64: sourceBytes.toString('base64'),
    },
  })
  if (!('resultArtifact' in voiceDelivery) || voiceDelivery.resultArtifact.mimeType !== 'audio/wav') {
    throw new Error('Approved voice delivery returned the wrong artifact class.')
  }
  assert.equal(voiceDelivery.evidence.semanticEvidence.loudnessNormalizationApplied, true)
  assert.equal(voiceDelivery.evidence.semanticEvidence.truePeakLimiterApplied, true)
  const colorDelivery = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    payload: {
      recipeProfileId: 'approved_source_color_delivery_matroska_v1',
      timestampPolicy: 'normalize_from_zero', overwriteExistingArtifact: false,
      allowUnreviewedCodec: false, trimStartFrame: 0, trimEndFrameExclusive: 24,
      frameRate: 24, colorGradeStyle: 'clean_natural', intensity: 'balanced',
      approvedColorOperationIds: [
        'color-contrast-curve-1',
        'color-exposure-correction-1',
        'color-highlight-recovery-1',
        'color-qa-histogram-check-1',
        'color-saturation-1',
        'color-white-balance-1',
      ],
      approvedColorOperationKinds: [
        'contrast_curve',
        'exposure_correction',
        'highlight_recovery',
        'qa_histogram_check',
        'saturation',
        'white_balance',
      ],
      analysisProfileId: 'approved_three_frame_rgb_stats_v1',
      correctionProfileId: 'bounded_professional_source_color_v1',
      outputColorSpace: 'bt709', outputPixelFormat: 'yuv420p', preserveAudio: false,
      mimeType: 'video/mp4', sourceByteLength: sourceBytes.byteLength,
      sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
      sourceBytesBase64: sourceBytes.toString('base64'),
    },
  })
  if (
    !('resultArtifact' in colorDelivery) ||
    colorDelivery.resultArtifact.mimeType !== 'video/x-matroska'
  ) throw new Error('Approved source color delivery returned the wrong artifact class.')
  assert.equal(colorDelivery.resultArtifact.bytes.subarray(0, 4).toString('hex'), '1a45dfa3')
  assert.equal(colorDelivery.evidence.semanticEvidence.plannedLookApplied, true)
  assert.equal(colorDelivery.evidence.semanticEvidence.clippingProtectionVerified, true)
  assert.equal(colorDelivery.evidence.semanticEvidence.histogramQaPassed, true)
  const colorFinalRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_caption_final_v1',
      width: 640, height: 360, fps: 24, durationFrames: 24,
      sourceStartFrame: 0, sourceEndFrameExclusive: 24,
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'replace_with_approved_voice_tracks',
      sourceMediaPolicy: 'approved_professional_color_intermediate_v1',
      voiceTracks: [{
        sourceSequenceItemId: 'approved-source-color',
        outputKey: 'voice-delivery-color-wav', durationFrames: 24,
      }],
      captionOverlayPolicy: 'approved_full_frame_rgba',
    },
    source: {
      mimeType: 'video/x-matroska', bytes: colorDelivery.resultArtifact.bytes,
      sha256: colorDelivery.resultArtifact.sha256,
    },
    captionOverlay: {
      mimeType: 'image/png', bytes: overlay.imageArtifact.bytes,
      sha256: overlay.imageArtifact.sha256,
    },
    voiceTracks: [{
      sourceSequenceItemId: 'approved-source-color',
      outputKey: 'voice-delivery-color-wav', mimeType: 'audio/wav',
      bytes: voiceDelivery.resultArtifact.bytes,
      sha256: voiceDelivery.resultArtifact.sha256,
    }],
  })
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...colorFinalRequest,
    payload: {
      ...colorFinalRequest.payload,
      sourceMediaPolicy: undefined,
    },
  }), /unsupported|commitment|policy/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...colorFinalRequest,
    payload: {
      ...colorFinalRequest.payload,
      sourceMimeType: 'video/mp4',
    },
  }), /commitment|content/)
  const colorFinalResult = await reopened.execute(colorFinalRequest)
  assert.equal(colorFinalResult.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(colorFinalResult.artifact.durationFrames, 24)
  assert.equal(colorFinalResult.evidence.semanticEvidence.approvedSourceBytesVerified, true)
  assert.equal(colorFinalResult.evidence.semanticEvidence.approvedVoiceTrackReplacementRequested, true)
  const colorFinalReplay = await reopened.execute(colorFinalRequest)
  assert.equal(colorFinalReplay.artifact.sha256, colorFinalResult.artifact.sha256)
  const replacementRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_sequence_caption_track_final_v1',
      width: 640, height: 360, fps: 24, durationFrames: 48,
      sourceSegments: [{
        sourceSequenceItemId: 'approved-source-a',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 0, timelineEndFrameExclusive: 24,
      }, {
        sourceSequenceItemId: 'approved-source-b',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 24, timelineEndFrameExclusive: 48,
      }],
      transitionPolicy: 'approved_hard_cuts_only',
      hardCutTransitions: approvedHardCutTransitions,
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'replace_with_approved_voice_tracks',
      voiceTracks: [{
        sourceSequenceItemId: 'approved-source-a',
        outputKey: 'voice-delivery-1-wav', durationFrames: 24,
      }, {
        sourceSequenceItemId: 'approved-source-b',
        outputKey: 'voice-delivery-2-wav', durationFrames: 24,
      }],
      captionOverlayPolicy: 'approved_timed_full_frame_rgba_track',
      captionOverlayCues: [{
        outputKey: 'caption-overlay-1-png', startFrame: 0, endFrameExclusive: 24,
      }, {
        outputKey: 'caption-overlay-2-png', startFrame: 24, endFrameExclusive: 48,
      }],
    },
    sources: [{
      sourceSequenceItemId: 'approved-source-a', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }, {
      sourceSequenceItemId: 'approved-source-b', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }],
    captionOverlays: [{
      outputKey: 'caption-overlay-1-png', mimeType: 'image/png',
      bytes: overlay.imageArtifact.bytes, sha256: overlay.imageArtifact.sha256,
    }, {
      outputKey: 'caption-overlay-2-png', mimeType: 'image/png',
      bytes: secondOverlay.imageArtifact.bytes, sha256: secondOverlay.imageArtifact.sha256,
    }],
    voiceTracks: [{
      sourceSequenceItemId: 'approved-source-a', outputKey: 'voice-delivery-1-wav',
      mimeType: 'audio/wav', bytes: voiceDelivery.resultArtifact.bytes,
      sha256: voiceDelivery.resultArtifact.sha256,
    }, {
      sourceSequenceItemId: 'approved-source-b', outputKey: 'voice-delivery-2-wav',
      mimeType: 'audio/wav', bytes: voiceDelivery.resultArtifact.bytes,
      sha256: voiceDelivery.resultArtifact.sha256,
    }],
  })
  const replacementPayload = replacementRequest.payload
  if (
    !isFinalCompositionPayload(replacementPayload) ||
    replacementPayload.audioPolicy !== 'replace_with_approved_voice_tracks'
  ) throw new Error('Voice replacement request compiled to the wrong profile.')
  const committedVoiceTracks = replacementPayload.voiceTracks
  if (!committedVoiceTracks) throw new Error('Voice replacement commitments are missing.')
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...replacementRequest,
    payload: {
      ...replacementPayload,
      voiceTracks: [...committedVoiceTracks].reverse(),
    },
  }), /voice|order|identity/)
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...replacementRequest,
    payload: {
      ...replacementPayload,
      voiceTracks: committedVoiceTracks.map((track, index) =>
        index === 0 ? { ...track, sha256: 'f'.repeat(64) } : track),
    },
  }), /voice|bytes|commitment/)
  const replacementResult = await reopened.execute(replacementRequest)
  assert.equal(replacementResult.evidence.semanticEvidence.approvedVoiceTrackBytesVerified, true)
  assert.equal(replacementResult.evidence.semanticEvidence.approvedVoiceTrackReplacementRequested, true)
  assert.equal(replacementResult.evidence.semanticEvidence.approvedVoiceTrackTimelineApplied, true)
  assert.equal(replacementResult.evidence.semanticEvidence.sourceAudioPreservationRequested, undefined)
  const replacementReplay = await reopened.execute(replacementRequest)
  assert.equal(replacementReplay.artifact.sha256, replacementResult.artifact.sha256)
  assert.equal(
    replacementReplay.evidence.requestEnvelopeSha256,
    replacementResult.evidence.requestEnvelopeSha256,
  )
  const replacementArtifactPath = join(fixtureRoot, 'source-sequence-voice-replacement.mp4')
  await writeFile(replacementArtifactPath, replacementResult.artifact.bytes)
  const preservedPcm = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', sourceSequenceArtifactPath,
    '-map', '0:a:0', '-f', 's16le', '-ac', '2', '-ar', '48000', 'pipe:1',
  ], { maxBuffer: 4 * 1024 * 1024 })
  const replacementPcm = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', replacementArtifactPath,
    '-map', '0:a:0', '-f', 's16le', '-ac', '2', '-ar', '48000', 'pipe:1',
  ], { maxBuffer: 4 * 1024 * 1024 })
  assert.equal(preservedPcm.status, 0, preservedPcm.stderr.toString())
  assert.equal(replacementPcm.status, 0, replacementPcm.stderr.toString())
  assert.notEqual(
    createHash('sha256').update(preservedPcm.stdout).digest('hex'),
    createHash('sha256').update(replacementPcm.stdout).digest('hex'),
    'Decoded final audio must prove that approved voice tracks replaced source audio.',
  )
  const replacementProbe = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1', countFrames: true,
      verifyDurationAndSync: true, emitMachineJsonOnly: true,
      mimeType: 'video/mp4', sourceByteLength: replacementResult.artifact.byteLength,
      sourceSha256: replacementResult.artifact.sha256,
      sourceBytesBase64: replacementResult.artifact.bytes.toString('base64'),
    },
  })
  assert.ok('resultJson' in replacementProbe)
  const replacementStreams = replacementProbe.resultJson.document.streams as Array<Record<string, unknown>>
  assert.equal(replacementStreams.find((stream) => stream.codecType === 'video')?.readFrameCount, 48)
  assert.equal(replacementStreams.find((stream) => stream.codecType === 'audio')?.codecName, 'aac')
} finally {
  await rm(fixtureRoot, { recursive: true, force: true })
}

console.log(JSON.stringify({
  smoke: 'offline_remotion_render_execution', status: 'passed',
  proofs: ['exact_operation_payload_validated', 'caller_paths_urls_commands_and_extra_fields_rejected', 'checkout_derived_runtime_image_and_authority_namespace_isolated_from_parallel_worktrees', 'checksum_protected_runtime_authority_persisted_and_reopened', 'pinned_image_identity_verified', 'network_none_read_only_non_root_cap_drop_confinement_verified', 'embedded_cgroup_v2_cpu_and_peak_memory_observation_verified_before_container_cleanup', 'resource_observation_bound_to_pinned_measurement_agent_and_execution_attestation', 'actual_remotion_select_and_render_media_executed', 'motion_studio_scene_preview_and_three_frame_goldens_rendered', 'motion_studio_layered_preview_reads_exact_rgba_subject_and_preserves_four_plane_depth', 'motion_studio_prepared_script_animatic_reads_exact_wav_narration_and_renders_three_frame_goldens', 'motion_studio_deterministic_route_reads_exact_opaque_keyframe_and_renders_five_frame_goldens_with_observed_resources', 'mp4_hash_frame_timing_and_header_verified', 'independent_pinned_ffprobe_h264_frame_count_pixel_format_complete_bt709_vui_and_duration_qa_passed', 'server_injected_source_mp4_libass_png_and_pcm_wav_hash_commitments_verified', 'approved_nonzero_source_trim_frames_applied', 'actual_source_plus_caption_final_composition_rendered', 'ordered_two_source_sequence_and_timed_caption_track_final_composition_rendered', 'approved_hard_cut_authority_and_exact_source_boundary_applied', 'distinct_caption_track_frames_decoded_and_verified', 'source_sequence_frame_ranges_and_audio_preserved', 'approved_source_bound_professional_voice_tracks_replaced_source_audio', 'approved_lossless_vp9_matroska_professional_color_intermediate_composed_with_replacement_voice', 'professional_color_intermediate_policy_and_mime_tampering_rejected', 'professional_color_final_composition_replay_is_deterministic', 'voice_track_order_duration_hash_and_pcm_format_tampering_rejected', 'voice_replacement_replay_is_deterministic', 'final_aac_audio_decoded_and_independently_verified', 'final_composition_paths_urls_commands_and_tampered_bytes_rejected', 'product_beta_production_readiness_remains_false'],
  artifact: { sha256: result.artifact.sha256, byteLength: result.artifact.byteLength, width: result.artifact.width, height: result.artifact.height, fps: result.artifact.fps, durationFrames: result.artifact.durationFrames },
}, null, 2))

function createPcmWavSilence(input: { durationFrames: number; fps: number }): Buffer {
  const sampleRate = 48_000
  const channels = 2
  const bytesPerSample = 2
  const sampleCount = Math.round((input.durationFrames / input.fps) * sampleRate)
  const dataByteLength = sampleCount * channels * bytesPerSample
  const wav = Buffer.alloc(44 + dataByteLength)
  wav.write('RIFF', 0, 'ascii')
  wav.writeUInt32LE(36 + dataByteLength, 4)
  wav.write('WAVE', 8, 'ascii')
  wav.write('fmt ', 12, 'ascii')
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(channels, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
  wav.writeUInt16LE(channels * bytesPerSample, 32)
  wav.writeUInt16LE(bytesPerSample * 8, 34)
  wav.write('data', 36, 'ascii')
  wav.writeUInt32LE(dataByteLength, 40)
  return wav
}

function createPngFixture(input: {
  width: number
  height: number
  color: string
  pixelFormat: 'rgba' | 'rgb24'
}): Buffer {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', `color=c=${input.color}:s=${input.width}x${input.height}`,
    '-frames:v', '1', '-pix_fmt', input.pixelFormat,
    '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1',
  ], { maxBuffer: 16 * 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr.toString())
  assert.ok(generated.stdout instanceof Buffer)
  return generated.stdout
}
