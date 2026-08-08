import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import type { CanonicalPictureLockManifest } from
  '../../src/types/canonical-picture-lock-manifest'
import type {
  CaptionDependencyObservation,
  CaptionFinishDependencyKind,
} from '../../src/types/caption-finish-readiness'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  createCanonicalPictureLockManifest,
} from '../edit-architecture/canonical-picture-lock-manifest'
import {
  createCaptionDependencyManifest,
  createCaptionFinishReadiness,
} from '../captions-specialist/caption-finish-readiness'
import {
  createCanonicalCaptionPostapprovalFinishRecord,
  createCanonicalCaptionPostapprovalFinishRepository,
  isCanonicalCaptionPostapprovalFinishReadPort,
  parseCanonicalCaptionPostapprovalFinishLookup,
  parseCanonicalCaptionPostapprovalFinishRecord,
} from '../services/canonical-caption-postapproval-finish-service'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
async function expectReject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
  assertions += 1
}
function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: digest(`${id}:${version}`) }
}

const scenes = ['scene.one', 'scene.two']
const snapshotRef = ref('snapshot.approved', 'private-approved-snapshot-v3')
const outputId = 'output.primary'

const pictureLock = createCanonicalPictureLockManifest({
  manifestId: 'picture.lock.caption.postapproval',
  canonicalScope: {
    ownerUserId: 'owner.fixture',
    workspaceId: 'workspace.fixture',
    projectId: 'project.fixture',
    editSessionId: 'edit.fixture',
    planVersionId: 'plan.fixture.v2',
    approvedSnapshotRef: snapshotRef,
  },
  confirmedOutputFrame: {
    outputId,
    width: 1_920,
    height: 1_080,
    aspectRatioNumerator: 16,
    aspectRatioDenominator: 9,
    fpsNumerator: 30,
    fpsDenominator: 1,
    totalFrames: 300,
    confirmedOutputFrameDigestSha256: digest('frame.1920x1080.30'),
  },
  timelineBindings: {
    timelineVersionRef: ref('lock.timeline'),
    sourceRangesRef: ref('lock.source.ranges'),
    shotOrderRef: ref('lock.shot.order'),
    shotDurationsRef: ref('lock.shot.durations'),
    speedChangesRef: ref('lock.speed.changes'),
    transitionsRef: ref('lock.transitions'),
    masterTimingRef: ref('lock.master.timing'),
  },
  compositionBindings: {
    cropReframeRef: ref('lock.crop.reframe'),
    brollLayoutRef: ref('lock.broll.layout'),
    livingFrameLayoutRef: ref('lock.living.frame.layout'),
    graphicsMapsChartsRef: ref('lock.graphics.maps.charts'),
    lowerThirdsRef: ref('lock.lower.thirds'),
    maskTrackingAnchorRef: ref('lock.mask.tracking.anchor'),
    occupancyRef: ref('lock.occupancy'),
    nearFinalVisualProxyRef: ref('lock.near.final.visual.proxy'),
    colorLookRef: ref('lock.color.look'),
    rendererPlanRef: ref('lock.renderer.plan'),
  },
  sourceAssetManifestRef: ref('lock.source.asset.manifest'),
  lockedSceneIds: scenes,
  lockState: 'locked',
  approvedExceptions: [],
  lockedAt: '2026-08-07T12:00:00.000Z',
  lockedByRef: ref('canonical.picture.lock.owner'),
  immutable: true,
  sharedEditArchitectureOwner: 'canonical_edit_picture_lock',
  captionOwnsPictureLock: false,
  rawChatIncluded: false,
  mediaBytesIncluded: false,
  privateArtifact: true,
  publicDeliveryAuthorityClaimed: false,
  productionAuthorityClaimed: false,
})

