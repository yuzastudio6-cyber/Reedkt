#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1R-AFTER-QWEN-DRY-RUN-BLOCKER'
const decision = 'completed_release_go_no_go_compatibility_after_qwen_dry_run_blocker'
const execution = 'completed_docs_diagnostics_only_release_go_no_go_compatibility_no_runtime_execution'
const packetDir = 'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/compatibility-decision.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/release-go-no-go-1r-record.json`,
  'docs/activation-phase-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker.md',
]

const requiredExistingFiles = [
  'docs/external-beta/release-go-no-go-1/release-decision-record.json',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json',
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/source-audit.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/auth-path-readback.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/readiness-boundary.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/validation-results.md',
  'docs/external-beta/qwen-real-dispatch-auth-path-readback-1/qwen-real-dispatch-auth-path-readback-record.json',
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-auth-path-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-real-dispatch-auth-path-readback-1.md',
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-auth-path-readback-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '7a8183313cf358f337db76ac0e34eadfb173e274',
  'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt',
  'completed_external_beta_current_readiness_rollup_after_qwen_orchestration',
  'go_controlled_single_tester_external_beta_lane_remains_open',
  'completed_single_tester_safe_gate_burndown_active_lane_ready_for_feedback_driven_iteration',
  'blocked_no_additional_named_tester_list',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded',
]

const forbiddenPatterns = [
  /externalBetaAudienceExpansion"?\s*:\s*true/i,
  /broadExternalBetaAudienceUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /qwen25VlExecution"?\s*:\s*true/i,
  /cloudRunInvocation"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /dockerExecution"?\s*:\s*true/i,
  /remotionExecution"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /dependencyMutation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /External beta unlocked in this packet:\s*`?true`?/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'server/',
  'src/',
  'docker/',
  'cloudbuild/',
  '.github/',
  '.dockerignore',
  'Dockerfile',
  'requirements',
  '.env',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
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

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/release-go-no-go-1r-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationHead !== '7a8183313cf358f337db76ac0e34eadfb173e274') fail('integration head mismatch')
if (record.sourceEvidence?.qwenDryRunAttemptPr !== 1724) fail('missing #1724 evidence')
if (record.sourceEvidence?.qwenDryRunAttemptMergeSha !== '7a8183313cf358f337db76ac0e34eadfb173e274') fail('dry-run merge SHA mismatch')
if (record.sourceEvidence?.qwenDryRunAttemptDecision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('dry-run decision mismatch')
}
if (record.readiness?.controlledSingleTesterLane !== 'open') fail('controlled single-tester lane mismatch')
if (record.readiness?.broadExternalBetaExpansion !== 'blocked_no_additional_named_tester_list') fail('broad expansion blocker mismatch')
if (record.readiness?.qwenRealDispatchDryRunAttempt !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('QWEN dry-run blocker mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

for (const key of [
  'externalBetaAudienceExpansion',
  'productionUnlock',
  'paidProductionUnlock',
  'publicArtifactCreation',
  'finalRenderExport',
  'providerCall',
  'modelCall',
  'qwen25VlExecution',
  'cloudRunInvocation',
  'identityTokenFetch',
  'workerDispatch',
  'workerExecution',
  'supabaseMutation',
  'sqlExecution',
  'secretManagerPayloadAccess',
  'signedUrlCreation',
  'creditMutation',
  'dockerExecution',
  'remotionExecution',
  'mediaProcessing',
  'dependencyMutation',
  'packageLockMutation',
]) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.safety?.docsDiagnosticsOnly !== true) fail('docs diagnostics flag must be true')

const release = parseJson('docs/external-beta/release-go-no-go-1/release-decision-record.json')
if (release.decision !== 'approved_external_beta_release_go_no_go_source_chain_accepted') fail('historical release decision drift')
if (release.readiness?.externalBetaUnlock !== false) fail('historical release unlock drift')

const currentRollup = parseJson('docs/external-beta/current-readiness-rollup-1/rollup-record.json')
if (currentRollup.decision !== 'blocked_no_additional_named_tester_list') fail('current rollup broad tester blocker mismatch')
if (currentRollup.statuses?.externalProductBeta !== 'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list') {
  fail('current rollup external product beta status mismatch')
}
if (currentRollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('current rollup product-ready count mismatch')
if (currentRollup.mainSupabaseTarget?.externalBetaUnlock !== false) fail('current rollup broad external beta unlock must remain false')
if (currentRollup.mainSupabaseTarget?.boundedTesterExpansionDecision !== 'blocked_no_additional_named_tester_list') {
  fail('current rollup bounded tester expansion decision mismatch')
}

const qwenRollup = parseJson('docs/external-beta/current-readiness-rollup-after-qwen-orchestration-1/current-readiness-rollup-record.json')
if (qwenRollup.decision !== 'completed_external_beta_current_readiness_rollup_after_qwen_orchestration') fail('QWEN rollup decision mismatch')
if (qwenRollup.statuses?.externalProductBeta !== 'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list') {
  fail('QWEN rollup external beta status mismatch')
}
if (qwenRollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('QWEN rollup product-ready count mismatch')
if (qwenRollup.safety?.externalBetaGlobalUnlock !== false) fail('QWEN rollup global unlock must be false')

const qwenDryRun = parseJson('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json')
if (qwenDryRun.decision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('QWEN dry-run record decision mismatch')
}
if (qwenDryRun.transportReadback?.result !== 'blocked_reauthentication_required') fail('QWEN dry-run readback blocker mismatch')
if (qwenDryRun.transportReadback?.remoteRequestSent !== false) fail('QWEN dry-run must not have sent a remote request')
if (qwenDryRun.runtimePosture?.cloudRunInvocation !== false) fail('QWEN Cloud Run invocation must be false')
if (qwenDryRun.runtimePosture?.identityTokenFetch !== false) fail('QWEN identity token fetch must be false')
if (qwenDryRun.runtimePosture?.qwen25VlExecution !== false) fail('QWEN execution must be false')
if (qwenDryRun.runtimePosture?.workerDispatch !== false) fail('QWEN worker dispatch must be false')

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker:diagnostics'] !==
  'node scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs'
) {
  fail('missing package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
execFileSync('git', ['diff', '--cached', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked path changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('QWEN dry-run blocker: blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt')
