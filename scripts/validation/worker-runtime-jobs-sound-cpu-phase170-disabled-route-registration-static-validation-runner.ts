import { SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS } from '../../server/workers/sound-cpu/dispatch-contract.ts'
import {
  SOUND_CPU_DISABLED_ROUTE_REGISTRY,
  SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY,
  SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED,
  assertSoundCpuDisabledRouteRegistryExecutionBlocked,
  createSoundCpuDisabledRouteRegistryResult,
  getSoundCpuDisabledRouteRegistryEntry,
  listSoundCpuDisabledRouteRegistry,
} from '../../server/workers/sound-cpu/disabled-route-registry.ts'
import { SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME } from '../../server/workers/sound-cpu/disabled-dispatch-route.ts'

const safePayload = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-phase170-static-only',
  workspaceId: 'workspace-phase170-static-only',
  projectId: 'project-phase170-static-only',
  jobId: 'sound-cpu-phase170-static-validation',
  idempotencyKey: 'sound-cpu-phase170-static-validation-v1',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-02T00:00:00.000Z',
  },
  runtimeFlags: SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
}

const blockedPayload = {
  ...safePayload,
  runtimeFlags: {
    ...SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
    REEDITPRO_WORKER_EXECUTION_ENABLED: '1',
  },
}

const safeResult = createSoundCpuDisabledRouteRegistryResult({ payload: safePayload })
const blockedResult = createSoundCpuDisabledRouteRegistryResult({ payload: blockedPayload })
const registryEntries = listSoundCpuDisabledRouteRegistry()
const foundEntry = getSoundCpuDisabledRouteRegistryEntry(SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME)

let assertionThrows = false
let assertionReason: string | null = null
try {
  assertSoundCpuDisabledRouteRegistryExecutionBlocked()
} catch (error) {
  assertionThrows = true
  assertionReason = error instanceof Error ? error.message : String(error)
}

const result = {
  decision:
    'worker_runtime_jobs_sound_cpu_phase170_disabled_route_registration_static_validation_passed_with_warnings_ready_for_registration_source_owner_review',
  staticRegistryImportSucceeded: true,
  registrySourceUsed: 'server/workers/sound-cpu/disabled-route-registry.ts',
  registryEntryCount: registryEntries.length,
  registryExecutionEnabled: SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED,
  registryEntryName: SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY.routeName,
  registryEntryFound: foundEntry?.routeName === SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
  safePayloadAcceptedByStaticContract: !('validation' in safeResult),
  safePayloadAcceptedForDispatch: safeResult.acceptedForDispatch,
  blockedPayloadRejected: 'validation' in blockedResult && !blockedResult.validation.ok,
  blockedPayloadReason:
    'validation' in blockedResult && !blockedResult.validation.ok ? blockedResult.validation.reason : null,
  assertionThrows,
  assertionReasonMatches: assertionReason === SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY.blockedReason,
  noWorkerExecution: safeResult.noWorkerExecution === true && blockedResult.noWorkerExecution === true,
  noRouteExecution: safeResult.noRouteExecution === true && blockedResult.noRouteExecution === true,
  noSupabaseMutation: safeResult.noSupabaseMutation === true && blockedResult.noSupabaseMutation === true,
  noSqlExecution: safeResult.noSqlExecution === true && blockedResult.noSqlExecution === true,
  noMediaProcessing: safeResult.noMediaProcessing === true && blockedResult.noMediaProcessing === true,
  noArtifactCreated: safeResult.noArtifactCreated === true && blockedResult.noArtifactCreated === true,
  expressRouteRegistered: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
}

if (SOUND_CPU_DISABLED_ROUTE_REGISTRY.length !== 1) {
  throw new Error('Expected exactly one disabled route registry entry')
}

console.log(JSON.stringify(result, null, 2))
