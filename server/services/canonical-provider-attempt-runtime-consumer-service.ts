import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  readCanonicalProviderAttemptRuntimeRecord,
  type CanonicalProviderAttemptRuntimeLocator,
  type CanonicalProviderAttemptRuntimeRead,
} from './canonical-provider-attempt-runtime-record-port'

export const CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_VERSION =
  'canonical-provider-attempt-runtime-consumer-v1' as const

export const CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_CLASSES = [
  'motion_studio_audio_provider_work',
  'motion_studio_visual_calibration_provider_work',
  'edit_reference_supported_downstream_provider_work',
] as const

export type CanonicalProviderAttemptRuntimeConsumerClass =
  typeof CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_CLASSES[number]

export interface CanonicalProviderAttemptAuthorizedConsumerScope {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

const audioOperationIds = new Set<CanonicalProviderAttemptRuntimeLocator['operationId']>([
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_ELEVENLABS_STORYTELLING_SPEECH_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
])

const supportedOperationIds = new Set<CanonicalProviderAttemptRuntimeLocator['operationId']>([
  ...audioOperationIds,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
])

/**
 * One server-only consumer boundary for the four admitted canonical media
 * provider operations. It deliberately does not represent Edit Reference
 * Study Chat/long-form Kimi, Qwen, DeepSeek, or Qwen2.5-VL attempts. Those
 * retain their existing pre-plan reasoning/checkback/cost authorities.
 */
export async function readCanonicalProviderAttemptForAuthorizedServerConsumer(
  input: {
    readonly context: Pick<
      ServiceContext,
      'env' | 'auth' | 'canonicalProviderAttemptRuntimeRecordSourcePort'
    >
    readonly consumerClass: CanonicalProviderAttemptRuntimeConsumerClass
    readonly authorizedScope: CanonicalProviderAttemptAuthorizedConsumerScope
    readonly locator: CanonicalProviderAttemptRuntimeLocator
    readonly projectedAt: string
  },
): Promise<CanonicalProviderAttemptRuntimeRead> {
  const auth = input.context.auth
  if (!auth?.userId || auth.userId !== input.locator.ownerUserId) {
    throw accessDenied('provider_attempt_consumer_actor_mismatch')
  }
  if (
    input.authorizedScope.workspaceId !== input.locator.workspaceId
    || input.authorizedScope.projectId !== input.locator.projectId
    || input.authorizedScope.editSessionId !== input.locator.editSessionId
  ) {
    throw accessDenied('provider_attempt_consumer_scope_mismatch')
  }
  assertConsumerOperation(input.consumerClass, input.locator.operationId)

  return readCanonicalProviderAttemptRuntimeRecord({
    hosted: isHostedRuntime(input.context.env),
    port: input.context.canonicalProviderAttemptRuntimeRecordSourcePort,
    locator: input.locator,
    projectedAt: input.projectedAt,
  })
}

function assertConsumerOperation(
  consumerClass: CanonicalProviderAttemptRuntimeConsumerClass,
  operationId: CanonicalProviderAttemptRuntimeLocator['operationId'],
): void {
  const accepted = consumerClass === 'motion_studio_audio_provider_work'
    ? audioOperationIds.has(operationId)
    : consumerClass === 'motion_studio_visual_calibration_provider_work'
      ? operationId === CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID
      : supportedOperationIds.has(operationId)
  if (!accepted) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'The canonical provider-attempt operation is not admitted for this consumer.',
      503,
      {
        reason: 'canonical_provider_attempt_consumer_operation_not_admitted',
        consumerClass,
        operationId,
        supportedMediaProviderOperationsOnly: true,
        editReferenceReasoningAuthoritySubstituted: false,
        productionReady: false,
      },
    )
  }
}

function isHostedRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv === 'production' || env.mode === 'cloud_run'
}

function accessDenied(reason: string): ApiError {
  return new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'The provider-attempt consumer scope is not authorized.',
    403,
    {
      reason,
      browserAuthorityAccepted: false,
      productionReady: false,
    },
  )
}
