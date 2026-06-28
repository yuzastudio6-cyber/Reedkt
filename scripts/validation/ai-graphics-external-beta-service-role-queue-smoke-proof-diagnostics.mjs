import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const toolRouteRuntimeProofScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof'
const toolRouteRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-tool-route-runtime-proof.ts'
const toolRouteRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-tool-route-runtime-proof:diagnostics'
const toolRouteRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-tool-route-runtime-proof-diagnostics.mjs'
const perToolRuntimeProofScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof'
const perToolRuntimeProofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-per-tool-runtime-proof.ts'
const perToolRuntimeProofDiagnosticScriptName =
  'ai-graphics:external-beta-per-tool-runtime-proof:diagnostics'
const perToolRuntimeProofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-per-tool-runtime-proof-diagnostics.mjs'
const nativeGpuProofCollectionScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection'
const nativeGpuProofCollectionScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-native-gpu-proof-collection.ts'
const nativeGpuProofCollectionDiagnosticScriptName =
  'ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
const nativeGpuProofCollectionDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-native-gpu-proof-collection-diagnostics.mjs'
const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const proofScriptName = 'ai-graphics:external-beta-service-role-queue-smoke-proof'
const proofScriptCommand =
  'tsx server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts'
const proofDiagnosticScriptName =
  'ai-graphics:external-beta-service-role-queue-smoke-proof:diagnostics'
const proofDiagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-service-role-queue-smoke-proof-diagnostics.mjs'

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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'serviceRoleQueueSmokeApprovedNow',
  'liveServiceRoleQueueSmokeExecutedNow',
  'liveQueueWriteApprovedNow',
  'liveWorkerClaimInsertApprovedNow',
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
  'serviceRoleQueueSmokePerformed',
  'supabaseMutationPerformed',
  'workerLeaseCreated',
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
  return execFileSync('npm', ['run', '--silent', scriptName, ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeTempJson(root, name, value) {
  const filePath = path.join(root, name)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
  return filePath
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-proof.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts',
  'server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.md',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json',
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json',
  'docs/production-beta-readiness-scorecard.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.md')
const source = read('server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-proof.ts')
const cli = read('server/cli/ai-graphics-external-beta-service-role-queue-smoke-proof.ts')
const smokeCli = read('server/cli/ai-graphics-external-beta-service-role-queue-smoke.ts')
const index = read('server/tool-registry/index.ts')

if (pkg.scripts?.[proofScriptName] !== proofScriptCommand) fail(`missing_package_script:${proofScriptName}`)
if (pkg.scripts?.[proofDiagnosticScriptName] !== proofDiagnosticScriptCommand) {
  fail(`missing_package_script:${proofDiagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-service-role-queue-smoke-proof'")) {
  fail('missing_tool_registry_export')
}
if (docs.decision !== 'ai_graphics_external_beta_service_role_queue_smoke_proof_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}

for (const phrase of [
  'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
  'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution',
  '--external-beta-service-role-queue-smoke-result',
  '--external-beta-service-role-queue-smoke-readiness-packet',
  '--external-beta-service-role-queue-smoke-evidence-ref',
  '--external-beta-service-role-queue-smoke-telemetry-ref',
  '--external-beta-service-role-queue-smoke-cleanup-proof-ref',
  'toolsSubmittedIds',
  'fixtureRowsPersistedAfterCleanup',
  'noWorkerDispatchByProofValidator',
  'noGpuRuntimeStartByProofValidator',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase) && !smokeCli.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
}
for (const tool of gpuTools) {
  if (!docs.gpuTools?.includes(tool)) fail(`docs_missing_gpu_tool:${tool}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_false_gate_not_false:${key}`)
}
if (docs.acceptanceCriteria?.toolsSubmitted !== 21) fail('docs_tools_submitted_not_21')
if (docs.acceptanceCriteria?.jobIdsReturned !== 21) fail('docs_jobs_not_21')
if (docs.acceptanceCriteria?.workerClaimsReturned !== 21) fail('docs_claims_not_21')
if (docs.acceptanceCriteria?.fixtureRowsPersistedAfterCleanup !== 0) fail('docs_cleanup_not_0')

const missingOutput = parseOutput(runNpm(proofScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_service_role_queue_smoke_result') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-smoke-proof-'))
try {
  const readiness = {
    decision: 'external_beta_service_role_queue_smoke_prepared_not_executed',
    serviceRoleQueueSmokePreparedWithProvidedEvidence: true,
    sourceExternalBetaRuntimeQueueServiceBridgeAccepted: true,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    booleans: {
      agentCanExecuteToolsNow: false,
      workerDispatchPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
  const smokeResult = {
    ok: true,
    decision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup',
    status: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution',
    toolsSubmitted: 21,
    toolsSubmittedIds: allTools,
    jobIdsReturned: 21,
    workerClaimsReturned: 21,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveServiceRoleQueueSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: 21,
    liveWorkerClaimRowsNow: 21,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    fixtureRowsPersistedAfterCleanup: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
  const readinessPath = writeTempJson(tmpRoot, 'readiness.json', readiness)
  const resultPath = writeTempJson(tmpRoot, 'smoke-result.json', smokeResult)
  const accepted = parseOutput(runNpm(proofScriptName, [
    '--',
    '--external-beta-service-role-queue-smoke-readiness-packet',
    readinessPath,
    '--external-beta-service-role-queue-smoke-result',
    resultPath,
    '--external-beta-service-role-queue-smoke-evidence-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/evidence.json',
    '--external-beta-service-role-queue-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/telemetry.json',
    '--external-beta-service-role-queue-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/cleanup.json',
  ]), 'accepted')
  if (accepted.decision !== 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.counts?.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence !== 21) {
    fail('accepted_tools_not_21')
  }
  if (accepted.counts?.sourceLiveQueueWritesAcceptedWithProvidedEvidence !== 21) {
    fail('accepted_queue_writes_not_21')
  }
  if (accepted.counts?.sourceWorkerClaimRowsAcceptedWithProvidedEvidence !== 21) {
    fail('accepted_claims_not_21')
  }
  if (accepted.counts?.sourceWorkerDispatchesAcceptedWithProvidedEvidence !== 0) {
    fail('accepted_dispatches_not_0')
  }
  if (accepted.counts?.sourceToolExecutionsAcceptedWithProvidedEvidence !== 0) {
    fail('accepted_tool_exec_not_0')
  }
  if (accepted.evidence?.sourceLiveServiceRoleQueueSmokeExecutedWithProvidedEvidence !== true) {
    fail('accepted_source_live_smoke_not_true')
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const badResultPath = writeTempJson(tmpRoot, 'bad-smoke-result.json', {
    ...smokeResult,
    toolsSubmitted: 20,
    toolsSubmittedIds: allTools.slice(1),
  })
  const rejected = parseOutput(runNpm(proofScriptName, [
    '--',
    '--external-beta-service-role-queue-smoke-readiness-packet',
    readinessPath,
    '--external-beta-service-role-queue-smoke-result',
    badResultPath,
    '--external-beta-service-role-queue-smoke-evidence-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/evidence.json',
    '--external-beta-service-role-queue-smoke-telemetry-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/telemetry.json',
    '--external-beta-service-role-queue-smoke-cleanup-proof-ref',
    'private://ai-graphics/external-beta/service-role-queue-smoke/cleanup.json',
  ]), 'rejected')
  if (rejected.decision !== 'external_beta_service_role_queue_smoke_proof_rejected') {
    fail(`rejected_decision:${rejected.decision}`)
  }
  if (!JSON.stringify(rejected.rejectionReasons ?? []).includes('21 tools')) {
    fail('rejected_missing_21_tool_reason')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const combinedDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /serviceRoleQueueSmokeApprovedNow["'`\s:]*true/i,
  /liveServiceRoleQueueSmokeExecutedNow["'`\s:]*true/i,
  /workerDispatchPerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
]) {
  if (pattern.test(combinedDocs)) fail(`forbidden_docs_claim:${pattern}`)
}

if (git(['diff', '--', 'package-lock.json'])) fail('package_lock_changed')
let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch {
  basePackage = {}
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-operator-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-job-scaffold-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector": "node --experimental-strip-types server/cli/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector-diagnostics.mjs",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff": "tsx server/cli/ai-graphics-external-beta-native-gpu-proof-operator-handoff.ts",`,
  `+    "ai-graphics:external-beta-native-gpu-proof-operator-handoff:diagnostics": "node scripts/validation/ai-graphics-external-beta-native-gpu-proof-operator-handoff-diagnostics.mjs",`,
  `+    "${perToolRuntimeProofScriptName}": "${perToolRuntimeProofScriptCommand}",`,
  `+    "${perToolRuntimeProofDiagnosticScriptName}": "${perToolRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${nativeGpuProofCollectionScriptName}": "${nativeGpuProofCollectionScriptCommand}",`,
  `+    "${nativeGpuProofCollectionDiagnosticScriptName}": "${nativeGpuProofCollectionDiagnosticScriptCommand}",`,
  `+    "${toolRouteRuntimeProofScriptName}": "${toolRouteRuntimeProofScriptCommand}",`,
  `+    "${toolRouteRuntimeProofDiagnosticScriptName}": "${toolRouteRuntimeProofDiagnosticScriptCommand}",`,
  `+    "${proofScriptName}": "${proofScriptCommand}",`,
  `+    "${proofDiagnosticScriptName}": "${proofDiagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-worker-dispatch-readiness": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-readiness.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-readiness:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-readiness-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof": "tsx server/cli/ai-graphics-external-beta-worker-dispatch-smoke-proof.ts",',
  '+    "ai-graphics:external-beta-worker-dispatch-smoke-proof:diagnostics": "node scripts/validation/ai-graphics-external-beta-worker-dispatch-smoke-proof-diagnostics.mjs",',
  '+    "ai-graphics:external-beta-private-artifact-manifest": "tsx server/cli/ai-graphics-external-beta-private-artifact-manifest.ts",',
  '+    "ai-graphics:external-beta-private-artifact-manifest:diagnostics": "node scripts/validation/ai-graphics-external-beta-private-artifact-manifest-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}
const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  acceptedDecision: 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
  toolsCovered: allTools.length,
  gpuToolsCovered: gpuTools.length,
  sourceLiveQueueWritesAcceptedWithProvidedEvidence: 21,
  sourceWorkerClaimRowsAcceptedWithProvidedEvidence: 21,
  cleanupPersistedRowsAfterSmoke: 0,
  liveSupabaseWriteByValidator: false,
  workerDispatchByValidator: false,
  toolExecutionByValidator: false,
  gpuRuntimeStartByValidator: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  agentCanExecuteToolsNow: false,
}, null, 2))
