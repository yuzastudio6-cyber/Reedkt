#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_1'
const packetDir = 'docs/external-beta/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/orchestration-contract.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-record.json`,
  'docs/activation-phase-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1.md',
  'server/services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e.ts',
  'server/smoke/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1-smoke.ts',
  'scripts/validation/rp-external-beta-qwen2-5-vl-product-route-runtime-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'completed_qwen2_5_vl_approved_snapshot_job_orchestration_e2e_source_contract',
  'completed_backend_only_approved_snapshot_job_orchestration_source_no_runtime_execution',
  'ready_for_guarded_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture',
  'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1',
  '71fe816d96135674bb634389ae08e2358806c33f',
  '#1116',
  '#1118',
  '#1123',
  '#1128',
  '#1380',
  '#1403',
  '#1407',
  '#577',
  'approvedSnapshotRef',
  'creditReservationRef',
  'workerLeaseRef',
  'routeIdempotencyKey',
  'privateArtifactManifestRef',
  'privateArtifactChecksumRef',
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-59-27-133Z-37e1aba2',
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

const record = JSON.parse(read(`${packetDir}/qwen2-5-vl-approved-snapshot-job-orchestration-e2e-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen2_5_vl_approved_snapshot_job_orchestration_e2e_source_contract') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_backend_only_approved_snapshot_job_orchestration_source_no_runtime_execution') {
  fail('execution mismatch')
}
if (
  record.readiness?.qwenApprovedSnapshotJobOrchestration !==
  'ready_for_guarded_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture'
) {
  fail('readiness mismatch')
}
if (record.readiness?.externalBetaUnlocked !== false) fail('external beta must remain locked')
if (record.sourceEvidence?.qwenProductRouteRuntimeReadinessRollupMergeSha !== '71fe816d96135674bb634389ae08e2358806c33f') {
  fail('rollup merge SHA mismatch')
}
if (record.requiredState?.approvedSnapshotStatus !== 'approved') fail('approved snapshot state mismatch')
if (record.requiredState?.creditReservationStatus !== 'reserved') fail('credit reservation state mismatch')
if (record.requiredState?.qwenProductRouteRuntimeHttpStatus !== 200) fail('Qwen runtime HTTP status mismatch')
if (record.requiredState?.qwenStructuredMetadataAccepted !== true) fail('Qwen structured metadata status mismatch')
if (record.safety?.providerCall !== false || record.safety?.modelCall !== false) fail('provider/model safety mismatch')
if (record.safety?.workerExecution !== false || record.safety?.workerDispatch !== false) fail('worker safety mismatch')
if (record.safety?.supabaseMutation !== false || record.safety?.sqlExecution !== false) fail('Supabase/SQL safety mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['smoke:qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1'] !==
  'tsx server/smoke/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-e2e-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set(requiredFiles)
for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (
    /^package-lock\.json$|^supabase\/|^database\/|^docker\/|^\.github\/|^\.env|^requirements|^server\/routes\/|^server\/workers\/|^src\/(?!backend\/)/i.test(
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
  if (/externalBetaUnlock(?:ed|AllowedNow|AppliedToEnvironment)\"?\s*:\s*true/i.test(text)) {
    fail(`external beta unlock claim in ${file}`)
  }
  if (/providerCall\"?\s*:\s*true|modelCall\"?\s*:\s*true/i.test(text)) fail(`provider/model call claim in ${file}`)
  if (/workerExecution\"?\s*:\s*true|workerDispatch\"?\s*:\s*true/i.test(text)) fail(`worker execution claim in ${file}`)
  if (/supabaseMutation\"?\s*:\s*true|sqlExecution\"?\s*:\s*true/i.test(text)) fail(`Supabase/SQL execution claim in ${file}`)
  if (/signedUrlCreation\"?\s*:\s*true|publicArtifactCreation\"?\s*:\s*true/i.test(text)) {
    fail(`signed/public artifact claim in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen2_5_vl_approved_snapshot_job_orchestration_e2e_source_contract')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1')
