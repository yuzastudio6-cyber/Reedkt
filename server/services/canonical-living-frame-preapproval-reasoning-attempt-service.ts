import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches,
  canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema,
  createCanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator,
} from '../living-frame/canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  canonicalLivingFramePreapprovalReasoningRunLocatorSchema,
  type CanonicalLivingFramePreapprovalReasoningRun,
} from '../living-frame/canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository,
  type CanonicalLivingFramePreapprovalReasoningAttemptPersistenceResult,
  type CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope,
} from '../living-frame/private-canonical-living-frame-preapproval-reasoning-attempt-repository'
import {
  PrivateCanonicalLivingFramePreapprovalReasoningRepository,
  type CanonicalLivingFramePreapprovalReasoningRepositoryScope,
} from '../living-frame/private-canonical-living-frame-preapproval-reasoning-repository'
import {
  type PrivateCanonicalPreapprovalRouteDataAssuranceRepository,
  type CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
} from '../model-data-assurance/private-canonical-preapproval-route-data-assurance-repository'
import {
  type PrivateCanonicalSourceSpeechEvidenceRepository,
  type CanonicalSourceSpeechEvidenceRepositoryScope,
} from '../source-speech-evidence/private-canonical-source-speech-evidence-repository'
import type { ServiceContext } from '../types'
import type {
  CanonicalLivingFramePreapprovalInputReaderPort,
} from './canonical-living-frame-preapproval-input-authority-service'
import type {
  CanonicalLivingFramePlanningEvidenceReaderPort,
} from './canonical-living-frame-planning-evidence-service'
import {
  bindCanonicalLivingFrameSemanticReasoningAdmission,
  canonicalLivingFrameSemanticAdmissionRequestSchema,
} from './canonical-living-frame-semantic-reasoning-admission-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_REQUEST_VERSION = (
  'canonical-living-frame-preapproval-reasoning-attempt-reserve-request-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_RESULT_VERSION = (
  'canonical-living-frame-preapproval-reasoning-attempt-reserve-result-v1'
) as const

export const canonicalLivingFramePreapprovalReasoningAttemptReserveRequestSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_REQUEST_VERSION,
    ),
    purpose: z.literal(
      'reserve_current_living_frame_reasoning_attempt_without_transport',
    ),
    preparedRunLocator:
      canonicalLivingFramePreapprovalReasoningRunLocatorSchema,
    semanticAdmissionRequest:
      canonicalLivingFrameSemanticAdmissionRequestSchema,
  }).strict()

export type CanonicalLivingFramePreapprovalReasoningAttemptReserveRequest =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningAttemptReserveRequestSchema
  >

export interface CanonicalLivingFramePreapprovalReasoningAttemptReserveResult {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_RESULT_VERSION
  readonly sourceAuthority:
    'canonical_living_frame_preapproval_reasoning_attempt_service'
  readonly evidenceClass:
    'private_restart_safe_reasoning_attempt_reservation'
  readonly preparedRun:
    CanonicalLivingFramePreapprovalReasoningRun
  readonly reservation:
    CanonicalLivingFramePreapprovalReasoningAttemptReservation
  readonly locator:
    CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator
  readonly persistence:
    CanonicalLivingFramePreapprovalReasoningAttemptPersistenceResult
  readonly currentSemanticAdmissionRebuiltByServer: true
  readonly preparedRunReReadByServer: true
  readonly reservationReReadByServer: true
  readonly attemptReservationCreated: true
  readonly providerRequestCreated: false
  readonly providerSubmissionAuthorityIssued: false
  readonly providerTransportAuthorized: false
  readonly providerCallMade: false
  readonly credentialReadMade: false
  readonly providerObservationCreated: false
  readonly providerCheckbackScheduled: false
  readonly fallbackAuthorized: false
  readonly providerAttemptCostCreated: false
  readonly reasoningResultCreated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly creditReservationCreated: false
  readonly remoteMutationMade: false
  readonly productionReady: false
}

