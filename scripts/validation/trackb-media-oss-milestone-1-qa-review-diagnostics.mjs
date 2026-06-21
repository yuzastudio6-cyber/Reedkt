#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-qa-review'
const decision = 'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_APPROVAL'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'evidence-acceptance-review.json',
  'evidence-acceptance-review.md',
  'milestone-1-tool-qa-matrix.json',
  'milestone-1-tool-qa-matrix.md',
  'artifact-safety-qa.json',
  'artifact-safety-qa.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
  'trackb-status-update.json',
  'trackb-status-update.md',
  'milestone-2-readiness-review.json',
  'milestone-2-readiness-review.md',
  'milestone-1-qa-decision.json',
  'milestone-1-qa-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)

const statusFiles = [
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

const failures = []
function fail(message) {
  failures.push(message)
}
function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`missing_file:${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
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

for (const file of [
  ...requiredFiles,
  ...statusFiles,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-approval.md',
]) {
  readText(file)
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const evidenceReview = readJson(`${reportDir}/evidence-acceptance-review.json`)
const matrix = readJson(`${reportDir}/milestone-1-tool-qa-matrix.json`)
const artifactSafety = readJson(`${reportDir}/artifact-safety-qa.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-qa.json`)
const statusUpdate = readJson(`${reportDir}/trackb-status-update.json`)
const milestone2 = readJson(`${reportDir}/milestone-2-readiness-review.json`)
const decisionReport = readJson(`${reportDir}/milestone-1-qa-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const ownerRegistry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const packageJson = readJson('package.json')

for (const [label, report] of Object.entries({
  sourceAudit,
  evidenceReview,
  matrix,
  artifactSafety,
  runtime,
  statusUpdate,
  milestone2,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (sourceAudit.ownerId !== ownerId || decisionReport.ownerId !== ownerId) fail('owner_id_drift')
for (const pr of [559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_evidence`)
}
if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === 559)?.acceptedVariant !== 'dejavu_sans_bold_large_psm7') {
  fail('missing_pr559_accepted_variant')
}
if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === 557)?.blockerEvidence !== 'tesseract_fixture_output_REEDLTPRU_expected_REEDITPRO') {
  fail('missing_pr557_prior_blocker_evidence')
}

sameSet(
  (matrix.tools || []).filter((tool) => tool.acceptedProvenBounded).map((tool) => tool.id),
  ['exiftool', 'mediainfo', 'tesseract', 'imagemagick'],
  'accepted_milestone1_tools',
)
const tesseract = (matrix.tools || []).find((tool) => tool.id === 'tesseract') || {}
if (tesseract.acceptedVariant !== 'dejavu_sans_bold_large_psm7') fail('tesseract_variant_drift')
if (tesseract.observedNormalizedOutput !== 'REEDITPRO') fail('tesseract_output_drift')
if (tesseract.priorRejectedOutput !== 'REEDLTPRU') fail('missing_prior_bad_ocr_output')
if (matrix.graphicsMagick?.countedAsAcceptedProven !== false || matrix.graphicsMagick?.installedOrProven !== false) {
  fail('graphicsmagick_counted_or_proven')
}

if (statusUpdate.ownedTools !== 16) fail('owned_tool_count_drift')
if (statusUpdate.previouslyAcceptedProvenBounded !== 5) fail('previous_count_drift')
if (statusUpdate.milestone1AcceptedProvenBounded !== 4) fail('milestone1_count_drift')
if (statusUpdate.acceptedProvenBoundedTotalAfterQa !== 9) fail('accepted_total_not_9')
if (statusUpdate.stillBlockedNotInstalledProvenCount !== 7) fail('blocked_total_not_7')
if (statusUpdate.endToEndProductReadyTools !== 0 || decisionReport.endToEndProductReadyTools !== 0) fail('product_ready_not_zero')
if (statusUpdate.fortyPlusEndToEndClaimAllowed !== false || decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
sameSet(statusUpdate.stillBlockedNotInstalledProven, ['opencv', 'pyav', 'pyscenedetect', 'paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio'], 'blocked_after_qa')
const milestone2QaAccepted =
  status.milestone2QaReview?.decision ===
  'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review'
const milestone3OcrMlCpuQaAccepted =
  status.milestone3OcrMlCpuQaReview?.decision ===
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
const expectedAcceptedStatus = milestone3OcrMlCpuQaAccepted
  ? ['ffmpeg', 'ffprobe', 'sharp_libvips', 'duckdb', 'polars_nodejs_polars', 'exiftool', 'mediainfo', 'tesseract', 'imagemagick', 'opencv', 'pyav', 'pyscenedetect', 'paddlepaddle', 'paddleocr']
  : milestone2QaAccepted
  ? ['ffmpeg', 'ffprobe', 'sharp_libvips', 'duckdb', 'polars_nodejs_polars', 'exiftool', 'mediainfo', 'tesseract', 'imagemagick', 'opencv', 'pyav', 'pyscenedetect']
  : ['ffmpeg', 'ffprobe', 'sharp_libvips', 'duckdb', 'polars_nodejs_polars', 'exiftool', 'mediainfo', 'tesseract', 'imagemagick']
const expectedBlockedStatus = milestone3OcrMlCpuQaAccepted
  ? ['opencolorio', 'openimageio']
  : milestone2QaAccepted
  ? ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
  : ['opencv', 'pyav', 'pyscenedetect', 'paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
sameSet(status.acceptedProvenBounded?.map((tool) => tool.id), expectedAcceptedStatus, 'status_accepted_after_qa')
sameSet(status.blockedNotInstalledProven, expectedBlockedStatus, 'status_blocked_after_qa')

if (milestone3OcrMlCpuQaAccepted) {
  if (status.counts?.acceptedProvenBounded !== 14 || steward.statusCounts?.acceptedProvenBounded !== 14) fail('owner_status_accepted_count_not_14_after_milestone3_ocr_ml_cpu_qa')
  if (status.counts?.blockedNotInstalledProven !== 2 || steward.statusCounts?.blockedNotInstalledProven !== 2) fail('owner_status_blocked_count_not_2_after_milestone3_ocr_ml_cpu_qa')
} else if (milestone2QaAccepted) {
  if (status.counts?.acceptedProvenBounded !== 12 || steward.statusCounts?.acceptedProvenBounded !== 12) fail('owner_status_accepted_count_not_12_after_milestone2_qa')
  if (status.counts?.blockedNotInstalledProven !== 4 || steward.statusCounts?.blockedNotInstalledProven !== 4) fail('owner_status_blocked_count_not_4_after_milestone2_qa')
} else {
  if (status.counts?.acceptedProvenBounded !== 9 || steward.statusCounts?.acceptedProvenBounded !== 9) fail('owner_status_accepted_count_not_9')
  if (status.counts?.blockedNotInstalledProven !== 7 || steward.statusCounts?.blockedNotInstalledProven !== 7) fail('owner_status_blocked_count_not_7')
}
if (status.counts?.endToEndProductReady !== 0 || steward.statusCounts?.endToEndProductReady !== 0) fail('owner_product_ready_not_zero')
const owner = ownerRegistry.owners?.find((entry) => entry.ownerId === ownerId)
if (!owner) fail('missing_trackb_owner')
if (milestone3OcrMlCpuQaAccepted) {
  if (owner?.acceptedProvenBoundedCount !== 14 || owner?.blockedNotInstalledProvenCount !== 2 || owner?.endToEndProductReadyToolCount !== 0) {
    fail('registry_owner_counts_after_milestone3_ocr_ml_cpu_qa_drift')
  }
} else if (milestone2QaAccepted) {
  if (owner?.acceptedProvenBoundedCount !== 12 || owner?.blockedNotInstalledProvenCount !== 4 || owner?.endToEndProductReadyToolCount !== 0) {
    fail('registry_owner_counts_after_milestone2_qa_drift')
  }
} else if (owner?.acceptedProvenBoundedCount !== 9 || owner?.blockedNotInstalledProvenCount !== 7 || owner?.endToEndProductReadyToolCount !== 0) {
  fail('registry_owner_counts_drift')
}
const combinedImageTool = steward.ownedTools?.find((tool) => tool.id === 'imagemagick_graphicsmagick') || {}
if (combinedImageTool.imageMagickAcceptedProven !== true || combinedImageTool.graphicsMagickAcceptedProven !== false) {
  fail('imagemagick_graphicsmagick_boundary_drift')
}

if (milestone2.nextPrompt !== nextPrompt || decisionReport.nextPrompt !== nextPrompt || readiness.nextPrompt !== nextPrompt) fail('next_prompt_drift')
sameSet((milestone2.candidateTools || []).map((tool) => tool.id), ['opencv', 'pyav', 'pyscenedetect'], 'milestone2_candidates')
for (const tool of milestone2.candidateTools || []) {
  if (tool.computeDefault !== 'cpu_first') fail(`milestone2_not_cpu_first:${tool.id}`)
}

for (const report of [artifactSafety, runtime, decisionReport, readiness, manifest]) {
  for (const [key, value] of Object.entries(report)) {
    if (/(Accepted|Allowed|Created|Committed|Present|RunInQaPhase|RunInThisPhase)$/.test(key)) {
      if (key === 'qaReviewMetadataOnly') continue
      if (value !== false) fail(`flag_not_false:${report.schema || 'report'}:${key}:${value}`)
    }
  }
}
if (artifactSafety.pr557GeneratedOutputsCleaned !== true || artifactSafety.pr559GeneratedOutputsCleaned !== true) {
  fail('prior_outputs_not_recorded_clean')
}
if (readiness.readyForMilestone2VideoAnalysisApproval !== true) fail('milestone2_readiness_not_true')
if (readiness.readyForRuntimeExecution !== false || readiness.readyForMediaProcessing !== false) fail('runtime_readiness_unblocked')
if (decisionReport.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decisionReport.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decisionReport.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decisionReport.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-qa-review-diagnostics.mjs'
) {
  fail('missing_qa_diagnostics_script')
}
if (
  packageJson.scripts?.['smoke:trackb-media-oss-milestone-1-qa-review'] !==
  'node server/smoke/trackb-media-oss-milestone-1-qa-review-smoke.js'
) {
  fail('missing_qa_smoke_script')
}

const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile'])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [...requiredFiles, ...statusFiles, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-2-video-analysis-approval.md']
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
  /\b(GraphicsMagick)\s+(?:is\s+)?(?:accepted|proven|installed)\b/i,
  /\b(media processing|media file probing|render\/export|worker runtime|route runtime|provider runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const pattern of secretPatterns) if (pattern.test(text)) fail(`secret_like_pattern:${file}`)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|future|separate|optional fallback|not counted|not installed|not created|without)\b/i.test(line)
    for (const pattern of forbiddenPositivePatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_positive_claim:${file}:${line.trim()}`)
    }
  }
}

for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}

const forbiddenStatus = git(['status', '--short'])
  .split('\n')
  .filter(Boolean)
  .filter((line) => /(^|\/)(dist|dist-[^/]+|node_modules)(\/|$)/.test(line.slice(3)))
if (forbiddenStatus.length) fail(`forbidden_output_status:${forbiddenStatus.join(',')}`)

if (failures.length) {
  console.error('Track B Milestone 1 QA review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  acceptedProvenBoundedAfterQa: 9,
  stillBlockedNotInstalledProven: 7,
  endToEndProductReadyTools: 0,
  nextPrompt,
  supabaseClassification: 'no write / environment none / SQL none / migration no',
}, null, 2))
