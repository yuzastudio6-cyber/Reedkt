#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-LOCAL-E2E-CHAIN-SMOKE-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-local-e2e-chain-smoke-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-contract.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/local-e2e-chain-smoke-record.json`,
  'docs/activation-phase-rp-internal-beta-local-e2e-chain-smoke-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'server/services/internal-beta-local-e2e-chain-smoke.ts',
  'server/smoke/internal-beta-local-e2e-chain-smoke.ts',
  'scripts/validation/rp-internal-beta-local-e2e-chain-smoke-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'completed_local_internal_beta_e2e_chain_smoke_no_remote_runtime',
  'completed_backend_local_e2e_chain_metadata_composition_no_remote_execution',
  'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'approved snapshot local runtime',
  'credit reservation local runtime',
  'job queue local runtime',
  'private artifact manifest local runtime',
  'private artifact access policy local runtime',
  'Remotion private preview/export metadata local runtime',
  'QA cleanup observability local runtime',
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Pre-validation caveat',
  'fetched `tsx` into npm cache',
  'is not accepted validation evidence',
  'must not be repeated',
  'PR #577 remains open/draft/blocked and excluded as source-of-truth',
  'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Migration apply:\s*`?true/i,
  /Storage object (?:creation|read|delete):\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Service-role route execution:\s*`?true/i,
  /Worker execution\/dispatch:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Remotion execution:\s*`?true/i,
  /FFmpeg execution:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Media processing:\s*`?true/i,
  /Private artifact access grant:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'docker/',
  'supabase/',
  'database/',
  'src/',
  'server/routes/',
  'server/workers/',
  'server/providers/',
  'public/',
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

const docsCorpus = [
  ...packetFiles,
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const packetCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/local-e2e-chain-smoke-record.json`))
if (record.decision !== 'completed_local_internal_beta_e2e_chain_smoke_no_remote_runtime') fail('record decision mismatch')
if (record.execution !== 'completed_backend_local_e2e_chain_metadata_composition_no_remote_execution') fail('record execution mismatch')
if (record.runtimeStatus !== 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime') fail('record runtime status mismatch')
for (const key of [
  'localChainSmokeRecordCreated',
  'approvedSnapshotStep',
  'creditReservationStep',
  'jobQueueStep',
  'privateArtifactManifestStep',
  'privateArtifactAccessPolicyStep',
  'remotionPrivatePreviewExportMetadataStep',
  'qaCleanupObservabilityStep',
]) {
  if (record[key] !== true) fail(`${key} must be true`)
}
for (const key of [
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'storageObjectCreation',
  'storageObjectRead',
  'storageObjectDelete',
  'signedUrlCreation',
  'publicArtifactCreation',
  'serviceRoleRouteExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCall',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'privateArtifactAccessGrant',
  'internalBetaEndToEndReady',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.preValidationNpxCaveat !== 'local_prevalidation_npx_tsx_probe_fetched_npm_cache_not_source_evidence_must_not_be_repeated') {
  fail('pre-validation npx caveat missing')
}

const service = read('server/services/internal-beta-local-e2e-chain-smoke.ts')
for (const token of [
  'createInternalBetaLocalE2EChainSmoke',
  'INTERNAL_BETA_LOCAL_E2E_CHAIN_SMOKE_RULE',
  'createInternalBetaApprovedSnapshotLocalRuntime',
  'createInternalBetaCreditReservationLocalRuntime',
  'createInternalBetaJobQueueLocalRuntime',
  'createInternalBetaPrivateArtifactManifestLocalRuntime',
  'createInternalBetaPrivateArtifactAccessPolicyLocalRuntime',
  'createInternalBetaRemotionPrivatePreviewExportLocalRuntime',
  'createInternalBetaQaCleanupObservabilityLocalRuntime',
  'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
  'blocked_invalid_local_e2e_chain_input',
  'blocked_local_e2e_chain_step_failed',
  'internalBetaUnlock: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
  'storageObjectRead: false',
  'remotionExecution: false',
  'ffmpegExecution: false',
  'ffprobeExecution: false',
]) {
  if (!service.includes(token)) fail(`service missing token ${token}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
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

const smoke = read('server/smoke/internal-beta-local-e2e-chain-smoke.ts')
for (const token of [
  'same local E2E basis should hash deterministically',
  'missingIdempotency',
  'rawPrompt',
  'signedUrl',
  'internal-beta-local-e2e-chain-smoke passed',
]) {
  if (!smoke.includes(token)) fail(`smoke missing token ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:internal-beta-local-e2e-chain-smoke'] !== 'tsx server/smoke/internal-beta-local-e2e-chain-smoke.ts') {
  fail('missing local E2E chain smoke script')
}
if (packageJson.scripts?.['rp-internal-beta-local-e2e-chain-smoke-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-local-e2e-chain-smoke-1-diagnostics.mjs') {
  fail('missing local E2E chain diagnostics script')
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
  if (/\.(sql|mp4|mov|mkv|webm|srt|png|jpg|jpeg|wav|mp3|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden generated artifact ${file}`)
}

console.log(`${packet} diagnostics passed`)
