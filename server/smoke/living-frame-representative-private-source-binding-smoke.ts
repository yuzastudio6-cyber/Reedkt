import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameRepresentativePrivateSourceBindingDraft,
  LivingFrameRepresentativePrivateSourceSelection,
} from '../../src/types/living-frame-representative-private-source-binding'
import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  PrivateMediaAssetAuthorityRecord,
  PrivateStorageObjectAuthorityRecord,
} from '../validation/private-upload-media-authority-schemas'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativePrivateSourceBinding,
  type CompileLivingFrameRepresentativePrivateSourceBindingInput,
  verifyLivingFrameRepresentativePrivateSourceBinding,
} from '../living-frame/living-frame-representative-private-source-binding'

const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()

const videoInput = inputFor(
  'nasa_earth_day_expert_interview_public_domain_candidate',
  {
    selectionKind: 'video_segment',
    sourceSequenceItemId: 'source-sequence-nasa-interview',
    rangeId: 'range-earth-day-explanation',
    startFrame: 300,
    endFrameExclusive: 660,
    sourceDurationFrames: 3_600,
    fps: 30,
    evidenceIds: ['evidence-transcript-phrase', 'evidence-speaker-shot'],
    phraseBoundaryAligned: true,
    preservesSourceMeaning: true,
    userReviewRequired: false,
    contentAnalysisEvidenceRef: ref(
      'source-analysis-nasa-interview',
      'canonical-source-led-content-analysis-evidence-v1',
    ),
  },
)
const stillInput = inputFor(
  'nasa_strait_of_hormuz_satellite_public_domain_candidate',
  {
    selectionKind: 'still_crop',
    sourceWidthPixels: 4_110,
    sourceHeightPixels: 4_110,
    cropXBp: 900,
    cropYBp: 1_100,
    cropWidthBp: 7_600,
    cropHeightBp: 7_400,
    cropPreservesClaimContext: true,
  },
)
const dataInput = inputFor(
  'eia_world_oil_chokepoint_data_official_source_candidate',
  {
    selectionKind: 'structured_data_rows',
    sourceSnapshotRef: ref(
      'source-snapshot-eia-chokepoints',
      'canonical-source-data-snapshot-v1',
    ),
    rowRefIds: ['row-hormuz-volume', 'row-hormuz-destination'],
    citationSetDigestSha256: sha('eia-citation-set'),
    currentSourceRereadCompleted: true,
  },
)

