#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout'
const decision =
  'trackb_media_oss_limited_internal_beta_dry_run_monitoring_closeout_passed_ready_for_limited_internal_beta_product_tool_call_runtime_approval'
const previousDecision =
  'trackb_media_oss_limited_internal_beta_dry_run_monitoring_qa_passed_ready_for_monitoring_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_PRODUCT_TOOL_CALL_RUNTIME_APPROVAL'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = '846b664e96105c9d2506aaea7154b73936fb9552'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const expectedRanking = [
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
  'tool-call-ranking-closeout.json',
  'tool-call-ranking-closeout.md',
  'monitoring-closeout.json',
  'monitoring-closeout.md',
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

const allowedChangedPrefixes = [`${reportDir}/`]

const allowedChangedFiles = new Set([
  'package.json',
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
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  ranking: readJson(`${reportDir}/tool-call-ranking-closeout.json`),
  monitoring: readJson(`${reportDir}/monitoring-closeout.json`),
  duplicate: readJson(`${reportDir}/duplicate-pr-review.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 817)?.decision !== previousDecision) {
  fail('missing_pr817_qa_source')
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 808)?.state !== 'MERGED') {
  fail('missing_pr808_monitoring_source')
}
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)

sameArray(reports.ranking.rankingOrder, expectedRanking, 'ranking_order')
if (reports.ranking.toolCount !== 16) fail('ranking_tool_count_drift')
if (reports.ranking.boundedAcceptedProvenTools !== 16) fail('ranking_accepted_count_drift')
if (reports.ranking.blockedNotInstalledProvenTools !== 0) fail('ranking_blocked_count_drift')
if (reports.ranking.productReadyTools !== 0) fail('ranking_product_ready_drift')
for (const [field, value] of Object.entries(reports.ranking.rankingPolicy || {})) {
  if (field === 'executionDisabledInThisPhase' && value !== true) fail('ranking_execution_disabled_not_true')
  if (field !== 'executionDisabledInThisPhase' && value !== true) fail(`ranking_policy_not_true:${field}`)
}
for (const requiredUseCase of [
  'media_metadata_probe',
  'structured_analysis',
  'image_preprocess_and_quality',
  'color_pipeline',
  'video_decode_scene_analysis',
  'ocr_ml_cpu',
  'media_transform_last_resort',
]) {
  if (!Array.isArray(reports.ranking.useCaseRouting?.[requiredUseCase])) {
    fail(`missing_use_case_routing:${requiredUseCase}`)
  }
}

if (reports.monitoring.monitoringSequenceClosed !== true) fail('monitoring_sequence_not_closed')
if (reports.monitoring.coveredToolCount !== 16) fail('monitoring_tool_count_drift')
if (reports.monitoring.readyForLimitedInternalBetaProductToolCallRuntimeApproval !== true) {
  fail('runtime_approval_readiness_not_true')
}

if (reports.duplicate.duplicateCloseoutPrFound !== false) fail('duplicate_closeout_pr_found')
if (reports.duplicate.duplicateRuntimeApprovalPrFound !== false) fail('duplicate_runtime_approval_pr_found')
if (reports.duplicate.safeToOpenCloseoutPr !== true) fail('safe_to_open_closeout_not_true')

for (const [label, value] of Object.entries({
  sourceDockerRun: reports.source.noOperationConfirmations?.dockerRun,
  sourceInstallRun: reports.source.noOperationConfirmations?.installRun,
  sourceToolExecutionRun: reports.source.noOperationConfirmations?.toolExecutionRun,
  sourceMediaProcessingRun: reports.source.noOperationConfirmations?.mediaProcessingRun,
  sourceRouteRuntimeEnabled: reports.source.noOperationConfirmations?.routeRuntimeEnabled,
  sourceWorkerDispatchEnabled: reports.source.noOperationConfirmations?.workerDispatchEnabled,
  sourceSupabaseWrite: reports.source.noOperationConfirmations?.supabaseWrite,
  sourceGcsWrite: reports.source.noOperationConfirmations?.gcsWrite,
  sourceExternalBetaEnabled: reports.source.noOperationConfirmations?.externalBetaEnabled,
  sourceProductionEnabled: reports.source.noOperationConfirmations?.productionEnabled,
  monitoringReadyForDirectProductToolCalls: reports.monitoring.readyForDirectProductToolCalls,
  monitoringReadyForLiveRouteRuntime: reports.monitoring.readyForLiveRouteRuntime,
  monitoringReadyForWorkerDispatch: reports.monitoring.readyForWorkerDispatch,
  monitoringExternalBetaReady: reports.monitoring.externalBetaReady,
  monitoringProductionReady: reports.monitoring.productionReady,
  runtimeApisChanged: reports.runtime.runtimeApisChanged,
  routeRuntimeEnabled: reports.runtime.routeRuntimeEnabled,
  workerDispatchEnabled: reports.runtime.workerDispatchEnabled,
  toolExecutionEnabled: reports.runtime.toolExecutionEnabled,
  dockerRun: reports.runtime.dockerRun,
  installRun: reports.runtime.installRun,
  mediaProcessingRun: reports.runtime.mediaProcessingRun,
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
  manifestSecretsPrinted: reports.manifest.secretsPrinted,
})) {
  if (value !== false) fail(`blocked_scope_not_false:${label}:${value}`)
}

if (reports.runtime.supabaseClassification?.updateRequired !== 'no write') fail('supabase_update_drift')
if (reports.runtime.supabaseClassification?.environmentTouched !== 'none') fail('supabase_env_drift')
if (reports.runtime.supabaseClassification?.sqlExecuted !== 'none') fail('supabase_sql_drift')
if (reports.runtime.supabaseClassification?.migrationDeployed !== 'no') fail('supabase_migration_drift')

if (reports.readiness.readyForLimitedInternalBetaProductToolCallRuntimeApproval !== true) {
  fail('readiness_runtime_approval_not_true')
}
if (reports.readiness.readyForDirectProductToolCalls !== false) fail('readiness_direct_calls_not_false')
if (reports.readiness.productReadyTools !== 0) fail('readiness_product_ready_drift')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.[
    'trackb-media-oss:limited-internal-beta-dry-run-monitoring-closeout:diagnostics'
  ] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_missing_token')
if (!promptText.includes('approved plan snapshots')) fail('next_prompt_missing_snapshot_gate')
if (!promptText.includes('credit/reservation gates')) fail('next_prompt_missing_credit_gate')
if (!promptText.includes('deterministic use-case routing')) fail('next_prompt_missing_routing_gate')

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
  if (!text.includes('0 product-ready') && !text.includes('"productReady": false') && !text.includes('"productReady": 0')) {
    fail(`status_missing_product_ready_zero:${file}`)
  }
}

const corpusFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
]
for (const file of corpusFiles) {
  const text = readText(file)
  for (const line of text.split('\n')) {
    const lowerLine = line.toLowerCase()
    const disclaimsClaim =
      lowerLine.includes('no 40+') ||
      lowerLine.includes('do not claim') ||
      lowerLine.includes('disallowed') ||
      lowerLine.includes('not claim')
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
  console.error(`Track B monitoring closeout diagnostics failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Track B limited internal beta dry-run monitoring closeout diagnostics passed.')
