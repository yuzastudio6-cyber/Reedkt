#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const decisionString =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_passed_import_api_shape_no_model_assets'
const modelAssetDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_passed_ready_for_model_asset_approval'
const paddleOcrBlockedDecision =
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_paddleocr_import_or_api_shape'
const allowedDecisions = new Set([
  decisionString,
  modelAssetDecision,
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_source_target_drift',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_package_strategy_review',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_dockerfile_patch',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_docker_build',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_libgl_presence',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_paddlepaddle_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_paddleocr_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_model_asset_required',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredReportFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'libgl-root-cause-review.json',
  'libgl-root-cause-review.md',
  'source-target-check.json',
  'source-target-check.md',
  'dockerfile-patch-report.json',
  'dockerfile-patch-report.md',
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
  'libgl-presence-report.json',
  'libgl-presence-report.md',
  'paddlepaddle-proof-report.json',
  'paddlepaddle-proof-report.md',
  'paddleocr-api-proof-report.json',
  'paddleocr-api-proof-report.md',
  'model-ocr-gpu-boundary-verification.json',
  'model-ocr-gpu-boundary-verification.md',
  'cpu-latency-memory-cost-report.json',
  'cpu-latency-memory-cost-report.md',
  'artifact-cleanup-report.json',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-3-cpu-blocker-resolution-status-matrix.json',
  'milestone-3-cpu-blocker-resolution-status-matrix.md',
  'milestone-3-ocr-ml-cpu-blocker-resolution-decision.json',
  'milestone-3-ocr-ml-cpu-blocker-resolution-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]
const requiredPrompts = [
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup.md',
]
const protectedFiles = [
  'package-lock.json',
  targetRequirements,
  '.dockerignore',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/render-worker/Dockerfile',
]
const forbiddenPaths = [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]
const forbiddenTextPatterns = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /OCR inference (?:passed|enabled|ran)/i,
  /model downloads? (?:passed|enabled|ran|occurred)/i,
  /GPU execution (?:passed|enabled|ran)/i,
  /signed URL(?:s)? (?:created|enabled|accepted|delivered)/i,
  /public artifact(?:s)? (?:created|enabled|accepted|delivered)/i,
  /Supabase write (?:enabled|accepted|ran)/i,
]
const failures = []

function fail(message) {
  failures.push(message)
}

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath)
}

