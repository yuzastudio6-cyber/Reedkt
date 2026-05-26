import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildEnhancementArtifactRecord,
  buildEnhancementTaskPlan,
  buildFfmpegEnhancementPreviewPlan,
  runFfmpegEnhancementPreview,
  runOpenCvEnhancementQA,
  runRealEsrganEnhancement,
  runSharpEnhancementAdapter,
  validateEnhancementExecutionInput,
  validateEnhancementExecutionPolicy,
} from '../workers/enhancement'
import type { EnhancementExecutionInput } from '../workers/enhancement'
import {
  buildFfmpegSpeedChangePlan,
  buildFilmCommandPlan,
  buildSlowMotionArtifactRecord,
  buildSlowMotionTaskPlan,
  runFfmpegSpeedChange,
  runFilmInterpolation,
  validateSlowMotionExecutionInput,
  validateSlowMotionExecutionPolicy,
} from '../workers/slow-motion'
import type { SlowMotionExecutionInput } from '../workers/slow-motion'
import { runEnhancementSlowMotionPipeline } from '../workers/enhancement-slowmotion'

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

const baseEnhancementInput: EnhancementExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m15d-smoke',
  projectId: 'project-m15d-smoke',
  mediaAssetId: 'media-m15d-smoke',
  approvedSnapshotId: 'approved-snapshot-m15d-smoke',
  toolExecutionPlanId: 'tool-execution-m15d-smoke',
  idempotencyKey: 'idempotency-m15d-smoke',
  sourceVideoArtifactId: 'source-video-artifact-m15d-smoke',
  proxyVideoArtifactId: 'proxy-video-artifact-m15d-smoke',
  representativeFrameArtifactIds: ['frame-a', 'frame-b'],
  enhancementIntent: 'improve_low_resolution_clip',
  sourceQualityIssueDetected: true,
  targetScale: 2,
  sourceResolution: { width: 1280, height: 720 },
  targetResolution: { width: 1920, height: 1080 },
  sampleOnly: true,
  sampleCount: 3,
  selectedClipRanges: [{ startSeconds: 0, endSeconds: 2, reason: 'low-resolution sample' }],
}

const baseSlowMotionInput: SlowMotionExecutionInput = {
  mode: 'dry_run',
  workspaceId: baseEnhancementInput.workspaceId,
  projectId: baseEnhancementInput.projectId,
  mediaAssetId: baseEnhancementInput.mediaAssetId,
  approvedSnapshotId: baseEnhancementInput.approvedSnapshotId,
  toolExecutionPlanId: baseEnhancementInput.toolExecutionPlanId,
  idempotencyKey: baseEnhancementInput.idempotencyKey,
  sourceVideoArtifactId: baseEnhancementInput.sourceVideoArtifactId,
  proxyVideoArtifactId: baseEnhancementInput.proxyVideoArtifactId,
  selectedClipRanges: [{ startSeconds: 1, endSeconds: 2.5, reason: 'approved dramatic slow-motion beat' }],
  slowMotionFactor: 2,
  interpolationMode: 'film',
}

