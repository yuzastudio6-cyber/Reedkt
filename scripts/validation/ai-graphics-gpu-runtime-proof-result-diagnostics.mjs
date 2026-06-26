import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const validateScriptName = 'ai-graphics:gpu-runtime-proof-result:validate'
const validateScriptCommand = 'tsx server/cli/ai-graphics-gpu-runtime-proof-result.ts'
const diagnosticScriptName = 'ai-graphics:gpu-runtime-proof-result:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-gpu-runtime-proof-result-diagnostics.mjs'

const gpuRuntimeTools = [
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

const requiredProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
]

const requiredImportsByProfile = {
  gpu_worker_ai_graphics: [
    'torch',
    'torchvision',
    'transformers',
    'kornia',
    'rembg',
    'transparent_background',
    'realesrgan',
    'sam2',
  ],
  sam2: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'hydra',
    'iopath',
    'sam2',
  ],
  birefnet: [
    'torch',
    'torchvision',
    'transformers',
    'safetensors',
    'PIL',
    'cv2',
    'numpy',
    'timm',
    'kornia',
    'einops',
    'scipy',
    'skimage',
  ],
  real_esrgan: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'cv2',
    'basicsr',
    'realesrgan',
  ],
}

const requiredManifestToolsByProfile = {
  gpu_worker_ai_graphics: modelWeightTools,
  sam2: ['sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['real_esrgan'],
}

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

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
  }).trim()
}

