#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-controlled-activation-execution'
const approvalDir = 'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-approval'
const decision =
  'trackb_media_oss_product_beta_runtime_controlled_activation_execution_passed_ready_for_controlled_activation_qa_review'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_approval_passed_ready_for_product_beta_runtime_controlled_activation_execution'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_CONTROLLED_ACTIVATION_QA_REVIEW'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const totals = {
  owned: 16,
  boundedAcceptedProven: 16,
  blockedNotInstalledProven: 0,
  productReady: 0,
}

const requiredReports = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'controlled-activation-artifact.json',
  'controlled-activation-artifact.md',
  'control-execution-results.json',
  'control-execution-results.md',
  'route-worker-control-proof.json',
  'route-worker-control-proof.md',
  'snapshot-credit-gate-proof.json',
  'snapshot-credit-gate-proof.md',
  'monitoring-rollback-record.json',
  'monitoring-rollback-record.md',
  'limited-exposure-boundary.json',
  'limited-exposure-boundary.md',
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
  'scripts/validation/trackb-media-oss-',
]
const allowedChangedFiles = new Set([
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-qa-review-diagnostics.mjs',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-closeout.md',
  'package.json',
  'src/backend/api/trackb-media-oss-product-route-enablement-harness.ts',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-execution-diagnostics.mjs',
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
  return Array.from(
    new Set([
      ...git(['diff', '--name-only', 'HEAD', '--'], true).split('\n').filter(Boolean),
      ...git(['diff', '--cached', '--name-only', '--'], true).split('\n').filter(Boolean),
      ...git(['ls-files', '--others', '--exclude-standard'], true).split('\n').filter(Boolean),
    ]),
  )
}

function isAllowedChangedFile(file) {
  return allowedChangedFiles.has(file) || allowedChangedPrefixes.some((prefix) => file.startsWith(prefix))
}

for (const report of requiredReports) readText(`${reportDir}/${report}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md')

const reports = {
  audit: readJson(`${reportDir}/source-of-truth-audit.json`),
  artifact: readJson(`${reportDir}/controlled-activation-artifact.json`),
  results: readJson(`${reportDir}/control-execution-results.json`),
  routeWorker: readJson(`${reportDir}/route-worker-control-proof.json`),
  snapshotCredit: readJson(`${reportDir}/snapshot-credit-gate-proof.json`),
  monitoring: readJson(`${reportDir}/monitoring-rollback-record.json`),
  exposure: readJson(`${reportDir}/limited-exposure-boundary.json`),
  boundary: readJson(`${reportDir}/runtime-boundary-review.json`),
  decision: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const approvalDecision = readJson(`${approvalDir}/decision.json`)

for (const [name, report] of Object.entries(reports)) {
  if (report.ownerId !== ownerId) fail(`${name}_owner_drift`)
  if (report.decision !== decision) fail(`${name}_decision_drift`)
  if (report.previousDecision !== previousDecision) fail(`${name}_previous_decision_drift`)
  if (report.nextPrompt !== nextPrompt) fail(`${name}_next_prompt_drift`)
  if (report.productReadyCount !== 0) fail(`${name}_product_ready_count_drift`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${name}_totals_drift`)
}

