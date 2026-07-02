#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_payload_to_runtime_route_invocation'
const execution = 'completed_persisted_job_payload_to_existing_generated_fixture_runtime_route_delegate'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke'
const handoffRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff'
const queuedInvocationRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION'
const mergeSha2132 = '7017a3b79ca31fff51841e767122a3b096e586cd'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/persisted-job-runtime-route-invocation.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1.md',
]

const qaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1/route-invocation-evidence.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  ...qaRollupFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  handoffRoutePath,
  queuedInvocationRoutePath,
  `${confirmEnv}=true`,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION=true',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true',
  'persisted_job_payload_to_existing_runtime_route_delegate',
  'gstreamer_mkvtoolnix_generated_fixture_runtime',
  'fake_runtime_runner_in_smoke_only',
  'Real runtime route invocation during implementation validation: `false`',
  'GStreamer execution during implementation validation: `false`',
  'MKVToolNix execution during implementation validation: `false`',
  '#2132',
  mergeSha2132,
  '#577 open_draft_blocked_excluded',
  'Workers/tools execute approved snapshots, not raw chat.',
  'Every work item needs an idempotency key and approved snapshot reference.',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
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
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
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
  /"signedUrlCreation"\s*:\s*true/i,
  /signedUrlCreation:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /finalRenderExport:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /privateMediaProcessing:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /userMediaProcessing:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /paidProductionUnlock:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /productionUnlock:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation')) {
  fail('service must delegate to the existing queued runtime invocation service')
}
if (!service.includes('persistedJobPayloadJson.runtimeInvocationBody')) {
  fail('service must consume the stored persisted job runtime invocation body')
}
if (!service.includes('expectedRouteIdempotencyKey')) fail('service must derive route idempotency')
if (!service.includes('delegateSafetyValid')) fail('service must validate delegated runtime safety')
if (!service.includes('persistentJobQueueWrite: false')) fail('service must not create another persisted job write')
if (!service.includes('workerDispatch: false') || !service.includes('workerExecution: false')) {
  fail('worker execution flags must remain false')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationSchema')) {
  fail('persisted route invocation schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation')) {
  fail('persisted route invocation handler not registered')
}
if (!workerRoutes.includes('RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH')) {
  fail('route path constant not registered')
}
if (!workerRoutes.includes('requireIdempotency')) fail('route must require idempotency')

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationSchema')) {
  fail('worker schema missing persisted route invocation schema')
}
if (!schema.includes("z.literal('persisted_job_payload_to_existing_runtime_route_delegate')")) {
  fail('schema missing payload mode literal')
}
if (!schema.includes('runtimeInvocationBody: gstreamerMkvtoolnixGeneratedFixtureQueuedJobRuntimeRouteInvocationSchema')) {
  fail('schema must require queued runtime invocation body')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.persistedJobRuntimeHandoffQaRollupPr !== 2132) fail('source PR #2132 mismatch')
if (record.sourceChain?.persistedJobRuntimeHandoffQaRollupMergeSha !== mergeSha2132) fail('PR #2132 merge SHA mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.path !== routePath) fail('route path mismatch')
if (record.route?.persistedHandoffRoutePath !== handoffRoutePath) fail('handoff route path mismatch')
if (record.route?.queuedRuntimeInvocationRoutePath !== queuedInvocationRoutePath) fail('queued invocation route path mismatch')
if (record.route?.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (record.route?.persistedJobType !== 'gstreamer_mkvtoolnix_generated_fixture_runtime') fail('job type mismatch')
if (record.route?.payloadMode !== 'persisted_job_payload_to_existing_runtime_route_delegate') fail('payload mode mismatch')
if (record.route?.readiness !== 'ready_for_persisted_job_runtime_route_invocation_qa_rollup') fail('readiness mismatch')
if (record.validationMode?.runtimeRunner !== 'fake_runtime_runner_in_smoke_only') fail('validation runner mismatch')
if (record.validationMode?.realRuntimeRouteInvocationDuringImplementationValidation !== false) {
  fail('real runtime route must not run in implementation validation')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false in record: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
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
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
