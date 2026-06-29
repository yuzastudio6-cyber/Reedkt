import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector'
const runScriptCommand =
  'node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs'
const validateScriptName = 'ai-graphics:gpu-runtime-proof-result:validate'

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

const runtimeProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
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
  rembg: ['torch', 'numpy', 'PIL', 'cv2', 'rembg'],
  transparent_background: ['torch', 'torchvision', 'numpy', 'PIL', 'transparent_background'],
}

const manifestToolsByProfile = {
  gpu_worker_ai_graphics: modelWeightTools,
  sam2: ['sam2'],
  birefnet: ['birefnet'],
  real_esrgan: ['real_esrgan'],
  rembg: ['rembg'],
  transparent_background: ['transparent_background'],
}

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
}

const sourceCandidateIdByTool = {
  sam2: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
  birefnet: 'zhengpeng7_birefnet_official_weights_review_candidate',
  real_esrgan: 'xinntao_real_esrgan_x4plus',
  rembg: 'danielgatis_rembg_isnet_general_use_review_candidate',
  transparent_background: 'plemeri_transparent_background_base_ckpt_review_candidate',
}

const sourceCatalogChecksumSha256ByTool = {
  sam2: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  birefnet: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  real_esrgan: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  rembg: null,
  transparent_background: null,
}

const sourceCatalogChecksumEvidenceStatusByTool = {
  sam2: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
  birefnet: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
  real_esrgan: 'release_asset_checksum_required_before_private_manifest',
  rembg: 'checksum_required_before_private_manifest',
  transparent_background: 'checksum_required_before_private_manifest',
}

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

function manifestCheck(toolId) {
  return {
    toolId,
    manifestPath: `/opt/reeditpro/model-weights/${toolId}/model_tree_manifest.json`,
    manifestId: `${toolId}_private_manifest_review_v1`,
    templateId: templateIdByTool[toolId],
    sourceCandidateId: sourceCandidateIdByTool[toolId],
    sourceCatalogSuggestedChecksumSha256: sourceCatalogChecksumSha256ByTool[toolId],
    sourceCatalogChecksumEvidenceStatus: sourceCatalogChecksumEvidenceStatusByTool[toolId],
    privateArtifactRefStatus: 'present_private_ref_not_logged',
    checksumEvidenceRefStatus: 'present_private_ref_not_logged',
    checksumSha256: sourceCatalogChecksumSha256ByTool[toolId] ?? 'b'.repeat(64),
    status: 'validated_not_loaded',
  }
}

