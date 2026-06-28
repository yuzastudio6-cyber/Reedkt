#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-GO-NO-GO-1'
const packetDir = 'docs/external-beta/controlled-single-tester-go-no-go-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/go-no-go-decision.md`,
  `${packetDir}/source-chain.md`,
  `${packetDir}/blocker-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-single-tester-go-no-go-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-single-tester-go-no-go-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-named-tester-expansion-readiness-1.md',
  'scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-product-walkthrough-qa-1-diagnostics.mjs',
  'package.json',
]

const followOnFiles = [
  'docs/external-beta/named-tester-expansion-readiness-1/source-chain-reconciliation.md',
  'docs/external-beta/named-tester-expansion-readiness-1/readiness-decision.md',
  'docs/external-beta/named-tester-expansion-readiness-1/expansion-boundary.md',
  'docs/external-beta/named-tester-expansion-readiness-1/safety-boundary.md',
  'docs/external-beta/named-tester-expansion-readiness-1/validation-results.md',
  'docs/external-beta/named-tester-expansion-readiness-1/named-tester-expansion-readiness-record.json',
  'docs/activation-phase-rp-external-beta-named-tester-expansion-readiness-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-named-tester-expansion-readiness-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-additional-named-tester-list-decision-1.md',
  'scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs',
  'docs/external-beta/single-tester-active-lane-closure-1/source-audit.md',
  'docs/external-beta/single-tester-active-lane-closure-1/lane-decision.md',
  'docs/external-beta/single-tester-active-lane-closure-1/expansion-boundary.md',
  'docs/external-beta/single-tester-active-lane-closure-1/readiness-gate.md',
  'docs/external-beta/single-tester-active-lane-closure-1/safety-boundary.md',
  'docs/external-beta/single-tester-active-lane-closure-1/validation-results.md',
  'docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json',
  'docs/activation-phase-rp-external-beta-single-tester-active-lane-closure-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1.md',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'docs/external-beta/additional-named-tester-list-decision-1/source-audit.md',
  'docs/external-beta/additional-named-tester-list-decision-1/decision.md',
  'docs/external-beta/additional-named-tester-list-decision-1/access-boundary.md',
  'docs/external-beta/additional-named-tester-list-decision-1/readiness-gate.md',
  'docs/external-beta/additional-named-tester-list-decision-1/safety-boundary.md',
  'docs/external-beta/additional-named-tester-list-decision-1/validation-results.md',
  'docs/external-beta/additional-named-tester-list-decision-1/additional-named-tester-list-decision-record.json',
  'docs/activation-phase-rp-external-beta-additional-named-tester-list-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-live-feedback-triage-1.md',
  'scripts/validation/rp-external-beta-additional-named-tester-list-decision-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'go_controlled_single_tester_external_beta_lane_remains_open',
  'completed_docs_only_controlled_single_tester_go_no_go_no_runtime_execution',
  'a11a58686db53de1776053182825173b6129bb84',
  'afde458c1967cc0f90bf7db6aebea0e5e6f9b544',
  '8ee164c9383c290f1272d43e64d2d0c7fda8d45c',
  '#1423',
  '#1428',
  '#1430',
  '#577',
  'aiediting@reeditpro.com',
  'go_single_tester_only',
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence',
  'blocked_no_additional_named_tester_list',
  'External beta global unlock: `false`',
  'Paid production unlock: `false`',
  'Production unlock: `false`',
  'Final delivery/export unlock: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1',
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

const record = JSON.parse(read(`${packetDir}/controlled-single-tester-go-no-go-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'go_controlled_single_tester_external_beta_lane_remains_open') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_controlled_single_tester_go_no_go_no_runtime_execution') fail('execution mismatch')
if (record.sourceEvidence?.singleTesterWalkthroughQaPr !== 1430) fail('missing #1430 source evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.goScope?.testerEmail !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.goScope?.laneStatus !== 'go_single_tester_only') fail('lane status mismatch')
if (record.acceptedRuntimeEvidence?.httpStatus !== 200) fail('HTTP evidence mismatch')
if (record.acceptedRuntimeEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.acceptedRuntimeEvidence?.structuredMetadataAccepted !== true) fail('metadata acceptance mismatch')
if (record.acceptedRuntimeEvidence?.schemaValid !== true) fail('schema status mismatch')
if (record.acceptedRuntimeEvidence?.failClosedRestorePassed !== true) fail('fail-closed mismatch')
for (const [key, value] of Object.entries(record.blockedNow ?? {})) {
  if (!String(value).startsWith('blocked')) fail(`blocked status mismatch: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyGoNoGoReview') {
    if (value !== true) fail('docsOnlyGoNoGoReview must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.readiness?.currentSingleTesterExternalBetaLane !== 'go_single_tester_only') fail('readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-single-tester-go-no-go-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs'
) {
  fail('missing go/no-go diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...followOnFiles])
const forbiddenFile = /^(package-lock\.json|supabase\/|database\/|docker\/|\.github\/|\.dockerignore$|\.env|requirements|src\/|server\/|dist\/|dist-server\/|node_modules\/)/
const forbiddenText = [
  /External beta global unlock:\s*`?true`?/i,
  /Paid production unlock:\s*`?true`?/i,
  /Production unlock:\s*`?true`?/i,
  /Final delivery\/export unlock:\s*`?true`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /qwenRuntimeExecutedInThisGoNoGoPacket"?\s*:\s*true/i,
  /providerCallInThisGoNoGoPacket"?\s*:\s*true/i,
  /modelCallInThisGoNoGoPacket"?\s*:\s*true/i,
  /routeExecutionInThisGoNoGoPacket"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
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
console.log('Decision: go_controlled_single_tester_external_beta_lane_remains_open')
