import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  buildWorkerIdempotencyKey,
  runProductionWorkerRuntime,
} from '../workers/production'
import type { ProductionWorkerJobPayload } from '../workers/production'
import {
  buildColorAnalysisSummary,
  buildColorArtifactRecord,
  buildColorCorrectionPlan,
  buildColorExecutionPlan,
  buildColorLookTransformPlan,
  buildColorShotMatchPlan,
  buildFFmpegColorPreviewCommandPlan,
  runOpenColorIOTransform,
  runOpenImageIOFrameTransform,
  validateColorExecutionInput,
  validateColorExecutionPolicy,
} from '../workers/color'
import type { ColorExecutionInput } from '../workers/color'
import { runColorExecutionPipeline } from '../workers/color-execution'

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

const baseInput: ColorExecutionInput = {
  mode: 'dry_run',
  workspaceId: 'workspace-m15b-smoke',
  projectId: 'project-m15b-smoke',
  mediaAssetId: 'media-m15b-smoke',
  approvedSnapshotId: 'approved-snapshot-m15b-smoke',
  toolExecutionPlanId: 'tool-execution-m15b-smoke',
  idempotencyKey: 'idempotency-m15b-smoke',
  sourceVideoArtifactId: 'source-video-artifact-m15b-smoke',
  proxyVideoArtifactId: 'proxy-video-artifact-m15b-smoke',
  representativeFrameArtifactIds: ['frame-a', 'frame-b'],
  sourceStorageObjectPath: 'workspaces/workspace-m15b-smoke/projects/project-m15b-smoke/media/proxy.mp4',
  colorGradeStyle: 'premium_clean',
  colorIntensity: 0.35,
  lutStrength: 0.25,
  mockAnalysis: {
    representativeFrameCount: 2,
    colorSpaceAssumption: 'bt709',
    transferAssumption: 'bt709',
    hdrDetected: false,
    underexposed: false,
    overexposed: false,
    whiteBalanceIssue: true,
    shotMismatch: true,
    skinToneRisk: 'unknown',
    highlightRisk: 'low',
    shadowRisk: 'low',
    saturationRisk: 'low',
    confidence: 0.54,
    advancedAnalysisRan: false,
  },
}

