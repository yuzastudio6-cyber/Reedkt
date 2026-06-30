import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const decision = 'ai_graphics_production_launch_go_no_go_approved_with_runtime_blocks'
const acceptedStatus = 'production_launch_go_no_go_approved_pending_traffic_cutover'
const runScriptName = 'ai-graphics:production-launch-go-no-go'
const runScriptCommand = 'tsx server/cli/ai-graphics-production-launch-go-no-go.ts'
const diagnosticScriptName = 'ai-graphics:production-launch-go-no-go:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-launch-go-no-go-diagnostics.mjs'
const controlsScriptName = 'ai-graphics:production-launch-controls'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-launch-go-no-go.ts',
  'server/cli/ai-graphics-production-launch-go-no-go.ts',
  'scripts/validation/ai-graphics-production-launch-go-no-go-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-launch-go-no-go.json',
  'docs/tool-intelligence/ai-graphics/production-launch-go-no-go.md',
  'docs/tool-intelligence/ai-graphics/production-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/production-launch-controls.md',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const privateControlsArgs = [
  '--production-owner-approval-ref',
  'private://ai-graphics/production/owner-approval',
  '--production-support-runbook-ref',
  'backend://ai-graphics/production/support-runbook',
  '--production-incident-response-ref',
  'production-evidence://ai-graphics/production/incident-response',
  '--production-rollback-kill-switch-ref',
  'private://ai-graphics/production/rollback-kill-switch',
  '--production-cost-concurrency-ceiling-ref',
  'backend://ai-graphics/production/cost-concurrency-ceiling',
  '--production-monitoring-alerting-ref',
  'production-evidence://ai-graphics/production/monitoring-alerting',
  '--production-post-launch-review-ref',
  'private://ai-graphics/production/post-launch-review',
  '--production-credit-ledger-approval-snapshot-ref',
  'backend://ai-graphics/production/credit-ledger-approval-snapshot',
  '--production-tool-route-deployment-ref',
  'production-evidence://ai-graphics/production/tool-route-deployment',
  '--production-worker-deployment-ref',
  'private://ai-graphics/production/worker-deployment',
  '--production-privacy-retention-ref',
  'backend://ai-graphics/production/privacy-retention',
  '--production-private-artifact-controls-ref',
  'production-evidence://ai-graphics/production/private-artifact-controls',
  '--production-canary-cohort-ref',
  'private://ai-graphics/production/canary-cohort',
  '--production-launch-approver-role',
  'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
]

const privateGoNoGoArgs = [
  '--production-final-go-no-go-approval-ref',
  'private://ai-graphics/production/final-go-no-go-approval',
  '--production-traffic-cutover-plan-ref',
  'backend://ai-graphics/production/traffic-cutover-plan',
  '--production-feature-flag-cutover-ref',
  'production-evidence://ai-graphics/production/feature-flag-cutover',
  '--production-canary-ramp-plan-ref',
  'private://ai-graphics/production/canary-ramp-plan',
  '--production-rollback-operator-ack-ref',
  'backend://ai-graphics/production/rollback-operator-ack',
  '--production-monitoring-on-call-ack-ref',
  'production-evidence://ai-graphics/production/monitoring-on-call-ack',
  '--production-cost-ceiling-final-ack-ref',
  'private://ai-graphics/production/cost-ceiling-final-ack',
  '--production-privacy-retention-final-ack-ref',
  'backend://ai-graphics/production/privacy-retention-final-ack',
  '--production-post-cutover-review-schedule-ref',
  'production-evidence://ai-graphics/production/post-cutover-review-schedule',
  '--production-launch-approver-role',
  'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
]

const trueAcceptedKeys = [
  'productionLaunchGoNoGoPrepared',
  'sourceProductionLaunchControlsAccepted',
  'productionGoNoGoControlsAccepted',
  'productionLaunchGoNoGoApprovedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
  'externalBetaReadyNow',
]

const falseKeysAlways = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionTrafficCutoverApprovedNow',
  'productionTrafficEnabledNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
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

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`missing_file:${file}`)
    return ''
  }
  return fs.readFileSync(file, 'utf8')
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

