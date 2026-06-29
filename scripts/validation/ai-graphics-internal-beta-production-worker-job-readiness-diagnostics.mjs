import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { acceptedModelWeightManifestReviewPacket } from './ai-graphics-model-weight-fixture-packet.mjs'
import { acceptedGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-fixture-packet.mjs'
import { acceptedNativeGpuProofCollectionPacket } from './ai-graphics-native-gpu-proof-collection-fixture-packet.mjs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:internal-beta-production-worker-job-readiness'
const runScriptCommand = 'tsx server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts'
const diagnosticScriptName = 'ai-graphics:internal-beta-production-worker-job-readiness:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-internal-beta-production-worker-job-readiness-diagnostics.mjs'

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

const jobPayloadFields = [
  'jobId',
  'workspaceId',
  'projectId',
  'approvedSnapshotId',
  'editPlanId',
  'toolExecutionPlanId',
  'workerType',
  'executionMode',
  'idempotencyKey',
  'attempt',
  'maxAttempts',
  'requestedToolIds',
  'requestedRecipeIds',
  'storageReferenceIds',
  'creditReservationId',
  'requiredQualityGateTypes',
  'createdAt',
  'metadata',
]

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
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

function writeAcceptedEvidencePackets() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-production-worker-job-readiness-'))
  const manifestPacketPath = path.join(root, 'model-weight-manifest-review-packet.json')
  const gpuPacketPath = path.join(root, 'gpu-runtime-proof-result-packet.json')
  const nativeGpuProofCollectionPacketPath = path.join(root, 'native-gpu-proof-collection-packet.json')
  fs.writeFileSync(
    manifestPacketPath,
    `${JSON.stringify(acceptedModelWeightManifestReviewPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    gpuPacketPath,
    `${JSON.stringify(acceptedGpuRuntimeProofResultPacket(), null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    nativeGpuProofCollectionPacketPath,
    `${JSON.stringify(acceptedNativeGpuProofCollectionPacket(), null, 2)}\n`,
    'utf8',
  )
  return { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-internal-beta-production-worker-job-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts',
  'scripts/validation/ai-graphics-internal-beta-production-worker-job-readiness-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.json',
  'docs/tool-intelligence/ai-graphics/internal-beta-worker-payload-readiness.json',
  'server/workers/production/production-worker-types.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.json')
const moduleSource = read('server/tool-registry/ai-graphics-internal-beta-production-worker-job-readiness.ts')
const cliSource = read('server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts')
const indexSource = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-internal-beta-production-worker-job-readiness'")) {
  fail('server_registry_index_does_not_export_internal_beta_production_worker_job_readiness')
}
if (docs.decision !== 'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceDecision !== 'ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime') {
  fail(`unexpected_source_decision:${docs.sourceDecision}`)
}
for (const status of [
  'missing_technical_evidence',
  'awaiting_owner_approval',
  'owner_approved_production_worker_jobs_ready',
]) {
  if (!docs.states?.includes(status)) fail(`docs_missing_status:${status}`)
  if (!moduleSource.includes(status)) fail(`module_missing_status:${status}`)
}
for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const field of jobPayloadFields) {
  if (!docs.jobPayloadFields?.includes(field)) fail(`docs_missing_job_payload_field:${field}`)
  if (!moduleSource.includes(field)) fail(`module_missing_job_payload_field:${field}`)
}
for (const token of [
  'ProductionWorkerJobPayload',
  'requestedToolIds',
  'requestedRecipeIds',
  'storageReferenceIds',
  'toolExecutionPlanId',
  'canonicalRegistryValidationPassed',
  'runtimeActivationPolicyAccepted',
  'aiGraphicsToolCallHandoff',
  'metadata_dry_run',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'startsOnlyForApprovedWorkerOrToolCall',
  'validateProductionWorkerJobAgainstCanonicalRegistry',
  'render_asset_integrity',
  '--credit-reservation-id',
  '--require-owner-approved-production-worker-jobs-ready',
]) {
  if (!moduleSource.includes(token) && !cliSource.includes(token) && !JSON.stringify(docs).includes(token)) {
    fail(`source_missing:${token}`)
  }
}
if (docs.counts?.productionWorkerJobPayloadsPrepared !== 21) fail('docs_worker_jobs_not_21')
if (docs.counts?.capabilityProductionWorkerJobScenariosPrepared !== 12) fail('docs_capability_jobs_not_12')
if (docs.counts?.ownerApprovedProductionWorkerJobPayloadsReadyWithProvidedEvidence !== 21) {
  fail('docs_owner_worker_jobs_not_21')
}
if (docs.counts?.ownerApprovedCapabilityProductionWorkerJobScenariosReadyWithProvidedEvidence !== 12) {
  fail('docs_owner_capability_worker_jobs_not_12')
}
if (docs.counts?.productionWorkerJobPayloadsReadyNow !== 0) fail('docs_worker_jobs_ready_now_not_0')
if (docs.runtimeTargets?.workerPayloadsValidateCanonicalAiGraphicsRegistry !== true) {
  fail('docs_missing_canonical_registry_validation')
}
if (docs.runtimeTargets?.workerPayloadsPreserveCreditReservationId !== true) {
  fail('docs_missing_credit_reservation_preservation')
}
if (docs.runtimeTargets?.workerPayloadsEmbedGpuRuntimeActivationPolicy !== true) {
  fail('docs_missing_runtime_activation_policy')
}
if (docs.runtimeTargets?.workerPayloadsEmbedAiGraphicsToolCallHandoff !== true) {
  fail('docs_missing_ai_graphics_tool_call_handoff')
}
if (docs.runtimeTargets?.gpuRuntimeOnDemandOnly !== true) fail('docs_gpu_runtime_not_on_demand')
if (docs.runtimeTargets?.noIdleGpuRuntimeApproved !== true) fail('docs_idle_gpu_policy_not_blocked')
if (docs.runtimeTargets?.startsOnlyForApprovedWorkerOrToolCall !== true) {
  fail('docs_gpu_start_policy_not_worker_call_only')
}
if (docs.runtimeTargets?.cpuFallbackAllowedForHeavyTools !== false) fail('docs_cpu_fallback_not_false')
if (docs.runtimeTargets?.dedicatedGpuRuntimeTargetsExact !== true) fail('docs_missing_dedicated_gpu_runtime_target_guard')
for (const [tool, expectedTarget] of Object.entries(expectedGpuRuntimeTargets)) {
  if (docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool] !== expectedTarget) {
    fail(`docs_expected_gpu_runtime_target_mismatch:${tool}:${docs.runtimeTargets?.expectedGpuRuntimeTargets?.[tool]}`)
  }
}
if (docs.runtimeTargets?.canEnqueueProductionWorkerJobNow !== false) fail('docs_enqueue_not_false')
if (docs.runtimeTargets?.canRunProductionWorkerRouteNow !== false) fail('docs_route_not_false')

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_production_worker_job')
if (defaultOutput.status !== 'missing_technical_evidence') fail(`default_status:${defaultOutput.status}`)
if (defaultOutput.ownerApprovedProductionWorkerJobEvidenceAccepted !== false) fail('default_owner_job_not_false')
if (defaultOutput.productionWorkerJobPayloadsReadyWithProvidedEvidence !== 0) fail('default_jobs_not_0')

