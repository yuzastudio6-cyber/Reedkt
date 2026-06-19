import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/tool-ownership/central-tool-owner-registry.md',
  'docs/tool-ownership/central-tool-owner-registry.json',
  'docs/tool-ownership/owner-atlas-tracka-visual-render-export.md',
  'docs/tool-ownership/tool-owner-conflict-check-policy.md',
  'docs/tool-ownership/tool-owner-next-phase-plan.md',
  'docs/activation-phase-tool-owner-registry-1-results.md',
  'docs/implementation-prompts/prompt-tool-owner-conflict-scan-1.md',
  'docs/implementation-prompts/prompt-tracka-open-source-tool-inventory-1.md',
  'scripts/validation/tool-owner-registry-1-diagnostics.mjs',
]

const claimedScopedTools = [
  'remotion_render_validation',
  'opentimelineio_timeline_validation',
  'hyperframe_render_handoff',
  'libass_caption_burnin',
  'gstreamer_render_pipeline_support',
  'bento4_mp4box_packaging_validation',
  'mkvtoolnix_container_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'film_frame_interpolation',
  'tracka_caption_burnin_policy_e2e',
  'tracka_render_export_private_review_path',
  'tracka_visual_video_private_e2e',
]

const sharedDependenciesOwnedElsewhere = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'opencolorio',
  'openimageio',
  'sam2',
  'kornia',
  'birefnet',
  'real_esrgan',
]

const trackB16 = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'duckdb',
  'polars_nodejs_polars',
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

const aiGraphicsRequired = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
]

const forbiddenClaimFields = [
  'claimedTools',
  'ownedTools',
]

const requiredText = [
  'owner_tracka_visual_render_export',
  'Atlas Track A',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'tracka_scoped_visual_render_export_ownership',
  'ownership_claim_scoped_pending_merge_order',
  'completed_expanded_scoped_ownership_repair_clean',
  'resolved_to_expanded_scoped_tracka_claims',
  'claimedScopedTools',
  'sharedDependenciesOwnedElsewhere',
  'dropped_to_track_b_owner',
  'dropped_to_ai_graphics_worker_owner',
  'TRACK_B_MEDIA_OSS_STEWARD owns exactly these 16 tools',
  'AI Tools / Creative Graphics / Worker owns',
  'Product-ready end-to-end local OSS tools remain `0`',
  '#544 Track A visual render owner',
  '#543 AI Graphics owner assignment',
  '#542 Track B media OSS steward owner registry',
  '#534 Open-source tool stack refresh after AI graphics worker',
  '#536 Open-source tool stack refresh after AI graphics worker QA review',
  'docs/tool-ownership/central-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/',
  'docs/open-source-tool-stack/ownership/',
  'Unresolved conflicts: none',
  'MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544',
  'TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1',
  'package-lock.json unchanged',
  'Supabase update status: not_applicable_docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /tools? installed:\s*(?!none)/i,
  /runtime execution (?:was )?enabled/i,
  /media processing (?:was )?enabled/i,
  /browser capture (?:was )?enabled/i,
  /provider call (?:was )?enabled/i,
  /model call (?:was )?enabled/i,
  /worker execution (?:was )?enabled/i,
  /route execution (?:was )?enabled/i,
  /Supabase mutation (?:was )?enabled/i,
  /SQL execution (?:was )?enabled/i,
  /dependency mutation (?:was )?enabled/i,
  /internal beta unlock (?:was )?enabled/i,
  /external beta unlock (?:was )?enabled/i,
  /production unlock (?:was )?enabled/i,
  /final render\/export (?:was )?enabled/i,
  /signed URL creation (?:was )?enabled/i,
  /public artifact creation (?:was )?enabled/i,
  /Internal beta unlocked:\s*true/i,
  /trackAInternalBetaUnlocked:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
]

const allowedFiles = new Set([...requiredFiles, 'package.json'])

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  return readFileSync(file, 'utf8')
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tool-owner-registry-1-diagnostics.mjs'
if (packageJson.scripts?.['tool-owner-registry:diagnostics'] !== expectedScript) {
  fail('missing package script: tool-owner-registry:diagnostics')
}

const registry = JSON.parse(read('docs/tool-ownership/central-tool-owner-registry.json'))
if (registry.schemaVersion !== 1) fail('registry schemaVersion must be 1')
if (!registry.centralRegistryPathDecision?.includes('docs/tool-ownership/central-tool-owner-registry.json')) {
  fail('missing central registry path decision')
}

const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing owner record owner_tracka_visual_render_export')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.status !== 'ownership_claim_scoped_pending_merge_order') fail('owner status mismatch')
if (owner.currentStatus !== 'ownership_claim_scoped_pending_merge_order') fail('owner currentStatus mismatch')
if (owner.responsibilityType !== 'tracka_scoped_visual_render_export_ownership') {
  fail('responsibilityType mismatch')
}
if (owner.duplicateRisk !== 'resolved_to_expanded_scoped_tracka_claims') fail('duplicateRisk mismatch')
if (owner.nextPrompt !== 'MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544') fail('nextPrompt mismatch')
if (owner.postMergeNextPrompt !== 'TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1') fail('postMergeNextPrompt mismatch')
if (owner.conflictScanRequiredBeforeImplementation !== true) fail('conflictScanRequiredBeforeImplementation must be true')
if (owner.duplicateCheckRequiredBeforeImplementation !== true) fail('duplicateCheckRequiredBeforeImplementation must be true')
if (owner.productReadyEndToEndLocalOssTools !== 0) fail('productReadyEndToEndLocalOssTools must be 0')

