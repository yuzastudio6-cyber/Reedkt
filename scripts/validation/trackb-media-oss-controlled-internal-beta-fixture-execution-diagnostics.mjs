#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-execution'
const decision =
  'trackb_media_oss_controlled_internal_beta_fixture_execution_passed_ready_for_internal_beta_fixture_qa_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_CONTROLLED_INTERNAL_BETA_FIXTURE_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'adae2badd12dbcbdef20f420b0684e0299482714'
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
  'fixture-execution-receipts.json',
  'fixture-execution-receipts.md',
  'ranking-execution-order.json',
  'ranking-execution-order.md',
  'gate-validation-results.json',
  'gate-validation-results.md',
  'fail-closed-negative-cases.json',
  'fail-closed-negative-cases.md',
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
  `${reportDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',
]

const allowedChangedFiles = new Set([
  'package.json',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-closeout-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-approval-diagnostics.mjs',
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
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
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

function sameArray(actual, expected, label) {
  if (JSON.stringify(actual || []) !== JSON.stringify(expected)) {
    fail(`${label}_drift:${JSON.stringify(actual || [])}`)
  }
}

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual || [])
  const expectedSet = new Set(expected)
  if (actualSet.size !== expectedSet.size) fail(`${label}_count:${actualSet.size}`)
  for (const item of expectedSet) if (!actualSet.has(item)) fail(`${label}_missing:${item}`)
  for (const item of actualSet) if (!expectedSet.has(item)) fail(`${label}_unexpected:${item}`)
}

function requireDecision(label, report) {
  if (report.decision !== decision) fail(`decision_drift:${label}:${report.decision}`)
  if (report.ownerId !== ownerId) fail(`owner_drift:${label}:${report.ownerId}`)
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

function hasUrlLikeValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('signed://')
    || normalized.includes('x-amz-signature=')
    || normalized.includes('x-goog-signature=')
    || normalized.includes('signature=')
    || normalized.includes('signedurl')
    || normalized.includes('signed_url')
}

function fixtureReceipt(toolId, rank) {
  return {
    toolId,
    rank,
    receiptId: `trackb-fixture-receipt-${String(rank).padStart(2, '0')}-${toolId}`,
    workspaceId: 'workspace_trackb_internal_fixture',
    projectId: 'project_trackb_internal_fixture',
    approvedSnapshotId: 'approved_snapshot_trackb_internal_fixture',
    editPlanId: 'edit_plan_trackb_internal_fixture',
    creditReservationId: 'credit_reservation_trackb_internal_fixture',
    idempotencyKey: `trackb-internal-fixture-${toolId}`,
    privateArtifact: {
      artifactId: `artifact_trackb_internal_fixture_${toolId}`,
      storageBucketPurpose: 'private_source_media',
      storageObjectPath: `private/trackb/internal-fixture/${toolId}/source.fixture`,
      isPrivate: true,
      sourceOfTruth: true,
    },
    qaGateIds: [`qa_gate_trackb_internal_fixture_${toolId}`],
    fallbackPolicyId: 'fallback_policy_trackb_internal_fixture',
    resultSchemaVersion: 'trackb-media-oss-tool-call-result.v1',
    sanitizedLogSummary: `${toolId} fixture receipt validated; no raw logs or private payloads emitted.`,
    outcome: 'fixture_receipt_validated',
  }
}

function validateFixtureReceipt(receipt) {
  if (!trackBTools.includes(receipt.toolId)) throw new Error(`unsupported_tool:${receipt.toolId}`)
  for (const field of [
    'receiptId',
    'workspaceId',
    'projectId',
    'approvedSnapshotId',
    'editPlanId',
    'creditReservationId',
    'idempotencyKey',
    'fallbackPolicyId',
  ]) {
    if (!receipt[field]) throw new Error(`missing_${field}`)
  }
  if (receipt.resultSchemaVersion !== 'trackb-media-oss-tool-call-result.v1') throw new Error('schema_drift')
  if (!Array.isArray(receipt.qaGateIds) || receipt.qaGateIds.length === 0) throw new Error('missing_qa_gate')
  if (receipt.privateArtifact?.isPrivate !== true || receipt.privateArtifact?.sourceOfTruth !== true) {
    throw new Error('artifact_not_private_source_truth')
  }
  if (!receipt.privateArtifact.storageObjectPath || hasUrlLikeValue(receipt.privateArtifact.storageObjectPath)) {
    throw new Error('artifact_storage_path_unsafe')
  }
  if (/rawPrompt|rawChat|providerPrompt|signedUrl|publicUrl/i.test(JSON.stringify(receipt))) {
    throw new Error('forbidden_receipt_payload_key')
  }
}

function expectBlocked(id, mutate) {
  const receipt = fixtureReceipt('ffprobe', 1)
  mutate(receipt)
  try {
    validateFixtureReceipt(receipt)
    fail(`negative_case_not_blocked:${id}`)
    return false
  } catch {
    return true
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-qa-review.md',
]) readText(file)

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  receipts: readJson(`${reportDir}/fixture-execution-receipts.json`),
  ranking: readJson(`${reportDir}/ranking-execution-order.json`),
  gates: readJson(`${reportDir}/gate-validation-results.json`),
  negative: readJson(`${reportDir}/fail-closed-negative-cases.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== sourceSha) fail(`source_sha_drift:${reports.source.sourceSha}`)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 781)?.state !== 'MERGED') fail('missing_pr781_source')
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail('source_next_prompt_drift')

