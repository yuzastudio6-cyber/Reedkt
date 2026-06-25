#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-font-config-followup'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const packageScript = 'trackb-media-oss:milestone-3-font-config-followup:diagnostics'
const scriptTarget =
  'node scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs'
const expectedDecision =
  'trackb_media_oss_milestone3_font_config_followup_passed_ready_for_ocr_ml_cpu_qa_review'
const expectedNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW'
const nextPromptPath = 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.md'
const expectedSourceSha = 'edb183eda9dce464f8aae0ce4d32ac8e63118433'
const localFontEnv = 'PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
const localFontPath = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
const imageTag = `reeditpro-ocr-runtime:trackb-milestone3-font-config-${expectedSourceSha}`

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'paddlex-font-config-inspection.json',
  'paddlex-font-config-inspection.md',
  'source-target-check.json',
  'source-target-check.md',
  'build-context-command-review.json',
  'build-context-command-review.md',
  'dependency-hydration-report.json',
  'dependency-hydration-report.md',
  'docker-build-report.json',
  'docker-build-report.md',
  'font-discovery-report.json',
  'font-discovery-report.md',
  'candidate-font-config-plan.json',
  'candidate-font-config-plan.md',
  'font-config-attempt-report.json',
  'font-config-attempt-report.md',
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
  'milestone-3-font-config-status-matrix.json',
  'milestone-3-font-config-status-matrix.md',
  'font-config-followup-decision.json',
  'font-config-followup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]
const predecessorPrs = [
  629, 625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546,
  545, 542,
]
const statusDocs = [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  targetRequirements,
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
  /fonts-noto-cjk-extra (?:installed|proved|accepted|selected as primary|used)/i,
  /PingFang-SC-Regular\.ttf (?:downloaded|copied|uploaded|staged|committed|used)/i,
  /OCR inference (?:passed|enabled|ran|accepted|approved)/i,
  /model assets? (?:downloaded|copied|uploaded|staged|committed|used)/i,
  /font assets? (?:downloaded|copied|uploaded|staged|committed|used)/i,
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
  return /\b(no|not|never|blocked|failed|did not|without|false|remain|future-only|future only|fallback-only|unproven|disallowed|absent|none|not used|not run|not accepted|not approved)\b/i.test(
    line,
  )
}

