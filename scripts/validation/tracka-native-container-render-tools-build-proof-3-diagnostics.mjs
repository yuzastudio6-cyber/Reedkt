import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-native-container-render-tools-build-proof-3.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-source-audit.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-build-result.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-install-metadata-verification.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-artifact-manifest-summary.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-duplicate-scan.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-blocked-scope-register.md',
  'docs/track-a/tracka-native-container-render-tools-build-proof-3-next-phase-plan.md',
  'docs/activation-phase-tracka-native-container-render-tools-build-proof-3-results.md',
  'docs/implementation-prompts/prompt-tracka-native-container-render-tools-build-proof-3.md',
  'docs/implementation-prompts/prompt-tracka-gstreamer-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-validation-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-bento4-mp4box-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-vapoursynth-native-policy-review-1.md',
  'docs/implementation-prompts/prompt-tracka-revideo-package-identity-review-1.md',
  'docs/implementation-prompts/prompt-tracka-film-frame-interpolation-scope-decision-1.md',
  'scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs',
  'scripts/validation/tracka-native-container-render-tools-build-proof-3-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/track-a/tracka-native-container-render-tools-batch-2.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-tool-matrix.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-identity-reviews.md',
  'docs/track-a/tracka-native-container-render-tools-batch-2-build-proof-support.md',
  'docs/activation-phase-tracka-native-container-render-tools-batch-2-results.md',
  'scripts/validation/tracka-native-container-render-tools-batch-2-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3',
  'f19c173a6a3d9a4cf381fc23826bd14a6385bc1f',
  '#601',
  '#577 is draft/open/blocked and excluded as source-of-truth',
  'PR #577 live readback: `OPEN`, draft, `CONFLICTING` / `DIRTY`',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 decision: blocked_docker_build_context_transfer_failed',
  'TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 decision: blocked_docker_build_context_transfer_failed_with_identity_reviews_recorded',
  'Execution: `blocked_before_or_during_build`',
  'Docker build status: `failed`',
  'Metadata verification: `not_run_build_failed`',
  'REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true',
  'blocked_docker_build_context_transfer_failed',
  'Raw runner decision before blocker normalization: `blocked_render_worker_docker_build_failed`',
  'Prebuilt worker outputs: `present_generated_by_safe_build_scripts_not_committed`',
  'blocked_missing_prebuilt_worker_outputs',
  'Run ID: `2026-06-21T02-12-41-704Z-a06117f3`',
  'Docker build context transfer failed on root AppleDouble sidecar `._dist-remotion-worker`: `failed to xattr ._dist-remotion-worker: operation not permitted`',
  '17f1cc020b1a2e58fcafc89c4addaa3dbf629c3b54da0d39ef02731d74a6529a',
  '70c83f50c07603574791a692c6b90729a0df612818e853d0f5d44860ef763b2c',
  'Product-ready end-to-end local OSS tools: `0`',
  'gstreamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'installed_source_declared_by_601',
  'blocked_render_worker_docker_build_failed',
  'bento4_mp4box_packaging_validation',
  'resolved_mp4box_provider_gpac_ready_for_future_install_proof',
  'vapoursynth_frame_pipeline',
  'resolved_vapoursynth_native_policy_ready_for_future_install_proof',
  'revideo_render_preview_alternative',
  'resolved_revideo_package_identity_ready_for_future_install_proof',
  'hyperframe_render_handoff',
  'handoff_only_no_build_change',
  'FFmpeg/FFprobe remain Track B-owned shared dependencies only',
  'Atlas Track A does not claim Track B tools',
  'Atlas Track A does not claim AI Graphics / Worker tools',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-GSTREAMER-RUNTIME-PROOF-1',
  'TRACKA-CONTAINER-PACKAGING-VALIDATION-PROOF-1',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, media processing, Docker push, deployment, FFmpeg/FFprobe execution, GStreamer pipeline execution, MKVToolNix media execution, or broad service-role handler was enabled. The only Docker action was the single confirmed local render-worker build attempt, which failed before metadata verification.',
]

const forbiddenPatterns = [
  /Execution:\s*`completed_docker_build_metadata_only`/i,
  /Docker build status:\s*`completed`/i,
  /Metadata verification:\s*`passed`/i,
  /runtime media execution:\s*`?true/i,
  /GStreamer pipeline execution:\s*`?(true|completed|passed|run)/i,
  /MKVToolNix media execution:\s*`?(true|completed|passed|run)/i,
  /FFmpeg execution:\s*`?(true|completed|passed|run)/i,
  /FFprobe execution:\s*`?(true|completed|passed|run)/i,
  /Remotion execution:\s*`?(true|completed|passed|run)/i,
  /Supabase mutation:\s*`?(true|completed|passed|run)/i,
  /SQL execution:\s*`?(true|completed|passed|run)/i,
  /Internal beta unlocked:\s*`?true/i,
  /external beta.*unlocked:\s*`?(true|enabled|approved)/i,
  /production.*unlocked:\s*`?(true|enabled|approved)/i,
  /final render\/export:\s*`?(true|enabled|completed|passed|run)/i,
  /signed URL creation:\s*`?(true|enabled|completed|created)/i,
  /public artifact creation:\s*`?(true|enabled|completed|created)/i,
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
if (packageJson.scripts?.['tracka:native-container-render-tools-build-proof-3'] !== 'node scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs') {
  fail('missing package script: tracka:native-container-render-tools-build-proof-3')
}
if (packageJson.scripts?.['tracka:native-container-render-tools-build-proof-3:diagnostics'] !== 'node scripts/validation/tracka-native-container-render-tools-build-proof-3-diagnostics.mjs') {
  fail('missing package script: tracka:native-container-render-tools-build-proof-3:diagnostics')
}

const dockerfile = read('docker/prod/render-worker/Dockerfile')
for (const token of ['gstreamer1.0-plugins-base', 'gstreamer1.0-plugins-good', 'gstreamer1.0-tools', 'mkvtoolnix']) {
  if (!dockerfile.includes(token)) fail(`missing #601 Dockerfile package declaration: ${token}`)
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

const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const lockDiff = execFileSync('git', ['diff', '--name-only', '--', 'package-lock.json'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
if (lockDiff) fail('package-lock.json must remain unchanged')

const diffOutput = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
const untrackedOutput = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  env: gitEnv,
}).trim()
const changedFiles = [...new Set([
  ...(diffOutput ? diffOutput.split('\n') : []),
  ...(untrackedOutput ? untrackedOutput.split('\n') : []),
])]

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

for (const forbiddenFile of ['package-lock.json', 'docker/prod/render-worker/Dockerfile', 'docker/prod/tool-readiness-worker/Dockerfile']) {
  if (changedFiles.includes(forbiddenFile)) fail(`forbidden changed file: ${forbiddenFile}`)
}

console.log('TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 diagnostics passed')
console.log('Decision: blocked_docker_build_context_transfer_failed')
console.log('Execution: blocked_before_or_during_build')
console.log('Docker build: failed')
console.log('Metadata verification: not_run_build_failed')
console.log('Package-lock: unchanged')
console.log('Product-ready end-to-end local OSS tools: 0')
