import type {
  BackendRuntimeSafetyLevel,
  BackendRuntimeTarget,
  BackendRuntimeTransportMode,
} from '../../types/backend-runtime'

export type MockBackendRuntimeScenarioId =
  | 'mock-envelope-created'
  | 'mock-transport-envelope-sent'
  | 'backend-http-placeholder-blocked'
  | 'supabase-edge-placeholder-blocked'
  | 'cloud-run-service-placeholder-blocked'
  | 'cloud-run-job-placeholder-blocked'
  | 'pubsub-placeholder-blocked'
  | 'frontend-safe-envelope-validation-blocked'

export interface MockBackendRuntimeScenario {
  id: MockBackendRuntimeScenarioId
  label: string
  target: BackendRuntimeTarget
  transportMode: BackendRuntimeTransportMode
  safetyLevel: BackendRuntimeSafetyLevel
  expectedOk: boolean
  notes: string[]
}

export const mockBackendRuntimeScenarios: MockBackendRuntimeScenario[] = [
  scenario('mock-envelope-created', 'Create a mock runtime envelope.', 'api_route', 'mock', 'frontend_safe', true),
  scenario('mock-transport-envelope-sent', 'Send a mock runtime envelope.', 'planning_worker', 'mock', 'backend_required', true),
  scenario('backend-http-placeholder-blocked', 'Backend HTTP transport returns backend-required.', 'api_route', 'backend_http', 'backend_required', false),
  scenario('supabase-edge-placeholder-blocked', 'Supabase Edge transport returns backend-required.', 'api_route', 'supabase_edge_function', 'backend_required', false),
  scenario('cloud-run-service-placeholder-blocked', 'Cloud Run service transport returns backend-required.', 'music_worker', 'cloud_run_service', 'cloud_runtime_required', false),
  scenario('cloud-run-job-placeholder-blocked', 'Cloud Run job transport returns backend-required.', 'render_worker', 'cloud_run_job', 'cloud_runtime_required', false),
  scenario('pubsub-placeholder-blocked', 'Pub/Sub transport returns backend-required.', 'provider_adapter', 'pubsub', 'cloud_runtime_required', false),
  scenario('frontend-safe-envelope-validation-blocked', 'Frontend-safe provider envelope is rejected by validation.', 'provider_adapter', 'frontend_mock', 'frontend_safe', false, [
    'Provider, generation, and render workers cannot be marked frontend_safe.',
  ]),
]

export function getMockBackendRuntimeScenarioById(
  id: MockBackendRuntimeScenarioId,
): MockBackendRuntimeScenario | undefined {
  return mockBackendRuntimeScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockBackendRuntimeScenario(): MockBackendRuntimeScenario {
  return mockBackendRuntimeScenarios[1]
}

function scenario(
  id: MockBackendRuntimeScenarioId,
  label: string,
  target: BackendRuntimeTarget,
  transportMode: BackendRuntimeTransportMode,
  safetyLevel: BackendRuntimeSafetyLevel,
  expectedOk: boolean,
  notes: string[] = [],
): MockBackendRuntimeScenario {
  return {
    id,
    label,
    target,
    transportMode,
    safetyLevel,
    expectedOk,
    notes: [
      'Scenario is mock/local only; it must not call network, Cloud Run, Pub/Sub, Supabase Edge, providers, Stripe, or render workers.',
      ...notes,
    ],
  }
}