const bindings = [videoInput, stillInput, dataInput].map((input) => {
  const binding =
    compileLivingFrameRepresentativePrivateSourceBinding(input)
  assert.equal(
    verifyLivingFrameRepresentativePrivateSourceBinding(binding, input),
    true,
  )
  assert.equal(Object.isFrozen(binding), true)
  assert.equal(binding.canonicalConsumptionPending, true)
  assert.equal(binding.sourceBytesSerialized, false)
  assert.equal(binding.storageBucketOrPathSerialized, false)
  assert.equal(binding.externalUrlSerialized, false)
  assert.equal(binding.rawTranscriptSerialized, false)
  assert.equal(
    binding.createsUploadSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner,
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
  ['video_segment', 'still_crop', 'structured_data_rows'],
)
assert.deepEqual(
  bindings.map((binding) => binding.privateUploadAuthority.contentType),
  ['video/webm', 'image/jpeg', 'application/json'],
)
assert.equal(
  new Set(bindings.map((binding) => binding.bindingDigestSha256)).size,
  bindings.length,
)

let adversarialChecks = 0
const reject = (
  base: CompileLivingFrameRepresentativePrivateSourceBindingInput,
  mutate: (
    value: CompileLivingFrameRepresentativePrivateSourceBindingInput,
  ) => void,
) => {
  const candidate = structuredClone(base)
  mutate(candidate)
  assert.throws(() =>
    compileLivingFrameRepresentativePrivateSourceBinding(candidate))
  adversarialChecks += 1
}

reject(videoInput, (value) => {
  ;(value.storageObject as { workspaceId: string }).workspaceId =
    'workspace-cross-tenant'
})
reject(videoInput, (value) => {
  ;(value.storageObject as { checksumSha256: string }).checksumSha256 =
    sha('forged-bytes')
})
reject(videoInput, (value) => {
  ;(value.storageObject as { objectPath: string }).objectPath =
    'workspaces/workspace-lf-representative/other/source.webm'
})
reject(videoInput, (value) => {
  ;(value.mediaAsset as { mimeType: string }).mimeType = 'image/png'
})
reject(videoInput, (value) => {
  const selection = value.selection as {
    endFrameExclusive: number
    sourceDurationFrames: number
  }
  selection.endFrameExclusive = selection.sourceDurationFrames + 1
})
reject(videoInput, (value) => {
  const selection = value.selection as {
    contentAnalysisEvidenceRef: { refVersion: string }
  }
  selection.contentAnalysisEvidenceRef.refVersion =
    'caller-selected-analysis-v1'
})
reject(videoInput, (value) => {
  ;(value.evidenceReviews.publicityReviewRef as {
    refVersion: string
  }).refVersion = 'publicity-review-pending-v1'
})
reject(stillInput, (value) => {
  const selection = value.selection as {
    cropXBp: number
    cropWidthBp: number
  }
  selection.cropXBp = 5_000
  selection.cropWidthBp = 5_001
})
reject(stillInput, (value) => {
  ;(value.evidenceReviews.documentaryFactSafetyRef as {
    refVersion: string
  }).refVersion = 'documentary-fact-safety-pending-v1'
})
reject(dataInput, (value) => {
  const selection = value.selection as { rowRefIds: string[] }
  selection.rowRefIds = ['row-duplicate', 'row-duplicate']
})
reject(dataInput, (value) => {
  ;(value.evidenceReviews as {
    customerOrPublicUseAuthorized: boolean
  }).customerOrPublicUseAuthorized = true
})
reject(dataInput, (value) => {
  ;(value.canonicalBindings.confirmedFrameRef as {
    refVersion: string
  }).refVersion = 'caller-selected-frame-v1'
})
reject(dataInput, (value) => {
  ;(value.sourceCandidateSet as {
    candidateSetDigestSha256: string
  }).candidateSetDigestSha256 = sha('forged-candidate-set')
})
assert.equal(adversarialChecks, 13)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_private_source_binding',
  status: 'passed_source_only',
  contractVersion: bindings[0]!.contractVersion,
  sourceCandidateSetDigestSha256:
    bindings[0]!.sourceCandidateSetDigestSha256,
  compiledBindingCount: bindings.length,
  selectionKinds: bindings.map((binding) => binding.selection.selectionKind),
  exactPrivateUploadAuthoritySchemasConsumed: true,
  canonicalSourceAnalysisRefConsumedOpaque: true,
  rawStorageIdentitySerialized: false,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function inputFor(
  sourceCandidateId: LivingFrameRepresentativeMediaSourceCandidateId,
  selection: LivingFrameRepresentativePrivateSourceSelection,
): CompileLivingFrameRepresentativePrivateSourceBindingInput {
  const candidate = sourceCandidateSet.sources.find((entry) =>
    entry.sourceCandidateId === sourceCandidateId)!
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
    assetType: candidate.expectedContentType.startsWith('video/')
      ? 'video'
      : candidate.expectedContentType === 'application/json'
        ? 'structured-data'
        : 'image',
    fileName: `source-${suffix}`,
    mimeType: candidate.expectedContentType,
    storageProvider: 'local_private',
    storageBucket: 'private-upload-smoke',
    storagePath: objectPath,
    sizeBytes: 4_096 + candidate.order,
    checksumSha256,
    integrityVerified: true,
    checksumSource: 'server_computed_bytes',
    status: 'uploaded',
    createdAt: '2026-07-31T12:00:00.000Z',
    updatedAt: '2026-07-31T12:00:00.000Z',
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
    sourceCandidateId,
    authorityRevision: candidate.order + 1,
    authorityChecksumSha256: sha(`authority:${suffix}`),
    mediaAsset,
    storageObject,
    selection,
    evidenceReviews: reviews(),
    canonicalBindings: canonicalBindings(suffix),
  }
}

function reviews(): LivingFrameRepresentativePrivateSourceBindingDraft['evidenceReviews'] {
  return {
    licenseReviewRef: ref(
      'license-review-representative-source',
      'license-review-complete-v1',
    ),
    attributionReviewRef: ref(
      'attribution-review-representative-source',
      'attribution-review-complete-v1',
    ),
    publicityReviewRef: ref(
      'publicity-review-representative-source',
      'publicity-review-complete-v1',
    ),
    documentaryFactSafetyRef: ref(
      'fact-safety-review-representative-source',
      'documentary-fact-safety-reviewed-v1',
    ),
    allRequiredReviewsCompleted: true,
    customerOrPublicUseAuthorized: false,
  }
}

function canonicalBindings(
  suffix: string,
): LivingFrameRepresentativePrivateSourceBindingDraft['canonicalBindings'] {
  return {
    approvedSnapshotRef: ref(
      `snapshot-${suffix}`,
      'private-edit-authority-approved-snapshot-v3',
    ),
    selectedSceneRef: ref(
      `scene-${suffix}`,
      'canonical-living-frame-selected-scene-binding-v1',
    ),
    masterTimingRef: ref(
      `timing-${suffix}`,
      'master-timing-plan-v1',
    ),
    confirmedFrameRef: ref(
      `frame-${suffix}`,
      'confirmed-output-frame-v1',
    ),
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

function ref(refId: string, refVersion: string) {
  return {
    refId,
    refVersion,
    digestSha256: sha(`${refVersion}:${refId}`),
    canonicalRereadRequired: true as const,
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
