#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution'
const decision =
  'trackb_media_oss_limited_internal_beta_product_tool_call_runtime_dry_run_execution_passed_ready_for_runtime_dry_run_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_DRY_RUN_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'fcb6624b89bead68225b9314632b2948f3248372'
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
  'safe-fixture-payloads.json',
  'safe-fixture-payloads.md',
  'deterministic-routing-dry-run.json',
  'deterministic-routing-dry-run.md',
  'runtime-gate-dry-run-results.json',
  'runtime-gate-dry-run-results.md',
  'fail-closed-contract-lookup.json',
  'fail-closed-contract-lookup.md',
  'result-schema-qa-fallback-review.json',
  'result-schema-qa-fallback-review.md',
  'monitoring-rollback-dry-run.json',
  'monitoring-rollback-dry-run.md',
  'duplicate-pr-review.json',
  'duplicate-pr-review.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval/',
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review/',
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan/`,
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/`,`${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]

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
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-reconciliation.md',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution.md',
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
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
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

function hasUrlLikeValue(value) {
  const normalized = String(value || '').toLowerCase()
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('signed://')
    || normalized.includes('signature=')
    || normalized.includes('signedurl')
    || normalized.includes('signed_url')
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  payloads: readJson(`${reportDir}/safe-fixture-payloads.json`),
  routing: readJson(`${reportDir}/deterministic-routing-dry-run.json`),
  gates: readJson(`${reportDir}/runtime-gate-dry-run-results.json`),
  contract: readJson(`${reportDir}/fail-closed-contract-lookup.json`),
  schemaQa: readJson(`${reportDir}/result-schema-qa-fallback-review.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-dry-run.json`),
  duplicate: readJson(`${reportDir}/duplicate-pr-review.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 831)?.state !== 'MERGED') {
  fail('missing_pr831_source')
}
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

if (reports.payloads.payloadCount !== 16) fail(`payload_count_drift:${reports.payloads.payloadCount}`)
sameArray((reports.payloads.payloads || []).map((entry) => entry.toolId), expectedTools, 'payload_tool_order')
if (reports.payloads.commonFields?.dryRunOnly !== true) fail('payload_common_dry_run_not_true')
if (reports.payloads.commonFields?.executionEnabled !== false) fail('payload_common_execution_not_false')
if (reports.payloads.commonFields?.resultSchemaVersion !== 'trackb-media-oss-tool-call-result.v1') {
  fail('payload_result_schema_drift')
}
for (const field of [
  'approvedSnapshotId',
  'editPlanId',
  'idempotencyKey',
  'creditReservationId',
  'privateInputArtifacts',
  'requestedRecipeId',
  'requiredQualityGateIds',
  'fallbackPolicyId',
]) {
  const hasField = field === 'idempotencyKey'
    ? (reports.payloads.payloads || []).every((entry) => Boolean(entry.idempotencyKey))
    : field === 'privateInputArtifacts'
      ? (reports.payloads.payloads || []).every((entry) => Array.isArray(entry.privateInputArtifacts) && entry.privateInputArtifacts.length > 0)
      : field === 'requiredQualityGateIds'
        ? Array.isArray(reports.payloads.requiredQualityGateIds) && reports.payloads.requiredQualityGateIds.length > 0
        : Boolean(reports.payloads.commonFields?.[field])
  if (!hasField) fail(`payload_missing_required_gate:${field}`)
}
for (const payload of reports.payloads.payloads || []) {
  for (const artifact of payload.privateInputArtifacts || []) {
    if (artifact.isPrivate !== true || artifact.sourceOfTruth !== true) {
      fail(`payload_artifact_not_private_source_truth:${payload.toolId}:${artifact.artifactId}`)
    }
    if (hasUrlLikeValue(artifact.storageObjectPath)) {
      fail(`payload_artifact_url_like:${payload.toolId}:${artifact.storageObjectPath}`)
    }
  }
}
for (const field of ['publicUrlsCreated', 'signedUrlsCreated', 'userMediaByDefault', 'realToolExecution']) {
  if (reports.payloads[field] !== false) fail(`payload_forbidden_scope_not_false:${field}:${reports.payloads[field]}`)
}

if (reports.routing.toolCount !== 16) fail('routing_tool_count_drift')
sameArray(reports.routing.rankingOrder, expectedTools, 'routing_ranking_order')
for (const requiredClass of [
  'source_introspection',
  'structured_metadata_analysis',
  'image_color_analysis',
  'image_processing_fallback',
  'video_frame_analysis',
  'ocr_text_analysis',
  'media_transform_high_risk',
]) {
  if (!Array.isArray(reports.routing.routingClasses?.[requiredClass])) {
    fail(`missing_routing_class:${requiredClass}`)
  }
}
if (reports.routing.useCasePolicy?.executionEnabledInThisPhase !== false) {
  fail('routing_execution_enabled')
}

