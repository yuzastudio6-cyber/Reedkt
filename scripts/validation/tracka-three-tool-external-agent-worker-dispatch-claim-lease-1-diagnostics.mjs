#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1'
const decision = 'completed_three_tool_external_agent_local_mock_worker_claim_lease_boundary'
const execution = 'completed_local_mock_worker_claim_lease_no_worker_execution_or_tool_execution'
const dir = 'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1'
const recordPath = `${dir}/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-record.json`
const activationPath = 'docs/activation-phase-tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-results.md'
const nextPromptPath =
  'docs/implementation-prompts/prompt-tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1.md'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-persisted-job-route-invocation-1/tracka-three-tool-external-agent-persisted-job-route-invocation-1-record.json'
const routePath =
  '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease'
const confirmGate = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE=true'
const routeInvocationMergeSha = '771b7eafef011874d582a96f3852d68987a2a84a'
const routeInvocationRunId = '2026-07-03T13-25-30-856Z-7ed163da'
const routeInvocationDelegateRunId = '2026-07-03T13-25-30-924Z-648666a4'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-claim-lease.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  activationPath,
  nextPromptPath,
]

const implementationFiles = [
  'package.json',
  'server/services/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1.ts',
  'server/smoke/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-route-invocation-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

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
  /\b(?:Runtime route invocation|Worker dispatch|Worker execution|Worker process start|Persistent job queue write|Remote Supabase worker claim mutation|Supabase mutation|SQL execution|Secret payload access|Service-role secret payload access|Signed URL creation|Public artifact creation|Final render\/export|External beta expansion|Paid production unlock|Production unlock|Private\/user media processing|GStreamer execution|MKVToolNix execution|GPAC\/MP4Box execution|FFmpeg\/FFprobe execution|Docker execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"runtimeRouteInvocation"\s*:\s*true/i,
  /runtimeRouteInvocation:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"workerProcessStart"\s*:\s*true/i,
  /workerProcessStart:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /persistentJobQueueWrite:\s*true/i,
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
  /"secretPayloadAccess"\s*:\s*true/i,
  /secretPayloadAccess:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /signedUrlCreation:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /finalRenderExport:\s*true/i,
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
  'local_mock_claim_lease_no_worker_execution',
  'tracka_three_tool_external_agent_generated_fixture_worker',
  'completed_local_mock_claim_only',
  routeInvocationMergeSha,
  routeInvocationRunId,
  routeInvocationDelegateRunId,
  'external_agent_local_mock_worker_claim_lease_passed',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577',
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
  packageJson.scripts?.['smoke:tracka-three-tool-external-agent-worker-dispatch-claim-lease-1'] !==
  'tsx server/smoke/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-smoke.ts'
) {
  fail('missing worker claim lease smoke package script')
}
if (
  packageJson.scripts?.['tracka:three-tool-external-agent-worker-dispatch-claim-lease-1:diagnostics'] !==
  'node scripts/validation/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-diagnostics.mjs'
) {
  fail('missing worker claim lease diagnostics package script')
}

const corpus = [...packetFiles, ...implementationFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const sourceRecord = json(sourceRecordPath)
if (sourceRecord.decision !== 'completed_three_tool_external_agent_persisted_job_payload_to_runtime_route_invocation') {
  fail('source route invocation decision mismatch')
}
if (sourceRecord.runId !== routeInvocationRunId) fail('source route invocation run ID mismatch')
if (sourceRecord.runtimeDelegate?.runId !== routeInvocationDelegateRunId) fail('source runtime delegate run ID mismatch')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.validation !== 'passed') fail('validation must be passed before diagnostics pass')
if (record.sourceChain?.persistedJobRouteInvocationMergeSha !== routeInvocationMergeSha) {
  fail('route invocation merge SHA mismatch')
}
if (record.sourceChain?.persistedJobRouteInvocationRunId !== routeInvocationRunId) {
  fail('route invocation run ID mismatch')
}
if (record.sourceChain?.persistedJobRouteInvocationRuntimeDelegateRunId !== routeInvocationDelegateRunId) {
  fail('route invocation delegate run ID mismatch')
}
if (record.sourceChain?.blockedExcludedPr !== '#577 open/draft/blocked/excluded') fail('#577 exclusion mismatch')
if (record.route?.path !== routePath) fail('route path mismatch')
if (record.route?.confirmationGate !== confirmGate) fail('confirmation gate mismatch')
if (record.route?.claimLeaseMode !== 'local_mock_claim_lease_no_worker_execution') fail('claim lease mode mismatch')
if (record.route?.workerType !== 'tracka_three_tool_external_agent_generated_fixture_worker') fail('worker type mismatch')
if (record.result?.status !== 'completed_three_tool_worker_claim_lease_boundary') fail('result status mismatch')
if (record.result?.workerLeaseClaim !== 'completed_local_mock_claim_only') fail('claim result mismatch')
for (const tool of [
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]) {
  if (!record.tools?.includes(tool)) fail(`missing tool: ${tool}`)
  if (record.readiness?.[tool] !== 'external_agent_local_mock_worker_claim_lease_passed') {
    fail(`tool readiness mismatch: ${tool}`)
  }
}
if (record.safety?.routeHandlerInvocation !== 'completed_guarded_three_tool_worker_claim_lease_handler') {
  fail('route handler invocation safety mismatch')
}
if (record.safety?.localMockWorkerLeaseClaim !== 'completed') fail('local mock lease claim mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (!['routeHandlerInvocation', 'localMockWorkerLeaseClaim'].includes(key) && value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const service = read('server/services/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1.ts')
for (const text of [
  'createWorkerClaimService(context).claimJob',
  'blocked_remote_worker_claim_requires_separate_owner_confirmation',
  'runtimeRouteInvocation: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'gpacMp4boxExecution: false',
]) {
  if (!service.includes(text)) fail(`service missing required boundary text: ${text}`)
}

const routeSource = read('server/routes/worker-routes.ts')
if (!routeSource.includes('TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH')) {
  fail('worker route missing three-tool worker claim route path')
}
if (!routeSource.includes('runThreeToolExternalAgentWorkerDispatchClaimLease')) {
  fail('worker route missing claim runner')
}
if (!routeSource.includes('threeToolExternalAgentWorkerDispatchClaimLeaseSchema')) {
  fail('worker route missing claim schema')
}
if (!routeSource.includes('requireIdempotency')) fail('route must require idempotency')

const schemaSource = read('server/validation/worker-schemas.ts')
for (const text of [
  'threeToolExternalAgentWorkerDispatchClaimLeaseSchema',
  "z.literal('persisted_job_payload_to_worker_claim_lease')",
  "z.literal('tracka_three_tool_external_agent_generated_fixture_worker')",
  "z.literal('local_mock_claim_lease_no_worker_execution')",
  'runtimeRouteInvocationRequestedNow',
  'gpacMp4boxExecutionRequestedNow',
]) {
  if (!schemaSource.includes(text)) fail(`schema missing required text: ${text}`)
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
      routePath,
      readiness: record.readiness,
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
