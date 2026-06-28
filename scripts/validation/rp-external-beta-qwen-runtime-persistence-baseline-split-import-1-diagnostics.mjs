#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-BASELINE-SPLIT-IMPORT-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-baseline-split-import-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/persistence-guard.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-baseline-split-import-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-baseline-split-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-baseline-split-import-1.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11.md',
  'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix.ts',
  'server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix-smoke.ts',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-baseline-split-import-1-diagnostics.mjs',
  'supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard',
  'completed_source_import_qa_reports_approved_snapshot_guard_no_remote_execution',
  '9f89a608f0861e1a24953c4cad0a1329a51e3c46',
  '#1465',
  '#1474',
  '#577',
  '52bee9537d8c9d9fd26a595953f4ee362a213d22',
  'qa_reports.approved_plan_snapshot_id compatibility guard',
  'public.qa_reports.approved_plan_snapshot_id',
  'qa_reports_approved_plan_snapshot_id_fkey',
  'idx_qa_reports_project_snapshot',
  'no_backfill_because_migration_must_not_invent_qa_reports_approved_snapshots_generated_assets_jobs_workers_provider_outputs_credit_records_or_qwen_runtime_records',
  'directStackMergeApproved: false',
  'blindCherryPickApproved: false',
  'Broad QWEN stack imported: `false`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs')

const forbiddenPrefixes = [
  'package-lock.json',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
  'src/routes/',
  'src/pages/',
  'server/routes/',
  'server/workers/',
]

const forbiddenClaims = [
  /\b(direct stack merge|blind cherry-pick):\s*`?(approved|true|enabled)\b/i,
  /\b(broad QWEN stack imported|broadQwenStackImported):\s*`?(true|enabled)\b/i,
  /\b(remote Supabase touched|remoteSupabaseTouched|Supabase remote execution|SQL execution|migration apply|Supabase CLI execution|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker execution):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-baseline-split-import-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard') fail('decision mismatch')
if (record.execution !== 'completed_source_import_qa_reports_approved_snapshot_guard_no_remote_execution') fail('execution mismatch')
if (record.integrationBase !== '9f89a608f0861e1a24953c4cad0a1329a51e3c46') fail('integration base mismatch')
if (record.sourceGuardPr !== 1474) fail('missing #1474 source guard')
if (record.sourceQwenPr !== 1465) fail('missing #1465 source')
if (record.sourceQwenHead !== '52bee9537d8c9d9fd26a595953f4ee362a213d22') fail('source QWEN head mismatch')
if (record.directStackMergeApproved !== false) fail('direct stack merge must be false')
if (record.blindCherryPickApproved !== false) fail('blind cherry-pick must be false')
if (record.broadQwenStackImported !== false) fail('broad stack import must be false')
if (record.compatibilityColumn !== 'public.qa_reports.approved_plan_snapshot_id') fail('compatibility column mismatch')
if (record.constraintGuarded !== 'qa_reports_approved_plan_snapshot_id_fkey') fail('constraint guard mismatch')
if (record.indexUnblocked !== 'idx_qa_reports_project_snapshot') fail('index mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const sql = read('supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql')
for (const phrase of [
  'add column if not exists approved_plan_snapshot_id uuid references public.approved_plan_snapshots(id) on delete set null',
  'comment on column public.qa_reports.approved_plan_snapshot_id',
  'no backfill is invented here',
  "conrelid = 'public.qa_reports'::regclass",
  "conname = 'qa_reports_approved_plan_snapshot_id_fkey'",
  'add constraint qa_reports_approved_plan_snapshot_id_fkey',
  'foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null',
  'create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id)',
]) {
  if (!sql.includes(phrase)) fail(`migration missing phrase: ${phrase}`)
}
if (/insert\s+into\s+public\.qa_reports/i.test(sql)) fail('migration must not insert qa_reports rows')
if (/insert\s+into\s+public\.approved_plan_snapshots/i.test(sql)) fail('migration must not insert approved snapshots')
if (/update\s+public\.qa_reports\s+set\s+approved_plan_snapshot_id/i.test(sql)) fail('migration must not backfill approved snapshots')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix'] !== 'tsx server/smoke/qwen2-5-vl-backend-runtime-persistence-baseline-qa-reports-approved-snapshot-fix-smoke.ts') fail('missing smoke package script')
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-baseline-split-import-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-baseline-split-import-1-diagnostics.mjs') fail('missing diagnostics package script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const stackGuard = JSON.parse(read('docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json'))
if (stackGuard.nextMilestones?.firstSplitImport !== packet) fail('stack guard does not route to this packet')
if (stackGuard.diffReadback?.directStackMergeApproved !== false) fail('stack guard unexpectedly approves direct merge')
if (stackGuard.diffReadback?.blindCherryPickApproved !== false) fail('stack guard unexpectedly approves blind cherry-pick')

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of forbiddenPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen_runtime_persistence_baseline_split_import_qa_reports_approved_snapshot_guard')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11')
