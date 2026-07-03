#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-system-font-package-execution'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const packageScript = 'trackb-media-oss:milestone-3-system-font-package-execution:diagnostics'
const scriptTarget =
  'node scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs'
const allowedDecisions = new Set([
  'trackb_media_oss_milestone3_system_font_package_execution_passed_import_api_shape_no_model_assets',
  'trackb_media_oss_milestone3_system_font_package_execution_passed_ready_for_ocr_ml_cpu_qa_review',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_source_target_drift',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_dockerfile_patch',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_docker_build',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_font_package_install',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_font_discovery',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_paddlepaddle_import_or_api_shape',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_paddleocr_import_or_api_shape',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_model_asset_required',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_ocr_inference_boundary',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_artifact_cleanup',
  'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_safety_scan',
  'rejected_due_runtime_safety_risk',
])
const passDecisions = new Set([
  'trackb_media_oss_milestone3_system_font_package_execution_passed_import_api_shape_no_model_assets',
  'trackb_media_oss_milestone3_system_font_package_execution_passed_ready_for_ocr_ml_cpu_qa_review',
])
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
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
  'font-package-presence-report.json',
  'font-package-presence-report.md',
  'paddlepaddle-proof-report.json',
  'paddlepaddle-proof-report.md',
  'paddleocr-api-proof-report.json',
  'paddleocr-api-proof-report.md',
  'model-ocr-gpu-network-boundary-verification.json',
  'model-ocr-gpu-network-boundary-verification.md',
  'cpu-latency-memory-cost-report.json',
  'cpu-latency-memory-cost-report.md',
  'artifact-cleanup-report.json',
  'safety-scan-report.json',
  'safety-scan-report.md',
  'milestone-3-system-font-execution-status-matrix.json',
  'milestone-3-system-font-execution-status-matrix.md',
  'system-font-package-execution-decision.json',
  'system-font-package-execution-decision.md',
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
const forbiddenAssetExtensions = [
  '.ttf',
  '.otf',
  '.ttc',
  '.woff',
  '.woff2',
  '.onnx',
  '.pdmodel',
  '.pdiparams',
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
]
const forbiddenTextPatterns = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /fonts-noto-cjk-extra (?:installed|proved|accepted|selected as primary)/i,
  /PingFang-SC-Regular\.ttf (?:downloaded|copied|uploaded|staged|committed|used)/i,
  /OCR inference (?:passed|enabled|ran|accepted|approved)/i,
  /model assets? (?:downloaded|copied|uploaded|staged|committed)/i,
  /font assets? (?:downloaded|copied|uploaded|staged|committed)/i,
  /GPU (?:execution|job) (?:passed|enabled|ran|accepted|approved)/i,
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

function isGuardrailLine(line) {
  return /\b(no|not|never|blocked|failed|did not|without|false|remain|future-only|future only|fallback-only|unproven|disallowed)\b/i.test(
    line,
  )
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)

const packageJson = readJson('package.json')
const dockerfile = readText(targetDockerfile)
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const patch = readJson(`${reportDir}/dockerfile-patch-report.json`)
const context = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const fontPresence = readJson(`${reportDir}/font-package-presence-report.json`)
const paddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleocr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-network-boundary-verification.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-system-font-execution-status-matrix.json`)
const decisionReport = readJson(`${reportDir}/system-font-package-execution-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const decision = decisionReport.decision

