#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review'
const executionDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_qa_passed_ready_for_limited_internal_activation_closeout'
const executionDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_execution_passed_ready_for_limited_internal_activation_qa_review'
const nextPrompt =
  'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_LIMITED_INTERNAL_ACTIVATION_CLOSEOUT'
const sourceSha = '8fcf0be79ebabc4f4a8d7b925f117a4bdbc32653'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'activation-qa-acceptance.json',
  'activation-qa-acceptance.md',
  'route-runtime-qa.json',
  'route-runtime-qa.md',
  'worker-dispatch-control-qa.json',
  'worker-dispatch-control-qa.md',
  'service-role-no-write-qa.json',
  'service-role-no-write-qa.md',
  'monitoring-rollback-qa.json',
  'monitoring-rollback-qa.md',
  'limited-internal-exposure-qa.json',
  'limited-internal-exposure-qa.md',
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

const predecessorDiagnostics = [
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
]

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',`${reportDir}/`]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
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
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  acceptance: readJson(`${reportDir}/activation-qa-acceptance.json`),
  routeRuntime: readJson(`${reportDir}/route-runtime-qa.json`),
  workerDispatch: readJson(`${reportDir}/worker-dispatch-control-qa.json`),
  serviceRole: readJson(`${reportDir}/service-role-no-write-qa.json`),
  monitoringRollback: readJson(`${reportDir}/monitoring-rollback-qa.json`),
  exposure: readJson(`${reportDir}/limited-internal-exposure-qa.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  execution: readJson(`${executionDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'execution') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 883)?.state !== 'MERGED') fail('missing_pr883_source')
if (reports.execution.decision !== executionDecision) fail(`execution_decision_drift:${reports.execution.decision}`)
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

for (const field of [
  'activationQaAccepted',
  'routeRuntimeFailClosedAccepted',
  'workerDispatchControlAccepted',
  'serviceRoleNoWriteBoundaryAccepted',
  'sanitizedMonitoringAccepted',
  'rollbackDisableControlAccepted',
  'limitedInternalExposureControlAccepted',
  'readyForLimitedInternalActivationCloseout',
]) {
  if (reports.acceptance[field] !== true) fail(`acceptance_${field}_not_true`)
  if (reports.decisionReport[field] !== true && field !== 'activationQaAccepted') {
    fail(`decision_${field}_not_true`)
  }
}
if (reports.decisionReport.activationQaAccepted !== true) fail('decision_activation_qa_not_true')

for (const [field, value] of Object.entries(reports.acceptance.notAcceptedByThisQa || {})) {
  if (value !== true) fail(`not_accepted_scope_missing:${field}`)
}
for (const field of ['liveActivationApprovedForProduct', 'productReady']) {
  if (reports.acceptance[field] !== false) fail(`acceptance_${field}_unexpected_true`)
  if (reports.decisionReport[field] !== false) fail(`decision_${field}_unexpected_true`)
}

if (reports.routeRuntime.routeRuntimeQa?.routeDefinitionsCovered !== 3) fail('route_definition_count_drift')
if (reports.routeRuntime.routeRuntimeQa?.allRoutesRemainDisabled !== true) fail('routes_not_disabled')
if (reports.routeRuntime.routeRuntimeQa?.allRoutesRemainBackendRequired !== true) fail('routes_not_backend_required')
if (reports.routeRuntime.routeRuntimeQa?.failClosedStatusCodeAccepted !== 423) fail('fail_closed_status_drift')
if (reports.routeRuntime.routeRuntimeQa?.liveRouteRuntimeAcceptedForProduct !== false) fail('route_runtime_unexpectedly_accepted')

if (reports.workerDispatch.workerDispatchQa?.coveredToolCount !== 16) fail('worker_tool_count_drift')
if (reports.workerDispatch.workerDispatchQa?.dryRunOnlyAccepted !== true) fail('worker_dry_run_not_accepted')
if (reports.workerDispatch.workerDispatchQa?.executionEnabledAccepted !== false) fail('worker_execution_unexpectedly_accepted')
if (reports.workerDispatch.workerDispatchQa?.workerDispatchAcceptedForProduct !== false) fail('worker_dispatch_unexpectedly_accepted')