const { manifestPacketPath, gpuPacketPath, nativeGpuProofCollectionPacketPath } = writeAcceptedEvidencePackets()
let awaitingExited = false
let awaitingOutputText = ''
try {
  awaitingOutputText = runNpm(runScriptName, [
    '--use-committed-js-runtime-proofs',
    '--all-technical-gates-passed',
    '--browser-canvas-webgl-sandbox-passed',
    '--model-weight-manifest-review-packet',
    manifestPacketPath,
    '--gpu-runtime-proof-result-packet',
    gpuPacketPath,
    '--external-beta-native-gpu-proof-collection-packet',
    nativeGpuProofCollectionPacketPath,
    '--require-owner-approved-production-worker-jobs-ready',
  ])
} catch (error) {
  awaitingExited = true
  awaitingOutputText = `${error.stdout || ''}${error.stderr || ''}`
}
const awaitingOutput = parseJsonOutput(awaitingOutputText, 'awaiting_owner_approval')
if (!awaitingExited) fail('awaiting_owner_approval_require_did_not_fail')
if (awaitingOutput.status !== 'awaiting_owner_approval') fail(`awaiting_status:${awaitingOutput.status}`)
if (awaitingOutput.ownerApprovedProductionWorkerJobEvidenceAccepted !== false) fail('awaiting_owner_job_not_false')

