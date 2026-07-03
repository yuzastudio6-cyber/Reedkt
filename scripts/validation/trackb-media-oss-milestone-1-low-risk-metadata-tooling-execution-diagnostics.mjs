#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution'
const expectedTools = ['exiftool', 'mediainfo', 'tesseract', 'imagemagick_graphicsmagick']
const allowedDecisions = new Set([
  'trackb_media_oss_milestone1_execution_passed_all_four_tools_cpu_bounded',
  'trackb_media_oss_milestone1_execution_passed_partial_pending_system_binary_packaging',
  'trackb_media_oss_milestone1_blocked_pending_exiftool_install',
  'trackb_media_oss_milestone1_blocked_pending_mediainfo_install',
  'trackb_media_oss_milestone1_blocked_pending_tesseract_install',
  'trackb_media_oss_milestone1_blocked_pending_imagemagick_graphicsmagick_install',
  'trackb_media_oss_milestone1_blocked_pending_fixture_safety_review',
  'trackb_media_oss_milestone1_blocked_pending_container_packaging_approval',
  'rejected_due_runtime_safety_risk',
])
const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'tool-availability-report.json',
  'tool-availability-report.md',
  'synthetic-fixture-policy.json',
  'synthetic-fixture-policy.md',
  'exiftool-proof-report.json',
  'exiftool-proof-report.md',
  'mediainfo-proof-report.json',
  'mediainfo-proof-report.md',
  'tesseract-proof-report.json',
  'tesseract-proof-report.md',
  'imagemagick-graphicsmagick-proof-report.json',
  'imagemagick-graphicsmagick-proof-report.md',
  'system-packaging-manifest.json',
  'system-packaging-manifest.md',
  'cpu-gpu-cost-performance-report.json',
  'cpu-gpu-cost-performance-report.md',
  'milestone-1-status-matrix.json',
  'milestone-1-status-matrix.md',
  'milestone-1-decision.json',
  'milestone-1-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
].map((file) => `${reportDir}/${file}`)

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
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

for (const file of requiredFiles) readText(file)

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const availability = readJson(`${reportDir}/tool-availability-report.json`)
const fixturePolicy = readJson(`${reportDir}/synthetic-fixture-policy.json`)
const packaging = readJson(`${reportDir}/system-packaging-manifest.json`)
const cpuGpu = readJson(`${reportDir}/cpu-gpu-cost-performance-report.json`)
const matrix = readJson(`${reportDir}/milestone-1-status-matrix.json`)
const decision = readJson(`${reportDir}/milestone-1-decision.json`)
const readiness = readJson(`${reportDir}/readiness-report.json`)
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const packageJson = readJson('package.json')

