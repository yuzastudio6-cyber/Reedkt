#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-SCAFFOLD-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-implementation-scaffold'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-handler-implementation-plan'
const decisionText = 'tracka_gpac_mp4box_disabled_handler_implementation_scaffold_passed_ready_for_handler_implementation_scaffold_negative_tests'
const executionText = 'completed_disabled_handler_implementation_scaffold_no_route_or_worker_execution'
const priorDecision = 'tracka_gpac_mp4box_guarded_handler_implementation_plan_passed_ready_for_disabled_handler_implementation_scaffold'
const priorMergeSha = '42925818a9ee2e2230cccd4276fe31d963bdfa5d'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-disabled-handler-implementation-scaffold-decision.json`,
  `${packetDir}/gpac-mp4box-disabled-handler-implementation-scaffold-decision.md`,
  `${packetDir}/handler-implementation-scaffold-contract.json`,
  `${packetDir}/handler-implementation-scaffold-contract.md`,
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

const sourceFiles = [
  'src/backend/contracts/gpac-mp4box-disabled-handler-implementation-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-smoke.ts',
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-handler-implementation-plan-1-results.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-plan-diagnostics.mjs',
]

const negativeTestsDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-handler-implementation-scaffold-negative-tests'
const negativeTestFiles = [
  `${negativeTestsDir}/gpac-mp4box-handler-implementation-scaffold-negative-tests-decision.json`,
  `${negativeTestsDir}/gpac-mp4box-handler-implementation-scaffold-negative-tests-decision.md`,
  `${negativeTestsDir}/readiness-report.json`,
  `${negativeTestsDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-handler-implementation-review-2.md',
  'server/smoke/tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-smoke.ts',
  'scripts/validation/tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...sourceFiles,
  ...priorFiles,
  ...negativeTestFiles,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-implementation-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-disabled-handler-implementation-scaffold:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-diagnostics.mjs') fail('missing diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-disabled-handler-implementation-scaffold'] !== 'tsx server/smoke/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-smoke.ts') fail('missing smoke script')

const decision = json(`${packetDir}/gpac-mp4box-disabled-handler-implementation-scaffold-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.guardedHandlerImplementationPlan !== priorDecision) fail('prior decision drift')
if (decision.prior?.guardedHandlerImplementationPlanMergeSha !== priorMergeSha) fail('prior merge drift')
if (decision.scaffold?.scaffoldId !== 'handlerImplementationScaffold.gpacMp4box.disabled') fail('scaffold id drift')
if (decision.scaffold?.routeId !== 'render.gpacMp4box.disabledHandlerImplementationScaffold') fail('route id drift')
if (decision.scaffold?.handlerImplementationMode !== 'disabled_handler_implementation_scaffold_only') fail('mode drift')
if (decision.scaffold?.scaffoldStatus !== 'disabled_handler_implementation_scaffold_registered_no_executable_handler') fail('status drift')
for (const value of Object.values(decision.safety ?? {})) {
  if (value !== false) fail('safety value enabled')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.disabledHandlerImplementationScaffoldValidated !== true) fail('scaffold readiness drift')
if (readiness.readyForHandlerImplementationScaffoldNegativeTests !== true) fail('next readiness drift')
for (const key of ['readyForExecutableHandlerImplementation', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')

const contractJson = json(`${packetDir}/handler-implementation-scaffold-contract.json`)
if (contractJson.contractId !== 'handlerImplementationScaffold.gpacMp4box.disabled') fail('contract id drift')
if (contractJson.status !== 'disabled_handler_implementation_scaffold_registered_no_executable_handler') fail('contract status drift')
for (const value of Object.values(contractJson.blocked ?? {})) {
  if (value !== 'blocked') fail('blocked matrix drift')
}

const docsCorpus = requiredFiles.filter((file) => file.endsWith('.md') || file.endsWith('.json')).map((file) => read(file)).join('\n')
for (const text of [lane, decisionText, executionText, priorDecision, priorMergeSha, nextPrompt, 'handlerImplementationScaffold.gpacMp4box.disabled', 'render.gpacMp4box.disabledHandlerImplementationScaffold', 'disabled_handler_implementation_scaffold_only', 'Product-ready local OSS tools: `0`', 'Package-lock: `unchanged`', 'Generated artifacts committed: `none`', 'PR #577 remains open/draft/blocked/conflicting and excluded']) {
  if (!docsCorpus.includes(text)) fail(`missing text ${text}`)
}
for (const pattern of [/Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i, /readyForExecutableHandlerImplementation"\s*:\s*true/i, /readyForRouteExecution"\s*:\s*true/i, /"routeExecution"\s*:\s*true/i, /"workerExecution"\s*:\s*true/i, /"gpacMp4boxExecution"\s*:\s*true/i]) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim ${pattern}`)
}

const contractText = read('src/backend/contracts/gpac-mp4box-disabled-handler-implementation-scaffold-contracts.ts')
for (const text of ['handlerImplementationScaffold.gpacMp4box.disabled', 'render.gpacMp4box.disabledHandlerImplementationScaffold', 'disabled_handler_implementation_scaffold_only', nextPrompt]) {
  if (!contractText.includes(text)) fail(`contract missing ${text}`)
}
const smokeText = read('server/smoke/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-smoke.ts')
for (const text of ['disabled_handler_implementation_scaffold_validates', 'guarded_handler_implementation_plan_drift_blocks', 'executable_handler_implementation_blocks', 'route_execution_blocks', 'no_route_worker_tool_storage_media_or_unlock_enabled']) {
  if (!smokeText.includes(text)) fail(`smoke missing ${text}`)
}
for (const pattern of [/from ['"]node:child_process['"]/, /execFileSync\(/, /spawn\(/, /fetch\(/, /createClient\(/, /docker\s+(build|run|push)/i, /MP4Box\s+-/, /gpac\s+-/]) {
  if (pattern.test(smokeText)) fail(`forbidden executable pattern ${pattern} in smoke`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && !sourceFiles.includes(file)) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file) && !sourceFiles.includes(file) && !negativeTestFiles.includes(file)) fail(`unexpected server path ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^public\/|^dist|^node_modules\/|\\.dockerignore$|requirements|\\.(mp4|mov|mkv|webm|srt|png|jpg|wav|mp3)$/i.test(file)) fail(`forbidden changed path ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log('Disabled handler-implementation scaffold validates with no executable handler')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
