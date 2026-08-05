import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import {
  clearLocalProjectMemoryForSmoke,
  createProjectService,
} from '../services/project-service'
import {
  clearPrivateUploadMediaAuthorityProcessStateForSmoke,
} from '../services/private-upload-media-authority-store'
import { createSourceMediaAuthorityService } from
  '../services/source-media-authority-service'
import { createUploadService } from '../services/upload-service'
import type { ServiceContext } from '../types'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution/offline-media-binary-runtime'
import {
  activatePrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../tool-execution/libass-caption-execution'
import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import {
  buildOfflineRemotionFinalCompositionRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import type {
  OfflineRemotionRenderResult,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-types'
import {
  CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE,
  CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE,
} from './captions-specialist-cap-14-smoke'

const fps = 24
const durationFrames = 96
const requestedFrames = [0, 23, 47, 71, 95] as const
const outputRoot = await mkdtemp(join(
  tmpdir(), 'reeditpro-caption-cap18-private-qualification-'))
const storageRoot = join(outputRoot, 'private-storage')

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: storageRoot,
  SIGNED_URL_TTL_SECONDS: '900',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'caption-cap18-runtime',
  auth: { userId: 'caption-cap18-owner', isMockUser: true },
}

const sourceProfiles = [{
  outputId: 'caption-cap18-output-wide',
  label: 'wide-documentary',
  width: 640,
  height: 360,
  aspectRatio: '16:9',
  frequency: 440,
  caption: 'IDEAS NEED ROOM',
  fontSize: 40,
  marginV: 44,
}, {
  outputId: 'caption-cap18-output-vertical',
  label: 'vertical-dynamic',
  width: 360,
  height: 640,
  aspectRatio: '9:16',
  frequency: 660,
  caption: 'MOVE',
  fontSize: 44,
  marginV: 70,
}, {
  outputId: 'caption-cap18-output-square',
  label: 'square-clean',
  width: 480,
  height: 480,
  aspectRatio: '1:1',
  frequency: 880,
  caption: 'STAY CLEAR',
  fontSize: 40,
  marginV: 58,
}] as const

try {
  const preparedRemotion = await prepareOfflineRemotionDockerRuntime()
  const remotion = await activatePrivateOfflineRemotionRenderRuntime()
  assert.equal(remotion.image.imageId, preparedRemotion.imageId)
  assert.equal(remotion.image.sourceTreeSha256,
    preparedRemotion.sourceTreeSha256)
  const preparedLibass = await prepareOfflineLibassDockerRuntime()
  const libass = await activatePrivateOfflineLibassCaptionRuntime()
  assert.equal(libass.image.imageIdentityHash,
    preparedLibass.imageIdentityHash)
  const mediaBinary = await activatePrivateOfflineMediaBinaryRuntime()

  const creativeFull = await remotion.execute(
    CAP_14_FULL_MOTION_REMOTION_REQUEST_FIXTURE)
  const creativeReduced = await remotion.execute(
    CAP_14_REDUCED_MOTION_REMOTION_REQUEST_FIXTURE)
  assert.equal(creativeFull.artifact.durationFrames, 360)
  assert.equal(creativeReduced.artifact.durationFrames, 360)

  const project = (await createProjectService(context).createProject({
    workspaceId: 'caption-cap18-workspace',
    name: 'Caption CAP-18 private qualification',
  })).project

  const sources = []
  for (const profile of sourceProfiles) {
    const path = join(outputRoot, `source-${profile.label}.mp4`)
    generateSourceVideo({
      path,
      width: profile.width,
      height: profile.height,
      frequency: profile.frequency,
    })
    const bytes = await readFile(path)
    const upload = await uploadAndFinalize({
      context,
      workspaceId: 'caption-cap18-workspace',
      projectId: project.id,
      uploadPurpose: 'source_media',
      fileName: `${profile.label}.mp4`,
      bytes,
    })
    sources.push({ profile, path, bytes, upload })
  }
  const reference = await uploadAndFinalize({
    context,
    workspaceId: 'caption-cap18-workspace',
    projectId: project.id,
    uploadPurpose: 'reference_media',
    fileName: 'caption-cap18-reference-video.mp4',
    bytes: sources[0]!.bytes,
  })

  const sourceAuthority = createSourceMediaAuthorityService(context)
  const sourceManifest = (await sourceAuthority.buildManifestCandidate({
    workspaceId: 'caption-cap18-workspace',
    projectId: project.id,
    uploadPurpose: 'source_media',
    orderedItems: sources.map(({ upload }, index) => ({
      sourceSequenceItemId: `caption-cap18-source-${index + 1}`,
      mediaAssetId: upload.mediaAsset.id,
      uploadedOrder: index + 1,
      checksumSha256: upload.checksumSha256,
      required: true,
    })),
  })).sourceBindingManifestCandidate
  const referenceManifest = (await sourceAuthority.buildManifestCandidate({
    workspaceId: 'caption-cap18-workspace',
    projectId: project.id,
    uploadPurpose: 'reference_media',
    orderedItems: [{
      sourceSequenceItemId: 'caption-cap18-reference-1',
      mediaAssetId: reference.mediaAsset.id,
      uploadedOrder: 1,
      checksumSha256: reference.checksumSha256,
      required: true,
    }],
  })).sourceBindingManifestCandidate
  assert.equal(sourceManifest.requiredBindingCount, 3)
  assert.equal(referenceManifest.requiredBindingCount, 1)
  assert.equal(sourceManifest.executionAuthorized, false)
  assert.equal(referenceManifest.executionAuthorized, false)
  assert(!JSON.stringify(sourceManifest).includes('objectPath'))
  assert(!JSON.stringify(referenceManifest).includes('bucketName'))

  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  const rereadUploadService = createUploadService({
    ...context,
    requestId: 'caption-cap18-runtime-reread',
  })
  for (const { upload } of sources) {
    const reread = await rereadUploadService.getFinalizedSourceMediaAsset(
      upload.mediaAsset.id, 'caption-cap18-workspace', project.id,
      'source_media')
    assert.equal(reread.mediaAsset.checksumSha256, upload.checksumSha256)
  }
  const referenceReread = await rereadUploadService.getFinalizedSourceMediaAsset(
    reference.mediaAsset.id, 'caption-cap18-workspace', project.id,
    'reference_media')
  assert.equal(referenceReread.mediaAsset.checksumSha256,
    reference.checksumSha256)

  const rendered: Array<{
    outputId: string
    label: string
    aspectRatio: string
    sourceMediaAssetId: string
    sourceSha256: string
    overlaySha256: string
    artifactPath: string
    framePaths: string[]
    contactSheetPath: string
    result: OfflineRemotionRenderResult
    replayMatched: boolean
  }> = []

  for (const { profile, bytes, upload } of sources) {
    const overlay = await libass.execute({
      schemaVersion: 'offline-libass-caption-execution-v1',
      toolId: 'libass',
      operationId: 'tool.libass.render_approved_caption_track.v1',
      payload: {
        captionProfileId: 'approved_ass_track_render_v1',
        fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
        collisionPolicy: 'fail_on_reserved_zone_collision',
        preserveSpeechTiming: true,
        width: profile.width,
        height: profile.height,
        timestampMs: 1_000,
        fontSize: profile.fontSize,
        marginV: profile.marginV,
        alignment: 2,
        caption: profile.caption,
      },
    })
    assert.equal(overlay.imageArtifact.width, profile.width)
    assert.equal(overlay.imageArtifact.height, profile.height)
    const request = buildOfflineRemotionFinalCompositionRequest({
      planningPayload: {
        compositionProfileId: 'approved_source_caption_final_v1',
        width: profile.width,
        height: profile.height,
        fps,
        durationFrames,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: durationFrames,
        sourceFit: 'contain',
        panelBackground: '#000000',
        audioPolicy: 'preserve_source',
        captionOverlayPolicy: 'approved_full_frame_rgba',
      },
      source: {
        mimeType: 'video/mp4',
        bytes,
        sha256: sha256(bytes),
      },
      captionOverlay: {
        mimeType: 'image/png',
        bytes: overlay.imageArtifact.bytes,
        sha256: overlay.imageArtifact.sha256,
      },
    })
    const result = await remotion.execute(request)
    assert.equal(result.artifact.width, profile.width)
    assert.equal(result.artifact.height, profile.height)
    assert.equal(result.artifact.fps, fps)
    assert.equal(result.artifact.durationFrames, durationFrames)
    assert.equal(
      result.evidence.semanticEvidence.approvedSourceBytesVerified, true)
    assert.equal(
      result.evidence.semanticEvidence.approvedCaptionOverlayBytesVerified,
      true)
    assert.equal(
      result.evidence.semanticEvidence.sourceAudioPreservationRequested, true)
    const probe = await mediaBinary.execute({
      schemaVersion: 'offline-media-binary-execution-v1',
      toolId: 'ffprobe',
      operationId: 'tool.ffprobe.inspect_approved_media.v1',
      payload: {
        inspectionProfileId: 'final_export_v1',
        countFrames: true,
        verifyDurationAndSync: true,
        emitMachineJsonOnly: true,
        mimeType: 'video/mp4',
        sourceByteLength: result.artifact.byteLength,
        sourceSha256: result.artifact.sha256,
        sourceBytesBase64: result.artifact.bytes.toString('base64'),
      },
    })
    assert('resultJson' in probe)
    const streams = probe.resultJson.document.streams as
      Array<Record<string, unknown>>
    const video = streams.find((stream) => stream.codecType === 'video')
    const audio = streams.find((stream) => stream.codecType === 'audio')
    assert.equal(video?.width, profile.width)
    assert.equal(video?.height, profile.height)
    assert.equal(video?.readFrameCount, durationFrames)
    assert.equal(video?.codecName, 'h264')
    assert.equal(video?.pixelFormat, 'yuv420p')
    assert.equal(video?.colorSpace, 'bt709')
    assert.equal(video?.colorTransfer, 'bt709')
    assert.equal(video?.colorPrimaries, 'bt709')
    assert.equal(audio?.codecName, 'aac')

    const artifactPath = join(outputRoot, `caption-${profile.label}.mp4`)
    await writeFile(artifactPath, result.artifact.bytes)
    const framePaths = await extractFrames({
      sourcePath: artifactPath,
      label: profile.label,
    })
    const contactSheetPath = join(
      outputRoot, `caption-${profile.label}-contact-sheet.png`)
    createContactSheet(framePaths, contactSheetPath)
    let replayMatched = false
    if (profile.outputId === 'caption-cap18-output-wide') {
      const replay = await remotion.execute(request)
      replayMatched = replay.artifact.sha256 === result.artifact.sha256
      assert(replayMatched)
    }
    rendered.push({
      outputId: profile.outputId,
      label: profile.label,
      aspectRatio: profile.aspectRatio,
      sourceMediaAssetId: upload.mediaAsset.id,
      sourceSha256: upload.checksumSha256,
      overlaySha256: overlay.imageArtifact.sha256,
      artifactPath,
      framePaths,
      contactSheetPath,
      result,
      replayMatched,
    })
  }

  const creativeOutputs = await writeCreativeOutput({
    outputRoot,
    label: 'creative-full',
    result: creativeFull,
  }).then(async (full) => [full, await writeCreativeOutput({
    outputRoot,
    label: 'creative-reduced',
    result: creativeReduced,
  })])

  const localInspectionIndex = {
    schemaVersion: 'caption-cap18-local-inspection-index-v1',
    outputRoot,
    sourceManifest: {
      schemaVersion: sourceManifest.schemaVersion,
      candidateHash: sourceManifest.candidateHash,
      authorityChecksumSha256: sourceManifest.authorityChecksumSha256,
      executionAuthorized: sourceManifest.executionAuthorized,
    },
    referenceManifest: {
      schemaVersion: referenceManifest.schemaVersion,
      candidateHash: referenceManifest.candidateHash,
      authorityChecksumSha256: referenceManifest.authorityChecksumSha256,
      executionAuthorized: referenceManifest.executionAuthorized,
    },
    outputs: rendered.map((item) => ({
      outputId: item.outputId,
      label: item.label,
      aspectRatio: item.aspectRatio,
      artifactPath: item.artifactPath,
      artifactSha256: item.result.artifact.sha256,
      artifactByteLength: item.result.artifact.byteLength,
      width: item.result.artifact.width,
      height: item.result.artifact.height,
      fps: item.result.artifact.fps,
      durationFrames: item.result.artifact.durationFrames,
      sourceMediaAssetId: item.sourceMediaAssetId,
      sourceSha256: item.sourceSha256,
      overlaySha256: item.overlaySha256,
      replayMatched: item.replayMatched,
      framePaths: item.framePaths,
      requestedFrames,
      contactSheetPath: item.contactSheetPath,
    })),
    creativeOutputs,
    directVisualInspectionCompleted: false,
    completePlaybackInspectionCompleted: false,
    providerOrModelCallMade: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const inspectionIndexPath = join(outputRoot, 'inspection-index.json')
  await writeFile(
    inspectionIndexPath, `${JSON.stringify(localInspectionIndex, null, 2)}\n`)

  console.log(JSON.stringify({
    status: 'actual_private_cap18_media_completed_pending_direct_inspection',
    milestone: 'CAP-18',
    outputRoot,
    inspectionIndexPath,
    remotionImageId: preparedRemotion.imageId,
    remotionSourceTreeSha256: preparedRemotion.sourceTreeSha256,
    sourceManifestCandidateHash: sourceManifest.candidateHash,
    referenceManifestCandidateHash: referenceManifest.candidateHash,
    outputs: localInspectionIndex.outputs,
    creativeOutputs,
    actualSourceFileBytesProcessed: true,
    actualCanonicalUploadAndRereadExecuted: true,
    actualLibassExecutionCompleted: true,
    actualRemotionFinalCompositionCompleted: true,
    actualPinnedFfprobeQaCompleted: true,
    directVisualInspectionCompleted: false,
    completePlaybackInspectionCompleted: false,
    providerOrModelCallMade: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }, null, 2))
} finally {
  clearPrivateUploadMediaAuthorityProcessStateForSmoke()
  clearLocalProjectMemoryForSmoke()
}

function generateSourceVideo(input: {
  path: string
  width: number
  height: number
  frequency: number
}): void {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i',
    `testsrc2=size=${input.width}x${input.height}:rate=${fps}`,
    '-f', 'lavfi', '-i',
    `sine=frequency=${input.frequency}:sample_rate=48000:duration=4`,
    '-frames:v', String(durationFrames),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '96k', '-shortest',
    '-movflags', '+faststart', input.path,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
}

async function extractFrames(input: {
  sourcePath: string
  label: string
}): Promise<string[]> {
  const framePaths: string[] = []
  for (const frame of requestedFrames) {
    const path = join(outputRoot,
      `${input.label}-frame-${String(frame).padStart(3, '0')}.png`)
    const extracted = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', input.sourcePath,
      '-vf', `select=eq(n\\,${frame})`, '-fps_mode', 'passthrough',
      '-frames:v', '1', path,
    ], { encoding: 'utf8' })
    assert.equal(extracted.status, 0, extracted.stderr)
    framePaths.push(path)
  }
  return framePaths
}

function createContactSheet(framePaths: string[], outputPath: string): void {
  const inputs = framePaths.flatMap((path) => ['-i', path])
  const created = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', ...inputs,
    '-filter_complex', `hstack=inputs=${framePaths.length}`,
    '-frames:v', '1', outputPath,
  ], { encoding: 'utf8' })
  assert.equal(created.status, 0, created.stderr)
}

