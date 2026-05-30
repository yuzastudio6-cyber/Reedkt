import { buildOcrAssetSelectionManifest, optionalDeferredOcrModelAssets, selectedOcrModelAssets } from './ocr-model-asset-registry'
import { buildOcrModelDownloadExecutionCommandPlans } from './ocr-model-download-command-plan'
import { OCR_MODEL_DOWNLOAD_GCS_PATH, OCR_MODEL_DOWNLOAD_LOCAL_DIR } from './ocr-model-download-policy'
import { OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS, ocrModelDownloadBlockers, ocrModelDownloadNotReadyFor, ocrModelDownloadWarnings } from './ocr-model-download-blocker-policy'
import { buildPendingOcrChecksumManifest } from './ocr-model-checksum-manifest'
import { buildOcrModelTreeManifest } from './ocr-model-tree-manifest'
import { buildStaticOcrModelLicenseEvidence } from './ocr-model-license-evidence'
import { buildStaticOcrModelSourceEvidence } from './ocr-model-source-evidence'
import { buildApprovedOcrModelDownloadChecksumManifest, getApprovedOcrModelDownloadEvidence } from './approved-ocr-model-download-evidence'
import type {
  ApprovedOcrModelDownloadEvidence,
  OcrChecksumManifest,
  OcrModelDownloadReport,
  OcrPrivateGcsUploadReport,
} from './ocr-model-download-types'

export const OCR_MODEL_DOWNLOAD_REPORT_ID = 'activation-phase-37b-paddleocr-exact-assets-download'

export function getDefaultOcrModelDownloadEvidence(): ApprovedOcrModelDownloadEvidence {
  return getApprovedOcrModelDownloadEvidence()
}

export function buildPlannedOcrModelDownloadEvidence(createdAt = new Date().toISOString()): ApprovedOcrModelDownloadEvidence {
  return {
    phase: '37B',
    modelFamily: 'PP-OCRv5',
    assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
    status: 'planned',
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
    licenseName: 'Apache-2.0',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    productionLegalApprovalComplete: false,
    exactAssetSelectionApproved: true,
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    assetSha256: {},
    assetSizeBytes: {},
    fileCount: selectedOcrModelAssets.length,
    sanitizedLocalTempPath: OCR_MODEL_DOWNLOAD_LOCAL_DIR,
    uploadedObjects: [],
    iamChanges: ['none; Phase 37C runtime service-account objectViewer access is deferred.'],
    blockers: [...ocrModelDownloadBlockers],
    warnings: [
      `Planned at ${createdAt}; no default execution occurred.`,
      ...ocrModelDownloadWarnings,
    ],
  }
}

export function buildOcrPrivateGcsUploadReport(input: {
  createdAt?: string
  uploadedObjects?: OcrPrivateGcsUploadReport['uploadedObjects']
  uploadVerified?: boolean
} = {}): OcrPrivateGcsUploadReport {
  const uploadedObjects = input.uploadedObjects ?? []
  const uploadVerified = input.uploadVerified ?? false
  return {
    phase: '37B',
    reportId: 'paddleocr_ppocrv5_private_gcs_upload_report_v1',
    createdAt: input.createdAt ?? new Date().toISOString(),
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    privateStorageRequired: true,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    sourceMediaBucketAllowed: false,
    uploadedObjects,
    uploadVerified,
    blockers: uploadVerified
      ? []
      : ['Selected PP-OCRv5 assets and reports are not verified in private staging GCS.'],
    warnings: [
      'Private GCS upload requires REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true and must not create public objects or signed URL source-of-truth artifacts.',
    ],
  }
}

export function buildOcrDownloadLifecycleReport(input: {
  evidence?: ApprovedOcrModelDownloadEvidence
  checksumManifest?: OcrChecksumManifest
  createdAt?: string
} = {}) {
  const evidence = input.evidence ?? getDefaultOcrModelDownloadEvidence()
  const checksumManifest = input.checksumManifest ?? buildDefaultOcrChecksumManifest(evidence, input.createdAt)
  return {
    phase: '37B',
    reportId: 'paddleocr_ppocrv5_download_report_v1',
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: evidence.status,
    selectedAssetCount: evidence.selectedAssets.length,
    optionalDeferredAssetCount: evidence.optionalDeferredAssets.length,
    checksumStatus: checksumManifest.status,
    downloadExecuted: evidence.status === 'downloaded' || evidence.status === 'uploaded' || evidence.status === 'verified',
    uploadVerified: evidence.status === 'verified',
    targetGcsPath: evidence.targetGcsPath,
    blockers: [...evidence.blockers, ...checksumManifest.blockers],
    warnings: [...evidence.warnings, ...checksumManifest.warnings],
  }
}

