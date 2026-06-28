#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1'
const packetDir = 'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-result.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/artifact-manifest.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-single-tester-qwen-product-flow-runtime-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-product-walkthrough-qa-1.md',
  'scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-diagnostics.mjs',
  'package.json',
]

const allowedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME',
  'aiediting@reeditpro.com',
  'afde458c1967cc0f90bf7db6aebea0e5e6f9b544',
  'cd51c6999b02e1d18a0cfe087c652cdbe181204d',
  '2b32604324fb843d3c52c9a006dffda3f685b441',
  '#1423',
  '#1417',
  '#1419',
  '#577',
  'rp-external-beta-controlled-tester-product-flow-smoke-1',
  'rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1',
  'completed_controlled_single_tester_qwen_product_flow_runtime_validation',
  'completed_confirmed_controlled_single_tester_qwen_product_flow_runtime_validation',
  'blocked_no_additional_named_tester_list',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-PRODUCT-WALKTHROUGH-QA-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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

const record = JSON.parse(read(`${packetDir}/controlled-single-tester-qwen-product-flow-runtime-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== 'afde458c1967cc0f90bf7db6aebea0e5e6f9b544') fail('integration base mismatch')
if (record.sourceEvidence?.productFlowAfterQwenPr !== 1423) fail('missing #1423 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.controlledTester?.email !== 'aiediting@reeditpro.com') fail('controlled tester mismatch')
if (record.controlledTester?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') {
  fail('tester expansion mismatch')
}
if (record.confirmationGate?.env !== 'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME') {
  fail('confirmation gate mismatch')
}
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-PRODUCT-WALKTHROUGH-QA-1') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
for (const key of [
  'additionalTesterExpansion',
  'supabaseMutation',
  'sqlExecution',
  'workerDispatch',
  'workerExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'persistentCreditMutation',
  'creditSpend',
  'stripePaymentProcessing',
  'browserCapture',
  'mediaProcessing',
  'privateUserMediaProcessing',
  'finalRenderExport',
  'externalBetaGlobalUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'deployment',
  'cloudRunServiceUpdate',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const runner = read('scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_single_tester_qwen_product_flow_runtime_confirmation',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_PRODUCT_FLOW_SMOKE',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE',
  'completed_controlled_single_tester_qwen_product_flow_runtime_validation',
]) {
  if (!runner.includes(text)) fail(`runner missing required guard/source: ${text}`)
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1'] !==
  'node scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.mjs'
) {
  fail('missing runtime package script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const forbiddenFile = /^(package-lock\.json|supabase\/|database\/|docker\/|\.github\/|\.dockerignore$|\.env|requirements|src\/|server\/(?!smoke\/qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-smoke\.ts$)|dist\/|dist-server\/|node_modules\/)/
const forbiddenText = [
  /External beta global unlock:\s*`?true`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /persistentCreditMutation"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /deployment"?\s*:\s*true/i,
  /cloudRunServiceUpdate"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /sbp_[A-Za-z0-9_.\/=+-]+/,
]

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenFile.test(file)) fail(`forbidden changed file: ${file}`)
  const text = read(file)
  if (!file.endsWith('-diagnostics.mjs')) {
    for (const pattern of forbiddenText) {
      if (pattern.test(text)) fail(`forbidden content matched in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Expected decision after confirmed run: completed_controlled_single_tester_qwen_product_flow_runtime_validation')
