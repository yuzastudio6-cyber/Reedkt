import type {
  FilmModelDownloadPreflightInput,
  FilmModelDownloadPreflightResult,
} from './film-model-download-types'

export const FILM_MODEL_DOWNLOAD_PHASE = '38B'
export const FILM_MODEL_DOWNLOAD_TRACK = 'A visual/video'
export const FILM_MODEL_DOWNLOAD_PROJECT_ID = 'reeditpro'
export const FILM_MODEL_DOWNLOAD_REGION = 'us-central1'
export const FILM_MODEL_DOWNLOAD_ENV = 'staging'
export const FILM_TOOL_FAMILY = 'FILM / frame interpolation / slow motion'
export const FILM_MODEL_ID = 'film_net_style_saved_model'
export const FILM_SELECTED_ARTIFACT_ROOT = 'film_net/Style/saved_model'
export const FILM_SOURCE_REPO = 'google-research/frame-interpolation'
export const FILM_SOURCE_REPO_URL = 'https://github.com/google-research/frame-interpolation'
export const FILM_PROJECT_PAGE_URL = 'https://film-net.github.io/'
export const FILM_README_URL = 'https://raw.githubusercontent.com/google-research/frame-interpolation/main/README.md'
export const FILM_LICENSE_URL = 'https://raw.githubusercontent.com/google-research/frame-interpolation/main/LICENSE'
export const FILM_CHECKPOINT_SOURCE_URL = 'https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy?usp=sharing'
export const FILM_GOOGLE_DRIVE_ROOT_FOLDER_ID = '1q8110-qp225asX3DQvZnfLfJPkCHmDpy'
export const FILM_LICENSE_NAME = 'Apache-2.0'
export const FILM_MODEL_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const FILM_MODEL_DOWNLOAD_TARGET_PREFIX = 'model-weights/film/film-net-style-saved-model/'
export const FILM_MODEL_DOWNLOAD_GCS_PATH = `gs://${FILM_MODEL_DOWNLOAD_BUCKET}/${FILM_MODEL_DOWNLOAD_TARGET_PREFIX}`
export const FILM_MODEL_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-film-model-download'
export const FILM_MODEL_DOWNLOAD_LOCAL_DIR = `${FILM_MODEL_DOWNLOAD_TEMP_ROOT}/film-net-style-saved-model`

export const FILM_EXPECTED_MODEL_FILE_PATHS = [
  'film_net/Style/saved_model/keras_metadata.pb',
  'film_net/Style/saved_model/saved_model.pb',
  'film_net/Style/saved_model/variables/variables.data-00000-of-00001',
  'film_net/Style/saved_model/variables/variables.index',
] as const

export const FILM_EXPECTED_UPLOAD_MANIFEST_FILES = [
  'file_checksums_sha256.txt',
  'model_tree_manifest.json',
  'source_evidence.json',
  'license_evidence.json',
  'download_report.json',
] as const

export const filmModelDownloadExecutionDoesNotDo = [
  'no FILM runtime execution',
  'no slow-motion execution',
  'no generated-frame interpolation',
  'no real-video slow-motion sample',
  'no full-video interpolation',
  'no media processing',
  'no GPU jobs',
  'no Cloud Run deploy or execution',
  'no Docker build or push',
  'no provider calls',
  'no Revideo path',
  'no public model storage',
  'no signed URL source of truth',
  'no public bucket principals',
  'no model files committed to git',
  'no production or external beta unblock',
  'no Track B audio/OCR mutation',
]

export function validateFilmModelDownloadExecutionEnv(input: FilmModelDownloadPreflightInput = {}): FilmModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD

  if (projectId !== FILM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== FILM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== FILM_MODEL_DOWNLOAD_REGION) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== FILM_MODEL_DOWNLOAD_ENV) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== FILM_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== FILM_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved FILM private model-weight prefix.')
  if (input.sourceRepoUrl && input.sourceRepoUrl !== FILM_SOURCE_REPO_URL) blockers.push('Source repo URL must be the official google-research/frame-interpolation URL.')
  if (input.checkpointSourceUrl && input.checkpointSourceUrl !== FILM_CHECKPOINT_SOURCE_URL) blockers.push('Checkpoint source URL must be the approved official README Google Drive folder.')
  if (input.selectedArtifactRoot && input.selectedArtifactRoot !== FILM_SELECTED_ARTIFACT_ROOT) blockers.push('Selected artifact root must be exactly film_net/Style/saved_model.')
  if (input.localTempDir && isFilmModelPathInsideRepo(input.localTempDir)) blockers.push('FILM model download path must be outside the git repo.')
  if (input.providerExecutionEnabled && input.providerExecutionEnabled !== 'false') blockers.push('Provider execution must remain disabled for Phase 38B.')
  if (input.publicAccessEnabled && input.publicAccessEnabled !== 'false') blockers.push('Public access must remain disabled for Phase 38B.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 38B execution.')

  warnings.push('Phase 38B downloads and stores approved FILM artifacts only; runtime interpolation remains blocked until Phase 38C.')
  warnings.push('Phase 38B must not load TensorFlow, run FILM inference, process media, build Docker, or deploy Cloud Run.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateFilmModelDownloadStaticPlan(input: FilmModelDownloadPreflightInput = {}): FilmModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== FILM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== FILM_MODEL_DOWNLOAD_REGION) blockers.push('GCP region must be us-central1.')
  if (input.env && input.env !== FILM_MODEL_DOWNLOAD_ENV) blockers.push('Environment must be staging.')
  if (input.bucketName && input.bucketName !== FILM_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== FILM_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved FILM private model-weight prefix.')
  if (input.sourceRepoUrl && input.sourceRepoUrl !== FILM_SOURCE_REPO_URL) blockers.push('Source repo URL must be the official google-research/frame-interpolation URL.')
  if (input.checkpointSourceUrl && input.checkpointSourceUrl !== FILM_CHECKPOINT_SOURCE_URL) blockers.push('Checkpoint source URL must be the approved official README Google Drive folder.')
  if (input.selectedArtifactRoot && input.selectedArtifactRoot !== FILM_SELECTED_ARTIFACT_ROOT) blockers.push('Selected artifact root must be exactly film_net/Style/saved_model.')
  warnings.push('Static plan/report mode does not download models, upload to GCS, or mutate cloud resources.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isFilmModelPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)|\/Volumes\/backup\/REeditpro(?:\/|$)|\/Volumes\/backup\/codex-worktrees\/reeditpro-phase38b-film-model-download(?:\/|$)/.test(path)
}
