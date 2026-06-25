#!/usr/bin/env node
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const decision = 'trackb_media_oss_callable_worker_contracts_passed_ready_for_tool_call_beta_readiness_rerun'
const nextPrompt = 'TRACKB_MEDIA_OSS_TOOL_CALL_BETA_READINESS_RERUN'
const reportDir = 'docs/open-source-tool-stack/trackb-media-oss-callable-worker-contracts-implementation'
const failures = []

function fail(message) {
  failures.push(message)
}

function readText(path) {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch (error) {
    fail(`missing_file:${path}`)
    return ''
  }
}

function readJson(path) {
  const text = readText(path)
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`invalid_json:${path}:${error.message}`)
    return {}
  }
}

const requiredFiles = [
  'source-of-truth-audit.json',
  'source-of-truth-audit.md',
  'api-route-contracts.json',
  'api-route-contracts.md',
  'worker-runtime-contracts.json',
  'worker-runtime-contracts.md',
  'payload-validation-review.json',
  'payload-validation-review.md',
  'approved-snapshot-credit-gate-review.json',
  'approved-snapshot-credit-gate-review.md',
  'private-artifact-result-schema-review.json',
  'private-artifact-result-schema-review.md',
  'qa-fallback-logging-review.json',
  'qa-fallback-logging-review.md',
  'runtime-boundary-review.json',
  'runtime-boundary-review.md',
  'beta-readiness-rerun-prep.json',
  'beta-readiness-rerun-prep.md',
  'decision.json',
  'decision.md',
  'readiness-report.json',
  'private-artifact-manifest.json',
  'validation-results.md',
]

for (const file of requiredFiles) readText(`${reportDir}/${file}`)

const jsonReports = requiredFiles
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file, readJson(`${reportDir}/${file}`)])

