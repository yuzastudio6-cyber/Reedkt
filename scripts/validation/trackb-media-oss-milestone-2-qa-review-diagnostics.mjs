#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-2-qa-review'
const decision = 'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'evidence-acceptance-review.json',
  'evidence-acceptance-review.md',
  'milestone-2-tool-qa-matrix.json',
  'milestone-2-tool-qa-matrix.md',
  'artifact-safety-qa.json',
  'artifact-safety-qa.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
  'cpu-gpu-qa.json',
  'cpu-gpu-qa.md',
  'trackb-status-update.json',
  'trackb-status-update.md',
  'milestone-3-readiness-review.json',
  'milestone-3-readiness-review.md',
  'milestone-2-qa-decision.json',
  'milestone-2-qa-decision.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review.md',
]) {
  readText(file)
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const evidenceReview = readJson(`${reportDir}/evidence-acceptance-review.json`)
const matrix = readJson(`${reportDir}/milestone-2-tool-qa-matrix.json`)
const artifactSafety = readJson(`${reportDir}/artifact-safety-qa.json`)
const runtime = readJson(`${reportDir}/runtime-boundary-qa.json`)
const cpuGpu = readJson(`${reportDir}/cpu-gpu-qa.json`)
const statusUpdate = readJson(`${reportDir}/trackb-status-update.json`)
const milestone3 = readJson(`${reportDir}/milestone-3-readiness-review.json`)
const decisionReport = readJson(`${reportDir}/milestone-2-qa-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const ownerRegistry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const executionDecision = readJson(
  'docs/open-source-tool-stack/trackb-media-oss-milestone-2-video-analysis-execution/milestone-2-video-analysis-execution-decision.json',
)
const packageJson = readJson('package.json')

for (const [label, report] of Object.entries({
  sourceAudit,
  evidenceReview,
  matrix,
  artifactSafety,
  runtime,
  cpuGpu,
  statusUpdate,
  milestone3,
  decisionReport,
  readiness,
  manifest,
})) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (sourceAudit.ownerId !== ownerId || decisionReport.ownerId !== ownerId) fail('owner_id_drift')
if (sourceAudit.sourceSha !== '18f4ca37c45aa2b0b69d0e2192f297b25d2514e6') fail(`source_sha_drift:${sourceAudit.sourceSha}`)
for (const pr of [571, 567, 563, 559, 557, 551, 549, 546, 545, 542]) {
  if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') fail(`missing_pr${pr}_merged_evidence`)
}
if (sourceAudit.sourceEvidence?.find((entry) => entry.pr === 125)?.canonicalAuthority !== false) {
  fail('pr125_not_marked_context_only')
}
if (executionDecision.decision !== 'trackb_media_oss_milestone2_video_analysis_execution_passed_all_three_tools_cpu_bounded') {
  fail(`stale_or_missing_pr571_decision:${executionDecision.decision}`)
}

sameSet(
  (matrix.tools || []).filter((tool) => tool.acceptedProvenBounded).map((tool) => tool.id),
  ['opencv', 'pyav', 'pyscenedetect'],
  'accepted_milestone2_tools',
)
for (const tool of matrix.tools || []) {
  if (tool.importVersionProven !== true) fail(`tool_import_not_proven:${tool.id}`)
  if (tool.syntheticFixtureProven !== true) fail(`tool_fixture_not_proven:${tool.id}`)
  if (tool.cpuOnly !== true) fail(`tool_not_cpu_only:${tool.id}`)
  if (tool.gpuUsed !== false) fail(`tool_gpu_used:${tool.id}`)
  if (tool.runtimeProductReady !== false) fail(`tool_runtime_ready:${tool.id}`)
  if (tool.rerunInQaPhase !== false) fail(`tool_rerun_in_qa:${tool.id}`)
}
if (matrix.milestone2AcceptedToolCount !== 3) fail('milestone2_accepted_count_not_3')

if (statusUpdate.ownedTools !== 16) fail('owned_tool_count_drift')
if (statusUpdate.acceptedProvenBoundedBeforeMilestone2 !== 9) fail('before_milestone2_count_drift')
if (statusUpdate.milestone2NewlyAcceptedProvenBounded !== 3) fail('new_milestone2_count_drift')
if (statusUpdate.acceptedProvenBoundedTotalAfterQa !== 12) fail('accepted_total_not_12')
if (statusUpdate.stillBlockedNotInstalledProvenCount !== 4) fail('blocked_total_not_4')
sameSet(statusUpdate.stillBlockedNotInstalledProven, ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio'], 'blocked_after_qa')
if (statusUpdate.endToEndProductReadyTools !== 0 || decisionReport.endToEndProductReadyTools !== 0) fail('product_ready_not_zero')
if (statusUpdate.fortyPlusEndToEndClaimAllowed !== false || decisionReport.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')

const milestone3OcrMlCpuQaAccepted =
  status.milestone3OcrMlCpuQaReview?.decision ===
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
const currentExpectedAccepted = [
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
  ...(milestone3OcrMlCpuQaAccepted ? ['paddlepaddle', 'paddleocr'] : []),
]
const currentExpectedBlocked = milestone3OcrMlCpuQaAccepted
  ? ['opencolorio', 'openimageio']
  : ['paddleocr', 'paddlepaddle', 'opencolorio', 'openimageio']
const currentExpectedAcceptedCount = milestone3OcrMlCpuQaAccepted ? 14 : 12
const currentExpectedBlockedCount = milestone3OcrMlCpuQaAccepted ? 2 : 4
sameSet(status.acceptedProvenBounded?.map((tool) => tool.id), currentExpectedAccepted, 'status_accepted_after_qa')
sameSet(status.blockedNotInstalledProven, currentExpectedBlocked, 'status_blocked_after_qa')
if (
  status.counts?.acceptedProvenBounded !== currentExpectedAcceptedCount ||
  steward.statusCounts?.acceptedProvenBounded !== currentExpectedAcceptedCount
) {
  fail(`owner_status_accepted_count_not_${currentExpectedAcceptedCount}`)
}
if (
  status.counts?.blockedNotInstalledProven !== currentExpectedBlockedCount ||
  steward.statusCounts?.blockedNotInstalledProven !== currentExpectedBlockedCount
) {
  fail(`owner_status_blocked_count_not_${currentExpectedBlockedCount}`)
}
if (status.counts?.endToEndProductReady !== 0 || steward.statusCounts?.endToEndProductReady !== 0) {
  fail('owner_product_ready_not_zero')
}
const owner = ownerRegistry.owners?.find((entry) => entry.ownerId === ownerId)
if (!owner) fail('missing_trackb_owner')
if (
  owner?.acceptedProvenBoundedCount !== currentExpectedAcceptedCount ||
  owner?.blockedNotInstalledProvenCount !== currentExpectedBlockedCount ||
  owner?.endToEndProductReadyToolCount !== 0
) {
  fail('registry_owner_counts_drift')
}
for (const id of ['opencv', 'pyav', 'pyscenedetect']) {
  const tool = steward.ownedTools?.find((entry) => entry.id === id) || {}
  if (tool.status !== 'accepted_proven_bounded_milestone2') fail(`steward_tool_status_drift:${id}:${tool.status}`)
  if (tool.gpuUsed !== false || tool.mediaProcessingAccepted !== false || tool.endToEndProductReady !== false) {
    fail(`steward_tool_scope_drift:${id}`)
  }
}

if (milestone3.nextPrompt !== nextPrompt || decisionReport.nextPrompt !== nextPrompt || readiness.nextPrompt !== nextPrompt) {
  fail('next_prompt_drift')
}
sameSet((milestone3.candidateTools || []).map((tool) => tool.id), ['paddleocr', 'paddlepaddle'], 'milestone3_candidates')
for (const tool of milestone3.candidateTools || []) {
  if (tool.computeDefault !== 'cpu_tiny_proof_first') fail(`milestone3_not_cpu_tiny_first:${tool.id}`)
}
if (milestone3.executionAllowedNow !== false || milestone3.betaProductionAllowed !== false) fail('milestone3_execution_scope_unblocked')

if (evidenceReview.pr571EvidenceAccepted !== true) fail('pr571_evidence_not_accepted')
if (evidenceReview.buildContextsGeneratedScannedAndCleaned !== true) fail('build_context_evidence_not_clean')
if (evidenceReview.dockerBuildPassed !== true) fail('docker_build_evidence_not_passed')
for (const report of [artifactSafety, runtime, decisionReport, readiness, manifest]) {
  for (const [key, value] of Object.entries(report)) {
    if (/(Accepted|Allowed|Created|Committed|Present|RunInQaPhase|RunInThisPhase|Approved|Printed)$/.test(key)) {
      if (key === 'qaReviewMetadataOnly') continue
      if (key === 'boundedInstallContainerEvidenceAccepted') continue
      if (value !== false) fail(`flag_not_false:${report.schema || 'report'}:${key}:${value}`)
    }
  }
}
for (const tool of cpuGpu.tools || []) {
  if (tool.cpuOnlyProofAccepted !== true) fail(`cpu_proof_not_accepted:${tool.id}`)
  if (tool.gpuUsed !== false || tool.gpuExecutionApproved !== false || tool.futureGpuRequiresSeparateApproval !== true) {
    fail(`gpu_policy_drift:${tool.id}`)
  }
}
if (decisionReport.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (decisionReport.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (decisionReport.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (decisionReport.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (
  packageJson.scripts?.['trackb-media-oss:milestone-2-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-2-qa-review-diagnostics.mjs'
) {
  fail('missing_qa_diagnostics_script')
}
if (
  packageJson.scripts?.['smoke:trackb-media-oss-milestone-2-qa-review'] !==
  'node server/smoke/trackb-media-oss-milestone-2-qa-review-smoke.js'
) {
  fail('missing_qa_smoke_script')
}

const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile', 'docker/prod/cpu-worker/requirements.cpu.txt'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile', 'docker/prod/cpu-worker/requirements.cpu.txt'])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [
  ...requiredFiles,
  ...statusFiles,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review.md',
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
  /\bGPU execution\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
  /\bFFmpeg\/FFprobe expansion\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
  /\b(media processing|media file probing|render\/export|worker runtime|route runtime|provider runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(?:is\s+)?(?:approved|enabled|accepted|unblocked)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const pattern of secretPatterns) if (pattern.test(text)) fail(`secret_like_pattern:${file}`)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|does not|did not|must not|remain blocked|blocked|false|future|separate|requires|only)\b/i.test(line)
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
  console.error('Track B Milestone 2 QA review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  ownerId,
  acceptedMilestone2Tools: ['opencv', 'pyav', 'pyscenedetect'],
  counts: {
    ownedTools: 16,
    acceptedProvenBounded: 12,
    blockedNotInstalledProven: 4,
    endToEndProductReady: 0,
  },
  nextPrompt,
}, null, 2))
