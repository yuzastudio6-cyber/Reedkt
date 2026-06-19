import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-core-render-caption-install-proof-1.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-source-audit.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-install-evidence.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-shared-dependency-handoff.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-caption-policy-evidence.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-private-review-path-evidence.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-duplicate-scan.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-blocked-scope-register.md',
  'docs/track-a/tracka-core-render-caption-install-proof-1-next-phase-plan.md',
  'docs/activation-phase-tracka-core-render-caption-install-proof-1-results.md',
  'docs/implementation-prompts/prompt-tracka-core-render-caption-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-libass-caption-burnin-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-otio-timeline-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-core-render-caption-install-proof-1-diagnostics.mjs',
]

const coreItems = [
  'libass_caption_burnin',
  'opentimelineio_timeline_validation',
  'tracka_caption_burnin_policy_e2e',
  'tracka_render_export_private_review_path',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
]

const requiredText = [
  'TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1',
  '9217de68aded820205f582224b015622df8fcc8e',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '#544',
  '#547',
  '#542',
  '#543',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 decision: completed_source_install_proof_ready_for_runtime_proof',
  'libass_caption_burnin readiness: ready_for_tracka_libass_caption_burnin_runtime_proof_1',
  'opentimelineio_timeline_validation readiness: ready_for_tracka_otio_timeline_validation_1',
  'tracka_caption_burnin_policy_e2e readiness: ready_for_private_e2e_after_worker_supabase_gates',
  'tracka_render_export_private_review_path readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'TRACKA-REMOTION-RENDER-VALIDATION-1 readiness: ready_for_remotion_source_runtime_inventory',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1 readiness: ready_after_core_runtime_proof_or_parallel_if_owner_approved',
  'Product-ready end-to-end local OSS tools: 0',
  'completed_no_unresolved_conflicts',
  'completed_source_evidence_only',
  'installed_with_source_evidence_pending_runtime_proof',
  'implementation_present_pending_private_e2e',
  'implementation_partial_blocked_pending_worker_supabase_e2e',
  'handoff_only_reference_trackb',
  'docker/prod/render-worker/Dockerfile',
  'docker/prod/tool-readiness-worker/Dockerfile',
  'docker/prod/render-worker/requirements.render.txt',
  'docker/prod/tool-readiness-worker/requirements.readiness.txt',
  'libass9',
  'libass-dev',
  'opentimelineio',
  'Track B Media OSS Steward',
  'TRACKA-LIBASS-CAPTION-BURNIN-RUNTIME-PROOF-1',
  'TRACKA-OTIO-TIMELINE-VALIDATION-1',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1',
  'Supabase update status: `not_applicable_docs_only`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /Internal beta unlocked:\s*true/i,
  /internal beta.*unlocked:\s*(true|enabled|approved)/i,
  /external beta.*unlocked:\s*(true|enabled|approved)/i,
  /production.*unlocked:\s*(true|enabled|approved)/i,
  /final delivery.*unlocked:\s*(true|enabled|approved)/i,
  /tool installation:\s*(enabled|true|completed)/i,
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

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-core-render-caption-install-proof-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:core-render-caption-install-proof-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:core-render-caption-install-proof-1:diagnostics')
}

const renderDockerfile = read('docker/prod/render-worker/Dockerfile')
if (!renderDockerfile.includes('libass9')) fail('render worker Dockerfile missing libass9')
if (!renderDockerfile.includes('libass-dev')) fail('render worker Dockerfile missing libass-dev')

const readinessDockerfile = read('docker/prod/tool-readiness-worker/Dockerfile')
if (!readinessDockerfile.includes('libass9')) fail('tool readiness Dockerfile missing libass9')

const renderRequirements = read('docker/prod/render-worker/requirements.render.txt')
if (!renderRequirements.includes('opentimelineio')) fail('render requirements missing opentimelineio')

const readinessRequirements = read('docker/prod/tool-readiness-worker/requirements.readiness.txt')
if (!readinessRequirements.includes('opentimelineio')) fail('tool readiness requirements missing opentimelineio')

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

const allText = requiredFiles.map((file) => read(file)).join('\n')
const claimText = requiredFiles
  .filter((file) => file !== 'scripts/validation/tracka-core-render-caption-install-proof-1-diagnostics.mjs')
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const item of coreItems) {
  if (!allText.includes(item)) fail(`missing core proof matrix item: ${item}`)
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

console.log('TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 diagnostics passed')
console.log('Decision: completed_source_install_proof_ready_for_runtime_proof')
console.log('Owner: Atlas Track A')
console.log('Owner ID: owner_tracka_visual_render_export')
console.log('Core proof matrix items: 6')
console.log('Duplicate scan: completed_no_unresolved_conflicts')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
