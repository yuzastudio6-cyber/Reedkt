import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'docs/track-a/track-a-caption-quality-3r2-runtime-path-1.md',
  'docs/track-a/track-a-caption-runtime-path-candidate-matrix.md',
  'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md',
  'docs/track-a/track-a-caption-runtime-path-approval-contract.md',
  'docs/track-a/track-a-caption-runtime-path-qa-gate-map.md',
  'docs/track-a/track-a-caption-runtime-path-blocked-scope-register.md',
  'docs/track-a/track-a-caption-runtime-path-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-runtime-path-1-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-3r3-burnin-revalidation-execution.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md',
]

const requiredTokens = [
  'TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1',
  '#459',
  '1a52c5a604b175bbd95c8e96294d963636ee8db0',
  '#452',
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  '#426',
  'controlled_test_caption_copy',
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
  'blocked_missing_approved_caption_burnin_runtime_path',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true',
  'local_ffmpeg_libass_runtime_path',
  'existing_tracka_caption_burnin_activation_module',
  'remotion_preview_runtime_path',
  'docker_cloudrun_runtime_path',
  'missing_runtime_path',
  'metadataCheck',
  'approvedRuntimePath',
  'TRACKA-CAPTION-QUALITY-3R3 readiness',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
  'Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks were allowed when REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_PATH_CHECK=true; no media input or output was used.',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing required file: ${file}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
for (const script of ['track-a:caption-runtime-path-1', 'track-a:caption-runtime-path-1:diagnostics']) {
  if (!packageJson.scripts?.[script]) fail(`missing package script: ${script}`)
}

const docsText = requiredFiles.map((file) => readFileSync(file, 'utf8')).join('\n')

for (const token of requiredTokens) {
  if (!docsText.includes(token)) fail(`missing required token: ${token}`)
}

const approved = /runtimePathStatus:\s*`approved_local_ffmpeg_libass_metadata_only`/i.test(docsText)
const blockedMissing = /runtimePathStatus:\s*`blocked_missing_local_ffmpeg_libass_runtime`/i.test(docsText)
const blockedPending = /runtimePathStatus:\s*`blocked_pending_confirmation`/i.test(docsText)

if (!approved && !blockedMissing && !blockedPending) {
  fail('missing approved or explicit blocked runtime path status')
}

if (approved) {
  const approvedPatterns = [
    /execution(?:\s*\||:)\s*`completed_runtime_path_metadata_approval`/i,
    /approvedRuntimePath(?:\s*\||:)\s*`local_ffmpeg_libass_runtime_path`/i,
    /TRACKA-CAPTION-QUALITY-3R3 readiness:\s*`ready_for_guarded_burnin_execution_with_local_ffmpeg_libass_runtime`/i,
  ]
  for (const pattern of approvedPatterns) {
    if (!pattern.test(docsText)) fail(`missing approved-state pattern: ${pattern}`)
  }
}

if (blockedMissing) {
  const blockedPatterns = [
    /execution(?:\s*\||:)\s*`blocked_missing_approved_caption_burnin_runtime_path`/i,
    /approvedRuntimePath(?:\s*\||:)\s*`none`/i,
    /TRACKA-CAPTION-QUALITY-3R3 readiness:\s*`blocked_missing_runtime_path`/i,
  ]
  for (const pattern of blockedPatterns) {
    if (!pattern.test(docsText)) fail(`missing blocked-missing-state pattern: ${pattern}`)
  }
}

if (blockedPending) {
  const pendingPatterns = [
    /execution(?:\s*\||:)\s*`blocked_pending_caption_runtime_path_check_confirmation`/i,
    /approvedRuntimePath(?:\s*\||:)\s*`none`/i,
    /TRACKA-CAPTION-QUALITY-3R3 readiness:\s*`blocked_pending_runtime_path_check`/i,
  ]
  for (const pattern of pendingPatterns) {
    if (!pattern.test(docsText)) fail(`missing blocked-pending-state pattern: ${pattern}`)
  }
}

const forbidden = [
  /captionBurninRevalidationExecuted:\s*true/i,
  /captionBurnInExecuted:\s*true/i,
  /libass(?:Burnin|MediaProcessing)?:\s*true/i,
  /ffmpeg(?:Validation|MediaProcessing)?:\s*true/i,
  /ffprobe(?:Validation|MediaProcessing)?:\s*true/i,
  /remotion(?:Preview|Render)?:\s*true/i,
  /mediaInputUsed:\s*true/i,
  /mediaOutputCreated:\s*true/i,
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
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
]

for (const pattern of forbidden) {
  if (pattern.test(docsText)) fail(`forbidden claim matched: ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      phase: 'TRACKA-CAPTION-QUALITY-3R2-RUNTIME-PATH-1',
      requiredFiles: requiredFiles.length,
      runtimePathStatus: approved
        ? 'approved_local_ffmpeg_libass_metadata_only'
        : blockedMissing
          ? 'blocked_missing_local_ffmpeg_libass_runtime'
          : 'blocked_pending_confirmation',
      noBurnInExecution: true,
      noMediaInputOutput: true,
      noGcsAccess: true,
      noSignedUrls: true,
      noPublicArtifacts: true,
      noSupabaseMutation: true,
      noBetaProductionFinalDeliveryUnlock: true,
    },
    null,
    2,
  ),
)
