#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-PLAN-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-implementation-plan'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-handler-implementation-review-2'
const decisionText = 'tracka_gpac_mp4box_guarded_executable_handler_implementation_plan_passed_ready_for_guarded_executable_handler_implementation_scaffold'
const executionText = 'completed_docs_only_guarded_executable_handler_implementation_plan_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_guarded_handler_implementation_review_2_passed_ready_for_guarded_executable_handler_implementation_plan'
const priorMergeSha = '7112409bd57ee533dbb61b7f9f2386fc31d81aff'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-SCAFFOLD-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-plan-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-plan-decision.md`,
  `${packetDir}/handler-executable-implementation-plan.json`,
  `${packetDir}/handler-executable-implementation-plan.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-guarded-handler-implementation-review-2-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-handler-implementation-review-2-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-executable-handler-implementation-plan-1.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-review-2-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-executable-handler-implementation-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-implementation-plan-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredGuards = [
  'backend_service_role_owner_required',
  'disabled_by_default_handler_implementation_required',
  'feature_flag_default_false_required',
  'approved_snapshot_guard_required',
  'route_idempotency_guard_required',
  'private_artifact_manifest_guard_required',
  'command_allowlist_guard_required',
  'negative_tests_must_remain_passing',
  'cleanup_audit_reference_required',
  'storage_public_artifact_gates_required',
  'operator_confirmation_required_before_any_execution',
]

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
    fail(`invalid JSON ${file}: ${error.message}`)
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

const packageJson = json('package.json')
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-executable-handler-implementation-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-implementation-plan-diagnostics.mjs') fail('missing diagnostics script')

const decision = json(`${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-plan-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.guardedHandlerImplementationReview2 !== priorDecision) fail('prior decision drift')
if (decision.prior?.guardedHandlerImplementationReview2MergeSha !== priorMergeSha) fail('prior merge drift')
if (decision.implementationPlan?.allowedFutureScope !== 'guarded_executable_handler_implementation_scaffold_only') fail('future scope drift')
if (decision.implementationPlan?.nextAllowedImplementation !== nextPrompt) fail('next implementation drift')
for (const guard of requiredGuards) {
  if (!decision.requiredFutureGuards?.includes(guard)) fail(`missing guard ${guard}`)
}
for (const value of Object.values(decision.safety ?? {})) {
  if (value !== false) fail('safety value enabled')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedExecutableHandlerImplementationPlanPassed !== true) fail('plan readiness drift')
if (readiness.readyForGuardedExecutableHandlerImplementationScaffold !== true) fail('scaffold readiness drift')
for (const key of ['readyForExecutableHandlerImplementationThisPhase', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const plan = json(`${packetDir}/handler-executable-implementation-plan.json`)
if (plan.allowedFutureScope !== 'guarded_executable_handler_implementation_scaffold_only') fail('plan scope drift')
if (plan.nextAllowedImplementation !== nextPrompt) fail('plan next prompt drift')
for (const value of Object.values(plan.blocked ?? {})) {
  if (value !== 'blocked') fail('blocked matrix drift')
}

const docsCorpus = requiredFiles.filter((file) => file.endsWith('.md') || file.endsWith('.json')).map((file) => read(file)).join('\n')
for (const text of [lane, decisionText, executionText, priorDecision, priorMergeSha, nextPrompt, 'guarded_executable_handler_implementation_scaffold_only', 'ready_for_guarded_executable_handler_implementation_scaffold_only', 'Product-ready local OSS tools: `0`', 'Package-lock: `unchanged`', 'Generated artifacts committed: `none`', 'PR #577 remains open/draft/blocked/conflicting and excluded', ...requiredGuards]) {
  if (!docsCorpus.includes(text)) fail(`missing text ${text}`)
}
for (const pattern of [/Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i, /"productReadyLocalOssTools"\s*:\s*[1-9]/i, /"readyForRouteExecution"\s*:\s*true/i, /"readyForWorkerExecution"\s*:\s*true/i, /"readyForGpacMp4boxExecution"\s*:\s*true/i, /"routeExecution"\s*:\s*true/i, /"workerExecution"\s*:\s*true/i, /"gpacMp4boxExecution"\s*:\s*true/i, /"mediaProcessing"\s*:\s*true/i]) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim ${pattern}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file)) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file)) fail(`unexpected server path ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^dist|^node_modules\/|\.dockerignore$|requirements|\.(mp4|mov|mkv|webm|srt|png|jpg|wav|mp3)$/i.test(file)) fail(`forbidden changed path ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log('Guarded executable handler implementation plan remains docs-only')
console.log('Executable handler implementation, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
