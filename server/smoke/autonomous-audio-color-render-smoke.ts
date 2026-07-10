import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildFfmpegExportCommandPlan } from '../workers/render/ffmpeg-export-command-builder'
import type { FinalRenderExecutionInput, RenderExecutionManifest } from '../workers/render/render-execution-types'
import { probeMediaFile } from '../workers/media/ffprobe-media-adapter'

const root = await mkdtemp(path.join(tmpdir(), 'reeditpro-approved-finish-'))
const sourcePath = path.join(root, 'source.mp4')
const ffmpegBin = process.env.FFMPEG_BIN?.trim() || 'ffmpeg'
const ffprobeBin = process.env.FFPROBE_BIN?.trim() || 'ffprobe'

try {
  execFileSync(ffmpegBin, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x2a3548:s=320x568:r=30:d=2',
    '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=48000:duration=2',
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', sourcePath,
  ], { stdio: 'pipe' })

  const executionManifest: RenderExecutionManifest = {
    executionManifestId: 'approved-finish-smoke', workspaceId: 'workspace-finish-smoke', projectId: 'project-finish-smoke', mediaAssetId: 'media-finish-smoke',
    approvedSnapshotId: 'snapshot-finish-smoke', timelineManifestId: 'timeline-finish-smoke', renderManifestId: 'render-finish-smoke',
    clips: [{ clipId: 'clip-finish-smoke', sourceArtifactId: 'source-finish-smoke', sourceStartSeconds: 0, sourceEndSeconds: 2, timelineStartSeconds: 0, timelineEndSeconds: 2 }],
    captions: [], audio: [], overlays: [], masks: [], colorArtifactIds: [], enhancementArtifactIds: [], slowMotionArtifactIds: [],
    canvas: { width: 320, height: 568, aspectRatio: '9:16', backgroundColor: '#000000' }, fps: 30, durationSeconds: 2,
    renderEngine: 'ffmpeg', renderMode: 'final_export', exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', crf: 20, pixelFormat: 'yuv420p' },
    resolvedAssets: [], qaRequirements: [], hyperframeBridgeOnly: true, revideoUsed: false, finalDeliveryCandidate: true,
  }
  const executionInput: FinalRenderExecutionInput = {
    mode: 'local_dev', workspaceId: executionManifest.workspaceId, projectId: executionManifest.projectId, mediaAssetId: executionManifest.mediaAssetId,
    approvedSnapshotId: executionManifest.approvedSnapshotId, creditReservationId: 'reservation-finish-smoke', idempotencyKey: 'finish-smoke',
    timelineManifestId: executionManifest.timelineManifestId, renderManifestId: executionManifest.renderManifestId,
    sourceVideoArtifactIds: ['source-finish-smoke'], sourceLocalPaths: [sourcePath], outputDirectory: root,
    outputFileName: 'approved-finish-review.mp4', renderEngine: 'ffmpeg', renderMode: 'final_export', canvas: executionManifest.canvas,
    fps: 30, durationSeconds: 2, exportSettings: executionManifest.exportSettings, enableLocalDevRender: true, sourceAudioRequired: true,
    ffmpegBin, ffprobeBin,
    localDevRenderProfile: { visualFinish: 'none', audioFinish: 'none', subtlePunchIns: false },
    approvedAudioSpec: {
      kind: 'audio', denoise: 'light_fft', normalize: true, targetLufs: -16, truePeakDb: -1.5,
      highpassHz: 80, lowpassHz: 16000, voiceCompression: 'light', evidenceBasis: ['measured-audio-smoke'],
    },
    approvedColorSpec: {
      kind: 'color', brightness: 0.01, contrast: 1.04, saturation: 1.03, gamma: 1.01,
      warmth: 0.015, preserveNaturalSkin: true, evidenceBasis: ['measured-color-smoke'],
    },
  }
  const plan = buildFfmpegExportCommandPlan({ executionInput, executionManifest })
  const filter = plan.args[plan.args.indexOf('-filter_complex') + 1]
  assert.match(filter, /afftdn=nr=8/)
  assert.match(filter, /loudnorm=I=-16/)
  assert.match(filter, /eq=contrast=1\.04/)
  assert.match(filter, /colorbalance=rs=0\.015:bs=-0\.015/)
  assert.ok(plan.expectedOutputPath)
  execFileSync(plan.command, plan.args, { stdio: 'pipe', timeout: 120_000 })
  const probe = await probeMediaFile({ localFilePath: plan.expectedOutputPath, ffprobeBin, timeoutMs: 30_000 })
  assert.equal(probe.width, 320)
  assert.equal(probe.height, 568)
  assert.equal(probe.audioStreams.length, 1)
  assert.ok((probe.sizeBytes ?? 0) > 0)

  console.log(JSON.stringify({
    ok: true,
    decision: 'autonomous_approved_audio_color_render_passed',
    outputProbe: { durationSeconds: probe.durationSeconds, width: probe.width, height: probe.height, audioStreamCount: probe.audioStreams.length },
    approvedParametersExecuted: true,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}
