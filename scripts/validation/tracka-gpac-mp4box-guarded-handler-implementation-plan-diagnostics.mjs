#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-HANDLER-IMPLEMENTATION-PLAN-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-handler-implementation-plan'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-handler-implementation-contract-negative-tests'
const decisionText = 'tracka_gpac_mp4box_guarded_handler_implementation_plan_passed_ready_for_disabled_handler_implementation_scaffold'
const executionText = 'completed_docs_only_guarded_handler_implementation_plan_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_handler_implementation_contract_negative_tests_passed_ready_for_guarded_handler_implementation_plan'
const priorMergeSha = '5751612b70b5732ee9b0b8aa6415245b743332fd'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-SCAFFOLD-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.md`,
  `${packetDir}/handler-implementation-guard-matrix.json`,
  `${packetDir}/handler-implementation-guard-matrix.md`,
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
  `${priorDir}/gpac-mp4box-handler-implementation-contract-negative-tests-decision.json`,
  `${priorDir}/readiness-report.json`,
  'docs/activation-phase-tracka-gpac-mp4box-handler-implementation-contract-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-handler-implementation-plan-1.md',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-implementation-contract-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-handler-implementation-contract-negative-tests-diagnostics.mjs',
]

const scaffoldFiles = [
  'src/backend/contracts/gpac-mp4box-disabled-handler-implementation-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-smoke.ts',
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-implementation-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-handler-implementation-scaffold-negative-tests-1.md',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-implementation-scaffold-diagnostics.mjs',
]

const scaffoldPacketDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-implementation-scaffold'
const scaffoldPacketFiles = [
  `${scaffoldPacketDir}/gpac-mp4box-disabled-handler-implementation-scaffold-decision.json`,
  `${scaffoldPacketDir}/gpac-mp4box-disabled-handler-implementation-scaffold-decision.md`,
  `${scaffoldPacketDir}/handler-implementation-scaffold-contract.json`,
  `${scaffoldPacketDir}/handler-implementation-scaffold-contract.md`,
  `${scaffoldPacketDir}/readiness-report.json`,
  `${scaffoldPacketDir}/source-of-truth-audit.json`,
  `${scaffoldPacketDir}/source-of-truth-audit.md`,
  `${scaffoldPacketDir}/validation-results.md`,
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  ...scaffoldFiles,
  ...scaffoldPacketFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-handler-implementation-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-implementation-scaffold-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-plan-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredFutureGuards = [
  'backend_service_role_owner_required',
  'disabled_by_default_handler_implementation_required',
  'feature_flag_default_false_required',
  'approved_snapshot_guard_required',
  'route_idempotency_guard_required',
  'private_artifact_manifest_guard_required',
  'command_allowlist_guard_required',
  'negative_tests_must_remain_passing',
  'cleanup_audit_reference_required',
  'no_storage_transfer_until_private_artifact_runtime_gate',
  'no_signed_or_public_artifact_until_delivery_policy_gate',
  'operator_confirmation_required_before_any_execution',
]

const rejectedInputs = [
  'raw_chat',
  'raw_command_string',
  'frontend_file_path',
  'public_url_source_of_truth',
  'signed_url_source_of_truth',
  'arbitrary_private_media',
  'provider_or_model_prompt_payload',
  'service_role_secret_payload',
  'broad_service_role_handler_payload',
]

const requiredText = [
  lane,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  nextPrompt,
  'ready_for_disabled_handler_implementation_scaffold_only',
  'disabled_handler_implementation_scaffold_only',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
  ...requiredFutureGuards,
  ...rejectedInputs,
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForExecutableHandlerRegistration"\s*:\s*true/i,
  /readyForRouteExecution"\s*:\s*true/i,
  /readyForWorkerDispatch"\s*:\s*true/i,
  /readyForWorkerExecution"\s*:\s*true/i,
  /readyForGpacMp4boxExecution"\s*:\s*true/i,
  /readyForMediaProcessing"\s*:\s*true/i,
  /readyForStorageTransfer"\s*:\s*true/i,
  /readyForSignedUrlCreation"\s*:\s*true/i,
  /readyForPublicArtifactCreation"\s*:\s*true/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForPaidProduction"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
  /readyForFinalDeliveryExport"\s*:\s*true/i,
  /"executableHandlerRegistration"\s*:\s*true/i,
  /"routeExecution"\s*:\s*true/i,
  /"workerDispatch"\s*:\s*true/i,
  /"workerExecution"\s*:\s*true/i,
  /"gpacMp4boxExecution"\s*:\s*true/i,
  /"mediaProcessing"\s*:\s*true/i,
  /"storageTransfer"\s*:\s*true/i,
  /"signedUrlCreation"\s*:\s*true/i,
  /"publicArtifactCreation"\s*:\s*true/i,
  /"supabaseMutation"\s*:\s*true/i,
  /"sqlExecution"\s*:\s*true/i,
  /"externalBetaExpansion"\s*:\s*true/i,
  /"paidProductionUnlock"\s*:\s*true/i,
  /"productionUnlock"\s*:\s*true/i,
  /"finalDeliveryExport"\s*:\s*true/i,
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-handler-implementation-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-handler-implementation-plan-diagnostics.mjs') fail('missing package diagnostics script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-guarded-handler-implementation-plan-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.handlerImplementationContractNegativeTests !== priorDecision) fail('prior decision drift')
if (decision.prior?.handlerImplementationContractNegativeTestsMergeSha !== priorMergeSha) fail('prior merge drift')
if (decision.handlerImplementationPlan?.nextAllowedImplementation !== nextPrompt) fail('next implementation drift')
if (decision.handlerImplementationPlan?.handlerImplementationReadiness !== 'ready_for_disabled_handler_implementation_scaffold_only') fail('handler readiness drift')
if (decision.handlerImplementationPlan?.scope !== 'disabled_handler_implementation_scaffold_only') fail('scope drift')
if (decision.handlerImplementationPlan?.productRuntime !== 'blocked') fail('product runtime drift')
for (const requiredGuard of requiredFutureGuards) {
  if (!decision.requiredFutureGuards?.includes(requiredGuard)) fail(`missing future guard ${requiredGuard}`)
}
for (const rejectedInput of rejectedInputs) {
  if (!decision.rejectedInputs?.includes(rejectedInput)) fail(`missing rejected input ${rejectedInput}`)
}
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.packageLock !== 'unchanged') fail('package-lock drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact drift')
if (decision.supabase?.classification !== 'no write / environment none / SQL none / migration no') fail('Supabase classification drift')
if (decision.excludedPrs?.['577'] !== 'open/draft/blocked/conflicting/excluded') fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const guardMatrix = json(`${packetDir}/handler-implementation-guard-matrix.json`)
if (guardMatrix.nextAllowedImplementation !== nextPrompt) fail('guard matrix next prompt drift')
if (guardMatrix.handlerImplementationReadiness !== 'ready_for_disabled_handler_implementation_scaffold_only') fail('guard matrix readiness drift')
if (guardMatrix.scope !== 'disabled_handler_implementation_scaffold_only') fail('guard matrix scope drift')
for (const requiredGuard of requiredFutureGuards) {
  if (!guardMatrix.requiredFutureGuards?.includes(requiredGuard)) fail(`guard matrix missing ${requiredGuard}`)
}
for (const rejectedInput of rejectedInputs) {
  if (!guardMatrix.rejectedInputs?.includes(rejectedInput)) fail(`guard matrix missing ${rejectedInput}`)
}
for (const key of ['executableHandlerRegistration', 'routeExecution', 'workerDispatch', 'workerExecution', 'gpacMp4boxExecution', 'storageTransfer', 'signedUrlCreation', 'publicArtifactCreation', 'mediaProcessing', 'externalBetaExpansion', 'paidProductionUnlock', 'productionUnlock', 'finalDeliveryExport']) {
  if (guardMatrix[key] !== false) fail(`guard matrix ${key} drift`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedHandlerImplementationPlanPassed !== true) fail('readiness plan drift')
if (readiness.readyForDisabledHandlerImplementationScaffold !== true) fail('readiness scaffold drift')
for (const key of ['readyForExecutableHandlerRegistration', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const prior = json(`${priorDir}/gpac-mp4box-handler-implementation-contract-negative-tests-decision.json`)
if (prior.decision !== priorDecision) fail('prior negative-tests decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && !scaffoldFiles.includes(file)) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file) && !scaffoldFiles.includes(file)) fail(`unexpected server path ${file}`)
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path ${file}`)
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
console.log('Guarded handler implementation plan is docs-only and routes only to a disabled scaffold')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
