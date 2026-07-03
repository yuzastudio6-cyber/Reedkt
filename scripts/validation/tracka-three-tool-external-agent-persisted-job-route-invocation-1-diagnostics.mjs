#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1'
const decision = 'completed_three_tool_external_agent_persisted_job_payload_to_runtime_route_invocation'
const execution = 'completed_persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate_generated_fixture_only'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-persisted-job-route-invocation-1-record.json`
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-persisted-job-route-invocation-1-results.md'
const nextPromptPath = 'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-dispatch-claim-lease-1.md'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-record.json'
const approvedSnapshotRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json'
const routePath = '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION=true'
const approvedSnapshotConfirmGate =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true'
const sourceRunId = '2026-07-03T03-41-30-494Z-41a3b873'
const sourceChildRunId = '2026-07-03T03-41-30-650Z-41ce5185'
const sourceMergeSha = '47a3a5f358f7a00f451b9fef277ed0b66251c9e0'
const handoffMergeSha = 'd2e52278ed840efeff6e87aee0de2ed876b9f580'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/persisted-job-route-invocation.md`,
  `${dir}/command-matrix.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'server/services/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts',
  'server/cli/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts',
  'server/smoke/tracka-three-tool-external-agent-persisted-job-route-invocation-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-route-invocation-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
]

const workerClaimLeaseFiles = [
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

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...workerClaimLeaseFiles])

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
  /\b(?:Worker dispatch|Worker lease claim|Worker process start|Worker execution|Persistent queue write|Persistent job queue write|Remote Supabase mutation|Supabase mutation|SQL execution|Secret payload access|Service-role secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Private\/user media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /workerProcessStart:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /workerLeaseClaim:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /persistentJobQueueWrite:\s*true/i,
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
  routePath,
  confirmGate,
  approvedSnapshotConfirmGate,
  sourceRunId,
  sourceChildRunId,
  sourceMergeSha,
  handoffMergeSha,
  'completed_three_tool_approved_snapshot_runtime_delegate',
  'completed_local_payload_read_only',
  'external_agent_persisted_job_route_invocation_passed',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Product-ready end-to-end local OSS tools: `0`',
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

for (const file of [...packetFiles, ...implementationFiles, sourceRecordPath, approvedSnapshotRecordPath]) {
  read(file)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:tracka-three-tool-external-agent-persisted-job-route-invocation-1'] !==
  'tsx server/smoke/tracka-three-tool-external-agent-persisted-job-route-invocation-1-smoke.ts'
) {
  fail('missing route invocation smoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-persisted-job-route-invocation-1'] !==
  'tsx server/cli/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts'
) {
  fail('missing route invocation CLI package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-persisted-job-route-invocation-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-persisted-job-route-invocation-1-diagnostics.mjs'
) {
  fail('missing route invocation diagnostics package script')
}

const corpus = [...packetFiles, ...implementationFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_persisted_job_runtime_handoff') {
  fail('persisted handoff source decision mismatch')
}
if (sourceRecord.sourceChain?.integrationBase !== sourceMergeSha) fail('persisted handoff source merge SHA mismatch')
if (sourceRecord.sourceChain?.approvedSnapshotJobExecutionRunId !== sourceRunId) fail('persisted handoff source run ID mismatch')
if (sourceRecord.sourceChain?.approvedSnapshotJobExecutionChildRunId !== sourceChildRunId) {
  fail('persisted handoff source child run ID mismatch')
}

const approvedSnapshotRecord = json(approvedSnapshotRecordPath)
if (approvedSnapshotRecord.decision !== 'completed_three_tool_external_agent_approved_snapshot_job_execution') {
  fail('approved snapshot source decision mismatch')
}
if (approvedSnapshotRecord.runId !== sourceRunId) fail('approved snapshot source run ID mismatch')
if (approvedSnapshotRecord.approvedSnapshotJobExecution?.childRunId !== sourceChildRunId) {
  fail('approved snapshot child run ID mismatch')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.validation !== 'passed') fail('validation must be passed before route invocation diagnostics pass')
if (record.routePath !== routePath) fail('route path mismatch')
if (!record.confirmationGates?.includes(confirmGate)) fail('missing route confirmation gate')
if (!record.confirmationGates?.includes(approvedSnapshotConfirmGate)) fail('missing approved-snapshot confirmation gate')
if (record.sourceChain?.approvedSnapshotJobExecutionMergeSha !== sourceMergeSha) fail('source merge SHA mismatch')
if (record.sourceChain?.approvedSnapshotJobExecutionRunId !== sourceRunId) fail('source run ID mismatch')
if (record.sourceChain?.approvedSnapshotJobExecutionChildRunId !== sourceChildRunId) fail('source child run ID mismatch')
if (record.sourceChain?.persistedJobRuntimeHandoffMergeSha !== handoffMergeSha) fail('handoff merge SHA mismatch')
if (record.persistedInvocation?.runtimeRouteInvocation !== 'completed_three_tool_approved_snapshot_runtime_delegate') {
  fail('runtime route invocation status mismatch')
}
if (record.persistedInvocation?.payloadRead !== 'completed_local_payload_read_only') fail('payload read status mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (!record.tools?.includes(tool)) fail(`missing tool: ${tool}`)
  if (record.readiness?.[tool] !== 'external_agent_persisted_job_route_invocation_passed') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
for (const key of [
  'workerDispatch',
  'workerExecution',
  'workerProcessStart',
  'workerLeaseClaim',
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
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety?.routeHandlerInvocation !== 'completed_guarded_three_tool_persisted_job_route_invocation_handler') {
  fail('route handler invocation safety mismatch')
}
if (record.safety?.persistedJobPayloadRead !== 'completed_local_payload_read_only') {
  fail('persisted payload read safety mismatch')
}
if (record.safety?.runtimeRouteInvocation !== 'completed_three_tool_approved_snapshot_runtime_delegate') {
  fail('runtime route invocation safety mismatch')
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length < 2) fail('missing artifact checksum summary')

const serviceSource = read('server/services/tracka-three-tool-external-agent-persisted-job-route-invocation-1.ts')
for (const text of [
  'defaultRuntimeRunner',
  'tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs',
  'delegateSafetyValid',
  'runtimeRouteInvocation: runtimeCompleted',
  'workerDispatch: false',
  'workerExecution: false',
  'persistentJobQueueWrite: false',
  'supabaseMutation: false',
  'sqlExecution: false',
]) {
  if (!serviceSource.includes(text)) fail(`service missing required boundary text: ${text}`)
}

const routeSource = read('server/routes/worker-routes.ts')
if (!routeSource.includes('TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH')) {
  fail('worker route missing three-tool persisted route invocation path')
}
if (!routeSource.includes('runThreeToolExternalAgentPersistedJobRouteInvocation')) {
  fail('worker route missing route invocation runner')
}
if (!routeSource.includes('threeToolExternalAgentPersistedJobRouteInvocationSchema')) {
  fail('worker route missing route invocation schema')
}
if (!routeSource.includes('requireIdempotency')) fail('worker route must require idempotency')

const schemaSource = read('server/validation/worker-schemas.ts')
for (const text of [
  'threeToolExternalAgentPersistedJobPayloadSchema',
  'threeToolExternalAgentPersistedJobRouteInvocationSchema',
  "z.literal('persisted_job_payload_to_three_tool_approved_snapshot_runtime_delegate')",
  "z.literal('2026-07-03T03-41-30-494Z-41a3b873')",
  "z.literal('2026-07-03T03-41-30-650Z-41ce5185')",
  'workerDispatchRequestedNow',
  'serviceRoleSecretPayloadAccessRequestedNow',
]) {
  if (!schemaSource.includes(text)) fail(`schema missing required text: ${text}`)
}

const smokeSource = read('server/smoke/tracka-three-tool-external-agent-persisted-job-route-invocation-1-smoke.ts')
for (const text of [
  'blocked_pending_three_tool_persisted_job_route_invocation_confirmation',
  'completed_persisted_job_route_invocation',
  'blocked_three_tool_persisted_job_route_invocation_unsafe_request',
  'TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH',
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
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(changedCorpus)) fail(`forbidden claim matched in changed files: ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      runId: record.runId,
      runtimeDelegateRunId: record.runtimeDelegate?.runId,
      readiness: record.readiness,
      routePath,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone,
      changedFiles: uniqueChangedFiles,
    },
    null,
    2,
  ),
)
