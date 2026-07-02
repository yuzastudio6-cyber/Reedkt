#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-OWNER-GATE-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_owner_gate_source_path'
const execution = 'completed_remote_worker_claim_lease_source_gate_no_remote_execution'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease'
const localMode = 'local_mock_claim_lease_no_worker_execution'
const remoteMode = 'remote_supabase_worker_claim_lease_no_worker_execution'
const persistedGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE'
const remoteGate = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/owner-gate.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-smoke.ts',
  'server/validation/worker-schemas.ts',
  'server/routes/worker-routes.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-diagnostics.mjs',
]

const claimLeasePacketFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-results.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  ...claimLeasePacketFiles,
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  localMode,
  remoteMode,
  persistedGate,
  remoteGate,
  'remoteWorkerClaimLeaseConfirmed',
  'worker_claim_lease_only',
  'completed_remote_worker_claim_only',
  'approved snapshot reference',
  '#2144',
  '#577 remains open/draft/blocked and excluded',
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

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /"remoteExecutionInThisPhase"\s*:\s*true/i,
  /remoteExecutionInThisPhase:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /sqlExecution:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /secretPayloadAccess:\s*true/i,
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
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-diagnostics.mjs'
) fail('missing remote worker claim lease owner gate diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes(remoteGate)) fail('service missing remote confirmation env')
if (!service.includes(remoteMode)) fail('service missing remote claim mode')
if (!service.includes('remoteWorkerClaimLeaseConfirmed')) fail('service missing payload remote confirmation')
if (!service.includes('hasRemoteAdminContext')) fail('service missing remote admin context guard')
if (!service.includes('createWorkerClaimService(context).claimJob')) fail('service must use worker claim service')
if (!service.includes('workerDispatch: false') || !service.includes('workerExecution: false')) {
  fail('worker dispatch/execution must remain false')
}
if (!service.includes("supabaseMutation: completedRemoteClaim ? 'worker_claim_lease_only' : false")) {
  fail('service must expose scoped remote Supabase mutation marker only')
}

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes("z.enum([") || !schema.includes(remoteMode) || !schema.includes('remoteWorkerClaimLeaseConfirmed')) {
  fail('schema must require explicit local/remote claim mode and optional remote payload confirmation')
}

const smoke = read('server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-smoke.ts')
for (const text of [
  'remote_worker_claim_requires_second_confirmation_gate',
  'remote_worker_claim_stub_succeeds_without_worker_execution',
  'completed_remote_worker_claim_only',
  'RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_CONFIRM_ENV',
]) {
  if (!smoke.includes(text)) fail(`smoke missing remote gate coverage: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.routePath !== routePath) fail('route path mismatch')
if (record.localClaimMode !== localMode) fail('local mode mismatch')
if (record.remoteClaimMode !== remoteMode) fail('remote mode mismatch')
if (!record.confirmationGates?.includes(persistedGate) || !record.confirmationGates?.includes(remoteGate)) {
  fail('record confirmation gates mismatch')
}
if (record.payloadConfirmation !== 'remoteWorkerClaimLeaseConfirmed') fail('payload confirmation mismatch')
if (record.futureRemoteMutationScope !== 'worker_claim_lease_only') fail('remote mutation scope mismatch')
for (const key of [
  'remoteExecutionInThisPhase',
  'workerDispatch',
  'workerExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'privateMediaProcessing',
  'userMediaProcessing',
  'sqlExecution',
  'secretPayloadAccess',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (record[key] !== false) fail(`record flag must remain false: ${key}`)
}
if (record.sourceChain?.localMockClaimLeaseQaPr !== 2144) fail('PR #2144 source chain mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product ready count mismatch')
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
  localMode,
  remoteMode,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
