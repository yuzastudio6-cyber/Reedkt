#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-1'
const decision = 'completed_three_tool_external_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run'
const execution = 'completed_backend_source_three_tool_agent_execution_bridge_no_route_worker_dispatch_or_tool_execution'
const readyStatus = 'ready_for_confirmation_gated_three_tool_external_agent_execution_bridge_dry_run'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-execution-bridge-1-record.json`
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-record.json'
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-execution-bridge-1-results.md'
const dryRunPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-execution-bridge-dry-run-1.md'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const qaMergeSha = '13c922b3cc8d40223920c45bb800729dbbe3e7b5'
const executionMergeSha = '6ad10faf36bdc447e232044e3857d5d0220ffa54'
const combinedRunId = '2026-07-02T23-06-37-783Z-735edf80'
const gstreamerRunId = '2026-07-02T23-06-37-953Z-ee1ebbec'
const gpacRunId = '2026-07-02T23-06-42-095Z-21ff9b93'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-DRY-RUN-1'

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/bridge-contract.md`,
  `${dir}/request-envelope.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  dryRunPromptPath,
  'server/services/tracka-three-tool-external-agent-execution-bridge-1.ts',
  'server/smoke/tracka-three-tool-external-agent-execution-bridge-1-smoke.ts',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs',
  'package.json',
]

const supportChangedFiles = [
  'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-qa-rollup-1-diagnostics.mjs',
  'docs/activation-phase-tracka-three-tool-external-agent-execution-bridge-dry-run-1-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/dry-run-result.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/bridge-envelope.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-execution-bridge-dry-run-1/tracka-three-tool-external-agent-execution-bridge-dry-run-1-record.json',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-route-worker-dispatch-dry-run-1.md',
  'scripts/validation/tracka-three-tool-external-agent-execution-bridge-dry-run-1-diagnostics.mjs',
  'server/services/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts',
  'server/cli/tracka-three-tool-external-agent-execution-bridge-dry-run-1.ts',
]

const allowedChangedFiles = new Set([...requiredFiles, ...supportChangedFiles])
const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/tracka-three-tool-external-agent-execution-bridge-1\.ts$|smoke\/tracka-three-tool-external-agent-execution-bridge-1-smoke\.ts$|services\/tracka-three-tool-external-agent-execution-bridge-dry-run-1\.ts$|cli\/tracka-three-tool-external-agent-execution-bridge-dry-run-1\.ts$)/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]
const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|Worker execution|Worker dispatch|Route execution|Signed URL creation|Public artifact creation|Credit mutation|Deployment|External beta expansion|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|FFmpeg\/FFprobe execution|Remotion execution|GStreamer execution in this bridge|MKVToolNix execution in this bridge|GPAC\/MP4Box execution in this bridge|Docker execution in this bridge|Package-lock mutation|Dependency mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"directRuntimeExecutionInThisBridge"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecutionInThisBridge"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisBridge"\s*:\s*true/i,
  /"gpacMp4boxExecutionInThisBridge"\s*:\s*true/i,
  /"dockerExecutionInThisBridge"\s*:\s*true/i,
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
  readyStatus,
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DRY_RUN=true',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mp4box_add_generated_subtitle_only_v1',
  qaMergeSha,
  executionMergeSha,
  combinedRunId,
  gstreamerRunId,
  gpacRunId,
  '#577 open_draft_blocked_excluded',
  'raw command strings allowed: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...requiredFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:tracka-three-tool-external-agent-execution-bridge-1'] !==
  'tsx server/smoke/tracka-three-tool-external-agent-execution-bridge-1-smoke.ts'
) {
  fail('missing smoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-execution-bridge-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-execution-bridge-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

const corpus = requiredFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in bridge corpus: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'qa_passed_three_tool_external_agent_controlled_generated_fixture_execution_evidence') {
  fail('source QA decision mismatch')
}
if (sourceRecord.nextMilestone !== packet) fail('source QA next milestone mismatch')
if (sourceRecord.qa?.acceptance !== 'ready_for_three_tool_external_agent_execution_bridge') {
  fail('source QA acceptance mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('active lane count mismatch')
if (record.sourceChain?.threeToolQaRollupMergeSha !== qaMergeSha) fail('QA merge SHA mismatch')
if (record.sourceChain?.threeToolExecutionMergeSha !== executionMergeSha) fail('execution merge SHA mismatch')
if (record.sourceChain?.combinedExecutionRunId !== combinedRunId) fail('combined run ID mismatch')
if (record.sourceChain?.gstreamerMkvtoolnixRunId !== gstreamerRunId) fail('GStreamer/MKVToolNix run ID mismatch')
if (record.sourceChain?.gpacMp4boxRunId !== gpacRunId) fail('GPAC/MP4Box run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.readiness?.status !== readyStatus) fail('ready status mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (record.readiness?.[tool] !== readyStatus) fail(`tool readiness mismatch: ${tool}`)
}
if (record.bridge?.confirmationGate !== 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_DRY_RUN=true') {
  fail('confirmation gate mismatch')
}
if (record.bridge?.directRuntimeExecutionInThisBridge !== false) fail('direct runtime bridge flag mismatch')
if (record.bridge?.rawCommandStringsAllowed !== false) fail('raw command flag mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`bridge safety flag must be false: ${key}`)
}
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-execution-bridge-1.ts')
for (const text of [
  'buildThreeToolExternalAgentExecutionBridgeInput',
  'validateThreeToolExternalAgentExecutionBridgeInput',
  'summarizeThreeToolExternalAgentExecutionBridgeBoundary',
  'buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput',
  'buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'directRuntimeExecutionInThisBridge: false',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'dockerExecutionInThisBridge: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required text: ${text}`)
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
  readyStatus,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone,
}, null, 2))
