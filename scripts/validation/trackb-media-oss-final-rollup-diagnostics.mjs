#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-final-rollup'
const decision = 'trackb_media_oss_final_rollup_passed_ready_for_tool_call_beta_readiness_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_TOOL_CALL_BETA_READINESS_REVIEW'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'tool-coverage-rollup.json',
  'tool-coverage-rollup.md',
  'tool-call-readiness-review.json',
  'tool-call-readiness-review.md',
  'beta-readiness-review.json',
  'beta-readiness-review.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'final-rollup-decision.json',
  'final-rollup-decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]

const statusDocs = [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const allowedChangedPrefixes = [
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-callable-worker-contracts-implementation/',
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-rerun/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-dry-run/',
  'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review/',
]
const allowedChangedFiles = new Set([
  'package.json',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-config-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-exact-font-asset-source-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-font-source-license-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-system-font-package-execution-blocker-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-3-ocr-ml-cpu-blocker-resolution-followup-diagnostics.mjs',
  'scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-callable-worker-contracts-implementation.md',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-rerun.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-execution.md',
  ...statusDocs,
])

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

function git(args, allowFailure = false) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
      encoding: 'utf8',
    }).trim()
  } catch (error) {
    if (allowFailure) return ''
    throw error
  }
}

function changedFiles() {
  return [
    ...git(['diff', '--name-only'], true).split('\n'),
    ...git(['diff', '--cached', '--name-only'], true).split('\n'),
    ...git(['diff', '--name-only', `${baseRef}...HEAD`], true).split('\n'),
  ].filter(Boolean)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') fail(`owner_drift:${label}:${report.ownerId}`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:final-rollup:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  coverage: readJson(`${reportDir}/tool-coverage-rollup.json`),
  toolCall: readJson(`${reportDir}/tool-call-readiness-review.json`),
  beta: readJson(`${reportDir}/beta-readiness-review.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/final-rollup-decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== '38be65698cac87ecebeb852687eb59175ce8f900') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 741)?.state !== 'MERGED') {
  fail('missing_pr741_source_evidence')
}

const counts = reports.coverage.counts || {}
if (counts.ownedTools !== 16) fail(`owned_count_drift:${counts.ownedTools}`)
if (counts.acceptedProvenBounded !== 16) fail(`accepted_count_drift:${counts.acceptedProvenBounded}`)
if (counts.blockedNotInstalledProven !== 0) fail(`blocked_count_drift:${counts.blockedNotInstalledProven}`)
if (counts.endToEndProductReady !== 0) fail(`product_ready_count_drift:${counts.endToEndProductReady}`)
if (reports.coverage.fortyPlusEndToEndClaimAllowed !== false) fail('forty_plus_claim_allowed')
if (reports.coverage.allOwnedToolsBoundedAcceptedProven !== true) fail('all_owned_tools_not_accepted')

if (reports.toolCall.toolCallRuntimeReadyNow !== false) fail('tool_call_runtime_unblocked')
if (reports.toolCall.toolCallBetaReadyNow !== false) fail('tool_call_beta_unblocked')
if (reports.toolCall.safeNextGate !== nextPrompt) fail(`tool_call_next_prompt_drift:${reports.toolCall.safeNextGate}`)
if (!reports.toolCall.missingForCallableBeta?.includes('route/worker invocation contract tests')) {
  fail('missing_route_worker_contract_blocker')
}

if (reports.beta.internalBetaReadyNow !== false) fail('internal_beta_unblocked')
if (reports.beta.externalBetaReadyNow !== false) fail('external_beta_unblocked')
if (reports.beta.paidProductionReadyNow !== false) fail('paid_production_unblocked')
if (reports.beta.nextPrompt !== nextPrompt) fail(`beta_next_prompt_drift:${reports.beta.nextPrompt}`)

for (const [key, value] of Object.entries(reports.runtime)) {
  if (
    key.endsWith('Accepted') ||
    key === 'gpuExecutionAccepted' ||
    key === 'workerRuntimeAccepted' ||
    key === 'routeRuntimeAccepted' ||
    key === 'providerRuntimeAccepted' ||
    key === 'betaProductionAccepted' ||
    key === 'productReadyAccepted'
  ) {
    if (value !== false) fail(`runtime_scope_unblocked:${key}`)
  }
}

if (reports.decisionReport.nextPrompt !== nextPrompt) fail(`decision_next_prompt_drift:${reports.decisionReport.nextPrompt}`)
if (reports.readiness.readyForToolCallBetaReadinessReview !== true) fail('not_ready_for_next_review')
if (reports.readiness.readyForDirectToolCalls !== false) fail('direct_tool_calls_unblocked')
if (reports.readiness.readyForInternalBeta !== false) fail('internal_beta_readiness_unblocked')

for (const [key, value] of Object.entries(reports.manifest)) {
  if (key !== 'schema' && key !== 'generatedAt' && key !== 'decision' && key !== 'ownerId' && value !== false) {
    fail(`manifest_artifact_unblocked:${key}`)
  }
}

const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
if (status.counts?.acceptedProvenBounded !== 16 || status.counts?.blockedNotInstalledProven !== 0) {
  fail('status_counts_not_final_rollup_ready')
}
if (status.counts?.endToEndProductReady !== 0) fail('status_product_ready_unblocked')
for (const [key, value] of Object.entries(status.blockedScopes || {})) {
  if (value !== false) fail(`status_blocked_scope_unblocked:${key}`)
}

const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-review.md')
if (!promptText.includes(nextPrompt)) fail('missing_next_prompt_token')

const scannedText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  promptText,
].join('\n')

const forbiddenClaims = [
  /40\+.*(end-to-end|end to end).*(proven|ready|installed)/i,
  /\bproduct-ready tools?:\s*[1-9]/i,
  /\b(all 16|16 owned).*\\b(product-ready|ready for production|runtime ready)\\b/i,
  /\b(beta|production)\s+(unlocked|enabled|ready)\b/i,
]
for (const pattern of forbiddenClaims) {
  if (pattern.test(scannedText)) fail(`forbidden_claim:${pattern}`)
}

for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true)) fail(`protected_worktree_diff:${file}`)
  if (git(['diff', '--cached', '--name-only', '--', file], true)) fail(`protected_staged_diff:${file}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
  if (/\.(mp4|mov|mkv|srt|ttf|otf|ttc|png|jpe?g|webp|gif|deb|gpg|asc)$/i.test(file)) {
    fail(`artifact_changed:${file}`)
  }
}

if (/gho_|github_pat_|sk-|AKIA|BEGIN PRIVATE KEY|X-Amz-Signature|sig=|signature=/i.test(scannedText)) {
  fail('secret_or_signed_url_material_detected')
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
      ownerId: 'TRACK_B_MEDIA_OSS_STEWARD',
      counts,
      readyForToolCallBetaReadinessReview: true,
      readyForDirectToolCalls: false,
      readyForInternalBeta: false,
      nextPrompt,
      supabaseClassification: reports.runtime.supabaseClassification,
    },
    null,
    2,
  ),
)
