import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_production_launch_readiness_gap_prepared_external_beta_ready_production_blocked'
const acceptedStatus = 'production_launch_blocked_pending_production_controls'
const runScriptName = 'ai-graphics:production-launch-readiness-gap'
const runScriptCommand = 'tsx server/cli/ai-graphics-production-launch-readiness-gap.ts'
const diagnosticScriptName = 'ai-graphics:production-launch-readiness-gap:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-production-launch-readiness-gap-diagnostics.mjs'

const requiredFiles = [
  'server/tool-registry/ai-graphics-production-launch-readiness-gap.ts',
  'server/cli/ai-graphics-production-launch-readiness-gap.ts',
  'scripts/validation/ai-graphics-production-launch-readiness-gap-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/production-launch-readiness-gap.json',
  'docs/tool-intelligence/ai-graphics/production-launch-readiness-gap.md',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
  'server/tool-registry/index.ts',
]

const trueKeys = [
  'productionLaunchReadinessGapPrepared',
  'sourceExternalBetaActivatedLaunchReadinessAccepted',
  'sourceBetaProductionReadinessRollupAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all8GpuToolsTargetGpuRuntime',
  'all21ExternalBetaReadyForControlledOnDemandToolCalls',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
  'externalBetaReadyNow',
]

const falseKeys = [
  'productionLaunchControlsAccepted',
  'productionSupportRunbookAccepted',
  'productionIncidentRollbackAccepted',
  'productionCostConcurrencyAccepted',
  'productionMonitoringAccepted',
  'productionCreditLedgerAccepted',
  'productionRouteWorkerDeploymentAccepted',
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

function runNpm(scriptName, args = []) {
  const output = childProcess.execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
  return JSON.parse(output)
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    maxBuffer: 32 * 1024 * 1024,
  })
}

function assertCounts(record, label, externalBetaReadyTools) {
  if (record.totalAiGraphicsTools !== 21) fail(`${label}_total_tools_not_21`)
  if (record.totalProductFacingCapabilities !== 12) fail(`${label}_capabilities_not_12`)
  if (record.gpuRuntimeTargetedTools !== 8) fail(`${label}_gpu_tools_not_8`)
  if (record.externalBetaReadyNowTools !== externalBetaReadyTools) {
    fail(`${label}_external_beta_ready_tools_${record.externalBetaReadyNowTools}`)
  }
  if (record.productionReadyNowTools !== 0) fail(`${label}_production_ready_tools_not_0`)
  if (record.gpuRuntimeShouldStartNow !== false) fail(`${label}_gpu_should_start_not_false`)
}

function assertBooleanMap(record, label, expectedReady) {
  const booleans = record.booleans ?? {}
  if (booleans.externalBetaReadyNow !== expectedReady) {
    fail(`${label}_external_beta_ready_now_${booleans.externalBetaReadyNow}`)
  }
  if (booleans.all21ExternalBetaReadyForControlledOnDemandToolCalls !== expectedReady) {
    fail(`${label}_all21_external_beta_ready_${booleans.all21ExternalBetaReadyForControlledOnDemandToolCalls}`)
  }
  if (expectedReady) {
    for (const key of trueKeys) {
      if (booleans[key] !== true) fail(`${label}_true_key_not_true:${key}`)
    }
  }
  for (const key of falseKeys) {
    if (booleans[key] !== false && record.input?.[key] !== false) {
      fail(`${label}_false_key_not_false:${key}`)
    }
  }
}

for (const file of requiredFiles) read(file)

const packageJson = json('package.json')
if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
  fail('package_run_script_mismatch')
}
if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail('package_diagnostic_script_mismatch')
}

const indexTs = read('server/tool-registry/index.ts')
if (!indexTs.includes("export * from './ai-graphics-production-launch-readiness-gap'")) {
  fail('missing_registry_export')
}

