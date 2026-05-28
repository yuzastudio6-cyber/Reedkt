import {
  BIREFNET_RUNTIME_PATH,
  BIREFNET_RUNTIME_TEMP_PATH,
  BIREFNET_STAGING_PATH,
} from '../mask-model-approval/mask-model-candidate-registry'
import type { ApprovedMaskModelDownloadEvidence } from './mask-model-download-types'

export const approvedMaskModelDownloadEvidence: ApprovedMaskModelDownloadEvidence = {
  modelWeightManifestId: 'birefnet_main_staging_v1',
  repoId: 'ZhengPeng7/BiRefNet',
  modelName: 'ZhengPeng7/BiRefNet',
  status: 'verified',
  resolvedRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4',
  aggregateSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7',
  fileCount: 9,
  totalSizeBytes: 444584498,
  downloadedAt: '2026-05-28T14:38:34Z',
  uploadedAt: '2026-05-28T14:40:05Z',
  stagingStoragePath: BIREFNET_STAGING_PATH,
  runtimePath: BIREFNET_RUNTIME_PATH,
  runtimeTempPath: BIREFNET_RUNTIME_TEMP_PATH,
  gcsManifestPath: `${BIREFNET_STAGING_PATH}model_tree_manifest.json`,
  gcsChecksumPath: `${BIREFNET_STAGING_PATH}file_checksums_sha256.txt`,
  sanitizedLocalTempPath: '/tmp/reeditpro-mask-model-download/birefnet-main/snapshot',
  uploadedObjectCount: 11,
  readmeLicenseFiles: ['README.md'],
  configFiles: ['config.json', 'requirements.txt'],
  customCodeFiles: ['BiRefNet_config.py', 'birefnet.py', 'handler.py'],
  modelWeightFiles: ['model.safetensors'],
  tokenizerFiles: [],
  hasCustomCode: true,
  hasSafetensorsOrBinWeights: true,
  blockers: [],
  warnings: [
    'Phase 33B verifies private staging model storage only; it does not run BiRefNet inference.',
    'BiRefNet snapshot contains Python/custom-code files; they were recorded and uploaded as snapshot evidence but not executed.',
    'gcloud storage emitted a parallel composite upload warning for the large safetensors object; SHA-256 checksum manifests are retained as model evidence.',
    'Mask execution and text-behind-subject remain blocked until Phase 33C runtime verification and mask QA pass.',
  ],
}

export function getApprovedMaskModelDownloadEvidence(): ApprovedMaskModelDownloadEvidence {
  return {
    ...approvedMaskModelDownloadEvidence,
    readmeLicenseFiles: [...approvedMaskModelDownloadEvidence.readmeLicenseFiles],
    configFiles: [...approvedMaskModelDownloadEvidence.configFiles],
    customCodeFiles: [...approvedMaskModelDownloadEvidence.customCodeFiles],
    modelWeightFiles: [...approvedMaskModelDownloadEvidence.modelWeightFiles],
    tokenizerFiles: [...approvedMaskModelDownloadEvidence.tokenizerFiles],
    blockers: [...approvedMaskModelDownloadEvidence.blockers],
    warnings: [...approvedMaskModelDownloadEvidence.warnings],
  }
}
