#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1'
const packetDir = 'docs/external-beta/single-tester-live-feedback-triage-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/feedback-triage.md`,
  `${packetDir}/support-and-rollback.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-live-feedback-triage-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-live-feedback-triage-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-source-capture-1.md',
  'scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-additional-named-tester-list-decision-1-diagnostics.mjs',
  'package.json',
]

const followOnFeedbackSourceCapture1Files = [
  'docs/external-beta/single-tester-feedback-source-capture-1/source-audit.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/feedback-source.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/triage-routing.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/safety-boundary.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/readiness-gate.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/validation-results.md',
  'docs/external-beta/single-tester-feedback-source-capture-1/single-tester-feedback-source-capture-record.json',
  'docs/activation-phase-rp-external-beta-single-tester-feedback-source-capture-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-live-feedback-triage-1r.md',
  'scripts/validation/rp-external-beta-single-tester-feedback-source-capture-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1-diagnostics.mjs',
  'package.json',
]

const relatedSourceFiles = [
  'docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json',
  'docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json',
  'docs/external-beta/additional-named-tester-list-decision-1/additional-named-tester-list-decision-record.json',
]

const requiredText = [
  packet,
  'blocked_no_single_tester_feedback_source_present',
  'completed_docs_only_single_tester_live_feedback_triage_no_runtime_execution',
  '37150cd4f80048ebb6462b5eb838bd9c75b8798a',
  '#1434',
  '#1445',
  '#1450',
  '#577',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'go_single_tester_only',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'not_present_in_source',
  'blocked_no_additional_named_tester_list',
  'feedback_triage_only',
  'ready_for_single_tester_feedback_source_capture',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-SOURCE-CAPTURE-1',
  'Single-tester lane remains active: `true`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set([...requiredFiles, ...followOnFeedbackSourceCapture1Files])

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

const falseSafetyKeys = [
  'accessMutation',
  'additionalTesterAccessGrant',
  'groupMembershipMutation',
  'iamMutation',
  'cloudRunServiceUpdate',
  'deployment',
  'supabaseMutation',
  'sqlExecution',
  'secretPayloadAccess',
  'providerCall',
  'modelCall',
  'workerExecution',
  'workerDispatch',
  'routeExecution',
  'browserCapture',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'persistentCreditReservationCreation',
  'stripePaymentProcessing',
  'renderExecution',
  'mediaProcessing',
  'privateUserMediaProcessing',
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

const forbiddenClaims = [
  /\bfeedback source:\s*`?(?!not_present_in_source\b)(available|present|accepted|captured|passed|completed|true)\b/i,
  /\bFeedback source:\s*`?(?!not_present_in_source\b)(available|present|accepted|captured|passed|completed|true)\b/i,
  /\bSingle-tester live feedback triage:\s*`?(passed|completed|ready|accepted|true)\b/i,
  /\badditional tester access approved:\s*`?true`?/i,
  /\bbroad external beta audience:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bpaid production(?: unlock)?:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bproduction unlock:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bfinal delivery\/export:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bGoogle Group membership mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run service update:\s*`?(true|enabled|completed)\b/i,
  /\bdeployment:\s*`?(true|enabled|completed)\b/i,
  /\bFFmpeg\/FFprobe execution:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
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

const record = JSON.parse(read(`${packetDir}/single-tester-live-feedback-triage-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_no_single_tester_feedback_source_present') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_single_tester_live_feedback_triage_no_runtime_execution') {
  fail('execution mismatch')
}
if (record.integrationBase !== '37150cd4f80048ebb6462b5eb838bd9c75b8798a') fail('integration base mismatch')
if (record.sourceClosure?.controlledSingleTesterGoNoGoPr !== 1434) fail('missing #1434 source')
if (record.sourceClosure?.singleTesterActiveLaneClosurePr !== 1445) fail('missing #1445 source')
if (record.sourceClosure?.additionalNamedTesterListDecisionPr !== 1450) fail('missing #1450 source')
if (record.sourceClosure?.additionalNamedTesterListDecisionMergeSha !== '37150cd4f80048ebb6462b5eb838bd9c75b8798a') {
  fail('missing #1450 merge sha')
}
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentTester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.currentTester?.lane !== 'go_single_tester_only') fail('tester lane mismatch')
if (record.currentTester?.externalBetaReadiness !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') {
  fail('tester readiness mismatch')
}
if (record.feedbackTriage?.feedbackSource !== 'not_present_in_source') fail('feedback source mismatch')
if (record.feedbackTriage?.userVisibleIssueReports !== 'not_present_in_source') fail('issue report source mismatch')
if (record.feedbackTriage?.testerSupportNotes !== 'not_present_in_source') fail('support notes source mismatch')
if (record.feedbackTriage?.liveBugTriageRecords !== 'not_present_in_source') fail('bug triage source mismatch')
if (record.feedbackTriage?.productFeedbackCapture !== 'not_present_in_source') fail('product feedback source mismatch')
if (record.feedbackTriage?.blocker !== 'blocked_no_single_tester_feedback_source_present') fail('feedback blocker mismatch')
if (record.feedbackTriage?.blockingScope !== 'feedback_triage_only') fail('feedback blocking scope mismatch')
if (record.feedbackTriage?.singleTesterLaneRemainsActive !== true) fail('single tester lane must remain active')
if (record.readiness?.singleTesterLane !== 'go_single_tester_only') fail('readiness lane mismatch')
if (record.readiness?.singleTesterFeedbackTriage !== 'blocked_no_single_tester_feedback_source_present') {
  fail('feedback triage readiness mismatch')
}
if (record.readiness?.feedbackSourceCapture !== 'ready_for_single_tester_feedback_source_capture') {
  fail('feedback source capture readiness mismatch')
}
if (record.readiness?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') {
  fail('additional tester expansion mismatch')
}
if (record.readiness?.broadExternalBetaAudience !== 'blocked') fail('broad audience must remain blocked')
if (record.readiness?.paidProduction !== 'blocked') fail('paid production must remain blocked')
if (record.readiness?.finalDeliveryExport !== 'blocked') fail('final delivery/export must remain blocked')
if (record.readiness?.production !== 'blocked') fail('production must remain blocked')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-SOURCE-CAPTURE-1') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyTriage !== true) fail('docsOnlyTriage must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const goNoGo = JSON.parse(read('docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json'))
if (goNoGo.decision !== 'go_controlled_single_tester_external_beta_lane_remains_open') fail('go/no-go source mismatch')
if (goNoGo.goScope?.testerEmail !== record.currentTester.email) fail('go/no-go tester mismatch')

const activeLane = JSON.parse(read('docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json'))
if (activeLane.activeLane?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') {
  fail('active lane source mismatch')
}

const additionalTester = JSON.parse(
  read('docs/external-beta/additional-named-tester-list-decision-1/additional-named-tester-list-decision-record.json'),
)
if (additionalTester.additionalNamedTesterDecision?.approved !== false) fail('additional tester approval source mismatch')
if (additionalTester.additionalNamedTesterDecision?.additionalNamedTesterList !== 'not_present_in_source') {
  fail('additional named tester list source mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-live-feedback-triage-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) {
    fail(`secret-like assignment in ${file}`)
  }
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) {
      if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
    }
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_no_single_tester_feedback_source_present')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-SOURCE-CAPTURE-1')
