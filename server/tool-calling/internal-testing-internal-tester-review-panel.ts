import {
  reviewInternalTestingPrivateReviewResultDryRun,
} from './internal-testing-private-review-result-dry-run'
import type {
  InternalTestingWorkerPayloadDryRunInput,
} from './internal-testing-worker-payload-dry-run'

export const INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION =
  'internal_testing_internal_tester_review_panel_passed_ready_for_real_video_acceptance_preflight'

export type InternalTestingInternalTesterReviewPanelStatus =
  | 'passed_ready_for_real_video_acceptance_preflight'
  | 'blocked_by_private_review_result_gate'

export type InternalTesterReviewPanelItemId =
  | 'review_summary'
  | 'inspect_private_sections'
  | 'confirm_boundaries'
  | 'record_local_note'
  | 'prepare_real_video_preflight'

export interface InternalTestingInternalTesterReviewPanelResult {
  decision: typeof INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION
  status: InternalTestingInternalTesterReviewPanelStatus
  source: 'private_review_result_dry_run'
  workspaceId: string
  projectId: string
  editSessionId: string
  reviewSectionCount: number
  checklistItemCount: number
  dispositionCount: number
  nextAction: 'prepare_real_video_acceptance_preflight' | 'resolve_private_review_result_blockers'
  blockers: readonly string[]
  panel: {
    title: 'Internal tester review panel is ready'
    summary: string
    checklist: readonly {
      id: InternalTesterReviewPanelItemId
      label: string
      status: 'ready_for_tester_review'
      required: true
      summary: string
    }[]
    dispositions: readonly {
      id: 'accepted_for_preflight' | 'needs_revision_before_preflight' | 'blocked_before_preflight'
      label: string
      summary: string
    }[]
  }
  feedbackCapture: {
    mode: 'browser_local_export_only'
    supabaseWrites: false
    signedUrls: false
    publicArtifacts: false
  }
  realVideoAcceptance: {
    requiredFixturePath: 'Documents/test video/internal testing.MP4'
    allowedInThisGate: false
    nextGate: 'real_video_acceptance_preflight'
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

const checklist = [
  {
    id: 'review_summary',
    label: 'Review summary',
    summary: 'Confirm the private review draft is metadata-only and understandable to an internal tester.',
  },
  {
    id: 'inspect_private_sections',
    label: 'Inspect private sections',
    summary: 'Check every human-facing review section before moving toward a real-video preflight.',
  },
  {
    id: 'confirm_boundaries',
    label: 'Confirm boundaries',
    summary: 'Verify no edited media, signed links, public delivery, tool execution, or product-ready claim appears.',
  },
  {
    id: 'record_local_note',
    label: 'Record local note',
    summary: 'Capture tester outcome through browser-local feedback export only.',
  },
  {
    id: 'prepare_real_video_preflight',
    label: 'Prepare real-video preflight',
    summary: 'Carry the internal testing video into the next approved gate without reading or processing it here.',
  },
] as const satisfies readonly {
  id: InternalTesterReviewPanelItemId
  label: string
  summary: string
}[]

const dispositions = [
  {
    id: 'accepted_for_preflight',
    label: 'Accepted for preflight',
    summary: 'The internal review panel is clear enough to move to real-video acceptance preflight.',
  },
  {
    id: 'needs_revision_before_preflight',
    label: 'Needs revision before preflight',
    summary: 'The tester found a copy, state, or evidence issue that should be fixed first.',
  },
  {
    id: 'blocked_before_preflight',
    label: 'Blocked before preflight',
    summary: 'The tester found a hard boundary issue that stops the next gate.',
  },
] as const satisfies InternalTestingInternalTesterReviewPanelResult['panel']['dispositions']

export function reviewInternalTestingInternalTesterReviewPanel(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingInternalTesterReviewPanelResult {
  const privateReview = reviewInternalTestingPrivateReviewResultDryRun(input)

  if (privateReview.status !== 'passed_ready_for_internal_tester_review_panel') {
    return {
      decision: INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION,
      status: 'blocked_by_private_review_result_gate',
      source: 'private_review_result_dry_run',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      reviewSectionCount: privateReview.reviewSectionCount,
      checklistItemCount: 0,
      dispositionCount: 0,
      nextAction: 'resolve_private_review_result_blockers',
      blockers: privateReview.blockers,
      panel: {
        title: 'Internal tester review panel is ready',
        summary: 'Internal tester review is blocked until the private review result dry-run passes.',
        checklist: [],
        dispositions: [],
      },
      feedbackCapture: feedbackCapture(),
      realVideoAcceptance: realVideoAcceptance(),
      productReady: false,
      blockedScope: blockedScope(),
    }
  }

  return {
    decision: INTERNAL_TESTING_INTERNAL_TESTER_REVIEW_PANEL_DECISION,
    status: 'passed_ready_for_real_video_acceptance_preflight',
    source: 'private_review_result_dry_run',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    reviewSectionCount: privateReview.reviewSectionCount,
    checklistItemCount: checklist.length,
    dispositionCount: dispositions.length,
    nextAction: 'prepare_real_video_acceptance_preflight',
    blockers: [],
    panel: {
      title: 'Internal tester review panel is ready',
      summary: 'Internal testers can now review the metadata-only result summary, record a browser-local outcome, and prepare the next real-video acceptance preflight without running media work in this gate.',
      checklist: checklist.map((item) => ({
        ...item,
        status: 'ready_for_tester_review' as const,
        required: true,
      })),
      dispositions,
    },
    feedbackCapture: feedbackCapture(),
    realVideoAcceptance: realVideoAcceptance(),
    productReady: false,
    blockedScope: blockedScope(),
  }
}

function feedbackCapture(): InternalTestingInternalTesterReviewPanelResult['feedbackCapture'] {
  return {
    mode: 'browser_local_export_only',
    supabaseWrites: false,
    signedUrls: false,
    publicArtifacts: false,
  }
}

function realVideoAcceptance(): InternalTestingInternalTesterReviewPanelResult['realVideoAcceptance'] {
  return {
    requiredFixturePath: 'Documents/test video/internal testing.MP4',
    allowedInThisGate: false,
    nextGate: 'real_video_acceptance_preflight',
  }
}

function blockedScope(): InternalTestingInternalTesterReviewPanelResult['blockedScope'] {
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
