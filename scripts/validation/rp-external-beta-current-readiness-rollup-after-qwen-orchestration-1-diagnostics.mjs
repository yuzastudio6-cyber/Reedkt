#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CURRENT-READINESS-ROLLUP-AFTER-QWEN-ORCHESTRATION-1'
const packetDir = 'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/readiness-rollup.md`,
  `${packetDir}/blocker-matrix.md`,
  `${packetDir}/qwen-evidence-review.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/current-readiness-rollup-record.json`,
  'docs/activation-phase-rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1.md',
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'package.json',
]

const allowedSupportFiles = [
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-diagnostics.mjs',
]

const followOnControlledSingleTesterProductFlowAfterQwenFiles = [
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/source-audit.md',
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/product-flow-bridge.md',
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/blocker-matrix.md',
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/safety-boundary.md',
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/validation-results.md',
  'docs/external-beta/controlled-single-tester-product-flow-after-qwen-orchestration-1/controlled-single-tester-product-flow-after-qwen-orchestration-record.json',
  'docs/activation-phase-rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-single-tester-qwen-product-flow-runtime-1.md',
  'scripts/validation/rp-external-beta-controlled-single-tester-product-flow-after-qwen-orchestration-1-diagnostics.mjs',
]

const followOnReleaseGoNoGo1rFiles = [
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/source-audit.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/compatibility-decision.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/validation-results.md',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/release-go-no-go-1r-record.json',
  'docs/activation-phase-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker.md',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
]

