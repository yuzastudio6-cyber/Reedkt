import type {
  CreditApprovalRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  GeneratedAssetRecord,
  GenerationRequestRecord,
  SFXEventPlanRecord,
  SFXGeneratedAssetRecord,
  SFXLibraryCandidateRecord,
  SFXMixPlanRecord,
  SFXProviderRouteRecord,
  SFXQAReportRecord,
  SFXTimingAlignmentRecord,
} from '../../types'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type {
  EditProjectSFXIntegrationResult,
  EditProjectSFXStatus,
} from '../contracts/sfx-director-contracts'
import type { SFXWorkerRunResult } from '../workers/sfx-worker-contracts'

function hasPromptableSFX(eventPlans: SFXEventPlanRecord[]): boolean {
  return eventPlans.some((eventPlan) =>
    eventPlan.decisionState !== 'avoid' &&
    eventPlan.decisionState !== 'not_needed'
  )
}

export function getSFXProviderRouteStatus(providerRoutes: SFXProviderRouteRecord[]): EditProjectSFXStatus {
  if (providerRoutes.length === 0) return 'not_planned'
  if (providerRoutes.every((route) => route.recommendedProvider === 'no_sfx')) return 'skipped_no_sfx'
  return 'planned'
}

export function getSFXCreditApprovalStatus(input: {
  creditEstimate?: CreditEstimateRecord
  creditApproval?: CreditApprovalRecord
  creditReservation?: CreditReservationRecord
}): EditProjectSFXStatus {
  if (!input.creditEstimate) return 'skipped_no_sfx'
  if (input.creditEstimate.status !== 'approved' || input.creditApproval?.status !== 'approved') {
    return 'awaiting_credit_approval'
  }
  if (input.creditReservation?.status === 'reserved') return 'approved'
  return 'awaiting_credit_approval'
}

export function getSFXGenerationJobStatus(input: {
  generationRequests?: GenerationRequestRecord[]
  jobQueueItems?: JobRuntimeQueueItem[]
  workerOutputs?: SFXWorkerRunResult[]
}): EditProjectSFXStatus {
  if (input.workerOutputs?.some((run) => run.output.status === 'failed')) return 'qa_failed'
  if (input.workerOutputs?.some((run) => run.output.status === 'blocked')) return 'blocked'
  if (input.workerOutputs?.some((run) =>
    run.output.status === 'mock_generated' ||
    run.output.status === 'library_match_used' ||
    run.output.status === 'completed'
  )) {
    return 'generated'
  }
  if (input.jobQueueItems?.some((item) => item.queueStatus === 'running')) return 'mock_generating'
  if (input.jobQueueItems?.some((item) => item.queueStatus === 'queued')) return 'queued'
  if (input.generationRequests?.length) return 'approved'
  return 'planned'
}

export function getSFXQAStatus(qaReports: SFXQAReportRecord[] = []): EditProjectSFXStatus {
  if (qaReports.some((report) => report.status === 'failed' || report.requiresRegeneration)) return 'qa_failed'
  if (qaReports.some((report) => report.status === 'passed' || report.approvedForProject)) return 'qa_passed'
  if (qaReports.length > 0) return 'mixed'
  return 'planned'
}

export function getSFXProjectAssetStatus(input: {
  generatedAssets?: GeneratedAssetRecord[]
  sfxGeneratedAssets?: SFXGeneratedAssetRecord[]
  timingPlans?: SFXTimingAlignmentRecord[]
  mixPlans?: SFXMixPlanRecord[]
  qaReports?: SFXQAReportRecord[]
  libraryCandidates?: SFXLibraryCandidateRecord[]
}): EditProjectSFXStatus {
  if (input.libraryCandidates?.length) return 'library_candidate'
  const qaStatus = getSFXQAStatus(input.qaReports)
  if (qaStatus === 'qa_failed') return 'qa_failed'
  if (qaStatus === 'qa_passed') return 'project_only'
  if (input.mixPlans?.length) return 'mixed'
  if (input.timingPlans?.length) return 'timed'
  if (input.sfxGeneratedAssets?.length || input.generatedAssets?.length) return 'generated'
  return 'planned'
}

export function getEditProjectSFXStatus(input: {
  integration?: EditProjectSFXIntegrationResult
  workerOutputs?: SFXWorkerRunResult[]
  generatedAssets?: GeneratedAssetRecord[]
  sfxGeneratedAssets?: SFXGeneratedAssetRecord[]
  timingPlans?: SFXTimingAlignmentRecord[]
  mixPlans?: SFXMixPlanRecord[]
  qaReports?: SFXQAReportRecord[]
  libraryCandidates?: SFXLibraryCandidateRecord[]
}): EditProjectSFXStatus {
  const integration = input.integration

  if (!integration) return 'not_planned'
  if (!hasPromptableSFX(integration.sfxEventPlans)) return 'skipped_no_sfx'

  const assetStatus = getSFXProjectAssetStatus(input)
  if (
    assetStatus === 'library_candidate' ||
    assetStatus === 'project_only' ||
    assetStatus === 'qa_failed' ||
    assetStatus === 'mixed' ||
    assetStatus === 'timed' ||
    assetStatus === 'generated'
  ) {
    return assetStatus
  }

  const generationStatus = getSFXGenerationJobStatus({
    generationRequests: integration.generationRequests,
    jobQueueItems: integration.jobQueueItems,
    workerOutputs: input.workerOutputs,
  })
  if (
    generationStatus === 'blocked' ||
    generationStatus === 'qa_failed' ||
    generationStatus === 'generated' ||
    generationStatus === 'mock_generating' ||
    generationStatus === 'queued'
  ) {
    return generationStatus
  }

  return getSFXCreditApprovalStatus({
    creditEstimate: integration.creditEstimate,
    creditApproval: integration.creditApproval,
    creditReservation: integration.creditReservation,
  })
}

export function createEditProjectSFXStatusSummary(input: {
  integration?: EditProjectSFXIntegrationResult
  workerOutputs?: SFXWorkerRunResult[]
  generatedAssets?: GeneratedAssetRecord[]
  sfxGeneratedAssets?: SFXGeneratedAssetRecord[]
  timingPlans?: SFXTimingAlignmentRecord[]
  mixPlans?: SFXMixPlanRecord[]
  qaReports?: SFXQAReportRecord[]
  libraryCandidates?: SFXLibraryCandidateRecord[]
}): string[] {
  const status = getEditProjectSFXStatus(input)
  const integration = input.integration

  if (!integration) {
    return [
      'Project SFX has not been planned yet.',
      'Mock mode: ReeditPro has not called Mirelo or MMAudio yet.',
    ]
  }

  const providerSummary = integration.providerRoutes.length
    ? `Provider routes: ${integration.providerRoutes.map((route) => route.recommendedProvider).join(', ')}.`
    : 'No provider route exists yet.'
  const creditSummary = integration.creditEstimate
    ? `Credit status: estimate ${integration.creditEstimate.status}, reservation ${integration.creditReservation?.status ?? 'missing'}.`
    : 'Credit status: no SFX credits needed.'
  const workerSummary = integration.jobQueueItems.length
    ? `Mock SFX jobs: ${integration.jobQueueItems.map((item) => item.queueStatus).join(', ')}.`
    : 'Mock SFX jobs: none queued.'

  return [
    `Project SFX status: ${status}.`,
    providerSummary,
    creditSummary,
    workerSummary,
    'Mirelo SFX V1.5: production SFX. MMAudio V2: cheap draft/basic-pro fallback. Internal library: first choice when available.',
    'Mock mode: ReeditPro has not called Mirelo or MMAudio yet.',
  ]
}
