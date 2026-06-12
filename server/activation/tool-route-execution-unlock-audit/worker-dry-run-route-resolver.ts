import { readFileSync } from 'node:fs'
import {
  TOOL_ROUTE_AUDIT_SOURCE,
  TOOL_ROUTE_AUDIT_SOURCE_PATHS,
} from './tool-route-audit-policy'
import type {
  ToolRouteFamilyId,
  ToolRouteResolvedReview,
  ToolRouteSourceAudit,
  WorkerDryRunRouteResolution,
} from './tool-route-audit-types'

type WorkerJobRecord = {
  jobId?: string
  jobType?: string
  ownerRoute?: string
  sourceRefs?: string[]
  dryRunOnly?: boolean
  workerExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  routeExecutionAllowed?: boolean
  approvedForRuntime?: boolean
}

type WorkerBatchRecord = {
  batchId?: string
  sourcePlanId?: string
  dryRunOnly?: boolean
  approvedForRuntime?: boolean
  dependencies?: unknown[]
  jobs?: WorkerJobRecord[]
}

function readWorkerBatch(): WorkerBatchRecord {
  return JSON.parse(readFileSync(TOOL_ROUTE_AUDIT_SOURCE_PATHS.worker1Batch, 'utf8')) as WorkerBatchRecord
}

function routeLabel(job: WorkerJobRecord): string {
  return job.sourceRefs?.find((item) => item.startsWith('route:')) ?? job.jobType ?? 'unclassified'
}

function primaryFamilyForJob(job: WorkerJobRecord): ToolRouteFamilyId {
  const label = routeLabel(job)
  if (job.jobType === 'snapshot_intake_validation') return 'worker_runtime_jobs'
  if (label.includes('chart_card')) return 'ai_tools_creative_graphics'
  if (label.includes('map_card')) return 'map_geospatial'
  if (label.includes('timeline_metadata') || job.jobType === 'implementation_proposal_review') return 'provider_model_planning'
  if (label.includes('caption')) return 'compliance_security'
  if (job.jobType === 'artifact_blocked_route_event_validation') return 'observability_audit_cost'
  return 'worker_runtime_jobs'
}

function relatedFamiliesForJob(job: WorkerJobRecord): ToolRouteFamilyId[] {
  const primary = primaryFamilyForJob(job)
  const related = new Set<ToolRouteFamilyId>([primary])
  if (job.jobType === 'snapshot_intake_validation') {
    related.add('compliance_security')
    related.add('observability_audit_cost')
  }
  if (routeLabel(job).includes('caption')) {
    related.add('frontend_product_ux')
    related.add('observability_audit_cost')
  }
  if (routeLabel(job).includes('chart_card')) {
    related.add('frontend_product_ux')
    related.add('track_a_render_export')
  }
  if (routeLabel(job).includes('map_card')) {
    related.add('web_search_capture')
    related.add('frontend_product_ux')
  }
  if (routeLabel(job).includes('timeline_metadata')) {
    related.add('worker_runtime_jobs')
    related.add('track_b_media_audio_model')
    related.add('sound_music_audio')
  }
  if (job.jobType === 'implementation_proposal_review') {
    related.add('worker_runtime_jobs')
    related.add('compliance_security')
  }
  if (job.jobType === 'artifact_blocked_route_event_validation') {
    related.add('public_artifact_signed_url_delivery')
    related.add('supabase_metadata_storage')
    related.add('billing_credits')
  }
  return [...related]
}

const TOOL_STUDY_FAMILIES = new Set<ToolRouteFamilyId>([
  'provider_model_planning',
  'track_a_render_export',
  'track_b_media_audio_model',
  'ai_tools_creative_graphics',
  'map_geospatial',
  'web_search_capture',
  'sound_music_audio',
  'supabase_metadata_storage',
  'worker_runtime_jobs',
])

function resolveJob(job: WorkerJobRecord): ToolRouteResolvedReview {
  const primaryRouteFamilyId = primaryFamilyForJob(job)
  return {
    jobId: job.jobId ?? 'missing_job_id',
    jobType: job.jobType ?? 'missing_job_type',
    sourceRefs: job.sourceRefs ?? [],
    worker1OwnerRoute: job.ownerRoute ?? 'missing_owner_route',
    routeLabel: routeLabel(job),
    primaryRouteFamilyId,
    relatedRouteFamilyIds: relatedFamiliesForJob(job),
    executionAllowed: false,
    toolStudyRequiredBeforeExecution: TOOL_STUDY_FAMILIES.has(primaryRouteFamilyId),
    ownerAcceptanceRequired: true,
  }
}

export function resolveWorkerDryRunRoutes(sourceAudit: ToolRouteSourceAudit): WorkerDryRunRouteResolution {
  const activeBlockers = [...sourceAudit.activeBlockers]
  let batch: WorkerBatchRecord = {}
  try {
    batch = readWorkerBatch()
  } catch (error) {
    activeBlockers.push(`worker1_batch_read_failed:${error instanceof Error ? error.message : 'unknown'}`)
  }
  const jobs = Array.isArray(batch.jobs) ? batch.jobs : []
  const routeReviews = jobs.map(resolveJob)
  const executionAllowed = jobs.some((job) =>
    job.workerExecutionAllowed !== false ||
    job.toolExecutionAllowed !== false ||
    job.providerCallsAllowed !== false ||
    job.routeExecutionAllowed !== false ||
    job.approvedForRuntime !== false,
  )
  if (batch.batchId !== `worker1-batch-${TOOL_ROUTE_AUDIT_SOURCE.worker1RunId}`) activeBlockers.push(`unexpected_worker1_batch:${batch.batchId ?? 'missing'}`)
  if (batch.sourcePlanId !== TOOL_ROUTE_AUDIT_SOURCE.candidatePlanId) activeBlockers.push(`unexpected_worker1_source_plan:${batch.sourcePlanId ?? 'missing'}`)
  if (batch.dryRunOnly !== true) activeBlockers.push('worker1_batch_not_dry_run_only')
  if (batch.approvedForRuntime !== false) activeBlockers.push('worker1_batch_runtime_approval_not_false')
  if (jobs.length !== 7) activeBlockers.push(`unexpected_worker1_job_count:${jobs.length}`)
  if (executionAllowed) activeBlockers.push('worker1_job_execution_flag_enabled')
  if (!routeReviews.some((review) => review.primaryRouteFamilyId === 'ai_tools_creative_graphics')) activeBlockers.push('missing_ai_tools_route_mapping')
  if (!routeReviews.some((review) => review.primaryRouteFamilyId === 'map_geospatial')) activeBlockers.push('missing_map_route_mapping')
  if (!routeReviews.some((review) => review.primaryRouteFamilyId === 'provider_model_planning')) activeBlockers.push('missing_provider_model_route_mapping')

  return {
    phase: 'TOOL_ROUTE_0',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    sourceWorkerRunId: TOOL_ROUTE_AUDIT_SOURCE.worker1RunId,
    sourceBatchId: batch.batchId ?? '',
    sourcePlanId: batch.sourcePlanId ?? '',
    dryRunOnly: batch.dryRunOnly === true,
    approvedForRuntime: batch.approvedForRuntime === true,
    routeReviews,
    dependencyCount: Array.isArray(batch.dependencies) ? batch.dependencies.length : 0,
    activeBlockers,
  }
}
