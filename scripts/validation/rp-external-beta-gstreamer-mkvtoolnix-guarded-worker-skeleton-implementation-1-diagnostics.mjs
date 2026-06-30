#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-SKELETON-IMPLEMENTATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_skeleton_ready_for_runtime_execution_plan'
const execution = 'completed_disabled_worker_skeleton_contract_no_worker_dispatch_or_tool_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PLAN-1'
const contractFile = 'src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-skeleton-contracts.ts'
const enqueueContractFile = 'src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-enqueue-contracts.ts'
const smokeFile = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-smoke.ts'
const diagnosticsFile = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-diagnostics.mjs'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/worker-skeleton-contract.md`,
  `${dir}/negative-test-matrix.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-plan-1.md',
]

const implementationFiles = [
  contractFile,
  'src/backend/contracts/index.ts',
  smokeFile,
  diagnosticsFile,
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/enqueue-contract.md',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1/gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-record.json',
  enqueueContractFile,
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredCorpusText = [
  packet,
  decision,
  execution,
  'd5903b517f56ad117774c48488b932bd368f0941',
  '5bf9f05c3719503f20d66638d9650f87f96fa0bd',
  'completed_gstreamer_mkvtoolnix_guarded_worker_enqueue_contract_ready_for_worker_skeleton_plan',
  'worker.gstreamerMkvtoolnix.guarded.disabledSkeleton',
  'disabled_worker_skeleton_metadata_only',
  'metadata_validation_only',
  'backend_worker_only',
  'render_export',
  'approved snapshot',
  'approval record',
  'credit/no-spend policy',
  'disabled worker lease',
  'route idempotency key',
  'command-template allowlist',
  'private input manifest',
  'output manifest schema',
  'QA report schema',
  'cleanup policy',
  'retention policy',
  'failure policy',
  'audit parent',
  'blocked_missing_mock_enqueue',
  'blocked_queue_item_not_queued',
  'blocked_raw_or_unapproved_input_attempt',
  'blocked_worker_dispatch_not_enabled',
  'blocked_worker_execution_not_enabled',
  'blocked_tool_execution_not_enabled',
  'blocked_media_processing_not_enabled',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_delivery_or_unlock_attempt',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const requiredContractText = [
  'buildGstreamerMkvtoolnixGuardedWorkerSkeletonInput',
  'validateGstreamerMkvtoolnixGuardedWorkerSkeletonInput',
  'summarizeGstreamerMkvtoolnixGuardedWorkerSkeletonBoundary',
  'GstreamerMkvtoolnixGuardedWorkerEnqueueResult',
  "skeletonMode: 'disabled_worker_skeleton_metadata_only'",
  "queueConsumptionMode: 'metadata_validation_only'",
  "workerOwner: 'backend_worker_only'",
  "workerKind: 'render_export'",
  'rawCommandStringsAllowed: false',
  'rawChatAllowed: false',
  'frontendFilePathAllowed: false',
  'publicUrlSourceOfTruthAllowed: false',
  'signedUrlSourceOfTruthAllowed: false',
  'arbitraryPrivateMediaAllowed: false',
  'serviceRoleSecretPayloadAccess: false',
  'broadServiceRoleHandler: false',
  'workerDispatchAttempted: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'ffmpegFfprobeExecution: false',
  'dockerExecution: false',
  'remotionExecution: false',
  'mediaProcessing: false',
]

const requiredSmokeText = [
  'skeleton_input_validates',
  'skeleton_registered_disabled_metadata_only',
  'queue_payload_sanitized_refs_only',
  'dispatch_execution_tool_attempts_block',
  'raw_or_unapproved_input_attempts_block',
  'non_queued_item_blocks',
  'public_artifact_and_delivery_attempts_block',
]

const falseSafetyKeys = [
  'routeExecution',
  'workerDispatchAttempted',
  'workerExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'ffmpegFfprobeExecution',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'privateMediaProcessing',
  'userMediaProcessing',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'serviceRoleSecretPayloadAccess',
  'signedUrlCreation',
  'publicArtifactCreation',
  'finalRenderExport',
  'externalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
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
  /\b(?:Route execution|Worker dispatch|Worker execution|GStreamer execution|MKVToolNix execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|Media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatchAttempted"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-smoke.ts'
) {
  fail('missing package smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

const corpus = packetFiles.map((file) => read(file)).join('\n')
for (const text of requiredCorpusText) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const contract = read(contractFile)
for (const text of requiredContractText) {
  if (!contract.includes(text)) fail(`missing required contract text: ${text}`)
}
if (contract.includes('queueMockJob(')) fail('skeleton contract must not enqueue jobs')
if (contract.includes('dispatch') && !contract.includes('workerDispatchAttempted')) {
  fail('skeleton contract includes unexpected dispatch text')
}
if (!read('src/backend/contracts/index.ts').includes("export * from './gstreamer-mkvtoolnix-guarded-worker-skeleton-contracts'")) {
  fail('contract export missing')
}

const smoke = read(smokeFile)
for (const text of requiredSmokeText) {
  if (!smoke.includes(text)) fail(`missing required smoke text: ${text}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '5bf9f05c3719503f20d66638d9650f87f96fa0bd') fail('integration base mismatch')
if (record.sourceChain?.guardedWorkerRouteMerge !== 'd5903b517f56ad117774c48488b932bd368f0941') {
  fail('route source merge mismatch')
}
if (record.sourceChain?.guardedWorkerEnqueueMerge !== '5bf9f05c3719503f20d66638d9650f87f96fa0bd') {
  fail('enqueue source merge mismatch')
}
if (record.sourceChain?.guardedWorkerEnqueueDecision !== 'completed_gstreamer_mkvtoolnix_guarded_worker_enqueue_contract_ready_for_worker_skeleton_plan') {
  fail('enqueue source decision mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.skeleton?.mode !== 'disabled_worker_skeleton_metadata_only') fail('skeleton mode mismatch')
if (record.skeleton?.queueConsumptionMode !== 'metadata_validation_only') fail('queue consumption mode mismatch')
if (record.skeleton?.status !== 'registered_disabled_worker_skeleton_metadata_only') fail('skeleton status mismatch')
if (record.skeleton?.enabled !== false) fail('skeleton must remain disabled')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.validation !== 'passed') fail('validation status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety ${key} was enabled or missing`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ...gitLines(['diff', '--cached', '--name-only']),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('Worker skeleton: registered disabled metadata-only')
console.log(`Next milestone: ${nextMilestone}`)
console.log('Product-ready end-to-end local OSS tools: 0')
