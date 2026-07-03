#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-RUNTIME-HANDOFF-1'
const decision = 'completed_three_tool_external_agent_persisted_job_runtime_handoff'
const execution = 'completed_local_mock_job_service_handoff_no_route_worker_tool_media_execution'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-record.json`
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-persisted-job-route-invocation-1.md'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json'
const routePath = '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF=true'
const sourceRunId = '2026-07-03T03-41-30-494Z-41a3b873'
const sourceChildRunId = '2026-07-03T03-41-30-650Z-41ce5185'
const sourceMergeSha = '47a3a5f358f7a00f451b9fef277ed0b66251c9e0'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/persisted-job-runtime-handoff.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'server/services/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-smoke.ts',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-process-noop-invoke-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-persistent-job-queue-dry-run-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-worker-lease-dry-run-1-diagnostics.mjs',
]

const routeInvocationFiles = [
  'server/services/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts',
  'server/cli/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts',
  'server/smoke/tracka-three-tool-external-agent-persisted-job-route-invocation-1-smoke.ts',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-route-invocation-1-diagnostics.mjs',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/persisted-job-route-invocation.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/command-matrix.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/artifact-manifest-summary.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/tracka-three-tool-external-agent-persisted-job-route-invocation-1-record.json',
  'docs/activation-phase-tracka-three-tool-external-agent-persisted-job-route-invocation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-dispatch-claim-lease-1.md',
  'server/services/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1.ts',
  'server/smoke/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-smoke.ts',
  'scripts/validation/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/source-audit.md',
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/worker-claim-lease.md',
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/safety-boundary.md',
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/validation-results.md',
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-record.json',
  'docs/activation-phase-tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-results.md',
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...routeInvocationFiles])

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /^tmp\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Remote Supabase mutation|SQL execution|Service-role secret payload access|Runtime route invocation|Worker dispatch|Worker lease claim|Worker process start|Worker execution|GStreamer execution in this persisted-handoff phase|MKVToolNix execution in this persisted-handoff phase|GPAC\/MP4Box execution in this persisted-handoff phase|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Private\/user media processing|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"serviceRoleJobServiceWrite"\s*:\s*true/i,
  /serviceRoleJobServiceWrite:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /persistentJobQueueWrite:\s*true/i,
  /"runtimeRouteInvocation"\s*:\s*true/i,
  /runtimeRouteInvocation:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /routeExecution:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /workerLeaseClaim:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /workerProcessStart:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /gpacMp4boxExecution:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /supabaseMutation:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /sqlExecution:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /signedUrlCreation:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /finalRenderExport:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /externalBetaExpansion:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /productionUnlock:\s*true/i,
]

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  confirmGate,
  sourceRunId,
  sourceChildRunId,
  sourceMergeSha,
  'local_mock_job_service_handoff_no_remote_mutation',
  'blocked_remote_job_service_write_not_approved_for_three_tool_handoff',
  'quality_check',
  'tracka_three_tool_external_agent_generated_fixture_runtime',
  'external_agent_persisted_job_runtime_handoff_ready_for_route_invocation',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577 open_draft_blocked_excluded',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:tracka-three-tool-external-agent-persisted-job-runtime-handoff-1'] !==
  'tsx server/smoke/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-smoke.ts'
) {
  fail('missing persisted handoff smoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-persisted-job-runtime-handoff-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-diagnostics.mjs'
) {
  fail('missing persisted handoff diagnostics package script')
}

const corpus = [...packetFiles, ...implementationFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_approved_snapshot_job_execution') {
  fail('source approved-snapshot job execution decision mismatch')
}
if (sourceRecord.runId !== sourceRunId) fail('source approved-snapshot job execution run ID mismatch')
if (sourceRecord.approvedSnapshotJobExecution?.childRunId !== sourceChildRunId) {
  fail('source approved-snapshot child run ID mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.sourceChain?.integrationBase !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceChain?.approvedSnapshotJobExecutionRunId !== sourceRunId) fail('source run ID mismatch')
if (record.sourceChain?.approvedSnapshotJobExecutionChildRunId !== sourceChildRunId) fail('source child run ID mismatch')
if (record.handoff?.mode !== 'local_mock_job_service_handoff_no_remote_mutation') fail('handoff mode mismatch')
if (record.handoff?.jobType !== 'quality_check') fail('job type mismatch')
if (record.handoff?.payloadKind !== 'tracka_three_tool_external_agent_generated_fixture_runtime') {
  fail('payload kind mismatch')
}
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (!record.tools?.includes(tool)) fail(`missing tool: ${tool}`)
  if (record.readiness?.[tool] !== 'external_agent_persisted_job_runtime_handoff_ready_for_route_invocation') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
if (record.handoff?.localMockJobServiceWrite !== true) fail('local mock job-service handoff must be true')
for (const [key, value] of Object.entries(record.handoff ?? {})) {
  if (
    !['persistedHandoffId', 'mode', 'jobType', 'payloadKind', 'localMockJobServiceWrite'].includes(key) &&
    value !== false
  ) {
    fail(`handoff flag must be false: ${key}`)
  }
}
if (record.safety?.routeHandlerInvocation !== 'completed_guarded_three_tool_persisted_job_runtime_handoff_handler') {
  fail('route handler invocation status mismatch')
}
if (record.safety?.localMockJobServiceHandoff !== true) fail('local mock safety handoff must be true')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (!['routeHandlerInvocation', 'localMockJobServiceHandoff'].includes(key) && value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'pending_local_validation' && record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const serviceSource = read('server/services/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1.ts')
for (const text of [
  'createJobService',
  'createJobBatch',
  'createJob',
  'payloadJson',
  'TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS',
  'context.clients.admin && !context.env.mockOnly',
  'blocked_remote_job_service_write_not_approved_for_three_tool_handoff',
  'runtimeRouteInvocation: false',
  'workerDispatch: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'gpacMp4boxExecution: false',
  'supabaseMutation: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required boundary text: ${text}`)
}