const dependencyKinds: CaptionFinishDependencyKind[] = [
  'approved_snapshot', 'picture_lock', 'confirmed_output_frame',
  'canonical_transcript', 'word_timing', 'timeline', 'source_ranges',
  'shot_order', 'shot_durations', 'speed_changes', 'crop_reframe',
  'broll_layout', 'living_frame_layout', 'graphics_maps_charts',
  'lower_thirds', 'occupancy', 'near_final_visual_proxy', 'mask', 'tracking',
  'object_anchor', 'transition', 'master_timing', 'story_timing',
  'font_registry', 'caption_style', 'color_proxy', 'sound_plan',
  'renderer_runtime', 'approval_envelope', 'qa_policy',
  'source_asset_manifest', 'reservation_honored',
]

function lockedRefFor(
  lock: CanonicalPictureLockManifest,
  kind: CaptionFinishDependencyKind,
): CaptionDomainRef {
  const map: Partial<Record<CaptionFinishDependencyKind, CaptionDomainRef>> = {
    approved_snapshot: lock.canonicalScope.approvedSnapshotRef,
    picture_lock: {
      id: lock.manifestId,
      version: lock.schemaVersion,
      contentHash: lock.manifestDigestSha256,
    },
    confirmed_output_frame: {
      id: lock.confirmedOutputFrame.outputId,
      version: 'canonical-confirmed-output-frame-v1',
      contentHash: lock.confirmedOutputFrame.confirmedOutputFrameDigestSha256,
    },
    timeline: lock.timelineBindings.timelineVersionRef,
    source_ranges: lock.timelineBindings.sourceRangesRef,
    shot_order: lock.timelineBindings.shotOrderRef,
    shot_durations: lock.timelineBindings.shotDurationsRef,
    speed_changes: lock.timelineBindings.speedChangesRef,
    crop_reframe: lock.compositionBindings.cropReframeRef,
    broll_layout: lock.compositionBindings.brollLayoutRef,
    living_frame_layout: lock.compositionBindings.livingFrameLayoutRef,
    graphics_maps_charts: lock.compositionBindings.graphicsMapsChartsRef,
    lower_thirds: lock.compositionBindings.lowerThirdsRef,
    occupancy: lock.compositionBindings.occupancyRef,
    near_final_visual_proxy: lock.compositionBindings.nearFinalVisualProxyRef,
    mask: lock.compositionBindings.maskTrackingAnchorRef,
    tracking: lock.compositionBindings.maskTrackingAnchorRef,
    object_anchor: lock.compositionBindings.maskTrackingAnchorRef,
    transition: lock.timelineBindings.transitionsRef,
    master_timing: lock.timelineBindings.masterTimingRef,
    color_proxy: lock.compositionBindings.colorLookRef,
    source_asset_manifest: lock.sourceAssetManifestRef,
  }
  return map[kind] ?? ref(`lock.caption.${kind}`)
}

function observations(): CaptionDependencyObservation[] {
  const values: CaptionDependencyObservation[] = []
  for (const dependencyKind of dependencyKinds) {
    const lockedRef = lockedRefFor(pictureLock, dependencyKind)
    if (dependencyKind === 'word_timing') {
      values.push({
        dependencyId: 'dependency.word_timing.scene.one',
        dependencyKind,
        ownerKey: 'owner.word_timing',
        requiredForSceneIds: ['scene.one'],
        requirement: 'required' as const,
        lockedRef,
        currentRef: lockedRef,
        approvedExceptionRef: null,
        fallbackAuthorizationRef: null,
        selectedFallbackId: null,
      }, {
        dependencyId: 'dependency.word_timing.scene.two',
        dependencyKind,
        ownerKey: 'owner.word_timing',
        requiredForSceneIds: ['scene.two'],
        requirement: 'required' as const,
        lockedRef,
        currentRef: null,
        approvedExceptionRef: null,
        fallbackAuthorizationRef: null,
        selectedFallbackId: null,
      })
      continue
    }
    values.push({
      dependencyId: `dependency.${dependencyKind}`,
      dependencyKind,
      ownerKey: `owner.${dependencyKind}`,
      requiredForSceneIds: scenes,
      requirement: 'required' as const,
      lockedRef,
      currentRef: lockedRef,
      approvedExceptionRef: null,
      fallbackAuthorizationRef: null,
      selectedFallbackId: null,
    })
  }
  return values
}

