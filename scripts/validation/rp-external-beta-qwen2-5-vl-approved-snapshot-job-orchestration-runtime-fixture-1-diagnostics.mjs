#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-result.md`,
  `${packetDir}/artifact-manifest.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-record.json`,
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1.md',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1.mjs',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88',
  '#1410',
  '#1407',
  '#1403',
  '#577',
  'REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE',
  'rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1',
  'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_QA_ROLLUP_1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedFollowUpFiles = [
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qa-rollup.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/artifact-manifest-review.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/validation-results.md',
  'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1/qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-record.json',
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1.md',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-qa-rollup-1-diagnostics.mjs',
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (!String(record.decision).includes('qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture')) {
  fail('decision does not reference runtime fixture')
}
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationE2EPr !== 1410) fail('source PR mismatch')
if (record.sourceEvidence?.approvedSnapshotJobOrchestrationE2EMergeSha !== '8e4c79d11a41e9a6733eabcc00acfd5e7794eb88') {
  fail('source merge SHA mismatch')
}
if (record.readiness?.externalBetaUnlocked !== false) fail('external beta must remain locked')
if (record.safety?.supabaseMutation !== false || record.safety?.sqlExecution !== false) fail('Supabase/SQL safety mismatch')
if (record.safety?.creditMutation !== false) fail('credit mutation safety mismatch')
if (record.safety?.workerDispatch !== false || record.safety?.workerExecution !== false) fail('worker safety mismatch')
if (record.safety?.signedUrlCreation !== false || record.safety?.publicArtifactCreation !== false) {
  fail('artifact publication safety mismatch')
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

if (record.decision === 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture') {
  if (record.execution !== 'completed_confirmed_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture') {
    fail('completed execution mismatch')
  }
  if (record.runtime?.confirmed !== true) fail('completed record must be confirmed')
  if (!record.runtime?.runId || !record.runtime?.outputDir) fail('completed record missing runtime evidence')
  if (record.runtime?.httpStatus !== 200) fail('completed runtime HTTP status mismatch')
  if (record.runtime?.structuredMetadataAccepted !== true) fail('completed runtime metadata acceptance mismatch')
  if (record.runtime?.failClosedRestorePassed !== true) fail('completed runtime fail-closed restore mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1'] !==
  'node scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1.mjs'
) {
  fail('missing runtime fixture script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...allowedFollowUpFiles])
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
  if (/externalBetaUnlock(?:ed|AllowedNow|AppliedToEnvironment)?\"?\s*:\s*true/i.test(text)) {
    fail(`external beta unlock claim in ${file}`)
  }
  if (/supabaseMutation\"?\s*:\s*true|sqlExecution\"?\s*:\s*true|creditMutation\"?\s*:\s*true/i.test(text)) {
    fail(`forbidden mutation claim in ${file}`)
  }
  if (/workerExecution\"?\s*:\s*true|workerDispatch\"?\s*:\s*true/i.test(text)) fail(`worker execution claim in ${file}`)
  if (/signedUrlCreation\"?\s*:\s*true|publicArtifactCreation\"?\s*:\s*true/i.test(text)) {
    fail(`signed/public artifact claim in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${record.decision}`)
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_QA_ROLLUP_1')
