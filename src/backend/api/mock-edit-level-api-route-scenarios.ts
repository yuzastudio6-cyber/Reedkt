import type { EditLevelApiRouteId } from '../contracts/edit-level-api-route-contracts'
import type { ReEditProCanonicalEditLevel, ReEditProEditLevelInputSource } from '../../types'
import { listEditLevelApiRouteIds } from './edit-level-api-route-registry'

export interface MockEditLevelApiRouteScenario {
  id: string
  routeId: EditLevelApiRouteId
  level?: ReEditProCanonicalEditLevel
  inputSource?: ReEditProEditLevelInputSource
  expectedRuntimeMode: 'mock'
  expectedStatus: 'mock_ready'
  expectedSideEffects: 'none'
  notes: string[]
}

const levels: ReEditProCanonicalEditLevel[] = ['normal', 'premium', 'ultra_premium']
const inputSources: ReEditProEditLevelInputSource[] = ['legacy_runtime', 'public_beta', 'explicit_canonical']

export const MOCK_EDIT_LEVEL_API_ROUTE_SCENARIOS: MockEditLevelApiRouteScenario[] = [
  ...listEditLevelApiRouteIds().map((routeId, index) => ({
    id: `edit-level-route-${String(index + 1).padStart(2, '0')}`,
    routeId,
    level: levels[index % levels.length],
    inputSource: inputSources[index % inputSources.length],
    expectedRuntimeMode: 'mock' as const,
    expectedStatus: 'mock_ready' as const,
    expectedSideEffects: 'none' as const,
    notes: ['Mock route handler must use local repository only.'],
  })),
  ...listEditLevelApiRouteIds().map((routeId, index) => ({
    id: `edit-level-route-side-effect-${String(index + 1).padStart(2, '0')}`,
    routeId,
    level: levels[(index + 1) % levels.length],
    inputSource: inputSources[(index + 1) % inputSources.length],
    expectedRuntimeMode: 'mock' as const,
    expectedStatus: 'mock_ready' as const,
    expectedSideEffects: 'none' as const,
    notes: ['Provider, media, worker, render, credit, Supabase, file-byte, and external fetch flags stay false.'],
  })),
  ...listEditLevelApiRouteIds().map((routeId, index) => ({
    id: `edit-level-route-client-contract-${String(index + 1).padStart(2, '0')}`,
    routeId,
    level: levels[(index + 2) % levels.length],
    inputSource: inputSources[(index + 2) % inputSources.length],
    expectedRuntimeMode: 'mock' as const,
    expectedStatus: 'mock_ready' as const,
    expectedSideEffects: 'none' as const,
    notes: ['Browser-safe client should call this route through mock transport without real HTTP.'],
  })),
]

export function listMockEditLevelApiRouteScenarios(): MockEditLevelApiRouteScenario[] {
  return MOCK_EDIT_LEVEL_API_ROUTE_SCENARIOS
}
