#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const packageScript = 'trackb-media-oss:milestone-3-ocr-ml-cpu-blocker-resolution-followup:diagnostics'
const allowedDecisions = new Set([
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_passed_import_api_shape_no_model_assets',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_passed_ready_for_model_asset_approval',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_source_target_drift',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_package_strategy_review',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_dockerfile_patch',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_docker_build',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_libgthread_presence',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_paddlepaddle_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_paddleocr_import_or_api_shape',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_model_asset_required',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_resolution_followup_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'libgthread-root-cause-review.json',
  'libgthread-root-cause-review.md',
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
  'libgthread-presence-report.json',
  'libgthread-presence-report.md',
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
  'milestone-3-cpu-blocker-resolution-followup-status-matrix.json',
  'milestone-3-cpu-blocker-resolution-followup-status-matrix.md',
  'milestone-3-ocr-ml-cpu-blocker-resolution-followup-decision.json',
  'milestone-3-ocr-ml-cpu-blocker-resolution-followup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]
const forbiddenPaths = [
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
  'node_modules',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  targetRequirements,
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/render-worker/Dockerfile',
]
const forbiddenTextPatterns = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /OCR inference (?:passed|enabled|ran)/i,
  /model downloads? (?:passed|enabled|ran|occurred)/i,
  /GPU execution (?:passed|enabled|ran)/i,
  /signed URL(?:s)? (?:created|enabled|accepted|delivered)/i,
  /public artifact(?:s)? (?:created|enabled|accepted|delivered)/i,
  /Supabase write (?:enabled|accepted|ran)/i,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
  /\bX-Amz-Signature=/i,
  /BEGIN [A-Z ]*PRIVATE KEY/,
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

function assertDecision(label, report, decision) {
  if (!allowedDecisions.has(report.decision)) fail(`unknown_decision:${label}:${report.decision}`)
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)

const packageJson = readJson('package.json')
const dockerfile = readText(targetDockerfile)
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const rootCause = readJson(`${reportDir}/libgthread-root-cause-review.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const patch = readJson(`${reportDir}/dockerfile-patch-report.json`)
const context = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const libgthread = readJson(`${reportDir}/libgthread-presence-report.json`)
const paddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleocr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-boundary-verification.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-cpu-blocker-resolution-followup-status-matrix.json`)
const decisionReport = readJson(`${reportDir}/milestone-3-ocr-ml-cpu-blocker-resolution-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const decision = decisionReport.decision

if (!allowedDecisions.has(decision)) fail(`unknown_final_decision:${decision}`)
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
  libgthread,
  paddle,
  paddleocr,
  boundary,
  cleanup,
  safety,
  matrix,
  readiness,
  manifest,
})) {
  assertDecision(label, report, decision)
}

if (source.sourceEvidence?.find((entry) => entry.pr === 592)?.state !== 'MERGED') {
  fail('missing_pr_592_source_evidence')
}
for (const pr of [587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}
if (rootCause.missingLibrary !== 'libgthread-2.0.so.0') fail('root_cause_missing_library_drift')
if (rootCause.candidatePackage !== 'libglib2.0-0') fail('root_cause_candidate_package_drift')
if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.buildContextGenerationRequired !== false) fail('unexpected_build_context_requirement')
if (!/apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2\.0-0/.test(dockerfile)) {
  fail('dockerfile_missing_exact_runtime_package_set')
}
if (/graphicsmagick|ffmpeg|ffprobe|cuda|cudnn/i.test(dockerfile)) fail('dockerfile_contains_forbidden_package_scope')
if (patch.changedFiles?.length !== 1 || patch.changedFiles[0] !== targetDockerfile) fail('patch_changed_files_scope')
if (context.buildContextGenerationRequired !== false) fail('context_claims_generation_required')
if (hydration.npmCiRun !== false) fail('npm_ci_claimed')
if (generation.buildContextGenerationRun !== false) fail('build_context_generation_claimed')
if (scan.passed !== true || scan.generatedArtifactsFound !== false) fail('generated_artifact_scan_invalid')
if (dockerBuild.exitCode !== 0 || dockerBuild.dockerImagePushRun !== false) fail('docker_build_report_invalid')
if (libgthread.libgthreadPresent !== true) fail('libgthread_presence_not_proven')
if (paddle.importVersionPassed !== true || paddle.tensorDevicePassed !== true) fail('paddlepaddle_not_proven')
if (paddleocr.ocrInferenceRun !== false || paddleocr.modelDownloadRun !== false) {
  fail('paddleocr_forbidden_scope')
}
if (decision.endsWith('_passed_import_api_shape_no_model_assets') && paddleocr.importApiShapePassed !== true) {
  fail('pass_decision_without_paddleocr_api_shape')
}
if (decision.endsWith('_blocked_by_paddleocr_import_or_api_shape') && paddleocr.importApiShapePassed !== false) {
  fail('paddleocr_blocked_decision_but_api_shape_passed')
}
if (
  boundary.ocrInferenceRun !== false ||
  boundary.modelDownloadRun !== false ||
  boundary.modelAssetCopyRun !== false ||
  boundary.modelAssetUploadRun !== false ||
  boundary.gpuExecutionRun !== false
) {
  fail('model_ocr_gpu_boundary_unlocked')
}
if (cleanup.generatedOutputsCleaned !== true) fail('cleanup_not_passed')
if (safety.passed !== true) fail('safety_scan_not_passed')
if (manifest.supabaseClassification?.updateRequired !== 'no write') fail('supabase_classification_drift')
if (packageJson.scripts?.[packageScript] !== 'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs') {
  fail('package_script_missing')
}
const nextPromptPath =
  readiness.nextPrompt === 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
    ? 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'
    : readiness.nextPrompt === 'TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL'
      ? 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-model-asset-approval.md'
      : 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-next-followup.md'
if (!fs.existsSync(fullPath(nextPromptPath))) fail(`missing_next_prompt:${nextPromptPath}`)

for (const item of matrix.tools || []) {
  if (item.ocrInferenceRun !== false || item.modelAssetsDownloaded !== false || item.gpuUsed !== false) {
    fail(`matrix_forbidden_scope:${item.id}`)
  }
}
for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(fullPath(relativePath))) fail(`forbidden_path_present:${relativePath}`)
}
for (const protectedFile of protectedNoDiffFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
}
const changedFiles = git(['diff', '--name-only', 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit...HEAD'])
  .split('\n')
  .filter(Boolean)
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
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
])
for (const file of changedFiles) {
  const allowed =
    file === targetDockerfile ||
    file === 'docker/prod/cpu-worker/requirements.cpu.txt' ||
    file === 'package.json' ||
    systemFontExecutionValidationScripts.has(file) ||
    file.startsWith('server/activation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup/') ||
    file.startsWith(`${reportDir}/`) ||
    file.startsWith('docs/cross-chat/') ||
    file.startsWith('docs/open-source-tool-stack/') ||
    file.startsWith('docs/implementation-prompts/')
  if (!allowed && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
}
const allReportText = requiredReports.map((file) => readText(`${reportDir}/${file}`)).join('\n')
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
      decision,
      targetDockerfile,
      selectedPackage: rootCause.candidatePackage,
      dockerBuildExitCode: dockerBuild.exitCode,
      libgthreadPresent: libgthread.libgthreadPresent,
      paddlePaddleImportVersionPassed: paddle.importVersionPassed,
      paddlePaddleTensorDevicePassed: paddle.tensorDevicePassed,
      paddleOcrImportApiShapePassed: paddleocr.importApiShapePassed,
      paddleOcrBlocker: paddleocr.blocker,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: manifest.supabaseClassification,
    },
    null,
    2,
  ),
)
