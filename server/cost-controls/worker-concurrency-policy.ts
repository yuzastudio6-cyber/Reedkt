import type { WorkerConcurrencyPolicy } from './cost-control-types'

export const workerConcurrencyPolicy: WorkerConcurrencyPolicy = {
  maxConcurrentJobsByWorkerType: {
    api_service: 20,
    cpu_analysis_worker: 4,
    gpu_ai_worker: 1,
    render_worker: 2,
    qa_worker: 4,
    tool_readiness_worker: 1,
  },
  productionOverrideRequiresHumanApproval: true,
}
