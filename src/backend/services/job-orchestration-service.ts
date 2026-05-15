import type {
  AgentOutputRecord,
  AgentRunRecord,
  AgentType,
  AgentOutputType,
  JobBatchRecord,
  JobDependencyRecord,
  JobEventRecord,
  JobEventType,
  JobRecord,
  JobStatus,
} from '../../types'
import type { CreateJobBatchRequest, CreateJobRequest } from '../contracts/job-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createJobBatch(
  db: MockDatabase,
  input: CreateJobBatchRequest,
): ServiceResult<JobBatchRecord> {
  const jobBatch: JobBatchRecord = {
    id: createMockId('job-batch'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    status: 'queued',
    batchName: input.batchName ?? 'Mock approved edit pipeline',
    batchPurpose: 'Coordinate future workers after approval and credit reservation.',
    currentStage: 'queued',
    progressPercent: 0,
    priority: 'normal',
    createdByAgent: 'mock_generation_orchestrator',
    inputPayload: { mockOnly: true },
    outputPayload: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'jobBatches', jobBatch))
}

export function createJob(db: MockDatabase, input: CreateJobRequest): ServiceResult<JobRecord> {
  const job: JobRecord = {
    id: createMockId('job'),
    jobBatchId: input.jobBatchId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    jobType: input.jobType,
    status: input.creditReservationId || !isGenerationOrRenderJob(input.jobType) ? 'queued' : 'waiting_credit_reservation',
    priority: 'normal',
    workerTarget: workerForJob(input.jobType),
    runtimeType: 'frontend_mock',
    jobName: input.jobName ?? input.jobType,
    jobDescription: 'Mock job record for future Google Cloud worker orchestration.',
    dependsOnAll: true,
    inputPayload: { mockOnly: true },
    outputPayload: {},
    errorPayload: {},
    failureCategory: 'none',
    attemptCount: 0,
    maxAttempts: 1,
    progressPercent: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'jobs', job))
}

export function createJobDependency(
  db: MockDatabase,
  jobId: string,
  dependsOnJobId: string,
  workspaceId: string,
  projectId: string,
): ServiceResult<JobDependencyRecord> {
  const dependency: JobDependencyRecord = {
    id: createMockId('job-dependency'),
    workspaceId,
    projectId,
    jobId,
    dependsOnJobId,
    dependencyReason: 'Mock dependency gate.',
    requiredStatus: 'completed',
    createdAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'jobDependencies', dependency))
}

export function canRunJob(db: MockDatabase, jobId: string): ServiceResult<boolean> {
  const job = findMockRecord(db, 'jobs', jobId)

  if (!job) {
    return fail('JOB_NOT_FOUND', `Job ${jobId} was not found.`)
  }

  const dependencies = db.jobDependencies.filter((dependency) => dependency.jobId === jobId)
  const ready = dependencies.every((dependency) => {
    const parent = findMockRecord(db, 'jobs', dependency.dependsOnJobId)
    return parent?.status === dependency.requiredStatus
  })

  if (!ready) {
    return fail('JOB_DEPENDENCY_NOT_READY', `Job ${jobId} is still waiting for dependencies.`)
  }

  if (isGenerationOrRenderJob(job.jobType) && !job.creditReservationId) {
    return fail('CREDITS_NOT_RESERVED', 'Generation and render jobs require reserved credits.')
  }

  return ok(true)
}

export function advanceJobStatus(
  db: MockDatabase,
  jobId: string,
  status: JobStatus,
  progressPercent = 100,
  message = `Job moved to ${status}.`,
): ServiceResult<JobRecord> {
  const job = findMockRecord(db, 'jobs', jobId)

  if (!job) {
    return fail('JOB_NOT_FOUND', `Job ${jobId} was not found.`)
  }

  job.status = status
  job.progressPercent = progressPercent
  job.progressMessage = message
  job.updatedAt = nowIso()

  if (status === 'running') {
    job.startedAt = nowIso()
  }

  if (status === 'completed') {
    job.completedAt = nowIso()
  }

  recordJobEvent(db, jobId, statusToEventType(status), message, progressPercent)
  return ok(job)
}

export function recordJobEvent(
  db: MockDatabase,
  jobId: string,
  eventType: JobEventType,
  message?: string,
  progressPercent?: number,
): ServiceResult<JobEventRecord> {
  const job = findMockRecord(db, 'jobs', jobId)

  if (!job) {
    return fail('JOB_NOT_FOUND', `Job ${jobId} was not found.`)
  }

  const event: JobEventRecord = {
    id: createMockId('job-event'),
    jobId,
    jobBatchId: job.jobBatchId,
    workspaceId: job.workspaceId,
    projectId: job.projectId,
    eventType,
    message,
    progressPercent,
    actorType: 'system',
    actorAgentType: 'generation_orchestrator',
    payload: { mockOnly: true },
    createdAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'jobEvents', event))
}

export function createAgentRun(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    jobId?: string
    jobBatchId?: string
    editPlanId?: string
    agentType: AgentType
  },
): ServiceResult<AgentRunRecord> {
  const agentRun: AgentRunRecord = {
    id: createMockId('agent-run'),
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    agentType: input.agentType,
    runtimeType: 'frontend_mock',
    status: 'completed',
    providerName: 'local_mock',
    inputPayload: { mockOnly: true },
    outputPayload: { mockOnly: true },
    errorPayload: {},
    startedAt: nowIso(),
    completedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'agentRuns', agentRun))
}

export function createAgentOutput(
  db: MockDatabase,
  input: {
    agentRunId: string
    workspaceId: string
    projectId: string
    outputType: AgentOutputType
    title: string
    editPlanId?: string
  },
): ServiceResult<AgentOutputRecord> {
  const output: AgentOutputRecord = {
    id: createMockId('agent-output'),
    agentRunId: input.agentRunId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    outputType: input.outputType,
    title: input.title,
    summary: 'Mock agent output.',
    payload: { mockOnly: true },
    confidence: 'high',
    visibleToUser: false,
    createdAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'agentOutputs', output))
}

function isGenerationOrRenderJob(jobType: JobRecord['jobType']): boolean {
  return ['generation', 'stroke_motion_generation', 'graphic_design_generation', 'real_motion_generation', 'soundsync_generation', 'render_preview', 'export'].includes(jobType)
}

function workerForJob(jobType: JobRecord['jobType']): AgentType {
  if (jobType.includes('render')) {
    return 'render_worker'
  }

  if (jobType.includes('generation')) {
    return 'generation_orchestrator'
  }

  if (jobType.includes('stroke_motion')) {
    return 'stroke_motion_story_agent'
  }

  if (jobType.includes('quality')) {
    return 'quality_check_agent'
  }

  if (jobType.includes('credit')) {
    return 'credit_estimation_agent'
  }

  return 'chat_intent_agent'
}

function statusToEventType(status: JobStatus): JobEventType {
  if (status === 'running') {
    return 'started'
  }

  if (status === 'completed') {
    return 'completed'
  }

  if (status === 'failed') {
    return 'failed'
  }

  if (status === 'waiting_dependency') {
    return 'waiting_dependency'
  }

  if (status === 'waiting_credit_reservation') {
    return 'waiting_credit_reservation'
  }

  return 'progress'
}
