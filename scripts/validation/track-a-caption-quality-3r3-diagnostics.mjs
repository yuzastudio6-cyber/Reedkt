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
  'docs/track-a/track-a-caption-quality-3r3-burnin-revalidation-execution.md',
  'docs/track-a/track-a-caption-quality-3r3-approved-source-input.md',
  'docs/track-a/track-a-caption-quality-3r3-corrected-ass-sidecar.md',
  'docs/track-a/track-a-caption-quality-3r3-private-artifact-manifest.md',
  'docs/track-a/track-a-caption-quality-3r3-qa-report.md',
  'docs/track-a/track-a-caption-quality-3r3-ffprobe-validation.md',
  'docs/track-a/track-a-caption-quality-3r3-local-review-bundle.md',
  'docs/track-a/track-a-caption-quality-3r3-upload-to-chat-instructions.md',
  'docs/track-a/track-a-caption-quality-3r3-next-phase-plan.md',
  'docs/activation-phase-tracka-caption-quality-3r3-results.md',
  'docs/implementation-prompts/prompt-tracka-caption-quality-4-record-burnin-review-outcome.md',
  'docs/implementation-prompts/prompt-tracka-private-e2e-revalidation-1-planning.md',
  'docs/implementation-prompts/prompt-internal-beta-tracka-scope-decision-1.md',
]

const docFiles = requiredFiles.filter((file) => file.startsWith('docs/'))
const oldCaption = 'Hey guys, I saw how you guys doing today is going to do going to be the first'
const exactSourceRef =
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'

const requiredText = [
  'TRACKA-CAPTION-QUALITY-3R3',
  '#426',
  '#452',
  '#459',
  '#463',
  '58a3f87a6fc07e3afc6fb699c40c8b744cc75eab',
  '422bbcade670646963257f5b7b2ddc6681748f0b',
  '1a52c5a604b175bbd95c8e96294d963636ee8db0',
  'c2d40f1b6e32330142d5d6b74f18ee37050b4fe3',
  exactSourceRef,
  'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  'docker/prod/render-worker/Dockerfile',
  'reeditpro-tracka-caption-runtime-path-check:local',
  'assFilterPresent',
  'subtitlesFilterPresent',
  'libassIndicated',
  'captionSourceType: `controlled_test_caption_copy`',
  'transcriptAccuracyClaim: `false`',
  'captionTextQualityForControlledTest: `pass`',
  'captionVisualBurnInRevalidationRequired: `true`',
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
  'oldAwkwardCaptionRejected: `true`',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true',
  'REEDITPRO_CONFIRM_TRACKA_CAPTION_APPROVED_SOURCE_GCS_READ=true',
  'TRACKA-CAPTION-QUALITY-4 readiness:',
  'TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
  'Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`',
  'signedUrlsCreated: false',
  'publicArtifactsCreated: false',
  'finalDeliveryReady: false',
  'internalBetaReady: false',
  'productionReady: false',
  'externalBetaReady: false',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.',
]

const allowedExecutions = [
  'completed_with_corrected_caption_burnin_revalidation',
  'blocked_pending_caption_burnin_execution_confirmation',
  'blocked_missing_approved_private_source_ref',
  'blocked_missing_approved_caption_burnin_runtime_path',
  'blocked_approved_source_ref_access_failed',
  'blocked_approved_runtime_image_failed',
  'blocked_caption_burnin_runtime_failed',
  'blocked_ffprobe_validation_failed',
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
  'track-a:caption-quality-3r3:diagnostics',
]) {
  if (!packageJson.scripts?.[script]) fail(`missing package script: ${script}`)
}

const docsText = docFiles.map((file) => readFileSync(file, 'utf8')).join('\n')
const activationResults = readFileSync('docs/activation-phase-tracka-caption-quality-3r3-results.md', 'utf8')

for (const token of requiredText) {
  if (!docsText.includes(token)) fail(`missing required text: ${token}`)
}

if (docsText.includes(oldCaption)) fail('rejected #419 caption text appears in 3R3 docs')

const execution = allowedExecutions.find((status) => activationResults.includes(`Execution: \`${status}\``))
if (!execution) fail('activation results do not record an allowed 3R3 execution status')

if (execution === 'completed_with_corrected_caption_burnin_revalidation') {
  for (const token of [
    'captionBurninRevalidationExecuted: true',
    'correctedCaptionVisualPreviewCreated: true',
    'libassBurninExecuted: true',
    'ffmpegValidationExecuted: true',
    'ffprobeValidationExecuted: true',
    'privateVisualArtifactsCreated: true',
    'gcsAccess: true',
    'gcsAccessMode: `exact_private_source_read_copy_only`',
    'ready_after_upload_of_corrected_caption_preview',
    'corrected-caption preview MP4',
    'FFprobe metadata JSON',
  ]) {
    if (!docsText.includes(token)) fail(`completed execution missing required evidence: ${token}`)
  }
} else {
  if (!docsText.includes(execution)) fail(`blocked execution status not propagated: ${execution}`)
}

const forbidden = [
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
  /external beta ready:\s*true/i,
  /internal beta ready:\s*true/i,
  /Supabase mutation:\s*enabled/i,
  /SQL executed:\s*yes/i,
  /signed URL source-of-truth:\s*(true|ready|approved)/i,
  /public artifact source-of-truth:\s*(true|ready|approved)/i,
  new RegExp('Docker image ' + 'push', 'i'),
  new RegExp('Cloud Run ' + 'deploy', 'i'),
  new RegExp('bucket/IAM/object ' + 'mutation', 'i'),
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
  phase: 'TRACKA-CAPTION-QUALITY-3R3',
  requiredFiles: requiredFiles.length,
  execution,
  sourceRef: exactSourceRef,
  runtimePath: 'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  noPublicArtifacts: true,
  noSignedUrls: true,
  noSupabaseMutation: true,
  noBetaProductionFinalDeliveryUnlock: true,
}, null, 2))
