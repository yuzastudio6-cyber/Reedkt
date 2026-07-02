import type { ServiceContext } from '../types'
import { nowIso, sanitizeJson, throwOnSupabaseError } from '../services/service-helpers'
import type { WorkerJobRecord } from './worker-job-loader'
import type { WorkerEventPayload } from './worker-result'

export async function emitWorkerEvent(
  context: ServiceContext,
  job: WorkerJobRecord,
  input: {
    eventName: string
    workerType: string
    workerInstanceId?: string
    message: string
    progressPercent?: number
    payloadJson?: Record<string, unknown>
    eventType?: 'started' | 'progress' | 'completed' | 'failed' | 'blocked'
  },
): Promise<WorkerEventPayload> {
  const event: WorkerEventPayload = {
    eventName: input.eventName,
    jobId: job.id,
    workerType: input.workerType,
    workerInstanceId: input.workerInstanceId,
    message: input.message,
    progressPercent: input.progressPercent,
    payloadJson: sanitizeJson(input.payloadJson ?? {}),
    createdAt: nowIso(),
  }

  if (context.clients.admin && !context.env.mockOnly) {
    const { error } = await context.clients.admin
      .from('job_events')
      .insert({
        job_id: job.id,
        job_batch_id: job.jobBatchId ?? null,
        workspace_id: job.workspaceId,
        project_id: job.projectId ?? null,
        event_type: input.eventType ?? 'progress',
        message: input.message,
        progress_percent: input.progressPercent ?? null,
        actor_type: 'worker',
        actor_agent_type: agentTypeForWorker(input.workerType),
        payload: {
          eventName: input.eventName,
          workerType: input.workerType,
          workerInstanceId: input.workerInstanceId,
          ...sanitizeJson(input.payloadJson ?? {}),
        },
      })
    throwOnSupabaseError(error)
  }

  return event
}

function agentTypeForWorker(workerType: string): string {
  if (workerType.includes('render')) return 'render_worker'
  if (workerType.includes('sfx')) return 'soundsync_worker'
  if (workerType.includes('quality')) return 'quality_check_agent'
  return 'system'
}
