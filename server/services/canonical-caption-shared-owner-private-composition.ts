import type {
  CanonicalCaptionBrollApprovedSnapshotReadPort,
} from '../../src/types/canonical-caption-broll-support'
import type {
  CanonicalCaptionSoundSyncContextReadPort,
} from '../../src/types/canonical-caption-soundsync-support'
import type { EditSkillArtifactStore } from
  '../edit-skills/core/edit-skill-artifact-store'
import type { CanonicalSoundArtifactResolver } from
  '../edit-skills/sound/sound-route-executor'
import {
  createCanonicalBrollCaptionOwnerService,
  type CanonicalBrollCaptionPrivateVisualReviewReadPort,
  type CanonicalBrollCaptionOwnerService,
} from './canonical-broll-caption-owner-service'
import {
  createCanonicalCaptionBrollEvidenceRepository,
  createCanonicalCaptionBrollSupportService,
  type CanonicalCaptionBrollSupportService,
} from './canonical-caption-broll-support-service'
import {
  createCanonicalCaptionSoundSyncEvidenceRepository,
  createCanonicalCaptionSoundSyncSupportService,
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

export const CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_VERSION =
  'canonical-caption-shared-owner-private-composition-v1' as const

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
  readonly brollOwner: CanonicalBrollCaptionOwnerService
  readonly brollSupport: CanonicalCaptionBrollSupportService
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

export function createCanonicalCaptionSharedOwnerPrivateComposition(input: {
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
  readonly prefix?: string
  readonly now?: () => Date
}): CanonicalCaptionSharedOwnerPrivateComposition {
  const prefix = input.prefix
    ?? 'private/orchestra/v1/caption-shared-owner-composition'
  const soundOwner = createCanonicalSoundCaptionOwnerService({
    objectPort: input.objectPort,
    executionReadPort: input.soundExecutionReadPort,
    listeningReviewReadPort: input.soundListeningReviewReadPort,
    artifactResolver: input.soundArtifactResolver,
    prefix: `${prefix}/sound-owner`,
  })
  const soundSupport = createCanonicalCaptionSoundSyncSupportService({
    supportResumeRepository: input.supportResumeRepository,
    contextReadPort: input.soundContextReadPort,
    ownerReadPort: soundOwner.ownerReadPort,
    evidenceRepository: createCanonicalCaptionSoundSyncEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/sound-support`,
    }),
    now: input.now,
  })
  const brollOwner = createCanonicalBrollCaptionOwnerService({
    objectPort: input.objectPort,
    artifactStore: input.brollArtifactStore,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    privateVisualReviewReadPort: input.brollPrivateVisualReviewReadPort,
    prefix: `${prefix}/broll-owner`,
  })
  const brollSupport = createCanonicalCaptionBrollSupportService({
    supportResumeRepository: input.supportResumeRepository,
    approvedSnapshotReadPort: input.brollApprovedSnapshotReadPort,
    ownerReadPort: brollOwner.ownerReadPort,
    evidenceRepository: createCanonicalCaptionBrollEvidenceRepository({
      objectPort: input.objectPort,
      prefix: `${prefix}/broll-support`,
    }),
    now: input.now,
  })
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_SHARED_OWNER_PRIVATE_COMPOSITION_VERSION,
    soundOwner,
    soundSupport,
    brollOwner,
    brollSupport,
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
