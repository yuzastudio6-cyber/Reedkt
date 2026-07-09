export const INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_UI_DECISION =
  'internal_testing_approved_snapshot_adapter_route_review_passed_ready_for_worker_payload_dry_run'

export type InternalTestingApprovedSnapshotRouteReviewUiCheck = {
  id: string
  label: string
  summary: string
  status: 'ready_for_dry_run_review'
}

export type InternalTestingApprovedSnapshotRouteReviewUiModel = {
  decision: typeof INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_UI_DECISION
  summary: string
  checks: readonly InternalTestingApprovedSnapshotRouteReviewUiCheck[]
  safety: {
    uploadFinalizationRequired: true
    approvedSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactsRequired: true
    idempotencyRequired: true
    frontendExecutionAllowed: false
    rawPromptExecutionAllowed: false
    publicDeliveryAllowed: false
    providerCallsAllowed: false
    workerDispatchAllowed: false
    mediaProcessingAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'source-upload-finalized',
    label: 'Source upload finalized',
    summary: 'The edit must reference finalized private source media before route review can pass.',
    status: 'ready_for_dry_run_review' as const,
  },
  {
    id: 'plan-and-credits-approved',
    label: 'Plan and credits approved',
    summary: 'The route review requires an approved plan snapshot plus matching estimate and reservation IDs.',
    status: 'ready_for_dry_run_review' as const,
  },
  {
    id: 'private-artifact-manifest',
    label: 'Private artifact manifest',
    summary: 'Worker payload dry-run metadata must use private artifact references, not public links.',
    status: 'ready_for_dry_run_review' as const,
  },
  {
    id: 'worker-payload-dry-run',
    label: 'Worker payload dry run',
    summary: 'The next gate can verify payload shape without dispatching a worker or processing media.',
    status: 'ready_for_dry_run_review' as const,
  },
] as const satisfies readonly InternalTestingApprovedSnapshotRouteReviewUiCheck[]

export function getInternalTestingApprovedSnapshotRouteReviewUiModel(): InternalTestingApprovedSnapshotRouteReviewUiModel {
  return {
    decision: INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_UI_DECISION,
    summary: 'Approved-snapshot route review can verify the backend handoff gates before any private worker path is activated.',
    checks,
    safety: {
      uploadFinalizationRequired: true,
      approvedSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactsRequired: true,
      idempotencyRequired: true,
      frontendExecutionAllowed: false,
      rawPromptExecutionAllowed: false,
      publicDeliveryAllowed: false,
      providerCallsAllowed: false,
      workerDispatchAllowed: false,
      mediaProcessingAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
