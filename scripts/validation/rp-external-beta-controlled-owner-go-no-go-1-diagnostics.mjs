#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CONTROLLED-OWNER-GO-NO-GO-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/external-beta/controlled-owner-go-no-go-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/owner-decision.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/controlled-owner-go-no-go-record.json`,
  'docs/activation-phase-rp-external-beta-controlled-owner-go-no-go-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-named-invited-tester-walkthrough-1.md',
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'scripts/validation/rp-external-beta-controlled-owner-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-owner-browser-walkthrough-1-diagnostics.mjs',
  'package.json',
]

const followOnNamedInvitedTesterWalkthroughFiles = [
  'docs/external-beta/named-invited-tester-walkthrough-1/source-audit.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/runner-contract.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/walkthrough-evidence.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/readiness-gate.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/safety-boundary.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/validation-results.md',
  'docs/external-beta/named-invited-tester-walkthrough-1/named-invited-tester-walkthrough-record.json',
  'docs/activation-phase-rp-external-beta-named-invited-tester-walkthrough-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-bounded-tester-expansion-decision-1.md',
  'scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1.mjs',
  'scripts/validation/rp-external-beta-named-invited-tester-walkthrough-1-diagnostics.mjs',
]

const allowedFiles = new Set([
  ...requiredFiles,
  ...followOnNamedInvitedTesterWalkthroughFiles,
])

const requiredText = [
  packet,
  'approved_controlled_external_beta_owner_go_no_go_for_named_invited_tester_walkthrough',
  'completed_docs_only_controlled_owner_go_no_go_no_runtime_mutation',
  'aiediting@reeditpro.com',
  '3c56071c0274abeb513f302414d702c113cc6ab7',
  '2026-06-27T17-44-11-103Z-d5f1043a',
  '3b59add023f0e66fa29e028239563b8fe6b27c62efd2bbe7acc82bbbb6b52423',
  '53cca53c7a2198768836c0d4510993d2aaf98e9bba3304715f4a8ef94acc4896',
  'ready_for_named_invited_tester_identity_and_walkthrough',
  'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, IAM mutation, Cloud Run deployment, or broad service-role handler was enabled.',
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

const record = JSON.parse(read(`${packetDir}/controlled-owner-go-no-go-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'approved_controlled_external_beta_owner_go_no_go_for_named_invited_tester_walkthrough') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_controlled_owner_go_no_go_no_runtime_mutation') fail('execution mismatch')
if (record.integrationBase !== '3c56071c0274abeb513f302414d702c113cc6ab7') fail('integration base mismatch')
if (record.ownerAccount !== 'aiediting@reeditpro.com') fail('owner account mismatch')
if (record.acceptedOwnerWalkthrough?.runId !== '2026-06-27T17-44-11-103Z-d5f1043a') fail('accepted owner walkthrough run id mismatch')
if (record.acceptedOwnerWalkthrough?.unauthenticatedRoot !== 'blocked_403') fail('owner walkthrough unauthenticated root mismatch')
if (record.acceptedOwnerWalkthrough?.authenticatedRoot !== 'passed_200_html') fail('owner walkthrough root mismatch')
if (record.acceptedOwnerWalkthrough?.authenticatedDashboard !== 'passed_200_html') fail('owner walkthrough dashboard mismatch')
if (record.acceptedOwnerWalkthrough?.authenticatedProjects !== 'passed_200_html') fail('owner walkthrough projects mismatch')
if (record.acceptedOwnerWalkthrough?.authenticatedEditor !== 'passed_200_html') fail('owner walkthrough editor mismatch')
if (record.acceptedOwnerWalkthrough?.assetFetches !== 'passed') fail('owner walkthrough asset fetch mismatch')
if (record.approvedNextGate?.milestone !== 'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1') fail('next gate mismatch')
if (record.approvedNextGate?.requiresExactTesterIdentity !== true) fail('next gate must require exact tester identity')
if (record.approvedNextGate?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.approvedNextGate?.allUsersGrantApproved !== false) fail('allUsers approval must be false')
if (record.approvedNextGate?.allAuthenticatedUsersGrantApproved !== false) fail('allAuthenticatedUsers approval must be false')
if (record.readiness?.externalProductBeta !== 'ready_for_named_invited_tester_identity_and_walkthrough') fail('readiness mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.sourceClosure?.controlledOwnerGoNoGo !== 'rp_external_beta_controlled_owner_go_no_go_1') {
  fail('rollup missing controlled owner go/no-go source')
}
if (
  ![
    'ready_for_named_invited_tester_identity_and_walkthrough',
    'ready_for_bounded_external_beta_tester_expansion_decision',
  ].includes(rollup.statuses?.externalProductBeta)
) {
  fail('rollup external beta readiness mismatch')
}
if (rollup.mainSupabaseTarget?.controlledOwnerGoNoGo !== 'approved_controlled_external_beta_owner_go_no_go_for_named_invited_tester_walkthrough') {
  fail('rollup controlled owner go/no-go status mismatch')
}
if (
  ![
    'RP-EXTERNAL-BETA-NAMED-INVITED-TESTER-WALKTHROUGH-1',
    'RP-EXTERNAL-BETA-BOUNDED-TESTER-EXPANSION-DECISION-1',
  ].includes(rollup.mainSupabaseTarget?.nextMilestone)
) {
  fail('rollup next milestone mismatch')
}
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-controlled-owner-go-no-go-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-controlled-owner-go-no-go-1-diagnostics.mjs'
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
console.log('Decision: approved_controlled_external_beta_owner_go_no_go_for_named_invited_tester_walkthrough')
console.log(`External product beta readiness: ${rollup.statuses?.externalProductBeta}`)
