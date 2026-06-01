import { getSelectedControlledRealVideoOcrSafeZoneSample } from './controlled-real-video-chain-registry'
import type {
  ControlledRealVideoCaptionCandidateZone,
  ControlledRealVideoOcrExecutionValidationResult,
} from './controlled-real-video-ocr-execution-types'

export function buildControlledRealVideoCaptionCandidateZones(): ControlledRealVideoCaptionCandidateZone[] {
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  const lower = sample.expectedCaptionZones.find((zone) => zone.zoneId === 'vertical_lower_caption_safe_zone')
  if (!lower) throw new Error('Phase 37D lower caption safe-zone is missing from the selected sample.')
  return [
    {
      ...lower,
      candidatePriority: 1,
    },
    {
      zoneId: 'center_lower_fallback',
      label: 'Controlled center-lower fallback caption zone',
      x: 0.1,
      y: 0.52,
      width: 0.8,
      height: 0.14,
      coordinateSpace: 'normalized',
      purpose: 'caption_safe_zone',
      required: false,
      candidatePriority: 2,
    },
    {
      zoneId: 'upper_safe_fallback',
      label: 'Controlled upper fallback caption zone',
      x: 0.1,
      y: 0.16,
      width: 0.8,
      height: 0.14,
      coordinateSpace: 'normalized',
      purpose: 'caption_safe_zone',
      required: false,
      candidatePriority: 3,
    },
  ]
}

export function buildControlledRealVideoOcrExecutionPlan(createdAt = new Date().toISOString()) {
  const sample = getSelectedControlledRealVideoOcrSafeZoneSample()
  return {
    phase: '37D' as const,
    planId: 'phase37d_controlled_real_video_ocr_safe_zone_execution_plan',
    createdAt,
    executionScope: 'one_approved_private_sample',
    sample: {
      sampleId: sample.sampleId,
      controlledChainId: sample.chainId,
      sourceGcsUri: sample.sourceGcsUri,
      sourceSha256: sample.sourceSha256,
      window: sample.plannedWindow,
      frameOffsetsSeconds: [...sample.plannedFrameOffsetsSeconds],
      maxSampledFrames: sample.maxSampledFrames,
    },
    frameExtraction: {
      engine: 'opencv',
      exactFrameCount: 6,
      ffmpegRequired: false,
      ffmpegUnavailableExpected: true,
    },
    ocrRuntime: {
      modelFamily: 'PP-OCRv5',
      assetVersion: 'paddle3.0.0-mobile-safe-zone-v1',
      cpuOnly: true,
      localModelPathsRequired: true,
      networkAndModelDownloadGuardRequired: true,
      dictionaryPathLimitationRecorded: true,
      textlineOrientationClassifierDeferred: true,
    },
    artifactPolicy: {
      privateJsonOnly: true,
      rawFramesUploaded: false,
      overlaysUploaded: false,
      publicOutputAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
    },
    captionCandidateZones: buildControlledRealVideoCaptionCandidateZones(),
    blockedScopes: [
      'Phase 37E caption/render QA integration',
      'arbitrary media OCR',
      'broad real-video OCR',
      'full-video OCR',
      'Track A execution code',
      'production',
      'external beta',
      'paid production',
    ],
  }
}

export function validationToStatus(validation: ControlledRealVideoOcrExecutionValidationResult): 'passed' | 'blocked' {
  return validation.allowed ? 'passed' : 'blocked'
}
