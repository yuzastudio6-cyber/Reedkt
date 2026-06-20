import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-otio-timeline-validation-1.md',
  'docs/track-a/tracka-otio-timeline-validation-1-source-audit.md',
  'docs/track-a/tracka-otio-timeline-validation-1-existing-evidence-reconciliation.md',
  'docs/track-a/tracka-otio-timeline-validation-1-runtime-result.md',
  'docs/track-a/tracka-otio-timeline-validation-1-artifact-policy.md',
  'docs/track-a/tracka-otio-timeline-validation-1-duplicate-scan.md',
  'docs/track-a/tracka-otio-timeline-validation-1-private-e2e-handoff.md',
  'docs/track-a/tracka-otio-timeline-validation-1-blocked-scope-register.md',
  'docs/track-a/tracka-otio-timeline-validation-1-next-phase-plan.md',
  'docs/activation-phase-tracka-otio-timeline-validation-1-results.md',
  'docs/implementation-prompts/prompt-tracka-otio-timeline-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-container-packaging-tools-install-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-otio-timeline-validation-1-diagnostics.mjs',
]

const requiredText = [
  'TRACKA-OTIO-TIMELINE-VALIDATION-1',
  '94cf6ab8e90a578b04a41ca53da2edeb3c2f324c',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '9217de68aded820205f582224b015622df8fcc8e',
  '7bd4bf73a5bd5faf6b0028d28c6a78b5dd38ea03',
  '59f82beb641fd772bfeddc8a244f148c3dbb267a',
  'e23a56d3ff76122ff5dd5edaae59156e422ffe03',
  'eed130e64b680c30b26a020099f3b51f58e2b339',
  '73eb9f808920d7c8acb8c9a7e390b5a0442a0f26',
  '#544',
  '#547',
  '#553',
  '#555',
  '#497',
  '#502',
  '#513',
  '#516',
  '#77',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-OTIO-TIMELINE-VALIDATION-1 decision: completed_source_runtime_reconciliation_pending_optional_bounded_fixture',
  'opentimelineio_timeline_validation runtimeProofStatus: source_evidence_present_runtime_fixture_not_run',
  'boundedRuntimeExecution: not_run_duplicate_avoided_or_confirmation_absent',
  'runtimeExecutionPerformed: false',
  'opentimelineio_timeline_validation readiness: ready_for_tracka_private_e2e_timeline_handoff',
  'tracka_render_export_private_review_path readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'tracka_visual_video_private_e2e readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'TRACKA-REMOTION-RENDER-VALIDATION-1 readiness: ready',
  'TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1 readiness: ready_after_remotion_validation_or_parallel_if_owner_approved',
  'Product-ready end-to-end local OSS tools: 0',
  'source_evidence_present_runtime_fixture_not_run',
  'not_run_duplicate_avoided_or_confirmation_absent',
  'ready_for_tracka_private_e2e_timeline_handoff',
  'completed_no_unresolved_conflicts',
  'docker/prod/render-worker/requirements.render.txt',
  'docker/prod/tool-readiness-worker/requirements.readiness.txt',
  'docs/activation-phase-20c-23c-amd64-build-push-results.md',
  'opentimelineio',
  'OpenTimelineIO import passed',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'referenced_as_shared_dependency_only',
  'Track B owns FFmpeg',
  'Track B owns FFprobe',
  'historical supporting evidence only',
  'not current source-of-truth',
  'none_existing_evidence_only',
  'Supabase update status: `not_applicable_docs_only`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Next recommended milestone: `TRACKA-REMOTION-RENDER-VALIDATION-1`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, private media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled.',
]

const timelineMatrixItems = [
  'opentimelineio_timeline_validation',
  'tracka_render_export_private_review_path',
  'tracka_visual_video_private_e2e',
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
  /OpenTimelineIO execution:\s*(run|completed|enabled|true)/i,
  /OTIO execution:\s*(run|completed|enabled|true)/i,
  /private media processing:\s*(enabled|true|completed|run)/i,
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
  /boundedRuntimeExecution:\s*(run|completed|enabled)/i,
  /new bounded runtime execution:\s*(run|completed|enabled)/i,
  /New generated fixture:\s*(run|completed|enabled|created)/i,
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

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/tracka-otio-timeline-validation-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:otio-timeline-validation-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:otio-timeline-validation-1:diagnostics')
}

const renderRequirements = read('docker/prod/render-worker/requirements.render.txt')
if (!renderRequirements.includes('opentimelineio')) {
  fail('render-worker requirements missing opentimelineio')
}

const readinessRequirements = read('docker/prod/tool-readiness-worker/requirements.readiness.txt')
if (!readinessRequirements.includes('opentimelineio')) {
  fail('tool-readiness worker requirements missing opentimelineio')
}

const historicalReadiness = read('docs/activation-phase-20c-23c-amd64-build-push-results.md')
if (!historicalReadiness.includes('OpenTimelineIO import passed')) {
  fail('historical readiness evidence missing OpenTimelineIO import passed')
}

const inventoryMatrix = read('docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md')
for (const token of [
  'scopedToolId: `opentimelineio_timeline_validation`',
  'currentInstallStatus: `installed_with_source_evidence`',
  'runtimeLane: `cpu_render_worker`',
  'blockedReason: `Installed source declaration exists, but no current install proof was executed in this phase`',
  'Track B owns FFmpeg/FFprobe',
]) {
  if (!inventoryMatrix.includes(token)) fail(`inventory matrix missing token: ${token}`)
}

const coreResults = read('docs/activation-phase-tracka-core-render-caption-install-proof-1-results.md')
if (!coreResults.includes('opentimelineio_timeline_validation readiness: ready_for_tracka_otio_timeline_validation_1')) {
  fail('core install proof missing OTIO readiness')
}

const libassResults = read('docs/activation-phase-tracka-libass-caption-burnin-runtime-proof-1-results.md')
if (!libassResults.includes('TRACKA-OTIO-TIMELINE-VALIDATION-1 readiness: ready')) {
  fail('libass runtime proof missing OTIO readiness handoff')
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
if (!owner.claimedScopedTools?.includes('opentimelineio_timeline_validation')) {
  fail('Atlas Track A scoped OTIO claim missing')
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
const claimText = requiredFiles
  .filter((file) => file !== 'scripts/validation/tracka-otio-timeline-validation-1-diagnostics.mjs')
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const item of timelineMatrixItems) {
  if (!allText.includes(item)) fail(`missing timeline matrix item: ${item}`)
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

console.log('TRACKA-OTIO-TIMELINE-VALIDATION-1 diagnostics passed')
console.log('Decision: completed_source_runtime_reconciliation_pending_optional_bounded_fixture')
console.log('Runtime proof status: source_evidence_present_runtime_fixture_not_run')
console.log('Bounded runtime execution: not_run_duplicate_avoided_or_confirmation_absent')
console.log('Runtime execution performed: false')
console.log('Timeline matrix items: 5')
console.log('Next prompt: TRACKA-REMOTION-RENDER-VALIDATION-1')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
