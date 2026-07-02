import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:on-demand-runtime-admission-private-proof-ref-smoke'
const runScriptCommand =
  'tsx server/cli/ai-graphics-on-demand-runtime-admission-private-proof-ref-smoke.ts'
const diagnosticScriptName =
  'ai-graphics:on-demand-runtime-admission-private-proof-ref-smoke:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-on-demand-runtime-admission-private-proof-ref-smoke-diagnostics.mjs'

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

const errors = []

function fail(message) {
  errors.push(message)
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-on-demand-runtime-admission.ts',
  'server/cli/ai-graphics-on-demand-runtime-admission-private-proof-ref-smoke.ts',
  'scripts/validation/ai-graphics-on-demand-runtime-admission-private-proof-ref-smoke-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.json',
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.md',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const packet = json(
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.json',
)
const markdown = read(
  'docs/tool-intelligence/ai-graphics/on-demand-runtime-admission-private-proof-ref-smoke.md',
)
const source = read('server/tool-registry/ai-graphics-on-demand-runtime-admission.ts')
const cli = read(
  'server/cli/ai-graphics-on-demand-runtime-admission-private-proof-ref-smoke.ts',
)

if (pkg.scripts?.[runScriptName] !== runScriptCommand) {
  fail(`missing_package_script:${runScriptName}`)
}
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}

if (packet.decision !== 'ai_graphics_on_demand_runtime_admission_private_proof_ref_smoke_passed') {
  fail(`unexpected_decision:${packet.decision}`)
}

