import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const scriptName = 'ai-graphics:beta-readiness-gate:diagnostics'
const scriptCommand = 'node scripts/validation/ai-graphics-beta-readiness-gate-diagnostics.mjs'
const evaluatorScriptName = 'ai-graphics:beta-readiness-gate:evaluate'
const evaluatorScriptCommand = 'tsx server/cli/ai-graphics-beta-readiness-gate-evaluate.ts'

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

function runEvaluator(args = []) {
  return execFileSync('npm', ['run', '--silent', evaluatorScriptName, '--', ...args], {
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

const requiredFiles = [
  'server/tool-registry/ai-graphics-beta-readiness-gate.ts',
  'server/cli/ai-graphics-beta-readiness-gate-evaluate.ts',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.md',
  'docs/tool-intelligence/ai-graphics/beta-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json',
  'docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json',
  'docs/tool-intelligence/ai-graphics/gpu-model-package-license-review.md',
  'docs/tool-intelligence/ai-graphics/gpu-model-package-license-review.json',
]

for (const file of requiredFiles) read(file)

const pkg = json('package.json')
const gate = json('docs/tool-intelligence/ai-graphics/beta-readiness-gate.json')
const evaluator = json('docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json')
const handoff = json('docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json')
const readiness = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const gpuGate = json('docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json')
const packageLicenseReview = json('docs/tool-intelligence/ai-graphics/gpu-model-package-license-review.json')
const source = read('server/tool-registry/ai-graphics-beta-readiness-gate.ts')
const evaluatorCli = read('server/cli/ai-graphics-beta-readiness-gate-evaluate.ts')
const index = read('server/tool-registry/index.ts')
const markdown = read('docs/tool-intelligence/ai-graphics/beta-readiness-gate.md')
const packageLicenseMarkdown = read('docs/tool-intelligence/ai-graphics/gpu-model-package-license-review.md')

if (pkg.scripts?.[scriptName] !== scriptCommand) fail(`missing_package_script:${scriptName}`)
if (pkg.scripts?.[evaluatorScriptName] !== evaluatorScriptCommand) fail(`missing_package_script:${evaluatorScriptName}`)
if (gate.decision !== 'ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks') {
  fail(`unexpected_decision:${gate.decision}`)
}
if (gate.sourceDecision !== 'ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks') {
  fail(`unexpected_source_decision:${gate.sourceDecision}`)
}
if (evaluator.decision !== gate.sourceDecision) fail('source_evaluator_decision_not_accepted')
if (handoff.counts?.totalTools !== 21) fail('handoff_tool_count_not_21')
if (readiness.toolCounts?.productionToolIdMapped !== 21) fail('readiness_mapping_count_not_21')
if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('proper_install_count_not_21')
if (gpuGate.tools?.length !== 8) fail('gpu_gate_tool_count_not_8')
if (packageLicenseReview.decision !== 'ai_graphics_gpu_model_package_license_review_narrowed_with_model_weight_blocks') {
  fail(`unexpected_package_license_review_decision:${packageLicenseReview.decision}`)
}
for (const tool of ['torch_torchvision', 'transformers', 'sam2', 'birefnet', 'real_esrgan', 'transparent_background']) {
  if (!packageLicenseReview.reviewedPackageCodeTools?.includes(tool)) fail(`package_license_review_missing_tool:${tool}`)
}
if (packageLicenseReview.stillPackageProfileBlockedTools?.length !== 0) {
  fail('package_license_review_still_has_package_profile_blocks')
}
for (const url of [
  'https://github.com/pytorch/pytorch/blob/main/LICENSE',
  'https://github.com/huggingface/transformers/blob/main/LICENSE',
  'https://github.com/facebookresearch/sam2',
  'https://github.com/ZhengPeng7/BiRefNet',
  'https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE',
  'https://github.com/plemeri/transparent-background/blob/main/LICENSE',
]) {
  if (!packageLicenseMarkdown.includes(url) && !JSON.stringify(packageLicenseReview).includes(url)) {
    fail(`package_license_review_missing_source:${url}`)
  }
}

if (!index.includes("export * from './ai-graphics-beta-readiness-gate'")) {
  fail('server_registry_index_does_not_export_beta_gate')
}
for (const needle of [
  'AI_GRAPHICS_BETA_READINESS_GATE_DECISION',
  'buildAiGraphicsBetaReadinessGate',
  'evaluateToolLicensePolicy',
  'evaluateToolModelWeightPolicy',
  'evaluateRuntimePolicy',
  'approvedPlanSnapshotGatePassed',
  'nativeGpuRuntimeProofPassed',
  'modelWeightPolicyAllowedByEvidence',
  'modelWeightManifestReviewPacketAccepted',
  'modelWeightManifestsAcceptedByEvidence',
  'buildExternalBetaBlockers',
  'externalBetaReadyNow: false',
  'productionReadyNow: false',
  'externalBetaBlockers',
  'externalBetaReadyTools: 0',
  'externalBetaBlockedTools: 21',
  'cpuFallbackAllowedForHeavyTool: false',
  'betaTestingReadyNow: uniqueBlockers.length === 0',
  'production registry profile is still future',
  'production registry profile is evaluation_only',
]) {
  if (!source.includes(needle)) fail(`beta_gate_source_missing:${needle}`)
}
for (const needle of [
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
  'evaluatorOnly: true',
]) {
  if (!evaluatorCli.includes(needle)) fail(`beta_gate_evaluator_missing:${needle}`)
}

if (gate.counts?.totalTools !== 21) fail('gate_total_tools_not_21')
if (gate.counts?.productFacingCapabilities !== 12) fail('gate_capability_count_not_12')
if (gate.counts?.installReadyTools !== 21) fail('gate_install_ready_count_not_21')
if (gate.counts?.productionMappedTools !== 21) fail('gate_production_mapped_count_not_21')
if (gate.counts?.planningSelectableTools !== 21) fail('gate_planning_selectable_count_not_21')
if (gate.counts?.gpuRuntimeTargetedTools !== 8) fail('gate_gpu_tool_count_not_8')
if (gate.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('gate_heavy_cpu_count_not_zero')
if (gate.counts?.betaTestingReadyTools !== 0) fail('gate_beta_ready_count_not_zero')
if (gate.counts?.blockedTools !== 21) fail('gate_blocked_tool_count_not_21')
if (gate.counts?.externalBetaReadyTools !== 0) fail('gate_external_beta_ready_count_not_zero')
if (gate.counts?.externalBetaBlockedTools !== 21) fail('gate_external_beta_blocked_count_not_21')
if (gate.counts?.productionReadyTools !== 0) fail('gate_production_ready_count_not_zero')
if (gate.evidenceEvaluationMode?.defaultEvidenceReadyTools !== 0) fail('gate_default_evidence_ready_not_zero')
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsReadyTools !== 16) fail('gate_all_evidence_without_review_packet_ready_not_16')
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsStillBlockedTools !== 5) fail('gate_all_evidence_without_review_packet_blocked_not_5')
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsRequireAcceptedModelReviewPacket !== true) {
  fail('gate_missing_review_packet_requirement')
}
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsPlusModelReviewPacketReadyTools !== 21) {
  fail('gate_all_evidence_plus_review_packet_ready_not_21')
}
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsPlusModelReviewPacketStillBlockedTools !== 0) {
  fail('gate_all_evidence_plus_review_packet_blocked_not_0')
}
if (gate.evidenceEvaluationMode?.modelWeightManifestClaimAloneDoesNotUnblockModelTools !== true) {
  fail('gate_model_weight_claim_alone_not_guarded')
}
if (gate.evidenceEvaluationMode?.allCurrentEvidenceFlagsDoNotUnlockExternalBeta !== true) {
  fail('gate_all_current_evidence_flags_external_beta_guard_missing')
}
if (gate.evidenceEvaluationMode?.readyOnlyWhenProfilesAndPoliciesAllow !== true) fail('gate_evidence_mode_policy_guard_missing')
if (gate.evidenceEvaluationMode?.executionPerformedByEvaluator !== false) fail('gate_evaluator_execution_not_false')

