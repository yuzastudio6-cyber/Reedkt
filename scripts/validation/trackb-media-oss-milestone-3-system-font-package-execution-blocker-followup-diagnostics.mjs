#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup'
const targetDockerfile = 'docker/prod/ocr-runtime/Dockerfile'
const targetRequirements = 'docker/prod/ocr-runtime/requirements.ocr.txt'
const packageScript =
  'trackb-media-oss:milestone-3-system-font-package-execution-blocker-followup:diagnostics'
const scriptTarget =
  'node scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs'
const expectedDecision =
  'trackb_media_oss_milestone3_system_font_package_execution_followup_blocked_by_model_asset_required'
const expectedNextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_FONT_CONFIG_FOLLOWUP'
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'docker-metadata-timeout-review.json',
  'docker-metadata-timeout-review.md',
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
  'docker-build-rerun-report.json',
  'docker-build-rerun-report.md',
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
  'milestone-3-system-font-execution-followup-status-matrix.json',
  'milestone-3-system-font-execution-followup-status-matrix.md',
  'system-font-package-execution-followup-decision.json',
  'system-font-package-execution-followup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]
const predecessorPrs = [
  625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545,
  542,
]
const forbiddenPaths = ['dist', 'dist-server', 'dist-staging-fixture-worker', 'node_modules']
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  targetDockerfile,
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
  return /\b(no|not|never|blocked|failed|did not|without|false|remain|future-only|fallback-only|unproven|disallowed|attempted)\b/i.test(
    line,
  )
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

for (const file of requiredReports) readText(`${reportDir}/${file}`)

