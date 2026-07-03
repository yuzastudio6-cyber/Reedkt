#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-DRY-RUN-1'
const decision = 'completed_three_tool_external_agent_execution_bridge_dry_run'
const execution = 'completed_confirmation_gated_three_tool_bridge_envelope_validation_no_route_worker_tool_execution'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DRY_RUN=true'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-ROUTE-WORKER-DISPATCH-DRY-RUN-1'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-execution-bridge-dry-run-1-record.json`
const sourceBridgeRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1/tracka-three-tool-external-agent-execution-bridge-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-execution-bridge-dry-run-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const sourceBridgeMergeSha = '30f0b17287ca16b9da06930dd15e575bdb03de24'
const sourceBridgeHeadSha = '2e59a52cc44953e7f7be27fe27c07892b0cb6d2e'
const runId = '2026-07-03T00-58-17-632Z-4d15bfd3'
const outputDir = `/tmp/reeditpro-tracka-three-tool-external-agent-execution-bridge-dry-run-1/${runId}`
const reportSha = 'd3d78ec7d55050d178f8eb6ee4204e21d57b9d2bb8f23e9b34f8ef9f6e7326c8'
const manifestSha = '82687b93e240524439c5c0504bbd9797fb35103a132a36036bfd193ffb0343ef'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/bridge-envelope.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
  'server/services/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'package.json',
]

const supportChangedFiles = [
  'docs/activation-phase-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/dispatch-dry-run-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/dispatch-envelope.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-guarded-route-handler-noop-invoke-1.md',
  'scripts/validation/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1-diagnostics.mjs',
  'server/services/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.ts',
]

const allowedChangedFiles = new Set([...requiredFiles, ...supportChangedFiles])
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-execution-bridge-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-execution-bridge-dry-run-1\.ts$|services\/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1\.ts$)/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|Tool execution|Docker execution|Private media processing|User media processing|FFmpeg\/FFprobe execution|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Package-lock mutation|Dependency mutation|Generated artifacts committed)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer execution in this dry-run phase|MKVToolNix execution in this dry-run phase|GPAC\/MP4Box execution in this dry-run phase|Docker execution in this dry-run phase)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"toolExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisDryRun"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisDryRun"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisDryRun"\s*:\s*true/i,
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
  sourceBridgeMergeSha,
  sourceBridgeHeadSha,
  runId,
  outputDir,
  reportSha,
  manifestSha,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mp4box_add_generated_subtitle_only_v1',
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

for (const file of [...requiredFiles, sourceBridgeRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-execution-bridge-dry-run-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts'
) {
  fail('missing dry-run package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-execution-bridge-dry-run-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-execution-bridge-dry-run-1-diagnostics.mjs'
) {
  fail('missing dry-run diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in dry-run corpus: ${pattern}`)
}

const sourceBridgeRecord = json(sourceBridgeRecordPath)
if (
  sourceBridgeRecord.decision !==
  'completed_three_tool_external_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run'
) {
  fail('source bridge decision mismatch')
}
if (sourceBridgeRecord.nextMilestone !== packet) fail('source bridge next milestone mismatch')
if (sourceBridgeRecord.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready count mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.outputDir !== outputDir) fail('output directory mismatch')
if (record.sourceBridge?.mergeSha !== sourceBridgeMergeSha) fail('source merge SHA mismatch')
if (record.sourceBridge?.headSha !== sourceBridgeHeadSha) fail('source head SHA mismatch')
if (record.sourceEvidence?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.bridgeValidation?.structuredBridgeEnvelopeValidation !== 'passed') fail('structured bridge validation mismatch')
if (record.bridgeValidation?.gstreamerMkvtoolnixChildRouteInputValidation !== 'passed') fail('GStreamer/MKVToolNix validation mismatch')
if (record.bridgeValidation?.gpacMp4boxChildRouteInputValidation !== 'passed') fail('GPAC/MP4Box validation mismatch')
if (record.bridgeValidation?.rawCommandStringsAllowed !== false) fail('raw command flag mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'three-tool-external-agent-execution-bridge-dry-run-report.json' && artifact.bytes === 12335 && artifact.sha256 === reportSha)) {
  fail('report artifact evidence mismatch')
}
if (!record.artifacts?.some((artifact) => artifact.fileName === 'three-tool-external-agent-execution-bridge-dry-run-manifest.json' && artifact.bytes === 1065 && artifact.sha256 === manifestSha)) {
  fail('manifest artifact evidence mismatch')
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts')
for (const text of [
  'runThreeToolExternalAgentExecutionBridgeDryRun',
  'validateThreeToolExternalAgentExecutionBridgeInput',
  'validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput',
  'validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'toolExecution: false',
  'dockerExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
}

const cliSource = read('server/cli/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts')
for (const text of [
  '/tmp/reeditpro-tracka-three-tool-external-agent-execution-bridge-dry-run-1',
  'runThreeToolExternalAgentExecutionBridgeDryRun',
  'three-tool-external-agent-execution-bridge-dry-run-report.json',
  'three-tool-external-agent-execution-bridge-dry-run-manifest.json',
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
