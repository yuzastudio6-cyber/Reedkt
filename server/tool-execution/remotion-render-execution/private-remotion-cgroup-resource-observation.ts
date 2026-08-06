import { randomBytes } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { normalizePrivateCgroupV2ResourceObservation } from '../private-cgroup-v2-resource-observation'
import type { PrivateEmbeddedProcessResourceObservation } from '../private-embedded-process-resource-observation'

export const PRIVATE_REMOTION_CGROUP_RESOURCE_OBSERVER_ENTRYPOINT =
  '/usr/local/bin/reeditpro-remotion-cgroup-resource-observer' as const
export const PRIVATE_REMOTION_CGROUP_RESOURCE_OBSERVATION_MAGIC =
  'REEDITPRO_REMOTION_CGROUP_RESOURCE_OBSERVATION_V1' as const
export const PRIVATE_REMOTION_CGROUP_RESOURCE_OBSERVER_VERSION =
  'embedded_remotion_cgroup_v2_observer_v1' as const
export const PRIVATE_REMOTION_NODE_ENTRYPOINT = '/usr/local/bin/node' as const
export const PRIVATE_REMOTION_RUNNER_PATH = '/app/runner.mjs' as const

export function createPrivateRemotionCgroupResourceObserverInvocation(): {
  nonce: string
  command: readonly [string, typeof PRIVATE_REMOTION_NODE_ENTRYPOINT,
    typeof PRIVATE_REMOTION_RUNNER_PATH]
} {
  if (arguments.length !== 0) {
    throw invalid('Remotion cgroup observer accepts no caller-selected invocation.')
  }
  const nonce = randomBytes(24).toString('hex')
  return {
    nonce,
    command: [nonce, PRIVATE_REMOTION_NODE_ENTRYPOINT, PRIVATE_REMOTION_RUNNER_PATH],
  }
}

export function normalizePrivateRemotionCgroupResourceObservation(input: {
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
    magic: PRIVATE_REMOTION_CGROUP_RESOURCE_OBSERVATION_MAGIC,
    observerKind: 'remotion_container_cgroup_v2_v1',
    measurementAgentVersion: PRIVATE_REMOTION_CGROUP_RESOURCE_OBSERVER_VERSION,
    containerIdentityDomain: 'private_remotion_cgroup_container_identity_v1',
    requiredGate: 'private_remotion_cgroup_resource_observation_integrity',
  })
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_remotion_cgroup_resource_observation_integrity',
  })
}
