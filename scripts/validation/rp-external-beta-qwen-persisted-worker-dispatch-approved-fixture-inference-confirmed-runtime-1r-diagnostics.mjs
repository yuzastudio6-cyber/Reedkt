#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet =
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1R'
const dir = 'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r'
const recordPath = `${dir}/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-record.json`
const decision = 'completed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime'
const execution = 'completed_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime'
const runId = '2026-06-30T12-18-28-184Z-535a64dd'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${dir}/source-audit.md`,
  `${dir}/runtime-result.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-single-tester-product-flow-qa-1.md',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/qwen-persisted-worker-dispatch-runtime-source-bridge-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1/qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-record.json',
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json',
  'server/services/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge.ts',
]

const requiredText = [
  packet,
  decision,
  execution,
  '436bcbe644f3909c3b84c596defe9906c0e410d8',
  '#1819',
  '#1815',
  '#1810',
  '#577',
  'aiediting@reeditpro.com',
  'wmyyttnynmteqgcdishd',
  'reeditpro',
  'us-central1',
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true',
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404',
  runId,
  'qwen25-product-route-provider-runtime-fixture-1r-2026-06-30T12-18-33-730Z-5ef93fc7',
  'qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-2026-06-30T12-18-33-675Z-bc9b7142',
  'qwen25-adapter-runtime-fixture-2026-06-30T12-18-34-273Z-a2a720f0',
  'reeditpro-qwen2-5-vl-private-caller-l57qt',
  'qwen_fixture_inference_smoke_completed',
  'Fail-closed restore: `passed`',
  'Generated artifacts committed: `none`',
  'Package-lock: `unchanged`',
  'Product-ready end-to-end local OSS tools: `0`',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-plan-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-runtime-source-bridge-1-diagnostics.mjs',
])

const blockedChangedPatterns = [
  /^package-lock\.json$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^server\//,
  /^docker\//,
  /^\.github\//,
  /^\.dockerignore$/,
  /^\.env/,
  /^requirements/i,
  /(?:^|\/)(?:dist|node_modules)\//,
  /\.(mp4|mov|mkv|webm|srt|mp3|wav|png|jpg|jpeg)$/i,
]

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Worker execution|Worker dispatch|Signed URL creation|Public artifact creation|Credit mutation|Persistent credit reservation|Deployment|Broad external beta unlock|Paid production unlock|Production unlock|Final render\/export|Private media processing|User media processing|Remotion execution|FFmpeg\/FFprobe execution|Docker execution|Dependency mutation|Package-lock mutation|Direct adapter shortcut)\s*:\s*`?(true|enabled|completed|passed|run)\b/i,
  /"routeInvocation"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"cloudRunDeployment"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"persistentCreditMutation"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"broadExternalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
  /"generatedArtifactCommitted"\s*:\s*true/i,
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

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden packet claim matched: ${pattern}`)
}

const record = parseJson(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.integrationBase !== '436bcbe644f3909c3b84c596defe9906c0e410d8') fail('integration base mismatch')
if (record.sourceChain?.sourceBridgePr !== 1819) fail('missing #1819 source')
if (record.sourceChain?.confirmedRuntimeClosurePr !== 1815) fail('missing #1815 source')
if (record.sourceChain?.approvedFixtureInferenceApprovalPr !== 1810) fail('missing #1810 source')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.target?.tester !== 'aiediting@reeditpro.com') fail('tester mismatch')
if (record.target?.googleCloudProject !== 'reeditpro') fail('Google Cloud project mismatch')
if (record.target?.region !== 'us-central1') fail('region mismatch')
if (record.target?.supabaseProjectRef !== 'wmyyttnynmteqgcdishd') fail('Supabase target mismatch')
if (record.runtime?.runId !== runId) fail('run ID mismatch')
if (record.runtime?.cloudRunExecution !== 'reeditpro-qwen2-5-vl-private-caller-l57qt') fail('Cloud Run execution mismatch')
if (record.runtime?.httpStatus !== 200) fail('HTTP status mismatch')
if (record.runtime?.serviceReason !== 'qwen_fixture_inference_smoke_completed') fail('service reason mismatch')
if (record.runtime?.structuredMetadataAccepted !== true) fail('structured metadata accepted mismatch')
if (record.runtime?.schemaValid !== true) fail('schema valid mismatch')
if (record.runtime?.objectCount !== 3) fail('object count mismatch')
if (record.runtime?.textLikeRegionCount !== 1) fail('text-like region count mismatch')
if (record.runtime?.failClosedRestorePassed !== true) fail('fail-closed restore mismatch')
if (!Array.isArray(record.artifacts) || record.artifacts.length !== 3) fail('artifact summary mismatch')
if (record.readiness?.qwenApprovedFixtureInferenceRuntime !== 'passed') fail('runtime readiness mismatch')
if (record.readiness?.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-SINGLE-TESTER-PRODUCT-FLOW-QA-1') fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const safety = record.safety ?? {}
for (const key of [
  'localGcloudConfigRead',
  'userAccessTokenProbe',
  'adcAccessTokenProbe',
  'cloudRunServiceMetadataReadback',
  'sourceBridgeValidated',
  'qwenProviderCall',
  'modelCall',
  'qwenInference',
  'cloudRunJobExecution',
  'cloudRunServiceUpdate',
  'tokenTempFileDeleted',
]) {
  if (safety[key] !== true) fail(`expected true safety/runtime flag missing: ${key}`)
}
for (const [key, value] of Object.entries(safety)) {
  if (
    [
      'localGcloudConfigRead',
      'userAccessTokenProbe',
      'adcAccessTokenProbe',
      'cloudRunServiceMetadataReadback',
      'sourceBridgeValidated',
      'qwenProviderCall',
      'modelCall',
      'qwenInference',
      'cloudRunJobExecution',
      'cloudRunServiceUpdate',
      'tokenTempFileDeleted',
    ].includes(key)
  ) {
    continue
  }
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

const sourceBridge = parseJson(
  'docs/external-beta/qwen-persisted-worker-dispatch-runtime-source-bridge-1/qwen-persisted-worker-dispatch-runtime-source-bridge-record.json',
)
if (sourceBridge.decision !== 'completed_qwen_persisted_worker_dispatch_runtime_source_bridge') fail('source bridge predecessor mismatch')
const approval = parseJson(
  'docs/external-beta/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-1/qwen-persisted-worker-dispatch-approved-fixture-inference-approval-record.json',
)
if (approval.decision !== 'approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate') fail('approval predecessor mismatch')

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r.mjs'
) {
  fail('missing runtime package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-persisted-worker-dispatch-approved-fixture-inference-confirmed-runtime-1r-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })
execFileSync('git', ['diff', '--cached', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`changed file is outside packet scope: ${file}`)
  for (const pattern of blockedChangedPatterns) {
    if (pattern.test(file)) fail(`blocked file scope changed: ${file}`)
  }
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase API URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-SINGLE-TESTER-PRODUCT-FLOW-QA-1')