async function writeCreativeOutput(input: {
  outputRoot: string
  label: string
  result: OfflineRemotionRenderResult
}) {
  const artifactPath = join(input.outputRoot, `${input.label}.mp4`)
  await writeFile(artifactPath, input.result.artifact.bytes)
  const framePaths: string[] = []
  for (const frameArtifact of input.result.frameArtifacts) {
    const path = join(input.outputRoot,
      `${input.label}-frame-${String(frameArtifact.frame).padStart(3, '0')}.png`)
    await writeFile(path, frameArtifact.bytes)
    framePaths.push(path)
  }
  const contactSheetPath = join(
    input.outputRoot, `${input.label}-contact-sheet.png`)
  createContactSheet(framePaths, contactSheetPath)
  return {
    label: input.label,
    artifactPath,
    artifactSha256: input.result.artifact.sha256,
    artifactByteLength: input.result.artifact.byteLength,
    width: input.result.artifact.width,
    height: input.result.artifact.height,
    fps: input.result.artifact.fps,
    durationFrames: input.result.artifact.durationFrames,
    requestedFrames: input.result.frameArtifacts.map((item) => item.frame),
    framePaths,
    contactSheetPath,
  }
}

async function uploadAndFinalize(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  uploadPurpose: 'source_media' | 'reference_media'
  fileName: string
  bytes: Buffer
}) {
  const checksumSha256 = sha256(input.bytes)
  const service = createUploadService(input.context)
  const created = await service.createUploadIntent({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    uploadPurpose: input.uploadPurpose,
    originalFileName: input.fileName,
    mimeType: 'video/mp4',
    expectedSizeBytes: input.bytes.byteLength,
    checksumSha256,
  })
  await service.uploadLocalObject(
    created.uploadIntent.id,
    input.workspaceId,
    input.bytes,
    'video/mp4',
    input.bytes.byteLength,
  )
  const finalized = await service.finalizeUploadIntent({
    workspaceId: input.workspaceId,
    uploadIntentId: created.uploadIntent.id,
  })
  return { ...finalized, checksumSha256 }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
