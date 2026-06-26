#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan'
const executionDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution'
const decision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_plan_passed_ready_for_product_route_enablement_execution'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_execution_blocked_by_product_route_disabled_backend_required'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_EXECUTION'
const sourceSha = 'd9b0600c7b7d9a69de04d39a9b7370699b321bf2'
const sourceHead = '7b6eb755f81fa85ee7a6093e0cc149c2efa7399c'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
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
  'route-enablement-scope-plan.json',
  'route-enablement-scope-plan.md',
  'gate-enforcement-plan.json',
  'gate-enforcement-plan.md',
  'use-case-ranking-dispatch-plan.json',
  'use-case-ranking-dispatch-plan.md',
  'monitoring-rollback-plan.json',
  'monitoring-rollback-plan.md',
  'privacy-supabase-gcs-boundary-plan.json',
  'privacy-supabase-gcs-boundary-plan.md',
  'implementation-surface-plan.json',
  'implementation-surface-plan.md',
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
  `${reportDir}/`,
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs',
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
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  scope: readJson(`${reportDir}/route-enablement-scope-plan.json`),
  gate: readJson(`${reportDir}/gate-enforcement-plan.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-dispatch-plan.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-plan.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-boundary-plan.json`),
  surface: readJson(`${reportDir}/implementation-surface-plan.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const executionDecision = readJson(`${executionDir}/decision.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceHead !== sourceHead) fail(`source_head_drift:${reports.source.sourceHead}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 930)?.state !== 'MERGED') {
  fail('missing_pr930_source_evidence')
}
if (executionDecision.decision !== previousDecision) fail(`execution_decision_drift:${executionDecision.decision}`)

if (reports.scope.plannedRouteHarnessType !== 'bounded_local_staging_product_route_harness') {
  fail('planned_route_harness_type_drift')
}
if (reports.scope.routeIds?.length !== 3) fail('route_id_count_drift')
if (reports.scope.noRuntimeApiEnabledThisPhase !== true) fail('runtime_api_enabled_this_phase')
for (const routeId of [
  'trackbMediaOss.toolCall.validate',
  'trackbMediaOss.toolCall.queue',
  'trackbMediaOss.toolCall.status',
]) {
  if (!reports.scope.routeIds?.includes(routeId)) fail(`missing_route_id:${routeId}`)
}
for (const forbidden of [
  'real tool execution',
  'Docker or installs',
  'media processing',
  'Supabase/GCS writes',
  'external beta',
  'production',
  'public artifacts',
  'signed URLs',
  'product-ready unlocks',
]) {
  if (!reports.scope.forbiddenFutureChanges?.includes(forbidden)) fail(`missing_forbidden_future_change:${forbidden}`)
}

for (const gate of [
  'approved_snapshot_id',
  'edit_plan_id',
  'credit_reservation_id',
  'idempotency_key',
  'private_artifact_metadata',
  'quality_gate_ids',
  'fallback_policy_id',
  'rollback_state',
  'sanitized_monitoring_receipt',
]) {
  if (!reports.gate.requiredGateChecks?.includes(gate)) fail(`missing_gate:${gate}`)
}
if (reports.gate.gatePlanComplete !== true) fail('gate_plan_not_complete')

if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.productReadyCountAfterPlan !== 0) fail('ranking_product_ready_count_drift')
if (reports.ranking.futureDispatchBoundary !== 'route_harness_receipt_only_no_real_worker_dispatch') {
  fail('future_dispatch_boundary_drift')
}
for (const [useCase, expectedOrder] of Object.entries(expectedUseCaseOrders)) {
  const row = reports.ranking.useCaseMatrix?.find((entry) => entry.useCase === useCase)
  if (!row) fail(`missing_use_case:${useCase}`)
  if (row && row.order.join('|') !== expectedOrder.join('|')) fail(`use_case_order_drift:${useCase}`)
}

for (const field of ['sanitizedReceiptFields', 'rollbackControlsRequired', 'monitoringMustExclude']) {
  if (!Array.isArray(reports.monitoring[field]) || reports.monitoring[field].length === 0) {
    fail(`monitoring_${field}_missing`)
  }
}
if (reports.monitoring.monitoringPlanComplete !== true) fail('monitoring_plan_not_complete')

for (const field of [
  'userMediaByDefaultBlocked',
  'syntheticPrivateTempFixturesOnly',
  'publicArtifactsBlocked',
  'signedUrlsBlocked',
  'supabaseWritesBlocked',
  'gcsWritesBlocked',
  'sqlMigrationsBlocked',
  'secretPrintingBlocked',
  'noWriteBoundaryPlanned',
]) {
  if (reports.privacy[field] !== true) fail(`privacy_${field}_not_true`)
}

if (reports.surface.executionLaneMustStayLocalStagingOnly !== true) {
  fail('surface_not_local_staging_only')
}
for (const forbiddenFile of ['package-lock.json', '.dockerignore', 'docker/**', 'requirements/**', 'supabase/**']) {
  if (!reports.surface.futureForbiddenFiles?.includes(forbiddenFile)) fail(`missing_forbidden_file:${forbiddenFile}`)
}

if (reports.boundary.runtimeBoundary?.routeHarnessPlanned !== true) fail('route_harness_not_planned')
for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary ?? {})) {
  if (field === 'routeHarnessPlanned') continue
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}

if (reports.decisionReport.routeEnablementPlanCompleted !== true) fail('decision_plan_not_completed')
if (reports.decisionReport.readyForProductRouteEnablementExecution !== true) fail('decision_not_ready_for_execution')
if (reports.decisionReport.productRouteEnabledThisPhase !== false) fail('decision_route_enabled_this_phase')
if (reports.decisionReport.workerDispatchEnabledThisPhase !== false) fail('decision_worker_enabled_this_phase')
if (reports.decisionReport.productReadyApproved !== false) fail('decision_product_ready_approved')

if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_count_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_count_drift')
if (reports.readiness.readyForProductRouteEnablementExecution !== true) fail('readiness_execution_not_true')
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

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-route-enablement-plan:diagnostics']
    !== 'node scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs'
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
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
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductRouteEnablementExecution: true,
}, null, 2))
