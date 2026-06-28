#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1'
const packetDir = 'docs/external-beta/qwen-runtime-stack-fresh-source-import-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/import-guard.md`,
  `${packetDir}/split-import-plan.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-runtime-stack-fresh-source-import-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-stack-fresh-source-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-baseline-split-import-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/single-tester-feedback-driven-fix-loop-1/single-tester-feedback-driven-fix-loop-record.json',
  'docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import',
  'completed_docs_only_qwen_runtime_stack_import_guard_no_runtime_execution',
  '90f13932d89f3aa0975e825d3959f07801ce8347',
  '#1465',
  '#1471',
  '#982',
  '#577',
  '52bee9537d8c9d9fd26a595953f4ee362a213d22',
  '4412',
  'directStackMergeApproved: false',
  'blindCherryPickApproved: false',
  'freshSourceImportRequired: true',
  'fresh split import',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-single-tester-feedback-driven-fix-loop-1-diagnostics.mjs')
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
  /\bdirect stack merge:\s*`?(approved|true|enabled)\b/i,
  /\bblind cherry-pick:\s*`?(approved|true|enabled)\b/i,
  /\b(Supabase mutation|SQL execution|migration apply|provider call|model call|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|QWEN runtime execution|Docker execution):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-stack-fresh-source-import-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import') fail('decision mismatch')
if (record.execution !== 'completed_docs_only_qwen_runtime_stack_import_guard_no_runtime_execution') fail('execution mismatch')
if (record.integrationBase !== '90f13932d89f3aa0975e825d3959f07801ce8347') fail('integration base mismatch')
if (record.sourceClosure?.singleTesterFeedbackDrivenFixLoopPr !== 1471) fail('missing #1471 source')
if (record.sourceClosure?.qwenStackTopPr !== 1465) fail('missing #1465 source')
if (record.sourceClosure?.qwenStackRootPr !== 982) fail('missing #982 source')
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('missing #577 exclusion')
if (record.diffReadback?.integrationToQwenStackTopChangedPaths !== 4412) fail('diff path count mismatch')
if (record.diffReadback?.directStackMergeApproved !== false) fail('direct stack merge must be false')
if (record.diffReadback?.blindCherryPickApproved !== false) fail('blind cherry-pick must be false')
if (record.diffReadback?.freshSourceImportRequired !== true) fail('fresh source import must be true')
if (record.diffReadback?.splitImportRequired !== true) fail('split import must be true')
if (record.nextMilestones?.firstSplitImport !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1') fail('first split import milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
for (const key of ['supabaseMutation', 'sqlExecution', 'migrationApply', 'secretPayloadAccess', 'providerCall', 'modelCall', 'workerExecution', 'workerDispatch', 'routeExecution', 'cloudRunInvocation', 'signedUrlCreation', 'publicArtifactCreation', 'deployment', 'qwenRuntimeExecution', 'dockerExecution', 'packageInstallation', 'dependencyMutation', 'packageLockMutation']) {
  if (record.safety?.[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')

const fixLoop = JSON.parse(read('docs/external-beta/single-tester-feedback-driven-fix-loop-1/single-tester-feedback-driven-fix-loop-record.json'))
if (!fixLoop.readiness?.nextMilestones?.includes(packet)) fail('fix-loop source does not route to this packet')
const stackRollup = JSON.parse(read('docs/external-beta/qwen2-5-vl-external-beta-stack-integration-rollup-1/qwen2-5-vl-stack-rollup-record.json'))
if (stackRollup.integrationRisk?.freshSourceImportRequired !== true) fail('stack rollup does not require fresh import')
if (stackRollup.integrationRisk?.directStackMergeApproved !== false) fail('stack rollup unexpectedly approves direct merge')
if (stackRollup.integrationRisk?.blindCherryPickApproved !== false) fail('stack rollup unexpectedly approves blind cherry-pick')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-stack-fresh-source-import-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs') fail('missing package diagnostics script')
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
console.log('Decision: completed_qwen_runtime_stack_fresh_source_import_guard_ready_for_split_import')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1')
