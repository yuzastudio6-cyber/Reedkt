import type {
  CanonicalCaptionBrollApprovedSnapshotReadPort,
} from '../../src/types/canonical-caption-broll-support'
import type {
  CanonicalBrollCaptionInspectionSourceAuthorityReadPort,
} from '../../src/types/canonical-broll-caption-inspection-source-authority'
import type {
  CanonicalCaptionSoundSyncContextReadPort,
} from '../../src/types/canonical-caption-soundsync-support'
import type { CanonicalCaptionCrossSystemExecutionInputReadPort } from
  '../../src/types/canonical-caption-cross-system-execution-input'
import type { CanonicalCaptionIncomingSupportRequestReadPort } from
  '../../src/types/canonical-caption-specialist-execution'
import type { EditSkillArtifactStore } from
  '../edit-skills/core/edit-skill-artifact-store'
import type { CanonicalSoundArtifactResolver } from
  '../edit-skills/sound/sound-route-executor'
import {
  createCanonicalBrollCaptionOwnerService,
  createCanonicalBrollCaptionOwnerServiceV2,
  type CanonicalBrollCaptionPrivateVisualReviewReadPort,
  type CanonicalBrollCaptionOwnerService,
  type CanonicalBrollCaptionOwnerServiceV2,
} from './canonical-broll-caption-owner-service'
import {
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollSupportService,
  type CanonicalCaptionBrollEvidenceRepository,
  type CanonicalCaptionBrollSupportService,
} from './canonical-caption-broll-support-service'
import {
  createCanonicalCaptionSoundSyncEvidenceRepository,
  createCanonicalCaptionSoundSyncSupportService,
  type CanonicalCaptionSoundSyncEvidenceRepository,
  type CanonicalCaptionSoundSyncSupportService,
} from './canonical-caption-soundsync-support-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import type { CanonicalSpecialistSupportResumeRepository } from
  './canonical-specialist-support-resume-service'
import {
  createCanonicalSoundCaptionOwnerService,
  type CanonicalSoundCaptionExecutionReadPort,
  type CanonicalSoundCaptionListeningReviewReadPort,
  type CanonicalSoundCaptionOwnerService,
} from './canonical-sound-caption-owner-service'
import {
  createCanonicalSoundCaptionListeningReviewRepository,
  type CanonicalSoundCaptionListeningReviewRepository,
} from './canonical-sound-caption-listening-review-completion'

export const CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_VERSION =
  'canonical-caption-shared-owner-private-composition-v1' as const
export const CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V2_VERSION =
  'canonical-caption-shared-owner-private-composition-v2' as const
export const CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V3_VERSION =
  'canonical-caption-shared-owner-private-composition-v3' as const

/**
 * Internal composition root for the two previously missing Caption owner
 * mounts. The underlying Sound and B-roll skills remain the only execution
 * owners; this composition only projects their exact reread evidence through
 * Caption's already-published support boundaries.
 */
export interface CanonicalCaptionSharedOwnerPrivateComposition {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_VERSION
  readonly soundOwner: CanonicalSoundCaptionOwnerService
  readonly soundSupport: CanonicalCaptionSoundSyncSupportService
  readonly soundEvidenceRepository:
    CanonicalCaptionSoundSyncEvidenceRepository
  readonly brollOwner: CanonicalBrollCaptionOwnerService
  readonly brollSupport: CanonicalCaptionBrollSupportService
  readonly brollEvidenceRepository: CanonicalCaptionBrollEvidenceRepository
  readonly soundExecutionOwnedByCaption: false
  readonly brollSelectionOwnedByCaption: false
  readonly directPeerDispatchMounted: false
  readonly providerAuthorityGranted: false
  readonly runtimeAuthorityGrantedToCaption: false
  readonly assetMutationAuthorityGrantedToCaption: false
  readonly finalQaApprovalAuthorityGrantedToCaption: false
  readonly billingAuthorityGrantedToCaption: false
  readonly publicDeliveryAuthorityGranted: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalCaptionSharedOwnerPrivateCompositionV2
  extends Omit<CanonicalCaptionSharedOwnerPrivateComposition,
    'schemaVersion' | 'brollOwner'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V2_VERSION
  readonly brollOwner: CanonicalBrollCaptionOwnerServiceV2
  readonly brollInspectionSourceAuthorityReadPort:
    CanonicalBrollCaptionInspectionSourceAuthorityReadPort
  readonly brollSelectedArtifactInspectionAuthorityMounted: true
}