for (const [field, value] of Object.entries(reports.gates.dryRunResults || {})) {
  if (value !== true) fail(`dry_run_gate_not_true:${field}:${value}`)
}
for (const [field, value] of Object.entries(reports.gates.executionState || {})) {
  if (field === 'dryRunOnly') {
    if (value !== true) fail(`dry_run_state_not_true:${field}:${value}`)
  } else if (value !== false) {
    fail(`dry_run_forbidden_execution_state:${field}:${value}`)
  }
}

if (reports.contract.toolContracts !== 16) fail('contract_tool_count_drift')
if (reports.contract.apiRoutes !== 3) fail('contract_route_count_drift')
if (reports.contract.currentContractStatus !== 'disabled_until_beta_gate') fail('contract_status_drift')
if (reports.contract.currentApiRouteStatus !== 'disabled') fail('api_route_status_drift')
if (reports.contract.requiredFailClosedCode !== 'trackb_media_oss_tool_calls_disabled_until_beta_gate') {
  fail('fail_closed_code_drift')
}
if (reports.contract.requiredStatusCode !== 423) fail('fail_closed_status_drift')
if (reports.contract.currentExecutionEnabled !== false) fail('contract_execution_enabled')

if (reports.schemaQa.resultSchemaVersion !== 'trackb-media-oss-tool-call-result.v1') {
  fail('schema_qa_version_drift')
}
for (const forbiddenField of ['signedUrl', 'publicUrl', 'rawPrompt', 'rawChat', 'providerPrompt']) {
  if (!reports.schemaQa.forbiddenResultFields?.includes(forbiddenField)) {
    fail(`missing_forbidden_result_field:${forbiddenField}`)
  }
}
if (reports.schemaQa.fallbackPolicy?.maxAttemptsBeforeUserReview !== 0) {
  fail('fallback_attempts_drift')
}
if (reports.schemaQa.qaGateLinkageAccepted !== true) fail('qa_gate_linkage_not_accepted')
if (reports.schemaQa.rawPromptPayloadForbidden !== true) fail('raw_prompt_payload_not_forbidden')

if (reports.monitoring.sanitizedLoggingOnly !== true) fail('monitoring_sanitized_logging_not_true')
if (reports.monitoring.monitoringEmittedToRuntime !== false) fail('monitoring_emitted_to_runtime')
if (reports.monitoring.rollbackAppliedToRuntime !== false) fail('rollback_applied_to_runtime')
for (const forbiddenField of ['rawPrompt', 'rawChat', 'privatePayload', 'signedUrl', 'publicUrl', 'storageObjectPath']) {
  if (!reports.monitoring.monitoringEventShape?.forbiddenFields?.includes(forbiddenField)) {
    fail(`monitoring_missing_forbidden_field:${forbiddenField}`)
  }
}

if (reports.duplicate.duplicateDryRunExecutionPrFound !== false) fail('duplicate_execution_pr_found')
if (reports.duplicate.duplicateDryRunQaPrFound !== false) fail('duplicate_qa_pr_found')
if (reports.duplicate.safeToOpenDryRunExecutionPr !== true) fail('safe_to_open_dry_run_pr_not_true')

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
if (reports.decisionReport.readyForRuntimeDryRunQaReview !== true) fail('decision_not_ready_for_qa')
for (const field of [
  'readyForDirectProductToolCalls',
  'readyForLiveBetaRuntime',
  'externalBetaReady',
  'productionReady',
  'productReady',
]) {
  if (reports.decisionReport[field] !== false) fail(`decision_forbidden_readiness:${field}:${reports.decisionReport[field]}`)
}
if (reports.readiness.readyForRuntimeDryRunQaReview !== true) fail('readiness_not_ready_for_qa')
if (reports.readiness.productReadyTools !== 0) fail('readiness_product_ready_drift')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-product-tool-call-runtime-dry-run-execution:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
if (!contractText.includes('TRACKB_MEDIA_OSS_TOOL_IDS')) fail('missing_tool_ids_contract')
if (!contractText.includes('TRACKB_MEDIA_OSS_TOOL_CALL_RANKING')) fail('missing_ranking_contract')
if (!contractText.includes('requiresApprovedSnapshotId: true')) fail('missing_snapshot_contract_gate')
if (!contractText.includes('requiresCreditReservationId: true')) fail('missing_credit_contract_gate')
if (!contractText.includes('requiresPrivateArtifactReferences: true')) fail('missing_private_artifact_contract_gate')
if (!contractText.includes('sanitizedLoggingOnly: true')) fail('missing_sanitized_logging_contract_gate')
if (!contractText.includes('executionEnabled: false')) fail('contract_execution_not_disabled')

const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
const disabledRouteCount = (routeText.match(/status: 'disabled'/g) || []).length
if (disabledRouteCount !== 3) fail(`disabled_route_count_drift:${disabledRouteCount}`)
if (routeText.includes("status: 'enabled'")) fail('route_enabled_found')

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_missing_token')
for (const phrase of [
  'safe fixture payloads',
  'approved snapshot',
  'credit reservation',
  'private artifact references',
  'deterministic routing',
  'fail-closed contract lookup',
  'sanitized logging',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
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
  console.error(`Track B product tool-call runtime dry-run execution diagnostics failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Track B product tool-call runtime dry-run execution diagnostics passed.')
