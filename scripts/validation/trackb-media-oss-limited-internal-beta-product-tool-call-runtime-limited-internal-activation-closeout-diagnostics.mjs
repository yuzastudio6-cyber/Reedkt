#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout'
const qaReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_closeout_passed_ready_for_product_beta_readiness_reconciliation'
const qaDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_qa_passed_ready_for_limited_internal_activation_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_READINESS_RECONCILIATION'
const sourceSha = 'f27d82da78d3099ada65dfcba99c81775c6b448c'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'limited-internal-activation-closeout.json',
  'limited-internal-activation-closeout.md',
  'accepted-evidence-inventory.json',
  'accepted-evidence-inventory.md',
  'product-beta-readiness-reconciliation-readiness.json',
  'product-beta-readiness-reconciliation-readiness.md',
  'runtime-boundary-closeout.json',
  'runtime-boundary-closeout.md',
  'decision.json',
  'decision.md',
  'readiness-report.json',
  'readiness-report.md',
  'private-artifact-manifest.json',
  'private-artifact-manifest.md',
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
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
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
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
]

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-reconciliation/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
  'scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-closeout-diagnostics.mjs',
  'package.json',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-go-no-go-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  closeout: readJson(`${reportDir}/limited-internal-activation-closeout.json`),
  inventory: readJson(`${reportDir}/accepted-evidence-inventory.json`),
  reconciliation: readJson(`${reportDir}/product-beta-readiness-reconciliation-readiness.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-closeout.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  qaDecisionReport: readJson(`${qaReportDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'qaDecisionReport') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 889)?.state !== 'MERGED') fail('missing_pr889_source')
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 883)?.state !== 'MERGED') fail('missing_pr883_source')
if (reports.qaDecisionReport.decision !== qaDecision) fail(`qa_decision_drift:${reports.qaDecisionReport.decision}`)
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

for (const [field, expected] of Object.entries({
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
})) {
  if (reports.source.trackBTotals?.[field] !== expected) fail(`source_total_drift:${field}`)
}

for (const field of [
  'closeoutAccepted',
  'limitedInternalActivationQaAccepted',
  'boundedExecutionEvidenceAccepted',
  'readyForProductBetaReadinessReconciliation',
]) {
  if (reports.closeout[field] !== true) fail(`closeout_${field}_not_true`)
  if (reports.decisionReport[field] !== true && field !== 'boundedExecutionEvidenceAccepted') {
    fail(`decision_${field}_not_true`)
  }
}
if (reports.decisionReport.readyForProductBetaReadinessReconciliation !== true) {
  fail('decision_reconciliation_readiness_not_true')
}

for (const field of [
  'liveActivationApproved',
  'readyForDirectProductToolCalls',
  'readyForLiveBetaRuntime',
  'externalBetaReady',
  'productionReady',
  'productReady',
]) {
  if (reports.closeout[field] !== false) fail(`closeout_${field}_unexpected_true`)
}

for (const [field, value] of Object.entries(reports.closeout.acceptedControls || {})) {
  if (value !== true) fail(`accepted_control_not_true:${field}`)
}
for (const [field, value] of Object.entries(reports.closeout.blockedScopes || {})) {
  if (value !== true) fail(`blocked_scope_not_recorded:${field}`)
}
for (const [field, value] of Object.entries(reports.inventory.acceptedEvidence || {})) {
  if (value !== true) fail(`accepted_evidence_not_true:${field}`)
}
for (const [field, value] of Object.entries(reports.inventory.notAcceptedEvidence || {})) {
  if (value !== true) fail(`not_accepted_evidence_missing:${field}`)
}

if (reports.reconciliation.readyForProductBetaReadinessReconciliation !== true) {
  fail('reconciliation_readiness_false')
}
for (const [field, value] of Object.entries(reports.reconciliation.reconciliationScope || {})) {
  const shouldBeFalse = ['approveExternalBeta', 'approveProduction', 'runRuntimeTools'].includes(field)
  if (shouldBeFalse && value !== false) fail(`reconciliation_scope_unexpected_true:${field}`)
  if (!shouldBeFalse && value !== true) fail(`reconciliation_scope_missing:${field}`)
}

for (const [field, value] of Object.entries(reports.runtime.runtimeBoundary || {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.runtime.productReadyLocalOssCount !== 0) fail('runtime_product_ready_drift')
if (reports.runtime.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
  fail(`supabase_classification_drift:${reports.runtime.supabaseClassification}`)
}

if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForProductBetaReadinessReconciliation !== true) fail('readiness_not_ready_for_reconciliation')
if (reports.readiness.readyForLiveActivation !== false) fail('readiness_live_activation_true')
if (reports.readiness.readyForExternalBeta !== false) fail('readiness_external_beta_true')
if (reports.readiness.readyForProduction !== false) fail('readiness_production_true')

for (const field of [
  'privateArtifactsCommitted',
  'publicArtifactsCommitted',
  'signedUrlsCommitted',
  'secretsCommitted',
  'mediaArtifactsCommitted',
  'dockerOutputsCommitted',
  'rawPromptsCommitted',
]) {
  if (reports.manifest[field] !== false) fail(`manifest_${field}_unexpected_true`)
}

const statusText = statusDocs.map((file) => readText(file)).join('\n')
if (!statusText.includes(decision)) fail('status_docs_missing_decision')
if (!statusText.includes(nextPrompt)) fail('status_docs_missing_next_prompt')
if (!statusText.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
  fail('status_docs_missing_totals')
}

const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes(decision)) fail('next_prompt_missing_decision')
if (!promptText.includes('Do not')) fail('next_prompt_missing_scope_boundary')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

const changed = changedFiles()
for (const file of changed) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (changed.includes(file)) fail(`protected_file_changed:${file}`)
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of [
  ...requiredReports.map((name) => `${reportDir}/${name}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  ...statusDocs,
]) {
  const text = readText(file)
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
      limitedInternalActivationCloseoutAccepted: true,
      readyForProductBetaReadinessReconciliation: true,
      productReadyCount: 0,
    },
    null,
    2
  )
)
