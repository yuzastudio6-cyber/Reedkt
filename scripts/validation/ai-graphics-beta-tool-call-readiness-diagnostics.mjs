import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const validateScriptName = 'ai-graphics:beta-tool-call-readiness'
const validateScriptCommand = 'tsx server/cli/ai-graphics-beta-tool-call-readiness.ts'
const diagnosticScriptName = 'ai-graphics:beta-tool-call-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-beta-tool-call-readiness-diagnostics.mjs'

const allTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

const capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
]

const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

const modelManifestTools = [
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
  rembg: [
    'torch',
    'numpy',
    'PIL',
    'cv2',
    'rembg',
  ],
  transparent_background: [
    'torch',
    'torchvision',
    'numpy',
    'PIL',
    'transparent_background',
  ],
}

const requiredManifestToolsByProfile = {
  gpu_worker_ai_graphics: modelManifestTools,
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

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function assertExpectedGpuRuntimeTargets(container, label) {
  const actual = container?.expectedGpuRuntimeTargets
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    fail(`${label}_missing_expected_gpu_runtime_targets`)
    return
  }
  for (const [toolId, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
    if (actual[toolId] !== runtimeTarget) {
      fail(`${label}_gpu_runtime_target_mismatch:${toolId}:${actual[toolId]}`)
    }
  }
  if (Object.keys(actual).length !== Object.keys(expectedGpuRuntimeTargets).length) {
    fail(`${label}_unexpected_gpu_runtime_target_count:${Object.keys(actual).length}`)
  }
}

function manifestRecord(toolId) {
  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateIdByTool[toolId],
    privateArtifactRef: `reeditpro-private-artifact-ref-redacted-${toolId}`,
    checksumSha256: 'a'.repeat(64),
    sourceLicenseRef: `docs/tool-intelligence/ai-graphics/${toolId}-license-review.md`,
    modelCardRef: `docs/tool-intelligence/ai-graphics/${toolId}-model-card-review.md`,
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
    modelManifestChecks: requiredManifestToolsByProfile[profile].map(manifestCheck),
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

function writePacketFixtures() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-beta-tool-call-readiness-'))
  const manifestDir = path.join(root, 'manifests')
  const proofDir = path.join(root, 'proof-results')
  fs.mkdirSync(manifestDir)
  fs.mkdirSync(proofDir)

  for (const toolId of modelManifestTools) {
    fs.writeFileSync(
      path.join(manifestDir, `${toolId}.json`),
      `${JSON.stringify(manifestRecord(toolId), null, 2)}\n`,
      'utf8',
    )
  }
  for (const profile of requiredProfiles) {
    fs.writeFileSync(
      path.join(proofDir, `${profile}.json`),
      `${JSON.stringify(proofResult(profile), null, 2)}\n`,
      'utf8',
    )
  }

  const manifestPacket = parseJsonOutput(
    runNpm('ai-graphics:model-weight-manifest-review:validate', ['--manifest-dir', manifestDir]),
    'manifest_packet_fixture',
  )
  const gpuPacket = parseJsonOutput(
    runNpm('ai-graphics:gpu-runtime-proof-result:validate', ['--result-dir', proofDir]),
    'gpu_packet_fixture',
  )
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  fs.writeFileSync(manifestPacketPath, `${JSON.stringify(manifestPacket, null, 2)}\n`, 'utf8')
  fs.writeFileSync(gpuPacketPath, `${JSON.stringify(gpuPacket, null, 2)}\n`, 'utf8')

  return { manifestPacketPath, gpuPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-tool-call-readiness.ts',
  'server/cli/ai-graphics-beta-tool-call-readiness.ts',
  'scripts/validation/ai-graphics-beta-tool-call-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.md',
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json')
const evidenceBundle = json('docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json')
const planEvaluator = json('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json')
const readiness = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const moduleSource = read('server/tool-registry/ai-graphics-beta-tool-call-readiness.ts')
const cliSource = read('server/cli/ai-graphics-beta-tool-call-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[validateScriptName] !== validateScriptCommand) fail(`missing_package_script:${validateScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-beta-tool-call-readiness'")) {
  fail('server_registry_index_does_not_export_beta_tool_call_readiness')
}
if (docs.decision !== 'ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (!docs.sourceDecisions?.includes('ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults')) {
  fail('docs_missing_beta_evidence_source_decision')
}
if (!docs.sourceDecisions?.includes('ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks')) {
  fail('docs_missing_plan_evaluator_source_decision')
}
if (evidenceBundle.decision !== 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults') {
  fail('source_beta_evidence_bundle_decision_not_accepted')
}
if (planEvaluator.decision !== 'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks') {
  fail('source_plan_evaluator_decision_not_accepted')
}
if (readiness.toolCounts?.productionToolIdMapped !== 21) fail('source_readiness_mapping_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('source_audit_install_ready_not_21')

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
  if (!markdown.includes(`\`${capability}\``)) fail(`markdown_missing_capability:${capability}`)
}
for (const needle of [
  'buildAiGraphicsBetaEvidenceBundle',
  'listAiGraphicsToolCallPlanEvaluations',
  'listAiGraphicsToolCallReadiness',
  'all21_beta_evidence_bundle',
  'betaToolCallableNow: false',
  'all21BetaCallableWhenEvidenceBundlePasses',
  '--require-all-21-beta-tool-call-ready',
  '--use-committed-js-runtime-proofs',
  '--model-weight-manifest-review-packet',
  '--gpu-runtime-proof-result-packet',
]) {
  if (!moduleSource.includes(needle) && !cliSource.includes(needle) && !markdown.includes(needle)) {
    fail(`source_missing:${needle}`)
  }
}

if (docs.counts?.totalTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capability_count_not_12')
if (docs.counts?.defaultBetaToolCallableWithProvidedEvidenceTools !== 0) fail('docs_default_callable_not_0')
if (docs.counts?.defaultBetaToolCallableNowTools !== 0) fail('docs_default_now_callable_not_0')
if (docs.counts?.fullEvidenceBetaToolCallableWithProvidedEvidenceTools !== 21) fail('docs_full_callable_not_21')
if (docs.counts?.fullEvidenceBetaToolCallableNowTools !== 0) fail('docs_full_now_callable_not_0')
if (docs.evidencePolicy?.partialEvidenceCreatesCallableSubset !== false) fail('docs_partial_subset_policy_not_false')
if (docs.evidencePolicy?.requiresAll21BetaEvidenceBundle !== true) fail('docs_all21_policy_not_true')
assertExpectedGpuRuntimeTargets(docs, 'docs')
if (docs.gpuRuntimePolicy?.onDemandOnly !== true) fail('docs_gpu_runtime_policy_not_on_demand')
if (docs.gpuRuntimePolicy?.noIdleGpuRuntimeApproved !== true) fail('docs_gpu_runtime_policy_idle_gpu_allowed')
if (docs.gpuRuntimePolicy?.startsOnlyForApprovedWorkerOrToolCall !== true) {
  fail('docs_gpu_runtime_policy_not_worker_call_scoped')
}
if (docs.gpuRuntimePolicy?.proofContainerIsEphemeral !== true) {
  fail('docs_gpu_runtime_policy_not_ephemeral')
}
if (docs.gpuRuntimePolicy?.cpuFallbackAllowedForHeavyTools !== false) {
  fail('docs_gpu_runtime_policy_cpu_fallback_not_blocked')
}
if (!markdown.includes('GPU use is on-demand only')) fail('markdown_missing_on_demand_gpu_policy')
for (const [toolId, runtimeTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (!markdown.includes(`\`${runtimeTarget}\``)) fail(`markdown_missing_gpu_runtime_target:${toolId}`)
}

const defaultOutput = parseJsonOutput(runNpm(validateScriptName), 'default_beta_tool_call_readiness')
if (defaultOutput.betaToolCallableWithProvidedEvidenceTools !== 0) fail('default_callable_with_evidence_not_0')
if (defaultOutput.betaToolCallableNowTools !== 0) fail('default_callable_now_not_0')
if (defaultOutput.all21BetaCallableWhenEvidenceBundlePasses !== false) fail('default_all21_callable_not_false')
if (defaultOutput.sourceBetaEvidenceBundleAccepted !== false) fail('default_source_bundle_unexpectedly_accepted')
if (defaultOutput.capabilities?.length !== 12) fail('default_capabilities_not_12')
if (defaultOutput.tools?.length !== 21) fail('default_tools_not_21')
assertExpectedGpuRuntimeTargets(defaultOutput, 'default_output')
if (defaultOutput.booleans?.gpuRuntimeTargetsExact !== true) fail('default_output_gpu_targets_exact_not_true')
if (defaultOutput.booleans?.gpuRuntimeOnDemandOnly !== true) fail('default_output_gpu_on_demand_not_true')
for (const tool of allTools) {
  const row = defaultOutput.tools?.find((entry) => entry.toolId === tool)
  if (!row) fail(`default_missing_tool:${tool}`)
  if (row?.installReadyForPlannedSurface !== true) fail(`default_tool_not_install_ready:${tool}`)
  if (row?.productionMapped !== true) fail(`default_tool_not_production_mapped:${tool}`)
  if (row?.planningSelectable !== true) fail(`default_tool_not_planning_selectable:${tool}`)
  const expectedRuntimeTarget = expectedGpuRuntimeTargets[tool] ?? null
  if (row?.runtimeTargetForPlannedSurface !== expectedRuntimeTarget) {
    fail(`default_tool_runtime_target_mismatch:${tool}:${row?.runtimeTargetForPlannedSurface}`)
  }
  if (row?.gpuRequiredForRuntime !== Boolean(expectedRuntimeTarget)) {
    fail(`default_tool_gpu_required_mismatch:${tool}`)
  }
  if (row?.betaToolCallableWithProvidedEvidence !== false) fail(`default_tool_unexpected_callable:${tool}`)
  if (row?.betaToolCallableNow !== false) fail(`default_tool_now_callable:${tool}`)
}

let partialExited = false
let partialOutputText = ''
try {
  partialOutputText = runNpm(validateScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-shared-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--native-gpu-runtime-proof-passed',
    '--model-weight-manifests-approved',
    '--require-all-21-beta-tool-call-ready',
  ])
} catch (error) {
  partialExited = true
  partialOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const partialOutput = parseJsonOutput(partialOutputText, 'partial_beta_tool_call_readiness')
if (!partialExited) fail('partial_evidence_did_not_fail_require_all21')
if (partialOutput.betaToolCallableWithProvidedEvidenceTools !== 0) fail('partial_callable_not_0')
if (partialOutput.all21BetaCallableWhenEvidenceBundlePasses !== false) fail('partial_all21_callable_not_false')

const { manifestPacketPath, gpuPacketPath } = writePacketFixtures()
const fullOutput = parseJsonOutput(runNpm(validateScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--require-all-21-beta-tool-call-ready',
]), 'full_beta_tool_call_readiness')

if (fullOutput.betaToolCallableWithProvidedEvidenceTools !== 21) fail('full_callable_with_evidence_not_21')
if (fullOutput.betaToolCallableNowTools !== 0) fail('full_callable_now_not_0')
if (fullOutput.all21BetaCallableWhenEvidenceBundlePasses !== true) fail('full_all21_callable_not_true')
if (fullOutput.sourceBetaEvidenceBundleAccepted !== true) fail('full_source_bundle_not_accepted')
if (fullOutput.capabilitiesWithBetaCallablePlanningTools !== 12) fail('full_capabilities_with_callable_tools_not_12')
assertExpectedGpuRuntimeTargets(fullOutput, 'full_output')
if (fullOutput.booleans?.gpuRuntimeTargetsExact !== true) fail('full_output_gpu_targets_exact_not_true')
if (fullOutput.booleans?.gpuRuntimeOnDemandOnly !== true) fail('full_output_gpu_on_demand_not_true')
for (const tool of allTools) {
  const row = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (!row?.betaToolCallableWithProvidedEvidence) fail(`full_tool_not_callable_with_evidence:${tool}`)
  if (row?.betaToolCallableNow !== false) fail(`full_tool_now_callable:${tool}`)
}
for (const capability of capabilities) {
  const row = fullOutput.capabilities?.find((entry) => entry.capabilityId === capability)
  if (!row) fail(`full_missing_capability:${capability}`)
  if (!row?.betaCallablePlanningToolsWithProvidedEvidence?.length) {
    fail(`full_capability_missing_callable_tool:${capability}`)
  }
  if (row?.betaCallablePlanningToolsNow?.length !== 0) {
    fail(`full_capability_now_callable_not_empty:${capability}`)
  }
}

for (const output of [defaultOutput, partialOutput, fullOutput]) {
  for (const key of [
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
    'mediaProcessingPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults')) {
  fail('scorecard_missing_beta_tool_call_readiness_decision')
}

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
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
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
const combinedText = [
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.md',
  'docs/tool-intelligence/ai-graphics/beta-tool-call-readiness.json',
  'server/tool-registry/ai-graphics-beta-tool-call-readiness.ts',
  'server/cli/ai-graphics-beta-tool-call-readiness.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')
for (const pattern of forbiddenTruePatterns) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const generatedPathPattern = /(generated|render|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif|\.svg)$/i
const trackedGenerated = git(['ls-files'])
  .split('\n')
  .filter(Boolean)
  .filter((file) => generatedPathPattern.test(file))
  .filter((file) => file.includes('.local-artifacts') || file.includes('/public/') || file.includes('/generated/'))
if (trackedGenerated.length) fail(`generated_outputs_tracked:${trackedGenerated.join(',')}`)

const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles.split('\n').filter(Boolean).some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_staged')
}
if (stagedFiles.split('\n').filter(Boolean).some((file) => generatedPathPattern.test(file))) {
  fail('generated_output_staged')
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff) fail('package_lock_changed')

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  capabilitiesCovered: capabilities.length,
  defaultBetaToolCallableWithProvidedEvidenceTools: defaultOutput.betaToolCallableWithProvidedEvidenceTools,
  fullEvidenceBetaToolCallableWithProvidedEvidenceTools: fullOutput.betaToolCallableWithProvidedEvidenceTools,
  betaToolCallableNowTools: fullOutput.betaToolCallableNowTools,
  agentCanExecuteToolsNow: fullOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: fullOutput.booleans?.runtimeReadyNow,
}, null, 2))