export interface CanonicalCaptionSharedOwnerPrivateCompositionV3
  extends Omit<CanonicalCaptionSharedOwnerPrivateCompositionV2,
    'schemaVersion' | 'soundOwner'> {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V3_VERSION
  readonly soundOwner: CanonicalSoundCaptionOwnerService
  readonly soundListeningReviewRepository:
    CanonicalSoundCaptionListeningReviewRepository
  readonly soundListeningReviewCreateOnlyOwnerMounted: true
}

export interface CanonicalCaptionSharedOwnerPrivateCompositionInput {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly supportResumeRepository: CanonicalSpecialistSupportResumeRepository
  readonly soundContextReadPort: CanonicalCaptionSoundSyncContextReadPort
  readonly soundExecutionReadPort: CanonicalSoundCaptionExecutionReadPort
  readonly soundListeningReviewReadPort:
    CanonicalSoundCaptionListeningReviewReadPort
  readonly soundArtifactResolver: CanonicalSoundArtifactResolver
  readonly brollApprovedSnapshotReadPort:
    CanonicalCaptionBrollApprovedSnapshotReadPort
  readonly brollPrivateVisualReviewReadPort:
    CanonicalBrollCaptionPrivateVisualReviewReadPort
  readonly brollArtifactStore: EditSkillArtifactStore
  readonly crossSystemExecutionInputReadPort?:
    CanonicalCaptionCrossSystemExecutionInputReadPort
  readonly incomingSupportRequestReadPort?:
    CanonicalCaptionIncomingSupportRequestReadPort
  readonly prefix?: string
  readonly now?: () => Date
}

export type CanonicalCaptionSharedOwnerPrivateCompositionV3Input =
  Omit<CanonicalCaptionSharedOwnerPrivateCompositionInput,
    'soundListeningReviewReadPort'>

