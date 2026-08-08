import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
  type CaptionLivingFrameRequestV2,
  type LivingFrameCaptionResponseV2,
} from '../../src/types/caption-living-frame-boundary'
import {
  CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
} from '../../src/types/canonical-specialist-support-resume'
import type {
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import {
  parseCaptionLivingFrameRequestV2,
  parseLivingFrameCaptionResponseV2,
} from '../captions-specialist/caption-living-frame-boundary'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  canonicalCaptionCrossSystemRuntimeInput,
  resolveCanonicalCaptionCrossSystemExecutionInput,
} from '../services/canonical-caption-cross-system-execution-input-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  resolveCanonicalCaptionIncomingSupportRequestForCall,
} from '../services/canonical-caption-incoming-support-request-service'
import {
  createCanonicalAuthenticatedSpecialistSupportArtifactProjection,
  createCanonicalSpecialistSupportResumeRepository,
  resumeCanonicalSpecialistWithAuthenticatedSupport,
} from '../services/canonical-specialist-support-resume-service'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import type {
  CanonicalCaptionSupportResumeRequirement,
} from './canonical-caption-broll-approved-execution-harness'

export const CANONICAL_CAPTION_LIVING_FRAME_STRUCTURAL_SUPPORT_FIXTURE_VERSION =
  'canonical-caption-living-frame-structural-support-fixture-v1' as const

const RESPONSE_ARTIFACT_TYPE =
  'living_frame_caption_direction_response' as const

/**
 * Exercises Caption's exact CAP-11/CAP-12 request, authenticated projection,
 * sequential resume, and response-admission path without executing or
 * qualifying Living Frame. The structural response deliberately declines the
 * treatment and leaves information ownership with Caption.
 */
