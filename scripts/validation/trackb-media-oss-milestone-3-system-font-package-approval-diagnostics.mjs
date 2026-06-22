#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-system-font-package-approval'
const decision =
  'trackb_media_oss_milestone3_system_font_package_approval_passed_ready_for_fonts_noto_cjk_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_EXECUTION'
const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-system-font-package-execution.md'
const packageScript = 'trackb-media-oss:milestone-3-system-font-package-approval:diagnostics'
const scriptTarget =
  'node scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'system-font-package-metadata-review.json',
  'system-font-package-metadata-review.md',
  'system-font-license-review.json',
  'system-font-license-review.md',
  'ocr-runtime-target-review.json',
  'ocr-runtime-target-review.md',
  'future-package-command-plan.json',
  'future-package-command-plan.md',
  'future-font-discovery-config-plan.json',
  'future-font-discovery-config-plan.md',
  'ocr-ml-batch-execution-plan.json',
  'ocr-ml-batch-execution-plan.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'system-font-package-approval-decision.json',
  'system-font-package-approval-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
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
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
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
const forbiddenPositiveText = [
  /40\+ tools (?:are )?(?:installed|proven|end-to-end)/i,
  /OCR inference (?:passed|enabled|ran|accepted|approved)/i,
  /PaddleOCR (?:execution|ran|import|proof) (?:passed|enabled|accepted|approved)/i,
  /PaddlePaddle (?:execution|ran|import|proof) (?:passed|enabled|accepted|approved)/i,
  /font asset (?:downloaded|copied|uploaded|staged|committed)/i,
  /model asset (?:downloaded|copied|uploaded|staged|committed)/i,
  /private asset staging (?:approved|enabled|accepted|ran)/i,
  /Docker (?:build|run) (?:passed|enabled|ran|accepted)/i,
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
  return /\b(no|do not|not allowed|disallowed|blocked|remain blocked|not accepted|not approved|false|did not|without|never|future-only|future only|fallback-only|not currently|not currently proven)\b/i.test(
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
readText(nextPromptPath)

const packageJson = readJson('package.json')
const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const packageReview = readJson(`${reportDir}/system-font-package-metadata-review.json`)
const licenseReview = readJson(`${reportDir}/system-font-license-review.json`)
const targetReview = readJson(`${reportDir}/ocr-runtime-target-review.json`)
const commandPlan = readJson(`${reportDir}/future-package-command-plan.json`)
const configPlan = readJson(`${reportDir}/future-font-discovery-config-plan.json`)
const batchPlan = readJson(`${reportDir}/ocr-ml-batch-execution-plan.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-review.json`)
const decisionReport = readJson(`${reportDir}/system-font-package-approval-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')

if (packageJson.scripts?.[packageScript] !== scriptTarget) fail('missing_or_invalid_package_script')

for (const [label, report] of Object.entries({
  sourceAudit,
  packageReview,
  licenseReview,
  targetReview,
  commandPlan,
  configPlan,
  batchPlan,
  runtime,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.nextPrompt !== nextPrompt) fail(`next_prompt_drift:${label}:${report.nextPrompt}`)
}

if (sourceAudit.sourceOfTruthPr?.pr !== 615 || sourceAudit.sourceOfTruthPr?.state !== 'MERGED') {
  fail('missing_pr_615_source_truth')
}
for (const pr of [613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}

if (sourceAudit.duplicateSearches?.TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_APPROVAL?.length !== 0) {
  fail('duplicate_system_font_prompt_pr_recorded')
}
if (sourceAudit.duplicateSearches?.['fonts-noto-cjk']?.length !== 0) fail('duplicate_fonts_noto_pr_recorded')

if (packageReview.selectedPrimaryPackage !== 'fonts-noto-cjk') fail('primary_font_package_drift')
if (packageReview.secondaryFallbackPackage !== 'fonts-noto-cjk-extra') fail('fallback_font_package_drift')
if (!packageReview.packages?.some((entry) => entry.name === 'fonts-noto-cjk' && entry.selectedForFutureExecution === true)) {
  fail('fonts_noto_cjk_not_selected')
}
if (!packageReview.packages?.some((entry) => entry.name === 'fonts-noto-cjk-extra' && entry.fallbackOnly === true)) {
  fail('fonts_noto_cjk_extra_not_fallback')
}
if (
  packageReview.packageInstallApprovedNow !== false ||
  packageReview.dockerfileMutationApprovedNow !== false ||
  packageReview.dockerBuildApprovedNow !== false ||
  packageReview.runtimeProofApprovedNow !== false
) {
  fail('package_review_scope_widened')
}

if (licenseReview.license !== 'SIL Open Font License 1.1') fail('license_review_drift')
if (licenseReview.repositoryShouldCommitFontBinaries !== false) fail('font_binary_commit_allowed')
if (licenseReview.futureExecutionShouldInstallFromPackageManagerOnly !== true) fail('package_manager_install_policy_missing')
if (
  licenseReview.fontAssetDownloadApprovedNow !== false ||
  licenseReview.fontAssetCopyApprovedNow !== false ||
  licenseReview.fontAssetUploadApprovedNow !== false ||
  licenseReview.privateAssetStagingApprovedNow !== false
) {
  fail('license_review_asset_scope_widened')
}

if (targetReview.futureTarget !== 'docker/prod/ocr-runtime/Dockerfile') fail('ocr_runtime_target_drift')
if (targetReview.dockerfileMutationApprovedNow !== false) fail('dockerfile_mutation_approved_now')
if (commandPlan.futurePrimaryPackage !== 'fonts-noto-cjk') fail('command_plan_primary_drift')
if (commandPlan.futureFallbackPackage !== 'fonts-noto-cjk-extra') fail('command_plan_fallback_drift')
if (!commandPlan.futureCommandPattern?.some((line) => line.includes('fonts-noto-cjk'))) fail('future_install_command_missing_package')
if (commandPlan.installApprovedNow !== false) fail('install_approved_now')

if (configPlan.networkFetchMustRemainBlocked !== true) fail('network_fetch_not_blocked')
if (configPlan.ocrInferenceApproved !== false || configPlan.modelDownloadApproved !== false || configPlan.gpuApproved !== false) {
  fail('font_config_scope_widened')
}
if (batchPlan.avoidTinyPrLoop !== true) fail('batch_execution_policy_missing')

for (const [key, value] of Object.entries(runtime)) {
  if (key !== 'decision' && key !== 'nextPrompt' && value !== false) fail(`runtime_boundary_not_false:${key}`)
}

if (decisionReport.counts?.ownedTools !== 16) fail('owned_tool_count_drift')
if (decisionReport.counts?.acceptedProvenBounded !== 12) fail('accepted_count_drift')
if (decisionReport.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (decisionReport.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (decisionReport.noFortyPlusEndToEndClaim !== true) fail('no_40_plus_policy_missing')

if (status.milestone3SystemFontPackageApproval?.decision !== decision) fail('status_json_missing_system_font_approval')
if (status.milestone3SystemFontPackageApproval?.primarySystemFontPackage !== 'fonts-noto-cjk') fail('status_json_primary_drift')
if (status.milestone3SystemFontPackageApproval?.secondarySystemFontPackage !== 'fonts-noto-cjk-extra') {
  fail('status_json_fallback_drift')
}

for (const forbiddenPath of forbiddenPaths) {
  if (fs.existsSync(fullPath(forbiddenPath))) fail(`forbidden_path_present:${forbiddenPath}`)
}

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  const isNewReportPath = file.startsWith(`${reportDir}/`)
  const isPrompt = file === nextPromptPath
  if (!isNewReportPath && !isPrompt && forbiddenAssetExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(`forbidden_tracked_asset:${file}`)
  }
}

const protectedDiffFailures = []
for (const protectedFile of protectedNoDiffFiles) {
  const diff = git(['diff', '--', protectedFile])
  const stagedDiff = git(['diff', '--cached', '--', protectedFile])
  if (
    protectedFile === 'docker/prod/ocr-runtime/Dockerfile' &&
    isAllowedFontConfigDockerfileDiff(diff) &&
    isAllowedFontConfigDockerfileDiff(stagedDiff)
  ) {
    continue
  }
  if (diff || stagedDiff) protectedDiffFailures.push(protectedFile)
}
if (protectedDiffFailures.length) fail(`protected_file_mutation:${protectedDiffFailures.join(',')}`)

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
const systemFontExecutionFiles = new Set([
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-qa-review.md',
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
    file === 'package.json' ||
    systemFontExecutionFiles.has(file) ||
    file.startsWith(`${reportDir}/`) ||
    file === nextPromptPath ||
    file.startsWith('docs/cross-chat/') ||
    file.startsWith('docs/open-source-tool-stack/')
  if (!allowed) fail(`unexpected_changed_file:${file}`)
}

const textScanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  nextPromptPath,
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
]
for (const file of textScanFiles) {
  const text = readText(file)
  for (const line of text.split('\n')) {
    for (const pattern of forbiddenPositiveText) {
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
      primaryPackage: packageReview.selectedPrimaryPackage,
      fallbackPackage: packageReview.secondaryFallbackPackage,
      exactPingFangStatus: decisionReport.exactPingFangStatus,
      counts: decisionReport.counts,
      nextPrompt,
      supabaseClassification: decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
