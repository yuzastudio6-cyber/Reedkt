import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import type { SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import {
  parseBrollCaptionOwnerReadRequest,
  parseBrollCaptionOwnerReadResult,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollOwnerReadPort,
  createCanonicalCaptionBrollSupportService,
} from '../services/canonical-caption-broll-support-service'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import { createCanonicalSpecialistSupportResumeRepository } from
  '../services/canonical-specialist-support-resume-service'
import type { ServiceContext } from '../types'
import type { CanonicalCaptionSupportResumeRequirement } from
  './canonical-caption-broll-approved-execution-harness'

export const CANONICAL_CAPTION_BROLL_STRUCTURAL_SUPPORT_FIXTURE_VERSION =
  'canonical-caption-broll-structural-support-fixture-v1' as const

/**
 * Source-contract fixture for the canonical owner-read projection and resume
 * path. It never selects media, mutates crop/timing, executes B-roll, or counts
 * as private qualification evidence. The canonical B-roll support service
 * remains the only projection/resume owner.
 */
export async function injectCanonicalCaptionBrollStructuralSupport(input: {
  readonly context: ServiceContext
  readonly requirement: CanonicalCaptionSupportResumeRequirement
  readonly now?: () => Date
}) {
  if (input.requirement.supportRequestRefs.length !== 1
    || input.requirement.supportRequestRefs[0]?.targetSkillKey
      !== 'broll_owner'
    || input.context.auth?.userId !== input.requirement.ownerUserId) {
    throw new Error(
      'Structural Caption B-roll fixture requires one exact owner request.',
    )
  }
  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: input.context.env.localStorageRoot,
  })
  const supportResumeRepository =
    createCanonicalSpecialistSupportResumeRepository({
      objectPort,
      prefix: [
        'private-internal/captions-specialist/v1',
        input.requirement.ownerUserId,
        input.requirement.workspaceId,
      ].join('/'),
    })
  const pair = await supportResumeRepository.rereadCallResultPair({
    callRef: input.requirement.originalCallRef,
  })
  const selectedRequirement = input.requirement.supportRequestRefs[0]
  const selectedSupportRequestRef: SkillContractRef = {
    id: selectedRequirement!.id,
    version: selectedRequirement!.version,
    contentHash: selectedRequirement!.contentHash,
  }
  const supportRequest = pair?.result.supportRequests.find((request) =>
    request.requestId === selectedSupportRequestRef.id
    && request.schemaVersion === selectedSupportRequestRef.version
    && request.requestDigestSha256 === selectedSupportRequestRef.contentHash)
  if (!pair || !supportRequest
    || pair.call.canonicalScope.ownerUserId !== input.requirement.ownerUserId
    || pair.call.canonicalScope.workspaceId !== input.requirement.workspaceId) {
    throw new Error(
      'Structural Caption B-roll fixture could not reread the exact request.',
    )
  }
  const ownerRequest = parseBrollCaptionOwnerReadRequest(
    supportRequest.typedPayload)
  const ownerResult = createStructuralOwnerResult(ownerRequest)
  const service = createCanonicalCaptionBrollSupportService({
    supportResumeRepository,
    approvedSnapshotReadPort:
      createCanonicalCaptionBrollApprovedSnapshotReadPort(async () => ({
        canonicalScope: structuredClone(ownerRequest.canonicalScope),
        planningConstraintRef:
          structuredClone(ownerRequest.planningConstraintRef),
      })),
    ownerReadPort: createCanonicalCaptionBrollOwnerReadPort(async () =>
      structuredClone(ownerResult)),
    evidenceRepository: createCanonicalCaptionBrollEvidenceRepository({
      objectPort,
      prefix: [
        'private-internal/captions-specialist/v1',
        'broll-structural-support',
        input.requirement.ownerUserId,
        input.requirement.workspaceId,
      ].join('/'),
    }),
    ...(input.context.canonicalCaptionCrossSystemExecutionInputReadPort
      ? {
          crossSystemExecutionInputReadPort: input.context
            .canonicalCaptionCrossSystemExecutionInputReadPort,
        }
      : {}),
    ...(input.context.canonicalCaptionIncomingSupportRequestReadPort
      ? {
          incomingSupportRequestReadPort: input.context
            .canonicalCaptionIncomingSupportRequestReadPort,
        }
      : {}),
    now: input.now,
  })
  const outcome = await service.projectAndResumeAuthenticatedEvidence({
    authenticatedOwnerUserId: input.requirement.ownerUserId,
    priorCallRef: input.requirement.originalCallRef,
    selectedSupportRequestRef,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_BROLL_STRUCTURAL_SUPPORT_FIXTURE_VERSION,
    evidenceRecordRef: Object.freeze({
      id: outcome.evidenceRecord.recordId,
      version: outcome.evidenceRecord.schemaVersion,
      contentHash: outcome.evidenceRecord.recordDigestSha256,
    }),
    resumeRecordRef: Object.freeze({
      id: outcome.resumeRecord.recordId,
      version: outcome.resumeRecord.schemaVersion,
      contentHash: outcome.resumeRecord.recordDigestSha256,
    }),
    structuralFixtureOnly: true as const,
    ownerSelectionOrTimingPerformed: false as const,
    privateQualificationEvidence: false as const,
    mediaRuntimePerformed: false as const,
    finalQaEvidence: false as const,
    publicOrProductionAuthorityGranted: false as const,
  })
}

