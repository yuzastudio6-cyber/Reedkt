#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review'
const decision = 'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_APPROVAL'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'evidence-acceptance-review.json',
  'evidence-acceptance-review.md',
  'paddlepaddle-qa-review.json',
  'paddlepaddle-qa-review.md',
  'paddleocr-api-shape-qa-review.json',
  'paddleocr-api-shape-qa-review.md',
  'font-config-qa-review.json',
  'font-config-qa-review.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
  'trackb-status-update.json',
  'trackb-status-update.md',
  'milestone-4-readiness-review.json',
  'milestone-4-readiness-review.md',
  'milestone-3-ocr-ml-cpu-qa-decision.json',
  'milestone-3-ocr-ml-cpu-qa-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]
const statusDocs = [
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]
const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/cpu-worker/requirements.cpu.txt',
  'docker/prod/ocr-runtime/Dockerfile',
  'docker/prod/ocr-runtime/requirements.ocr.txt',
]
const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
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
function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}
function isGuardrailLine(line) {
  return /\b(no|not|never|blocked|failed|did not|without|false|remain|future-only|future only|fallback-only|unproven|disallowed|absent|none|not used|not run|not accepted|not approved)\b/i.test(
    line,
  )
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-approval.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
const source = readJson(`${reportDir}/source-of-truth-audit.json`)
const evidence = readJson(`${reportDir}/evidence-acceptance-review.json`)
const paddlePaddle = readJson(`${reportDir}/paddlepaddle-qa-review.json`)
const paddleOcr = readJson(`${reportDir}/paddleocr-api-shape-qa-review.json`)
const fontConfig = readJson(`${reportDir}/font-config-qa-review.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-qa.json`)
const statusUpdate = readJson(`${reportDir}/trackb-status-update.json`)
const milestone4 = readJson(`${reportDir}/milestone-4-readiness-review.json`)
const decisionReport = readJson(`${reportDir}/milestone-3-ocr-ml-cpu-qa-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const registry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const pr635Decision = readJson(
  'docs/open-source-tool-stack/trackb-media-oss-milestone-3-font-config-followup/font-config-followup-decision.json',
)
const milestone4ColorImagePipelineQaAccepted =
  status.milestone4ColorImagePipelineQaReview?.decision ===
  'trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup'

for (const [label, report] of Object.entries({
  source,
  evidence,
  paddlePaddle,
  paddleOcr,
  fontConfig,
  runtime,
  statusUpdate,
  milestone4,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

if (source.sourceSha !== '99595b05b65dd2e6789aceecc144560db1e442cb') fail(`source_sha_drift:${source.sourceSha}`)
for (const pr of [635, 629, 625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_evidence`)
}
if (source.sourceEvidence?.find((entry) => entry.pr === 543)?.canonicalAuthority !== false) fail('pr543_not_context_only')
if (
  pr635Decision.decision !==
  'trackb_media_oss_milestone3_font_config_followup_passed_ready_for_ocr_ml_cpu_qa_review'
) {
  fail(`stale_pr635_decision:${pr635Decision.decision}`)
}
if (evidence.pr635EvidenceAccepted !== true) fail('pr635_evidence_not_accepted')
if (evidence.fontsNotoCjkPresent !== true || evidence.fontsNotoCjkExtraPresent !== false) fail('font_package_evidence_drift')
if (evidence.exactPingFangUsed !== false) fail('exact_pingfang_used')
if (evidence.paddlePaddleProofAccepted !== true || evidence.paddleOcrProofAccepted !== true) fail('missing_paddle_acceptance')

