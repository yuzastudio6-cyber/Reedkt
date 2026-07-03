#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-GUARDED-WORKER-DISPATCH-NOOP-INVOKE-1'
const decision = 'completed_three_tool_external_agent_guarded_worker_dispatch_noop_invoke'
const execution =
  'completed_confirmation_gated_three_tool_guarded_noop_worker_dispatch_invoke_no_worker_tool_media_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_GUARDED_WORKER_DISPATCH_NOOP_INVOKE=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTENT-JOB-QUEUE-DRY-RUN-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-record.json`
const sourceRouteHandlerRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-persistent-job-queue-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceRouteHandlerMergeSha = '470bf529e02e145607d085c8dc3a2f181c791d25'
const sourceRouteHandlerHeadSha = 'b66ab878609dd04c7861318bab0d557043652ae1'
const sourceRouteHandlerRunId = '2026-07-03T01-16-23-668Z-c161d492'
const runId = '2026-07-03T01-28-17-653Z-f2a11fd7'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1/${runId}`
const reportSha = 'ba15a39374229ed5389cee30c441525124ef8b2c7c892b7247bc5dc0a7f76775'
const manifestSha = 'dfe2f7749e3af44dbfd8a0ff2a44380901b73e4c186870e8199ae39fd46727e9'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-dispatch-noop-result.md`,
  `${dir}/worker-dispatch-contract.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts',
  'server/cli/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1\.ts$|cli\/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Worker process start|Worker lease claim|Persistent job queue write|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this worker no-op invoke phase|MKVToolNix execution in this worker no-op invoke phase|GPAC\/MP4Box execution in this worker no-op invoke phase|Docker execution in this worker no-op invoke phase)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisWorkerNoopInvoke"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisWorkerNoopInvoke"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisWorkerNoopInvoke"\s*:\s*true/i,
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
  sourceRouteHandlerMergeSha,
  sourceRouteHandlerHeadSha,
  sourceRouteHandlerRunId,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'externalBeta.trackaThreeTool.guardedNoopWorkerDispatchSource',
  'tracka_three_tool_external_agent_worker',
  'tracka-three-tool-external-agent-noop',
  'metadata_only_guarded_noop_worker_dispatch_source',
  'accepted_three_tool_guarded_noop_worker_dispatch_contract',
  'completed_metadata_only_noop_worker_dispatch_invocation',
  '#577 open_draft_blocked_excluded',
  'Raw command strings allowed: `false`',
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

for (const file of [...requiredFiles, sourceRouteHandlerRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts'
) {
  fail('missing guarded worker dispatch no-op invoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1-diagnostics.mjs'
) {
  fail('missing guarded worker dispatch no-op invoke diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in worker no-op corpus: ${pattern}`)
}

const sourceRecord = json(sourceRouteHandlerRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_guarded_route_handler_noop_invoke') {
  fail('source route-handler no-op decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source route-handler no-op next milestone mismatch')
if (sourceRecord.runId !== sourceRouteHandlerRunId) fail('source route-handler no-op run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceRouteHandlerNoop?.mergeSha !== sourceRouteHandlerMergeSha) fail('source merge SHA mismatch')
if (record.sourceRouteHandlerNoop?.headSha !== sourceRouteHandlerHeadSha) fail('source head SHA mismatch')
if (record.sourceRouteHandlerNoop?.runId !== sourceRouteHandlerRunId) fail('source run ID mismatch')
if (record.workerDispatchSource?.workerDispatchSourceId !== 'externalBeta.trackaThreeTool.guardedNoopWorkerDispatchSource') {
  fail('worker dispatch source ID mismatch')
}
if (record.workerDispatchSource?.workerKind !== 'tracka_three_tool_external_agent_worker') fail('worker kind mismatch')
if (record.workerDispatchSource?.queueName !== 'tracka-three-tool-external-agent-noop') fail('queue name mismatch')
if (record.workerDispatchSource?.sourceMode !== 'metadata_only_guarded_noop_worker_dispatch_source') {
  fail('worker dispatch source mode mismatch')
}
for (const [key, value] of Object.entries(record.workerDispatchSource ?? {})) {
  if (
    !['workerDispatchSourceId', 'workerKind', 'queueName', 'sourceMode'].includes(key) &&
    value !== false
  ) {
    fail(`worker dispatch source flag must be false: ${key}`)
  }
}
if (record.response?.status !== 'accepted_three_tool_guarded_noop_worker_dispatch_contract') {
  fail('response status mismatch')
}
if (
  record.response?.noopWorkerDispatchInvocation !==
  'completed_metadata_only_noop_worker_dispatch_invocation'
) {
  fail('no-op worker dispatch invocation status mismatch')
}
for (const [key, value] of Object.entries(record.response ?? {})) {
  if (key !== 'status' && key !== 'noopWorkerDispatchInvocation' && value !== false) {
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
      artifact.fileName === 'three-tool-external-agent-guarded-worker-dispatch-noop-invoke-report.json' &&
      artifact.bytes === 17136 &&
      artifact.sha256 === reportSha,
  )
) {
  fail('report artifact evidence mismatch')
}
if (
  !record.artifacts?.some(
    (artifact) =>
      artifact.fileName === 'three-tool-external-agent-guarded-worker-dispatch-noop-invoke-manifest.json' &&
      artifact.bytes === 1397 &&
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

const serviceSource = read('server/services/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts')
for (const text of [
  'invokeThreeToolExternalAgentGuardedWorkerDispatchNoop',
  'invokeThreeToolExternalAgentGuardedRouteHandlerNoop',
  'accepted_three_tool_guarded_noop_worker_dispatch_contract',
  'completed_metadata_only_noop_worker_dispatch_invocation',
  'workerDispatchEnabled: false',
  'workerProcessStart: false',
  'workerLeaseClaim: false',
  'persistentJobQueueWrite: false',
  'workerExecution: false',
  'toolExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1',
  'invokeThreeToolExternalAgentGuardedWorkerDispatchNoop',
  'three-tool-external-agent-guarded-worker-dispatch-noop-invoke-report.json',
  'three-tool-external-agent-guarded-worker-dispatch-noop-invoke-manifest.json',
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
  noopWorkerDispatchInvocation: 'completed_metadata_only_noop_worker_dispatch_invocation',
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
