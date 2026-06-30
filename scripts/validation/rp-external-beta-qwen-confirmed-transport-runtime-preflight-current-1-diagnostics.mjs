#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1'
const packetDir = 'docs/external-beta/qwen-confirmed-transport-runtime-preflight-current-1'
const decision = 'blocked_confirmed_qwen_transport_runtime_preflight'
const execution = 'blocked_route_response_classification_no_provider_or_worker_execution'
const blocker = 'blocked_route_response_classification_failed'
const runId = '2026-06-30T03-16-55-250Z-e8495c3f'
const nextMilestone = 'RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/runtime-preflight-result.md`,
  `${packetDir}/artifact-manifest.md`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/qwen-confirmed-transport-runtime-preflight-current-1-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-staging-api-route-deployment-alignment-1.md',
  'scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.mjs',
  'scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-diagnostics.mjs',
  'package.json',
]

const requiredExistingFiles = [
  'docs/external-beta/qwen-transport-readiness-plan-current-1/qwen-transport-readiness-plan-current-record.json',
  'docs/external-beta/qwen-transport-readiness-plan-current-1/transport-readiness-plan.md',
  'docs/external-beta/qwen-transport-dependency-attempt-result-review-current-1/qwen-transport-dependency-attempt-result-review-current-record.json',
  'server/config/qwen2-5-vl-external-beta-runtime-gate-contract.ts',
  'server/routes/provider-gateway-routes.ts',
  'server/services/qwen2-5-vl-external-beta-product-route-handler-source.ts',
  'server/services/qwen2-5-vl-external-beta-backend-runtime-adapter.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'scripts/validation/rp-external-beta-qwen-transport-readiness-plan-current-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  decision,
  execution,
  blocker,
  runId,
  '0258873cd11acd4fbc91f829e4c45ce25a44ebc8',
  '805bad1f3d5ad738ecb0204ebf696552a4364eca',
  '2026-06-30T02-01-10-237Z-03964b88',
  'aiediting@reeditpro.com',
  'reeditpro',
  'us-central1',
  'wmyyttnynmteqgcdishd',
  'approved_snapshot_structured_metadata_only',
  'reeditpro-staging-api',
  'reeditpro-staging-api-00006-6gw',
  'reeditpro-qwen2-5-vl-l4-worker',
  'reeditpro-qwen2-5-vl-l4-worker-00037-658',
  'providers.qwen25Vl.structuredVisualMetadataPlan',
  'POST /api/providers/qwen2-5-vl/structured-visual-metadata',
  'qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1',
  'HTTP `404`',
  '`not_found`',
  'deployed staging API revision',
  '0ee9faacfc8c920dfec6094bcb213e4f4a57fee39690ec700670bb8bed4ce2ed',
  'd1b107d7f17902d77d25faf95f925ac86d87e50e376172ac638c0a71b2703874',
  nextMilestone,
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const forbiddenPatterns = [
  /\bQWEN2\.5-VL execution:\s*`?(true|enabled|completed|passed)\b/i,
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
  /\bbroad external beta unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed)\b/i,
  /\bDocker execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bRemotion execution:\s*`?(true|enabled|completed|passed)\b/i,
  /\bdependency mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bpackage-lock mutation:\s*`?(true|enabled|completed|passed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /"qwen25VlExecution"\s*:\s*true/i,
  /"providerCall"\s*:\s*true/i,
  /"modelCall"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"generatedAssetCreation"\s*:\s*true/i,
  /"creditMutation"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"dependencyMutation"\s*:\s*true/i,
  /"packageLockMutation"\s*:\s*true/i,
]

const blockedPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^server\/(?!config\/qwen2-5-vl-external-beta-runtime-gate-contract\.ts$)(?!routes\/provider-gateway-routes\.ts$)(?!services\/qwen2-5-vl-external-beta-product-route-handler-source\.ts$)(?!services\/qwen2-5-vl-external-beta-backend-runtime-adapter\.ts$)/,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^cloudbuild\//,
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

const record = parseJson(`${packetDir}/qwen-confirmed-transport-runtime-preflight-current-1-record.json`)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.blocker !== blocker) fail('blocker mismatch')
if (record.run?.runId !== runId) fail('run id mismatch')
if (record.run?.operatorAccount !== 'aiediting@reeditpro.com') fail('operator account mismatch')
if (record.run?.googleCloudProject !== 'reeditpro') fail('project mismatch')
if (record.run?.targetRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.services?.stagingApi?.latestReadyRevisionName !== 'reeditpro-staging-api-00006-6gw') {
  fail('staging revision mismatch')
}
if (record.services?.qwenWorker?.latestReadyRevisionName !== 'reeditpro-qwen2-5-vl-l4-worker-00037-658') {
  fail('qwen revision mismatch')
}
if (record.route?.responseStatus !== 404) fail('response status mismatch')
if (record.route?.responseErrorCode !== 'not_found') fail('response error code mismatch')
if (record.readiness?.nextMilestone !== nextMilestone) fail('next milestone mismatch')
if (record.readiness?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const allowedTrueSafety = new Set([
  'localGcloudConfigRead',
  'cloudRunServiceMetadataReadback',
  'cloudRunInvocation',
  'identityTokenFetch',
  'boundedRouteRequestSent',
  'boundedStructuredMetadataFixtureOnly',
])
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (allowedTrueSafety.has(key)) {
    if (value !== true) fail(`expected true safety flag missing: ${key}`)
  } else if (value !== false) {
    fail(`safety flag must be false: ${key}`)
  }
}

const readinessRecord = parseJson(
  'docs/external-beta/qwen-transport-readiness-plan-current-1/qwen-transport-readiness-plan-current-record.json',
)
if (
  readinessRecord.decision !==
  'completed_current_base_qwen_transport_readiness_plan_ready_for_confirmed_transport_runtime_preflight'
) {
  fail('readiness plan source drift')
}

const packageJson = parseJson('package.json')
if (
  packageJson.scripts?.['rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1'] !==
  'node scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1.mjs'
) {
  fail('missing runtime preflight package script')
}
if (
  packageJson.scripts?.['rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1-diagnostics.mjs'
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
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) fail(`forbidden changed-file claim matched in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${decision}`)
console.log(`Blocker: ${blocker}`)
console.log(`Next milestone: ${nextMilestone}`)
