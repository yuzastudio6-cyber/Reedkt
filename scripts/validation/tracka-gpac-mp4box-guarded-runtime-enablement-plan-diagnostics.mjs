#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packetDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-enablement-plan'
const priorDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-private-artifact-final-runtime-readiness-review'
const scaffoldDir = 'docs/track-a/native-container-render-tools/gpac-mp4box-disabled-runtime-scaffold'
const decisionText = 'tracka_gpac_mp4box_guarded_runtime_enablement_plan_passed_ready_for_disabled_runtime_scaffold'
const executionText = 'completed_docs_only_guarded_runtime_enablement_plan_no_runtime_execution'
const priorDecision = 'tracka_gpac_mp4box_private_artifact_final_runtime_readiness_review_passed_ready_for_guarded_runtime_enablement_plan'
const priorMergeSha = 'f9994564af1e08b82f2d5e8393a0272de0b10b6d'
const nextPrompt = 'TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1'

const packetFiles = [
  `${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-decision.json`,
  `${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-decision.md`,
  `${packetDir}/readiness-report.json`,
  `${packetDir}/runtime-guard-matrix.json`,
  `${packetDir}/runtime-guard-matrix.md`,
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
  'docs/activation-phase-tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1.md',
  `${priorDir}/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json`,
  `${priorDir}/readiness-report.json`,
  'scripts/validation/tracka-gpac-mp4box-private-artifact-final-runtime-readiness-review-diagnostics.mjs',
]

const scaffoldFiles = [
  `${scaffoldDir}/gpac-mp4box-disabled-runtime-scaffold-decision.json`,
  `${scaffoldDir}/gpac-mp4box-disabled-runtime-scaffold-decision.md`,
  `${scaffoldDir}/readiness-report.json`,
  `${scaffoldDir}/runtime-scaffold-contract.json`,
  `${scaffoldDir}/runtime-scaffold-contract.md`,
  `${scaffoldDir}/source-of-truth-audit.json`,
  `${scaffoldDir}/source-of-truth-audit.md`,
  `${scaffoldDir}/validation-results.md`,
  'docs/activation-phase-tracka-gpac-mp4box-disabled-runtime-scaffold-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-runtime-scaffold-negative-tests-1.md',
  'src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts',
  'src/backend/contracts/index.ts',
  'server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts',
  'scripts/validation/tracka-gpac-mp4box-disabled-runtime-scaffold-diagnostics.mjs',
]

const requiredFiles = [
  ...packetFiles,
  ...statusFiles,
  ...priorFiles,
  ...scaffoldFiles,
  'docs/activation-phase-tracka-gpac-mp4box-guarded-runtime-enablement-plan-1-results.md',
  'docs/implementation-prompts/prompt-tracka-gpac-mp4box-disabled-runtime-scaffold-1.md',
  'package.json',
  'scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-diagnostics.mjs',
]

const allowedChangedFiles = new Set(requiredFiles)

const requiredText = [
  'TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1',
  nextPrompt,
  decisionText,
  executionText,
  priorDecision,
  priorMergeSha,
  'ready_for_disabled_scaffold_only',
  'approved_snapshot_runtime_persistence_required',
  'service_role_backend_route_registration_required',
  'disabled_by_default_runtime_scaffold_required',
  'worker_dispatch_confirmation_required',
  'private_artifact_storage_runtime_policy_required',
  'tool_runtime_command_allowlist_required',
  'storage_transfer_negative_tests_required',
  'signed_public_artifact_negative_tests_required',
  'qa_cleanup_audit_runtime_observability_required',
  'rollback_and_residue_validation_required',
  'operator_confirmation_gate_required',
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
  'Supabase classification: no write / environment none / SQL none / migration no',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'PR #577 remains open/draft/blocked/conflicting and excluded',
]

