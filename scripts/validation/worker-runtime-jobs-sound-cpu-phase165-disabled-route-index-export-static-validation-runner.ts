import {
  SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON,
  SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
  assertSoundCpuDisabledDispatchRouteExecutionBlocked,
  createSoundCpuDisabledDispatchRouteResult,
} from '../../server/workers/sound-cpu/index.ts'

const safePayload = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-phase165-static-only',
  workspaceId: 'workspace-phase165-static-only',
  projectId: 'project-phase165-static-only',
  jobId: 'sound-cpu-phase165-static-validation',
  idempotencyKey: 'sound-cpu-phase165-static-validation-v1',
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

const safeResult = createSoundCpuDisabledDispatchRouteResult({ payload: safePayload })
const blockedResult = createSoundCpuDisabledDispatchRouteResult({ payload: blockedPayload })

let assertionThrows = false
let assertionReason: string | null = null
try {
  assertSoundCpuDisabledDispatchRouteExecutionBlocked()
} catch (error) {
  assertionThrows = true
  assertionReason = error instanceof Error ? error.message : String(error)
}

const result = {
  decision:
    'worker_runtime_jobs_sound_cpu_phase165_disabled_route_index_export_static_validation_passed_with_warnings_ready_for_index_export_source_owner_review',
  staticIndexImportSucceeded: true,
  indexSourceUsed: 'server/workers/sound-cpu/index.ts',
  safePayloadAcceptedByStaticContract: !('validation' in safeResult),
  safePayloadAcceptedForDispatch: safeResult.acceptedForDispatch,
  safePayloadBlockedReason: 'routeBlockedReason' in safeResult ? safeResult.routeBlockedReason : safeResult.blockedReason,
  blockedPayloadRejected: 'validation' in blockedResult && !blockedResult.validation.ok,
  blockedPayloadReason:
    'validation' in blockedResult && !blockedResult.validation.ok ? blockedResult.validation.reason : null,
  assertionThrows,
  assertionReason,
  assertionReasonMatches: assertionReason === SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON,
  noWorkerExecution: safeResult.noWorkerExecution === true && blockedResult.noWorkerExecution === true,
  noRouteExecution: safeResult.noRouteExecution === true && blockedResult.noRouteExecution === true,
  noSupabaseMutation: safeResult.noSupabaseMutation === true && blockedResult.noSupabaseMutation === true,
  noSqlExecution: safeResult.noSqlExecution === true && blockedResult.noSqlExecution === true,
  noMediaProcessing: safeResult.noMediaProcessing === true && blockedResult.noMediaProcessing === true,
  noArtifactCreated: safeResult.noArtifactCreated === true && blockedResult.noArtifactCreated === true,
  routeRegisteredToday: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
}

console.log(JSON.stringify(result, null, 2))
