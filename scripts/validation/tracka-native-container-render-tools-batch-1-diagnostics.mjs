import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-native-container-render-tools-batch-1.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-source-audit.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-duplicate-scan.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-tool-matrix.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-install-feasibility.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-runtime-lanes.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-blocked-scope-register.md',
  'docs/track-a/tracka-native-container-render-tools-batch-1-next-phase-plan.md',
  'docs/activation-phase-tracka-native-container-render-tools-batch-1-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-install-proof-2.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-validation-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'scripts/validation/tracka-native-container-render-tools-batch-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-1',
  '8c14168db93abd57ab8825923e2f20392420c0d2',
  '#544',
  '#547',
  '#553',
  '#555',
  '#560',
  '#565',
  '#570',
  '#575',
  '#577 is draft/open/blocked and excluded',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'Product-ready end-to-end local OSS tools: `0`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-1 decision: completed_source_inventory_ready_for_batched_install_proof',
  'Execution: `completed_source_inventory_no_install_changes`',
  'Dependency validation: `passed`',
  'Duplicate scan: `completed_no_unresolved_conflicts`',
  'Package-lock status: `unchanged`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2',
  'hyperframe_render_handoff',
  'gstreamer_render_pipeline_support',
  'bento4_mp4box_packaging_validation',
  'mkvtoolnix_container_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'planned_only',
  'not_installed',
  'implementation_partial',
  'implementation_missing',
  'blocked_pending_package_identity_and_provenance_review',
  'blocked_pending_native_dependency_plugin_review',
  'blocked_pending_revideo_package_identity_review',
  'cpu_native_container_worker',
  'planning_only',
  'Track B tools',
  'AI Graphics / Worker tools',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /tool execution:\s*(enabled|true|completed|run)/i,
  /media processing:\s*(enabled|true|completed|run)/i,
  /FFmpeg execution:\s*(enabled|true|completed|run)/i,
  /FFprobe execution:\s*(enabled|true|completed|run)/i,
  /Supabase mutation:\s*(enabled|true|completed|run)/i,
  /SQL execution:\s*(enabled|true|completed|run)/i,
  /worker execution:\s*(enabled|true|completed|run)/i,
  /route execution:\s*(enabled|true|completed|run)/i,
  /provider call:\s*(enabled|true|completed|run)/i,
  /model call:\s*(enabled|true|completed|run)/i,
  /signed URL creation:\s*(enabled|true|completed|created)/i,
  /public artifact creation:\s*(enabled|true|completed|created)/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
  /GStreamer execution:\s*(enabled|true|completed|run)/i,
  /MP4Box execution:\s*(enabled|true|completed|run)/i,
  /MKVToolNix execution:\s*(enabled|true|completed|run)/i,
  /VapourSynth execution:\s*(enabled|true|completed|run)/i,
  /Revideo execution:\s*(enabled|true|completed|run)/i,
]

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
if (packageJson.scripts?.['tracka:native-container-render-tools-batch-1:diagnostics'] !== 'node scripts/validation/tracka-native-container-render-tools-batch-1-diagnostics.mjs') {
  fail('missing package script: tracka:native-container-render-tools-batch-1:diagnostics')
}

const combined = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

const lockDiff = execFileSync('git', ['diff', '--name-only', '--', 'package-lock.json'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
if (lockDiff) fail('package-lock.json must remain unchanged')

const diffOutput = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
const untrackedOutput = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
const changedFiles = [...new Set([
  ...(diffOutput ? diffOutput.split('\n') : []),
  ...(untrackedOutput ? untrackedOutput.split('\n') : []),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

for (const forbiddenFile of ['package-lock.json', 'supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql']) {
  if (changedFiles.includes(forbiddenFile)) fail(`forbidden changed file: ${forbiddenFile}`)
}

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-1 diagnostics passed')
console.log('Decision: completed_source_inventory_ready_for_batched_install_proof')
console.log('Dependency validation: passed')
console.log('Tools inventoried: hyperframe, gstreamer, bento4/mp4box, mkvtoolnix, vapoursynth, revideo')
console.log('Package-lock: unchanged')
console.log('Product-ready end-to-end local OSS tools: 0')
