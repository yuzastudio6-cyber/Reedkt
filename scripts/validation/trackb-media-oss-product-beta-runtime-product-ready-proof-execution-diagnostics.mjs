#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution'
const planDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan'
const decision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_execution_blocked_by_product_route_disabled_backend_required'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_PLAN'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'a86351111aebe5625631a0911da49009cb3bfdfa'
const sourceHead = '6e25817533edb1cdd6e19e4138ce15f9330587e9'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'route-harness-execution-results.json',
  'route-harness-execution-results.md',
  'use-case-ranking-runtime-proof.json',
  'use-case-ranking-runtime-proof.md',
  'fail-closed-negative-path-results.json',
  'fail-closed-negative-path-results.md',
  'snapshot-credit-gate-proof.json',
  'snapshot-credit-gate-proof.md',
  'worker-dispatch-guard-proof.json',
  'worker-dispatch-guard-proof.md',
  'monitoring-receipt-proof.json',
  'monitoring-receipt-proof.md',
  'privacy-supabase-gcs-boundary-proof.json',
  'privacy-supabase-gcs-boundary-proof.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
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

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs',
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

const expectedUseCaseOrders = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}

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
  return Array.from(
    new Set([
      ...git(['diff', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean),
      ...git(['diff', '--name-only', `${baseRef}...HEAD`], true).split('\n').filter(Boolean),
      ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
    ]),
  )
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function requireCommon(label, report) {
  if (report.ownerId !== ownerId) fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.productReadyCount !== 0) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  route: readJson(`${reportDir}/route-harness-execution-results.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-runtime-proof.json`),
  failClosed: readJson(`${reportDir}/fail-closed-negative-path-results.json`),
  snapshotCredit: readJson(`${reportDir}/snapshot-credit-gate-proof.json`),
  worker: readJson(`${reportDir}/worker-dispatch-guard-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-receipt-proof.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-boundary-proof.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const planDecision = readJson(`${planDir}/decision.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceHead !== sourceHead) fail(`source_head_drift:${reports.source.sourceHead}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 922)?.state !== 'MERGED') {
  fail('missing_pr922_source_evidence')
}
if (planDecision.decision !== previousDecision) fail(`proof_plan_decision_drift:${planDecision.decision}`)

if (reports.route.boundedHarnessKind !== 'static_product_route_registry_and_contract_guard_harness') {
  fail('route_harness_kind_drift')
}
if (reports.route.routeResults?.length !== 3) fail('route_count_drift')
for (const route of reports.route.routeResults ?? []) {
  if (route.status !== 'disabled') fail(`route_not_disabled:${route.routeId}`)
  if (route.runtimeMode !== 'backend_required') fail(`route_not_backend_required:${route.routeId}`)
  if (route.expectedMockRouterOutcome !== 'backend_required_fail_closed') fail(`route_expected_outcome_drift:${route.routeId}`)
}
if (reports.route.realProductBehaviorEndToEndProven !== false) fail('real_product_behavior_claimed')
if (!String(reports.route.blockedReason ?? '').includes('disabled/backend_required')) fail('route_blocker_missing')

if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.productRouteCanDispatchSelectedCandidate !== false) fail('ranking_dispatch_claimed')
for (const [useCase, expectedOrder] of Object.entries(expectedUseCaseOrders)) {
  const row = reports.ranking.useCaseMatrix?.find((entry) => entry.useCase === useCase)
  if (!row) fail(`missing_use_case:${useCase}`)
  if (row && row.order.join('|') !== expectedOrder.join('|')) fail(`use_case_order_drift:${useCase}`)
  if (row && row.productRouteResult !== 'blocked_route_disabled_backend_required') {
    fail(`use_case_route_result_drift:${useCase}`)
  }
}

if (reports.failClosed.failClosedCoveragePassed !== true) fail('fail_closed_coverage_not_passed')
if (reports.failClosed.positiveDispatchCoveragePassed !== false) fail('positive_dispatch_claimed')
const requiredNegativeChecks = [
  'missing_approved_snapshot_rejected',
  'missing_edit_plan_rejected',
  'missing_credit_gate_rejected',
  'disabled_tool_rejected',
  'unsupported_use_case_rejected',
  'external_beta_flag_rejected',
  'production_flag_rejected',
  'public_or_signed_url_rejected',
  'raw_prompt_rejected',
]
for (const check of requiredNegativeChecks) {
  if (!reports.failClosed.negativePaths?.some((entry) => entry.check === check)) fail(`missing_negative_check:${check}`)
}

for (const field of [
  'approvedSnapshotIdRequired',
  'editPlanIdRequired',
  'creditReservationIdRequired',
  'idempotencyKeyRequired',
  'privateArtifactReferenceRequired',
  'qualityGateIdsRequired',
]) {
  if (reports.snapshotCredit[field] !== true) fail(`snapshot_credit_${field}_not_true`)
}
if (reports.snapshotCredit.realCreditMutationRun !== false) fail('credit_mutation_claimed')
if (reports.snapshotCredit.positiveCreditReservedDispatchProven !== false) fail('positive_credit_dispatch_claimed')

if (reports.worker.allWorkerContractsExecutionDisabled !== true) fail('worker_contracts_not_disabled')
if (reports.worker.workerDispatchAttempted !== false) fail('worker_dispatch_attempted')
if (reports.worker.workerDispatchToRealToolsProven !== false) fail('worker_dispatch_to_real_tools_claimed')
for (const contract of reports.worker.workerContractsCovered ?? []) {
  if (contract.executionEnabled !== false) fail(`worker_execution_enabled:${contract.toolId}`)
  if (contract.status !== 'disabled_until_beta_gate') fail(`worker_status_drift:${contract.toolId}`)
  if (contract.sanitizedLoggingOnly !== true) fail(`worker_logging_not_sanitized:${contract.toolId}`)
}

if (reports.monitoring.sanitizedReceiptProducedForBlockedHarness !== true) fail('blocked_receipt_missing')
if (reports.monitoring.rawPayloadLoggingAllowed !== false) fail('raw_payload_logging_allowed')
if (reports.monitoring.productMonitoringForSuccessfulDispatchProven !== false) fail('successful_dispatch_monitoring_claimed')

for (const field of [
  'userMediaByDefaultBlocked',
  'syntheticPrivateTempFixturesOnly',
  'noWriteBoundaryPassed',
]) {
  if (reports.privacy[field] !== true) fail(`privacy_${field}_not_true`)
}
for (const field of [
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseWritesRun',
  'gcsWritesRun',
  'sqlRun',
  'migrationsRun',
  'secretsPrinted',
]) {
  if (reports.privacy[field] !== false) fail(`privacy_${field}_unexpected_true`)
}

for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary ?? {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.boundary.firstBlockingGate !== 'product_route_disabled_backend_required') fail('first_blocker_drift')

if (reports.decisionReport.boundedProofExecutionCompleted !== true) fail('execution_not_completed')
if (reports.decisionReport.failClosedRouteProofPassed !== true) fail('fail_closed_route_proof_not_passed')
if (reports.decisionReport.productRouteEnabled !== false) fail('product_route_enabled_claimed')
if (reports.decisionReport.workerDispatchEnabled !== false) fail('worker_dispatch_enabled_claimed')
if (reports.decisionReport.realProductBehaviorEndToEndProven !== false) fail('real_product_end_to_end_claimed')
if (reports.decisionReport.readyForProductRouteEnablementPlan !== true) fail('route_enablement_plan_not_ready')
if (reports.decisionReport.readyForProductReadyStatus !== false) fail('product_ready_status_claimed')

if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_count_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_count_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_count_drift')
if (reports.readiness.readyForProductRouteEnablementPlan !== true) fail('readiness_route_enablement_not_true')
for (const field of [
  'readyForProductReadyStatus',
  'readyForLiveProductCalls',
  'readyForDirectProductToolCalls',
  'readyForWorkerDispatchToRealTools',
  'readyForExternalBeta',
  'readyForProduction',
]) {
  if (reports.readiness[field] !== false) fail(`readiness_${field}_unexpected_true`)
}

for (const field of [
  'privateArtifactsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'mediaArtifactsCreated',
  'runtimePayloadsCreated',
  'secretsCommitted',
  'generatedOutputsCreated',
]) {
  if (reports.manifest[field] !== false) fail(`manifest_${field}_unexpected_true`)
}

const routeSource = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
for (const token of [
  "id: 'trackbMediaOss.toolCall.validate'",
  "id: 'trackbMediaOss.toolCall.queue'",
  "id: 'trackbMediaOss.toolCall.status'",
  "status: 'disabled'",
  "runtimeMode: 'backend_required'",
]) {
  if (!routeSource.includes(token)) fail(`route_source_missing:${token}`)
}

const contractSource = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
for (const token of [
  'TRACKB_MEDIA_OSS_TOOL_CALL_RANKING',
  'executionEnabled: false',
  'disabled_until_beta_gate',
  'assertTrackBMediaOssToolCallPayloadIsGated',
  'buildTrackBMediaOssFailClosedResponse',
]) {
  if (!contractSource.includes(token)) fail(`contract_source_missing:${token}`)
}

const mockRouterSource = readText('src/backend/api/mock-api-router.ts')
for (const token of ["route.status === 'disabled'", 'createApiBackendRequiredResponse']) {
  if (!mockRouterSource.includes(token)) fail(`mock_router_source_missing:${token}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-proof-execution:diagnostics']
    !== 'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-execution-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
  if (!text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
    fail(`status_missing_totals:${file}`)
  }
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_token_missing')
if (!promptText.includes(decision)) fail('next_prompt_missing_decision')
if (!promptText.includes('Product-ready local OSS count remains `0`')) fail('next_prompt_missing_product_ready_boundary')

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}

for (const file of protectedNoDiffFiles) {
  if (
    git(['diff', '--name-only', '--', file], true)
    || git(['diff', '--cached', '--name-only', '--', file], true)
  ) {
    fail(`protected_file_changed:${file}`)
  }
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
}

const artifactFiles = git(['ls-files'], true)
  .split('\n')
  .filter((file) => /\.(mp4|mov|mkv|srt|ttf|otf|onnx|pdmodel|pdiparams|deb|gpg|asc)$/i.test(file))
for (const file of artifactFiles) fail(`artifact_tracked:${file}`)

const filesToScan = [
  ...requiredReports.map((report) => `${reportDir}/${report}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-plan.md',
]

for (const file of filesToScan) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (/https:\/\/[^\s)]+X-Goog-Signature=/.test(text)) fail(`signed_url:${file}`)
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
  if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) {
    fail(`forbidden_product_ready_positive_claim:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  previousDecision,
  nextPrompt,
  firstBlockingGate: 'product_route_disabled_backend_required',
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductRouteEnablementPlan: true,
}, null, 2))
