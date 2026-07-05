import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed'
const status =
  'canonical_tool_call_route_gpu_model_runtime_admission_fail_closed_for_eight_tools'
const runScriptName =
  'ai-graphics:external-beta-tool-call-route-gpu-model-runtime-admission-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-runtime-admission-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-tool-call-route-gpu-model-runtime-admission-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-route-gpu-model-runtime-admission-smoke-diagnostics.mjs'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const nativeGpuProofOnlyTools = [
  'torch_torchvision',
  'transformers',
  'kornia',
]

const requiredFiles = [
  'server/config/env.ts',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-runtime-admission-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-tool-call-route-gpu-model-runtime-admission-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.md',
  'docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const forbiddenDocPatterns = [
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /providerRuntimePerformed["`:\s=]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /modelWeightsDownloaded["`:\s=]+true/i,
  /modelWeightsLoaded["`:\s=]+true/i,
  /modelInferencePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gcsUploadPerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  if (!fs.existsSync(absolute(file))) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(absolute(file), 'utf8')
}

function json(file) {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return {}
  }
}

function exec(command) {
  return childProcess.execSync(command, {
    cwd: root,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (report.routePath !== '/api/ai-graphics/external-beta/tool-call') {
    fail(`${label}_route_path_mismatch`)
  }
  if (
    report.routeFlag !==
    'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_ENABLED'
  ) {
    fail(`${label}_route_flag_mismatch`)
  }
  if (report.routeMountedButAdmissionDisabledStatus !== 409) {
    fail(`${label}_disabled_status_not_409`)
  }

  const rows = report.blockedResults
  if (!Array.isArray(rows) || rows.length !== 8) {
    fail(`${label}_blocked_rows_count_mismatch`)
    return
  }
  for (const toolId of gpuModelTools) {
    const row = rows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_gpu_model_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_not_blocked`)
    if (
      row.routeStatus !==
      'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence'
    ) {
      fail(`${label}_${toolId}_route_status_mismatch`)
    }
    if (row.admissionDecision !== 'runtime_job_blocked') {
      fail(`${label}_${toolId}_admission_decision_mismatch`)
    }
    if (!/native_linux_amd64_nvidia_l4/.test(row.runtimeTarget ?? '')) {
      fail(`${label}_${toolId}_runtime_target_not_gpu`)
    }
    if (row.workerType !== 'gpu_ai_worker') fail(`${label}_${toolId}_worker_type_mismatch`)
    if (
      !Array.isArray(row.missingRuntimeProofGates) ||
      !row.missingRuntimeProofGates.some((gate) => /native NVIDIA GPU runtime proof/.test(gate))
    ) {
      fail(`${label}_${toolId}_missing_native_gpu_proof_gate`)
    }
    if (!row.gpuModelUnblockPlan || typeof row.gpuModelUnblockPlan !== 'object') {
      fail(`${label}_${toolId}_missing_gpu_model_unblock_plan`)
    }
    if (row.nativeGpuRuntimeProofRequired !== true) {
      fail(`${label}_${toolId}_native_gpu_runtime_proof_required_not_true`)
    }
    if (row.nativeGpuRuntimeProofAccepted !== false) {
      fail(`${label}_${toolId}_native_gpu_runtime_proof_accepted_not_false`)
    }
    if (row.externalBetaPerToolRuntimeProofRecheckRequired !== true) {
      fail(`${label}_${toolId}_per_tool_recheck_required_not_true`)
    }
    if (row.externalBetaPerToolRuntimeProofRecheckAccepted !== false) {
      fail(`${label}_${toolId}_per_tool_recheck_accepted_not_false`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`${label}_${toolId}_model_weight_manifest_not_required`)
      }
      if (row.modelWeightPrivateEvidenceRequired !== true) {
        fail(`${label}_${toolId}_private_evidence_required_not_true`)
      }
      if (row.modelWeightPrivateEvidenceAccepted !== false) {
        fail(`${label}_${toolId}_private_evidence_accepted_not_false`)
      }
      if (
        row.gpuModelExternalBetaReadinessBlocker !==
        'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof'
      ) {
        fail(`${label}_${toolId}_private_plus_gpu_blocker_mismatch`)
      }
      if (
        row.nextExternalAgentAction !==
        'provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result'
      ) {
        fail(`${label}_${toolId}_next_action_mismatch`)
      }
      if (!row.missingRuntimeProofGates.some((gate) => /model-weight manifest/.test(gate))) {
        fail(`${label}_${toolId}_missing_model_weight_manifest_gate`)
      }
    } else if (row.modelWeightManifestRequired !== false) {
      fail(`${label}_${toolId}_unexpected_model_weight_manifest_required`)
    } else {
      if (row.modelWeightPrivateEvidenceRequired !== false) {
        fail(`${label}_${toolId}_unexpected_private_evidence_required`)
      }
      if (
        row.gpuModelExternalBetaReadinessBlocker !==
        'blocked_pending_native_gpu_runtime_proof'
      ) {
        fail(`${label}_${toolId}_native_gpu_only_blocker_mismatch`)
      }
      if (row.nextExternalAgentAction !== 'provide_native_gpu_runtime_result') {
        fail(`${label}_${toolId}_next_action_mismatch`)
      }
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'modelWeightsLoaded',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_${key}_not_false`)
    }
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    controlledCanonicalRouteExecutedTools: 13,
    gpuModelRuntimeAdmissionEvaluatedTools: 8,
    gpuModelRuntimeAdmissionBlockedTools: 8,
    gpuModelUnblockPlanExposedTools: 8,
    modelWeightManifestRequiredTools: 5,
    privateEvidenceAndNativeGpuProofRequiredTools: 5,
    nativeGpuProofOnlyRequiredTools: 3,
    nativeGpuRuntimeProofRequiredTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0,
    nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools: 3,
    modelWeightAdmissionReadyWithProvidedRefsTools: 5,
    allGpuModelAdmissionReadyWithProvidedRefsTools: 8,
    proofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 3,
    proofReadyModelWeightGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 5,
    allProofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    proofReadyWorkerEnqueueStillBlockedTools: 3,
    proofReadyModelWeightWorkerEnqueueStillBlockedTools: 5,
    allProofReadyWorkerEnqueueStillBlockedTools: 8,
    proofReadyGpuRuntimeShouldStartNowTools: 0,
    proofReadyModelWeightGpuRuntimeShouldStartNowTools: 0,
    allProofReadyGpuRuntimeShouldStartNowTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    workerDispatchPerformedTools: 0,
    toolExecutionPerformedTools: 0,
    modelWeightsLoadedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (counts[key] !== value) fail(`${label}_count_${key}_mismatch:${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'canonicalToolCallRouteGpuModelRuntimeAdmissionSmokePassed',
    'canonicalToolCallRouteGpuModelRuntimeAdmissionEvaluated',
    'eightGpuModelToolsEvaluatedByCanonicalRouteNow',
    'eightGpuModelToolsRemainFailClosed',
    'allGpuModelToolsExposeActionableUnblockPlan',
    'fiveModelWeightToolsExposePrivateEvidenceAndNativeGpuBlocker',
    'threeFoundationGpuToolsExposeNativeGpuOnlyBlocker',
    'nativeGpuProofOnlyToolsAcceptPrivateProofRefsForAdmission',
    'modelWeightToolsAcceptPrivateManifestAndGpuProofRefsForAdmission',
    'allGpuModelToolsAcceptRequiredPrivateProofRefsForAdmission',
    'proofReadyGpuToolsStillFailClosedBeforeWorkerEnqueue',
    'proofReadyModelWeightToolsStillFailClosedBeforeWorkerEnqueue',
    'allProofReadyGpuModelToolsStillFailClosedBeforeWorkerEnqueue',
    'proofReadyGpuToolsDoNotStartGpuRuntime',
    'proofReadyModelWeightToolsDoNotLoadWeightsOrStartGpu',
    'allProofReadyGpuModelToolsDoNotStartGpuRuntimeOrLoadWeights',
    'noGpuModelToolReportsAcceptedEvidenceNow',
    'allGpuModelToolsReportNativeGpuProofMissing',
    'allModelWeightToolsReportManifestMissing',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'agentCanSelectForPlanning',
    'agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow',
  ]) {
    if (booleans[key] !== true) fail(`${label}_${key}_not_true`)
  }
  for (const key of [
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'workerExecutionApprovedNow',
    'workerDispatchPerformed',
    'toolExecutionApprovedNow',
    'toolExecutionPerformed',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimePerformed',
    'gpuRuntimePerformed',
    'gpuRuntimeShouldStartNow',
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'modelInferencePerformed',
    'mediaProcessingPerformed',
    'supabaseMutationPerformed',
    'gcsUploadPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'dependencyInstallPerformed',
    'packageLockMutationPerformed',
  ]) {
    if (booleans[key] !== false) fail(`${label}_${key}_not_false`)
  }

  const proofReadyRows = report.proofReadyNativeOnlyResults
  if (!Array.isArray(proofReadyRows) || proofReadyRows.length !== 3) {
    fail(`${label}_proof_ready_native_rows_count_mismatch`)
    return
  }
  for (const toolId of nativeGpuProofOnlyTools) {
    const row = proofReadyRows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_proof_ready_native_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_proof_ready_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_proof_ready_not_blocked`)
    if (row.admissionDecision !== 'runtime_job_admission_ready_for_worker_enqueue') {
      fail(`${label}_${toolId}_proof_ready_admission_decision_mismatch`)
    }
    if (row.runtimeJobAdmissionReadyWithProvidedEvidence !== true) {
      fail(`${label}_${toolId}_proof_ready_runtime_job_not_ready`)
    }
    if (
      row.gpuModelAdmissionEvidenceState !==
      'proof_refs_accepted_pending_live_worker_enqueue'
    ) {
      fail(`${label}_${toolId}_proof_ready_evidence_state_mismatch`)
    }
    if (row.nativeGpuRuntimeProofRefAccepted !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_ref_not_accepted`)
    }
    if (row.nativeGpuRuntimeProofAccepted !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_not_accepted`)
    }
    if (row.modelWeightManifestRequired !== false) {
      fail(`${label}_${toolId}_unexpected_model_weight_manifest_required`)
    }
    if (row.modelWeightManifestRefAccepted !== false) {
      fail(`${label}_${toolId}_unexpected_model_weight_manifest_ref_accepted`)
    }
    if (!Array.isArray(row.missingRuntimeProofGates) || row.missingRuntimeProofGates.length !== 0) {
      fail(`${label}_${toolId}_proof_ready_missing_runtime_proof_gates_not_empty`)
    }
    if (row.workerEnqueueStillBlockedByCurrentLane !== true) {
      fail(`${label}_${toolId}_worker_enqueue_not_blocked_by_lane`)
    }
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
      fail(`${label}_${toolId}_gpu_start_not_allowed_after_accepted_job`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'modelWeightsLoaded',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_proof_ready_${key}_not_false`)
    }
  }

  const proofReadyModelWeightRows = report.proofReadyModelWeightResults
  if (
    !Array.isArray(proofReadyModelWeightRows) ||
    proofReadyModelWeightRows.length !== 5
  ) {
    fail(`${label}_proof_ready_model_weight_rows_count_mismatch`)
    return
  }
  for (const toolId of modelWeightManifestRequiredTools) {
    const row = proofReadyModelWeightRows.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_proof_ready_model_weight_tool:${toolId}`)
      continue
    }
    if (row.statusCode !== 409) fail(`${label}_${toolId}_proof_ready_status_not_409`)
    if (row.blocked !== true) fail(`${label}_${toolId}_proof_ready_not_blocked`)
    if (row.admissionDecision !== 'runtime_job_admission_ready_for_worker_enqueue') {
      fail(`${label}_${toolId}_proof_ready_admission_decision_mismatch`)
    }
    if (row.runtimeJobAdmissionReadyWithProvidedEvidence !== true) {
      fail(`${label}_${toolId}_proof_ready_runtime_job_not_ready`)
    }
    if (
      row.gpuModelAdmissionEvidenceState !==
      'proof_refs_accepted_pending_live_worker_enqueue'
    ) {
      fail(`${label}_${toolId}_proof_ready_evidence_state_mismatch`)
    }
    if (row.nativeGpuRuntimeProofRefAccepted !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_ref_not_accepted`)
    }
    if (row.nativeGpuRuntimeProofAccepted !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_not_accepted`)
    }
    if (row.modelWeightManifestRequired !== true) {
      fail(`${label}_${toolId}_model_weight_manifest_required_not_true`)
    }
    if (row.modelWeightManifestRefAccepted !== true) {
      fail(`${label}_${toolId}_model_weight_manifest_ref_not_accepted`)
    }
    if (row.modelWeightPrivateEvidenceAccepted !== true) {
      fail(`${label}_${toolId}_private_model_evidence_not_accepted`)
    }
    if (!Array.isArray(row.missingRuntimeProofGates) || row.missingRuntimeProofGates.length !== 0) {
      fail(`${label}_${toolId}_proof_ready_missing_runtime_proof_gates_not_empty`)
    }
    if (row.workerEnqueueStillBlockedByCurrentLane !== true) {
      fail(`${label}_${toolId}_worker_enqueue_not_blocked_by_lane`)
    }
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
      fail(`${label}_${toolId}_gpu_start_not_allowed_after_accepted_job`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'modelWeightsLoaded',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[key] !== false) fail(`${label}_${toolId}_proof_ready_${key}_not_false`)
    }
  }
}

