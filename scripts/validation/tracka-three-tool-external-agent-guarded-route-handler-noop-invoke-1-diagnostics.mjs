#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-GUARDED-ROUTE-HANDLER-NOOP-INVOKE-1'
const decision = 'completed_three_tool_external_agent_guarded_route_handler_noop_invoke'
const execution =
  'completed_confirmation_gated_three_tool_guarded_noop_route_handler_invoke_no_worker_tool_media_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_ROUTE_HANDLER_NOOP_INVOKE=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-GUARDED-WORKER-DISPATCH-NOOP-INVOKE-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-record.json`
const sourceDispatchDryRunRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceDispatchDryRunMergeSha = 'a5efbe7edf5ba791b303feac85412618528b387e'
const sourceDispatchDryRunHeadSha = 'a447c02b69b0bee7a29676fbe35cb0d606251a0e'
const sourceDispatchDryRunRunId = '2026-07-03T01-06-54-981Z-9c34363c'
const runId = '2026-07-03T01-16-23-668Z-c161d492'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/${runId}`
const reportSha = '8ae4573d75e28eb6560c9f6d07372f2142ebf998ab5d328aab0f6a25c36da0af'
const manifestSha = '88acb2d44c3ad54065f9fe02a21f86d623ae57e9ebf03ef39a18fb7f57c79ad0'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/noop-invoke-result.md`,
  `${dir}/route-handler-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts',
  'server/cli/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-diagnostics.mjs',
  'package.json',
]

const supportChangedFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/worker-dispatch-noop-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/worker-dispatch-contract.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.md',
  'scripts/validation/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-diagnostics.mjs',
  'server/services/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts',
  'server/cli/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts',
]

const allowedChangedFiles = new Set([...requiredFiles, ...supportChangedFiles])
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1\.ts$|cli\/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1\.ts$|services\/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1\.ts$|cli\/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1\.ts$)/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]
const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Production route file created|Route registered at runtime|Route runtime enabled|Route execution|Worker dispatch|Worker execution|Worker process start|Worker lease claim|Persistent job queue write|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this no-op invoke phase|MKVToolNix execution in this no-op invoke phase|GPAC\/MP4Box execution in this no-op invoke phase|Docker execution in this no-op invoke phase)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"productionRouteFileCreated"\s*:\s*true/i,
  /"routeRegisteredAtRuntime"\s*:\s*true/i,
  /"routeRuntimeEnabled"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisNoopInvoke"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisNoopInvoke"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisNoopInvoke"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]
const requiredText = [
  packet,
  decision,
  execution,
  confirmGate,
  nextMilestone,
  sourceDispatchDryRunMergeSha,
  sourceDispatchDryRunHeadSha,
  sourceDispatchDryRunRunId,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'metadata_only_guarded_noop_source_handler',
  'externalBeta.trackaThreeTool.guardedNoopRouteHandlerSource',
  '/api/external-beta/tracka/three-tool-agent/guarded-noop',
  'accepted_three_tool_guarded_noop_route_handler_contract',
  'completed_metadata_only_noop_source_handler_invocation',
  '#577 open_draft_blocked_excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Validation status: `passed`',
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

for (const file of [...requiredFiles, sourceDispatchDryRunRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-guarded-route-handler-noop-invoke-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts'
) {
  fail('missing guarded route-handler no-op invoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-guarded-route-handler-noop-invoke-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-diagnostics.mjs'
) {
  fail('missing guarded route-handler no-op invoke diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in no-op invoke corpus: ${pattern}`)
}

const sourceRecord = json(sourceDispatchDryRunRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_route_worker_dispatch_dry_run') {
  fail('source route-worker dispatch dry-run decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source route-worker dispatch next milestone mismatch')
if (sourceRecord.runId !== sourceDispatchDryRunRunId) fail('source route-worker dispatch run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceDispatchDryRun?.mergeSha !== sourceDispatchDryRunMergeSha) fail('source merge SHA mismatch')
if (record.sourceDispatchDryRun?.headSha !== sourceDispatchDryRunHeadSha) fail('source head SHA mismatch')
if (record.sourceDispatchDryRun?.runId !== sourceDispatchDryRunRunId) fail('source run ID mismatch')
if (record.routeSource?.routeSourceId !== 'externalBeta.trackaThreeTool.guardedNoopRouteHandlerSource') {
  fail('route source ID mismatch')
}
if (record.routeSource?.routeSourcePath !== '/api/external-beta/tracka/three-tool-agent/guarded-noop') {
  fail('route source path mismatch')
}
if (record.routeSource?.sourceMode !== 'metadata_only_guarded_noop_source_handler') fail('route source mode mismatch')
if (record.routeSource?.productionRouteFileCreated !== false) fail('production route file flag mismatch')
if (record.routeSource?.routeRegisteredAtRuntime !== false) fail('route registration flag mismatch')
if (record.routeSource?.routeRuntimeEnabled !== false) fail('route runtime flag mismatch')
if (record.response?.status !== 'accepted_three_tool_guarded_noop_route_handler_contract') fail('response status mismatch')
if (
  record.response?.noopSourceHandlerInvocation !==
  'completed_metadata_only_noop_source_handler_invocation'
) {
  fail('no-op source handler invocation status mismatch')
}
for (const [key, value] of Object.entries(record.response ?? {})) {
  if (key !== 'status' && key !== 'noopSourceHandlerInvocation' && value !== false) {
    fail(`response flag must be false: ${key}`)
  }
}
if (record.sourceEvidence?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-guarded-route-handler-noop-invoke-report.json' &&
      artifact.bytes === 13547 &&
      artifact.sha256 === reportSha,
  )
) {
  fail('report artifact evidence mismatch')
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-guarded-route-handler-noop-invoke-manifest.json' &&
      artifact.bytes === 1503 &&
      artifact.sha256 === manifestSha,
  )
) {
  fail('manifest artifact evidence mismatch')
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts')
for (const text of [
  'invokeThreeToolExternalAgentGuardedRouteHandlerNoop',
  'validateThreeToolExternalAgentExecutionBridgeInput',
  'validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput',
  'validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'accepted_three_tool_guarded_noop_route_handler_contract',
  'completed_metadata_only_noop_source_handler_invocation',
  'productionRouteFileCreated: false',
  'routeRegisteredAtRuntime: false',
  'routeRuntimeEnabled: false',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'persistentJobQueueWrite: false',
  'toolExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1',
  'invokeThreeToolExternalAgentGuardedRouteHandlerNoop',
  'three-tool-external-agent-guarded-route-handler-noop-invoke-report.json',
  'three-tool-external-agent-guarded-route-handler-noop-invoke-manifest.json',
]) {
  if (!cliSource.includes(text)) fail(`CLI missing required text: ${text}`)
}

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')
gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock.json staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedChangedPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
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
  noopSourceHandlerInvocation: 'completed_metadata_only_noop_source_handler_invocation',
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
