#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review'
const executionDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution'
const harnessPath = 'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts'
const decision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_qa_passed_ready_for_product_route_enablement_closeout'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_CLOSEOUT'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourcePr = 939
const sourceSha = 'cf355808b4f6f75cd96d84bffda2ae3f088ce0d1'
const sourceHead = '93dfe24b68ce4f601fbf7228cfae531f179714d9'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}

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

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'harness-qa-acceptance.json',
  'harness-qa-acceptance.md',
  'fail-closed-qa-acceptance.json',
  'fail-closed-qa-acceptance.md',
  'use-case-ranking-qa.json',
  'use-case-ranking-qa.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
  'privacy-monitoring-qa.json',
  'privacy-monitoring-qa.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review.md',
  harnessPath,
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
  if (report.previousDecision !== previousDecision) {
    fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  }
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.sourcePr !== sourcePr) fail(`${label}_source_pr_drift:${report.sourcePr}`)
  if (report.sourceSha !== sourceSha) fail(`${label}_source_sha_drift:${report.sourceSha}`)
  if (report.sourceHead !== sourceHead) fail(`${label}_source_head_drift:${report.sourceHead}`)
  if (report.productReadyCount !== 0) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  harness: readJson(`${reportDir}/harness-qa-acceptance.json`),
  negative: readJson(`${reportDir}/fail-closed-qa-acceptance.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-qa.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-qa.json`),
  privacy: readJson(`${reportDir}/privacy-monitoring-qa.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const executionDecision = readJson(`${executionDir}/decision.json`)
const executionPositive = readJson(`${executionDir}/gate-positive-proof.json`)
const executionNegative = readJson(`${executionDir}/fail-closed-negative-path-results.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (executionDecision.decision !== previousDecision) fail(`execution_decision_drift:${executionDecision.decision}`)
if (executionDecision.readyForQaReview !== true) fail('execution_not_ready_for_qa')
if (reports.source.acceptedPrEvidence?.find((entry) => entry.pr === sourcePr)?.state !== 'MERGED') {
  fail('missing_pr939_merged_source_evidence')
}
if (reports.source.routeDefinitionsRemainDisabled !== true) fail('source_routes_not_disabled')
if (reports.source.workerContractsRemainExecutionDisabled !== true) fail('source_contracts_not_disabled')

const harnessText = readText(harnessPath)
for (const token of [
  'TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_MODE',
  'local_staging_dry_run',
  'validateTrackBMediaOssProductRouteEnablementRequest',
  'queueTrackBMediaOssProductRouteEnablementDryRun',
  'getTrackBMediaOssProductRouteEnablementDryRunStatus',
  'workerDispatchEnabled: false',
  'realToolExecutionEnabled: false',
  'productReadyApproved: false',
]) {
  if (!harnessText.includes(token)) fail(`harness_missing_token:${token}`)
}

for (const routeId of expectedRoutes) {
  if (!reports.harness.acceptedRouteIds?.includes(routeId)) fail(`harness_report_missing_route:${routeId}`)
  if (!harnessText.includes(routeId)) fail(`harness_missing_route:${routeId}`)
}
if (reports.harness.sanitizedDryRunReceiptsAccepted !== true) fail('harness_receipts_not_accepted')
for (const field of [
  'liveProductCallsAccepted',
  'workerDispatchAccepted',
  'realToolExecutionAccepted',
  'productReadyAccepted',
]) {
  if (reports.harness[field] !== false) fail(`harness_${field}_unexpected_true`)
}

for (const receiptName of ['validationReceipt', 'queueReceipt', 'statusReceipt']) {
  const receipt = executionPositive[receiptName]?.receipt
  if (!receipt) fail(`execution_missing_receipt:${receiptName}`)
  if (receipt?.monitoringReceipt?.sanitized !== true) fail(`execution_receipt_not_sanitized:${receiptName}`)
  if (receipt?.workerDispatchEnabled !== false) fail(`execution_receipt_worker_dispatch:${receiptName}`)
  if (receipt?.realToolExecutionEnabled !== false) fail(`execution_receipt_tool_execution:${receiptName}`)
  if (receipt?.productReadyApproved !== false) fail(`execution_receipt_product_ready:${receiptName}`)
}
if (executionPositive.allPositiveGatesPassed !== true) fail('execution_positive_gates_not_passed')

const expectedNegativeCases = new Set([
  'missing_approved_snapshot',
  'signed_url_artifact_rejected',
  'worker_dispatch_true_rejected',
])
for (const entry of reports.negative.acceptedNegativePaths ?? []) {
  expectedNegativeCases.delete(entry.caseId)
  if (entry.accepted !== true) fail(`negative_not_accepted:${entry.caseId}`)
  if (entry.statusCode !== 423) fail(`negative_status_drift:${entry.caseId}`)
}
for (const missing of expectedNegativeCases) fail(`missing_negative_case:${missing}`)
if (executionNegative.failClosedBeforeDispatch !== true) fail('execution_not_fail_closed_before_dispatch')
if (reports.negative.failClosedBeforeToolExecutionAccepted !== true) fail('qa_not_fail_closed_before_tool_execution')
if (reports.negative.failClosedBeforeSupabaseOrGcsWriteAccepted !== true) {
  fail('qa_not_fail_closed_before_storage')
}

if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.deterministicRankingAccepted !== true) fail('ranking_not_accepted')
if (reports.ranking.allRankingEntriesExecutionDisabled !== true) fail('ranking_entries_not_disabled')
if (reports.ranking.productRouteCanDispatchSelectedCandidate !== false) fail('ranking_dispatch_enabled')
for (const [useCase, expectedOrder] of Object.entries(expectedUseCaseOrders)) {
  const observed = reports.ranking.useCaseRanking?.[useCase] ?? []
  if (JSON.stringify(observed) !== JSON.stringify(expectedOrder)) fail(`ranking_order_drift:${useCase}`)
}

