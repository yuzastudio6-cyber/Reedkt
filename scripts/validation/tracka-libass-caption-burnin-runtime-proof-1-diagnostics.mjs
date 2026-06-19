import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-source-audit.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-existing-evidence-reconciliation.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-shared-dependency-handoff.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-runtime-result.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-artifact-policy.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-duplicate-scan.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-blocked-scope-register.md',
  'docs/track-a/tracka-libass-caption-burnin-runtime-proof-1-next-phase-plan.md',
  'docs/activation-phase-tracka-libass-caption-burnin-runtime-proof-1-results.md',
  'docs/implementation-prompts/prompt-tracka-libass-caption-burnin-runtime-proof-1.md',
  'docs/implementation-prompts/prompt-tracka-otio-timeline-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-remotion-render-validation-1.md',
  'docs/implementation-prompts/prompt-tracka-visual-video-private-e2e-1.md',
  'scripts/validation/tracka-libass-caption-burnin-runtime-proof-1-diagnostics.mjs',
]

const requiredText = [
  'TRACKA-LIBASS-CAPTION-BURNIN-RUNTIME-PROOF-1',
  '7bd4bf73a5bd5faf6b0028d28c6a78b5dd38ea03',
  '62f69c6b66d77abf155287ffdb2e9a380541d763',
  '9217de68aded820205f582224b015622df8fcc8e',
  'c2d40f1b6e32330142d5d6b74f18ee37050b4fe3',
  '374e1795d0a7a74d88517591349984ff1727429d',
  '882651cea3f9a2903276889297766b730da1c1dc',
  'cd0cdbb676bd35623b1acb63206914a0bc6b5a99',
  '#544',
  '#547',
  '#553',
  '#463',
  '#475',
  '#488',
  '#492',
  'Atlas Track A',
  'owner_tracka_visual_render_export',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'TRACKA-LIBASS-CAPTION-BURNIN-RUNTIME-PROOF-1 decision: completed_runtime_proof_satisfied_by_existing_merged_evidence',
  'libass_caption_burnin runtimeProofStatus: satisfied_by_existing_merged_tracka_caption_chain',
  'boundedRuntimeExecution: not_run_duplicate_avoided',
  'libass_caption_burnin readiness: runtime_proof_complete_for_restricted_tracka_scope',
  'tracka_caption_burnin_policy_e2e readiness: ready_for_private_e2e_after_worker_supabase_gates',
  'TRACKA-OTIO-TIMELINE-VALIDATION-1 readiness: ready',
  'TRACKA-REMOTION-RENDER-VALIDATION-1 readiness: ready_after_or_parallel_with_otio_validation',
  'TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1 readiness: blocked_pending_worker_supabase_private_e2e_gates',
  'Product-ready end-to-end local OSS tools: 0',
  'satisfied_by_existing_merged_tracka_caption_chain',
  'accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy',
  'referenced_as_shared_dependency_only',
  'shared_dependency_ffmpeg_trackb_owned',
  'shared_dependency_ffprobe_trackb_owned',
  'duplicate_runtime_execution_avoided',
  'completed_duplicate_runtime_execution_avoided',
  'completed_existing_evidence_only',
  'not_run_duplicate_avoided',
  'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  'assFilterPresent: true',
  'subtitlesFilterPresent: true',
  'libassIndicated: true',
  'libassBurninExecuted: true',
  'captionVisualBurnInPassedForUploadedSample: true',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update status: `not_applicable_docs_only`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'TRACKA-OTIO-TIMELINE-VALIDATION-1',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, private media processing, or broad service-role handler was enabled.',
]

const runtimeMatrixItems = [
  'libass_caption_burnin',
  'tracka_caption_burnin_policy_e2e',
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
  /private media processing:\s*(enabled|true|completed)/i,
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
  /boundedRuntimeExecution:\s*(run|completed|enabled)/i,
  /new bounded runtime execution:\s*(run|completed|enabled)/i,
  /New generated fixture:\s*(run|completed|enabled|created)/i,
  /Docker build:\s*(run|completed|enabled|created)/i,
  /libass execution:\s*(run|completed|enabled|true)/i,
  /FFmpeg execution:\s*(run|completed|enabled|true)/i,
  /FFprobe execution:\s*(run|completed|enabled|true)/i,
  /Private artifact access:\s*(run|completed|enabled|true)/i,
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
const expectedScript = 'node scripts/validation/tracka-libass-caption-burnin-runtime-proof-1-diagnostics.mjs'
if (packageJson.scripts?.['tracka:libass-caption-burnin-runtime-proof-1:diagnostics'] !== expectedScript) {
  fail('missing package script: tracka:libass-caption-burnin-runtime-proof-1:diagnostics')
}

const metadataCheck = read('docs/track-a/track-a-caption-runtime-path-metadata-check-results.md')
for (const token of [
  'approvedRuntimePath | `repo_owned_render_worker_ffmpeg_libass_runtime_path`',
  'assFilterPresent | `true`',
  'subtitlesFilterPresent | `true`',
  'libassIndicated | `true`',
  'mediaOutputCreated: false',
]) {
  if (!metadataCheck.includes(token)) fail(`runtime path metadata missing source token: ${token}`)
}

const burnin3r3 = read('docs/track-a/track-a-caption-quality-3r3-burnin-revalidation-execution.md')
if (!burnin3r3.includes('libassBurninExecuted: true')) fail('3R3 burn-in evidence missing libassBurninExecuted true')
if (!burnin3r3.includes('ffmpegValidationExecuted: true')) fail('3R3 burn-in evidence missing ffmpegValidationExecuted true')
if (!burnin3r3.includes('ffprobeValidationExecuted: true')) fail('3R3 burn-in evidence missing ffprobeValidationExecuted true')

const layoutFix = read('docs/track-a/track-a-caption-quality-5-layout-fix-and-revalidation.md')
if (!layoutFix.includes('libassBurninExecuted: true')) fail('layout-fix evidence missing libassBurninExecuted true')

const layoutOutcome = read('docs/track-a/track-a-caption-quality-6-layout-review-outcome.md')
for (const token of [
  'overallDecision: `accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy`',
  'captionVisualBurnInPassedForUploadedSample: true',
  'trackAInternalBetaReady: false',
  'finalDeliveryReady: false',
  'productionReady: false',
]) {
  if (!layoutOutcome.includes(token)) fail(`layout outcome missing token: ${token}`)
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
if (!owner.claimedScopedTools?.includes('libass_caption_burnin')) fail('Atlas Track A scoped libass claim missing')

const allText = requiredFiles.map((file) => read(file)).join('\n')
const claimText = requiredFiles
  .filter((file) => file !== 'scripts/validation/tracka-libass-caption-burnin-runtime-proof-1-diagnostics.mjs')
  .map((file) => read(file))
  .join('\n')

for (const token of requiredText) {
  if (!allText.includes(token)) fail(`missing required text: ${token}`)
}

for (const item of runtimeMatrixItems) {
  if (!allText.includes(item)) fail(`missing runtime matrix item: ${item}`)
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

console.log('TRACKA-LIBASS-CAPTION-BURNIN-RUNTIME-PROOF-1 diagnostics passed')
console.log('Decision: completed_runtime_proof_satisfied_by_existing_merged_evidence')
console.log('Runtime proof status: satisfied_by_existing_merged_tracka_caption_chain')
console.log('Bounded runtime execution: not_run_duplicate_avoided')
console.log('Runtime matrix items: 4')
console.log('Next prompt: TRACKA-OTIO-TIMELINE-VALIDATION-1')
console.log('Product-ready end-to-end local OSS tools: 0')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
