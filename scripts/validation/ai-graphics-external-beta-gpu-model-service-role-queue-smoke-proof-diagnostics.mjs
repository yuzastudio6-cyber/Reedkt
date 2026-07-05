import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const proofScriptName = 'ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof'
const proofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof-diagnostics.mjs'

const preparedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_prepared_with_runtime_blocks'
const acceptedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_accepted_with_runtime_blocks'
const rejectedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_rejected'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const requiredFiles = [
  'server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json',
  'server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke.ts',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'package.json',
]

const falseBooleanKeys = [
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const forbiddenPatterns = [
  /agentCanExecuteGpuModelToolsNow[`":\s=]+true/i,
  /agentCanExecuteAll21ToolsNow[`":\s=]+true/i,
  /workerDispatchApprovedNow[`":\s=]+true/i,
  /toolExecutionApprovedNow[`":\s=]+true/i,
  /gpuRuntimeApprovedNow[`":\s=]+true/i,
  /gpuRuntimeShouldStartNow[`":\s=]+true/i,
  /runtimeReadyNow[`":\s=]+true/i,
  /externalBetaReadyNow[`":\s=]+true/i,
  /productionReadyNow[`":\s=]+true/i,
  /modelWeightsDownloaded[`":\s=]+true/i,
  /modelWeightsLoaded[`":\s=]+true/i,
  /modelInferencePerformed[`":\s=]+true/i,
  /publicArtifactCreated[`":\s=]+true/i,
  /signedUrlCreated[`":\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  const filePath = absolute(file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(name, args) {
  return execFileSync(name, args, {
    cwd: root,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function git(args) {
  return exec('git', args).trim()
}

function runNpm(scriptName, args = []) {
  return exec('npm', ['run', '--silent', scriptName, ...args])
}

function parse(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeTempJson(dir, name, value) {
  const filePath = path.join(dir, name)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json(
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke-proof.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke-proof.md',
)
const cli = read('server/cli/ai-graphics-external-beta-gpu-model-service-role-queue-smoke-proof.ts')
const sourceHarness = json(
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json',
)

if (pkg.scripts?.[proofScriptName] !== proofScriptCommand) {
  fail(`missing_package_script:${proofScriptName}`)
}
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (docs.decision !== preparedDecision) fail(`docs_decision_mismatch:${docs.decision}`)
if (docs.status !== 'gpu_model_service_role_queue_smoke_proof_prepared_validator_only') {
  fail(`docs_status_mismatch:${docs.status}`)
}
if (docs.validatorScript !== proofScriptName) fail('docs_validator_script_mismatch')
if (docs.diagnosticScript !== diagnosticScriptName) fail('docs_diagnostic_script_mismatch')

for (const tool of gpuModelTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
  if (!sourceHarness.gpuModelTools?.some((entry) => entry.toolId === tool)) {
    fail(`source_harness_missing_gpu_tool:${tool}`)
  }
}

for (const [key, expected] of Object.entries({
  toolsSubmitted: 8,
  jobIdsReturned: 8,
  workerClaimsReturned: 8,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  liveQueueWritesAcceptedWithProvidedEvidence: 8,
  liveWorkerClaimRowsAcceptedWithProvidedEvidence: 8,
  workerDispatchesAcceptedWithProvidedEvidence: 0,
  toolExecutionsAcceptedWithProvidedEvidence: 0,
  fixtureRowsPersistedAfterCleanup: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`docs_acceptance_${key}_mismatch:${docs.acceptanceCriteria?.[key]}`)
  }
}

if (docs.acceptanceCriteria?.gpuRuntimeShouldStartNow !== false) {
  fail('docs_gpu_runtime_should_start_now_not_false')
}
if (docs.acceptanceCriteria?.modelWeightsLoadedNow !== false) {
  fail('docs_model_weights_loaded_now_not_false')
}
if (docs.booleans?.gpuModelServiceRoleQueueSmokeProofPrepared !== true) {
  fail('docs_prepared_boolean_not_true')
}
if (docs.booleans?.all8GpuModelToolsCovered !== true) {
  fail('docs_all8_boolean_not_true')
}
for (const key of falseBooleanKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_boolean_not_false:${key}`)
}
if (docs.booleans?.supabaseMutationPerformedByValidator !== false) {
  fail('docs_validator_supabase_mutation_not_false')
}

for (const phrase of [
  acceptedDecision,
  rejectedDecision,
  '--external-beta-gpu-model-service-role-queue-smoke-result',
  'fixtureRowsPersistedAfterCleanup',
  'validatorLiveQueueWritePerformed',
  'validatorWorkerDispatchPerformed',
  'validatorGpuRuntimePerformed',
  'gpuRuntimeShouldStartNow',
  'modelWeightsLoadedNow',
]) {
  if (!cli.includes(phrase) && !docsMd.includes(phrase)) fail(`missing_phrase:${phrase}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(docsMd) || pattern.test(JSON.stringify(docs))) {
    fail(`forbidden_claim:${pattern}`)
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-smoke-proof-'))
const acceptedResult = {
  decision: 'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_passed_with_cleanup',
  status: 'gpu_model_service_role_queue_smoke_passed_with_cleanup_no_worker_dispatch',
  toolsSubmitted: 8,
  toolsSubmittedIds: gpuModelTools,
  jobIdsReturned: 8,
  workerClaimsReturned: 8,
  serviceRoleQueueSmokeAuthorizationRef:
    'external-beta-service-role://queue-smoke-authorization/all-21-tools',
  sourceGpuModelWorkerBoundaryProofAccepted: true,
  sourceRuntimeQueueServiceProofBridgeAccepted: true,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
  liveServiceRoleQueueSmokeExecutedNow: true,
  liveSupabaseQueueWritesNow: 8,
  liveWorkerClaimRowsNow: 8,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  gpuRuntimeShouldStartNow: false,
  modelWeightsLoadedNow: false,
  fixtureRowsPersistedAfterCleanup: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}
const harnessPath = writeTempJson(tmp, 'harness.json', sourceHarness)
const acceptedResultPath = writeTempJson(tmp, 'accepted-result.json', acceptedResult)
const acceptedOutput = parse(
  runNpm(proofScriptName, [
    '--',
    '--external-beta-gpu-model-service-role-queue-smoke-harness-packet',
    harnessPath,
    '--external-beta-gpu-model-service-role-queue-smoke-result',
    acceptedResultPath,
    '--external-beta-gpu-model-service-role-queue-smoke-evidence-ref',
    'private://ai-graphics/external-beta/gpu-model-service-role-queue-smoke/evidence.json',
    '--external-beta-gpu-model-service-role-queue-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/gpu-model-service-role-queue-smoke/telemetry.json',
    '--external-beta-gpu-model-service-role-queue-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/gpu-model-service-role-queue-smoke/cleanup.json',
  ]),
  'accepted-proof',
)

if (acceptedOutput.decision !== acceptedDecision) {
  fail(`accepted_output_decision_mismatch:${acceptedOutput.decision}`)
}
if (acceptedOutput.counts?.acceptedLiveQueueWritesWithProvidedEvidence !== 8) {
  fail('accepted_output_queue_writes_not_8')
}
if (acceptedOutput.counts?.acceptedWorkerClaimRowsWithProvidedEvidence !== 8) {
  fail('accepted_output_worker_claims_not_8')
}
if (acceptedOutput.counts?.acceptedGpuRuntimeStartNowWithProvidedEvidence !== 0) {
  fail('accepted_output_gpu_start_not_0')
}
if (acceptedOutput.booleans?.gpuModelServiceRoleQueueSmokeProofAcceptedWithProvidedEvidence !== true) {
  fail('accepted_output_proof_boolean_not_true')
}
if (acceptedOutput.booleans?.gpuRuntimeShouldStartNow !== false) {
  fail('accepted_output_gpu_runtime_should_start_not_false')
}
if (acceptedOutput.evidence?.validatorLiveQueueWritePerformed !== false) {
  fail('accepted_output_validator_queue_write_not_false')
}

const badDispatchPath = writeTempJson(tmp, 'bad-dispatch-result.json', {
  ...acceptedResult,
  liveWorkerDispatchesNow: 1,
})
const rejectedDispatch = parse(
  runNpm(proofScriptName, [
    '--',
    '--external-beta-gpu-model-service-role-queue-smoke-harness-packet',
    harnessPath,
    '--external-beta-gpu-model-service-role-queue-smoke-result',
    badDispatchPath,
    '--external-beta-gpu-model-service-role-queue-smoke-evidence-ref',
    'private://evidence.json',
    '--external-beta-gpu-model-service-role-queue-smoke-telemetry-ref',
    'private://telemetry.json',
    '--external-beta-gpu-model-service-role-queue-smoke-cleanup-proof-ref',
    'private://cleanup.json',
  ]),
  'rejected-dispatch',
)
if (rejectedDispatch.decision !== rejectedDecision) fail('bad_dispatch_not_rejected')
if (!rejectedDispatch.errors?.includes('worker_dispatches_not_0')) {
  fail('bad_dispatch_missing_error')
}

const badGpuPath = writeTempJson(tmp, 'bad-gpu-result.json', {
  ...acceptedResult,
  gpuRuntimeShouldStartNow: true,
})
const rejectedGpu = parse(
  runNpm(proofScriptName, [
    '--',
    '--external-beta-gpu-model-service-role-queue-smoke-harness-packet',
    harnessPath,
    '--external-beta-gpu-model-service-role-queue-smoke-result',
    badGpuPath,
    '--external-beta-gpu-model-service-role-queue-smoke-evidence-ref',
    'private://evidence.json',
    '--external-beta-gpu-model-service-role-queue-smoke-telemetry-ref',
    'private://telemetry.json',
    '--external-beta-gpu-model-service-role-queue-smoke-cleanup-proof-ref',
    'private://cleanup.json',
  ]),
  'rejected-gpu',
)
if (rejectedGpu.decision !== rejectedDecision) fail('bad_gpu_not_rejected')
if (!rejectedGpu.errors?.includes('gpu_runtime_should_start_now_not_false')) {
  fail('bad_gpu_missing_error')
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff.trim().length > 0) fail('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts.trim().length > 0) fail('local_artifacts_tracked')

const changedFiles = git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

if (failures.length > 0) {
  console.error('AI graphics GPU/model service-role queue-smoke proof diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics GPU/model service-role queue-smoke proof diagnostics passed.')
console.log(JSON.stringify({
  decision: preparedDecision,
  acceptedDecision,
  gpuModelToolsCovered: 8,
  acceptedFixtureQueueWrites: acceptedOutput.counts?.acceptedLiveQueueWritesWithProvidedEvidence,
  acceptedFixtureWorkerClaims: acceptedOutput.counts?.acceptedWorkerClaimRowsWithProvidedEvidence,
  acceptedFixtureGpuRuntimeShouldStartNow:
    acceptedOutput.booleans?.gpuRuntimeShouldStartNow,
  validatorLiveQueueWritePerformed:
    acceptedOutput.evidence?.validatorLiveQueueWritePerformed,
  packageLockUnchanged: true,
}, null, 2))