await expectRejects(
  () => validateColorExecutionPolicy({ ...baseInput, rawPrompt: 'grade this' }),
  'Color execution policy must reject rawPrompt.',
)
await expectRejects(
  () => validateColorExecutionPolicy({ ...baseInput, signedUrl: 'https://storage.example/proxy.mp4?X-Goog-Signature=abc' }),
  'Color execution policy must reject signedUrl.',
)
const arbitraryPolicy = validateColorExecutionPolicy({ ...baseInput, arbitraryFfmpegArgs: ['-filter_complex', 'unsafe'] })
check(!arbitraryPolicy.allowed && arbitraryPolicy.blockingReasons.includes('arbitrary_ffmpeg_args_blocked'), 'Color policy must reject arbitrary FFmpeg args.')
const arbitraryLutPolicy = validateColorExecutionPolicy({ ...baseInput, arbitraryLutArgs: ['--creative-overdrive'] })
check(!arbitraryLutPolicy.allowed && arbitraryLutPolicy.blockingReasons.includes('arbitrary_lut_args_blocked'), 'Color policy must reject arbitrary LUT args.')
const finalExportPolicy = validateColorExecutionPolicy({ ...baseInput, allowFinalExport: true })
check(!finalExportPolicy.allowed && finalExportPolicy.blockingReasons.includes('final_export_blocked_in_m15b'), 'Color policy must reject allowFinalExport=true.')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-m15b-smoke-'))
try {
  const overwriteInput = {
    ...baseInput,
    mode: 'local_dev' as const,
    proxyVideoLocalPath: path.join(tempRoot, 'graded-preview.mp4'),
    outputDirectory: tempRoot,
  }
  check(!validateColorExecutionInput(overwriteInput).valid, 'Color validator must reject source/proxy overwrite.')
  check(!validateColorExecutionInput({ ...baseInput, lutLocalPath: '..\\unsafe.cube' }).valid, 'Color validator must reject unsafe LUT paths.')
  check(!validateColorExecutionInput({ ...baseInput, lutStrength: 0.9 }).valid, 'Color validator must reject unsafe LUT strength.')

  const analysis = buildColorAnalysisSummary(baseInput)
  check(!analysis.advancedAnalysisRan, 'Color analysis summary must not claim advanced analysis with mock evidence.')
  check(analysis.issues.some((issue) => issue.code === 'advanced_color_analysis_not_run'), 'Color analysis must record placeholder analysis issue.')

  const correctionPlan = buildColorCorrectionPlan({ executionInput: baseInput, analysis })
  check(correctionPlan.cleanFirst, 'Color correction plan must be clean-first.')
  check(correctionPlan.operations[0]?.operationType === 'exposure_correction', 'Color correction must begin with clean exposure correction.')
  check(correctionPlan.operations.some((operation) => operation.operationType === 'skin_tone_protection'), 'Color correction must include skin tone protection.')

  const shotMatch = buildColorShotMatchPlan({ executionInput: baseInput, analysis })
  check(shotMatch.enabled && shotMatch.operations.length >= 3, 'Shot match planner must create match operations when multiple clips/reference evidence exists.')

  const lookPlan = buildColorLookTransformPlan({ ...baseInput, lutStrength: 0.9 })
  check(lookPlan.lutStrength === 0.6, 'Look transform planner must cap LUT strength.')
  check(lookPlan.operations.some((operation) => operation.operationType === 'look_transform'), 'Look transform planner must create look operations for non-default style.')

  const executionPlan = buildColorExecutionPlan(baseInput)
  const exposureIndex = executionPlan.selectedOperations.indexOf('exposure_correction')
  const lookIndex = executionPlan.selectedOperations.indexOf('look_transform')
  check(exposureIndex >= 0 && lookIndex >= 0 && exposureIndex < lookIndex, 'Execution plan must apply clean correction before look transform.')
  check(executionPlan.finalExportAllowed === false, 'Color execution plan must never allow final export.')

  const commandPlan = buildFFmpegColorPreviewCommandPlan({ executionInput: baseInput, executionPlan })
  check(commandPlan.executes === false, 'FFmpeg color command builder must not execute by itself.')
  check(commandPlan.args.includes('-vf'), 'FFmpeg color command must include an allowlisted video filter.')
  check(commandPlan.args.join(' ').includes('eq='), 'FFmpeg color command must use allowlisted eq filter.')
  check(!commandPlan.args.join(' ').includes('filter_complex'), 'FFmpeg color command must not include arbitrary filter_complex args.')
  await expectRejects(
    () => buildFFmpegColorPreviewCommandPlan({ executionInput: { ...baseInput, allowFinalExport: true }, executionPlan }),
    'FFmpeg color command builder must refuse final export.',
  )

  const dryRun = await runColorExecutionPipeline(baseInput)
  check(dryRun.status === 'dry_run' || dryRun.status === 'blocked', 'Dry-run color pipeline must run without FFmpeg/OpenColorIO.')
  check(Boolean(dryRun.executionPlan), 'Dry-run color pipeline must build an execution plan.')
  check(Boolean(dryRun.colorAnalysisSummary), 'Dry-run color pipeline must build analysis summary.')
  check(dryRun.artifacts.some((artifact) => artifact.artifactType === 'color_analysis_json'), 'Dry-run must create color analysis artifact metadata.')
  check(dryRun.artifacts.some((artifact) => artifact.artifactType === 'color_grade_recipe'), 'Dry-run must create color grade recipe artifact metadata.')

  const localSkip = await runColorExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    proxyVideoLocalPath: path.join(tempRoot, 'missing-proxy.mp4'),
    outputDirectory: tempRoot,
    enableFfmpegColorPreview: true,
  })
  check(localSkip.skippedReasons.some((reason) => reason.code === 'local_video_missing'), 'local_dev FFmpeg preview must skip gracefully when source is missing.')

  const ffmpegFixtureStatus = await maybeRunGeneratedFfmpegFixture(tempRoot)

  const ocio = await runOpenColorIOTransform({ executionInput: baseInput })
  check(ocio.status === 'skipped' && ocio.skipReason?.tool === 'opencolorio', 'OpenColorIO adapter must skip gracefully if unavailable/unenabled.')
  const oiio = await runOpenImageIOFrameTransform({ executionInput: baseInput })
  check(oiio.status === 'skipped' && oiio.skipReason?.tool === 'openimageio', 'OpenImageIO adapter must skip gracefully if unavailable/unenabled.')

  const analysisRecord = buildColorArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'color_analysis_json',
    fileName: 'color-analysis.json',
    contentType: 'application/json',
  })
  const recipeRecord = buildColorArtifactRecord({
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId,
    artifactType: 'color_grade_recipe',
    fileName: 'color-grade-recipe.json',
    contentType: 'application/json',
  })
  check(analysisRecord.isPrivate && analysisRecord.artifactType === 'color_analysis_json', 'Color artifact writer must create private color_analysis_json refs.')
  check(recipeRecord.isPrivate && recipeRecord.artifactType === 'color_grade_recipe', 'Color artifact writer must create private color_grade_recipe refs.')

  for (const gateType of ['color_exposure', 'color_skin_tone', 'color_export_space', 'color_shot_match'] as const) {
    check(dryRun.qaResults.some((gate) => gate.gateType === gateType), `Color QA must emit ${gateType}.`)
  }

  const productionBlocked = await runColorExecutionPipeline({ ...baseInput, mode: 'production_blocked' })
  check(productionBlocked.status === 'blocked', 'production_blocked must refuse real color execution.')
  const productionReady = await runColorExecutionPipeline({
    ...baseInput,
    mode: 'production_ready',
    readinessReport: { overallStatus: 'blocked', blockers: ['ffmpeg_lgpl_pending'], blockerSummaries: [] },
  })
  check(productionReady.status === 'blocked', 'production_ready must remain blocked when readiness/manual-review blockers exist.')

  const routed = await runProductionWorkerRuntime({
    payload: buildPayload('cpu_analysis_worker', {
      colorExecution: {
        mode: 'dry_run',
        sourceVideoArtifactId: baseInput.sourceVideoArtifactId,
        representativeFrameArtifactIds: baseInput.representativeFrameArtifactIds,
        mockAnalysis: baseInput.mockAnalysis,
      },
    }),
  })
  check(routed.status === 'completed', 'Explicit colorExecution worker route must complete in dry-run.')
  check(routed.output?.futureHandler === 'cpu_analysis_worker_color_execution', 'Worker router must use explicit M15B CPU color route.')
  check(Boolean(routed.output?.colorExecutionResult), 'Worker router output must include colorExecutionResult.')

  const combinedOutput = JSON.stringify({ dryRun, productionBlocked, routed }).toLowerCase()
  check(!combinedOutput.includes('revideo'), 'M15B color execution must not use Revideo.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'policy_forbidden_fields',
      'validation_source_overwrite_lut',
      'honest_analysis_summary',
      'clean_first_correction',
      'shot_match_plan',
      'look_strength_cap',
      'ffmpeg_command_plan_allowlisted_non_executing',
      'dry_run_pipeline',
      'local_dev_preview_skip_safe',
      'opencolorio_openimageio_skip_safe',
      'private_artifacts',
      'color_qa_gates',
      'production_blockers',
      'worker_route',
      'no_revideo_runtime',
    ],
    ffmpegFixtureStatus,
    artifacts: dryRun.artifacts.length,
    qaResults: dryRun.qaResults.length,
  }, null, 2))
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

