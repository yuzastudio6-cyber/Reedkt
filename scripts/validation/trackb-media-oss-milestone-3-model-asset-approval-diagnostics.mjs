#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-model-asset-approval'
const decision =
  'trackb_media_oss_milestone3_model_asset_approval_passed_ready_for_exact_asset_source_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_EXACT_FONT_ASSET_SOURCE_REVIEW'
const nextPromptPath =
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-exact-font-asset-source-review.md'
const requestedAsset = 'PingFang-SC-Regular.ttf'
const packageScript = 'trackb-media-oss:milestone-3-model-asset-approval:diagnostics'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'paddlex-font-asset-blocker-review.json',
  'paddlex-font-asset-blocker-review.md',
  'font-source-license-provenance-review.json',
  'font-source-license-provenance-review.md',
  'system-font-substitute-review.json',
  'system-font-substitute-review.md',
  'paddleocr-asset-configuration-review.json',
  'paddleocr-asset-configuration-review.md',
  'private-asset-staging-policy.json',
  'private-asset-staging-policy.md',
  'runtime-boundary-policy.json',
  'runtime-boundary-policy.md',
  'milestone-3-model-asset-approval-decision.json',
  'milestone-3-model-asset-approval-decision.md',
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
const forbiddenPathExtensions = [
  '.ttf',
  '.otf',
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
  /PaddleOCR execution (?:passed|enabled|ran|accepted)/i,
  /PaddlePaddle execution (?:passed|enabled|ran|accepted)/i,
  /font asset (?:downloaded|copied|uploaded|staged|committed)/i,
  /model asset (?:downloaded|copied|uploaded|staged|committed)/i,
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

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText(nextPromptPath)

const packageJson = readJson('package.json')
const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const blockerReview = readJson(`${reportDir}/paddlex-font-asset-blocker-review.json`)
const provenance = readJson(`${reportDir}/font-source-license-provenance-review.json`)
const systemFont = readJson(`${reportDir}/system-font-substitute-review.json`)
const configReview = readJson(`${reportDir}/paddleocr-asset-configuration-review.json`)
const privatePolicy = readJson(`${reportDir}/private-asset-staging-policy.json`)
const runtimeBoundary = readJson(`${reportDir}/runtime-boundary-policy.json`)
const decisionReport = readJson(`${reportDir}/milestone-3-model-asset-approval-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')

if (
  packageJson.scripts?.[packageScript] !==
  'node scripts/validation/trackb-media-oss-milestone-3-model-asset-approval-diagnostics.mjs'
) {
  fail('missing_or_invalid_package_script')
}

for (const [label, report] of Object.entries({
  sourceAudit,
  blockerReview,
  provenance,
  systemFont,
  configReview,
  privatePolicy,
  runtimeBoundary,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.nextPrompt !== nextPrompt) fail(`next_prompt_drift:${label}:${report.nextPrompt}`)
  if (report.requestedAsset !== requestedAsset) fail(`requested_asset_drift:${label}`)
}

for (const pr of [600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.predecessorEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_merged_pr_${pr}`)
  }
}

if (blockerReview.observedInPr !== 600) fail('blocker_review_missing_pr_600')
if (blockerReview.sourceComponent !== 'PaddleX font assets') fail('source_component_drift')
if (blockerReview.observedNetworkMode !== '--network none') fail('network_mode_drift')
if (blockerReview.ocrInferenceRun !== false) fail('ocr_inference_claimed_in_blocker_review')
if (blockerReview.assetDownloaded !== false || blockerReview.assetCopied !== false || blockerReview.assetUploaded !== false) {
  fail('asset_operation_claimed_in_blocker_review')
}
if (provenance.exactAssetSourceKnown !== false) fail('exact_asset_source_claimed_known')
if (provenance.exactAssetLicenseKnown !== false) fail('exact_asset_license_claimed_known')
if (provenance.exactAssetChecksumKnown !== false) fail('exact_asset_checksum_claimed_known')
if (provenance.selectedStrategy !== 'exact_asset_source_review') fail('selected_strategy_drift')
if (systemFont.substituteAcceptedNow !== false || systemFont.packageInstallApprovedNow !== false) {
  fail('system_font_substitute_incorrectly_accepted')
}
if (configReview.provenSafeConfigAvailableNow !== false) fail('asset_free_config_incorrectly_proven')
if (configReview.paddleOcrImportedNow !== false || configReview.paddlePaddleImportedNow !== false) {
  fail('paddle_execution_claimed_in_config_review')
}
if (privatePolicy.privateAssetStagingApprovedNow !== false) fail('private_asset_staging_incorrectly_approved')
if (
  privatePolicy.gcsUploadAllowedNow !== false ||
  privatePolicy.publicArtifactAllowedNow !== false ||
  privatePolicy.signedUrlAllowedNow !== false
) {
  fail('private_policy_public_delivery_scope_enabled')
}
for (const [key, value] of Object.entries(runtimeBoundary)) {
  if (key.endsWith('Accepted') && value !== false) fail(`runtime_boundary_enabled:${key}`)
}
if (decisionReport.selectedStrategy !== 'exact_asset_source_review') fail('decision_selected_strategy_drift')
if (decisionReport.counts?.ownedTools !== 16) fail('owned_tool_count_drift')
if (decisionReport.counts?.acceptedProvenBounded !== 12) fail('accepted_count_drift')
if (decisionReport.counts?.blockedNotInstalledProven !== 4) fail('blocked_count_drift')
if (decisionReport.counts?.endToEndProductReady !== 0) fail('product_ready_count_drift')
if (readiness.readyForExactAssetSourceReview !== true) fail('not_ready_for_exact_source_review')
if (
  readiness.readyForSystemFontPackageApproval !== false ||
  readiness.readyForPrivateAssetStagingApproval !== false ||
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
  fail('private_manifest_artifact_scope_invalid')
}
if (status.milestone3ModelAssetApproval?.decision !== decision) fail('status_json_decision_drift')
if (status.milestone3ModelAssetApproval?.nextPrompt !== nextPrompt) fail('status_json_next_prompt_drift')

for (const doc of statusDocs) {
  const text = readText(doc)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_3_MODEL_ASSET_APPROVAL')) fail(`status_doc_missing_marker:${doc}`)
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${doc}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${doc}`)
}

const broadDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
]
for (const doc of broadDocs) {
  if (fs.existsSync(fullPath(doc))) fail(`unexpected_broad_production_doc_created:${doc}`)
}

for (const forbiddenPath of forbiddenPaths) {
  if (fs.existsSync(fullPath(forbiddenPath))) fail(`forbidden_path_present:${forbiddenPath}`)
}

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  if (forbiddenPathExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
    fail(`forbidden_tracked_asset:${file}`)
  }
}

const changedProtected = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
if (changedProtected) fail(`protected_file_mutation:${changedProtected}`)
const stagedProtected = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
if (stagedProtected) fail(`protected_file_staged:${stagedProtected}`)
const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles) {
  for (const file of stagedFiles.split('\n').filter(Boolean)) {
    if (forbiddenPathExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
      fail(`forbidden_staged_asset:${file}`)
    }
  }
}

const textScanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  nextPromptPath,
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
]
function isGuardrailLine(line) {
  return /\b(no|do not|not allowed|disallowed|blocked|remain blocked|not accepted|not approved|false)\b/i.test(line)
}

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
      selectedStrategy: 'exact_asset_source_review',
      exactAssetSourceKnown: false,
      exactAssetLicenseKnown: false,
      exactAssetChecksumKnown: false,
      counts: decisionReport.counts,
      nextPrompt,
      supabaseClassification: decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
