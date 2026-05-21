import type { ServiceContext } from '../../types'
import type { WorkerJobRecord } from '../worker-job-loader'

export async function runNoOpWorker(_context: ServiceContext, job: WorkerJobRecord): Promise<Record<string, unknown>> {
  return {
    worker: 'no-op',
    jobId: job.id,
    message: 'No-op worker completed without provider calls, rendering, or media processing.',
  }
}
