#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1'
const packetDir = 'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/product-flow-bridge.md`,
  `${packetDir}/blocker-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-single-tester-product-flow-after-qwen-orchestration-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.md',
  'scripts/validation/rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/controlled-tester-product-flow-smoke-1/validation-results.md',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/activation-phase-rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-results.md',
  'server/services/qwen2-5-vl-external-beta-product-workflow-binding.ts',
  'server/services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e.ts',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
])

const followOnSingleTesterQwenProductFlowRuntimeFiles = [
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/source-audit.md',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/runtime-result.md',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/safety-boundary.md',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/artifact-manifest.md',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/validation-results.md',
  'docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/controlled-single-tester-qwen-product-flow-runtime-record.json',
  'docs/activation-phase-rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-product-walkthrough-qa-1.md',
  'scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1-diagnostics.mjs',
]

for (const file of followOnSingleTesterQwenProductFlowRuntimeFiles) allowedChangedFiles.add(file)

const requiredText = [
  packet,
  'completed_controlled_single_tester_product_flow_after_qwen_orchestration_source_readiness',
  'completed_docs_only_controlled_single_tester_product_flow_after_qwen_orchestration_no_runtime_execution',
  'cd51c6999b02e1d18a0cfe087c652cdbe181204d',
  'completed_external_beta_controlled_tester_product_flow_smoke',
  '2026-06-27T15-34-26-957Z-dbe78e9d',
  '#1410',
  '#1414',
  '#1417',
  '#1419',
  '#577',
  '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88',
  '9ead78060f666afb9bc5725f8c9abc720b3a5f4a',
  '2b32604324fb843d3c52c9a006dffda3f685b441',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  'reeditpro-qwen2-5-vl-private-caller-4qv7m',
  'qwen_fixture_inference_smoke_completed',
  'qa_passed_confirmed_runtime_fixture_evidence',
  'aiediting@reeditpro.com',
  'blocked_no_additional_named_tester_list',
  'ready_for_guarded_single_tester_qwen_product_flow_runtime_validation',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'External beta enabled by this packet: `false`',
  'External beta global unlock: `false`',
  'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1',
]

const forbiddenFilePatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^src\//,
  /^server\/(?!services\/qwen2-5-vl-external-beta-product-workflow-binding\.ts$|services\/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e\.ts$)/,
]

const forbiddenContentPatterns = [
  /External beta enabled by this packet:\s*`?true`?/i,
  /External beta global unlock:\s*`?true`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /qwenRuntimeExecutedInThisPacket"?\s*:\s*true/i,
  /productRouteExecutionInThisPacket"?\s*:\s*true/i,
  /providerCallInThisPacket"?\s*:\s*true/i,
  /modelCallInThisPacket"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /creditSpend"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /privateUserMediaProcessing"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /sbp_[A-Za-z0-9_./=-]+/,
]

const allowedFollowOnRuntimeContentPatterns = new Set([
  String(/qwenRuntimeExecutedInThisPacket"?\s*:\s*true/i),
])

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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-single-tester-product-flow-after-qwen-orchestration-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_controlled_single_tester_product_flow_after_qwen_orchestration_source_readiness') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_controlled_single_tester_product_flow_after_qwen_orchestration_no_runtime_execution') {
  fail('execution mismatch')
}
if (record.integrationHead !== 'cd51c6999b02e1d18a0cfe087c652cdbe181204d') fail('integration head mismatch')
if (record.sourceEvidence?.currentReadinessRollupAfterQwenPr !== 1419) fail('missing #1419 source evidence')
if (record.sourceEvidence?.currentReadinessRollupAfterQwenMergeSha !== 'cd51c6999b02e1d18a0cfe087c652cdbe181204d') {
  fail('current readiness merge SHA mismatch')
}
if (record.sourceEvidence?.qwenApprovedSnapshotJobOrchestrationQaRollupPr !== 1417) fail('missing #1417 evidence')
if (record.sourceEvidence?.excludedPr !== 577) fail('missing #577 exclusion')
if (record.controlledTester?.email !== 'aiediting@reeditpro.com') fail('controlled tester mismatch')
if (record.controlledTester?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') {
  fail('tester expansion mismatch')
}
if (record.qwenApprovedSnapshotJobOrchestration?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') {
  fail('Qwen orchestration status mismatch')
}
if (record.qwenApprovedSnapshotJobOrchestration?.httpStatus !== 200) fail('Qwen HTTP status mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.structuredMetadataAccepted !== true) fail('Qwen metadata acceptance mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.schemaValid !== true) fail('Qwen schema mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.failClosedRestorePassed !== true) fail('Qwen fail-closed mismatch')
if (record.readiness?.productFlowAfterQwenOrchestration !== 'ready_for_guarded_single_tester_qwen_product_flow_runtime_validation') {
  fail('readiness mismatch')
}
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.requiredRuntimePacketBoundary?.confirmationGate !== 'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_QWEN_PRODUCT_FLOW_RUNTIME') {
  fail('confirmation gate mismatch')
}
for (const key of [
  'approvedSnapshotReferenceRequired',
  'creditReservationReferenceRequired',
  'jobOrQueueLeaseReferenceRequired',
  'idempotencyKeyRequired',
  'privateInputManifestRequired',
  'privateArtifactManifestRequired',
  'privateArtifactChecksumRequired',
  'rollbackRequired',
  'cleanupPolicyRequired',
  'noPublicArtifactPolicyRequired',
]) {
  if (record.requiredRuntimePacketBoundary?.[key] !== true) fail(`missing runtime boundary requirement: ${key}`)
}
for (const [key, value] of Object.entries(record.blockedNow ?? {})) {
  if (value !== 'blocked') fail(`blockedNow status must remain blocked: ${key}`)
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnlyPacket') {
    if (value !== true) fail('docsOnlyPacket must be true')
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenFilePatterns) {
    if (pattern.test(file)) fail(`forbidden changed file: ${file}`)
  }
  const text = read(file)
  if (!file.endsWith('-diagnostics.mjs')) {
    for (const pattern of forbiddenContentPatterns) {
      if (
        file.startsWith('docs/external-beta/controlled-single-tester-qwen-product-flow-runtime-1/') &&
        allowedFollowOnRuntimeContentPatterns.has(String(pattern))
      ) {
        continue
      }
      if (pattern.test(text)) fail(`forbidden content matched in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_controlled_single_tester_product_flow_after_qwen_orchestration_source_readiness')
console.log('Next milestone: RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-QWEN-PRODUCT-FLOW-RUNTIME-1')
