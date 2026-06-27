#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-BROWSER-WALKTHROUGH-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/controlled-owner-browser-walkthrough-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/browser-walkthrough-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-owner-browser-walkthrough-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-owner-browser-walkthrough-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-controlled-owner-go-no-go-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1.mjs',
  'scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/rp-external-beta-deployed-browser-ui-surface-1r-staging-deploy-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-tester-ui-flow-smoke-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'completed_external_beta_controlled_owner_browser_walkthrough',
  'completed_guarded_authenticated_browser_surface_walkthrough_no_runtime_mutation',
  'aiediting@reeditpro.com',
  'real_reeditpro_owner_tester_account',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'reeditpro-staging-api-00006-6gw',
  'ready_for_controlled_owner_go_no_go',
  'RP-EXTERNAL-BETA-CONTROLLED-OWNER-GO-NO-GO-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.',
]

const falseSafetyKeys = [
  'groupMembershipMutation',
  'cloudRunIamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'broadPublicInvokerGrant',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'serviceRoleRouteExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'persistentCreditMutation',
  'persistentCreditReservationCreation',
  'stripePaymentProcessing',
  'renderExecution',
  'mediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'productionUnlock',
  'packageLockMutation',
]

const forbiddenClaims = [
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|unlocked)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFmpeg execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFprobe execution:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bbrowser capture:\s*`?(true|enabled|completed)\b/i,
]

const blockedPrefixes = [
  'package-lock.json',
  'supabase/',
  'database/',
  'src/',
  'server/',
  'docker/',
  '.github/',
  '.dockerignore',
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

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/controlled-owner-browser-walkthrough-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_controlled_owner_browser_walkthrough') fail('decision mismatch')
if (record.execution !== 'completed_guarded_authenticated_browser_surface_walkthrough_no_runtime_mutation') fail('execution mismatch')
if (record.ownerAccount !== 'aiediting@reeditpro.com') fail('owner account mismatch')
if (record.ownerClassification !== 'real_reeditpro_owner_tester_account') fail('owner classification mismatch')
if (record.cloudRun?.service !== 'reeditpro-staging-api') fail('Cloud Run service mismatch')
if (record.cloudRun?.region !== 'us-central1') fail('Cloud Run region mismatch')
if (record.cloudRun?.latestReadyRevision !== 'reeditpro-staging-api-00006-6gw') fail('Cloud Run revision mismatch')
if (record.cloudRun?.invokerMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run invoker mismatch')
if (record.cloudRun?.allUsersGrant !== false) fail('allUsers grant must be false')
if (record.cloudRun?.allAuthenticatedUsersGrant !== false) fail('allAuthenticatedUsers grant must be false')
if (record.auth?.activeAccount !== 'aiediting@reeditpro.com') fail('active auth account mismatch')
if (record.auth?.identityTokenPrinted !== false) fail('identity token printed flag mismatch')
if (record.auth?.identityTokenPersisted !== false) fail('identity token persisted flag mismatch')
if (record.walkthrough?.unauthenticatedRoot !== 'blocked_403') fail('unauthenticated root mismatch')
for (const key of ['authenticatedRoot', 'authenticatedDashboard', 'authenticatedProjects', 'authenticatedEditor']) {
  if (record.walkthrough?.[key] !== 'passed_200_html') fail(`${key} mismatch`)
}
if (record.walkthrough?.browserVisibleShell !== true) fail('browser-visible shell must be true')
if (record.walkthrough?.rootElementPresent !== true) fail('root element must be present')
if (record.walkthrough?.moduleScriptPresent !== true) fail('module script must be present')
if (record.walkthrough?.assetFetches !== 'passed') fail('asset fetches mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_controlled_owner_go_no_go') fail('readiness mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad external beta must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_controlled_owner_browser_walkthrough_confirmation',
  'blocked_owner_auth_context_not_active',
  'blocked_unauthenticated_root_not_403',
  'blocked_authenticated_browser_route_failed',
  'blocked_browser_shell_asset_contract_missing',
  'blocked_browser_asset_fetch_failed',
  'print-identity-token',
  'identityTokenPrinted',
  'identityTokenPersisted',
]) {
  if (!runnerSource.includes(text)) fail(`runner missing required guard/source: ${text}`)
}
const forbiddenRunnerCommandPatterns = [
  ['memberships add', /\bmemberships\b[\s\S]{0,80}\badd\b/],
  ['add-iam-policy-binding', /\badd-iam-policy-binding\b/],
  ['remove-iam-policy-binding', /\bremove-iam-policy-binding\b/],
  ['run deploy', /\brun\b[\s\S]{0,80}\bdeploy\b/],
  ['secrets versions access', /\bsecrets\b[\s\S]{0,80}\bversions\b[\s\S]{0,80}\baccess\b/],
  ['psql executable', /execFileSync\(\s*['"]psql['"]|spawnSync\(\s*['"]psql['"]|\[\s*['"]psql['"]/],
  ['ffmpeg executable', /execFileSync\(\s*['"]ffmpeg['"]|spawnSync\(\s*['"]ffmpeg['"]|\[\s*['"]ffmpeg['"]/],
  ['ffprobe executable', /execFileSync\(\s*['"]ffprobe['"]|spawnSync\(\s*['"]ffprobe['"]|\[\s*['"]ffprobe['"]/],
  ['docker executable', /execFileSync\(\s*['"]docker['"]|spawnSync\(\s*['"]docker['"]|\[\s*['"]docker['"]/],
]
for (const [label, pattern] of forbiddenRunnerCommandPatterns) {
  if (pattern.test(runnerSource)) fail(`runner contains forbidden command/source: ${label}`)
}

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.sourceClosure?.controlledOwnerBrowserWalkthrough !== 'rp_external_beta_controlled_owner_browser_walkthrough_1') {
  fail('rollup missing controlled owner browser walkthrough source')
}
if (rollup.statuses?.externalProductBeta !== 'ready_for_controlled_owner_go_no_go') fail('rollup external beta status mismatch')
if (rollup.mainSupabaseTarget?.controlledOwnerBrowserWalkthrough !== 'completed_external_beta_controlled_owner_browser_walkthrough') {
  fail('rollup owner walkthrough status mismatch')
}
if (rollup.mainSupabaseTarget?.controlledOwnerBrowserWalkthroughRunId !== record.runEvidence?.runId) {
  fail('rollup owner walkthrough run id mismatch')
}
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-owner-browser-walkthrough-1'] !==
  'node scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-controlled-owner-browser-walkthrough-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_controlled_owner_browser_walkthrough')
console.log('External product beta readiness: ready_for_controlled_owner_go_no_go')
