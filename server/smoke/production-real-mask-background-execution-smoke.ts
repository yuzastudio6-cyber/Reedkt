import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildBiRefNetCommandPlan,
  buildMaskArtifactRecord,
  buildMaskFallbackDecisions,
  buildMaskTaskPlan,
  buildSam2CommandPlan,
  runBiRefNetMask,
  runKorniaMaskRefinement,
  runOpenCvMaskRefinement,
  runRembgFallback,
  runSam2Tracking,
  runTransparentBackgroundFallback,
  validateMaskExecutionInput,
  validateMaskExecutionPolicy,
} from '../workers/masks'
import type { MaskExecutionInput } from '../workers/masks'
import {
  buildDepthCompositionManifest,
  buildTextLayerPlan,
  isUnsafeTextContent,
  validateTextBehindSubjectPolicy,
} from '../workers/text-behind-subject'
import { runMaskCompositionPipeline } from '../workers/mask-composition'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

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

const baseInput: MaskExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m15c-smoke',
  projectId: 'project-m15c-smoke',
  mediaAssetId: 'media-m15c-smoke',
  approvedSnapshotId: 'approved-snapshot-m15c-smoke',
  toolExecutionPlanId: 'tool-execution-m15c-smoke',
  idempotencyKey: 'idempotency-m15c-smoke',
  sourceImageArtifactId: 'source-image-artifact-m15c-smoke',
  sourceVideoArtifactId: 'source-video-artifact-m15c-smoke',
  proxyVideoArtifactId: 'proxy-video-artifact-m15c-smoke',
  representativeFrameArtifactIds: ['frame-a', 'frame-b'],
  maskIntent: 'background_removal_image',
  subjectSelection: {
    boundingBox: { x: 0.25, y: 0.15, width: 0.45, height: 0.7 },
    approvedSubjectLabel: 'main speaker',
    frameTimeSeconds: 0,
  },
  maskConfidenceHint: 0.86,
  frameSamplingMaxFrames: 24,
}

