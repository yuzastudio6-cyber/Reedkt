export const INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_UI_DECISION =
  'internal_testing_real_video_acceptance_preflight_passed_ready_for_backend_local_upload_acceptance'

export type InternalTestingRealVideoAcceptancePreflightUiModel = {
  decision: typeof INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_UI_DECISION
  summary: string
  fixture: {
    label: 'Internal testing MP4'
    displayPath: 'Documents/test video/internal testing.MP4'
    uploadAllowedNow: false
    mediaProcessingAllowedNow: false
  }
  checks: readonly {
    id: string
    label: string
    summary: string
    status: 'ready_for_local_preflight'
  }[]
  nextGate: {
    label: 'Backend-local upload acceptance'
    summary: string
  }
  safety: {
    localFixtureOnly: true
    statOnlyPreflight: true
    uploadStarted: false
    fileBytesRead: false
    mediaDecoded: false
    toolExecutionAllowed: false
    workerDispatchAllowed: false
    publicDeliveryAllowed: false
    signedUrlsAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'fixture-path',
    label: 'Fixture path',
    summary: 'Use the approved local internal testing video path for the next acceptance run.',
    status: 'ready_for_local_preflight' as const,
  },
  {
    id: 'file-metadata-only',
    label: 'File metadata only',
    summary: 'The preflight verifies local file metadata without upload, decode, probe, render, or editing.',
    status: 'ready_for_local_preflight' as const,
  },
  {
    id: 'upload-acceptance-next',
    label: 'Upload acceptance next',
    summary: 'The existing backend-local upload lane is the next gate for this video.',
    status: 'ready_for_local_preflight' as const,
  },
] as const satisfies InternalTestingRealVideoAcceptancePreflightUiModel['checks']

export function getInternalTestingRealVideoAcceptancePreflightUiModel(): InternalTestingRealVideoAcceptancePreflightUiModel {
  return {
    decision: INTERNAL_TESTING_REAL_VIDEO_ACCEPTANCE_PREFLIGHT_UI_DECISION,
    summary: 'Real-video acceptance preflight confirms the requested internal testing MP4 is ready for the backend-local upload acceptance gate without processing it in this step.',
    fixture: {
      label: 'Internal testing MP4',
      displayPath: 'Documents/test video/internal testing.MP4',
      uploadAllowedNow: false,
      mediaProcessingAllowedNow: false,
    },
    checks,
    nextGate: {
      label: 'Backend-local upload acceptance',
      summary: 'Run the local upload flow with the approved internal testing MP4, then verify plan creation without public delivery or production claims.',
    },
    safety: {
      localFixtureOnly: true,
      statOnlyPreflight: true,
      uploadStarted: false,
      fileBytesRead: false,
      mediaDecoded: false,
      toolExecutionAllowed: false,
      workerDispatchAllowed: false,
      publicDeliveryAllowed: false,
      signedUrlsAllowed: false,
      productReady: false,
    },
  }
}
