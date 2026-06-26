#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-CONFIRMED-RUN-1'
const packetDir = 'docs/internal-beta/rp-internal-beta-remotion-private-preview-export-confirmed-run-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/run-evidence.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/remotion-private-preview-export-confirmed-run-record.json`,
  'docs/activation-phase-rp-internal-beta-remotion-private-preview-export-confirmed-run-1-results.md',
]

const requiredFiles = [
  ...packetFiles,
  'scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1.mjs',
  'scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1-diagnostics.mjs',
  'scripts/validation/rp-render-01-internal-beta-remotion-render-worker-scaffold-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-remotion-private-preview-export-local-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-local-readiness-gate-rollup-1-diagnostics.mjs',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

const qaCleanupObservabilityLocalRuntimeFiles = [
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/runtime-contract.md',
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/validation-results.md',
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-qa-cleanup-observability-local-runtime-1/qa-cleanup-observability-local-runtime-record.json',
  'docs/activation-phase-rp-internal-beta-qa-cleanup-observability-local-runtime-1-results.md',
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/readiness-matrix.md',
  'server/services/internal-beta-qa-cleanup-observability-local-runtime.ts',
  'server/smoke/internal-beta-qa-cleanup-observability-local-runtime-smoke.ts',
  'scripts/validation/rp-internal-beta-qa-cleanup-observability-local-runtime-1-diagnostics.mjs',
]

for (const file of qaCleanupObservabilityLocalRuntimeFiles) {
  allowedChangedFiles.add(file)
}

const requiredText = [
  packet,
  'completed_generated_local_remotion_private_preview_export_confirmed_run',
  'completed_confirmation_gated_generated_local_remotion_render',
  'passed_generated_local_private_preview_fixture',
  'Run ID: `2026-06-26T02-01-33-203Z-a2710617`',
  'Local artifact root: `/tmp/reeditpro-rp-internal-beta-remotion-private-preview-export-confirmed-run-1/2026-06-26T02-01-33-203Z-a2710617`',
  'Output file: `reeditpro-internal-beta-generated-local-preview.mp4`',
  'Output bytes: `28686`',
  'Output SHA-256: `55b41c9e0d5f073450b88d4b0a1982f1f16e15f6ca89b5d4b7a458777900b93a`',
  'Manifest file: `manifest.json`',
  'QA report file: `qa-report.json`',
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
  'Internal beta end-to-end ready: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Next safe milestone: `RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1`',
  'The only runtime execution was confirmation-gated Remotion rendering of a generated local fixture under `/tmp`; the runner did not invoke a direct FFmpeg command and did not execute FFprobe.',
]

const forbiddenClaims = [
  /Internal beta end-to-end ready:\s*`?true/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /User media input:(?!\s*`?none`?)/i,
  /Private media input:(?!\s*`?none`?)/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
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
  /No Remotion execution/i,
  /Remotion execution:\s*`?false/i,
]

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

const docsCorpus = [
  ...packetFiles,
  'implementation-status-and-next-phase.md',
  'docs/production-beta-blocker-inventory.md',
].map(read).join('\n')

for (const token of requiredText) {
  if (!docsCorpus.includes(token)) fail(`missing required text: ${token}`)
}

const packetCorpus = packetFiles.map(read).join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(packetCorpus)) fail(`forbidden packet claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/remotion-private-preview-export-confirmed-run-record.json`))
if (record.decision !== 'completed_generated_local_remotion_private_preview_export_confirmed_run') fail('record decision mismatch')
if (record.execution !== 'completed_confirmation_gated_generated_local_remotion_render') fail('record execution mismatch')
if (record.runStatus !== 'passed_generated_local_private_preview_fixture') fail('run status mismatch')
if (record.runId !== '2026-06-26T02-01-33-203Z-a2710617') fail('run id mismatch')
if (record.outputFile !== 'reeditpro-internal-beta-generated-local-preview.mp4') fail('output file mismatch')
if (record.outputBytes !== 28686) fail('output byte count mismatch')
if (record.outputSha256 !== '55b41c9e0d5f073450b88d4b0a1982f1f16e15f6ca89b5d4b7a458777900b93a') fail('output checksum mismatch')
if (record.sourceIndexSha256 !== 'ca4cf6e068d6bfa519c44518394684edaf70e5b3a3ea1d5b7ca9d14e708bfe01') fail('source checksum mismatch')
if (record.generatedLocalFixtureOnly !== true) fail('generated local fixture flag mismatch')
if (record.remotionExecution !== true) fail('Remotion execution must be true for this confirmed packet')
if (record.remotionRendererMediaEncoding !== true) fail('Remotion media encoding must be true for this confirmed packet')
if (record.internalBetaEndToEndReady !== false) fail('internal beta must remain blocked')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.nextSafeMilestone !== 'RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1') fail('next milestone mismatch')
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
  if (record[key] !== false) fail(`${key} must remain false`)
}

const runner = read('scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1.mjs')
for (const token of [
  'REEDITPRO_CONFIRM_RP_INTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT',
  'blocked_pending_remotion_private_preview_export_confirmation',
  'completed_generated_local_remotion_private_preview_export_confirmed_run',
  'renderMedia',
  'generatedLocalFixtureOnly',
  'directFfmpegCommandExecutionByRunner: false',
  'ffprobeExecution: false',
  '/tmp/reeditpro-rp-internal-beta-remotion-private-preview-export-confirmed-run-1',
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
  /registerMockRouteHandler\(/,
]) {
  if (pattern.test(runner)) fail(`runner contains forbidden runtime signal ${pattern}`)
}
if (/exec(File)?Sync\(/.test(runner)) fail('runner must not shell out')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-internal-beta-remotion-private-preview-export-confirmed-run-1'] !==
  'node scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1.mjs'
) {
  fail('missing confirmed runner package script')
}
if (
  packageJson.scripts?.['rp-internal-beta-remotion-private-preview-export-confirmed-run-1:diagnostics'] !==
  'node scripts/validation/rp-internal-beta-remotion-private-preview-export-confirmed-run-1-diagnostics.mjs'
) {
  fail('missing confirmed runner diagnostics package script')
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
}

console.log(`${packet} diagnostics passed`)
