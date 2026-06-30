#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-AUTH-PATH-READBACK-1'
const packetDir = 'docs/external-beta/qwen-real-dispatch-auth-path-readback-1'
const decision = 'blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r'
const execution = 'completed_auth_path_readback_no_runtime_invocation'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/auth-path-readback.md`,
  `${packetDir}/readiness-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-real-dispatch-auth-path-readback-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-real-dispatch-auth-path-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-real-dispatch-auth-path-readback-1.md',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json',
  'docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/release-go-no-go-1r-record.json',
  'docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-auth-path-readback-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-current-readiness-rollup-after-qwen-orchestration-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-release-go-no-go-1r-after-qwen-dry-run-blocker-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-real-dispatch-auth-path-readback-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  '070e491fa74c61cbdcd57aeb691b7022b4cd4713',
  'aiediting@reeditpro.com',
  'reeditpro',
  'reeditpro-staging-api',
  'us-central1',
  'User credential token probe: `blocked_reauthentication_required`',
  'ADC token probe: `blocked_reauthentication_required`',
  'Noninteractive token environment: `absent`',
  'Reauthentication failed. cannot prompt during non-interactive execution.',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt',
  'completed_release_go_no_go_compatibility_after_qwen_dry_run_blocker',
  'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import',
  'go_controlled_single_tester_external_beta_lane_remains_open',
  'blocked_no_additional_named_tester_list',
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked and excluded',
]

const falseSafetyKeys = [
  'fullDraftStackImport',
  'workerRuntimeSourceImport',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'qwen25VlExecution',
  'cloudRunInvocation',
  'cloudRunDeployment',
  'identityTokenFetch',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'generatedAssetCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'broadExternalBetaAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'rawPromptExecution',
  'finalRenderExport',
  'privateMediaProcessing',
  'userMediaProcessing',
  'dockerExecution',
  'remotionExecution',
  'dependencyMutation',
  'packageLockMutation',
  'dockerfileInstallSourceChange',
  'requirementsInstallSourceChange',
  'broadServiceRoleHandler',
]

const forbiddenPatterns = [
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /cloudRunInvocation"?\s*:\s*true/i,
  /identityTokenFetch"?\s*:\s*true/i,
  /qwen25VlExecution"?\s*:\s*true/i,
  /workerDispatch"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /creditMutation"?\s*:\s*true/i,
  /broadExternalBetaAudienceUnlock"?\s*:\s*true/i,
  /paidProductionUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /finalRenderExport"?\s*:\s*true/i,
  /mediaProcessing"?\s*:\s*true/i,
  /dockerExecution"?\s*:\s*true/i,
  /remotionExecution"?\s*:\s*true/i,
  /dependencyMutation"?\s*:\s*true/i,
  /packageLockMutation"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^server\//,
  /^src\//,
  /^docker\//,
  /^cloudbuild\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile$/,
  /^requirements/i,
  /^\.env/,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-real-dispatch-auth-path-readback-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationHead !== '070e491fa74c61cbdcd57aeb691b7022b4cd4713') fail('integration head mismatch')
if (record.sourceEvidence?.qwenDryRunAttemptDecision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('QWEN dry-run source decision mismatch')
}
if (record.sourceEvidence?.releaseGoNoGo1rDecision !== 'completed_release_go_no_go_compatibility_after_qwen_dry_run_blocker') {
  fail('release go/no-go 1R source mismatch')
}
if (record.sourceEvidence?.qwenRuntimeStackFreshSourceImportDecision !== 'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import') {
  fail('fresh source import source mismatch')
}
if (record.authPathReadback?.account !== 'aiediting@reeditpro.com') fail('account mismatch')
if (record.authPathReadback?.project !== 'reeditpro') fail('project mismatch')
if (record.authPathReadback?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.authPathReadback?.region !== 'us-central1') fail('region mismatch')
if (record.authPathReadback?.userCredentialTokenProbe !== 'blocked_reauthentication_required') fail('user credential probe mismatch')
if (record.authPathReadback?.applicationDefaultCredentialTokenProbe !== 'blocked_reauthentication_required') fail('ADC probe mismatch')
if (record.authPathReadback?.noninteractiveTokenEnvironment !== 'absent') fail('token environment mismatch')
if (record.authPathReadback?.cloudRunServiceDescribeAfterTokenProbe !== 'not_run_token_probe_blocked') fail('service describe guard mismatch')
if (record.authPathReadback?.remoteRequestSent !== false) fail('remote request must be false')
if (record.readiness?.controlledSingleTesterLane !== 'open') fail('controlled lane mismatch')
if (record.readiness?.controlledTester !== 'aiediting@reeditpro.com') fail('controlled tester mismatch')
if (record.readiness?.qwenRealDispatchAuthPath !== decision) fail('auth readiness mismatch')
if (record.readiness?.broadExternalBetaExpansion !== 'blocked_no_additional_named_tester_list') fail('broad expansion blocker mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== 'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH') {
  fail('next milestone mismatch')
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.safety?.authReadbackOnly !== true) fail('auth readback flag must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}

const dryRun = parseJson('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1/qwen-real-dispatch-dry-run-attempt-record.json')
if (dryRun.decision !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') fail('dry-run decision drift')
if (dryRun.transportReadback?.remoteRequestSent !== false) fail('dry-run remote request drift')

const release1r = parseJson('docs/external-beta/release-go-no-go-1r-after-qwen-dry-run-blocker/release-go-no-go-1r-record.json')
if (release1r.decision !== 'completed_release_go_no_go_compatibility_after_qwen_dry_run_blocker') fail('release 1R decision drift')
if (release1r.readiness?.qwenRealDispatchDryRunAttempt !== 'blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt') {
  fail('release 1R QWEN blocker drift')
}

const freshImport = parseJson('docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json')
if (freshImport.decision !== 'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import') fail('fresh import decision drift')

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-real-dispatch-auth-path-readback-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-real-dispatch-auth-path-readback-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/ya29\.[A-Za-z0-9_-]+/.test(text)) fail(`Google OAuth token leaked in ${file}`)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('Next milestone: QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH')