if (reports.receipts.receiptCount !== 16) fail('receipt_count_drift')
sameSet(reports.receipts.toolIds, trackBTools, 'receipt_tools')
sameArray(reports.receipts.rankingOrder, expectedRanking, 'receipt_ranking_order')
for (const field of [
  'allReceiptsValidated',
  'allReceiptsUseApprovedSnapshot',
  'allReceiptsUseCreditReservation',
  'allReceiptsUsePrivateSourceOfTruthArtifacts',
  'allReceiptsUseQaGate',
  'allReceiptsUseFallbackPolicy',
  'allReceiptsUseSanitizedLogSummary',
]) {
  if (reports.receipts[field] !== true) fail(`receipt_field_not_true:${field}`)
}
if (reports.receipts.realToolsRan !== false) fail('real_tools_ran')
if (reports.receipts.userMediaUsed !== false) fail('user_media_used')
if (reports.receipts.publicArtifactsCreated !== false) fail('public_artifacts_created')

for (const [index, toolId] of expectedRanking.entries()) {
  try {
    validateFixtureReceipt(fixtureReceipt(toolId, index + 1))
  } catch (error) {
    fail(`fixture_receipt_rejected:${toolId}:${error.message}`)
  }
}

sameArray(reports.ranking.rankingOrder, expectedRanking, 'ranking_order')
if (reports.ranking.rankingEntryCount !== 16) fail('ranking_count_drift')
if (reports.ranking.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.ranking.ffmpegLast !== true) fail('ffmpeg_not_last')
if (reports.ranking.colorImagePairOrder !== 'opencolorio_before_openimageio') fail('color_image_pair_order_drift')

for (const field of [
  'approvedSnapshotGatePassed',
  'creditGatePassed',
  'privateArtifactGatePassed',
  'qaGatePassed',
  'fallbackGatePassed',
  'resultSchemaGatePassed',
  'sanitizedLoggingGatePassed',
  'rankingGatePassed',
]) {
  if (reports.gates[field] !== true) fail(`gate_not_passed:${field}`)
}
if (reports.gates.supabaseWritesRan !== false) fail('supabase_writes_ran')
if (reports.gates.gcsUploadsRan !== false) fail('gcs_uploads_ran')

const negativeResults = [
  expectBlocked('missing_approved_snapshot', (receipt) => { receipt.approvedSnapshotId = '' }),
  expectBlocked('missing_qa_gate', (receipt) => { receipt.qaGateIds = [] }),
  expectBlocked('public_or_signed_artifact_path', (receipt) => {
    receipt.privateArtifact.storageObjectPath = 'https://example.invalid/private?signature=abc'
  }),
  expectBlocked('raw_prompt_payload_key', (receipt) => { receipt.rawPrompt = 'do the thing' }),
]
if (negativeResults.some((result) => result !== true)) fail('negative_case_runtime_results_bad')
if (reports.negative.allNegativeCasesBlocked !== true) fail('negative_report_not_all_blocked')
for (const entry of reports.negative.negativeCases ?? []) {
  if (entry.blocked !== true) fail(`negative_report_case_not_blocked:${entry.id}`)
}

for (const [field, value] of Object.entries(reports.runtime)) {
  if (
    value !== false &&
    field !== 'schema' &&
    field !== 'generatedAt' &&
    field !== 'decision' &&
    field !== 'ownerId'
  ) {
    fail(`runtime_scope_unblocked:${field}`)
  }
}

if (reports.decisionReport.controlledFixtureReceiptsPassed !== true) fail('decision_fixture_receipts_not_passed')
if (reports.decisionReport.readyForInternalBetaFixtureQaReview !== true) fail('decision_not_ready_for_qa')
if (reports.decisionReport.readyForLiveBetaRuntime !== false) fail('decision_live_beta_unblocked')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_unblocked')
if (reports.decisionReport.nextPrompt !== nextPrompt) fail('decision_next_prompt_drift')
if (reports.readiness.readyForInternalBetaFixtureQaReview !== true) fail('readiness_not_ready_for_qa')
if (reports.readiness.readyForLiveBetaRuntime !== false) fail('readiness_live_beta_unblocked')
if (reports.readiness.productReady !== false) fail('readiness_product_ready_unblocked')

for (const [field, value] of Object.entries(reports.manifest)) {
  if (field.endsWith('Created') || field.endsWith('Committed') || field === 'gcsUploads' || field === 'supabaseWrites') {
    if (value !== false) fail(`manifest_scope_unblocked:${field}`)
  }
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:controlled-internal-beta-fixture-execution:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs'
) fail('missing_package_script')

const allText = [
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-controlled-internal-beta-fixture-qa-review.md'),
].join('\n')
for (const pattern of [
  /\bready for direct tool calls\b/i,
  /\blive beta runtime ready\b/i,
  /\bexternal beta ready\b/i,
  /\bproduction ready\b/i,
  /\bproduct-ready local oss tools?:\s*[1-9]/i,
  /\b40\+ tools? (?:proven|ready|end-to-end)\b/i,
  /signedUrl\s*:/,
  /publicUrl\s*:/,
  /\buser media used\b/i,
]) {
  if (pattern.test(allText)) fail(`forbidden_claim:${pattern}`)
}

for (const protectedFile of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', protectedFile], true) || git(['diff', '--cached', '--name-only', '--', protectedFile], true)) {
    fail(`protected_file_mutated:${protectedFile}`)
  }
}
for (const output of forbiddenOutputs) if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
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
  ) fail(`forbidden_changed_file:${file}`)
}

const result = {
  ok: failures.length === 0,
  decision,
  nextPrompt,
  receiptCount: trackBTools.length,
  failures,
}
console.log(JSON.stringify(result, null, 2))
process.exit(failures.length === 0 ? 0 : 1)
