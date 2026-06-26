#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution'
const planDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan'
const harnessPath = 'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts'
const decision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_plan_passed_ready_for_product_route_enablement_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'bfd406a3f847ff5c5b7e2e7f26d38d9186fdedaf'
const sourceHead = '338cb8c0b7288974360d7f6664eef9dfe25c0db3'
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
  'route-harness-implementation.json',
  'route-harness-implementation.md',
  'gate-positive-proof.json',
  'gate-positive-proof.md',
  'fail-closed-negative-path-results.json',
  'fail-closed-negative-path-results.md',
  'use-case-ranking-route-proof.json',
  'use-case-ranking-route-proof.md',
  'monitoring-rollback-proof.json',
  'monitoring-rollback-proof.md',
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
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'package.json',
  harnessPath,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-plan-diagnostics.mjs',
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
  'supabase/config.toml',
]

const expectedRoutes = [
  'trackbMediaOss.toolCall.validate',
  'trackbMediaOss.toolCall.queue',
  'trackbMediaOss.toolCall.status',
]

const expectedUseCaseOrders = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}

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
  return Array.from(new Set([
    ...git(['diff', '--name-only'], true).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean),
    ...git(['diff', '--name-only', `${baseRef}...HEAD`], true).split('\n').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
  ]))
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
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  harness: readJson(`${reportDir}/route-harness-implementation.json`),
  positive: readJson(`${reportDir}/gate-positive-proof.json`),
  negative: readJson(`${reportDir}/fail-closed-negative-path-results.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-route-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-proof.json`),
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
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 932)?.state !== 'MERGED') {
  fail('missing_pr932_source_evidence')
}
if (planDecision.decision !== previousDecision) fail(`plan_decision_drift:${planDecision.decision}`)

const harnessText = readText(harnessPath)
for (const token of [
  'TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_MODE',
  'local_staging_dry_run',
  'validateTrackBMediaOssProductRouteEnablementRequest',
  'queueTrackBMediaOssProductRouteEnablementDryRun',
  'getTrackBMediaOssProductRouteEnablementDryRunStatus',
  'createTrackBMediaOssProductRouteEnablementHarnessProof',
  'assertTrackBMediaOssToolCallPayloadIsGated',
  'workerDispatchEnabled: false',
  'realToolExecutionEnabled: false',
  'productReadyApproved: false',
]) {
  if (!harnessText.includes(token)) fail(`harness_missing_token:${token}`)
}
for (const routeId of expectedRoutes) {
  if (!harnessText.includes(routeId)) fail(`harness_missing_route:${routeId}`)
}

const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
for (const routeId of expectedRoutes) {
  const routeIndex = routeText.indexOf(`id: '${routeId}'`)
  if (routeIndex === -1) fail(`route_definition_missing:${routeId}`)
  const routeBlock = routeText.slice(routeIndex, routeText.indexOf('  {', routeIndex + 1) === -1
    ? routeText.length
    : routeText.indexOf('  {', routeIndex + 1))
  if (!routeBlock.includes("runtimeMode: 'backend_required'")) fail(`route_runtime_not_backend_required:${routeId}`)
  if (!routeBlock.includes("status: 'disabled'")) fail(`route_status_not_disabled:${routeId}`)
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
if (!contractText.includes("status: 'disabled_until_beta_gate'")) fail('contracts_not_disabled_until_beta_gate')
if (!contractText.includes('executionEnabled: false')) fail('contracts_execution_not_disabled')
if (!contractText.includes('TRACKB_MEDIA_OSS_TOOL_CALL_RANKING')) fail('ranking_contract_missing')

if (reports.harness.harnessSource !== harnessPath) fail(`harness_source_drift:${reports.harness.harnessSource}`)
if (reports.harness.harnessMode !== 'local_staging_dry_run') fail('harness_mode_drift')
if (reports.harness.realRoutesRemainDisabled !== true) fail('real_routes_not_disabled')
if (reports.harness.realRoutesRemainBackendRequired !== true) fail('real_routes_not_backend_required')
if (reports.harness.publicRuntimeApiEnabled !== false) fail('public_runtime_api_enabled')
for (const routeId of expectedRoutes) if (!reports.harness.routeIds?.includes(routeId)) fail(`report_missing_route:${routeId}`)

for (const [receiptName, expectedStatus] of [
  ['validationReceipt', 'validated'],
  ['queueReceipt', 'queued_dry_run'],
  ['statusReceipt', 'status_dry_run'],
]) {
  const response = reports.positive[receiptName]
  if (response?.ok !== true) fail(`${receiptName}_not_ok`)
  if (response?.receipt?.status !== expectedStatus) fail(`${receiptName}_status_drift`)
  if (response?.receipt?.monitoringReceipt?.sanitized !== true) fail(`${receiptName}_not_sanitized`)
  if (response?.receipt?.workerDispatchEnabled !== false) fail(`${receiptName}_worker_dispatch_enabled`)
  if (response?.receipt?.realToolExecutionEnabled !== false) fail(`${receiptName}_real_tool_execution_enabled`)
  if (response?.receipt?.productReadyApproved !== false) fail(`${receiptName}_product_ready_approved`)
}
if (reports.positive.allPositiveGatesPassed !== true) fail('positive_gates_not_passed')
if (reports.positive.sanitizedReceiptOnly !== true) fail('positive_receipt_not_sanitized_only')

const negativeCaseIds = new Set((reports.negative.negativePaths ?? []).map((entry) => entry.caseId))
for (const caseId of ['missing_approved_snapshot', 'signed_url_artifact_rejected', 'worker_dispatch_true_rejected']) {
  if (!negativeCaseIds.has(caseId)) fail(`missing_negative_case:${caseId}`)
}
for (const entry of reports.negative.negativePaths ?? []) {
  if (entry.expectedCode !== 'trackb_media_oss_product_route_enablement_fail_closed') fail(`negative_code_drift:${entry.caseId}`)
  if (entry.statusCode !== 423) fail(`negative_status_drift:${entry.caseId}`)
  if (entry.passed !== true) fail(`negative_not_passed:${entry.caseId}`)
}
if (reports.negative.failClosedBeforeDispatch !== true) fail('negative_not_fail_closed_before_dispatch')
if (reports.negative.failClosedBeforeToolExecution !== true) fail('negative_not_fail_closed_before_tool_execution')
if (reports.negative.failClosedBeforeSupabaseOrGcsWrite !== true) fail('negative_not_fail_closed_before_storage')

if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.productRouteCanDispatchSelectedCandidate !== false) fail('ranking_dispatch_enabled')
if (reports.ranking.allRankingEntriesExecutionDisabled !== true) fail('ranking_entries_not_disabled')
for (const [useCase, expectedOrder] of Object.entries(expectedUseCaseOrders)) {
  const observed = reports.ranking.useCaseRanking?.[useCase] ?? []
  if (JSON.stringify(observed) !== JSON.stringify(expectedOrder)) fail(`ranking_order_drift:${useCase}`)
}

