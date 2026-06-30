#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-ACTIVE-LANE-CLOSURE-1'
const packetDir = 'docs/external-beta/single-tester-active-lane-closure-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/lane-decision.md`,
  `${packetDir}/expansion-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-active-lane-closure-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-active-lane-closure-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/external-beta/bounded-tester-expansion-decision-1/owner-decision.md',
  'docs/activation-phase-rp-external-beta-bounded-tester-expansion-decision-1-results.md',
  'docs/activation-phase-rp-external-beta-named-tester-expansion-readiness-1-results.md',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnAdditionalNamedTesterListDecision1Files = [
  'docs/external-beta/additional-named-tester-list-decision-1/source-audit.md',
  'docs/external-beta/additional-named-tester-list-decision-1/decision.md',
  'docs/external-beta/additional-named-tester-list-decision-1/access-boundary.md',
  'docs/external-beta/additional-named-tester-list-decision-1/readiness-gate.md',
  'docs/external-beta/additional-named-tester-list-decision-1/safety-boundary.md',
  'docs/external-beta/additional-named-tester-list-decision-1/validation-results.md',
  'docs/external-beta/additional-named-tester-list-decision-1/additional-named-tester-list-decision-record.json',
  'docs/activation-phase-rp-external-beta-additional-named-tester-list-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-live-feedback-triage-1.md',
  'scripts/validation/rp-external-beta-additional-named-tester-list-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSingleTesterRealUsageQa1Files = [
  'docs/external-beta/single-tester-real-usage-qa-1/source-audit.md',
  'docs/external-beta/single-tester-real-usage-qa-1/runner-contract.md',
  'docs/external-beta/single-tester-real-usage-qa-1/real-usage-qa-evidence.md',
  'docs/external-beta/single-tester-real-usage-qa-1/readiness-gate.md',
  'docs/external-beta/single-tester-real-usage-qa-1/safety-boundary.md',
  'docs/external-beta/single-tester-real-usage-qa-1/validation-results.md',
  'docs/external-beta/single-tester-real-usage-qa-1/single-tester-real-usage-qa-record.json',
  'docs/activation-phase-rp-external-beta-single-tester-real-usage-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-operator-gcloud-auth-preflight-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...followOnAdditionalNamedTesterListDecision1Files,
  ...followOnSingleTesterRealUsageQa1Files,
])

const requiredText = [
  packet,
  'completed_single_tester_external_beta_active_lane_closure_keep_expansion_blocked',
  'completed_docs_only_single_tester_active_lane_closure_no_access_mutation',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'ready_for_single_tester_real_usage_qa',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'blocked_no_additional_named_tester_list',
  'additional_tester_expansion_only',
  'Additional tester list: `not_present_in_source`',
  'Bounded tester expansion approved: `false`',
  '#577',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPathPrefixes = [
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
  'dist/',
  'dist-server/',
  'node_modules/',
]

const forbiddenPatterns = [
  /\ballUsers\b[^\n]*(true|granted|enabled|approved)\b/i,
  /\ballAuthenticatedUsers\b[^\n]*(true|granted|enabled|approved)\b/i,
  /\bdomain-wide\b[^\n]*(true|granted|enabled|approved)\b/i,
  /\badditional tester expansion approved:\s*`?true`?/i,
  /\bbroad external beta audience:\s*`?(enabled|approved|unlocked|true)\b/i,
  /\bpaid production:\s*`?(enabled|approved|unlocked|true)\b/i,
  /\bproduction unlock:\s*`?(enabled|approved|unlocked|true)\b/i,
  /\bfinal delivery\/export:\s*`?(enabled|approved|unlocked|true)\b/i,
  /\bpublic artifacts:\s*`?(enabled|approved|created|true)\b/i,
  /\bsigned URL source-of-truth:\s*`?(enabled|approved|true)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed)\b/i,
  /\bservice-role route execution:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bGoogle Group membership mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run service update:\s*`?(true|enabled|completed)\b/i,
  /\bFFmpeg execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFprobe execution:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bRemotion execution:\s*`?(true|enabled|completed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bpostgres(?:ql)?:\/\/\S+/i,
  /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  /sbp_[A-Za-z0-9_.\/=+-]+/,
]

const falseSafetyKeys = [
  'supabaseMutation',
  'sqlExecution',
  'secretManagerPayloadAccess',
  'iamMutation',
  'googleGroupMembershipMutation',
  'cloudRunDeployment',
  'cloudRunServiceUpdate',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'mediaProcessing',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'dockerExecution',
  'internalBetaBroadUnlock',
  'externalBetaBroadAudienceUnlock',
  'paidProductionUnlock',
  'productionUnlock',
  'finalDeliveryExportUnlock',
  'packageLockMutation',
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

const sourceSafetyCorpus = requiredFiles
  .filter(
    (file) =>
      !file.startsWith('scripts/validation/') &&
      (file.startsWith(packetDir) ||
        file === 'docs/activation-phase-rp-external-beta-single-tester-active-lane-closure-1-results.md' ||
        file === 'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1.md'),
  )
  .map((file) => read(file))
  .join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(sourceSafetyCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/single-tester-active-lane-closure-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_external_beta_active_lane_closure_keep_expansion_blocked') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_single_tester_active_lane_closure_no_access_mutation') {
  fail('execution mismatch')
}
if (record.integrationBase !== '4712ff450b0e95deea7a63aa4d161c00d5ec8a44') fail('integration base mismatch')
if (record.activeLane?.approvedTesterEmail !== 'aiediting@reeditpro.com') fail('approved tester mismatch')
if (record.activeLane?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.activeLane?.approvedGroup !== 'external-beta-testers@reeditpro.com') fail('group mismatch')
if (record.activeLane?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') {
  fail('active lane status mismatch')
}
if (record.activeLane?.readiness !== 'ready_for_single_tester_real_usage_qa') fail('active lane readiness mismatch')
if (record.expansion?.additionalNamedTesterList !== 'not_present_in_source') fail('additional tester list mismatch')
if (record.expansion?.approved !== false) fail('expansion must not be approved')
if (record.expansion?.blocker !== 'blocked_no_additional_named_tester_list') fail('expansion blocker mismatch')
if (record.expansion?.blockingScope !== 'additional_tester_expansion_only') fail('expansion scope mismatch')
if (record.readiness?.externalProductBeta !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') {
  fail('external product beta readiness mismatch')
}
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.safety?.docsOnlyClosure !== true) fail('docsOnlyClosure must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-active-lane-closure-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const prefix of forbiddenPathPrefixes) {
    if (file === prefix || file.startsWith(prefix)) fail(`forbidden changed file: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) fail(`forbidden content in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_single_tester_external_beta_active_lane_closure_keep_expansion_blocked')
console.log('Readiness: ready_for_single_tester_real_usage_qa')
