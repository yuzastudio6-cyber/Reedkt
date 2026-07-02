#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-SCAFFOLD-CONFIRMED-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1'
const decisionText = 'blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation'
const executionText = 'blocked_confirmation_absent_contract_pinned_no_route_worker_or_tool_execution'
const gateName = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1'

const packetFiles = [
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/pinned-dispatch-contract.md`,
  `${packetDir}/pinned-dispatch-contract.json`,
  `${packetDir}/fail-closed-result.md`,
  `${packetDir}/fail-closed-result.json`,
  `${packetDir}/readiness-report.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.md',
]

const requiredExistingFiles = [
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-enablement-plan/dispatch-enablement-plan.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/route-mock-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/worker-enqueue-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/worker-skeleton-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-mock-worker-interface/mock-worker-interface-contract.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-controlled-synthetic-media-command-qa/proof-evidence-acceptance.json',
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json',
  'src/backend/api/routes/gpac-mp4box-api-routes.ts',
  'src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts.ts',
  'src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts.ts',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/source-chain.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/execution-runner.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/evidence-manifest-policy.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/blocked-result.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/safety-boundary.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/validation-results.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-record.json',
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-results.md',
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/tool-lane-matrix.md',
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/next-action-plan.md',
  'docs/external-beta/tracka-tool-lane-ownership-realignment-1/tracka-tool-lane-ownership-realignment-record.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tracka-tool-lane-ownership-realignment-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-tool-readiness-after-gpac-dispatch-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-tool-execution-readiness-matrix-1-diagnostics.mjs',
  'package.json',
])

function fail(message) {
  console.error(`${lane} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
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

for (const file of [...packetFiles, ...requiredExistingFiles]) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const source = json(`${packetDir}/source-of-truth-audit.json`)
if (source.lane !== lane) fail('source lane drift')
if (source.decision !== decisionText) fail('source decision drift')
if (source.execution !== executionText) fail('source execution drift')
if (source.confirmationGate?.name !== gateName) fail('source gate name drift')
if (source.confirmationGate?.observed !== 'absent') fail('source gate observed drift')
if (source.productReadyEndToEndLocalOssTools !== 0) fail('source product-ready drift')
if (source.packageLock !== 'unchanged') fail('source package-lock drift')
if (source.generatedArtifactsCommitted !== 'none') fail('source artifact drift')

const contract = json(`${packetDir}/pinned-dispatch-contract.json`)
if (contract.confirmationGate?.required !== `${gateName}=true`) fail('contract confirmation gate drift')
if (contract.confirmationGate?.observed !== 'absent') fail('contract observed gate drift')
if (contract.route?.routeId !== 'render.gpacMp4box.serviceRolePackageMock') fail('route id drift')
if (contract.route?.path !== '/api/render/gpac-mp4box/package/mock') fail('route path drift')
if (contract.route?.status !== 'disabled') fail('route status drift')
if (contract.workerTarget?.skeletonId !== 'worker.gpacMp4box.packageValidation.mock') fail('worker skeleton drift')
if (contract.workerTarget?.workerKind !== 'render_export') fail('worker kind drift')
if (contract.approvedSnapshotFixture?.id !== 'approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1') fail('approved snapshot fixture drift')
if (contract.approvedSnapshotFixture?.inputFixture?.sha256 !== '8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea') fail('input checksum drift')
if (contract.approvedSnapshotFixture?.outputFixtureAcceptedByPriorQa?.sha256 !== 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8') fail('output checksum drift')
for (const commandId of ['mp4box_add_generated_subtitle_only_v1', 'mp4box_info_generated_subtitle_only_v1', 'mp4box_package_validation_metadata_v1']) {
  if (!contract.commandTemplateAllowlist?.includes(commandId)) fail(`missing command allowlist ${commandId}`)
}
for (const blocked of ['rawChat', 'rawCommandString', 'publicUrl', 'signedUrlAsSourceOfTruth', 'arbitraryPrivateMedia', 'ffmpegFfprobeExpansion', 'remotionExecution']) {
  if (!contract.blockedInputs?.includes(blocked)) fail(`missing blocked input ${blocked}`)
}
if (contract.rollbackAndResidueReadback?.cleanupStatusRequired !== 'cleanup_verified') fail('cleanup requirement drift')
if (contract.rollbackAndResidueReadback?.residueReadbackRequired !== true) fail('residue readback drift')
for (const [key, value] of Object.entries(contract.currentPhaseExecution ?? {})) {
  if (value !== 'not_run_confirmation_absent') fail(`current phase execution ${key} drift`)
}

const failClosed = json(`${packetDir}/fail-closed-result.json`)
if (failClosed.result !== decisionText) fail('fail-closed result drift')
if (failClosed.execution !== executionText) fail('fail-closed execution drift')
if (failClosed.blocker !== decisionText) fail('fail-closed blocker drift')
for (const [key, value] of Object.entries(failClosed.runtimeAuthorization ?? {})) {
  if (value !== false) fail(`runtime authorization ${key} enabled`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.readyForConfirmedExternalAgentDispatchRetry !== true) fail('confirmed retry readiness drift')
if (readiness.contractPinned !== true) fail('contract pinned drift')
if (readiness.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(readiness)) {
  if (key.endsWith('Now') && value !== false) fail(`${key} enabled`)
}

const oldScaffold = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json')
if (oldScaffold.decision !== decisionText) fail('prior scaffold decision drift')

const routeContract = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/route-mock-contract.json')
if (routeContract.routeId !== contract.route.routeId || routeContract.routePath !== contract.route.path) fail('route contract mismatch')
if (routeContract.status !== 'disabled') fail('source route not disabled')

const workerSkeleton = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/worker-skeleton-contract.json')
if (workerSkeleton.skeletonId !== contract.workerTarget.skeletonId) fail('worker skeleton source mismatch')
if (workerSkeleton.execution?.workerExecution !== false || workerSkeleton.execution?.gpacMp4boxExecution !== false) fail('worker source execution drift')

const corpus = packetFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')

for (const text of [
  lane,
  decisionText,
  executionText,
  `${gateName}=true`,
  'observed',
  'absent',
  'render.gpacMp4box.serviceRolePackageMock',
  '/api/render/gpac-mp4box/package/mock',
  'worker.gpacMp4box.packageValidation.mock',
  'approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1',
  'manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1',
  'cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1',
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  'mp4box_package_validation_metadata_v1',
  'rollback',
  'residue readback',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  nextPrompt,
]) {
  if (!corpus.includes(text)) fail(`missing required text ${text}`)
}

for (const pattern of [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /"productReadyEndToEndLocalOssTools"\s*:\s*[1-9]/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"storageTransfer"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"externalBetaUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalDeliveryExport"\s*:\s*true/i,
  /\bGPAC\/MP4Box execution in this phase:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\bworker execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
  /\broute execution:\s*`?(true|enabled|completed|passed|run|executed)\b/i,
]) {
  if (pattern.test(corpus)) fail(`forbidden claim ${pattern}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^public\/|^src\/|^server\/|\.dockerignore$|requirements/i.test(file)) fail(`forbidden changed path ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`generated or media artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log(`Execution: ${executionText}`)
console.log(`Next prompt: ${nextPrompt}`)