async function maybeRunGeneratedFfmpegFixture(root: string): Promise<string> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000, maxBuffer: 512 * 1024, windowsHide: true })
  } catch {
    return 'ffmpeg_unavailable_skipped'
  }

  const source = path.join(root, 'generated-proxy.mp4')
  try {
    await execFileAsync('ffmpeg', [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=160x90:rate=15:duration=2',
      '-pix_fmt',
      'yuv420p',
      source,
    ], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true })
  } catch {
    return 'ffmpeg_available_fixture_generation_skipped'
  }

  const result = await runColorExecutionPipeline({
    ...baseInput,
    mode: 'local_dev',
    proxyVideoLocalPath: source,
    outputDirectory: root,
    enableFfmpegColorPreview: true,
    timeoutMs: 20_000,
  })
  check(result.gradedPreviewArtifact?.artifactType === 'graded_preview' || result.skippedReasons.length > 0 || result.status === 'blocked', 'local_dev FFmpeg fixture should create preview or return structured non-final status.')
  return result.gradedPreviewArtifact ? 'ffmpeg_fixture_preview_completed' : `ffmpeg_fixture_${result.status}`
}

function buildPayload(
  workerType: ProductionWorkerJobPayload['workerType'],
  metadata: ProductionWorkerJobPayload['metadata'],
): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${workerType}-m15b-smoke`,
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
    requestedToolIds: workerType === 'render_worker' ? ['ffmpeg'] : ['ffprobe'],
    requestedRecipeIds: ['color_grade_recipe'],
    storageReferenceIds: [baseInput.sourceStorageObjectPath as string],
    requiredQualityGateTypes: ['color_exposure', 'color_skin_tone', 'color_export_space', 'color_shot_match'],
    createdAt: new Date().toISOString(),
    metadata,
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
