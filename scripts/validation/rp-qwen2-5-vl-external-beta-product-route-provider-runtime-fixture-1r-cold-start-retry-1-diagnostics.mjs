#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1'
const packetDir =
  'docs/external-beta/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/runtime-result.md`,
  `${packetDir}/artifact-manifest.md`,
  `${packetDir}/fail-closed-restore.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-record.json`,
  'docs/activation-phase-rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1.md',
  'scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs',
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry',
  'completed_confirmed_product_route_provider_runtime_fixture_after_cold_start_retry',
  'e2b8a5d08a8f80de24477be6c811d5f072a3dcd7',
  '#1380',
  '#1394',
  '#577',
  'qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-2026-06-28T04-59-27-073Z-f334595a',
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-59-27-133Z-37e1aba2',
  'qwen25-adapter-runtime-fixture-2026-06-28T04-59-27-623Z-37144e9c',
  'reeditpro-qwen2-5-vl-private-caller-8rnk9',
  'Structured metadata accepted: `true`',
  'Runtime contract executes now: `true`',
  'Fail-closed restore: `passed`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN2_5_VL_PRODUCT_ROUTE_RUNTIME_READINESS_ROLLUP_1',
]

const allowedFiles = new Set(requiredFiles)
allowedFiles.add('scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-diagnostics.mjs')
allowedFiles.add('scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed-diagnostics.mjs')

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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-provider-runtime-fixture-1r-cold-start-retry-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_confirmed_product_route_provider_runtime_fixture_after_cold_start_retry') {
  fail('execution mismatch')
}
if (record.runtime?.httpStatus !== 200) fail('HTTP status mismatch')
if (record.runtime?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.runtime?.structuredMetadataOutputAccepted !== true) fail('structured metadata acceptance mismatch')
if (record.runtime?.metadata?.schemaValid !== true) fail('schema validity mismatch')
if (record.runtime?.metadata?.objectCount !== 3) fail('object count mismatch')
if (record.runtime?.metadata?.textLikeRegionCount !== 1) fail('text-like region count mismatch')
if (record.runtime?.retryPolicy?.adapterMaxAttempts !== 2) fail('retry max mismatch')
if (record.runtime?.failClosedRestorePassed !== true) fail('fail-closed restore mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs'
) {
  fail('missing cold-start retry runner script')
}
if (
  packageJson.scripts?.['rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1:diagnostics'] !==
  'node scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1-diagnostics.mjs'
) {
  fail('missing cold-start retry diagnostics script')
}

const adapterRunner = read('scripts/validation/rp-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1-confirmed.mjs')
for (const text of [
  'QWEN_ADAPTER_RUNTIME_FIXTURE_MAX_ATTEMPTS',
  'QWEN_ADAPTER_RUNTIME_FIXTURE_COLD_START_WAIT_SECONDS',
  'isColdStartRetryCandidate',
  'retryableHttpStatuses: [502]',
  'attempts.push(attempt)',
]) {
  if (!adapterRunner.includes(text)) fail(`adapter runner missing ${text}`)
}

const coldStartRunner = read(
  'scripts/validation/rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1.mjs',
)
for (const text of [
  'REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY',
  'QWEN_ADAPTER_RUNTIME_FIXTURE_MAX_ATTEMPTS',
  'QWEN_ADAPTER_RUNTIME_FIXTURE_COLD_START_WAIT_SECONDS',
  'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  'approved_snapshot_structured_metadata_only',
]) {
  if (!coldStartRunner.includes(text)) fail(`cold-start runner missing ${text}`)
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (
    /^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\//i.test(
      file,
    )
  ) {
    fail(`forbidden file changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  const redacted = text
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('postgres://[REDACTED]', '')
    .replaceAll('https://[redacted]', '')
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase token leaked in ${file}`)
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(redacted)) fail(`Supabase URL leaked in ${file}`)
  if (/Product-ready end-to-end local OSS tools:\s*`?[1-9]/i.test(text)) fail(`product-ready count changed in ${file}`)
  if (/External beta unlocked in this phase:\s*`?true`?/i.test(text)) fail(`external beta unlock claim in ${file}`)
  if (/publicArtifactCreation"?\s*:\s*true/i.test(text)) fail(`public artifact creation claim in ${file}`)
  if (/supabaseMutation"?\s*:\s*true/i.test(text)) fail(`Supabase mutation claim in ${file}`)
  if (/sqlExecution"?\s*:\s*true/i.test(text)) fail(`SQL execution claim in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN2_5_VL_PRODUCT_ROUTE_RUNTIME_READINESS_ROLLUP_1')
