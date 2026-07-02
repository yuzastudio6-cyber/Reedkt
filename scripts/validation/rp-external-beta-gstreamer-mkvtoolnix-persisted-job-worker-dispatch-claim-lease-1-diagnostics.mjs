#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_boundary'
const execution = 'completed_local_mock_worker_claim_lease_no_worker_execution_or_tool_execution'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease'
const mergeSha2139 = 'e1f3e3a661c5fd8299d4a85189c86670a4db2568'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-OWNER-GATE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-claim-lease.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1.md',
]

const qaRollupFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1/claim-lease-evidence.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs',
]

const remoteOwnerGateFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1/owner-gate.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-diagnostics.mjs',
]

const schemaCompatibilityRepairFiles = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/persisted-job-runtime-handoff.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/route-invocation-evidence.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/persisted-job-runtime-route-invocation.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.ts',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs',
]

const remoteRuntimeValidationFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/schema-compatibility-repair.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/remote-validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-confirmed.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  ...qaRollupFiles,
  ...remoteOwnerGateFiles,
  ...schemaCompatibilityRepairFiles,
  ...remoteRuntimeValidationFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true',
  'local_mock_claim_lease_no_worker_execution',
  'gstreamer_mkvtoolnix_generated_fixture_worker',
  'completed_local_mock_claim_only',
  'worker-claim mutation',
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE',
  'remote_supabase_worker_claim_lease_no_worker_execution',
  '#2139',
  mergeSha2139,
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
  /"remoteWorkerClaim"\s*:\s*true/i,
  /remoteWorkerClaim:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"persistentJobQueueWrite"\s*:\s*true/i,
  /persistentJobQueueWrite:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('createWorkerClaimService(context).claimJob')) fail('service must use worker claim service')
if (!service.includes('blocked_remote_worker_claim_requires_separate_owner_confirmation')) {
  fail('service must block remote worker claim')
}
if (!service.includes('workerDispatch: false') || !service.includes('workerExecution: false')) {
  fail('worker dispatch/execution must remain false')
}
if (!service.includes('validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput')) {
  fail('service must validate persisted runtime invocation payload')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseSchema')) {
  fail('worker route schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease')) {
  fail('worker route handler not registered')
}
if (!workerRoutes.includes('RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH')) {
  fail('worker route path not registered')
}
if (!workerRoutes.includes('requireIdempotency')) fail('route must require idempotency')

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseSchema')) {
  fail('worker schema missing claim lease schema')
}
if (!schema.includes("z.enum([") || !schema.includes('local_mock_claim_lease_no_worker_execution')) {
  fail('schema missing claim lease mode enum')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.persistedJobRuntimeRouteInvocationQaRollupPr !== 2139) fail('source PR #2139 mismatch')
if (record.sourceChain?.persistedJobRuntimeRouteInvocationQaRollupMergeSha !== mergeSha2139) {
  fail('PR #2139 merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.path !== routePath) fail('route path mismatch')
if (record.route?.confirmationGate !== 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE') {
  fail('confirmation gate mismatch')
}
if (record.route?.claimLeaseMode !== 'local_mock_claim_lease_no_worker_execution') fail('claim lease mode mismatch')
if (record.route?.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker') fail('worker type mismatch')
if (record.result?.status !== 'completed_persisted_job_worker_claim_lease_boundary') fail('result status mismatch')
if (record.result?.workerLeaseClaim !== 'completed_local_mock_claim_only') fail('claim result mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false in record: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
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
