import {
  LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_VERSION,
  type LivingFrameRepresentativePrivateDigestRef,
  type LivingFrameRepresentativePrivateSourceBinding,
  type LivingFrameRepresentativePrivateSourceBindingDraft,
  type LivingFrameRepresentativePrivateSourceSelection,
} from '../../src/types/living-frame-representative-private-source-binding'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import {
  privateMediaAssetAuthorityRecordSchema,
  privateStorageObjectAuthorityRecordSchema,
  type PrivateMediaAssetAuthorityRecord,
  type PrivateStorageObjectAuthorityRecord,
} from '../validation/private-upload-media-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface CompileLivingFrameRepresentativePrivateSourceBindingInput {
  readonly sourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly sourceCandidateId:
    LivingFrameRepresentativePrivateSourceBinding['sourceCandidateId']
  readonly authorityRevision: number
  readonly authorityChecksumSha256: string
  readonly mediaAsset: PrivateMediaAssetAuthorityRecord
  readonly storageObject: PrivateStorageObjectAuthorityRecord
  readonly selection: LivingFrameRepresentativePrivateSourceSelection
  readonly evidenceReviews:
    LivingFrameRepresentativePrivateSourceBindingDraft['evidenceReviews']
  readonly canonicalBindings:
    LivingFrameRepresentativePrivateSourceBindingDraft['canonicalBindings']
}

