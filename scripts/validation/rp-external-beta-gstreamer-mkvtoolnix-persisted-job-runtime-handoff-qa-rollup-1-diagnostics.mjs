#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-HANDOFF-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_route_invocation_qa_rollup'
const execution = 'completed_local_mock_persisted_job_service_handoff_route_invocation_no_runtime_execution'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff'
const runId = '2026-07-02T12-58-02-530Z-persisted-route'
const mergeSha2130 = '8d74b8c9f9547ac68bfd6844d84b5e7d5c99794c'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-invocation-evidence.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-results.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  'HTTP 201',
  'completed_persisted_job_runtime_handoff',
  runId,
  mergeSha2130,
  '#2130',
  '#2125',
  '#577 open_draft_blocked_excluded',
  'failed_closed_confirmation_gates_not_set_in_process_env',
  'successful_process_env_gated_run',
  'Runtime route invocation: `false`',
  'GStreamer execution: `false`',
  'MKVToolNix execution: `false`',
  'Supabase mutation: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '3a12e54606c79f9723c5765db2059a43d80c4ac07306077a2e24e7bbfa6611a2',
  '8c6eb2369cb2aeea7bdcb16b66f7c1a0d9198316f8ccbcd3a9ef0dea760db417',
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

for (const file of packetFiles) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.persistedJobRuntimeHandoffPr !== 2130) fail('source PR #2130 mismatch')
if (record.sourceChain?.persistedJobRuntimeHandoffMergeSha !== mergeSha2130) fail('PR #2130 merge SHA mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeInvocation?.routePath !== routePath) fail('route path mismatch')
if (record.routeInvocation?.statusCode !== 201 || record.routeInvocation?.ok !== true) fail('route invocation status mismatch')
if (record.routeInvocation?.status !== 'completed_persisted_job_runtime_handoff') fail('route result status mismatch')
if (record.routeInvocation?.runId !== runId) fail('run ID mismatch')
if (record.routeInvocation?.runtimeInvocationBodyAccepted !== true) fail('runtime invocation body should be stored')
if (record.routeInvocation?.localMockJobServiceHandoff !== 'completed') fail('local mock job-service handoff mismatch')
if (record.harnessCaveat?.sideEffects !== 'none') fail('failed-closed harness caveat must have no side effects')
if (record.harnessCaveat?.acceptedEvidence !== 'successful_process_env_gated_run') fail('accepted evidence mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 2) fail('artifact summary mismatch')
for (const artifact of record.artifacts) {
  if (!artifact.fileName || !Number.isInteger(artifact.bytes) || artifact.bytes <= 0) fail('invalid artifact bytes')
  if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '')) fail('invalid artifact checksum')
}
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
  runId,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