for (const tool of allTools) {
  if (!handoff.allTools?.includes(tool)) fail(`handoff_missing_tool:${tool}`)
  if (!readiness.allTools?.includes(tool)) fail(`readiness_missing_tool:${tool}`)
  if (!JSON.stringify(audit.toolRows || []).includes(`"toolId":"${tool}"`)) fail(`audit_missing_tool:${tool}`)
}

for (const tool of gpuTools) {
  if (!gate.gpuRuntimeTargetedTools?.includes(tool)) fail(`gate_gpu_tool_missing:${tool}`)
  if (!handoff.gpuRuntimeTargetedTools?.includes(tool)) fail(`handoff_gpu_tool_missing:${tool}`)
  const row = (audit.toolRows || []).find((entry) => entry.toolId === tool)
  if (!row?.runtimeTarget?.includes('nvidia_l4')) fail(`gpu_tool_not_targeting_l4:${tool}:${row?.runtimeTarget}`)
}

const defaultOutput = runEvaluator()
const defaultGate = parseJsonOutput(defaultOutput, 'default_evaluator')
if (defaultGate.betaTestingReadyTools !== 0) fail(`default_evaluator_ready_not_zero:${defaultGate.betaTestingReadyTools}`)
if (defaultGate.blockedTools !== 21) fail(`default_evaluator_blocked_not_21:${defaultGate.blockedTools}`)
if (defaultGate.input?.evaluatorOnly !== true) fail('default_evaluator_not_evaluator_only')

