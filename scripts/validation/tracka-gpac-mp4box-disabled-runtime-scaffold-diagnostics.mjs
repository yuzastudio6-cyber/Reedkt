#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-runtime-scaffold'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan'
const decisionText = 'tracka_gpac_mp4box_disabled_runtime_scaffold_passed_ready_for_runtime_scaffold_negative_tests'
const executionText = 'completed_disabled_runtime_scaffold_contract_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold'
const priorMergeSha = 'fd44ba5c394cf6fa61856f4c66c16d0509b70f6a'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-disabled-runtime-scaffold-decision.json`,
  `${packetDir}/gpac-mp4box-disabled-runtime-scaffold-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-scaffold-contract.json`,
  `${packetDir}/runtime-scaffold-contract.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const contractFiles = [
  'src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const requiredFiles = [
  ...packetFiles,
  ...contractFiles,
  ...statusFiles,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-runtime-scaffold-1-results.md',
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-runtime-scaffold-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-runtime-scaffold-negative-tests-1.md',
  `${priorDir}/gpac-mp4box-guarded-runtime-enablement-plan-decision.json`,
  `${priorDir}/readiness-report.json`,
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-disabled-runtime-scaffold-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'disabled_scaffold_registered_no_runtime',
  'disabled_scaffold_only',
  'runtimeScaffold.gpacMp4box.disabled',
  'render.gpacMp4box.serviceRolePackageMock',
  'raw_chat',
  'raw_command_string',
  'frontend_file_path',
  'public_url_source_of_truth',
  'signed_url_source_of_truth',
  'arbitrary_private_media',
  'provider_or_model_prompt_payload',
  'service_role_secret_payload',
  'broad_service_role_handler_payload',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForLiveRouteRegistration"\s*:\s*true/i,
  /readyForWorkerDispatch"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /readyForMediaProcessing"\s*:\s*true/i,
  /readyForStorageTransfer"\s*:\s*true/i,
  /readyForSignedUrlCreation"\s*:\s*true/i,
  /readyForPublicArtifactCreation"\s*:\s*true/i,
  /routeExecution"\s*:\s*true/i,
  /workerExecution"\s*:\s*true/i,
  /gpacMp4boxExecution"\s*:\s*true/i,
  /mediaProcessing"\s*:\s*true/i,
  /storageTransfer"\s*:\s*true/i,
  /runtimeExecution"\s*:\s*true/i,
  /supabaseMutation"\s*:\s*true/i,
  /sqlExecution"\s*:\s*true/i,
  /signedUrlCreation"\s*:\s*true/i,
  /publicArtifactCreation"\s*:\s*true/i,
  /externalBetaExpansion"\s*:\s*true/i,
  /paidProductionUnlock"\s*:\s*true/i,
  /productionUnlock"\s*:\s*true/i,
]

const forbiddenPathPatterns = [
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /package-lock\.json/,
  /\.dockerignore$/,
  /requirements/i,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenSourcePatterns = [
  /from ['"]node:child_process['"]/,
  /from ['"]child_process['"]/,
  /execFileSync\(/,
  /spawn\(/,
  /fetch\(/,
  /createClient\(/,
  /service_role_key/i,
  /service-role key/i,
  /SUPABASE_/,
  /gcloud/i,
  /docker\s+(build|run|push)/i,
  /MP4Box\s+-/,
  /gpac\s+-/,
]

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-disabled-runtime-scaffold:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-disabled-runtime-scaffold-diagnostics.mjs') fail('missing package diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-disabled-runtime-scaffold'] !== 'tsx server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts') fail('missing smoke script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && !file.startsWith('src/') && !file.startsWith('server/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !read('package.json').includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-disabled-runtime-scaffold-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.guardedRuntimeEnablementPlan !== priorDecision) fail('prior decision drift')
if (decision.prior?.guardedRuntimeEnablementPlanMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.runtimeScaffold?.status !== 'disabled_scaffold_registered_no_runtime') fail('scaffold status drift')
if (decision.runtimeScaffold?.runtimeMode !== 'disabled_scaffold_only') fail('runtime mode drift')
if (decision.runtimeScaffold?.enabled !== false) fail('enabled drift')
if (decision.runtimeScaffold?.workerDispatchEnabled !== false) fail('worker dispatch drift')
if (decision.runtimeScaffold?.rawCommandStringsAllowed !== false) fail('raw command string drift')
for (const rejectedInput of [
  'raw_chat',
  'raw_command_string',
  'frontend_file_path',
  'public_url_source_of_truth',
  'signed_url_source_of_truth',
  'arbitrary_private_media',
  'provider_or_model_prompt_payload',
  'service_role_secret_payload',
  'broad_service_role_handler_payload',
]) {
  if (!decision.rejectedInputs?.includes(rejectedInput)) fail(`missing rejected input ${rejectedInput}`)
}
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const contractDoc = json(`${packetDir}/runtime-scaffold-contract.json`)
if (contractDoc.scaffoldId !== 'runtimeScaffold.gpacMp4box.disabled') fail('contract scaffold id drift')
if (contractDoc.liveRouteRegistration !== false || contractDoc.workerImplementation !== false || contractDoc.toolExecutionPath !== false || contractDoc.storageTransferPath !== false || contractDoc.productionRuntimePath !== false) fail('contract live path drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.disabledRuntimeScaffoldPassed !== true) fail('readiness scaffold drift')
if (readiness.readyForRuntimeScaffoldNegativeTests !== true) fail('readiness next gate drift')
for (const key of ['readyForLiveRouteRegistration', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')

const prior = json(`${priorDir}/gpac-mp4box-guarded-runtime-enablement-plan-decision.json`)
if (prior.decision !== priorDecision) fail('prior guarded runtime enablement decision drift')

const contractText = read('src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts')
for (const text of [
  'disabled_scaffold_registered_no_runtime',
  'blocked_runtime_flag_not_disabled',
  'blocked_rejected_input_present',
  'blocked_runtime_execution_attempt',
  'blocked_storage_or_public_delivery_attempt',
  'TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1',
]) {
  if (!contractText.includes(text)) fail(`contract missing ${text}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path ${file}`)
  if (/^src\//.test(file) && file !== 'src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts' && file !== 'src/backend/contracts/index.ts') fail(`unexpected source path ${file}`)
  if (/^server\//.test(file) && file !== 'server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts') fail(`unexpected server path ${file}`)
  if (file.startsWith('src/') || file.startsWith('server/')) {
    const text = read(file)
    for (const pattern of forbiddenSourcePatterns) {
      if (pattern.test(text)) fail(`forbidden executable pattern ${pattern} in ${file}`)
    }
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Disabled scaffold: contract and smoke only, no live route or worker execution')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