export function createCanonicalCaptionSharedOwnerPrivateComposition(
  input: CanonicalCaptionSharedOwnerPrivateCompositionInput,
): CanonicalCaptionSharedOwnerPrivateComposition {
  const prefix = input.prefix
    ?? 'private/orchestra/v1/caption-shared-owner-composition'
  const soundOwner = createCanonicalSoundCaptionOwnerService({
    objectPort: input.objectPort,
    executionReadPort: input.soundExecutionReadPort,
    listeningReviewReadPort: input.soundListeningReviewReadPort,
    artifactResolver: input.soundArtifactResolver,
    prefix: `${prefix}/sound-owner`,
  })
  const soundEvidenceRepository =
    createCanonicalCaptionSoundSyncEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/sound-support`,
    })
  const soundSupport = createCanonicalCaptionSoundSyncSupportService({
    supportResumeRepository: input.supportResumeRepository,
    contextReadPort: input.soundContextReadPort,
    ownerReadPort: soundOwner.ownerReadPort,
    evidenceRepository: soundEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  const brollOwner = createCanonicalBrollCaptionOwnerService({
    objectPort: input.objectPort,
    artifactStore: input.brollArtifactStore,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    privateVisualReviewReadPort: input.brollPrivateVisualReviewReadPort,
    prefix: `${prefix}/broll-owner`,
  })
  const brollEvidenceRepository =
    createCanonicalCaptionBrollEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/broll-support`,
    })
  const brollSupport = createCanonicalCaptionBrollSupportService({
    supportResumeRepository: input.supportResumeRepository,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    ownerReadPort: brollOwner.ownerReadPort,
    evidenceRepository: brollEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_VERSION,
    soundOwner,
    soundSupport,
    soundEvidenceRepository,
    brollOwner,
    brollSupport,
    brollEvidenceRepository,
    soundExecutionOwnedByCaption: false,
    brollSelectionOwnedByCaption: false,
    directPeerDispatchMounted: false,
    providerAuthorityGranted: false,
    runtimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

export function createCanonicalCaptionSharedOwnerPrivateCompositionV2(
  input: CanonicalCaptionSharedOwnerPrivateCompositionInput,
): CanonicalCaptionSharedOwnerPrivateCompositionV2 {
  const prefix = input.prefix
    ?? 'private/orchestra/v1/caption-shared-owner-composition'
  const soundOwner = createCanonicalSoundCaptionOwnerService({
    objectPort: input.objectPort,
    executionReadPort: input.soundExecutionReadPort,
    listeningReviewReadPort: input.soundListeningReviewReadPort,
    artifactResolver: input.soundArtifactResolver,
    prefix: `${prefix}/sound-owner`,
  })
  const soundEvidenceRepository =
    createCanonicalCaptionSoundSyncEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/sound-support`,
    })
  const soundSupport = createCanonicalCaptionSoundSyncSupportService({
    supportResumeRepository: input.supportResumeRepository,
    contextReadPort: input.soundContextReadPort,
    ownerReadPort: soundOwner.ownerReadPort,
    evidenceRepository: soundEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  const brollOwner = createCanonicalBrollCaptionOwnerServiceV2({
    objectPort: input.objectPort,
    artifactStore: input.brollArtifactStore,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    privateVisualReviewReadPort: input.brollPrivateVisualReviewReadPort,
    prefix: `${prefix}/broll-owner`,
  })
  const brollEvidenceRepository =
    createCanonicalCaptionBrollEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/broll-support`,
    })
  const brollSupport = createCanonicalCaptionBrollSupportService({
    supportResumeRepository: input.supportResumeRepository,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    ownerReadPort: brollOwner.ownerReadPort,
    evidenceRepository: brollEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V2_VERSION,
    soundOwner,
    soundSupport,
    soundEvidenceRepository,
    brollOwner,
    brollSupport,
    brollEvidenceRepository,
    brollInspectionSourceAuthorityReadPort:
      brollOwner.inspectionSourceAuthorityReadPort,
    brollSelectedArtifactInspectionAuthorityMounted: true,
    soundExecutionOwnedByCaption: false,
    brollSelectionOwnedByCaption: false,
    directPeerDispatchMounted: false,
    providerAuthorityGranted: false,
    runtimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

export function createCanonicalCaptionSharedOwnerPrivateCompositionV3(
  input: CanonicalCaptionSharedOwnerPrivateCompositionV3Input,
): CanonicalCaptionSharedOwnerPrivateCompositionV3 {
  const prefix = input.prefix
    ?? 'private/orchestra/v1/caption-shared-owner-composition'
  const soundListeningReviewRepository =
    createCanonicalSoundCaptionListeningReviewRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/sound-listening-review`,
    })
  const soundOwner = createCanonicalSoundCaptionOwnerService({
    objectPort: input.objectPort,
    executionReadPort: input.soundExecutionReadPort,
    listeningReviewReadPort:
      soundListeningReviewRepository.listeningReviewReadPort,
    artifactResolver: input.soundArtifactResolver,
    prefix: `${prefix}/sound-owner`,
  })
  const soundEvidenceRepository =
    createCanonicalCaptionSoundSyncEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/sound-support`,
    })
  const soundSupport = createCanonicalCaptionSoundSyncSupportService({
    supportResumeRepository: input.supportResumeRepository,
    contextReadPort: input.soundContextReadPort,
    ownerReadPort: soundOwner.ownerReadPort,
    evidenceRepository: soundEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  const brollOwner = createCanonicalBrollCaptionOwnerServiceV2({
    objectPort: input.objectPort,
    artifactStore: input.brollArtifactStore,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    privateVisualReviewReadPort: input.brollPrivateVisualReviewReadPort,
    prefix: `${prefix}/broll-owner`,
  })
  const brollEvidenceRepository =
    createCanonicalCaptionBrollEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/broll-support`,
    })
  const brollSupport = createCanonicalCaptionBrollSupportService({
    supportResumeRepository: input.supportResumeRepository,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    ownerReadPort: brollOwner.ownerReadPort,
    evidenceRepository: brollEvidenceRepository,
    crossSystemExecutionInputReadPort:
      input.crossSystemExecutionInputReadPort,
    incomingSupportRequestReadPort: input.incomingSupportRequestReadPort,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_V3_VERSION,
    soundOwner,
    soundSupport,
    soundEvidenceRepository,
    soundListeningReviewRepository,
    soundListeningReviewCreateOnlyOwnerMounted: true,
    brollOwner,
    brollSupport,
    brollEvidenceRepository,
    brollInspectionSourceAuthorityReadPort:
      brollOwner.inspectionSourceAuthorityReadPort,
    brollSelectedArtifactInspectionAuthorityMounted: true,
    soundExecutionOwnedByCaption: false,
    brollSelectionOwnedByCaption: false,
    directPeerDispatchMounted: false,
    providerAuthorityGranted: false,
    runtimeAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}
