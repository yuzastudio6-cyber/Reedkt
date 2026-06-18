import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'docs/track-a/track-a-caption-quality-4-burnin-review-outcome.md',
  'docs/track-a/track-a-caption-quality-4-artifact-review-results.md',
  'docs/track-a/track-a-caption-quality-4-capability-review-results.md',
  'docs/track-a/track-a-caption-quality-4-layout-failure-report.md',
  'docs/track-a/track-a-caption-quality-4-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-quality-4-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-5-caption-layout-fix-and-revalidation.md',
]

const requiredText = [
  'TRACKA-CAPTION-QUALITY-4',
  '#475',
  'open_execution_evidence',
  '642460611fa345753d013cd45826c7fc2fa82fc8',
  'tracka-caption-quality-3r3-corrected-caption-preview.mp4',
  'ad3557848ae1b23d6767b99a6e27ffa40bdd4ba5bb47c15a13c1e0f74e1b947b',
  'inputClassification: `corrected_caption_preview_available`',
  'overallDecision: `fail_caption_layout_quality`',
  'correctedCaptionCopyPresent: true',
  'oldAwkwardCaptionTextPresent: false',
  'captionTextQualityPassed: true',
  'captionVisualBurnInPassed: false',
  'captionLayoutQualityPassed: false',
  'internalBetaReady: false',
  'finalDeliveryReady: false',
  'productionReady: false',
  'externalBetaReady: false',
  'fail_due_oversized_cropped_caption',
  'caption_text_quality',
  'pass_controlled_test_copy',
  'caption_visual_burnin_revalidation',
  'libass_caption_burnin',
  'technical_render_created_but_visual_layout_failed',
  'ffmpeg_ffprobe_validation',
  'execution_evidence_present_from_475_if_merged_or_open',
  'track_a_private_e2e_revalidation',
  'blocked_pending_caption_layout_fix',
  'TRACKA-CAPTION-QUALITY-5 readiness: `ready_for_caption_layout_fix_and_revalidation`',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_layout_fix`',
  'INTERNAL-BETA readiness: `blocked_pending_caption_layout_fix`',
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
if (packageJson.scripts?.['track-a:caption-quality-4:diagnostics'] !== 'node scripts/validation/track-a-caption-quality-4-diagnostics.mjs') {
  fail('missing package script: track-a:caption-quality-4:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

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
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
  /signed URL source-of-truth:\s*(true|ready|approved)/i,
  /public artifact source-of-truth:\s*(true|ready|approved)/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TRACKA-CAPTION-QUALITY-4',
  requiredFiles: requiredFiles.length,
  overallDecision: 'fail_caption_layout_quality',
  reviewedArtifact: 'tracka-caption-quality-3r3-corrected-caption-preview.mp4',
  noRuntimeExecutionInThisPr: true,
  noGcsAccessInThisPr: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
