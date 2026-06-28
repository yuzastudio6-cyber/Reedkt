import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-native-gpu-proof-operator-handoff'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs'

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

const requiredStepIds = [
  'scaffold_private_checksum_evidence',
  'validate_private_checksum_evidence',
  'author_private_model_manifests',
  'validate_private_model_manifests',
  'generate_native_gpu_command_plan',
  'verify_native_gpu_host',
  'run_native_gpu_profile_proof',
  'validate_native_gpu_proof_results',
  'validate_native_gpu_proof_collection',
  'recheck_external_beta_per_tool_runtime_proof',
]

const requiredFullRecheckFlags = [
  '--external-beta-tool-route-runtime-proof-packet',
  '--node-runtime-proof-packet',
  '--browser-runtime-proof-packet',
  '--satori-font-runtime-proof-packet',
  '--gpu-runtime-proof-result-packet',
  '--external-beta-per-tool-runtime-proof-policy-ref',
  '--external-beta-per-tool-runtime-proof-schema-ref',
  '--external-beta-runtime-proof-evidence-ref',
  '--external-beta-runtime-proof-telemetry-ref',
  '--external-beta-runtime-proof-rollback-ref',
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
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
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts',
  'server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts',
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-collection.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.md',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.md')
const collectionDocs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json')
const collectionSource = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-collection.ts')
const source = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts')
const cli = read('server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts')
const indexSource = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (!indexSource.includes("export * from './ai-graphics-external-beta-native-gpu-proof-operator-handoff'")) {
  fail('missing_tool_registry_export')
}

if (docs.decision !== 'ai_graphics_external_beta_native_gpu_proof_operator_handoff_prepared_with_private_evidence_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.currentStatus !== 'external_beta_native_gpu_proof_operator_handoff_prepared_with_pending_private_evidence_and_native_gpu_results') {
  fail(`unexpected_current_status:${docs.currentStatus}`)
}
if (docs.readyAfterEvidenceStatus !== 'external_beta_native_gpu_proof_operator_handoff_ready_for_per_tool_recheck_not_beta_ready') {
  fail(`unexpected_ready_after_evidence_status:${docs.readyAfterEvidenceStatus}`)
}

