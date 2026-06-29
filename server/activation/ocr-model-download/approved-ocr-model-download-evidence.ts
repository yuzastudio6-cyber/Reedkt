import { optionalDeferredOcrModelAssets, selectedOcrModelAssetRelativePaths, selectedOcrModelAssets } from './ocr-model-asset-registry'
import { buildComputedOcrChecksumManifest } from './ocr-model-checksum-manifest'
import { OCR_MODEL_DOWNLOAD_GCS_PATH, OCR_MODEL_DOWNLOAD_LOCAL_DIR } from './ocr-model-download-policy'
import type { ApprovedOcrModelDownloadEvidence, OcrChecksumManifest } from './ocr-model-download-types'

export const approvedOcrModelDownloadEvidence: ApprovedOcrModelDownloadEvidence = {
  phase: '37B',
  modelFamily: 'PP-OCRv5',
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
  status: 'verified',
  selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
  optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
  licenseName: 'Apache-2.0',
  codexLicenseDecision: 'staging_download_approved_by_codex',
  humanLicenseApprovalRequired: false,
  productionLegalApprovalComplete: false,
  exactAssetSelectionApproved: true,
  targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
  assetSha256: {
    'det/PP-OCRv5_mobile_det_infer.tar': '50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58',
    'dict/ppocrv5_dict.txt': 'd1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b',
    'rec/PP-OCRv5_mobile_rec_infer.tar': '566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414',
  },
  aggregateSha256: '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b',
  assetSizeBytes: {
    'det/PP-OCRv5_mobile_det_infer.tar': 4935680,
    'dict/ppocrv5_dict.txt': 74012,
    'rec/PP-OCRv5_mobile_rec_infer.tar': 16834560,
  },
  fileCount: 3,
  uploadedObjectCount: 12,
  downloadedAt: '2026-05-30T22:03:33.371Z',
  uploadedAt: '2026-05-30T22:03:56.822Z',
  verifiedAt: '2026-05-30T22:04:32.605Z',
  gcsAssetSelectionManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}asset_selection_manifest.json`,
  gcsChecksumManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}checksum_manifest.json`,
  gcsChecksumTextPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
  gcsModelTreeManifestPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
  gcsSourceEvidencePath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
  gcsLicenseEvidencePath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}license_evidence.json`,
  gcsDownloadReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}download_report.json`,
  gcsPrivateUploadReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}private_gcs_upload_report.json`,
  gcsPhaseReportPath: `${OCR_MODEL_DOWNLOAD_GCS_PATH}phase_37b_ocr_model_download_report.json`,
  sanitizedLocalTempPath: OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  uploadedObjects: [
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}det/PP-OCRv5_mobile_det_infer.tar`,
      sizeBytes: 4935680,
      generation: '1780178646052802',
      crc32c: 'lESk1g==',
      md5Hash: '+QmMRhxvrJr6rAFVsPqISA==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}rec/PP-OCRv5_mobile_rec_infer.tar`,
      sizeBytes: 16834560,
      generation: '1780178649649594',
      crc32c: 'V8EKeg==',
      md5Hash: '3q+UF8yM3j/3YSHL/I/Zzg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}dict/ppocrv5_dict.txt`,
      sizeBytes: 74012,
      generation: '1780178651380478',
      crc32c: 'JqGmBA==',
      md5Hash: 'A7+fiVCXVjPMXxKtlJUuLw==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}source_evidence.json`,
      sizeBytes: 4970,
      generation: '1780178653046292',
      crc32c: 'x8FBaw==',
      md5Hash: 'WMmojm+z1+HQJ4CtFbxEAA==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}license_evidence.json`,
      sizeBytes: 985,
      generation: '1780178654764829',
      crc32c: '3JmdwQ==',
      md5Hash: 'Vt1VYeFqmFUaCMzvC3KXGg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}asset_selection_manifest.json`,
      sizeBytes: 4288,
      generation: '1780178656456975',
      crc32c: 'vrBByQ==',
      md5Hash: 'EAhSRsQFWxal9yxn2e9uEg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}checksum_manifest.json`,
      sizeBytes: 1113,
      generation: '1780178658094698',
      crc32c: 'r2l0ag==',
      md5Hash: '35om0FToP7a/VFsjTTCIFQ==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
      sizeBytes: 288,
      generation: '1780178659670272',
      crc32c: 'IneKgw==',
      md5Hash: 'cRfgmxBIfPbIy/gsmF8IvA==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
      sizeBytes: 4978,
      generation: '1780178661272620',
      crc32c: 'uJimqQ==',
      md5Hash: 'eHoethNW/r1bBPV/wppXsg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}download_report.json`,
      sizeBytes: 819,
      generation: '1780178662846680',
      crc32c: 'prPmOQ==',
      md5Hash: 'gXOVORy6NJ1gMNhUu3W4Dg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}private_gcs_upload_report.json`,
      sizeBytes: 4398,
      generation: '1780178664401876',
      crc32c: 'KXPZ2A==',
      md5Hash: 'BSxFH/i+cOVV+OxPBRRsQg==',
    },
    {
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}phase_37b_ocr_model_download_report.json`,
      sizeBytes: 49428,
      generation: '1780178665999453',
      crc32c: '+CmB2g==',
      md5Hash: '71tHQJC/Nqthk3QAkarfmg==',
    },
  ],
  iamChanges: ['none; Phase 37C runtime service-account objectViewer access is deferred.'],
  blockers: [],
  warnings: [
    'Phase 37B verified selected PP-OCRv5 assets in private staging GCS only; it did not run PaddleOCR or process media.',
    'GCS object verification records size, generation, CRC32C, and MD5 where returned by Cloud Storage; SHA-256 is recorded from the local checksum manifest.',
    'Runtime service-account access is deferred to Phase 37C unless generated OCR runtime verification explicitly approves it.',
  ],
}

export function getApprovedOcrModelDownloadEvidence(): ApprovedOcrModelDownloadEvidence {
  return {
    ...approvedOcrModelDownloadEvidence,
    selectedAssets: approvedOcrModelDownloadEvidence.selectedAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: approvedOcrModelDownloadEvidence.optionalDeferredAssets.map((asset) => ({ ...asset })),
    assetSha256: { ...approvedOcrModelDownloadEvidence.assetSha256 },
    assetSizeBytes: { ...approvedOcrModelDownloadEvidence.assetSizeBytes },
    uploadedObjects: approvedOcrModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),
    iamChanges: [...approvedOcrModelDownloadEvidence.iamChanges],
    blockers: [...approvedOcrModelDownloadEvidence.blockers],
    warnings: [...approvedOcrModelDownloadEvidence.warnings],
  }
}

export function buildApprovedOcrModelDownloadChecksumManifest(
  generatedAt = approvedOcrModelDownloadEvidence.downloadedAt ?? new Date().toISOString(),
): OcrChecksumManifest {
  return buildComputedOcrChecksumManifest(
    selectedOcrModelAssetRelativePaths.map((relativePath) => {
      const sha256 = approvedOcrModelDownloadEvidence.assetSha256[relativePath]
      const sizeBytes = approvedOcrModelDownloadEvidence.assetSizeBytes[relativePath]
      if (!sha256 || !sizeBytes) throw new Error(`Approved OCR checksum evidence is missing ${relativePath}.`)
      return {
        relativePath,
        sha256,
        sizeBytes,
        checksumStatus: 'computed',
      }
    }),
    generatedAt,
  )
}
