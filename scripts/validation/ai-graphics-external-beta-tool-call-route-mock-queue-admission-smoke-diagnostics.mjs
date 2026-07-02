import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const runScriptName =
  'ai-graphics:external-beta-tool-call-route-mock-queue-admission-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-call-route-mock-queue-admission-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-tool-call-route-mock-queue-admission-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-call-route-mock-queue-admission-smoke-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_tool_call_route_mock_queue_admission_smoke_passed'
const routePath = '/api/ai-graphics/external-beta/tool-call'
const routeFlag =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED'
const routeEnvField =
  'aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled'

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

const requiredFiles = [
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'server/cli/ai-graphics-external-beta-tool-call-route-mock-queue-admission-smoke.ts',
  'scripts/validation/ai-graphics-external-beta-tool-call-route-mock-queue-admission-smoke-diagnostics.mjs',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/config/env.ts',
  'server/app.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-mock-queue-admission-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-mock-queue-admission-smoke.md',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const forbiddenDocPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /liveQueueWritePerformed["`:\s=]+true/i,
  /workerDispatchPerformed["`:\s=]+true/i,
  /toolExecutionPerformed["`:\s=]+true/i,
  /gpuRuntimeShouldStartNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
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

function runJson(scriptName) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    maxBuffer: 128 * 1024 * 1024,
  })
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_run_json:${scriptName}:${error.message}`)
    return {}
  }
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
    },
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
const docs = json(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-mock-queue-admission-smoke.json',
)
const docsMd = read(
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-mock-queue-admission-smoke.md',
)
const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
const envSource = read('server/config/env.ts')
const appSource = read('server/app.ts')
const queueServiceSource = read('server/services/ai-graphics-tool-runtime-queue-service.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (packageJson.scripts?.[runScriptName] !== runScriptCommand) fail('missing_run_script')
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('missing_diagnostic_script')
}

for (const token of [
  routePath,
  routeFlag,
  routeEnvField,
  'admitAiGraphicsExternalBetaToolCallToMockQueue',
  'createAiGraphicsToolRuntimeQueueService',
  "'MOCK_ONLY'",
  'agentCanSubmitToolCallToQueueAdmissionNow',
]) {
  if (!routeSource.includes(token) && !envSource.includes(token)) {
    fail(`source_missing:${token}`)
  }
}

if (!appSource.includes('createAiGraphicsExternalBetaToolCallRoutes')) {
  fail('app_missing_broad_tool_call_route_factory')
}
if (!queueServiceSource.includes('enqueue_ai_graphics_tool_runtime_jobs')) {
  fail('queue_service_missing_enqueue_rpc_name')
}
if (!scorecard.includes('AI Graphics External Beta Tool Call Route Mock Queue Admission Smoke')) {
  fail('scorecard_missing_section')
}

if (docs.decision !== decision) fail('doc_decision_mismatch')
if (docs.status !== 'mock_queue_admission_route_smoke_passed_for_all_21_tools') {
  fail('doc_status_mismatch')
}
if (docs.routePath !== routePath) fail('doc_route_path_mismatch')
if (docs.routeFlag !== routeFlag) fail('doc_route_flag_mismatch')
if (docs.counts?.all21ToolsInLane !== 21) fail('doc_tool_count_mismatch')
if (docs.counts?.routeAdmissionAcceptedTools !== 21) fail('doc_admission_count_mismatch')
if (docs.counts?.mockQueueInsertedJobs !== 21) fail('doc_mock_queue_job_count_mismatch')
if (docs.counts?.liveQueueWritePerformedTools !== 0) fail('doc_live_queue_write_count_mismatch')
if (docs.counts?.workerDispatchPerformedTools !== 0) fail('doc_worker_dispatch_count_mismatch')
if (docs.counts?.toolExecutionPerformedTools !== 0) fail('doc_tool_execution_count_mismatch')
if (docs.counts?.gpuRuntimeShouldStartNowTools !== 0) fail('doc_gpu_runtime_count_mismatch')

for (const tool of tools) {
  if (!JSON.stringify(docs).includes(tool)) fail(`doc_missing_tool:${tool}`)
  if (!routeSource.includes(tool)) fail(`route_missing_tool:${tool}`)
}

for (const [key, expected] of Object.entries({
  externalBetaToolCallRouteMockQueueAdmissionSmokePassed: true,
  broadAll21ToolCallRouteCanAdmitMockQueueNow: true,
  agentCanSubmitToolCallToQueueAdmissionNow: true,
  agentCanExecuteToolsNow: false,
  routeExecutionPerformed: true,
  backendQueueSubmissionPerformed: false,
  liveQueueWritePerformed: false,
  workerEnqueuePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
})) {
  if (docs.booleans?.[key] !== expected) fail(`doc_boolean_mismatch:${key}`)
}

for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(docsMd)) fail(`forbidden_doc_pattern:${pattern}`)
}

const smoke = runJson(runScriptName)
if (smoke.decision !== decision) fail('smoke_decision_mismatch')
if (smoke.routeMountedButAdmissionDisabledStatus !== 409) {
  fail('smoke_disabled_route_status_mismatch')
}
if (smoke.routeAdmissionAcceptedTools !== 21) fail('smoke_admission_count_mismatch')
if (smoke.mockQueueInsertedJobs !== 21) fail('smoke_mock_queue_job_count_mismatch')
if (smoke.agentCanExecuteToolsNowTools !== 0) fail('smoke_agent_execute_count_mismatch')
if (smoke.liveQueueWritePerformedTools !== 0) fail('smoke_live_queue_write_count_mismatch')
if (smoke.workerDispatchPerformedTools !== 0) fail('smoke_worker_dispatch_count_mismatch')
if (smoke.toolExecutionPerformedTools !== 0) fail('smoke_tool_execution_count_mismatch')
if (smoke.gpuRuntimeShouldStartNowTools !== 0) fail('smoke_gpu_runtime_count_mismatch')
for (const result of smoke.routeResults ?? []) {
  if (result.statusCode !== 202) fail(`smoke_status_not_202:${result.toolId}`)
  if (result.mockOnly !== true) fail(`smoke_not_mock_only:${result.toolId}`)
  if (result.insertedJobCount !== 1) fail(`smoke_insert_count:${result.toolId}`)
  if (result.agentCanSubmitToolCallToQueueAdmissionNow !== true) {
    fail(`smoke_admission_false:${result.toolId}`)
  }
  if (result.agentCanExecuteToolsNow !== false) fail(`smoke_agent_execute_true:${result.toolId}`)
  if (result.liveQueueWritePerformed !== false) fail(`smoke_live_queue_write:${result.toolId}`)
  if (result.workerDispatchPerformed !== false) fail(`smoke_worker_dispatch:${result.toolId}`)
  if (result.toolExecutionPerformed !== false) fail(`smoke_tool_execution:${result.toolId}`)
  if (result.gpuRuntimeShouldStartNow !== false) fail(`smoke_gpu_started:${result.toolId}`)
}

let packageLockDiff = ''
try {
  packageLockDiff = git(['diff', '--', 'package-lock.json'])
} catch (error) {
  fail(`package_lock_diff_failed:${error.message}`)
}
if (packageLockDiff.trim()) fail('package_lock_changed')

let changed = ''
try {
  changed = git(['diff', '--name-only', 'HEAD'])
} catch (error) {
  fail(`changed_files_failed:${error.message}`)
}
for (const file of changed.split('\n').filter(Boolean)) {
  if (file.includes('.local-artifacts/')) fail(`local_artifact_changed:${file}`)
  if (/(^|\/)(generated|render|renders|canvas|webgl|public-artifacts)(\/|$)/i.test(file)) {
    fail(`generated_output_changed:${file}`)
  }
  if (/\.(mp4|mov|webm|png|jpe?g|gif|webp)$/i.test(file)) {
    fail(`generated_media_changed:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status: docs.status,
  routeAdmissionAcceptedTools: 21,
  mockQueueInsertedJobs: 21,
  agentCanSubmitToolCallToQueueAdmissionNow: true,
  agentCanExecuteToolsNow: false,
  liveQueueWritePerformed: false,
  workerDispatchPerformed: false,
  toolExecutionPerformed: false,
  gpuRuntimeShouldStartNow: false,
  packageLockUnchanged: true,
}, null, 2))
