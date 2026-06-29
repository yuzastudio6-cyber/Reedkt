import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_per_tool_callable_result_gate_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_per_tool_callable_result_gate_accepted_runtime_still_blocked'
const runScriptName = 'ai-graphics:external-beta-per-tool-callable-result-gate'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs'

const sourceSmokeProofDecision =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_prepared_with_runtime_blocks'
const sourceSmokeProofStatus =
  'external_beta_api_route_worker_runtime_smoke_proof_accepted_with_runtime_blocks'

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
  'externalBetaTrafficEnabledNow',
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
  'workerLeaseCreatedByResultGate',
  'workerDispatchPerformedByResultGate',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByResultGate',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-per-tool-callable-result-gate.ts',
  'server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts',
  'scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /externalBetaCallableNow["`:\s=]+true/i,
  /externalBetaTrafficEnabledNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /privateArtifactWritePerformed["`:\s=]+true/i,
  /gpuRuntimeStartedForCallableResult["`:\s=]+true/i,
  /gpuRuntimePerformedByResultGate["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
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
    }
    : {
      runtimeTarget: 'node_cpu_static',
      workerType: 'render_worker',
      gpuRequiredForRuntime: false,
    }
}

function sourceSmokeProofFixture(toolId) {
  const runtime = runtimeForTool(toolId)
  const capabilityId = capabilityByTool[toolId]
  const candidate = {
    authorizationId:
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization',
    toolId,
    capabilityId,
    routePath: '/api/ai-graphics/external-beta/tool-call',
    routeId: `ai_graphics_external_beta_tool_route_${toolId}`,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    idempotencyKey:
      `external-beta-idempotency-${toolId}:worker-runtime-smoke-authorization`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    privateInputManifestRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/input-manifest.json`,
    privateOutputManifestRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/output-manifest.json`,
    privateTelemetryRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/telemetry.json`,
    privateLeaseAuditRef:
      `private://ai-graphics/external-beta/artifacts/${toolId}/lease-audit.json`,
    modelWeightOrCacheManifestRef: runtime.gpuRequiredForRuntime
      ? `private://ai-graphics/external-beta/artifacts/${toolId}/model-weight-or-cache-manifest.json`
      : null,
  }
  const savedWorkerRuntimeSmokeResult = {
    ok: true,
    decision:
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_passed_with_cleanup',
    status:
      'external_beta_api_route_worker_runtime_smoke_passed_private_non_production_no_tool_execution',
    sourceWorkerRuntimeSmokeAuthorizationRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/authorization.json`,
    sourceWorkerRuntimeSmokeAuthorizationAccepted: true,
    ...candidate,
    workerRuntimeSmokeExecutedInPrivateNonProduction: true,
    workerLeaseCreatedCount: 1,
    workerLeaseReleasedCount: 1,
    workerDispatchCount: 1,
    toolExecutionCount: 0,
    privateArtifactWriteCount: 0,
    routeExecutionCount: 0,
    providerRuntimeCount: 0,
    gpuRuntimeStartedForAcceptedJob: runtime.gpuRequiredForRuntime,
    gpuRuntimeReleasedAfterAcceptedJob: runtime.gpuRequiredForRuntime,
    gpuRuntimeIdleAfterCleanup: true,
    gpuRuntimeShouldStartNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    privateArtifactSandboxUsed: true,
    resultCaptureCompleted: true,
    qaGatePassedWithProvidedEvidence: true,
    telemetryCaptured: true,
    costWithinCeiling: true,
    rollbackReady: true,
    secretsRedactedFromOutput: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }

  return {
    decision: sourceSmokeProofDecision,
    sourceWorkerRuntimeSmokeAuthorizationDecision:
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization_prepared_with_runtime_blocks',
    status: sourceSmokeProofStatus,
    sourceAuthorizationAccepted: true,
    proofAcceptedWithProvidedEvidence: true,
    rejectionReasons: [],
    requestedToolId: toolId,
    capabilityId,
    workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence: 1,
    sourceAuthorizationAcceptedRequestsWithProvidedEvidence: 1,
    workerRuntimeSmokeAcceptedWithProvidedEvidence: 1,
    workerLeaseLifecycleAcceptedWithProvidedEvidence: 1,
    workerDispatchAcceptedWithProvidedEvidence: 1,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    gpuRuntimeStartedWithProvidedEvidence: runtime.gpuRequiredForRuntime ? 1 : 0,
    gpuRuntimeReleasedWithProvidedEvidence: runtime.gpuRequiredForRuntime ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceAuthorizationCandidate: candidate,
    savedWorkerRuntimeSmokeResult,
    booleans: {
      sourceWorkerRuntimeSmokeAuthorizationAccepted: true,
      savedWorkerRuntimeSmokeResultAcceptedWithProvidedEvidence: true,
      workerLeaseLifecycleAcceptedWithProvidedEvidence: true,
      workerDispatchAcceptedWithProvidedEvidence: true,
      toolExecutionAcceptedWithProvidedEvidence: false,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function callableResultFixture(sourceProof) {
  const candidate = sourceProof.sourceAuthorizationCandidate
  const sourceGpuStarted = sourceProof.gpuRuntimeStartedWithProvidedEvidence === 1
  const sourceGpuReleased = sourceProof.gpuRuntimeReleasedWithProvidedEvidence === 1
  return {
    ok: true,
    decision:
      'ai_graphics_external_beta_per_tool_callable_result_recorded_with_runtime_blocks',
    status:
      'external_beta_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked',
    sourceWorkerRuntimeSmokeProofRef:
      `private://ai-graphics/external-beta/callable-result/${candidate.toolId}/worker-runtime-smoke-proof.json`,
    sourceWorkerRuntimeSmokeProofAccepted: true,
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    routePath: candidate.routePath,
    routeId: candidate.routeId,
    queueName: candidate.queueName,
    queueJobType: candidate.queueJobType,
    approvedPlanSnapshotId: candidate.approvedPlanSnapshotId,
    creditReservationId: candidate.creditReservationId,
    idempotencyKey: candidate.idempotencyKey,
    runtimeTarget: candidate.runtimeTarget,
    workerType: candidate.workerType,
    gpuRequiredForRuntime: candidate.gpuRequiredForRuntime,
    privateInputManifestRef: candidate.privateInputManifestRef,
    privateOutputManifestRef: candidate.privateOutputManifestRef,
    privateTelemetryRef: candidate.privateTelemetryRef,
    privateLeaseAuditRef: candidate.privateLeaseAuditRef,
    modelWeightOrCacheManifestRef: candidate.modelWeightOrCacheManifestRef,
    callableEnvelopeRecordedInPrivateNonProduction: true,
    callableEnvelopeValidated: true,
    workerRuntimeSmokeProofAcceptedCount: 1,
    workerLeaseLifecycleAcceptedCount: 1,
    workerDispatchAcceptedCount: 1,
    requestAdmittedCount: 1,
    toolExecutionCount: 0,
    routeExecutionCount: 0,
    workerDispatchCount: 0,
    privateArtifactWriteCount: 0,
    providerRuntimeCount: 0,
    sourceGpuRuntimeStartedForAcceptedSmoke: sourceGpuStarted,
    sourceGpuRuntimeReleasedAfterAcceptedSmoke: sourceGpuReleased,
    gpuRuntimeStartedForCallableResult: false,
    gpuRuntimeReleasedAfterCallableResult: false,
    gpuRuntimeIdleAfterCleanup: true,
    gpuRuntimeShouldStartNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    qaGatePassedWithProvidedEvidence: true,
    telemetryCaptured: true,
    costWithinCeiling: true,
    rollbackReady: true,
    secretsRedactedFromOutput: true,
    publicArtifactCreated: false,
    signedUrlCreated: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
}

function privateRefs(toolId) {
  return [
    '--external-beta-per-tool-callable-result-evidence-ref',
    `private://ai-graphics/external-beta/callable-result/${toolId}/evidence.json`,
    '--external-beta-per-tool-callable-result-qa-ref',
    `private://ai-graphics/external-beta/callable-result/${toolId}/qa.json`,
    '--external-beta-per-tool-callable-result-cost-ref',
    `private://ai-graphics/external-beta/callable-result/${toolId}/cost.json`,
    '--external-beta-per-tool-callable-result-rollback-ref',
    `private://ai-graphics/external-beta/callable-result/${toolId}/rollback.json`,
  ]
}

function runGate(toolId, mutateResult, extraArgs = privateRefs(toolId)) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-callable-result-gate-'))
  const sourceProof = sourceSmokeProofFixture(toolId)
  const result = callableResultFixture(sourceProof)
  if (mutateResult) mutateResult(result)
  const sourcePath = writeJson(path.join(tempDir, 'source-proof.json'), sourceProof)
  const resultPath = writeJson(path.join(tempDir, 'callable-result.json'), result)
  return npmJson(runScriptName, [
    '--external-beta-worker-runtime-smoke-proof-packet',
    sourcePath,
    '--external-beta-per-tool-callable-result',
    resultPath,
    ...extraArgs,
  ])
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label}:expected=${expected}:actual=${actual}`)
}

function requireTruthy(actual, label) {
  if (actual !== true) fail(`${label}:expected=true:actual=${actual}`)
}

function requireFalse(actual, label) {
  if (actual !== false) fail(`${label}:expected=false:actual=${actual}`)
}

function verifyFalseGates(packet, label) {
  for (const key of falseGateKeys) {
    if (packet.booleans?.[key] !== false) {
      fail(`${label}:boolean_${key}_must_be_false`)
    }
  }
}

function verifyRequiredFiles() {
  requiredFiles.forEach(read)
}

function verifyPackageJson() {
  const packageJson = json('package.json')
  requireEqual(packageJson.scripts?.[runScriptName], runScriptCommand, 'package_run_script')
  requireEqual(
    packageJson.scripts?.[diagnosticScriptName],
    diagnosticScriptCommand,
    'package_diagnostic_script',
  )

  const currentPackage = JSON.parse(read('package.json'))
  const basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const current = JSON.stringify(currentPackage[section] ?? {}, null, 2)
    const base = JSON.stringify(basePackage[section] ?? {}, null, 2)
    if (current !== base) fail(`package_dependency_section_changed:${section}`)
  }

  const allowedPackageAdditions = [
    `+    "${runScriptName}": "${runScriptCommand}",`,
    `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
    '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
    '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
    '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
    '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
    '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
  ]
  const packageDiffLines = git(['diff', '--', 'package.json'])
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
  for (const line of packageDiffLines) {
    if (!allowedPackageAdditions.includes(line)) {
      fail(`unexpected_package_json_diff:${line}`)
    }
  }
}