const approvedOutput = parseJsonOutput(runNpm(runScriptName, [
  '--use-committed-js-runtime-proofs',
  '--all-technical-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--model-weight-manifest-review-packet',
  manifestPacketPath,
  '--gpu-runtime-proof-result-packet',
  gpuPacketPath,
  '--external-beta-native-gpu-proof-collection-packet',
  nativeGpuProofCollectionPacketPath,
  '--owner-approval-granted',
  '--owner-approval-ref',
  'AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_LOCAL_FIXTURE',
  '--require-owner-approved-production-worker-jobs-ready',
]), 'approved_production_worker_job')

if (approvedOutput.status !== 'owner_approved_production_worker_jobs_ready') {
  fail(`approved_status:${approvedOutput.status}`)
}
if (approvedOutput.ownerApprovedProductionWorkerJobEvidenceAccepted !== true) fail('approved_owner_job_not_true')
if (approvedOutput.productionWorkerJobPayloadsPrepared !== 21) fail('approved_worker_jobs_not_21')
if (approvedOutput.capabilityProductionWorkerJobScenariosPrepared !== 12) fail('approved_capability_jobs_not_12')
if (approvedOutput.productionWorkerJobPayloadsReadyWithProvidedEvidence !== 21) fail('approved_ready_jobs_not_21')
if (approvedOutput.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence !== 12) {
  fail('approved_ready_capability_jobs_not_12')
}
if (approvedOutput.productionWorkerJobPayloadsReadyNow !== 0) fail('approved_jobs_ready_now_not_0')
if (approvedOutput.productionWorkerJobPayloads?.length !== 21) fail('approved_job_payload_length_not_21')
if (approvedOutput.capabilityProductionWorkerJobScenarios?.length !== 12) {
  fail('approved_capability_job_payload_length_not_12')
}

