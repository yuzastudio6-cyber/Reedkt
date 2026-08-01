import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
  type LivingFrameActiveNonIllustrationCaseId,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativePrivateSourceBindingV2Draft,
  LivingFrameRepresentativePrivateSourceSelectionV2,
} from '../../src/types/living-frame-representative-private-source-binding-v2'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import type {
  PrivateMediaAssetAuthorityRecord,
  PrivateStorageObjectAuthorityRecord,
} from '../validation/private-upload-media-authority-schemas'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeCaseSourceAdmissionV2,
  type CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
  type LivingFrameRepresentativeCasePrivateBindingV2Input,
  verifyLivingFrameRepresentativeCaseSourceAdmissionV2,
} from '../living-frame/living-frame-representative-case-source-admission-v2'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativePrivateSourceBindingV2,
  type CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
} from '../living-frame/living-frame-representative-private-source-binding-v2'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'

const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
const representativeVisualFixture =
  compileLivingFrameRepresentativeVisualFixtureManifest(ownerScopeAmendment)
const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenanceAudit =
  compileLivingFrameRepresentativeSourceProvenanceAudit()
const semanticRouting =
  compileLivingFrameRepresentativeSemanticSourceRouting(
    sourceCandidateSet,
    provenanceAudit,
  )

const inputs = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map(
  (caseId): CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input => ({
    ownerScopeAmendment,
    representativeVisualFixture,
    sourceCandidateSet,
    provenanceAudit,
    semanticRouting,
    caseId,
    privateBindings: semanticRouting.routes.find(
      (entry) => entry.caseId === caseId,
    )!.effectiveSourceCandidateIds.map((sourceCandidateId) =>
      privateBinding(caseId, sourceCandidateId)),
  }),
)
const admissions = inputs.map((input) => {
  const admission =
    compileLivingFrameRepresentativeCaseSourceAdmissionV2(input)
  assert.equal(
    verifyLivingFrameRepresentativeCaseSourceAdmissionV2(admission, input),
    true,
  )
  assert.equal(Object.isFrozen(admission), true)
  assert.equal(
    admission.supersedesRuntimeUseOfContractVersion,
    'living-frame-representative-case-source-admission-v1',
  )
  assert.equal(admission.legacyV1AdmissionMayDriveRepresentativeRender, false)
  assert.equal(admission.exactSemanticRequiredCandidateSetBound, true)
  assert.equal(
    admission.everyVideoSourceUsesExactProbeAndRationalFrameMapping,
    true,
  )
  assert.equal(admission.everyStillSourceUsesExactProbeBeforeCrop, true)
  assert.equal(
    admission.everyDataSourceUsesExactSnapshotRowsAndCitations,
    true,
  )
  assert.equal(
    admission.missingExtraReorderedOrDuplicateSourceBindingAccepted,
    false,
  )
  assert.equal(admission.crossCaseOrSemanticTopicSourceBindingAccepted, false)
  assert.equal(
    admission.crossSnapshotSceneTimingOrFrameBindingAccepted,
    false,
  )
  assert.equal(admission.duplicateWorkOrManifestEntryAccepted, false)
  assert.equal(admission.canonicalConsumptionPending, true)
  assert.equal(admission.runtimeExecuted, false)
  assert.equal(admission.productionReady, false)
  assert.deepEqual(
    admission.assignments.map((entry) => entry.sourceCandidateId),
    admission.requiredSourceCandidateIds,
  )
  return admission
})