if (approvalDecision.decision !== previousDecision) fail('approval_input_decision_missing')
if (!reports.artifact.allToolsCovered || reports.artifact.coveredToolCount !== 16) fail('artifact_tool_coverage_drift')
if (reports.artifact.executionEnabled !== false) fail('artifact_execution_enabled')
if (reports.results.executedAsMetadataOnly !== true) fail('results_not_metadata_only')
if (reports.results.workerDispatchGuard !== 'allowlist_metadata_recorded_no_dispatch') fail('worker_guard_drift')
if (reports.routeWorker.routeDispatchEnabled !== false) fail('route_dispatch_enabled')
if (reports.routeWorker.workerDispatchEnabled !== false) fail('worker_dispatch_enabled')
if (reports.routeWorker.realToolExecutionEnabled !== false) fail('real_tool_execution_enabled')
if (reports.snapshotCredit.approvedSnapshotRequired !== true) fail('snapshot_gate_not_required')
if (reports.snapshotCredit.creditApprovalRequired !== true) fail('credit_gate_not_required')
if (reports.snapshotCredit.realBillingOrCreditMutationRun !== false) fail('credit_mutation_claimed')
if (reports.monitoring.rawPayloadLoggingAllowed !== false) fail('raw_payload_logging_allowed')
if (reports.exposure.externalBetaApproved !== false) fail('external_beta_approved')
if (reports.exposure.productionApproved !== false) fail('production_approved')
if (reports.boundary.productReadyApproved !== false) fail('product_ready_approved')
if (reports.readiness.readyForControlledActivationQaReview !== true) fail('not_ready_for_qa')
if (reports.readiness.readyForLiveProductCalls !== false) fail('live_product_calls_ready')
if (reports.readiness.readyForWorkerDispatchToRealTools !== false) fail('worker_dispatch_ready')
if (reports.manifest.privateArtifactsCreated !== false) fail('private_artifact_created')
if (reports.manifest.publicArtifactsCreated !== false) fail('public_artifact_created')
if (reports.manifest.signedUrlsCreated !== false) fail('signed_url_created')
if (reports.manifest.mediaArtifactsCreated !== false) fail('media_artifact_created')

const artifactText = JSON.stringify(reports.artifact)
for (const tool of [
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
]) {
  if (!artifactText.includes(tool)) fail(`ranking_missing_tool:${tool}`)
}

const packageJson = JSON.parse(readText('package.json'))
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-controlled-activation-execution:diagnostics']
    !== 'node scripts/validation/trackb-media-oss-product-beta-runtime-controlled-activation-execution-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
}

const promptText = readText(
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-controlled-activation-qa-review.md',
)
if (!promptText.includes(nextPrompt)) fail('next_prompt_token_missing')
if (!promptText.includes(decision)) fail('next_prompt_missing_decision')

for (const file of changedFiles()) {
  if (!isAllowedChangedFile(file)) fail(`unexpected_changed_file:${file}`)
}
for (const file of protectedNoDiffFiles) {
  if (git(['diff', '--name-only', '--', file], true) || git(['diff', '--cached', '--name-only', '--', file], true)) {
    fail(`protected_file_changed:${file}`)
  }
}
for (const output of forbiddenOutputs) {
  if (fs.existsSync(fullPath(output))) fail(`generated_output_present:${output}`)
}
const suspiciousFiles = git(['ls-files'], true)
  .split('\n')
  .filter((file) => /\.(mp4|mov|mkv|srt|ttf|onnx|pdmodel|deb|gpg|asc)$/i.test(file))
for (const file of suspiciousFiles) fail(`artifact_tracked:${file}`)

const changedOrTrackedDocs = changedFiles().filter(
  (file) => file && (file.startsWith('docs/') || file.startsWith('scripts/') || file === 'package.json'),
)
const changedClaimDocs = changedOrTrackedDocs.filter((file) => !file.startsWith('scripts/'))

for (const file of changedOrTrackedDocs) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (new RegExp('https://[^\\s)]+X-Goog-Signature=').test(text)) fail(`signed_url:${file}`)
}

for (const file of changedClaimDocs) {
  const lines = readText(file).split('\n')
  for (const line of lines) {
    const lower = line.toLowerCase()
    const explicitNegative =
      lower.includes('no ') ||
      lower.includes('not ') ||
      lower.includes('blocked') ||
      lower.includes('remain disabled') ||
      lower.includes('remains disabled') ||
      lower.includes('false') ||
      lower.includes('do not')
    for (const forbidden of [
      'product-ready local oss status is approved',
      'product ready local oss status is approved',
      'ready for production: yes',
      'external beta ready: yes',
      'live product calls are approved',
      'worker dispatch to real tools is approved',
      'real tool execution is approved',
      'Supabase write approved',
    ]) {
      if (!explicitNegative && lower.includes(forbidden.toLowerCase())) fail(`forbidden_claim:${forbidden}`)
    }
    if (line.includes('40+ tools') && !lower.includes('do not claim') && !lower.includes('no 40+')) {
      fail(`forbidden_40_plus_claim:${line.trim()}`)
    }
  }
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
      controlledActivationExecutionPassed: true,
      productReadyCount: 0,
      trackBTotals: totals,
    },
    null,
    2,
  ),
)
