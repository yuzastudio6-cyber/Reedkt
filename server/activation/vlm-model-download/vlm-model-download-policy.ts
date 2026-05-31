import {
  VLM_MODEL_DOWNLOAD_BUCKET,
  VLM_MODEL_DOWNLOAD_ENV,
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_PHASE,
  VLM_MODEL_DOWNLOAD_PROJECT_ID,
  VLM_MODEL_DOWNLOAD_REGION,
  VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  VLM_MODEL_DOWNLOAD_TEMP_ROOT,
} from './vlm-model-download-config'
import type { VlmModelDownloadPreflightInput, VlmModelDownloadPreflightResult } from './vlm-model-download-types'

export {
  VLM_MODEL_DOWNLOAD_BUCKET,
  VLM_MODEL_DOWNLOAD_ENV,
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_PHASE,
  VLM_MODEL_DOWNLOAD_PROJECT_ID,
  VLM_MODEL_DOWNLOAD_REGION,
  VLM_MODEL_DOWNLOAD_TARGET_PREFIX,
  VLM_MODEL_DOWNLOAD_TEMP_ROOT,
}

export const vlmModelDownloadExecutionDoesNotDo = [
  'no vLLM runtime execution',
  'no Transformers inference',
  'no SGLang runtime execution',
  'no VLM inference',
  'no runtime model auto-download',
  'no image processing',
  'no video processing',
  'no real-media processing',
  'no arbitrary media input',
  'no GPU jobs',
  'no Cloud Run deploy or execution',
  'no Docker build or push',
  'no provider calls',
  'no public model storage',
  'no signed URL source of truth',
  'no source-media bucket storage',
  'no model payloads committed to git',
  'no production, internal beta, or external beta unlock',
  'no Track A runtime or visual stack work',
]

export function validateVlmModelDownloadExecutionEnv(
  input: VlmModelDownloadPreflightInput = {},
): VlmModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const downloadConfirmation = input.downloadConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD
  const privateGcsUploadConfirmation = input.privateGcsUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD

  if (projectId !== VLM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== VLM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== VLM_MODEL_DOWNLOAD_REGION) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== VLM_MODEL_DOWNLOAD_ENV) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (downloadConfirmation !== 'true') blockers.push('The current-shell VLM model download confirmation is required for Phase 39B download execution.')
  if (privateGcsUploadConfirmation !== 'true') blockers.push('The current-shell VLM private GCS upload confirmation is required for Phase 39B private GCS upload.')
  if (input.bucketName && input.bucketName !== VLM_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== VLM_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved Qwen3-VL private model-weight prefix.')
  if (input.revision && input.revision !== VLM_MODEL_DOWNLOAD_EXPECTED_REVISION) blockers.push('Revision must be the pinned Phase 39B Hugging Face commit SHA.')
  if (input.localTempDir && isVlmModelDownloadPathInsideRepo(input.localTempDir)) blockers.push('VLM model download path must be outside the git repo.')
  if (input.providerExecutionEnabled && input.providerExecutionEnabled !== 'false') blockers.push('Provider execution must remain disabled for Phase 39B.')
  if (input.vlmRuntimeExecutionEnabled && input.vlmRuntimeExecutionEnabled !== 'false') blockers.push('VLM runtime execution must remain disabled for Phase 39B.')
  if (input.transformersInferenceEnabled && input.transformersInferenceEnabled !== 'false') blockers.push('Transformers inference must remain disabled for Phase 39B.')
  if (input.gpuJobEnabled && input.gpuJobEnabled !== 'false') blockers.push('GPU jobs must remain disabled for Phase 39B.')
  if (input.mediaProcessingEnabled && input.mediaProcessingEnabled !== 'false') blockers.push('Media processing must remain disabled for Phase 39B.')
  if (input.productionReady && input.productionReady !== 'false') blockers.push('Production readiness must remain false for Phase 39B.')
  if (input.internalBetaReady && input.internalBetaReady !== 'false') blockers.push('Internal beta readiness must remain false for Phase 39B.')
  if (input.externalBetaReady && input.externalBetaReady !== 'false') blockers.push('External beta readiness must remain false for Phase 39B.')
  if (input.broadRealMediaReady && input.broadRealMediaReady !== 'false') blockers.push('Broad real-media readiness must remain false for Phase 39B.')
  if (input.trackAExecutionEnabled && input.trackAExecutionEnabled !== 'false') blockers.push('Track A execution must remain disabled for Phase 39B.')
  if (input.publicOutputEnabled && input.publicOutputEnabled !== 'false') blockers.push('Public output must remain disabled for Phase 39B.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 39B execution.')

  warnings.push('Phase 39B downloads/stages selected Qwen3-VL assets only; VLM runtime and inference remain blocked until Phase 39C.')
  warnings.push('Phase 39B must not instantiate vLLM, Transformers, SGLang, or process media.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateVlmModelDownloadStaticPlan(
  input: VlmModelDownloadPreflightInput = {},
): VlmModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== VLM_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== VLM_MODEL_DOWNLOAD_REGION) blockers.push('GCP region must be exactly us-central1.')
  if (input.env && input.env !== VLM_MODEL_DOWNLOAD_ENV) blockers.push('Environment must be staging.')
  if (input.bucketName && input.bucketName !== VLM_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== VLM_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved Qwen3-VL private model-weight prefix.')
  if (input.revision && input.revision !== VLM_MODEL_DOWNLOAD_EXPECTED_REVISION) blockers.push('Static plan revision must remain the pinned Phase 39B Hugging Face commit SHA.')
  warnings.push('Static plan/report/smoke mode does not download Qwen3-VL assets, mutate GCS, run inference, process media, or unlock beta/production.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isVlmModelDownloadPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)|\/private\/tmp\/reeditpro-phase39b-qwen3-vl-exact-assets-private-staging(?:\/|$)/.test(path)
}
