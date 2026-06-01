import type {
  DeepFilterNetDownloadPreflightInput,
  DeepFilterNetDownloadPreflightResult,
  DeepFilterNetSelectedArtifact,
} from './audio-ai-download-types'

export const DEEPFILTERNET_DOWNLOAD_PHASE = '36B'
export const DEEPFILTERNET_DOWNLOAD_PROJECT_ID = 'reeditpro'
export const DEEPFILTERNET_DOWNLOAD_REGION = 'us-central1'
export const DEEPFILTERNET_DOWNLOAD_ENV = 'staging'
export const DEEPFILTERNET_TOOL_FAMILY = 'audio_ai'
export const DEEPFILTERNET_TOOL_ID = 'deepfilternet'
export const DEEPFILTERNET_SELECTED_VERSION = 'v0.5.6'
export const DEEPFILTERNET_SOURCE_REPO = 'Rikorose/DeepFilterNet'
export const DEEPFILTERNET_SOURCE_REPO_URL = 'https://github.com/Rikorose/DeepFilterNet'
export const DEEPFILTERNET_RELEASE_URL = 'https://github.com/Rikorose/DeepFilterNet/releases/tag/v0.5.6'
export const DEEPFILTERNET_RELEASE_API_URL = 'https://api.github.com/repos/Rikorose/DeepFilterNet/releases/tags/v0.5.6'
export const DEEPFILTERNET_TREE_API_URL = 'https://api.github.com/repos/Rikorose/DeepFilterNet/git/trees/v0.5.6?recursive=1'
export const DEEPFILTERNET_README_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/README.md'
export const DEEPFILTERNET_LICENSE_MIT_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/LICENSE-MIT'
export const DEEPFILTERNET_LICENSE_APACHE_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/LICENSE-APACHE'
export const DEEPFILTERNET_ROOT_LICENSE_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/LICENSE'
export const DEEPFILTERNET_LIBDF_CARGO_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/libDF/Cargo.toml'
export const DEEPFILTERNET_PYPROJECT_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/DeepFilterNet/pyproject.toml'
export const DEEPFILTERNET_LICENSE_NAME = 'MIT OR Apache-2.0'
export const DEEPFILTERNET_CLI_FILE_NAME = 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
export const DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME = 'DeepFilterNet3_onnx.tar.gz'
export const DEEPFILTERNET_CLI_SOURCE_URL = 'https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/deep-filter-0.5.6-x86_64-unknown-linux-musl'
export const DEEPFILTERNET_ONNX_ARCHIVE_SOURCE_URL = 'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/models/DeepFilterNet3_onnx.tar.gz'
export const DEEPFILTERNET_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX = 'model-weights/audio-ai/deepfilternet/v0.5.6/'
export const DEEPFILTERNET_DOWNLOAD_GCS_PATH = `gs://${DEEPFILTERNET_DOWNLOAD_BUCKET}/${DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX}`
export const DEEPFILTERNET_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-deepfilternet-artifact-download'
export const DEEPFILTERNET_DOWNLOAD_LOCAL_DIR = `${DEEPFILTERNET_DOWNLOAD_TEMP_ROOT}/v0.5.6`

export const selectedDeepFilterNetArtifacts: DeepFilterNetSelectedArtifact[] = [
  {
    artifactId: 'deepfilternet-v0.5.6-linux-musl-cli',
    fileName: DEEPFILTERNET_CLI_FILE_NAME,
    kind: 'linux_x86_64_cli_binary',
    sourceUrl: DEEPFILTERNET_CLI_SOURCE_URL,
    sourceKind: 'github_release_asset',
    reason: 'Official v0.5.6 Linux x86_64 CLI binary for future linux/amd64 generated-audio runtime verification.',
  },
  {
    artifactId: 'deepfilternet-v0.5.6-dfn3-onnx-archive',
    fileName: DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
    kind: 'deepfilternet3_onnx_model_archive',
    sourceUrl: DEEPFILTERNET_ONNX_ARCHIVE_SOURCE_URL,
    sourceKind: 'github_raw_repo_model',
    reason: 'Official v0.5.6 DeepFilterNet3 ONNX model archive from the repo model tree.',
  },
]