if (!allowedDecisions.has(decision.decision)) fail(`unexpected_decision:${decision.decision}`)
for (const report of [availability, fixturePolicy, packaging, cpuGpu, matrix, readiness, manifest]) {
  if (report.decision !== decision.decision) fail(`decision_drift:${report.schema}:${report.decision}`)
}
if (sourceAudit.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') fail('owner_id_drift')
if (sourceAudit.lane !== 'TRACK_B_MEDIA_PROCESSING') fail('lane_drift')
if (sourceAudit.mergedEvidence?.find((entry) => entry.pr === 545)?.state !== 'MERGED') fail('missing_pr545_merged_evidence')
if (sourceAudit.mergedEvidence?.find((entry) => entry.pr === 542)?.state !== 'MERGED') fail('missing_pr542_merged_evidence')
if (sourceAudit.aiGraphicsOwnerPr543?.ownsTrackBTools !== false) fail('pr543_trackb_ownership_drift')
if (sourceAudit.cpuOnly !== true || sourceAudit.syntheticFixturesOnly !== true || sourceAudit.noRealUserMedia !== true) fail('source_scope_flags_invalid')
sameSet(sourceAudit.milestoneTools || [], expectedTools, 'source_milestone_tools')
sameSet((availability.tools || []).map((tool) => tool.id), expectedTools, 'availability_tools')
sameSet((matrix.tools || []).map((tool) => tool.id), expectedTools, 'matrix_tools')
sameSet((packaging.tools || []).map((tool) => tool.id), expectedTools, 'packaging_tools')

if (fixturePolicy.realUserMediaUsed !== false || fixturePolicy.publicArtifactsCreated !== false || fixturePolicy.signedUrlsCreated !== false) {
  fail('fixture_policy_unblocked_forbidden_artifact_scope')
}
if (fixturePolicy.fixtureOutputsCommitted !== false || manifest.fixtureOutputsCommitted !== false) fail('fixture_outputs_committed')
if (cpuGpu.gpuRequired !== false || cpuGpu.gpuRunInThisPhase !== false) fail('gpu_scope_enabled')
if (decision.endToEndProductReadyTools !== 0) fail('product_ready_tools_claimed')
if (decision.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
for (const flag of [
  'dependencyInstallRunInThisPhase',
  'packageLockMutationAllowed',
  'dockerBuildRunInThisPhase',
  'dockerRunInThisPhase',
  'ffmpegFfprobeRunInThisPhase',
  'forbiddenTrackBToolsRunInThisPhase',
  'realUserMediaUsed',
  'mediaProcessingAccepted',
  'renderExportAccepted',
  'workerRuntimeAccepted',
  'routeProviderRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'rawPromptExecutionAccepted',
  'betaProductionAccepted',
]) {
  if (decision[flag] !== false) fail(`decision_flag_not_false:${flag}`)
}
for (const row of matrix.tools || []) {
  if (row.accepted_proven && (!row.version_proven || !row.fixture_proven || row.packaging_required)) {
    fail(`accepted_tool_without_complete_proof:${row.id}`)
  }
}
if (readiness.readiness !== (decision.decision === 'trackb_media_oss_milestone1_execution_passed_all_four_tools_cpu_bounded')) {
  fail('readiness_mismatch')
}
if (decision.decision === 'trackb_media_oss_milestone1_execution_passed_all_four_tools_cpu_bounded') {
  if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-qa-review.md'))) {
    fail('missing_qa_next_prompt')
  }
} else if (!fs.existsSync(path.join(repoRoot, 'docs/implementation-prompts/prompt-trackb-media-oss-milestone-1-system-packaging-approval.md'))) {
  fail('missing_packaging_next_prompt')
}

if (
  packageJson.scripts?.['trackb-media-oss:milestone-1-low-risk-metadata-tooling:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution-diagnostics.mjs'
) {
  fail('missing_package_diagnostics_script')
}

const scanFiles = [
  ...requiredFiles,
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
]
const forbiddenLinePatterns = [
  /40\+\s+tools\s+(are\s+)?(installed|proven).{0,60}end-to-end/i,
  /end-to-end product-ready (?:Track B )?tools:\s*[1-9]/i,
  /\b(media processing|render\/export|worker runtime|provider runtime|route runtime|Supabase|GCS|public artifact|signed URL|raw prompt|beta|production)\s+(is\s+)?(approved|enabled|accepted|unblocked)\b/i,
  /\b(ffmpeg|ffprobe|opencv|pyav|pyscenedetect|paddleocr|paddlepaddle|opencolorio|openimageio)\s+(version|fixture|proof|execution).{0,40}(passed|ran|accepted|proven)\b/i,
  /\b(sk-proj-|sk-live-|ghp_|postgres:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i,
]
for (const file of scanFiles) {
  const text = readText(file)
  for (const line of text.split(/\r?\n/)) {
    const negative = /\b(no|not|do not|must not|remain blocked|blocked|false|without claiming|does not|non-duplicate)\b/i.test(line)
    for (const pattern of forbiddenLinePatterns) {
      if (!negative && pattern.test(line)) fail(`forbidden_claim:${file}:${line.trim()}`)
    }
  }
}

for (const broadDoc of ['docs/beta-readiness-scorecard.md', 'docs/production-beta-blocker-inventory.md', 'PRODUCTION_FOUNDATION_STATUS.md']) {
  if (fs.existsSync(path.join(repoRoot, broadDoc))) fail(`broad_doc_created:${broadDoc}`)
}
for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(repoRoot, output))) fail(`forbidden_output_present:${output}`)
}
const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile'])
const protectedCachedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile'])
if (protectedDiff || protectedCachedDiff) fail('protected_file_mutation')
const forbiddenStatus = git(['status', '--short'])
  .split('\n')
  .filter(Boolean)
  .filter((line) => /(^|\/)(node_modules|dist|dist-[^/]+)(\/|$)/.test(line.slice(3)))
if (forbiddenStatus.length) fail(`forbidden_output_status:${forbiddenStatus.join(',')}`)

if (failures.length) {
  console.error('Track B media OSS Milestone 1 low-risk metadata tooling diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      tools: expectedTools,
      acceptedProvenMilestone1Tools: decision.acceptedProvenMilestone1Tools,
      blockedMilestone1Tools: decision.blockedMilestone1Tools,
      nextPrompt: decision.nextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
