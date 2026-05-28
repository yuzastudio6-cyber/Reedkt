import { BIREFNET_STAGING_PATH } from '../mask-model-approval/mask-model-candidate-registry'
import { buildBiRefNetMaskModelStoragePlan } from '../mask-model-approval/mask-model-storage-plan'
import { buildMaskModelApprovalReport } from '../mask-model-approval/mask-model-approval-report-builder'
import type { MaskModelDownloadPreflightInput, MaskModelDownloadPreflightResult } from './mask-model-download-types'

export const APPROVED_MASK_MODEL_REPO_ID = 'ZhengPeng7/BiRefNet'
export const MASK_MODEL_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-mask-model-download'
export const MASK_MODEL_DOWNLOAD_LOCAL_DIR = `${MASK_MODEL_DOWNLOAD_TEMP_ROOT}/birefnet-main/snapshot`
export const MASK_MODEL_DOWNLOAD_VENV_DIR = `${MASK_MODEL_DOWNLOAD_TEMP_ROOT}/hf-venv`
export const MASK_MODEL_DOWNLOAD_LOG_DIR = 'activation-logs/mask-model-download/phase33b-birefnet'
export const MASK_MODEL_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'

export const maskModelDownloadExecutionDoesNotDo = [
  'no SAM2 downloads',
  'no non-BiRefNet model downloads',
  'no model files committed to git',
  'no source-media bucket storage',
  'no public model storage',
  'no signed URL source of truth',
  'no GPU deploy',
  'no Cloud Run deploy',
  'no provider calls',
  'no frame or video processing',
  'no mask execution',
  'no text-behind-subject execution',
  'no secret values',
  'no production or external beta unblock',
]

export function validateMaskModelDownloadPreflight(input: MaskModelDownloadPreflightInput = {}): MaskModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const approvalReport = buildMaskModelApprovalReport()
  const approvedBiRefNet = approvalReport.approvedModels.some((model) => (
    model.modelWeightManifestId === 'birefnet_main_staging_v1' &&
    model.modelName === APPROVED_MASK_MODEL_REPO_ID &&
    model.reviewStatus === 'staging_approved_for_single_frame_mask_test'
  ))
  const sam2Blocked = approvalReport.evaluatedOnlyModels.some((candidate) => candidate.candidateId === 'facebook_sam2_hiera_tiny') &&
    approvalReport.approvedModels.every((model) => model.toolId !== 'sam2')

  if (input.projectId && input.projectId !== 'reeditpro') blockers.push('GCP project must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== MASK_MODEL_DOWNLOAD_BUCKET) blockers.push('Generated-assets staging bucket is required.')
  if (input.repoId && input.repoId !== APPROVED_MASK_MODEL_REPO_ID) blockers.push('Only ZhengPeng7/BiRefNet may be downloaded in Phase 33B.')
  if (input.repoPath && isMaskModelPathInsideRepo(input.repoPath)) blockers.push('Mask model download path must be outside the git repo.')
  if (!approvedBiRefNet) blockers.push('Phase 33A approval report does not approve ZhengPeng7/BiRefNet.')
  if (!sam2Blocked) blockers.push('SAM2 must remain evaluated-only and execution-blocked.')

  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  if (storagePlan.stagingStoragePath !== BIREFNET_STAGING_PATH) blockers.push('Storage plan path does not match approved BiRefNet model path.')
  if (storagePlan.publicAccessAllowed) blockers.push('Storage plan allows public access.')
  if (storagePlan.sourceMediaBucketAllowed || storagePlan.stagingStoragePath.includes('source-media')) blockers.push('Mask model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('Mask model storage must not allow committed model files.')
  warnings.push('Phase 33B downloads and stores weights only; runtime inference remains blocked until Phase 33C.')
  warnings.push('BiRefNet custom code, if present, must be recorded but not executed.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isApprovedMaskModelRepo(repoId: string): boolean {
  return repoId === APPROVED_MASK_MODEL_REPO_ID
}

export function isMaskModelPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)/.test(path)
}
