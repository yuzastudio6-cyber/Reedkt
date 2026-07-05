import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold'
const runScriptCommand =
  'node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs'

const gpuTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const runtimeProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'cloudRunDeploymentPerformed',
  'cloudRunJobExecutionPerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${filePath}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(filePath) {
  try {
    return JSON.parse(read(filePath))
  } catch (error) {
    fail(`invalid_json:${filePath}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
}

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function assertSet(name, actual, expected) {
  const missing = expected.filter((item) => !actual.includes(item))
  const extra = actual.filter((item) => !expected.includes(item))
  if (missing.length) fail(`${name}_missing:${missing.join(',')}`)
  if (extra.length) fail(`${name}_extra:${extra.join(',')}`)
}

function assertFalseGates(container, label) {
  for (const key of falseGateKeys) {
    if (container?.booleans?.[key] !== false) {
      fail(`${label}_required_false_boolean_not_false:${key}`)
    }
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts',
  'server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.md',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json',
  'docker/prod/ai-graphics-gpu-runtime-readiness.py',
  'docker/prod/gpu-worker/Dockerfile',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.md')
const cli = read('server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts')
const source = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts')
const indexSource = read('server/tool-registry/index.ts')
const runtimeProbe = read('docker/prod/ai-graphics-gpu-runtime-readiness.py')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold'")) {
  fail('missing_tool_registry_export')
}

if (docs.decision !== 'ai_graphics_external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_local_only') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.currentStatus !== 'external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_pending_private_cloud_run_execution') {
  fail(`unexpected_current_status:${docs.currentStatus}`)
}
if (docs.sourceOperatorHandoffBridgeAccepted !== true) {
  fail('docs_source_operator_handoff_bridge_not_accepted')
}
assertSet('docs_gpu_tools', docs.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('docs_model_weight_tools', docs.modelWeightManifestRequiredTools || [], modelWeightTools)
assertSet('docs_runtime_profiles', docs.runtimeProfilesRequired || [], runtimeProfiles)

for (const [key, value] of Object.entries({
  cloudRunJobUsesNvidiaL4: true,
  cloudRunJobUsesOneGpuPerExecution: true,
  cloudRunJobUsesTasksOneParallelismOne: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  gpuStartsOnlyForApprovedProofJob: true,
  sourceNativeGpuProofCollectionBridgeAccepted: true,
  privateModelWeightDeliveryRequired: true,
  privateArtifactRefsRequired: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== value) fail(`docs_required_true_boolean_not_true:${key}`)
}
if (docs.booleans?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')
assertFalseGates(docs, 'docs')

if (docs.cloudRunRuntimeTarget?.platform !== 'google_cloud_run_jobs') fail('cloud_run_platform_unexpected')
if (docs.cloudRunRuntimeTarget?.gpuType !== 'nvidia-l4') fail('cloud_run_gpu_type_unexpected')
if (docs.cloudRunRuntimeTarget?.gpuCount !== 1) fail('cloud_run_gpu_count_unexpected')
if (docs.cloudRunRuntimeTarget?.tasks !== 1) fail('cloud_run_tasks_unexpected')
if (docs.cloudRunRuntimeTarget?.parallelism !== 1) fail('cloud_run_parallelism_unexpected')
if (docs.cloudRunRuntimeTarget?.maxRetries !== 0) fail('cloud_run_max_retries_unexpected')
if (docs.cloudRunRuntimeTarget?.idleGpuServiceApproved !== false) fail('cloud_run_idle_gpu_not_false')

const commandIds = (docs.cloudRunCommands || []).map((command) => command.commandId)
assertSet('cloud_run_command_ids', commandIds, [
  'write_local_job_plan',
  'deploy_on_demand_l4_proof_job',
  'execute_l4_proof_job_per_profile',
  'validate_assembled_native_gpu_result_packet',
])
const executionCommands = (docs.cloudRunCommands || []).filter((command) => command.performsCloudRunExecution === true)
if (executionCommands.length !== 1 || executionCommands[0]?.commandId !== 'execute_l4_proof_job_per_profile') {
  fail(`cloud_run_execution_command_not_exact:${executionCommands.map((command) => command.commandId).join(',')}`)
}
const deploymentCommands = (docs.cloudRunCommands || []).filter((command) => command.performsCloudRunDeployment === true)
if (deploymentCommands.length !== 1 || deploymentCommands[0]?.commandId !== 'deploy_on_demand_l4_proof_job') {
  fail(`cloud_run_deployment_command_not_exact:${deploymentCommands.map((command) => command.commandId).join(',')}`)
}

for (const needle of [
  'REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM',
  'deploy-or-run-on-demand-l4-proof-job',
  '--gpu-type=nvidia-l4',
  '--tasks=1',
  '--parallelism=1',
  '--max-retries=0',
  'MODEL_DOWNLOADS_ENABLED=false',
  'PUBLIC_ARTIFACTS_ENABLED=false',
  'SIGNED_URLS_ENABLED=false',
  'GCS_UPLOAD_ENABLED=false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'google_cloud_run_jobs',
  'nvidia-l4',
  'sourceOperatorHandoffBridgeAccepted',
  'cloudRunJobExecutionPerformed: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  'FORBIDDEN_TRUE_ENV',
  'MODEL_DOWNLOADS_ENABLED',
  'PROVIDER_EXECUTION_ENABLED',
  'PUBLIC_ARTIFACTS_ENABLED',
  'SIGNED_URLS_ENABLED',
  'GCS_UPLOAD_ENABLED',
]) {
  if (!runtimeProbe.includes(needle)) fail(`runtime_probe_missing_safety_guard:${needle}`)
}
for (const needle of [
  'Google Cloud Run Jobs',
  'nvidia-l4',
  'on-demand',
  'REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM',
  'External beta ready now: `0/21`',
]) {
  if (!markdown.includes(needle)) fail(`markdown_missing:${needle}`)
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-cloud-run-gpu-proof-scaffold-'))
const outputDir = path.join(tmpDir, 'cloud-run')
const scaffoldOutput = parseJsonOutput(runNpm(runScriptName, [
  '--source-operator-handoff-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json',
  '--private-model-weight-delivery-mode',
  'prebaked_private_image_layer',
  '--out-dir',
  outputDir,
]), 'cloud_run_job_scaffold')

if (scaffoldOutput.decision !== 'ai_graphics_external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_local_only') {
  fail(`scaffold_output_decision_unexpected:${scaffoldOutput.decision}`)
}
if (scaffoldOutput.sourceOperatorHandoffAccepted !== true) {
  fail('scaffold_output_source_handoff_not_accepted')
}
if (scaffoldOutput.sourceNativeGpuProofCollectionBridgeAccepted !== true) {
  fail('scaffold_output_source_bridge_not_accepted')
}
if (scaffoldOutput.generatedOnly !== true) fail('scaffold_output_generated_only_not_true')
if (scaffoldOutput.scriptRequiresExplicitCloudRunGpuProofConfirmation !== true) {
  fail('scaffold_output_confirmation_guard_not_true')
}
if (scaffoldOutput.cloudRunDeploymentPerformed !== false) fail('scaffold_output_deployment_not_false')
if (scaffoldOutput.cloudRunJobExecutionPerformed !== false) fail('scaffold_output_execution_not_false')

const generatedFiles = scaffoldOutput.generatedFiles || {}
for (const [key, filePath] of Object.entries(generatedFiles)) {
  if (!String(filePath).startsWith(outputDir)) fail(`generated_file_outside_output_dir:${key}:${filePath}`)
  if (!fs.existsSync(filePath)) fail(`generated_file_missing:${key}:${filePath}`)
}

const jobPlan = json(generatedFiles.jobPlan)
assertSet('generated_job_plan_gpu_tools', jobPlan.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('generated_job_plan_runtime_profiles', jobPlan.runtimeProfilesRequired || [], runtimeProfiles)
assertFalseGates(jobPlan, 'generated_job_plan')
if (jobPlan.cloudRunRuntimeTarget?.gpuType !== 'nvidia-l4') fail('generated_job_gpu_type_unexpected')
if (jobPlan.booleans?.sourceNativeGpuProofCollectionBridgeAccepted !== true) {
  fail('generated_job_source_bridge_not_true')
}
if (jobPlan.privateModelWeightDelivery?.rawGcsRefsAllowedAsEvidence !== false) {
  fail('generated_job_raw_gcs_refs_not_false')
}

const strippedBridgeOperatorPath = path.join(tmpDir, 'stripped-bridge-operator-handoff.json')
const operatorPacket = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json')
fs.writeFileSync(strippedBridgeOperatorPath, `${JSON.stringify({
  ...operatorPacket,
  sourceNativeGpuProofCollectionBridgeAccepted: false,
  booleans: {
    ...operatorPacket.booleans,
    sourceRuntimeQueueServiceProofBridgeAccepted: false,
  },
}, null, 2)}\n`, 'utf8')
const strippedOutputDir = path.join(tmpDir, 'stripped-cloud-run')
const strippedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--source-operator-handoff-packet',
  strippedBridgeOperatorPath,
  '--private-model-weight-delivery-mode',
  'prebaked_private_image_layer',
  '--out-dir',
  strippedOutputDir,
]), 'stripped_bridge_cloud_run_job_scaffold')
if (strippedOutput.sourceOperatorHandoffAccepted !== false) {
  fail('stripped_output_source_handoff_not_false')
}
if (strippedOutput.sourceNativeGpuProofCollectionBridgeAccepted !== false) {
  fail('stripped_output_source_bridge_not_false')
}

const deployScript = read(generatedFiles.deployScript)
const executeScript = read(generatedFiles.executeScript)
const checklist = read(generatedFiles.checklist)
for (const needle of [
  'REEDITPRO_AI_GRAPHICS_CLOUD_RUN_GPU_PROOF_CONFIRM',
  'gcloud run jobs deploy',
  '--gpu-type=nvidia-l4',
  '--no-gpu-zonal-redundancy',
  'MODEL_DOWNLOADS_ENABLED=false',
  'GCS_UPLOAD_ENABLED=false',
]) {
  if (!deployScript.includes(needle)) fail(`deploy_script_missing:${needle}`)
}
for (const profile of runtimeProfiles) {
  if (!executeScript.includes(`"${profile}"`)) fail(`execute_script_missing_profile:${profile}`)
}
for (const needle of [
  'gcloud run jobs update',
  'gcloud run jobs execute',
  '--wait',
  '--profile,${profile}',
  'profile-results',
]) {
  if (!executeScript.includes(needle)) fail(`execute_script_missing:${needle}`)
}
for (const needle of [
  'one NVIDIA L4 GPU',
  'not a long-lived service',
  'MODEL_DOWNLOADS_ENABLED=false',
  'Expected local outputs',
]) {
  if (!checklist.includes(needle)) fail(`checklist_missing:${needle}`)
}

const packageLockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
if (packageLockDiff.trim()) fail('package_lock_changed')

const packageJsonDiff = git(['diff', '--', 'package.json'])
for (const line of packageJsonDiff.split('\n')) {
  if (
    (line.startsWith('+') || line.startsWith('-')) &&
    !line.startsWith('+++') &&
    !line.startsWith('---') &&
    !line.includes(runScriptName) &&
    !line.includes(diagnosticScriptName) &&
    !line.includes('ai-graphics:model-weight-private-evidence-intake') &&
    !line.includes('ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector') &&
    !line.includes('ai-graphics:external-beta-evidence-admission-bundle')
  ) {
    fail(`unexpected_package_json_change:${line}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts.trim()) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const changedFiles = git(['diff', '--name-only', 'HEAD'])
const generatedPathPattern = /(^|\/)(render|renders|media|canvas|webgl|public-artifacts|signed-url|signed-urls)(\/|$)/i
for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (generatedPathPattern.test(file)) fail(`generated_output_path_changed:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  cloudRunRuntimeTarget: docs.cloudRunRuntimeTarget,
  gpuRuntimeTargetedTools: docs.gpuRuntimeTargetedTools.length,
  runtimeProfilesRequired: docs.runtimeProfilesRequired.length,
  cloudRunCommands: docs.cloudRunCommands.length,
  generatedScaffoldVerified: true,
  packageLockUnchanged: true,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  externalBetaReadyNow: docs.booleans.externalBetaReadyNow,
  productionReadyNow: docs.booleans.productionReadyNow,
}, null, 2))
