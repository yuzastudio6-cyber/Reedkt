import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalBrollCaptionPrivateVisualReviewReadPort,
} from '../services/canonical-broll-caption-owner-service'
import {
  createCanonicalCaptionBrollApprovedSnapshotReadPort,
} from '../services/canonical-caption-broll-support-service'
import {
  createCanonicalCaptionSoundSyncContextReadPort,
} from '../services/canonical-caption-soundsync-support-service'
import {
  createCanonicalCaptionSharedOwnerPrivateComposition,
  createCanonicalCaptionSharedOwnerPrivateCompositionV2,
} from '../services/canonical-caption-shared-owner-private-composition'
import {
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import {
  createCanonicalSoundCaptionExecutionReadPort,
  createCanonicalSoundCaptionListeningReviewReadPort,
} from '../services/canonical-sound-caption-owner-service'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly(input) {
    assert.equal(createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256)
    const prior = objects.get(input.objectPath)
    if (prior) {
      if (!prior.equals(input.body)) throw new Error('create-only collision')
      return 'already_exists'
    }
    objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  },
  async readExact(path) {
    const value = objects.get(path)
    return value ? Buffer.from(value) : null
  },
}
const supportResumeRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort,
    prefix: 'private/smoke/caption-owner-composition/resume',
  })
const soundContextReadPort =
  createCanonicalCaptionSoundSyncContextReadPort(async () => {
    throw new Error('Source-only mount smoke must not read Sound context.')
  })
const soundExecutionReadPort = createCanonicalSoundCaptionExecutionReadPort(
  async () => {
    throw new Error('Source-only mount smoke must not execute Sound.')
  })
const soundListeningReviewReadPort =
  createCanonicalSoundCaptionListeningReviewReadPort(async () => {
    throw new Error('Source-only mount smoke must not invent listening QA.')
  })
const brollApprovedSnapshotReadPort =
  createCanonicalCaptionBrollApprovedSnapshotReadPort(async () => {
    throw new Error('Source-only mount smoke must not read a snapshot.')
  })
const brollPrivateVisualReviewReadPort =
  createCanonicalBrollCaptionPrivateVisualReviewReadPort(async () => {
    throw new Error('Source-only mount smoke must not invent visual QA.')
  })
const neverArtifactStore = {
  storageClass: 'durable' as const,
  async putJson(): Promise<never> {
    throw new Error('Source-only mount smoke must not write B-roll artifacts.')
  },
  async readJson(): Promise<never> {
    throw new Error('Source-only mount smoke must not read B-roll artifacts.')
  },
}
const neverSoundResolver = {
  async resolve(): Promise<never> {
    throw new Error('Source-only mount smoke must not read Sound bytes.')
  },
  async privateOutputRoot(): Promise<never> {
    throw new Error('Source-only mount smoke must not resolve an output root.')
  },
}

const composition = createCanonicalCaptionSharedOwnerPrivateComposition({
  objectPort,
  supportResumeRepository,
  soundContextReadPort,
  soundExecutionReadPort,
  soundListeningReviewReadPort,
  soundArtifactResolver: neverSoundResolver,
  brollApprovedSnapshotReadPort,
  brollPrivateVisualReviewReadPort,
  brollArtifactStore: neverArtifactStore,
  prefix: 'private/smoke/caption-owner-composition',
})
check(composition.schemaVersion
  === 'canonical-caption-shared-owner-private-composition-v1',
'The private composition must expose one versioned mount.')
check(composition.soundOwner.schemaVersion
  === 'canonical-sound-caption-owner-service-v1'
  && composition.soundSupport.schemaVersion
    === 'canonical-caption-soundsync-support-service-v1',
'The existing Sound owner and Caption support bridge must be mounted together.')
check(composition.brollOwner.schemaVersion
  === 'canonical-broll-caption-owner-service-v1'
  && composition.brollSupport.schemaVersion
    === 'canonical-caption-broll-support-service-v1',
'The existing B-roll owner and Caption support bridge must be mounted together.')
check(composition.soundEvidenceRepository.schemaVersion
  === 'canonical-caption-soundsync-evidence-repository-v1'
  && composition.brollEvidenceRepository.schemaVersion
    === 'canonical-caption-broll-evidence-repository-v1',
'The same mounted owner-evidence repositories must be exposed for exact terminal reread.')
check(!composition.soundExecutionOwnedByCaption
  && !composition.brollSelectionOwnedByCaption
  && !composition.directPeerDispatchMounted,
'The composition must not move Sound or B-roll ownership into Caption.')
check(!composition.providerAuthorityGranted
  && !composition.runtimeAuthorityGrantedToCaption
  && !composition.assetMutationAuthorityGrantedToCaption
  && !composition.finalQaApprovalAuthorityGrantedToCaption
  && !composition.billingAuthorityGrantedToCaption
  && !composition.publicDeliveryAuthorityGranted
  && !composition.productionAuthorityGranted,
'The source mount must grant no external authority.')

