#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ENABLEMENT-PLAN-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-enablement-plan'
const decisionText = 'tracka_gpac_mp4box_guarded_runtime_dispatch_enablement_plan_passed_ready_for_guarded_runtime_dispatch_scaffold'
const executionText = 'completed_docs_only_guarded_runtime_dispatch_enablement_plan_no_runtime_execution'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-SCAFFOLD-1'
const confirmationGate = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-runtime-dispatch-enablement-plan-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-runtime-dispatch-enablement-plan-decision.md`,
  `${packetDir}/dispatch-enablement-plan.json`,
  `${packetDir}/dispatch-enablement-plan.md`,
  `${packetDir}/negative-test-matrix.json`,
  `${packetDir}/negative-test-matrix.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-boundary.json`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/validation-results.md`,
]

const dispatchScaffoldDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold'
const dispatchScaffoldFiles = [
  `${dispatchScaffoldDir}/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.json`,
  `${dispatchScaffoldDir}/gpac-mp4box-guarded-runtime-dispatch-scaffold-decision.md`,
  `${dispatchScaffoldDir}/fail-closed-scaffold.json`,
  `${dispatchScaffoldDir}/fail-closed-scaffold.md`,
  `${dispatchScaffoldDir}/source-of-truth-audit.json`,
  `${dispatchScaffoldDir}/readiness-report.json`,
  `${dispatchScaffoldDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const sourceFiles = [
  'docs/track-a/native-container-render-tools/gpac-mp4box-current-runtime-gate-readiness-rollup/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json',
]

const requiredFiles = [
  ...packetFiles,
  ...dispatchScaffoldFiles,
  ...statusFiles,
  ...sourceFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-1-results.md',
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1.md',
  'scripts/validation/tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-scaffold-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-dispatch-enablement-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const decision = json(`${packetDir}/gpac-mp4box-guarded-runtime-dispatch-enablement-plan-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.confirmationGate?.name !== 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH') fail('confirmation gate name drift')
if (decision.confirmationGate?.thisPhaseRuntimeDispatch !== false) fail('this-phase runtime dispatch drift')
if (decision.planReadiness?.nextScaffoldPrompt !== nextPrompt) fail('next scaffold drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')
for (const [key, value] of Object.entries(decision.runtimeAuthorization ?? {})) {
  if (value !== false) fail(`runtime authorization ${key} enabled`)
}

const plan = json(`${packetDir}/dispatch-enablement-plan.json`)
if (plan.dispatchPlan?.futureConfirmationGate !== confirmationGate) fail('dispatch plan confirmation gate drift')
if (plan.dispatchPlan?.approvedSnapshot?.required !== true) fail('approved snapshot requirement drift')
if (plan.dispatchPlan?.approvedSnapshot?.rawChatExecutionAllowed !== false) fail('raw chat policy drift')
if (plan.dispatchPlan?.privateArtifactManifest?.publicArtifactsAllowed !== false) fail('public artifact policy drift')
if (plan.dispatchPlan?.serviceRoleRouteBoundary?.broadServiceRoleHandlerAllowed !== false) fail('broad handler policy drift')
if (plan.dispatchPlan?.workerDispatch?.workerExecutionThisPhase !== false) fail('worker execution phase drift')
if (plan.dispatchPlan?.commandAllowlist?.arbitraryArgumentsAllowed !== false) fail('command allowlist drift')

const negative = json(`${packetDir}/negative-test-matrix.json`)
for (const required of [
  'blocked_raw_chat_execution_attempt',
  'blocked_missing_approved_snapshot',
  'blocked_unapproved_media_source',
  'blocked_public_or_signed_artifact_attempt',
  'blocked_missing_private_artifact_manifest',
  'blocked_missing_cleanup_policy',
  'blocked_route_bypass_attempt',
  'blocked_worker_bypass_attempt',
  'blocked_command_allowlist_drift',
  'blocked_ffmpeg_ffprobe_expansion',
  'blocked_product_unlock_drift',
  'blocked_missing_confirmation_gate',
]) {
  if (!negative.negativeTestsRequiredForFutureScaffold?.includes(required)) fail(`missing negative test ${required}`)
}

const sourceDecisionExpectations = new Map([
  ['docs/track-a/native-container-render-tools/gpac-mp4box-current-runtime-gate-readiness-rollup/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.json', 'tracka_gpac_mp4box_current_runtime_gate_readiness_rollup_passed_ready_for_guarded_runtime_dispatch_enablement_plan'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-service-role-route-mock-implementation/gpac-mp4box-guarded-service-role-route-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_service_role_route_mock_implementation_passed_ready_for_guarded_worker_enqueue_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-enqueue-mock-implementation/gpac-mp4box-guarded-worker-enqueue-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_worker_enqueue_mock_implementation_passed_ready_for_guarded_worker_skeleton_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-worker-skeleton-mock-implementation/gpac-mp4box-guarded-worker-skeleton-mock-implementation-decision.json', 'tracka_gpac_mp4box_guarded_worker_skeleton_mock_implementation_passed_ready_for_private_artifact_policy_mock'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json', 'tracka_gpac_mp4box_private_artifact_final_runtime_readiness_review_passed_ready_for_guarded_runtime_enablement_plan'],
  ['docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json', 'tracka_gpac_mp4box_guarded_executable_handler_runtime_enablement_review_passed_ready_for_guarded_runtime_enablement_plan'],
])
for (const [file, expected] of sourceDecisionExpectations.entries()) {
  if (json(file).decision !== expected) fail(`source decision drift ${file}`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.readyForGuardedRuntimeDispatchScaffold !== true) fail('scaffold readiness drift')
for (const key of [
  'readyForRouteExecution',
  'readyForWorkerDispatch',
  'readyForWorkerExecution',
  'readyForGpacMp4boxExecution',
  'readyForMediaProcessing',
  'readyForStorageTransfer',
  'readyForSignedUrlCreation',
  'readyForPublicArtifactCreation',
  'readyForExternalBetaProductUse',
  'readyForProduction',
  'readyForFinalDeliveryExport',
]) {
  if (readiness[key] !== false) fail(`${key} drift`)
}

const docsCorpus = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')
for (const text of [
  lane,
  decisionText,
  executionText,
  confirmationGate,
  nextPrompt,
  'tracka_gpac_mp4box_current_runtime_gate_readiness_rollup_passed_ready_for_guarded_runtime_dispatch_enablement_plan',
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
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"routeExecutionAuthorized"\s*:\s*true/i,
  /"workerDispatchAuthorized"\s*:\s*true/i,
  /"workerExecutionAuthorized"\s*:\s*true/i,
  /"gpacMp4boxExecutionAuthorized"\s*:\s*true/i,
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
console.log(`Future confirmation gate: ${confirmationGate}`)
console.log(`Next prompt: ${nextPrompt}`)
console.log('Route/worker/tool/runtime execution remains blocked')
