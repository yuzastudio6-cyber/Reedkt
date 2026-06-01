import type { ApprovedOcrRuntimeEvidence } from './ocr-runtime-types'

export const approvedOcrRuntimeEvidence: ApprovedOcrRuntimeEvidence = {
  phase: '37C',
  status: 'verified',
  runId: 'phase37c-20260530T230413',
  modelFamily: 'PP-OCRv5',
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/',
  detectionArchiveSha256: '50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58',
  recognitionArchiveSha256: '566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414',
  dictionarySha256: 'd1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b',
  aggregateSha256: '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b',
  fixtureIds: [
    'basic-ui-text',
    'caption-safe-zone-conflict',
    'multi-region-ui',
    'low-contrast-warning',
    'small-text-warning',
    'rotated-text-blocked-or-warning',
  ],
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/phase37c-20260530T230413/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/phase37c-20260530T230413/phase_37c_ocr_runtime_qa_report.json',
  phase37DReadiness: {
    readyForControlledRealVideoOcrSafeZone: true,
    reason: 'Phase 37C verified generated UI/text OCR runtime using private Phase 37B PP-OCRv5 assets; Phase 37D may plan one controlled real-video OCR/caption safe-zone test.',
  },
  blockers: [],
  warnings: [
    'PP-LCNet_x1_0_textline_ori is deferred; rotated text remains skipped/warning for Phase 37C.',
    'PaddleOCR constructor did not expose a recognized dictionary-path parameter; verified dictionary path was present but not passed.',
  ],
}

export function getApprovedOcrRuntimeEvidence(): ApprovedOcrRuntimeEvidence {
  return {
    ...approvedOcrRuntimeEvidence,
    fixtureIds: [...approvedOcrRuntimeEvidence.fixtureIds],
    phase37DReadiness: { ...approvedOcrRuntimeEvidence.phase37DReadiness },
    blockers: [...approvedOcrRuntimeEvidence.blockers],
    warnings: [...approvedOcrRuntimeEvidence.warnings],
  }
}
