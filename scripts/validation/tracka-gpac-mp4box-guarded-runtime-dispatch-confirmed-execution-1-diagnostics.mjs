#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1'
const packetDir =
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1'
const recordPath = `${packetDir}/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-record.json`
const decision = 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
const execution = 'blocked_confirmation_absent_no_route_worker_or_tool_execution'
const gate = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true'
const routeId = 'render.gpacMp4box.serviceRolePackageMock'
const routePath = '/api/render/gpac-mp4box/package/mock'
const workerSkeletonId = 'worker.gpacMp4box.packageValidation.mock'
const approvedSnapshot = 'approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetFiles = [
  `${packetDir}/source-chain.md`,
  `${packetDir}/execution-runner.md`,
  `${packetDir}/evidence-manifest-policy.md`,
  `${packetDir}/blocked-result.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/validation-results.md`,
  recordPath,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.md',
]

const implementationFiles = [
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
]

const sourceFiles = [
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/proof-evidence-acceptance.json',
  'src/backend/api/routes/gpac-mp4box-api-routes.ts',
  'src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts',
]

const allowedChangedFiles = new Set([...packetFiles, ...implementationFiles])
const forbiddenPathPatterns = [
  /^package-lock\.json$/,
  /^docker\//,
  /^\.dockerignore$/,
  /^supabase\//,
  /^database\//,
  /^src\//,
  /^server\//,
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
  /\b(?:route execution|worker dispatch|worker execution|GPAC\/MP4Box execution|media processing|private media processing|user media processing|storage transfer|signed URL creation|public artifact creation|Supabase mutation|SQL execution|final render\/export|external beta expansion|paid production unlock|production unlock):\s*`?(true|enabled|completed|passed|run|executed|approved)\b/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"privateMediaProcessing"\s*:\s*true/i,
  /"userMediaProcessing"\s*:\s*true/i,
  /"storageTransfer"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
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
  packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1'] !==
  'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1:diagnostics'] !==
  'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

const corpus = packetFiles.map(read).join('\n')
for (const text of [
  packet,
  decision,
  execution,
  gate,
  'Confirmation gate observed: `absent`',
  'confirmed_execution_runner_added_fail_closed',
  routeId,
  routePath,
  workerSkeletonId,
  approvedSnapshot,
  'manifest.gpacMp4box.privateInput.generatedSubtitleOnly.v1',
  'manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1',
  'cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1',
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  'mp4box_package_validation_metadata_v1',
  'blocked_gpac_mp4box_route_handler_not_enabled_for_confirmed_dispatch',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '#577 remains open/draft/blocked/excluded',
]) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaims) {
  if (pattern.test(corpus)) fail(`forbidden execution/unlock claim matched: ${pattern}`)
}

const record = json(recordPath)
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== decision) fail('decision mismatch')
if (record.execution !== execution) fail('execution mismatch')
if (record.runnerStatus !== 'confirmed_execution_runner_added_fail_closed') fail('runner status mismatch')
if (record.confirmationGate?.required !== gate) fail('gate mismatch')
if (record.confirmationGate?.observed !== 'absent') fail('observed gate mismatch')
if (record.route?.routeId !== routeId || record.route?.path !== routePath) fail('route mismatch')
if (record.worker?.skeletonId !== workerSkeletonId || record.worker?.workerKind !== 'render_export') fail('worker mismatch')
if (record.fixture?.approvedSnapshotId !== approvedSnapshot) fail('fixture mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count mismatch')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const [key, value] of Object.entries(record.currentPhaseExecution ?? {})) {
  if (value !== false) fail(`current phase execution must be false: ${key}`)
}
if (record.futureConfirmedGateBehavior?.absentGate !== decision) fail('absent gate behavior mismatch')
if (
  record.futureConfirmedGateBehavior?.presentGateWithCurrentDisabledSource !==
  'blocked_gpac_mp4box_route_handler_not_enabled_for_confirmed_dispatch'
) {
  fail('present-gate disabled-source behavior mismatch')
}

const runner = read('scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.mjs')
for (const text of [
  gate,
  'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation',
  'blocked_gpac_mp4box_route_handler_not_enabled_for_confirmed_dispatch',
  'process.exit(1)',
  'routeExecution: false',
  'workerDispatch: false',
  'workerExecution: false',
  'gpacMp4boxExecution: false',
]) {
  if (!runner.includes(text)) fail(`runner missing required fail-closed text: ${text}`)
}
if (/execFileSync|spawnSync|\.exec\(/.test(runner)) fail('runner must not execute route/tool commands')

const pinned = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/pinned-dispatch-contract.json')
if (pinned.route?.routeId !== routeId || pinned.route?.path !== routePath) fail('pinned route drift')
if (pinned.workerTarget?.skeletonId !== workerSkeletonId) fail('pinned worker drift')
if (!pinned.commandTemplateAllowlist?.includes('mp4box_add_generated_subtitle_only_v1')) fail('pinned command allowlist drift')

const realignment = json('docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json')
if (realignment.activeNativeContainerToolLaneCount !== 3) fail('active tool count drift')
if (!realignment.activeToolLanes?.gpac_mp4box_packaging_validation?.activeInThisAgentLane) fail('GPAC lane inactive')

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
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
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path: ${file}`)
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
  runnerStatus: 'confirmed_execution_runner_added_fail_closed',
  activeToolCount: 3,
}, null, 2))