const compositionV2 = createCanonicalCaptionSharedOwnerPrivateCompositionV2({
  objectPort,
  supportResumeRepository,
  soundContextReadPort,
  soundExecutionReadPort,
  soundListeningReviewReadPort,
  soundArtifactResolver: neverSoundResolver,
  brollApprovedSnapshotReadPort,
  brollPrivateVisualReviewReadPort,
  brollArtifactStore: neverArtifactStore,
  prefix: 'private/smoke/caption-owner-composition-v2',
})
check(compositionV2.schemaVersion
  === 'canonical-caption-shared-owner-private-composition-v2'
  && compositionV2.brollOwner.schemaVersion
    === 'canonical-broll-caption-owner-service-v2',
'The V2 owner composition must mount the additive B-roll source authority.')
check(compositionV2.brollInspectionSourceAuthorityReadPort
  === compositionV2.brollOwner.inspectionSourceAuthorityReadPort
  && compositionV2.brollInspectionSourceAuthorityReadPort.sourceAuthority
    === 'canonical_b_roll_owner_private_inspection_source',
'Caption must receive only the exact owner-issued B-roll inspection reader.')
check(compositionV2.brollSelectedArtifactInspectionAuthorityMounted
  && compositionV2.brollOwner
    .selectedNormalizedArtifactAuthorityPersistedBeforeOwnerResult,
'The selected normalized artifact authority must precede owner-result visibility.')
check(!compositionV2.brollSelectionOwnedByCaption
  && !compositionV2.runtimeAuthorityGrantedToCaption
  && !compositionV2.finalQaApprovalAuthorityGrantedToCaption,
'The stronger inspection mount must preserve closed Caption authority.')

assert.throws(() => createCanonicalCaptionSharedOwnerPrivateComposition({
  objectPort,
  supportResumeRepository,
  soundContextReadPort,
  soundExecutionReadPort: {
    ...soundExecutionReadPort,
    readExact: soundExecutionReadPort.readExact,
  },
  soundListeningReviewReadPort,
  soundArtifactResolver: neverSoundResolver,
  brollApprovedSnapshotReadPort,
  brollPrivateVisualReviewReadPort,
  brollArtifactStore: neverArtifactStore,
}))
checks += 1
assert.throws(() => createCanonicalCaptionSharedOwnerPrivateComposition({
  objectPort,
  supportResumeRepository,
  soundContextReadPort,
  soundExecutionReadPort,
  soundListeningReviewReadPort,
  soundArtifactResolver: neverSoundResolver,
  brollApprovedSnapshotReadPort: {
    ...brollApprovedSnapshotReadPort,
    readExact: brollApprovedSnapshotReadPort.readExact,
  },
  brollPrivateVisualReviewReadPort,
  brollArtifactStore: neverArtifactStore,
}))
checks += 1
assert.throws(() => createCanonicalCaptionSharedOwnerPrivateComposition({
  objectPort,
  supportResumeRepository,
  soundContextReadPort,
  soundExecutionReadPort,
  soundListeningReviewReadPort,
  soundArtifactResolver: neverSoundResolver,
  brollApprovedSnapshotReadPort,
  brollPrivateVisualReviewReadPort: {
    ...brollPrivateVisualReviewReadPort,
    readExact: brollPrivateVisualReviewReadPort.readExact,
  },
  brollArtifactStore: neverArtifactStore,
}))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-shared-owner-private-composition',
  status: 'passed',
  checks,
  soundOwnerMounted: true,
  brollOwnerMounted: true,
  brollSelectedArtifactInspectionAuthorityMounted: true,
  actualPrivateEvidenceConsumed: false,
  sourceOnly: true,
  directPeerDispatchMounted: false,
  runtimeAuthorityGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
