import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed'
const status =
  'gpu_model_proof_ref_route_mock_queue_admission_and_claim_passed_for_eight_tools'
const runScriptName =
  'ai-graphics:external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke-diagnostics.mjs'

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

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/cli/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.md',
  'package.json',
]

const forbiddenTrueBooleans = [
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'agentCanExecuteToolsNow',
  'backendQueueSubmissionPerformed',
  'liveQueueWritePerformed',
  'liveWorkerClaimPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
  'workerDispatchPerformed',
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
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
]

const forbiddenDocPatterns = [
  /agentCanExecuteGpuModelToolsNow["`:\s=]+true/i,
  /agentCanExecuteAll21ToolsNow["`:\s=]+true/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /workerExecutionPerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
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
  /internalBetaReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif)$/i

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
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function checkBoolean(report, key, expected) {
  if (report.booleans?.[key] !== expected) {
    fail(`boolean_${key}_expected_${expected}`)
  }
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
  if (
    report.queueAdmissionFlag !==
    'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED'
  ) {
    fail(`${label}_queue_admission_flag_mismatch`)
  }
  if (report.queueDisabledProofReadyStatus !== 409) {
    fail(`${label}_queue_disabled_status_not_409`)
  }

  const rows = Array.isArray(report.routeQueuedJobs) ? report.routeQueuedJobs : []
  const claims = Array.isArray(report.workerClaims) ? report.workerClaims : []
  if (rows.length !== 8) fail(`${label}_route_queued_jobs_count_mismatch`)
  if (claims.length !== 8) fail(`${label}_worker_claims_count_mismatch`)

  for (const toolId of gpuModelTools) {
    const row = rows.find((item) => item.toolId === toolId)
    const claim = claims.find((item) => item.toolId === toolId)
    if (!row) {
      fail(`${label}_missing_route_job:${toolId}`)
      continue
    }
    if (!claim) fail(`${label}_missing_worker_claim:${toolId}`)
    if (row.statusCode !== 202) fail(`${label}_${toolId}_status_not_202`)
    if (row.ok !== true) fail(`${label}_${toolId}_ok_not_true`)
    if (
      row.routeStatus !==
      'external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted_runtime_still_blocked'
    ) {
      fail(`${label}_${toolId}_route_status_mismatch`)
    }
    if (row.queueAdmissionMode !== 'mock_only_gpu_model_proof_ref') {
      fail(`${label}_${toolId}_queue_mode_mismatch`)
    }
    if (row.insertedJobCount !== 1) fail(`${label}_${toolId}_inserted_count_not_one`)
    if (row.mockOnly !== true) fail(`${label}_${toolId}_mock_only_not_true`)
    if (!row.mockQueueJobId) fail(`${label}_${toolId}_missing_mock_queue_job_id`)
    if (row.workerType !== 'gpu_ai_worker') fail(`${label}_${toolId}_worker_type_mismatch`)
    if (!/native_linux_amd64_nvidia_l4/.test(row.runtimeTarget ?? '')) {
      fail(`${label}_${toolId}_runtime_target_not_gpu`)
    }
    if (row.nativeGpuRuntimeProofRefAccepted !== true) {
      fail(`${label}_${toolId}_native_gpu_proof_ref_not_accepted`)
    }
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      if (row.modelWeightManifestRequired !== true) {
        fail(`${label}_${toolId}_model_weight_manifest_not_required`)
      }
      if (row.modelWeightManifestRefAccepted !== true) {
        fail(`${label}_${toolId}_model_weight_manifest_not_accepted`)
      }
    } else {
      if (row.modelWeightManifestRequired !== false) {
        fail(`${label}_${toolId}_unexpected_model_weight_manifest_required`)
      }
      if (row.modelWeightManifestRefAccepted !== false) {
        fail(`${label}_${toolId}_unexpected_model_weight_manifest_accepted`)
      }
    }
    if (row.runtimeJobAdmissionReadyWithProvidedEvidence !== true) {
      fail(`${label}_${toolId}_runtime_job_admission_not_ready`)
    }
    if (row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !== true) {
      fail(`${label}_${toolId}_future_gpu_start_not_allowed_for_accepted_job`)
    }
    if (row.agentCanSubmitGpuModelToolCallToQueueAdmissionNow !== true) {
      fail(`${label}_${toolId}_agent_cannot_submit_to_queue_admission`)
    }
    for (const forbidden of [
      'agentCanExecuteGpuModelToolsNow',
      'agentCanExecuteAll21ToolsNow',
      'liveQueueWritePerformed',
      'workerDispatchPerformed',
      'toolExecutionPerformed',
      'gpuRuntimeShouldStartNow',
      'modelWeightsLoaded',
      'publicArtifactCreated',
      'signedUrlCreated',
    ]) {
      if (row[forbidden] === true) fail(`${label}_${toolId}_forbidden_true:${forbidden}`)
    }
    if (claim) {
      if (claim.mockWorkerClaimCreated !== true) {
        fail(`${label}_${toolId}_mock_worker_claim_not_created`)
      }
      if (claim.privateWorkerClaimLeaseOnly !== true) {
        fail(`${label}_${toolId}_worker_claim_not_private_lease_only`)
      }
      if (claim.mockWorkerLeaseSeconds !== 900) {
        fail(`${label}_${toolId}_worker_claim_lease_seconds_mismatch`)
      }
      if (claim.leaseExpiresAtPresent !== true) {
        fail(`${label}_${toolId}_missing_worker_claim_lease_expiry`)
      }
    }
  }

  const expectedCounts = {
    totalAiGraphicsTools: 21,
    gpuModelToolsCovered: 8,
    gpuModelProofRefMockQueueAdmissionAcceptedTools: 8,
    gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools: 8,
    nativeGpuRuntimeProofRefAcceptedTools: 8,
    modelWeightManifestRefAcceptedTools: 5,
    modelWeightManifestRequiredTools: 5,
    mockQueueInsertedJobs: 8,
    mockWorkerClaimsCreated: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveQueueWritePerformedTools: 0,
    workerDispatchPerformedTools: 0,
    toolExecutionPerformedTools: 0,
    gpuRuntimeShouldStartNowTools: 0,
    modelWeightsLoadedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    if (report.counts?.[key] !== value) fail(`${label}_count_${key}_mismatch`)
  }

  for (const [key, value] of Object.entries({
    externalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePassed: true,
    all8GpuModelToolsCovered: true,
    all8GpuModelProofRefMockQueueAdmissionsAccepted: true,
    all8GpuModelMockJobsClaimed: true,
    mockOnlyRuntimeModeEnforced: true,
    privateWorkerClaimLeaseOnly: true,
    routeQueueAdmissionRequiresProofRefs: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    gpuStartsOnlyForApprovedWorkerOrToolCall: true,
    agentCanSelectForPlanning: true,
    agentCanSubmitGpuModelToolCallToQueueAdmissionNow: true,
    agentCanClaimMockGpuModelWorkerLeaseNow: true,
  })) {
    checkBoolean(report, key, value)
  }
  for (const key of forbiddenTrueBooleans) checkBoolean(report, key, false)
}

for (const file of requiredFiles) {
  if (!fs.existsSync(absolute(file))) fail(`missing_file:${file}`)
}

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
for (const needle of [
  'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted',
  'external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted_runtime_still_blocked',
  'mock_only_gpu_model_proof_ref',
  'runtimeJobAdmissionReadyWithProvidedEvidence: true',
  'gpuRuntimeShouldStartNow: false',
  'modelWeightsLoaded: false',
  'publicArtifactCreated: false',
  'signedUrlCreated: false',
]) {
  if (!routeSource.includes(needle)) fail(`route_missing:${needle}`)
}

const docsReport = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json',
)
checkReport('docs', docsReport)

