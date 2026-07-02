#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1'
const dir = 'docs/external-beta/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
const recordPath = `${dir}/gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-record.json`
const decision = 'completed_gstreamer_mkvtoolnix_narrow_execution_ready_route_worker_bridge'
const execution = 'completed_backend_route_worker_bridge_source_for_controlled_generated_fixture_runtime_execution'
const integrationBase = 'a0ff760725bbeeb931317115f862e8a495cae972'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${dir}/source-audit.md`,
  `${dir}/route-worker-bridge.md`,
  `${dir}/safety-boundary.md`,
  `${dir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1.md',
]

const sourceFiles = [
  'server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-smoke.ts',
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...sourceFiles,
  'package.json',
])

const requiredText = [
  packet,
  decision,
  execution,
  integrationBase,
  routePath,
  `${confirmEnv}=true`,
  'delegates_existing_guarded_runtime_packet',
  'controlled_generated_fixture_runtime_execution',
  'generated_srt_and_generated_subtitle_only_mkv_fixture',
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
  'ready_for_guarded_generated_fixture_route_invocation',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 open_draft_blocked_excluded',
  nextMilestone,
]

const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^src\//,
  /^supabase\//,
  /^database\//,
  /^migrations?\//,
  /^docker\//,
  /^\.dockerignore$/,
  /^\.github\//,
  /^\.env/,
  /^requirements/i,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenClaimPatterns = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bready_for_paid_production\b/i,
  /\bready_for_production\b/i,
  /\bready_for_final_delivery\b/i,
  /\b(?:Supabase mutation|SQL execution|Secret Manager payload access|Provider call|Model call|Signed URL creation|Public artifact creation|Credit mutation|Deployment|Internal beta unlock|External beta unlock|Production unlock|Final render\/export|Private media processing|User media processing|FFmpeg\/FFprobe execution|Docker push\/deploy|Remotion execution|Package installation|Dependency mutation|Package-lock mutation|Dockerfile install-source change|Requirements install-source change|broad service-role handler):\s*`?(true|enabled|completed|run|executed)\b/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"secretPayloadAccess"\s*:\s*true/i,
  /"serviceRoleSecretPayloadAccess"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function json(file) {
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

for (const file of [...packetFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'] !==
  'tsx server/smoke/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-smoke.ts'
) fail('missing smoke package script')
if (
  packageJson.scripts?.['rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1:diagnostics'] !==
  'node scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1-diagnostics.mjs'
) fail('missing diagnostics package script')

const corpus = [...packetFiles, ...sourceFiles].map(read).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const service = read(sourceFiles[0])
if (!service.includes('spawn(')) fail('service must contain default async runtime delegate')
if (!service.includes('runtimeRunner?: () => Promise')) fail('service must expose injectable runtime runner for smoke safety')
if (!service.includes(postDispatchRuntimeScriptName())) fail('service must delegate to existing post-dispatch runtime packet')
if (!service.includes('blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation')) {
  fail('service must fail closed when confirmation is absent')
}
if (!service.includes('blocked_unsupported_runtime_request_payload')) {
  fail('service must reject unsupported payloads')
}

const workerRoutes = read('server/routes/worker-routes.ts')
if (!workerRoutes.includes('gstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeSchema')) {
  fail('worker route schema not registered')
}
if (!workerRoutes.includes('runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge')) {
  fail('worker route handler not registered')
}

const schema = read('server/validation/worker-schemas.ts')
if (!schema.includes('gstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeSchema')) {
  fail('worker schema missing')
}
if (!schema.includes("z.literal('generated_srt_and_generated_subtitle_only_mkv_fixture')")) {
  fail('schema must require generated fixture scope')
}
if (!schema.includes("z.literal('backend_service_role_only')")) {
  fail('schema must require backend service-role owner envelope')
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.integrationBase !== integrationBase) fail('integration base mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.sourceChain?.failClosedHandlerRegistrationQaRollupPr !== 2110) fail('source PR #2110 mismatch')
if (record.sourceChain?.failClosedHandlerRegistrationQaRollupMergeSha !== integrationBase) fail('source merge mismatch')
if (record.sourceChain?.excludedRemotionPr !== '#577 open_draft_blocked_excluded') fail('#577 exclusion mismatch')
if (record.routeWorkerBridge?.routePath !== routePath) fail('route path mismatch')
if (record.routeWorkerBridge?.confirmationGate !== `${confirmEnv}=true`) fail('confirmation gate mismatch')
if (record.routeWorkerBridge?.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') {
  fail('fixture scope mismatch')
}
if (record.routeWorkerBridge?.runtimeDelegate !== 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs') {
  fail('runtime delegate mismatch')
}
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must remain false in record: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact mismatch')
if (!['pending_final_validation', 'passed'].includes(record.validation)) fail('validation status mismatch')
if (record.nextMilestone !== nextMilestone) fail('next milestone mismatch')

if (gitLines(['diff', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must be unchanged')
if (gitLines(['diff', '--cached', '--name-only', '--', 'package-lock.json']).length) fail('package-lock must not be staged')

const changedFiles = [
  ...gitLines(['diff', '--name-only']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChanged = [...new Set(changedFiles)].sort()
for (const file of uniqueChanged) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) fail(`forbidden changed path: ${file}`)
  }
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routePath,
  changedFiles: uniqueChanged,
  nextMilestone,
  safety: 'non_executing_diagnostics_route_worker_bridge_scope_preserved',
}, null, 2))

function postDispatchRuntimeScriptName() {
  return 'rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs'
}
