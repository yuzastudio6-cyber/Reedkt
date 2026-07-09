export const INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_UI_DECISION =
  'internal_testing_private_review_result_dry_run_passed_ready_for_internal_tester_review_panel'

export type InternalTestingPrivateReviewResultDryRunUiSection = {
  id: string
  label: string
  summary: string
  status: 'ready_for_internal_review'
}

export type InternalTestingPrivateReviewResultDryRunUiModel = {
  decision: typeof INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_UI_DECISION
  summary: string
  sections: readonly InternalTestingPrivateReviewResultDryRunUiSection[]
  safety: {
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

const sections = [
  {
    id: 'source-preparation',
    label: 'Source preparation',
    summary: 'Ready for tester inspection as source-readiness metadata.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'speech-and-captions',
    label: 'Speech and captions',
    summary: 'Ready for tester inspection as planning metadata.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'story-cleanup',
    label: 'Story cleanup',
    summary: 'Ready for tester inspection as edit-decision metadata.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'audio-polish',
    label: 'Audio polish',
    summary: 'Ready for tester inspection without audio processing.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'visual-review',
    label: 'Visual review',
    summary: 'Ready for tester inspection without generated visual assets.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'private-review-build',
    label: 'Private review build',
    summary: 'Ready as an internal metadata packet, not a rendered review file.',
    status: 'ready_for_internal_review' as const,
  },
  {
    id: 'delivery-check',
    label: 'Delivery check',
    summary: 'Ready for QA review without export or public delivery.',
    status: 'ready_for_internal_review' as const,
  },
] as const satisfies readonly InternalTestingPrivateReviewResultDryRunUiSection[]

export function getInternalTestingPrivateReviewResultDryRunUiModel(): InternalTestingPrivateReviewResultDryRunUiModel {
  return {
    decision: INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_UI_DECISION,
    summary: 'Private review result dry-run turns metadata completions into a clean internal review summary without claiming edited media exists.',
    sections,
    safety: {
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
