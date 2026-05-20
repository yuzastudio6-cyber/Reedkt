import type { BackendRuntimeTarget, BackendRuntimeTransportMode } from '../../types/backend-runtime'
import type { WorkerRuntimeKind } from '../../types/worker-lease'

export interface WorkerRuntimeDefinition {
  workerKind: WorkerRuntimeKind
  runtimeTarget: BackendRuntimeTarget
  transportMode: BackendRuntimeTransportMode
  requiresBackend: boolean
  requiresProviderSecret: boolean
  requiresServiceRole: boolean
  mockHandlerAvailable: boolean
  realHandlerAvailable: boolean
  notes: string[]
}

export const WORKER_RUNTIME_REGISTRY: WorkerRuntimeDefinition[] = [
  definition('lyria_worker', 'music_worker', true, true, true, true),
  definition('sfx_worker', 'sfx_worker', true, true, true, true),
  definition('render_worker', 'render_worker', true, false, true, false, ['Render worker skeleton is still missing.']),
  definition('planning_worker', 'planning_worker', true, false, true, true),
  definition('qa_worker', 'qa_worker', true, false, true, true),
  definition('provider_worker', 'provider_adapter', true, true, true, false),
  definition('mock_worker', 'custom', false, false, false, true),
  definition('custom_worker', 'custom', true, false, true, false),
]

export function getWorkerRuntimeDefinition(workerKind: WorkerRuntimeKind): WorkerRuntimeDefinition | undefined {
  return WORKER_RUNTIME_REGISTRY.find((definitionItem) => definitionItem.workerKind === workerKind)
}

export function getWorkerRuntimeDefinitionsByKind(workerKind: WorkerRuntimeKind): WorkerRuntimeDefinition[] {
  return WORKER_RUNTIME_REGISTRY.filter((definitionItem) => definitionItem.workerKind === workerKind)
}

export function createWorkerRuntimeRegistrySummary(): string {
  const mockReady = WORKER_RUNTIME_REGISTRY.filter((item) => item.mockHandlerAvailable).length
  return `${WORKER_RUNTIME_REGISTRY.length} worker runtime definition(s), ${mockReady} with mock handlers.`
}

function definition(
  workerKind: WorkerRuntimeKind,
  runtimeTarget: BackendRuntimeTarget,
  requiresBackend: boolean,
  requiresProviderSecret: boolean,
  requiresServiceRole: boolean,
  mockHandlerAvailable: boolean,
  notes: string[] = [],
): WorkerRuntimeDefinition {
  return {
    workerKind,
    runtimeTarget,
    transportMode: mockHandlerAvailable ? 'mock' : 'cloud_run_job',
    requiresBackend,
    requiresProviderSecret,
    requiresServiceRole,
    mockHandlerAvailable,
    realHandlerAvailable: false,
    notes: [
      'RP-FIX-11 registry is metadata only; no real worker dispatch happens.',
      ...notes,
    ],
  }
}
