import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-tool-call-readiness-contract'
const runScriptName = 'ai-graphics:cross-owner-coordination'
const runScriptCommand = 'tsx server/cli/ai-graphics-cross-owner-coordination.ts'
const diagnosticScriptName = 'ai-graphics:cross-owner-coordination:diagnostics'
const diagnosticScriptCommand = 'node scripts/validation/ai-graphics-cross-owner-coordination-diagnostics.mjs'

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

const expectedProductionMappings = {
  torch_torchvision: 'torch_torchvision',
  transformers: 'transformers',
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real_esrgan',
  kornia: 'kornia',
  rembg: 'rembg',
  transparent_background: 'transparent_background',
  d3: 'd3',
  echarts: 'echarts',
  vega_lite: 'vega_lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: 'svgdotjs_svg_js',
  viz_js: 'viz_js',
  lottie_web: 'lottie',
  animejs: 'animejs',
  three_js: 'three_js',
  pixi_js: 'pixijs',
  konva: 'konva',
  babylonjs: 'babylon_js',
}

const requiredFiles = [
  'server/tool-registry/ai-graphics-cross-owner-coordination.ts',
  'server/cli/ai-graphics-cross-owner-coordination.ts',
  'server/tool-registry/ai-graphics-tool-call-readiness.ts',
  'server/tool-registry/production-tool-profiles.ts',
  'server/tool-registry/index.ts',
  'scripts/validation/ai-graphics-cross-owner-coordination-diagnostics.mjs',
  'docs/tool-intelligence/ai-graphics/cross-owner-coordination.md',
  'docs/tool-intelligence/ai-graphics/cross-owner-coordination.json',
  'docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json',
  'docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-excluded-tools.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json',
]

const requiredTrueBooleans = [
  'crossOwnerCoordinationVerified',
  'all21AiGraphicsToolsCovered',
  'allAiGraphicsProductionMappingsPresent',
  'allAiGraphicsProductionMappingsUnique',
  'allAiGraphicsProductionProfilesExist',
  'productionRegistryToolIdsUnique',
  'trackAExcludedToolsNotClaimed',
  'trackBExclusionPreservedAsEvidenceOnly',
  'nonAiGraphicsReservedToolIdsNotClaimed',
  'internalOwnerLabelsNotProductCapabilityIds',
  'agentCanSelectForPlanning',
]

