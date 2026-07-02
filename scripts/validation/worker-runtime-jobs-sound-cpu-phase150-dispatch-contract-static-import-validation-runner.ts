import {
  SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
  buildDisabledSoundCpuDispatchEnvelope,
  validateSoundCpuDispatchContractPayload,
} from '../../server/workers/sound-cpu/dispatch-contract.ts'

const safePayload = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-phase150-static-import',
  workspaceId: 'workspace-phase150-static-import',
  projectId: 'project-phase150-static-import',
  jobId: 'job-phase150-static-import',
  idempotencyKey: 'phase150-static-import-proof',
  workerName: 'sound-cpu-analysis-worker',
  imageName: 'reeditpro/sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  attemptMetadata: {
    attemptNumber: 1,
    maxAttempts: 1,
    requestedAtIso: '2026-07-02T00:00:00.000Z',
  },
  privateManifestRef: 'private-manifest-ref-not-opened',
  runtimeFlags: SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
}

const unsafeRuntimeFlagPayload = {
  ...safePayload,
  runtimeFlags: {
    ...SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
    REEDITPRO_WORKER_EXECUTION_ENABLED: '1',
  },
}

const safeValidation = validateSoundCpuDispatchContractPayload(safePayload)
if (!safeValidation.ok) {
  throw new Error(`Expected safe payload validation to pass: ${safeValidation.reason}`)
}

const blockedValidation = validateSoundCpuDispatchContractPayload(unsafeRuntimeFlagPayload)
if (blockedValidation.ok) {
  throw new Error('Expected unsafe runtime flag payload to be rejected')
}

const envelope = buildDisabledSoundCpuDispatchEnvelope(safeValidation.payload)

const result = {
  ok: true,
  staticImportSucceeded: true,
  safePayloadAccepted: safeValidation.ok,
  blockedPayloadRejected: !blockedValidation.ok,
  blockedPayloadReason: blockedValidation.ok ? null : blockedValidation.reason,
  disabledEnvelopeBuilt: envelope.acceptedForDispatch === false,
  acceptedForDispatch: envelope.acceptedForDispatch,
  noWorkerExecution: envelope.noWorkerExecution,
  noRouteExecution: envelope.noRouteExecution,
  noSupabaseMutation: envelope.noSupabaseMutation,
  noSqlExecution: envelope.noSqlExecution,
  noMediaProcessing: envelope.noMediaProcessing,
  noArtifactCreated: envelope.noArtifactCreated,
  indexExportAdded: false,
  workerDispatchExecutionEnabled: false,
  routeExecutionEnabled: false,
  supabaseMutationEnabled: false,
}

console.log(JSON.stringify(result, null, 2))
