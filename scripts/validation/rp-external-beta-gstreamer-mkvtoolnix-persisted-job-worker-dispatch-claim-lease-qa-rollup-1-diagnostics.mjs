#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_qa_rollup'
const execution = 'completed_guarded_local_mock_worker_claim_lease_route_evidence_no_worker_execution'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease'
const mergeSha2142 = 'c4985403f580def679842ff7b4898399e1d6caa6'
const runId = '2026-07-02T13-37-20-344Z-claim-lease'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-OWNER-GATE-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/claim-lease-evidence.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1.md',
]

const claimLeasePacketFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1/gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-results.md',
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

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-smoke.ts',
  'server/validation/worker-schemas.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...claimLeasePacketFiles,
  ...remoteOwnerGateFiles,
  ...sourceFiles,
  'package.json',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  routePath,
  'HTTP `201`',
  'completed_persisted_job_worker_claim_lease_boundary',
  'completed_local_mock_claim_only',
  runId,
  mergeSha2142,
  '#2142',
  '#577 open_draft_blocked_excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '4f1b7e6153f93fca1963b5a4b1e57d8aa71d5057cd1faca0299cea51635041b0',
  'bf268addb5d879b75fc3076e16bebee1140b47ceb24174f0af55739da4838ec2',
  nextMilestone,
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
  /"supabaseMutation"\s*:\s*true/i,
  /supabaseMutation:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /sqlExecution:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /publicArtifactCreation:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /finalRenderExport:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /privateMediaProcessing:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /userMediaProcessing:\s*true/i,
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
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1-diagnostics.mjs'
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
if (record.sourceChain?.persistedJobWorkerClaimLeasePr !== 2142) fail('source PR #2142 mismatch')
if (record.sourceChain?.persistedJobWorkerClaimLeaseMergeSha !== mergeSha2142) fail('PR #2142 merge SHA mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeInvocation?.routePath !== routePath) fail('route path mismatch')
if (record.routeInvocation?.statusCode !== 201 || record.routeInvocation?.ok !== true) fail('route invocation status mismatch')
if (record.routeInvocation?.status !== 'completed_persisted_job_worker_claim_lease_boundary') fail('route result status mismatch')
if (record.routeInvocation?.runId !== runId) fail('run ID mismatch')
if (record.routeInvocation?.workerLeaseClaim !== 'completed_local_mock_claim_only') fail('claim result mismatch')
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
