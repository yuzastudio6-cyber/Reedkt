import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-duplicate-scan.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-install-evidence.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-runtime-lanes.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-blocked-scope-register.md',
  'docs/track-a/atlas-tracka-open-source-tool-inventory-1-milestone-plan.md',
  'docs/activation-phase-tracka-open-source-tool-inventory-1-results.md',
  'docs/implementation-prompts/prompt-tracka-core-render-caption-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-open-source-tool-inventory-1-diagnostics.mjs',
]

const scopedTools = [
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

const trackBOwnedTools = [
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

const aiGraphicsOwnedTools = [
  'sam2',
  'kornia',
  'birefnet',
  'real_esrgan',
  'd3',
  'echarts',
  'vega',
  'vega_lite',
  'satori',
  'svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three',
  'pixi_js',
  'konva',
  'babylonjs',
  'torch',
  'torchvision',
  'transformers',
  'rembg',
  'transparent_background',
]

const requiredText = [
  'TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '#544',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'ownership_claim_scoped_pending_merge_order',
  'Product-ready end-to-end local OSS tools: `0`',
  'completed_inventory_duplicate_scan_ready_for_core_render_caption_install_proof',
  'completed_docs_only_inventory',
  'completed_no_unresolved_conflicts',
  'claimedScopedTools',
  'claimedTools',
  'ownedTools',
  'installed_with_source_evidence',
  'not_installed',
  'planned_only',
  'docs_only',
  'implementation_partial',
  'implementation_missing',
  'blocked_pending_runtime_lane',
  'blocked_pending_model_weight_review',
  'blocked_pending_private_e2e',
  'no_duplicate_found',
  'cpu_render_worker',
  'cpu_native_container_worker',
  'gpu_vision_worker',
  'planning_only',
  'e2e_workflow',
  'TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1',
  'TRACKA-REMOTION-RENDER-VALIDATION-1',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1',
  'TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1',
  'docker/prod/render-worker/requirements.render.txt',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/requirements.readiness.txt',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'package-lock status: `unchanged`',
  'Supabase update status: `not_applicable_docs_only`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /internal beta.*unlocked:\s*(true|enabled|approved)/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /tool installation:\s*(enabled|true|completed)/i,
  /tools? installed:\s*(?!none|not_installed)/i,
  /tool execution:\s*(enabled|true|completed)/i,
  /media processing:\s*(enabled|true|completed)/i,
  /worker execution:\s*(enabled|true|completed)/i,
  /route execution:\s*(enabled|true|completed)/i,
  /provider call:\s*(enabled|true|completed)/i,
  /model call:\s*(enabled|true|completed)/i,
  /Supabase mutation:\s*(enabled|true|completed)/i,
  /SQL execution:\s*(enabled|true|completed)/i,
  /signed URL creation:\s*(enabled|true|completed)/i,
  /public artifact creation:\s*(enabled|true|completed)/i,
  /dependency mutation:\s*(enabled|true|completed)/i,
  /package-lock changed/i,
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
const expectedScript = 'node scripts/validation/tracka-open-source-tool-inventory-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:open-source-tool-inventory-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:open-source-tool-inventory-1:diagnostics')
}

const registry = JSON.parse(read('docs/tool-ownership/central-tool-owner-registry.json'))
const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing Atlas Track A owner record')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.status !== 'ownership_claim_scoped_pending_merge_order') fail('owner status mismatch')
if (owner.currentStatus !== 'ownership_claim_scoped_pending_merge_order') fail('owner currentStatus mismatch')
if (owner.productReadyEndToEndLocalOssTools !== 0) fail('productReadyEndToEndLocalOssTools must remain 0')
if (Object.hasOwn(owner, 'claimedTools')) fail('Atlas Track A must not use claimedTools')
if (Object.hasOwn(owner, 'ownedTools')) fail('Atlas Track A must not use ownedTools')
if (!Array.isArray(owner.claimedScopedTools)) fail('claimedScopedTools missing')
if (owner.claimedScopedTools.length !== scopedTools.length) fail('claimedScopedTools count mismatch')
for (const tool of scopedTools) {
  if (!owner.claimedScopedTools.includes(tool)) fail(`missing scoped tool in owner registry: ${tool}`)
}
for (const tool of [...trackBOwnedTools, ...aiGraphicsOwnedTools]) {
  if (owner.claimedScopedTools.includes(tool)) fail(`Atlas Track A claims non-owned global tool: ${tool}`)
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
const claimText = requiredFiles
  .filter((file) => file !== 'scripts/validation/tracka-open-source-tool-inventory-1-diagnostics.mjs')
  .map((file) => read(file))
  .join('\n')
for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}
for (const tool of [...scopedTools, ...trackBOwnedTools, ...aiGraphicsOwnedTools]) {
  if (!allText.includes(tool)) fail(`missing tool text: ${tool}`)
}

const matrixText = read('docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md')
for (const tool of scopedTools) {
  const pattern = new RegExp(`## ${tool}[\\s\\S]*?scopedToolId: \`${tool}\`[\\s\\S]*?duplicateStatus: \`no_duplicate_found\`[\\s\\S]*?currentInstallStatus: \`[^\\n]+\`[\\s\\S]*?currentImplementationStatus: \`[^\\n]+\`[\\s\\S]*?runtimeLane: \`[^\\n]+\`[\\s\\S]*?nextRequiredMilestone: \`[^\\n]+\``, 'm')
  if (!pattern.test(matrixText)) fail(`matrix row missing required fields for ${tool}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(claimText)) fail(`forbidden claim matched: ${pattern}`)
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

console.log('TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1 diagnostics passed')
console.log('Decision: completed_inventory_duplicate_scan_ready_for_core_render_caption_install_proof')
console.log('Owner: Atlas Track A')
console.log('Owner ID: owner_tracka_visual_render_export')
console.log('Scoped tools inventoried: 13')
console.log('Duplicate scan: completed_no_unresolved_conflicts')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
