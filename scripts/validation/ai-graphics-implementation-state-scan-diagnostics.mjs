import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-owner-assignment-registry'
const expectedDecision = 'ai_graphics_implementation_state_scan_completed_ready_for_draft_proof_promotion_review'

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-implementation-state-scan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-implementation-state-scan.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cloud-milestone-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cloud-milestone-plan.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-duplicate-implementation-scan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-duplicate-implementation-scan.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-gpu-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-model-weight-provenance-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-browser-webgl-canvas-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-install-proof-milestones.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-blocked-and-deferred-tools.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-next-action-batches.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-implementation-state-decision.md',
  'docs/prompt-ai-graphics-implementation-state-scan-cloud-milestone-plan-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-implementation-state-scan-cloud-milestone-plan.md',
]

const expectedTools = [
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

const expectedTrackBTools = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'duckdb',
  'polars',
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddleocr',
  'paddlepaddle',
  'mediainfo',
  'exiftool',
  'imagemagick_graphicsmagick',
  'tesseract',
  'opencolorio',
  'openimageio',
]

const expectedTrackATools = [
  'remotion',
  'film',
  'libass',
  'opentimelineio',
  'hyperframe',
  'gstreamer',
  'bento4_mp4box',
  'mkvtoolnix',
  'vapoursynth',
  'revideo',
]

const requiredToolFields = [
  'toolId',
  'displayName',
  'packageName',
  'ownerId',
  'ownerLane',
  'alreadyAssignedElsewhere',
  'duplicateRisk',
  'canonicalStatusFromPr416',
  'draftEvidencePrs',
  'packageJsonEvidence',
  'packageLockEvidence',
  'scriptEvidence',
  'diagnosticEvidence',
  'toolRouteEvidence',
  'workerEvidence',
  'currentInstallState',
  'currentProofState',
  'needsInstall',
  'needsImportSmoke',
  'needsSyntheticFixture',
  'needsGpuProof',
  'needsModelWeightReview',
  'needsBrowserWebglCanvasProof',
  'needsRouteIntegration',
  'needsWorkerIntegration',
  'cloudExecutionTarget',
  'estimatedWeight',
  'blockedReason',
  'nextMilestone',
  'recommendedBatch',
  'doNotRunYetScopes',
]

const allowedCloudTargets = new Set([
  'docs_static_only',
  'cloud_run_cpu_job',
  'cloud_run_gpu_l4_job',
  'cloud_run_gpu_heavy_later',
  'browser_webgl_sandbox_later',
  'model_weight_review_later',
  'defer_or_drop_after_backlog_review',
])

const requiredTrueBooleans = [
  'implementationStateScanCompleted',
  'all21ToolsScanned',
  'trackBToolsExcluded',
  'trackAToolsExcluded',
]

