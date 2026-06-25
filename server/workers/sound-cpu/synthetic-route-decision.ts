import {
  SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS,
  SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS,
  type SoundCpuSyntheticJobType,
  type SoundCpuSyntheticRouteContract,
  type SoundCpuSyntheticRouteDecision,
  type SoundCpuSyntheticRoutePayload,
  type SoundCpuSyntheticRouteResult,
} from './synthetic-route-types'

export const SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS: readonly SoundCpuSyntheticRouteContract[] = [
  {
    jobType: 'sound.package_import_smoke',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixtureDescriptor: 'package-import-smoke-no-media',
    decisionMode: 'synthetic_package_import_route_only',
  },
  {
    jobType: 'sound.numeric_array_analysis',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixtureDescriptor: 'numeric-array-analysis-no-media',
    decisionMode: 'synthetic_numeric_array_route_only',
  },
  {
    jobType: 'sound.symbolic_midi_analysis',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    syntheticFixtureDescriptor: 'symbolic-midi-in-memory-no-file',
    decisionMode: 'synthetic_symbolic_midi_route_only',
  },
  {
    jobType: 'sound.loudness_synthetic_analysis',
    workerName: 'sound-audio-metadata-worker',
    imageName: 'reeditpro/sound-audio-metadata-worker',
    syntheticFixtureDescriptor: 'loudness-synthetic-array-no-media',
    decisionMode: 'synthetic_loudness_route_only',
  },
]

const REQUIRED_STRING_FIELDS = [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'syntheticFixtureDescriptor',
] as const

type SyntheticRouteInput = Record<string, unknown>

export function resolveSoundCpuSyntheticRoute(payload: unknown): SoundCpuSyntheticRouteResult {
  if (!isRecord(payload)) {
    return { accepted: false, reason: 'payload_not_record' }
  }

  for (const field of SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      return { accepted: false, reason: 'rejected_payload_field', field }
    }
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) {
      return { accepted: false, reason: 'missing_required_field', field }
    }
    if (typeof payload[field] !== 'string' || payload[field].trim().length === 0) {
      return { accepted: false, reason: 'invalid_required_field', field }
    }
  }

  if (!isAttemptMetadata(payload.attemptMetadata)) {
    return { accepted: false, reason: 'invalid_required_field', field: 'attemptMetadata' }
  }

  const runtimeFlagCheck = validateStaticOnlyRuntimeFlags(payload.staticOnlyRuntimeFlags)
  if (!runtimeFlagCheck.accepted) return runtimeFlagCheck

  const contract = contractForJobType(payload.jobType)
  if (!contract) {
    return { accepted: false, reason: 'unknown_job_type', field: 'jobType', received: String(payload.jobType) }
  }

  if (payload.workerName !== contract.workerName) {
    return {
      accepted: false,
      reason: 'worker_mismatch',
      field: 'workerName',
      expected: contract.workerName,
      received: String(payload.workerName),
    }
  }

  if (payload.imageName !== contract.imageName) {
    return {
      accepted: false,
      reason: 'image_mismatch',
      field: 'imageName',
      expected: contract.imageName,
      received: String(payload.imageName),
    }
  }

  if (payload.syntheticFixtureDescriptor !== contract.syntheticFixtureDescriptor) {
    return {
      accepted: false,
      reason: 'fixture_mismatch',
      field: 'syntheticFixtureDescriptor',
      expected: contract.syntheticFixtureDescriptor,
      received: String(payload.syntheticFixtureDescriptor),
    }
  }

  return {
    accepted: true,
    jobType: contract.jobType,
    workerName: contract.workerName,
    imageName: contract.imageName,
    syntheticFixtureDescriptor: contract.syntheticFixtureDescriptor,
    decisionMode: contract.decisionMode,
  }
}

export function assertSoundCpuSyntheticRouteAccepted(payload: SoundCpuSyntheticRoutePayload): SoundCpuSyntheticRouteDecision {
  const result = resolveSoundCpuSyntheticRoute(payload)
  if (!result.accepted) {
    throw new Error(`SOUND CPU synthetic route payload rejected: ${result.reason}${result.field ? `:${result.field}` : ''}`)
  }
  return result
}

export function contractForJobType(jobType: unknown): SoundCpuSyntheticRouteContract | undefined {
  if (typeof jobType !== 'string') return undefined
  return SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS.find((contract) => contract.jobType === (jobType as SoundCpuSyntheticJobType))
}

function validateStaticOnlyRuntimeFlags(value: unknown): SoundCpuSyntheticRouteResult {
  if (!isRecord(value)) {
    return { accepted: false, reason: 'invalid_runtime_flags', field: 'staticOnlyRuntimeFlags' }
  }

  for (const [flag, expected] of Object.entries(SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS)) {
    if (!Object.prototype.hasOwnProperty.call(value, flag)) {
      return { accepted: false, reason: 'invalid_runtime_flags', field: flag }
    }
    if (value[flag] !== expected) {
      return { accepted: false, reason: 'unsafe_runtime_flag', field: flag, received: String(value[flag]) }
    }
  }

  return {
    accepted: true,
    jobType: 'sound.package_import_smoke',
    workerName: 'sound-cpu-analysis-worker',
    imageName: 'reeditpro/sound-cpu-analysis-worker',
    syntheticFixtureDescriptor: 'package-import-smoke-no-media',
    decisionMode: 'runtime_flags_static_only_validation',
  }
}

function isAttemptMetadata(value: unknown): value is SyntheticRouteInput {
  return isRecord(value) && typeof value.attempt === 'number' && Number.isInteger(value.attempt) && typeof value.source === 'string'
}

function isRecord(value: unknown): value is SyntheticRouteInput {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