const routeSource = read('server/routes/worker-routes.ts')
if (!routeSource.includes('TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH')) {
  fail('worker route missing three-tool persisted handoff route path')
}
if (!routeSource.includes('runThreeToolExternalAgentPersistedJobRuntimeHandoff')) {
  fail('worker route missing three-tool persisted handoff runner')
}
if (!routeSource.includes('threeToolExternalAgentPersistedJobRuntimeHandoffSchema')) {
  fail('worker route missing three-tool persisted handoff schema')
}
if (!routeSource.includes('requireIdempotency')) fail('worker route must require idempotency')

const schemaSource = read('server/validation/worker-schemas.ts')
for (const text of [
  'threeToolExternalAgentPersistedJobRuntimeHandoffSchema',
  "z.literal('local_mock_job_service_handoff_no_remote_mutation')",
  "z.literal('2026-07-03T03-41-30-494Z-41a3b873')",
  "z.literal('completed_three_tool_external_agent_approved_snapshot_job_execution')",
  'persistentJobQueueWriteRequestedNow',
  'serviceRoleSecretPayloadAccessRequestedNow',
]) {
  if (!schemaSource.includes(text)) fail(`schema missing required text: ${text}`)
}

const smokeSource = read('server/smoke/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-smoke.ts')
for (const text of [
  'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation',
  'completed_persisted_job_runtime_handoff',
  'blocked_remote_job_service_write_not_approved_for_three_tool_handoff',
  'blocked_three_tool_persisted_job_runtime_handoff_unsafe_request',
  'TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH',
]) {
  if (!smokeSource.includes(text)) fail(`smoke missing required assertion text: ${text}`)
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
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}
const changedCorpus = uniqueChangedFiles
  .filter((file) => !routeInvocationFiles.includes(file))
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden claim matched in changed files: ${pattern}`)
}

console.log(`${packet} diagnostics passed`)
