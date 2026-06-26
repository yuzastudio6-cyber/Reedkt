#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review'
const executionDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution'
const decision =
  'trackb_media_oss_product_beta_runtime_controlled_activation_qa_passed_ready_for_controlled_activation_closeout'
const executionDecision =
  'trackb_media_oss_product_beta_runtime_controlled_activation_execution_passed_ready_for_controlled_activation_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_CONTROLLED_ACTIVATION_CLOSEOUT'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'bbb59e54fbf2c9a74e1c02a425bd421e47b3f531'
const sourceHead = '1ee7c77d88662193efdbada4c3fd2b0529b7b70b'
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
  'activation-qa-acceptance.json',
  'activation-qa-acceptance.md',
  'controlled-activation-artifact-qa.json',
  'controlled-activation-artifact-qa.md',
  'route-worker-runtime-boundary-qa.json',
  'route-worker-runtime-boundary-qa.md',
  'monitoring-rollback-qa.json',
  'monitoring-rollback-qa.md',
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
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution/',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs',
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
  if (report.previousDecision !== executionDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.productReadyCount !== 0) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  acceptance: readJson(`${reportDir}/activation-qa-acceptance.json`),
  artifact: readJson(`${reportDir}/controlled-activation-artifact-qa.json`),
  routeWorker: readJson(`${reportDir}/route-worker-runtime-boundary-qa.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-qa.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
}
const manifest = readJson(`${reportDir}/private-artifact-manifest.json`)
const executionReport = readJson(`${executionDir}/decision.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)
if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceHead !== sourceHead) fail(`source_head_drift:${reports.source.sourceHead}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 908)?.state !== 'MERGED') {
  fail('missing_pr908_source_evidence')
}
if (executionReport.decision !== executionDecision) fail(`execution_decision_drift:${executionReport.decision}`)

for (const field of [
  'activationQaAccepted',
  'controlledActivationExecutionAccepted',
  'failClosedRouteRuntimeControlsAccepted',
  'perToolWorkerDispatchGuardsAccepted',
  'approvedSnapshotGateAccepted',
  'editPlanApprovalGateAccepted',
  'creditGateAccepted',
  'serviceRoleNoWriteBoundaryAccepted',
  'sanitizedMonitoringAccepted',
  'rollbackDisableControlsAccepted',
  'limitedExposureControlsAccepted',
  'readyForControlledActivationCloseout',
]) {
  if (reports.acceptance[field] !== true) fail(`acceptance_${field}_not_true`)
}
for (const field of [
  'readyForLiveProductCalls',
  'readyForDirectRouteDispatch',
  'readyForWorkerDispatchToRealTools',
  'readyForRealToolExecution',
  'externalBetaApproved',
  'productionApproved',
  'productReady',
]) {
  if (reports.acceptance[field] !== false) fail(`acceptance_${field}_unexpected_true`)
}

if (reports.artifact.artifactQa?.sourceArtifactPresent !== true) fail('source_artifact_missing')
if (reports.artifact.artifactQa?.coveredToolCount !== 16) fail('artifact_tool_count_drift')
if (reports.artifact.artifactQa?.rankingAccepted !== true) fail('ranking_not_accepted')
if (reports.artifact.artifactQa?.useCaseMatrixAccepted !== true) fail('use_case_matrix_not_accepted')
if (reports.artifact.artifactQa?.noLiveRuntimeMutation !== true) fail('artifact_live_runtime_mutation')

const expectedOrders = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}
for (const [useCase, expected] of Object.entries(expectedOrders)) {
  const row = reports.artifact.useCaseMatrix?.find((entry) => entry.useCase === useCase)
  if (!row) fail(`missing_use_case:${useCase}`)
  if (row && row.order.join('|') !== expected.join('|')) fail(`use_case_order_drift:${useCase}`)
}

for (const field of [
  'routeDispatchEnabled',
  'directProductToolCallsEnabled',
  'workerDispatchEnabled',
  'workerDispatchToRealToolsEnabled',
  'realToolExecutionEnabled',
]) {
  if (reports.routeWorker.routeWorkerQa?.[field] !== false) fail(`route_worker_${field}_unexpected_true`)
}
if (reports.routeWorker.routeWorkerQa?.perToolAllowlistRecordedForAllTools !== true) {
  fail('route_worker_allowlist_not_recorded')
}
if (reports.routeWorker.routeWorkerQa?.approvedSnapshotRequired !== true) fail('snapshot_gate_not_required')
if (reports.routeWorker.routeWorkerQa?.editPlanApprovalRequired !== true) fail('edit_plan_gate_not_required')
if (reports.routeWorker.routeWorkerQa?.creditGateRequired !== true) fail('credit_gate_not_required')

if (reports.monitoring.monitoringQa?.sanitizedMonitoringShapeAccepted !== true) fail('monitoring_shape_not_accepted')
for (const field of [
  'rawPayloadLoggingAllowed',
  'privatePayloadLoggingAllowed',
  'signedUrlIncluded',
  'secretMaterialIncluded',
  'liveTelemetryEnabled',
  'externalBetaTelemetryEnabled',
]) {
  if (reports.monitoring.monitoringQa?.[field] !== false) fail(`monitoring_${field}_unexpected_true`)
}
if (reports.monitoring.rollbackQa?.rollbackDisableControlAccepted !== true) fail('rollback_not_accepted')
if (reports.monitoring.rollbackQa?.rollbackExecutedAgainstLiveRuntime !== false) fail('rollback_live_execution_true')

for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary || {})) {
  if (value !== false) fail(`runtime_boundary_unexpected_true:${field}`)
}
if (reports.boundary.productReadyLocalOssCount !== 0) fail('boundary_product_ready_count_drift')

if (reports.decisionReport.controlledActivationQaAccepted !== true) fail('decision_qa_not_accepted')
if (reports.decisionReport.readyForControlledActivationCloseout !== true) fail('decision_not_ready_for_closeout')
if (reports.decisionReport.liveActivationApproved !== false) fail('decision_live_activation_true')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.coveredToolCount !== 16) fail('readiness_tool_count_drift')
if (reports.readiness.boundedAcceptedProvenCount !== 16) fail('readiness_accepted_drift')
if (reports.readiness.blockedNotInstalledProvenCount !== 0) fail('readiness_blocked_drift')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')
if (reports.readiness.readyForControlledActivationCloseout !== true) fail('readiness_not_ready_for_closeout')
for (const field of [
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
  if (manifest[field] !== false) fail(`manifest_artifact_or_secret_created:${field}`)
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-controlled-activation-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
}
const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_token')
if (!promptText.includes(decision)) fail('next_prompt_file_missing_decision')

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

const scannedFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
]
for (const file of scannedFiles) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail(`signed_url:${file}`)
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
}

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failures,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      nextPrompt,
      controlledActivationQaAccepted: true,
      productReadyCount: 0,
      trackBTotals: totals,
    },
    null,
    2,
  ),
)
