import {
  REAL_ESRGAN_X4PLUS_STAGING_PATH,
} from '../enhancement-model-approval/enhancement-model-candidate-registry'
import { buildEnhancementModelApprovalReport } from '../enhancement-model-approval/enhancement-model-approval-report-builder'
import { buildRealEsrganEnhancementModelStoragePlan } from '../enhancement-model-approval/enhancement-model-storage-plan'
import type {
  EnhancementModelDownloadPreflightInput,
  EnhancementModelDownloadPreflightResult,
} from './enhancement-model-download-types'

export const APPROVED_ENHANCEMENT_MODEL_NAME = 'RealESRGAN_x4plus'
export const APPROVED_ENHANCEMENT_MODEL_FILE = 'RealESRGAN_x4plus.pth'
export const APPROVED_ENHANCEMENT_MODEL_SOURCE_URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
export const APPROVED_ENHANCEMENT_MODEL_RELEASE_VERSION = 'v0.1.0'
export const ENHANCEMENT_MODEL_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-enhancement-model-download'
export const ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR = `${ENHANCEMENT_MODEL_DOWNLOAD_TEMP_ROOT}/real-esrgan-x4plus`
export const ENHANCEMENT_MODEL_DOWNLOAD_LOG_DIR = 'activation-logs/enhancement-model-download/phase34b-real-esrgan-x4plus'
export const ENHANCEMENT_MODEL_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'

export const enhancementModelDownloadExecutionDoesNotDo = [
  'no FILM downloads',
  'no alternate Real-ESRGAN model downloads',
  'no GFPGAN or facexlib weight downloads',
  'no anime or realesr-general model downloads',
  'no model files committed to git',
  'no source-media bucket storage',
  'no public model storage',
  'no signed URL source of truth',
  'no GPU deploy',
  'no Cloud Run deploy',
  'no provider calls',
  'no frame or video processing',
  'no enhancement execution',
  'no slow-motion execution',
  'no secret values',
  'no production or external beta unblock',
]

export function validateEnhancementModelDownloadPreflight(input: EnhancementModelDownloadPreflightInput = {}): EnhancementModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const approvalReport = buildEnhancementModelApprovalReport()
  const approvedRealEsrgan = approvalReport.approvedModels.some((model) => (
    model.modelWeightManifestId === 'real_esrgan_x4plus_staging_v1' &&
    model.modelName === APPROVED_ENHANCEMENT_MODEL_NAME &&
    model.reviewStatus === 'staging_approved_for_sample_first_enhancement'
  ))
  const filmBlocked = approvalReport.evaluatedOnlyModels.some((candidate) => candidate.candidateId === 'google_research_film') &&
    approvalReport.approvedModels.every((model) => model.toolId !== 'film')

  if (input.projectId && input.projectId !== 'reeditpro') blockers.push('GCP project must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== ENHANCEMENT_MODEL_DOWNLOAD_BUCKET) blockers.push('Generated-assets staging bucket is required.')
  if (input.sourceUrl && input.sourceUrl !== APPROVED_ENHANCEMENT_MODEL_SOURCE_URL) blockers.push('Only the official RealESRGAN_x4plus release asset URL may be downloaded in Phase 34B.')
  if (input.fileName && input.fileName !== APPROVED_ENHANCEMENT_MODEL_FILE) blockers.push('Only RealESRGAN_x4plus.pth may be downloaded in Phase 34B.')
  if (input.repoPath && isEnhancementModelPathInsideRepo(input.repoPath)) blockers.push('Enhancement model download path must be outside the git repo.')
  if (!approvedRealEsrgan) blockers.push('Phase 34A approval report does not approve RealESRGAN_x4plus.')
  if (!filmBlocked) blockers.push('FILM must remain evaluated-only and execution/download-blocked.')

  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  if (storagePlan.stagingStoragePath !== REAL_ESRGAN_X4PLUS_STAGING_PATH) blockers.push('Storage plan path does not match approved RealESRGAN_x4plus model path.')
  if (storagePlan.publicAccessAllowed) blockers.push('Storage plan allows public access.')
  if (storagePlan.sourceMediaBucketAllowed || storagePlan.stagingStoragePath.includes('source-media')) blockers.push('Enhancement model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('Enhancement model storage must not allow committed model files.')
  warnings.push('Phase 34B downloads and stores weights only; runtime inference remains blocked until Phase 34C.')
  warnings.push('Downloaded .pth file must be inspected and checksummed only; do not load it with torch in Phase 34B.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isApprovedEnhancementModelSourceUrl(sourceUrl: string): boolean {
  return sourceUrl === APPROVED_ENHANCEMENT_MODEL_SOURCE_URL
}

export function isApprovedEnhancementModelFile(fileName: string): boolean {
  return fileName === APPROVED_ENHANCEMENT_MODEL_FILE
}

export function isEnhancementModelPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)/.test(path)
}