export function buildOcrModelDownloadReport(input: {
  evidence?: ApprovedOcrModelDownloadEvidence
  checksumManifest?: OcrChecksumManifest
  privateGcsUploadReport?: OcrPrivateGcsUploadReport
} = {}): OcrModelDownloadReport {
  const createdAt = new Date().toISOString()
  const evidence = input.evidence ?? getDefaultOcrModelDownloadEvidence()
  const sourceEvidence = buildStaticOcrModelSourceEvidence()
  const licenseEvidence = buildStaticOcrModelLicenseEvidence()
  const assetSelectionManifest = buildOcrAssetSelectionManifest(createdAt)
  if (evidence.status === 'verified') {
    assetSelectionManifest.downloadExecuted = true
    assetSelectionManifest.privateGcsUploadVerified = true
    assetSelectionManifest.blockers = []
  }
  const checksumManifest = input.checksumManifest ?? buildDefaultOcrChecksumManifest(evidence, createdAt)
  const modelTreeManifest = buildOcrModelTreeManifest({
    files: checksumManifest.entries,
    createdAt,
    localTempPath: evidence.sanitizedLocalTempPath,
  })
  const privateGcsUploadReport = input.privateGcsUploadReport ?? buildDefaultOcrPrivateGcsUploadReport(evidence, createdAt)
  const blockers = [
    ...evidence.blockers,
    ...sourceEvidence.blockers,
    ...licenseEvidence.blockers,
    ...assetSelectionManifest.blockers,
    ...checksumManifest.blockers,
    ...privateGcsUploadReport.blockers,
  ]
  if (evidence.status !== 'verified') blockers.push('PP-OCRv5 selected assets are not yet verified in private staging GCS.')
  if (!evidence.aggregateSha256) blockers.push('PP-OCRv5 aggregate SHA-256 is missing.')
  if (!evidence.uploadedObjectCount || evidence.uploadedObjectCount < OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS.length + selectedOcrModelAssets.length) {
    blockers.push('Expected selected PP-OCRv5 assets plus report artifacts are not verified as private GCS objects.')
  }
  if (evidence.uploadedObjects.some((object) => object.sizeBytes <= 0)) blockers.push('One or more OCR uploaded objects has invalid size.')

  const verified = evidence.status === 'verified' && blockers.length === 0

  return {
    reportId: OCR_MODEL_DOWNLOAD_REPORT_ID,
    createdAt,
    status: verified ? 'download_verified' : 'asset_selection_approved_download_pending',
    downloadEvidence: evidence,
    sourceEvidence,
    licenseEvidence,
    assetSelectionManifest,
    checksumManifest,
    modelTreeManifest,
    privateGcsUploadReport,
    executionCommandPlans: buildOcrModelDownloadExecutionCommandPlans(),
    expectedArtifacts: [...OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS],
    blockers,
    warnings: [
      ...evidence.warnings,
      ...sourceEvidence.warnings,
      ...licenseEvidence.warnings,
      ...assetSelectionManifest.warnings,
      ...checksumManifest.warnings,
      ...privateGcsUploadReport.warnings,
      'Phase 37B does not run PaddleOCR, build/deploy an OCR runtime, process media, render captions, call providers, or unlock beta/production.',
      'Phase 37C may verify OCR runtime only on generated UI/text frames after this private asset evidence is reviewed.',
    ],
    phase37CReadiness: {
      readyForGeneratedOcrRuntimeVerification: verified,
      readyForRuntimeExecution: false,
      reason: verified
        ? 'Selected PP-OCRv5 assets are verified in private staging GCS; Phase 37C may plan generated OCR runtime verification only.'
        : 'Selected PP-OCRv5 assets are not yet verified in private staging GCS with checksums and report artifacts.',
    },
    notReadyFor: [...ocrModelDownloadNotReadyFor],
    ocrModelDownloadCompleted: verified,
    exactAssetSelectionApproved: true,
    ocrRuntimeAllowed: false,
    ocrInferenceAllowed: false,
    realMediaOcrAllowed: false,
    realVideoOcrAllowed: false,
    captionRenderIntegrationAllowed: false,
    runtimeAutoDownloadAllowed: false,
    textlineOrientationAutoDownloadAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
  }
}

