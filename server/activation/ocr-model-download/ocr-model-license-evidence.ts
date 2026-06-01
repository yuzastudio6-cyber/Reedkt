import {
  PADDLEOCR_DOCS_URL,
  PADDLEOCR_REPO_LICENSE_URL,
  PADDLEOCR_SOURCE_REPO_URL,
  selectedOcrModelAssets,
} from './ocr-model-asset-registry'
import type { OcrModelLicenseEvidence } from './ocr-model-download-types'

export function buildStaticOcrModelLicenseEvidence(): OcrModelLicenseEvidence {
  return {
    collectedAt: '2026-05-30T00:00:00.000Z',
    licenseName: 'Apache-2.0',
    sourceRepoUrl: PADDLEOCR_SOURCE_REPO_URL,
    licenseUrls: [PADDLEOCR_REPO_LICENSE_URL, PADDLEOCR_SOURCE_REPO_URL, PADDLEOCR_DOCS_URL],
    repoLicenseEvidenceSummary: 'Official PaddleOCR repository license evidence is Apache-2.0.',
    modelAssetEvidenceSummary: 'Selected PP-OCRv5 asset URLs are tied to official PaddleOCR docs/repository evidence and official Paddle model-host source URLs for staging download only.',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    productionLegalApprovalComplete: false,
    blockers: [],
    warnings: [
      'Phase 37B license evidence is not production legal approval.',
      'Runtime, public output, beta, and production remain blocked after asset selection/download.',
    ],
  }
}

export async function collectOcrModelLicenseEvidence(): Promise<OcrModelLicenseEvidence> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = []
  const license = await fetchText(PADDLEOCR_REPO_LICENSE_URL)

  if (!license.includes('Apache License') || !license.includes('Version 2.0')) {
    blockers.push('Official PaddleOCR LICENSE text is not Apache License Version 2.0.')
  }
  if (!selectedOcrModelAssets.every((asset) => asset.sourceUrl.includes('paddle-model-ecology.bj.bcebos.com') || asset.sourceUrl.includes('raw.githubusercontent.com/PaddlePaddle/PaddleOCR'))) {
    blockers.push('One or more selected PP-OCRv5 assets is not tied to the official Paddle model host or PaddleOCR repository dictionary source.')
  }

  warnings.push('Human production legal approval is still incomplete; this evidence supports staging private download only.')

  return {
    collectedAt,
    licenseName: 'Apache-2.0',
    sourceRepoUrl: PADDLEOCR_SOURCE_REPO_URL,
    licenseUrls: [PADDLEOCR_REPO_LICENSE_URL, PADDLEOCR_SOURCE_REPO_URL, PADDLEOCR_DOCS_URL],
    repoLicenseEvidenceSummary: 'Official PaddleOCR repository LICENSE contains Apache License Version 2.0 text.',
    modelAssetEvidenceSummary: 'Selected PP-OCRv5 det/rec/dictionary URLs are tied to official PaddleOCR docs/repository evidence and official Paddle model-host source URLs for staging download only.',
    codexLicenseDecision: blockers.length === 0 ? 'staging_download_approved_by_codex' : 'blocked',
    humanLicenseApprovalRequired: false,
    productionLegalApprovalComplete: false,
    blockers,
    warnings,
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.text()
}