for (const file of requiredFiles) read(file)

const docs = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.md',
)
const packageJson = json('package.json')
const envSource = read('server/config/env.ts')
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const cliSource = read('server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-runtime-admission-smoke.ts')
const modelWeightIntake = json('docs/tool-intelligence/ai-graphics/model-weight-private-evidence-intake.json')
const gpuRuntimeGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const browserRuntimeRouteSmoke = json('docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

checkReport('docs', docs)
const live = JSON.parse(exec(`npm run --silent ${runScriptName}`))
checkReport('live', live)

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('run_script_mismatch')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('diagnostic_script_mismatch')
}
for (const phrase of [
  'aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled',
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_ENABLED',
]) {
  if (!envSource.includes(phrase)) fail(`env_missing:${phrase}`)
}
for (const phrase of [
  'evaluateAiGraphicsOnDemandRuntimeAdmission',
  'admitAiGraphicsExternalBetaToolCallGpuModelRuntime',
  'buildAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionBlockedDetails',
  'buildAiGraphicsGpuModelUnblockPlan',
  'nativeGpuRuntimeProofRef',
  'modelWeightManifestRef',
  'runtimeJobAdmissionReadyWithProvidedEvidence',
  'proof_refs_accepted_pending_live_worker_enqueue',
  'gpuModelExternalBetaReadinessBlocker',
  'nextExternalAgentAction',
  'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing:${phrase}`)
}
for (const phrase of [
  'Expected eight GPU/model cases',
  'Expected five model-weight proof-ready cases',
  'allGpuModelToolsExposeActionableUnblockPlan',
  'allModelWeightToolsReportManifestMissing',
  'nativeGpuProofOnlyToolsAcceptPrivateProofRefsForAdmission',
  'modelWeightToolsAcceptPrivateManifestAndGpuProofRefsForAdmission',
  'allGpuModelToolsAcceptRequiredPrivateProofRefsForAdmission',
  'proofReadyGpuToolsStillFailClosedBeforeWorkerEnqueue',
  'proofReadyModelWeightToolsStillFailClosedBeforeWorkerEnqueue',
  'proofReadyModelWeightToolsDoNotLoadWeightsOrStartGpu',
  'blocked_pending_native_gpu_runtime_proof',
  'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'Model-Weight Proof Ref Admission Results',
]) {
  if (!cliSource.includes(phrase)) fail(`cli_missing:${phrase}`)
}
if (modelWeightIntake.status !== 'blocked_missing_private_checksum_evidence') {
  fail('model_weight_private_evidence_intake_status_mismatch')
}
if (modelWeightIntake.counts?.reviewedPrivateManifestRecordsAccepted !== 0) {
  fail('model_weight_private_manifests_unexpectedly_accepted')
}
if (gpuRuntimeGate.booleans?.gpuRuntimeOnDemandOnly !== true) {
  fail('gpu_runtime_gate_on_demand_policy_missing')
}
if (gpuRuntimeGate.booleans?.gpuModelRuntimeReadyNow !== false) {
  fail('gpu_runtime_gate_ready_now_not_false')
}
if (
  browserRuntimeRouteSmoke.decision !==
  'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_smoke_passed'
) {
  fail('browser_runtime_route_smoke_decision_mismatch')
}
if (browserRuntimeRouteSmoke.counts?.controlledCanonicalRouteExecutedTools !== 13) {
  fail('browser_runtime_route_smoke_controlled_count_mismatch')
}
if (
  !scorecard.includes(
    'AI Graphics External Beta Canonical Tool Call Route GPU Model Runtime Admission Smoke',
  )
) {
  fail('scorecard_missing_gpu_model_runtime_admission_section')
}
if (!scorecard.includes('agentCanExecuteGpuModelToolsNow=false')) {
  fail('scorecard_missing_gpu_model_execution_false')
}
if (!scorecard.includes('nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools=3')) {
  fail('scorecard_missing_native_gpu_proof_ready_ref_count')
}
if (!scorecard.includes('modelWeightAdmissionReadyWithProvidedRefsTools=5')) {
  fail('scorecard_missing_model_weight_proof_ready_ref_count')
}
if (!scorecard.includes('allGpuModelAdmissionReadyWithProvidedRefsTools=8')) {
  fail('scorecard_missing_all_gpu_model_proof_ready_ref_count')
}
for (const toolId of gpuModelTools) {
  if (!JSON.stringify(docs).includes(`"${toolId}"`)) fail(`docs_json_missing_tool:${toolId}`)
  if (!docsMd.includes(`\`${toolId}\``)) fail(`docs_md_missing_tool:${toolId}`)
}
for (const toolId of nativeGpuProofOnlyTools) {
  const proofReadyMention = JSON.stringify(docs.proofReadyNativeOnlyResults ?? [])
  if (!proofReadyMention.includes(`"${toolId}"`)) {
    fail(`docs_json_missing_proof_ready_tool:${toolId}`)
  }
}
for (const toolId of modelWeightManifestRequiredTools) {
  const proofReadyMention = JSON.stringify(docs.proofReadyModelWeightResults ?? [])
  if (!proofReadyMention.includes(`"${toolId}"`)) {
    fail(`docs_json_missing_model_weight_proof_ready_tool:${toolId}`)
  }
}

for (const [label, text] of [
  ['docs_md', docsMd],
  ['docs_json', JSON.stringify(docs)],
]) {
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(text)) fail(`${label}_forbidden_pattern:${pattern}`)
  }
}

