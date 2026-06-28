import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const runScriptName = 'ai-graphics:external-beta-cpu-static-cohort-admission'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-cpu-static-cohort-admission:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-cpu-static-cohort-admission-diagnostics.mjs'

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

const cpuStaticTools = [
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

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
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
  return execFileSync('npm', ['run', '--silent', scriptName, '--', ...args], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output)
  } catch (error) {
    fail(`invalid_json_output:${label}:${error.message}`)
    return {}
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function perToolRuntimeProofFixture(overrides = {}) {
  return {
    decision: 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks',
    sourceDecision: 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks',
    sourceToolRouteRuntimeProofAccepted: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    runtimeProofRecordsPrepared: 21,
    runtimeProofAcceptedWithProvidedEvidenceTools: 13,
    jsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
    nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
    blockedPendingNativeGpuRuntimeProofTools: 8,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    records: allTools.map((toolId) => {
      const isGpuTool = gpuTools.includes(toolId)
      return {
        toolId,
        runtimeProofStatus: isGpuTool
          ? 'blocked_pending_native_gpu_runtime_proof'
          : 'runtime_proof_accepted_with_provided_evidence',
        runtimeProofAcceptedWithProvidedEvidence: !isGpuTool,
        gpuRuntimeTargeted: isGpuTool,
        gpuRuntimeOnDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        gpuRuntimeShouldStartNow: false,
      }
    }),
    booleans: {
      all13JsRuntimeProofsAccepted: true,
      all8NativeGpuRuntimeProofsAccepted: false,
      blockedPendingNativeGpuRuntimeProofTools: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
    ...overrides,
  }
}

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-cohort-admission.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-cpu-static-cohort-admission.md')
const sourceDocs = json('docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json')
const source = read('server/tool-registry/ai-graphics-external-beta-cpu-static-cohort-admission.ts')
const cli = read('server/cli/ai-graphics-external-beta-cpu-static-cohort-admission.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-cpu-static-cohort-admission'")) {
  fail('missing_tool_registry_export')
}
if (sourceDocs.decision !== 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks') {
  fail(`unexpected_source_docs_decision:${sourceDocs.decision}`)
}
if (docs.decision !== 'ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
if (docs.sourceEvidence?.perToolRuntimeProof !== 'docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json') {
  fail('docs_missing_per_tool_runtime_proof_source')
}

for (const tool of allTools) if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
for (const tool of cpuStaticTools) {
  if (!docs.cpuStaticCohortCandidateToolsWithProvidedEvidence?.includes(tool)) {
    fail(`docs_missing_cpu_static_candidate:${tool}`)
  }
}
for (const tool of gpuTools) {
  if (!docs.gpuRuntimeBlockedTools?.includes(tool)) fail(`docs_missing_gpu_blocked_tool:${tool}`)
}
for (const capability of capabilities) {
  if (!docs.capabilities?.includes(capability)) fail(`docs_missing_capability:${capability}`)
}

for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  cpuStaticCohortCandidateToolsWithProvidedEvidence: 13,
  gpuBlockedToolsPendingNativeGpuProof: 8,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_docs_count:${key}:${docs.counts?.[key]}`)
}
for (const [key, expected] of Object.entries({
  sourcePerToolRuntimeProofAccepted: true,
  sourceRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  sourceJsRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
  sourceNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 0,
  sourceBlockedPendingNativeGpuRuntimeProofTools: 8,
  cpuStaticCohortControlsRequired: true,
  cpuStaticCohortIsCandidateOnly: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  externalBetaCallableNowTools: 0,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.acceptanceCriteria?.[key] !== expected) {
    fail(`unexpected_docs_acceptance:${key}:${docs.acceptanceCriteria?.[key]}`)
  }
}
for (const key of [
  'externalBetaCpuStaticCohortAdmissionPrepared',
  'sourcePerToolRuntimeProofAccepted',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'all13CpuStaticCandidatesReadyWithProvidedEvidence',
  'all8GpuToolsRemainBlockedPendingNativeGpuProof',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of [
  'cpuStaticCohortControlsAccepted',
  ...falseGateKeys,
]) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}

for (const phrase of [
  '--external-beta-per-tool-runtime-proof-packet',
  '--external-beta-cpu-static-cohort-policy-ref',
  'external_beta_cpu_static_cohort_ready_with_gpu_blocks',
  'external_beta_cpu_static_candidate_with_provided_evidence',
  'blocked_pending_native_gpu_runtime_proof',
  'cohortAdmissionOnlyNoToolExecution',
]) {
  if (!source.includes(phrase) && !cli.includes(phrase) && !docsMd.includes(phrase)) {
    fail(`missing_phrase:${phrase}`)
  }
}
if (!scorecard.includes('AI Graphics External-Beta CPU/Static Cohort Admission')) {
  fail('scorecard_missing_cpu_static_cohort_admission')
}

const missingOutput = parseJsonOutput(runNpm(runScriptName), 'missing')
if (missingOutput.decision !== 'missing_external_beta_per_tool_runtime_proof') {
  fail(`missing_output_decision:${missingOutput.decision}`)
}
if (missingOutput.cpuStaticCohortCandidateToolsWithProvidedEvidence !== 0) {
  fail('missing_cpu_static_candidates_should_be_0')
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-cpu-static-cohort-'))
try {
  const sourcePacketPath = writeJson(
    path.join(tmpRoot, 'external-beta-per-tool-runtime-proof.json'),
    perToolRuntimeProofFixture(),
  )
  const accepted = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-per-tool-runtime-proof-packet',
    sourcePacketPath,
    '--external-beta-cpu-static-cohort-policy-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/policy.json',
    '--external-beta-cpu-static-cohort-rollout-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/rollout.json',
    '--external-beta-cpu-static-cohort-telemetry-ref',
    'external-beta-evidence://ai-graphics/cpu-static-cohort/telemetry.json',
    '--external-beta-cpu-static-cohort-rollback-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/rollback.json',
    '--external-beta-cpu-static-cohort-support-ref',
    'backend-evidence://ai-graphics/external-beta/cpu-static-cohort/support.json',
  ]), 'accepted')

  if (accepted.decision !== 'external_beta_cpu_static_cohort_ready_with_gpu_blocks') {
    fail(`accepted_decision:${accepted.decision}`)
  }
  if (accepted.cpuStaticCohortCandidateToolsWithProvidedEvidence !== 13) {
    fail(`accepted_cpu_static_candidates_not_13:${accepted.cpuStaticCohortCandidateToolsWithProvidedEvidence}`)
  }
  if (accepted.gpuBlockedToolsPendingNativeGpuProof !== 8) {
    fail(`accepted_gpu_blocked_not_8:${accepted.gpuBlockedToolsPendingNativeGpuProof}`)
  }
  if (accepted.externalBetaCallableNowTools !== 0) fail('accepted_external_beta_callable_not_0')
  for (const tool of cpuStaticTools) {
    const record = accepted.records?.find((entry) => entry.toolId === tool)
    if (!record) fail(`accepted_missing_cpu_static_record:${tool}`)
    if (record?.cohortStatus !== 'external_beta_cpu_static_candidate_with_provided_evidence') {
      fail(`accepted_cpu_static_status:${tool}:${record?.cohortStatus}`)
    }
    if (record?.externalBetaCallableNow !== false) fail(`accepted_cpu_static_callable:${tool}`)
  }
  for (const tool of gpuTools) {
    const record = accepted.records?.find((entry) => entry.toolId === tool)
    if (!record) fail(`accepted_missing_gpu_record:${tool}`)
    if (record?.cohortStatus !== 'blocked_pending_native_gpu_runtime_proof') {
      fail(`accepted_gpu_status:${tool}:${record?.cohortStatus}`)
    }
    if (!/NVIDIA L4 GPU runtime proof/.test(record?.blockedReason ?? '')) {
      fail(`accepted_gpu_missing_block_reason:${tool}`)
    }
  }
  for (const key of falseGateKeys) {
    if (accepted.booleans?.[key] !== false) fail(`accepted_false_gate_not_false:${key}`)
  }

  const rejectedSourcePath = writeJson(
    path.join(tmpRoot, 'rejected-per-tool-runtime-proof.json'),
    perToolRuntimeProofFixture({
      runtimeProofAcceptedWithProvidedEvidenceTools: 12,
      jsRuntimeProofAcceptedWithProvidedEvidenceTools: 12,
    }),
  )
  const rejected = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-per-tool-runtime-proof-packet',
    rejectedSourcePath,
    '--external-beta-cpu-static-cohort-policy-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/policy.json',
    '--external-beta-cpu-static-cohort-rollout-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/rollout.json',
    '--external-beta-cpu-static-cohort-telemetry-ref',
    'external-beta-evidence://ai-graphics/cpu-static-cohort/telemetry.json',
    '--external-beta-cpu-static-cohort-rollback-ref',
    'private://ai-graphics/external-beta/cpu-static-cohort/rollback.json',
    '--external-beta-cpu-static-cohort-support-ref',
    'backend-evidence://ai-graphics/external-beta/cpu-static-cohort/support.json',
  ]), 'rejected')
  if (rejected.decision !== 'external_beta_per_tool_runtime_proof_rejected') {
    fail(`rejected_source_decision:${rejected.decision}`)
  }

  const publicBlocked = parseJsonOutput(runNpm(runScriptName, [
    '--external-beta-per-tool-runtime-proof-packet',
    sourcePacketPath,
    '--external-beta-cpu-static-cohort-policy-ref',
    'public://unsafe/policy.json',
    '--external-beta-cpu-static-cohort-rollout-ref',
    'signed-url://unsafe/rollout.json',
    '--external-beta-cpu-static-cohort-telemetry-ref',
    'https://example.invalid/telemetry.json',
    '--external-beta-cpu-static-cohort-rollback-ref',
    'gs://unsafe/rollback.json',
    '--external-beta-cpu-static-cohort-support-ref',
    'gcs://unsafe/support.json',
  ]), 'public-blocked')
  if (publicBlocked.decision !== 'missing_external_beta_cpu_static_cohort_controls') {
    fail(`public_blocked_decision:${publicBlocked.decision}`)
  }
  if (!JSON.stringify(publicBlocked.missingCpuStaticCohortControls ?? []).includes('not private')) {
    fail('public_blocked_missing_not_private_reason')
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

const forbiddenDocs = [JSON.stringify(docs), docsMd].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["'`\s:]*true/i,
  /routeExecutionApprovedNow["'`\s:]*true/i,
  /workerExecutionApprovedNow["'`\s:]*true/i,
  /workerDispatchApprovedNow["'`\s:]*true/i,
  /toolExecutionApprovedNow["'`\s:]*true/i,
  /providerRuntimeApprovedNow["'`\s:]*true/i,
  /browserWebglCanvasRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimeApprovedNow["'`\s:]*true/i,
  /gpuRuntimeShouldStartNow["'`\s:]*true/i,
  /gpuRuntimePerformed["'`\s:]*true/i,
  /runtimeReadyNow["'`\s:]*true/i,
  /externalBetaReadyNow["'`\s:]*true/i,
  /productionReadyNow["'`\s:]*true/i,
  /publicArtifactCreated["'`\s:]*true/i,
  /signedUrlCreated["'`\s:]*true/i,
]) {
  if (pattern.test(forbiddenDocs)) fail(`forbidden_docs_claim:${pattern}`)
}

const packageLockDiff = git(['diff', '--', 'package-lock.json'])
if (packageLockDiff.trim()) fail('package_lock_changed')

const pkgDiffLines = git(['diff', '--', 'package.json']).split('\n').filter(Boolean)
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission": "tsx server/cli/ai-graphics-external-beta-cpu-static-runtime-admission.ts",',
  '+    "ai-graphics:external-beta-cpu-static-runtime-admission:diagnostics": "node scripts/validation/ai-graphics-external-beta-cpu-static-runtime-admission-diagnostics.mjs",',
])
for (const line of pkgDiffLines) {
  if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (/^[+-]\s*"(dependencies|devDependencies|optionalDependencies|peerDependencies)"/.test(line)) {
    fail(`dependency_section_changed:${line}`)
  }
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts.trim()) fail(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const changedFiles = git(['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
for (const filePath of changedFiles) {
  if (/\.local-artifacts\//.test(filePath)) fail(`changed_local_artifact:${filePath}`)
  if (/(^|\/)(generated|render|renders|browser|canvas|webgl|public-artifacts)(\/|$)/i.test(filePath)) {
    fail(`changed_generated_output_path:${filePath}`)
  }
}

if (failures.length > 0) {
  console.error(`AI graphics external-beta CPU/static cohort admission diagnostics failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: docs.decision,
  totalAiGraphicsTools: 21,
  cpuStaticCohortCandidateToolsWithProvidedEvidence: 13,
  gpuBlockedToolsPendingNativeGpuProof: 8,
  externalBetaCallableNowTools: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNow: false,
  productionReadyNow: false,
}, null, 2))
