import { randomBytes } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import {
  normalizePrivateEmbeddedProcessResourceObservation,
  type PrivateEmbeddedProcessResourceObservation,
} from '../private-embedded-process-resource-observation'

export const PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVER_ENTRYPOINT =
  '/usr/local/bin/reeditpro-media-cgroup-resource-observer' as const
export const PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC =
  'REEDITPRO_MEDIA_CGROUP_RESOURCE_OBSERVATION_V1' as const
export const PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVER_VERSION =
  'embedded_media_cgroup_v2_observer_v1' as const
export const PRIVATE_MEDIA_CGROUP_RESOURCE_ATTEMPT_AGGREGATION_VERSION =
  'embedded_media_cgroup_v2_attempt_aggregate_v1' as const

export interface PrivateMediaCgroupResourceObserverInvocation {
  nonce: string
  command: string[]
}

export function createPrivateMediaCgroupResourceObserverInvocation(input: {
  innerEntrypoint: string
  innerCommand: readonly string[]
}): PrivateMediaCgroupResourceObserverInvocation {
  if (
    !input.innerEntrypoint.startsWith('/')
    || input.innerEntrypoint.includes('..')
    || input.innerCommand.some((value) => value.includes('\u0000'))
  ) {
    throw invalid('Media cgroup observer invocation is invalid.')
  }
  const nonce = randomBytes(24).toString('hex')
  return {
    nonce,
    command: [nonce, input.innerEntrypoint, ...input.innerCommand],
  }
}

export function normalizePrivateMediaCgroupResourceObservation(input: {
  stderr: Buffer
  nonce: string
  containerId: string
  imageId: string
  measurementAgentDigest: string
}): {
  sanitizedStderr: Buffer
  observation: PrivateEmbeddedProcessResourceObservation
} {
  if (
    !/^[a-f0-9]{48}$/u.test(input.nonce)
    || !/^[a-f0-9]{64}$/u.test(input.containerId)
    || !/^sha256:[a-f0-9]{64}$/u.test(input.imageId)
    || !/^[a-f0-9]{64}$/u.test(input.measurementAgentDigest)
  ) {
    throw invalid('Media cgroup observer identity is invalid.')
  }
  const prefix = Buffer.from(
    `${PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC}\t${input.nonce}\t`,
    'ascii',
  )
  const markerStart = input.stderr.indexOf(prefix)
  const duplicateMarkerStart = markerStart < 0
    ? -1
    : input.stderr.indexOf(prefix, markerStart + prefix.byteLength)
  const markerEnd = markerStart < 0 ? -1 : input.stderr.indexOf(0x0a, markerStart)
  if (
    markerStart < 0
    || duplicateMarkerStart >= 0
    || markerEnd !== input.stderr.byteLength - 1
    || (markerStart > 0 && input.stderr[markerStart - 1] !== 0x0a)
  ) {
    throw invalid('Media cgroup observer terminal marker is missing or ambiguous.')
  }
  const markerBytes = input.stderr.subarray(markerStart, markerEnd)
  if ([...markerBytes].some((value) =>
    value !== 0x09 && (value < 0x20 || value > 0x7e)
  )) {
    throw invalid('Media cgroup observer marker is not canonical ASCII.')
  }
  const fields = markerBytes.toString('ascii').split('\t')
  if (
    fields.length !== 10
    || fields[0] !== PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC
    || fields[1] !== input.nonce
  ) {
    throw invalid('Media cgroup observer marker shape is invalid.')
  }
  const startedAtNanoseconds = decimalBigInt(fields[2], 'start timestamp')
  const finishedAtNanoseconds = decimalBigInt(fields[3], 'finish timestamp')
  const startCpuMicroseconds = decimalBigInt(fields[4], 'start CPU usage')
  const finishCpuMicroseconds = decimalBigInt(fields[5], 'finish CPU usage')
  const startMemoryCurrentBytes = safeInteger(fields[6], 'start current memory')
  const startMemoryPeakBytes = safeInteger(fields[7], 'start peak memory')
  const finishMemoryCurrentBytes = safeInteger(fields[8], 'finish current memory')
  const finishMemoryPeakBytes = safeInteger(fields[9], 'finish peak memory')
  if (
    finishedAtNanoseconds <= startedAtNanoseconds
    || finishCpuMicroseconds < startCpuMicroseconds
    || startMemoryPeakBytes < startMemoryCurrentBytes
    || finishMemoryPeakBytes < finishMemoryCurrentBytes
    || finishMemoryPeakBytes < startMemoryPeakBytes
  ) {
    throw invalid('Media cgroup observer counters failed monotonic validation.')
  }
  const wireObservation = {
    schemaVersion: 'private-embedded-process-resource-observation-wire-v1' as const,
    observerKind: 'media_container_cgroup_v2_v1' as const,
    measurementAgentVersion: PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVER_VERSION,
    start: {
      capturedAt: timestampFromEpochNanoseconds(startedAtNanoseconds),
      cpuUsageNanoseconds: safeBigIntNumber(
        startCpuMicroseconds * 1_000n,
        'start CPU nanoseconds',
      ),
      memoryCurrentBytes: startMemoryCurrentBytes,
      memoryPeakBytes: startMemoryPeakBytes,
      gpuActiveMilliseconds: null,
    },
    finish: {
      capturedAt: timestampFromEpochNanoseconds(finishedAtNanoseconds),
      cpuUsageNanoseconds: safeBigIntNumber(
        finishCpuMicroseconds * 1_000n,
        'finish CPU nanoseconds',
      ),
      memoryCurrentBytes: finishMemoryCurrentBytes,
      memoryPeakBytes: finishMemoryPeakBytes,
      gpuActiveMilliseconds: null,
    },
  }
  return {
    sanitizedStderr: Buffer.from(input.stderr.subarray(0, markerStart)),
    observation: normalizePrivateEmbeddedProcessResourceObservation({
      wireObservation,
      measurementAgentDigest: input.measurementAgentDigest,
      containerIdentityDigest: sha256AuthorityValue({
        domain: 'private_media_cgroup_container_identity_v1',
        containerId: input.containerId,
        imageId: input.imageId,
        observerNonce: input.nonce,
      }),
    }),
  }
}

