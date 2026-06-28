#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-ADDITIONAL-NAMED-TESTER-LIST-DECISION-1'
const packetDir = 'docs/external-beta/additional-named-tester-list-decision-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/decision.md`,
  `${packetDir}/access-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/additional-named-tester-list-decision-record.json`,
  'docs/activation-phase-rp-external-beta-additional-named-tester-list-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-live-feedback-triage-1.md',
  'scripts/validation/rp-external-beta-additional-named-tester-list-decision-1-diagnostics.mjs',
  'package.json',
]

const relatedSourceFiles = [
  'docs/external-beta/single-tester-real-product-walkthrough-qa-1/single-tester-real-product-walkthrough-qa-record.json',
  'docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json',
  'docs/external-beta/named-tester-expansion-readiness-1/named-tester-expansion-readiness-record.json',
  'docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json',
]

const followOnAllowlist = [
  'scripts/validation/rp-external-beta-controlled-single-tester-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-named-tester-expansion-readiness-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
]

const requiredText = [
  packet,
  'completed_source_derived_keep_single_tester_only_no_additional_tester_access',
  'completed_docs_only_additional_named_tester_list_decision_no_access_mutation',
  'f8afb9b4d015104a675e6622deebfefaee4929ee',
  '#1430',
  '#1434',
  '#1438',
  '#1445',
  '#577',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'go_single_tester_only',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'not_present_in_source',
  'Additional tester access approved: `false`',
  'blocked_no_additional_named_tester_list',
  'keep_single_tester_only_until_exact_additional_named_tester_list_exists',
  'ready_for_single_tester_live_feedback_triage',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const falseSafetyKeys = [
  'groupMembershipMutation',
  'cloudRunIamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'broadPublicInvokerGrant',
  'additionalTesterAccessGrant',
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
  /\bAdditional tester access approved:\s*`?true`?/i,
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

for (const file of [...requiredFiles, ...relatedSourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const record = JSON.parse(read(`${packetDir}/additional-named-tester-list-decision-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_source_derived_keep_single_tester_only_no_additional_tester_access') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_additional_named_tester_list_decision_no_access_mutation') fail('execution mismatch')
if (record.integrationBase !== 'f8afb9b4d015104a675e6622deebfefaee4929ee') fail('integration base mismatch')
if (record.sourceClosure?.singleTesterActiveLaneClosurePr !== 1445) fail('missing #1445 source')
if (record.sourceClosure?.controlledSingleTesterGoNoGoPr !== 1434) fail('missing #1434 source')
if (record.sourceClosure?.namedTesterExpansionReadinessPr !== 1438) fail('missing #1438 source')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.currentTester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.currentTester?.status !== 'go_single_tester_only') fail('single tester status mismatch')
if (record.currentTester?.externalBetaReadiness !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') {
  fail('single tester readiness mismatch')
}
if (record.additionalNamedTesterDecision?.additionalNamedTesterList !== 'not_present_in_source') fail('additional tester list mismatch')
if (record.additionalNamedTesterDecision?.approved !== false) fail('additional tester access must not be approved')
if (record.additionalNamedTesterDecision?.blocker !== 'blocked_no_additional_named_tester_list') fail('expansion blocker mismatch')
if (record.readiness?.singleTesterLane !== 'go_single_tester_only') fail('single tester lane mismatch')
if (record.readiness?.singleTesterFeedbackTriage !== 'ready_for_single_tester_live_feedback_triage') fail('feedback triage mismatch')
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.production !== 'blocked') fail('production must remain blocked')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyDecision !== true) fail('docsOnlyDecision must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const goNoGo = JSON.parse(read('docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json'))
if (goNoGo.decision !== 'go_controlled_single_tester_external_beta_lane_remains_open') fail('go/no-go source mismatch')
if (goNoGo.goScope?.testerEmail !== record.currentTester.email) fail('go/no-go tester mismatch')

const namedExpansion = JSON.parse(read('docs/external-beta/named-tester-expansion-readiness-1/named-tester-expansion-readiness-record.json'))
if (namedExpansion.namedTesterExpansion?.additionalNamedTesterList !== 'not_present_in_source') {
  fail('named expansion source tester list mismatch')
}
if (namedExpansion.namedTesterExpansion?.approved !== false) fail('named expansion source approval mismatch')

const activeLane = JSON.parse(read('docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json'))
if (activeLane.decision !== 'completed_single_tester_external_beta_active_lane_closure_keep_expansion_blocked') {
  fail('active lane closure source mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-additional-named-tester-list-decision-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-additional-named-tester-list-decision-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowedFiles = new Set([...requiredFiles, ...followOnAllowlist])
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
console.log('Decision: completed_source_derived_keep_single_tester_only_no_additional_tester_access')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1')