export async function injectCanonicalCaptionLivingFrameStructuralSupport(
  input: {
    readonly context: ServiceContext
    readonly requirement: CanonicalCaptionSupportResumeRequirement
    readonly now?: () => Date
  },
) {
  const selected = input.requirement.supportRequestRefs[0]
  if (input.requirement.supportRequestRefs.length !== 1
    || selected?.targetSkillKey !== 'living_frame'
    || input.context.auth?.userId !== input.requirement.ownerUserId
    || !input.context.canonicalCaptionCrossSystemExecutionInputReadPort
    || !input.context.canonicalCaptionIncomingSupportRequestReadPort) {
    throw new Error(
      'Structural Living Frame support requires one exact mediated Caption request.',
    )
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: input.context.env.localStorageRoot,
  })
  const repository = createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: [
      'private-internal/captions-specialist/v1',
      input.requirement.ownerUserId,
      input.requirement.workspaceId,
    ].join('/'),
  })
  const pair = await repository.rereadCallResultPair({
    callRef: input.requirement.originalCallRef,
  })
  const selectedRef: SkillContractRef = {
    id: selected.id,
    version: selected.version,
    contentHash: selected.contentHash,
  }
  const supportRequest = pair?.result.supportRequests.find((candidate) =>
    candidate.requestId === selectedRef.id
    && candidate.schemaVersion === selectedRef.version
    && candidate.requestDigestSha256 === selectedRef.contentHash)
  if (!pair || !supportRequest
    || pair.call.canonicalScope.ownerUserId !== input.requirement.ownerUserId
    || pair.call.canonicalScope.workspaceId !== input.requirement.workspaceId
    || supportRequest.requestedArtifactTypes.length !== 1
    || supportRequest.requestedArtifactTypes[0] !== RESPONSE_ARTIFACT_TYPE
    || supportRequest.canonicalScope.approvedSnapshotRef === null) {
    throw new Error(
      'Structural Living Frame support could not reread the exact approved request.',
    )
  }
  const request = parseCaptionLivingFrameRequestV2(
    supportRequest.typedPayload)
  const response = createStructuralLivingFrameResponse(request)
  const responseBytes = Buffer.from(stableAuthorityStringify(response), 'utf8')
  const responseContentSha256 = createHash('sha256')
    .update(responseBytes).digest('hex')
  const responseObjectPath = [
    'private-internal/captions-specialist/v1',
    'living-frame-structural-support',
    request.requestDigestSha256,
    `${response.responseDigestSha256}.json`,
  ].join('/')
  await objectPort.createOnly({
    objectPath: responseObjectPath,
    body: responseBytes,
    contentSha256: responseContentSha256,
  })
  const [firstResponseBytes, secondResponseBytes] = await Promise.all([
    objectPort.readExact(responseObjectPath),
    objectPort.readExact(responseObjectPath),
  ])
  if (!firstResponseBytes || !secondResponseBytes
    || !firstResponseBytes.equals(secondResponseBytes)
    || createHash('sha256').update(firstResponseBytes).digest('hex')
      !== responseContentSha256) {
    throw new Error(
      'Structural Living Frame response changed between exact rereads.',
    )
  }
  const rereadResponse = parseLivingFrameCaptionResponseV2(
    JSON.parse(firstResponseBytes.toString('utf8')) as unknown,
    request,
  )
  const responseRef: SkillContractRef = {
    id: rereadResponse.responseId,
    version: rereadResponse.schemaVersion,
    contentHash: rereadResponse.responseDigestSha256,
  }
  const projection =
    createCanonicalAuthenticatedSpecialistSupportArtifactProjection({
      schemaVersion:
        CANONICAL_AUTHENTICATED_SPECIALIST_SUPPORT_ARTIFACT_PROJECTION_VERSION,
      projectionId: `caption.living-frame.structural.projection.${
        response.responseDigestSha256.slice(0, 32)}`,
      originalCallRef: structuredClone(input.requirement.originalCallRef),
      supportRequestRef: selectedRef,
      ownerResultRef: responseRef,
      ownerKey: 'living_frame',
      canonicalScope: structuredClone(supportRequest.canonicalScope),
      artifactRefs: [{
        ...responseRef,
        artifactType: RESPONSE_ARTIFACT_TYPE,
        producerSkillKey: 'living_frame',
        privateArtifact: true,
        byteFreeRef: true,
        sourceSupportRequestRef: selectedRef,
      }],
      authenticatedPrincipalVerified: true,
      exactApprovedSnapshotReread: true,
      exactCanonicalScopeReread: true,
      exactOwnerResultReread: true,
      ownerResultPersistedBeforeProjection: true,
      browserLocalStateUsed: false,
      rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
      directPeerDispatchPerformed: false,
      timelineMutationPerformed: false,
      runtimeExecutionAuthorityGrantedToSpecialist: false,
      assetMutationAuthorityGrantedToSpecialist: false,
      costOrBillingAuthorityGrantedToSpecialist: false,
      finalQaApprovalGrantedToSpecialist: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    })
  await repository.persistAuthenticatedOwnerProjectionCreateOnly({ projection })
  const crossSystemReadPort =
    input.context.canonicalCaptionCrossSystemExecutionInputReadPort
  const incomingSupportReadPort =
    input.context.canonicalCaptionIncomingSupportRequestReadPort
  const resumeRecord = await resumeCanonicalSpecialistWithAuthenticatedSupport({
    priorCallRef: input.requirement.originalCallRef,
    selectedSupportRequestRef: selectedRef,
    repository,
    specialistExecutionPort: {
      execute: async ({ call, resumeSupportRequest }) => {
        const executionInput =
          await resolveCanonicalCaptionCrossSystemExecutionInput({
            call,
            readPort: crossSystemReadPort,
          })
        const incomingSupportRequest =
          await resolveCanonicalCaptionIncomingSupportRequestForCall({
            call,
            readPort: incomingSupportReadPort,
          })
        return runCaptionsSpecialistJob({
          call,
          resumeSupportRequest,
          livingFrameResponse: rereadResponse,
          ...(incomingSupportRequest === null ? {} : {
            incomingSupportRequest,
          }),
          ...canonicalCaptionCrossSystemRuntimeInput(executionInput),
        })
      },
    },
    now: input.now,
  })
  if (resumeRecord.resumedResult.disposition !== 'completed') {
    throw new Error(
      `Structural Living Frame response did not resume the Caption job (${
        resumeRecord.resumedResult.disposition}: ${
        resumeRecord.resumedResult.reasonCodes.join('|')}).`,
    )
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_LIVING_FRAME_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
    responseRef: Object.freeze(responseRef),
    projectionRef: Object.freeze({
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    }),
    resumeRecordRef: Object.freeze({
      id: resumeRecord.recordId,
      version: resumeRecord.schemaVersion,
      contentHash: resumeRecord.recordDigestSha256,
    }),
    structuralFixtureOnly: true as const,
    livingFrameExecutionPerformed: false as const,
    livingFramePrivateQualificationEvidence: false as const,
    captionRetainedInformationOwnership: true as const,
    finalQaEvidence: false as const,
    publicOrProductionAuthorityGranted: false as const,
  })
}

