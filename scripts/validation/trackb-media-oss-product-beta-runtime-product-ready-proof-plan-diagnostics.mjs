#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan'
const reviewDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-review'
const decision = 'trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution'
const previousDecision = 'trackb_media_oss_product_beta_runtime_product_ready_review_blocked_pending_live_product_runtime_proof'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_EXECUTION'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourceSha = 'd521ed20d8e4368cce7365f2678b2206c3affcb4'
const sourceHead = '81f2056a96d52515257146cb4a0a39016fc2223f'
const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'
const totals = { owned: 16, boundedAcceptedProven: 16, blockedNotInstalledProven: 0, productReady: 0 }
const requiredReports = [
  "source-of-truth-audit.json",
  "source-of-truth-audit.md",
  "proof-plan-overview.json",
  "proof-plan-overview.md",
  "use-case-tool-ranking-proof-matrix.json",
  "use-case-tool-ranking-proof-matrix.md",
  "route-worker-dispatch-proof-plan.json",
  "route-worker-dispatch-proof-plan.md",
  "approval-snapshot-credit-proof-plan.json",
  "approval-snapshot-credit-proof-plan.md",
  "monitoring-rollback-proof-plan.json",
  "monitoring-rollback-proof-plan.md",
  "privacy-supabase-gcs-boundary-plan.json",
  "privacy-supabase-gcs-boundary-plan.md",
  "runtime-boundary-review.json",
  "runtime-boundary-review.md",
  "decision.json",
  "decision.md",
  "readiness-report.json",
  "readiness-report.md",
  "private-artifact-manifest.json",
  "private-artifact-manifest.md",
  "validation-results.md"
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
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-review/',
  'scripts/validation/trackb-media-oss-',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-plan-diagnostics.mjs',
  ...statusDocs,
])
const protectedNoDiffFiles = ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile', 'docker/prod/cpu-worker/Dockerfile', 'docker/prod/cpu-worker/requirements.cpu.txt', 'docker/prod/ocr-runtime/Dockerfile', 'docker/prod/ocr-runtime/requirements.ocr.txt', 'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts', 'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts', 'src/backend/api/index.ts', 'src/backend/contracts/index.ts', 'supabase/config.toml']
const forbiddenOutputs = ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']
const failures = []
const fail = (message) => failures.push(message)
const fullPath = (relativePath) => path.join(repoRoot, relativePath)
function readText(relativePath) { const resolved = fullPath(relativePath); if (!fs.existsSync(resolved)) { fail('missing_file:' + relativePath); return '' }; return fs.readFileSync(resolved, 'utf8') }
function readJson(relativePath) { const text = readText(relativePath); if (!text) return {}; try { return JSON.parse(text) } catch (error) { fail('invalid_json:' + relativePath + ':' + error.message); return {} } }
function git(args, allowFailure = false) { try { return execFileSync('git', args, { cwd: repoRoot, env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }, encoding: 'utf8' }).trim() } catch (error) { if (allowFailure) return ''; throw error } }
function changedFiles() { return Array.from(new Set([...git(['diff', '--name-only'], true).split('\n').filter(Boolean), ...git(['diff', '--cached', '--name-only'], true).split('\n').filter(Boolean), ...git(['diff', '--name-only', baseRef + '...HEAD'], true).split('\n').filter(Boolean), ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean)])) }
function isAllowedChangedFile(file) { return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix)) }
function requireCommon(label, report) { if (report.ownerId !== ownerId) fail(label + '_owner_drift:' + report.ownerId); if (report.decision !== decision) fail(label + '_decision_drift:' + report.decision); if (report.previousDecision !== previousDecision) fail(label + '_previous_decision_drift:' + report.previousDecision); if (report.nextPrompt !== nextPrompt) fail(label + '_next_prompt_drift:' + report.nextPrompt); if (report.productReadyCount !== 0) fail(label + '_product_ready_count_drift:' + report.productReadyCount); if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(label + '_totals_drift') }
for (const file of requiredReports) readText(reportDir + '/' + file)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md')
const reports = { source: readJson(reportDir + '/source-of-truth-audit.json'), overview: readJson(reportDir + '/proof-plan-overview.json'), matrix: readJson(reportDir + '/use-case-tool-ranking-proof-matrix.json'), dispatch: readJson(reportDir + '/route-worker-dispatch-proof-plan.json'), approval: readJson(reportDir + '/approval-snapshot-credit-proof-plan.json'), monitoring: readJson(reportDir + '/monitoring-rollback-proof-plan.json'), privacy: readJson(reportDir + '/privacy-supabase-gcs-boundary-plan.json'), boundary: readJson(reportDir + '/runtime-boundary-review.json'), decisionReport: readJson(reportDir + '/decision.json'), readiness: readJson(reportDir + '/readiness-report.json') }
const manifest = readJson(reportDir + '/private-artifact-manifest.json')
const reviewDecision = readJson(reviewDir + '/decision.json')
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)
if (reports.source.sourceSha !== sourceSha) fail('source_sha_drift:' + reports.source.sourceSha)
if (reports.source.sourceHead !== sourceHead) fail('source_head_drift:' + reports.source.sourceHead)
if (reports.source.sourceEvidence?.find((entry) => entry.pr === 918)?.state !== 'MERGED') fail('missing_pr918_source_evidence')
if (reviewDecision.decision !== previousDecision) fail('review_decision_drift:' + reviewDecision.decision)
if (reports.overview.productReadyProofPlanCompleted !== true) fail('proof_plan_not_completed')
if (reports.overview.currentEvidenceSufficientForProductReady !== false) fail('current_evidence_unexpectedly_product_ready')
if (reports.overview.futureBoundedProofExecutionPlanned !== true) fail('future_execution_not_planned')
for (const [field, value] of Object.entries(reports.overview.requiredProofGates || {})) if (!String(value).length) fail('missing_required_gate:' + field)
if (!Array.isArray(reports.overview.futureExecutionRules?.allowedInNextGate) || reports.overview.futureExecutionRules.allowedInNextGate.length < 4) fail('allowed_next_gate_rules_missing')
if (!Array.isArray(reports.overview.futureExecutionRules?.forbiddenUntilSeparatelyApproved) || reports.overview.futureExecutionRules.forbiddenUntilSeparatelyApproved.length < 6) fail('forbidden_rules_missing')
const expectedOrders = { metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'], video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'], image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'], ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'], high_risk_media_transform: ['ffmpeg'] }
if (reports.matrix.coveredToolCount !== 16) fail('matrix_tool_count_drift')
if (reports.matrix.deterministicRankingPreserved !== true) fail('ranking_not_preserved')
if (reports.matrix.allToolsHaveFutureProofRequirement !== true) fail('missing_future_proof_requirements')
for (const [useCase, expected] of Object.entries(expectedOrders)) { const row = reports.matrix.useCaseMatrix?.find((entry) => entry.useCase === useCase); if (!row) fail('missing_use_case:' + useCase); if (row && row.order.join('|') !== expected.join('|')) fail('use_case_order_drift:' + useCase); if (row && !row.requiredProductProof) fail('missing_required_product_proof:' + useCase) }
for (const field of ['routeHarnessRequired', 'workerDispatchRequired', 'directScriptProofInsufficient']) if (reports.dispatch[field] !== true) fail('dispatch_' + field + '_not_true')
if (!Array.isArray(reports.dispatch.negativePathChecksRequired) || reports.dispatch.negativePathChecksRequired.length < 6) fail('dispatch_negative_paths_missing')
for (const field of ['approvedSnapshotGateRequired', 'editPlanGateRequired', 'creditGateRequired', 'approvalBeforeToolCallRequired', 'proofMustShowNoToolCallBeforeApproval']) if (reports.approval[field] !== true) fail('approval_' + field + '_not_true')
for (const field of ['sanitizedMonitoringRequired', 'rollbackDisableRequired', 'perToolDisableRequired', 'globalTrackBDisableRequired', 'proofMustShowDisabledToolsDoNotDispatch', 'monitoringMustNotIncludePrivatePayloads']) if (reports.monitoring[field] !== true) fail('monitoring_' + field + '_not_true')
for (const field of ['userMediaByDefaultBlocked', 'syntheticPrivateTempFixturesOnly', 'publicArtifactsBlocked', 'signedUrlsBlocked', 'supabaseGcsWritesBlocked', 'sqlMigrationsBlocked', 'secretPrintingBlocked']) if (reports.privacy[field] !== true) fail('privacy_' + field + '_not_true')
for (const [field, value] of Object.entries(reports.boundary.runtimeBoundary || {})) { if (field === 'nextGateBoundedProofExecutionPlanned') { if (value !== true) fail('next_gate_not_planned') } else if (value !== false) fail('runtime_boundary_unexpected_true:' + field) }
if (reports.decisionReport.productReadyProofPlanCompleted !== true) fail('decision_plan_not_completed')
if (reports.decisionReport.currentEvidenceSufficientForProductReady !== false) fail('decision_current_evidence_product_ready')
if (reports.decisionReport.readyForBoundedLiveProductRuntimeProofExecution !== true) fail('decision_not_ready_for_execution')
if (reports.readiness.readyForBoundedLiveProductRuntimeProofExecution !== true) fail('readiness_not_ready_for_execution')
if (reports.readiness.readyForProductReadyStatus !== false) fail('readiness_product_ready_true')
if (reports.readiness.productReadyCount !== 0) fail('readiness_product_ready_count_drift')
for (const field of ['privateArtifactsCreated', 'publicArtifactsCreated', 'signedUrlsCreated', 'mediaArtifactsCreated', 'runtimePayloadsCreated', 'secretsCommitted', 'generatedOutputsCreated']) if (manifest[field] !== false) fail('manifest_artifact_or_secret_created:' + field)
const packageJson = readJson('package.json')
if (packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-proof-plan:diagnostics'] !== 'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-plan-diagnostics.mjs') fail('package_script_missing_or_drifted')
for (const file of statusDocs) { const text = readText(file); if (!text.includes(decision)) fail('status_missing_decision:' + file); if (!text.includes(nextPrompt)) fail('status_missing_next_prompt:' + file); if (!text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) fail('status_missing_totals:' + file) }
const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_token')
if (!promptText.includes(decision)) fail('next_prompt_file_missing_decision')
if (!promptText.includes('0')) fail('next_prompt_missing_product_ready_boundary')
for (const file of changedFiles()) if (!isAllowedChangedFile(file)) fail('unexpected_changed_file:' + file)
for (const file of protectedNoDiffFiles) if (git(['diff', '--name-only', '--', file], true) || git(['diff', '--cached', '--name-only', '--', file], true)) fail('protected_file_changed:' + file)
for (const output of forbiddenOutputs) if (fs.existsSync(fullPath(output))) fail('generated_output_present:' + output)
const artifactFiles = git(['ls-files'], true).split('\n').filter((file) => /\.(mp4|mov|mkv|srt|ttf|otf|onnx|pdmodel|pdiparams|deb|gpg|asc)$/i.test(file))
for (const file of artifactFiles) fail('artifact_tracked:' + file)
for (const file of [...requiredReports.map((report) => reportDir + '/' + report), ...statusDocs, 'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-execution.md']) { const text = readText(file); if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) fail('secret_material:' + file); if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail('signed_url:' + file); if (/40\+ tools proven end-to-end/i.test(text)) fail('forbidden_40_plus_claim:' + file); if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) fail('forbidden_product_ready_positive_claim:' + file) }
if (failures.length) { console.error(JSON.stringify({ ok: false, failures }, null, 2)); process.exit(1) }
console.log(JSON.stringify({ ok: true, decision, previousDecision, nextPrompt, productReadyCount: 0, trackBTotals: totals, readyForBoundedLiveProductRuntimeProofExecution: true }, null, 2))
