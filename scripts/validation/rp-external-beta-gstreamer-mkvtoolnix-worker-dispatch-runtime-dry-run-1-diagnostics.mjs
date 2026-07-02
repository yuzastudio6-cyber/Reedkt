#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_dry_run'
const execution = 'completed_confirmation_gated_worker_dispatch_dry_run_no_worker_start_or_tool_execution'
const servicePath = 'server/services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1.ts'
const smokePath = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-smoke.ts'
const runnerPath = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1.ts'
const diagnosticsPath = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-diagnostics.mjs'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN'
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const claimLeaseMergeSha = '1cd82653c437bcc5082ec7b54eb4d06098554a6c'
const claimLeaseRunId = '2026-07-02T15-13-58-300Z-7afbfde3'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-runtime-dry-run.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1.md',
]

const sourceFiles = [
  servicePath,
  smokePath,
  runnerPath,
  diagnosticsPath,
]

const allowedChangedPatterns = [
  /^docs\/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-results\.md$/,
  /^docs\/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-results\.md$/,
  /^docs\/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-results\.md$/,
  /^docs\/external-beta\/gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1\//,
  /^docs\/external-beta\/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\//,
  /^docs\/external-beta\/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1\//,
  /^docs\/implementation-prompts\/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\.md$/,
  /^docs\/implementation-prompts\/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1\.md$/,
  /^docs\/implementation-prompts\/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-handoff-1\.md$/,
  /^package\.json$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-diagnostics\.mjs$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1\.ts$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-diagnostics\.mjs$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\.ts$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-diagnostics\.mjs$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1-diagnostics\.mjs$/,
  /^server\/services\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1\.ts$/,
  /^server\/services\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\.ts$/,
  /^server\/smoke\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-smoke\.ts$/,
  /^server\/smoke\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-smoke\.ts$/,
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
  /"routeHandlerInvocation"\s*:\s*true/i,
  /routeHandlerInvocation:\s*true/i,
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
  sourceGateMergeSha,
  claimLeaseMergeSha,
  claimLeaseRunId,
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
  'worker_dispatch_handoff_dry_run_no_worker_start',
  'dry_run_dispatch_envelope_no_route_no_worker_start',
  'routeHandlerInvocation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'workerProcessStart: false',
  'workerLeaseMutation: false',
  'persistentJobQueueWrite: false',
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'] !==
  `tsx ${smokePath}`
) fail('missing dry-run smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'] !==
  `tsx ${runnerPath}`
) fail('missing dry-run runner package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1:diagnostics'] !==
  `node ${diagnosticsPath}`
) fail('missing dry-run diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(servicePath)
for (const text of [
  'runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate',
  'blocked_missing_worker_dispatch_runtime_dry_run_confirmation',
  'blocked_invalid_worker_dispatch_runtime_dry_run_source_gate',
  'blocked_unsafe_worker_dispatch_runtime_dry_run_request',
  'dry_run_dispatch_envelope_no_route_no_worker_start',
  'routeHandlerInvocation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'workerProcessStart: false',
  'workerLeaseMutation: false',
  'persistentJobQueueWrite: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]) {
  if (!service.includes(text)) fail(`service missing required dry-run text: ${text}`)
}

const smoke = read(smokePath)
for (const text of [
  'confirmation_gate_blocks_worker_dispatch_runtime_dry_run',
  'dry_run_accepts_only_2158_source_gate_evidence',
  'dry_run_dispatch_envelope_created_metadata_only',
  'invalid_source_gate_blocks',
  'invalid_dry_run_mode_blocks',
  'idempotency_mismatch_blocks',
  'worker_dispatch_request_blocks',
  'tool_execution_request_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required check: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmEnv) fail('record confirmation gate mismatch')
if (record.sourceChain?.sourceGateMergeSha !== sourceGateMergeSha) fail('record source-gate merge SHA mismatch')
if (record.sourceChain?.remoteClaimLeaseValidationMergeSha !== claimLeaseMergeSha) fail('record claim lease merge SHA mismatch')
if (record.sourceChain?.remoteClaimLeaseValidationRunId !== claimLeaseRunId) fail('record claim lease run ID mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('record target mismatch')
if (record.persistedJobType !== 'quality_check') fail('record job type mismatch')
if (record.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime') fail('record payload kind mismatch')
if (record.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution') fail('record claim mode mismatch')
if (record.dryRunMode !== 'worker_dispatch_handoff_dry_run_no_worker_start') fail('record dry-run mode mismatch')
if (record.dryRunDispatchEnvelopeMode !== 'dry_run_dispatch_envelope_no_route_no_worker_start') fail('record dry-run envelope mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('record product-ready count must remain 0')
if (record.packageLock !== 'unchanged') fail('record package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('record generated artifact status mismatch')
if (record.nextMilestone !== nextMilestone) fail('record next milestone mismatch')

for (const [key, value] of Object.entries(record)) {
  if (
    [
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
    ].includes(key) &&
    value !== false
  ) {
    fail(`record ${key} must remain false`)
  }
}

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedPatterns.some((pattern) => pattern.test(file))) {
    fail(`changed file outside allowed dry-run scope: ${file}`)
  }
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) {
    fail(`forbidden changed path: ${file}`)
  }
}

const changedCorpus = uniqueChangedFiles
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  changedFiles: uniqueChangedFiles,
}, null, 2))
