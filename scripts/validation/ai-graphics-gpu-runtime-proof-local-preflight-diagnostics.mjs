import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const preflightScriptName = 'ai-graphics:gpu-runtime-proof-local-preflight'
const preflightScriptCommand = 'tsx server/cli/ai-graphics-gpu-runtime-proof-local-preflight.ts'
const diagnosticScriptName = 'ai-graphics:gpu-runtime-proof-local-preflight:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-gpu-runtime-proof-local-preflight-diagnostics.mjs'

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
  sam2: ['torch', 'torchvision', 'numpy', 'PIL', 'cv2', 'hydra', 'iopath', 'sam2'],
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
  real_esrgan: ['torch', 'torchvision', 'numpy', 'PIL', 'cv2', 'basicsr', 'realesrgan'],
}

const manifestToolsByProfile = {
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

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
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

function runNpm(args) {
  return execFileSync('npm', ['run', '--silent', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_output:${label}:${error.message}`)
    return {}
  }
}

function validManifest(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    privateArtifactRef: `private://reeditpro/ai-graphics/model-weights/${directoryNameByTool[toolId]}/model_tree_manifest.json`,
    checksumSha256: 'c'.repeat(64),
    sourceLicenseRef: `private://reeditpro/license-evidence/${toolId}.json`,
    modelCardRef: `private://reeditpro/model-card/${toolId}.json`,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  }
}

function writeManifestFixtures(root) {
  for (const toolId of modelWeightTools) {
    const directory = path.join(root, directoryNameByTool[toolId])
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(
      path.join(directory, 'model_tree_manifest.json'),
      `${JSON.stringify(validManifest(toolId), null, 2)}\n`,
      'utf8',
    )
  }
}

function manifestCheck(toolId) {
  return {
    toolId,
    manifestId: `${toolId}_private_manifest_review_v1`,
    templateId: templateIdByTool[toolId],
    privateArtifactRefStatus: 'present_private_ref_not_logged',
    checksumSha256: 'd'.repeat(64),
    status: 'validated_not_loaded',
  }
}

function proofResult(profile) {
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
    modelManifestChecks: manifestToolsByProfile[profile].map(manifestCheck),
    modelWeightsLoaded: false,
    mediaProcessed: false,
    providerRuntimeUsed: false,
    toolRouteExecutionReadyNow: false,
    workerExecutionReadyNow: false,
    runtimeBetaReadyNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function writeProofResultFixtures(root, override = {}) {
  fs.mkdirSync(root, { recursive: true })
  for (const profile of runtimeProfiles) {
    fs.writeFileSync(
      path.join(root, `${profile}.json`),
      `${JSON.stringify({ ...proofResult(profile), ...(override[profile] || {}) }, null, 2)}\n`,
      'utf8',
    )
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-gpu-runtime-proof-local-preflight.ts',
  'server/cli/ai-graphics-gpu-runtime-proof-local-preflight.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.md',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-scaffold.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json')
const commandPlanPacket = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const resultPacket = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-result-packet.json')
const betaEvidence = json('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json')
const moduleSource = read('server/tool-registry/ai-graphics-gpu-runtime-proof-local-preflight.ts')
const cliSource = read('server/cli/ai-graphics-gpu-runtime-proof-local-preflight.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.md')

if (pkg.scripts?.[preflightScriptName] !== preflightScriptCommand) fail(`missing_package_script:${preflightScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-gpu-runtime-proof-local-preflight'")) {
  fail('server_registry_index_does_not_export_local_preflight')
}

if (packet.decision !== 'ai_graphics_gpu_runtime_proof_local_preflight_prepared_with_manifest_and_result_blocks') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (commandPlanPacket.decision !== 'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks') {
  fail('command_plan_source_not_accepted')
}
if (resultPacket.decision !== 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results') {
  fail('gpu_result_packet_source_not_accepted')
}
if (betaEvidence.decision !== 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults') {
  fail('beta_evidence_source_not_accepted')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestRequiredTools: 5,
  runtimeProfilesRequired: 4,
  localManifestFilesRead: 0,
  localProofResultFilesRead: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const token of [
  'AI_GRAPHICS_GPU_RUNTIME_PROOF_LOCAL_PREFLIGHT_DECISION',
  'buildAiGraphicsGpuRuntimeProofLocalPreflight',
  'buildAiGraphicsGpuRuntimeProofCommandPlan',
  'buildAiGraphicsGpuRuntimeProofResultPacket',
  'reviewed_private_model_weight_manifests',
  'native_gpu_runtime_proof_results',
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT',
  'hostEligibleForNativeGpuProof',
  'native_linux_amd64_nvidia_host',
  '.local-artifacts/ai-graphics/gpu-runtime-proof-results',
  'ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--manifest-dir',
  '--result-dir',
  '--require-ready-for-owner-review',
  '--require-manifests-ready',
  '--require-results-ready',
  '--detect-host',
  '--require-host-eligible',
  'hostDetectionRequested',
  'dockerExecuted: false',
  'gpuRuntimeExecuted: false',
  'modelWeightsLoaded: false',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

if (!markdown.includes('--require-ready-for-owner-review')) fail('markdown_missing_require_ready_command')
if (!markdown.includes('--require-host-eligible')) fail('markdown_missing_require_host_eligible_command')
if (!markdown.includes('REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT')) fail('markdown_missing_private_model_weight_root_env')
if (packet.localEvidenceRoots?.privateModelWeightRootEnv !== 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT') {
  fail('packet_missing_private_model_weight_root_env')
}
if (packet.hostEnvironment?.checkMode !== 'not_requested') fail('packet_default_host_check_not_not_requested')
if (packet.hostEnvironment?.hostEligibleForNativeGpuProof !== false) fail('packet_default_host_eligible_not_false')
if (!JSON.stringify(packet).includes('reviewed_private_model_weight_manifests')) fail('packet_missing_manifest_gap')
if (!JSON.stringify(packet).includes('native_gpu_runtime_proof_results')) fail('packet_missing_gpu_result_gap')
if (!JSON.stringify(packet.requiredNextCommands || []).includes('export REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT=<local-only-private-model-weight-root>')) {
  fail('packet_missing_private_model_weight_root_export_command')
}
if (!JSON.stringify(packet.requiredNextCommands || []).includes('--detect-host --require-host-eligible')) {
  fail('packet_missing_host_eligible_preflight_command')
}

for (const key of [
  'gpuRuntimeProofLocalPreflightPrepared',
  'commandPlanAccepted',
  'proofResultPacketAccepted',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightManifestToolsCovered',
  'all4RuntimeProfilesCovered',
  'privateArtifactRefsNotLogged',
  'nativeGpuProofHostCheckAvailable',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'modelManifestsReadyForGpuProof',
  'nativeGpuProofResultsAcceptedForOwnerReview',
  'allGpuRuntimeEvidenceReadyForOwnerReview',
  'hostEligibleForNativeGpuProof',
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

let noInputExited = false
let noInputOutput = ''
try {
  noInputOutput = runNpm([preflightScriptName, '--', '--require-ready-for-owner-review'])
} catch (error) {
  noInputExited = true
  noInputOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!noInputExited) fail('no_input_require_ready_did_not_exit_nonzero')
const noInput = parseOutput(noInputOutput, 'no_input')
if (noInput.manifestInputStatus !== 'missing_private_manifests') fail('no_input_manifest_status_not_missing')
if (noInput.proofResultInputStatus !== 'missing_native_gpu_runtime_proof_results') fail('no_input_result_status_not_missing')
if (noInput.allGpuRuntimeEvidenceReadyForOwnerReview !== false) fail('no_input_unexpected_ready')

const detectedHostOutput = runNpm([preflightScriptName, '--', '--detect-host'])
const detectedHost = parseOutput(detectedHostOutput, 'detected_host')
if (detectedHost.hostEnvironment?.checkMode !== 'detected') fail('detected_host_check_not_detected')
if (typeof detectedHost.hostEnvironment?.hostEligibleForNativeGpuProof !== 'boolean') {
  fail('detected_host_eligible_not_boolean')
}
if (!Array.isArray(detectedHost.hostEnvironment?.blockers)) fail('detected_host_blockers_not_array')
if (detectedHost.input?.hostDetectionRequested !== true) fail('detected_host_input_flag_not_true')

let requireHostOutput = ''
let requireHostExited = false
try {
  requireHostOutput = runNpm([preflightScriptName, '--', '--detect-host', '--require-host-eligible'])
} catch (error) {
  requireHostExited = true
  requireHostOutput = `${error.stdout || ''}${error.stderr || ''}`
}
const requireHost = parseOutput(requireHostOutput, 'require_host')
if (requireHost.hostEnvironment?.hostEligibleForNativeGpuProof === true && requireHostExited) {
  fail('require_host_exited_on_eligible_host')
}
if (requireHost.hostEnvironment?.hostEligibleForNativeGpuProof === false && !requireHostExited) {
  fail('require_host_did_not_exit_on_ineligible_host')
}

const manifestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-local-preflight-manifests-'))
writeManifestFixtures(manifestDir)
const manifestOnlyOutput = runNpm([
  preflightScriptName,
  '--',
  '--manifest-dir',
  manifestDir,
  '--require-manifests-ready',
])
const manifestOnly = parseOutput(manifestOnlyOutput, 'manifest_only')
if (manifestOnly.modelManifestsReadyForGpuProof !== true) fail('manifest_only_not_ready_for_gpu_proof')
if (manifestOnly.nativeGpuProofResultsAcceptedForOwnerReview !== false) fail('manifest_only_unexpected_gpu_results_ready')
if (manifestOnly.allGpuRuntimeEvidenceReadyForOwnerReview !== false) fail('manifest_only_unexpected_all_ready')
if (manifestOnlyOutput.includes('private://reeditpro')) fail('manifest_only_output_leaked_private_ref')

const resultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-local-preflight-results-'))
writeProofResultFixtures(resultDir)
const fullOutput = runNpm([
  preflightScriptName,
  '--',
  '--manifest-dir',
  manifestDir,
  '--result-dir',
  resultDir,
  '--require-ready-for-owner-review',
])
const full = parseOutput(fullOutput, 'full')
if (full.modelManifestsReadyForGpuProof !== true) fail('full_manifests_not_ready')
if (full.nativeGpuProofResultsAcceptedForOwnerReview !== true) fail('full_results_not_ready')
if (full.allGpuRuntimeEvidenceReadyForOwnerReview !== true) fail('full_all_not_ready')
if (full.localManifestFilesRead !== 5) fail(`full_manifest_file_count:${full.localManifestFilesRead}`)
if (full.localProofResultFilesRead !== 4) fail(`full_result_file_count:${full.localProofResultFilesRead}`)
if (full.missingLocalEvidence?.length !== 0) fail('full_missing_local_evidence_not_empty')
if (fullOutput.includes('private://reeditpro')) fail('full_output_leaked_private_ref')

const badResultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-local-preflight-bad-results-'))
writeProofResultFixtures(badResultDir, {
  sam2: {
    cuda: {
      available: false,
      deviceCount: 0,
      capability: '0.0',
      tinyTensorProbePassed: false,
    },
  },
})
let badResultExited = false
let badResultOutput = ''
try {
  badResultOutput = runNpm([
    preflightScriptName,
    '--',
    '--manifest-dir',
    manifestDir,
    '--result-dir',
    badResultDir,
    '--require-results-ready',
  ])
} catch (error) {
  badResultExited = true
  badResultOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!badResultExited) fail('bad_result_require_results_did_not_exit_nonzero')
const badResult = parseOutput(badResultOutput, 'bad_result')
if (badResult.proofResultInputStatus !== 'invalid_native_gpu_runtime_proof_results') {
  fail(`bad_result_status:${badResult.proofResultInputStatus}`)
}
if (badResult.nativeGpuProofResultsAcceptedForOwnerReview !== false) fail('bad_result_unexpected_ready')

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

if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')
const changedPackageJson = git(['diff', '--', 'package.json'])
if (/dependencies|devDependencies|optionalDependencies|peerDependencies/.test(changedPackageJson)) {
  fail('package_dependency_section_changed')
}

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of changedFiles) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) {
    fail(`generated_media_or_font_changed:${file}`)
  }
}

try {
  git(['cat-file', '-e', `${baseRef}:package-lock.json`])
  if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_differs_from_base')
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
  gpuRuntimeTools: packet.counts?.gpuRuntimeTargetedTools,
  modelWeightManifestTools: packet.counts?.modelWeightManifestRequiredTools,
  runtimeProfiles: packet.counts?.runtimeProfilesRequired,
  defaultManifestStatus: noInput.manifestInputStatus,
  defaultProofResultStatus: noInput.proofResultInputStatus,
  manifestOnlyReady: manifestOnly.modelManifestsReadyForGpuProof,
  fullLocalPreflightReadyForOwnerReview: full.allGpuRuntimeEvidenceReadyForOwnerReview,
  badResultStatus: badResult.proofResultInputStatus,
  agentCanExecuteToolsNow: packet.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: packet.booleans?.runtimeReadyNow,
}, null, 2))
