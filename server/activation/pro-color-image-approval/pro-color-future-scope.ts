import type { ProColorImageFutureScope } from './pro-color-image-approval-types'

export const proColorImageFutureScope: ProColorImageFutureScope = {
  phaseSequence: [
    {
      phase: '40B',
      name: 'Generated-fixture pro color/image runtime verification',
      allowedOnlyAfter: [
        'Phase 40A records source/license evidence and tool ownership scope.',
        'A minimal dependency/runtime plan is reviewed and pinned.',
        'Generated fixture inputs and expected metadata/color results are defined.',
      ],
      scope: [
        'Install or build only the minimal approved pro color/image runtime stack.',
        'Use generated color charts, metadata fixtures, alpha/depth fixtures, and frame sequences only.',
        'Verify OpenColorIO transforms, OpenImageIO metadata/I/O, and Kornia local metrics without real media.',
        'Emit private generated fixture QA artifacts only.',
      ],
      stillBlocked: ['real video', 'user media', 'final delivery', 'providers', 'Revideo', 'production/beta/broad media'],
    },
    {
      phase: '40C',
      name: 'Controlled real-video pro color/image sample',
      allowedOnlyAfter: [
        'Phase 40B generated-fixture runtime verification passes.',
        'A short controlled source scope is approved from the Track A chain.',
      ],
      scope: [
        'Use only approved controlled Track A source media.',
        'Run a bounded pro color/image sample with private artifacts.',
        'Record color-space metadata, frame validation, visual metrics, and human-review warnings.',
      ],
      stillBlocked: ['arbitrary media', 'full feature E2E', 'final delivery', 'production/beta/broad media'],
    },
    {
      phase: '40D',
      name: 'Private pro color/image feature E2E readiness gate',
      allowedOnlyAfter: [
        'Phase 40B generated fixture QA passes.',
        'Phase 40C controlled sample QA passes.',
      ],
      scope: [
        'Exercise the private user-style pro color/image feature path.',
        'Use approved plan snapshots and private artifacts only.',
        'Mark readiness only for internal feature testing if all gates pass.',
      ],
      stillBlocked: ['external beta', 'paid production', 'broad real media', 'public delivery', 'providers', 'Revideo'],
    },
  ],
  proColorImagePlanningAllowed: true,
  openColorIOPlanningAllowed: true,
  openImageIOPlanningAllowed: true,
  korniaPlanningAllowed: true,
  runtimeInstallAllowed: false,
  proColorImageRuntimeAllowed: false,
  generatedFixtureRuntimeAllowed: false,
  realVideoProColorAllowed: false,
  finalDeliveryAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadRealUserMediaAllowed: false,
}
