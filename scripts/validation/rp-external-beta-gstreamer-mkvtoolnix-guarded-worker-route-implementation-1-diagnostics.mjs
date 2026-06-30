#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-route-implementation-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-guarded-worker-route-implementation-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_implementation_negative_tests_ready_for_worker_enqueue_plan'
const execution = 'completed_guarded_worker_route_contract_no_route_or_tool_execution'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1'
const contractFile = 'src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-route-contracts.ts'
const smokeFile = 'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1-smoke.ts'
const diagnosticsFile = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1-diagnostics.mjs'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-contract.md`,
  `${dir}/negative-test-matrix.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1.md',
]

const implementationFiles = [
  contractFile,
  'src/backend/contracts/index.ts',
  smokeFile,
  diagnosticsFile,
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/source-audit.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/dry-run-result.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/worker-dry-run-envelope.md',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'src/backend/contracts/gstreamer-mkvtoolnix-disabled-worker-scaffold-contracts.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredCorpusText = [
  packet,
  decision,
  execution,
  '570b8de859a10a4d7f9e147705db502597df23ee',
  '4862913316df39324b3245500b21e1dd81f6ca88',
  'externalBeta.gstreamerMkvtoolnix.guardedWorkerRoute',
  '/api/external-beta/gstreamer-mkvtoolnix/worker/mock',
  'backend_service_role_only',
  'guarded_disabled_route_contract_first',
  'registered_disabled_backend_service_role_route_contract',
  'approved snapshot',
  'approval record',
  'credit/no-spend policy',
  'disabled worker lease',
  'Route idempotency key',
  'private input manifest',
  'output manifest schema',
  'QA report schema',
  'cleanup',
  'retention',
  'failure',
  'audit',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'blocked_missing_backend_service_role_context',
  'blocked_missing_approved_plan_snapshot',
  'blocked_missing_approval_record',
  'blocked_missing_credit_or_no_spend_policy',
  'blocked_missing_worker_lease',
  'blocked_missing_idempotency_key',
  'blocked_worker_contract_validation_failed',
  'blocked_idempotency_mismatch',
  'blocked_unapproved_command_template',
  'blocked_runtime_execution_not_enabled',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_delivery_or_unlock_attempt',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]

const requiredContractText = [
  'buildGstreamerMkvtoolnixGuardedWorkerRouteRequest',
  'validateGstreamerMkvtoolnixGuardedWorkerRouteRequest',
  'createGstreamerMkvtoolnixGuardedWorkerRouteResponse',
  'summarizeGstreamerMkvtoolnixGuardedWorkerRouteBoundary',
  'buildGstreamerMkvtoolnixGuardedWorkerRouteIdempotencyKey',
  'validateGstreamerMkvtoolnixDisabledWorkerScaffoldInput',
  'routeEnabled: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gstreamerExecution: false',
  'mkvtoolnixExecution: false',
  'mediaProcessing: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
  'finalRenderExport: false',
]

const requiredSmokeText = [
  'baseline_guarded_worker_route_contract_validates',
  'backend_service_role_context_required',
  'approved_snapshot_approval_credit_worker_lease_required',
  'idempotency_required_and_must_match_route_basis',
  'unapproved_command_template_blocks',
  'route_and_worker_runtime_attempts_block',
  'signed_public_artifact_and_delivery_attempts_block',
]

const falseSafetyKeys = [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'serviceRoleRouteExecution',
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
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'deployment',
  'broadExternalBetaUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'packageInstallation',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
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
  /\bready_for_live_worker_dispatch\b/i,
  /\b(?:Worker dispatch|Worker execution|Route execution|GStreamer execution|MKVToolNix execution|Media processing|Supabase mutation|SQL execution|Signed URL creation|Public artifact creation|Final render\/export):\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
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
if (!read('src/backend/contracts/index.ts').includes("export * from './gstreamer-mkvtoolnix-guarded-worker-route-contracts'")) {
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
if (record.integrationBase !== '570b8de859a10a4d7f9e147705db502597df23ee') fail('integration base mismatch')
if (record.sourceChain?.confirmedWorkerDryRun1rMerge !== '570b8de859a10a4d7f9e147705db502597df23ee') {
  fail('1R source merge mismatch')
}
if (record.sourceChain?.confirmedWorkerDryRun1r !== 'completed_gstreamer_mkvtoolnix_confirmed_worker_execution_dry_run_contract_validation') {
  fail('1R source decision mismatch')
}
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.route?.status !== 'registered_disabled_backend_service_role_route_contract') fail('route status mismatch')
if (record.route?.enabled !== false) fail('route enabled should be false')
if (record.route?.serviceRoleSecretPayloadAccess !== false) fail('service role payload access should be false')
if (record.route?.frontendCredentialExposure !== false) fail('frontend credential exposure should be false')
if (record.route?.broadServiceRoleHandler !== false) fail('broad service-role handler should be false')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1-smoke.ts'
) {
  fail('missing smoke script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1-diagnostics.mjs'
) {
  fail('missing diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'staged package-lock.json changed')

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) {
    fail(`changed file outside allowed scope: ${file}`)
  }
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const content = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(content)) fail(`forbidden claim matched in ${file}: ${pattern}`)
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routeStatus: record.route.status,
  changedFiles: [...changedFiles].sort(),
  nextMilestone,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  productReadyEndToEndLocalOssTools: 0,
}, null, 2))
