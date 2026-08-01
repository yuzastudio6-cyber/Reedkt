import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

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
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativePrivateSourceBindingV2,
  type CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
  verifyLivingFrameRepresentativePrivateSourceBindingV2,
} from '../living-frame/living-frame-representative-private-source-binding-v2'
import {
  compileLivingFrameRepresentativeSemanticSourceRouting,
} from '../living-frame/living-frame-representative-semantic-source-routing'
import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'

const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()
const provenanceAudit =
  compileLivingFrameRepresentativeSourceProvenanceAudit()
const semanticRouting =
  compileLivingFrameRepresentativeSemanticSourceRouting(
    sourceCandidateSet,
    provenanceAudit,
  )

const interviewInput = inputFor(
  'living_a_roll_compositing_case',
  'nasa_earth_day_expert_interview_public_domain_candidate',
  (asset) => videoSelection(asset, {
    sourceSequenceItemId: 'source-sequence-nasa-interview',
    rangeId: 'range-earth-day-explanation',
    sourceStartFrame: 300,
    sourceEndFrameExclusive: 1_300,
    sourceFrameCount: 11_188,
    sourceFpsNumerator: 30_000,
    sourceFpsDenominator: 1_001,
    sourceTimeBaseNumerator: 1,
    sourceTimeBaseDenominator: 1_000,
    masterTimingFpsNumerator: 24,
    masterTimingFpsDenominator: 1,
    masterTimingStartFrame: 120,
  }),
)
const brollInput = inputFor(
  'attention_focus_and_semantic_scale_case',
  'nasa_earth_day_cut_broll_public_domain_candidate',
  (asset) => videoSelection(asset, {
    sourceSequenceItemId: 'source-sequence-nasa-earth-day-broll',
    rangeId: 'range-community-science-broll',
    sourceStartFrame: 900,
    sourceEndFrameExclusive: 1_200,
    sourceFrameCount: 9_930,
    sourceFpsNumerator: 30,
    sourceFpsDenominator: 1,
    sourceTimeBaseNumerator: 1,
    sourceTimeBaseDenominator: 1_000,
    masterTimingFpsNumerator: 30,
    masterTimingFpsDenominator: 1,
    masterTimingStartFrame: 180,
  }),
)
const stillInput = inputFor(
  'living_archive_case',
  'nasa_strait_of_hormuz_satellite_public_domain_candidate',
  (asset) => ({
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
      widthPixels: 4_110,
      heightPixels: 4_110,
      orientation: 'normalized_top_left',
      colorSpace: 'srgb',
      immutableSourceBytesReread: true,
    },
    cropXBp: 900,
    cropYBp: 1_100,
    cropWidthBp: 7_600,
    cropHeightBp: 7_400,
    cropPreservesClaimContext: true,
  }),
)
const dataInput = inputFor(
  'maps_routes_and_data_graphics_case',
  'eia_world_oil_chokepoint_data_official_source_candidate',
  (asset) => ({
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
  }),
)

const bindings = [
  interviewInput,
  brollInput,
  stillInput,
  dataInput,
].map((input) => {
  const binding =
    compileLivingFrameRepresentativePrivateSourceBindingV2(input)
  assert.equal(
    verifyLivingFrameRepresentativePrivateSourceBindingV2(binding, input),
    true,
  )
  assert.equal(Object.isFrozen(binding), true)
  assert.equal(
    binding.supersedesRuntimeUseOfContractVersion,
    'living-frame-representative-private-source-binding-v1',
  )
  assert.equal(binding.legacyV1FixedThirtyFpsAssumptionAdmissible, false)
  assert.equal(binding.canonicalConsumptionPending, true)
  assert.equal(binding.sourceBytesSerialized, false)
  assert.equal(binding.storageBucketOrPathSerialized, false)
  assert.equal(binding.externalUrlSerialized, false)
  assert.equal(binding.rawTranscriptSerialized, false)
  assert.equal(
    binding.createsUploadProbeSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner,
    false,
  )
  assert.equal(binding.operationRegistered, false)
  assert.equal(binding.dispatchGranted, false)
  assert.equal(binding.runtimeExecuted, false)
  assert.equal(binding.assetCreated, false)
  assert.equal(binding.customerCharged, false)
  assert.equal(binding.publicDeliveryReady, false)
  assert.equal(binding.productionReady, false)
  const serialized = JSON.stringify(binding)
  assert.equal(serialized.includes(input.mediaAsset.storageBucket), false)
  assert.equal(serialized.includes(input.mediaAsset.storagePath), false)
  assert.equal(serialized.includes(input.mediaAsset.fileName), false)
  return binding
})

