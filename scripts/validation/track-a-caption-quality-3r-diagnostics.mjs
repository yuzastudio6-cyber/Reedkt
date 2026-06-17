import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'server/activation/tracka-caption-burnin-revalidation/index.ts',
  'server/activation/tracka-caption-burnin-revalidation/tracka-caption-burnin-policy.ts',
  'server/activation/tracka-caption-burnin-revalidation/tracka-caption-burnin-runner.ts',
  'server/activation/tracka-caption-burnin-revalidation/tracka-caption-burnin-report.ts',
  'server/cli/activation-tracka-caption-burnin-revalidation.ts',
  'server/cli/activation-tracka-caption-burnin-revalidation-report.ts',
  'server/cli/activation-tracka-caption-burnin-revalidation-summary.ts',
  'server/smoke/activation-tracka-caption-burnin-revalidation-smoke.ts',
  'docs/track-a/track-a-caption-quality-3r-burnin-revalidation-execution.md',
  'docs/track-a/track-a-caption-quality-3r-approved-caption-sidecar.md',
  'docs/track-a/track-a-caption-quality-3r-private-artifact-manifest.md',
  'docs/track-a/track-a-caption-quality-3r-qa-report.md',
  'docs/track-a/track-a-caption-quality-3r-ffprobe-validation.md',
  'docs/track-a/track-a-caption-quality-3r-local-review-bundle.md',
  'docs/track-a/track-a-caption-quality-3r-upload-to-chat-instructions.md',
  'docs/track-a/track-a-caption-quality-3r-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-quality-3r-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-4-record-burnin-review-outcome.md',
]

const oldCaption = 'Hey guys, I saw how you guys doing today is going to do going to be the first'
const requiredText = [
  'TRACKA-CAPTION-QUALITY-3R',
  'blocked_missing_approved_private_source_ref',
  'captionSourceType: `controlled_test_caption_copy`',
  'transcriptAccuracyClaim: `false`',
  'captionTextQualityForControlledTest: `pass`',
  'captionVisualBurnInRevalidationRequired: `true`',
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
  'oldAwkwardCaptionRejected: `true`',
  'libass burn-in result: `not_run_source_ref_blocked`',
  'Remotion preview result: `not_run_source_ref_blocked`',
  'FFmpeg/FFprobe validation: `not_run_source_ref_blocked`',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
  'Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
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
for (const script of [
  'activation:tracka-caption-burnin-revalidation',
  'activation:tracka-caption-burnin-revalidation:report',
  'activation:tracka-caption-burnin-revalidation:summary',
  'smoke:activation-tracka-caption-burnin-revalidation',
  'track-a:caption-quality-3r:diagnostics',
]) {
  if (!packageJson.scripts?.[script]) fail(`missing package script: ${script}`)
}

const docsText = requiredFiles
  .filter((file) => file.startsWith('docs/'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

for (const pr of ['#419', '#422', '#426', '#429', '#434', '#440', '#443']) {
  if (!docsText.includes(pr)) fail(`missing source chain reference: ${pr}`)
}

if (docsText.includes(oldCaption)) {
  fail('rejected #419 caption text appears in new 3R docs')
}

const forbidden = [
  /captionBurninRevalidationExecuted:\s*true/i,
  /libassBurninExecuted:\s*true/i,
  /remotionPreviewExecuted:\s*true/i,
  /ffmpegValidationExecuted:\s*true/i,
  /ffprobeValidationExecuted:\s*true/i,
  /gcsAccess:\s*true/i,
  /signedUrlsCreated:\s*true/i,
  /publicArtifactsCreated:\s*true/i,
  /internalBetaReady:\s*true/i,
  /productionReady:\s*true/i,
  /externalBetaReady:\s*true/i,
  /finalDeliveryReady:\s*true/i,
  /public artifact ready:\s*true/i,
  /signed URL ready:\s*true/i,
  /final delivery ready:\s*true/i,
  /production ready:\s*true/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

if (existsSync('package-lock.json')) {
  const lockText = readFileSync('package-lock.json', 'utf8')
  if (!lockText.includes('"name": "reeditpro"')) fail('unexpected package-lock shape')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TRACKA-CAPTION-QUALITY-3R',
  requiredFiles: requiredFiles.length,
  execution: 'blocked_missing_approved_private_source_ref',
  oldCaptionRejected: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
