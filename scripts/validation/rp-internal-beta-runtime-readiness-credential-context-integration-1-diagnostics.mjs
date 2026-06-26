#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-READINESS-CREDENTIAL-CONTEXT-INTEGRATION-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-readiness-credential-context-integration.md`,
  `${packetDir}/component-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/runtime-readiness-credential-context-integration-record.json`,
  'docs/activation-phase-rp-internal-beta-runtime-readiness-credential-context-integration-1-results.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-credential-context-contract-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-credential-context-integration-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/confirmed-runner-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-results.md',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-supabase-target-credential-context-preflight-1-diagnostics.mjs',
  'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1/confirmed-runner-hardening.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1/confirmed-runner-credential-context-hardening-record.json',
  'docs/activation-phase-rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-results.md',
  'scripts/validation/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1-diagnostics.mjs',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/source-audit.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/orchestrator-integration.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/local-chain-evidence.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/validation-results.md',
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration/runtime-readiness-orchestrator-2-record.json',
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/local-readiness-gate-rollup.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/local-readiness-gate-rollup-record.json',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke.ts',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-e2e-chain-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_runtime_readiness_credential_context_integration_fail_closed',
  'completed_local_orchestrator_contract_integration_no_remote_execution',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_no_remote_execution_missing_safe_credential_context',
  'approved_supabase_credential_context_present',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'createInternalBetaSupabaseCredentialContextContract',
  'assertInternalBetaSupabaseCredentialContextFailClosed',
  'supabaseCredentialContext',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase command:\s*`?true/i,
  /Remote Supabase mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration apply:\s*`?true/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage object read:\s*`?true/i,
  /Service-role secret payload access:\s*`?true/i,
  /Frontend service-role credential exposure:\s*`?true/i,
  /service-role route execution:\s*`?(true|completed|enabled|passed)/i,
  /worker execution:\s*`?(true|completed|enabled|passed)/i,
  /worker dispatch:\s*`?(true|completed|enabled|passed)/i,
  /provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
  /render\/export execution:\s*`?(true|completed|enabled|passed)/i,
  /signed URL(?:s)? created:\s*`?(true|completed|enabled|passed)/i,
  /public artifact(?:s)? created:\s*`?(true|completed|enabled|passed)/i,
  /Package-lock:\s*`?changed/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'src/',
  'server/routes/',
  'server/workers/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const packetDocsCorpus = requiredFiles
  .filter((file) => file.startsWith(packetDir) || file === 'docs/activation-phase-rp-internal-beta-runtime-readiness-credential-context-integration-1-results.md')
  .map(read)
  .join('\n')

const allCorpus = requiredFiles.map(read).join('\n')

for (const text of requiredText) {
  if (!allCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (packetDocsCorpus.match(pattern)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-readiness-credential-context-integration-record.json`))
if (record.decision !== 'completed_runtime_readiness_credential_context_integration_fail_closed') fail('record decision mismatch')
if (record.execution !== 'completed_local_orchestrator_contract_integration_no_remote_execution') fail('record execution mismatch')
if (record.orchestratorStatus !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('orchestrator status mismatch')
if (record.credentialContextDecision !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  fail('credential context decision mismatch')
}
if (record.credentialContextExecution !== 'blocked_no_remote_execution_missing_safe_credential_context') {
  fail('credential context execution mismatch')
}
if (record.credentialContextRequiredBeforeEnablement !== true) fail('credential context gate flag mismatch')
if (!record.requiredBeforeEnablement?.includes('approved_supabase_credential_context_present')) {
  fail('missing credential context required-before-enablement gate')
}
if (record.componentCounts?.total !== 46) fail('total disabled operation count must be 46')
if (record.internalBetaEndToEndReady !== false) fail('internal beta readiness must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
for (const key of [
  'remoteSupabaseCommand',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'storageObjectRead',
  'serviceRoleSecretPayloadAccess',
  'frontendServiceRoleCredentialExposure',
  'serviceRoleRouteExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'modelCall',
  'secretPayloadAccess',
  'rawPromptExecution',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'renderExportExecution',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.packageLock !== 'unchanged') fail('package lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const orchestrator = read('server/services/internal-beta-runtime-readiness-orchestrator.ts')
for (const required of [
  'createInternalBetaSupabaseCredentialContextContract',
  'assertInternalBetaSupabaseCredentialContextFailClosed',
  'type InternalBetaSupabaseCredentialContextContract',
  'supabaseCredentialContext?: InternalBetaSupabaseCredentialContextContract',
  'supabaseCredentialContext: InternalBetaSupabaseCredentialContextContract',
  'approved_supabase_credential_context_present',
  'Supabase credential context decision:',
  'assertInternalBetaSupabaseCredentialContextFailClosed(report.supabaseCredentialContext)',
]) {
  if (!orchestrator.includes(required)) fail(`orchestrator missing ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(orchestrator)) fail(`orchestrator contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts')
for (const required of [
  'createInternalBetaSupabaseCredentialContextContract',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'blocked_no_remote_execution_missing_safe_credential_context',
  'approved_supabase_credential_context_present',
  'credentialPresence.supabaseAccessToken === false',
  'credentialPresence.readonlyDatabaseUrl === false',
  'must_not_appear',
]) {
  if (!smoke.includes(required)) fail(`smoke missing ${required}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /exec(File)?Sync\(/,
  /spawn\(/,
  /renderMedia\(/,
  /renderStill\(/,
  /bundle\(/,
]) {
  if (pattern.test(smoke)) fail(`smoke contains forbidden runtime signal ${pattern}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:internal-beta-runtime-readiness-orchestrator'] !== 'tsx server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts') {
  fail('missing runtime readiness smoke script')
}
if (packageJson.scripts?.['rp-internal-beta-runtime-readiness-credential-context-integration-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-runtime-readiness-credential-context-integration-1-diagnostics.mjs') {
  fail('missing credential context integration diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const blocked of ['supabase', 'database', 'docker', 'public', 'src', 'tests', 'server/routes', 'server/workers', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    /\.(sql|mp4|mov|mkv|webm|mp3|wav|png|jpg|jpeg|zip|gz|tar|tgz|env)$/.test(file)
  ) {
    fail(`forbidden changed file ${file}`)
  }
}

const claimScanFiles = changedFiles.filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')

if (claimScanFiles.length > 0) {
  const changedAdditions = execFileSync('git', ['diff', '--unified=0', 'HEAD', '--', ...claimScanFiles], {
    env: gitEnv,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n')

  for (const pattern of [
    /internal beta unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
    /external beta unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
    /production unlock(?:ed)?\s*[:=]\s*(true|enabled|passed|completed)/i,
    /Supabase mutation:\s*`?true/i,
    /SQL executed:(?!\s*`?none`?)/i,
    /service-role route execution:\s*`?(true|completed|enabled|passed)/i,
    /worker execution:\s*`?(true|completed|enabled|passed)/i,
    /provider\/model calls:\s*`?(true|completed|enabled|passed)/i,
    /render\/export execution:\s*`?(true|completed|enabled|passed)/i,
    /signed URL creation:\s*`?(true|completed|enabled|passed)/i,
    /public artifact creation:\s*`?(true|completed|enabled|passed)/i,
  ]) {
    if (pattern.test(changedAdditions)) fail(`forbidden changed-file claim matched ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
