#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-SAFE-GATE-BURNDOWN-1'
const packetDir = 'docs/external-beta/single-tester-safe-gate-burndown-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/gate-burndown.md`,
  `${packetDir}/blocker-reclassification.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-safe-gate-burndown-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-safe-gate-burndown-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-driven-fix-loop-1.md',
  'scripts/validation/rp-external-beta-single-tester-safe-gate-burndown-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/staging-flag-application-record.json',
  'docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json',
  'docs/external-beta/single-tester-live-feedback-triage-1r/single-tester-live-feedback-triage-1r-record.json',
]

const requiredText = [
  packet,
  'completed_single_tester_safe_gate_burndown_active_lane_ready_for_feedback_driven_iteration',
  'completed_docs_only_safe_gate_burndown_no_runtime_execution',
  'ee2feb240247cea0a996ca7fb005b7fbe6451c1a',
  '#1417',
  '#1428',
  '#1430',
  '#1434',
  '#1445',
  '#1450',
  '#1457',
  '#1461',
  '#577',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'go_single_tester_only',
  'active_single_tester_external_beta_for_aiediting_reeditpro_com',
  'ready_for_single_tester_feedback_driven_fix_loop',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-single-tester-live-feedback-triage-1r-diagnostics.mjs')
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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) if (!corpus.includes(text)) fail(`missing required text: ${text}`)

const record = JSON.parse(read(`${packetDir}/single-tester-safe-gate-burndown-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_single_tester_safe_gate_burndown_active_lane_ready_for_feedback_driven_iteration') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_safe_gate_burndown_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== 'ee2feb240247cea0a996ca7fb005b7fbe6451c1a') fail('integration base mismatch')
if (record.currentTester?.email !== 'aiediting@reeditpro.com') fail('tester email mismatch')
if (record.currentTester?.lane !== 'go_single_tester_only') fail('tester lane mismatch')
if (record.currentTester?.status !== 'active_single_tester_external_beta_for_aiediting_reeditpro_com') fail('tester status mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.historicalIsolatedProjectStatus !== 'historical_sandbox_evidence_only_not_active') fail('historical isolated project status mismatch')
if (record.sourceClosure?.singleTesterLiveFeedbackTriage1rPr !== 1461) fail('missing #1461 source')
if (record.sourceClosure?.singleTesterLiveFeedbackTriage1rMergeSha !== 'ee2feb240247cea0a996ca7fb005b7fbe6451c1a') fail('missing #1461 merge SHA')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')

for (const [key, value] of Object.entries(record.burnedDownForCurrentTester || {})) {
  if (!String(value).startsWith('closed_')) fail(`burn-down gate is not closed: ${key}`)
}
if (record.stillLocked?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester expansion lock mismatch')
for (const key of ['broadExternalBetaAudience', 'publicArtifacts', 'signedUrlSourceOfTruth', 'paidBilling', 'finalDeliveryExport', 'broadMedia', 'productionUnlock']) {
  if (record.stillLocked?.[key] !== 'blocked') fail(`locked gate mismatch: ${key}`)
}
if (record.readiness?.safeGateBurnDown !== 'completed') fail('safe-gate status mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.safety?.docsOnlyBurnDown !== true) fail('docsOnlyBurnDown must be true')
for (const key of falseSafetyKeys) if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const activeLane = JSON.parse(read('docs/external-beta/single-tester-active-lane-closure-1/single-tester-active-lane-closure-record.json'))
if (activeLane.activeLane?.status !== record.currentTester.status) fail('active lane source mismatch')
const flags = JSON.parse(read('docs/external-beta/staging-flag-application-1r-after-gcloud-reauth/staging-flag-application-record.json'))
if (flags.readiness?.externalBetaEnabledInThisPhase !== true) fail('staging flag source mismatch')
const triage = JSON.parse(read('docs/external-beta/single-tester-live-feedback-triage-1r/single-tester-live-feedback-triage-1r-record.json'))
if (triage.readiness?.safeGateBurnDown !== 'ready_for_single_tester_safe_gate_burndown') fail('triage source mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-single-tester-safe-gate-burndown-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-single-tester-safe-gate-burndown-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]
for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_single_tester_safe_gate_burndown_active_lane_ready_for_feedback_driven_iteration')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1')
