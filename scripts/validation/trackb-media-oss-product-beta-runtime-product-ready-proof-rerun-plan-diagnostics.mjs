#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan'
const closeoutDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout'
const decision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_plan_passed_ready_for_product_ready_proof_rerun_execution'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_closeout_passed_ready_for_product_ready_proof_rerun_plan'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_RERUN_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourcePr = 947
const sourceSha = '019ad4061f96a302f02f89eaacbfec796a23f417'
const sourceHead = 'a73e0a738946d271d139f4139e1c90166b83646b'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}
const totalsText =
  '16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready'

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'proof-rerun-plan-overview.json',
  'proof-rerun-plan-overview.md',
  'product-route-rerun-proof-plan.json',
  'product-route-rerun-proof-plan.md',
  'use-case-tool-ranking-rerun-matrix.json',
  'use-case-tool-ranking-rerun-matrix.md',
  'approval-snapshot-credit-rerun-plan.json',
  'approval-snapshot-credit-rerun-plan.md',
  'worker-dispatch-guard-rerun-plan.json',
  'worker-dispatch-guard-rerun-plan.md',
  'monitoring-rollback-privacy-rerun-plan.json',
  'monitoring-rollback-privacy-rerun-plan.md',
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
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review/',
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs',
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
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  overview: readJson(`${reportDir}/proof-rerun-plan-overview.json`),
  route: readJson(`${reportDir}/product-route-rerun-proof-plan.json`),
  ranking: readJson(`${reportDir}/use-case-tool-ranking-rerun-matrix.json`),
  approval: readJson(`${reportDir}/approval-snapshot-credit-rerun-plan.json`),
  dispatch: readJson(`${reportDir}/worker-dispatch-guard-rerun-plan.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-privacy-rerun-plan.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const closeoutDecision = readJson(`${closeoutDir}/decision.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (closeoutDecision.decision !== previousDecision) {
  fail(`closeout_decision_drift:${closeoutDecision.decision}`)
}
if (reports.source.acceptedSourceEvidence?.find((entry) => entry.pr === 947)?.state !== 'MERGED') {
  fail('missing_pr947_source_evidence')
}
if (reports.source.routeEnablementCloseoutAuthoritative !== true) {
  fail('route_enablement_closeout_not_authoritative')
}
if (reports.source.productReadyProofRerunPlanRequired !== true) {
  fail('rerun_plan_not_required')
}

if (reports.overview.productReadyProofRerunPlanCompleted !== true) fail('rerun_plan_not_completed')
if (reports.overview.currentEvidenceSufficientForProductReady !== false) {
  fail('current_evidence_unexpectedly_product_ready')
}
if (reports.overview.futureProductReadyProofRerunExecutionPlanned !== true) {
  fail('future_rerun_execution_not_planned')
}
for (const [field, value] of Object.entries(reports.overview.requiredRerunProofGates || {})) {
  if (!String(value).length) fail(`missing_required_rerun_gate:${field}`)
}
if (!Array.isArray(reports.overview.allowedInNextGate) || reports.overview.allowedInNextGate.length < 5) {
  fail('allowed_next_gate_rules_missing')
}
if (
  !Array.isArray(reports.overview.forbiddenUntilSeparatelyApproved) ||
  reports.overview.forbiddenUntilSeparatelyApproved.length < 8
) {
  fail('forbidden_rules_missing')
}

if (reports.route.routeHarnessRerunRequired !== true) fail('route_harness_rerun_not_required')
if (reports.route.validateQueueStatusReceiptsRequired !== true) fail('validate_queue_status_receipts_not_required')
if (reports.route.directDiagnosticScriptInsufficient !== true) fail('direct_diagnostic_script_not_marked_insufficient')
if (!Array.isArray(reports.route.failClosedNegativePathsRequired) || reports.route.failClosedNegativePathsRequired.length < 8) {
  fail('route_negative_paths_missing')
}

const expectedOrders = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}
if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.allToolsHaveFutureRerunProofRequirement !== true) fail('missing_future_rerun_requirements')
for (const [useCase, expected] of Object.entries(expectedOrders)) {
  const row = reports.ranking.useCaseMatrix?.find((entry) => entry.useCase === useCase)
  if (!row) fail(`missing_use_case:${useCase}`)
  if (row && row.order.join('|') !== expected.join('|')) fail(`use_case_order_drift:${useCase}`)
  if (row && !row.requiredProductProof) fail(`missing_required_product_proof:${useCase}`)
}