if (paddlePaddle.acceptedAsBoundedCpuProof !== true) fail('paddlepaddle_not_accepted')
if (paddlePaddle.tool?.version !== '3.0.0' || paddlePaddle.tool?.device !== 'cpu') fail('paddlepaddle_version_or_device_drift')
if (paddlePaddle.ocrInferenceRun !== false || paddlePaddle.modelAssetsUsed !== false || paddlePaddle.gpuUsed !== false) {
  fail('paddlepaddle_scope_widened')
}
if (paddleOcr.acceptedAsBoundedCpuProof !== true) fail('paddleocr_not_accepted')
if (paddleOcr.tool?.version !== '3.0.0' || paddleOcr.tool?.paddleOcrInstantiated !== false) fail('paddleocr_boundary_drift')
if (
  paddleOcr.ocrInferenceRun !== false ||
  paddleOcr.modelDownloadRun !== false ||
  paddleOcr.fontDownloadRun !== false ||
  paddleOcr.assetCopiedOrUploaded !== false ||
  paddleOcr.exactPingFangUsed !== false ||
  paddleOcr.gpuUsed !== false
) {
  fail('paddleocr_scope_widened')
}
if (!String(fontConfig.acceptedLocalFontEnv || '').includes('NotoSansCJK-Regular.ttc')) fail('font_config_env_missing')
if (fontConfig.fontsNotoCjkUsed !== true || fontConfig.fontsNotoCjkExtraUsed !== false) fail('font_config_package_drift')
if (fontConfig.exactPingFangUsed !== false || fontConfig.assetOperationAccepted !== false) fail('font_asset_scope_widened')

if (statusUpdate.ownedTools !== 16) fail('owned_tool_count_drift')
if (statusUpdate.acceptedProvenBoundedBeforeQa !== 12) fail('before_qa_count_drift')
if (statusUpdate.newlyAcceptedProvenBoundedInQa !== 2) fail('new_qa_count_drift')
if (statusUpdate.acceptedProvenBoundedTotalAfterQa !== 14) fail('accepted_total_not_14')
if (statusUpdate.stillBlockedNotInstalledProvenCount !== 2) fail('blocked_total_not_2')
sameSet(statusUpdate.stillBlockedNotInstalledProven, ['opencolorio', 'openimageio'], 'blocked_after_qa')
sameSet(
  (statusUpdate.acceptedProvenBoundedAfterQa || []).map((tool) => tool.id),
  [
    'ffmpeg',
    'ffprobe',
    'sharp_libvips',
    'duckdb',
    'polars_nodejs_polars',
    'exiftool',
    'mediainfo',
    'tesseract',
    'imagemagick',
    'opencv',
    'pyav',
    'pyscenedetect',
    'paddlepaddle',
    'paddleocr',
  ],
  'accepted_after_qa',
)
if (decisionReport.endToEndProductReadyTools !== 0 || statusUpdate.endToEndProductReadyTools !== 0) fail('product_ready_not_zero')
if (decisionReport.fortyPlusEndToEndClaimAllowed !== false || statusUpdate.fortyPlusEndToEndClaimAllowed !== false) {
  fail('forty_plus_claim_allowed')
}

const currentAcceptedCount = milestone4ColorImagePipelineQaAccepted ? 16 : 14
const currentBlockedCount = milestone4ColorImagePipelineQaAccepted ? 0 : 2
const currentBlockedTools = milestone4ColorImagePipelineQaAccepted ? [] : ['opencolorio', 'openimageio']
const currentAcceptedTools = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'duckdb',
  'polars_nodejs_polars',
  'exiftool',
  'mediainfo',
  'tesseract',
  'imagemagick',
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddlepaddle',
  'paddleocr',
  ...(milestone4ColorImagePipelineQaAccepted ? ['opencolorio', 'openimageio'] : []),
]
if (
  status.counts?.acceptedProvenBounded !== currentAcceptedCount ||
  steward.statusCounts?.acceptedProvenBounded !== currentAcceptedCount
) {
  fail(`status_accepted_count_not_${currentAcceptedCount}`)
}
if (
  status.counts?.blockedNotInstalledProven !== currentBlockedCount ||
  steward.statusCounts?.blockedNotInstalledProven !== currentBlockedCount
) {
  fail(`status_blocked_count_not_${currentBlockedCount}`)
}
sameSet(status.blockedNotInstalledProven, currentBlockedTools, 'status_blocked')
sameSet(
  status.acceptedProvenBounded?.map((tool) => tool.id),
  currentAcceptedTools,
  'status_accepted',
)
for (const id of ['paddlepaddle', 'paddleocr']) {
  const tool = steward.ownedTools?.find((entry) => entry.id === id) || {}
  if (tool.status !== 'accepted_proven_bounded_milestone3_ocr_ml_cpu') fail(`steward_tool_status_drift:${id}:${tool.status}`)
  if (
    tool.gpuUsed !== false ||
    tool.ocrInferenceAccepted !== false ||
    tool.modelAssetOperationsAccepted !== false ||
    tool.fontAssetOperationsAccepted !== false ||
    tool.endToEndProductReady !== false
  ) {
    fail(`steward_tool_scope_drift:${id}`)
  }
}
const owner = registry.owners?.find((entry) => entry.ownerId === ownerId)
if (!owner) fail('missing_trackb_owner')
if (
  owner?.acceptedProvenBoundedCount !== currentAcceptedCount ||
  owner?.blockedNotInstalledProvenCount !== currentBlockedCount
) {
  fail('registry_owner_counts_drift')
}
if (owner?.endToEndProductReadyToolCount !== 0) fail('registry_owner_product_ready_not_zero')

