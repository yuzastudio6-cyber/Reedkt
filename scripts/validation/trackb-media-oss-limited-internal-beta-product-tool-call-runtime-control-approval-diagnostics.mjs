#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval'
const controlPlanDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_control_approval_passed_ready_for_controlled_activation_execution'
const planDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_control_plan_passed_ready_for_control_approval'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_CONTROLLED_ACTIVATION_EXECUTION'
const sourceSha = '2f4b24f33f152322ea2996cd5252d929b0010954'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'control-approval-review.json',
  'control-approval-review.md',
  'execution-lane-boundary.json',
  'execution-lane-boundary.md',
  'blocked-scope-confirmations.json',
  'blocked-scope-confirmations.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',`${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
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
  ...statusDocs,
])

const protectedNoDiffFiles = [
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/cpu-worker/Dockerfile',
  'docker/prod/ocr-runtime/Dockerfile',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'supabase/config.toml',
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

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  approval: readJson(`${reportDir}/control-approval-review.json`),
  boundary: readJson(`${reportDir}/execution-lane-boundary.json`),
  blocked: readJson(`${reportDir}/blocked-scope-confirmations.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  plan: readJson(`${controlPlanDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'plan') continue
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.plan.decision !== planDecision) fail(`plan_decision_drift:${reports.plan.decision}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 852)?.state !== 'MERGED') fail('missing_pr852_source')
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')

if (reports.approval.controlPlanApproved !== true) fail('control_plan_not_approved')
if (reports.approval.activationApproved !== false) fail('activation_unexpectedly_approved')
if (reports.approval.readyForControlledActivationExecution !== true) fail('not_ready_for_controlled_activation_execution')
for (const [field, value] of Object.entries(reports.approval.approvedForFutureExecutionLane || {})) {
  if (value !== true) fail(`future_control_not_approved:${field}`)
}
for (const [field, value] of Object.entries(reports.approval.notApprovedByThisGate || {})) {
  if (value !== true) fail(`not_approved_scope_missing:${field}`)
}
if (reports.boundary.futureExecutionLaneOnly !== true) fail('boundary_not_future_only')
if (reports.boundary.currentPhaseRunsRuntime !== false) fail('runtime_unexpectedly_run')
for (const [field, value] of Object.entries(reports.blocked.blockedScopes || {})) {
  if (value !== true) fail(`blocked_scope_missing:${field}`)
}
if (reports.readiness.readyForControlledActivationExecution !== true) fail('readiness_not_ready_for_execution')
if (reports.readiness.readyForActivation !== false) fail('activation_readiness_unexpected_true')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_unexpected_true')

for (const [field, value] of Object.entries(reports.manifest || {})) {
  if (field === 'ownerId' || field === 'decision') continue
  if (value !== false) fail(`manifest_artifact_or_secret_created:${field}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:limited-internal-beta-product-tool-call-runtime-control-approval:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs'
) {
  fail('missing_package_script')
}

for (const file of [
  ...statusDocs,
  `${reportDir}/decision.md`,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
]) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`missing_decision_text:${file}`)
  if (!text.includes(nextPrompt)) fail(`missing_next_prompt_text:${file}`)
}

const repoText = [
  ...statusDocs,
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution.md',
]
  .map((file) => readText(file))
  .join('\n')
for (const forbidden of [
  '40+ tools proven end-to-end',
  'activationApproved\": true',
  'readyForActivation\": true',
  'externalBetaApproved\": true',
  'productionApproved\": true',
]) {
  if (repoText.includes(forbidden)) fail(`forbidden_claim:${forbidden}`)
}

for (const file of changedFiles()) {
  if (!(allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix)))) {
    fail(`unexpected_changed_file:${file}`)
  }
}

for (const file of protectedNoDiffFiles) {
  const diff = git(['diff', '--name-only', '--', file], true)
  const cachedDiff = git(['diff', '--cached', '--name-only', '--', file], true)
  const branchDiff = git(['diff', '--name-only', `${baseRef}...HEAD`, '--', file], true)
  if (diff || cachedDiff || branchDiff) fail(`protected_file_changed:${file}`)
}

for (const output of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker']) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, decision, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify({ ok: true, decision, nextPrompt, readyForControlledActivationExecution: true, activationApproved: false }, null, 2),
)
