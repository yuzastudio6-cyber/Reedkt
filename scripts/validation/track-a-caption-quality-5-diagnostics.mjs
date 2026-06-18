import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'docs/track-a/track-a-caption-quality-5-layout-fix-and-revalidation.md',
  'docs/track-a/track-a-caption-quality-5-layout-style-contract.md',
  'docs/track-a/track-a-caption-quality-5-corrected-ass-sidecar.md',
  'docs/track-a/track-a-caption-quality-5-private-artifact-manifest.md',
  'docs/track-a/track-a-caption-quality-5-qa-report.md',
  'docs/track-a/track-a-caption-quality-5-ffprobe-validation.md',
  'docs/track-a/track-a-caption-quality-5-local-review-bundle.md',
  'docs/track-a/track-a-caption-quality-5-upload-to-chat-instructions.md',
  'docs/track-a/track-a-caption-quality-5-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-quality-5-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-6-record-layout-review-outcome.md',
]

const requiredText = [
  'TRACKA-CAPTION-QUALITY-5',
  '#426',
  '#452',
  '#463',
  '#475',
  '#484',
  'fail_caption_layout_quality',
  'tracka_caption_layout_fix_v1',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_LAYOUT_FIX_REVALIDATION=true',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_APPROVED_SOURCE_GCS_READ=true',
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  'docker/prod/render-worker/Dockerfile',
  'captionSourceType: `controlled_test_caption_copy`',
  'transcriptAccuracyClaim: `false`',
  'captionTextQualityForControlledTest: `pass`',
  'captionVisualBurnInRevalidationRequired: `true`',
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
  'Hey everyone — welcome to this\\nReEditPro visual review.',
  'Today we are testing captions,\\noverlays, and private render quality.',
  'The goal is a clean, professional edit\\nwith readable text.',
  'Review this sample for timing,\\npolish, and visual clarity.',
  'PlayResX',
  '2160',
  'PlayResY',
  '3840',
  'Alignment',
  '2',
  'MarginL',
  '190',
  'MarginR',
  '190',
  'MarginV',
  '250',
  'Fontsize',
  '132',
  'Max lines',
  '2',
  'TRACKA-CAPTION-QUALITY-6 readiness:',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_layout_visual_review_and_scope_decision`',
  'Internal beta readiness: `blocked_pending_caption_layout_visual_review_and_scope_decision`',
  'signedUrlsCreated: false',
  'publicArtifactsCreated: false',
  'finalDeliveryReady: false',
  'internalBetaReady: false',
  'productionReady: false',
  'externalBetaReady: false',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.',
]

const allowedExecutions = new Set([
  'blocked_caption_layout_fix_confirmation_missing',
  'blocked_approved_source_ref_access_failed',
  'blocked_approved_runtime_image_failed',
  'blocked_caption_layout_fix_burnin_runtime_failed',
  'blocked_ffprobe_validation_failed',
  'completed_with_caption_layout_fix_revalidation',
])

function fail(message) {
  console.error(message)
  process.exit(1)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['track-a:caption-quality-5:diagnostics'] !== 'node scripts/validation/track-a-caption-quality-5-diagnostics.mjs') {
  fail('missing package script: track-a:caption-quality-5:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

const activationResults = readFileSync('docs/activation-phase-tracka-caption-quality-5-results.md', 'utf8')
const execution = activationResults.match(/Execution:\s*`([^`]+)`/)?.[1]
if (!execution || !allowedExecutions.has(execution)) fail(`unexpected CQ5 execution status: ${execution ?? 'missing'}`)

const rejectedOldCaption = 'Hey guys, I saw how you guys doing today is going to do going to be the first'
if (docsText.includes(rejectedOldCaption)) fail('rejected #419 caption text appears in CQ5 docs')

const forbidden = [
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
  /provider call:\s*enabled/i,
  /model call:\s*enabled/i,
  /worker execution:\s*enabled/i,
  /route execution:\s*enabled/i,
  /signed URL source-of-truth:\s*(true|ready|approved)/i,
  /public artifact source-of-truth:\s*(true|ready|approved)/i,
  /production readiness:\s*(true|ready|approved)/i,
  /external beta readiness:\s*(true|ready|approved)/i,
  /final delivery readiness:\s*(true|ready|approved)/i,
  /package-lock\.json changed/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TRACKA-CAPTION-QUALITY-5',
  execution,
  layoutProfile: 'tracka_caption_layout_fix_v1',
  noOldCaptionText: true,
  noSignedUrls: true,
  noPublicArtifacts: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
