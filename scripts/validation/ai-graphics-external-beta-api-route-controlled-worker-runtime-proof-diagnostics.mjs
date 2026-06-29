import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-controlled-worker-runtime-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs'

const tools = [
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

const capabilityByTool = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'data_visualization',
  vega_lite: 'chart_overlay',
  vega: 'data_visualization',
  satori: 'svg_graphics',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'externalBetaCallableNow',
  'controlledWorkerRuntimeProofApprovedNow',
  'apiRouteExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'privateArtifactWriteApprovedNow',
  'workerLeaseCreationApprovedNow',
  'workerDispatchApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'routeExecutionPerformed',
  'backendQueueSubmissionPerformed',
  'privateArtifactWritePerformed',
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
  'workerDispatchPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []

function fail(message) {
  failures.push(message)
}

function read(file) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function npmJson(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return file
}

function runtimeForTool(toolId) {
  return gpuTools.includes(toolId)
    ? {
      runtimeTarget: `native_linux_amd64_nvidia_l4_${toolId}_runtime`,
      workerType: 'gpu_ai_worker',
      gpuRequiredForRuntime: true,
      runtimeProofSource: 'native_gpu_runtime_proof',
    }
    : {
      runtimeTarget: 'node_cpu_static',
      workerType: 'render_worker',
      gpuRequiredForRuntime: false,
      runtimeProofSource:
        toolId === 'satori'
          ? 'satori_font_runtime_proof'
          : ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'].includes(toolId)
            ? 'browser_runtime_proof'
            : 'node_runtime_proof',
    }
}

function artifactAdmissionFixture(toolId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const capabilityId = capabilityByTool[toolId]
  const admissionCandidate = {
    admissionId: 'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission',
    toolId,
    capabilityId,
    routePath: '/api/ai-graphics/external-beta/tool-call',
    routeId: `ai_graphics_external_beta_tool_route_${toolId}`,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    idempotencyKey: `external-beta-idempotency-${toolId}`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    privateInputManifestRef: `private://ai-graphics/external-beta/artifacts/${toolId}/input-manifest.json`,
    privateOutputManifestRef: `private://ai-graphics/external-beta/artifacts/${toolId}/output-manifest.json`,
    privateTelemetryRef: `private://ai-graphics/external-beta/artifacts/${toolId}/telemetry.json`,
    privateLeaseAuditRef: `private://ai-graphics/external-beta/artifacts/${toolId}/lease-audit.json`,
    modelWeightOrCacheManifestRef: runtime.gpuRequiredForRuntime
      ? `private://ai-graphics/external-beta/artifacts/${toolId}/model-weight-or-cache-manifest.json`
      : null,
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: true,
    sourceHandoffAccepted: true,
    privateArtifactManifestAccepted: true,
    toolRouteRuntimeProofAccepted: true,
    privateArtifactManifestCoversRequestedTool: true,
    toolRouteRuntimeProofCoversRequestedTool: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: runtime.gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    routeExecutionApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    providerRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
  return {
    decision: 'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked',
    requestedToolId: toolId,
    capabilityId,
    sourceHandoffAccepted: true,
    sourcePrivateArtifactManifestAccepted: true,
    sourceToolRouteRuntimeProofAccepted: true,
    privateArtifactManifestCoversRequestedTool: true,
    toolRouteRuntimeProofCoversRequestedTool: true,
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: true,
    artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence: 1,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourcePrivateArtifactRecordsReadyWithProvidedEvidence: 21,
    sourceToolRouteRecordsReadyWithProvidedEvidence: 21,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    admissionCandidate,
    booleans: {
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function perToolRuntimeProofFixture(overrides = {}) {
  const records = tools.map((toolId) => {
    const runtime = runtimeForTool(toolId)
    return {
      toolId,
      productionToolId: toolId,
      workerType: runtime.workerType,
      runtimeTarget: runtime.runtimeTarget,
      capabilityIds: [capabilityByTool[toolId]],
      runtimeProofSource: runtime.runtimeProofSource,
      runtimeProofStatus: 'runtime_proof_accepted_with_provided_evidence',
      sourceProofStatus: `${runtime.runtimeProofSource}_accepted`,
      routeRuntimeProofAccepted: true,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      runtimeProofAcceptedWithProvidedEvidence: true,
      blockedReason: null,
      gpuRuntimeTargeted: runtime.gpuRequiredForRuntime,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
    }
  })
  return {
    sourceDecision: 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks',
    decision: 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks',
    sourceToolRouteRuntimeProofAccepted: true,
    sourceToolRouteRuntimeProofBridgeAccepted: true,
    serviceRoleQueueSmokeAuthorizationRef:
      'private://ai-graphics/external-beta/service-role-queue-smoke/authorization.json',
    sourceExternalBetaNativeGpuProofCollectionAccepted: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    runtimeProofRecordsPrepared: 21,
    runtimeProofAcceptedWithProvidedEvidenceTools: 21,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
    jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
    nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
    blockedPendingNativeGpuRuntimeProofTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records,
    booleans: {
      sourceToolRouteRuntimeProofAccepted: true,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      all13JsRuntimeProofsAccepted: true,
      all8NativeGpuRuntimeProofsAccepted: true,
      agentCanExecuteToolsNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function controls() {
  return [
    '--external-beta-controlled-worker-runtime-proof-policy-ref',
    'external-beta-controlled-runtime://policy/worker-runtime-proof',
    '--external-beta-worker-lease-policy-ref',
    'external-beta-controlled-runtime://policy/worker-lease',
    '--external-beta-worker-dispatch-block-policy-ref',
    'external-beta-controlled-runtime://policy/worker-dispatch-block',
    '--external-beta-private-artifact-write-block-policy-ref',
    'external-beta-controlled-runtime://policy/private-artifact-write-block',
    '--external-beta-runtime-result-capture-policy-ref',
    'external-beta-controlled-runtime://policy/runtime-result-capture',
    '--external-beta-tool-execution-block-policy-ref',
    'external-beta-controlled-runtime://policy/tool-execution-block',
    '--external-beta-gpu-on-demand-policy-ref',
    'external-beta-controlled-runtime://policy/gpu-on-demand',
    '--external-beta-cost-guardrail-ref',
    'external-beta-controlled-runtime://policy/cost-guardrail',
    '--external-beta-qa-gate-policy-ref',
    'external-beta-controlled-runtime://policy/qa-gate',
    '--external-beta-telemetry-ref',
    'external-beta-controlled-runtime://telemetry/worker-runtime-proof',
    '--external-beta-rollback-plan-ref',
    'external-beta-controlled-runtime://rollback/worker-runtime-proof',
  ]
}

function proofArgs(admissionPath, runtimeProofPath, includeControls = true) {
  return [
    ...(admissionPath ? ['--external-beta-artifact-tool-route-admission-packet', admissionPath] : []),
    ...(runtimeProofPath ? ['--external-beta-per-tool-runtime-proof-packet', runtimeProofPath] : []),
    ...(includeControls ? controls() : []),
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseGateKeys) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-artifact-tool-route-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-controlled-worker-runtime-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== decision) fail(`docs_decision_mismatch:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status_mismatch:${docs.status}`)

for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}

for (const phrase of [
  'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked',
  '--external-beta-artifact-tool-route-admission-packet',
  '--external-beta-per-tool-runtime-proof-packet',
  'validatesSavedProofPacketsOnly',
  'controlledWorkerRuntimeProofOnlyNoLeaseCreation',
  'controlledWorkerRuntimeProofOnlyNoWorkerDispatch',
  'controlledWorkerRuntimeProofOnlyNoToolExecution',
  'controlledWorkerRuntimeProofOnlyNoPrivateArtifactWrite',
  'noGpuRuntimeStartByControlledProof',
  'sourcePerToolRuntimeProofCoversRequestedTool',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}

for (const block of [
  'live worker lease creation',
  'worker dispatch',
  'tool execution',
  'private artifact write',
  'Tool Route execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]) {
  if (!docs.blockedRuntimeActions?.some((entry) => entry.toLowerCase().includes(block.toLowerCase()))) {
    fail(`docs_missing_block:${block}`)
  }
  if (!docsMd.toLowerCase().includes(block.toLowerCase())) {
    fail(`docs_md_missing_block:${block}`)
  }
}
assertFalseBooleans('docs', docs.booleans)
if (!scorecard.includes('AI Graphics External-Beta API Route Controlled Worker Runtime Proof')) {
  fail('scorecard_missing_section')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-controlled-worker-runtime-proof-'))
try {
  const d3AdmissionPath = writeJson(path.join(tmpRoot, 'd3-admission.json'), artifactAdmissionFixture('d3'))
  const sam2AdmissionPath = writeJson(path.join(tmpRoot, 'sam2-admission.json'), artifactAdmissionFixture('sam2'))
  const rejectedAdmissionPath = writeJson(path.join(tmpRoot, 'rejected-admission.json'), artifactAdmissionFixture('d3', {
    status: 'external_beta_api_route_worker_artifact_tool_route_admission_rejected',
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: false,
  }))
  const perToolPath = writeJson(path.join(tmpRoot, 'per-tool-runtime-proof.json'), perToolRuntimeProofFixture())
  const rejectedPerToolPath = writeJson(path.join(tmpRoot, 'rejected-per-tool-runtime-proof.json'), perToolRuntimeProofFixture({
    decision: 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks',
    runtimeProofAcceptedWithProvidedEvidenceTools: 13,
    nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
    blockedPendingNativeGpuRuntimeProofTools: 8,
  }))
  const missingSam2RecordPath = writeJson(path.join(tmpRoot, 'missing-sam2-runtime-proof.json'), perToolRuntimeProofFixture({
    records: perToolRuntimeProofFixture().records.filter((record) => record.toolId !== 'sam2'),
  }))

  const missingAdmission = npmJson(runScriptName, [])
  if (missingAdmission.status !== 'missing_external_beta_api_route_worker_artifact_tool_route_admission') {
    fail('missing_admission_wrong_status')
  }

  const rejectedAdmission = npmJson(runScriptName, proofArgs(rejectedAdmissionPath, perToolPath))
  if (rejectedAdmission.status !== 'external_beta_api_route_worker_artifact_tool_route_admission_rejected') {
    fail('rejected_admission_wrong_status')
  }

  const missingPerTool = npmJson(runScriptName, proofArgs(d3AdmissionPath, null))
  if (missingPerTool.status !== 'missing_external_beta_per_tool_runtime_proof') {
    fail('missing_per_tool_wrong_status')
  }

  const rejectedPerTool = npmJson(runScriptName, proofArgs(d3AdmissionPath, rejectedPerToolPath))
  if (rejectedPerTool.status !== 'external_beta_per_tool_runtime_proof_rejected') {
    fail('rejected_per_tool_wrong_status')
  }

  const missingControls = npmJson(runScriptName, proofArgs(d3AdmissionPath, perToolPath, false))
  if (missingControls.status !== 'missing_external_beta_controlled_worker_runtime_proof_controls') {
    fail('missing_controls_wrong_status')
  }

  const missingRecord = npmJson(runScriptName, proofArgs(sam2AdmissionPath, missingSam2RecordPath))
  if (missingRecord.status !== 'external_beta_per_tool_runtime_proof_rejected') {
    fail('missing_record_wrong_status')
  }

  const acceptedD3 = npmJson(runScriptName, proofArgs(d3AdmissionPath, perToolPath))
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.requestedToolId !== 'd3') fail('accepted_d3_tool_mismatch')
  if (acceptedD3.controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence !== 1) {
    fail('accepted_d3_proof_count_not_1')
  }
  if (acceptedD3.sourceRuntimeProofAcceptedWithProvidedEvidenceTools !== 21) {
    fail('accepted_d3_runtime_tools_not_21')
  }
  if (acceptedD3.controlledWorkerRuntimeProofCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = npmJson(runScriptName, proofArgs(sam2AdmissionPath, perToolPath))
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.requestedToolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
  if (acceptedSam2.controlledWorkerRuntimeProofCandidate?.workerType !== 'gpu_ai_worker') {
    fail('accepted_sam2_worker_type_mismatch')
  }
  if (acceptedSam2.controlledWorkerRuntimeProofCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
    fail('accepted_sam2_gpu_start_allowed_not_true')
  }
  if (acceptedSam2.booleans?.gpuRuntimeShouldStartNow !== false) {
    fail('accepted_sam2_gpu_should_start_not_false')
  }
  assertFalseBooleans('accepted_sam2', acceptedSam2.booleans)
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const combinedDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /controlledWorkerRuntimeProofApprovedNow["'`\s:]*true/i,
  /privateArtifactWriteApprovedNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerLeaseCreationApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedDocs)) fail(`forbidden_docs_claim:${pattern}`)
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
])
for (const rawLine of packageDiff.split('\n')) {
  const line = rawLine.trimEnd()
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

const lockDiff = git(['diff', '--', 'package-lock.json'])
if (lockDiff.trim().length > 0) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only']).trim().split('\n').filter(Boolean)
for (const file of changedFiles) {
  if (file.includes('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_changed:${file}`)
  }
  if (/\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i.test(file)) {
    fail(`media_artifact_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(`AI graphics external-beta API route controlled worker runtime proof diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.length,
  controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence: 1,
  sourceRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
