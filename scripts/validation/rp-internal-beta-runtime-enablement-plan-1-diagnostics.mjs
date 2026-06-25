#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-PLAN-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/internal-beta/rp-internal-beta-runtime-enablement-plan-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-enablement-matrix.md`,
  `${packetDir}/owner-approval-register.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/runtime-enablement-record.json`,
  'docs/activation-phase-rp-internal-beta-runtime-enablement-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-enablement-plan-1.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-enablement-owner-approval-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-e2e-negative-gate-tests-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-enablement-plan-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  packet,
  'blocked_pending_internal_beta_runtime_enablement_owner_approval',
  'completed_docs_only_runtime_enablement_plan_no_runtime_unlock',
  '`RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1` is merged at `df1eb7ac19b240d4a93bceb38dff641622bb2ffa`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Historical/context-only matches: `codex/rp-gd-8-ai-tools-creative-graphics-package-runtime-enablement` and PR #99 are not the target branch/title/scope.',
  'Service-role runtime approval: `not_approved`',
  'Remote Supabase target approval: `not_approved`',
  'Credit ledger runtime approval: `not_approved`',
  'Job queue runtime approval: `not_approved`',
  'Worker dispatch approval: `not_approved`',
  'Private artifact access approval: `not_approved`',
  'Signed URL approval: `not_approved`',
  'Remotion render worker approval: `not_approved`',
  'Provider/model call approval: `not_approved`',
  'Route execution: `false`',
  'Worker execution: `false`',
  'Worker dispatch executed: `false`',
  'Provider/model calls: `false`',
  'Model call: `false`',
  'Raw prompt execution: `false`',
  'Credit mutation: `false`',
  'Credit reservation creation: `false`',
  'Credit spend: `false`',
  'Supabase mutation: `false`',
  'SQL execution: `false`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Signed URL creation: `false`',
  'Public artifact creation: `false`',
  'Remotion execution: `false`',
  'FFmpeg execution: `false`',
  'FFprobe execution: `false`',
  'Media processing: `false`',
  'Internal beta unlock: `false`',
  'Next recommended milestone: `RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-OWNER-APPROVAL-1`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Provider requests created: `none`',
  'Provider/model calls executed: `none`',
  'Worker execution: `none`',
  'Render/export execution: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, raw prompt execution, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Service-role runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Remote Supabase target approval:\s*`?(approved|true|enabled|passed)/i,
  /Credit ledger runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Job queue runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Worker dispatch approval:\s*`?(approved|true|enabled|passed)/i,
  /Private artifact access approval:\s*`?(approved|true|enabled|passed)/i,
  /Signed URL approval:\s*`?(approved|true|enabled|passed)/i,
  /Remotion render worker approval:\s*`?(approved|true|enabled|passed)/i,
  /Provider\/model call approval:\s*`?(approved|true|enabled|passed)/i,
  /Provider\/model calls(?: executed)?:\s*`?(true|completed|enabled|passed)/i,
  /Provider requests created:(?!\s*`?none`?)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none)`?)/i,
  /Route execution:\s*`?true/i,
  /Credit mutation:\s*`?true/i,
  /Credit reservation creation:\s*`?(true|completed|enabled|passed)/i,
  /Credit spend:\s*`?(true|completed|enabled|passed)/i,
  /Supabase mutation:\s*`?true/i,
  /SQL execution:\s*`?true/i,
  /Storage object creation:\s*`?true/i,
  /Storage object read:\s*`?true/i,
  /Signed URL creation:\s*`?true/i,
  /Public artifact creation:\s*`?true/i,
  /Render\/export execution:(?!\s*`?(false|none)`?)/i,
  /Signed URLs created:(?!\s*`?none`?)/i,
  /Public artifacts created:(?!\s*`?none`?)/i,
  /Supabase remote environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set(['package-lock.json', '.dockerignore'])
const forbiddenPrefixes = [
  'server/routes/',
  'server/workers/',
  'database/',
  'docker/',
  'public/',
  'tests/',
  'supabase/migrations/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

function stripHistoricalSections(text) {
  return text
    .replace(/\n## RP-DATA-0[1-4][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-BACKEND-0[1-2][\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-CREDITS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-JOBS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-ARTIFACTS-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-RENDER-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-PROVIDER-01[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA-E2E[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## Track A[\s\S]*?(?=\n## |\n# |$)/g, '\n')
}

const docsCorpus = requiredFiles
  .filter((file) => file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md')
  .map((file) => stripHistoricalSections(read(file)))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-enablement-record.json`))
if (record.decision !== 'blocked_pending_internal_beta_runtime_enablement_owner_approval') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_runtime_enablement_plan_no_runtime_unlock') fail('record execution mismatch')
if (record.baseMerge !== 'df1eb7ac19b240d4a93bceb38dff641622bb2ffa') fail('base merge mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.exactOpenDuplicatePr !== 'none') fail('exact open duplicate PR must be none')
if (record.exactRemoteDuplicateBranch !== 'none') fail('exact remote duplicate branch must be none')
for (const key of [
  'routeExecution',
  'workerExecution',
  'workerDispatchExecuted',
  'providerModelCalls',
  'modelCall',
  'rawPromptExecution',
  'creditMutation',
  'creditReservationCreation',
  'creditSpend',
  'supabaseMutation',
  'sqlExecution',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-runtime-enablement-plan-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-runtime-enablement-plan-1-diagnostics.mjs') {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  'supabase/migrations',
  '.dockerignore',
  'database/migration-drafts',
  'database/test-sql',
  'server/routes',
  'server/workers',
]) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/')) continue
  const text = stripHistoricalSections(read(file))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
