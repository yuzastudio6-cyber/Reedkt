#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lane = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1'
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-handler-registration-review'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-live-registration-contract-negative-tests'
const decisionText = 'tracka_gpac_mp4box_disabled_handler_registration_review_passed_ready_for_disabled_handler_registration_contract'
const executionText = 'completed_docs_only_disabled_handler_registration_review_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_live_registration_contract_negative_tests_passed_ready_for_disabled_handler_registration_review'
const priorMergeSha = 'd5afe1a55b6e5c566a84d3cbdba2a1d7c8d530d8'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-disabled-handler-registration-review-decision.json`,
  `${packetDir}/gpac-mp4box-disabled-handler-registration-review-decision.md`,
  `${packetDir}/handler-registration-boundary.json`,
  `${packetDir}/handler-registration-boundary.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/source-of-truth-audit.json`,
  `${packetDir}/source-of-truth-audit.md`,
  `${packetDir}/validation-results.md`,
]

const priorFiles = [
  `${priorDir}/gpac-mp4box-live-registration-contract-negative-tests-decision.json`,
  `${priorDir}/readiness-report.json`,
  `${priorDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-live-registration-contract-negative-tests-1-results.md',
  'server/smoke/tracka-gpac-mp4box-live-registration-contract-negative-tests-smoke.ts',
]

const statusFiles = [
  'docs/production-beta-blocker-inventory.md',
  'docs/track-a/track-a-runtime-blocked-scope-register.md',
  'docs/track-a/track-a-tool-status-matrix.md',
]

const requiredFiles = [
  ...packetFiles,
  ...priorFiles,
  ...statusFiles,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-handler-registration-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-review-1.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-handler-registration-contract-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-live-registration-contract-negative-tests-diagnostics.mjs',
  'scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-review-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredFutureGuards = [
  'backend_service_role_owner_required',
  'handler_registration_disabled_by_default_required',
  'feature_flag_default_false_required',
  'approved_snapshot_guard_required',
  'route_idempotency_guard_required',
  'private_artifact_manifest_guard_required',
  'command_allowlist_guard_required',
  'negative_tests_must_remain_passing',
  'no_storage_transfer_until_private_artifact_runtime_gate',
  'no_signed_or_public_artifact_until_delivery_policy_gate',
  'cleanup_audit_reference_required',
  'operator_confirmation_required_before_any_execution',
]

const requiredText = [
  lane,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  nextPrompt,
  'disabled_handler_registration_metadata_contract_only',
  'Product-ready local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Supabase classification: no write / environment none / SQL none / migration no',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
  ...requiredFutureGuards,
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
  /^src\//,
  /^server\/(?!smoke\/tracka-gpac-mp4box-live-registration-contract-negative-tests-smoke\.ts$)/,
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
if (packageJson.scripts?.['tracka:gpac-mp4box-disabled-handler-registration-review:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-disabled-handler-registration-review-diagnostics.mjs') {
  fail('missing package diagnostics script')
}

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && !file.startsWith('server/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text) && !read('package.json').includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsCorpus)) fail(`forbidden doc claim matched ${pattern}`)
}

const decision = json(`${packetDir}/gpac-mp4box-disabled-handler-registration-review-decision.json`)
if (decision.lane !== lane) fail('lane drift')
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.liveRegistrationContractNegativeTests !== priorDecision) fail('prior decision drift')
if (decision.prior?.liveRegistrationContractNegativeTestsMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.allowedNextPacket !== nextPrompt) fail('allowed next packet drift')
if (decision.allowedNextScope !== 'disabled_handler_registration_metadata_contract_only') fail('allowed next scope drift')
for (const guard of requiredFutureGuards) {
  if (!decision.requiredFutureGuards?.includes(guard)) fail(`missing required guard ${guard}`)
}
for (const [key, value] of Object.entries(decision.safety ?? {})) {
  if (value !== false) fail(`safety ${key} was enabled`)
}
if (decision.productReadyLocalOssTools !== 0) fail('product-ready count drift')
if (decision.packageLock !== 'unchanged') fail('package-lock status drift')
if (decision.generatedArtifactsCommitted !== 'none') fail('generated artifact status drift')
if (decision.supabase?.classification !== 'no write / environment none / SQL none / migration no') fail('Supabase classification drift')
if (decision.excludedPrs?.['577'] !== 'open/draft/blocked/conflicting/excluded') fail('#577 exclusion drift')
if (decision.nextPrompt !== nextPrompt) fail('next prompt drift')

const boundary = json(`${packetDir}/handler-registration-boundary.json`)
if (boundary.nextPacketType !== 'contract_metadata_only') fail('boundary next packet drift')
for (const [key, value] of Object.entries(boundary.blocked ?? {})) {
  if (value !== 'blocked') fail(`boundary ${key} was not blocked`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.reviewPassed !== true) fail('readiness review drift')
if (readiness.readyForDisabledHandlerRegistrationContract !== true) fail('readiness next contract drift')
for (const key of ['readyForExecutableHttpHandler', 'readyForRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForPaidProduction', 'readyForProduction', 'readyForFinalDeliveryExport']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')
if (readiness.nextPrompt !== nextPrompt) fail('readiness next prompt drift')

const prior = json(`${priorDir}/gpac-mp4box-live-registration-contract-negative-tests-decision.json`)
if (prior.decision !== priorDecision) fail('prior negative-test decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
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
console.log('Disabled handler-registration metadata contract is allowed next')
console.log('Executable handler, route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
