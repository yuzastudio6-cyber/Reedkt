#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution'
const controlApprovalDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_controlled_activation_execution_passed_ready_for_controlled_activation_qa_review'
const controlApprovalDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_control_approval_passed_ready_for_controlled_activation_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_CONTROLLED_ACTIVATION_QA_REVIEW'
const sourceSha = '6630ab932dcf05007a2ea1f4c824485fc97a4ec9'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'controlled-activation-artifact.json',
  'controlled-activation-artifact.md',
  'control-execution-results.json',
  'control-execution-results.md',
  'route-worker-control-proof.json',
  'route-worker-control-proof.md',
  'monitoring-rollback-record.json',
  'monitoring-rollback-record.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',

  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
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
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
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

function requireOwnerAndDecision(label, report) {
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  artifact: readJson(`${reportDir}/controlled-activation-artifact.json`),
  control: readJson(`${reportDir}/control-execution-results.json`),
  routeWorker: readJson(`${reportDir}/route-worker-control-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-record.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  controlApproval: readJson(`${controlApprovalDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'controlApproval') continue
  requireOwnerAndDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.controlApproval.decision !== controlApprovalDecision) {
  fail(`control_approval_decision_drift:${reports.controlApproval.decision}`)
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 854)?.state !== 'MERGED') {
  fail('missing_pr854_source')
}
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

if (reports.artifact.boundedInternalActivationArtifactCreated !== true) fail('missing_bounded_activation_artifact')
for (const [field, value] of Object.entries(reports.artifact.approvedControlsExercisedAsMetadata || {})) {
  if (value !== true) fail(`metadata_control_not_exercised:${field}`)
}
for (const [field, value] of Object.entries(reports.artifact.notActivatedByThisArtifact || {})) {
  if (value !== true) fail(`not_activated_scope_missing:${field}`)
}

if (reports.control.controlExecutionMode !== 'metadata_only_no_runtime') fail('control_execution_not_metadata_only')
if (reports.control.controlResults?.routeRuntimeDefault !== 'disabled') fail('route_default_not_disabled')
if (reports.control.controlResults?.routeRuntimeActivated !== false) fail('route_runtime_unexpectedly_activated')
if (reports.control.controlResults?.workerDispatchActivated !== false) fail('worker_dispatch_unexpectedly_activated')
if (reports.control.controlResults?.supabaseGcsWritePathsRemainDisabled !== true) fail('write_paths_not_disabled')
if (reports.control.controlResults?.limitedInternalExposureActivated !== false) fail('internal_exposure_unexpectedly_activated')
for (const [field, value] of Object.entries(reports.control.negativeCasesRemainBlocked || {})) {
  if (value !== true) fail(`negative_case_not_blocked:${field}`)
}

if (reports.routeWorker.routeWorkerProof?.routeRuntimeEnabled !== false) fail('route_runtime_enabled')
if (reports.routeWorker.routeWorkerProof?.workerDispatchEnabled !== false) fail('worker_dispatch_enabled')
if (reports.routeWorker.routeWorkerProof?.directToolCallsEnabled !== false) fail('direct_tool_calls_enabled')
if (reports.routeWorker.routeWorkerProof?.realToolExecutionEnabled !== false) fail('real_tool_execution_enabled')
if (reports.routeWorker.routeWorkerProof?.perToolAllowlistCoversTools !== 16) fail('allowlist_count_drift')

if (reports.monitoring.monitoring?.sanitizedEventShapeRecorded !== true) fail('monitoring_shape_missing')
if (reports.monitoring.monitoring?.signedUrlIncluded !== false) fail('signed_url_monitoring_included')
if (reports.monitoring.monitoring?.rawPromptIncluded !== false) fail('raw_prompt_monitoring_included')
if (reports.monitoring.monitoring?.secretMaterialIncluded !== false) fail('secret_monitoring_included')
if (reports.monitoring.rollback?.executedAgainstLiveRuntime !== false) fail('live_rollback_unexpectedly_executed')

for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary || {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.boundary.productReadyLocalOssCount !== 0) fail('boundary_product_ready_drift')

if (reports.decisionReport.boundedInternalActivationArtifactCreated !== true) fail('decision_missing_artifact')
if (reports.decisionReport.readyForControlledActivationQaReview !== true) fail('decision_not_ready_for_qa')
if (reports.decisionReport.liveActivationApproved !== false) fail('live_activation_unexpectedly_approved')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')

if (reports.readiness.coveredToolCount !== 16) fail('readiness_coverage_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForControlledActivationQaReview !== true) fail('readiness_not_ready_for_qa')
if (reports.readiness.readyForLiveActivation !== false) fail('live_activation_readiness_true')
if (reports.readiness.readyForExternalBeta !== false || reports.readiness.readyForProduction !== false) {
  fail('external_or_production_readiness_true')
}

for (const [field, value] of Object.entries(reports.manifest || {})) {
  if (field === 'ownerId' || field === 'decision') continue
  if (value !== false) fail(`manifest_artifact_or_secret_created:${field}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-controlled-activation-execution:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs'
) {
  fail('missing_package_script')
}

for (const file of [
  ...statusDocs,
  `${reportDir}/decision.md`,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
]) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`missing_decision_text:${file}`)
  if (!text.includes(nextPrompt)) fail(`missing_next_prompt_text:${file}`)
}

const repoText = [
  ...statusDocs,
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review.md',
]
  .map((file) => readText(file))
  .join('\n')
for (const forbidden of [
  '40+ tools proven end-to-end',
  'liveActivationApproved\": true',
  'readyForLiveActivation\": true',
  'routeRuntimeEnabled\": true',
  'workerDispatchEnabled\": true',
  'directToolCallsEnabled\": true',
  'realToolExecutionEnabled\": true',
  'externalBetaReady\": true',
  'productionReady\": true',
  'productReady\": true',
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
      boundedInternalActivationArtifactCreated: true,
      readyForControlledActivationQaReview: true,
      liveActivationApproved: false,
      productReadyCount: 0,
    },
    null,
    2,
  ),
)
