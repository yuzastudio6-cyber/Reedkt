#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-REVIEW-2'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-handler-implementation-review-2'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-handler-implementation-scaffold-negative-tests'
const decisionText = 'tracka_gpac_mp4box_guarded_handler_implementation_review_2_passed_ready_for_guarded_executable_handler_implementation_plan'
const executionText = 'completed_docs_only_guarded_handler_implementation_review_2_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_handler_implementation_scaffold_negative_tests_passed_ready_for_guarded_handler_implementation_review'
const priorMergeSha = '9f938b1b03c4a7b0b2553edbfbc278387958be1b'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-PLAN-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-handler-implementation-review-2-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-handler-implementation-review-2-decision.md`,
  `${packetDir}/handler-implementation-review-2-matrix.json`,
  `${packetDir}/handler-implementation-review-2-matrix.md`,
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
  `${priorDir}/gpac-mp4box-handler-implementation-scaffold-negative-tests-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-1-results.md',
  'scripts/validation/tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-handler-implementation-review-2-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-executable-handler-implementation-plan-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-review-2-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-handler-implementation-review-2:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-review-2-diagnostics.mjs') fail('missing diagnostics script')

const decision = json(`${packetDir}/gpac-mp4box-guarded-handler-implementation-review-2-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.handlerImplementationScaffoldNegativeTests !== priorDecision) fail('prior decision drift')
if (decision.prior?.handlerImplementationScaffoldNegativeTestsMergeSha !== priorMergeSha) fail('prior merge drift')
if (decision.review?.allowedFutureScope !== 'guarded_executable_handler_implementation_plan_only') fail('future scope drift')
for (const value of Object.values(decision.safety ?? {})) {
  if (value !== false) fail('safety value enabled')
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedHandlerImplementationReview2Passed !== true) fail('review readiness drift')
if (readiness.readyForGuardedExecutableHandlerImplementationPlan !== true) fail('next readiness drift')
for (const key of ['readyForExecutableHandlerImplementation', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const matrix = json(`${packetDir}/handler-implementation-review-2-matrix.json`)
if (matrix.futureAllowedScope !== 'guarded_executable_handler_implementation_plan_only') fail('matrix scope drift')
for (const value of Object.values(matrix.blocked ?? {})) {
  if (value !== 'blocked') fail('blocked matrix drift')
}

const docsCorpus = requiredFiles.filter((file) => file.endsWith('.md') || file.endsWith('.json')).map((file) => read(file)).join('\n')
for (const text of [lane, decisionText, executionText, priorDecision, priorMergeSha, nextPrompt, 'guarded_executable_handler_implementation_plan_only', 'Product-ready local OSS tools: `0`', 'Package-lock: `unchanged`', 'Generated artifacts committed: `none`', 'PR #577 remains open/draft/blocked/conflicting and excluded']) {
  if (!docsCorpus.includes(text)) fail(`missing text ${text}`)
}
for (const pattern of [/Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i, /readyForExecutableHandlerImplementation"\s*:\s*true/i, /readyForRouteExecution"\s*:\s*true/i, /"routeExecution"\s*:\s*true/i, /"workerExecution"\s*:\s*true/i, /"gpacMp4boxExecution"\s*:\s*true/i, /"mediaProcessing"\s*:\s*true/i]) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim ${pattern}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file)) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file)) fail(`unexpected server path ${file}`)
  if (/package-lock\.json|^docker\/|^supabase\/|^database\/|^dist|^node_modules\/|\\.dockerignore$|requirements|\\.(mp4|mov|mkv|webm|srt|png|jpg|wav|mp3)$/i.test(file)) fail(`forbidden changed path ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log(`${lane} diagnostics passed`)
console.log(`Decision: ${decisionText}`)
console.log('Guarded handler implementation review remains docs-only')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
