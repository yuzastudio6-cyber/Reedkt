import {
  buildDisabledSoundCpuDispatchEnvelope,
  validateSoundCpuDispatchContractPayload,
  type SoundCpuDisabledDispatchEnvelope,
  type SoundCpuDispatchValidationResult,
} from './dispatch-contract.ts'

export const SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME = 'sound_cpu_disabled_dispatch_contract_route' as const
export const SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS = 'source_created_execution_blocked' as const
export const SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON =
  'SOUND CPU disabled dispatch route source exists, but worker dispatch execution remains blocked pending owner gates.'
export const SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON =
  'SOUND CPU disabled dispatch route rejected the payload before dispatch because the static contract was invalid.'

export type SoundCpuDisabledDispatchRouteInput = Readonly<{
  payload: unknown
}>

export type SoundCpuDisabledDispatchRouteInvalidPayloadResult = Readonly<{
  acceptedForDispatch: false
  routeName: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME
  routeStatus: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS
  blockedReason: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON
  validation: Extract<SoundCpuDispatchValidationResult, { ok: false }>
  noWorkerExecution: true
  noRouteExecution: true
  noSupabaseMutation: true
  noSqlExecution: true
  noMediaProcessing: true
  noArtifactCreated: true
}>

export type SoundCpuDisabledDispatchRouteResult =
  | (SoundCpuDisabledDispatchEnvelope &
      Readonly<{
        routeName: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME
        routeStatus: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS
        routeBlockedReason: typeof SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON
      }>)
  | SoundCpuDisabledDispatchRouteInvalidPayloadResult

export function createSoundCpuDisabledDispatchRouteResult(
  input: SoundCpuDisabledDispatchRouteInput,
): SoundCpuDisabledDispatchRouteResult {
  const validation = validateSoundCpuDispatchContractPayload(input.payload)

  if (!validation.ok) {
    return {
      acceptedForDispatch: false,
      routeName: SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
      routeStatus: SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS,
      blockedReason: SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON,
      validation,
      noWorkerExecution: true,
      noRouteExecution: true,
      noSupabaseMutation: true,
      noSqlExecution: true,
      noMediaProcessing: true,
      noArtifactCreated: true,
    }
  }

  return {
    ...buildDisabledSoundCpuDispatchEnvelope(validation.payload),
    routeName: SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
    routeStatus: SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS,
    routeBlockedReason: SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON,
  }
}

export function assertSoundCpuDisabledDispatchRouteExecutionBlocked(): never {
  throw new Error(SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON)
}
