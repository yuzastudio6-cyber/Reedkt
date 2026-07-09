import {
  reviewInternalTestingMockWorkerExecutionHarness,
} from './internal-testing-mock-worker-execution-harness'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION =
  'internal_testing_private_review_result_dry_run_passed_ready_for_internal_tester_review_panel'

export type InternalTestingPrivateReviewResultDryRunStatus =
  | 'passed_ready_for_internal_tester_review_panel'
  | 'blocked_by_metadata_completion_gate'

export type PrivateReviewActivityId =
  | 'source_preparation'
  | 'speech_and_captions'
  | 'story_cleanup'
  | 'audio_polish'
  | 'visual_review'
  | 'private_review_build'
  | 'delivery_check'

export interface InternalTestingPrivateReviewResultDryRunResult {
  decision: typeof INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION
  status: InternalTestingPrivateReviewResultDryRunStatus
  source: 'metadata_only_completion_harness'
  workspaceId: string
  projectId: string
  editSessionId: string
  completedItemCount: number
  reviewSectionCount: number
  nextAction: 'open_internal_tester_review_panel' | 'resolve_completion_blockers'
  blockers: readonly string[]
  userFacingSummary: {
    title: 'Private review draft is ready for internal inspection'
    summary: string
    disclaimer: 'This is metadata-only internal evidence; no edited media, export, or public delivery was created.'
  }
  reviewSections: readonly {
    id: PrivateReviewActivityId
    label: string
    status: 'ready_for_internal_review'
    summary: string
    evidenceCount: number
  }[]
  privateManifest: {
    manifestId: string
    visibility: 'private_internal_testing_only'
    storageMode: 'metadata_only_no_uploaded_artifact'
    source: 'mock_worker_execution_harness'
    generatedMedia: false
    publicArtifact: false
    signedUrl: false
  }
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    realWorkerExecution: false
    toolExecution: false
    mediaProcessing: false
    renderOrExport: false
    generatedMediaArtifacts: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

const sectionCopy = [
  {
    id: 'source_preparation',
    label: 'Source preparation',
    summary: 'Source readiness metadata is available for internal review.',
  },
  {
    id: 'speech_and_captions',
    label: 'Speech and captions',
    summary: 'Speech and caption planning metadata is available for internal review.',
  },
  {
    id: 'story_cleanup',
    label: 'Story cleanup',
    summary: 'Story cleanup decisions are represented as reviewable metadata.',
  },
  {
    id: 'audio_polish',
    label: 'Audio polish',
    summary: 'Audio polish planning metadata is ready for review without audio processing.',
  },
  {
    id: 'visual_review',
    label: 'Visual review',
    summary: 'Visual review metadata is ready without generated images or rendered video.',
  },
  {
    id: 'private_review_build',
    label: 'Private review build',
    summary: 'The private review build is represented as an internal metadata packet only.',
  },
  {
    id: 'delivery_check',
    label: 'Delivery check',
    summary: 'Delivery readiness is recorded for QA without export or public delivery.',
  },
] as const satisfies readonly {
  id: PrivateReviewActivityId
  label: string
  summary: string
}[]

function distributeEvidenceCount(sectionIndex: number, completedItemCount: number): number {
  const base = Math.floor(completedItemCount / sectionCopy.length)
  const remainder = completedItemCount % sectionCopy.length
  return base + (sectionIndex < remainder ? 1 : 0)
}

export function reviewInternalTestingPrivateReviewResultDryRun(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingPrivateReviewResultDryRunResult {
  const executionHarness = reviewInternalTestingMockWorkerExecutionHarness(input)

  if (executionHarness.status !== 'passed_ready_for_private_review_result_dry_run') {
    return {
      decision: INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION,
      status: 'blocked_by_metadata_completion_gate',
      source: 'metadata_only_completion_harness',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      completedItemCount: executionHarness.completedItemCount,
      reviewSectionCount: 0,
      nextAction: 'resolve_completion_blockers',
      blockers: executionHarness.blockers,
      userFacingSummary: {
        title: 'Private review draft is ready for internal inspection',
        summary: 'Private review is blocked until metadata completion evidence passes.',
        disclaimer: 'This is metadata-only internal evidence; no edited media, export, or public delivery was created.',
      },
      reviewSections: [],
      privateManifest: privateManifest(input, false),
      productReady: false,
      blockedScope: blockedScope(),
    }
  }

  return {
    decision: INTERNAL_TESTING_PRIVATE_REVIEW_RESULT_DRY_RUN_DECISION,
    status: 'passed_ready_for_internal_tester_review_panel',
    source: 'metadata_only_completion_harness',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    completedItemCount: executionHarness.completedItemCount,
    reviewSectionCount: sectionCopy.length,
    nextAction: 'open_internal_tester_review_panel',
    blockers: [],
    userFacingSummary: {
      title: 'Private review draft is ready for internal inspection',
      summary: 'Internal testing has a private, metadata-only result summary for the approved edit path. Review it before any real media work is allowed.',
      disclaimer: 'This is metadata-only internal evidence; no edited media, export, or public delivery was created.',
    },
    reviewSections: sectionCopy.map((section, index) => ({
      ...section,
      status: 'ready_for_internal_review' as const,
      evidenceCount: distributeEvidenceCount(index, executionHarness.completedItemCount),
    })),
    privateManifest: privateManifest(input, true),
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function privateManifest(
  input: InternalTestingWorkerPayloadDryRunInput,
  passed: boolean,
): InternalTestingPrivateReviewResultDryRunResult['privateManifest'] {
  return {
    manifestId: `private-review-result-dry-run-${input.projectId}-${input.editSessionId}-${passed ? 'ready' : 'blocked'}`,
    visibility: 'private_internal_testing_only',
    storageMode: 'metadata_only_no_uploaded_artifact',
    source: 'mock_worker_execution_harness',
    generatedMedia: false,
    publicArtifact: false,
    signedUrl: false,
  }
}

function blockedScope(): InternalTestingPrivateReviewResultDryRunResult['blockedScope'] {
  return {
    frontendToolExecution: false,
    rawPromptExecution: false,
    publicOrSignedUrlArtifacts: false,
    serviceRoleBrowserAccess: false,
    providerOrModelCalls: false,
    workerDispatch: false,
    realWorkerExecution: false,
    toolExecution: false,
    mediaProcessing: false,
    renderOrExport: false,
    generatedMediaArtifacts: false,
    creditSpend: false,
    ledgerWrites: false,
    supabaseWrites: false,
    externalBeta: false,
    paidProduction: false,
    productReady: false,
  }
}