const packageJson = readJson('package.json')
const dockerfile = readText(targetDockerfile)
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const timeout = readJson(`${reportDir}/docker-metadata-timeout-review.json`)
const target = readJson(`${reportDir}/source-target-check.json`)
const context = readJson(`${reportDir}/build-context-command-review.json`)
const hydration = readJson(`${reportDir}/dependency-hydration-report.json`)
const generation = readJson(`${reportDir}/build-context-generation-report.json`)
const scan = readJson(`${reportDir}/generated-artifact-scan-report.json`)
const dockerBuild = readJson(`${reportDir}/docker-build-rerun-report.json`)
const fontPresence = readJson(`${reportDir}/font-package-presence-report.json`)
const paddle = readJson(`${reportDir}/paddlepaddle-proof-report.json`)
const paddleocr = readJson(`${reportDir}/paddleocr-api-proof-report.json`)
const boundary = readJson(`${reportDir}/model-ocr-gpu-network-boundary-verification.json`)
const cleanup = readJson(`${reportDir}/artifact-cleanup-report.json`)
const safety = readJson(`${reportDir}/safety-scan-report.json`)
const matrix = readJson(`${reportDir}/milestone-3-system-font-execution-followup-status-matrix.json`)
const decisionReport = readJson(`${reportDir}/system-font-package-execution-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const decision = decisionReport.decision

if (decision !== expectedDecision) fail(`decision_drift:${decision}`)
for (const [label, report] of Object.entries({
  source,
  timeout,
  target,
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
  if (report.decision !== expectedDecision) fail(`decision_drift:${label}:${report.decision}`)
}

if (packageJson.scripts?.[packageScript] !== scriptTarget) fail('missing_or_invalid_package_script')
if (source.sourceSha !== 'f739488b207f8959c36579e57280df635e6e87c6') fail(`source_sha_drift:${source.sourceSha}`)
for (const pr of predecessorPrs) {
  if (source.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}
if ((source.duplicateSearches?.blockerFollowup || []).length !== 0) fail('duplicate_followup_recorded')
if (!timeout.pr625Blocker?.includes('DeadlineExceeded')) fail('missing_pr625_timeout_evidence')
if (target.targetDockerfile !== targetDockerfile) fail('target_dockerfile_drift')
if (target.targetRequirements !== targetRequirements) fail('target_requirements_drift')
if (target.dockerfilePatchNeeded !== false) fail('unexpected_dockerfile_patch_claimed')
if (target.buildContextGenerationRequired !== false) fail('unexpected_build_context_requirement')
if (!/FROM python:3\.12-slim/.test(dockerfile)) fail('unexpected_ocr_runtime_base_image')
if (!/libgomp1 libgl1 libglib2\.0-0 fonts-noto-cjk/.test(dockerfile)) fail('dockerfile_missing_required_package_set')
if (/fonts-noto-cjk-extra|PingFang-SC-Regular|cuda|cudnn|graphicsmagick|ffmpeg|ffprobe/i.test(dockerfile)) {
  fail('dockerfile_contains_forbidden_scope')
}
if (context.buildContextGenerationRequired !== false) fail('context_claims_generation_required')
if (hydration.npmCiRun !== false) fail('npm_ci_claimed')
if (generation.buildContextGenerationRun !== false) fail('build_context_generation_claimed')
if (scan.passed !== true || scan.generatedArtifactsFound !== false) fail('generated_artifact_scan_invalid')
if (dockerBuild.exitCode !== 0 || dockerBuild.imageCreated !== true || dockerBuild.imagePushed !== false) {
  fail('docker_build_rerun_not_successful')
}
if (!dockerBuild.previousMetadataTimeoutResolved) fail('metadata_timeout_not_marked_resolved')
if (fontPresence.fontsNotoCjkPresent !== true) fail('fonts_noto_cjk_missing')
if (fontPresence.fontsNotoCjkExtraPresent !== false) fail('fonts_noto_cjk_extra_present')
if (fontPresence.exactPingFangPresent !== false || fontPresence.exactPingFangUsed !== false) fail('exact_pingfang_present_or_used')
if (!Array.isArray(fontPresence.fontFiles) || fontPresence.fontFiles.length < 2) fail('font_discovery_missing_files')
if (paddle.proofRun !== true || paddle.importVersionPassed !== true || paddle.tensorDevicePassed !== true) {
  fail('paddlepaddle_proof_missing')
}
if (paddle.device !== 'cpu') fail(`paddle_device_not_cpu:${paddle.device}`)
if (paddleocr.proofRun !== true || paddleocr.importApiShapePassed !== false) fail('paddleocr_blocker_not_recorded')
if (paddleocr.modelAssetRequired !== true) fail('paddleocr_model_asset_requirement_missing')
if (!String(paddleocr.blocker || '').includes('PingFang-SC-Regular.ttf')) fail('paddleocr_missing_pingfang_blocker')
if (!String(paddleocr.blockerUrl || '').includes('paddle-model-ecology.bj.bcebos.com')) fail('paddleocr_missing_blocker_url')
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
if (readiness.nextPrompt !== expectedNextPrompt) fail(`next_prompt_drift:${readiness.nextPrompt}`)
if (manifest.supabaseClassification?.updateRequired !== 'no write') fail('supabase_classification_drift')
if (status.milestone3SystemFontPackageExecutionFollowup?.decision !== expectedDecision) {
  fail('status_json_missing_followup_decision')
}
readText('docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-font-config-followup.md')

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
  if (
    protectedFile === targetDockerfile &&
    isAllowedFontConfigDockerfileDiff(diff) &&
    isAllowedFontConfigDockerfileDiff(stagedDiff)
  ) {
    continue
  }
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
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
const allowedValidationScripts = new Set([
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-model-asset-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
])
for (const file of changedFiles) {
  const allowed =
    file === 'package.json' ||
    file === 'docker/prod/cpu-worker/requirements.cpu.txt' ||
    allowedValidationScripts.has(file) ||
    file.startsWith(`${reportDir}/`) ||
    file.startsWith('docs/cross-chat/') ||
    file.startsWith('docs/open-source-tool-stack/') ||
    file.startsWith('docs/implementation-prompts/')
  if (!allowed && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
}

const textScanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-font-config-followup.md',
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
      dockerBuildExitCode: dockerBuild.exitCode,
      fontsNotoCjkPresent: fontPresence.fontsNotoCjkPresent,
      paddlePaddleVersion: paddle.version,
      paddleOcrBlocker: paddleocr.blocker,
      nextPrompt: readiness.nextPrompt,
      supabaseClassification: manifest.supabaseClassification,
    },
    null,
    2,
  ),
)
