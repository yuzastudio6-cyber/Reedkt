#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ATTEMPT-RESULT-REVIEW-CURRENT-1'
const packetDir = 'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1'
const decision = 'completed_current_base_qwen_transport_dependency_attempt_result_review_fail_closed_transport_readiness_planning_required'
const execution = 'completed_docs_only_current_base_qwen_transport_attempt_review_no_runtime_invocation'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-TRANSPORT-READINESS-PLAN-CURRENT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/attempt-result-review.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-transport-dependency-attempt-result-review-current-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-transport-readiness-plan-current-1.md',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json',
  'docs/external-beta/qwen-transport-dependency-enablement-current-import-1/qwen-transport-dependency-enablement-current-import-record.json',
  'docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json',
  'src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-enablement-current-import-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-transport-dependency-preflight-current-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  '947095be378733e1ea9efc50bf951f1de16c0bac',
  'completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback',
  'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required',
  'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked',
  '#1755 open/draft/MERGEABLE/CLEAN accepted_as_fail_closed_evidence_only',
  '#1760 open/draft/MERGEABLE/CLEAN accepted_as_fail_closed_evidence_only',
  'b04b40824766e3732cd153d70098b290acde6d25',
  'cb5da38fd019fcd95ebbd7309bc279ea60d864b8',
  'closed_gcloud_user_and_adc_reauth_preflight_passed',
  'transport_metadata_readback_passed_runtime_invocation_still_blocked',
  'fail_closed_transport_dependency_attempt_reviewed_current_base_reconciliation',
  'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_planning_required',
  'Cloud Run invocation: `false`',
  'identity token fetch: `false`',
  'request sent: `false`',
  'QWEN2.5-VL execution: `false`',
  'worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextMilestone,
]

const forbiddenPatterns = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run invocation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run deployment:\s*`?(true|enabled|completed|passed)\b/i,
  /\bCloud Run service update:\s*`?(true|enabled|completed|passed)\b/i,
  /\bidentity token fetch:\s*`?(true|enabled|completed|passed)\b/i,
  /\brequest sent:\s*`?(true|enabled|completed|passed)\b/i,
  /\bprovider call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bmodel call:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bworker dispatch:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bSecret Manager payload access:\s*`?(true|enabled|completed|passed)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bgenerated asset creation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bcredit mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bbroad external beta audience unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"cloudRunInvocation"\s*:\s*true/i,
  /"identityTokenFetch"\s*:\s*true/i,
  /"requestSent"\s*:\s*true/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!smoke\/)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^Dockerfile$/,
  /^requirements/i,
  /^\.env/,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJson(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`)
  }
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const corpus = [...packetFiles, ...requiredExistingFiles].map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = parseJson(`${packetDir}/qwen-transport-dependency-attempt-result-review-current-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '947095be378733e1ea9efc50bf951f1de16c0bac') fail('integration base mismatch')
if (record.draftStackEvidence?.blindMergeApproved !== false) fail('blind merge must be false')
if (record.draftStackEvidence?.fullDraftStackImportApproved !== false) fail('full draft import must be false')
if (record.readiness?.qwenAuthPath !== 'closed_gcloud_user_and_adc_reauth_preflight_passed') fail('auth path mismatch')
if (record.readiness?.remainingBlocker !== 'controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_planning_required') fail('remaining blocker mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (key === 'docsStatusDiagnosticsOnly') {
    if (value !== true) fail('docsStatusDiagnosticsOnly must be true')
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const qwenReauth = parseJson('docs/external-beta/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth-record.json')
if (qwenReauth.decision !== 'completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback') fail('reauth readback source drift')
if (qwenReauth.readiness?.qwenAuthPath !== 'closed_gcloud_user_and_adc_reauth_preflight_passed') fail('reauth source did not close auth path')

const transport = parseJson('docs/external-beta/qwen-transport-dependency-enablement-current-import-1/qwen-transport-dependency-enablement-current-import-record.json')
if (transport.decision !== 'completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required') fail('transport dependency source drift')

const preflight = parseJson('docs/external-beta/qwen-transport-dependency-preflight-current-1/qwen-transport-dependency-preflight-current-record.json')
if (preflight.decision !== 'completed_current_base_qwen_transport_dependency_preflight_runtime_still_blocked') fail('preflight source drift')

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-transport-dependency-attempt-result-review-current-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')

const changedFiles = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (blockedPathPatterns.some((pattern) => pattern.test(file))) fail(`blocked path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc|bin)$/i.test(file)) {
    fail(`generated/media artifact changed: ${file}`)
  }
  const text = read(file)
  if (/ya29\.[A-Za-z0-9_-]+/.test(text)) fail(`Google OAuth token leaked in ${file}`)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden changed-file claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Next milestone: ${nextMilestone}`)
