export const INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_UI_DECISION =
  'internal_testing_worker_payload_dry_run_passed_ready_for_mock_worker_queue_review'

export type InternalTestingWorkerPayloadDryRunUiCheck = {
  id: string
  label: string
  summary: string
  status: 'ready_for_mock_queue_review'
}

export type InternalTestingWorkerPayloadDryRunUiModel = {
  decision: typeof INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_UI_DECISION
  summary: string
  checks: readonly InternalTestingWorkerPayloadDryRunUiCheck[]
  safety: {
    payloadShapeValidated: true
    approvedSnapshotRequired: true
    idempotencyRequired: true
    privateStorageReferencesOnly: true
    workerDispatchAllowed: false
    toolExecutionAllowed: false
    mediaProcessingAllowed: false
    providerCallsAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'payload-shape',
    label: 'Payload shape',
    summary: 'Dry-run records use the same approved-snapshot worker payload contract expected by backend workers.',
    status: 'ready_for_mock_queue_review' as const,
  },
  {
    id: 'private-storage-lineage',
    label: 'Private storage lineage',
    summary: 'Payloads carry private storage reference IDs only, never public links or signed URLs.',
    status: 'ready_for_mock_queue_review' as const,
  },
  {
    id: 'idempotent-job-keys',
    label: 'Idempotent job keys',
    summary: 'Each planned payload has a stable idempotency key for safe replay and later queue review.',
    status: 'ready_for_mock_queue_review' as const,
  },
  {
    id: 'no-dispatch-boundary',
    label: 'No dispatch boundary',
    summary: 'The dry-run validates payload metadata without claiming, dispatching, or executing a worker.',
    status: 'ready_for_mock_queue_review' as const,
  },
] as const satisfies readonly InternalTestingWorkerPayloadDryRunUiCheck[]

export function getInternalTestingWorkerPayloadDryRunUiModel(): InternalTestingWorkerPayloadDryRunUiModel {
  return {
    decision: INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_UI_DECISION,
    summary: 'Worker payload dry-run proves the backend handoff shape after route review while leaving all execution disabled.',
    checks,
    safety: {
      payloadShapeValidated: true,
      approvedSnapshotRequired: true,
      idempotencyRequired: true,
      privateStorageReferencesOnly: true,
      workerDispatchAllowed: false,
      toolExecutionAllowed: false,
      mediaProcessingAllowed: false,
      providerCallsAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
