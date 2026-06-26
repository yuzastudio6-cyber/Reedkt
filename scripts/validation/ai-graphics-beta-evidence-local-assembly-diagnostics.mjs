import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const assemblyScriptName = 'ai-graphics:beta-evidence-local-assembly'
const assemblyScriptCommand = 'tsx server/cli/ai-graphics-beta-evidence-local-assembly.ts'
const diagnosticScriptName = 'ai-graphics:beta-evidence-local-assembly:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-evidence-local-assembly-diagnostics.mjs'

const modelManifestTools = [
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
  gpu_worker_ai_graphics: modelManifestTools,
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

function runNpm(scriptName, args = []) {
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function manifestRecord(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    privateArtifactRef: `reeditpro-private-artifact-ref-redacted-${toolId}`,
    checksumSha256: 'a'.repeat(64),
    sourceLicenseRef: `reviewed-private-license-record-${toolId}`,
    modelCardRef: `reviewed-private-model-card-${toolId}`,
    commercialUseReviewed: true,
    redistributionReviewed: true,
    qualityReviewed: true,
    securityReviewed: true,
    provenanceReviewed: true,
    approvedForInternalBeta: true,
  }
}

function manifestCheck(toolId) {
  return {
    toolId,
    manifestId: `${toolId}_private_manifest_review_v1`,
    templateId: templateIdByTool[toolId],
    privateArtifactRefStatus: 'present_private_ref_not_logged',
    checksumSha256: 'b'.repeat(64),
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

function writeFixtures(root, badResult = false) {
  const manifestDir = path.join(root, 'manifests')
  const resultDir = path.join(root, 'proof-results')
  fs.mkdirSync(manifestDir, { recursive: true })
  fs.mkdirSync(resultDir, { recursive: true })
  for (const toolId of modelManifestTools) {
    fs.writeFileSync(
      path.join(manifestDir, `${toolId}.json`),
      `${JSON.stringify(manifestRecord(toolId), null, 2)}\n`,
      'utf8',
    )
  }
  for (const profile of runtimeProfiles) {
    const result = proofResult(profile)
    if (badResult && profile === 'sam2') {
      result.cuda = {
        available: false,
        deviceCount: 0,
        capability: '0.0',
        tinyTensorProbePassed: false,
      }
    }
    fs.writeFileSync(
      path.join(resultDir, `${profile}.json`),
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8',
    )
  }
  return { manifestDir, resultDir }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-evidence-local-assembly.ts',
  'server/cli/ai-graphics-beta-evidence-local-assembly.ts',
  'server/tool-registry/ai-graphics-beta-evidence-bundle.ts',
  'server/tool-registry/ai-graphics-model-weight-manifest-readiness.ts',
  'server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts',
  'server/tool-registry/index.ts',
  'scripts/validation/ai-graphics-beta-evidence-local-assembly-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/beta-evidence-local-assembly.md',
  'docs/tool-intelligence/ai-graphics/beta-evidence-local-assembly.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
  'docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json',
  'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json('docs/tool-intelligence/ai-graphics/beta-evidence-local-assembly.json')
const bundleDocs = json('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json')
const preflightDocs = json('docs/tool-intelligence/ai-graphics/gpu-runtime-proof-local-preflight.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-evidence-local-assembly.ts')
const cliSource = read('server/cli/ai-graphics-beta-evidence-local-assembly.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-evidence-local-assembly.md')

if (pkg.scripts?.[assemblyScriptName] !== assemblyScriptCommand) fail(`missing_package_script:${assemblyScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-evidence-local-assembly'")) {
  fail('server_registry_index_does_not_export_local_assembly')
}

if (packet.decision !== 'ai_graphics_beta_evidence_local_assembly_prepared_with_directory_inputs') {
  fail(`unexpected_packet_decision:${packet.decision}`)
}
if (bundleDocs.decision !== 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults') {
  fail('source_beta_bundle_not_accepted')
}
if (preflightDocs.decision !== 'ai_graphics_gpu_runtime_proof_local_preflight_prepared_with_manifest_and_result_blocks') {
  fail('source_local_preflight_not_accepted')
}
if (packet.contractSurface?.defaultCliOutputMode !== 'sanitized_summary') {
  fail(`unexpected_default_output_mode:${packet.contractSurface?.defaultCliOutputMode}`)
}
if (packet.contractSurface?.fullOutputFlag !== '--full-output') {
  fail(`unexpected_full_output_flag:${packet.contractSurface?.fullOutputFlag}`)
}
if (packet.outputSafety?.defaultCliOutputMode !== 'sanitized_summary') {
  fail(`unexpected_output_safety_default_mode:${packet.outputSafety?.defaultCliOutputMode}`)
}
if (packet.outputSafety?.fullEvidencePacketsIncludedByDefault !== false) {
  fail('output_safety_full_packets_included_by_default')
}
if (packet.outputSafety?.rawPrivateArtifactRefsAllowedInOutput !== false) {
  fail('output_safety_allows_raw_private_refs')
}

for (const token of [
  'buildAiGraphicsBetaEvidenceLocalAssembly',
  'buildAiGraphicsBetaEvidenceBundle',
  'buildAiGraphicsModelWeightManifestReviewPacket',
  'buildAiGraphicsGpuRuntimeProofResultPacket',
  'assembled_technical_evidence_ready_for_owner_gate',
  'assembled_all21_beta_evidence_ready_for_owner_gate',
  'reviewed_private_model_weight_manifest_records',
  'native_gpu_runtime_proof_result_records',
]) {
  if (!moduleSource.includes(token)) fail(`module_missing:${token}`)
}

for (const token of [
  '--manifest-dir',
  '--result-dir',
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--require-ready-for-owner-gate',
  '--require-all-21-beta-ready',
  '--full-output',
  'sanitized_summary',
  'fullEvidencePacketsIncluded: false',
  'validatorOnly: true',
  'gpuRuntimePerformed: false',
]) {
  if (!cliSource.includes(token)) fail(`cli_missing:${token}`)
}

for (const token of [
  '.local-artifacts/ai-graphics/model-weight-manifests',
  '.local-artifacts/ai-graphics/gpu-runtime-proof-results',
  'node-runtime-proof.json',
  'browser-runtime-proof.json',
  'satori-font-runtime-proof.json',
  '--require-all-21-beta-ready',
  '--full-output',
  'sanitized_summary',
]) {
  if (!markdown.includes(token) && !JSON.stringify(packet).includes(token)) fail(`docs_missing:${token}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  modelWeightManifestRequiredTools: 5,
  nativeGpuRuntimeProfilesRequired: 4,
  localManifestRecordsProvided: 0,
  localGpuRuntimeProofResultsProvided: 0,
  defaultBetaTestingReadyTools: 0,
  fullTechnicalEvidenceReadyForOwnerGateTools: 21,
  fullEvidenceBetaTestingReadyTools: 21,
})) {
  if (packet.counts?.[key] !== expected) fail(`unexpected_count:${key}:${packet.counts?.[key]}`)
}

for (const key of [
  'betaEvidenceLocalAssemblyPrepared',
  'defaultCliOutputSanitized',
  'agentCanSelectForPlanning',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_not_true:${key}`)
}

for (const key of [
  'fullEvidencePacketsIncludedByDefault',
  'modelWeightManifestReviewPacketBuiltFromLocalInput',
  'gpuRuntimeProofResultPacketBuiltFromLocalInput',
  'committedJsRuntimeProofsAccepted',
  'all21TechnicalEvidenceReadyBeforeOwnerApproval',
  'all21BetaEvidenceReady',
  'readyForInternalBetaOwnerGate',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (packet.booleans?.[key] !== false) fail(`required_false_not_false:${key}`)
}

const defaultAssembly = parseOutput(runNpm(assemblyScriptName), 'default_assembly')
if (defaultAssembly.status !== 'missing_local_evidence') fail(`default_status:${defaultAssembly.status}`)
if (defaultAssembly.outputMode !== 'sanitized_summary') fail(`default_output_mode:${defaultAssembly.outputMode}`)
if (defaultAssembly.sanitizedSummary !== true) fail('default_summary_not_marked_sanitized')
if (defaultAssembly.fullEvidencePacketsIncluded !== false) fail('default_full_packets_included')
if ('modelWeightManifestReviewPacket' in defaultAssembly) fail('default_summary_includes_manifest_packet')
if ('gpuRuntimeProofResultPacket' in defaultAssembly) fail('default_summary_includes_gpu_packet')
if ('betaEvidenceBundle' in defaultAssembly) fail('default_summary_includes_beta_bundle')
if (defaultAssembly.betaEvidence?.betaTestingReadyTools !== 0) fail('default_ready_not_0')
if (defaultAssembly.betaEvidence?.all21BetaEvidenceReady !== false) fail('default_all21_not_false')
if (!defaultAssembly.localEvidence?.missingLocalEvidence?.includes('reviewed_private_model_weight_manifest_records')) {
  fail('default_missing_manifest_gap')
}
if (!defaultAssembly.localEvidence?.missingLocalEvidence?.includes('native_gpu_runtime_proof_result_records')) {
  fail('default_missing_gpu_gap')
}

const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-evidence-local-assembly-'))
const { manifestDir, resultDir } = writeFixtures(fixtureRoot)
const ownerGateOutput = runNpm(assemblyScriptName, [
  '--manifest-dir',
  manifestDir,
  '--result-dir',
  resultDir,
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--require-ready-for-owner-gate',
])
const ownerGateAssembly = parseOutput(ownerGateOutput, 'owner_gate_assembly')
if (ownerGateAssembly.outputMode !== 'sanitized_summary') fail(`owner_gate_output_mode:${ownerGateAssembly.outputMode}`)
if (ownerGateAssembly.status !== 'assembled_technical_evidence_ready_for_owner_gate') {
  fail(`owner_gate_status:${ownerGateAssembly.status}`)
}
if (ownerGateAssembly.betaEvidence?.all21TechnicalEvidenceReadyBeforeOwnerApproval !== true) {
  fail('owner_gate_technical_evidence_not_true')
}
if (ownerGateAssembly.betaEvidence?.all21BetaEvidenceReady !== false) {
  fail('owner_gate_beta_evidence_should_not_be_true_before_owner_approval')
}
if (ownerGateAssembly.booleans?.readyForInternalBetaOwnerGate !== true) {
  fail('owner_gate_ready_for_owner_gate_not_true')
}
if (ownerGateAssembly.booleans?.all21BetaEvidenceReady !== false) {
  fail('owner_gate_all21_beta_boolean_should_be_false')
}

const fullOutput = runNpm(assemblyScriptName, [
  '--manifest-dir',
  manifestDir,
  '--result-dir',
  resultDir,
  '--use-committed-js-runtime-proofs',
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--require-all-21-beta-ready',
  '--full-output',
])
const fullAssembly = parseOutput(fullOutput, 'full_assembly')
if (fullAssembly.status !== 'assembled_all21_beta_evidence_ready_for_owner_gate') {
  fail(`full_status:${fullAssembly.status}`)
}
if (fullAssembly.localManifestRecordsProvided !== 5) fail(`full_manifest_records:${fullAssembly.localManifestRecordsProvided}`)
if (fullAssembly.localGpuRuntimeProofResultsProvided !== 4) fail(`full_gpu_results:${fullAssembly.localGpuRuntimeProofResultsProvided}`)
if (fullAssembly.betaEvidenceBundle?.betaTestingReadyTools !== 21) fail('full_ready_not_21')
if (fullAssembly.betaEvidenceBundle?.all21BetaEvidenceReady !== true) fail('full_all21_not_true')
if (fullAssembly.betaEvidenceBundle?.all21TechnicalEvidenceReadyBeforeOwnerApproval !== true) {
  fail('full_technical_owner_gate_not_true')
}
if (fullAssembly.booleans?.committedJsRuntimeProofsAccepted !== true) fail('full_js_proofs_not_accepted')
if (fullAssembly.booleans?.readyForInternalBetaOwnerGate !== true) fail('full_not_ready_for_owner_gate')
if (fullOutput.includes('private://reeditpro')) fail('full_output_leaked_private_ref')

const badRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-evidence-local-assembly-bad-'))
const badFixture = writeFixtures(badRoot, true)
let badExited = false
let badOutput = ''
try {
  badOutput = runNpm(assemblyScriptName, [
    '--manifest-dir',
    badFixture.manifestDir,
    '--result-dir',
    badFixture.resultDir,
    '--use-committed-js-runtime-proofs',
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--require-all-21-beta-ready',
    '--full-output',
  ])
} catch (error) {
  badExited = true
  badOutput = `${error.stdout || ''}${error.stderr || ''}`
}
if (!badExited) fail('bad_result_require_all21_did_not_exit_nonzero')
const badAssembly = parseOutput(badOutput, 'bad_assembly')
if (badAssembly.status !== 'invalid_local_evidence') fail(`bad_status:${badAssembly.status}`)
if (badAssembly.betaEvidenceBundle?.all21BetaEvidenceReady !== false) fail('bad_all21_not_false')

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /dependencyInstallPerformed["`:\s]+true/i,
  /packageLockMutationPerformed["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /modelInferencePerformed["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
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

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_read_failed:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed_from_base')
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only']).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) {
    fail(`generated_media_or_font_changed:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  defaultStatus: defaultAssembly.status,
  fullStatus: fullAssembly.status,
  fullEvidenceBetaTestingReadyTools: fullAssembly.betaEvidenceBundle?.betaTestingReadyTools,
  all21BetaEvidenceReady: fullAssembly.betaEvidenceBundle?.all21BetaEvidenceReady,
  readyForInternalBetaOwnerGate: ownerGateAssembly.booleans?.readyForInternalBetaOwnerGate,
  badStatus: badAssembly.status,
  agentCanExecuteToolsNow: fullAssembly.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: fullAssembly.booleans?.runtimeReadyNow,
  packageLockChanged: false,
}, null, 2))
