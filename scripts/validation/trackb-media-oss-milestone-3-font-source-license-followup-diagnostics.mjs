#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-font-source-license-followup'
const decision =
  'trackb_media_oss_milestone3_font_source_license_followup_passed_ready_for_system_font_package_approval'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_APPROVAL'
const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-system-font-package-approval.md'
const packageScript = 'trackb-media-oss:milestone-3-font-source-license-followup:diagnostics'
const scriptTarget =
  'node scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs'
const requestedAsset = 'PingFang-SC-Regular.ttf'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'pingfang-license-conclusion.json',
  'pingfang-license-conclusion.md',
  'system-font-package-alternative-decision.json',
  'system-font-package-alternative-decision.md',
  'paddleocr-font-config-viability.json',
  'paddleocr-font-config-viability.md',
  'ocr-ml-batch-closeout-strategy.json',
  'ocr-ml-batch-closeout-strategy.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'font-source-license-followup-decision.json',
  'font-source-license-followup-decision.md',
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
  /OCR inference (?:passed|enabled|ran|accepted)/i,
  /PaddleOCR (?:execution|ran|import) (?:passed|enabled|accepted)/i,
  /PaddlePaddle (?:execution|ran|import) (?:passed|enabled|accepted)/i,
  /font asset (?:downloaded|copied|uploaded|staged|committed)/i,
  /model asset (?:downloaded|copied|uploaded|staged|committed)/i,
  /private asset staging (?:approved|enabled|accepted|ran)/i,
  /Docker (?:build|run) (?:passed|enabled|ran|accepted)/i,
  /GPU execution (?:passed|enabled|ran|accepted)/i,
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
  return /\b(no|do not|not allowed|disallowed|blocked|remain blocked|not accepted|not approved|false|did not|without|never|not enough|future-only|future only)\b/i.test(
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
const pingfang = readJson(`${reportDir}/pingfang-license-conclusion.json`)
const systemFont = readJson(`${reportDir}/system-font-package-alternative-decision.json`)
const config = readJson(`${reportDir}/paddleocr-font-config-viability.json`)
const closeout = readJson(`${reportDir}/ocr-ml-batch-closeout-strategy.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-review.json`)
const decisionReport = readJson(`${reportDir}/font-source-license-followup-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')

if (packageJson.scripts?.[packageScript] !== scriptTarget) fail('missing_or_invalid_package_script')

for (const [label, report] of Object.entries({
  sourceAudit,
  pingfang,
  systemFont,
  config,
  closeout,
  runtime,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.nextPrompt !== nextPrompt) fail(`next_prompt_drift:${label}:${report.nextPrompt}`)
}

for (const pr of [613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}

if (sourceAudit.duplicateReview?.fontSourceLicenseFollowupOpenPrs?.length !== 0) fail('duplicate_followup_pr_recorded')
if (sourceAudit.duplicateReview?.pingFangOpenPrs?.length !== 0) fail('duplicate_pingfang_pr_recorded')
if (sourceAudit.duplicateReview?.fontsNotoCjkOpenPrs?.length !== 0) fail('duplicate_noto_pr_recorded')
if (!sourceAudit.referenceInputs?.some((input) => input.includes('packages.debian.org'))) fail('missing_debian_package_reference')
if (!sourceAudit.referenceInputs?.some((input) => input.includes('notofonts.github.io'))) fail('missing_noto_license_reference')
if (!sourceAudit.referenceInputs?.some((input) => input.includes('PaddleX/issues/4405'))) fail('missing_paddlex_issue_reference')

if (pingfang.requestedAsset !== requestedAsset) fail('requested_asset_drift')
if (pingfang.exactStandaloneFontLicenseProven !== false) fail('pingfang_license_claimed_proven')
if (pingfang.redistributionRightsProven !== false) fail('pingfang_redistribution_claimed')
if (pingfang.privateStagingRightsProven !== false) fail('pingfang_private_staging_claimed')
if (pingfang.repositoryCommitAllowed !== false) fail('pingfang_repo_commit_allowed')
if (pingfang.cloudRuntimeImageEmbeddingAllowed !== false) fail('pingfang_runtime_embedding_allowed')
if (pingfang.trustedChecksumSourceProven !== false) fail('pingfang_checksum_claimed')
if (pingfang.assetDownloadedForReview !== false || pingfang.assetCopiedForReview !== false || pingfang.assetUploadedForReview !== false) {
  fail('pingfang_asset_operation_claimed')
}

if (systemFont.selectedStrategy !== 'system_font_package_approval') fail('system_font_strategy_not_selected')
if (systemFont.primaryCandidatePackage !== 'fonts-noto-cjk') fail('primary_font_package_drift')
if (!systemFont.candidatePackages?.some((entry) => entry.name === 'fonts-noto-cjk-extra')) {
  fail('secondary_font_package_missing')
}
if (systemFont.avoidsProprietaryPingFangStaging !== true) fail('system_font_does_not_avoid_pingfang')
if (
  systemFont.packageInstallApprovedNow !== false ||
  systemFont.dockerfileMutationApprovedNow !== false ||
  systemFont.dockerBuildApprovedNow !== false ||
  systemFont.runtimeProofApprovedNow !== false
) {
  fail('system_font_scope_widened')
}

if (config.localFontPathConfigurationAppearsPossible !== true) fail('local_font_config_not_recorded')
if (config.systemFontConfigSelectedForNextGate !== true) fail('system_font_config_not_selected')
if (config.assetFreeImportConfigProven !== false || config.assetFreeImportConfigSelected !== false) {
  fail('asset_free_config_wrongly_selected')
}
if (
  config.paddleOcrImportedNow !== false ||
  config.paddlePaddleImportedNow !== false ||
  config.ocrObjectInstantiatedNow !== false ||
  config.ocrInferenceRunNow !== false
) {
  fail('config_claims_runtime_execution')
}

if (closeout.avoidOnePrPerMissingLibraryOrAsset !== true) fail('batch_closeout_not_recorded')
if (!closeout.futureBatchShouldCover?.includes('no-network font fetch verification')) {
  fail('batch_closeout_missing_no_network_font_fetch')
}

for (const [key, value] of Object.entries(runtime)) {
  if (key.endsWith('Accepted') && value !== false) fail(`runtime_boundary_enabled:${key}`)
}
if (decisionReport.selectedStrategy !== 'system_font_package_approval') fail('decision_strategy_drift')
if (decisionReport.exactPingFangPath?.selected !== false) fail('exact_pingfang_selected')
if (decisionReport.systemFontPath?.selected !== true) fail('system_font_not_selected')
if (decisionReport.assetFreeImportConfigPath?.selected !== false) fail('asset_free_selected')
if (decisionReport.counts?.ownedTools !== 16) fail('owned_tool_count_drift')
if (decisionReport.counts?.acceptedProvenBounded !== 12) fail('accepted_count_drift')
if (decisionReport.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (decisionReport.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
if (readiness.readyForSystemFontPackageApproval !== true) fail('readiness_not_ready_for_system_font')
if (
  readiness.readyForExactPingFangPrivateStaging !== false ||
  readiness.readyForAssetFreeImportConfigFollowup !== false ||
  readiness.readyForFontAssetDownload !== false ||
  readiness.readyForModelAssetOperation !== false ||
  readiness.readyForOcrInference !== false ||
  readiness.readyForDockerExecution !== false ||
  readiness.readyForGpu !== false
) {
  fail('readiness_widened_scope')
}
if (
  manifest.fontFilesCommitted !== 0 ||
  manifest.modelFilesCommitted !== 0 ||
  manifest.mediaFilesCommitted !== 0 ||
  manifest.fontAssetDownloaded !== false ||
  manifest.privateAssetStaged !== false ||
  manifest.publicArtifactsCreated !== false ||
  manifest.signedUrlsCreated !== false
) {
  fail('manifest_artifact_scope_invalid')
}
if (status.milestone3FontSourceLicenseFollowup?.decision !== decision) fail('status_json_decision_drift')
if (status.milestone3FontSourceLicenseFollowup?.nextPrompt !== nextPrompt) fail('status_json_next_prompt_drift')
if (status.milestone3FontSourceLicenseFollowup?.selectedStrategy !== 'system_font_package_approval') {
  fail('status_json_strategy_drift')
}
if (status.counts?.acceptedProvenBounded !== 12 || status.counts?.endToEndProductReady !== 0) {
  fail('status_counts_drift')
}

for (const doc of statusDocs) {
  const text = readText(doc)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_3_FONT_SOURCE_LICENSE_FOLLOWUP')) {
    fail(`status_doc_missing_marker:${doc}`)
  }
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${doc}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${doc}`)
  if (!text.includes('fonts-noto-cjk')) fail(`status_doc_missing_system_font:${doc}`)
}

for (const doc of [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
]) {
  if (fs.existsSync(fullPath(doc))) fail(`unexpected_broad_production_doc_created:${doc}`)
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
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup.md',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
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
      requestedAsset,
      selectedStrategy: decisionReport.selectedStrategy,
      primaryCandidatePackage: systemFont.primaryCandidatePackage,
      exactPingFangLicenseProven: pingfang.exactStandaloneFontLicenseProven,
      counts: decisionReport.counts,
      nextPrompt,
      supabaseClassification: decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
