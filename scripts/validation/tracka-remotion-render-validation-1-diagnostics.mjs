import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-remotion-render-validation-1.md',
  'docs/track-a/tracka-remotion-render-validation-1-source-audit.md',
  'docs/track-a/tracka-remotion-render-validation-1-install-evidence.md',
  'docs/track-a/tracka-remotion-render-validation-1-implementation-evidence.md',
  'docs/track-a/tracka-remotion-render-validation-1-duplicate-scan.md',
  'docs/track-a/tracka-remotion-render-validation-1-ai-graphics-boundary.md',
  'docs/track-a/tracka-remotion-render-validation-1-shared-dependency-handoff.md',
  'docs/track-a/tracka-remotion-render-validation-1-blocked-scope-register.md',
  'docs/track-a/tracka-remotion-render-validation-1-next-phase-plan.md',
  'docs/activation-phase-tracka-remotion-render-validation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-remotion-render-validation-1-diagnostics.mjs',
]

const requiredText = [
  'TRACKA-REMOTION-RENDER-VALIDATION-1',
  'ded6da2d1be71cd527861c5585fc682e9c658e9b',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '9217de68aded820205f582224b015622df8fcc8e',
  '7bd4bf73a5bd5faf6b0028d28c6a78b5dd38ea03',
  '94cf6ab8e90a578b04a41ca53da2edeb3c2f324c',
  '#542',
  '#543',
  '#544',
  '#547',
  '#553',
  '#555',
  '#560',
  '#75',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-REMOTION-RENDER-VALIDATION-1 decision: completed_source_inventory_remotion_not_installed_ready_for_install_proof_packet',
  'remotion_render_validation installStatus: not_installed',
  'remotion_render_validation implementationStatus: implementation_partial',
  'remotion_render_validation runtimeProofStatus: runtime_not_run_package_absent',
  'runtimeExecutionPerformed: false',
  'remotion_render_validation readiness: ready_for_tracka_remotion_install_proof_1',
  'hyperframe_render_handoff readiness: ready_for_handoff_inventory_after_remotion_install_plan',
  'tracka_render_export_private_review_path readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'tracka_visual_video_private_e2e readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1 readiness: ready_after_remotion_install_proof_or_parallel_if_owner_approved',
  'TRACKA-REMOTION-INSTALL-PROOF-1 readiness: ready',
  'TRACKA-REMOTION-RUNTIME-PROOF-1 readiness: blocked_pending_remotion_install_proof',
  'Product-ready end-to-end local OSS tools: 0',
  'absent_from_package_json_and_package_lock',
  'runtime_not_run_package_absent',
  'completed_no_unresolved_conflicts',
  'historical supporting evidence only',
  'not current source-of-truth',
  'package.json and package-lock.json contain no Remotion package dependency',
  'vite.remotion-worker.config.ts',
  'src/backend/render/remotion-worker/*',
  'scripts/render/remotion-worker/*',
  'docker/prod/render-worker/Dockerfile',
  'server/config/env.ts',
  'REMOTION_BIN',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'referenced_as_shared_dependency_only',
  'Track B-owned shared dependencies',
  'ai_graphics_owner_boundary',
  'owned_elsewhere_boundary_recorded',
  'Supabase update status: `not_applicable_docs_only`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Next recommended milestone: `TRACKA-REMOTION-INSTALL-PROOF-1`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, Remotion execution, media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled.',
]

const matrixItems = [
  'remotion_render_validation',
  'hyperframe_render_handoff',
  'tracka_render_export_private_review_path',
  'tracka_visual_video_private_e2e',
  'ai_graphics_owner_boundary',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /internal beta.*unlocked:\s*(true|enabled|approved)/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /tool installation:\s*(enabled|true|completed)/i,
  /tool execution:\s*(enabled|true|completed)/i,
  /Remotion execution:\s*(run|completed|enabled|true)/i,
  /Remotion runtime:\s*(run|completed|enabled|true)/i,
  /media processing:\s*(enabled|true|completed|run)/i,
  /worker execution:\s*(enabled|true|completed|run)/i,
  /route execution:\s*(enabled|true|completed|run)/i,
  /provider call:\s*(enabled|true|completed|run)/i,
  /model call:\s*(enabled|true|completed|run)/i,
  /Supabase mutation:\s*(enabled|true|completed|run)/i,
  /SQL execution:\s*(enabled|true|completed|run)/i,
  /signed URL creation:\s*(enabled|true|completed|created)/i,
  /public artifact creation:\s*(enabled|true|completed|created)/i,
  /dependency mutation:\s*(enabled|true|completed)/i,
  /package-lock changed/i,
  /runtimeExecutionPerformed:\s*true/i,
  /Docker build:\s*(run|completed|enabled|created)/i,
  /FFmpeg execution:\s*(run|completed|enabled|true)/i,
  /FFprobe execution:\s*(run|completed|enabled|true)/i,
  /Private artifact access:\s*(run|completed|enabled|true)/i,
  /GCS access:\s*(run|completed|enabled|true)/i,
  /Atlas Track A (claims|owns).*`ffmpeg`/i,
  /Atlas Track A (claims|owns).*`ffprobe`/i,
  /Atlas Track A.*FFmpeg\/FFprobe install proof:\s*(true|enabled|completed)/i,
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

const packageJsonText = read('package.json')
const packageJson = JSON.parse(packageJsonText)
const expectedScript = 'node scripts/validation/tracka-remotion-render-validation-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:remotion-render-validation-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:remotion-render-validation-1:diagnostics')
}