function runNpm(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function assertFalseKeys(record, label) {
  const booleans = record.booleans ?? {}
  const input = record.input ?? {}
  for (const key of falseKeysAlways) {
    if (booleans[key] !== false && input[key] !== false) {
      fail(`${label}_false_key_not_false:${key}`)
    }
  }
}

function assertAccepted(record, label) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.sourceProductionLaunchControlsAccepted !== true) {
    fail(`${label}_source_controls_not_true`)
  }
  if (record.productionGoNoGoControlsAccepted !== true) {
    fail(`${label}_go_no_go_controls_not_true`)
  }
  if (record.rejectionReasons?.length !== 0) fail(`${label}_rejections_not_empty`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_caps_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_not_8`)
  if (record.productionLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
    fail(`${label}_approved_tools_not_21`)
  }
  if (record.productionTrafficCutoverApprovedNowTools !== 0) {
    fail(`${label}_traffic_cutover_tools_not_0`)
  }
  if (record.productionReadyNowTools !== 0) fail(`${label}_production_tools_not_0`)
  if (record.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_should_start_not_false`)
  for (const key of trueAcceptedKeys) {
    if (record.booleans?.[key] !== true) fail(`${label}_true_key_not_true:${key}`)
  }
  assertFalseKeys(record, label)
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const packageDiff = git(['diff', '--unified=0', '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:production-traffic-cutover": "tsx server/cli/ai-graphics-production-traffic-cutover.ts",',
  '+    "ai-graphics:production-traffic-cutover:diagnostics": "node scripts/validation/ai-graphics-production-traffic-cutover-diagnostics.mjs",',
  '+    "ai-graphics:production-tool-call-gateway-handoff": "tsx server/cli/ai-graphics-production-tool-call-gateway-handoff.ts",',
  '+    "ai-graphics:production-tool-call-gateway-handoff:diagnostics": "node scripts/validation/ai-graphics-production-tool-call-gateway-handoff-diagnostics.mjs",',
  '+    "ai-graphics:production-worker-queue-admission": "tsx server/cli/ai-graphics-production-worker-queue-admission.ts",',
  '+    "ai-graphics:production-worker-queue-admission:diagnostics": "node scripts/validation/ai-graphics-production-worker-queue-admission-diagnostics.mjs",',
  '+    "ai-graphics:production-service-role-queue-transaction-dry-proof": "tsx server/cli/ai-graphics-production-service-role-queue-transaction-dry-proof.ts",',
  '+    "ai-graphics:production-service-role-queue-transaction-dry-proof:diagnostics": "node scripts/validation/ai-graphics-production-service-role-queue-transaction-dry-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof": "tsx server/cli/ai-graphics-production-controlled-dispatch-authorization-proof.ts",',
  '+    "ai-graphics:production-controlled-dispatch-authorization-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-dispatch-authorization-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-authorization.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-authorization:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-authorization-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof": "tsx server/cli/ai-graphics-production-controlled-worker-runtime-smoke-proof.ts",',
  '+    "ai-graphics:production-controlled-worker-runtime-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-worker-runtime-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof": "tsx server/cli/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof.ts",',
  '+    "ai-graphics:production-controlled-private-artifact-tool-route-handoff-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof-diagnostics.mjs",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof": "tsx server/cli/ai-graphics-production-controlled-per-tool-callable-result-proof.ts",',
  '+    "ai-graphics:production-controlled-per-tool-callable-result-proof:diagnostics": "node scripts/validation/ai-graphics-production-controlled-per-tool-callable-result-proof-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (
    line.startsWith('+++') ||
    line.startsWith('---') ||
    line.startsWith('@@') ||
    line.trim() === ''
  ) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (git(['diff', '--', 'package-lock.json']).trim().length > 0) {
  fail('package_lock_changed')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-production-launch-go-no-go'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-launch-go-no-go.json')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== 'production_launch_go_no_go_contract_prepared') {
  fail(`docs_status:${docs.status}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_caps_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_not_8')
if (docs.counts?.requiredGoNoGoRefs !== 9) fail('docs_required_refs_not_9')
if (docs.counts?.acceptedFixtureApprovedGoNoGoRefs !== 9) {
  fail('docs_accepted_refs_not_9')
}
if (docs.counts?.productionLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 21) {
  fail('docs_approved_tools_not_21')
}
if (docs.counts?.productionTrafficCutoverApprovedNowTools !== 0) {
  fail('docs_cutover_tools_not_0')
}
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_tools_not_0')
if (docs.policy?.privateEvidenceRefsOnly !== true) fail('docs_private_refs_not_true')
if (docs.policy?.approvesProductionTrafficCutoverNow !== false) {
  fail('docs_cutover_not_false')
}
for (const key of [
  'productionLaunchGoNoGoPrepared',
  'sourceProductionLaunchControlsAcceptedWithProvidedEvidence',
  'productionGoNoGoControlsAcceptedWithProvidedEvidence',
  'productionLaunchGoNoGoApprovedWithProvidedEvidence',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'agentCanSelectForPlanning',
  'externalBetaReadyNow',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_key_not_true:${key}`)
}
for (const key of falseKeysAlways) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_key_not_false:${key}`)
}

const markdown = read('docs/tool-intelligence/ai-graphics/production-launch-go-no-go.md')
for (const phrase of [
  'Production go/no-go approved tools with provided evidence: 21',
  'Production traffic cutover approved now: 0 tools',
  'Production ready now: 0 tools',
  'GPU runtime should start now: false',
  'Agent can execute tools now: false',
  'The next gate is explicit production traffic cutover',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}

const defaultReport = runNpm(runScriptName)
if (defaultReport.status !== 'missing_production_launch_controls') {
  fail(`default_status:${defaultReport.status}`)
}
if (defaultReport.productionLaunchGoNoGoApprovedToolsWithProvidedEvidence !== 0) {
  fail('default_approved_tools_not_0')
}
assertFalseKeys(defaultReport, 'default')

const rejectedSourceReport = runNpm(runScriptName, [
  '--production-launch-controls-packet',
  'docs/tool-intelligence/ai-graphics/production-launch-controls.json',
])
if (rejectedSourceReport.status !== 'production_launch_controls_rejected') {
  fail(`rejected_source_status:${rejectedSourceReport.status}`)
}
assertFalseKeys(rejectedSourceReport, 'rejected_source')

const controlsPacket = runNpm(controlsScriptName, privateControlsArgs)
const tempDir = fs.mkdtempSync(`${os.tmpdir()}/ai-graphics-production-go-no-go-`)
const controlsPacketPath = `${tempDir}/production-controls.json`
fs.writeFileSync(controlsPacketPath, JSON.stringify(controlsPacket, null, 2))

const missingGoNoGoReport = runNpm(runScriptName, [
  '--production-launch-controls-packet',
  controlsPacketPath,
])
if (missingGoNoGoReport.status !== 'missing_production_go_no_go_controls') {
  fail(`missing_go_no_go_status:${missingGoNoGoReport.status}`)
}
if (missingGoNoGoReport.sourceProductionLaunchControlsAccepted !== true) {
  fail('missing_go_no_go_source_controls_not_true')
}
assertFalseKeys(missingGoNoGoReport, 'missing_go_no_go')

const acceptedReport = runNpm(runScriptName, [
  '--production-launch-controls-packet',
  controlsPacketPath,
  ...privateGoNoGoArgs,
])
assertAccepted(acceptedReport, 'accepted')

const publicRefArgs = [...privateGoNoGoArgs]
publicRefArgs[1] = 'https://example.com/signed-url/public-artifact'
const publicRefReport = runNpm(runScriptName, [
  '--production-launch-controls-packet',
  controlsPacketPath,
  ...publicRefArgs,
])
fs.rmSync(tempDir, { recursive: true, force: true })
if (publicRefReport.status !== 'missing_production_go_no_go_controls') {
  fail(`public_ref_status:${publicRefReport.status}`)
}
if (publicRefReport.productionGoNoGoControlsAccepted !== false) {
  fail('public_ref_controls_not_false')
}
if (!publicRefReport.rejectionReasons?.some((entry) => entry.includes('productionFinalGoNoGoApprovalRef'))) {
  fail('public_ref_missing_final_go_no_go_reason')
}
assertFalseKeys(publicRefReport, 'public_ref')

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /productionWorkerDispatchApprovedNow["`:\s]+true/i,
  /productionTrafficCutoverApprovedNow["`:\s]+true/i,
  /productionTrafficEnabledNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeShouldStartNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]
