#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-2-LOCAL-E2E-CHAIN-INTEGRATION'
const packetDir = 'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/orchestrator-integration.md`,
  `${packetDir}/local-chain-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/runtime-readiness-orchestrator-2-record.json`,
  'docs/activation-phase-rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration.md',
]

const touchedStatusFiles = [
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/local-readiness-gate-rollup.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/local-readiness-gate-rollup-record.json',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const codeFiles = [
  'server/services/internal-beta-runtime-readiness-orchestrator.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-smoke.ts',
  'server/smoke/internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke.ts',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-e2e-chain-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-readiness-credential-context-integration-1-diagnostics.mjs',
  'package.json',
]

const requiredFiles = [...packetFiles, ...touchedStatusFiles, ...codeFiles]
const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_internal_beta_runtime_readiness_orchestrator_local_e2e_chain_integration_fail_closed',
  'completed_local_orchestrator_e2e_chain_integration_no_remote_execution',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'private_artifact_access_runtime',
  'Internal beta end-to-end ready: `false`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
  'No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenPacketClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase mutation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage (?:write|read|object creation|object read):\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Worker dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'supabase/',
  'database/',
  'docker/',
  'public/',
  'src/',
  'tests/',
  '.github/workflows/',
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

const docsCorpus = [...packetFiles, ...touchedStatusFiles].map(read).join('\n')
const packetCorpus = packetFiles.map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPacketClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-readiness-orchestrator-2-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'completed_internal_beta_runtime_readiness_orchestrator_local_e2e_chain_integration_fail_closed') {
  fail('record decision mismatch')
}
if (record.execution !== 'completed_local_orchestrator_e2e_chain_integration_no_remote_execution') fail('record execution mismatch')
if (record.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') fail('record status mismatch')
if (record.baseIntegrationHead !== '66cd4941c10c468d4e10d38e745717e4bd0615bc') fail('base integration head mismatch')
if (record.localE2EChainStatus !== 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime') {
  fail('local E2E chain status mismatch')
}
if (record.localE2EChainLocalOnly !== true) fail('local E2E chain must remain local-only')
if (record.localE2EChainPersistedToSupabase !== false) fail('local E2E chain must not persist to Supabase')
if (record.localEvidenceCounts?.localE2EChainSmoke !== 1 || record.localEvidenceCounts?.total !== 1) {
  fail('local evidence count mismatch')
}
if (record.componentCounts?.totalDisabledOperations !== 46) fail('total disabled operation count mismatch')
if (record.internalBetaEndToEndReady !== false) fail('internal beta readiness must remain false')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must remain not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validationStatus !== 'full_validation_passed') fail('validation status mismatch')
if (record.nextMilestone !== 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN') {
  fail('next milestone mismatch')
}

for (const key of [
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
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

const service = read('server/services/internal-beta-runtime-readiness-orchestrator.ts')
for (const token of [
  'createInternalBetaLocalE2EChainSmoke',
  'localEvidenceCounts: InternalBetaRuntimeReadinessLocalEvidenceCounts',
  'localE2EChainSmoke: InternalBetaRuntimeReadinessLocalE2EChainSummary',
  'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'internal_beta_runtime_readiness_orchestrator_2_local_e2e_chain_integration',
  'localEvidenceCounts: {',
  'localE2EChainSmoke: {',
  'private_artifact_access_runtime',
  'blocked_pending_supabase_target_validation_and_runtime_enablement',
  'internalBetaEndToEndReady: false',
  'productReadyEndToEndLocalOssTools: 0',
]) {
  if (!service.includes(token)) fail(`service missing token ${token}`)
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
  if (pattern.test(service)) fail(`service contains forbidden runtime signal ${pattern}`)
}

const smoke = read('server/smoke/internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke.ts')
for (const token of [
  'local E2E chain status mismatch',
  'orchestrator must keep Supabase target gate',
  'signed URL creation must remain false',
  'internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`packet smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration'] !==
  'tsx server/smoke/internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-smoke.ts'
) {
  fail('missing packet smoke script')
}
if (
  packageJson.scripts?.['rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-runtime-readiness-orchestrator-2-local-e2e-chain-integration-diagnostics.mjs'
) {
  fail('missing packet diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file)) fail(`forbidden changed file ${file}`)
  if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) fail(`forbidden changed path ${file}`)
  if (/\.(sql|mp4|mov|mkv|webm|srt|png|jpg|jpeg|wav|mp3|zip|gz|tar|tgz|env)$/.test(file)) {
    fail(`forbidden generated artifact ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
