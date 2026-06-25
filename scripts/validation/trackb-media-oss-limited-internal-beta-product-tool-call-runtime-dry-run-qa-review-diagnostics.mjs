#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review'
const executionReportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_dry_run_qa_passed_ready_for_runtime_closeout'
const acceptedExecutionDecision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_dry_run_execution_passed_ready_for_runtime_dry_run_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_CLOSEOUT'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'd2111d233af04710ca9a9c7011817dae69e16f55'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const expectedTools = [
  'ffprobe',
  'mediainfo',
  'exiftool',
  'duckdb',
  'polars_nodejs_polars',
  'sharp_libvips',
  'opencolorio',
  'openimageio',
  'imagemagick',
  'opencv',
  'pyav',
  'pyscenedetect',
  'tesseract',
  'paddlepaddle',
  'paddleocr',
  'ffmpeg',
]

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'dry-run-evidence-qa.json',
  'dry-run-evidence-qa.md',
  'tool-readiness-matrix-qa.json',
  'tool-readiness-matrix-qa.md',
  'runtime-contract-qa.json',
  'runtime-contract-qa.md',
  'result-schema-monitoring-rollback-qa.json',
  'result-schema-monitoring-rollback-qa.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
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
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan/`,
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/`,`${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]

const allowedChangedFiles = new Set([
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
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
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

function sameArray(actual, expected, label) {
  if (JSON.stringify(actual || []) !== JSON.stringify(expected)) {
    fail(`${label}_drift:${JSON.stringify(actual || [])}`)
  }
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  evidence: readJson(`${reportDir}/dry-run-evidence-qa.json`),
  matrix: readJson(`${reportDir}/tool-readiness-matrix-qa.json`),
  contract: readJson(`${reportDir}/runtime-contract-qa.json`),
  schemaMonitoring: readJson(`${reportDir}/result-schema-monitoring-rollback-qa.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-qa.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  executionDecision: readJson(`${executionReportDir}/decision.json`),
  executionPayloads: readJson(`${executionReportDir}/safe-fixture-payloads.json`),
  executionRuntime: readJson(`${executionReportDir}/runtime-boundary-review.json`),
}

for (const [label, report] of Object.entries({
  source: reports.source,
  evidence: reports.evidence,
  matrix: reports.matrix,
  contract: reports.contract,
  schemaMonitoring: reports.schemaMonitoring,
  runtime: reports.runtime,
  decisionReport: reports.decisionReport,
  readiness: reports.readiness,
  manifest: reports.manifest,
})) {
  requireDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 838)?.state !== 'MERGED') {
  fail('missing_pr838_source')
}
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')

if (reports.executionDecision.decision !== acceptedExecutionDecision) {
  fail(`execution_decision_drift:${reports.executionDecision.decision}`)
}
if (reports.executionDecision.readyForRuntimeDryRunQaReview !== true) {
  fail('execution_not_ready_for_qa')
}
if (reports.executionPayloads.payloadCount !== 16) fail('execution_payload_count_drift')
if (reports.executionPayloads.commonFields?.dryRunOnly !== true) fail('execution_payload_not_dry_run')
if (reports.executionPayloads.commonFields?.executionEnabled !== false) fail('execution_payload_enabled')
if (reports.executionRuntime.routeRuntimeEnabled !== false) fail('execution_route_runtime_enabled')
if (reports.executionRuntime.workerDispatchEnabled !== false) fail('execution_worker_dispatch_enabled')

for (const [field, value] of Object.entries(reports.evidence.acceptedEvidence || {})) {
  if (value !== true) fail(`accepted_evidence_not_true:${field}:${value}`)
}
for (const [field, value] of Object.entries(reports.evidence.notAcceptedAsEvidence || {})) {
  if (value !== true) fail(`not_accepted_scope_missing:${field}:${value}`)
}
if (reports.evidence.readyForRuntimeCloseout !== true) fail('evidence_not_ready_for_closeout')

if (reports.matrix.toolCount !== 16) fail('matrix_tool_count_drift')
sameArray(reports.matrix.rankingOrder, expectedTools, 'matrix_ranking_order')
if (reports.matrix.dryRunPayloadsQaAccepted !== true) fail('payload_qa_not_accepted')
if (reports.matrix.routingQaAccepted !== true) fail('routing_qa_not_accepted')
if (reports.matrix.productReadyTools !== 0) fail('matrix_product_ready_drift')
if (reports.matrix.readyForDirectProductToolCalls !== false) fail('matrix_direct_calls_ready')

if (reports.contract.toolContracts !== 16) fail('contract_tool_count_drift')
if (reports.contract.apiRoutes !== 3) fail('contract_route_count_drift')
if (reports.contract.contractStatus !== 'disabled_until_beta_gate') fail('contract_status_drift')
if (reports.contract.apiRouteStatus !== 'disabled') fail('api_route_status_drift')
if (reports.contract.failClosedCode !== 'trackb_media_oss_tool_calls_disabled_until_beta_gate') {
  fail('fail_closed_code_drift')
}
if (reports.contract.failClosedStatusCode !== 423) fail('fail_closed_status_drift')
if (reports.contract.executionEnabled !== false) fail('contract_execution_enabled')
if (reports.contract.runtimeContractQaAccepted !== true) fail('contract_qa_not_accepted')

