#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-LIVE-FEEDBACK-TRIAGE-1R'
const packetDir = 'docs/external-beta/single-tester-live-feedback-triage-1r'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/triage-decision.md`,
  `${packetDir}/safe-gate-burndown-routing.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-live-feedback-triage-1r-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-live-feedback-triage-1r-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-safe-gate-burndown-1.md',
  'scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1r-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-feedback-source-capture-1-diagnostics.mjs',
  'package.json',
]

const relatedSourceFiles = [
  'docs/external-beta/single-tester-feedback-source-capture-1/single-tester-feedback-source-capture-record.json',
  'docs/external-beta/single-tester-live-feedback-triage-1/single-tester-live-feedback-triage-record.json',
]

const requiredText = [
  packet,
  'completed_single_tester_live_feedback_triage_1r_ready_for_safe_gate_burndown',
  'completed_docs_only_single_tester_feedback_triage_no_runtime_execution',
  '38a55432140795b146eafd3a0af58c2390aab855',
  '#1434',
  '#1445',
  '#1450',
  '#1454',
  '#1457',
  '#577',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'go_single_tester_only',
  'current_thread_owner_tester_support_note_sanitized',
  'sanitized_owner_tester_support_note',
  'accepted_for_docs_status_decision_packets_when_repo_github_evidence_sufficient',
  'carry_forward_single_main_reeditpro_project_only',
  'manual_owner_observed_single_tester_support_active',
  'ready_for_single_tester_safe_gate_burndown',
  'blocked_no_additional_named_tester_list',
  'requires_explicit_confirmation_per_guarded_packet',
  'requires_explicit_guarded_validation_packet',
  'requires_approved_snapshot_credit_and_runtime_gates',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-SAFE-GATE-BURNDOWN-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
const followOnSafeGateBurnDownFiles = [
  'docs/external-beta/single-tester-safe-gate-burndown-1/source-audit.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/gate-burndown.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/blocker-reclassification.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/readiness-gate.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/safety-boundary.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/validation-results.md',
  'docs/external-beta/single-tester-safe-gate-burndown-1/single-tester-safe-gate-burndown-record.json',
  'docs/activation-phase-rp-external-beta-single-tester-safe-gate-burndown-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-driven-fix-loop-1.md',
  'scripts/validation/rp-external-beta-single-tester-safe-gate-burndown-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1r-diagnostics.mjs',
  'package.json',
]
for (const file of followOnSafeGateBurnDownFiles) allowedChangedFiles.add(file)

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

const record = JSON.parse(read(`${packetDir}/single-tester-live-feedback-triage-1r-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_live_feedback_triage_1r_ready_for_safe_gate_burndown') {
  fail('decision mismatch')
}
if (record.execution !== 'completed_docs_only_single_tester_feedback_triage_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '38a55432140795b146eafd3a0af58c2390aab855') fail('integration base mismatch')
if (record.sourceClosure?.singleTesterFeedbackSourceCapturePr !== 1457) fail('missing #1457 source')
if (record.sourceClosure?.singleTesterFeedbackSourceCaptureMergeSha !== '38a55432140795b146eafd3a0af58c2390aab855') {
  fail('missing #1457 merge sha')
}
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentTester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.currentTester?.lane !== 'go_single_tester_only') fail('tester lane mismatch')
if (record.feedbackSource?.source !== 'current_thread_owner_tester_support_note_sanitized') fail('feedback source mismatch')
if (record.feedbackSource?.sourceClass !== 'sanitized_owner_tester_support_note') fail('source class mismatch')
if (record.feedbackSource?.sourceStatus !== 'captured') fail('source status mismatch')
if (
  record.triageOutcomes?.sourceDerivedOwnerDecisionPolicy !==
  'accepted_for_docs_status_decision_packets_when_repo_github_evidence_sufficient'
) {
  fail('source-derived owner policy mismatch')
}
if (record.triageOutcomes?.mainReeditProSupabaseProjectConsistency !== 'carry_forward_single_main_reeditpro_project_only') {
  fail('main Supabase project consistency mismatch')
}
if (record.triageOutcomes?.currentSingleTesterSupportPosture !== 'manual_owner_observed_single_tester_support_active') {
  fail('support posture mismatch')
}
if (record.triageOutcomes?.safeGateBurnDownReadiness !== 'ready_for_single_tester_safe_gate_burndown') {
  fail('safe-gate burn-down readiness mismatch')
}
if (record.triageOutcomes?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') {
  fail('additional tester expansion mismatch')
}
if (record.triageOutcomes?.secretCredentialGates !== 'requires_explicit_confirmation_per_guarded_packet') {
  fail('secret gate routing mismatch')
}
if (record.triageOutcomes?.supabaseSqlMutation !== 'requires_explicit_guarded_validation_packet') {
  fail('Supabase/SQL routing mismatch')
}
if (record.triageOutcomes?.providersModelsWorkersMedia !== 'requires_approved_snapshot_credit_and_runtime_gates') {
  fail('provider/worker/media routing mismatch')
}
if (record.readiness?.safeGateBurnDown !== 'ready_for_single_tester_safe_gate_burndown') fail('readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-SAFE-GATE-BURNDOWN-1') {
  fail('next milestone mismatch')
}
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyTriage !== true) fail('docsOnlyTriage must be true')
for (const key of falseSafetyKeys) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const capture = JSON.parse(
  read('docs/external-beta/single-tester-feedback-source-capture-1/single-tester-feedback-source-capture-record.json'),
)
if (capture.decision !== 'completed_single_tester_feedback_source_capture_from_current_owner_tester_support_note') {
  fail('feedback source capture source mismatch')
}
if (capture.feedbackSource?.source !== record.feedbackSource.source) fail('feedback source carry-forward mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-live-feedback-triage-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1r-diagnostics.mjs'
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
console.log('Decision: completed_single_tester_live_feedback_triage_1r_ready_for_safe_gate_burndown')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-SAFE-GATE-BURNDOWN-1')