assert.deepEqual(
  bindings.map((binding) => binding.selection.selectionKind),
  [
    'video_segment_v2',
    'video_segment_v2',
    'still_crop_v2',
    'structured_data_rows_v2',
  ],
)
const interviewSelection = bindings[0]!.selection
assert.equal(interviewSelection.selectionKind, 'video_segment_v2')
if (interviewSelection.selectionKind !== 'video_segment_v2') {
  throw new Error('Expected video selection.')
}
assert.equal(interviewSelection.sourceProbeEvidence.fpsNumerator, 30_000)
assert.equal(interviewSelection.sourceProbeEvidence.fpsDenominator, 1_001)
assert.equal(
  interviewSelection.frameMapping.mappingMode,
  'duration_preserving_cfr_resample',
)
assert.equal(
  interviewSelection.frameMapping.masterTimingEndFrameExclusive
    - interviewSelection.frameMapping.masterTimingStartFrame,
  801,
)
const brollSelection = bindings[1]!.selection
assert.equal(brollSelection.selectionKind, 'video_segment_v2')
if (brollSelection.selectionKind !== 'video_segment_v2') {
  throw new Error('Expected B-roll video selection.')
}
assert.equal(
  brollSelection.frameMapping.masterTimingEndFrameExclusive
    - brollSelection.frameMapping.masterTimingStartFrame,
  300,
)
assert.equal(brollSelection.frameMapping.mappingMode, 'exact_frame_identity')
assert.equal(
  new Set(bindings.map((binding) => binding.bindingDigestSha256)).size,
  bindings.length,
)

let adversarialChecks = 0
const reject = (
  base: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
  mutate: (
    value: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
  ) => void,
) => {
  const candidate = structuredClone(base)
  mutate(candidate)
  assert.throws(() =>
    compileLivingFrameRepresentativePrivateSourceBindingV2(candidate))
  adversarialChecks += 1
}

reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.sourceProbeEvidence as { fpsNumerator: number }).fpsNumerator = 30
  ;(selection.sourceProbeEvidence as { fpsDenominator: number }).fpsDenominator = 1
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.sourceProbeEvidence as { frameRateMode: string }).frameRateMode =
    'variable'
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.sourceProbeEvidence as { sourceChecksumSha256: string })
    .sourceChecksumSha256 = sha('forged-source-bytes')
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.sourceProbeEvidence as { decodedFrameCount: number })
    .decodedFrameCount = selection.sourceEndFrameExclusive - 1
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.frameMapping as { masterTimingEndFrameExclusive: number })
    .masterTimingEndFrameExclusive += 1
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.frameMapping as { mappingMode: string }).mappingMode =
    'exact_frame_identity'
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.frameMapping as { playbackSpeedNumerator: number })
    .playbackSpeedNumerator = 2
})
reject(interviewInput, (value) => {
  const selection = video(value)
  ;(selection.sourceProbeEvidence as unknown as Record<string, unknown>)
    .sourceUrl = 'https://example.invalid/source.webm'
})
reject(interviewInput, (value) => {
  ;(value as unknown as Record<string, unknown>).rawChat =
    'animate this however you want'
})
reject(interviewInput, (value) => {
  ;(value as unknown as Record<string, unknown>).sourceCandidateId =
    'nasa_strait_of_hormuz_satellite_public_domain_candidate'
})
reject(brollInput, (value) => {
  ;(value.semanticRouting.additionalSourceCandidate as {
    sourceMotionOnlyNoGeneratedLivingSubjectAnimation: boolean
  }).sourceMotionOnlyNoGeneratedLivingSubjectAnimation = false
})
reject(stillInput, (value) => {
  const selection = value.selection as {
    sourceProbeEvidence: { sourceByteLength: number }
  }
  selection.sourceProbeEvidence.sourceByteLength += 1
})
reject(stillInput, (value) => {
  const selection = value.selection as unknown as {
    sourceProbeEvidence: Record<string, unknown>
  }
  selection.sourceProbeEvidence.localPath = '/tmp/source.jpg'
})
reject(dataInput, (value) => {
  const selection = value.selection as unknown as { rowRefIds: string[] }
  selection.rowRefIds = ['row-duplicate', 'row-duplicate']
})
reject(dataInput, (value) => {
  const selection = value.selection as {
    selectedRowsExactlyMatchApprovedClaimRefs: boolean
  }
  selection.selectedRowsExactlyMatchApprovedClaimRefs = false
})
reject(dataInput, (value) => {
  const selection = value.selection as { sourceChecksumSha256: string }
  selection.sourceChecksumSha256 = sha('substituted-data')
})
reject(dataInput, (value) => {
  ;(value.semanticRouting as {
    currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime: boolean
  }).currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime = false
})
reject(dataInput, (value) => {
  ;(value.evidenceReviews as {
    customerOrPublicUseAuthorized: boolean
  }).customerOrPublicUseAuthorized = true
})
reject(dataInput, (value) => {
  ;(value.canonicalBindings.masterTimingRef as { refVersion: string })
    .refVersion = 'caller-timing-v1'
})
assert.equal(adversarialChecks, 19)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_private_source_binding_v2',
  status: 'passed_source_only_exact_probe_and_frame_mapping',
  contractVersion: bindings[0]!.contractVersion,
  bindingCount: bindings.length,
  semanticRoutingDigestSha256:
    bindings[0]!.semanticRoutingDigestSha256,
  nonIntegerSourceFrameRateAcceptedExactly: '30000/1001',
  fixedThirtyFpsAssumptionRejected: true,
  variableFrameRateRejected: true,
  deterministicDurationPreservingMappingVerified: true,
  topicMatchedBrollCandidateBound: true,
  externalMediaBytesFetched: false,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function inputFor(
  caseId: CompileLivingFrameRepresentativePrivateSourceBindingV2Input['caseId'],
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
  selectionBuilder: (
    mediaAsset: PrivateMediaAssetAuthorityRecord,
  ) => LivingFrameRepresentativePrivateSourceSelectionV2,
): CompileLivingFrameRepresentativePrivateSourceBindingV2Input {
  const original = sourceCandidateSet.sources.find((entry) =>
    entry.sourceCandidateId === sourceCandidateId)
  const contentType = original?.expectedContentType
    ?? semanticRouting.additionalSourceCandidate.expectedContentType
  const order = original?.order ?? sourceCandidateSet.sources.length
  const suffix = sourceCandidateId.replace(/_candidate$/u, '')
  const uploadIntentId = `upload-${suffix}`
  const mediaAssetId = `media-${suffix}`
  const storageObjectRecordId = `storage-${suffix}`
  const checksumSha256 = sha(`bytes:${suffix}`)
  const objectPath = `workspaces/workspace-lf-representative/${suffix}/source`
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
    sizeBytes: 8_192 + order,
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
    authorityChecksumSha256: sha(`authority:${suffix}`),
    mediaAsset,
    storageObject,
    selection: selectionBuilder(mediaAsset),
    evidenceReviews: reviews(),
    canonicalBindings: canonicalBindings(`${caseId}-${suffix}`),
  }
}

