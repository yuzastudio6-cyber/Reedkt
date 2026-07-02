#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1'
const runtimePacket = 'TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1'
const decision = 'completed_gpac_mp4box_execution_ready_route_worker_bridge'
const execution = 'completed_backend_route_worker_bridge_source_for_gpac_mp4box_generated_fixture_runtime_execution'
const routePath = '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute'
const routeGate = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true'
const runtimeGate = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true'
const nextMilestone = 'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1'
const recordPath = `${packetDir}/gpac-mp4box-execution-ready-route-worker-bridge-1-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-chain.md`,
  `${packetDir}/route-worker-bridge.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1.md',
]

const sourceFiles = [
  'scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs',
  'server/services/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-smoke.ts',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...packetFiles, ...sourceFiles, ...implementationFiles])
const forbiddenChangedPaths = [
  /^package-lock\.json$/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^migrations\//,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /^requirements/i,
  /^\.env/,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
  /(^|\/)\._/,
  /(^|\/)\.DS_Store$/,
]

const forbiddenDocClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\bprivate media processing:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\buser media processing:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bSupabase mutation:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bSQL execution:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bsigned URL creation:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bpublic artifact creation:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bfinal render\/export:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /\bproduction unlock:\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...sourceFiles, ...implementationFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gpac-mp4box-generated-fixture-runtime-execution-1'] !==
  'node scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs'
) {
  fail('missing runtime execution package script')
}
if (
  packageJson.scripts?.['tracka:gpac-mp4box-execution-ready-route-worker-bridge-1:diagnostics'] !==
  'node scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}
if (
  packageJson.scripts?.['smoke:tracka-gpac-mp4box-execution-ready-route-worker-bridge-1'] !==
  'tsx server/smoke/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-smoke.ts'
) {
  fail('missing smoke package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of [
  packet,
  runtimePacket,
  decision,
  execution,
  routePath,
  routeGate,
  runtimeGate,
  nextMilestone,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577 remains open/draft/blocked/excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const pattern of forbiddenDocClaims) {
  if (pattern.test(corpus)) fail(`forbidden docs claim matched: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('record tool lane count mismatch')
if (record.routePath !== routePath) fail('record route path mismatch')
if (record.runtimePacket !== runtimePacket) fail('record runtime packet mismatch')
if (record.confirmationGate?.routeBridge !== routeGate) fail('record route gate mismatch')
if (record.confirmationGate?.runtimePacket !== runtimeGate) fail('record runtime gate mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('record product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('record package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('record generated artifacts status mismatch')
if (record.nextMilestone !== nextMilestone) fail('record next milestone mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`record safety flag must be false: ${key}`)
}

const runner = read('scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs')
for (const text of [
  runtimePacket,
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION',
  'blocked_missing_gpac_mp4box_generated_fixture_runtime_execution_confirmation',
  'blocked_gpac_mp4box_runtime_image_unavailable',
  'completed_gpac_mp4box_generated_fixture_runtime_execution',
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  '--network',
  'none',
  'generated-synthetic-subtitles.srt',
  'generated-subtitle-only.mp4',
]) {
  if (!runner.includes(text)) fail(`runner missing required text: ${text}`)
}

const service = read('server/services/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1.ts')
for (const text of [
  packet,
  decision,
  execution,
  routePath,
  routeGate.replace('=true', ''),
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION',
  'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation',
  'blocked_unsupported_gpac_mp4box_runtime_request_payload',
  'blocked_gpac_mp4box_generated_fixture_runtime_runner_summary_invalid',
  'runGpacMp4boxExecutionReadyRouteWorkerBridge',
  'buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput',
  'gpacMp4boxExecution: ok ?',
  'privateMediaProcessing: false',
  'userMediaProcessing: false',
  'supabaseMutation: false',
  'sqlExecution: false',
  'publicArtifactCreation: false',
  'finalRenderExport: false',
]) {
  if (!service.includes(text)) fail(`service missing required source text: ${text}`)
}

const routes = read('server/routes/worker-routes.ts')
for (const text of [
  'TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH',
  'runGpacMp4boxExecutionReadyRouteWorkerBridge',
  'gpacMp4boxExecutionReadyRouteWorkerBridgeSchema',
]) {
  if (!routes.includes(text)) fail(`worker routes missing ${text}`)
}

const schema = read('server/validation/worker-schemas.ts')
for (const text of [
  'gpacMp4boxExecutionReadyRouteWorkerBridgeSchema',
  'controlled_generated_fixture_runtime_execution',
  'generated_srt_to_subtitle_only_mp4_fixture',
  'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet',
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
]) {
  if (!schema.includes(text)) fail(`schema missing ${text}`)
}

const smoke = read('server/smoke/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-smoke.ts')
for (const text of [
  'confirmation_gate_blocks_before_runner',
  'unsafe_public_url_payload_blocks_before_runner',
  'fake_runner_success_path_accepts_generated_fixture_runtime_packet',
  'express_route_registered_and_fails_closed_without_env_gate',
  'no_private_media_supabase_sql_public_artifact_or_final_export_enabled',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

const changedFiles = [
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['diff', '--cached', '--name-only']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
]
const uniqueChangedFiles = [...new Set(changedFiles)]
for (const file of uniqueChangedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (forbiddenChangedPaths.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routePath,
  activeNativeContainerToolLaneCount: 3,
  changedFiles: uniqueChangedFiles,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
}, null, 2))
