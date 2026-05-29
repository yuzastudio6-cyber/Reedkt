import type {
  Sam2ModelDownloadPreflightInput,
  Sam2ModelDownloadPreflightResult,
} from './sam2-model-download-types'

export const SAM2_MODEL_DOWNLOAD_PHASE = '35B'
export const SAM2_MODEL_DOWNLOAD_PROJECT_ID = 'reeditpro'
export const SAM2_MODEL_DOWNLOAD_REGION = 'us-central1'
export const SAM2_MODEL_DOWNLOAD_ENV = 'staging'
export const SAM2_MODEL_FAMILY = 'SAM2 / Segment Anything Model 2'
export const SAM2_MODEL_ID = 'sam2.1_hiera_tiny'
export const SAM2_CHECKPOINT_FILE_NAME = 'sam2.1_hiera_tiny.pt'
export const SAM2_CONFIG_FILE_NAME = 'sam2.1_hiera_t.yaml'
export const SAM2_CHECKPOINT_SOURCE_URL = 'https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_tiny.pt'
export const SAM2_CONFIG_SOURCE_URL = 'https://raw.githubusercontent.com/facebookresearch/sam2/main/sam2/configs/sam2.1/sam2.1_hiera_t.yaml'
export const SAM2_SOURCE_REPO = 'facebookresearch/sam2'
export const SAM2_SOURCE_REPO_URL = 'https://github.com/facebookresearch/sam2'
export const SAM2_LICENSE_NAME = 'Apache-2.0'
export const SAM2_MODEL_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
export const SAM2_MODEL_DOWNLOAD_TARGET_PREFIX = 'model-weights/sam2/sam2.1-hiera-tiny/'
export const SAM2_MODEL_DOWNLOAD_GCS_PATH = `gs://${SAM2_MODEL_DOWNLOAD_BUCKET}/${SAM2_MODEL_DOWNLOAD_TARGET_PREFIX}`
export const SAM2_MODEL_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-sam2-model-download'
export const SAM2_MODEL_DOWNLOAD_LOCAL_DIR = `${SAM2_MODEL_DOWNLOAD_TEMP_ROOT}/sam2.1-hiera-tiny`

export const sam2ModelDownloadExecutionDoesNotDo = [
  'no SAM2 runtime execution',
  'no temporal tracking',
  'no full-video masks',
  'no full-video text-behind-subject',
  'no media processing',
  'no GPU jobs',
  'no Cloud Run deploy or execution',
  'no Docker build or push',
  'no provider calls',
  'no public model storage',
  'no signed URL source of truth',
  'no public bucket principals',
  'no model files committed to git',
  'no production or external beta unblock',
  'no Revideo production path',
  'no FILM or slow-motion work',
]

export function validateSam2ModelDownloadExecutionEnv(input: Sam2ModelDownloadPreflightInput = {}): Sam2ModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const confirmation = input.confirmation ?? process.env.REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD

  if (projectId !== SAM2_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== SAM2_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== SAM2_MODEL_DOWNLOAD_REGION) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== SAM2_MODEL_DOWNLOAD_ENV) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== SAM2_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== SAM2_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved SAM2.1 tiny private model-weight prefix.')
  if (input.checkpointSourceUrl && input.checkpointSourceUrl !== SAM2_CHECKPOINT_SOURCE_URL) blockers.push('Checkpoint source URL must be the approved official Meta SAM2.1 tiny URL.')
  if (input.configSourceUrl && input.configSourceUrl !== SAM2_CONFIG_SOURCE_URL) blockers.push('Config source URL must be the approved official SAM2.1 tiny config URL.')
  if (input.localTempDir && isSam2ModelPathInsideRepo(input.localTempDir)) blockers.push('SAM2 model download path must be outside the git repo.')
  if (input.providerExecutionEnabled && input.providerExecutionEnabled !== 'false') blockers.push('Provider execution must remain disabled for Phase 35B.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 35B execution.')

  warnings.push('Phase 35B downloads and stores approved SAM2 weights only; runtime inference remains blocked until Phase 35C.')
  warnings.push('Phase 35B must not load the .pt file with torch or process media.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateSam2ModelDownloadStaticPlan(input: Sam2ModelDownloadPreflightInput = {}): Sam2ModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== SAM2_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== SAM2_MODEL_DOWNLOAD_REGION) blockers.push('GCP region must be exactly us-central1.')
  if (input.env && input.env !== SAM2_MODEL_DOWNLOAD_ENV) blockers.push('Environment must be staging.')
  if (input.bucketName && input.bucketName !== SAM2_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== SAM2_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved SAM2.1 tiny private model-weight prefix.')
  if (input.checkpointSourceUrl && input.checkpointSourceUrl !== SAM2_CHECKPOINT_SOURCE_URL) blockers.push('Checkpoint source URL must be the approved official Meta SAM2.1 tiny URL.')
  if (input.configSourceUrl && input.configSourceUrl !== SAM2_CONFIG_SOURCE_URL) blockers.push('Config source URL must be the approved official SAM2.1 tiny config URL.')
  warnings.push('Static plan/report mode does not download models or mutate GCS.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isApprovedSam2CheckpointSourceUrl(sourceUrl: string): boolean {
  return sourceUrl === SAM2_CHECKPOINT_SOURCE_URL
}

export function isApprovedSam2ConfigSourceUrl(sourceUrl: string): boolean {
  return sourceUrl === SAM2_CONFIG_SOURCE_URL
}

export function isSam2ModelPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)|\/private\/tmp\/reeditpro-phase35b-sam2-model-download(?:\/|$)/.test(path)
}
