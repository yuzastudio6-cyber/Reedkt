#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-live-registration-review'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-runtime-scaffold-negative-tests'
const disabledLiveRegistrationDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-live-registration-contract'
const lane = 'TRACKA-GPAC-MP4BOX-GUARDED-LIVE-REGISTRATION-REVIEW-1'
const decisionText = 'tracka_gpac_mp4box_guarded_live_registration_review_passed_ready_for_disabled_live_registration_contract'
const executionText = 'completed_docs_only_guarded_live_registration_review_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_runtime_scaffold_negative_tests_passed_ready_for_guarded_live_registration_review'
const priorMergeSha = '44245f61b9ff915554b6845c97f4b87cd434a177'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-LIVE-REGISTRATION-CONTRACT-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-live-registration-review-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-live-registration-review-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/registration-guard-matrix.json`,
  `${packetDir}/registration-guard-matrix.md`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-runtime-scaffold-negative-tests-decision.json`,
  `${priorDir}/readiness-report.json`,
  `${priorDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-runtime-scaffold-negative-tests-1-results.md',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const disabledLiveRegistrationFiles = [
  `${disabledLiveRegistrationDir}/gpac-mp4box-disabled-live-registration-contract-decision.json`,
  `${disabledLiveRegistrationDir}/gpac-mp4box-disabled-live-registration-contract-decision.md`,
  `${disabledLiveRegistrationDir}/live-registration-contract.json`,
  `${disabledLiveRegistrationDir}/live-registration-contract.md`,
  `${disabledLiveRegistrationDir}/readiness-report.json`,
  `${disabledLiveRegistrationDir}/source-of-truth-audit.json`,
  `${disabledLiveRegistrationDir}/source-of-truth-audit.md`,
  `${disabledLiveRegistrationDir}/validation-results.md`,
]

const disabledLiveRegistrationContractFiles = [
  'src/backend/contracts/gpac-mp4box-disabled-live-registration-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-live-registration-contract-smoke.ts',
]

const requiredFiles = [
  ...packetFiles,
  ...priorFiles,
  ...statusFiles,
  ...disabledLiveRegistrationFiles,
  ...disabledLiveRegistrationContractFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-live-registration-review-1-results.md',
  'docs/activation-phase-tracka-gpac-mp4box-disabled-live-registration-contract-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-live-registration-contract-negative-tests-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-live-registration-contract-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-live-registration-review-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-runtime-scaffold-negative-tests-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-guarded-live-registration-review-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-disabled-live-registration-contract-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredFutureGuards = [
  'backend_service_role_owner_required',
  'live_handler_disabled_by_default_required',
  'feature_flag_default_false_required',
  'approved_snapshot_guard_required',
  'route_idempotency_guard_required',
  'private_artifact_manifest_guard_required',
  'command_allowlist_guard_required',
  'negative_tests_must_remain_passing',
  'no_storage_transfer_until_private_artifact_runtime_gate',
  'no_signed_or_public_artifact_until_delivery_policy_gate',
  'operator_confirmation_required_before_any_execution',
]

const requiredText = [
  lane,
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'disabled_live_registration_contract_only',
  'disabled_contract_only',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
  ...requiredFutureGuards,
]

const forbiddenNewDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForLiveHandlerRegistration"\s*:\s*true/i,
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
]

const forbiddenChangedPathPatterns = [
  /^src\//,
  /^server\//,
  /^supabase\//,
  /^database\//,
  /^docker\//,
  /^public\//,
  /^dist(?:-|\/|$)/,
  /^node_modules\//,
  /package-lock\.json$/,
  /\.dockerignore$/,
  /requirements/i,
  /\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i,
]

const forbiddenNewFileClaims = [
  /npm install/i,
  /pnpm add/i,
  /yarn add/i,
  /docker\s+(build|run|push|compose)/i,
  /gcloud\s+/i,
  /supabase\s+(db|migration|functions|storage|secrets)/i,
  /psql\s+/i,
  /createSignedUrl/i,
  /signed URL creation:\s*`?true/i,
  /public artifact creation:\s*`?true/i,
  /live route registration:\s*`?true/i,
  /route execution:\s*`?true/i,
  /worker execution:\s*`?true/i,
  /worker dispatch:\s*`?true/i,
  /GPAC\/MP4Box execution:\s*`?true/i,
  /external beta expansion:\s*`?true/i,
  /paid production unlock:\s*`?true/i,
  /production unlock:\s*`?true/i,
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-live-registration-review:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-live-registration-review-diagnostics.mjs') fail('missing package diagnostics script')

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

const newPacketCorpus = [
  ...packetFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-live-registration-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-live-registration-contract-1.md',
].map((file) => read(file)).join('\n')

for (const pattern of forbiddenNewDocPatterns) {
  if (pattern.test(newPacketCorpus)) fail(`forbidden new-packet claim matched ${pattern}`)
}
for (const pattern of forbiddenNewFileClaims) {
  if (pattern.test(newPacketCorpus)) fail(`forbidden execution/install claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-guarded-live-registration-review-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.runtimeScaffoldNegativeTests !== priorDecision) fail('prior decision drift')
