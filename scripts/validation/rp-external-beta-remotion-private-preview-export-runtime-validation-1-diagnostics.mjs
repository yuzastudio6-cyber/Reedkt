#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1'
const packetDir = 'docs/external-beta/remotion-private-preview-export-runtime-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/runtime-validation-record.json`,
  'docs/activation-phase-rp-external-beta-remotion-private-preview-export-runtime-validation-1-results.md',
]

const rollupFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
]

const requiredFiles = [
  ...packetFiles,
  ...rollupFiles,
  'scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'completed_confirmation_gated_external_beta_generated_local_remotion_render',
  'passed_external_beta_generated_local_private_preview_fixture',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_RUNTIME_VALIDATION=true',
  'Run ID: `2026-06-27T02-41-01-252Z-7ce79dc6`',
  'Output directory: `/tmp/reeditpro-rp-external-beta-remotion-private-preview-export-runtime-validation-1/2026-06-27T02-41-01-252Z-7ce79dc6`',
  'Output file: `reeditpro-external-beta-generated-local-preview.mp4`',
  'Output bytes: `64855`',
  'Output SHA-256: `ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b`',
  'Manifest SHA-256: `24675b34cb0bd3b1ff255dd29343ffce2e12d7d045070bf59fba3404db15356c`',
  'QA report SHA-256: `847efc9202c556f394d17df16a6a9250513f4106c6b3ebe884a453caaa8e5879`',
  'Generated local fixture only: `true`',
  'User media input: `none`',
  'Private media input: `none`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Worker execution: `false`',
  'Route execution: `false`',
  'Provider/model call: `false`',
  'Remotion execution: `true`',
  'Remotion renderer media encoding: `true`',
  'Direct FFmpeg command execution by runner: `false`',
  'FFprobe execution: `false`',
  'External product beta ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1',
  'blocked_external_product_beta_pending_provider_policy_security_privacy_support_cost_deployment_after_remotion_runtime_validation',
  'fajinbvwhcjnutkaumkm` remains historical/context-only and is not used as the ReEditPro target',
  'PR #577 remains open/draft/blocked and excluded',
  'The only runtime execution was confirmation-gated Remotion rendering of a generated local fixture under `/tmp`; the runner did not invoke a direct FFmpeg command and did not execute FFprobe.',
]

