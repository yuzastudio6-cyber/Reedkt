import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  normalizePrivateEmbeddedProcessResourceObservation,
  type PrivateEmbeddedProcessResourceObservation,
} from './private-embedded-process-resource-observation'

type CgroupObserverKind = Extract<
  PrivateEmbeddedProcessResourceObservation['observerKind'],
  'media_container_cgroup_v2_v1' | 'remotion_container_cgroup_v2_v1'
>

/**
 * Normalizes the fixed terminal marker emitted by an in-container cgroup-v2
 * observer. The caller still owns the exact executable allowlist and observer
 * identity; this shared parser only owns the counter/timestamp integrity rules.
 */
export function normalizePrivateCgroupV2ResourceObservation(input: {
  stderr: Buffer
  nonce: string
  containerId: string
  imageId: string
  measurementAgentDigest: string
  magic: string
  observerKind: CgroupObserverKind
  measurementAgentVersion: string
  containerIdentityDomain: string
  requiredGate: string
}): {
  sanitizedStderr: Buffer
  observation: PrivateEmbeddedProcessResourceObservation
} {
  if (
    !/^[a-f0-9]{48}$/u.test(input.nonce)
    || !/^[a-f0-9]{64}$/u.test(input.containerId)
    || !/^sha256:[a-f0-9]{64}$/u.test(input.imageId)
    || !/^[a-f0-9]{64}$/u.test(input.measurementAgentDigest)
    || !/^[A-Z0-9_]{8,120}$/u.test(input.magic)
    || !/^[a-z0-9_]{8,120}$/u.test(input.containerIdentityDomain)
    || !/^[a-z0-9_]{8,160}$/u.test(input.requiredGate)
  ) {
    throw invalid(input.requiredGate, 'Container cgroup observer identity is invalid.')
  }
  const prefix = Buffer.from(`${input.magic}\t${input.nonce}\t`, 'ascii')
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
    throw invalid(
      input.requiredGate,
      'Container cgroup observer terminal marker is missing or ambiguous.',
    )
  }
  const markerBytes = input.stderr.subarray(markerStart, markerEnd)
  if ([...markerBytes].some((value) =>
    value !== 0x09 && (value < 0x20 || value > 0x7e)
  )) {
    throw invalid(input.requiredGate, 'Container cgroup observer marker is not canonical ASCII.')
  }
  const fields = markerBytes.toString('ascii').split('\t')
  if (fields.length !== 10 || fields[0] !== input.magic || fields[1] !== input.nonce) {
    throw invalid(input.requiredGate, 'Container cgroup observer marker shape is invalid.')
  }
  const startedAtNanoseconds = decimalBigInt(fields[2], 'start timestamp', input.requiredGate)
  const finishedAtNanoseconds = decimalBigInt(fields[3], 'finish timestamp', input.requiredGate)
  const startCpuMicroseconds = decimalBigInt(fields[4], 'start CPU usage', input.requiredGate)
  const finishCpuMicroseconds = decimalBigInt(fields[5], 'finish CPU usage', input.requiredGate)
  const startMemoryCurrentBytes = safeInteger(fields[6], 'start current memory', input.requiredGate)
  const startMemoryPeakBytes = safeInteger(fields[7], 'start peak memory', input.requiredGate)
  const finishMemoryCurrentBytes = safeInteger(fields[8], 'finish current memory', input.requiredGate)
  const finishMemoryPeakBytes = safeInteger(fields[9], 'finish peak memory', input.requiredGate)
  if (
    finishedAtNanoseconds <= startedAtNanoseconds
    || finishCpuMicroseconds < startCpuMicroseconds
    || startMemoryPeakBytes < startMemoryCurrentBytes
    || finishMemoryPeakBytes < finishMemoryCurrentBytes
    || finishMemoryPeakBytes < startMemoryPeakBytes
  ) {
    throw invalid(input.requiredGate, 'Container cgroup observer counters failed monotonic validation.')
  }
  return {
    sanitizedStderr: Buffer.from(input.stderr.subarray(0, markerStart)),
    observation: normalizePrivateEmbeddedProcessResourceObservation({
      wireObservation: {
        schemaVersion: 'private-embedded-process-resource-observation-wire-v1',
        observerKind: input.observerKind,
        measurementAgentVersion: input.measurementAgentVersion,
        start: {
          capturedAt: timestampFromEpochNanoseconds(startedAtNanoseconds, input.requiredGate),
          cpuUsageNanoseconds: safeBigIntNumber(
            startCpuMicroseconds * 1_000n,
            'start CPU nanoseconds',
            input.requiredGate,
          ),
          memoryCurrentBytes: startMemoryCurrentBytes,
          memoryPeakBytes: startMemoryPeakBytes,
          gpuActiveMilliseconds: null,
        },
        finish: {
          capturedAt: timestampFromEpochNanoseconds(finishedAtNanoseconds, input.requiredGate),
          cpuUsageNanoseconds: safeBigIntNumber(
            finishCpuMicroseconds * 1_000n,
            'finish CPU nanoseconds',
            input.requiredGate,
          ),
          memoryCurrentBytes: finishMemoryCurrentBytes,
          memoryPeakBytes: finishMemoryPeakBytes,
          gpuActiveMilliseconds: null,
        },
      },
      measurementAgentDigest: input.measurementAgentDigest,
      containerIdentityDigest: sha256AuthorityValue({
        domain: input.containerIdentityDomain,
        containerId: input.containerId,
        imageId: input.imageId,
        observerNonce: input.nonce,
      }),
    }),
  }
}

function decimalBigInt(value: string | undefined, label: string, gate: string): bigint {
  if (!value || !/^(0|[1-9][0-9]*)$/u.test(value)) {
    throw invalid(gate, `Container cgroup observer ${label} is invalid.`)
  }
  try {
    return BigInt(value)
  } catch {
    throw invalid(gate, `Container cgroup observer ${label} is invalid.`)
  }
}

function safeInteger(value: string | undefined, label: string, gate: string): number {
  return safeBigIntNumber(decimalBigInt(value, label, gate), label, gate)
}

function safeBigIntNumber(value: bigint, label: string, gate: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw invalid(gate, `Container cgroup observer ${label} exceeds the exact integer bound.`)
  }
  return Number(value)
}

function timestampFromEpochNanoseconds(value: bigint, gate: string): string {
  const milliseconds = value / 1_000_000n
  if (milliseconds > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw invalid(gate, 'Container cgroup observer timestamp exceeds the exact date bound.')
  }
  try {
    return new Date(Number(milliseconds)).toISOString()
  } catch {
    throw invalid(gate, 'Container cgroup observer timestamp is invalid.')
  }
}

function invalid(gate: string, message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, { requiredGate: gate })
}