function readText(relativePath) {
  const resolved = fullPath(relativePath)
  if (!fs.existsSync(resolved)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(resolved, 'utf8')
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

for (const file of requiredReportFiles) readText(`${reportDir}/${file}`)
for (const file of requiredPrompts) readText(file)

const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const rootCause = readJson(`${reportDir}/libgl-root-cause-review.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const patch = readJson(`${reportDir}/dockerfile-patch-report.json`)
const context = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const libgl = readJson(`${reportDir}/libgl-presence-report.json`)
const paddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleocr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-boundary-verification.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-cpu-blocker-resolution-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-3-ocr-ml-cpu-blocker-resolution-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const dockerfile = readText(targetDockerfile)
const packageJson = readJson('package.json')
const allReportText = requiredReportFiles
  .map((file) => readText(`${reportDir}/${file}`))
  .join('\n')

for (const [label, report] of Object.entries({
  source,
  rootCause,
  target,
  patch,
  context,
  hydration,
  generation,
  scan,
  dockerBuild,
  libgl,
  paddle,
  paddleocr,
  boundary,
  cleanup,
  safety,
  matrix,
  decision,
  readiness,
  manifest,
})) {
  if (!allowedDecisions.has(report.decision)) fail(`unknown_decision:${label}:${report.decision}`)
  if (report.decision !== decision.decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (decision.decision !== paddleOcrBlockedDecision) fail(`unexpected_final_decision:${decision.decision}`)
if (source.sourceSha !== 'a80edbdc5bcf434b0cd70f9f8bae9523a2e1c1fa') fail('source_sha_drift')
for (const pr of [587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}
if (rootCause.missingLibrary !== 'libGL.so.1') fail('libgl_root_cause_missing')
if (rootCause.selectedPackage !== 'libgl1') fail('selected_package_not_libgl1')
if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.buildContextGenerationRequired !== false) fail('unexpected_build_context_requirement')
if (!/apt-get install -y --no-install-recommends libgomp1 libgl1/.test(dockerfile)) {
  fail('dockerfile_missing_exact_libgomp_libgl_patch')
}
if (/graphicsmagick|ffmpeg|ffprobe|cuda|cudnn/i.test(dockerfile)) fail('dockerfile_contains_forbidden_package_scope')
if (patch.changedFiles?.length !== 1 || patch.changedFiles[0] !== targetDockerfile) fail('patch_changed_files_scope')
if (context.buildContextGenerationRequired !== false) fail('context_claims_generation_required')
if (hydration.npmCiRun !== false) fail('npm_ci_claimed')
if (generation.buildContextGenerationRun !== false) fail('build_context_generation_claimed')
if (scan.generatedArtifactsFound !== false) fail('generated_artifacts_claimed')
if (dockerBuild.exitCode !== 0 || dockerBuild.imagePushed !== false) fail('docker_build_report_invalid')
if (libgl.libGLPresent !== true) fail('libgl_presence_not_proven')
if (paddle.importVersionPassed !== true || paddle.tensorDevicePassed !== true) fail('paddlepaddle_not_proven')
if (paddleocr.importApiShapePassed !== false || paddleocr.ocrInferenceRun !== false) fail('paddleocr_scope_or_result_invalid')
if (paddleocr.blocker !== 'missing_libgthread_2_0_so_0') fail('paddleocr_blocker_drift')
if (boundary.ocrInferenceRun !== false || boundary.modelDownloadRun !== false || boundary.gpuExecutionRun !== false) {
  fail('model_ocr_gpu_boundary_unlocked')
}
if (cleanup.localImageRemoved !== true) fail('local_image_cleanup_not_recorded')
if (safety.passed !== true) fail('safety_scan_not_passed')
if (readiness.nextPrompt !== 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_RESOLUTION_FOLLOWUP') {
  fail('next_prompt_drift')
}
if (manifest.supabaseClassification?.updateRequired !== 'no write') fail('supabase_classification_drift')
if (
  packageJson.scripts?.['trackb-media-oss:milestone-3-ocr-ml-cpu-blocker-resolution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs'
) {
  fail('package_script_missing')
}
for (const item of matrix.tools || []) {
  if (item.ocrInferenceRun !== false || item.modelAssetsDownloaded !== false || item.gpuUsed !== false) {
    fail(`matrix_forbidden_scope:${item.id}`)
  }
}
for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(fullPath(relativePath))) fail(`forbidden_path_present:${relativePath}`)
}
for (const protectedFile of protectedFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
}
const changedFiles = git(['diff', '--name-only', 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit...HEAD'])
  .split('\n')
  .filter(Boolean)
const allowedPrefixes = [
  `${reportDir}/`,
  'docs/cross-chat/',
  'docs/open-source-tool-stack/',
  'docs/implementation-prompts/',
]
const systemFontExecutionValidationScripts = new Set([
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
])
for (const file of changedFiles) {
  const allowed =
    file === targetDockerfile ||
    file === 'docker/prod/cpu-worker/requirements.cpu.txt' ||
    file === 'package.json' ||
    systemFontExecutionValidationScripts.has(file) ||
    allowedPrefixes.some((prefix) => file.startsWith(prefix))
  if (!allowed) fail(`unexpected_changed_file:${file}`)
}
for (const pattern of forbiddenTextPatterns) {
  if (pattern.test(allReportText)) fail(`forbidden_text:${pattern}`)
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
      targetDockerfile,
      selectedPackage: rootCause.selectedPackage,
      dockerBuildExitCode: dockerBuild.exitCode,
      libGLPresent: libgl.libGLPresent,
      paddlePaddleImportVersionProven: paddle.importVersionPassed,
      paddlePaddleTensorDeviceProven: paddle.tensorDevicePassed,
      paddleOcrImportApiShapeProven: paddleocr.importApiShapePassed,
      paddleOcrBlocker: paddleocr.blocker,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: manifest.supabaseClassification,
    },
    null,
    2,
  ),
)
