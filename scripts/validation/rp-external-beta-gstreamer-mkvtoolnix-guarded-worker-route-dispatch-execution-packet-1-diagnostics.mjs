#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PACKET-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-record.json`
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-record.json'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only'
const execution = 'completed_confirmation_gated_local_route_handler_invocation_metadata_only_no_worker_or_tool_execution'
const integrationBase = '9246c0635363ea955e3f6076470aa78797c686cb'
const runId = '2026-07-01T01-48-47-456Z-977b002e'
const gate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_EXECUTION=true'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-DISPATCH-EXECUTION-PACKET-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-dispatch-execution-result.md`,
  `${dir}/route-handler-metadata.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1.md',
]

const workerDispatchExecutionPacketFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/worker-dispatch-execution-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/worker-dispatch-metadata.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/artifact-manifest-summary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  sourceRecordPath,
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1/gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...workerDispatchExecutionPacketFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  runId,
  gate,
  'Confirmation gate observed: `present_true`',
  'completed_guarded_local_route_contract_handler_invocation_metadata_only',
  'accepted_guarded_local_route_contract_handler_metadata_only',
  'registered_disabled_backend_service_role_route_contract',
  'worker_dispatch_attempt_blocks',
  'public_artifact_attempt_blocks',
  'final_render_attempt_blocks',
  'blocked_runtime_execution_not_enabled',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_delivery_or_unlock_attempt',
  'HTTP server started: `false`',
  'Real route execution: `false`',
  'Worker dispatch: `false`',
  'Worker execution: `false`',
  'Worker lease claim: `false`',
  'Persistent job queue write: `false`',
  'GStreamer execution in this route dispatch execution packet: `false`',
  'MKVToolNix execution in this route dispatch execution packet: `false`',
  '4d3832c412ae269e8563cc8035e79ed237e8eede00085330d9133165f90ab6c9',
  '33b92dab8e7f046694b5e50c2ac46ea290d15d195e65b5deb33f5ef1bc843958',
  '50459ba4b664870fabba17bc5a06ff7723066171f9ddc60f458f21cda0aaec80',
  '19bd7da4f284779e2ab1c6b4dacd1ceff9cf693c0932ef93ccf2c13de3f96458',
  '025b2c6c78dcdb1e4c0dcb27a5d680c75cce4d4d9281cc299a1aaa94ed575d56',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:HTTP server started|Real route execution|Worker dispatch|Worker execution|Worker lease claim|Persistent job queue write|GStreamer execution in this route dispatch execution packet|MKVToolNix execution in this route dispatch execution packet|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private media processing|User media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"httpServerStarted"\s*:\s*true/i,
  /"realRouteExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"gstreamerExecutionInThisRouteDispatchExecutionPacket"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisRouteDispatchExecutionPacket"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"dockerPushDeploy"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1'] !==
  'tsx scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1.ts'
) {
  fail('missing guarded route-dispatch execution-packet package script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-diagnostics.mjs'
) {
  fail('missing guarded route-dispatch execution-packet diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate mismatch')
if (record.sourceChain?.routeDispatchExecutionPlanPr !== 1935) fail('source plan PR mismatch')
if (record.sourceChain?.routeDispatchExecutionPlanMergeSha !== integrationBase) fail('source plan merge mismatch')
if (record.sourceChain?.routeDispatchDryRunPr !== 1929) fail('source dry-run PR mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeHandlerMetadata?.status !== 'accepted_guarded_local_route_contract_handler_metadata_only') fail('route handler status mismatch')
if (record.routeHandlerMetadata?.routeHandlerInvocation !== 'completed_guarded_local_route_contract_handler_invocation_metadata_only') fail('route handler invocation mismatch')
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'workerLeaseClaim', 'persistentJobQueueWrite', 'gstreamerExecution', 'mkvtoolnixExecution', 'mediaProcessing', 'signedUrlCreation', 'publicArtifactCreation', 'finalRenderExport']) {
  if (record.routeHandlerMetadata?.[key] !== false) fail(`${key} must be false`)
}
if (!Array.isArray(record.negativeChecks) || !record.negativeChecks.every((check) => check.passed === true)) fail('negative checks mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 5) fail('artifact count mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'guardedLocalRouteContractHandlerInvocationMetadataOnly') {
    if (value !== true) fail('metadata-only safety flag must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (!['pending', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_plan_ready_for_confirmation_gated_execution_packet') fail('source plan decision mismatch')
if (sourceRecord.validation !== 'passed') fail('source plan validation mismatch')
if (sourceRecord.nextMilestone !== packet) fail('source plan next milestone mismatch')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json has unstaged changes')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json has staged changes')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Execution: ${execution}`)
console.log(`Run ID: ${runId}`)
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
