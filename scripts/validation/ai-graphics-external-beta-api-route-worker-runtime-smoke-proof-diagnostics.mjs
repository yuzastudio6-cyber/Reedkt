import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_worker_runtime_smoke_proof_accepted_with_runtime_blocks'
const runScriptName =
  'ai-graphics:external-beta-api-route-worker-runtime-smoke-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs'

const sourceAuthorizationDecision =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization_prepared_with_runtime_blocks'
const sourceAuthorizationStatus =
  'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked'

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
  'workerRuntimeSmokeApprovedNow',
  'workerRuntimeSmokeExecutedByValidator',
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
  'workerLeaseCreatedByValidator',
  'workerDispatchPerformedByValidator',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformedByValidator',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts',
  'server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-controlled-worker-runtime-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const generatedArtifactPathPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /externalBetaCallableNow["`:\s=]+true/i,
  /workerRuntimeSmokeApprovedNow["`:\s=]+true/i,
  /workerRuntimeSmokeExecutedByValidator["`:\s=]+true/i,
  /workerLeaseCreatedByValidator["`:\s=]+true/i,
  /workerDispatchPerformedByValidator["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /privateArtifactWritePerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformedByValidator["`:\s=]+true/i,
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

function authorizationPacketFixture(toolId) {
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
    sourceControlledWorkerRuntimeProofAccepted: true,
    sourceLiveEnqueueAuthorizationAccepted: true,
    workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
    operatorConfirmationRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/operator-confirmation.json`,
    nonProductionEnvironmentRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/environment.json`,
    runbookRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/runbook.md`,
    leaseTtlPolicyRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/lease-ttl-policy.json`,
    claimIsolationRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/claim-isolation.json`,
    privateArtifactSandboxRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/artifact-sandbox.json`,
    resultCaptureRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/result-capture.json`,
    gpuOnDemandPolicyRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/gpu-on-demand-policy.json`,
    costGuardrailRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/cost-guardrail.json`,
    qaGateRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/qa-gate.json`,
    telemetryRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/telemetry.json`,
    rollbackPlanRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/rollback-plan.json`,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      runtime.gpuRequiredForRuntime,
    gpuRuntimeShouldStartNow: false,
    liveWorkerRuntimeSmokeAuthorizedNow: false,
    liveWorkerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    privateArtifactWriteApprovedNow: false,
    routeExecutionApprovedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }

  return {
    decision: sourceAuthorizationDecision,
    status: sourceAuthorizationStatus,
    requestedToolId: toolId,
    capabilityId,
    sourceControlledWorkerRuntimeProofAccepted: true,
    sourceLiveEnqueueAuthorizationAccepted: true,
    sourceControlledWorkerRuntimeProofCoversRequestedTool: true,
    missingWorkerRuntimeSmokeAuthorizationControls: [],
    workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
    workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence: 1,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 21,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    authorizationCandidate: candidate,
    booleans: {
      liveWorkerRuntimeSmokeAuthorizedNow: false,
      workerRuntimeSmokeExecutedNow: false,
      agentCanExecuteToolsNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

function smokeResultFixture(authorizationPacket) {
  const candidate = authorizationPacket.authorizationCandidate
  const gpuRequired = candidate.gpuRequiredForRuntime === true
  return {
    ok: true,
    decision:
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_passed_with_cleanup',
    status:
      'external_beta_api_route_worker_runtime_smoke_passed_private_non_production_no_tool_execution',
    sourceWorkerRuntimeSmokeAuthorizationRef:
      `private://ai-graphics/external-beta/worker-runtime-smoke/${candidate.toolId}/authorization.json`,
    sourceWorkerRuntimeSmokeAuthorizationAccepted: true,
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
    gpuRequiredForRuntime: gpuRequired,
    privateInputManifestRef: candidate.privateInputManifestRef,
    privateOutputManifestRef: candidate.privateOutputManifestRef,
    privateTelemetryRef: candidate.privateTelemetryRef,
    privateLeaseAuditRef: candidate.privateLeaseAuditRef,
    modelWeightOrCacheManifestRef: candidate.modelWeightOrCacheManifestRef,
    workerRuntimeSmokeExecutedInPrivateNonProduction: true,
    workerLeaseCreatedCount: 1,
    workerLeaseReleasedCount: 1,
    workerDispatchCount: 1,
    toolExecutionCount: 0,
    privateArtifactWriteCount: 0,
    routeExecutionCount: 0,
    providerRuntimeCount: 0,
    gpuRuntimeStartedForAcceptedJob: gpuRequired,
    gpuRuntimeReleasedAfterAcceptedJob: gpuRequired,
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
}

function privateRefs(toolId) {
  return [
    '--external-beta-worker-runtime-smoke-evidence-ref',
    `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/evidence.json`,
    '--external-beta-worker-runtime-smoke-telemetry-ref',
    `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/telemetry.json`,
    '--external-beta-worker-runtime-smoke-cleanup-proof-ref',
    `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/cleanup-proof.json`,
    '--external-beta-worker-runtime-smoke-qa-proof-ref',
    `private://ai-graphics/external-beta/worker-runtime-smoke/${toolId}/qa-proof.json`,
  ]
}

function runProof(toolId, mutateResult, extraArgs = privateRefs(toolId)) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-worker-smoke-proof-'))
  const authorization = authorizationPacketFixture(toolId)
  const result = smokeResultFixture(authorization)
  if (mutateResult) mutateResult(result)
  const authorizationPath = writeJson(path.join(tempDir, 'authorization.json'), authorization)
  const resultPath = writeJson(path.join(tempDir, 'result.json'), result)
  return npmJson(runScriptName, [
    '--external-beta-worker-runtime-smoke-authorization-packet',
    authorizationPath,
    '--external-beta-worker-runtime-smoke-result',
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
  const docJson = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.json')
  requireEqual(docJson.decision, decision, 'doc_json_decision')
  requireEqual(docJson.status, acceptedStatus, 'doc_json_status')
  requireEqual(docJson.scope?.totalAiGraphicsTools, 21, 'doc_json_tool_count')
  requireEqual(docJson.scope?.productFacingCapabilities, 12, 'doc_json_capability_count')
  requireEqual(docJson.scope?.gpuRuntimeTargetedTools, 8, 'doc_json_gpu_count')
  requireEqual(docJson.scope?.workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence, 1, 'doc_json_proof_count')
  requireEqual(docJson.scope?.toolExecutionAcceptedWithProvidedEvidence, 0, 'doc_json_tool_execution_count')
  requireEqual(docJson.scope?.externalBetaReadyNowTools, 0, 'doc_json_external_beta_count')
  requireEqual(docJson.scope?.productionReadyNowTools, 0, 'doc_json_production_count')
  for (const tool of tools) {
    if (!docJson.tools?.includes(tool)) fail(`doc_json_missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!docJson.gpuTools?.includes(tool)) fail(`doc_json_missing_gpu_tool:${tool}`)
  }
  for (const key of [
    'externalBetaApiRouteWorkerRuntimeSmokeProofPrepared',
    'sourceWorkerRuntimeSmokeAuthorizationAccepted',
    'workerRuntimeSmokeProofAcceptedWithProvidedEvidence',
    'savedWorkerRuntimeSmokeResultAcceptedWithProvidedEvidence',
    'all21ToolsCovered',
    'all12CapabilitiesCovered',
    'all8GpuToolsTargetGpuRuntime',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'gpuRuntimeReleasedAfterAcceptedJob',
    'gpuRuntimeIdleAfterCleanup',
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

  const md = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.md')
  for (const required of [
    decision,
    'saved private non-production worker-runtime smoke result',
    'For CPU/static tools, no GPU startup.',
    'For GPU/model tools, GPU startup only for the accepted job',
    '`gpuRuntimeShouldStartNow=false`',
    'Tool execution still requires explicit private non-production execution proof',
  ]) {
    if (!md.includes(required)) fail(`proof_md_missing:${required}`)
  }

  const scorecard = read('docs/production-beta-readiness-scorecard.md')
  for (const required of [
    'AI Graphics External-Beta API Route Worker Runtime Smoke Proof',
    decision,
    'saved-result validator for one private non-production worker-runtime smoke',
    '`gpuRuntimeShouldStartNow` remains false',
  ]) {
    if (!scorecard.includes(required)) fail(`scorecard_missing:${required}`)
  }

  for (const file of [
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.json',
    'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-runtime-smoke-proof.md',
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
  if (!registry.includes("export * from './ai-graphics-external-beta-api-route-worker-runtime-smoke-proof'")) {
    fail('missing_registry_export')
  }
  const evaluator = read('server/tool-registry/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts')
  for (const required of [
    decision,
    'saved_worker_runtime_smoke_result_only',
    'gpuMayStartOnlyInAcceptedSavedGpuSmokeResult: true',
    'gpuMustBeReleasedAfterAcceptedSavedGpuSmokeResult: true',
    'cleanupMustLeaveGpuIdle: true',
    'workerRuntimeSmokeExecutedByValidator: false',
    'gpuRuntimePerformedByValidator: false',
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
    'missing_external_beta_api_route_worker_runtime_smoke_authorization',
    'missing_cli_status',
  )
  requireFalse(missing.input?.liveWorkerRuntimeSmokeExecutedByThisCommand, 'missing_cli_no_smoke')
  requireFalse(missing.input?.workerLeaseCreatedByThisCommand, 'missing_cli_no_lease')
  requireFalse(missing.input?.workerDispatchPerformedByThisCommand, 'missing_cli_no_dispatch')
  requireFalse(missing.input?.gpuRuntimePerformedByThisCommand, 'missing_cli_no_gpu')

  const cpu = runProof('d3')
  requireEqual(cpu.status, acceptedStatus, 'cpu_status')
  requireTruthy(cpu.proofAcceptedWithProvidedEvidence, 'cpu_proof_accepted')
  requireEqual(cpu.workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence, 1, 'cpu_proof_count')
  requireEqual(cpu.workerLeaseLifecycleAcceptedWithProvidedEvidence, 1, 'cpu_lease_count')
  requireEqual(cpu.workerDispatchAcceptedWithProvidedEvidence, 1, 'cpu_dispatch_count')
  requireEqual(cpu.toolExecutionAcceptedWithProvidedEvidence, 0, 'cpu_tool_execution_count')
  requireEqual(cpu.gpuRuntimeStartedWithProvidedEvidence, 0, 'cpu_gpu_started_count')
  requireEqual(cpu.gpuRuntimeReleasedWithProvidedEvidence, 0, 'cpu_gpu_released_count')
  requireFalse(cpu.booleans?.gpuRuntimeStartedForAcceptedJob, 'cpu_gpu_started_bool')
  requireFalse(cpu.booleans?.gpuRuntimeReleasedAfterAcceptedJob, 'cpu_gpu_released_bool')
  verifyFalseGates(cpu, 'cpu')

  const gpu = runProof('sam2')
  requireEqual(gpu.status, acceptedStatus, 'gpu_status')
  requireTruthy(gpu.proofAcceptedWithProvidedEvidence, 'gpu_proof_accepted')
  requireEqual(gpu.workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence, 1, 'gpu_proof_count')
  requireEqual(gpu.gpuRuntimeStartedWithProvidedEvidence, 1, 'gpu_started_count')
  requireEqual(gpu.gpuRuntimeReleasedWithProvidedEvidence, 1, 'gpu_released_count')
  requireTruthy(gpu.booleans?.gpuRuntimeStartedForAcceptedJob, 'gpu_started_bool')
  requireTruthy(gpu.booleans?.gpuRuntimeReleasedAfterAcceptedJob, 'gpu_released_bool')
  requireTruthy(gpu.booleans?.gpuRuntimeIdleAfterCleanup, 'gpu_idle_after_cleanup')
  verifyFalseGates(gpu, 'gpu')

  const badToolExecution = runProof('d3', (result) => {
    result.toolExecutionCount = 1
  })
  requireEqual(
    badToolExecution.status,
    'external_beta_api_route_worker_runtime_smoke_result_rejected',
    'bad_tool_execution_status',
  )
  if (!badToolExecution.rejectionReasons?.some((reason) => reason.includes('must not execute tools'))) {
    fail('bad_tool_execution_missing_rejection_reason')
  }

  const badPublicEvidence = runProof('d3', undefined, [
    '--external-beta-worker-runtime-smoke-evidence-ref',
    'https://example.invalid/public/evidence.json',
    '--external-beta-worker-runtime-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/worker-runtime-smoke/d3/telemetry.json',
    '--external-beta-worker-runtime-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/worker-runtime-smoke/d3/cleanup-proof.json',
    '--external-beta-worker-runtime-smoke-qa-proof-ref',
    'private://ai-graphics/external-beta/worker-runtime-smoke/d3/qa-proof.json',
  ])
  requireEqual(
    badPublicEvidence.status,
    'external_beta_api_route_worker_runtime_smoke_result_rejected',
    'bad_public_evidence_status',
  )
  if (!badPublicEvidence.rejectionReasons?.some((reason) => reason.includes('evidence ref'))) {
    fail('bad_public_evidence_missing_rejection_reason')
  }
}

function verifyRequiredFiles() {
  requiredFiles.forEach(read)
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
    status: 'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_diagnostics_failed',
    failures,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: 'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_diagnostics_passed',
  checkedFiles: requiredFiles.length,
  totalAiGraphicsTools: tools.length,
  gpuRuntimeTargetedTools: gpuTools.length,
  cpuStaticFixtureAccepted: true,
  gpuRuntimeFixtureAcceptedWithOnDemandRelease: true,
  workerRuntimeSmokeExecutedByValidator: false,
  agentCanExecuteToolsNow: false,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
