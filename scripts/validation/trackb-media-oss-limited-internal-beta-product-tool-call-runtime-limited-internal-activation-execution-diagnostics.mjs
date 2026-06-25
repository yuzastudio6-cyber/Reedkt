#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution'
const approvalReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_execution_passed_ready_for_limited_internal_activation_qa_review'
const approvalDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_limited_internal_activation_approval_passed_ready_for_limited_internal_activation_execution'
const nextPrompt =
  'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_LIMITED_INTERNAL_ACTIVATION_QA_REVIEW'
const sourceSha = 'dc86d6b6fd0a81d444f88e821f740335cd9d0bc8'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'route-runtime-fail-closed-proof.json',
  'route-runtime-fail-closed-proof.md',
  'worker-dispatch-control-proof.json',
  'worker-dispatch-control-proof.md',
  'service-role-no-write-boundary-proof.json',
  'service-role-no-write-boundary-proof.md',
  'monitoring-emission-proof.json',
  'monitoring-emission-proof.md',
  'rollback-execution-proof.json',
  'rollback-execution-proof.md',
  'limited-internal-exposure-proof.json',
  'limited-internal-exposure-proof.md',
  'execution-results.json',
  'execution-results.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',`${reportDir}/`]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
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
  'live route runtime enabled',
  'worker dispatch enabled',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  routeRuntime: readJson(`${reportDir}/route-runtime-fail-closed-proof.json`),
  workerDispatch: readJson(`${reportDir}/worker-dispatch-control-proof.json`),
  serviceRole: readJson(`${reportDir}/service-role-no-write-boundary-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-emission-proof.json`),
  rollback: readJson(`${reportDir}/rollback-execution-proof.json`),
  exposure: readJson(`${reportDir}/limited-internal-exposure-proof.json`),
  execution: readJson(`${reportDir}/execution-results.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  approval: readJson(`${approvalReportDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'approval') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 877)?.state !== 'MERGED') fail('missing_pr877_source')
if (reports.approval.decision !== approvalDecision) fail(`approval_decision_drift:${reports.approval.decision}`)
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

if (reports.routeRuntime.routeRuntimeProof?.routeDefinitionsInspected !== 3) fail('route_definition_count_drift')
if (reports.routeRuntime.routeRuntimeProof?.routesDisabled !== true) fail('routes_not_disabled')
if (reports.routeRuntime.routeRuntimeProof?.backendRequiredRuntimeMode !== true) fail('routes_not_backend_required')
if (reports.routeRuntime.routeRuntimeProof?.failClosedStatusCode !== 423) fail('fail_closed_status_drift')
if (reports.routeRuntime.routeRuntimeProof?.liveRouteRuntimeEnabled !== false) fail('live_route_runtime_enabled')

if (reports.workerDispatch.workerDispatchProof?.coveredToolCount !== 16) fail('worker_dispatch_tool_count_drift')
if (reports.workerDispatch.workerDispatchProof?.executionEnabled !== false) fail('worker_execution_enabled')
if (reports.workerDispatch.workerDispatchProof?.dryRunOnly !== true) fail('worker_not_dry_run_only')
for (const requiredGate of [
  'requiresApprovedSnapshot',
  'requiresEditPlan',
  'requiresCreditReservation',
  'requiresPrivateArtifactReferences',
  'requiresQualityGates',
  'sanitizedLoggingOnly',
]) {
  if (reports.workerDispatch.workerDispatchProof?.[requiredGate] !== true) fail(`worker_gate_missing:${requiredGate}`)
}
if (reports.workerDispatch.workerDispatchProof?.workerDispatchEnabled !== false) fail('worker_dispatch_enabled')

if (reports.serviceRole.serviceRoleBoundary?.serviceRoleUsedInThisPhase !== false) fail('service_role_used')
if (reports.serviceRole.serviceRoleBoundary?.supabaseWrites !== 'no write') fail('supabase_write_drift')
if (reports.serviceRole.serviceRoleBoundary?.gcsWrites !== 'none') fail('gcs_write_drift')
if (reports.serviceRole.serviceRoleBoundary?.sqlExecuted !== 'none') fail('sql_executed')
if (reports.serviceRole.serviceRoleBoundary?.migrationDeployed !== 'no') fail('migration_deployed')
if (reports.serviceRole.serviceRoleBoundary?.approvedBoundedWritePolicy !== false) fail('bounded_write_policy_unexpectedly_approved')

if (reports.monitoring.monitoring?.sanitizedEventShapeRecorded !== true) fail('monitoring_shape_missing')
for (const forbiddenField of [
  'emittedToLiveBackend',
  'rawPromptIncluded',
  'providerPromptIncluded',
  'signedUrlIncluded',
  'publicUrlIncluded',
  'secretMaterialIncluded',
  'privatePayloadIncluded',
]) {
  if (reports.monitoring.monitoring?.[forbiddenField] !== false) fail(`monitoring_forbidden_field:${forbiddenField}`)
}

if (reports.rollback.rollback?.rollbackDisableControlProofCompleted !== true) fail('rollback_disable_control_not_proven')
if (reports.rollback.rollback?.liveRuntimeRollbackExecuted !== false) fail('live_runtime_rollback_executed')
if (reports.rollback.rollback?.preStateRoutesDisabled !== true) fail('rollback_pre_routes_not_disabled')
if (reports.rollback.rollback?.postStateRoutesDisabled !== true) fail('rollback_post_routes_not_disabled')
if (reports.rollback.rollback?.postStateWorkerDispatchDisabled !== true) fail('rollback_post_workers_not_disabled')

