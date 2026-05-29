import type { FilmSlowMotionPolicyGates, Phase34DEnhancementSampleReference } from './film-slowmotion-review-types'

export const PHASE_34D_ENHANCEMENT_SAMPLE_REFERENCE: Phase34DEnhancementSampleReference = {
  phase: '34D',
  runId: 'phase34d-20260528T20300',
  sourcePhase33DRunId: 'phase33d-20260528T161056',
  sourceFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png',
  sourceFrameDimensions: {
    width: 2160,
    height: 3840,
  },
  sampleCrop: {
    x: 824,
    y: 1664,
    width: 512,
    height: 512,
  },
  enhancedOutputDimensions: {
    width: 2048,
    height: 2048,
  },
  model: 'RealESRGAN_x4plus',
  boundedSampleOnly: true,
  fullFrameEnhancementAllowed: false,
  fullVideoEnhancementAllowed: false,
  humanBeforeAfterReviewRequired: true,
}

export const FILM_SLOWMOTION_POLICY_GATES: FilmSlowMotionPolicyGates = {
  phase: '34E',
  gcpProjectId: 'reeditpro',
  gcpRegion: 'us-central1',
  reeditproEnv: 'staging',
  filmStatus: 'evaluated-only',
  slowMotionAllowed: false,
  filmDownloadAllowed: false,
  filmRuntimeAllowed: false,
  slowMotionExecutionAllowed: false,
  fullVideoInterpolationAllowed: false,
  fullFrameEnhancementAllowed: false,
  fullVideoEnhancementAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  providersAllowed: false,
  revideoAllowed: false,
  modelApprovalRequired: true,
  checkpointApprovalRequired: true,
  licenseReviewRequired: true,
  checksumRequired: true,
  privateStorageRequired: true,
  futureBoundedClipTestRequired: true,
  humanVisualReviewRequired: true,
}

export function getFilmSlowMotionPolicyGates(): FilmSlowMotionPolicyGates {
  return { ...FILM_SLOWMOTION_POLICY_GATES }
}
