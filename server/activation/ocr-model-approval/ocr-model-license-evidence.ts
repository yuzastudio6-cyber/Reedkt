import type { OcrLicenseEvidenceRecord } from './ocr-model-approval-types'

export const ocrModelLicenseEvidence: OcrLicenseEvidenceRecord[] = [
  {
    candidateId: 'paddleocr',
    licenseIdentified: true,
    licenseName: 'Apache-2.0',
    packageOrRuntimeLicenseClear: true,
    modelAssetLicenseClear: 'deferred_until_exact_assets_selected',
    humanLegalReviewRequiredBeforePhase37B: false,
    evidenceRequired: [
      'Record exact PaddleOCR package/version selected for Phase 37C runtime.',
      'Record exact PP-OCRv5 model asset source URLs before Phase 37B download.',
      'Record checksum and private GCS upload evidence after Phase 37B download.',
    ],
    notes: [
      'Phase 37A approves planning only and does not download PaddleOCR assets.',
      'Apache-2.0 project evidence is sufficient for planning, but exact model assets must be selected before download/runtime.',
    ],
  },
  {
    candidateId: 'paddlepaddle',
    licenseIdentified: true,
    licenseName: 'Apache-2.0',
    packageOrRuntimeLicenseClear: true,
    modelAssetLicenseClear: 'deferred_until_exact_assets_selected',
    humanLegalReviewRequiredBeforePhase37B: false,
    evidenceRequired: [
      'Pin PaddlePaddle CPU package/runtime version before Phase 37C image build.',
      'Verify selected package supports target linux/amd64 runtime without model auto-download.',
    ],
    notes: [
      'PaddlePaddle is runtime planning only in Phase 37A.',
    ],
  },
  {
    candidateId: 'pp_ocrv5',
    licenseIdentified: true,
    licenseName: 'Apache-2.0',
    packageOrRuntimeLicenseClear: true,
    modelAssetLicenseClear: 'deferred_until_exact_assets_selected',
    humanLegalReviewRequiredBeforePhase37B: false,
    evidenceRequired: [
      'Select exact PP-OCRv5 detection, recognition, and optional classifier assets from official sources.',
      'Record source URL, version, file name, checksum plan, and private GCS path before any download.',
    ],
    notes: [
      'Model-family approval is planning-only; exact model assets are not approved in Phase 37A.',
    ],
  },
]
