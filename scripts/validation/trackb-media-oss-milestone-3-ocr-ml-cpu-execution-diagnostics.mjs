#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-execution'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const passDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_import_api_shape_no_model_assets'
const modelAssetDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_ready_for_model_asset_approval'
const allowedDecisions = new Set([
  passDecision,
  modelAssetDecision,
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_source_target_drift',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_dependency_hydration',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_build_context_generation',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_generated_artifact_scan',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_docker_build',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddlepaddle_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddleocr_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_model_asset_required',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'source-target-check.json',
  'source-target-check.md',
  'build-context-command-review.json',
  'build-context-command-review.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'build-context-generation-report.json',
  'build-context-generation-report.md',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'paddlepaddle-proof-report.json',
  'paddlepaddle-proof-report.md',
  'paddleocr-api-proof-report.json',
  'paddleocr-api-proof-report.md',
  'model-ocr-boundary-verification.json',
  'model-ocr-boundary-verification.md',
  'cpu-latency-memory-cost-report.json',
  'cpu-latency-memory-cost-report.md',
  'artifact-cleanup-report.json',
  'artifact-cleanup-report.md',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-3-cpu-status-matrix.json',
  'milestone-3-cpu-status-matrix.md',
  'milestone-3-ocr-ml-cpu-execution-decision.json',
  'milestone-3-ocr-ml-cpu-execution-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)
const statusFiles = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const failures = []
function fail(message) {
  failures.push(message)
}
function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}
function readJson(relativePath) {
  const text = readText(relativePath)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${relativePath}:${error.message}`)
    return {}
  }
}
function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
}
function isAllowedFontConfigDockerfileDiff(diff) {
  if (!diff) return true
  const localFontEnv = 'PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
  if (!diff.includes(localFontEnv)) return false

  const changedLines = diff
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
    .map((line) => line.slice(1).trim())

  return changedLines.every((line) =>
    [
      'PROVIDER_EXECUTION_ENABLED=false',
      'PROVIDER_EXECUTION_ENABLED=false \\',
      localFontEnv,
    ].includes(line),
  )
}
function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of [...requiredFiles, ...statusFiles]) readText(file)

const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const buildContext = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const paddlePaddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleOcr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-boundary-verification.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-cpu-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-3-ocr-ml-cpu-execution-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const validation = readJson(`${reportDir}/validation-results.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')

for (const [label, report] of Object.entries({
  source,
  target,
  buildContext,
  hydration,
  generation,
  scan,
  dockerBuild,
  paddlePaddle,
  paddleOcr,
  boundary,
  cleanup,
  safety,
  matrix,
  decision,
  readiness,
  manifest,
  validation,
})) {
  if (!allowedDecisions.has(report.decision)) fail(`decision_unknown:${label}:${report.decision}`)
  if (report.decision !== decision.decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (source.ownerId !== ownerId || decision.ownerId !== ownerId) fail('owner_id_drift')
for (const pr of [578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_merged_source`)
  }
}
for (const pr of [543, 51, 56]) {
  const entry = source.contextOnlyPrs?.find((item) => item.pr === pr)
  if (!entry) fail(`missing_context_only_pr:${pr}`)
}
sameSet(source.tools, ['paddlepaddle', 'paddleocr'], 'source_tools')
sameSet(decision.targetTools, ['paddlepaddle', 'paddleocr'], 'decision_tools')
sameSet(matrix.tools?.map((tool) => tool.id), ['paddlepaddle', 'paddleocr'], 'matrix_tools')

if (target.targetDockerfile !== 'docker/prod/ocr-runtime/Dockerfile') fail('target_dockerfile_drift')
if (target.targetRequirements !== 'docker/prod/ocr-runtime/requirements.ocr.txt') fail('target_requirements_drift')
if (target.packagePresence?.['paddlepaddle==3.0.0'] !== true) fail('paddlepaddle_pin_missing')
if (target.packagePresence?.['paddleocr==3.0.0'] !== true) fail('paddleocr_pin_missing')
if (target.envGuards?.modelDownloadsDisabled !== true) fail('model_download_guard_missing')
if (target.envGuards?.realMediaInputDisabled !== true) fail('real_media_guard_missing')
if (target.envGuards?.providerExecutionDisabled !== true) fail('provider_guard_missing')
if (target.buildContextGenerationRequired !== false || buildContext.buildContextGenerationRequired !== false) {
  fail('build_context_unexpectedly_required')
}
if (hydration.skipped !== true || hydration.nodeModulesCreatedByThisPhase !== false) fail('hydration_scope_drift')
if (generation.skipped !== true || generation.allCommandsPassed !== true) fail('build_context_generation_scope_drift')
if (scan.passed !== true || scan.publicArtifactsCreated !== false || scan.signedUrlsCreated !== false) {
  fail('artifact_scan_scope_drift')
}
if (dockerBuild.dockerImagePushRun !== false) fail('docker_image_push_claimed')
if (paddlePaddle.localHostProbeRun !== false || paddleOcr.localHostProbeRun !== false) fail('local_host_probe_claimed')
if (paddlePaddle.gpuExecutionRun !== false || paddleOcr.gpuExecutionRun !== false) fail('gpu_execution_claimed')
if (paddlePaddle.modelAssetsUsed !== false) fail('paddlepaddle_model_assets_claimed')
if (paddleOcr.ocrInferenceRun !== false) fail('ocr_inference_claimed')
if (paddleOcr.modelDownloadRun !== false || paddleOcr.modelAssetCopyRun !== false || paddleOcr.modelAssetUploadRun !== false) {
  fail('model_asset_operation_claimed')
}
if (boundary.ocrInferenceRun !== false || boundary.modelDownloadRun !== false) fail('boundary_unblocked')
if (cleanup.generatedOutputsCleaned !== true) fail('cleanup_failed')
if (safety.passed !== true) fail('safety_scan_failed')
if (safety.generatedOutputsCommitted !== false || safety.modelFilesCommitted !== false || safety.mediaArtifactsCommitted !== false) {
  fail('unsafe_artifacts_committed')
}
if (decision.endToEndProductReadyTools !== 0 || decision.fortyPlusEndToEndClaimAllowed !== false) {
  fail('product_ready_or_40_plus_claim_drift')
}
if (decision.cpuOnly !== true || decision.gpuRunInThisPhase !== false) fail('cpu_gpu_scope_drift')
if (decision.ocrInferenceRunInThisPhase !== false) fail('decision_ocr_inference_claimed')
if (decision.modelDownloadRunInThisPhase !== false || decision.modelAssetCopyRunInThisPhase !== false || decision.modelAssetUploadRunInThisPhase !== false) {
  fail('decision_model_asset_operation_claimed')
}
if (decision.ffmpegFfprobeCommandRunInThisPhase !== false || decision.otherTrackBToolsRunInThisPhase !== false) {
  fail('other_tool_execution_claimed')
}
if (decision.realUserMediaUsed !== false || decision.realUserDocumentsUsed !== false) fail('real_user_input_claimed')
if (decision.mediaProcessingAccepted !== false || decision.renderExportAccepted !== false) fail('media_render_scope_unblocked')
if (decision.workerRuntimeAccepted !== false || decision.routeProviderRuntimeAccepted !== false) fail('runtime_scope_unblocked')
if (decision.supabaseGcsPublicDeliveryAccepted !== false) fail('supabase_gcs_scope_unblocked')
if (manifest.localDockerImagePushed !== false || manifest.modelFilesCommitted !== false || manifest.mediaFilesCommitted !== false) {
  fail('manifest_artifact_scope_unblocked')
}
if (decision.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decision.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decision.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decision.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (decision.decision === passDecision) {
  if (paddlePaddle.importVersionProven !== true || paddlePaddle.tensorDeviceProven !== true) fail('pass_without_paddlepaddle_proof')
  if (paddleOcr.importApiProven !== true) fail('pass_without_paddleocr_api_proof')
  if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW') fail('pass_next_prompt_drift')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'))) {
    fail('missing_cpu_qa_prompt')
  }
} else if (
  decision.decision === modelAssetDecision ||
  decision.decision === 'trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_model_asset_required'
) {
  if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL') fail('model_asset_next_prompt_drift')
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md'))) {
    fail('missing_model_asset_prompt')
  }
} else if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP') {
  fail('blocker_next_prompt_drift')
}

if (status.counts?.ownedTools !== 16) fail('owned_count_drift')
if (status.counts?.acceptedProvenBounded !== 12) fail('canonical_accepted_count_should_remain_12_until_qa')
if (status.counts?.blockedNotInstalledProven !== 4) fail('canonical_blocked_count_should_remain_4_until_qa')
if (status.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (status.milestone3OcrMlCpuExecution?.decision !== decision.decision) fail('missing_status_json_milestone3_cpu_execution')
if (status.milestone3OcrMlCpuExecution?.canonicalCountsRemainPendingQa !== true) fail('missing_pending_qa_count_boundary')

if (
  packageJson.scripts?.['trackb-media-oss:milestone-3-ocr-ml-cpu-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}
if (
  packageJson.scripts?.['smoke:trackb-media-oss-milestone-3-ocr-ml-cpu-execution'] !==
  'node server/smoke/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-smoke.js'
) {
  fail('missing_package_smoke_script')
}

for (const output of ['dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker', 'node_modules']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const protectedFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
const protectedDiffs = []
for (const protectedFile of protectedFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (
    protectedFile === 'docker/prod/ocr-runtime/Dockerfile' &&
    isAllowedFontConfigDockerfileDiff(diff) &&
    isAllowedFontConfigDockerfileDiff(stagedDiff)
  ) {
    continue
  }
  if (diff || stagedDiff) protectedDiffs.push(protectedFile)
}
if (protectedDiffs.length) fail(`protected_file_diff:${protectedDiffs.join(',')}`)

const textCorpus = [
  ...requiredFiles,
  ...statusFiles,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup.md',
]
  .filter((file) => fs.existsSync(path.join(repoRoot, file)))
  .map((file) => readText(file))
  .join('\n')
const forbiddenClaims = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /OCR inference (?:passed|approved|accepted|enabled)/i,
  /model downloads? (?:passed|approved|accepted|enabled|ran)/i,
  /GPU execution (?:passed|approved|accepted|enabled|ran)/i,
  /beta (?:unlocked|enabled|ready)/i,
  /production (?:unlocked|enabled|ready)/i,
]
for (const pattern of forbiddenClaims) {
  const matchedLine = textCorpus
    .split(/\r?\n/)
    .find((line) => pattern.test(line) && !/\b(?:no|not|never|do not|don’t|cannot|must not)\b/i.test(line))
  if (matchedLine) fail(`forbidden_claim:${pattern}:${matchedLine.trim().slice(0, 160)}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      ownerId,
      targetDockerfile: target.targetDockerfile,
      paddlePaddleImportVersionProven: paddlePaddle.importVersionProven,
      paddlePaddleTensorDeviceProven: paddlePaddle.tensorDeviceProven,
      paddleOcrImportApiProven: paddleOcr.importApiProven,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
