import {
  SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON,
  SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
  SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS,
  assertSoundCpuDisabledDispatchRouteExecutionBlocked,
  createSoundCpuDisabledDispatchRouteResult,
  type SoundCpuDisabledDispatchRouteInput,
  type SoundCpuDisabledDispatchRouteResult,
} from './disabled-dispatch-route.ts'

export const SOUND_CPU_DISABLED_ROUTE_REGISTRY_NAME = 'sound_cpu_disabled_route_registry' as const
export const SOUND_CPU_DISABLED_ROUTE_REGISTRY_STATUS = 'source_created_execution_blocked' as const
export const SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED = false as const

export type SoundCpuDisabledRouteRegistryEntry = Readonly<{
  routeName: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME
  routeStatus: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS
  registryStatus: typeof SOUND_CPU_DISABLED_ROUTE_REGISTRY_STATUS
  blockedReason: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON
  acceptedForDispatch: false
  executionEnabled: false
  noWorkerExecution: true
  noRouteExecution: true
  noSupabaseMutation: true
  noSqlExecution: true
  noMediaProcessing: true
  noArtifactCreated: true
  createResult: (input: SoundCpuDisabledDispatchRouteInput) => SoundCpuDisabledDispatchRouteResult
  assertExecutionBlocked: () => never
}>

export const SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY = {
  routeName: SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
  routeStatus: SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS,
  registryStatus: SOUND_CPU_DISABLED_ROUTE_REGISTRY_STATUS,
  blockedReason: SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON,
  acceptedForDispatch: false,
  executionEnabled: SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED,
  noWorkerExecution: true,
  noRouteExecution: true,
  noSupabaseMutation: true,
  noSqlExecution: true,
  noMediaProcessing: true,
  noArtifactCreated: true,
  createResult: createSoundCpuDisabledDispatchRouteResult,
  assertExecutionBlocked: assertSoundCpuDisabledDispatchRouteExecutionBlocked,
} satisfies SoundCpuDisabledRouteRegistryEntry

export const SOUND_CPU_DISABLED_ROUTE_REGISTRY = [SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY] as const

export function listSoundCpuDisabledRouteRegistry(): readonly SoundCpuDisabledRouteRegistryEntry[] {
  return SOUND_CPU_DISABLED_ROUTE_REGISTRY
}

export function getSoundCpuDisabledRouteRegistryEntry(
  routeName: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
): SoundCpuDisabledRouteRegistryEntry | undefined {
  return SOUND_CPU_DISABLED_ROUTE_REGISTRY.find((entry) => entry.routeName === routeName)
}

export function createSoundCpuDisabledRouteRegistryResult(
  input: SoundCpuDisabledDispatchRouteInput,
): SoundCpuDisabledDispatchRouteResult {
  return createSoundCpuDisabledDispatchRouteResult(input)
}

export function assertSoundCpuDisabledRouteRegistryExecutionBlocked(): never {
  return assertSoundCpuDisabledDispatchRouteExecutionBlocked()
}
