#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-implementation-scaffold'
const decisionText = 'tracka_gpac_mp4box_guarded_executable_handler_implementation_scaffold_negative_tests_passed_ready_for_guarded_executable_handler_runtime_enablement_review'
const executionText = 'completed_guarded_executable_handler_scaffold_negative_tests_no_route_worker_or_tool_execution'
const priorDecision = 'tracka_gpac_mp4box_guarded_executable_handler_implementation_scaffold_passed_ready_for_guarded_executable_handler_implementation_scaffold_negative_tests'
const priorMergeSha = '6b1cd42f3a094464307058b322dbb7d634336881'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-RUNTIME-ENABLEMENT-REVIEW-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-decision.md`,
  `${packetDir}/negative-test-matrix.json`,
  `${packetDir}/negative-test-matrix.md`,
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
  `${priorDir}/gpac-mp4box-guarded-executable-handler-implementation-scaffold-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-1.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-diagnostics.mjs',
]

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-guarded-executable-handler-implementation-scaffold-contracts.ts',
  'server/smoke/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-smoke.ts',
  'server/smoke/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-smoke.ts',
]

const followOnRuntimeReviewDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review'
const followOnRuntimeReviewFiles = [
  `${followOnRuntimeReviewDir}/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json`,
  `${followOnRuntimeReviewDir}/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.md`,
  `${followOnRuntimeReviewDir}/runtime-enablement-boundary.json`,
  `${followOnRuntimeReviewDir}/runtime-enablement-boundary.md`,
  `${followOnRuntimeReviewDir}/readiness-report.json`,
  `${followOnRuntimeReviewDir}/source-of-truth-audit.json`,
  `${followOnRuntimeReviewDir}/source-of-truth-audit.md`,
  `${followOnRuntimeReviewDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-executable-handler-runtime-enablement-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-runtime-enablement-review-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  ...sourceFiles,
  ...followOnRuntimeReviewFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-executable-handler-runtime-enablement-review-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-diagnostics.mjs') fail('missing diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests'] !== 'tsx server/smoke/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-smoke.ts') fail('missing smoke script')

const decision = json(`${packetDir}/gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.guardedExecutableHandlerImplementationScaffold !== priorDecision) fail('prior decision drift')
if (decision.prior?.guardedExecutableHandlerImplementationScaffoldMergeSha !== priorMergeSha) fail('prior merge drift')
for (const value of Object.values(decision.negativeTests ?? {})) {
  if (value !== true && value !== 'passed') fail('negative-test matrix drift')
}
for (const value of Object.values(decision.safety ?? {})) {
  if (value !== false) fail('safety value enabled')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedExecutableHandlerImplementationScaffoldNegativeTestsPassed !== true) fail('negative-test readiness drift')
if (readiness.readyForGuardedExecutableHandlerRuntimeEnablementReview !== true) fail('runtime review readiness drift')
for (const key of ['readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const smoke = read('server/smoke/tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests-smoke.ts')
for (const text of [
  'plan_drift_blocks',
  'missing_backend_service_role_context_blocks',
  'route_registration_blocks',
  'route_execution_blocks',
  'worker_dispatch_blocks',
  'worker_execution_blocks',
  'feature_flag_enablement_blocks',
  'gpac_mp4box_execution_blocks',
  'media_processing_blocks',
  'storage_transfer_blocks',
  'signed_url_creation_blocks',
  'public_artifact_creation_blocks',
  'supabase_mutation_blocks',
  'sql_execution_blocks',
  'raw_command_rejected_input_blocks',
  'external_beta_expansion_blocks',
  'paid_production_unlock_blocks',
  'production_unlock_blocks',
  'final_delivery_export_blocks',
]) {
  if (!smoke.includes(text)) fail(`smoke missing ${text}`)
}
for (const pattern of [/execFileSync|spawn|fetch\(|createClient|mkvmerge|ffmpeg|ffprobe|docker/i]) {
  if (pattern.test(smoke)) fail(`forbidden smoke content ${pattern}`)
}

const docsCorpus = requiredFiles.filter((file) => file.endsWith('.md') || file.endsWith('.json')).map((file) => read(file)).join('\n')
for (const text of [lane, decisionText, executionText, priorDecision, priorMergeSha, nextPrompt, 'Product-ready local OSS tools: `0`', 'Package-lock: `unchanged`', 'Generated artifacts committed: `none`', 'PR #577 remains open/draft/blocked/conflicting and excluded']) {
  if (!docsCorpus.includes(text)) fail(`missing text ${text}`)
}
for (const pattern of [/Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i, /"productReadyLocalOssTools"\s*:\s*[1-9]/i, /"readyForRouteExecution"\s*:\s*true/i, /"readyForWorkerExecution"\s*:\s*true/i, /"readyForGpacMp4boxExecution"\s*:\s*true/i, /"routeExecution"\s*:\s*true/i, /"workerExecution"\s*:\s*true/i, /"gpacMp4boxExecution"\s*:\s*true/i, /"mediaProcessing"\s*:\s*true/i]) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim ${pattern}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^dist|^node_modules\/|\.dockerignore$|requirements|\.(mp4|mov|mkv|webm|srt|png|jpg|wav|mp3)$/i.test(file)) fail(`forbidden changed path ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log('Guarded executable handler implementation scaffold negative tests passed')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
