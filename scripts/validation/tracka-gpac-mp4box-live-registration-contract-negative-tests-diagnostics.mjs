#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-live-registration-contract-negative-tests'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-live-registration-contract'
const disabledHandlerReviewDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-registration-review'
const lane = 'TRACKA-GPAC-MP4BOX-LIVE-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1'
const decisionText = 'tracka_gpac_mp4box_live_registration_contract_negative_tests_passed_ready_for_disabled_handler_registration_review'
const executionText = 'completed_live_registration_contract_negative_tests_no_route_or_worker_execution'
const priorDecision = 'tracka_gpac_mp4box_disabled_live_registration_contract_passed_ready_for_live_registration_contract_negative_tests'
const priorMergeSha = '7905f29b16d7bdcaa95bdaefdc55d2ccd4b734ae'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-live-registration-contract-negative-tests-decision.json`,
  `${packetDir}/gpac-mp4box-live-registration-contract-negative-tests-decision.md`,
  `${packetDir}/negative-test-matrix.json`,
  `${packetDir}/negative-test-matrix.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const smokeFiles = [
  'server/smoke/tracka-gpac-mp4box-live-registration-contract-negative-tests-smoke.ts',
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-disabled-live-registration-contract-decision.json`,
  `${priorDir}/readiness-report.json`,
  `${priorDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-live-registration-contract-1-results.md',
  'src/backend/contracts/gpac-mp4box-disabled-live-registration-contracts.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-live-registration-contract-smoke.ts',
]

const disabledHandlerReviewFiles = [
  `${disabledHandlerReviewDir}/gpac-mp4box-disabled-handler-registration-review-decision.json`,
  `${disabledHandlerReviewDir}/gpac-mp4box-disabled-handler-registration-review-decision.md`,
  `${disabledHandlerReviewDir}/handler-registration-boundary.json`,
  `${disabledHandlerReviewDir}/handler-registration-boundary.md`,
  `${disabledHandlerReviewDir}/readiness-report.json`,
  `${disabledHandlerReviewDir}/source-of-truth-audit.json`,
  `${disabledHandlerReviewDir}/source-of-truth-audit.md`,
  `${disabledHandlerReviewDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-registration-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-contract-1.md',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-review-diagnostics.mjs',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const requiredFiles = [
  ...packetFiles,
  ...smokeFiles,
  ...priorFiles,
  ...disabledHandlerReviewFiles,
  ...statusFiles,
  'docs/activation-phase-tracka-gpac-mp4box-live-registration-contract-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-review-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-live-registration-contract-negative-tests-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-disabled-live-registration-contract-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-live-registration-contract-negative-tests-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const expectedRejectedInputs = [
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

const expectedRuntimeAttempts = [
  'routeExecution',
  'workerDispatch',
  'workerExecution',
  'gpacMp4boxExecution',
  'mediaProcessing',
  'supabaseMutation',
  'sqlExecution',
]

const expectedDeliveryAttempts = [
  'storageTransfer',
  'signedUrlCreation',
  'publicArtifactCreation',
  'externalBetaExpansion',
  'paidProductionUnlock',
  'productionUnlock',
  'finalDeliveryExport',
]

const expectedGuardFailures = [
  'blocked_guarded_review_invalid',
  'blocked_missing_backend_service_role_context',
  'blocked_live_handler_registered',
  'blocked_feature_flag_enabled',
  'blocked_missing_approved_snapshot_guard',
  'blocked_missing_route_idempotency_guard',
  'blocked_missing_private_artifact_manifest_guard',
  'blocked_missing_command_allowlist_guard',
  'blocked_missing_negative_tests_guard',
  'blocked_missing_storage_or_public_artifact_gate',
  'blocked_missing_operator_confirmation_guard',
]

const requiredText = [
  lane,
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'disabled_live_registration_contract_registered_no_handler',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
  ...expectedRejectedInputs,
  ...expectedGuardFailures,
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForExecutableHttpHandler"\s*:\s*true/i,
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

const forbiddenSmokePatterns = [
  /from ['"]node:child_process['"]/,
  /from ['"]child_process['"]/,
  /execFileSync\(/,
  /spawn\(/,
  /fetch\(/,
  /createClient\(/,
  /SUPABASE_/,
  /gcloud/i,
  /docker\s+(build|run|push)/i,
  /MP4Box\s+-/,
  /gpac\s+-/,
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
if (packageJson.scripts?.['tracka:gpac-mp4box-live-registration-contract-negative-tests:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-live-registration-contract-negative-tests-diagnostics.mjs') fail('missing package diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-live-registration-contract-negative-tests'] !== 'tsx server/smoke/tracka-gpac-mp4box-live-registration-contract-negative-tests-smoke.ts') fail('missing smoke script')

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

const decision = json(`${packetDir}/gpac-mp4box-live-registration-contract-negative-tests-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.disabledLiveRegistrationContract !== priorDecision) fail('prior decision drift')
if (decision.prior?.disabledLiveRegistrationContractMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.baselineStatus !== 'disabled_live_registration_contract_registered_no_handler') fail('baseline status drift')
for (const input of expectedRejectedInputs) {
  if (!decision.negativeCoverage?.rejectedInputs?.includes(input)) fail(`missing rejected input coverage ${input}`)
}
for (const attempt of expectedRuntimeAttempts) {
  if (!decision.negativeCoverage?.runtimeAttempts?.includes(attempt)) fail(`missing runtime attempt coverage ${attempt}`)
}
for (const attempt of expectedDeliveryAttempts) {
  if (!decision.negativeCoverage?.deliveryAttempts?.includes(attempt)) fail(`missing delivery attempt coverage ${attempt}`)
}
for (const guard of expectedGuardFailures) {
  if (!decision.negativeCoverage?.guardFailures?.includes(guard)) fail(`missing guard failure coverage ${guard}`)
}
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.packageLock !== 'unchanged') fail('package-lock status drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact status drift')
if (decision.supabase?.classification !== 'no write / environment none / SQL none / migration no') fail('Supabase classification drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const matrix = json(`${packetDir}/negative-test-matrix.json`)
if (matrix.rejectedInputCoverage !== 'blocked_rejected_input_present') fail('matrix rejected input drift')
if (matrix.runtimeAttemptCoverage !== 'blocked_runtime_execution_attempt') fail('matrix runtime drift')
if (matrix.deliveryAttemptCoverage !== 'blocked_storage_or_public_artifact_attempt') fail('matrix delivery drift')
for (const guard of expectedGuardFailures) {
  if (!matrix.guardFailureCoverage?.includes(guard)) fail(`matrix missing ${guard}`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.negativeTestsPassed !== true) fail('readiness negative tests drift')
if (readiness.readyForDisabledHandlerRegistrationReview !== true) fail('readiness next gate drift')
for (const key of ['readyForExecutableHttpHandler', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const prior = json(`${priorDir}/gpac-mp4box-disabled-live-registration-contract-decision.json`)
if (prior.decision !== priorDecision) fail('prior disabled live registration decision drift')

const smokeText = read('server/smoke/tracka-gpac-mp4box-live-registration-contract-negative-tests-smoke.ts')
for (const text of [
  'baseline_disabled_live_registration_contract_validates',
  'all_rejected_input_cases_block',
  'all_runtime_attempt_cases_block',
  'all_delivery_attempt_cases_block',
  'invalid_guarded_review_blocks',
  'service_role_secret_payload_access_blocks',
  'live_handler_registration_blocks',
  'feature_flag_enablement_blocks',
  'missing_guard_cases_block',
  'no_route_worker_tool_storage_media_or_unlock_enabled',
]) {
  if (!smokeText.includes(text)) fail(`smoke missing ${text}`)
}
for (const pattern of forbiddenSmokePatterns) {
  if (pattern.test(smokeText)) fail(`forbidden executable pattern ${pattern} in smoke`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  const isSmokeFile = smokeFiles.includes(file)
  if (!isSmokeFile && forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path ${file}`)
  if (/^src\//.test(file)) fail(`source path changed ${file}`)
  if (/^server\//.test(file) && !isSmokeFile) fail(`unexpected server path ${file}`)
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
console.log('Negative tests cover rejected inputs, runtime attempts, delivery attempts, and guard failures')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
