import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-cpu-static-runtime-admission'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs'

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

const cpuStaticTools = [
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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
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
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function cohortAdmissionFixture() {
  return {
    decision: 'external_beta_cpu_static_cohort_ready_with_gpu_blocks',
    sourceDecision: 'ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks',
    sourcePerToolRuntimeProofAccepted: true,
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    cpuStaticCohortCandidateToolsWithProvidedEvidence: 13,
    gpuBlockedToolsPendingNativeGpuProof: 8,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: 21,
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 21,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records: allTools.map((toolId) => {
      const isGpuTool = gpuTools.includes(toolId)
      return {
        toolId,
        cohortStatus: isGpuTool
          ? 'blocked_pending_native_gpu_runtime_proof'
          : 'external_beta_cpu_static_candidate_with_provided_evidence',
        cohortCandidateWithProvidedEvidence: !isGpuTool,
        gpuRuntimeTargeted: isGpuTool,
        gpuRuntimeOnDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        externalBetaCallableNow: false,
        gpuRuntimeShouldStartNow: false,
      }
    }),
    booleans: {
      all13CpuStaticCandidatesReadyWithProvidedEvidence: true,
      all8GpuToolsRemainBlockedPendingNativeGpuProof: true,
      sourceRuntimeQueueServiceProofBridgeAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanExecuteToolsNow: false,
    },
  }
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.md')
const cohortDocs = json('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-cohort-admission.json')
const source = read('server/tool-registry/ai-graphics-external-beta-cpu-static-runtime-admission.ts')
const cli = read('server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-cpu-static-runtime-admission'")) {
  fail('missing_tool_registry_export')
}
if (cohortDocs.decision !== 'ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks') {
  fail(`unexpected_cohort_docs_decision:${cohortDocs.decision}`)
}
if (docs.decision !== 'ai_graphics_external_beta_cpu_static_runtime_admission_prepared_with_gpu_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceEvidence?.cpuStaticCohortAdmission !== 'docs/tool-intelligence/ai-graphics/external-beta-cpu-static-cohort-admission.json') {
  fail('docs_missing_cpu_static_cohort_source')
}

for (const tool of allTools) if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
for (const tool of cpuStaticTools) {
  if (!docs.cpuStaticCohortCandidateTools?.includes(tool)) fail(`docs_missing_cpu_static_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeBlockedTools?.includes(tool)) fail(`docs_missing_gpu_blocked_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}
for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  cpuStaticCohortCandidateTools: 13,
  gpuBlockedToolsPendingNativeGpuProof: 8,
  readyForWorkerEnqueueExamplesWithProvidedEvidence: 1,
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobExamples: 0,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const key of [
  'externalBetaCpuStaticRuntimeAdmissionPrepared',
  'sourceCpuStaticCohortAdmissionAccepted',
  'sourceRuntimeQueueServiceProofBridgeAccepted',
  'sourceServiceRoleQueueSmokeAuthorizationAccepted',
  'sourceOnDemandRuntimeAdmissionAccepted',
  'selectedToolInCpuStaticCohort',
  'cpuStaticRuntimeAdmissionReadyWithProvidedEvidence',
  'externalBetaWorkerEnqueueAllowedWithProvidedEvidence',
  'all13CpuStaticCandidatesRemainFirstCohort',
  'all8GpuToolsRemainBlockedPendingNativeGpuProof',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
  'selectedToolBlockedPendingNativeGpuProof',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

for (const phrase of [
  '--external-beta-cpu-static-cohort-admission-packet',
  'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue',
  'sourceServiceRoleQueueSmokeAuthorizationAccepted',
  'requested_tool_not_in_cpu_static_cohort',
  'selected tool is blocked pending native GPU runtime proof',
  'gpuRuntimeStartAllowedForAcceptedExternalBetaJob: false',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta CPU/Static Runtime Admission')) {
  fail('scorecard_missing_cpu_static_runtime_admission')
}

const missing = parseJsonOutput(runNpm(runScriptName, [
  '--capability-id',
  'chart_overlay',
  '--requested-tool-id',
  'd3',
  '--execution-requested',
]), 'missing')
if (missing.decision !== 'missing_external_beta_cpu_static_cohort_admission') {
  fail(`missing_decision:${missing.decision}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-cpu-static-runtime-admission-'))
try {
  const cohortPath = writeJson(
    path.join(tmpRoot, 'external-beta-cpu-static-cohort-admission.json'),
    cohortAdmissionFixture(),
  )
  const commonArgs = [
    '--external-beta-cpu-static-cohort-admission-packet',
    cohortPath,
    '--execution-requested',
    '--approved-plan-snapshot-id',
    'approved_snapshot_external_beta_cpu_static_fixture',
    '--credit-reservation-id',
    'credit_reservation_external_beta_cpu_static_fixture',
    '--artifact-boundary-approval-ref',
    'artifact_boundary_approval_external_beta_cpu_static_fixture',
    '--tool-route-approval-ref',
    'tool_route_approval_external_beta_cpu_static_fixture',
    '--worker-approval-ref',
    'worker_approval_external_beta_cpu_static_fixture',
    '--runtime-enqueue-approval-ref',
    'runtime_enqueue_approval_external_beta_cpu_static_fixture',
    '--owner-runtime-approval-ref',
    'owner_runtime_approval_external_beta_cpu_static_fixture',
    '--private-artifact-manifest-ref',
    'private://ai-graphics/external-beta/cpu-static/artifact-manifest.json',
    '--external-beta-cpu-static-feature-flag-enabled',
    '--external-beta-cpu-static-feature-flag-ref',
    'external-beta-runtime://cpu-static/feature-flag',
    '--external-beta-cpu-static-runtime-admission-ref',
    'external-beta-runtime://cpu-static/runtime-admission',
    '--external-beta-cpu-static-tool-allowlist-ref',
    'external-beta-runtime://cpu-static/tool-allowlist',
    '--external-beta-cpu-static-traffic-scope-ref',
    'external-beta-runtime://cpu-static/traffic-scope',
    '--external-beta-cpu-static-telemetry-ref',
    'external-beta-runtime://cpu-static/telemetry',
    '--external-beta-cpu-static-support-ref',
    'external-beta-runtime://cpu-static/support',
    '--external-beta-cpu-static-cost-guardrail-ref',
    'external-beta-runtime://cpu-static/cost-guardrail',
    '--external-beta-cpu-static-worker-pool-ref',
    'external-beta-runtime://cpu-static/worker-pool',
  ]
  const d3 = parseJsonOutput(runNpm(runScriptName, [
    '--capability-id',
    'chart_overlay',
    '--requested-tool-id',
    'd3',
    '--node-runtime-proof-ref',
    'private://ai-graphics/node-static-proof/d3.json',
    ...commonArgs,
  ]), 'd3')
  if (d3.decision !== 'external_beta_cpu_static_runtime_admission_ready_for_worker_enqueue') {
    fail(`d3_decision:${d3.decision}`)
  }
  if (d3.sourceRuntimeQueueServiceProofBridgeAccepted !== true) {
    fail('d3_source_runtime_queue_service_proof_bridge_not_true')
  }
  if (d3.sourceServiceRoleQueueSmokeAuthorizationAccepted !== true) {
    fail('d3_source_service_role_queue_smoke_authorization_not_true')
  }
  if (d3.cpuStaticRuntimeAdmissionReadyWithProvidedEvidence !== true) fail('d3_not_ready')
  if (d3.externalBetaWorkerEnqueueAllowedWithProvidedEvidence !== true) {
    fail('d3_enqueue_not_allowed_with_evidence')
  }
  if (d3.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== false) fail('d3_gpu_start_allowed')
  for (const key of falseGateKeys) {
    if (d3.booleans?.[key] !== false) fail(`d3_false_gate_not_false:${key}`)
  }

  const sam2 = parseJsonOutput(runNpm(runScriptName, [
    '--capability-id',
    'background_removal',
    '--requested-tool-id',
    'sam2',
    '--native-gpu-runtime-proof-ref',
    'private://ai-graphics/gpu-proof/sam2.json',
    '--model-weight-manifest-ref',
    'private://ai-graphics/model-manifests/sam2.json',
    ...commonArgs,
  ]), 'sam2')
  if (sam2.decision !== 'requested_tool_not_in_cpu_static_cohort') {
    fail(`sam2_decision:${sam2.decision}`)
  }
  if (sam2.selectedToolBlockedPendingNativeGpuProof !== true) {
    fail('sam2_not_marked_gpu_blocked')
  }
  if (sam2.cpuStaticRuntimeAdmissionReadyWithProvidedEvidence !== false) {
    fail('sam2_cpu_static_ready_should_be_false')
  }

  const strippedAuthPath = writeJson(
    path.join(tmpRoot, 'stripped-authorization-cpu-static-cohort.json'),
    {
      ...cohortAdmissionFixture(),
      sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
      sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: 0,
      booleans: {
        ...cohortAdmissionFixture().booleans,
        sourceServiceRoleQueueSmokeAuthorizationAccepted: false,
      },
    },
  )
  const strippedAuth = parseJsonOutput(runNpm(runScriptName, [
    '--capability-id',
    'chart_overlay',
    '--requested-tool-id',
    'd3',
    '--node-runtime-proof-ref',
    'private://ai-graphics/node-static-proof/d3.json',
    '--external-beta-cpu-static-cohort-admission-packet',
    strippedAuthPath,
    '--execution-requested',
    '--approved-plan-snapshot-id',
    'approved_snapshot_external_beta_cpu_static_fixture',
    '--credit-reservation-id',
    'credit_reservation_external_beta_cpu_static_fixture',
    '--artifact-boundary-approval-ref',
    'artifact_boundary_approval_external_beta_cpu_static_fixture',
    '--tool-route-approval-ref',
    'tool_route_approval_external_beta_cpu_static_fixture',
    '--worker-approval-ref',
    'worker_approval_external_beta_cpu_static_fixture',
    '--runtime-enqueue-approval-ref',
    'runtime_enqueue_approval_external_beta_cpu_static_fixture',
    '--owner-runtime-approval-ref',
    'owner_runtime_approval_external_beta_cpu_static_fixture',
    '--private-artifact-manifest-ref',
    'private://ai-graphics/external-beta/cpu-static/artifact-manifest.json',
    '--external-beta-cpu-static-feature-flag-enabled',
    '--external-beta-cpu-static-feature-flag-ref',
    'external-beta-runtime://cpu-static/feature-flag',
    '--external-beta-cpu-static-runtime-admission-ref',
    'external-beta-runtime://cpu-static/runtime-admission',
    '--external-beta-cpu-static-tool-allowlist-ref',
    'external-beta-runtime://cpu-static/tool-allowlist',
    '--external-beta-cpu-static-traffic-scope-ref',
    'external-beta-runtime://cpu-static/traffic-scope',
    '--external-beta-cpu-static-telemetry-ref',
    'external-beta-runtime://cpu-static/telemetry',
    '--external-beta-cpu-static-support-ref',
    'external-beta-runtime://cpu-static/support',
    '--external-beta-cpu-static-cost-guardrail-ref',
    'external-beta-runtime://cpu-static/cost-guardrail',
    '--external-beta-cpu-static-worker-pool-ref',
    'external-beta-runtime://cpu-static/worker-pool',
  ]), 'stripped-auth')
  if (strippedAuth.decision !== 'missing_external_beta_cpu_static_cohort_admission') {
    fail(`stripped_auth_decision:${strippedAuth.decision}`)
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const forbiddenDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /providerRuntimeApprovedNow["'`\s:]*true/i,
  /browserWebglCanvasRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimeShouldStartNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
]) {
  if (pattern.test(forbiddenDocs)) fail(`forbidden_docs_claim:${pattern}`)
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff.trim()) fail('package_lock_changed')

const packageDiff = git(['diff', '--unified=0', '--', 'package.json'])
const allowedPackageAdditions = new Set([
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof": "tsx server/cli/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-controlled-worker-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-controlled-worker-runtime-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-callable-result-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-callable-result-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-callable-result-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate": "tsx server/cli/ai-graphics-external-beta-per-tool-traffic-enablement-gate.ts",',
  '+    "ai-graphics:external-beta-per-tool-traffic-enablement-gate:diagnostics": "node scripts/validation/ai-graphics-external-beta-per-tool-traffic-enablement-gate-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization": "tsx server/cli/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization.ts",',
  '+    "ai-graphics:external-beta-operator-traffic-switch-runtime-soak-authorization:diagnostics": "node scripts/validation/ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result": "tsx server/cli/ai-graphics-external-beta-controlled-traffic-runtime-soak-result.ts",',
  '+    "ai-graphics:external-beta-controlled-traffic-runtime-soak-result:diagnostics": "node scripts/validation/ai-graphics-external-beta-controlled-traffic-runtime-soak-result-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activation-go-no-go": "tsx server/cli/ai-graphics-external-beta-activation-go-no-go.ts",',
  '+    "ai-graphics:external-beta-activation-go-no-go:diagnostics": "node scripts/validation/ai-graphics-external-beta-activation-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup": "tsx server/cli/ai-graphics-external-beta-all-21-activation-rollup.ts",',
  '+    "ai-graphics:external-beta-all-21-activation-rollup:diagnostics": "node scripts/validation/ai-graphics-external-beta-all-21-activation-rollup-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-activated-launch-readiness": "tsx server/cli/ai-graphics-external-beta-activated-launch-readiness.ts",',
  '+    "ai-graphics:external-beta-activated-launch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-activated-launch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission": "tsx server/cli/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-artifact-tool-route-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof": "tsx server/cli/ai-graphics-external-beta-api-route-queue-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-api-route-queue-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-api-route-queue-smoke-proof-diagnostics.mjs",',
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
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs",',
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (/^[+-]\s*"(dependencies|devDependencies|optionalDependencies|peerDependencies)"/.test(line)) {
    fail(`dependency_section_changed:${line}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const changedFiles = git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
for (const filePath of changedFiles) {
  if (/\.local-artifacts\//.test(filePath)) fail(`changed_local_artifact:${filePath}`)
  if (/(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(filePath)) {
    fail(`changed_generated_output_path:${filePath}`)
  }
}

if (failures.length > 0) {
  console.error(`AI graphics external-beta CPU/static runtime admission diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  cpuStaticCohortCandidateTools: 13,
  gpuBlockedToolsPendingNativeGpuProof: 8,
  d3ReadyForWorkerEnqueueWithProvidedEvidence: true,
  sam2BlockedPendingNativeGpuProof: true,
  externalBetaCallableNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
