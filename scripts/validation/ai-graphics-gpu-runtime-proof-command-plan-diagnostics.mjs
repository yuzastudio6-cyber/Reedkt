import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:gpu-runtime-proof-command-plan:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-gpu-runtime-proof-command-plan-diagnostics.mjs'
const planScriptName = 'ai-graphics:gpu-runtime-proof-command-plan'
const planScriptCommand = 'tsx server/cli/ai-graphics-gpu-runtime-proof-command-plan.ts'

const modelWeightTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

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

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

const expectedManifestPaths = {
  sam2: '/opt/reeditpro/model-weights/sam2/model_tree_manifest.json',
  birefnet: '/opt/reeditpro/model-weights/birefnet/model_tree_manifest.json',
  real_esrgan: '/opt/reeditpro/model-weights/real-esrgan/model_tree_manifest.json',
  rembg: '/opt/reeditpro/model-weights/rembg/model_tree_manifest.json',
  transparent_background: '/opt/reeditpro/model-weights/transparent-background/model_tree_manifest.json',
}

const expectedProfiles = {
  gpu_worker_ai_graphics: {
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    tools: ['torch_torchvision', 'transformers', 'sam2', 'real_esrgan', 'kornia', 'rembg', 'transparent_background'],
    manifestTools: modelWeightTools,
  },
  sam2: {
    dockerfile: 'docker/prod/sam2-runtime/Dockerfile',
    tools: ['sam2', 'torch_torchvision'],
    manifestTools: ['sam2'],
  },
  birefnet: {
    dockerfile: 'docker/prod/birefnet-runtime/Dockerfile',
    tools: ['birefnet', 'transformers', 'kornia', 'torch_torchvision'],
    manifestTools: ['birefnet'],
  },
  real_esrgan: {
    dockerfile: 'docker/prod/real-esrgan-runtime/Dockerfile',
    tools: ['real_esrgan', 'torch_torchvision'],
    manifestTools: ['real_esrgan'],
  },
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

function runPlan(args = []) {
  return execFileSync('npm', ['run', '--silent', planScriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parsePlanOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_plan_output:${label}:${error.message}`)
    return {}
  }
}

function writeManifestFixtures(directory, override = {}) {
  for (const [toolId, templateId] of Object.entries(templateIdByTool)) {
    const manifest = {
      manifestId: `${toolId}_private_manifest_review_v1`,
      toolId,
      templateId,
      privateArtifactRef: `private://reeditpro/ai-graphics/model-weights/${toolId}/model_tree_manifest.json`,
      checksumSha256: 'a'.repeat(64),
      sourceLicenseRef: `private://reeditpro/license-evidence/${toolId}.json`,
      modelCardRef: `private://reeditpro/model-card/${toolId}.json`,
      commercialUseReviewed: true,
      redistributionReviewed: true,
      qualityReviewed: true,
      securityReviewed: true,
      provenanceReviewed: true,
      approvedForInternalBeta: true,
      ...(override[toolId] || {}),
    }
    fs.writeFileSync(path.join(directory, `${toolId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/cli/ai-graphics-gpu-runtime-proof-command-plan.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.md',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json',
  'docs/tool-intelligence/ai-graphics/model-weight-manifest-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json')
const manifestPacket = json('docs/tool-intelligence/ai-graphics/model-weight-manifest-review-packet.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const moduleSource = read('server/tool-registry/ai-graphics-gpu-runtime-proof-command-plan.ts')
const cliSource = read('server/cli/ai-graphics-gpu-runtime-proof-command-plan.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.md')

if (pkg.scripts?.[planScriptName] !== planScriptCommand) fail(`missing_package_script:${planScriptName}`)
if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (!index.includes("export * from './ai-graphics-gpu-runtime-proof-command-plan'")) {
  fail('server_registry_index_does_not_export_gpu_runtime_proof_command_plan')
}

if (packet.decision !== 'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (manifestPacket.decision !== 'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records') {
  fail('manifest_review_packet_source_not_accepted')
}
if (gpuGate.decision !== 'ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings') {
  fail('gpu_runtime_gate_source_not_accepted')
}
if (audit.decision !== 'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks') {
  fail('proper_install_audit_source_not_accepted')
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  gpuRuntimeTargetedTools: 8,
  modelWeightManifestRequiredTools: 5,
  runtimeProfiles: 4,
  manifestRecordsProvided: 0,
  schemaValidManifestRecords: 0,
  reviewAcceptedManifestRecords: 0,
  nativeGpuProofInputEligibleRecords: 0,
  privateArtifactRefsLogged: 0,
  runtimeReadyNow: 0,
  internalBetaReadyNow: 0,
  productionReadyNow: 0,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const tool of gpuRuntimeTools) {
  if (!packet.gpuRuntimeTargetedTools?.includes(tool)) fail(`packet_missing_gpu_runtime_tool:${tool}`)
  if (!moduleSource.includes(`'${tool}'`)) fail(`module_missing_gpu_runtime_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_gpu_runtime_tool:${tool}`)
}

for (const tool of modelWeightTools) {
  if (!packet.modelWeightManifestRequiredTools?.includes(tool)) fail(`packet_missing_model_weight_tool:${tool}`)
  if (!moduleSource.includes(`'${tool}'`)) fail(`module_missing_model_weight_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_model_weight_tool:${tool}`)
  if (!JSON.stringify(packet.modelManifestMounts || []).includes(expectedManifestPaths[tool])) {
    fail(`packet_missing_manifest_path:${tool}`)
  }
}

const profiles = new Map((packet.runtimeProfiles || []).map((profile) => [profile.profileId, profile]))
for (const [profileId, expected] of Object.entries(expectedProfiles)) {
  const profile = profiles.get(profileId)
  if (!profile) fail(`missing_runtime_profile:${profileId}`)
  if (profile?.dockerfile !== expected.dockerfile) fail(`profile_dockerfile_mismatch:${profileId}`)
  if (profile?.status !== 'planned_not_executed') fail(`profile_status_mismatch:${profileId}`)
  if (profile?.requiresDockerGpuFlag !== true) fail(`profile_missing_docker_gpu_flag:${profileId}`)
  for (const tool of expected.tools) {
    if (!profile?.tools?.includes(tool)) fail(`profile_missing_tool:${profileId}:${tool}`)
  }
  for (const tool of expected.manifestTools) {
    if (!profile?.requiresModelWeightManifests?.includes(tool)) fail(`profile_missing_manifest_tool:${profileId}:${tool}`)
  }
}

for (const token of [
  'AI_GRAPHICS_GPU_RUNTIME_PROOF_COMMAND_PLAN_DECISION',
  'buildAiGraphicsGpuRuntimeProofCommandPlan',
  'buildAiGraphicsModelWeightManifestReviewPacket',
  'ready_for_native_gpu_runtime_probe_input',
  'missing_private_manifests',
  'invalid_private_manifests',
  'docker run',
  '--gpus all',
  'REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true',
  'MODEL_DOWNLOADS_ENABLED=false',
  'PROVIDER_EXECUTION_ENABLED=false',
  '--require-model-weight-manifests',
  '<local-private-model-weight-root>',
  'model_tree_manifest.json',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--manifest-dir',
  '--manifest-file',
  '--manifest',
  'privateArtifactRefsLogged: 0',
  'commandPlanOnly: true',
  'dockerExecuted: false',
  'gpuRuntimeExecuted: false',
  'modelInferencePerformed: false',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const key of [
  'gpuRuntimeProofCommandPlanPrepared',
  'sourceManifestReviewPacketAccepted',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightManifestToolsCovered',
  'all4RuntimeProfilesCovered',
  'privateArtifactRefsNotLogged',
  'dockerGpuFlagRequired',
  'explicitRuntimeProofOptInRequired',
  'modelWeightManifestMountsPlanned',
  'nativeGpuRuntimeProofStillRequired',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
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

const noManifestOutput = runPlan()
const noManifestPlan = parsePlanOutput(noManifestOutput, 'no_manifest')
if (noManifestPlan.nativeGpuProofInputStatus !== 'missing_private_manifests') {
  fail(`no_manifest_status_mismatch:${noManifestPlan.nativeGpuProofInputStatus}`)
}
if (noManifestPlan.manifestReviewPacket?.manifestRecordsProvided !== 0) {
  fail('no_manifest_records_provided_not_zero')
}
if ((noManifestPlan.runtimeProfiles || []).length !== 4) {
  fail(`no_manifest_runtime_profile_count:${noManifestPlan.runtimeProfiles?.length}`)
}

const validDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-proof-plan-valid-'))
writeManifestFixtures(validDir)
const validOutput = runPlan(['--manifest-dir', validDir])
const validPlan = parsePlanOutput(validOutput, 'valid_manifest')
if (validPlan.nativeGpuProofInputStatus !== 'ready_for_native_gpu_runtime_probe_input') {
  fail(`valid_manifest_status_mismatch:${validPlan.nativeGpuProofInputStatus}`)
}
if (validPlan.manifestReviewPacket?.manifestRecordsProvided !== 5) fail('valid_manifest_records_provided_not_5')
if (validPlan.manifestReviewPacket?.schemaValidManifestRecords !== 5) fail('valid_manifest_schema_valid_not_5')
if (validPlan.manifestReviewPacket?.reviewAcceptedManifestRecords !== 5) fail('valid_manifest_review_accepted_not_5')
if (validPlan.manifestReviewPacket?.nativeGpuProofInputEligibleRecords !== 5) fail('valid_manifest_gpu_input_not_5')
if (validPlan.input?.privateArtifactRefsLogged !== 0) fail('valid_manifest_private_refs_logged_not_zero')
if (validOutput.includes('private://')) fail('valid_manifest_output_leaked_private_ref')
if (!validOutput.includes('--gpus all')) fail('valid_manifest_output_missing_gpus_all')
if (!validOutput.includes('REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true')) fail('valid_manifest_output_missing_opt_in_env')
if (!validOutput.includes('<local-private-model-weight-root>/sam2')) fail('valid_manifest_output_missing_mount_placeholder')
if (!validOutput.includes('--require-model-weight-manifests')) fail('valid_manifest_output_missing_manifest_flag')

const invalidDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-gpu-proof-plan-invalid-'))
writeManifestFixtures(invalidDir, {
  sam2: {
    privateArtifactRef: 'https://example.com/signed/model_tree_manifest.json?X-Goog-Signature=abc',
  },
})
let invalidExited = false
let invalidOutput = ''
try {
  invalidOutput = runPlan(['--manifest-dir', invalidDir])
} catch (error) {
  invalidExited = true
  invalidOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!invalidExited) fail('invalid_manifest_plan_did_not_exit_nonzero')
if (invalidOutput.includes('https://example.com/signed')) fail('invalid_manifest_output_leaked_public_or_signed_ref')
const invalidPlan = parsePlanOutput(invalidOutput, 'invalid_manifest')
if (invalidPlan.nativeGpuProofInputStatus !== 'invalid_private_manifests') {
  fail(`invalid_manifest_status_mismatch:${invalidPlan.nativeGpuProofInputStatus}`)
}
if (!JSON.stringify(invalidPlan).includes('invalid_public_or_signed_ref')) {
  fail('invalid_manifest_missing_invalid_public_or_signed_status')
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
  runtimeProfiles: Object.keys(expectedProfiles).length,
  noManifestStatus: noManifestPlan.nativeGpuProofInputStatus,
  validManifestStatus: validPlan.nativeGpuProofInputStatus,
  invalidManifestStatus: invalidPlan.nativeGpuProofInputStatus,
  agentCanExecuteToolsNow: packet.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: packet.booleans?.runtimeReadyNow,
  privateArtifactRefsLogged: packet.counts?.privateArtifactRefsLogged,
}, null, 2))
