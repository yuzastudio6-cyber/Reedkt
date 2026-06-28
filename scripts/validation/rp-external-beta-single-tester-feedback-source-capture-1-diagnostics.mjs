#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-SOURCE-CAPTURE-1'
const packetDir = 'docs/external-beta/single-tester-feedback-source-capture-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/feedback-source.md`,
  `${packetDir}/triage-routing.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-feedback-source-capture-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-feedback-source-capture-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-live-feedback-triage-1r.md',
  'scripts/validation/rp-external-beta-single-tester-feedback-source-capture-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1-diagnostics.mjs',
  'package.json',
]

const relatedSourceFiles = [
  'docs/external-beta/single-tester-live-feedback-triage-1/single-tester-live-feedback-triage-record.json',
  'docs/external-beta/additional-named-tester-list-decision-1/additional-named-tester-list-decision-record.json',
  'docs/external-beta/controlled-single-tester-go-no-go-1/controlled-single-tester-go-no-go-record.json',
]

const requiredText = [
  packet,
  'completed_single_tester_feedback_source_capture_from_current_owner_tester_support_note',
  'completed_docs_only_feedback_source_capture_no_runtime_execution',
  'af655a8f88226fcbafbcefeb5abd9169289284b4',
  '#1434',
  '#1445',
  '#1450',
  '#1454',
  '#577',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'go_single_tester_only',
  'current_thread_owner_tester_support_note_sanitized',
  'sanitized_owner_tester_support_note',
  'external_beta_product_readiness_direction',
  'prefer_external_beta_readiness_over_internal_beta_only_target',
  'use_single_main_reeditpro_supabase_project_for_future_guarded_validation_planning',
  'use_source_derived_repo_github_evidence_when_sufficient',
  'keep_aiediting_reeditpro_com_as_current_single_tester',
  'keep_real_gates_for_credentials_supabase_sql_workers_providers_media_artifacts_billing_export_and_production',
  'blocked_no_additional_named_tester_list',
  'ready_for_live_feedback_triage_1r',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1R',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)

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
  /\bSource contains secrets:\s*`?true`?/i,
  /\bSource contains private media:\s*`?true`?/i,
  /\bSource contains signed URLs:\s*`?true`?/i,
  /\bSource creates public artifacts:\s*`?true`?/i,
  /\bSource grants additional tester access:\s*`?true`?/i,
  /\bSource unlocks broad external beta:\s*`?true`?/i,
  /\bSource unlocks production:\s*`?true`?/i,
  /\badditional tester access approved:\s*`?true`?/i,
  /\bbroad external beta audience:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bpaid production(?: unlock)?:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bproduction unlock:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\bfinal delivery\/export:\s*`?(enabled|approved|true|unlocked)\b/i,
  /\b(public artifact creation|signed URL creation|provider call|model call|worker execution|worker dispatch|Supabase mutation|SQL execution|Secret Manager payload access|IAM mutation|Google Group membership mutation|Cloud Run service update|deployment|FFmpeg\/FFprobe execution|Docker execution):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/single-tester-feedback-source-capture-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_feedback_source_capture_from_current_owner_tester_support_note') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_feedback_source_capture_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'af655a8f88226fcbafbcefeb5abd9169289284b4') fail('integration base mismatch')
if (record.sourceClosure?.controlledSingleTesterGoNoGoPr !== 1434) fail('missing #1434 source')
if (record.sourceClosure?.singleTesterActiveLaneClosurePr !== 1445) fail('missing #1445 source')
if (record.sourceClosure?.additionalNamedTesterListDecisionPr !== 1450) fail('missing #1450 source')
if (record.sourceClosure?.singleTesterLiveFeedbackTriagePr !== 1454) fail('missing #1454 source')
if (record.sourceClosure?.singleTesterLiveFeedbackTriageMergeSha !== 'af655a8f88226fcbafbcefeb5abd9169289284b4') {
  fail('missing #1454 merge sha')
}
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentTester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.currentTester?.lane !== 'go_single_tester_only') fail('tester lane mismatch')
if (record.feedbackSource?.source !== 'current_thread_owner_tester_support_note_sanitized') fail('feedback source mismatch')
if (record.feedbackSource?.sourceClass !== 'sanitized_owner_tester_support_note') fail('source class mismatch')
if (record.feedbackSource?.sourceStatus !== 'captured') fail('source status mismatch')
if (record.feedbackSource?.sourceScope !== 'external_beta_product_readiness_direction') fail('source scope mismatch')
for (const key of [
  'containsSecrets',
  'containsPrivateMedia',
  'containsSignedUrls',
  'createsPublicArtifacts',
  'grantsAdditionalTesterAccess',
  'unlocksBroadExternalBeta',
  'unlocksProduction',
]) {
  if (record.feedbackSource?.[key] !== false) fail(`feedback source flag must be false: ${key}`)
}
if (record.capturedFeedback?.externalBetaDirection !== 'prefer_external_beta_readiness_over_internal_beta_only_target') {
  fail('external beta direction mismatch')
}
if (
  record.capturedFeedback?.supabaseProjectDirection !==
  'use_single_main_reeditpro_supabase_project_for_future_guarded_validation_planning'
) {
  fail('Supabase project direction mismatch')
}
if (record.capturedFeedback?.ownerDecisionDirection !== 'use_source_derived_repo_github_evidence_when_sufficient') {
  fail('owner decision direction mismatch')
}
if (record.capturedFeedback?.currentTesterDirection !== 'keep_aiediting_reeditpro_com_as_current_single_tester') {
  fail('current tester direction mismatch')
}
if (
  record.capturedFeedback?.safeGateDirection !==
  'keep_real_gates_for_credentials_supabase_sql_workers_providers_media_artifacts_billing_export_and_production'
) {
  fail('safe gate direction mismatch')
}
if (record.capturedFeedback?.testerExpansionDirection !== 'blocked_no_additional_named_tester_list') {
  fail('tester expansion direction mismatch')
}
if (record.readiness?.feedbackSourceCapture !== 'completed') fail('feedback source capture readiness mismatch')
if (record.readiness?.singleTesterLiveFeedbackTriage1r !== 'ready_for_live_feedback_triage_1r') {
  fail('triage 1R readiness mismatch')
}
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1R') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyCapture !== true) fail('docsOnlyCapture must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const triage = JSON.parse(read('docs/external-beta/single-tester-live-feedback-triage-1/single-tester-live-feedback-triage-record.json'))
if (triage.decision !== 'blocked_no_single_tester_feedback_source_present') fail('prior triage source mismatch')
if (triage.readiness?.feedbackSourceCapture !== 'ready_for_single_tester_feedback_source_capture') {
  fail('prior triage feedback-source readiness mismatch')
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-feedback-source-capture-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-feedback-source-capture-1-diagnostics.mjs'
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
console.log('Decision: completed_single_tester_feedback_source_capture_from_current_owner_tester_support_note')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1R')