function videoSelection(
  asset: PrivateMediaAssetAuthorityRecord,
  input: {
    sourceSequenceItemId: string
    rangeId: string
    sourceStartFrame: number
    sourceEndFrameExclusive: number
    sourceFrameCount: number
    sourceFpsNumerator: number
    sourceFpsDenominator: number
    sourceTimeBaseNumerator: number
    sourceTimeBaseDenominator: number
    masterTimingFpsNumerator: number
    masterTimingFpsDenominator: number
    masterTimingStartFrame: number
  },
): LivingFrameRepresentativePrivateSourceSelectionV2 {
  const selectedFrameCount = input.sourceEndFrameExclusive
    - input.sourceStartFrame
  const destinationFrameCount = roundHalfUp(
    BigInt(selectedFrameCount)
      * BigInt(input.sourceFpsDenominator)
      * BigInt(input.masterTimingFpsNumerator),
    BigInt(input.sourceFpsNumerator)
      * BigInt(input.masterTimingFpsDenominator),
  )
  const durationTicks = roundHalfUp(
    BigInt(input.sourceFrameCount)
      * BigInt(input.sourceFpsDenominator)
      * BigInt(input.sourceTimeBaseDenominator),
    BigInt(input.sourceFpsNumerator)
      * BigInt(input.sourceTimeBaseNumerator),
  )
  return {
    selectionKind: 'video_segment_v2',
    sourceSequenceItemId: input.sourceSequenceItemId,
    rangeId: input.rangeId,
    sourceStartFrame: input.sourceStartFrame,
    sourceEndFrameExclusive: input.sourceEndFrameExclusive,
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
      fpsNumerator: input.sourceFpsNumerator,
      fpsDenominator: input.sourceFpsDenominator,
      timeBaseNumerator: input.sourceTimeBaseNumerator,
      timeBaseDenominator: input.sourceTimeBaseDenominator,
      durationTimeBaseTicks: durationTicks,
      decodedFrameCount: input.sourceFrameCount,
      exactDecodedFrameCountVerified: true,
      immutableSourceBytesReread: true,
    },
    frameMapping: {
      mappingVersion:
        'living-frame-source-to-master-timing-frame-mapping-v1',
      masterTimingFpsNumerator: input.masterTimingFpsNumerator,
      masterTimingFpsDenominator: input.masterTimingFpsDenominator,
      masterTimingStartFrame: input.masterTimingStartFrame,
      masterTimingEndFrameExclusive:
        input.masterTimingStartFrame + destinationFrameCount,
      mappingMode: input.sourceFpsNumerator
          * input.masterTimingFpsDenominator
        === input.masterTimingFpsNumerator
          * input.sourceFpsDenominator
        ? 'exact_frame_identity'
        : 'duration_preserving_cfr_resample',
      playbackSpeedNumerator: 1,
      playbackSpeedDenominator: 1,
      durationRoundingPolicy: 'nearest_destination_frame_half_up',
      approvedMappingRef: ref(
        `mapping-${asset.id}`,
        'canonical-duration-preserving-cfr-frame-mapping-v1',
      ),
    },
    contentAnalysisEvidenceRef: ref(
      `source-analysis-${asset.id}`,
      'canonical-source-led-content-analysis-evidence-v1',
    ),
  }
}

function video(
  input: CompileLivingFrameRepresentativePrivateSourceBindingV2Input,
) {
  const selection = input.selection
  if (selection.selectionKind !== 'video_segment_v2') {
    throw new Error('Expected video selection.')
  }
  return selection
}

function reviews(): LivingFrameRepresentativePrivateSourceBindingV2Draft['evidenceReviews'] {
  return {
    licenseReviewRef: ref(
      'license-review-representative-source-v2',
      'license-review-complete-v1',
    ),
    attributionReviewRef: ref(
      'attribution-review-representative-source-v2',
      'attribution-review-complete-v1',
    ),
    publicityReviewRef: ref(
      'publicity-review-representative-source-v2',
      'publicity-review-complete-v1',
    ),
    documentaryFactSafetyRef: ref(
      'fact-safety-review-representative-source-v2',
      'documentary-fact-safety-reviewed-v1',
    ),
    allRequiredReviewsCompleted: true,
    customerOrPublicUseAuthorized: false,
  }
}

function canonicalBindings(
  suffix: string,
): LivingFrameRepresentativePrivateSourceBindingV2Draft['canonicalBindings'] {
  return {
    approvedSnapshotRef: ref(
      `snapshot-${suffix}`,
      'private-edit-authority-approved-snapshot-v3',
    ),
    selectedSceneRef: ref(
      `scene-${suffix}`,
      'canonical-living-frame-selected-scene-binding-v1',
    ),
    masterTimingRef: ref(`timing-${suffix}`, 'master-timing-plan-v1'),
    confirmedFrameRef: ref(`frame-${suffix}`, 'confirmed-output-frame-v1'),
    approvedWorkRef: ref(
      `work-${suffix}`,
      'canonical-approved-work-item-v1',
    ),
    assetManifestEntryRef: ref(
      `asset-${suffix}`,
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