if (decision.prior?.runtimeScaffoldNegativeTestsMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.allowedNextImplementation !== nextPrompt) fail('next implementation drift')
if (decision.allowedScope !== 'disabled_live_registration_contract_only') fail('allowed scope drift')
for (const guard of requiredFutureGuards) {
  if (!decision.requiredFutureRegistrationGuards?.includes(guard)) fail(`missing future guard ${guard}`)
}
if (decision.registration?.routeRegistration !== 'disabled_contract_only') fail('route registration status drift')
if (decision.registration?.liveHandlerEnabled !== false) fail('live handler flag drift')
if (decision.registration?.featureFlagDefault !== false) fail('feature flag default drift')
if (decision.registration?.runtimeExecutionApproved !== false) fail('runtime execution approval drift')
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.packageLock !== 'unchanged') fail('package-lock status drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact status drift')
if (decision.supabase?.classification !== 'no write / environment none / SQL none / migration no') fail('Supabase classification drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const matrix = json(`${packetDir}/registration-guard-matrix.json`)
for (const guard of requiredFutureGuards) {
  if (!Object.values(matrix).includes(guard)) fail(`matrix missing future guard ${guard}`)
}
for (const key of ['routeExecution', 'workerDispatch', 'workerExecution', 'gpacMp4boxExecution', 'mediaProcessing', 'storageTransferEnabled', 'signedUrlCreation', 'publicArtifactCreation', 'supabaseMutation', 'sqlExecution', 'externalBetaExpansion', 'paidProductionUnlock', 'productionUnlock']) {
  if (matrix[key] !== false) fail(`matrix ${key} drift`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedLiveRegistrationReviewPassed !== true) fail('readiness review pass drift')
if (readiness.readyForDisabledLiveRegistrationContract !== true) fail('disabled contract readiness drift')
for (const key of ['readyForLiveHandlerRegistration', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const prior = json(`${priorDir}/gpac-mp4box-runtime-scaffold-negative-tests-decision.json`)
if (prior.decision !== priorDecision) fail('prior negative-tests decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  const isAllowedDisabledContractFile = disabledLiveRegistrationContractFiles.includes(file)
  if (!isAllowedDisabledContractFile && forbiddenChangedPathPatterns.some((pattern) => pattern.test(file))) fail(`forbidden changed path ${file}`)
  if (/^src\//.test(file) && !isAllowedDisabledContractFile) fail(`unexpected source path ${file}`)
  if (/^server\//.test(file) && !isAllowedDisabledContractFile) fail(`unexpected server path ${file}`)
}

for (const file of changedFiles.filter((file) => file.startsWith(packetDir) || file.startsWith('docs/activation-phase-tracka-gpac-mp4box-guarded-live-registration-review') || file === 'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-live-registration-contract-1.md')) {
  const text = read(file)
  for (const pattern of forbiddenNewFileClaims) {
    if (pattern.test(text)) fail(`forbidden execution/install claim ${pattern} in ${file}`)
  }
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
console.log('Allowed next implementation: disabled live-registration contract only')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