if (!allowedDecisions.has(decision)) fail(`unknown_decision:${decision}`)
for (const [label, report] of Object.entries({
  source,
  target,
  patch,
  context,
  hydration,
  generation,
  scan,
  dockerBuild,
  fontPresence,
  paddle,
  paddleocr,
  boundary,
  cleanup,
  safety,
  matrix,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (packageJson.scripts?.[packageScript] !== scriptTarget) fail('missing_or_invalid_package_script')
if (source.sourceSha !== 'a4574560fa04fde80f1473f837f98cdc757d177e') fail(`source_sha_drift:${source.sourceSha}`)
for (const pr of [620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}
if (source.duplicateSearches?.systemFontExecution?.length !== 0) fail('duplicate_execution_prompt_recorded')
if (source.duplicateSearches?.fontsNotoCjk?.length !== 0) fail('duplicate_fonts_noto_cjk_recorded')

if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.buildContextGenerationRequired !== false) fail('unexpected_build_context_requirement')
if (!/FROM python:3\.12-slim/.test(dockerfile)) fail('unexpected_ocr_runtime_base_image')
if (!/libgomp1 libgl1 libglib2\.0-0 fonts-noto-cjk/.test(dockerfile)) {
  fail('dockerfile_missing_required_package_set')
}
if (/fonts-noto-cjk-extra|PingFang-SC-Regular|cuda|cudnn|graphicsmagick|ffmpeg|ffprobe/i.test(dockerfile)) {
  fail('dockerfile_contains_forbidden_scope')
}
if (patch.changedFiles?.length !== 1 || patch.changedFiles[0] !== targetDockerfile) fail('patch_scope_drift')
if (context.buildContextGenerationRequired !== false) fail('context_claims_generation_required')
if (hydration.npmCiRun !== false) fail('npm_ci_claimed')
if (generation.buildContextGenerationRun !== false) fail('build_context_generation_claimed')
if (scan.passed !== true || scan.generatedArtifactsFound !== false) fail('generated_artifact_scan_invalid')
if (dockerBuild.imagePushed !== false) fail('docker_image_push_claimed')

if (passDecisions.has(decision)) {
  if (dockerBuild.exitCode !== 0) fail('pass_decision_without_successful_docker_build')
  if (fontPresence.fontsNotoCjkPresent !== true) fail('pass_decision_without_fonts_noto_cjk')
  if (paddle.importVersionPassed !== true || paddle.tensorDevicePassed !== true) fail('pass_decision_without_paddlepaddle')
  if (paddleocr.importApiShapePassed !== true) fail('pass_decision_without_paddleocr_api_shape')
} else if (decision === 'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_docker_build') {
  if (dockerBuild.exitCode === 0) fail('docker_build_blocker_but_build_passed')
  if (fontPresence.checkRun !== false || paddle.proofRun !== false || paddleocr.proofRun !== false) {
    fail('post_docker_build_proofs_ran_after_failed_build')
  }
}

if (fontPresence.fontsNotoCjkExtraPresent === true) fail('fonts_noto_cjk_extra_present')
if (fontPresence.exactPingFangUsed !== false) fail('exact_pingfang_used')
if (
  boundary.ocrInferenceRun !== false ||
  boundary.modelDownloadRun !== false ||
  boundary.fontDownloadRun !== false ||
  boundary.assetCopyRun !== false ||
  boundary.assetUploadRun !== false ||
  boundary.gpuExecutionRun !== false ||
  boundary.networkEnabledForProofs !== false
) {
  fail('model_ocr_gpu_network_boundary_unlocked')
}
if (cleanup.generatedOutputsCleaned !== true || cleanup.exactImageTagRemovedOrAbsent !== true) fail('cleanup_not_confirmed')
if (safety.passed !== true) fail('safety_scan_not_passed')
if (manifest.supabaseClassification?.updateRequired !== 'no write') fail('supabase_classification_drift')
if (status.milestone3SystemFontPackageExecution?.decision !== decision) fail('status_json_missing_execution_decision')

const expectedNextPrompt =
  passDecisions.has(decision) || decision === 'trackb_media_oss_milestone3_system_font_package_execution_passed_import_api_shape_no_model_assets'
    ? 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
    : decision === 'trackb_media_oss_milestone3_system_font_package_execution_blocked_by_model_asset_required'
      ? 'TRACKB_MEDIA_OSS_MILESTONE_3_FONT_CONFIG_FOLLOWUP'
      : 'TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_EXECUTION_BLOCKER_FOLLOWUP'
if (readiness.nextPrompt !== expectedNextPrompt) fail(`next_prompt_drift:${readiness.nextPrompt}`)
const expectedPromptPath =
  expectedNextPrompt === 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
    ? 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'
    : expectedNextPrompt === 'TRACKB_MEDIA_OSS_MILESTONE_3_FONT_CONFIG_FOLLOWUP'
      ? 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-font-config-followup.md'
      : 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup.md'
readText(expectedPromptPath)

for (const item of matrix.tools || []) {
  if (item.ocrInferenceRun !== false || item.modelAssetsDownloaded !== false || item.fontAssetsDownloaded !== false || item.gpuUsed !== false) {
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

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  if (forbiddenAssetExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(`forbidden_tracked_asset:${file}`)
  }
}
const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles) {
  for (const file of stagedFiles.split('\n').filter(Boolean)) {
    if (forbiddenAssetExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
      fail(`forbidden_staged_asset:${file}`)
    }
  }
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
    file.startsWith(`${reportDir}/`) ||
    file.startsWith('docs/cross-chat/') ||
    file.startsWith('docs/open-source-tool-stack/') ||
    file.startsWith('docs/implementation-prompts/')
  if (!allowed && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
}

const textScanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  expectedPromptPath,
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]
for (const file of textScanFiles) {
  const text = readText(file)
  for (const line of text.split('\n')) {
    for (const pattern of forbiddenTextPatterns) {
      pattern.lastIndex = 0
      if (pattern.test(line) && !isGuardrailLine(line)) fail(`forbidden_text:${file}:${pattern}`)
    }
  }
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
      dockerBuildExitCode: dockerBuild.exitCode,
      dockerBuildBlocker: dockerBuild.blocker,
      fontsNotoCjkPresent: fontPresence.fontsNotoCjkPresent,
      paddlePaddleProofRun: paddle.proofRun,
      paddleOcrProofRun: paddleocr.proofRun,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: manifest.supabaseClassification,
    },
    null,
    2,
  ),
)
