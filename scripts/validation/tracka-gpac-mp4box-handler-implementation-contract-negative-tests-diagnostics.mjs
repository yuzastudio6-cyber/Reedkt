#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-HANDLER-IMPLEMENTATION-CONTRACT-NEGATIVE-TESTS-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-handler-implementation-contract-negative-tests'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-implementation-contract'
const decisionText = 'tracka_gpac_mp4box_handler_implementation_contract_negative_tests_passed_ready_for_guarded_handler_implementation_plan'
const executionText = 'completed_handler_implementation_contract_negative_tests_no_route_or_worker_execution'
const priorDecision = 'tracka_gpac_mp4box_disabled_handler_implementation_contract_passed_ready_for_handler_implementation_contract_negative_tests'
const priorMergeSha = '02e692d9729dac0654db1c83fc02a648c102cda5'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-PLAN-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-handler-implementation-contract-negative-tests-decision.json`,
  `${packetDir}/gpac-mp4box-handler-implementation-contract-negative-tests-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/validation-results.md`,
]

const planDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-handler-implementation-plan'
const planFiles = [
  `${planDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.json`,
  `${planDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.md`,
  `${planDir}/handler-implementation-guard-matrix.json`,
  `${planDir}/handler-implementation-guard-matrix.md`,
  `${planDir}/readiness-report.json`,
  `${planDir}/source-of-truth-audit.json`,
  `${planDir}/source-of-truth-audit.md`,
  `${planDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-handler-implementation-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-implementation-scaffold-1.md',
  'scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-plan-diagnostics.mjs',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-disabled-handler-implementation-contract-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-implementation-contract-1-results.md',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-implementation-contract-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...planFiles,
  ...statusFiles,
  ...priorFiles,
  'docs/activation-phase-tracka-gpac-mp4box-handler-implementation-contract-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-handler-implementation-plan-1.md',
  'server/smoke/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-smoke.ts',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-handler-implementation-contract-negative-tests:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-diagnostics.mjs') fail('missing diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-handler-implementation-contract-negative-tests'] !== 'tsx server/smoke/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-smoke.ts') fail('missing smoke script')

const decision = json(`${packetDir}/gpac-mp4box-handler-implementation-contract-negative-tests-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.disabledHandlerImplementationContract !== priorDecision) fail('prior decision drift')
if (decision.prior?.disabledHandlerImplementationContractMergeSha !== priorMergeSha) fail('prior merge drift')
for (const value of Object.values(decision.safety ?? {})) {
  if (value !== false) fail('safety value enabled')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.negativeTestsPassed !== true) fail('negative tests readiness drift')
if (readiness.readyForGuardedHandlerImplementationPlan !== true) fail('next readiness drift')
for (const key of ['readyForExecutableHandlerRegistration', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const docsCorpus = requiredFiles.filter((file) => file.endsWith('.md') || file.endsWith('.json')).map((file) => read(file)).join('\n')
for (const text of [lane, decisionText, executionText, priorDecision, priorMergeSha, nextPrompt, 'Product-ready local OSS tools: `0`', 'Package-lock: `unchanged`', 'Generated artifacts committed: `none`', 'PR #577 remains open/draft/blocked/conflicting and excluded']) {
  if (!docsCorpus.includes(text)) fail(`missing text ${text}`)
}
for (const pattern of [/Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i, /readyForExecutableHandlerRegistration"\s*:\s*true/i, /readyForRouteExecution"\s*:\s*true/i, /"routeExecution"\s*:\s*true/i, /"workerExecution"\s*:\s*true/i, /"gpacMp4boxExecution"\s*:\s*true/i, /"mediaProcessing"\s*:\s*true/i]) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim ${pattern}`)
}

const smokeText = read('server/smoke/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-smoke.ts')
for (const text of ['all_rejected_input_cases_block', 'all_runtime_attempt_cases_block', 'all_delivery_attempt_cases_block', 'guarded_handler_implementation_review_drift_blocks', 'handler_implementation_enablement_blocks', 'operator_confirmation_drift_blocks']) {
  if (!smokeText.includes(text)) fail(`smoke missing ${text}`)
}
for (const pattern of [/from ['"]node:child_process['"]/, /execFileSync\(/, /spawn\(/, /fetch\(/, /createClient\(/, /docker\s+(build|run|push)/i, /MP4Box\s+-/, /gpac\s+-/]) {
  if (pattern.test(smokeText)) fail(`forbidden executable pattern ${pattern} in smoke`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^src\/|^dist|^node_modules\/|\\.dockerignore$|requirements|\\.(mp4|mov|mkv|webm|srt|png|jpg|wav|mp3)$/i.test(file)) fail(`forbidden changed path ${file}`)
  if (/^server\//.test(file) && file !== 'server/smoke/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-smoke.ts') fail(`unexpected server path ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log('Disabled handler implementation contract negative tests passed')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
