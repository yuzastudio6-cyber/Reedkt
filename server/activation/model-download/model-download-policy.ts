import {
  FASTER_WHISPER_TINY_STAGING_PATH,
} from '../model-approval/model-candidate-registry'
import { buildFasterWhisperTinyStoragePlan } from '../model-approval/model-storage-plan'
import { buildModelApprovalReport } from '../model-approval/model-approval-report-builder'
import type { ModelDownloadPreflightInput, ModelDownloadPreflightResult } from './model-download-types'

export const APPROVED_MODEL_REPO_ID = 'Systran/faster-whisper-tiny'
export const APPROVED_MODEL_REVISION = 'd90ca5fe260221311c53c58e660288d3deb8d356'
export const MODEL_DOWNLOAD_TEMP_ROOT = '/tmp/reeditpro-model-download'
export const MODEL_DOWNLOAD_LOCAL_DIR = `${MODEL_DOWNLOAD_TEMP_ROOT}/faster-whisper-tiny/snapshot`
export const MODEL_DOWNLOAD_VENV_DIR = `${MODEL_DOWNLOAD_TEMP_ROOT}/hf-venv`
export const MODEL_DOWNLOAD_LOG_DIR = 'activation-logs/model-download/phase26b-faster-whisper-tiny'
export const MODEL_DOWNLOAD_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'

export const modelDownloadExecutionDoesNotDo = [
  'no other model downloads',
  'no larger Whisper model downloads',
  'no non-speech model downloads',
  'no model files committed to git',
  'no source-media bucket storage',
  'no public model storage',
  'no signed URL source of truth',
  'no GPU deploy',
  'no Cloud Run deploy',
  'no provider calls',
  'no real media processing',
  'no secret values',
  'no production or external beta unblock',
]

export function validateModelDownloadPreflight(input: ModelDownloadPreflightInput = {}): ModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const approvalReport = buildModelApprovalReport()
  const approvedTiny = approvalReport.approvedModels.some((model) => (
    model.modelWeightManifestId === 'faster_whisper_tiny_staging_v1' &&
    model.modelName === APPROVED_MODEL_REPO_ID &&
    model.reviewStatus === 'staging_approved'
  ))

  if (input.projectId && input.projectId !== 'reeditpro') blockers.push('GCP project must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
  if (input.env && input.env !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (input.confirmation && input.confirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD=true is required for execution.')
  if (input.bucketName && input.bucketName !== MODEL_DOWNLOAD_BUCKET) blockers.push('Generated-assets staging bucket is required.')
  if (input.repoId && input.repoId !== APPROVED_MODEL_REPO_ID) blockers.push('Only Systran/faster-whisper-tiny may be downloaded in Phase 26B.')
  if (input.repoPath && isPathInsideRepo(input.repoPath)) blockers.push('Model download path must be outside the git repo.')
  if (!approvedTiny) blockers.push('Phase 26 approval report does not approve Systran/faster-whisper-tiny.')

  const storagePlan = buildFasterWhisperTinyStoragePlan()
  if (storagePlan.stagingStoragePath !== FASTER_WHISPER_TINY_STAGING_PATH) blockers.push('Storage plan path does not match approved tiny model path.')
  if (storagePlan.publicAccessAllowed) blockers.push('Storage plan allows public access.')
  if (storagePlan.sourceMediaBucketAllowed || storagePlan.stagingStoragePath.includes('source-media')) blockers.push('Model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('Model storage must not allow committed model files.')
  warnings.push('Runtime execution remains blocked until a speech runtime image/job is deployed and verified.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isApprovedModelRepo(repoId: string): boolean {
  return repoId === APPROVED_MODEL_REPO_ID
}

export function isPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)/.test(path)
}