function changedFileSet() {
  const files = new Set()
  for (const args of [
    ['diff', '--name-only', 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit...HEAD'],
    ['diff', '--name-only'],
    ['diff', '--cached', '--name-only'],
  ]) {
    for (const file of git(args).split('\n').filter(Boolean)) files.add(file)
  }
  return [...files].sort()
}

function isAllowedDockerfileDiff(diff) {
  if (!diff) return true
  const addedLines = diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
  const removedLines = diff
    .split('\n')
    .filter((line) => line.startsWith('-') && !line.startsWith('---'))
    .map((line) => line.slice(1))

  if (!diff.includes(localFontEnv)) return false
  if (addedLines.some((line) => /fonts-noto-cjk-extra|PingFang-SC-Regular|ffmpeg|ffprobe|cuda|cudnn/i.test(line))) {
    return false
  }
  if (addedLines.some((line) => line.includes('apt-get') || line.includes('pip install') || line.includes('COPY '))) {
    return false
  }
  return removedLines.length === 1 && removedLines[0].trim() === 'PROVIDER_EXECUTION_ENABLED=false'
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText(nextPromptPath)

const packageJson = readJson('package.json')
const dockerfile = readText(targetDockerfile)
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const inspection = readJson(`${reportDir}/paddlex-font-config-inspection.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const context = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-report.json`)
const fontDiscovery = readJson(`${reportDir}/font-discovery-report.json`)
const configPlan = readJson(`${reportDir}/candidate-font-config-plan.json`)
const configAttempt = readJson(`${reportDir}/font-config-attempt-report.json`)
const paddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleocr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-network-boundary-verification.json`)
const cost = readJson(`${reportDir}/cpu-latency-memory-cost-report.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-font-config-status-matrix.json`)
const decisionReport = readJson(`${reportDir}/font-config-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')

for (const [label, report] of Object.entries({
  source,
  inspection,
  target,
  context,
  hydration,
  dockerBuild,
  fontDiscovery,
  configPlan,
  configAttempt,
  paddle,
  paddleocr,
  boundary,
  cost,
  cleanup,
  safety,
  matrix,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== expectedDecision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.sourceSha !== expectedSourceSha) fail(`source_sha_drift:${label}:${report.sourceSha}`)
}

if (packageJson.scripts?.[packageScript] !== scriptTarget) fail('missing_or_invalid_package_script')
if (source.branch !== 'codex/rp-trackb-media-oss-milestone-3-font-config-followup') fail('branch_drift')
for (const pr of predecessorPrs) {
  if (source.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}
if ((source.duplicateSearches?.fontConfigFollowup || []).length !== 0) fail('duplicate_font_config_followup_recorded')
if ((source.duplicateSearches?.fontConfigDecision || []).length !== 0) fail('duplicate_font_config_decision_recorded')
if (source.pr629Evidence?.paddleOcrBlockedByPingFangFetch !== true) fail('missing_pr629_pingfang_blocker_evidence')

if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.buildContextGenerationRequired !== false) fail('unexpected_build_context_requirement')
if (target.fontConfigEnvPresent !== true || target.selectedLocalFont !== localFontPath) fail('target_font_env_missing')

if (!/FROM python:3\.12-slim/.test(dockerfile)) fail('unexpected_ocr_runtime_base_image')
if (!/libgomp1 libgl1 libglib2\.0-0 fonts-noto-cjk/.test(dockerfile)) {
  fail('dockerfile_missing_required_package_set')
}
if (!dockerfile.includes(localFontEnv)) fail('dockerfile_missing_local_font_env')
if (/fonts-noto-cjk-extra|PingFang-SC-Regular|cuda|cudnn|graphicsmagick|ffmpeg|ffprobe/i.test(dockerfile)) {
  fail('dockerfile_contains_forbidden_scope')
}

if (inspection.inspectedInContainer !== true || inspection.networkMode !== 'none') fail('source_inspection_scope_invalid')
if (inspection.safeConfigFound !== true) fail('safe_font_config_not_found')
if (inspection.safeConfigEnvVar !== 'PADDLE_PDX_LOCAL_FONT_FILE_PATH') fail('safe_font_env_var_drift')
if (inspection.selectedLocalFont !== localFontPath) fail('safe_local_font_drift')
if (!String(inspection.hardCodedAssetUrlPattern || '').includes('paddle-model-ecology.bj.bcebos.com')) {
  fail('missing_paddlex_asset_url_evidence')
}

if (context.buildContextGenerationRequired !== false || context.npmCiRequired !== false) fail('context_or_hydration_required')
if (hydration.npmCiRun !== false || hydration.packageLockMutated !== false || hydration.nodeModulesCreated !== false) {
  fail('dependency_hydration_scope_widened')
}
if (dockerBuild.command !== `docker build -f ${targetDockerfile} -t ${imageTag} .`) fail('docker_build_command_drift')
if (dockerBuild.exitCode !== 0 || dockerBuild.imageCreated !== true || dockerBuild.imagePushed !== false) {
  fail('docker_build_not_successful')
}

if (fontDiscovery.checkRun !== true || fontDiscovery.exitCode !== 0 || fontDiscovery.networkMode !== 'none') {
  fail('font_discovery_not_successful')
}
if (fontDiscovery.fontsNotoCjkPresent !== true) fail('fonts_noto_cjk_missing')
if (fontDiscovery.fontsNotoCjkExtraPresent !== false) fail('fonts_noto_cjk_extra_present')
if (fontDiscovery.exactPingFangPresent !== false || fontDiscovery.exactPingFangUsed !== false) fail('exact_pingfang_present_or_used')
if (fontDiscovery.selectedRegularFont !== localFontPath) fail('selected_regular_font_drift')

if (!configPlan.candidates?.some((entry) => entry.id === 'candidate_a_runtime_env' && entry.status === 'selected')) {
  fail('runtime_env_candidate_not_selected')
}
if (configPlan.exactPingFangUsed !== false || configPlan.symlinkOrCopyUsed !== false) fail('unsafe_font_config_path_used')
if (
  configAttempt.configType !== 'ocr_runtime_dockerfile_env' ||
  configAttempt.envVar !== 'PADDLE_PDX_LOCAL_FONT_FILE_PATH' ||
  configAttempt.value !== localFontPath ||
  configAttempt.dockerfilePatched !== true ||
  configAttempt.sourceSupported !== true ||
  configAttempt.noAssetOperation !== true
) {
  fail('font_config_attempt_invalid')
}

if (paddle.proofRun !== true || paddle.importVersionPassed !== true || paddle.tensorDevicePassed !== true) {
  fail('paddlepaddle_proof_missing')
}
if (paddle.version !== '3.0.0' || paddle.device !== 'cpu') fail('paddlepaddle_version_or_device_drift')
if (paddle.ocrInferenceRun !== false || paddle.modelAssetsUsed !== false) fail('paddlepaddle_scope_widened')

if (paddleocr.proofRun !== true || paddleocr.importApiShapePassed !== true) fail('paddleocr_api_shape_not_passed')
if (paddleocr.distributionVersion !== '3.0.0' || paddleocr.moduleVersion !== '3.0.0') fail('paddleocr_version_drift')
if (paddleocr.hasPaddleOCR !== true || paddleocr.paddleOcrInstantiated !== false) fail('paddleocr_api_boundary_invalid')
if (
  paddleocr.modelAssetRequired !== false ||
  paddleocr.exactPingFangFetchAttempted !== false ||
  paddleocr.ocrInferenceRun !== false ||
  paddleocr.modelDownloadRun !== false ||
  paddleocr.fontDownloadCompleted !== false ||
  paddleocr.assetCopiedOrUploaded !== false
) {
  fail('paddleocr_asset_or_inference_scope_widened')
}

if (
  boundary.ocrInferenceRun !== false ||
  boundary.modelDownloadRun !== false ||
  boundary.fontDownloadRun !== false ||
  boundary.assetCopyRun !== false ||
  boundary.assetUploadRun !== false ||
  boundary.gpuExecutionRun !== false ||
  boundary.networkEnabledForProofs !== false ||
  boundary.exactPingFangUsed !== false ||
  boundary.fontsNotoCjkExtraUsed !== false ||
  boundary.realUserMediaUsed !== false ||
  boundary.realUserDocumentsUsed !== false ||
  boundary.supabaseMutationRun !== false ||
  boundary.gcsOperationRun !== false
) {
  fail('boundary_scope_widened')
}

if (cleanup.generatedOutputsCleaned !== true || cleanup.nodeModulesRemovedOrAbsent !== true) fail('cleanup_not_confirmed')
if (cleanup.exactImageTagRemovedOrAbsent !== true || cleanup.imageTag !== imageTag) fail('image_cleanup_not_confirmed')
if (safety.passed !== true) fail('safety_scan_not_passed')
if (safety.dockerfileMutation !== 'exact_paddlex_local_font_env_only') fail('safety_dockerfile_mutation_drift')
if (readiness.readyForOcrMlCpuQa !== true || readiness.nextPrompt !== expectedNextPrompt) fail('readiness_or_next_prompt_drift')
if (manifest.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_classification_drift')
if (manifest.supabaseClassification?.environmentTouched !== 'none') fail('supabase_environment_classification_drift')
if (manifest.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_classification_drift')
if (manifest.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_classification_drift')

for (const item of matrix.tools || []) {
  if (item.acceptedProvenBounded !== false || item.evidencePendingQa !== true) fail(`matrix_qa_status_drift:${item.id}`)
  if (
    item.exactPingFangUsed !== false ||
    item.ocrInferenceRun !== false ||
    item.modelAssetsDownloaded !== false ||
    item.fontAssetsDownloaded !== false ||
    item.gpuUsed !== false
  ) {
    fail(`matrix_forbidden_scope:${item.id}`)
  }
}
if (matrix.trackBTotalsPendingQa?.ownedTools !== 16) fail('owned_tool_count_drift')
if (matrix.trackBTotalsPendingQa?.acceptedProvenBoundedTotal !== 12) fail('accepted_count_drift')
if (matrix.trackBTotalsPendingQa?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (matrix.trackBTotalsPendingQa?.endToEndProductReady !== 0) fail('product_ready_count_drift')

if (decisionReport.nextPrompt !== expectedNextPrompt || decisionReport.nextPromptPath !== nextPromptPath) fail('decision_next_prompt_drift')
if (decisionReport.paddlePaddlePassed !== true || decisionReport.paddleOcrPassed !== true) fail('decision_missing_paddle_pass')
if (decisionReport.ocrInferenceRun !== false || decisionReport.modelAssetOperationsRun !== false) {
  fail('decision_scope_widened')
}
if (status.milestone3FontConfigFollowup?.decision !== expectedDecision) fail('status_json_missing_font_config_decision')
if (status.milestone3FontConfigFollowup?.nextPrompt !== expectedNextPrompt) fail('status_json_next_prompt_drift')
if (status.milestone3FontConfigFollowup?.canonicalCountsPendingQa?.acceptedProvenBounded !== 12) {
  fail('status_json_accepted_count_drift')
}
if (status.milestone3FontConfigFollowup?.canonicalCountsPendingQa?.endToEndProductReady !== 0) {
  fail('status_json_product_ready_drift')
}

for (const doc of statusDocs) {
  const text = readText(doc)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_3_FONT_CONFIG_FOLLOWUP')) fail(`status_doc_missing_marker:${doc}`)
  if (!text.includes(expectedDecision)) fail(`status_doc_missing_decision:${doc}`)
  if (!text.includes(expectedNextPrompt)) fail(`status_doc_missing_next_prompt:${doc}`)
}

for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(fullPath(relativePath))) fail(`forbidden_path_present:${relativePath}`)
}

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  const isReport = file.startsWith(`${reportDir}/`)
  const isPrompt = file === nextPromptPath
  if (!isReport && !isPrompt && forbiddenAssetExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(`forbidden_tracked_asset:${file}`)
  }
}

for (const protectedFile of protectedNoDiffFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
}
const dockerfileDiff = git(['diff', '--', targetDockerfile])
const stagedDockerfileDiff = git(['diff', '--cached', '--', targetDockerfile])
if (!isAllowedDockerfileDiff(dockerfileDiff)) fail('dockerfile_diff_not_limited_to_local_font_env')
if (!isAllowedDockerfileDiff(stagedDockerfileDiff)) fail('staged_dockerfile_diff_not_limited_to_local_font_env')

const changedFiles = changedFileSet()
const allowedExactFiles = new Set([
  targetDockerfile,
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'package.json',
  nextPromptPath,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-qa-review.md',
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-model-asset-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-2-video-analysis-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-1-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-install-proof-milestone-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
  'scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs',
  'server/activation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review/index.js',
  'server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-plan.js',
  'server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.js',
  'server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-report.js',
  'server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-summary.js',
  'server/smoke/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-smoke.js',
])
for (const file of changedFiles) {
  const allowed =
    allowedExactFiles.has(file) ||
    file.startsWith(`${reportDir}/`) ||
    file.startsWith('docs/cross-chat/') ||
    file.startsWith('docs/open-source-tool-stack/')
  if (!allowed) fail(`unexpected_changed_file:${file}`)
  if (forbiddenAssetExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(`forbidden_changed_asset:${file}`)
  }
}

const textScanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  nextPromptPath,
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  ...statusDocs,
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
      decision: expectedDecision,
      dockerfileEnv: localFontEnv,
      fontsNotoCjkPresent: fontDiscovery.fontsNotoCjkPresent,
      fontsNotoCjkExtraPresent: fontDiscovery.fontsNotoCjkExtraPresent,
      paddlePaddleVersion: paddle.version,
      paddleOcrVersion: paddleocr.moduleVersion,
      nextPrompt: expectedNextPrompt,
      supabaseClassification: manifest.supabaseClassification,
    },
    null,
    2,
  ),
)
