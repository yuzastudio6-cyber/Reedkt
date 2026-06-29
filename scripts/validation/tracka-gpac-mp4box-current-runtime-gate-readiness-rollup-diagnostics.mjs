#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-CURRENT-RUNTIME-GATE-READINESS-ROLLUP-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-current-runtime-gate-readiness-rollup'
const decisionText = 'tracka_gpac_mp4box_current_runtime_gate_readiness_rollup_passed_ready_for_guarded_runtime_dispatch_enablement_plan'
const executionText = 'completed_docs_only_current_runtime_gate_readiness_rollup_no_runtime_execution'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ENABLEMENT-PLAN-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.json`,
  `${packetDir}/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.md`,
  `${packetDir}/source-chain-rollup.json`,
  `${packetDir}/source-chain-rollup.md`,
  `${packetDir}/current-runtime-gate-matrix.json`,
  `${packetDir}/current-runtime-gate-matrix.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-boundary.json`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const sourceFiles = [
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan/gpac-mp4box-guarded-runtime-enablement-plan-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-runtime-scaffold/gpac-mp4box-disabled-runtime-scaffold-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-runtime-scaffold-negative-tests/gpac-mp4box-runtime-scaffold-negative-tests-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation-decision.json',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...sourceFiles,
  'docs/activation-phase-tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-1.md',
  'scripts/validation/tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-1r-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set(requiredFiles)

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

for (const file of requiredFiles) read(file)
for (const file of packetFiles.filter((file) => file.endsWith('.json'))) json(file)

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-current-runtime-gate-readiness-rollup:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const decision = json(`${packetDir}/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.currentRuntimeGate?.sourceChainReconciled !== true) fail('source chain reconciliation drift')
if (decision.currentRuntimeGate?.duplicateRuntimeGateCreated !== false) fail('duplicate gate drift')
if (decision.readiness?.nextNonDuplicateGate !== nextPrompt) fail('next non-duplicate gate drift')
if (decision.readiness?.readyForGuardedRuntimeDispatchEnablementPlan !== true) fail('dispatch plan readiness drift')
if (decision.sourceTruth?.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.sourceTruth?.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.sourceTruth?.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} enabled`)
}

const sourceChain = json(`${packetDir}/source-chain-rollup.json`)
const evidenceLanes = new Set((sourceChain.requiredEvidence ?? []).map((entry) => entry.lane))
for (const required of [
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1',
  'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1',
  'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-SERVICE-ROLE-ROUTE-MOCK-IMPLEMENTATION-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-SKELETON-MOCK-IMPLEMENTATION-1',
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-RUNTIME-ENABLEMENT-REVIEW-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1R',
]) {
  if (!evidenceLanes.has(required)) fail(`missing source evidence ${required}`)
}
if (sourceChain.duplicateScan?.duplicateOriginalGuardedRuntimeEnablementPlan !== 'do_not_recreate') fail('duplicate original plan policy drift')
if (sourceChain.nextPrompt !== nextPrompt) fail('source-chain next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.readyForGuardedRuntimeDispatchEnablementPlan !== true) fail('readiness next gate drift')
for (const key of [
  'readyForRouteExecution',
  'readyForWorkerDispatch',
  'readyForWorkerExecution',
  'readyForGpacMp4boxExecution',
  'readyForMediaProcessing',
  'readyForStorageTransfer',
  'readyForSignedUrlCreation',
  'readyForPublicArtifactCreation',
  'readyForProductRuntime',
  'readyForExternalBetaProductUse',
  'readyForPaidProduction',
  'readyForProduction',
  'readyForFinalDeliveryExport',
]) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')
if (readiness.packageLock !== 'unchanged') fail('readiness package-lock drift')
if (readiness.generatedArtifactsCommitted !== 'none') fail('readiness artifact drift')

const sourceDecisionExpectations = new Map([
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan/gpac-mp4box-guarded-runtime-enablement-plan-decision.json', 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-disabled-runtime-scaffold/gpac-mp4box-disabled-runtime-scaffold-decision.json', 'tracka_gpac_mp4box_disabled_runtime_scaffold_passed_ready_for_runtime_scaffold_negative_tests'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-runtime-scaffold-negative-tests/gpac-mp4box-runtime-scaffold-negative-tests-decision.json', 'tracka_gpac_mp4box_runtime_scaffold_negative_tests_passed_ready_for_guarded_live_registration_review'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_service_role_route_mock_implementation_passed_ready_for_guarded_worker_enqueue_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_worker_enqueue_mock_implementation_passed_ready_for_guarded_worker_skeleton_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_worker_skeleton_mock_implementation_passed_ready_for_private_artifact_policy_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json', 'tracka_gpac_mp4box_private_artifact_final_runtime_readiness_review_passed_ready_for_guarded_runtime_enablement_plan'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json', 'tracka_gpac_mp4box_guarded_executable_handler_runtime_enablement_review_passed_ready_for_guarded_runtime_enablement_plan'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation-decision.json', 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_1r_reconciled_post_executable_handler_runtime_review_ready_for_current_runtime_gate_readiness_rollup'],
])
for (const [file, expected] of sourceDecisionExpectations.entries()) {
  if (json(file).decision !== expected) fail(`source decision drift ${file}`)
}

const docsCorpus = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')

for (const text of [
  lane,
  decisionText,
  executionText,
  nextPrompt,
  'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a',
  '9f3d7afc8eb33d93bae0c8728e2666ffbcccceeb',
  '44245f61b9ff915554b6845c97f4b87cd434a177',
  '4ead5a5fd0ada73fc7b5fbf77fd21edfec233375',
  '8ae73e136268e30e29c49f34dcbdc49370f0f0c4',
  '3af25963decb83de23ef45632a6d0ab69a27664a',
  'f9994564af1e08b82f2d5e8393a0272de0b10b6d',
  '719b8690358d199e723db7fca1dc137b84ca2237',
  '882a8dfbaf7acc189543d7ff14a3aa1ebf98b440',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/excluded',
]) {
  if (!docsCorpus.includes(text)) fail(`missing required text ${text}`)
}

for (const pattern of [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /"productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /"readyForRouteExecution"\s*:\s*true/i,
  /"readyForWorkerDispatch"\s*:\s*true/i,
  /"readyForWorkerExecution"\s*:\s*true/i,
  /"readyForGpacMp4boxExecution"\s*:\s*true/i,
  /"runtimeExecutionAuthorized"\s*:\s*true/i,
  /"routeExecutionAuthorized"\s*:\s*true/i,
  /"workerDispatchAuthorized"\s*:\s*true/i,
  /"workerExecutionAuthorized"\s*:\s*true/i,
  /"gpacMp4boxExecutionAuthorized"\s*:\s*true/i,
  /"storageTransferAuthorized"\s*:\s*true/i,
  /"signedUrlCreationAuthorized"\s*:\s*true/i,
  /"publicArtifactCreationAuthorized"\s*:\s*true/i,
  /"externalBetaAuthorized"\s*:\s*true/i,
  /"productionAuthorized"\s*:\s*true/i,
  /"finalDeliveryExportAuthorized"\s*:\s*true/i,
]) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim ${pattern}`)
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
console.log(`Next prompt: ${nextPrompt}`)
console.log('Route/worker/tool/runtime execution remains blocked')
console.log('Product-ready local OSS tools: 0')
