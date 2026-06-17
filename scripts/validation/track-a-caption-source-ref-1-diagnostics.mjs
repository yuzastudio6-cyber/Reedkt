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
if (!packageJson.scripts?.['track-a:caption-source-ref-1']) {
  fail('missing package script: track-a:caption-source-ref-1')
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredTokens) {
  if (!docsText.includes(token)) fail(`missing required token: ${token}`)
}

const approved = /approvedPrivateSourceRefStatus:\s*`approved`/i.test(docsText)
const blocked = /approvedPrivateSourceRefStatus:\s*`blocked_pending_metadata_confirmation`|approvedPrivateSourceRefStatus:\s*`blocked_access_denied`|approvedPrivateSourceRefStatus:\s*`blocked_missing_exact_object`|approvedPrivateSourceRefStatus:\s*`blocked_metadata_check_failed`|approvedPrivateSourceRefStatus:\s*`blocked_no_clean_source_ref`|approvedPrivateSourceRefStatus:\s*`blocked_non_tracka_ref`|approvedPrivateSourceRefStatus:\s*`blocked_not_private`|approvedPrivateSourceRefStatus:\s*`blocked_not_visual_source`/i.test(docsText)

if (!approved && !blocked) fail('missing approved or explicit blocked source-ref status')

if (approved) {
  const approvedTokens = [
    'selectedCandidate: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`',
    'metadataCheckExecuted: true',
    'gcsAccess: `metadata_stat_only`',
    'gcloudExecuted: true',
    'sourceRefApproved: true',
    'TRACKA-CAPTION-QUALITY-3R2 readiness: `ready_for_guarded_execution_with_approved_private_source_ref`',
    'Metadata Summary',
  ]
  for (const token of approvedTokens) {
    if (!docsText.includes(token)) fail(`missing approved-state token: ${token}`)
  }
} else {
  const blockedTokens = [
    'sourceRefApproved: false',
    'TRACKA-CAPTION-QUALITY-3R2 readiness: `blocked_',
  ]
  for (const token of blockedTokens) {
    if (!docsText.includes(token)) fail(`missing blocked-state token: ${token}`)
  }
}

const forbidden = [
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
  approvedPrivateSourceRefStatus: approved ? 'approved' : 'blocked',
  preferredCandidate: 'phase32_color_corrected_source_export',
  gcsAccess: approved ? 'metadata_stat_only' : 'none_or_metadata_stat_only_attempted',
  noRuntimeExecution: true,
  noSignedUrls: true,
  noPublicArtifacts: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
