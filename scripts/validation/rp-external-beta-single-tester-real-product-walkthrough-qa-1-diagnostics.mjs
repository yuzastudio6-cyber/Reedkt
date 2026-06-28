#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-PRODUCT-WALKTHROUGH-QA-1'
const packetDir = 'docs/external-beta/single-tester-real-product-walkthrough-qa-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/qa-review.md`,
  `${packetDir}/blocker-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-real-product-walkthrough-qa-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-real-product-walkthrough-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-single-tester-go-no-go-1.md',
  'scripts/validation/rp-external-beta-single-tester-real-product-walkthrough-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence',
  'completed_docs_only_single_tester_walkthrough_qa_no_runtime_execution',
  '8ee164c9383c290f1272d43e64d2d0c7fda8d45c',
  'afde458c1967cc0f90bf7db6aebea0e5e6f9b544',
  '#1423',
  '#1428',
  '#577',
  'single-tester-qwen-product-flow-runtime-1-2026-06-28T10-28-10-412Z-36e1bf2c',
  '2026-06-28T10-28-10-870Z-daae948b',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T10-28-26-132Z-44389d09',
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T10-28-30-250Z-3e4c842a',
  'qwen25-adapter-runtime-fixture-2026-06-28T10-28-35-312Z-24693f06',
  'reeditpro-qwen2-5-vl-private-caller-qn4q8',
  'qwen_fixture_inference_smoke_completed',
  'ready_for_controlled_external_beta_single_tester_go_no_go',
  'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-GO-NO-GO-1',
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

const record = JSON.parse(read(`${packetDir}/single-tester-real-product-walkthrough-qa-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'qa_passed_single_tester_qwen_product_flow_runtime_evidence') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_single_tester_walkthrough_qa_no_runtime_execution') fail('execution mismatch')
if (record.sourceEvidence?.qwenProductFlowRuntimePr !== 1428) fail('missing #1428 source evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.acceptedRuntimeEvidence?.httpStatus !== 200) fail('HTTP status mismatch')
if (record.acceptedRuntimeEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.acceptedRuntimeEvidence?.structuredMetadataAccepted !== true) fail('metadata acceptance mismatch')
if (record.acceptedRuntimeEvidence?.schemaValid !== true) fail('schema status mismatch')
if (record.acceptedRuntimeEvidence?.failClosedRestorePassed !== true) fail('fail-closed status mismatch')
if (record.readiness?.singleTesterQwenProductFlow !== 'ready_for_controlled_external_beta_single_tester_go_no_go') {
  fail('readiness mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
for (const [key, value] of Object.entries(record.blockedNow ?? {})) {
  if (!String(value).startsWith('blocked')) fail(`blocked status mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyQaReview') {
    if (value !== true) fail('docsOnlyQaReview must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-real-product-walkthrough-qa-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-real-product-walkthrough-qa-1-diagnostics.mjs'
) {
  fail('missing QA diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set(requiredFiles)
const forbiddenFile = /^(package-lock\.json|supabase\/|database\/|docker\/|\.github\/|\.dockerignore$|\.env|requirements|src\/|server\/|dist\/|dist-server\/|node_modules\/)/
const forbiddenText = [
  /External beta global unlock:\s*`?true`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /qwenRuntimeExecutedInThisQaPacket"?\s*:\s*true/i,
  /providerCallInThisQaPacket"?\s*:\s*true/i,
  /modelCallInThisQaPacket"?\s*:\s*true/i,
  /routeExecutionInThisQaPacket"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
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
console.log('Decision: qa_passed_single_tester_qwen_product_flow_runtime_evidence')
