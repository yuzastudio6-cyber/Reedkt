import childProcess from 'node:child_process'
import fs from 'node:fs'

const decision = 'ai_graphics_production_launch_controls_prepared_with_runtime_blocks'
const missingStatus = 'missing_production_launch_controls'
const acceptedStatus = 'production_launch_controls_accepted_with_runtime_blocks'
const runScriptName = 'ai-graphics:production-launch-controls'
const runScriptCommand = 'tsx server/cli/ai-graphics-production-launch-controls.ts'
const diagnosticScriptName = 'ai-graphics:production-launch-controls:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-launch-controls-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-launch-controls.ts',
  'server/cli/ai-graphics-production-launch-controls.ts',
  'scripts/validation/ai-graphics-production-launch-controls-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-launch-controls.json',
  'docs/tool-intelligence/ai-graphics/production-launch-controls.md',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const privateControlArgs = [
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

const trueKeysWhenAccepted = [
  'productionLaunchControlsPrepared',
  'productionLaunchControlsAccepted',
  'productionOwnerApprovalAccepted',
  'productionSupportRunbookAccepted',
  'productionIncidentResponseAccepted',
  'productionRollbackKillSwitchAccepted',
  'productionCostConcurrencyCeilingAccepted',
  'productionMonitoringAlertingAccepted',
  'productionPostLaunchReviewAccepted',
  'productionCreditLedgerApprovalSnapshotAccepted',
  'productionToolRouteDeploymentAccepted',
  'productionWorkerDeploymentAccepted',
  'productionPrivacyRetentionAccepted',
  'productionPrivateArtifactControlsAccepted',
  'productionCanaryCohortAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'agentCanSelectForPlanning',
]

const falseKeysAlways = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
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

function assertAcceptedControls(record, label) {
  if (record.decision !== decision) fail(`${label}_decision:${record.decision}`)
  if (record.status !== acceptedStatus) fail(`${label}_status:${record.status}`)
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_total_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_capabilities_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_tools_not_8`)
  if (record.requiredControlRefs !== 13) fail(`${label}_required_refs_not_13`)
  if (record.acceptedControlRefs !== 13) fail(`${label}_accepted_refs_not_13`)
  if (record.missingLaunchControls?.length !== 0) fail(`${label}_missing_controls_not_empty`)
  if (record.approverRole !== 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER') {
    fail(`${label}_approver_role:${record.approverRole}`)
  }
  for (const key of trueKeysWhenAccepted) {
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
  '+    "ai-graphics:production-launch-go-no-go": "tsx server/cli/ai-graphics-production-launch-go-no-go.ts",',
  '+    "ai-graphics:production-launch-go-no-go:diagnostics": "node scripts/validation/ai-graphics-production-launch-go-no-go-diagnostics.mjs",',
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
if (!indexTs.includes("export * from './ai-graphics-production-launch-controls'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-launch-controls.json')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== 'production_launch_controls_contract_prepared') {
  fail(`docs_status:${docs.status}`)
}
if (docs.counts?.totalAiGraphicsTools !== 21) fail('docs_total_tools_not_21')
if (docs.counts?.totalProductFacingCapabilities !== 12) fail('docs_capabilities_not_12')
if (docs.counts?.gpuRuntimeTargetedTools !== 8) fail('docs_gpu_tools_not_8')
if (docs.counts?.requiredControlRefs !== 13) fail('docs_required_refs_not_13')
if (docs.counts?.defaultAcceptedControlRefs !== 0) fail('docs_default_refs_not_0')
if (docs.counts?.acceptedFixtureControlRefs !== 13) fail('docs_accepted_refs_not_13')
if (docs.policy?.privateEvidenceRefsOnly !== true) fail('docs_private_refs_only_not_true')
if (docs.policy?.onDemandGpuOnly !== true) fail('docs_on_demand_gpu_not_true')
if (docs.policy?.approvesRuntimeNow !== false) fail('docs_runtime_approval_not_false')
if (docs.policy?.approvesProductionNow !== false) fail('docs_production_approval_not_false')
for (const key of falseKeysAlways) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_key_not_false:${key}`)
}

const markdown = read('docs/tool-intelligence/ai-graphics/production-launch-controls.md')
for (const phrase of [
  'private://',
  'backend://',
  'production-evidence://',
  'HTTP, HTTPS, GCS, S3, signed URL, public artifact, and public-path references',
  'are rejected by the controls evaluator',
  'Accepted private-evidence control refs: 13',
  'Agent can execute tools now: false',
  'GPU runtime should start now: false',
  'Production ready now: false',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}

const defaultReport = runNpm(runScriptName)
if (defaultReport.status !== missingStatus) fail(`default_status:${defaultReport.status}`)
if (defaultReport.acceptedControlRefs !== 0) fail('default_accepted_refs_not_0')
if (defaultReport.missingLaunchControls?.length !== 13) fail('default_missing_controls_not_13')
if (defaultReport.booleans?.productionLaunchControlsAccepted !== false) {
  fail('default_controls_accepted_not_false')
}
assertFalseKeys(defaultReport, 'default')

const acceptedReport = runNpm(runScriptName, privateControlArgs)
assertAcceptedControls(acceptedReport, 'accepted')

const publicRefArgs = [...privateControlArgs]
publicRefArgs[1] = 'https://example.com/signed-url/public-artifact'
const publicRefReport = runNpm(runScriptName, publicRefArgs)
if (publicRefReport.status !== missingStatus) fail(`public_ref_status:${publicRefReport.status}`)
if (publicRefReport.acceptedControlRefs !== 12) fail('public_ref_accepted_refs_not_12')
if (publicRefReport.booleans?.productionLaunchControlsAccepted !== false) {
  fail('public_ref_controls_accepted_not_false')
}
if (!publicRefReport.missingLaunchControls?.some((entry) => entry.includes('productionOwnerApprovalRef'))) {
  fail('public_ref_missing_owner_reason')
}
assertFalseKeys(publicRefReport, 'public_ref')

const forbiddenPatterns = [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /workerQueueApprovedNow["`:\s]+true/i,
  /productionWorkerDispatchApprovedNow["`:\s]+true/i,
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
const claimFiles = requiredFiles.filter((file) => !file.endsWith('-diagnostics.mjs'))
const claimText = claimFiles.map(read).join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(claimText)) fail(`forbidden_claim:${pattern}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts']).trim()
if (trackedLocalArtifacts.length > 0) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)
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
  acceptedStatus: acceptedReport.status,
  publicRefStatus: publicRefReport.status,
  acceptedControlRefs: acceptedReport.acceptedControlRefs,
  productionReadyNow: acceptedReport.booleans.productionReadyNow,
  gpuRuntimeShouldStartNow: acceptedReport.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