if (reports.serviceRole.serviceRoleNoWriteQa?.serviceRoleBoundaryAccepted !== true) fail('service_role_boundary_not_accepted')
if (reports.serviceRole.serviceRoleNoWriteQa?.serviceRoleUsedInThisPhase !== false) fail('service_role_used')
if (reports.serviceRole.serviceRoleNoWriteQa?.supabaseWritesAccepted !== false) fail('supabase_writes_unexpectedly_accepted')
if (reports.serviceRole.serviceRoleNoWriteQa?.gcsWritesAccepted !== false) fail('gcs_writes_unexpectedly_accepted')
if (reports.serviceRole.serviceRoleNoWriteQa?.sqlExecuted !== 'none') fail('sql_executed')
if (reports.serviceRole.serviceRoleNoWriteQa?.migrationDeployed !== 'no') fail('migration_deployed')

for (const field of [
  'sanitizedMonitoringShapeAccepted',
  'rawPromptExcluded',
  'providerPromptExcluded',
  'signedUrlExcluded',
  'publicUrlExcluded',
  'secretMaterialExcluded',
  'privatePayloadExcluded',
  'rollbackDisableControlAccepted',
]) {
  if (reports.monitoringRollback.monitoringRollbackQa?.[field] !== true) fail(`monitoring_rollback_${field}_not_true`)
}
if (reports.monitoringRollback.monitoringRollbackQa?.liveRollbackExecuted !== false) fail('live_rollback_executed')

if (reports.exposure.exposureQa?.limitedInternalExposureControlAccepted !== true) fail('exposure_control_not_accepted')
for (const field of [
  'limitedInternalUsersEnabled',
  'userMediaByDefaultAccepted',
  'publicArtifactsAccepted',
  'signedUrlsAccepted',
  'externalBetaAccepted',
  'productionAccepted',
]) {
  if (reports.exposure.exposureQa?.[field] !== false) fail(`exposure_${field}_unexpected_true`)
}
if (reports.exposure.exposureQa?.productReadyCount !== 0) fail('exposure_product_ready_drift')

for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary || {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.boundary.productReadyLocalOssCount !== 0) fail('boundary_product_ready_drift')
if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForLimitedInternalActivationCloseout !== true) fail('readiness_not_ready_for_closeout')
if (reports.readiness.readyForLiveActivation !== false) fail('readiness_live_activation_true')
if (reports.readiness.readyForExternalBeta !== false) fail('readiness_external_beta_true')
if (reports.readiness.readyForProduction !== false) fail('readiness_production_true')

if (reports.manifest.privateArtifactsCommitted !== false) fail('private_artifacts_committed')
if (reports.manifest.publicArtifactsCommitted !== false) fail('public_artifacts_committed')
if (reports.manifest.signedUrlsCommitted !== false) fail('signed_urls_committed')
if (reports.manifest.secretsCommitted !== false) fail('secrets_committed')
if (reports.manifest.mediaArtifactsCommitted !== false) fail('media_artifacts_committed')
if (reports.manifest.dockerOutputsCommitted !== false) fail('docker_outputs_committed')

const statusText = statusDocs.map((file) => readText(file)).join('\n')
if (!statusText.includes(decision)) fail('status_docs_missing_decision')
if (!statusText.includes(nextPrompt)) fail('status_docs_missing_next_prompt')
if (!statusText.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
  fail('status_docs_missing_totals')
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md'
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes('Do not enable live product calls')) fail('next_prompt_missing_scope_boundary')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

for (const file of protectedNoDiffFiles) {
  if (changedFiles().includes(file)) fail(`protected_file_changed:${file}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of [
  ...requiredReports.map((name) => `${reportDir}/${name}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
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
      activationQaAccepted: true,
      readyForLimitedInternalActivationCloseout: true,
      productReadyCount: 0,
    },
    null,
    2
  )
)
