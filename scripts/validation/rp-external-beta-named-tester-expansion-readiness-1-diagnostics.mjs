#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-NAMED-TESTER-EXPANSION-READINESS-1'
const packetDir = 'docs/external-beta/named-tester-expansion-readiness-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-chain-reconciliation.md`,
  `${packetDir}/readiness-decision.md`,
  `${packetDir}/expansion-boundary.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/named-tester-expansion-readiness-record.json`,
  'docs/activation-phase-rp-external-beta-named-tester-expansion-readiness-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-named-tester-expansion-readiness-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-additional-named-tester-list-decision-1.md',
  'scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-bounded-tester-expansion-decision-1-diagnostics.mjs',
  'package.json',
]

const allowedFiles = new Set(requiredFiles)

const requiredText = [
  packet,
  'blocked_no_additional_named_tester_list_after_single_tester_go_no_go_reconciliation',
  'completed_docs_only_named_tester_expansion_readiness_reconciliation_no_access_mutation',
  '3a2f193893a5d6fd672cb428eda8fe667aadfd31',
  '6aba828d3fdbf6e8dd81cda29a14c42932fb0b20',
  'e45dd929ef9de8b1451b0935217ad5386356c8cd',
  '8ee164c9383c290f1272d43e64d2d0c7fda8d45c',
  'a11a58686db53de1776053182825173b6129bb84',
  '#1274',
  '#1278',
  '#1428',
  '#1430',
  '#1434',
  '#577',
  'aiediting@reeditpro.com',
  'go_single_tester_only',
  'qa_passed_single_tester_qwen_product_flow_runtime_evidence',
  'not_present_in_source',
  'Named tester expansion approved: `false`',
  'blocked_no_additional_named_tester_list',
  'additional_named_tester_expansion_not_approved_without_exact_named_identity_list',
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  'RP-EXTERNAL-BETA-ADDITIONAL-NAMED-TESTER-LIST-DECISION-1',
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
  'paidProductionUnlock',
  'productionUnlock',
  'packageLockMutation',
  'iamMutation',
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
  'dist/',
  'dist-server/',
  'node_modules/',
]

const forbiddenClaims = [
  /\bNamed tester expansion approved:\s*`?true`?/i,
  /\badditionalNamedTesterList"?\s*:\s*(?!\s*"not_present_in_source")/i,
  /\bapproved"?\s*:\s*true/i,
  /\bbroad external beta audience:\s*`?(enabled|approved|true|unlocked)/i,
  /\bexternalBetaBroadAudienceUnlock"?\s*:\s*true/i,
  /\bpaid production(?: unlock)?:\s*`?(enabled|approved|true|unlocked)/i,
  /\bproduction unlock:\s*`?(enabled|approved|true|unlocked)/i,
  /\bfinal delivery\/export:\s*`?(enabled|approved|true|unlocked)/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)/i,
  /\bprovider call:\s*`?(true|enabled|completed)/i,
  /\bmodel call:\s*`?(true|enabled|completed)/i,
  /\bworker execution:\s*`?(true|enabled|completed)/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)/i,
  /\bSQL execution:\s*`?(true|enabled|completed)/i,
  /\bFFmpeg\/FFprobe execution:\s*`?(true|enabled|completed)/i,
  /\bDocker execution:\s*`?(true|enabled|completed)/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)/i,
  /\bGoogle Group membership mutation:\s*`?(true|enabled|completed)/i,
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

const record = JSON.parse(read(`${packetDir}/named-tester-expansion-readiness-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_no_additional_named_tester_list_after_single_tester_go_no_go_reconciliation') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_named_tester_expansion_readiness_reconciliation_no_access_mutation') fail('execution mismatch')
if (record.integrationBase !== '3a2f193893a5d6fd672cb428eda8fe667aadfd31') fail('integration base mismatch')
if (record.sourceClosure?.controlledSingleTesterGoNoGoPr !== 1434) fail('missing #1434 source')
if (record.sourceClosure?.boundedTesterExpansionDecisionPr !== 1278) fail('missing #1278 source')
if (record.sourceClosure?.namedInvitedTesterWalkthroughPr !== 1274) fail('missing #1274 source')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.currentTester?.status !== 'go_single_tester_only') fail('single tester status mismatch')
if (record.currentTester?.walkthroughStatus !== 'completed_named_invited_tester_walkthrough') fail('walkthrough status mismatch')
if (record.namedTesterExpansion?.additionalNamedTesterList !== 'not_present_in_source') fail('additional tester list mismatch')
if (record.namedTesterExpansion?.approved !== false) fail('expansion must not be approved')
if (record.namedTesterExpansion?.blocker !== 'blocked_no_additional_named_tester_list') fail('expansion blocker mismatch')
if (record.readiness?.singleTesterLane !== 'go_single_tester_only') fail('single tester lane mismatch')
if (record.readiness?.externalProductBeta !== 'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list') fail('external product beta readiness mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-ADDITIONAL-NAMED-TESTER-LIST-DECISION-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyReconciliation !== true) fail('docsOnlyReconciliation must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const goNoGo = JSON.parse(read('docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json'))
if (goNoGo.decision !== 'go_controlled_single_tester_external_beta_lane_remains_open') fail('go/no-go source mismatch')
if (goNoGo.goScope?.testerEmail !== record.currentTester.email) fail('go/no-go tester mismatch')

const bounded = JSON.parse(read('docs/external-beta/bounded-tester-expansion-decision-1/bounded-tester-expansion-decision-record.json'))
if (bounded.decision !== 'blocked_no_additional_named_tester_list') fail('bounded expansion source mismatch')
if (bounded.boundedExpansion?.additionalNamedTesterList !== 'not_present_in_source') fail('bounded expansion tester list mismatch')
if (bounded.boundedExpansion?.approved !== false) fail('bounded expansion approval mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-named-tester-expansion-readiness-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
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
console.log('Decision: blocked_no_additional_named_tester_list_after_single_tester_go_no_go_reconciliation')
console.log('External product beta readiness: controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list')
