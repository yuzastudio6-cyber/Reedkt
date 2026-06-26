#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..', '..')
const reportDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout'
const qaDir =
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-qa-review'
const decision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_closeout_passed_ready_for_product_ready_proof_rerun_plan'
const previousDecision =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_qa_passed_ready_for_product_route_enablement_closeout'
const nextPrompt = 'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_RERUN_PLAN'
const ownerId = 'TRACK_B_MEDIA_OSS_STEWARD'
const sourcePr = 945
const sourceSha = '34cbf88de1c8b87d55b1d38145c3913143d5d40f'
const sourceHead = '135481f576ef0ee055eb66f1327a79ce61fcee67'
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
  'qa-acceptance-closeout.json',
  'qa-acceptance-closeout.md',
  'route-runtime-boundary-closeout.json',
  'route-runtime-boundary-closeout.md',
  'product-ready-proof-rerun-readiness.json',
  'product-ready-proof-rerun-readiness.md',
  'privacy-supabase-gcs-closeout.json',
  'privacy-supabase-gcs-closeout.md',
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
  `${reportDir}/`,
  `${qaDir}/`,
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-execution/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-route-enablement-plan/',
  'docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan/',
  'scripts/validation/trackb-media-oss-',
]

const allowedChangedFiles = new Set([
  'package.json',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-route-enablement-closeout.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-execution.md',
  'scripts/validation/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan-diagnostics.mjs',
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
  if (report.previousDecision !== previousDecision) fail(`${label}_previous_decision_drift:${report.previousDecision}`)
  if (report.nextPrompt !== nextPrompt) fail(`${label}_next_prompt_drift:${report.nextPrompt}`)
  if (report.sourcePr !== sourcePr) fail(`${label}_source_pr_drift:${report.sourcePr}`)
  if (report.sourceSha !== sourceSha) fail(`${label}_source_sha_drift:${report.sourceSha}`)
  if (report.sourceHead !== sourceHead) fail(`${label}_source_head_drift:${report.sourceHead}`)
  if (report.productReadyCount !== 0) fail(`${label}_product_ready_count_drift:${report.productReadyCount}`)
  if (JSON.stringify(report.trackBTotals ?? {}) !== JSON.stringify(totals)) fail(`${label}_totals_drift`)
}

for (const file of requiredReports) readText(`${reportDir}/${file}`)
readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md')

const reports = {
  source: readJson(`${reportDir}/source-of-truth-audit.json`),
  qa: readJson(`${reportDir}/qa-acceptance-closeout.json`),
  boundary: readJson(`${reportDir}/route-runtime-boundary-closeout.json`),
  rerun: readJson(`${reportDir}/product-ready-proof-rerun-readiness.json`),
  privacy: readJson(`${reportDir}/privacy-supabase-gcs-closeout.json`),
  decisionReport: readJson(`${reportDir}/decision.json`),
  readiness: readJson(`${reportDir}/readiness-report.json`),
  manifest: readJson(`${reportDir}/private-artifact-manifest.json`),
}
const qaDecision = readJson(`${qaDir}/decision.json`)

for (const [label, report] of Object.entries(reports)) requireCommon(label, report)

if (qaDecision.decision !== previousDecision) fail(`qa_decision_drift:${qaDecision.decision}`)
if (qaDecision.readyForProductRouteEnablementCloseout !== true) fail('qa_not_ready_for_closeout')
if (reports.source.acceptedSourceEvidence?.find((entry) => entry.pr === sourcePr)?.state !== 'MERGED') {
  fail('missing_pr945_merged_source_evidence')
}
if (reports.source.productRouteEnablementSequenceReadyToClose !== true) fail('source_not_ready_to_close')
if (reports.qa.routeEnablementQaAccepted !== true) fail('qa_not_accepted')
if (reports.qa.sanitizedReceiptsAccepted !== true) fail('sanitized_receipts_not_accepted')
if (reports.qa.failClosedNegativePathsAccepted !== true) fail('fail_closed_paths_not_accepted')
if (reports.qa.deterministicUseCaseRankingAccepted !== true) fail('ranking_not_accepted')

for (const field of [
  'routeDefinitionsRemainDisabled',
  'routeDefinitionsRemainBackendRequired',
  'workerContractsRemainExecutionDisabled',
]) {
  if (reports.boundary[field] !== true) fail(`boundary_${field}_not_true`)
}
for (const field of [
  'liveProductCallsApproved',
  'directRouteDispatchApproved',
  'workerDispatchToRealToolsApproved',
  'realToolExecutionApproved',
  'productReadyApproved',
]) {
  if (reports.boundary[field] !== false) fail(`boundary_${field}_unexpected_true`)
}

if (reports.rerun.routeEnablementSequenceClosed !== true) fail('rerun_sequence_not_closed')
if (reports.rerun.readyForProductReadyProofRerunPlan !== true) fail('rerun_not_ready_for_plan')
if (reports.rerun.currentEvidenceSufficientForProductReady !== false) fail('rerun_current_evidence_product_ready')
if (reports.rerun.productReadyLocalOssCount !== 0) fail('rerun_product_ready_count_drift')

for (const [field, expected] of Object.entries({
  supabaseWriteAttempted: false,
  gcsWriteAttempted: false,
  serviceRoleUsed: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  privatePayloadPersisted: false,
  rawPromptAccepted: false,
  externalBetaExposed: false,
  productionExposed: false,
})) {
  if (reports.privacy[field] !== expected) fail(`privacy_${field}_drift`)
}

if (reports.decisionReport.routeEnablementCloseoutCompleted !== true) fail('decision_closeout_not_completed')
if (reports.decisionReport.readyForProductReadyProofRerunPlan !== true) fail('decision_not_ready_for_rerun_plan')
if (reports.decisionReport.productReady !== false) fail('decision_product_ready_true')
if (reports.readiness.routeEnablementSequenceClosed !== true) fail('readiness_sequence_not_closed')
if (reports.readiness.readyForProductReadyProofRerunPlan !== true) fail('readiness_not_ready_for_rerun_plan')
for (const field of [
  'readyForLiveProductCalls',
  'readyForWorkerDispatch',
  'readyForRealToolExecution',
  'readyForExternalBeta',
  'readyForProduction',
]) {
  if (reports.readiness[field] !== false) fail(`readiness_${field}_unexpected_true`)
}
for (const field of [
  'privateArtifactsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'mediaArtifactsCreated',
  'runtimePayloadsCreated',
  'secretsCommitted',
  'generatedOutputsCreated',
]) {
  if (reports.manifest[field] !== false) fail(`manifest_${field}_unexpected_true`)
}

const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
for (const routeId of ['trackbMediaOss.toolCall.validate', 'trackbMediaOss.toolCall.queue', 'trackbMediaOss.toolCall.status']) {
  const routeIndex = routeText.indexOf(`id: '${routeId}'`)
  if (routeIndex === -1) fail(`route_definition_missing:${routeId}`)
  const nextRoute = routeText.indexOf('  {', routeIndex + 1)
  const routeBlock = routeText.slice(routeIndex, nextRoute === -1 ? routeText.length : nextRoute)
  if (!routeBlock.includes("runtimeMode: 'backend_required'")) fail(`route_runtime_not_backend_required:${routeId}`)
  if (!routeBlock.includes("status: 'disabled'")) fail(`route_status_not_disabled:${routeId}`)
}
const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
if (!contractText.includes("status: 'disabled_until_beta_gate'")) fail('contracts_not_disabled_until_beta_gate')
if (!contractText.includes('executionEnabled: false')) fail('contracts_execution_not_disabled')

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['trackb-media-oss:product-beta-runtime-product-route-enablement-closeout:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-product-beta-runtime-product-route-enablement-closeout-diagnostics.mjs'
) {
  fail('package_script_missing_or_drifted')
}

for (const file of statusDocs) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_missing_next_prompt:${file}`)
  if (!text.includes('16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready')) {
    fail(`status_missing_totals:${file}`)
  }
}

const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md')
if (!promptText.includes(nextPrompt)) fail('next_prompt_file_missing_token')
if (!promptText.includes(decision)) fail('next_prompt_file_missing_decision')
if (!promptText.includes('0 blocked-not-installed-proven / 0 product-ready')) fail('next_prompt_missing_product_ready_boundary')

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
const artifactFiles = git(['ls-files'], true)
  .split('\n')
  .filter((file) => /\.(mp4|mov|mkv|srt|ttf|otf|onnx|pdmodel|pdiparams|deb|gpg|asc)$/i.test(file))
for (const file of artifactFiles) fail(`artifact_tracked:${file}`)

for (const file of [
  ...requiredReports.map((report) => `${reportDir}/${report}`),
  ...statusDocs,
  'docs/implementation-prompts/prompt-trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan.md',
]) {
  const text = readText(file)
  if (/\b(sk-[A-Za-z0-9_-]{30,}|Bearer\s+[A-Za-z0-9._~+/-]{30,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/i.test(text)) {
    fail(`secret_material:${file}`)
  }
  if (/https:\/\/[^\s)]+X-Goog-Signature=/.test(text)) fail(`signed_url:${file}`)
  if (/40\+ tools proven end-to-end/i.test(text)) fail(`forbidden_40_plus_claim:${file}`)
  if (/product-ready local OSS tools (?:are|remain) [1-9]/i.test(text)) {
    fail(`forbidden_product_ready_positive_claim:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  previousDecision,
  nextPrompt,
  sourcePr,
  sourceSha,
  productReadyCount: 0,
  trackBTotals: totals,
  readyForProductReadyProofRerunPlan: true,
}, null, 2))
