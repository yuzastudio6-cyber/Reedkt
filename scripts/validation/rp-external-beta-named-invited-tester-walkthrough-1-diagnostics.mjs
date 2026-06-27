#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/named-invited-tester-walkthrough-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/walkthrough-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/named-invited-tester-walkthrough-record.json`,
  'docs/activation-phase-rp-external-beta-named-invited-tester-walkthrough-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-bounded-tester-expansion-decision-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1.mjs',
  'scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-owner-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnBoundedTesterExpansionDecisionFiles = [
  'docs/external-beta/bounded-tester-expansion-decision-1/source-audit.md',
  'docs/external-beta/bounded-tester-expansion-decision-1/owner-decision.md',
  'docs/external-beta/bounded-tester-expansion-decision-1/readiness-gate.md',
  'docs/external-beta/bounded-tester-expansion-decision-1/safety-boundary.md',
  'docs/external-beta/bounded-tester-expansion-decision-1/validation-results.md',
  'docs/external-beta/bounded-tester-expansion-decision-1/bounded-tester-expansion-decision-record.json',
  'docs/activation-phase-rp-external-beta-bounded-tester-expansion-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-additional-named-tester-list-owner-input-1.md',
  'scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnBoundedTesterExpansionDecisionFiles,
])

const requiredText = [
  packet,
  'completed_named_invited_tester_walkthrough',
  'completed_guarded_authenticated_named_tester_walkthrough_no_runtime_mutation',
  'aiediting@reeditpro.com',
  'deec3bcc7741a1b214c687da44b455fd791c049b',
  '2026-06-27T18-18-53-455Z-ea8106e0',
  '66d46b5c1e0e6200f431f8ea2a2397d49874bac490928716853a86ee1598c2f6',
  '3a10d4df623785e961ec0c69e4b86bab9e361a16d32ac345b662af09dd859875',
  'ready_for_bounded_external_beta_tester_expansion_decision',
  'RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, IAM mutation, Cloud Run deployment, Google Group membership mutation, or broad service-role handler was enabled.',
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
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bGoogle Group membership mutation:\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/named-invited-tester-walkthrough-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_named_invited_tester_walkthrough') fail('decision mismatch')
if (record.execution !== 'completed_guarded_authenticated_named_tester_walkthrough_no_runtime_mutation') fail('execution mismatch')
if (record.integrationBase !== 'deec3bcc7741a1b214c687da44b455fd791c049b') fail('integration base mismatch')
if (record.namedTesterEmail !== 'aiediting@reeditpro.com') fail('named tester mismatch')
if (record.runEvidence?.runId !== '2026-06-27T18-18-53-455Z-ea8106e0') fail('run id mismatch')
if (record.cloudRun?.latestReadyRevision !== 'reeditpro-staging-api-00006-6gw') fail('Cloud Run revision mismatch')
if (record.cloudRun?.invokerMember !== 'group:external-beta-testers@reeditpro.com') fail('invoker boundary mismatch')
if (record.cloudRun?.allUsersGrant !== false) fail('allUsers grant must be false')
if (record.cloudRun?.allAuthenticatedUsersGrant !== false) fail('allAuthenticatedUsers grant must be false')
if (record.auth?.activeAccount !== 'aiediting@reeditpro.com') fail('active auth account mismatch')
if (record.auth?.identityTokenPrinted !== false) fail('identity token printed flag mismatch')
if (record.auth?.identityTokenPersisted !== false) fail('identity token persisted flag mismatch')
if (record.membership?.namedTesterPresent !== true) fail('named tester membership missing')
if (record.membership?.groupMembershipMutation !== false) fail('group membership mutation must be false')
if (record.browserWalkthrough?.unauthenticatedRoot !== 'blocked_403') fail('unauthenticated root mismatch')
for (const key of ['authenticatedRoot', 'authenticatedDashboard', 'authenticatedProjects', 'authenticatedEditor']) {
  if (record.browserWalkthrough?.[key] !== 'passed_200_html') fail(`${key} mismatch`)
}
if (record.browserWalkthrough?.assetFetches !== 'passed') fail('asset fetches mismatch')
if (record.apiReadback?.routesEndpointStatus !== 200) fail('routes endpoint status mismatch')
if (record.apiReadback?.runtimeStatusEndpointStatus !== 200) fail('runtime-status endpoint mismatch')
if (record.readiness?.externalProductBeta !== 'ready_for_bounded_external_beta_tester_expansion_decision') fail('readiness mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad external beta audience must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const runnerSource = read('scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1.mjs')
for (const text of [
  "process.env[confirmEnv] === 'true'",
  'blocked_pending_external_beta_named_invited_tester_walkthrough_confirmation',
  'blocked_named_invited_tester_auth_unavailable',
  'blocked_unauthenticated_root_not_403',
  'blocked_named_invited_tester_walkthrough_failed',
  'blocked_browser_shell_asset_contract_missing',
  'blocked_browser_asset_fetch_failed',
  'blocked_named_invited_tester_product_flow_readback_failed',
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
if (rollup.sourceClosure?.namedInvitedTesterWalkthrough !== 'rp_external_beta_named_invited_tester_walkthrough_1') {
  fail('rollup missing named invited tester walkthrough source')
}
if (
  ![
    'ready_for_bounded_external_beta_tester_expansion_decision',
    'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  ].includes(rollup.statuses?.externalProductBeta)
) {
  fail('rollup external beta status mismatch')
}
if (rollup.mainSupabaseTarget?.namedInvitedTesterWalkthrough !== 'completed_named_invited_tester_walkthrough') {
  fail('rollup named tester walkthrough mismatch')
}
if (rollup.mainSupabaseTarget?.namedInvitedTesterWalkthroughRunId !== record.runEvidence?.runId) {
  fail('rollup named tester run id mismatch')
}
if (
  ![
    'RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1',
    'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION',
  ].includes(rollup.mainSupabaseTarget?.nextMilestone)
) {
  fail('rollup next milestone mismatch')
}
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-named-invited-tester-walkthrough-1'] !==
  'node scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-named-invited-tester-walkthrough-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1-diagnostics.mjs'
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
console.log('Decision: completed_named_invited_tester_walkthrough')
console.log('External product beta readiness: ready_for_bounded_external_beta_tester_expansion_decision')
