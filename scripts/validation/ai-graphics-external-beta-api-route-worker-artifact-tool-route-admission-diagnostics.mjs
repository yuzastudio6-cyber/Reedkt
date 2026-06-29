import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const decision =
  'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission_prepared_with_runtime_blocks'
const acceptedStatus =
  'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs'

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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'externalBetaCallableNow',
  'artifactToolRouteAdmissionApprovedNow',
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
    }
    : {
      runtimeTarget: 'node_cpu_static',
      workerType: 'render_worker',
      gpuRequiredForRuntime: false,
    }
}

function routeQueueSmokeProofFixture(toolId, capabilityId, overrides = {}) {
  const runtime = runtimeForTool(toolId)
  const sourceAuthorizationCandidate = {
    toolId,
    capabilityId,
    routePath: '/api/ai-graphics/external-beta/tool-call',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
    idempotencyKey: `external-beta-idempotency-${toolId}`,
    runtimeTarget: runtime.runtimeTarget,
    workerType: runtime.workerType,
    gpuRequiredForRuntime: runtime.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: runtime.gpuRequiredForRuntime,
  }
  return {
    decision: 'ai_graphics_external_beta_api_route_queue_smoke_proof_prepared_with_runtime_blocks',
    status: 'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks',
    requestedToolId: toolId,
    capabilityId,
    proofAcceptedWithProvidedEvidence: true,
    apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence: 1,
    liveQueueRowsAcceptedWithProvidedEvidence: 1,
    liveQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimsAcceptedWithProvidedEvidence: 0,
    liveWorkerDispatchesAcceptedWithProvidedEvidence: 0,
    liveToolExecutionsAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceAuthorizationCandidate,
    savedApiRouteQueueSmokeResult: {
      toolId,
      capabilityId,
    },
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      apiRouteExecutionPerformed: false,
      liveQueueWritePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function workerDispatchSmokeProofFixture(overrides = {}) {
  return {
    sourceDecision: 'ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks',
    decision: 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    acceptedTools: tools,
    acceptedGpuTools: gpuTools,
    counts: {
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: 21,
      sourceSmokeJobsCompletedWithProvidedEvidence: 21,
      sourceCapabilityScenariosCompletedWithProvidedEvidence: 12,
      sourceInMemoryLeaseRecordsCreated: 21,
      sourceInMemoryLeaseRecordsReleased: 21,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
      sourceLiveWorkerLeasesCreatedNow: 0,
      sourceLiveWorkerDispatchesNow: 0,
      sourceLiveToolExecutionsNow: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    evidence: {
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: true,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: true,
      serviceRoleQueueSmokeAuthorizationRef:
        'external-beta-evidence://service-role-queue-smoke/authorization',
    },
    booleans: {
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      allInMemoryLeasesCreatedWithProvidedEvidence: true,
      allInMemoryLeasesReleasedWithProvidedEvidence: true,
      allToolRunResultsEmpty: true,
      allArtifactRecordsEmpty: true,
      allQualityGateResultsEmpty: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

function handoffControls() {
  return [
    '--external-beta-route-worker-dispatch-handoff-policy-ref',
    'external-beta-route-worker-dispatch://policy/handoff',
    '--external-beta-worker-lease-policy-ref',
    'external-beta-route-worker-dispatch://policy/lease',
    '--external-beta-worker-dispatch-policy-ref',
    'external-beta-route-worker-dispatch://policy/dispatch',
    '--external-beta-worker-idempotency-policy-ref',
    'external-beta-route-worker-dispatch://policy/idempotency',
    '--external-beta-gpu-on-demand-policy-ref',
    'external-beta-route-worker-dispatch://policy/gpu-on-demand',
    '--external-beta-private-artifact-policy-ref',
    'external-beta-route-worker-dispatch://policy/private-artifact',
    '--external-beta-telemetry-ref',
    'external-beta-route-worker-dispatch://telemetry/handoff',
    '--external-beta-rollback-plan-ref',
    'external-beta-route-worker-dispatch://rollback/handoff',
  ]
}

function privateArtifactControls() {
  return [
    '--external-beta-private-artifact-policy-ref',
    'external-beta-evidence://private-artifacts/policy',
    '--external-beta-artifact-manifest-schema-ref',
    'external-beta-evidence://private-artifacts/schema',
    '--external-beta-storage-namespace-ref',
    'private://ai-graphics/external-beta/artifacts',
    '--external-beta-access-boundary-ref',
    'external-beta-evidence://private-artifacts/access-boundary',
    '--external-beta-encryption-policy-ref',
    'external-beta-evidence://private-artifacts/encryption',
    '--external-beta-retention-policy-ref',
    'external-beta-evidence://private-artifacts/retention',
    '--external-beta-artifact-telemetry-ref',
    'external-beta-evidence://private-artifacts/telemetry',
  ]
}

function toolRouteControls() {
  return [
    '--external-beta-tool-route-policy-ref',
    'external-beta-evidence://tool-route/policy',
    '--external-beta-tool-route-schema-ref',
    'external-beta-evidence://tool-route/schema',
    '--external-beta-tool-route-admission-ref',
    'external-beta-evidence://tool-route/admission',
    '--external-beta-tool-route-authz-ref',
    'external-beta-evidence://tool-route/authz',
    '--external-beta-tool-route-rate-limit-ref',
    'external-beta-evidence://tool-route/rate-limit',
    '--external-beta-tool-route-audit-ref',
    'external-beta-evidence://tool-route/audit',
    '--external-beta-tool-route-rollback-ref',
    'external-beta-evidence://tool-route/rollback',
  ]
}

function admissionControls() {
  return [
    '--external-beta-artifact-tool-route-admission-policy-ref',
    'external-beta-admission://artifact-tool-route/policy',
    '--external-beta-private-artifact-write-policy-ref',
    'external-beta-admission://private-artifact/write-policy',
    '--external-beta-private-artifact-retention-policy-ref',
    'external-beta-admission://private-artifact/retention-policy',
    '--external-beta-tool-route-admission-policy-ref',
    'external-beta-admission://tool-route/admission-policy',
    '--external-beta-tool-route-execution-block-policy-ref',
    'external-beta-admission://tool-route/execution-block-policy',
    '--external-beta-approved-snapshot-binding-ref',
    'external-beta-admission://approved-snapshot/binding',
    '--external-beta-credit-reservation-binding-ref',
    'external-beta-admission://credit-reservation/binding',
    '--external-beta-gpu-on-demand-policy-ref',
    'external-beta-admission://gpu/on-demand-policy',
    '--external-beta-telemetry-ref',
    'external-beta-admission://telemetry/admission',
    '--external-beta-rollback-plan-ref',
    'external-beta-admission://rollback/plan',
  ]
}

function admissionArgs(handoffPath, manifestPath, toolRoutePath, includeControls = true) {
  return [
    ...(handoffPath ? ['--external-beta-api-route-worker-dispatch-handoff-proof-packet', handoffPath] : []),
    ...(manifestPath ? ['--external-beta-private-artifact-manifest-packet', manifestPath] : []),
    ...(toolRoutePath ? ['--external-beta-tool-route-runtime-proof-packet', toolRoutePath] : []),
    ...(includeControls ? admissionControls() : []),
  ]
}

function assertFalseBooleans(label, booleans) {
  for (const key of falseGateKeys) {
    if (booleans?.[key] !== false) fail(`${label}_${key}_not_false`)
  }
}

for (const file of [
  'server/tool-registry/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts',
  'server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts',
  'scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-artifact-tool-route-admission.json',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-artifact-tool-route-admission.md',
  'docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-dispatch-handoff-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-private-artifact-manifest.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json',
  'docs/production-beta-readiness-scorecard.md',
]) {
  read(file)
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-artifact-tool-route-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-api-route-worker-artifact-tool-route-admission.md')
const source = read('server/tool-registry/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts')
const cli = read('server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== decision) fail(`docs_decision_mismatch:${docs.decision}`)
if (docs.status !== acceptedStatus) fail(`docs_status_mismatch:${docs.status}`)

for (const phrase of [
  'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked',
  '--external-beta-api-route-worker-dispatch-handoff-proof-packet',
  '--external-beta-private-artifact-manifest-packet',
  '--external-beta-tool-route-runtime-proof-packet',
  'validatesSavedProofPacketsOnly',
  'noPrivateArtifactWriteByAdmissionProof',
  'noToolRouteExecutionByAdmissionProof',
  'noGpuRuntimeStartByAdmissionProof',
  'privateArtifactManifestCoversRequestedTool',
  'toolRouteRuntimeProofCoversRequestedTool',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}

for (const tool of tools) {
  const combined = `${JSON.stringify(docs)}\n${source}`
  if (!combined.includes(tool)) fail(`missing_tool:${tool}`)
}

for (const block of [
  'private artifact write',
  'Tool Route execution',
  'live worker lease creation',
  'worker dispatch',
  'tool execution',
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
if (!scorecard.includes('AI Graphics External-Beta API Route Worker Artifact Tool Route Admission')) {
  fail('scorecard_missing_section')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-artifact-route-admission-'))
try {
  const d3RoutePath = path.join(tmpRoot, 'd3-route-proof.json')
  const sam2RoutePath = path.join(tmpRoot, 'sam2-route-proof.json')
  const workerPath = path.join(tmpRoot, 'worker-proof.json')
  const d3HandoffPath = path.join(tmpRoot, 'd3-handoff-proof.json')
  const sam2HandoffPath = path.join(tmpRoot, 'sam2-handoff-proof.json')
  const manifestPath = path.join(tmpRoot, 'private-artifact-manifest.json')
  const toolRoutePath = path.join(tmpRoot, 'tool-route-runtime-proof.json')
  const rejectedHandoffPath = path.join(tmpRoot, 'rejected-handoff-proof.json')
  const rejectedManifestPath = path.join(tmpRoot, 'rejected-private-artifact-manifest.json')
  const rejectedToolRoutePath = path.join(tmpRoot, 'rejected-tool-route-runtime-proof.json')

  writeJson(d3RoutePath, routeQueueSmokeProofFixture('d3', 'chart_overlay'))
  writeJson(sam2RoutePath, routeQueueSmokeProofFixture('sam2', 'background_removal'))
  writeJson(workerPath, workerDispatchSmokeProofFixture())

  writeJson(d3HandoffPath, npmJson(
    'ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof',
    [
      '--external-beta-api-route-queue-smoke-proof-packet',
      d3RoutePath,
      '--external-beta-worker-dispatch-smoke-proof-packet',
      workerPath,
      ...handoffControls(),
    ],
  ))
  writeJson(sam2HandoffPath, npmJson(
    'ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof',
    [
      '--external-beta-api-route-queue-smoke-proof-packet',
      sam2RoutePath,
      '--external-beta-worker-dispatch-smoke-proof-packet',
      workerPath,
      ...handoffControls(),
    ],
  ))
  writeJson(manifestPath, npmJson(
    'ai-graphics:external-beta-private-artifact-manifest',
    [
      '--external-beta-worker-dispatch-smoke-proof-packet',
      workerPath,
      ...privateArtifactControls(),
    ],
  ))
  writeJson(toolRoutePath, npmJson(
    'ai-graphics:external-beta-tool-route-runtime-proof',
    [
      '--external-beta-private-artifact-manifest-packet',
      manifestPath,
      ...toolRouteControls(),
    ],
  ))

  const rejectedHandoff = JSON.parse(fs.readFileSync(d3HandoffPath, 'utf8'))
  rejectedHandoff.status = 'external_beta_api_route_worker_dispatch_handoff_proof_rejected'
  rejectedHandoff.apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence = false
  writeJson(rejectedHandoffPath, rejectedHandoff)

  const rejectedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  rejectedManifest.decision = 'external_beta_private_artifact_manifest_rejected'
  rejectedManifest.privateArtifactManifestReadyWithProvidedEvidence = false
  writeJson(rejectedManifestPath, rejectedManifest)

  const rejectedToolRoute = JSON.parse(fs.readFileSync(toolRoutePath, 'utf8'))
  rejectedToolRoute.decision = 'external_beta_tool_route_runtime_proof_rejected'
  rejectedToolRoute.toolRouteRuntimeProofReadyWithProvidedEvidence = false
  writeJson(rejectedToolRoutePath, rejectedToolRoute)

  const missingHandoff = npmJson(runScriptName, [])
  if (missingHandoff.status !== 'missing_external_beta_api_route_worker_dispatch_handoff_proof') {
    fail('missing_handoff_wrong_status')
  }

  const rejectedHandoffResult = npmJson(
    runScriptName,
    admissionArgs(rejectedHandoffPath, manifestPath, toolRoutePath),
  )
  if (rejectedHandoffResult.status !== 'external_beta_api_route_worker_dispatch_handoff_proof_rejected') {
    fail('rejected_handoff_wrong_status')
  }

  const missingManifest = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, null, toolRoutePath),
  )
  if (missingManifest.status !== 'missing_external_beta_private_artifact_manifest') {
    fail('missing_manifest_wrong_status')
  }

  const rejectedManifestResult = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, rejectedManifestPath, toolRoutePath),
  )
  if (rejectedManifestResult.status !== 'external_beta_private_artifact_manifest_rejected') {
    fail('rejected_manifest_wrong_status')
  }

  const missingToolRoute = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, manifestPath, null),
  )
  if (missingToolRoute.status !== 'missing_external_beta_tool_route_runtime_proof') {
    fail('missing_tool_route_wrong_status')
  }

  const rejectedToolRouteResult = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, manifestPath, rejectedToolRoutePath),
  )
  if (rejectedToolRouteResult.status !== 'external_beta_tool_route_runtime_proof_rejected') {
    fail('rejected_tool_route_wrong_status')
  }

  const missingControls = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, manifestPath, toolRoutePath, false),
  )
  if (missingControls.status !== 'missing_external_beta_artifact_tool_route_admission_controls') {
    fail('missing_controls_wrong_status')
  }

  const acceptedD3 = npmJson(
    runScriptName,
    admissionArgs(d3HandoffPath, manifestPath, toolRoutePath),
  )
  if (acceptedD3.decision !== decision) fail('accepted_d3_decision_mismatch')
  if (acceptedD3.status !== acceptedStatus) fail('accepted_d3_status_mismatch')
  if (acceptedD3.requestedToolId !== 'd3') fail('accepted_d3_tool_mismatch')
  if (acceptedD3.artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence !== 1) {
    fail('accepted_d3_admission_count_not_1')
  }
  if (acceptedD3.sourcePrivateArtifactRecordsReadyWithProvidedEvidence !== 21) {
    fail('accepted_d3_private_records_not_21')
  }
  if (acceptedD3.sourceToolRouteRecordsReadyWithProvidedEvidence !== 21) {
    fail('accepted_d3_tool_route_records_not_21')
  }
  if (acceptedD3.admissionCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) {
    fail('accepted_d3_gpu_start_allowed_should_be_false')
  }
  if (!String(acceptedD3.admissionCandidate?.privateInputManifestRef).startsWith('private://')) {
    fail('accepted_d3_private_input_ref_missing')
  }
  assertFalseBooleans('accepted_d3', acceptedD3.booleans)

  const acceptedSam2 = npmJson(
    runScriptName,
    admissionArgs(sam2HandoffPath, manifestPath, toolRoutePath),
  )
  if (acceptedSam2.status !== acceptedStatus) fail('accepted_sam2_status_mismatch')
  if (acceptedSam2.requestedToolId !== 'sam2') fail('accepted_sam2_tool_mismatch')
  if (acceptedSam2.admissionCandidate?.workerType !== 'gpu_ai_worker') {
    fail('accepted_sam2_worker_type_mismatch')
  }
  if (acceptedSam2.admissionCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
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
  /artifactToolRouteAdmissionApprovedNow["'`\s:]*true/i,
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
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
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
  console.error(`AI graphics external-beta API route worker artifact Tool Route admission diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: acceptedStatus,
  toolsCovered: tools.length,
  capabilitiesCovered: 12,
  gpuRuntimeTargetedTools: gpuTools.length,
  artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence: 1,
  sourcePrivateArtifactRecordsReadyWithProvidedEvidence: 21,
  sourceToolRouteRecordsReadyWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  agentCanExecuteToolsNow: false,
}, null, 2))
