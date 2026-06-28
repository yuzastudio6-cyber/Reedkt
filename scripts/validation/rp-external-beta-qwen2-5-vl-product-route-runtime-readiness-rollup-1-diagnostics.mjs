#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN2_5_VL_PRODUCT_ROUTE_RUNTIME_READINESS_ROLLUP_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-product-route-runtime-readiness-rollup-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/readiness-rollup.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-product-route-runtime-readiness-rollup-record.json`,
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1.md',
  'scripts/validation/rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedFollowUpFiles = [
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/source-audit.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/orchestration-contract.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-record.json',
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1.md',
  'server/services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e.ts',
  'server/smoke/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-diagnostics.mjs',
]

const allowedFollowUpSourceFiles = new Set([
  'server/services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e.ts',
])

const requiredText = [
  packet,
  'completed_qwen2_5_vl_product_route_runtime_readiness_rollup',
  'completed_docs_only_runtime_readiness_rollup_no_runtime_execution',
  '01202d5d746954c895a13540a2b38a3feb9f81b8',
  '#1380',
  '#1387',
  '#1394',
  '#1403',
  '#577',
  'ready_for_external_beta_backend_orchestration_integration_planning',
  'qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-2026-06-28T04-59-27-073Z-f334595a',
  'reeditpro-qwen2-5-vl-private-caller-8rnk9',
  'Structured metadata accepted: `true`',
  'Fail-closed restore: `passed`',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_1',
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-product-route-runtime-readiness-rollup-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_product_route_runtime_readiness_rollup') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_runtime_readiness_rollup_no_runtime_execution') fail('execution mismatch')
if (record.readiness?.qwenProductRouteProviderRuntime !== 'ready_for_external_beta_backend_orchestration_integration_planning') {
  fail('readiness mismatch')
}
if (record.readiness?.externalBetaUnlocked !== false) fail('external beta must remain locked')
if (record.acceptedRuntimeEvidence?.httpStatus !== 200) fail('accepted runtime HTTP mismatch')
if (record.acceptedRuntimeEvidence?.structuredMetadataOutputAccepted !== true) fail('metadata acceptance mismatch')
if (record.acceptedRuntimeEvidence?.failClosedRestorePassed !== true) fail('restore mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1-diagnostics.mjs'
) {
  fail('missing rollup diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...allowedFollowUpFiles])
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (
    /^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\/|^server\/services\//i.test(
      file,
    ) &&
    !allowedFollowUpSourceFiles.has(file)
  ) {
    fail(`forbidden file changed: ${file}`)
  }
  const text = read(file)
  const redacted = text
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('postgres://[REDACTED]', '')
    .replaceAll('https://[redacted]', '')
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase token leaked in ${file}`)
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(redacted)) fail(`Supabase URL leaked in ${file}`)
  if (/Product-ready end-to-end local OSS tools:\s*`?[1-9]/i.test(text)) fail(`product-ready count changed in ${file}`)
  if (/External beta unlocked:\s*`?true`?/i.test(text)) fail(`external beta unlock claim in ${file}`)
  if (/runtimeExecutedInThisRollup"?\s*:\s*true/i.test(text)) fail(`runtime execution in rollup claim in ${file}`)
  if (/supabaseMutation"?\s*:\s*true/i.test(text)) fail(`Supabase mutation claim in ${file}`)
  if (/sqlExecution"?\s*:\s*true/i.test(text)) fail(`SQL execution claim in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_product_route_runtime_readiness_rollup')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_1')