function verifyPackageLockUnchanged() {
  const lockDiff = git(['diff', '--', 'package-lock.json'])
  if (lockDiff.trim().length > 0) fail('package_lock_changed')
}

function verifyTrackedAndChangedPaths() {
  const changed = git(['diff', '--name-only'])
    .split('\n')
    .filter(Boolean)
  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
  for (const file of [...changed, ...untracked]) {
    if (generatedArtifactPathPattern.test(file)) {
      fail(`generated_or_artifact_path_changed:${file}`)
    }
  }
}

function verifyDocs() {
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.perToolCallableResultGateAcceptedRequestsWithProvidedEvidence, 1, 'doc_json_gate_count')
  requireEqual(docJson.scope?.toolExecutionAcceptedWithProvidedEvidence, 0, 'doc_json_tool_execution_count')
  requireEqual(docJson.scope?.routeExecutionAcceptedWithProvidedEvidence, 0, 'doc_json_route_execution_count')
  requireEqual(docJson.scope?.privateArtifactWriteAcceptedWithProvidedEvidence, 0, 'doc_json_private_write_count')
  requireEqual(docJson.scope?.externalBetaCallableNowTools, 0, 'doc_json_callable_now_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 0, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of [
    'externalBetaPerToolCallableResultGatePrepared',
    'sourceWorkerRuntimeSmokeProofAccepted',
    'perToolCallableResultAcceptedWithProvidedEvidence',
    'savedPerToolCallableResultAcceptedWithProvidedEvidence',
    'all21ToolsCovered',
    'all12CapabilitiesCovered',
    'all8GpuToolsTargetGpuRuntime',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'sourceGpuRuntimeStartedForAcceptedSmoke',
    'sourceGpuRuntimeReleasedAfterAcceptedSmoke',
    'gpuRuntimeIdleAfterCleanup',
    'callableEnvelopeAcceptedWithProvidedEvidence',
    'workerRuntimeSmokeProofAcceptedWithProvidedEvidence',
    'workerLeaseLifecycleAcceptedWithProvidedEvidence',
    'workerDispatchAcceptedWithProvidedEvidence',
    'qaGateAcceptedWithProvidedEvidence',
    'telemetryAcceptedWithProvidedEvidence',
    'agentCanSelectForPlanning',
  ]) {
    requireTruthy(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }
  for (const key of falseGateKeys) {
    requireFalse(docJson.booleans?.[key], `doc_json_boolean_${key}`)
  }

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.md')
  for (const required of [
    decision,
    'private non-production per-tool callable result envelope',
    'No GPU startup by this callable-result gate.',
    '`gpuRuntimeStartedForCallableResult=false`',
    '`gpuRuntimeShouldStartNow=false`',
    'User traffic and production execution remain blocked',
  ]) {
    if (!md.includes(required)) fail(`gate_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta Per-Tool Callable Result Gate',
    decision,
    'one private non-production per-tool callable result envelope',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.json',
    'docs/tool-intelligence/ai-graphics/external-beta-per-tool-callable-result-gate.md',
    'docs/production-beta-readiness-scorecard.md',
  ]) {
    const content = read(file)
    forbiddenDocPatterns.forEach((pattern) => {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    })
  }
}

function verifySourceWiring() {
  const registry = read('server/tool-registry/index.ts')
  if (!registry.includes("export * from './ai-graphics-external-beta-per-tool-callable-result-gate'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-per-tool-callable-result-gate.ts')
  for (const required of [
    decision,
    'saved_per_tool_callable_result_only',
    'gpuRuntimeMayOnlyAppearInAcceptedSourceSmokeProof: true',
    'gpuRuntimeMustRemainIdleAfterSourceSmokeCleanup: true',
    'noLiveApiRouteExecutionByResultGate: true',
    'noToolExecutionByResultGate: true',
    'gpuRuntimeStartedForCallableResult: false',
    'gpuRuntimePerformedByResultGate: false',
    'gpuRuntimeShouldStartNow: false',
    'toolExecutionAcceptedWithProvidedEvidence: false',
  ]) {
    if (!evaluator.includes(required)) fail(`evaluator_missing:${required}`)
  }
}

function verifyCliBehavior() {
  const missing = npmJson(runScriptName)
  requireEqual(
    missing.status,
    'missing_external_beta_api_route_worker_runtime_smoke_proof',
    'missing_cli_status',
  )
  requireFalse(missing.input?.liveApiRouteExecutionPerformedByThisCommand, 'missing_cli_no_route')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.toolExecutionPerformed, 'missing_cli_no_tool')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const cpu = runGate('d3')
  requireEqual(cpu.status, acceptedStatus, 'cpu_status')
  requireTruthy(cpu.callableResultGateAcceptedWithProvidedEvidence, 'cpu_gate_accepted')
  requireEqual(cpu.perToolCallableResultGateAcceptedRequestsWithProvidedEvidence, 1, 'cpu_gate_count')
  requireEqual(cpu.callableEnvelopeAcceptedWithProvidedEvidence, 1, 'cpu_envelope_count')
  requireEqual(cpu.toolExecutionAcceptedWithProvidedEvidence, 0, 'cpu_tool_execution_count')
  requireEqual(cpu.routeExecutionAcceptedWithProvidedEvidence, 0, 'cpu_route_execution_count')
  requireEqual(cpu.sourceGpuRuntimeStartedWithProvidedEvidence, 0, 'cpu_source_gpu_started_count')
  requireFalse(cpu.booleans?.sourceGpuRuntimeStartedForAcceptedSmoke, 'cpu_source_gpu_started_bool')
  requireFalse(cpu.booleans?.gpuRuntimeStartedForCallableResult, 'cpu_gate_gpu_started_bool')
  verifyFalseGates(cpu, 'cpu')

  const gpu = runGate('sam2')
  requireEqual(gpu.status, acceptedStatus, 'gpu_status')
  requireTruthy(gpu.callableResultGateAcceptedWithProvidedEvidence, 'gpu_gate_accepted')
  requireEqual(gpu.perToolCallableResultGateAcceptedRequestsWithProvidedEvidence, 1, 'gpu_gate_count')
  requireEqual(gpu.sourceGpuRuntimeStartedWithProvidedEvidence, 1, 'gpu_source_started_count')
  requireEqual(gpu.sourceGpuRuntimeReleasedWithProvidedEvidence, 1, 'gpu_source_released_count')
  requireTruthy(gpu.booleans?.sourceGpuRuntimeStartedForAcceptedSmoke, 'gpu_source_started_bool')
  requireTruthy(gpu.booleans?.sourceGpuRuntimeReleasedAfterAcceptedSmoke, 'gpu_source_released_bool')
  requireFalse(gpu.booleans?.gpuRuntimeStartedForCallableResult, 'gpu_gate_gpu_started_bool')
  requireFalse(gpu.booleans?.gpuRuntimeReleasedAfterCallableResult, 'gpu_gate_gpu_released_bool')
  verifyFalseGates(gpu, 'gpu')

  const badToolExecution = runGate('d3', (result) => {
    result.toolExecutionCount = 1
  })
  requireEqual(
    badToolExecution.status,
    'external_beta_per_tool_callable_result_rejected',
    'bad_tool_execution_status',
  )
  if (!badToolExecution.rejectionReasons?.some((reason) => reason.includes('must not execute tools'))) {
    fail('bad_tool_execution_missing_rejection_reason')
  }

  const badPublicEvidence = runGate('d3', undefined, [
    '--external-beta-per-tool-callable-result-evidence-ref',
    'https://example.invalid/public/evidence.json',
    '--external-beta-per-tool-callable-result-qa-ref',
    'private://ai-graphics/external-beta/callable-result/d3/qa.json',
    '--external-beta-per-tool-callable-result-cost-ref',
    'private://ai-graphics/external-beta/callable-result/d3/cost.json',
    '--external-beta-per-tool-callable-result-rollback-ref',
    'private://ai-graphics/external-beta/callable-result/d3/rollback.json',
  ])
  requireEqual(
    badPublicEvidence.status,
    'external_beta_per_tool_callable_result_rejected',
    'bad_public_evidence_status',
  )
  if (!badPublicEvidence.rejectionReasons?.some((reason) => reason.includes('evidence ref'))) {
    fail('bad_public_evidence_missing_rejection_reason')
  }
}

verifyRequiredFiles()
verifyPackageJson()
verifyPackageLockUnchanged()
verifyTrackedAndChangedPaths()
verifyDocs()
verifySourceWiring()
verifyCliBehavior()

if (failures.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    decision,
    status: 'ai_graphics_external_beta_per_tool_callable_result_gate_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_per_tool_callable_result_gate_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: tools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  cpuCallableResultFixtureAccepted: true,
  gpuCallableResultFixtureAcceptedWithSourceGpuOnly: true,
  callableResultGateExecutedRoutes: false,
  callableResultGateExecutedTools: false,
  callableResultGateStartedGpu: false,
  agentCanExecuteToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