await expectRejects(
  () => validateEnhancementExecutionPolicy({ ...baseEnhancementInput, rawPrompt: 'upscale this' }),
  'Enhancement execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateEnhancementExecutionPolicy({ ...baseEnhancementInput, signedUrl: 'https://storage.example/video.mp4?X-Goog-Signature=abc' }),
  'Enhancement execution policy must reject signedUrl.',
)
check(!validateEnhancementExecutionPolicy({ ...baseEnhancementInput, arbitraryModelArgs: ['--download'] }).allowed, 'Enhancement policy must reject arbitrary model args.')
check(!validateEnhancementExecutionPolicy({ ...baseEnhancementInput, arbitraryFfmpegArgs: ['-filter_complex', 'unsafe'] }).allowed, 'Enhancement policy must reject arbitrary FFmpeg args.')
check(!validateEnhancementExecutionPolicy({ ...baseEnhancementInput, allowModelDownload: true }).allowed, 'Enhancement policy must reject allowModelDownload=true.')
check(!validateEnhancementExecutionPolicy({ ...baseEnhancementInput, allowFinalRender: true }).allowed, 'Enhancement policy must reject allowFinalRender=true.')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-m15d-smoke-'))
try {
  check(!validateEnhancementExecutionInput({
    ...baseEnhancementInput,
    mode: 'local_dev',
    sourceVideoLocalPath: path.join(tempRoot, 'enhanced-video.mp4'),
    outputDirectory: tempRoot,
  }).valid, 'Enhancement validator must reject source/proxy overwrite.')
  check(!validateEnhancementExecutionInput({ ...baseEnhancementInput, realEsrganModelLocalPath: '..\\unsafe-model' }).valid, 'Enhancement validator must reject unsafe local/model paths.')
  check(!validateEnhancementExecutionInput({ ...baseEnhancementInput, sampleCount: 99 }).valid, 'Enhancement validator must enforce sample count guard.')
  check(!validateEnhancementExecutionInput({ ...baseEnhancementInput, targetScale: 5 }).valid, 'Enhancement validator must reject unsafe targetScale.')
  check(!validateEnhancementExecutionInput({
    ...baseEnhancementInput,
    sourceResolution: { width: 100, height: 100 },
    targetResolution: { width: 1000, height: 1000 },
  }).valid, 'Enhancement validator must reject unsafe targetResolution.')

  const enhancementPlan = buildEnhancementTaskPlan(baseEnhancementInput)
  check(enhancementPlan.sampleFirstPolicy.sampleFirst && enhancementPlan.selectedSamples.length <= enhancementPlan.sampleFirstPolicy.maxSampleCount, 'Enhancement task planner must use sample-first policy.')
  const noEnhancementPlan = buildEnhancementTaskPlan({
    ...baseEnhancementInput,
    sourceQualityIssueDetected: false,
    approvedEnhancementReason: undefined,
  })
  check(noEnhancementPlan.primaryTool === 'none' && noEnhancementPlan.recommendedNoEnhancement, 'Enhancement planner must recommend no enhancement when no quality issue or approved request exists.')
  const realEsrgan = await runRealEsrganEnhancement({
    executionInput: { ...baseEnhancementInput, mode: 'local_dev', enableModelEnhancementExecution: true, outputDirectory: tempRoot },
    taskPlan: enhancementPlan,
  })
  check(realEsrgan.status === 'skipped' && realEsrgan.skipReason?.code === 'real_esrgan_model_missing', 'Real-ESRGAN runner must skip gracefully if unavailable/unapproved/no model.')
  const ffmpegEnhancementPlan = buildFfmpegEnhancementPreviewPlan({ executionInput: baseEnhancementInput, taskPlan: enhancementPlan })
  check(ffmpegEnhancementPlan.executes === false && ffmpegEnhancementPlan.args.includes('-vf') && !ffmpegEnhancementPlan.args.includes('-filter_complex'), 'FFmpeg enhancement preview plan must be allowlisted and non-executing.')
  const ffmpegEnhancement = await runFfmpegEnhancementPreview({ executionInput: { ...baseEnhancementInput, mode: 'local_dev', outputDirectory: tempRoot }, taskPlan: enhancementPlan })
  check(ffmpegEnhancement.status === 'skipped', 'FFmpeg enhancement preview runner must skip gracefully if unavailable/disabled.')
  const opencv = await runOpenCvEnhancementQA({ executionInput: baseEnhancementInput, taskPlan: enhancementPlan })
  check(opencv.status === 'skipped', 'OpenCV enhancement QA adapter must skip gracefully if unavailable.')
  const sharp = await runSharpEnhancementAdapter({ executionInput: baseEnhancementInput, taskPlan: enhancementPlan })
  check(sharp.status === 'skipped', 'Sharp enhancement adapter must skip gracefully if unavailable.')
  const enhancedArtifact = buildEnhancementArtifactRecord({
    workspaceId: baseEnhancementInput.workspaceId,
    projectId: baseEnhancementInput.projectId,
    mediaAssetId: baseEnhancementInput.mediaAssetId,
    artifactType: 'enhanced_video',
    fileName: 'enhanced-video.mp4',
  })
  check(enhancedArtifact.isPrivate && enhancedArtifact.artifactType === 'enhanced_video', 'Enhancement artifact writer must create private enhanced_video refs.')

  check(!validateSlowMotionExecutionPolicy({ ...baseSlowMotionInput, allowModelDownload: true }).allowed, 'Slow-motion policy must reject allowModelDownload=true.')
  check(!validateSlowMotionExecutionPolicy({ ...baseSlowMotionInput, allowFinalRender: true }).allowed, 'Slow-motion policy must reject allowFinalRender=true.')
  check(!validateSlowMotionExecutionInput({ ...baseSlowMotionInput, slowMotionFactor: 8 }).valid, 'Slow-motion policy/validator must reject extreme slowMotionFactor.')
  check(!validateSlowMotionExecutionInput({ ...baseSlowMotionInput, selectedClipRanges: [{ startSeconds: 4, endSeconds: 3 }] }).valid, 'Slow-motion validator must reject invalid clip ranges.')

  const slowMotionPlan = buildSlowMotionTaskPlan(baseSlowMotionInput)
  check(slowMotionPlan.selectedClipRanges.length === 1 && slowMotionPlan.primaryTool === 'film', 'Slow-motion task planner must use selected clips only and plan FILM when selected.')
  const filmPlan = buildFilmCommandPlan({ executionInput: baseSlowMotionInput, taskPlan: slowMotionPlan })
  check(filmPlan.executes === false && filmPlan.args.includes('--no-download'), 'FILM command plan must be non-executing and no-download.')
  const film = await runFilmInterpolation({
    executionInput: { ...baseSlowMotionInput, mode: 'local_dev', enableModelSlowMotionExecution: true, outputDirectory: tempRoot },
    taskPlan: slowMotionPlan,
  })
  check(film.status === 'skipped' && film.skipReason?.code === 'film_model_missing', 'FILM runner must skip gracefully if unavailable/unapproved/no model.')
  const speedPlan = buildFfmpegSpeedChangePlan({ executionInput: baseSlowMotionInput, taskPlan: slowMotionPlan })
  check(speedPlan.executes === false && speedPlan.args.includes('-filter:v') && !speedPlan.args.includes('-filter_complex'), 'FFmpeg speed runner command plan must be allowlisted and non-executing.')
  const ffmpegSpeed = await runFfmpegSpeedChange({ executionInput: { ...baseSlowMotionInput, mode: 'local_dev', outputDirectory: tempRoot }, taskPlan: slowMotionPlan })
  check(ffmpegSpeed.status === 'skipped', 'FFmpeg speed change runner must skip gracefully if unavailable/disabled.')
  const interpolatedArtifact = buildSlowMotionArtifactRecord({
    workspaceId: baseSlowMotionInput.workspaceId,
    projectId: baseSlowMotionInput.projectId,
    mediaAssetId: baseSlowMotionInput.mediaAssetId,
    artifactType: 'interpolated_video',
    fileName: 'interpolated-video.mp4',
  })
  check(interpolatedArtifact.isPrivate && interpolatedArtifact.artifactType === 'interpolated_video', 'Slow-motion artifact writer must create private interpolated_video refs.')

  const dryRun = await runEnhancementSlowMotionPipeline({
    mode: 'dry_run',
    workspaceId: baseEnhancementInput.workspaceId,
    projectId: baseEnhancementInput.projectId,
    mediaAssetId: baseEnhancementInput.mediaAssetId,
    approvedSnapshotId: baseEnhancementInput.approvedSnapshotId,
    toolExecutionPlanId: baseEnhancementInput.toolExecutionPlanId,
    idempotencyKey: baseEnhancementInput.idempotencyKey,
    sourceVideoArtifactId: baseEnhancementInput.sourceVideoArtifactId,
    proxyVideoArtifactId: baseEnhancementInput.proxyVideoArtifactId,
    representativeFrameArtifactIds: baseEnhancementInput.representativeFrameArtifactIds,
    enhancement: baseEnhancementInput,
    slowMotion: baseSlowMotionInput,
  })
  check(dryRun.status === 'dry_run' || dryRun.status === 'blocked', 'Dry-run pipeline must build enhancement/slow-motion plans/artifacts/QA without tools.')
  check(Boolean(dryRun.enhancementTaskPlan) && Boolean(dryRun.slowMotionTaskPlan), 'Dry-run pipeline must include both task plans.')
  check(dryRun.enhancedArtifacts.some((artifact) => artifact.artifactType === 'enhanced_video'), 'Dry-run pipeline must include enhancement artifact refs.')
  check(dryRun.interpolatedArtifacts.some((artifact) => artifact.artifactType === 'interpolated_video'), 'Dry-run pipeline must include slow-motion artifact refs.')
  for (const gateType of ['enhancement_artifacts', 'slow_motion_artifacts', 'render_asset_integrity'] as const) {
    check(dryRun.qaResults.some((gate) => gate.gateType === gateType), `M15D QA must emit ${gateType}.`)
  }
  check(dryRun.qaResults.some((gate) => gate.issues.some((issue) => issue.code.includes('ghosting') || issue.code.includes('warped'))), 'Slow-motion QA must flag ghosting/warping risk placeholders.')

  const localDev = await runEnhancementSlowMotionPipeline({
    mode: 'local_dev',
    workspaceId: baseEnhancementInput.workspaceId,
    projectId: baseEnhancementInput.projectId,
    mediaAssetId: baseEnhancementInput.mediaAssetId,
    approvedSnapshotId: baseEnhancementInput.approvedSnapshotId,
    toolExecutionPlanId: baseEnhancementInput.toolExecutionPlanId,
    idempotencyKey: baseEnhancementInput.idempotencyKey,
    outputDirectory: tempRoot,
    enhancement: { ...baseEnhancementInput, mode: 'local_dev', enableModelEnhancementExecution: true, outputDirectory: tempRoot },
    slowMotion: { ...baseSlowMotionInput, mode: 'local_dev', enableModelSlowMotionExecution: true, outputDirectory: tempRoot },
  })
  check(localDev.skippedReasons.some((reason) => reason.code === 'real_esrgan_model_missing') && localDev.skippedReasons.some((reason) => reason.code === 'film_model_missing'), 'local_dev model execution must skip gracefully if tools/models are unavailable.')

  const productionReady = await runEnhancementSlowMotionPipeline({
    mode: 'production_ready',
    workspaceId: baseEnhancementInput.workspaceId,
    projectId: baseEnhancementInput.projectId,
    mediaAssetId: baseEnhancementInput.mediaAssetId,
    approvedSnapshotId: baseEnhancementInput.approvedSnapshotId,
    toolExecutionPlanId: baseEnhancementInput.toolExecutionPlanId,
    idempotencyKey: baseEnhancementInput.idempotencyKey,
    sourceVideoArtifactId: baseEnhancementInput.sourceVideoArtifactId,
    modelWeightManifestIds: [],
    readinessReport: { overallStatus: 'blocked', blockers: ['model_weight_missing'], blockerSummaries: [] },
    enhancement: { ...baseEnhancementInput, mode: 'production_ready' },
    slowMotion: { ...baseSlowMotionInput, mode: 'production_ready' },
  })
  check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness/model-weight blockers exist.')

  const routed = await runProductionWorkerRuntime({
    payload: buildPayload('gpu_ai_worker', {
      enhancementSlowMotion: {
        mode: 'dry_run',
        buildEnhancement: true,
        buildSlowMotion: true,
        sourceVideoArtifactId: baseEnhancementInput.sourceVideoArtifactId,
        proxyVideoArtifactId: baseEnhancementInput.proxyVideoArtifactId,
        representativeFrameArtifactIds: baseEnhancementInput.representativeFrameArtifactIds,
        enhancement: {
          enhancementIntent: 'improve_low_resolution_clip',
          sourceQualityIssueDetected: true,
          targetScale: 2,
          sampleCount: 2,
        },
        slowMotion: {
          selectedClipRanges: baseSlowMotionInput.selectedClipRanges,
          slowMotionFactor: 2,
          interpolationMode: 'film',
        },
      },
    }),
  })
  check(routed.status === 'completed', 'Explicit enhancementSlowMotion worker route must complete in dry-run.')
  check(routed.output?.futureHandler === 'gpu_ai_worker_enhancement_slowmotion_execution', 'Worker router must use explicit M15D GPU enhancement/slow-motion route.')
  check(Boolean(routed.output?.enhancementSlowMotionResult), 'Worker router output must include enhancementSlowMotionResult.')

  const combinedOutput = JSON.stringify({ dryRun, localDev, productionReady, routed }).toLowerCase()
  check(!combinedOutput.includes('revideo'), 'M15D must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'enhancement_policy_forbidden_fields',
      'enhancement_validation_paths_scale_samples',
      'sample_first_planning',
      'skip_safe_real_esrgan_ffmpeg_opencv_sharp',
      'private_enhancement_artifact',
      'slow_motion_factor_and_range_validation',
      'selected_clip_slow_motion_planning',
      'skip_safe_film_ffmpeg_speed',
      'private_interpolated_artifact',
      'dry_run_pipeline',
      'qa_gates',
      'production_blockers',
      'worker_route',
      'no_revideo_runtime',
    ],
    enhancedArtifacts: dryRun.enhancedArtifacts.length,
    interpolatedArtifacts: dryRun.interpolatedArtifacts.length,
    qaResults: dryRun.qaResults.length,
    skippedReasons: localDev.skippedReasons.length,
  }, null, 2))
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata: ProductionWorkerJobPayload['metadata'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${workerType}-m15d-smoke`,
    workspaceId: baseEnhancementInput.workspaceId,
    projectId: baseEnhancementInput.projectId,
    mediaAssetId: baseEnhancementInput.mediaAssetId,
    approvedSnapshotId: baseEnhancementInput.approvedSnapshotId as string,
    toolExecutionPlanId: baseEnhancementInput.toolExecutionPlanId as string,
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: ['real_esrgan', 'film'],
    requestedRecipeIds: ['enhancement_slow_motion_recipe'],
    storageReferenceIds: ['workspaces/workspace-m15d-smoke/projects/project-m15d-smoke/media/source.mp4'],
    requiredQualityGateTypes: ['enhancement_artifacts', 'slow_motion_artifacts', 'render_asset_integrity'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
