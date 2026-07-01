#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-QA-ROLLUP-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-record.json`
const bridgeRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-record.json'
const integrationBase = '0bab179dd626a7d6f688a63071af492d4f3d1cb8'
const decision = 'qa_passed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_source_evidence'
const execution =
  'completed_docs_only_narrow_external_agent_runtime_bridge_qa_rollup_no_route_worker_tool_or_media_execution'
const readiness = 'ready_for_guarded_narrow_external_agent_route_worker_boundary_planning'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/qa-review.md`,
  `${dir}/readiness.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1-diagnostics.mjs',
  'package.json',
]

const guardedRouteWorkerBoundaryFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/route-worker-boundary-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/negative-cases.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/readiness.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/safety-boundary.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/validation-results.md',
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-record.json',
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1.md',
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-diagnostics.mjs',
]

const sourceFiles = [
  bridgeRecordPath,
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1.md',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles, ...guardedRouteWorkerBoundaryFiles])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  '0bab179dd626a7d6f688a63071af492d4f3d1cb8',
  '9f83509382ad3f10db758129bcbea365ba969476',
  '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7',
  'aa2a51681c161f3005d5fc1de06370b4f7ed7bb3',
  '2026-07-01T07-13-36-296Z-7ebd9826',
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_implementation_ready_for_qa_rollup',
  'completed_backend_source_narrow_external_agent_runtime_bridge_validation_no_route_worker_tool_or_media_execution',
  'ready_for_narrow_external_agent_runtime_bridge_qa_rollup',
  'source_evidence_review_only',
  readiness,
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'Live HTTP route execution in this QA rollup phase: `false`',
  'External-agent runtime execution in this QA rollup phase: `false`',
  'Real worker dispatch in this QA rollup phase: `false`',
  'Worker process start in this QA rollup phase: `false`',
  'Worker lease claim in this QA rollup phase: `false`',
  'Persistent job queue write in this QA rollup phase: `false`',
  'GStreamer execution in this QA rollup phase: `false`',
  'MKVToolNix execution in this QA rollup phase: `false`',
  'Docker execution in this QA rollup phase: `false`',
  'FFmpeg/FFprobe execution in this QA rollup phase: `false`',
  'Supabase mutation in this QA rollup phase: `false`',
  'SQL execution in this QA rollup phase: `false`',
  'Public artifact creation in this QA rollup phase: `false`',
  'Final render/export in this QA rollup phase: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!services\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1\.ts$|smoke\/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-smoke\.ts$)/,
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

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_broad_external_beta\b/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Live HTTP route execution in this QA rollup phase|External-agent runtime execution in this QA rollup phase|Real worker dispatch in this QA rollup phase|Worker process start in this QA rollup phase|Worker execution in this QA rollup phase|Worker lease claim in this QA rollup phase|Persistent job queue write in this QA rollup phase|GStreamer execution in this QA rollup phase|MKVToolNix execution in this QA rollup phase|Docker execution in this QA rollup phase|FFmpeg\/FFprobe execution in this QA rollup phase|Remotion execution in this QA rollup phase|Private media processing in this QA rollup phase|User media processing in this QA rollup phase|Supabase mutation in this QA rollup phase|SQL execution in this QA rollup phase|Signed URL creation in this QA rollup phase|Public artifact creation in this QA rollup phase|Final render\/export in this QA rollup phase):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"liveHttpRouteExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"externalAgentRuntimeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"realWorkerDispatchInThisQaRollupPhase"\s*:\s*true/i,
  /"workerProcessStartedInThisQaRollupPhase"\s*:\s*true/i,
  /"workerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"workerLeaseClaimInThisQaRollupPhase"\s*:\s*true/i,
  /"persistentJobQueueWriteInThisQaRollupPhase"\s*:\s*true/i,
  /"gstreamerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"mkvtoolnixExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"dockerExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"ffmpegFfprobeExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"remotionExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"privateMediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"userMediaProcessingInThisQaRollupPhase"\s*:\s*true/i,
  /"supabaseMutationInThisQaRollupPhase"\s*:\s*true/i,
  /"sqlExecutionInThisQaRollupPhase"\s*:\s*true/i,
  /"signedUrlCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"publicArtifactCreationInThisQaRollupPhase"\s*:\s*true/i,
  /"finalRenderExportInThisQaRollupPhase"\s*:\s*true/i,
  /"broadExternalBetaUnlockInThisQaRollupPhase"\s*:\s*true/i,
  /"paidProductionUnlockInThisQaRollupPhase"\s*:\s*true/i,
  /"productionUnlockInThisQaRollupPhase"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-qa-rollup-1-diagnostics.mjs'
) {
  fail('missing narrow external-agent runtime bridge QA rollup diagnostics package script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.bridgePr !== 1964) fail('bridge PR mismatch')
if (record.sourceChain?.bridgeMergeSha !== integrationBase) fail('bridge merge mismatch')
if (record.sourceChain?.dryRunRunId !== '2026-07-01T07-13-36-296Z-7ebd9826') fail('dry-run run ID mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.qa?.scope !== 'source_evidence_review_only') fail('QA scope mismatch')
if (record.qa?.qaResult !== decision) fail('QA result mismatch')
if (record.readiness?.gstreamer !== readiness) fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== readiness) fail('MKVToolNix readiness mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

const bridgeRecord = json(bridgeRecordPath)
if (
  bridgeRecord.decision !==
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_implementation_ready_for_qa_rollup'
) {
  fail('bridge source decision mismatch')
}
if (bridgeRecord.nextMilestone !== packet) fail('bridge source next milestone mismatch')
if (bridgeRecord.productReadyEndToEndLocalOssTools !== 0) fail('bridge product-ready count mismatch')

gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
].sort()
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (!fs.existsSync(file)) continue
  if (file.startsWith(dir) || file.startsWith('docs/activation-phase')) {
    const text = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
