import type { ToolExecutionPlan } from '../../../src/backend/contracts/tool-execution-contracts'
import { dispatchProductionWorkerJob } from './production-worker-dispatcher'
import { createProductionWorkerRuntimeState } from './production-worker-lease-manager'
import type {
  ProductionWorkerExecutionResult,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeState,
} from './production-worker-types'

export interface RunProductionWorkerRuntimeInput {
  payload: ProductionWorkerJobPayload
  executionPlan?: ToolExecutionPlan
  state?: ProductionWorkerRuntimeState
  workerInstanceId?: string
}

export async function runProductionWorkerRuntime(
  input: RunProductionWorkerRuntimeInput,
): Promise<ProductionWorkerExecutionResult> {
  return dispatchProductionWorkerJob({
    payload: input.payload,
    executionPlan: input.executionPlan,
    state: input.state,
    workerInstanceId: input.workerInstanceId,
  })
}

export { createProductionWorkerRuntimeState }
