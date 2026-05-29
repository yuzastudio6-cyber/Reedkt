import type { Sam2FutureScope } from './sam2-model-approval-types'

export const sam2FutureScope: Sam2FutureScope = {
  phaseSequence: [
    {
      phase: '35B',
      name: 'SAM2 download/load',
      allowedOnlyAfter: [
        'Phase 35A human legal/model approval is recorded.',
        'Exact SAM2 checkpoint candidate is selected.',
        'Private staging storage path is approved.',
      ],
      scope: [
        'Download only approved checkpoint files into temp outside the repo.',
        'Compute checksums.',
        'Upload only to private staging GCS under gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/<model>/.',
        'Commit no model files to git.',
      ],
      stillBlocked: ['runtime execution', 'media processing', 'cloud public access', 'production/beta/broad media'],
    },
    {
      phase: '35C',
      name: 'SAM2 runtime verification',
      allowedOnlyAfter: [
        'Phase 35B records private checkpoint storage and checksum evidence.',
        'Dedicated staging runtime image/job plan is approved.',
      ],
      scope: [
        'Use a dedicated Cloud Run L4 GPU job.',
        'Use linux/amd64 runtime image.',
        'Copy SAM2 model from private GCS.',
        'Verify checksum.',
        'Run only on generated/synthetic image sequence.',
        'Emit private QA artifacts.',
      ],
      stillBlocked: ['real video', 'full-video masks', 'text-behind-subject video', 'production/beta/broad media'],
    },
    {
      phase: '35D',
      name: 'Controlled short real-video temporal mask tracking',
      allowedOnlyAfter: [
        'Phase 35C runtime verification passes.',
        'A very short segment from the approved controlled real-video chain is approved.',
      ],
      scope: [
        'Use only the approved controlled real-video chain.',
        'Use one selected short segment, target <= 2 seconds.',
        'Keep all artifacts private.',
        'Evaluate temporal drift, flicker, occlusion, identity continuity, and boundary bleed.',
      ],
      stillBlocked: ['full-video mask tracking', 'text-behind-subject until temporal QA passes', 'public access', 'production/beta/broad media'],
    },
    {
      phase: '35E',
      name: 'Controlled text-behind-subject preview gate',
      allowedOnlyAfter: [
        'Phase 35D temporal mask QA passes.',
        'A bounded private preview scope is approved.',
      ],
      scope: [
        'Use SAM2 temporal QA evidence to decide whether a private preview is allowed.',
        'Keep preview private and bounded.',
        'Require human visual review before broader use.',
      ],
      stillBlocked: ['production', 'external beta', 'broad real media', 'public delivery', 'Revideo production path'],
    },
  ],
  sam2PlanningRecommendationAllowed: true,
  sam2DownloadAllowed: false,
  sam2RuntimeAllowed: false,
  sam2TemporalTrackingAllowed: false,
  sam2FullVideoMaskAllowed: false,
  fullVideoTextBehindSubjectAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
}
