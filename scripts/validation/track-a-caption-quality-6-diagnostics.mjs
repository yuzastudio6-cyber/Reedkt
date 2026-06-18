import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredFiles = [
  'docs/track-a/track-a-caption-quality-6-layout-review-outcome.md',
  'docs/track-a/track-a-caption-quality-6-artifact-review-results.md',
  'docs/track-a/track-a-caption-quality-6-capability-review-results.md',
  'docs/track-a/track-a-caption-quality-6-caption-layout-policy.md',
  'docs/track-a/track-a-caption-quality-6-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-quality-6-results.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md',
]

const requiredText = [
  'TRACKA-CAPTION-QUALITY-6',
  '#484',
  '#488',
  'fail_caption_layout_quality',
  'completed_with_caption_layout_fix_revalidation',
  'tracka-caption-quality-5-layout-fixed-caption-preview.mp4',
  '150dc68a935c90083f49f6ad329a073c4d1d14dc216c20fe0bb05aa764add02a',
  'inputClassification: `layout_fixed_caption_preview_available`',
  'overallDecision: `accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy`',
  'correctedCaptionCopyPresent: true',
  'oldAwkwardCaptionTextPresent: false',
  'captionTextQualityPassed: true',
  'captionVisualBurnInPassedForUploadedSample: true',
  'captionLayoutAcceptedForRestrictedInternalBetaScope: true',
  'captionLayoutRequiresUserConfigurablePolicy: true',
  'fullProductionCaptionLayoutClosurePassed: false',
  'internalBetaReady: false',
  'finalDeliveryReady: false',
  'productionReady: false',
  'externalBetaReady: false',
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
  'caption_text_quality',
  'pass_controlled_test_copy',
  'caption_visual_burnin_revalidation',
  'accepted_for_restricted_internal_beta_scope',
  'libass_caption_burnin',
  'technical_pass',
  'ffmpeg_ffprobe_validation',
  'execution_evidence_present_from_488_merged',
  'caption_layout_policy',
  'user_configurable_default_one_line',
  'TRACKA-CAPTION-QUALITY-6 readiness: `completed`',
  'INTERNAL-BETA-TRACKA-SCOPE-DECISION-1 readiness: `ready`',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready_for_planning_after_scope_decision`',
  'INTERNAL-BETA readiness: `blocked_pending_tracka_scope_decision_and_private_e2e_revalidation`',
  'Production/external beta/final delivery: `blocked`',
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
if (packageJson.scripts?.['track-a:caption-quality-6:diagnostics'] !== 'node scripts/validation/track-a-caption-quality-6-diagnostics.mjs') {
  fail('missing package script: track-a:caption-quality-6:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const rejectedOldCaption = ['Hey guys', 'I saw how you guys doing today is going to do going to be the first'].join(', ')
if (docsText.includes(rejectedOldCaption)) fail('rejected #419 caption text appears in CQ6 docs')

const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
if (packageLockStatus) fail(`package lock changed: ${packageLockStatus}`)

const forbidden = [
  /runtimeExecutionInThisPr:\s*true/i,
  /gcsAccessInThisPr:\s*true/i,
  /artifactAccessInThisPr:\s*true/i,
  /mediaProcessingInThisPr:\s*true/i,
  /ffmpegExecutionInThisPr:\s*true/i,
  /ffprobeExecutionInThisPr:\s*true/i,
  /libassExecutionInThisPr:\s*true/i,
  /remotionExecutionInThisPr:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /internalBetaReady:\s*true/i,
  /trackAInternalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /trackAFinalDeliveryReady:\s*true/i,
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
  /signed URL source-of-truth:\s*(true|ready|approved)/i,
  /public artifact source-of-truth:\s*(true|ready|approved)/i,
  /production readiness:\s*(true|ready|approved)/i,
  /external beta readiness:\s*(true|ready|approved)/i,
  /final delivery readiness:\s*(true|ready|approved)/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TRACKA-CAPTION-QUALITY-6',
  inputClassification: 'layout_fixed_caption_preview_available',
  overallDecision: 'accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy',
  captionPolicy: 'user_configurable_default_one_line',
  noRuntimeExecutionInThisPr: true,
  noGcsAccessInThisPr: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