if (reports.monitoring.sanitizedMonitoringReceipt?.sanitized !== true) fail('monitoring_not_sanitized')
for (const field of ['rawPayload', 'rawPrompt', 'rawChat', 'storageObjectPath', 'signedUrl', 'publicUrl', 'providerPrompt', 'secret']) {
  if (!reports.monitoring.monitoringFieldsForbidden?.includes(field)) fail(`monitoring_missing_forbidden_field:${field}`)
}
if (reports.monitoring.rollbackState !== 'armed_disabled_noop') fail('rollback_state_drift')
if (reports.monitoring.liveRuntimeRollbackExecuted !== false) fail('live_runtime_rollback_executed')
if (reports.monitoring.monitoringEmittedToRuntime !== false) fail('monitoring_emitted_to_runtime')

for (const [field, expected] of Object.entries({
  supabaseWriteAttempted: false,
  gcsWriteAttempted: false,
  serviceRoleUsed: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  privatePayloadPersisted: false,
  storageObjectPathsExposedInReceipt: false,
  rawPromptAccepted: false,
  rawPromptExecutionPayloadRejected: true,
})) {
  if (reports.privacy[field] !== expected) fail(`privacy_${field}_drift`)
}

for (const field of [
  'dockerRun',
  'installsRun',
  'realToolsRun',
  'mediaProcessed',
  'workerDispatchRun',
  'productRoutesEnabled',
  'externalBetaEnabled',
  'productionEnabled',
]) {
  if (reports.boundary[field] !== false) fail(`boundary_${field}_not_false`)
}
if (reports.boundary.runtimeBoundaryAccepted !== true) fail('runtime_boundary_not_accepted')
if (reports.decisionReport.routeEnablementExecutionPassed !== true) fail('decision_execution_not_passed')
if (reports.decisionReport.readyForQaReview !== true) fail('decision_not_ready_for_qa')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.readyForProductRouteEnablementQaReview !== true) fail('readiness_not_ready_for_qa')
if (reports.readiness.readyForLiveProductCalls !== false) fail('readiness_live_product_calls_true')
if (reports.readiness.readyForWorkerDispatch !== false) fail('readiness_worker_dispatch_true')
if (reports.readiness.readyForProductReadyStatus !== false) fail('readiness_product_ready_true')
if (reports.manifest.privateArtifactsCreated !== false) fail('manifest_private_artifacts_created')
if (reports.manifest.publicArtifactsCreated !== false) fail('manifest_public_artifacts_created')
if (reports.manifest.signedUrlsCreated !== false) fail('manifest_signed_urls_created')
if (reports.manifest.mediaArtifactsCreated !== false) fail('manifest_media_artifacts_created')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-route-enablement-execution:diagnostics']
    !== 'node scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-execution-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
    fail(`status_missing_totals:${file}`)
  }
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
}
const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes('Do not enable live product calls')) fail('next_prompt_missing_scope_boundary')

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', file], true)) fail(`protected_file_changed:${file}`)
  if (git(['diff', '--name-only', '--', file], true)) fail(`protected_worktree_diff:${file}`)
  if (git(['diff', '--cached', '--name-only', '--', file], true)) fail(`protected_staged_diff:${file}`)
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  harnessPath,
  'package.json',
]
for (const file of scanFiles) {
  const text = readText(file)
  if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) fail(`forbidden_product_ready_positive_claim:${file}`)
  if (/40\\+ tools (?:proven|installed|ready|end-to-end)/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
  if (/(BEGIN PRIVATE KEY|SUPABASE_SERVICE_ROLE|AWS_SECRET_ACCESS_KEY|AKIA[0-9A-Z]{16})/.test(text)) {
    fail(`secret_like_material:${file}`)
  }
  if (new RegExp('https?://[^\\\\s`"]+\\\\?(?:[^\\\\s`"]*&)?(?:X-Amz-Signature|X-Goog-Signature|signature)=', 'i').test(text)) {
    fail(`signed_url_material:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  previousDecision,
  nextPrompt,
  harnessSource: harnessPath,
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductRouteEnablementQaReview: true,
}, null, 2))
