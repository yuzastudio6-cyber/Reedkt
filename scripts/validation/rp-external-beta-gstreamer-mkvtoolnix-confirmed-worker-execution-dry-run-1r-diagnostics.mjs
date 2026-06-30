#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r'
const recordPath = `${dir}/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_confirmed_worker_execution_dry_run_contract_validation'
const execution = 'completed_confirmation_gated_worker_dry_run_envelope_validation_no_runtime_execution'
const runId = '2026-06-30T14-04-16-505Z-987c5507'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/dry-run-result.md`,
  `${dir}/worker-dry-run-envelope.md`,
  `${dir}/artifact-manifest-summary.md`,
  `${dir}/blocked-scope-register.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1.md',
]

const implementationFiles = [
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enablement-review-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-contract-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1/gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-1/gstreamer-mkvtoolnix-confirmation-gated-worker-execution-plan-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-enablement-review-1/gstreamer-mkvtoolnix-guarded-worker-enablement-review-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-disabled-worker-scaffold-1/gstreamer-mkvtoolnix-disabled-worker-scaffold-record.json',
  'docs/external-beta/gstreamer-mkvtoolnix-agent-execution-contract-1/gstreamer-mkvtoolnix-agent-execution-contract-record.json',
  'docs/external-beta/tool-execution-readiness-matrix-1/tool-execution-readiness-matrix-record.json',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])

const requiredText = [
  packet,
  decision,
  execution,
  '4862913316df39324b3245500b21e1dd81f6ca88',
  runId,
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true',
  'Confirmation gate observed: `present_true`',
  'completed_confirmed_worker_dry_run_contract_validation',
  'approved-snapshot-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'approval-record-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'no-spend-fixture-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'worker-lease-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'idempotency-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'private-input-manifest-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'f838f821305a2c1576202c9be0ace3479c0eb0bbe6a71e7fe84cc8a531338081',
  '61868fade2aa1f305a59d1158752d6ff6da82c0cfe27e57fab211509a59ad6cf',
  '0dd6dde05ae5e893531a9c7029a7a4329a34ee60a73693d093714e0aa3ffa9d7',
  '73773e58d4eeb5966da29a3ef32fd494a3fe0ef31d79de0307a2e3e1a357cff6',
  'Worker dispatch: `not_run_dry_run_contract_validation_only`',
  'Worker execution: `not_run_dry_run_contract_validation_only`',
  'Tool execution: `not_run_dry_run_contract_validation_only`',
  'GStreamer execution: `not_run_dry_run_contract_validation_only`',
  'MKVToolNix execution: `not_run_dry_run_contract_validation_only`',
  'ready_for_guarded_worker_route_implementation',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked/excluded',
]

const falseSafetyKeys = [
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'gstreamerExecution',
  'mkvtoolnixExecution',
  'gpacMp4boxExecution',
  'vapoursynthExecution',
  'revideoExecution',
  'filmExecution',
  'qwenExecution',
  'aiGraphicsExecution',
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
  'iamMutation',
  'googleGroupMembershipMutation',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalRenderExport',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'cloudRunReadback',
  'cloudRunServiceUpdate',
  'broadServiceRoleHandler',
]

const forbiddenChangedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/rp-external-beta-gstreamer-mkvtoolnix-disabled-worker-scaffold-1-smoke\.ts$)/,
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
  /\bWorker dispatch:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bWorker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bTool execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:GStreamer|MKVToolNix|GPAC\/MP4Box|VapourSynth|Revideo|FILM|QWEN|FFmpeg\/FFprobe|Docker|Remotion) execution in this dry-run phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Route execution|Service-role route execution|Signed URL creation|Public artifact creation|Private media processing|User media processing|Dependency mutation|Package-lock mutation)\s*:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"gstreamerExecution"\s*:\s*true/i,
  /"mkvtoolnixExecution"\s*:\s*true/i,
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
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched in packet corpus: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '4862913316df39324b3245500b21e1dd81f6ca88') fail('integration base mismatch')
if (record.runId !== runId) fail('run ID mismatch')
if (record.sourceChain?.confirmedWorkerDryRun1Merge !== '4862913316df39324b3245500b21e1dd81f6ca88') fail('dry-run 1 merge mismatch')
if (record.sourceChain?.confirmedWorkerDryRun1 !== 'blocked_missing_confirmation_gate') fail('dry-run 1 source mismatch')
if (record.sourceChain?.confirmationGatedWorkerExecutionPlan !== 'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run') fail('plan source mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.confirmationGate?.observed !== 'present_true') fail('confirmation gate observed mismatch')
if (record.dryRun?.status !== 'completed_confirmed_worker_dry_run_contract_validation') fail('dry-run status mismatch')
if (record.dryRun?.requiredReferencesNamed !== true) fail('required references flag mismatch')
if (record.dryRun?.privateInputManifestChecksum !== 'f838f821305a2c1576202c9be0ace3479c0eb0bbe6a71e7fe84cc8a531338081') fail('private input manifest checksum mismatch')
if (record.dryRun?.workerDispatch !== 'not_run_dry_run_contract_validation_only') fail('worker dispatch status mismatch')
if (record.dryRun?.workerExecution !== 'not_run_dry_run_contract_validation_only') fail('worker execution status mismatch')
if (record.dryRun?.toolExecution !== 'not_run_dry_run_contract_validation_only') fail('tool execution status mismatch')
if (record.readiness?.gstreamer !== 'ready_for_guarded_worker_route_implementation') fail('GStreamer readiness mismatch')
if (record.readiness?.mkvtoolnix !== 'ready_for_guarded_worker_route_implementation') fail('MKVToolNix readiness mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 3) fail('artifact summary mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const packageJson = json('package.json')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r.mjs'
) {
  fail('missing 1R runner script')
}
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-diagnostics.mjs'
) {
  fail('missing 1R diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'staged package-lock.json changed')

const changedFiles = new Set([
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
])
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) {
    fail(`changed file outside allowed scope: ${file}`)
  }
  for (const pattern of forbiddenChangedPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const text = read(file)
    for (const pattern of forbiddenClaimPatterns) {
      if (pattern.test(text)) fail(`forbidden claim matched in changed file ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('GStreamer/MKVToolNix dry run 1R: completed_confirmed_worker_dry_run_contract_validation')
console.log(`Next milestone: ${nextMilestone}`)
