#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_runtime_handoff'
const execution = 'completed_backend_job_service_handoff_no_runtime_execution'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff'
const queueRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue'
const invocationRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke'
const runtimeRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const jobType = 'quality_check'
const payloadKind = 'gstreamer_mkvtoolnix_generated_fixture_runtime'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF'
const queueConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/persisted-job-runtime-handoff.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs',
]

const priorDiagnostics = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1-diagnostics.mjs',
]

const downstreamQaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/route-invocation-evidence.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-results.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-diagnostics.mjs',
]

const remoteWorkerClaimLeaseRuntimeValidationFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/schema-compatibility-repair.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/remote-validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/persisted-job-runtime-route-invocation.md',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  ...priorDiagnostics,
  ...downstreamQaRollupFiles,
  ...remoteWorkerClaimLeaseRuntimeValidationFiles,
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  queueRoutePath,
  invocationRoutePath,
  runtimeRoutePath,
  jobType,
  payloadKind,
  'db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity',
  `${confirmEnv}=true`,
  `${queueConfirmEnv}=true`,
  'backend_job_service_handoff_no_runtime_execution',
  'completed_job_service_job_batch_and_job_handoff',
  'ready_for_persisted_job_runtime_route_invocation',
  '#2113',
  '#2115',
  '#2120',
  '#2122',
  '#2125',
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
  /"runtimeRouteInvocation"\s*:\s*true/i,
  /runtimeRouteInvocation:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"workerLeaseClaim"\s*:\s*true/i,
  /workerLeaseClaim:\s*true/i,
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
  /"privateMediaProcessing"\s*:\s*true/i,
  /privateMediaProcessing:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /userMediaProcessing:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /externalBetaUnlock:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('createJobService')) fail('service must use existing backend job service')
if (!service.includes('createJobBatch')) fail('service must create a job batch')
if (!service.includes('createJob')) fail('service must create a job')
if (!service.includes('payloadJson')) fail('service must store runtime invocation payload as job metadata')
if (!service.includes('runtimeInvocationBody')) fail('service must build runtime invocation body without executing it')
if (!service.includes('supabaseMutationRequestedNow')) fail('service must reject broad request-level Supabase mutation flags')
if (service.includes('runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation(')) {
  fail('persisted handoff service must not invoke the runtime route directly')
}
if (service.includes('runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(')) {
  fail('persisted handoff service must not invoke the runtime worker bridge directly')
}
if (!service.includes('workerDispatch: false') || !service.includes('workerExecution: false')) {
  fail('worker execution flags must remain false')
}
if (!service.includes("'service_role_job_batch_and_job_insert_only'")) {
  fail('service-role scope must stay limited to job batch and job records only')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixPersistedJobRuntimeHandoffSchema')) {
  fail('persisted handoff schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixPersistedJobRuntimeHandoff')) {
  fail('persisted handoff route handler not registered')
}
if (!workerRoutes.includes('requireIdempotency')) fail('route must require idempotency')
if (!workerRoutes.includes('RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH')) {
  fail('route path constant not registered')
}

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixPersistedJobRuntimeHandoffSchema')) {
  fail('worker schema missing persisted handoff schema')
}
if (!schema.includes("z.literal('backend_job_service_handoff_no_runtime_execution')")) {
  fail('schema missing persisted handoff mode literal')
}
if (!schema.includes('persistedJobWriteConfirmed')) fail('schema missing persisted job write confirmation')
if (!schema.includes('runtimeRouteInvocationRequestedNow')) fail('schema missing unsafe runtime invocation request flag')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.runtimeRouteBridgePr !== 2113) fail('source PR #2113 mismatch')
if (record.sourceChain?.runtimeRouteBridgeQaRollupPr !== 2115) fail('source PR #2115 mismatch')
if (record.sourceChain?.approvedSnapshotQueueHandoffPr !== 2120) fail('source PR #2120 mismatch')
if (record.sourceChain?.queuedJobRuntimeRouteInvocationPr !== 2122) fail('source PR #2122 mismatch')
if (record.sourceChain?.queuedJobRuntimeQaRollupPr !== 2125) fail('source PR #2125 mismatch')
if (record.sourceChain?.queuedJobRuntimeQaRollupMergeSha !== '26ba53f12eee7b1bcce6786de5492a29f5a21930') {
  fail('source PR #2125 merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.path !== routePath) fail('route path mismatch')
if (record.route?.jobType !== jobType) fail('job type mismatch')
if (record.route?.payloadKind !== payloadKind) fail('payload kind mismatch')
if (record.route?.schemaCompatibility !== 'db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity') {
  fail('schema compatibility marker mismatch')
}
if (record.route?.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (record.route?.queueHandoffConfirmationGate !== queueConfirmEnv) fail('queue confirmation gate mismatch')
if (record.route?.queueHandoffRoutePath !== queueRoutePath) fail('queue handoff route path mismatch')
if (record.route?.runtimeInvocationRoutePath !== invocationRoutePath) fail('runtime invocation route path mismatch')
if (record.route?.runtimeRoutePath !== runtimeRoutePath) fail('runtime route path mismatch')
if (record.route?.readiness !== 'ready_for_persisted_job_runtime_route_invocation') fail('readiness mismatch')
if (record.validationMode?.localMockJobServiceHandoff !== 'passed') fail('local mock validation result mismatch')
if (record.validationMode?.serviceRoleJobWriteDuringValidation !== 'not_run') fail('service-role validation result mismatch')
if (record.validationMode?.runtimeRouteInvocationDuringHandoff !== false) fail('runtime route invocation must not run')
if (record.validationMode?.gstreamerExecutionDuringHandoff !== false) fail('GStreamer must not run')
if (record.validationMode?.mkvtoolnixExecutionDuringHandoff !== false) fail('MKVToolNix must not run')
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
  invocationRoutePath,
  jobType,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
