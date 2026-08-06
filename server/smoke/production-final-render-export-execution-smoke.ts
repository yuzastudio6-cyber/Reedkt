import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildExportDeliveryQAResults,
  buildFfmpegExportCommandPlan,
  buildLibassCaptionBurnInCommandPlan,
  buildRenderArtifactRecord,
  buildRenderManifestExecution,
  buildRemotionRenderCommandPlan,
  resolveRenderAssets,
  runFfmpegExport,
  runFinalRenderExecutionPipeline,
  runLibassCaptionBurnIn,
  runRemotionRender,
  validateRenderExecutionInput,
  validateRenderExecutionPolicy,
} from '../workers/final-render'
import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { FinalRenderExecutionInput } from '../workers/final-render'
import { buildProfessionalExportExecutionAuthority } from '../../src/lib/professional-export-policy'

const execFileAsync = promisify(execFile)

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

async function expectRejects(fn: () => unknown | Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await fn()
  } catch {
    rejected = true
  }
  check(rejected, message)
}

const baseInput: FinalRenderExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m16a-smoke',
  projectId: 'project-m16a-smoke',
  mediaAssetId: 'media-m16a-smoke',
  approvedSnapshotId: 'approved-snapshot-m16a-smoke',
  creditReservationId: 'credit-reservation-m16a-smoke',
  toolExecutionPlanId: 'tool-execution-m16a-smoke',
  idempotencyKey: 'idempotency-m16a-smoke',
  timelineManifestId: 'timeline-manifest-m16a-smoke',
  renderManifestId: 'render-manifest-m16a-smoke',
  sourceVideoArtifactIds: ['source-video-artifact-m16a-smoke'],
  proxyVideoArtifactIds: ['proxy-video-artifact-m16a-smoke'],
  captionArtifactIds: ['caption-artifact-m16a-smoke'],
  audioArtifactIds: ['audio-artifact-m16a-smoke'],
  colorArtifactIds: ['color-artifact-m16a-smoke'],
  maskArtifactIds: ['mask-artifact-m16a-smoke'],
  enhancementArtifactIds: ['enhancement-artifact-m16a-smoke'],
  slowMotionArtifactIds: ['slow-motion-artifact-m16a-smoke'],
  renderEngine: 'hybrid',
  renderMode: 'preview',
  canvas: { width: 1920, height: 1080, aspectRatio: '16:9' },
  fps: 30,
  durationSeconds: 8,
  exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p' },
  professionalExportAuthority: buildProfessionalExportExecutionAuthority({
    approvedEstimateId: 'credit-estimate-m16a-smoke',
    approvedReservationId: 'credit-reservation-m16a-smoke',
    approvedDeliverableId: 'deliverable-m16a-smoke-landscape',
    approvedAspectRatio: '16:9',
    approvedOutputFps: 30,
    approvedDurationSeconds: 8,
    selectedProfileId: 'hd_1080',
  }),
}

