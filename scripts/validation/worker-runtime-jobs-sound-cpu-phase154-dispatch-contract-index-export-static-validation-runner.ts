import {
  SOUND_CPU_DISPATCH_ALLOWED_IMAGES,
  SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES,
  SOUND_CPU_DISPATCH_ALLOWED_WORKERS,
  SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS,
  buildDisabledSoundCpuDispatchEnvelope,
  validateSoundCpuDispatchContractPayload,
} from '../../server/workers/sound-cpu/index.ts'

const safePayload = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-phase154-static-only',
  workspaceId: 'workspace-phase154-static-only',
  projectId: 'project-phase154-static-only',
  jobId: 'sound-cpu-phase154-static-validation',
  idempotencyKey: 'sound-cpu-phase154-static-validation-v1',
  workerName: SOUND_CPU_DISPATCH_ALLOWED_WORKERS[0],
  imageName: SOUND_CPU_DISPATCH_ALLOWED_IMAGES[0],
  jobType: SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES[0],
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

const safeValidation = validateSoundCpuDispatchContractPayload(safePayload)
const blockedValidation = validateSoundCpuDispatchContractPayload(blockedPayload)
const envelope = safeValidation.ok ? buildDisabledSoundCpuDispatchEnvelope(safeValidation.payload) : undefined

const result = {
  decision:
    'worker_runtime_jobs_sound_cpu_phase154_dispatch_contract_index_export_static_validation_passed_with_warnings_ready_for_index_export_owner_validation_review',
  staticIndexImportSucceeded: true,
  indexExportsUsed: [
    'SOUND_CPU_DISPATCH_ALLOWED_IMAGES',
    'SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES',
    'SOUND_CPU_DISPATCH_ALLOWED_WORKERS',
    'SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS',
    'buildDisabledSoundCpuDispatchEnvelope',
    'validateSoundCpuDispatchContractPayload',
  ],
  safePayloadAccepted: safeValidation.ok,
  blockedPayloadRejected: !blockedValidation.ok,
  blockedPayloadReason: blockedValidation.ok ? null : blockedValidation.reason,
  disabledEnvelopeBuilt: envelope?.blockedReason === 'worker_dispatch_execution_not_enabled',
  acceptedForDispatch: envelope?.acceptedForDispatch ?? true,
  noWorkerExecution: envelope?.noWorkerExecution === true,
  noRouteExecution: envelope?.noRouteExecution === true,
  noSupabaseMutation: envelope?.noSupabaseMutation === true,
  noSqlExecution: envelope?.noSqlExecution === true,
  noMediaProcessing: envelope?.noMediaProcessing === true,
  noArtifactCreated: envelope?.noArtifactCreated === true,
}

console.log(JSON.stringify(result, null, 2))
