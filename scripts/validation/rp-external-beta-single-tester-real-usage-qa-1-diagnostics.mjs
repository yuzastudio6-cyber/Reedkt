#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1'
const packetDir = 'docs/external-beta/single-tester-real-usage-qa-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runner-contract.md`,
  `${packetDir}/real-usage-qa-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/single-tester-real-usage-qa-record.json`,
  'docs/activation-phase-rp-external-beta-single-tester-real-usage-qa-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-feedback-issue-fix-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-single-tester-real-usage-qa-1r-after-gcloud-reauth.md',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1.mjs',
  'scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-single-tester-active-lane-closure-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
  'blocked_gcloud_reauth_no_staging_route_readback',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'Reeditpro',
  'wmyyttnynmteqgcdishd',
  'reeditpro-staging-api',
  'blocked_no_additional_named_tester_list',
  'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedFiles = new Set(requiredFiles)
const blockedPrefixes = [
  'package-lock.json',
  'src/',
  'server/',
  'supabase/',
  'database/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
]
const forbiddenText = [
  /\bgroup membership mutation:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed)\b/i,
  /\bmedia processing:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed)\b/i,
  /"groupMembershipMutation"\s*:\s*true/i,
  /"cloudRunIamMutation"\s*:\s*true/i,
  /"deployment"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
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

for (const pattern of forbiddenText) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/single-tester-real-usage-qa-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') fail('decision mismatch')
if (record.execution !== 'blocked_gcloud_reauth_no_staging_route_readback') fail('execution mismatch')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.service !== 'reeditpro-staging-api') fail('service mismatch')
if (record.tester?.email !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.tester?.group !== 'external-beta-testers@reeditpro.com') fail('tester group mismatch')
if (record.tester?.activeAccount !== 'aiediting@reeditpro.com') fail('active account mismatch')
if (record.tester?.activeAccountMatches !== true) fail('active account match missing')
if (record.readback?.blocker !== 'blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa') fail('readback blocker mismatch')
if (record.readback?.unauthenticatedRootStatus !== null) fail('unauthenticated root should not have run')
if (!Array.isArray(record.readback?.authenticatedHtmlRoutes) || record.readback.authenticatedHtmlRoutes.length !== 0) fail('authenticated HTML routes should not have run')
if (!Array.isArray(record.readback?.authenticatedJsonRoutes) || record.readback.authenticatedJsonRoutes.length !== 0) fail('authenticated JSON routes should not have run')
if (record.readback?.requiredRoutesPresent !== false) fail('required routes should remain unverified')
if (record.readiness?.singleTesterRealUsageQa !== 'blocked') fail('readiness mismatch')
if (record.readiness?.additionalTesterExpansion !== 'blocked_no_additional_named_tester_list') fail('additional tester blocker mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'authenticatedStagingReadbackOnly') {
    if (value !== true) fail(`safety flag must be true: ${key}`)
  } else if (value !== false) {
    fail(`safety flag must remain false: ${key}`)
  }
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-single-tester-real-usage-qa-1'] !==
  'node scripts/validation/rp-external-beta-single-tester-real-usage-qa-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['rp-external-beta-single-tester-real-usage-qa-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-single-tester-real-usage-qa-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const prefix of blockedPrefixes) {
    if (file === prefix || file.startsWith(prefix)) fail(`blocked changed file: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa')
console.log('Next milestone: RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH')