await expectRejects(
  () => validateRenderExecutionPolicy({ ...baseInput, rawPrompt: 'render it' }),
  'Render execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateRenderExecutionPolicy({ ...baseInput, signedUrl: 'https://storage.example/render.mp4?X-Goog-Signature=abc' }),
  'Render execution policy must reject signedUrl.',
)
check(!validateRenderExecutionPolicy({ ...baseInput, arbitraryFfmpegArgs: ['-filter_complex', 'unsafe'] }).allowed, 'Render policy must reject arbitrary FFmpeg args.')
check(!validateRenderExecutionPolicy({ ...baseInput, arbitraryRemotionArgs: ['--webpack-override', 'user.js'] }).allowed, 'Render policy must reject arbitrary Remotion args.')
check(!validateRenderExecutionPolicy({ ...baseInput, arbitraryLibassArgs: ['force-style=unsafe'] }).allowed, 'Render policy must reject arbitrary libass args.')
check(!validateRenderExecutionPolicy({ ...baseInput, allowRevideo: true }).allowed, 'Render policy must reject allowRevideo=true.')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-m16a-smoke-'))
try {
  check(!validateRenderExecutionInput({
    ...baseInput,
    mode: 'local_dev',
    sourceLocalPaths: [path.join(tempRoot, 'm16a-preview.mp4')],
    outputDirectory: tempRoot,
  }).valid, 'Render validator must reject source/proxy overwrite.')
  check(!validateRenderExecutionInput({ ...baseInput, sourceLocalPaths: ['..\\unsafe-video.mp4'] }).valid, 'Render validator must reject unsafe local paths.')
  check(!validateRenderExecutionInput({ ...baseInput, fps: 240 }).valid, 'Render validator must reject invalid fps.')
  check(!validateRenderExecutionInput({ ...baseInput, canvas: { width: 8192, height: 4320, aspectRatio: '16:9' } }).valid, 'Render validator must reject invalid canvas.')
  check(!validateRenderExecutionInput({ ...baseInput, durationSeconds: 0 }).valid, 'Render validator must reject invalid duration.')
  check(!validateRenderExecutionInput({ ...baseInput, exportSettings: { container: 'mov', videoCodec: 'prores', audioCodec: 'pcm_s16le' } }).valid, 'Render validator must reject unsafe export settings.')
  check(!validateRenderExecutionInput({
    ...baseInput,
    renderMode: 'final_export',
    upstreamQaResults: [mockGate('render_asset_integrity', 'blocked', true)],
  }).valid, 'Render validator must block final export when required upstream QA gates failed.')

  const executionManifest = buildRenderManifestExecution(baseInput)
  check(executionManifest.clips.length > 0, 'Render manifest execution builder must normalize clips.')
  check(executionManifest.captions.length === 1, 'Render manifest execution builder must normalize captions.')
  check(executionManifest.audio.length === 1, 'Render manifest execution builder must normalize audio.')
  check(executionManifest.resolvedAssets.length > 0, 'Render manifest execution builder must resolve assets.')
  check(executionManifest.revideoUsed === false && executionManifest.hyperframeBridgeOnly === true, 'Execution manifest must keep Hyperframe metadata-only and not use Revideo.')
  await expectRejects(
    () => resolveRenderAssets({ ...baseInput, sourceLocalPaths: ['https://storage.example/source.mp4'] }),
    'Render asset resolver must reject signed/raw URLs.',
  )

  const remotionPlan = buildRemotionRenderCommandPlan({ executionInput: baseInput, executionManifest })
  const ffmpegPlan = buildFfmpegExportCommandPlan({ executionInput: baseInput, executionManifest })
  const libassPlan = buildLibassCaptionBurnInCommandPlan({ executionInput: baseInput, executionManifest })
  check(remotionPlan.executes === false && remotionPlan.args.includes('render') && !remotionPlan.args.includes('revideo'), 'Remotion command builder must be allowlisted and non-executing.')
  check(ffmpegPlan.executes === false && ffmpegPlan.args.includes('-c:v') && ffmpegPlan.args.includes('-filter_complex'), 'FFmpeg export command builder must be allowlisted, timeline-aware, and non-executing in dry-run.')
  const sourceMasterPlan = buildFfmpegExportCommandPlan({
    executionInput: {
      ...baseInput,
      renderMode: 'final_export',
      sourceLocalPaths: ['/private/source-master.mp4'],
      proxyLocalPaths: ['/private/analysis-proxy.mp4'],
    },
    executionManifest: { ...executionManifest, renderMode: 'final_export' },
  })
  check(sourceMasterPlan.args.includes('/private/source-master.mp4') && !sourceMasterPlan.args.includes('/private/analysis-proxy.mp4'), 'Final export must prefer the immutable source master over the analysis proxy.')
  check(ffmpegPlan.args.includes('-ar') && ffmpegPlan.args.includes('48000'), 'FFmpeg export audio must be locked to the professional 48 kHz video-delivery rate.')
  const externalMixPlan = buildFfmpegExportCommandPlan({ executionInput: { ...baseInput, audioLocalPaths: ['/private/approved-mix.wav'] }, executionManifest })
  check(externalMixPlan.args.includes('/private/approved-mix.wav') && externalMixPlan.args.join(' ').includes('[1:a:0]atrim'), 'FFmpeg export must preserve an explicitly approved external audio mix when one is provided.')
  check(libassPlan.executes === false && libassPlan.args.includes('-vf') && !libassPlan.args.includes('-filter_complex'), 'libass command builder must be allowlisted and non-executing.')

  const dryRun = await runFinalRenderExecutionPipeline(baseInput)
  check(dryRun.status === 'dry_run' || dryRun.status === 'blocked', 'Dry-run pipeline must build execution manifest/command plans/QA without tools.')
  check(Boolean(dryRun.executionManifest), 'Dry-run pipeline must include execution manifest.')
  check(dryRun.commandPlans.length >= 3, 'Dry-run hybrid pipeline must include Remotion/FFmpeg/libass command plans.')
  check(dryRun.renderArtifacts.some((artifact) => artifact.artifactType === 'render_manifest'), 'Dry-run pipeline must include private render_manifest artifact ref.')
  check(dryRun.qaResults.some((gate) => gate.gateType === 'render_asset_integrity'), 'Render QA must emit render_asset_integrity.')
  check(dryRun.qaResults.some((gate) => gate.gateType === 'render_timeline_integrity'), 'Render QA must emit render_timeline_integrity.')
  check(dryRun.qaResults.some((gate) => gate.gateType === 'export_codec_format'), 'Export QA must emit export_codec_format.')
  check(dryRun.qaResults.some((gate) => gate.gateType === 'export_duration_sync'), 'Export QA must emit export_duration_sync.')
  check(dryRun.qaResults.find((gate) => gate.gateType === 'final_delivery')?.status !== 'passed', 'Final delivery QA must not pass without final_export artifact.')

  const localInput: FinalRenderExecutionInput = {
    ...baseInput,
    mode: 'local_dev',
    outputDirectory: tempRoot,
    sourceLocalPaths: [path.join(tempRoot, 'missing-source.mp4')],
    captionLocalPaths: [path.join(tempRoot, 'missing-captions.ass')],
  }
  const remotion = await runRemotionRender({ executionInput: localInput, executionManifest, commandPlan: remotionPlan })
  const ffmpeg = await runFfmpegExport({ executionInput: localInput, executionManifest, commandPlan: ffmpegPlan })
  const libass = await runLibassCaptionBurnIn({ executionInput: localInput, executionManifest, commandPlan: libassPlan })
  check(remotion.status === 'skipped', 'Remotion runner must skip gracefully if unavailable/disabled.')
  check(ffmpeg.status === 'skipped', 'FFmpeg runner must skip gracefully if unavailable/disabled.')
  check(libass.status === 'skipped', 'libass runner must skip gracefully if unavailable/disabled.')

  const fixtureSourcePath = path.join(tempRoot, 'whole-edit-source.mp4')
  const fixtureCaptionPath = path.join(tempRoot, 'whole-edit-captions.ass')
  const fixtureCaptionOverlayPath = path.join(tempRoot, 'whole-edit-caption-overlay.png')
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x26314d:s=320x568:r=30:d=2',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    fixtureSourcePath,
  ])
  await writeFile(fixtureCaptionPath, `[Script Info]
ScriptType: v4.00+
PlayResX: 320
PlayResY: 568

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,24,&H00FFFFFF,&H00FFFFFF,&H00000000,&H66000000,-1,0,0,0,100,100,0,0,1,2,1,2,24,24,60,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
Dialogue: 0,0:00:00.10,0:00:01.30,Default,,0,0,0,,Whole edit fixture
`, 'utf8')
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x111827@0.80:s=240x80:d=0.04',
    '-frames:v', '1', '-vf', 'format=rgba', fixtureCaptionOverlayPath,
  ])
  const upstreamQaResults = [
    mockGate('cut_smoothness', 'passed', false),
    mockGate('transcript_alignment', 'passed', false),
    mockGate('caption_timing', 'passed', false),
    mockGate('caption_readability', 'passed', false),
    mockGate('caption_safe_zone', 'passed', false),
  ]
  const localRenderPayload = {
    ...buildPayload('render_worker', { internalTestingGate: 'm16a_local_whole_edit_fixture' }),
    executionMode: 'mock_safe' as const,
    creditReservationId: baseInput.creditReservationId,
    renderMode: 'final_export' as const,
  }
  const localRender = await runFinalRenderExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    workerPayload: localRenderPayload,
    timelineManifestId: 'timeline-m16a-local-whole-edit',
    timelineManifest: {
      id: 'timeline-m16a-local-whole-edit',
      workspaceId: baseInput.workspaceId,
      projectId: baseInput.projectId,
      editPlanId: 'edit-plan-m16a-local-whole-edit',
      approvedSnapshotId: baseInput.approvedSnapshotId as string,
      mediaAssetId: baseInput.mediaAssetId,
      version: '1',
      timelineFormat: 'reeditpro_timeline',
      durationSeconds: 1.5,
      clips: [
        {
          id: 'fixture-clip-1',
          sourceMediaAssetId: baseInput.mediaAssetId,
          sourceRange: { startSeconds: 0, endSeconds: 0.8 },
          timelineRange: { startSeconds: 0, endSeconds: 0.8 },
          trackId: 'video-1',
        },
        {
          id: 'fixture-clip-2',
          sourceMediaAssetId: baseInput.mediaAssetId,
          sourceRange: { startSeconds: 1, endSeconds: 1.7 },
          timelineRange: { startSeconds: 0.8, endSeconds: 1.5 },
          trackId: 'video-1',
        },
      ],
      audioLayers: [],
      captionLayers: [],
      overlayLayers: [],
      maskLayers: [],
      colorOperations: [],
      renderNotes: ['Generated fixture validates source-range trims and private final render execution.'],
      sourceReferences: [{ storageBucketPurpose: 'source_media', storageObjectPath: 'fixtures/m16a/whole-edit-source.mp4', sourceOfTruth: true }],
      createdAt: new Date().toISOString(),
    },
    sourceLocalPaths: [fixtureSourcePath],
    captionLocalPaths: [fixtureCaptionPath],
    captionOverlayInputs: [{ localPath: fixtureCaptionOverlayPath, startSeconds: 0.1, endSeconds: 1.3, x: 40, y: 420 }],
    outputDirectory: tempRoot,
    outputFileName: 'whole-edit-final.mp4',
    renderEngine: 'ffmpeg',
    renderMode: 'final_export',
    canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
    professionalExportAuthority: buildProfessionalExportExecutionAuthority({
      approvedEstimateId: 'credit-estimate-m16a-smoke',
      approvedReservationId: baseInput.creditReservationId as string,
      approvedDeliverableId: 'deliverable-m16a-smoke-portrait',
      approvedAspectRatio: '9:16',
      approvedOutputFps: 30,
      approvedDurationSeconds: 1.5,
      selectedProfileId: 'hd_1080',
    }),
    fps: 30,
    durationSeconds: 1.5,
    enableLocalDevRender: true,
    enableCaptionBurnIn: true,
    sourceAudioRequired: true,
    localDevRenderProfile: { visualFinish: 'clean_natural', audioFinish: 'clean_voice', subtlePunchIns: true },
    requiredUpstreamQaGateTypes: upstreamQaResults.map((gate) => gate.gateType),
    upstreamQaResults,
    timeoutMs: 120_000,
  })
  check(localRender.status === 'completed', `Local whole-edit fixture render must complete: ${JSON.stringify({ warnings: localRender.warnings, skippedReasons: localRender.skippedReasons, qaResults: localRender.qaResults, commandPlans: localRender.commandPlans })}`)
  check(localRender.finalDeliveryAllowed, 'Local whole-edit fixture must pass private final-delivery QA.')
  check(Boolean(localRender.outputLocalPath && existsSync(localRender.outputLocalPath)), 'Local whole-edit fixture must create a real MP4 output.')
  check(localRender.outputProbe?.durationSeconds !== undefined && Math.abs(localRender.outputProbe.durationSeconds - 1.5) <= 0.35, 'Local whole-edit fixture output duration must match the approved timeline.')
  check(localRender.outputProbe?.width === 1080 && localRender.outputProbe.height === 1920, 'Local whole-edit fixture output must match the approved 1080p portrait profile.')

  const invalidOutputPath = path.join(tempRoot, 'invalid-timeline-must-not-render.mp4')
  const invalidTimelineRender = await runFinalRenderExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    workerPayload: localRenderPayload,
    timelineManifestId: 'timeline-m16a-invalid-local-whole-edit',
    timelineManifest: {
      id: 'timeline-m16a-invalid-local-whole-edit',
      workspaceId: baseInput.workspaceId,
      projectId: baseInput.projectId,
      editPlanId: 'edit-plan-m16a-invalid-local-whole-edit',
      approvedSnapshotId: baseInput.approvedSnapshotId as string,
      mediaAssetId: baseInput.mediaAssetId,
      version: '1',
      timelineFormat: 'reeditpro_timeline',
      durationSeconds: 1.5,
      clips: [
        {
          id: 'invalid-overlap-1',
          sourceMediaAssetId: baseInput.mediaAssetId,
          sourceRange: { startSeconds: 0, endSeconds: 1 },
          timelineRange: { startSeconds: 0, endSeconds: 1 },
          trackId: 'video-1',
        },
        {
          id: 'invalid-overlap-2',
          sourceMediaAssetId: baseInput.mediaAssetId,
          sourceRange: { startSeconds: 1, endSeconds: 2 },
          timelineRange: { startSeconds: 0.5, endSeconds: 1.5 },
          trackId: 'video-1',
        },
      ],
      audioLayers: [],
      captionLayers: [],
      overlayLayers: [],
      maskLayers: [],
      colorOperations: [],
      renderNotes: ['Invalid generated fixture must fail before local command execution.'],
      sourceReferences: [{ storageBucketPurpose: 'source_media', storageObjectPath: 'fixtures/m16a/whole-edit-source.mp4', sourceOfTruth: true }],
      createdAt: new Date().toISOString(),
    },
    sourceLocalPaths: [fixtureSourcePath],
    captionLocalPaths: [fixtureCaptionPath],
    captionOverlayInputs: [{ localPath: fixtureCaptionOverlayPath, startSeconds: 0.1, endSeconds: 1.3, x: 40, y: 420 }],
    outputDirectory: tempRoot,
    outputFileName: path.basename(invalidOutputPath),
    renderEngine: 'ffmpeg',
    renderMode: 'final_export',
    canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
    professionalExportAuthority: buildProfessionalExportExecutionAuthority({
      approvedEstimateId: 'credit-estimate-m16a-smoke',
      approvedReservationId: baseInput.creditReservationId as string,
      approvedDeliverableId: 'deliverable-m16a-smoke-invalid-timeline',
      approvedAspectRatio: '9:16',
      approvedOutputFps: 30,
      approvedDurationSeconds: 1.5,
      selectedProfileId: 'hd_1080',
    }),
    fps: 30,
    durationSeconds: 1.5,
    enableLocalDevRender: true,
    enableCaptionBurnIn: true,
    sourceAudioRequired: true,
    localDevRenderProfile: { visualFinish: 'clean_natural', audioFinish: 'clean_voice', subtlePunchIns: true },
    requiredUpstreamQaGateTypes: upstreamQaResults.map((gate) => gate.gateType),
    upstreamQaResults,
  })
  check(
    invalidTimelineRender.status === 'blocked' && !existsSync(invalidOutputPath),
    `Invalid render manifests must fail closed before any local media command executes: ${JSON.stringify({ status: invalidTimelineRender.status, outputExists: existsSync(invalidOutputPath), warnings: invalidTimelineRender.warnings, qaResults: invalidTimelineRender.qaResults })}`,
  )

  const renderManifestArtifact = buildRenderArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'render_manifest',
    fileName: 'render-manifest.json',
  })
  const previewArtifact = buildRenderArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'preview_video',
    fileName: 'preview.mp4',
    previewAllowed: true,
  })
  const finalExportArtifact = buildRenderArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'final_export',
    fileName: 'final-export.mp4',
  })
  check(renderManifestArtifact.isPrivate && renderManifestArtifact.artifactType === 'render_manifest', 'Render artifact writer must create private render_manifest refs.')
  check(previewArtifact.isPrivate && previewArtifact.previewAllowed, 'Render artifact writer must create private preview_video refs when preview exists.')
  check(finalExportArtifact.isPrivate && finalExportArtifact.storageBucketPurpose === 'final_exports' && finalExportArtifact.sourceOfTruth, 'Render artifact writer must create private final_export refs when export exists.')

  const blockedDelivery = buildExportDeliveryQAResults({
    executionInput: { ...baseInput, renderMode: 'final_export' },
    executionManifest: { ...executionManifest, renderMode: 'final_export', finalDeliveryCandidate: true },
    upstreamQaResults: [],
  })
  check(blockedDelivery.find((gate) => gate.gateType === 'final_delivery')?.status !== 'passed', 'Final delivery QA must not pass without final_export artifact.')
  const passingDelivery = buildExportDeliveryQAResults({
    executionInput: { ...baseInput, renderMode: 'final_export' },
    executionManifest: { ...executionManifest, renderMode: 'final_export', finalDeliveryCandidate: true },
    finalExportArtifact,
    upstreamQaResults: [mockGate('render_asset_integrity', 'passed', false)],
    outputArtifactIds: [finalExportArtifact.id],
  })
  check(passingDelivery.find((gate) => gate.gateType === 'final_delivery')?.status === 'passed', 'Final delivery QA must pass only with final_export artifact and passing gates.')
  const unprobedLocalDelivery = buildExportDeliveryQAResults({
    executionInput: { ...baseInput, mode: 'local_dev', enableLocalDevRender: true, renderMode: 'final_export' },
    executionManifest: { ...executionManifest, renderMode: 'final_export', finalDeliveryCandidate: true },
    finalExportArtifact,
    upstreamQaResults: [mockGate('render_asset_integrity', 'passed', false)],
    outputArtifactIds: [finalExportArtifact.id],
  })
  check(unprobedLocalDelivery.find((gate) => gate.gateType === 'final_delivery')?.status !== 'passed', 'Requested local execution must not pass final delivery without a real probed output.')

  const productionReady = await runFinalRenderExecutionPipeline({
    ...baseInput,
    mode: 'production_ready',
    renderMode: 'final_export',
    readinessReport: { overallStatus: 'blocked', blockers: ['render_readiness_missing'], blockerSummaries: [] },
  })
  check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness/gate blockers exist.')

  const routed = await runProductionWorkerRuntime({
    payload: buildPayload('render_worker', {
      finalRenderExecution: {
        mode: 'dry_run',
        renderEngine: 'hybrid',
        renderMode: 'preview',
        timelineManifestId: baseInput.timelineManifestId,
        renderManifestId: baseInput.renderManifestId,
        sourceVideoArtifactIds: baseInput.sourceVideoArtifactIds,
        proxyVideoArtifactIds: baseInput.proxyVideoArtifactIds,
        captionArtifactIds: baseInput.captionArtifactIds,
        audioArtifactIds: baseInput.audioArtifactIds,
        canvas: baseInput.canvas,
        fps: baseInput.fps,
        durationSeconds: baseInput.durationSeconds,
        exportSettings: baseInput.exportSettings,
      },
    }),
  })
  check(routed.status === 'completed', 'Explicit finalRenderExecution worker route must complete in dry-run.')
  check(routed.output?.futureHandler === 'render_worker_final_render_export_execution', 'Worker router must use explicit M16A render route.')
  check(Boolean(routed.output?.finalRenderExecutionResult), 'Worker router output must include finalRenderExecutionResult.')

  const combinedOutput = JSON.stringify({ dryRun, productionReady, routed }).toLowerCase()
  check(!combinedOutput.includes('evaluation_revideo') && !combinedOutput.includes('"revideoUsed":true'.toLowerCase()), 'M16A must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'policy_forbidden_fields',
      'validation_paths_settings_qa',
      'manifest_asset_resolution',
      'allowlisted_command_plans',
      'approved_external_audio_mix',
      'dry_run_pipeline',
      'local_dev_skip_safe',
      'private_render_artifacts',
      'render_export_qa_gates',
      'final_delivery_rules',
      'local_execution_requires_probed_output',
      'invalid_manifest_blocks_before_execution',
      'production_blockers',
      'worker_route',
      'no_revideo_runtime',
    ],
    artifacts: dryRun.renderArtifacts.length,
    commandPlans: dryRun.commandPlans.length,
    qaResults: dryRun.qaResults.length,
  }, null, 2))
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

function mockGate(gateType: QualityGateType, status: 'passed' | 'blocked', blocking: boolean) {
  return {
    id: `gate-${gateType}`,
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    toolExecutionPlanId: baseInput.toolExecutionPlanId as string,
    recipeId: 'final_export_recipe',
    gateType,
    status,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker' as const,
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: [],
    recommendations: [],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking,
    humanReviewRequired: blocking,
  }
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata: ProductionWorkerJobPayload['metadata'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${workerType}-m16a-smoke`,
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    approvedSnapshotId: baseInput.approvedSnapshotId as string,
    toolExecutionPlanId: baseInput.toolExecutionPlanId as string,
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: ['remotion', 'ffmpeg', 'libass'],
    requestedRecipeIds: ['final_export_recipe'],
    storageReferenceIds: ['workspaces/workspace-m16a-smoke/projects/project-m16a-smoke/media/source.mp4'],
    renderMode: 'preview',
    requiredQualityGateTypes: ['render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
