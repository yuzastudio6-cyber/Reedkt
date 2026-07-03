#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-milestone-4-color-image-pipeline-approval'
const decision =
  'trackb_media_oss_milestone4_color_image_pipeline_approval_passed_ready_for_cpu_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_CPU_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'ownership-conflict-review.json',
  'ownership-conflict-review.md',
  'tool-package-strategy.json',
  'tool-package-strategy.md',
  'runtime-target-review.json',
  'runtime-target-review.md',
  'future-verification-command-plan.json',
  'future-verification-command-plan.md',
  'synthetic-fixture-policy.json',
  'synthetic-fixture-policy.md',
  'cpu-gpu-cost-policy.json',
  'cpu-gpu-cost-policy.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'trackb-status-plan.json',
  'trackb-status-plan.md',
  'color-image-pipeline-approval-decision.json',
  'color-image-pipeline-approval-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]

const statusDocs = [
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
  'docker/prod/pro-color-image-runtime/Dockerfile',
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

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

function hasTool(reports, id) {
  return reports.some((report) =>
    JSON.stringify(report).toLowerCase().includes(id.toLowerCase()),
  )
}

function isGuardrailLine(line) {
  return /\b(no|not|never|blocked|without|false|remain|future-only|future only|context-only|unproven|disallowed|absent|none|not run|not approved|not accepted|until execution)\b/i.test(
    line,
  )
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  ownership: readJson(`${reportDir}/ownership-conflict-review.json`),
  packageStrategy: readJson(`${reportDir}/tool-package-strategy.json`),
  runtimeTarget: readJson(`${reportDir}/runtime-target-review.json`),
  commandPlan: readJson(`${reportDir}/future-verification-command-plan.json`),
  fixturePolicy: readJson(`${reportDir}/synthetic-fixture-policy.json`),
  cpuGpu: readJson(`${reportDir}/cpu-gpu-cost-policy.json`),
  runtimeBoundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  statusPlan: readJson(`${reportDir}/trackb-status-plan.json`),
  decisionReport: readJson(`${reportDir}/color-image-pipeline-approval-decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (
  packageJson.scripts?.['trackb-media-oss:milestone-4-color-image-pipeline-approval:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-approval-diagnostics.mjs'
) {
  fail('missing_package_script')
}

for (const pr of [
  639, 635, 629, 625, 620, 615, 613, 606, 600, 592, 587, 583, 578, 574, 571, 567,
  563, 559, 557, 551, 549, 546, 545, 542,
]) {
  if (reports.source.sourceEvidence?.find((entry) => entry.pr === pr)?.state !== 'MERGED') {
    fail(`missing_pr${pr}_source_evidence`)
  }
}

for (const pr of [543, 99, 63, 65, 67, 68]) {
  const context = reports.source.contextOnlyEvidence?.find((entry) => entry.pr === pr)
  if (!context || context.canonicalAuthority !== false) fail(`context_pr_not_context_only:${pr}`)
}

const allReports = Object.values(reports)
if (!hasTool(allReports, 'opencolorio')) fail('opencolorio_missing')
if (!hasTool(allReports, 'openimageio')) fail('openimageio_missing')

if (reports.ownership.conflictBlocksApproval !== false) fail('ownership_conflict_blocks_approval')
if (reports.ownership.trackAProColorImageRuntimeAuthority !== 'context_only_not_track_b_proof') {
  fail('tracka_context_boundary_drift')
}
if (reports.runtimeTarget.selectedFutureTarget !== 'docker/prod/cpu-worker/Dockerfile') {
  fail(`runtime_target_drift:${reports.runtimeTarget.selectedFutureTarget}`)
}
if (reports.runtimeTarget.selectedFutureRequirements !== 'docker/prod/cpu-worker/requirements.cpu.txt') {
  fail(`runtime_requirements_target_drift:${reports.runtimeTarget.selectedFutureRequirements}`)
}
if (reports.runtimeTarget.dockerBuildApprovedNow !== false) fail('docker_build_approved_now')

for (const tool of reports.packageStrategy.tools || []) {
  if (tool.packageMutationInThisPhase !== false || tool.installedOrImportedInThisPhase !== false) {
    fail(`package_scope_widened:${tool.id}`)
  }
  if (tool.futureVersionPinRequired !== true || tool.sourceLicenseMetadataRequired !== true) {
    fail(`package_metadata_gate_missing:${tool.id}`)
  }
}

const counts = reports.statusPlan.currentCounts || {}
if (counts.ownedTools !== 16) fail(`owned_count:${counts.ownedTools}`)
if (counts.acceptedProvenBounded !== 14) fail(`accepted_count:${counts.acceptedProvenBounded}`)
if (counts.blockedNotInstalledProven !== 2) fail(`blocked_count:${counts.blockedNotInstalledProven}`)
if (counts.endToEndProductReady !== 0) fail(`product_ready_count:${counts.endToEndProductReady}`)
for (const id of ['opencolorio', 'openimageio']) {
  if (!reports.statusPlan.currentBlockedTools?.includes(id)) fail(`blocked_tool_missing:${id}`)
}
if (reports.statusPlan.futureIfExecutionAndQaPass?.endToEndProductReady !== 0) {
  fail('future_product_ready_claim')
}

if (reports.decisionReport.nextPrompt !== nextPrompt || reports.readiness.readyForNextPrompt !== nextPrompt) {
  fail('next_prompt_drift')
}
if (reports.readiness.readyForToolExecutionNow !== false) fail('tool_execution_ready_now')
if (reports.cpuGpu.gpuApprovedNow !== false || reports.cpuGpu.computeDefault !== 'cpu_first') {
  fail('gpu_policy_drift')
}
if (
  reports.fixturePolicy.noUserMedia !== true ||
  reports.fixturePolicy.noRealMedia !== true ||
  reports.fixturePolicy.noCommittedBinaryFixturesExpected !== true
) {
  fail('fixture_policy_drift')
}

for (const [key, value] of Object.entries(reports.runtimeBoundary)) {
  if (
    key.endsWith('Run') ||
    key.endsWith('Generated') ||
    key.endsWith('Unlocked') ||
    key === 'toolExecutionRun' ||
    key === 'packageInstallRun' ||
    key === 'dockerBuildRun' ||
    key === 'dockerRun'
  ) {
    if (value !== false) fail(`runtime_boundary_scope_widened:${key}`)
  }
}
if (reports.runtimeBoundary.productReadyTools !== 0) fail('runtime_product_ready_not_zero')
if (reports.runtimeBoundary.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
if (reports.manifest.publicArtifactsCreated !== false || reports.manifest.signedUrlsCreated !== false) {
  fail('public_artifact_or_signed_url_created')
}

const statusJson = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
if (statusJson.milestone4ColorImagePipelineApproval?.decision !== decision) {
  fail('status_json_milestone4_missing')
}
if (statusJson.milestone4ColorImagePipelineApproval?.counts?.acceptedProvenBounded !== 14) {
  fail('status_json_count_drift')
}

for (const file of statusDocs.filter((file) => file.endsWith('.md'))) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${file}`)
}

for (const dir of forbiddenOutputs) {
  if (fs.existsSync(fullPath(dir))) fail(`forbidden_output_present:${dir}`)
}

const protectedDiff = git(['diff', '--name-only', '--', ...protectedNoDiffFiles])
if (protectedDiff) fail(`protected_file_diff:${protectedDiff}`)
const stagedProtectedDiff = git(['diff', '--cached', '--name-only', '--', ...protectedNoDiffFiles])
if (stagedProtectedDiff) fail(`staged_protected_file_diff:${stagedProtectedDiff}`)

const changed = [
  ...git(['diff', '--name-only']).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
]
for (const file of changed) {
  if (/\.(mp4|mov|wav|mp3|m4a|png|jpe?g|webp|tiff?|exr|icc|cube|ocio)$/i.test(file)) {
    fail(`media_or_color_artifact_changed:${file}`)
  }
  if (file === 'package-lock.json' || file.endsWith('requirements.cpu.txt') || file.endsWith('requirements.ocr.txt')) {
    fail(`forbidden_tracked_mutation:${file}`)
  }
}

const allTextFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs.filter((file) => file.endsWith('.md')),
  'docs/implementation-prompts/prompt-trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution.md',
]
const dangerousPatterns = [
  /40\+.*(end-to-end|end to end).*(proven|ready|installed)/i,
  /\bproduct-ready tools?:\s*[1-9]/i,
  /\b(beta|production)\s+(unlocked|enabled|ready)\b/i,
  /\bsigned url\b.*\b(created|enabled|generated)\b/i,
  /\bpublic artifact\b.*\b(created|enabled|generated)\b/i,
]
for (const file of allTextFiles) {
  const text = readText(file)
  for (const line of text.split(/\n/)) {
    if (dangerousPatterns.some((pattern) => pattern.test(line)) && !isGuardrailLine(line)) {
      fail(`dangerous_claim:${file}:${line.trim()}`)
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
      ownerId,
      tools: ['opencolorio', 'openimageio'],
      futureTarget: reports.runtimeTarget.selectedFutureTarget,
      counts,
      nextPrompt,
      supabaseClassification: reports.runtimeBoundary.supabaseClassification,
    },
    null,
    2,
  ),
)
