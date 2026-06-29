#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-CURRENT-READINESS-DIAGNOSTICS-COMPATIBILITY-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/external-beta/current-readiness-diagnostics-compatibility-1'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/compatibility-decision.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/current-readiness-diagnostics-compatibility-record.json`,
  'docs/activation-phase-rp-external-beta-current-readiness-diagnostics-compatibility-1-results.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'scripts/validation/rp-external-beta-controlled-owner-go-no-go-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-current-readiness-diagnostics-compatibility-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChanged = new Set(requiredFiles)
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
]
const requiredText = [
  packet,
  'completed_external_beta_current_readiness_diagnostics_compatibility_after_single_tester_expansion_blocker',
  'completed_docs_only_diagnostics_compatibility_no_runtime_execution',
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list',
  'aiediting@reeditpro.com',
  'external-beta-testers@reeditpro.com',
  'blocked_no_additional_named_tester_list',
  'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]
const forbiddenClaims = [
  /\bSupabase mutation:\s*`?(true|enabled|completed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed)\b/i,
  /\bservice-role route execution:\s*`?(true|enabled|completed)\b/i,
  /\bbrowser capture:\s*`?(true|enabled|completed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed)\b/i,
  /\bexternal beta broad audience unlock:\s*`?(true|enabled|completed)\b/i,
  /\bpaid production unlock:\s*`?(true|enabled|completed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed)\b/i,
  /\bprivate media processing:\s*`?(true|enabled|completed)\b/i,
  /\buser media processing:\s*`?(true|enabled|completed)\b/i,
  /\bRemotion execution:\s*`?(true|enabled|completed)\b/i,
  /\bFFmpeg\/FFprobe execution:\s*`?(true|enabled|completed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed)\b/i,
  /\bpackage installation:\s*`?(true|enabled|completed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed)\b/i,
  /\bIAM mutation:\s*`?(true|enabled|completed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed)\b/i,
  /"accessMutation"\s*:\s*true/i,
  /"runtimeExecution"\s*:\s*true/i,
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

const record = JSON.parse(read(`${packetDir}/current-readiness-diagnostics-compatibility-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_external_beta_current_readiness_diagnostics_compatibility_after_single_tester_expansion_blocker') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_diagnostics_compatibility_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '5bcfb3c302e7b4994286feac5be4dc6ef8550617') fail('integration base mismatch')
if (record.currentReadiness?.externalProductBeta !== 'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list') fail('readiness mismatch')
if (record.currentReadiness?.approvedTesterEmail !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.currentReadiness?.approvedGroup !== 'external-beta-testers@reeditpro.com') fail('group mismatch')
if (record.currentReadiness?.boundedTesterExpansionDecision !== 'blocked_no_additional_named_tester_list') fail('expansion decision mismatch')
if (record.currentReadiness?.nextMilestone !== 'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION') fail('next milestone mismatch')
if (record.currentReadiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.compatibility?.rollupMutation !== false) fail('rollup mutation must remain false')
if (record.compatibility?.accessMutation !== false) fail('access mutation must remain false')
if (record.compatibility?.runtimeExecution !== false) fail('runtime execution must remain false')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsOnly') {
    if (value !== true) fail('docsOnly must be true')
  } else if (value !== false) {
    fail(`safety flag must remain false: ${key}`)
  }
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const rollup = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (rollup.decision !== 'blocked_no_additional_named_tester_list') fail('rollup decision mismatch')
if (
  rollup.statuses?.externalProductBeta !==
  'controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list'
) {
  fail('rollup external beta readiness mismatch')
}
if (rollup.mainSupabaseTarget?.currentApprovedTesterEmail !== 'aiediting@reeditpro.com') fail('rollup current tester mismatch')
if (rollup.mainSupabaseTarget?.boundedTesterExpansionDecision !== 'blocked_no_additional_named_tester_list') fail('rollup bounded expansion decision mismatch')
if (rollup.mainSupabaseTarget?.nextMilestone !== 'OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION') fail('rollup next milestone mismatch')
if (rollup.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('rollup product-ready count changed')

const ownerDiagnostics = read('scripts/validation/rp-external-beta-controlled-owner-go-no-go-1-diagnostics.mjs')
if (!ownerDiagnostics.includes('controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list')) fail('owner go/no-go diagnostics missing current readiness compatibility')
if (!ownerDiagnostics.includes('OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION')) fail('owner go/no-go diagnostics missing current next milestone compatibility')

const enablementDiagnostics = read('scripts/validation/rp-external-beta-controlled-enablement-1-diagnostics.mjs')
if (!enablementDiagnostics.includes('rollupIsSingleTesterExpansionBlocked')) fail('controlled enablement diagnostics missing single-tester expansion compatibility')
if (!enablementDiagnostics.includes('controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list')) fail('controlled enablement diagnostics missing current readiness compatibility')
if (!enablementDiagnostics.includes('OWNER_ACTION_REQUIRED_ADDITIONAL_NAMED_TESTER_LIST_FOR_BOUNDED_EXPANSION')) fail('controlled enablement diagnostics missing current next milestone compatibility')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-beta-current-readiness-diagnostics-compatibility-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-current-readiness-diagnostics-compatibility-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChanged.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of blockedPrefixes) {
    if (file === blocked || file.startsWith(`${blocked}/`)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_external_beta_current_readiness_diagnostics_compatibility_after_single_tester_expansion_blocker')
console.log('External beta readiness: controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list')
