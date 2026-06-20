import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docker/prod/render-worker/Dockerfile',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-source-audit.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-duplicate-scan.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-install-source-changes.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-tool-matrix.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-blocked-package-identity.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-runtime-proof-plan.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-safety-scope.md',
  'docs/track-a/tracka-native-container-render-tools-install-proof-2-next-phase-plan.md',
  'docs/activation-phase-tracka-native-container-render-tools-install-proof-2-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-build-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-validation-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-bento4-mp4box-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-native-policy-review-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'scripts/validation/tracka-native-container-render-tools-install-proof-2-diagnostics.mjs',
]

const allowedChangedFiles = new Set([...requiredFiles, 'package.json'])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2',
  '252b5dba40018f9b4785660ba776515c359ccd13',
  '#595',
  '#577 is draft/open/blocked and excluded as source-of-truth',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2 decision: completed_install_source_changes_for_gstreamer_mkvtoolnix_pending_build_proof',
  'Execution: `completed_source_install_changes_no_runtime_execution`',
  'Dependency validation: `passed`',
  'Duplicate scan: `completed_no_unresolved_conflicts`',
  'Package-lock status: `unchanged`',
  'Docker build status: `not_run`',
  'Runtime proof status: `not_run_in_this_phase`',
  'Product-ready end-to-end local OSS tools: `0`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3',
  'hyperframe_render_handoff',
  'gstreamer_render_pipeline_support',
  'bento4_mp4box_packaging_validation',
  'mkvtoolnix_container_validation',
  'vapoursynth_frame_pipeline',
  'revideo_render_preview_alternative',
  'handoff_only_no_install_source_change',
  'install_source_added_pending_docker_build_proof',
  'blocked_pending_bento4_mp4box_package_identity_provenance_review',
  'blocked_pending_vapoursynth_native_dependency_plugin_policy',
  'blocked_pending_revideo_package_identity_review',
  'handoff_only_ready_for_tracka_render_handoff_planning',
  'ready_for_docker_build_install_proof',
  'gstreamer1.0-plugins-base',
  'gstreamer1.0-plugins-good',
  'gstreamer1.0-tools',
  'mkvtoolnix',
  'Atlas Track A does not claim Track B tools',
  'Atlas Track A does not claim AI Graphics / Worker tools',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, media processing, Docker build, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Install-source changes, if present, were limited to Atlas Track A native/container render tool Dockerfile package declarations and were not executed.',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /Docker build:\s*(enabled|true|completed|run)/i,
  /tool execution:\s*(enabled|true|completed|run)/i,
  /media processing:\s*(enabled|true|completed|run)/i,
  /FFmpeg execution:\s*(enabled|true|completed|run)/i,
  /FFprobe execution:\s*(enabled|true|completed|run)/i,
  /GStreamer execution:\s*(enabled|true|completed|run)/i,
  /MP4Box execution:\s*(enabled|true|completed|run)/i,
  /MKVToolNix execution:\s*(enabled|true|completed|run)/i,
  /VapourSynth execution:\s*(enabled|true|completed|run)/i,
  /Revideo execution:\s*(enabled|true|completed|run)/i,
  /Remotion execution:\s*(enabled|true|completed|run)/i,
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
  /Atlas Track A (claims|owns).*`sam2`/i,
  /Atlas Track A (claims|owns).*`kornia`/i,
  /Atlas Track A (claims|owns).*`real_esrgan`/i,
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
if (packageJson.scripts?.['tracka:native-container-render-tools-install-proof-2:diagnostics'] !== 'node scripts/validation/tracka-native-container-render-tools-install-proof-2-diagnostics.mjs') {
  fail('missing package script: tracka:native-container-render-tools-install-proof-2:diagnostics')
}

const dockerfile = read('docker/prod/render-worker/Dockerfile')
for (const pkg of ['gstreamer1.0-plugins-base', 'gstreamer1.0-plugins-good', 'gstreamer1.0-tools', 'mkvtoolnix']) {
  if (!dockerfile.includes(pkg)) fail(`missing render-worker Dockerfile package: ${pkg}`)
}
for (const forbiddenPkg of ['gstreamer1.0-plugins-bad', 'gstreamer1.0-plugins-ugly', 'gpac', 'vapoursynth', 'revideo']) {
  if (dockerfile.includes(forbiddenPkg)) fail(`forbidden render-worker Dockerfile package: ${forbiddenPkg}`)
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

for (const forbiddenFile of ['package-lock.json', 'docker/prod/tool-readiness-worker/Dockerfile']) {
  if (changedFiles.includes(forbiddenFile)) fail(`forbidden changed file: ${forbiddenFile}`)
}

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2 diagnostics passed')
console.log('Decision: completed_install_source_changes_for_gstreamer_mkvtoolnix_pending_build_proof')
console.log('Execution: completed_source_install_changes_no_runtime_execution')
console.log('Dockerfile packages: gstreamer base/good/tools, mkvtoolnix')
console.log('Package-lock: unchanged')
console.log('Product-ready end-to-end local OSS tools: 0')
