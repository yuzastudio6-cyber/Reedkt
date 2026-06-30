import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs'

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
  'liveWorkerRuntimeSmokeAuthorizedNow',
  'workerRuntimeSmokeExecutedNow',
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
        ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'].includes(toolId)
          ? 'browser_runtime_proof'
          : toolId === 'satori'
            ? 'satori_font_runtime_proof'
            : 'node_runtime_proof',
    }
}

function controlledWorkerRuntimeProofFixture(toolId) {
  const runtime = runtimeForTool(toolId)
  const capabilityId = capabilityByTool[toolId]
  const candidate = {
    proofId: 'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof',
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
    runtimeProofSource: runtime.runtimeProofSource,
    runtimeProofStatus: 'runtime_proof_accepted_with_provided_evidence',
    controlledWorkerRuntimeProofPreparedWithProvidedEvidence: true,
    sourceArtifactToolRouteAdmissionAccepted: true,
    sourcePerToolRuntimeProofAccepted: true,
    sourcePerToolRuntimeProofCoversRequestedTool: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: runtime.gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    workerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    privateArtifactWriteApprovedNow: false,
    routeExecutionApprovedNow: false,
    providerRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
  return {
    decision:
      'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked',
    requestedToolId: toolId,
    capabilityId,
    sourceArtifactToolRouteAdmissionAccepted: true,
    sourcePerToolRuntimeProofAccepted: true,
    sourcePerToolRuntimeProofCoversRequestedTool: true,
    missingControlledWorkerRuntimeProofControls: [],
    controlledWorkerRuntimeProofPreparedWithProvidedEvidence: true,
    controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence: 1,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    controlledWorkerRuntimeProofCandidate: candidate,
    booleans: {
      agentCanExecuteToolsNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      routeExecutionApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

function liveEnqueueAuthorizationFixture() {
  return {
    decision: 'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks',
    status: 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked',
    liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveQueueWritesApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    toolExecutionApprovedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      liveEnqueueAuthorizationRecordAccepted: true,
      all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence: true,
      agentCanExecuteToolsNow: false,
      liveQueueWriteApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

function acceptedArgs(controlledPath, livePath) {
  return [
    '--external-beta-controlled-worker-runtime-proof-packet',
    controlledPath,
    '--external-beta-live-enqueue-authorization-packet',
    livePath,
    '--external-beta-worker-runtime-smoke-operator-confirmation-ref',
    'external-beta-worker-runtime-smoke://operator/confirmation',
    '--external-beta-worker-runtime-smoke-environment-ref',
    'external-beta-worker-runtime-smoke://environment/private-non-production',
    '--external-beta-worker-runtime-smoke-runbook-ref',
    'external-beta-worker-runtime-smoke://runbook/smoke',
    '--external-beta-worker-runtime-smoke-lease-ttl-policy-ref',
    'external-beta-worker-runtime-smoke://policy/lease-ttl',
    '--external-beta-worker-runtime-smoke-claim-isolation-ref',
    'external-beta-worker-runtime-smoke://policy/claim-isolation',
    '--external-beta-worker-runtime-smoke-private-artifact-sandbox-ref',
    'external-beta-worker-runtime-smoke://artifact/sandbox',
    '--external-beta-worker-runtime-smoke-result-capture-ref',
    'external-beta-worker-runtime-smoke://result/capture',
    '--external-beta-worker-runtime-smoke-gpu-on-demand-policy-ref',
    'external-beta-worker-runtime-smoke://policy/gpu-on-demand',
    '--external-beta-worker-runtime-smoke-cost-guardrail-ref',
    'external-beta-worker-runtime-smoke://policy/cost',
    '--external-beta-worker-runtime-smoke-qa-gate-ref',
    'external-beta-worker-runtime-smoke://policy/qa',
    '--external-beta-worker-runtime-smoke-telemetry-ref',
    'external-beta-worker-runtime-smoke://telemetry/worker-runtime-smoke',
    '--external-beta-worker-runtime-smoke-rollback-plan-ref',
    'external-beta-worker-runtime-smoke://rollback/worker-runtime-smoke',
  ]
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts',
  'server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/production-beta-readiness-scorecard.md',
  'server/tool-registry/index.ts',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== decision) fail(`docs_decision:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status:${docs.status}`)
if (docs.scope?.totalAiGraphicsTools !== 21) fail('docs_tools_count_not_21')
if (docs.scope?.productFacingCapabilities !== 12) fail('docs_capabilities_count_not_12')
if (docs.scope?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_count_not_8')
if (docs.scope?.workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence !== 1) {
  fail('docs_authorization_requests_not_1')
}
for (const tool of tools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const key of [
  'externalBetaApiRouteWorkerRuntimeSmokeAuthorizationPrepared',
  'sourceControlledWorkerRuntimeProofAccepted',
  'sourceLiveEnqueueAuthorizationAccepted',
  'sourceControlledWorkerRuntimeProofCoversRequestedTool',
  'workerRuntimeSmokeAuthorizationControlsAccepted',
  'workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'liveEnqueueAuthorizationRecordedForAll21Tools',
  'operatorConfirmationRefAccepted',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_not_false:${key}`)
}
for (const phrase of [
  '--external-beta-controlled-worker-runtime-proof-packet',
  '--external-beta-live-enqueue-authorization-packet',
  'operator confirmation',
  'private non-production external-beta',
  'worker-runtime smoke',
  'gpuRuntimeShouldStartNow',
  'liveWorkerRuntimeSmokeAuthorizedNow',
  'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta API Route Worker Runtime Smoke Authorization')) {
  fail('scorecard_missing_worker_runtime_smoke_authorization')
}

const missingOutput = npmJson(runScriptName)
if (
  missingOutput.status !==
  'missing_external_beta_api_route_controlled_worker_runtime_proof'
) {
  fail(`missing_output_status:${missingOutput.status}`)
}
if (missingOutput.workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence !== 0) {
  fail('missing_authorization_prepared_not_0')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-runtime-smoke-authorization-'))
try {
  const livePath = writeJson(
    path.join(tmpRoot, 'live-enqueue-authorization.json'),
    liveEnqueueAuthorizationFixture(),
  )
  for (const toolId of ['d3', 'sam2']) {
    const controlledPath = writeJson(
      path.join(tmpRoot, `controlled-worker-runtime-proof-${toolId}.json`),
      controlledWorkerRuntimeProofFixture(toolId),
    )
    const accepted = npmJson(runScriptName, acceptedArgs(controlledPath, livePath))
    if (accepted.status !== acceptedStatus) fail(`accepted_status:${toolId}:${accepted.status}`)
    if (accepted.workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence !== 1) {
      fail(`accepted_requests_not_1:${toolId}`)
    }
    if (accepted.authorizationCandidate?.toolId !== toolId) {
      fail(`accepted_candidate_tool:${toolId}:${accepted.authorizationCandidate?.toolId}`)
    }
    if (accepted.authorizationCandidate?.liveWorkerRuntimeSmokeAuthorizedNow !== false) {
      fail(`accepted_live_smoke_authorized_not_false:${toolId}`)
    }
    if (accepted.authorizationCandidate?.workerDispatchApprovedNow !== false) {
      fail(`accepted_worker_dispatch_not_false:${toolId}`)
    }
    if (accepted.authorizationCandidate?.toolExecutionApprovedNow !== false) {
      fail(`accepted_tool_execution_not_false:${toolId}`)
    }
    if (accepted.gpuRuntimeShouldStartNow !== false) {
      fail(`accepted_gpu_start_not_false:${toolId}`)
    }
    const expectedGpu = toolId === 'sam2'
    if (
      accepted.authorizationCandidate
        ?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== expectedGpu
    ) {
      fail(`accepted_gpu_allowed:${toolId}`)
    }
    for (const key of falseGateKeys) {
      if (accepted.booleans?.[key] !== false) {
        fail(`accepted_false_gate_not_false:${toolId}:${key}`)
      }
    }
  }

  const unsafeControlledPath = writeJson(
    path.join(tmpRoot, 'controlled-worker-runtime-proof-unsafe.json'),
    controlledWorkerRuntimeProofFixture('sam2'),
  )
  const unsafe = npmJson(runScriptName, [
    '--external-beta-controlled-worker-runtime-proof-packet',
    unsafeControlledPath,
    '--external-beta-live-enqueue-authorization-packet',
    livePath,
    '--external-beta-worker-runtime-smoke-operator-confirmation-ref',
    'signed-url://unsafe/operator',
    '--external-beta-worker-runtime-smoke-environment-ref',
    'https://example.invalid/environment',
    '--external-beta-worker-runtime-smoke-runbook-ref',
    'external-beta-worker-runtime-smoke://runbook/smoke',
    '--external-beta-worker-runtime-smoke-lease-ttl-policy-ref',
    'external-beta-worker-runtime-smoke://policy/lease-ttl',
    '--external-beta-worker-runtime-smoke-claim-isolation-ref',
    'external-beta-worker-runtime-smoke://policy/claim-isolation',
    '--external-beta-worker-runtime-smoke-private-artifact-sandbox-ref',
    'external-beta-worker-runtime-smoke://artifact/sandbox',
    '--external-beta-worker-runtime-smoke-result-capture-ref',
    'external-beta-worker-runtime-smoke://result/capture',
    '--external-beta-worker-runtime-smoke-gpu-on-demand-policy-ref',
    'external-beta-worker-runtime-smoke://policy/gpu-on-demand',
    '--external-beta-worker-runtime-smoke-cost-guardrail-ref',
    'external-beta-worker-runtime-smoke://policy/cost',
    '--external-beta-worker-runtime-smoke-qa-gate-ref',
    'external-beta-worker-runtime-smoke://policy/qa',
    '--external-beta-worker-runtime-smoke-telemetry-ref',
    'external-beta-worker-runtime-smoke://telemetry/worker-runtime-smoke',
    '--external-beta-worker-runtime-smoke-rollback-plan-ref',
    'external-beta-worker-runtime-smoke://rollback/worker-runtime-smoke',
  ])
  if (unsafe.status !== 'missing_external_beta_worker_runtime_smoke_authorization_controls') {
    fail(`unsafe_status:${unsafe.status}`)
  }
  if (!JSON.stringify(unsafe.missingWorkerRuntimeSmokeAuthorizationControls ?? []).includes('not private')) {
    fail('unsafe_missing_not_private_reason')
  }
  if (unsafe.workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence !== 0) {
    fail('unsafe_prepared_not_0')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const forbiddenDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /liveWorkerRuntimeSmokeAuthorizedNow["'`\s:]*true/i,
  /workerRuntimeSmokeExecutedNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /gpuRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(forbiddenDocs)) fail(`forbidden_docs_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')
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
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs",',
  `+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",`,
  `+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",`,
  `+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",`,
  `+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",`,
  `+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",`,
  `+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",`,
  `+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",`,
  '+    "ai-graphics:external-beta-all-21-activation-rollup": "tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup:diagnostics": "node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activated-launch-readiness": "tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts",',
  '+    "ai-graphics:external-beta-activated-launch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts.trim()) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const trackedGenerated = changedFiles.filter((file) => (
  /(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(file) ||
  /\.(mp4|mov|webm|png|jpg|jpeg|gif|webp)$/i.test(file)
))
if (trackedGenerated.length) fail(`generated_output_tracked:${trackedGenerated.join(',')}`)

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: 21,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: 8,
  workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence: 1,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