sameSet((milestone4.candidateTools || []).map((tool) => tool.id), ['opencolorio', 'openimageio'], 'milestone4_candidates')
if (milestone4.nextPrompt !== nextPrompt || decisionReport.nextPrompt !== nextPrompt || readiness.nextPrompt !== nextPrompt) {
  fail('next_prompt_drift')
}
if (milestone4.executionAllowedNow !== false || milestone4.betaProductionAllowed !== false) fail('milestone4_scope_unblocked')

for (const report of [runtime, decisionReport, readiness, manifest]) {
  for (const [key, value] of Object.entries(report)) {
    if (/(Accepted|Allowed|Created|Committed|Present|RunInQaPhase|RunInThisPhase|Approved|Printed)$/.test(key)) {
      if (key === 'qaReviewMetadataOnly') continue
      if (key === 'boundedCpuImportApiEvidenceAccepted') continue
      if (value !== false) fail(`flag_not_false:${report.schema || 'report'}:${key}:${value}`)
    }
  }
}
if (decisionReport.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decisionReport.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decisionReport.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decisionReport.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

const requiredScripts = {
  'trackb-media-oss:milestone-3-ocr-ml-cpu-qa-review:plan':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-plan.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-qa-review':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-qa-review:report':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-report.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-qa-review:summary':
    'node server/cli/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-summary.js',
  'trackb-media-oss:milestone-3-ocr-ml-cpu-qa-review:diagnostics':
    'node scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-diagnostics.mjs',
  'smoke:trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review':
    'node server/smoke/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review-smoke.js',
}
for (const [script, target] of Object.entries(requiredScripts)) {
  if (packageJson.scripts?.[script] !== target) fail(`missing_or_invalid_script:${script}`)
}

const protectedDiff = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')
for (const output of forbiddenOutputs) if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(fullPath(broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}

for (const doc of [
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]) {
  const text = readText(doc)
  if (!text.includes('TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_QA_REVIEW')) fail(`status_doc_missing_marker:${doc}`)
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${doc}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${doc}`)
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-approval.md',
]
const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/i,
  /\bX-Amz-Signature=/i,
  /BEGIN [A-Z ]*PRIVATE KEY/,
]
const forbiddenPositivePatterns = [
  /\b40\+\s+tools\s+(?:are\s+)?(?:installed|proven).{0,80}end-to-end/i,
  /\bend-to-end product-ready (?:Track B )?tools:\s*[1-9]/i,
  /\b(OCR inference|model asset|font asset|GPU execution|Docker|PaddleOCR execution|PaddlePaddle execution|OpenColorIO|OpenImageIO|media processing|render\/export|worker runtime|route runtime|provider runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked|ran|passed)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const pattern of secretPatterns) if (pattern.test(text)) fail(`secret_like_pattern:${file}`)
  for (const line of text.split(/\r?\n/)) {
    const negative = isGuardrailLine(line)
    for (const pattern of forbiddenPositivePatterns) {
      pattern.lastIndex = 0
      if (!negative && pattern.test(line)) fail(`forbidden_positive_claim:${file}:${line.trim()}`)
    }
  }
}

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  if (/\.(ttf|otf|ttc|woff2?|onnx|pdmodel|pdiparams|mp4|mov|m4v|webm|mp3|wav|flac|aac)$/i.test(file)) {
    fail(`forbidden_tracked_asset:${file}`)
  }
}

if (failures.length) {
  console.error('Track B Milestone 3 OCR/ML CPU QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      ownerId,
      acceptedMilestone3Tools: ['paddlepaddle', 'paddleocr'],
      counts: {
        ownedTools: 16,
        acceptedProvenBounded: currentAcceptedCount,
        blockedNotInstalledProven: currentBlockedCount,
        endToEndProductReady: 0,
      },
      nextPrompt,
    },
    null,
    2,
  ),
)
