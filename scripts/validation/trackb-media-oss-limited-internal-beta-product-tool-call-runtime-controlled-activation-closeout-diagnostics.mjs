#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout'
const qaReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_controlled_activation_closeout_passed_ready_for_limited_internal_activation_approval'
const qaDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_controlled_activation_qa_passed_ready_for_controlled_activation_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_LIMITED_INTERNAL_ACTIVATION_APPROVAL'
const sourceSha = 'a1860c2e316e13ed61dfa237109c58533b21182b'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'controlled-activation-closeout.json',
  'controlled-activation-closeout.md',
  'accepted-evidence-inventory.json',
  'accepted-evidence-inventory.md',
  'limited-internal-activation-approval-readiness.json',
  'limited-internal-activation-approval-readiness.md',
  'runtime-boundary-closeout.json',
  'runtime-boundary-closeout.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-plan-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan/',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-plan.md',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-reconciliation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-go-no-go-review.md',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  closeout: readJson(`${reportDir}/controlled-activation-closeout.json`),
  inventory: readJson(`${reportDir}/accepted-evidence-inventory.json`),
  activation: readJson(`${reportDir}/limited-internal-activation-approval-readiness.json`),
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
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 866)?.state !== 'MERGED') fail('missing_pr866_source')
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)
if (reports.qaDecisionReport.decision !== qaDecision) fail(`qa_decision_drift:${reports.qaDecisionReport.decision}`)

for (const field of [
  'closeoutAccepted',
  'controlledActivationExecutionAccepted',
  'controlledActivationQaAccepted',
  'readyForLimitedInternalActivationApproval',
]) {
  if (reports.closeout[field] !== true) fail(`closeout_${field}_not_true`)
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
if (reports.closeout.coveredToolCount !== 16) fail('closeout_tool_count_drift')
if (reports.closeout.productReadyCount !== 0) fail('closeout_product_ready_drift')

for (const [field, value] of Object.entries(reports.inventory.acceptedEvidence || {})) {
  if (value !== true) fail(`accepted_evidence_not_true:${field}`)
}
for (const [field, value] of Object.entries(reports.inventory.notAcceptedEvidence || {})) {
  if (value !== true) fail(`not_accepted_evidence_missing:${field}`)
}

if (reports.activation.readyForLimitedInternalActivationApproval !== true) fail('activation_approval_readiness_false')
for (const [field, value] of Object.entries(reports.activation.approvalStillRequiredFor || {})) {
  if (value !== true) fail(`approval_requirement_missing:${field}`)
}
for (const [field, value] of Object.entries(reports.activation.approvalNotGrantedByCloseout || {})) {
  if (value !== true) fail(`approval_not_granted_missing:${field}`)
}

for (const [field, value] of Object.entries(reports.runtime.runtimeBoundary || {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.runtime.productReadyLocalOssCount !== 0) fail('runtime_product_ready_drift')
if (reports.runtime.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
  fail(`supabase_classification_drift:${reports.runtime.supabaseClassification}`)
}

if (reports.decisionReport.controlledActivationCloseoutAccepted !== true) fail('decision_closeout_not_accepted')
if (reports.decisionReport.readyForLimitedInternalActivationApproval !== true) fail('decision_not_ready_for_activation_approval')
if (reports.decisionReport.liveActivationApproved !== false) fail('decision_live_activation_true')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')

if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForLimitedInternalActivationApproval !== true) fail('readiness_not_ready_for_activation_approval')
for (const field of ['readyForLiveActivation', 'readyForDirectProductToolCalls', 'readyForExternalBeta', 'readyForProduction']) {
  if (reports.readiness[field] !== false) fail(`readiness_${field}_unexpected_true`)
}

for (const [field, value] of Object.entries(reports.manifest || {})) {
  if (field === 'ownerId' || field === 'decision') continue
  if (value !== false) fail(`manifest_artifact_or_secret_created:${field}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs'
) {
  fail('missing_package_script')
}

for (const file of [
  ...statusDocs,
  `${reportDir}/decision.md`,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
]) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`missing_decision_text:${file}`)
  if (!text.includes(nextPrompt)) fail(`missing_next_prompt_text:${file}`)
}

const repoText = [
  ...statusDocs,
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
]
  .map((file) => readText(file))
  .join('\n')

for (const forbidden of [
  '40+ tools proven end-to-end',
  'liveActivationApproved\": true',
  'readyForDirectProductToolCalls\": true',
  'readyForLiveBetaRuntime\": true',
  'externalBetaReady\": true',
  'productionReady\": true',
  'productReady\": true',
  'routeRuntimeEnabled\": true',
  'workerDispatchEnabled\": true',
  'realToolExecutionEnabled\": true',
]) {
  if (repoText.includes(forbidden)) fail(`forbidden_claim:${forbidden}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

for (const file of protectedNoDiffFiles) {
  const diff = git(['diff', '--name-only', '--', file], true)
  const cachedDiff = git(['diff', '--cached', '--name-only', '--', file], true)
  const branchDiff = git(['diff', '--name-only', `${baseRef}...HEAD`, '--', file], true)
  if (diff || cachedDiff || branchDiff) fail(`protected_file_changed:${file}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, decision, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      nextPrompt,
      controlledActivationCloseoutAccepted: true,
      readyForLimitedInternalActivationApproval: true,
      liveActivationApproved: false,
      productReadyCount: 0,
    },
    null,
    2,
  ),
)
