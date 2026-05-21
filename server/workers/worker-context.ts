import type { ServiceContext } from '../types'

export interface WorkerRuntimeContext extends ServiceContext {
  workerInstanceId: string
}

export function createWorkerRuntimeContext(context: ServiceContext, workerInstanceId?: string): WorkerRuntimeContext {
  return {
    ...context,
    workerInstanceId: workerInstanceId ?? context.env.workerInstanceId,
  }
}
