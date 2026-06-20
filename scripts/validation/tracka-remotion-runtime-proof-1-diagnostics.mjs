import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-remotion-runtime-proof-1.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-source-audit.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-guarded-runner-contract.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-runtime-matrix.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-artifact-policy.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-ai-graphics-boundary.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-shared-dependency-handoff.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-blocked-scope-register.md',
  'docs/track-a/tracka-remotion-runtime-proof-1-next-phase-plan.md',
  'docs/activation-phase-tracka-remotion-runtime-proof-1-results.md',
  'docs/implementation-prompts/prompt-tracka-remotion-runtime-proof-1r.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-fixture-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-remotion-runtime-proof-1.mjs',
  'scripts/validation/tracka-remotion-runtime-proof-1-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  'TRACKA-REMOTION-RUNTIME-PROOF-1',
  '70181be1a0651cd1d4670cce8fd9a39d164a2fcd',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '9217de68aded820205f582224b015622df8fcc8e',
  '7bd4bf73a5bd5faf6b0028d28c6a78b5dd38ea03',
  '94cf6ab8e90a578b04a41ca53da2edeb3c2f324c',
  'ded6da2d1be71cd527861c5585fc682e9c658e9b',
  '7d266cb6d5a96aa795c42071fe39453bfb8a5811',
  '#542',
  '#543',
  '#544',
  '#547',
  '#553',
  '#555',
  '#560',
  '#565',
  '#570',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-REMOTION-RUNTIME-PROOF-1 decision: blocked_pending_remotion_runtime_proof_confirmation',
  'Remotion runtime proof status: blocked_pending_remotion_runtime_proof_confirmation',
  'Remotion browser runtime status: not_validated_in_this_phase',
  'Remotion video rendering status: not_run',
  'runtimeExecutionPerformed: false',
  'Generated fixture: `not_run_confirmation_absent`',
  'Artifacts/checksums: `none`',
  'boundedRuntimeExecution: blocked_confirmation_absent',
  'TRACKA-REMOTION-RUNTIME-PROOF-1R readiness: ready_for_confirmed_bounded_runtime_proof',
  'TRACKA-REMOTION-RENDER-FIXTURE-PROOF-1 readiness: blocked_pending_remotion_runtime_proof_1r',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1 readiness: ready_after_remotion_runtime_proof_or_parallel_if_owner_approved',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: blocked_pending_worker_supabase_private_e2e_gates_and_remotion_runtime_proof',
  'Product-ready end-to-end local OSS tools: 0',
  'remotion_render_validation',
  'remotion_package_import_guard',
  'remotion_bundler_bundle_guard',
  'remotion_renderer_package_import_guard',
  'remotion_browser_runtime_path',
  'remotion_video_rendering_path',
  'remotion_render_fixture_path',
  'ai_graphics_owner_boundary',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'blocked_pending_remotion_runtime_proof_confirmation',
  'not_run_confirmation_absent',
  'not_run',
  'not_validated_in_this_phase',
  'referenced_as_shared_dependency_only',
  'Track B-owned',
  'Duplicate scan: `completed_no_unresolved_conflicts`',
  'Unresolved conflicts: `none`',
  '@remotion/player direct dependency: `absent`',
  '@remotion/player transitive status: `present_via_remotion_bundler_studio_only`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, video rendering, media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Bounded local generated Remotion package import and bundling proof was allowed only for Atlas Track A `remotion_render_validation`; generated artifacts stayed local and were not committed.',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /internal beta.*unlocked:\s*(true|enabled|approved)/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /runtimeExecutionPerformed:\s*true/i,
  /Remotion runtime proof status:\s*(completed|passed|enabled|run)/i,
  /Remotion browser runtime status:\s*(validated|completed|passed|run)/i,
  /Remotion video rendering status:\s*(completed|passed|run|enabled)/i,
  /video rendering:\s*(enabled|true|completed|run)/i,
  /media processing:\s*(enabled|true|completed|run)/i,
  /worker execution:\s*(enabled|true|completed|run)/i,
  /route execution:\s*(enabled|true|completed|run)/i,
  /provider call:\s*(enabled|true|completed|run)/i,
  /model call:\s*(enabled|true|completed|run)/i,
  /Supabase mutation:\s*(enabled|true|completed|run)/i,
  /SQL execution:\s*(enabled|true|completed|run)/i,
  /signed URL creation:\s*(enabled|true|completed|created)/i,
  /public artifact creation:\s*(enabled|true|completed|created)/i,
  /FFmpeg execution:\s*(run|completed|enabled|true)/i,
  /FFprobe execution:\s*(run|completed|enabled|true)/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
  /@remotion\/player.*direct dependency:\s*`?(present|true|installed)/i,
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
if (packageJson.scripts?.['tracka:remotion-runtime-proof-1'] !== 'node scripts/validation/tracka-remotion-runtime-proof-1.mjs') {
  fail('missing package script: tracka:remotion-runtime-proof-1')
}
if (packageJson.scripts?.['tracka:remotion-runtime-proof-1:diagnostics'] !== 'node scripts/validation/tracka-remotion-runtime-proof-1-diagnostics.mjs') {
  fail('missing package script: tracka:remotion-runtime-proof-1:diagnostics')
}

const directDependencies = packageJson.dependencies ?? {}
for (const [name, expected] of [
  ['remotion', '^4.0.481'],
  ['@remotion/renderer', '^4.0.481'],
  ['@remotion/bundler', '^4.0.481'],
]) {
  if (directDependencies[name] !== expected) fail(`missing direct dependency ${name}@${expected}`)
}
if (directDependencies['@remotion/player'] || packageJson.devDependencies?.['@remotion/player']) {
  fail('@remotion/player must not be a direct dependency')
}

const lock = JSON.parse(read('package-lock.json'))
const rootLockDependencies = lock.packages?.['']?.dependencies ?? {}
for (const name of ['remotion', '@remotion/renderer', '@remotion/bundler']) {
  if (!rootLockDependencies[name]) fail(`missing root package-lock dependency: ${name}`)
}
if (rootLockDependencies['@remotion/player']) fail('@remotion/player must not be a root package-lock dependency')
if (!lock.packages?.['node_modules/remotion']) fail('missing lockfile package: remotion')
if (!lock.packages?.['node_modules/@remotion/renderer']) fail('missing lockfile package: @remotion/renderer')
if (!lock.packages?.['node_modules/@remotion/bundler']) fail('missing lockfile package: @remotion/bundler')
if (!lock.packages?.['node_modules/@remotion/player']) {
  fail('expected transitive @remotion/player lockfile entry via @remotion/bundler/@remotion/studio')
}

const registry = JSON.parse(read('docs/tool-ownership/central-tool-owner-registry.json'))
const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing Atlas Track A owner record')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.productReadyEndToEndLocalOssTools !== 0) fail('productReadyEndToEndLocalOssTools must remain 0')
if (Object.hasOwn(owner, 'claimedTools')) fail('Atlas Track A must not use claimedTools')
if (Object.hasOwn(owner, 'ownedTools')) fail('Atlas Track A must not use ownedTools')
if (!owner.claimedScopedTools?.includes('remotion_render_validation')) fail('missing scoped Remotion claim')
if (owner.claimedScopedTools?.includes('ffmpeg') || owner.claimedScopedTools?.includes('ffprobe')) {
  fail('Atlas Track A must not claim ffmpeg or ffprobe')
}

const runner = read('scripts/validation/tracka-remotion-runtime-proof-1.mjs')
if (!runner.includes("const confirmationVar = 'REEDITPRO_CONFIRM_TRACKA_REMOTION_RUNTIME_PROOF'")) {
  fail('runner missing confirmation guard')
}
if (!runner.includes("process.env[confirmationVar] !== 'true'")) fail('runner does not fail closed on unset confirmation')
if (!runner.includes('process.exit(2)')) fail('runner fail-closed path must be nonzero')
if (!runner.includes("await import('remotion')")) fail('runner missing dynamic remotion import for future confirmed path')
if (!runner.includes("await import('@remotion/bundler')")) fail('runner missing dynamic bundler import for future confirmed path')
if (!runner.includes("await import('@remotion/renderer')")) fail('runner missing dynamic renderer import for future confirmed path')
if (!/bundle\s*\(/.test(runner)) fail('runner missing bounded bundle call')
for (const forbiddenCall of [/renderMedia\s*\(/, /renderStill\s*\(/, /getCompositions\s*\(/, /ffmpeg/i, /ffprobe/i]) {
  if (forbiddenCall.test(runner)) fail(`runner contains forbidden call/reference: ${forbiddenCall}`)
}

const statusFiles = requiredFiles.filter((file) => !file.startsWith('scripts/validation/'))
const combined = statusFiles.map((file) => read(file)).join('\n')
for (const token of requiredText) {
  if (!combined.includes(token)) fail(`missing required text: ${token}`)
}
for (const pattern of forbiddenPatterns) {
  if (pattern.test(combined)) fail(`forbidden claim matched: ${pattern}`)
}

let changedFiles = []
try {
  const diffOutput = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
  const untrackedOutput = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
  changedFiles = [...new Set([
    ...(diffOutput ? diffOutput.split('\n') : []),
    ...(untrackedOutput ? untrackedOutput.split('\n') : []),
  ])]
} catch (error) {
  fail(`failed to inspect changed files: ${error.message}`)
}

for (const file of changedFiles) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
}

if (changedFiles.includes('package-lock.json')) fail('package-lock.json must remain unchanged')
if (changedFiles.some((file) => file.startsWith('supabase/'))) fail('Supabase files must not change')
if (changedFiles.some((file) => file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/'))) {
  fail('runtime source/database files must not change')
}

console.log('TRACKA-REMOTION-RUNTIME-PROOF-1 diagnostics passed')
console.log('Execution: blocked_pending_remotion_runtime_proof_confirmation')
console.log('Runtime execution performed: false')
console.log('Generated fixture: not_run_confirmation_absent')
console.log('Artifacts/checksums: none')
console.log('Next prompt: TRACKA-REMOTION-RUNTIME-PROOF-1R')
