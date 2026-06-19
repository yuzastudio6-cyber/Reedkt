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

const claimedTools = [
  'ffmpeg',
  'ffprobe',
  'libass',
  'remotion',
  'opentimelineio',
  'sharp_libvips',
  'opencolorio',
  'openimageio',
  'sam2',
  'kornia',
  'birefnet',
  'real_esrgan',
  'film',
  'tracka_caption_burnin',
  'tracka_render_export_hardening',
  'tracka_visual_video_private_e2e',
]

const excludedTokens = [
  'paddleocr',
  'paddlepaddle',
  'opencv ownership for Track B analysis',
  'pyav',
  'pyscenedetect',
  'duckdb',
  'polars',
  'deepfilternet',
  'signalsmith_stretch',
  'demucs',
  'qwen_vl',
  'vllm',
  'searxng',
  'brave_search',
  'playwright for web capture',
  'mozilla_readability',
  'maplibre',
  'turf',
  'deck_gl',
  'cesium_js',
  'nominatim',
  'photon',
  'pelias',
  'osrm',
  'valhalla',
  'pmtiles',
  'tileserver_gl',
  'martin',
  'd3',
  'echarts',
  'vega_lite',
  'three_js',
  'pixijs',
  'lottie_web',
  'svg_js',
  'satori',
  'resvg_js',
  'graphviz',
  'viz_js',
  'audioflux',
  'mirelo',
  'mmaudio',
  'lyria',
  'sound library generation',
  'music/SFX provider routes',
  'qwen',
  'deepseek',
  'provider gateway',
  'model calls',
  'worker claim/lease/RPC',
  'transactional execution',
  'service-role runtime',
  'schema, RLS, migrations, SQL, milestone sync',
  'credits, Stripe, payment flows',
]

const requiredText = [
  'owner_tracka_visual_render_export',
  'Atlas Track A',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'end_to_end_tool_ownership_after_cross_owner_conflict_check',
  'ownership_claim_registered_pending_cross_owner_conflict_scan',
  'current chat request',
  'Track A tool-study',
  'Track A caption/render chain',
  'Track A restricted internal beta scope decision',
  'current repo tool registry',
  'duplicateRisk',
  'pending_cross_owner_conflict_scan',
  'TOOL-OWNER-CONFLICT-SCAN-1 -- Cross-owner tool claim scan before Track A tool implementation',
  'TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1 -- Installed/planned/blocked status for Atlas Track A tools',
  'currentInstallStatus: unknown_until_tool_inventory_pass',
  'claimed_pending_cross_owner_conflict_check',
  'duplicateCheckRequired',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /tool installation (?:was )?enabled/i,
  /tools? installed:\s*(?!none)/i,
  /currentInstallStatus:\s*(?:installed|available|ready)/i,
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
const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing owner record owner_tracka_visual_render_export')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.status !== 'ownership_claim_registered_pending_cross_owner_conflict_scan') {
  fail('owner status mismatch')
}
if (owner.duplicateCheckRequiredBeforeImplementation !== true) {
  fail('duplicateCheckRequiredBeforeImplementation must be true')
}
if (owner.nextPrompt !== 'TOOL-OWNER-CONFLICT-SCAN-1') fail('nextPrompt mismatch')

for (const tool of claimedTools) {
  if (!owner.claimedTools?.includes(tool)) fail(`registry JSON missing claimed tool: ${tool}`)
}

for (const excluded of [
  'track_b_media_processing_tools',
  'web_search_capture_tools',
  'map_geospatial_tools',
  'ai_creative_graphics_tools_outside_tracka_handoff',
  'sound_music_audio_tools',
  'provider_model_execution',
  'worker_runtime_infrastructure',
  'supabase_schema_rls_migrations',
  'billing_stripe_credits',
]) {
  if (!owner.excludedTools?.includes(excluded)) fail(`registry JSON missing excluded tool group: ${excluded}`)
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
for (const token of [...requiredText, ...claimedTools, ...excludedTokens]) {
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
console.log('Owner registered: Atlas Track A')
console.log('Owner ID: owner_tracka_visual_render_export')
console.log('Workstream: TRACK_A_VISUAL_RENDER_EXPORT')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