for (const [file, report] of jsonReports) {
  if (report.decision !== decision) fail(`decision_drift:${file}:${report.decision}`)
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
if (sourceAudit.nextPrompt !== nextPrompt) fail('source_audit_next_prompt_drift')
if (sourceAudit.trackBTotals?.owned !== 16 || sourceAudit.trackBTotals?.boundedAcceptedProven !== 16) {
  fail('trackb_totals_not_complete')
}
if (sourceAudit.trackBTotals?.productReady !== 0) fail('product_ready_count_not_zero')

const apiRoutes = readJson(`${reportDir}/api-route-contracts.json`)
if (apiRoutes.routesAdded?.length !== 3) fail('route_count_not_three')
for (const route of apiRoutes.routesAdded ?? []) {
  if (route.status !== 'disabled') fail(`route_not_disabled:${route.id}`)
  if (route.runtimeMode !== 'backend_required') fail(`route_not_backend_required:${route.id}`)
}
if (apiRoutes.directToolCallsReadyNow !== false) fail('api_routes_claim_direct_ready')

const workerContracts = readJson(`${reportDir}/worker-runtime-contracts.json`)
if (workerContracts.toolCount !== 16 || workerContracts.tools?.length !== 16) fail('worker_contract_tool_count_bad')
if (workerContracts.executionEnabled !== false || workerContracts.workerRuntimeApprovedNow !== false) {
  fail('worker_contract_runtime_unblocked')
}

const payload = readJson(`${reportDir}/payload-validation-review.json`)
if (payload.requiresPrivateArtifacts !== true) fail('payload_private_artifacts_not_required')
if (payload.rejectsPublicOrSignedUrls !== true) fail('payload_signed_urls_not_rejected')
if (payload.rejectsRawPromptPayloads !== true) fail('payload_raw_prompt_not_rejected')
if (payload.requiresExecutionDisabled !== true) fail('payload_execution_disabled_not_required')

const beta = readJson(`${reportDir}/beta-readiness-rerun-prep.json`)
if (beta.readyForBetaReadinessRerun !== true) fail('beta_rerun_not_ready')
if (beta.directToolCallsReadyNow !== false || beta.internalBetaReadyNow !== false || beta.productReadyNow !== false) {
  fail('beta_or_product_unblocked')
}
if (beta.nextPrompt !== nextPrompt) fail('beta_next_prompt_drift')

const readiness = readJson(`${reportDir}/readiness-report.json`)
if (readiness.readyForToolCallBetaReadinessRerun !== true) fail('readiness_rerun_not_ready')
if (readiness.readyForDirectToolCalls !== false || readiness.internalBetaReady !== false || readiness.productReady !== false) {
  fail('readiness_unblocked_direct_or_beta')
}

const packageJson = readJson('package.json')
if (packageJson.scripts?.['trackb-media-oss:callable-worker-contracts:diagnostics'] !==
  'node scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs') {
  fail('missing_callable_contracts_diagnostics_script')
}
if (packageJson.scripts?.['smoke:trackb-media-oss-callable-worker-contracts'] !==
  'tsx server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts') {
  fail('missing_callable_contracts_smoke_script')
}

const contractText = readText('src/backend/contracts/trackb-media-oss-tool-call-contracts.ts')
const routeText = readText('src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts')
const routeRegistryText = readText('src/backend/api/api-route-registry.ts')
const apiIndexText = readText('src/backend/api/index.ts')
const contractsIndexText = readText('src/backend/contracts/index.ts')
const smokeText = readText('server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts')
const promptText = readText('docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-rerun.md')

for (const tool of [
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
]) {
  if (!contractText.includes(`'${tool}'`)) fail(`missing_tool_contract:${tool}`)
}

for (const token of [
  'TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS',
  'assertTrackBMediaOssToolCallPayloadIsGated',
  'buildTrackBMediaOssFailClosedResponse',
  'executionEnabled: false',
  'dryRunOnly',
  'creditReservationId',
  'privateInputArtifacts',
  'requiredQualityGateIds',
  'trackb-media-oss-tool-call-result.v1',
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
if (!routeText.includes("status: 'disabled'")) fail('routes_not_disabled_in_source')
if (!routeRegistryText.includes('TRACKB_MEDIA_OSS_TOOL_CALL_API_ROUTES')) fail('route_registry_missing_trackb_routes')
if (!apiIndexText.includes('trackb-media-oss-tool-call-api-routes')) fail('api_index_missing_trackb_route_export')
if (!contractsIndexText.includes('trackb-media-oss-tool-call-contracts')) fail('contracts_index_missing_trackb_export')
if (!smokeText.includes('Execution-enabled payloads must fail closed')) fail('smoke_missing_fail_closed_assertion')
if (!promptText.includes(nextPrompt)) fail('missing_next_prompt_file_token')

for (const file of [
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
]) {
  const text = readText(file)
  if (!text.includes(decision)) fail(`status_doc_missing_decision:${file}`)
  if (!text.includes(nextPrompt)) fail(`status_doc_missing_next_prompt:${file}`)
}

const changedFiles = Array.from(new Set([
  ...execFileSync('git', ['diff', '--name-only', 'HEAD', '--'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
    .split('\n')
    .filter(Boolean),
  ...execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
    .split('\n')
    .filter(Boolean),
]))

const allowedChangedPrefixes = [
  'docs/open-source-tool-stack/trackb-media-oss-callable-worker-contracts-implementation/',
  'docs/open-source-tool-stack/trackb-media-oss-tool-call-beta-readiness-rerun/',
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
  'docs/open-source-tool-stack/trackb-media-oss-limited-internal-beta-dry-run-monitoring/',
  'docs/implementation-prompts/prompt-trackb-media-oss-tool-call-beta-readiness-rerun.md',
  'scripts/validation/trackb-media-oss-callable-worker-contracts-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-testing-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-readiness-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-testing-handoff-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-monitoring-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-dry-run-activation-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-limited-internal-beta-go-no-go-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-fixture-execution-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-internal-beta-fixture-gate-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-controlled-internal-beta-dry-run-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-rerun-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-final-rollup-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-milestone-4-color-image-pipeline-qa-review-diagnostics.mjs',
  'scripts/validation/trackb-media-oss-tool-call-beta-readiness-review-diagnostics.mjs',
  'server/smoke/trackb-media-oss-callable-worker-contracts-smoke.ts',
  'src/backend/contracts/trackb-media-oss-tool-call-contracts.ts',
  'src/backend/api/routes/trackb-media-oss-tool-call-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'src/backend/contracts/index.ts',
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
  'package.json',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.md',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.md',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-steward.json',
  'docs/open-source-tool-stack/owner-registry/trackb-media-oss-tool-status.json',
  'docs/open-source-tool-stack/owner-registry/open-source-tool-owner-registry.json',
]

for (const file of changedFiles) {
  if (!allowedChangedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))) {
    fail(`unexpected_changed_file:${file}`)
  }
}

for (const file of changedFiles) {
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

const combinedText = [
  contractText,
  routeText,
  smokeText,
  promptText,
  ...requiredFiles.map((file) => readText(`${reportDir}/${file}`)),
].join('\n')

for (const pattern of [
  /\bproduct-ready tools?:\s*[1-9]/i,
  /\b40\+ tools\b.*\b(end-to-end|product-ready|production-ready)\b/i,
  /\b(internal|external)\s+beta\s+(is\s+)?ready\s+now\b/i,
  /\bproduction\s+(is\s+)?ready\s+now\b/i,
  /signedUrl\s*:/,
  /publicUrl\s*:/,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_or_payload:${pattern}`)
}

if (failures.length > 0) {
  console.error('Track B media OSS callable worker contracts diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  nextPrompt,
  routeCount: apiRoutes.routesAdded?.length,
  toolCount: workerContracts.toolCount,
  changedFiles,
}, null, 2))
