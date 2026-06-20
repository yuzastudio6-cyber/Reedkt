import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-remotion-runtime-proof-1r.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-source-audit.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-execution-result.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-runtime-matrix.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-artifact-manifest-summary.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-boundaries.md',
  'docs/track-a/tracka-remotion-runtime-proof-1r-next-phase-plan.md',
  'docs/activation-phase-tracka-remotion-runtime-proof-1r-results.md',
  'docs/implementation-prompts/prompt-tracka-remotion-runtime-proof-1r-retry.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-fixture-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-remotion-runtime-proof-1.mjs',
  'scripts/validation/tracka-remotion-runtime-proof-1r-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  'TRACKA-REMOTION-RUNTIME-PROOF-1R',
  '8c14168db93abd57ab8825923e2f20392420c0d2',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '9217de68aded820205f582224b015622df8fcc8e',
  '7bd4bf73a5bd5faf6b0028d28c6a78b5dd38ea03',
  '94cf6ab8e90a578b04a41ca53da2edeb3c2f324c',
  'ded6da2d1be71cd527861c5585fc682e9c658e9b',
  '7d266cb6d5a96aa795c42071fe39453bfb8a5811',
  '70181be1a0651cd1d4670cce8fd9a39d164a2fcd',
  '#544',
  '#547',
  '#553',
  '#555',
  '#560',
  '#565',
  '#570',
  '#575',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-REMOTION-RUNTIME-PROOF-1R decision: blocked_pre_execution_dependency_validation_host_resource_limit_exit_137',
  'Execution: `blocked_pre_execution_dependency_validation_host_resource_limit_exit_137`',
  'Remotion runtime proof status: `blocked_pre_execution_dependency_validation_host_resource_limit_exit_137`',
  'runtimeExecutionPerformed: false',
  'Generated fixture: `not_run_pre_execution_validation_blocked`',
  'Artifacts/checksums: `none`',
  'host_resource_limit_exit_137_during_npm_ci',
  'host_resource_limit_exit_137_during_npm_ci_retry',
  'host_resource_limit_requires_larger_dependency_validation_environment',
  'PR #577 checks: `none_reported`',
  'Larger/stable dependency-validation environment available to this Codex run: `not_available`',
  'Already-hydrated clean #577 worktree with same lockfile and passing validation: `not_confirmed`',
  'Same local exit-137 path repeated during closure: `false`',
  'Remotion proof command: `not_run_host_resource_closure_blocked`',
  'Fresh temporary worktree retry under `/Volumes/backup/codex-worktrees/reeditpro-tracka-remotion-runtime-proof-1r-retry-tmp`: terminated during checkout with exit `143`',
  'Fresh temporary worktree retry under `/private/tmp/reeditpro-tracka-remotion-runtime-proof-1r-retry-tmp`: terminated with exit `143` before usable dependency validation output',
  'REEDITPRO_CONFIRM_TRACKA_REMOTION_RUNTIME_PROOF=true npm run tracka:remotion-runtime-proof-1',
  'not_run_pre_execution_validation_blocked',
  'Remotion browser runtime status: `not_validated_in_this_phase`',
  'Remotion video rendering status: `not_run`',
  'Product-ready end-to-end local OSS tools: 0',
  'remotion_render_validation',
  'remotion_package_import',
  'remotion_bundler_runtime',
  'remotion_renderer_package_import',
  'remotion_browser_runtime',
  'remotion_video_rendering',
  'ai_graphics_owner_boundary',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'TRACKA-REMOTION-RUNTIME-PROOF-1R readiness: blocked_pending_dependency_validation_or_confirmed_runtime_proof_rerun',
  'TRACKA-REMOTION-RENDER-FIXTURE-PROOF-1 readiness: blocked_pending_remotion_runtime_proof_1r_completion',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1 readiness: ready_after_remotion_runtime_proof_or_parallel_if_owner_approved',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: blocked_pending_worker_supabase_private_e2e_gates_and_remotion_render_fixture_proof',
  'Next recommended milestone: `TRACKA-REMOTION-RUNTIME-PROOF-1R-HOST-RESOURCE-CLOSURE`',
  'Supabase update status: `not_applicable_docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, video rendering, media processing, FFmpeg/FFprobe execution, Remotion execution, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /TRACKA-REMOTION-RUNTIME-PROOF-1R decision:\s*completed_bounded_remotion_package_runtime_bundle_proof/i,
  /bounded_package_runtime_bundle_proof_passed/i,
  /runtimeExecutionPerformed:\s*true/i,
  /Generated fixture:\s*`(?!not_run_pre_execution_validation_blocked`)[^`]+`/i,
  /Artifacts\/checksums:\s*`(?!none`)[^`]+`/i,
  /Remotion video rendering status:\s*`?(run|passed|completed|enabled|true)/i,
  /Remotion browser runtime status:\s*`?(validated|run|passed|completed|enabled|true)/i,
  /renderMedia\s*\(/,
  /renderStill\s*\(/,
  /getCompositions\s*\(/,
  /FFmpeg execution:\s*(run|completed|enabled|true)/i,
  /FFprobe execution:\s*(run|completed|enabled|true)/i,
  /Supabase mutation:\s*(enabled|true|completed|run)/i,
  /SQL execution:\s*(enabled|true|completed|run)/i,
  /signed URL creation:\s*(enabled|true|completed|created)/i,
  /public artifact creation:\s*(enabled|true|completed|created)/i,
  /Internal beta unlocked:\s*true/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
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
if (packageJson.scripts?.['tracka:remotion-runtime-proof-1r:diagnostics'] !== 'node scripts/validation/tracka-remotion-runtime-proof-1r-diagnostics.mjs') {
  fail('missing package script: tracka:remotion-runtime-proof-1r:diagnostics')
}
if (packageJson.scripts?.['tracka:remotion-runtime-proof-1'] !== 'node scripts/validation/tracka-remotion-runtime-proof-1.mjs') {
  fail('missing package script: tracka:remotion-runtime-proof-1')
}

for (const depName of ['remotion', '@remotion/renderer', '@remotion/bundler']) {
  if (!packageJson.dependencies?.[depName]) fail(`missing Remotion dependency: ${depName}`)
}
if (packageJson.dependencies?.['@remotion/player'] || packageJson.devDependencies?.['@remotion/player']) {
  fail('@remotion/player must not be a direct dependency')
}

const runner = read('scripts/validation/tracka-remotion-runtime-proof-1.mjs')
if (!runner.includes("REEDITPRO_CONFIRM_TRACKA_REMOTION_RUNTIME_PROOF")) fail('runner missing confirmation variable')
if (!runner.includes("process.env[confirmationVar] !== 'true'")) fail('runner missing fail-closed guard')
if (!runner.includes("await import('remotion')")) fail('runner missing Remotion dynamic import')
if (!runner.includes("await import('@remotion/bundler')")) fail('runner missing bundler dynamic import')
if (!runner.includes("await import('@remotion/renderer')")) fail('runner missing renderer dynamic import')
if (!/bundle\s*\(/.test(runner)) fail('runner missing bounded bundle call')
for (const forbidden of [/renderMedia\s*\(/, /renderStill\s*\(/, /getCompositions\s*\(/, /ffmpeg/i, /ffprobe/i]) {
  if (forbidden.test(runner)) fail(`runner contains forbidden runtime call/reference: ${forbidden}`)
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
if (changedFiles.some((file) => file.includes('manifest.json') || file.includes('qa-report.json'))) {
  fail('generated manifest/QA files must not be committed')
}
if (changedFiles.some((file) => file.startsWith('supabase/') || file.startsWith('server/') || file.startsWith('src/') || file.startsWith('database/'))) {
  fail('runtime, database, or Supabase files must not change')
}

console.log('TRACKA-REMOTION-RUNTIME-PROOF-1R diagnostics passed')
console.log('Execution: blocked_pre_execution_dependency_validation_host_resource_limit_exit_137')
console.log('Runtime execution performed: false')
console.log('Generated fixture: not_run_pre_execution_validation_blocked')
console.log('Artifacts/checksums: none')
console.log('Retry blocker: host_resource_limit_exit_137_during_npm_ci_retry')
console.log('Host-resource closure blocker: host_resource_limit_requires_larger_dependency_validation_environment')
console.log('Next prompt: TRACKA-REMOTION-RUNTIME-PROOF-1R-HOST-RESOURCE-CLOSURE')