const forbiddenClaims = [
  /external product beta status:\s*`?(ready|unlocked|approved)`?/i,
  /external product beta ready:\s*`?true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Worker execution:\s*`?true/i,
  /Route execution:\s*`?true/i,
  /Provider\/model call:\s*`?true/i,
  /Direct FFmpeg command execution by runner:\s*`?true/i,
  /FFprobe execution:\s*`?true/i,
  /Package-lock:\s*`?(changed|mutated)/i,
  /Generated artifacts committed:(?!\s*`?none`?)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const allowedChangedFiles = new Set(requiredFiles)
const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'supabase/',
  'docker/',
  '.github/workflows/',
  'server/routes/',
  'server/workers/',
  'server/config/',
  'src/',
  'database/',
  'public/',
  'tests/',
  'tmp/',
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

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map(read).join('\n')
const claimCorpus = [...packetFiles, ...rollupFiles].map(read).join('\n')
for (const token of requiredText) {
  if (!corpus.includes(token)) fail(`missing required text: ${token}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(claimCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-validation-record.json`))
if (record.decision !== 'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation') fail('record decision mismatch')
if (record.execution !== 'completed_confirmation_gated_external_beta_generated_local_remotion_render') fail('record execution mismatch')
if (record.runStatus !== 'passed_external_beta_generated_local_private_preview_fixture') fail('record status mismatch')
if (record.sourceChain?.mainTarget !== 'wmyyttnynmteqgcdishd') fail('main target mismatch')
if (record.sourceChain?.approvedSnapshotRouteWrite !== 'completed_approved_snapshot_route_write_runtime_validation') fail('approved snapshot route source mismatch')
if (record.run?.runId !== '2026-06-27T02-41-01-252Z-7ce79dc6') fail('run id mismatch')
if (record.run?.outputFile !== 'reeditpro-external-beta-generated-local-preview.mp4') fail('output file mismatch')
if (record.run?.outputBytes !== 64855) fail('output bytes mismatch')
if (record.run?.outputSha256 !== 'ea12d55c9ef1675da711769c97c9e76bb2da8547bd4c471176a0ff64b03c1c5b') fail('output checksum mismatch')
if (record.run?.manifestSha256 !== '24675b34cb0bd3b1ff255dd29343ffce2e12d7d045070bf59fba3404db15356c') fail('manifest checksum mismatch')
if (record.run?.qaReportSha256 !== '847efc9202c556f394d17df16a6a9250513f4106c6b3ebe884a453caaa8e5879') fail('QA checksum mismatch')
if (record.readiness?.providerModelCalls !== 'blocked_pending_provider_owner_runtime_approval') fail('provider readiness mismatch')
if (record.externalProductBetaReady !== false) fail('external product beta must remain false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
for (const key of [
  'generatedLocalFixtureOnly',
  'remotionExecution',
  'remotionRendererMediaEncoding',
]) {
  if (record.safety?.[key] !== true) fail(`${key} must be true`)
}
for (const key of [
  'privateMediaProcessing',
  'userMediaProcessing',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'supabaseMutation',
  'sqlExecution',
  'workerExecution',
  'routeExecution',
  'providerModelCall',
  'directFfmpegCommandExecutionByRunner',
  'ffprobeExecution',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record.safety?.[key] !== false) fail(`${key} must remain false`)
}

const runner = read('scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed.mjs')
for (const token of [
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_RUNTIME_VALIDATION',
  'blocked_pending_external_beta_remotion_private_preview_export_runtime_validation_confirmation',
  'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation',
  'renderMedia',
  'generatedLocalFixtureOnly',
  'directFfmpegCommandExecutionByRunner: false',
  'ffprobeExecution: false',
  '/tmp/reeditpro-rp-external-beta-remotion-private-preview-export-runtime-validation-1',
]) {
  if (!runner.includes(token)) fail(`runner missing token ${token}`)
}
for (const pattern of [
  /\.from\(/,
  /\.insert\(/,
  /\.delete\(/,
  /\.rpc\(/,
  /createClient\(/,
  /fetch\(/,
  /spawn\(/,
  /exec(File)?Sync\(/,
  /registerMockRouteHandler\(/,
]) {
  if (pattern.test(runner)) fail(`runner contains forbidden runtime signal ${pattern}`)
}

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_external_product_beta_pending_provider_policy_security_privacy_support_cost_deployment_after_remotion_runtime_validation') fail('rollup decision mismatch')
if (rollup.mainSupabaseTarget?.remotionPrivatePreviewExportRuntimeValidation !== 'completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation') fail('rollup Remotion status mismatch')
if (rollup.mainSupabaseTarget?.remotionPrivatePreviewExportRunId !== '2026-06-27T02-41-01-252Z-7ce79dc6') fail('rollup Remotion run id mismatch')
if (rollup.safety?.remotionExecution !== 'confirmation_gated_generated_local_remotion_preview_fixture_only') fail('rollup Remotion safety mismatch')
if (rollup.safety?.externalBetaUnlock !== false) fail('rollup external beta unlock mismatch')
if (rollup.mainSupabaseTarget?.isolatedSandboxActive !== false) fail('isolated sandbox must remain inactive')
if (rollup.mainSupabaseTarget?.isolatedSandboxDataCopied !== false) fail('isolated sandbox data copy must remain false')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed'] !==
  'node scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-confirmed.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-remotion-private-preview-export-runtime-validation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-remotion-private-preview-export-runtime-validation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
for (const blocked of ['supabase', 'docker', 'src', 'database', '.github/workflows', '.dockerignore']) {
  gitQuiet(['diff', '--quiet', '--', blocked], `${blocked} changed`)
}

const changed = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenExactFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) {
    fail(`forbidden changed file ${file}`)
  }
  if (/\.(sql|mp4|mov|mkv|webm|zip|gz|tar|tgz|env)$/.test(file)) fail(`forbidden committed artifact ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
