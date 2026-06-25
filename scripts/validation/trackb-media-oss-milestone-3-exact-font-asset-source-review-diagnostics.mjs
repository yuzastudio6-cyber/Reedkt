#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-exact-font-asset-source-review'
const decision =
  'trackb_media_oss_milestone3_exact_font_asset_source_review_blocked_pending_font_license_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_FONT_SOURCE_LICENSE_FOLLOWUP'
const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-font-source-license-followup.md'
const requestedAsset = 'PingFang-SC-Regular.ttf'
const packageScript = 'trackb-media-oss:milestone-3-exact-font-asset-source-review:diagnostics'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'exact-asset-identity-review.json',
  'exact-asset-identity-review.md',
  'upstream-source-review.json',
  'upstream-source-review.md',
  'font-license-review.json',
  'font-license-review.md',
  'checksum-reproducibility-review.json',
  'checksum-reproducibility-review.md',
  'system-font-alternative-review.json',
  'system-font-alternative-review.md',
  'asset-free-import-config-review.json',
  'asset-free-import-config-review.md',
  'private-staging-review.json',
  'private-staging-review.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'exact-font-asset-source-review-decision.json',
  'exact-font-asset-source-review-decision.md',
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
  return /\b(no|do not|not allowed|disallowed|blocked|remain blocked|not accepted|not approved|false|did not|without|never)\b/i.test(
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
const identity = readJson(`${reportDir}/exact-asset-identity-review.json`)
const upstream = readJson(`${reportDir}/upstream-source-review.json`)
const license = readJson(`${reportDir}/font-license-review.json`)
const checksum = readJson(`${reportDir}/checksum-reproducibility-review.json`)
const systemFont = readJson(`${reportDir}/system-font-alternative-review.json`)
const config = readJson(`${reportDir}/asset-free-import-config-review.json`)
const privateStaging = readJson(`${reportDir}/private-staging-review.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-review.json`)
const decisionReport = readJson(`${reportDir}/exact-font-asset-source-review-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')

if (
  packageJson.scripts?.[packageScript] !==
  'node scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs'
) {
  fail('missing_or_invalid_package_script')
}

for (const [label, report] of Object.entries({
  sourceAudit,
  identity,
  upstream,
  license,
  checksum,
  systemFont,
  config,
  privateStaging,
  runtime,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.nextPrompt !== nextPrompt) fail(`next_prompt_drift:${label}:${report.nextPrompt}`)
}

for (const report of [identity, upstream, license, checksum, decisionReport, readiness, manifest]) {
  if (report.requestedAsset !== requestedAsset) fail('requested_asset_drift')
}

for (const pr of [606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}

if (sourceAudit.duplicateReview?.exactFontAssetSourceReviewOpenPrs?.length !== 0) {
  fail('duplicate_exact_font_review_pr_recorded')
}
if (identity.observedInPr !== 600) fail('identity_missing_pr600_evidence')
if (identity.observedNetworkMode !== '--network none') fail('identity_network_mode_drift')
if (identity.fontAssetDownloaded !== false || identity.fontAssetCopied !== false || identity.fontAssetUploaded !== false) {
  fail('identity_claims_asset_operation')
}
if (upstream.officialProjectReferenceFound !== true) fail('upstream_missing_project_reference')
if (upstream.assetBundledInReviewedRepoSource !== false) fail('upstream_claims_asset_bundled')
if (upstream.officialChecksumFound !== false) fail('upstream_claims_checksum')
if (upstream.sourceStableEnoughForStaging !== false) fail('upstream_claims_source_staging_ready')
if (license.exactAssetLicenseKnown !== false) fail('license_claimed_known')
if (license.redistributionAllowedKnown !== false) fail('redistribution_claimed_known')
if (license.privateStagingAllowedKnown !== false) fail('private_staging_claimed_known')
if (license.repoCommitAllowed !== false) fail('repo_commit_allowed')
if (license.cloudRuntimeImageUseAllowedKnown !== false) fail('cloud_runtime_license_claimed_known')
if (checksum.trustedSha256AvailableNow !== false) fail('checksum_claimed_available')
if (checksum.assetDownloadedForChecksum !== false || checksum.checksumComputedNow !== false) fail('checksum_asset_operation_claimed')
if (systemFont.substituteAcceptedNow !== false) fail('system_font_accepted_now')
if (systemFont.reviewedCandidatePackages?.length < 2) fail('system_font_candidates_missing')
if (config.provenSafeConfigAvailableNow !== false || config.assetFreeImportAcceptedNow !== false) {
  fail('asset_free_config_accepted_now')
}
if (
  config.paddleOcrImportedNow !== false ||
  config.paddlePaddleImportedNow !== false ||
  config.ocrObjectInstantiatedNow !== false ||
  config.ocrInferenceRunNow !== false
) {
  fail('config_claims_runtime_execution')
}
if (privateStaging.privateAssetStagingApprovedNow !== false) fail('private_staging_approved')
if (
  privateStaging.gcsUploadAllowedNow !== false ||
  privateStaging.publicArtifactAllowedNow !== false ||
  privateStaging.signedUrlAllowedNow !== false
) {
  fail('private_staging_delivery_scope_enabled')
}
for (const [key, value] of Object.entries(runtime)) {
  if (key.endsWith('Accepted') && value !== false) fail(`runtime_boundary_enabled:${key}`)
}
if (decisionReport.selectedStrategy !== 'font_source_license_followup') fail('selected_strategy_drift')
if (decisionReport.counts?.ownedTools !== 16) fail('owned_tool_count_drift')
if (decisionReport.counts?.acceptedProvenBounded !== 12) fail('accepted_count_drift')
if (decisionReport.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (decisionReport.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (readiness.readyForFontSourceLicenseFollowup !== true) fail('not_ready_for_font_source_license_followup')
if (
  readiness.readyForPrivateAssetStagingApproval !== false ||
  readiness.readyForSystemFontPackageApproval !== false ||
  readiness.readyForAssetFreeImportConfigFollowup !== false ||
  readiness.readyForOcrInference !== false ||
  readiness.readyForModelAssetOperation !== false ||
  readiness.readyForGpu !== false
) {
  fail('readiness_widened_scope')
}
if (
  manifest.fontFilesCommitted !== 0 ||
  manifest.modelFilesCommitted !== 0 ||
  manifest.mediaFilesCommitted !== 0 ||
  manifest.publicArtifactsCreated !== false ||
  manifest.signedUrlsCreated !== false
) {
  fail('manifest_artifact_scope_invalid')
}
if (status.milestone3ExactFontAssetSourceReview?.decision !== decision) fail('status_json_decision_drift')
if (status.milestone3ExactFontAssetSourceReview?.nextPrompt !== nextPrompt) fail('status_json_next_prompt_drift')
const milestone3OcrMlCpuQaAccepted =
  status.milestone3OcrMlCpuQaReview?.decision ===
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
const milestone4ColorImagePipelineQaAccepted =
  status.milestone4ColorImagePipelineQaReview?.decision ===
  'trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup'
const expectedCurrentAcceptedCount = milestone4ColorImagePipelineQaAccepted
  ? 16
  : milestone3OcrMlCpuQaAccepted
  ? 14
  : 12
if (status.counts?.acceptedProvenBounded !== expectedCurrentAcceptedCount || status.counts?.endToEndProductReady !== 0) {
  fail('status_counts_drift')
}

for (const doc of statusDocs) {
  const text = readText(doc)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_3_EXACT_FONT_ASSET_SOURCE_REVIEW')) {
    fail(`status_doc_missing_marker:${doc}`)
  }
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${doc}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${doc}`)
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
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
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
      sourceComponent: 'PaddleX font assets',
      selectedStrategy: decisionReport.selectedStrategy,
      exactAssetLicenseKnown: license.exactAssetLicenseKnown,
      exactAssetChecksumKnown: checksum.trustedSha256AvailableNow,
      privateAssetStagingApprovedNow: privateStaging.privateAssetStagingApprovedNow,
      counts: decisionReport.counts,
      nextPrompt,
      supabaseClassification: decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
