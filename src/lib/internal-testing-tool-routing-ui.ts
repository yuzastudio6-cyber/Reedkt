export const INTERNAL_TESTING_TOOL_ROUTING_UI_DECISION =
  'internal_testing_tool_routing_readiness_passed_ready_for_approved_snapshot_adapter_route_review'

export type InternalTestingToolRoutingUiActivity = {
  id: string
  label: string
  summary: string
  status: 'metadata_ready'
}

export type InternalTestingToolRoutingUiModel = {
  decision: typeof INTERNAL_TESTING_TOOL_ROUTING_UI_DECISION
  activityCount: number
  summary: string
  activities: readonly InternalTestingToolRoutingUiActivity[]
  safety: {
    approvedSnapshotRequired: true
    privateArtifactReferencesRequired: true
    userFacingToolNamesHidden: true
    frontendExecutionAllowed: false
    rawPromptExecutionAllowed: false
    publicDeliveryAllowed: false
    providerCallsAllowed: false
    workerDispatchAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const activities = [
  {
    id: 'source-preparation',
    label: 'Source preparation',
    summary: 'Prepare uploaded source video for safe private analysis and review planning.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'speech-and-captions',
    label: 'Speech and captions',
    summary: 'Prepare transcript, alignment, caption, and readability work after approval gates.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'story-cleanup',
    label: 'Story cleanup',
    summary: 'Prepare clean cuts, timing checks, and timeline handoff for the edit plan.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'audio-polish',
    label: 'Audio polish',
    summary: 'Prepare loudness, cleanup, and music timing checks for a private review.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'visual-review',
    label: 'Visual review',
    summary: 'Prepare framing, safe-zone, image, color, and visual quality checks.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'private-review-build',
    label: 'Private review build',
    summary: 'Prepare the private review composition path after the approved snapshot is ready.',
    status: 'metadata_ready' as const,
  },
  {
    id: 'delivery-check',
    label: 'Delivery check',
    summary: 'Prepare final private review validation without public delivery or production release.',
    status: 'metadata_ready' as const,
  },
] as const satisfies readonly InternalTestingToolRoutingUiActivity[]

export function getInternalTestingToolRoutingUiModel(): InternalTestingToolRoutingUiModel {
  return {
    decision: INTERNAL_TESTING_TOOL_ROUTING_UI_DECISION,
    activityCount: activities.length,
    summary: 'Approved-snapshot route metadata exists for the private edit activities used by internal testing.',
    activities,
    safety: {
      approvedSnapshotRequired: true,
      privateArtifactReferencesRequired: true,
      userFacingToolNamesHidden: true,
      frontendExecutionAllowed: false,
      rawPromptExecutionAllowed: false,
      publicDeliveryAllowed: false,
      providerCallsAllowed: false,
      workerDispatchAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
