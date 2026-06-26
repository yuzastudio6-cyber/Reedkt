#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review'
const decision =
  'trackb_media_oss_limited_internal_beta_dry_run_qa_passed_ready_for_limited_internal_beta_dry_run_testing'
const nextPrompt = 'TRACKB_MEDIA_OSS_LIMITED_INTERNAL_BETA_DRY_RUN_TESTING'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = '4ca5005c8861ff0d8f473b6673b73fd211fa4cf6'
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
  'qa-acceptance.json',
  'qa-acceptance.md',
  'ranking-qa.json',
  'ranking-qa.md',
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
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/`,
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review/',
]

const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md',
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
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-testing.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-readiness-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-testing-handoff.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-testing.md',
]) readText(file)

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  acceptance: readJson(`${reportDir}/qa-acceptance.json`),
  ranking: readJson(`${reportDir}/ranking-qa.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 792)?.state !== 'MERGED') fail('missing_pr792_source')
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail('source_next_prompt_drift')

for (const field of [
  'activationAccepted',
  'deterministicRankingAccepted',
  'failClosedContractsAccepted',
  'approvedSnapshotGateAccepted',
  'creditGateAccepted',
  'privateArtifactGateAccepted',
  'qaFallbackGateAccepted',
  'resultSchemaGateAccepted',
  'sanitizedLoggingGateAccepted',
  'readyForLimitedInternalBetaDryRunTesting',
]) {
  if (reports.acceptance[field] !== true) fail(`${field}_not_true`)
}
if (reports.acceptance.coveredToolCount !== 16) fail('covered_tool_count_drift')
if (reports.acceptance.boundedAcceptedProvenCount !== 16) fail('bounded_count_drift')

for (const [label, value] of Object.entries({
  directProductToolCallsReady: reports.acceptance.directProductToolCallsReady,
  liveRouteRuntimeReady: reports.acceptance.liveRouteRuntimeReady,
  workerDispatchReady: reports.acceptance.workerDispatchReady,
  externalBetaReady: reports.acceptance.externalBetaReady,
  productionReady: reports.acceptance.productionReady,
  productReady: reports.acceptance.productReady,
  runtimeApisChanged: reports.runtime.runtimeApisChanged,
  routeRuntimeEnabled: reports.runtime.routeRuntimeEnabled,
  workerDispatchEnabled: reports.runtime.workerDispatchEnabled,
  toolExecutionEnabled: reports.runtime.toolExecutionEnabled,
  dockerRun: reports.runtime.dockerRun,
  installRun: reports.runtime.installRun,
  mediaProcessingRun: reports.runtime.mediaProcessingRun,
  supabaseGcsTouched: reports.runtime.supabaseGcsTouched,
  publicArtifactsCreated: reports.runtime.publicArtifactsCreated,
  signedUrlsCreated: reports.runtime.signedUrlsCreated,
  manifestPrivateArtifactsCommitted: reports.manifest.privateArtifactsCommitted,
  manifestPublicArtifactsCreated: reports.manifest.publicArtifactsCreated,
  manifestSignedUrlsCreated: reports.manifest.signedUrlsCreated,
  manifestUserMediaUsed: reports.manifest.userMediaUsed,
  manifestSupabaseGcsTouched: reports.manifest.supabaseGcsTouched,
  readinessDirectProductToolCalls: reports.readiness.readyForDirectProductToolCalls,
  readinessExternalBeta: reports.readiness.readyForExternalBeta,
  readinessProduction: reports.readiness.readyForProduction,
  readinessProductReady: reports.readiness.productReady,
})) {
  if (value !== false) fail(`${label}_must_be_false`)
}

sameArray(reports.ranking.rankingOrder, expectedRanking, 'report_ranking_order')
if (reports.ranking.rankingAccepted !== true) fail('ranking_not_accepted')
if (reports.ranking.allEntriesDryRunOnly !== true) fail('ranking_dry_run_not_true')
if (reports.ranking.allEntriesExecutionDisabled !== true) fail('ranking_execution_disabled_not_true')

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
const rankingBlock = contractText.split('TRACKB_MEDIA_OSS_TOOL_CALL_RANKING')[1]?.split('] as const')[0] || ''
const contractRanking = Array.from(rankingBlock.matchAll(/toolId: '([^']+)'/g)).map((match) => match[1])
sameArray(contractRanking, expectedRanking, 'contract_ranking_order')
if (!contractText.includes('betaDryRunOnly: true')) fail('contract_missing_beta_dry_run_only')
if (!contractText.includes('executionEnabled: false')) fail('contract_missing_execution_disabled')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:limited-internal-beta-dry-run-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs'
) fail('missing_package_script')

const combinedText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-testing.md'),
].join('\n')

for (const forbidden of [
  'external beta ready',
  'production ready',
  'product-ready tools: 16',
  'direct product tool calls ready',
  '40+ tools proven end-to-end',
]) {
  if (combinedText.toLowerCase().includes(forbidden)) fail(`forbidden_claim:${forbidden}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file) && !file.startsWith('scripts/validation/trackb-media-oss-')) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true) || git(['diff', '--cached', '--name-only', '--', file], true)) {
    fail(`protected_file_changed:${file}`)
  }
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

const result = {
  ok: failures.length === 0,
  decision,
  nextPrompt,
  readyForLimitedInternalBetaDryRunTesting: reports.acceptance.readyForLimitedInternalBetaDryRunTesting === true,
  productReady: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exit(1)
