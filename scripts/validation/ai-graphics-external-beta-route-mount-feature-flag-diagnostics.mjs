import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'ai_graphics_external_beta_route_mount_feature_flag_prepared_closed_by_default'
const status =
  'route_mount_feature_flag_defined_gated_app_mount_prepared_runtime_blocked'
const scriptName = 'ai-graphics:external-beta-route-mount-feature-flag:diagnostics'
const scriptCommand =
  'node scripts/validation/ai-graphics-external-beta-route-mount-feature-flag-diagnostics.mjs'
const flagName = 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED'
const runtimeField = 'aiGraphicsExternalBetaToolCallRouteMountEnabled'

const requiredFiles = [
  'server/config/env.ts',
  'server/app.ts',
  'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.json',
  'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.md',
  'scripts/validation/ai-graphics-external-beta-route-mount-feature-flag-diagnostics.mjs',
  'package.json',
]

const falseKeys = [
  'agentCanExecuteToolsNow',
  'apiRouteMountedNow',
  'apiRouteExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerEnqueueApprovedNow',
  'toolExecutionApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'workerEnqueuePerformed',
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

function read(file) {
  const filePath = path.join(root, file)
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
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[scriptName] !== scriptCommand) {
  fail('package_script_mismatch')
}

const envSource = read('server/config/env.ts')
for (const phrase of [
  `${runtimeField}: boolean`,
  `${flagName}: z.string().optional()`,
  `parseBoolean(parsed.${flagName})`,
]) {
  if (!envSource.includes(phrase)) fail(`env_missing:${phrase}`)
}
if (!envSource.includes(`${runtimeField}:`) ||
    !envSource.includes(`env.${runtimeField}`)) {
  fail('env_missing_safe_summary_field')
}

const appSource = read('server/app.ts')
for (const phrase of [
  "import { createAiGraphicsExternalBetaToolCallRoutes }",
  `env.${runtimeField}`,
  'app.use(createAiGraphicsExternalBetaToolCallRoutes())',
]) {
  if (!appSource.includes(phrase)) fail(`app_missing_gated_mount:${phrase}`)
}

const routeSource = read('server/routes/ai-graphics-external-beta-tool-call-routes.ts')
for (const phrase of [
  'routeMountedByAppNow: true',
  'routeMountFeatureFlagEnabled: true',
  'routeExecutionApprovedNow: false',
  'workerEnqueueApprovedNow: false',
  'toolExecutionApprovedNow: false',
  'gpuRuntimeShouldStartNow: false',
]) {
  if (!routeSource.includes(phrase)) fail(`route_missing_fail_closed_detail:${phrase}`)
}

const packet = json(
  'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.md',
)
if (packet.decision !== decision) fail('packet_decision_mismatch')
if (packet.status !== status) fail('packet_status_mismatch')
if (packet.flag?.envName !== flagName) fail('packet_flag_name_mismatch')
if (packet.flag?.runtimeEnvField !== runtimeField) {
  fail('packet_runtime_field_mismatch')
}
if (packet.flag?.defaultEnabled !== false) fail('packet_default_not_false')
if (packet.flag?.sourceControlledAppMountWired !== true) {
  fail('packet_app_mount_wired_not_true')
}
if (packet.flag?.appRouteMountedByDefaultNow !== false) {
  fail('packet_default_route_mounted_not_false')
}
if (packet.flag?.appRouteMountedWhenFlagEnabled !== true) {
  fail('packet_flag_enabled_route_mounted_not_true')
}
if (packet.counts?.totalAiGraphicsTools !== 21) fail('packet_tools_not_21')
if (packet.counts?.totalProductFacingCapabilities !== 12) {
  fail('packet_capabilities_not_12')
}
if (packet.counts?.routeMountFeatureFlagDefinedTools !== 21) {
  fail('packet_flag_tools_not_21')
}
if (packet.counts?.routeMountCodeWiredTools !== 21) {
  fail('packet_mount_code_wired_tools_not_21')
}
if (packet.counts?.apiRouteMountedNowTools !== 0) {
  fail('packet_route_mounted_now_tools_not_0')
}

if (packet.booleans?.routeMountFeatureFlagPrepared !== true) {
  fail('packet_feature_flag_prepared_not_true')
}
if (packet.booleans?.routeMountGatedAppMountPrepared !== true) {
  fail('packet_gated_app_mount_not_true')
}
if (packet.booleans?.routeMountFlagDefaultClosed !== true) {
  fail('packet_default_closed_not_true')
}
if (packet.booleans?.safeRuntimeSummaryExposesFlag !== true) {
  fail('packet_summary_flag_not_true')
}
if (packet.booleans?.agentCanSelectForPlanning !== true) {
  fail('packet_planning_not_true')
}
for (const key of falseKeys) {
  if (packet.booleans?.[key] !== false) fail(`packet_${key}_not_false`)
}

for (const phrase of [
  flagName,
  runtimeField,
  'gated mount',
  'default flag value keeps the current app route unmounted',
  'apiRouteMountedNow=false',
  'agentCanExecuteToolsNow=false',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}

for (const forbidden of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"apiRouteMountedNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"gpuRuntimeShouldStartNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  for (const file of [
    'server/config/env.ts',
    'server/app.ts',
    'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
    'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.json',
    'docs/tool-intelligence/ai-graphics/external-beta-route-mount-feature-flag.md',
    'package.json',
  ]) {
    if (forbidden.test(read(file))) fail(`forbidden_claim:${file}:${forbidden}`)
  }
}

if (git(['diff', '--name-only', '--', 'package-lock.json'])) {
  fail('package_lock_changed')
}
const stagedFiles = git(['diff', '--cached', '--name-only'])
if (stagedFiles.split('\n').filter(Boolean).some((file) => file.startsWith('.local-artifacts/'))) {
  fail('local_artifacts_staged')
}
const generatedPathPattern = /(^|\/)(generated|renders?|browser-output|canvas-output|webgl-output|public-artifacts?)(\/|$)/i
if (stagedFiles.split('\n').filter(Boolean).some((file) => generatedPathPattern.test(file))) {
  fail('generated_output_staged')
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  status,
  flagName,
  runtimeField,
  toolsCovered: 21,
  apiRouteMountedNow: false,
  routeMountGatedAppMountPrepared: true,
  agentCanExecuteToolsNow: false,
  packageLockChanged: false,
}, null, 2))
