import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  canonicalLivingFramePreapprovalReasoningRunLocatorSchema,
  createCanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRunLocator,
} from '../living-frame/canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  PrivateCanonicalLivingFramePreapprovalReasoningRepository,
  type CanonicalLivingFramePreapprovalReasoningPersistenceResult,
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
import {
  bindCanonicalLivingFramePreapprovalInputAuthority,
  type CanonicalLivingFramePreapprovalInputReaderPort,
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
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_REQUEST_VERSION = (
  'canonical-living-frame-preapproval-reasoning-prepare-request-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_RESULT_VERSION = (
  'canonical-living-frame-preapproval-reasoning-prepare-result-v1'
) as const

export const canonicalLivingFramePreapprovalReasoningPrepareRequestSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_REQUEST_VERSION,
    ),
    purpose: z.literal(
      'prepare_current_living_frame_semantic_reasoning_run',
    ),
    semanticAdmissionRequest:
      canonicalLivingFrameSemanticAdmissionRequestSchema,
  }).strict()

export type CanonicalLivingFramePreapprovalReasoningPrepareRequest =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningPrepareRequestSchema
  >

export interface CanonicalLivingFramePreapprovalReasoningPrepareResult {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_RESULT_VERSION
  readonly sourceAuthority:
    'canonical_living_frame_preapproval_reasoning_lifecycle_service'
  readonly evidenceClass:
    'private_restart_safe_prepared_reasoning_run'
  readonly run:
    CanonicalLivingFramePreapprovalReasoningRun
  readonly locator:
    CanonicalLivingFramePreapprovalReasoningRunLocator
  readonly persistence:
    CanonicalLivingFramePreapprovalReasoningPersistenceResult
  readonly semanticAdmissionBoundByServer: true
  readonly currentInputReReadByServer: true
  readonly preparedRunReReadByServer: true
  readonly providerEnvelopePrepared: true
  readonly providerSubmissionAuthorityIssued: false
  readonly providerTransportAuthorized: false
  readonly providerCallMade: false
  readonly credentialReadMade: false
  readonly providerAttemptCreated: false
  readonly providerAttemptCostCreated: false
  readonly reasoningResultCreated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly creditReservationCreated: false
  readonly remoteMutationMade: false
  readonly productionReady: false
}

export interface PrepareCanonicalLivingFramePreapprovalReasoningInput {
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
  readonly sourceSpeechRepository?:
    PrivateCanonicalSourceSpeechEvidenceRepository
  readonly routeDataAssuranceRepository?:
    PrivateCanonicalPreapprovalRouteDataAssuranceRepository
  readonly reasoningRepository?:
    PrivateCanonicalLivingFramePreapprovalReasoningRepository
}

