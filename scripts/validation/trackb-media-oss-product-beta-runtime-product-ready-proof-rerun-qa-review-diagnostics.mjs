#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review'
const executionDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution'
const decision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_qa_passed_ready_for_product_ready_closeout'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_execution_passed_ready_for_product_ready_proof_rerun_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_CLOSEOUT'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourcePr = 965
const sourceSha = 'faace5952c0b8e0d73b8e624c6ebe0f80ac2d0d3'
const sourceHead = '6ba1a330c6cab322de185f8490452c7dd12e1689'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}

const expectedUseCaseOrders = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}

const expectedTools = Array.from(new Set(Object.values(expectedUseCaseOrders).flat()))

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'route-harness-qa-acceptance.json',
  'route-harness-qa-acceptance.md',
  'use-case-ranking-qa.json',
  'use-case-ranking-qa.md',
  'approval-credit-idempotency-qa.json',
  'approval-credit-idempotency-qa.md',
  'dispatch-monitoring-rollback-qa.json',
  'dispatch-monitoring-rollback-qa.md',
  'privacy-supabase-gcs-qa.json',
  'privacy-supabase-gcs-qa.md',
  'product-ready-candidate-matrix.json',
  'product-ready-candidate-matrix.md',
  'runtime-boundary-qa.json',
  'runtime-boundary-qa.md',
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
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md',
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
  if (report.productReadyCandidateCount !== 16) {
    fail(`${label}_candidate_count_drift:${report.productReadyCandidateCount}`)
  }
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  route: readJson(`${reportDir}/route-harness-qa-acceptance.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-qa.json`),
  approval: readJson(`${reportDir}/approval-credit-idempotency-qa.json`),
  dispatch: readJson(`${reportDir}/dispatch-monitoring-rollback-qa.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-qa.json`),
  matrix: readJson(`${reportDir}/product-ready-candidate-matrix.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-qa.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const executionDecision = readJson(`${executionDir}/decision.json`)
const executionRanking = readJson(`${executionDir}/use-case-ranking-rerun-proof.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (executionDecision.decision !== previousDecision) {
  fail(`execution_decision_drift:${executionDecision.decision}`)
}
if (reports.source.acceptedSourceEvidence?.find((entry) => entry.pr === 965)?.state !== 'MERGED') {
  fail('missing_pr965_source_evidence')
}
if (reports.source.qaReviewRequired !== true) fail('qa_review_not_required')
if (reports.source.closeoutRequiredBeforeProductReadyCountMoves !== true) {
  fail('closeout_not_required_before_product_ready_count_moves')
}

if (reports.route.routeHarnessEvidenceAccepted !== true) fail('route_harness_not_accepted')
if (reports.route.sanitizedReceiptsAccepted !== true) fail('sanitized_receipts_not_accepted')
if (reports.route.liveProductCallsAccepted !== false) fail('live_product_calls_accepted')
if (reports.route.realRouteDispatchAccepted !== false) fail('real_route_dispatch_accepted')
for (const status of ['validated', 'queued_dry_run', 'status_dry_run']) {
  if (!reports.route.acceptedReceiptStatuses?.includes(status)) fail(`receipt_status_not_accepted:${status}`)
}

if (reports.ranking.deterministicRankingAccepted !== true) fail('ranking_not_accepted')
if (reports.ranking.coveredToolCount !== 16) fail('ranking_tool_count_drift')
for (const [useCase, expected] of Object.entries(expectedUseCaseOrders)) {
  const actual = reports.ranking.rankedToolCallUseCases?.[useCase]
  const executionActual = executionRanking.useCaseRanking?.[useCase]
  if (!actual) fail(`missing_use_case:${useCase}`)
  if (actual && actual.join('|') !== expected.join('|')) fail(`use_case_order_drift:${useCase}`)
  if (executionActual && executionActual.join('|') !== expected.join('|')) {
    fail(`execution_use_case_order_drift:${useCase}`)
  }
}

for (const field of [
  'approvedSnapshotGateAccepted',
  'editPlanGateAccepted',
  'creditReservationGateAccepted',
  'idempotencyGateAccepted',
  'privateArtifactMetadataGateAccepted',
  'qaGateAccepted',
  'fallbackPolicyGateAccepted',
  'noToolCallBeforeApprovalAccepted',
  'noCreditBypassAccepted',
]) {
  if (reports.approval[field] !== true) fail(`approval_${field}_not_true`)
}

for (const [field, expected] of Object.entries({
  workerDispatchGuardAccepted: true,
  unsupportedToolDispatchBlocked: true,
  allRankingEntriesExecutionDisabledUntilCloseout: true,
  monitoringReceiptsAccepted: true,
  rollbackControlsAccepted: true,
  rollbackState: 'armed_disabled_noop',
  workerDispatchEnabledInThisPhase: false,
  realToolExecutionEnabledInThisPhase: false,
})) {
  if (reports.dispatch[field] !== expected) fail(`dispatch_${field}_drift`)
}

for (const [field, expected] of Object.entries({
  privacyBoundaryAccepted: true,
  syntheticPrivateFixtureOnly: true,
  userMediaUsedByDefault: false,
  rawPromptAccepted: false,
  privatePayloadPersisted: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  supabaseWriteAttempted: false,
  gcsWriteAttempted: false,
  externalBetaExposed: false,
  productionExposed: false,
})) {
  if (reports.privacy[field] !== expected) fail(`privacy_${field}_drift`)
}

if (reports.matrix.productReadyCandidatesAcceptedForCloseout !== true) fail('matrix_candidates_not_accepted')
if (reports.matrix.productReadyCandidateCount !== 16) fail('matrix_candidate_count_drift')
if (reports.matrix.productReadyCountBeforeCloseout !== 0) fail('matrix_before_closeout_product_ready_drift')
if (reports.matrix.productReadyCountAfterThisQa !== 0) fail('matrix_after_qa_product_ready_drift')
for (const tool of expectedTools) {
  const row = reports.matrix.tools?.find((entry) => entry.toolId === tool)
  if (!row) fail(`missing_candidate_tool:${tool}`)
  if (row && row.candidateForProductReadyCloseout !== true) fail(`candidate_not_true:${tool}`)
  if (row && row.productReadyInThisPhase !== false) fail(`tool_product_ready_in_qa:${tool}`)
}

for (const [field, expected] of Object.entries({
  readyForProductReadyCloseout: true,
  readyForLiveProductCalls: false,
  readyForWorkerDispatch: false,
  readyForRealToolExecution: false,
  readyForExternalBeta: false,
  readyForProduction: false,
  productReadyUnlockApprovedInThisPhase: false,
  noFortyPlusEndToEndClaim: true,
})) {
  if (reports.boundary[field] !== expected) fail(`boundary_${field}_drift`)
}
if (reports.decisionReport.productReadyProofRerunQaPassed !== true) fail('decision_qa_not_passed')
if (reports.decisionReport.readyForProductReadyCloseout !== true) fail('decision_not_ready_for_closeout')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.readyForProductReadyCloseout !== true) fail('readiness_not_ready_for_closeout')
if (reports.readiness.readyForProductReadyStatus !== false) fail('readiness_product_ready_status_true')
if (reports.manifest.privateArtifactsCreated !== false) fail('private_artifacts_created')
if (reports.manifest.publicArtifactsCreated !== false) fail('public_artifacts_created')
if (reports.manifest.signedUrlsCreated !== false) fail('signed_urls_created')
if (reports.manifest.generatedMediaArtifactsCreated !== false) fail('media_artifacts_created')

const combinedText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-closeout.md'),
].join('\n')
for (const token of [decision, previousDecision, nextPrompt]) {
  if (!combinedText.includes(token)) fail(`missing_required_text:${token}`)
}
if (/40\\+ tools proven end-to-end|40\\+ tools end-to-end/i.test(combinedText)) {
  fail('forbidden_40_plus_claim')
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-proof-rerun-qa-review:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review-diagnostics.mjs'
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
  if (/(secret|signed-url|private-payload|service-role)/i.test(file) && !file.includes('docs/')) {
    fail(`suspicious_secret_path:${file}`)
  }
}

for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
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
  productReadyCandidateCount: 16,
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductReadyCloseout: true,
}, null, 2))
