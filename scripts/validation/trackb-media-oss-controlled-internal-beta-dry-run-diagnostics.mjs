#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-dry-run'
const decision =
  'trackb_media_oss_controlled_internal_beta_dry_run_passed_ready_for_internal_beta_fixture_gate_review'
const nextPrompt = 'TRACKB_MEDIA_OSS_INTERNAL_BETA_FIXTURE_GATE_REVIEW'
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
  'dry-run-fixture-payloads.json',
  'dry-run-fixture-payloads.md',
  'route-ranking-contract-validation.json',
  'route-ranking-contract-validation.md',
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
  'docs/open-source-tool-stack/trackb-media-oss-internal-beta-fixture-gate-review/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-controlled-internal-beta-fixture-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-go-no-go-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-activation/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-qa-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-testing/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-readiness-review/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-testing-handoff/',
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-product-tool-call-runtime-controlled-activation-closeout/',
]

const allowedChangedFiles = new Set([
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
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
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

function fixturePayload(toolId) {
  return {
    toolId,
    workspaceId: 'workspace_trackb_dry_run',
    projectId: 'project_trackb_dry_run',
    mediaAssetId: `media_asset_${toolId}`,
    approvedSnapshotId: 'approved_snapshot_trackb_dry_run',
    editPlanId: 'edit_plan_trackb_dry_run',
    idempotencyKey: `trackb-dry-run-${toolId}`,
    creditReservationId: 'credit_reservation_trackb_dry_run',
    privateInputArtifacts: [
      {
        artifactId: `artifact_${toolId}`,
        artifactType: 'source_media',
        storageBucketPurpose: 'private_source_media',
        storageObjectPath: `private/trackb/dry-run/${toolId}/source.asset`,
        checksum: `sha256:${toolId}`,
        sizeBytes: 1,
        isPrivate: true,
        sourceOfTruth: true,
      },
    ],
    requestedRecipeId: `recipe_${toolId}`,
    requiredQualityGateIds: [`qa_gate_${toolId}`],
    fallbackPolicyId: 'fallback_policy_trackb_dry_run',
    resultSchemaVersion: 'trackb-media-oss-tool-call-result.v1',
    dryRunOnly: true,
    executionEnabled: false,
    requestedAt: '2026-06-25T00:00:00.000Z',
    metadata: {
      dryRunFixture: true,
      rawPromptUsed: false,
    },
  }
}

function validatePayload(payload) {
  if (!trackBTools.includes(payload.toolId)) throw new Error(`unsupported_tool:${payload.toolId}`)
  for (const field of [
    'workspaceId',
    'projectId',
    'mediaAssetId',
    'approvedSnapshotId',
    'editPlanId',
    'idempotencyKey',
    'creditReservationId',
    'requestedRecipeId',
    'fallbackPolicyId',
  ]) {
    if (!payload[field]) throw new Error(`missing_${field}`)
  }
  if (payload.resultSchemaVersion !== 'trackb-media-oss-tool-call-result.v1') {
    throw new Error(`schema_drift:${payload.resultSchemaVersion}`)
  }
  if (payload.dryRunOnly !== true) throw new Error('dry_run_not_true')
  if (payload.executionEnabled !== false) throw new Error('execution_enabled_not_false')
  if (!Array.isArray(payload.privateInputArtifacts) || payload.privateInputArtifacts.length === 0) {
    throw new Error('missing_private_artifacts')
  }
  for (const artifact of payload.privateInputArtifacts) {
    if (artifact.isPrivate !== true || artifact.sourceOfTruth !== true) throw new Error('artifact_not_private_source_truth')
    if (!artifact.storageBucketPurpose || !artifact.storageObjectPath) throw new Error('artifact_missing_storage_ref')
    if (hasUrlLikeValue(artifact.storageObjectPath)) throw new Error('artifact_url_like_storage_path')
  }
  if (!Array.isArray(payload.requiredQualityGateIds) || payload.requiredQualityGateIds.length === 0) {
    throw new Error('missing_qa_gates')
  }
  const metadata = JSON.stringify(payload.metadata || {})
  if (/rawPrompt"\s*:\s*"/.test(metadata) || /rawChat"\s*:\s*"/.test(metadata) || metadata.includes('providerPrompt')) {
    throw new Error('raw_prompt_metadata')
  }
}

function expectBlocked(id, mutate) {
  const payload = fixturePayload('ffprobe')
  mutate(payload)
  try {
    validatePayload(payload)
    fail(`negative_case_not_blocked:${id}`)
    return false
  } catch {
    return true
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
for (const file of [
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md',
]) {
  readText(file)
}

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  payloads: readJson(`${reportDir}/dry-run-fixture-payloads.json`),
  routeRanking: readJson(`${reportDir}/route-ranking-contract-validation.json`),
  negative: readJson(`${reportDir}/fail-closed-negative-cases.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-review.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}

for (const [label, report] of Object.entries(reports)) requireDecision(label, report)

if (reports.source.sourceSha !== '87043e212109597e11e7dbd8599a146e4856cab6') {
  fail(`source_sha_drift:${reports.source.sourceSha}`)
}
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 776)?.state !== 'MERGED') {
  fail('missing_pr776_source_evidence')
}
if (reports.source.trackBTotals?.owned !== 16) fail('owned_total_drift')
if (reports.source.trackBTotals?.boundedAcceptedProven !== 16) fail('accepted_total_drift')
if (reports.source.trackBTotals?.blockedNotInstalledProven !== 0) fail('blocked_total_drift')
if (reports.source.trackBTotals?.productReady !== 0) fail('product_ready_total_drift')
if (reports.source.nextPrompt !== nextPrompt) fail('source_next_prompt_drift')

if (reports.payloads.payloadCount !== 16) fail('payload_count_drift')
sameSet(reports.payloads.toolIds, trackBTools, 'payload_tools')
for (const field of [
  'allValidFixturePayloadsAcceptedByDryRunValidator',
  'allPayloadsDryRunOnly',
  'allPayloadsExecutionDisabled',
  'allPayloadsUsePrivateSourceOfTruthArtifactRefs',
  'publicOrSignedUrlPayloadsRejected',
  'rawPromptPayloadsRejected',
  'executionEnabledPayloadsRejected',
  'missingApprovedSnapshotPayloadsRejected',
]) {
  if (reports.payloads[field] !== true) fail(`payload_report_field_not_true:${field}`)
}

for (const tool of trackBTools) {
  try {
    validatePayload(fixturePayload(tool))
  } catch (error) {
    fail(`valid_fixture_rejected:${tool}:${error.message}`)
  }
}

const negativeResults = [
  expectBlocked('missing_approved_snapshot', (payload) => { payload.approvedSnapshotId = '' }),
  expectBlocked('execution_enabled_true', (payload) => { payload.executionEnabled = true }),
  expectBlocked('signed_url_artifact_path', (payload) => {
    payload.privateInputArtifacts[0].storageObjectPath = 'https://example.invalid/private?signature=abc'
  }),
  expectBlocked('raw_prompt_metadata', (payload) => { payload.metadata = { rawPrompt: 'do the thing' } }),
]
if (negativeResults.some((result) => result !== true)) fail('negative_case_runtime_results_bad')
if (reports.negative.allNegativeCasesBlocked !== true) fail('negative_report_not_all_blocked')
for (const entry of reports.negative.negativeCases ?? []) {
  if (entry.blocked !== true) fail(`negative_report_case_not_blocked:${entry.id}`)
}

if (reports.routeRanking.routesRemainDisabled !== true) fail('routes_not_disabled')
if (reports.routeRanking.routesRemainBackendRequired !== true) fail('routes_not_backend_required')
if (reports.routeRanking.callableContractToolCount !== 16) fail('contract_tool_count_drift')
if (reports.routeRanking.rankingEntryCount !== 16) fail('ranking_entry_count_drift')
sameSet(reports.routeRanking.rankingSequence, expectedRanking, 'ranking_sequence')
if (JSON.stringify(reports.routeRanking.rankingSequence) !== JSON.stringify(expectedRanking)) {
  fail('ranking_sequence_not_expected_order')
}
if (reports.routeRanking.directRuntimeRoutesEnabled !== false) fail('direct_routes_enabled')
if (reports.routeRanking.workerDispatchEnabled !== false) fail('worker_dispatch_enabled')

for (const [field, value] of Object.entries(reports.runtime)) {
  if (field.endsWith('Accepted') && value !== false) fail(`runtime_scope_unblocked:${field}`)
}

if (reports.decisionReport.controlledDryRunPassed !== true) fail('decision_dry_run_not_passed')
if (reports.decisionReport.readyForInternalBetaFixtureGateReview !== true) fail('decision_not_ready_for_fixture_review')
if (reports.decisionReport.readyForLiveBetaRuntime !== false) fail('decision_live_beta_unblocked')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_unblocked')
if (reports.decisionReport.nextPrompt !== nextPrompt) fail('decision_next_prompt_drift')
if (reports.readiness.readyForInternalBetaFixtureGateReview !== true) fail('readiness_not_ready_for_fixture_review')
if (reports.readiness.readyForLiveBetaRuntime !== false) fail('readiness_live_beta_unblocked')
if (reports.readiness.productReady !== false) fail('readiness_product_ready_unblocked')

for (const [field, value] of Object.entries(reports.manifest)) {
  if (field.endsWith('Created') || field.endsWith('Committed') || field === 'gcsUploads' || field === 'supabaseWrites') {
    if (value !== false) fail(`manifest_scope_unblocked:${field}`)
  }
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:controlled-internal-beta-dry-run:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs'
) {
  fail('missing_package_script')
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
for (const token of [
  'TRACKB_MEDIA_OSS_TOOL_CALL_RANKING',
  'TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS',
  'assertTrackBMediaOssToolCallPayloadIsGated',
  'executionEnabled: false',
  'dryRunOnly',
]) {
  if (!contractText.includes(token)) fail(`contract_missing_token:${token}`)
}
for (const routeId of [
  'trackbMediaOss.toolCall.validate',
  'trackbMediaOss.toolCall.queue',
  'trackbMediaOss.toolCall.status',
]) {
  if (!routeText.includes(routeId)) fail(`route_missing:${routeId}`)
}
if (!routeText.includes("status: 'disabled'")) fail('route_source_not_disabled')

const allText = [
  contractText,
  routeText,
  ...requiredReports.map((file) => readText(`${reportDir}/${file}`)),
  ...statusDocs.map((file) => readText(file)),
  readText('docs/implementation-prompts/prompt-trackb-media-oss-internal-beta-fixture-gate-review.md'),
].join('\n')

const forbiddenClaims = [
  /\bready for direct tool calls\b/i,
  /\bdirect tool calls ready\b/i,
  /\blive beta runtime ready\b/i,
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
  payloadFixturesValidated: trackBTools.length,
  failures,
}

console.log(JSON.stringify(result, null, 2))
process.exit(failures.length === 0 ? 0 : 1)
