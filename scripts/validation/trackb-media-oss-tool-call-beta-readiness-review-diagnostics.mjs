#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-review'
const decision = 'trackb_media_oss_tool_call_beta_readiness_review_blocked_pending_callable_worker_contracts'
const nextPrompt = 'TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS_IMPLEMENTATION'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'callable-runtime-contract-review.json',
  'callable-runtime-contract-review.md',
  'approved-snapshot-credit-gate-review.json',
  'approved-snapshot-credit-gate-review.md',
  'private-artifact-result-schema-qa-review.json',
  'private-artifact-result-schema-qa-review.md',
  'beta-readiness-scorecard.json',
  'beta-readiness-scorecard.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'decision.json',
  'decision.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-reconciliation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-callable-worker-contracts-implementation/',
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-rerun/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-dry-run/',
  'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',

  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]
const allowedChangedFiles = new Set([
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
  'scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-go-no-go-review.md',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'package.json',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-activation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-callable-worker-contracts-implementation.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-rerun.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-go-no-go-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-activation.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-testing.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-readiness-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-testing-handoff.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-callable-worker-contracts-implementation.md',
]) {
  readText(file)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:tool-call-beta-readiness-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  callable: readJson(`${reportDir}/callable-runtime-contract-review.json`),
  gates: readJson(`${reportDir}/approved-snapshot-credit-gate-review.json`),
  artifacts: readJson(`${reportDir}/private-artifact-result-schema-qa-review.json`),
  beta: readJson(`${reportDir}/beta-readiness-scorecard.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== '9d97dcd722c777cf2aa803728b9a8ec09f5ae5a6') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 754)?.state !== 'MERGED') {
  fail('missing_pr754_source_evidence')
}
const counts = reports.source.counts || {}
if (counts.ownedTools !== 16) fail(`owned_count_drift:${counts.ownedTools}`)
if (counts.boundedAcceptedProven !== 16) fail(`accepted_count_drift:${counts.boundedAcceptedProven}`)
if (counts.blockedNotInstalledProven !== 0) fail(`blocked_count_drift:${counts.blockedNotInstalledProven}`)
if (counts.productReady !== 0) fail(`product_ready_count_drift:${counts.productReady}`)

if (reports.callable.apiRouteDomainExistsForTrackBToolCalls !== false) fail('api_route_domain_claimed_ready')
if (reports.callable.apiRouteRegistryHasTrackBToolCallRoutes !== false) fail('api_route_registry_claimed_ready')
if (reports.callable.workerRuntimeRegistryHasTrackBToolWorker !== false) fail('worker_registry_claimed_ready')
if (reports.callable.realWorkerHandlerAvailable !== false) fail('real_worker_claimed_ready')
if (reports.callable.directToolCallsReady !== false) fail('direct_tool_calls_unblocked')
if (reports.callable.internalBetaReady !== false) fail('internal_beta_unblocked_callable')
if (!reports.callable.requiredMissingContracts?.includes('Track B tool-call API route definitions')) {
  fail('missing_api_route_contract_blocker')
}

if (reports.gates.approvedSnapshotGateProvenForTrackBToolCalls !== false) fail('approved_snapshot_gate_claimed_ready')
if (reports.gates.creditReservationGateProvenForTrackBToolCalls !== false) fail('credit_gate_claimed_ready')
if (reports.gates.rawChatExecutionBlocked !== true) fail('raw_chat_not_blocked')
if (reports.gates.frontendDirectToolExecutionBlocked !== true) fail('frontend_direct_tool_execution_not_blocked')

for (const [field, value] of Object.entries(reports.artifacts)) {
  if (field.endsWith('ReadyForTrackBToolCalls') && value !== false) fail(`artifact_schema_qa_unblocked:${field}`)
}
if (reports.artifacts.publicArtifactsAllowed !== false) fail('public_artifacts_allowed')
if (reports.artifacts.signedUrlsAsSourceOfTruthAllowed !== false) fail('signed_urls_source_of_truth_allowed')

for (const [field, value] of Object.entries(reports.beta)) {
  if (field.endsWith('Complete') && field !== 'installProofComplete' && value !== false) fail(`beta_gate_unblocked:${field}`)
}
if (reports.beta.installProofComplete !== true) fail('install_proof_not_complete')
if (reports.beta.boundedQaAccepted !== true) fail('bounded_qa_not_accepted')
if (reports.beta.internalBetaReady !== false) fail('internal_beta_claimed_ready')
if (reports.beta.externalBetaReady !== false) fail('external_beta_claimed_ready')
if (reports.beta.productReady !== false) fail('product_ready_claimed')

for (const [field, value] of Object.entries(reports.runtime)) {
  if (field.endsWith('Accepted') && value !== false) fail(`runtime_scope_unblocked:${field}`)
}

if (reports.decisionReport.nextPrompt !== nextPrompt) fail(`decision_next_prompt_drift:${reports.decisionReport.nextPrompt}`)
if (reports.decisionReport.readyForDirectToolCalls !== false) fail('decision_direct_tool_calls_unblocked')
if (reports.decisionReport.readyForInternalBeta !== false) fail('decision_internal_beta_unblocked')
if (reports.readiness.nextPrompt !== nextPrompt) fail(`readiness_next_prompt_drift:${reports.readiness.nextPrompt}`)
if (reports.readiness.boundedToolProofReady !== true) fail('bounded_tool_proof_not_ready')
if (reports.readiness.directToolCallReady !== false) fail('readiness_direct_tool_call_unblocked')
if (reports.readiness.internalBetaReady !== false) fail('readiness_internal_beta_unblocked')
if (reports.readiness.productReady !== false) fail('readiness_product_ready_unblocked')

for (const [field, value] of Object.entries(reports.manifest)) {
  if (field.endsWith('Committed') || field.endsWith('Created') || field === 'gcsUploads' || field === 'supabaseWrites') {
    if (value !== false) fail(`manifest_scope_unblocked:${field}`)
  }
}

const allText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-callable-worker-contracts-implementation.md'),
].join('\n')

const forbiddenPositiveClaims = [
  /\bready for direct tool calls\b/i,
  /\bdirect tool calls ready\b/i,
  /\binternal beta ready\b/i,
  /\bexternal beta ready\b/i,
  /\bproduction ready\b/i,
  /\bproduct-ready local oss tools?:\s*[1-9]/i,
  /\b40\+ tools? (?:proven|ready|end-to-end)\b/i,
]
for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(allText)) fail(`forbidden_positive_claim:${pattern}`)
}

for (const protectedFile of protectedNoDiffFiles) {
  const diff = git(['diff', '--name-only', '--', protectedFile], true)
  const stagedDiff = git(['diff', '--cached', '--name-only', '--', protectedFile], true)
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

const result = {
  ok: failures.length === 0,
  decision,
  nextPrompt,
  failures,
}

console.log(JSON.stringify(result, null, 2))
process.exit(failures.length === 0 ? 0 : 1)