for (const candidate of approvedOutput.productionWorkerJobPayloads ?? []) {
  const job = candidate.productionWorkerJobPayload ?? {}
  for (const field of jobPayloadFields) {
    if (!Object.hasOwn(job, field)) fail(`job_missing_field:${candidate.sourceToolId}:${field}`)
  }
  if (candidate.productionWorkerJobShapeValid !== true) fail(`job_shape_invalid:${candidate.sourceToolId}`)
  if (candidate.canonicalRegistryValidationPassed !== true) {
    fail(`job_canonical_registry_invalid:${candidate.sourceToolId}`)
  }
  if (candidate.runtimeActivationPolicyAccepted !== true) {
    fail(`job_runtime_activation_policy_invalid:${candidate.sourceToolId}`)
  }
  if (candidate.canonicalRegistryValidationFailures?.length !== 0) {
    fail(`job_canonical_registry_failures:${candidate.sourceToolId}:${candidate.canonicalRegistryValidationFailures}`)
  }
  if (candidate.productionWorkerJobReadyWithProvidedEvidence !== true) {
    fail(`job_not_ready_with_evidence:${candidate.sourceToolId}`)
  }
  if (candidate.canEnqueueProductionWorkerJobNow !== false) fail(`candidate_enqueue_not_false:${candidate.sourceToolId}`)
  if (candidate.canRunProductionWorkerRouteNow !== false) fail(`candidate_route_not_false:${candidate.sourceToolId}`)
  if (candidate.canExecuteToolNow !== false) fail(`candidate_execute_not_false:${candidate.sourceToolId}`)
  if (job.executionMode !== 'dry_run') fail(`job_bad_execution_mode:${candidate.sourceToolId}`)
  if (job.requestedToolIds?.[0] !== candidate.sourceProductionToolId) {
    fail(`job_requested_tool_mismatch:${candidate.sourceToolId}`)
  }
  if (!job.creditReservationId) fail(`job_missing_credit_reservation:${candidate.sourceToolId}`)
  if (!job.idempotencyKey?.startsWith('prod-worker:')) fail(`job_bad_idempotency:${candidate.sourceToolId}`)
  if (!job.toolExecutionPlanId?.startsWith('tool_strategy_')) fail(`job_bad_plan_id:${candidate.sourceToolId}`)
  if (job.requestedRecipeIds?.length !== 1) fail(`job_bad_recipe_count:${candidate.sourceToolId}`)
  if (job.storageReferenceIds?.length !== 1) fail(`job_bad_storage_ref_count:${candidate.sourceToolId}`)
  if (job.storageReferenceIds?.[0]?.includes('signed') || job.storageReferenceIds?.[0]?.includes('http')) {
    fail(`job_storage_ref_not_private:${candidate.sourceToolId}`)
  }
  if (!job.requiredQualityGateTypes?.includes('render_asset_integrity')) {
    fail(`job_missing_quality_gate:${candidate.sourceToolId}`)
  }
  if (job.metadata?.aiGraphicsCanonicalToolId !== candidate.sourceToolId) {
    fail(`job_metadata_tool_mismatch:${candidate.sourceToolId}`)
  }
  if (job.metadata?.canEnqueueProductionWorkerJobNow !== false) {
    fail(`job_metadata_enqueue_not_false:${candidate.sourceToolId}`)
  }
  if (job.metadata?.canRunProductionWorkerRouteNow !== false) {
    fail(`job_metadata_route_not_false:${candidate.sourceToolId}`)
  }
  if (job.metadata?.canExecuteToolNow !== false) {
    fail(`job_metadata_execute_not_false:${candidate.sourceToolId}`)
  }
  if (job.metadata?.gpuRuntimeOnDemandOnly !== true) fail(`job_metadata_gpu_not_on_demand:${candidate.sourceToolId}`)
  if (job.metadata?.noIdleGpuRuntimeApproved !== true) fail(`job_metadata_idle_gpu_allowed:${candidate.sourceToolId}`)
  if (job.metadata?.startsOnlyForApprovedWorkerOrToolCall !== true) {
    fail(`job_metadata_gpu_start_policy_not_worker_call_only:${candidate.sourceToolId}`)
  }
  if (job.metadata?.cpuFallbackAllowedForHeavyTools !== false) fail(`job_metadata_cpu_fallback_not_false:${candidate.sourceToolId}`)
  if (job.metadata?.aiGraphicsRuntimeActivationPolicy?.onDemandOnly !== true) {
    fail(`job_policy_not_on_demand:${candidate.sourceToolId}`)
  }
  if (job.metadata?.aiGraphicsRuntimeActivationPolicy?.noIdleGpuRuntimeApproved !== true) {
    fail(`job_policy_idle_gpu_allowed:${candidate.sourceToolId}`)
  }
  if (job.metadata?.aiGraphicsRuntimeActivationPolicy?.startsOnlyForApprovedWorkerOrToolCall !== true) {
    fail(`job_policy_start_not_worker_call_only:${candidate.sourceToolId}`)
  }
  if (job.metadata?.aiGraphicsRuntimeActivationPolicy?.cpuFallbackAllowedForHeavyTools !== false) {
    fail(`job_policy_cpu_fallback_not_false:${candidate.sourceToolId}`)
  }
  const handoff = job.metadata?.aiGraphicsToolCallHandoff
  if (handoff?.mode !== 'metadata_dry_run') {
    fail(`job_handoff_bad_mode:${candidate.sourceToolId}:${handoff?.mode}`)
  }
  if (handoff?.canonicalToolId !== candidate.sourceToolId) {
    fail(`job_handoff_tool_mismatch:${candidate.sourceToolId}:${handoff?.canonicalToolId}`)
  }
  if (handoff?.productionToolId !== candidate.sourceProductionToolId) {
    fail(`job_handoff_production_tool_mismatch:${candidate.sourceToolId}:${handoff?.productionToolId}`)
  }
  if (handoff?.runtimeTarget !== candidate.sourceRuntimeTarget) {
    fail(`job_handoff_runtime_target_mismatch:${candidate.sourceToolId}:${handoff?.runtimeTarget}`)
  }
  if (!Array.isArray(handoff?.capabilityIds) || handoff.capabilityIds.length === 0) {
    fail(`job_handoff_missing_capabilities:${candidate.sourceToolId}`)
  }
  if (handoff?.planningOnly !== true) fail(`job_handoff_planning_only_not_true:${candidate.sourceToolId}`)
  if (handoff?.agentCanExecuteToolsNow !== false) {
    fail(`job_handoff_execute_not_false:${candidate.sourceToolId}`)
  }
  if (gpuTools.includes(candidate.sourceToolId)) {
    if (job.workerType !== 'gpu_ai_worker') fail(`gpu_tool_not_gpu_worker:${candidate.sourceToolId}:${job.workerType}`)
    if (!candidate.sourceRuntimeTarget?.includes('nvidia_l4')) {
      fail(`gpu_tool_not_l4_target:${candidate.sourceToolId}:${candidate.sourceRuntimeTarget}`)
    }
    if (candidate.sourceRuntimeTarget !== expectedGpuRuntimeTargets[candidate.sourceToolId]) {
      fail(`gpu_tool_runtime_target_mismatch:${candidate.sourceToolId}:${candidate.sourceRuntimeTarget}`)
    }
    if (job.metadata?.aiGraphicsRuntimeTarget !== expectedGpuRuntimeTargets[candidate.sourceToolId]) {
      fail(`job_metadata_gpu_runtime_target_mismatch:${candidate.sourceToolId}:${job.metadata?.aiGraphicsRuntimeTarget}`)
    }
  }
}

