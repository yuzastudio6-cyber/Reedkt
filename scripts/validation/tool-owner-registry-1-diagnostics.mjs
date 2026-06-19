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

const scopedClaims = [
  'tracka_caption_burnin_policy_e2e',
  'tracka_render_export_private_review_path',
  'tracka_visual_video_private_e2e',
]

const handoffClaims = [
  'tracka_ffmpeg_render_export_handoff_only',
  'tracka_ffprobe_export_validation_handoff_only',
  'tracka_libass_caption_burnin_handoff_only',
  'tracka_remotion_render_validation_handoff_only',
  'tracka_opentimelineio_validation_handoff_only',
]

const broadGlobalClaims = [
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
]

const requiredDroppedTools = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'opencolorio',
  'openimageio',
  'sam2',
  'kornia',
  'birefnet',
  'real_esrgan',
  'libass',
  'remotion',
  'opentimelineio',
  'film',
]

const requiredText = [
  'owner_tracka_visual_render_export',
  'Atlas Track A',
  'TRACK_A_VISUAL_RENDER_EXPORT',
  'tracka_scoped_visual_render_export_ownership',
  'ownership_claim_scoped_pending_merge_order',
  'completed_scoped_ownership_repair_clean',
  'resolved_to_scoped_tracka_claims',
  'keep_owned_by_atlas_tracka',
  'shared_upstream_dependency_tracka_integration_only',
  'owned_by_other_workstream_drop_from_atlas',
  'conflict_needs_human_decision',
  'unclear_pending_source_review',
  '#544 Track A visual render owner',
  '#543 AI Graphics owner assignment',
  '#542 Track B media OSS steward owner registry',
  '#534 Open-source tool stack refresh after AI graphics worker',
  '#536 Open-source tool stack refresh after AI graphics worker QA review',
  '#529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup',
  '#533 Open-source tool stack staged owner merge plan after Batch 1 rollup',
  'docs/tool-ownership/central-tool-owner-registry.json',
  'docs/open-source-tool-stack/owner-registry/',
  'docs/open-source-tool-stack/ownership/',
  'Unresolved conflicts: none',
  'MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544',
  'package-lock.json unchanged',
  'Supabase update status: not_applicable_docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /tool installation (?:was )?enabled/i,
  /tools? installed:\s*(?!none)/i,
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
if (!registry.centralRegistryPathDecision?.includes('docs/tool-ownership/central-tool-owner-registry.json')) {
  fail('missing central registry path decision')
}

const owner = registry.owners?.find((entry) => entry.ownerId === 'owner_tracka_visual_render_export')
if (!owner) fail('missing owner record owner_tracka_visual_render_export')
if (owner.ownerDisplayName !== 'Atlas Track A') fail('ownerDisplayName mismatch')
if (owner.workstream !== 'TRACK_A_VISUAL_RENDER_EXPORT') fail('workstream mismatch')
if (owner.status !== 'ownership_claim_scoped_pending_merge_order') fail('owner status mismatch')
if (owner.currentStatus !== 'ownership_claim_scoped_pending_merge_order') fail('owner currentStatus mismatch')
if (owner.responsibilityType !== 'tracka_scoped_visual_render_export_ownership') {
  fail('responsibilityType mismatch')
}
if (owner.duplicateRisk !== 'resolved_to_scoped_tracka_claims') fail('duplicateRisk mismatch')
if (owner.nextPrompt !== 'MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544') fail('nextPrompt mismatch')
if (owner.duplicateCheckRequiredBeforeImplementation !== true) {
  fail('duplicateCheckRequiredBeforeImplementation must be true')
}

if (!Array.isArray(owner.claimedTools)) fail('claimedTools missing')
for (const claim of scopedClaims) {
  if (!owner.claimedTools.includes(claim)) fail(`registry JSON missing scoped claim: ${claim}`)
}
if (owner.claimedTools.length !== scopedClaims.length) {
  fail(`claimedTools must contain only scoped claims; found ${owner.claimedTools.length}`)
}
for (const broadClaim of broadGlobalClaims) {
  if (owner.claimedTools.includes(broadClaim)) fail(`broad/global claim still present in claimedTools: ${broadClaim}`)
}

for (const claim of handoffClaims) {
  const hit = owner.sharedUpstreamDependencies?.some((entry) => entry.scopedClaimId === claim)
  if (!hit) fail(`missing handoff-only dependency: ${claim}`)
}

for (const tool of requiredDroppedTools) {
  const hit = owner.droppedClaims?.some((entry) => entry.toolId === tool)
  if (!hit) fail(`missing dropped claim evidence: ${tool}`)
}

for (const pr of ['#544', '#543', '#542', '#534', '#536', '#529', '#533']) {
  const hit = owner.conflictScan?.sourcePullRequests?.some((entry) => entry.includes(pr))
  if (!hit) fail(`missing conflict scan source PR: ${pr}`)
}

if (owner.conflictScan?.scanStatus !== 'completed_clean_after_scoped_repair') {
  fail('conflict scan status mismatch')
}
if (!Array.isArray(owner.conflictScan?.unresolvedConflicts) || owner.conflictScan.unresolvedConflicts.length !== 0) {
  fail('unresolved conflicts must be empty')
}

for (const [toolId, classification] of [
  ['ffmpeg', 'owned_by_other_workstream_drop_from_atlas'],
  ['ffprobe', 'owned_by_other_workstream_drop_from_atlas'],
  ['sharp_libvips', 'owned_by_other_workstream_drop_from_atlas'],
  ['opencolorio', 'owned_by_other_workstream_drop_from_atlas'],
  ['openimageio', 'owned_by_other_workstream_drop_from_atlas'],
  ['sam2', 'owned_by_other_workstream_drop_from_atlas'],
  ['kornia', 'owned_by_other_workstream_drop_from_atlas'],
  ['birefnet', 'owned_by_other_workstream_drop_from_atlas'],
  ['real_esrgan', 'owned_by_other_workstream_drop_from_atlas'],
  ['libass', 'shared_upstream_dependency_tracka_integration_only'],
  ['remotion', 'shared_upstream_dependency_tracka_integration_only'],
  ['opentimelineio', 'shared_upstream_dependency_tracka_integration_only'],
  ['film', 'unclear_pending_source_review'],
  ['tracka_caption_burnin', 'keep_owned_by_atlas_tracka'],
  ['tracka_render_export_hardening', 'keep_owned_by_atlas_tracka'],
  ['tracka_visual_video_private_e2e', 'keep_owned_by_atlas_tracka'],
]) {
  const hit = owner.conflictScan?.candidateToolDecisions?.some(
    (entry) => entry.toolId === toolId && entry.classification === classification,
  )
  if (!hit) fail(`missing conflict decision: ${toolId} ${classification}`)
}

const allText = requiredFiles.map((file) => read(file)).join('\n')
for (const token of [...requiredText, ...scopedClaims, ...handoffClaims, ...requiredDroppedTools]) {
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
console.log('TOOL-OWNER-CONFLICT-SCAN-1 decision: completed_scoped_ownership_repair_clean')
console.log('Owner registered: Atlas Track A')
console.log('Owner ID: owner_tracka_visual_render_export')
console.log('Workstream: TRACK_A_VISUAL_RENDER_EXPORT')
console.log('Current status: ownership_claim_scoped_pending_merge_order')
console.log('Scoped claims: tracka_caption_burnin_policy_e2e, tracka_render_export_private_review_path, tracka_visual_video_private_e2e')
console.log('Unresolved conflicts: none')
console.log('Supabase update status: not_applicable_docs_only')
console.log('SQL executed: none')
console.log('Migration deployed: no')
