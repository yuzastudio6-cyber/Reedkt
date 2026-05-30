import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { buildOcrAssetSelectionManifest } from './ocr-model-asset-registry'
import { buildOcrChecksumTextManifest, buildPendingOcrChecksumManifest } from './ocr-model-checksum-manifest'
import { OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS } from './ocr-model-download-blocker-policy'
import {
  buildOcrDownloadLifecycleReport,
  buildOcrModelDownloadReport,
  buildOcrPrivateGcsUploadReport,
} from './ocr-model-download-report-builder'
import { buildOcrModelTreeManifest } from './ocr-model-tree-manifest'
import { buildStaticOcrModelLicenseEvidence } from './ocr-model-license-evidence'
import { buildStaticOcrModelSourceEvidence } from './ocr-model-source-evidence'
import type {
  OcrAssetSelectionManifest,
  OcrChecksumManifest,
  OcrModelDownloadReport,
  OcrModelLicenseEvidence,
  OcrModelSourceEvidence,
  OcrModelTreeManifest,
  OcrPrivateGcsUploadReport,
} from './ocr-model-download-types'

export type OcrModelDownloadArtifactName = typeof OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS[number]

export interface OcrModelDownloadArtifactInputs {
  sourceEvidence?: OcrModelSourceEvidence
  licenseEvidence?: OcrModelLicenseEvidence
  assetSelectionManifest?: OcrAssetSelectionManifest
  checksumManifest?: OcrChecksumManifest
  modelTreeManifest?: OcrModelTreeManifest
  privateGcsUploadReport?: OcrPrivateGcsUploadReport
  phaseReport?: OcrModelDownloadReport
}

export function buildOcrModelDownloadArtifactMap(input: OcrModelDownloadArtifactInputs = {}): Record<OcrModelDownloadArtifactName, string> {
  const sourceEvidence = input.sourceEvidence ?? buildStaticOcrModelSourceEvidence()
  const licenseEvidence = input.licenseEvidence ?? buildStaticOcrModelLicenseEvidence()
  const assetSelectionManifest = input.assetSelectionManifest ?? buildOcrAssetSelectionManifest()
  const checksumManifest = input.checksumManifest ?? buildPendingOcrChecksumManifest()
  const modelTreeManifest = input.modelTreeManifest ?? buildOcrModelTreeManifest({
    files: checksumManifest.entries,
    createdAt: checksumManifest.generatedAt,
  })
  const privateGcsUploadReport = input.privateGcsUploadReport ?? buildOcrPrivateGcsUploadReport()
  const phaseReport = input.phaseReport ?? buildOcrModelDownloadReport({
    checksumManifest,
    privateGcsUploadReport,
  })
  const downloadReport = buildOcrDownloadLifecycleReport({
    evidence: phaseReport.downloadEvidence,
    checksumManifest,
    createdAt: phaseReport.createdAt,
  })

  return {
    'source_evidence.json': json(sourceEvidence),
    'license_evidence.json': json(licenseEvidence),
    'asset_selection_manifest.json': json(assetSelectionManifest),
    'checksum_manifest.json': json(checksumManifest),
    'file_checksums_sha256.txt': buildOcrChecksumTextManifest(checksumManifest.entries),
    'model_tree_manifest.json': json(modelTreeManifest),
    'download_report.json': json(downloadReport),
    'private_gcs_upload_report.json': json(privateGcsUploadReport),
    'phase_37b_ocr_model_download_report.json': json(phaseReport),
  }
}

export async function writeOcrModelDownloadArtifacts(
  outputDir: string,
  artifacts: Record<OcrModelDownloadArtifactName, string>,
): Promise<Record<OcrModelDownloadArtifactName, string>> {
  const paths = {} as Record<OcrModelDownloadArtifactName, string>
  await mkdir(outputDir, { recursive: true })
  for (const [fileName, content] of Object.entries(artifacts) as Array<[OcrModelDownloadArtifactName, string]>) {
    const filePath = join(outputDir, fileName)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf8')
    paths[fileName] = filePath
  }
  return paths
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}