function buildDefaultOcrChecksumManifest(
  evidence: ApprovedOcrModelDownloadEvidence,
  createdAt = new Date().toISOString(),
): OcrChecksumManifest {
  if (evidence.status === 'verified') return buildApprovedOcrModelDownloadChecksumManifest(evidence.downloadedAt ?? createdAt)
  return buildPendingOcrChecksumManifest(createdAt)
}

function buildDefaultOcrPrivateGcsUploadReport(
  evidence: ApprovedOcrModelDownloadEvidence,
  createdAt = new Date().toISOString(),
): OcrPrivateGcsUploadReport {
  if (evidence.status === 'verified') {
    return buildOcrPrivateGcsUploadReport({
      createdAt: evidence.verifiedAt ?? evidence.uploadedAt ?? createdAt,
      uploadedObjects: evidence.uploadedObjects,
      uploadVerified: true,
    })
  }
  return buildOcrPrivateGcsUploadReport({ createdAt })
}

export function summarizeOcrModelDownloadReport(report: OcrModelDownloadReport): string {
  return [
    `OCR model download report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Evidence status: ${report.downloadEvidence.status}`,
    `Model family: ${report.downloadEvidence.modelFamily}`,
    `Asset version: ${report.downloadEvidence.assetVersion}`,
    `Exact asset selection approved: ${report.exactAssetSelectionApproved}`,
    `Selected assets: ${report.downloadEvidence.selectedAssets.map((asset) => asset.fileName).join(', ')}`,
    `Optional/deferred assets: ${report.downloadEvidence.optionalDeferredAssets.map((asset) => asset.fileName).join(', ')}`,
    `License decision: ${report.downloadEvidence.codexLicenseDecision}`,
    `Production legal approval complete: ${report.downloadEvidence.productionLegalApprovalComplete}`,
    `Aggregate SHA-256: ${report.downloadEvidence.aggregateSha256 ?? '(missing)'}`,
    `GCS storage: ${report.downloadEvidence.targetGcsPath}`,
    `Uploaded objects: ${report.downloadEvidence.uploadedObjectCount ?? 0}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 37C generated OCR runtime verification ready: ${report.phase37CReadiness.readyForGeneratedOcrRuntimeVerification}`,
    `Phase 37C runtime execution ready: ${report.phase37CReadiness.readyForRuntimeExecution}`,
    `OCR runtime allowed: ${report.ocrRuntimeAllowed}`,
    `OCR inference allowed: ${report.ocrInferenceAllowed}`,
    `Runtime auto-download allowed: ${report.runtimeAutoDownloadAllowed}`,
    `Textline orientation auto-download allowed: ${report.textlineOrientationAutoDownloadAllowed}`,
    `Real media OCR allowed: ${report.realMediaOcrAllowed}`,
    `Real video OCR allowed: ${report.realVideoOcrAllowed}`,
    `Caption/render integration allowed: ${report.captionRenderIntegrationAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `Public output allowed: ${report.publicOutputAllowed}`,
    '',
    'Expected report artifacts:',
    ...report.expectedArtifacts.map((artifact) => `- ${artifact}`),
    '',
    'Selected assets:',
    ...report.downloadEvidence.selectedAssets.map((asset) => `- ${asset.fileName} (${asset.role}) from ${asset.sourceUrl}`),
    '',
    'Uploaded private objects:',
    ...(report.downloadEvidence.uploadedObjects.length
      ? report.downloadEvidence.uploadedObjects.map((object) => `- ${object.gcsUri} (${object.sizeBytes} bytes)`)
      : ['- none']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
