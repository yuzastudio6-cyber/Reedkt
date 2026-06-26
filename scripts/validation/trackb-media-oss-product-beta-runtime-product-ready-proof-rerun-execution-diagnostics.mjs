#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution'
const planDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan'
const routeExecutionDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution'
const decision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_execution_passed_ready_for_product_ready_proof_rerun_qa_review'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_plan_passed_ready_for_product_ready_proof_rerun_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_RERUN_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourcePr = 958
const sourceSha = '07909a2bb297b0012bc80ab61cb08cccf1806f37'
const sourceHead = '9f87daed4de2be534bd92300428d4cd572bb9e80'
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
  'product-route-rerun-proof.json',
  'product-route-rerun-proof.md',
  'use-case-ranking-rerun-proof.json',
  'use-case-ranking-rerun-proof.md',
  'approval-snapshot-credit-idempotency-proof.json',
  'approval-snapshot-credit-idempotency-proof.md',
  'worker-dispatch-guard-proof.json',
  'worker-dispatch-guard-proof.md',
  'monitoring-rollback-proof.json',
  'monitoring-rollback-proof.md',
  'privacy-supabase-gcs-boundary-proof.json',
  'privacy-supabase-gcs-boundary-proof.md',
  'product-ready-boundary.json',
  'product-ready-boundary.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review/',
  `${reportDir}/`,
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-1-tesseract-fixture-proof-followup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-1-build-context-blocker-followup-diagnostics.mjs',
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
  if (report.previousDecision !== previousDecision) {
    fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  }
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.sourcePr !== sourcePr) fail(`${label}_source_pr_drift:${report.sourcePr}`)
  if (report.sourceSha !== sourceSha) fail(`${label}_source_sha_drift:${report.sourceSha}`)
  if (report.sourceHead !== sourceHead) fail(`${label}_source_head_drift:${report.sourceHead}`)
  if (report.productReadyCount !== 0) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) {
    fail(`${label}_totals_drift`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  route: readJson(`${reportDir}/product-route-rerun-proof.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-rerun-proof.json`),
  approval: readJson(`${reportDir}/approval-snapshot-credit-idempotency-proof.json`),
  dispatch: readJson(`${reportDir}/worker-dispatch-guard-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-proof.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-boundary-proof.json`),
  boundary: readJson(`${reportDir}/product-ready-boundary.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const planDecision = readJson(`${planDir}/decision.json`)
const routePositive = readJson(`${routeExecutionDir}/gate-positive-proof.json`)
const routeRanking = readJson(`${routeExecutionDir}/use-case-ranking-route-proof.json`)
const routeNegative = readJson(`${routeExecutionDir}/fail-closed-negative-path-results.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (planDecision.decision !== previousDecision) fail(`plan_decision_drift:${planDecision.decision}`)
if (reports.source.acceptedSourceEvidence?.find((entry) => entry.pr === 958)?.state !== 'MERGED') {
  fail('missing_pr958_source_evidence')
}
if (reports.source.routeEnablementCloseoutAuthoritative !== true) {
  fail('route_enablement_closeout_not_authoritative')
}
if (reports.source.productReadyProofRerunExecutionRequired !== true) {
  fail('rerun_execution_not_required')
}

if (reports.route.equivalentServerRouteHarness !== true) fail('route_not_equivalent_server_harness')
if (reports.route.productFacingRouteBehaviorProven !== true) fail('product_route_behavior_not_proven')
if (reports.route.receiptsSanitized !== true) fail('route_receipts_not_sanitized')
if (reports.route.liveProductCallsRan !== false) fail('live_product_calls_ran')
if (reports.route.realRouteDispatchRan !== false) fail('real_route_dispatch_ran')
if (reports.route.routeRuntimeEnabled !== false) fail('route_runtime_enabled')
for (const routeId of expectedRoutes) {
  if (!reports.route.routeIds?.includes(routeId)) fail(`route_report_missing:${routeId}`)
  if (!routePositive.validationReceipt?.receipt?.routeId && routeId === expectedRoutes[0]) {
    fail('route_positive_receipt_missing')
  }
}
for (const status of ['validated', 'queued_dry_run', 'status_dry_run']) {
  if (!reports.route.receiptStatuses?.includes(status)) fail(`route_status_missing:${status}`)
}

if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.allToolsCoveredByRankingOrFallbackPolicy !== true) fail('all_tools_not_covered')
if (reports.ranking.productRouteCanDispatchSelectedCandidate !== false) fail('dispatch_unexpectedly_enabled')
for (const [useCase, expected] of Object.entries(expectedUseCaseOrders)) {
  const actual = reports.ranking.useCaseRanking?.[useCase]
  const routeActual = routeRanking.useCaseRanking?.[useCase]
  if (!actual) fail(`missing_use_case:${useCase}`)
  if (actual && actual.join('|') !== expected.join('|')) fail(`use_case_order_drift:${useCase}`)
  if (routeActual && routeActual.join('|') !== expected.join('|')) fail(`route_use_case_order_drift:${useCase}`)
}

for (const field of [
  'approvedSnapshotGatePassed',
  'editPlanGatePassed',
  'creditReservationGatePassed',
  'idempotencyGatePassed',
  'privateArtifactMetadataGatePassed',
  'qaGatePassed',
  'fallbackPolicyGatePassed',
  'noToolCallBeforeApproval',
  'noCreditBypass',
  'duplicateSafeDryRunReceipt',
]) {
  if (reports.approval[field] !== true) fail(`approval_${field}_not_true`)
}

for (const [field, expected] of Object.entries({
  workerDispatchEnabled: false,
  realToolExecutionEnabled: false,
  unsupportedToolDispatchBlocked: true,
  toolContractsRemainDisabledUntilBetaGate: true,
  allRankingEntriesExecutionDisabled: true,
  failClosedBeforeDispatch: true,
  failClosedBeforeToolExecution: true,
  productReadyApproved: false,
})) {
  if (reports.dispatch[field] !== expected) fail(`dispatch_${field}_drift`)
}
if (routeNegative.failClosedBeforeDispatch !== true) fail('route_negative_not_fail_closed_before_dispatch')
if (routeNegative.failClosedBeforeToolExecution !== true) fail('route_negative_not_fail_closed_before_tool')
if (routeNegative.failClosedBeforeSupabaseOrGcsWrite !== true) fail('route_negative_not_fail_closed_before_writes')

if (reports.monitoring.sanitizedMonitoringReceiptReady !== true) fail('monitoring_not_sanitized_ready')
if (reports.monitoring.rollbackState !== 'armed_disabled_noop') fail('rollback_state_drift')
if (reports.monitoring.globalTrackBDisableControlObserved !== true) fail('global_disable_not_observed')
if (reports.monitoring.perToolDisableControlsObserved !== true) fail('per_tool_disable_not_observed')
if (reports.monitoring.rawPayloadLogged !== false) fail('raw_payload_logged')
if (reports.monitoring.privatePayloadLogged !== false) fail('private_payload_logged')

for (const [field, expected] of Object.entries({
  userMediaUsedByDefault: false,
  syntheticPrivateFixtureOnly: true,
  rawPromptAccepted: false,
  privatePayloadPersisted: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  supabaseWriteAttempted: false,
  gcsWriteAttempted: false,
  serviceRoleUsed: false,
  externalBetaExposed: false,
  productionExposed: false,
})) {
  if (reports.privacy[field] !== expected) fail(`privacy_${field}_drift`)
}

if (reports.boundary.productReadyProofRerunExecutionPassed !== true) fail('boundary_execution_not_passed')
if (reports.boundary.readyForProductReadyProofRerunQaReview !== true) fail('boundary_not_ready_for_qa')
if (reports.boundary.productReadyApproved !== false) fail('boundary_product_ready_approved')
if (reports.boundary.productReadyLocalOssCount !== 0) fail('boundary_product_ready_count_drift')
if (reports.boundary.qaAcceptanceRequiredBeforeProductReady !== true) fail('boundary_qa_not_required')
if (reports.boundary.noFortyPlusEndToEndClaim !== true) fail('boundary_forbidden_40_plus_claim')

if (reports.decisionReport.productReadyProofRerunExecutionPassed !== true) fail('decision_execution_not_passed')
if (reports.decisionReport.readyForProductReadyProofRerunQaReview !== true) fail('decision_not_ready_for_qa')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.readyForProductReadyProofRerunQaReview !== true) fail('readiness_not_ready_for_qa')
for (const field of [
  'readyForLiveProductCalls',
  'readyForWorkerDispatch',
  'readyForRealToolExecution',
  'readyForExternalBeta',
  'readyForProduction',
  'readyForProductReadyStatus',
]) {
  if (reports.readiness[field] !== false) fail(`readiness_${field}_unexpected_true`)
}

if (reports.manifest.privateArtifactsCreated !== false) fail('manifest_private_artifacts_created')
if (reports.manifest.publicArtifactsCreated !== false) fail('manifest_public_artifacts_created')
if (reports.manifest.signedUrlsCreated !== false) fail('manifest_signed_urls_created')
if (reports.manifest.generatedMediaArtifactsCreated !== false) fail('manifest_media_artifacts_created')

const combinedText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md'),
].join('\n')
for (const token of [decision, previousDecision, nextPrompt, '16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready']) {
  if (!combinedText.includes(token)) fail(`missing_required_text:${token}`)
}
if (/40\\+ tools proven end-to-end|40\\+ tools end-to-end/i.test(combinedText)) {
  fail('forbidden_40_plus_claim')
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-proof-rerun-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution-diagnostics.mjs'
) {
  fail('missing_package_script')
}

for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', `${baseRef}...HEAD`, '--', file], true)) {
    fail(`protected_file_changed:${file}`)
  }
  if (git(['diff', '--name-only', '--', file], true)) fail(`protected_worktree_diff:${file}`)
  if (git(['diff', '--cached', '--name-only', '--', file], true)) fail(`protected_cached_diff:${file}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file) && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
  if (/\\.(mp4|mov|mkv|srt|wav|mp3|png|jpe?g|webp|ttf|otf|onnx|pdmodel|pdiparams|zip)$/i.test(file)) {
    fail(`forbidden_artifact_changed:${file}`)
  }
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of changedFiles()) {
  if (/(secret|signed-url|private-payload|service-role)/i.test(file) && !file.includes('docs/')) {
    fail(`suspicious_secret_path:${file}`)
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
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductReadyProofRerunQaReview: true,
}, null, 2))