const scope = {
  ownerUserId: pictureLock.canonicalScope.ownerUserId,
  workspaceId: pictureLock.canonicalScope.workspaceId,
  projectId: pictureLock.canonicalScope.projectId,
  editSessionId: pictureLock.canonicalScope.editSessionId,
  planVersionId: pictureLock.canonicalScope.planVersionId,
  approvedSnapshotRef: snapshotRef,
  outputId,
  sceneId: null,
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 300 }],
}
const earlyPlanningBundleRef = ref(
  'caption.early-planning.bundle', 'caption-early-planning-bundle-v1')
const dependencyManifest = createCaptionDependencyManifest({
  manifestId: 'caption.dependencies.postapproval',
  canonicalScope: scope,
  pictureLock,
  earlyPlanningBundleRef,
  sceneIds: scenes,
  observations: observations(),
})
const finishReadiness = createCaptionFinishReadiness({
  readinessId: 'caption.finish.postapproval',
  dependencyManifest,
  pictureLock,
})
check(finishReadiness.readySceneIds.join('|') === 'scene.one'
  && finishReadiness.blockedSceneIds.join('|') === 'scene.two'
  && !finishReadiness.lateCaptionResolutionAllowed,
'The aggregate fixture must retain one ready and one independently blocked scene.')

const lookup = {
  canonicalScope: {
    ...scope,
    sceneId: 'scene.one',
    authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 150 }],
  },
  executionPackageRef: ref(
    'package.caption.approved', 'canonical-approved-edit-execution-package-v5'),
  captionPlanningProjectionRef: ref(
    'caption.planning.projection',
    'canonical-caption-specialist-planning-projection-v3'),
}
const record = createCanonicalCaptionPostapprovalFinishRecord({
  lookup,
  pictureLock,
  dependencyManifest,
  finishReadiness,
})
check(record.binding.sceneDisposition === 'ready'
  && record.binding.unrelatedBlockedScenesDoNotBlockThisScene
  && !record.binding.finalRenderAuthorityGrantedToCaption,
'One ready scene must be admitted without overclaiming the blocked peer scene or render authority.')

const objects = new Map<string, Buffer>()
const objectPort: CanonicalCreateOnlyJsonObjectPort = {
  async createOnly({ objectPath, body }) {
    if (objects.has(objectPath)) return 'already_exists'
    objects.set(objectPath, Buffer.from(body))
    return 'created'
  },
  async readExact(objectPath) {
    const body = objects.get(objectPath)
    return body ? Buffer.from(body) : null
  },
}
const repository = createCanonicalCaptionPostapprovalFinishRepository({
  objectPort,
  prefix: 'private-internal/caption-postapproval-smoke/v1',
})
check(isCanonicalCaptionPostapprovalFinishReadPort(repository.readPort),
  'Only the repository factory may mint an admitted finish-read port.')
check(!isCanonicalCaptionPostapprovalFinishReadPort({
  schemaVersion: 'canonical-caption-postapproval-finish-read-port-v1',
  sourceAuthority: 'canonical_caption_postapproval_finish_repository',
  callerSuppliedEvidenceAccepted: false,
  readExact: async () => record,
}), 'A structurally similar caller-supplied reader must remain inadmissible.')
check(await repository.persistCreateOnly({ record }) === 'created',
  'The exact postapproval record must persist create-only.')
check(await repository.persistCreateOnly({ record }) === 'identical_replay',
  'The exact postapproval record must replay byte-identically.')
const reread = await repository.readPort.readExact(lookup)
check(reread?.recordDigestSha256 === record.recordDigestSha256,
  'The exact postapproval record must reread by immutable scope and package.')