for (const output of [defaultOutput, awaitingOutput, approvedOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`false_gate_not_false:${key}`)
    }
  }
}

if (!scorecard.includes('ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime')) {
  fail('scorecard_missing_internal_beta_production_worker_job_readiness_decision')
}

const forbiddenTruePatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /productionWorkerJobEnqueueApprovedNow["`:\s]+true/i,
  /productionWorkerRouteExecutionApprovedNow["`:\s]+true/i,
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
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.md',
  'docs/tool-intelligence/ai-graphics/internal-beta-production-worker-job-readiness.json',
  'server/tool-registry/ai-graphics-internal-beta-production-worker-job-readiness.ts',
  'server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')
for (const pattern of forbiddenTruePatterns) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(file))) {
  fail('generated_media_staged')
}
if (git(['diff', '--name-only', '--', 'package-lock.json'])) fail('package_lock_changed')

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

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization": "tsx server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts",',
  '+    "ai-graphics:external-beta-live-enqueue-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-live-enqueue-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval": "tsx server/cli/ai-graphics-external-beta-controlled-runtime-execution-approval.ts",',
  '+    "ai-graphics:external-beta-controlled-runtime-execution-approval:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-runtime-execution-approval-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly": "tsx server/cli/ai-graphics-external-beta-candidate-evidence-assembly.ts",',
  '+    "ai-graphics:external-beta-candidate-evidence-assembly:diagnostics": "node scripts/validation/ai-graphics-external-beta-candidate-evidence-assembly-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-launch-controls": "tsx server/cli/ai-graphics-external-beta-launch-controls.ts",',
  '+    "ai-graphics:external-beta-launch-controls:diagnostics": "node scripts/validation/ai-graphics-external-beta-launch-controls-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:internal-beta-production-worker-gate-readiness": "tsx server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts",',
  '+    "ai-graphics:internal-beta-production-worker-gate-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs",',
  '+    "ai-graphics:beta-production-readiness-rollup": "tsx server/cli/ai-graphics-beta-production-readiness-rollup.ts",',
  '+    "ai-graphics:beta-production-readiness-rollup:diagnostics": "node scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval": "tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness": "tsx server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs",',
  '+    "ai-graphics:model-weight-source-catalog:diagnostics": "node scripts/validation/ai-graphics-model-weight-source-catalog-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-implementation-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-implementation-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-rpc-smoke-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-rpc-smoke-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-rpc-smoke-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle": "tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts",',
  '+    "ai-graphics:external-beta-evidence-admission-bundle:diagnostics": "node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  defaultStatus: defaultOutput.status,
  awaitingStatus: awaitingOutput.status,
  approvedStatus: approvedOutput.status,
  toolsCovered: allTools.length,
  productionWorkerJobPayloadsReadyWithProvidedEvidence:
    approvedOutput.productionWorkerJobPayloadsReadyWithProvidedEvidence,
  capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence:
    approvedOutput.capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence,
  productionWorkerJobPayloadsReadyNow: approvedOutput.productionWorkerJobPayloadsReadyNow,
  agentCanExecuteToolsNow: approvedOutput.booleans?.agentCanExecuteToolsNow,
  runtimeReadyNow: approvedOutput.booleans?.runtimeReadyNow,
}, null, 2))
