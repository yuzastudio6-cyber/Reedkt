#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/provider-model-call-policy-closure-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/provider-runtime-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/policy-closure-record.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-rp-external-beta-provider-model-call-policy-closure-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qa-cleanup-observability-rollback-review-1.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-external-beta-provider-model-call-policy-closure-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const sourceEvidenceFiles = [
  'model-routing-policy.md',
  'provider-prompt-architecture.md',
  'pricing-and-credits.md',
  'approved-plan-snapshot-policy.md',
  'intent-led-edit-planning.md',
  'server/services/provider-gateway-service.ts',
  'src/backend/providers/gateway/provider-gateway-service.ts',
  'src/backend/services/generation-service.ts',
  'docs/internal-beta/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold/provider-runtime-boundary.md',
  'docs/internal-beta/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold/provider-scaffold-record.json',
]

const requiredText = [
  packet,
  'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls',
  'completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution',
  'Reeditpro` / `wmyyttnynmteqgcdishd` / `staging',
  'provider/model runtime as `disabled_by_default`',
  'Provider/model calls executed: `none`',
  'Model calls executed: `none`',
  'Secret payload access: `none`',
  'Provider secret payload access: `none`',
  'Raw prompt execution: `false`',
  'Frontend provider calls: `forbidden`',
  'Backend-only provider adapters: `required`',
  'approved snapshot',
  'credit reservation',
  'idempotency',
  'cost cap',
  'QA fallback',
  'server-side secret isolation',
  'RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1',
  'RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1',
  'RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD',
  'PR #577 remains open/draft/blocked and excluded',
  'fajinbvwhcjnutkaumkm` remains historical sandbox evidence only',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call',
  'RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /external product beta status:\s*`?(ready|approved|unlocked|passed)`?/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /providerModelCall"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /Provider\/model calls:\s*`?true/i,
  /Provider secret payload access:\s*`?(true|completed|accessed|passed)/i,
  /Raw prompt execution:\s*`?true/i,
  /Frontend provider calls:\s*`?(allowed|enabled|true)/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const allowedChanged = new Set(requiredFiles)
const blockedPathPrefixes = [
  'package-lock.json',
  'server/',
  'src/',
  'supabase/',
  'database/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of [...requiredFiles, ...sourceEvidenceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/policy-closure-record.json`))
if (record.decision !== 'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_provider_model_policy_closure_no_provider_or_model_execution') fail('record execution mismatch')
if (record.singleActiveSupabaseTarget?.projectRef !== 'wmyyttnynmteqgcdishd') fail('main Supabase target mismatch')
if (record.sourceChain?.pr577 !== 'open_draft_blocked_excluded') fail('PR #577 exclusion mismatch')
if (record.providerPolicy?.providerModelRuntime !== 'disabled_by_default') fail('provider runtime status mismatch')
if (record.providerPolicy?.providerModelCallsExecuted !== 'none') fail('provider call execution mismatch')
if (record.providerPolicy?.modelCallsExecuted !== 'none') fail('model call execution mismatch')
if (record.providerPolicy?.frontendProviderCalls !== 'forbidden') fail('frontend provider policy mismatch')
if (record.providerPolicy?.backendOnlyProviderAdapters !== 'required') fail('backend adapter policy mismatch')
for (const key of [
  'approvedSnapshotRequired',
  'creditReservationRequired',
  'idempotencyRequired',
  'costCapRequired',
  'qaFallbackPolicyRequired',
  'serverSideSecretIsolationRequired',
]) {
  if (record.providerPolicy?.[key] !== true) fail(`provider policy ${key} mismatch`)
}
for (const key of [
  'supabaseMutation',
  'sqlExecution',
  'secretManagerPayloadAccess',
  'providerSecretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'rawPromptExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'creditReservationCreation',
  'privateMediaProcessing',
  'userMediaProcessing',
  'remotionExecutionInThisPhase',
  'dockerExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record.safety?.[key] !== false) fail(`safety ${key} must be false`)
}
if (record.readiness?.externalProductBeta !== 'blocked_pending_qa_cleanup_observability_security_privacy_support_cost_deployment_review_after_provider_policy_closure') fail('external beta readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_qa_cleanup_observability_security_privacy_support_cost_deployment_after_provider_policy_closure') fail('rollup decision mismatch')
if (rollup.sourceClosure?.providerModelCallPolicyClosure !== 'rp_external_beta_provider_model_call_policy_closure_1') fail('rollup provider closure missing')
if (rollup.mainSupabaseTarget?.providerModelCallPolicyClosure !== 'completed_external_beta_provider_model_call_policy_closure_no_runtime_calls') fail('rollup provider status mismatch')
if (rollup.mainSupabaseTarget?.providerModelCallsExecuted !== 'none') fail('rollup provider execution mismatch')
if (rollup.mainSupabaseTarget?.frontendProviderCalls !== 'forbidden') fail('rollup frontend provider policy mismatch')
if (rollup.safety?.providerModelCall !== false) fail('rollup provider model call flag mismatch')
if (rollup.safety?.providerSecretPayloadAccess !== false) fail('rollup provider secret flag mismatch')
if (rollup.safety?.rawPromptExecution !== false) fail('rollup raw prompt flag mismatch')

const serverProviderGateway = read('server/services/provider-gateway-service.ts')
if (!serverProviderGateway.includes('assertRealProviderCallsDisabled')) fail('server provider disabled assert missing')
if (!serverProviderGateway.includes('REAL_PROVIDER_CALLS_DISABLED')) fail('server provider disabled error missing')
if (!serverProviderGateway.includes('Provider request validated but not executed.')) fail('server provider blocked attempt wording missing')

const backendProviderGateway = read('src/backend/providers/gateway/provider-gateway-service.ts')
if (!backendProviderGateway.includes("executionMode ?? 'mock_only'")) fail('backend provider default mock-only missing')
if (!backendProviderGateway.includes('Real provider calls are blocked in RP-GCP-03')) fail('backend provider blocked runtime wording missing')

const providerScaffold = JSON.parse(read('docs/internal-beta/rp-provider-01-internal-beta-disabled-provider-adapter-scaffold/provider-scaffold-record.json'))
if (providerScaffold.providerModelCalls !== false) fail('provider scaffold provider call flag mismatch')
if (providerScaffold.modelCall !== false) fail('provider scaffold model call flag mismatch')
if (providerScaffold.secretPayloadAccess !== false) fail('provider scaffold secret flag mismatch')
if (providerScaffold.rawPromptExecution !== false) fail('provider scaffold raw prompt flag mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-provider-model-call-policy-closure-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-provider-model-call-policy-closure-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPathPrefixes) {
    if (file === blockedPath || file.startsWith(blockedPath)) {
      if (
        !file.startsWith('scripts/validation/') &&
        file !== 'package.json'
      ) {
        fail(`blocked path changed: ${file}`)
      }
    }
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_provider_model_call_policy_closure_no_runtime_calls')
console.log('External product beta: blocked_pending_qa_cleanup_observability_security_privacy_support_cost_deployment_review_after_provider_policy_closure')
