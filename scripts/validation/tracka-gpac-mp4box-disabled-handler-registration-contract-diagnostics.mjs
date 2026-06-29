#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-registration-contract'
const negativeTestsDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-registration-contract-negative-tests'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-registration-review'
const decisionText = 'tracka_gpac_mp4box_disabled_handler_registration_contract_passed_ready_for_handler_registration_contract_negative_tests'
const executionText = 'completed_disabled_handler_registration_contract_no_route_or_worker_execution'
const priorDecision = 'tracka_gpac_mp4box_disabled_handler_registration_review_passed_ready_for_disabled_handler_registration_contract'
const priorMergeSha = '4111cf960d8834fb15596b94d9beb5d99e1ace91'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-disabled-handler-registration-contract-decision.json`,
  `${packetDir}/gpac-mp4box-disabled-handler-registration-contract-decision.md`,
  `${packetDir}/contract-boundary.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const contractFiles = [
  'src/backend/contracts/gpac-mp4box-disabled-handler-registration-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-handler-registration-contract-smoke.ts',
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-disabled-handler-registration-review-decision.json`,
  `${priorDir}/readiness-report.json`,
  `${priorDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-registration-review-1-results.md',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const negativeTestFiles = [
  `${negativeTestsDir}/gpac-mp4box-disabled-handler-registration-contract-negative-tests-decision.json`,
  `${negativeTestsDir}/gpac-mp4box-disabled-handler-registration-contract-negative-tests-decision.md`,
  `${negativeTestsDir}/readiness-report.json`,
  `${negativeTestsDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-registration-contract-negative-tests-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-handler-registration-plan-1.md',
  'server/smoke/tracka-gpac-mp4box-disabled-handler-registration-contract-negative-tests-smoke.ts',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-contract-negative-tests-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...contractFiles,
  ...priorFiles,
  ...statusFiles,
  ...negativeTestFiles,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-registration-contract-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-contract-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-contract-negative-tests-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-review-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-contract-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  lane,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  nextPrompt,
  'handlerRegistration.gpacMp4box.disabled',
  'render.gpacMp4box.disabledHandlerRegistrationContract',
  'disabled_handler_registration_metadata_contract_only',
  'disabled_handler_registration_contract_registered_no_executable_handler',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
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
  /"handlerRegistered"\s*:\s*true/i,
  /"handlerEnabled"\s*:\s*true/i,
  /"runtimeExecutionApproved"\s*:\s*true/i,
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
if (packageJson.scripts?.['tracka:gpac-mp4box-disabled-handler-registration-contract:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-contract-diagnostics.mjs') fail('missing package diagnostics script')
if (packageJson.scripts?.['smoke:tracka-gpac-mp4box-disabled-handler-registration-contract'] !== 'tsx server/smoke/tracka-gpac-mp4box-disabled-handler-registration-contract-smoke.ts') fail('missing smoke script')

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

const decision = json(`${packetDir}/gpac-mp4box-disabled-handler-registration-contract-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.disabledHandlerRegistrationReview !== priorDecision) fail('prior decision drift')
if (decision.prior?.disabledHandlerRegistrationReviewMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.contract?.contractId !== 'handlerRegistration.gpacMp4box.disabled') fail('contract id drift')
if (decision.contract?.routeId !== 'render.gpacMp4box.disabledHandlerRegistrationContract') fail('route id drift')
if (decision.contract?.handlerRegistrationMode !== 'disabled_handler_registration_metadata_contract_only') fail('handler registration mode drift')
if (decision.contract?.registrationStatus !== 'disabled_handler_registration_contract_registered_no_executable_handler') fail('registration status drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.packageLock !== 'unchanged') fail('package-lock status drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact status drift')
if (decision.supabase?.classification !== 'no write / environment none / SQL none / migration no') fail('Supabase classification drift')
if (decision.excludedPrs?.['577'] !== 'open/draft/blocked/conflicting/excluded') fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.contractValidated !== true) fail('readiness contract drift')
if (readiness.readyForHandlerRegistrationContractNegativeTests !== true) fail('readiness next gate drift')
for (const key of ['readyForExecutableHttpHandler', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const prior = json(`${priorDir}/gpac-mp4box-disabled-handler-registration-review-decision.json`)
if (prior.decision !== priorDecision) fail('prior disabled handler review decision drift')

const smokeText = read('server/smoke/tracka-gpac-mp4box-disabled-handler-registration-contract-smoke.ts')
for (const text of [
  'disabled_handler_registration_contract_validates',
  'executable_handler_registration_blocks',
  'feature_flag_enablement_blocks',
  'route_execution_blocks',
  'signed_public_artifact_attempt_blocks',
  'missing_cleanup_audit_reference_blocks',
  'missing_approved_snapshot_guard_blocks',
  'raw_command_input_blocks',
  'no_route_worker_tool_storage_media_or_unlock_enabled',
]) {
  if (!smokeText.includes(text)) fail(`smoke missing ${text}`)
}
for (const pattern of forbiddenSmokePatterns) {
  if (pattern.test(smokeText)) fail(`forbidden executable pattern ${pattern} in smoke`)
}

const contractText = read('src/backend/contracts/gpac-mp4box-disabled-handler-registration-contracts.ts')
for (const text of [
  'handlerRegistration.gpacMp4box.disabled',
  'render.gpacMp4box.disabledHandlerRegistrationContract',
  'disabled_handler_registration_metadata_contract_only',
  'disabled_handler_registration_contract_registered_no_executable_handler',
  'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1',
]) {
  if (!contractText.includes(text)) fail(`contract missing ${text}`)
}

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  const isContractOrSmoke = contractFiles.includes(file) || negativeTestFiles.includes(file)
  if (!isContractOrSmoke && forbiddenPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path ${file}`)
  if (/^src\//.test(file) && !contractFiles.includes(file)) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file) && !isContractOrSmoke) fail(`unexpected server path ${file}`)
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
console.log('Disabled handler-registration contract validates with no executable handler')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