function proofResult(profile) {
  return {
    status: 'passed',
    profile,
    proofMetadata: {
      probeName: 'reeditpro_ai_graphics_gpu_runtime_readiness',
      probeVersion: '2026-06-26.native-gpu-proof-v1',
      runtimePlatform: 'linux',
      runtimeMachine: 'x86_64',
      pythonVersion: '3.11.0',
      nativeGpuRuntimeProof: true,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      providerRuntimePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts',
  'server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts',
  'server/tool-registry/index.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-result-collector.json',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-result-collector.md',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-result-collector.json')
const markdown = read('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-result-collector.md')
const cli = read('server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts')
const source = read('server/tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts')
const indexSource = read('server/tool-registry/index.ts')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!indexSource.includes("export * from './ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector'")) {
  fail('missing_tool_registry_export')
}

if (docs.decision !== 'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.currentStatus !== 'external_beta_native_gpu_proof_cloud_run_result_collector_prepared_pending_private_cloud_run_logs') {
  fail(`unexpected_current_status:${docs.currentStatus}`)
}
if (docs.sourceCloudRunJobScaffoldBridgeAccepted !== true) {
  fail('docs_source_scaffold_bridge_not_accepted')
}
assertSet('docs_gpu_tools', docs.gpuRuntimeTargetedTools || [], gpuTools)
assertSet('docs_runtime_profiles', docs.runtimeProfilesRequired || [], runtimeProfiles)
for (const profile of runtimeProfiles) {
  if (!docs.expectedLogFiles?.[profile]?.includes(`native-gpu-profile-${profile}-logs.txt`)) {
    fail(`docs_missing_expected_log_file:${profile}`)
  }
}
for (const [key, value] of Object.entries({
  sourceCloudRunJobScaffoldAccepted: true,
  sourceNativeGpuProofCollectionBridgeAccepted: true,
  all8GpuRuntimeToolsCovered: true,
  all6NativeGpuProfilesCovered: true,
  parsesCloudRunLogsOnly: true,
  writesLocalExtractedJsonOnly: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  localOnlyCollector: true,
  agentCanSelectForPlanning: true,
})) {
  if (docs.booleans?.[key] !== value) fail(`docs_required_true_boolean_not_true:${key}`)
}
if (docs.booleans?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')
assertFalseGates(docs, 'docs')

for (const needle of [
  '--logs-dir',
  '--out-dir',
  'proofResultFromLog',
  'cloudRunDeploymentPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const needle of [
  'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only',
  'sourceCloudRunJobScaffoldBridgeAccepted',
  'parsesCloudRunLogsOnly',
  'cloudRunJobExecutionPerformed: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  'ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector',
  'ai-graphics:gpu-runtime-proof-result:validate',
  'sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence=21',
  'Native GPU proof profiles accepted now: `0/6`',
]) {
  if (!markdown.includes(needle)) fail(`markdown_missing:${needle}`)
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-cloud-run-result-collector-'))
const logsDir = path.join(tmpDir, 'logs')
const outDir = path.join(tmpDir, 'out')
fs.mkdirSync(logsDir, { recursive: true })
for (const profile of runtimeProfiles) {
  const result = proofResult(profile)
  const logLine = profile === 'sam2'
    ? JSON.stringify({ textPayload: JSON.stringify(result) })
    : `2026-06-28T00:00:00Z stdout ${JSON.stringify(result)}`
  fs.writeFileSync(
    path.join(logsDir, `native-gpu-profile-${profile}-logs.txt`),
    `starting profile ${profile}\n${logLine}\nfinished profile ${profile}\n`,
    'utf8',
  )
}

const collectorOutput = parseJsonOutput(runNpm(runScriptName, [
  '--source-cloud-run-job-scaffold-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json',
  '--logs-dir',
  logsDir,
  '--out-dir',
  outDir,
]), 'cloud_run_result_collector')

if (collectorOutput.decision !== 'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only') {
  fail(`collector_output_decision_unexpected:${collectorOutput.decision}`)
}
if (collectorOutput.runtimeProfilesExtracted !== 6) {
  fail(`collector_output_profile_count_unexpected:${collectorOutput.runtimeProfilesExtracted}`)
}
if (collectorOutput.sourceCloudRunJobScaffoldAccepted !== true) {
  fail('collector_output_source_scaffold_not_accepted')
}
if (collectorOutput.sourceNativeGpuProofCollectionBridgeAccepted !== true) {
  fail('collector_output_source_bridge_not_accepted')
}
for (const profile of runtimeProfiles) {
  const extractedPath = collectorOutput.extractedProfileResults?.[profile]
  if (!extractedPath || !fs.existsSync(extractedPath)) fail(`missing_extracted_profile_result:${profile}`)
  const extracted = extractedPath ? JSON.parse(fs.readFileSync(extractedPath, 'utf8')) : {}
  if (extracted.profile !== profile) fail(`extracted_profile_mismatch:${profile}:${extracted.profile}`)
}
if (!fs.existsSync(collectorOutput.collectorPacket)) fail('collector_packet_missing')
const collectorPacket = collectorOutput.collectorPacket && fs.existsSync(collectorOutput.collectorPacket)
  ? JSON.parse(fs.readFileSync(collectorOutput.collectorPacket, 'utf8'))
  : {}
if (collectorPacket.sourceCloudRunJobScaffoldBridgeAccepted !== true) {
  fail('collector_packet_source_bridge_not_accepted')
}
if (collectorPacket.booleans?.sourceNativeGpuProofCollectionBridgeAccepted !== true) {
  fail('collector_packet_source_native_gpu_bridge_not_accepted')
}

const strippedScaffoldPath = path.join(tmpDir, 'cloud-run-job-scaffold-stripped-bridge.json')
const strippedScaffold = JSON.parse(
  fs.readFileSync('docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json', 'utf8'),
)
strippedScaffold.sourceOperatorHandoffBridgeAccepted = false
strippedScaffold.booleans.sourceNativeGpuProofCollectionBridgeAccepted = false
fs.writeFileSync(strippedScaffoldPath, `${JSON.stringify(strippedScaffold, null, 2)}\n`, 'utf8')
const strippedOutDir = path.join(tmpDir, 'out-stripped-bridge')
const strippedCollectorOutput = parseJsonOutput(runNpm(runScriptName, [
  '--source-cloud-run-job-scaffold-packet',
  strippedScaffoldPath,
  '--logs-dir',
  logsDir,
  '--out-dir',
  strippedOutDir,
]), 'cloud_run_result_collector_stripped_bridge')
if (strippedCollectorOutput.sourceCloudRunJobScaffoldAccepted !== false) {
  fail('stripped_bridge_source_scaffold_unexpectedly_accepted')
}
if (strippedCollectorOutput.sourceNativeGpuProofCollectionBridgeAccepted !== false) {
  fail('stripped_bridge_source_bridge_unexpectedly_accepted')
}
const strippedCollectorPacket =
  strippedCollectorOutput.collectorPacket && fs.existsSync(strippedCollectorOutput.collectorPacket)
    ? JSON.parse(fs.readFileSync(strippedCollectorOutput.collectorPacket, 'utf8'))
    : {}
if (strippedCollectorPacket.booleans?.sourceCloudRunJobScaffoldAccepted !== false) {
  fail('stripped_bridge_collector_packet_source_scaffold_unexpectedly_accepted')
}
if (strippedCollectorPacket.booleans?.sourceNativeGpuProofCollectionBridgeAccepted !== false) {
  fail('stripped_bridge_collector_packet_source_bridge_unexpectedly_accepted')
}

const validated = parseJsonOutput(runNpm(validateScriptName, ['--result-dir', outDir]), 'gpu_runtime_proof_result_validate')
if (validated.status !== 'ready_for_owner_review_not_beta_ready') {
  fail(`validated_status_unexpected:${validated.status}`)
}
if (validated.runtimeProofResultsAcceptedForOwnerReview !== 6) {
  fail(`validated_accepted_profiles_unexpected:${validated.runtimeProofResultsAcceptedForOwnerReview}`)
}
if (validated.nativeGpuRuntimeProofResultsAccepted !== true) {
  fail('validated_native_gpu_results_not_accepted')
}
if (validated.booleans?.gpuRuntimeApprovedNow !== false) fail('validated_gpu_runtime_approved_not_false')
if (validated.booleans?.externalBetaReadyNow !== false) fail('validated_external_beta_not_false')
if (validated.booleans?.productionReadyNow !== false) fail('validated_production_not_false')

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
  runtimeProfilesRequired: docs.runtimeProfilesRequired.length,
  collectorFixtureExtractedProfiles: collectorOutput.runtimeProfilesExtracted,
  validatorAcceptedProfiles: validated.runtimeProofResultsAcceptedForOwnerReview,
  nativeGpuRuntimeProofResultsAccepted: validated.nativeGpuRuntimeProofResultsAccepted,
  gpuRuntimeApprovedNow: validated.booleans.gpuRuntimeApprovedNow,
  externalBetaReadyNow: validated.booleans.externalBetaReadyNow,
  productionReadyNow: validated.booleans.productionReadyNow,
  packageLockUnchanged: true,
}, null, 2))
