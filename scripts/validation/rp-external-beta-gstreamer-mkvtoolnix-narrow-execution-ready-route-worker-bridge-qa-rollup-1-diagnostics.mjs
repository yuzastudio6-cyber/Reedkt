#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-record.json`
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_execution_ready_route_worker_bridge_confirmed_invocation'
const execution = 'completed_confirmed_route_invocation_to_existing_generated_fixture_runtime_delegate'
const integrationBase = '67602b088009779d45b0d1f26eabac65c48902fc'
const runId = '2026-07-02T12-00-03-397Z-aa991010'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/qa-decision.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-to-approved-snapshot-job-queue-handoff-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  'Source PR: `#2113`',
  'Source merge SHA: `67602b088009779d45b0d1f26eabac65c48902fc`',
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute',
  'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate',
  runId,
  'completed_controlled_generated_fixture_only',
  'controlled_generated_fixture_only',
  'Private media processing: `false`',
  'User media processing: `false`',
  'Generated artifacts committed: `none`',
  'Package-lock: `unchanged`',
  'Product-ready end-to-end local OSS tools: `0`',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!validation\/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics\.mjs)/,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
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
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|Signed URL creation|Public artifact creation|Credit mutation|Deployment|Internal beta unlock|External beta unlock|Production unlock|Final render\/export|Private media processing|User media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change|broad service-role handler):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1-diagnostics.mjs'
) fail('missing QA rollup diagnostics package script')

const corpus = packetFiles.map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.routeWorkerBridgePr !== 2113) fail('source PR mismatch')
if (record.sourceChain?.routeWorkerBridgeMergeSha !== integrationBase) fail('source merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmedInvocation?.httpStatus !== 201) fail('HTTP status mismatch')
if (record.confirmedInvocation?.status !== 'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate') fail('confirmed invocation status mismatch')
if (record.confirmedInvocation?.runnerRunId !== runId) fail('run ID mismatch')
if (record.confirmedInvocation?.gstreamerExecution !== 'completed_controlled_generated_fixture_only') fail('GStreamer status mismatch')
if (record.confirmedInvocation?.mkvtoolnixExecution !== 'completed_controlled_generated_fixture_only') fail('MKVToolNix status mismatch')
if (record.confirmedInvocation?.mediaProcessing !== 'controlled_generated_fixture_only') fail('media processing status mismatch')
for (const key of [
  'privateMediaProcessing',
  'userMediaProcessing',
  'ffmpegFfprobeExecution',
  'supabaseMutation',
  'sqlExecution',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
]) {
  if (record.confirmedInvocation?.[key] !== false) fail(`confirmed invocation safety mismatch: ${key}`)
}
for (const [name, artifact] of Object.entries(record.artifacts ?? {})) {
  if (typeof artifact?.bytes !== 'number' || artifact.bytes <= 0) fail(`artifact bytes missing: ${name}`)
  if (!/^[a-f0-9]{64}$/.test(String(artifact?.sha256))) fail(`artifact checksum missing: ${name}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
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
  runId,
  changedFiles: uniqueChanged,
  nextMilestone,
}, null, 2))