const fullEvidenceOutput = runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
])
const fullEvidenceGate = parseJsonOutput(fullEvidenceOutput, 'full_evidence_evaluator')
if (fullEvidenceGate.betaTestingReadyTools !== 16) {
  fail(`full_evidence_without_review_packet_ready_count_not_16:${fullEvidenceGate.betaTestingReadyTools}`)
}
if (fullEvidenceGate.blockedTools !== 5) {
  fail(`full_evidence_without_review_packet_blocked_count_not_5:${fullEvidenceGate.blockedTools}`)
}
const fullEvidenceReadyTools = (fullEvidenceGate.tools || [])
  .filter((tool) => tool.betaTestingReadyNow === true)
  .map((tool) => tool.toolId)
for (const tool of allTools.filter((tool) => !['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background'].includes(tool))) {
  if (!fullEvidenceReadyTools.includes(tool)) fail(`full_evidence_without_review_packet_expected_ready_tool_missing:${tool}`)
}
for (const tool of ['sam2', 'birefnet', 'real_esrgan', 'rembg', 'transparent_background']) {
  const row = (fullEvidenceGate.tools || []).find((entry) => entry.toolId === tool)
  if (!row) fail(`full_evidence_without_review_packet_missing_model_tool:${tool}`)
  if (row?.betaTestingReadyNow !== false) fail(`full_evidence_without_review_packet_model_tool_unblocked:${tool}`)
  if (!String(row?.blockers || '').includes('model-weight')) {
    fail(`full_evidence_without_review_packet_model_tool_missing_model_weight_blocker:${tool}`)
  }
}

const reviewPacketEvidenceOutput = runEvaluator([
  '--all-shared-gates-passed',
  '--browser-canvas-webgl-sandbox-passed',
  '--native-gpu-runtime-proof-passed',
  '--model-weight-manifests-approved',
  '--model-weight-review-packet-accepted',
])
const reviewPacketEvidenceGate = parseJsonOutput(reviewPacketEvidenceOutput, 'review_packet_evidence_evaluator')
if (reviewPacketEvidenceGate.betaTestingReadyTools !== 21) {
  fail(`review_packet_evidence_ready_count_not_21:${reviewPacketEvidenceGate.betaTestingReadyTools}`)
}
if (reviewPacketEvidenceGate.blockedTools !== 0) {
  fail(`review_packet_evidence_blocked_count_not_0:${reviewPacketEvidenceGate.blockedTools}`)
}
if (reviewPacketEvidenceGate.externalBetaReadyTools !== 0) {
  fail(`review_packet_evidence_external_beta_ready_not_zero:${reviewPacketEvidenceGate.externalBetaReadyTools}`)
}
if (reviewPacketEvidenceGate.externalBetaBlockedTools !== 21) {
  fail(`review_packet_evidence_external_beta_blocked_not_21:${reviewPacketEvidenceGate.externalBetaBlockedTools}`)
}
if (reviewPacketEvidenceGate.productionReadyTools !== 0) {
  fail(`review_packet_evidence_production_ready_not_zero:${reviewPacketEvidenceGate.productionReadyTools}`)
}
const reviewPacketReadyTools = (reviewPacketEvidenceGate.tools || [])
  .filter((tool) => tool.betaTestingReadyNow === true)
  .map((tool) => tool.toolId)
