import type { AgentOutputRecord, AgentRunRecord, JobBatchRecord, JobDependencyRecord, JobEventRecord, JobRecord, JobStatus, JobType } from '../../types'

export interface CreateJobBatchRequest {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId?: string
  creditEstimateId?: string
  creditReservationId?: string
  batchName?: string
}

export interface CreateJobBatchResponse {
  jobBatch: JobBatchRecord
}

export interface CreateJobRequest {
  workspaceId: string
  projectId: string
  jobBatchId?: string
  editPlanId?: string
  creditEstimateId?: string
  creditReservationId?: string
  jobType: JobType
  jobName?: string
}

export interface CreateJobResponse {
  job: JobRecord
}

export interface AdvanceJobRequest {
  jobId: string
  status: JobStatus
  progressPercent?: number
  message?: string
}

export interface AdvanceJobResponse {
  job: JobRecord
  event: JobEventRecord
}

export interface CreateJobDependencyResponse {
  dependency: JobDependencyRecord
}

export interface AgentRunResponse {
  agentRun: AgentRunRecord
}

export interface AgentOutputResponse {
  agentOutput: AgentOutputRecord
}