function runValidate(args = []) {
  return execFileSync('npm', ['run', '--silent', validateScriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_validate_output:${label}:${error.message}`)
    return {}
  }
}

function manifestCheck(toolId) {
  return {
    toolId,
    manifestPath: `/opt/reeditpro/model-weights/${toolId}/model_tree_manifest.json`,
    manifestId: `${toolId}_private_manifest_review_v1`,
    templateId: templateIdByTool[toolId],
    privateArtifactRefStatus: 'present_private_ref_not_logged',
    checksumSha256: 'b'.repeat(64),
    status: 'validated_not_loaded',
  }
}

function proofResult(profile, overrides = {}) {
  return {
    status: 'passed',
    profile,
    imports: requiredImportsByProfile[profile].map((label) => ({
      label,
      module: label,
      version: 'fixture',
    })),
    nvidiaSmi: {
      available: true,
      returncode: 0,
      stdout: 'NVIDIA L4, 550.54.15, 23034 MiB',
      stderr: '',
    },
    cuda: {
      available: true,
      deviceCount: 1,
      deviceName: 'NVIDIA L4',
      capability: '8.9',
      minCapabilityRequired: '8.9',
      tinyTensorProbePassed: true,
    },
    modelManifestChecks: requiredManifestToolsByProfile[profile].map(manifestCheck),
    modelWeightsLoaded: false,
    mediaProcessed: false,
    providerRuntimeUsed: false,
    toolRouteExecutionReadyNow: false,
    workerExecutionReadyNow: false,
    runtimeBetaReadyNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    ...overrides,
  }
}

function writeProofFixtures(directory, overridesByProfile = {}) {
  for (const profile of requiredProfiles) {
    fs.writeFileSync(
      path.join(directory, `${profile}.json`),
      `${JSON.stringify(proofResult(profile, overridesByProfile[profile] || {}), null, 2)}\n`,
      'utf8',
    )
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts',
  'server/cli/ai-graphics-gpu-runtime-proof-result.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/tool-registry/index.ts',
  'docker/prod/ai-graphics-gpu-runtime-readiness.py',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.md',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json')
const commandPlan = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const betaGate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const moduleSource = read('server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts')
const cliSource = read('server/cli/ai-graphics-gpu-runtime-proof-result.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.md')

if (pkg.scripts?.[validateScriptName] !== validateScriptCommand) fail(`missing_package_script:${validateScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-gpu-runtime-proof-result'")) {
  fail('server_registry_index_does_not_export_gpu_runtime_proof_result')
}

if (packet.decision !== 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (packet.status !== 'missing_native_gpu_runtime_proof_results') fail(`unexpected_packet_status:${packet.status}`)
if (commandPlan.decision !== 'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks') {
  fail('source_command_plan_not_accepted')
}
if (audit.decision !== 'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks') {
  fail('proper_install_audit_source_not_accepted')
}
if (betaGate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail('beta_gate_source_not_accepted')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestRequiredTools: 5,
  runtimeProfilesRequired: 4,
  runtimeProofResultsProvided: 0,
  runtimeProofResultsAcceptedForOwnerReview: 0,
  runtimeReadyNow: 0,
  internalBetaReadyNow: 0,
  productionReadyNow: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of gpuRuntimeTools) {
  if (!packet.gpuRuntimeTargetedTools?.includes(tool)) fail(`packet_missing_gpu_tool:${tool}`)
  if (!moduleSource.includes(`'${tool}'`)) fail(`module_missing_gpu_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_gpu_tool:${tool}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestRequiredTools?.includes(tool)) fail(`packet_missing_model_weight_tool:${tool}`)
  if (!moduleSource.includes(`'${tool}'`)) fail(`module_missing_model_weight_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_model_weight_tool:${tool}`)
}

for (const profile of requiredProfiles) {
  if (!packet.runtimeProfilesRequired?.includes(profile)) fail(`packet_missing_profile:${profile}`)
  if (!moduleSource.includes(profile)) fail(`module_missing_profile:${profile}`)
  if (!markdown.includes(`\`${profile}\``)) fail(`markdown_missing_profile:${profile}`)
}

for (const token of [
  'status_passed',
  'exact_profile_id',
  'nvidia_smi_available',
  'cuda_available',
  'cuda_device_count_at_least_1',
  'cuda_capability_at_least_8_9',
  'tiny_cuda_tensor_probe_passed',
  'profile_imports_present',
  'model_manifest_checks_validated_not_loaded',
  'private_artifact_refs_not_logged',
  'runtime_side_effect_fields_false',
]) {
  if (!JSON.stringify(packet).includes(token)) fail(`packet_missing_required_proof_check:${token}`)
}

for (const token of [
  'buildAiGraphicsGpuRuntimeProofResultPacket',
  'ready_for_owner_review_not_beta_ready',
  'missing_native_gpu_runtime_proof_results',
  'invalid_native_gpu_runtime_proof_results',
  'capability>=8.9',
  'privateArtifactRefStatus',
  'validated_not_loaded',
]) {
  if (!moduleSource.includes(token) && !markdown.includes(token) && !JSON.stringify(packet).includes(token)) {
    fail(`missing_contract_token:${token}`)
  }
}

for (const token of [
  '--result-dir',
  '--result-file',
  '--result',
  'privateArtifactRefsLogged: 0',
  'validatorOnly: true',
  'dockerExecuted: false',
  'gpuRuntimeExecuted: false',
  'modelWeightsLoaded: false',
  'modelInferencePerformed: false',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const key of [
  'gpuRuntimeProofResultValidatorPrepared',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightManifestToolsCovered',
  'all4RuntimeProfilesCovered',
  'privateArtifactRefsNotLogged',
  'ownerReviewStillRequired',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'nativeGpuRuntimeProofResultsAcceptedForOwnerReview',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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
]) {
  if (packet.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const noInputOutput = runValidate()
const noInputPacket = parseOutput(noInputOutput, 'no_input')
if (noInputPacket.status !== 'missing_native_gpu_runtime_proof_results') {
  fail(`no_input_status_mismatch:${noInputPacket.status}`)
}
if (noInputPacket.runtimeProofResultsProvided !== 0) fail('no_input_results_provided_not_zero')
if (noInputPacket.input?.privateArtifactRefsLogged !== 0) fail('no_input_private_refs_logged_not_zero')

const validDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-proof-results-valid-'))
writeProofFixtures(validDir)
const validOutput = runValidate(['--result-dir', validDir])
const validPacket = parseOutput(validOutput, 'valid_results')
if (validPacket.status !== 'ready_for_owner_review_not_beta_ready') {
  fail(`valid_results_status_mismatch:${validPacket.status}`)
}
if (validPacket.runtimeProofResultsProvided !== 4) fail('valid_results_provided_not_4')
if (validPacket.runtimeProofResultsAcceptedForOwnerReview !== 4) fail('valid_results_accepted_not_4')
if (validPacket.nativeGpuRuntimeProofResultsAccepted !== true) fail('valid_results_not_accepted')
if (validPacket.booleans?.gpuRuntimeApprovedNow !== false) fail('valid_results_gpu_runtime_approved_now_not_false')
if (validPacket.booleans?.runtimeReadyNow !== false) fail('valid_results_runtime_ready_now_not_false')
if (validPacket.booleans?.internalBetaReadyNow !== false) fail('valid_results_internal_beta_not_false')
if (/private:\/\//i.test(validOutput)) fail('valid_results_output_leaked_private_ref')
if (/https?:\/\//i.test(validOutput)) fail('valid_results_output_leaked_http_ref')

const invalidDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-proof-results-invalid-'))
writeProofFixtures(invalidDir, {
  sam2: {
    cuda: {
      available: true,
      deviceCount: 1,
      deviceName: 'NVIDIA L4',
      capability: '8.0',
      minCapabilityRequired: '8.9',
      tinyTensorProbePassed: true,
    },
    modelWeightsLoaded: true,
  },
})
let invalidExited = false
let invalidOutput = ''
try {
  invalidOutput = runValidate(['--result-dir', invalidDir])
} catch (error) {
  invalidExited = true
  invalidOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!invalidExited) fail('invalid_results_did_not_exit_nonzero')
const invalidPacket = parseOutput(invalidOutput, 'invalid_results')
if (invalidPacket.status !== 'invalid_native_gpu_runtime_proof_results') {
  fail(`invalid_results_status_mismatch:${invalidPacket.status}`)
}
if (!JSON.stringify(invalidPacket).includes('capability>=8.9')) fail('invalid_results_missing_capability_error')
if (!JSON.stringify(invalidPacket).includes('modelWeightsLoaded must be false')) fail('invalid_results_missing_false_gate_error')

const leakDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-proof-results-leak-'))
writeProofFixtures(leakDir, {
  real_esrgan: {
    privateArtifactRef: 'private://reeditpro/ai-graphics/model-weights/real-esrgan/model.bin',
  },
})
let leakExited = false
let leakOutput = ''
try {
  leakOutput = runValidate(['--result-dir', leakDir])
} catch (error) {
  leakExited = true
  leakOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!leakExited) fail('leaked_private_ref_result_did_not_exit_nonzero')
if (/private:\/\/reeditpro/i.test(leakOutput)) fail('leaked_private_ref_output_included_raw_private_ref')
if (!JSON.stringify(parseOutput(leakOutput, 'leaked_private_ref')).includes('raw private')) {
  fail('leaked_private_ref_missing_redaction_error')
}

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /modelInferencePerformed["`:\s]+true/i,
  /mediaProcessingPerformed["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

for (const [label, text] of [
  ['module', moduleSource],
  ['cli', cliSource],
  ['markdown', markdown],
  ['packet', JSON.stringify(packet)],
]) {
  for (const pattern of forbiddenTruePatterns) {
    if (pattern.test(text)) fail(`forbidden_runtime_claim:${label}:${pattern}`)
  }
}

const packageLockDiff = git(['diff', '--name-only', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

const changedPackageJson = git(['diff', '--', 'package.json'])
if (/dependencies|devDependencies|optionalDependencies|peerDependencies/.test(changedPackageJson)) {
  fail('package_dependency_section_changed')
}

const changedFiles = git(['diff', '--name-only'])
for (const file of changedFiles.split('\n').filter(Boolean)) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(dist|build|coverage|public\/generated|generated|render|renders|browser-output|canvas-output|webgl-output|media-output)\//i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
}

try {
  git(['cat-file', '-e', `${baseRef}:package-lock.json`])
  const lockDiff = git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])
  if (lockDiff) fail('package_lock_differs_from_base')
} catch {
  fail(`base_ref_unavailable:${baseRef}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  gpuRuntimeTools: gpuRuntimeTools.length,
  modelWeightManifestTools: modelWeightTools.length,
  runtimeProfiles: requiredProfiles.length,
  noInputStatus: noInputPacket.status,
  validProofStatus: validPacket.status,
  invalidProofStatus: invalidPacket.status,
  agentCanExecuteToolsNow: packet.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: packet.booleans?.gpuRuntimeApprovedNow,
  runtimeReadyNow: packet.booleans?.runtimeReadyNow,
  packageLockChanged: false,
}, null, 2))
