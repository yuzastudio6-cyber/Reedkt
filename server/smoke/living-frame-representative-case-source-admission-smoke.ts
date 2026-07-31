import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativePrivateSourceSelection,
} from '../../src/types/living-frame-representative-private-source-binding'
import type {
  LivingFrameRepresentativeMediaSourceCandidate,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  PrivateMediaAssetAuthorityRecord,
  PrivateStorageObjectAuthorityRecord,
} from '../validation/private-upload-media-authority-schemas'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  compileLivingFrameRepresentativeVisualFixtureManifest,
} from '../living-frame/living-frame-representative-visual-fixture'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
} from '../living-frame/living-frame-representative-media-source-candidates'
import {
  compileLivingFrameRepresentativePrivateSourceBinding,
  type CompileLivingFrameRepresentativePrivateSourceBindingInput,
} from '../living-frame/living-frame-representative-private-source-binding'
import {
  compileLivingFrameRepresentativeCaseSourceAdmission,
  type CompileLivingFrameRepresentativeCaseSourceAdmissionInput,
  type LivingFrameRepresentativeCasePrivateBindingInput,
  verifyLivingFrameRepresentativeCaseSourceAdmission,
} from '../living-frame/living-frame-representative-case-source-admission'

const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
const representativeVisualFixture =
  compileLivingFrameRepresentativeVisualFixtureManifest(ownerScopeAmendment)
const sourceCandidateSet =
  compileLivingFrameRepresentativeMediaSourceCandidateSet()

const inputs = LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map(
  (caseId, caseOrder): CompileLivingFrameRepresentativeCaseSourceAdmissionInput => {
    const candidateIds =
      sourceCandidateSet.caseBindings[caseOrder]!.requiredSourceCandidateIds
    return {
      ownerScopeAmendment,
      representativeVisualFixture,
      sourceCandidateSet,
      caseId,
      privateBindings: candidateIds.map((sourceCandidateId) =>
        privateBinding(caseId, sourceCandidateId)),
    }
  },
)

const admissions = inputs.map((input, order) => {
  const admission =
    compileLivingFrameRepresentativeCaseSourceAdmission(input)
  assert.equal(
    verifyLivingFrameRepresentativeCaseSourceAdmission(admission, input),
    true,
  )
  assert.equal(Object.isFrozen(admission), true)
  assert.equal(admission.caseOrder, order)
  assert.equal(admission.caseId, LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order])
  assert.deepEqual(
    admission.assignments.map((entry) => entry.sourceCandidateId),
    admission.requiredSourceCandidateIds,
  )
  assert.equal(admission.exactRequiredCandidateSetBound, true)
  assert.equal(admission.missingOrExtraSourceBindingAccepted, false)
  assert.equal(admission.crossCaseSourceBindingAccepted, false)
  assert.equal(
    admission.crossSnapshotSceneTimingOrFrameBindingAccepted,
    false,
  )
  assert.equal(admission.duplicateWorkOrManifestEntryAccepted, false)
  assert.equal(admission.canonicalConsumptionPending, true)
  assert.equal(admission.runtimeExecuted, false)
  assert.equal(admission.productionReady, false)
  return admission
})

assert.equal(admissions.length, 12)
assert.deepEqual(
  admissions.map((entry) => entry.assignments.length),
  sourceCandidateSet.caseBindings.map(
    (entry) => entry.requiredSourceCandidateIds.length,
  ),
)
assert.deepEqual(
  admissions[1]!.sourceDerivedAssetRolesCovered,
  ['approved_static_illustration'],
)
assert.deepEqual(
  admissions[6]!.sourceDerivedAssetRolesCovered,
  ['approved_map_source', 'approved_data_source'],
)
assert.deepEqual(
  admissions[11]!.sourceDerivedAssetRolesCovered,
  [],
)
assert.deepEqual(
  admissions[11]!.nonSourceDependencyRoles,
  [
    'approved_remotion_final_artifact',
    'approved_caption_projection',
    'approved_soundsync_mix',
  ],
)