export async function prepareCanonicalLivingFramePreapprovalReasoningRun(
  input: PrepareCanonicalLivingFramePreapprovalReasoningInput,
): Promise<CanonicalLivingFramePreapprovalReasoningPrepareResult> {
  const parsedRequest =
    canonicalLivingFramePreapprovalReasoningPrepareRequestSchema
      .safeParse(input.request)
  if (!parsedRequest.success) {
    throw validation(
      'canonical_living_frame_preapproval_reasoning_prepare_request_invalid',
    )
  }
  const request = parsedRequest.data
  const preapprovalInputRequest =
    request.semanticAdmissionRequest.preapprovalInputRequest
  assertPrivateRepositoryScopes({
    context: input.context,
    workspaceId: preapprovalInputRequest.workspaceId,
    sourceSpeechRepositoryScope:
      input.sourceSpeechRepositoryScope,
    routeDataAssuranceRepositoryScope:
      input.routeDataAssuranceRepositoryScope,
    reasoningRepositoryScope: input.reasoningRepositoryScope,
  })
  const semanticAdmission =
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
  const currentAuthorityBeforePersistence =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: preapprovalInputRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  assertAdmissionCurrent({
    semanticAdmission,
    currentAuthority: currentAuthorityBeforePersistence,
  })
  const run =
    createCanonicalLivingFramePreapprovalReasoningRun({
      semanticAdmission,
      preapprovalInputAuthority:
        currentAuthorityBeforePersistence,
    })
  const repository =
    input.reasoningRepository
    ?? new PrivateCanonicalLivingFramePreapprovalReasoningRepository()
  const persistence = await repository.save({
    scope: input.reasoningRepositoryScope,
    run,
  })
  const firstReread = await repository.readByServerOwnedLocator({
    scope: input.reasoningRepositoryScope,
    locator: persistence.locator,
  })
  const secondReread = await repository.readByServerOwnedLocator({
    scope: input.reasoningRepositoryScope,
    locator: persistence.locator,
  })
  const currentAuthorityAfterPersistence =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: preapprovalInputRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  if (
    firstReread.recordDigestSha256 !== run.recordDigestSha256
    || secondReread.recordDigestSha256 !== run.recordDigestSha256
    || sha256AuthorityValue(firstReread) !==
      sha256AuthorityValue(secondReread)
    || currentAuthorityBeforePersistence.authorityDigestSha256 !==
      currentAuthorityAfterPersistence.authorityDigestSha256
    || sha256AuthorityValue(currentAuthorityBeforePersistence) !==
      sha256AuthorityValue(currentAuthorityAfterPersistence)
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_prepare_race',
    )
  }
  assertAdmissionCurrent({
    semanticAdmission,
    currentAuthority: currentAuthorityAfterPersistence,
  })
  return {
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_PREPARE_RESULT_VERSION,
    sourceAuthority:
      'canonical_living_frame_preapproval_reasoning_lifecycle_service',
    evidenceClass:
      'private_restart_safe_prepared_reasoning_run',
    run: secondReread,
    locator:
      canonicalLivingFramePreapprovalReasoningRunLocatorSchema.parse(
        persistence.locator,
      ),
    persistence,
    semanticAdmissionBoundByServer: true,
    currentInputReReadByServer: true,
    preparedRunReReadByServer: true,
    providerEnvelopePrepared: true,
    providerSubmissionAuthorityIssued: false,
    providerTransportAuthorized: false,
    providerCallMade: false,
    credentialReadMade: false,
    providerAttemptCreated: false,
    providerAttemptCostCreated: false,
    reasoningResultCreated: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    creditReservationCreated: false,
    remoteMutationMade: false,
    productionReady: false,
  }
}

function assertAdmissionCurrent(input: {
  semanticAdmission: {
    readonly identity: unknown
    readonly providerNeutralPayload: {
      readonly canonicalBindings: {
        readonly preapprovalInputAuthorityDigestSha256: string
      }
    }
  }
  currentAuthority: {
    readonly identity: unknown
    readonly authorityDigestSha256: string
  }
}): void {
  if (
    stableAuthorityStringify(input.semanticAdmission.identity) !==
      stableAuthorityStringify(input.currentAuthority.identity)
    || input.semanticAdmission.providerNeutralPayload
      .canonicalBindings.preapprovalInputAuthorityDigestSha256 !==
      input.currentAuthority.authorityDigestSha256
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_input_stale',
    )
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
}): void {
  const ownerUserId = input.context.auth?.userId
  if (
    !ownerUserId
    || input.sourceSpeechRepositoryScope.ownerUserId !== ownerUserId
    || input.routeDataAssuranceRepositoryScope.ownerUserId !==
      ownerUserId
    || input.reasoningRepositoryScope.ownerUserId !== ownerUserId
    || input.sourceSpeechRepositoryScope.workspaceId !==
      input.workspaceId
    || input.routeDataAssuranceRepositoryScope.workspaceId !==
      input.workspaceId
    || input.reasoningRepositoryScope.workspaceId !==
      input.workspaceId
  ) {
    throw conflict(
      'canonical_living_frame_preapproval_reasoning_repository_scope_mismatch',
    )
  }
}

function validation(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical Living Frame preapproval reasoning request is invalid.',
    400,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Living Frame preapproval reasoning state is stale or inconsistent.',
    409,
    { reason },
  )
}