if (reports.exposure.exposure?.limitedInternalExposureControlRecorded !== true) fail('exposure_control_missing')
for (const forbiddenExposure of [
  'limitedInternalUsersEnabled',
  'externalBetaEnabled',
  'productionEnabled',
  'userMediaByDefaultEnabled',
  'publicArtifactsEnabled',
  'signedUrlsEnabled',
]) {
  if (reports.exposure.exposure?.[forbiddenExposure] !== false) fail(`exposure_unexpectedly_enabled:${forbiddenExposure}`)
}
if (reports.exposure.exposure?.productReadyLocalOssCount !== 0) fail('exposure_product_ready_drift')

for (const passField of [
  'routeRuntimeFailClosedProofPassed',
  'workerDispatchControlProofPassed',
  'serviceRoleNoWriteBoundaryProofPassed',
  'monitoringEmissionProofPassed',
  'rollbackDisableControlProofPassed',
  'limitedInternalExposureProofPassed',
]) {
  if (reports.execution[passField] !== true) fail(`execution_pass_field_missing:${passField}`)
  if (reports.decisionReport[passField] !== true) fail(`decision_pass_field_missing:${passField}`)
}
for (const noRunField of [
  'liveRouteRuntimeEnabled',
  'workerDispatchEnabled',
  'realToolExecutionRan',
  'dockerRan',
  'installRan',
  'mediaProcessingRan',
  'supabaseGcsWriteRan',
]) {
  if (reports.execution[noRunField] !== false) fail(`forbidden_execution_field_true:${noRunField}`)
}
if (reports.execution.readyForLimitedInternalActivationQaReview !== true) fail('execution_not_ready_for_qa')
if (reports.decisionReport.readyForLimitedInternalActivationQaReview !== true) fail('decision_not_ready_for_qa')
if (reports.decisionReport.liveActivationApprovedForProduct !== false) fail('live_activation_unexpectedly_approved')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')

if (reports.readiness.coveredToolCount !== 16) fail('readiness_coverage_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForLimitedInternalActivationQaReview !== true) fail('readiness_not_ready_for_qa')
if (reports.readiness.readyForLiveActivation !== false) fail('readiness_live_activation_true')
if (reports.readiness.readyForExternalBeta !== false) fail('readiness_external_beta_true')
if (reports.readiness.readyForProduction !== false) fail('readiness_production_true')

if (reports.manifest.privateArtifactsCommitted !== false) fail('private_artifacts_committed')
if (reports.manifest.publicArtifactsCommitted !== false) fail('public_artifacts_committed')
if (reports.manifest.signedUrlsCommitted !== false) fail('signed_urls_committed')
if (reports.manifest.secretsCommitted !== false) fail('secrets_committed')
if (reports.manifest.mediaArtifactsCommitted !== false) fail('media_artifacts_committed')
if (reports.manifest.dockerOutputsCommitted !== false) fail('docker_outputs_committed')

for (const [label, report] of Object.entries(reports)) {
  if (label === 'approval') continue
  for (const [field, value] of Object.entries(report.boundary || {})) {
    if (value !== false) fail(`boundary_unexpected_true:${label}:${field}`)
  }
}

const routeSource = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
if ((routeSource.match(/status: 'disabled'/g) || []).length !== 3) fail('route_source_disabled_count_drift')
if ((routeSource.match(/runtimeMode: 'backend_required'/g) || []).length !== 3) fail('route_source_runtime_mode_drift')
if ((routeSource.match(/requiresServiceRole: true/g) || []).length !== 2) fail('route_source_service_role_true_count_drift')
if ((routeSource.match(/requiresServiceRole: false/g) || []).length !== 1) fail('route_source_service_role_false_count_drift')

const contractSource = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
const toolListMatch = contractSource.match(/TRACKB_MEDIA_OSS_TOOL_IDS = \[([\s\S]*?)\] as const/)
const toolIds = toolListMatch ? [...toolListMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : []
if (toolIds.length !== 16) fail(`contract_tool_count_drift:${toolIds.length}`)
if (!contractSource.includes('executionEnabled: false')) fail('contract_execution_false_missing')
if (!contractSource.includes('betaDryRunOnly: true')) fail('contract_beta_dry_run_missing')
if (!contractSource.includes('statusCode: 423')) fail('contract_fail_closed_423_missing')

const statusText = statusDocs.map((file) => readText(file)).join('\\n')
if (!statusText.includes(decision)) fail('status_docs_missing_decision')
if (!statusText.includes(nextPrompt)) fail('status_docs_missing_next_prompt')
if (!statusText.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
  fail('status_docs_missing_totals')
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md'
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes('Do not enable external beta')) fail('next_prompt_missing_scope_boundary')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs'
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  ...statusDocs,
]) {
  const text = readText(file)
  for (const forbidden of forbiddenSubstrings) {
    if (text.includes(forbidden)) fail(`forbidden_claim:${file}:${forbidden}`)
  }
  for (const line of text.split('\\n')) {
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
      coveredToolCount: 16,
      readyForLimitedInternalActivationQaReview: true,
      productReadyCount: 0,
    },
    null,
    2
  )
)