export const deepFilterNetDownloadExecutionDoesNotDo = [
  'no DeepFilterNet runtime execution',
  'no DeepFilterNet audio processing',
  'no RNNoise download or runtime',
  'no Demucs download or runtime',
  'no real-video audio AI cleanup',
  'no media processing',
  'no Docker build or push',
  'no Cloud Run deploy or execution',
  'no provider calls',
  'no Revideo production path',
  'no FILM or slow-motion work',
  'no public model storage',
  'no public bucket principals',
  'no signed URL source of truth',
  'no model/tool artifacts committed to git',
  'no production or external beta unblock',
]

export function validateDeepFilterNetDownloadExecutionEnv(
  input: DeepFilterNetDownloadPreflightInput = {},
): DeepFilterNetDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD
  const artifactUrls = input.artifactUrls ?? selectedDeepFilterNetArtifacts.map((artifact) => artifact.sourceUrl)

  if (projectId !== DEEPFILTERNET_DOWNLOAD_PROJECT_ID) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== DEEPFILTERNET_DOWNLOAD_PROJECT_ID) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== DEEPFILTERNET_DOWNLOAD_REGION) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== DEEPFILTERNET_DOWNLOAD_ENV) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== DEEPFILTERNET_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved DeepFilterNet v0.5.6 private artifact prefix.')
  if (input.localTempDir && isDeepFilterNetDownloadPathInsideRepo(input.localTempDir)) blockers.push('DeepFilterNet artifact download path must be outside the git repo.')
  if (!hasExactlyApprovedArtifactUrls(artifactUrls)) blockers.push('Artifact URLs must be exactly the approved DeepFilterNet v0.5.6 CLI and DeepFilterNet3 ONNX archive URLs.')
  if (input.providerExecutionEnabled && input.providerExecutionEnabled !== 'false') blockers.push('Provider execution must remain disabled for Phase 36B.')
  if (input.productionReady && input.productionReady !== 'false') blockers.push('Production readiness must remain false for Phase 36B.')
  if (input.externalBetaReady && input.externalBetaReady !== 'false') blockers.push('External beta readiness must remain false for Phase 36B.')
  if (input.broadRealMediaReady && input.broadRealMediaReady !== 'false') blockers.push('Broad real-media readiness must remain false for Phase 36B.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 36B execution.')

  warnings.push('Phase 36B downloads and stores selected DeepFilterNet artifacts only; runtime and audio processing remain blocked until later phases.')
  warnings.push('Phase 36B must not execute deep-filter, load ONNX artifacts, or process audio/media.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateDeepFilterNetDownloadStaticPlan(
  input: DeepFilterNetDownloadPreflightInput = {},
): DeepFilterNetDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== DEEPFILTERNET_DOWNLOAD_PROJECT_ID) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== DEEPFILTERNET_DOWNLOAD_REGION) blockers.push('GCP region must be exactly us-central1.')
  if (input.env && input.env !== DEEPFILTERNET_DOWNLOAD_ENV) blockers.push('Environment must be staging.')
  if (input.bucketName && input.bucketName !== DEEPFILTERNET_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== DEEPFILTERNET_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved DeepFilterNet v0.5.6 private artifact prefix.')
  if (input.artifactUrls && !hasExactlyApprovedArtifactUrls(input.artifactUrls)) blockers.push('Static plan artifact URLs must remain exactly the approved DeepFilterNet v0.5.6 artifact URLs.')
  warnings.push('Static plan/report mode does not download artifacts, mutate GCS, run audio AI, or process media.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function hasExactlyApprovedArtifactUrls(urls: string[]): boolean {
  const approved = selectedDeepFilterNetArtifacts.map((artifact) => artifact.sourceUrl).sort()
  const candidate = [...urls].sort()
  return candidate.length === approved.length && candidate.every((url, index) => url === approved[index])
}

export function isApprovedDeepFilterNetArtifactUrl(sourceUrl: string): boolean {
  return selectedDeepFilterNetArtifacts.some((artifact) => artifact.sourceUrl === sourceUrl)
}

export function isDeepFilterNetDownloadPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)|\/Volumes\/backup\/codex-worktrees\/reeditpro-phase36b-deepfilternet-download(?:\/|$)/.test(path)
}
