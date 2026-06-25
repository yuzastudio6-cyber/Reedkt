#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-RUNTIME-TARGET-OWNER-DECISION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/internal-beta/rp-internal-beta-runtime-target-owner-decision-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/owner-decision.md`,
  `${packetDir}/runtime-decision-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/runtime-target-owner-decision-record.json`,
  'docs/activation-phase-rp-internal-beta-runtime-target-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-runtime-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/target-approval-decision.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/google-cloud-managed-target-matrix.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1/google-cloud-managed-runtime-target-approval-record.json',
  'docs/activation-phase-rp-internal-beta-google-cloud-managed-runtime-target-approval-1-results.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/google-cloud-runtime-architecture.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/runtime-gate-matrix.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/implementation-sequence.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1/google-cloud-managed-runtime-implementation-plan-record.json',
  'docs/activation-phase-rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-google-cloud-environment-boundary-1.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/source-audit.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/environment-boundary-decision.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/google-cloud-environment-matrix.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/supabase-target-boundary.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/secret-storage-boundary.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/safety-boundary.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/readiness-gate.md',
  'docs/internal-beta/rp-internal-beta-google-cloud-environment-boundary-1/google-cloud-environment-boundary-record.json',
  'docs/activation-phase-rp-internal-beta-google-cloud-environment-boundary-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-google-cloud-environment-owner-input-1.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-internal-beta-named-runtime-target-approval-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-runtime-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-managed-runtime-target-approval-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-environment-boundary-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

function isFollowOnGoogleCloudApprovalFile(file) {
  return file.includes('rp-internal-beta-google-cloud-managed-runtime-target-approval-1') ||
    file.includes('rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1') ||
    file.includes('rp-internal-beta-google-cloud-environment-boundary-1') ||
    file.includes('activation-phase-rp-internal-beta-google-cloud-managed-runtime-target-approval-1-results') ||
    file.includes('activation-phase-rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1-results') ||
    file.includes('activation-phase-rp-internal-beta-google-cloud-environment-boundary-1-results') ||
    file.includes('rp-internal-beta-google-cloud-environment-owner-input-1') ||
    file.includes('prompt-rp-internal-beta-google-cloud-runtime-config-contract-1')
}

const requiredText = [
  packet,
  'blocked_owner_did_not_name_or_approve_internal_beta_runtime_target',
  'completed_docs_only_runtime_target_owner_decision_no_runtime_unlock',
  '`RP-INTERNAL-BETA-NAMED-RUNTIME-TARGET-APPROVAL-1` merged at `de72fefc62aae8b637067edf4337f1164794e063`',
  'Source-of-truth input: `RP-INTERNAL-BETA-NAMED-RUNTIME-TARGET-APPROVAL-1` merged at `de72fefc62aae8b637067edf4337f1164794e063`',
  'Owner decision evidence: `not_present_in_source`',
  'Approved runtime target: `none`',
  'Rejected runtime target: `not_explicitly_rejected`',
  'Environment class: `not_approved`',
  'Runtime execution approval: `not_approved`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Remote Supabase target approval: `not_approved`',
  'Service-role runtime approval: `not_approved`',
  'Approved snapshot persistence approval: `not_approved`',
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
  'Next recommended milestone: `OWNER INPUT REQUIRED - approve or reject the internal beta runtime target`',
  'No further docs-only packet can honestly convert this blocked state into runtime readiness. Runtime implementation requires the actual target/scope decision.',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, raw prompt execution, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Owner decision evidence:\s*`?(approved|present|accepted|true)/i,
  /Approved runtime target:\s*`(?!none`)/i,
  /Environment class:\s*`(?!not_approved`)/i,
  /Runtime execution approval:\s*`?(approved|true|enabled|passed)/i,
  /Service-role runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Remote Supabase target approval:\s*`?(approved|true|enabled|passed)/i,
  /Approved snapshot persistence approval:\s*`?(approved|true|enabled|passed)/i,
  /Credit ledger runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Job queue runtime approval:\s*`?(approved|true|enabled|passed)/i,
  /Worker dispatch approval:\s*`?(approved|true|enabled|passed)/i,
  /Private artifact access approval:\s*`?(approved|true|enabled|passed)/i,
  /Signed URL approval:\s*`?(approved|true|enabled|passed)/i,
  /Remotion render worker approval:\s*`?(approved|true|enabled|passed)/i,
  /Provider\/model call approval:\s*`?(approved|true|enabled|passed)/i,
  /Provider requests created:(?!\s*`?none`?)/i,
  /Provider\/model calls(?: executed)?:\s*`?(true|completed|enabled|passed)/i,
  /Model call:\s*`?true/i,
  /Raw prompt execution:\s*`?true/i,
  /Worker dispatch executed:\s*`?true/i,
  /Worker execution:(?!\s*`?(false|none|not_run)`?)/i,
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
  /Render\/export execution:(?!\s*`?(false|none|not_run)`?)/i,
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
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Runtime Enablement Owner Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Named Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Target Approval 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Managed Runtime Implementation Plan 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## RP-INTERNAL-BETA Google Cloud Environment Boundary 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## Track A[\s\S]*?(?=\n## |\n# |$)/g, '\n')
}

const docsCorpus = requiredFiles
  .filter((file) => (file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md') && !isFollowOnGoogleCloudApprovalFile(file))
  .map((file) => stripHistoricalSections(read(file)))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/runtime-target-owner-decision-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'blocked_owner_did_not_name_or_approve_internal_beta_runtime_target') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_runtime_target_owner_decision_no_runtime_unlock') fail('record execution mismatch')
if (record.sourceMerge !== 'de72fefc62aae8b637067edf4337f1164794e063') fail('source merge mismatch')
if (record.ownerDecisionEvidence !== 'not_present_in_source') fail('owner decision evidence mismatch')
if (record.approvedRuntimeTarget !== 'none') fail('approved runtime target must stay none')
if (record.rejectedRuntimeTarget !== 'not_explicitly_rejected') fail('rejected runtime target mismatch')
if (record.environmentClass !== 'not_approved') fail('environment class must stay not_approved')
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
if (packageJson.scripts?.['rp-internal-beta-runtime-target-owner-decision-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-runtime-target-owner-decision-1-diagnostics.mjs') {
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
  if (!allowedChangedFiles.has(file) && !isFollowOnGoogleCloudApprovalFile(file)) fail(`unexpected changed file ${file}`)
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
  if (isFollowOnGoogleCloudApprovalFile(file)) continue
  const text = stripHistoricalSections(fs.readFileSync(file, 'utf8'))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