await expectRejects(
  () => validateMaskExecutionPolicy({ ...baseInput, rawPrompt: 'remove background' }),
  'Mask execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateMaskExecutionPolicy({ ...baseInput, signedUrl: 'https://storage.example/mask.png?X-Goog-Signature=abc' }),
  'Mask execution policy must reject signedUrl.',
)
const arbitraryModelPolicy = validateMaskExecutionPolicy({ ...baseInput, arbitraryModelArgs: ['--download-model'] })
check(!arbitraryModelPolicy.allowed && arbitraryModelPolicy.blockingReasons.includes('arbitrary_model_args_blocked'), 'Mask policy must reject arbitrary model args.')
const arbitraryFfmpegPolicy = validateMaskExecutionPolicy({ ...baseInput, arbitraryFfmpegArgs: ['-filter_complex', 'unsafe'] })
check(!arbitraryFfmpegPolicy.allowed && arbitraryFfmpegPolicy.blockingReasons.includes('arbitrary_ffmpeg_args_blocked'), 'Mask policy must reject arbitrary FFmpeg args.')
const modelDownloadPolicy = validateMaskExecutionPolicy({ ...baseInput, allowModelDownload: true })
check(!modelDownloadPolicy.allowed && modelDownloadPolicy.blockingReasons.includes('model_download_blocked_in_m15c'), 'Mask policy must reject allowModelDownload=true.')
const finalRenderPolicy = validateMaskExecutionPolicy({ ...baseInput, allowFinalRender: true })
check(!finalRenderPolicy.allowed && finalRenderPolicy.blockingReasons.includes('final_render_blocked_in_m15c'), 'Mask policy must reject allowFinalRender=true.')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-m15c-smoke-'))
try {
  check(!validateMaskExecutionInput({
    ...baseInput,
    mode: 'local_dev',
    sourceImageLocalPath: path.join(tempRoot, 'mask-image.png'),
    outputDirectory: tempRoot,
  }).valid, 'Mask validator must reject source/proxy overwrite.')
  check(!validateMaskExecutionInput({ ...baseInput, modelLocalPaths: ['..\\unsafe-model'] }).valid, 'Mask validator must reject unsafe local/model paths.')
  check(!validateMaskExecutionInput({
    ...baseInput,
    maskIntent: 'background_removal_video',
    selectedPrimaryTool: 'sam2',
    subjectSelection: undefined,
  }).valid, 'Mask validator must require structured subjectSelection for promptable tracking.')
  check(!validateMaskExecutionInput({ ...baseInput, frameSamplingMaxFrames: 1000 }).valid, 'Mask validator must enforce frame count guards.')

  const imagePlan = buildMaskTaskPlan(baseInput)
  check(imagePlan.primaryTool === 'birefnet', 'Mask planner must choose BiRefNet for image cutout/background removal.')
  check(imagePlan.expectedArtifacts.includes('mask_image'), 'Image mask plan must expect mask_image.')

  const videoPlan = buildMaskTaskPlan({
    ...baseInput,
    maskIntent: 'background_removal_video',
    motionRequiresTracking: true,
  })
  check(videoPlan.primaryTool === 'birefnet' && videoPlan.fallbackTools.includes('sam2'), 'Video mask plan must include BiRefNet plus SAM2/tracking fallback.')
  check(videoPlan.temporalSmoothingPlan.trackingRequired, 'Video mask plan must require tracking when motion needs it.')
  check(videoPlan.videoFrameSamplingPolicy.maxFrames <= 300 && !videoPlan.videoFrameSamplingPolicy.fullResolutionEveryFrame, 'Mask planner must enforce frame sampling guard.')

  const birefnetPlan = buildBiRefNetCommandPlan({ executionInput: baseInput, taskPlan: imagePlan })
  check(birefnetPlan.executes === false && birefnetPlan.args.includes('--no-download'), 'BiRefNet command plan must be non-executing and no-download.')
  const sam2Plan = buildSam2CommandPlan({ executionInput: { ...baseInput, maskIntent: 'background_removal_video' }, taskPlan: videoPlan })
  check(sam2Plan.executes === false && sam2Plan.args.includes('--no-download'), 'SAM2 command plan must be non-executing and no-download.')

  const localDevInput: MaskExecutionInput = {
    ...baseInput,
    mode: 'local_dev',
    enableModelMaskExecution: true,
    outputDirectory: tempRoot,
    sourceImageLocalPath: path.join(tempRoot, 'missing-frame.png'),
  }
  const birefnet = await runBiRefNetMask({ executionInput: localDevInput, taskPlan: imagePlan })
  check(birefnet.status === 'skipped' && birefnet.skipReason?.code === 'birefnet_model_missing', 'BiRefNet runner must skip gracefully if unavailable/unapproved/no model.')
  const sam2 = await runSam2Tracking({ executionInput: { ...localDevInput, maskIntent: 'background_removal_video' }, taskPlan: videoPlan })
  check(sam2.status === 'skipped' && sam2.skipReason?.code === 'sam2_checkpoint_missing', 'SAM2 runner must skip gracefully if unavailable/unapproved/no checkpoint.')
  const transparent = await runTransparentBackgroundFallback({ executionInput: localDevInput, taskPlan: imagePlan })
  check(transparent.status === 'skipped', 'transparent-background adapter must skip gracefully if unavailable.')
  const rembg = await runRembgFallback({ executionInput: localDevInput, taskPlan: imagePlan })
  check(rembg.status === 'skipped', 'rembg adapter must skip gracefully if unavailable.')
  const opencv = await runOpenCvMaskRefinement({ executionInput: localDevInput, taskPlan: imagePlan })
  check(opencv.status === 'skipped', 'OpenCV refinement adapter must skip gracefully if unavailable.')
  const kornia = await runKorniaMaskRefinement({ executionInput: localDevInput, taskPlan: videoPlan })
  check(kornia.status === 'skipped', 'Kornia refinement adapter must skip gracefully if unavailable.')

  const weakTextPlan = buildMaskTaskPlan({
    ...baseInput,
    maskIntent: 'text_behind_subject',
    motionRequiresTracking: true,
    maskConfidenceHint: 0.62,
  })
  const fallback = buildMaskFallbackDecisions({ taskPlan: weakTextPlan, maskConfidence: 0.62, temporalStabilityScore: 0.58 })
  check(fallback.some((decision) => decision.action === 'normal_foreground_text') && fallback.some((decision) => decision.action === 'side_panel'), 'Fallback policy must downgrade weak text-behind-subject masks.')

  const maskImage = buildMaskArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'mask_image',
    fileName: 'mask-image.png',
  })
  const maskSequence = buildMaskArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'mask_sequence',
    fileName: 'mask-sequence.json',
  })
  const rgbaCutout = buildMaskArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'rgba_cutout',
    fileName: 'rgba-cutout.png',
  })
  check(maskImage.isPrivate && maskImage.artifactType === 'mask_image', 'Mask artifact writer must create private mask_image refs.')
  check(maskSequence.isPrivate && maskSequence.artifactType === 'mask_sequence', 'Mask artifact writer must create private mask_sequence refs.')
  check(rgbaCutout.isPrivate && rgbaCutout.artifactType === 'rgba_cutout', 'Mask artifact writer must create private rgba_cutout refs.')

  const textInput = {
    mode: 'dry_run' as const,
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    approvedSnapshotId: baseInput.approvedSnapshotId,
    toolExecutionPlanId: baseInput.toolExecutionPlanId,
    idempotencyKey: baseInput.idempotencyKey,
    maskSequenceArtifactId: maskSequence.id,
    sourceVideoArtifactId: baseInput.sourceVideoArtifactId,
    proxyVideoArtifactId: baseInput.proxyVideoArtifactId,
    textContent: 'Behind the founder',
    textStylePreset: 'clean_title' as const,
    placementPolicy: 'behind_subject_center' as const,
    maskConfidence: 0.9,
    allowFinalRender: false,
  }
  const lowConfidencePolicy = validateTextBehindSubjectPolicy({ ...textInput, maskConfidence: 0.5 })
  check(!lowConfidencePolicy.allowed && lowConfidencePolicy.blockingReasons.includes('mask_confidence_too_low_for_text_behind_subject'), 'Text-behind-subject policy must block low-confidence masks.')
  check(isUnsafeTextContent('<script>alert(1)</script>'), 'Unsafe text detection must catch script-like text.')
  await expectRejects(
    () => buildTextLayerPlan({ ...textInput, textContent: '<script>alert(1)</script>' }),
    'Text layer builder must reject unsafe text/script injection.',
  )
  const textLayer = buildTextLayerPlan(textInput)
  const manifest = buildDepthCompositionManifest({ executionInput: textInput, textLayerPlan: textLayer, maskArtifactIds: [maskSequence.id] })
  check(manifest.renderEngineHandoff.revideoUsed === false && manifest.renderEngineHandoff.finalRenderAllowed === false, 'Depth composition manifest must be metadata-only and not render.')

  const dryRun = await runMaskCompositionPipeline({
    ...baseInput,
    maskIntent: 'text_behind_subject',
    motionRequiresTracking: true,
    maskConfidenceHint: 0.9,
    textBehindSubject: textInput,
  })
  check(dryRun.status === 'dry_run' || dryRun.status === 'blocked', 'Dry-run pipeline must build mask plan/artifacts/QA without tools.')
  check(Boolean(dryRun.maskTaskPlan), 'Dry-run pipeline must include mask task plan.')
  check(dryRun.maskArtifacts.some((artifact) => artifact.artifactType === 'mask_sequence'), 'Dry-run text-behind-subject must include mask_sequence artifact ref.')
  check(dryRun.maskArtifacts.some((artifact) => artifact.artifactType === 'render_manifest'), 'Dry-run text-behind-subject must include render_manifest depth metadata.')
  check(Boolean(dryRun.depthCompositionManifest), 'Dry-run pipeline must build depth composition metadata.')

  const localDev = await runMaskCompositionPipeline(localDevInput)
  check(localDev.skippedReasons.some((reason) => reason.code === 'birefnet_model_missing'), 'local_dev model execution must skip gracefully if tools/models are unavailable.')

  for (const gateType of ['mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity'] as const) {
    check(dryRun.qaResults.some((gate) => gate.gateType === gateType), `Mask QA must emit ${gateType}.`)
  }

  const productionReady = await runMaskCompositionPipeline({
    ...baseInput,
    mode: 'production_ready',
    modelWeightManifestIds: [],
    readinessReport: { overallStatus: 'blocked', blockers: ['model_weight_missing'], blockerSummaries: [] },
  })
  check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness/model-weight blockers exist.')

  const routed = await runProductionWorkerRuntime({
    payload: buildPayload('gpu_ai_worker', {
      maskComposition: {
        mode: 'dry_run',
        maskIntent: 'background_removal_image',
        sourceImageArtifactId: baseInput.sourceImageArtifactId,
        representativeFrameArtifactIds: baseInput.representativeFrameArtifactIds,
        subjectSelection: baseInput.subjectSelection,
        maskConfidenceHint: 0.86,
      },
    }),
  })
  check(routed.status === 'completed', 'Explicit maskComposition worker route must complete in dry-run.')
  check(routed.output?.futureHandler === 'gpu_ai_worker_mask_composition_execution', 'Worker router must use explicit M15C GPU mask route.')
  check(Boolean(routed.output?.maskCompositionResult), 'Worker router output must include maskCompositionResult.')

  const combinedOutput = JSON.stringify({ dryRun, localDev, productionReady, routed }).toLowerCase()
  check(!combinedOutput.includes('revideo') || combinedOutput.includes('"revideoUsed":false'.toLowerCase()), 'M15C must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'policy_forbidden_fields',
      'validation_overwrite_paths_subject_frame_guard',
      'birefnet_image_plan',
      'birefnet_sam2_video_plan',
      'skip_safe_model_adapters',
      'fallback_weak_text_mask',
      'private_mask_artifacts',
      'text_policy_and_injection_block',
      'metadata_only_depth_manifest',
      'dry_run_pipeline',
      'mask_qa_gates',
      'production_blockers',
      'worker_route',
      'no_revideo_runtime',
    ],
    artifacts: dryRun.maskArtifacts.length,
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
    jobId: `job-${workerType}-m15c-smoke`,
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
    requestedToolIds: workerType === 'gpu_ai_worker' ? ['birefnet'] : ['opencv'],
    requestedRecipeIds: ['background_removal_image_recipe'],
    storageReferenceIds: ['workspaces/workspace-m15c-smoke/projects/project-m15c-smoke/media/source.png'],
    requiredQualityGateTypes: ['mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
