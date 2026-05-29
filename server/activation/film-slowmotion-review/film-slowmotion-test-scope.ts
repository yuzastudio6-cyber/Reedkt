import type { FilmSlowMotionFutureTestScope } from './film-slowmotion-review-types'

export const FILM_SLOWMOTION_FUTURE_TEST_SCOPE: FilmSlowMotionFutureTestScope = {
  proposedPhase: '34F',
  status: 'blocked_until_human_approval',
  clipCountLimit: 1,
  maxDurationSeconds: 2,
  explicitlyApprovedShortClipOnly: true,
  noFullVideoInterpolation: true,
  noEntire4kVideoProcessing: true,
  noArbitraryUserMedia: true,
  noAudioRewriteUnlessExplicitlyPlanned: true,
  exactModelCheckpointRequired: true,
  checksumRequired: true,
  privateGcsArtifactsOnly: true,
  qaRequiredForMotionArtifacts: true,
  qaRequiredForSync: true,
  qaRequiredForFlicker: true,
  qaRequiredForSubjectDeformation: true,
  humanVisualReviewBeforeBroaderUse: true,
  filmDownloadAllowed: false,
  filmRuntimeAllowed: false,
  slowMotionExecutionAllowed: false,
  fullVideoInterpolationAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}

export function getFilmSlowMotionFutureTestScope(): FilmSlowMotionFutureTestScope {
  return { ...FILM_SLOWMOTION_FUTURE_TEST_SCOPE }
}
