#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-rerun'
const decision =
  'trackb_media_oss_tool_call_beta_readiness_rerun_passed_ready_for_controlled_internal_beta_dry_run'
const nextPrompt = 'TRACKB_MEDIA_OSS_CONTROLLED_INTERNAL_BETA_DRY_RUN'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const trackBTools = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'duckdb',
  'polars_nodejs_polars',
  'exiftool',
  'mediainfo',
  'tesseract',
  'imagemagick',
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddlepaddle',
  'paddleocr',
  'opencolorio',
  'openimageio',
]

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
  'callable-contracts-acceptance-review.json',
  'callable-contracts-acceptance-review.md',
  'tool-call-ranking-review.json',
  'tool-call-ranking-review.md',
  'route-worker-gate-review.json',
  'route-worker-gate-review.md',
  'controlled-dry-run-readiness-scorecard.json',
  'controlled-dry-run-readiness-scorecard.md',
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
  `docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval/`,
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-dry-run/',
  'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',
]

const allowedChangedFiles = new Set([
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-product-tool-call-runtime-control-plan.md',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-activation-approval-diagnostics.mjs',
  'package.json',
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
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-execution.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-qa-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-go-no-go-review.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-limited-internal-beta-dry-run-activation.md',
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
  'docker/prod/pro-color-image-runtime/Dockerfile',
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

function fail(message) {
  failures.push(message)
}

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath)
}

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

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  contracts: readJson(`${reportDir}/callable-contracts-acceptance-review.json`),
  ranking: readJson(`${reportDir}/tool-call-ranking-review.json`),
  routes: readJson(`${reportDir}/route-worker-gate-review.json`),
  scorecard: readJson(`${reportDir}/controlled-dry-run-readiness-scorecard.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== '583f05790d1be5b826da7d69cda52c94ef32a714') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 771)?.state !== 'MERGED') {
  fail('missing_pr771_source_evidence')
}
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')

if (reports.contracts.coveredToolCount !== 16) fail('contract_tool_count_drift')
if (reports.contracts.routesDisabled !== true) fail('routes_not_disabled')
if (reports.contracts.routesBackendRequired !== true) fail('routes_not_backend_required')
if (reports.contracts.directExecutionEnabled !== false) fail('direct_execution_enabled')
if (reports.contracts.runtimeWorkerDispatchEnabled !== false) fail('worker_dispatch_enabled')
if (reports.contracts.productRuntimeEnabled !== false) fail('product_runtime_enabled')

if (reports.ranking.rankingEntryCount !== 16) fail('ranking_entry_count_drift')
sameSet(reports.ranking.globalDryRunOrder, expectedRanking, 'ranking_order')
if (JSON.stringify(reports.ranking.globalDryRunOrder) !== JSON.stringify(expectedRanking)) {
  fail('ranking_order_not_expected_sequence')
}
if (reports.ranking.allRankingEntriesDryRunOnly !== true) fail('ranking_not_dry_run_only')
if (reports.ranking.allRankingEntriesExecutionDisabled !== true) fail('ranking_execution_enabled')
if (reports.ranking.highRiskTransformDeferredTool !== 'ffmpeg') fail('ffmpeg_not_deferred_transform')

if (reports.routes.routeIds?.length !== 3) fail('route_count_drift')
if (reports.routes.routeStatus !== 'disabled') fail('route_status_not_disabled')
if (reports.routes.workerRuntimeMode !== 'backend_required') fail('worker_runtime_not_backend_required')
if (reports.routes.frontendDirectCallAllowed !== false) fail('frontend_direct_call_allowed')
if (reports.routes.workerDispatchAllowedNow !== false) fail('worker_dispatch_allowed')
if (reports.routes.toolExecutionAllowedNow !== false) fail('tool_execution_allowed')

if (reports.scorecard.controlledDryRunPlanningReady !== true) fail('controlled_dry_run_not_ready')
if (reports.scorecard.directToolCallRuntimeReady !== false) fail('direct_runtime_unblocked')
if (reports.scorecard.internalBetaRuntimeReady !== false) fail('internal_beta_runtime_unblocked')
if (reports.scorecard.externalBetaReady !== false) fail('external_beta_unblocked')
if (reports.scorecard.productionReady !== false) fail('production_unblocked')
if (reports.scorecard.productReady !== false) fail('product_ready_unblocked')
if (reports.scorecard.nextPrompt !== nextPrompt) fail('scorecard_next_prompt_drift')

for (const [field, value] of Object.entries(reports.runtime)) {
  if (field.endsWith('Accepted') && value !== false) fail(`runtime_scope_unblocked:${field}`)
}

if (reports.decisionReport.readyForControlledDryRunPlanning !== true) fail('decision_dry_run_not_ready')
if (reports.decisionReport.readyForDirectRuntimeToolCalls !== false) fail('decision_direct_runtime_unblocked')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_unblocked')
if (reports.decisionReport.nextPrompt !== nextPrompt) fail('decision_next_prompt_drift')
if (reports.readiness.controlledDryRunPlanningReady !== true) fail('readiness_dry_run_not_ready')
if (reports.readiness.directToolCallRuntimeReady !== false) fail('readiness_direct_runtime_unblocked')
if (reports.readiness.internalBetaRuntimeReady !== false) fail('readiness_internal_beta_runtime_unblocked')
if (reports.readiness.productReady !== false) fail('readiness_product_ready_unblocked')

for (const [field, value] of Object.entries(reports.manifest)) {
  if (field.endsWith('Created') || field.endsWith('Committed') || field === 'gcsUploads' || field === 'supabaseWrites') {
    if (value !== false) fail(`manifest_scope_unblocked:${field}`)
  }
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:tool-call-beta-readiness-rerun:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
for (const tool of trackBTools) {
  if (!contractText.includes(`toolId: '${tool}'`) && !contractText.includes(`'${tool}'`)) {
    fail(`contract_missing_tool:${tool}`)
  }
}

for (const token of [
  'TRACKB_MEDIA_OSS_TOOL_CALL_RANKING',
  'getTrackBMediaOssToolCallRankingEntry',
  'betaDryRunOnly: true',
  'executionEnabled: false',
  'media_transform_high_risk',
  'source_introspection',
  'structured_metadata_analysis',
  'image_color_analysis',
  'ocr_text_analysis',
]) {
  if (!contractText.includes(token)) fail(`contract_missing_ranking_token:${token}`)
}

const rankMatches = Array.from(contractText.matchAll(/defaultRank:\s*(\d+)/g)).map((match) => Number(match[1]))
const expectedRanks = expectedRanking.map((_, index) => (index + 1) * 10)
if (JSON.stringify(rankMatches) !== JSON.stringify(expectedRanks)) {
  fail(`contract_rank_sequence_drift:${rankMatches.join(',')}`)
}

const rankingSection = contractText.slice(
  contractText.indexOf('TRACKB_MEDIA_OSS_TOOL_CALL_RANKING'),
  contractText.indexOf('export const TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS'),
)
for (const tool of expectedRanking) {
  const occurrences = (rankingSection.match(new RegExp(`toolId: '${tool}'`, 'g')) || []).length
  if (occurrences !== 1) fail(`ranking_tool_occurrence:${tool}:${occurrences}`)
}

const allText = [
  contractText,
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-dry-run.md'),
].join('\n')

const forbiddenClaims = [
  /\bready for direct tool calls\b/i,
  /\bdirect tool calls ready\b/i,
  /\binternal beta runtime ready\b/i,
  /\bexternal beta ready\b/i,
  /\bproduction ready\b/i,
  /\bproduct-ready local oss tools?:\s*[1-9]/i,
  /\b40\+ tools? (?:proven|ready|end-to-end)\b/i,
  /signedUrl\s*:/,
  /publicUrl\s*:/,
]
for (const pattern of forbiddenClaims) {
  if (pattern.test(allText)) fail(`forbidden_claim_or_payload:${pattern}`)
}

for (const protectedFile of protectedNoDiffFiles) {
  const diff = git(['diff', '--name-only', '--', protectedFile], true)
  const stagedDiff = git(['diff', '--cached', '--name-only', '--', protectedFile], true)
  if (diff || stagedDiff) fail(`protected_file_mutated:${protectedFile}`)
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
}

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
  if (
    file === 'package-lock.json' ||
    file.includes('Dockerfile') ||
    file === '.dockerignore' ||
    file.includes('supabase/') ||
    file.startsWith('dist') ||
    file.includes('node_modules') ||
    /\.(mp4|mov|mkv|srt|png|jpg|jpeg|webp|gpg|asc|deb)$/i.test(file)
  ) {
    fail(`forbidden_changed_file:${file}`)
  }
}

const result = {
  ok: failures.length === 0,
  decision,
  nextPrompt,
  failures,
}

console.log(JSON.stringify(result, null, 2))
process.exit(failures.length === 0 ? 0 : 1)
