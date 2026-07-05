import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-native-gpu-proof-operator-scaffold'
const runScriptCommand =
  'node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs'

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
  'server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts',
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-scaffold.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-scaffold.md',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-scaffold.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-scaffold.md')
const cli = read('server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts')
const handoffSource = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (docs.decision !== 'ai_graphics_external_beta_native_gpu_proof_operator_scaffold_prepared_local_only') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
assertSet('docs_gpu_tools', docs.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('docs_model_weight_tools', docs.modelWeightManifestRequiredTools || [], modelWeightTools)
assertSet('docs_runtime_profiles', docs.runtimeProfilesRequired || [], runtimeProfiles)

for (const key of [
  'operatorRunbookScaffoldCreated',
  'guardedShellScriptCreated',
  'envExampleCreated',
  'operatorChecklistCreated',
  'scriptRequiresExplicitNativeGpuOperatorConfirmation',
  'scriptRequiresPrivateModelWeightRoot',
  'localOnlyEvidenceCollection',
  'privateArtifactRefsRequired',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_boolean_not_true:${key}`)
}
if (docs.booleans?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')
assertFalseGates(docs, 'docs')

for (const needle of [
  '--out-dir',
  'run-native-gpu-proof-operator.sh',
  'operator.env.example',
  'operator-checklist.md',
  'REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM',
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of ['counts?.totalAiGraphicsTools === 21', 'currentStatus', 'readyAfterEvidenceStatus']) {
  if (!handoffSource.includes(needle)) fail(`handoff_source_missing_docs_packet_shape:${needle}`)
}
for (const needle of [
  'ai-graphics:external-beta-native-gpu-proof-operator-scaffold',
  'REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM',
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT',
]) {
  if (!markdown.includes(needle)) fail(`markdown_missing:${needle}`)
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-native-gpu-operator-scaffold-'))
const outputDir = path.join(tmpDir, 'operator')
const scaffoldOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-native-gpu-proof-collection-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
  '--operator-runbook-policy-ref',
  'private://ai-graphics/external-beta/native-gpu-proof/operator-runbook',
  '--operator-access-control-ref',
  'private://ai-graphics/external-beta/native-gpu-proof/operator-access',
  '--native-gpu-host-pool-ref',
  'private://ai-graphics/external-beta/native-gpu-proof/host-pool/l4',
  '--private-model-weight-root-ref',
  'private://ai-graphics/model-weights',
  '--private-telemetry-ref',
  'private://ai-graphics/external-beta/native-gpu-proof/telemetry',
  '--rollback-ref',
  'private://ai-graphics/external-beta/native-gpu-proof/rollback',
  '--out-dir',
  outputDir,
]), 'operator_scaffold')

if (scaffoldOutput.decision !== 'ai_graphics_external_beta_native_gpu_proof_operator_scaffold_prepared_local_only') {
  fail(`scaffold_output_decision_unexpected:${scaffoldOutput.decision}`)
}
if (scaffoldOutput.generatedOnly !== true) fail('scaffold_output_generated_only_not_true')
if (scaffoldOutput.scriptRequiresExplicitNativeGpuOperatorConfirmation !== true) {
  fail('scaffold_output_confirmation_guard_not_true')
}
for (const key of [
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
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (scaffoldOutput[key] !== false) fail(`scaffold_output_required_false_not_false:${key}`)
}

const generatedFiles = scaffoldOutput.generatedFiles || {}
for (const [key, filePath] of Object.entries(generatedFiles)) {
  if (!String(filePath).startsWith(outputDir)) fail(`generated_file_outside_output_dir:${key}:${filePath}`)
  if (!fs.existsSync(filePath)) fail(`generated_file_missing:${key}:${filePath}`)
}

const handoffPacket = json(generatedFiles.handoffPacket)
if (handoffPacket.sourceCollectionAccepted !== true) fail('generated_handoff_source_not_accepted')
if (handoffPacket.operatorSteps?.length !== 11) fail(`generated_handoff_step_count:${handoffPacket.operatorSteps?.length}`)
assertSet('generated_handoff_gpu_tools', handoffPacket.gpuRuntimeTargetedTools || [], gpuTools)
assertFalseGates(handoffPacket, 'generated_handoff')

const runScript = read(generatedFiles.runScript)
for (const needle of [
  'set -euo pipefail',
  'REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM',
  'run-native-gpu-proof-on-approved-l4-host',
  'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT',
  'ai-graphics:model-weight-private-evidence-intake',
  '--model-weight-private-evidence-intake-packet',
  'bash .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh',
  'ai-graphics:external-beta-per-tool-runtime-proof',
]) {
  if (!runScript.includes(needle)) fail(`run_script_missing:${needle}`)
}
if (/npm (install|ci)\b/.test(runScript)) fail('run_script_contains_dependency_install')

const envExample = read(generatedFiles.envExample)
if (!envExample.includes('REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM=')) fail('env_missing_confirmation')
if (!envExample.includes('REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT=')) fail('env_missing_private_root')
const checklist = read(generatedFiles.checklist)
if (!checklist.includes('approved native `linux/amd64` NVIDIA L4 host')) fail('checklist_missing_l4_host')
if (!checklist.includes('External beta ready now')) fail('checklist_missing_external_state')

const basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')
if (git(['ls-files', '.local-artifacts'])) fail('local_artifacts_tracked')
const stagedFiles = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'])
  .split('\n')
  .filter(Boolean)
if (stagedFiles.some((file) => /(generated|render|renders|media|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i.test(file))) {
  fail('generated_or_public_artifact_path_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  generatedFiles: Object.keys(generatedFiles).length,
  gpuRuntimeTargetedTools: gpuTools.length,
  modelWeightManifestRequiredTools: modelWeightTools.length,
  nativeGpuRuntimeProofProfilesRequired: runtimeProfiles.length,
  operatorSteps: handoffPacket.operatorSteps?.length,
  scriptRequiresExplicitNativeGpuOperatorConfirmation: true,
  gpuRuntimePerformed: false,
  agentCanExecuteToolsNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