export function compileLivingFrameRepresentativePrivateSourceBinding(
  input: CompileLivingFrameRepresentativePrivateSourceBindingInput,
): LivingFrameRepresentativePrivateSourceBinding {
  const normalized = assertInput(input)
  const sourceCandidate = normalized.sourceCandidateSet.sources.find(
    (candidate) => candidate.sourceCandidateId
      === normalized.sourceCandidateId,
  )!
  const storageIdentityDigestSha256 = sha256AuthorityValue({
    storageProvider: normalized.storageObject.storageProvider,
    bucketName: normalized.storageObject.bucketName,
    objectPath: normalized.storageObject.objectPath,
    generation: normalized.storageObject.generation,
    etag: normalized.storageObject.etag,
    metageneration: normalized.storageObject.metageneration,
  })
  const selection = structuredClone(normalized.selection)
  const draft: LivingFrameRepresentativePrivateSourceBindingDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_VERSION,
    bindingClass:
      'byte_free_private_finalized_source_and_selection_binding_candidate',
    sourceCandidateSetVersion:
      normalized.sourceCandidateSet.contractVersion,
    sourceCandidateSetDigestSha256:
      normalized.sourceCandidateSet.candidateSetDigestSha256,
    sourceCandidateId: normalized.sourceCandidateId,
    sourceCandidateDigestSha256: sourceCandidate.candidateDigestSha256,
    workspaceId: normalized.mediaAsset.workspaceId,
    projectId: normalized.mediaAsset.projectId,
    privateUploadAuthority: {
      schemaVersion: 'private-upload-media-authority-v1',
      mockOnly: true,
      authorityRevision: normalized.authorityRevision,
      authorityChecksumSha256: normalized.authorityChecksumSha256,
      uploadIntentId: normalized.mediaAsset.uploadIntentId,
      mediaAssetId: normalized.mediaAsset.id,
      storageObjectRecordId: normalized.storageObject.id,
      contentType: normalized.mediaAsset.mimeType,
      byteLength: normalized.mediaAsset.sizeBytes,
      checksumSha256: normalized.mediaAsset.checksumSha256,
      storageIdentityDigestSha256,
      serverComputedIntegrityVerified: true,
      privateInternalOnly: true,
    },
    selection,
    selectionDigestSha256: sha256AuthorityValue(selection),
    evidenceReviews: structuredClone(normalized.evidenceReviews),
    canonicalBindings: structuredClone(normalized.canonicalBindings),
    sourceBytesSerialized: false,
    storageBucketOrPathSerialized: false,
    externalUrlSerialized: false,
    rawTranscriptSerialized: false,
    rawChatPromptCredentialCommandOrEnvironmentSerialized: false,
    canonicalConsumptionPending: true,
    createsUploadSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativePrivateSourceBinding(
  value: unknown,
  input: CompileLivingFrameRepresentativePrivateSourceBindingInput,
): value is LivingFrameRepresentativePrivateSourceBinding {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativePrivateSourceBinding(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativePrivateSourceBindingInput,
): CompileLivingFrameRepresentativePrivateSourceBindingInput {
  if (!verifyLivingFrameRepresentativeMediaSourceCandidateSet(
    input.sourceCandidateSet,
  )) throw new Error('Invalid Living Frame representative source candidate set.')
  const sourceCandidate = input.sourceCandidateSet.sources.find(
    (candidate) => candidate.sourceCandidateId === input.sourceCandidateId,
  )
  if (!sourceCandidate) throw new Error('Living Frame source candidate is not in the exact set.')
  const mediaAsset = privateMediaAssetAuthorityRecordSchema.parse(
    input.mediaAsset,
  )
  const storageObject = privateStorageObjectAuthorityRecordSchema.parse(
    input.storageObject,
  )
  if (
    !Number.isSafeInteger(input.authorityRevision)
    || input.authorityRevision < 1
    || !SHA256.test(input.authorityChecksumSha256)
    || mediaAsset.workspaceId !== storageObject.workspaceId
    || mediaAsset.projectId !== storageObject.projectId
    || mediaAsset.id !== storageObject.mediaAssetId
    || mediaAsset.uploadIntentId !== storageObject.uploadIntentId
    || mediaAsset.storageObjectRecordId !== storageObject.id
    || mediaAsset.uploadPurpose !== 'source_media'
    || storageObject.uploadPurpose !== 'source_media'
    || storageObject.objectPurpose !== 'source_media'
    || mediaAsset.storageProvider !== storageObject.storageProvider
    || mediaAsset.storageBucket !== storageObject.bucketName
    || mediaAsset.storagePath !== storageObject.objectPath
    || mediaAsset.mimeType !== storageObject.mimeType
    || mediaAsset.mimeType !== sourceCandidate.expectedContentType
    || mediaAsset.sizeBytes !== storageObject.sizeBytes
    || mediaAsset.checksumSha256 !== storageObject.checksumSha256
    || mediaAsset.integrityVerified !== true
    || storageObject.integrityVerified !== true
    || mediaAsset.checksumSource !== 'server_computed_bytes'
    || storageObject.checksumSource !== 'server_computed_bytes'
    || mediaAsset.mockOnly !== true
    || storageObject.mockOnly !== true
    || !validSelection(input.selection, sourceCandidate.expectedContentType)
    || !validEvidenceReviews(
      input.evidenceReviews,
      sourceCandidate.publicityOrPersonUseReviewRequired,
      sourceCandidate.factualOrArchivalUseRequiresDocumentaryFactSafety,
    )
    || !validCanonicalBindings(input.canonicalBindings)
  ) throw new Error('Invalid Living Frame representative private source binding input.')
  return { ...input, mediaAsset, storageObject }
}

function validSelection(
  selection: LivingFrameRepresentativePrivateSourceSelection,
  expectedContentType: string,
): boolean {
  if (selection.selectionKind === 'video_segment') {
    return expectedContentType === 'video/webm'
      && SAFE_ID.test(selection.sourceSequenceItemId)
      && SAFE_ID.test(selection.rangeId)
      && selection.fps === 30
      && Number.isSafeInteger(selection.startFrame)
      && selection.startFrame >= 0
      && Number.isSafeInteger(selection.endFrameExclusive)
      && selection.endFrameExclusive > selection.startFrame
      && Number.isSafeInteger(selection.sourceDurationFrames)
      && selection.sourceDurationFrames >= selection.endFrameExclusive
      && selection.evidenceIds.length >= 1
      && selection.evidenceIds.length <= 128
      && new Set(selection.evidenceIds).size === selection.evidenceIds.length
      && selection.evidenceIds.every((id) => SAFE_ID.test(id))
      && selection.phraseBoundaryAligned
      && selection.preservesSourceMeaning
      && !selection.userReviewRequired
      && validRef(selection.contentAnalysisEvidenceRef)
      && selection.contentAnalysisEvidenceRef.refVersion
        === 'canonical-source-led-content-analysis-evidence-v1'
  }
  if (selection.selectionKind === 'still_crop') {
    return expectedContentType.startsWith('image/')
      && positiveInteger(selection.sourceWidthPixels)
      && positiveInteger(selection.sourceHeightPixels)
      && basisPoints(selection.cropXBp)
      && basisPoints(selection.cropYBp)
      && positiveBasisPoints(selection.cropWidthBp)
      && positiveBasisPoints(selection.cropHeightBp)
      && selection.cropXBp + selection.cropWidthBp <= 10_000
      && selection.cropYBp + selection.cropHeightBp <= 10_000
      && selection.cropPreservesClaimContext
  }
  return expectedContentType === 'application/json'
    && validRef(selection.sourceSnapshotRef)
    && selection.rowRefIds.length >= 1
    && selection.rowRefIds.length <= 512
    && new Set(selection.rowRefIds).size === selection.rowRefIds.length
    && selection.rowRefIds.every((id) => SAFE_ID.test(id))
    && SHA256.test(selection.citationSetDigestSha256)
    && selection.currentSourceRereadCompleted
}

function validEvidenceReviews(
  value: LivingFrameRepresentativePrivateSourceBindingDraft['evidenceReviews'],
  publicityRequired: boolean,
  factSafetyRequired: boolean,
): boolean {
  return validRef(value.licenseReviewRef)
    && validRef(value.attributionReviewRef)
    && validRef(value.publicityReviewRef)
    && validRef(value.documentaryFactSafetyRef)
    && value.allRequiredReviewsCompleted
    && !value.customerOrPublicUseAuthorized
    && (!publicityRequired
      || value.publicityReviewRef.refVersion === 'publicity-review-complete-v1')
    && (!factSafetyRequired
      || value.documentaryFactSafetyRef.refVersion
        === 'documentary-fact-safety-reviewed-v1')
}

function validCanonicalBindings(
  value: LivingFrameRepresentativePrivateSourceBindingDraft['canonicalBindings'],
): boolean {
  return Object.values(value).every(validRef)
    && value.approvedSnapshotRef.refVersion
      === 'private-edit-authority-approved-snapshot-v3'
    && value.selectedSceneRef.refVersion
      === 'canonical-living-frame-selected-scene-binding-v1'
    && value.masterTimingRef.refVersion === 'master-timing-plan-v1'
    && value.confirmedFrameRef.refVersion === 'confirmed-output-frame-v1'
    && value.approvedWorkRef.refVersion === 'canonical-approved-work-item-v1'
    && value.assetManifestEntryRef.refVersion
      === 'private-edit-asset-manifest-entry-v1'
}

function validRef(value: LivingFrameRepresentativePrivateDigestRef): boolean {
  return SAFE_ID.test(value.refId)
    && SAFE_ID.test(value.refVersion)
    && SHA256.test(value.digestSha256)
    && value.canonicalRereadRequired
}

function positiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0
}

function basisPoints(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= 10_000
}

function positiveBasisPoints(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= 10_000
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
