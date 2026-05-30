import type { FilmFutureScope } from './film-slowmotion-approval-types'

export const filmFutureScope: FilmFutureScope = {
  phaseSequence: [
    {
      phase: '38B',
      name: 'FILM download/load',
      allowedOnlyAfter: [
        'Phase 38A records staging planning approval.',
        'Exact official FILM artifact tree is selected.',
        'Private staging model storage path is confirmed.',
      ],
      scope: [
        'Download only approved official FILM TF2 SavedModel artifacts into temp outside the repo.',
        'Compute per-file and aggregate checksums.',
        'Upload only to private staging GCS under gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/<model-or-version>/.',
        'Commit no model files to git.',
      ],
      stillBlocked: ['runtime execution', 'media processing', 'public access', 'production/beta/broad media'],
    },
    {
      phase: '38C',
      name: 'FILM generated-frame runtime verification',
      allowedOnlyAfter: [
        'Phase 38B records private model storage and checksum evidence.',
        'Dedicated runtime dependency/license plan is approved.',
      ],
      scope: [
        'Use generated frame pairs or generated frame sequences only.',
        'Load FILM artifacts from private staging storage.',
        'Verify checksums before inference.',
        'Emit private output frame and QA artifacts only.',
      ],
      stillBlocked: ['real video', 'real user media', 'selected real-video slow motion', 'production/beta/broad media'],
    },
    {
      phase: '38D',
      name: 'Controlled selected real-video slow-motion sample',
      allowedOnlyAfter: [
        'Phase 38C generated-frame runtime verification passes.',
        'A short selected segment from the approved controlled real-video chain is approved.',
      ],
      scope: [
        'Use only the approved controlled real-video chain.',
        'Use one selected short segment at bounded resolution/FPS.',
        'Keep all artifacts private.',
        'Evaluate warping, ghosting, flicker, text/logo distortion, frame count, and duration sync.',
      ],
      stillBlocked: ['full-video interpolation', 'final delivery export', 'public access', 'production/beta/broad media'],
    },
    {
      phase: '38E',
      name: 'FILM private feature E2E readiness gate',
      allowedOnlyAfter: [
        'Phase 38C generated runtime QA passes.',
        'Phase 38D controlled selected real-video sample QA passes.',
      ],
      scope: [
        'Exercise the user-style slow-motion feature path privately.',
        'Use reviewed plan snapshots and private artifacts only.',
        'Mark readiness only for internal feature testing if QA passes.',
      ],
      stillBlocked: ['production', 'external beta', 'paid production', 'broad real media', 'public delivery', 'Revideo production path'],
    },
  ],
  filmPlanningAllowed: true,
  filmDownloadAllowed: false,
  filmRuntimeAllowed: false,
  slowMotionAllowed: false,
  realVideoSlowMotionAllowed: false,
  fullVideoInterpolationAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealUserMediaAllowed: false,
}
