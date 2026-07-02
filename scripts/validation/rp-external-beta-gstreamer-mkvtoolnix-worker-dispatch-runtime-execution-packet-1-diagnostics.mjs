#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet'
const execution = 'completed_confirmation_gated_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate'
const servicePath = 'server/services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1.ts'
const smokePath = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-smoke.ts'
const runnerPath = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1.ts'
const diagnosticsPath = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-diagnostics.mjs'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET'
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const dryRunMergeSha = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const dryRunRunId = '2026-07-02T16-10-17-014Z-eec19f59'
const runId = '2026-07-02T16-27-38-186Z-1ce73813'
const runtimeDelegateRunId = '2026-07-02T16-27-38-291Z-a5f6a279'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-QA-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-runtime-execution-packet.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1.md',
]

const sourceFiles = [
  servicePath,
  smokePath,
  runnerPath,
  diagnosticsPath,
]

const allowedChangedPatterns = [
  /^docs\/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-results\.md$/,
  /^docs\/external-beta\/gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\//,
  /^docs\/implementation-prompts\/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-qa-1\.md$/,
  /^package\.json$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1-diagnostics\.mjs$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1-diagnostics\.mjs$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\.ts$/,
  /^scripts\/validation\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1-diagnostics\.mjs$/,
  /^server\/services\/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1\.ts$/,
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
  /"realWorkerDispatch"\s*:\s*true/i,
  /realWorkerDispatch:\s*true/i,
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
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /ffmpegFfprobeExecution:\s*true/i,
  /"dockerPushDeploy"\s*:\s*true/i,
  /dockerPushDeploy:\s*true/i,
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
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /serviceRoleSecretPayloadAccess:\s*true/i,
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
  dryRunMergeSha,
  dryRunRunId,
  runId,
  runtimeDelegateRunId,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts',
  'quality_check',
  'gstreamer_mkvtoolnix_generated_fixture_runtime',
  'gstreamer_mkvtoolnix_generated_fixture_worker',
  'remote_supabase_worker_claim_lease_no_worker_execution',
  'dry_run_dispatch_envelope_no_route_no_worker_start',
  'completed_guarded_route_handler',
  'completed_existing_guarded_route_delegate',
  'completed_controlled_generated_fixture_only',
  'completed_local_image_only_network_disabled_no_push_no_deploy',
  'rollback-remote-claim-lease-already-verified-no-persistent-dispatch-residue',
  'cleanup-tmp-evidence-only-no-persistent-public-artifacts',
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'] !==
  `tsx ${smokePath}`
) fail('missing execution packet smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'] !==
  `tsx ${runnerPath}`
) fail('missing execution packet runner package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1:diagnostics'] !==
  `node ${diagnosticsPath}`
) fail('missing execution packet diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(servicePath)
for (const text of [
  'runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun',
  'runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge',
  'blocked_missing_worker_dispatch_runtime_execution_packet_confirmation',
  'blocked_invalid_worker_dispatch_runtime_execution_packet_dry_run_source',
  'blocked_worker_dispatch_runtime_execution_packet_route_delegate_safety_invalid',
  'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate',
  'routeHandlerInvocationRequestedNow',
  'runtimeRouteDelegateRequestedNow',
  'realWorkerDispatch: false',
  'workerExecution: false',
  'workerLeaseMutation: false',
  'persistentJobQueueWrite: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]) {
  if (!service.includes(text)) fail(`service missing required execution packet text: ${text}`)
}

const smoke = read(smokePath)
for (const text of [
  'confirmation_gate_blocks_before_route_delegate',
  'execution_packet_accepts_only_2158_2162_source_evidence',
  'route_path_worker_source_idempotency_cleanup_and_evidence_are_recorded',
  'fake_route_delegate_success_path_records_controlled_generated_fixture_runtime_only',
  'invalid_dry_run_source_blocks',
  'idempotency_mismatch_blocks',
  'worker_dispatch_request_blocks',
  'unsafe_route_delegate_safety_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing required check: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmEnv) fail('record confirmation gate mismatch')
if (record.sourceChain?.sourceGateMergeSha !== sourceGateMergeSha) fail('record source-gate merge SHA mismatch')
if (record.sourceChain?.dryRunMergeSha !== dryRunMergeSha) fail('record dry-run merge SHA mismatch')
if (record.sourceChain?.dryRunRunId !== dryRunRunId) fail('record dry-run run ID mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('record target mismatch')
if (record.routePath !== '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute') {
  fail('record route path mismatch')
}
if (record.workerSourcePath !== 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts') {
  fail('record worker source path mismatch')
}
if (record.persistedJobType !== 'quality_check') fail('record job type mismatch')
if (record.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime') fail('record payload kind mismatch')
if (record.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution') fail('record claim lease mode mismatch')
if (record.dryRunDispatchEnvelopeMode !== 'dry_run_dispatch_envelope_no_route_no_worker_start') fail('record dry-run envelope mismatch')
if (record.runtimeRouteDelegate?.runnerRunId !== runtimeDelegateRunId) fail('record runtime delegate run ID mismatch')
if (record.routeHandlerInvocation !== 'completed_guarded_route_handler') fail('route handler invocation status mismatch')
if (record.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('gstreamer controlled execution status mismatch')
if (record.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('mkvtoolnix controlled execution status mismatch')
if (record.mediaProcessing !== 'controlled_generated_fixture_only') fail('media processing controlled fixture status mismatch')
if (record.dockerExecution !== 'completed_local_image_only_network_disabled_no_push_no_deploy') fail('docker execution status mismatch')
for (const key of [
  'realWorkerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseMutation',
  'persistentJobQueueWrite',
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'dockerPushDeploy',
  'remotionExecution',
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
if (record.nextMilestone !== nextMilestone) fail('record next milestone mismatch')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedPatterns.some((pattern) => pattern.test(file))) {
    fail(`changed file outside allowed execution-packet scope: ${file}`)
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
  runId,
  changedFiles: uniqueChangedFiles,
}, null, 2))
