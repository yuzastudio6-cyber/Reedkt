import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-open-source-tool-stack-refresh-after-ai-graphics-worker-qa-review'

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/owner-assignment-registry.md',
  'docs/open-source-tool-stack/ownership/owner-assignment-registry.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-owner-assignment.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-owner-assignment.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-owned-tool-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-owned-tool-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-duplicate-risk-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-implementation-responsibility.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-next-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-owner-assignment-decision.md',
  'docs/prompt-ai-graphics-owner-assignment-registry-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-owner-assignment-registry.md',
]

const crossChatDocs = [
  'docs/cross-chat/OWNER_MATRIX.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
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

const forbiddenAssignedIds = [
  'remotion',
  'film',
  'libass',
  'opentimelineio',
  'gstreamer',
  'bento4_mp4box',
  'mkvtoolnix',
  'vapoursynth',
  'revideo',
  'ffmpeg',
  'ffprobe',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
  'paddleocr',
  'paddlepaddle',
  'mediainfo',
  'exiftool',
  'imagemagick_graphicsmagick',
  'tesseract',
  'opencolorio',
  'openimageio',
  'deepfilternet',
  'signalsmith_stretch',
  'audioflux',
  'maplibre',
  'turf',
  'vllm',
  'qwen_deepseek_provider_api',
]

const requiredTrueBooleans = [
  'ownerAssignmentCreated',
  'ownerIdRegistered',
  'centralRegistryUpdated',
  'crossChatFilesUpdated',
  'duplicateRiskFound',
  'pendingDuplicateReview',
]

const requiredFalseBooleans = [
  'exclusiveOwnershipClaimed',
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
  'supabaseMutationPerformed',
  'sqlExecutionPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const forbiddenClaimPatterns = [
  ['runtime_ready_true', /\b(runtimeReadyNow|runtime-ready status|runtime ready now)\b\s*[:|=]\s*`?(true|ready|approved|enabled)`?/i],
  ['internal_beta_ready_true', /\b(internalBetaReadyNow|internal-beta-ready status|internal beta ready now)\b\s*[:|=]\s*`?(true|ready|approved|enabled)`?/i],
  ['external_beta_ready_true', /\b(externalBetaReadyNow|external beta ready now)\b\s*[:|=]\s*`?(true|ready|approved|enabled)`?/i],
  ['production_ready_true', /\b(productionReadyNow|production-ready status|production ready now)\b\s*[:|=]\s*`?(true|ready|approved|enabled)`?/i],
  ['e2e_proof_claim', /\bE2E[- ]proof\b\s*[:|=]\s*`?(true|claimed|approved|passed)`?/i],
  ['tool_execution_true', /\b(toolExecutionPerformed|actual tool execution)\b\s*[:|=]\s*`?(true|executed|approved|enabled)`?/i],
  ['worker_execution_true', /\b(workerExecutionPerformed|worker execution)\b\s*[:|=]\s*`?(true|executed|approved|enabled)`?/i],
  ['route_execution_true', /\b(routeExecutionPerformed|route execution)\b\s*[:|=]\s*`?(true|executed|approved|enabled)`?/i],
  ['provider_runtime_true', /\b(providerRuntimePerformed|provider\/model runtime)\b\s*[:|=]\s*`?(true|executed|approved|enabled)`?/i],
  ['supabase_sql_gcs_true', /\b(supabaseMutationPerformed|sqlExecutionPerformed|gcsUploadPerformed)\b\s*[:|=]\s*`?true`?/i],
  ['signed_public_true', /\b(publicArtifactCreated|signedUrlCreated)\b\s*[:|=]\s*`?true`?/i],
  ['generic_dry_run_passed_true', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
  ['generated_local_fixture_passed_true', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
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

for (const path of crossChatDocs) {
  if (!existsSync(path)) failures.push(`missing_cross_chat_doc:${path}`)
}

const docsText = [...requiredDocs, ...crossChatDocs, 'docs/production-beta-readiness-scorecard.md']
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes('ai_graphics_owner_assignment_registered_pending_duplicate_review')) {
  failures.push('missing_expected_decision')
}

for (const required of [
  'Atlas — AI Graphics & Worker Metadata Owner',
  'atlas_ai_graphics_worker_owner',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'pending_duplicate_review',
  'PR #416',
  'PR #534',
  'PR #536',
  'PR #532',
  'exclusiveOwnershipClaimed',
  'duplicateRiskFound',
]) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}

let assignment = {}
let matrix = {}
let registry = {}
try {
  assignment = readJson('docs/open-source-tool-stack/ownership/ai-graphics-owner-assignment.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-owned-tool-matrix.json')
  registry = readJson('docs/open-source-tool-stack/ownership/owner-assignment-registry.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

if (assignment.ownerDisplayName !== 'Atlas — AI Graphics & Worker Metadata Owner') failures.push('invalid_owner_display_name')
if (assignment.ownerId !== 'atlas_ai_graphics_worker_owner') failures.push('invalid_owner_id')
if (assignment.ownerLane !== 'AI_TOOLS_CREATIVE_GRAPHICS') failures.push('invalid_owner_lane')
if (assignment.assignmentStatus !== 'pending_duplicate_review') failures.push('invalid_assignment_status')
if (registry.assignments?.[0]?.ownerId !== 'atlas_ai_graphics_worker_owner') failures.push('registry_missing_owner_id')

const assignedTools = matrix.tools?.map((tool) => tool.toolId).sort() ?? []
if (JSON.stringify(assignedTools) !== JSON.stringify([...expectedTools].sort())) {
  failures.push(`unexpected_tool_set:${assignedTools.join(',')}`)
}

for (const tool of expectedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}

for (const forbidden of forbiddenAssignedIds) {
  if (assignedTools.includes(forbidden)) failures.push(`forbidden_assigned_tool:${forbidden}`)
}

const booleans = assignment.booleans ?? {}
for (const field of requiredTrueBooleans) {
  if (booleans[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (booleans[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}

for (const path of crossChatDocs) {
  if (existsSync(path) && !readFileSync(path, 'utf8').includes('atlas_ai_graphics_worker_owner')) {
    failures.push(`cross_chat_missing_owner_id:${path}`)
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
  const expectedScript = 'node scripts/validation/ai-graphics-owner-assignment-registry-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:owner-assignment:diagnostics'] !== expectedScript) {
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
  console.error('AI graphics owner assignment registry diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics owner assignment registry diagnostics passed.')
