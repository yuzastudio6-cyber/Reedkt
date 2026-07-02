#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_qa_rollup'
const execution = 'completed_guarded_persisted_job_payload_to_runtime_route_invocation_generated_fixture_evidence'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke'
const mergeSha2137 = 'fad2e985523adb0a5882fc634b5f39cabd3b4570'
const runId = '2026-07-02T13-20-30-016Z-persisted-route-invoke'
const runtimeRunId = '2026-07-02T13-20-30-119Z-52de7c0c'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-invocation-evidence.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  'HTTP `201`',
  'completed_persisted_job_runtime_route_invocation',
  'completed_local_payload_read_only',
  'completed_existing_guarded_runtime_route_delegate',
  'completed_controlled_generated_fixture_only',
  runId,
  runtimeRunId,
  mergeSha2137,
  '#2137',
  '#2132',
  '#2130',
  '#577 open_draft_blocked_excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'ef7c3c7cd62daa6764b1f29f7d61fd109d08eb75c7c1312394c720e2833bba07',
  '2fa1d08637bf6cf2f71f63dc427f0780ce852729b1fbf1882d75677d26bb5eae',
  '6ee069e1f7d340961ae5d5b2e94c089bfebe7628ee391309a977ca7c61ec5dd0',
  'e831d9570ad9f7019146545ea398fac56087341e606601952d30467007f42436',
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

for (const file of packetFiles) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-qa-rollup-1-diagnostics.mjs'
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
if (record.sourceChain?.persistedJobRuntimeRouteInvocationPr !== 2137) fail('source PR #2137 mismatch')
if (record.sourceChain?.persistedJobRuntimeRouteInvocationMergeSha !== mergeSha2137) fail('PR #2137 merge SHA mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeInvocation?.routePath !== routePath) fail('route path mismatch')
if (record.routeInvocation?.statusCode !== 201 || record.routeInvocation?.ok !== true) fail('route invocation status mismatch')
if (record.routeInvocation?.status !== 'completed_persisted_job_runtime_route_invocation') fail('route result status mismatch')
if (record.routeInvocation?.runId !== runId) fail('run ID mismatch')
if (record.routeInvocation?.runtimeRunnerRunId !== runtimeRunId) fail('runtime run ID mismatch')
if (record.routeInvocation?.persistedJobPayloadRead !== 'completed_local_payload_read_only') fail('payload read mismatch')
if (record.routeInvocation?.runtimeInvocationBodyAccepted !== true) fail('runtime invocation body should be accepted')
if (record.routeInvocation?.runtimeRouteInvocation !== 'completed_existing_guarded_runtime_route_delegate') fail('runtime route delegate mismatch')
if (record.routeInvocation?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer scope mismatch')
if (record.routeInvocation?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix scope mismatch')
if (record.routeInvocation?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media scope mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 7) fail('artifact summary mismatch')
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
