#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED'
const packetDir = 'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/confirmed-runtime-result.md`,
  `${packetDir}/runtime-evidence.md`,
  `${packetDir}/fail-closed-restore.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-confirmed-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-results.md',
  'docs/implementation-prompts/prompt-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r/product-route-runtime-fixture-1r.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-diagnostics.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-diagnostics.mjs',
  'package.json',
]

const followupAllowedFiles = [
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1-results.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/artifact-manifest.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/fail-closed-restore.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/runtime-result.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1/validation-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start',
  'confirmed_product_route_provider_runtime_fixture_attempted_fail_closed_restore_passed',
  '62a9700bacef02153097f0dd37ac973ed914fbca',
  '#1380',
  '#577',
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-04-09-287Z-6e6e6f3d',
  'qwen25-adapter-runtime-fixture-2026-06-28T04-04-09-756Z-ddcd534d',
  'reeditpro-qwen2-5-vl-private-caller-h2hdk',
  'HTTP `502`',
  'checkpoint shard `0/5`',
  'Fail-closed restore: `passed`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1',
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

for (const file of requiredFiles) read(file)
const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-confirmed-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start') fail('decision mismatch')
if (record.execution !== 'confirmed_product_route_provider_runtime_fixture_attempted_fail_closed_restore_passed') {
  fail('execution mismatch')
}
if (record.runtimeAttempt?.backendHandoffValidated !== true) fail('backend handoff was not validated')
if (record.runtimeAttempt?.callerHttpStatus !== 502) fail('expected HTTP 502 blocker')
if (record.runtimeAttempt?.failClosedRestorePassed !== true) fail('fail-closed restore must pass')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-diagnostics.mjs'
) {
  fail('missing confirmed diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...followupAllowedFiles])
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (/^package-lock\.json$|^supabase\/|^server\/routes\/|^server\/workers\/|^docker\/|^\.env|^requirements/i.test(file)) {
    fail(`forbidden file changed: ${file}`)
  }
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase token leaked in ${file}`)
  if (/Product-ready end-to-end local OSS tools:\s*`?[1-9]/i.test(text)) fail(`product-ready count changed in ${file}`)
  if (/External beta unlocked in this phase:\s*`?true`?/i.test(text)) fail(`external beta unlock claim in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start')
console.log('Next milestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1')
