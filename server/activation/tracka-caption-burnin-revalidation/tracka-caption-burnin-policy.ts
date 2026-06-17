export const TRACKA_CAPTION_BURNIN_PHASE = 'TRACKA-CAPTION-QUALITY-3R'
export const TRACKA_CAPTION_BURNIN_BRANCH = 'codex/rp-tracka-caption-quality-3r-burnin-revalidation-execution'
export const TRACKA_CAPTION_BURNIN_BASE_BRANCH = 'codex/rp-model-orchestration-qwen-schema-timeout-target-calibration'
export const TRACKA_CAPTION_BURNIN_PR_TITLE = '[track-a] Corrected caption burn-in revalidation execution'
export const TRACKA_CAPTION_BURNIN_CONFIRM_ENV = 'REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION'
export const TRACKA_CAPTION_BURNIN_RUN_ID_ENV = 'REEDITPRO_TRACKA_CAPTION_BURNIN_RUN_ID'
export const TRACKA_CAPTION_BURNIN_DEFAULT_RUN_ID = 'tracka-caption-quality-3r-20260617T020429'
export const TRACKA_CAPTION_BURNIN_LOCAL_ROOT = '/tmp/reeditpro-tracka-caption-quality-3r'

export const TRACKA_CAPTION_BURNIN_NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation was allowed only when REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true and only for private review artifacts.'

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
] as const

export const TRACKA_CAPTION_BURNIN_DOC_PATHS = {
  execution: 'docs/track-a/track-a-caption-quality-3r-burnin-revalidation-execution.md',
  sidecar: 'docs/track-a/track-a-caption-quality-3r-approved-caption-sidecar.md',
  artifactManifest: 'docs/track-a/track-a-caption-quality-3r-private-artifact-manifest.md',
  qaReport: 'docs/track-a/track-a-caption-quality-3r-qa-report.md',
  ffprobe: 'docs/track-a/track-a-caption-quality-3r-ffprobe-validation.md',
  localBundle: 'docs/track-a/track-a-caption-quality-3r-local-review-bundle.md',
  uploadInstructions: 'docs/track-a/track-a-caption-quality-3r-upload-to-chat-instructions.md',
  nextPhase: 'docs/track-a/track-a-caption-quality-3r-next-phase-plan.md',
  activationResults: 'docs/activation-phase-tracka-caption-quality-3r-results.md',
  nextPrompt: 'docs/implementation-prompts/prompt-tracka-caption-quality-4-record-burnin-review-outcome.md',
} as const

export function getTrackaCaptionBurninRunId(): string {
  return process.env[TRACKA_CAPTION_BURNIN_RUN_ID_ENV] || TRACKA_CAPTION_BURNIN_DEFAULT_RUN_ID
}

export function isTrackaCaptionBurninConfirmed(): boolean {
  return process.env[TRACKA_CAPTION_BURNIN_CONFIRM_ENV] === 'true'
}
