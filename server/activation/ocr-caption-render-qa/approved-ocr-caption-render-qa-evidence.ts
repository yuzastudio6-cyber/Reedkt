import type { ApprovedOcrCaptionRenderQaEvidence } from './ocr-caption-render-qa-types'

export const approvedOcrCaptionRenderQaEvidence: ApprovedOcrCaptionRenderQaEvidence = {
  phase: '37E',
  status: 'passed',
  runId: 'phase37e-20260531T011259',
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37e/ocr-caption-render-qa/phase37e-20260531T011259/',
  privateArtifactObjectCount: 10,
  phase37CRunId: 'phase37c-20260530T230413',
  phase37DRunId: 'phase37d-20260531T002046',
  generatedFixtureCount: 3,
  controlledFixtureCount: 1,
  blockedGuardFixtureCount: 6,
  framesChecked: 9,
  textRegionCount: 16,
  lowerThirdCollisionFixtureCount: 2,
  manualReviewFixtureCount: 1,
  phase37FReadiness: {
    readyForCaptionRenderRuntimeHookPlanning: true,
    reason: 'Phase 37E metadata integration passed and private JSON QA artifacts were uploaded; Phase 37F may plan Track B caption/render runtime hook contracts only.',
  },
  blockers: [],
  warnings: [
    'Phase 37E is metadata-only and does not run OCR, frame extraction, media processing, or rendering.',
    'Controlled real-media OCR text remains redacted; generated fixture text is synthetic only.',
    'PP-LCNet_x1_0_textline_ori remains deferred and blocked from auto-download.',
    'PaddleOCR dictionary-path limitation remains recorded from Phase 37C/37D.',
    'All default caption candidate zones intentionally contain OCR metadata; manual caption layout review is expected.',
    'All Phase 37E caption candidate zones overlap OCR text regions; manual caption layout review is required.',
    'Controlled real-media OCR text is redacted; only normalized boxes, counts, and hashed region ids are used.',
    'PP-LCNet_x1_0_textline_ori remains deferred; rotated/vertical text is warning-only and blocked from auto-download.',
    'PaddleOCR constructor did not expose a recognized dictionary-path parameter; verified dictionary path was present but not passed.',
    'Phase 37E emits a future-only metadata contract; it does not call Remotion, render workers, or Track A runtime modules.',
  ],
}

export function getApprovedOcrCaptionRenderQaEvidence(): ApprovedOcrCaptionRenderQaEvidence {
  return cloneApprovedOcrCaptionRenderQaEvidence(approvedOcrCaptionRenderQaEvidence)
}

export function cloneApprovedOcrCaptionRenderQaEvidence(
  evidence: ApprovedOcrCaptionRenderQaEvidence,
): ApprovedOcrCaptionRenderQaEvidence {
  return {
    ...evidence,
    phase37FReadiness: { ...evidence.phase37FReadiness },
    blockers: [...evidence.blockers],
    warnings: [...evidence.warnings],
  }
}