let adversarialChecks = 0
const reject = (candidate: CompileLivingFrameRepresentativeCaseSourceAdmissionInput) => {
  assert.throws(() =>
    compileLivingFrameRepresentativeCaseSourceAdmission(candidate))
  adversarialChecks += 1
}
const mapCase = inputs[6]!
reject({ ...mapCase, privateBindings: mapCase.privateBindings.slice(1) })
reject({
  ...mapCase,
  privateBindings: [
    ...mapCase.privateBindings,
    inputs[0]!.privateBindings[0]!,
  ],
})
reject({ ...mapCase, privateBindings: [...mapCase.privateBindings].reverse() })
reject({
  ...mapCase,
  privateBindings: [
    mapCase.privateBindings[0]!,
    mapCase.privateBindings[0]!,
    mapCase.privateBindings[2]!,
  ],
})
reject({
  ...mapCase,
  privateBindings: mapCase.privateBindings.map((entry, order) => order === 1
    ? privateBinding(
        mapCase.caseId,
        entry.binding.sourceCandidateId,
        'cross-snapshot-lineage',
      )
    : entry),
})
const duplicateWorkBindings = [...mapCase.privateBindings]
const duplicateWorkInput = {
  ...duplicateWorkBindings[1]!.compileInput,
  canonicalBindings: {
    ...duplicateWorkBindings[1]!.compileInput.canonicalBindings,
    approvedWorkRef:
      duplicateWorkBindings[0]!.compileInput.canonicalBindings.approvedWorkRef,
  },
}
duplicateWorkBindings[1] = {
  compileInput: duplicateWorkInput,
  binding: compileLivingFrameRepresentativePrivateSourceBinding(
    duplicateWorkInput,
  ),
}
reject({ ...mapCase, privateBindings: duplicateWorkBindings })
reject({
  ...mapCase,
  privateBindings: mapCase.privateBindings.map((entry, order) => order === 0
    ? {
        binding: entry.binding,
        compileInput: mapCase.privateBindings[1]!.compileInput,
      }
    : entry),
})
reject({
  ...mapCase,
  representativeVisualFixture: {
    ...representativeVisualFixture,
    activeCaseCount: 11 as 12,
  },
})
reject({
  ...mapCase,
  sourceCandidateSet: {
    ...sourceCandidateSet,
    candidateSetDigestSha256: sha('forged-source-candidate-set'),
  },
})
assert.equal(
  verifyLivingFrameRepresentativeCaseSourceAdmission(
    { ...admissions[6], canonicalConsumptionPending: false },
    mapCase,
  ),
  false,
)
adversarialChecks += 1
assert.equal(adversarialChecks, 10)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_case_source_admission',
  status: 'passed_source_only',
  contractVersion: admissions[0]!.contractVersion,
  activeCaseCount: admissions.length,
  exactCandidateSetBoundForEveryCase: true,
  privateSourceBindingCount: admissions.reduce(
    (count, admission) => count + admission.assignments.length,
    0,
  ),
  missingExtraCrossCaseOrStaleLineageAccepted: false,
  sourceToCanonicalAssetRoleReconciliationPending: true,
  canonicalConsumptionPending: true,
  adversarialChecks,
  runtimeExecuted: false,
  productionReady: false,
})}\n`)

function privateBinding(
  caseId: typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[number],
  sourceCandidateId:
    LivingFrameRepresentativeMediaSourceCandidate['sourceCandidateId'],
  commonLineageSuffix = caseId,
): LivingFrameRepresentativeCasePrivateBindingInput {
  const candidate = sourceCandidateSet.sources.find((entry) =>
    entry.sourceCandidateId === sourceCandidateId)!
  const compileInput = privateBindingInput(
    caseId,
    commonLineageSuffix,
    candidate,
  )
  return {
    compileInput,
    binding: compileLivingFrameRepresentativePrivateSourceBinding(
      compileInput,
    ),
  }
}

function privateBindingInput(
  caseId: typeof LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[number],
  commonLineageSuffix: string,
  candidate: LivingFrameRepresentativeMediaSourceCandidate,
): CompileLivingFrameRepresentativePrivateSourceBindingInput {
  const suffix = `${caseId}-${candidate.order}`
  const uploadIntentId = `upload-${suffix}`
  const mediaAssetId = `media-${suffix}`
  const storageObjectRecordId = `storage-${suffix}`
  const checksumSha256 = sha(`bytes:${suffix}`)
  const storagePath = `workspaces/workspace-lf-cases/${suffix}/source`
  const mediaAsset: PrivateMediaAssetAuthorityRecord = {
    id: mediaAssetId,
    workspaceId: 'workspace-lf-representative-cases',
    projectId: 'project-lf-representative-cases',
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
    storageBucket: 'private-upload-case-smoke',
    storagePath,
    sizeBytes: 8_192 + candidate.order,
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
    objectPath: storagePath,
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
    sourceCandidateId: candidate.sourceCandidateId,
    authorityRevision: candidate.order + 1,
    authorityChecksumSha256: sha(`authority:${suffix}`),
    mediaAsset,
    storageObject,
    selection: selection(candidate, suffix),
    evidenceReviews: {
      licenseReviewRef: ref(`license-${suffix}`, 'license-review-complete-v1'),
      attributionReviewRef: ref(
        `attribution-${suffix}`,
        'attribution-review-complete-v1',
      ),
      publicityReviewRef: ref(
        `publicity-${suffix}`,
        'publicity-review-complete-v1',
      ),
      documentaryFactSafetyRef: ref(
        `fact-safety-${suffix}`,
        'documentary-fact-safety-reviewed-v1',
      ),
      allRequiredReviewsCompleted: true,
      customerOrPublicUseAuthorized: false,
    },
    canonicalBindings: {
      approvedSnapshotRef: ref(
        `snapshot-${commonLineageSuffix}`,
        'private-edit-authority-approved-snapshot-v3',
      ),
      selectedSceneRef: ref(
        `scene-${commonLineageSuffix}`,
        'canonical-living-frame-selected-scene-binding-v1',
      ),
      masterTimingRef: ref(
        `timing-${commonLineageSuffix}`,
        'master-timing-plan-v1',
      ),
      confirmedFrameRef: ref(
        `frame-${commonLineageSuffix}`,
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
    },
  }
}

function selection(
  candidate: LivingFrameRepresentativeMediaSourceCandidate,
  suffix: string,
): LivingFrameRepresentativePrivateSourceSelection {
  if (candidate.expectedContentType === 'video/webm') {
    return {
      selectionKind: 'video_segment',
      sourceSequenceItemId: `source-sequence-${suffix}`,
      rangeId: `range-${suffix}`,
      startFrame: 300,
      endFrameExclusive: 660,
      sourceDurationFrames: 3_600,
      fps: 30,
      evidenceIds: [`transcript-${suffix}`, `visual-${suffix}`],
      phraseBoundaryAligned: true,
      preservesSourceMeaning: true,
      userReviewRequired: false,
      contentAnalysisEvidenceRef: ref(
        `source-analysis-${suffix}`,
        'canonical-source-led-content-analysis-evidence-v1',
      ),
    }
  }
  if (candidate.expectedContentType === 'application/json') {
    return {
      selectionKind: 'structured_data_rows',
      sourceSnapshotRef: ref(
        `source-data-${suffix}`,
        'canonical-source-data-snapshot-v1',
      ),
      rowRefIds: [`row-primary-${suffix}`, `row-context-${suffix}`],
      citationSetDigestSha256: sha(`citations:${suffix}`),
      currentSourceRereadCompleted: true,
    }
  }
  return {
    selectionKind: 'still_crop',
    sourceWidthPixels: 4_110,
    sourceHeightPixels: 4_110,
    cropXBp: 500,
    cropYBp: 500,
    cropWidthBp: 9_000,
    cropHeightBp: 9_000,
    cropPreservesClaimContext: true,
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