let runtimeReport = null
try {
  runtimeReport = JSON.parse(exec(`npm run --silent ${runScriptName}`))
  checkReport('runtime', runtimeReport)
} catch (error) {
  fail(`runtime_smoke_failed:${error.message}`)
}

const md = read(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.md',
)
for (const toolId of gpuModelTools) {
  if (!md.includes(`\`${toolId}\``)) fail(`markdown_missing_tool:${toolId}`)
}
if (!/does not execute workers, tools, GPU runtime, model loading, live Supabase writes, signed URLs, or public artifacts/i.test(md)) {
  fail('markdown_missing_no_execution_boundary')
}

for (const file of [
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.md',
]) {
  const text = read(file)
  for (const pattern of forbiddenDocPatterns) {
    if (pattern.test(text)) fail(`forbidden_pattern:${file}:${pattern}`)
  }
}

const packageLockDiff = exec('git diff --name-only -- package-lock.json').trim()
if (packageLockDiff) fail('package_lock_changed')

const packageDiff = exec('git diff -- package.json')
for (const line of packageDiff.split('\n')) {
  if (!line.startsWith('+') && !line.startsWith('-')) continue
  if (
    /"dependencies"|"devDependencies"|"optionalDependencies"|"peerDependencies"/.test(line)
  ) {
    fail('package_dependency_section_changed')
  }
}

const changedFiles = exec('git diff --name-only --cached && git diff --name-only')
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean)
for (const file of changedFiles) {
  if (generatedArtifactPattern.test(file)) fail(`generated_or_local_artifact_changed:${file}`)
}

const trackedLocalArtifacts = exec('git ls-files .local-artifacts').trim()
if (trackedLocalArtifacts) fail('local_artifacts_tracked')

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      status,
      gpuModelToolsCovered: gpuModelTools.length,
      modelWeightManifestRequiredTools: modelWeightManifestRequiredTools.length,
      packageLockUnchanged: true,
      routeExecutionPerformed: true,
      mockWorkerClaimPerformed: true,
      agentCanExecuteGpuModelToolsNow: false,
      gpuRuntimeShouldStartNow: false,
      productionReadyNow: false,
    },
    null,
    2,
  ),
)
