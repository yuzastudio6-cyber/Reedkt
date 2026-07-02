import type { ServiceContext } from '../types'
import { runApprovedSnapshotReadinessWorker } from './jobs/approved-snapshot-readiness-worker'
import { runBasicRenderSmokeWorker } from './jobs/basic-render-smoke-worker'
import type { BasicRenderSmokeResponse } from './jobs/basic-render-smoke-types'
import { runMediaProbeWorker } from './jobs/media-probe-worker'
import { runNoOpWorker } from './jobs/no-op-worker'
import { runSourceMediaReadinessWorker } from './jobs/source-media-readiness-worker'
import type { WorkerJobRecord } from './worker-job-loader'
import type { MediaProbeResult } from './worker-result'
import type { SourceMediaReadinessResult } from './jobs/source-media-readiness-worker'

export type WorkerHandlerOutput = Record<string, unknown> | SourceMediaReadinessResult | MediaProbeResult | BasicRenderSmokeResponse

export async function runWorkerHandler(input: {
  context: ServiceContext
  job: WorkerJobRecord
  workerType: string
}): Promise<WorkerHandlerOutput> {
  if (input.workerType === 'approved_snapshot_readiness_worker') {
    return runApprovedSnapshotReadinessWorker(input.context, input.job)
  }

  if (input.workerType === 'source_media_readiness_worker') {
    return runSourceMediaReadinessWorker(input.context, input.job)
  }

  if (input.workerType === 'media_probe_worker') {
    return runMediaProbeWorker(input.context, input.job)
  }

  if (input.workerType === 'basic_render_smoke_worker') {
    return runBasicRenderSmokeWorker(input.context, input.job)
  }

  return runNoOpWorker(input.context, input.job)
}