const packageLockText = read('package-lock.json')
const remotionDependencyPattern = /"(@remotion\/[^"]+|remotion)"\s*:|"node_modules\/(@remotion\/[^"]+|remotion)"/i
if (remotionDependencyPattern.test(packageJsonText)) {
  fail('package.json unexpectedly contains Remotion dependency')
}
if (remotionDependencyPattern.test(packageLockText)) {
  fail('package-lock.json unexpectedly contains Remotion dependency')
}

const requiredSourceFiles = [
  'vite.remotion-worker.config.ts',
  'src/backend/render/remotion-worker/remotion-worker-types.ts',
  'src/backend/render/remotion-worker/remotion-worker-skeleton.ts',
  'src/backend/render/remotion-worker/remotion-worker-entrypoint.ts',
  'src/backend/render/remotion-worker/remotion-worker-cli.ts',
  'scripts/render/remotion-worker/README.md',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/README.md',
  'server/config/env.ts',
]

for (const file of requiredSourceFiles) {
  if (!existsSync(file)) fail(`missing source evidence file: ${file}`)
}

const envSource = read('server/config/env.ts')
if (!envSource.includes('REMOTION_BIN') || !envSource.includes('npx remotion')) {
  fail('server/config/env.ts missing REMOTION_BIN npx remotion metadata')
}

const workerTypes = read('src/backend/render/remotion-worker/remotion-worker-types.ts')
if (!workerTypes.includes('must not import Remotion packages')) {
  fail('remotion worker types missing no-import rule')
}

const workerReadme = read('scripts/render/remotion-worker/README.md')
for (const token of [
  'does not render media',
  'Do not install `remotion` or `@remotion/renderer`',
  'Do not run Chromium, FFmpeg, Remotion, or media rendering',
]) {
  if (!workerReadme.includes(token)) fail(`mock worker README missing token: ${token}`)
}

const registry = JSON.parse(read('docs/tool-ownership/central-tool-owner-registry.json'))
const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing Atlas Track A owner record')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.productReadyEndToEndLocalOssTools !== 0) fail('productReadyEndToEndLocalOssTools must remain 0')
if (Object.hasOwn(owner, 'claimedTools')) fail('Atlas Track A must not use claimedTools')
if (Object.hasOwn(owner, 'ownedTools')) fail('Atlas Track A must not use ownedTools')
if (owner.claimedScopedTools?.includes('ffmpeg')) fail('Atlas Track A must not claim ffmpeg')
if (owner.claimedScopedTools?.includes('ffprobe')) fail('Atlas Track A must not claim ffprobe')
if (!owner.claimedScopedTools?.includes('remotion_render_validation')) {
  fail('Atlas Track A scoped Remotion claim missing')
}
if (!owner.claimedScopedTools?.includes('hyperframe_render_handoff')) {
  fail('Atlas Track A scoped Hyperframe handoff missing')
}

const inventoryMatrix = read('docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md')
for (const token of [
  'scopedToolId: `remotion_render_validation`',
  'currentInstallStatus: `not_installed`',
  'currentImplementationStatus: `implementation_partial`',
  'nextRequiredMilestone: `TRACKA-REMOTION-RENDER-VALIDATION-1`',
  'Remotion package install/runtime proof not present in current source',
  'Track B owns FFmpeg/FFprobe',
]) {
  if (!inventoryMatrix.includes(token)) fail(`inventory matrix missing token: ${token}`)
}

const otioResults = read('docs/activation-phase-tracka-otio-timeline-validation-1-results.md')
if (!otioResults.includes('TRACKA-REMOTION-RENDER-VALIDATION-1 readiness: ready')) {
  fail('OTIO results missing Remotion readiness')
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
const claimText = requiredFiles
  .filter((file) => file !== 'scripts/validation/tracka-remotion-render-validation-1-diagnostics.mjs')
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const item of matrixItems) {
  if (!allText.includes(item)) fail(`missing Remotion matrix item: ${item}`)
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

console.log('TRACKA-REMOTION-RENDER-VALIDATION-1 diagnostics passed')
console.log('Decision: completed_source_inventory_remotion_not_installed_ready_for_install_proof_packet')
console.log('Install status: not_installed')
console.log('Implementation status: implementation_partial')
console.log('Runtime proof status: runtime_not_run_package_absent')
console.log('Runtime execution performed: false')
console.log('Remotion validation matrix items: 7')
console.log('Next prompt: TRACKA-REMOTION-INSTALL-PROOF-1')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