const inheritedLookup = Object.create(lookup) as unknown
expectThrow(() => parseCanonicalCaptionPostapprovalFinishLookup(
  inheritedLookup))
const accessorLookup = structuredClone(lookup) as unknown as
  Record<string, unknown>
Object.defineProperty(accessorLookup, 'executionPackageRef', {
  enumerable: true,
  get: () => lookup.executionPackageRef,
})
expectThrow(() => parseCanonicalCaptionPostapprovalFinishLookup(accessorLookup))

const crossedPackageLookup = structuredClone(lookup)
crossedPackageLookup.executionPackageRef = ref(
  'package.caption.crossed', 'canonical-approved-edit-execution-package-v5')
check(await repository.readPort.readExact(crossedPackageLookup) === null,
  'A crossed execution package must not reuse another finish record.')

const blockedSceneLookup = structuredClone(lookup)
blockedSceneLookup.canonicalScope.sceneId = 'scene.two'
blockedSceneLookup.canonicalScope.authorizedFrameRanges = [{
  startFrame: 150,
  endFrameExclusive: 300,
}]
expectThrow(() => createCanonicalCaptionPostapprovalFinishRecord({
  lookup: blockedSceneLookup,
  pictureLock,
  dependencyManifest,
  finishReadiness,
}))

const authorityOverclaim = structuredClone(record) as unknown as
  Record<string, unknown> & {
    binding: { productionAuthorityGrantedToCaption: boolean }
  }
authorityOverclaim.binding.productionAuthorityGrantedToCaption = true
expectThrow(() => parseCanonicalCaptionPostapprovalFinishRecord(
  authorityOverclaim))

const inherited = Object.create(record) as unknown
expectThrow(() => parseCanonicalCaptionPostapprovalFinishRecord(inherited))
const accessor = structuredClone(record) as unknown as Record<string, unknown>
Object.defineProperty(accessor, 'pictureLock', {
  enumerable: true,
  get: () => record.pictureLock,
})
expectThrow(() => parseCanonicalCaptionPostapprovalFinishRecord(accessor))

const changedObservations = observations()
const styleIndex = changedObservations.findIndex((item) =>
  item.dependencyKind === 'caption_style')
const style = changedObservations[styleIndex]!
changedObservations.splice(styleIndex, 1, {
  ...style,
  dependencyId: 'dependency.caption_style.scene.one',
  requiredForSceneIds: ['scene.one'],
}, {
  ...style,
  dependencyId: 'dependency.caption_style.scene.two.fallback',
  requiredForSceneIds: ['scene.two'],
  currentRef: null,
  fallbackAuthorizationRef: ref('approval.caption_style.scene.two.fallback'),
  selectedFallbackId: 'fallback.caption_style.stable',
})
const changedManifest = createCaptionDependencyManifest({
  manifestId: 'caption.dependencies.postapproval.changed',
  canonicalScope: scope,
  pictureLock,
  earlyPlanningBundleRef,
  sceneIds: scenes,
  observations: changedObservations,
})
const changedReadiness = createCaptionFinishReadiness({
  readinessId: 'caption.finish.postapproval.changed',
  dependencyManifest: changedManifest,
  pictureLock,
})
const changedRecord = createCanonicalCaptionPostapprovalFinishRecord({
  lookup,
  pictureLock,
  dependencyManifest: changedManifest,
  finishReadiness: changedReadiness,
})
await expectReject(() => repository.persistCreateOnly({
  record: changedRecord,
}))

console.log(JSON.stringify({
  smoke: 'canonical_caption_postapproval_finish_service',
  assertions,
  readySceneId: record.binding.canonicalScope.sceneId,
  independentlyBlockedSceneIds: finishReadiness.blockedSceneIds,
  aggregateLateResolutionAllowed: finishReadiness.lateCaptionResolutionAllowed,
  exactCreateOnlyReread: true,
  callerSuppliedEvidenceAccepted: false,
  pictureLockOwnedByCaption: false,
  finalRenderAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
}, null, 2))
