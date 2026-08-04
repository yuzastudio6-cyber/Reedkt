import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import {
  createPrivateOfflinePythonStructuredExecutionRuntime,
  validateOfflinePythonStructuredExecutionRequest,
} from '../tool-execution/python-runner-execution'
import {
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfprobeExecutionRequest,
} from '../tool-execution/media-binary-execution'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all'
import {
  buildTrackAllApprovedProxyRequest,
  buildTrackAllFfprobeRequest,
  buildTrackAllOpenCvGeometryRequest,
  buildTrackAllSceneDetectionRequest,
  createTrackAllCameraMotionGraph,
  createTrackAllPlanarTrackGraph,
  normalizeTrackAllFfprobeSourceTruth,
  normalizeTrackAllShotBoundaryEvidence,
} from '../edit-skills/track-all/private/deterministic-geometry-runtime'

const execFileAsync = promisify(execFile)
const directory = await mkdtemp(join(tmpdir(), 'reeditpro-track-all-geometry-'))
const sourcePath = join(directory, 'source.mp4')
const proxyPath = join(directory, 'approved-range-proxy.mp4')

try {
  const ffmpegVersion = await execFileAsync('ffmpeg', ['-version'])
  const ffprobeVersion = await execFileAsync('ffprobe', ['-version'])
  assert.match(ffmpegVersion.stdout, /^ffmpeg version /u)
  assert.match(ffprobeVersion.stdout, /^ffprobe version /u)

  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=360x200:rate=24:duration=1',
    '-f', 'lavfi', '-i', 'smptebars=size=360x200:rate=24:duration=1',
    '-filter_complex',
    "[0:v]crop=320:180:x='min(40,n)':y=10[first];[1:v]crop=320:180:x=20:y=10[second];[first][second]concat=n=2:v=1:a=0[video]",
    '-map', '[video]', '-c:v', 'mpeg4', '-q:v', '3', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-y', sourcePath,
  ], { maxBuffer: 2 * 1024 * 1024 })
  const sourceBytes = await readFile(sourcePath)
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  assert.ok(sourceBytes.byteLength > 64 && sourceBytes.byteLength < 16 * 1024 * 1024)

  const ffprobe = await execFileAsync('ffprobe', [
    '-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=index,codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,duration:stream_side_data=rotation',
    '-show_entries', 'format=duration', '-of', 'json', sourcePath,
  ], { maxBuffer: 2 * 1024 * 1024 })
  const sourceTruth = normalizeTrackAllFfprobeSourceTruth({
    sourceSha256,
    document: JSON.parse(ffprobe.stdout) as unknown,
  })
  assert.equal(sourceTruth.width, 320)
  assert.equal(sourceTruth.height, 180)
  assert.equal(sourceTruth.frameCount, 48)
  assert.equal(sourceTruth.fps, 24)
  assert.equal(validateOfflineFfprobeExecutionRequest(buildTrackAllFfprobeRequest(sourceBytes)).payload.sourceSha256, sourceSha256)

  const range = { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 }
  const proxyRequest = validateOfflineFfmpegExecutionRequest(buildTrackAllApprovedProxyRequest({ sourceBytes, range }))
  assert.equal(proxyRequest.payload.recipeProfileId, 'approved_trim_transcode_v1')
  assert.equal(proxyRequest.payload.sourceSha256, sourceSha256)
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', sourcePath,
    '-vf', "select='gte(n,0)*lt(n,24)',setpts=N/(24*TB)",
    '-an', '-c:v', 'mpeg4', '-q:v', '3', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-y', proxyPath,
  ], { maxBuffer: 2 * 1024 * 1024 })
  const proxyProbe = await execFileAsync('ffprobe', [
    '-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=nb_read_frames', '-of', 'default=noprint_wrappers=1:nokey=1', proxyPath,
  ])
  assert.equal(Number(proxyProbe.stdout.trim()), 24)

  const runtime = await createPrivateOfflinePythonStructuredExecutionRuntime()
  const sceneResult = await runtime.execute(buildTrackAllSceneDetectionRequest({
    sourceBytes,
    contentThreshold: 18,
    minimumSceneFrames: 4,
    downscaleFactor: 1,
  }))
  const sceneDocument = sceneResult.resultJson.document as { scenes?: unknown[] }
  assert.ok(Array.isArray(sceneDocument.scenes) && sceneDocument.scenes.length >= 2)
  assert.equal(sceneResult.evidence.semanticEvidence.fixedContentDetectorExecuted, true)
  const shotEvidence = normalizeTrackAllShotBoundaryEvidence({
    sourceSha256,
    authorizedRange: { startFrameInclusive: 0, endFrameExclusive: 48, fps: 24 },
    document: sceneResult.resultJson.document,
  })
  assert.equal(shotEvidence.shots.length, 2)

  const cameraResult = await runtime.execute(buildTrackAllOpenCvGeometryRequest({
    sourceBytes,
    profile: 'track_all_camera_motion_v1',
    range,
    initializationFrameIndex: 5,
    maximumFeatures: 512,
    ransacReprojectionThreshold: 3,
  }))
  const planarResult = await runtime.execute(buildTrackAllOpenCvGeometryRequest({
    sourceBytes,
    profile: 'track_all_planar_homography_v1',
    range,
    initializationFrameIndex: 5,
    maximumFeatures: 512,
    ransacReprojectionThreshold: 3,
    planarCornersNormalized: [
      { x: 0.12, y: 0.12 }, { x: 0.88, y: 0.12 },
      { x: 0.88, y: 0.88 }, { x: 0.12, y: 0.88 },
    ],
  }))
  assert.equal(cameraResult.evidence.semanticEvidence.opticalFlowExecuted, true)
  assert.equal(cameraResult.evidence.semanticEvidence.homographyExecuted, false)
  assert.equal(planarResult.evidence.semanticEvidence.opticalFlowExecuted, true)
  assert.equal(planarResult.evidence.semanticEvidence.homographyExecuted, true)
  assert.equal(cameraResult.evidence.semanticEvidence.derivedPixelsEmitted, false)

  const lineage = {
    ownerUserId: 'geometry-user', workspaceId: 'geometry-workspace', projectId: 'geometry-project',
    editSessionId: 'geometry-session', assignmentId: 'geometry-assignment',
    assignmentHash: hashSkillValue({ assignment: 'geometry' }),
    planHash: hashSkillValue({ plan: 'geometry' }),
    manifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    sourceSha256,
    authorizedRange: range,
  }
  const cameraGraph = createTrackAllCameraMotionGraph({
    document: cameraResult.resultJson.document,
    lineage,
  })
  const planarGraph = createTrackAllPlanarTrackGraph({
    document: planarResult.resultJson.document,
    lineage,
    surfaceId: 'screen-surface-001',
    surfaceClass: 'phone_screen',
    coordinateInterpretation: 'world_relative',
  })
  assert.equal(cameraGraph.transforms.length, 24)
  assert.equal(planarGraph.frames.length, 24)
  assert.ok(planarGraph.frames.every((frame) => frame.frameIndex >= 0 && frame.frameIndex < 24))
  assert.ok(planarGraph.frames.some((frame) => frame.confidence > 0))

  assert.throws(() => validateOfflinePythonStructuredExecutionRequest({
    ...buildTrackAllOpenCvGeometryRequest({
      sourceBytes,
      profile: 'track_all_camera_motion_v1',
      range,
      initializationFrameIndex: 5,
    }),
    command: 'python arbitrary.py',
  }), /only its fixed fields|unsupported fields|invalid/iu)
  assert.throws(() => validateOfflinePythonStructuredExecutionRequest({
    ...buildTrackAllOpenCvGeometryRequest({
      sourceBytes,
      profile: 'track_all_planar_homography_v1',
      range,
      initializationFrameIndex: 5,
      planarCornersNormalized: [
        { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 },
      ],
    }),
    payload: {
      ...buildTrackAllOpenCvGeometryRequest({
        sourceBytes,
        profile: 'track_all_planar_homography_v1',
        range,
        initializationFrameIndex: 5,
        planarCornersNormalized: [
          { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 },
          { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 },
        ],
      }).payload,
      sourceUrl: 'https://example.invalid/source.mp4',
    },
  }), /only its fixed fields|unsupported fields|forbidden|invalid/iu)

  console.log(JSON.stringify({
    status: 'ok',
    ffmpegVersion: ffmpegVersion.stdout.split('\n')[0],
    ffprobeVersion: ffprobeVersion.stdout.split('\n')[0],
    sourceTruthHash: sourceTruth.technicalTruthHash,
    shotBoundaryEvidenceHash: shotEvidence.evidenceHash,
    sceneCount: sceneDocument.scenes.length,
    proxyFrameCount: 24,
    cameraTransformCount: cameraGraph.transforms.length,
    planarFrameCount: planarGraph.frames.length,
    cameraGraphHash: cameraGraph.artifactHash,
    planarGraphHash: planarGraph.artifactHash,
    opencvImageIdentityHash: runtime.image.imageIdentityHash,
    nonZeroInitializationFrame: 5,
    derivedPixelsEmitted: false,
    callerExecutableRejected: true,
  }))
} finally {
  await rm(directory, { recursive: true, force: true })
}
