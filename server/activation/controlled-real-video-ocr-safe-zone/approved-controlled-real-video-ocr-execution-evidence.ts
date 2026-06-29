import { ocrRuntimeConfig } from '../ocr-runtime'
import { controlledRealVideoOcrSafeZoneConfig } from './controlled-real-video-ocr-safe-zone-policy'
import type { ApprovedControlledRealVideoOcrExecutionEvidence } from './controlled-real-video-ocr-execution-types'

export const approvedControlledRealVideoOcrExecutionEvidence: ApprovedControlledRealVideoOcrExecutionEvidence = {
  phase: '37D',
  status: 'passed',
  runId: 'phase37d-20260531T002046',
  sampleId: controlledRealVideoOcrSafeZoneConfig.selectedSampleId,
  controlledChainId: controlledRealVideoOcrSafeZoneConfig.selectedChainId,
  sourceGcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
  window: {
    startSeconds: controlledRealVideoOcrSafeZoneConfig.selectedWindowStartSeconds,
    endSeconds: controlledRealVideoOcrSafeZoneConfig.selectedWindowEndSeconds,
    durationSeconds: 2,
  },
  frameOffsetsSeconds: [...controlledRealVideoOcrSafeZoneConfig.selectedFrameOffsetsSeconds],
  frameCount: 6,
  artifactPrefix: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260531T002046/',
  privateArtifactObjectCount: 10,
  sourceObject: {
    gcsUri: controlledRealVideoOcrSafeZoneConfig.selectedSourceGcsUri,
    bucket: 'reeditpro-staging-reeditpro-final-exports',
    object: 'activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
    sizeBytes: 94522751,
    generation: '1779975269726662',
  },
  modelAggregateSha256: ocrRuntimeConfig.aggregateSha256,
  modelAssetSha256: {
    detection: ocrRuntimeConfig.detectionArchiveSha256,
    recognition: ocrRuntimeConfig.recognitionArchiveSha256,
    dictionary: ocrRuntimeConfig.dictionarySha256,
  },
  ocrSummary: {
    totalTextRegionCount: 11,
    framesWithTextCount: 6,
    framesWithoutText: 0,
    framesWithLowerThirdCollision: 0,
    recommendationsAvailable: 6,
    averageRegionsPerFrame: 1.833,
  },
  phase37EReadiness: {
    readyForControlledCaptionRenderQaPlanning: true,
    reason: 'Phase 37D controlled execution passed; Phase 37E may plan caption/render QA integration only.',
  },
  blockers: [],
  warnings: [
    'PP-LCNet_x1_0_textline_ori remains deferred; rotated/vertical text is warning-only and blocked from auto-download.',
    'PaddleOCR constructor did not expose a recognized dictionary-path parameter; verified dictionary path was present but not passed.',
  ],
}

export function getApprovedControlledRealVideoOcrExecutionEvidence(): ApprovedControlledRealVideoOcrExecutionEvidence {
  return cloneApprovedControlledRealVideoOcrExecutionEvidence(approvedControlledRealVideoOcrExecutionEvidence)
}

export function cloneApprovedControlledRealVideoOcrExecutionEvidence(
  evidence: ApprovedControlledRealVideoOcrExecutionEvidence,
): ApprovedControlledRealVideoOcrExecutionEvidence {
  return {
    ...evidence,
    window: { ...evidence.window },
    frameOffsetsSeconds: [...evidence.frameOffsetsSeconds],
    sourceObject: evidence.sourceObject ? { ...evidence.sourceObject } : undefined,
    modelAssetSha256: { ...evidence.modelAssetSha256 },
    ocrSummary: { ...evidence.ocrSummary },
    phase37EReadiness: { ...evidence.phase37EReadiness },
    blockers: [...evidence.blockers],
    warnings: [...evidence.warnings],
  }
}
