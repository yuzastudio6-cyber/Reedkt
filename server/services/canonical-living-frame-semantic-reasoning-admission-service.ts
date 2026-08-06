import { z } from 'zod'

import {
  canonicalLivingFrameSemanticReasoningAdmissionSchema,
  createCanonicalLivingFrameProviderNeutralPayload,
  createCanonicalLivingFrameSemanticReasoningAdmission,
  verifyCanonicalLivingFrameSemanticReasoningAdmission,
  type CanonicalLivingFrameSemanticReasoningAdmission,
} from '../living-frame/canonical-living-frame-semantic-reasoning-admission'
import {
  canonicalPreapprovalRouteDataAssuranceLocatorSchema,
} from '../model-data-assurance/canonical-preapproval-route-data-assurance-contract'
import {
  PrivateCanonicalPreapprovalRouteDataAssuranceRepository,
  type CanonicalPreapprovalRouteDataAssuranceRepositoryScope,
} from '../model-data-assurance/private-canonical-preapproval-route-data-assurance-repository'
import {
  canonicalSourceSpeechEvidenceLocatorSchema,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  PrivateCanonicalSourceSpeechEvidenceRepository,
  type CanonicalSourceSpeechEvidenceRepositoryScope,
} from '../source-speech-evidence/private-canonical-source-speech-evidence-repository'
import type { ServiceContext } from '../types'
import {
  canonicalLivingFramePreapprovalInputRequestSchema,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  canonicalLivingFrameSemanticReasoningRequestSchema,
} from '../validation/canonical-living-frame-semantic-reasoning-request-schemas'
import { ApiError } from '../errors/api-error'
import {
  bindCanonicalLivingFramePreapprovalInputAuthority,
  readCurrentCanonicalLivingFramePreapprovalInputState,
  type CanonicalLivingFramePreapprovalInputReaderPort,
} from './canonical-living-frame-preapproval-input-authority-service'
import type {
  CanonicalLivingFramePlanningEvidenceReaderPort,
} from './canonical-living-frame-planning-evidence-service'
import {
  readCurrentCanonicalPreapprovalRouteDataAssurance,
} from './canonical-preapproval-route-data-assurance-service'
import {
  readCurrentCanonicalSourceSpeechEvidence,
} from './canonical-source-speech-evidence-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_REQUEST_VERSION =
  'canonical-living-frame-semantic-reasoning-admission-request-v1' as const

export const canonicalLivingFrameSemanticAdmissionRequestSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_REQUEST_VERSION,
    ),
    purpose: z.literal(
      'bind_current_living_frame_semantic_request_to_shared_evidence',
    ),
    preapprovalInputRequest:
      canonicalLivingFramePreapprovalInputRequestSchema,
    semanticRequest:
      canonicalLivingFrameSemanticReasoningRequestSchema,
    sourceSpeechEvidenceLocator:
      canonicalSourceSpeechEvidenceLocatorSchema,
    routeDataAssuranceLocator:
      canonicalPreapprovalRouteDataAssuranceLocatorSchema,
  }).strict()

export type CanonicalLivingFrameSemanticAdmissionRequest = z.infer<
  typeof canonicalLivingFrameSemanticAdmissionRequestSchema
>

export interface BindCanonicalLivingFrameSemanticReasoningAdmissionInput {
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
  readonly sourceSpeechRepository?:
    PrivateCanonicalSourceSpeechEvidenceRepository
  readonly routeDataAssuranceRepository?:
    PrivateCanonicalPreapprovalRouteDataAssuranceRepository
}