assert.deepEqual(
  admissions.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.equal(
  admissions.reduce((total, entry) => total + entry.assignments.length, 0),
  26,
)
assert.deepEqual(
  admissions[0]!.assignments.map((entry) => entry.sourceUse),
  ['primary_a_roll', 'topic_matched_supporting_broll'],
)
assert.deepEqual(
  admissions[4]!.requiredSourceCandidateIds,
  ['scientific_method_diagram_public_domain_candidate'],
)
assert.deepEqual(
  admissions[6]!.requiredSourceCandidateIds,
  [
    'nasa_strait_of_hormuz_satellite_public_domain_candidate',
    'historical_strait_of_hormuz_map_public_domain_candidate',
    'eia_world_oil_chokepoint_data_official_source_candidate',
  ],
)
assert.equal(admissions[11]!.assignments.length, 8)
assert.equal(
  admissions[11]!.assignments.every((entry) =>
    entry.sourceUse === 'final_review_source_lineage'),
  true,
)
assert.equal(
  admissions[5]!.nonSourceDependencyRoles.includes(
    'approved_non_character_still',
  ),
  true,
)
assert.equal(
  admissions[7]!.nonSourceDependencyRoles.includes(
    'approved_non_character_still',
  ),
  true,
)
assert.equal(
  admissions.every((entry) =>
    entry.assignments.every((assignment) =>
      assignment.privateSourceBindingVersion
        === 'living-frame-representative-private-source-binding-v2')),
  true,
)

let adversarialChecks = 0
const reject = (
  base: CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
  mutate: (
    value: CompileLivingFrameRepresentativeCaseSourceAdmissionV2Input,
  ) => void,
) => {
  const candidate = structuredClone(base)
  mutate(candidate)
  assert.throws(() =>
    compileLivingFrameRepresentativeCaseSourceAdmissionV2(candidate))
  adversarialChecks += 1
}
const twoSource = inputs[0]!
const finalReview = inputs[11]!
reject(twoSource, (value) => {
  ;(value as unknown as { privateBindings: unknown[] })
    .privateBindings.pop()
})
reject(twoSource, (value) => {
  const mutable = value as unknown as { privateBindings: unknown[] }
  mutable.privateBindings.push(structuredClone(mutable.privateBindings[0]))
})
reject(twoSource, (value) => {
  ;(value as unknown as { privateBindings: unknown[] })
    .privateBindings.reverse()
})
reject(twoSource, (value) => {
  const mutable = value as unknown as { privateBindings: unknown[] }
  mutable.privateBindings[1] = structuredClone(mutable.privateBindings[0])
})
reject(twoSource, (value) => {
  const secondCaseBinding = inputs[5]!.privateBindings[0]!
  ;(value as unknown as { privateBindings: unknown[] }).privateBindings[0] =
    structuredClone(secondCaseBinding)
})
reject(twoSource, (value) => {
  const binding = value.privateBindings[1]!.binding
  ;(binding.canonicalBindings.approvedSnapshotRef as { refId: string })
    .refId = 'snapshot-cross-lineage'
})
reject(twoSource, (value) => {
  const first = value.privateBindings[0]!.binding
  const second = value.privateBindings[1]!.binding
  ;(second.canonicalBindings.approvedWorkRef as { digestSha256: string })
    .digestSha256 = first.canonicalBindings.approvedWorkRef.digestSha256
})
reject(twoSource, (value) => {
  ;(value.privateBindings[0]!.binding as {
    contractVersion: string
  }).contractVersion = 'living-frame-representative-private-source-binding-v1'
})
reject(twoSource, (value) => {
  ;(value.semanticRouting.routes[0] as {
    semanticTopic: string
  }).semanticTopic = 'historical_and_modern_hormuz_geography'
})
reject(twoSource, (value) => {
  const selection = value.privateBindings[0]!.binding.selection
  if (selection.selectionKind !== 'video_segment_v2') {
    throw new Error('Expected video selection.')
  }
  ;(selection.sourceProbeEvidence as {
    sourceChecksumSha256: string
  }).sourceChecksumSha256 = sha('forged-probe-source')
})
reject(finalReview, (value) => {
  ;(value.ownerScopeAmendment.ownerDecision as {
    mechanicalRiggingPausedPendingSeparateOwnerSpecification: boolean
  }).mechanicalRiggingPausedPendingSeparateOwnerSpecification = false
})
reject(finalReview, (value) => {
  ;(value as unknown as Record<string, unknown>).rawChat =
    'reuse any asset from any chapter'
})
assert.equal(adversarialChecks, 12)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_case_source_admission_v2',
  status: 'passed_source_only_semantic_route_exact_probe_admission',
  contractVersion: admissions[0]!.contractVersion,
  activeCaseCount: admissions.length,
  privateSourceBindingCount: admissions.reduce(
    (total, entry) => total + entry.assignments.length,
    0,
  ),
  topicMatchedBrollAdmissionCount: admissions.filter((entry) =>
    entry.assignments.some((assignment) =>
      assignment.sourceUse === 'topic_matched_supporting_broll')).length,
  exactProbeAndRationalFrameMappingRequired: true,
  legacyV1AdmissionMayDriveRepresentativeRender: false,
  missingExtraReorderedDuplicateOrCrossTopicAccepted: false,
  visualFixtureRouteRoleReconciliationPending: true,
  hybridAndAttentionDerivedStillRolePending: true,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function privateBinding(
  caseId: LivingFrameActiveNonIllustrationCaseId,
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
): LivingFrameRepresentativeCasePrivateBindingV2Input {
  const compileInput = privateBindingInput(caseId, sourceCandidateId)
  return {
    compileInput,
    binding: compileLivingFrameRepresentativePrivateSourceBindingV2(
      compileInput,
    ),
  }
}

function privateBindingInput(
  caseId: LivingFrameActiveNonIllustrationCaseId,
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
): CompileLivingFrameRepresentativePrivateSourceBindingV2Input {
  const original = sourceCandidateSet.sources.find((entry) =>
    entry.sourceCandidateId === sourceCandidateId)
  const contentType = original?.expectedContentType
    ?? semanticRouting.additionalSourceCandidate.expectedContentType
  const order = original?.order ?? sourceCandidateSet.sources.length
  const suffix = sourceCandidateId.replace(/_candidate$/u, '')
  const uploadIntentId = `upload-${caseId}-${suffix}`
  const mediaAssetId = `media-${caseId}-${suffix}`
  const storageObjectRecordId = `storage-${caseId}-${suffix}`
  const checksumSha256 = sha(`bytes:${sourceCandidateId}`)
  const objectPath = `workspaces/workspace-lf-representative/${caseId}/${suffix}`
  const mediaAsset: PrivateMediaAssetAuthorityRecord = {
    id: mediaAssetId,
    workspaceId: 'workspace-lf-representative',
    projectId: 'project-lf-representative',
    uploadIntentId,
    storageObjectRecordId,
    uploadPurpose: 'source_media',
    assetType: contentType.startsWith('video/')
      ? 'video'
      : contentType === 'application/json'
        ? 'structured-data'
        : 'image',
    fileName: `source-${suffix}`,
    mimeType: contentType,
    storageProvider: 'local_private',
    storageBucket: 'private-upload-smoke',
    storagePath: objectPath,
    sizeBytes: 16_384 + order,
    checksumSha256,
    integrityVerified: true,
    checksumSource: 'server_computed_bytes',
    status: 'uploaded',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
    mockOnly: true,
  }
  const storageObject: PrivateStorageObjectAuthorityRecord = {
    id: storageObjectRecordId,
    workspaceId: mediaAsset.workspaceId,
    projectId: mediaAsset.projectId,
    mediaAssetId,
    uploadIntentId,
    uploadPurpose: 'source_media',
    storageProvider: mediaAsset.storageProvider,
    bucketName: mediaAsset.storageBucket,
    objectPath,
    objectPurpose: 'source_media',
    mimeType: mediaAsset.mimeType,
    sizeBytes: mediaAsset.sizeBytes,
    checksumSha256,
    integrityVerified: true,
    checksumSource: 'server_computed_bytes',
    status: 'ready',
    createdAt: mediaAsset.createdAt,
    updatedAt: mediaAsset.updatedAt,
    mockOnly: true,
  }
  return {
    sourceCandidateSet,
    semanticRouting,
    provenanceAudit,
    caseId,
    sourceCandidateId,
    authorityRevision: order + 1,
    authorityChecksumSha256: sha(`authority:${caseId}:${suffix}`),
    mediaAsset,
    storageObject,
    selection: selection(sourceCandidateId, mediaAsset),
    evidenceReviews: reviews(),
    canonicalBindings: canonicalBindings(caseId, suffix),
  }
}

function selection(
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
  asset: PrivateMediaAssetAuthorityRecord,
): LivingFrameRepresentativePrivateSourceSelectionV2 {
  if (
    sourceCandidateId
      === 'nasa_earth_day_expert_interview_public_domain_candidate'
    || sourceCandidateId
      === 'nasa_earth_day_cut_broll_public_domain_candidate'
  ) return videoSelection(sourceCandidateId, asset)
  if (
    sourceCandidateId
      === 'eia_world_oil_chokepoint_data_official_source_candidate'
  ) return {
    selectionKind: 'structured_data_rows_v2',
    sourceMediaAssetId: asset.id,
    sourceChecksumSha256: asset.checksumSha256,
    sourceByteLength: asset.sizeBytes,
    sourceSnapshotRef: ref(
      asset.id,
      'canonical-source-data-snapshot-v1',
    ),
    rowRefIds: ['row-hormuz-volume', 'row-hormuz-destination'],
    citationSetDigestSha256: sha('eia-citation-set-v2'),
    currentSourceRereadCompleted: true,
    selectedRowsExactlyMatchApprovedClaimRefs: true,
  }
  const dimensions = sourceCandidateId
    === 'nasa_strait_of_hormuz_satellite_public_domain_candidate'
    ? [4_110, 4_110] as const
    : [1_920, 1_080] as const
  return {
    selectionKind: 'still_crop_v2',
    sourceProbeEvidence: {
      schemaVersion:
        'living-frame-representative-exact-still-probe-evidence-v1',
      probeEvidenceRef: ref(
        `probe-${asset.id}`,
        'living-frame-representative-exact-still-probe-evidence-v1',
      ),
      approvedToolOperationEvidenceRef: ref(
        `sharp-operation-${asset.id}`,
        'approved-tool-operation-evidence-v1',
      ),
      toolId: 'sharp',
      operationId: 'tool.sharp.prepare_approved_image_asset.v1',
      sourceMediaAssetId: asset.id,
      sourceChecksumSha256: asset.checksumSha256,
      sourceByteLength: asset.sizeBytes,
      widthPixels: dimensions[0],
      heightPixels: dimensions[1],
      orientation: 'normalized_top_left',
      colorSpace: 'srgb',
      immutableSourceBytesReread: true,
    },
    cropXBp: 0,
    cropYBp: 0,
    cropWidthBp: 10_000,
    cropHeightBp: 10_000,
    cropPreservesClaimContext: true,
  }
}

function videoSelection(
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
  asset: PrivateMediaAssetAuthorityRecord,
): LivingFrameRepresentativePrivateSourceSelectionV2 {
  const interview = sourceCandidateId
    === 'nasa_earth_day_expert_interview_public_domain_candidate'
  const fpsNumerator = interview ? 30_000 : 30
  const fpsDenominator = interview ? 1_001 : 1
  const sourceFrameCount = interview ? 11_188 : 9_930
  const sourceStartFrame = interview ? 300 : 900
  const sourceEndFrameExclusive = sourceStartFrame + 300
  const masterTimingFpsNumerator = 24
  const destinationFrames = roundHalfUp(
    BigInt(sourceEndFrameExclusive - sourceStartFrame)
      * BigInt(fpsDenominator)
      * BigInt(masterTimingFpsNumerator),
    BigInt(fpsNumerator),
  )
  const durationTicks = roundHalfUp(
    BigInt(sourceFrameCount) * BigInt(fpsDenominator) * 1_000n,
    BigInt(fpsNumerator),
  )
  return {
    selectionKind: 'video_segment_v2',
    sourceSequenceItemId: `sequence-${sourceCandidateId}`,
    rangeId: `range-${sourceCandidateId}`,
    sourceStartFrame,
    sourceEndFrameExclusive,
    evidenceIds: ['evidence-transcript-phrase', 'evidence-source-shot'],
    phraseBoundaryAligned: true,
    preservesSourceMeaning: true,
    userReviewRequired: false,
    sourceProbeEvidence: {
      schemaVersion:
        'living-frame-representative-exact-video-probe-evidence-v1',
      probeEvidenceRef: ref(
        `probe-${asset.id}`,
        'living-frame-representative-exact-video-probe-evidence-v1',
      ),
      approvedToolOperationEvidenceRef: ref(
        `ffprobe-operation-${asset.id}`,
        'approved-tool-operation-evidence-v1',
      ),
      toolId: 'ffprobe',
      operationId: 'tool.ffprobe.inspect_approved_media.v1',
      sourceMediaAssetId: asset.id,
      sourceChecksumSha256: asset.checksumSha256,
      sourceByteLength: asset.sizeBytes,
      hasVideo: true,
      widthPixels: 1_920,
      heightPixels: 1_080,
      videoCodec: 'vp9',
      pixelFormat: 'yuv420p',
      frameRateMode: 'constant',
      fpsNumerator,
      fpsDenominator,
      timeBaseNumerator: 1,
      timeBaseDenominator: 1_000,
      durationTimeBaseTicks: durationTicks,
      decodedFrameCount: sourceFrameCount,
      exactDecodedFrameCountVerified: true,
      immutableSourceBytesReread: true,
    },
    frameMapping: {
      mappingVersion:
        'living-frame-source-to-master-timing-frame-mapping-v1',
      masterTimingFpsNumerator,
      masterTimingFpsDenominator: 1,
      masterTimingStartFrame: 120,
      masterTimingEndFrameExclusive: 120 + destinationFrames,
      mappingMode: 'duration_preserving_cfr_resample',
      playbackSpeedNumerator: 1,
      playbackSpeedDenominator: 1,
      durationRoundingPolicy: 'nearest_destination_frame_half_up',
      approvedMappingRef: ref(
        `mapping-${asset.id}`,
        'canonical-duration-preserving-cfr-frame-mapping-v1',
      ),
    },
    contentAnalysisEvidenceRef: ref(
      `analysis-${asset.id}`,
      'canonical-source-led-content-analysis-evidence-v1',
    ),
  }
}

function reviews(): LivingFrameRepresentativePrivateSourceBindingV2Draft['evidenceReviews'] {
  return {
    licenseReviewRef: ref('license-review-v2', 'license-review-complete-v1'),
    attributionReviewRef: ref(
      'attribution-review-v2',
      'attribution-review-complete-v1',
    ),
    publicityReviewRef: ref(
      'publicity-review-v2',
      'publicity-review-complete-v1',
    ),
    documentaryFactSafetyRef: ref(
      'fact-safety-review-v2',
      'documentary-fact-safety-reviewed-v1',
    ),
    allRequiredReviewsCompleted: true,
    customerOrPublicUseAuthorized: false,
  }
}

function canonicalBindings(
  caseId: LivingFrameActiveNonIllustrationCaseId,
  sourceSuffix: string,
): LivingFrameRepresentativePrivateSourceBindingV2Draft['canonicalBindings'] {
  return {
    approvedSnapshotRef: ref(
      `snapshot-${caseId}`,
      'private-edit-authority-approved-snapshot-v3',
    ),
    selectedSceneRef: ref(
      `scene-${caseId}`,
      'canonical-living-frame-selected-scene-binding-v1',
    ),
    masterTimingRef: ref(`timing-${caseId}`, 'master-timing-plan-v1'),
    confirmedFrameRef: ref(`frame-${caseId}`, 'confirmed-output-frame-v1'),
    approvedWorkRef: ref(
      `work-${caseId}-${sourceSuffix}`,
      'canonical-approved-work-item-v1',
    ),
    assetManifestEntryRef: ref(
      `asset-${caseId}-${sourceSuffix}`,
      'private-edit-asset-manifest-entry-v1',
    ),
  }
}

function ref<const T extends string>(refId: string, refVersion: T) {
  return {
    refId,
    refVersion,
    digestSha256: sha(`${refVersion}:${refId}`),
    canonicalRereadRequired: true as const,
  }
}

function roundHalfUp(numerator: bigint, denominator: bigint): number {
  return Number((numerator * 2n + denominator) / (denominator * 2n))
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
