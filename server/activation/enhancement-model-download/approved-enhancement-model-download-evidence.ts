import {
  REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
  REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH,
  REAL_ESRGAN_X4PLUS_STAGING_PATH,
} from '../enhancement-model-approval/enhancement-model-candidate-registry'
import type { ApprovedEnhancementModelDownloadEvidence } from './enhancement-model-download-types'

export const approvedEnhancementModelDownloadEvidence: ApprovedEnhancementModelDownloadEvidence = {
  modelWeightManifestId: 'real_esrgan_x4plus_staging_v1',
  modelName: 'RealESRGAN_x4plus',
  status: 'verified',
  sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
  releaseVersion: 'v0.1.0',
  fileName: 'RealESRGAN_x4plus.pth',
  fileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1',
  aggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5',
  fileCount: 1,
  totalSizeBytes: 67040989,
  downloadedAt: '2026-05-28T17:45:04Z',
  uploadedAt: '2026-05-28T17:45:48Z',
  stagingStoragePath: REAL_ESRGAN_X4PLUS_STAGING_PATH,
  runtimePath: REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
  runtimeTempPath: REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH,
  gcsManifestPath: `${REAL_ESRGAN_X4PLUS_STAGING_PATH}model_tree_manifest.json`,
  gcsChecksumPath: `${REAL_ESRGAN_X4PLUS_STAGING_PATH}file_checksums_sha256.txt`,
  sanitizedLocalTempPath: '/tmp/reeditpro-enhancement-model-download/real-esrgan-x4plus',
  uploadedObjectCount: 3,
  readmeLicenseFiles: [],
  configFiles: [],
  modelWeightFiles: ['RealESRGAN_x4plus.pth'],
  hasPthWeight: true,
  blockers: [],
  warnings: [
    'Phase 34B verifies private staging model storage only; it does not run Real-ESRGAN inference.',
    'Release asset evidence is staging-only; production, external beta, paid production, and broad real media remain blocked.',
    'FILM, alternate Real-ESRGAN weights, GFPGAN/facexlib weights, enhancement execution, slow motion, and GPU runtime remain blocked.',
  ],
}

export function getApprovedEnhancementModelDownloadEvidence(): ApprovedEnhancementModelDownloadEvidence {
  return {
    ...approvedEnhancementModelDownloadEvidence,
    readmeLicenseFiles: [...approvedEnhancementModelDownloadEvidence.readmeLicenseFiles],
    configFiles: [...approvedEnhancementModelDownloadEvidence.configFiles],
    modelWeightFiles: [...approvedEnhancementModelDownloadEvidence.modelWeightFiles],
    blockers: [...approvedEnhancementModelDownloadEvidence.blockers],
    warnings: [...approvedEnhancementModelDownloadEvidence.warnings],
  }
}
