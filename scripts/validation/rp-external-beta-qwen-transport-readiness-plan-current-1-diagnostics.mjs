#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-READINESS-PLAN-CURRENT-1'
const packetDir = 'docs/external-beta/qwen-transport-readiness-plan-current-1'
const decision = 'completed_current_base_qwen_transport_readiness_plan_ready_for_confirmed_transport_runtime_preflight'
const execution = 'completed_docs_only_current_base_qwen_transport_readiness_plan_no_runtime_invocation'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/transport-readiness-plan.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-transport-readiness-plan-current-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-transport-readiness-plan-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/qwen-transport-dependency-attempt-result-review-current-record.json',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
  'server/config/qwen2-5-vl-external-beta-runtime-gate-contract.ts',
  'server/routes/provider-gateway-routes.ts',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/services/qwen2-5-vl-external-beta-backend-runtime-adapter.ts',
  'src/backend/api/routes/provider-api-routes.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/source-audit.md',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/runtime-preflight-result.md',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/artifact-manifest.md',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/runtime-boundary.md',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/validation-results.md',
  'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1/qwen-confirmed-transport-runtime-preflight-current-1-record.json',
  'docs/activation-phase-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-staging-api-route-deployment-alignment-1.md',
  'scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.mjs',
  'scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  '805bad1f3d5ad738ecb0204ebf696552a4364eca',
  'completed_current_base_qwen_transport_dependency_attempt_result_review_fail_closed_transport_readiness_planning_required',
  'completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_planning_required',
  'ready_for_confirmed_qwen_transport_runtime_preflight_current_1',
  'reeditpro-staging-api',
  'reeditpro-qwen2-5-vl-l4-worker',
  'reeditpro-staging-api-00006-6gw',
  'reeditpro-qwen2-5-vl-l4-worker-00037-658',
  'wmyyttnynmteqgcdishd',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  'POST /api/providers/qwen2-5-vl/structured-visual-metadata',
  'Idempotency-Key',
  'qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1',
  'REEDITPRO_CONFIRM_QWEN_TRANSPORT_RUNTIME_PREFLIGHT_CURRENT_1=true',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd',
  'REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only',
  'approved-snapshot://qwen-transport-runtime-preflight-current-1/structured-metadata-only',
  'credit-reservation://qwen-transport-runtime-preflight-current-1/no-spend',
  'queue-lease://qwen-transport-runtime-preflight-current-1/non-mutating-readiness',
  'manifest://qwen-transport-runtime-preflight-current-1/private-input',
  'manifest://qwen-transport-runtime-preflight-current-1/private-artifacts',
  'sha256:qwen-transport-runtime-preflight-current-1-private-artifacts',
  'credit_reservation_no_spend',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run service update:\s*`?(true|enabled|completed|passed)\b/i,
  /\bservice URL resolution for invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\baudience resolution for invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bauth header creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bbroad external beta audience unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"cloudRunInvocation"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"authHeaderCreated"\s*:\s*true/i,
  /"requestSent"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!config\/qwen2-5-vl-external-beta-runtime-gate-contract\.ts$)(?!routes\/provider-gateway-routes\.ts$)(?!services\/qwen2-5-vl-external-beta-product-route-handler-source\.ts$)(?!services\/qwen2-5-vl-external-beta-backend-runtime-adapter\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile$/,
  /^requirements/i,
  /^\.env/,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-transport-readiness-plan-current-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '805bad1f3d5ad738ecb0204ebf696552a4364eca') fail('integration base mismatch')
if (record.route?.routeId !== 'providers.qwen25Vl.structuredVisualMetadataPlan') fail('route id mismatch')
if (record.route?.method !== 'POST') fail('route method mismatch')
if (record.route?.path !== '/api/providers/qwen2-5-vl/structured-visual-metadata') fail('route path mismatch')
if (record.targetServices?.googleCloudProject !== 'reeditpro') fail('project mismatch')
if (record.targetServices?.region !== 'us-central1') fail('region mismatch')
if (record.targetServices?.stagingApiService !== 'reeditpro-staging-api') fail('staging service mismatch')
if (record.targetServices?.qwenWorkerService !== 'reeditpro-qwen2-5-vl-l4-worker') fail('worker service mismatch')
if (record.futureConfirmationGate?.confirmationEnv !== 'REEDITPRO_CONFIRM_QWEN_TRANSPORT_RUNTIME_PREFLIGHT_CURRENT_1') {
  fail('confirmation env mismatch')
}
if (record.futureConfirmationGate?.targetRefEnv !== 'REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd') {
  fail('target env mismatch')
}
if (record.guards?.timeoutSeconds !== 30) fail('timeout mismatch')
if (record.guards?.creditPolicy !== 'credit_reservation_no_spend') fail('credit policy mismatch')
if (record.readiness?.closedBlocker !== 'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_planning_required') {
  fail('closed blocker mismatch')
}
if (record.readiness?.status !== 'ready_for_confirmed_qwen_transport_runtime_preflight_current_1') fail('readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail('docsStatusDiagnosticsOnly must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const attemptReview = parseJson(
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/qwen-transport-dependency-attempt-result-review-current-record.json',
)
if (
  attemptReview.decision !==
  'completed_current_base_qwen_transport_dependency_attempt_result_review_fail_closed_transport_readiness_planning_required'
) {
  fail('attempt result review source drift')
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-transport-readiness-plan-current-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/ya29\.[A-Za-z0-9_-]+/.test(text)) fail(`Google OAuth token leaked in ${file}`)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (file.includes('qwen-confirmed-transport-runtime-preflight-current-1')) continue
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden changed-file claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