const forbiddenDocPatterns = [
  /Product-ready(?: end-to-end)? local OSS tools:\s*`?[1-9]/i,
  /productReadyLocalOssTools"\s*:\s*[1-9]/i,
  /readyForProductRuntime"\s*:\s*true/i,
  /readyForExternalBetaProductUse"\s*:\s*true/i,
  /readyForProduction"\s*:\s*true/i,
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

function fail(message) {
  console.error(`TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1 diagnostics failed: ${message}`)
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
if (packageJson.scripts?.['tracka:gpac-mp4box-guarded-runtime-enablement-plan:diagnostics'] !== 'node scripts/validation/tracka-gpac-mp4box-guarded-runtime-enablement-plan-diagnostics.mjs') fail('missing package diagnostics script')

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

const decision = json(`${packetDir}/gpac-mp4box-guarded-runtime-enablement-plan-decision.json`)
if (decision.decision !== decisionText) fail('decision drift')
if (decision.execution !== executionText) fail('execution drift')
if (decision.prior?.privateArtifactFinalRuntimeReadinessReview !== priorDecision) fail('prior readiness decision drift')
if (decision.prior?.privateArtifactFinalRuntimeReadinessMergeSha !== priorMergeSha) fail('prior merge SHA drift')
if (decision.runtimeEnablementPlan?.nextAllowedImplementation !== nextPrompt) fail('next implementation drift')
if (decision.runtimeEnablementPlan?.runtimeScaffoldReadiness !== 'ready_for_disabled_scaffold_only') fail('scaffold readiness drift')
if (decision.runtimeEnablementPlan?.productRuntime !== 'blocked') fail('product runtime drift')
for (const requiredGuard of [
  'approved_snapshot_runtime_persistence_required',
  'service_role_backend_route_registration_required',
  'disabled_by_default_runtime_scaffold_required',
  'worker_dispatch_confirmation_required',
  'private_artifact_storage_runtime_policy_required',
  'tool_runtime_command_allowlist_required',
  'storage_transfer_negative_tests_required',
  'signed_public_artifact_negative_tests_required',
  'qa_cleanup_audit_runtime_observability_required',
  'rollback_and_residue_validation_required',
  'operator_confirmation_gate_required',
]) {
  if (!decision.requiredFutureGuards?.includes(requiredGuard)) fail(`missing future guard ${requiredGuard}`)
}
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

const guardMatrix = json(`${packetDir}/runtime-guard-matrix.json`)
for (const key of ['runtimeExecution', 'routeExecution', 'workerExecution', 'gpacMp4boxExecution', 'storageTransfer', 'signedUrlCreation', 'publicArtifactCreation', 'mediaProcessing']) {
  if (guardMatrix[key] !== false) fail(`guard matrix ${key} drift`)
}

const readiness = json(`${packetDir}/readiness-report.json`)
if (readiness.guardedRuntimeEnablementPlanPassed !== true) fail('readiness plan drift')
if (readiness.readyForDisabledRuntimeScaffold !== true) fail('readiness scaffold drift')
for (const key of ['readyForRuntimeRouteExecution', 'readyForWorkerDispatch', 'readyForWorkerExecution', 'readyForGpacMp4boxExecution', 'readyForMediaProcessing', 'readyForStorageTransfer', 'readyForSignedUrlCreation', 'readyForPublicArtifactCreation', 'readyForProductRuntime', 'readyForExternalBetaProductUse', 'readyForProduction']) {
  if (readiness[key] !== false) fail(`${key} drift`)
}
if (readiness.productReadyLocalOssTools !== 0) fail('readiness product-ready count drift')

const prior = json(`${priorDir}/gpac-mp4box-private-artifact-final-runtime-readiness-review-decision.json`)
if (prior.decision !== priorDecision) fail('prior final readiness decision drift')

const changedFiles = [...new Set([...gitLines(['diff', '--name-only', 'HEAD']), ...gitLines(['ls-files', '--others', '--exclude-standard']), ...gitLines(['diff', '--cached', '--name-only'])])]
for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  if (/^src\//.test(file) && file !== 'src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts' && file !== 'src/backend/contracts/index.ts') fail(`runtime source path changed ${file}`)
  if (/^server\//.test(file) && file !== 'server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts') fail(`server path changed ${file}`)
  if (/^supabase\/|^database\/|^public\//.test(file)) fail(`forbidden changed path ${file}`)
  if (/^docker\//.test(file)) fail(`Docker path changed ${file}`)
  if (/\.(mp4|mov|mkv|webm|srt|ass|png|jpg|jpeg|gif|wav|mp3|deb|gpg|asc)$/i.test(file)) fail(`artifact changed ${file}`)
  if (/^dist(?:-|\/|$)|^node_modules\//.test(file)) fail(`generated output changed ${file}`)
  if (/package-lock\.json|\.dockerignore|requirements|supabase|database|public/i.test(file)) fail(`protected path changed ${file}`)
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock changed')
gitQuiet(['diff', '--cached', '--quiet', '--', 'package-lock.json'], 'package-lock staged')
gitQuiet(['diff', '--quiet', '--', '.dockerignore'], '.dockerignore changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/render-worker/Dockerfile'], 'render-worker Dockerfile changed')
gitQuiet(['diff', '--quiet', '--', 'docker/prod/tool-readiness-worker/Dockerfile'], 'tool-readiness Dockerfile changed')
gitQuiet(['diff', '--check'], 'git diff --check failed')
gitQuiet(['diff', '--cached', '--check'], 'git diff --cached --check failed')

console.log('TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1 diagnostics passed')
console.log(`Decision: ${decisionText}`)
console.log('Next implementation: disabled runtime scaffold only')
console.log('Route, worker, GPAC/MP4Box, storage transfer, signed/public artifacts, media processing: blocked')
console.log(`Next prompt: ${nextPrompt}`)
console.log('Product-ready local OSS tools: 0')
console.log('Supabase classification: no write / environment none / SQL none / migration no')
