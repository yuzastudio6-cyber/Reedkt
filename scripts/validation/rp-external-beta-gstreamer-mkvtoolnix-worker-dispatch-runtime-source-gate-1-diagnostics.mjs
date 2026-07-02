#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_source_gate'
const execution = 'completed_source_gate_dispatch_handoff_no_worker_dispatch_or_tool_execution'
const servicePath = 'server/services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1.ts'
const smokePath = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-smoke.ts'
const diagnosticsPath = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-diagnostics.mjs'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE'
const mergeSha = '1cd82653c437bcc5082ec7b54eb4d06098554a6c'
const runId = '2026-07-02T15-13-58-300Z-7afbfde3'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dispatch-source-gate.md`,
  `${dir}/safety-boundary.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1.md',
]

const sourceFiles = [
  servicePath,
  smokePath,
  diagnosticsPath,
]

const allowedChangedPatterns = [
  /^docs\/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-results\.md$/,
  /^docs\/external-beta\/gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1\//,
  /^docs\/implementation-prompts\/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1\.md$/,
  /^package\.json$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-diagnostics\.mjs$/,
  /^server\/services\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1\.ts$/,
  /^server\/smoke\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-smoke\.ts$/,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^docker\//,
  /^supabase\/migrations\//,
  /^supabase\/functions\//,
  /^database\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /workerProcessStart:\s*true/i,
  /"workerLeaseMutation"\s*:\s*true/i,
  /workerLeaseMutation:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /persistentJobQueueWrite:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /ffmpegFfprobeExecution:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /dockerExecution:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /remotionExecution:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /privateMediaProcessing:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /userMediaProcessing:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /supabaseMutation:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /sqlExecution:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /secretPayloadAccess:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /signedUrlCreation:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /finalRenderExport:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /externalBetaUnlock:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /paidProductionUnlock:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /productionUnlock:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  confirmEnv,
  mergeSha,
  runId,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  'quality_check',
  'gstreamer_mkvtoolnix_generated_fixture_runtime',
  'gstreamer_mkvtoolnix_generated_fixture_worker',
  'remote_supabase_worker_claim_lease_no_worker_execution',
  'claimedJobCannotBeReclaimedBeforeDispatch',
  'rollbackResidueVerified',
  'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked and excluded',
  nextMilestone,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

for (const file of [...packetFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'] !==
  `tsx ${smokePath}`
) fail('missing source-gate smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1:diagnostics'] !==
  `node ${diagnosticsPath}`
) fail('missing source-gate diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(servicePath)
for (const text of [
  'buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput',
  'validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput',
  'validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource',
  'blocked_missing_worker_dispatch_runtime_source_gate_confirmation',
  'blocked_unsafe_worker_dispatch_runtime_source_gate_request',
  'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
  'routeHandlerInvocation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]) {
  if (!service.includes(text)) fail(`service missing required source gate text: ${text}`)
}

const smoke = read(smokePath)
for (const text of [
  'confirmation_gate_blocks_source_gate',
  'source_gate_accepts_only_2155_remote_claim_lease_proof',
  'dispatch_envelope_created_metadata_only',
  'unsafe_dispatch_request_blocks',
  'invalid_source_chain_blocks',
  'local_mock_claim_lease_payload_blocks',
  'runtime_registered_worker_source_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required check: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmEnv) fail('record confirmation gate mismatch')
if (record.sourceChain?.remoteClaimLeaseValidationMergeSha !== mergeSha) fail('record merge SHA mismatch')
if (record.sourceChain?.remoteClaimLeaseValidationRunId !== runId) fail('record run ID mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('record target mismatch')
if (record.persistedJobType !== 'quality_check') fail('record job type mismatch')
if (record.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime') fail('record payload kind mismatch')
if (record.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution') fail('record claim lease mode mismatch')
if (record.dispatchEnvelopeReady !== true) fail('record dispatch envelope readiness mismatch')
for (const key of [
  'routeHandlerInvocation',
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseMutation',
  'persistentJobQueueWrite',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'externalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`record safety key must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('package-lock must remain unchanged')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts must remain none')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const changed = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changed)]
for (const file of uniqueChanged) {
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
  if (!allowedChangedPatterns.some((pattern) => pattern.test(file))) fail(`unexpected changed path: ${file}`)
}

const packageLockDiff = gitLines(['diff', '--name-only', '--', 'package-lock.json'])
const packageLockStaged = gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json'])
if (packageLockDiff.length > 0 || packageLockStaged.length > 0) fail('package-lock.json changed')

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  sourceGateMode: 'dispatch_handoff_source_gate_no_worker_start',
  dispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