export async function bindCanonicalLivingFrameSemanticReasoningAdmission(
  input: BindCanonicalLivingFrameSemanticReasoningAdmissionInput,
): Promise<CanonicalLivingFrameSemanticReasoningAdmission> {
  const parsedRequest =
    canonicalLivingFrameSemanticAdmissionRequestSchema.safeParse(
      input.request,
    )
  if (!parsedRequest.success) {
    throw validation(
      'canonical_living_frame_semantic_admission_request_invalid',
    )
  }
  const request = parsedRequest.data
  assertPrivateRepositoryScopes({
    context: input.context,
    workspaceId: request.preapprovalInputRequest.workspaceId,
    sourceSpeechRepositoryScope: input.sourceSpeechRepositoryScope,
    routeDataAssuranceRepositoryScope:
      input.routeDataAssuranceRepositoryScope,
  })
  const firstAuthority =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: request.preapprovalInputRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  const currentState =
    await readCurrentCanonicalLivingFramePreapprovalInputState({
      reader: input.inputReader,
      expectedScope: {
        workspaceId: firstAuthority.identity.workspaceId,
        projectId: firstAuthority.identity.projectId,
        editSessionId: firstAuthority.identity.editSessionId,
      },
      expectedHandoffId: firstAuthority.identity.handoffId,
    })
  const sourceSpeechEvidence =
    await readCurrentCanonicalSourceSpeechEvidence({
      repositoryScope: input.sourceSpeechRepositoryScope,
      canonicalContext: {
        workspaceId: firstAuthority.identity.workspaceId,
        projectId: firstAuthority.identity.projectId,
        editSessionId: firstAuthority.identity.editSessionId,
        components: currentState.canonicalPlanComponents,
      },
      locator: request.sourceSpeechEvidenceLocator,
      repository: input.sourceSpeechRepository,
    })
  let providerNeutralPayload
  try {
    providerNeutralPayload =
      await createCanonicalLivingFrameProviderNeutralPayload({
        preapprovalInputAuthority: firstAuthority,
        semanticRequest: request.semanticRequest,
        sourceSpeechEvidence,
      })
  } catch {
    throw conflict(
      'canonical_living_frame_semantic_admission_payload_mismatch',
    )
  }
  const routeDataAssurance =
    await readCurrentCanonicalPreapprovalRouteDataAssurance({
      repositoryScope: input.routeDataAssuranceRepositoryScope,
      canonicalContext: {
        workspaceId: firstAuthority.identity.workspaceId,
        projectId: firstAuthority.identity.projectId,
        editSessionId: firstAuthority.identity.editSessionId,
        requestDigestSha256:
          providerNeutralPayload.payloadDigestSha256,
      },
      locator: request.routeDataAssuranceLocator,
      repository: input.routeDataAssuranceRepository,
    })
  let admission: CanonicalLivingFrameSemanticReasoningAdmission
  try {
    admission = createCanonicalLivingFrameSemanticReasoningAdmission({
      providerNeutralPayload,
      routeDataAssurance,
    })
  } catch {
    throw blocked(
      'canonical_living_frame_semantic_admission_route_assurance_not_ready',
    )
  }
  const secondAuthority =
    await bindCanonicalLivingFramePreapprovalInputAuthority({
      context: input.context,
      request: request.preapprovalInputRequest,
      inputReader: input.inputReader,
      planningEvidenceReader: input.planningEvidenceReader,
    })
  if (
    firstAuthority.authorityDigestSha256 !==
      secondAuthority.authorityDigestSha256
    || sha256AuthorityValue(firstAuthority) !==
      sha256AuthorityValue(secondAuthority)
  ) {
    throw conflict(
      'canonical_living_frame_semantic_admission_input_race',
    )
  }
  const verified =
    verifyCanonicalLivingFrameSemanticReasoningAdmission(admission)
  return canonicalLivingFrameSemanticReasoningAdmissionSchema.parse(
    verified,
  )
}

function assertPrivateRepositoryScopes(input: {
  context: ServiceContext
  workspaceId: string
  sourceSpeechRepositoryScope:
    CanonicalSourceSpeechEvidenceRepositoryScope
  routeDataAssuranceRepositoryScope:
    CanonicalPreapprovalRouteDataAssuranceRepositoryScope
}): void {
  const ownerUserId = input.context.auth?.userId
  if (
    !ownerUserId
    || input.sourceSpeechRepositoryScope.ownerUserId !== ownerUserId
    || input.routeDataAssuranceRepositoryScope.ownerUserId !== ownerUserId
    || input.sourceSpeechRepositoryScope.workspaceId !== input.workspaceId
    || input.routeDataAssuranceRepositoryScope.workspaceId !==
      input.workspaceId
  ) {
    throw conflict(
      'canonical_living_frame_semantic_admission_repository_scope_mismatch',
    )
  }
}

function validation(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Canonical Living Frame semantic admission input is invalid.',
    400,
    { reason },
  )
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Living Frame semantic admission is stale or inconsistent.',
    409,
    { reason },
  )
}

function blocked(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical Living Frame semantic admission is not ready.',
    503,
    {
      reason,
      providerEnvelopeAuthorized: false,
      providerTransportAuthorized: false,
      productionReady: false,
    },
  )
}
