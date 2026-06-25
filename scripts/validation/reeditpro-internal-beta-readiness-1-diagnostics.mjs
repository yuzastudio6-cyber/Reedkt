#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'REEDITPRO-INTERNAL-BETA-READINESS-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/end-to-end-readiness-1'
const requiredFiles = [
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/tool-runtime-matrix.md`,
  `${packetDir}/backend-worker-storage-credit-gates.md`,
  `${packetDir}/next-milestones.md`,
  `${packetDir}/readiness-record.json`,
  'docs/activation-phase-reeditpro-internal-beta-readiness-1-results.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'docs/implementation-prompts/prompt-rp-data-01-supabase-schema-migration-readiness.md',
  'docs/implementation-prompts/prompt-rp-backend-01-approved-snapshot-job-queue-skeleton.md',
  'docs/implementation-prompts/prompt-rp-internal-beta-e2e-1.md',
  'scripts/validation/reeditpro-internal-beta-readiness-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  packet,
  'blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates',
  'completed_docs_only_internal_beta_readiness_source_of_truth_no_runtime_unlock',
  'Internal beta end-to-end status: `not_ready`',
  'restricted_internal_testing_candidate',
  'External beta status: `blocked`',
  'Paid production status: `blocked`',
  'Final delivery/export status: `blocked`',
  'Product-ready end-to-end local OSS tools: `0`',
  'PR #736 is merged at `9b5665a5f830cabb4b550a5d4aee322821014844`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'blocked_pending_ai_graphics_owner_acceptance_for_film_runtime',
  'qa_passed_controlled_generated_private_fixture_execution_evidence',
  'official APT install-source/package presence evidence',
  'blocked_pending_owner_approved_package_source_and_plugin_policy',
  'evaluation_only_non_core_owner_approval_required_before_install_source',
  'handoff_only_no_install_source_change',
  'RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS',
  'RP-BACKEND-01-APPROVED-SNAPSHOT-JOB-QUEUE-SKELETON',
  'RP-CREDITS-01-INTERNAL-CREDIT-LEDGER',
  'RP-STORAGE-01-PRIVATE-ARTIFACT-BUCKETS',
  'RP-RENDER-01-REMOTION-WORKER-SKELETON',
  'RP-INTERNAL-BETA-E2E-1',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Validation: `full_validation_passed_with_npm_ci_enospc_warnings_exit_0`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this readiness phase, MKVToolNix execution in this readiness phase, GPAC/MP4Box execution in this readiness phase, VapourSynth execution in this readiness phase, Revideo execution in this readiness phase, FILM execution, model weight access, FFmpeg/FFprobe execution, Docker build, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|unlocked|enabled|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta status:\s*`?(ready|unlocked|enabled|passed)/i,
  /paid production status:\s*`?(ready|unlocked|enabled|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /final delivery\/export status:\s*`?(ready|unlocked|enabled|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Supabase mutation(?:InThisPr)?:\s*`?(true|enabled|executed|passed)/i,
  /SQL executed:\s*`?(true|yes|executed|passed)/i,
  /Migration deployed:\s*`?(true|yes|deployed|passed)/i,
  /provider call:\s*`?(true|enabled|executed|passed)/i,
  /model call:\s*`?(true|enabled|executed|passed)/i,
  /worker execution:\s*`?(true|enabled|executed|passed)/i,
  /route execution:\s*`?(true|enabled|executed|passed)/i,
  /public artifacts?:\s*`?(created|enabled|true|passed)/i,
  /signed URLs?:\s*`?(created|enabled|true|passed)/i,
  /GStreamer execution in this readiness phase:\s*`?(completed|passed|true|run|executed)/i,
  /MKVToolNix execution in this readiness phase:\s*`?(completed|passed|true|run|executed)/i,
  /GPAC\/MP4Box execution in this readiness phase:\s*`?(completed|passed|true|run|executed)/i,
  /VapourSynth execution in this readiness phase:\s*`?(completed|passed|true|run|executed)/i,
  /Revideo execution in this readiness phase:\s*`?(completed|passed|true|run|executed)/i,
  /FILM execution:\s*`?(completed|passed|true|run|executed)/i,
  /model weight access:\s*`?(completed|passed|true|run|executed|approved|accessed)/i,
  /FFmpeg\/FFprobe execution:\s*`?(completed|passed|true|run|executed)/i,
  /Docker build:\s*`?(completed|passed|true|run|executed)/i,
  /Docker push\/deploy:\s*`?(completed|passed|true|run|executed)/i,
  /Remotion execution:\s*`?(completed|passed|true|run|executed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
  /Dockerfile install-source change:\s*`?(completed|enabled|true|added|changed|passed)/i,
  /requirements install-source change:\s*`?(completed|enabled|true|added|changed|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
])

const forbiddenPrefixes = [
  'src/',
  'server/',
  'database/',
  'supabase/',
  'docker/',
  'public/',
  'tests/',
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

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/readiness-record.json`))
if (record.decision !== 'blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates') {
  fail('readiness record decision mismatch')
}
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')
if (record.sourceClosure?.pr736 !== 'merged_at_9b5665a5f830cabb4b550a5d4aee322821014844') {
  fail('PR #736 merge source closure missing')
}
if (record.sourceClosure?.pr577 !== 'open_draft_blocked_excluded') fail('#577 exclusion missing')

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/reeditpro-internal-beta-readiness-1-diagnostics.mjs'
if (packageJson.scripts?.['internal-beta:readiness-1:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  '.dockerignore',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
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
    file.endsWith('.pt') ||
    file.endsWith('.pth') ||
    file.endsWith('.onnx') ||
    file.endsWith('.ckpt')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  const text = read(file)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
