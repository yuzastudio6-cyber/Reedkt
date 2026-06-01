import type { OcrModelCandidateRecord } from './ocr-model-approval-types'

export const OCR_MODEL_APPROVAL_REVIEWED_AT = '2026-05-30T00:00:00.000Z'

export const ocrModelCandidates: OcrModelCandidateRecord[] = [
  {
    candidateId: 'paddleocr',
    toolName: 'PaddleOCR',
    statuses: ['candidate_for_phase37_ocr_safe_zone'],
    recommendedForFirstSafeZoneTest: true,
    officialRepoUrl: 'https://github.com/PaddlePaddle/PaddleOCR',
    licenseName: 'Apache-2.0',
    role: 'OCR toolkit for text detection, recognition, and structured text output planning.',
    taskScope: ['OCR', 'text detection', 'text recognition', 'scene OCR', 'document text parsing', 'structured JSON/Markdown output planning'],
    firstReeditProScope: ['generated UI/text frame OCR', 'caption safe-zone metadata', 'text region detection', 'private artifact output'],
    reviewStatus: 'staging_approved_for_ocr_safe_zone_planning',
    downloadStatus: 'blocked_until_exact_assets_selected',
    runtimeStatus: 'blocked_until_phase37c',
    noExecutionInPhase37A: true,
    evidence: [
      {
        evidenceId: 'paddleocr_github_repo_license',
        sourceName: 'PaddleOCR GitHub repository',
        sourceUrl: 'https://github.com/PaddlePaddle/PaddleOCR',
        licenseClaim: 'Apache-2.0',
        evidenceSummary: 'Official repository identifies PaddleOCR as an OCR/document parsing toolkit and lists Apache-2.0 licensing.',
        confidence: 'high',
      },
      {
        evidenceId: 'paddleocr_docs_ppocrv5_capability',
        sourceName: 'PaddleOCR documentation',
        sourceUrl: 'http://www.paddleocr.ai/main/en/index.html',
        licenseClaim: 'Apache-2.0 project evidence via official repository',
        evidenceSummary: 'Official docs describe PP-OCRv5 as universal scene text recognition, broad language support, structured outputs, and multiple deployment/backends.',
        confidence: 'high',
      },
    ],
  },
  {
    candidateId: 'paddlepaddle',
    toolName: 'PaddlePaddle',
    statuses: ['required_runtime_candidate'],
    recommendedForFirstSafeZoneTest: false,
    officialRepoUrl: 'https://github.com/PaddlePaddle/Paddle',
    licenseName: 'Apache-2.0',
    role: 'Deep-learning runtime framework used by PaddleOCR.',
    taskScope: ['PaddleOCR runtime framework', 'CPU-first OCR runtime planning'],
    firstReeditProScope: ['runtime planning only', 'no inference execution in Phase 37A'],
    reviewStatus: 'planning_only',
    downloadStatus: 'not_applicable',
    runtimeStatus: 'planning_only',
    noExecutionInPhase37A: true,
    evidence: [
      {
        evidenceId: 'paddlepaddle_github_repo_license',
        sourceName: 'PaddlePaddle GitHub repository',
        sourceUrl: 'https://github.com/PaddlePaddle/Paddle',
        licenseClaim: 'Apache-2.0',
        evidenceSummary: 'Official repository identifies PaddlePaddle as the deep-learning framework and states Apache-2.0 licensing.',
        confidence: 'high',
      },
    ],
  },
  {
    candidateId: 'pp_ocrv5',
    toolName: 'PP-OCRv5 detection/recognition/classifier model family',
    statuses: ['model_family_candidate'],
    recommendedForFirstSafeZoneTest: false,
    officialRepoUrl: 'https://github.com/PaddlePaddle/PaddleOCR',
    licenseName: 'Apache-2.0',
    role: 'Model family candidate for generated OCR safe-zone fixtures after exact Phase 37B assets are selected.',
    taskScope: ['text detection model family', 'text recognition model family', 'optional angle/classifier model family'],
    firstReeditProScope: ['generated OCR safe-zone model-family planning', 'exact asset selection deferred to Phase 37B'],
    reviewStatus: 'blocked_until_exact_assets_selected',
    downloadStatus: 'blocked_until_exact_assets_selected',
    runtimeStatus: 'blocked_until_phase37c',
    noExecutionInPhase37A: true,
    evidence: [
      {
        evidenceId: 'pp_ocrv5_docs_model_family',
        sourceName: 'PaddleOCR PP-OCRv5 documentation',
        sourceUrl: 'http://www.paddleocr.ai/main/en/index.html',
        licenseClaim: 'Apache-2.0 project evidence; exact model asset evidence deferred',
        evidenceSummary: 'Official docs describe PP-OCRv5 as universal scene text recognition. Exact det/rec/cls asset URLs and checksums are deferred to Phase 37B.',
        confidence: 'medium',
      },
    ],
  },
]

export function getOcrCandidate(candidateId: OcrModelCandidateRecord['candidateId']): OcrModelCandidateRecord {
  const candidate = ocrModelCandidates.find((item) => item.candidateId === candidateId)
  if (!candidate) throw new Error(`Unknown OCR candidate: ${candidateId}`)
  return candidate
}