function createStructuralOwnerResult(
  request: ReturnType<typeof parseBrollCaptionOwnerReadRequest>,
): BrollCaptionOwnerReadResult {
  const seed = request.requestDigestSha256
  const ref = (role: string, version: string) => ({
    id: `broll.structural.${role}.${seed.slice(0, 24)}`,
    version,
    contentHash: calculateSkillContractDigest({
      requestDigestSha256: seed,
      role,
      digest: '',
    }, 'digest'),
  })
  const withoutDigest: Omit<BrollCaptionOwnerReadResult,
    'resultDigestSha256'> = {
    schemaVersion: 'b_roll_caption_owner_read_result_v1',
    resultId: `broll.structural.result.${seed.slice(0, 32)}`,
    ownerSkillKey: 'b_roll',
    requestingSkillKey: 'captions',
    requestedJobType: 'provide_caption_broll_composition_constraints',
    mediationMode: 'hq_mediated_owner_read',
    brollManifestRef: structuredClone(request.brollManifestRef),
    canonicalScope: structuredClone(request.canonicalScope),
    ownerRequestRef: {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    },
    brollResultReceiptRef: ref(
      'result-receipt', 'b_roll_result_receipt_v1'),
    selectedMediaManifestRef: ref(
      'selected-media', 'b_roll_candidate_media_manifest_v1'),
    layoutOccupancyRef: ref(
      'layout-occupancy', 'b_roll_remotion_layer_manifest_v1'),
    cropTimingRef: ref(
      'crop-timing', 'b_roll_caption_crop_timing_projection_v1'),
    visibleTextEvidenceRef: ref(
      'visible-text', 'b_roll_caption_visible_text_evidence_v1'),
    sourceContractVersions: {
      selectedMediaManifestRef: 'b_roll_candidate_media_manifest_v1',
      layoutOccupancyRef: 'b_roll_remotion_layer_manifest_v1',
      cropTimingRef: 'b_roll_caption_crop_timing_projection_v1',
      visibleTextEvidenceRef: 'b_roll_caption_visible_text_evidence_v1',
    },
    authenticatedOwnerEvidenceRef: ref(
      'owner-evidence', 'b_roll_authenticated_owner_read_evidence_v1'),
    exactPrivateOwnerRereadVerified: true,
    exactCanonicalScopeVerified: true,
    exactApprovedSnapshotVerified: true,
    exactOutputFrameAndMasterTimingVerified: true,
    sourceSelectionPerformedByCaption: false,
    cropOrTimingPerformedByCaption: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    credentialsIncluded: false,
    sourceSelectionAuthorityGranted: false,
    cropOrTimingMutationAuthorityGranted: false,
    runtimeOrDispatchAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseBrollCaptionOwnerReadResult({
    ...withoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resultDigestSha256: '' },
      'resultDigestSha256',
    ),
  })
}