for (const field of [
  'approvedSnapshotGateRequired',
  'editPlanGateRequired',
  'creditGateRequired',
  'approvalBeforeToolCallRequired',
  'idempotencyGateRequired',
  'proofMustShowNoToolCallBeforeApproval',
  'proofMustShowNoCreditBypass',
]) {
  if (reports.approval[field] !== true) fail(`approval_${field}_not_true`)
}

for (const field of [
  'workerDispatchRequiredForProductReadyProof',
  'dispatchAllowlistRequired',
  'perToolDisableRequired',
  'unsupportedToolDispatchMustFailClosed',
  'receiptMustNotContainPrivatePayloads',
  'routeHarnessCannotDirectlyCallToolBinaries',
]) {
  if (reports.dispatch[field] !== true) fail(`dispatch_${field}_not_true`)
}

for (const field of [
  'sanitizedMonitoringRequired',
  'rollbackDisableRequired',
  'perToolDisableRequired',
  'globalTrackBDisableRequired',
  'proofMustShowDisabledToolsDoNotDispatch',
  'monitoringMustNotIncludePrivatePayloads',
  'userMediaByDefaultBlocked',
  'syntheticPrivateTempFixturesOnly',
  'publicArtifactsBlocked',
  'signedUrlsBlocked',
  'supabaseGcsWritesBlocked',
  'sqlMigrationsBlocked',
  'secretPrintingBlocked',
]) {
  if (reports.monitoring[field] !== true) fail(`monitoring_or_privacy_${field}_not_true`)
}

for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary || {})) {
  if (field === 'nextGateBoundedProductReadyProofRerunExecutionPlanned') {
    if (value !== true) fail('next_gate_not_planned')
  } else if (value !== false) {
    fail(`runtime_boundary_unexpected_true:${field}`)
  }
}

if (reports.decisionReport.productReadyProofRerunPlanCompleted !== true) fail('decision_rerun_plan_not_completed')
if (reports.decisionReport.readyForProductReadyProofRerunExecution !== true) {
  fail('decision_not_ready_for_rerun_execution')
}
if (reports.decisionReport.readyForProductReadyStatus !== false) fail('decision_product_ready_true')
if (reports.readiness.readyForProductReadyProofRerunExecution !== true) {
  fail('readiness_not_ready_for_rerun_execution')
}
if (reports.readiness.readyForProductReadyStatus !== false) fail('readiness_product_ready_true')
if (reports.readiness.productReadyLocalOssCount !== 0) fail('readiness_product_ready_count_drift')

for (const field of [
  'privateArtifactsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'mediaArtifactsCreated',
  'runtimePayloadsCreated',
  'secretsCommitted',
  'generatedOutputsCreated',
]) {
  if (reports.manifest[field] !== false) fail(`manifest_artifact_or_secret_created:${field}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-proof-rerun-plan:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
  if (!text.includes(totalsText)) fail(`status_missing_totals:${file}`)
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_token')
if (!promptText.includes(decision)) fail('next_prompt_file_missing_decision')
if (!promptText.includes(totalsText)) fail('next_prompt_missing_totals_boundary')

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file) && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (
    git(['diff', '--name-only', '--', file], true) ||
    git(['diff', '--cached', '--name-only', '--', file], true)
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

for (const file of [
  ...requiredReports.map((report) => `${reportDir}/${report}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
]) {
  const text = readText(file)
  if (
    /\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(
      text,
    )
  ) {
    fail(`secret_material:${file}`)
  }
  if (/https:\/\/[^\s)]+X-Goog-Signature=/.test(text)) fail(`signed_url:${file}`)
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
  if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) {
    fail(`forbidden_product_ready_positive_claim:${file}`)
  }
  if (/\b(live product calls approved|external beta approved|production approved)\b/i.test(text)) {
    fail(`forbidden_runtime_unlock_wording:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      previousDecision,
      nextPrompt,
      productReadyCount: 0,
      trackBTotals: totals,
      readyForProductReadyProofRerunExecution: true,
    },
    null,
    2,
  ),
)