export interface ReserveCanonicalLivingFramePreapprovalReasoningAttemptInput {
  readonly context: ServiceContext
  readonly request: unknown
  readonly inputReader:
    | CanonicalLivingFramePreapprovalInputReaderPort
    | null
    | undefined
  readonly planningEvidenceReader:
    | CanonicalLivingFramePlanningEvidenceReaderPort
    | null
    | undefined
  readonly sourceSpeechRepositoryScope:
    CanonicalSourceSpeechEvidenceRepositoryScope
  readonly routeDataAssuranceRepositoryScope:
    CanonicalPreapprovalRouteDataAssuranceRepositoryScope
  readonly reasoningRepositoryScope:
    CanonicalLivingFramePreapprovalReasoningRepositoryScope
  readonly attemptRepositoryScope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope
  readonly sourceSpeechRepository?:
    PrivateCanonicalSourceSpeechEvidenceRepository
  readonly routeDataAssuranceRepository?:
    PrivateCanonicalPreapprovalRouteDataAssuranceRepository
  readonly reasoningRepository?:
    PrivateCanonicalLivingFramePreapprovalReasoningRepository
  readonly attemptRepository?:
    PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository
}

export async function reserveCanonicalLivingFramePreapprovalReasoningAttempt(
  input:
    ReserveCanonicalLivingFramePreapprovalReasoningAttemptInput,
): Promise<
  CanonicalLivingFramePreapprovalReasoningAttemptReserveResult
