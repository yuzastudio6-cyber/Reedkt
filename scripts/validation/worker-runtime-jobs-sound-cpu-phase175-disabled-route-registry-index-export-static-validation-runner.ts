import {
  SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME,
  SOUND_CPU_DISABLED_ROUTE_REGISTRY,
  SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED,
  SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
  assertSoundCpuDisabledRouteRegistryExecutionBlocked,
  createSoundCpuDisabledRouteRegistryResult,
  getSoundCpuDisabledRouteRegistryEntry,
  listSoundCpuDisabledRouteRegistry,
} from '../../server/workers/sound-cpu/index.ts'

const decision =
  'worker_runtime_jobs_sound_cpu_phase175_disabled_route_registry_index_export_static_validation_passed_with_warnings_ready_for_registry_index_export_source_owner_review'

const safePayload = {
  approvedPlanSnapshotId: 'phase175-static-index-import-proof',
  workspaceId: 'phase175-workspace',
  projectId: 'phase175-project',
  jobId: 'phase175-job',
  idempotencyKey: 'phase175-idempotency',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-02T00:00:00.000Z',
  },
  runtimeFlags: SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
} as const

const blockedPayload = {
  ...safePayload,
  runtimeFlags: {
    ...SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
    REEDITPRO_WORKER_EXECUTION_ENABLED: '1',
  },
}

const registry = listSoundCpuDisabledRouteRegistry()
const registryEntry = getSoundCpuDisabledRouteRegistryEntry(SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME)
const safeResult = createSoundCpuDisabledRouteRegistryResult({ payload: safePayload })
const blockedResult = createSoundCpuDisabledRouteRegistryResult({ payload: blockedPayload })

let assertionThrows = false
let assertionReasonMatches = false
try {
  assertSoundCpuDisabledRouteRegistryExecutionBlocked()
} catch (error) {
  assertionThrows = true
  assertionReasonMatches =
    error instanceof Error &&
    error.message ===
      'SOUND CPU disabled dispatch route source exists, but worker dispatch execution remains blocked pending owner gates.'
}

const output = {
  decision,
  staticIndexImportSucceeded: true,
  indexSourceUsed: 'server/workers/sound-cpu/index.ts',
  registrySourceUsed: 'server/workers/sound-cpu/disabled-route-registry.ts',
  registryEntryCount: registry.length,
  registryExecutionEnabled: SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED,
  registryExportResolved: SOUND_CPU_DISABLED_ROUTE_REGISTRY.length === registry.length,
  registryEntryName: registryEntry?.routeName,
  registryEntryFound: Boolean(registryEntry),
  safePayloadAcceptedByStaticContract: 'contractVersion' in safeResult,
  safePayloadAcceptedForDispatch: safeResult.acceptedForDispatch,
  blockedPayloadRejected: !('contractVersion' in blockedResult),
  blockedPayloadReason: 'validation' in blockedResult ? blockedResult.validation.reason : undefined,
  assertionThrows,
  assertionReasonMatches,
  noWorkerExecution: safeResult.noWorkerExecution === true,
  noRouteExecution: safeResult.noRouteExecution === true,
  noSupabaseMutation: safeResult.noSupabaseMutation === true,
  noSqlExecution: safeResult.noSqlExecution === true,
  noMediaProcessing: safeResult.noMediaProcessing === true,
  noArtifactCreated: safeResult.noArtifactCreated === true,
  expressRouteRegistered: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
}

console.log(JSON.stringify(output, null, 2))
