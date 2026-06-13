import { existsSync, readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_DRY_RUN_SOURCE,
  TOOL_ROUTE_DRY_RUN_SOURCE_PATHS,
} from './tool-route-dry-run-planning-policy'
import type { ToolRouteWorkerDryRunContext } from './tool-route-dry-run-planning-types'

type WorkerDryRunJob = {
  jobId: string
  jobType: string
  ownerRoute: string
  sourceRefs: string[]
  dependencyIds: string[]
  dryRunOnly: boolean
  workerExecutionAllowed: boolean
  toolExecutionAllowed: boolean
  providerCallsAllowed: boolean
  routeExecutionAllowed: boolean
  approvedForRuntime: boolean
}

type WorkerBatch = {
  batchId: string
  sourcePlanId: string
  jobs: WorkerDryRunJob[]
  dependencies: unknown[]
}

function readBatch(): WorkerBatch | undefined {
  if (!existsSync(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Batch)) return undefined
  return JSON.parse(readFileSync(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Batch, 'utf8')) as WorkerBatch
}

export function loadToolRouteWorkerDryRunContext(): ToolRouteWorkerDryRunContext {
  const batch = readBatch()
  const activeBlockers: string[] = []
  if (!batch) {
    activeBlockers.push(`missing_source_evidence:${TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1Batch}`)
  }

  const jobs = batch?.jobs ?? []
  const allExecutionFlagsFalse = jobs.every((job) =>
    job.dryRunOnly === true &&
    job.workerExecutionAllowed === false &&
    job.toolExecutionAllowed === false &&
    job.providerCallsAllowed === false &&
    job.routeExecutionAllowed === false &&
    job.approvedForRuntime === false,
  )

  if (batch && batch.batchId !== `worker1-batch-${TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId}`) {
    activeBlockers.push(`unexpected_worker1_batch_id:${batch.batchId}`)
  }
  if (batch && batch.sourcePlanId !== TOOL_ROUTE_DRY_RUN_SOURCE.candidatePlanId) {
    activeBlockers.push(`unexpected_worker1_source_plan:${batch.sourcePlanId}`)
  }
  if (batch && jobs.length !== 7) {
    activeBlockers.push(`unexpected_worker1_job_count:${jobs.length}`)
  }
  if (batch && !allExecutionFlagsFalse) {
    activeBlockers.push('unsafe_worker1_execution_flag_detected')
  }
  if (!existsSync(TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1BlockedRoutes)) {
    activeBlockers.push(`missing_source_evidence:${TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1BlockedRoutes}`)
  }

  const refs = {
    snapshotIntake: jobs
      .filter((job) => job.jobType === 'snapshot_intake_validation')
      .map((job) => job.jobId),
    selectedIntentReviews: jobs
      .filter((job) => job.jobType === 'selected_intent_route_review')
      .map((job) => job.jobId),
    implementationProposalReview: jobs
      .filter((job) => job.jobType === 'implementation_proposal_review')
      .map((job) => job.jobId),
    artifactRouteEventValidation: jobs
      .filter((job) => job.jobType === 'artifact_blocked_route_event_validation')
      .map((job) => job.jobId),
    chartCard: jobs
      .filter((job) => job.sourceRefs.includes('route:chart_card_metadata'))
      .map((job) => job.jobId),
    mapCard: jobs
      .filter((job) => job.sourceRefs.includes('route:map_card_metadata'))
      .map((job) => job.jobId),
    captionRecommendation: jobs
      .filter((job) => job.sourceRefs.includes('route:caption_recommendation'))
      .map((job) => job.jobId),
    timelineMetadata: jobs
      .filter((job) => job.sourceRefs.includes('route:timeline_metadata_planning'))
      .map((job) => job.jobId),
  }

  return {
    phase: 'TOOL_ROUTE_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourceRunId: TOOL_ROUTE_DRY_RUN_SOURCE.worker1RunId,
    batchId: batch?.batchId ?? 'missing_worker1_batch',
    sourcePlanId: batch?.sourcePlanId ?? 'missing_source_plan',
    jobCount: jobs.length,
    dependencyCount: batch?.dependencies?.length ?? 0,
    routeReviewJobIds: refs.selectedIntentReviews,
    workerJobRefs: refs,
    dryRunOnly: allExecutionFlagsFalse,
    approvedForRuntime: false,
    allExecutionFlagsFalse,
    blockedRouteValidationPath: TOOL_ROUTE_DRY_RUN_SOURCE_PATHS.worker1BlockedRoutes,
    activeBlockers,
  }
}