const requiredFalseBooleans = [
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
  'modelWeightsDownloaded',
  'mediaProcessingPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const forbiddenClaimPatterns = [
  /agentCanExecuteToolsNow["`:\s=]+true/i,
  /routeExecutionApprovedNow["`:\s=]+true/i,
  /workerExecutionApprovedNow["`:\s=]+true/i,
  /toolExecutionApprovedNow["`:\s=]+true/i,
  /providerRuntimeApprovedNow["`:\s=]+true/i,
  /browserWebglCanvasRuntimeApprovedNow["`:\s=]+true/i,
  /gpuRuntimeApprovedNow["`:\s=]+true/i,
  /runtimeReadyNow["`:\s=]+true/i,
  /internalBetaReadyNow["`:\s=]+true/i,
  /externalBetaReadyNow["`:\s=]+true/i,
  /productionReadyNow["`:\s=]+true/i,
  /\bdry_run_passed\b/i,
  /\bgenerated_local_fixture_passed\b/i,
]

const generatedOutputPathPatterns = [
  /^\.local-artifacts\//,
  /^public\/.*(?:render|media|canvas|webgl|artifact|output)/i,
  /^docs\/.*(?:\.png|\.jpg|\.jpeg|\.webp|\.mp4|\.mov|\.webm)$/i,
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

function runNpm(scriptName) {
  return execFileSync('npm', ['run', '--silent', scriptName], {
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

for (const filePath of requiredFiles) read(filePath)

const pkg = json('package.json')
const docsPacket = json('docs/tool-intelligence/ai-graphics/cross-owner-coordination.json')
const audit = json('docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json')
const contract = json('docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json')
const markdown = read('docs/tool-intelligence/ai-graphics/cross-owner-coordination.md')
const moduleSource = read('server/tool-registry/ai-graphics-cross-owner-coordination.ts')
const indexSource = read('server/tool-registry/index.ts')
const trackAExcludedSource = read('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-excluded-tools.md')
const trackAInventorySource = read('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json')
const runtimeOutput = parseOutput(runNpm(runScriptName), runScriptName)

if (pkg.scripts?.[runScriptName] !== runScriptCommand) fail(`missing_package_script:${runScriptName}`)
if (pkg.scripts?.[diagnosticScriptName] !== diagnosticScriptCommand) fail(`missing_package_script:${diagnosticScriptName}`)
if (!indexSource.includes("export * from './ai-graphics-cross-owner-coordination'")) fail('index_export_missing')
if (!moduleSource.includes('TRACK_B_MEDIA_OSS_STEWARD')) fail('module_missing_track_b_owner_route')
if (!moduleSource.includes('TRACK_A_RENDER_EXPORT')) fail('module_missing_track_a_owner_route')
if (!moduleSource.includes("'remotion'") || !moduleSource.includes("'revideo'")) fail('module_missing_track_a_excluded_ids')
if (!moduleSource.includes('@remotion/renderer')) fail('module_missing_remotion_renderer_package_exclusion')

for (const packet of [docsPacket, runtimeOutput]) {
  if (packet.decision !== 'ai_graphics_cross_owner_coordination_verified_without_duplicate_owner_claims') {
    fail(`unexpected_decision:${packet.decision}`)
  }
  if (packet.status !== 'verified_with_runtime_blocks') fail(`unexpected_status:${packet.status}`)
  if (packet.ownerRoute !== 'AI_TOOLS_CREATIVE_GRAPHICS') fail(`unexpected_owner_route:${packet.ownerRoute}`)
  if (packet.counts?.canonicalAiGraphicsTools !== 21) fail('canonical_tool_count_not_21')
  if (packet.counts?.toolCallRecords !== 21) fail('tool_call_record_count_not_21')
  if (packet.counts?.productionToolMappings !== 21) fail('production_mapping_count_not_21')
  if (packet.counts?.uniqueAiGraphicsProductionToolIds !== 21) fail('unique_production_mapping_count_not_21')
  if (packet.counts?.productionRegistryDuplicateToolIds !== 0) fail('production_registry_duplicate_count_not_zero')
  if (packet.counts?.missingProductionProfiles !== 0) fail('missing_production_profile_count_not_zero')
  if (packet.counts?.duplicateCanonicalToolIds !== 0) fail('duplicate_canonical_count_not_zero')
  if (packet.counts?.duplicateProductionToolIds !== 0) fail('duplicate_production_mapping_count_not_zero')
  if (packet.counts?.trackAExcludedOverlaps !== 0) fail('track_a_overlap_count_not_zero')
  if (packet.counts?.nonAiGraphicsReservedOverlaps !== 0) fail('reserved_non_ai_graphics_overlap_count_not_zero')
  if (packet.counts?.productFacingCapabilityIds !== 12) fail('product_capability_count_not_12')

  for (const key of requiredTrueBooleans) {
    if (packet.booleans?.[key] !== true) fail(`required_true_boolean_not_true:${key}`)
  }
  for (const key of requiredFalseBooleans) {
    if (packet.booleans?.[key] !== false) fail(`required_false_boolean_not_false:${key}`)
  }

  if (packet.duplicateCanonicalToolIds?.length !== 0) fail('duplicate_canonical_ids_not_empty')
  if (packet.duplicateProductionToolIds?.length !== 0) fail('duplicate_production_ids_not_empty')
  if (packet.productionRegistryDuplicateToolIds?.length !== 0) fail('production_registry_duplicate_ids_not_empty')
  if (packet.missingProductionProfiles?.length !== 0) fail('missing_production_profiles_not_empty')
  if (packet.trackAExcludedOverlaps?.length !== 0) fail('track_a_overlaps_not_empty')
  if (packet.nonAiGraphicsReservedOverlaps?.length !== 0) fail('reserved_non_ai_graphics_overlaps_not_empty')
  if (packet.ownerExclusionEvidence?.trackA?.ownerRoute !== 'TRACK_A_RENDER_EXPORT') fail('track_a_owner_route_missing')
  if (packet.ownerExclusionEvidence?.trackB?.ownerRoute !== 'TRACK_B_MEDIA_OSS_STEWARD') fail('track_b_owner_route_missing')
  if (packet.ownerExclusionEvidence?.trackB?.status !== 'evidence_only_exclusion_context') fail('track_b_status_not_evidence_only')

  for (const tool of allTools) {
    if (packet.productionToolIdByCanonicalToolId?.[tool] !== expectedProductionMappings[tool]) {
      fail(`mapping_mismatch:${tool}:${packet.productionToolIdByCanonicalToolId?.[tool]}`)
    }
  }
}

if (audit.counts?.properlyInstalledForPlannedSurface !== 21) fail('audit_proper_install_count_not_21')
if (audit.counts?.productionToolIdMapped !== 21) fail('audit_production_mapping_count_not_21')
if (audit.counts?.heavyToolsIncorrectlyTargetingCpu !== 0) fail('audit_heavy_cpu_count_not_zero')
if (contract.toolCounts?.productionToolIdMapped !== 21) fail('contract_production_mapping_count_not_21')
if (contract.toolCounts?.planningWrapperWithoutProductionToolId !== 0) fail('contract_unmapped_wrapper_count_not_zero')

for (const tool of allTools) {
  if (!markdown.includes(`\`${tool}\``)) fail(`markdown_missing_tool:${tool}`)
  if (!Object.hasOwn(docsPacket.productionToolIdByCanonicalToolId || {}, tool)) fail(`docs_mapping_missing_tool:${tool}`)
}

for (const token of ['PR #542', 'PR #543', 'PR #544', 'TRACK_B_MEDIA_OSS_STEWARD', 'TRACK_A_RENDER_EXPORT']) {
  if (!markdown.includes(token) && !JSON.stringify(docsPacket).includes(token)) fail(`coordination_packet_missing_token:${token}`)
}

if (!trackAExcludedSource.includes('remotion') || !trackAExcludedSource.includes('@remotion/renderer')) {
  fail('track_a_excluded_doc_missing_remotion_exclusions')
}
if (!trackAInventorySource.includes('TRACK_A_RENDER_EXPORT')) fail('track_a_inventory_missing_owner')
if (!trackAInventorySource.includes('Revideo')) fail('track_a_inventory_missing_revideo')

for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(markdown)) fail(`forbidden_claim_in_markdown:${pattern}`)
  if (pattern.test(JSON.stringify(docsPacket))) fail(`forbidden_claim_in_json:${pattern}`)
}

const packageDiff = git(['diff', '--unified=0', baseRef, '--', 'package.json'])
const allowedPackageAdditions = new Set([
  `+    "${runScriptName}": "${runScriptCommand}",`,
  `+    "${diagnosticScriptName}": "${diagnosticScriptCommand}",`,
  '+    "ai-graphics:beta-tool-call-readiness": "tsx server/cli/ai-graphics-beta-tool-call-readiness.ts",',
  '+    "ai-graphics:beta-tool-call-readiness:diagnostics": "node scripts/validation/ai-graphics-beta-tool-call-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-owner-approval": "tsx server/cli/ai-graphics-internal-beta-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:beta-execution-handoff-readiness": "tsx server/cli/ai-graphics-beta-execution-handoff-readiness.ts",',
  '+    "ai-graphics:beta-execution-handoff-readiness:diagnostics": "node scripts/validation/ai-graphics-beta-execution-handoff-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-dry-run-readiness": "tsx server/cli/ai-graphics-internal-beta-dry-run-readiness.ts",',
  '+    "ai-graphics:internal-beta-dry-run-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-dry-run-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-worker-payload-readiness": "tsx server/cli/ai-graphics-internal-beta-worker-payload-readiness.ts",',
  '+    "ai-graphics:internal-beta-worker-payload-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-worker-payload-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-production-worker-job-readiness": "tsx server/cli/ai-graphics-internal-beta-production-worker-job-readiness.ts",',
  '+    "ai-graphics:internal-beta-production-worker-job-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-production-worker-job-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-production-worker-gate-readiness": "tsx server/cli/ai-graphics-internal-beta-production-worker-gate-readiness.ts",',
  '+    "ai-graphics:internal-beta-production-worker-gate-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-production-worker-gate-readiness-diagnostics.mjs",',
  '+    "ai-graphics:beta-production-readiness-rollup": "tsx server/cli/ai-graphics-beta-production-readiness-rollup.ts",',
  '+    "ai-graphics:beta-production-readiness-rollup:diagnostics": "node scripts/validation/ai-graphics-beta-production-readiness-rollup-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go": "tsx server/cli/ai-graphics-internal-beta-go-no-go.ts",',
  '+    "ai-graphics:internal-beta-go-no-go:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval": "tsx server/cli/ai-graphics-internal-beta-go-no-go-owner-approval.ts",',
  '+    "ai-graphics:internal-beta-go-no-go-owner-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-go-no-go-owner-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval": "tsx server/cli/ai-graphics-internal-beta-runtime-enqueue-approval.ts",',
  '+    "ai-graphics:internal-beta-runtime-enqueue-approval:diagnostics": "node scripts/validation/ai-graphics-internal-beta-runtime-enqueue-approval-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-admission-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-admission-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-admission-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-adapter-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-adapter-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-adapter-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness": "tsx server/cli/ai-graphics-internal-beta-queue-dispatcher-readiness.ts",',
  '+    "ai-graphics:internal-beta-queue-dispatcher-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-queue-dispatcher-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness": "tsx server/cli/ai-graphics-internal-beta-backend-queue-storage-readiness.ts",',
  '+    "ai-graphics:internal-beta-backend-queue-storage-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-backend-queue-storage-readiness-diagnostics.mjs",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness": "tsx server/cli/ai-graphics-internal-beta-service-role-queue-transaction-readiness.ts",',
  '+    "ai-graphics:internal-beta-service-role-queue-transaction-readiness:diagnostics": "node scripts/validation/ai-graphics-internal-beta-service-role-queue-transaction-readiness-diagnostics.mjs",',
])
for (const line of packageDiff.split('\n')) {
  if (!line || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
  if (line.startsWith('+') && allowedPackageAdditions.has(line)) continue
  if (line.startsWith('+') || line.startsWith('-')) fail(`unexpected_package_json_diff:${line}`)
}

if (git(['diff', '--name-only', baseRef, '--', 'package-lock.json'])) fail('package_lock_changed')

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const filePath of trackedFiles) {
  if (generatedOutputPathPatterns.some((pattern) => pattern.test(filePath))) {
    fail(`generated_or_local_artifact_tracked:${filePath}`)
  }
}

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const filePath of stagedFiles) {
  if (generatedOutputPathPatterns.some((pattern) => pattern.test(filePath))) {
    fail(`generated_or_local_artifact_staged:${filePath}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'failed', failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  decision: docsPacket.decision,
  toolsCoordinated: docsPacket.counts.canonicalAiGraphicsTools,
  productionMappings: docsPacket.counts.productionToolMappings,
  duplicateProductionToolIds: docsPacket.counts.duplicateProductionToolIds,
  trackAExcludedOverlaps: docsPacket.counts.trackAExcludedOverlaps,
  nonAiGraphicsReservedOverlaps: docsPacket.counts.nonAiGraphicsReservedOverlaps,
  agentCanExecuteToolsNow: docsPacket.booleans.agentCanExecuteToolsNow,
  runtimeReadyNow: docsPacket.booleans.runtimeReadyNow,
}, null, 2))