export function aggregatePrivateMediaCgroupResourceObservations(input: {
  observations: readonly PrivateEmbeddedProcessResourceObservation[]
  measurementAgentDigest: string
}): PrivateEmbeddedProcessResourceObservation {
  if (
    input.observations.length < 1
    || input.observations.length > 8
    || !/^[a-f0-9]{64}$/u.test(input.measurementAgentDigest)
    || input.observations.some((observation) =>
      observation.observerKind !== 'media_container_cgroup_v2_v1'
      || observation.measurementAgentDigest !== input.measurementAgentDigest
    )
  ) {
    throw invalid('Media cgroup attempt observations are incomplete or inconsistent.')
  }
  const observations = [...input.observations].sort((left, right) =>
    Date.parse(left.start.capturedAt) - Date.parse(right.start.capturedAt)
  )
  for (let index = 1; index < observations.length; index += 1) {
    if (
      Date.parse(observations[index]!.start.capturedAt)
      < Date.parse(observations[index - 1]!.finish.capturedAt)
    ) {
      throw invalid('Media cgroup attempt observations overlap unexpectedly.')
    }
  }
  const first = observations[0]!
  const last = observations[observations.length - 1]!
  const totalCpuNanoseconds = observations.reduce(
    (total, observation) => total + (
      observation.finish.cpuUsageNanoseconds
      - observation.start.cpuUsageNanoseconds
    ),
    0,
  )
  if (!Number.isSafeInteger(totalCpuNanoseconds)) {
    throw invalid('Media cgroup attempt CPU aggregate exceeds the exact integer bound.')
  }
  const maximumMemoryPeakBytes = Math.max(...observations.flatMap((observation) => [
    observation.start.memoryPeakBytes,
    observation.finish.memoryPeakBytes,
    observation.finish.memoryCurrentBytes,
  ]))
  const aggregateMeasurementAgentDigest = sha256AuthorityValue({
    domain: 'private_media_cgroup_attempt_aggregation_agent_v1',
    componentMeasurementAgentDigest: input.measurementAgentDigest,
    policy: {
      ordering: 'captured_at_ascending_no_overlap',
      cpu: 'sum_component_cgroup_usage_deltas',
      memory: 'maximum_component_cgroup_peak',
      wallTime: 'earliest_component_start_to_latest_component_finish',
      maximumComponents: 8,
    },
  })
  return normalizePrivateEmbeddedProcessResourceObservation({
    wireObservation: {
      schemaVersion: 'private-embedded-process-resource-observation-wire-v1',
      observerKind: 'media_container_cgroup_v2_attempt_aggregate_v1',
      measurementAgentVersion:
        PRIVATE_MEDIA_CGROUP_RESOURCE_ATTEMPT_AGGREGATION_VERSION,
      start: {
        capturedAt: first.start.capturedAt,
        cpuUsageNanoseconds: 0,
        memoryCurrentBytes: first.start.memoryCurrentBytes,
        memoryPeakBytes: first.start.memoryPeakBytes,
        gpuActiveMilliseconds: null,
      },
      finish: {
        capturedAt: last.finish.capturedAt,
        cpuUsageNanoseconds: totalCpuNanoseconds,
        memoryCurrentBytes: last.finish.memoryCurrentBytes,
        memoryPeakBytes: maximumMemoryPeakBytes,
        gpuActiveMilliseconds: null,
      },
    },
    measurementAgentDigest: aggregateMeasurementAgentDigest,
    containerIdentityDigest: sha256AuthorityValue({
      domain: 'private_media_cgroup_attempt_container_set_v1',
      components: observations.map((observation) => ({
        containerIdentityDigest: observation.containerIdentityDigest,
        observationHash: observation.observationHash,
      })),
    }),
  })
}

function decimalBigInt(value: string | undefined, label: string): bigint {
  if (!value || !/^(0|[1-9][0-9]*)$/u.test(value)) {
    throw invalid(`Media cgroup observer ${label} is invalid.`)
  }
  try {
    return BigInt(value)
  } catch {
    throw invalid(`Media cgroup observer ${label} is invalid.`)
  }
}

function safeInteger(value: string | undefined, label: string): number {
  return safeBigIntNumber(decimalBigInt(value, label), label)
}

function safeBigIntNumber(value: bigint, label: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw invalid(`Media cgroup observer ${label} exceeds the exact integer bound.`)
  }
  return Number(value)
}

function timestampFromEpochNanoseconds(value: bigint): string {
  const milliseconds = value / 1_000_000n
  if (milliseconds > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw invalid('Media cgroup observer timestamp exceeds the exact date bound.')
  }
  try {
    return new Date(Number(milliseconds)).toISOString()
  } catch {
    throw invalid('Media cgroup observer timestamp is invalid.')
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_media_cgroup_resource_observation_integrity',
  })
}