for (const field of [
  'liveProductCallsApproved',
  'directRouteDispatchApproved',
  'workerDispatchToRealToolsApproved',
  'realToolExecutionApproved',
  'dockerRun',
  'installsRun',
  'mediaProcessed',
  'externalBetaApproved',
  'productionApproved',
  'productReady',
]) {
  if (reports.boundary[field] !== false) fail(`boundary_${field}_unexpected_true`)
}
if (reports.boundary.routeDefinitionsRemainDisabled !== true) fail('boundary_routes_not_disabled')
if (reports.boundary.routeDefinitionsRemainBackendRequired !== true) fail('boundary_routes_not_backend_required')

for (const [field, expected] of Object.entries({
  sanitizedMonitoringAccepted: true,
  rawPayloadLogged: false,
  rawPromptAccepted: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  supabaseWriteAttempted: false,
  gcsWriteAttempted: false,
  serviceRoleUsed: false,
  privatePayloadPersisted: false,
  monitoringReadyForCloseout: true,
})) {
  if (reports.privacy[field] !== expected) fail(`privacy_${field}_drift`)
}

if (reports.decisionReport.routeEnablementQaCompleted !== true) fail('decision_qa_not_completed')
if (reports.decisionReport.readyForProductRouteEnablementCloseout !== true) {
  fail('decision_not_ready_for_closeout')
}
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.readyForProductRouteEnablementCloseout !== true) fail('readiness_not_ready_for_closeout')
for (const field of [
  'readyForLiveProductCalls',
  'readyForWorkerDispatch',
  'readyForRealToolExecution',
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

const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
for (const routeId of expectedRoutes) {
  const routeIndex = routeText.indexOf(`id: '${routeId}'`)
  if (routeIndex === -1) fail(`route_definition_missing:${routeId}`)
  const nextRoute = routeText.indexOf('  {', routeIndex + 1)
  const routeBlock = routeText.slice(routeIndex, nextRoute === -1 ? routeText.length : nextRoute)
  if (!routeBlock.includes("runtimeMode: 'backend_required'")) fail(`route_runtime_not_backend_required:${routeId}`)
  if (!routeBlock.includes("status: 'disabled'")) fail(`route_status_not_disabled:${routeId}`)
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
if (!contractText.includes("status: 'disabled_until_beta_gate'")) fail('contracts_not_disabled_until_beta_gate')
if (!contractText.includes('executionEnabled: false')) fail('contracts_execution_not_disabled')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-route-enablement-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs'
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

const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_token')
if (!promptText.includes(decision)) fail('next_prompt_file_missing_decision')
if (!promptText.includes('0 blocked-not-installed-proven / 0 product-ready')) {
  fail('next_prompt_missing_product_ready_boundary')
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true) || git(['diff', '--cached', '--name-only', '--', file], true)) {
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

for (const file of [
  ...requiredReports.map((report) => `${reportDir}/${report}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
]) {
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
  sourcePr,
  sourceSha,
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductRouteEnablementCloseout: true,
}, null, 2))
