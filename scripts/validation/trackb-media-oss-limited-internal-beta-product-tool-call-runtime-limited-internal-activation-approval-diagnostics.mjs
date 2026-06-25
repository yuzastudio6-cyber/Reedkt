#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval'
const previousReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_approval_passed_ready_for_limited_internal_activation_execution'
const previousDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_controlled_activation_closeout_passed_ready_for_limited_internal_activation_approval'
const nextPrompt =
  'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_LIMITED_INTERNAL_ACTIVATION_EXECUTION'
const sourceSha = '8e913a3da2b8d547eabdb2af821f55cb1e2e3db3'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'limited-internal-activation-approval.json',
  'limited-internal-activation-approval.md',
  'route-worker-service-role-approval.json',
  'route-worker-service-role-approval.md',
  'supabase-gcs-write-boundary.json',
  'supabase-gcs-write-boundary.md',
  'monitoring-rollback-exposure-controls.json',
  'monitoring-rollback-exposure-controls.md',
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

const predecessorDiagnostics = [
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
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
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
]

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',`${reportDir}/`]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  ...predecessorDiagnostics,
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
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
  'supabase/config.toml',
]

const forbiddenOutputs = [
  'node_modules',
  'dist',
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]

const forbiddenSubstrings = [
  'external beta ready',
  'production ready',
  'product-ready local OSS tools: 16',
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

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function requireOwnerDecision(label, report) {
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  approval: readJson(`${reportDir}/limited-internal-activation-approval.json`),
  routeWorker: readJson(`${reportDir}/route-worker-service-role-approval.json`),
  writeBoundary: readJson(`${reportDir}/supabase-gcs-write-boundary.json`),
  monitoringRollback: readJson(`${reportDir}/monitoring-rollback-exposure-controls.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  previousCloseout: readJson(`${previousReportDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'previousCloseout') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 872)?.state !== 'MERGED') fail('missing_pr872_source')
if (reports.previousCloseout.decision !== previousDecision) fail(`previous_decision_drift:${reports.previousCloseout.decision}`)
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

for (const field of [
  'limitedInternalActivationApproved',
  'readyForLimitedInternalActivationExecution',
]) {
  if (reports.decisionReport[field] !== true) fail(`decision_${field}_not_true`)
  if (reports.readiness[field] !== true) fail(`readiness_${field}_not_true`)
}

if (reports.approval.controlsAcceptedForExecutionGate?.failClosedRouteRuntime !== true) fail('route_control_not_accepted')
if (reports.approval.controlsAcceptedForExecutionGate?.perToolWorkerDispatchAllowlists !== true) fail('worker_control_not_accepted')
if (reports.approval.controlsAcceptedForExecutionGate?.serviceRoleBoundary !== true) fail('service_role_control_not_accepted')
if (reports.approval.controlsAcceptedForExecutionGate?.sanitizedMonitoring !== true) fail('monitoring_control_not_accepted')
if (reports.approval.controlsAcceptedForExecutionGate?.rollbackDisableControls !== true) fail('rollback_control_not_accepted')
if (reports.approval.controlsAcceptedForExecutionGate?.limitedInternalExposureRules !== true) fail('exposure_control_not_accepted')

for (const [label, report] of Object.entries({
  approval: reports.approval,
  routeWorker: reports.routeWorker,
  writeBoundary: reports.writeBoundary,
  monitoringRollback: reports.monitoringRollback,
  decisionReport: reports.decisionReport,
  readiness: reports.readiness,
})) {
  if (report.boundary?.externalBetaApproved !== false) fail(`external_beta_not_blocked:${label}`)
  if (report.boundary?.productionApproved !== false) fail(`production_not_blocked:${label}`)
  if (report.boundary?.userMediaByDefaultApproved !== false) fail(`user_media_default_not_blocked:${label}`)
  if (report.boundary?.publicArtifactsApproved !== false) fail(`public_artifacts_not_blocked:${label}`)
  if (report.boundary?.signedUrlsApproved !== false) fail(`signed_urls_not_blocked:${label}`)
  if (report.boundary?.productReady !== false) fail(`product_ready_not_blocked:${label}`)
}

if (reports.writeBoundary.supabaseWrites !== 'blocked in this approval phase and must be proven or remain disabled in the next execution lane') {
  fail(`supabase_write_boundary_drift:${reports.writeBoundary.supabaseWrites}`)
}
if (reports.writeBoundary.gcsWrites !== 'blocked in this approval phase and must be proven or remain disabled in the next execution lane') {
  fail(`gcs_write_boundary_drift:${reports.writeBoundary.gcsWrites}`)
}
if (reports.manifest.privateArtifactsCommitted !== false) fail('private_artifacts_committed')
if (reports.manifest.publicArtifactsCommitted !== false) fail('public_artifacts_committed')
if (reports.manifest.signedUrlsCommitted !== false) fail('signed_urls_committed')
if (reports.manifest.secretsCommitted !== false) fail('secrets_committed')
if (reports.manifest.mediaArtifactsCommitted !== false) fail('media_artifacts_committed')

const statusText = statusDocs.map((file) => readText(file)).join('\n')
if (!statusText.includes(decision)) fail('status_docs_missing_decision')
if (!statusText.includes(nextPrompt)) fail('status_docs_missing_next_prompt')
if (!statusText.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
  fail('status_docs_missing_totals')
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md'
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes('Do not enable external beta')) fail('next_prompt_missing_scope_boundary')

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

for (const file of protectedNoDiffFiles) {
  if (changedFiles().includes(file)) fail(`protected_file_changed:${file}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of [...requiredReports.map((name) => `${reportDir}/${name}`), ...statusDocs]) {
  const text = readText(file)
  for (const forbidden of forbiddenSubstrings) {
    if (text.includes(forbidden)) fail(`forbidden_claim:${file}:${forbidden}`)
  }
  for (const line of text.split('\n')) {
    const normalizedLine = line.toLowerCase()
    if (
      line.includes('40+ tools') &&
      !normalizedLine.includes('do not claim') &&
      !normalizedLine.includes('no 40+')
    ) {
      fail(`forbidden_40_plus_claim:${file}:${line.trim()}`)
    }
  }
  if (/sk-[A-Za-z0-9_-]{20,}/.test(text)) fail(`secret_like_token:${file}`)
  if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail(`signed_url:${file}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      nextPrompt,
      limitedInternalActivationApproved: true,
      readyForLimitedInternalActivationExecution: true,
      productReadyCount: 0,
    },
    null,
    2
  )
)
