import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:external-beta-evidence-admission-bundle'
const runScriptCommand = 'tsx server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts'
const diagnosticScriptName = 'ai-graphics:external-beta-evidence-admission-bundle:diagnostics'
const diagnosticScriptCommand =
  'node scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs'
const externalBetaEvidencePacketScriptName = 'ai-graphics:external-beta-evidence-packet:validate'

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
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
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

function acceptedExternalBetaRecord(toolId) {
  const prefix = `external-beta-evidence://${toolId}`
  return {
    toolId,
    internalRuntimeSoakEvidenceRef: `${prefix}:internal-runtime-soak`,
    externalBetaQaEvidenceRef: `${prefix}:external-qa`,
    costConcurrencyPrivacyRollbackEvidenceRef: `${prefix}:cost-concurrency-privacy-rollback`,
    incidentResponseEvidenceRef: `${prefix}:incident-response`,
    ownerApprovalRef: `${prefix}:owner-approval`,
  }
}

function acceptedBetaEvidenceBundleFixture() {
  return {
    decision: 'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults',
    totalAiGraphicsTools: 21,
    all21TechnicalEvidenceReadyBeforeOwnerApproval: true,
    evidenceSources: {
      jsRuntimeProofsAccepted: true,
      modelWeightManifestReviewPacketAccepted: true,
      nativeGpuRuntimeProofResultPacketAccepted: true,
      nativeGpuRuntimeProofTargetsExact: true,
    },
    booleans: {
      gpuRuntimeOnDemandOnly: true,
      agentCanExecuteToolsNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-external-beta-evidence-admission-bundle.ts',
  'server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts',
  'scripts/validation/ai-graphics-external-beta-evidence-admission-bundle-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-packet.json',
  'docs/tool-intelligence/ai-graphics/beta-evidence-bundle.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const docs = json('docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json')
const docsMd = read('docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.md')
const source = read('server/tool-registry/ai-graphics-external-beta-evidence-admission-bundle.ts')
const cli = read('server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts')
const index = read('server/tool-registry/index.ts')
const scorecard = read('docs/production-beta-readiness-scorecard.md')

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) {
  fail(`missing_package_script:${diagnosticScriptName}`)
}
if (!index.includes("export * from './ai-graphics-external-beta-evidence-admission-bundle'")) {
  fail('server_registry_index_missing_external_beta_evidence_admission_bundle_export')
}
if (docs.decision !== 'ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks') {
  fail(`unexpected_docs_decision:${docs.decision}`)
}
for (const [key, expected] of Object.entries({
  totalAiGraphicsTools: 21,
  totalProductFacingCapabilities: 12,
  gpuRuntimeTargetedTools: 8,
  fullTechnicalEvidenceReadyBeforeOwnerApprovalTools: 21,
  fullExternalBetaPrivateEvidenceAcceptedTools: 21,
  fullExternalBetaAdmissionCandidateToolsWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
})) {
  if (docs.counts?.[key] !== expected) fail(`unexpected_count:${key}:${docs.counts?.[key]}`)
}

for (const tool of allTools) {
  if (!docs.tools?.includes(tool)) fail(`docs_missing_tool:${tool}`)
  if (!docsMd.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
}
if (gpuTools.length !== 8) fail('diagnostic_gpu_tool_count_not_8')
for (const phrase of [
  'technical proof bundle accepted for all 21 AI graphics tools',
  'private or backend external-beta evidence refs accepted for all 21 tools',
  'external-beta launch go/no-go approval recorded',
  'runtime admission still requires explicit feature flag',
]) {
  if (!docs.requiredEvidenceFlow?.some((entry) => entry.includes(phrase))) {
    fail(`docs_missing_flow:${phrase}`)
  }
  if (!source.includes(phrase)) fail(`source_missing_flow:${phrase}`)
}
for (const needle of [
  'AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION',
  'buildAiGraphicsExternalBetaEvidenceAdmissionBundle',
  'betaEvidenceBundleAccepted',
  'externalBetaEvidencePacketAccepted',
  'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked',
  'externalBetaReadyNowTools: 0',
  'productionReadyNowTools: 0',
  'gpuRuntimeOnDemandOnly: true',
  'agentCanExecuteToolsNow: false',
]) {
  if (!source.includes(needle)) fail(`source_missing:${needle}`)
}
for (const needle of [
  '--beta-evidence-bundle-packet',
  '--external-beta-evidence-packet',
  'evaluatorOnly: true',
  'toolExecutionPerformed: false',
  'gpuRuntimePerformed: false',
]) {
  if (!cli.includes(needle)) fail(`cli_missing:${needle}`)
}
for (const key of [
  'externalBetaEvidenceAdmissionBundlePrepared',
  'all21ToolsCovered',
  'all12CapabilitiesCovered',
  'technicalEvidenceReadyBeforeOwnerApproval',
  'externalBetaPrivateEvidenceRefsAccepted',
  'externalBetaAdmissionCandidateWithProvidedEvidence',
  'gpuRuntimeOnDemandOnly',
  'privateOrBackendEvidenceRefsRequired',
  'publicArtifactRefsRejected',
  'signedUrlRefsRejected',
  'agentCanSelectForPlanning',
]) {
  if (docs.booleans?.[key] !== true) fail(`docs_required_true_not_true:${key}`)
}
for (const key of falseGateKeys) {
  if (docs.booleans?.[key] !== false) fail(`docs_required_false_not_false:${key}`)
}
if (!docsMd.includes('External-beta-ready now: `0`')) fail('markdown_missing_external_beta_ready_zero')
if (!scorecard.includes('ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks')) {
  fail('scorecard_missing_external_beta_evidence_admission_bundle_decision')
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-graphics-external-beta-admission-'))
const betaBundlePath = writeJson(path.join(tempRoot, 'accepted-beta-evidence-bundle.json'), acceptedBetaEvidenceBundleFixture())
const recordsPath = writeJson(path.join(tempRoot, 'external-beta-records.json'), allTools.map(acceptedExternalBetaRecord))
const externalBetaPacketPath = writeJson(
  path.join(tempRoot, 'external-beta-evidence-packet.json'),
  parseJsonOutput(
    runNpm(externalBetaEvidencePacketScriptName, ['--evidence-records', recordsPath]),
    'external_beta_evidence_packet',
  ),
)

const defaultOutput = parseJsonOutput(runNpm(runScriptName), 'default_admission_bundle')
const technicalOnlyOutput = parseJsonOutput(runNpm(runScriptName, [
  '--beta-evidence-bundle-packet',
  betaBundlePath,
]), 'technical_only_admission_bundle')
const fullOutput = parseJsonOutput(runNpm(runScriptName, [
  '--beta-evidence-bundle-packet',
  betaBundlePath,
  '--external-beta-evidence-packet',
  externalBetaPacketPath,
]), 'full_admission_bundle')

if (defaultOutput.status !== 'missing_technical_runtime_evidence') {
  fail(`default_status_unexpected:${defaultOutput.status}`)
}
if (defaultOutput.externalBetaAdmissionCandidateToolsWithProvidedEvidence !== 0) {
  fail('default_admission_candidate_tools_not_0')
}
if (technicalOnlyOutput.status !== 'missing_external_beta_private_evidence_refs') {
  fail(`technical_only_status_unexpected:${technicalOnlyOutput.status}`)
}
if (technicalOnlyOutput.technicalEvidenceReadyBeforeOwnerApprovalTools !== 21) {
  fail('technical_only_technical_evidence_tools_not_21')
}
if (technicalOnlyOutput.externalBetaAdmissionCandidateToolsWithProvidedEvidence !== 0) {
  fail('technical_only_admission_candidate_tools_not_0')
}
if (fullOutput.status !== 'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked') {
  fail(`full_status_unexpected:${fullOutput.status}`)
}
if (fullOutput.technicalEvidenceReadyBeforeOwnerApprovalTools !== 21) {
  fail('full_technical_evidence_tools_not_21')
}
if (fullOutput.externalBetaPrivateEvidenceAcceptedTools !== 21) {
  fail('full_private_evidence_tools_not_21')
}
if (fullOutput.externalBetaAdmissionCandidateToolsWithProvidedEvidence !== 21) {
  fail('full_admission_candidate_tools_not_21')
}
if (fullOutput.externalBetaReadyNowTools !== 0) fail('full_external_beta_ready_now_not_0')
if (fullOutput.productionReadyNowTools !== 0) fail('full_production_ready_now_not_0')
if (fullOutput.booleans?.externalBetaAdmissionCandidateWithProvidedEvidence !== true) {
  fail('full_admission_candidate_boolean_not_true')
}

for (const tool of allTools) {
  const row = fullOutput.tools?.find((entry) => entry.toolId === tool)
  if (!row) fail(`full_output_missing_tool:${tool}`)
  if (row?.technicalEvidenceAcceptedForTool !== true) fail(`full_tool_technical_not_true:${tool}`)
  if (row?.externalBetaPrivateEvidenceAcceptedForTool !== true) {
    fail(`full_tool_external_refs_not_true:${tool}`)
  }
  if (row?.externalBetaAdmissionCandidateWithProvidedEvidence !== true) {
    fail(`full_tool_candidate_not_true:${tool}`)
  }
  if (row?.externalBetaReadyNow !== false) fail(`full_tool_ready_now_not_false:${tool}`)
  if (row?.productionReadyNow !== false) fail(`full_tool_production_not_false:${tool}`)
}

for (const output of [defaultOutput, technicalOnlyOutput, fullOutput]) {
  for (const key of falseGateKeys) {
    if (output.booleans?.[key] !== false && output.input?.[key] !== false) {
      fail(`output_required_false_not_false:${key}`)
    }
  }
}

const combinedText = [
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.md',
  'docs/tool-intelligence/ai-graphics/external-beta-evidence-admission-bundle.json',
  'server/tool-registry/ai-graphics-external-beta-evidence-admission-bundle.ts',
  'server/cli/ai-graphics-external-beta-evidence-admission-bundle.ts',
  'docs/production-beta-readiness-scorecard.md',
].map(read).join('\n')

for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /routeExecutionApprovedNow["`:\s]+true/i,
  /workerExecutionApprovedNow["`:\s]+true/i,
  /toolExecutionApprovedNow["`:\s]+true/i,
  /providerRuntimeApprovedNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s]+true/i,
  /gpuRuntimeApprovedNow["`:\s]+true/i,
  /runtimeReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
  /gpuRuntimePerformed["`:\s]+true/i,
  /browserWebglCanvasRuntimePerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail(`forbidden_claim:${pattern}`)
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

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) fail(`local_artifacts_tracked:${trackedLocalArtifacts}`)

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
if (stagedFiles.some((file) => file.startsWith('.local-artifacts/'))) fail('local_artifacts_staged')
if (stagedFiles.some((file) => /(generated|render|renders|media|browser|canvas|webgl|public-artifact|signed-url|\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.gif)$/i.test(file))) {
  fail('generated_output_staged')
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docs.decision,
  toolsCovered: allTools.length,
  gpuToolsCovered: gpuTools.length,
  defaultStatus: defaultOutput.status,
  technicalOnlyStatus: technicalOnlyOutput.status,
  fullStatus: fullOutput.status,
  externalBetaAdmissionCandidateToolsWithProvidedEvidence:
    fullOutput.externalBetaAdmissionCandidateToolsWithProvidedEvidence,
  externalBetaReadyNowTools: fullOutput.externalBetaReadyNowTools,
  productionReadyNowTools: fullOutput.productionReadyNowTools,
  agentCanExecuteToolsNow: fullOutput.booleans?.agentCanExecuteToolsNow,
  gpuRuntimeApprovedNow: fullOutput.booleans?.gpuRuntimeApprovedNow,
}, null, 2))