const followOnQwenRealDispatchAuthPathReadbackFiles = [
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/auth-path-readback.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/readiness-boundary.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-auth-path-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-real-dispatch-auth-path-readback-1.md',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-auth-path-readback-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_external_beta_current_readiness_rollup_after_qwen_orchestration',
  'completed_docs_only_external_beta_readiness_rollup_no_runtime_execution',
  '2b32604324fb843d3c52c9a006dffda3f685b441',
  '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88',
  '9ead78060f666afb9bc5725f8c9abc720b3a5f4a',
  '#1410',
  '#1414',
  '#1417',
  '#577',
  'qa_passed_confirmed_runtime_fixture_evidence',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  'reeditpro-qwen2-5-vl-private-caller-4qv7m',
  'qwen_fixture_inference_smoke_completed',
  'ready_for_controlled_single_tester_product_flow_after_qwen_orchestration',
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  'aiediting@reeditpro.com',
  'blocked_no_additional_named_tester_list',
  'External beta enabled by this packet: `false`',
  'External beta global unlock: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1',
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

const record = JSON.parse(read(`${packetDir}/current-readiness-rollup-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_current_readiness_rollup_after_qwen_orchestration') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_external_beta_readiness_rollup_no_runtime_execution') fail('execution mismatch')
if (record.integrationHead !== '2b32604324fb843d3c52c9a006dffda3f685b441') fail('integration head mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationE2EPr !== 1410) fail('E2E source PR mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationRuntimeFixturePr !== 1414) fail('runtime fixture source PR mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationQaRollupPr !== 1417) fail('QA rollup source PR mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationQaRollupMergeSha !== '2b32604324fb843d3c52c9a006dffda3f685b441') {
  fail('QA rollup merge SHA mismatch')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('excluded PR mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') fail('Qwen status mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.httpStatus !== 200) fail('Qwen HTTP status mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.structuredMetadataAccepted !== true) fail('Qwen metadata acceptance mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.schemaValid !== true) fail('Qwen schema status mismatch')
if (record.qwenApprovedSnapshotJobOrchestration?.failClosedRestorePassed !== true) fail('Qwen fail-closed restore mismatch')
if (
  record.statuses?.externalProductBeta !==
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list'
) {
  fail('external product beta status mismatch')
}
if (record.statuses?.controlledTester !== 'aiediting@reeditpro.com') fail('controlled tester mismatch')
if (record.statuses?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('tester expansion status mismatch')
if (
  record.statuses?.qwenApprovedSnapshotJobOrchestration !==
  'ready_for_controlled_single_tester_product_flow_after_qwen_orchestration'
) {
  fail('Qwen readiness mismatch')
}
for (const key of ['publicArtifacts', 'broadMedia', 'paidProduction', 'finalDeliveryExport', 'productionUnlock']) {
  if (record.statuses?.[key] !== 'blocked') fail(`${key} must remain blocked`)
}
if (record.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.safety?.qwenRuntimeExecutedInThisPacket !== false) fail('Qwen runtime in this packet mismatch')
if (record.safety?.providerCallInThisPacket !== false || record.safety?.modelCallInThisPacket !== false) {
  fail('provider/model call in this packet mismatch')
}
if (record.safety?.routeExecutionInThisPacket !== false) fail('route execution in this packet mismatch')
if (record.safety?.supabaseMutation !== false || record.safety?.sqlExecution !== false) fail('Supabase/SQL safety mismatch')
if (record.safety?.secretManagerPayloadAccess !== false) fail('secret payload safety mismatch')
if (record.safety?.creditMutation !== false) fail('credit mutation safety mismatch')
if (record.safety?.workerDispatch !== false || record.safety?.workerExecution !== false) fail('worker safety mismatch')
if (record.safety?.signedUrlCreation !== false || record.safety?.publicArtifactCreation !== false) {
  fail('artifact safety mismatch')
}
if (record.safety?.mediaProcessing !== false || record.safety?.finalRenderExport !== false) fail('media/render safety mismatch')
if (record.safety?.externalBetaEnabledByThisPacket !== false || record.safety?.externalBetaGlobalUnlock !== false) {
  fail('external beta unlock safety mismatch')
}
if (record.safety?.productionUnlock !== false) fail('production unlock mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1') {
  fail('next milestone mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs'
) {
  fail('missing current readiness rollup diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([
  ...requiredFiles,
  ...allowedSupportFiles,
  ...followOnControlledSingleTesterProductFlowAfterQwenFiles,
  ...followOnReleaseGoNoGo1rFiles,
  ...followOnQwenRealDispatchAuthPathReadbackFiles,
])
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (
    /^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\/|^server\/services\/|^server\/smoke\/|^src\//i.test(
      file,
    )
  ) {
    fail(`forbidden changed file: ${file}`)
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
  if (/externalBetaGlobalUnlock\"?\s*:\s*true|External beta global unlock:\s*`?true`?/i.test(text)) {
    fail(`external beta global unlock claim in ${file}`)
  }
  if (/externalBetaEnabledByThisPacket\"?\s*:\s*true|External beta enabled by this packet:\s*`?true`?/i.test(text)) {
    fail(`external beta packet enablement claim in ${file}`)
  }
  if (/qwenRuntimeExecutedInThisPacket\"?\s*:\s*true/i.test(text)) fail(`Qwen runtime execution in this packet claim in ${file}`)
  if (/providerCallInThisPacket\"?\s*:\s*true|modelCallInThisPacket\"?\s*:\s*true/i.test(text)) {
    fail(`provider/model call in this packet claim in ${file}`)
  }
  if (/routeExecutionInThisPacket\"?\s*:\s*true/i.test(text)) fail(`route execution in this packet claim in ${file}`)
  if (/workerExecution\"?\s*:\s*true|workerDispatch\"?\s*:\s*true/i.test(text)) fail(`worker execution claim in ${file}`)
  if (/supabaseMutation\"?\s*:\s*true|sqlExecution\"?\s*:\s*true/i.test(text)) fail(`Supabase/SQL claim in ${file}`)
  if (/creditMutation\"?\s*:\s*true|creditSpend\"?\s*:\s*true/i.test(text)) fail(`credit mutation/spend claim in ${file}`)
  if (/signedUrlCreation\"?\s*:\s*true|publicArtifactCreation\"?\s*:\s*true/i.test(text)) {
    fail(`signed/public artifact claim in ${file}`)
  }
  if (/mediaProcessing\"?\s*:\s*true|finalRenderExport\"?\s*:\s*true/i.test(text)) fail(`media/render claim in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_current_readiness_rollup_after_qwen_orchestration')
console.log('Next milestone: RP-EXTERNAL-BETA-CONTROLLED-SINGLE-TESTER-PRODUCT-FLOW-AFTER-QWEN-ORCHESTRATION-1')