const requiredFalseBooleans = [
  'duplicateOwnerConflictFound',
  'exclusiveOwnershipClaimed',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightDownloadPerformed',
  'supabaseMutationPerformed',
  'sqlExecutionPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]

const forbiddenClaimPatterns = [
  ['exclusive_ownership_claim', /\bexclusiveOwnershipClaimed\b\s*[:=]\s*`?true`?/i],
  ['all_tools_installed_claim', /\ball tools (?:are )?installed\b/i],
  ['e2e_proof_claim', /\bE2E[- ]proof\b\s*[:=]\s*`?(true|claimed|approved|passed)`?/i],
  ['gpu_runtime_claim', /\bgpuRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['model_weight_download_claim', /\bmodelWeightDownloadPerformed\b\s*[:=]\s*`?true`?/i],
  ['browser_runtime_claim', /\bbrowserWebglCanvasRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['tool_execution_claim', /\btoolExecutionPerformed\b\s*[:=]\s*`?true`?/i],
  ['worker_execution_claim', /\bworkerExecutionPerformed\b\s*[:=]\s*`?true`?/i],
  ['route_execution_claim', /\brouteExecutionPerformed\b\s*[:=]\s*`?true`?/i],
  ['provider_runtime_claim', /\bproviderRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['supabase_sql_gcs_claim', /\b(supabaseMutationPerformed|sqlExecutionPerformed|gcsUploadPerformed)\b\s*[:=]\s*`?true`?/i],
  ['public_signed_claim', /\b(publicArtifactCreated|signedUrlCreated)\b\s*[:=]\s*`?true`?/i],
  ['internal_beta_claim', /\binternalBetaReadyNow\b\s*[:=]\s*`?true`?/i],
  ['external_beta_claim', /\bexternalBetaReadyNow\b\s*[:=]\s*`?true`?/i],
  ['production_claim', /\bproductionReadyNow\b\s*[:=]\s*`?true`?/i],
  ['generic_dry_run_passed_claim', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
  ['generated_local_fixture_passed_claim', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
]

const failures = []

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const required of [
  expectedDecision,
  'PR #543',
  'PR #536',
  'PR #416',
  'PR #425',
  'PR #433',
  'PR #441',
  'PR #532',
  'TRACK_B_MEDIA_OSS_STEWARD',
  'PR #544',
  'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_PROMOTION_REVIEW',
]) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}

let stateScan = {}
let cloudPlan = {}
let ledger = {}
let duplicateScan = {}
try {
  stateScan = readJson('docs/open-source-tool-stack/ownership/ai-graphics-implementation-state-scan.json')
  cloudPlan = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cloud-milestone-plan.json')
  ledger = readJson('docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json')
  duplicateScan = readJson('docs/open-source-tool-stack/ownership/ai-graphics-duplicate-implementation-scan.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

if (stateScan.decision !== expectedDecision) failures.push('unexpected_state_scan_decision')
if (cloudPlan.decision !== expectedDecision) failures.push('unexpected_cloud_plan_decision')
if (ledger.decision !== expectedDecision) failures.push('unexpected_ledger_decision')
if (duplicateScan.decision !== expectedDecision) failures.push('unexpected_duplicate_scan_decision')

const stateTools = stateScan.tools ?? []
const ledgerTools = (ledger.evidenceLedger ?? []).map((entry) => entry.toolId)
const planOrBlockedTools = [
  ...(cloudPlan.tools ?? []).map((entry) => entry.toolId),
  ...((duplicateScan.backgroundRemovalBacklogOverlap ?? [])),
]

for (const toolId of expectedTools) {
  const stateTool = stateTools.find((tool) => tool.toolId === toolId)
  if (!stateTool) {
    failures.push(`state_scan_missing_tool:${toolId}`)
    continue
  }
  for (const field of requiredToolFields) {
    if (!(field in stateTool)) failures.push(`tool_missing_field:${toolId}:${field}`)
  }
  if (stateTool.ownerId !== 'atlas_ai_graphics_worker_owner') failures.push(`tool_wrong_owner:${toolId}`)
  if (stateTool.ownerLane !== 'AI_TOOLS_CREATIVE_GRAPHICS') failures.push(`tool_wrong_lane:${toolId}`)
  if (stateTool.alreadyAssignedElsewhere !== false) failures.push(`tool_assigned_elsewhere:${toolId}`)
  if (!allowedCloudTargets.has(stateTool.cloudExecutionTarget)) failures.push(`invalid_cloud_target:${toolId}:${stateTool.cloudExecutionTarget}`)
  if (stateTool.runtimeReadyNow !== false) failures.push(`tool_runtime_ready_not_false:${toolId}`)
  if (stateTool.internalBetaReadyNow !== false) failures.push(`tool_internal_beta_not_false:${toolId}`)
  if (stateTool.productionReadyNow !== false) failures.push(`tool_production_not_false:${toolId}`)
  if (!Array.isArray(stateTool.doNotRunYetScopes) || stateTool.doNotRunYetScopes.length < 10) {
    failures.push(`tool_missing_do_not_run_scopes:${toolId}`)
  }
  if (!ledgerTools.includes(toolId)) failures.push(`ledger_missing_tool:${toolId}`)
  if (!planOrBlockedTools.includes(toolId)) failures.push(`plan_or_blocked_missing_tool:${toolId}`)
}

if (stateTools.length !== expectedTools.length) failures.push(`unexpected_state_tool_count:${stateTools.length}`)

for (const toolId of expectedTrackBTools) {
  if (!stateScan.trackBToolsExcluded?.includes(toolId)) failures.push(`trackb_not_excluded:${toolId}`)
  if (docsText.includes(`| ${toolId} | owned_by_atlas`)) failures.push(`trackb_owned_by_atlas:${toolId}`)
}

for (const toolId of expectedTrackATools) {
  if (!stateScan.trackAOwnerContext?.excludedTools?.includes(toolId)) failures.push(`tracka_not_excluded:${toolId}`)
  if (docsText.includes(`| ${toolId} | owned_by_atlas`)) failures.push(`tracka_owned_by_atlas:${toolId}`)
}

if (stateScan.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (stateScan.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_ownership_not_false')
if (duplicateScan.duplicateOwnerConflictFound !== false) failures.push('duplicate_owner_conflict_not_false')

for (const field of requiredTrueBooleans) {
  if (stateScan.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}

for (const field of requiredFalseBooleans) {
  if (stateScan.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}

for (const milestone of [
  'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_PROMOTION_REVIEW',
  'AI_GRAPHICS_CPU_IMPORT_PROOF_APPROVAL_FOUNDATION',
  'AI_GRAPHICS_CPU_IMPORT_PROOF_EXECUTION_FOUNDATION',
  'AI_GRAPHICS_MODEL_TOOL_IMPORT_POLICY_APPROVAL',
  'AI_GRAPHICS_MODEL_TOOL_IMPORT_POLICY_EXECUTION',
  'AI_GRAPHICS_GPU_SMOKE_PROOF_APPROVAL',
  'AI_GRAPHICS_GPU_SMOKE_PROOF_EXECUTION',
  'AI_GRAPHICS_MODEL_WEIGHT_PROVENANCE_APPROVAL',
  'AI_GRAPHICS_SYNTHETIC_MODEL_PROOF_EXECUTION',
  'AI_GRAPHICS_BROWSER_CANVAS_WEBGL_SANDBOX_APPROVAL',
  'AI_GRAPHICS_E2E_SYNTHETIC_PROOF_ROLLUP',
]) {
  if (!cloudPlan.milestones?.some((entry) => entry.milestoneId === milestone)) {
    failures.push(`missing_milestone:${milestone}`)
  }
}

for (const [name, pattern] of forbiddenClaimPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  const expectedScript = 'node scripts/validation/ai-graphics-implementation-state-scan-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:implementation-state-scan:diagnostics'] !== expectedScript) {
    failures.push('missing_package_script')
  }
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]).trim() !== readFileSync('package-lock.json', 'utf8').trim()) {
    failures.push('package_lock_changed')
  }
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

let changedFiles = []
try {
  changedFiles = [
    git(['diff', '--name-only', `${baseRef}...HEAD`]),
    git(['diff', '--name-only']),
    git(['diff', '--cached', '--name-only']),
    git(['ls-files', '--others', '--exclude-standard']),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
} catch (error) {
  failures.push(`changed_file_scan_failed:${error.message}`)
}

const forbiddenPath = changedFiles.find((path) =>
  path.startsWith('.local-artifacts/') ||
  /(^|\/)(media|render|browser|canvas|webgl|public-artifacts|generated-artifacts)(\/|$)/i.test(path),
)
if (forbiddenPath) failures.push(`forbidden_changed_artifact_path:${forbiddenPath}`)

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)
} catch (error) {
  failures.push(`local_artifact_scan_failed:${error.message}`)
}

if (failures.length) {
  console.error('AI graphics implementation state scan diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics implementation state scan diagnostics passed.')
