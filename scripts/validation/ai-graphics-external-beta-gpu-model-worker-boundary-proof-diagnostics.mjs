import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const runScriptName =
  'ai-graphics:external-beta-gpu-model-worker-boundary-proof'
const runScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-gpu-model-worker-boundary-proof.ts'
const diagnosticScriptName =
  'ai-graphics:external-beta-gpu-model-worker-boundary-proof:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-gpu-model-worker-boundary-proof-diagnostics.mjs'
const decision =
  'ai_graphics_external_beta_gpu_model_worker_boundary_proof_passed_with_existing_worker_path'
const status =
  'gpu_model_route_admission_bound_to_existing_runtime_queue_and_mock_worker_dispatch'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'

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

const requiredFiles = [
  'server/cli/ai-graphics-external-beta-gpu-model-worker-boundary-proof.ts',
  'scripts/validation/ai-graphics-external-beta-gpu-model-worker-boundary-proof-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json',
  'server/services/ai-graphics-tool-runtime-queue-service.ts',
  'server/workers/production/production-worker-dispatcher.ts',
  'server/workers/production/production-worker-router.ts',
  'docs/production-beta-readiness-scorecard.md',
  'package.json',
]

const falseBooleanKeys = [
  'agentCanExecuteGpuModelToolsNow',
  'agentCanExecuteAll21ToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'backendQueueSubmissionApprovedNow',
  'liveQueueWriteApprovedNow',
  'liveWorkerClaimApprovedNow',
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
  'routeExecutionPerformed',
  'workerExecutionPerformed',
  'workerDispatchPerformed',
  'toolExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'modelInferencePerformed',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const forbiddenDocPatterns = [
  /agentCanExecuteGpuModelToolsNow[`":\s=]+true/i,
  /agentCanExecuteAll21ToolsNow[`":\s=]+true/i,
  /workerExecutionApprovedNow[`":\s=]+true/i,
  /toolExecutionApprovedNow[`":\s=]+true/i,
  /gpuRuntimeApprovedNow[`":\s=]+true/i,
  /gpuRuntimeShouldStartNow[`":\s=]+true/i,
  /runtimeReadyNow[`":\s=]+true/i,
  /externalBetaReadyNow[`":\s=]+true/i,
  /productionReadyNow[`":\s=]+true/i,
  /modelWeightsDownloaded[`":\s=]+true/i,
  /modelWeightsLoaded[`":\s=]+true/i,
  /modelInferencePerformed[`":\s=]+true/i,
  /supabaseMutationPerformed[`":\s=]+true/i,
  /gcsUploadPerformed[`":\s=]+true/i,
  /publicArtifactCreated[`":\s=]+true/i,
  /signedUrlCreated[`":\s=]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]

const generatedArtifactPattern =
  /(^|\/)(\.local-artifacts|generated-media|render-output|renders|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)|\.(mp4|mov|webm|png|jpe?g|gif|webp|avif|pdf)$/i

const failures = []

function fail(message) {
  failures.push(message)
}

function absolute(file) {
  return path.join(root, file)
}

function read(file) {
  const filePath = absolute(file)
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

function exec(name, args) {
  return execFileSync(name, args, {
    cwd: root,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
  })
}

function git(args) {
  return exec('git', args).trim()
}

function runNpm(scriptName) {
  return exec('npm', ['run', '--silent', scriptName])
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function checkReport(label, report) {
  if (report.decision !== decision) fail(`${label}_decision_mismatch`)
  if (report.status !== status) fail(`${label}_status_mismatch`)
  if (report.sourceGpuModelAdmissionSmokeAccepted !== true) {
    fail(`${label}_source_admission_not_accepted`)
  }
  if (report.newGpuWorkerCreated !== false) {
    fail(`${label}_new_gpu_worker_created_not_false`)
  }
  if (report.existingWorkerBoundaryUsed !== 'ai_graphics_runtime_queue_service_and_production_worker_dispatcher') {
    fail(`${label}_existing_worker_boundary_mismatch`)
  }

  const records = Array.isArray(report.records) ? report.records : []
  if (records.length !== 8) fail(`${label}_record_count_mismatch:${records.length}`)
  const seen = new Set(records.map((record) => record.toolId))
  for (const tool of gpuModelTools) {
    if (!seen.has(tool)) fail(`${label}_missing_gpu_model_tool:${tool}`)
  }
  if (seen.size !== 8) fail(`${label}_unexpected_tool_count:${seen.size}`)

  for (const record of records) {
    if (record.workerType !== 'gpu_ai_worker') fail(`${label}_${record.toolId}_worker_type_mismatch`)
    if (!String(record.runtimeTarget ?? '').includes('native_linux_amd64_nvidia_l4')) {
      fail(`${label}_${record.toolId}_runtime_target_not_gpu`)
    }
    if (record.existingRuntimeQueueServiceUsed !== true) {
      fail(`${label}_${record.toolId}_existing_queue_service_not_used`)
    }
    if (record.runtimeQueueServiceMockOnly !== true) {
      fail(`${label}_${record.toolId}_queue_not_mock_only`)
    }
    if (record.mockWorkerClaimReturned !== true) {
      fail(`${label}_${record.toolId}_mock_claim_missing`)
    }
    if (record.mockWorkerEventRecorded !== true) {
      fail(`${label}_${record.toolId}_mock_event_missing`)
    }
    if (record.mockAuditEventRecorded !== true) {
      fail(`${label}_${record.toolId}_mock_audit_missing`)
    }
    if (record.dispatcherStatus !== 'completed') {
      fail(`${label}_${record.toolId}_dispatcher_not_completed`)
    }
    if (record.dispatcherFutureHandler !== 'ai_graphics_gpu_model_tool_call_handoff') {
      fail(`${label}_${record.toolId}_dispatcher_handler_mismatch`)
    }
    if (record.dispatcherMockOnlyRoute !== true) {
      fail(`${label}_${record.toolId}_dispatcher_not_mock_only`)
    }
    if (record.dispatcherAiGraphicsGpuHandoffRoute !== true) {
      fail(`${label}_${record.toolId}_dispatcher_handoff_missing`)
    }
    if (record.dispatcherHardGateBlockCount !== 0) {
      fail(`${label}_${record.toolId}_hard_gate_blocks`)
    }
    if (record.inMemoryDispatcherLeaseCreated !== true) {
      fail(`${label}_${record.toolId}_lease_not_created`)
    }
    if (record.inMemoryDispatcherLeaseReleased !== true) {
      fail(`${label}_${record.toolId}_lease_not_released`)
    }
    for (const [key, expected] of [
      ['toolRunResultsCreated', 0],
      ['artifactRecordsCreated', 0],
      ['qualityGateResultsCreated', 0],
    ]) {
      if (record[key] !== expected) fail(`${label}_${record.toolId}_${key}_mismatch`)
    }
    for (const key of [
      'gpuRuntimeShouldStartNow',
      'workerDispatchPerformedNow',
      'toolExecutionPerformedNow',
      'modelWeightsLoadedNow',
      'publicArtifactCreatedNow',
      'signedUrlCreatedNow',
    ]) {
      if (record[key] !== false) fail(`${label}_${record.toolId}_${key}_not_false`)
    }
  }

  const counts = report.counts ?? {}
  const expectedCounts = {
    totalAiGraphicsTools: 21,
    gpuModelToolsCovered: 8,
    sourceGpuModelAdmissionReadyWithProvidedRefsTools: 8,
    existingRuntimeQueueServiceBatchesCreated: 1,
    existingRuntimeQueueServiceJobsCreated: 8,
    mockWorkerClaimsReturned: 8,
    mockWorkerEventsRecorded: 8,
    mockAuditEventsRecorded: 8,
    mockProductionWorkerDispatcherDryRunJobsCompleted: 8,
    inMemoryDispatcherLeasesCreated: 8,
    inMemoryDispatcherLeasesReleased: 8,
    dispatcherHardGateBlockCount: 0,
    liveSupabaseQueueWritesNow: 0,
    liveWorkerClaimRowsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNowTools: 0,
    modelWeightsLoadedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (counts[key] !== expected) fail(`${label}_count_${key}_expected_${expected}_got_${counts[key]}`)
  }

  const booleans = report.booleans ?? {}
  for (const key of [
    'gpuModelWorkerBoundaryProofPassed',
    'sourceGpuModelAdmissionSmokeAccepted',
    'all8GpuModelToolsAcceptedPrivateProofRefsForAdmission',
    'all8GpuModelToolsUseExistingRuntimeQueueService',
    'usesExistingAiGraphicsRuntimeQueueService',
    'usesExistingProductionWorkerDispatcher',
    'mockRuntimeQueueJobsCreatedForAll8',
    'mockWorkerClaimsCreatedForAll8',
    'mockWorkerEventsRecordedForAll8',
    'mockAuditEventsRecordedForAll8',
    'existingProductionWorkerDispatcherDryRunAcceptedAll8',
    'allDispatcherRoutesAiGraphicsGpuHandoff',
    'noHardGateFailures',
    'allInMemoryDispatcherLeasesCreated',
    'allInMemoryDispatcherLeasesReleased',
    'allToolRunResultsEmpty',
    'allArtifactRecordsEmpty',
    'allQualityGateResultsEmpty',
    'gpuRuntimeOnDemandOnly',
    'noIdleGpuRuntimeApproved',
    'gpuStartsOnlyForApprovedWorkerOrToolCall',
    'allGpuModelJobsCarryGpuStartAllowedAfterAcceptedWorkerJob',
    'agentCanSelectForPlanning',
  ]) {
    if (booleans[key] !== true) fail(`${label}_boolean_${key}_not_true`)
  }
  for (const key of falseBooleanKeys) {
    if (booleans[key] !== false) fail(`${label}_boolean_${key}_not_false`)
  }
  if (booleans.newGpuWorkerCreated !== false) {
    fail(`${label}_new_gpu_worker_created_boolean_not_false`)
  }
}

function checkPackageScripts() {
  const packageJson = json('package.json')
  if (packageJson.scripts?.[runScriptName] !== runScriptCommand) {
    fail('run_script_missing_or_mismatch')
  }
  if (packageJson.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
    fail('diagnostic_script_missing_or_mismatch')
  }
}

function checkDependencySectionsUnchanged() {
  let base = null
  try {
    base = JSON.parse(exec('git', ['show', `${baseRef}:package.json`]))
  } catch (error) {
    fail(`base_package_json_unavailable:${error.message}`)
    return
  }
  const current = json('package.json')
  for (const key of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    const baseSection = JSON.stringify(base[key] ?? {}, Object.keys(base[key] ?? {}).sort())
    const currentSection = JSON.stringify(current[key] ?? {}, Object.keys(current[key] ?? {}).sort())
    if (baseSection !== currentSection) fail(`dependency_section_changed:${key}`)
  }
}

function checkNoGeneratedArtifactsTracked() {
  const changed = new Set([
    ...git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean),
    ...git(['diff', '--name-only']).split('\n').filter(Boolean),
    ...git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean),
    ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
  ])
  for (const file of changed) {
    if (generatedArtifactPattern.test(file)) fail(`generated_artifact_changed:${file}`)
  }
  const localArtifacts = git(['ls-files', '.local-artifacts'])
  if (localArtifacts.trim()) fail(`local_artifacts_tracked:${localArtifacts}`)
}

function checkPackageLockUnchanged() {
  const unstaged = git(['diff', '--', 'package-lock.json'])
  const staged = git(['diff', '--cached', '--', 'package-lock.json'])
  if (unstaged.trim() || staged.trim()) fail('package_lock_changed')
}

function checkSourceUsesExistingBoundary() {
  const source = read('server/cli/ai-graphics-external-beta-gpu-model-worker-boundary-proof.ts')
  for (const needle of [
    'createAiGraphicsToolRuntimeQueueService',
    'claimToolRuntimeJob',
    'recordWorkerEvent',
    'recordAuditEvent',
    'dispatchProductionWorkerJob',
    'createProductionWorkerRuntimeState',
    'newGpuWorkerCreated: false',
    'gpuRuntimeShouldStartNow: false',
  ]) {
    if (!source.includes(needle)) fail(`source_missing:${needle}`)
  }
}

for (const file of requiredFiles) read(file)
checkPackageScripts()
checkDependencySectionsUnchanged()
checkSourceUsesExistingBoundary()

const liveOutput = runNpm(runScriptName)
const liveReport = parseJsonOutput(liveOutput, 'live')
const docsReport = json('docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json')
checkReport('live', liveReport)
checkReport('docs', docsReport)

const md = read('docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.md')
const scorecard = read('docs/production-beta-readiness-scorecard.md')
for (const needle of [
  decision,
  'existing AI graphics runtime queue service',
  'production worker dispatcher',
  'New GPU worker created',
  'GPU runtime should start now tools',
]) {
  if (!md.includes(needle) && !scorecard.includes(needle)) {
    fail(`missing_doc_needle:${needle}`)
  }
}
for (const pattern of forbiddenDocPatterns) {
  if (pattern.test(md)) fail(`forbidden_claim_in_md:${pattern}`)
  if (pattern.test(JSON.stringify(docsReport))) fail(`forbidden_claim_in_json:${pattern}`)
}

checkPackageLockUnchanged()
checkNoGeneratedArtifactsTracked()

if (failures.length > 0) {
  console.error('AI graphics external beta GPU/model worker boundary proof diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics external beta GPU/model worker boundary proof diagnostics passed.')
console.log(JSON.stringify({
  decision,
  status,
  toolsCovered: docsReport.counts?.gpuModelToolsCovered,
  sourceGpuModelAdmissionReadyWithProvidedRefsTools:
    docsReport.counts?.sourceGpuModelAdmissionReadyWithProvidedRefsTools,
  mockRuntimeQueueJobsCreated:
    docsReport.counts?.existingRuntimeQueueServiceJobsCreated,
  mockWorkerClaimsReturned: docsReport.counts?.mockWorkerClaimsReturned,
  dispatcherDryRunJobsCompleted:
    docsReport.counts?.mockProductionWorkerDispatcherDryRunJobsCompleted,
  usesExistingAiGraphicsRuntimeQueueService:
    docsReport.booleans?.usesExistingAiGraphicsRuntimeQueueService,
  usesExistingProductionWorkerDispatcher:
    docsReport.booleans?.usesExistingProductionWorkerDispatcher,
  newGpuWorkerCreated: docsReport.booleans?.newGpuWorkerCreated,
  gpuRuntimeShouldStartNow: docsReport.booleans?.gpuRuntimeShouldStartNow,
  agentCanExecuteGpuModelToolsNow:
    docsReport.booleans?.agentCanExecuteGpuModelToolsNow,
  packageLockUnchanged: true,
}, null, 2))
