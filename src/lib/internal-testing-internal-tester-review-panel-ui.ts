export const INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_UI_DECISION =
  'internal_testing_internal_tester_review_panel_passed_ready_for_real_video_acceptance_preflight'

export type InternalTestingInternalTesterReviewPanelUiItem = {
  id: string
  label: string
  summary: string
  status: 'ready_for_tester_review'
}

export type InternalTestingInternalTesterReviewPanelUiModel = {
  decision: typeof INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_UI_DECISION
  summary: string
  checklist: readonly InternalTestingInternalTesterReviewPanelUiItem[]
  dispositions: readonly {
    id: string
    label: string
    summary: string
  }[]
  nextGate: {
    label: 'Real-video acceptance preflight'
    fixturePath: 'Documents/test video/internal testing.MP4'
    allowedNow: false
  }
  safety: {
    browserLocalFeedbackOnly: true
    privateInternalOnly: true
    metadataOnly: true
    editedMediaAvailable: false
    publicDeliveryAllowed: false
    signedUrlsAllowed: false
    workerDispatchAllowed: false
    toolExecutionAllowed: false
    mediaProcessingAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checklist = [
  {
    id: 'review-summary',
    label: 'Review summary',
    summary: 'Confirm the draft is clear, private, and metadata-only.',
    status: 'ready_for_tester_review' as const,
  },
  {
    id: 'inspect-private-sections',
    label: 'Inspect private sections',
    summary: 'Check source preparation, speech, story, audio, visual, review build, and delivery notes.',
    status: 'ready_for_tester_review' as const,
  },
  {
    id: 'confirm-boundaries',
    label: 'Confirm boundaries',
    summary: 'Verify no edited media, public artifact, signed link, or product-ready claim appears.',
    status: 'ready_for_tester_review' as const,
  },
  {
    id: 'record-local-note',
    label: 'Record local note',
    summary: 'Use browser-local feedback export for the tester outcome.',
    status: 'ready_for_tester_review' as const,
  },
  {
    id: 'prepare-real-video-preflight',
    label: 'Prepare real-video preflight',
    summary: 'The internal testing video is carried to the next gate, not processed here.',
    status: 'ready_for_tester_review' as const,
  },
] as const satisfies readonly InternalTestingInternalTesterReviewPanelUiItem[]

const dispositions = [
  {
    id: 'accepted-for-preflight',
    label: 'Accepted for preflight',
    summary: 'Move to the next approved real-video preflight gate.',
  },
  {
    id: 'needs-revision-before-preflight',
    label: 'Needs revision',
    summary: 'Fix copy, state, or evidence before preflight.',
  },
  {
    id: 'blocked-before-preflight',
    label: 'Blocked',
    summary: 'Stop and resolve a hard boundary issue first.',
  },
] as const

export function getInternalTestingInternalTesterReviewPanelUiModel(): InternalTestingInternalTesterReviewPanelUiModel {
  return {
    decision: INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_UI_DECISION,
    summary: 'Internal tester review panel turns the private metadata result into a clear checklist and local outcome capture before any real-video acceptance preflight.',
    checklist,
    dispositions,
    nextGate: {
      label: 'Real-video acceptance preflight',
      fixturePath: 'Documents/test video/internal testing.MP4',
      allowedNow: false,
    },
    safety: {
      browserLocalFeedbackOnly: true,
      privateInternalOnly: true,
      metadataOnly: true,
      editedMediaAvailable: false,
      publicDeliveryAllowed: false,
      signedUrlsAllowed: false,
      workerDispatchAllowed: false,
      toolExecutionAllowed: false,
      mediaProcessingAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
