#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_generated_fixture_to_approved_snapshot_job_queue_handoff'
const execution = 'completed_backend_approved_snapshot_queue_handoff_source_for_existing_generated_fixture_runtime_route'
const integrationBase = '932cba325d9b82ea88bd2e753bb3ff92ad58cb78'
const routeBridgeMergeSha = '67602b088009779d45b0d1f26eabac65c48902fc'
const routeBridgeQaRollupMergeSha = '932cba325d9b82ea88bd2e753bb3ff92ad58cb78'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue'
const runtimeRoutePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-TO-RUNTIME-ROUTE-INVOCATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/approved-snapshot-queue-handoff.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-to-runtime-route-invocation-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-diagnostics.mjs',
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
  routePath,
  runtimeRoutePath,
  `${confirmEnv}=true`,
  'approvedSnapshotStatus: approved',
  'approvalRecordStatus: approved',
  'no_spend_generated_fixture_policy',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'local_mock_queue_handoff_only',
  'queued_handoff_to_existing_guarded_runtime_route',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'ready_for_queued_generated_fixture_runtime_route_invocation',
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('queueMockJob')) fail('service must create a local mock queue item')
if (!service.includes('runtimeRouteBody')) fail('service must carry sanitized runtime route body')
if (!service.includes('blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation')) {
  fail('service must fail closed without confirmation')
}
if (!service.includes('blocked_unsupported_generated_fixture_queue_handoff_payload')) {
  fail('service must reject unsupported payloads')
}
if (!service.includes('blocked_runtime_or_remote_execution_not_enabled_for_queue_handoff')) {
  fail('service must reject immediate runtime/remote execution requests')
}
if (!service.includes('persistentJobQueueWrite: false')) fail('persistent queue write must remain false')
if (!service.includes('gstreamerExecution: false') || !service.includes('mkvtoolnixExecution: false')) {
  fail('tool execution flags must remain false')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixGeneratedFixtureApprovedSnapshotJobQueueHandoffSchema')) {
  fail('worker route schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff')) {
  fail('worker route handler not registered')
}
if (!workerRoutes.includes('requireIdempotency')) fail('route must require idempotency')

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixGeneratedFixtureApprovedSnapshotJobQueueHandoffSchema')) {
  fail('worker schema missing')
}
for (const literal of [
  "z.literal('approved')",
  "z.literal('no_spend_generated_fixture_policy')",
  "z.literal('generated_srt_and_generated_subtitle_only_mkv_fixture')",
  "z.literal('local_mock_queue_handoff_only')",
  "z.literal('backend_service_role_only')",
  "z.literal('queued_handoff_to_existing_guarded_runtime_route')",
]) {
  if (!schema.includes(literal)) fail(`schema missing literal: ${literal}`)
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
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.queueHandoffRoutePath !== routePath) fail('queue route path mismatch')
if (record.route?.runtimeRoutePath !== runtimeRoutePath) fail('runtime route path mismatch')
if (record.route?.confirmationGate !== `${confirmEnv}=true`) fail('confirmation gate mismatch')
if (record.route?.runtimeRouteBodyStoredInQueuePayload !== true) fail('runtime route body payload flag mismatch')
if (record.route?.readiness !== 'ready_for_queued_generated_fixture_runtime_route_invocation') fail('readiness mismatch')
if (!Array.isArray(record.allowedCommandTemplates) || record.allowedCommandTemplates.length !== 4) {
  fail('allowed command template list mismatch')
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
  runtimeRoutePath,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