const docs = json('docs/tool-intelligence/ai-graphics/production-launch-readiness-gap.json')
if (docs.decision !== decision) fail('docs_decision_mismatch')
if (docs.status !== acceptedStatus) fail(`docs_status:${docs.status}`)
if (docs.counts?.externalBetaReadyNowTools !== 21) fail('docs_external_beta_ready_tools_not_21')
if (docs.counts?.productionReadyNowTools !== 0) fail('docs_production_ready_tools_not_0')
for (const blocker of [
  'separate production launch owner approval',
  'production support and incident-response runbook',
  'production rollback and kill-switch plan',
  'production cost and concurrency ceilings',
  'production monitoring, alerting, and post-launch review',
  'production credit ledger and approval snapshot enforcement',
  'production Tool Route and Worker deployment acceptance',
  'production privacy, retention, and private artifact controls',
]) {
  if (!docs.productionLaunchBlockers?.includes(blocker)) fail(`docs_missing_blocker:${blocker}`)
}
for (const key of trueKeys) {
  if (docs.booleans?.[key] !== true) fail(`docs_true_key_not_true:${key}`)
}
for (const key of falseKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_key_not_false:${key}`)
}

const markdown = read('docs/tool-intelligence/ai-graphics/production-launch-readiness-gap.md')
for (const phrase of [
  'External-beta ready now: 21 tools',
  'Production ready now: 0 tools',
  'GPU runtime should start now: false',
  'separate production launch owner approval',
]) {
  if (!markdown.includes(phrase)) fail(`markdown_missing:${phrase}`)
}

const defaultReport = runNpm(runScriptName)
if (defaultReport.status !== 'missing_external_beta_activated_launch_readiness') {
  fail(`default_status:${defaultReport.status}`)
}
assertCounts(defaultReport, 'default', 0)
assertBooleanMap(defaultReport, 'default', false)

const activatedOnlyReport = runNpm(runScriptName, [
  '--external-beta-activated-launch-readiness-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
])
if (activatedOnlyReport.status !== 'missing_beta_production_readiness_rollup') {
  fail(`activated_only_status:${activatedOnlyReport.status}`)
}
assertCounts(activatedOnlyReport, 'activated_only', 0)
assertBooleanMap(activatedOnlyReport, 'activated_only', false)

const acceptedReport = runNpm(runScriptName, [
  '--external-beta-activated-launch-readiness-packet',
  'docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json',
  '--beta-production-readiness-rollup-packet',
  'docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json',
])
if (acceptedReport.status !== acceptedStatus) fail(`accepted_status:${acceptedReport.status}`)
assertCounts(acceptedReport, 'accepted', 21)
assertBooleanMap(acceptedReport, 'accepted', true)

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
const claimText = requiredFiles
  .filter((file) => !file.endsWith('-diagnostics.mjs'))
  .map(read)
  .join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(claimText)) fail(`forbidden_claim:${pattern}`)
}

if (git(['diff', '--name-only', '--', 'package-lock.json']).trim()) {
  fail('package_lock_changed')
}
if (git(['ls-files', '.local-artifacts']).trim()) {
  fail('tracked_local_artifacts')
}
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const file of stagedFiles) {
  if (/(\.local-artifacts|generated-media|render-output|browser-output|canvas-output|webgl-output|public-artifact)/i.test(file)) {
    fail(`staged_generated_output:${file}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision,
  defaultStatus: defaultReport.status,
  acceptedStatus: acceptedReport.status,
  totalAiGraphicsTools: acceptedReport.totalAiGraphicsTools,
  gpuRuntimeTargetedTools: acceptedReport.gpuRuntimeTargetedTools,
  externalBetaReadyNowTools: acceptedReport.externalBetaReadyNowTools,
  productionReadyNowTools: acceptedReport.productionReadyNowTools,
  gpuRuntimeShouldStartNow: acceptedReport.gpuRuntimeShouldStartNow,
  agentCanExecuteToolsNow: acceptedReport.booleans.agentCanExecuteToolsNow,
  productionReadyNow: acceptedReport.booleans.productionReadyNow,
}, null, 2))
