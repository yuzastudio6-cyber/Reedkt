export const TRACKA_CAPTION_BURNIN_PHASE = 'TRACKA-CAPTION-QUALITY-3R3'
export const TRACKA_CAPTION_BURNIN_BRANCH = 'codex/rp-tracka-caption-quality-3r3-burnin-revalidation-execution'
export const TRACKA_CAPTION_BURNIN_BASE_BRANCH = 'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const TRACKA_CAPTION_BURNIN_PR_TITLE = '[track-a] Guarded corrected caption burn-in revalidation'
export const TRACKA_CAPTION_BURNIN_CONFIRM_ENV = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION'
export const TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_GCS_ACCESS_REPAIR'
export const TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_APPROVED_SOURCE_GCS_READ'
export const TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_BUILD'
export const TRACKA_CAPTION_BURNIN_RUN_ID_ENV = 'REEDITPRO_TRACKA_CAPTION_BURNIN_RUN_ID'
export const TRACKA_CAPTION_BURNIN_LOCAL_ROOT = '/tmp/reeditpro-tracka-caption-quality-3r3'

export const TRACKA_CAPTION_APPROVED_SOURCE_REF =
  'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'

export const TRACKA_CAPTION_APPROVED_SOURCE_METADATA = {
  size: '94522751',
  contentType: 'video/mp4',
  generation: '1779975269726662',
  metageneration: '1',
  storageClass: 'STANDARD',
  updated: '2026-05-28T13:34:29Z',
  crc32c: '/HiYtQ==',
  md5: '3QrjneF4xbmU8d/OlswU+Q==',
} as const

export const TRACKA_CAPTION_APPROVED_RUNTIME = {
  status: 'approved_repo_owned_ffmpeg_libass_metadata_only',
  approvedRuntimePath: 'repo_owned_render_worker_ffmpeg_libass_runtime_path',
  dockerfile: 'docker/prod/render-worker/Dockerfile',
  supportingDockerfile: 'docker/prod/tool-readiness-worker/Dockerfile',
  imageTag: 'reeditpro-tracka-caption-runtime-path-check:local',
  ffmpegPath: 'docker://docker/prod/render-worker/Dockerfile#ffmpeg',
  ffprobePath: 'docker://docker/prod/render-worker/Dockerfile#ffprobe',
  assFilterPresent: true,
  subtitlesFilterPresent: true,
  libassIndicated: true,
  metadataEvidencePath: 'docs/track-a/track-a-caption-runtime-path-metadata-check-results.md',
} as const

export const TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.'

export const TRACKA_CAPTION_BURNIN_CORRECTED_LINES = [
  'Hey everyone — welcome to this ReEditPro visual review.',
  'Today we are testing captions, overlays, and private render quality.',
  'The goal is a clean, professional edit with readable text.',
  'Review this sample for timing, polish, and visual clarity.',
] as const

export const TRACKA_CAPTION_BURNIN_REJECTED_TEXT =
  'Hey guys, I saw how you guys doing today is going to do going to be the first'

export const TRACKA_CAPTION_BURNIN_SOURCE_CHAIN = [
  { pr: 419, sha: '01e19cf6bd975b6ac9168c2d226638d211849886', summary: 'visual review outcome pass_with_warnings_sample_level' },
  { pr: 422, sha: 'cc49487f56e2c30f8f77af84b856da0453a07e1d', summary: 'visual gap closure packet' },
  { pr: 426, sha: '58a3f87a6fc07e3afc6fb699c40c8b744cc75eab', summary: 'approved controlled-test caption source' },
  { pr: 429, sha: 'e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f', summary: 'missing visual evidence bundle' },
  { pr: 434, sha: '2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3', summary: 'missing visual evidence review outcome partial_pass_with_warnings' },
  { pr: 440, sha: 'ea238ad8ffc28c277ea36ba66b8488cb37cf66cc', summary: 'caption burn-in revalidation planning' },
  { pr: 443, sha: 'e268a9e8afd5360df91653e9d2c060c05e270e43', summary: 'guarded burn-in execution packet ready_for_guarded_execution' },
  { pr: 447, sha: 'ce4b2feac22247581ba361e71df33feb1e667507', summary: '3R failed closed on blocked_missing_approved_private_source_ref' },
  { pr: 452, sha: '422bbcade670646963257f5b7b2ddc6681748f0b', summary: 'approved exact private controlled-test source ref' },
  { pr: 459, sha: '1a52c5a604b175bbd95c8e96294d963636ee8db0', summary: '3R2 loaded approved source and failed closed on missing runtime path' },
  { pr: 463, sha: 'c2d40f1b6e32330142d5d6b74f18ee37050b4fe3', summary: 'approved repo-owned FFmpeg/libass runtime path' },
] as const

export const TRACKA_CAPTION_BURNIN_DOC_PATHS = {
  execution: 'docs/track-a/track-a-caption-quality-3r3-burnin-revalidation-execution.md',
  approvedSource: 'docs/track-a/track-a-caption-quality-3r3-approved-source-input.md',
  sidecar: 'docs/track-a/track-a-caption-quality-3r3-corrected-ass-sidecar.md',
  artifactManifest: 'docs/track-a/track-a-caption-quality-3r3-private-artifact-manifest.md',
  qaReport: 'docs/track-a/track-a-caption-quality-3r3-qa-report.md',
  ffprobe: 'docs/track-a/track-a-caption-quality-3r3-ffprobe-validation.md',
  localBundle: 'docs/track-a/track-a-caption-quality-3r3-local-review-bundle.md',
  uploadInstructions: 'docs/track-a/track-a-caption-quality-3r3-upload-to-chat-instructions.md',
  nextPhase: 'docs/track-a/track-a-caption-quality-3r3-next-phase-plan.md',
  activationResults: 'docs/activation-phase-tracka-caption-quality-3r3-results.md',
  nextPrompt: 'docs/implementation-prompts/prompt-tracka-caption-quality-4-record-burnin-review-outcome.md',
} as const

function timestampRunId(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
}

export function getTrackaCaptionBurninRunId(): string {
  return process.env[TRACKA_CAPTION_BURNIN_RUN_ID_ENV] || `tracka-caption-quality-3r3-${timestampRunId()}`
}

export function isTrackaCaptionBurninConfirmed(): boolean {
  return process.env[TRACKA_CAPTION_BURNIN_CONFIRM_ENV] === 'true'
}

export function isTrackaCaptionGcsAccessRepairConfirmed(): boolean {
  return process.env[TRACKA_CAPTION_GCS_ACCESS_REPAIR_CONFIRM_ENV] === 'true'
}

export function isTrackaCaptionSourceGcsReadConfirmed(): boolean {
  return process.env[TRACKA_CAPTION_SOURCE_GCS_READ_CONFIRM_ENV] === 'true'
}

export function isTrackaCaptionRuntimeImageBuildConfirmed(): boolean {
  return process.env[TRACKA_CAPTION_RUNTIME_IMAGE_BUILD_CONFIRM_ENV] === 'true'
}
