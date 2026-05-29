import {
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_FILE_NAME,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_LICENSE_NAME,
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  SAM2_MODEL_FAMILY,
  SAM2_MODEL_ID,
} from './sam2-model-download-policy'
import type { ApprovedSam2ModelDownloadEvidence } from './sam2-model-download-types'

export const approvedSam2ModelDownloadEvidence: ApprovedSam2ModelDownloadEvidence = {
  phase: '35B',
  modelFamily: SAM2_MODEL_FAMILY,
  modelId: SAM2_MODEL_ID,
  checkpointFileName: SAM2_CHECKPOINT_FILE_NAME,
  configFileName: SAM2_CONFIG_FILE_NAME,
  status: 'verified',
  checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
  configSourceUrl: SAM2_CONFIG_SOURCE_URL,
  licenseName: SAM2_LICENSE_NAME,
  codexLicenseDecision: 'staging_download_approved_by_codex',
  humanLicenseApprovalRequired: false,
  targetGcsPath: SAM2_MODEL_DOWNLOAD_GCS_PATH,
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69',
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d',
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2',
  checkpointSizeBytes: 156008466,
  configSizeBytes: 3855,
  fileCount: 2,
  uploadedObjectCount: 5,
  downloadedAt: '2026-05-29T13:25:08.934Z',
  uploadedAt: '2026-05-29T13:27:03.520Z',
  verifiedAt: '2026-05-29T13:27:07.165Z',
  gcsManifestPath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
  gcsChecksumPath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
  gcsSourceEvidencePath: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
  sanitizedLocalTempPath: '/tmp/reeditpro-sam2-model-download/sam2.1-hiera-tiny',
  uploadedObjects: [
    {
      gcsUri: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}sam2.1_hiera_tiny.pt`,
      sizeBytes: 156008466,
      generation: '1780061222344482',
      crc32c: 'hVV2/A==',
    },
    {
      gcsUri: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}sam2.1_hiera_t.yaml`,
      sizeBytes: 3855,
      generation: '1780061112296059',
      crc32c: 'QPm09w==',
      md5Hash: '1mF8cpwrwINRaQ28AvB4qQ==',
    },
    {
      gcsUri: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
      sizeBytes: 173,
      generation: '1780061112290847',
      crc32c: 'mphoFQ==',
      md5Hash: 'H+vXfHqPKg+6VhVmICQmsA==',
    },
    {
      gcsUri: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
      sizeBytes: 1381,
      generation: '1780061112299653',
      crc32c: 'KQM1vw==',
      md5Hash: 'rmzC3uFDg551eDn8fRUfQw==',
    },
    {
      gcsUri: `${SAM2_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
      sizeBytes: 1417,
      generation: '1780061112284610',
      crc32c: 'XlofpA==',
      md5Hash: 'uYgqeQd8M8dhUDQ26mB7fw==',
    },
  ],
  iamChanges: [
    'none; Phase 35C runtime service-account objectViewer access is deferred.',
  ],
  blockers: [],
  warnings: [
    'Phase 35B downloaded and uploaded SAM2.1 tiny weights/config only; it did not run SAM2 runtime or process media.',
    'Runtime service-account access is deferred to Phase 35C unless a runtime verification phase explicitly approves it.',
  ],
}

export function getApprovedSam2ModelDownloadEvidence(): ApprovedSam2ModelDownloadEvidence {
  return {
    ...approvedSam2ModelDownloadEvidence,
    uploadedObjects: approvedSam2ModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),
    iamChanges: [...approvedSam2ModelDownloadEvidence.iamChanges],
    blockers: [...approvedSam2ModelDownloadEvidence.blockers],
    warnings: [...approvedSam2ModelDownloadEvidence.warnings],
  }
}