const claimText = requiredFiles
  .filter((file) => !file.endsWith('-diagnostics.mjs'))
  .map(read)
  .join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(claimText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['ls-files', '.local-artifacts']).trim()) fail('tracked_local_artifacts')
const changedPaths = [
  ...git(['diff', '--name-only']).split('\n').filter(Boolean),
  ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
]
for (const file of changedPaths) {
  if (/(\.local-artifacts|generated-media|render-output|browser-output|canvas-output|webgl-output|public-artifact)/i.test(file)) {
    fail(`changed_generated_output:${file}`)
  }
  if (/^(dist|build|coverage|playwright-report|test-results)\//.test(file)) {
    fail(`changed_generated_output:${file}`)
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision,
  defaultStatus: defaultReport.status,
  rejectedSourceStatus: rejectedSourceReport.status,
  missingGoNoGoStatus: missingGoNoGoReport.status,
  acceptedStatus: acceptedReport.status,
  publicRefStatus: publicRefReport.status,
  productionLaunchGoNoGoApprovedToolsWithProvidedEvidence:
    acceptedReport.productionLaunchGoNoGoApprovedToolsWithProvidedEvidence,
  productionTrafficCutoverApprovedNow:
    acceptedReport.booleans.productionTrafficCutoverApprovedNow,
  productionReadyNow: acceptedReport.booleans.productionReadyNow,
  gpuRuntimeShouldStartNow: acceptedReport.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