for (const field of forbiddenClaimFields) {
  if (Object.hasOwn(owner, field)) fail(`stale broad ownership field present: ${field}`)
}

if (!Array.isArray(owner.claimedScopedTools)) fail('claimedScopedTools missing')
for (const claim of claimedScopedTools) {
  if (!owner.claimedScopedTools.includes(claim)) fail(`registry JSON missing claimed scoped tool: ${claim}`)
}
if (owner.claimedScopedTools.length !== claimedScopedTools.length) {
  fail(`claimedScopedTools must contain exactly ${claimedScopedTools.length} entries`)
}

if (!Array.isArray(owner.sharedDependenciesOwnedElsewhere)) fail('sharedDependenciesOwnedElsewhere missing')
for (const dep of sharedDependenciesOwnedElsewhere) {
  if (!owner.sharedDependenciesOwnedElsewhere.includes(dep)) {
    fail(`missing shared dependency owned elsewhere: ${dep}`)
  }
  if (owner.claimedScopedTools.includes(dep)) fail(`raw global dependency claimed by Atlas Track A: ${dep}`)
}

if (!Array.isArray(owner.droppedClaims)) fail('droppedClaims missing')
for (const dep of sharedDependenciesOwnedElsewhere) {
  if (!owner.droppedClaims.includes(dep)) fail(`missing dropped claim: ${dep}`)
}

for (const dep of ['ffmpeg', 'ffprobe', 'sharp_libvips', 'opencolorio', 'openimageio']) {
  if (!owner.droppedClaimGroups?.dropped_to_track_b_owner?.includes(dep)) {
    fail(`missing Track B dropped claim: ${dep}`)
  }
}
for (const dep of ['sam2', 'kornia', 'birefnet', 'real_esrgan']) {
  if (!owner.droppedClaimGroups?.dropped_to_ai_graphics_worker_owner?.includes(dep)) {
    fail(`missing AI Graphics dropped claim: ${dep}`)
  }
}

for (const tool of trackB16) {
  if (!owner.explicitlyNotOwnedToolSets?.trackBMediaOssStewardOwnsExactly16Tools?.includes(tool)) {
    fail(`missing Track B 16-tool ownership entry: ${tool}`)
  }
}
if (owner.explicitlyNotOwnedToolSets.trackBMediaOssStewardOwnsExactly16Tools.length !== 16) {
  fail('Track B media OSS steward list must contain exactly 16 tools')
}
for (const tool of aiGraphicsRequired) {
  if (!owner.explicitlyNotOwnedToolSets?.aiGraphicsWorkerOwns?.includes(tool)) {
    fail(`missing AI Graphics ownership entry: ${tool}`)
  }
}

for (const pr of ['#544', '#543', '#542', '#534', '#536', '#529', '#533']) {
  const hit = owner.conflictScan?.sourcePullRequests?.some((entry) => entry.includes(pr))
  if (!hit) fail(`missing conflict scan source PR: ${pr}`)
}

if (owner.conflictScan?.scanStatus !== 'completed_clean_after_expanded_scoped_repair') {
  fail('conflict scan status mismatch')
}
if (!Array.isArray(owner.conflictScan?.unresolvedConflicts) || owner.conflictScan.unresolvedConflicts.length !== 0) {
  fail('unresolved conflicts must be empty')
}

for (const claim of claimedScopedTools) {
  const hit = owner.conflictScan?.candidateToolDecisions?.some(
    (entry) => entry.toolId === claim && entry.classification === 'keep_owned_by_atlas_tracka',
  )
  if (!hit) fail(`missing keep decision for claimed scoped tool: ${claim}`)
}
for (const dep of sharedDependenciesOwnedElsewhere) {
  const hit = owner.conflictScan?.candidateToolDecisions?.some(
    (entry) => entry.toolId === dep && entry.classification === 'owned_by_other_workstream_drop_from_atlas',
  )
  if (!hit) fail(`missing drop decision for shared dependency: ${dep}`)
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
for (const token of [...requiredText, ...claimedScopedTools, ...sharedDependenciesOwnedElsewhere, ...trackB16, ...aiGraphicsRequired]) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(allText)) fail(`forbidden claim matched: ${pattern}`)
}

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (packageLockStatus) fail(`package-lock.json changed: ${packageLockStatus}`)

const changedFiles = execFileSync('git', ['diff', '--name-only'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)
const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)
const untrackedFiles = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  env: gitEnv,
})
  .trim()
  .split('\n')
  .filter(Boolean)

for (const file of [...new Set([...changedFiles, ...stagedFiles, ...untrackedFiles])]) {
  if (file.includes('/._') || file.startsWith('._')) fail(`AppleDouble metadata file present: ${file}`)
  if (file === 'package-lock.json') fail('package-lock.json changed')
  if (file.startsWith('supabase/') || file.endsWith('.sql')) fail(`Supabase or SQL file changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/')) {
    fail(`runtime/source file changed: ${file}`)
  }
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (!allowedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

console.log('TOOL-OWNER-REGISTRY-1 diagnostics passed')
console.log('TOOL-OWNER-CONFLICT-SCAN-1 decision: completed_expanded_scoped_ownership_repair_clean')
console.log('Owner registered: Atlas Track A')
console.log('Owner ID: owner_tracka_visual_render_export')
console.log('Workstream: TRACK_A_VISUAL_RENDER_EXPORT')
console.log('Current status: ownership_claim_scoped_pending_merge_order')
console.log(`Claimed scoped tools: ${claimedScopedTools.length}`)
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Unresolved conflicts: none')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
