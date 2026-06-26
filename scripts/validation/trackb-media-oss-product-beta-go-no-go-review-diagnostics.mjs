#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review'
const reconciliationReportDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-reconciliation'
const decision = 'trackb_media_oss_product_beta_go_no_go_passed_ready_for_product_beta_readiness_closeout'
const previousDecision =
  'trackb_media_oss_product_beta_readiness_reconciliation_passed_ready_for_product_beta_go_no_go_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_READINESS_CLOSEOUT'
const sourceSha = '0e367aad50ecab99e4ebbd5873883f3c858876fd'
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
  'product-beta-go-no-go-review.json',
  'product-beta-go-no-go-review.md',
  'tool-call-use-case-ranking-acceptance.json',
  'tool-call-use-case-ranking-acceptance.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval/',
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution/',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-execution-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-approval-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-execution.md',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-cpu-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-limited-internal-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-activation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution-diagnostics.mjs',
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
  return [
    ...git(['diff', '--name-only'], true).split('\n'),
    ...git(['diff', '--cached', '--name-only'], true).split('\n'),
    ...git(['diff', '--name-only', `${baseRef}...HEAD`], true).split('\n'),
    ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n'),
  ].filter(Boolean)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function requireOwnerDecision(label, report) {
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
}

function requireTotals(label, reportTotals) {
  for (const [field, expected] of Object.entries(totals)) {
    if (reportTotals?.[field] !== expected) fail(`${label}_total_drift:${field}:${reportTotals?.[field]}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  goNoGo: readJson(`${reportDir}/product-beta-go-no-go-review.json`),
  ranking: readJson(`${reportDir}/tool-call-use-case-ranking-acceptance.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  priorReconciliation: readJson(`${reconciliationReportDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'priorReconciliation') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 896)?.state !== 'MERGED') fail('missing_pr896_source')
if (reports.source.previousDecision !== previousDecision) fail(`source_previous_decision_drift:${reports.source.previousDecision}`)
if (reports.priorReconciliation.decision !== previousDecision) {
  fail(`prior_reconciliation_decision_drift:${reports.priorReconciliation.decision}`)
}
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)
requireTotals('source', reports.source.trackBTotals)
requireTotals('go_no_go', reports.goNoGo.trackBTotals)
requireTotals('readiness', reports.readiness.trackBTotals)

for (const field of [
  'productBetaGoNoGoReviewed',
  'reconciliationAccepted',
  'rankingAccepted',
  'goForProductBetaReadinessCloseout',
  'readyForProductBetaReadinessCloseout',
]) {
  if (reports.goNoGo[field] !== true) fail(`go_no_go_${field}_not_true`)
  if (reports.decisionReport[field] !== true) fail(`decision_${field}_not_true`)
}

for (const field of [
  'goForLiveProductCalls',
  'goForRouteDispatch',
  'goForWorkerDispatch',
  'goForRealToolExecution',
  'goForExternalBeta',
  'goForProduction',
  'goForProductReadyStatus',
]) {
  if (reports.goNoGo[field] !== false) fail(`go_no_go_${field}_unexpected_true`)
  if (reports.decisionReport[field] !== false) fail(`decision_${field}_unexpected_true`)
}

const expectedOrders = {
  globalDryRunOrder: [
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
  ],
  colorImageOrder: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocrOrder: ['tesseract', 'paddlepaddle', 'paddleocr'],
  videoAnalysisOrder: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  metadataAnalysisOrder: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
}
for (const [field, expected] of Object.entries(expectedOrders)) {
  if (JSON.stringify(reports.ranking[field]) !== JSON.stringify(expected)) fail(`ranking_drift:${field}`)
}
if (reports.ranking.rankingEntryCount !== 16) fail('ranking_entry_count_drift')
if (reports.ranking.rankingAcceptedForGoNoGo !== true) fail('ranking_not_accepted')
if (reports.ranking.allRankingEntriesDryRunOnly !== true) fail('ranking_not_dry_run_only')
if (reports.ranking.allRankingEntriesExecutionDisabled !== true) fail('ranking_execution_enabled')
if (reports.ranking.highRiskTransformDeferredTool !== 'ffmpeg') fail('ranking_ffmpeg_deferred_drift')

for (const [field, value] of Object.entries(reports.runtime.blockedScopes || {})) {
  if (value !== true) fail(`runtime_blocked_scope_missing:${field}`)
}
for (const [field, value] of Object.entries(reports.runtime.enabledScopes || {})) {
  if (value !== false) fail(`runtime_enabled_scope_unexpected_true:${field}`)
}
if (reports.runtime.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
  fail(`supabase_classification_drift:${reports.runtime.supabaseClassification}`)
}
if (reports.runtime.productReadyLocalOssCount !== 0) fail('runtime_product_ready_drift')

if (reports.readiness.readyForProductBetaReadinessCloseout !== true) fail('readiness_not_ready_for_closeout')
if (reports.readiness.readyForDirectProductToolCalls !== false) fail('readiness_direct_calls_true')
if (reports.readiness.readyForLiveBetaRuntime !== false) fail('readiness_live_beta_true')
if (reports.readiness.readyForExternalBeta !== false) fail('readiness_external_beta_true')
if (reports.readiness.readyForProduction !== false) fail('readiness_production_true')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_drift')

for (const field of [
  'privateArtifactsCommitted',
  'publicArtifactsCommitted',
  'signedUrlsCommitted',
  'secretsCommitted',
  'mediaArtifactsCommitted',
  'dockerOutputsCommitted',
  'rawPromptsCommitted',
]) {
  if (reports.manifest[field] !== false) fail(`manifest_${field}_unexpected_true`)
}

const statusText = statusDocs.map((file) => readText(file)).join('\n')
if (!statusText.includes(decision)) fail('status_docs_missing_decision')
if (!statusText.includes(nextPrompt)) fail('status_docs_missing_next_prompt')
if (!statusText.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
  fail('status_docs_missing_totals')
}

const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_prompt')
if (!promptText.includes(decision)) fail('next_prompt_missing_decision')
if (!promptText.includes('Do not')) fail('next_prompt_missing_scope_boundary')
if (!promptText.includes('0 product-ready')) fail('next_prompt_missing_product_ready_boundary')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-go-no-go-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

const changed = changedFiles()
for (const file of changed) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (changed.includes(file)) fail(`protected_file_changed:${file}`)
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}

for (const file of [
  ...requiredReports.map((name) => `${reportDir}/${name}`),
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-readiness-closeout.md',
  ...statusDocs,
]) {
  const text = readText(file)
  for (const line of text.split('\n')) {
    const normalizedLine = line.toLowerCase()
    if (
      line.includes('40+ tools') &&
      !normalizedLine.includes('do not claim') &&
      !normalizedLine.includes('no 40+')
    ) {
      fail(`forbidden_40_plus_claim:${file}:${line.trim()}`)
    }
  }
  if (/sk-[A-Za-z0-9_-]{20,}/.test(text)) fail(`secret_like_token:${file}`)
  if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail(`signed_url:${file}`)
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      nextPrompt,
      productBetaGoNoGoReviewed: true,
      trackBTotals: totals,
      productReadyCount: 0,
    },
    null,
    2
  )
)
