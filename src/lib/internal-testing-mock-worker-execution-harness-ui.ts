export const INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_UI_DECISION =
  'internal_testing_mock_worker_execution_harness_passed_ready_for_private_review_result_dry_run'

export type InternalTestingMockWorkerExecutionHarnessUiCheck = {
  id: string
  label: string
  summary: string
  status: 'ready_for_private_review_result_dry_run'
}

export type InternalTestingMockWorkerExecutionHarnessUiModel = {
  decision: typeof INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_UI_DECISION
  summary: string
  checks: readonly InternalTestingMockWorkerExecutionHarnessUiCheck[]
  safety: {
    metadataOnly: true
    mockEventsOnly: true
    privateManifestOnly: true
    workerDispatchAllowed: false
    realWorkerExecutionAllowed: false
    toolExecutionAllowed: false
    mediaProcessingAllowed: false
    providerCallsAllowed: false
    generatedMediaAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'metadata-completion',
    label: 'Metadata completion',
    summary: 'Queued work can move through mock start, progress, and completion records without creating media.',
    status: 'ready_for_private_review_result_dry_run' as const,
  },
  {
    id: 'lease-completion',
    label: 'Lease completion',
    summary: 'Every claimed mock lease is completed so there is no dangling active work after the harness.',
    status: 'ready_for_private_review_result_dry_run' as const,
  },
  {
    id: 'private-manifest-only',
    label: 'Private manifest only',
    summary: 'The harness produces reviewable metadata, not public files, signed links, generated media, or export output.',
    status: 'ready_for_private_review_result_dry_run' as const,
  },
  {
    id: 'next-gate',
    label: 'Next gate',
    summary: 'After mock completion metadata, private review result dry-run can summarize outcomes for the tester.',
    status: 'ready_for_private_review_result_dry_run' as const,
  },
] as const satisfies readonly InternalTestingMockWorkerExecutionHarnessUiCheck[]

export function getInternalTestingMockWorkerExecutionHarnessUiModel(): InternalTestingMockWorkerExecutionHarnessUiModel {
  return {
    decision: INTERNAL_TESTING_MOCK_WORKER_EXECUTION_HARNESS_UI_DECISION,
    summary: 'Mock worker execution harness proves claimed work can create completion metadata and clean lease endings without running real tools or media work.',
    checks,
    safety: {
      metadataOnly: true,
      mockEventsOnly: true,
      privateManifestOnly: true,
      workerDispatchAllowed: false,
      realWorkerExecutionAllowed: false,
      toolExecutionAllowed: false,
      mediaProcessingAllowed: false,
      providerCallsAllowed: false,
      generatedMediaAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
