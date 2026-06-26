#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-readiness-closeout'
const goNoGoReportDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-go-no-go-review'
const decision = 'trackb_media_oss_product_beta_readiness_closeout_passed_ready_for_product_beta_runtime_approval'
const previousDecision = 'trackb_media_oss_product_beta_go_no_go_passed_ready_for_product_beta_readiness_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_APPROVAL'
const sourceSha = 'b87cf35ba3c657fcac8d609e7a0f120bb5559eca'
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
  'product-beta-readiness-closeout.json',
  'product-beta-readiness-closeout.md',
  'tool-call-use-case-ranking-closeout.json',
  'tool-call-use-case-ranking-closeout.md',
  'runtime-boundary-closeout.json',
  'runtime-boundary-closeout.md',
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
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval/',
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
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'scripts/validation/trackb-media-oss-product-beta-readiness-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-product-beta-readiness-reconciliation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
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
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  closeout: readJson(`${reportDir}/product-beta-readiness-closeout.json`),
  ranking: readJson(`${reportDir}/tool-call-use-case-ranking-closeout.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-closeout.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
  priorGoNoGo: readJson(`${goNoGoReportDir}/decision.json`),
}

for (const [label, report] of Object.entries(reports)) {
  if (label === 'priorGoNoGo') continue
  requireOwnerDecision(label, report)
}

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 901)?.state !== 'MERGED') fail('missing_pr901_source')
if (reports.source.previousDecision !== previousDecision) fail(`source_previous_decision_drift:${reports.source.previousDecision}`)
if (reports.priorGoNoGo.decision !== previousDecision) fail(`prior_go_no_go_decision_drift:${reports.priorGoNoGo.decision}`)
if (reports.source.nextPrompt !== nextPrompt) fail(`source_next_prompt_drift:${reports.source.nextPrompt}`)
requireTotals('source', reports.source.trackBTotals)
requireTotals('closeout', reports.closeout.trackBTotals)
requireTotals('readiness', reports.readiness.trackBTotals)

for (const field of [
  'productBetaReadinessClosedOut',
  'goNoGoAccepted',
  'deterministicDryRunRankingClosed',
  'readyForProductBetaRuntimeApproval',
]) {
  if (reports.closeout[field] !== true) fail(`closeout_${field}_not_true`)
  if (reports.decisionReport[field] !== true) fail(`decision_${field}_not_true`)
}

for (const field of [
  'readyForLiveProductCalls',
  'readyForRouteDispatch',
  'readyForWorkerDispatch',
  'readyForRealToolExecution',
  'readyForExternalBeta',
  'readyForProduction',
  'productReady',
]) {
  if (reports.closeout[field] !== false) fail(`closeout_${field}_unexpected_true`)
}

for (const field of [
  'liveProductCallsApproved',
  'routeDispatchApproved',
  'workerDispatchApproved',
  'realToolExecutionApproved',
  'dockerOrInstallApproved',
  'mediaProcessingApproved',
  'supabaseGcsWritesApproved',
  'externalBetaApproved',
  'productionApproved',
  'productReadyStatusApproved',
]) {
  if (reports.runtime[field] !== false) fail(`runtime_${field}_unexpected_true`)
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
  const actual = reports.ranking[field]
  if (!Array.isArray(actual) || actual.join('|') !== expected.join('|')) fail(`ranking_order_drift:${field}:${actual}`)
}
if (reports.ranking.rankingEntryCount !== 16) fail(`ranking_entry_count_drift:${reports.ranking.rankingEntryCount}`)
if (reports.ranking.highRiskTransformDeferredTool !== 'ffmpeg') fail('ffmpeg_not_deferred')
if (reports.ranking.allRankingEntriesDryRunOnly !== true) fail('ranking_not_dry_run_only')
if (reports.ranking.allRankingEntriesExecutionDisabled !== true) fail('ranking_execution_enabled')

if (reports.manifest.privateArtifactCreated !== false) fail('private_artifact_created')
if (reports.manifest.publicArtifactCreated !== false) fail('public_artifact_created')
if (reports.manifest.signedUrlCreated !== false) fail('signed_url_created')
if (reports.manifest.mediaArtifactCreated !== false) fail('media_artifact_created')
if (reports.manifest.generatedOutputCreated !== false) fail('generated_output_created')

const allReportText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-approval.md'),
].join('\n')

for (const required of [
  decision,
  previousDecision,
  nextPrompt,
  '16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready',
  'no write / environment none / SQL none / migration no',
]) {
  if (!allReportText.includes(required)) fail(`missing_required_text:${required}`)
}
for (const line of allReportText.split('\n')) {
  const lower = line.toLowerCase()
  const explicitNegative =
    lower.includes('no ') ||
    lower.includes('not approve') ||
    lower.includes('blocked') ||
    lower.includes('disabled') ||
    lower.includes('remain fail-closed')
  for (const forbidden of [
    'product-ready local OSS tools: `16`',
    'product-ready local OSS tools remain `16`',
    'ready for production: yes',
    'external beta ready: yes',
    'direct product tool calls are approved',
    'live product calls are approved',
    'worker dispatch is approved',
    'Supabase write approved',
  ]) {
    if (!explicitNegative && lower.includes(forbidden.toLowerCase())) fail(`forbidden_claim:${forbidden}`)
  }
  if (line.includes('40+ tools') && !lower.includes('do not claim') && !lower.includes('no 40+')) {
    fail(`forbidden_40_plus_claim:${line.trim()}`)
  }
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
}
for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true) || git(['diff', '--cached', '--name-only', '--', file], true)) {
    fail(`protected_file_changed:${file}`)
  }
}

const suspiciousFiles = git(['ls-files'], true)
  .split('\n')
  .filter((file) => /\.(mp4|mov|mkv|srt|ttf|onnx|pdmodel|deb|gpg|asc)$/i.test(file))
for (const file of suspiciousFiles) fail(`artifact_tracked:${file}`)

for (const file of git(['ls-files'], true).split('\n').filter(Boolean)) {
  if (!file.startsWith('docs/') && !file.startsWith('scripts/') && file !== 'package.json') continue
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail(`signed_url:${file}`)
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
      nextPrompt,
      productBetaReadinessClosedOut: true,
      trackBTotals: totals,
      productReadyCount: 0,
    },
    null,
    2,
  ),
)
