import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const PRIVATE_EMBEDDED_PROCESS_RESOURCE_OBSERVATION_WIRE_VERSION =
  'private-embedded-process-resource-observation-wire-v1' as const
export const PRIVATE_EMBEDDED_PROCESS_RESOURCE_OBSERVATION_VERSION =
  'private-embedded-process-resource-observation-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const identity = z.string().trim().min(1).max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const observationPointSchema = z.object({
  capturedAt: timestamp,
  cpuUsageNanoseconds: safeInteger,
  memoryCurrentBytes: safeInteger,
  memoryPeakBytes: safeInteger,
  gpuActiveMilliseconds: z.null(),
}).strict()

const wireSchema = z.object({
  schemaVersion: z.literal(PRIVATE_EMBEDDED_PROCESS_RESOURCE_OBSERVATION_WIRE_VERSION),
  observerKind: z.enum([
    'node_process_resource_usage_v1',
    'python_resource_getrusage_v1',
  ]),
  measurementAgentVersion: z.enum([
    'embedded_node_process_resource_observer_v1',
    'embedded_python_process_resource_observer_v1',
  ]),
  start: observationPointSchema,
  finish: observationPointSchema,
}).strict()

export const privateEmbeddedProcessResourceObservationSchema = z.object({
  schemaVersion: z.literal(PRIVATE_EMBEDDED_PROCESS_RESOURCE_OBSERVATION_VERSION),
  observerKind: wireSchema.shape.observerKind,
  measurementAgentVersion: identity,
  measurementAgentDigest: sha256,
  containerIdentityDigest: sha256,
  start: observationPointSchema,
  finish: observationPointSchema,
  observationHash: sha256,
}).strict().superRefine((value, context) => {
  const startedAt = Date.parse(value.start.capturedAt)
  const finishedAt = Date.parse(value.finish.capturedAt)
  const payload = withoutObservationHash(value)
  if (
    finishedAt <= startedAt
    || finishedAt - startedAt > 4 * 60 * 60 * 1_000
    || value.start.memoryPeakBytes < value.start.memoryCurrentBytes
    || value.finish.memoryPeakBytes < value.finish.memoryCurrentBytes
    || value.finish.memoryPeakBytes < value.start.memoryPeakBytes
    || value.finish.cpuUsageNanoseconds < value.start.cpuUsageNanoseconds
    || value.observationHash !== sha256AuthorityValue(payload)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Embedded process resource observation failed derived-integrity validation.',
    })
  }
})

export type PrivateEmbeddedProcessResourceObservation = z.infer<
  typeof privateEmbeddedProcessResourceObservationSchema
>

export function normalizePrivateEmbeddedProcessResourceObservation(input: {
  wireObservation: unknown
  measurementAgentDigest: string
  containerIdentityDigest: string
}): PrivateEmbeddedProcessResourceObservation {
  const wire = parse(
    wireSchema,
    input.wireObservation,
    'Embedded process resource observation wire payload is invalid.',
  )
  parse(sha256, input.measurementAgentDigest, 'Embedded measurement-agent digest is invalid.')
  parse(sha256, input.containerIdentityDigest, 'Embedded container identity digest is invalid.')
  const payload = {
    schemaVersion: PRIVATE_EMBEDDED_PROCESS_RESOURCE_OBSERVATION_VERSION,
    observerKind: wire.observerKind,
    measurementAgentVersion: wire.measurementAgentVersion,
    measurementAgentDigest: input.measurementAgentDigest,
    containerIdentityDigest: input.containerIdentityDigest,
    start: wire.start,
    finish: wire.finish,
  }
  return parse(privateEmbeddedProcessResourceObservationSchema, {
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  }, 'Embedded process resource observation is invalid.')
}

function withoutObservationHash(
  value: PrivateEmbeddedProcessResourceObservation,
): Omit<PrivateEmbeddedProcessResourceObservation, 'observationHash'> {
  const { observationHash, ...payload } = value
  void observationHash
  return payload
}

function parse<T>(
  schema: { parse: (value: unknown) => T },
  value: unknown,
  message: string,
): T {
  try {
    return schema.parse(value)
  } catch {
    throw new ApiError('VALIDATION_FAILED', message, 400, {
      requiredGate: 'private_embedded_process_resource_observation_integrity',
    })
  }
}
