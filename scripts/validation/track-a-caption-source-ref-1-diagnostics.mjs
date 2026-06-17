import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'docs/track-a/track-a-caption-source-ref-1.md',
  'docs/track-a/track-a-caption-source-ref-candidate-matrix.md',
  'docs/track-a/track-a-caption-source-ref-approval-contract.md',
  'docs/track-a/track-a-caption-source-ref-metadata-check-plan.md',
  'docs/track-a/track-a-caption-source-ref-gap-map.md',
  'docs/track-a/track-a-caption-source-ref-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-source-ref-1-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-3r2-burnin-revalidation-execution.md',
]

const requiredTokens = [
  '#447',
  'ce4b2feac22247581ba361e71df33feb1e667507',
  'blocked_missing_approved_private_source_ref',
  'blocked_pending_metadata_confirmation',
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  'phase45a_libass_burnin_preview',
  'phase45b_remotion_render_preview',
  'phase45d_hardened_review_export',
  'rejected_old_caption_burned_output',
  'exact private `gs://` object ref',
  'not public',
  'not a signed URL',
  'not old-caption-burned output',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true',
  'gcsAccess: false',
  'metadataCheckExecuted: false',
  'TRACKA-CAPTION-QUALITY-3R2 readiness: `blocked_pending_source_ref_metadata_confirmation`',
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
if (!packageJson.scripts?.['track-a:caption-source-ref-1:diagnostics']) {
  fail('missing package script: track-a:caption-source-ref-1:diagnostics')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredTokens) {
  if (!docsText.includes(token)) fail(`missing required token: ${token}`)
}

const forbidden = [
  /approvedPrivateSourceRefStatus:\s*`approved`/i,
  /sourceRefApproved:\s*true/i,
  /metadataCheckExecuted:\s*true/i,
  /gcsAccess:\s*true/i,
  /gcloudExecuted:\s*true/i,
  /captionBurninRevalidationExecuted:\s*true/i,
  /libassBurninExecuted:\s*true/i,
  /ffmpegValidationExecuted:\s*true/i,
  /ffprobeValidationExecuted:\s*true/i,
  /remotionPreviewExecuted:\s*true/i,
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
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
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
  phase: 'TRACKA-CAPTION-SOURCE-REF-1',
  requiredFiles: requiredFiles.length,
  approvedPrivateSourceRefStatus: 'blocked_pending_metadata_confirmation',
  preferredCandidate: 'phase32_color_corrected_source_export',
  gcsAccess: false,
  noRuntimeExecution: true,
  noSignedUrls: true,
  noPublicArtifacts: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