> {
  const parsedRequest =
    canonicalLivingFramePreapprovalReasoningAttemptReserveRequestSchema
      .safeParse(input.request)
  if (!parsedRequest.success) {
    throw validation(
      'canonical_living_frame_preapproval_attempt_reserve_request_invalid',
    )
  }
  const request = parsedRequest.data
  const workspaceId =
    request.semanticAdmissionRequest.preapprovalInputRequest.workspaceId
  assertPrivateRepositoryScopes({
    context: input.context,
    workspaceId,
    sourceSpeechRepositoryScope:
      input.sourceSpeechRepositoryScope,
    routeDataAssuranceRepositoryScope:
      input.routeDataAssuranceRepositoryScope,
    reasoningRepositoryScope: input.reasoningRepositoryScope,
    attemptRepositoryScope: input.attemptRepositoryScope,
  })
  const reasoningRepository =
    input.reasoningRepository
    ?? new PrivateCanonicalLivingFramePreapprovalReasoningRepository()
  const attemptRepository =
    input.attemptRepository
    ?? new PrivateCanonicalLivingFramePreapprovalReasoningAttemptRepository()
  const preparedRunBefore =
    await reasoningRepository.readByServerOwnedLocator({
      scope: input.reasoningRepositoryScope,
      locator: request.preparedRunLocator,
    })
  const semanticAdmissionBefore =
    await bindCanonicalLivingFrameSemanticReasoningAdmission({
      context: input.context,
      request: request.semanticAdmissionRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
      sourceSpeechRepositoryScope:
        input.sourceSpeechRepositoryScope,
      routeDataAssuranceRepositoryScope:
        input.routeDataAssuranceRepositoryScope,
      sourceSpeechRepository: input.sourceSpeechRepository,
      routeDataAssuranceRepository:
        input.routeDataAssuranceRepository,
    })
  const reservation =
    createCanonicalLivingFramePreapprovalReasoningAttemptReservation({
      preparedRun: preparedRunBefore,
      currentSemanticAdmission: semanticAdmissionBefore,
    })
  const persistence = await attemptRepository.save({
    scope: input.attemptRepositoryScope,
    reservation,
  })
  const firstReservationReread =
    await attemptRepository.readByServerOwnedLocator({
      scope: input.attemptRepositoryScope,
      locator: persistence.locator,
    })
  const secondReservationReread =
    await attemptRepository.readByServerOwnedLocator({
      scope: input.attemptRepositoryScope,
      locator: persistence.locator,
    })
  const preparedRunAfter =
    await reasoningRepository.readByServerOwnedLocator({
      scope: input.reasoningRepositoryScope,
      locator: request.preparedRunLocator,
    })
  const semanticAdmissionAfter =
    await bindCanonicalLivingFrameSemanticReasoningAdmission({
      context: input.context,
      request: request.semanticAdmissionRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
      sourceSpeechRepositoryScope:
        input.sourceSpeechRepositoryScope,
      routeDataAssuranceRepositoryScope:
        input.routeDataAssuranceRepositoryScope,
      sourceSpeechRepository: input.sourceSpeechRepository,
      routeDataAssuranceRepository:
        input.routeDataAssuranceRepository,
    })
  if (
    preparedRunBefore.recordDigestSha256 !==
      preparedRunAfter.recordDigestSha256
    || sha256AuthorityValue(preparedRunBefore) !==
      sha256AuthorityValue(preparedRunAfter)
    || semanticAdmissionBefore.contractDigestSha256 !==
      semanticAdmissionAfter.contractDigestSha256
    || sha256AuthorityValue(semanticAdmissionBefore) !==
      sha256AuthorityValue(semanticAdmissionAfter)
    || firstReservationReread.recordDigestSha256 !==
      reservation.recordDigestSha256
    || secondReservationReread.recordDigestSha256 !==
      reservation.recordDigestSha256
    || sha256AuthorityValue(firstReservationReread) !==
      sha256AuthorityValue(secondReservationReread)
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_attempt_reserve_race',
    )
  }
  assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches({
    reservation: secondReservationReread,
    preparedRun: preparedRunAfter,
    currentSemanticAdmission: semanticAdmissionAfter,
  })
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVE_RESULT_VERSION,
    sourceAuthority:
      'canonical_living_frame_preapproval_reasoning_attempt_service',
    evidenceClass:
      'private_restart_safe_reasoning_attempt_reservation',
    preparedRun: preparedRunAfter,
    reservation: secondReservationReread,
    locator:
      canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema
        .parse(persistence.locator),
    persistence,
    currentSemanticAdmissionRebuiltByServer: true,
    preparedRunReReadByServer: true,
    reservationReReadByServer: true,
    attemptReservationCreated: true,
    providerRequestCreated: false,
    providerSubmissionAuthorityIssued: false,
    providerTransportAuthorized: false,
    providerCallMade: false,
    credentialReadMade: false,
    providerObservationCreated: false,
    providerCheckbackScheduled: false,
    fallbackAuthorized: false,
    providerAttemptCostCreated: false,
    reasoningResultCreated: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    creditReservationCreated: false,
    remoteMutationMade: false,
    productionReady: false,
  }
}

function assertPrivateRepositoryScopes(input: {
  context: ServiceContext
  workspaceId: string
  sourceSpeechRepositoryScope:
    CanonicalSourceSpeechEvidenceRepositoryScope
  routeDataAssuranceRepositoryScope:
    CanonicalPreapprovalRouteDataAssuranceRepositoryScope
  reasoningRepositoryScope:
    CanonicalLivingFramePreapprovalReasoningRepositoryScope
  attemptRepositoryScope:
    CanonicalLivingFramePreapprovalReasoningAttemptRepositoryScope
}): void {
  const ownerUserId = input.context.auth?.userId
  const scopes = [
    input.sourceSpeechRepositoryScope,
    input.routeDataAssuranceRepositoryScope,
    input.reasoningRepositoryScope,
    input.attemptRepositoryScope,
  ]
  if (
    !ownerUserId
    || scopes.some((scope) => (
      scope.ownerUserId !== ownerUserId
      || scope.workspaceId !== input.workspaceId
    ))
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_attempt_repository_scope_mismatch',
    )
  }
}

function validation(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical Living Frame reasoning attempt reservation request is invalid.',
    400,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Living Frame reasoning attempt reservation is stale or inconsistent.',
    409,
    { reason },
  )
}
