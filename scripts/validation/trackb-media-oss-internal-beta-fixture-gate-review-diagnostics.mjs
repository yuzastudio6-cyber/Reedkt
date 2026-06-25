#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review'
const decision =
  'trackb_media_oss_internal_beta_fixture_gate_review_passed_ready_for_controlled_internal_beta_fixture_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_CONTROLLED_INTERNAL_BETA_FIXTURE_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'dry-run-evidence-acceptance.json',
  'dry-run-evidence-acceptance.md',
  'fixture-execution-scope.json',
  'fixture-execution-scope.md',
  'ranking-acceptance-review.json',
  'ranking-acceptance-review.md',
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
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
]

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval/',
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan/`,
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/`,
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',

  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'package.json',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-activation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
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
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
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
const fail = (message) => failures.push(message)
const fullPath = (relativePath) => path.join(repoRoot, relativePath)

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
    ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n'),
  ].filter(Boolean)
}

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-execution.md',
]) readText(file)

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  evidence: readJson(`${reportDir}/dry-run-evidence-acceptance.json`),
  scope: readJson(`${reportDir}/fixture-execution-scope.json`),
  ranking: readJson(`${reportDir}/ranking-acceptance-review.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== 'e04eb52d230d5f2b3b3c86d97369ede0f34b8da6') fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 779)?.state !== 'MERGED') fail('missing_pr779_source')
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail('source_next_prompt_drift')

if (reports.evidence.acceptedPayloadFixtureCount !== 16) fail('payload_fixture_count_drift')
for (const field of [
  'acceptedNegativeCasesBlocked',
  'acceptedRankingCoverage',
  'acceptedDisabledRoutes',
  'acceptedWorkerDispatchDisabled',
  'acceptedForControlledFixtureExecutionPlanning',
]) {
  if (reports.evidence[field] !== true) fail(`evidence_field_not_true:${field}`)
}
if (reports.evidence.acceptedForLiveBetaRuntime !== false) fail('live_beta_runtime_accepted')
if (reports.evidence.acceptedForProductReady !== false) fail('product_ready_accepted')

if (reports.scope.futureFixtureExecutionAllowedToPlan !== true) fail('fixture_execution_not_allowed_to_plan')
if (reports.scope.futureFixtureExecutionMustRemainInternal !== true) fail('fixture_not_internal_only')
if (reports.scope.futureFixtureExecutionMayNotUseUserMediaByDefault !== true) fail('user_media_not_blocked_by_default')
if (reports.scope.futureFixtureExecutionMayNotPublishArtifacts !== true) fail('public_artifacts_not_blocked')
if (reports.scope.liveBetaRuntimeApprovedNow !== false) fail('live_beta_runtime_unblocked')
if (reports.scope.productReadyApprovedNow !== false) fail('product_ready_scope_unblocked')

if (reports.ranking.rankingAccepted !== true) fail('ranking_not_accepted')
if (reports.ranking.rankingEntryCount !== 16) fail('ranking_count_drift')
if (reports.ranking.rankingDoesNotAuthorizeExecution !== true) fail('ranking_authorizes_execution')

for (const [field, value] of Object.entries(reports.runtime)) {
  if (value !== false && field !== 'schema' && field !== 'generatedAt' && field !== 'decision' && field !== 'ownerId') {
    fail(`runtime_scope_unblocked:${field}`)
  }
}

if (reports.decisionReport.readyForControlledInternalBetaFixtureExecution !== true) fail('decision_not_ready_for_fixture_execution')
if (reports.decisionReport.readyForLiveBetaRuntime !== false) fail('decision_live_beta_unblocked')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_unblocked')
if (reports.decisionReport.nextPrompt !== nextPrompt) fail('decision_next_prompt_drift')
if (reports.readiness.readyForControlledInternalBetaFixtureExecution !== true) fail('readiness_not_ready_for_fixture_execution')
if (reports.readiness.readyForLiveBetaRuntime !== false) fail('readiness_live_beta_unblocked')
if (reports.readiness.productReady !== false) fail('readiness_product_ready_unblocked')

for (const [field, value] of Object.entries(reports.manifest)) {
  if (field.endsWith('Created') || field.endsWith('Committed') || field === 'gcsUploads' || field === 'supabaseWrites') {
    if (value !== false) fail(`manifest_scope_unblocked:${field}`)
  }
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:internal-beta-fixture-gate-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs'
) fail('missing_package_script')

const allText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-execution.md'),
].join('\n')
for (const pattern of [
  /\bready for direct tool calls\b/i,
  /\blive beta runtime ready\b/i,
  /\bexternal beta ready\b/i,
  /\bproduction ready\b/i,
  /\bproduct-ready local oss tools?:\s*[1-9]/i,
  /\b40\+ tools? (?:proven|ready|end-to-end)\b/i,
  /signedUrl\s*:/,
  /publicUrl\s*:/,
]) {
  if (pattern.test(allText)) fail(`forbidden_claim:${pattern}`)
}

for (const protectedFile of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', protectedFile], true) || git(['diff', '--cached', '--name-only', '--', protectedFile], true)) {
    fail(`protected_file_mutated:${protectedFile}`)
  }
}
for (const output of forbiddenOutputs) if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
  if (
    file === 'package-lock.json' ||
    file.includes('Dockerfile') ||
    file === '.dockerignore' ||
    file.includes('supabase/') ||
    file.startsWith('dist') ||
    file.includes('node_modules') ||
    /\.(mp4|mov|mkv|srt|png|jpg|jpeg|webp|gpg|asc|deb)$/i.test(file)
  ) fail(`forbidden_changed_file:${file}`)
}

const result = { ok: failures.length === 0, decision, nextPrompt, failures }
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length === 0 ? 0 : 1)