const packageLockDiff = exec('git diff -- package-lock.json')
if (packageLockDiff.trim()) fail('package_lock_changed')

const trackedLocalArtifacts = exec('git ls-files .local-artifacts')
if (trackedLocalArtifacts.trim()) fail('local_artifacts_tracked')

const changedFiles = [
  ...exec('git diff --name-only HEAD').split('\n'),
  ...exec('git ls-files --others --exclude-standard').split('\n'),
].filter(Boolean)
for (const file of changedFiles) {
  if (changedGeneratedArtifactPattern.test(file)) fail(`generated_artifact_path_changed:${file}`)
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  gpuModelRuntimeAdmissionEvaluatedTools:
    docs.counts.gpuModelRuntimeAdmissionEvaluatedTools,
  gpuModelRuntimeAdmissionBlockedTools:
    docs.counts.gpuModelRuntimeAdmissionBlockedTools,
  nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools:
    docs.counts.nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools,
  modelWeightAdmissionReadyWithProvidedRefsTools:
    docs.counts.modelWeightAdmissionReadyWithProvidedRefsTools,
  allGpuModelAdmissionReadyWithProvidedRefsTools:
    docs.counts.allGpuModelAdmissionReadyWithProvidedRefsTools,
  controlledCanonicalRouteExecutedTools:
    docs.counts.controlledCanonicalRouteExecutedTools,
  gpuRuntimeShouldStartNow: docs.booleans.gpuRuntimeShouldStartNow,
  agentCanExecuteGpuModelToolsNow:
    docs.booleans.agentCanExecuteGpuModelToolsNow,
  packageLockUnchanged: true,
}, null, 2))