function createStructuralLivingFrameResponse(
  request: CaptionLivingFrameRequestV2,
): LivingFrameCaptionResponseV2 {
  const withoutDigest: Omit<LivingFrameCaptionResponseV2,
    'responseDigestSha256'> = {
    schemaVersion: LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
    responseId: `living-frame.structural.response.${
      request.requestDigestSha256.slice(0, 32)}`,
    originalRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    originalRequestIdempotencyKey: request.idempotencyKey,
    canonicalScope: structuredClone(request.canonicalScope),
    disposition: 'declined_not_applicable',
    reasonCode: 'structural_contract_fixture_only',
    safeUserSummary:
      'Living Frame was deliberately not selected by this structural Caption fixture.',
    livingFrameComponentRef: null,
    semanticProjectionRef: null,
    selectedScene: {
      admissionRef: null,
      bindingRef: null,
      selectedSceneIds: [],
      selectedModes: [],
      selectedTreatments: [],
      deliberateNonUse: true,
      executionClaimed: false,
    },
    informationOwnerHandoff: {
      state: 'retained_by_caption',
      attentionEventIds: [],
      semanticTimingRequestIds: [],
    },
    timing: {
      masterTimingRef: structuredClone(request.timing.masterTimingRef),
      storyTimingEventRefs: structuredClone(request.timing.eventRefs),
      storyTimingCueRefs: structuredClone(request.timing.cueRefs),
      livingFrameTimingBindingRef: null,
      parallelClockCreated: false,
    },
    layoutDependencies: {
      occupancyRegionRefs: [],
      captionSafeExpectationRefs: [],
      faceGestureProtectionRefs: [],
      depthBandRefs: [],
      occlusionExpectationRefs: [],
      maskArtifactRefs: [],
      unresolvedGateCodes: ['living_frame_not_selected'],
      captionPlaneAboveLivingFrame: true,
    },
    estimateProjectionRef: null,
    requiredCapabilityCategories: [],
    requiredWorkCategories: [],
    selectedFallbackCode: 'caption_retains_information_owner',
    captionRetainsOrRegainsInformationOwnership: true,
    qaEvidenceRequirementCodes: [...request.qaExpectationCodes],
    stalenessTuple: {
      transcriptRef: structuredClone(request.canonicalTranscript.artifactRef),
      captionPlanRef: structuredClone(request.captionPlanRef),
      confirmedFrameRef: {
        id: request.confirmedFrame.outputId,
        version: 'confirmed-output-frame-v1',
        contentHash:
          request.confirmedFrame.confirmedOutputFrameDigestSha256,
      },
      layoutOccupancyRef:
        structuredClone(request.dependencies.layoutOccupancyManifestRef),
      masterTimingRef: structuredClone(request.timing.masterTimingRef),
      livingFrameComponentRef: null,
      selectedSceneBindingRef: null,
      approvedSnapshotRef:
        structuredClone(request.canonicalScope.approvedSnapshotRef),
    },
    operationRegistered: false,
    dispatchGranted: false,
    providerAuthority: false,
    runtimeAuthority: false,
    assetCreated: false,
    qaApprovalGranted: false,
    publicDeliveryCreated: false,
    productionReady: false,
  }
  return parseLivingFrameCaptionResponseV2({
    ...withoutDigest,
    responseDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, responseDigestSha256: '' } as unknown as Record<
        string, unknown
      >,
      'responseDigestSha256',
    ),
  }, request)
}