assertSet('docs_gpu_tools', docs.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('docs_model_weight_tools', docs.modelWeightManifestRequiredTools || [], modelWeightTools)
assertSet('docs_runtime_profiles', docs.runtimeProfilesRequired || [], runtimeProfiles)
if ((docs.operatorSteps || []).length !== 10) fail(`operator_step_count_not_10:${(docs.operatorSteps || []).length}`)
assertSet('docs_operator_steps', (docs.operatorSteps || []).map((step) => step.stepId), requiredStepIds)
for (const step of docs.operatorSteps || []) {
  if (step.stepId === 'run_native_gpu_profile_proof' && step.performsRuntimeExecution !== true) {
    fail('native_gpu_profile_step_not_runtime_execution')
  }
  if (step.stepId !== 'run_native_gpu_profile_proof' && step.performsRuntimeExecution !== false) {
    fail(`non_runtime_step_performs_execution:${step.stepId}`)
  }
}

for (const key of [
  'checksumEvidencePacket',
  'modelWeightManifestReviewPacket',
  'gpuRuntimeProofCommandPlanPacket',
  'nativeGpuHostPreflight',
  'gpuRuntimeProofResultPacket',
  'nativeGpuProofCollectionPacket',
  'perToolRuntimeProofRecheckPacket',
]) {
  if (!docs.expectedPacketPaths?.[key]?.startsWith('.local-artifacts/ai-graphics/')) {
    fail(`expected_packet_path_not_local:${key}:${docs.expectedPacketPaths?.[key]}`)
  }
}

if (docs.completionCriteria?.checksumEvidenceAccepted !== 5) fail('checksum_completion_not_5')
if (docs.completionCriteria?.privateModelManifestsAccepted !== 5) fail('manifest_completion_not_5')
if (docs.completionCriteria?.nativeGpuProofProfilesAccepted !== 6) fail('profile_completion_not_6')
if (docs.completionCriteria?.nativeGpuToolsAcceptedAfterPerToolRecheck !== 8) fail('gpu_tool_completion_not_8')
if (docs.completionCriteria?.externalBetaReadyNowTools !== 0) fail('external_beta_completion_not_zero')
if (docs.completionCriteria?.productionReadyNowTools !== 0) fail('production_completion_not_zero')

for (const needle of [
  'buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff',
  'sourceCollectionAccepted',
  'fullPerToolRuntimeProofRecheckCommandPrepared',
  'gpuRuntimeShouldStartNow: false',
  'cpuFallbackAllowedForHeavyTools: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--external-beta-native-gpu-proof-collection-packet',
  '--operator-runbook-policy-ref',
  '--private-model-weight-root-ref',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const flag of requiredFullRecheckFlags) {
  if (!source.includes(flag)) fail(`source_recheck_command_missing_flag:${flag}`)
  if (!docsMd.includes(flag)) fail(`markdown_recheck_command_missing_flag:${flag}`)
  if (!collectionSource.includes(flag)) fail(`collection_source_recheck_command_missing_flag:${flag}`)
  if (!String(collectionDocs.requiredCollectionCommands?.externalPerToolRuntimeProofRecheck || '').includes(flag)) {
    fail(`collection_docs_recheck_command_missing_flag:${flag}`)
  }
}

for (const forbidden of ['signed-url://', 'public://', 'gs://', 'gcs://', 'http://', 'https://']) {
  if (!source.includes(forbidden)) fail(`source_missing_forbidden_ref_guard:${forbidden}`)
}

for (const key of [
  'externalBetaNativeGpuProofOperatorHandoffPrepared',
  'sourceNativeGpuProofCollectionAccepted',
  'all8GpuRuntimeToolsCovered',
  'all5ModelWeightToolsCovered',
  'all6NativeGpuProfilesCovered',
  'operatorRunbookDeterministic',
  'fullPerToolRuntimeProofRecheckCommandPrepared',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'localOnlyEvidenceCollection',
  'privateArtifactRefsRequired',
  'privateArtifactRefsNotLogged',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_boolean_not_true:${key}`)
}
if (docs.booleans?.cpuFallbackAllowedForHeavyTools !== false) fail('cpu_fallback_boolean_not_false')
assertFalseGates(docs, 'docs')

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-native-gpu-operator-handoff-'))
const acceptedCollectionFixture = {
  decision: 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results',
  sourceDecision: 'ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks',
  totalAiGraphicsTools: 21,
  counts: {
    gpuRuntimeTargetedTools: 8,
    modelWeightManifestRequiredTools: 5,
    nativeGpuRuntimeProofProfilesRequired: 6,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  },
  booleans: {
    gpuRuntimeOnDemandOnly: true,
    gpuRuntimeShouldStartNow: false,
    agentCanExecuteToolsNow: false,
  },
}
const readyCollectionFixture = {
  ...acceptedCollectionFixture,
  decision: 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready',
}
const acceptedPath = writeJson(path.join(tmpDir, 'accepted-collection.json'), acceptedCollectionFixture)
const readyPath = writeJson(path.join(tmpDir, 'ready-collection.json'), readyCollectionFixture)

const privateRefs = [
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
]

const acceptedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-native-gpu-proof-collection-packet',
  acceptedPath,
  ...privateRefs,
]), 'accepted_operator_handoff')
if (acceptedOutput.decision !== 'external_beta_native_gpu_proof_operator_handoff_prepared_with_pending_private_evidence_and_native_gpu_results') {
  fail(`accepted_output_decision_unexpected:${acceptedOutput.decision}`)
}
if (acceptedOutput.sourceCollectionAccepted !== true) fail('accepted_output_source_not_accepted')
if (acceptedOutput.booleans?.readyForPerToolRuntimeProofRecheck !== false) {
  fail('accepted_output_ready_for_recheck_not_false')
}
assertSet('accepted_output_gpu_tools', acceptedOutput.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('accepted_output_profiles', acceptedOutput.runtimeProfilesRequired || [], runtimeProfiles)
assertFalseGates(acceptedOutput, 'accepted_output')

const readyOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-native-gpu-proof-collection-packet',
  readyPath,
  ...privateRefs,
]), 'ready_operator_handoff')
if (readyOutput.decision !== 'external_beta_native_gpu_proof_operator_handoff_ready_for_per_tool_recheck_not_beta_ready') {
  fail(`ready_output_decision_unexpected:${readyOutput.decision}`)
}
if (readyOutput.booleans?.readyForPerToolRuntimeProofRecheck !== true) {
  fail('ready_output_ready_for_recheck_not_true')
}
assertFalseGates(readyOutput, 'ready_output')

const unsafeOutput = parseJsonOutput(runNpm(runScriptName, [
  '--external-beta-native-gpu-proof-collection-packet',
  acceptedPath,
  '--operator-runbook-policy-ref',
  'https://example.invalid/runbook',
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
]), 'unsafe_operator_handoff')
if (unsafeOutput.decision !== 'missing_external_beta_native_gpu_proof_operator_controls') {
  fail(`unsafe_output_decision_unexpected:${unsafeOutput.decision}`)
}
if (!unsafeOutput.missingOperatorControls?.includes('operatorRunbookPolicyRef')) {
  fail('unsafe_output_missing_control_not_reported')
}

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
  currentDecision: acceptedOutput.decision,
  readyAfterEvidenceDecision: readyOutput.decision,
  gpuRuntimeTargetedTools: gpuTools.length,
  modelWeightManifestRequiredTools: modelWeightTools.length,
  nativeGpuRuntimeProofProfilesRequired: runtimeProfiles.length,
  operatorSteps: requiredStepIds.length,
  fullPerToolRuntimeProofRecheckCommandPrepared: true,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
}, null, 2))
