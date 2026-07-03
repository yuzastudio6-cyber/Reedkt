#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-ROUTE-WORKER-DISPATCH-DRY-RUN-1'
const decision = 'completed_three_tool_external_agent_route_worker_dispatch_dry_run'
const execution = 'completed_confirmation_gated_three_tool_route_worker_dispatch_envelope_validation_no_route_worker_tool_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_ROUTE_WORKER_DISPATCH_DRY_RUN=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-GUARDED-ROUTE-HANDLER-NOOP-INVOKE-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-record.json`
const sourceDryRunRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/tracka-three-tool-external-agent-execution-bridge-dry-run-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceDryRunMergeSha = '9daab4250e172b9e941e094a5a8fc3dfd729c2ba'
const sourceDryRunHeadSha = 'd2dcfae106654cdb42a6e2abef4579b6cb823fdd'
const sourceDryRunRunId = '2026-07-03T00-58-17-632Z-4d15bfd3'
const runId = '2026-07-03T01-06-54-981Z-9c34363c'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/${runId}`
const reportSha = '4e878a4c8d94979536229ba1e6ce5409f267a94e6183a5d1f884af0e4aadc86b'
const manifestSha = '6c6fa3941879f0b63e20331d98887911d15ff80b72805883c683b9f3f55a716a'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dispatch-dry-run-result.md`,
  `${dir}/dispatch-envelope.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-dry-run-1-diagnostics.mjs',
  'package.json',
]

const supportChangedFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/noop-invoke-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/route-handler-contract.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-guarded-worker-dispatch-noop-invoke-1.md',
  'scripts/validation/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1-diagnostics.mjs',
  'server/services/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts',
  'server/cli/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.ts',
]

const allowedChangedFiles = new Set([...requiredFiles, ...supportChangedFiles])
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1\.ts$|services\/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1\.ts$|cli\/tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1\.ts$)/,
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
  /\b(?:Route handler invocation|Route execution|Worker dispatch|Worker execution|Worker lease claim|Persistent job queue write|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this dispatch dry-run phase|MKVToolNix execution in this dispatch dry-run phase|GPAC\/MP4Box execution in this dispatch dry-run phase|Docker execution in this dispatch dry-run phase)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeHandlerInvocation"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisDispatchDryRun"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
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
  sourceDryRunMergeSha,
  sourceDryRunHeadSha,
  sourceDryRunRunId,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute',
  'metadata_only_route_worker_dispatch_dry_run',
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

for (const file of [...requiredFiles, sourceDryRunRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-route-worker-dispatch-dry-run-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts'
) {
  fail('missing route-worker dispatch dry-run package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-route-worker-dispatch-dry-run-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-diagnostics.mjs'
) {
  fail('missing route-worker dispatch diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in dispatch corpus: ${pattern}`)
}

const sourceRecord = json(sourceDryRunRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_execution_bridge_dry_run') {
  fail('source bridge dry-run decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source bridge dry-run next milestone mismatch')
if (sourceRecord.runId !== sourceDryRunRunId) fail('source bridge dry-run run ID mismatch')
if (sourceRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceBridgeDryRun?.mergeSha !== sourceDryRunMergeSha) fail('source merge SHA mismatch')
if (record.sourceBridgeDryRun?.headSha !== sourceDryRunHeadSha) fail('source head SHA mismatch')
if (record.sourceBridgeDryRun?.runId !== sourceDryRunRunId) fail('source run ID mismatch')
if (record.sourceEvidence?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.dispatchValidation?.routeWorkerDispatchEnvelopeValidation !== 'passed') fail('dispatch envelope validation mismatch')
if (record.dispatchValidation?.gstreamerMkvtoolnixChildDispatchMetadata !== 'passed') fail('GStreamer/MKVToolNix dispatch validation mismatch')
if (record.dispatchValidation?.gpacMp4boxChildDispatchMetadata !== 'passed') fail('GPAC/MP4Box dispatch validation mismatch')
if (record.dispatchValidation?.rawCommandStringsAllowed !== false) fail('raw command flag mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'three-tool-external-agent-route-worker-dispatch-dry-run-report.json' && artifact.bytes === 13452 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'three-tool-external-agent-route-worker-dispatch-dry-run-manifest.json' && artifact.bytes === 1121 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts')
for (const text of [
  'runThreeToolExternalAgentRouteWorkerDispatchDryRun',
  'validateThreeToolExternalAgentExecutionBridgeInput',
  'validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput',
  'validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'routeHandlerInvocation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'persistentJobQueueWrite: false',
  'toolExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1',
  'runThreeToolExternalAgentRouteWorkerDispatchDryRun',
  'three-tool-external-agent-route-worker-dispatch-dry-run-report.json',
  'three-tool-external-agent-route-worker-dispatch-dry-run-manifest.json',
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
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
