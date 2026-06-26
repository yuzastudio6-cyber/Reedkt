#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-closeout'
const qaDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-qa-review'
const remediationPlanDir = 'docs/reeditpro-external-beta-production-readiness-remediation-plan'
const deploymentRollbackDir = 'docs/reeditpro-deployment-rollback-readiness-plan'
const modelSecurityCostDir = 'docs/reeditpro-model-license-security-cost-readiness-plan'
const privateStorageDir = 'docs/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan'
const decision =
  'trackb_media_oss_product_beta_runtime_product_ready_closeout_passed_all_16_tools_ready_for_ranked_tools_call_lane'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_qa_passed_ready_for_product_ready_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_TOOLS_CALL_LANE_READY_HANDOFF'
const totalsAfter = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 16,
}
const expectedTools = [
  'ffprobe',
  'mediainfo',
  'exiftool',
  'duckdb',
  'polars_nodejs_polars',
  'pyav',
  'opencv',
  'pyscenedetect',
  'sharp_libvips',
  'opencolorio',
  'openimageio',
  'imagemagick',
  'tesseract',
  'paddlepaddle',
  'paddleocr',
  'ffmpeg',
]
const expectedUseCaseRanking = {
  metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
  video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
  image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
  ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
  high_risk_media_transform: ['ffmpeg'],
}
const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'qa-packet-closeout-verification.json',
  'qa-packet-closeout-verification.md',
  'route-harness-closeout.json',
  'route-harness-closeout.md',
  'use-case-ranking-closeout.json',
  'use-case-ranking-closeout.md',
  'approval-credit-idempotency-closeout.json',
  'approval-credit-idempotency-closeout.md',
  'dispatch-monitoring-rollback-closeout.json',
  'dispatch-monitoring-rollback-closeout.md',
  'privacy-supabase-gcs-closeout.json',
  'privacy-supabase-gcs-closeout.md',
  'product-ready-registry-update.json',
  'product-ready-registry-update.md',
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
const remediationProductionDocs = [
  'docs/production-go-no-go-checklist.md',
  'docs/production-beta-readiness-scorecard.md',
  'docs/production-hardening-overview.md',
]
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
    ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
  ]))
}

