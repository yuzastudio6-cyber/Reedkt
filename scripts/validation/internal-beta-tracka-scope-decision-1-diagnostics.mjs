import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/internal-beta/track-a-restricted-beta-scope-decision-1.md',
  'docs/internal-beta/track-a-restricted-beta-included-capabilities.md',
  'docs/internal-beta/track-a-restricted-beta-excluded-capabilities.md',
  'docs/internal-beta/track-a-restricted-beta-risk-map.md',
  'docs/internal-beta/track-a-restricted-beta-private-e2e-revalidation-handoff.md',
  'docs/internal-beta/track-a-restricted-beta-blocked-scope-register.md',
  'docs/internal-beta/track-a-restricted-beta-next-phase-plan.md',
  'docs/activation-phase-internal-beta-tracka-scope-decision-1-results.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-readiness-rollup-1.md',
  'docs/implementation-prompts/prompt-tracka-scope-expansion-birefnet-realesrgan-1.md',
]

const requiredText = [
  'INTERNAL-BETA-TRACKA-SCOPE-DECISION-1',
  '#492',
  'cd0cdbb676bd35623b1acb63206914a0bc6b5a99',
  'accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy',
  'trackARestrictedInternalBetaScopeDecision: `approved_for_private_e2e_revalidation_planning`',
  'trackAInternalBetaUnlocked: false',
  'trackAPrivateE2ERevalidationPlanningReady: true',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready`',
  'INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_tracka_private_e2e_revalidation`',
  'productionReady: false',
  'externalBetaReady: false',
  'finalDeliveryReady: false',
  'defaultCaptionPreset: `one_line_bottom_safe_area`',
  'defaultMaxLines: `1`',
  'defaultPlacement: `bottom_center_safe_area`',
  'defaultAvoidFaceObstruction: `true`',
  'defaultSafeMarginsRequired: `true`',
  'defaultTranscriptAccuracyClaim: `false`',
  'one_line_bottom_safe_area',
  'two_line_subtitle',
  'auto_wrap_subtitle',
  'creator_large_caption',
  'lower_third_caption',
  'manual_position_and_size',
  'tracka_private_render_export_review_path',
  'corrected_caption_burnin',
  'caption_layout_policy',
  'libass_caption_burnin_runtime',
  'ffmpeg_ffprobe_private_validation',
  'remotion_private_preview_path',
  'private_artifact_manifest_checksums_qa',
  'birefnet_text_behind_subject_masking',
  'sam2_segmentation_runtime',
  'real_esrgan_enhancement',
  'film_interpolation_runtime',
  'opencolorio_openimageio_production_color_management',
  'public artifact',
  'signed URL',
  'final delivery',
  'external beta',
  'production',
  'TRACKA-SCOPE-EXPANSION-BIREFNET-REALESRGAN-1',
  'INTERNAL-BETA-READINESS-ROLLUP-1',
  'docs_only',
  'SQL executed: none',
  'Migration deployed: no',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (
  packageJson.scripts?.['internal-beta:tracka-scope-decision-1:diagnostics'] !==
  'node scripts/validation/internal-beta-tracka-scope-decision-1-diagnostics.mjs'
) {
  fail('missing package script: internal-beta:tracka-scope-decision-1:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
if (packageLockStatus) fail(`package lock changed: ${packageLockStatus}`)

const forbidden = [
  /trackAInternalBetaUnlocked:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /\bruntimeExecutionInThisPr:\s*true/i,
  /\bworkerExecutionInThisPr:\s*true/i,
  /\bproviderModelCallInThisPr:\s*true/i,
  /\brouteExecutionInThisPr:\s*true/i,
  /supabaseMutationInThisPr:\s*true/i,
  /sqlExecutedInThisPr:\s*true/i,
  /packageLockMutationInThisPr:\s*true/i,
  /dependencyMutationInThisPr:\s*true/i,
  /GCS access:\s*(approved|enabled|true)/i,
  /runtime execution:\s*(approved|enabled|true)/i,
  /Supabase mutation:\s*(approved|enabled|true)/i,
  /SQL execution:\s*(approved|enabled|true)/i,
  /internal beta unlock:\s*(approved|enabled|true)/i,
  /external beta unlock:\s*(approved|enabled|true)/i,
  /production unlock:\s*(approved|enabled|true)/i,
  /final delivery:\s*(approved|enabled|true)/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'INTERNAL-BETA-TRACKA-SCOPE-DECISION-1',
  trackARestrictedInternalBetaScopeDecision: 'approved_for_private_e2e_revalidation_planning',
  trackAInternalBetaUnlocked: false,
  trackAPrivateE2ERevalidationPlanningReady: true,
  internalBetaReadinessRollup: 'blocked_pending_tracka_private_e2e_revalidation',
  noRuntimeExecutionInThisPr: true,
  noGcsAccessInThisPr: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
