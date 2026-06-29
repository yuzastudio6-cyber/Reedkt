#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1R'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation'
const decisionText = 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_1r_reconciled_post_executable_handler_runtime_review_ready_for_current_runtime_gate_readiness_rollup'
const executionText = 'completed_docs_only_guarded_runtime_enablement_plan_reconciliation_no_runtime_execution'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-CURRENT-RUNTIME-GATE-READINESS-ROLLUP-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-boundary.json`,
  `${packetDir}/runtime-boundary.md`,
  `${packetDir}/source-chain-reconciliation.json`,
  `${packetDir}/source-chain-reconciliation.md`,
  `${packetDir}/validation-results.md`,
]

const currentRuntimeGateRollupDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-current-runtime-gate-readiness-rollup'
const currentRuntimeGateRollupFiles = [
  `${currentRuntimeGateRollupDir}/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.json`,
  `${currentRuntimeGateRollupDir}/gpac-mp4box-current-runtime-gate-readiness-rollup-decision.md`,
  `${currentRuntimeGateRollupDir}/source-chain-rollup.json`,
  `${currentRuntimeGateRollupDir}/source-chain-rollup.md`,
  `${currentRuntimeGateRollupDir}/current-runtime-gate-matrix.json`,
  `${currentRuntimeGateRollupDir}/current-runtime-gate-matrix.md`,
  `${currentRuntimeGateRollupDir}/readiness-report.json`,
  `${currentRuntimeGateRollupDir}/runtime-boundary.json`,
  `${currentRuntimeGateRollupDir}/runtime-boundary.md`,
  `${currentRuntimeGateRollupDir}/validation-results.md`,
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...currentRuntimeGateRollupFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1r-results.md',
  'docs/activation-phase-tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-dispatch-enablement-plan-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1.md',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan/gpac-mp4box-guarded-runtime-enablement-plan-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-runtime-scaffold/gpac-mp4box-disabled-runtime-scaffold-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-runtime-scaffold-negative-tests/gpac-mp4box-runtime-scaffold-negative-tests-decision.json',
  'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-1r-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-current-runtime-gate-readiness-rollup-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-executable-handler-runtime-enablement-review-diagnostics.mjs',
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-enablement-plan-1r:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-1r-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const decision = json(`${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-1r-reconciliation-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.reconciliation?.status !== 'post_1658_source_chain_reconciled') fail('reconciliation status drift')
if (decision.reconciliation?.originalPlanRemainsSourceOfTruth !== true) fail('original plan source drift')
if (decision.reconciliation?.newExecutableHandlerReviewAddedAsRequiredSourceEvidence !== true) fail('executable review source drift')
if (decision.reconciliation?.duplicateRuntimeEnablementPlanCreated !== false) fail('duplicate plan drift')
if (decision.reconciliation?.runtimeExecutionAuthorized !== false) fail('runtime authorization drift')
if (decision.productReadyLocalOssTools !== 0) fail('product-ready drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifacts drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} enabled`)
}

const sourceChain = json(`${packetDir}/source-chain-reconciliation.json`)
for (const required of [
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1',
  'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1',
  'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-IMPLEMENTATION-SCAFFOLD-NEGATIVE-TESTS-1',
  'TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-RUNTIME-ENABLEMENT-REVIEW-1',
]) {
  if (!sourceChain.requiredEvidence?.includes(required)) fail(`missing source evidence ${required}`)
}
if (sourceChain.duplicatePlanPolicy !== 'do_not_recreate_tracka_gpac_mp4box_guarded_runtime_enablement_plan_1') fail('duplicate policy drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.sourceChainReconciled !== true) fail('readiness reconciliation drift')
if (readiness.readyForCurrentRuntimeGateReadinessRollup !== true) fail('rollup readiness drift')
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

const priorPlan = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan/gpac-mp4box-guarded-runtime-enablement-plan-decision.json')
if (priorPlan.decision !== 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold') fail('prior plan drift')
const executableReview = json('docs/track-a/native-container-render-tools/gpac-mp4box-guarded-executable-handler-runtime-enablement-review/gpac-mp4box-guarded-executable-handler-runtime-enablement-review-decision.json')
if (executableReview.decision !== 'tracka_gpac_mp4box_guarded_executable_handler_runtime_enablement_review_passed_ready_for_guarded_runtime_enablement_plan') fail('executable review drift')

const docsCorpus = requiredFiles
  .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n')
for (const text of [
  lane,
  decisionText,
  executionText,
  nextPrompt,
  'post_1658_source_chain_reconciled',
  'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a',
  'ec9d2d70ea90ffdbfe431d94f715066614efb15b',
  '719b8690358d199e723db7fca1dc137b84ca2237',
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
  /"readyForWorkerExecution"\s*:\s*true/i,
  /"readyForGpacMp4boxExecution"\s*:\s*true/i,
  /"runtimeExecutionAuthorized"\s*:\s*true/i,
  /"routeExecutionAuthorized"\s*:\s*true/i,
  /"workerExecutionAuthorized"\s*:\s*true/i,
  /"signedPublicArtifactAuthorized"\s*:\s*true/i,
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
console.log('Source chain reconciled post #1658')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Runtime/tool/route/worker execution remains blocked')
console.log('Product-ready local OSS tools: 0')
