#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/bounded-tester-expansion-decision-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/owner-decision.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/bounded-tester-expansion-decision-record.json`,
  'docs/activation-phase-rp-external-beta-bounded-tester-expansion-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-additional-named-tester-list-owner-input-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnFiles = [
  'docs/external-beta/named-tester-expansion-readiness-1/source-chain-reconciliation.md',
  'docs/external-beta/named-tester-expansion-readiness-1/readiness-decision.md',
  'docs/external-beta/named-tester-expansion-readiness-1/expansion-boundary.md',
  'docs/external-beta/named-tester-expansion-readiness-1/safety-boundary.md',
  'docs/external-beta/named-tester-expansion-readiness-1/validation-results.md',
  'docs/external-beta/named-tester-expansion-readiness-1/named-tester-expansion-readiness-record.json',
  'docs/activation-phase-rp-external-beta-named-tester-expansion-readiness-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-named-tester-expansion-readiness-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-additional-named-tester-list-decision-1.md',
  'scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs',
]

const allowedFiles = new Set([...requiredFiles, ...followOnFiles])

const requiredText = [
  packet,
  'blocked_no_additional_named_tester_list',
  'completed_docs_only_bounded_tester_expansion_decision_no_access_mutation',
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  'aiediting@reeditpro.com',
  'Additional tester list: `not_present_in_source`',
  'Bounded tester expansion approved: `false`',
  'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION',
  'external-beta-testers@reeditpro.com',
  'group:external-beta-testers@reeditpro.com',
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
  'iamMutation',
]

const forbiddenClaims = [
  /\ballUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\ballAuthenticatedUsers\b[\s\S]{0,80}\b(true|granted|enabled)\b/i,
  /\bdomain-wide\b[\s\S]{0,80}\b(true|granted|enabled|approved)\b/i,
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

const record = JSON.parse(read(`${packetDir}/bounded-tester-expansion-decision-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_no_additional_named_tester_list') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_bounded_tester_expansion_decision_no_access_mutation') fail('execution mismatch')
if (record.integrationBase !== '6aba828d3fdbf6e8dd81cda29a14c42932fb0b20') fail('integration base mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('current tester mismatch')
if (record.currentTester?.status !== 'completed_named_invited_tester_walkthrough') fail('current tester status mismatch')
if (record.boundedExpansion?.additionalNamedTesterList !== 'not_present_in_source') fail('additional tester list mismatch')
if (record.boundedExpansion?.approved !== false) fail('bounded expansion must not be approved')
if (record.boundedExpansion?.blocker !== 'blocked_no_additional_named_tester_list') fail('bounded expansion blocker mismatch')
if (record.cloudRun?.invokerMember !== 'group:external-beta-testers@reeditpro.com') fail('Cloud Run invoker mismatch')
if (record.cloudRun?.allUsersGrantApproved !== false) fail('allUsers grant approval must be false')
if (record.cloudRun?.allAuthenticatedUsersGrantApproved !== false) fail('allAuthenticatedUsers grant approval must be false')
if (record.cloudRun?.domainWideAccessApproved !== false) fail('domain-wide approval must be false')
if (record.readiness?.externalProductBeta !== 'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list') fail('readiness mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.readiness?.nextMilestone !== 'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION') fail('next milestone mismatch')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.sourceClosure?.boundedTesterExpansionDecision !== 'rp_external_beta_bounded_tester_expansion_decision_1') {
  fail('rollup missing bounded tester expansion decision source')
}
if (rollup.statuses?.externalProductBeta !== record.readiness?.externalProductBeta) fail('rollup readiness mismatch')
if (rollup.mainSupabaseTarget?.boundedTesterExpansionDecision !== record.decision) fail('rollup bounded expansion decision mismatch')
if (rollup.mainSupabaseTarget?.additionalNamedTesterList !== 'not_present_in_source') fail('rollup additional tester list mismatch')
if (rollup.mainSupabaseTarget?.boundedTesterExpansionApproved !== false) fail('rollup expansion approval mismatch')
if (rollup.mainSupabaseTarget?.nextMilestone !== record.readiness?.nextMilestone) fail('rollup next milestone mismatch')
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-bounded-tester-expansion-decision-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
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
console.log('Decision: blocked_no_additional_named_tester_list')
console.log('External product beta readiness: controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list')
