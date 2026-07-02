#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation'
const execution = 'completed_guarded_transaction_rolled_back_remote_worker_claim_lease_validation'
const confirmedScript = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-confirmed.mjs'
const diagnosticsScript = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-diagnostics.mjs'
const jobType = 'quality_check'
const payloadKind = 'gstreamer_mkvtoolnix_generated_fixture_runtime'
const compatibility = 'db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_RUNTIME_VALIDATION'
const dbUrlEnv = 'REEDITPRO_STAGING_SUPABASE_DB_URL'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/schema-compatibility-repair.md`,
  `${dir}/remote-validation-results.md`,
  `${dir}/safety-boundary.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.ts',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.ts',
  'server/validation/worker-schemas.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1-diagnostics.mjs',
  confirmedScript,
  diagnosticsScript,
]

const priorDocs = [
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/persisted-job-runtime-handoff.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1/route-invocation-evidence.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1/persisted-job-runtime-route-invocation.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...sourceFiles, ...priorDocs, 'package.json'])

const requiredText = [
  packet,
  decision,
  execution,
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'staging',
  `${confirmEnv}=true`,
  dbUrlEnv,
  jobType,
  payloadKind,
  compatibility,
  'public.can_claim_worker_job',
  'public.active_worker_claim_exists',
  'public.worker_job_claims',
  'rollback',
  'canRunBefore',
  'canClaimBefore',
  'activeClaimAfter',
  'canClaimAfter',
  '52379625980493d9e0b09c1af718f2c02f6d70a1e72ed6cb2f99561c881e602d',
  '#2147',
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
  /^supabase\/migrations\//,
  /^supabase\/functions\//,
  /^database\//,
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
  /"workerDispatch"\s*:\s*true/i,
  /workerDispatch:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /workerExecution:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /gstreamerExecution:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /mkvtoolnixExecution:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /ffmpegFfprobeExecution:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /dockerExecution:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /remotionExecution:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /privateMediaProcessing:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /userMediaProcessing:\s*true/i,
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
  /Secret Manager payload access by the runner:\s*`?true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-confirmed'] !==
  `node ${confirmedScript}`
) fail('missing confirmed runner package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1:diagnostics'] !==
  `node ${diagnosticsScript}`
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const runner = read(confirmedScript)
for (const text of [
  confirmEnv,
  dbUrlEnv,
  'targetRef',
  'set local role service_role',
  'public.can_claim_worker_job',
  'public.active_worker_claim_exists',
  'public.worker_job_claims',
  'rollback;',
  'blocked_worker_claim_schema_compatibility_failed',
  'blocked_worker_claim_runtime_validation_failed',
  'blocked_worker_claim_residue_detected',
  'completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation',
]) {
  if (!runner.includes(text)) fail(`runner missing required guard: ${text}`)
}
if (runner.includes('gcloud secrets versions access')) fail('runner must not access Secret Manager payloads itself')
if (
  runner.includes("execFileSync('gst-launch") ||
  runner.includes('execFileSync("gst-launch') ||
  runner.includes("execFileSync('mkvmerge") ||
  runner.includes('execFileSync("mkvmerge') ||
  runner.includes("execFileSync('ffmpeg") ||
  runner.includes('execFileSync("ffmpeg') ||
  runner.includes("execFileSync('ffprobe") ||
  runner.includes('execFileSync("ffprobe')
) {
  fail('runner must not contain tool execution commands')
}

const service = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.ts')
if (!service.includes(`'${jobType}' as const`)) fail('handoff service must use valid DB job type')
if (!service.includes(`'${payloadKind}' as const`)) fail('handoff service must preserve payload kind')
if (!service.includes('persistedJobPayloadKind')) fail('handoff service must include payload kind')

const routeService = read('server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.ts')
if (!routeService.includes('persistedJobPayloadKind')) fail('route invocation service must type/check payload kind')
if (!routeService.includes('RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND')) {
  fail('route invocation service must use payload kind constant')
}

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes("persistedJobType: z.literal('quality_check')")) fail('schema must require quality_check persisted job type')
if (!schema.includes(`z.literal('${payloadKind}')`)) fail('schema must require payload kind')

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.confirmationGate !== confirmEnv) fail('confirmation gate mismatch')
if (record.dbUrlEnv !== dbUrlEnv) fail('db URL env mismatch')
if (record.jobType !== jobType) fail('job type mismatch')
if (record.payloadKind !== payloadKind) fail('payload kind mismatch')
if (record.schemaCompatibility !== compatibility) fail('schema compatibility mismatch')
if (record.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker') fail('worker type mismatch')
if (record.allowedRemoteScope !== 'guarded_transaction_rolled_back_worker_claim_lease_validation_fixture_only') {
  fail('allowed remote scope mismatch')
}
if (record.remoteValidation !== 'passed') fail('remote validation status mismatch')
if (record.runId !== '2026-07-02T15-13-58-300Z-7afbfde3') fail('run id mismatch')
if (record.readback?.canRunBefore !== true) fail('canRunBefore mismatch')
if (record.readback?.canClaimBefore !== true) fail('canClaimBefore mismatch')
if (record.readback?.activeClaimBefore !== false) fail('activeClaimBefore mismatch')
if (record.readback?.activeClaimAfter !== true) fail('activeClaimAfter mismatch')
if (record.readback?.canClaimAfter !== false) fail('canClaimAfter mismatch')
if (record.rollbackResidueReadback?.jobs !== 0 || record.rollbackResidueReadback?.workerJobClaims !== 0) {
  fail('rollback residue mismatch')
}
if (!Array.isArray(record.artifacts) || record.artifacts.length < 4) fail('artifact checksum summary missing')
if (record.sourceChain?.remoteWorkerClaimLeaseOwnerGatePr !== 2147) fail('source PR #2147 mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
for (const key of [
  'persistentRowsCreated',
  'workerDispatch',
  'workerExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'secretManagerPayloadAccessByRunner',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (record[key] !== false) fail(`record flag must remain false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
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

console.log(
  JSON.stringify(
    {
      ok: true,
      packet,
      decision,
      execution,
      jobType,
      payloadKind,
      compatibility,
      changedFiles: uniqueChanged,
      productReadyEndToEndLocalOssTools: 0,
      nextMilestone,
    },
    null,
    2,
  ),
)