for (const needle of [
  'privateRuntimeProofRefAccepted',
  "value.trim().startsWith('private://')",
  'native NVIDIA GPU runtime proof reference is missing or not private-scoped',
  'reviewed model-weight manifest reference is missing or not private-scoped',
  'Node CPU/static runtime proof reference is missing or not private-scoped',
  'Satori approved font runtime proof reference is missing or not private-scoped',
  'browser/canvas/WebGL runtime proof reference is missing or not private-scoped',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}

for (const needle of [
  'https://public.example.invalid',
  'external-beta-runtime://model-manifests',
  'private://ai-graphics/runtime-admission',
  'runtime_job_blocked',
  'runtime_job_admission_ready_for_worker_enqueue',
  'on_demand_start_allowed_after_live_worker_enqueue',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}

if (packet.counts?.totalAiGraphicsTools !== 21) fail('total_tool_count_not_21')
if (packet.counts?.gpuModelToolsCovered !== 8) fail('gpu_tool_count_not_8')
if (packet.counts?.publicProofRefsRejected !== 8) fail('public_proof_refs_rejected_not_8')
if (packet.counts?.runtimeJobAdmissionReadyWithPrivateRefs !== 8) {
  fail('private_ref_admission_ready_count_not_8')
}
if (packet.counts?.gpuRuntimeStartedNow !== 0) fail('gpu_runtime_started_now_not_zero')
if (packet.counts?.gpuRuntimePerformed !== 0) fail('gpu_runtime_performed_not_zero')
if (packet.counts?.agentExecutableNow !== 0) fail('agent_executable_now_not_zero')

for (const tool of gpuTools) {
  if (!packet.gpuModelTools?.includes(tool)) fail(`missing_gpu_tool:${tool}`)
  const rejected = packet.rejectedPublicProofRefCases?.find((record) => record.toolId === tool)
  const accepted = packet.acceptedPrivateProofRefCases?.find((record) => record.toolId === tool)
  if (!rejected) fail(`missing_rejected_case:${tool}`)
  if (!accepted) fail(`missing_accepted_case:${tool}`)
  if (rejected && rejected.decision !== 'runtime_job_blocked') {
    fail(`rejected_case_not_blocked:${tool}`)
  }
  if (rejected?.runtimeJobAdmissionReadyWithProvidedEvidence !== false) {
    fail(`rejected_case_ready:${tool}`)
  }
  if (rejected?.gpuRuntimeStartAllowedForAcceptedJob !== false) {
    fail(`rejected_case_gpu_start_allowed:${tool}`)
  }
  if (!rejected?.missingRuntimeProofGates?.some((gate) => gate.includes('not private-scoped'))) {
    fail(`rejected_case_missing_private_scope_gate:${tool}`)
  }
  if (accepted && accepted.decision !== 'runtime_job_admission_ready_for_worker_enqueue') {
    fail(`accepted_case_not_admission_ready:${tool}`)
  }
  if (accepted?.runtimeJobAdmissionReadyWithProvidedEvidence !== true) {
    fail(`accepted_case_not_ready:${tool}`)
  }
  if (accepted?.gpuRuntimeStartupAuthorization !== 'on_demand_start_allowed_after_live_worker_enqueue') {
    fail(`accepted_case_not_on_demand:${tool}`)
  }
  if (accepted?.gpuRuntimeStartAllowedForAcceptedJob !== true) {
    fail(`accepted_case_gpu_start_not_allowed_for_accepted_job:${tool}`)
  }
  if (accepted?.gpuRuntimeShouldStartNow !== false) fail(`accepted_case_started_gpu:${tool}`)
  if (accepted?.gpuRuntimePerformed !== false) fail(`accepted_case_gpu_performed:${tool}`)
}

for (const key of [
  'privateProofRefSmokePassed',
  'all8GpuModelToolsCovered',
  'publicProofRefsRejected',
  'privateProofRefsAcceptedForFutureWorkerEnqueue',
  'agentCanSelectForPlanning',
  'gpuRuntimeOnDemandOnly',
  'noIdleGpuRuntimeApproved',
  'gpuStartsOnlyForApprovedWorkerOrToolCall',
]) {
  if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'gpuRuntimeApprovedNow',
  'gpuRuntimeShouldStartNow',
  'gpuRuntimePerformed',
  'runtimeReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (packet.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

if (!markdown.includes('Private proof refs allow only future worker-enqueue admission.')) {
  fail('markdown_missing_future_worker_enqueue_boundary')
}
if (!markdown.includes('GPU remains on demand only')) {
  fail('markdown_missing_on_demand_gpu_statement')
}

const combinedText = [markdown, JSON.stringify(packet), source, cli].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeShouldStartNow["`:= ]+true/i,
  /gpuRuntimePerformed["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /publicArtifactCreated["`:= ]+true/i,
  /signedUrlCreated["`:= ]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim_detected:${pattern}`)
}

let basePackage = {}
try {
  basePackage = JSON.parse(git(['show', `${baseRef}:package.json`]))
} catch (error) {
  fail(`base_package_read_failed:${error.message}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(pkg[section] || {}) !== JSON.stringify(basePackage[section] || {})) {
    fail(`package_dependency_section_changed:${section}`)
  }
}
if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')

const changedFiles = git(['diff', '--name-only', baseRef]).split('\n').filter(Boolean)
const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of [...changedFiles, ...stagedFiles, ...trackedFiles]) {
  if (file.startsWith('.local-artifacts/')) fail(`local_artifact_committed_or_changed:${file}`)
}
for (const file of [...changedFiles, ...stagedFiles]) {
  if (/(^|\/)(dist|build|coverage|public\/generated|public\/artifacts|public-artifacts|render-outputs|rendered-output|browser-output|canvas-output|webgl-output)(\/|$)/i.test(file)) {
    fail(`generated_or_runtime_artifact_path_changed:${file}`)
  }
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) {
    fail(`generated_media_or_font_changed:${file}`)
  }
}

if (errors.length) {
  console.error('AI graphics on-demand runtime admission private proof-ref smoke diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: packet.decision,
  gpuModelToolsCovered: packet.counts.gpuModelToolsCovered,
  publicProofRefsRejected: packet.counts.publicProofRefsRejected,
  privateProofRefAdmissionsReady: packet.counts.runtimeJobAdmissionReadyWithPrivateRefs,
  gpuRuntimeShouldStartNow: packet.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