function requireCommon(label, report) {
  if (report.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') fail(`${label}_owner_drift:${report.ownerId}`)
  if (report.decision !== decision) fail(`${label}_decision_drift:${report.decision}`)
  if (report.previousDecision !== previousDecision) {
    fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  }
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.productReadyCount !== 16) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotalsAfterCloseout ?? {}) !== JSON.stringify(totalsAfter)) {
    fail(`${label}_totals_after_drift`)
  }
  if (report.supabaseClassification !== 'no write / environment none / SQL none / migration no') {
    fail(`${label}_supabase_classification_drift:${report.supabaseClassification}`)
  }
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-tools-call-lane-ready-handoff.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  qa: readJson(`${reportDir}/qa-packet-closeout-verification.json`),
  route: readJson(`${reportDir}/route-harness-closeout.json`),
  ranking: readJson(`${reportDir}/use-case-ranking-closeout.json`),
  approval: readJson(`${reportDir}/approval-credit-idempotency-closeout.json`),
  dispatch: readJson(`${reportDir}/dispatch-monitoring-rollback-closeout.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-closeout.json`),
  registry: readJson(`${reportDir}/product-ready-registry-update.json`),
  runtime: readJson(`${reportDir}/runtime-boundary-closeout.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

const qaDecision = readJson(`${qaDir}/decision.json`)
const qaMatrix = readJson(`${qaDir}/product-ready-candidate-matrix.json`)
if (qaDecision.decision !== previousDecision) fail(`qa_decision_drift:${qaDecision.decision}`)
if (qaMatrix.productReadyCandidateCount !== 16) fail('qa_candidate_count_drift')
if (qaMatrix.productReadyCount !== 0) fail('qa_product_ready_count_before_closeout_drift')
if (reports.qa.productReadyCandidatesAcceptedForCloseout !== true) fail('qa_candidates_not_accepted')
if (reports.registry.registryProductReadyCountMoved !== true) fail('registry_count_not_moved')
if (reports.registry.productReadyCountAfterCloseout !== 16) fail('registry_closeout_count_not_16')
if (reports.decisionReport.all16ToolsReadyForRankedToolCallLane !== true) {
  fail('decision_not_ready_for_ranked_tool_call_lane')
}
if (reports.readiness.readyForRankedToolCalls !== true) fail('readiness_not_ready_for_ranked_tool_calls')
if (reports.readiness.readyForExternalBeta !== false) fail('external_beta_unblocked')
if (reports.readiness.readyForProduction !== false) fail('production_unblocked')
if (reports.runtime.readyForUnboundedRuntime !== false) fail('unbounded_runtime_unblocked')

const actualTools = reports.registry.productReadyTools?.map((entry) => entry.toolId) ?? []
if (actualTools.join('|') !== expectedTools.join('|')) fail('product_ready_tool_order_drift')
for (const tool of reports.registry.productReadyTools ?? []) {
  if (tool.productReadyForRankedToolCallLane !== true) fail(`tool_not_product_ready:${tool.toolId}`)
}
for (const [useCase, expected] of Object.entries(expectedUseCaseRanking)) {
  const actual = reports.ranking.useCaseRanking?.[useCase] ?? []
  if (actual.join('|') !== expected.join('|')) fail(`use_case_ranking_drift:${useCase}`)
}
for (const [flag, value] of Object.entries(reports.runtime.blockedScopes ?? {})) {
  if (value !== false) fail(`runtime_blocked_scope_not_false:${flag}`)
}
for (const flag of [
  'approvedSnapshotGatePassed',
  'editPlanGatePassed',
  'creditReservationGatePassed',
  'idempotencyGatePassed',
  'noToolCallBeforeApproval',
  'noCreditBypass',
]) {
  if (reports.approval[flag] !== true) fail(`approval_gate_not_true:${flag}`)
}
for (const flag of ['workerDispatchGuardPassed', 'monitoringReceiptsAccepted', 'rollbackControlsAccepted']) {
  if (reports.dispatch[flag] !== true) fail(`dispatch_monitoring_gate_not_true:${flag}`)
}
if (reports.privacy.supabaseGcsNoWriteAccepted !== true) fail('supabase_gcs_no_write_not_accepted')
if (reports.manifest.privateArtifactsCommitted !== false) fail('private_artifacts_committed')
if (reports.manifest.generatedOutputsCommitted !== false) fail('generated_outputs_committed')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-ready-closeout:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-closeout-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

const registry = readJson('docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json')
const steward = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json')
const status = readJson('docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json')
const owner = registry.owners?.find((entry) => entry.ownerId === 'TRACK_B_MEDIA_OSS_STEWARD') ?? {}
if (owner.endToEndProductReadyToolCount !== 16) fail('owner_registry_product_ready_count_drift')
if (steward.statusCounts?.endToEndProductReady !== 16) fail('steward_product_ready_count_drift')
if (status.counts?.endToEndProductReady !== 16) fail('tool_status_product_ready_count_drift')
if (owner.productReadyCloseout?.decision !== decision) fail('owner_missing_closeout_decision')
if (status.productReadyCloseout?.productReadyCount !== 16) fail('status_closeout_count_drift')

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (file.endsWith('.md') && !text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 16 product-ready')) {
    fail(`status_missing_closeout_totals:${file}`)
  }
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
}

for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true)) fail(`protected_file_mutated:${file}`)
  if (git(['diff', '--cached', '--name-only', '--', file], true)) fail(`protected_file_staged:${file}`)
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`forbidden_output_present:${output}`)
}
for (const file of changedFiles()) {
  const allowed =
    file === 'package.json' ||
	    file === 'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-tools-call-lane-ready-handoff.md' ||
	    file === 'docs/implementation-prompts/prompt-reeditpro-external-beta-production-readiness-remediation-plan.md' ||
	    file === 'docs/implementation-prompts/prompt-reeditpro-deployment-rollback-readiness-plan.md' ||
	    file === 'docs/implementation-prompts/prompt-reeditpro-model-license-security-cost-readiness-plan.md' ||
	    file === 'docs/implementation-prompts/prompt-reeditpro-private-storage-deletion-supabase-gcs-readiness-plan.md' ||
	    file === 'docs/implementation-prompts/prompt-reeditpro-observability-incident-support-readiness-plan.md' ||
	    file === 'scripts/validation/reeditpro-private-storage-deletion-supabase-gcs-readiness-plan-diagnostics.mjs' ||
	    file === 'scripts/validation/reeditpro-model-license-security-cost-readiness-plan-diagnostics.mjs' ||
	    file === 'scripts/validation/reeditpro-deployment-rollback-readiness-plan-diagnostics.mjs' ||
	    file === 'scripts/validation/reeditpro-external-beta-production-readiness-remediation-plan-diagnostics.mjs' ||
	    file === 'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-closeout-diagnostics.mjs' ||
	    file === 'scripts/validation/open-source-tool-owner-registry-trackb-media-oss-steward-diagnostics.mjs' ||
	    file.startsWith('docs/open-source-tool-stack/trackb-media-oss-external-beta-production-readiness-gap-review/') ||
	    file.startsWith(`${remediationPlanDir}/`) ||
	    file.startsWith(`${deploymentRollbackDir}/`) ||
	    file.startsWith(`${modelSecurityCostDir}/`) ||
	    file.startsWith(`${privateStorageDir}/`) ||
	    file.startsWith(`${reportDir}/`) ||
    remediationProductionDocs.includes(file) ||
    statusDocs.includes(file)
  if (!allowed && !file.startsWith('scripts/validation/trackb-media-oss-')) {
    fail(`unexpected_changed_file:${file}`)
  }
  if (/\.(ttf|otf|onnx|mp4|mov|mkv|srt|png|jpe?g|webp|gpg|asc|deb)$/i.test(file)) {
    fail(`forbidden_artifact_changed:${file}`)
  }
}

const scanFiles = [
  ...requiredReports.map((file) => `${reportDir}/${file}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-tools-call-lane-ready-handoff.md',
]
for (const file of scanFiles) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_-]{20,}|github_pat_|postgres(?:ql)?:\/\/|BEGIN [A-Z ]*PRIVATE KEY|X-Amz-Signature=)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (/https:\/\/[^\s)]+(?:X-Goog-Signature=|X-Amz-Signature=)/i.test(text)) fail(`signed_url:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, decision, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  previousDecision,
  nextPrompt,
  productReadyCount: 16,
  trackBTotals: totalsAfter,
  readyForRankedToolCalls: true,
  readyForExternalBeta: false,
  readyForProduction: false,
}, null, 2))