if (reports.schemaMonitoring.resultSchemaVersion !== 'trackb-media-oss-tool-call-result.v1') {
  fail('schema_version_drift')
}
for (const flag of [
  'qaGateLinkageAccepted',
  'fallbackPolicyAccepted',
  'sanitizedLoggingAccepted',
  'monitoringEventShapeAccepted',
  'rollbackRecordShapeAccepted',
]) {
  if (reports.schemaMonitoring[flag] !== true) fail(`schema_monitoring_flag_not_true:${flag}`)
}
for (const forbidden of ['signedUrl', 'publicUrl', 'rawPrompt', 'rawChat', 'providerPrompt']) {
  if (!reports.schemaMonitoring.forbiddenResultFields?.includes(forbidden)) {
    fail(`missing_forbidden_result_field:${forbidden}`)
  }
}
for (const forbidden of ['rawPrompt', 'rawChat', 'privatePayload', 'signedUrl', 'publicUrl', 'storageObjectPath']) {
  if (!reports.schemaMonitoring.forbiddenMonitoringFields?.includes(forbidden)) {
    fail(`missing_forbidden_monitoring_field:${forbidden}`)
  }
}
if (reports.schemaMonitoring.runtimeEmissionAccepted !== false) fail('runtime_emission_accepted')
if (reports.schemaMonitoring.runtimeRollbackApplied !== false) fail('runtime_rollback_applied')

for (const [label, value] of Object.entries({
  runtimeApisChanged: reports.runtime.runtimeApisChanged,
  routeRuntimeEnabled: reports.runtime.routeRuntimeEnabled,
  workerDispatchEnabled: reports.runtime.workerDispatchEnabled,
  toolExecutionEnabled: reports.runtime.toolExecutionEnabled,
  dockerRun: reports.runtime.dockerRun,
  installRun: reports.runtime.installRun,
  mediaProcessingRun: reports.runtime.mediaProcessingRun,
  imageProcessingRun: reports.runtime.imageProcessingRun,
  ocrInferenceRun: reports.runtime.ocrInferenceRun,
  userMediaByDefaultEnabled: reports.runtime.userMediaByDefaultEnabled,
  publicArtifactsEnabled: reports.runtime.publicArtifactsEnabled,
  signedUrlsEnabled: reports.runtime.signedUrlsEnabled,
  supabaseWrite: reports.runtime.supabaseWrite,
  gcsWrite: reports.runtime.gcsWrite,
  externalBetaEnabled: reports.runtime.externalBetaEnabled,
  productionEnabled: reports.runtime.productionEnabled,
  productReadyEnabled: reports.runtime.productReadyEnabled,
  manifestPrivateArtifactsCreated: reports.manifest.privateArtifactsCreated,
  manifestPublicArtifactsCreated: reports.manifest.publicArtifactsCreated,
  manifestSignedUrlsCreated: reports.manifest.signedUrlsCreated,
  manifestMediaArtifactsCreated: reports.manifest.mediaArtifactsCreated,
  manifestDockerOutputsCreated: reports.manifest.dockerOutputsCreated,
  manifestSecretsPrinted: reports.manifest.secretsPrinted,
})) {
  if (value !== false) fail(`blocked_scope_not_false:${label}:${value}`)
}

if (reports.runtime.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (reports.runtime.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (reports.runtime.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (reports.runtime.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (reports.decisionReport.passed !== true) fail('decision_not_passed')
if (reports.decisionReport.readyForRuntimeCloseout !== true) fail('decision_not_ready_for_closeout')
for (const field of [
  'readyForDirectProductToolCalls',
  'readyForLiveBetaRuntime',
  'externalBetaReady',
  'productionReady',
  'productReady',
]) {
  if (reports.decisionReport[field] !== false) fail(`decision_forbidden_readiness:${field}`)
}
if (reports.readiness.readyForRuntimeCloseout !== true) fail('readiness_not_ready_for_closeout')
if (reports.readiness.productReadyTools !== 0) fail('readiness_product_ready_drift')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-dry-run-qa-review:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_missing_token')
for (const phrase of [
  '16 Track B tools',
  'QA-accepted product-path dry-run metadata',
  'no direct product tool calls',
  'live route runtime',
  'worker dispatch',
  'product-ready local OSS',
]) {
  if (!promptText.includes(phrase)) fail(`next_prompt_missing_phrase:${phrase}`)
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
  const isJsonStatusDoc = file.endsWith('.json')
  if (
    !isJsonStatusDoc &&
    (!text.includes('16 owned') || !text.includes('16 bounded accepted-proven'))
  ) {
    fail(`status_missing_totals:${file}`)
  }
  if (isJsonStatusDoc && (!text.includes('"coveredToolCount": 16') || !text.includes('"boundedAcceptedProvenCount": 16'))) {
    fail(`status_missing_totals:${file}`)
  }
}

const corpusFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout.md',
]
for (const file of corpusFiles) {
  const text = readText(file)
  for (const line of text.split('\n')) {
    const lowerLine = line.toLowerCase()
    const disclaimsClaim =
      lowerLine.includes('no 40+')
      || lowerLine.includes('do not claim')
      || lowerLine.includes('disallowed')
      || lowerLine.includes('not claim')
    if (/40\+ tools (are )?(installed|proven|ready|end-to-end)/i.test(line) && !disclaimsClaim) {
      fail(`forbidden_40_plus_claim:${file}`)
    }
  }
  if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) {
    fail(`forbidden_product_ready_claim:${file}`)
  }
  if (/external beta (?:is )?approved/i.test(text) || /production (?:is )?approved/i.test(text)) {
    fail(`forbidden_beta_production_claim:${file}`)
  }
}

for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', file], true)) {
    fail(`protected_file_changed:${file}`)
  }
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

if (failures.length) {
  console.error(`Track B product tool-call runtime dry-run QA review diagnostics failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Track B product tool-call runtime dry-run QA review diagnostics passed.')
