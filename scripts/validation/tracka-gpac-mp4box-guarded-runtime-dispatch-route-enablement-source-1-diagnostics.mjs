#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ROUTE-ENABLEMENT-SOURCE-1'
const decision = 'completed_gpac_mp4box_guarded_runtime_dispatch_route_enablement_source'
const execution = 'completed_guarded_backend_route_source_to_mock_queue_handoff_no_tool_execution'
const routePath = '/v1/external-beta/gpac-mp4box/guarded-runtime-dispatch/generated-fixture/route-source/enqueue'
const gate = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_SOURCE=true'
const nextMilestone = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1R'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1'
const recordPath = `${packetDir}/route-enablement-source-record.json`
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-chain.md`,
  `${packetDir}/route-source-contract.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1r.md',
]

const sourceFiles = [
  'server/services/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1.ts',
  'server/routes/worker-routes.ts',
  'server/validation/worker-schemas.ts',
  'server/smoke/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-smoke.ts',
  'src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts.ts',
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.json',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-diagnostics.mjs',
]

const downstreamExecutionReadyRouteWorkerBridgeFiles = [
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/source-chain.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/route-worker-bridge.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/safety-boundary.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/validation-results.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-execution-ready-route-worker-bridge-1/gpac-mp4box-execution-ready-route-worker-bridge-1-record.json',
  'docs/activation-phase-tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-execution-ready-route-worker-bridge-qa-rollup-1.md',
  'scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs',
  'scripts/validation/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-diagnostics.mjs',
  'server/services/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1.ts',
  'server/smoke/tracka-gpac-mp4box-execution-ready-route-worker-bridge-1-smoke.ts',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...implementationFiles,
  ...sourceFiles,
  ...downstreamExecutionReadyRouteWorkerBridgeFiles,
])
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

const forbiddenClaims = [
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /\b(?:worker dispatch|worker execution|GPAC\/MP4Box execution|FFmpeg\/FFprobe execution|Docker execution|Remotion execution|media processing|private media processing|user media processing|storage transfer|Supabase mutation|SQL execution|signed URL creation|public artifact creation|final render\/export|external beta expansion|paid production unlock|production unlock):\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"ffmpegFfprobeExecution"\s*:\s*true/i,
  /"dockerExecution"\s*:\s*true/i,
  /"remotionExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"storageTransfer"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"finalRenderExport"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
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

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

for (const file of [...packetFiles, ...implementationFiles, ...sourceFiles]) read(file)

const packageJson = json('package.json')
if (
  packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1:diagnostics'] !==
  'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}
if (
  packageJson.scripts?.['smoke:tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1'] !==
  'tsx server/smoke/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-smoke.ts'
) {
  fail('missing smoke package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of [
  packet,
  decision,
  execution,
  routePath,
  gate,
  nextMilestone,
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  '#577 remains open/draft/blocked/excluded',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'HTTP route invocation proof',
  'passed_fail_closed_without_gate_and_confirmed_local_mock_queue_only_with_gate',
]) {
  if (!corpus.includes(text)) fail(`missing required packet text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden execution/unlock claim matched in docs: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('record packet mismatch')
if (record.decision !== decision) fail('record decision mismatch')
if (record.execution !== execution) fail('record execution mismatch')
if (record.routePath !== routePath) fail('record route path mismatch')
if (record.confirmationGate?.required !== gate) fail('record gate mismatch')
if (record.activeNativeContainerToolLaneCount !== 3) fail('record active tool lane count mismatch')
if (
  record.gpacMp4box?.httpRouteInvocationProof !==
  'passed_fail_closed_without_gate_and_confirmed_local_mock_queue_only_with_gate'
) {
  fail('record HTTP route invocation proof mismatch')
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('record product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('record package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('record generated artifacts status mismatch')
if (record.nextMilestone !== nextMilestone) fail('record next milestone mismatch')
for (const [key, value] of Object.entries(record.currentPhaseExecution ?? {})) {
  if (value !== false) fail(`record execution flag must be false: ${key}`)
}

const service = read('server/services/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1.ts')
for (const text of [
  gate.replace('=true', ''),
  routePath,
  'completed_guarded_backend_route_source_to_mock_queue_handoff_no_tool_execution',
  'blocked_missing_gpac_mp4box_guarded_runtime_dispatch_route_source_confirmation',
  'blocked_runtime_or_remote_execution_not_enabled_for_gpac_mp4box_route_source',
  'enqueueGpacMp4boxGuardedWorkerMock',
  'validateGpacMp4boxGuardedWorkerSkeletonMockInput',
  'gpacMp4boxExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'supabaseMutation: false',
  'sqlExecution: false',
  'signedUrlCreation: false',
  'publicArtifactCreation: false',
]) {
  if (!service.includes(text)) fail(`service missing required source text: ${text}`)
}
if (/spawnSync|execSync|execFileSync|\.exec\(|child_process/.test(service)) {
  fail('service must not execute shell/tool commands')
}

const routeSource = read('server/routes/worker-routes.ts')
if (!routeSource.includes('runGpacMp4boxGuardedRuntimeDispatchRouteEnablementSource')) {
  fail('worker route missing GPAC route-source handler')
}
if (!routeSource.includes('gpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceSchema')) {
  fail('worker route missing GPAC route-source schema')
}

const schema = read('server/validation/worker-schemas.ts')
for (const text of [
  'gpacMp4boxGuardedRuntimeDispatchRouteEnablementSourceSchema',
  'guarded_route_source_to_mock_queue_handoff_only',
  'backend_service_role_only',
  'generated_fixture',
  'mp4box_package_validation_metadata_v1',
]) {
  if (!schema.includes(text)) fail(`schema missing ${text}`)
}

const smoke = read('server/smoke/tracka-gpac-mp4box-guarded-runtime-dispatch-route-enablement-source-1-smoke.ts')
for (const text of [
  'absent_confirmation_blocks',
  'confirmed_route_source_creates_local_mock_queue_only',
  'express_route_registered_and_fails_closed_without_env_gate',
  'express_route_confirmed_returns_local_mock_queue_only',
  'tool_execution_request_blocks',
  'unapproved_command_template_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}

const realignment = json('docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json')
if (realignment.activeNativeContainerToolLaneCount !== 3) fail('realignment count drifted')
if (!realignment.activeToolLanes?.gpac_mp4box_packaging_validation?.activeInThisAgentLane) fail('GPAC lane inactive')

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

const changedCorpus = uniqueChangedFiles
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map(read)
  .join('\n')
for (const pattern of forbiddenClaims) {
  if (pattern.test(changedCorpus)) fail(`forbidden changed-file claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  ok: true,
  packet,
  decision,
  execution,
  routePath,
  activeNativeContainerToolLaneCount: 3,
}, null, 2))
