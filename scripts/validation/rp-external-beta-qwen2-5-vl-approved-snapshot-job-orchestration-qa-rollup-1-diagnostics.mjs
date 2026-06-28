#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_QA_ROLLUP_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/qa-rollup.md`,
  `${packetDir}/artifact-manifest-review.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json`,
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1.md',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedSupportFiles = [
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_approved_snapshot_job_orchestration_qa_rollup',
  'completed_docs_only_qwen2_5_vl_approved_snapshot_job_orchestration_qa_review_no_runtime_execution',
  '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88',
  '9ead78060f666afb9bc5725f8c9abc720b3a5f4a',
  '#1410',
  '#1414',
  '#577',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  'qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-2026-06-28T07-37-03-392Z-e5ac2657',
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T07-37-03-448Z-a3702726',
  'qwen25-adapter-runtime-fixture-2026-06-28T07-37-03-875Z-569ad1be',
  'reeditpro-qwen2-5-vl-private-caller-4qv7m',
  'HTTP status: `200`',
  'Structured metadata accepted: `true`',
  'Fail-closed restore: `passed`',
  'qa_passed_confirmed_runtime_fixture_evidence',
  'ready_for_external_beta_current_readiness_rollup_after_qwen_orchestration_runtime',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-CURRENT-READINESS-ROLLUP-AFTER-QWEN-ORCHESTRATION-1',
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_qa_rollup') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen2_5_vl_approved_snapshot_job_orchestration_qa_review_no_runtime_execution') {
  fail('execution mismatch')
}
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationE2EPr !== 1410) fail('E2E PR mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationE2EMergeSha !== '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88') {
  fail('E2E merge SHA mismatch')
}
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationRuntimeFixturePr !== 1414) fail('runtime fixture PR mismatch')
if (
  record.sourceEvidence?.approvedSnapshotJobOrchestrationRuntimeFixtureMergeSha !==
  '9ead78060f666afb9bc5725f8c9abc720b3a5f4a'
) {
  fail('runtime fixture merge SHA mismatch')
}
if (record.sourceEvidence?.excludedPr !== 577) fail('excluded PR mismatch')
if (record.acceptedRuntimeEvidence?.httpStatus !== 200) fail('accepted HTTP status mismatch')
if (record.acceptedRuntimeEvidence?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.acceptedRuntimeEvidence?.structuredMetadataAccepted !== true) fail('metadata acceptance mismatch')
if (record.acceptedRuntimeEvidence?.schemaValid !== true) fail('schema status mismatch')
if (record.acceptedRuntimeEvidence?.failClosedRestorePassed !== true) fail('fail-closed restore mismatch')
if (record.qa?.status !== 'qa_passed_confirmed_runtime_fixture_evidence') fail('QA status mismatch')
if (record.qa?.approvedSnapshotGateReviewed !== true) fail('approved snapshot gate review mismatch')
if (record.qa?.creditReservationGateReviewed !== true) fail('credit reservation gate review mismatch')
if (record.qa?.jobLeaseGateReviewed !== true) fail('job lease gate review mismatch')
if (record.qa?.privateArtifactManifestGateReviewed !== true) fail('private artifact manifest gate review mismatch')
if (
  record.readiness?.qwenApprovedSnapshotJobOrchestration !==
  'ready_for_external_beta_current_readiness_rollup_after_qwen_orchestration_runtime'
) {
  fail('readiness mismatch')
}
if (record.readiness?.externalBetaUnlocked !== false) fail('external beta must remain locked')
if (record.safety?.runtimeExecutedInThisRollup !== false) fail('runtime execution in rollup mismatch')
if (record.safety?.providerCallInThisRollup !== false || record.safety?.modelCallInThisRollup !== false) {
  fail('provider/model call in rollup mismatch')
}
if (record.safety?.routeExecutionInThisRollup !== false) fail('route execution in rollup mismatch')
if (record.safety?.supabaseMutation !== false || record.safety?.sqlExecution !== false) fail('Supabase/SQL safety mismatch')
if (record.safety?.creditMutation !== false) fail('credit mutation safety mismatch')
if (record.safety?.workerDispatch !== false || record.safety?.workerExecution !== false) fail('worker safety mismatch')
if (record.safety?.signedUrlCreation !== false || record.safety?.publicArtifactCreation !== false) {
  fail('artifact publication safety mismatch')
}
if (record.safety?.mediaProcessing !== false || record.safety?.finalRenderExport !== false) fail('media/render safety mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-CURRENT-READINESS-ROLLUP-AFTER-QWEN-ORCHESTRATION-1') {
  fail('next milestone mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing QA rollup diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...allowedSupportFiles])
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (
    /^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\/|^server\/services\/|^server\/smoke\/|^src\//i.test(
      file,
    )
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
  if (/externalBetaUnlock(?:ed|AllowedNow|AppliedToEnvironment)?\"?\s*:\s*true/i.test(text)) {
    fail(`external beta unlock claim in ${file}`)
  }
  if (/runtimeExecutedInThisRollup\"?\s*:\s*true|Runtime in this rollup phase:\s*`?(?:run|executed|completed)/i.test(text)) {
    fail(`runtime execution in rollup claim in ${file}`)
  }
  if (/providerCallInThisRollup\"?\s*:\s*true|modelCallInThisRollup\"?\s*:\s*true/i.test(text)) {
    fail(`provider/model call in rollup claim in ${file}`)
  }
  if (/routeExecutionInThisRollup\"?\s*:\s*true/i.test(text)) fail(`route execution in rollup claim in ${file}`)
  if (/workerExecution\"?\s*:\s*true|workerDispatch\"?\s*:\s*true/i.test(text)) fail(`worker execution claim in ${file}`)
  if (/supabaseMutation\"?\s*:\s*true|sqlExecution\"?\s*:\s*true/i.test(text)) fail(`Supabase/SQL claim in ${file}`)
  if (/creditMutation\"?\s*:\s*true|creditSpend\"?\s*:\s*true/i.test(text)) fail(`credit mutation/spend claim in ${file}`)
  if (/signedUrlCreation\"?\s*:\s*true|publicArtifactCreation\"?\s*:\s*true/i.test(text)) {
    fail(`signed/public artifact claim in ${file}`)
  }
  if (/mediaProcessing\"?\s*:\s*true|finalRenderExport\"?\s*:\s*true/i.test(text)) fail(`media/render claim in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_approved_snapshot_job_orchestration_qa_rollup')
console.log('Next milestone: RP-EXTERNAL-BETA-CURRENT-READINESS-ROLLUP-AFTER-QWEN-ORCHESTRATION-1')
