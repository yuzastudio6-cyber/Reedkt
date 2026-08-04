import { randomBytes } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { normalizePrivateCgroupV2ResourceObservation } from '../private-cgroup-v2-resource-observation'
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
  return normalizePrivateCgroupV2ResourceObservation({
    ...input,
    magic: PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVATION_MAGIC,
    observerKind: 'media_container_cgroup_v2_v1',
    measurementAgentVersion: PRIVATE_MEDIA_CGROUP_RESOURCE_OBSERVER_VERSION,
    containerIdentityDomain: 'private_media_cgroup_container_identity_v1',
    requiredGate: 'private_media_cgroup_resource_observation_integrity',
  })
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

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_media_cgroup_resource_observation_integrity',
  })
}