for (const tool of allTools) {
  if (!reviewPacketReadyTools.includes(tool)) fail(`review_packet_evidence_expected_ready_tool_missing:${tool}`)
}
for (const row of reviewPacketEvidenceGate.tools || []) {
  if (row?.blockers?.length) fail(`review_packet_evidence_unexpected_blockers:${row.toolId}:${row.blockers.join('|')}`)
  if (row?.externalBetaReadyNow !== false) {
    fail(`review_packet_evidence_external_beta_ready_not_false:${row.toolId}`)
  }
  if (row?.productionReadyNow !== false) {
    fail(`review_packet_evidence_production_ready_not_false:${row.toolId}`)
  }
  if (!Array.isArray(row?.externalBetaBlockers) || row.externalBetaBlockers.length < 4) {
    fail(`review_packet_evidence_missing_external_beta_blockers:${row.toolId}`)
  }
}
for (const key of [
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
]) {
  if (reviewPacketEvidenceGate.input?.[key] !== false) fail(`review_packet_evidence_input_false_gate_not_false:${key}`)
}

for (const requiredGate of [
  'approved plan snapshot gate is not passed',
  'credit reservation gate is not passed',
  'artifact boundary gate is not passed',
  'Tool Route approval gate is not passed',
  'Worker approval gate is not passed',
  'internal beta owner approval is not granted',
  'native NVIDIA GPU runtime proof is required for GPU/model tools',
  'reviewed model-weight manifests are required for model/checkpoint tools',
  'browser/canvas/WebGL sandbox proof is required for browser runtime tools',
  'production registry profile must move away from planning_only before execution',
  'license and model-weight policies must be approved where currently under review',
  'accepted model-weight review packet is required in addition to model-weight manifest approval claims',
  'real internal beta runtime execution evidence is required before external-beta launch',
  'external-beta QA, cost, concurrency, rollback, privacy, and incident-response gates are required before external-beta launch',
  'external-beta owner approval is required after internal runtime soak evidence',
]) {
  if (!gate.requiredCurrentGates?.includes(requiredGate)) fail(`required_current_gate_missing:${requiredGate}`)
}

for (const key of [
  'betaReadinessGatePrepared',
  'externalBetaLaunchGatePrepared',
  'sourceToolCallPlanEvaluatorAccepted',
  'all21ToolsCovered',
  'all12ProductFacingCapabilitiesCovered',
  'all21ToolsInstallReady',
  'all21ToolsMappedToProductionRegistry',
  'all21ToolsPlanningSelectable',
  'gpuHeavyToolsTargetGpuRuntime',
  'agentCanSelectForPlanning',
]) {
  if (gate.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
}

for (const key of [
  'gpuHeavyToolsTargetCpuRuntime',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'modelWeightsApprovedNow',
  'externalBetaRuntimeEvidenceAccepted',
  'externalBetaQaAccepted',
  'externalBetaCostConcurrencyPrivacyAccepted',
  'externalBetaOwnerApprovalGranted',
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
  'publicArtifactCreated',
  'signedUrlCreated',
]) {
  if (gate.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
}

const combinedText = [markdown, JSON.stringify(gate), source].join('\n')
for (const pattern of [
  /agentCanExecuteToolsNow["`:= ]+true/i,
  /routeExecutionApprovedNow["`:= ]+true/i,
  /workerExecutionApprovedNow["`:= ]+true/i,
  /toolExecutionApprovedNow["`:= ]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:= ]+true/i,
  /gpuRuntimeApprovedNow["`:= ]+true/i,
  /modelWeightsApprovedNow["`:= ]+true/i,
  /runtimeReadyNow["`:= ]+true/i,
  /internalBetaReadyNow["`:= ]+true/i,
  /externalBetaReadyNow["`:= ]+true/i,
  /productionReadyNow["`:= ]+true/i,
  /betaTestingReadyNow["`:= ]+true/i,
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
  if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|ttf|otf|woff2?)$/i.test(file)) fail(`generated_media_or_font_changed:${file}`)
}

if (errors.length) {
  console.error('AI graphics beta readiness gate diagnostics failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: gate.decision,
  toolsCovered: gate.counts.totalTools,
  installReadyTools: gate.counts.installReadyTools,
  productionMappedTools: gate.counts.productionMappedTools,
  gpuRuntimeTargetedTools: gate.counts.gpuRuntimeTargetedTools,
  heavyToolsIncorrectlyTargetingCpu: gate.counts.heavyToolsIncorrectlyTargetingCpu,
  betaTestingReadyTools: gate.counts.betaTestingReadyTools,
  blockedTools: gate.counts.blockedTools,
  externalBetaReadyTools: gate.counts.externalBetaReadyTools,
  externalBetaBlockedTools: gate.counts.externalBetaBlockedTools,
  productionReadyTools: gate.counts.productionReadyTools,
}, null, 2))
