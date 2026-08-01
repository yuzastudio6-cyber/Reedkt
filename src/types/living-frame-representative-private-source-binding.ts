import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'

export const LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_VERSION =
  'living-frame-representative-private-source-binding-v1' as const

export interface LivingFrameRepresentativePrivateDigestRef {
  readonly refId: string
  readonly refVersion: string
  readonly digestSha256: string
  readonly canonicalRereadRequired: true
}

export interface LivingFrameRepresentativeVideoSegmentSelection {
  readonly selectionKind: 'video_segment'
  readonly sourceSequenceItemId: string
  readonly rangeId: string
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly sourceDurationFrames: number
  readonly fps: 30
  readonly evidenceIds: readonly string[]
  readonly phraseBoundaryAligned: true
  readonly preservesSourceMeaning: true
  readonly userReviewRequired: false
  readonly contentAnalysisEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion:
        'canonical-source-led-content-analysis-evidence-v1'
    }
}

export interface LivingFrameRepresentativeStillCropSelection {
  readonly selectionKind: 'still_crop'
  readonly sourceWidthPixels: number
  readonly sourceHeightPixels: number
  readonly cropXBp: number
  readonly cropYBp: number
  readonly cropWidthBp: number
  readonly cropHeightBp: number
  readonly cropPreservesClaimContext: true
}

export interface LivingFrameRepresentativeStructuredDataSelection {
  readonly selectionKind: 'structured_data_rows'
  readonly sourceSnapshotRef:
    LivingFrameRepresentativePrivateDigestRef
  readonly rowRefIds: readonly string[]
  readonly citationSetDigestSha256: string
  readonly currentSourceRereadCompleted: true
}

export type LivingFrameRepresentativePrivateSourceSelection =
  | LivingFrameRepresentativeVideoSegmentSelection
  | LivingFrameRepresentativeStillCropSelection
  | LivingFrameRepresentativeStructuredDataSelection

export interface LivingFrameRepresentativePrivateSourceBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_VERSION
  readonly bindingClass:
    'byte_free_private_finalized_source_and_selection_binding_candidate'
  readonly sourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly sourceCandidateSetDigestSha256: string
  readonly sourceCandidateId:
    LivingFrameRepresentativeMediaSourceCandidateId
  readonly sourceCandidateDigestSha256: string
  readonly workspaceId: string
  readonly projectId: string
  readonly privateUploadAuthority: {
    readonly schemaVersion: 'private-upload-media-authority-v1'
    readonly mockOnly: true
    readonly authorityRevision: number
    readonly authorityChecksumSha256: string
    readonly uploadIntentId: string
    readonly mediaAssetId: string
    readonly storageObjectRecordId: string
    readonly contentType: string
    readonly byteLength: number
    readonly checksumSha256: string
    readonly storageIdentityDigestSha256: string
    readonly serverComputedIntegrityVerified: true
    readonly privateInternalOnly: true
  }
  readonly selection: LivingFrameRepresentativePrivateSourceSelection
  readonly selectionDigestSha256: string
  readonly evidenceReviews: {
    readonly licenseReviewRef: LivingFrameRepresentativePrivateDigestRef
    readonly attributionReviewRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly publicityReviewRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly documentaryFactSafetyRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly allRequiredReviewsCompleted: true
    readonly customerOrPublicUseAuthorized: false
  }
  readonly canonicalBindings: {
    readonly approvedSnapshotRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion:
          'private-edit-authority-approved-snapshot-v3'
      }
    readonly selectedSceneRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion:
          'canonical-living-frame-selected-scene-binding-v1'
      }
    readonly masterTimingRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'master-timing-plan-v1'
      }
    readonly confirmedFrameRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'confirmed-output-frame-v1'
      }
    readonly approvedWorkRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'canonical-approved-work-item-v1'
      }
    readonly assetManifestEntryRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'private-edit-asset-manifest-entry-v1'
      }
  }
  readonly sourceBytesSerialized: false
  readonly storageBucketOrPathSerialized: false
  readonly externalUrlSerialized: false
  readonly rawTranscriptSerialized: false
  readonly rawChatPromptCredentialCommandOrEnvironmentSerialized: false
  readonly canonicalConsumptionPending: true
  readonly createsUploadSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativePrivateSourceBinding
  extends LivingFrameRepresentativePrivateSourceBindingDraft {
  readonly bindingDigestSha256: string
}
