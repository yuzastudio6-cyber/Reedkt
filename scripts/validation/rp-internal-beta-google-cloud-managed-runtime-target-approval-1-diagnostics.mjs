#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-TARGET-APPROVAL-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/internal-beta/rp-internal-beta-google-cloud-managed-runtime-target-approval-1'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/target-approval-decision.md`,
  `${packetDir}/google-cloud-managed-target-matrix.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/google-cloud-managed-runtime-target-approval-record.json`,
  'docs/activation-phase-rp-internal-beta-google-cloud-managed-runtime-target-approval-1-results.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1.md',
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
  'scripts/validation/rp-internal-beta-runtime-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-managed-runtime-target-approval-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1-diagnostics.mjs',
  'scripts/validation/rp-internal-beta-google-cloud-environment-boundary-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

function isFollowOnGoogleCloudImplementationFile(file) {
  return file.includes('rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1') ||
    file.includes('rp-internal-beta-google-cloud-environment-boundary-1') ||
    file.includes('activation-phase-rp-internal-beta-google-cloud-managed-runtime-implementation-plan-1-results') ||
    file.includes('activation-phase-rp-internal-beta-google-cloud-environment-boundary-1-results') ||
    file.includes('rp-internal-beta-google-cloud-environment-owner-input-1') ||
    file.includes('prompt-rp-internal-beta-google-cloud-runtime-config-contract-1')
}

const requiredText = [
  packet,
  'approved_google_cloud_managed_runtime_target_for_internal_beta_planning',
  'completed_docs_only_google_cloud_managed_runtime_target_approval_no_runtime_execution',
  '`RP-INTERNAL-BETA-RUNTIME-TARGET-OWNER-DECISION-1` merged at `873c737ff99ea0ba1e98d58785ff2cdbbbf33711`',
  'Source-of-truth input: `RP-INTERNAL-BETA-RUNTIME-TARGET-OWNER-DECISION-1` merged at `873c737ff99ea0ba1e98d58785ff2cdbbbf33711`',
  'Owner decision evidence: `current_owner_prompt`',
  'Approved runtime target: `google_cloud_managed_runtime_target`',
  'Runtime target approval scope: `target_class_only_no_runtime_execution`',
  'Environment class: `google_cloud_managed_internal_beta`',
  'Internal beta end-to-end status: `not_ready_pending_runtime_implementation_and_validation`',
  'Product-ready end-to-end local OSS tools: `0`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Exact open duplicate PR: `none`',
  'Exact remote duplicate branch: `none`',
  'Google Cloud managed runtime target: `approved_for_internal_beta_planning`',
  'Google Cloud API call: `false`',
  'Secret Manager payload access: `false`',
  'GCS object creation: `false`',
  'GCS object read: `false`',
  'Remote Supabase target approval: `not_named`',
  'Service-role runtime approval: `not_approved_pending_separate_runtime_packet`',
  'Approved snapshot persistence approval: `not_approved_pending_separate_runtime_packet`',
  'Credit ledger runtime approval: `not_approved_pending_separate_runtime_packet`',
  'Job queue runtime approval: `not_approved_pending_separate_runtime_packet`',
  'Worker dispatch approval: `not_approved_pending_separate_runtime_packet`',
  'Private artifact access approval: `not_approved_pending_separate_runtime_packet`',
  'Signed URL approval: `not_approved_pending_signed_url_policy`',
  'Remotion render worker approval: `not_approved_pending_separate_runtime_packet`',
  'Provider/model call approval: `not_approved_pending_separate_provider_runtime_packet`',
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
  'Deployment: `false`',
  'Internal beta unlock: `false`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase remote environment touched: `none`',
  'SQL executed: `none`',
  'Google Cloud API calls executed: `none`',
  'Secret Manager payload access: `none`',
  'GCS object access: `none`',
  'Provider requests created: `none`',
  'Provider/model calls executed: `none`',
  'Worker execution: `none`',
  'Render/export execution: `none`',
  'Signed URLs created: `none`',
  'Public artifacts created: `none`',
  'Next recommended milestone: `RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-IMPLEMENTATION-PLAN-1`',
  'No remote Supabase mutation, SQL execution, Secret Manager payload access, Google Cloud API call, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Runtime target approval scope:\s*`(?!target_class_only_no_runtime_execution`)/i,
  /Google Cloud API calls? (?:executed|created)?:\s*`?(true|completed|enabled|passed|created)/i,
  /Google Cloud API call:\s*`?(true|completed|enabled|passed)/i,
  /Secret Manager payload access:\s*`?(true|completed|enabled|passed|accessed)/i,
  /GCS object (?:creation|read):\s*`?true/i,
  /GCS object access:\s*`?(true|completed|enabled|passed|accessed|created|read)/i,
  /Service-role runtime approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Remote Supabase target approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Approved snapshot persistence approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Credit ledger runtime approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Job queue runtime approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Worker dispatch approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Private artifact access approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Signed URL approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Remotion render worker approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
  /Provider\/model call approval:\s*`?(approved|true|enabled|passed)(?!_pending)/i,
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
  /Deployment:\s*`?true/i,
  /deployment:\s*`?(completed|enabled|true|passed)/i,
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
    .replace(/\n## RP-INTERNAL-BETA Runtime Target Owner Decision 1[\s\S]*?(?=\n## |\n# |$)/g, '\n')
    .replace(/\n## Track A[\s\S]*?(?=\n## |\n# |$)/g, '\n')
}

const docsCorpus = requiredFiles
  .filter((file) => (file.startsWith('docs/') || file === 'implementation-status-and-next-phase.md') && !isFollowOnGoogleCloudImplementationFile(file))
  .map((file) => stripHistoricalSections(read(file)))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/google-cloud-managed-runtime-target-approval-record.json`))
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== 'approved_google_cloud_managed_runtime_target_for_internal_beta_planning') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_google_cloud_managed_runtime_target_approval_no_runtime_execution') fail('record execution mismatch')
if (record.sourceMerge !== '873c737ff99ea0ba1e98d58785ff2cdbbbf33711') fail('source merge mismatch')
if (record.ownerDecisionEvidence !== 'current_owner_prompt') fail('owner decision evidence mismatch')
if (record.approvedRuntimeTarget !== 'google_cloud_managed_runtime_target') fail('approved runtime target mismatch')
if (record.runtimeTargetApprovalScope !== 'target_class_only_no_runtime_execution') fail('approval scope mismatch')
if (record.environmentClass !== 'google_cloud_managed_internal_beta') fail('environment class mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready_pending_runtime_implementation_and_validation') fail('internal beta status must stay not ready')
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
  'googleCloudApiCall',
  'secretManagerPayloadAccess',
  'gcsObjectCreation',
  'gcsObjectRead',
  'storageObjectCreation',
  'storageObjectRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'deployment',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock',
]) {
  if (record[key] !== false) fail(`${key} must remain false`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-internal-beta-google-cloud-managed-runtime-target-approval-1:diagnostics'] !== 'node scripts/validation/rp-internal-beta-google-cloud-managed-runtime-target-approval-1-diagnostics.mjs') {
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
  if (!allowedChangedFiles.has(file) && !isFollowOnGoogleCloudImplementationFile(file)) fail(`unexpected changed file ${file}`)
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
  if (isFollowOnGoogleCloudImplementationFile(file)) continue
  const text = stripHistoricalSections(fs.readFileSync(file, 'utf8'))
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim ${pattern} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
