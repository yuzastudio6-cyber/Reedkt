#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-RUNTIME-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_generated_fixture_queued_job_runtime_qa_rollup'
const execution = 'completed_docs_only_qa_rollup_for_confirmed_queued_job_runtime_route_invocation'
const routeInvocationMergeSha = '1101d465ee8d79b893c3964dbfde9b9060b7a565'
const runId = '2026-07-02T12-31-21-746Z-route-invoke'
const runtimeRunId = '2026-07-02T12-31-21-863Z-6184f874'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-HANDOFF-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-invocation-evidence.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.md',
]

const persistedJobRuntimeHandoffFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/persisted-job-runtime-handoff.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1/gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1.md',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-diagnostics.mjs',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1-smoke.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...persistedJobRuntimeHandoffFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routeInvocationMergeSha,
  '#2122',
  runId,
  runtimeRunId,
  routePath,
  'HTTP `201`',
  'completed_generated_fixture_queued_job_runtime_route_invocation',
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 open_draft_blocked_excluded',
  nextMilestone,
  'a8e35f407a3a6f92bbab5984e2d4adaf50dfcf355faedd65613cdd8f496527f3',
  '036f17edb8315b6c141f0ffa09c23b907921ecdaf3203bff8f24957bcc76f904',
  '73320913dba26de8b62022d12911a1f5824d09aa2519fd04c2d4c88c3a37be34',
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb)$/i,
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

for (const file of packetFiles) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1-diagnostics.mjs'
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
if (record.sourceChain?.queuedJobRuntimeRouteInvocationPr !== 2122) fail('source PR #2122 mismatch')
if (record.sourceChain?.queuedJobRuntimeRouteInvocationMergeSha !== routeInvocationMergeSha) {
  fail('route invocation merge SHA mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeInvocation?.routePath !== routePath) fail('route path mismatch')
if (record.routeInvocation?.statusCode !== 201 || record.routeInvocation?.ok !== true) fail('route invocation status mismatch')
if (record.routeInvocation?.runId !== runId) fail('run ID mismatch')
if (record.routeInvocation?.runtimeRouteRunnerRunId !== runtimeRunId) fail('runtime run ID mismatch')
if (record.routeInvocation?.status !== 'completed_generated_fixture_queued_job_runtime_route_invocation') {
  fail('route invocation status string mismatch')
}
if (!Array.isArray(record.artifacts) || record.artifacts.length < 7) fail('artifact manifest summary incomplete')
for (const artifact of record.artifacts) {
  if (!artifact.fileName || !Number.isInteger(artifact.bytes) || artifact.bytes <= 0) fail('invalid artifact summary')
  if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '')) fail('invalid artifact checksum')
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
  runId,
  runtimeRunId,
  changedFiles: uniqueChanged,
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}, null, 2))
