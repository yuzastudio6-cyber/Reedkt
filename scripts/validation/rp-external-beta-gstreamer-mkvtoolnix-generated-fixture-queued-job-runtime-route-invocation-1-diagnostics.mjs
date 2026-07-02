#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-TO-RUNTIME-ROUTE-INVOCATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_generated_fixture_queued_job_to_runtime_route_invocation'
const execution = 'completed_approved_snapshot_queued_job_payload_to_existing_generated_fixture_runtime_route_delegate'
const integrationBase = 'd197af4b7acdaa331782d9329ab41f306288045e'
const routeBridgeMergeSha = '67602b088009779d45b0d1f26eabac65c48902fc'
const routeBridgeQaRollupMergeSha = '932cba325d9b82ea88bd2e753bb3ff92ad58cb78'
const queueHandoffMergeSha = 'd197af4b7acdaa331782d9329ab41f306288045e'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke'
const queueRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue'
const runtimeRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION'
const queueConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF'
const runtimeConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-RUNTIME-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/queued-job-runtime-route-invocation.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  routeBridgeMergeSha,
  routeBridgeQaRollupMergeSha,
  queueHandoffMergeSha,
  routePath,
  queueRoutePath,
  runtimeRoutePath,
  `${confirmEnv}=true`,
  `${queueConfirmEnv}=true`,
  `${runtimeConfirmEnv}=true`,
  'queued_job_payload_to_existing_runtime_route_delegate',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'ready_for_generated_fixture_queued_job_runtime_qa_rollup',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 open_draft_blocked_excluded',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
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
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff')) fail('service must consume queue handoff')
if (!service.includes('runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge')) fail('service must delegate to runtime route bridge')
if (!service.includes('runtimeRunner?: () => Promise')) fail('service must expose injectable runtime runner for smoke safety')
if (!service.includes('blocked_missing_generated_fixture_queued_job_runtime_route_invocation_confirmation')) {
  fail('service must fail closed without confirmation gates')
}
if (!service.includes('runtimeRouteSafetyValid')) fail('service must verify runtime route safety')
if (!service.includes('workerDispatch: false') || !service.includes('workerExecution: false')) {
  fail('worker execution flags must remain false')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixGeneratedFixtureQueuedJobRuntimeRouteInvocationSchema')) {
  fail('worker route schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation')) {
  fail('worker route handler not registered')
}
if (!workerRoutes.includes('requireIdempotency')) fail('route must require idempotency')

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixGeneratedFixtureQueuedJobRuntimeRouteInvocationSchema')) {
  fail('worker schema missing')
}
if (!schema.includes("z.literal('queued_job_payload_to_existing_runtime_route_delegate')")) {
  fail('schema missing invocation mode literal')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeBridgePr !== 2113) fail('source PR #2113 mismatch')
if (record.sourceChain?.routeBridgeMergeSha !== routeBridgeMergeSha) fail('route bridge merge mismatch')
if (record.sourceChain?.routeBridgeQaRollupPr !== 2115) fail('source PR #2115 mismatch')
if (record.sourceChain?.routeBridgeQaRollupMergeSha !== routeBridgeQaRollupMergeSha) fail('route bridge QA merge mismatch')
if (record.sourceChain?.approvedSnapshotQueueHandoffPr !== 2120) fail('source PR #2120 mismatch')
if (record.sourceChain?.approvedSnapshotQueueHandoffMergeSha !== queueHandoffMergeSha) fail('queue handoff merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.invocationRoutePath !== routePath) fail('invocation route path mismatch')
if (record.route?.queueHandoffRoutePath !== queueRoutePath) fail('queue route path mismatch')
if (record.route?.runtimeRoutePath !== runtimeRoutePath) fail('runtime route path mismatch')
if (record.route?.invocationMode !== 'queued_job_payload_to_existing_runtime_route_delegate') fail('invocation mode mismatch')
if (record.route?.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') fail('fixture scope mismatch')
if (record.route?.readiness !== 'ready_for_generated_fixture_queued_job_runtime_qa_rollup') fail('readiness mismatch')
if (record.runtimeScope?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer runtime scope mismatch')
if (record.runtimeScope?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix runtime scope mismatch')
if (record.runtimeScope?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media scope mismatch')
if (record.runtimeScope?.privateMediaProcessing !== false || record.runtimeScope?.userMediaProcessing !== false) {
  fail('private/user media scope mismatch')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false in record: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must be unchanged')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must not be staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routePath,
  queueRoutePath,
  runtimeRoutePath,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
