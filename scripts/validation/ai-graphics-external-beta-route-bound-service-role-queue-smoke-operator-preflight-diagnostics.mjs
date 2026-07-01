import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_operator_preflight_prepared_with_runtime_blocks'
const acceptedStatus =
  'route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked'
const runScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-operator-preflight'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-route-bound-service-role-queue-smoke-operator-preflight:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight-diagnostics.mjs'

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight.ts',
  'server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight.ts',
  'scripts/validation/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.md',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-result-capture-contract.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

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

const trueKeys = [
  'externalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightPrepared',
  'sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted',
  'routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence',
  'operatorEnvironmentAccepted',
  'operatorFlagsAccepted',
  'privateNonProductionOnly',
  'serviceRoleCredentialsServerOnly',
  'noServiceRoleCredentialValueReturned',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'apiRouteExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'routeBoundServiceRoleQueueSmokeRunApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'workerDispatchApprovedNow',
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
  'backendQueueSubmissionPerformed',
  'serviceRoleQueueSmokePerformed',
  'serviceRoleTransactionPerformed',
  'supabaseMutationPerformed',
  'liveQueueWritePerformed',
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

const requiredPolicyKeys = [
  'sourceResultCaptureContractRequired',
  'explicitOperatorConfirmationRequired',
  'nonProductionEnvironmentRequired',
  'serverOnlyServiceRoleCredentialsRequired',
  'approvedPlanSnapshotRequired',
  'creditReservationRequired',
  'idempotencyPrefixRequired',
  'privateResultEvidenceTelemetryCleanupRefsRequired',
  'noSupabaseClientCreation',
  'noServiceRoleQueueSmoke',
  'noBackendQueueSubmission',
  'noLiveQueueWrite',
  'noWorkerDispatch',
  'noToolExecution',
  'onDemandGpuOnly',
  'noIdleGpuRuntimeApproved',
]

const forbiddenDocPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s]+/i,
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /apiRouteExecutionApprovedNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /routeBoundServiceRoleQueueSmokeRunApprovedNow["`:\s=]+true/i,
  /serviceRoleQueueSmokeApprovedNow["`:\s=]+true/i,
  /liveServiceRoleQueueSmokeExecutedNow["`:\s=]+true/i,
  /backendQueueSubmissionApprovedNow["`:\s=]+true/i,
  /liveQueueWriteApprovedNow["`:\s=]+true/i,
  /workerDispatchApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /dependencyInstallPerformed["`:\s=]+true/i,
  /packageLockMutationPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /routeExecutionPerformed["`:\s=]+true/i,
  /backendQueueSubmissionPerformed["`:\s=]+true/i,
  /serviceRoleQueueSmokePerformed["`:\s=]+true/i,
  /serviceRoleTransactionPerformed["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /supabaseMutationPerformed["`:\s=]+true/i,
  /gpuRuntimePerformed["`:\s=]+true/i,
  /publicArtifactCreated["`:\s=]+true/i,
  /signedUrlCreated["`:\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const changedGeneratedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated|render|renders|canvas|webgl|public-artifacts)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i

const allowedPackageDiffLines = [
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-agent-mounted-blocked-route-smoke": "tsx server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts",',
  '+    "ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics": "node scripts/validation/ai-graphics-external-agent-mounted-blocked-route-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-route-to-queue-blocked-admission": "tsx server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts",',
  '+    "ai-graphics:external-agent-route-to-queue-blocked-admission:diagnostics": "node scripts/validation/ai-graphics-external-agent-route-to-queue-blocked-admission-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof": "tsx server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts",',
  '+    "ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-claim-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-claim-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-claim-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof": "tsx server/cli/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof.ts",',
  '+    "ai-graphics:external-agent-mock-worker-dispatch-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof": "tsx server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts",',
  '+    "ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof": "tsx server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts",',
  '+    "ai-graphics:external-agent-controlled-dispatcher-dry-run-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof": "tsx server/cli/ai-graphics-external-agent-tool-adapter-authorization-proof.ts",',
  '+    "ai-graphics:external-agent-tool-adapter-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-external-agent-tool-adapter-authorization-proof-diagnostics.mjs",',
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

function exec(command, options = {}) {
  return childProcess.execSync(command, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
      ...options.env,
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function countFrom(packet, key) {
  const direct = packet?.[key]
  if (Array.isArray(direct)) return direct.length
  return direct ?? packet?.counts?.[key] ?? packet?.expectedCounts?.[key] ?? packet?.scope?.[key]
}

function checkBooleans(packet, label) {
  for (const key of trueKeys) {
    if (packet.booleans?.[key] !== true) fail(`${label}:boolean_not_true:${key}`)
  }
  for (const key of falseKeys) {
    if (packet.booleans?.[key] !== false) fail(`${label}:boolean_not_false:${key}`)
  }
}

function checkToolsAndCapabilities(packet, label) {
  for (const tool of tools) {
    if (!packet.tools?.includes(tool)) fail(`${label}:missing_tool:${tool}`)
  }
  for (const tool of gpuTools) {
    if (!packet.gpuRuntimeTargetedTools?.includes(tool)) {
      fail(`${label}:missing_gpu_tool:${tool}`)
    }
  }
  for (const capability of capabilities) {
    if (!packet.capabilities?.includes(capability)) {
      fail(`${label}:missing_capability:${capability}`)
    }
  }
}

function checkCounts(packet, label) {
  const expected = {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeBoundServiceRoleQueueSmokeOperatorPreflightReadyToolsWithProvidedEvidence: 21,
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence: 21,
    operatorEnvironmentAcceptedToolsWithProvidedEvidence: 21,
    operatorFlagsAcceptedToolsWithProvidedEvidence: 21,
    expectedLiveQueueRowsBeforeCleanup: 21,
    expectedWorkerClaimRowsBeforeCleanup: 21,
    expectedPersistedRowsAfterCleanup: 0,
    routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (countFrom(packet, key) !== value) fail(`${label}:bad_count:${key}`)
  }
}

function checkPacket(packet, label) {
  if (packet.decision !== decision) fail(`${label}:bad_decision`)
  if (packet.status !== acceptedStatus) fail(`${label}:bad_status`)
  if (packet.interfaces?.runScript !== runScriptName) fail(`${label}:bad_run_script`)
  if (packet.interfaces?.diagnosticScript !== diagnosticScriptName) {
    fail(`${label}:bad_diagnostic_script`)
  }
  if (packet.interfaces?.supabaseClientCreated !== false) {
    fail(`${label}:supabase_client_created_not_false`)
  }
  for (const key of requiredPolicyKeys) {
    if (packet.operatorPreflightPolicy?.[key] !== true) {
      fail(`${label}:policy_not_true:${key}`)
    }
  }
  if (packet.requiredOperatorEnvironment?.secretValuesReturned !== false) {
    fail(`${label}:secret_values_returned_not_false`)
  }
  for (const key of [
    'confirmExternalBetaServiceRoleQueueSmoke',
    'nonProductionSmokeEnvironment',
    'supabaseUrlPresent',
    'supabaseServiceRoleKeyPresent',
    'e2eRuntimeModeLocal',
    'workerRuntimeModeMock',
    'nodeEnvNotProduction',
    'productionFlagAbsent',
  ]) {
    if (packet.maskedOperatorEnvironment?.[key] !== true) {
      fail(`${label}:masked_environment_not_true:${key}`)
    }
  }
  for (const blocked of [
    'Supabase client creation',
    'API route execution',
    'service-role queue smoke execution now',
    'live queue write',
    'Worker execution',
    'tool execution',
    'GPU/model runtime execution now',
    'idle or always-on GPU runtime',
    'signed URL creation',
    'public artifact creation',
    'production unlock',
  ]) {
    if (!packet.blockedRuntimeActions?.includes(blocked)) {
      fail(`${label}:missing_blocked_action:${blocked}`)
    }
  }
  checkToolsAndCapabilities(packet, label)
  checkCounts(packet, label)
  checkBooleans(packet, label)
}

function checkLiveCommandTemplate(command, label) {
  for (const flag of [
    '--external-beta-service-role-queue-smoke-authorization-packet',
    '--route-bound-service-role-queue-smoke-operator-preflight-packet',
    '--service-role-queue-smoke-readiness-ref',
    '--runtime-queue-service-proof-bridge-ref',
    '--source-runtime-queue-service-proof-bridge-accepted',
  ]) {
    if (!command?.includes(flag)) fail(`${label}:command_missing_flag:${flag}`)
  }
}

function checkEvaluatorReport(report) {
  if (report.decision !== decision) fail('evaluator:bad_decision')
  if (report.status !== acceptedStatus) fail('evaluator:bad_status')
  if (report.rejectionReasons?.length) {
    fail(`evaluator:unexpected_rejections:${report.rejectionReasons.join('|')}`)
  }
  if (report.input?.supabaseUrlValueReturned !== false) fail('evaluator:supabase_url_returned')
  if (report.input?.supabaseServiceRoleKeyValueReturned !== false) {
    fail('evaluator:service_role_key_returned')
  }
  if (report.input?.supabaseClientCreated !== false) fail('evaluator:supabase_client_created')
  if (report.missingOperatorEnvironment?.length) {
    fail(`evaluator:missing_environment:${report.missingOperatorEnvironment.join('|')}`)
  }
  if (report.missingOperatorFlags?.length) {
    fail(`evaluator:missing_flags:${report.missingOperatorFlags.join('|')}`)
  }
  checkLiveCommandTemplate(report.futureExecutionCommandTemplate, 'evaluator')
  checkCounts(report, 'evaluator')
  checkBooleans(report, 'evaluator')
}

function checkForbiddenClaims() {
  const files = requiredFiles
    .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
    .concat(['docs/production-beta-readiness-scorecard.md'])
  for (const file of files) {
    const content = read(file)
    for (const pattern of forbiddenDocPatterns) {
      if (pattern.test(content)) fail(`forbidden_claim:${file}:${pattern}`)
    }
  }
}

function checkPackageScripts() {
  const pkg = json('package.json')
  if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
    fail('package_json:missing_run_script')
  }
  if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('package_json:missing_diagnostic_script')
  }

  const packageDiff = exec('git diff -- package.json')
  const addedLines = packageDiff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  for (const line of addedLines) {
    if (!allowedPackageDiffLines.includes(line)) {
      fail(`package_json:unexpected_added_line:${line}`)
    }
  }
  const dependencyDiff = packageDiff
    .split('\n')
    .some((line) => /"dependencies"|"devDependencies"|"optionalDependencies"|"peerDependencies"/.test(line))
  if (dependencyDiff) fail('package_json:dependency_section_changed')
}

function checkGitHygiene() {
  if (exec('git diff -- package-lock.json').trim()) fail('package_lock_changed')
  const changed = exec('git diff --name-only && git diff --name-only --cached')
    .split('\n')
    .filter(Boolean)
  for (const file of changed) {
    if (changedGeneratedArtifactPattern.test(file)) fail(`generated_or_local_artifact_changed:${file}`)
  }
}

for (const file of requiredFiles) read(file)

const packet = json('docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json')
checkPacket(packet, 'docs')

const cliOutput = exec([
  'npx tsx server/cli/ai-graphics-external-beta-route-bound-service-role-queue-smoke-operator-preflight.ts',
  '--route-bound-service-role-queue-smoke-result-capture-contract-packet docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-result-capture-contract.json',
  '--workspace-id non-production-workspace',
  '--project-id non-production-project',
  '--approved-plan-snapshot-id approved-plan-snapshot-for-preflight',
  '--credit-reservation-id credit-reservation-for-preflight',
  '--idempotency-prefix route-bound-smoke-preflight',
  '--route-bound-service-role-queue-smoke-result-capture-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/result.json',
  '--route-bound-service-role-queue-smoke-evidence-capture-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json',
  '--route-bound-service-role-queue-smoke-telemetry-capture-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json',
  '--route-bound-service-role-queue-smoke-cleanup-proof-capture-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json',
  '--route-bound-service-role-queue-smoke-proof-validator-ref ai-graphics:external-beta-service-role-queue-smoke-proof',
  '--route-bound-service-role-queue-smoke-post-run-review-ref route-bound-smoke://post-run-review/required-v1',
  '--service-role-queue-smoke-readiness-ref route-bound-smoke://readiness/pr-862',
  '--runtime-queue-service-proof-bridge-ref route-bound-smoke://runtime-queue-service-proof-bridge/pr-862',
  '--source-runtime-queue-service-proof-bridge-accepted',
].join(' '), {
  env: {
    REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE: 'true',
    REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV: 'non_production',
    SUPABASE_URL: 'https://non-production.example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'redacted_server_only_service_role_key_for_preflight',
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    NODE_ENV: 'test',
  },
})
checkEvaluatorReport(JSON.parse(cliOutput))

const scorecard = read('docs/production-beta-readiness-scorecard.md')
for (const fragment of [
  'AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Operator Preflight',
  decision,
  'routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence=true',
  'operatorEnvironmentAccepted=true',
  'operatorFlagsAccepted=true',
  'serviceRoleQueueSmokeApprovedNow=false',
  'liveQueueWritePerformed=false',
  'workerDispatchPerformed=false',
  'toolExecutionPerformed=false',
  'gpuRuntimeShouldStartNow=false',
]) {
  if (!scorecard.includes(fragment)) fail(`scorecard:missing_fragment:${fragment}`)
}

checkForbiddenClaims()
checkPackageScripts()
checkGitHygiene()

if (failures.length) {
  console.error(`AI graphics route-bound service-role queue-smoke operator preflight diagnostics failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics route-bound service-role queue-smoke operator preflight diagnostics passed')
