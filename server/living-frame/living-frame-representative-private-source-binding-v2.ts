import {
  LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_V2_VERSION,
  type LivingFrameRepresentativeDurationPreservingFrameMapping,
  type LivingFrameRepresentativeExactStillProbeEvidence,
  type LivingFrameRepresentativeExactVideoProbeEvidence,
  type LivingFrameRepresentativePrivateSourceBindingV2,
  type LivingFrameRepresentativePrivateSourceBindingV2Draft,
  type LivingFrameRepresentativePrivateSourceSelectionV2,
} from '../../src/types/living-frame-representative-private-source-binding-v2'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativeSemanticSourceRouting,
} from '../../src/types/living-frame-representative-semantic-source-routing'
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
import {
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from './living-frame-representative-source-provenance-audit'
import {
  verifyLivingFrameRepresentativeSemanticSourceRouting,
} from './living-frame-representative-semantic-source-routing'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface CompileLivingFrameRepresentativePrivateSourceBindingV2Input {
  readonly sourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly semanticRouting: LivingFrameRepresentativeSemanticSourceRouting
  readonly provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit
  readonly caseId: LivingFrameRepresentativePrivateSourceBindingV2['caseId']
  readonly sourceCandidateId:
    LivingFrameRepresentativePrivateSourceBindingV2['sourceCandidateId']
  readonly authorityRevision: number
  readonly authorityChecksumSha256: string
  readonly mediaAsset: PrivateMediaAssetAuthorityRecord
  readonly storageObject: PrivateStorageObjectAuthorityRecord
  readonly selection: LivingFrameRepresentativePrivateSourceSelectionV2
  readonly evidenceReviews:
    LivingFrameRepresentativePrivateSourceBindingV2Draft['evidenceReviews']
  readonly canonicalBindings:
    LivingFrameRepresentativePrivateSourceBindingV2Draft['canonicalBindings']
}

export function compileLivingFrameRepresentativePrivateSourceBindingV2(
  input: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
): LivingFrameRepresentativePrivateSourceBindingV2 {
  const normalized = assertInput(input)
  const route = normalized.semanticRouting.routes.find(
    (entry) => entry.caseId === normalized.caseId,
  )!
  const sourceCandidateDigestSha256 = candidateDigest(
    normalized.sourceCandidateSet,
    normalized.semanticRouting,
    normalized.sourceCandidateId,
  )
  const storageIdentityDigestSha256 = sha256AuthorityValue({
    storageProvider: normalized.storageObject.storageProvider,
    bucketName: normalized.storageObject.bucketName,
    objectPath: normalized.storageObject.objectPath,
    generation: normalized.storageObject.generation,
    etag: normalized.storageObject.etag,
    metageneration: normalized.storageObject.metageneration,
  })
  const selection = structuredClone(normalized.selection)
  const draft: LivingFrameRepresentativePrivateSourceBindingV2Draft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_V2_VERSION,
    bindingClass:
      'byte_free_semantically_routed_exact_probe_and_frame_binding_candidate',
    supersedesRuntimeUseOfContractVersion:
      'living-frame-representative-private-source-binding-v1',
    legacyV1FixedThirtyFpsAssumptionAdmissible: false,
    semanticRoutingVersion: normalized.semanticRouting.contractVersion,
    semanticRoutingDigestSha256:
      normalized.semanticRouting.routingDigestSha256,
    provenanceAuditVersion: normalized.provenanceAudit.contractVersion,
    provenanceAuditDigestSha256:
      normalized.provenanceAudit.auditDigestSha256,
    caseId: route.caseId,
    semanticTopic: route.semanticTopic,
    sourceRouteDigestSha256: route.sourceRouteDigestSha256,
    sourceCandidateId: normalized.sourceCandidateId,
    sourceCandidateDigestSha256,
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
    createsUploadProbeSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner:
      false,
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

export function verifyLivingFrameRepresentativePrivateSourceBindingV2(
  value: unknown,
  input: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
): value is LivingFrameRepresentativePrivateSourceBindingV2 {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativePrivateSourceBindingV2(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
): CompileLivingFrameRepresentativePrivateSourceBindingV2Input {
  if (
    !exactKeys(input, [
      'sourceCandidateSet', 'semanticRouting', 'provenanceAudit', 'caseId',
      'sourceCandidateId', 'authorityRevision', 'authorityChecksumSha256',
      'mediaAsset', 'storageObject', 'selection', 'evidenceReviews',
      'canonicalBindings',
    ])
    || !verifyLivingFrameRepresentativeMediaSourceCandidateSet(
      input.sourceCandidateSet,
    )
    || !verifyLivingFrameRepresentativeSourceProvenanceAudit(
      input.provenanceAudit,
    )
    || !verifyLivingFrameRepresentativeSemanticSourceRouting(
      input.semanticRouting,
      input.sourceCandidateSet,
      input.provenanceAudit,
    )
    || input.semanticRouting.sourceCandidateSetDigestSha256
      !== input.sourceCandidateSet.candidateSetDigestSha256
    || input.provenanceAudit.sourceCandidateSetDigestSha256
      !== input.sourceCandidateSet.candidateSetDigestSha256
    || input.semanticRouting.provenanceAuditDigestSha256
      !== input.provenanceAudit.auditDigestSha256
    || input.semanticRouting.currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime
      !== true
    || input.semanticRouting.canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired
      !== true
  ) throw new Error('Invalid Living Frame representative semantic authority.')
  const route = input.semanticRouting.routes.find(
    (entry) => entry.caseId === input.caseId,
  )
  if (
    !route
    || !route.effectiveSourceCandidateIds.includes(input.sourceCandidateId)
    || route.existingV1AdmissionMayDriveRepresentativeRender
    || !route.canonicalV2CandidateSetAndAdmissionRequired
  ) throw new Error('Living Frame source is not in the exact semantic route.')
  const expected = expectedSource(
    input.sourceCandidateSet,
    input.semanticRouting,
    input.sourceCandidateId,
  )
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
    || mediaAsset.mimeType !== expected.contentType
    || mediaAsset.sizeBytes !== storageObject.sizeBytes
    || mediaAsset.checksumSha256 !== storageObject.checksumSha256
    || mediaAsset.integrityVerified !== true
    || storageObject.integrityVerified !== true
    || mediaAsset.checksumSource !== 'server_computed_bytes'
    || storageObject.checksumSource !== 'server_computed_bytes'
    || mediaAsset.mockOnly !== true
    || storageObject.mockOnly !== true
    || !validSelection(input.selection, expected.contentType, mediaAsset)
    || !validEvidenceReviews(
      input.evidenceReviews,
      expected.publicityReviewRequired,
      expected.factSafetyRequired,
    )
    || !validCanonicalBindings(input.canonicalBindings)
  ) throw new Error('Invalid Living Frame representative v2 source input.')
  return { ...input, mediaAsset, storageObject }
}

function expectedSource(
  sourceCandidateSet: LivingFrameRepresentativeMediaSourceCandidateSet,
  routing: LivingFrameRepresentativeSemanticSourceRouting,
  sourceCandidateId:
    LivingFrameRepresentativePrivateSourceBindingV2['sourceCandidateId'],
): {
  contentType: string
  publicityReviewRequired: boolean
  factSafetyRequired: boolean
} {
  if (
    sourceCandidateId
      === routing.additionalSourceCandidate.sourceCandidateId
  ) return {
    contentType: routing.additionalSourceCandidate.expectedContentType,
    publicityReviewRequired:
      routing.additionalSourceCandidate.publicityOrPersonUseReviewRequired,
    factSafetyRequired: false,
  }
  const candidate = sourceCandidateSet.sources.find((entry) =>
    entry.sourceCandidateId === sourceCandidateId)
  if (!candidate) {
    throw new Error('Unknown Living Frame representative source candidate.')
  }
  return {
    contentType: candidate.expectedContentType,
    publicityReviewRequired:
      candidate.publicityOrPersonUseReviewRequired,
    factSafetyRequired:
      candidate.factualOrArchivalUseRequiresDocumentaryFactSafety,
  }
}

function candidateDigest(
  sourceCandidateSet: LivingFrameRepresentativeMediaSourceCandidateSet,
  routing: LivingFrameRepresentativeSemanticSourceRouting,
  sourceCandidateId:
    LivingFrameRepresentativePrivateSourceBindingV2['sourceCandidateId'],
): string {
  return sourceCandidateId === routing.additionalSourceCandidate.sourceCandidateId
    ? routing.additionalSourceCandidate.candidateDigestSha256
    : sourceCandidateSet.sources.find((entry) =>
      entry.sourceCandidateId === sourceCandidateId)!.candidateDigestSha256
}

function validSelection(
  selection: LivingFrameRepresentativePrivateSourceSelectionV2,
  expectedContentType: string,
  mediaAsset: PrivateMediaAssetAuthorityRecord,
): boolean {
  if (selection.selectionKind === 'video_segment_v2') {
    return exactKeys(selection, [
      'selectionKind', 'sourceSequenceItemId', 'rangeId', 'sourceStartFrame',
      'sourceEndFrameExclusive', 'evidenceIds', 'phraseBoundaryAligned',
      'preservesSourceMeaning', 'userReviewRequired', 'sourceProbeEvidence',
      'frameMapping', 'contentAnalysisEvidenceRef',
    ])
      && expectedContentType === 'video/webm'
      && SAFE_ID.test(selection.sourceSequenceItemId)
      && SAFE_ID.test(selection.rangeId)
      && Number.isSafeInteger(selection.sourceStartFrame)
      && selection.sourceStartFrame >= 0
      && Number.isSafeInteger(selection.sourceEndFrameExclusive)
      && selection.sourceEndFrameExclusive > selection.sourceStartFrame
      && selection.evidenceIds.length >= 1
      && selection.evidenceIds.length <= 128
      && new Set(selection.evidenceIds).size === selection.evidenceIds.length
      && selection.evidenceIds.every((id) => SAFE_ID.test(id))
      && selection.phraseBoundaryAligned
      && selection.preservesSourceMeaning
      && !selection.userReviewRequired
      && validVideoProbe(selection.sourceProbeEvidence, mediaAsset)
      && selection.sourceEndFrameExclusive
        <= selection.sourceProbeEvidence.decodedFrameCount
      && validFrameMapping(
        selection.frameMapping,
        selection.sourceProbeEvidence,
        selection.sourceEndFrameExclusive - selection.sourceStartFrame,
      )
      && validRef(selection.contentAnalysisEvidenceRef)
      && selection.contentAnalysisEvidenceRef.refVersion
        === 'canonical-source-led-content-analysis-evidence-v1'
  }
  if (selection.selectionKind === 'still_crop_v2') {
    return exactKeys(selection, [
      'selectionKind', 'sourceProbeEvidence', 'cropXBp', 'cropYBp',
      'cropWidthBp', 'cropHeightBp', 'cropPreservesClaimContext',
    ])
      && expectedContentType.startsWith('image/')
      && validStillProbe(selection.sourceProbeEvidence, mediaAsset)
      && basisPoints(selection.cropXBp)
      && basisPoints(selection.cropYBp)
      && positiveBasisPoints(selection.cropWidthBp)
      && positiveBasisPoints(selection.cropHeightBp)
      && selection.cropXBp + selection.cropWidthBp <= 10_000
      && selection.cropYBp + selection.cropHeightBp <= 10_000
      && selection.cropPreservesClaimContext
  }
  return exactKeys(selection, [
    'selectionKind', 'sourceMediaAssetId', 'sourceChecksumSha256',
    'sourceByteLength', 'sourceSnapshotRef', 'rowRefIds',
    'citationSetDigestSha256', 'currentSourceRereadCompleted',
    'selectedRowsExactlyMatchApprovedClaimRefs',
  ])
    && expectedContentType === 'application/json'
    && selection.sourceMediaAssetId === mediaAsset.id
    && selection.sourceChecksumSha256 === mediaAsset.checksumSha256
    && selection.sourceByteLength === mediaAsset.sizeBytes
    && validRef(selection.sourceSnapshotRef)
    && selection.sourceSnapshotRef.refVersion
      === 'canonical-source-data-snapshot-v1'
    && selection.rowRefIds.length >= 1
    && selection.rowRefIds.length <= 512
    && new Set(selection.rowRefIds).size === selection.rowRefIds.length
    && selection.rowRefIds.every((id) => SAFE_ID.test(id))
    && SHA256.test(selection.citationSetDigestSha256)
    && selection.currentSourceRereadCompleted
    && selection.selectedRowsExactlyMatchApprovedClaimRefs
}

function validVideoProbe(
  value: LivingFrameRepresentativeExactVideoProbeEvidence,
  mediaAsset: PrivateMediaAssetAuthorityRecord,
): boolean {
  return exactKeys(value, [
    'schemaVersion', 'probeEvidenceRef', 'approvedToolOperationEvidenceRef',
    'toolId', 'operationId',
    'sourceMediaAssetId', 'sourceChecksumSha256', 'sourceByteLength',
    'hasVideo', 'widthPixels', 'heightPixels', 'videoCodec', 'pixelFormat',
    'frameRateMode', 'fpsNumerator', 'fpsDenominator',
    'timeBaseNumerator', 'timeBaseDenominator', 'durationTimeBaseTicks',
    'decodedFrameCount', 'exactDecodedFrameCountVerified',
    'immutableSourceBytesReread',
  ])
    && value.schemaVersion
      === 'living-frame-representative-exact-video-probe-evidence-v1'
    && validRef(value.probeEvidenceRef)
    && value.probeEvidenceRef.refVersion
      === 'living-frame-representative-exact-video-probe-evidence-v1'
    && validRef(value.approvedToolOperationEvidenceRef)
    && value.approvedToolOperationEvidenceRef.refVersion
      === 'approved-tool-operation-evidence-v1'
    && value.toolId === 'ffprobe'
    && value.operationId === 'tool.ffprobe.inspect_approved_media.v1'
    && value.sourceMediaAssetId === mediaAsset.id
    && value.sourceChecksumSha256 === mediaAsset.checksumSha256
    && value.sourceByteLength === mediaAsset.sizeBytes
    && value.hasVideo
    && positiveInteger(value.widthPixels, 16_384)
    && positiveInteger(value.heightPixels, 16_384)
    && SAFE_TOKEN.test(value.videoCodec)
    && SAFE_TOKEN.test(value.pixelFormat)
    && value.frameRateMode === 'constant'
    && positiveInteger(value.fpsNumerator, 240_000)
    && positiveInteger(value.fpsDenominator, 10_000)
    && positiveInteger(value.timeBaseNumerator, 10_000)
    && positiveInteger(value.timeBaseDenominator, 10_000_000)
    && positiveInteger(value.durationTimeBaseTicks, 10_000_000_000)
    && positiveInteger(value.decodedFrameCount, 1_000_000_000)
    && value.durationTimeBaseTicks === roundedTimeBaseTicks(
      value.decodedFrameCount,
      value.fpsNumerator,
      value.fpsDenominator,
      value.timeBaseNumerator,
      value.timeBaseDenominator,
    )
    && value.exactDecodedFrameCountVerified
    && value.immutableSourceBytesReread
}

function validStillProbe(
  value: LivingFrameRepresentativeExactStillProbeEvidence,
  mediaAsset: PrivateMediaAssetAuthorityRecord,
): boolean {
  return exactKeys(value, [
    'schemaVersion', 'probeEvidenceRef', 'approvedToolOperationEvidenceRef',
    'toolId', 'operationId',
    'sourceMediaAssetId', 'sourceChecksumSha256', 'sourceByteLength',
    'widthPixels', 'heightPixels', 'orientation', 'colorSpace',
    'immutableSourceBytesReread',
  ])
    && value.schemaVersion
      === 'living-frame-representative-exact-still-probe-evidence-v1'
    && validRef(value.probeEvidenceRef)
    && value.probeEvidenceRef.refVersion
      === 'living-frame-representative-exact-still-probe-evidence-v1'
    && validRef(value.approvedToolOperationEvidenceRef)
    && value.approvedToolOperationEvidenceRef.refVersion
      === 'approved-tool-operation-evidence-v1'
    && value.toolId === 'sharp'
    && value.operationId === 'tool.sharp.prepare_approved_image_asset.v1'
    && value.sourceMediaAssetId === mediaAsset.id
    && value.sourceChecksumSha256 === mediaAsset.checksumSha256
    && value.sourceByteLength === mediaAsset.sizeBytes
    && positiveInteger(value.widthPixels, 32_768)
    && positiveInteger(value.heightPixels, 32_768)
    && value.orientation === 'normalized_top_left'
    && value.colorSpace === 'srgb'
    && value.immutableSourceBytesReread
}

function validFrameMapping(
  value: LivingFrameRepresentativeDurationPreservingFrameMapping,
  probe: LivingFrameRepresentativeExactVideoProbeEvidence,
  sourceFrameCount: number,
): boolean {
  if (!exactKeys(value, [
    'mappingVersion', 'masterTimingFpsNumerator',
    'masterTimingFpsDenominator', 'masterTimingStartFrame',
    'masterTimingEndFrameExclusive', 'mappingMode',
    'playbackSpeedNumerator', 'playbackSpeedDenominator',
    'durationRoundingPolicy', 'approvedMappingRef',
  ])) return false
  const destinationFrameCount = value.masterTimingEndFrameExclusive
    - value.masterTimingStartFrame
  const expectedDestinationFrameCount = roundedDestinationFrameCount(
    sourceFrameCount,
    probe.fpsNumerator,
    probe.fpsDenominator,
    value.masterTimingFpsNumerator,
    value.masterTimingFpsDenominator,
  )
  const ratesEqual = reducedRatioEqual(
    probe.fpsNumerator,
    probe.fpsDenominator,
    value.masterTimingFpsNumerator,
    value.masterTimingFpsDenominator,
  )
  return value.mappingVersion
      === 'living-frame-source-to-master-timing-frame-mapping-v1'
    && positiveInteger(value.masterTimingFpsNumerator, 240_000)
    && positiveInteger(value.masterTimingFpsDenominator, 10_000)
    && Number.isSafeInteger(value.masterTimingStartFrame)
    && value.masterTimingStartFrame >= 0
    && Number.isSafeInteger(value.masterTimingEndFrameExclusive)
    && value.masterTimingEndFrameExclusive > value.masterTimingStartFrame
    && destinationFrameCount === expectedDestinationFrameCount
    && value.mappingMode === (ratesEqual
      ? 'exact_frame_identity'
      : 'duration_preserving_cfr_resample')
    && value.playbackSpeedNumerator === 1
    && value.playbackSpeedDenominator === 1
    && value.durationRoundingPolicy
      === 'nearest_destination_frame_half_up'
    && validRef(value.approvedMappingRef)
    && value.approvedMappingRef.refVersion
      === 'canonical-duration-preserving-cfr-frame-mapping-v1'
}

function roundedDestinationFrameCount(
  sourceFrameCount: number,
  sourceFpsNumerator: number,
  sourceFpsDenominator: number,
  destinationFpsNumerator: number,
  destinationFpsDenominator: number,
): number {
  const numerator = BigInt(sourceFrameCount)
    * BigInt(sourceFpsDenominator)
    * BigInt(destinationFpsNumerator)
  const denominator = BigInt(sourceFpsNumerator)
    * BigInt(destinationFpsDenominator)
  const rounded = (numerator * 2n + denominator) / (denominator * 2n)
  return Number(rounded)
}

function roundedTimeBaseTicks(
  frameCount: number,
  fpsNumerator: number,
  fpsDenominator: number,
  timeBaseNumerator: number,
  timeBaseDenominator: number,
): number {
  const numerator = BigInt(frameCount)
    * BigInt(fpsDenominator)
    * BigInt(timeBaseDenominator)
  const denominator = BigInt(fpsNumerator)
    * BigInt(timeBaseNumerator)
  return Number((numerator * 2n + denominator) / (denominator * 2n))
}

function reducedRatioEqual(
  leftNumerator: number,
  leftDenominator: number,
  rightNumerator: number,
  rightDenominator: number,
): boolean {
  return BigInt(leftNumerator) * BigInt(rightDenominator)
    === BigInt(rightNumerator) * BigInt(leftDenominator)
}

function validEvidenceReviews(
  value: LivingFrameRepresentativePrivateSourceBindingV2Draft['evidenceReviews'],
  publicityRequired: boolean,
  factSafetyRequired: boolean,
): boolean {
  return exactKeys(value, [
    'licenseReviewRef', 'attributionReviewRef', 'publicityReviewRef',
    'documentaryFactSafetyRef', 'allRequiredReviewsCompleted',
    'customerOrPublicUseAuthorized',
  ])
    && validRef(value.licenseReviewRef)
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
  value: LivingFrameRepresentativePrivateSourceBindingV2Draft['canonicalBindings'],
): boolean {
  return exactKeys(value, [
    'approvedSnapshotRef', 'selectedSceneRef', 'masterTimingRef',
    'confirmedFrameRef', 'approvedWorkRef', 'assetManifestEntryRef',
  ])
    && Object.values(value).every(validRef)
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

function validRef(value: {
  readonly refId: string
  readonly refVersion: string
  readonly digestSha256: string
  readonly canonicalRereadRequired: true
}): boolean {
  return exactKeys(value, [
    'refId', 'refVersion', 'digestSha256', 'canonicalRereadRequired',
  ])
    && SAFE_ID.test(value.refId)
    && SAFE_ID.test(value.refVersion)
    && SHA256.test(value.digestSha256)
    && value.canonicalRereadRequired
}

function exactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function positiveInteger(value: number, maximum: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= maximum
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
